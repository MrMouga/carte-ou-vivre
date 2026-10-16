import { describe, expect, it } from 'vitest';
import loyerMer from '../../docs/specs/2026-10-12-loyer-mer/acceptance.json';
import proches from '../../docs/specs/2026-10-13-proches/acceptance.json';
import { duree, phrasesPartiel, raisonTexte, tempsProche } from './format';
import { evaluer, PROCHE, type Commune, type ProchePret, type Reglages } from './score';

// Cadre-de-vie, règle (1) du recalage : le départ n'a plus de mer ; ces calculs partent du réglage explicite, mer 50 km
// (valeurs de proches AC-1, AC-2, AC-4 et AC-9 recalées).
const MER50: Reglages = { loyer: 1200, mer: 50, tailles: [] };

// Proches (R10, R11, H22) avec la fixture révisée de la spec proches : mêmes 5 communes que loyer-mer,
// et les fins de tranche du faux service de trajets (null = plus de 3 h, rangé 0).
// Les valeurs sont celles d'AC-1, AC-2, AC-4 et AC-6, mais ces tests portent sur le calcul : les AC sont prouvés en tâche 2b.
const communes: Commune[] = loyerMer.fixture.items.map((it) => ({
  code: it.code_insee,
  nom: it.nom,
  dep: it.dep,
  population: it.population,
  loyerM2: it.loyer_m2,
  estimationPropre: it.estimation_propre,
  merKm: it.mer_km,
}));
const trajets = proches.fixture.services['calcul de trajets (IGN) — fin de tranche en minutes par code de commune (null = plus de 3 h), par adresse choisie'] as Record<
  string,
  Record<string, number | null>
>;
/** Temps d'un proche de la fixture, dans l'ordre des communes (0 = plus de 3 h). */
const tempsDe = (libelle: string) => Uint16Array.from(communes, (c) => trajets[libelle][c.code] ?? 0);
const nantes = (plafond: number): ProchePret => ({ nom: 'Nantesville (44)', plafond, temps: tempsDe('1 rue Test 44000 Nantesville') });
const toulouse = (plafond: number): ProchePret => ({ nom: 'Toulouseville (31)', plafond, temps: tempsDe('2 place Test 31000 Toulouseville') });

const code = { A: '99001', B: '99002', C: '99003', D: '99004', E: '99005' } as const;
function scores(r: Reglages, liste: ProchePret[]) {
  const res = evaluer(communes, r, liste);
  return { res, by: (id: keyof typeof code) => res.parCode.get(code[id])! };
}

