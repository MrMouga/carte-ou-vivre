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
// Critères de la tâche 2 : la recherche par code postal (R58 partie code, H183, H187). Les codes servis sont les
// `codes_postaux` de la fixture de recherche-et-mer, par code INSEE (tests/e2e/lib/carte.ts) ; 99100 est partagé par
// Portmer et Quaibleu.
const CHARGEMENT_CODES = 'Chargement des codes postaux…';
const INDISPONIBLES = 'Codes postaux indisponibles. Cherche par nom ou réessaie dans un moment.';
/** Le fichier des codes postaux du site : ses demandes comptées, et sa réponse décidée par le test (après la fixture). */
async function codesPostaux(page: Page, reponse: () => 'fixture' | 'erreur' | Promise<'fixture'>) {
  const demandes: string[] = [];
  // Posée après celles de la fixture, cette route passe d'abord (Playwright) ; « fixture » rend la main à celle de carte.ts.
  await page.route('**/data/codes-postaux.json', async (r) => {
    demandes.push(r.request().url());
    if ((await reponse()) === 'erreur') return r.fulfill({ status: 503, body: '' });
    return r.fallback();
  });
  return demandes;
}

test('AC-2 : « 99100 » Quaibleu (13) puis Portmer (17), « 339 » 33990 · Grandeville (33), « 33 991 » 33991 · Grandeville (33)', async ({ page }) => {
  await ouvrirSix(page);
  await loupe(page).click();
  // Codes postaux chargés (« given ») : demandés à la prise de focus, ils arrivent avant la fin de la saisie.
  await taper(page, '99100');
  await attendreSuggestions(page, ['99100 · Quaibleu (13)', '99100 · Portmer (17)']);
  await taper(page, '339');
  await attendreSuggestions(page, ['33990 · Grandeville (33)']);
  await taper(page, '33 991');
  await attendreSuggestions(page, ['33991 · Grandeville (33)']);
});

test('AC-3 : « zzz » aucune ; codes en erreur à chaque demande : « 33 » codes indisponibles, sans suggestion ; « grand » Grandeville (33)', async ({ page }) => {
  await ouvrirSix(page);
  await loupe(page).click();
  await taper(page, 'zzz');
  await expect(page.getByText(AUCUNE)).toBeVisible();
  await attendreSuggestions(page, []);

  // Page rouverte, le fichier des codes postaux répond en erreur à chaque demande.
  const demandes = await codesPostaux(page, () => 'erreur');
  await page.goto('/');
  await expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
  await loupe(page).click();
  await taper(page, '33');
  await expect(page.getByText(INDISPONIBLES)).toBeVisible();
  await attendreSuggestions(page, []);
  expect(demandes, 'une demande et un nouvel essai aussitôt (H187)').toHaveLength(2);
  await taper(page, 'grand');
  await attendreSuggestions(page, ['Grandeville (33)']);
  await expect(page.getByText(INDISPONIBLES)).toHaveCount(0);
});

// Règles de la tâche 2 hors critère : chargement des codes (H187), libellé et liste par code (H183, R58).

test('H187 : codes demandés une fois, à la première prise de focus du champ, pas à l\'ouverture de la page', async ({ page }) => {
  // Routes posées par `ouvrir`, puis le compteur des demandes, puis la page rouverte : rien n'est demandé avant le focus.
  await ouvrirSix(page);
  const demandes = await codesPostaux(page, () => 'fixture');
  await page.goto('/');
  await expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
  await apresRendu(page);
  expect(demandes, 'aucune demande à l\'ouverture').toHaveLength(0);
  await loupe(page).click();
  await taper(page, '23');
  await attendreSuggestions(page, ['23990 · Terrebasse (23)']);
  expect(demandes).toHaveLength(1);
  // Recherche fermée puis rouverte : les codes déjà là servent, aucune nouvelle demande.
  await page.getByRole('button', { name: 'Annuler' }).click();
  await loupe(page).click();
  await taper(page, '1799');
  await attendreSuggestions(page, ['17990 · Portmer (17)']);
  expect(demandes).toHaveLength(1);
});

