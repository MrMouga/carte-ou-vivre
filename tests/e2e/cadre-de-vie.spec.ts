import { expect, test, type Page } from '@playwright/test';
import cadreDeVie from '../../docs/specs/2026-10-14-cadre-de-vie/acceptance.json' with { type: 'json' };
import { attendreCouleurs, ouvrir, vue, type Jeu } from './lib/carte';
import { mobile, voirCriteres, voirListe } from './lib/feuille';

// Tranche cadre-de-vie, tâche 3 : la catégorie « Cadre de vie » (taille en chiffres, mer en cinq choix), le départ sur
// Peu importe (R32) et l'adresse de la mer (R31) ; tâche 4 : la montagne (R29, R30, R31), sur la fixture « 6 communes » de la tranche (A à F, mêmes tuiles que
// celle d'immobilier : python3 scripts/data/tuiles.py --fixture).
const SIX: Jeu = { items: cadreDeVie.fixture.items, tuiles: new URL('../fixtures/tuiles-immobilier/', import.meta.url) };
type Six = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

const nbsp = (t: string | null) => (t ?? '').replace(/ /g, ' ');
const adresse = (page: Page) => new URL(page.url()).pathname + new URL(page.url()).search;
const liste = (page: Page) => page.getByRole('region', { name: 'Les 10 premières' });
const lignes = async (page: Page) => (await liste(page).getByRole('button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))).map(nbsp);
const fiche = (page: Page) => page.getByRole('region', { name: /\(\d+\)$/ });
const texteFiche = async (page: Page) => nbsp(await fiche(page).innerText());
const taille = (page: Page) => page.getByRole('group', { name: 'Taille de la commune' });
const nature = (page: Page) => page.getByRole('group', { name: 'Proximité avec la nature' });
// D12 (2026-10-15) : mer et montagne en boutons à bascule exclusifs (H76 révisée), sans « Peu importe » ; aucun coché = Peu importe.
const mer = (page: Page) => page.getByRole('group', { name: 'Mer à moins de' });
const choixMer = (page: Page, nom: string) => mer(page).getByRole('button', { name: nom, exact: true });
const montagne = (page: Page) => page.getByRole('group', { name: 'Montagne à moins de' });
const choixMontagne = (page: Page, nom: string) => montagne(page).getByRole('button', { name: nom, exact: true });
const titreCadre = (page: Page) => page.getByRole('heading', { level: 2, name: /^Cadre de vie/ }).getByRole('button');

async function ouvrirSix(page: Page, chemin = '/') {
  await ouvrir(page, chemin, { jeu: SIX });
}
/**
 * Ouvre la fiche d'une commune sur la carte, à l'ouverture (vue de départ de la fixture). Choisir une commune zoome la
 * carte sur elle (D14 de loyer-mer) : on rouvre d'abord la même adresse (les réglages y sont tous), comme `rouvrir()` de
 * mairies, pour cliquer la commune à sa place d'ouverture et non pendant le zoom.
 */
async function ficheDeCarte(page: Page, id: Six, nom: string) {
  await ouvrirSix(page, adresse(page));
  const { centre } = vue(page, SIX);
  await page.mouse.click(centre(id).x, centre(id).y);
  await expect(fiche(page)).toContainText(nom);
}
/** Ouvre la fiche d'une commune de la liste. */
async function ficheDeListe(page: Page, nom: string) {
  await voirListe(page);
  await liste(page).getByRole('button', { name: new RegExp(nom) }).click();
  await expect(fiche(page)).toContainText(nom);
}
/** La pastille de mer cochée, et elle seule. */
async function merCochee(page: Page, nom: string) {
  await expect(choixMer(page, nom)).toHaveAttribute('aria-pressed', 'true');
  await expect(mer(page).getByRole('button', { pressed: true })).toHaveCount(1);
}
/** La pastille de montagne cochée, et elle seule. */
async function montagneCochee(page: Page, nom: string) {
  await expect(choixMontagne(page, nom)).toHaveAttribute('aria-pressed', 'true');
  await expect(montagne(page).getByRole('button', { pressed: true })).toHaveCount(1);
}
/** Aucune distance à la mer cochée (Peu importe, D12). */
async function merAucune(page: Page) {
  await expect(mer(page).getByRole('button')).toHaveCount(4);
  await expect(mer(page).getByRole('button', { pressed: true })).toHaveCount(0);
}
/** Aucune distance à la montagne cochée (Peu importe, D12). */
async function montagneAucune(page: Page) {
  await expect(montagne(page).getByRole('button')).toHaveCount(4);
  await expect(montagne(page).getByRole('button', { pressed: true })).toHaveCount(0);
}

test('AC-2 depuis /, mer « 50 km » : /?loyer=1200&mer=50 ; 3 communes, Portmer 72, Quaibleu 48, Grandeville 25 ; fiche de Rhinval « Mer 420 km : au-dessus de ton plafond de 50 km »', async ({ page }) => {
  await ouvrirSix(page);
  await choixMer(page, '50 km').click();
  await merCochee(page, '50 km');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&mer=50');
  await voirListe(page);
  await expect(liste(page)).toContainText('3 communes passent tes critères');
  expect(await lignes(page)).toEqual([
    "1 · Portmer (17) · 72 · 650 € · moins d'1 km",
    '2 · Quaibleu (13) · 48 · 1 092 € · 7 km',
    '3 · Grandeville (33) · 25 · 832 € · 40 km',
  ]);
  await ficheDeCarte(page, 'F', 'Rhinval (67)');
  expect(await texteFiche(page)).toContain('Mer 420 km : au-dessus de ton plafond de 50 km');
});

test('AC-6 depuis /, taille « 10 000 – 50 000 hab. » : pastilles en chiffres dans l’ordre ; /?loyer=1200&taille=petite-ville ; Rhinval 52, Portmer 46 ; fiche de Grandeville « Taille : 260 000 habitants, hors des tailles choisies »', async ({ page }) => {
  await ouvrirSix(page);
  const pastilles = taille(page).getByRole('button');
  expect((await pastilles.allInnerTexts()).map((t) => nbsp(t).replace(/\s+/g, ' '))).toEqual([
    'Moins de 10 000 hab.',
    '10 000 – 50 000 hab.',
    '50 000 – 200 000 hab.',
    'Plus de 200 000 hab.',
  ]);
  await taille(page).getByRole('button', { name: /^10\s000 – 50\s000\shab\.$/ }).click();
  await expect(taille(page).getByRole('button', { name: /^10\s000 – 50\s000\shab\.$/ })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&taille=petite-ville');
  await voirListe(page);
  await expect(liste(page)).toContainText('2 communes passent tes critères');
  expect((await lignes(page)).map((l) => l.split(' · ').slice(1, 3).join(' · '))).toEqual(['Rhinval (67) · 52', 'Portmer (17) · 46']);
  await ficheDeCarte(page, 'B', 'Grandeville (33)');
  expect(await texteFiche(page)).toContain('Taille : 260 000 habitants, hors des tailles choisies');
});

test('AC-9 /?loyer=1200&mer=60 : mer sur « 100 km », /?loyer=1200&mer=100, Portmer 72, Quaibleu 51, Grandeville 45 ; puis /?loyer=1200&mer=25 : « 30 km », /?loyer=1200&mer=30, Portmer 71, Quaibleu 43', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&mer=60');
  await merCochee(page, '100 km');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&mer=100');
  await voirListe(page);
  await expect(liste(page)).toContainText('3 communes passent tes critères');
  expect((await lignes(page)).map((l) => l.split(' · ').slice(1, 3).join(' · '))).toEqual(['Portmer (17) · 72', 'Quaibleu (13) · 51', 'Grandeville (33) · 45']);

  await ouvrirSix(page, '/?loyer=1200&mer=25');
  await merCochee(page, '30 km');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&mer=30');
  await voirListe(page);
  await expect(liste(page)).toContainText('2 communes passent tes critères');
  expect((await lignes(page)).map((l) => l.split(' · ').slice(1, 3).join(' · '))).toEqual(['Portmer (17) · 71', 'Quaibleu (13) · 43']);
});

// Hors AC (R31) : les autres valeurs de l'ancienne plage et les valeurs hors plage.
test('R31 : mer=5 → 10 km ; mer=200, mer=23 et mer=0 → Peu importe, adresse /?loyer=1200', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&mer=5');
  await merCochee(page, '10 km');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&mer=10');
  // Mêmes données déjà servies ; l'adresse et la case cochée ne dépendent pas de la carte : on n'attend pas qu'elle soit
  // prête (quatre cartes dans un seul test dépassaient les 5 s sous la charge de la suite entière).
  for (const v of ['200', '23', '0']) {
    await page.goto(`/?loyer=1200&mer=${v}`);
    await merAucune(page); // D12 : Peu importe = aucune distance cochée
    await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
  }
});

// Hors AC (R32, R31) : l'adresse est réécrite à l'ouverture avec les réglages effectifs ; tout le cadre de vie sur Peu importe.
test('R32 : / devient /?loyer=1200 ; aucune distance à la mer cochée, aucune taille cochée ; la liste classe par le prix seul', async ({ page }) => {
  await ouvrirSix(page);
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
  await merAucune(page);
  await expect(taille(page).getByRole('button', { pressed: true })).toHaveCount(0);
  await voirListe(page);
  // Prix seul (fixture « 6 communes ») : Terrebasse 65, Rhinval 52, Portmer 46, Grandeville 31, Quaibleu 9 (AC-1 d'immobilier).
  expect((await lignes(page)).map((l) => l.split(' · ').slice(1, 3).join(' · '))).toEqual([
    'Terrebasse (23) · 65', 'Rhinval (67) · 52', 'Portmer (17) · 46', 'Grandeville (33) · 31', 'Quaibleu (13) · 9',
  ]);
});

// Hors AC (H75) : le résumé de la catégorie repliée.
test('H75 : « Cadre de vie » repliée dit « Peu importe », puis « 2 tailles · Mer 50 km »', async ({ page }) => {
  await ouvrirSix(page);
  await expect(titreCadre(page)).toHaveAttribute('aria-expanded', 'true');
  await titreCadre(page).click();
  await expect(titreCadre(page)).toHaveAttribute('aria-expanded', 'false');
  expect(nbsp(await titreCadre(page).textContent())).toBe('Cadre de viePeu importe');
  await expect(taille(page)).toBeHidden();

  await titreCadre(page).click();
  await taille(page).getByRole('button', { name: /^10\s000/ }).click();
  await taille(page).getByRole('button', { name: /^50\s000/ }).click();
  await choixMer(page, '50 km').click();
  await titreCadre(page).click();
  expect(nbsp(await titreCadre(page).textContent())).toBe('Cadre de vie2 tailles · Mer 50 km');
});

// Hors AC (H76, contrat « Cases séparées » et « Cases collées ») : groupes, noms et états lus par les lecteurs d'écran ; clavier.
// D12 : le motif radio (une case dans l'ordre de tabulation, flèches) n'existe plus ; sa vérification est retirée (règle (4)).
test('H76 : « Taille de la commune » (4 boutons à bascule), « Proximité avec la nature » qui porte « Mer à moins de » (4 boutons à bascule exclusifs, D12)', async ({ page }) => {
  await ouvrirSix(page);
  await expect(taille(page).getByRole('button')).toHaveCount(4);
  for (const b of await taille(page).getByRole('button').all()) await expect(b).toHaveAttribute('aria-pressed', 'false');
  await expect(nature(page).getByRole('group', { name: 'Mer à moins de' })).toBeVisible();
  expect((await mer(page).getByRole('button').allInnerTexts()).map(nbsp)).toEqual(['10 km', '30 km', '50 km', '100 km']);

  // Espace sur une taille : cochée, puis décochée.
  const petite = taille(page).getByRole('button', { name: /^Moins de 10\s000/ });
  await petite.focus();
  await page.keyboard.press('Space');
  await expect(petite).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Space');
  await expect(petite).toHaveAttribute('aria-pressed', 'false');
});

// Hors AC (contrat « Règles » : 44 px au toucher ; leçon du prototype : aucun nombre coupé sur deux lignes) — 390 px.
test('390 px : cases de taille et de mer de 44 px au moins ; libellés de taille entiers, aucun nombre coupé, rien ne déborde', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'cibles au toucher : 390 px');
  await ouvrirSix(page);
  await voirCriteres(page);
  const cases = [...(await taille(page).getByRole('button').all()), ...(await mer(page).getByRole('button').all())];
  for (const c of cases) {
    await c.scrollIntoViewIfNeeded();
    expect((await c.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  const mesures = await taille(page).getByRole('button').evaluateAll((els) =>
    els.map((el) => {
      const texte = el.firstChild as Text;
      // Chaque nombre (« 10 000 », « 200 000 hab. ») tient sur une seule ligne : un morceau coupé aurait deux rectangles.
      const coupes = [...texte.data.matchAll(/\d+ \d{3}( hab\.)?/g)].filter((m) => {
        const r = document.createRange();
        r.setStart(texte, m.index!);
        r.setEnd(texte, m.index! + m[0].length);
        return r.getClientRects().length !== 1;
      });
      const r = document.createRange();
      r.selectNodeContents(texte);
      const lignes = new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size;
      return { libelle: texte.data, coupes: coupes.length, deborde: el.scrollWidth > el.clientWidth, lignes };
    }),
  );
  for (const m of mesures) {
    expect(m.coupes, m.libelle).toBe(0);
    expect(m.deborde, m.libelle).toBe(false);
    expect(m.lignes, m.libelle).toBeLessThanOrEqual(2);
  }
  expect(mobile(page)).toBe(true);
});

// Hors AC (R30) : la ligne de type et de population, et la fiche d'une commune qui passe.
test('R30 : fiche de Grandeville « Ville dense · 260 000 habitants », de Terrebasse « Bourg et village · 4 200 habitants »', async ({ page }) => {
  await ouvrirSix(page);
  await ficheDeListe(page, 'Grandeville');
  expect(await texteFiche(page)).toContain('Ville dense · 260 000 habitants');
  await page.getByRole('button', { name: '← Les 10 premières' }).click();
  await ficheDeListe(page, 'Terrebasse');
  expect(await texteFiche(page)).toContain('Bourg et village · 4 200 habitants');
});

// Hors AC (R30, H80) : la mention de la grille de densité au pied de page.
test('pied de page : « Type d’environnement : Insee, grille communale de densité »', async ({ page }) => {
  await ouvrirSix(page);
  if (mobile(page)) await voirCriteres(page);
  const mentions = page.getByRole('contentinfo').filter({ visible: true }).first();
  await expect(mentions).toContainText("Type d'environnement : Insee, grille communale de densité 2025 (mise en ligne le 21/07/2025)");
});

// ---------- Tâche 4 : la montagne (R29, R30, R31 pour `montagne`, H83) ----------

const sansNum = (l: string) => l.split(' · ').slice(1, 3).join(' · ');

test('AC-3 depuis /, montagne « 10 km » : /?loyer=1200&montagne=10 ; 2 communes, Terrebasse 83, Rhinval 71 ; fiche de Quaibleu « Montagne 62 km : au-dessus de ton plafond de 10 km »', async ({ page }) => {
  await ouvrirSix(page);
  await choixMontagne(page, '10 km').click();
  await montagneCochee(page, '10 km');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&montagne=10');
  await voirListe(page);
  await expect(liste(page)).toContainText('2 communes passent tes critères');
  expect(await lignes(page)).toEqual(['1 · Terrebasse (23) · 83 · 416 € · 180 km', '2 · Rhinval (67) · 71 · 572 € · 420 km']);
  await ficheDeCarte(page, 'E', 'Quaibleu (13)');
  expect(await texteFiche(page)).toContain('Montagne 62 km : au-dessus de ton plafond de 10 km');
});

test('AC-4 depuis /, montagne « 50 km » : /?loyer=1200&montagne=50 ; 3 communes, Terrebasse 83, Rhinval 75, Grandeville 15 ; fiche de Portmer « Montagne 140 km : au-dessus de ton plafond de 50 km »', async ({ page }) => {
  await ouvrirSix(page);
  await choixMontagne(page, '50 km').click();
  await montagneCochee(page, '50 km');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&montagne=50');
  await voirListe(page);
  await expect(liste(page)).toContainText('3 communes passent tes critères');
  expect(await lignes(page)).toEqual([
    '1 · Terrebasse (23) · 83 · 416 € · 180 km',
    '2 · Rhinval (67) · 75 · 572 € · 420 km',
    '3 · Grandeville (33) · 15 · 832 € · 40 km',
  ]);
  await ficheDeCarte(page, 'A', 'Portmer (17)');
  expect(await texteFiche(page)).toContain('Montagne 140 km : au-dessus de ton plafond de 50 km');
});

test('AC-7 depuis /?loyer=1200&mer=50, Grandeville, Terrebasse puis Rhinval : type et population, mer et montagne dans la fiche (R30)', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&mer=50');
  await ficheDeListe(page, 'Grandeville');
  let t = await texteFiche(page);
  expect(t).toContain('Ville dense · 260 000 habitants');
  expect(t).toMatch(/\b25\s*\/ 100/);
  expect(t).toContain('3e sur 3 communes qui passent');
  expect(t).toContain("40 km de la mer à vol d'oiseau");
  expect(t).toContain("50 km de la montagne à vol d'oiseau");

  await ficheDeCarte(page, 'D', 'Terrebasse (23)');
  t = await texteFiche(page);
  expect(t).toContain('Bourg et village · 4 200 habitants');
  expect(t).toContain('Commune de montagne');
  expect(t).toContain('Mer 180 km : au-dessus de ton plafond de 50 km');

  await ficheDeCarte(page, 'F', 'Rhinval (67)');
  t = await texteFiche(page);
  expect(t).toContain('Ville et périphérie · 30 000 habitants');
  expect(t).toContain("moins d'1 km de la montagne");
});

test('AC-11 /?loyer=1200&mer=100&montagne=50 : 1 commune, Grandeville 30 (49,6 km affiché 50, égal au plafond : note 0) ; fiche de Grandeville « 50 km de la montagne », de Quaibleu « Montagne 62 km : au-dessus de ton plafond de 50 km »', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&mer=100&montagne=50');
  await merCochee(page, '100 km');
  await montagneCochee(page, '50 km');
  await voirListe(page);
  await expect(liste(page)).toContainText('1 commune passe tes critères');
  expect(await lignes(page)).toEqual(['1 · Grandeville (33) · 30 · 832 € · 40 km']);
  await ficheDeListe(page, 'Grandeville');
  expect(await texteFiche(page)).toContain("50 km de la montagne à vol d'oiseau");
  await ficheDeCarte(page, 'E', 'Quaibleu (13)');
  expect(await texteFiche(page)).toContain('Montagne 62 km : au-dessus de ton plafond de 50 km');
});

