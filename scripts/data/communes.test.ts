import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Contrôles du fichier servi (tâche 1a) : les chiffres de référence de la discovery, par code INSEE ; distances depuis
// la mairie depuis D18 (tâche 8).
const { champs, communes } = JSON.parse(readFileSync(new URL('../../public/data/communes.json', import.meta.url), 'utf8')) as {
  champs: string[];
  communes: unknown[][];
};
const col = (name: string) => champs.indexOf(name);
const byCode = new Map(communes.map((r) => [r[0] as string, r]));
const get = (code: string, name: string) => byCode.get(code)![col(name)] as number;

// Repères (tâche 8, D18) : une ligne par commune, dans le même ordre ; le rond est posé sur la mairie.
const { reperes } = JSON.parse(readFileSync(new URL('../../public/data/reperes.json', import.meta.url), 'utf8')) as { reperes: number[][] };

describe('public/data/communes.json', () => {
  it('34 746 communes de métropole, toutes avec population, loyer et distance à la mer', () => {
    expect(communes).toHaveLength(34746);
    for (const name of ['population', 'loyer_m2', 'mer_km']) expect(communes.filter((r) => r[col(name)] == null)).toEqual([]);
  });

  it('Bordeaux (33063) : 832 € pour 52 m², 16,0 €/m², 39 km de la mer (D18)', () => {
    expect(Math.round(get('33063', 'loyer_m2') * 52)).toBe(832);
    expect(get('33063', 'loyer_m2').toFixed(1)).toBe('16.0');
    expect(Math.round(get('33063', 'mer_km'))).toBe(39);
  });

  it("La Rochelle (17300) à moins d'1 km de la mer (D18), la homonyme de Haute-Saône (70450) loin", () => {
    expect(get('17300', 'mer_km')).toBeLessThan(1);
    expect(get('70450', 'mer_km')).toBeGreaterThan(300);
  });

  it("Adour corrigé : Port-de-Lanne, Saint-Étienne-d'Orthe et Sames au-delà de 2 km", () => {
    for (const code of ['40231', '40256', '64502']) expect(get(code, 'mer_km')).toBeGreaterThan(2);
  });

  it('repères : une ligne par commune ; le rond de Bordeaux est sur sa mairie, dans son cadre (D18)', () => {
    expect(reperes).toHaveLength(communes.length);
    const [lon, lat, ouest, sud, est, nord] = reperes[communes.findIndex((r) => r[0] === '33063')];
    expect(lon).toBeCloseTo(-0.5794, 4);
    expect(lat).toBeCloseTo(44.8379, 4);
    expect(lon > ouest && lon < est && lat > sud && lat < nord).toBe(true);
  });

  it("Paris, Lyon et Marseille d'un seul tenant, sans arrondissement", () => {
    for (const code of ['75056', '69123', '13055']) expect(byCode.has(code)).toBe(true);
    expect([...byCode.keys()].filter((c) => /^(751\d\d|6938\d|132\d\d)$/.test(c))).toEqual([]);
  });

  // Tranche immobilier, tâche 0 : loyer des maisons (Carte des loyers 2025, fichier maisons), colonnes ajoutées à la fin.
  it('loyer des maisons : toutes les communes en ont un ; Bordeaux 15,5 €/m², estimation propre', () => {
    expect(communes.filter((r) => r[col('loyer_maison_m2')] == null)).toEqual([]);
    expect(get('33063', 'loyer_maison_m2')).toBeCloseTo(15.5092, 4);
    expect(byCode.get('33063')![col('estimation_propre_maison')]).toBe(true);
  });

  it("loyer des maisons de Paris : moyenne des 20 arrondissements, aucun n'est estimé seul (D10 de loyer-mer)", () => {
    expect(get('75056', 'loyer_maison_m2')).toBeGreaterThan(20);
    expect(byCode.get('75056')![col('estimation_propre_maison')]).toBe(false);
  });
});

// Prix d'achat (tranche immobilier, tâche 0 ; D5 révisée par Vincent le 2026-10-14, D8, H67, R24) : statistiques DVF
// d'Etalab, fichiers de juillet 2026. Règle 1 : ≥ 30 ventes du bien de 2023 à 2025 → médiane approchée 2023-2025 ;
// règle 2 : sinon ≥ 5 ventes de 2021 à 2025 → médiane 2021-2025 ; règle 3 : sinon l'intercommunalité (1 puis 2).
type Achat = { champs: string[]; communes: (string | number | null)[][] };
let lu: Achat | undefined; // lu une fois, au premier test (le fichier n'existe pas avant la tâche 0)
const achat = () => (lu ??= JSON.parse(readFileSync(new URL('../../public/data/achat.json', import.meta.url), 'utf8')) as Achat);
const prix = (code: string) => {
  const { champs: c, communes: l } = achat();
  const r = l.find((x) => x[0] === code)!;
  return Object.fromEntries(c.map((n, i) => [n, r[i]]));
};

