// Géoplateforme IGN, appelée depuis le navigateur du visiteur (D2 ; conditions d'usage lues en tâche 0) :
// - recherche d'adresse `/geocodage/search`, qui rend le code INSEE (`citycode`) : pas de recherche inverse ;
// - zones de temps `/navigation/isochrone` (bdtopo-valhalla, seule ressource qui en fait), 12 zones de 15 min à 3 h (D15),
//   lancées la plus longue d'abord, une toutes les 250 ms : à 5 par seconde pile, l'IGN refuse (429) et bloque 5 s.
// Seule l'adresse part vers l'IGN, jamais le nom du proche (D6, H30).
import { PROCHE } from '../domain/score';

const IGN = 'https://data.geopf.fr';
export const ECART_MS = 250;
/** Durées des zones demandées, en minutes : 15, 30… 180. */
export const DUREES = Array.from({ length: PROCHE.max / PROCHE.pas }, (_, i) => (i + 1) * PROCHE.pas);

export type Suggestion = {
  /** Libellé de l'IGN, tel qu'affiché (« 12 Rue de la Paix 44000 Nantes ») ; sert aussi à repérer un doublon (R9). */
  libelle: string;
  commune: string;
  /** Département, tiré du code INSEE (2A, 2B compris). */
  dep: string;
  /** Code INSEE de la commune de la carte (arrondissements ramenés à la ville). */
  code: string;
  /** [lon, lat] rendu par l'IGN, sans arrondi (H28). */
  point: [number, number];
  /** Commune choisie seule (le trajet part alors de sa mairie, D6). */
  estCommune: boolean;
};

export const urlRecherche = (texte: string) =>
  `${IGN}/geocodage/search?${new URLSearchParams({ q: texte, index: 'address', autocomplete: '1', limit: '10' })}`;

/** Paris, Lyon et Marseille d'un seul tenant (D10 de loyer-mer) : un arrondissement compte pour sa ville. */
function codeCarte(code: string): string {
  if (/^751(0[1-9]|1\d|20)$/.test(code)) return '75056';
  if (/^6938[1-9]$/.test(code)) return '69123';
  if (/^132(0[1-9]|1[0-6])$/.test(code)) return '13055';
  return code;
}

type Reponse = {
  features: { geometry: { coordinates: number[] }; properties: { label: string; city: string; citycode: string; type: string } }[];
};

/** Les 5 premières suggestions de métropole (H20) ; l'outre-mer (codes 97…) est écarté. */
export function suggestionsDe(json: Reponse): Suggestion[] {
  return json.features
    .filter((f) => !f.properties.citycode.startsWith('97'))
    .slice(0, 5)
    .map(({ geometry, properties: p }) => ({
      libelle: p.label,
      commune: p.city,
      dep: p.citycode.slice(0, 2),
      code: codeCarte(p.citycode),
      point: [geometry.coordinates[0], geometry.coordinates[1]],
      estCommune: p.type === 'municipality',
    }));
}

/** Suggestions pour un texte d'au moins 3 caractères (l'IGN refuse en dessous). Lève une erreur si la recherche ne répond pas (R13). */
export async function rechercher(texte: string, signal?: AbortSignal): Promise<Suggestion[]> {
  if (texte.trim().length < 3) return [];
  const r = await fetch(urlRecherche(texte), { signal });
  if (!r.ok) throw new Error(`recherche : ${r.status}`);
  return suggestionsDe(await r.json());
}

export const urlIsochrone = ([lon, lat]: [number, number], minutes: number) =>
  `${IGN}/navigation/isochrone?${new URLSearchParams({
    resource: 'bdtopo-valhalla',
    point: `${lon},${lat}`,
    costType: 'time',
    costValue: String(minutes),
    timeUnit: 'minute',
    profile: 'car',
    direction: 'departure',
    geometryFormat: 'geojson',
    crs: 'EPSG:4326',
  })}`;

// File commune à toute la page : une demande de zone part 250 ms au moins après le départ réel de la précédente.
// Compter depuis le départ réel, et non réserver des heures d'avance : si la page est occupée (chargement de la carte),
// des minuteries en retard partiraient en paquet (vu sur le vrai IGN : deux zones à 71 ms d'écart).
let file: Promise<void> = Promise.resolve();
let dernierDepart = -Infinity;
function creneau(signal: AbortSignal): Promise<void> {
  file = file.then(async () => {
    if (signal.aborted) return; // proche arrêté : son créneau ne retarde pas les autres
    const attente = dernierDepart + ECART_MS - Date.now();
    if (attente > 0) await new Promise((ok) => setTimeout(ok, attente));
    if (!signal.aborted) dernierDepart = Date.now();
  });
  return file;
}

