// Tâche 3a de services : captures de la catégorie « Services », version construite servie par `npx vite preview --port 4180`
// (vraies données). Au départ (/) et avec le réglage d'exemple du prototype F (médecin 10, commerce 5, école et collège
// 10, gare régionale 30, posé par l'adresse : la scolarité ne se coche au panneau qu'en 3b), en bureau 1 440 × 900 et à
// 390 × 844 ; puis un geste réel au panneau (« 10 min » pour « Médecin », puis « Régionale ») avec l'adresse relue.
// Lancer : OUT=<dossier> node docs/plans/2026-11-24-services/captures/T3a-captures.mjs
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = process.env.BASE ?? 'http://localhost:4180';
const OUT = process.env.OUT;
const EXEMPLE = '/?loyer=1200&services=medecin:10,commerce:5,ecole:10,college:10,gare-regionale:30';
const navigateur = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const journal = (...a) => console.log(new Date().toLocaleTimeString('fr-FR'), ...a);

async function page(w, h) {
  const p = await (await navigateur.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })).newPage();
  return p;
}
async function ouvrir(p, chemin) {
  await p.goto(BASE + chemin);
  await p.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
  // Temps arrivés : la catégorie est active.
  await p.getByRole('group', { name: 'Médecin', exact: true }).getByRole('button').first().waitFor({ state: 'attached' });
  await p.waitForFunction(() => {
    const b = document.querySelector('[aria-label="Type de gare"] button');
    return b && !b.disabled;
  }, null, { timeout: 30000 });
  await p.waitForTimeout(2000);
  await p.mouse.move(0, 0);
}
/** Bureau : le panneau des réglages défilé jusqu'en bas (le compte collé y couvre sinon la fin de « Services »). */
const bas = (p) => p.locator('section[aria-label="Réglages"]').evaluate((el) => (el.scrollTop = el.scrollHeight));
const categorie = (p) =>p.getByRole('heading', { level: 2, name: /^Services/ }).locator('xpath=../..');

for (const [nom, chemin] of [['depart', '/'], ['exemple', EXEMPLE]]) {
  // Bureau : le panneau des réglages défilé jusqu'à « Services ».
  const b = await page(1440, 900);
  await ouvrir(b, chemin);
  await bas(b);
  await b.waitForTimeout(500);
  await b.screenshot({ path: `${OUT}/T3a-bureau-${nom}-1440x900.png` });
  journal('bureau', nom, b.url().replace(BASE, ''));
  await b.context().close();

  // 390 × 844 : la feuille défilée jusqu'à « Services », puis la catégorie seule (fenêtre haute, leçon 2026-11-21).
  const m = await page(390, 844);
  await ouvrir(m, chemin);
  await categorie(m).evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await m.waitForTimeout(500);
  await m.screenshot({ path: `${OUT}/T3a-feuille-${nom}-390x844.png` });
  await m.setViewportSize({ width: 390, height: 2400 });
  await m.waitForTimeout(800);
  await categorie(m).screenshot({ path: `${OUT}/T3a-cat-${nom}-390.png` });
  journal('390', nom, m.url().replace(BASE, ''));
  await m.context().close();
}

// Geste réel au panneau, en bureau : « 10 min » pour « Médecin », puis « Régionale » sans temps de gare, puis « 30 min ».
const g = await page(1440, 900);
await ouvrir(g, '/?loyer=1200');
await g.getByRole('group', { name: 'Médecin', exact: true }).getByRole('button', { name: /^10\smin$/ }).click();
await g.waitForTimeout(800);
journal('après « 10 min » pour Médecin :', g.url().replace(BASE, ''), '·', (await g.getByRole('status').textContent()) ?? '');
await g.getByRole('group', { name: 'Type de gare', exact: true }).getByRole('button', { name: 'Régionale', exact: true }).click();
await g.waitForTimeout(800);
journal('après « Régionale » (sans temps) :', g.url().replace(BASE, ''), '·', (await g.getByRole('status').textContent()) ?? '');
await g.getByRole('group', { name: 'Gare', exact: true }).getByRole('button', { name: /^30\smin$/ }).click();
await g.waitForTimeout(1500);
journal('après « 30 min » pour Gare :', g.url().replace(BASE, ''), '·', (await g.getByRole('status').textContent()) ?? '');
await bas(g);
await g.mouse.move(0, 0);
await g.waitForTimeout(500);
await g.screenshot({ path: `${OUT}/T3a-bureau-geste-1440x900.png` });
await g.context().close();
await navigateur.close();
