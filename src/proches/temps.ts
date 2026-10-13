// Temps d'un proche (R10) : chaque mairie prend la fin de la plus petite tranche de 15 min dont la zone de l'IGN la contient ;
// 0 = hors de toutes les zones (« plus de 3 h »). Le résultat a le format de la mémoire du navigateur (R12) :
// un entier 16 bits par commune, dans l'ordre de communes.json. Lancé dans un Web Worker (tâche 0 : 40 ms, page fluide).

/** Zone de l'IGN telle qu'elle arrive (`geometry` de la réponse) : toujours vue en Polygon, MultiPolygon prévu. */
export type Geometrie = { type: 'Polygon'; coordinates: number[][][] } | { type: 'MultiPolygon'; coordinates: number[][][][] };

// Rayon horizontal pair-impair sur tous les anneaux (les trous comptent). Les arêtes sont rangées par bandes de latitude :
// on ne teste que celles de la bande du point (une zone de 3 h a environ 10 000 sommets).
const BANDES = 512;
type Index = { d: number; o: number; s: number; e: number; n: number; h: number; bandes: Float64Array[] };

function indexer(d: number, g: Geometrie): Index {
  const anneaux = g.type === 'Polygon' ? g.coordinates : g.coordinates.flat();
  let [o, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const a of anneaux)
    for (const [x, y] of a) {
      if (x < o) o = x;
      if (x > e) e = x;
      if (y < s) s = y;
      if (y > n) n = y;
    }
  const h = (n - s) / BANDES || 1;
  const tmp: number[][] = Array.from({ length: BANDES }, () => []);
  for (const a of anneaux)
    for (let k = 0; k < a.length - 1; k++) {
      const [x1, y1] = a[k];
      const [x2, y2] = a[k + 1];
      const b0 = Math.max(0, Math.floor((Math.min(y1, y2) - s) / h));
      const b1 = Math.min(BANDES - 1, Math.floor((Math.max(y1, y2) - s) / h));
      for (let b = b0; b <= b1; b++) tmp[b].push(x1, y1, x2, y2);
    }
  return { d, o, s, e, n, h, bandes: tmp.map((t) => Float64Array.from(t)) };
}

function dedans(z: Index, x: number, y: number): boolean {
  if (x < z.o || x > z.e || y < z.s || y > z.n) return false;
  const ar = z.bandes[Math.min(BANDES - 1, Math.floor((y - z.s) / z.h))];
  let c = false;
  for (let k = 0; k < ar.length; k += 4) {
    const y1 = ar[k + 1];
    const y2 = ar[k + 3];
    if (y1 > y !== y2 > y && x < ((ar[k + 2] - ar[k]) * (y - y1)) / (y2 - y1) + ar[k]) c = !c;
  }
  return c;
}

/** Fins de tranche en minutes, une par point (`points` : lon, lat alternés) ; 0 = dans aucune zone. */
export function classer(zones: [number, Geometrie][], points: Float64Array): Uint16Array {
  const idx = zones.map(([d, g]) => indexer(d, g)).sort((a, b) => a.d - b.d);
  const fins = new Uint16Array(points.length / 2);
  for (let i = 0; i < fins.length; i++) {
    const [x, y] = [points[2 * i], points[2 * i + 1]];
    for (const z of idx)
      if (dedans(z, x, y)) {
        fins[i] = z.d;
        break;
      }
  }
  return fins;
}

/** Points des mairies (public/data/reperes.json : [lon, lat, …] dans l'ordre de communes.json), pour le classement. */
export const pointsDes = (reperes: number[][]) => Float64Array.from(reperes.flatMap((r) => [r[0], r[1]]));

/**
 * Point de départ (D6) : l'adresse, au point rendu par la recherche, sans arrondi (H28) ; pour une commune choisie seule,
 * sa mairie, trouvée par code INSEE (le point de la recherche reste un secours si la commune manque à la carte).
 */
export function departDe(
  s: { code: string; estCommune: boolean; point: [number, number] },
  mairie: (code: string) => [number, number] | undefined,
): [number, number] {
  return (s.estCommune && mairie(s.code)) || s.point;
}
