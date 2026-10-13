import { useEffect, useMemo, useRef } from 'react';
import { Map as MapLibreMap, type StyleSpecification } from './maplibre';
import { CHOISIE_LAYERS, COMMUNES_LAYER, COUCHE_TUILES, ESTOMPAGE_LAYER, ESTOMPAGE_SOURCE, filtreChoisie, opaciteCommunes, SOURCE_COMMUNES, sourceCommunes } from './style';
import { chargerStyleIgn, COUCHE_COTE, NOUVEL_ESSAI_MS, SOCLE_LAYER, styleSecours } from './fallback';
import { cadreDe, emprise, type Padding, type Repere } from './view';
import { RankMarkers, type Rond } from './RankMarkers';
import { ProcheMarkers, type RepereProche } from './ProcheMarkers';
import { Button } from '@/components/ui/button';
import { map as carte } from '@/theme/tokens';

type Props = {
  /** Repères des communes (centre, cadre), dans l'ordre de communes.json. */
  reperes: Repere[];
  /** Couleur de chaque commune, indexée par l'identifiant de sa forme ; null = non peinte. */
  couleurs: (string | null)[];
  /** Index de la commune choisie (fiche ouverte), ou null. */
  choisie: number | null;
  /** Page « sans plafond » : toutes les communes peintes sont en sable (D17). */
  sansPlafond: boolean;
  ronds: Rond[];
  /** Repères des proches (spec proches D4), dans l'ordre d'ajout. */
  proches: RepereProche[];
  onChoisir: (index: number) => void;
  /** Première image dessinée. */
  onPrete: () => void;
  /** La carte ne peut pas s'afficher (pas de WebGL). */
  onErreur: () => void;
  onFond: (fond: Fond) => void;
  /** Marges du cadrage, lues au moment de cadrer (la feuille mobile change de hauteur). */
  padding: () => Padding;
};

export type Fond = 'ign' | 'secours';

