import { expect, test, type Page } from '@playwright/test';
import { apresRendu, attendreCouleurs, ouvrir } from './lib/carte';
import { voirListe, voirCriteres } from './lib/feuille';
import { servirIgn } from './lib/ign';

// Tâche 2b (proches) : ajouter un proche dans le panneau « Tes proches » ; la liste et la carte en tiennent compte.
// Faux service IGN de la fixture (tests/e2e/lib/ign.ts), posé après `ouvrir`. Un proche dure ≈ 2,85 s (file à 250 ms) :
// l'état prêt s'attend jusqu'à 10 s.
const PRET_MS = 10_000;
const nbsp = (t: string | null) => (t ?? '').replace(/\u00a0/g, ' ');
const zone = (page: Page) => page.getByRole('region', { name: 'Tes proches' });
const liste = (page: Page) => page.getByRole('region', { name: 'Les 10 premières' });
const lignes = async (page: Page) => (await liste(page).getByRole('button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))).map(nbsp);
const plafond = (page: Page, nom: string) => page.getByRole('slider', { name: `Plafond de ${nom}` });

/** Cherche `texte`, choisit la suggestion `suggestion` (nom accessible « Ligne 1, Ligne 2 »), garde ou remplace le nom, « Ajouter ». */
async function ajouter(page: Page, texte: string, suggestion: string, nom?: string) {
  const champ = zone(page).getByRole('textbox', { name: 'Adresse ou ville' });
  if (!(await champ.isVisible())) await zone(page).getByRole('button', { name: '+ Ajouter un proche' }).click();
  await champ.fill(texte);
  await zone(page).getByRole('button', { name: suggestion }).click();
  if (nom != null) await zone(page).getByRole('textbox', { name: 'Nom' }).fill(nom);
  await zone(page).getByRole('button', { name: 'Ajouter', exact: true }).click();
}

/** Attend que le proche `nom` soit prêt (son curseur de plafond apparaît). */
async function pret(page: Page, nom: string) {
  await expect(plafond(page, nom)).toBeVisible({ timeout: PRET_MS });
  await apresRendu(page);
}

async function regler(page: Page, nom: string, touche: string, fois = 1) {
  await page.getByRole('slider', { name: nom }).focus();
  for (let i = 0; i < fois; i++) await page.keyboard.press(touche);
  await apresRendu(page);
}

/** Nantesville (44) prêt avec le plafond 2 h (valeur à l'ajout, H19). */
async function nantesville(page: Page) {
  await ajouter(page, '1 rue Test', '1 rue Test, 44000 Nantesville');
  await pret(page, 'Nantesville (44)');
}

test('AC-1 depuis /?loyer=1200&mer=50, ajouter « 1 rue Test 44000 Nantesville » : nom proposé, calcul, puis plafond 2 h ; Portmer seule passe (65) ; adresse inchangée', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&mer=50');
  await servirIgn(page);
  await zone(page).getByRole('textbox', { name: 'Adresse ou ville' }).fill('1 rue Test');
  await zone(page).getByRole('button', { name: '1 rue Test, 44000 Nantesville' }).click();
  await expect(zone(page).getByRole('textbox', { name: 'Nom' })).toHaveValue('Nantesville (44)');
  await zone(page).getByRole('button', { name: 'Ajouter', exact: true }).click();

  await expect(zone(page)).toContainText('Calcul des trajets depuis Nantesville (44)…');
  await pret(page, 'Nantesville (44)');
  await expect(zone(page).getByRole('listitem').filter({ hasText: 'Nantesville (44)' })).toContainText(/2\sh/);
  await expect(plafond(page, 'Nantesville (44)')).toHaveAttribute('aria-valuenow', '120');
  await expect(zone(page)).not.toContainText('Calcul des trajets');

  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  await expect(liste(page)).toContainText('1 commune passe tes critères');
  expect(await lignes(page)).toEqual(["1 · Portmer (17) · 65 · 650 € · moins d'1 km"]);
  await attendreCouleurs(page, { A: 'score-4', B: null, E: null });
  expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe('/?loyer=1200&mer=50');
});

test('AC-2 depuis /?loyer=1200&mer=50, plafond de Nantesville (44) sur 2 h 15 : Portmer 66, Grandeville 17 ; Quaibleu non colorée ; aucun nouveau calcul', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&mer=50');
  const demandes = await servirIgn(page);
  await nantesville(page);
  const zones = demandes.zones.length;

  await regler(page, 'Plafond de Nantesville (44)', 'ArrowRight');
  await expect(plafond(page, 'Nantesville (44)')).toHaveAttribute('aria-valuenow', '135');
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  await expect(liste(page)).toContainText('2 communes passent tes critères');
  expect(await lignes(page)).toEqual(["1 · Portmer (17) · 66 · 650 € · moins d'1 km", '2 · Grandeville (33) · 17 · 832 € · 40 km']);
  await attendreCouleurs(page, { E: null });
  expect(demandes.zones.length).toBe(zones);
});

