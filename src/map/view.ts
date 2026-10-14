// Cadrage de la carte : en bureau, la zone utile est entre le panneau de réglages (gauche) et la liste (droite).
import { layout, size, space } from '@/theme/tokens';

/**
 * Repère d'une commune (public/data/reperes.json, dans l'ordre de communes.json) : [lon, lat] du centre de son rond,
 * puis son cadre [ouest, sud, est, nord]. Les formes, elles, viennent des tuiles (tâche 7).
 */
export type Repere = [number, number, number, number, number, number];
export type Cadre = [number, number, number, number];

export type Padding = { top: number; right: number; bottom: number; left: number };

export function paddingBureau(): Padding {
  const s4 = space['space-4'];
  return {
    top: s4,
    left: s4 + size['taille-reglages'] + s4,
    right: s4 + size['taille-liste'] + s4,
    bottom: space['space-8'] + space['space-4'], // légende et mentions
  };
}

/** Hauteur de la feuille mobile ouverte dans une fenêtre de `hauteur` px : 45 %, au moins `taille-feuille-min` (338 px depuis D11 d'interface-telephone ; classe `h-feuille`). */
export const hauteurFeuille = (hauteur: number) => Math.max(hauteur * layout['part-feuille'], size['taille-feuille-min']);

/**
 * Cadrage selon la largeur : en bureau, entre les panneaux ; sous 1 024 px, dans la bande visible au-dessus de la feuille,
 * dont on donne la hauteur mesurée (sinon celle de la feuille ouverte).
 */
export function paddingCarte(largeur: number, hauteur: number, feuille?: number): Padding {
  if (largeur >= layout['largeur-bureau']) return paddingBureau();
  const s4 = space['space-4'];
  return { top: s4, left: s4, right: s4, bottom: (feuille ?? hauteurFeuille(hauteur)) + s4 };
}

export const cadreDe = (r: Repere): Cadre => [r[2], r[3], r[4], r[5]];

/** Emprise [ouest, sud, est, nord] des communes chargées. */
export function emprise(reperes: Repere[]): Cadre {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const r of reperes) {
    if (r[2] < w) w = r[2];
    if (r[3] < s) s = r[3];
    if (r[4] > e) e = r[4];
    if (r[5] > n) n = r[5];
  }
  return [w, s, e, n];
}
