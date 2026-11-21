import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import cadreDeVie from '../../docs/specs/2026-10-14-cadre-de-vie/acceptance.json';
import emploiSpec from '../../docs/specs/2026-11-21-emploi/acceptance.json';
import { avecPlusProche, chercherMetiers, joindreEmploi, ligneMetier, lireEmploi, plusProche, type Emploi, type EmploiJson, type Metier } from './emploi';
import { chomageFiche, metierFiche, raisonTexte, resumeEmploi } from './format';
import { communeDeLigne, evaluer, REGLAGES_DEPART, type Commune, type LigneCommunes, type MetierChoisi, type Niveau, type Raison, type Reglages } from './score';
import { ecrireAdresse, garderMetiersConnus, lireAdresse, lirePrix } from './url';

// Spec emploi, tâche 1 : le filtre de R46, ses raisons (H136, H139) et l'adresse de R48. La fixture « 6 communes »
// d'emploi est servie comme dans tests/e2e/lib/carte.ts (plan, « Fixtures ») : la ville principale d'un bassin est la
// commune de son bassin à 0 km d'elle-même dans `distances_km`, et `distances_km` passe des noms aux codes.
const NBSP = / /g;
const texte = (s: string) => s.replace(NBSP, ' ');
type Id = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
const f = emploiSpec.fixture;
const distancesNoms = f.distances_km as Record<string, Record<string, number>>;

/** `emploi.json` de la fixture, fabriqué comme dans tests/e2e/lib/carte.ts. */
function emploiFixture(codes: string[] = f.items.map((it) => it.code_insee)): EmploiJson {
  const items = f.items.filter((it) => codes.includes(it.code_insee));
  const villes = items.filter((it) => distancesNoms[it.nom][it.nom] === 0);
  const bassinDeVille = new Map(villes.map((v) => [v.nom, v.bassin]));
  const bassins = new Set(villes.map((v) => v.bassin));
  return {
    trimestre_chomage: f.trimestre_chomage,
    bassins: villes.map((v) => [v.bassin, v.code_insee]),
    zones: [...new Map(items.filter((it) => it.zone_emploi != null).map((it) => [it.zone_emploi!, [it.zone_emploi!, it.zone_emploi!, it.chomage!] as [string, string, number]])).values()],
    metiers: f.metiers.map((m) => ({
      code: m.code,
      libelle: m.libelle,
      noms: Object.entries(f.noms_courants).filter(([, c]) => c === m.code).map(([n]) => n),
      peu_chiffre: m.peu_chiffre,
      bassins: Object.entries(m.bassins as Record<string, { niveau: Niveau | null; projets?: number }>)
        .filter(([b, v]) => v.niveau != null && bassins.has(b))
        .map(([b, v]) => [b, v.projets!, v.niveau!] as [string, number, Niveau]),
    })),
    communes: codes.map((code) => {
      const it = items.find((x) => x.code_insee === code);
      return [code, it?.bassin ?? null, it?.zone_emploi ?? null];
    }),
    distances_km: Object.fromEntries(
      items.map((it) => [it.code_insee, Object.fromEntries(Object.entries(distancesNoms[it.nom]).filter(([v]) => bassinDeVille.has(v)).map(([v, k]) => [bassinDeVille.get(v)!, k]))]),
    ),
  };
}

