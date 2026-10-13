import { expect, test, type Page, type Route } from '@playwright/test';
import { apresRendu, ouvrir, vue } from './lib/carte';
import { servirIgn } from './lib/ign';
import { readPixels } from './lib/pixels';
import { ajouter, liste, pret, regler, zone } from './lib/proches';
import { color, map as carte } from '../../src/theme/tokens';

// Tâche 4 (proches) : repères sur la carte, pastilles de temps en haut de la carte (bureau), fiche (R10, R15, D4, D10).
// Faux service IGN de la fixture (tests/e2e/lib/ign.ts), posé après le fond de carte.

const nbsp = (t: string | null) => (t ?? '').replace(/ /g, ' ');
const fiche = (page: Page) => page.getByRole('region', { name: /\(\d+\)$/ });
const texteFiche = async (page: Page) => nbsp(await fiche(page).innerText());
const pastilles = (page: Page) => page.getByRole('list', { name: 'Temps vers tes proches' });
const pastille = (page: Page, nom: string) => pastilles(page).getByRole('listitem').filter({ hasText: nom });
const reperes = (page: Page) => page.getByTestId('carte').locator('[data-repere-proche]');
const repere = (page: Page, nom: string) => page.getByTestId('carte').locator(`[data-repere-proche][data-nom="${nom}"]`);
/** Étiquette du repère (un second marqueur au même point, au-dessus des gouttes). */
const etiquette = (page: Page, nom: string) => page.getByTestId('carte').locator(`[data-etiquette-proche][data-nom="${nom}"] [data-partie="etiquette"]`);

/** Choisit une commune sur la carte (au centre de son carré, vue d'ouverture). */
async function choisirSurLaCarte(page: Page, id: 'A' | 'B' | 'C' | 'D' | 'E') {
  const { centre } = vue(page);
  await page.mouse.click(centre(id).x, centre(id).y);
}

/** Retour à la liste ; la carte revient sur la France entière (zoom animé). */
async function retour(page: Page) {
  await fiche(page).getByRole('button', { name: '← Les 10 premières' }).click();
  await page.waitForTimeout(carte['duree-zoom-ms'] + 300);
  await apresRendu(page);
}

test('AC-3 Nantesville (44) prêt à 2 h, Grandeville (33) choisie sur la carte : « Nantesville (44) 2 h 15 : au-dessus de ton plafond de 2 h », 40 km, sans score ni rang', async ({ page }) => {
  await ouvrir(page);
  await servirIgn(page);
  await ajouter(page, 'Nantesville');
  await pret(page, 'Nantesville (44)');

  await choisirSurLaCarte(page, 'B');
  await expect(fiche(page)).toContainText('Grandeville (33)');
  await expect(fiche(page).getByRole('heading', { name: 'Ne passe pas tes critères' })).toBeVisible();
  const t = await texteFiche(page);
  expect(t).toContain('Nantesville (44) 2 h 15 : au-dessus de ton plafond de 2 h');
  expect(t).toContain("40 km de la mer à vol d'oiseau");
  expect(t).not.toMatch(/\/ 100|sur \d+ communes? qui pass/);
});

test('AC-5 Nantesville (44) à 2 h 15 et Toulouseville (31) à 2 h 45 : fiche de Grandeville (temps dans l’ordre, 30, 2e sur 2), puis Quaibleu (plus de 3 h, sans score)', async ({ page }) => {
  test.setTimeout(45_000);
  await ouvrir(page);
  await servirIgn(page);
  await ajouter(page, 'Nantesville');
  await pret(page, 'Nantesville (44)');
  await regler(page, 'Nantesville (44)', 'ArrowRight'); // 2 h 15
  await ajouter(page, 'Toulouseville');
  await pret(page, 'Toulouseville (31)');
  await regler(page, 'Toulouseville (31)', 'ArrowRight', 3); // 2 h 45

  await liste(page).getByRole('button', { name: /Grandeville \(33\)/ }).click();
  await expect(fiche(page)).toContainText('Grandeville (33)');
  let t = await texteFiche(page);
  const [a, b] = [t.indexOf('Nantesville (44) : 2 h 15 en voiture'), t.indexOf('Toulouseville (31) : 1 h 15 en voiture')];
  expect(a, t).toBeGreaterThan(-1);
  expect(b, t).toBeGreaterThan(a);
  await expect(fiche(page).getByText('30', { exact: true })).toBeVisible();
  expect(t).toContain('2e sur 2 communes qui passent');

  await retour(page);
  await choisirSurLaCarte(page, 'E');
  await expect(fiche(page)).toContainText('Quaibleu (13)');
  t = await texteFiche(page);
  expect(t).toContain('Nantesville (44) plus de 3 h : au-dessus de ton plafond de 2 h 15');
  expect(t).not.toMatch(/\/ 100|sur \d+ communes? qui pass/);
});

