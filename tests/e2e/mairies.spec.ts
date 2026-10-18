import { expect, test, type Page } from '@playwright/test';
import cadreDeVie from '../../docs/specs/2026-10-14-cadre-de-vie/acceptance.json' with { type: 'json' };
import { apresRendu, attendreCouleurs, ouvrir, servirFixture, vue, type Jeu } from './lib/carte';
import { voirCriteres, voirListe } from './lib/feuille';

// Tranche mairies, tâche 1 : le filtre de mairie (R38), de bout en bout par l'adresse (R41), sur la fixture « 6 communes »
// de cadre-de-vie étendue par celle de mairies (mairies et nuances servies par tests/e2e/lib/carte.ts, par code INSEE).
const SIX: Jeu = { items: cadreDeVie.fixture.items, tuiles: new URL('../fixtures/tuiles-immobilier/', import.meta.url) };
type Six = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

const nbsp = (t: string | null) => (t ?? '').replace(/\u00a0/g, ' ');
const adresse = (page: Page) => new URL(page.url()).pathname + new URL(page.url()).search;
const liste = (page: Page) => page.getByRole('region', { name: 'Les 10 premières' });
const fiche = (page: Page) => page.getByRole('region', { name: /\(\d+\)$/ });
const texteFiche = async (page: Page) => nbsp(await fiche(page).innerText());

async function ouvrirSix(page: Page, chemin = '/') {
  await ouvrir(page, chemin, { jeu: SIX });
}
/** Ouvre la fiche d'une commune sur la carte, à l'ouverture (vue de départ de la fixture). */
async function ficheDeCarte(page: Page, id: Six, nom: string) {
  const { centre } = vue(page, SIX);
  await page.mouse.click(centre(id).x, centre(id).y);
  await expect(fiche(page)).toContainText(nom);
}

test('AC-6 /?loyer=aucun&mairie=extreme-droite : Quaibleu en couleur neutre « sans plafond », sans score ; les 5 autres non colorées ; message de liste ; fiche de Portmer « Mairie : droite, hors des mairies choisies »', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=aucun&mairie=extreme-droite');
  await expect.poll(() => adresse(page)).toBe('/?loyer=aucun&mairie=extreme-droite');
  await attendreCouleurs<Six>(page, { E: 'area-unranked', A: null, B: null, C: null, D: null, F: null }, { jeu: SIX });
  await voirListe(page);
  await expect(liste(page)).toContainText('Fixe un loyer ou une distance à la mer pour classer les communes.');
  await expect(liste(page).getByRole('button')).toHaveCount(0);

  await ficheDeCarte(page, 'E', 'Quaibleu (13)');
  let t = await texteFiche(page);
  expect(t).not.toContain('/ 100');
  expect(t).not.toMatch(/sur \d+ communes? qui passen?t/);
  await expect(fiche(page).getByRole('heading', { name: 'Ne passe pas tes critères' })).toHaveCount(0);

  // Choisir une commune déplace la carte : on rouvre la même adresse pour cliquer Portmer à sa place d'ouverture.
  await ouvrirSix(page, '/?loyer=aucun&mairie=extreme-droite');
  await ficheDeCarte(page, 'A', 'Portmer (17)');
  t = await texteFiche(page);
  expect(t).toContain('Mairie : droite, hors des mairies choisies');
});

// ---------------------------------------------------------------------------------------------------------------------
// Tâche 2 : la catégorie « Vie locale » (R42, H109 à H111, design F) et ses 7 pastilles, en bureau et à 390 px (onglet
// « Critères ») ; carte, liste, fiche et adresse suivent (R38, R41).

