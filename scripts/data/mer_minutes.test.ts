import { execFile, execFileSync } from 'node:child_process';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

// Tranche recherche-et-mer, tâche 0a : la préparation et l'envoi des trajets mairie → point de côte (D4, H196),
// scripts/data/mer_minutes.py. Aucun test n'envoie de requête à openrouteservice : un faux service local répond.
const script = fileURLToPath(new URL('./mer_minutes.py', import.meta.url));
const MAX = 3500;

type Lot = { id: string; points: [number, number][]; communes: [string, number, number, number][] };
/** [code, lon et lat de la mairie, lon et lat du point de côte] */
type Commune = [string, number, number, number, number];

const lots = (communes: Commune[]): Lot[] => {
  const fichier = join(mkdtempSync(join(tmpdir(), 'mer-lots-')), 'extrait.json');
  writeFileSync(fichier, JSON.stringify({ communes }));
  return JSON.parse(execFileSync('python3', ['-I', script, '--lots-extrait', fichier], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 }));
};

/** n communes sur un même point de côte, codes à partir de `debut`. */
const surPoint = (n: number, debut: number, point: [number, number]): Commune[] =>
  Array.from({ length: n }, (_, i) => [String(debut + i).padStart(5, '0'), point[0] + 0.5 + i * 1e-5, point[1], point[0], point[1]]);

/** Points de côte le long d'une côte inventée, de 1 à 60 communes chacun (entre 10 000 et 12 000 communes au total). */
const cote = (): Commune[] => {
  const communes: Commune[] = [];
  let code = 10000;
  for (let k = 0; k < 400; k += 1) {
    const n = 1 + ((k * 37) % 60);
    communes.push(...surPoint(n, code, [-1.5 + k * 0.01, 46 + (k % 7) * 0.05]));
    code += n;
  }
  return communes;
};

const verifier = (communes: Commune[], resultat: Lot[]) => {
  for (const lot of resultat) expect(lot.communes.length * lot.points.length).toBeLessThanOrEqual(MAX);
  const codes = resultat.flatMap((l) => l.communes.map((c) => c[0]));
  expect(codes.length).toBe(communes.length);
  expect(new Set(codes).size).toBe(communes.length);
  expect([...codes].sort()).toEqual(communes.map((c) => c[0]).sort());
  // Chaque commune va vers son propre point de côte, avec sa mairie.
  const parCode = new Map(communes.map((c) => [c[0], c]));
  for (const lot of resultat) {
    for (const [code, lon, lat, j] of lot.communes) {
      const c = parCode.get(code)!;
      expect([lon, lat, ...lot.points[j]]).toEqual([c[1], c[2], c[3], c[4]]);
    }
  }
};

describe('scripts/data/mer_minutes.py --lots-extrait (formation des lots)', () => {
  it('aucun lot au-delà de 3 500 trajets (communes × points), chaque commune une fois, vers son point', () => {
    const communes = cote();
    const resultat = lots(communes);
    verifier(communes, resultat);
    // Les communes d'un même point sont dans un même lot.
    const lotDuPoint = new Map<string, string>();
    for (const lot of resultat) {
      for (const p of lot.points) {
        const cle = p.join(',');
        expect(lotDuPoint.has(cle)).toBe(false);
        lotDuPoint.set(cle, lot.id);
      }
    }
    // Les lots sont remplis : bien moins d'une requête par point.
    expect(resultat.length).toBeLessThan(400 / 4);
  });

  it('un point de plus de 3 500 communes est coupé en plusieurs lots (3 500, 3 500, 100), une seule destination chacun', () => {
    const gros = surPoint(7100, 20000, [-1.2, 46.1]);
    const autres = surPoint(3, 40000, [5.3, 43.2]);
    const resultat = lots([...gros, ...autres]);
    verifier([...gros, ...autres], resultat);
    const duGros = resultat.filter((l) => l.points.length === 1 && l.points[0][0] === -1.2 && l.points[0][1] === 46.1);
    expect(duGros.map((l) => l.communes.length)).toEqual([3500, 3500, 100]);
    expect(resultat.flatMap((l) => l.points).filter((p) => p[0] === -1.2)).toHaveLength(3);
  });
});