test('AC-14 « 1 rue Test 44000 Nantesville » nommé « Parents de Léa » : adresse dans la zone, repère au point [-2, 3], raison dans la fiche de Grandeville, nom jamais envoyé', async ({ page }) => {
  const envoyees: string[] = [];
  page.on('request', (r) => envoyees.push(`${r.url()} ${r.postData() ?? ''}`));
  await ouvrir(page);
  await servirIgn(page);
  await zone(page).getByRole('textbox', { name: 'Adresse ou ville' }).fill('1 rue Test');
  await zone(page).getByRole('button', { name: '1 rue Test, 44000 Nantesville' }).click();
  await zone(page).getByRole('textbox', { name: 'Nom' }).fill('Parents de Léa');
  await zone(page).getByRole('button', { name: 'Ajouter', exact: true }).click();
  await pret(page, 'Parents de Léa');

  await expect(zone(page).getByRole('listitem').filter({ hasText: 'Parents de Léa' })).toContainText('1 rue Test 44000 Nantesville');
  // Le point [-2, 3] est hors du cadre de la carte de test : on lit la position portée par le repère, pas un pixel.
  await expect(repere(page, 'Parents de Léa')).toHaveCount(1);
  await expect(etiquette(page, 'Parents de Léa')).toHaveText('Parents de Léa');
  expect(Number(await repere(page, 'Parents de Léa').getAttribute('data-lng'))).toBe(-2);
  expect(Number(await repere(page, 'Parents de Léa').getAttribute('data-lat'))).toBe(3);

  // Grandeville (2 h 15 pour un plafond de 2 h) ne passe pas : elle n'est pas dans la liste, on la choisit sur la carte.
  await choisirSurLaCarte(page, 'B');
  await expect(fiche(page)).toContainText('Grandeville (33)');
  expect(await texteFiche(page)).toContain('Parents de Léa 2 h 15 : au-dessus de ton plafond de 2 h');

  const avecNom = envoyees.filter((u) => {
    const d = decodeURIComponent(u.replace(/\+/g, ' '));
    return d.includes('Parents de Léa') || d.includes('Parents de L%C3%A9a') || u.includes('Parents');
  });
  expect(avecNom).toEqual([]);
});

test('AC-16 pastille de Nantesville (44) : « 2 h au plus », puis « 2 h 15 · au-dessus de 2 h » avec Grandeville choisie ; un clic ne change rien ; aucune à 390 px', async ({ page }, info) => {
  await ouvrir(page);
  await servirIgn(page);
  await ajouter(page, 'Nantesville');
  await pret(page, 'Nantesville (44)');

  if (info.project.name === 'mobile') {
    await expect(pastilles(page)).toHaveCount(0); // hors de l'arbre d'accessibilité
    await expect(page.getByText('2 h au plus')).toBeHidden(); // et rien d'affiché
    return;
  }
  await expect(pastille(page, 'Nantesville (44)')).toBeVisible();
  expect(nbsp(await pastille(page, 'Nantesville (44)').innerText())).toMatch(/Nantesville \(44\)\s*2 h au plus/);

  await choisirSurLaCarte(page, 'B');
  await expect(fiche(page)).toContainText('Grandeville (33)');
  await expect(pastille(page, 'Nantesville (44)')).toBeVisible();
  const avant = nbsp(await pastille(page, 'Nantesville (44)').innerText());
  expect(avant).toMatch(/Nantesville \(44\)\s*2 h 15 · au-dessus de 2 h/);

  // Affichage seul : pas un bouton, et un clic ne change rien (ni la fiche, ni la pastille, ni l'adresse de la page).
  await expect(pastilles(page).getByRole('button')).toHaveCount(0);
  const url = page.url();
  await pastille(page, 'Nantesville (44)').click();
  await apresRendu(page);
  await expect(fiche(page)).toContainText('Grandeville (33)');
  expect(nbsp(await pastille(page, 'Nantesville (44)').innerText())).toBe(avant);
  expect(page.url()).toBe(url);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(pastilles(page)).toHaveCount(0);
});

