// R7, H7 : les réglages vivent dans l'adresse de la page (D7 : pas la commune choisie).
// Spec immobilier, R26 : le plafond du prix s'écrit `loyer` (Louer) ou `achat` (Acheter) ; `bien`, `unite` et `surface`
// n'apparaissent que s'ils diffèrent de leur valeur de départ.
// Spec cadre-de-vie, R31 : `mer` en cinq choix, écrite seulement si elle diffère de Peu importe.
import { CHOIX_MER, type Reglages, type Taille } from './score';
import { bornesPrix, plafondDepart, PRIX_DEPART, SURFACE_DEPART, surfaceValide, UNITE_DEPART, type Mode, type ReglagePrix } from './prix';

/** H2 : plage et pas du plafond du prix ; `aucun` = « Sans limite ». Il dépend de son réglage (H57, `bornesPrix`). */
export const BORNES = {
  loyer: bornesPrix(PRIX_DEPART),
} as const;

/** Ancienne plage du curseur de la mer (H2, H7 et H17 de loyer-mer) : multiples de 5, de 5 à 200 km. */
const ANCIENNE_MER = { min: 5, max: 200, pas: 5 };

/**
 * R31 : un des cinq choix (10, 30, 50, 100 ; `null` = Peu importe). Une valeur de l'ancienne plage prend le choix juste
 * au-dessus (au-delà de 100 : Peu importe) ; toute autre valeur, absente ou `aucun` : Peu importe.
 */
function lireMer(v: string | null): number | null {
  if (v == null || !/^\d+$/.test(v)) return null;
  const n = Number(v);
  const { min, max, pas } = ANCIENNE_MER;
  if (n < min || n > max || (n - min) % pas !== 0) return null;
  return CHOIX_MER.find((c) => c >= n) ?? null;
}

/** R26 : nom du plafond du prix dans l'adresse, selon le mode. */
const CLE_PRIX: Record<Mode, string> = { louer: 'loyer', acheter: 'achat' };

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
    loyer: plafond(q.get(CLE_PRIX[prix.mode]), bornesPrix(prix), plafondDepart(prix)),
    mer: lireMer(q.get('mer')),
    tailles: ORDRE_TAILLES.filter((t) => demandees.includes(t)),
  };
}

/** Ordre de R31 : plafond du prix, `mer`, `taille`, `bien`, `unite`, `surface` ; `mer` absente si Peu importe. */
export function ecrireAdresse(r: Reglages, prix: ReglagePrix = PRIX_DEPART): string {
  const parts = [`${CLE_PRIX[prix.mode]}=${r.loyer ?? 'aucun'}`];
  if (r.mer != null) parts.push(`mer=${r.mer}`);
  const tailles = ORDRE_TAILLES.filter((t) => r.tailles.includes(t));
  if (tailles.length) parts.push(`taille=${tailles.join(',')}`);
  if (prix.bien !== PRIX_DEPART.bien) parts.push(`bien=${prix.bien}`);
  if (prix.unite !== UNITE_DEPART[prix.mode]) parts.push(`unite=${prix.unite}`);
  if (prix.surface !== SURFACE_DEPART[prix.bien]) parts.push(`surface=${prix.surface}`);
  return `/?${parts.join('&')}`;
}
