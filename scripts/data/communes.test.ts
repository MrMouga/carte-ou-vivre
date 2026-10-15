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

  // Tranche cadre-de-vie, tâche 1 : type d'environnement (grille communale de densité Insee 2025, D10, H71, H72) et
  // distance à la montagne (zonage loi Montagne du Cerema, communes 2019, R29, H81), colonnes ajoutées à la fin.
  const typeEnv = (code: string) => byCode.get(code)![col('type_env')];
  it("D10 : les deux colonnes sont à la fin ; chaque commune a un type d'environnement parmi les 4 de H71 et une distance à la montagne", () => {
    expect(champs.slice(-2)).toEqual(['type_env', 'montagne_km']);
    expect(communes).toHaveLength(34746);
    const niveaux = new Set(['ville-dense', 'ville-et-peripherie', 'bourg-et-village', 'campagne-isolee']);
    expect(communes.filter((r) => !niveaux.has(r[col('type_env')] as string))).toEqual([]);
    expect(communes.filter((r) => typeof r[col('montagne_km')] !== 'number' || (r[col('montagne_km')] as number) < 0)).toEqual([]);
  });

  it('D10 : Bordeaux ville-dense (DENS7 1), Lacanau bourg-et-village (5), Chamonix ville-et-peripherie (3), Cans et Cévennes campagne-isolee (7)', () => {
    expect(typeEnv('33063')).toBe('ville-dense');
    expect(typeEnv('33214')).toBe('bourg-et-village');
    expect(typeEnv('74056')).toBe('ville-et-peripherie');
    expect(typeEnv('48166')).toBe('campagne-isolee');
  });

  // Corrections 1 (2026-10-15) : km à deux décimales, tronqués (172,787 → 172,78 ; 0,651 → 0,65 ; 13,699 → 13,69).
  it('R29 : Bordeaux à 172,78 km de la montagne (Turenne, Corrèze), Grenoble à 0,65 km, Lyon à 13,69 km (mesures de la tâche 0)', () => {
    expect(get('33063', 'montagne_km')).toBe(172.78);
    expect(get('38185', 'montagne_km')).toBe(0.65);
    expect(get('69123', 'montagne_km')).toBe(13.69);
  });

  // Corrections 1 : la distance n'est plus arrondie deux fois (0,1 km puis le km affiché). Mesures de montagne.py :
  // Clermont-Ferrand 2,465 km, Lissac-sur-Couze 10,495 km, Raon-lès-Leau 0,024 km (hors zone).
  it('R29 : Clermont-Ferrand à 2,46 km (affiché 2, pas 3) ; Lissac-sur-Couze à 10,49 km (affiché 10, pas 11) ; Raon-lès-Leau hors zone à 0,02 km, pas 0', () => {
    expect(get('63113', 'montagne_km')).toBe(2.46);
    expect(get('19117', 'montagne_km')).toBe(10.49);
    expect(get('54443', 'montagne_km')).toBe(0.02);
  });

  it('R29 : 0 pour une commune classée, en totalité (Chamonix-Mont-Blanc) ou en partie (Annecy, Saint-Étienne)', () => {
    for (const code of ['74056', '74010', '42218']) expect(get(code, 'montagne_km')).toBe(0);
  });

  it("Paris, Lyon et Marseille : ville-dense et une distance à la montagne (d'un seul tenant)", () => {
    for (const code of ['75056', '69123', '13055']) {
      expect(typeEnv(code)).toBe('ville-dense');
      expect(get(code, 'montagne_km')).toBeGreaterThan(0);
    }
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
    const sources = new Set(['commune', 'secteur', 'tous-biens', 'tous-biens-secteur', 'inconnu-secteur', 'inconnu-alsace-moselle']);
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

  it("R24 et D12 : Agnicourt-et-Séchelles (02004) prend en appartement le prix tous biens (733 €/m²) ; Île-de-Sein (29083), sans aucune vente, reste sans prix", () => {
    expect(prix('02004')).toMatchObject({ appartement_m2: 733, appartement_source: 'tous-biens' });
    expect(prix('29083')).toMatchObject({ maison_m2: null, maison_source: 'inconnu-secteur' });
  });

  // D12 d'immobilier (Vincent, 2026-10-15) : sans prix du bien, la même règle sur le prix tous biens (apt_maison) de la
  // commune (`tous-biens`), puis de son intercommunalité (`tous-biens-secteur`). Mesures de la tâche 0 de cadre-de-vie.
  it('D12 : Desvres (62268) 1 493 €/m² tous-biens et Tingry (62821) 1 714 €/m² tous-biens-secteur, en appartement', () => {
    expect(prix('62268')).toMatchObject({ appartement_m2: 1493, appartement_source: 'tous-biens' });
    expect(prix('62821')).toMatchObject({ appartement_m2: 1714, appartement_source: 'tous-biens-secteur' });
  });

  it('D12 : hors Alsace-Moselle, Île-de-Sein (29083) est la seule commune sans prix, en appartement comme en maison', () => {
    const { communes: l } = achat();
    expect(l.filter((r) => r[2] === 'inconnu-secteur').map((r) => r[0])).toEqual(['29083']);
    expect(l.filter((r) => r[4] === 'inconnu-secteur').map((r) => r[0])).toEqual(['29083']);
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
