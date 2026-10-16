import type { Suggestion } from './ign';

// Mémoire du navigateur (spec proches R12, D7) : une entrée par proche dans le stockage du navigateur (localStorage),
// jamais dans l'adresse de la page. Elle garde l'adresse (la suggestion choisie), le point de départ, le nom, le plafond
// et les temps : un entier 16 bits par commune dans l'ordre de communes.json (0 = plus de 3 h), en base64 (≈ 93 Ko pour
// 34 746 communes), avec l'empreinte de la liste des codes INSEE pour laquelle ils ont été calculés ; l'appelant compare
// l'empreinte à celle de la carte (R12).
//
// Proches-fiables (R36, R37, tâche 4) : l'entrée garde en plus l'état (`pret`, `partiel`, `km`), les zones obtenues (d'elles
// se déduisent la couverture et les communes en « jusqu'à », `etat.ts`) et l'heure du début du dernier essai (H93) ; le
// plafond est dans l'unité de l'état (km pour un proche km, R35). Le format reste lisible par la version d'avant (commit
// 56ac3d6) : `v: 1`, et `pret: true` seulement pour un proche prêt — un proche partiel ou km y revient donc « indisponible »
// au lieu d'être ignoré. Un proche partiel garde ses temps dans `temps` (la version d'avant ne les lit que si `pret`) ;
// un proche km n'a pas de temps (ses distances se recalculent des mairies). Un proche gardé en attente, en calcul, ou non
// prêt par la version d'avant revient « en attente » : l'appelant le calcule à l'ouverture comme un nouveau proche (R37).

export type EtatProche = 'attente' | 'calcul' | 'pret' | 'partiel' | 'km';

export type ProcheGarde = {
  /** Ordre d'ajout. */
  id: number;
  /** Nom libre (30 caractères au plus), ou « commune (département) » (R9, D4). Ne sort jamais du navigateur (H30). */
  nom: string;
  /** Suggestion choisie : son libellé est l'adresse affichée sous le nom, et sert à repérer un doublon (R9). */
  lieu: Suggestion;
  /** Point de départ des trajets (D6) : l'adresse, ou la mairie d'une commune choisie seule. */
  depart: [number, number] | null;
  /** Plafond en minutes, de 15 min à 3 h ; 2 h à l'ajout (H19). Proche km : en km, de 15 à 180 km (R35). */
  plafond: number;
  etat: EtatProche;
  /**
   * Fins de tranche par commune, dans l'ordre de communes.json (0 = plus de 3 h ; partiel : hors de sa couverture) ; null
   * pour un proche en attente, en calcul ou km.
   */
  temps: Uint16Array | null;
  /** Empreinte des codes INSEE pour lesquels `temps` (ou les distances d'un proche km) a été calculé. */
  empreinte: string | null;
  /** Zones obtenues au dernier calcul, en minutes, croissantes (12 pour un proche prêt) ; absent pour un prêt gardé par la version d'avant. */
  zones?: number[];
  /** Début du dernier essai de calcul (ms depuis 1970, H93) ; absent avant le premier calcul de cette version. */
  essai?: number;
};

export const CLE = 'carte-ou-vivre:proche:';
const VERSION = 1;

/** Champs de la version d'avant (`v` à `temps`), puis ceux de proches-fiables, absents d'une entrée d'avant ou non finie. */
type Entree = Omit<ProcheGarde, 'etat' | 'temps' | 'zones' | 'essai'> & {
  v: number;
  pret: boolean;
  temps: string | null;
  etat?: 'pret' | 'partiel' | 'km';
  zones?: number[];
  essai?: number;
};

/** Le stockage du navigateur, ou null s'il est refusé (certains modes privés lèvent une erreur dès l'accès). */
export function stockageNavigateur(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Empreinte de la liste des codes INSEE (FNV-1a 32 bits, et leur nombre) : change si un code, l'ordre ou le nombre change. */
export function empreinteDe(codes: string[]): string {
  let h = 0x811c9dc5;
  for (const c of codes)
    for (let i = 0; i <= c.length; i++) {
      h ^= i < c.length ? c.charCodeAt(i) : 44; // une virgule entre deux codes
      h = Math.imul(h, 0x01000193);
    }
  return `${codes.length}-${(h >>> 0).toString(16)}`;
}

// Le base64 d'un tableau est gardé : bouger un plafond réécrit l'entrée sans réencoder ses temps.
const encodes = new WeakMap<Uint16Array, string>();

/** Temps → base64 (octets du tableau, petit-boutiste comme tous les navigateurs visés). */
export function encoder(t: Uint16Array): string {
  const deja = encodes.get(t);
  if (deja) return deja;
  const octets = new Uint8Array(t.buffer, t.byteOffset, t.byteLength);
  let bin = '';
  for (let i = 0; i < octets.length; i += 0x8000) bin += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  const b64 = btoa(bin);
  encodes.set(t, b64);
  return b64;
}

export function decoder(b64: string): Uint16Array {
  const bin = atob(b64);
  const octets = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) octets[i] = bin.charCodeAt(i);
  const t = new Uint16Array(octets.buffer, 0, octets.length >> 1);
  encodes.set(t, b64);
  return t;
}

