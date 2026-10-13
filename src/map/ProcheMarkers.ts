// Repères des proches (Figma « Repère proche » 18:144 ; spec proches D4, H29) : un marqueur HTML par proche, posé à son
// point de départ (l'adresse, ou la mairie d'une commune choisie seule), quel que soit son état. Il ne se clique pas
// (les clics passent à la carte) et passe au-dessus des ronds du top 10.
// - Prêt : goutte `place-marker` à contour `card` 2 px et maison ; Calcul (et En attente) : « … » et un anneau qui pulse
//   (fixe à 40 % si l'on réduit les animations, index.css) ; Indisponible : goutte `card` à bord pointillé et « ! ».
// - Le nom est dans une étiquette à droite de la goutte ; si elle recouvre l'étiquette d'un proche ajouté avant, elle
//   passe à gauche (design proches, decisions.md). Recalculé à chaque zoom. L'étiquette est un second marqueur, posé
//   au-dessus de toutes les gouttes : une goutte voisine ne cache jamais un nom (H29 : les deux restent visibles).
// Le point est porté par l'élément (`data-lng`, `data-lat`) : un test lit la position d'un repère hors du cadre.
import { Marker, type Map as MapLibreMap } from './maplibre';
import type { EtatProche } from '@/proches/memoire';
import { map as carte, size, space } from '@/theme/tokens';

export type RepereProche = { id: number; nom: string; etat: EtatProche; lngLat: [number, number] };
type Forme = 'pret' | 'calcul' | 'indisponible';

const formeDe = (etat: EtatProche): Forme => (etat === 'pret' ? 'pret' : etat === 'indisponible' ? 'indisponible' : 'calcul');

// Tracés de Figma (goutte 26 × 34, maison 14 × 14 posée en 6, 6), dans le repère de la goutte.
const GOUTTE = 'M13 1C6.4 1 1 6.2 1 12.7C1 21.2 13 33 13 33C13 33 25 21.2 25 12.7C25 6.2 19.6 1 13 1Z';
const MAISON = 'M7 2.33333L1.75 6.41667H3.20833V11.0833H6.125V8.16667H7.875V11.0833H10.7917V6.41667H12.25L7 2.33333Z';

const ETIQUETTE = 'absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-border bg-card px-2 text-secondaire text-foreground shadow-panneau';
const COTE = { droite: 'left-full ml-1', gauche: 'right-full mr-1' } as const;

function dessin(forme: Forme): string {
  const goutte =
    forme === 'indisponible'
      ? `<path d="${GOUTTE}" class="fill-card stroke-place-marker stroke-2" stroke-dasharray="3 2"/>`
      : `<path d="${GOUTTE}" class="fill-place-marker stroke-card stroke-2"/>`;
  const anneau = forme === 'calcul' ? '<circle data-partie="anneau" cx="13" cy="13" r="16" class="anneau-pulse fill-none stroke-place-marker stroke-2 opacity-40"/>' : '';
  const maison = forme === 'pret' ? `<path transform="translate(6 6)" d="${MAISON}" class="fill-place-marker-foreground"/>` : '';
  const signe =
    forme === 'pret'
      ? ''
      : `<span class="absolute left-0 top-0 flex size-goutte items-center justify-center text-rang ${forme === 'calcul' ? 'text-place-marker-foreground' : 'text-place-marker'}">${forme === 'calcul' ? '…' : '!'}</span>`;
  return `<svg data-partie="goutte" viewBox="0 0 26 34" class="absolute inset-0 h-full w-full overflow-visible">${anneau}${goutte}${maison}</svg>${signe}`;
}

type Item = { marker: Marker; el: HTMLDivElement; nom: Marker; etiquette: HTMLSpanElement; cle: string; repere: RepereProche };

export class ProcheMarkers {
  private items = new Map<number, Item>();
  private ordre: number[] = [];

  constructor(private map: MapLibreMap) {
    map.on('zoom', () => this.placer());
  }

