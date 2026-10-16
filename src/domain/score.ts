// Règles de la spec loyer-mer : passage (R1, D11), note et score (R2, D4), palier de couleur (R3, D5), classement (R5, H4).
// Spec proches : chaque proche prêt est un critère de plus (R10, R11).
// Spec immobilier : le critère du prix suit le réglage du prix, passé en paramètre (R21, R22) ; un prix inconnu passe le
// filtre sans donner de note (R25, D21 de loyer-mer).
// Spec cadre-de-vie : la montagne filtre et note comme la mer (R29) ; le type d'environnement filtre sans noter, comme la
// taille (R27) ; raisons dans l'ordre de H83.
// Tout se compare sur les valeurs affichées : prix selon le réglage (R22), mer et montagne au km (sous 1 km : comparée
// comme 1 km ; une commune de montagne, 0, garde 0).
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
  // Spec cadre-de-vie (D10, R29) : type d'environnement et distance à la montagne en km (0 = commune de montagne).
  // Absent ou null = inconnu.
  typeEnv?: TypeEnv | null;
  montagneKm?: number | null;
};

/** H71 : les quatre types d'environnement (niveaux de D10). */
export type TypeEnv = 'ville-dense' | 'ville-et-peripherie' | 'bourg-et-village' | 'campagne-isolee';

/**
 * Une ligne de `public/data/communes.json`, colonnes dans l'ordre de `champs` : celles de loyer-mer, puis celles
 * d'immobilier (loyer des maisons), puis celles de cadre-de-vie (`type_env`, `montagne_km`), absentes d'un jeu plus ancien.
 */
export type LigneCommunes = [
  string, string, string, number | null, number | null, boolean, number | null, number | null, boolean | null,
  (TypeEnv | null)?, (number | null)?,
];

export function communeDeLigne([code, nom, dep, population, loyerM2, estimationPropre, merKm, loyerM2Maison, estimationPropreMaison, typeEnv, montagneKm]: LigneCommunes): Commune {
  return { code, nom, dep, population, loyerM2, estimationPropre, merKm, loyerM2Maison, estimationPropreMaison, typeEnv: typeEnv ?? null, montagneKm: montagneKm ?? null };
}

export type Taille = 'petite-commune' | 'petite-ville' | 'ville-moyenne' | 'grande-ville';

/**
 * Plafonds. `loyer` : plafond du prix, dans le mode et l'unité du réglage du prix (en € ou en €/m², loyer ou achat : nom
 * gardé de loyer-mer), `null` = « Sans limite ». `mer` : un des choix de `CHOIX_MER` en km, `null` = « Peu importe »
 * (R28 de cadre-de-vie). `montagne` : un des choix de `CHOIX_MONTAGNE` en km, absente ou `null` = « Peu importe » (R29 ;
 * facultative, pour que les réglages écrits avant la montagne restent valables). `tailles` vide = « Peu importe ».
 * `types` : types d'environnement cochés (R27) ; absent ou vide = « Peu importe » (facultatif, comme `montagne`).
 */
export type Reglages = { loyer: number | null; mer: number | null; montagne?: number | null; tailles: Taille[]; types?: TypeEnv[] };

/** R28, H69 de cadre-de-vie : les distances de la mer ; aucune cochée = « Peu importe » (D12). */
export const CHOIX_MER = [10, 30, 50, 100] as const;
/** R29, H69 : les mêmes distances pour la montagne. */
export const CHOIX_MONTAGNE = CHOIX_MER;

/** R32 de cadre-de-vie : le prix de départ d'immobilier (D1), tout le cadre de vie sur Peu importe. */
export const REGLAGES_DEPART: Reglages = { loyer: 1200, mer: null, tailles: [] };

/** Plafond d'un proche, en minutes : de 15 min à 3 h par pas de 15 min (R11, D15), 2 h à l'ajout (H19). */
export const PROCHE = { pas: 15, max: 180, ajout: 120 } as const;

