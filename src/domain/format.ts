// Formats d'affichage (H3, R4) : espace insécable avant les milliers et avant les unités.
const NBSP = ' ';

function entier(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

export const euros = (n: number) => `${entier(n)}${NBSP}€`;
export const eurosM2 = (n: number) => `${(Math.round(n * 10) / 10).toFixed(1).replace('.', ',')}${NBSP}€/m²`;
export const km = (n: number) => `${entier(n)}${NBSP}km`;
/** Distance à la mer : « moins d'1 km » sous 1 km (R4). */
export const merTexte = (n: number) => (n < 1 ? `moins d'1${NBSP}km` : km(n));
/** Population au millier dès 10 000 habitants, à la centaine en dessous (H3). */
export const population = (n: number) => entier(n >= 10000 ? Math.round(n / 1000) * 1000 : Math.round(n / 100) * 100);

export const plafondLoyer = (v: number | null) => (v == null ? 'Sans limite' : euros(v));
export const plafondMer = (v: number | null) => (v == null ? 'Sans limite' : km(v));

export const nomAffiche = (c: { nom: string; dep: string }) => `${c.nom} (${c.dep})`;

/** Compte de la liste et de la zone annoncée (R5, D17). */
export function compte(n: number): string {
  if (n === 0) return 'Aucune commune ne passe tes critères';
  return n === 1 ? '1 commune passe tes critères' : `${entier(n)} communes passent tes critères`;
}

type PourListe = { nom: string; dep: string; loyerM2: number | null; merKm: number | null };

/** Sous-texte d'une ligne : « 650 € · moins d'1 km ». */
export const chiffresListe = (c: PourListe) =>
  [c.loyerM2 == null ? 'Loyer inconnu' : euros(Math.round(c.loyerM2 * 52)), c.merKm == null ? 'Distance à la mer inconnue' : merTexte(c.merKm)].join(' · ');

/** Ligne de liste (R5) : « 1 · Portmer (17) · 72 · 650 € · moins d'1 km ». */
export const ligneListe = (rang: number, c: PourListe, score: number) => `${rang} · ${nomAffiche(c)} · ${score} · ${chiffresListe(c)}`;