describe('R11 — plafond, note et score des proches', () => {
  it('plafond : de 15 min à 3 h par pas de 15 min, 2 h à l’ajout (H19)', () => {
    expect(PROCHE).toEqual({ pas: 15, max: 180, ajout: 120 });
  });

  it('Nantesville à 2 h : Portmer seule passe, score 65 ; Grandeville (2 h 15) et Quaibleu (plus de 3 h) ne passent pas', () => {
    const { res, by } = scores(MER50, [nantes(120)]);
    expect(res.classement.map((e) => [e.commune.nom, e.score])).toEqual([['Portmer', 65]]);
    expect(by('B').passe).toBe(false);
    expect(by('E').passe).toBe(false);
  });

  it('Nantesville à 2 h 15 : Portmer 66, Grandeville 17 (fin de tranche égale au plafond : passe, note 0)', () => {
    const { res } = scores(MER50, [nantes(135)]);
    expect(res.classement.map((e) => [e.commune.nom, e.score])).toEqual([['Portmer', 66], ['Grandeville', 17]]);
  });

  it('Nantesville à 2 h 15 et Toulouseville à 2 h 45 : Portmer 50, Grandeville 26 ; Quaibleu ne passe pas', () => {
    const { res, by } = scores(MER50, [nantes(135), toulouse(165)]);
    expect(res.classement.map((e) => [e.commune.nom, e.score])).toEqual([['Portmer', 50], ['Grandeville', 26]]);
    expect(by('E').passe).toBe(false);
  });

  it('loyer et mer sur « Sans limite », Nantesville à 2 h 15 : la page classe (Portmer 56, palier 40–60 ; Grandeville 0, palier 0–20)', () => {
    const { res, by } = scores({ loyer: null, mer: null, tailles: [] }, [nantes(135)]);
    expect(res.actif).toBe(true);
    expect(res.classement.map((e) => [e.commune.nom, e.score, e.palier])).toEqual([['Portmer', 56, 3], ['Grandeville', 0, 1]]);
    expect([by('C').passe, by('D').passe, by('E').passe]).toEqual([false, false, false]);
  });

  it('sans proche prêt, rien ne change (loyer-mer à mer 50 km : 72, 48, 25)', () => {
    const { res } = scores(MER50, []);
    expect(res.classement.map((e) => e.score)).toEqual([72, 48, 25]);
    expect(evaluer(communes, MER50).classement.map((e) => e.score)).toEqual([72, 48, 25]);
  });

  it('raisons : après loyer, mer et taille, une par proche non tenu, dans l’ordre d’ajout ; « plus de 3 h » vaut 0', () => {
    const { by } = scores({ loyer: 1200, mer: 60, tailles: ['petite-ville'] }, [nantes(120), toulouse(60)]);
    expect(by('B').raisons).toEqual([
      { critere: 'taille', taille: 'grande-ville', population: 260000 },
      { critere: 'proche', nom: 'Nantesville (44)', valeur: 135, plafond: 120 },
      { critere: 'proche', nom: 'Toulouseville (31)', valeur: 75, plafond: 60 },
    ]);
    expect(by('E').raisons.filter((r) => r.critere === 'proche')).toEqual([
      { critere: 'proche', nom: 'Nantesville (44)', valeur: 0, plafond: 120 },
      { critere: 'proche', nom: 'Toulouseville (31)', valeur: 120, plafond: 60 },
    ]);
  });
});

// H3 : on compare après avoir remplacé les espaces insécables par des espaces.
const s = (t: string) => t.replace(/ /g, ' ');

describe('H22 — formats des temps des proches', () => {
  it('« 15 min », « 45 min », « 1 h », « 1 h 15 », « 2 h 15 », « 3 h », « plus de 3 h »', () => {
    expect([15, 45, 60, 75, 135, 120, 180, 0].map((m) => s(duree(m)))).toEqual(['15 min', '45 min', '1 h', '1 h 15', '2 h 15', '2 h', '3 h', 'plus de 3 h']);
  });

  it('raison d’un proche : « Nantesville (44) 2 h 15 : au-dessus de ton plafond de 2 h »', () => {
    expect(s(raisonTexte({ critere: 'proche', nom: 'Nantesville (44)', valeur: 135, plafond: 120 }))).toBe('Nantesville (44) 2 h 15 : au-dessus de ton plafond de 2 h');
    expect(s(raisonTexte({ critere: 'proche', nom: 'Nantesville (44)', valeur: 0, plafond: 135 }))).toBe('Nantesville (44) plus de 3 h : au-dessus de ton plafond de 2 h 15');
  });
});

// Proches-fiables (R34, H96, tâche 2) : un proche **partiel** — des zones manquent, sa couverture atteint le plafond. Ses
// temps sont la fin de la plus petite zone obtenue qui contient la mairie (0 = dans aucune) ; « jusqu'à » quand la zone juste
// dessous manque, « plus de <couverture> » hors de la couverture. Fixture de proches-fiables, pannes « zone-135-toujours »
// (AC-2) et « zone-180-toujours » (AC-3), depuis « 1 rue Test 44000 Nantesville ».
const TOUTES = Array.from({ length: 12 }, (_, i) => (i + 1) * 15);
const SANS_135 = TOUTES.filter((d) => d !== 135);
const SANS_180 = TOUTES.filter((d) => d !== 180);
/** Fin de la plus petite zone obtenue qui contient la mairie de chaque commune (R34) ; 0 = dans aucune. */
const tempsPartiel = (libelle: string, zones: number[]) =>
  Uint16Array.from(communes, (c) => {
    const fin = trajets[libelle][c.code];
    return fin == null ? 0 : (zones.find((z) => z >= fin) ?? 0);
  });
