import { expect, test, type Page, type Route } from '@playwright/test';
import cadreDeVie from '../../docs/specs/2026-10-14-cadre-de-vie/acceptance.json' with { type: 'json' };
import services from '../../docs/specs/2026-11-23-services/acceptance.json' with { type: 'json' };
import { FIXTURE, ouvrir, servicesJson, servirFixture, type Jeu } from './lib/carte';
import { voirListe } from './lib/feuille';
import { ajouter, pret } from './lib/proches';
import { servirIgn } from './lib/ign';

// Tranche services, sur la fixture « 6 communes » de cadre-de-vie (tuiles de tests/fixtures/tuiles-immobilier/, comme
// `SIX` d'emploi.spec.ts), étendue par celles de mairies et d'emploi (tests/e2e/lib/carte.ts) et par les temps et le drapeau
// d'île de la fixture de services, pris par code INSEE (plan, « Fixtures »). services.json est fabriqué par
// tests/e2e/lib/carte.ts avec la fonction d'écriture de la page ; jamais le vrai fichier.
const tempsParCode = new Map(services.fixture.items.map((it) => [it.code_insee, { temps_services: it.temps_services, ile_sans_pont: it.ile_sans_pont }]));
/** Jeu « 6 communes · services » ; le type `Jeu` de carte.ts ne connaît pas ces champs : conversion ici (accord du plan). */
const SIX_SERVICES = {
  items: cadreDeVie.fixture.items.map((it) => ({ ...it, ...tempsParCode.get(it.code_insee) })),
  tuiles: new URL('../fixtures/tuiles-immobilier/', import.meta.url),
} as unknown as Jeu;

const nbsp = (t: string | null) => (t ?? '').replace(/ /g, ' ');
const fiche = (page: Page) => page.getByRole('region', { name: /\(\w+\)$/ }); // \w : départements 2A et 2B
const liste = (page: Page) => page.getByRole('region', { name: 'Les 10 premières' });
const LIMITES =
  "Temps en voiture, sans embouteillages, que la moitié des habitants ne dépasse pas ; les trajets en bus ou à pied ne sont pas comptés. Médecins généralistes libéraux seulement, sans savoir s'ils prennent de nouveaux patients. Crèches financées par la CAF. Supérieur : universités et grandes écoles, antennes comprises. Gare régionale : 100 000 voyageurs par an ou plus. Gare grandes lignes : gare nationale, ou au moins 4 arrêts de TGV ou d'Intercités par jour ; son temps part parfois de la mairie.";
const TRAVERSEE = "Île sans pont : un temps peut compter la traversée, sans l'attente du bateau.";

/** Ouvre la fiche de `nom` depuis la liste (390 px : son onglet), puis attend qu'elle soit affichée. */
async function ficheDeListe(page: Page, nom: string) {
  await voirListe(page);
  await liste(page).getByRole('button', { name: new RegExp(` ${nom} \\(`) }).click();
  await expect(fiche(page).getByRole('heading', { level: 2 })).toContainText(nom);
}
async function retour(page: Page) {
  await fiche(page).getByRole('button', { name: '← Les 10 premières' }).click();
}
/** Les textes de la fiche, titres, paragraphes et lignes, dans l'ordre du document (espaces insécables remis en espaces). */
const textesFiche = async (page: Page) => (await fiche(page).locator('h3, p, li').allTextContents()).map((t) => nbsp(t).replace(/\s+/g, ' ').trim());
/** Les textes qui suivent la ligne du chômage (R47 d'emploi). */
async function sousChomage(page: Page) {
  const t = await textesFiche(page);
  const i = t.findIndex((x) => x.startsWith('Chômage :'));
  expect(i).toBeGreaterThanOrEqual(0);
  return t.slice(i + 1);
}

// ---------------------------------------------------------------------------------------------------------------------
// Tâche 1 : la fiche (R54, H159) et le pied de page (R56).

