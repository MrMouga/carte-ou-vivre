import { expect, test, type Page, type Route } from '@playwright/test';
import cadreDeVie from '../../docs/specs/2026-10-14-cadre-de-vie/acceptance.json' with { type: 'json' };
import services from '../../docs/specs/2026-11-23-services/acceptance.json' with { type: 'json' };
import { FIXTURE, ouvrir, servicesJson, servirFixture, vue, type Jeu } from './lib/carte';
import { amenerEnBas, voirCriteres, voirListe } from './lib/feuille';
import { ajouter, lignes, pret } from './lib/proches';
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
  "Temps en voiture, sans embouteillages, que la moitié des habitants ne dépasse pas ; les trajets en bus ou à pied ne sont pas comptés. Médecins généralistes libéraux seulement, sans savoir s'ils prennent de nouveaux patients. Urgences : services d'urgence et SMUR, sans savoir s'ils accueillent sans appel au 15. Supermarchés et hypermarchés seulement. Crèches financées par la CAF. Supérieur : universités et grandes écoles, antennes comprises. Gare régionale : 100 000 voyageurs par an ou plus. Gare grandes lignes : gare nationale, ou au moins 4 arrêts de TGV ou d'Intercités par jour ; son temps part parfois de la mairie.";
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

test('AC-6 /?loyer=1200 : fiches de Portmer (11 temps dans l’ordre sous le chômage, phrase des limites, sans traversée), Terrebasse, Quaibleu et Rhinval', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200', { jeu: SIX_SERVICES });

  await ficheDeListe(page, 'Portmer');
  await expect(fiche(page)).toContainText('Médecin : 4 min');
  expect(await sousChomage(page)).toEqual([
    'Services en voiture',
    'Médecin : 4 min',
    'Urgences : 14 min',
    'Supermarché : 3 min',
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
  const terrebasse = await sousChomage(page);
  expect(terrebasse).toContain("Urgences : plus d'une heure"); // 75 min
  expect(terrebasse).toContain("Gare régionale : plus d'une heure"); // 61 min
  await retour(page);

  await ficheDeListe(page, 'Quaibleu');
  expect(await sousChomage(page)).toContain('Gare régionale : 60 min');
  await retour(page);

  await ficheDeListe(page, 'Rhinval');
  const rhinval = await sousChomage(page);
  for (const l of ['Urgences : 22 min', 'Supermarché : 6 min', 'Médecin : pas de chiffre', 'Supérieur : pas de chiffre', 'Gare régionale : pas de chiffre', 'Gare grandes lignes : pas de chiffre'])
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

// ---------------------------------------------------------------------------------------------------------------------
// Tâche 2 : le filtre, par l'adresse (R53, R55, R57 avec `services` dans l'adresse).

/** Les lignes de la liste, « Rhinval (67) · 52 » (nom et score). */
const nomsEtScores = async (page: Page) => (await lignes(page)).map((l) => l.split(' · ').slice(1, 3).join(' · '));
const ID_DE: Record<string, string> = Object.fromEntries(services.fixture.items.map((it) => [it.nom, it.id]));
/**
 * Ouvre la fiche d'une commune sur la carte (une commune écartée n'est pas dans la liste). L'adresse est rouverte d'abord :
 * les points de `vue()` sont ceux de la vue d'ouverture (leçon 2026-10-19-clic-sur-la-carte-apres-un-choix-de-commune).
 */
async function ficheDeCarte(page: Page, nom: string, jeu: Jeu = SIX_SERVICES) {
  const u = new URL(page.url());
  await ouvrir(page, u.pathname + u.search, { jeu });
  const { centre } = vue(page, jeu);
  await page.mouse.click(centre(ID_DE[nom]).x, centre(ID_DE[nom]).y);
  await expect(fiche(page).getByRole('heading', { level: 2 })).toContainText(nom);
}

test('AC-8 /?loyer=1200&services=medecin:5 : Rhinval (pas de chiffre) passe sans raison du médecin ; Quaibleu écartée par le médecin', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&services=medecin:5', { jeu: SIX_SERVICES });
  await voirListe(page);
  await expect(liste(page)).toContainText('3 communes passent tes critères');
  expect(await nomsEtScores(page)).toEqual(['Rhinval (67) · 52', 'Portmer (17) · 46', 'Grandeville (33) · 31']);

  await ficheDeListe(page, 'Rhinval');
  expect(await sousChomage(page)).toContain('Médecin : pas de chiffre');
  await expect(fiche(page)).not.toContainText('Ne passe pas tes critères');
  expect((await textesFiche(page)).filter((t) => t.startsWith('Médecin') && t.includes('plafond'))).toEqual([]);
  await retour(page);

  // Quaibleu n'est plus dans la liste : sa fiche s'ouvre sur la carte.
  await ficheDeCarte(page, 'Quaibleu');
  const raisons = (await fiche(page).getByRole('listitem').allTextContents()).map(nbsp);
  expect(raisons).toContain('Médecin 10 min : au-dessus de ton plafond de 5 min');
  expect(page.url()).toMatch(/\/\?loyer=1200&services=medecin:5$/);
});

test('R53 page « sans plafond » : /?loyer=aucun&services=medecin:5, la fiche de Terrebasse dit pourquoi elle est écartée', async ({ page }) => {
  await ouvrir(page, '/?loyer=aucun&services=medecin:5', { jeu: SIX_SERVICES });
  await ficheDeCarte(page, 'Terrebasse');
  await expect(fiche(page)).toContainText('Ne passe pas tes critères');
  expect((await fiche(page).getByRole('listitem').allTextContents()).map(nbsp)).toContain('Médecin 18 min : au-dessus de ton plafond de 5 min');
  await retour(page);
  await ficheDeCarte(page, 'Rhinval');
  await expect(fiche(page)).not.toContainText('Ne passe pas tes critères');
});

test('R57 : avec `services` dans l’adresse, la page attend le fichier des temps avec les autres données (ni carte ni liste avant)', async ({ page }) => {
  await servirFixture(page, { jeu: SIX_SERVICES });
  let route: Route | null = null;
  await page.route('**/data/services.json', (r) => {
    route = r;
  });
  await page.goto('/?loyer=1200&services=zzz:10'); // même si aucune entrée n'est valide
  await expect.poll(() => route != null).toBe(true);
  await page.waitForTimeout(500);
  await expect(page.getByTestId('carte')).toHaveCount(0);
  await expect(liste(page)).toHaveCount(0);
  await route!.fulfill({ json: servicesJson(SIX_SERVICES) });
  await expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
  await voirListe(page);
  await expect(liste(page)).toContainText('5 communes passent tes critères');
  expect(page.url()).toMatch(/\/\?loyer=1200$/); // R55 : réécrite sans `services`
});

test('R54 : avec un proche, le bloc « Services en voiture » vient sous « Tes proches »', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&mer-min=60', { jeu: FIXTURE });
  await servirIgn(page);
  await ajouter(page, 'Nantesville');
  await pret(page, 'Nantesville (44)');
  await ficheDeListe(page, 'Portmer');
  await expect(fiche(page)).toContainText('Médecin : pas de chiffre'); // les « 5 communes » n'ont aucun temps
  const sous = await sousChomage(page);
  expect(sous.slice(0, 2)).toEqual(['Tes proches', expect.stringMatching(/^Nantesville \(44\) : /)]);
  expect(sous[2]).toBe('Services en voiture');
});

// ---------------------------------------------------------------------------------------------------------------------
// Tâche 3a : la catégorie « Services » (R51, H151 à H154, H169), médecin, commerce et gare branchés ; scolarité affichée.
// Révision D19, D20 : « Commerce alimentaire » devient « Supermarché », « Urgences » s'ajoute après « Médecin ».

const adresse = (page: Page) => new URL(page.url()).pathname + new URL(page.url()).search;
const reglagesZone = (page: Page) => page.getByRole('region', { name: 'Réglages' });
/** Une pastille de temps d'une ligne (groupe nommé par sa ligne, H153), « 10 min » (espace insécable). */
const tempsDe = (page: Page, ligne: string, minutes: number) =>
  reglagesZone(page).getByRole('group', { name: ligne, exact: true }).getByRole('button', { name: new RegExp(`^${minutes}\\smin$`) });
const typeGare = (page: Page, nom: string) => reglagesZone(page).getByRole('group', { name: 'Type de gare', exact: true }).getByRole('button', { name: nom, exact: true });
/** Le contenu de la catégorie « Services », par le bouton de son titre (aria-controls). */
async function categorieServices(page: Page) {
  const titre = reglagesZone(page).getByRole('heading', { level: 2, name: /^Services/ }).getByRole('button');
  return { titre, contenu: page.locator(`[id="${await titre.getAttribute('aria-controls')}"]`) };
}
/** Coche ou décoche une pastille, une fois les temps arrivés (plan, « Fixtures » : elle doit être active). */
async function toucher(bouton: ReturnType<typeof tempsDe>) {
  await voirCriteres(bouton.page());
  await expect(bouton).toBeEnabled();
  await bouton.click();
}
const raisonsFiche = async (page: Page) => (await fiche(page).getByRole('listitem').allTextContents()).map(nbsp);
/** Liste d'AC-1 de mairies, sans service coché. */
const LISTE_AC1_MAIRIES = ['Terrebasse (23) · 65', 'Rhinval (67) · 52', 'Portmer (17) · 46', 'Grandeville (33) · 31', 'Quaibleu (13) · 9'];
async function listeEst(page: Page, compte: string, noms: string[]) {
  await voirListe(page);
  await expect(liste(page)).toContainText(compte);
  expect(await nomsEtScores(page)).toEqual(noms);
}

/** Variante « cas sûrs » (AC-9) : îles de Portmer et Montcher, population 0 et temps vides de Terrebasse, Quaibleu en 2B. */
const VARIANTE = services.fixture.variante_cas_surs as unknown as Record<string, Record<string, unknown>>;
const CAS_SURS = {
  ...SIX_SERVICES,
  items: SIX_SERVICES.items.map((it) => {
    const v = VARIANTE[(it as unknown as { id: string }).id];
    if (!v) return it;
    const { departement, ...reste } = v as { departement?: string };
    return { ...it, ...reste, ...(departement ? { dep: departement } : {}) };
  }),
} as unknown as Jeu;

test('AC-1 / : « Services », ouverte, suit « Tes proches » ; Médecin, Urgences, Supermarché, Scolarité et Gare dans l’ordre, groupes nommés, « Toutes » sélectionné, rien de coché, aucun « Commerce alimentaire » ; liste d’AC-1 de mairies', async ({ page }) => {
  await ouvrir(page, '/', { jeu: SIX_SERVICES });
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
  const titres = (await reglagesZone(page).getByRole('heading', { level: 2 }).allTextContents()).map((t) => nbsp(t).trim());
  expect(titres.indexOf('Services')).toBe(titres.indexOf('Tes proches') + 1);
  expect(titres.at(-1)).toBe('Services'); // H151 : la dernière
  const { titre, contenu } = await categorieServices(page);
  await expect(titre).toHaveAttribute('aria-expanded', 'true');
  // L'ordre de ce qu'on lit, titres de ligne, choix et temps.
  const textes = (await contenu.locator('span, button').allTextContents()).map((t) => nbsp(t).trim());
  expect(textes).toEqual([
    'Médecin', '5 min', '10 min', '15 min',
    'Urgences', '15 min', '30 min', '45 min',
    'Supermarché', '5 min', '10 min', '15 min',
    'Scolarité', 'Crèche', 'École', 'Collège', 'Lycée', 'Supérieur', 'Temps de trajet maximal', '5 min', '10 min', '20 min',
    'Gare', 'Toutes', 'Régionale', 'Grandes lignes', 'Temps de trajet maximal', '10 min', '20 min', '30 min',
  ]);
  // Groupes nommés (H153), dans l'ordre du document.
  const groupes = await contenu.getByRole('group').evaluateAll((els) =>
    els.map((g) => g.getAttribute('aria-label') ?? document.getElementById(g.getAttribute('aria-labelledby')!)!.textContent),
  );
  expect(groupes).toEqual(['Médecin', 'Urgences', 'Supermarché', 'Niveaux de scolarité', 'Scolarité', 'Type de gare', 'Gare']);
  await expect(page.getByText('Commerce alimentaire')).toHaveCount(0);
  expect(await contenu.getByRole('group', { name: 'Niveaux de scolarité' }).getByRole('button').allTextContents()).toEqual(['Crèche', 'École', 'Collège', 'Lycée', 'Supérieur']);
  // Rien de coché ; « Toutes » sélectionné.
  await expect(typeGare(page, 'Toutes')).toHaveAttribute('aria-pressed', 'true');
  const presses = await contenu.getByRole('button').evaluateAll((els) => els.filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent));
  expect(presses).toEqual(['Toutes']);
  await listeEst(page, '5 communes passent tes critères', LISTE_AC1_MAIRIES);
});

