import { expect, test, type Page } from '@playwright/test';
import loyerMer from '../../docs/specs/2026-10-12-loyer-mer/acceptance.json' with { type: 'json' };
import { apresRendu, ouvrir, servirFixture } from './lib/carte';
import { voirListe } from './lib/feuille';
import { servirIgn, type OptionsIgn } from './lib/ign';
import { ADRESSES, SANS_PROCHE, ajouter, champ, liste, lignes, ligne, memoire, plafond, pret, regler, zone } from './lib/proches';

// Tâche 3 (proches) : états d'un proche et de la zone, pannes, mémoire du navigateur (R9, R12, R13, H21).
// Faux service IGN de la fixture (tests/e2e/lib/ign.ts), posé après le fond de carte. « Fermer la page puis rouvrir » :
// une nouvelle page du même contexte de navigateur (même stockage), qui compte ses demandes au service dès l'ouverture.

const AJOUTER = { name: 'Ajouter', exact: true } as const;
const INDISPONIBLE_44 = 'Trajets indisponibles depuis Nantesville (44).';

/**
 * Ferme la page et rouvre « /?loyer=1200&mer=50 » dans le même navigateur (recalage de cadre-de-vie : réglage explicite) ;
 * rend la nouvelle page et ses demandes au faux service.
 */
