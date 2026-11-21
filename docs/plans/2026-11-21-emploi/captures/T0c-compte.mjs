// Tâche 0c d'emploi — compare un emploi.json « avant » (argument) au public/data/emploi.json régénéré : villes
// principales des 389 bassins, données des métiers et des communes, puis communes qui passent V1X80 et M2X90 à « 10 % »
// avant / après, par la méthode de la tâche 0b (T0b-voisinage.mjs, distanceKm du site, 30 km comparés au km).
// Lancer depuis la racine : node docs/plans/2026-11-21-emploi/captures/T0c-compte.mjs <emploi-avant.json>
import { readFileSync } from 'node:fs';
import { distanceKm } from '../../../../src/proches/distance.ts';
import { villesA30km, compterPassent } from './T0b-voisinage.mjs';

const RACINE = new URL('../../../../', import.meta.url).pathname;
const lire = (f) => JSON.parse(readFileSync(RACINE + 'public/data/' + f, 'utf8'));
const communes = lire('communes.json').communes;
const reperes = lire('reperes.json').reperes;
const avant = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const apres = lire('emploi.json');
const indexCommune = new Map(communes.map((c, i) => [c[0], i]));
const nom = (code) => (code == null ? 'aucune' : `${communes[indexCommune.get(code)][1]} (${code})`);
const points = new Float64Array(communes.length * 2);
reperes.forEach((r, i) => { points[2 * i] = r[0]; points[2 * i + 1] = r[1]; });

console.log(`T0c-compte.mjs — ${new Date().toLocaleString('fr-FR')}`);
if (avant.bassins.length !== apres.bassins.length || avant.bassins.some((b, i) => b[0] !== apres.bassins[i][0])) throw new Error('bassins différents');
const diff = apres.bassins.filter((b, i) => b[1] !== avant.bassins[i][1]);
console.log(`villes principales : ${apres.bassins.length} bassins, ${diff.length} différence(s)`);
for (const [b, v] of diff) console.log(`  bassin ${b} : ${nom(avant.bassins.find((x) => x[0] === b)[1])} → ${nom(v)}`);
for (const cle of ['champs', 'trimestre_chomage', 'zones', 'metiers', 'communes']) {
  console.log(`${cle} : ${JSON.stringify(avant[cle]) === JSON.stringify(apres[cle]) ? 'identique' : 'DIFFÉRENT'}`);
}

const RANG = { '10': 0, '25': 1, tous: 2 };
const passent = (emploi, code, niveau) => {
  const villes = emploi.bassins.flatMap(([, v], i) => (v == null ? [] : [[i, indexCommune.get(v)]]));
  const proches = villesA30km(points, villes, distanceKm);
  const index = new Map(emploi.bassins.map((b, i) => [b[0], i]));
  const d = new Uint8Array(emploi.bassins.length);
  for (const [b, , x] of emploi.metiers.find((m) => m.code === code).bassins) if (RANG[x] <= RANG[niveau]) d[index.get(b)] = 1;
  return compterPassent(proches, d);
};
for (const code of ['V1X80', 'M2X90']) {
  console.log(`${code} à « 10 % » : ${passent(avant, code, '10')} communes avant, ${passent(apres, code, '10')} après`);
}
