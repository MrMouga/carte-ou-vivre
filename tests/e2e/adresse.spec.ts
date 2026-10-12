import { expect, test, type Page } from '@playwright/test';
import { apresRendu, ouvrir } from './lib/carte';

// Tâche 5a : l'adresse garde les réglages (R7, H7), fixture « 5 communes ».
const nbsp = (t: string | null) => (t ?? '').replace(/ /g, ' ');
const liste = (page: Page) => page.getByRole('region', { name: 'Les 10 premières' });
const lignes = async (page: Page) => (await liste(page).getByRole('button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))).map(nbsp);
const adresse = (page: Page) => new URL(page.url()).pathname + new URL(page.url()).search;
const valeur = async (page: Page, nom: string) => nbsp(await page.getByRole('slider', { name: nom }).getAttribute('aria-valuetext'));

test('AC-11 /?loyer=800&mer=60 : réglages 800 € et 60 km ; « 1 commune passe tes critères » puis Portmer 59', async ({ page }) => {
  await ouvrir(page, '/?loyer=800&mer=60');
  expect(await valeur(page, 'Loyer maximum')).toMatch(/^800 €/);
  expect(await valeur(page, 'Mer à moins de')).toMatch(/^60 km/);
  await expect(liste(page)).toContainText('1 commune passe tes critères');
  expect(await lignes(page)).toEqual(["1 · Portmer (17) · 59 · 650 € · moins d'1 km"]);
});

test('AC-12 /?loyer=abc&mer=aucun&taille=village : 1 200 €, Sans limite, Peu importe ; adresse /?loyer=1200&mer=aucun ; liste D 65, A 46, B 31, E 9', async ({ page }) => {
  await ouvrir(page, '/?loyer=abc&mer=aucun&taille=village');
  expect(await valeur(page, 'Loyer maximum')).toMatch(/^1 200 €/);
  expect(await valeur(page, 'Mer à moins de')).toBe('Sans limite');
  for (const t of ['Petite commune', 'Petite ville', 'Ville moyenne', 'Grande ville'])
    await expect(page.getByRole('button', { name: new RegExp(`^${t}`) })).toHaveAttribute('aria-pressed', 'false');
  expect(adresse(page)).toBe('/?loyer=1200&mer=aucun');
  expect((await lignes(page)).map((l) => l.split(' · ').slice(1, 3).join(' '))).toEqual(['Terrebasse (23) 65', 'Portmer (17) 46', 'Grandeville (33) 31', 'Quaibleu (13) 9']);
});

test("AC-13 régler le loyer sur 800 € depuis / : adresse /?loyer=800&mer=60, et l'historique n'a pas gagné d'entrée", async ({ page }) => {
  await ouvrir(page, '/');
  const avant = await page.evaluate(() => history.length);
  await page.getByRole('slider', { name: 'Loyer maximum' }).focus();
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowLeft');
  await apresRendu(page);
  expect(adresse(page)).toBe('/?loyer=800&mer=60');
  expect(await page.evaluate(() => history.length)).toBe(avant);
});

test('AC-14 /?taille=petite-ville,ville-moyenne : deux pastilles cochées ; adresse complétée ; Portmer 72, Quaibleu 49', async ({ page }) => {
  await ouvrir(page, '/?taille=petite-ville,ville-moyenne');
  await expect(page.getByRole('button', { name: /^Petite ville/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /^Ville moyenne/ })).toHaveAttribute('aria-pressed', 'true');
  expect(adresse(page)).toBe('/?loyer=1200&mer=60&taille=petite-ville,ville-moyenne');
  await expect(liste(page)).toContainText('2 communes passent tes critères');
  expect((await lignes(page)).map((l) => l.split(' · ').slice(1, 3).join(' '))).toEqual(['Portmer (17) 72', 'Quaibleu (13) 49']);
});