const DEPART = '/?loyer=1200&mer=50';
async function rouvrir(page: Page, options: OptionsIgn = {}, avantOuverture?: (p: Page) => Promise<unknown>) {
  const contexte = page.context();
  await page.close();
  const p = await contexte.newPage();
  await servirFixture(p);
  await avantOuverture?.(p);
  const demandes = await servirIgn(p, options);
  await p.goto(DEPART);
  await expect(p.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
  await apresRendu(p);
  return { page: p, demandes };
}

test('AC-7 depuis /?loyer=1200&mer=50, 5 proches prêts : plus de champ, « 5 proches au maximum… » ; après « Retirer » Lilleville (59), le lien revient et ouvre le champ', async ({ page }) => {
  test.setTimeout(60_000);
  await ouvrir(page, DEPART);
  await servirIgn(page);
  // Ajoutés d'affilée : ils calculent l'un après l'autre (≈ 3 s chacun).
  for (const c of ['Nantesville', 'Toulouseville', 'Lyonville', 'Brestville', 'Lilleville'] as const) await ajouter(page, c);
  for (const nom of ['Nantesville (44)', 'Toulouseville (31)', 'Lyonville (69)', 'Brestville (29)', 'Lilleville (59)']) await pret(page, nom, 30_000);

  await expect(zone(page)).toContainText('5 proches au maximum. Retire-en un pour en ajouter un autre.');
  await expect(champ(page)).toHaveCount(0);
  await expect(zone(page).getByRole('button', { name: '+ Ajouter un proche' })).toHaveCount(0);

  await zone(page).getByRole('button', { name: 'Retirer Lilleville (59)' }).click();
  await expect(zone(page)).not.toContainText('5 proches au maximum');
  await zone(page).getByRole('button', { name: '+ Ajouter un proche' }).click();
  await expect(champ(page)).toBeVisible();
  await expect(champ(page)).toBeFocused();
});

test('AC-8 Nantesville (44) prêt à 2 h 15 et gardé : page fermée puis /?loyer=1200&mer=50 rouvert, il est prêt à 2 h 15 sans calcul ; Portmer 66, Grandeville 17', async ({ page }) => {
  await ouvrir(page, DEPART);
  await servirIgn(page);
  await ajouter(page, 'Nantesville');
  await pret(page, 'Nantesville (44)');
  await regler(page, 'Nantesville (44)', 'ArrowRight');
  await expect(plafond(page, 'Nantesville (44)')).toHaveAttribute('aria-valuenow', '135');

  const { page: p, demandes } = await rouvrir(page);
  await expect(plafond(p, 'Nantesville (44)')).toHaveAttribute('aria-valuenow', '135');
  await expect(ligne(p, 'Nantesville (44)')).toContainText(/2\sh\s15/);
  await expect(zone(p)).not.toContainText('Calcul des trajets');
  await voirListe(p); // 390 px : la liste est dans son onglet (interface-telephone)
  await expect(liste(p)).toContainText('2 communes passent tes critères');
  expect(await lignes(p)).toEqual(["1 · Portmer (17) · 66 · 650 € · moins d'1 km", '2 · Grandeville (33) · 17 · 832 € · 40 km']);
  await p.waitForTimeout(500);
  expect(demandes.zones).toEqual([]);
  expect(new URL(p.url()).pathname + new URL(p.url()).search).toBe('/?loyer=1200&mer=50');
});

test('AC-9 Nantesville (44) et Toulouseville (31) gardés : « Effacer mes proches » puis /?loyer=1200&mer=50 rouvert, état vide ; 3 communes, 72, 48, 25', async ({ page }) => {
  await ouvrir(page, DEPART);
  await servirIgn(page);
  await ajouter(page, 'Nantesville');
  await ajouter(page, 'Toulouseville');
  await pret(page, 'Nantesville (44)');
  await pret(page, 'Toulouseville (31)');
  expect(await memoire(page)).toHaveLength(2);

  await zone(page).getByRole('button', { name: 'Effacer mes proches' }).click();
  await expect(zone(page).getByRole('listitem')).toHaveCount(0);
  expect(await memoire(page)).toEqual([]);

  const { page: p } = await rouvrir(page);
  await expect(zone(p).getByRole('listitem')).toHaveCount(0);
  await expect(zone(p)).toContainText("Ajoute l'adresse d'un proche : la carte calcule le temps en voiture jusqu'à chaque commune.");
  await expect(champ(p)).toBeVisible();
  await expect(zone(p).getByRole('button', { name: 'Effacer mes proches' })).toHaveCount(0);
  await voirListe(p); // 390 px : la liste est dans son onglet (interface-telephone)
  await expect(liste(p)).toContainText('3 communes passent tes critères');
  expect(await lignes(p)).toEqual(SANS_PROCHE);
});

test('AC-11 depuis /?loyer=1200&mer=50, recherche d’adresse en panne : « Recherche d’adresse indisponible. Réessaie dans un moment. », « Ajouter » inactif ; 3 communes', async ({ page }) => {
  await ouvrir(page, DEPART);
  const demandes = await servirIgn(page, { recherche: 'panne' });
  await champ(page).fill('1 rue Test');
  await expect(zone(page)).toContainText("Recherche d'adresse indisponible. Réessaie dans un moment.");
  expect(demandes.recherches.length).toBeGreaterThan(0);
  await expect(zone(page).getByRole('button', AJOUTER)).toBeDisabled();
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  await expect(liste(page)).toContainText('3 communes passent tes critères');
});

// Hors AC (details.md « États d'un proche », R9, R12, R13, H21).
test('deux proches ajoutés d’affilée : le second « En attente… » ; repliée, la zone dit « 2 · 1 en calcul, 1 en attente », puis « 2 »', async ({ page }) => {
  await ouvrir(page);
  await servirIgn(page);
  await ajouter(page, 'Nantesville');
  await ajouter(page, 'Toulouseville');
  await expect(ligne(page, 'Nantesville (44)')).toContainText('Calcul des trajets depuis Nantesville (44)…');
  await expect(ligne(page, 'Toulouseville (31)')).toContainText('En attente…');
  await expect(ligne(page, 'Toulouseville (31)').getByRole('button', { name: 'Retirer Toulouseville (31)' })).toBeVisible();

  const titre = page.getByRole('button', { name: /^Tes proches/ });
  await titre.click();
  await expect(titre).toHaveAccessibleName('Tes proches 2 · 1 en calcul, 1 en attente');
  await expect(titre).toHaveAccessibleName('Tes proches 2 · 1 en calcul', { timeout: 10_000 });
  await expect(titre).toHaveAccessibleName('Tes proches 2', { timeout: 10_000 });
  await titre.click();
  await expect(plafond(page, 'Toulouseville (31)')).toBeVisible();
});

test('H21 délai de 45 s compté depuis le début de chaque calcul (horloge simulée) : le premier, puis le second, passent indisponibles', async ({ page }) => {
  await page.clock.install();
  await ouvrir(page, DEPART); // cadre-de-vie, règle (1) du recalage : réglage explicite
  await servirIgn(page, { delaiZoneMs: 60_000 }); // le service ne répond pas pendant le test
  // Horloge figée : seul `runFor` fait avancer l'heure de la page, quelle que soit la charge de la machine. La recherche
  // part 300 ms après la frappe (ATTENTE_RECHERCHE_MS de src/ui/Proches.tsx) : on avance l'horloge d'autant à chaque ajout.
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 5_000);
  const ajouterHorlogeFigee = async (commune: keyof typeof ADRESSES) => {
    const [texte, suggestion] = ADRESSES[commune];
    if (!(await champ(page).isVisible())) await zone(page).getByRole('button', { name: '+ Ajouter un proche' }).click();
    await champ(page).fill(texte);
    await page.clock.runFor(300);
    await zone(page).getByRole('button', { name: suggestion }).click();
    await zone(page).getByRole('button', AJOUTER).click();
  };
  await ajouterHorlogeFigee('Nantesville'); // on est à 0 s du calcul de Nantesville
  await ajouterHorlogeFigee('Toulouseville'); // 300 ms
  await expect(ligne(page, 'Nantesville (44)')).toContainText('Calcul des trajets');

  await page.clock.runFor(44_000 - 300); // 44 s
  await expect(ligne(page, 'Nantesville (44)')).toContainText('Calcul des trajets');
  await page.clock.runFor(2_000);
  await expect(zone(page)).toContainText(INDISPONIBLE_44);
  await expect(ligne(page, 'Toulouseville (31)')).toContainText('Calcul des trajets depuis Toulouseville (31)…');

  // Toulouseville a attendu 45 s : son délai part du début de son calcul (à 45 s), pas de son ajout. On est à 46 s.
  await page.clock.runFor(43_000);
  await expect(ligne(page, 'Toulouseville (31)')).toContainText('Calcul des trajets');
  await page.clock.runFor(2_000);
  await expect(zone(page)).toContainText('Trajets indisponibles depuis Toulouseville (31).');
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  await expect(liste(page)).toContainText('3 communes passent tes critères');
});

