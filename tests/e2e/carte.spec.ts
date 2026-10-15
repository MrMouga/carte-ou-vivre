import { expect, test } from '@playwright/test';
import { apresRendu, attendreCouleurs, ouvrir } from './lib/carte';
import { voirListe } from './lib/feuille';

// Tâche 2 : la carte se colore selon les réglages et réagit aux plafonds (fixture « 5 communes »).
const curseur = (page: import('@playwright/test').Page, nom: string) => page.getByRole('slider', { name: nom });

test('AC-1 réglages de départ : D palier 60–80, A palier 40–60, B palier 20–40, E palier 0–20 ; C non colorée', async ({ page }) => {
  await ouvrir(page);
  await attendreCouleurs(page, { D: 'score-4', A: 'score-3', B: 'score-2', E: 'score-1', C: null });
});

test('AC-2 depuis /?loyer=1200&mer=50, mer « Peu importe » : D 65 (60–80), A 46 (40–60), B 31 (20–40), E 9 (0–20) ; seule C non colorée', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&mer=50');
  await page.getByRole('radiogroup', { name: 'Mer à moins de' }).getByRole('radio', { name: 'Peu importe' }).click();
  await apresRendu(page);
  await attendreCouleurs(page, { D: 'score-4', A: 'score-3', B: 'score-2', E: 'score-1', C: null });
});

test('AC-3 loyer 650 € depuis /?loyer=1200&mer=50 : A passe avec 49 (40–60, 650 € égal au plafond) ; B, C, D et E non colorées', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&mer=50');
  await curseur(page, 'Loyer maximum').focus();
  for (let i = 0; i < 11; i++) await page.keyboard.press('ArrowLeft'); // 1 200 → 650 € (crans de 50 €)
  await expect(curseur(page, 'Loyer maximum')).toHaveAttribute('aria-valuenow', '650');
  await apresRendu(page);
  await attendreCouleurs(page, { A: 'score-3', B: null, C: null, D: null, E: null });
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  await expect(page.getByRole('region', { name: 'Les 10 premières' }).getByRole('button', { name: /Portmer/ })).toHaveAccessibleName(/^1 · Portmer \(17\) · 49 · 650\s€ · /); // espace insécable (H3)
});
