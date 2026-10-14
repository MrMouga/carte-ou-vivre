import { expect, test, type Page } from '@playwright/test';
import immobilier from '../../docs/specs/2026-10-14-immobilier/acceptance.json' with { type: 'json' };
import { apresRendu, attendreCouleurs, ouvrir, vue, type Jeu } from './lib/carte';
import { mobile, voirCriteres, voirListe } from './lib/feuille';
import { servirIgn } from './lib/ign';
import { ajouter, pret } from './lib/proches';

// Tranche immobilier, tâches 2 à 4 : le réglage du prix, appartement ou maison, communes sans prix (R21 à R26), sur la fixture « 6 communes »
// (A à F, acceptance.json d'immobilier ; tuiles : python3 scripts/data/tuiles.py --fixture).
const SIX: Jeu = { items: immobilier.fixture.items, tuiles: new URL('../fixtures/tuiles-immobilier/', import.meta.url) };
type Six = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

const nbsp = (t: string | null) => (t ?? '').replace(/ /g, ' ');
/** Les montants s'écrivent avec des espaces insécables (H3) : « 1 200 € ». */
const ins = (t: string) => t.replace(/ /g, ' ');
const adresse = (page: Page) => new URL(page.url()).pathname + new URL(page.url()).search;
const reglages = (page: Page) => page.getByRole('region', { name: 'Réglages' });
const liste = (page: Page) => page.getByRole('region', { name: 'Les 10 premières' });
const lignes = async (page: Page) => (await liste(page).getByRole('button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))).map(nbsp);
const ligne = (page: Page, nom: string) => liste(page).getByRole('button', { name: new RegExp(nom) });
const fiche = (page: Page) => page.getByRole('region', { name: /\(\d+\)$/ });
const texteFiche = async (page: Page) => nbsp(await fiche(page).innerText());
const choix = (page: Page, groupe: string, nom: string) => page.getByRole('group', { name: groupe }).getByRole('button', { name: nom, exact: true });
const curseur = (page: Page) => page.getByRole('slider', { name: /^(Loyer mensuel|Prix d'achat)/ });
const surface = (page: Page) => page.getByRole('textbox', { name: 'Surface en m²' });
/** Valeur affichée du plafond, à droite du libellé du curseur. */
const plafond = (page: Page, texte: string) => reglages(page).getByText(ins(texte), { exact: true });

async function ouvrirSix(page: Page, chemin = '/') {
  await ouvrir(page, chemin, { jeu: SIX });
}
/** Touche une bascule du réglage du prix (390 px : dans l'onglet « Critères »). */
async function basculer(page: Page, groupe: string, nom: string) {
  await choix(page, groupe, nom).click();
  await apresRendu(page);
}
/** Ouvre la fiche d'une commune de la liste. */
async function ficheDeListe(page: Page, nom: string) {
  await voirListe(page);
  await ligne(page, nom).click();
  await expect(fiche(page)).toContainText(nom);
}
/** Ouvre la fiche d'une commune sur la carte, à l'ouverture (vue de départ de la fixture). */
async function ficheDeCarte(page: Page, id: Six, nom: string) {
  const { centre } = vue(page, SIX);
  await page.mouse.click(centre(id).x, centre(id).y);
  await expect(fiche(page)).toContainText(nom);
}
/** Ferme la fiche et revient aux réglages. */
async function fermerFiche(page: Page) {
  await page.getByRole('button', { name: '← Les 10 premières' }).click();
  await voirCriteres(page);
}

test('AC-1 ouverture de / : Appartement, Louer, Total, 52 m², 1 200 € ; adresse /?loyer=1200&mer=60 ; A 72, E 49, B 32 ; C, D, F non colorées', async ({ page }) => {
  await ouvrirSix(page);
  await expect(choix(page, 'Type de logement', 'Appartement')).toHaveAttribute('aria-pressed', 'true');
  await expect(choix(page, 'Louer ou acheter', 'Louer')).toHaveAttribute('aria-pressed', 'true');
  await expect(choix(page, 'Unité du prix', 'Total')).toHaveAttribute('aria-pressed', 'true');
  await expect(surface(page)).toHaveValue('52');
  await expect(plafond(page, '1 200 €')).toBeVisible();
  expect(adresse(page)).toBe('/?loyer=1200&mer=60');
  await attendreCouleurs<Six>(page, { A: 'score-4', E: 'score-3', B: 'score-2', C: null, D: null, F: null }, { jeu: SIX });
  await voirListe(page);
  expect(await lignes(page)).toEqual([
    "1 · Portmer (17) · 72 · 650 € · moins d'1 km",
    '2 · Quaibleu (13) · 49 · 1 092 € · 7 km',
    '3 · Grandeville (33) · 32 · 832 € · 40 km',
  ]);
});

test('AC-2 surface à 72 m² : adresse surface=72 ; Portmer 62 · 900 €, Grandeville 19 · 1 152 € ; fiches de Grandeville et de Quaibleu', async ({ page }) => {
  await ouvrirSix(page);
  await surface(page).fill('72');
  await apresRendu(page);
  expect(adresse(page)).toBe('/?loyer=1200&mer=60&surface=72');
  await ficheDeCarte(page, 'E', 'Quaibleu (13)');
  expect(await texteFiche(page)).toContain('Loyer 1 512 € : au-dessus de ton plafond de 1 200 €');
  await page.getByRole('button', { name: '← Les 10 premières' }).click();
  await voirListe(page);
  await expect(liste(page)).toContainText('2 communes passent tes critères');
  expect(await lignes(page)).toEqual(["1 · Portmer (17) · 62 · 900 € · moins d'1 km", '2 · Grandeville (33) · 19 · 1 152 € · 40 km']);
  await ficheDeListe(page, 'Grandeville');
  expect(await texteFiche(page)).toContain('1 152 € par mois pour 72 m² (16,0 €/m²)');
});

test('AC-4 Au m² puis Total : « Loyer mensuel » 23 €/m², sans champ surface, unite=m2, liste au m², fiche « 16,0 €/m² par mois » ; retour à 1 200 €, 52 m²', async ({ page }) => {
  await ouvrirSix(page);
  await basculer(page, 'Unité du prix', 'Au m²');
  await expect(reglages(page).getByText('Loyer mensuel', { exact: true })).toBeVisible();
  await expect(plafond(page, '23 €/m²')).toBeVisible();
  await expect(surface(page)).toHaveCount(0);
  expect(adresse(page)).toBe('/?loyer=23&mer=60&unite=m2');
  await voirListe(page);
  expect(await lignes(page)).toEqual([
    "1 · Portmer (17) · 72 · 12,5 €/m² · moins d'1 km",
    '2 · Quaibleu (13) · 49 · 21,0 €/m² · 7 km',
    '3 · Grandeville (33) · 32 · 16,0 €/m² · 40 km',
  ]);
  await ficheDeListe(page, 'Grandeville');
  expect(await texteFiche(page)).toContain('16,0 €/m² par mois');
  await fermerFiche(page);

  await basculer(page, 'Unité du prix', 'Total');
  await expect(plafond(page, '1 200 €')).toBeVisible();
  await expect(surface(page)).toHaveValue('52');
  expect(adresse(page)).toBe('/?loyer=1200&mer=60');
});

test('AC-5 Acheter puis Louer : Au m², 5 000 €/m², /?achat=5000&mer=60, Portmer 61, Quaibleu 46, Grandeville 23 ; retour à Total, 52 m², 1 200 €', async ({ page }) => {
  await ouvrirSix(page);
  await basculer(page, 'Louer ou acheter', 'Acheter');
  await expect(choix(page, 'Unité du prix', 'Au m²')).toHaveAttribute('aria-pressed', 'true');
  await expect(plafond(page, '5 000 €/m²')).toBeVisible();
  await expect(surface(page)).toHaveCount(0);
  expect(adresse(page)).toBe('/?achat=5000&mer=60');
  await voirListe(page);
  await expect(liste(page)).toContainText('3 communes passent tes critères');
  expect(await lignes(page)).toEqual([
    "1 · Portmer (17) · 61 · 3 800 €/m² · moins d'1 km",
    '2 · Quaibleu (13) · 46 · 4 800 €/m² · 7 km',
    '3 · Grandeville (33) · 23 · 4 400 €/m² · 40 km',
  ]);
  await ficheDeListe(page, 'Grandeville');
  const t = await texteFiche(page);
  expect(t).toContain("4 400 €/m² à l'achat");
  expect(t).not.toContain('Estimation du secteur');
  await fermerFiche(page);

  await basculer(page, 'Louer ou acheter', 'Louer');
  await expect(choix(page, 'Unité du prix', 'Total')).toHaveAttribute('aria-pressed', 'true');
  await expect(surface(page)).toHaveValue('52');
  await expect(plafond(page, '1 200 €')).toBeVisible();
  expect(adresse(page)).toBe('/?loyer=1200&mer=60');
});

test('AC-6 Total depuis /?achat=5000&mer=60 : 260 000 €, 52 m², unite=total ; Portmer 198 000 €, Quaibleu 250 000 €, Grandeville 229 000 €', async ({ page }) => {
  await ouvrirSix(page, '/?achat=5000&mer=60');
  await basculer(page, 'Unité du prix', 'Total');
  await expect(plafond(page, '260 000 €')).toBeVisible();
  await expect(surface(page)).toHaveValue('52');
  expect(adresse(page)).toBe('/?achat=260000&mer=60&unite=total');
  await voirListe(page);
  await expect(liste(page)).toContainText('3 communes passent tes critères');
  expect(await lignes(page)).toEqual([
    "1 · Portmer (17) · 61 · 198 000 € · moins d'1 km",
    '2 · Quaibleu (13) · 46 · 250 000 € · 7 km',
    '3 · Grandeville (33) · 23 · 229 000 € · 40 km',
  ]);
  await ficheDeListe(page, 'Grandeville');
  expect(await texteFiche(page)).toContain('229 000 € pour 52 m² (4 400 €/m²)');
});

test('AC-11 /?achat=abc&unite=litre&bien=villa&surface=0 : Appartement, Acheter, Au m², 5 000 €/m² ; adresse /?achat=5000&mer=60 ; Portmer 61, Quaibleu 46, Grandeville 23', async ({ page }) => {
  await ouvrirSix(page, '/?achat=abc&unite=litre&bien=villa&surface=0');
  await expect(choix(page, 'Type de logement', 'Appartement')).toHaveAttribute('aria-pressed', 'true');
  await expect(choix(page, 'Louer ou acheter', 'Acheter')).toHaveAttribute('aria-pressed', 'true');
  await expect(choix(page, 'Unité du prix', 'Au m²')).toHaveAttribute('aria-pressed', 'true');
  await expect(plafond(page, '5 000 €/m²')).toBeVisible();
  expect(adresse(page)).toBe('/?achat=5000&mer=60');
  await voirListe(page);
  await expect(liste(page)).toContainText('3 communes passent tes critères');
  const l = await lignes(page);
  expect(l.map((t) => t.split(' · ').slice(1, 3).join(' · '))).toEqual(['Portmer (17) · 61', 'Quaibleu (13) · 46', 'Grandeville (33) · 23']);
});

test('AC-12 pied de page : « Prix d’achat : Demandes de valeurs foncières (DGFiP) » à côté des mentions de loyer-mer, avant et après Acheter', async ({ page }) => {
  await ouvrirSix(page);
  const pied = page.getByRole('contentinfo');
  for (const t of ["Prix d'achat : Demandes de valeurs foncières (DGFiP)", 'Estimations ANIL, à partir des données du Groupe SeLoger et de leboncoin'])
    await expect(pied).toContainText(t);
  await basculer(page, 'Louer ou acheter', 'Acheter');
  await expect(pied).toContainText("Prix d'achat : Demandes de valeurs foncières (DGFiP)");
  await expect(pied).toContainText('Estimations ANIL, à partir des données du Groupe SeLoger et de leboncoin');
});

// ---------------------------------------------------------------------------------------------------------------------
// Tâche 3 : Appartement ou maison (R21, R24, D2).

test('AC-3 Maison depuis /?loyer=1200&mer=60&surface=72 : 72 m² et 1 200 € gardés ; Portmer 68 · 756 €, Grandeville 28 · 936 € ; fiches de Portmer et de Quaibleu', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&mer=60&surface=72');
  await basculer(page, 'Type de logement', 'Maison');
  await expect(choix(page, 'Type de logement', 'Maison')).toHaveAttribute('aria-pressed', 'true');
  await expect(surface(page)).toHaveValue('72');
  await expect(plafond(page, '1 200 €')).toBeVisible();
  expect(adresse(page)).toBe('/?loyer=1200&mer=60&bien=maison&surface=72');
  await ficheDeCarte(page, 'E', 'Quaibleu (13)');
  expect(await texteFiche(page)).toContain('Loyer 1 224 € : au-dessus de ton plafond de 1 200 €');
  await page.getByRole('button', { name: '← Les 10 premières' }).click();
  await voirListe(page);
  await expect(liste(page)).toContainText('2 communes passent tes critères');
  expect(await lignes(page)).toEqual(["1 · Portmer (17) · 68 · 756 € · moins d'1 km", '2 · Grandeville (33) · 28 · 936 € · 40 km']);
  await ficheDeListe(page, 'Portmer');
  const t = await texteFiche(page);
  expect(t).toContain('756 € par mois pour 72 m² (10,5 €/m²)');
  expect(t).toContain('Estimation du secteur (communes voisines)');
});

test('AC-7 Maison depuis /?achat=5000&mer=60 : adresse bien=maison&surface=52 ; Portmer 64 · 3 500 €/m², Quaibleu 48 · 4 600 €/m² ; fiches de Portmer et de Grandeville', async ({ page }) => {
  await ouvrirSix(page, '/?achat=5000&mer=60');
  await basculer(page, 'Type de logement', 'Maison');
  await expect(choix(page, 'Type de logement', 'Maison')).toHaveAttribute('aria-pressed', 'true');
  await expect(plafond(page, '5 000 €/m²')).toBeVisible();
  expect(adresse(page)).toBe('/?achat=5000&mer=60&bien=maison&surface=52');
  await ficheDeCarte(page, 'B', 'Grandeville (33)');
  expect(await texteFiche(page)).toContain('Achat 5 100 €/m² : au-dessus de ton plafond de 5 000 €/m²');
  await page.getByRole('button', { name: '← Les 10 premières' }).click();
  await voirListe(page);
  await expect(liste(page)).toContainText('2 communes passent tes critères');
  expect(await lignes(page)).toEqual(["1 · Portmer (17) · 64 · 3 500 €/m² · moins d'1 km", '2 · Quaibleu (13) · 48 · 4 600 €/m² · 7 km']);
  await ficheDeListe(page, 'Portmer');
  const t = await texteFiche(page);
  expect(t).toContain("3 500 €/m² à l'achat");
  expect(t).toContain('Estimation du secteur (moins de 5 ventes dans la commune)');
});

test('D2 : /?loyer=1200&mer=60&bien=maison s’ouvre en Maison à 92 m², adresse gardée ; retour à Appartement : 92 m² gardés, surface=92', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&mer=60&bien=maison');
  await expect(choix(page, 'Type de logement', 'Maison')).toHaveAttribute('aria-pressed', 'true');
  await expect(surface(page)).toHaveValue('92');
  expect(adresse(page)).toBe('/?loyer=1200&mer=60&bien=maison');
  await basculer(page, 'Type de logement', 'Appartement');
  await expect(surface(page)).toHaveValue('92');
  await expect(plafond(page, '1 200 €')).toBeVisible();
  expect(adresse(page)).toBe('/?loyer=1200&mer=60&surface=92');
});

test('R21 : « Sans limite » le reste quand on change de bien', async ({ page }) => {
  await ouvrirSix(page, '/?achat=aucun&mer=60');
  await expect(plafond(page, 'Sans limite')).toBeVisible();
  await basculer(page, 'Type de logement', 'Maison');
  await expect(plafond(page, 'Sans limite')).toBeVisible();
  expect(adresse(page)).toBe('/?achat=aucun&mer=60&bien=maison&surface=52');
});

// ---------------------------------------------------------------------------------------------------------------------
// Hors AC (H56, H65, H58, design F).

test('H65 : noms lus du curseur dans les quatre réglages, et du champ « Surface en m² » ; groupes nommés', async ({ page }) => {
  await ouvrirSix(page);
  const nom = async (attendu: string) => {
    await expect(curseur(page)).toHaveCount(1);
    await expect(curseur(page)).toHaveAccessibleName(attendu);
  };
  await expect(surface(page)).toHaveAccessibleName('Surface en m²');
  for (const g of ['Louer ou acheter', 'Type de logement', 'Unité du prix']) await expect(page.getByRole('group', { name: g, exact: true })).toHaveCount(1);
  await nom('Loyer mensuel, loyer maximum'); // Louer · Total
  await expect(page.getByRole('slider', { name: 'Loyer maximum' })).toHaveCount(1); // le nom des tests des tranches précédentes
  await basculer(page, 'Unité du prix', 'Au m²');
  await nom('Loyer mensuel, loyer maximum au m²'); // Louer · Au m²
  await basculer(page, 'Louer ou acheter', 'Acheter');
  await nom("Prix d'achat, prix maximum au m²"); // Acheter · Au m²
  await expect(reglages(page).getByText("Prix d'achat", { exact: true })).toBeVisible();
  await basculer(page, 'Unité du prix', 'Total');
  await nom("Prix d'achat, prix maximum"); // Acheter · Total
});

test('surface en cours de saisie : champ vidé ou « 400 », la carte garde 52 m² ; en quittant le champ, il reprend la dernière surface valide', async ({ page }) => {
  await ouvrirSix(page);
  for (const t of ['', '400']) {
    await surface(page).fill(t);
    await apresRendu(page);
    await expect(surface(page)).toHaveValue(t);
    expect(adresse(page)).toBe('/?loyer=1200&mer=60');
    await expect(page.getByRole('status')).toHaveText('3 communes passent tes critères');
  }
  await surface(page).blur();
  await expect(surface(page)).toHaveValue('52');

  // Une frappe valide s'applique tout de suite ; vidé ensuite, le champ reprend cette surface en sortant.
  await surface(page).fill('72');
  await apresRendu(page);
  expect(adresse(page)).toBe('/?loyer=1200&mer=60&surface=72');
  await surface(page).fill('');
  await surface(page).blur();
  await expect(surface(page)).toHaveValue('72');
  expect(adresse(page)).toBe('/?loyer=1200&mer=60&surface=72');
});

test('cibles : bascules, tuiles, unité et champ surface de 44 px à 390 px, d’au moins 24 px en bureau (tuiles : 44 partout)', async ({ page }) => {
  await ouvrirSix(page);
  const attendu = mobile(page) ? 44 : 24;
  const hauteur = async (l: ReturnType<typeof choix>) => (await l.boundingBox())!.height;
  for (const [g, n] of [['Louer ou acheter', 'Louer'], ['Louer ou acheter', 'Acheter'], ['Unité du prix', 'Total'], ['Unité du prix', 'Au m²']])
    expect(await hauteur(choix(page, g, n)), n).toBeGreaterThanOrEqual(attendu);
  for (const n of ['Appartement', 'Maison']) expect(await hauteur(choix(page, 'Type de logement', n)), n).toBeGreaterThanOrEqual(44);
  const s = (await surface(page).boundingBox())!;
  expect(s.height).toBeGreaterThanOrEqual(attendu);
  expect(s.width).toBeGreaterThanOrEqual(44);
});

test('catégorie « Logement » repliée : résumé sous le titre, « 1 200 € » jamais coupé', async ({ page }) => {
  await ouvrirSix(page);
  const titre = page.getByRole('heading', { level: 2, name: /^Logement/ }).getByRole('button');
  await titre.click();
  await expect(titre).toHaveAttribute('aria-expanded', 'false');
  expect(nbsp(await titre.textContent())).toBe('LogementLouer · Appartement · 52 m² · 1 200 €');
  // Sous le titre, aligné à gauche, et le montant sur une seule ligne.
  const mesure = await titre.evaluate((b) => {
    const [t, r] = [...b.querySelectorAll('span > span')] as HTMLElement[];
    const noeud = r.firstChild as Text;
    const i = noeud.data.indexOf('1 200 €');
    const plage = document.createRange();
    plage.setStart(noeud, i);
    plage.setEnd(noeud, i + 7);
    const [bt, br] = [t.getBoundingClientRect(), r.getBoundingClientRect()];
    return { sous: br.top >= bt.bottom - 1, gauche: Math.abs(br.left - bt.left) < 1, lignes: new Set([...plage.getClientRects()].map((x) => Math.round(x.top))).size };
  });
  expect(mesure).toEqual({ sous: true, gauche: true, lignes: 1 });
});

test('titre « Où vivre en France » : lu par les lecteurs d’écran partout, affiché seulement en bureau', async ({ page }) => {
  await ouvrirSix(page);
  const h1 = page.getByRole('heading', { name: 'Où vivre en France' });
  await expect(h1).toHaveCount(1);
  const b = (await h1.boundingBox())!;
  if (mobile(page)) expect(b.height).toBeLessThanOrEqual(1);
  else expect(b.height).toBeGreaterThan(20);
});

// ---------------------------------------------------------------------------------------------------------------------
// Tâche 4 : les communes sans prix (R25, D6, D21 de loyer-mer). Une commune sans prix passe le filtre du prix ; sa note
// vient des autres critères ; sans autre note, couleur neutre (`area-unranked`, 70 %), hors de la liste et du compte.

/** Rouvre la même adresse : la carte revient à la vue d'ouverture, où l'on choisit une autre commune sur la carte. */
async function rouvrir(page: Page) {
  await page.goto(adresse(page));
  await expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
}
/** Fiche sans score ni rang (états « commune sans note » et « ne passe pas »). */
function sansScoreNiRang(t: string) {
  expect(t).not.toContain('/ 100');
  expect(t).not.toMatch(/sur \d+ communes? qui passen?t/);
}

test('AC-8 /?achat=5000&mer=200 : 4 communes, Terrebasse 4e · 10 · prix inconnu ; sa fiche « trop peu de ventes dans le secteur », 10, 4e sur 4 ; C et F non colorées', async ({ page }) => {
  await ouvrirSix(page, '/?achat=5000&mer=200');
  expect(adresse(page)).toBe('/?achat=5000&mer=200');
  await attendreCouleurs<Six>(page, { A: 'score-4', E: 'score-3', B: 'score-3', D: 'score-1', C: null, F: null }, { jeu: SIX });
  await voirListe(page);
  await expect(liste(page)).toContainText('4 communes passent tes critères');
  expect(await lignes(page)).toEqual([
    "1 · Portmer (17) · 62 · 3 800 €/m² · moins d'1 km",
    '2 · Quaibleu (13) · 50 · 4 800 €/m² · 7 km',
    '3 · Grandeville (33) · 46 · 4 400 €/m² · 40 km',
    '4 · Terrebasse (23) · 10 · prix inconnu · 180 km',
  ]);
  await ficheDeListe(page, 'Terrebasse');
  const t = await texteFiche(page);
  expect(t).toContain("Prix d'achat inconnu : trop peu de ventes dans le secteur");
  expect(t).toMatch(/\b10\s*\/ 100/);
  expect(t).toContain('4e sur 4 communes qui passent');
});

test('AC-9 /?achat=5000&mer=aucun : 3 communes, Portmer 24, Grandeville 12, Quaibleu 4 ; D et F neutres, C non colorée ; fiche de Rhinval « Alsace-Moselle », sans score ni rang', async ({ page }) => {
  await ouvrirSix(page, '/?achat=5000&mer=aucun');
  expect(adresse(page)).toBe('/?achat=5000&mer=aucun');
  await attendreCouleurs<Six>(page, { A: 'score-2', B: 'score-1', E: 'score-1', D: 'area-unranked', F: 'area-unranked', C: null }, { jeu: SIX });
  await ficheDeCarte(page, 'F', 'Rhinval (67)');
  const t = await texteFiche(page);
  expect(t).toContain("Prix d'achat inconnu : les ventes ne sont pas publiées en Alsace-Moselle");
  sansScoreNiRang(t);
  await expect(fiche(page).getByRole('heading', { name: 'Ne passe pas tes critères' })).toHaveCount(0);
  await page.getByRole('button', { name: '← Les 10 premières' }).click();
  await voirListe(page);
  await expect(liste(page)).toContainText('3 communes passent tes critères');
  const l = await lignes(page);
  expect(l.map((x) => x.split(' · ').slice(0, 3).join(' · '))).toEqual(['1 · Portmer (17) · 24', '2 · Grandeville (33) · 12', '3 · Quaibleu (13) · 4']);
});

test('AC-10 /?achat=300000&mer=aucun&bien=maison&unite=total&surface=100 : Maison, Acheter, Total, 100 m², 300 000 € ; 1 commune, Terrebasse 57 · 130 000 € ; F neutre ; fiche de Portmer « Achat 350 000 € »', async ({ page }) => {
  const chemin = '/?achat=300000&mer=aucun&bien=maison&unite=total&surface=100';
  await ouvrirSix(page, chemin);
  await expect(choix(page, 'Type de logement', 'Maison')).toHaveAttribute('aria-pressed', 'true');
  await expect(choix(page, 'Louer ou acheter', 'Acheter')).toHaveAttribute('aria-pressed', 'true');
  await expect(choix(page, 'Unité du prix', 'Total')).toHaveAttribute('aria-pressed', 'true');
  await expect(surface(page)).toHaveValue('100');
  await expect(plafond(page, '300 000 €')).toBeVisible();
  await expect(plafond(page, 'Sans limite')).toBeVisible(); // la mer
  expect(adresse(page)).toBe(chemin);
  await attendreCouleurs<Six>(page, { D: 'score-3', F: 'area-unranked', A: null, B: null, C: null, E: null }, { jeu: SIX });
  await ficheDeCarte(page, 'A', 'Portmer (17)');
  expect(await texteFiche(page)).toContain('Achat 350 000 € : au-dessus de ton plafond de 300 000 €');
  await page.getByRole('button', { name: '← Les 10 premières' }).click();
  await voirListe(page);
  await expect(liste(page)).toContainText('1 commune passe tes critères');
  expect(await lignes(page)).toEqual(['1 · Terrebasse (23) · 57 · 130 000 € · 180 km']);
  expect(adresse(page)).toBe(chemin);
});

test('AC-13 /?loyer=1100&mer=aucun&bien=maison : Maison, Louer, Total, 92 m², 1 100 € ; Terrebasse 46 · 598 €, Portmer 12 · 966 € ; F neutre ; fiches de Rhinval « Loyer inconnu » et de Grandeville', async ({ page }) => {
  const chemin = '/?loyer=1100&mer=aucun&bien=maison';
  await ouvrirSix(page, chemin);
  await expect(choix(page, 'Type de logement', 'Maison')).toHaveAttribute('aria-pressed', 'true');
  await expect(choix(page, 'Louer ou acheter', 'Louer')).toHaveAttribute('aria-pressed', 'true');
  await expect(choix(page, 'Unité du prix', 'Total')).toHaveAttribute('aria-pressed', 'true');
  await expect(surface(page)).toHaveValue('92');
  await expect(plafond(page, '1 100 €')).toBeVisible();
  expect(adresse(page)).toBe(chemin);
  await attendreCouleurs<Six>(page, { D: 'score-3', A: 'score-1', F: 'area-unranked', B: null, C: null, E: null }, { jeu: SIX });
  await ficheDeCarte(page, 'F', 'Rhinval (67)');
  const t = await texteFiche(page);
  expect(t).toContain('Loyer inconnu');
  sansScoreNiRang(t);
  await rouvrir(page);
  await ficheDeCarte(page, 'B', 'Grandeville (33)');
  expect(await texteFiche(page)).toContain('Loyer 1 196 € : au-dessus de ton plafond de 1 100 €');
  await page.getByRole('button', { name: '← Les 10 premières' }).click();
  await voirListe(page);
  await expect(liste(page)).toContainText('2 communes passent tes critères');
  expect(await lignes(page)).toEqual(['1 · Terrebasse (23) · 46 · 598 € · 180 km', "2 · Portmer (17) · 12 · 966 € · moins d'1 km"]);
  expect(adresse(page)).toBe(chemin);
});

// Hors AC (details.md, états de la page en mode Acheter ; R25).
test('aucune commune en Acheter, seules des communes sans prix passent : « Relâche le prix, la mer ou la taille. », D et F restent neutres, compte « Aucune commune »', async ({ page }) => {
  await ouvrirSix(page, '/?achat=500&mer=aucun');
  await attendreCouleurs<Six>(page, { D: 'area-unranked', F: 'area-unranked', A: null, B: null, C: null, E: null }, { jeu: SIX });
  await expect(page.getByRole('status')).toHaveText('Aucune commune ne passe tes critères');
  await voirListe(page);
  await expect(liste(page)).toContainText('Aucune commune ne passe tes critères. Relâche le prix, la mer ou la taille.');
  await expect(liste(page).getByRole('button')).toHaveCount(0);
});

test('sans plafond en Acheter : « Fixe un prix d’achat ou une distance à la mer pour classer les communes. », les 6 communes neutres', async ({ page }) => {
  await ouvrirSix(page, '/?achat=aucun&mer=aucun');
  const neutres = Object.fromEntries((['A', 'B', 'C', 'D', 'E', 'F'] as Six[]).map((id) => [id, 'area-unranked' as const]));
  await attendreCouleurs<Six>(page, neutres, { jeu: SIX });
  await voirListe(page);
  await expect(liste(page)).toContainText("Fixe un prix d'achat ou une distance à la mer pour classer les communes.");
});

test('aucune commune en Acheter avec un proche prêt : « Relâche le prix, la mer, la taille ou un proche. »', async ({ page }) => {
  await ouvrir(page, '/?achat=5000&mer=60'); // fixture « 5 communes » : aucun prix d'achat, toutes passent le prix
  await servirIgn(page);
  await ajouter(page, 'Brestville'); // tout à 3 h ou plus de 3 h : rien ne tient 2 h
  await pret(page, 'Brestville (29)');
  await voirListe(page);
  await expect(liste(page)).toContainText('Aucune commune ne passe tes critères. Relâche le prix, la mer, la taille ou un proche.');
});

// ---------------------------------------------------------------------------------------------------------------------
// Tâche 5 : finitions du design F (docs/design/immobilier/decisions.md, retours de Vincent sur F).

test('design F : panneau de réglages de 340 px à 1 440 × 900', async ({ page }) => {
  test.skip(mobile(page), 'panneau de bureau seulement (1 024 px et plus)');
  await ouvrirSix(page);
  expect(page.viewportSize()).toEqual({ width: 1440, height: 900 });
  expect((await reglages(page).boundingBox())!.width).toBe(340);
});

test('design F : valeur des curseurs du prix, de la mer et des proches en 16 px gras ; « à vol d’oiseau » plus sous le curseur de la mer, gardé dans la fiche', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&mer=60'); // fixture « 5 communes » de loyer-mer : Grandeville à 40 km de la mer
  await expect(reglages(page).getByText(/vol d.oiseau/)).toHaveCount(0);
  await ficheDeListe(page, 'Grandeville');
  expect(await texteFiche(page)).toContain("40 km de la mer à vol d'oiseau");
  await fermerFiche(page);

  await servirIgn(page);
  await ajouter(page, 'Brestville');
  await pret(page, 'Brestville (29)');
  await voirCriteres(page);
  const style = (l: ReturnType<typeof plafond>) => l.evaluate((e) => ({ taille: getComputedStyle(e).fontSize, graisse: getComputedStyle(e).fontWeight }));
  const attendu = { taille: '16px', graisse: '700' };
  expect(await style(plafond(page, '1 200 €')), 'prix').toEqual(attendu);
  expect(await style(plafond(page, '60 km')), 'mer').toEqual(attendu);
  expect(await style(page.getByRole('region', { name: 'Tes proches' }).getByText(ins('2 h'), { exact: true })), 'proche').toEqual(attendu);
  await expect(reglages(page).getByText(/vol d.oiseau/)).toHaveCount(0);
});
