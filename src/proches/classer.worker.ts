// Web Worker natif (tâche 0) : lit les zones brutes de l'IGN et classe les 34 746 mairies hors du fil de la page.
import { classer, type Geometrie } from './temps';

self.onmessage = (ev: MessageEvent<{ textes: [number, string][]; points: Float64Array }>) => {
  const zones = ev.data.textes.map(([d, t]): [number, Geometrie] => [d, JSON.parse(t).geometry]);
  const fins = classer(zones, ev.data.points);
  (self as unknown as Worker).postMessage(fins, [fins.buffer]);
};
