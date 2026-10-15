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

test('limite de Chrome sur l’adresse : après 270 crans, l’adresse finit par suivre les réglages', async ({ page }) => {
  test.setTimeout(60_000);
  await ouvrir(page, '/');
  // Cadre-de-vie, règle (2) : le curseur de la mer n'existe plus ; la limite s'éprouve avec le curseur du prix.
  const prix = page.getByRole('slider', { name: 'Loyer maximum' });
  await prix.focus();
  // Treize allers-retours de 10 crans (1 200 → 1 700 → 1 200 €, crans de 50 €) et 10 crans de plus (1 700 €), puis 1 650 €.
  for (let i = 0; i < 270; i++) await page.keyboard.press(i % 20 < 10 ? 'ArrowRight' : 'ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(prix).toHaveAttribute('aria-valuenow', '1650');
  await expect.poll(() => new URL(page.url()).search, { timeout: 20_000 }).toBe('?loyer=1650');
});
