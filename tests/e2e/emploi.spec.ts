import { expect, test, type Locator, type Page } from '@playwright/test';
import cadreDeVie from '../../docs/specs/2026-10-14-cadre-de-vie/acceptance.json' with { type: 'json' };
import { apresRendu, attendreCouleurs, ouvrir, servirFixture, vue, type Jeu } from './lib/carte';
import { amenerEnBas, mobile, onglet, voirCriteres, voirListe } from './lib/feuille';
import { size, space } from '../../src/theme/tokens';

// Tranche emploi, sur la fixture « 6 communes » de cadre-de-vie étendue par celles de mairies et d'emploi (emploi.json
// fabriqué par tests/e2e/lib/carte.ts depuis la fixture d'emploi, par code INSEE ; jamais le vrai fichier).
const SIX: Jeu = { items: cadreDeVie.fixture.items, tuiles: new URL('../fixtures/tuiles-immobilier/', import.meta.url) };
type Six = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

const nbsp = (t: string | null) => (t ?? '').replace(/ /g, ' ');
const adresse = (page: Page) => new URL(page.url()).pathname + new URL(page.url()).search;
const fiche = (page: Page) => page.getByRole('region', { name: /\(\d+\)$/ });

async function ouvrirSix(page: Page, chemin = '/') {
  await ouvrir(page, chemin, { jeu: SIX });
}
/**
 * Ouvre la fiche d'une commune sur la carte. L'adresse est rouverte d'abord : choisir une commune zoome la carte, et les
 * points de `vue()` sont ceux de la vue d'ouverture (docs/solutions/2026-10-19-clic-sur-la-carte-apres-un-choix-de-commune.md).
 */
async function ficheDeCarte(page: Page, id: Six, nom: string) {
  await ouvrirSix(page, adresse(page));
  const { centre } = vue(page, SIX);
  await page.mouse.click(centre(id).x, centre(id).y);
  await expect(fiche(page)).toContainText(nom);
}
/** Les lignes de la fiche qui suivent la ligne « Mairie » de R40 (la seule ligne « Mairie : » quand aucune mairie n'est cochée). */
async function sousMairie(page: Page) {
  const l = nbsp(await fiche(page).innerText()).split('\n').map((t) => t.trim()).filter(Boolean);
  const mairie = l.findIndex((t) => t.startsWith('Mairie :'));
  expect(mairie).toBeGreaterThanOrEqual(0);
  return l.slice(mairie + 1);
}

// ---------------------------------------------------------------------------------------------------------------------
// Tâche 2 : les lignes de la fiche (R47, H139) et les mentions du pied de page (R49 ; lues par AC-1, tâche 3a).

test('AC-10 /?loyer=1200&metier=V1X80:25,V2X90 : fiches de Quaibleu, Grandeville et Terrebasse, lignes des métiers puis du chômage sous « Mairie »', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&metier=V1X80:25,V2X90');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=V1X80:25,V2X90');

  await ficheDeCarte(page, 'E', 'Quaibleu (13)');
  expect((await sousMairie(page)).slice(0, 3)).toEqual([
    'Infirmiers et sages-femmes : Grandeville, à 28 km, parmi les 25 % de bassins qui recrutent le plus · 626 recrutements prévus en 2026',
    'Médecins : bassin de Montcher, 410 recrutements prévus en 2026',
    "Chômage : 6,8 % dans la zone d'emploi de Montcher (2e trimestre 2026)",
  ]);

  await ficheDeCarte(page, 'B', 'Grandeville (33)');
  let sous = await sousMairie(page);
  const infirmiersG = sous.indexOf('Infirmiers et sages-femmes : Grandeville, sur place, parmi les 25 % de bassins qui recrutent le plus · 626 recrutements prévus en 2026');
  const chomageG = sous.indexOf("Chômage : 7,1 % dans la zone d'emploi de Grandeville (2e trimestre 2026)");
  expect(infirmiersG).toBe(0);
  expect(chomageG).toBeGreaterThan(infirmiersG);

  await ficheDeCarte(page, 'D', 'Terrebasse (23)');
  sous = await sousMairie(page);
  expect(sous.slice(0, 2)).toEqual([
    'Infirmiers et sages-femmes : Montcher, à 29 km, parmi les 10 % de bassins qui recrutent le plus · 1 680 recrutements prévus en 2026',
    'Médecins : bassin de Grandeville, 120 recrutements prévus en 2026',
  ]);
});

// ---------------------------------------------------------------------------------------------------------------------
// Tâche 3a : la catégorie « Emploi » (R44, R50, H129 à H133, H147, design F) : chercher, choisir, retirer ; en bureau et à
// 390 px (onglet « Critères »). Le test « design F » de la tâche 2 suit ce bloc.

const INFIRMIERS = 'Infirmiers et sages-femmes';
const GRAPHISTES = 'Graphistes, dessinateurs, stylistes, décorateurs et créateurs de supports de communication visuelle';
const INGENIEURS = "Ingénieurs et cadres d'étude, recherche et développement en informatique et télécom";
const ETAT = "Les emplois de l'État (enseignants du public, fonctionnaires) ne sont pas dans l'enquête.";
const PEU_CHIFFRE = 'Chiffré dans peu de bassins : la carte en oublie sûrement.';
const INDICE = 'Coche un niveau pour garder les communes proches de ces bassins.';

