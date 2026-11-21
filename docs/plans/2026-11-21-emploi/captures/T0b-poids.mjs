// Tâche 0b d'emploi — poids d'emploi.json brut, gzip -9 et brotli -q 11 (zlib de Node, mêmes niveaux que les outils en
// ligne de commande), à côté de mairies.json et achat.json pour comparer.
// Lancer depuis la racine : node docs/plans/2026-11-21-emploi/captures/T0b-poids.mjs
import { readFileSync } from 'node:fs';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
const fr = (n) => n.toLocaleString('fr-FR').replace(/ /g, ' ');
console.log(`T0b-poids.mjs — ${new Date().toLocaleString('fr-FR')}`);
for (const f of ['emploi.json', 'mairies.json', 'nuances.json', 'achat.json', 'communes.json', 'reperes.json']) {
  const brut = readFileSync(new URL('../../../../public/data/' + f, import.meta.url));
  const gz = gzipSync(brut, { level: 9 }).length;
  const br = brotliCompressSync(brut, { params: { [constants.BROTLI_PARAM_QUALITY]: 11, [constants.BROTLI_PARAM_SIZE_HINT]: brut.length } }).length;
  console.log(`${f} : brut ${fr(brut.length)} o ; gzip -9 ${fr(gz)} o ; brotli -q 11 ${fr(br)} o`);
}
