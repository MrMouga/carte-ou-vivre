import { readFileSync } from 'node:fs';
import type { Page, Route } from '@playwright/test';
import acceptance from '../../../docs/specs/2026-10-13-proches/acceptance.json' with { type: 'json' };
import fiables from '../../../docs/specs/2026-10-16-proches-fiables/acceptance.json' with { type: 'json' };

// Faux service IGN des proches (recherche d'adresse et zones de temps), tiré de la fixture d'acceptance.json, au format réel
// relevé en tâche 0 (docs/plans/2026-10-13-proches/captures/T0-ign-exemples/). Aucun appel réel à l'IGN dans les tests.
// Proches-fiables : la fixture de proches-fiables s'y ajoute (« 6 rue Test », Rochelleville) avec ses pannes par
// zone, aux erreurs de l'IGN relevées en tâche 0 (docs/plans/2026-10-16-proches-fiables/mesure-tache-0.md).
//
// À poser APRÈS `servirFixture` / `ouvrir` de carte.ts : leur route `data.geopf.fr/**` (fond de carte) reste en dessous,
// et dans Playwright la dernière route posée gagne. Pour compter les demandes dès l'ouverture (réouverture sans calcul),
// poser `servirFixture`, puis `servirIgn`, puis `page.goto`.

const services = acceptance.fixture.services;
const servicesFiables = fiables.fixture.services;
type SuggestionFixture = { libelle: string; commune: string; dep: string; point: number[] };
const SUGGESTIONS: Record<string, { suggestions: SuggestionFixture[] }> = {
  ...services["recherche d'adresse (IGN) — suggestions par texte tapé"],
  ...servicesFiables["recherche d'adresse (IGN) — ajout à la fixture de proches"],
};
const TRAJETS: Record<string, Record<string, number | null>> = {
  ...services['calcul de trajets (IGN) — fin de tranche en minutes par code de commune (null = plus de 3 h), par adresse choisie'],
  ...servicesFiables['calcul de trajets (IGN) — fin de tranche en minutes par code de commune (null = hors de la zone de 3 h)'],
};
/** Pannes par zone de la fixture de proches-fiables (« zone-135-une-fois »…). */
export type Panne = keyof (typeof servicesFiables)['pannes par zone'];
const ROCHELLEVILLE = servicesFiables["recherche d'adresse (IGN) — ajout à la fixture de proches"]['6 rue Test'].suggestions[0].point;
/** Corps des erreurs réelles de l'IGN (tâche 0 de proches-fiables), avec leurs en-têtes : gardées 21 jours par un navigateur. */
const ERREURS: Record<number, string> = {
  502: '{\n  "message":"An invalid response was received from the upstream server"\n}',
  504: '{\n  "message":"The upstream server is timing out"\n}',
};
const EN_TETES_ERREUR = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, max-age=1814400' };
const MAIRIE = Object.fromEntries(acceptance.fixture.items.map((it) => [it.code_insee, it.mairie]));
const REFUS_429 = readFileSync(new URL('../../../docs/plans/2026-10-13-proches/captures/T0-ign-exemples/refus-429.html', import.meta.url), 'utf8');
/** L'IGN répond à tout site (appel depuis le navigateur du visiteur). */
const CORS = { 'access-control-allow-origin': '*' };

/** Un proche = 12 zones : chacune répond après 1 s / 12 (fixture.services.délais). */
export const DELAI_ZONE_MS = 1000 / 12;

export type OptionsIgn = {
  /** Recherche : réponses de la fixture, ou erreur réseau sur toute recherche (R13, AC-11). */
  recherche?: 'ok' | 'panne';
  /** Zones : réponses de la fixture, erreur réseau sur toute zone (AC-10), ou refus 429 de l'IGN (redemandée une fois, R33). */
  trajets?: 'ok' | 'panne' | '429';
  /** Délai de chaque zone, en ms (proches-fiables : 1 000, « chaque zone répond 1 s après sa demande ») ; une erreur arrive après le même délai. */
  delaiZoneMs?: number;
  /** Panne par zone de la fixture de proches-fiables ; une zone muette n'est jamais servie. */
  panne?: Panne;
};

/** Ce que rend la zone de `minutes` à son `essai`-ième demande selon la panne : un statut d'erreur, muette, réseau, ou null (elle répond). */
function panneDe(panne: Panne | undefined, minutes: number, essai: number, point: number[]): 502 | 504 | 'muette' | 'reseau' | null {
  switch (panne) {
    case 'zone-135-une-fois':
      return minutes === 135 && essai === 1 ? 502 : null;
    case 'zone-135-toujours':
      return minutes === 135 ? 502 : null;
    case 'zone-135-muette':
      return minutes === 135 ? 'muette' : null;
    case 'zone-180-toujours':
      return minutes === 180 ? 504 : null;
    case 'zone-180-toujours-rochelleville':
      return minutes === 180 && point[0] === ROCHELLEVILLE[0] && point[1] === ROCHELLEVILLE[1] ? 504 : null;
    case 'zones-120-a-180-toujours':
      return minutes >= 120 ? 502 : null;
    case 'zones-135-a-180-toujours':
      return minutes >= 135 ? 502 : null;
    case 'panne-totale':
      return 'reseau';
    default:
      return null;
  }
}

