import { expect, test, type Page } from '@playwright/test';
import { apresRendu, ouvrir } from './lib/carte';
import { voirListe } from './lib/feuille';

// Tâche 5a : l'adresse garde les réglages (R7, H7), fixture « 5 communes ».
const nbsp = (t: string | null) => (t ?? '').replace(/ /g, ' ');
const liste = (page: Page) => page.getByRole('region', { name: 'Les 10 premières' });
const lignes = async (page: Page) => (await liste(page).getByRole('button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))).map(nbsp);
const adresse = (page: Page) => new URL(page.url()).pathname + new URL(page.url()).search;
const valeur = async (page: Page, nom: string) => nbsp(await page.getByRole('slider', { name: nom }).getAttribute('aria-valuetext'));

/** Cadre-de-vie (R28, H69) : la case de mer cochée, lue par son nom. */
const merCochee = (page: Page) => page.getByRole('radiogroup', { name: 'Mer à moins de' }).getByRole('radio', { checked: true });
/** Cadre-de-vie (R27) : une pastille de taille, par son libellé en chiffres (espaces insécables dans les nombres). */
const pastille = (page: Page, libelle: string) =>
  page.getByRole('group', { name: 'Taille de la commune' }).getByRole('button', { name: new RegExp(`^${libelle.replace(/ /g, '\\s')}$`) });

test('AC-11 /?loyer=800&mer=50 : réglages 800 € et 50 km ; « 1 commune passe tes critères » puis Portmer 58', async ({ page }) => {
  await ouvrir(page, '/?loyer=800&mer=50');
  expect(await valeur(page, 'Loyer maximum')).toMatch(/^800 €/);
  expect(nbsp(await merCochee(page).textContent())).toBe('50 km');
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  await expect(liste(page)).toContainText('1 commune passe tes critères');
  expect(await lignes(page)).toEqual(["1 · Portmer (17) · 58 · 650 € · moins d'1 km"]);
});

test('AC-12 /?loyer=abc&mer=aucun&taille=village : 1 200 €, mer sur Peu importe, aucune taille cochée ; adresse /?loyer=1200 ; liste D 65, A 46, B 31, E 9', async ({ page }) => {
  await ouvrir(page, '/?loyer=abc&mer=aucun&taille=village');
  expect(await valeur(page, 'Loyer maximum')).toMatch(/^1 200 €/);
  expect(nbsp(await merCochee(page).textContent())).toBe('Peu importe');
  for (const t of ['Moins de 10 000 hab.', '10 000 – 50 000 hab.', '50 000 – 200 000 hab.', 'Plus de 200 000 hab.'])
    await expect(pastille(page, t)).toHaveAttribute('aria-pressed', 'false');
  expect(adresse(page)).toBe('/?loyer=1200');
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  expect((await lignes(page)).map((l) => l.split(' · ').slice(1, 3).join(' '))).toEqual(['Terrebasse (23) 65', 'Portmer (17) 46', 'Grandeville (33) 31', 'Quaibleu (13) 9']);
});

test("AC-13 régler le loyer sur 800 € depuis / : adresse /?loyer=800, et l'historique n'a pas gagné d'entrée", async ({ page }) => {
  await ouvrir(page, '/');
  const avant = await page.evaluate(() => history.length);
  await page.getByRole('slider', { name: 'Loyer maximum' }).focus();
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowLeft');
  await apresRendu(page);
  expect(adresse(page)).toBe('/?loyer=800');
  expect(await page.evaluate(() => history.length)).toBe(avant);
});

test('AC-14 /?taille=petite-ville,ville-moyenne : « 10 000 – 50 000 hab. » et « 50 000 – 200 000 hab. » cochées ; adresse complétée ; Portmer 46, Quaibleu 9', async ({ page }) => {
  await ouvrir(page, '/?taille=petite-ville,ville-moyenne');
  await expect(pastille(page, '10 000 – 50 000 hab.')).toHaveAttribute('aria-pressed', 'true');
  await expect(pastille(page, '50 000 – 200 000 hab.')).toHaveAttribute('aria-pressed', 'true');
  expect(adresse(page)).toBe('/?loyer=1200&taille=petite-ville,ville-moyenne');
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  await expect(liste(page)).toContainText('2 communes passent tes critères');
  expect((await lignes(page)).map((l) => l.split(' · ').slice(1, 3).join(' '))).toEqual(['Portmer (17) 46', 'Quaibleu (13) 9']);
});