const reglages = (page: Page) => page.getByRole('region', { name: 'Réglages' });
const titreEmploi = (page: Page) => page.getByRole('heading', { level: 2, name: /^Emploi/ }).getByRole('button');
const champMetier = (page: Page) => page.getByRole('combobox', { name: 'Ton métier' });
const suggestions = (page: Page) => page.getByRole('listbox', { name: 'Suggestions de métiers' }).getByRole('option');
const niveaux = (page: Page, libelle: string) => page.getByRole('group', { name: `Où ce métier recrute le plus ${libelle}`, exact: true });
const tousNiveaux = (page: Page) => page.getByRole('group', { name: /^Où ce métier recrute le plus/ });
const caseNiveau = (page: Page, libelle: string, nom: string) => niveaux(page, libelle).getByRole('button', { name: nom, exact: true });
const retirer = (page: Page, libelle: string) => page.getByRole('button', { name: `Retirer ${libelle}`, exact: true });
const lienSecond = (page: Page) => page.getByRole('button', { name: '+ Ajouter un second métier' });
/** La ligne d'un métier choisi (composant « Métier choisi »), reconnue à son « Retirer ». */
const metierChoisi = (page: Page, libelle: string) => reglages(page).getByRole('listitem').filter({ has: retirer(page, libelle) });
/** La phrase « Coche un niveau… » (H130) sous un métier choisi. */
const indice = (page: Page, libelle: string) => metierChoisi(page, libelle).getByText(INDICE, { exact: true });
const aucunMetier = (page: Page) => reglages(page).getByText('Aucun métier trouvé', { exact: true });
const textesNiveaux = async (page: Page, libelle: string) => (await niveaux(page, libelle).getByRole('button').allInnerTexts()).map((t) => nbsp(t).trim());
/** Haut d'un élément dans la fenêtre. */
const y = async (l: Locator) => (await l.boundingBox())!.y;
const listeCommunes = (page: Page) => page.getByRole('region', { name: 'Les 10 premières' });
const nomsScores = async (page: Page) =>
  (await listeCommunes(page).getByRole('button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? ''))).map((l) => nbsp(l).split(' · ').slice(1, 3).join(' · '));
const DEPART = ['Terrebasse (23) · 65', 'Rhinval (67) · 52', 'Portmer (17) · 46', 'Grandeville (33) · 31', 'Quaibleu (13) · 9'];
const titresCategories = async (page: Page) => (await reglages(page).getByRole('heading', { level: 2 }).allTextContents()).map((t) => nbsp(t).trim());

test('AC-1 ouverture de / : « Emploi » ouverte entre « Vie locale » et « Tes proches », champ vide, phrase sur l’État, mentions ; « infirm » → une suggestion, choisie : /?loyer=1200&metier=V1X80, pastilles sans coche, « Retirer », lien du second métier, liste inchangée ; repliée, « 1 métier »', async ({ page }) => {
  await ouvrirSix(page);
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
  const titres = await titresCategories(page);
  expect(titres.indexOf('Emploi')).toBe(titres.indexOf('Vie locale') + 1);
  expect(titres.indexOf('Tes proches')).toBe(titres.indexOf('Emploi') + 1);
  await expect(titreEmploi(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(champMetier(page)).toBeVisible();
  await expect(champMetier(page)).toHaveValue('');
  await expect(reglages(page).getByText(ETAT, { exact: true })).toBeVisible();
  await expect(tousNiveaux(page)).toHaveCount(0);
  await voirListe(page);
  await expect(listeCommunes(page)).toContainText('5 communes passent tes critères');
  expect(await nomsScores(page)).toEqual(DEPART);
  const mentions = page.getByRole('contentinfo').filter({ visible: true }).first();
  await expect(mentions).toContainText("Projets de recrutement et bassins d'emploi : France Travail, enquête Besoins en main-d'œuvre 2026");
  await expect(mentions).toContainText("Chômage : Insee, taux de chômage localisés par zone d'emploi, 2e trimestre 2026");

  await voirCriteres(page);
  await champMetier(page).fill('infirm');
  await expect(suggestions(page)).toHaveText([INFIRMIERS]);
  await suggestions(page).first().click();
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=V1X80');
  await expect(metierChoisi(page, INFIRMIERS)).toContainText(INFIRMIERS);
  expect(await textesNiveaux(page, INFIRMIERS)).toEqual(['10 %', '25 %', 'Partout où il recrute']);
  for (const b of await niveaux(page, INFIRMIERS).getByRole('button').all()) await expect(b).toHaveAttribute('aria-pressed', 'false');
  await expect(retirer(page, INFIRMIERS)).toBeVisible();
  await expect(lienSecond(page)).toBeVisible();
  await expect(champMetier(page)).toHaveCount(0);
  await voirListe(page);
  await expect(listeCommunes(page)).toContainText('5 communes passent tes critères');
  expect(await nomsScores(page)).toEqual(DEPART);

  await voirCriteres(page);
  await titreEmploi(page).click();
  await expect(titreEmploi(page)).toHaveAttribute('aria-expanded', 'false');
  expect(nbsp(await titreEmploi(page).textContent())).toBe('Emploi1 métier');
  await expect(niveaux(page, INFIRMIERS)).toBeHidden();
});

test('AC-2 « i », « medecin », « dévelop », « developpeur », « femm », « etude », « xyz » : suggestions de H133, « Aucun métier trouvé » ; l’adresse reste /?loyer=1200', async ({ page }) => {
  await ouvrirSix(page);
  await voirCriteres(page);
  const attendu: [string, string[]][] = [
    ['i', []],
    ['medecin', ['Médecins']],
    ['dévelop', [INGENIEURS]],
    ['developpeur', [INGENIEURS]],
    ['femm', [INFIRMIERS]],
    ['etude', [INGENIEURS]],
    ['xyz', []],
  ];
  const aucun = aucunMetier(page);
  for (const [tape, libelles] of attendu) {
    await champMetier(page).fill('');
    await champMetier(page).fill(tape);
    await expect(suggestions(page)).toHaveText(libelles);
    if (tape === 'xyz') await expect(aucun).toBeVisible();
    else await expect(aucun).toHaveCount(0);
  }
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
});

test('AC-14 /?loyer=1200&metier=V1X80,U1X82 : « Chiffré dans peu de bassins… » sous les graphistes seulement ; après « 25 % » pour les graphistes, toujours là, /?loyer=1200&metier=V1X80,U1X82:25', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&metier=V1X80,U1X82');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=V1X80,U1X82');
  await voirCriteres(page);
  const graphistes = metierChoisi(page, GRAPHISTES);
  const phrase = graphistes.getByText(PEU_CHIFFRE, { exact: true });
  await expect(phrase).toBeVisible();
  await expect(metierChoisi(page, INFIRMIERS)).not.toContainText('Chiffré dans peu de bassins');
  // H147 : sous la ligne du libellé et de « Retirer », au-dessus de « Où ce métier recrute le plus » ; elle décrit le groupe.
  expect(await y(phrase)).toBeGreaterThan(await y(graphistes.getByText(GRAPHISTES, { exact: true })));
  expect(await y(phrase)).toBeLessThan(await y(graphistes.getByText('Où ce métier recrute le plus', { exact: true })));
  await expect(niveaux(page, GRAPHISTES)).toHaveAccessibleDescription(new RegExp(`^${PEU_CHIFFRE}`));

  await caseNiveau(page, GRAPHISTES, '25 %').click();
  await expect(caseNiveau(page, GRAPHISTES, '25 %')).toHaveAttribute('aria-pressed', 'true');
  await expect(phrase).toBeVisible();
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=V1X80,U1X82:25');
  await expect(metierChoisi(page, INFIRMIERS)).not.toContainText('Chiffré dans peu de bassins');
});

// Hors AC (R44, H133 « au clavier, flèches, Entrée, Échap » ; design F « focus sur 10 % » ; plan : focus après « Retirer »).
test('clavier : flèches et Entrée choisissent, le focus va sur « 10 % » ; « Retirer » rend le focus au champ ; Échap vide le champ', async ({ page }) => {
  await ouvrirSix(page);
  await voirCriteres(page);
  await champMetier(page).fill('in');
  await expect(suggestions(page)).toHaveText([INFIRMIERS, INGENIEURS]);
  await expect(suggestions(page).first()).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(suggestions(page).nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(champMetier(page)).toHaveAttribute('aria-activedescendant', (await suggestions(page).nth(1).getAttribute('id'))!);
  await page.keyboard.press('ArrowDown'); // reste sur la dernière
  await expect(suggestions(page).nth(1)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowUp');
  await expect(suggestions(page).first()).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=M2X90');
  await expect(caseNiveau(page, INGENIEURS, '10 %')).toBeFocused();
  // H130 : sans niveau, la phrase « Coche un niveau… » décrit le groupe ; elle part dès qu'un niveau est coché.
  await expect(indice(page, INGENIEURS)).toBeVisible();
  await expect(niveaux(page, INGENIEURS)).toHaveAccessibleDescription(`${PEU_CHIFFRE} ${INDICE}`);
  await page.keyboard.press('Space');
  await expect(caseNiveau(page, INGENIEURS, '10 %')).toHaveAttribute('aria-pressed', 'true');
  await expect(indice(page, INGENIEURS)).toHaveCount(0);
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=M2X90:10');
  await page.keyboard.press('Space'); // la case cochée se décoche (D12 de cadre-de-vie)
  await expect(caseNiveau(page, INGENIEURS, '10 %')).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=M2X90');

  await retirer(page, INGENIEURS).focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
  await expect(champMetier(page)).toBeFocused();
  await expect(tousNiveaux(page)).toHaveCount(0);

  await page.keyboard.type('med');
  await expect(suggestions(page)).toHaveText(['Médecins']);
  await page.keyboard.press('Escape');
  await expect(champMetier(page)).toHaveValue('');
  await expect(suggestions(page)).toHaveCount(0);
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
});

test('deux métiers venus de l’adresse : chacun ses cases, pas de lien d’ajout ; « Retirer » sur le premier : le second reste, le focus va sur son « Retirer », le lien revient ; résumés « 1 métier » puis « Peu importe »', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&metier=V1X80:10,U1X82');
  await voirCriteres(page);
  await expect(caseNiveau(page, INFIRMIERS, '10 %')).toHaveAttribute('aria-pressed', 'true');
  for (const b of await niveaux(page, GRAPHISTES).getByRole('button').all()) await expect(b).toHaveAttribute('aria-pressed', 'false');
  await expect(indice(page, INFIRMIERS)).toHaveCount(0);
  await expect(indice(page, GRAPHISTES)).toBeVisible();
  await expect(lienSecond(page)).toHaveCount(0);
  await expect(champMetier(page)).toHaveCount(0);
  await expect(reglages(page).getByText(ETAT, { exact: true })).toBeVisible();
  // Aucun focus donné à l'ouverture : seul un choix l'amène sur « 10 % ».
  await expect(caseNiveau(page, GRAPHISTES, '10 %')).not.toBeFocused();
  await expect(caseNiveau(page, INFIRMIERS, '10 %')).not.toBeFocused();

  await retirer(page, INFIRMIERS).click();
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=U1X82');
  await expect(retirer(page, GRAPHISTES)).toBeFocused();
  await expect(niveaux(page, INFIRMIERS)).toHaveCount(0);
  await expect(lienSecond(page)).toBeVisible();
  await titreEmploi(page).click();
  expect(nbsp(await titreEmploi(page).textContent())).toBe('Emploi1 métier');
  await titreEmploi(page).click();
  await retirer(page, GRAPHISTES).click();
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
  await expect(champMetier(page)).toBeFocused();
  // 390 px (tâche 4, R20) : le champ revenu a le focus dans la feuille montée ; on en sort d'abord, comme on ferme le
  // clavier du téléphone (même geste que `voirListe` pour l'ajout d'un proche).
  if (mobile(page)) {
    await expect(page.getByRole('tablist')).toBeHidden();
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  }
  await titreEmploi(page).click();
  expect(nbsp(await titreEmploi(page).textContent())).toBe('EmploiPeu importe');
});

test('chargement : le champ « Ton métier » est désactivé tant qu’emploi.json n’est pas là', async ({ page }) => {
  await servirFixture(page, { jeu: SIX });
  let liberer = () => {};
  const retenu = new Promise<void>((r) => (liberer = r));
  await page.route('**/data/emploi.json', async (r) => {
    await retenu;
    await r.fallback();
  });
  await page.goto('/');
  await expect(champMetier(page)).toBeDisabled();
  liberer();
  await expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
  await expect(champMetier(page)).toBeEnabled();
});

test('390 px : champ en 16 px et 44 px de haut ; cases et « Retirer » de 44 px ; libellé long entier, sur plusieurs lignes', async ({ page }) => {
  test.skip(!mobile(page), 'feuille mobile seulement (sous 1 024 px)');
  await ouvrirSix(page);
  expect(await champMetier(page).evaluate((e) => getComputedStyle(e).fontSize)).toBe('16px');
  expect((await champMetier(page).boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await ouvrirSix(page, '/?loyer=1200&metier=U1X82');
  for (const b of [...(await niveaux(page, GRAPHISTES).getByRole('button').all()), retirer(page, GRAPHISTES)]) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  const libelle = metierChoisi(page, GRAPHISTES).getByText(GRAPHISTES, { exact: true });
  expect(nbsp(await libelle.textContent())).toBe(GRAPHISTES);
  expect((await libelle.boundingBox())!.height).toBeGreaterThan(40); // au moins deux lignes
});

// ---------------------------------------------------------------------------------------------------------------------
// Tâche 3b : les niveaux (R46, R47, R48) ; cocher une case de « Où ce métier recrute le plus » : carte, liste, fiche et
// adresse suivent ; en bureau et à 390 px (onglet « Critères » pour cocher, « Les 10 premières » pour lire la liste).

/** Les raisons de la fiche (liste sous « Ne passe pas tes critères »), texte par texte ; vide si la commune passe. */
const raisons = async (page: Page) =>
  (await fiche(page).locator('h3', { hasText: 'Ne passe pas tes critères' }).locator('xpath=following-sibling::ul[1]/li').allInnerTexts()).map((t) => nbsp(t).trim());
const texteFiche = async (page: Page) => nbsp(await fiche(page).innerText());
/** Coche (ou décoche) une case de niveau depuis l'onglet « Critères », la fiche refermée. */
async function cocher(page: Page, libelle: string, nom: string) {
  const retour = page.getByRole('button', { name: '← Les 10 premières' });
  if (await retour.isVisible()) await retour.click();
  await voirCriteres(page);
  await caseNiveau(page, libelle, nom).click();
}
const raisonNiveau = (libelle: string, niveau: '10' | '25', proche: string) =>
  `${libelle} : aucun bassin parmi les ${niveau} % qui recrutent le plus dans un rayon de 30 km (le plus proche : ${proche})`;

test('AC-4 /?loyer=1200&metier=V1X80, « 10 % » : /?loyer=1200&metier=V1X80:10, 1 commune, Terrebasse 65 ; A B E F non colorées ; fiche de Quaibleu : ligne du bassin de Montcher et raison une seule fois', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&metier=V1X80');
  await cocher(page, INFIRMIERS, '10 %');
  await expect(caseNiveau(page, INFIRMIERS, '10 %')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=V1X80:10');
  await apresRendu(page);
  await attendreCouleurs<Six>(page, { A: null, B: null, E: null, F: null }, { jeu: SIX });
  await voirListe(page);
  await expect(listeCommunes(page)).toContainText('1 commune passe tes critères');
  expect(await nomsScores(page)).toEqual(['Terrebasse (23) · 65']);

  await ficheDeCarte(page, 'E', 'Quaibleu (13)');
  expect(await texteFiche(page)).toContain('Infirmiers et sages-femmes : bassin de Montcher, 1 680 recrutements prévus en 2026');
  const raison = raisonNiveau(INFIRMIERS, '10', 'Montcher, 45 km');
  expect((await raisons(page)).filter((r) => r === raison)).toHaveLength(1);
  expect((await texteFiche(page)).split(raison).length - 1).toBe(1);
});

test('AC-5 /?loyer=1200&metier=V1X80:10, « 25 % » : 4 communes, raison de Rhinval (Montcher, 160 km) ; « Partout où il recrute » : 5 communes dans l’ordre de départ, ligne de Rhinval « sur place », plus de raison pour ce métier', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&metier=V1X80:10');
  await cocher(page, INFIRMIERS, '25 %');
  await expect(caseNiveau(page, INFIRMIERS, '25 %')).toHaveAttribute('aria-pressed', 'true');
  await expect(caseNiveau(page, INFIRMIERS, '10 %')).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=V1X80:25');
  await voirListe(page);
  await expect(listeCommunes(page)).toContainText('4 communes passent tes critères');
  expect(await nomsScores(page)).toEqual(['Terrebasse (23) · 65', 'Portmer (17) · 46', 'Grandeville (33) · 31', 'Quaibleu (13) · 9']);
  await ficheDeCarte(page, 'F', 'Rhinval (67)');
  expect(await raisons(page)).toContain(raisonNiveau(INFIRMIERS, '25', 'Montcher, 160 km'));

  await cocher(page, INFIRMIERS, 'Partout où il recrute');
  await expect(caseNiveau(page, INFIRMIERS, 'Partout où il recrute')).toHaveAttribute('aria-pressed', 'true');
  await expect(caseNiveau(page, INFIRMIERS, '25 %')).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=V1X80:tous');
  await voirListe(page);
  await expect(listeCommunes(page)).toContainText('5 communes passent tes critères');
  expect(await nomsScores(page)).toEqual(DEPART);
  await ficheDeCarte(page, 'F', 'Rhinval (67)');
  expect(await texteFiche(page)).toContain('Infirmiers et sages-femmes : Rhinval, sur place, bassin où ce métier recrute · 66 recrutements prévus en 2026');
  expect((await raisons(page)).filter((r) => r.startsWith(`${INFIRMIERS} :`))).toEqual([]);
  expect(await texteFiche(page)).not.toContain(`${INFIRMIERS} : aucun bassin`);
});

test('AC-6 /?loyer=1200&metier=V1X80:25,U1X82, « 10 % » des graphistes : /?loyer=1200&metier=V1X80:25,U1X82:10, Terrebasse 65 seule ; fiche de Portmer : raison des graphistes (Montcher, 85 km), aucune des infirmiers, ligne des infirmiers à Grandeville, 25 km', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&metier=V1X80:25,U1X82');
  await cocher(page, GRAPHISTES, '10 %');
  await expect(caseNiveau(page, GRAPHISTES, '10 %')).toHaveAttribute('aria-pressed', 'true');
  await expect(caseNiveau(page, INFIRMIERS, '25 %')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=V1X80:25,U1X82:10');
  await voirListe(page);
  await expect(listeCommunes(page)).toContainText('1 commune passe tes critères');
  expect(await nomsScores(page)).toEqual(['Terrebasse (23) · 65']);

  await ficheDeCarte(page, 'A', 'Portmer (17)');
  const r = await raisons(page);
  expect(r).toContain(raisonNiveau(GRAPHISTES, '10', 'Montcher, 85 km'));
  expect(r.filter((t) => t.startsWith(`${INFIRMIERS} :`))).toEqual([]);
  expect(await texteFiche(page)).toContain('Infirmiers et sages-femmes : Grandeville, à 25 km, parmi les 25 % de bassins qui recrutent le plus · 626 recrutements prévus en 2026');
});

test('AC-7 /?loyer=aucun&metier=V1X80, « 10 % » : page « sans plafond », Montcher et Terrebasse en couleur neutre, A B E F non colorées ; /?loyer=aucun&metier=V1X80:10', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=aucun&metier=V1X80');
  await cocher(page, INFIRMIERS, '10 %');
  await expect.poll(() => adresse(page)).toBe('/?loyer=aucun&metier=V1X80:10');
  await apresRendu(page);
  await attendreCouleurs<Six>(page, { C: 'area-unranked', D: 'area-unranked', A: null, B: null, E: null, F: null }, { jeu: SIX });
  await voirListe(page);
  await expect(listeCommunes(page)).toContainText('Fixe un loyer ou une distance à la mer pour classer les communes.');
  await expect(listeCommunes(page).getByRole('button')).toHaveCount(0);
});

test('AC-9 /?loyer=1200&metier=U1X82 : fiches de Grandeville (pas de chiffre publié) et Montcher (1 027) ; « Partout où il recrute » : /?loyer=1200&metier=U1X82:tous, Terrebasse 65 seule ; fiche de Rhinval : pas de chiffre, raison (Montcher, 160 km), « Chômage : inconnu »', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&metier=U1X82');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=U1X82');
  await ficheDeCarte(page, 'B', 'Grandeville (33)');
  expect(await texteFiche(page)).toContain(`${GRAPHISTES} : bassin de Grandeville, pas de chiffre publié pour ce métier`);
  await ficheDeCarte(page, 'C', 'Montcher (75)');
  expect(await texteFiche(page)).toContain(`${GRAPHISTES} : bassin de Montcher, 1 027 recrutements prévus en 2026`);

  await cocher(page, GRAPHISTES, 'Partout où il recrute');
  await expect(caseNiveau(page, GRAPHISTES, 'Partout où il recrute')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=U1X82:tous');
  await voirListe(page);
  await expect(listeCommunes(page)).toContainText('1 commune passe tes critères');
  expect(await nomsScores(page)).toEqual(['Terrebasse (23) · 65']);
  await ficheDeCarte(page, 'F', 'Rhinval (67)');
  const t = await texteFiche(page);
  expect(t).toContain(`${GRAPHISTES} : bassin de Rhinval, pas de chiffre publié pour ce métier`);
  expect(await raisons(page)).toContain(`${GRAPHISTES} : aucun bassin où ce métier recrute dans un rayon de 30 km (le plus proche : Montcher, 160 km)`);
  expect(t).toContain('Chômage : inconnu');
});

test('AC-11 trois adresses réécrites (R48) : /?loyer=1200&metier=V1X80:10,U1X82 avec « 10 % » cochée pour les infirmiers, rien pour les graphistes ; /?loyer=1200&metier=V1X80:10 ; /?loyer=1200&mairie=gauche&metier=V2X90:tous', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&metier=V1X80:10,ZZ999:25,U1X82:50,V2X90');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=V1X80:10,U1X82');
  await voirCriteres(page);
  await expect(caseNiveau(page, INFIRMIERS, '10 %')).toHaveAttribute('aria-pressed', 'true');
  expect(await niveaux(page, INFIRMIERS).getByRole('button', { pressed: true }).count()).toBe(1);
  for (const b of await niveaux(page, GRAPHISTES).getByRole('button').all()) await expect(b).toHaveAttribute('aria-pressed', 'false');
  await expect(tousNiveaux(page)).toHaveCount(2);

  await ouvrirSix(page, '/?loyer=1200&metier=V1X80:10,V1X80:25');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=V1X80:10');

  await ouvrirSix(page, '/?metier=V2X90:tous&mairie=gauche&loyer=1200');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&mairie=gauche&metier=V2X90:tous');
});

