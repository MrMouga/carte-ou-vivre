import { expect, test, type Page } from '@playwright/test';
import { apresRendu, ouvrir, servirFixture, vue } from './lib/carte';
import { voirCriteres, voirListe } from './lib/feuille';
import { servirIgn, type OptionsIgn } from './lib/ign';
import { ADRESSES, ajouter, champ, ligne, liste, lignes, memoire, plafond, pret, regler, SANS_PROCHE, zone } from './lib/proches';
import { map as carte } from '../../src/theme/tokens';
import { empreinteDe } from '../../src/proches/memoire';
import * as ancienne from '../fixtures/memoire-56ac3d6';
import proches from '../../docs/specs/2026-10-13-proches/acceptance.json' with { type: 'json' };

// Proches fiables (spec docs/specs/2026-10-16-proches-fiables/) : un proche compte même quand l'IGN rame ou tombe.
// Faux service IGN de la fixture (tests/e2e/lib/ign.ts), pannes par zone de la fixture de proches-fiables ; chaque zone
// répond 1 s après sa demande (`delaiZoneMs: 1000`), une erreur aussi.

const DEPART = '/?loyer=1200&mer=50';
const ZONE_1_S = { delaiZoneMs: 1000 } as const;
const nbsp = (t: string | null) => (t ?? '').replace(/\u00a0/g, ' ');
const fiche = (page: Page) => page.getByRole('region', { name: /\(\d+\)$/ });
const texteFiche = async (page: Page) => nbsp(await fiche(page).innerText());
const minutes = (u: string) => Number(new URL(u).searchParams.get('costValue'));

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

test('AC-1 depuis /?loyer=1200&mer=50, panne « zone-135-une-fois » : Nantesville (44) prêt à 2 h, sans « Temps approximatifs » ni « Recalculer avec l’IGN » ; fiche de Grandeville « Nantesville (44) 2 h 15 : au-dessus de ton plafond de 2 h » ; zone de 135 min demandée deux fois, les 11 autres une fois', async ({ page }) => {
  await ouvrir(page, DEPART);
  const demandes = await servirIgn(page, { ...ZONE_1_S, panne: 'zone-135-une-fois' });
  await ajouter(page, 'Nantesville'); // nom proposé gardé
  await expect(ligne(page, 'Nantesville (44)')).toContainText('Calcul des trajets depuis Nantesville (44)…');
  await pret(page, 'Nantesville (44)', 20_000);

  await expect(plafond(page, 'Nantesville (44)')).toHaveAttribute('aria-valuenow', '120');
  await expect(ligne(page, 'Nantesville (44)')).toContainText(/2\sh/);
  await expect(zone(page)).not.toContainText('Calcul des trajets');
  await expect(zone(page)).not.toContainText('Temps approximatifs');
  await expect(zone(page)).not.toContainText("Recalculer avec l'IGN");

  await choisirSurLaCarte(page, 'B');
  await expect(fiche(page)).toContainText('Grandeville (33)');
  expect(await texteFiche(page)).toContain('Nantesville (44) 2 h 15 : au-dessus de ton plafond de 2 h');

  // Demandes de zones reçues par le faux service, dans l'ordre (minutes et heure depuis la première).
  const liste = demandes.zones.map((u, i) => `${minutes(u)} min à +${demandes.heures[i] - demandes.heures[0]} ms`);
  console.log(`AC-1 (${test.info().project.name}) demandes de zones :\n${liste.join('\n')}`);
  const fois = (d: number) => demandes.zones.filter((u) => minutes(u) === d).length;
  expect(fois(135)).toBe(2);
  for (const d of [15, 30, 45, 60, 75, 90, 105, 120, 150, 165, 180]) expect(fois(d), `zone de ${d} min`).toBe(1);
  expect(demandes.zones).toHaveLength(13);
});

/**
 * AC-2, après la fin du calcul (cas a et b) : la ligne du proche partiel, puis 2 h 30 (Portmer, Grandeville ; fiches de
 * Grandeville et de Portmer), puis 2 h 15 (Portmer seule ; raison de Grandeville).
 */
async function suiteAC2(page: Page) {
  const nantes = ligne(page, 'Nantesville (44)');
  await expect(nantes).toContainText("Temps approximatifs : l'IGN n'a pas tout donné.");
  await expect(nantes.getByRole('button', { name: "Recalculer avec l'IGN Nantesville (44)" })).toBeVisible();
  await expect(nantes).not.toContainText('Au-delà');
  await expect(zone(page)).not.toContainText('Trajets indisponibles');

  await regler(page, 'Nantesville (44)', 'ArrowRight', 2); // 2 h 30
  await expect(plafond(page, 'Nantesville (44)')).toHaveAttribute('aria-valuenow', '150');
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  await expect(liste(page)).toContainText('2 communes passent tes critères');
  expect(await lignes(page)).toEqual(["1 · Portmer (17) · 68 · 650 € · moins d'1 km", '2 · Grandeville (33) · 17 · 832 € · 40 km']);

  await choisirSurLaCarte(page, 'B');
  await expect(fiche(page)).toContainText('Grandeville (33)');
  expect(await texteFiche(page)).toContain("Nantesville (44) : jusqu'à 2 h 30 en voiture");
  await retour(page);
  await choisirSurLaCarte(page, 'A');
  await expect(fiche(page)).toContainText('Portmer (17)');
  expect(await texteFiche(page)).toContain('Nantesville (44) : 1 h en voiture');
  await retour(page);

  await voirCriteres(page); // 390 px : les réglages sont dans leur onglet
  await regler(page, 'Nantesville (44)', 'ArrowLeft'); // 2 h 15
  await expect(plafond(page, 'Nantesville (44)')).toHaveAttribute('aria-valuenow', '135');
  await voirListe(page);
  await expect(liste(page)).toContainText('1 commune passe tes critères');
  expect(await lignes(page)).toEqual(["1 · Portmer (17) · 66 · 650 € · moins d'1 km"]);
  await choisirSurLaCarte(page, 'B');
  await expect(fiche(page)).toContainText('Grandeville (33)');
  expect(await texteFiche(page)).toContain("Nantesville (44) jusqu'à 2 h 30 : au-dessus de ton plafond de 2 h 15");
}

test('AC-2 (a) depuis /?loyer=1200&mer=50, panne « zone-135-toujours » : calcul fini avant 45 s ; « Temps approximatifs », « Recalculer avec l’IGN » ; à 2 h 30, Portmer 68, Grandeville 17, « jusqu’à 2 h 30 » ; à 2 h 15, Portmer 66 seule', async ({ page }) => {
  test.setTimeout(60_000);
  await ouvrir(page, DEPART);
  await servirIgn(page, { ...ZONE_1_S, panne: 'zone-135-toujours' });
  await ajouter(page, 'Nantesville');
  const debut = Date.now();
  await expect(ligne(page, 'Nantesville (44)')).toContainText('Calcul des trajets depuis Nantesville (44)…');
  await pret(page, 'Nantesville (44)', 45_000);
  expect(Date.now() - debut).toBeLessThan(45_000);
  await suiteAC2(page);
});

