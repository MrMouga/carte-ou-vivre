// Spec immobilier : réglage du prix (R21, R23, H57, H58), prix d'une commune (R24) et valeur affichée (R22, H59).
// Pas d'état ici : le réglage est un paramètre de l'évaluation, de l'adresse et des textes.
import type { Commune } from './score';

export type Mode = 'louer' | 'acheter';
export type Bien = 'appartement' | 'maison';
export type Unite = 'total' | 'm2';
/** Source d'un prix d'achat (`public/data/achat.json`, tâche 0) : « secteur » = prix de l'intercommunalité. */
export type SourceAchat = 'commune' | 'secteur' | 'inconnu-secteur' | 'inconnu-alsace-moselle';
export type Achat = { m2: number | null; source: SourceAchat };

/**
 * Réglage du prix, sans son plafond : le plafond reste `Reglages.loyer` (nom gardé par l'adresse d'une tranche 1 et par
 * les tests de loyer-mer), dans le mode et l'unité de ce réglage.
 */
export type ReglagePrix = { mode: Mode; bien: Bien; unite: Unite; surface: number };
type Bornes = { min: number; max: number; pas: number };

/** D2 : surface de départ selon le bien (92 m², référence de l'ANIL pour une maison). */
export const SURFACE_DEPART: Record<Bien, number> = { appartement: 52, maison: 92 };
/** D1 : Appartement · Louer · Total, 52 m² (plafond 1 200 €). */
export const PRIX_DEPART: ReglagePrix = { mode: 'louer', bien: 'appartement', unite: 'total', surface: SURFACE_DEPART.appartement };
/** R21, D3 : unité et plafond qu'on prend en passant dans un mode. */
export const UNITE_DEPART: Record<Mode, Unite> = { louer: 'total', acheter: 'm2' };
export const PLAFOND_DEPART: Record<Mode, number> = { louer: 1200, acheter: 5000 };
/** H58 : surface entière, de 10 à 300 m². */
export const SURFACE = { min: 10, max: 300 } as const;

/** H57 : plage et cran du plafond ; le cran après le maximum est « Sans limite ». */
const BORNES_PRIX: Record<Mode, Record<Unite, Bornes>> = {
  louer: { total: { min: 300, max: 2000, pas: 50 }, m2: { min: 5, max: 40, pas: 1 } },
  acheter: { total: { min: 50000, max: 1000000, pas: 10000 }, m2: { min: 500, max: 12000, pas: 100 } },
};
export const bornesPrix = (p: Pick<ReglagePrix, 'mode' | 'unite'>): Bornes => BORNES_PRIX[p.mode][p.unite];

/** R23 : au cran le plus proche (moitié vers le haut), ramené dans les bornes. */
export const auCran = (v: number, b: Bornes) => Math.min(b.max, Math.max(b.min, b.min + Math.round((v - b.min) / b.pas) * b.pas));

/** R23 : le même budget dans l'autre unité, par la surface. */
function convertir(plafond: number, p: ReglagePrix, vers: Unite): number {
  if (vers === p.unite) return plafond;
  return auCran(vers === 'm2' ? plafond / p.surface : plafond * p.surface, bornesPrix({ mode: p.mode, unite: vers }));
}

/** Plafond de départ d'un réglage : celui de son mode, converti dans son unité (H57 : 5 000 €/m² × la surface en Acheter · Total). */
export const plafondDepart = (p: ReglagePrix) => convertir(PLAFOND_DEPART[p.mode], { ...p, unite: UNITE_DEPART[p.mode] }, p.unite);

export const surfaceValide = (n: number) => Number.isInteger(n) && n >= SURFACE.min && n <= SURFACE.max;

export type Changement = { prix: ReglagePrix; plafond: number | null };

/** R21 : Acheter met Au m² et 5 000 €/m², Louer met Total et 1 200 € ; le bien et la surface restent. */
export function changerMode(prix: ReglagePrix, plafond: number | null, mode: Mode): Changement {
  if (mode === prix.mode) return { prix, plafond };
  return { prix: { ...prix, mode, unite: UNITE_DEPART[mode] }, plafond: PLAFOND_DEPART[mode] };
}