test('H187 : « Chargement des codes postaux… » tant qu\'ils ne sont pas là ; le nom se cherche pendant ce temps ; puis les suggestions', async ({ page }) => {
  let lacher: () => void = () => {};
  const retenu = new Promise<'fixture'>((r) => (lacher = () => r('fixture')));
  await ouvrirSix(page);
  await codesPostaux(page, () => retenu);
  await loupe(page).click();
  // La zone annoncée du champ (aria-live, à part du compte), comme le test de H186.
  const zone = champ(page).locator('xpath=ancestor::div[3]').locator('[aria-live="polite"]');
  await taper(page, '33');
  await expect(zone).toHaveText(CHARGEMENT_CODES);
  await expect(page.getByText(CHARGEMENT_CODES)).toBeVisible();
  await attendreSuggestions(page, []);
  await taper(page, 'rh');
  await attendreSuggestions(page, ['Rhinval (67)']);
  await taper(page, '33');
  await expect(zone).toHaveText(CHARGEMENT_CODES);
  lacher();
  await attendreSuggestions(page, ['33990 · Grandeville (33)']);
  await expect(zone).toHaveText('1 suggestion');
});

test('H187 : codes indisponibles, nouvel essai à la prochaine prise de focus, qui les trouve', async ({ page }) => {
  let enPanne = true;
  await ouvrirSix(page);
  const demandes = await codesPostaux(page, () => (enPanne ? 'erreur' : 'fixture'));
  await loupe(page).click();
  await taper(page, '99100');
  await expect(page.getByText(INDISPONIBLES)).toBeVisible();
  expect(demandes).toHaveLength(2);

  enPanne = false;
  // Le champ perd le focus (« Annuler »), puis le reprend (loupe) : un nouvel essai.
  await page.getByRole('button', { name: 'Annuler' }).click();
  await loupe(page).click();
  await taper(page, '99100');
  await attendreSuggestions(page, ['99100 · Quaibleu (13)', '99100 · Portmer (17)']);
  expect(demandes).toHaveLength(3);
});

