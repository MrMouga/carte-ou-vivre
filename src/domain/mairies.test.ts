import { describe, expect, it } from 'vitest';
import cadreDeVie from '../../docs/specs/2026-10-14-cadre-de-vie/acceptance.json';
import mairies from '../../docs/specs/2026-10-18-mairies/acceptance.json';
import { raisonTexte, resumeVieLocale } from './format';
import { evaluer, joindreBords, type Bord, type Commune, type MairiesJson, type NuancesJson, type Reglages } from './score';
import { ecrireAdresse, lireAdresse, ORDRE_BORDS } from './url';

// Spec mairies, tâche 1 : le filtre de R38 et l'adresse de R41, sur la fixture « 6 communes » de cadre-de-vie étendue par
// celle de mairies (même codes INSEE). Les deux fichiers servis sont fabriqués depuis la fixture comme dans
// tests/e2e/lib/carte.ts (plan, « Fixtures ») : une nuance inventée par étiquette, de code égal à l'étiquette ;
// `[code, "", liste]` pour une mairie sans étiquette, `[code, null, null]` sans résultat.
type Id = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
const items = mairies.fixture.items;
const nuancesJson: NuancesJson = Object.fromEntries(
  items.filter((it) => it.mairie_etiquette != null).map((it) => [it.mairie_etiquette!, { etiquette: it.mairie_etiquette!, bloc: it.mairie_bloc as NuancesJson[string]['bloc'] }]),
);
const mairiesJson: MairiesJson = {
  champs: ['code', 'nuance', 'liste'],
  communes: items.map((it) => (it.sans_resultat ? [it.code_insee, null, null] : [it.code_insee, it.mairie_etiquette ?? '', it.mairie_liste])),
};
const six: Commune[] = joindreBords(
  cadreDeVie.fixture.items.map((it) => ({
    code: it.code_insee,
    nom: it.nom,
    dep: it.dep,
    population: it.population,
    loyerM2: it.loyer_m2,
    estimationPropre: it.estimation_propre,
    merKm: it.mer_km,
    typeEnv: it.type_env as Commune['typeEnv'],
    montagneKm: it.montagne_km,
  })),
  mairiesJson,
  nuancesJson,
);
const code = Object.fromEntries(items.map((it) => [it.id, it.code_insee])) as Record<Id, string>;
const ev = (mairiesCochees?: Bord[], r: Partial<Reglages> = {}) => {
  const res = evaluer(six, { loyer: 1200, mer: null, tailles: [], ...(mairiesCochees && { mairies: mairiesCochees }), ...r });
  return { res, by: (id: Id) => res.parCode.get(code[id])!, classement: res.classement.map((e) => [e.commune.nom, e.score]) };
};
const textes = (id: Id, v: ReturnType<typeof ev>) => v.by(id).raisons.map(raisonTexte);

describe('R39, H122 — chaque commune a son bord, son étiquette et sa liste, joints par code INSEE', () => {
  it('fixture « 6 communes » : A droite « Divers droite », B gauche, C divers, D sans étiquette, E extrême droite, F sans résultat', () => {
    const par = (id: Id) => six.find((c) => c.code === code[id])!;
    expect((['A', 'B', 'C', 'D', 'E', 'F'] as const).map((id) => [par(id).bord, par(id).nuance, par(id).liste])).toEqual([
      ['droite', 'Divers droite', 'Portmer Avance'],
      ['gauche', 'Union de la gauche', 'Grandeville en commun'],
      ['divers', 'Divers', 'Montcher demain'],
      ['sans-etiquette', null, 'Vivre à Terrebasse'],
      ['extreme-droite', 'Rassemblement national', "Quaibleu d'abord"],
      [null, null, null],
    ]);
  });

  it('jointure par code et non par position : lignes dans le désordre, commune absente du fichier = sans résultat', () => {
    const melange: MairiesJson = { champs: mairiesJson.champs, communes: [...mairiesJson.communes].reverse().filter(([c]) => c !== code.A) };
    const j = joindreBords(six, melange, nuancesJson);
    expect(j.map((c) => c.bord)).toEqual([null, 'gauche', 'divers', 'sans-etiquette', 'extreme-droite', null]);
    expect([j[0].nuance, j[0].liste]).toEqual([null, null]);
  });
});