/** R23 : le plafond est converti ; « Sans limite » le reste. */
export function changerUnite(prix: ReglagePrix, plafond: number | null, unite: Unite): Changement {
  return { prix: { ...prix, unite }, plafond: plafond == null ? null : convertir(plafond, prix, unite) };
}

/** R21 : changer de bien ne change ni la surface, ni l'unité, ni le plafond (il n'est pas reçu). */
export const changerBien = (prix: ReglagePrix, bien: Bien): ReglagePrix => ({ ...prix, bien });

/** R22, H58 : la surface ne change que les montants, jamais le plafond ; une surface invalide laisse la dernière valide. */
export const changerSurface = (prix: ReglagePrix, surface: number): ReglagePrix => (surfaceValide(surface) ? { ...prix, surface } : prix);

/** Ce qu'il faut d'une commune pour son prix. */
export type PrixCommune = Pick<Commune, 'loyerM2'> &
  Partial<Pick<Commune, 'estimationPropre' | 'loyerM2Maison' | 'estimationPropreMaison' | 'achatAppartement' | 'achatMaison'>>;

/** Prix d'achat du bien choisi ; un champ absent (jeu sans prix d'achat) est inconnu. */
export const achatDe = (c: PrixCommune, bien: Bien): Achat =>
  (bien === 'appartement' ? c.achatAppartement : c.achatMaison) ?? { m2: null, source: 'inconnu-secteur' };

/** R24 : prix au m² exact du mode et du bien, ou null (inconnu). */
export function prixM2(c: PrixCommune, p: Pick<ReglagePrix, 'mode' | 'bien'>): number | null {
  if (p.mode === 'acheter') return achatDe(c, p.bien).m2;
  return (p.bien === 'appartement' ? c.loyerM2 : c.loyerM2Maison) ?? null;
}

/**
 * R22, H59 : la valeur affichée, celle qu'on compare au plafond. Total : prix au m² × surface, à l'euro pour un loyer, au
 * millier d'euros pour un achat ; Au m² : loyer à une décimale, achat à l'euro. Moitié vers le haut.
 */
export function valeurAffichee(c: PrixCommune, p: ReglagePrix): number | null {
  const m2 = prixM2(c, p);
  if (m2 == null) return null;
  if (p.unite === 'm2') return p.mode === 'louer' ? Math.round(m2 * 10) / 10 : Math.round(m2);
  return p.mode === 'louer' ? Math.round(m2 * p.surface) : Math.round((m2 * p.surface) / 1000) * 1000;
}

/** R24 : prix connu et pris au secteur (loyer estimé par les communes voisines, achat de l'intercommunalité). */
export function estimationSecteur(c: PrixCommune, p: ReglagePrix): boolean {
  if (prixM2(c, p) == null) return false;
  if (p.mode === 'acheter') return achatDe(c, p.bien).source === 'secteur';
  return !(p.bien === 'appartement' ? c.estimationPropre : c.estimationPropreMaison);
}

/** `public/data/achat.json` : une ligne par commune, [code, prix appartement, source, prix maison, source]. */
export type AchatJson = { champs: string[]; communes: [string, number | null, string, number | null, string][] };

/** H68 : prix d'achat joints par code INSEE, jamais par position ; une commune absente du fichier a un prix inconnu. */
export function joindreAchats<C extends Commune>(communes: C[], achat: AchatJson): C[] {
  const parCode = new Map(achat.communes.map((l) => [l[0], l]));
  const inconnu: Achat = { m2: null, source: 'inconnu-secteur' };
  return communes.map((c) => {
    const l = parCode.get(c.code);
    return {
      ...c,
      achatAppartement: l ? { m2: l[1], source: l[2] as SourceAchat } : inconnu,
      achatMaison: l ? { m2: l[3], source: l[4] as SourceAchat } : inconnu,
    };
  });
}