test('AC-2 (b) depuis /?loyer=1200&mer=50, panne « zone-135-muette » (horloge simulée) : pas fini à 44 s du calcul, fini à 45 s ; puis comme le cas (a)', async ({ page }) => {
  test.setTimeout(60_000);
  await page.clock.install();
  await ouvrir(page, DEPART);
  await servirIgn(page, { ...ZONE_1_S, panne: 'zone-135-muette' });
  // Zones obtenues : les 11 réponses du faux service arrivent en temps réel (délai côté Node, hors de l'horloge de la page).
  let obtenues = 0;
  page.on('response', (r) => {
    if (r.url().includes('/navigation/isochrone') && r.status() === 200) obtenues++;
  });
  // Horloge figée (leçon « délai long et horloge Playwright ») : seul `runFor` fait avancer l'heure de la page. La
  // recherche part 300 ms après la frappe (ATTENTE_RECHERCHE_MS de src/ui/Proches.tsx).
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 5_000);
  const [texte, suggestion] = ADRESSES.Nantesville;
  await champ(page).fill(texte);
  await page.clock.runFor(300);
  await zone(page).getByRole('button', { name: suggestion }).click();
  await zone(page).getByRole('button', { name: 'Ajouter', exact: true }).click(); // on est à 0 s du calcul
  await expect(ligne(page, 'Nantesville (44)')).toContainText('Calcul des trajets depuis Nantesville (44)…');

  await page.clock.runFor(44_000); // 44 s : les 12 zones sont parties (une toutes les 250 ms), la zone de 135 min se tait
  await expect.poll(() => obtenues, { timeout: 10_000 }).toBe(11);
  await expect(ligne(page, 'Nantesville (44)')).toContainText('Calcul des trajets');
  await expect(plafond(page, 'Nantesville (44)')).toHaveCount(0);
  await page.clock.runFor(1_000); // 45 s : le calcul finit avec ce qu'il a
  await expect(plafond(page, 'Nantesville (44)')).toBeVisible();
  await page.clock.resume(); // la suite du test en temps normal
  await apresRendu(page);
  await suiteAC2(page);
});

test('AC-3 depuis /?loyer=1200&mer=50, panne « zone-180-toujours » : « Au-delà de 2 h 45 : l’IGN n’a pas répondu. », plafond au plus 2 h 45 ; à 2 h, Portmer 65 seule ; Quaibleu « plus de 2 h 45 : au-dessus de ton plafond de 2 h »', async ({ page }) => {
  test.setTimeout(60_000);
  await ouvrir(page, DEPART);
  await servirIgn(page, { ...ZONE_1_S, panne: 'zone-180-toujours' });
  await ajouter(page, 'Nantesville');
  await pret(page, 'Nantesville (44)', 45_000);
  const nantes = ligne(page, 'Nantesville (44)');
  await expect(nantes).toContainText("Au-delà de 2 h 45 : l'IGN n'a pas répondu.");
  await expect(nantes.getByRole('button', { name: "Recalculer avec l'IGN Nantesville (44)" })).toBeVisible();
  await expect(nantes).not.toContainText('Temps approximatifs');

  // Le plus haut possible : End, puis encore → (rien ne bouge au-delà de 2 h 45).
  await regler(page, 'Nantesville (44)', 'End');
  await regler(page, 'Nantesville (44)', 'ArrowRight');
  await expect(plafond(page, 'Nantesville (44)')).toHaveAttribute('aria-valuenow', '165');
  await expect(plafond(page, 'Nantesville (44)')).toHaveAttribute('aria-valuemax', '165');
  expect(nbsp(await plafond(page, 'Nantesville (44)').getAttribute('aria-valuetext'))).toBe('2 h 45 au plus');

  await regler(page, 'Nantesville (44)', 'ArrowLeft', 3); // 2 h
  await expect(plafond(page, 'Nantesville (44)')).toHaveAttribute('aria-valuenow', '120');
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  await expect(liste(page)).toContainText('1 commune passe tes critères');
  expect(await lignes(page)).toEqual(["1 · Portmer (17) · 65 · 650 € · moins d'1 km"]);
  await choisirSurLaCarte(page, 'E');
  await expect(fiche(page)).toContainText('Quaibleu (13)');
  expect(await texteFiche(page)).toContain('Nantesville (44) plus de 2 h 45 : au-dessus de ton plafond de 2 h');
});

test('AC-4 depuis /?loyer=1200&mer=50, panne « panne-totale » : Rochelleville (17) à vol d’oiseau, « 120 km au plus », « Recalculer avec l’IGN » ; « Trajets indisponibles » nulle part ; Portmer 70, Quaibleu 32, Grandeville 26 ; fiche de Grandeville « Rochelleville (17) : 88 km à vol d’oiseau »', async ({ page }) => {
  test.setTimeout(60_000);
  await ouvrir(page, DEPART);
  await servirIgn(page, { ...ZONE_1_S, panne: 'panne-totale' });
  await ajouter(page, 'Rochelleville'); // nom proposé gardé
  await expect(ligne(page, 'Rochelleville (17)')).toContainText('Calcul des trajets depuis Rochelleville (17)…');
  // R33 : chaque zone en erreur est redemandée une fois (24 demandes à 250 ms, ≈ 6 s), puis le calcul finit.
  await pret(page, 'Rochelleville (17)', 45_000);

  const rochelle = ligne(page, 'Rochelleville (17)');
  await expect(rochelle).toContainText("À vol d'oiseau : l'IGN ne répond pas.");
  await expect(plafond(page, 'Rochelleville (17)')).toHaveAttribute('aria-valuenow', '120');
  expect(nbsp(await plafond(page, 'Rochelleville (17)').getAttribute('aria-valuetext'))).toBe('120 km au plus');
  await expect(rochelle.getByRole('button', { name: "Recalculer avec l'IGN Rochelleville (17)" })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/trajets indisponibles/i);

  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  await expect(liste(page)).toContainText('3 communes passent tes critères');
  expect(await lignes(page)).toEqual([
    "1 · Portmer (17) · 70 · 650 € · moins d'1 km",
    '2 · Quaibleu (13) · 32 · 1 092 € · 7 km',
    '3 · Grandeville (33) · 26 · 832 € · 40 km',
  ]);

  await choisirSurLaCarte(page, 'B');
  await expect(fiche(page)).toContainText('Grandeville (33)');
  expect(await texteFiche(page)).toContain("Rochelleville (17) : 88 km à vol d'oiseau");
  await expect(page.locator('body')).not.toContainText(/trajets indisponibles/i);
});

const pastilles = (page: Page) => page.getByRole('list', { name: 'Temps vers tes proches' });
const pastille = (page: Page, nom: string) => pastilles(page).getByRole('listitem').filter({ hasText: nom });

