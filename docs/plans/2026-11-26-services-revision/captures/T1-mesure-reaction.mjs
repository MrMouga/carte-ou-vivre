// Révision D19, D20 de services, tâche 1 — H163 : réaction réglage → carte redessinée, geste « 30 min » pour « Urgences ».
// Copie du script de la tâche 3b d'origine (docs/plans/2026-11-24-services/captures/T3b-mesure-reaction.mjs), même méthode :
// version construite (vite preview), vraies données, 1 440 × 900, fond uni, CPU × 4, rendu logiciel ; du keydown (capture)
// à la deuxième image qui suit le changement de l'adresse ; médiane de 15 essais par sens ; charge de la machine et version
// servie écrites à chaque tour. Gestes : « 30 min » pour « Urgences » ; le témoin (curseur du prix) et « Ville dense » (le
// plus grand écart en ligne, référence de la limite) sont remesurés dans le même tour, à charge égale. Les cases de la mer en
// km (H90) du script d'origine sont retirées : `mer=` n'est plus lu depuis D9 de recherche-et-mer.
// Le compte de communes qui passent est lu dans la zone du compte, une fois, hors chronométrage.
// Lancer : node docs/plans/2026-11-26-services-revision/captures/T1-mesure-reaction.mjs (vite preview sur le port 4180)
import { loadavg } from 'node:os';
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = process.env.BASE ?? 'http://localhost:4180';
const TOURS = Number(process.env.TOURS ?? 2);
const STYLE_LOCAL = { version: 8, sources: {}, layers: [{ id: 'fond', type: 'background', paint: { 'background-color': '#F7F4EE' } }] };
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const N = 15;
const charge = () => loadavg().map((x) => x.toFixed(2)).join(' ');
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
const compte = async () => (await page.getByRole('status').first().textContent()).trim();
async function ouvrir(chemin) {
  await page.goto(BASE + chemin);
  await page.getByTestId('carte').and(page.locator('[data-carte-prete="1"]')).waitFor({ timeout: 60000 });
  await page.waitForTimeout(3000);
}
async function basculer(nom, chemin, bouton, marque) {
  await ouvrir(chemin);
  await bouton.and(page.locator(':enabled')).waitFor({ timeout: 30000 });
  const sans = await compte();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const on = [], off = [];
  for (let i = 0; i < 2 * N; i++) {
    const [ms, adresse] = await geste(bouton, 'Enter');
    (adresse.includes(marque) ? on : off).push(ms);
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await geste(bouton, 'Enter');
  await page.waitForTimeout(1000);
  const avec = await compte();
  const adresse = await page.evaluate(() => location.search);
  await geste(bouton, 'Enter');
  console.log(`tour ${tour}, ${nom} : sans « ${sans} » ; avec « ${avec} » (${adresse})`);
  console.log(ligne(`tour ${tour}, ${nom} cochée`, on));
  console.log(ligne(`tour ${tour}, ${nom} décochée`, off));
}
const cdp = await page.context().newCDPSession(page);
const version = await (await fetch(BASE + '/version.txt')).text();
console.log(`${new Date().toLocaleString('fr-FR')} ; version servie ${version.trim()} ; ${N} essais par sens ; ${TOURS} tours`);
let tour = 0;
for (tour = 1; tour <= TOURS; tour++) {
  console.log(`-- tour ${tour}, début ${new Date().toLocaleTimeString('fr-FR')}, charge ${charge()}`);
  await ouvrir('/?loyer=1200');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const curseur = page.getByRole('slider', { name: 'Loyer maximum' });
  const prix = [];
  for (let i = 0; i < N; i++) prix.push((await geste(curseur, i % 2 ? 'ArrowLeft' : 'ArrowRight'))[0]);
  console.log(ligne(`tour ${tour}, curseur du prix, un cran (témoin)`, prix));
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await basculer('« 30 min » pour « Urgences »', '/?loyer=1200',
    page.getByRole('group', { name: 'Urgences', exact: true }).getByRole('button', { name: '30 min', exact: true }), 'urgences:30');
  await basculer('« Ville dense », plus grand écart en ligne', '/?loyer=1200',
    page.getByRole('group', { name: "Type d'environnement" }).getByRole('button', { name: 'Ville dense', exact: true }), 'env=ville-dense');
  console.log(`-- tour ${tour}, fin ${new Date().toLocaleTimeString('fr-FR')}, charge ${charge()}`);
}
await navigateur.close();
