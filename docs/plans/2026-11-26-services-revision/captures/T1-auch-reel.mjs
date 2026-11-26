// Révision D19, D20 de services, tâche 1 : la fiche d'Auch (32013) sur les vraies données, `npm run dev` (port 5173).
// Cherche « Auch » dans « Chercher une commune », choisit la suggestion « Auch (32) », lit le bloc « Services en voiture »,
// capture la fiche en bureau. Puis un ancien lien `services=commerce:5,medecin:10` : adresse réécrite et compte.
// Lancer : node docs/plans/2026-11-26-services-revision/captures/T1-auch-reel.mjs
import { fileURLToPath } from 'node:url';
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = process.env.BASE ?? 'http://localhost:5173';
const ici = (nom) => fileURLToPath(new URL(nom, import.meta.url));
const nbsp = (t) => (t ?? '').replace(/ /g, ' ');
const navigateur = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await navigateur.newPage({ viewport: { width: 1440, height: 900 } });
const journal = (...a) => console.log(new Date().toLocaleTimeString('fr-FR'), ...a);

await p.goto(BASE + '/?loyer=1200');
await p.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
const recherche = p.getByRole('combobox', { name: 'Chercher une commune' });
if (!(await recherche.isVisible())) await p.getByRole('button', { name: 'Chercher une commune' }).first().click();
await recherche.fill('Auch');
await p.getByRole('option', { name: /^Auch \(32\)/ }).first().click();
const fiche = p.getByRole('region', { name: /\(\w+\)$/ });
await fiche.getByRole('heading', { level: 2, name: /Auch/ }).waitFor({ timeout: 30000 });
await fiche.getByText('Médecin').first().waitFor();
const lignes = (await fiche.getByRole('listitem').allTextContents()).map(nbsp).filter((t) => / : /.test(t) && !/plafond/.test(t));
journal(`fiche ${nbsp(await fiche.getByRole('heading', { level: 2 }).textContent())} : ${lignes.join(' | ')}`);
journal(`« Urgences : 6 min » : ${lignes.includes('Urgences : 6 min') ? 'oui' : 'NON'} ; « Supermarché : 2 min » : ${lignes.includes('Supermarché : 2 min') ? 'oui' : 'NON'}`);
await fiche.getByRole('heading', { name: 'Services en voiture' }).scrollIntoViewIfNeeded();
await p.waitForTimeout(500);
await p.screenshot({ path: ici('T1-fiche-auch-reel-1440x900.png') });

await p.goto(BASE + '/?loyer=1200&services=commerce:5,medecin:10');
await p.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
await p.waitForFunction(() => !location.search.includes('commerce'), null, { timeout: 30000 });
await p.waitForTimeout(1000);
journal(`ancien lien commerce:5,medecin:10 → ${new URL(p.url()).search} ; ${(await p.getByRole('status').first().textContent()).trim()}`);
await navigateur.close();
