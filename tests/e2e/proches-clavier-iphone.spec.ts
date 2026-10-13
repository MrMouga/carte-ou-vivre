import { expect, test, type Page } from '@playwright/test';
import { ouvrir } from './lib/carte';
import { servirIgn } from './lib/ign';
import { ADRESSES, ajouter, champ, zone } from './lib/proches';
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
    const feuille = el.closest('[data-testid="feuille"]') as HTMLElement;
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
    const feuille = el.closest('[data-testid="feuille"]') as HTMLElement;
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
