import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import acceptance from '../../docs/specs/2026-10-12-loyer-mer/acceptance.json';
import immobilier from '../../docs/specs/2026-10-14-immobilier/acceptance.json';
import cadreDeVie from '../../docs/specs/2026-10-14-cadre-de-vie/acceptance.json';
import { PRIX_DEPART } from './prix';
import { communeDeLigne, evaluer, palier, REGLAGES_DEPART, tailleDe, type Commune, type LigneCommunes, type Reglages } from './score';

// Fixture « 5 communes » d'acceptance.json, au format du domaine.
const fixture: Commune[] = acceptance.fixture.items.map((it) => ({
  code: it.code_insee,
  nom: it.nom,
  dep: it.dep,
  population: it.population,
  loyerM2: it.loyer_m2,
  estimationPropre: it.estimation_propre,
  merKm: it.mer_km,
}));
const code = Object.fromEntries(acceptance.fixture.items.map((it) => [it.id, it.code_insee])) as Record<'A' | 'B' | 'C' | 'D' | 'E', string>;

function scores(r: Reglages) {
  const res = evaluer(fixture, r);
  const by = (id: keyof typeof code) => res.parCode.get(code[id])!;
  return { res, by };
}

describe('R1, R2, R3 — passage, score et palier', () => {
  it('AC-1 réglages de départ (R32 de cadre-de-vie : mer sur Peu importe) : D 65 (palier 60–80), A 46 (40–60), B 31 (20–40), E 9 (0–20) ; C ne passe pas', () => {
    const { by } = scores(REGLAGES_DEPART);
    expect(REGLAGES_DEPART).toEqual({ loyer: 1200, mer: null, tailles: [] });
    expect([by('D').score, by('A').score, by('B').score, by('E').score]).toEqual([65, 46, 31, 9]);
    expect([by('D').palier, by('A').palier, by('B').palier, by('E').palier]).toEqual([4, 3, 2, 1]);
    expect(by('C').passe).toBe(false);
    expect(by('C').score).toBeNull();
  });

  it('AC-2 mer « Peu importe » : D 65, A 46, B 31, E 9 ; seule C ne passe pas', () => {
    const { by } = scores({ loyer: 1200, mer: null, tailles: [] });
    expect([by('D').score, by('A').score, by('B').score, by('E').score]).toEqual([65, 46, 31, 9]);
    expect(['A', 'B', 'C', 'D', 'E'].filter((id) => !by(id as keyof typeof code).passe)).toEqual(['C']);
  });

  it('AC-3 loyer 650 €, mer 50 km : A passe avec 49 (650 € affiché, égal au plafond) ; B, C, D et E ne passent pas', () => {
    const { by } = scores({ loyer: 650, mer: 50, tailles: [] });
    expect(by('A').passe).toBe(true);
    expect(by('A').score).toBe(49);
    expect((['B', 'C', 'D', 'E'] as const).map((id) => by(id).passe)).toEqual([false, false, false, false]);
  });

  it('palier : [0, 20) → 1 … [80, 100] → 5', () => {
    expect([0, 19, 20, 39, 40, 59, 60, 79, 80, 100].map(palier)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });

  it('distance sous 1 km comparée comme 1 km (cas limite) : plafond 5 km, A (0,9 km) passe', () => {
    const { by } = scores({ loyer: null, mer: 5, tailles: [] });
    expect(by('A').passe).toBe(true);
    expect(by('A').score).toBe(80); // 100 × (1 − 1 / 5)
  });

  // Cadre-de-vie, règle (1) du recalage : réglage explicite, mer 50 km (le départ n'a plus de mer).
  const mer50: Reglages = { loyer: 1200, mer: 50, tailles: [] };

  it('raisons par critère non tenu : Montcher au-dessus des deux plafonds', () => {
    const { by } = scores(mer50);
    expect(by('C').raisons).toEqual([
      { critere: 'loyer', valeur: 1560, plafond: 1200 },
      { critere: 'mer', valeur: 148, plafond: 50 },
    ]);
  });

  it('classement : communes qui passent, score affiché décroissant, puis loyer croissant, puis nom', () => {
    const { res } = scores(mer50);
    expect(res.classement.map((c) => c.commune.nom)).toEqual(['Portmer', 'Quaibleu', 'Grandeville']);
    expect(res.classement.map((c) => c.rang)).toEqual([1, 2, 3]);
    expect(res.actif).toBe(true);
  });

  it('sans aucun plafond : aucune commune notée, page « sans plafond »', () => {
    const { res, by } = scores({ loyer: null, mer: null, tailles: [] });
    expect(res.actif).toBe(false);
    expect(by('A').score).toBeNull();
    expect(res.classement).toEqual([]);
  });
});

describe('D11 — taille de ville', () => {
  it('seuils : la population exactement sur un seuil prend la taille du dessus', () => {
    expect([9999, 10000, 49999, 50000, 199999, 200000].map(tailleDe)).toEqual([
      'petite-commune', 'petite-ville', 'petite-ville', 'ville-moyenne', 'ville-moyenne', 'grande-ville',
    ]);
    expect(tailleDe(null)).toBeNull();
  });

  it('AC-10 (règle) : mer 50 km, « 10 000 – 50 000 hab. » cochée, seule A passe (72) ; Grandeville a la raison de taille', () => {
    const { res, by } = scores({ loyer: 1200, mer: 50, tailles: ['petite-ville'] });
    expect(res.classement.map((e) => [e.commune.nom, e.score])).toEqual([['Portmer', 72]]);
    expect(by('B').raisons).toEqual([{ critere: 'taille', taille: 'grande-ville', population: 260000 }]);
  });

  it('AC-14 (règle) : départ, 10 000 – 50 000 et 50 000 – 200 000 hab. → Portmer 46, Quaibleu 9', () => {
    const { res } = scores({ ...REGLAGES_DEPART, tailles: ['petite-ville', 'ville-moyenne'] });
    expect(res.classement.map((e) => [e.commune.nom, e.score])).toEqual([['Portmer', 46], ['Quaibleu', 9]]);
  });

  it('sans plafond : les communes de la bonne taille passent, sans score', () => {
    const { res, by } = scores({ loyer: null, mer: null, tailles: ['petite-commune'] });
    expect(res.actif).toBe(false);
    expect(by('D').passe).toBe(true);
    expect(by('D').score).toBeNull();
    expect(by('A').passe).toBe(false);
  });

  it('taille inconnue : ne passe pas quand une taille est cochée, avec cette raison', () => {
    const sans: Commune = { ...fixture[0], code: '99999', population: null };
    const res = evaluer([sans], { loyer: null, mer: null, tailles: ['petite-ville'] });
    expect(res.parCode.get('99999')!.raisons).toEqual([{ critere: 'taille-inconnue' }]);
  });
});

describe('R25, H4 étendue — prix inconnu (spec immobilier, D21 de loyer-mer)', () => {
  const sansLoyer: Commune = { ...fixture[0], code: '99901', nom: 'Sansloyer', loyerM2: null };

  it('un prix inconnu ne fait pas échouer le critère du prix et ne donne pas de note : le score vient de la mer', () => {
    const e = evaluer([sansLoyer], { loyer: 1200, mer: 60, tailles: [] }).parCode.get('99901')!;
    expect(e).toMatchObject({ passe: true, sansNote: false, score: 98, raisons: [] }); // 100 × (1 − 1 / 60)
  });

  it('commune qui passe sans aucune note : « sans note », ni score, ni rang, hors du compte et du classement', () => {
    const res = evaluer([...fixture, sansLoyer], { loyer: 1200, mer: null, tailles: [] });
    expect(res.parCode.get('99901')).toMatchObject({ passe: true, sansNote: true, score: null, palier: null, rang: null });
    expect(res.classement.map((e) => e.commune.nom)).toEqual(['Terrebasse', 'Portmer', 'Grandeville', 'Quaibleu']);
    expect([...res.parCode.values()].filter((e) => e.sansNote).map((e) => e.commune.nom)).toEqual(['Sansloyer']);
  });

  it('les communes notées ne sont jamais « sans note » ; sans plafond non plus (page « sans plafond »)', () => {
    const res = evaluer(fixture, REGLAGES_DEPART);
    expect([...res.parCode.values()].some((e) => e.sansNote)).toBe(false);
    const sans = evaluer([sansLoyer], { loyer: null, mer: null, tailles: [] }).parCode.get('99901')!;
    expect(sans).toMatchObject({ passe: true, sansNote: false, score: null });
  });

  it('décision de Vincent (2026-10-14) : une commune sans prix vient après toutes celles qui ont un prix, même à 98 contre 83 ; score et couleur inchangés', () => {
    const avecPrix = { ...fixture[0], code: '1', nom: 'Avecprix', merKm: 7, loyerM2: 5 }; // (100 × (1 − 260 / 1 200) + 88,3) / 2 = 83
    const sansPrix = { ...fixture[0], code: '2', nom: 'Sansprix', merKm: 0.9, loyerM2: null }; // mer seule : 98
    const terre = { ...fixture[0], code: '3', nom: 'Terre', merKm: 50, loyerM2: null }; // mer seule : 17
    const res = evaluer([terre, sansPrix, avecPrix], { loyer: 1200, mer: 60, tailles: [] });
    expect(res.classement.map((e) => [e.commune.nom, e.score, e.palier, e.rang])).toEqual([
      ['Avecprix', 83, 5, 1],
      ['Sansprix', 98, 5, 2],
      ['Terre', 17, 1, 3],
    ]);
  });

  it('à score affiché égal : prix affiché croissant, prix inconnu en dernier, puis nom', () => {
    const a = { ...fixture[0], merKm: 7 }; // mêmes notes de mer, pas de plafond de prix : scores égaux
    const communes: Commune[] = [
      { ...a, code: '1', nom: 'Aval', loyerM2: null },
      { ...a, code: '2', nom: 'Zénith', loyerM2: 20 },
      { ...a, code: '3', nom: 'Moulin', loyerM2: 10 },
      { ...a, code: '4', nom: 'Bourg', loyerM2: null },
    ];
    const res = evaluer(communes, { loyer: null, mer: 60, tailles: [] });
    expect(res.classement.map((e) => [e.commune.nom, e.score])).toEqual([['Moulin', 88], ['Zénith', 88], ['Aval', 88], ['Bourg', 88]]);
  });
});

// Tranche cadre-de-vie, H74 : la moyenne exacte des notes, arrondie moitié vers le haut, sans perte en virgule flottante.
// Les quatre moitiés de recalage.md (critères recalés à mer 50 km).
describe('H74 — moitié exacte arrondie vers le haut (recalage.md)', () => {
  const mer50 = (loyer: number): Reglages => ({ loyer, mer: 50, tailles: [] });
  const portmer: Commune = { ...fixture[0], loyerM2Maison: immobilier.fixture.items[0].loyer_m2_maison }; // 10,5 €/m² en maison

  it('Quaibleu à 1 200 € et 50 km : (9 + 86) / 2 = 47,5 → 48', () => {
    expect(scores(mer50(1200)).by('E').score).toBe(48);
  });

  it('Portmer en 72 m² : 900 €, (25 + 98) / 2 = 61,5 → 62', () => {
    const e = evaluer([portmer], mer50(1200), [], { ...PRIX_DEPART, surface: 72 }).parCode.get(portmer.code)!;
    expect([e.valeurPrix, e.score]).toEqual([900, 62]);
  });

  it('Portmer en maison 72 m² : 756 €, (37 + 98) / 2 = 67,5 → 68', () => {
    const e = evaluer([portmer], mer50(1200), [], { ...PRIX_DEPART, bien: 'maison', surface: 72 }).parCode.get(portmer.code)!;
    expect([e.valeurPrix, e.score]).toEqual([756, 68]);
  });

  it('Portmer à 1 000 € : (35 + 98) / 2 = 66,5 → 67', () => {
    expect(scores(mer50(1000)).by('A').score).toBe(67);
  });
});

// Tranche cadre-de-vie, tâche 2 : chaque commune porte son type d'environnement et sa distance à la montagne (D10, R29).
describe('communes.json — type d’environnement et distance à la montagne lus avec chaque commune', () => {
  const fichier = JSON.parse(readFileSync(new URL('../../public/data/communes.json', import.meta.url), 'utf8')) as {
    champs: string[];
    communes: LigneCommunes[];
  };
  const parCode = new Map(fichier.communes.map((l) => [l[0], communeDeLigne(l)]));

  it('les deux colonnes lues sont `type_env` et `montagne_km`, à la suite des 9 de loyer-mer et d’immobilier', () => {
    expect(fichier.champs.slice(9)).toEqual(['type_env', 'montagne_km']);
  });

  it('vraies données : Bordeaux ville dense à 172,8 km ; Chamonix-Mont-Blanc commune de montagne (0) ; Lacanau bourg et village', () => {
    expect(parCode.get('33063')).toMatchObject({ nom: 'Bordeaux', loyerM2: 15.9932, typeEnv: 'ville-dense', montagneKm: 172.8 });
    expect(parCode.get('74056')).toMatchObject({ nom: 'Chamonix-Mont-Blanc', typeEnv: 'ville-et-peripherie', montagneKm: 0 });
    expect(parCode.get('33214')).toMatchObject({ nom: 'Lacanau', typeEnv: 'bourg-et-village' });
  });

  it('une ligne sans ces colonnes (jeu ancien) : type et distance inconnus (null)', () => {
    const c = communeDeLigne(['99001', 'Portmer', '17', 23000, 12.5, false, 0.9, null, null]);
    expect(c).toMatchObject({ code: '99001', merKm: 0.9, typeEnv: null, montagneKm: null });
  });
});

// Tranche cadre-de-vie, tâche 4 : la montagne filtre et note comme la mer (R29), sur la fixture « 6 communes » de la
// tranche (montagne A 140, B 49,6, C 280, D 0 = commune de montagne, E 62, F 0,6 ; loyers au départ A 650, B 832, C 1 560,
// D 416, E 1 092, F 572).
describe('R29 — la montagne (spec cadre-de-vie)', () => {
  const six: Commune[] = cadreDeVie.fixture.items.map((it) => ({
    code: it.code_insee,
    nom: it.nom,
    dep: it.dep,
    population: it.population,
    loyerM2: it.loyer_m2,
    estimationPropre: it.estimation_propre,
    merKm: it.mer_km,
    typeEnv: it.type_env as Commune['typeEnv'],
    montagneKm: it.montagne_km,
  }));
  type Id6 = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  const code6 = Object.fromEntries(cadreDeVie.fixture.items.map((it) => [it.id, it.code_insee])) as Record<Id6, string>;
  const ev = (r: Reglages) => {
    const res = evaluer(six, r);
    return { res, by: (id: Id6) => res.parCode.get(code6[id])!, classement: res.classement.map((e) => [e.commune.nom, e.score]) };
  };

  it('AC-3 (calcul) montagne 10 km : Terrebasse 83 (commune de montagne : note 100), Rhinval 71 (0,6 km comparée comme 1) ; Quaibleu : montagne 62 au-dessus de 10', () => {
    const v = ev({ loyer: 1200, mer: null, montagne: 10, tailles: [] });
    expect(v.classement).toEqual([['Terrebasse', 83], ['Rhinval', 71]]);
    expect(v.by('E').raisons).toEqual([{ critere: 'montagne', valeur: 62, plafond: 10 }]);
  });

  it('AC-4 (calcul) montagne 50 km : Terrebasse 83, Rhinval 75, Grandeville 15 (49,6 affiché 50, égal au plafond : note 0) ; Portmer : 140 au-dessus de 50', () => {
    const v = ev({ loyer: 1200, mer: null, montagne: 50, tailles: [] });
    expect(v.classement).toEqual([['Terrebasse', 83], ['Rhinval', 75], ['Grandeville', 15]]);
    expect(v.by('A').raisons).toEqual([{ critere: 'montagne', valeur: 140, plafond: 50 }]);
  });

  it('AC-11 (calcul) loyer 1 200 €, mer 100, montagne 50 : seule Grandeville passe, (31 + 60 + 0) / 3 → 30', () => {
    const v = ev({ loyer: 1200, mer: 100, montagne: 50, tailles: [] });
    expect(v.classement).toEqual([['Grandeville', 30]]);
    expect(v.by('E').raisons).toEqual([{ critere: 'montagne', valeur: 62, plafond: 50 }]);
  });

  it('montagne sur Peu importe (absente ou null) : ni filtre ni note, comme au départ', () => {
    expect(ev({ loyer: 1200, mer: null, tailles: [] }).classement).toEqual(ev({ loyer: 1200, mer: null, montagne: null, tailles: [] }).classement);
    expect(ev({ loyer: 1200, mer: null, montagne: null, tailles: [] }).classement.map(([n]) => n)).toEqual(['Terrebasse', 'Rhinval', 'Portmer', 'Grandeville', 'Quaibleu']);
  });

  it('distance inconnue avec la montagne active : ne passe pas, raison « montagne-inconnue »', () => {
    const inconnue = { ...six[0], code: '99901', montagneKm: null };
    expect(evaluer([inconnue], { loyer: null, mer: null, montagne: 30, tailles: [] }).parCode.get('99901')).toMatchObject({
      passe: false,
      raisons: [{ critere: 'montagne-inconnue' }],
    });
  });

  it('H83 : raisons dans l’ordre prix, mer, montagne, taille', () => {
    const v = ev({ loyer: 1000, mer: 10, montagne: 10, tailles: ['petite-commune'] });
    expect(v.by('C').raisons.map((r) => r.critere)).toEqual(['loyer', 'mer', 'montagne', 'taille']);
  });

  it('sans plafond : prix sur Sans limite, mer et montagne sur Peu importe ; la montagne seule suffit à noter', () => {
    expect(ev({ loyer: null, mer: null, montagne: 50, tailles: [] }).res.actif).toBe(true);
    expect(ev({ loyer: null, mer: null, montagne: 50, tailles: [] }).classement).toEqual([['Terrebasse', 100], ['Rhinval', 98], ['Grandeville', 0]]);
    // Seule la montagne repasse à Peu importe : page « sans plafond », aucun score.
    const sans = ev({ loyer: null, mer: null, montagne: null, tailles: [] });
    expect(sans.res.actif).toBe(false);
    expect(sans.classement).toEqual([]);
    expect([...sans.res.parCode.values()].every((e) => e.passe && e.score == null && !e.sansNote)).toBe(true);
  });

  it('H74 : la moitié exacte avec la montagne n’est pas perdue en virgule flottante — 744 € à 800 € et 5 km à 10 km : (7 + 50) / 2 = 28,5 → 29', () => {
    // 100 × (1 − 744 / 800) vaut 6,999999999999995 en virgule flottante, et la moyenne naïve 28,499999999999996.
    const c: Commune = { ...six[0], code: '99902', loyerM2: 14.3, merKm: null, montagneKm: 5 }; // 14,3 × 52 = 743,6 → 744 €
    const e = evaluer([c], { loyer: 800, mer: null, montagne: 10, tailles: [] }).parCode.get('99902')!;
    expect([e.valeurPrix, e.score]).toEqual([744, 29]);
  });
});

// Spec cadre-de-vie, tâche 5 : le type d'environnement filtre sans noter (R27, D3, D10), sur la fixture « 6 communes ».
describe('R27 — le type d’environnement (spec cadre-de-vie)', () => {
  const six: Commune[] = cadreDeVie.fixture.items.map((it) => ({
    code: it.code_insee,
    nom: it.nom,
    dep: it.dep,
    population: it.population,
    loyerM2: it.loyer_m2,
    estimationPropre: it.estimation_propre,
    merKm: it.mer_km,
    typeEnv: it.type_env as Commune['typeEnv'],
    montagneKm: it.montagne_km,
  }));
  type Id6 = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  const code6 = Object.fromEntries(cadreDeVie.fixture.items.map((it) => [it.id, it.code_insee])) as Record<Id6, string>;
  const ev = (r: Reglages) => {
    const res = evaluer(six, r);
    return { res, by: (id: Id6) => res.parCode.get(code6[id])!, classement: res.classement.map((e) => [e.commune.nom, e.score]) };
  };

  it('AC-5 (calcul) « Ville dense » : Grandeville 31 seule (Montcher, ville dense, dépasse le prix) ; Portmer : type hors des choisis. Avec « Bourg et village » : Terrebasse 65, Grandeville 31', () => {
    const v = ev({ loyer: 1200, mer: null, tailles: [], types: ['ville-dense'] });
    expect(v.classement).toEqual([['Grandeville', 31]]);
    expect(v.by('A').raisons).toEqual([{ critere: 'type', type: 'ville-et-peripherie' }]);
    expect(ev({ loyer: 1200, mer: null, tailles: [], types: ['ville-dense', 'bourg-et-village'] }).classement).toEqual([['Terrebasse', 65], ['Grandeville', 31]]);
  });

  it('AC-8 (calcul) taille « Moins de 10 000 hab. » et type « Bourg et village » : Terrebasse 65 seule', () => {
    expect(ev({ loyer: 1200, mer: null, tailles: ['petite-commune'], types: ['bourg-et-village'] }).classement).toEqual([['Terrebasse', 65]]);
  });

  it('AC-10 (calcul) prix sur Sans limite, « Bourg et village » : page sans plafond ; Terrebasse passe sans score ; les 5 autres écartées, Portmer par son type', () => {
    const v = ev({ loyer: null, mer: null, tailles: [], types: ['bourg-et-village'] });
    expect(v.res.actif).toBe(false);
    expect(v.classement).toEqual([]);
    expect([v.by('D').passe, v.by('D').score, v.by('D').sansNote]).toEqual([true, null, false]);
    expect((['A', 'B', 'C', 'E', 'F'] as const).map((id) => v.by(id).passe)).toEqual([false, false, false, false, false]);
    expect(v.by('A').raisons).toEqual([{ critere: 'type', type: 'ville-et-peripherie' }]);
  });

  it('aucun type coché (absent ou vide) : ni filtre ni note, comme au départ', () => {
    const depart = ev({ loyer: 1200, mer: null, tailles: [] }).classement;
    expect(ev({ loyer: 1200, mer: null, tailles: [], types: [] }).classement).toEqual(depart);
    expect(depart.map(([n]) => n)).toEqual(['Terrebasse', 'Rhinval', 'Portmer', 'Grandeville', 'Quaibleu']);
  });

  it('type inconnu avec un type coché : ne passe pas, raison « type-inconnu »', () => {
    const inconnu = { ...six[0], code: '99903', typeEnv: null };
    expect(evaluer([inconnu], { loyer: null, mer: null, tailles: [], types: ['ville-dense'] }).parCode.get('99903')).toMatchObject({
      passe: false,
      raisons: [{ critere: 'type-inconnu' }],
    });
  });

  it('H83 : raisons dans l’ordre prix, mer, montagne, taille, type', () => {
    const v = ev({ loyer: 1000, mer: 10, montagne: 10, tailles: ['petite-commune'], types: ['campagne-isolee'] });
    expect(v.by('C').raisons.map((r) => r.critere)).toEqual(['loyer', 'mer', 'montagne', 'taille', 'type']);
  });
});
