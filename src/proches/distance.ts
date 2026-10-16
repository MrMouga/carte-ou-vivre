// Repli à vol d'oiseau d'un proche (spec proches-fiables R35, D3) : quand l'IGN n'a pas couvert son plafond, chaque
// commune vaut la distance du point de départ du proche (son adresse, ou la mairie d'une commune choisie seule, H101) à sa
// mairie, sur la sphère de 6 371 km comme la mer et la montagne (H95). Sans effet ni réseau.

const RAYON_KM = 6371;
/** H94 : 1 h = 60 km à vol d'oiseau, un pas de 15 min pour un pas de 15 km. */
const KM_PAR_HEURE = 60;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Distance à vol d'oiseau entre deux points [lon, lat], en km, non arrondie (formule de haversine). */
export function distanceKm([lon1, lat1]: readonly number[], [lon2, lat2]: readonly number[]): number {
  const h = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * RAYON_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Distances du départ à chaque mairie (`points` : lon, lat alternés, dans l'ordre de communes.json), en km. */
export function distances(depart: readonly number[], points: Float64Array): Float64Array {
  const d = new Float64Array(points.length / 2);
  for (let i = 0; i < d.length; i++) d[i] = distanceKm(depart, [points[2 * i], points[2 * i + 1]]);
  return d;
}

/** H94 : plafond en km à l'entrée en repli, depuis le plafond en minutes (45 min → 45 km, 3 h → 180 km). */
export const kmDePlafond = (minutes: number) => (minutes / 60) * KM_PAR_HEURE;

/** H94, dans l'autre sens (R36) : un proche km qui repasse en heures garde son plafond converti (90 km → 1 h 30). */
export const minutesDeKm = (plafondKm: number) => (plafondKm / KM_PAR_HEURE) * 60;