/**
 * Proche **prêt** (R11), ou **partiel** (proches-fiables D5, R34 : il compte comme un prêt) : son plafond en minutes et ses
 * temps, un par commune dans l'ordre de `communes`. Un temps est la fin de la tranche de 15 min (15 à 180) ; 0 = plus de
 * 3 h ou sans route (R10) ; pour un partiel, la fin de la plus petite zone obtenue (« jusqu'à 2 h 30 » compte pour 2 h 30),
 * 0 = hors de sa couverture (ne tient aucun plafond). `zones` : zones obtenues, pour écrire la raison (`tempsProche`).
 */
export type ProchePret = { nom: string; plafond: number; temps: Uint16Array; zones?: readonly number[] };

export type Raison =
  /** Prix au-dessus du plafond, selon le mode et l'unité (R24). */
  | { critere: 'loyer' | 'loyer-m2' | 'achat' | 'achat-m2'; valeur: number; plafond: number }
  | { critere: 'mer'; valeur: number; plafond: number }
  | { critere: 'montagne'; valeur: number; plafond: number }
  | { critere: 'taille'; taille: Taille; population: number }
  | { critere: 'type'; type: TypeEnv }
  /** `valeur` : fin de tranche en minutes, 0 = plus de 3 h (ou, pour un partiel, plus que sa couverture) ; `zones` : celles du proche. */
  | { critere: 'proche'; nom: string; valeur: number; plafond: number; zones?: readonly number[] }
  /** Plus produite depuis R25 (un prix inconnu passe) ; gardée pour son texte. */
  | { critere: 'loyer-inconnu' }
  | { critere: 'mer-inconnue' }
  | { critere: 'montagne-inconnue' }
  | { critere: 'taille-inconnue' }
  | { critere: 'type-inconnu' };

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
/** R29 : de même pour la montagne ; une commune de montagne (0) garde 0, donc la note 100. */
const montagneComparee = (c: Commune) =>
  c.montagneKm == null ? null : c.montagneKm === 0 ? 0 : Math.max(1, Math.round(c.montagneKm));

/**
 * H74 : moyenne exacte des notes, moitié vers le haut. Une note en virgule flottante peut tomber juste sous la moitié
 * (100 × (1 − 744 / 800) = 6,999999999999995) : la moyenne est d'abord ramenée au milliardième, bien au-dessus de cette
 * erreur et bien en dessous de l'écart entre deux moyennes réelles.
 */
const moyenne = (notes: number[]) => Math.round(Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 1e9) / 1e9);

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
  // Critères qui notent : prix, mer, montagne, proches prêts (état « sans plafond » si aucun, details.md de cadre-de-vie).
  const actif = r.loyer != null || r.mer != null || r.montagne != null || proches.length > 0;
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
    if (r.montagne != null) {
      const v = montagneComparee(c);
      if (v == null) raisons.push({ critere: 'montagne-inconnue' });
      else if (v > r.montagne) raisons.push({ critere: 'montagne', valeur: v, plafond: r.montagne });
      else notes.push(100 * (1 - v / r.montagne));
    }
    if (r.tailles.length) {
      const t = tailleDe(c.population);
      if (t == null) raisons.push({ critere: 'taille-inconnue' });
      else if (!r.tailles.includes(t)) raisons.push({ critere: 'taille', taille: t, population: c.population! });
    }
    if (r.types?.length) {
      const t = c.typeEnv;
      if (t == null) raisons.push({ critere: 'type-inconnu' });
      else if (!r.types.includes(t)) raisons.push({ critere: 'type', type: t });
    }
    for (const p of proches) {
      const v = p.temps[i];
      if (v === 0 || v > p.plafond) raisons.push({ critere: 'proche', nom: p.nom, valeur: v, plafond: p.plafond, ...(p.zones && { zones: p.zones }) });
      else notes.push(100 * (1 - v / p.plafond));
    }
    const passe = raisons.length === 0;
    const sansNote = passe && actif && notes.length === 0;
    const score = passe && notes.length > 0 ? moyenne(notes) : null;
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