describe('public/data/achat.json', () => {
  it('34 746 lignes, une par commune de communes.json, jointes par code INSEE', () => {
    const { champs: c, communes: l } = achat();
    expect(c).toEqual(['code', 'appartement_m2', 'appartement_source', 'maison_m2', 'maison_source']);
    expect(l).toHaveLength(34746);
    expect(new Set(l.map((r) => r[0]))).toEqual(new Set(byCode.keys()));
    const sources = new Set(['commune', 'secteur', 'inconnu-secteur', 'inconnu-alsace-moselle']);
    for (const r of l) {
      expect(sources.has(r[2] as string) && sources.has(r[4] as string)).toBe(true);
      expect(r[1] == null).toBe((r[2] as string).startsWith('inconnu'));
      expect(r[3] == null).toBe((r[4] as string).startsWith('inconnu'));
    }
  });

  it('D5 règle 1 Bordeaux (33063) : 9 654 ventes d’appartement 2023-2025 → 4 233 €/m² ; maison 5 067 €/m² (3 005 ventes)', () => {
    expect(prix('33063')).toEqual({ code: '33063', appartement_m2: 4233, appartement_source: 'commune', maison_m2: 5067, maison_source: 'commune' });
  });

  it('D5 règle 2 : sous 30 ventes récentes, la médiane 2021-2025 de la commune', () => {
    // Saint-Vincent-de-Paul (33487) : 24 ventes de maisons 2023-2025, 50 sur 2021-2025 → 2 487 €/m².
    expect(prix('33487')).toMatchObject({ maison_m2: 2487, maison_source: 'commune' });
    // Templeuve-en-Pévèle (59586) : 28 ventes d'appartements 2023-2025, 134 sur 2021-2025 → 3 519 €/m².
    expect(prix('59586')).toMatchObject({ appartement_m2: 3519, appartement_source: 'commune' });
  });

  it("D5 règle 3 Saint-Vincent-de-Paul (33487) : 1 vente d'appartement, prix récent de Bordeaux Métropole (3 700 €/m²)", () => {
    expect(prix('33487')).toMatchObject({ appartement_m2: 3700, appartement_source: 'secteur' });
  });

  it('D8 Strasbourg (67482) : inconnu-alsace-moselle pour les deux biens, comme toute la Moselle, le Bas-Rhin et le Haut-Rhin', () => {
    expect(prix('67482')).toEqual({ code: '67482', appartement_m2: null, appartement_source: 'inconnu-alsace-moselle', maison_m2: null, maison_source: 'inconnu-alsace-moselle' });
    const am = communes.filter((r) => ['57', '67', '68'].includes(r[col('dep')] as string)).map((r) => prix(r[0] as string));
    expect(am).toHaveLength(1605);
    expect(am.every((p) => p.appartement_source === 'inconnu-alsace-moselle' && p.maison_source === 'inconnu-alsace-moselle')).toBe(true);
  });

  it("R24 sans prix hors Alsace-Moselle : Agnicourt-et-Séchelles (02004) en appartement, Île-de-Sein (29083) en maison", () => {
    expect(prix('02004')).toMatchObject({ appartement_m2: null, appartement_source: 'inconnu-secteur' });
    expect(prix('29083')).toMatchObject({ maison_m2: null, maison_source: 'inconnu-secteur' });
  });

  // Seuil de Vincent (2026-10-14, reprise de la tâche 1) : un prix d'achat sous 300 €/m² n'est pas crédible (ventes en
  // bloc) ; le niveau suivant de la règle est pris (commune 1 → 2 → intercommunalité 1 → 2 → inconnu).
  it('seuil 300 €/m² : aucun prix d’achat sous 300 €/m², ni en appartement ni en maison', () => {
    const { communes: l } = achat();
    expect(l.filter((r) => (r[1] != null && (r[1] as number) < 300) || (r[3] != null && (r[3] as number) < 300))).toEqual([]);
  });

  it('seuil 300 €/m² : Guérigny (58131, 21 €/m² sur 39 ventes) et Civray (18066, 26 €/m²) prennent le prix récent de leur intercommunalité', () => {
    expect(prix('58131')).toMatchObject({ appartement_m2: 795, appartement_source: 'secteur' }); // CC Les Bertranges, 36 ventes 2023-2025
    expect(prix('18066')).toMatchObject({ appartement_m2: 873, appartement_source: 'secteur' }); // CC FerCher, 31 ventes 2023-2025
  });

  it('H67 Paris, Lyon, Marseille : moyenne simple des arrondissements, avec un prix pour les deux biens', () => {
    expect(prix('75056')).toMatchObject({ appartement_m2: 10640.35, appartement_source: 'commune', maison_source: 'secteur' });
    expect(prix('69123')).toMatchObject({ appartement_m2: 4652.22, appartement_source: 'commune', maison_source: 'secteur' });
    expect(prix('13055')).toMatchObject({ appartement_m2: 2945.12, appartement_source: 'commune', maison_source: 'secteur' });
    for (const code of ['75056', '69123', '13055']) expect(prix(code).maison_m2).toBeGreaterThan(0);
  });
});
