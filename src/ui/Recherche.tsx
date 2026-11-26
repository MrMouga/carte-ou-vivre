import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { chercher, chercherCode, type IndexCodes, type IndexNoms } from '@/domain/recherche';
import { nomAffiche, population } from '@/domain/format';
import type { Commune } from '@/domain/score';
import { cn } from '@/lib/cn';

// Recherche d'une commune (spec recherche-et-mer, R58, R59, H177 à H186 ; design : piste C, captures F-*, contrat du
// système : Loupe, Champ de recherche, Suggestion de commune). En bureau, la loupe est à droite du titre et le champ prend
// sa place (Settings) ; au téléphone, la loupe est au bout de la rangée des onglets ou dans la tête de la feuille, et le
// champ remplace tout sous la poignée (FeuilleMobile). Le champ suit le modèle du champ du métier (Emploi.tsx) : combobox,
// `aria-activedescendant`, flèches et Entrée ; Échap ferme les suggestions, puis vide le champ (H186). Le nombre de
// suggestions est annoncé par une zone `aria-live` propre au champ (le rôle `status` est pris par le compte).

const NBSP = ' ';
const LIBELLE = 'Chercher une commune';
const MESSAGES = {
  aucune: 'Aucune commune ne correspond.',
  chargement: 'Chargement des codes postaux…',
  indisponible: 'Codes postaux indisponibles. Cherche par nom ou réessaie dans un moment.',
} as const;
/** Une suggestion : la commune, et par code postal le plus petit de ses codes qui correspondent (H183). */
type Suggestion = { commune: Commune; postal?: string };

/** La commune choisie par la recherche (H184) : le champ rouvert la montre tant qu'une autre n'est pas choisie ailleurs. */
export type ChoixRecherche = { code: string; texte: string };

function IconeLoupe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('shrink-0', className)} aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** Composant « Loupe » du contrat : ouvre le champ. `data-loupe` : App y rend le focus après « Annuler ». */
export function BoutonLoupe({ onClick, disabled, className }: { onClick: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      data-loupe=""
      aria-label={LIBELLE}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex size-toucher shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground hover:bg-background disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent',
        className,
      )}
    >
      <IconeLoupe className="size-goutte" />
    </button>
  );
}

type Props = {
  /** Index des noms (calculé une fois à l'arrivée des données) ; null pendant le chargement. */
  index: IndexNoms<Commune> | null;
  /** Codes postaux (H187) : leur index une fois arrivés, sinon leur état ; une saisie en chiffres montre le message de l'état. */
  codes: IndexCodes<Commune> | 'chargement' | 'indisponible';
  /** Chaque prise de focus du champ : la première demande les codes postaux, et une suivante les redemande s'ils sont indisponibles. */
  onFocus: () => void;
  /** Commune déjà choisie par la recherche : le champ s'ouvre sur elle (H184) ; null quand une autre a été choisie ailleurs. */
  choix: ChoixRecherche | null;
  onChoisir: (c: Commune) => void;
  /** « Effacer la recherche », ou Échap une seconde fois : le champ est vidé, la fiche reste ouverte (H184). */
  onEffacer: () => void;
  /** « Annuler », ou Échap dans le champ vide : le champ se ferme, le focus revient à la loupe (App). */
  onAnnuler: () => void;
  /** États chargement et erreur de la page (H188). */
  disabled: boolean;
  className?: string;
};

/**
 * Composant « Champ de recherche » et ses suggestions. Il prend le focus à son montage, dans le rendu même qui l'a placé
 * (`useLayoutEffect`) : au téléphone, la feuille est déjà montée et le champ à sa place quand le focus arrive (leçons
 * 2026-10-13 « feuille qui monte au focus » et « iOS clavier : champ à sa place avant le focus »).
 */
