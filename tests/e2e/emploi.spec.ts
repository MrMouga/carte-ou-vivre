import { expect, test, type Page } from '@playwright/test';
import cadreDeVie from '../../docs/specs/2026-10-14-cadre-de-vie/acceptance.json' with { type: 'json' };
import { ouvrir, vue, type Jeu } from './lib/carte';

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
