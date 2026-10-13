import { expect, test, type Page } from '@playwright/test';
import { ouvrir } from './lib/carte';
import { servirIgn, type OptionsIgn } from './lib/ign';

// Tâche 2a (proches) : le calcul des temps d'un proche, sans interface — vrai module (recherche, file à 4 par seconde,
// classement dans le Web Worker) chargé dans la page, faux service IGN de la fixture. Les AC sont prouvés en tâche 2b.

type Sortie = { suggestions: unknown[]; fins?: number[]; erreur?: string; ms: number };

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
      const fins: Uint16Array = await ign.calculerTemps(temps.departDe(suggestions[0], () => undefined), temps.pointsDes(reperes));
      return { suggestions, fins: [...fins], ms: performance.now() - t0 };
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
  expect(demandes.zones.map((u) => new URL(u).searchParams.get('costValue'))).toEqual(['180', '165', '150', '135', '120', '105', '90', '75', '60', '45', '30', '15']);
  expect(demandes.zones.every((u) => new URL(u).searchParams.get('point') === '-2,3')).toBe(true);
  // File à 250 ms : 11 écarts avant la dernière zone, puis son délai.
  expect(sortie.ms).toBeGreaterThanOrEqual(11 * 250);
});

test('« 2 place Test » : autre proche, autres temps', async ({ page }) => {
  const { sortie } = await calculer(page, '2 place Test');
  expect(sortie.fins).toEqual([165, 75, 0, 105, 120]);
});

test('zones en panne (erreur réseau) : le calcul échoue', async ({ page }) => {
  const { sortie } = await calculer(page, '1 rue Test', { trajets: 'panne' });
  expect(sortie.fins).toBeUndefined();
  expect(sortie.erreur).toContain('Failed to fetch');
});

test('refus 429 de l’IGN : le calcul échoue, sans demander les autres zones', async ({ page }) => {
  const { sortie, demandes } = await calculer(page, '1 rue Test', { trajets: '429' });
  expect(sortie.erreur).toContain('429');
  // La première zone (3 h) est refusée aussitôt : les suivantes, une toutes les 250 ms, ne partent plus.
  expect(demandes.zones.length).toBeLessThan(12);
});