const nantesPartiel = (plafond: number, zones: number[]): ProchePret => ({ nom: 'Nantesville (44)', plafond, temps: tempsPartiel('1 rue Test 44000 Nantesville', zones), zones });

describe('R34, H96 (proches-fiables) — valeurs et phrases d’un proche partiel', () => {
  it('H96 : « jusqu’à 2 h 30 » quand la zone juste dessous manque ; « plus de 2 h 45 » hors de la couverture ; sinon comme avant', () => {
    expect(s(tempsProche(150, SANS_135))).toBe("jusqu'à 2 h 30");
    expect(s(tempsProche(60, SANS_135))).toBe('1 h');
    expect(s(tempsProche(0, SANS_135))).toBe('plus de 3 h');
    expect(s(tempsProche(0, SANS_180))).toBe('plus de 2 h 45');
    expect(s(tempsProche(135, SANS_180))).toBe('2 h 15');
    expect(s(tempsProche(0, TOUTES))).toBe('plus de 3 h');
    // Proche prêt relu de la mémoire (sans zones) : inchangé.
    expect(s(tempsProche(135))).toBe('2 h 15');
    expect(s(tempsProche(0))).toBe('plus de 3 h');
  });

  it('phrases de la ligne : « Temps approximatifs… » si une zone manque sous la couverture, « Au-delà de 2 h 45… » sous 3 h, dans cet ordre', () => {
    expect(phrasesPartiel(SANS_135)).toEqual(["Temps approximatifs : l'IGN n'a pas tout donné."]);
    expect(phrasesPartiel(SANS_180).map(s)).toEqual(["Au-delà de 2 h 45 : l'IGN n'a pas répondu."]);
    expect(phrasesPartiel(SANS_135.filter((d) => d !== 180)).map(s)).toEqual([
      "Temps approximatifs : l'IGN n'a pas tout donné.",
      "Au-delà de 2 h 45 : l'IGN n'a pas répondu.",
    ]);
    expect(phrasesPartiel(TOUTES)).toEqual([]);
  });

  it('AC-2 (calcul) : à 2 h 30, Portmer 68, Grandeville 17 (« jusqu’à 2 h 30 » compte pour 2 h 30) ; à 2 h 15, Portmer 66 seule, raison « jusqu’à 2 h 30 »', () => {
    expect(scores(MER50, [nantesPartiel(150, SANS_135)]).res.classement.map((e) => [e.commune.nom, e.score])).toEqual([['Portmer', 68], ['Grandeville', 17]]);
    const { res, by } = scores(MER50, [nantesPartiel(135, SANS_135)]);
    expect(res.classement.map((e) => [e.commune.nom, e.score])).toEqual([['Portmer', 66]]);
    expect(by('B').raisons.map(raisonTexte).map(s)).toEqual(["Nantesville (44) jusqu'à 2 h 30 : au-dessus de ton plafond de 2 h 15"]);
  });

  it('AC-3 (calcul) : couverture 2 h 45, à 2 h, Portmer 65 seule ; Quaibleu « plus de 2 h 45 : au-dessus de ton plafond de 2 h »', () => {
    const { res, by } = scores(MER50, [nantesPartiel(120, SANS_180)]);
    expect(res.classement.map((e) => [e.commune.nom, e.score])).toEqual([['Portmer', 65]]);
    expect(by('E').raisons.filter((r) => r.critere === 'proche').map(raisonTexte).map(s)).toEqual(['Nantesville (44) plus de 2 h 45 : au-dessus de ton plafond de 2 h']);
  });

  it('D5 : un proche partiel sort la page de l’état « sans plafond » (loyer et mer sur « Sans limite »)', () => {
    expect(scores({ loyer: null, mer: null, tailles: [] }, [nantesPartiel(150, SANS_135)]).res.actif).toBe(true);
  });
});