// ---------------------------------------------------------------------------------------------------------------------
// Tâche 4 : le second métier (R44, état « ajout en cours », H145) ; au téléphone, « Ton métier » et « Second métier »
// suivent la règle du champ d'adresse des proches (R20 d'interface-telephone) ; H48 à 375 × 548.

const champSecond = (page: Page) => page.getByRole('combobox', { name: 'Second métier' });

test('AC-3 /?loyer=1200&metier=V1X80, « + Ajouter un second métier » : « infirm » → « Aucun métier trouvé » ; « graph » choisi : /?loyer=1200&metier=V1X80,U1X82, deux métiers et leurs 3 pastilles, plus de lien ; repliée « 2 métiers » ; « Retirer » les infirmiers : /?loyer=1200&metier=U1X82, les graphistes seuls, le lien revient', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&metier=V1X80');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=V1X80');
  await voirCriteres(page);
  await lienSecond(page).click();
  await expect(champSecond(page)).toBeFocused();
  await champSecond(page).fill('infirm');
  await expect(aucunMetier(page)).toBeVisible();
  await expect(suggestions(page)).toHaveCount(0);
  await champSecond(page).fill('');
  await champSecond(page).fill('graph');
  await expect(suggestions(page)).toHaveText([GRAPHISTES]);
  await suggestions(page).first().click();
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=V1X80,U1X82');
  await expect(tousNiveaux(page)).toHaveCount(2);
  for (const l of [INFIRMIERS, GRAPHISTES]) expect(await textesNiveaux(page, l)).toEqual(['10 %', '25 %', 'Partout où il recrute']);
  await expect(lienSecond(page)).toHaveCount(0);
  await expect(champSecond(page)).toHaveCount(0);

  await titreEmploi(page).click();
  await expect(titreEmploi(page)).toHaveAttribute('aria-expanded', 'false');
  expect(nbsp(await titreEmploi(page).textContent())).toBe('Emploi2 métiers');
  await titreEmploi(page).click();
  await expect(titreEmploi(page)).toHaveAttribute('aria-expanded', 'true');

  await retirer(page, INFIRMIERS).click();
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=U1X82');
  await expect(tousNiveaux(page)).toHaveCount(1);
  await expect(metierChoisi(page, GRAPHISTES)).toBeVisible();
  await expect(retirer(page, INFIRMIERS)).toHaveCount(0);
  await expect(lienSecond(page)).toBeVisible();
});

