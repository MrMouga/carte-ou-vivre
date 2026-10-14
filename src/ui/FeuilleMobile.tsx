import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { geste } from '@/theme/tokens';

// Feuille mobile, sous 1 024 px (interface-telephone : D3, D5, D9, R18 ; prototype F, Figma « Tête de feuille » et « Onglets
// de feuille »). En haut, la tête : la poignée et le compte (style `valeur`, une ligne). Puis deux onglets, « Critères » (au
// départ) et « Les 10 premières » ; un seul panneau affiché, les deux restent montés et chacun garde sa position de
// défilement. Une fiche ouverte prend la place des onglets et de leur contenu (D17 de loyer-mer), sous la poignée seule.
// Pendant l'ajout d'un proche, la feuille monte jusqu'à la bande de carte du haut (proches, Figma 27:1160) : la poignée
// seule au-dessus du champ, ni onglets ni compte.
// Le compte visible n'est pas lu par les lecteurs d'écran : l'unique zone annoncée de la page (`role=status`) est ici, à
// part, et reste vide sans plafond comme avant cette tranche.
// Repliable (D3, D4, D8, D9, R17, H45 à H48) : la tête est le bouton « Replier la feuille » / « Déplier la feuille »
// (`aria-expanded`), qui se touche et se glisse ; repliée, la feuille descend jusqu'à ne laisser voir que sa barre (poignée
// et compte, toute la barre se touche et se glisse). Ni repli ni glisser tant que la page n'est pas prête, ni pendant l'ajout.

export type Onglet = 'criteres' | 'liste';
const ONGLETS: [Onglet, string][] = [
  ['criteres', 'Critères'],
  ['liste', 'Les 10 premières'],
];

type Props = {
  ref?: React.Ref<HTMLDivElement>;
  onglet: Onglet;
  onOnglet: (o: Onglet) => void;
  /** Le focus est dans l'ajout d'un proche (champ, suggestions, « Nom », « Ajouter ») : la feuille monte. */
  ajout: boolean;
  /** Texte de la tête : « 3 communes passent tes critères », « Aucun plafond fixé » (H42), vide pendant le chargement. */
  compte: string;
  /** Texte de la zone annoncée aux lecteurs d'écran (vide sans plafond). */
  annonce: string;
  criteres: React.ReactNode;
  liste: React.ReactNode;
  fiche: React.ReactNode | null;
  /** Feuille repliée en une barre (R17). */
  repliee: boolean;
  onRepliee: (r: boolean) => void;
  /** Page prête : la feuille peut se replier (pas pendant le chargement ni l'erreur). */
  pret: boolean;
};

/**
 * Glisser vertical de la tête (ouverte) ou de la barre (repliée), au doigt ou à la souris (H46) : la feuille suit le
 * pointeur ; un déplacement de moins de `seuil-toucher` px est un toucher (`onToucher`) ; au lâcher, la position change
 * au-delà de `seuil-change` px, sans règle de vitesse. Leçon « feuille glissable » : le pointeur n'est capturé qu'après
 * `seuil-toucher` px, et le clic qui suit le lâcher est avalé (il tomberait sur ce qui apparaît sous le doigt).
 */