test('AC-2 /?loyer=1200, « 10 min » pour « Médecin » : services=medecin:10, 4 communes (Quaibleu à 10 min et Rhinval sans chiffre passent), raison de Terrebasse', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200', { jeu: SIX_SERVICES });
  await toucher(tempsDe(page, 'Médecin', 10));
  await expect(tempsDe(page, 'Médecin', 10)).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=medecin:10');
  await listeEst(page, '4 communes passent tes critères', ['Rhinval (67) · 52', 'Portmer (17) · 46', 'Grandeville (33) · 31', 'Quaibleu (13) · 9']);
  await ficheDeCarte(page, 'Terrebasse');
  expect(await raisonsFiche(page)).toContain('Médecin 18 min : au-dessus de ton plafond de 10 min');
});

test('AC-3 /?loyer=1200&services=medecin:10, « 10 min » pour « Gare » : medecin:10,gare:10, 2 communes ; raisons de Quaibleu et de Terrebasse, dans l’ordre', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&services=medecin:10', { jeu: SIX_SERVICES });
  await expect(tempsDe(page, 'Médecin', 10)).toHaveAttribute('aria-pressed', 'true');
  await toucher(tempsDe(page, 'Gare', 10));
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=medecin:10,gare:10');
  await listeEst(page, '2 communes passent tes critères', ['Portmer (17) · 46', 'Grandeville (33) · 31']);
  await ficheDeCarte(page, 'Quaibleu');
  expect(await raisonsFiche(page)).toContain('Gare 30 min : au-dessus de ton plafond de 10 min');
  await ficheDeCarte(page, 'Terrebasse');
  const r = await raisonsFiche(page);
  const [m, g] = ['Médecin 18 min : au-dessus de ton plafond de 10 min', 'Gare 41 min : au-dessus de ton plafond de 10 min'].map((x) => r.indexOf(x));
  expect(m).toBeGreaterThanOrEqual(0);
  expect(g).toBeGreaterThan(m);
});

