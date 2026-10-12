// Contrôle « pas de valeur arbitraire » (contrat docs/design/system/README.md).
// Cherche, hors de src/theme/, les couleurs, tailles et classes Tailwind arbitraires écrites en dur.
// Usage : node scripts/check-tokens.mjs [dossier…] (défaut : src). Une ligne qui finit par « // jetons-ok : <raison> » est tolérée.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const RULES = [
  { name: 'couleur en dur', re: /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/ },
  { name: 'classe Tailwind arbitraire', re: /\b[a-z][a-z0-9-]*-\[[^\]]+\]/ },
  { name: 'dimension en dur', re: /\b\d+(?:\.\d+)?(?:px|rem|em|vh|vw)\b/ },
  {
    name: 'style en ligne chiffré',
    re: /\b(?:width|height|minWidth|maxWidth|minHeight|maxHeight|top|left|right|bottom|margin\w*|padding\w*|gap|fontSize|lineHeight|borderRadius|letterSpacing)\s*:\s*-?\d/,
  },
  { name: 'classe Tailwind hors thème', re: /\b(?:text-(?:xs|sm|base|lg|xl|\dxl)|font-(?:thin|light|normal|medium|semibold|bold|black)|rounded-(?:xs|sm|md|lg|xl|\dxl)|shadow-(?:xs|sm|md|lg|xl|2xl)|(?:bg|text|border|ring|fill|stroke)-(?:white|black|gray|slate|zinc|neutral|stone|red|green|blue|teal|emerald)(?:-\d+)?)\b/ },
  // Thème vidé : seuls les espacements 1, 2, 3, 4, 6, 8 (space-n) existent ; un autre nombre ne produit aucun style.
  { name: 'espacement hors jetons', re: /(?<![\w-])-?(?:p[xytblrse]?|m[xytblrse]?|gap(?:-[xy])?|space-[xy]|w|h|size|min-[wh]|max-[wh]|top|left|right|bottom|inset(?:-[xy])?|translate-[xy]|basis)-(?!(?:1|2|3|4|6|8)\b)\d+(?:\.\d+)?(?![\w/.-])/ },
];

const roots = process.argv.slice(2).length ? process.argv.slice(2) : ['src'];
const files = [];
const walk = (p) => {
  if (statSync(p).isDirectory()) {
    if (/(^|\/)(theme|node_modules)$/.test(p)) return;
    for (const f of readdirSync(p)) walk(join(p, f));
  } else if (/\.(tsx?|css)$/.test(p) && !/\.test\.ts$/.test(p)) files.push(p);
};
roots.forEach(walk);

const found = [];
for (const f of files) {
  let lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (/jetons-ok\s*:/.test(line)) return;
    const code = line.replace(/^\s*(\/\/|\*|\/\*).*$/, '').replace(/\/\/.*$/, '');
    for (const r of RULES) {
      for (const m of code.matchAll(new RegExp(r.re.source, 'g'))) found.push(`${relative(process.cwd(), f)}:${i + 1} — ${r.name} : « ${m[0]} »`);
    }
  });
}

if (found.length) {
  console.error(`check-tokens : ${found.length} valeur(s) arbitraire(s)\n${found.join('\n')}`);
  process.exit(1);
}
console.log(`check-tokens : ${files.length} fichier(s), aucune valeur arbitraire`);
