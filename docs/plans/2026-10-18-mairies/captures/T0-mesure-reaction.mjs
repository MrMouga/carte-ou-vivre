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
for (const tour of [1]) {
  await ouvrir('/?loyer=1200');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  // Témoin : curseur du prix, un cran (1 200 € ↔ 1 250 €), comme T4 de cadre-de-vie (114-116 ms).
  const curseur = page.getByRole('slider', { name: 'Loyer maximum' });
  const prix = [];
  for (let i = 0; i < N; i++) prix.push((await geste(curseur, i % 2 ? 'ArrowLeft' : 'ArrowRight'))[0]);
  console.log(ligne(`tour ${tour}, curseur du prix, un cran`, prix));
  // « Ville dense » cochée : de 34 674 communes colorées à 643, 34 031 se décolorent d'un coup ; décochée : elles reviennent.
  if (process.env.SANS_TYPE) { await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }); }
  const dense = process.env.SANS_TYPE ? null : page.getByRole('group', { name: "Type d'environnement" }).getByRole('button', { name: 'Ville dense', exact: true });
  const on = [], off = [];
  for (let i = 0; dense && i < 2 * N; i++) {
    const [ms, adresse] = await geste(dense, 'Enter');
    (adresse.includes('env=ville-dense') ? on : off).push(ms);
  }
  if (dense) console.log(ligne(`tour ${tour}, « Ville dense » cochée (34 031 communes décolorées)`, on));
  if (dense) console.log(ligne(`tour ${tour}, « Ville dense » décochée (34 031 communes recolorées)`, off));
  // Geste de H90 : cases de la mer, 50 km ↔ 100 km, depuis /?loyer=1200&mer=50.
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await ouvrir('/?loyer=1200&mer=50');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const mer = (km) => page.getByRole('group', { name: 'Mer à moins de' }).getByRole('button', { name: `${km} km`, exact: true });
  const m = [];
  for (let i = 0; i < N; i++) m.push((await geste(mer(i % 2 ? 50 : 100), 'Enter'))[0]);
  console.log(ligne(`tour ${tour}, cases de la mer 50 ↔ 100 km (H90)`, m));
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
}
await navigateur.close();
