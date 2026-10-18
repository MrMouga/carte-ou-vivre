import { expect, test, type Page } from '@playwright/test';
import cadreDeVie from '../../docs/specs/2026-10-14-cadre-de-vie/acceptance.json' with { type: 'json' };
import { attendreCouleurs, ouvrir, vue, type Jeu } from './lib/carte';
import { voirListe } from './lib/feuille';

// Tranche mairies, tâche 1 : le filtre de mairie (R38), de bout en bout par l'adresse (R41), sur la fixture « 6 communes »
// de cadre-de-vie étendue par celle de mairies (mairies et nuances servies par tests/e2e/lib/carte.ts, par code INSEE).
const SIX: Jeu = { items: cadreDeVie.fixture.items, tuiles: new URL('../fixtures/tuiles-immobilier/', import.meta.url) };
type Six = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

const nbsp = (t: string | null) => (t ?? '').replace(/ /g, ' ');
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
