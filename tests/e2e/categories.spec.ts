import { expect, test, type Page } from '@playwright/test';
import { ouvrir } from './lib/carte';

// Tranche proches, tâche 1 : catégories repliables (design decisions.md, Figma « Catégorie repliable » 20:180).
// Motif « disclosure » : h2 > button[aria-expanded] ; repliée, le titre garde un résumé du réglage.
const nbsp = (t: string | null) => (t ?? '').replace(/\u00a0/g, ' ');
const titre = (page: Page, nom: string) => page.getByRole('heading', { level: 2, name: new RegExp(`^${nom}`) }).getByRole('button');

// Tranche immobilier (tâche 2, design F) : la catégorie « Loyer » devient « Logement », résumé sous le titre.
test('replier Logement affiche « Louer · Appartement · 52 m² · 1 200 € » et cache le curseur ; le clavier ouvre et ferme', async ({ page }) => {
  await ouvrir(page);
  const loyer = titre(page, 'Logement');
  const curseur = page.getByRole('slider', { name: 'Loyer maximum' });
  await expect(loyer).toHaveAttribute('aria-expanded', 'true');
  await expect(curseur).toBeVisible();

  await loyer.click();
  await expect(loyer).toHaveAttribute('aria-expanded', 'false');
  await expect(curseur).toBeHidden();
  expect(nbsp(await loyer.textContent())).toBe('LogementLouer · Appartement · 52 m² · 1 200 €');

  // Au clavier : Entrée ouvre, Espace referme.
  await loyer.focus();
  await page.keyboard.press('Enter');
  await expect(loyer).toHaveAttribute('aria-expanded', 'true');
  await expect(curseur).toBeVisible();
  expect(nbsp(await loyer.textContent())).toBe('Logement');
  await page.keyboard.press('Space');
  await expect(loyer).toHaveAttribute('aria-expanded', 'false');
  await expect(curseur).toBeHidden();
});

// Cadre-de-vie, règle (3) : « Mer » et « Taille de ville » deviennent la catégorie « Cadre de vie », résumé de H75.
test('toutes ouvertes au départ ; résumés « 2 tailles » (mer sur Peu importe et les tailles cochées), puis « Peu importe »', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&mer=aucun&taille=petite-ville,ville-moyenne');
  for (const nom of ['Logement', 'Cadre de vie']) await expect(titre(page, nom)).toHaveAttribute('aria-expanded', 'true');
  for (const nom of ['Logement', 'Cadre de vie']) await titre(page, nom).click();
  expect(nbsp(await titre(page, 'Cadre de vie').textContent())).toBe('Cadre de vie2 tailles');
  await expect(page.getByRole('button', { name: /^10\s000 – 50\s000/ })).toBeHidden();

  await ouvrir(page, '/');
  await titre(page, 'Cadre de vie').click();
  expect(nbsp(await titre(page, 'Cadre de vie').textContent())).toBe('Cadre de viePeu importe');
});

test('cible du titre : 24 px de haut en bureau, 44 px à 390 px', async ({ page }) => {
  await ouvrir(page);
  const attendu = page.viewportSize()!.width >= 1024 ? 24 : 44;
  for (const nom of ['Logement', 'Cadre de vie']) {
    const boite = await titre(page, nom).boundingBox();
    expect(boite!.height).toBeGreaterThanOrEqual(attendu);
  }
});
