// Tâche 3b de services : « Scolarité » au panneau, version construite servie par `npx vite preview --port 4180` (vraies
// données). À 390 × 844 : vrai geste au toucher sur /?loyer=1200, « École » et « Collège » (état incomplet), puis « 10 min »
// (état actif) ; captures de la feuille et de la catégorie seule ; adresse, compte et description des groupes relus. Puis en
// bureau, le même réglage rouvert par son lien.
// Lancer : OUT=<dossier> node docs/plans/2026-11-24-services/captures/T3b-captures.mjs
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = process.env.BASE ?? 'http://localhost:4180';
const OUT = process.env.OUT;
const navigateur = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const journal = (...a) => console.log(new Date().toLocaleTimeString('fr-FR'), ...a);

async function page(w, h, toucher = false) {
  return (await navigateur.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: toucher, isMobile: toucher })).newPage();
}
async function ouvrir(p, chemin) {
  await p.goto(BASE + chemin);
  await p.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
  await p.waitForFunction(() => {
    const b = document.querySelector('[aria-label="Niveaux de scolarité"] button');
    return b && !b.disabled;
  }, null, { timeout: 30000 });
  await p.waitForTimeout(2000);
}
const categorie = (p) => p.getByRole('heading', { level: 2, name: /^Services/ }).locator('xpath=../..');
const niveau = (p, nom) => p.getByRole('group', { name: 'Niveaux de scolarité', exact: true }).getByRole('button', { name: nom, exact: true });
const temps = (p, m) => p.getByRole('group', { name: 'Scolarité', exact: true }).getByRole('button', { name: new RegExp(`^${m}\\smin$`) });
async function etat(p, quoi) {
  const desc = await p.evaluate(() =>
    ['Niveaux de scolarité', 'Scolarité'].map((n) => {
      const g = document.querySelector(`[role="group"][aria-label="${n}"]`);
      const id = g.getAttribute('aria-describedby');
      return `${n} → ${id ? document.getElementById(id).textContent : '(aucune description)'}`;
    }),
  );
  journal(quoi, '·', p.url().replace(BASE, ''), '·', (await p.getByRole('status').textContent()) ?? '', '·', desc.join(' ; '));
}
async function captures(p, nom) {
  await categorie(p).evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/T3b-feuille-${nom}-390x844.png` });
  const { width, height } = p.viewportSize();
  await p.setViewportSize({ width, height: 2400 });
  await p.waitForTimeout(800);
  await categorie(p).screenshot({ path: `${OUT}/T3b-cat-${nom}-390.png` });
  await p.setViewportSize({ width, height });
  await p.waitForTimeout(800);
}

const m = await page(390, 844, true);
await ouvrir(m, '/?loyer=1200');
await etat(m, 'au départ');
await niveau(m, 'École').tap();
await niveau(m, 'Collège').tap();
await m.waitForTimeout(800);
await etat(m, 'après « École » et « Collège » (incomplète)');
await captures(m, 'incomplete');
await temps(m, 10).tap();
await m.waitForTimeout(1500);
await etat(m, 'après « 10 min » (active)');
await captures(m, 'active');
const lien = m.url().replace(BASE, '');
await m.context().close();

const b = await page(1440, 900);
await ouvrir(b, lien);
await b.locator('section[aria-label="Réglages"]').evaluate((el) => (el.scrollTop = el.scrollHeight));
await b.mouse.move(0, 0);
await b.waitForTimeout(500);
await etat(b, 'bureau, lien rouvert');
await b.screenshot({ path: `${OUT}/T3b-bureau-active-1440x900.png` });
await b.context().close();
await navigateur.close();
