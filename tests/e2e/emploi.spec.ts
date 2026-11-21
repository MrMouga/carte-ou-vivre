import { expect, test, type Page } from '@playwright/test';
import cadreDeVie from '../../docs/specs/2026-10-14-cadre-de-vie/acceptance.json' with { type: 'json' };
import { ouvrir, servirFixture, vue, type Jeu } from './lib/carte';
import { mobile, voirCriteres, voirListe } from './lib/feuille';

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
  expect((await niveaux(page, INFIRMIERS).getByRole('button').allInnerTexts()).map((t) => nbsp(t).trim())).toEqual(['10 %', '25 %', 'Partout où il recrute']);
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
  const aucun = reglages(page).getByText('Aucun métier trouvé', { exact: true });
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
  const y = async (l: ReturnType<Page['getByText']>) => (await l.boundingBox())!.y;
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
  await expect(metierChoisi(page, INGENIEURS).getByText(INDICE, { exact: true })).toBeVisible();
  await expect(niveaux(page, INGENIEURS)).toHaveAccessibleDescription(`${PEU_CHIFFRE} ${INDICE}`);
  await page.keyboard.press('Space');
  await expect(caseNiveau(page, INGENIEURS, '10 %')).toHaveAttribute('aria-pressed', 'true');
  await expect(metierChoisi(page, INGENIEURS).getByText(INDICE, { exact: true })).toHaveCount(0);
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
  await expect(metierChoisi(page, INFIRMIERS).getByText(INDICE, { exact: true })).toHaveCount(0);
  await expect(metierChoisi(page, GRAPHISTES).getByText(INDICE, { exact: true })).toBeVisible();
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
