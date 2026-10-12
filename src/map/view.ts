// Cadrage de la carte en bureau : la zone utile est entre le panneau de réglages (gauche) et la liste (droite).
import { size, space } from '@/theme/tokens';

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