test('AC-9 cas sûrs, /?loyer=1200&services=gare-regionale:30 : îles, population 0 et Corse ne passent jamais ; puis « Toutes » ; puis « 15 min » pour « Médecin »', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&services=gare-regionale:30', { jeu: CAS_SURS });
  await expect(typeGare(page, 'Régionale')).toHaveAttribute('aria-pressed', 'true');
  await listeEst(page, '2 communes passent tes critères', ['Rhinval (67) · 52', 'Grandeville (33) · 31']);

  await ficheDeCarte(page, 'Portmer', CAS_SURS);
  const portmer = await textesFiche(page);
  for (const l of ["Gare : aucune sur l'île", "Gare régionale : aucune sur l'île", "Gare grandes lignes : aucune sur l'île", TRAVERSEE]) expect(portmer).toContain(l);
  expect(await raisonsFiche(page)).toContain("Gare régionale : aucune sur l'île");
  await ficheDeCarte(page, 'Montcher', CAS_SURS);
  expect(await textesFiche(page)).toContain("Gare : aucune sur l'île");
  await expect(fiche(page)).not.toContainText(TRAVERSEE);
  await ficheDeCarte(page, 'Terrebasse', CAS_SURS);
  expect(await raisonsFiche(page)).toContain('Gare régionale : pas de chiffre, commune sans habitant');
  await ficheDeCarte(page, 'Quaibleu', CAS_SURS);
  const quaibleu = await textesFiche(page);
  for (const l of ['Gare régionale : aucune en Corse', 'Gare grandes lignes : aucune en Corse']) expect(quaibleu).toContain(l);
  expect(await raisonsFiche(page)).toContain('Gare régionale : aucune en Corse');
  await retour(page);

  await toucher(typeGare(page, 'Toutes'));
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=gare:30');
  await listeEst(page, '3 communes passent tes critères', ['Rhinval (67) · 52', 'Grandeville (33) · 31', 'Quaibleu (2B) · 9']);

  await toucher(tempsDe(page, 'Gare', 30));
  await expect(tempsDe(page, 'Gare', 30)).toHaveAttribute('aria-pressed', 'false');
  await toucher(tempsDe(page, 'Médecin', 15));
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=medecin:15');
  await listeEst(page, '4 communes passent tes critères', ['Rhinval (67) · 52', 'Portmer (17) · 46', 'Grandeville (33) · 31', 'Quaibleu (2B) · 9']);
  await ficheDeCarte(page, 'Terrebasse', CAS_SURS);
  expect(await raisonsFiche(page)).toContain('Médecin : pas de chiffre, commune sans habitant');
});

