import { expect, test, type Page } from '@playwright/test';
import { apresRendu, attendreCouleurs, ouvrir } from './lib/carte';
import { voirListe } from './lib/feuille';

// Tâche 3 : les 10 premières, la taille de ville et les messages de liste (fixture « 5 communes »).
const nbsp = (t: string | null) => (t ?? '').replace(/ /g, ' ');
const liste = (page: Page) => page.getByRole('region', { name: 'Les 10 premières' });
const lignes = async (page: Page) => (await liste(page).getByRole('button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))).map(nbsp);

async function regler(page: Page, nom: string, touche: string, fois = 1) {
  await page.getByRole('slider', { name: nom }).focus();
  for (let i = 0; i < fois; i++) await page.keyboard.press(touche);
  await apresRendu(page);
}

test('AC-4 la liste : « 3 communes passent tes critères » puis Portmer, Quaibleu, Grandeville au format de R5', async ({ page }) => {
  await ouvrir(page);
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  await expect(liste(page)).toContainText('3 communes passent tes critères');
  expect(await lignes(page)).toEqual([
    "1 · Portmer (17) · 72 · 650 € · moins d'1 km",
    '2 · Quaibleu (13) · 49 · 1 092 € · 7 km',
    '3 · Grandeville (33) · 32 · 832 € · 40 km',
  ]);
  // Ce qui se voit dans une ligne : rang, nom, chiffres, score.
  await expect(liste(page).getByRole('button').first()).toHaveText(/1Portmer \(17\)650.€ · moins d'1.km72/);
});

test('AC-5 loyer 300 € et mer 5 km : aucune commune colorée, message de liste', async ({ page }) => {
  await ouvrir(page);
  await regler(page, 'Loyer maximum', 'Home');
  await regler(page, 'Mer à moins de', 'Home');
  await expect(page.getByRole('slider', { name: 'Loyer maximum' })).toHaveAttribute('aria-valuenow', '300');
  await expect(page.getByRole('slider', { name: 'Mer à moins de' })).toHaveAttribute('aria-valuenow', '5');
  await attendreCouleurs(page, { A: null, B: null, C: null, D: null, E: null });
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  await expect(liste(page)).toContainText('Aucune commune ne passe tes critères. Relâche le loyer, la mer ou la taille.');
});

test('AC-6 loyer et mer « Sans limite » : couleur neutre sur les 5 communes, aucun score, message de liste', async ({ page }) => {
  await ouvrir(page);
  await regler(page, 'Loyer maximum', 'End');
  await regler(page, 'Mer à moins de', 'End');
  await attendreCouleurs(page, { A: 'area-unranked', B: 'area-unranked', C: 'area-unranked', D: 'area-unranked', E: 'area-unranked' });
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  await expect(liste(page)).toContainText('Fixe un loyer ou une distance à la mer pour classer les communes.');
  await expect(liste(page).getByRole('button')).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('');
  await expect(page.getByText('Sans plafond : pas de score')).toBeVisible();
});

test('zone annoncée : le compte suit les réglages (3, 1, aucune)', async ({ page }) => {
  await ouvrir(page);
  const status = page.getByRole('status');
  await expect(status).toHaveText('3 communes passent tes critères');
  await page.getByRole('button', { name: /Petite ville/ }).click();
  await expect(status).toHaveText('1 commune passe tes critères');
  await regler(page, 'Loyer maximum', 'Home');
  await expect(status).toHaveText('Aucune commune ne passe tes critères');
});
