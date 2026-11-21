// Tâche 3b d'emploi : preuve sur les vraies données, version construite servie par `npx vite preview --port 4180`, en
// bureau (1 440 × 900) et à 390 × 844 : « infirm » → choisir « Infirmiers et sages-femmes » → cocher « 10 % », puis
// décocher. À chaque étape : capture de la page (carte et liste ; à 390 px, la carte au-dessus de l'onglet « Critères »,
// puis l'onglet « Les 10 premières »), adresse, compte et lignes de la liste écrits sur la sortie.
// Lancer : OUT=<dossier temporaire> node docs/plans/2026-11-21-emploi/captures/T3b-preuve-reel.mjs
import { chromium } from '/Users/mouga/git-repository/carte-ou-vivre/node_modules/playwright/index.mjs';
const BASE = process.env.BASE ?? 'http://localhost:4180';
const OUT = process.env.OUT;
const navigateur = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const journal = (...a) => console.log(new Date().toLocaleTimeString('fr-FR'), ...a);
const nbsp = (t) => (t ?? '').replace(/[  ]/g, ' ');

for (const [W, H, nomLargeur] of [[1440, 900, '1440x900'], [390, 844, '390x844']]) {
  const contexte = await navigateur.newContext({ viewport: { width: W, height: H } });
  const p = await contexte.newPage();
  const mobile = W < 1024;
  const liste = () => p.getByRole('region', { name: 'Les 10 premières' });
  const onglet = (nom) => p.getByRole('tab', { name: nom, exact: true });
  const caseDix = () => p.getByRole('group', { name: /^Où ce métier recrute le plus Infirmiers/ }).getByRole('button', { name: '10 %', exact: true });
  const attendreRendu = () => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 1500)))));
  const relever = async (etape) => {
    await p.mouse.move(0, 0);
    await attendreRendu();
    if (mobile) await caseDix().or(p.getByRole('combobox', { name: 'Ton métier' })).first().scrollIntoViewIfNeeded();
    await p.screenshot({ path: `${OUT}/T3b-${etape}-${nomLargeur}.png` });
    if (mobile) {
      await onglet('Les 10 premières').click();
      await attendreRendu();
      await p.screenshot({ path: `${OUT}/T3b-${etape}-liste-${nomLargeur}.png` });
    }
    const compte = nbsp(await p.getByRole('status').filter({ hasText: /passe|commune/ }).first().innerText().catch(() => '?'));
    const lignes = (await liste().getByRole('button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? ''))).map(nbsp);
    journal(nomLargeur, etape, '| adresse', new URL(p.url()).search, '| compte', compte);
    lignes.forEach((l) => journal('   ', l));
    if (mobile) await onglet('Critères').click();
  };

  await p.goto(BASE + '/');
  await p.locator('[data-testid="carte"][data-carte-prete="1"]').waitFor({ timeout: 60000 });
  await p.getByRole('combobox', { name: 'Ton métier' }).fill('infirm');
  journal(nomLargeur, 'suggestions pour « infirm » :', (await p.getByRole('listbox', { name: 'Suggestions de métiers' }).getByRole('option').allInnerTexts()).join(' | '));
  await p.getByRole('option', { name: 'Infirmiers et sages-femmes', exact: true }).click();
  await caseDix().waitFor();
  await relever('infirmiers-choisi');

  await caseDix().click();
  await relever('infirmiers-10');

  await caseDix().click();
  await relever('infirmiers-decoche');

  await contexte.close();
}
await navigateur.close();