test('AC-10 /?loyer=1200&services=gare:10 : changer de type garde « 10 min » ; sans temps coché, le type ne filtre pas', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&services=gare:10', { jeu: SIX_SERVICES });
  await toucher(typeGare(page, 'Régionale'));
  await expect(tempsDe(page, 'Gare', 10)).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=gare-regionale:10');
  await listeEst(page, '3 communes passent tes critères', ['Rhinval (67) · 52', 'Portmer (17) · 46', 'Grandeville (33) · 31']);

  await toucher(typeGare(page, 'Grandes lignes'));
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=gare-grandes-lignes:10');
  await listeEst(page, '2 communes passent tes critères', ['Rhinval (67) · 52', 'Grandeville (33) · 31']);

  await toucher(typeGare(page, 'Toutes'));
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=gare:10');
  await listeEst(page, '2 communes passent tes critères', ['Portmer (17) · 46', 'Grandeville (33) · 31']);

  await toucher(tempsDe(page, 'Gare', 10));
  await toucher(typeGare(page, 'Régionale'));
  await expect(typeGare(page, 'Régionale')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
  await listeEst(page, '5 communes passent tes critères', LISTE_AC1_MAIRIES);
});

test('AC-11 trois adresses mal écrites, réécrites selon R55 ; la troisième sélectionne « Grandes lignes »', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&services=medecin:10,zzz:10,ecole:7,college:20,medecin:5,gare:10,gare-regionale:20,lycee:10', { jeu: SIX_SERVICES });
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=medecin:10,college:20,gare:10');
  await ouvrir(page, '/?services=creche:10,medecin:10&metier=V1X80:10&loyer=1200', { jeu: SIX_SERVICES });
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&metier=V1X80:10&services=medecin:10,creche:10');
  await ouvrir(page, '/?loyer=1200&services=medecin:7,medecin:10,gare:5,gare-grandes-lignes:10,lycee:10,ecole:10,ecole:5', { jeu: SIX_SERVICES });
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=medecin:10,ecole:10,lycee:10,gare-grandes-lignes:10');
  await voirCriteres(page);
  await expect(typeGare(page, 'Grandes lignes')).toHaveAttribute('aria-pressed', 'true');
  await expect(typeGare(page, 'Toutes')).toHaveAttribute('aria-pressed', 'false');
});

// ---------------------------------------------------------------------------------------------------------------------
// Révision D19, D20 (plan 2026-11-26-services-revision, tâche 1) : « Urgences » et « Supermarché ».

test('AC-18 /?loyer=1200, « 30 min » pour « Urgences » : urgences:30, 4 communes, raison de Terrebasse ; puis « 15 min » : urgences:15, 2 communes, raisons de Quaibleu et de Rhinval', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200', { jeu: SIX_SERVICES });
  await toucher(tempsDe(page, 'Urgences', 30));
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=urgences:30');
  await listeEst(page, '4 communes passent tes critères', ['Rhinval (67) · 52', 'Portmer (17) · 46', 'Grandeville (33) · 31', 'Quaibleu (13) · 9']);
  await ficheDeCarte(page, 'Terrebasse');
  expect(await raisonsFiche(page)).toContain("Urgences plus d'une heure : au-dessus de ton plafond de 30 min");
  await retour(page);

  await toucher(tempsDe(page, 'Urgences', 15));
  expect(await tempsCoches(page, 'Urgences')).toEqual(['15 min']);
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=urgences:15');
  await listeEst(page, '2 communes passent tes critères', ['Portmer (17) · 46', 'Grandeville (33) · 31']);
  await ficheDeCarte(page, 'Quaibleu');
  expect(await raisonsFiche(page)).toContain('Urgences 30 min : au-dessus de ton plafond de 15 min');
  await ficheDeCarte(page, 'Rhinval');
  expect(await raisonsFiche(page)).toContain('Urgences 22 min : au-dessus de ton plafond de 15 min');
});

test('AC-19 /?loyer=1200&services=medecin:10, « 5 min » pour « Supermarché » : medecin:10,supermarche:5, 3 communes, raison de Rhinval ; puis « 45 min » pour « Urgences » : ordre fixe, liste inchangée', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&services=medecin:10', { jeu: SIX_SERVICES });
  await toucher(tempsDe(page, 'Supermarché', 5));
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=medecin:10,supermarche:5');
  const trois = ['Portmer (17) · 46', 'Grandeville (33) · 31', 'Quaibleu (13) · 9'];
  await listeEst(page, '3 communes passent tes critères', trois);
  await ficheDeCarte(page, 'Rhinval');
  expect(await raisonsFiche(page)).toContain('Supermarché 6 min : au-dessus de ton plafond de 5 min');
  await retour(page);

  await toucher(tempsDe(page, 'Urgences', 45));
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=medecin:10,urgences:45,supermarche:5');
  await listeEst(page, '3 communes passent tes critères', trois);
});