/** Fin d'un calcul, comptée depuis son début (H21 de proches, R33) : une zone sans réponse à ce moment manque. */
export const DELAI_CALCUL_MS = 45_000;
/** Après un refus (429), l'IGN bloque 5 s : le second essai de la zone attend d'autant, puis passe par la file (H92). */
export const ATTENTE_REFUS_MS = 5_000;

/** Zones d'un départ : obtenues ([minutes, réponse brute]) et manquantes, dans l'ordre des demandes (la plus longue d'abord). */
export type Zones = { obtenues: [number, string][]; manquantes: number[] };

/** Attend `ms`, ou moins si `signal` s'arrête avant. */
const attendre = (ms: number, signal: AbortSignal) =>
  new Promise<void>((ok) => {
    const t = setTimeout(ok, ms);
    signal.addEventListener('abort', () => (clearTimeout(t), ok()), { once: true });
  });

/**
 * Les 12 zones d'un départ, en texte brut (lu dans le worker), par la file commune (R33, H92) : une zone en erreur
 * (erreur du service, refus 429, réseau) est redemandée une fois, 5 s plus tard après un refus ; une zone sans réponse
 * ne l'est pas. Le calcul finit quand chaque zone a répondu ou échoué deux fois, et au plus tard 45 s après son
 * début (`DELAI_CALCUL_MS`) : ce qui n'a pas répondu manque. Seul `signal` (« Retirer ») fait lever une erreur.
 */
export async function zones(depart: [number, number], signal?: AbortSignal): Promise<Zones> {
  const fin = new AbortController();
  const minuterie = setTimeout(() => fin.abort(), DELAI_CALCUL_MS);
  const s = signal ? AbortSignal.any([signal, fin.signal]) : fin.signal;
  const zone = async (d: number): Promise<string | null> => {
    for (let essai = 1; essai <= 2; essai++) {
      await creneau(s);
      if (s.aborted) return null;
      try {
        // Second essai hors du cache du navigateur : l'IGN lui fait garder ses erreurs 21 jours (tâche 0 de proches-fiables).
        const r = await fetch(urlIsochrone(depart, d), essai === 1 ? { signal: s } : { signal: s, cache: 'reload' });
        if (r.ok) return await r.text();
        if (r.status === 429 && essai === 1) await attendre(ATTENTE_REFUS_MS, s);
      } catch {
        if (s.aborted) return null; // sans réponse à temps : pas redemandée
      }
    }
    return null;
  };
  try {
    const textes = await Promise.all([...DUREES].reverse().map(async (d) => [d, await zone(d)] as const));
    signal?.throwIfAborted();
    return {
      obtenues: textes.filter((x): x is [number, string] => x[1] != null),
      manquantes: textes.filter(([, t]) => t == null).map(([d]) => d),
    };
  } finally {
    clearTimeout(minuterie);
  }
}

function classerDansWorker(textes: [number, string][], points: Float64Array): Promise<Uint16Array> {
  return new Promise((ok, ko) => {
    const w = new Worker(new URL('./classer.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (ev: MessageEvent<Uint16Array>) => (w.terminate(), ok(ev.data));
    w.onerror = (ev) => (w.terminate(), ko(new Error(`classement : ${ev.message}`)));
    w.postMessage({ textes, points });
  });
}

/** Résultat d'un calcul : temps par commune et durées des zones obtenues, croissantes (12 pour un proche prêt). */
export type Calcul = { temps: Uint16Array; zones: number[] };

/**
 * Temps d'un proche (R10, R34) : un entier par commune, dans l'ordre de `points` (mairies, lon et lat alternés) — fin de
 * la plus petite zone obtenue qui contient la mairie, 0 = dans aucune (« plus de 3 h », ou « plus de <couverture> »).
 * La marque « jusqu'à » et l'état se déduisent des zones obtenues (`etat.ts`). La file des proches est à l'appelant.
 */
export async function calculerTemps(depart: [number, number], points: Float64Array, signal?: AbortSignal): Promise<Calcul> {
  const { obtenues } = await zones(depart, signal);
  const temps = obtenues.length ? await classerDansWorker(obtenues, points) : new Uint16Array(points.length / 2);
  return { temps, zones: obtenues.map(([d]) => d).sort((a, b) => a - b) };
}
