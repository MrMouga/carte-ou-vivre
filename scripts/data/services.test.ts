import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ecrireServices, lireServices, SERVICES, type ServiceCle, type ServicesJson, type TempsServices } from '../../src/domain/services';

// Tranche services, tâche 0b : les temps de chaque commune (R52), calculés par scripts/data/services.py et servis dans
// public/data/services.json (format de « Le fichier des temps » du plan).
const lireJson = (chemin: string) => JSON.parse(readFileSync(new URL(chemin, import.meta.url), 'utf8'));
const acceptance = lireJson('../../docs/specs/2026-11-23-services/acceptance.json');
const script = fileURLToPath(new URL('./services.py', import.meta.url));
const lancer = (option: string, fichier: string) =>
  JSON.parse(execFileSync('python3', ['-I', script, option, fichier], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));

// Colonnes de services-carreaux.csv (tâche 0a ; D106 ajouté par la révision D19), sans `iris` : une ligne = une part
// de population.
const TYPES = ['D265', 'D106', 'B104', 'B105', 'B201', 'B202', 'D502', 'C107', 'C108', 'C109', 'C201', 'C301', 'C302',
  'C501', 'C502', 'C503', 'C504', 'C505', 'C509', 'E107', 'E108', 'E109'];
// Services écrits par services.py (ordre de R54 révisée) ; `commerce` y reste provisoirement jusqu'à la tâche 2 de la
// révision D19, D20 (plan 2026-11-26-services-revision), qui le retire du script et d'ici.
const SERVICES_PY = ['medecin', 'urgences', 'supermarche', 'creche', 'ecole', 'college', 'lycee', 'superieur', 'gare',
  'gare_regionale', 'gare_grandes_lignes', 'commerce'];
/** Les services du script à « pas de chiffre », sauf ceux donnés. */
const tempsPy = (valeurs: Record<string, number>) => ({
  ...Object.fromEntries(SERVICES_PY.map((s) => [s, null])),
  ...valeurs,
});
type Carreau = { depcom: string; carreau: string; pop: number } & Record<string, unknown>;
const ligneCsv = (c: Carreau) =>
  [c.depcom, c.carreau, String(c.pop), ...TYPES.map((t) => (c[t] === undefined || c[t] === null ? '' : String(c[t])))].join(',');

/** Les 11 services à « pas de chiffre », sauf ceux donnés. */
const temps = (valeurs: Partial<TempsServices>): TempsServices => ({
  ...(Object.fromEntries(SERVICES.map((s) => [s.cle, null])) as TempsServices),
  ...valeurs,
});

describe('scripts/data/services.py --extrait (R52)', () => {
  it("AC-5 : supermarché de X 9 min (épicerie B202 non comptée), médecin de Y 2, de Z 3, de V 9, lycée de W 9 ; arrondis 0,4 → 1, 4,49 → 4, 4,5 → 5 ; ville à arrondissements 3 min", () => {
    const ex = acceptance.fixture.extrait_carreaux;
    // Un code de commune inventé par bloc ; `pop_du_carreau_entier` n'est pas lu (la part de la commune est `pop`).
    const blocs: [string, string][] = [
      ['commune_X_supermarche', '99101'],
      ['commune_Y_egalite_medecin', '99102'],
      ['commune_Z_carreau_sans_temps_medecin', '99103'],
      ['commune_V_carreau_a_cheval_medecin', '99104'],
      ['commune_W_lycee', '99105'],
    ];
    const carreaux: Carreau[] = blocs.flatMap(([bloc, code]) =>
      (ex[bloc] as Carreau[]).map((c) => ({ ...c, depcom: code })));
    // Chaque arrondi : une commune d'un seul carreau de population 1.
    const arrondis = Object.keys(ex.arrondis_medecin).map((brut, i) => ({ code: `9920${i + 1}`, brut, attendu: ex.arrondis_medecin[brut] as number }));
    for (const a of arrondis) carreaux.push({ depcom: a.code, carreau: `a${a.code}`, pop: 1, D265: a.brut });
    // Arrondissements : leurs codes, résultat sous 75056.
    (ex.ville_a_arrondissements_medecin as Carreau[]).forEach((c, i) => carreaux.push({ ...c, carreau: `p${i + 1}` }));

    const dossier = mkdtempSync(join(tmpdir(), 'services-'));
    const fichier = join(dossier, 'extrait.csv');
    writeFileSync(fichier, ['depcom,idSrc,pop,' + TYPES.join(','), ...carreaux.map(ligneCsv)].join('\n') + '\n');
    const sortie = lancer('--extrait', fichier) as Record<string, TempsServices>;

    expect(sortie).toEqual({
      // `commerce` provisoire (B104, B105, B201, B202 : l'épicerie compte, 4 min) jusqu'à la tâche 2 de la révision.
      '99101': tempsPy({ supermarche: 9, commerce: 4 }),
      '99102': tempsPy({ medecin: 2 }),
      '99103': tempsPy({ medecin: 3 }),
      '99104': tempsPy({ medecin: 9 }),
      '99105': tempsPy({ lycee: 9 }),
      ...Object.fromEntries(arrondis.map((a) => [a.code, tempsPy({ medecin: a.attendu })])),
      '75056': tempsPy({ medecin: 3 }),
    });
    expect(arrondis.map((a) => [a.brut, a.attendu])).toEqual([['0.4', 1], ['4.49', 4], ['4.5', 5]]);
  });
});