/** Un dossier de calcul inventé : trois lots préparés (et le lot d'essai), et des résultats déjà écrits. */
const dossierCalcul = (deja: { lot: string; codes: string[] }[]) => {
  const dossier = mkdtempSync(join(tmpdir(), 'mer-calcul-'));
  const lot = (id: string, codes: string[]): Lot =>
    ({ id, points: [[-1, 46]], communes: codes.map((c) => [c, -0.5, 46, 0] as [string, number, number, number]) });
  writeFileSync(join(dossier, 'lots.json'), JSON.stringify({
    essai: lot('essai', ['33063', '14118', '40192']),
    lots: [lot('0001', ['01001', '01002']), lot('0002', ['01003']), lot('0003', ['01004', '01005'])],
  }));
  writeFileSync(join(dossier, 'ors-mer.jsonl'), deja.map((d) => JSON.stringify({ ...d, reponse: { durations: [[60]] } })).join('\n') + (deja.length ? '\n' : ''));
  return dossier;
};

const aBlanc = (dossier: string, ...options: string[]) =>
  JSON.parse(execFileSync('python3', ['-I', script, '--envoyer', '--a-blanc', '--dossier', dossier, ...options], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));

describe('scripts/data/mer_minutes.py --envoyer (reprise, sans réseau)', () => {
  it('un lot déjà écrit dans le fichier de résultats n\'est pas renvoyé', () => {
    const dossier = dossierCalcul([{ lot: '0001', codes: ['01001', '01002'] }, { lot: '0003', codes: ['01004', '01005'] }]);
    expect(aBlanc(dossier)).toEqual({ a_envoyer: ['0002'], requetes: 1 });
  });

  it('rien d\'écrit : tous les lots ; le lot d\'essai seul avec --essai, et plus du tout une fois écrit', () => {
    expect(aBlanc(dossierCalcul([]))).toEqual({ a_envoyer: ['0001', '0002', '0003'], requetes: 3 });
    expect(aBlanc(dossierCalcul([]), '--essai')).toEqual({ a_envoyer: ['essai'], requetes: 1 });
    expect(aBlanc(dossierCalcul([{ lot: 'essai', codes: ['33063', '14118', '40192'] }]), '--essai')).toEqual({ a_envoyer: [], requetes: 0 });
  });

  it('un lot écrit avec d\'autres communes que le lot préparé arrête tout', () => {
    const dossier = dossierCalcul([{ lot: '0001', codes: ['01001'] }]);
    expect(() => aBlanc(dossier)).toThrow(/ARRET/);
  });
});

