import { expect, test, type Page } from '@playwright/test';
import cadreDeVie from '../../docs/specs/2026-10-14-cadre-de-vie/acceptance.json' with { type: 'json' };
import { apresRendu, ouvrir, servirFixture, vue, type Jeu } from './lib/carte';
import { mobile, onglet, voirListe } from './lib/feuille';
import { map as carte, size, space } from '../../src/theme/tokens';

// Tranche recherche-et-mer, tâche 1 : chercher une commune par son nom (R58, R59, H177 à H188). Fixture « 6 communes » de
// cadre-de-vie (Rhinval compris), mêmes codes, noms, départements et populations que celle de recherche-et-mer ; tuiles
// `tuiles-immobilier`, comme emploi.spec.ts.
const SIX: Jeu = { items: cadreDeVie.fixture.items, tuiles: new URL('../fixtures/tuiles-immobilier/', import.meta.url) };
const BUREAU = { width: 1280, height: 800 };

const nbsp = (t: string | null) => (t ?? '').replace(/ /g, ' ');
const adresse = (page: Page) => new URL(page.url()).pathname + new URL(page.url()).search;
const fiche = (page: Page) => page.getByRole('region', { name: /\(\d+\)$/ });
const loupe = (page: Page) => page.getByRole('button', { name: 'Chercher une commune', exact: true });
const champ = (page: Page) => page.getByRole('combobox', { name: 'Chercher une commune', exact: true });
const suggestions = (page: Page) => page.getByRole('listbox', { name: 'Suggestions de communes' }).getByRole('option');
const AUCUNE = 'Aucune commune ne correspond.';

async function ouvrirSix(page: Page, chemin = '/') {
  await ouvrir(page, chemin, { jeu: SIX });
}
/** Efface le champ et tape `texte` touche après touche. */
async function taper(page: Page, texte: string) {
  await champ(page).fill('');
  await champ(page).pressSequentially(texte);
}
/** Les suggestions affichées, par leur nom accessible (plan : « Grandeville (33) », la population est cachée). */
async function attendreSuggestions(page: Page, noms: string[]) {
  await expect(suggestions(page)).toHaveCount(noms.length);
  for (const [i, nom] of noms.entries()) await expect(suggestions(page).nth(i)).toHaveAccessibleName(nom);
  if (noms.length) await expect(suggestions(page).first()).toBeVisible();
}
/** Le texte de la fiche, tel qu'écrit (`textContent` : sans les capitales de style d'« innerText »). */
async function texteFiche(page: Page) {
  await expect(fiche(page)).toBeVisible();
  return nbsp(await fiche(page).textContent());
}

/** Vue de la carte à la fin du dernier mouvement (MapView, `data-vue`) : zoom, longitude, latitude. */
const lireVue = async (page: Page) => (await page.getByTestId('carte').getAttribute('data-vue'))!.split(' ').map(Number);
/** Lance `action` et attend la vue de la fin du cadrage animé (un seul `moveend`, à la fin de l'animation). */
async function vueApres(page: Page, action: () => Promise<void>) {
  const avant = await page.getByTestId('carte').getAttribute('data-vue');
  await action();
  await expect.poll(() => page.getByTestId('carte').getAttribute('data-vue'), { timeout: carte['duree-zoom-ms'] + 5000 }).not.toBe(avant);
  return lireVue(page);
}
const mx = (lon: number) => (lon + 180) / 360;
const my = (lat: number) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2;

// ---------------------------------------------------------------------------------------------------------------------
// Critères de la tâche 1.