// Hors AC (état « ajout en cours » de details.md, H145) : le champ s'ouvre sous le premier métier, avec le focus ; Échap le
// referme et le vide, le focus revient au lien ; quitté avec du texte, il reste ouvert avec son texte ; un choix au clavier.
test('« Second métier » : sous le premier métier, avec le focus ; Échap le referme et le vide (focus au lien) ; quitté avec du texte, il reste ouvert avec son texte ; Entrée choisit', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&metier=V1X80:10');
  await voirCriteres(page);
  await lienSecond(page).click();
  await expect(champSecond(page)).toBeFocused();
  await expect(champSecond(page)).toHaveValue('');
  await expect(lienSecond(page)).toHaveCount(0);
  expect(await y(champSecond(page))).toBeGreaterThan(await y(niveaux(page, INFIRMIERS)));
  expect(await y(champSecond(page))).toBeLessThan(await y(reglages(page).getByText(ETAT, { exact: true })));

  await page.keyboard.type('med');
  await expect(suggestions(page)).toHaveText(['Médecins']);
  await page.keyboard.press('Escape');
  await expect(champSecond(page)).toHaveCount(0);
  await expect(lienSecond(page)).toBeFocused();
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=V1X80:10');

  await page.keyboard.press('Enter'); // le lien a le focus : il rouvre le champ, vide
  await expect(champSecond(page)).toBeFocused();
  await expect(champSecond(page)).toHaveValue('');
  await page.keyboard.type('graph');
  await page.keyboard.press('Tab');
  await expect(champSecond(page)).not.toBeFocused();
  await expect(champSecond(page)).toBeVisible();
  await expect(champSecond(page)).toHaveValue('graph');
  await titreEmploi(page).click();
  await titreEmploi(page).click();
  await expect(champSecond(page)).toHaveValue('graph');

  await champSecond(page).focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=V1X80:10,U1X82');
  await expect(caseNiveau(page, GRAPHISTES, '10 %')).toBeFocused();
  await expect(caseNiveau(page, INFIRMIERS, '10 %')).toHaveAttribute('aria-pressed', 'true');
});