test('AC-20 anciens liens `commerce` et adresse mal écrite : réécrites selon R55 (H203), sans casser la page', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&services=commerce:5,medecin:10', { jeu: SIX_SERVICES });
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=medecin:10');
  await voirCriteres(page);
  expect(await tempsCoches(page, 'Supermarché')).toEqual([]);
  await listeEst(page, '4 communes passent tes critères', ['Rhinval (67) · 52', 'Portmer (17) · 46', 'Grandeville (33) · 31', 'Quaibleu (13) · 9']);

  await ouvrir(page, '/?loyer=1200&services=commerce:5', { jeu: SIX_SERVICES });
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
  await listeEst(page, '5 communes passent tes critères', LISTE_AC1_MAIRIES);

  await ouvrir(page, '/?loyer=1200&services=supermarche:15,urgences:10,urgences:30,supermarche:5', { jeu: SIX_SERVICES });
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=urgences:30,supermarche:15');
  await voirCriteres(page);
  expect(await tempsCoches(page, 'Urgences')).toEqual(['30 min']);
  expect(await tempsCoches(page, 'Supermarché')).toEqual(['15 min']);
});

test('R57 : la catégorie « Services » est inactive tant que les temps ne sont pas arrivés', async ({ page }) => {
  await servirFixture(page, { jeu: SIX_SERVICES });
  const s = await retenirServices(page, SIX_SERVICES);
  await page.goto('/?loyer=1200');
  await expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
  await expect.poll(() => s.etat.demandes).toBe(1);
  for (const b of [tempsDe(page, 'Médecin', 5), tempsDe(page, 'Supermarché', 15), typeGare(page, 'Régionale'), tempsDe(page, 'Gare', 30)])
    await expect(b).toBeDisabled();
  await s.repondre();
  for (const b of [tempsDe(page, 'Médecin', 5), tempsDe(page, 'Supermarché', 15), typeGare(page, 'Régionale'), tempsDe(page, 'Gare', 30)])
    await expect(b).toBeEnabled();
});

test('H154 : repliée, « Services » résume « Peu importe », puis « 1 choix », « 2 choix » ; une pastille cochée se décoche', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200', { jeu: SIX_SERVICES });
  const { titre } = await categorieServices(page);
  await toucher(tempsDe(page, 'Supermarché', 5));
  await toucher(tempsDe(page, 'Supermarché', 15)); // une à la fois
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=supermarche:15');
  await expect(tempsDe(page, 'Supermarché', 5)).toHaveAttribute('aria-pressed', 'false');
  await toucher(typeGare(page, 'Grandes lignes'));
  await toucher(tempsDe(page, 'Gare', 20));
  await titre.click();
  expect(nbsp(await titre.textContent())).toBe('Services2 choix');
  await titre.click();
  await toucher(tempsDe(page, 'Gare', 20)); // décochée
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=supermarche:15');
  await titre.click();
  expect(nbsp(await titre.textContent())).toBe('Services1 choix');
  await titre.click();
  await toucher(tempsDe(page, 'Supermarché', 15));
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
  await titre.click();
  expect(nbsp(await titre.textContent())).toBe('ServicesPeu importe');
});

// ---------------------------------------------------------------------------------------------------------------------
// Tâche 3b : « Scolarité » branchée (R51, R53, H153, H154, H167) ; états vide, incomplète, active (details.md).

/** Une case des niveaux de scolarité (groupe « Niveaux de scolarité », H153). */
const niveau = (page: Page, nom: string) =>
  reglagesZone(page).getByRole('group', { name: 'Niveaux de scolarité', exact: true }).getByRole('button', { name: nom, exact: true });
const INCOMPLET = 'Coche au moins un niveau et un temps.';
const phraseIncomplet = (page: Page) => reglagesZone(page).getByText(INCOMPLET, { exact: true });
/** Les temps cochés d'une ligne. */
const tempsCoches = async (page: Page, ligne: string) =>
  (await reglagesZone(page).getByRole('group', { name: ligne, exact: true }).getByRole('button', { pressed: true }).allTextContents()).map(nbsp);

test('AC-4 /?loyer=1200&services=medecin:10 : « 15 min » seule cochée, puis décochée ; « Crèche », « École » et « 5 min » : repliée « 1 choix », creche:5,ecole:5', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200&services=medecin:10', { jeu: SIX_SERVICES });
  await toucher(tempsDe(page, 'Médecin', 15));
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=medecin:15');
  expect(await tempsCoches(page, 'Médecin')).toEqual(['15 min']);

  await toucher(tempsDe(page, 'Médecin', 15));
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
  expect(await tempsCoches(page, 'Médecin')).toEqual([]);
  await listeEst(page, '5 communes passent tes critères', LISTE_AC1_MAIRIES);

  await toucher(niveau(page, 'Crèche'));
  await toucher(niveau(page, 'École'));
  await toucher(tempsDe(page, 'Scolarité', 5));
  const { titre } = await categorieServices(page);
  await titre.click();
  await expect(titre).toHaveAttribute('aria-expanded', 'false');
  expect(nbsp(await titre.textContent())).toBe('Services1 choix');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=creche:5,ecole:5');
});

