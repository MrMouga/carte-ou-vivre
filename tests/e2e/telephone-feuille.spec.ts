import { expect, test, type Locator, type Page } from '@playwright/test';
import { apresRendu, ouvrir, servirFixture, vue } from './lib/carte';
import { amenerEnBas, mobile, onglet } from './lib/feuille';
import { servirIgn } from './lib/ign';
import { ADRESSES, ajouter, champ, lignes, liste, pret, PRET_MS, SANS_PROCHE, zone } from './lib/proches';
import { BORNES } from '../../src/domain/url';
import { hauteurFeuille, paddingCarte } from '../../src/map/view';
import { geste, size, space } from '../../src/theme/tokens';

// Tâche 2 d'interface-telephone (R18, D3, D5, D9, H42 à H44, H47) : sous 1 024 px, une feuille à deux onglets, « Critères »
// au départ et « Les 10 premières », avec le compte en tête ; le bureau ne change pas. Au toucher (H41).
test.use({ hasTouch: true });

const feuille = (page: Page) => page.getByTestId('feuille');
const compte = (page: Page) => page.getByTestId('compte-feuille');
const panneau = (page: Page, nom: 'Critères' | 'Les 10 premières') => page.getByRole('tabpanel', { name: nom });
const boite = async (l: Locator) => (await l.boundingBox())!;

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
  await ouvrir(page, '/?loyer=1200&mer=50');
  await expect(page.getByRole('tablist')).toHaveCount(0);
  await expect(page.getByRole('tab')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Replier la feuille' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Déplier la feuille' })).toHaveCount(0);
  await expect(compte(page)).toHaveCount(0);

  const loyer = page.getByText('Loyer mensuel', { exact: true });
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
  await ouvrir(page, '/?loyer=1200&mer=50');
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
  await ouvrir(page, '/?loyer=1200&mer=50'); // cadre-de-vie, règle (1) du recalage : réglage explicite
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