test('R58 et H183 : « 99100 », flèche bas, Entrée : Portmer (17) choisie comme par son nom', async ({ page }) => {
  await ouvrirSix(page);
  await loupe(page).click();
  await taper(page, '99100');
  await attendreSuggestions(page, ['99100 · Quaibleu (13)', '99100 · Portmer (17)']);
  await champ(page).press('ArrowDown');
  await champ(page).press('Enter');
  await expect(fiche(page)).toContainText('Portmer (17)');
  expect(adresse(page)).toBe('/?loyer=1200');
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

// ---------------------------------------------------------------------------------------------------------------------
// Critères de la tâche 3b : la mer en minutes (R60 à R63, D5 révisée, D6, D7, D9). Les temps servis sont les `mer_min` de
// la fixture de recherche-et-mer, par code INSEE (tests/e2e/lib/carte.ts) : Portmer 5, Grandeville 50, Montcher 135,
// Terrebasse 160, Quaibleu 14 ; Rhinval sans temps (420 km, comptés 420 min, D7).
const liste = (page: Page) => page.getByRole('region', { name: 'Les 10 premières' });
const lignes = async (page: Page) => (await liste(page).getByRole('button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))).map(nbsp);
/** « Portmer (17) · 69 » : le nom et le score de chaque ligne de la liste. */
const scoresListe = async (page: Page) => (await lignes(page)).map((l) => l.split(' · ').slice(1, 3).join(' · '));
const mer = (page: Page) => page.getByRole('group', { name: 'Mer à moins de' });
const choixMer = (page: Page, nom: string) => mer(page).getByRole('button', { name: nom, exact: true });
/** La pastille de mer cochée, et elle seule. */
async function merCochee(page: Page, nom: string) {
  await expect(choixMer(page, nom)).toHaveAttribute('aria-pressed', 'true');
  await expect(mer(page).getByRole('button', { pressed: true })).toHaveCount(1);
}
/** Aucune pastille de mer cochée (Peu importe). */
async function merAucune(page: Page) {
  await expect(mer(page).getByRole('button')).toHaveCount(4);
  await expect(mer(page).getByRole('button', { pressed: true })).toHaveCount(0);
}
/** Choisit une commune par la recherche (R59) : la loupe si le champ n'est pas ouvert, la saisie, la suggestion. */
async function choisirParRecherche(page: Page, texte: string, nom: string) {
  if (!(await champ(page).isVisible())) await loupe(page).click();
  await taper(page, texte);
  await attendreSuggestions(page, [nom]);
  await suggestions(page).first().click();
  await expect(fiche(page)).toContainText(nom);
}

test('AC-6 depuis /?loyer=1200, « 30 min » : pastilles 15 min, 30 min, 1 h, 1 h 30, sans bascule ; /?loyer=1200&mer-min=30 ; Portmer 65 · 5 min, Quaibleu 31 · 14 min', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200');
  await merAucune(page);
  expect((await mer(page).getByRole('button').allInnerTexts()).map((t) => nbsp(t).replace(/\s+/g, ' '))).toEqual(['15 min', '30 min', '1 h', '1 h 30']);
  for (const nom of ['km', 'min']) {
    await expect(page.getByRole('button', { name: nom, exact: true })).toHaveCount(0);
    await expect(page.getByRole('radio', { name: nom, exact: true })).toHaveCount(0);
  }

  await choixMer(page, '30 min').click();
  await merCochee(page, '30 min');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&mer-min=30');
  await voirListe(page);
  await expect(liste(page)).toContainText('2 communes passent tes critères');
  expect(await lignes(page)).toEqual(['1 · Portmer (17) · 65 · 650 € · 5 min', '2 · Quaibleu (13) · 31 · 1 092 € · 14 min']);
});

test('AC-7 /?loyer=1200&mer-min=60 : « 1 h » cochée, adresse inchangée ; /?loyer=1200&mer-min=50 : Peu importe, /?loyer=1200, 5 communes en minutes', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&mer-min=60');
  await merCochee(page, '1 h');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&mer-min=60');

  await ouvrirSix(page, '/?loyer=1200&mer-min=50');
  await merAucune(page);
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
  await voirListe(page);
  await expect(liste(page)).toContainText('5 communes passent tes critères');
  expect(await lignes(page)).toEqual([
    '1 · Terrebasse (23) · 65 · 416 € · 2 h 40',
    '2 · Rhinval (67) · 52 · 572 € · ≈ 7 h',
    '3 · Portmer (17) · 46 · 650 € · 5 min',
    '4 · Grandeville (33) · 31 · 832 € · 50 min',
    '5 · Quaibleu (13) · 9 · 1 092 € · 14 min',
  ]);
});

test('AC-8 /?loyer=1200&mer-min=60, aucun proche : Portmer 69, Quaibleu 43, Grandeville 24 ; Terrebasse « Mer 2 h 40 : … de 1 h », « 2 h 40 de la mer en voiture » ; Rhinval « Mer ≈ 7 h : … », « compté 7 h d’après les km »', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&mer-min=60');
  await voirListe(page);
  await expect(liste(page)).toContainText('3 communes passent tes critères');
  expect(await scoresListe(page)).toEqual(['Portmer (17) · 69', 'Quaibleu (13) · 43', 'Grandeville (33) · 24']);

  await choisirParRecherche(page, 'terre', 'Terrebasse (23)');
  let t = await texteFiche(page);
  expect(t).toContain('Ne passe pas tes critères');
  expect(t).toContain('Mer 2 h 40 : au-dessus de ton plafond de 1 h');
  expect(t).toContain('2 h 40 de la mer en voiture');

  await choisirParRecherche(page, 'rhin', 'Rhinval (67)');
  t = await texteFiche(page);
  expect(t).toContain('Mer ≈ 7 h : au-dessus de ton plafond de 1 h');
  expect(t).toContain("Temps en voiture jusqu'à la mer inconnu : compté 7 h d'après les km");
});

test('AC-9 depuis /?loyer=1200 : fiche de Grandeville « 50 min de la mer en voiture » puis la montagne, sans « km de la mer » ; Quaibleu « 14 min de la mer en voiture » ; mentions de La Poste et d’openrouteservice', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200');
  await choisirParRecherche(page, 'grand', 'Grandeville (33)');
  let t = await texteFiche(page);
  const iMer = t.indexOf('50 min de la mer en voiture');
  expect(iMer).toBeGreaterThanOrEqual(0);
  expect(t.indexOf("50 km de la montagne à vol d'oiseau")).toBeGreaterThan(iMer);
  expect(t).not.toContain('km de la mer');

  await choisirParRecherche(page, 'quai', 'Quaibleu (13)');
  t = await texteFiche(page);
  expect(t).toContain('14 min de la mer en voiture');
  expect(t).not.toContain('km de la mer');

  await ouvrirSix(page, '/?loyer=1200');
  const mentions = nbsp(await page.getByRole('contentinfo').filter({ visible: true }).first().textContent());
  for (const texte of ['Codes postaux', 'La Poste', "Temps jusqu'à la mer", 'openrouteservice']) expect(mentions).toContain(texte);
});