test('AC-14 /?loyer=1200, « École » et « Collège » : phrase de l’état incomplet, rien ne filtre ; « 10 min », « Lycée », puis « 20 min » filtrent', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200', { jeu: SIX_SERVICES });
  await toucher(niveau(page, 'École'));
  await toucher(niveau(page, 'Collège'));
  await expect(phraseIncomplet(page)).toBeVisible();
  // H153 : reliée aux deux groupes, hors de toute zone d'annonce.
  for (const g of ['Niveaux de scolarité', 'Scolarité'])
    await expect(reglagesZone(page).getByRole('group', { name: g, exact: true })).toHaveAccessibleDescription(INCOMPLET);
  expect(await phraseIncomplet(page).evaluate((e) => e.closest('[role="status"], [role="alert"], [aria-live]') == null)).toBe(true);
  await page.waitForTimeout(300);
  expect(adresse(page)).toBe('/?loyer=1200');
  await listeEst(page, '5 communes passent tes critères', LISTE_AC1_MAIRIES);

  await toucher(tempsDe(page, 'Scolarité', 10));
  await expect(phraseIncomplet(page)).toHaveCount(0);
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=ecole:10,college:10');
  await listeEst(page, '2 communes passent tes critères', ['Portmer (17) · 46', 'Grandeville (33) · 31']);
  await ficheDeCarte(page, 'Terrebasse');
  expect(await raisonsFiche(page)).toContain('Collège 16 min : au-dessus de ton plafond de 10 min');
  await retour(page);

  await toucher(niveau(page, 'Lycée'));
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=ecole:10,college:10,lycee:10');
  await listeEst(page, '1 commune passe tes critères', ['Grandeville (33) · 31']);

  await toucher(tempsDe(page, 'Scolarité', 20));
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=ecole:20,college:20,lycee:20');
  await listeEst(page, '4 communes passent tes critères', ['Rhinval (67) · 52', 'Portmer (17) · 46', 'Grandeville (33) · 31', 'Quaibleu (13) · 9']);
});

test('AC-17 /?loyer=1200, « Supérieur » et « 20 min » : superieur:20, raisons et fiche ; « École » en plus ; dernière adresse réécrite', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200', { jeu: SIX_SERVICES });
  await toucher(niveau(page, 'Supérieur'));
  await toucher(tempsDe(page, 'Scolarité', 20));
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=superieur:20');
  await listeEst(page, '3 communes passent tes critères', ['Rhinval (67) · 52', 'Portmer (17) · 46', 'Grandeville (33) · 31']);

  await ficheDeCarte(page, 'Quaibleu');
  expect(await raisonsFiche(page)).toContain('Supérieur 25 min : au-dessus de ton plafond de 20 min');
  await ficheDeCarte(page, 'Terrebasse');
  expect(await raisonsFiche(page)).toContain("Supérieur plus d'une heure : au-dessus de ton plafond de 20 min");
  await ficheDeCarte(page, 'Portmer');
  expect(await textesFiche(page)).toContain('Supérieur : 18 min');
  await retour(page);

  await toucher(niveau(page, 'École'));
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=ecole:20,superieur:20');
  await listeEst(page, '3 communes passent tes critères', ['Rhinval (67) · 52', 'Portmer (17) · 46', 'Grandeville (33) · 31']);

  await ouvrir(page, '/?loyer=1200&services=superieur:15,lycee:10,superieur:10', { jeu: SIX_SERVICES });
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=lycee:10,superieur:10');
});

test('H153 : un temps sans niveau est incomplet ; décocher tout revient à vide ; retirer le dernier niveau d’une scolarité active la rend incomplète', async ({ page }) => {
  await ouvrir(page, '/?loyer=1200', { jeu: SIX_SERVICES });
  const { titre } = await categorieServices(page);
  await toucher(tempsDe(page, 'Scolarité', 5));
  await expect(phraseIncomplet(page)).toBeVisible();
  await titre.click();
  expect(nbsp(await titre.textContent())).toBe('ServicesPeu importe'); // incomplète : ne compte pas (H154)
  await titre.click();
  await toucher(tempsDe(page, 'Scolarité', 5));
  await expect(phraseIncomplet(page)).toHaveCount(0); // vide
  for (const g of ['Niveaux de scolarité', 'Scolarité'])
    await expect(reglagesZone(page).getByRole('group', { name: g, exact: true })).toHaveAccessibleDescription('');

  await toucher(niveau(page, 'Lycée'));
  await toucher(tempsDe(page, 'Scolarité', 10));
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=lycee:10');
  await expect(niveau(page, 'Lycée')).toHaveAttribute('aria-pressed', 'true');
  await toucher(niveau(page, 'Lycée'));
  await expect(phraseIncomplet(page)).toBeVisible();
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
  await listeEst(page, '5 communes passent tes critères', LISTE_AC1_MAIRIES);
});

// ---------------------------------------------------------------------------------------------------------------------
// Tâche 4 : l'erreur du fichier des temps dans la catégorie (R57, H168), le téléphone (R51, H48 d'interface-telephone).

const INDISPONIBLES = 'Temps des services indisponibles.';
/** Les réglages de « Services » : un temps de chaque ligne, un niveau, un type de gare. */
const reglagesServices = (page: Page) => [
  tempsDe(page, 'Médecin', 5),
  tempsDe(page, 'Urgences', 45),
  tempsDe(page, 'Supermarché', 15),
  niveau(page, 'École'),
  tempsDe(page, 'Scolarité', 20),
  typeGare(page, 'Régionale'),
  tempsDe(page, 'Gare', 30),
];
const LISTE_AC2 = ['Rhinval (67) · 52', 'Portmer (17) · 46', 'Grandeville (33) · 31', 'Quaibleu (13) · 9'];

