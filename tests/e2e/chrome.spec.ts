import { expect, test } from '@playwright/test';
import { ouvrir } from './lib/carte';

// Relecture du correctif (Majeur) : au-delà de 200 réécritures de l'adresse en 10 s, Chrome les ignore sans erreur.
// Playwright coupe cette protection par défaut : on la rétablit pour ce fichier.
test.use({
  launchOptions: {
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    ignoreDefaultArgs: ['--disable-ipc-flooding-protection'],
  },
});

test('limite de Chrome sur l’adresse : après 260 crans, l’adresse finit par suivre les réglages', async ({ page }) => {
  test.setTimeout(60_000);
  await ouvrir(page, '/');
  const mer = page.getByRole('slider', { name: 'Mer à moins de' });
  await mer.focus();
  // Six allers-retours de 20 crans et 20 crans de plus (60 → 160 km), puis 155 km.
  for (let i = 0; i < 260; i++) await page.keyboard.press(i % 40 < 20 ? 'ArrowRight' : 'ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(mer).toHaveAttribute('aria-valuenow', '155');
  await expect.poll(() => new URL(page.url()).search, { timeout: 20_000 }).toBe('?loyer=1200&mer=155');
});
