// Tâche 3 de mairies : captures de preuve sur la version construite (`npx vite preview --port 4180`), vraies données,
// vrai fond Plan IGN, Chromium de Playwright avec rendu WebGL logiciel (comme les tests). Captures écrites dans OUT.
// 1. Sur / (rien de coché), la fiche de Bordeaux, Nice, Paris (nom de liste long), Lyon, Marseille et Val-Cenis (73,
//    village sans étiquette), cliquées à leur place d'ouverture (même calcul que fitBounds, comme `vue()` de
//    tests/e2e/lib/carte.ts, repris de T2-captures.mjs) ; la page est rouverte avant chaque clic, car choisir zoome la carte.
// 2. Le pied de page, en 1 440 × 900 et dans l'onglet « Critères » à 390 × 844.
import { readFileSync } from 'node:fs';
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = process.env.BASE ?? 'http://localhost:4180';
const OUT = process.env.OUT;
const RACINE = '/Users/mouga/git-repository/carte-ou-vivre/public/data/';
const communes = JSON.parse(readFileSync(RACINE + 'communes.json', 'utf8')).communes;
const reperes = JSON.parse(readFileSync(RACINE + 'reperes.json', 'utf8')).reperes;
const navigateur = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const journal = (...a) => console.log(new Date().toLocaleTimeString('fr-FR'), ...a);

async function page(largeur, hauteur) {
  const p = await navigateur.newPage({ viewport: { width: largeur, height: hauteur } });
  return p;
}
async function ouvrir(p, chemin) {
  await p.goto(BASE + chemin);
  await p.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
  await p.waitForTimeout(2500); // tuiles du fond et des communes
}
const adresse = (p) => new URL(p.url()).pathname + new URL(p.url()).search;
const groupe = (p) => p.getByRole('group', { name: 'Mairie élue en 2026' });
const pastille = (p, nom) => groupe(p).getByRole('button', { name: nom, exact: true });

// 1. Les fiches.
const p = await page(1440, 900);
// Place d'ouverture d'une commune : fitBounds de l'emprise des repères avec le cadrage bureau (paddingBureau).
const mx = (lon) => (lon + 180) / 360;
const my = (lat) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2;
const [W, H] = [1440, 900];
const pad = { top: 16, left: 16 + 340 + 16, right: 16 + 320 + 16, bottom: 32 + 16 };
let [w, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity];
for (const r of reperes) { w = Math.min(w, r[2]); s = Math.min(s, r[3]); e = Math.max(e, r[4]); n = Math.max(n, r[5]); }
const [x0, x1, y0, y1] = [mx(w), mx(e), my(n), my(s)];
const z = Math.log2(Math.min((W - pad.left - pad.right) / ((x1 - x0) * 512), (H - pad.top - pad.bottom) / ((y1 - y0) * 512)));
const monde = 512 * 2 ** z;
const cx = pad.left + (W - pad.left - pad.right) / 2, cy = pad.top + (H - pad.top - pad.bottom) / 2;
const ecran = (lon, lat) => ({ x: cx + (mx(lon) - (x0 + x1) / 2) * monde, y: cy + (my(lat) - (y0 + y1) / 2) * monde });

// Marseille et Nice : le point de la mairie est au bord de l'eau ; on clique un peu à l'intérieur des terres.
const POINT = { '13055': [5.43, 43.33], '06088': [7.25, 43.72] };
for (const [code, nom] of [['33063', 'bordeaux'], ['06088', 'nice'], ['75056', 'paris'], ['69123', 'lyon'], ['13055', 'marseille'], ['73290', 'val-cenis']]) {
  const i = communes.findIndex((c) => c[0] === code);
  await ouvrir(p, '/');
  const { x, y } = ecran(...(POINT[code] ?? reperes[i].slice(0, 2)));
  await p.mouse.click(x, y);
  const fiche = p.getByRole('region', { name: /\(\d+\)$/ });
  await fiche.waitFor();
  await p.waitForTimeout(2500); // zoom (500 ms) et tuiles
  await p.screenshot({ path: `${OUT}/T3-fiche-${nom}-1440x900.png` });
  journal(nom, code, communes[i][1], '→', (await fiche.innerText()).replace(/\n/g, ' | '));
}

// 2. Le pied de page.
await ouvrir(p, '/');
const pied = p.getByRole('contentinfo').filter({ visible: true }).first();
await p.screenshot({ path: `${OUT}/T3-pied-de-page-1440x900.png` });
await pied.screenshot({ path: `${OUT}/T3-pied-de-page-detail-1440x900.png` });
journal('pied 1440', await pied.innerText());
const q = await page(390, 844);
await ouvrir(q, '/');
await q.getByRole('tab', { name: 'Critères', exact: true }).click();
const piedQ = q.getByRole('contentinfo').filter({ visible: true }).first();
await piedQ.scrollIntoViewIfNeeded();
await q.waitForTimeout(500);
await q.screenshot({ path: `${OUT}/T3-pied-de-page-390x844.png` });
journal('pied 390', await piedQ.innerText());
await navigateur.close();
