// Tâche 0b d'emploi — sonde jetable : effet de la ville principale du bassin 7503 (« CONFOLENS » dans le fichier BMO ;
// Castelnau-de-Médoc par H135, à cause de 12 communes du Médoc rangées dans ce bassin par la table de France Travail).
// Compare, pour chaque métier et niveau où 7503 compte, les communes qui passent avec Castelnau-de-Médoc (33104) et avec
// la plus peuplée de la partie charentaise du bassin (Terres-de-Haute-Charente, 16192).
// Lancer depuis la racine : node docs/plans/2026-11-21-emploi/captures/T0b-sonde-7503-effet.mjs
import { readFileSync } from 'node:fs';
import { distanceKm } from '../../../../src/proches/distance.ts';
import { villesA30km, compterPassent } from './T0b-voisinage.mjs';

const RACINE = new URL('../../../../', import.meta.url).pathname;
const lire = (f) => JSON.parse(readFileSync(RACINE + 'public/data/' + f, 'utf8'));
const communes = lire('communes.json').communes;
const reperes = lire('reperes.json').reperes;
const emploi = lire('emploi.json');
const indexCommune = new Map(communes.map((c, i) => [c[0], i]));
const points = new Float64Array(communes.length * 2);
reperes.forEach((r, i) => { points[2 * i] = r[0]; points[2 * i + 1] = r[1]; });
const ib = emploi.bassins.findIndex((b) => b[0] === '7503');
const charente = communes.filter((c) => c[2] === '16' && emploi.communes.find((e) => e[0] === c[0])[1] === '7503').sort((a, b) => b[3] - a[3])[0];
console.log(`plus peuplée de la partie charentaise du bassin 7503 : ${charente[1]} (${charente[0]}, ${charente[3]} hab.)`);
const avec = (ville) => villesA30km(points, emploi.bassins.flatMap(([, v], i) => (v == null ? [] : [[i, indexCommune.get(i === ib ? ville : v)]])), distanceKm);
const castelnau = avec('33104'), terres = avec(charente[0]);
const RANG = { '10': 0, '25': 1, tous: 2 };
let lignes = 0;
for (const m of emploi.metiers) {
  const l = m.bassins.find((b) => b[0] === '7503');
  if (!l) continue;
  for (const niveau of ['10', '25', 'tous']) {
    if (RANG[l[2]] > RANG[niveau]) continue;
    const d = new Uint8Array(emploi.bassins.length);
    for (const [b, , x] of m.bassins) if (RANG[x] <= RANG[niveau]) d[emploi.bassins.findIndex((y) => y[0] === b)] = 1;
    const a = compterPassent(castelnau, d), b = compterPassent(terres, d);
    if (m.code === 'V1X80' || m.code === 'R4X90' || m.code === 'H1X91' || niveau === '10') {
      console.log(`${m.code} ${m.libelle} à « ${niveau} » (7503 : ${l[1]} projets, niveau ${l[2]}) : ${a} communes avec Castelnau-de-Médoc, ${b} avec ${charente[1]}`);
      lignes++;
    }
  }
}
console.log(`métiers chiffrés dans 7503 : ${emploi.metiers.filter((m) => m.bassins.some((b) => b[0] === '7503')).length} ; dont au niveau « 10 » : ${emploi.metiers.filter((m) => m.bassins.some((b) => b[0] === '7503' && b[2] === '10')).length}`);
