// Tâche 2 de mairies : captures de preuve sur la version construite (`npx vite preview --port 4180`), vraies données,
// vrai fond Plan IGN, Chromium de Playwright avec rendu WebGL logiciel (comme les tests). Captures écrites dans OUT.
// 1. La catégorie « Vie locale » au départ, puis avec « Gauche » et « Sans étiquette », en 1 440 × 900 et 390 × 844.
// 2. « Sans limite » (curseur du prix au bout, touche Fin) puis « Gauche » : la France, puis la fiche (et la commune
//    zoomée) de Paris, Lyon, Marseille, Bordeaux et Nice, cliquées à leur place d'ouverture (même calcul que fitBounds,
//    comme `vue()` de tests/e2e/lib/carte.ts) ; la page est rouverte avant chaque clic, car choisir zoome la carte.
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

// 1. La catégorie.
for (const [l, h] of process.env.SANS_CATEGORIE ? [] : [[1440, 900], [390, 844]]) {
  const p = await page(l, h);
  await ouvrir(p, '/');
  const titre = p.getByRole('heading', { level: 2, name: /^Vie locale/ });
  // Comme F-depart-* : le panneau (bureau) ou l'onglet « Critères » (390 px) défilé jusqu'à « Vie locale ».
  await titre.evaluate((el, bureau) => el.scrollIntoView({ block: bureau ? 'center' : 'start' }), l >= 1024);
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/T2-depart-${l}x${h}.png` });
  journal(l, 'départ', adresse(p));
  await pastille(p, 'Gauche').click();
  await pastille(p, 'Sans étiquette').click();
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/T2-choix-${l}x${h}.png` });
  journal(l, 'choix', adresse(p), await p.getByRole('status').filter({ hasText: /commune/ }).first().textContent().catch(() => ''));
  await p.close();
}

// 2. Sans limite puis Gauche, vraies données.
const p = await page(1440, 900);
await ouvrir(p, '/');
await p.getByRole('slider', { name: 'Loyer maximum' }).focus();
await p.keyboard.press('End');
await p.waitForTimeout(300);
journal('sans limite', adresse(p));
await pastille(p, 'Gauche').click();
await p.waitForTimeout(2500);
journal('gauche', adresse(p));
await p.screenshot({ path: `${OUT}/T2-sans-limite-gauche-1440x900.png` });
const voulue = adresse(p);

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
for (const [code, nom] of [['75056', 'paris'], ['69123', 'lyon'], ['13055', 'marseille'], ['33063', 'bordeaux'], ['06088', 'nice']]) {
  const i = communes.findIndex((c) => c[0] === code);
  await ouvrir(p, voulue);
  const { x, y } = ecran(...(POINT[code] ?? reperes[i].slice(0, 2)));
  await p.mouse.click(x, y);
  const fiche = p.getByRole('region', { name: /\(\d+\)$/ });
  await fiche.waitFor();
  await p.waitForTimeout(2500); // zoom (500 ms) et tuiles
  await p.screenshot({ path: `${OUT}/T2-sans-limite-gauche-fiche-${nom}-1440x900.png` });
  journal(nom, code, communes[i][1], '→', (await fiche.innerText()).replace(/\n/g, ' | '));
}
await navigateur.close();
