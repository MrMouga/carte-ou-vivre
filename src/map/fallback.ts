// Fond de secours (R8, D17) : quand le style Plan IGN ne répond pas, la mer est le fond de la carte, les pays voisins
// viennent de Natural Earth (public/data/voisins.json), et toutes les communes sont posées dessus : celles qui ne passent
// pas en `area-excluded`, les autres colorées sur le fond uni `background`.
import type { ExpressionSpecification, FillLayerSpecification, StyleSpecification } from 'maplibre-gl';
import { avecDelai } from '@/domain/chargement';
import { color, map as carte } from '@/theme/tokens';
import { COUCHE_TUILES, IGN_STYLE_URL, SOURCE_COMMUNES } from './style';

/** Panne du fond = style IGN non reçu : erreur réseau, réponse ≥ 400, ou rien après 8 s (plan, tâche 5b). */
export const DELAI_STYLE_MS = 8_000;
/** Pendant la panne, nouvel essai du style toutes les 60 s. */
export const NOUVEL_ESSAI_MS = 60_000;

export async function chargerStyleIgn(): Promise<StyleSpecification> {
  const r = await avecDelai(fetch(IGN_STYLE_URL), DELAI_STYLE_MS);
  if (!r.ok) throw new Error(`style IGN : ${r.status}`);
  return (await r.json()) as StyleSpecification;
}

/** Couche posée au-dessus des communes dans le fond de secours : le trait de côte et les frontières. */
export const COUCHE_COTE = 'cote';

export function styleSecours(): StyleSpecification {
  const voisin: ExpressionSpecification = ['==', ['get', 'role'], 'voisin'];
  return {
    version: 8,
    sources: { voisins: { type: 'geojson', data: new URL('/data/voisins.json', location.href).href } },
    layers: [
      { id: 'mer', type: 'background', paint: { 'background-color': color['map-sea'] } },
      { id: 'voisins', type: 'fill', source: 'voisins', filter: voisin, paint: { 'fill-color': color['map-neighbour'] } },
      { id: 'voisins-trait', type: 'line', source: 'voisins', filter: voisin, paint: { 'line-color': color['map-border'], 'line-width': carte['trait-cote'] } },
      { id: COUCHE_COTE, type: 'line', source: 'voisins', filter: ['==', ['get', 'role'], 'france'], paint: { 'line-color': color['map-border'], 'line-width': carte['trait-cote'] } },
    ],
  };
}

/** Socle opaque des communes : `background` sous celles qui sont peintes, `area-excluded` sous les autres. */
export const SOCLE_LAYER: FillLayerSpecification = {
  id: 'communes-socle',
  type: 'fill',
  source: SOURCE_COMMUNES,
  'source-layer': COUCHE_TUILES,
  paint: {
    'fill-color': ['case', ['==', ['feature-state', 'c'], null], color['area-excluded'], color.background] as ExpressionSpecification,
  },
};