/** Suggestion de la fixture au format de `/geocodage/search` (code INSEE inventé : département + 999, hors outre-mer). */
function feature(s: SuggestionFixture) {
  const [, rue, postcode] = /^(.*) (\d{5}) /.exec(s.libelle)!;
  const housenumber = rue.split(' ')[0];
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: s.point },
    properties: {
      label: s.libelle,
      score: 0.97,
      housenumber,
      id: `${s.dep}999_test_${housenumber}`,
      name: rue,
      postcode,
      citycode: `${s.dep}999`,
      city: s.commune,
      context: `${s.dep}, Test`,
      type: 'housenumber',
      importance: 0.7,
      depcode: s.dep,
      street: rue.slice(housenumber.length + 1),
      _type: 'address',
    },
  };
}

/** Carré de côté 0,1° autour d'un point (un anneau GeoJSON). */
const carre = ([x, y]: number[]) => [
  [x - 0.05, y - 0.05],
  [x + 0.05, y - 0.05],
  [x + 0.05, y + 0.05],
  [x - 0.05, y + 0.05],
  [x - 0.05, y - 0.05],
];

/**
 * Zone de `minutes` depuis `point` : un carré autour du départ et un autour de la mairie de chaque commune de la fixture
 * dont la fin de tranche est ≤ minutes. Départ inconnu de la fixture : le carré du départ seul (tout à plus de 3 h).
 */
function zone(point: number[], minutes: number) {
  const adresse = Object.values(SUGGESTIONS)
    .flatMap((x) => x.suggestions)
    .find((s) => s.point[0] === point[0] && s.point[1] === point[1]);
  const fins = adresse ? TRAJETS[adresse.libelle] ?? {} : {};
  const mairies = Object.entries(fins)
    .filter(([, fin]) => fin != null && fin <= minutes)
    .map(([code]) => MAIRIE[code]);
  return { type: 'MultiPolygon', coordinates: [point, ...mairies].map((p) => [carre(p)]) };
}

/**
 * Pose le faux service ; rend la liste des adresses demandées (recherches et zones), pour compter les calculs, et l'heure
 * (côté Node, en ms) de chaque demande de zone, dans le même ordre.
 */
export async function servirIgn(page: Page, { recherche = 'ok', trajets = 'ok', delaiZoneMs = DELAI_ZONE_MS, panne }: OptionsIgn = {}) {
  const demandes = { recherches: [] as string[], zones: [] as string[], heures: [] as number[] };

  await page.route('https://data.geopf.fr/geocodage/search*', (r: Route) => {
    const url = new URL(r.request().url());
    demandes.recherches.push(url.href);
    if (recherche === 'panne') return r.abort();
    const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
    if (q.length < 3) return r.fulfill({ status: 400, headers: CORS, json: { code: 400, message: 'q: must contain between 3 and 200 chars' } });
    const features = Object.entries(SUGGESTIONS)
      .filter(([texte]) => texte.toLowerCase().startsWith(q))
      .flatMap(([, x]) => x.suggestions.map(feature));
    return r.fulfill({ headers: CORS, json: { type: 'FeatureCollection', features } });
  });

  await page.route('https://data.geopf.fr/navigation/isochrone*', async (r: Route) => {
    const url = new URL(r.request().url());
    const essai = demandes.zones.filter((u) => u === url.href).length + 1;
    demandes.zones.push(url.href);
    demandes.heures.push(Date.now());
    if (trajets === 'panne') return r.abort();
    if (trajets === '429') return r.fulfill({ status: 429, headers: { ...CORS, 'retry-after': '5' }, contentType: 'text/html', body: REFUS_429 });
    const point = url.searchParams.get('point')!.split(',').map(Number);
    const minutes = Number(url.searchParams.get('costValue'));
    const p = panneDe(panne, minutes, essai, point);
    if (p === 'reseau') return r.abort();
    if (p === 'muette') return; // jamais servie : la page l'abandonne à la fin de son calcul
    await new Promise((ok) => setTimeout(ok, delaiZoneMs));
    if (p) return r.fulfill({ status: p, headers: { ...CORS, ...EN_TETES_ERREUR }, body: ERREURS[p] }).catch(() => {});
    return r
      .fulfill({
        headers: CORS,
        json: {
          point: point.join(','),
          resource: 'bdtopo-valhalla',
          resourceVersion: '2026-10-05',
          costType: 'time',
          costValue: minutes,
          timeUnit: 'minute',
          profile: 'car',
          direction: 'departure',
          crs: 'EPSG:4326',
          geometry: zone(point, minutes),
          constraints: [],
        },
      })
      .catch(() => {}); // page fermée ou demande annulée (« Retirer ») pendant le délai
  });

  return demandes;
}
