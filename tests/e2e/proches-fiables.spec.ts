import { expect, test, type Page } from '@playwright/test';
import { apresRendu, ouvrir, vue } from './lib/carte';
import { voirCriteres, voirListe } from './lib/feuille';
import { servirIgn } from './lib/ign';
import { ADRESSES, ajouter, champ, ligne, liste, lignes, plafond, pret, regler, zone } from './lib/proches';
import { map as carte } from '../../src/theme/tokens';

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
