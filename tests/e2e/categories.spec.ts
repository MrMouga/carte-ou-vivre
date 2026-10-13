import { expect, test, type Page } from '@playwright/test';
import { ouvrir } from './lib/carte';

// Tranche proches, tâche 1 : catégories repliables (design decisions.md, Figma « Catégorie repliable » 20:180).
// Motif « disclosure » : h2 > button[aria-expanded] ; repliée, le titre garde un résumé du réglage.
const nbsp = (t: string | null) => (t ?? '').replace(/\u00a0/g, ' ');
const titre = (page: Page, nom: string) => page.getByRole('heading', { level: 2, name: new RegExp(`^${nom}`) }).getByRole('button');

test('replier Loyer affiche 1 200 € et cache le curseur ; le clavier ouvre et ferme', async ({ page }) => {
  await ouvrir(page);
  const loyer = titre(page, 'Loyer');
  const curseur = page.getByRole('slider', { name: 'Loyer maximum' });
  await expect(loyer).toHaveAttribute('aria-expanded', 'true');
  await expect(curseur).toBeVisible();

  await loyer.click();
  await expect(loyer).toHaveAttribute('aria-expanded', 'false');
  await expect(curseur).toBeHidden();
  expect(nbsp(await loyer.textContent())).toBe('Loyer1 200 €');

  // Au clavier : Entrée ouvre, Espace referme.
  await loyer.focus();
  await page.keyboard.press('Enter');
  await expect(loyer).toHaveAttribute('aria-expanded', 'true');
  await expect(curseur).toBeVisible();
  expect(nbsp(await loyer.textContent())).toBe('Loyer');
  await page.keyboard.press('Space');
  await expect(loyer).toHaveAttribute('aria-expanded', 'false');
  await expect(curseur).toBeHidden();
});

test('toutes ouvertes au départ ; résumés « 60 km », « Peu importe », puis « Sans limite » et les tailles cochées', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&mer=aucun&taille=petite-ville,ville-moyenne');
  for (const nom of ['Loyer', 'Mer', 'Taille de ville']) await expect(titre(page, nom)).toHaveAttribute('aria-expanded', 'true');
  for (const nom of ['Loyer', 'Mer', 'Taille de ville']) await titre(page, nom).click();
  expect(nbsp(await titre(page, 'Mer').textContent())).toBe('MerSans limite');
  expect(nbsp(await titre(page, 'Taille de ville').textContent())).toBe('Taille de villePetite ville, Ville moyenne');
  await expect(page.getByRole('button', { name: /^Petite ville/ })).toBeHidden();

  await ouvrir(page, '/');
  await titre(page, 'Mer').click();
  await titre(page, 'Taille de ville').click();
  expect(nbsp(await titre(page, 'Mer').textContent())).toBe('Mer60 km');
  expect(nbsp(await titre(page, 'Taille de ville').textContent())).toBe('Taille de villePeu importe');
});

test('cible du titre : 24 px de haut en bureau, 44 px à 390 px', async ({ page }) => {
  await ouvrir(page);
  const attendu = page.viewportSize()!.width >= 1024 ? 24 : 44;
  for (const nom of ['Loyer', 'Mer', 'Taille de ville']) {
    const boite = await titre(page, nom).boundingBox();
    expect(boite!.height).toBeGreaterThanOrEqual(attendu);
  }
});