// Au toucher (H41 d'interface-telephone), même relevé que tests/e2e/proches-clavier-iphone.spec.ts : la place du champ au
// tout début du focus, par un écouteur `focusin` en capture sur `window` posé avant le chargement de la page (avant le code
// de la page, là où Safari la lit). Ligne du clavier de l'iPhone de Vincent dans une fenêtre de 390 × 664 : y = 342.
const CLAVIER_IPHONE = 342;
const POIGNEE = space['space-2'] + size['taille-rail'] + space['space-2'];
type Boite = { top: number; bottom: number };
declare global {
  interface Window {
    __metierAuFocus?: Record<string, Boite>;
  }
}
async function releverAuFocus(page: Page) {
  await page.addInitScript(() => {
    window.__metierAuFocus = {};
    addEventListener(
      'focusin',
      (e) => {
        const el = e.target as HTMLInputElement;
        const nom = el.labels?.[0]?.textContent?.trim();
        if (nom !== 'Ton métier' && nom !== 'Second métier') return;
        const r = el.getBoundingClientRect();
        window.__metierAuFocus![nom] = { top: r.top, bottom: r.bottom };
      },
      true,
    );
  });
}
const auFocus = (page: Page, nom: 'Ton métier' | 'Second métier') => page.evaluate((n) => window.__metierAuFocus?.[n], nom);
/** Oublie les places relevées jusqu'ici (avant le geste dont on mesure le focus). */
const oublierReleve = (page: Page) => page.evaluate(() => (window.__metierAuFocus = {}));
const deuxImages = (page: Page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 100)))));
/** R20 : au début du focus, le champ est déjà sous la poignée de la feuille montée, au-dessus du clavier ; il ne bouge plus. */
async function placeAuFocus(page: Page, nom: 'Ton métier' | 'Second métier') {
  const champ = page.getByRole('combobox', { name: nom });
  await expect(champ).toBeFocused();
  const b = await auFocus(page, nom);
  expect(b, `place de « ${nom} » au début du focus`).toBeDefined();
  expect(b!.top).toBeGreaterThanOrEqual(size['taille-bande-carte'] + POIGNEE);
  expect(b!.bottom).toBeLessThanOrEqual(CLAVIER_IPHONE);
  await deuxImages(page);
  expect(Math.abs((await champ.boundingBox())!.y - b!.top)).toBeLessThanOrEqual(1);
  return b!;
}