describe('scripts/data/services.py --grandes-lignes (R52)', () => {
  it('AC-16 : g1 3 min, g2 5, g3 15, g4 70 (« plus d\'une heure »), g5 et g6 pas de chiffre', () => {
    const dossier = mkdtempSync(join(tmpdir(), 'services-'));
    const fichier = join(dossier, 'grandes-lignes.json');
    writeFileSync(fichier, JSON.stringify(acceptance.fixture.extrait_carreaux.temps_grandes_lignes));
    const sortie = lancer('--grandes-lignes', fichier) as Record<string, number | null>;
    expect(sortie).toEqual({ g1: 3, g2: 5, g3: 15, g4: 70, g5: null, g6: null });

    // 70 min s'écrit « 61 ou plus » dans le fichier servi : la page lit 61 (« plus d'une heure »).
    const servi = lireServices(ecrireServices([{ code: 'g4', temps: temps({ gare_grandes_lignes: sortie.g4 }) }]));
    expect(servi.temps.get('g4')?.[SERVICES.findIndex((s) => s.cle === 'gare_grandes_lignes')]).toBe(61);
  });
});

describe('public/data/services.json (R52, vraies données)', () => {
  const PLUS_D_UNE_HEURE = 61; // « 61 ou plus » : au-delà de 60

  it("AC-13 : une ligne par commune de la carte ; Auch, Bordeaux, Mende, Saint-Véran, Chamonix-Mont-Blanc, Les Sables-d'Olonne, L'Île-d'Yeu et les 6 communes de population 0 ; aucune colonne commerce", () => {
    const json = lireJson('../../public/data/services.json') as ServicesJson;
    const servi = lireServices(json);
    const valeurs = (code: string) => {
      const t = servi.temps.get(code);
      if (!t) throw new Error(`commune ${code} absente du fichier`);
      return Object.fromEntries(SERVICES.map((s, i) => [s.cle, t[i]])) as Record<ServiceCle, number | null>;
    };
    const carte = lireJson('../../public/data/communes.json') as { communes: unknown[][] };
    const codes = carte.communes.map((c) => c[0] as string);
    expect(codes.length).toBe(34746);
    expect(servi.temps.size).toBe(34746);
    expect(codes.every((c) => servi.temps.has(c))).toBe(true);

    // Ordre de R54 révisée : médecin, urgences, supermarché, crèche, école, collège, lycée, supérieur, gare, gare
    // régionale, gare grandes lignes.
    expect(Object.values(valeurs('32013'))).toEqual([2, 6, 2, 3, 2, 3, 3, 4, 4, 4, PLUS_D_UNE_HEURE]);
    expect(Object.values(valeurs('33063'))).toEqual([1, 5, 1, 1, 1, 2, 2, 3, 5, 7, 7]);
    const mende = valeurs('48095');
    expect([mende.urgences, mende.superieur, mende.gare, mende.gare_regionale, mende.gare_grandes_lignes]).toEqual([4, 2, 3, PLUS_D_UNE_HEURE, PLUS_D_UNE_HEURE]);
    const veran = valeurs('05157');
    expect([veran.urgences, veran.supermarche]).toEqual([55, 35]);
    const chamonix = valeurs('74056');
    expect([chamonix.urgences, chamonix.supermarche]).toEqual([4, 3]);
    const sables = valeurs('85194');
    expect([sables.urgences, sables.gare_grandes_lignes]).toEqual([7, 4]);
    const yeu = valeurs('85113');
    expect([yeu.medecin, yeu.urgences, yeu.lycee, yeu.superieur, yeu.gare, yeu.gare_regionale, yeu.gare_grandes_lignes]).toEqual(Array(7).fill(null));
    expect(yeu.supermarche).toBe(4);
    for (const code of ['55039', '55050', '55139', '55189', '55239', '55307']) {
      expect(Object.values(valeurs(code)), code).toEqual(Array(11).fill(null));
    }
    // Aucune colonne commerce (D20) : rouge tant que la tâche 2 de la révision n'a pas régénéré le fichier.
    expect(Object.keys(json)).not.toContain('commerce');
  });
});

describe('src/domain/services.ts — alphabet du fichier des temps', () => {
  it('aller-retour : 60 → 60, 61 → 61, 75 → 61 (« 61 ou plus »), pas de chiffre → null', () => {
    const lignes = [
      { code: '99001', temps: temps({ medecin: 60, urgences: 1 }) },
      { code: '99002', temps: temps({ medecin: 61 }) },
      { code: '99003', temps: temps({ medecin: 75 }), ile_sans_pont: true },
      { code: '99004', temps: temps({}) },
    ];
    const json = ecrireServices(lignes);
    expect(json.codes).toEqual(['99001', '99002', '99003', '99004']);
    expect(json.medecin).toBe('yzz-'); // rang 60 de l'alphabet : « y » ; rang 61 : « z »
    expect(json.urgences).toBe('1---');
    expect(json.iles_sans_pont).toEqual(['99003']);
    const lu = lireServices(json);
    expect(lu.temps.get('99001')?.slice(0, 2)).toEqual([60, 1]);
    expect(lu.temps.get('99002')?.[0]).toBe(61);
    expect(lu.temps.get('99003')?.[0]).toBe(61);
    expect(lu.temps.get('99004')).toEqual(Array(11).fill(null));
    expect([...lu.iles]).toEqual(['99003']);
  });
});
