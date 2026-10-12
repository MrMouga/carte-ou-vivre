import { expect, type Page } from '@playwright/test';
import acceptance from '../../../docs/specs/2026-10-12-loyer-mer/acceptance.json' with { type: 'json' };
import { color, map as carte } from '../../../src/theme/tokens';
import { paddingBureau } from '../../../src/map/view';
import { readPixels } from './pixels';

// Fixture « 5 communes » servie à la place de public/data, et fond IGN remplacé par un style local uni (aucun appel réseau).
export type Id = 'A' | 'B' | 'C' | 'D' | 'E';
const items = acceptance.fixture.items;

const communesJson = {
  champs: ['code', 'nom', 'dep', 'population', 'loyer_m2', 'estimation_propre', 'mer_km'],
  communes: items.map((it) => [it.code_insee, it.nom, it.dep, it.population, it.loyer_m2, it.estimation_propre, it.mer_km]),
};
const formesJson = {
  type: 'FeatureCollection',
  features: items.map((it, i) => ({ type: 'Feature', id: i, properties: {}, geometry: { type: 'Polygon', coordinates: [it.forme] } })),
};
const PNG_TRANSPARENT = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
export const STYLE_LOCAL = { version: 8, sources: {}, layers: [{ id: 'fond', type: 'background', paint: { 'background-color': color.background } }] };

export async function servirFixture(page: Page, { fondEnPanne = false } = {}) {
  await page.route('**/data/communes.json', (r) => r.fulfill({ json: communesJson }));
  await page.route('**/data/formes-1000m.json', (r) => r.fulfill({ json: formesJson }));
  await page.route('https://data.geopf.fr/**', (r) => {
    if (fondEnPanne) return r.abort();
    if (r.request().url().includes('/styles/')) return r.fulfill({ json: STYLE_LOCAL });
    // Estompage : une image transparente (un refus réseau ne redemande pas d'image à MapLibre, et `idle` n'arrive pas).
    return r.fulfill({ contentType: 'image/png', body: PNG_TRANSPARENT });
  });
}

export async function ouvrir(page: Page, chemin = '/') {
  await servirFixture(page);
  await page.goto(chemin);
  await expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
}

/** Attend que la carte ait redessiné après un réglage (deux images). */
export async function apresRendu(page: Page) {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 50)))));
}

// Où tombe le centre de chaque carré à l'ouverture : même calcul que fitBounds de MapLibre (tuiles de 512 px, Mercator),
// sur l'emprise de la fixture et avec le cadrage du bureau.
const mx = (lon: number) => (lon + 180) / 360;
const my = (lat: number) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2;

export function vue(page: Page) {
  const { width: W, height: H } = page.viewportSize()!;
  const p = paddingBureau();
  const lons = items.flatMap((it) => it.forme.map((c) => c[0]));
  const lats = items.flatMap((it) => it.forme.map((c) => c[1]));
  const [x0, x1, y0, y1] = [mx(Math.min(...lons)), mx(Math.max(...lons)), my(Math.max(...lats)), my(Math.min(...lats))];
  const z = Math.log2(Math.min((W - p.left - p.right) / ((x1 - x0) * 512), (H - p.top - p.bottom) / ((y1 - y0) * 512)));
  const monde = 512 * 2 ** z;
  const cx = p.left + (W - p.left - p.right) / 2, cy = p.top + (H - p.top - p.bottom) / 2;
  const centre = (id: Id) => {
    const f = items.find((it) => it.id === id)!.forme;
    const lon = (f[0][0] + f[2][0]) / 2, lat = (f[0][1] + f[2][1]) / 2;
    return { x: cx + (mx(lon) - (x0 + x1) / 2) * monde, y: cy + (my(lat) - (y0 + y1) / 2) * monde };
  };
  const opacite = Math.max(carte['opacite-zoom'], Math.min(carte['opacite-france'],
    carte['opacite-france'] + ((z - carte['zoom-france']) / (carte['zoom-ville'] - carte['zoom-france'])) * (carte['opacite-zoom'] - carte['opacite-france'])));
  return { z, centre, opacite };
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Couleur attendue : le jeton posé sur le fond uni, à l'opacité du zoom courant. */
export function melange(jeton: keyof typeof color, opacite: number) {
  const [a, b] = [rgb(color[jeton]), rgb(color.background)];
  return a.map((v, i) => Math.round(v * opacite + b[i] * (1 - opacite)));
}

/** Vérifie la couleur au centre de chaque carré (± 3 par canal) ; null = non peinte (pixel = fond). */
export async function attendreCouleurs(page: Page, attendu: Partial<Record<Id, keyof typeof color | null>>) {
  const { centre, opacite } = vue(page);
  const ids = Object.keys(attendu) as Id[];
  const px = await readPixels(page, ids.map(centre));
  ids.forEach((id, k) => {
    const j = attendu[id];
    const cible = j == null ? rgb(color.background) : melange(j, opacite);
    const ecart = Math.max(...px[k].map((v, i) => Math.abs(v - cible[i])));
    expect(ecart, `${id} : lu ${px[k]} , attendu ${cible} (${j ?? 'fond'})`).toBeLessThanOrEqual(3);
  });
}
