// Règles de la spec loyer-mer : passage (R1, D11), note et score (R2, D4), palier de couleur (R3, D5), classement (R5, H4).
// Spec proches : chaque proche prêt est un critère de plus (R10, R11).
// Spec immobilier : le critère du prix suit le réglage du prix, passé en paramètre (R21, R22) ; un prix inconnu passe le
// filtre sans donner de note (R25, D21 de loyer-mer).
// Tout se compare sur les valeurs affichées : prix selon le réglage (R22), mer au km (sous 1 km : comparée comme 1 km).
import { PRIX_DEPART, valeurAffichee, type Achat, type ReglagePrix } from './prix';

export const SURFACE_M2 = 52;

export type Commune = {
  code: string;
  nom: string;
  dep: string;
  population: number | null;
  loyerM2: number | null;
  estimationPropre: boolean;
  merKm: number | null;
  // Spec immobilier (tâche 0) : un champ absent (jeu de test sans ces valeurs) vaut inconnu.
  loyerM2Maison?: number | null;
  estimationPropreMaison?: boolean | null;
  achatAppartement?: Achat;
  achatMaison?: Achat;
};

export type Taille = 'petite-commune' | 'petite-ville' | 'ville-moyenne' | 'grande-ville';

/**
 * Plafonds ; `null` = « Sans limite ». `loyer` : plafond du prix, dans le mode et l'unité du réglage du prix (en € ou en
 * €/m², loyer ou achat : nom gardé de loyer-mer). `mer` en km. `tailles` vide = « Peu importe ».
 */
export type Reglages = { loyer: number | null; mer: number | null; tailles: Taille[] };

export const REGLAGES_DEPART: Reglages = { loyer: 1200, mer: 60, tailles: [] }; // H1

/** Plafond d'un proche, en minutes : de 15 min à 3 h par pas de 15 min (R11, D15), 2 h à l'ajout (H19). */
export const PROCHE = { pas: 15, max: 180, ajout: 120 } as const;

/**
 * Proche **prêt** (R11) : son plafond en minutes et ses temps, un par commune dans l'ordre de `communes`.
 * Un temps est la fin de la tranche de 15 min (15 à 180) ; 0 = plus de 3 h ou sans route (R10).
 */
export type ProchePret = { nom: string; plafond: number; temps: Uint16Array };

export type Raison =
  /** Prix au-dessus du plafond, selon le mode et l'unité (R24). */
  | { critere: 'loyer' | 'loyer-m2' | 'achat' | 'achat-m2'; valeur: number; plafond: number }
  | { critere: 'mer'; valeur: number; plafond: number }
  | { critere: 'taille'; taille: Taille; population: number }
  /** `valeur` : fin de tranche en minutes, 0 = plus de 3 h. */
  | { critere: 'proche'; nom: string; valeur: number; plafond: number }
  /** Plus produite depuis R25 (un prix inconnu passe) ; gardée pour son texte. */
  | { critere: 'loyer-inconnu' }
  | { critere: 'mer-inconnue' }
  | { critere: 'taille-inconnue' };

export type Evaluation = {
  commune: Commune;
  passe: boolean;
  /** Score affiché (entier) si la commune passe avec au moins une note, sinon null. */
  score: number | null;
  /** R25 : passe, au moins un plafond actif, mais aucun critère ne la note (prix inconnu) : ni score, ni rang, hors du compte. */
  sansNote: boolean;
  /** Valeur affichée du prix (R22) selon le réglage, null si inconnu. */
  valeurPrix: number | null;
  palier: 1 | 2 | 3 | 4 | 5 | null;
  rang: number | null;
  raisons: Raison[];
};

export type Resultat = {
  /** Au moins un plafond actif (sinon : page « sans plafond »). */
  actif: boolean;
  parCode: Map<string, Evaluation>;
  /** Communes qui passent avec un score, triées (R5, H4) ; vide sans plafond. */
  classement: Evaluation[];
};