test('AC-5 en bureau (1 440 px), panne « panne-totale », Rochelleville (17) à vol d’oiseau : à 90 km, Portmer 67, Grandeville 18 ; pastille « 90 km au plus », puis « 118 km · au-dessus de 90 km » avec Quaibleu ; fiche « Rochelleville (17) 118 km : au-dessus de ton plafond de 90 km » ; aucune zone demandée depuis la fin du calcul', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'AC-5 : largeur bureau (1 440 px) ; les pastilles n’existent qu’en bureau (AC-16 de proches)');
  test.setTimeout(60_000);
  await ouvrir(page, DEPART);
  const demandes = await servirIgn(page, { ...ZONE_1_S, panne: 'panne-totale' });
  // État final d'AC-4 : Rochelleville (17) à vol d'oiseau, 120 km.
  await ajouter(page, 'Rochelleville');
  await pret(page, 'Rochelleville (17)', 45_000);
  await expect(ligne(page, 'Rochelleville (17)')).toContainText("À vol d'oiseau : l'IGN ne répond pas.");
  await expect(plafond(page, 'Rochelleville (17)')).toHaveAttribute('aria-valuenow', '120');
  const apresCalcul = demandes.zones.length;

  await regler(page, 'Rochelleville (17)', 'ArrowLeft', 2); // 90 km
  await expect(plafond(page, 'Rochelleville (17)')).toHaveAttribute('aria-valuenow', '90');
  await expect(liste(page)).toContainText('2 communes passent tes critères');
  expect(await lignes(page)).toEqual(["1 · Portmer (17) · 67 · 650 € · moins d'1 km", '2 · Grandeville (33) · 18 · 832 € · 40 km']);

  // Le haut de la carte, avant le choix.
  await expect(pastille(page, 'Rochelleville (17)')).toBeVisible();
  expect(nbsp(await pastille(page, 'Rochelleville (17)').innerText())).toMatch(/^Rochelleville \(17\)\s*90 km au plus$/);

  await choisirSurLaCarte(page, 'E');
  await expect(fiche(page)).toContainText('Quaibleu (13)');
  await expect(pastille(page, 'Rochelleville (17)')).toBeVisible();
  expect(nbsp(await pastille(page, 'Rochelleville (17)').innerText())).toMatch(/^Rochelleville \(17\)\s*118 km · au-dessus de 90 km$/);
  expect(await texteFiche(page)).toContain('Rochelleville (17) 118 km : au-dessus de ton plafond de 90 km');
  expect(demandes.zones.length, 'zones demandées depuis la fin du calcul').toBe(apresCalcul);
});

// Hors AC (R33, tâche 3b) : un classement en échec (le module de classement ne se charge pas) finit comme un calcul sans
// zone, à vol d'oiseau, et non plus « Trajets indisponibles ».
test('classement en échec : Nantesville (44) passe à vol d’oiseau, « 120 km au plus », sans « Trajets indisponibles » ni « Réessayer »', async ({ page }) => {
  await ouvrir(page, DEPART);
  await servirIgn(page);
  await page.route('**/classer.worker*', (r) => r.abort());
  await ajouter(page, 'Nantesville');
  await pret(page, 'Nantesville (44)', 20_000);
  const nantes = ligne(page, 'Nantesville (44)');
  await expect(nantes).toContainText("À vol d'oiseau : l'IGN ne répond pas.");
  expect(nbsp(await plafond(page, 'Nantesville (44)').getAttribute('aria-valuetext'))).toBe('120 km au plus');
  await expect(page.locator('body')).not.toContainText(/trajets indisponibles/i);
  await expect(zone(page).getByRole('button', { name: /Réessayer/ })).toHaveCount(0);
});

/**
 * AC-10 : entrée de « Nantesville (44) » (plafond 2 h 15) telle que l'écrit la version précédente (code de 56ac3d6, copié
 * dans tests/fixtures/memoire-56ac3d6.ts), dans un stockage simulé ; rend sa clé et son texte.
 */
function entreeAncienne(p: Pick<ancienne.ProcheGarde, 'etat' | 'temps' | 'empreinte'>): [string, string] {
  const m = new Map<string, string>();
  const s = { setItem: (k: string, v: string) => void m.set(k, v) } as Storage;
  const [suggestion] = proches.fixture.services["recherche d'adresse (IGN) — suggestions par texte tapé"]['1 rue Test'].suggestions;
  const lieu = { libelle: suggestion.libelle, commune: suggestion.commune, dep: suggestion.dep, code: '44999', point: suggestion.point as [number, number], estCommune: false };
  ancienne.ecrireProche(s, { id: 1, nom: 'Nantesville (44)', lieu, depart: lieu.point, plafond: 135, ...p });
  return [...m.entries()][0];
}
const CODES = proches.fixture.items.map((it) => it.code_insee);
const CAS_AC10 = [
  ['a', 'indisponible', entreeAncienne({ etat: 'indisponible', temps: null, empreinte: null })],
  // Une carte d'avant où le code de Quaibleu était autre : les temps ne correspondent plus aux codes INSEE de la carte.
  ['b', 'prêt avec une empreinte périmée', entreeAncienne({ etat: 'pret', temps: Uint16Array.from([60, 135, 150, 150, 0]), empreinte: empreinteDe([...CODES.slice(0, 4), '99006']) })],
  ['c', 'pendant son calcul (page fermée avant la fin)', entreeAncienne({ etat: 'calcul', temps: null, empreinte: null })],
] as const;

for (const [cas, quoi, [cle, valeur]] of CAS_AC10)
  test(`AC-10 (${cas}) depuis /?loyer=1200&mer=50, Nantesville (44) gardé ${quoi} par la version précédente, plafond 2 h 15 : « Calcul des trajets depuis Nantesville (44)… », puis prêt à 2 h 15, « Trajets indisponibles » à aucun moment ; Portmer 66, Grandeville 17`, async ({ page }) => {
    // Entrée posée avant l'ouverture (une seule fois), et un guetteur qui note tout texte « Trajets indisponibles » affiché.
    await page.addInitScript(
      ([cle, valeur]) => {
        if (!sessionStorage.getItem('ac10-pose')) {
          localStorage.setItem(cle, valeur);
          sessionStorage.setItem('ac10-pose', '1');
        }
        const w = window as unknown as { vuIndisponible: boolean };
        w.vuIndisponible = false;
        new MutationObserver(() => {
          if (/trajets indisponibles/i.test(document.body?.textContent ?? '')) w.vuIndisponible = true;
        }).observe(document, { subtree: true, childList: true, characterData: true });
      },
      [cle, valeur],
    );
    await servirFixture(page);
    const demandes = await servirIgn(page, ZONE_1_S);
    await page.goto(DEPART);
    await expect(ligne(page, 'Nantesville (44)')).toContainText('Calcul des trajets depuis Nantesville (44)…');
    await expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
    await pret(page, 'Nantesville (44)', 20_000);

    await expect(plafond(page, 'Nantesville (44)')).toHaveAttribute('aria-valuenow', '135');
    await expect(ligne(page, 'Nantesville (44)')).toContainText(/2\sh\s15/);
    await expect(zone(page)).not.toContainText('Calcul des trajets');
    expect(demandes.zones).toHaveLength(12);
    await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
    await expect(liste(page)).toContainText('2 communes passent tes critères');
    expect(await lignes(page)).toEqual(["1 · Portmer (17) · 66 · 650 € · moins d'1 km", '2 · Grandeville (33) · 17 · 832 € · 40 km']);
    expect(await page.evaluate(() => (window as unknown as { vuIndisponible: boolean }).vuIndisponible)).toBe(false);
  });

