// Cadrage de la carte : en bureau, la zone utile est entre le panneau de réglages (gauche) et la liste (droite).
import { layout, size, space } from '@/theme/tokens';

/** Formes des communes (public/data/formes-1000m.json) : l'identifiant d'une forme est l'index de sa commune. */
export type Formes = {
  type: 'FeatureCollection';
  features: { type: 'Feature'; id: number; properties: object; geometry: { type: string; coordinates: unknown } }[];
};

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

/**
 * Cadrage selon la largeur : en bureau, entre les panneaux ; à 390 px, dans la bande visible au-dessus de la feuille,
 * dont on donne la hauteur (sinon celle de la feuille de la liste).
 */
export function paddingCarte(largeur: number, hauteur: number, feuille?: number): Padding {
  if (largeur >= layout['largeur-bureau']) return paddingBureau();
  const s4 = space['space-4'];
  return { top: s4, left: s4, right: s4, bottom: (feuille ?? hauteur * layout['part-feuille']) + s4 };
}

/** Emprise [ouest, sud, est, nord] des formes chargées. */
export function emprise(features: { geometry: { type: string; coordinates: unknown } }[]): [number, number, number, number] {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const walk = (c: unknown): void => {
    if (typeof (c as number[])[0] === 'number') {
      const [x, y] = c as number[];
      if (x < w) w = x;
      if (x > e) e = x;
      if (y < s) s = y;
      if (y > n) n = y;
    } else (c as unknown[]).forEach(walk);
  };
  for (const f of features) walk(f.geometry.coordinates);
  return [w, s, e, n];
}

type Geometrie = { type: string; coordinates: unknown };

/** Centre où poser le rond d'une commune : barycentre de l'anneau extérieur de son plus grand polygone. */
export function centre(g: Geometrie): [number, number] {
  const polys = (g.type === 'Polygon' ? [g.coordinates] : g.coordinates) as number[][][][];
  let best: [number, number] = [0, 0], bestAire = -1;
  for (const [anneau] of polys) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0, j = anneau.length - 1; i < anneau.length; j = i++) {
      const f = anneau[j][0] * anneau[i][1] - anneau[i][0] * anneau[j][1];
      a += f;
      cx += (anneau[j][0] + anneau[i][0]) * f;
      cy += (anneau[j][1] + anneau[i][1]) * f;
    }
    if (Math.abs(a) > bestAire) {
      bestAire = Math.abs(a);
      best = [cx / (3 * a), cy / (3 * a)];
    }
  }
  return best;
}
