import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// MapLibre 6 calcule l'adresse de son worker à l'exécution (import.meta.url) : Vite ne peut pas la suivre.
// On lui donne le worker empaqueté par Vite, avec ses imports.
setWorkerUrl(workerUrl);

export * from 'maplibre-gl';