test('AC-10 anciens liens : /?loyer=1200&mer=30 et /?loyer=1200&mer=60 → Peu importe, /?loyer=1200, 5 communes ; /?loyer=1200&mer=30&mer-min=15 → « 15 min », /?loyer=1200&mer-min=15, Portmer 56, Quaibleu 8', async ({ page }) => {
  for (const ancien of ['/?loyer=1200&mer=30', '/?loyer=1200&mer=60']) {
    await ouvrirSix(page, ancien);
    await merAucune(page);
    await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
    await voirListe(page);
    await expect(liste(page)).toContainText('5 communes passent tes critères');
    expect((await lignes(page))[0]).toMatch(/^1 · Terrebasse \(23\) · /);
  }

  await ouvrirSix(page, '/?loyer=1200&mer=30&mer-min=15');
  await merCochee(page, '15 min');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&mer-min=15');
  await voirListe(page);
  expect(await lignes(page)).toEqual(['1 · Portmer (17) · 56 · 650 € · 5 min', '2 · Quaibleu (13) · 8 · 1 092 € · 14 min']);
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

// ---------------------------------------------------------------------------------------------------------------------
// Corrections 1 (relecture de la spec, review-spec.md ; QA qa-2.md, captures/qa/qa2-390-saisie-01300.png) : à 390 × 844,
// « 01300 » (22 communes dans les vraies données) ne montrait que 6 suggestions dans une liste de 280 px, la moitié basse
// de la feuille montée vide. Au téléphone, la liste prend la hauteur de la feuille sous le champ, jusqu'au clavier, et
// défile ; en bureau, `taille-liste-suggestions` (280 px) au plus. Jeu : les 6 communes, plus 22 communes d'un même code
// postal (noms du 01300, codes inventés) ; chaque test fixe sa fenêtre et passe donc pareil dans les deux projets.
const NOMS_01300 = [
  'Belley', 'Virignin', 'Brégnier-Cordon', 'Peyrieu', 'Chazey-Bons', 'Arboys en Bugey', 'Magnieu', 'Saint-Champ',
  'Contrevoz', 'Murs-et-Gélignieux', 'Cressin-Rochefort', 'Parves et Nattages', 'Brens', 'Colomieu', 'Izieu',
  'Massignieu-de-Rives', 'Pollieu', 'Conzieu', 'Andert-et-Condon', 'Prémillieu', 'Saint-Germain-les-Paroisses', 'La Burbanche',
];
const VINGT_DEUX: Jeu = {
  ...SIX,
  items: [
    ...SIX.items,
    ...NOMS_01300.map((nom, i) => ({ ...SIX.items[0], id: `P${i}`, code_insee: String(99101 + i), nom, dep: '01', population: 9000 - i * 350 })),
  ],
};
const CODES_01300 = { '01300': NOMS_01300.map((_, i) => String(99101 + i)) };

/** Ouvre le jeu des 22 communes du 01300, la recherche, et tape « 01300 » : les 22 suggestions par code. */
async function chercher01300(page: Page, toucher: boolean) {
  await ouvrir(page, '/', { jeu: VINGT_DEUX });
  // Posée après celle de la fixture, cette route passe d'abord (Playwright).
  await page.route('**/data/codes-postaux.json', (r) => r.fulfill({ json: CODES_01300 }));
  await (toucher ? loupe(page).tap() : loupe(page).click());
  await expect(champ(page)).toBeFocused();
  const champAuFocus = (await champ(page).boundingBox())!;
  await taper(page, '01300');
  await expect(suggestions(page)).toHaveCount(NOMS_01300.length);
  await expect(suggestions(page).first()).toHaveAccessibleName('01300 · Belley (01)');
  await apresRendu(page);
  return champAuFocus;
}
const boite = (page: Page) => page.getByRole('listbox', { name: 'Suggestions de communes' }).boundingBox().then((b) => b!);
/** Les suggestions entièrement visibles dans la liste (sans défiler). */
const visibles = (page: Page) =>
  page.getByRole('listbox', { name: 'Suggestions de communes' }).evaluate((ul) => {
    const l = ul.getBoundingClientRect();
    return [...ul.children].filter((li) => li.getBoundingClientRect().top >= l.top - 1 && li.getBoundingClientRect().bottom <= l.bottom + 1).length;
  });
const defile = (page: Page) => page.getByRole('listbox', { name: 'Suggestions de communes' }).evaluate((ul) => ul.scrollHeight > ul.clientHeight);

test.describe('téléphone (toucher)', () => {
  test.use({ hasTouch: true });

  test('390 px : 01300 montre plus de 6 suggestions et la liste remplit la feuille', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const champAuFocus = await chercher01300(page, true);
    const liste = await boite(page);
    const feuille = (await page.getByTestId('feuille').boundingBox())!;
    expect(await visibles(page)).toBeGreaterThan(6);
    expect(liste.height).toBeGreaterThan(size['taille-liste-suggestions']);
    // La liste va jusqu'au bas de la feuille (sous elle : la marge `space-2` de la recherche, et celle du geste, nulle ici).
    expect(feuille.y + feuille.height - (liste.y + liste.height)).toBeLessThanOrEqual(space['space-2'] + 1);
    expect(await defile(page)).toBe(true);
    // Le champ n'a pas bougé, et la dernière suggestion se montre en faisant défiler la liste.
    expect((await champ(page).boundingBox())!.y).toBeCloseTo(champAuFocus.y, 0);
    await suggestions(page).last().scrollIntoViewIfNeeded();
    const derniere = (await suggestions(page).last().boundingBox())!;
    expect(derniere.y + derniere.height).toBeLessThanOrEqual(liste.y + liste.height + 1);
  });

  test('390 × 664, clavier de l’iPhone ouvert (y = 342) : la liste des 01300 s’arrête au-dessus du clavier, défile jusqu’à la dernière, le champ ne bouge pas', async ({ page }) => {
    // Le navigateur de test n'a pas de clavier : on le simule comme Safari, par la partie visible de la page
    // (`visualViewport`), réduite à 342 px de haut sans que la page change de taille (proches-clavier-iphone.spec.ts).
    const CLAVIER_IPHONE = 342;
    await page.addInitScript(() => {
      const vv = Object.assign(new EventTarget(), { width: innerWidth, height: innerHeight, offsetTop: 0, offsetLeft: 0, pageTop: 0, pageLeft: 0, scale: 1 });
      Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => vv });
      (window as unknown as { __clavier: (y: number) => void }).__clavier = (y) => {
        vv.height = y;
        vv.dispatchEvent(new Event('resize'));
      };
    });
    await page.setViewportSize({ width: 390, height: 664 });
    await ouvrir(page, '/', { jeu: VINGT_DEUX });
    await page.route('**/data/codes-postaux.json', (r) => r.fulfill({ json: CODES_01300 }));
    await loupe(page).tap();
    await expect(champ(page)).toBeFocused();
    const champAuFocus = (await champ(page).boundingBox())!;
    await page.evaluate((y) => (window as unknown as { __clavier: (y: number) => void }).__clavier(y), CLAVIER_IPHONE);
    await taper(page, '01300');
    await expect(suggestions(page)).toHaveCount(NOMS_01300.length);
    await apresRendu(page);

    const liste = await boite(page);
    expect(liste.y + liste.height).toBeLessThanOrEqual(CLAVIER_IPHONE);
    expect(CLAVIER_IPHONE - (liste.y + liste.height)).toBeLessThanOrEqual(space['space-2'] + 1);
    expect(await visibles(page)).toBeGreaterThanOrEqual(3);
    expect(await defile(page)).toBe(true);
    expect((await champ(page).boundingBox())!.y).toBeCloseTo(champAuFocus.y, 0);
    await suggestions(page).last().scrollIntoViewIfNeeded();
    const derniere = (await suggestions(page).last().boundingBox())!;
    expect(derniere.y + derniere.height).toBeLessThanOrEqual(CLAVIER_IPHONE);
    // Clavier fermé : la liste reprend toute la hauteur de la feuille.
    await page.evaluate(() => (window as unknown as { __clavier: (y: number) => void }).__clavier(innerHeight));
    await apresRendu(page);
    expect((await boite(page)).y + (await boite(page)).height).toBeGreaterThan(CLAVIER_IPHONE + 100);
  });
});

test('bureau : 01300, la liste des suggestions garde 280 px au plus et défile', async ({ page }) => {
  await page.setViewportSize(BUREAU);
  await chercher01300(page, false);
  const liste = await boite(page);
  expect(liste.height).toBeLessThanOrEqual(size['taille-liste-suggestions']);
  expect(liste.height).toBeGreaterThan(size['taille-liste-suggestions'] - 2);
  expect(await defile(page)).toBe(true);
});
