import { expect, test } from '@playwright/test';
import { ouvrir } from './lib/carte';

// Relecture spec (Bloquant) : Safari refuse plus de 100 réécritures de l'adresse en 30 s et lève une erreur.
// Glisser un curseur ne doit pas faire tomber la page ; l'adresse rattrape les réglages quand Safari l'accepte de nouveau.
test('limite de Safari sur l’adresse : la page survit à 120 crans, puis l’adresse rattrape les réglages', async ({ page }) => {
  await page.addInitScript(() => {
    const original = history.replaceState.bind(history);
    let appels = 0;
    (window as unknown as { limite: boolean }).limite = true;
    history.replaceState = (...args: Parameters<History['replaceState']>) => {
      appels++;
      if (appels > 100 && (window as unknown as { limite: boolean }).limite)
        throw new DOMException('Attempt to use history.replaceState() more than 100 times per 30 seconds', 'SecurityError');
      return original(...args);
    };
  });
  await ouvrir(page, '/');
  const mer = page.getByRole('slider', { name: 'Mer à moins de' });
  await mer.focus();
  // Trois allers-retours de 20 crans (60 → 160 → 60 km), puis 55 km.
  for (let i = 0; i < 120; i++) await page.keyboard.press(i % 40 < 20 ? 'ArrowRight' : 'ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('region', { name: 'Réglages' })).toBeVisible();
  await expect(mer).toHaveAttribute('aria-valuenow', '55');
  await page.evaluate(() => ((window as unknown as { limite: boolean }).limite = false));
  await expect.poll(() => new URL(page.url()).search, { timeout: 3000 }).toBe('?loyer=1200&mer=55');
});