test.describe('390 × 844 au toucher', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('AC-13 / à 390 × 844, « Critères » : toucher « Ton métier », « infirm », la suggestion visible sous le champ et touchée, « 10 % » ; « Les 10 premières » : 1 commune, Terrebasse 65 ; /?loyer=1200&metier=V1X80:10', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'fenêtre de téléphone fixée par le test');
    await releverAuFocus(page);
    await ouvrirSix(page);
    await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
    await expect(onglet(page, 'Critères')).toHaveAttribute('aria-selected', 'true');
    // Comme Vincent : faire défiler « Critères » jusqu'à voir le champ en bas de l'écran, puis le toucher.
    await amenerEnBas(champMetier(page));
    await oublierReleve(page);
    await champMetier(page).tap();
    const auDebut = await placeAuFocus(page, 'Ton métier');

    await champMetier(page).pressSequentially('infirm');
    await expect(suggestions(page)).toHaveText([INFIRMIERS]);
    await deuxImages(page);
    const champ = (await champMetier(page).boundingBox())!;
    expect(Math.abs(champ.y - auDebut.top)).toBeLessThanOrEqual(1);
    const s = (await suggestions(page).first().boundingBox())!;
    expect(s.y).toBeGreaterThanOrEqual(champ.y + champ.height);
    expect(s.y + s.height).toBeLessThanOrEqual(CLAVIER_IPHONE);

    await suggestions(page).first().tap();
    await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=V1X80');
    await expect(metierChoisi(page, INFIRMIERS)).toBeVisible();
    await caseNiveau(page, INFIRMIERS, '10 %').tap();
    await expect(caseNiveau(page, INFIRMIERS, '10 %')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=V1X80:10');

    await onglet(page, 'Les 10 premières').tap();
    await expect(listeCommunes(page)).toContainText('1 commune passe tes critères');
    expect(await nomsScores(page)).toEqual(['Terrebasse (23) · 65']);
    await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=V1X80:10');
  });
});