test('AC-1 en bureau : « q » rien, « QUAI » Quaibleu (13), « grandé » Grandeville (33), « mo » Montcher (75) ; aucune requête hors du site pendant la saisie', async ({ page }) => {
  test.skip(mobile(page), 'critère en bureau (1 280 × 800)');
  await page.setViewportSize(BUREAU);
  await ouvrirSix(page);
  await loupe(page).click();
  await expect(champ(page)).toBeFocused();

  const requetes: string[] = [];
  page.on('request', (r) => requetes.push(r.url()));

  await taper(page, 'q');
  await apresRendu(page);
  await attendreSuggestions(page, []);
  await expect(page.getByText(AUCUNE)).toHaveCount(0);

  await taper(page, 'QUAI');
  await attendreSuggestions(page, ['Quaibleu (13)']);
  await taper(page, 'grandé');
  await attendreSuggestions(page, ['Grandeville (33)']);
  await taper(page, 'mo');
  await attendreSuggestions(page, ['Montcher (75)']);
  await apresRendu(page);

  const site = new URL(page.url()).origin;
  expect(requetes.filter((u) => new URL(u).origin !== site), 'requêtes vers un autre site').toEqual([]);
  expect(requetes.filter((u) => /quai|grand/i.test(decodeURIComponent(u))), 'requêtes qui contiennent la saisie').toEqual([]);
});

test('AC-4 en bureau : « mo », flèche bas, Entrée : fiche de Montcher (75), carte cadrée comme un choix sur la carte, champ « Montcher (75) », adresse inchangée', async ({ page }) => {
  test.skip(mobile(page), 'critère en bureau (1 280 × 800)');
  await page.setViewportSize(BUREAU);

  // Référence : Montcher choisie sur la carte, depuis la vue de départ.
  await ouvrirSix(page);
  const { centre } = vue(page, SIX);
  const [zCarte, lngCarte, latCarte] = await vueApres(page, () => page.mouse.click(centre('C').x, centre('C').y));
  await expect(fiche(page)).toContainText('Montcher (75)');

  // La même vue de départ, puis la recherche au clavier.
  await ouvrirSix(page);
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
  await loupe(page).click();
  await taper(page, 'mo');
  await attendreSuggestions(page, ['Montcher (75)']);
  const [z, lng, lat] = await vueApres(page, async () => {
    await champ(page).press('ArrowDown');
    await champ(page).press('Enter');
  });

  const t = await texteFiche(page);
  expect(t).toContain('Montcher (75)');
  expect(t).toContain('Ne passe pas tes critères');
  expect(t).toContain('Loyer 1 560 € : au-dessus de ton plafond de 1 200 €');
  expect(Math.abs(z - zCarte)).toBeLessThanOrEqual(0.01);
  const monde = 512 * 2 ** z;
  expect(Math.abs(mx(lng) - mx(lngCarte)) * monde, 'écart horizontal du centre (px)').toBeLessThanOrEqual(1);
  expect(Math.abs(my(lat) - my(latCarte)) * monde, 'écart vertical du centre (px)').toBeLessThanOrEqual(1);
  await expect(champ(page)).toHaveValue('Montcher (75)');
  await expect(suggestions(page)).toHaveCount(0);
  expect(adresse(page)).toBe('/?loyer=1200');
});

test('AC-5 à 390 × 844 : « grand », toucher Grandeville (33) : fiche dans la feuille, 31, 4e sur 5 ; « ← Les 10 premières » ramène la liste', async ({ page }) => {
  test.skip(!mobile(page), 'critère à 390 × 844 (feuille mobile)');
  await ouvrirSix(page);
  await expect(onglet(page, 'Critères')).toHaveAttribute('aria-selected', 'true');
  await loupe(page).click();
  await expect(champ(page)).toBeFocused();
  await taper(page, 'grand');
  await attendreSuggestions(page, ['Grandeville (33)']);
  await suggestions(page).first().click();

  const feuille = page.getByTestId('feuille');
  await expect(feuille.locator(fiche(page))).toBeVisible();
  const t = await texteFiche(page);
  expect(t).toContain('Grandeville (33)');
  expect(t).toContain('31');
  expect(t).toContain('4e sur 5 communes qui passent');
  await page.getByRole('button', { name: '← Les 10 premières' }).click();
  await expect(onglet(page, 'Les 10 premières')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('region', { name: 'Les 10 premières' })).toBeVisible();
});

