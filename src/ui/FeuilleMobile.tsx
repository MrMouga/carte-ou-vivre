import { useId, useLayoutEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

// Feuille mobile, sous 1 024 px (interface-telephone : D3, D5, D9, R18 ; prototype F, Figma « Tête de feuille » et « Onglets
// de feuille »). En haut, la tête : la poignée et le compte (style `valeur`, une ligne). Puis deux onglets, « Critères » (au
// départ) et « Les 10 premières » ; un seul panneau affiché, les deux restent montés et chacun garde sa position de
// défilement. Une fiche ouverte prend la place des onglets et de leur contenu (D17 de loyer-mer), sous la poignée seule.
// Pendant l'ajout d'un proche, la feuille monte jusqu'à la bande de carte du haut (proches, Figma 27:1160) : la poignée
// seule au-dessus du champ, ni onglets ni compte.
// Le compte visible n'est pas lu par les lecteurs d'écran : l'unique zone annoncée de la page (`role=status`) est ici, à
// part, et reste vide sans plafond comme avant cette tranche.

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
};

const PANNEAU = 'min-h-0 flex-1 overflow-y-auto overscroll-contain';

export function FeuilleMobile({ ref, onglet, onOnglet, ajout, compte, annonce, criteres, liste, fiche }: Props) {
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
      ref={ref}
      data-testid="feuille"
      className={cn(
        'absolute inset-x-0 bottom-0 flex flex-col rounded-t-sheet bg-card shadow-feuille',
        avecFiche ? 'max-h-feuille' : ajout ? 'top-bande-carte z-3' : 'h-feuille',
      )}
    >
      {/* Tête (état Ouverte, ≈ 47 px) : la poignée et le compte ; poignée seule avec une fiche ou pendant l'ajout. */}
      <div className="flex shrink-0 flex-col items-center gap-1 px-4 pt-2 pb-2">
        <div className="h-rail w-poignee-feuille rounded-full bg-border" aria-hidden="true" />
        {!avecFiche && !ajout && (
          // Pendant le chargement, une espace insécable garde la hauteur de la ligne : le contenu ne saute pas à l'arrivée du compte.
          <p data-testid="compte-feuille" aria-hidden="true" className="max-w-full truncate text-valeur tabular-nums">
            {compte || '\u00a0'}
          </p>
        )}
      </div>
      <p role="status" className="sr-only">
        {annonce}
      </p>
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
  );
}