// Hors AC (R20 d'interface-telephone, fenêtre de Safari sur l'iPhone de Vincent) : chaque chemin qui donne le focus à un
// champ de métier (toucher du champ, « + Ajouter un second métier », « Retirer » du dernier métier) monte et place la
// feuille d'abord ; le champ ne bouge plus pendant la saisie ; la suggestion reste au-dessus du clavier.
test.describe('390 × 664 au toucher (fenêtre de Safari)', () => {
  test.use({ viewport: { width: 390, height: 664 }, hasTouch: true });

  test('« + Ajouter un second métier » touché : au début du focus, « Second métier » est déjà sous la poignée, au-dessus du clavier ; la suggestion aussi ; choisie, la feuille redescend', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'fenêtre de téléphone fixée par le test');
    await releverAuFocus(page);
    await ouvrirSix(page, '/?loyer=1200&metier=V1X80:10');
    await amenerEnBas(lienSecond(page));
    await oublierReleve(page);
    await lienSecond(page).tap();
    const b = await placeAuFocus(page, 'Second métier');
    await expect(page.getByRole('tablist')).toBeHidden(); // feuille montée : la poignée seule au-dessus du champ
    await champSecond(page).pressSequentially('graph');
    await expect(suggestions(page)).toHaveText([GRAPHISTES]);
    await deuxImages(page);
    expect(Math.abs((await champSecond(page).boundingBox())!.y - b.top)).toBeLessThanOrEqual(1);
    const s = (await suggestions(page).first().boundingBox())!;
    expect(s.y + s.height).toBeLessThanOrEqual(CLAVIER_IPHONE);
    await suggestions(page).first().tap();
    await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=V1X80:10,U1X82');
    await expect(page.getByRole('tablist')).toBeVisible();
    await expect(caseNiveau(page, GRAPHISTES, '10 %')).toBeFocused();
    await expect(caseNiveau(page, GRAPHISTES, '10 %')).toBeInViewport({ ratio: 1 });
  });

  test('« Ton métier » touché, puis « Retirer » du dernier métier : chaque fois, au début du focus, le champ est déjà sous la poignée, au-dessus du clavier, et ne bouge plus', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'fenêtre de téléphone fixée par le test');
    await releverAuFocus(page);
    await ouvrirSix(page);
    await amenerEnBas(champMetier(page));
    await oublierReleve(page);
    await champMetier(page).tap();
    await placeAuFocus(page, 'Ton métier');
    await champMetier(page).pressSequentially('graph');
    await suggestions(page).first().tap();
    await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=U1X82');
    await expect(page.getByRole('tablist')).toBeVisible();

    await oublierReleve(page);
    await retirer(page, GRAPHISTES).tap();
    await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
    await placeAuFocus(page, 'Ton métier');
  });
});