test('R13 refus 429 de l’IGN : le proche passe indisponible ; « Réessayer » quand le service répond : calcul, puis prêt', async ({ page }) => {
  await ouvrir(page, DEPART); // cadre-de-vie, règle (1) du recalage : réglage explicite
  await servirIgn(page, { trajets: '429' });
  await ajouter(page, 'Nantesville');
  // Proches-fiables R33, H92 : chaque zone refusée est redemandée 5 s plus tard (24 demandes, ≈ 8 s) avant la fin du calcul.
  await expect(zone(page)).toContainText(INDISPONIBLE_44, { timeout: 15_000 });
  const titre = page.getByRole('button', { name: /^Tes proches/ });
  await titre.click();
  await expect(titre).toHaveAccessibleName('Tes proches 1 · 1 indisponible');
  await titre.click();

  await servirIgn(page); // le service répond de nouveau (la dernière route posée gagne)
  await ligne(page, 'Nantesville (44)').getByRole('button', { name: 'Réessayer' }).click();
  await expect(ligne(page, 'Nantesville (44)')).toContainText('Calcul des trajets depuis Nantesville (44)…');
  await pret(page, 'Nantesville (44)');
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  expect(await lignes(page)).toEqual(["1 · Portmer (17) · 65 · 650 € · moins d'1 km"]);
});

test('« Retirer » pendant le calcul : le calcul s’arrête (plus aucune zone demandée), le proche disparaît ; « Retirer » en attente aussi', async ({ page }) => {
  await ouvrir(page, DEPART); // cadre-de-vie, règle (1) du recalage : réglage explicite
  const demandes = await servirIgn(page);
  await ajouter(page, 'Nantesville');
  await ajouter(page, 'Toulouseville');
  await expect(ligne(page, 'Nantesville (44)')).toContainText('Calcul des trajets');
  await zone(page).getByRole('button', { name: 'Retirer Toulouseville (31)' }).click();
  await zone(page).getByRole('button', { name: 'Retirer Nantesville (44)' }).click();
  await expect(zone(page).getByRole('listitem')).toHaveCount(0);
  const n = demandes.zones.length;
  expect(n).toBeLessThan(12);
  await page.waitForTimeout(1_500);
  expect(demandes.zones.length).toBe(n);
  expect(demandes.zones.some((u) => u.includes('point=3%2C-2') || u.includes('point=3,-2'))).toBe(false); // Toulouseville jamais calculé
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  expect(await lignes(page)).toEqual(SANS_PROCHE);
  expect(await memoire(page)).toEqual([]);
});

test('R9 doublon : la même adresse est refusée, « Cette adresse est déjà dans tes proches. » sous le champ', async ({ page }) => {
  await ouvrir(page);
  await servirIgn(page);
  await ajouter(page, 'Nantesville');
  await ajouter(page, 'Nantesville');
  await expect(zone(page)).toContainText('Cette adresse est déjà dans tes proches.');
  await expect(zone(page).getByRole('listitem')).toHaveCount(1);
  // Le message part dès qu'on change d'adresse.
  await champ(page).fill('2 place Test');
  await expect(zone(page)).not.toContainText('Cette adresse est déjà dans tes proches.');
});