test('AC-15 fichier des temps retardé : carte, liste et fiche « Chargement des temps… », réglages inactifs ; en erreur, catégorie et fiche disent l’erreur, « Réessayer » ; avec services=medecin:10, aucune liste avant le fichier', async ({ page }) => {
  await servirFixture(page, { jeu: SIX_SERVICES });
  const s = await retenirServices(page, SIX_SERVICES); // posée après servirFixture : elle gagne

  // 1. Le fichier retardé : la carte et la liste d'AC-1 de mairies sont là, les réglages inactifs, la fiche attend.
  await page.goto('/');
  await expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
  await expect.poll(() => s.etat.demandes).toBe(1);
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
  for (const b of reglagesServices(page)) await expect(b).toBeDisabled();
  await listeEst(page, '5 communes passent tes critères', LISTE_AC1_MAIRIES);
  await ficheDeListe(page, 'Portmer');
  expect(await sousChomage(page)).toEqual(['Services en voiture', 'Chargement des temps…']);
  // À l'arrivée : la fiche donne les temps, les réglages sont actifs.
  await s.repondre();
  await expect(fiche(page)).toContainText('Médecin : 4 min');
  await retour(page);
  await voirCriteres(page);
  for (const b of reglagesServices(page)) await expect(b).toBeEnabled();

  // 2. Rouverte avec le fichier en erreur : la catégorie et la fiche le disent, « Réessayer » ; la liste ne change pas.
  await page.goto('/');
  await expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
  await expect.poll(() => s.etat.demandes).toBe(2);
  await s.echouer();
  const { contenu } = await categorieServices(page);
  await expect(contenu.getByRole('alert')).toHaveText(INDISPONIBLES);
  await expect(contenu.getByRole('button', { name: 'Réessayer' })).toBeVisible();
  await listeEst(page, '5 communes passent tes critères', LISTE_AC1_MAIRIES);
  await ficheDeListe(page, 'Portmer');
  await expect(fiche(page).getByRole('alert')).toHaveText(INDISPONIBLES);
  // Le fichier rétabli, « Réessayer » de la fiche : ses temps.
  await fiche(page).getByRole('button', { name: 'Réessayer' }).click();
  await expect.poll(() => s.etat.demandes).toBe(3);
  await s.repondre();
  await expect(fiche(page)).toContainText('Médecin : 4 min');
  await expect(page.getByRole('alert')).toHaveCount(0);

  // 3. Avec services=medecin:10 et le fichier retardé : aucune liste avant son arrivée, puis celle d'AC-2. Une route à
  // part (posée en dernier, elle gagne) : la carte n'existe pas avant le fichier, `retenirServices` l'attendrait.
  let retenue: Route | null = null;
  await page.route('**/data/services.json', (r) => {
    retenue = r;
  });
  await page.goto('/?loyer=1200&services=medecin:10');
  await expect.poll(() => retenue != null).toBe(true);
  await page.waitForTimeout(500);
  await expect(page.locator('#titre-liste')).toHaveCount(0); // ni affichée, ni cachée dans un onglet
  await retenue!.fulfill({ json: servicesJson(SIX_SERVICES) });
  await listeEst(page, '4 communes passent tes critères', LISTE_AC2);
  expect(adresse(page)).toBe('/?loyer=1200&services=medecin:10');
});

// Hors AC (R57, H168 ; focus décidé par Claude) : 15 s sans réponse = erreur ; la catégorie dit l'erreur sous son titre,
// ses réglages restent affichés et inactifs ; son « Réessayer » ne relance que le fichier des temps et rend le focus au
// titre de la catégorie (le bouton disparaît). Horloge simulée (leçon 2026-10-13-delai-long-horloge-playwright).
test('R57 : fichier des temps sans réponse, erreur à 15 s dans la catégorie, réglages affichés et inactifs ; son « Réessayer » relance lui seul et rend le focus au titre', async ({ page }) => {
  await page.clock.install();
  await servirFixture(page, { jeu: SIX_SERVICES });
  const s = await retenirServices(page, SIX_SERVICES); // la demande reste sans réponse tant que le test ne répond pas
  const autres: string[] = [];
  page.on('request', (r) => r.url().includes('/data/') && !r.url().endsWith('/services.json') && autres.push(r.url()));
  await page.goto('/?loyer=1200');
  await expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
  await expect.poll(() => s.etat.demandes).toBe(1);
  // Le délai a commencé un peu avant cet instant t (la demande part dès la carte prête).
  const t = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(t + 1_000); // on est entre 1 s et 1 s + (t − départ) du délai
  const { titre, contenu } = await categorieServices(page);
  await voirCriteres(page);
  await page.clock.runFor(13_000); // ≈ 14 s : encore en chargement
  await expect(contenu.getByRole('alert')).toHaveCount(0);
  await page.clock.runFor(2_000); // ≈ 16 s : en erreur
  await expect(contenu.getByRole('alert')).toHaveText(INDISPONIBLES);
  await page.clock.resume();
  // Sous le titre, avant « Médecin » ; les réglages restent affichés, inactifs.
  const textes = (await contenu.locator('p, span, button').allTextContents()).map((x) => nbsp(x).trim());
  expect(textes.slice(0, 3)).toEqual([INDISPONIBLES, 'Réessayer', 'Médecin']);
  for (const b of reglagesServices(page)) {
    await expect(b).toBeVisible();
    await expect(b).toBeDisabled();
  }
  const avant = autres.length;

  await contenu.getByRole('button', { name: 'Réessayer' }).click();
  await expect(titre).toBeFocused();
  await expect.poll(() => s.etat.demandes).toBe(2);
  await expect(contenu.getByRole('alert')).toHaveCount(0);
  await expect(contenu.getByRole('button', { name: 'Réessayer' })).toHaveCount(0);
  await s.repondre();
  for (const b of reglagesServices(page)) await expect(b).toBeEnabled();
  expect(autres.length).toBe(avant); // aucune autre donnée redemandée
});

