// Retouche R1 (H210) : fiches de Chamonix-Mont-Blanc et de Tende en bureau 1 440 × 900, sur la version construite servie
// par `npx vite preview --port 4180` (vraies données), communes choisies par la recherche (repris de T2-bout-en-bout.mjs).
// Lancer : OUT=<dossier des captures> node docs/plans/2026-11-26-services-revision/captures/R1-fiches.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = process.env.BASE ?? 'http://localhost:4180';
const OUT = process.env.OUT;
const communes = JSON.parse(readFileSync('/Users/mouga/git-repository/carte-ou-vivre/public/data/communes.json', 'utf8')).communes;
const navigateur = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const journal = (...a) => console.log(new Date().toLocaleTimeString('fr-FR'), ...a);
const nbsp = (t) => (t ?? '').replace(/[  ]/g, ' ');
const fiche = (pg) => pg.getByRole('region', { name: /\(\w+\)$/ });
const loupe = (pg) => pg.getByRole('button', { name: 'Chercher une commune', exact: true });
const champ = (pg) => pg.getByRole('combobox', { name: 'Chercher une commune', exact: true });

async function ouvrir(pg, ch) {
  for (let essai = 0; essai < 3; essai++) {
    await pg.goto(BASE + ch);
    await pg.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
    await pg.waitForFunction(() => {
      const b = document.querySelector('[aria-label="Type de gare"] button');
      return b && !b.disabled;
    }, null, { timeout: 30000 });
    await pg.waitForTimeout(2500);
    if (!(await pg.getByText('Fond de carte indisponible').isVisible())) return;
  }
  journal('  fond de secours pour', ch);
}

async function choisir(pg, code) {
  const [, nom, dep] = communes.find((c) => c[0] === code);
  await ouvrir(pg, '/');
  await loupe(pg).click();
  await champ(pg).fill(nom);
  await pg.getByRole('listbox', { name: 'Suggestions de communes' }).getByRole('option', { name: `${nom} (${dep})`, exact: true }).click();
  await fiche(pg).waitFor({ timeout: 10000 });
  const titre = nbsp(await pg.locator('#titre-fiche').innerText()).trim();
  if (titre !== `${nom} (${dep})`) throw new Error(`fiche ${titre} au lieu de ${nom} (${dep})`);
  await fiche(pg).getByRole('heading', { level: 3, name: 'Services en voiture' }).waitFor({ timeout: 20000 });
  await pg.mouse.move(0, 0);
  await pg.waitForTimeout(1500);
  return nom;
}

const pg = await (await navigateur.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
for (const [code, nomFichier, ligne] of [['74056', 'chamonix', 'Urgences'], ['06163', 'tende', 'Supermarché']]) {
  const nom = await choisir(pg, code);
  const t = (await fiche(pg).locator('h3, p, li').allTextContents()).map((x) => nbsp(x).replace(/\s+/g, ' ').trim());
  const j = t.indexOf('Services en voiture');
  const services = t.slice(j + 1, j + 12);
  journal(`${nom} (${code}) : ${JSON.stringify(services)}`);
  journal(`  « ${ligne} : pas de chiffre » présent :`, services.some((s) => s.startsWith(ligne) && s.includes('pas de chiffre')));
  await fiche(pg).getByRole('heading', { level: 3, name: 'Services en voiture' }).evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: `${OUT}/R1-${nomFichier}-1440x900.jpg`, type: 'jpeg', quality: 80 });
}
await navigateur.close();