test('AC-12 ouverture de / : le pied de page cite la grille communale de densité (Insee) et « Zone de montagne : » avec le Cerema, à côté des mentions précédentes', async ({ page }) => {
  await ouvrirSix(page);
  if (mobile(page)) await voirCriteres(page);
  const mentions = page.getByRole('contentinfo').filter({ visible: true }).first();
  await expect(mentions).toContainText('grille communale de densité');
  await expect(mentions).toContainText('Insee');
  await expect(mentions).toContainText('Zone de montagne : Cerema, communes soumises à la loi Montagne (2019)');
  await expect(mentions).toContainText('Estimations ANIL, à partir des données du Groupe SeLoger et de leboncoin');
  await expect(mentions).toContainText("Prix d'achat : Demandes de valeurs foncières (DGFiP)");
});

// Hors AC (R31) : `montagne` hors des quatre distances = Peu importe, et l'adresse ne l'écrit pas.
test('R31 : montagne=0 et montagne=abc → Peu importe, /?loyer=1200 ; montagne=30 gardée', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&montagne=30');
  await montagneCochee(page, '30 km');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&montagne=30');
  // Comme pour la mer : l'adresse et la case cochée ne dépendent pas de la carte, on recharge sans l'attendre.
  for (const v of ['0', 'abc']) {
    await page.goto(`/?loyer=1200&montagne=${v}`);
    await montagneAucune(page); // D12 : Peu importe = aucune distance cochée
    await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
  }
});

