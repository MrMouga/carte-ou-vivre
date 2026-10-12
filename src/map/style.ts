// Style de la carte : fond Plan IGN « atténué » et estompage IGN en direct (D16), communes posées sous les textes de l'IGN.
// Couleurs et opacités lues dans les jetons (même module que le CSS).
import type { ExpressionSpecification, FillLayerSpecification, LineLayerSpecification, RasterLayerSpecification, RasterSourceSpecification, VectorSourceSpecification } from 'maplibre-gl';
import { color, map as carte } from '@/theme/tokens';

export const IGN_STYLE_URL = 'https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/attenue.json';

export const ESTOMPAGE_SOURCE: RasterSourceSpecification = {
  type: 'raster',
  tiles: [
    'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW&STYLE=estompage_grayscale&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png',
  ],
  tileSize: 256,
  attribution: 'Plan IGN, estompage : © IGN – Géoplateforme',
};

export const ESTOMPAGE_LAYER: RasterLayerSpecification = {
  id: 'estompage',
  type: 'raster',
  source: 'estompage',
  paint: { 'raster-opacity': carte['opacite-estompage'] },
};

export const SOURCE_COMMUNES = 'communes';
/** Couche des tuiles (scripts/data/tuiles.py) ; l'identifiant d'une forme est l'index de sa commune. */
export const COUCHE_TUILES = 'communes';

/** Tuiles vectorielles des communes (contours à 100 m, zooms 4 à 11), demandées seulement dans le cadre des communes. */
export function sourceCommunes(bounds: [number, number, number, number]): VectorSourceSpecification {
  return { type: 'vector', tiles: [`${location.origin}/tuiles/{z}/{x}/{y}.pbf`], minzoom: 4, maxzoom: 11, bounds };
}

/** Couleur d'une commune : état `c` posé par la carte (jeton de palier), sinon non peinte. */
export const COMMUNES_LAYER: FillLayerSpecification = {
  id: 'communes',
  type: 'fill',
  source: SOURCE_COMMUNES,
  'source-layer': COUCHE_TUILES,
  paint: {
    'fill-color': ['coalesce', ['feature-state', 'c'], 'transparent'] as ExpressionSpecification,
    // H10 : 88 % à l'échelle de la France (jusqu'au zoom 7), 70 % au zoom d'une ville (dès le zoom 11).
    // « Sans plafond » (sable) : 70 % à toutes les échelles (D17).
    'fill-opacity': [
      'interpolate', ['linear'], ['zoom'],
      carte['zoom-france'], ['case', ['==', ['feature-state', 'c'], color['area-unranked']], carte['opacite-sans-plafond'], carte['opacite-france']],
      carte['zoom-ville'], ['case', ['==', ['feature-state', 'c'], color['area-unranked']], carte['opacite-sans-plafond'], carte['opacite-zoom']],
    ] as ExpressionSpecification,
  },
};

/** Commune choisie : double contour, 4 px `card` sous 1,8 px `foreground` (contrat). */
const siChoisie = (v: number): ExpressionSpecification => ['case', ['boolean', ['feature-state', 'choisie'], false], v, 0];
export const CHOISIE_LAYERS: LineLayerSpecification[] = [
  { id: 'choisie-halo', type: 'line', source: SOURCE_COMMUNES, 'source-layer': COUCHE_TUILES, paint: { 'line-color': color.card, 'line-width': siChoisie(carte['choisie-halo']) } },
  { id: 'choisie-trait', type: 'line', source: SOURCE_COMMUNES, 'source-layer': COUCHE_TUILES, paint: { 'line-color': color.foreground, 'line-width': siChoisie(carte['choisie-trait']) } },
];

export const PALIERS = [color['score-1'], color['score-2'], color['score-3'], color['score-4'], color['score-5']] as const;