const lignes = async (page: Page) => (await liste(page).getByRole('button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))).map(nbsp);
/** « Terrebasse (23) · 65 » : nom et score d'une ligne, sans le rang ni les chiffres. */
const nomScore = (l: string) => l.split(' · ').slice(1, 3).join(' · ');
const titreVieLocale = (page: Page) => page.getByRole('heading', { level: 2, name: /^Vie locale/ }).getByRole('button');
const mairie = (page: Page) => page.getByRole('group', { name: 'Mairie élue en 2026' });
const pastille = (page: Page, nom: string) => mairie(page).getByRole('button', { name: nom, exact: true });
const cochees = (page: Page) => mairie(page).getByRole('button', { pressed: true }).allInnerTexts();
/**
 * Choisir une commune zoome la carte sur elle (D14 de loyer-mer) : pour cliquer une autre commune à sa place d'ouverture,
 * on rouvre la même adresse (les réglages y sont tous), comme pour AC-6.
 */
async function rouvrir(page: Page) {
  await ouvrirSix(page, adresse(page));
}

test('AC-1 ouverture de / : /?loyer=1200 ; « Vie locale » ouverte suit « Cadre de vie », groupe « Mairie élue en 2026 » et ses 7 pastilles dans l’ordre, aucune cochée ; 5 communes ; repliée, « Peu importe » et pastilles cachées', async ({ page }) => {
  await ouvrirSix(page);
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
  const titres = (await page.getByRole('region', { name: 'Réglages' }).getByRole('heading', { level: 2 }).allTextContents()).map((t) => nbsp(t).trim()); // textContent : le titre est en capitales par le style seulement
  expect(titres.indexOf('Vie locale')).toBe(titres.indexOf('Cadre de vie') + 1);
  expect(titres.indexOf('Tes proches')).toBe(titres.indexOf('Vie locale') + 1); // H111
  await expect(titreVieLocale(page)).toHaveAttribute('aria-expanded', 'true');
  expect((await mairie(page).getByRole('button').allInnerTexts()).map((t) => nbsp(t).trim())).toEqual([
    'Extrême gauche', 'Gauche', 'Divers', 'Centre', 'Droite', 'Extrême droite', 'Sans étiquette',
  ]);
  for (const b of await mairie(page).getByRole('button').all()) await expect(b).toHaveAttribute('aria-pressed', 'false');
  await voirListe(page);
  await expect(liste(page)).toContainText('5 communes passent tes critères');
  expect((await lignes(page)).map(nomScore)).toEqual([
    'Terrebasse (23) · 65', 'Rhinval (67) · 52', 'Portmer (17) · 46', 'Grandeville (33) · 31', 'Quaibleu (13) · 9',
  ]);

  await voirCriteres(page);
  await titreVieLocale(page).click();
  await expect(titreVieLocale(page)).toHaveAttribute('aria-expanded', 'false');
  expect(nbsp(await titreVieLocale(page).textContent())).toBe('Vie localePeu importe');
  await expect(mairie(page)).toBeHidden();
});

test('AC-2 depuis /, « Droite » : /?loyer=1200&mairie=droite, Portmer 46 seule, B D E F non colorées, fiches de Grandeville et Terrebasse ; puis « Centre » seul : /?loyer=1200&mairie=centre, rien de coloré, liste vide', async ({ page }) => {
  await ouvrirSix(page);
  await pastille(page, 'Droite').click();
  await expect(pastille(page, 'Droite')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&mairie=droite');
  await apresRendu(page);
  await attendreCouleurs<Six>(page, { B: null, D: null, E: null, F: null }, { jeu: SIX });
  await voirListe(page);
  await expect(liste(page)).toContainText('1 commune passe tes critères');
  expect(await lignes(page)).toEqual(["1 · Portmer (17) · 46 · 650 € · moins d'1 km"]);
  await ficheDeCarte(page, 'B', 'Grandeville (33)');
  expect(await texteFiche(page)).toContain('Mairie : gauche, hors des mairies choisies');
  await rouvrir(page);
  await ficheDeCarte(page, 'D', 'Terrebasse (23)');
  expect(await texteFiche(page)).toContain('Mairie : sans étiquette, hors des mairies choisies');

  await page.getByRole('button', { name: '← Les 10 premières' }).click();
  await voirCriteres(page);
  await pastille(page, 'Droite').click();
  await pastille(page, 'Centre').click();
  await expect.poll(() => cochees(page)).toEqual(['Centre']);
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&mairie=centre');
  await apresRendu(page);
  await attendreCouleurs<Six>(page, { A: null, B: null, C: null, D: null, E: null, F: null }, { jeu: SIX });
  await voirListe(page);
  await expect(liste(page)).toContainText('Aucune commune ne passe tes critères. Relâche le loyer, la mer ou la taille.');
});

test('AC-3 depuis /, « Gauche » : Grandeville 31 seule ; puis « Sans étiquette » : /?loyer=1200&mairie=gauche,sans-etiquette, Terrebasse 65 et Grandeville 31 ; fiches de Rhinval « aucun résultat en 2026 » et de Portmer « droite »', async ({ page }) => {
  await ouvrirSix(page);
  await pastille(page, 'Gauche').click();
  await voirListe(page);
  await expect(liste(page)).toContainText('1 commune passe tes critères');
  expect(await lignes(page)).toEqual(['1 · Grandeville (33) · 31 · 832 € · 40 km']);

  await voirCriteres(page);
  await pastille(page, 'Sans étiquette').click();
  await expect.poll(() => cochees(page)).toEqual(['Gauche', 'Sans étiquette']);
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&mairie=gauche,sans-etiquette');
  await voirListe(page);
  await expect(liste(page)).toContainText('2 communes passent tes critères');
  expect((await lignes(page)).map(nomScore)).toEqual(['Terrebasse (23) · 65', 'Grandeville (33) · 31']);
  await ficheDeCarte(page, 'F', 'Rhinval (67)');
  await expect(fiche(page).getByRole('heading', { name: 'Ne passe pas tes critères' })).toBeVisible();
  expect(await texteFiche(page)).toContain('Mairie : aucun résultat en 2026, hors des mairies choisies');
  await rouvrir(page);
  await ficheDeCarte(page, 'A', 'Portmer (17)');
  await expect(fiche(page).getByRole('heading', { name: 'Ne passe pas tes critères' })).toBeVisible();
  expect(await texteFiche(page)).toContain('Mairie : droite, hors des mairies choisies');
});

test('AC-4 /?loyer=1200&mairie=droite, « Droite » décochée : aucune pastille cochée, /?loyer=1200, 5 communes avec Rhinval 52', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&mairie=droite');
  await expect(pastille(page, 'Droite')).toHaveAttribute('aria-pressed', 'true');
  await pastille(page, 'Droite').click();
  await expect.poll(() => cochees(page)).toEqual([]);
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
  await voirListe(page);
  await expect(liste(page)).toContainText('5 communes passent tes critères');
  expect((await lignes(page)).map(nomScore)).toContain('Rhinval (67) · 52');
});

test('AC-7 /?mairie=sans-etiquette,droite,droite,rouge&env=ville-et-peripherie,bourg-et-village : « Droite » et « Sans étiquette » seules cochées ; adresse réécrite ; Terrebasse 65 et Portmer 46 ; fiche de Grandeville, type puis mairie', async ({ page }) => {
  await ouvrirSix(page, '/?mairie=sans-etiquette,droite,droite,rouge&env=ville-et-peripherie,bourg-et-village');
  await expect.poll(() => cochees(page)).toEqual(['Droite', 'Sans étiquette']);
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&env=ville-et-peripherie,bourg-et-village&mairie=droite,sans-etiquette');
  await voirListe(page);
  await expect(liste(page)).toContainText('2 communes passent tes critères');
  expect((await lignes(page)).map(nomScore)).toEqual(['Terrebasse (23) · 65', 'Portmer (17) · 46']);
  await ficheDeCarte(page, 'B', 'Grandeville (33)');
  const t = await texteFiche(page);
  const env = t.indexOf('Environnement : ville dense, hors des types choisis');
  const bord = t.indexOf('Mairie : gauche, hors des mairies choisies');
  expect(env).toBeGreaterThanOrEqual(0);
  expect(bord).toBeGreaterThan(env);
});

test('AC-8 /?loyer=1200&mairie=gauche,sans-etiquette : « Vie locale » repliée dit « 2 choix », pastilles cachées ; dépliée, « Gauche » et « Sans étiquette » toujours cochées, 2 communes', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&mairie=gauche,sans-etiquette');
  await titreVieLocale(page).click();
  await expect(titreVieLocale(page)).toHaveAttribute('aria-expanded', 'false');
  expect(nbsp(await titreVieLocale(page).textContent())).toBe('Vie locale2 choix');
  await expect(mairie(page)).toBeHidden();
  await titreVieLocale(page).click();
  await expect(titreVieLocale(page)).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() => cochees(page)).toEqual(['Gauche', 'Sans étiquette']);
  await voirListe(page);
  await expect(liste(page)).toContainText('2 communes passent tes critères');
});