// Hors AC (H48 d'interface-telephone) : la catégorie « Emploi » ne pousse pas le curseur du prix hors de la feuille sur le
// plus petit écran visé.
test('375 × 548 : à l’ouverture, « Loyer maximum » entièrement visible dans la feuille ; « Emploi » plus bas dans l’onglet', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'fenêtre de téléphone fixée par le test');
  await page.setViewportSize({ width: 375, height: 548 });
  await ouvrirSix(page);
  const f = (await page.getByTestId('feuille').boundingBox())!;
  const curseur = (await page.getByRole('slider', { name: 'Loyer maximum' }).boundingBox())!;
  expect(curseur.y).toBeGreaterThanOrEqual(f.y);
  expect(curseur.y + curseur.height).toBeLessThanOrEqual(548);
  expect((await titreEmploi(page).boundingBox())!.y).toBeGreaterThan(curseur.y);
});

// Tâche 2, suite.
// Hors AC (design F, decisions.md d'emploi) : le libellé du métier en `texte-fort`, le reste de la ligne et le chômage
// dans le style des autres lignes de la fiche ; espaces insécables dans les nombres, avant « % » et dans le trimestre.
test('design F : libellé du métier en gras, reste de la ligne et chômage au style de la ligne « Mairie » ; espaces insécables', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&metier=V1X80:10');
  await ficheDeCarte(page, 'D', 'Terrebasse (23)');
  const style = (l: ReturnType<Page['getByText']>) => l.evaluate((e) => ['font-size', 'font-weight', 'color'].map((p) => getComputedStyle(e).getPropertyValue(p)));
  const mairie = fiche(page).getByText(/^Mairie : /);
  // Insécable entre le libellé et « : » (un libellé long ne laisse pas les deux-points seuls en début de ligne).
  const ligne = fiche(page).getByText(/^Infirmiers et sages-femmes : Montcher/);
  const libelle = ligne.getByText('Infirmiers et sages-femmes', { exact: true });
  const chomage = fiche(page).getByText(/^Chômage : /);
  expect(await style(ligne)).toEqual(await style(mairie));
  expect(await style(chomage)).toEqual(await style(mairie));
  expect(Number((await style(libelle))[1])).toBeGreaterThan(Number((await style(mairie))[1]));
  expect(await ligne.textContent()).toContain('1 680 recrutements');
  expect(await chomage.textContent()).toBe("Chômage : 7,1 % dans la zone d'emploi de Grandeville (2e trimestre 2026)");
});
