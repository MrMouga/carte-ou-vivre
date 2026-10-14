import type { Locator, Page } from '@playwright/test';
import { layout } from '../../../src/theme/tokens';

// Feuille mobile à deux onglets (interface-telephone, R18) : sous 1 024 px, la liste est dans l'onglet « Les 10 premières »,
// les réglages dans « Critères » (ouvert au départ), un seul affiché à la fois. En bureau, réglages et liste sont côte à
// côte : ces aides ne font rien. Elles changent la façon d'aller à la liste, jamais ce qu'un test vérifie.

export const mobile = (page: Page) => page.viewportSize()!.width < layout['largeur-bureau'];
export const onglet = (page: Page, nom: 'Critères' | 'Les 10 premières') => page.getByRole('tab', { name: nom, exact: true });

/**
 * 390 px : ouvre l'onglet « Les 10 premières » avant de lire ou de toucher la liste. Si le focus est dans l'ajout d'un
 * proche (la feuille montée n'a pas d'onglets), il en sort d'abord, comme on ferme le clavier du téléphone.
 */
export async function voirListe(page: Page) {
  if (!mobile(page)) return;
  if (!(await page.getByRole('tablist').isVisible())) await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await onglet(page, 'Les 10 premières').click();
}

/** 390 px : revient à l'onglet « Critères » avant de toucher un réglage ou « Tes proches », après un passage par la liste. */
export async function voirCriteres(page: Page) {
  if (mobile(page)) await onglet(page, 'Critères').click();
}

/**
 * 390 px : fait défiler l'onglet qui contient `cible` juste assez pour la voir en bas de l'écran (à 16 px du bord), comme
 * l'utilisateur qui fait défiler « Critères » jusqu'au champ ou au lien avant de le toucher.
 */
export async function amenerEnBas(cible: Locator) {
  await cible.evaluate((el) => {
    const onglet = el.closest('[role="tabpanel"]') as HTMLElement;
    onglet.scrollTop += el.getBoundingClientRect().bottom - (innerHeight - 16);
  });
}