// Hors AC (details.md, « sans plafond » étendu) : seule la montagne note ; elle repasse à Peu importe → page sans plafond.
test('sans plafond : /?loyer=aucun&montagne=50 classe 3 communes ; montagne « 50 km » décochée → /?loyer=aucun, couleur neutre partout, message de liste', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=aucun&montagne=50');
  await voirListe(page);
  expect((await lignes(page)).map(sansNum)).toEqual(['Terrebasse (23) · 100', 'Rhinval (67) · 98', 'Grandeville (33) · 0']);
  await voirCriteres(page);
  await choixMontagne(page, '50 km').click(); // D12 : décocher la pastille cochée = Peu importe
  await montagneAucune(page);
  await expect.poll(() => adresse(page)).toBe('/?loyer=aucun');
  const neutre = 'area-unranked' as const;
  await attendreCouleurs<Six>(page, { A: neutre, B: neutre, C: neutre, D: neutre, E: neutre, F: neutre }, { jeu: SIX });
  await voirListe(page);
  await expect(liste(page)).toContainText('Fixe un loyer ou une distance à la mer pour classer les communes.');
  await expect(liste(page).getByRole('button')).toHaveCount(0);
});

// Hors AC (H75) : « Montagne 30 km » dans le résumé replié, après la mer.
test('H75 : « Cadre de vie » repliée dit « 2 tailles · Mer 50 km · Montagne 30 km »', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&mer=50&montagne=30&taille=petite-ville,ville-moyenne');
  await titreCadre(page).click();
  await expect(titreCadre(page)).toHaveAttribute('aria-expanded', 'false');
  expect(nbsp(await titreCadre(page).textContent())).toBe('Cadre de vie2 tailles · Mer 50 km · Montagne 30 km');
});