  update(reperes: RepereProche[]) {
    const presents = new Set(reperes.map((r) => r.id));
    for (const [id, it] of this.items)
      if (!presents.has(id)) {
        it.marker.remove();
        it.nom.remove();
        this.items.delete(id);
      }
    for (const r of reperes) {
      const forme = formeDe(r.etat);
      const cle = `${r.nom}|${forme}|${r.lngLat.join(',')}`;
      let it = this.items.get(r.id);
      if (it?.cle === cle) continue;
      if (!it) {
        const el = document.createElement('div');
        // Au-dessus des ronds du top 10 (z-index), sans prise aux clics ; la zone « Tes proches » dit déjà tout aux lecteurs d'écran.
        el.className = 'pointer-events-none z-1 w-goutte h-goutte-haut';
        el.setAttribute('aria-hidden', 'true');
        el.dataset.repereProche = '';
        el.style.setProperty('--duree-pulse', `${carte['duree-pulse-ms']}ms`);
        // Étiquette : une boîte de la taille de la goutte, au même point, deux crans au-dessus ; le nom déborde à côté.
        const boite = document.createElement('div');
        boite.className = 'pointer-events-none z-2 w-goutte h-goutte-haut';
        boite.setAttribute('aria-hidden', 'true');
        boite.dataset.etiquetteProche = '';
        const etiquette = document.createElement('span');
        etiquette.dataset.partie = 'etiquette';
        etiquette.className = `${ETIQUETTE} ${COTE.droite}`;
        boite.append(etiquette);
        it = { marker: new Marker({ element: el, anchor: 'bottom' }), el, nom: new Marker({ element: boite, anchor: 'bottom' }), etiquette, cle: '', repere: r };
        this.items.set(r.id, it);
      }
      it.cle = cle;
      it.repere = r;
      it.el.dataset.nom = r.nom;
      it.el.dataset.etat = forme;
      it.el.dataset.lng = String(r.lngLat[0]);
      it.el.dataset.lat = String(r.lngLat[1]);
      it.el.innerHTML = dessin(forme);
      it.etiquette.textContent = r.nom;
      it.nom.getElement().dataset.nom = r.nom;
      // L'ombre des panneaux, portée par la forme de la goutte (contrat : contour `card` 2 px et `ombre-panneau`).
      it.el.querySelector('svg')!.style.filter = 'drop-shadow(var(--ombre-panneau))';
      it.marker.setLngLat(r.lngLat).addTo(this.map);
      it.nom.setLngLat(r.lngLat).addTo(this.map);
    }
    this.ordre = reperes.map((r) => r.id);
    this.placer();
  }

  remove() {
    this.items.forEach((it) => {
      it.marker.remove();
      it.nom.remove();
    });
    this.items.clear();
  }

  /** Étiquettes : à droite, sauf si elle recouvre une étiquette déjà posée (proche ajouté avant) : alors à gauche. */
  private placer() {
    const posees: { x0: number; x1: number; y0: number; y1: number }[] = [];
    const demi = size['taille-goutte'] / 2;
    const ecart = space['space-1'];
    for (const id of this.ordre) {
      const it = this.items.get(id);
      if (!it) continue;
      const p = this.map.project(it.repere.lngLat);
      const [l, h] = [it.etiquette.offsetWidth, it.etiquette.offsetHeight];
      const y0 = p.y - size['taille-goutte-haut'] / 2 - h / 2;
      const droite = { x0: p.x + demi + ecart, x1: p.x + demi + ecart + l, y0, y1: y0 + h };
      const gauche = posees.some((b) => droite.x0 < b.x1 && b.x0 < droite.x1 && droite.y0 < b.y1 && b.y0 < droite.y1);
      posees.push(gauche ? { x0: p.x - demi - ecart - l, x1: p.x - demi - ecart, y0, y1: y0 + h } : droite);
      it.etiquette.className = `${ETIQUETTE} ${gauche ? COTE.gauche : COTE.droite}`;
      it.etiquette.dataset.cote = gauche ? 'gauche' : 'droite';
    }
  }
}