// Hors AC (design F, H109, H122) : « Sans étiquette » décrite par la phrase de D8 (aria-describedby) ; cases de 44 px au
// moins en 3 colonnes ; désactivées pendant le chargement, comme les autres réglages.
test('design F : 3 colonnes, cases de 44 px au moins, « Sans étiquette » décrite par « Moins de 3 500 habitants : le ministère ne classe pas les listes. »', async ({ page }) => {
  await ouvrirSix(page);
  await expect(mairie(page).getByRole('button')).toHaveCount(7);
  await expect(pastille(page, 'Sans étiquette')).toHaveAccessibleDescription('Moins de 3 500 habitants : le ministère ne classe pas les listes.');
  const boites = await Promise.all((await mairie(page).getByRole('button').all()).map(async (b) => (await b.boundingBox())!));
  for (const b of boites) expect(b.height).toBeGreaterThanOrEqual(44);
  expect(new Set(boites.slice(0, 3).map((b) => Math.round(b.y))).size).toBe(1); // une ligne de 3
  expect(Math.round(boites[3].x)).toBe(Math.round(boites[0].x)); // « Centre » sous « Extrême gauche »
  expect(Math.round(boites[6].x)).toBe(Math.round(boites[0].x)); // « Sans étiquette » en 1re colonne
  expect(boites[6].y).toBeGreaterThan(boites[3].y);
});

test('H122 : pendant le chargement, les 7 pastilles sont désactivées', async ({ page }) => {
  await servirFixture(page, { jeu: SIX });
  await page.route('**/data/mairies.json', async (r) => {
    await new Promise((f) => setTimeout(f, 1500));
    await r.fallback();
  });
  await page.goto('/');
  await expect(mairie(page).getByRole('button')).toHaveCount(7);
  for (const b of await mairie(page).getByRole('button').all()) await expect(b).toBeDisabled();
  await expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
  for (const b of await mairie(page).getByRole('button').all()) await expect(b).toBeEnabled();
});