test('AC-4 depuis /?loyer=1200&mer=50, Nantesville (44) à 2 h 15, puis Toulouseville (31) ajouté et réglé à 2 h 45 : Portmer 50, Grandeville 26', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&mer=50');
  await servirIgn(page);
  await nantesville(page);
  await regler(page, 'Plafond de Nantesville (44)', 'ArrowRight');

  await ajouter(page, '2 place Test', '2 place Test, 31000 Toulouseville');
  await pret(page, 'Toulouseville (31)');
  await regler(page, 'Plafond de Toulouseville (31)', 'ArrowRight', 3);
  await expect(plafond(page, 'Toulouseville (31)')).toHaveAttribute('aria-valuenow', '165');

  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  await expect(liste(page)).toContainText('2 communes passent tes critères');
  expect(await lignes(page)).toEqual(["1 · Portmer (17) · 50 · 650 € · moins d'1 km", '2 · Grandeville (33) · 26 · 832 € · 40 km']);
});

test('AC-6 loyer « Sans limite », aucune distance à la mer cochée, Nantesville (44) à 2 h 15 : Portmer 56 (40–60), Grandeville 0 (0–20) ; pas de message « Fixe un loyer… »', async ({ page }) => {
  await ouvrir(page);
  await servirIgn(page);
  await regler(page, 'Loyer maximum', 'End');
  await expect(page.getByRole('group', { name: 'Mer à moins de' }).getByRole('button')).toHaveCount(4);
  await expect(page.getByRole('group', { name: 'Mer à moins de' }).getByRole('button', { pressed: true })).toHaveCount(0);
  await nantesville(page);
  await regler(page, 'Plafond de Nantesville (44)', 'ArrowRight');

  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  await expect(liste(page)).toContainText('2 communes passent tes critères');
  expect(await lignes(page)).toEqual(["1 · Portmer (17) · 56 · 650 € · moins d'1 km", '2 · Grandeville (33) · 0 · 832 € · 40 km']);
  await attendreCouleurs(page, { A: 'score-3', B: 'score-1', C: null, D: null, E: null });
  await expect(page.getByText('Fixe un loyer ou une distance à la mer pour classer les communes.')).toHaveCount(0);
});

// Hors AC (details.md, D13, H20, R9) : le panneau autour de l'ajout.
test('vide : texte d’accueil et champ ; dès un proche, le champ se replie derrière « + Ajouter un proche », qui le rouvre', async ({ page }) => {
  await ouvrir(page);
  await servirIgn(page);
  await expect(zone(page)).toContainText("Ajoute l'adresse d'un proche : la carte calcule le temps en voiture jusqu'à chaque commune.");
  await expect(zone(page).getByRole('button', { name: 'Ajouter', exact: true })).toBeDisabled();
  await nantesville(page);
  await expect(zone(page).getByRole('textbox', { name: 'Adresse ou ville' })).toHaveCount(0);
  await expect(zone(page)).not.toContainText("Ajoute l'adresse d'un proche");
  await zone(page).getByRole('button', { name: '+ Ajouter un proche' }).click();
  await expect(zone(page).getByRole('textbox', { name: 'Adresse ou ville' })).toBeFocused();
});

test('recherche : rien sous 3 caractères ; un nom vide reprend la commune ; un nom libre est gardé (30 caractères au plus)', async ({ page }) => {
  await ouvrir(page);
  const demandes = await servirIgn(page);
  const champ = zone(page).getByRole('textbox', { name: 'Adresse ou ville' });
  await champ.fill('ru');
  await page.waitForTimeout(600);
  expect(demandes.recherches).toEqual([]);
  await champ.fill('1 rue Test');
  await zone(page).getByRole('button', { name: '1 rue Test, 44000 Nantesville' }).click();
  // Une seule demande pour une frappe continue (300 ms après la dernière touche).
  expect(demandes.recherches).toHaveLength(1);
  const nom = zone(page).getByRole('textbox', { name: 'Nom' });
  await expect(nom).toHaveAttribute('maxlength', '30');
  await nom.fill('');
  await zone(page).getByRole('button', { name: 'Ajouter', exact: true }).click();
  await pret(page, 'Nantesville (44)');

  await ajouter(page, '2 place Test', '2 place Test, 31000 Toulouseville', 'Parents de Léa');
  await expect(zone(page)).toContainText('Calcul des trajets depuis Parents de Léa…');
  await pret(page, 'Parents de Léa');
  await expect(zone(page).getByRole('listitem').filter({ hasText: 'Parents de Léa' })).toContainText('2 place Test 31000 Toulouseville');
  // Le nom ne part jamais vers l'IGN (H30).
  expect([...demandes.recherches, ...demandes.zones].some((u) => decodeURIComponent(u).includes('Parents'))).toBe(false);
});

test('« Retirer » sur un proche prêt : il disparaît, la liste revient sans calcul (72, 48, 25 depuis /?loyer=1200&mer=50)', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&mer=50'); // cadre-de-vie, règle (1) du recalage : réglage explicite
  const demandes = await servirIgn(page);
  await nantesville(page);
  const zones = demandes.zones.length;
  await zone(page).getByRole('button', { name: 'Retirer Nantesville (44)' }).click();
  await apresRendu(page);
  await expect(zone(page).getByRole('listitem')).toHaveCount(0);
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  expect(await lignes(page)).toEqual([
    "1 · Portmer (17) · 72 · 650 € · moins d'1 km",
    '2 · Quaibleu (13) · 48 · 1 092 € · 7 km',
    '3 · Grandeville (33) · 25 · 832 € · 40 km',
  ]);
  await voirCriteres(page); // 390 px : les réglages sont dans leur onglet (interface-telephone)
  await expect(zone(page).getByRole('textbox', { name: 'Adresse ou ville' })).toBeVisible();
  expect(demandes.zones.length).toBe(zones);
});
