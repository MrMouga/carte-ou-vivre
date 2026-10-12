import { useEffect, useRef } from 'react';
import { Map as MapLibreMap, type GeoJSONSourceSpecification } from './maplibre';
import { COMMUNES_LAYER, ESTOMPAGE_LAYER, ESTOMPAGE_SOURCE, IGN_STYLE_URL, SOURCE_COMMUNES } from './style';
import { emprise, paddingBureau, type Formes } from './view';
import { Button } from '@/components/ui/button';

type Props = {
  formes: Formes;
  /** Couleur de chaque commune, indexée par l'identifiant de sa forme ; null = non peinte. */
  couleurs: (string | null)[];
};

// La carte : fond IGN, estompage, communes recolorées par état (tâche 1b : seulement celles qui changent).
export function MapView({ formes, couleurs }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const peintes = useRef<(string | null | undefined)[]>([]);
  const couleursRef = useRef(couleurs);
  couleursRef.current = couleurs;

  useEffect(() => {
    const [w, s, e, n] = emprise(formes.features);
    const map = new MapLibreMap({
      container: container.current!,
      style: IGN_STYLE_URL,
      bounds: [[w, s], [e, n]],
      fitBoundsOptions: { padding: paddingBureau() },
      attributionControl: { compact: false },
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;
    map.on('load', () => {
      const premierTexte = map.getStyle().layers.find((l) => l.type === 'symbol')?.id;
      map.addSource(SOURCE_COMMUNES, { type: 'geojson', data: formes as unknown as GeoJSONSourceSpecification['data'] });
      map.addLayer(COMMUNES_LAYER, premierTexte);
      map.addSource('estompage', ESTOMPAGE_SOURCE);
      map.addLayer(ESTOMPAGE_LAYER, COMMUNES_LAYER.id);
      peindre(map, couleursRef.current, peintes.current);
      // Sans image demandée ici, MapLibre peut ne plus redessiner après l'ajout des couches, et `idle` n'arrive pas.
      map.once('idle', () => container.current?.setAttribute('data-carte-prete', '1'));
      map.triggerRepaint();
    });
    return () => {
      map.remove();
      mapRef.current = null;
      peintes.current = [];
    };
  }, [formes]);

  useEffect(() => {
    const map = mapRef.current;
    if (map?.getSource(SOURCE_COMMUNES)) peindre(map, couleurs, peintes.current);
  }, [couleurs]);

  return (
    <>
      {/* MapLibre impose position: relative à son conteneur : le placement se fait sur une boîte autour. */}
      <div className="absolute inset-0">
        <div ref={container} className="h-full w-full" data-testid="carte" />
      </div>
      {/* Zoom (H8) : en bas, contre le bord gauche du panneau de liste. */}
      <div className="pointer-events-none absolute bottom-4 right-4 flex items-end gap-4">
        <div className="pointer-events-auto flex flex-col gap-1">
          <Button variant="icone" aria-label="Zoomer" onClick={() => mapRef.current?.zoomIn()}>
            +
          </Button>
          <Button variant="icone" aria-label="Dézoomer" onClick={() => mapRef.current?.zoomOut()}>
            −
          </Button>
        </div>
        <div className="w-liste" />
      </div>
    </>
  );
}

function peindre(map: MapLibreMap, couleurs: (string | null)[], peintes: (string | null | undefined)[]) {
  for (let i = 0; i < couleurs.length; i++) {
    if (peintes[i] === couleurs[i]) continue;
    peintes[i] = couleurs[i];
    map.setFeatureState({ source: SOURCE_COMMUNES, id: i }, { c: couleurs[i] });
  }
}
