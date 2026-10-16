import { expect, test, type Page } from '@playwright/test';
import { ouvrir } from './lib/carte';
import { servirIgn } from './lib/ign';
import { ADRESSES, ajouter, champ, zone } from './lib/proches';
import { layout, size } from '../../src/theme/tokens';

// Tâche 5 (proches) : 390 px. Pendant l'ajout d'un proche, la feuille monte jusqu'à la bande de carte du haut, le champ et
// ses suggestions restent au-dessus du clavier (Figma 27:1160 : écran de 844 px, clavier dès y = 553) ; puis elle
// redescend. Cibles de 44 px au toucher (contrat). En bureau, le même parcours : le panneau ne bouge pas, tout reste visible.
// Le clavier n'existe pas dans le navigateur de test : on vérifie que tout tient au-dessus de sa ligne dans Figma.

const CLAVIER_Y = 553;
const AJOUTER = { name: 'Ajouter', exact: true } as const;
const COMMUNES = ['Nantesville', 'Toulouseville', 'Lyonville', 'Brestville', 'Lilleville'] as const;

const mobile = (page: Page) => page.viewportSize()!.width < layout['largeur-bureau'];
const boite = async (l: ReturnType<Page['locator']>) => (await l.boundingBox())!;
const feuille = (page: Page) => page.getByTestId('feuille');
/** Haut de la feuille au repos : elle couvre `part-feuille` de la hauteur (liste). */
const hautAuRepos = (page: Page) => page.viewportSize()!.height * (1 - layout['part-feuille']);

for (const n of [0, 1, 4]) {
  test(`champ au focus : la feuille est en haut et la première suggestion est visible (${n} proche${n > 1 ? 's' : ''} déjà là)`, async ({ page }) => {
    await ouvrir(page);
    await servirIgn(page);
    for (const c of COMMUNES.slice(0, n)) await ajouter(page, c); // ils calculent en file ; inutile d'attendre
    if (n) await zone(page).getByRole('button', { name: '+ Ajouter un proche' }).click();
    else await champ(page).click();
    await expect(champ(page)).toBeFocused();

    const [texte, nomSuggestion] = ADRESSES.Lilleville;
    await champ(page).fill(texte);
    const premiere = zone(page).getByRole('button', { name: nomSuggestion });
    await expect(premiere).toBeVisible();
    const hauteur = page.viewportSize()!.height;
    let s = await boite(premiere);
    let c = await boite(champ(page));

    if (mobile(page)) {
      // La feuille monte : elle part de la bande de carte (40 px) et va jusqu'en bas.
      const f = await boite(feuille(page));
      expect(f.y).toBe(size['taille-bande-carte']);
      expect(f.y + f.height).toBe(hauteur);
      // Champ et première suggestion dans la feuille, au-dessus du clavier, chacun de 44 px au moins.
      expect(c.y).toBeGreaterThan(f.y);
      expect(s.y).toBeGreaterThan(c.y + c.height);
      expect(s.y + s.height).toBeLessThanOrEqual(CLAVIER_Y);
      expect(c.height).toBeGreaterThanOrEqual(size['taille-toucher']);
      expect(s.height).toBeGreaterThanOrEqual(size['taille-toucher']);
      // Texte du champ à 16 px : sous 16 px, Safari sur iPhone agrandit la page au focus.
      await expect(champ(page)).toHaveCSS('font-size', `${size['taille-saisie']}px`);
      // La bande de carte au-dessus est nue : ni zoom ni légende (Figma 27:1160).
      await expect(page.getByRole('button', { name: 'Zoomer', exact: true })).toBeHidden();
      await expect(page.getByText('Score 0 → 100')).toBeHidden();
    } else {
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y + s.height).toBeLessThanOrEqual(hauteur);
    }

    // Suggestion choisie : le focus passe au « Nom » ; la feuille reste en haut, « Nom » et « Ajouter » au-dessus du clavier.
    await premiere.click();
    const nom = zone(page).getByRole('textbox', { name: 'Nom' });
    await expect(nom).toBeFocused();
    const ajout = zone(page).getByRole('button', AJOUTER);
    if (mobile(page)) {
      expect((await boite(feuille(page))).y).toBe(size['taille-bande-carte']);
      c = await boite(nom);
      s = await boite(ajout);
      expect(c.y + c.height).toBeLessThanOrEqual(CLAVIER_Y);
      expect(s.y + s.height).toBeLessThanOrEqual(CLAVIER_Y);
    }

    // « Ajouter » : l'ajout se referme, la feuille redescend à sa hauteur de repos, le nouveau proche est dans la zone.
    await ajout.click();
    await expect(zone(page).getByRole('listitem').filter({ hasText: 'Lilleville (59)' })).toBeVisible();
    if (mobile(page)) {
      await expect.poll(async () => Math.round((await boite(feuille(page))).y)).toBe(Math.round(hautAuRepos(page)));
      // La feuille montre « Tes proches » et la ligne du nouveau proche ; zoom et légende reviennent.
      const f = await boite(feuille(page));
      const titre = await boite(zone(page).getByRole('button', { name: 'Tes proches' }));
      if (n < 4) expect(titre.y).toBeGreaterThanOrEqual(f.y); // avec 4 proches, la ligne du 5e passe avant le titre
      await expect(zone(page).getByRole('listitem').filter({ hasText: 'Lilleville (59)' })).toBeInViewport();
      await expect(page.getByRole('button', { name: 'Zoomer', exact: true })).toBeVisible();
    }
  });
}

