// Retraits D12 (2026-11-25) : compare deux services.json par la fonction de la page (lireServices), commune par commune.
// Usage : node --experimental-strip-types docs/plans/2026-11-24-services/captures/retraits-D12-comparaison.mjs <avant.json> <après.json>
// Affiche aussi le nom des communes des retraits, lu dans public/data/communes.json par leur code INSEE.
import { readFileSync } from 'node:fs';
import { lireServices, SERVICES } from '../../../../src/domain/services.ts';

const [avantChemin, apresChemin] = process.argv.slice(2);
const racine = new URL('../../../../', import.meta.url);
const carte = JSON.parse(readFileSync(new URL('public/data/communes.json', racine), 'utf-8'));
const iNom = carte.champs.indexOf('nom');
const iDep = carte.champs.indexOf('dep');
const nom = new Map(carte.communes.map((r) => [r[0], `${r[iNom]} (${r[iDep]})`]));

for (const code of ['06163', '29238']) console.log(`communes.json : ${code} = ${nom.get(code) ?? 'absent'}`);

const avant = lireServices(JSON.parse(readFileSync(avantChemin, 'utf-8')));
const apres = lireServices(JSON.parse(readFileSync(apresChemin, 'utf-8')));
const codesAvant = [...avant.temps.keys()];
const codesApres = [...apres.temps.keys()];
console.log(`codes : ${codesAvant.length} avant, ${codesApres.length} après, même ordre : ${codesAvant.join() === codesApres.join()}`);
console.log(`îles sans pont identiques : ${[...avant.iles].join() === [...apres.iles].join()}`);

let comparees = 0;
const differences = [];
for (const code of codesAvant) {
  const a = avant.temps.get(code);
  const b = apres.temps.get(code);
  SERVICES.forEach(({ cle }, i) => {
    comparees += 1;
    if (a[i] !== b[i]) differences.push(`${code} ${nom.get(code)} · ${cle} : ${a[i] ?? 'pas de chiffre'} → ${b[i] ?? 'pas de chiffre'}`);
  });
}
console.log(`valeurs comparées : ${comparees} ; différences : ${differences.length}`);
for (const d of differences) console.log(`  ${d}`);