test('AC-11 état « aucune commune » (/?loyer=300) : « grand », Grandeville (33) choisie : sa fiche dit pourquoi, le message reste le même', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=300');
  const statut = page.getByRole('status');
  await expect(statut).toHaveText('Aucune commune ne passe tes critères');
  await voirListe(page);
  const message = nbsp(await page.getByRole('region', { name: 'Les 10 premières' }).innerText());

  await loupe(page).click();
  await taper(page, 'grand');
  await attendreSuggestions(page, ['Grandeville (33)']);
  await suggestions(page).first().click();
  const t = await texteFiche(page);
  expect(t).toContain('Grandeville (33)');
  expect(t).toContain('Ne passe pas tes critères');
  expect(t).toContain('Loyer 832 € : au-dessus de ton plafond de 300 €');
  await expect(statut).toHaveText('Aucune commune ne passe tes critères');

  await page.getByRole('button', { name: '← Les 10 premières' }).click();
  expect(nbsp(await page.getByRole('region', { name: 'Les 10 premières' }).innerText())).toBe(message);
  expect(adresse(page)).toBe('/?loyer=300');
});

// ---------------------------------------------------------------------------------------------------------------------
// Règles de la tâche 1 hors critère : clavier et annonces (H186), champ rouvert et commune choisie ailleurs (H184),
// « Annuler » (decisions.md), champ inactif pendant le chargement (H188), place du champ au téléphone (H177, R20).