test('AC-6 /?loyer=1200 : fiches de Portmer (10 temps dans l’ordre sous le chômage, phrase des limites, sans traversée), Terrebasse, Quaibleu et Rhinval', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200', { jeu: SIX_SERVICES });

  await ficheDeListe(page, 'Portmer');
  await expect(fiche(page)).toContainText('Médecin : 4 min');
  expect(await sousChomage(page)).toEqual([
    'Services en voiture',
    'Médecin : 4 min',
    'Commerce alimentaire : 3 min',
    'Crèche : 12 min',
    'École : 2 min',
    'Collège : 9 min',
    'Lycée : 14 min',
    'Supérieur : 18 min',
    'Gare : 6 min',
    'Gare régionale : 8 min',
    'Gare grandes lignes : 40 min',
    LIMITES,
  ]);
  await expect(fiche(page)).not.toContainText(TRAVERSEE);
  // H159 : espace insécable avant « : » dans les lignes et dans les phrases.
  expect(await fiche(page).getByRole('listitem').filter({ hasText: 'Médecin' }).textContent()).toBe('Médecin : 4 min');
  expect(await fiche(page).getByText(/^Temps en voiture/).textContent()).toContain('Gare régionale : 100 000 voyageurs');
  await retour(page);

  await ficheDeListe(page, 'Terrebasse');
  expect(await sousChomage(page)).toContain("Gare régionale : plus d'une heure");
  await retour(page);

  await ficheDeListe(page, 'Quaibleu');
  expect(await sousChomage(page)).toContain('Gare régionale : 60 min');
  await retour(page);

  await ficheDeListe(page, 'Rhinval');
  const rhinval = await sousChomage(page);
  for (const l of ['Médecin : pas de chiffre', 'Supérieur : pas de chiffre', 'Gare régionale : pas de chiffre', 'Gare grandes lignes : pas de chiffre'])
    expect(rhinval).toContain(l);
});

test('AC-7 / : le pied de page cite l’Insee (temps d’accès) et les gares grandes lignes, à côté des mentions des tranches précédentes', async ({ page }) => {
  await ouvrir(page, '/', { jeu: SIX_SERVICES });
  const mentions = page.getByRole('contentinfo').filter({ visible: true }).first();
  for (const t of [
    "Temps d'accès aux services : Insee, base permanente des équipements, distancier Metric-OSRM, © les contributeurs d'OpenStreetMap et du projet OSRM (équipements 2025)",
    'Gares grandes lignes : horaires SNCF (licence ODbL), temps depuis la mairie calculés avec openrouteservice, © OpenStreetMap contributors',
    // Mentions des tranches précédentes, toujours là.
    'Estimations ANIL, à partir des données du Groupe SeLoger et de leboncoin',
    '© Shom-IGN, 2021',
    'Source : Insee, populations légales',
    "Contours des communes : Etalab, d'après Admin Express © IGN",
    'Recherche d\'adresse et temps de trajet : © IGN – Géoplateforme (Base Adresse Nationale, BD TOPO®)',
    "Prix d'achat : Demandes de valeurs foncières (DGFiP), statistiques Etalab, ventes 2023 à 2025 (2021 à 2025 sous 30 ventes)",
    "Type d'environnement : Insee, grille communale de densité 2025 (mise en ligne le 21/07/2025)",
    'Zone de montagne : Cerema, communes soumises à la loi Montagne (2019)',
    'Résultats des élections municipales 2026 : ministère de l\'Intérieur',
    "Chômage : Insee, taux de chômage localisés par zone d'emploi, 2e trimestre 2026",
  ])
    await expect(mentions).toContainText(t);
});

// ---------------------------------------------------------------------------------------------------------------------
// Hors AC (R57, plan « Chargement » et « Annonces aux lecteurs d'écran ») : sans `services` dans l'adresse, le fichier des
// temps est demandé quand la carte est prête ; pendant ce temps la liste est là et la fiche dit « Chargement des temps… » ;
// son arrivée ne change aucune zone d'annonce. AC-15 (catégorie, erreur, adresse avec `services`) est en tâche 4.

/** Retient la demande de services.json : l'état de la carte à ce moment, et la réponse, envoyée quand le test le veut. */
async function retenirServices(page: Page, jeu: Jeu) {
  const r = { carteAuMoment: null as string | null, demandes: 0, route: null as Route | null };
  await page.route('**/data/services.json', async (route) => {
    r.route = route;
    r.carteAuMoment = await page.getByTestId('carte').getAttribute('data-carte-prete');
    r.demandes++; // en dernier : quand le test voit la demande, sa route est gardée
  });
  return {
    etat: r,
    repondre: () => r.route!.fulfill({ json: servicesJson(jeu) }),
    echouer: () => r.route!.fulfill({ status: 500, body: '' }),
  };
}