// Hors AC (H76 révisée par D12, design F) : « Montagne à moins de » sous la mer, dans « Proximité avec la nature », quatre
// boutons à bascule exclusifs. Le motif radio (flèches) n'existe plus : la flèche devient un clic (règle (3)).
test('H76 : « Montagne à moins de » (4 boutons à bascule exclusifs, aucun coché) sous « Mer à moins de », dans « Proximité avec la nature »', async ({ page }) => {
  await ouvrirSix(page);
  await expect(nature(page).getByRole('group', { name: 'Montagne à moins de' })).toBeVisible();
  expect((await montagne(page).getByRole('button').allInnerTexts()).map(nbsp)).toEqual(['10 km', '30 km', '50 km', '100 km']);
  await montagneAucune(page);
  expect((await montagne(page).boundingBox())!.y).toBeGreaterThan((await mer(page).boundingBox())!.y);
  await choixMontagne(page, '10 km').click();
  await montagneCochee(page, '10 km');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&montagne=10');
  await merAucune(page); // la mer ne bouge pas
});

// Hors AC (D12) : la pastille cochée se décoche d'un toucher ; cocher une autre décoche la première.
test('D12 : montagne « 10 km » cochée, décochée → aucune distance cochée (Peu importe), adresse sans montagne= ; « 30 km » puis « 100 km » : une seule cochée', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&montagne=10');
  await montagneCochee(page, '10 km');
  await choixMontagne(page, '10 km').click();
  await montagneAucune(page);
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
  await choixMontagne(page, '30 km').click();
  await montagneCochee(page, '30 km');
  await choixMontagne(page, '100 km').click();
  await montagneCochee(page, '100 km');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&montagne=100');
});

