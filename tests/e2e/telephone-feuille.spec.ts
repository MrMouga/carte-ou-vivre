import { expect, test, type Page } from '@playwright/test';
import { apresRendu, ouvrir } from './lib/carte';
import { mobile, onglet } from './lib/feuille';
import { servirIgn } from './lib/ign';
import { champ, zone } from './lib/proches';
import { BORNES } from '../../src/domain/url';
import { hauteurFeuille } from '../../src/map/view';
import { size, space } from '../../src/theme/tokens';

// Tâche 2 d'interface-telephone (R18, D3, D5, D9, H42 à H44, H47) : sous 1 024 px, une feuille à deux onglets, « Critères »
// au départ et « Les 10 premières », avec le compte en tête ; le bureau ne change pas. Au toucher (H41).
test.use({ hasTouch: true });

const feuille = (page: Page) => page.getByTestId('feuille');
const compte = (page: Page) => page.getByTestId('compte-feuille');
const panneau = (page: Page, nom: 'Critères' | 'Les 10 premières') => page.getByRole('tabpanel', { name: nom });
const boite = async (l: ReturnType<Page['locator']>) => (await l.boundingBox())!;

/** Touche le rail de « Loyer maximum » là où tombe `euros` (Radix : valeur proportionnelle à la largeur du curseur). */
async function toucherLoyer(page: Page, euros: number) {
  const curseur = page.getByRole('slider', { name: 'Loyer maximum' });
  const rail = await boite(curseur.locator('xpath=../..')); // la poignée est dans une boîte de placement, dans le curseur
  const { min, max, pas } = BORNES.loyer;
  const part = (euros - min) / (max + pas - min); // le cran après le maximum = « Sans limite »
  await page.touchscreen.tap(rail.x + rail.width * part, rail.y + rail.height / 2);
  await apresRendu(page);
}

test('AC-9 à 1 440 × 900 : ni onglets, ni « Replier la feuille », ni barre repliée ; « Loyer maximum » à gauche et la liste à droite, visibles ensemble', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'la fenêtre est fixée par le test : le jouer aussi dans le projet mobile le répéterait');
  await page.setViewportSize({ width: 1440, height: 900 });
  await ouvrir(page, '/?loyer=1200&mer=60');
  await expect(page.getByRole('tablist')).toHaveCount(0);
  await expect(page.getByRole('tab')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Replier la feuille' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Déplier la feuille' })).toHaveCount(0);
  await expect(compte(page)).toHaveCount(0);

  const loyer = page.getByText('Loyer maximum', { exact: true });
  const liste = page.getByRole('region', { name: 'Les 10 premières' });
  await expect(loyer).toBeInViewport({ ratio: 1 });
  await expect(liste).toBeInViewport({ ratio: 1 });
  await expect(liste).toContainText('3 communes passent tes critères');
  // Comme avant cette tranche : réglages à gauche et liste à droite, posés sur la carte à `space-4` des bords.
  const reglages = await boite(page.getByRole('region', { name: 'Réglages' }));
  const l = await boite(liste);
  expect(reglages.x).toBe(space['space-4']);
  expect(reglages.width).toBe(size['taille-reglages']);
  expect(l.x).toBe(1440 - space['space-4'] - size['taille-liste']);
  expect(l.y).toBe(space['space-4']);
  expect((await boite(loyer)).x + (await boite(loyer)).width).toBeLessThan(l.x);
});

test('AC-10 à 390 × 844, sur « Critères » : loyer réglé sur 1 000 €, le compte en haut de la feuille passe de 3 à 2 communes, sans changer d’onglet', async ({ page }) => {
  test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
  await ouvrir(page, '/?loyer=1200&mer=60');
  await expect(onglet(page, 'Critères')).toHaveAttribute('aria-selected', 'true');
  await expect(compte(page)).toHaveText('3 communes passent tes critères');
  await expect(compte(page)).toBeInViewport({ ratio: 1 });

  await toucherLoyer(page, 1000);
  await expect(page.getByRole('slider', { name: 'Loyer maximum' })).toHaveAttribute('aria-valuenow', '1000');
  await expect(compte(page)).toHaveText('2 communes passent tes critères');
  await expect(compte(page)).toBeInViewport({ ratio: 1 });
  await expect(onglet(page, 'Critères')).toHaveAttribute('aria-selected', 'true');
  // En haut de la feuille : sous son bord, au-dessus des onglets.
  const [f, c, o] = [await boite(feuille(page)), await boite(compte(page)), await boite(page.getByRole('tablist'))];
  expect(c.y).toBeGreaterThanOrEqual(f.y);
  expect(c.y + c.height).toBeLessThanOrEqual(o.y);
});

