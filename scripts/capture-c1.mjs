// Captures de la correction 1 de recherche-et-mer : « 01300 » dans la recherche, sur la version construite
// (`npx vite preview --port 4180`), vraies données de public/data. Usage : node scripts/capture-c1.mjs <dossier>
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:4180/';
const dossier = process.argv[2];
const navigateur = await chromium.launch({ channel: 'chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function capturer(nom, viewport, toucher, clavier) {
  const page = await navigateur.newPage({ viewport, hasTouch: toucher });
  if (clavier) {
    // Clavier de l'iPhone simulé comme dans tests/e2e/recherche.spec.ts : partie visible de la page réduite à `clavier` px.
    await page.addInitScript(() => {
      const vv = Object.assign(new EventTarget(), { width: innerWidth, height: innerHeight, offsetTop: 0, offsetLeft: 0, pageTop: 0, pageLeft: 0, scale: 1 });
      Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => vv });
      window.__clavier = (y) => {
        vv.height = y;
        vv.dispatchEvent(new Event('resize'));
      };
    });
  }
  await page.goto(BASE);
  await page.getByTestId('carte').and(page.locator('[data-carte-prete="1"]')).waitFor({ timeout: 60_000 });
  const loupe = page.getByRole('button', { name: 'Chercher une commune', exact: true });
  await (toucher ? loupe.tap() : loupe.click());
  if (clavier) await page.evaluate((y) => window.__clavier(y), clavier);
  const champ = page.getByRole('combobox', { name: 'Chercher une commune', exact: true });
  await champ.pressSequentially('01300');
  const liste = page.getByRole('listbox', { name: 'Suggestions de communes' });
  await liste.getByRole('option').nth(5).waitFor();
  await page.waitForTimeout(500);
  const mesure = await liste.evaluate((ul) => {
    const l = ul.getBoundingClientRect();
    const vues = [...ul.children].filter((li) => li.getBoundingClientRect().top >= l.top - 1 && li.getBoundingClientRect().bottom <= l.bottom + 1).length;
    return { haut: Math.round(l.top), bas: Math.round(l.bottom), hauteur: Math.round(l.height), suggestions: ul.children.length, entieres: vues };
  });
  const c = await champ.boundingBox();
  console.log(nom, JSON.stringify({ viewport, champ: Math.round(c.y), ...mesure }));
  // En bureau, la moitié gauche seulement (panneau de réglages et carte autour) : la capture entière dépasse 600 Ko.
  await page.screenshot({ path: `${dossier}/${nom}.png`, clip: toucher ? undefined : { x: 0, y: 0, width: 720, height: viewport.height } });
  await page.close();
}

await capturer('C1-390-01300', { width: 390, height: 844 }, true);
await capturer('C1-390x664-clavier-01300', { width: 390, height: 664 }, true, 342);
await capturer('C1-bureau-01300', { width: 1280, height: 800 }, false);
await navigateur.close();