// Tâche 0b : --calculer lit les lots préparés et les réponses écrites, et sort une ligne par commune (H191, H196, D8).
// Un dossier de calcul inventé : le lot 0001 a 300 communes à 10 min et six cas ; le lot 0002 est en échec.
type CommuneLot = [string, number, number, number];
const cas = {
  demi: '02001', // 1 770 s = 29,5 min → 30 (H191, moitié vers le haut)
  sousLaMoitie: '02002', // 1 769,4 s = 29,49 min → 29
  moinsDUne: '02003', // 24 s = 0,4 min → 0, « moins d'1 min »
  pointSeul: '02004', // son point de côte n'est pas accroché (aucune route près du point)
  mairieSeule: '02005', // sa mairie n'est pas accrochée
  ile: '02006', // les deux accrochés, durée nulle : aucune route jusqu'au point (île sans pont)
  demiPair: '02007', // 1 710 s = 28,5 min → 29 (et non 28 : pas l'arrondi « au pair » de round() en Python)
};
const calcul = (options: { retraits?: string; sansLot?: string } = {}) => {
  const dossier = mkdtempSync(join(tmpdir(), 'mer-min-'));
  const ordinaires: CommuneLot[] = Array.from({ length: 300 }, (_, i) => [String(10000 + i), -0.5, 46, 0]);
  const speciaux: CommuneLot[] = [
    [cas.demi, -0.5, 46, 0], [cas.sousLaMoitie, -0.5, 46, 0], [cas.moinsDUne, -0.5, 46, 0],
    [cas.pointSeul, -0.6, 46, 1], [cas.mairieSeule, -0.7, 46, 0], [cas.ile, -0.8, 46, 2], [cas.demiPair, -0.5, 46, 0],
  ];
  const lot1 = { id: '0001', points: [[-1, 46], [-1.1, 46], [-1.2, 46]], communes: [...ordinaires, ...speciaux] };
  const lot2 = { id: '0002', points: [[-2, 47]], communes: [['03001', -1.5, 47, 0], ['03002', -1.6, 47, 0]] as CommuneLot[] };
  writeFileSync(join(dossier, 'lots.json'), JSON.stringify({ essai: { id: 'essai', points: [], communes: [] }, lots: [lot1, lot2] }));
  const secondes: Record<string, number | null> = {
    [cas.demi]: 1770, [cas.sousLaMoitie]: 1769.4, [cas.moinsDUne]: 24, [cas.pointSeul]: null, [cas.mairieSeule]: null, [cas.ile]: null,
    [cas.demiPair]: 1710,
  };
  const durations = lot1.communes.map(([code, , , j]) => lot1.points.map((_, k) => (k === j ? (code in secondes ? secondes[code] : 600) : 900)));
  const sources = lot1.communes.map(([code, lon, lat]) => (code === cas.mairieSeule ? { snapped_distance: 0 } : { location: [lon, lat], snapped_distance: 12 }));
  const destinations = [{ location: [-1, 46], snapped_distance: 40 }, { snapped_distance: 0 }, { location: [-1.2, 46], snapped_distance: 300 }];
  const ligne = (lot: typeof lot1, suite: object) => JSON.stringify({ lot: lot.id, codes: lot.communes.map((c) => c[0]), points: lot.points, point_de: lot.communes.map((c) => c[3]), essais: 1, ...suite });
  const lignes = [
    ligne(lot1, { reponse: { durations, sources, destinations } }),
    ligne(lot2, { essais: 2, erreur: { code: 500, texte: 'erreur du service' } }),
  ].filter((_, i) => [lot1, lot2][i].id !== options.sansLot);
  writeFileSync(join(dossier, 'ors-mer.jsonl'), lignes.join('\n') + '\n');
  const retraits = join(dossier, 'mer-retraits.csv');
  writeFileSync(retraits, options.retraits ?? 'code,preuve\n');
  const sortie = join(dossier, 'mer-min.csv');
  const stdout = execFileSync('python3', ['-I', script, '--calculer', '--dossier', dossier, '--retraits', retraits, '--sortie', sortie], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const [tete, ...rangs] = readFileSync(sortie, 'utf8').trim().split('\n').map((l) => l.split(','));
  const parCode = new Map(rangs.map((r) => [r[0], Object.fromEntries(tete.map((n, i) => [n, r[i]]))]));
  return { stdout, parCode, total: rangs.length };
};

describe('scripts/data/mer_minutes.py --calculer (minutes, causes, retraits ; sans réseau)', () => {
  it('H191 : arrondi une seule fois à la minute, moitié vers le haut : 29,5 min → 30 ; 28,5 → 29 ; 29,49 → 29 ; 0,4 → 0 (« moins d’1 min ») ; 10 min → 10', () => {
    const { parCode, total } = calcul();
    expect(total).toBe(309);
    expect(parCode.get(cas.demi)).toMatchObject({ mer_min: '30', cause: '', secondes: '1770' });
    expect(parCode.get(cas.demiPair)).toMatchObject({ mer_min: '29', cause: '' });
    expect(parCode.get(cas.sousLaMoitie)).toMatchObject({ mer_min: '29', cause: '' });
    expect(parCode.get(cas.moinsDUne)).toMatchObject({ mer_min: '0', cause: '' });
    expect(parCode.get('10000')).toMatchObject({ mer_min: '10', cause: '' });
  });

  it('H196 : chaque commune sans temps a sa cause : point non accroché, mairie non accrochée, aucune route, échec après un nouvel essai', () => {
    const { parCode, stdout } = calcul();
    expect(parCode.get(cas.pointSeul)).toMatchObject({ mer_min: '', cause: 'pas-de-route-pres-du-point' });
    expect(parCode.get(cas.mairieSeule)).toMatchObject({ mer_min: '', cause: 'pas-de-route-pres-de-la-mairie' });
    expect(parCode.get(cas.ile)).toMatchObject({ mer_min: '', cause: 'pas-de-route-jusqu-au-point', accroche_point_m: '300' });
    expect(parCode.get('03001')).toMatchObject({ mer_min: '', cause: 'echec' });
    expect(parCode.get('03002')).toMatchObject({ mer_min: '', cause: 'echec' });
    expect(stdout).toMatch(/communes sans temps : 5 sur 309 \(1\.62 %\)/);
  });

  it('D8 : une ligne de mer-retraits.csv rend la commune sans temps, cause « retrait » ; une ligne sans preuve arrête tout', () => {
    const { parCode } = calcul({ retraits: 'code,preuve\n10001,"Itinéraire en ligne : 25 min, pas 10 (exemple de test)"\n' });
    expect(parCode.get('10001')).toMatchObject({ mer_min: '', cause: 'retrait', secondes: '600' });
    expect(parCode.get('10000')).toMatchObject({ mer_min: '10' });
    expect(() => calcul({ retraits: 'code,preuve\n10001,\n' })).toThrow();
    expect(() => calcul({ retraits: 'code,preuve\n99999,"commune absente"\n' })).toThrow();
  });

  it('arrêts : un lot préparé absent du fichier d’openrouteservice (trajet manquant) ; plus de 2 % des communes sans temps', () => {
    expect(() => calcul({ sansLot: '0002' })).toThrow(/ÉCHEC aucun trajet manquant.*lot 0002 absent/);
    // 6 sans temps sur 309 (1,94 %) passe ; 7 sur 309 (2,27 %) arrête.
    expect(calcul({ retraits: 'code,preuve\n10001,"preuve"\n' }).total).toBe(309);
    expect(() => calcul({ retraits: 'code,preuve\n10001,"preuve"\n10002,"preuve"\n' })).toThrow(/ARRET : 7 communes sans temps sur 309/);
  });
});

describe('scripts/data/mer_minutes.py --envoyer (faux service local)', () => {
  it('un lot en échec est refait une fois puis noté en échec ; une réponse 429 attend sans compter d\'essai ; la clé n\'est jamais affichée', async () => {
    const recues: { lot: string[]; cle: string | undefined }[] = [];
    // 1 et 2 : le lot 0001 refusé deux fois ; 3 : 429 ; 4 : le lot 0002 calculé ; 5 : le lot 0003 calculé.
    const reponses: [number, unknown][] = [
      [400, { error: { code: 6003, message: 'Invalid parameter value.' } }],
      [400, { error: { code: 6003, message: 'Invalid parameter value.' } }],
      [429, { error: 'Rate Limit Exceeded' }],
      [200, { durations: [[3000]], destinations: [{ location: [-1, 46], snapped_distance: 12.3 }], sources: [{ location: [-0.5, 46], snapped_distance: 4 }] }],
      [200, { durations: [[1200], [null]], destinations: [{ location: [-1, 46], snapped_distance: 50 }], sources: [{ location: [-0.5, 46], snapped_distance: 3 }, null] }],
    ];
    const serveur = createServer((req: IncomingMessage, res: ServerResponse) => {
      let corps = '';
      req.on('data', (d) => { corps += d; });
      req.on('end', () => {
        const json = JSON.parse(corps) as { locations: number[][]; sources: number[] };
        recues.push({ lot: json.sources.map(String), cle: req.headers.authorization });
        const [code, contenu] = reponses[recues.length - 1] ?? [500, { error: 'trop de requêtes dans le test' }];
        res.writeHead(code, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(contenu));
      });
    });
    await new Promise<void>((ok) => serveur.listen(0, '127.0.0.1', ok));
    const { port } = serveur.address() as AddressInfo;
    const dossier = dossierCalcul([]);
    const cle = join(dossier, 'cle');
    writeFileSync(cle, 'cle-secrete-du-test\n');
    try {
      const { stdout, stderr } = await promisify(execFile)('python3', ['-I', script, '--envoyer', '--dossier', dossier,
        '--url', `http://127.0.0.1:${port}/v2/matrix/driving-car`, '--cle', cle, '--attentes-courtes'], { encoding: 'utf8' });
      expect(stdout + stderr).not.toContain('cle-secrete-du-test');
      expect(stdout).toMatch(/TERMINÉ : 5 requêtes envoyées ; 2 lots écrits, 1 en échec ; trajets sans temps : 1 sur 3/);
    } finally {
      serveur.close();
    }
    expect(recues).toHaveLength(5);
    expect(recues.every((r) => r.cle === 'cle-secrete-du-test')).toBe(true);
    const lignes = readFileSync(join(dossier, 'ors-mer.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    expect(lignes.map((l) => [l.lot, l.essais, 'erreur' in l, 'reponse' in l])).toEqual([
      ['0001', 2, true, false],
      ['0002', 1, false, true],
      ['0003', 1, false, true],
    ]);
    expect(lignes[0].erreur.code).toBe(400);
    expect(lignes[1].reponse.destinations[0].snapped_distance).toBe(12.3);
    expect(lignes[2].reponse.durations).toEqual([[1200], [null]]);
    expect(readFileSync(join(dossier, 'ors-mer.jsonl'), 'utf8')).not.toContain('cle-secrete-du-test');
    // Relancé : tout est écrit, rien n'est renvoyé.
    expect(aBlanc(dossier)).toEqual({ a_envoyer: [], requetes: 0 });
  });
});
