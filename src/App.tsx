import { useEffect, useRef } from 'react';
import { Map as MapLibreMap } from './map/maplibre';

// Socle (tâche 0a) : une carte MapLibre sur un fond uni, sans service extérieur.
export function App() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const map = new MapLibreMap({
      container: container.current!,
      style: { version: 8, sources: {}, layers: [{ id: 'fond', type: 'background', paint: { 'background-color': '#F7F4EE' } }] },
      center: [2.5, 46.6],
      zoom: 5,
    });
    map.on('load', () => document.body.setAttribute('data-map-ready', '1'));
    return () => map.remove();
  }, []);

  return <div ref={container} style={{ position: 'fixed', inset: 0 }} data-testid="carte" />;
}
