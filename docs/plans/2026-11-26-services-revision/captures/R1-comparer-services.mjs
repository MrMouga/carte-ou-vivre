// Retouche R1 (H210) : compare public/data/services.json avant / après les deux retraits, caractère par caractère.
// Usage : node docs/plans/2026-11-26-services-revision/captures/R1-comparer-services.mjs <avant.json> <après.json>
import { readFileSync } from 'node:fs';

const [avantChemin, apresChemin] = process.argv.slice(2);
const avant = JSON.parse(readFileSync(avantChemin, 'utf8'));
const apres = JSON.parse(readFileSync(apresChemin, 'utf8'));

const cles = [...new Set([...Object.keys(avant), ...Object.keys(apres)])];
const differences = [];
for (const cle of cles) {
  const a = avant[cle];
  const b = apres[cle];
  if (typeof a === 'string' && typeof b === 'string' && a.length === b.length) {
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) differences.push({ cle, code: apres.codes[i], avant: a[i], apres: b[i] });
    }
  } else if (JSON.stringify(a) !== JSON.stringify(b)) {
    differences.push({ cle, code: '(clé entière)', avant: JSON.stringify(a)?.slice(0, 40), apres: JSON.stringify(b)?.slice(0, 40) });
  }
}

const brutAvant = readFileSync(avantChemin, 'utf8');
const brutApres = readFileSync(apresChemin, 'utf8');
let octets = 0;
for (let i = 0; i < Math.max(brutAvant.length, brutApres.length); i++) if (brutAvant[i] !== brutApres[i]) octets++;

console.log(`Fichier : ${brutAvant.length} caractères avant, ${brutApres.length} après ; ${octets} caractère(s) différent(s) dans le texte brut`);
console.log(`Différences par chaîne : ${differences.length}`);
for (const d of differences) console.log(`  ${d.cle} · ${d.code} : « ${d.avant} » → « ${d.apres} »`);
const attendu = [
  { cle: 'urgences', code: '74056', apres: '-' },
  { cle: 'supermarche', code: '06163', apres: '-' },
];
const ok = differences.length === 2 && octets === 2
  && attendu.every((x) => differences.some((d) => d.cle === x.cle && d.code === x.code && d.apres === x.apres));
console.log(ok ? 'OK : seuls Chamonix (urgences) et Tende (supermarché) changent, tous deux en « - »' : 'ÉCHEC : autre chose a changé');
process.exit(ok ? 0 : 1);