// Hors AC (H76 révisée par D12) : au clavier, Tab de pastille en pastille, comme les tailles ; Espace coche puis décoche.
test('D12, H76 : Tab passe de « 10 km » à « 30 km », « 50 km », « 100 km » de la mer puis à « 10 km » de la montagne ; Espace coche puis décoche', async ({ page }) => {
  await ouvrirSix(page);
  await voirCriteres(page);
  await choixMer(page, '10 km').focus();
  for (const nom of ['30 km', '50 km', '100 km']) {
    await page.keyboard.press('Tab');
    await expect(choixMer(page, nom)).toBeFocused();
  }
  await page.keyboard.press('Tab');
  await expect(choixMontagne(page, '10 km')).toBeFocused();
  await page.keyboard.press('Space');
  await montagneCochee(page, '10 km');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&montagne=10');
  await page.keyboard.press('Space');
  await montagneAucune(page);
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
});

// Hors AC (H75, D12) : rien de coché au départ, le résumé replié dit « Peu importe » ; une distance cochée puis décochée y revient.
test('D12, H75 : au départ, aucune distance cochée et « Cadre de vie » repliée dit « Peu importe » ; mer « 50 km » cochée puis décochée : « Peu importe »', async ({ page }) => {
  await ouvrirSix(page);
  await merAucune(page);
  await montagneAucune(page);
  await titreCadre(page).click();
  await expect(titreCadre(page)).toHaveAttribute('aria-expanded', 'false');
  expect(nbsp(await titreCadre(page).textContent())).toBe('Cadre de viePeu importe');
  await titreCadre(page).click();
  await choixMer(page, '50 km').click();
  await titreCadre(page).click();
  expect(nbsp(await titreCadre(page).textContent())).toBe('Cadre de vieMer 50 km');
  await titreCadre(page).click();
  await choixMer(page, '50 km').click();
  await merAucune(page);
  await titreCadre(page).click();
  expect(nbsp(await titreCadre(page).textContent())).toBe('Cadre de viePeu importe');
});

