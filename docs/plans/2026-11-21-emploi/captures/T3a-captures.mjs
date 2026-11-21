// Tâche 3a d'emploi : captures de la catégorie « Emploi » sur les vraies données, version construite servie par
// `npx vite preview --port 4180`, en bureau (1 440 × 900) et à 390 × 844, à comparer aux captures F-cat-* de /ui.
// États : sans métier ; suggestions (« dévelop ») ; un métier sans niveau (choisi, focus sur « 10 % ») ; un métier peu
// chiffré à « 25 % » (M2X90, 120 bassins) ; deux métiers (infirmiers à « 10 % », graphistes sans niveau).
// Méthode (leçon 2026-11-21-captures-playwright-prototype-et-feuille.md) : à 390 px, la fenêtre est agrandie à 390 × 2400
// le temps de capturer la catégorie seule ; la souris est écartée. Le texte lu et le focus sont écrits sur la sortie.
// Lancer : OUT=<dossier temporaire> node docs/plans/2026-11-21-emploi/captures/T3a-captures.mjs
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = process.env.BASE ?? 'http://localhost:4180';
const OUT = process.env.OUT;
const navigateur = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const journal = (...a) => console.log(new Date().toLocaleTimeString('fr-FR'), ...a);
const nbsp = (t) => (t ?? '').replace(/[  ]/g, ' ');

for (const [W, H, nomLargeur] of [[1440, 900, '1440x900'], [390, 844, '390x844']]) {
  const contexte = await navigateur.newContext({ viewport: { width: W, height: H } });
  const p = await contexte.newPage();
  const categorie = () => p.getByRole('heading', { level: 2, name: /^Emploi/ }).locator('xpath=../..');
  const champ = () => p.getByRole('combobox', { name: 'Ton métier' });
  const ouvrir = async (chemin) => {
    await p.goto(BASE + chemin);
    await p.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
    await p.waitForTimeout(1500);
  };
  const capturer = async (etat) => {
    await p.mouse.move(0, 0);
    const actif = await p.evaluate(() => {
      const a = document.activeElement;
      return a && a !== document.body ? `${a.tagName.toLowerCase()} « ${a.getAttribute('aria-label') ?? a.textContent?.trim() ?? ''} »` : 'aucun';
    });
    if (W < 1024) await p.setViewportSize({ width: W, height: 2400 });
    else await categorie().scrollIntoViewIfNeeded();
    await categorie().screenshot({ path: `${OUT}/T3a-${etat}-${nomLargeur}.png` });
    if (W < 1024) await p.setViewportSize({ width: W, height: H });
    // La page entière, à sa taille réelle, avec la catégorie amenée à l'écran.
    await categorie().scrollIntoViewIfNeeded();
    await p.screenshot({ path: `${OUT}/T3a-${etat}-page-${nomLargeur}.png` });
    journal(nomLargeur, etat, '| adresse', new URL(p.url()).search, '| focus', actif);
    journal('   ', nbsp(await categorie().innerText()).replace(/\n+/g, ' ⏎ '));
  };

  await ouvrir('/');
  await capturer('sans-metier');

  await champ().fill('dévelop');
  await p.getByRole('option').first().waitFor();
  await capturer('suggestions');

  await p.getByRole('option', { name: /^Ingénieurs et cadres d'étude.*informatique/ }).click();
  await p.getByRole('group', { name: /^Où ce métier recrute le plus/ }).waitFor();
  await capturer('un-sans-niveau');

  await ouvrir('/?loyer=1200&metier=M2X90:25');
  await capturer('peu-chiffre-25');

  await ouvrir('/?loyer=1200&metier=V1X80:10,U1X82');
  await capturer('deux');

  await contexte.close();
}
await navigateur.close();
