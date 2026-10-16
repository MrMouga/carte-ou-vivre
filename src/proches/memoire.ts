import type { Suggestion } from './ign';

// Mémoire du navigateur (spec proches R12, D7) : une entrée par proche dans le stockage du navigateur (localStorage),
// jamais dans l'adresse de la page. Elle garde l'adresse (la suggestion choisie), le point de départ, le nom, le plafond
// et les temps : un entier 16 bits par commune dans l'ordre de communes.json (0 = plus de 3 h), en base64 (≈ 93 Ko pour
// 34 746 communes), avec l'empreinte de la liste des codes INSEE pour laquelle ils ont été calculés. À la relecture, un
// proche qui n'était pas prêt revient indisponible ; l'appelant compare l'empreinte à celle de la carte (R12).

// Proches-fiables (tâches 2 et 3a) : `partiel` = des zones manquent, la couverture atteint le plafond (R33, R34) ; `km` =
// la couverture est sous le plafond, le proche vaut ses distances à vol d'oiseau et son plafond est en km (R35). Jusqu'à
// la tâche 4, ils s'écrivent comme un proche qui n'est pas prêt (`pret: false`) et reviennent donc indisponibles.
export type EtatProche = 'attente' | 'calcul' | 'pret' | 'partiel' | 'km' | 'indisponible';

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
  /** Fins de tranche par commune, dans l'ordre de communes.json (0 = plus de 3 h) ; null tant que le proche n'est pas prêt. */
  temps: Uint16Array | null;
  /** Empreinte des codes INSEE pour lesquels `temps` a été calculé. */
  empreinte: string | null;
};

export const CLE = 'carte-ou-vivre:proche:';
const VERSION = 1;

type Entree = Omit<ProcheGarde, 'etat' | 'temps'> & { v: number; pret: boolean; temps: string | null };

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
  const pret = p.etat === 'pret' && p.temps != null;
  const e: Entree = {
    v: VERSION,
    id: p.id,
    nom: p.nom,
    lieu: p.lieu,
    depart: p.depart,
    plafond: p.plafond,
    pret,
    empreinte: pret ? p.empreinte : null,
    temps: pret ? encoder(p.temps!) : null,
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

/** Les proches gardés, dans l'ordre d'ajout ; un proche qui n'était pas prêt revient indisponible. Entrée illisible : ignorée. */
export function lireProches(s: Storage | null): ProcheGarde[] {
  if (!s) return [];
  const proches: ProcheGarde[] = [];
  try {
    for (const k of clesDes(s)) {
      try {
        const e = JSON.parse(s.getItem(k)!) as Entree;
        if (e.v !== VERSION || !Number.isInteger(e.id) || !e.lieu) continue;
        const temps = e.pret && e.temps ? decoder(e.temps) : null;
        proches.push({
          id: e.id,
          nom: e.nom,
          lieu: e.lieu,
          depart: e.depart,
          plafond: e.plafond,
          etat: temps ? 'pret' : 'indisponible',
          temps,
          empreinte: temps ? e.empreinte : null,
        });
      } catch {
        // entrée illisible : ignorée
      }
    }
  } catch {
    return [];
  }
  return proches.sort((a, b) => a.id - b.id);
}
