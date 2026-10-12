import { expect, test } from '@playwright/test';
import { readPixels } from './lib/pixels';

test('la carte MapLibre se peint (WebGL disponible)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-map-ready', '1');
  // Le fond uni #F7F4EE (247, 244, 238) doit être peint par WebGL au centre de la carte.
  const [px] = await readPixels(page, [{ x: 720, y: 450 }]);
  for (const [i, v] of [247, 244, 238].entries()) expect(Math.abs(px[i] - v)).toBeLessThanOrEqual(3);
  expect(errors).toEqual([]);
});