test('R57 : services.json demandé après la carte prête ; liste affichée sans lui, fiche « Chargement des temps… », puis les temps, sans annonce', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { annonces: string[] };
    w.annonces = [];
    const derniers = new Map<Element, string>();
    new MutationObserver(() => {
      for (const el of document.querySelectorAll('[role="status"], [role="alert"], [aria-live]')) {
        const t = el.textContent ?? '';
        if (derniers.get(el) !== t) {
          derniers.set(el, t);
          w.annonces.push(t);
        }
      }
    }).observe(document, { subtree: true, childList: true, characterData: true, attributes: true });
  });
  await servirFixture(page, { jeu: SIX_SERVICES });
  const s = await retenirServices(page, SIX_SERVICES); // posée après : elle gagne
  await page.goto('/?loyer=1200');
  await expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
  await expect.poll(() => s.etat.demandes).toBe(1);
  expect(s.etat.carteAuMoment).toBe('1');

  await voirListe(page);
  await expect(liste(page)).toContainText('5 communes passent tes critères');
  await ficheDeListe(page, 'Portmer');
  expect(await sousChomage(page)).toEqual(['Services en voiture', 'Chargement des temps…']);
  await expect(fiche(page)).not.toContainText(LIMITES);
  expect(await fiche(page).getByText('Chargement des temps…').evaluate((el) => el.closest('[role="status"], [role="alert"], [aria-live]'))).toBeNull();

  // Page au repos (indicateur de la carte parti, leçon 2026-10-16) avant de remettre le guetteur à zéro.
  await expect(page.getByTestId('message-carte')).toHaveText('');
  await page.evaluate(() => ((window as unknown as { annonces: string[] }).annonces = []));
  await s.repondre();
  await expect(fiche(page)).toContainText('Médecin : 4 min');
  await expect(fiche(page)).toContainText(LIMITES);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as unknown as { annonces: string[] }).annonces)).toEqual([]);
  expect(s.etat.demandes).toBe(1);
});

test('R57 : fichier des temps en erreur, la fiche dit « Temps des services indisponibles. » et « Réessayer », qui relance lui seul', async ({ page }) => {
  await servirFixture(page, { jeu: SIX_SERVICES });
  const s = await retenirServices(page, SIX_SERVICES);
  const autres: string[] = [];
  page.on('request', (r) => r.url().includes('/data/') && !r.url().endsWith('/services.json') && autres.push(r.url()));
  await page.goto('/?loyer=1200');
  await expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
  await expect.poll(() => s.etat.demandes).toBe(1);
  await s.echouer();

  await voirListe(page);
  await expect(liste(page)).toContainText('5 communes passent tes critères'); // le reste de la page marche
  await ficheDeListe(page, 'Portmer');
  await expect(fiche(page).getByRole('alert')).toHaveText('Temps des services indisponibles.');
  expect(await sousChomage(page)).toEqual(['Services en voiture', 'Temps des services indisponibles.']);
  const avant = autres.length;

  await fiche(page).getByRole('button', { name: 'Réessayer' }).click();
  await expect.poll(() => s.etat.demandes).toBe(2);
  await expect(fiche(page)).toContainText('Chargement des temps…');
  await s.repondre();
  await expect(fiche(page)).toContainText('Médecin : 4 min');
  await expect(fiche(page).getByRole('alert')).toHaveCount(0);
  expect(autres.length).toBe(avant); // aucune autre donnée redemandée
});

// Hors AC (leçon 2026-11-24-fiche-de-bureau-sans-defilement) : en bureau, une fiche plus haute que l'écran défile ; sa
// dernière phrase s'amène à l'écran. Île sans pont (variante « cas sûrs » de Portmer), donc la phrase de la traversée.
test('fiche longue en bureau (1 440 × 700) : la phrase de la traversée de Portmer s’amène à l’écran en faisant défiler la fiche', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1024, 'bureau');
  await page.setViewportSize({ width: 1440, height: 700 });
  const ile = { ...SIX_SERVICES, items: SIX_SERVICES.items.map((it) => (it.code_insee === '99001' ? { ...it, ile_sans_pont: true } : it)) } as Jeu;
  await ouvrir(page, '/?loyer=1200', { jeu: ile });
  await ficheDeListe(page, 'Portmer');
  const derniere = fiche(page).getByText(TRAVERSEE);
  await derniere.scrollIntoViewIfNeeded();
  await expect(derniere).toBeInViewport({ ratio: 1 });
  expect((await fiche(page).boundingBox())!.height).toBeLessThanOrEqual(700 - 2 * 16);
});

test('R54 : avec un proche, le bloc « Services en voiture » vient sous « Tes proches »', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&mer=50', { jeu: FIXTURE });
  await servirIgn(page);
  await ajouter(page, 'Nantesville');
  await pret(page, 'Nantesville (44)');
  await ficheDeListe(page, 'Portmer');
  await expect(fiche(page)).toContainText('Médecin : pas de chiffre'); // les « 5 communes » n'ont aucun temps
  const sous = await sousChomage(page);
  expect(sous.slice(0, 2)).toEqual(['Tes proches', expect.stringMatching(/^Nantesville \(44\) : /)]);
  expect(sous[2]).toBe('Services en voiture');
});