/** Écrit l'entrée d'un proche ; lève une erreur si le navigateur refuse ou si sa mémoire est pleine (R12). */
export function ecrireProche(s: Storage | null, p: ProcheGarde): void {
  if (!s) throw new Error('stockage indisponible');
  const avecTemps = (p.etat === 'pret' || p.etat === 'partiel') && p.temps != null;
  const fini = avecTemps || p.etat === 'km';
  const e: Entree = {
    v: VERSION,
    id: p.id,
    nom: p.nom,
    lieu: p.lieu,
    depart: p.depart,
    plafond: p.plafond,
    pret: avecTemps && p.etat === 'pret',
    empreinte: avecTemps ? p.empreinte : null,
    temps: avecTemps ? encoder(p.temps!) : null,
    // En attente ou en calcul : rien de plus, il sera calculé à l'ouverture (R37).
    ...(fini && { etat: p.etat as 'pret' | 'partiel' | 'km', zones: p.zones, essai: p.essai }),
  };
  s.setItem(CLE + p.id, JSON.stringify(e));
}

export function effacerProche(s: Storage | null, id: number): void {
  s?.removeItem(CLE + id);
}

const clesDes = (s: Storage) => Array.from({ length: s.length }, (_, i) => s.key(i)).filter((k): k is string => k?.startsWith(CLE) ?? false);

/** « Effacer mes proches » : toutes les entrées de proches, même illisibles. */
export function effacerTout(s: Storage | null): void {
  if (s) for (const k of clesDes(s)) s.removeItem(k);
}

/** Un proche gardé à calculer à l'ouverture (R37) : sans temps ni zones. */
const A_CALCULER = { etat: 'attente', temps: null, empreinte: null } as const;

/**
 * État relu d'une entrée : prêt (y compris de la version d'avant), partiel avec ses temps et ses zones, km avec ses zones ;
 * toute autre entrée (version d'avant non prête, en attente, en calcul, ou incomplète) est à calculer (R37).
 */
function relu(e: Entree): Pick<ProcheGarde, 'etat' | 'temps' | 'empreinte' | 'zones' | 'essai'> {
  const zones = Array.isArray(e.zones) && e.zones.every(Number.isInteger) ? e.zones : undefined;
  const essai = typeof e.essai === 'number' && Number.isFinite(e.essai) ? e.essai : undefined;
  if (e.pret && e.temps && (e.etat ?? 'pret') === 'pret') return { etat: 'pret', temps: decoder(e.temps), empreinte: e.empreinte, zones, essai };
  if (!e.pret && e.etat === 'partiel' && e.temps && zones) return { etat: 'partiel', temps: decoder(e.temps), empreinte: e.empreinte, zones, essai };
  if (!e.pret && e.etat === 'km' && zones) return { etat: 'km', temps: null, empreinte: null, zones, essai };
  return A_CALCULER;
}

/** Les proches gardés, dans l'ordre d'ajout ; un proche gardé non fini revient en attente (R37). Entrée illisible : ignorée. */
export function lireProches(s: Storage | null): ProcheGarde[] {
  if (!s) return [];
  const proches: ProcheGarde[] = [];
  try {
    for (const k of clesDes(s)) {
      try {
        const e = JSON.parse(s.getItem(k)!) as Entree;
        if (e.v !== VERSION || !Number.isInteger(e.id) || !e.lieu) continue;
        proches.push({ id: e.id, nom: e.nom, lieu: e.lieu, depart: e.depart, plafond: e.plafond, ...relu(e) });
      } catch {
        // entrée illisible : ignorée
      }
    }
  } catch {
    return [];
  }
  return proches.sort((a, b) => a.id - b.id);
}