// Hors AC (R15, D10 ; relecture proches) : « Nantesville (44) · 2 h au plus », le « · » dessiné entre le nom et la valeur.
test('R15 pastille : un « · » sépare le nom de la valeur, à l’écran et pour les lecteurs d’écran', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 }); // les pastilles n'existent qu'en bureau (AC-16)
  await ouvrir(page);
  await servirIgn(page);
  await ajouter(page, 'Nantesville');
  await pret(page, 'Nantesville (44)');
  const valeur = pastille(page, 'Nantesville (44)').getByText('2 h au plus');
  expect(await valeur.evaluate((e) => getComputedStyle(e, '::before').content)).toBe('"·"');
  await expect(pastille(page, 'Nantesville (44)')).toMatchAriaSnapshot('- listitem: /Nantesville \\(44\\) ·\\s*2 h au plus/');
});

// Hors AC (details.md « aucune commune ») : avec un proche prêt, le message de la liste cite le proche.
test('aucune commune avec un proche prêt : « Relâche le loyer, la mer, la taille ou un proche. »', async ({ page }) => {
  await ouvrir(page);
  await servirIgn(page);
  await ajouter(page, 'Brestville'); // tout à 3 h ou plus de 3 h : rien ne tient 2 h
  await pret(page, 'Brestville (29)');
  await expect(liste(page)).toContainText('Aucune commune ne passe tes critères. Relâche le loyer, la mer, la taille ou un proche.');
});

// Hors AC : les repères suivent l'état du proche (Calcul, Prêt, Indisponible) et ne se cliquent pas.
test('repère : calcul dès « Ajouter », puis prêt ; indisponible si les trajets tombent en panne ; ne se clique pas', async ({ page }) => {
  await ouvrir(page);
  await servirIgn(page);
  await ajouter(page, 'Nantesville');
  await expect(repere(page, 'Nantesville (44)')).toHaveAttribute('data-etat', 'calcul');
  await pret(page, 'Nantesville (44)');
  await expect(repere(page, 'Nantesville (44)')).toHaveAttribute('data-etat', 'pret');
  await expect(repere(page, 'Nantesville (44)')).toHaveCSS('pointer-events', 'none');
  await expect(repere(page, 'Nantesville (44)').locator('button, a, [tabindex]')).toHaveCount(0);

  await servirIgn(page, { trajets: 'panne' });
  await ajouter(page, 'Toulouseville');
  await expect(repere(page, 'Toulouseville (31)')).toHaveAttribute('data-etat', 'indisponible');
  await zone(page).getByRole('button', { name: 'Retirer Toulouseville (31)' }).click();
  await expect(repere(page, 'Toulouseville (31)')).toHaveCount(0);
  await expect(reperes(page)).toHaveCount(1);
});

// Proches posés sur les carrés de la fixture : une recherche « voisin » propose deux adresses, au centre de Portmer
// (là où se pose son rond du top 10) et juste à côté. Posée après `servirIgn` (la dernière route gagne).
const PORTMER = [0.25, 0.25];
async function servirVoisins(page: Page) {
  const adresse = (n: number, point: number[]) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: point },
    properties: { label: `${n} rue Voisine 17000 Portmer`, city: 'Portmer', citycode: '17999', type: 'housenumber', name: `${n} rue Voisine`, postcode: '17000' },
  });
  await page.route('https://data.geopf.fr/geocodage/search*', (r: Route) =>
    r.fulfill({
      headers: { 'access-control-allow-origin': '*' },
      json: { type: 'FeatureCollection', features: [adresse(1, PORTMER), adresse(2, [PORTMER[0] + 0.01, PORTMER[1]])] },
    }),
  );
}
async function ajouterVoisin(page: Page, n: 1 | 2, nom: string) {
  const champ = zone(page).getByRole('textbox', { name: 'Adresse ou ville' });
  if (!(await champ.isVisible())) await zone(page).getByRole('button', { name: '+ Ajouter un proche' }).click();
  await champ.fill('voisin');
  await zone(page).getByRole('button', { name: `${n} rue Voisine, 17000 Portmer` }).click();
  await zone(page).getByRole('textbox', { name: 'Nom' }).fill(nom);
  await zone(page).getByRole('button', { name: 'Ajouter', exact: true }).click();
}
const boite = (page: Page, nom: string, partie: 'goutte' | 'etiquette') =>
  (partie === 'goutte' ? repere(page, nom).locator('[data-partie="goutte"]') : etiquette(page, nom)).boundingBox();