// Hors AC (contrat « Règles » : 44 px au toucher) — 390 px.
test('390 px : cases de la montagne de 44 px au moins', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'cibles au toucher : 390 px');
  await ouvrirSix(page);
  await voirCriteres(page);
  for (const c of await montagne(page).getByRole('button').all()) {
    await c.scrollIntoViewIfNeeded();
    expect((await c.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
});

// ---------- Tâche 5 : le type d'environnement (R27, R31 pour `env`), le départ (R32) ----------

const types = (page: Page) => page.getByRole('group', { name: "Type d'environnement" });
const choixType = (page: Page, nom: string) => types(page).getByRole('button', { name: nom, exact: true });
/** Les pastilles de type enfoncées, dans l'ordre affiché. */
const typesCoches = async (page: Page) => (await types(page).getByRole('button', { pressed: true }).allInnerTexts()).map((t) => nbsp(t).trim());
const tailleCochees = async (page: Page) => (await taille(page).getByRole('button', { pressed: true }).allInnerTexts()).map((t) => nbsp(t).replace(/\s+/g, ' ').trim());

test('AC-1 ouverture de / : /?loyer=1200 ; aucune distance à la mer ni à la montagne cochée, aucune taille ni aucun type coché ; 5 communes, Terrebasse 65, Rhinval 52, Portmer 46, Grandeville 31, Quaibleu 9 ; Montcher non colorée', async ({ page }) => {
  await ouvrirSix(page);
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
  await merAucune(page);
  await montagneAucune(page);
  await expect(taille(page).getByRole('button', { pressed: true })).toHaveCount(0);
  await expect(types(page).getByRole('button')).toHaveCount(4);
  await expect(types(page).getByRole('button', { pressed: true })).toHaveCount(0);
  await attendreCouleurs<Six>(page, { C: null }, { jeu: SIX });
  await voirListe(page);
  await expect(liste(page)).toContainText('5 communes passent tes critères');
  expect(await lignes(page)).toEqual([
    '1 · Terrebasse (23) · 65 · 416 € · 180 km',
    '2 · Rhinval (67) · 52 · 572 € · 420 km',
    "3 · Portmer (17) · 46 · 650 € · moins d'1 km",
    '4 · Grandeville (33) · 31 · 832 € · 40 km',
    '5 · Quaibleu (13) · 9 · 1 092 € · 7 km',
  ]);
});

test('AC-5 depuis /, type « Ville dense » : /?loyer=1200&env=ville-dense ; 1 commune, Grandeville 31 ; fiche de Portmer « Environnement : ville et périphérie, hors des types choisis » ; puis « Bourg et village » : env=ville-dense,bourg-et-village, Terrebasse 65 et Grandeville 31', async ({ page }) => {
  await ouvrirSix(page);
  await choixType(page, 'Ville dense').click();
  await expect(choixType(page, 'Ville dense')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&env=ville-dense');
  await voirListe(page);
  await expect(liste(page)).toContainText('1 commune passe tes critères');
  expect(await lignes(page)).toEqual(['1 · Grandeville (33) · 31 · 832 € · 40 km']);
  await ficheDeCarte(page, 'A', 'Portmer (17)');
  expect(await texteFiche(page)).toContain('Environnement : ville et périphérie, hors des types choisis');

  await page.getByRole('button', { name: '← Les 10 premières' }).click();
  await voirCriteres(page);
  await choixType(page, 'Bourg et village').click();
  expect(await typesCoches(page)).toEqual(['Ville dense', 'Bourg et village']);
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&env=ville-dense,bourg-et-village');
  await voirListe(page);
  await expect(liste(page)).toContainText('2 communes passent tes critères');
  expect((await lignes(page)).map(sansNum)).toEqual(['Terrebasse (23) · 65', 'Grandeville (33) · 31']);
});

test('AC-8 /?mer=200&montagne=0&taille=petite-commune&env=bourg-et-village,village : aucune distance à la mer ni à la montagne cochée, « Moins de 10 000 hab. » et « Bourg et village » cochés ; /?loyer=1200&taille=petite-commune&env=bourg-et-village ; 1 commune, Terrebasse 65', async ({ page }) => {
  await ouvrirSix(page, '/?mer=200&montagne=0&taille=petite-commune&env=bourg-et-village,village');
  await merAucune(page);
  await montagneAucune(page);
  expect(await tailleCochees(page)).toEqual(['Moins de 10 000 hab.']);
  expect(await typesCoches(page)).toEqual(['Bourg et village']);
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&taille=petite-commune&env=bourg-et-village');
  await voirListe(page);
  await expect(liste(page)).toContainText('1 commune passe tes critères');
  expect(await lignes(page)).toEqual(['1 · Terrebasse (23) · 65 · 416 € · 180 km']);
});

test('AC-10 /?loyer=aucun&env=bourg-et-village : Terrebasse en couleur neutre « sans plafond », les 5 autres non colorées ; message de liste ; fiche de Terrebasse « Commune de montagne » sans score ni rang ; fiche de Portmer « Environnement : ville et périphérie, hors des types choisis »', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=aucun&env=bourg-et-village');
  await attendreCouleurs<Six>(page, { D: 'area-unranked', A: null, B: null, C: null, E: null, F: null }, { jeu: SIX });
  await voirListe(page);
  await expect(liste(page)).toContainText('Fixe un loyer ou une distance à la mer pour classer les communes.');
  await expect(liste(page).getByRole('button')).toHaveCount(0);

  await ficheDeCarte(page, 'D', 'Terrebasse (23)');
  let t = await texteFiche(page);
  expect(t).toContain('Commune de montagne');
  expect(t).not.toContain('/ 100');
  expect(t).not.toMatch(/sur \d+ communes? qui passen?t/);
  await expect(fiche(page).getByRole('heading', { name: 'Ne passe pas tes critères' })).toHaveCount(0);

  // Choisir une commune déplace la carte : on rouvre la même adresse pour cliquer Portmer à sa place d'ouverture.
  await ouvrirSix(page, '/?loyer=aucun&env=bourg-et-village');
  await ficheDeCarte(page, 'A', 'Portmer (17)');
  t = await texteFiche(page);
  expect(t).toContain('Environnement : ville et périphérie, hors des types choisis');
});

// Hors AC (R31) : comme `taille`, un nom inconnu est ignoré, la liste réécrite dans l'ordre de R27, sans doublon.
test('R31 : env=campagne-isolee,village,ville-dense,campagne-isolee → /?loyer=1200&env=ville-dense,campagne-isolee, ces deux types cochés', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&env=campagne-isolee,village,ville-dense,campagne-isolee');
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&env=ville-dense,campagne-isolee');
  expect(await typesCoches(page)).toEqual(['Ville dense', 'Campagne isolée']);
  // Décocher le dernier : l'adresse ne garde que l'autre ; décocher les deux : `env` disparaît.
  await choixType(page, 'Campagne isolée').click();
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200&env=ville-dense');
  await choixType(page, 'Ville dense').click();
  await expect.poll(() => adresse(page)).toBe('/?loyer=1200');
});

