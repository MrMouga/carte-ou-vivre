import { expect, test, type Page } from '@playwright/test';
import { ouvrir } from './lib/carte';
import { servirIgn } from './lib/ign';
import { ADRESSES, ajouter, champ, pret, zone } from './lib/proches';
import { size } from '../../src/theme/tokens';

// Défaut vu sur l'iPhone de Vincent (Safari, iOS 18.7, 2026-10-13, captures/T5-iphone-vincent-bug-clavier.png) : il touche
// « Adresse ou ville », le clavier s'ouvre, et le champ n'est plus à l'écran (on voit le haut de la liste).
//
// Ce que fait iOS (raisonnement sur WebKit, à confirmer par l'essai sur l'iPhone) : quand le champ prend le focus, WebKit relève où il est (à la fin de l'événement `focus`), puis, à
// l'ouverture du clavier, fait glisser la partie visible de la page pour amener ce rectangle au-dessus du clavier. Si notre
// code déplace le champ ensuite (la feuille qui défile une image plus tard), iOS a glissé pour rien et le champ part hors
// de la vue. Le navigateur de test n'a ni clavier ni ce glissement : on vérifie donc les deux conditions qui l'évitent :
// 1. à la fin de l'événement `focus`, le champ est déjà à sa place finale, sous la poignée, au-dessus du clavier ;
// 2. il ne bouge plus ensuite.
//
// Mesures de l'iPhone de Vincent (390 × 844, barre d'adresse en haut) : la fenêtre de Safari fait ≈ 664 px de haut ; le
// clavier et sa barre commencent à y ≈ 342 dans cette fenêtre (449 px sur l'écran, moins les 107 px de la barre de Safari).
const FENETRE_SAFARI = { width: 390, height: 664 };
const CLAVIER_IPHONE = 342;
const POIGNEE = 12; // la poignée collée en haut de la feuille (pt-2 + rail de 4 px)

test.use({ viewport: FENETRE_SAFARI, hasTouch: true });

type Boite = { top: number; bottom: number };
declare global {
  interface Window {
    __champAuFocus?: Boite;
  }
}

/** Relève la position du champ « Adresse ou ville » à la fin de l'événement `focus`, là où WebKit la lit. */
async function releverAuFocus(page: Page) {
  await page.evaluate(() => {
    delete window.__champAuFocus;
    // Écouteur sur `window`, phase de remontée : il passe après celui de React (posé sur la racine) et après ce que React
    // a rendu entre les deux (les mises à jour d'un événement discret sont rendues dans la file des microtâches).
    addEventListener('focusin', (e) => {
      const el = e.target as HTMLInputElement;
      if (el.labels?.[0]?.textContent?.trim() !== 'Adresse ou ville') return;
      const r = el.getBoundingClientRect();
      window.__champAuFocus = { top: r.top, bottom: r.bottom };
    });
  });
}

/** Fait défiler la feuille comme Vincent : juste assez pour voir le champ en bas de l'écran. */
async function defilerJusquAuChamp(page: Page) {
  await champ(page).evaluate((el) => {
    const feuille = el.closest('[role="tabpanel"]') as HTMLElement; // ce qui défile : l'onglet « Critères » de la feuille (interface-telephone)
    feuille.scrollTop += el.getBoundingClientRect().bottom - (innerHeight - 16);
  });
  const b = (await champ(page).boundingBox())!;
  expect(b.y + b.height).toBeLessThanOrEqual(FENETRE_SAFARI.height);
}

async function verifier(page: Page) {
  await expect(champ(page)).toBeFocused();
  const auFocus = await page.evaluate(() => window.__champAuFocus);
  expect(auFocus, 'position du champ relevée au focus').toBeDefined();
  // 1. Au focus : sous la poignée de la feuille montée, et entièrement au-dessus du clavier : iOS n'a rien à faire glisser.
  expect(auFocus!.top).toBeGreaterThanOrEqual(size['taille-bande-carte'] + POIGNEE);
  expect(auFocus!.bottom).toBeLessThanOrEqual(CLAVIER_IPHONE);
  // 2. Après : le champ n'a pas bougé (deux images plus tard, une fois tout rendu).
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 100)))));
  const apres = (await champ(page).boundingBox())!;
  expect(Math.abs(apres.y - auFocus!.top)).toBeLessThanOrEqual(1);
}

test('iPhone : toucher « Adresse ou ville » (0 proche) — au focus, le champ est déjà sous la poignée, au-dessus du clavier, et ne bouge plus', async ({ page }) => {
  await ouvrir(page);
  await servirIgn(page);
  await defilerJusquAuChamp(page);
  await releverAuFocus(page);
  await champ(page).tap();
  await verifier(page);
});

test('iPhone : toucher « + Ajouter un proche » (1 proche) — au focus, le champ est déjà sous la poignée, au-dessus du clavier, et ne bouge plus', async ({ page }) => {
  await ouvrir(page);
  await servirIgn(page);
  await ajouter(page, 'Nantesville');
  const lien = zone(page).getByRole('button', { name: '+ Ajouter un proche' });
  await lien.evaluate((el) => {
    const feuille = el.closest('[role="tabpanel"]') as HTMLElement; // ce qui défile : l'onglet « Critères » de la feuille (interface-telephone)
    feuille.scrollTop += el.getBoundingClientRect().bottom - (innerHeight - 16);
  });
  await releverAuFocus(page);
  await lien.tap();
  await verifier(page);
});

