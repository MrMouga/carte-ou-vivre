import { readFileSync } from 'node:fs';
import type { Page, Route } from '@playwright/test';
import acceptance from '../../../docs/specs/2026-10-13-proches/acceptance.json' with { type: 'json' };

// Faux service IGN des proches (recherche d'adresse et zones de temps), tiré de la fixture d'acceptance.json, au format réel
// relevé en tâche 0 (docs/plans/2026-10-13-proches/captures/T0-ign-exemples/). Aucun appel réel à l'IGN dans les tests.
//
// À poser APRÈS `servirFixture` / `ouvrir` de carte.ts : leur route `data.geopf.fr/**` (fond de carte) reste en dessous,
// et dans Playwright la dernière route posée gagne. Pour compter les demandes dès l'ouverture (réouverture sans calcul),
// poser `servirFixture`, puis `servirIgn`, puis `page.goto`.

const services = acceptance.fixture.services;
type SuggestionFixture = { libelle: string; commune: string; dep: string; point: number[] };
const SUGGESTIONS = services["recherche d'adresse (IGN) — suggestions par texte tapé"] as Record<string, { suggestions: SuggestionFixture[] }>;
const TRAJETS = services['calcul de trajets (IGN) — fin de tranche en minutes par code de commune (null = plus de 3 h), par adresse choisie'] as Record<
  string,
  Record<string, number | null>
>;
const MAIRIE = Object.fromEntries(acceptance.fixture.items.map((it) => [it.code_insee, it.mairie]));
const REFUS_429 = readFileSync(new URL('../../../docs/plans/2026-10-13-proches/captures/T0-ign-exemples/refus-429.html', import.meta.url), 'utf8');
/** L'IGN répond à tout site (appel depuis le navigateur du visiteur). */
const CORS = { 'access-control-allow-origin': '*' };

/** Un proche = 12 zones : chacune répond après 1 s / 12 (fixture.services.délais). */
export const DELAI_ZONE_MS = 1000 / 12;

export type OptionsIgn = {
  /** Recherche : réponses de la fixture, ou erreur réseau sur toute recherche (R13, AC-11). */
  recherche?: 'ok' | 'panne';
  /** Zones : réponses de la fixture, erreur réseau sur toute zone (AC-10), ou refus 429 de l'IGN (compté comme une panne, R13). */
  trajets?: 'ok' | 'panne' | '429';
  /** Délai de chaque zone, en ms. */
  delaiZoneMs?: number;
};

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

/** Pose le faux service ; rend la liste des adresses demandées (recherches et zones), pour compter les calculs. */
export async function servirIgn(page: Page, { recherche = 'ok', trajets = 'ok', delaiZoneMs = DELAI_ZONE_MS }: OptionsIgn = {}) {
  const demandes = { recherches: [] as string[], zones: [] as string[] };

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
    demandes.zones.push(url.href);
    if (trajets === 'panne') return r.abort();
    if (trajets === '429') return r.fulfill({ status: 429, headers: { ...CORS, 'retry-after': '5' }, contentType: 'text/html', body: REFUS_429 });
    const point = url.searchParams.get('point')!.split(',').map(Number);
    const minutes = Number(url.searchParams.get('costValue'));
    await new Promise((ok) => setTimeout(ok, delaiZoneMs));
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
