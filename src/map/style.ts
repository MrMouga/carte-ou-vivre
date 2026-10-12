// Style de la carte : fond Plan IGN « atténué » et estompage IGN en direct (D16), communes posées sous les textes de l'IGN.
// Couleurs et opacités lues dans les jetons (même module que le CSS).
import type { ExpressionSpecification, FillLayerSpecification, RasterLayerSpecification, RasterSourceSpecification } from 'maplibre-gl';
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

/** Couleur d'une commune : état `c` posé par la carte (jeton de palier), sinon non peinte. */
export const COMMUNES_LAYER: FillLayerSpecification = {
  id: 'communes',
  type: 'fill',
  source: SOURCE_COMMUNES,
  paint: {
    'fill-color': ['coalesce', ['feature-state', 'c'], 'transparent'] as ExpressionSpecification,
    // H10 : 88 % à l'échelle de la France (jusqu'au zoom 7), 70 % au zoom d'une ville (dès le zoom 11).
    'fill-opacity': ['interpolate', ['linear'], ['zoom'], carte['zoom-france'], carte['opacite-france'], carte['zoom-ville'], carte['opacite-zoom']],
  },
};

export const PALIERS = [color['score-1'], color['score-2'], color['score-3'], color['score-4'], color['score-5']] as const;
