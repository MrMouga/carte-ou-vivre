import { expect, test } from '@playwright/test';
import { attendreCouleurs, servirFixture, vue } from './lib/carte';
import { readPixels } from './lib/pixels';
import { color } from '../../src/theme/tokens';

// Tâche 5b : états de la page (chargement, erreur, pas de WebGL), fond de secours (R8) et mentions.
const message = (page: import('@playwright/test').Page) => page.getByTestId('message-carte');
const prete = (page: import('@playwright/test').Page) => expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');

test('AC-15 fond IGN en panne : A, E, B colorées sur le fond uni, « Fond de carte indisponible », 3 communes passent', async ({ page }) => {
  await servirFixture(page, { fondEnPanne: true });
  await page.goto('/');
  await prete(page);
  await expect(page.getByTestId('carte')).toHaveAttribute('data-fond', 'secours');
  await attendreCouleurs(page, { A: 'score-4', E: 'score-3', B: 'score-2' });
  await expect(message(page)).toHaveText('Fond de carte indisponible');
  await expect(page.getByRole('status')).toHaveText('3 communes passent tes critères');
  // R8 : les communes qui ne passent pas sont peintes en gris, et la légende le dit.
  const { lecture } = vue(page);
  const [c, d] = await readPixels(page, [lecture('C'), lecture('D')]);
  const gris = [1, 3, 5].map((i) => parseInt(color['area-excluded'].slice(i, i + 2), 16));
  for (const px of [c, d]) expect(Math.max(...px.map((v, i) => Math.abs(v - gris[i])))).toBeLessThanOrEqual(3);
  await expect(page.getByText('Ne passe pas', { exact: true })).toBeVisible();
});

test('fond rétabli : nouvel essai après 60 s, retour au fond IGN', async ({ page }) => {
  await page.clock.install();
  await servirFixture(page, { fondEnPanne: true });
  await page.goto('/');
  await prete(page);
  await expect(message(page)).toHaveText('Fond de carte indisponible');
  await servirFixture(page); // le fond répond de nouveau (les dernières routes posées passent devant)
  await page.clock.fastForward(59_000);
  await expect(page.getByTestId('carte')).toHaveAttribute('data-fond', 'secours');
  await page.clock.fastForward(1_000);
  await expect(page.getByTestId('carte')).toHaveAttribute('data-fond', 'ign');
  await expect(message(page)).toHaveText('');
  await expect(page.getByText('Non colorée : ne passe pas')).toBeVisible();
  await expect(async () => attendreCouleurs(page, { A: 'score-4', C: null })).toPass();
});

test('chargement : indicateur après 300 ms, réglages inactifs ; erreur et « Réessayer » à 15 s (horloge simulée)', async ({ page }) => {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1);
  await servirFixture(page);
  await page.route('**/data/communes.json', () => {}); // les données n'arrivent jamais
  await page.goto('/');
  await expect(page.getByRole('slider', { name: 'Loyer maximum' })).toHaveAttribute('data-disabled', '');
  await page.clock.runFor(298);
  await expect(message(page)).toHaveText('');
  await page.clock.runFor(2);
  await expect(message(page)).toHaveText('Chargement de la carte…');
  await page.clock.runFor(14_700);
  await expect(message(page)).toContainText("La carte n'a pas pu se charger.");
  await expect(page.getByRole('button', { name: 'Réessayer' })).toBeVisible();
});

// La durée minimale de 300 ms est prouvée par src/domain/chargement.test.ts ; ici, le branchement sur la vraie page.
test('chargement : données arrivées après 350 ms, l’indicateur s’efface quand la carte est prête', async ({ page }) => {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1);
  await servirFixture(page);
  let lacher!: () => void;
  const donnees = new Promise<void>((r) => (lacher = r));
  await page.route('**/data/communes.json', async (r) => {
    await donnees;
    await r.fallback();
  });
  await page.goto('/');
  await page.clock.runFor(350);
  await expect(message(page)).toHaveText('Chargement de la carte…');
  lacher();
  await page.clock.resume();
  await prete(page);
  await expect(message(page)).toHaveText('');
});

test('sans WebGL : « La carte n’a pas pu se charger. » et « Réessayer »', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return (getContext as (...a: unknown[]) => RenderingContext | null).call(this, type, ...rest);
    } as typeof getContext;
  });
  await servirFixture(page);
  await page.goto('/');
  await expect(message(page)).toContainText("La carte n'a pas pu se charger.");
  await page.getByRole('button', { name: 'Réessayer' }).click();
  await expect(message(page)).toContainText("La carte n'a pas pu se charger.");
});

test('mentions de la tranche visibles dans le pied de page', async ({ page }) => {
  await servirFixture(page);
  await page.goto('/');
  const pied = page.getByRole('contentinfo');
  for (const t of [
    'Estimations ANIL, à partir des données du Groupe SeLoger et de leboncoin',
    '© Shom-IGN, 2021',
    'Source : Insee, populations légales',
    "Contours des communes : Etalab, d'après Admin Express © IGN",
    '© IGN – Géoplateforme',
  ])
    await expect(pied).toContainText(t);
  await expect(pied.getByRole('link', { name: 'Shom' })).toHaveAttribute('href', 'https://www.shom.fr');
  await expect(pied.getByRole('link', { name: 'IGN', exact: true })).toHaveAttribute('href', 'https://www.ign.fr');
});
