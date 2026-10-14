// R7, H7 : les réglages vivent dans l'adresse de la page (D7 : pas la commune choisie).
// Spec immobilier, R26 : le plafond du prix s'écrit `loyer` (Louer) ou `achat` (Acheter) ; `bien`, `unite` et `surface`
// n'apparaissent que s'ils diffèrent de leur valeur de départ.
import { REGLAGES_DEPART, type Reglages, type Taille } from './score';
import { bornesPrix, plafondDepart, PRIX_DEPART, SURFACE_DEPART, surfaceValide, UNITE_DEPART, type ReglagePrix } from './prix';

/** H2 : plage et pas de chaque plafond ; `aucun` = « Sans limite ». Le prix dépend de son réglage (H57, `bornesPrix`). */
export const BORNES = {
  loyer: bornesPrix(PRIX_DEPART),
  mer: { min: 5, max: 200, pas: 5 },
} as const;

/** Ordre de D11, celui de l'adresse. */
export const ORDRE_TAILLES: Taille[] = ['petite-commune', 'petite-ville', 'ville-moyenne', 'grande-ville'];

function plafond(v: string | null, b: { min: number; max: number; pas: number }, depart: number | null): number | null {
  if (v === 'aucun') return null;
  if (v == null || !/^\d+$/.test(v)) return depart;
  const n = Number(v);
  return n >= b.min && n <= b.max && (n - b.min) % b.pas === 0 ? n : depart;
}

/** R26, H66 : `loyer` présent → Louer (même invalide) ; sinon `achat` présent → Acheter ; sinon Louer. Invalide → départ. */
export function lirePrix(search: string): ReglagePrix {
  const q = new URLSearchParams(search);
  const mode = q.has('loyer') || !q.has('achat') ? 'louer' : 'acheter';
  const bien = q.get('bien') === 'maison' ? 'maison' : 'appartement';
  const u = q.get('unite');
  const unite = u === 'total' || u === 'm2' ? u : UNITE_DEPART[mode];
  const s = q.get('surface');
  const surface = s != null && /^\d+$/.test(s) && surfaceValide(Number(s)) ? Number(s) : SURFACE_DEPART[bien];
  return { mode, bien, unite, surface };
}

/** `loyer` : plafond du prix, lu dans le mode et l'unité de l'adresse (`lirePrix`). */
export function lireAdresse(search: string): Reglages {
  const q = new URLSearchParams(search);
  const prix = lirePrix(search);
  const demandees = (q.get('taille') ?? '').split(',');
  return {
    loyer: plafond(q.get(prix.mode === 'louer' ? 'loyer' : 'achat'), bornesPrix(prix), plafondDepart(prix)),
    mer: plafond(q.get('mer'), BORNES.mer, REGLAGES_DEPART.mer),
    tailles: ORDRE_TAILLES.filter((t) => demandees.includes(t)),
  };
}

/** Ordre de R26 : plafond du prix, `mer`, `taille`, `bien`, `unite`, `surface`. */
export function ecrireAdresse(r: Reglages, prix: ReglagePrix = PRIX_DEPART): string {
  const parts = [`${prix.mode === 'louer' ? 'loyer' : 'achat'}=${r.loyer ?? 'aucun'}`, `mer=${r.mer ?? 'aucun'}`];
  const tailles = ORDRE_TAILLES.filter((t) => r.tailles.includes(t));
  if (tailles.length) parts.push(`taille=${tailles.join(',')}`);
  if (prix.bien !== PRIX_DEPART.bien) parts.push(`bien=${prix.bien}`);
  if (prix.unite !== UNITE_DEPART[prix.mode]) parts.push(`unite=${prix.unite}`);
  if (prix.surface !== SURFACE_DEPART[prix.bien]) parts.push(`surface=${prix.surface}`);
  return `/?${parts.join('&')}`;
}
