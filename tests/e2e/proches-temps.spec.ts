import { expect, test, type Page } from '@playwright/test';
import { ouvrir } from './lib/carte';
import { servirIgn, type OptionsIgn } from './lib/ign';

// Tâche 2a (proches) : le calcul des temps d'un proche, sans interface — vrai module (recherche, file à 4 par seconde,
// classement dans le Web Worker) chargé dans la page, faux service IGN de la fixture. Les AC sont prouvés en tâche 2b.
// Recalé en tâche 1 de proches-fiables (R33, H92) : une zone en erreur est redemandée une fois et le calcul ne lève plus
// d'erreur ; il rend les temps et les zones obtenues.

type Sortie = { suggestions: unknown[]; fins?: number[]; zones?: number[]; erreur?: string; ms: number };
const DUREES = ['180', '165', '150', '135', '120', '105', '90', '75', '60', '45', '30', '15'];
const minutes = (u: string) => new URL(u).searchParams.get('costValue');

async function calculer(page: Page, texte: string, options: OptionsIgn = {}) {
  await ouvrir(page);
  const demandes = await servirIgn(page, options);
  // Les modules sont servis par le serveur Vite des tests, comme à la page.
  const sortie: Sortie = await page.evaluate(async ({ texte, modules }) => {
    const ign: typeof import('../../src/proches/ign') = await import(/* @vite-ignore */ modules.ign);
    const temps: typeof import('../../src/proches/temps') = await import(/* @vite-ignore */ modules.temps);
    const suggestions = await ign.rechercher(texte);
    const { reperes } = await fetch('/data/reperes.json').then((r) => r.json());
    const t0 = performance.now();
    try {
      const r = await ign.calculerTemps(temps.departDe(suggestions[0], () => undefined), temps.pointsDes(reperes));
      return { suggestions, fins: [...r.temps], zones: r.zones, ms: performance.now() - t0 };
    } catch (e) {
      return { suggestions, erreur: String(e), ms: performance.now() - t0 };
    }
  }, { texte, modules: { ign: '/src/proches/ign.ts', temps: '/src/proches/temps.ts' } });
  return { sortie, demandes };
}

test('« 1 rue Test » : suggestion au code INSEE, 12 zones de 3 h à 15 min, fins de tranche de la fixture', async ({ page }) => {
  const { sortie, demandes } = await calculer(page, '1 rue Test');
  expect(sortie.suggestions).toEqual([
    { libelle: '1 rue Test 44000 Nantesville', commune: 'Nantesville', dep: '44', code: '44999', point: [-2, 3], estCommune: false },
  ]);
  // Portmer 1 h, Grandeville 2 h 15, Montcher et Terrebasse 2 h 30, Quaibleu plus de 3 h (ordre de communes.json).
  expect(sortie.fins).toEqual([60, 135, 150, 150, 0]);
  expect(sortie.zones).toEqual([15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180]);
  expect(demandes.zones.map(minutes)).toEqual(DUREES);
  expect(demandes.zones.every((u) => new URL(u).searchParams.get('point') === '-2,3')).toBe(true);
  // File à 250 ms : 11 écarts avant la dernière zone, puis son délai.
  expect(sortie.ms).toBeGreaterThanOrEqual(11 * 250);
});

test('« 2 place Test » : autre proche, autres temps', async ({ page }) => {
  const { sortie } = await calculer(page, '2 place Test');
  expect(sortie.fins).toEqual([165, 75, 0, 105, 120]);
});

test('zones en panne (erreur réseau) : chaque zone redemandée une fois (24 demandes), aucune erreur levée, aucune zone obtenue (couverture 0)', async ({ page }) => {
  const { sortie, demandes } = await calculer(page, '1 rue Test', { trajets: 'panne' });
  expect(sortie.erreur).toBeUndefined();
  expect(sortie.zones).toEqual([]);
  expect(sortie.fins).toEqual([0, 0, 0, 0, 0]);
  expect(demandes.zones.map(minutes)).toEqual([...DUREES, ...DUREES]);
});

test('refus 429 de l’IGN : chaque zone redemandée une fois, 5 s au moins après son refus ; aucune erreur levée', async ({ page }) => {
  const { sortie, demandes } = await calculer(page, '1 rue Test', { trajets: '429' });
  expect(sortie.erreur).toBeUndefined();
  expect(sortie.zones).toEqual([]);
  expect(demandes.zones.map(minutes)).toEqual([...DUREES, ...DUREES]);
  // Heures des demandes côté faux service : le second essai de chaque zone part 5 s au moins après le premier.
  for (let i = 0; i < 12; i++) expect(demandes.heures[12 + i] - demandes.heures[i]).toBeGreaterThanOrEqual(5000);
});
