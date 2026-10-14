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

/** Tuiles vectorielles des communes (contours à 100 m, zooms 3 à 11), demandées seulement dans le cadre des communes. */
export function sourceCommunes(bounds: [number, number, number, number]): VectorSourceSpecification {
  return { type: 'vector', tiles: [`${location.origin}/tuiles/{z}/{x}/{y}.pbf`], minzoom: 3, maxzoom: 11, bounds };
}

const NEUTRE = color['area-unranked'];
const ETAT: ExpressionSpecification = ['feature-state', 'c'];
/** Couleur de l'état `c` à une opacité donnée ; la couleur neutre toujours à 70 % ; sans état : non peinte. */
const teinte = (opacite: number): ExpressionSpecification => [
  'case',
  ['==', ETAT, null],
  'transparent',
  ['let', 'v', ['to-rgba', ['to-color', ETAT]],
    ['rgba', ['at', 0, ['var', 'v']], ['at', 1, ['var', 'v']], ['at', 2, ['var', 'v']], ['case', ['==', ETAT, NEUTRE], carte['opacite-sans-plafond'], opacite]]],
];

/**
 * Couleur d'une commune : état `c` posé par la carte (jeton de palier ou couleur neutre), sinon non peinte.
 * Opacité portée par la couleur, la couche restant à 100 % : H10 (classées) : 88 % à l'échelle de la France (jusqu'au
 * zoom 7), 70 % au zoom d'une ville (dès le zoom 11) ; couleur neutre (`area-unranked`) : 70 % à toutes les échelles
 * (D17 de loyer-mer), sur la page « sans plafond » comme pour une commune sans note (R25 d'immobilier, prix inconnu).
 * Une seule propriété lit l'état des formes : MapLibre ne recalcule qu'elle à chaque recoloriage (budget H9 ; une
 * seconde couche pour la couleur neutre coûtait 55 ms de plus).
 */
export const COMMUNES_LAYER: FillLayerSpecification = {
  id: 'communes',
  type: 'fill',
  source: SOURCE_COMMUNES,
  'source-layer': COUCHE_TUILES,
  paint: {
    'fill-color': ['interpolate', ['linear'], ['zoom'], carte['zoom-france'], teinte(carte['opacite-france']), carte['zoom-ville'], teinte(carte['opacite-zoom'])],
  },
};

/**
 * Commune choisie : double contour, 4 px `card` sous 1,8 px `foreground` (contrat). Un filtre sur l'identifiant de la
 * forme, et non un état : les contours ne sont pas recalculés à chaque recoloriage (budget H9).
 */
export const filtreChoisie = (index: number | null): ExpressionSpecification => ['==', ['id'], index ?? -1];
export const CHOISIE_LAYERS: LineLayerSpecification[] = [
  { id: 'choisie-halo', type: 'line', source: SOURCE_COMMUNES, 'source-layer': COUCHE_TUILES, filter: filtreChoisie(null), paint: { 'line-color': color.card, 'line-width': carte['choisie-halo'] } },
  { id: 'choisie-trait', type: 'line', source: SOURCE_COMMUNES, 'source-layer': COUCHE_TUILES, filter: filtreChoisie(null), paint: { 'line-color': color.foreground, 'line-width': carte['choisie-trait'] } },
];

export const PALIERS = [color['score-1'], color['score-2'], color['score-3'], color['score-4'], color['score-5']] as const;
