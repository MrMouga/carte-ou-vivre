// Tâche 2 de mairies : script de la tâche 0 (T0-mesure-reaction.mjs), avec les vraies pastilles « Centre » et « Sans étiquette ».
// Réaction réglage → carte redessinée, même méthode que T4 de cadre-de-vie (H90) : version construite (vite preview),
// vraies données, 1 440 × 900, fond uni (style IGN remplacé par un fond de la couleur `background`, estompage
// transparent), CPU × 4, rendu logiciel (Chromium de Playwright sans écran) ; médiane de 15 essais par sens.
// Mesure : du keydown (capture) à la deuxième image qui suit le changement de l'adresse.
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = process.env.BASE ?? 'http://localhost:4180';
const STYLE_LOCAL = { version: 8, sources: {}, layers: [{ id: 'fond', type: 'background', paint: { 'background-color': '#F7F4EE' } }] };
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const N = 15;
const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 1440, height: 900 } });
await page.route('https://data.geopf.fr/**', (r) =>
  r.request().url().includes('/styles/') ? r.fulfill({ json: STYLE_LOCAL }) : r.fulfill({ contentType: 'image/png', body: PNG }));
await page.addInitScript(() => {
  window.__t0 = null;
  addEventListener('keydown', () => (window.__t0 = performance.now()), { capture: true });
});
async function geste(cible, touche) {
  await cible.focus();
  await page.waitForTimeout(400);
  const avant = await page.evaluate(() => location.search);
  await page.keyboard.press(touche);
  return page.evaluate((avant) => new Promise((ok) => {
    const voir = () => {
      if (location.search !== avant) requestAnimationFrame(() => requestAnimationFrame(() => ok([performance.now() - window.__t0, location.search])));
      else requestAnimationFrame(voir);
    };
    voir();
  }), avant);
}
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const ligne = (nom, a) => `${nom} : médiane ${Math.round(med(a))} ms ; min ${Math.round(Math.min(...a))} max ${Math.round(Math.max(...a))} ; essais ${a.map(Math.round).join(' ')}`;
async function ouvrir(chemin) {
  await page.goto(BASE + chemin);
  await page.getByTestId('carte').and(page.locator('[data-carte-prete="1"]')).waitFor({ timeout: 60000 });
  await page.waitForTimeout(3000);
}
const cdp = await page.context().newCDPSession(page);
console.log(`${new Date().toLocaleString('fr-FR')} ; ${N} essais par sens`);
await ouvrir('/?loyer=1200');
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
// Témoin : curseur du prix, un cran (T0 : 160 ms).
const curseur = page.getByRole('slider', { name: 'Loyer maximum' });
const prix = [];
for (let i = 0; i < N; i++) prix.push((await geste(curseur, i % 2 ? 'ArrowLeft' : 'ArrowRight'))[0]);
console.log(ligne('curseur du prix, un cran', prix));
// Une pastille cochée puis décochée, 2 × N fois, depuis /?loyer=1200 (rien d'autre coché).
async function bascule(groupe, nom, cle, quoi) {
  const b = page.getByRole('group', { name: groupe }).getByRole('button', { name: nom, exact: true });
  const on = [], off = [];
  for (let i = 0; i < 2 * N; i++) {
    const [ms, adresse] = await geste(b, 'Enter');
    (adresse.includes(cle) ? on : off).push(ms);
  }
  console.log(ligne(`« ${nom} » cochée (${quoi})`, on));
  console.log(ligne(`« ${nom} » décochée`, off));
}
await bascule("Type d'environnement", 'Ville dense', 'env=ville-dense', 'substitut de T0, 34 031 communes décolorées');
await bascule('Mairie élue en 2026', 'Centre', 'mairie=centre', `de 34 674 communes colorées à celles du centre`);
await bascule('Mairie élue en 2026', 'Sans étiquette', 'mairie=sans-etiquette', `de 34 674 communes colorées à celles sans étiquette`);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
await navigateur.close();