// Hors AC (focus décidé par Claude) : « Réessayer » de la fiche rend le focus au titre du bloc, qui reste à l'écran.
test('R57 : « Réessayer » de la fiche rend le focus au titre « Services en voiture »', async ({ page }) => {
  await servirFixture(page, { jeu: SIX_SERVICES });
  const s = await retenirServices(page, SIX_SERVICES);
  await page.goto('/?loyer=1200');
  await expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
  await expect.poll(() => s.etat.demandes).toBe(1);
  await s.echouer();
  await ficheDeListe(page, 'Portmer');
  await fiche(page).getByRole('button', { name: 'Réessayer' }).focus();
  await page.keyboard.press('Enter');
  const titreBloc = fiche(page).getByRole('heading', { level: 3, name: 'Services en voiture' });
  await expect(titreBloc).toBeFocused();
  await expect(titreBloc).toBeInViewport({ ratio: 1 });
  await s.repondre();
  await expect(fiche(page)).toContainText('Médecin : 4 min');
  await expect(titreBloc).toBeFocused();
});

test.describe('téléphone, au toucher', () => {
  test.use({ hasTouch: true });
  const criteres = (page: Page) => page.getByRole('tabpanel', { name: 'Critères' });
  const boite = async (l: { boundingBox: () => Promise<{ x: number; y: number; width: number; height: number } | null> }) => (await l.boundingBox())!;

  test('AC-12 390 × 844, « Critères » : « Services » suit « Tes proches » ; « 10 min » pour « Médecin », amenée à l’écran en défilant, entière, cochée au toucher ; services=medecin:10 ; repliée « 1 choix »', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'onglet « Critères » : sous 1 024 px, fenêtre de 390 × 844 du projet mobile');
    await ouvrir(page, '/', { jeu: SIX_SERVICES });
    await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
    await expect(criteres(page)).toBeVisible();
    const titres = (await criteres(page).getByRole('heading', { level: 2 }).allTextContents()).map((x) => nbsp(x).trim());
    expect(titres.indexOf('Services')).toBe(titres.indexOf('Tes proches') + 1);

    // L'onglet défile jusqu'à « Services » et sa pastille : entière, dans l'onglet et à l'écran ; un toucher la coche.
    const b = tempsDe(page, 'Médecin', 10);
    await expect(b).toBeEnabled();
    await amenerEnBas(b);
    const c = await boite(criteres(page));
    const p = await boite(b);
    expect(p.y).toBeGreaterThanOrEqual(c.y);
    expect(p.y + p.height).toBeLessThanOrEqual(Math.min(c.y + c.height, 844));
    expect(p.x).toBeGreaterThanOrEqual(0);
    expect(p.x + p.width).toBeLessThanOrEqual(390);
    await page.touchscreen.tap(p.x + p.width / 2, p.y + p.height / 2);
    await expect(b).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=medecin:10');

    const { titre } = await categorieServices(page);
    await titre.tap();
    await expect(titre).toHaveAttribute('aria-expanded', 'false');
    expect(nbsp(await titre.textContent())).toBe('Services1 choix');
  });

  // Hors AC (plan, tâche 4 : « une pastille touchée est amenée à l'écran, entière ») : une pastille à moitié sous le bas de
  // l'onglet, touchée sur sa partie visible, se coche et remonte entière.
  test('390 × 844 : une pastille à moitié cachée par le bas de l’onglet, touchée, se coche et vient entière à l’écran', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'onglet « Critères » : sous 1 024 px');
    await ouvrir(page, '/?loyer=1200', { jeu: SIX_SERVICES });
    const b = tempsDe(page, 'Gare', 30);
    await expect(b).toBeEnabled();
    // Le bas de l'onglet coupe la pastille en son milieu.
    await b.evaluate((el) => {
      const onglet = el.closest('[role="tabpanel"]') as HTMLElement;
      const r = el.getBoundingClientRect();
      onglet.scrollTop += r.bottom - r.height / 2 - onglet.getBoundingClientRect().bottom;
    });
    const c = await boite(criteres(page));
    const avant = await boite(b);
    expect(avant.y + avant.height).toBeGreaterThan(c.y + c.height); // coupée
    await page.touchscreen.tap(avant.x + avant.width / 2, (avant.y + c.y + c.height) / 2);
    await expect(b).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => (await boite(b)).y + (await boite(b)).height).toBeLessThanOrEqual(Math.min(c.y + c.height, 844));
    expect((await boite(b)).y).toBeGreaterThanOrEqual(c.y);
    await expect.poll(() => adresse(page)).toBe('/?loyer=1200&services=gare:30');
  });

  // Hors AC (H48 d'interface-telephone) : la catégorie « Services » ne pousse pas le curseur du prix hors de la feuille sur
  // le plus petit écran visé.
  test('375 × 548 : à l’ouverture, « Loyer maximum » entièrement visible dans la feuille ; « Services » plus bas dans l’onglet', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'fenêtre de téléphone fixée par le test');
    await page.setViewportSize({ width: 375, height: 548 });
    await ouvrir(page, '/', { jeu: SIX_SERVICES });
    const f = await boite(page.getByTestId('feuille'));
    const curseur = await boite(page.getByRole('slider', { name: 'Loyer maximum' }));
    expect(curseur.y).toBeGreaterThanOrEqual(f.y);
    expect(curseur.y + curseur.height).toBeLessThanOrEqual(548);
    const { titre } = await categorieServices(page);
    expect((await boite(titre)).y).toBeGreaterThan(curseur.y);
  });
});
