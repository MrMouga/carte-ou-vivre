import { SURFACE_M2, loyerPour, tailleDe, type Raison, type Taille } from './score';
import { achatDe, estimationSecteur, estimationTousBiens, PRIX_DEPART, prixM2, valeurAffichee, type PrixCommune, type ReglagePrix } from './prix';

// Formats d'affichage (H3, R4) : espace insécable avant les milliers et avant les unités.
const NBSP = ' ';

function entier(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

export const euros = (n: number) => `${entier(n)}${NBSP}€`;
export const eurosM2 = (n: number) => `${(Math.round(n * 10) / 10).toFixed(1).replace('.', ',')}${NBSP}€/m²`;
/** Prix d'achat au m² et plafonds au m² : à l'euro (H59, H57). */
export const eurosM2Entier = (n: number) => `${entier(n)}${NBSP}€/m²`;
export const km = (n: number) => `${entier(n)}${NBSP}km`;
/** Distance à la mer : « moins d'1 km » sous 1 km (R4). */
export const merTexte = (n: number) => (n < 1 ? `moins d'1${NBSP}km` : km(n));
/** Population au millier dès 10 000 habitants, à la centaine en dessous (H3). */
export const population = (n: number) => entier(n >= 10000 ? Math.round(n / 1000) * 1000 : Math.round(n / 100) * 100);

export const plafondLoyer = (v: number | null) => (v == null ? 'Sans limite' : euros(v));
export const plafondMer = (v: number | null) => (v == null ? 'Sans limite' : km(v));
/** Plafond du prix dans l'unité du réglage : « 1 200 € », « 23 €/m² », « 5 000 €/m² », « Sans limite » (H57). */
export const plafondPrix = (v: number | null, p: ReglagePrix) => (v == null ? 'Sans limite' : p.unite === 'total' ? euros(v) : eurosM2Entier(v));

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

type PourListe = { nom: string; dep: string; merKm: number | null } & PrixCommune;

/**
 * Message de la liste quand aucune commune ne passe (état **aucune commune**) ; en Acheter, « le prix » remplace « le
 * loyer » (details.md d'immobilier) ; en Louer, les textes de loyer-mer et de proches.
 */
export function messageAucune(p: ReglagePrix, avecProche: boolean): string {
  const prix = p.mode === 'acheter' ? 'le prix' : 'le loyer';
  return `Aucune commune ne passe tes critères. Relâche ${prix}, ${avecProche ? 'la mer, la taille ou un proche' : 'la mer ou la taille'}.`;
}

/** Message de la liste sans plafond (prix et mer sur « Sans limite », aucun proche prêt). */
export const messageSansPlafond = (p: ReglagePrix) =>
  `Fixe ${p.mode === 'acheter' ? "un prix d'achat" : 'un loyer'} ou une distance à la mer pour classer les communes.`;

/** Colonne du prix de la liste (R24) : « 198 000 € », « 12,5 €/m² », « 3 800 €/m² », « prix inconnu ». */
export function prixListe(c: PrixCommune, p: ReglagePrix): string {
  const v = valeurAffichee(c, p);
  if (v == null) return 'prix inconnu';
  return p.unite === 'total' ? euros(v) : p.mode === 'louer' ? eurosM2(v) : eurosM2Entier(v);
}

/** Sous-texte d'une ligne : « 650 € · moins d'1 km ». */
export const chiffresListe = (c: PourListe, p: ReglagePrix = PRIX_DEPART) =>
  [prixListe(c, p), c.merKm == null ? 'Distance à la mer inconnue' : merTexte(c.merKm)].join(' · ');

/** Ligne de liste (R5) : « 1 · Portmer (17) · 72 · 650 € · moins d'1 km ». */
export const ligneListe = (rang: number, c: PourListe, score: number, p: ReglagePrix = PRIX_DEPART) =>
  `${rang} · ${nomAffiche(c)} · ${score} · ${chiffresListe(c, p)}`;

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

/** Ligne du prix de la fiche (R24, D7) : le prix du mode et de l'unité choisis seulement. */
export function prixFiche(c: PrixCommune, p: ReglagePrix): string {
  const v = valeurAffichee(c, p);
  if (v == null) {
    if (p.mode === 'louer') return 'Loyer inconnu';
    return achatDe(c, p.bien).source === 'inconnu-alsace-moselle'
      ? "Prix d'achat inconnu : les ventes ne sont pas publiées en Alsace-Moselle"
      : "Prix d'achat inconnu : trop peu de ventes dans le secteur";
  }
  const m2 = prixM2(c, p)!;
  if (p.mode === 'louer') return p.unite === 'total' ? `${euros(v)} par mois pour ${p.surface}${NBSP}m² (${eurosM2(m2)})` : `${eurosM2(v)} par mois`;
  return p.unite === 'total' ? `${euros(v)} pour ${p.surface}${NBSP}m² (${eurosM2Entier(m2)})` : `${eurosM2Entier(v)} à l'achat`;
}

/** Mention sous la ligne du prix quand il est pris au secteur (R24, D12 de loyer-mer) ou sur tous les biens (D12, H84), sinon null. */
export function estimationTexte(c: PrixCommune, p: ReglagePrix): string | null {
  if (estimationTousBiens(c, p)) return `Estimation tous biens (trop peu de ventes ${p.bien === 'appartement' ? "d'appartements" : 'de maisons'})`;
  if (!estimationSecteur(c, p)) return null;
  return p.mode === 'louer' ? 'Estimation du secteur (communes voisines)' : 'Estimation du secteur (moins de 5 ventes dans la commune)';
}

/** Résumé de la catégorie repliée : « Louer · Appartement · 52 m² · 1 200 € » ; sans la surface en Au m². */
export const resumePrix = (p: ReglagePrix, plafond: number | null) =>
  [
    p.mode === 'louer' ? 'Louer' : 'Acheter',
    p.bien === 'appartement' ? 'Appartement' : 'Maison',
    ...(p.unite === 'total' ? [`${p.surface}${NBSP}m²`] : []),
    plafondPrix(plafond, p),
  ].join(' · ');

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
    case 'loyer-m2':
      return `Loyer ${eurosM2(r.valeur)} : au-dessus de ton plafond de ${eurosM2Entier(r.plafond)}`;
    case 'achat':
      return `Achat ${euros(r.valeur)} : au-dessus de ton plafond de ${euros(r.plafond)}`;
    case 'achat-m2':
      return `Achat ${eurosM2Entier(r.valeur)} : au-dessus de ton plafond de ${eurosM2Entier(r.plafond)}`;
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
