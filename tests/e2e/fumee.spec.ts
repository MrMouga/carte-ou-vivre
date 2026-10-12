import { expect, test } from '@playwright/test';
import { color } from '../../src/theme/tokens';
import { ouvrir } from './lib/carte';
import { readPixels } from './lib/pixels';

test('la carte MapLibre se peint (WebGL disponible), sans erreur dans la console', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await ouvrir(page);
  // Haut de la carte, au milieu (entre les panneaux en bureau, au-dessus de la légende à 390 px) : le fond uni du style local, peint par WebGL.
  const [px] = await readPixels(page, [{ x: page.viewportSize()!.width / 2, y: 8 }]);
  const fond = [1, 3, 5].map((i) => parseInt(color.background.slice(i, i + 2), 16));
  for (const [i, v] of fond.entries()) expect(Math.abs(px[i] - v)).toBeLessThanOrEqual(3);
  expect(errors).toEqual([]);
});
