import { expect, test, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import cadreDeVie from '../../../specs/2026-10-14-cadre-de-vie/acceptance.json' with { type: 'json' };
import services from '../../../specs/2026-11-23-services/acceptance.json' with { type: 'json' };
import { ouvrir, type Jeu } from '../../../../tests/e2e/lib/carte';
import { voirListe } from '../../../../tests/e2e/lib/feuille';

// Révision D19, D20 de services, tâche 1 : la catégorie à 5 lignes et la fiche de Portmer à 11 lignes, sur la fixture
// « 6 communes · services » (même jeu que tests/e2e/services.spec.ts), à 1 440 × 900 et 390 × 844. Ce ne sont pas des tests :
// des captures, avec quelques lectures écrites dans le journal (T1-captures.txt).
const tempsParCode = new Map(services.fixture.items.map((it) => [it.code_insee, { temps_services: it.temps_services, ile_sans_pont: it.ile_sans_pont }]));
const SIX_SERVICES = {
  items: cadreDeVie.fixture.items.map((it) => ({ ...it, ...tempsParCode.get(it.code_insee) })),
  tuiles: new URL('../../../../tests/fixtures/tuiles-immobilier/', import.meta.url),
} as unknown as Jeu;
const ici = (nom: string) => fileURLToPath(new URL(nom, import.meta.url));
const taille = (page: Page) => `${page.viewportSize()!.width}x${page.viewportSize()!.height}`;
const reglages = (page: Page) => page.getByRole('region', { name: 'Réglages' });

async function categorie(page: Page, nom: string) {
  const titre = reglages(page).getByRole('heading', { level: 2, name: /^Services/ });
  const contenu = page.locator(`[id="${await titre.getByRole('button').getAttribute('aria-controls')}"]`);
  // L'utilisateur fait défiler les réglages jusqu'au titre « Services », en haut de l'écran (ou de l'onglet).
  await titre.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: ici(`T1-${nom}-${taille(page)}.png`) });
  console.log(`${nom} ${taille(page)} : ${page.url().replace(/^http:\/\/localhost:\d+/, '')} ; lignes : ${(await contenu.locator('span').allTextContents()).join(' | ').replace(/ /g, ' ')}`);
  const coches = await contenu.getByRole('button', { pressed: true }).evaluateAll((els) => els.map((b) => `${b.closest('[role=group]')!.getAttribute('aria-label') ?? document.getElementById(b.closest('[role=group]')!.getAttribute('aria-labelledby')!)!.textContent} ${b.textContent}`));
  console.log(`  cochés : ${coches.join(' ; ').replace(/ /g, ' ')}`);
}

test('catégorie à 5 lignes : départ et exemple (Urgences 30 min, Supermarché 5 min)', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200', { jeu: SIX_SERVICES });
  await categorie(page, 'cat-depart');
  await ouvrir(page, '/?loyer=1200&services=urgences:30,supermarche:5', { jeu: SIX_SERVICES });
  await categorie(page, 'cat-exemple');
});

test('fiche de Portmer à 11 lignes', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200', { jeu: SIX_SERVICES });
  await voirListe(page);
  await page.getByRole('region', { name: 'Les 10 premières' }).getByRole('button', { name: / Portmer \(/ }).click();
  const fiche = page.getByRole('region', { name: /\(\w+\)$/ });
  await expect(fiche.getByRole('heading', { level: 2 })).toContainText('Portmer');
  const bloc = fiche.getByRole('heading', { name: 'Services en voiture' });
  await bloc.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: ici(`T1-fiche-portmer-${taille(page)}.png`) });
  // La dernière phrase (limites) amenée à l'écran : lisible en entier (leçon 2026-11-24-fiche-de-bureau-sans-defilement).
  const limites = fiche.getByText(/^Temps en voiture/);
  await limites.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await expect(limites).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: ici(`T1-fiche-portmer-bas-${taille(page)}.png`) });
  const lignes = (await fiche.getByRole('listitem').allTextContents()).map((t) => t.replace(/ /g, ' ')).filter((t) => / : /.test(t));
  console.log(`fiche Portmer ${taille(page)} : ${lignes.join(' | ')}`);
  console.log(`  limites entièrement à l'écran : oui ; ${(await limites.textContent())!.replace(/ /g, ' ')}`);
});