function useGlisser({ actif, repliee, onChanger, onToucher }: { actif: boolean; repliee: boolean; onChanger: () => void; onToucher: () => void }) {
  const [dy, setDy] = useState<number | null>(null);
  const depart = useRef<{ y: number; course: number } | null>(null);
  const bouge = useRef(false);
  const fin = () => {
    depart.current = null;
    bouge.current = false;
    setDy(null);
  };
  return {
    dy,
    handlers: {
      onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
        if (!actif || e.button !== 0) return;
        // Ouverte, seule la tête se glisse : ailleurs, c'est un défilement ou un réglage.
        if (!repliee && !(e.target as HTMLElement).closest('[data-prise]')) return;
        // Repliée, la feuille remonte au plus de sa partie cachée (sous le bas de l'écran).
        const course = Math.max(0, e.currentTarget.getBoundingClientRect().bottom - innerHeight);
        depart.current = { y: e.clientY, course };
        bouge.current = false;
      },
      onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
        if (!depart.current) return;
        const d = e.clientY - depart.current.y;
        if (!bouge.current && Math.abs(d) >= geste['seuil-toucher']) {
          bouge.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        if (bouge.current) setDy(repliee ? Math.max(-depart.current.course, Math.min(0, d)) : Math.max(0, d));
      },
      onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
        if (!depart.current) return;
        const d = e.clientY - depart.current.y;
        const touche = !bouge.current;
        fin();
        const avaler = (ev: MouseEvent) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        window.addEventListener('click', avaler, { capture: true, once: true });
        setTimeout(() => window.removeEventListener('click', avaler, { capture: true }), geste['avaler-clic-ms']);
        if (touche) onToucher();
        else if (repliee ? d < -geste['seuil-change'] : d > geste['seuil-change']) onChanger();
      },
      onPointerCancel: fin,
    },
  };
}

const PANNEAU = 'min-h-0 flex-1 overflow-y-auto overscroll-contain';