describe('R38 — le filtre de mairie (fixture « 6 communes », /?loyer=1200)', () => {
  it('AC-4 (calcul) aucune pastille cochée (absent ou vide) : la liste de départ, Rhinval (sans résultat) comprise', () => {
    const depart = [['Terrebasse', 65], ['Rhinval', 52], ['Portmer', 46], ['Grandeville', 31], ['Quaibleu', 9]];
    expect(ev().classement).toEqual(depart);
    expect(ev([]).classement).toEqual(depart);
    expect(ev().by('F').raisons).toEqual([]);
  });

  it('AC-2 (calcul) « Droite » : Portmer 46 seule ; Grandeville « Mairie : gauche, … », Terrebasse « Mairie : sans étiquette, … »', () => {
    const v = ev(['droite']);
    expect(v.classement).toEqual([['Portmer', 46]]);
    expect(textes('B', v)).toEqual(['Mairie : gauche, hors des mairies choisies']);
    expect(textes('D', v)).toEqual(['Mairie : sans étiquette, hors des mairies choisies']);
    expect(textes('E', v)).toEqual(['Mairie : extrême droite, hors des mairies choisies']);
    expect(textes('F', v)).toEqual(['Mairie : aucun résultat en 2026, hors des mairies choisies']);
  });

  it('AC-2 (calcul) « Centre » seul : aucune commune ne passe', () => {
    const v = ev(['centre']);
    expect(v.classement).toEqual([]);
    expect(v.res.actif).toBe(true);
    expect((['A', 'B', 'C', 'D', 'E', 'F'] as const).filter((id) => v.by(id).passe)).toEqual([]);
  });

  it('AC-3 (calcul) « Gauche » : Grandeville 31 ; avec « Sans étiquette » : Terrebasse 65, Grandeville 31 ; Rhinval sans résultat et Portmer droite écartées', () => {
    expect(ev(['gauche']).classement).toEqual([['Grandeville', 31]]);
    const v = ev(['gauche', 'sans-etiquette']);
    expect(v.classement).toEqual([['Terrebasse', 65], ['Grandeville', 31]]);
    expect(textes('F', v)).toEqual(['Mairie : aucun résultat en 2026, hors des mairies choisies']);
    expect(textes('A', v)).toEqual(['Mairie : droite, hors des mairies choisies']);
  });

  it('chaque bloc seul : extrême gauche aucune, divers aucune (Montcher dépasse le prix, sans raison de mairie), extrême droite Quaibleu 9', () => {
    expect(ev(['extreme-gauche']).classement).toEqual([]);
    const divers = ev(['divers']);
    expect(divers.classement).toEqual([]);
    expect(divers.by('C').raisons.map((r) => r.critere)).toEqual(['loyer']);
    expect(ev(['extreme-droite']).classement).toEqual([['Quaibleu', 9]]);
  });

  it('« Sans étiquette » seule : Terrebasse 65 ; pas Rhinval, sans résultat (D5)', () => {
    const v = ev(['sans-etiquette']);
    expect(v.classement).toEqual([['Terrebasse', 65]]);
    expect(v.by('F').passe).toBe(false);
  });

  it('le filtre ne note pas : les 7 cochées donnent les scores de départ, sauf Rhinval écartée', () => {
    expect(ev([...ORDRE_BORDS]).classement).toEqual([['Terrebasse', 65], ['Portmer', 46], ['Grandeville', 31], ['Quaibleu', 9]]);
  });

  it('AC-6 (calcul) prix sur Sans limite, « Extrême droite » : page sans plafond ; Quaibleu passe sans score ; Portmer « Mairie : droite, … »', () => {
    const v = ev(['extreme-droite'], { loyer: null });
    expect(v.res.actif).toBe(false);
    expect(v.classement).toEqual([]);
    expect([v.by('E').passe, v.by('E').score, v.by('E').sansNote]).toEqual([true, null, false]);
    expect((['A', 'B', 'C', 'D', 'F'] as const).map((id) => v.by(id).passe)).toEqual([false, false, false, false, false]);
    expect(textes('A', v)).toEqual(['Mairie : droite, hors des mairies choisies']);
  });

  it('H113 : raisons dans l’ordre prix, mer, montagne, taille, type, mairie, proches', () => {
    const proche = { nom: 'Nantesville (44)', plafond: 15, temps: new Uint16Array(six.length).fill(180) };
    const res = evaluer(six, { loyer: 1000, mer: 10, montagne: 10, tailles: ['petite-commune'], types: ['campagne-isolee'], mairies: ['droite'] }, [proche]);
    expect(res.parCode.get(code.C)!.raisons.map((r) => r.critere)).toEqual(['loyer', 'mer', 'montagne', 'taille', 'type', 'bord', 'proche']);
  });

  it('AC-7 (calcul) types « Ville et périphérie », « Bourg et village » et mairies « Droite », « Sans étiquette » : Terrebasse 65, Portmer 46 ; Grandeville : type puis mairie', () => {
    const v = ev(['droite', 'sans-etiquette'], { types: ['ville-et-peripherie', 'bourg-et-village'] });
    expect(v.classement).toEqual([['Terrebasse', 65], ['Portmer', 46]]);
    expect(textes('B', v)).toEqual(['Environnement : ville dense, hors des types choisis', 'Mairie : gauche, hors des mairies choisies']);
  });
});

