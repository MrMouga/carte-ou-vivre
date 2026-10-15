import { existsSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';
import acceptance from '../../../docs/specs/2026-10-12-loyer-mer/acceptance.json' with { type: 'json' };
import immobilier from '../../../docs/specs/2026-10-14-immobilier/acceptance.json' with { type: 'json' };
import cadreDeVie from '../../../docs/specs/2026-10-14-cadre-de-vie/acceptance.json' with { type: 'json' };
import metropole from '../../fixtures/metropole.json' with { type: 'json' };
import { color, map as carte } from '../../../src/theme/tokens';
import { paddingCarte } from '../../../src/map/view';
import { readPixels } from './pixels';

// Fixture « 5 communes » servie à la place de public/data, et fond IGN remplacé par un style local uni (aucun appel réseau).
export type Id = 'A' | 'B' | 'C' | 'D' | 'E';
type Item = (typeof acceptance.fixture.items)[number] | (typeof metropole.items)[number] | (typeof immobilier.fixture.items)[number];
/** Un jeu de communes servi aux tests : ses lignes, ses carrés et le dossier de ses tuiles. */
export type Jeu = { items: Item[]; tuiles: URL };
const items = acceptance.fixture.items;
export const FIXTURE: Jeu = { items, tuiles: new URL('../../fixtures/tuiles/', import.meta.url) };
/**
 * Jeu d'AC-1 d'interface-telephone (python3 scripts/data/tuiles.py --fixture) : les 5 carrés décalés aux latitudes de la
 * métropole, et deux communes qui ne passent pas aux coins de l'emprise de la métropole avec la Corse (R1, R2).
 */
export const METROPOLE: Jeu = { items: metropole.items, tuiles: new URL('../../fixtures/tuiles-metropole/', import.meta.url) };

// Loyer des maisons et prix d'achat (spec immobilier) : un champ absent du jeu (5 communes de loyer-mer, métropole) est
// servi inconnu, `null` et source « inconnu-secteur ».
// Type d'environnement et distance à la montagne (cadre-de-vie) : pris dans la fixture « 6 communes · cadre de vie », par
// code INSEE (A à E ont les mêmes codes dans tous les jeux) ; le jeu « métropole » les sert inconnus (plan, « Fixtures »).
const cadreParCode = new Map(cadreDeVie.fixture.items.map((it) => [it.code_insee, it]));
const communesJson = (jeu: Jeu) => ({
  champs: ['code', 'nom', 'dep', 'population', 'loyer_m2', 'estimation_propre', 'mer_km', 'loyer_maison_m2', 'estimation_propre_maison', 'type_env', 'montagne_km'],
  communes: jeu.items.map((it) => {
    const cadre = jeu.items === METROPOLE.items ? undefined : cadreParCode.get(it.code_insee);
    return [
      it.code_insee, it.nom, it.dep, it.population, it.loyer_m2, it.estimation_propre, it.mer_km,
      'loyer_m2_maison' in it ? it.loyer_m2_maison : null,
      'estimation_propre_maison' in it ? it.estimation_propre_maison : null,
      cadre?.type_env ?? null,
      cadre?.montagne_km ?? null,
    ];
  }),
});
const INCONNU = { m2: null, source: 'inconnu-secteur' };
const achatJson = ({ items }: Jeu) => ({
  champs: ['code', 'appartement_m2', 'appartement_source', 'maison_m2', 'maison_source'],
  communes: items.map((it) => {
    const [a, m] = 'achat_appartement' in it ? [it.achat_appartement, it.achat_maison] : [INCONNU, INCONNU];
    return [it.code_insee, a.m2, a.source, m.m2, m.source];
  }),
});
// Formes : tuiles du jeu ; repères : centre et cadre de chaque carré.
const reperesJson = ({ items }: Jeu) => ({
  champs: ['lon', 'lat', 'ouest', 'sud', 'est', 'nord'],
  reperes: items.map(({ forme }) => {
    const [xs, ys] = [forme.map((c) => c[0]), forme.map((c) => c[1])];
    const [w, s, e, n] = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    return [(w + e) / 2, (s + n) / 2, w, s, e, n];
  }),
});
const PNG_TRANSPARENT = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
export const STYLE_LOCAL = { version: 8, sources: {}, layers: [{ id: 'fond', type: 'background', paint: { 'background-color': color.background } }] };

export async function servirFixture(page: Page, { fondEnPanne = false, jeu = FIXTURE } = {}) {
  await page.route('**/data/communes.json', (r) => r.fulfill({ json: communesJson(jeu) }));
  await page.route('**/data/reperes.json', (r) => r.fulfill({ json: reperesJson(jeu) }));
  await page.route('**/data/achat.json', (r) => r.fulfill({ json: achatJson(jeu) }));
  await page.route('**/tuiles/**', (r) => {
    const tuile = new URL(new URL(r.request().url()).pathname.replace(/^\/tuiles\//, ''), jeu.tuiles);
    return existsSync(tuile) ? r.fulfill({ path: tuile.pathname }) : r.fulfill({ body: '' });
  });
  await page.route('https://data.geopf.fr/**', (r) => {
    if (fondEnPanne) return r.abort();
    if (r.request().url().includes('/styles/')) return r.fulfill({ json: STYLE_LOCAL });
    // Estompage : une image transparente (un refus réseau ne redemande pas d'image à MapLibre, et `idle` n'arrive pas).
    return r.fulfill({ contentType: 'image/png', body: PNG_TRANSPARENT });
  });
}

export async function ouvrir(page: Page, chemin = '/', { jeu = FIXTURE } = {}) {
  await servirFixture(page, { jeu });
  await page.goto(chemin);
  await expect(page.getByTestId('carte')).toHaveAttribute('data-carte-prete', '1');
}

/** Attend que la carte ait redessiné après un réglage (deux images). */
export async function apresRendu(page: Page) {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 50)))));
}

