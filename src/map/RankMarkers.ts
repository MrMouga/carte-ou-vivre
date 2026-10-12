// Ronds du top 10 (Figma « Rond du top 10 ») : un marqueur HTML par commune, cliquable.
// Deux ronds qui se chevauchent à plus de 50 % (centres à moins d'un demi-diamètre) forment un groupe « 3 · 10 » ;
// un clic sur le groupe zoome juste assez pour les séparer (D17).
import { Marker, type Map as MapLibreMap } from './maplibre';
import { ordinal } from '@/domain/format';
import { map as carte, size } from '@/theme/tokens';

export type Rond = { index: number; rang: number; nom: string; lngLat: [number, number] };

const CLASSE_ROND = 'flex cursor-pointer items-center justify-center rounded-full bg-foreground text-rang text-primary-foreground tabular-nums';

export class RankMarkers {
  private markers: Marker[] = [];
  private ronds: Rond[] = [];
  private choisie: number | null = null;

  constructor(private map: MapLibreMap, private onChoisir: (index: number) => void) {
    map.on('zoomend', () => this.dessiner());
  }

  update(ronds: Rond[], choisie: number | null) {
    this.ronds = ronds;
    this.choisie = choisie;
    this.dessiner();
  }

  remove() {
    this.markers.forEach((m) => m.remove());
    this.markers = [];
  }

  private dessiner() {
    this.remove();
    const seuil = size['taille-rond'] / 2;
    const groupes: { ronds: Rond[]; x: number; y: number }[] = [];
    for (const r of [...this.ronds].sort((a, b) => a.rang - b.rang)) {
      const p = this.map.project(r.lngLat);
      const g = groupes.find((g) => Math.hypot(g.x - p.x, g.y - p.y) < seuil);
      if (g) g.ronds.push(r);
      else groupes.push({ ronds: [r], x: p.x, y: p.y });
    }
    // Les premiers rangs au-dessus : on les ajoute en dernier.
    for (const g of groupes.reverse()) {
      const el = document.createElement('button');
      el.type = 'button';
      if (g.ronds.length === 1) {
        const r = g.ronds[0];
        const choisi = r.index === this.choisie;
        el.className = `${CLASSE_ROND} ${choisi ? 'size-rond-choisi border-3' : 'size-rond border-2'} border-card`;
        el.textContent = String(r.rang);
        el.setAttribute('aria-label', `${ordinal(r.rang)} : ${r.nom}`);
        if (choisi) el.setAttribute('aria-current', 'true');
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.onChoisir(r.index);
        });
      } else {
        const rangs = g.ronds.map((r) => r.rang);
        el.className = `${CLASSE_ROND} h-rond min-w-rond border-2 border-card px-1`;
        el.textContent = rangs.join(' · ');
        el.setAttribute('aria-label', `Communes ${rangs.join(', ')} : zoomer pour les séparer`);
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.separer(g.ronds);
        });
      }
      this.markers.push(new Marker({ element: el }).setLngLat(g.ronds[0].lngLat).addTo(this.map));
    }
  }

  /** Zoome au centre du groupe juste assez pour que ses ronds soient à plus d'un demi-diamètre les uns des autres. */
  private separer(ronds: Rond[]) {
    let min = Infinity;
    const pts = ronds.map((r) => this.map.project(r.lngLat));
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) min = Math.min(min, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
    const dz = Math.log2(size['taille-rond'] / Math.max(min, 0.5)) + 0.1;
    const lng = ronds.reduce((a, r) => a + r.lngLat[0], 0) / ronds.length;
    const lat = ronds.reduce((a, r) => a + r.lngLat[1], 0) / ronds.length;
    this.map.easeTo({ center: [lng, lat], zoom: this.map.getZoom() + dz, duration: carte['duree-zoom-ms'] });
  }
}
