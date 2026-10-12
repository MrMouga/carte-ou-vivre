// Règles de la spec loyer-mer : passage (R1, D11), note et score (R2, D4), palier de couleur (R3, D5), classement (R5, H4).
// Tout se compare sur les valeurs affichées : loyer à l'euro pour 52 m², mer au km (sous 1 km : comparée comme 1 km).

export const SURFACE_M2 = 52;

export type Commune = {
  code: string;
  nom: string;
  dep: string;
  population: number | null;
  loyerM2: number | null;
  estimationPropre: boolean;
  merKm: number | null;
};

export type Taille = 'petite-commune' | 'petite-ville' | 'ville-moyenne' | 'grande-ville';

/** Plafond en euros ou en km ; `null` = « Sans limite ». `tailles` vide = « Peu importe ». */
export type Reglages = { loyer: number | null; mer: number | null; tailles: Taille[] };

export const REGLAGES_DEPART: Reglages = { loyer: 1200, mer: 60, tailles: [] }; // H1

export type Raison =
  | { critere: 'loyer'; valeur: number; plafond: number }
  | { critere: 'mer'; valeur: number; plafond: number }
  | { critere: 'taille'; taille: Taille; population: number }
  | { critere: 'loyer-inconnu' }
  | { critere: 'mer-inconnue' }
  | { critere: 'taille-inconnue' };

export type Evaluation = {
  commune: Commune;
  passe: boolean;
  /** Score affiché (entier) si la commune passe et qu'au moins un plafond est actif, sinon null. */
  score: number | null;
  palier: 1 | 2 | 3 | 4 | 5 | null;
  rang: number | null;
  raisons: Raison[];
};

export type Resultat = {
  /** Au moins un plafond actif (sinon : page « sans plafond »). */
  actif: boolean;
  parCode: Map<string, Evaluation>;
  /** Communes qui passent, triées (R5, H4) ; vide sans plafond. */
  classement: Evaluation[];
};

/** Loyer affiché pour 52 m², à l'euro. */
export const loyerPour = (m2: number) => Math.round(m2 * SURFACE_M2);
export const loyerAffiche = (c: Commune) => (c.loyerM2 == null ? null : loyerPour(c.loyerM2));
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

export function evaluer(communes: Commune[], r: Reglages): Resultat {
  const actif = r.loyer != null || r.mer != null;
  const parCode = new Map<string, Evaluation>();
  const passent: Evaluation[] = [];
  for (const c of communes) {
    const raisons: Raison[] = [];
    const notes: number[] = [];
    if (r.loyer != null) {
      const v = loyerAffiche(c);
      if (v == null) raisons.push({ critere: 'loyer-inconnu' });
      else if (v > r.loyer) raisons.push({ critere: 'loyer', valeur: v, plafond: r.loyer });
      else notes.push(100 * (1 - v / r.loyer));
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
    const passe = raisons.length === 0;
    const score = passe && actif ? Math.round(notes.reduce((a, b) => a + b, 0) / notes.length) : null;
    const e: Evaluation = { commune: c, passe, score, palier: score == null ? null : palier(score), rang: null, raisons };
    parCode.set(c.code, e);
    if (score != null) passent.push(e);
  }
  passent.sort(
    (a, b) =>
      b.score! - a.score! ||
      (loyerAffiche(a.commune) ?? Infinity) - (loyerAffiche(b.commune) ?? Infinity) ||
      a.commune.nom.localeCompare(b.commune.nom, 'fr'),
  );
  passent.forEach((e, i) => (e.rang = i + 1));
  return { actif, parCode, classement: passent };
}