// Où tombe le centre de chaque carré à l'ouverture : même calcul que fitBounds de MapLibre (tuiles de 512 px, Mercator),
// sur l'emprise du jeu (la fixture par défaut) et avec le cadrage de la largeur testée (bureau ou 390 px).
const mx = (lon: number) => (lon + 180) / 360;
const my = (lat: number) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2;

export function vue(page: Page, { items } = FIXTURE) {
  const { width: W, height: H } = page.viewportSize()!;
  const p = paddingCarte(W, H); // à 390 px : la bande au-dessus de la feuille de la liste
  const lons = items.flatMap((it) => it.forme.map((c) => c[0]));
  const lats = items.flatMap((it) => it.forme.map((c) => c[1]));
  const [x0, x1, y0, y1] = [mx(Math.min(...lons)), mx(Math.max(...lons)), my(Math.max(...lats)), my(Math.min(...lats))];
  const z = Math.log2(Math.min((W - p.left - p.right) / ((x1 - x0) * 512), (H - p.top - p.bottom) / ((y1 - y0) * 512)));
  const monde = 512 * 2 ** z;
  const cx = p.left + (W - p.left - p.right) / 2, cy = p.top + (H - p.top - p.bottom) / 2;
  const ecran = (lon: number, lat: number) => ({ x: cx + (mx(lon) - (x0 + x1) / 2) * monde, y: cy + (my(lat) - (y0 + y1) / 2) * monde });
  const forme = (id: string) => items.find((it) => it.id === id)!.forme;
  /** Centre du carré : là où l'on clique (et où se pose le rond d'une commune du top 10). */
  const centre = (id: string) => ecran((forme(id)[0][0] + forme(id)[2][0]) / 2, (forme(id)[0][1] + forme(id)[2][1]) / 2);
  /** Point de lecture de la couleur : à 0,1° du coin sud-ouest, loin du rond et des bords. */
  const lecture = (id: string) => ecran(forme(id)[0][0] + 0.1, forme(id)[0][1] + 0.1);
  const opacite = Math.max(carte['opacite-zoom'], Math.min(carte['opacite-france'],
    carte['opacite-france'] + ((z - carte['zoom-france']) / (carte['zoom-ville'] - carte['zoom-france'])) * (carte['opacite-zoom'] - carte['opacite-france'])));
  return { z, centre, lecture, opacite, ecran };
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Couleur attendue : le jeton posé sur le fond uni, à l'opacité du zoom courant. */
export function melange(jeton: keyof typeof color, opacite: number) {
  const [a, b] = [rgb(color[jeton]), rgb(color.background)];
  return a.map((v, i) => Math.round(v * opacite + b[i] * (1 - opacite)));
}

/**
 * Vérifie la couleur de chaque carré (± 3 par canal) ; null = non peinte (pixel = fond). Par défaut, lue près du coin
 * sud-ouest ; `au: 'centre'` pour un carré de quelques pixels (jeu métropole), dont le bord est adouci.
 */
export async function attendreCouleurs<K extends string = Id>(
  page: Page,
  attendu: Partial<Record<K, keyof typeof color | null>>,
  { jeu = FIXTURE, au = 'lecture' as 'lecture' | 'centre' } = {},
) {
  const v = vue(page, jeu);
  const { opacite } = v;
  const ids = Object.keys(attendu) as K[];
  const px = await readPixels(page, ids.map(v[au]));
  ids.forEach((id, k) => {
    const j = attendu[id];
    const cible = j == null ? rgb(color.background) : melange(j, j === 'area-unranked' ? carte['opacite-sans-plafond'] : opacite);
    const ecart = Math.max(...px[k].map((v, i) => Math.abs(v - cible[i])));
    expect(ecart, `${id} : lu ${px[k]} , attendu ${cible} (${j ?? 'fond'})`).toBeLessThanOrEqual(3);
  });
}