// Hors AC (H75) : « 1 type » dans le résumé replié, entre les tailles et la mer.
test('H75 : « Cadre de vie » repliée dit « 1 taille · 1 type · Mer 50 km · Montagne 30 km »', async ({ page }) => {
  await ouvrirSix(page, '/?loyer=1200&mer=50&montagne=30&taille=petite-ville&env=ville-dense');
  await titreCadre(page).click();
  await expect(titreCadre(page)).toHaveAttribute('aria-expanded', 'false');
  expect(nbsp(await titreCadre(page).textContent())).toBe('Cadre de vie1 taille · 1 type · Mer 50 km · Montagne 30 km');
});

// Hors AC (H76, design F) : « Type d'environnement » entre la taille et « Proximité avec la nature », quatre boutons à bascule.
test('H76 : « Type d’environnement » (4 boutons à bascule, dans l’ordre de R27) entre « Taille de la commune » et « Proximité avec la nature » ; coche visible sur le type coché', async ({ page }) => {
  await ouvrirSix(page);
  expect((await types(page).getByRole('button').allInnerTexts()).map((t) => nbsp(t).trim())).toEqual([
    'Ville dense', 'Ville et périphérie', 'Bourg et village', 'Campagne isolée',
  ]);
  for (const b of await types(page).getByRole('button').all()) await expect(b).toHaveAttribute('aria-pressed', 'false');
  const y = async (l: ReturnType<typeof types>) => (await l.boundingBox())!.y;
  expect(await y(types(page))).toBeGreaterThan(await y(taille(page)));
  expect(await y(nature(page))).toBeGreaterThan(await y(types(page)));
  // La couleur n'est pas le seul indice : une coche apparaît sur le type coché.
  await expect(choixType(page, 'Ville dense').locator('svg')).toHaveCount(0);
  await choixType(page, 'Ville dense').click();
  await expect(choixType(page, 'Ville dense').locator('svg')).toHaveCount(1);
});

