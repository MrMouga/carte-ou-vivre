import { expect, test } from '@playwright/test';

// Tâche 0b : les composants du système, polices hébergées dans le site, aucun appel à Google Fonts (D1).
test('page des composants : polices locales chargées, aucune requête vers Google Fonts', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/demo.html');
  await expect(page.getByRole('button', { name: 'Réessayer' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() =>
    ['400 15px "Source Sans 3"', '600 15px "Source Sans 3"', '700 18px "Source Sans 3"', '600 22px "Source Serif 4"'].map((f) => document.fonts.check(f)),
  );
  expect(loaded).toEqual([true, true, true, true]);
  expect(requests.filter((u) => /fonts\.(googleapis|gstatic)\.com/.test(u))).toEqual([]);
  expect(requests.some((u) => u.endsWith('/fonts/SourceSerif4-Semibold.woff2'))).toBe(true);
});

test('pastille : un clic la coche (aria-pressed) ; curseur : la flèche droite le déplace', async ({ page }) => {
  await page.goto('/demo.html');
  const chip = page.getByRole('button', { name: /10\s000 – 50\s000\shab\./ }).first(); // cadre-de-vie, règle (3) : taille en chiffres
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  const thumb = page.getByRole('slider').first();
  const before = Number(await thumb.getAttribute('aria-valuenow'));
  await thumb.focus();
  await page.keyboard.press('ArrowRight');
  await expect(thumb).toHaveAttribute('aria-valuenow', String(before + 1));
});