export function Recherche({ index, codes, onFocus, choix, onChoisir, onEffacer, onAnnuler, disabled, className }: Props) {
  const id = useId();
  const idListe = `${id}-suggestions`;
  const champ = useRef<HTMLInputElement>(null);
  const liste = useRef<HTMLUListElement>(null);
  const [texte, setTexte] = useState(choix?.texte ?? '');
  const [fermee, setFermee] = useState(false);
  const [actif, setActif] = useState(0);

  useLayoutEffect(() => {
    champ.current?.focus({ preventScroll: true });
  }, []);
  // H184 : une commune choisie ailleurs (carte, liste) vide le champ qui la montrait.
  const avant = useRef(choix);
  useEffect(() => {
    const c = avant.current;
    avant.current = choix;
    if (c && !choix) setTexte((t) => (t === c.texte ? '' : t));
  }, [choix]);

  // État « choisie » : le champ montre la commune choisie, sans suggestion.
  const estChoisie = choix != null && texte === choix.texte;
  const r = index && !estChoisie ? chercher(index, texte) : null;
  // 2 à 5 chiffres : par code postal, une fois les codes arrivés ; avant, le message de leur état (H187).
  const rc = r?.etat === 'code' && typeof codes === 'object' ? chercherCode(codes, r.chiffres) : null;
  const suggestions: Suggestion[] =
    r?.etat === 'suggestions' ? r.communes.map((commune) => ({ commune })) : rc?.etat === 'postaux' ? rc.suggestions : [];
  const message =
    r?.etat === 'aucune' || rc?.etat === 'aucune' ? MESSAGES.aucune : r?.etat === 'code' && typeof codes === 'string' ? MESSAGES[codes] : null;
  const ouverte = !fermee && suggestions.length > 0;
  const avecMessage = !fermee && message != null;
  const annonce = ouverte ? `${suggestions.length}${NBSP}suggestion${suggestions.length > 1 ? 's' : ''}` : avecMessage ? message : '';

  const choisir = (c: Commune) => {
    setTexte(nomAffiche(c));
    setFermee(true);
    setActif(0);
    onChoisir(c);
  };
  const effacer = () => {
    setTexte('');
    setFermee(false);
    setActif(0);
    onEffacer();
    champ.current?.focus();
  };
  // Aux flèches, la suggestion en surbrillance vient dans la vue (le navigateur ne fait pas défiler pour
  // `aria-activedescendant`) : la liste défile au-delà de `taille-liste-suggestions`.
  const surligner = (i: number) => {
    setActif(i);
    liste.current?.children[i]?.scrollIntoView({ block: 'nearest' });
  };

  return (
    <div className={cn('flex min-h-0 flex-col gap-1', className)}>
      <div className="flex shrink-0 items-center gap-2">
        <div className="relative flex min-w-0 flex-1 items-center">
          <IconeLoupe className="pointer-events-none absolute left-2 size-echantillon text-muted-foreground" />
          <input
            ref={champ}
            id={id}
            type="text"
            role="combobox"
            aria-label={LIBELLE}
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={ouverte}
            aria-controls={idListe}
            aria-activedescendant={ouverte ? `${idListe}-${actif}` : undefined}
            placeholder="Nom ou code postal"
            value={texte}
            disabled={disabled}
            onFocus={() => {
              setFermee(false);
              onFocus();
            }}
            // Les suggestions se ferment quand le champ perd le focus (decisions.md de la tranche).
            onBlur={() => setFermee(true)}
            onChange={(e) => {
              setTexte(e.target.value);
              setFermee(false);
              setActif(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' && suggestions.length) {
                if (!ouverte) setFermee(false);
                else surligner(Math.min(actif + 1, suggestions.length - 1));
              } else if (e.key === 'ArrowUp' && ouverte) surligner(Math.max(actif - 1, 0));
              else if (e.key === 'Enter' && ouverte && suggestions[actif]) choisir(suggestions[actif].commune);
              else if (e.key === 'Escape') {
                if (ouverte || avecMessage) setFermee(true);
                else if (texte) effacer();
                else onAnnuler();
              } else return;
              e.preventDefault();
            }}
            className="w-full rounded-base border border-border bg-card py-1 pr-8 pl-8 text-texte text-foreground placeholder:text-muted-foreground disabled:opacity-50 max-bureau:min-h-toucher max-bureau:text-(length:--taille-saisie) bureau:min-h-pastille"
          />
          {texte && (
            <button
              type="button"
              aria-label="Effacer la recherche"
              // Garde le focus dans le champ pendant l'appui (sur iPhone, il le perdrait avant le clic).
              onMouseDown={(e) => e.preventDefault()}
              onClick={effacer}
              disabled={disabled}
              className="absolute right-0 flex h-full w-toucher cursor-pointer items-center justify-center rounded-base text-muted-foreground hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" className="size-echantillon" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        <button type="button" onClick={onAnnuler} className="min-h-cible shrink-0 cursor-pointer rounded-base px-1 text-texte-fort text-foreground max-bureau:min-h-toucher">
          Annuler
        </button>
      </div>
      {/* Toujours présente : le nombre de suggestions (lu seulement) ou le message (affiché à la place des suggestions). */}
      <p aria-live="polite" className={avecMessage ? 'shrink-0 rounded-base border border-border bg-card p-2 text-texte text-foreground' : 'sr-only'}>
        {annonce}
      </p>
      <ul
        ref={liste}
        id={idListe}
        role="listbox"
        aria-label="Suggestions de communes"
        hidden={!ouverte}
        // Garde le focus dans le champ pendant l'appui sur une suggestion ou sur la barre de défilement : sur iPhone, il le
        // perdrait avant le clic, et la liste se fermerait.
        onMouseDown={(e) => e.preventDefault()}
        className="flex max-h-liste-suggestions min-h-0 flex-col overflow-y-auto overscroll-contain rounded-base border border-border bg-card"
      >
        {suggestions.map(({ commune: c, postal }, i) => (
          <li
            key={c.code}
            id={`${idListe}-${i}`}
            role="option"
            aria-selected={i === actif}
            onClick={() => choisir(c)}
            className={cn(
              'flex shrink-0 cursor-pointer flex-col justify-center border-b border-border px-2 py-1 last:border-b-0 hover:bg-background max-bureau:min-h-toucher',
              i === actif && 'bg-background',
            )}
          >
            {/* Nom accessible de l'option : « Grandeville (33) », ou par code « 33991 · Grandeville (33) » (H183) ; la
                population est une aide visuelle seulement. */}
            <span className="text-texte text-foreground">
              {postal && <span className="text-muted-foreground tabular-nums">{postal} · </span>}
              <span className="text-texte-fort">{c.nom}</span> ({c.dep})
            </span>
            {c.population != null && (
              <span aria-hidden="true" className="text-secondaire text-muted-foreground tabular-nums">
                {population(c.population)}
                {NBSP}habitants
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