describe('R41 — `mairie` dans l’adresse', () => {
  it('AC-7 /?mairie=sans-etiquette,droite,droite,rouge&env=… → Droite et Sans étiquette ; /?loyer=1200&env=ville-et-peripherie,bourg-et-village&mairie=droite,sans-etiquette', () => {
    const r = lireAdresse('?mairie=sans-etiquette,droite,droite,rouge&env=ville-et-peripherie,bourg-et-village');
    expect(r.mairies).toEqual(['droite', 'sans-etiquette']);
    expect(ecrireAdresse(r)).toBe('/?loyer=1200&env=ville-et-peripherie,bourg-et-village&mairie=droite,sans-etiquette');
  });

  it('une adresse sans `mairie` (ou sans nom connu) ne renvoie pas le champ ; aucune pastille cochée → `mairie` absente', () => {
    expect('mairies' in lireAdresse('?loyer=1200')).toBe(false);
    expect('mairies' in lireAdresse('?loyer=1200&mairie=rouge,')).toBe(false);
    expect(lireAdresse('?loyer=1200')).toEqual({ loyer: 1200, mer: null, tailles: [] });
    expect(ecrireAdresse({ loyer: 1200, mer: null, tailles: [], mairies: [] })).toBe('/?loyer=1200');
  });

  it('noms de H108, dans l’ordre de R38 ; `mairie` après `env`, avant `bien`, `unite`, `surface`', () => {
    expect(ORDRE_BORDS).toEqual(['extreme-gauche', 'gauche', 'divers', 'centre', 'droite', 'extreme-droite', 'sans-etiquette']);
    const r = lireAdresse('?achat=5000&bien=maison&unite=total&surface=80&mer=50&montagne=30&taille=petite-ville&env=ville-dense&mairie=sans-etiquette,extreme-droite,centre,divers,extreme-gauche,gauche,droite');
    expect(r.mairies).toEqual(ORDRE_BORDS);
    expect(ecrireAdresse(r, { mode: 'acheter', bien: 'maison', unite: 'total', surface: 80 })).toMatch(
      /^\/\?achat=\d+&mer=50&montagne=30&taille=petite-ville&env=ville-dense&mairie=extreme-gauche,gauche,divers,centre,droite,extreme-droite,sans-etiquette&bien=maison&unite=total&surface=80$/,
    );
  });
});

describe('R38 — textes des raisons', () => {
  it('le bloc en minuscules ; sans étiquette ; aucun résultat en 2026', () => {
    expect(raisonTexte({ critere: 'bord', bord: 'droite' })).toBe('Mairie : droite, hors des mairies choisies');
    expect(raisonTexte({ critere: 'bord', bord: 'extreme-gauche' })).toBe('Mairie : extrême gauche, hors des mairies choisies');
    expect(raisonTexte({ critere: 'bord', bord: 'centre' })).toBe('Mairie : centre, hors des mairies choisies');
    expect(raisonTexte({ critere: 'bord', bord: 'sans-etiquette' })).toBe('Mairie : sans étiquette, hors des mairies choisies');
    expect(raisonTexte({ critere: 'bord', bord: null })).toBe('Mairie : aucun résultat en 2026, hors des mairies choisies');
  });
});

describe('H110 — résumé de « Vie locale » repliée', () => {
  it('« Peu importe » sans pastille cochée (champ absent ou vide) ; sinon « 1 choix », « 2 choix », avec espace insécable', () => {
    expect(resumeVieLocale({ loyer: 1200, mer: null, tailles: [] })).toBe('Peu importe');
    expect(resumeVieLocale({ loyer: 1200, mer: null, tailles: [], mairies: [] })).toBe('Peu importe');
    expect(resumeVieLocale({ loyer: 1200, mer: null, tailles: [], mairies: ['droite'] })).toBe('1\u00a0choix');
    expect(resumeVieLocale({ loyer: 1200, mer: null, tailles: [], mairies: ['gauche', 'sans-etiquette'] })).toBe('2\u00a0choix');
  });
});