test('aucune adresse : « zzzz » → « Aucune adresse trouvée. », « Ajouter » inactif', async ({ page }) => {
  await ouvrir(page);
  await servirIgn(page);
  await champ(page).fill('zzzz');
  await expect(zone(page)).toContainText('Aucune adresse trouvée.');
  await expect(zone(page).getByRole('button', AJOUTER)).toBeDisabled();
});

// Hors AC (relecture navigateur proches, qa.md) : en bureau, le message sous le champ poussait « Ajouter » sous le compte collé.
test('aucune adresse en bureau, avec un proche : le panneau défile, « Ajouter » entier au-dessus du compte collé', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 }); // le compte n'est collé au bas du panneau qu'en bureau
  await ouvrir(page);
  await servirIgn(page);
  await ajouter(page, 'Nantesville');
  await pret(page, 'Nantesville (44)');
  await zone(page).getByRole('button', { name: '+ Ajouter un proche' }).click();
  await champ(page).fill('zzzz');
  await expect(zone(page)).toContainText('Aucune adresse trouvée.');
  const bas = async (nom: 'Ajouter' | 'compte') => {
    const l = nom === 'Ajouter' ? zone(page).getByRole('button', AJOUTER) : page.getByRole('region', { name: 'Réglages' }).getByRole('status');
    const b = (await l.boundingBox())!;
    return { haut: b.y, bas: b.y + b.height };
  };
  await expect.poll(async () => (await bas('Ajouter')).bas <= (await bas('compte')).haut).toBe(true);
  await expect(champ(page)).toBeInViewport(); // le champ reste visible lui aussi
});

test('R12 mémoire refusée (le stockage lève une erreur) : message sous le titre, le proche marche quand même (Portmer 65)', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('mémoire pleine', 'QuotaExceededError');
    };
  });
  await ouvrir(page, DEPART); // cadre-de-vie, règle (1) du recalage : réglage explicite
  await servirIgn(page);
  await expect(zone(page)).not.toContainText('Tes proches ne seront pas gardés');
  await ajouter(page, 'Nantesville');
  await expect(zone(page)).toContainText('Tes proches ne seront pas gardés sur ce navigateur.');
  await pret(page, 'Nantesville (44)');
  await voirListe(page); // 390 px : la liste est dans son onglet (interface-telephone)
  expect(await lignes(page)).toEqual(["1 · Portmer (17) · 65 · 650 € · moins d'1 km"]);
});

test('R12 empreinte des codes INSEE qui ne correspond plus : le proche gardé revient indisponible, sans calcul', async ({ page }) => {
  await ouvrir(page, DEPART); // cadre-de-vie, règle (1) du recalage : réglage explicite
  await servirIgn(page);
  await ajouter(page, 'Nantesville');
  await pret(page, 'Nantesville (44)');

  // Une autre carte : le code de Quaibleu a changé (99005 → 99006).
  const communes = {
    champs: ['code', 'nom', 'dep', 'population', 'loyer_m2', 'estimation_propre', 'mer_km'],
    communes: loyerMer.fixture.items.map((it) => [it.code_insee === '99005' ? '99006' : it.code_insee, it.nom, it.dep, it.population, it.loyer_m2, it.estimation_propre, it.mer_km]),
  };
  const { page: p, demandes } = await rouvrir(page, {}, (p) => p.route('**/data/communes.json', (r) => r.fulfill({ json: communes })));
  await expect(zone(p)).toContainText(INDISPONIBLE_44);
  await expect(ligne(p, 'Nantesville (44)').getByRole('button', { name: 'Réessayer' })).toBeVisible();
  await voirListe(p); // 390 px : la liste est dans son onglet (interface-telephone)
  expect(await lignes(p)).toEqual(SANS_PROCHE);
  expect(demandes.zones).toEqual([]);
});

test('R12 un proche fermé pendant son calcul revient indisponible à la réouverture, sans calcul', async ({ page }) => {
  await ouvrir(page);
  await servirIgn(page, { delaiZoneMs: 60_000 });
  await ajouter(page, 'Nantesville');
  await expect(ligne(page, 'Nantesville (44)')).toContainText('Calcul des trajets');
  await page.unrouteAll({ behavior: 'ignoreErrors' });

  const { page: p, demandes } = await rouvrir(page);
  await expect(zone(p)).toContainText(INDISPONIBLE_44);
  await expect(zone(p)).not.toContainText('Calcul des trajets');
  await p.waitForTimeout(500);
  expect(demandes.zones).toEqual([]);
});