// Hors AC (contrat « Rangée qui défile ») — 390 px : une ligne qui défile au toucher, bord à bord de la feuille ; le dernier
// type s'atteint au clavier ; pastilles de 44 px.
test.describe('390 px, au toucher', () => {
  test.use({ hasTouch: true });
  test('rangée des types : une seule ligne, bord à bord, qui défile au doigt ; « Campagne isolée » atteinte à la tabulation et cochée à la barre d’espace ; pastilles de 44 px', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'rangée qui défile : sous 1 024 px');
    await ouvrirSix(page);
    await voirCriteres(page);
    // À l'ouverture, la rangée est sous le bas de l'écran : on l'y amène, comme l'utilisateur qui fait défiler « Critères ».
    await types(page).evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const boutons = await types(page).getByRole('button').all();
    const boites = await Promise.all(boutons.map(async (b) => (await b.boundingBox())!));
    expect(new Set(boites.map((b) => Math.round(b.y))).size).toBe(1); // une seule ligne
    for (const b of boites) expect(b.height).toBeGreaterThanOrEqual(44);
    const rangee = (await types(page).boundingBox())!;
    expect(rangee.x).toBeLessThanOrEqual(0); // bord à bord de la feuille
    expect(rangee.x + rangee.width).toBeGreaterThanOrEqual(390);
    const defile = () => types(page).evaluate((el) => ({ gauche: el.scrollLeft, depasse: el.scrollWidth - el.clientWidth }));
    expect((await defile()).depasse).toBeGreaterThan(0);
    expect((await defile()).gauche).toBe(0);

    // Glisser au doigt vers la gauche, par le protocole du navigateur (des PointerEvent fabriqués ne défilent pas, H41).
    const cdp = await page.context().newCDPSession(page);
    const y = rangee.y + rangee.height / 2;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 300, y }] });
    for (let i = 1; i <= 10; i++) {
      await page.waitForTimeout(20);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 300 - 20 * i, y }] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
    await expect.poll(async () => (await defile()).gauche).toBeGreaterThan(0);
    await expect(types(page).getByRole('button', { pressed: true })).toHaveCount(0); // un glisser ne coche rien

    // Au clavier : de « Ville dense », trois tabulations mènent à « Campagne isolée », amenée dans la vue.
    await types(page).evaluate((el) => (el.scrollLeft = 0));
    await choixType(page, 'Ville dense').focus();
    for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');
    const derniere = choixType(page, 'Campagne isolée');
    await expect(derniere).toBeFocused();
    await expect(derniere).toBeInViewport({ ratio: 1 });
    await page.keyboard.press('Space');
    await expect(derniere).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => adresse(page)).toBe('/?loyer=1200&env=campagne-isolee');
  });
});

// Hors AC (design F) — bureau : les quatre types passent à la ligne, tous visibles sans défiler, dans le panneau.
test('bureau : les quatre types visibles sans défilement, dans le panneau de réglages', async ({ page }, info) => {
  test.skip(info.project.name !== 'bureau', 'passe à la ligne : en bureau');
  await ouvrirSix(page);
  const defile = await types(page).evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(defile).toBeLessThanOrEqual(0);
  const panneau = (await page.getByRole('region', { name: 'Réglages' }).boundingBox())!;
  for (const b of await types(page).getByRole('button').all()) {
    await expect(b).toBeInViewport({ ratio: 1 });
    const r = (await b.boundingBox())!;
    expect(r.x).toBeGreaterThanOrEqual(panneau.x);
    expect(r.x + r.width).toBeLessThanOrEqual(panneau.x + panneau.width);
  }
});