/** Loyer affiché pour 52 m², à l'euro (fiche de loyer-mer ; ailleurs, `valeurAffichee` de prix.ts). */
export const loyerPour = (m2: number) => Math.round(m2 * SURFACE_M2);
/** Distance utilisée pour comparer et noter : « moins d'1 km » vaut 1 km. */
const merComparee = (c: Commune) => (c.merKm == null ? null : Math.max(1, Math.round(c.merKm)));

/** D11 : population exactement sur un seuil → la taille du dessus (10 000 = petite ville). */
export function tailleDe(population: number | null): Taille | null {
  if (population == null) return null;
  if (population < 10000) return 'petite-commune';
  if (population < 50000) return 'petite-ville';
  if (population < 200000) return 'ville-moyenne';
  return 'grande-ville';
}

export function palier(score: number): 1 | 2 | 3 | 4 | 5 {
  return Math.min(5, Math.floor(score / 20) + 1) as 1 | 2 | 3 | 4 | 5;
}

const CRITERE_PRIX = { louer: { total: 'loyer', m2: 'loyer-m2' }, acheter: { total: 'achat', m2: 'achat-m2' } } as const;

export function evaluer(communes: Commune[], r: Reglages, proches: ProchePret[] = [], prix: ReglagePrix = PRIX_DEPART): Resultat {
  const actif = r.loyer != null || r.mer != null || proches.length > 0;
  const parCode = new Map<string, Evaluation>();
  const passent: Evaluation[] = [];
  communes.forEach((c, i) => {
    const raisons: Raison[] = [];
    const notes: number[] = [];
    const valeurPrix = valeurAffichee(c, prix);
    if (r.loyer != null && valeurPrix != null) {
      if (valeurPrix > r.loyer) raisons.push({ critere: CRITERE_PRIX[prix.mode][prix.unite], valeur: valeurPrix, plafond: r.loyer });
      else notes.push(100 * (1 - valeurPrix / r.loyer));
    }
    if (r.mer != null) {
      const v = merComparee(c);
      if (v == null) raisons.push({ critere: 'mer-inconnue' });
      else if (v > r.mer) raisons.push({ critere: 'mer', valeur: v, plafond: r.mer });
      else notes.push(100 * (1 - v / r.mer));
    }
    if (r.tailles.length) {
      const t = tailleDe(c.population);
      if (t == null) raisons.push({ critere: 'taille-inconnue' });
      else if (!r.tailles.includes(t)) raisons.push({ critere: 'taille', taille: t, population: c.population! });
    }
    for (const p of proches) {
      const v = p.temps[i];
      if (v === 0 || v > p.plafond) raisons.push({ critere: 'proche', nom: p.nom, valeur: v, plafond: p.plafond });
      else notes.push(100 * (1 - v / p.plafond));
    }
    const passe = raisons.length === 0;
    const sansNote = passe && actif && notes.length === 0;
    const score = passe && notes.length > 0 ? Math.round(notes.reduce((a, b) => a + b, 0) / notes.length) : null;
    const e: Evaluation = { commune: c, passe, score, sansNote, valeurPrix, palier: score == null ? null : palier(score), rang: null, raisons };
    parCode.set(c.code, e);
    if (score != null) passent.push(e);
  });
  // Décision de Vincent (2026-10-14, remplace H4 étendue) : les communes sans prix viennent après toutes celles qui en ont
  // un, dans le même ordre entre elles ; leur score et leur couleur ne changent pas.
  passent.sort(
    (a, b) =>
      Number(a.valeurPrix == null) - Number(b.valeurPrix == null) ||
      b.score! - a.score! ||
      (a.valeurPrix ?? 0) - (b.valeurPrix ?? 0) || // H4 : prix affiché croissant
      a.commune.nom.localeCompare(b.commune.nom, 'fr'),
  );
  passent.forEach((e, i) => (e.rang = i + 1));
  return { actif, parCode, classement: passent };
}