// La carte : fond IGN et estompage, ou fond de secours (R8) ; communes recolorées par état (tâche 1b : seulement
// celles qui changent), commune choisie en double contour avec zoom sur elle (D14), ronds du top 10, repères des proches.
export function MapView({ reperes, couleurs, choisie, sansPlafond, ronds, proches, onChoisir, onPrete, onErreur, onFond, padding }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const marqueurs = useRef<RankMarkers | null>(null);
  const reperesProches = useRef<ProcheMarkers | null>(null);
  const peintes = useRef<(string | null | undefined)[]>([]);
  const etat = useRef({ couleurs, choisie, sansPlafond, ronds, proches, onChoisir, onPrete, onErreur, onFond, padding });
  etat.current = { couleurs, choisie, sansPlafond, ronds, proches, onChoisir, onPrete, onErreur, onFond, padding };
  const france = useMemo(() => emprise(reperes), [reperes]);

  useEffect(() => {
    let fini = false;
    let map: MapLibreMap | null = null;
    let essai: ReturnType<typeof setInterval> | undefined;
    let fondCourant: Fond = 'ign';
    const fond = (f: Fond) => {
      fondCourant = f;
      container.current?.setAttribute('data-fond', f);
      etat.current.onFond(f);
    };
    // R8 : le style IGN d'abord ; s'il ne répond pas, le fond de secours, puis un nouvel essai toutes les 60 s.
    void chargerStyleIgn().then(
      (style) => demarrer(style, 'ign'),
      () => demarrer(styleSecours(), 'secours'),
    );

    function demarrer(style: StyleSpecification, f: Fond) {
      if (fini) return;
      try {
        map = new MapLibreMap({
          container: container.current!,
          style,
          bounds: france,
          fitBoundsOptions: { padding: etat.current.padding() },
          attributionControl: false, // les mentions sont dans le pied de page (Mentions)
          dragRotate: false,
          pitchWithRotate: false,
        });
      } catch {
        etat.current.onErreur(); // pas de WebGL : la carte ne peut pas s'afficher (details.md, erreur)
        return;
      }
      const m = map;
      m.touchZoomRotate.disableRotation();
      mapRef.current = m;
      fond(f);
      if (f === 'secours') essai = setInterval(reessayer, NOUVEL_ESSAI_MS);
      // Les couches des communes sont reposées à chaque style (setStyle les efface, avec l'état des formes).
      m.on('style.load', () => {
        poserCouches(m, france, fondCourant === 'secours');
        peintes.current = [];
        peindre(m, etat.current.couleurs, peintes.current);
        m.setPaintProperty(COMMUNES_LAYER.id, 'fill-opacity', opaciteCommunes(etat.current.sansPlafond));
        surligner(m, etat.current.choisie);
        m.triggerRepaint();
      });
      m.on('load', () => {
        m.on('click', COMMUNES_LAYER.id, (ev) => {
          const id = ev.features?.[0]?.id;
          if (typeof id === 'number') etat.current.onChoisir(id);
        });
        m.on('mouseenter', COMMUNES_LAYER.id, () => (m.getCanvas().style.cursor = 'pointer'));
        m.on('mouseleave', COMMUNES_LAYER.id, () => (m.getCanvas().style.cursor = ''));
        marqueurs.current = new RankMarkers(m, (i) => etat.current.onChoisir(i));
        marqueurs.current.update(etat.current.ronds, etat.current.choisie);
        reperesProches.current = new ProcheMarkers(m);
        reperesProches.current.update(etat.current.proches);
        // Sans image demandée ici, MapLibre peut ne plus redessiner après l'ajout des couches, et `idle` n'arrive pas.
        m.once('idle', () => {
          container.current?.setAttribute('data-carte-prete', '1');
          etat.current.onPrete();
        });
        m.triggerRepaint();
      });
    }

    function reessayer() {
      void chargerStyleIgn().then(
        (style) => {
          if (fini || !map) return;
          clearInterval(essai);
          fond('ign');
          map.setStyle(style, { diff: false });
        },
        () => {},
      );
    }

    return () => {
      fini = true;
      clearInterval(essai);
      marqueurs.current?.remove();
      marqueurs.current = null;
      reperesProches.current?.remove();
      reperesProches.current = null;
      map?.remove();
      mapRef.current = null;
      peintes.current = [];
    };
  }, [france]);

  useEffect(() => {
    const map = mapRef.current;
    if (map?.getSource(SOURCE_COMMUNES)) peindre(map, couleurs, peintes.current);
  }, [couleurs]);

  useEffect(() => {
    const map = mapRef.current;
    if (map?.getSource(SOURCE_COMMUNES)) map.setPaintProperty(COMMUNES_LAYER.id, 'fill-opacity', opaciteCommunes(sansPlafond));
  }, [sansPlafond]);

  useEffect(() => {
    marqueurs.current?.update(ronds, choisie);
  }, [ronds, choisie]);

  useEffect(() => {
    reperesProches.current?.update(proches);
  }, [proches]);

  // Commune choisie : double contour et zoom sur elle ; retour à la liste : la France entière (D14).
  const avant = useRef<number | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource(SOURCE_COMMUNES)) return;
    surligner(map, choisie);
    const etaitChoisie = avant.current != null;
    avant.current = choisie;
    if (choisie == null) {
      if (etaitChoisie) map.fitBounds(france, { padding: etat.current.padding(), duration: carte['duree-zoom-ms'] });
      return;
    }
    map.fitBounds(cadreDe(reperes[choisie]), { padding: etat.current.padding(), maxZoom: carte['zoom-commune-max'], duration: carte['duree-zoom-ms'] });
  }, [choisie, reperes, france]);

  return (
    <>
      {/* MapLibre impose position: relative à son conteneur : le placement se fait sur une boîte autour. */}
      <div className="absolute inset-0">
        <div ref={container} className="h-full w-full" data-testid="carte" />
      </div>
      {/* Zoom (H8) : en bureau, en bas contre le bord gauche du panneau de liste ; à 390 px, en haut à droite, 44 × 44. */}
      <div className="pointer-events-none absolute bottom-4 right-4 flex items-end gap-4 max-bureau:bottom-auto max-bureau:right-3 max-bureau:top-3">
        <div className="pointer-events-auto flex flex-col gap-1">
          <Button variant="icone" className="max-bureau:size-toucher" aria-label="Zoomer" onClick={() => mapRef.current?.zoomIn()}>
            +
          </Button>
          <Button variant="icone" className="max-bureau:size-toucher" aria-label="Dézoomer" onClick={() => mapRef.current?.zoomOut()}>
            −
          </Button>
        </div>
        <div className="w-liste max-bureau:hidden" />
      </div>
    </>
  );
}

/** Communes sous la première couche de texte de l'IGN (ou sous le trait de côte du fond de secours), estompage dessous. */
function poserCouches(map: MapLibreMap, cadre: [number, number, number, number], secours: boolean) {
  const dessus = map.getStyle().layers.find((l) => l.type === 'symbol' || l.id === COUCHE_COTE)?.id;
  map.addSource(SOURCE_COMMUNES, sourceCommunes(cadre));
  if (secours) map.addLayer(SOCLE_LAYER, dessus);
  map.addLayer(COMMUNES_LAYER, dessus);
  CHOISIE_LAYERS.forEach((l) => map.addLayer(l, dessus));
  if (!secours) {
    map.addSource('estompage', ESTOMPAGE_SOURCE);
    map.addLayer(ESTOMPAGE_LAYER, COMMUNES_LAYER.id);
  }
}

function surligner(map: MapLibreMap, choisie: number | null) {
  CHOISIE_LAYERS.forEach((l) => map.setFilter(l.id, filtreChoisie(choisie)));
}

function peindre(map: MapLibreMap, couleurs: (string | null)[], peintes: (string | null | undefined)[]) {
  for (let i = 0; i < couleurs.length; i++) {
    if (peintes[i] === couleurs[i]) continue;
    peintes[i] = couleurs[i];
    map.setFeatureState({ source: SOURCE_COMMUNES, sourceLayer: COUCHE_TUILES, id: i }, { c: couleurs[i] });
  }
}
