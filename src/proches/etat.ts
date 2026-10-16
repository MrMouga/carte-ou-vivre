import { PROCHE } from '../domain/score';
import { minutesDeKm } from './distance';

// État d'un proche à la fin de son calcul (spec proches-fiables R33, R34, H97) et recalcul à la réouverture (R36), sans
// effet ni réseau.
// `zones` : durées des zones obtenues de l'IGN, en minutes (15, 30… 180), dans n'importe quel ordre.

export type EtatCalcul = 'pret' | 'partiel' | 'km';

const NB_ZONES = PROCHE.max / PROCHE.pas;

/** Un proche partiel ou km est approximatif : il se recalcule (R36). */
export const approximatif = (etat: string) => etat === 'partiel' || etat === 'km';

/** D5, H99 : un proche prêt, partiel ou km compte comme un prêt (score, repère, ligne). */
export const commeUnPret = (etat: string) => etat === 'pret' || approximatif(etat);

/** Couverture : la plus grande zone obtenue, 0 si aucune. */
export const couverture = (zones: readonly number[]) => Math.max(0, ...zones);

/**
 * R33 : prêt si les 12 zones ont répondu ; sinon partiel si la couverture atteint le plafond, km sinon (aucune zone : km).
 * `plafond` en minutes ; pour un proche en km, son plafond en km donne le même nombre (60 km par heure, H94 : km ÷ 60 h).
 */
export function etatDe(zones: readonly number[], plafond: number): EtatCalcul {
  if (zones.length === NB_ZONES) return 'pret';
  return couverture(zones) >= plafond ? 'partiel' : 'km';
}

/**
 * R34 : comment s'écrit la fin de tranche `fin` d'une commune (0 = dans aucune zone obtenue) — exacte, « jusqu'à » quand
 * la zone juste dessous manque (la commune peut être dans cette zone manquante), ou « plus de <couverture> ».
 */
export function marque(fin: number, zones: readonly number[]): 'exacte' | 'jusqua' | 'au-dela' {
  if (fin === 0) return 'au-dela';
  return fin > PROCHE.pas && !zones.includes(fin - PROCHE.pas) ? 'jusqua' : 'exacte';
}

const RANG: Record<EtatCalcul, number> = { km: 0, partiel: 1, pret: 2 };

/** H97 : `nouveau` est-il plus complet qu'`ancien` ? Prêt d'abord ; entre deux partiels, plus de zones, puis plus de couverture ; km en dernier. */
export function plusComplet(nouveau: { etat: EtatCalcul; zones: readonly number[] }, ancien: { etat: EtatCalcul; zones: readonly number[] }): boolean {
  if (RANG[nouveau.etat] !== RANG[ancien.etat]) return RANG[nouveau.etat] > RANG[ancien.etat];
  if (nouveau.etat !== 'partiel') return false;
  if (nouveau.zones.length !== ancien.zones.length) return nouveau.zones.length > ancien.zones.length;
  return couverture(nouveau.zones) > couverture(ancien.zones);
}

/** D4, H93 : un proche approximatif se recalcule à l'ouverture au plus une fois par 15 min, comptées depuis le début du dernier essai. */
export const ATTENTE_RECALCUL_MS = 15 * 60_000;

/** R36 : à l'ouverture, ce proche passe-t-il en recalcul ? Partiel ou km, et dernier essai commencé il y a 15 min au moins (ou inconnu). */
export const aRecalculer = (p: { etat: string; essai?: number }, maintenant: number) =>
  approximatif(p.etat) && (p.essai == null || maintenant - p.essai >= ATTENTE_RECALCUL_MS);

/**
 * R36 : ce que devient un proche approximatif quand son recalcul rend `zones`. L'état se décide au plafond affiché à
 * l'arrivée du résultat (R33 ; en km, le même nombre de minutes, H94) ; le nouveau résultat remplace l'ancien seulement
 * s'il est plus complet (H97) : rend alors l'état et le plafond en minutes (km ÷ 60 h), sinon null (l'ancien reste).
 */
export function recalcule(
  ancien: { etat: EtatCalcul; zones: readonly number[]; plafond: number },
  zones: readonly number[],
): { etat: EtatCalcul; plafond: number } | null {
  const plafond = ancien.etat === 'km' ? minutesDeKm(ancien.plafond) : ancien.plafond;
  const etat = etatDe(zones, plafond);
  return plusComplet({ etat, zones }, ancien) ? { etat, plafond } : null;
}