test('le focus sort de l’ajout sans rien ajouter : la feuille redescend', async ({ page }) => {
  await ouvrir(page);
  await servirIgn(page);
  await champ(page).click();
  await champ(page).fill(ADRESSES.Nantesville[0]);
  await expect(zone(page).getByRole('button', { name: ADRESSES.Nantesville[1] })).toBeVisible();
  if (mobile(page)) expect((await boite(feuille(page))).y).toBe(size['taille-bande-carte']);
  await page.keyboard.press('Shift+Tab'); // vers les tailles de ville, hors de l'ajout
  await expect(champ(page)).not.toBeFocused();
  if (mobile(page)) await expect.poll(async () => Math.round((await boite(feuille(page))).y)).toBe(Math.round(hautAuRepos(page)));
});

test('cibles des proches : 44 px de haut à 390 px, 24 px au moins en bureau', async ({ page }) => {
  await ouvrir(page);
  // Proches-fiables (recalage, tâche 3a) : la panne donne un proche à vol d'oiseau (R33, R35) : « Recalculer avec l'IGN »
  // et « Retirer », à la place de « Réessayer » et « Retirer ».
  await servirIgn(page, { trajets: 'panne' });
  await ajouter(page, 'Nantesville');
  // Proches-fiables R33 : chaque zone en erreur est redemandée une fois (24 demandes à 250 ms, ≈ 6 s) avant la fin du calcul.
  await expect(zone(page).getByRole('button', { name: "Recalculer avec l'IGN Nantesville (44)" })).toBeVisible({ timeout: 15_000 });
  const attendu = mobile(page) ? size['taille-toucher'] : size['taille-cible'];
  const hauteur = async (l: ReturnType<Page['locator']>) => (await boite(l)).height;

  const cibles = [
    zone(page).getByRole('button', { name: 'Tes proches' }),
    zone(page).getByRole('button', { name: 'Effacer mes proches' }),
    zone(page).getByRole('button', { name: "Recalculer avec l'IGN Nantesville (44)" }),
    zone(page).getByRole('button', { name: 'Retirer Nantesville (44)' }),
    zone(page).getByRole('button', { name: '+ Ajouter un proche' }),
  ];
  for (const l of cibles) expect(await hauteur(l), (await l.textContent()) ?? '').toBeGreaterThanOrEqual(attendu);

  await zone(page).getByRole('button', { name: '+ Ajouter un proche' }).click();
  await champ(page).fill(ADRESSES.Toulouseville[0]);
  const suggestion = zone(page).getByRole('button', { name: ADRESSES.Toulouseville[1] });
  await expect(suggestion).toBeVisible();
  for (const l of [champ(page), suggestion]) expect(await hauteur(l)).toBeGreaterThanOrEqual(attendu);
  await suggestion.click();
  for (const l of [zone(page).getByRole('textbox', { name: 'Nom' }), zone(page).getByRole('button', AJOUTER)]) {
    expect(await hauteur(l)).toBeGreaterThanOrEqual(attendu);
  }
});

test('après l’ajout du 5ᵉ proche, le focus va au message « 5 proches au maximum… »', async ({ page }) => {
  await ouvrir(page);
  await servirIgn(page);
  for (const c of COMMUNES) await ajouter(page, c);
  await expect(zone(page).getByText('5 proches au maximum. Retire-en un pour en ajouter un autre.')).toBeFocused();
});
