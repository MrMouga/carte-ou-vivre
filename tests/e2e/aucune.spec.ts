import { expect, test } from '@playwright/test';
import { ouvrir } from './lib/carte';

// Relecture QA (Majeur) : à 390 px, la liste est sous les réglages, hors de l'écran ; quand aucune commune ne passe,
// la bande de carte visible dit pourquoi la carte est vide.
test('390 px, aucune commune : la raison est visible sans faire défiler', async ({ page }) => {
  test.skip(page.viewportSize()!.width >= 1024, 'en bureau, la liste est visible à côté de la carte');
  await ouvrir(page, '/?loyer=300&mer=5');
  const message = page.getByTestId('carte-vide');
  await expect(message).toHaveText('Aucune commune ne passe tes critères');
  await expect(message).toBeInViewport({ ratio: 1 });
  const feuille = await page.getByTestId('feuille').boundingBox();
  const boite = await message.boundingBox();
  expect(boite!.y + boite!.height).toBeLessThanOrEqual(feuille!.y); // au-dessus de la feuille, pas dessous
});
