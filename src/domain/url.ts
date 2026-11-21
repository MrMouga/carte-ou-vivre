// R7, H7 : les réglages vivent dans l'adresse de la page (D7 : pas la commune choisie).
// Spec immobilier, R26 : le plafond du prix s'écrit `loyer` (Louer) ou `achat` (Acheter) ; `bien`, `unite` et `surface`
// n'apparaissent que s'ils diffèrent de leur valeur de départ.
// Spec cadre-de-vie, R31 : `mer` et `montagne` en cinq choix, écrites seulement si elles diffèrent de Peu importe ; `env`
// liste les types d'environnement cochés, comme `taille`.
// Spec mairies, R41 : `mairie` liste les bords cochés, comme `env`, placée après `env`.
// Spec emploi, R48 : `metier` liste les métiers choisis dans l'ordre du choix, chacun avec son niveau, placée après `mairie`.
import { CHOIX_MER, CHOIX_MONTAGNE, type Bord, type MetierChoisi, type Niveau, type Reglages, type Taille, type TypeEnv } from './score';
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

/** R31 : `montagne` vaut 10, 30, 50 ou 100 ; toute autre valeur (dont `0`) = Peu importe, rendue absente (`undefined`). */
function lireMontagne(v: string | null): number | undefined {
  return CHOIX_MONTAGNE.find((c) => String(c) === v);
}

/** R26 : nom du plafond du prix dans l'adresse, selon le mode. */
const CLE_PRIX: Record<Mode, string> = { louer: 'loyer', acheter: 'achat' };

/** Ordre de D11, celui de l'adresse. */
export const ORDRE_TAILLES: Taille[] = ['petite-commune', 'petite-ville', 'ville-moyenne', 'grande-ville'];
/** Ordre de R27 (noms de H71), celui des pastilles et de l'adresse. */
export const ORDRE_TYPES: TypeEnv[] = ['ville-dense', 'ville-et-peripherie', 'bourg-et-village', 'campagne-isolee'];
/** Ordre de R38 de mairies (noms de H108), celui des pastilles et de l'adresse. */
export const ORDRE_BORDS: Bord[] = ['gauche', 'divers', 'centre', 'droite', 'extreme-droite', 'sans-etiquette'];

/** `taille`, `env`, `mairie` (R7, R31, R41) : noms séparés par des virgules ; inconnus ignorés, rendus dans `ordre`, sans doublon. */
function lireListe<T extends string>(v: string | null, ordre: T[]): T[] {
  const demandes = (v ?? '').split(',');
  return ordre.filter((x) => demandes.includes(x));
}

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

const NIVEAUX: readonly string[] = ['10', '25', 'tous'] satisfies Niveau[];
/** R48 : deux métiers au plus. */
export const MAX_METIERS = 2;

/**
 * R48, H128 : `V1X80:10,U1X82` → métiers dans l'ordre, un niveau inconnu retiré sans le métier, un code déjà présent
 * retiré. Avec les codes connus (`codes`, ceux d'emploi.json) : code inconnu retiré, puis deux au plus. Sans eux (avant
 * le chargement), les codes sont gardés tels quels, et `garderMetiersConnus` les trie au chargement.
 */
function lireMetiers(v: string | null, codes?: ReadonlySet<string>): MetierChoisi[] {
  const metiers: MetierChoisi[] = [];
  for (const morceau of (v ?? '').split(',')) {
    const [code, niveau] = morceau.split(':');
    if (!/^[A-Za-z0-9]+$/.test(code) || metiers.some((m) => m.code === code)) continue;
    metiers.push({ code, niveau: NIVEAUX.includes(niveau) ? (niveau as Niveau) : null });
  }
  return codes ? metiers.filter((m) => codes.has(m.code)).slice(0, MAX_METIERS) : metiers;
}

/** R48 : au chargement d'emploi.json, retire les métiers inconnus et garde les deux premiers ; le champ disparaît s'il n'en reste aucun. */
export function garderMetiersConnus(r: Reglages, codes: ReadonlySet<string>): Reglages {
  if (!r.metiers) return r;
  const { metiers, ...reste } = r;
  const gardes = (metiers ?? []).filter((m) => codes.has(m.code)).slice(0, MAX_METIERS);
  return gardes.length ? { ...reste, metiers: gardes } : reste;
}

/**
 * `loyer` : plafond du prix, lu dans le mode et l'unité de l'adresse (`lirePrix`). `codes` : codes des métiers connus
 * (R48), absents avant le chargement.
 */
export function lireAdresse(search: string, codes?: ReadonlySet<string>): Reglages {
  const q = new URLSearchParams(search);
  const prix = lirePrix(search);
  // R31 : `env` comme `taille` ; `types` n'est renseigné que s'il en reste un (facultatif, comme `montagne` : les réglages
  // écrits avant le type restent valables).
  const types = lireListe(q.get('env'), ORDRE_TYPES);
  // R41 de mairies : de même, `mairies` n'est renseigné que s'il reste un bord connu.
  const mairies = lireListe(q.get('mairie'), ORDRE_BORDS);
  // R48 d'emploi : de même, `metiers` n'est renseigné que s'il reste un métier.
  const metiers = lireMetiers(q.get('metier'), codes);
  return {
    loyer: plafond(q.get(CLE_PRIX[prix.mode]), bornesPrix(prix), plafondDepart(prix)),
    mer: lireMer(q.get('mer')),
    montagne: lireMontagne(q.get('montagne')),
    tailles: lireListe(q.get('taille'), ORDRE_TAILLES),
    ...(types.length ? { types } : {}),
    ...(mairies.length ? { mairies } : {}),
    ...(metiers.length ? { metiers } : {}),
  };
}

/**
 * Ordre de R31, R41 et R48 : plafond du prix, `mer`, `montagne`, `taille`, `env`, `mairie`, `metier`, `bien`, `unite`,
 * `surface` ; absents si Peu importe.
 */
export function ecrireAdresse(r: Reglages, prix: ReglagePrix = PRIX_DEPART): string {
  const parts = [`${CLE_PRIX[prix.mode]}=${r.loyer ?? 'aucun'}`];
  if (r.mer != null) parts.push(`mer=${r.mer}`);
  if (r.montagne != null) parts.push(`montagne=${r.montagne}`);
  const tailles = ORDRE_TAILLES.filter((t) => r.tailles.includes(t));
  if (tailles.length) parts.push(`taille=${tailles.join(',')}`);
  const types = ORDRE_TYPES.filter((t) => r.types?.includes(t));
  if (types.length) parts.push(`env=${types.join(',')}`);
  const mairies = ORDRE_BORDS.filter((b) => r.mairies?.includes(b));
  if (mairies.length) parts.push(`mairie=${mairies.join(',')}`);
  if (r.metiers?.length) parts.push(`metier=${r.metiers.map((m) => (m.niveau ? `${m.code}:${m.niveau}` : m.code)).join(',')}`);
  if (prix.bien !== PRIX_DEPART.bien) parts.push(`bien=${prix.bien}`);
  if (prix.unite !== UNITE_DEPART[prix.mode]) parts.push(`unite=${prix.unite}`);
  if (prix.surface !== SURFACE_DEPART[prix.bien]) parts.push(`surface=${prix.surface}`);
  return `/?${parts.join('&')}`;
}