export function FeuilleMobile({ ref, onglet, onOnglet, ajout, compte, annonce, criteres, liste, fiche, repliee, onRepliee, pret }: Props) {
  const id = useId();
  const idOnglet = (o: Onglet) => `${id}onglet-${o}`;
  const idPanneau = (o: Onglet) => `${id}panneau-${o}`;
  const avecFiche = fiche != null;
  const affiche: Onglet | null = avecFiche ? null : ajout ? 'criteres' : onglet;

  // Position de défilement de chaque onglet (R18) : relevée en continu, remise quand le panneau réapparaît (un panneau
  // masqué perd la sienne).
  const panneaux = useRef<Record<Onglet, HTMLDivElement | null>>({ criteres: null, liste: null });
  const positions = useRef<Record<Onglet, number>>({ criteres: 0, liste: 0 });
  useLayoutEffect(() => {
    const el = affiche && panneaux.current[affiche];
    if (el && el.scrollTop !== positions.current[affiche]) el.scrollTop = positions.current[affiche];
  }, [affiche]);

  // Motif « onglets » (H47) : flèches gauche et droite, focus et sélection ensemble ; seul l'onglet choisi est dans l'ordre de tabulation.
  const boutons = useRef<Record<Onglet, HTMLButtonElement | null>>({ criteres: null, liste: null });
  const clavier = (e: React.KeyboardEvent, o: Onglet) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = ONGLETS.findIndex(([x]) => x === o);
    const [suivant] = ONGLETS[(i + (e.key === 'ArrowRight' ? 1 : ONGLETS.length - 1)) % ONGLETS.length];
    onOnglet(suivant);
    boutons.current[suivant]?.focus();
  };

  // Repli (H47) : le focus qui était dans la feuille, ailleurs que sur la tête, passe à « Déplier la feuille » ; sur la tête,
  // il y reste (même bouton).
  const racine = useRef<HTMLDivElement | null>(null);
  const tete = useRef<HTMLButtonElement | null>(null);
  const rendreFocus = useRef(false);
  const changer = (r: boolean) => {
    const actif = document.activeElement;
    rendreFocus.current = r && actif !== tete.current && !!racine.current?.contains(actif);
    onRepliee(r);
  };
  useEffect(() => {
    if (!repliee || !rendreFocus.current) return;
    rendreFocus.current = false;
    tete.current?.focus();
  }, [repliee]);
  const g = useGlisser({ actif: pret && !ajout, repliee, onChanger: () => changer(!repliee), onToucher: () => changer(!repliee) });
  const glisse = g.dy != null;
  const decalage = `${g.dy ?? 0}px`;
  const transform = repliee ? `translateY(calc(100% - var(--hauteur-repliee) + ${decalage}))` : glisse ? `translateY(${decalage})` : undefined;

  const panneau = (o: Onglet, contenu: React.ReactNode, apres?: React.ReactNode) => (
    <div
      ref={(el) => {
        panneaux.current[o] = el;
      }}
      role="tabpanel"
      id={idPanneau(o)}
      aria-labelledby={idOnglet(o)}
      hidden={affiche !== o}
      onScroll={(e) => {
        positions.current[o] = e.currentTarget.scrollTop;
      }}
      className={PANNEAU}
    >
      {contenu}
      {apres}
    </div>
  );

  return (
    <div
      ref={(el) => {
        racine.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      data-testid="feuille"
      data-repliee={repliee || undefined}
      data-glisse={glisse || undefined}
      style={{ transform }}
      {...g.handlers}
      className={cn(
        'feuille-mobile absolute inset-x-0 bottom-0 flex flex-col rounded-t-sheet bg-card pb-(--marge-geste) shadow-feuille',
        avecFiche ? 'max-h-feuille' : ajout ? 'top-bande-carte z-3' : 'h-feuille',
        repliee && 'touch-none cursor-pointer', // repliée, toute la barre se touche et se glisse
      )}
    >
      {ajout ? (
        // Pendant l'ajout : la poignée seule au-dessus du champ, ni bouton ni glisser.
        <div className="flex shrink-0 justify-center px-4 pt-2 pb-2">
          <div className="h-rail w-poignee-feuille rounded-full bg-border" aria-hidden="true" />
        </div>
      ) : (
        // Tête : Ouverte (≈ 47 px, poignée et compte) · Repliée (`h-barre-feuille`, poignée et compte) · Fiche (poignée seule).
        // Un toucher et un glisser passent par `useGlisser` ; le clic ne sert qu'au clavier (`detail === 0`), sans double effet.
        <button
          ref={tete}
          type="button"
          data-prise=""
          aria-expanded={!repliee}
          aria-label={repliee ? 'Déplier la feuille' : 'Replier la feuille'}
          disabled={!pret}
          onClick={(e) => e.detail === 0 && changer(!repliee)}
          className={cn(
            'flex w-full shrink-0 touch-none cursor-pointer flex-col items-center gap-1 rounded-t-sheet px-4 pt-2 disabled:cursor-default',
            repliee ? 'h-barre-feuille' : avecFiche ? 'min-h-cible' : 'pb-2',
          )}
        >
          <span className="h-rail w-poignee-feuille shrink-0 rounded-full bg-border" aria-hidden="true" />
          {(repliee || !avecFiche) && (
            // Pendant le chargement, une espace insécable garde la hauteur de la ligne : le contenu ne saute pas à l'arrivée du compte.
            <span data-testid="compte-feuille" aria-hidden="true" className="max-w-full truncate text-valeur tabular-nums">
              {compte || '\u00a0'}
            </span>
          )}
        </button>
      )}
      <p role="status" className="sr-only">
        {annonce}
      </p>
      {/* Contenu : invisible feuille repliée (fin du repli), visible dès un dépli ou un glisser (src/index.css). */}
      <div className="feuille-contenu flex min-h-0 flex-1 flex-col">
        {affiche != null && !ajout && (
          <div role="tablist" className="mx-4 mb-2 flex h-toucher shrink-0 gap-1 rounded-full bg-background p-1">
            {ONGLETS.map(([o, nom]) => (
              <button
                key={o}
                ref={(el) => {
                  boutons.current[o] = el;
                }}
                type="button"
                role="tab"
                id={idOnglet(o)}
                aria-selected={onglet === o}
                aria-controls={idPanneau(o)}
                tabIndex={onglet === o ? 0 : -1}
                onClick={() => onOnglet(o)}
                onKeyDown={(e) => clavier(e, o)}
                className={cn(
                  'h-full flex-1 cursor-pointer whitespace-nowrap rounded-full px-3 text-texte-fort',
                  onglet === o ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                )}
              >
                {nom}
              </button>
            ))}
          </div>
        )}
        {/* Pendant l'ajout, de quoi faire défiler le champ jusqu'en haut même quand le contenu est court. */}
        {panneau('criteres', criteres, ajout && <div className="h-full" aria-hidden="true" />)}
        {panneau('liste', liste)}
        {avecFiche && <div className={PANNEAU}>{fiche}</div>}
      </div>
    </div>
  );
}
