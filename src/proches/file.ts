// File des calculs de proches (spec proches-fiables R36, D4, H98), sans effet : `useProches` en lance un à la fois, le
// premier de la file. Un ajout ou un « Recalculer avec l'IGN » passe devant les recalculs automatiques pas encore
// commencés (ceux de l'ouverture) ; entre eux, l'ordre d'arrivée. Le calcul en cours continue : il n'est plus dans la file.
// À l'ouverture, `useProches` met chaque calcul (recalcul automatique ou calcul de R37) en fin de file, sans `placer` :
// la file suit l'ordre d'ajout.
// Un proche n'a jamais deux calculs à la fois : déjà dans la file ou en cours, il n'y entre pas.

/**
 * Un calcul de la file : celui d'un nouveau proche (R33, R37), ou le recalcul d'un proche approximatif (R36) — `auto` :
 * lancé par l'ouverture (il cède sa place), sinon par l'utilisateur (« Recalculer avec l'IGN »).
 */
export type Tache = { id: number; depart: [number, number]; recalcul?: boolean; auto?: boolean };

/**
 * La file avec `tache` à sa place : un recalcul automatique en fin de file ; tout autre calcul juste devant le premier
 * recalcul automatique (en fin de file s'il n'y en a pas). `enCours` : id du proche qui calcule (null si aucun). Rend la
 * file reçue, inchangée, si le proche y est déjà ou calcule.
 */
export function placer(file: readonly Tache[], tache: Tache, enCours: number | null): readonly Tache[] {
  if (tache.id === enCours || file.some((t) => t.id === tache.id)) return file;
  const i = tache.auto ? -1 : file.findIndex((t) => t.auto);
  return i < 0 ? [...file, tache] : [...file.slice(0, i), tache, ...file.slice(i)];
}
