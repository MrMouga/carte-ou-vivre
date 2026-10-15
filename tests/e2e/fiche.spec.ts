import { expect, test, type Page } from '@playwright/test';
import { apresRendu, attendreCouleurs, ouvrir, vue } from './lib/carte';
import { voirListe } from './lib/feuille';

// Tâche 4 : la fiche, le zoom et les ronds du top 10 (fixture « 5 communes »).
const fiche = (page: Page) => page.getByRole('region', { name: /\(\d+\)$/ });
const texte = async (page: Page) => (await fiche(page).innerText()).replace(/ /g, ' ');
const ligne = (page: Page, nom: string) => page.getByRole('region', { name: 'Les 10 premières' }).getByRole('button', { name: new RegExp(nom) });

async function regler(page: Page, nom: string, touche: string, fois = 1) {
  await page.getByRole('slider', { name: nom }).focus();
  for (let i = 0; i < fois; i++) await page.keyboard.press(touche);
  await apresRendu(page);
}

test('AC-7 depuis /?loyer=1200&mer=50, choisir Grandeville (33) dans la liste : « Ville dense · 260 000 habitants », 25, sans « Estimation du secteur »', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&mer=50');
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  await ligne(page, 'Grandeville').click();
  const t = await texte(page);
  for (const attendu of ['Grandeville (33)', 'Ville dense · 260 000 habitants', '25', '3e sur 3 communes qui passent', '832 € par mois pour 52 m² (16,0 €/m²)', "40 km de la mer à vol d'oiseau"])
    expect(t).toContain(attendu);
  expect(t).not.toContain('Estimation du secteur');
  await expect(fiche(page).getByText('25', { exact: true })).toBeVisible();
});

test('AC-8 depuis /?loyer=1200&mer=50, choisir Portmer (17) : ville et périphérie, 1re sur 3, estimation du secteur, moins d’1 km', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&mer=50');
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  await ligne(page, 'Portmer').click();
  const t = await texte(page);
  for (const attendu of ['Portmer (17)', 'Ville et périphérie · 23 000 habitants', '1re sur 3 communes qui passent', '650 € par mois pour 52 m² (12,5 €/m²)', 'Estimation du secteur (communes voisines)', "moins d'1 km de la mer"])
    expect(t).toContain(attendu);
});

test('AC-9 depuis /?loyer=1200&mer=50, choisir Montcher (75) sur la carte : deux raisons, sans score ni rang', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&mer=50');
  const { centre } = vue(page);
  await page.mouse.click(centre('C').x, centre('C').y);
  await expect(fiche(page)).toContainText('Montcher (75)');
  const t = await texte(page);
  expect(t).toContain('Loyer 1 560 € : au-dessus de ton plafond de 1 200 €');
  expect(t).toContain('Mer 148 km : au-dessus de ton plafond de 50 km');
  expect(t).not.toMatch(/\/ 100|sur \d+ communes? qui pass/);
});

test('AC-10 depuis /?loyer=1200&mer=50, cocher « 10 000 – 50 000 hab. » : seule A passe (72), « 1 commune passe tes critères », Grandeville : raison de taille', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&mer=50');
  await page.getByRole('button', { name: /^10\s000 – 50\s000\shab\.$/ }).click();
  await apresRendu(page);
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  await expect(page.getByRole('region', { name: 'Les 10 premières' })).toContainText('1 commune passe tes critères');
  await expect(ligne(page, 'Portmer')).toHaveAccessibleName(/^1 · Portmer \(17\) · 72 · /);
  await attendreCouleurs(page, { A: 'score-4', D: null, E: null, B: null, C: null });
  const { centre } = vue(page);
  await page.mouse.click(centre('B').x, centre('B').y);
  await expect(fiche(page)).toContainText('Grandeville (33)');
  expect(await texte(page)).toContain('Taille : 260 000 habitants, hors des tailles choisies');
});

test('parcours : fiche de Grandeville → loyer 800 € → ne passe pas → sans limite → ni score ni rang → retour à la liste', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'à 390 px, la fiche remplace les réglages (Figma 11:667) : on ne règle pas avec une fiche ouverte');
  await ouvrir(page, '/?loyer=1200&mer=50'); // cadre-de-vie, règle (1) du recalage : réglage explicite
  await ligne(page, 'Grandeville').click();
  await expect(fiche(page)).toContainText('3e sur 3 communes qui passent');
  await regler(page, 'Loyer maximum', 'ArrowLeft', 8); // 1 200 → 800 €
  let t = await texte(page);
  expect(t).toContain('Ne passe pas tes critères'.toUpperCase());
  expect(t).toContain('Loyer 832 € : au-dessus de ton plafond de 800 €');
  await regler(page, 'Loyer maximum', 'End');
  // Cadre-de-vie, règle (2) : la mer se règle par les cases « Mer à moins de » ; D12, règle (3) : « Peu importe » n'existe
  // plus, on décoche la pastille cochée (50 km).
  await page.getByRole('group', { name: 'Mer à moins de' }).getByRole('button', { name: '50 km', exact: true }).click();
  await apresRendu(page);
  t = await texte(page);
  expect(t).not.toMatch(/\/ 100|qui pass|NE PASSE PAS/);
  expect(t).toContain('832 € par mois pour 52 m² (16,0 €/m²)');
  await fiche(page).getByRole('button', { name: '← Les 10 premières' }).click();
  await expect(page.getByRole('region', { name: 'Les 10 premières' })).toBeVisible();
});

test('ronds du top 10 : un rond par commune qui passe, son clic ouvre la fiche, le rond choisi est marqué', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&mer=50'); // cadre-de-vie, règle (1) du recalage : réglage explicite
  const ronds = page.locator('.maplibregl-marker');
  await expect(ronds).toHaveCount(3);
  await page.getByRole('button', { name: '2e : Quaibleu (13)' }).click();
  await expect(fiche(page)).toContainText('Quaibleu (13)');
  await expect(page.getByRole('button', { name: '2e : Quaibleu (13)' })).toHaveAttribute('aria-current', 'true');
});