test('iPhone : les champs de l’ajout ne ressemblent pas à un formulaire d’adresse pour Safari (pas de « AutoFill Contact »)', async ({ page }) => {
  // Safari ignore `autocomplete="off"` sur un champ qui ressemble à une adresse et propose la fiche contact de
  // l'utilisateur. Il ne propose rien sur un champ de recherche : `name` et `id` contiennent « search ».
  await ouvrir(page);
  await servirIgn(page);
  await champ(page).fill(ADRESSES.Nantesville[0]);
  await zone(page).getByRole('button', { name: ADRESSES.Nantesville[1] }).click();
  for (const l of [champ(page), zone(page).getByRole('textbox', { name: 'Nom' })]) {
    await expect(l).toHaveAttribute('autocomplete', 'off');
    await expect(l).toHaveAttribute('name', /search/);
    await expect(l).toHaveAttribute('id', /search/);
  }
});

// AC-8 (interface-telephone, R20, D7). Mesure de la tâche 0 sur l'iPhone de Vincent (mesure-tache-0.md) : Safari note la
// place du champ au tout début du focus, **avant** notre code, puis, à l'ouverture du clavier, fait défiler la page pour
// centrer cette ancienne place dans la partie visible (165 px mesurés, 165,3 calculés) ; le champ remonté entre-temps
// part au-dessus de l'écran. On relève donc la place de chaque champ par un écouteur `focusin` en **capture** sur `window`,
// posé avant le chargement de la page : il passe avant tout écouteur de la page, donc avant notre code.
type AuFocus = Partial<Record<'Adresse ou ville' | 'Nom', Boite>>;
declare global {
  interface Window {
    __auFocus?: AuFocus;
  }
}

async function releverDesLeChargement(page: Page) {
  await page.addInitScript(() => {
    window.__auFocus = {};
    addEventListener(
      'focusin',
      (e) => {
        const el = e.target as HTMLInputElement;
        const nom = el.labels?.[0]?.textContent?.trim();
        if (nom !== 'Adresse ou ville' && nom !== 'Nom') return;
        const r = el.getBoundingClientRect();
        window.__auFocus![nom] = { top: r.top, bottom: r.bottom };
      },
      true,
    );
  });
}

const auFocus = (page: Page, nom: keyof AuFocus) => page.evaluate((n) => window.__auFocus?.[n], nom);
const deuxImages = (page: Page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 100)))));
const PROCHES_AC8 = ['Nantesville', 'Toulouseville', 'Lyonville', 'Brestville'] as const;
const NOMS_AC8 = ['Nantesville (44)', 'Toulouseville (31)', 'Lyonville (69)', 'Brestville (29)'];

for (const n of [0, 4]) {
  test(`AC-8 à 390 × 664, au toucher, ${n ? '4 proches prêts, « + Ajouter un proche »' : 'sans proche, « Adresse ou ville »'} : au focus, chaque champ est déjà à sa place au-dessus de y = 342 ; suggestion, « Nom » et « Ajouter » aussi`, async ({ page }) => {
    test.setTimeout(60_000);
    await releverDesLeChargement(page);
    await ouvrir(page, '/?loyer=1200&mer=60');
    await servirIgn(page);
    for (const c of PROCHES_AC8.slice(0, n)) await ajouter(page, c);
    for (const nom of NOMS_AC8.slice(0, n)) await pret(page, nom, 30_000);
    // Comme Vincent : faire défiler « Critères » jusqu'à voir le champ (ou le lien) en bas de l'écran, puis le toucher.
    const cible = n ? zone(page).getByRole('button', { name: '+ Ajouter un proche' }) : champ(page);
    await cible.evaluate((el) => {
      const onglet = el.closest('[role="tabpanel"]') as HTMLElement;
      onglet.scrollTop += el.getBoundingClientRect().bottom - (innerHeight - 16);
    });
    await page.evaluate(() => (window.__auFocus = {}));
    await cible.tap();

    // Le champ d'adresse : au focus, déjà sous la poignée de la feuille montée, et au-dessus du clavier.
    await expect(champ(page)).toBeFocused();
    const adresse = await auFocus(page, 'Adresse ou ville');
    expect(adresse, 'place du champ d’adresse au début du focus').toBeDefined();
    expect(adresse!.top).toBeGreaterThanOrEqual(size['taille-bande-carte'] + POIGNEE);
    expect(adresse!.bottom).toBeLessThanOrEqual(CLAVIER_IPHONE);

    // La saisie : le champ ne bouge plus ; la première suggestion est entièrement au-dessus du clavier.
    await champ(page).pressSequentially('1 rue Test');
    const suggestions = zone(page).getByRole('list', { name: 'Suggestions' }).getByRole('button');
    await expect(suggestions.first()).toHaveAccessibleName('1 rue Test, 44000 Nantesville');
    await deuxImages(page);
    expect(Math.abs((await champ(page).boundingBox())!.y - adresse!.top)).toBeLessThanOrEqual(1);
    const s = (await suggestions.first().boundingBox())!;
    expect(s.y + s.height).toBeLessThanOrEqual(CLAVIER_IPHONE);

    // Le choix : « Nom » a le focus, déjà à sa place au début du focus ; « Nom » et « Ajouter » au-dessus du clavier.
    await suggestions.first().tap();
    const nom = zone(page).getByRole('textbox', { name: 'Nom' });
    await expect(nom).toBeFocused();
    const nomAuFocus = await auFocus(page, 'Nom');
    expect(nomAuFocus, 'place de « Nom » au début du focus').toBeDefined();
    await deuxImages(page);
    const nomApres = (await nom.boundingBox())!;
    expect(Math.abs(nomApres.y - nomAuFocus!.top)).toBeLessThanOrEqual(1);
    expect(nomAuFocus!.bottom).toBeLessThanOrEqual(CLAVIER_IPHONE);
    const b = (await zone(page).getByRole('button', { name: 'Ajouter', exact: true }).boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(CLAVIER_IPHONE);
  });
}