const sixSans: Commune[] = cadreDeVie.fixture.items.map((it) => ({
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
const json = emploiFixture();
const six = joindreEmploi(sixSans, json);
// Les points des mairies de la fixture ne servent pas : `distances_km` remplace le calcul (H144).
const emploi = lireEmploi(json, six, six.map(() => [0, 0]));
const code = Object.fromEntries(f.items.map((it) => [it.id, it.code_insee])) as Record<Id, string>;
const IDS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
const nom = (id: Id) => f.items.find((it) => it.id === id)!.nom;
const SANS_PLAFOND: Reglages = { loyer: null, mer: null, tailles: [] };
const ev = (metiers: MetierChoisi[], r: Reglages = SANS_PLAFOND, e: Emploi = emploi, communes = six) => evaluer(communes, { ...r, metiers }, [], undefined, e);
const passent = (metiers: MetierChoisi[]) => {
  const res = ev(metiers);
  return IDS.filter((id) => res.parCode.get(code[id])!.passe).map(nom);
};
const raisonsMetier = (id: Id, metiers: MetierChoisi[], e = emploi, communes = six) => {
  const res = ev(metiers, SANS_PLAFOND, e, communes);
  const i = communes.findIndex((c) => c.code === code[id]);
  return res.parCode
    .get(code[id])!
    .raisons.filter((r) => r.critere === 'metier')
    .map((r) => texte(raisonTexte(avecPlusProche(e, i, r as Extract<Raison, { critere: 'metier' }>))));
};
const LIB = Object.fromEntries(f.metiers.map((m) => [m.code, m.libelle]));

describe('lecture et jointure (H140, H142)', () => {
  it('fixture « 6 communes » : bassin, zone et taux de chaque commune ; Rhinval sans zone', () => {
    expect(six.map((c) => [c.nom, c.bassin, c.zoneEmploi, c.chomage])).toEqual([
      ['Portmer', '99B1', 'Grandeville', 7.1],
      ['Grandeville', '99B1', 'Grandeville', 7.1],
      ['Montcher', '99B2', 'Montcher', 6.8],
      ['Terrebasse', '99B1', 'Grandeville', 7.1],
      ['Quaibleu', '99B2', 'Montcher', 6.8],
      ['Rhinval', '99B3', null, null],
    ]);
    expect(emploi.trimestre).toBe('2e trimestre 2026');
  });

  it('jointure par code et non par position ; une commune absente du fichier n’a ni bassin ni zone', () => {
    const melange = { ...json, communes: [...json.communes].reverse().filter((l) => l[0] !== code.C) };
    const j = joindreEmploi(sixSans, melange);
    expect(j.find((c) => c.code === code.A)).toMatchObject({ bassin: '99B1', zoneEmploi: 'Grandeville', chomage: 7.1 });
    expect(j.find((c) => c.code === code.C)).toMatchObject({ bassin: null, zoneEmploi: null, chomage: null });
  });
});

describe('R46 sur la fixture, avec distances_km', () => {
  it('chaque commune, à chaque niveau des 4 métiers', () => {
    const tous = ['Portmer', 'Grandeville', 'Montcher', 'Terrebasse', 'Quaibleu', 'Rhinval'];
    const sansRhinval = tous.slice(0, 5);
    const attendu: Record<string, Record<Niveau, string[]>> = {
      // Infirmiers et médecins : 99B1 « 25 », 99B2 « 10 », 99B3 « tous ».
      V1X80: { '10': ['Montcher', 'Terrebasse'], '25': sansRhinval, tous },
      V2X90: { '10': ['Montcher', 'Terrebasse'], '25': sansRhinval, tous },
      // Graphistes : 99B2 « 10 » seul.
      U1X82: { '10': ['Montcher', 'Terrebasse'], '25': ['Montcher', 'Terrebasse'], tous: ['Montcher', 'Terrebasse'] },
      // Informatique : 99B1 et 99B2 « 10 ».
      M2X90: { '10': sansRhinval, '25': sansRhinval, tous: sansRhinval },
    };
    for (const [m, parNiveau] of Object.entries(attendu))
      for (const [niveau, noms] of Object.entries(parNiveau)) expect(passent([{ code: m, niveau: niveau as Niveau }]), `${m}:${niveau}`).toEqual(noms);
  });

  it('le plus proche de chaque commune écartée : Montcher, à sa distance de la fixture', () => {
    const km: Record<string, number> = { Portmer: 85, Grandeville: 60, Quaibleu: 45, Rhinval: 160 };
    for (const m of ['V1X80', 'V2X90', 'U1X82', 'M2X90'])
      for (const niveau of ['10', '25', 'tous'] as const)
        for (const id of IDS) {
          const r = ev([{ code: m, niveau }]).parCode.get(code[id])!;
          if (r.passe) continue;
          expect(plusProche(emploi, IDS.indexOf(id), m, niveau), `${m}:${niveau} ${nom(id)}`).toEqual({ code: code.C, nom: 'Montcher', km: km[nom(id)] });
        }
  });

  it('AC-4 (calcul) « 10 % » pour les infirmiers : Terrebasse seule classée (65) ; raison de Quaibleu, une seule fois', () => {
    const res = ev([{ code: 'V1X80', niveau: '10' }], REGLAGES_DEPART);
    expect(res.classement.map((e) => [e.commune.nom, e.score])).toEqual([['Terrebasse', 65]]);
    expect(raisonsMetier('E', [{ code: 'V1X80', niveau: '10' }])).toEqual([
      'Infirmiers et sages-femmes : aucun bassin parmi les 10 % qui recrutent le plus dans un rayon de 30 km (le plus proche : Montcher, 45 km)',
    ]);
  });

  it('AC-5 (calcul) « 25 % » puis « Partout où il recrute » : le filtre ne note pas ; raison de Rhinval', () => {
    const depart = evaluer(six, REGLAGES_DEPART).classement.map((e) => [e.commune.nom, e.score]);
    expect(depart).toEqual([['Terrebasse', 65], ['Rhinval', 52], ['Portmer', 46], ['Grandeville', 31], ['Quaibleu', 9]]);
    expect(ev([{ code: 'V1X80', niveau: '25' }], REGLAGES_DEPART).classement.map((e) => [e.commune.nom, e.score])).toEqual(depart.filter(([n]) => n !== 'Rhinval'));
    expect(raisonsMetier('F', [{ code: 'V1X80', niveau: '25' }])).toEqual([
      'Infirmiers et sages-femmes : aucun bassin parmi les 25 % qui recrutent le plus dans un rayon de 30 km (le plus proche : Montcher, 160 km)',
    ]);
    expect(ev([{ code: 'V1X80', niveau: 'tous' }], REGLAGES_DEPART).classement.map((e) => [e.commune.nom, e.score])).toEqual(depart);
    expect(raisonsMetier('F', [{ code: 'V1X80', niveau: 'tous' }])).toEqual([]);
  });

  it('AC-6 (calcul) deux métiers : il faut passer les deux ; Portmer n’a que la raison des graphistes', () => {
    const metiers: MetierChoisi[] = [{ code: 'V1X80', niveau: '25' }, { code: 'U1X82', niveau: '10' }];
    expect(ev(metiers, REGLAGES_DEPART).classement.map((e) => [e.commune.nom, e.score])).toEqual([['Terrebasse', 65]]);
    expect(raisonsMetier('A', metiers)).toEqual([
      `${LIB.U1X82} : aucun bassin parmi les 10 % qui recrutent le plus dans un rayon de 30 km (le plus proche : Montcher, 85 km)`,
    ]);
  });

  it('AC-9 (calcul) « Partout où il recrute » : raison de Rhinval', () => {
    expect(raisonsMetier('F', [{ code: 'U1X82', niveau: 'tous' }])).toEqual([
      `${LIB.U1X82} : aucun bassin où ce métier recrute dans un rayon de 30 km (le plus proche : Montcher, 160 km)`,
    ]);
  });

  it('une commune écartée par deux métiers a deux raisons, dans l’ordre du choix', () => {
    expect(raisonsMetier('A', [{ code: 'U1X82', niveau: '10' }, { code: 'V1X80', niveau: '10' }])).toEqual([
      `${LIB.U1X82} : aucun bassin parmi les 10 % qui recrutent le plus dans un rayon de 30 km (le plus proche : Montcher, 85 km)`,
      'Infirmiers et sages-femmes : aucun bassin parmi les 10 % qui recrutent le plus dans un rayon de 30 km (le plus proche : Montcher, 85 km)',
    ]);
  });

  it('un métier sans niveau ne filtre pas ; un code inconnu non plus', () => {
    const sans = ev([]);
    for (const metiers of [[{ code: 'U1X82', niveau: null }], [{ code: 'ZZ999', niveau: '10' as const }]]) {
      const res = ev(metiers);
      for (const id of IDS) expect(res.parCode.get(code[id])).toEqual(sans.parCode.get(code[id]));
    }
  });

  it('H139 : raisons dans l’ordre prix, type, mairie, métier 1, métier 2, proches', () => {
    const r: Reglages = { loyer: 300, mer: null, tailles: [], types: ['campagne-isolee'], mairies: ['centre'], metiers: [{ code: 'U1X82', niveau: '10' }, { code: 'V1X80', niveau: '10' }] };
    const loin = { nom: 'Loin', plafond: 15, distances: new Float64Array(six.length).fill(500) };
    const e = evaluer(six.map((c) => ({ ...c, bord: 'droite' as const })), r, [loin], undefined, emploi).parCode.get(code.A)!;
    expect(e.raisons.map((x) => x.critere)).toEqual(['loyer', 'type', 'bord', 'metier', 'metier', 'proche-km']);
    expect(e.raisons.filter((x) => x.critere === 'metier').map((x) => (x as { code: string }).code)).toEqual(['U1X82', 'V1X80']);
  });

  it('jeu sans bassin (comme « métropole ») : aucune commune ne passe un niveau coché, et la raison n’a pas de « plus proche »', () => {
    const vide = emploiFixture([]);
    const communes = joindreEmploi(sixSans, vide);
    const e = lireEmploi(vide, communes, communes.map(() => [0, 0]));
    expect(ev([{ code: 'V1X80', niveau: 'tous' }], SANS_PLAFOND, e, communes).parCode.get(code.B)!.passe).toBe(false);
    expect(raisonsMetier('B', [{ code: 'V1X80', niveau: 'tous' }], e, communes)).toEqual([
      'Infirmiers et sages-femmes : aucun bassin où ce métier recrute dans un rayon de 30 km',
    ]);
  });
});

// Distances calculées (vraies données) : de mairie à mairie, comparées au km comme la mer (H136).
const RAYON_KM = 6371;
const aNord = (km: number) => 45 + ((km / RAYON_KM) * 180) / Math.PI;
const commune = (code: string, nom: string): Commune => ({ code, nom, dep: '99', population: 1000, loyerM2: null, estimationPropre: true, merKm: null });

describe('distances calculées (H136)', () => {
  // V, ville principale ; A à 30,4 km, B à 30,6 km, C à 0,4 km, au nord de V.
  const json: EmploiJson = {
    trimestre_chomage: 'x',
    bassins: [['B9', '99101'], ['MONACO', null]],
    zones: [],
    metiers: [{ code: 'M1', libelle: 'Métier', noms: [], peu_chiffre: false, bassins: [['B9', 10, '10'], ['MONACO', 5, '10']] }],
    communes: ['99101', '99102', '99103', '99104'].map((c) => [c, 'B9', null]),
  };
  const communes = joindreEmploi([commune('99101', 'Villebas'), commune('99102', 'Aval'), commune('99103', 'Bval'), commune('99104', 'Cval')], json);
  const e = lireEmploi(json, communes, [[2, 45], [2, aNord(30.4)], [2, aNord(30.6)], [2, aNord(0.4)]]);

  it('30,4 km passe (« 30 km »), 30,6 km non (« 31 km ») ; « moins d’1 km » compte pour 1 km ; la ville elle-même, 0 km', () => {
    expect([0, 1, 2, 3].map((i) => e.distance(i, 0))).toEqual([0, 30, 31, 1]);
    const res = evaluer(communes, { ...SANS_PLAFOND, metiers: [{ code: 'M1', niveau: '10' }] }, [], undefined, e);
    expect(communes.map((c) => res.parCode.get(c.code)!.passe)).toEqual([true, true, false, true]);
    expect(plusProche(e, 2, 'M1', '10')).toEqual({ code: '99101', nom: 'Villebas', km: 31 });
  });

  it('un bassin sans ville principale (Monaco, 9399) est ignoré', () => {
    expect(e.distance(0, 1)).toBe(Infinity);
  });
});

describe('H136 : égalité de distance écrite', () => {
  // X à 40 km de trois villes principales (et à 41 km d'une quatrième) ; la fixture donne les distances.
  const communes = [commune('99100', 'X'), commune('99102', 'P-b1'), commune('99101', 'P-b2'), commune('99103', 'P-b3'), commune('99104', 'P-b4')];
  const fabriquer = (bassins: [string, number, Niveau][]) => {
    const json: EmploiJson = {
      trimestre_chomage: 'x',
      bassins: [['b1', '99102'], ['b2', '99101'], ['b3', '99103'], ['b4', '99104']],
      zones: [],
      metiers: [{ code: 'M1', libelle: 'Métier', noms: [], peu_chiffre: false, bassins }],
      communes: communes.map((c) => [c.code, null, null]),
      distances_km: { '99100': { b1: 40, b2: 40, b3: 40, b4: 39 } },
    };
    return lireEmploi(json, communes, communes.map(() => [0, 0]));
  };

  it('la plus proche d’abord, quel que soit son niveau', () => {
    expect(plusProche(fabriquer([['b1', 900, '10'], ['b4', 1, 'tous']]), 0, 'M1', 'tous')).toMatchObject({ nom: 'P-b4', km: 39 });
  });
  it('à égalité : le niveau le plus étroit', () => {
    expect(plusProche(fabriquer([['b1', 900, 'tous'], ['b2', 10, '10'], ['b3', 500, '25']]), 0, 'M1', 'tous')).toMatchObject({ nom: 'P-b2', km: 40 });
  });
  it('puis le plus de projets', () => {
    expect(plusProche(fabriquer([['b1', 100, '25'], ['b2', 10, '25'], ['b3', 500, '25']]), 0, 'M1', '25')).toMatchObject({ nom: 'P-b3', km: 40 });
  });
  it('puis le plus petit code INSEE', () => {
    expect(plusProche(fabriquer([['b1', 100, '10'], ['b2', 100, '10'], ['b3', 100, '10']]), 0, 'M1', '10')).toMatchObject({ code: '99101', nom: 'P-b2' });
  });
});

describe('R48 : le paramètre `metier`', () => {
  const codes = new Set(f.metiers.map((m) => m.code));
  const lire = (search: string) => lireAdresse(search, codes);
  const allerRetour = (search: string) => ecrireAdresse(lire(search), lirePrix(search));

  it('AC-11 (adresse) première adresse : code inconnu retiré, niveau inconnu retiré sans le métier, troisième métier retiré', () => {
    const search = '?loyer=1200&metier=V1X80:10,ZZ999:25,U1X82:50,V2X90';
    expect(lire(search).metiers).toEqual([{ code: 'V1X80', niveau: '10' }, { code: 'U1X82', niveau: null }]);
    expect(allerRetour(search)).toBe('/?loyer=1200&metier=V1X80:10,U1X82');
  });
  it('AC-11 (adresse) deuxième adresse : un code déjà présent est retiré', () => {
    expect(allerRetour('?loyer=1200&metier=V1X80:10,V1X80:25')).toBe('/?loyer=1200&metier=V1X80:10');
  });
  it('AC-11 (adresse) troisième adresse : `metier` après `mairie`', () => {
    expect(allerRetour('?metier=V2X90:tous&mairie=gauche&loyer=1200')).toBe('/?loyer=1200&mairie=gauche&metier=V2X90:tous');
  });
  it('`metier` avant `bien`, `unite` et `surface`', () => {
    expect(allerRetour('?bien=maison&metier=M2X90:25&env=ville-dense&loyer=1200')).toBe('/?loyer=1200&env=ville-dense&metier=M2X90:25&bien=maison');
  });
  it('une adresse sans `metier`, ou sans métier connu, ne renvoie pas le champ', () => {
    expect(lire('?loyer=1200')).toEqual({ loyer: 1200, mer: null, tailles: [] });
    expect('metiers' in lire('?loyer=1200')).toBe(false);
    expect('metiers' in lire('?loyer=1200&metier=ZZ999,:10,')).toBe(false);
    expect('metiers' in lireAdresse('?loyer=1200')).toBe(false);
    expect(ecrireAdresse(lire('?loyer=1200&metier=ZZ999'))).toBe('/?loyer=1200');
  });
  it('avant le chargement (codes inconnus) : l’adresse garde les métiers tels quels, sans doublon ni niveau inconnu ; le chargement les trie', () => {
    const avant = lireAdresse('?loyer=1200&metier=V1X80:10,ZZ999:25,U1X82:50,V1X80,V2X90');
    expect(ecrireAdresse(avant)).toBe('/?loyer=1200&metier=V1X80:10,ZZ999:25,U1X82,V2X90');
    const apres = garderMetiersConnus(avant, codes);
    expect(ecrireAdresse(apres)).toBe('/?loyer=1200&metier=V1X80:10,U1X82');
    expect('metiers' in garderMetiersConnus(lireAdresse('?metier=ZZ999'), codes)).toBe(false);
  });
});

// AC-12 : les vraies données de public/data, par les mêmes fonctions que la page (lecture, jointure, distances, évaluation,
// raisons).
describe('AC-12 (vraies données)', () => {
  const lireJson = <T,>(nom: string) => JSON.parse(readFileSync(new URL(`../../public/data/${nom}`, import.meta.url), 'utf8')) as T;
  const vrai = lireJson<EmploiJson>('emploi.json');
  const communes = joindreEmploi(lireJson<{ communes: LigneCommunes[] }>('communes.json').communes.map(communeDeLigne), vrai);
  const reperes = lireJson<{ reperes: number[][] }>('reperes.json').reperes;
  const e = lireEmploi(vrai, communes, reperes);
  const i = (c: string) => communes.findIndex((x) => x.code === c);
  const [BORDEAUX, PAU, LA_ROCHELLE] = ['33063', '64445', '17300'];
  const raisons = (res: ReturnType<typeof evaluer>, c: string) =>
    res.parCode
      .get(c)!
      .raisons.filter((r) => r.critere === 'metier')
      .map((r) => texte(raisonTexte(avecPlusProche(e, i(c), r as Extract<Raison, { critere: 'metier' }>))));

  it('AC-12 389 bassins, 217 métiers chiffrés dans au moins 6 bassins, 34 746 communes avec un bassin ; M2X90 : 39, 98, 120 ; Bordeaux « 10 » avec 742 ; La Rochelle sans chiffre', () => {
    expect(vrai.bassins).toHaveLength(389);
    expect(vrai.metiers).toHaveLength(217);
    expect(Math.min(...vrai.metiers.map((m) => m.bassins.length))).toBeGreaterThanOrEqual(6);
    expect(communes).toHaveLength(34746);
    expect(communes.filter((c) => c.bassin != null)).toHaveLength(34746);
    const m = e.metiers.get('M2X90')!;
    const niveaux = [...m.bassins.values()].map((b) => b.niveau);
    expect([niveaux.filter((n) => n === '10').length, niveaux.filter((n) => n !== 'tous').length, niveaux.length]).toEqual([39, 98, 120]);
    expect(m.bassins.get(communes[i(BORDEAUX)].bassin!)).toEqual({ projets: 742, niveau: '10' });
    expect(m.bassins.has(communes[i(LA_ROCHELLE)].bassin!)).toBe(false);
  });

  it('AC-12 infirmiers à « 10 % » : Bordeaux et Pau passent ; raison de La Rochelle (La Roche-sur-Yon, 61 km)', () => {
    const res = evaluer(communes, { ...SANS_PLAFOND, metiers: [{ code: 'V1X80', niveau: '10' }] }, [], undefined, e);
    expect(res.parCode.get(BORDEAUX)!.passe).toBe(true);
    expect(res.parCode.get(PAU)!.passe).toBe(true);
    expect(raisons(res, LA_ROCHELLE)).toEqual([
      'Infirmiers et sages-femmes : aucun bassin parmi les 10 % qui recrutent le plus dans un rayon de 30 km (le plus proche : La Roche-sur-Yon, 61 km)',
    ]);
  });

  it('AC-12 avec M2X90 à « 10 % » en plus : Pau ne passe plus (Bayonne, 92 km)', () => {
    const res = evaluer(communes, { ...SANS_PLAFOND, metiers: [{ code: 'V1X80', niveau: '10' }, { code: 'M2X90', niveau: '10' }] }, [], undefined, e);
    expect(res.parCode.get(PAU)!.passe).toBe(false);
    expect(raisons(res, PAU)).toEqual([
      "Ingénieurs et cadres d'étude, recherche et développement en informatique et télécom : aucun bassin parmi les 10 % qui recrutent le plus dans un rayon de 30 km (le plus proche : Bayonne, 92 km)",
    ]);
  });

  it('le tri par latitude ne perd aucune ville principale à 30 km (une commune sur 20, contre le calcul complet)', () => {
    for (let c = 0; c < communes.length; c += 20) {
      const complet = e.bassins.map((_, k) => k).filter((k) => e.distance(c, k) <= 30);
      expect([...e.aTrente.bassin.slice(e.aTrente.debut[c], e.aTrente.debut[c + 1])].sort((a, b) => a - b), communes[c].nom).toEqual(complet);
    }
  });

  it('AC-12 M2X90 seul à « 10 % » : 4 588 communes (± 1 %, de 4 542 à 4 634)', () => {
    const res = evaluer(communes, { ...SANS_PLAFOND, metiers: [{ code: 'M2X90', niveau: '10' }] }, [], undefined, e);
    const n = [...res.parCode.values()].filter((x) => x.passe).length;
    console.log(`AC-12 : M2X90 à « 10 % », ${n} communes passent`);
    expect(n).toBeGreaterThanOrEqual(4542);
    expect(n).toBeLessThanOrEqual(4634);
  });
});

// Tâche 2 : les lignes de la fiche (R47, H136, H138, H139). Le libellé est séparé du reste de la ligne (design F : libellé
// en `texte-fort`) ; le texte lu est celui de R47.
describe('R47 : lignes des métiers et du chômage dans la fiche', () => {
  const ligne = (id: Id, choisi: MetierChoisi, e: Emploi = emploi, communes = six) => {
    const l = ligneMetier(e, communes.findIndex((c) => c.code === code[id]), choisi);
    if (!l) return null;
    const { libelle, reste } = metierFiche(l);
    return texte(`${libelle} : ${reste}`);
  };
  const chomage = (id: Id) => texte(chomageFiche(six.find((c) => c.code === code[id])!, emploi.trimestre));

  it('AC-10 (calcul) /?loyer=1200&metier=V1X80:25,V2X90 : Quaibleu, Grandeville et Terrebasse', () => {
    const metiers: MetierChoisi[] = [{ code: 'V1X80', niveau: '25' }, { code: 'V2X90', niveau: null }];
    const lignes = (id: Id) => [...metiers.map((m) => ligne(id, m)), chomage(id)];
    expect(lignes('E')).toEqual([
      'Infirmiers et sages-femmes : Grandeville, à 28 km, parmi les 25 % de bassins qui recrutent le plus · 626 recrutements prévus en 2026',
      'Médecins : bassin de Montcher, 410 recrutements prévus en 2026',
      "Chômage : 6,8 % dans la zone d'emploi de Montcher (2e trimestre 2026)",
    ]);
    expect(lignes('B')).toEqual([
      'Infirmiers et sages-femmes : Grandeville, sur place, parmi les 25 % de bassins qui recrutent le plus · 626 recrutements prévus en 2026',
      'Médecins : bassin de Grandeville, 120 recrutements prévus en 2026',
      "Chômage : 7,1 % dans la zone d'emploi de Grandeville (2e trimestre 2026)",
    ]);
    expect(lignes('D')).toEqual([
      'Infirmiers et sages-femmes : Montcher, à 29 km, parmi les 10 % de bassins qui recrutent le plus · 1 680 recrutements prévus en 2026',
      'Médecins : bassin de Grandeville, 120 recrutements prévus en 2026',
      "Chômage : 7,1 % dans la zone d'emploi de Grandeville (2e trimestre 2026)",
    ]);
  });

  it('les trois niveaux écrits : le plus étroit du bassin le plus proche (« 10 % », « 25 % », « bassin où ce métier recrute »)', () => {
    // Terrebasse, « 25 % » coché : Montcher (29 km) est à « 10 » ; c'est son niveau à lui qui est écrit.
    expect(ligne('D', { code: 'V1X80', niveau: '25' })).toContain('Montcher, à 29 km, parmi les 10 % de bassins qui recrutent le plus');
    expect(ligne('A', { code: 'V1X80', niveau: '25' })).toBe('Infirmiers et sages-femmes : Grandeville, à 25 km, parmi les 25 % de bassins qui recrutent le plus · 626 recrutements prévus en 2026');
    // AC-5 : Rhinval, « Partout où il recrute ».
    expect(ligne('F', { code: 'V1X80', niveau: 'tous' })).toBe('Infirmiers et sages-femmes : Rhinval, sur place, bassin où ce métier recrute · 66 recrutements prévus en 2026');
  });

  it('sans niveau, ou la commune ne passe pas : le bassin de la commune et ses projets, ou « pas de chiffre publié pour ce métier » (AC-9)', () => {
    expect(ligne('B', { code: 'U1X82', niveau: null })).toBe(`${LIB.U1X82} : bassin de Grandeville, pas de chiffre publié pour ce métier`);
    expect(ligne('C', { code: 'U1X82', niveau: null })).toBe(`${LIB.U1X82} : bassin de Montcher, 1 027 recrutements prévus en 2026`);
    expect(ligne('F', { code: 'U1X82', niveau: 'tous' })).toBe(`${LIB.U1X82} : bassin de Rhinval, pas de chiffre publié pour ce métier`);
    // AC-6 : Portmer, écartée par les graphistes à « 10 % » : le bassin de Portmer (Grandeville), sans chiffre.
    expect(ligne('A', { code: 'U1X82', niveau: '10' })).toBe(`${LIB.U1X82} : bassin de Grandeville, pas de chiffre publié pour ce métier`);
    // Quaibleu, infirmiers à « 10 % » : écartée (Montcher à 45 km) ; le bassin de Quaibleu est celui de Montcher.
    expect(ligne('E', { code: 'V1X80', niveau: '10' })).toBe('Infirmiers et sages-femmes : bassin de Montcher, 1 680 recrutements prévus en 2026');
  });

  it('chômage : une décimale, « Chômage : inconnu » sans zone (Rhinval, H138)', () => {
    expect(chomage('F')).toBe('Chômage : inconnu');
    expect(texte(chomageFiche({ zoneEmploi: 'Pau', chomage: 7 }, '2e trimestre 2026'))).toBe("Chômage : 7,0 % dans la zone d'emploi de Pau (2e trimestre 2026)");
  });

  it('espaces insécables : milliers, avant « recrutements », avant « % », dans le trimestre', () => {
    const l = metierFiche(ligneMetier(emploi, IDS.indexOf('D'), { code: 'V1X80', niveau: '10' })!);
    expect(l.libelle).toBe('Infirmiers et sages-femmes');
    expect(l.reste).toContain('1 680 recrutements prévus en 2026');
    expect(l.reste).toContain('les 10 % de bassins');
    expect(l.reste).toContain('à 29 km');
    expect(chomageFiche(six[IDS.indexOf('E')], emploi.trimestre)).toBe("Chômage : 6,8 % dans la zone d'emploi de Montcher (2e trimestre 2026)");
  });

  it('jeu sans bassin (comme « métropole ») : pas de ligne de métier, « Chômage : inconnu »', () => {
    const vide = emploiFixture([]);
    const communes = joindreEmploi(sixSans, vide);
    const e = lireEmploi(vide, communes, communes.map(() => [0, 0]));
    expect(ligne('B', { code: 'V1X80', niveau: null }, e, communes)).toBeNull();
    expect(ligne('B', { code: 'V1X80', niveau: 'tous' }, e, communes)).toBeNull();
    expect(texte(chomageFiche(communes[1], e.trimestre))).toBe('Chômage : inconnu');
  });

  describe('distances calculées : « à n km », « à moins d’1 km », « sur place »', () => {
    // Comme « distances calculées (H136) » : V, ville principale ; A à 30,4 km, B à 30,6 km, C à 0,4 km, D à 1,4 km.
    const json: EmploiJson = {
      trimestre_chomage: '2e trimestre 2026',
      bassins: [['B9', '99101']],
      zones: [],
      metiers: [{ code: 'M1', libelle: 'Métier', noms: [], peu_chiffre: false, bassins: [['B9', 1234, '10']] }],
      communes: ['99101', '99102', '99103', '99104', '99105'].map((c) => [c, 'B9', null]),
    };
    const communes = joindreEmploi(['Villebas', 'Aval', 'Bval', 'Cval', 'Dval'].map((n, i) => commune(`9910${i + 1}`, n)), json);
    const e = lireEmploi(json, communes, [[2, 45], [2, aNord(30.4)], [2, aNord(30.6)], [2, aNord(0.4)], [2, aNord(1.4)]]);
    const l = (i: number) => {
      const x = metierFiche(ligneMetier(e, i, { code: 'M1', niveau: '10' })!);
      return texte(`${x.libelle} : ${x.reste}`);
    };
    const suite = ', parmi les 10 % de bassins qui recrutent le plus · 1 234 recrutements prévus en 2026';

    it('la ville elle-même « sur place » ; 0,4 km « à moins d’1 km » ; 1,4 km « à 1 km » ; 30,4 km « à 30 km » (passe)', () => {
      expect(l(0)).toBe(`Métier : Villebas, sur place${suite}`);
      expect(l(3)).toBe(`Métier : Villebas, à moins d'1 km${suite}`);
      expect(l(4)).toBe(`Métier : Villebas, à 1 km${suite}`);
      expect(l(1)).toBe(`Métier : Villebas, à 30 km${suite}`);
    });
    it('30,6 km : la commune ne passe pas, la ligne dit son bassin', () => {
      expect(l(2)).toBe('Métier : bassin de Villebas, 1 234 recrutements prévus en 2026');
    });
  });
});

// Tâche 3a : la recherche du champ « Ton métier » (R44, H133, H134) et le résumé de « Emploi » repliée (H132).
describe('H133 : recherche de métiers', () => {
  const libelles = (q: string, exclus: string[] = []) => chercherMetiers(emploi.metiers.values(), q, exclus).map((m) => m.libelle);
  const ING = LIB.M2X90;

  it('AC-2 fixture « 6 communes » : « i », « medecin », « dévelop », « developpeur », « femm », « etude », « xyz »', () => {
    expect(libelles('i')).toEqual([]);
    expect(libelles('medecin')).toEqual(['Médecins']);
    expect(libelles('dévelop')).toEqual([ING]);
    expect(libelles('developpeur')).toEqual([ING]); // nom courant « développeur »
    expect(libelles('femm')).toEqual(['Infirmiers et sages-femmes']); // mot après un tiret, une seule fois (libellé et « sage-femme »)
    expect(libelles('etude')).toEqual([ING]); // mot après une apostrophe, accent ignoré
    expect(libelles('xyz')).toEqual([]);
  });

  it('AC-1 « infirm » : une seule suggestion, « Infirmiers et sages-femmes »', () => {
    expect(libelles('infirm')).toEqual(['Infirmiers et sages-femmes']);
  });

  it('AC-3 un métier déjà choisi n’est pas proposé', () => {
    expect(libelles('infirm', ['V1X80'])).toEqual([]);
    expect(libelles('graph', ['V1X80'])).toEqual([LIB.U1X82]);
  });

  it('accents et casse ignorés, dans le texte tapé comme dans le libellé ; espaces autour ignorés', () => {
    expect(libelles('MÉDECIN')).toEqual(['Médecins']);
    expect(libelles('  ingénieurs ')).toEqual([ING]);
    expect(libelles('INGENIEURS')).toEqual([ING]);
  });

  it('un mot commence au début, après une espace, un tiret, une apostrophe, une virgule ou une parenthèse ; jamais au milieu d’un mot', () => {
    const m = (code: string, libelle: string, noms: string[] = []): Metier => ({ code, libelle, noms, peuChiffre: false, bassins: new Map() });
    const liste = [m('A1', 'Cadres administratifs, comptables et financiers (hors juristes)'), m('A2', "Agents d'entretien"), m('A3', 'Aides-soignants')];
    const q = (t: string) => chercherMetiers(liste, t).map((x) => x.code);
    expect(q('comptab')).toEqual(['A1']); // après une virgule et une espace
    expect(q('hors')).toEqual(['A1']); // après une parenthèse
    expect(q('juristes)')).toEqual(['A1']);
    expect(q('entret')).toEqual(['A2']); // après une apostrophe
    expect(q('soign')).toEqual(['A3']); // après un tiret
    expect(q('omptab')).toEqual([]); // milieu d'un mot
    expect(q('agents d’entretien')).toEqual(['A2']); // plusieurs mots, apostrophe typographique
    expect(q('aides soign')).toEqual(['A3']); // une espace à la place du tiret
  });

  it('ordre : trouvés par leur libellé d’abord, puis par un nom courant, chacun dans l’ordre alphabétique ; 8 au plus ; chacun une fois', () => {
    const m = (code: string, libelle: string, noms: string[] = []): Metier => ({ code, libelle, noms, peuChiffre: false, bassins: new Map() });
    const liste = [
      m('N2', 'Vendeurs', ['conseiller de vente']),
      m('L3', 'Conseillers clientèle'),
      m('N1', 'Agents de sécurité', ['convoyeur']),
      m('L1', 'Conducteurs de bus', ['conducteur']),
      m('L2', 'Cadres commerciaux', ['conseiller commercial']),
    ];
    // Par le libellé : « Conducteurs de bus », « Conseillers clientèle » ; par un nom courant : « Agents de sécurité »
    // (« convoyeur »), « Cadres commerciaux » (« conseiller commercial »), « Vendeurs » ; « Conducteurs » une seule fois.
    expect(chercherMetiers(liste, 'con').map((x) => x.code)).toEqual(['L1', 'L3', 'N1', 'L2', 'N2']);
    const beaucoup = Array.from({ length: 12 }, (_, i) => m(`X${i}`, `Agents ${String.fromCharCode(108 - i)}`));
    const trouves = chercherMetiers(beaucoup, 'agents');
    expect(trouves).toHaveLength(8);
    expect(trouves.map((x) => x.libelle)).toEqual([...beaucoup.map((x) => x.libelle)].sort((a, b) => a.localeCompare(b, 'fr')).slice(0, 8));
  });

  it('moins de 2 caractères (espaces non comptées) : aucune suggestion', () => {
    expect(libelles('')).toEqual([]);
    expect(libelles(' m ')).toEqual([]);
    expect(libelles('me')).toEqual(['Médecins']);
  });
});

describe('H132 : résumé de « Emploi » repliée', () => {
  it('« Peu importe », « 1 métier », « 2 métiers »', () => {
    expect(texte(resumeEmploi({ ...REGLAGES_DEPART }))).toBe('Peu importe');
    expect(texte(resumeEmploi({ ...REGLAGES_DEPART, metiers: [{ code: 'V1X80', niveau: null }] }))).toBe('1 métier');
    expect(texte(resumeEmploi({ ...REGLAGES_DEPART, metiers: [{ code: 'V1X80', niveau: '10' }, { code: 'U1X82', niveau: null }] }))).toBe('2 métiers');
  });
});
