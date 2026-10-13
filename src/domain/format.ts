import { SURFACE_M2, loyerPour, tailleDe, type Raison, type Taille } from './score';

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

/** Temps ou plafond d'un proche (H22), en minutes : « 15 min », « 1 h », « 2 h 15 » ; 0 = « plus de 3 h » (R10). */
export function duree(min: number): string {
  if (min === 0) return `plus de 3${NBSP}h`;
  if (min < 60) return `${min}${NBSP}min`;
  const m = min % 60;
  return `${Math.floor(min / 60)}${NBSP}h${m ? `${NBSP}${String(m).padStart(2, '0')}` : ''}`;
}

export const nomAffiche = (c: { nom: string; dep: string }) => `${c.nom} (${c.dep})`;

/** Compte de la liste et de la zone annoncée (R5, D17). */
export function compte(n: number): string {
  if (n === 0) return 'Aucune commune ne passe tes critères';
  return n === 1 ? '1 commune passe tes critères' : `${entier(n)} communes passent tes critères`;
}

type PourListe = { nom: string; dep: string; loyerM2: number | null; merKm: number | null };

/** Sous-texte d'une ligne : « 650 € · moins d'1 km ». */
export const chiffresListe = (c: PourListe) =>
  [c.loyerM2 == null ? 'Loyer inconnu' : euros(loyerPour(c.loyerM2)), c.merKm == null ? 'Distance à la mer inconnue' : merTexte(c.merKm)].join(' · ');

/** Ligne de liste (R5) : « 1 · Portmer (17) · 72 · 650 € · moins d'1 km ». */
export const ligneListe = (rang: number, c: PourListe, score: number) => `${rang} · ${nomAffiche(c)} · ${score} · ${chiffresListe(c)}`;

// Fiche (R4, R6, R1) et pastilles de taille.
export const LIBELLE_TAILLE: Record<Taille, string> = {
  'petite-commune': 'Petite commune',
  'petite-ville': 'Petite ville',
  'ville-moyenne': 'Ville moyenne',
  'grande-ville': 'Grande ville',
};

export const tailleTexte = (pop: number | null) =>
  pop == null ? 'Taille inconnue' : `${LIBELLE_TAILLE[tailleDe(pop)!]} · ${population(pop)}${NBSP}habitants`;

export const loyerTexte = (m2: number | null) =>
  m2 == null ? 'Loyer inconnu' : `${euros(loyerPour(m2))} par mois pour ${SURFACE_M2}${NBSP}m² (${eurosM2(m2)})`;

export const merFiche = (k: number | null) =>
  k == null ? 'Distance à la mer inconnue' : k < 1 ? `moins d'1${NBSP}km de la mer` : `${km(k)} de la mer à vol d'oiseau`;

/** « 1re », « 2e »… */
export const ordinal = (n: number) => `${n}${n === 1 ? 're' : 'e'}`;

export const rangTexte = (rang: number, n: number) =>
  `${ordinal(rang)} sur ${entier(n)} ${n === 1 ? 'commune qui passe' : 'communes qui passent'}`;

export function raisonTexte(r: Raison): string {
  switch (r.critere) {
    case 'loyer':
      return `Loyer ${euros(r.valeur)} : au-dessus de ton plafond de ${euros(r.plafond)}`;
    case 'mer':
      return `Mer ${km(r.valeur)} : au-dessus de ton plafond de ${km(r.plafond)}`;
    case 'taille':
      return `Taille : ${LIBELLE_TAILLE[r.taille].toLowerCase()} (${population(r.population)}${NBSP}habitants)`;
    case 'loyer-inconnu':
      return 'Loyer inconnu';
    case 'mer-inconnue':
      return 'Distance à la mer inconnue';
    case 'taille-inconnue':
      return 'Taille inconnue';
    case 'proche':
      return `${r.nom} ${duree(r.valeur)} : au-dessus de ton plafond de ${duree(r.plafond)}`;
  }
}