// Hors AC (R36, tâche 4) : un proche gardé à vol d'oiseau ou partiel revient dans son état à la réouverture, sans calcul
// (son dernier essai date de moins de 15 min : aucun recalcul, même après la tâche 5a), avec les mêmes valeurs.
test('réouverture : Rochelleville (17) à vol d’oiseau et Nantesville (44) partiel reviennent tels quels, sans zone demandée ; même liste', async ({ page }) => {
  test.setTimeout(90_000);
  await ouvrir(page, DEPART);
  await servirIgn(page, { ...ZONE_1_S, panne: 'panne-totale' });
  await ajouter(page, 'Rochelleville');
  await pret(page, 'Rochelleville (17)', 45_000);
  await servirIgn(page, { ...ZONE_1_S, panne: 'zone-135-toujours' }); // posé après : il gagne
  await ajouter(page, 'Nantesville');
  await pret(page, 'Nantesville (44)', 45_000);
  await expect(ligne(page, 'Nantesville (44)')).toContainText("Temps approximatifs : l'IGN n'a pas tout donné.");
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  const avant = await lignes(page);

  const contexte = page.context();
  await page.close();
  const p = await contexte.newPage();
  await servirFixture(p);
  const demandes = await servirIgn(p, ZONE_1_S);
  await p.goto(DEPART);
  await expect(p.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
  await pret(p, 'Rochelleville (17)');
  await pret(p, 'Nantesville (44)');
  await expect(ligne(p, 'Rochelleville (17)')).toContainText("À vol d'oiseau : l'IGN ne répond pas.");
  expect(nbsp(await plafond(p, 'Rochelleville (17)').getAttribute('aria-valuetext'))).toBe('120 km au plus');
  await expect(ligne(p, 'Nantesville (44)')).toContainText("Temps approximatifs : l'IGN n'a pas tout donné.");
  await expect(plafond(p, 'Nantesville (44)')).toHaveAttribute('aria-valuemax', '180');
  await expect(zone(p)).not.toContainText('Calcul des trajets');
  await voirListe(p);
  expect(await lignes(p)).toEqual(avant);
  await p.waitForTimeout(500);
  expect(demandes.zones).toEqual([]);
});

// ——— Tâche 5a : recalcul à la réouverture (R36, D4, H93, H97, H98, H100) ———
// « Dernier essai il y a plus de 15 min / il y a 5 min » : la page rouverte prend une horloge simulée en avance de 16 ou de
// 5 min (`clock.install`, l'heure avance ensuite normalement) ; l'heure gardée du dernier essai est la vraie, celle du
// calcul joué avant. Quand le test lit la page pendant le recalcul, chaque zone répond 5 s après sa demande (recalcul
// d'au moins 7 s) pour que la lecture se fasse avant la fin.

const MIN = 60_000;
const ZONE_5_S = { delaiZoneMs: 5000 } as const;
const RECALCUL = "Recalcul avec l'IGN…";
const VOL = "À vol d'oiseau : l'IGN ne répond pas.";
const APPROX = "Temps approximatifs : l'IGN n'a pas tout donné.";

/** Joue AC-4 (panne totale, Rochelleville (17) à vol d'oiseau, 120 km), puis règle le plafond sur `km`. */
async function rochellevilleKm(page: Page, km: number) {
  await ouvrir(page, DEPART);
  await servirIgn(page, { ...ZONE_1_S, panne: 'panne-totale' });
  await ajouter(page, 'Rochelleville');
  await pret(page, 'Rochelleville (17)', 45_000);
  await expect(ligne(page, 'Rochelleville (17)')).toContainText(VOL);
  const pas = (km - 120) / 15;
  if (pas) await regler(page, 'Rochelleville (17)', pas > 0 ? 'ArrowRight' : 'ArrowLeft', Math.abs(pas));
  await expect(plafond(page, 'Rochelleville (17)')).toHaveAttribute('aria-valuenow', String(km));
}

/** Joue AC-2 cas (a) (zone de 135 min toujours en erreur), puis remet le plafond sur 2 h 30 (Grandeville à « jusqu'à 2 h 30 »). */
async function nantesvillePartiel(page: Page) {
  await ouvrir(page, DEPART);
  await servirIgn(page, { ...ZONE_1_S, panne: 'zone-135-toujours' });
  await ajouter(page, 'Nantesville');
  await pret(page, 'Nantesville (44)', 45_000);
  await expect(ligne(page, 'Nantesville (44)')).toContainText(APPROX);
  await regler(page, 'Nantesville (44)', 'ArrowRight', 2); // 2 h 30
  await expect(plafond(page, 'Nantesville (44)')).toHaveAttribute('aria-valuenow', '150');
}

/**
 * Ferme la page et en rouvre une dans le même navigateur, `minutes` plus tard pour la page (horloge simulée), avec le faux
 * IGN `ign` posé avant l'ouverture ; `avant` : scripts à poser avant l'ouverture. Rend la page et ses demandes.
 */
async function rouvrir(page: Page, minutes: number, ign: OptionsIgn = ZONE_1_S, avant?: (p: Page) => Promise<unknown>) {
  const contexte = page.context();
  await page.close();
  const p = await contexte.newPage();
  await p.clock.install({ time: Date.now() + minutes * MIN });
  await avant?.(p);
  await servirFixture(p);
  const demandes = await servirIgn(p, ign);
  await p.goto(DEPART);
  await expect(p.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
  return { p, demandes };
}

/** Attend la fin du recalcul du proche `nom` (« Recalcul avec l'IGN… » disparu de sa ligne). */
async function finRecalcul(page: Page, nom: string) {
  await expect(ligne(page, nom)).not.toContainText(RECALCUL, { timeout: 45_000 });
  await apresRendu(page);
}

const valeurTexte = async (page: Page, nom: string) => nbsp(await plafond(page, nom).getAttribute('aria-valuetext'));

test('AC-6 (a) depuis /?loyer=1200&mer=50, panne « zones-120-a-180-toujours », ajout de Rochelleville (17) : à vol d’oiseau, « 120 km au plus » ; Portmer 70, Quaibleu 32, Grandeville 26', async ({ page }) => {
  test.setTimeout(60_000);
  await ouvrir(page, DEPART);
  await servirIgn(page, { ...ZONE_1_S, panne: 'zones-120-a-180-toujours' });
  await ajouter(page, 'Rochelleville');
  await pret(page, 'Rochelleville (17)', 45_000);
  await expect(ligne(page, 'Rochelleville (17)')).toContainText(VOL);
  expect(await valeurTexte(page, 'Rochelleville (17)')).toBe('120 km au plus');
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  expect(await lignes(page)).toEqual([
    "1 · Portmer (17) · 70 · 650 € · moins d'1 km",
    '2 · Quaibleu (13) · 32 · 1 092 € · 7 km',
    '3 · Grandeville (33) · 26 · 832 € · 40 km',
  ]);
});

test('AC-6 (b) depuis /?loyer=1200&mer=50, panne « zones-135-a-180-toujours », ajout de Rochelleville (17) : en heures à 2 h, « Au-delà de 2 h : l’IGN n’a pas répondu. », plafond au plus 2 h ; Portmer 69, Quaibleu 36, Grandeville 29 ; Montcher « plus de 2 h : au-dessus de ton plafond de 2 h »', async ({ page }) => {
  test.setTimeout(60_000);
  await ouvrir(page, DEPART);
  await servirIgn(page, { ...ZONE_1_S, panne: 'zones-135-a-180-toujours' });
  await ajouter(page, 'Rochelleville');
  await pret(page, 'Rochelleville (17)', 45_000);
  const rochelle = ligne(page, 'Rochelleville (17)');
  await expect(rochelle).toContainText("Au-delà de 2 h : l'IGN n'a pas répondu.");
  await expect(rochelle).not.toContainText("À vol d'oiseau");
  await expect(plafond(page, 'Rochelleville (17)')).toHaveAttribute('aria-valuenow', '120');
  expect(await valeurTexte(page, 'Rochelleville (17)')).toBe('2 h au plus');
  await regler(page, 'Rochelleville (17)', 'End');
  await expect(plafond(page, 'Rochelleville (17)')).toHaveAttribute('aria-valuenow', '120');
  await expect(plafond(page, 'Rochelleville (17)')).toHaveAttribute('aria-valuemax', '120');
  await voirListe(page);
  await expect(liste(page)).toContainText('3 communes passent tes critères');
  expect(await lignes(page)).toEqual([
    "1 · Portmer (17) · 69 · 650 € · moins d'1 km",
    '2 · Quaibleu (13) · 36 · 1 092 € · 7 km',
    '3 · Grandeville (33) · 29 · 832 € · 40 km',
  ]);
  await choisirSurLaCarte(page, 'C');
  await expect(fiche(page)).toContainText('Montcher (75)');
  expect(await texteFiche(page)).toContain('Rochelleville (17) plus de 2 h : au-dessus de ton plafond de 2 h');
});

test('AC-6 (c) depuis /?loyer=1200&mer=50, Rochelleville (17) gardé à vol d’oiseau à 45 km, dernier essai il y a plus de 15 min, panne « zones-120-a-180-toujours » : à la réouverture, en heures à 45 min, « Au-delà de 1 h 45 : l’IGN n’a pas répondu. », plafond au plus 1 h 45 ; Portmer 48 seule', async ({ page }) => {
  test.setTimeout(90_000);
  await rochellevilleKm(page, 45);
  const { p } = await rouvrir(page, 16, { ...ZONE_1_S, panne: 'zones-120-a-180-toujours' });
  await expect(ligne(p, 'Rochelleville (17)')).toContainText(RECALCUL);
  await finRecalcul(p, 'Rochelleville (17)');
  const rochelle = ligne(p, 'Rochelleville (17)');
  await expect(rochelle).toContainText("Au-delà de 1 h 45 : l'IGN n'a pas répondu.");
  await expect(rochelle).not.toContainText("À vol d'oiseau");
  await expect(plafond(p, 'Rochelleville (17)')).toHaveAttribute('aria-valuenow', '45');
  expect(await valeurTexte(p, 'Rochelleville (17)')).toBe('45 min au plus');
  await regler(p, 'Rochelleville (17)', 'End');
  await expect(plafond(p, 'Rochelleville (17)')).toHaveAttribute('aria-valuemax', '105');
  await expect(plafond(p, 'Rochelleville (17)')).toHaveAttribute('aria-valuenow', '105');
  await regler(p, 'Rochelleville (17)', 'ArrowLeft', 4); // revient à 45 min
  await expect(plafond(p, 'Rochelleville (17)')).toHaveAttribute('aria-valuenow', '45');
  await voirListe(p);
  await expect(liste(p)).toContainText('1 commune passe tes critères');
  expect(await lignes(p)).toEqual(["1 · Portmer (17) · 48 · 650 € · moins d'1 km"]);
});

test('AC-7 depuis /?loyer=1200&mer=50, Nantesville (44) gardé partiel à 2 h 30, dernier essai il y a plus de 15 min, service de trajets rétabli : dès l’ouverture, « Recalcul avec l’IGN… » et Portmer 68, Grandeville 17 ; ensuite prêt à 2 h 30, Portmer 68, Grandeville 20 ; fiche de Grandeville « 2 h 15 en voiture »', async ({ page }) => {
  test.setTimeout(90_000);
  await nantesvillePartiel(page);
  const { p, demandes } = await rouvrir(page, 16, ZONE_5_S);
  const nantes = ligne(p, 'Nantesville (44)');
  await expect(nantes).toContainText(RECALCUL);
  await expect(nantes.getByRole('button', { name: /Recalculer avec l'IGN/ })).toHaveCount(0); // à la place du lien
  await expect(nantes).toContainText(APPROX); // l'état d'avant reste affiché
  await voirListe(p);
  expect(await lignes(p)).toEqual(["1 · Portmer (17) · 68 · 650 € · moins d'1 km", '2 · Grandeville (33) · 17 · 832 € · 40 km']);
  await voirCriteres(p);
  await expect(nantes).toContainText(RECALCUL); // la liste a été lue pendant le recalcul

  await finRecalcul(p, 'Nantesville (44)');
  await expect(nantes).not.toContainText('Temps approximatifs');
  await expect(nantes.getByRole('button', { name: /Recalculer avec l'IGN/ })).toHaveCount(0);
  await expect(plafond(p, 'Nantesville (44)')).toHaveAttribute('aria-valuenow', '150');
  await expect(plafond(p, 'Nantesville (44)')).toHaveAttribute('aria-valuemax', '180');
  expect(demandes.zones).toHaveLength(12);
  await voirListe(p);
  expect(await lignes(p)).toEqual(["1 · Portmer (17) · 68 · 650 € · moins d'1 km", '2 · Grandeville (33) · 20 · 832 € · 40 km']);
  await choisirSurLaCarte(p, 'B');
  await expect(fiche(p)).toContainText('Grandeville (33)');
  expect(await texteFiche(p)).toContain('Nantesville (44) : 2 h 15 en voiture');
});

/** AC-8 (a), (d) : Rochelleville (17) repassé en heures à 1 h 30 ; Portmer 65, Grandeville 22. */
async function rochellevilleEnHeures(p: Page) {
  const rochelle = ligne(p, 'Rochelleville (17)');
  await expect(rochelle).not.toContainText("À vol d'oiseau");
  await expect(plafond(p, 'Rochelleville (17)')).toHaveAttribute('aria-valuenow', '90');
  expect(await valeurTexte(p, 'Rochelleville (17)')).toBe('1 h 30 au plus');
  await voirListe(p);
  await expect(liste(p)).toContainText('2 communes passent tes critères');
  expect(await lignes(p)).toEqual(["1 · Portmer (17) · 65 · 650 € · moins d'1 km", '2 · Grandeville (33) · 22 · 832 € · 40 km']);
}

/** AC-8 (b), (d), (e) : Rochelleville (17) toujours à vol d'oiseau, 90 km. */
async function rochellevilleA90km(p: Page) {
  const rochelle = ligne(p, 'Rochelleville (17)');
  await expect(rochelle).toContainText(VOL);
  expect(await valeurTexte(p, 'Rochelleville (17)')).toBe('90 km au plus');
  await expect(rochelle.getByRole('button', { name: "Recalculer avec l'IGN Rochelleville (17)" })).toBeVisible();
}

test('AC-8 (a) depuis /?loyer=1200&mer=50, Rochelleville (17) gardé à vol d’oiseau à 90 km, dernier essai il y a plus de 15 min, IGN normal : à la réouverture, en heures à 1 h 30 ; Portmer 65, Grandeville 22', async ({ page }) => {
  test.setTimeout(90_000);
  await rochellevilleKm(page, 90);
  const { p, demandes } = await rouvrir(page, 16);
  await expect(ligne(p, 'Rochelleville (17)')).toContainText(RECALCUL);
  await finRecalcul(p, 'Rochelleville (17)');
  await rochellevilleEnHeures(p);
  expect(demandes.zones).toHaveLength(12);
});

test('AC-8 (b) depuis /?loyer=1200&mer=50, Rochelleville (17) gardé à vol d’oiseau à 90 km, dernier essai il y a plus de 15 min, panne « panne-totale » : après « Recalcul avec l’IGN… », toujours à vol d’oiseau à 90 km, sans « Temps approximatifs », « Trajets indisponibles » ni message d’erreur ; Portmer 67, Grandeville 18', async ({ page }) => {
  test.setTimeout(90_000);
  await rochellevilleKm(page, 90);
  const { p, demandes } = await rouvrir(page, 16, { ...ZONE_1_S, panne: 'panne-totale' });
  await expect(ligne(p, 'Rochelleville (17)')).toContainText(RECALCUL);
  await finRecalcul(p, 'Rochelleville (17)');
  expect(demandes.zones).toHaveLength(24); // R33 : chaque zone redemandée une fois
  await rochellevilleA90km(p);
  await expect(ligne(p, 'Rochelleville (17)')).not.toContainText('Temps approximatifs');
  await expect(p.locator('body')).not.toContainText(/trajets indisponibles/i);
  await expect(p.getByTestId('message-carte')).toHaveText('');
  await expect(zone(p).getByRole('button', { name: /Réessayer/ })).toHaveCount(0);
  await voirListe(p);
  expect(await lignes(p)).toEqual(["1 · Portmer (17) · 67 · 650 € · moins d'1 km", '2 · Grandeville (33) · 18 · 832 € · 40 km']);
});

test('AC-8 (c) depuis /?loyer=1200&mer=50, Nantesville (44) gardé partiel à 2 h 30, dernier essai il y a plus de 15 min, panne « panne-totale » : après « Recalcul avec l’IGN… », toujours partiel à 2 h 30, « Temps approximatifs », sans « À vol d’oiseau » ; Portmer 68, Grandeville 17', async ({ page }) => {
  test.setTimeout(90_000);
  await nantesvillePartiel(page);
  const { p } = await rouvrir(page, 16, { ...ZONE_1_S, panne: 'panne-totale' });
  const nantes = ligne(p, 'Nantesville (44)');
  await expect(nantes).toContainText(RECALCUL);
  await finRecalcul(p, 'Nantesville (44)');
  await expect(nantes).toContainText(APPROX);
  await expect(nantes).not.toContainText("À vol d'oiseau");
  await expect(plafond(p, 'Nantesville (44)')).toHaveAttribute('aria-valuenow', '150');
  expect(await valeurTexte(p, 'Nantesville (44)')).toBe('2 h 30 au plus');
  await voirListe(p);
  expect(await lignes(p)).toEqual(["1 · Portmer (17) · 68 · 650 € · moins d'1 km", '2 · Grandeville (33) · 17 · 832 € · 40 km']);
});

test('AC-8 (d) depuis /?loyer=1200&mer=50, Rochelleville (17) gardé à vol d’oiseau à 90 km, dernier essai il y a 5 min, IGN normal : à l’ouverture aucune zone demandée, toujours 90 km ; après « Recalculer avec l’IGN », en heures à 1 h 30 ; Portmer 65, Grandeville 22', async ({ page }) => {
  test.setTimeout(90_000);
  await rochellevilleKm(page, 90);
  const { p, demandes } = await rouvrir(page, 5);
  await pret(p, 'Rochelleville (17)');
  await p.waitForTimeout(1_000);
  expect(demandes.zones).toEqual([]);
  await expect(ligne(p, 'Rochelleville (17)')).not.toContainText(RECALCUL);
  await rochellevilleA90km(p);

  await ligne(p, 'Rochelleville (17)').getByRole('button', { name: "Recalculer avec l'IGN Rochelleville (17)" }).click();
  await expect(ligne(p, 'Rochelleville (17)')).toContainText(RECALCUL);
  await finRecalcul(p, 'Rochelleville (17)');
  expect(demandes.zones).toHaveLength(12);
  await rochellevilleEnHeures(p);
});

test('AC-8 (e) depuis /?loyer=1200&mer=50, Rochelleville (17) gardé à vol d’oiseau à 90 km, dernier essai il y a plus de 15 min, panne « panne-totale » : le recalcul échoue, toujours 90 km ; seconde réouverture 5 min après la première : aucune zone demandée', async ({ page }) => {
  test.setTimeout(90_000);
  await rochellevilleKm(page, 90);
  const premiere = await rouvrir(page, 16, { ...ZONE_1_S, panne: 'panne-totale' });
  await expect(ligne(premiere.p, 'Rochelleville (17)')).toContainText(RECALCUL);
  await finRecalcul(premiere.p, 'Rochelleville (17)');
  expect(premiere.demandes.zones).toHaveLength(24);
  await rochellevilleA90km(premiere.p);

  const seconde = await rouvrir(premiere.p, 21, { ...ZONE_1_S, panne: 'panne-totale' });
  await pret(seconde.p, 'Rochelleville (17)');
  await seconde.p.waitForTimeout(1_000);
  expect(seconde.demandes.zones).toEqual([]);
  await expect(ligne(seconde.p, 'Rochelleville (17)')).not.toContainText(RECALCUL);
  await rochellevilleA90km(seconde.p);
});

test('AC-12 (a) depuis /?loyer=1200&mer=50, panne « zone-180-toujours-rochelleville », Rochelleville (17) gardé à vol d’oiseau à 180 km, dernier essai il y a plus de 15 min : reste à vol d’oiseau à 180 km, « Recalculer avec l’IGN », aucun plafond de 2 h 45', async ({ page }) => {
  test.setTimeout(90_000);
  await rochellevilleKm(page, 180);
  const { p } = await rouvrir(page, 16, { ...ZONE_1_S, panne: 'zone-180-toujours-rochelleville' });
  await expect(ligne(p, 'Rochelleville (17)')).toContainText(RECALCUL);
  await finRecalcul(p, 'Rochelleville (17)');
  const rochelle = ligne(p, 'Rochelleville (17)');
  await expect(rochelle).toContainText(VOL);
  await expect(rochelle.getByRole('button', { name: "Recalculer avec l'IGN Rochelleville (17)" })).toBeVisible();
  await expect(plafond(p, 'Rochelleville (17)')).toHaveAttribute('aria-valuenow', '180');
  expect(await valeurTexte(p, 'Rochelleville (17)')).toBe('180 km au plus');
  expect(nbsp(await rochelle.innerText())).not.toContain('2 h 45');
});

test('AC-12 (b) depuis /?loyer=1200&mer=50, panne « zone-180-toujours-rochelleville », Rochelleville (17) gardé à vol d’oiseau à 165 km, dernier essai il y a plus de 15 min : en heures à 2 h 45, « Au-delà de 2 h 45 : l’IGN n’a pas répondu. », plafond au plus 2 h 45', async ({ page }) => {
  test.setTimeout(90_000);
  await rochellevilleKm(page, 165);
  const { p } = await rouvrir(page, 16, { ...ZONE_1_S, panne: 'zone-180-toujours-rochelleville' });
  await expect(ligne(p, 'Rochelleville (17)')).toContainText(RECALCUL);
  await finRecalcul(p, 'Rochelleville (17)');
  const rochelle = ligne(p, 'Rochelleville (17)');
  await expect(rochelle).toContainText("Au-delà de 2 h 45 : l'IGN n'a pas répondu.");
  await expect(rochelle).not.toContainText("À vol d'oiseau");
  await expect(plafond(p, 'Rochelleville (17)')).toHaveAttribute('aria-valuenow', '165');
  expect(await valeurTexte(p, 'Rochelleville (17)')).toBe('2 h 45 au plus');
  await regler(p, 'Rochelleville (17)', 'End');
  await expect(plafond(p, 'Rochelleville (17)')).toHaveAttribute('aria-valuemax', '165');
  await expect(plafond(p, 'Rochelleville (17)')).toHaveAttribute('aria-valuenow', '165');
});

// Hors AC (cas limite de details.md, R33, R36) : le curseur bougé pendant un recalcul décide, à l'arrivée du résultat, de
// l'état et de la conversion. Sans le geste, Rochelleville (17) resterait à vol d'oiseau (couverture 1 h 45 < 120 km).
test('recalcul : curseur bougé de 120 à 90 km pendant le recalcul, l’IGN donne jusqu’à 1 h 45 → en heures à 1 h 30, « Au-delà de 1 h 45 »', async ({ page }) => {
  test.setTimeout(90_000);
  await rochellevilleKm(page, 120);
  const { p } = await rouvrir(page, 16, { ...ZONE_5_S, panne: 'zones-120-a-180-toujours' });
  await expect(ligne(p, 'Rochelleville (17)')).toContainText(RECALCUL);
  await regler(p, 'Rochelleville (17)', 'ArrowLeft', 2); // 90 km, curseur réglable pendant le recalcul
  await expect(plafond(p, 'Rochelleville (17)')).toHaveAttribute('aria-valuenow', '90');
  await expect(ligne(p, 'Rochelleville (17)')).toContainText(RECALCUL); // réglé pendant le recalcul
  await finRecalcul(p, 'Rochelleville (17)');
  const rochelle = ligne(p, 'Rochelleville (17)');
  await expect(rochelle).toContainText("Au-delà de 1 h 45 : l'IGN n'a pas répondu.");
  await expect(rochelle).not.toContainText("À vol d'oiseau");
  expect(await valeurTexte(p, 'Rochelleville (17)')).toBe('1 h 30 au plus');
});

// Hors AC (H100) : pendant un recalcul, rien de nouveau dans les zones d'annonce de la page (le compte `role=status`, le
// message de la carte, l'avis de la recherche) : ni texte changé, ni zone nouvelle. « Recalcul avec l'IGN… » est un texte
// de la ligne, hors de toute zone d'annonce.
test('recalcul : les zones d’annonce de la page ne changent pas pendant le recalcul de Nantesville (44), ni à son arrivée', async ({ page }) => {
  test.setTimeout(90_000);
  await nantesvillePartiel(page);
  const guetteur = (p: Page) =>
    p.addInitScript(() => {
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
  const { p } = await rouvrir(page, 16, ZONE_5_S, guetteur);
  await expect(ligne(p, 'Nantesville (44)')).toContainText(RECALCUL);
  await expect(p.getByRole('status')).toHaveText('2 communes passent tes critères');
  // Le chargement de la carte est fini, son indicateur parti (il reste au moins 300 ms après la carte prête, H9) : son
  // retrait n'est pas une annonce du recalcul (tâche 5b : il tombait parfois après la remise à zéro du guetteur).
  await expect(p.getByTestId('message-carte')).toHaveText('');
  await p.evaluate(() => ((window as unknown as { annonces: string[] }).annonces = []));
  await expect(ligne(p, 'Nantesville (44)')).toContainText(RECALCUL); // on est encore pendant le recalcul
  expect(await ligne(p, 'Nantesville (44)').evaluate((el) => el.closest('[role="status"], [role="alert"], [aria-live]'))).toBeNull();
  await finRecalcul(p, 'Nantesville (44)');
  await expect(plafond(p, 'Nantesville (44)')).toHaveAttribute('aria-valuemax', '180'); // prêt
  await p.waitForTimeout(500);
  expect(await p.evaluate(() => (window as unknown as { annonces: string[] }).annonces)).toEqual([]);
  await expect(p.getByRole('status')).toHaveText('2 communes passent tes critères');
});

// ——— Tâche 5b : « Recalculer avec l'IGN », priorité d'un ajout, « Retirer » pendant un recalcul (R36, D4, H98) ———
// Chaque zone répond 5 s après sa demande quand le test lit la page pendant un recalcul (comme en tâche 5a).

/** Point de départ d'une demande de zone (« 0.5,0.5 » pour Rochelleville). */
const pointDe = (u: string) => new URL(u).searchParams.get('point');
const POINT = { Nantesville: '-2,3', Toulouseville: '3,-2', Rochelleville: '0.5,0.5' } as const;

test('AC-9 depuis /?loyer=1200&mer=50, Rochelleville (17) à vol d’oiseau à 120 km (AC-4), service de trajets rétabli : après « Recalculer avec l’IGN », « Recalcul avec l’IGN… » et Portmer 70, Quaibleu 32, Grandeville 26 ; ensuite prêt à 2 h, « 3 communes passent tes critères », Portmer 69, Quaibleu 36, Grandeville 29', async ({ page }) => {
  test.setTimeout(90_000);
  await rochellevilleKm(page, 120);
  const demandes = await servirIgn(page, ZONE_5_S); // rétabli : posé après, il gagne
  const rochelle = ligne(page, 'Rochelleville (17)');
  await rochelle.getByRole('button', { name: "Recalculer avec l'IGN Rochelleville (17)" }).click();

  await expect(rochelle).toContainText(RECALCUL);
  await expect(rochelle.getByRole('button', { name: /Recalculer avec l'IGN/ })).toHaveCount(0);
  await expect(rochelle).toContainText(VOL); // l'état d'avant reste affiché et compte
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  await expect(liste(page)).toContainText('3 communes passent tes critères');
  expect(await lignes(page)).toEqual([
    "1 · Portmer (17) · 70 · 650 € · moins d'1 km",
    '2 · Quaibleu (13) · 32 · 1 092 € · 7 km',
    '3 · Grandeville (33) · 26 · 832 € · 40 km',
  ]);
  await voirCriteres(page);
  await expect(rochelle).toContainText(RECALCUL); // la liste a été lue pendant le recalcul

  await finRecalcul(page, 'Rochelleville (17)');
  await expect(rochelle).not.toContainText("À vol d'oiseau");
  await expect(rochelle).not.toContainText('Temps approximatifs');
  await expect(rochelle.getByRole('button', { name: /Recalculer avec l'IGN/ })).toHaveCount(0);
  await expect(plafond(page, 'Rochelleville (17)')).toHaveAttribute('aria-valuenow', '120');
  await expect(plafond(page, 'Rochelleville (17)')).toHaveAttribute('aria-valuemax', '180');
  expect(await valeurTexte(page, 'Rochelleville (17)')).toBe('2 h au plus');
  expect(demandes.zones).toHaveLength(12);
  await voirListe(page);
  await expect(liste(page)).toContainText('3 communes passent tes critères');
  expect(await lignes(page)).toEqual([
    "1 · Portmer (17) · 69 · 650 € · moins d'1 km",
    '2 · Quaibleu (13) · 36 · 1 092 € · 7 km',
    '3 · Grandeville (33) · 29 · 832 € · 40 km',
  ]);
});

/** Nantesville (44) partiel à 2 h 30 (comme AC-7), puis Rochelleville (17) à vol d'oiseau à 120 km (comme AC-9), gardés. */
async function deuxApproximatifs(page: Page) {
  await nantesvillePartiel(page);
  await servirIgn(page, { ...ZONE_1_S, panne: 'panne-totale' }); // posé après : il gagne
  await ajouter(page, 'Rochelleville');
  await pret(page, 'Rochelleville (17)', 45_000);
  await expect(ligne(page, 'Rochelleville (17)')).toContainText(VOL);
  await expect(plafond(page, 'Rochelleville (17)')).toHaveAttribute('aria-valuenow', '120');
}

test('AC-11 depuis /?loyer=1200&mer=50, Nantesville (44) partiel puis Rochelleville (17) à vol d’oiseau gardés, dernier essai il y a plus de 15 min, service rétabli : ajout de Toulouseville (31) pendant le recalcul de Nantesville (44) → « En attente… », puis « Calcul des trajets depuis Toulouseville (31)… » ; aucune zone de Rochelleville (17) avant que Toulouseville (31) soit prêt ; les trois prêts, Rochelleville (17) à 2 h', async ({ page }) => {
  test.setTimeout(120_000);
  await deuxApproximatifs(page);
  // À chaque demande de zone de Rochelleville (17), on note si Toulouseville (31) est déjà prêt (son curseur affiché),
  // puis la demande passe au faux IGN.
  const rochelleAvantToulouse: boolean[] = [];
  const guetter = (p: Page) =>
    p.route('https://data.geopf.fr/navigation/isochrone*', async (r) => {
      if (pointDe(r.request().url()) === POINT.Rochelleville)
        rochelleAvantToulouse.push((await p.getByRole('slider', { name: 'Plafond de Toulouseville (31)' }).count()) === 0);
      await r.fallback();
    });
  const { p, demandes } = await rouvrir(page, 16, ZONE_5_S);
  await guetter(p); // posé après le faux IGN : il passe d'abord, puis lui laisse la demande
  const nantes = ligne(p, 'Nantesville (44)');
  await expect(nantes).toContainText(RECALCUL);
  await expect(ligne(p, 'Rochelleville (17)')).toContainText(RECALCUL); // attend son tour
  await expect.poll(() => demandes.zones.filter((u) => pointDe(u) === POINT.Nantesville).length).toBeGreaterThan(0);

  await ajouter(p, 'Toulouseville');
  const toulouse = ligne(p, 'Toulouseville (31)');
  await expect(toulouse).toContainText('En attente…');
  await expect(nantes).toContainText(RECALCUL); // tant que Nantesville (44) se recalcule

  await expect(toulouse).toContainText('Calcul des trajets depuis Toulouseville (31)…', { timeout: 45_000 });
  await expect(nantes).not.toContainText(RECALCUL);
  await expect(ligne(p, 'Rochelleville (17)')).toContainText(RECALCUL); // toujours derrière
  await pret(p, 'Toulouseville (31)', 45_000);
  await finRecalcul(p, 'Rochelleville (17)');

  // Les trois prêts : aucune phrase d'approximation, aucun lien, curseurs jusqu'à 3 h.
  for (const nom of ['Nantesville (44)', 'Rochelleville (17)', 'Toulouseville (31)']) {
    await expect(plafond(p, nom)).toHaveAttribute('aria-valuemax', '180');
    await expect(ligne(p, nom)).not.toContainText('Temps approximatifs');
    await expect(ligne(p, nom)).not.toContainText("À vol d'oiseau");
    await expect(ligne(p, nom).getByRole('button', { name: /Recalculer avec l'IGN/ })).toHaveCount(0);
  }
  await expect(plafond(p, 'Rochelleville (17)')).toHaveAttribute('aria-valuenow', '120');
  expect(await valeurTexte(p, 'Rochelleville (17)')).toBe('2 h au plus');

  const ordre = demandes.zones.map(pointDe);
  console.log(`AC-11 (${test.info().project.name}) départs des demandes de zones, dans l'ordre : ${ordre.join(' ; ')}`);
  for (const point of Object.values(POINT)) expect(ordre.filter((x) => x === point), `zones depuis ${point}`).toHaveLength(12);
  expect(rochelleAvantToulouse).toHaveLength(12);
  expect(rochelleAvantToulouse.filter(Boolean), 'zones de Rochelleville (17) demandées avant Toulouseville (31) prêt').toEqual([]);
  expect(ordre.lastIndexOf(POINT.Toulouseville)).toBeLessThan(ordre.indexOf(POINT.Rochelleville));
});

// Hors AC (R36, details.md « Interactions ») : « Retirer » pendant un recalcul — le proche disparaît ; son recalcul en
// cours s'arrête (aucune zone ne part plus), celui qui attendait son tour ne part pas ; la mémoire ne les garde plus.
test('recalcul : « Retirer » Rochelleville (17) qui attend son tour puis Nantesville (44) qui se recalcule → plus aucune zone demandée, ni l’un ni l’autre gardé ; liste sans proche', async ({ page }) => {
  test.setTimeout(120_000);
  await deuxApproximatifs(page);
  const { p, demandes } = await rouvrir(page, 16, ZONE_5_S);
  const depuis = (point: string) => demandes.zones.filter((u) => pointDe(u) === point).length;
  await expect(ligne(p, 'Nantesville (44)')).toContainText(RECALCUL);
  await expect(ligne(p, 'Rochelleville (17)')).toContainText(RECALCUL);
  await expect.poll(() => depuis(POINT.Nantesville)).toBeGreaterThan(0);

  await zone(p).getByRole('button', { name: 'Retirer Rochelleville (17)' }).click();
  await expect(ligne(p, 'Rochelleville (17)')).toHaveCount(0);
  await expect(ligne(p, 'Nantesville (44)')).toContainText(RECALCUL); // le recalcul en cours continue
  await zone(p).getByRole('button', { name: 'Retirer Nantesville (44)' }).click();
  await expect(ligne(p, 'Nantesville (44)')).toHaveCount(0);
  await p.waitForTimeout(300); // une demande déjà partie au moment du clic arrive au faux IGN
  const nantesAuRetrait = depuis(POINT.Nantesville);
  console.log(`retirer pendant un recalcul (${test.info().project.name}) : ${nantesAuRetrait} zones de Nantesville (44) parties avant le retrait`);

  await p.waitForTimeout(6_000); // plus long qu'une zone (5 s) : un recalcul qui continuerait demanderait encore
  expect(depuis(POINT.Nantesville), 'zones de Nantesville (44) après le retrait').toBe(nantesAuRetrait);
  expect(depuis(POINT.Rochelleville), 'zones de Rochelleville (17)').toBe(0);
  expect(await memoire(p)).toEqual([]);
  await voirListe(p);
  expect(await lignes(p)).toEqual(SANS_PROCHE);
});
