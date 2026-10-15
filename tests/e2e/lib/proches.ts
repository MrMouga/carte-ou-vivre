import { expect, type Page } from '@playwright/test';
import { apresRendu } from './carte';

// Gestes et lectures de la zone « Tes proches » (tâche 3), pour les tests qui suivent tests/e2e/proches.spec.ts.
// Un proche dure ≈ 2,85 s avec le faux service (file à 250 ms) : l'état prêt s'attend jusqu'à 10 s.

export const PRET_MS = 10_000;
const nbsp = (t: string | null) => (t ?? '').replace(/ /g, ' ');

export const zone = (page: Page) => page.getByRole('region', { name: 'Tes proches' });
export const liste = (page: Page) => page.getByRole('region', { name: 'Les 10 premières' });
export const champ = (page: Page) => zone(page).getByRole('textbox', { name: 'Adresse ou ville' });
export const plafond = (page: Page, nom: string) => page.getByRole('slider', { name: `Plafond de ${nom}` });
export const ligne = (page: Page, nom: string) => zone(page).getByRole('listitem').filter({ hasText: nom });

/** Lignes de la liste des 10 premières, par leur nom accessible (« 1 · Portmer (17) · 72 · 650 € · moins d'1 km »). */
export const lignes = async (page: Page) =>
  (await liste(page).getByRole('button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))).map(nbsp);

/** Liste sans proche sur /?loyer=1200&mer=50 (recalage de cadre-de-vie, D4 et D7) : 72, 48, 25. */
export const SANS_PROCHE = ["1 · Portmer (17) · 72 · 650 € · moins d'1 km", '2 · Quaibleu (13) · 48 · 1 092 € · 7 km', '3 · Grandeville (33) · 25 · 832 € · 40 km'];

/** Suggestions de la fixture : texte tapé → nom accessible de la suggestion (« Ligne 1, Ligne 2 »). */
export const ADRESSES = {
  Nantesville: ['1 rue Test', '1 rue Test, 44000 Nantesville'],
  Toulouseville: ['2 place Test', '2 place Test, 31000 Toulouseville'],
  Lyonville: ['3 rue Test', '3 rue Test, 69000 Lyonville'],
  Brestville: ['4 rue Test', '4 rue Test, 29000 Brestville'],
  Lilleville: ['5 rue Test', '5 rue Test, 59000 Lilleville'],
} as const;

/** Cherche, choisit la suggestion, garde le nom proposé, « Ajouter » (ouvre le champ par « + Ajouter un proche » s'il le faut). */
export async function ajouter(page: Page, commune: keyof typeof ADRESSES) {
  const [texte, suggestion] = ADRESSES[commune];
  if (!(await champ(page).isVisible())) await zone(page).getByRole('button', { name: '+ Ajouter un proche' }).click();
  await champ(page).fill(texte);
  await zone(page).getByRole('button', { name: suggestion }).click();
  await zone(page).getByRole('button', { name: 'Ajouter', exact: true }).click();
}

/** Attend que le proche `nom` soit prêt (son curseur de plafond apparaît). */
export async function pret(page: Page, nom: string, timeout = PRET_MS) {
  await expect(plafond(page, nom)).toBeVisible({ timeout });
  await apresRendu(page);
}

/** Règle le plafond de `nom` au clavier (→ : + 15 min). */
export async function regler(page: Page, nom: string, touche: string, fois = 1) {
  await plafond(page, nom).focus();
  for (let i = 0; i < fois; i++) await page.keyboard.press(touche);
  await apresRendu(page);
}

/** Entrées de proches dans le stockage du navigateur (R12) : clé et taille en caractères. */
export const memoire = (page: Page) =>
  page.evaluate(() =>
    Object.keys(localStorage)
      .filter((k) => k.startsWith('carte-ou-vivre:proche:'))
      .map((k) => ({ cle: k, taille: localStorage.getItem(k)!.length })),
  );