test('H186 : nombre de suggestions annoncé, « Aucune commune ne correspond. », Échap ferme puis vide ; « Annuler » rend le focus à la loupe', async ({ page }) => {
  await ouvrirSix(page);
  await loupe(page).click();
  // La zone annoncée du champ (aria-live, à part du compte) : dans le bloc de la recherche, qui contient le champ.
  const zone = champ(page).locator('xpath=ancestor::div[3]').locator('[aria-live="polite"]');
  await expect(zone).toHaveText('');
  await taper(page, 'g');
  await expect(zone).toHaveText('');
  await taper(page, 'zzz');
  await expect(page.getByText(AUCUNE)).toBeVisible();
  await expect(zone).toHaveText(AUCUNE);
  await taper(page, 'te'); // Terrebasse
  await attendreSuggestions(page, ['Terrebasse (23)']);
  await expect(zone).toHaveText('1 suggestion');
  await expect(champ(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(champ(page)).toHaveAttribute('aria-activedescendant', (await suggestions(page).first().getAttribute('id'))!);

  await champ(page).press('Escape');
  await expect(suggestions(page)).toHaveCount(0);
  await expect(champ(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(champ(page)).toHaveValue('te');
  await champ(page).press('Escape');
  await expect(champ(page)).toHaveValue('');
  await expect(champ(page)).toBeFocused();

  await page.getByRole('button', { name: 'Annuler' }).click();
  await expect(champ(page)).toHaveCount(0);
  await expect(loupe(page)).toBeFocused();
});

test('H184 : rouvert par la loupe, le champ montre la commune choisie et « Effacer la recherche », qui ne ferme pas la fiche', async ({ page }) => {
  await ouvrirSix(page);
  await loupe(page).click();
  await taper(page, 'quai');
  await suggestions(page).first().click();
  await expect(fiche(page)).toContainText('Quaibleu (13)');
  if (mobile(page)) {
    // La recherche s'est fermée ; la loupe est dans la tête de la feuille, au-dessus de la fiche.
    await expect(champ(page)).toHaveCount(0);
    await loupe(page).click();
  }
  await expect(champ(page)).toHaveValue('Quaibleu (13)');
  await expect(page.getByRole('button', { name: 'Effacer la recherche' })).toBeVisible();
  await expect(suggestions(page)).toHaveCount(0);

  // « Effacer la recherche » ne ferme pas la fiche.
  await page.getByRole('button', { name: 'Effacer la recherche' }).click();
  await expect(champ(page)).toHaveValue('');
  await expect(champ(page)).toBeFocused();
  // Au téléphone, la recherche couvre la fiche : « Annuler » la ramène.
  if (mobile(page)) await page.getByRole('button', { name: 'Annuler' }).click();
  await expect(fiche(page)).toContainText('Quaibleu (13)');
});

test('H184 en bureau : le champ qui montre la commune choisie se vide quand une autre est choisie dans la liste', async ({ page }) => {
  test.skip(mobile(page), 'panneaux de bureau côte à côte');
  await ouvrirSix(page);
  await loupe(page).click();
  await taper(page, 'quai');
  await suggestions(page).first().click();
  await expect(champ(page)).toHaveValue('Quaibleu (13)');
  await page.getByRole('button', { name: '← Les 10 premières' }).click();
  await expect(champ(page)).toHaveValue('Quaibleu (13)'); // fermer la fiche ne vide pas le champ
  await page.getByRole('region', { name: 'Les 10 premières' }).getByRole('button', { name: /Grandeville \(33\)/ }).click();
  await expect(fiche(page)).toContainText('Grandeville (33)');
  await expect(champ(page)).toHaveValue('');
});

test('H188 : la loupe est inactive pendant le chargement de la page', async ({ page }) => {
  await servirFixture(page, { jeu: SIX });
  let lacher: () => void = () => {};
  const retenu = new Promise<void>((r) => (lacher = r));
  // Posée après celles de la fixture, cette route passe d'abord (Playwright) : elle retient communes.json, puis lui passe la main.
  await page.route('**/data/communes.json', async (r) => {
    await retenu;
    await r.fallback();
  });
  await page.goto('/');
  await expect(loupe(page)).toBeDisabled();
  lacher();
  await expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
  await expect(loupe(page)).toBeEnabled();
});

test.describe('fenêtre de Safari sur iPhone (390 × 664, toucher)', () => {
  test.use({ viewport: { width: 390, height: 664 }, hasTouch: true });
  // Clavier de l'iPhone : il couvre tout sous y ≈ 342 dans cette fenêtre (tests/e2e/proches-clavier-iphone.spec.ts).
  const CLAVIER_IPHONE = 342;

  test('H177 et R20 : la loupe des onglets fait monter la feuille ; au focus, le champ est déjà sous la poignée, au-dessus du clavier, et ne bouge plus', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'fenêtre de téléphone fixée par le test');
    await ouvrirSix(page);
    await page.evaluate(() => {
      addEventListener('focusin', (e) => {
        const el = e.target as HTMLElement;
        if (el.getAttribute('role') !== 'combobox' || el.getAttribute('aria-label') !== 'Chercher une commune') return;
        const r = el.getBoundingClientRect();
        (window as unknown as { __auFocus: number[] }).__auFocus = [r.top, r.bottom];
      });
    });
    await loupe(page).tap();
    await expect(champ(page)).toBeFocused();
    const [haut, bas] = await page.evaluate(() => (window as unknown as { __auFocus: number[] }).__auFocus);
    const feuille = (await page.getByTestId('feuille').boundingBox())!;
    expect(feuille.y).toBe(size['taille-bande-carte']);
    expect(haut).toBeGreaterThanOrEqual(feuille.y + space['space-2'] + size['taille-rail']);
    expect(bas).toBeLessThanOrEqual(CLAVIER_IPHONE);
    await apresRendu(page);
    const apres = (await champ(page).boundingBox())!;
    expect(apres.y).toBeCloseTo(haut, 0);
    // Onglets et réglages cachés : la recherche remplace tout sous la poignée.
    await expect(page.getByRole('tablist')).toBeHidden();
    await taper(page, 'rh');
    await attendreSuggestions(page, ['Rhinval (67)']);
    expect((await suggestions(page).first().boundingBox())!.y).toBeLessThan(CLAVIER_IPHONE);

    await page.getByRole('button', { name: 'Annuler' }).tap();
    await expect(page.getByRole('tablist')).toBeVisible();
    await expect(loupe(page)).toBeFocused();
  });
});