test('deux repères au même endroit : l’étiquette du proche ajouté en second passe à gauche de sa goutte', async ({ page }) => {
  await ouvrir(page);
  await servirIgn(page, { delaiZoneMs: 60_000 }); // les proches restent en calcul : seul le placement compte ici
  await servirVoisins(page);
  await ajouterVoisin(page, 1, 'Mamie Jo');
  await ajouterVoisin(page, 2, 'Les Dupont');
  await expect(reperes(page)).toHaveCount(2);
  await apresRendu(page);

  const [g1, e1, g2, e2] = await Promise.all([boite(page, 'Mamie Jo', 'goutte'), boite(page, 'Mamie Jo', 'etiquette'), boite(page, 'Les Dupont', 'goutte'), boite(page, 'Les Dupont', 'etiquette')]);
  expect(e1!.x).toBeGreaterThanOrEqual(g1!.x + g1!.width); // le premier : à droite
  expect(e2!.x + e2!.width).toBeLessThanOrEqual(g2!.x); // le second : à gauche
  // Les deux étiquettes ne se recouvrent plus.
  expect(e2!.x + e2!.width <= e1!.x || e1!.x + e1!.width <= e2!.x).toBe(true);
});

test('repère au-dessus du rond du top 10 posé au même endroit (ordre d’empilement, lu au pixel)', async ({ page }) => {
  await ouvrir(page);
  await servirIgn(page, { delaiZoneMs: 60_000 }); // en calcul : il ne compte pas, les ronds de loyer-mer restent
  await servirVoisins(page);
  await ajouterVoisin(page, 1, 'Mamie Jo');
  await expect(repere(page, 'Mamie Jo')).toHaveAttribute('data-etat', 'calcul');
  // Un réglage recrée les ronds après le repère (ils arrivent derniers dans la carte) : seul l'ordre d'empilement les départage.
  await page.getByRole('slider', { name: 'Loyer maximum' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: '1re : Portmer (17)' })).toBeVisible();
  await apresRendu(page);

  // Le rond de Portmer est centré sur le point ; la pointe de la goutte aussi. 8 px au-dessus du point, la goutte est
  // pleine (terre cuite) et le rond aussi (couleur du texte) : la couleur lue dit lequel est dessus.
  const rond = (await page.getByRole('button', { name: '1re : Portmer (17)' }).boundingBox())!;
  const [px] = await readPixels(page, [{ x: rond.x + rond.width / 2, y: rond.y + rond.height / 2 - 8 }]);
  const ecart = (hex: string) => Math.max(...[1, 3, 5].map((i, k) => Math.abs(parseInt(hex.slice(i, i + 2), 16) - px[k])));
  expect(ecart(color['place-marker']), `lu ${px}`).toBeLessThan(ecart(color.foreground));
  expect(ecart(color['place-marker']), `lu ${px}`).toBeLessThanOrEqual(12);
});

test('repère en calcul : l’anneau pulse, et reste fixe avec « réduire les animations »', async ({ page }) => {
  await ouvrir(page);
  await servirIgn(page, { delaiZoneMs: 60_000 });
  await servirVoisins(page);
  await ajouterVoisin(page, 1, 'Mamie Jo');
  const anneau = repere(page, 'Mamie Jo').locator('[data-partie="anneau"]');
  await expect(anneau).toHaveCount(1);
  expect(await anneau.evaluate((el) => el.getAnimations().length)).toBeGreaterThan(0);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => anneau.evaluate((el) => el.getAnimations().length)).toBe(0);
  await expect(anneau).toHaveCSS('opacity', '0.4');
});
