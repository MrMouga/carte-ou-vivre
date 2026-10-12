import { test } from '@playwright/test';
import { apresRendu, attendreCouleurs, ouvrir } from './lib/carte';

// Tâche 2 : la carte se colore selon les réglages et réagit aux plafonds (fixture « 5 communes »).
const curseur = (page: import('@playwright/test').Page, nom: string) => page.getByRole('slider', { name: nom });

test('AC-1 réglages de départ : A palier 60–80, E palier 40–60, B palier 20–40 ; C et D non colorées', async ({ page }) => {
  await ouvrir(page);
  await attendreCouleurs(page, { A: 'score-4', E: 'score-3', B: 'score-2', C: null, D: null });
});

test('AC-2 mer « Sans limite » : D 65 (60–80), A 46 (40–60), B 31 (20–40), E 9 (0–20) ; seule C non colorée', async ({ page }) => {
  await ouvrir(page);
  await curseur(page, 'Mer à moins de').focus();
  await page.keyboard.press('End');
  await apresRendu(page);
  await attendreCouleurs(page, { D: 'score-4', A: 'score-3', B: 'score-2', E: 'score-1', C: null });
});

test('AC-3 mer 40 km : B passe avec 15 (0–20), A 72 (60–80), E 46 (40–60) ; C et D non colorées', async ({ page }) => {
  await ouvrir(page);
  await curseur(page, 'Mer à moins de').focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowLeft');
  await apresRendu(page);
  await attendreCouleurs(page, { B: 'score-1', A: 'score-4', E: 'score-3', C: null, D: null });
});