// Hors AC (contrat « Onglets de feuille », H48 ; corrections, relecture navigateur) : chaque onglet se touche sur toute la
// hauteur du rail, 44 px ; la pilule colorée reste à `space-1` du bord du rail.
test('onglets : 44 px de haut au toucher, pilule de l’onglet choisi à `space-1` du bord du rail', async ({ page }) => {
  test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
  await ouvrir(page);
  const rail = await boite(page.getByRole('tablist'));
  expect(rail.height).toBe(size['taille-toucher']);
  for (const nom of ['Critères', 'Les 10 premières'] as const) {
    const o = await boite(onglet(page, nom));
    expect(o.height, nom).toBe(size['taille-toucher']);
    expect(o.y, nom).toBe(rail.y);
  }
  const pilule = await boite(onglet(page, 'Critères').locator('span'));
  expect(pilule.y - rail.y).toBe(space['space-1']);
  expect(rail.y + rail.height - (pilule.y + pilule.height)).toBe(space['space-1']);
  expect(pilule.x - rail.x).toBe(space['space-1']);
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
  await ouvrir(page, '/?loyer=1200&mer=50'); // cadre-de-vie, règle (1) du recalage : réglage explicite
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

// ---------------------------------------------------------------------------------------------------------------------
// Tâche 3 d'interface-telephone (R17, R19, D3, D4, D6, D8, H45 à H48, H50) : la tête de la feuille replie et déplie, au
// toucher, au glisser et au clavier ; la fiche prend la place des onglets et ouvre la feuille repliée.

const replier = (page: Page) => page.getByRole('button', { name: 'Replier la feuille' });
const deplier = (page: Page) => page.getByRole('button', { name: 'Déplier la feuille' });
const fiche = (page: Page) => page.getByRole('region', { name: /\(\d+\)$/ });
const loyer = (page: Page) => page.getByText('Loyer mensuel', { exact: true });
const H = (page: Page) => page.viewportSize()!.height;

/** Attend que la feuille soit posée (plus aucune transition en cours, dans la feuille ni dans son contenu). */
async function posee(page: Page) {
  await page.waitForFunction(() => document.querySelector('[data-testid="feuille"]')!.getAnimations({ subtree: true }).length === 0);
}
/** Hauteur de feuille visible à l'écran, du haut de la feuille au bas de la fenêtre. */
const visible = async (page: Page) => H(page) - (await boite(feuille(page))).y;
/** Haut de la feuille ouverte (sur ses onglets) : 45 % de la hauteur, au moins 272 px (D9). */
const hautOuverte = (page: Page) => H(page) - hauteurFeuille(H(page));

/** Repliée : barre de 64 px au plus (H48), « Déplier la feuille » à l'état replié, le compte `texte` dans la barre. */
async function attendreRepliee(page: Page, texte?: string) {
  await expect(deplier(page)).toHaveAttribute('aria-expanded', 'false');
  await posee(page);
  expect(await visible(page)).toBeLessThanOrEqual(64);
  if (texte) await expect(deplier(page).getByTestId('compte-feuille')).toHaveText(texte);
  await expect(deplier(page).getByTestId('compte-feuille')).toBeInViewport({ ratio: 1 });
}
/** Ouverte sur ses onglets : « Replier la feuille » à l'état déplié, la feuille à sa hauteur, l'onglet `nom` affiché. */
async function attendreOuverte(page: Page, nom: 'Critères' | 'Les 10 premières') {
  await expect(replier(page)).toHaveAttribute('aria-expanded', 'true');
  await posee(page);
  expect((await boite(feuille(page))).y).toBeCloseTo(hautOuverte(page), 0);
  await expect(onglet(page, nom)).toHaveAttribute('aria-selected', 'true');
  await expect(panneau(page, nom)).toBeVisible();
}

/**
 * Glisser au doigt par le protocole du navigateur (H41 : des PointerEvent fabriqués ne font jamais défiler une liste) :
 * `touchStart` en (x, y), dix `touchMove` répartis sur `ms`, puis `touchEnd`.
 */
async function glisser(page: Page, x: number, y: number, dy: number, ms = 300) {
  const cdp = await page.context().newCDPSession(page);
  const pas = 10;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= pas; i++) {
    await page.waitForTimeout(ms / pas);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + (dy * i) / pas }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}
/** Point de la poignée (barre grise de 40 × 4 en haut de la tête). */
async function poignee(tete: Locator) {
  const b = await boite(tete.locator('span').first());
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

test('AC-2 à 390 × 844 : « Replier la feuille » puis « Déplier la feuille » ; barre de 64 px au plus avec le compte, le rond « 1 » ne bouge pas, puis « Critères » et « Loyer maximum »', async ({ page }) => {
  test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
  await ouvrir(page, '/?loyer=1200&mer=50');
  await attendreOuverte(page, 'Critères');
  const rond = page.getByRole('button', { name: '1re : Portmer (17)' });
  const avant = await boite(rond);

  await replier(page).tap();
  await attendreRepliee(page, '3 communes passent tes critères');
  await expect(loyer(page)).toBeHidden();
  expect(await boite(rond)).toEqual(avant); // D8 : la carte ne bouge pas

  await deplier(page).tap();
  await attendreOuverte(page, 'Critères');
  await expect(loyer(page)).toBeInViewport({ ratio: 1 });
  expect(await boite(rond)).toEqual(avant);
});

test('AC-3 depuis /?loyer=1200&mer=50 à 390 × 844, au doigt (300 ms par geste) : poignée 30 px puis 200 px vers le bas, barre 200 px vers le haut, glisser dans « Taille de la commune », puis toucher le texte de la barre', async ({ page }) => {
  test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
  await ouvrir(page, '/?loyer=1200&mer=50');
  await attendreOuverte(page, 'Critères');

  // 30 px vers le bas : sous le seuil de 80 px, la feuille revient ouverte.
  let p = await poignee(replier(page));
  await glisser(page, p.x, p.y, 30);
  await attendreOuverte(page, 'Critères');

  // 200 px vers le bas : repliée.
  p = await poignee(replier(page));
  await glisser(page, p.x, p.y, 200);
  await attendreRepliee(page, '3 communes passent tes critères');

  // La barre, 200 px vers le haut : ouverte sur « Critères ».
  p = await poignee(deplier(page));
  await glisser(page, p.x, p.y, -200);
  await attendreOuverte(page, 'Critères');

  // Dans le réglage « Taille de la commune », 200 px vers le haut : les réglages défilent, la feuille reste ouverte. À
  // 390 × 844, le réglage est sous le bas de l'écran à l'ouverture : on l'amène d'abord à l'écran, comme l'utilisateur
  // qui a fait défiler les réglages pour le toucher.
  const taille = page.getByRole('group', { name: 'Taille de la commune' });
  await taille.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const t = await boite(taille);
  expect(t.y + t.height).toBeLessThanOrEqual(H(page));
  const defile = () => panneau(page, 'Critères').evaluate((el) => el.scrollTop);
  const avant = await defile();
  await glisser(page, t.x + t.width / 2, t.y + t.height / 2, -200);
  await expect.poll(async () => (await defile()) - avant).toBeGreaterThan(100);
  await attendreOuverte(page, 'Critères');

  // Repliée par le bouton, puis un toucher sur le texte de la barre : ouverte sur « Critères ».
  await replier(page).tap();
  await attendreRepliee(page);
  await deplier(page).getByTestId('compte-feuille').tap();
  await attendreOuverte(page, 'Critères');
});

test('AC-4 à 390 × 844 : repliée, la barre dit le compte de loyer-mer, « Aucun plafond fixé » sans plafond', async ({ page }) => {
  test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
  const cas: [string, string][] = [
    ['/?loyer=1200&mer=50', '3 communes passent tes critères'],
    ['/?loyer=1000&mer=50', '2 communes passent tes critères'],
    ['/?loyer=650&mer=50', '1 commune passe tes critères'],
    ['/?loyer=300&mer=50', 'Aucune commune ne passe tes critères'],
    ['/?loyer=aucun&mer=aucun', 'Aucun plafond fixé'],
  ];
  for (const [chemin, texte] of cas) {
    await ouvrir(page, chemin);
    await replier(page).tap();
    await attendreRepliee(page, texte);
  }
});

test('AC-5 à 390 × 844 : « Les 10 premières », repliée puis dépliée, c’est toujours la liste', async ({ page }) => {
  test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
  await ouvrir(page, '/?loyer=1200&mer=50');
  await onglet(page, 'Les 10 premières').tap();
  const voir = async () => {
    await attendreOuverte(page, 'Les 10 premières');
    await expect(liste(page)).toContainText('3 communes passent tes critères');
    expect(await lignes(page)).toEqual(SANS_PROCHE);
    await expect(loyer(page)).toBeHidden();
  };
  await voir();
  await replier(page).tap();
  await attendreRepliee(page, '3 communes passent tes critères');
  await deplier(page).tap();
  await voir();
});

test('AC-6 à 390 × 844, feuille repliée : le rond « 1 » ouvre la feuille sur la fiche de Portmer (17), cadrée au-dessus de la feuille ouverte ; repliée puis dépliée, la fiche revient', async ({ page }) => {
  test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
  await ouvrir(page, '/?loyer=1200&mer=50');
  await replier(page).tap();
  await attendreRepliee(page);

  await page.getByRole('button', { name: '1re : Portmer (17)' }).tap();
  const voirFiche = async () => {
    await expect(replier(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(fiche(page)).toBeVisible();
    await expect(fiche(page)).toHaveAccessibleName('Portmer (17)');
    await expect(fiche(page).getByText('72', { exact: true })).toBeVisible();
    await expect(fiche(page)).toContainText('1re sur 3 communes qui passent');
    await expect(page.getByRole('tablist')).toHaveCount(0);
    await expect(page.getByRole('tab')).toHaveCount(0);
    await expect(replier(page).getByTestId('compte-feuille')).toHaveCount(0); // tête : la poignée seule
  };
  await voirFiche();
  // Cadrage (R19) : la commune au milieu de la bande au-dessus de la feuille OUVERTE, calculée par les jetons, et non
  // au-dessus de la barre d'où la feuille est partie.
  const p = paddingCarte(390, H(page));
  const milieu = { x: p.left + (390 - p.left - p.right) / 2, y: p.top + (H(page) - p.top - p.bottom) / 2 };
  const rond = page.getByRole('button', { name: '1re : Portmer (17)' });
  await expect
    .poll(async () => {
      const b = await boite(rond);
      return Math.round(Math.hypot(b.x + b.width / 2 - milieu.x, b.y + b.height / 2 - milieu.y));
    })
    .toBeLessThanOrEqual(2);

  await replier(page).tap();
  await attendreRepliee(page, '3 communes passent tes critères');
  await expect(fiche(page)).toBeHidden();
  await deplier(page).tap();
  await posee(page);
  await voirFiche();
});

test('AC-7 à 390 × 844, sur « Critères » : le carré de Grandeville (33) ouvre sa fiche à la place des onglets ; « ← Les 10 premières » mène à la liste, focus sur sa ligne', async ({ page }) => {
  test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
  await ouvrir(page, '/?loyer=1200&mer=50');
  await attendreOuverte(page, 'Critères');
  const { lecture } = vue(page); // dans le carré, loin de son rond
  await page.touchscreen.tap(lecture('B').x, lecture('B').y);
  await expect(fiche(page)).toHaveAccessibleName('Grandeville (33)');
  await expect(fiche(page)).toContainText('3e sur 3 communes qui passent');
  await expect(page.getByRole('tablist')).toHaveCount(0);

  await fiche(page).getByRole('button', { name: '← Les 10 premières' }).tap();
  await expect(onglet(page, 'Les 10 premières')).toHaveAttribute('aria-selected', 'true');
  await expect(onglet(page, 'Critères')).toHaveAttribute('aria-selected', 'false');
  const ligne3 = liste(page).getByRole('button', { name: /^3 · Grandeville \(33\) · 25 · 832\s€ · 40\skm$/ });
  await expect(ligne3).toBeFocused();
});

test('AC-11 à 390 × 844 : repliée pendant le calcul de Nantesville (44), la barre passe de 3 à 1 commune sans être dépliée', async ({ page }) => {
  test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
  await ouvrir(page, '/?loyer=1200&mer=50');
  await servirIgn(page);
  await champ(page).tap();
  await champ(page).fill('1 rue Test');
  await zone(page).getByRole('button', { name: '1 rue Test, 44000 Nantesville' }).tap();
  await expect(zone(page).getByRole('textbox', { name: 'Nom' })).toHaveValue('Nantesville (44)'); // nom proposé
  await zone(page).getByRole('button', { name: 'Ajouter', exact: true }).tap();
  await expect(zone(page)).toContainText('Calcul des trajets depuis Nantesville (44)…');

  await replier(page).tap();
  await attendreRepliee(page, '3 communes passent tes critères');
  // Repliée avant la fin du calcul (la zone est cachée, d'où `includeHidden`).
  await expect(page.getByRole('region', { name: 'Tes proches', includeHidden: true })).toContainText('Calcul des trajets depuis Nantesville (44)…');
  await expect(deplier(page).getByTestId('compte-feuille')).toHaveText('1 commune passe tes critères', { timeout: PRET_MS });
  await expect(deplier(page)).toHaveAttribute('aria-expanded', 'false');
  expect(await visible(page)).toBeLessThanOrEqual(64);
});

// Hors AC (leçon « feuille glissable ») : le clic qui suit le toucher qui déplie ne tombe pas sur la ligne apparue sous le
// doigt. Sans animation, pour que la ligne soit là dès le dépli (le cas le plus défavorable).
test.describe('animations réduites', () => {
  test.use({ reducedMotion: 'reduce' });

  test('déplier d’un toucher sur la barre n’ouvre aucune fiche (clic fantôme)', async ({ page }) => {
    test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
    // 390 × 664 (fenêtre de Safari sur iPhone) : la liste y est assez longue pour amener une ligne sous la barre.
    await page.setViewportSize({ width: 390, height: 664 });
    await ouvrir(page, '/?loyer=1200&mer=50'); // cadre-de-vie, règle (1) du recalage : lit le rang de Grandeville
    await onglet(page, 'Les 10 premières').tap();
    // La ligne de Grandeville amenée au bas de l'écran, là où sera la barre repliée.
    const ligne3 = liste(page).getByRole('button', { name: /^3 · Grandeville/ });
    await ligne3.evaluate((el) => el.scrollIntoView({ block: 'end' }));
    const l = await boite(ligne3);
    await replier(page).tap();
    await attendreRepliee(page);
    const barre = H(page) - (await visible(page));
    const y = l.y + l.height / 2;
    expect(y).toBeGreaterThan(barre); // le toucher tombe sur la barre, et sur la ligne une fois dépliée

    await page.touchscreen.tap(l.x + l.width / 2, y);
    await attendreOuverte(page, 'Les 10 premières');
    await page.waitForTimeout(geste['avaler-clic-ms']);
    await expect(fiche(page)).toHaveCount(0);
    expect(await boite(ligne3)).toEqual(l); // la ligne était bien sous le doigt
  });

  test('H45 sans animation si l’on réduit les animations : durée de transition 0 s', async ({ page }) => {
    test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
    await ouvrir(page);
    expect(await feuille(page).evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
  });
});

// Hors AC (H45) : le passage d'une position à l'autre dure 300 ms au plus.
test('H45 transition de la feuille : 300 ms au plus', async ({ page }) => {
  test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
  await ouvrir(page);
  const duree = await feuille(page).evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(parseFloat(duree)).toBeGreaterThan(0);
  expect(parseFloat(duree)).toBeLessThanOrEqual(0.3);
});

// Hors AC (H47) : au clavier, la tête est un vrai bouton ; au repli, le focus va à « Déplier la feuille », même s'il était
// dans le contenu qui disparaît.
test('focus : repli au clavier, puis repli au doigt avec le focus dans les réglages, le focus va à « Déplier la feuille »', async ({ page }) => {
  test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
  await ouvrir(page, '/?loyer=1200&mer=60');
  await replier(page).focus();
  await page.keyboard.press('Enter');
  await attendreRepliee(page);
  await expect(deplier(page)).toBeFocused();
  await page.keyboard.press('Enter');
  await attendreOuverte(page, 'Critères');
  await expect(replier(page)).toBeFocused();

  await page.getByRole('slider', { name: 'Loyer maximum' }).focus();
  const p = await poignee(replier(page));
  await glisser(page, p.x, p.y, 200);
  await attendreRepliee(page);
  await expect(deplier(page)).toBeFocused();
});

// Hors AC (details.md, états chargement et ajout) : ni repli ni glisser tant que la page n'est pas prête, ni pendant l'ajout.
test('pendant le chargement, la tête est inactive ; pendant l’ajout d’un proche, il n’y a pas de tête à replier', async ({ page }) => {
  test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
  await servirFixture(page);
  let lacher!: () => void;
  const donnees = new Promise<void>((r) => (lacher = r));
  await page.route('**/data/communes.json', async (r) => {
    await donnees;
    await r.fallback();
  });
  await page.goto('/');
  await expect(replier(page)).toBeDisabled();
  lacher();
  await expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
  await expect(replier(page)).toBeEnabled();

  await champ(page).tap();
  await expect(champ(page)).toBeFocused();
  await expect(replier(page)).toHaveCount(0);
  await expect(deplier(page)).toHaveCount(0);
});

// Hors AC (H50) : les messages posés sur la carte se placent juste au-dessus de la feuille, ouverte ou repliée ; feuille
// repliée, le message « Aucune commune » de la bande est caché (la barre le dit).
test('H50 « Fond de carte indisponible » juste au-dessus de la barre ; « Aucune commune » de la bande caché feuille repliée', async ({ page }) => {
  test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
  await servirFixture(page, { fondEnPanne: true });
  await page.goto('/?loyer=1200&mer=60');
  await expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
  const message = page.getByText('Fond de carte indisponible');
  await expect(message).toBeVisible();
  let m = await boite(message);
  expect(m.y + m.height).toBeCloseTo(hautOuverte(page), 0);
  await replier(page).tap();
  await attendreRepliee(page);
  m = await boite(message);
  expect(m.y + m.height).toBeCloseTo(H(page) - (await visible(page)), 0);

  await ouvrir(page, '/?loyer=300&mer=60');
  await expect(page.getByTestId('carte-vide')).toBeVisible();
  await replier(page).tap();
  await attendreRepliee(page, 'Aucune commune ne passe tes critères');
  await expect(page.getByTestId('carte-vide')).toHaveCount(0);
});

// Hors AC (tâche 4, R20) : le toucher du champ d'adresse est repris au relâchement du doigt (feuille montée et placée avant
// le focus) ; un doigt qui glisse sur le champ fait défiler « Critères », sans focus ni montée de la feuille.
test('glisser commencé sur « Adresse ou ville » : « Critères » défile, le champ ne prend pas le focus, la feuille ne monte pas', async ({ page }) => {
  test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
  await page.setViewportSize({ width: 390, height: 664 });
  await ouvrir(page);
  await servirIgn(page);
  await amenerEnBas(champ(page));
  const haut = (await boite(feuille(page))).y;
  const defilement = await panneau(page, 'Critères').evaluate((el) => el.scrollTop);
  const c = await boite(champ(page));
  await glisser(page, c.x + c.width / 2, c.y + c.height / 2, -60);
  await apresRendu(page);
  await expect(champ(page)).not.toBeFocused();
  expect((await boite(feuille(page))).y).toBe(haut);
  await expect(page.getByRole('tablist')).toBeVisible();
  expect(await panneau(page, 'Critères').evaluate((el) => el.scrollTop)).toBeGreaterThan(defilement);
});

// Hors AC (corrections, relecture spec : Majeur). Après « Ajouter », la feuille redescend sur « Critères » : le titre
// « Tes proches » et « Effacer mes proches » se posent sous la liste d'onglets, entièrement visibles (le premier écran vu
// après l'ajout, parcours 5 de details.md). Avant : l'onglet défilait comme si son haut était celui de la feuille, et le
// titre passait à moitié sous les onglets (captures/T4-e2e-4-ajoute-calcul-390x664.png).
for (const hauteur of [664, 844]) {
  for (const n of [0, 1]) {
    test(`après « Ajouter » à 390 × ${hauteur}, ${n} proche déjà là : « Tes proches » et « Effacer mes proches » entiers sous les onglets`, async ({ page }) => {
      test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
      await page.setViewportSize({ width: 390, height: hauteur });
      await ouvrir(page);
      await servirIgn(page);
      if (n) {
        // Le premier proche est prêt, avec son curseur de plafond : sa ligne est à sa plus grande hauteur (le cas courant).
        await ajouter(page, 'Nantesville');
        await pret(page, 'Nantesville (44)');
      }
      // Le dernier ajout au doigt, comme sur le téléphone.
      if (n) await zone(page).getByRole('button', { name: '+ Ajouter un proche' }).tap();
      else await champ(page).tap();
      await expect(champ(page)).toBeFocused();
      await champ(page).fill(ADRESSES.Lilleville[0]);
      await zone(page).getByRole('button', { name: ADRESSES.Lilleville[1] }).tap();
      await zone(page).getByRole('button', { name: 'Ajouter', exact: true }).tap();
      await expect(zone(page).getByRole('listitem').filter({ hasText: 'Lilleville (59)' })).toBeVisible();
      await expect(page.getByRole('tablist')).toBeVisible();
      await apresRendu(page);

      const onglets = await boite(page.getByRole('tablist'));
      const p = await boite(panneau(page, 'Critères'));
      for (const nom of ['Tes proches', 'Effacer mes proches']) {
        const b = await boite(zone(page).getByRole('button', { name: nom }));
        expect(b.y, `haut de « ${nom} » sous le bas des onglets`).toBeGreaterThanOrEqual(onglets.y + onglets.height);
        expect(b.y + b.height, `bas de « ${nom} » dans l'onglet`).toBeLessThanOrEqual(p.y + p.height);
      }
    });
  }
}
