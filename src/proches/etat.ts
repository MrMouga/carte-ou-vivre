import { PROCHE } from '../domain/score';

// État d'un proche à la fin de son calcul (spec proches-fiables R33, R34, H97), sans effet ni réseau.
// `zones` : durées des zones obtenues de l'IGN, en minutes (15, 30… 180), dans n'importe quel ordre.

export type EtatCalcul = 'pret' | 'partiel' | 'km';

const NB_ZONES = PROCHE.max / PROCHE.pas;

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
