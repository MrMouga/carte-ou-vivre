import { expect, test, type Page } from '@playwright/test';
import { ouvrir, vue } from './lib/carte';
import { servirIgn } from './lib/ign';
import { ajouter, ligne, plafond, pret, zone } from './lib/proches';

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