// Hors AC (R18, H47) : motif « onglets » au clavier, flèches gauche et droite.
test('onglets : flèches droite et gauche déplacent le focus et la sélection ; un seul panneau affiché', async ({ page }) => {
  test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
  await ouvrir(page);
  const [criteres, liste] = [onglet(page, 'Critères'), onglet(page, 'Les 10 premières')];
  await expect(page.getByRole('tablist')).toHaveCount(1);
  await expect(criteres).toHaveAttribute('tabindex', '0');
  await expect(liste).toHaveAttribute('tabindex', '-1');
  await expect(panneau(page, 'Critères')).toBeVisible();
  await expect(panneau(page, 'Les 10 premières')).toBeHidden();

  await criteres.focus();
  await page.keyboard.press('ArrowRight');
  await expect(liste).toBeFocused();
  await expect(liste).toHaveAttribute('aria-selected', 'true');
  await expect(criteres).toHaveAttribute('aria-selected', 'false');
  await expect(panneau(page, 'Les 10 premières')).toBeVisible();
  await expect(panneau(page, 'Critères')).toBeHidden();
  await expect(page.getByRole('region', { name: 'Les 10 premières' })).toContainText('3 communes passent tes critères');

  await page.keyboard.press('ArrowLeft');
  await expect(criteres).toBeFocused();
  await expect(criteres).toHaveAttribute('aria-selected', 'true');
  await expect(panneau(page, 'Critères')).toBeVisible();
  await expect(panneau(page, 'Les 10 premières')).toBeHidden();
});

// Hors AC (R18) : chaque onglet garde sa position de défilement.
test('défilement gardé : « Critères » défilé jusqu’à « Tes proches », passage à la liste, retour : même position', async ({ page }) => {
  test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
  await ouvrir(page);
  const titre = zone(page).getByRole('button', { name: /^Tes proches/ });
  await titre.scrollIntoViewIfNeeded();
  await expect(titre).toBeInViewport({ ratio: 1 });
  const avant = await panneau(page, 'Critères').evaluate((el) => el.scrollTop);
  expect(avant).toBeGreaterThan(0);

  await onglet(page, 'Les 10 premières').tap();
  await expect(panneau(page, 'Les 10 premières')).toBeVisible();
  await onglet(page, 'Critères').tap();
  await expect(panneau(page, 'Critères')).toBeVisible();
  expect(await panneau(page, 'Critères').evaluate((el) => el.scrollTop)).toBe(avant);
  await expect(titre).toBeInViewport({ ratio: 1 });
});

// Hors AC (H42, H43, H44, « Annonce aux lecteurs d'écran » du plan) : une seule zone annoncée ; la ligne visible ne l'est pas.
test('compte en tête : une ligne en style `valeur`, cachée aux lecteurs d’écran, « Aucun plafond fixé » sans plafond ; une seule zone annoncée ; mentions au bas des deux onglets', async ({ page }) => {
  test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
  await ouvrir(page);
  await expect(compte(page)).toHaveAttribute('aria-hidden', 'true');
  await expect(compte(page)).toHaveCSS('font-size', '18px');
  await expect(compte(page)).toHaveCSS('font-weight', '700');
  const c = await boite(compte(page));
  expect(c.height).toBeLessThan(2 * 18 * 1.25); // une seule ligne
  await expect(page.getByRole('status')).toHaveCount(1);
  await expect(page.getByRole('status')).toHaveText('3 communes passent tes critères');

  for (const nom of ['Critères', 'Les 10 premières'] as const) {
    await onglet(page, nom).tap();
    const mentions = panneau(page, nom).getByRole('contentinfo');
    await mentions.scrollIntoViewIfNeeded();
    await expect(mentions).toBeInViewport();
    await expect(page.getByRole('contentinfo')).toHaveCount(1); // celle de l'onglet caché ne compte pas
  }

  await ouvrir(page, '/?loyer=aucun&mer=aucun');
  await expect(compte(page)).toHaveText('Aucun plafond fixé');
  await expect(page.getByRole('status')).toHaveText('');
});

// Hors AC (H48, D9) : à 375 × 548, la feuille garde au moins 272 px et le curseur du loyer est visible sans défiler.
test('375 × 548 : feuille de 272 px, curseur « Loyer maximum » entièrement visible à l’ouverture', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'fenêtre de téléphone fixée par le test');
  await page.setViewportSize({ width: 375, height: 548 });
  await ouvrir(page);
  const f = await boite(feuille(page));
  expect(hauteurFeuille(548)).toBe(size['taille-feuille-min']); // 45 % de 548 = 247 : le plancher joue
  expect(Math.round(f.height)).toBe(size['taille-feuille-min']);
  const curseur = await boite(page.getByRole('slider', { name: 'Loyer maximum' }));
  expect(curseur.y).toBeGreaterThanOrEqual(f.y);
  expect(curseur.y + curseur.height).toBeLessThanOrEqual(548);
});

// Hors AC (details.md, état « ajout ») : la feuille monte, seule la poignée reste au-dessus du champ, ni onglets ni compte.
test('ajout d’un proche : ni onglets ni compte au-dessus du champ ; ils reviennent quand le focus sort', async ({ page }) => {
  test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
  await page.setViewportSize({ width: 390, height: 664 });
  await ouvrir(page);
  await servirIgn(page);
  await champ(page).tap();
  await expect(champ(page)).toBeFocused();
  await expect.poll(async () => (await boite(feuille(page))).y).toBe(size['taille-bande-carte']);
  await expect(page.getByRole('tablist')).toBeHidden();
  await expect(compte(page)).toBeHidden();
  const c = await boite(champ(page));
  expect(c.y).toBeGreaterThan(size['taille-bande-carte']);

  await page.keyboard.press('Shift+Tab'); // hors de l'ajout
  await expect(champ(page)).not.toBeFocused();
  await expect(page.getByRole('tablist')).toBeVisible();
  await expect(compte(page)).toBeVisible();
});
