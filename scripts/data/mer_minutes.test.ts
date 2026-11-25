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
