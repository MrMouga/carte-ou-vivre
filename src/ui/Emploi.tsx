import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button } from '@/components/ui/button';
import { chercherMetiers, MIN_CARACTERES_METIER, type Metier } from '@/domain/emploi';
import { resumeEmploi } from '@/domain/format';
import { avecMetiers, type MetierChoisi, type Niveau, type Reglages } from '@/domain/score';
import { geste, layout } from '@/theme/tokens';
import { cn } from '@/lib/cn';
import { Categorie } from './Categorie';

// Catégorie « Emploi » (spec emploi, R44, R50, H129 à H133, H147 ; design F : docs/design/emploi/README.md), entre « Vie
// locale » et « Tes proches » (H129). Sans métier : le champ « Ton métier », qui propose dès 2 caractères (H133). Un métier
// choisi (composant « Métier choisi » du contrat) : libellé et « Retirer » sur la même ligne ; la phrase de H147 s'il est
// peu chiffré ; « Où ce métier recrute » et ses Cases collées en 3 colonnes, du plus large au plus étroit (D15 : « Partout »,
// « Beaucoup », « Le plus » ; boutons à bascule exclusifs, la cochée se décoche, D12 de cadre-de-vie) ; tant qu'aucune n'est
// cochée, la phrase « Coche un niveau… » (H130). Toujours en bas,
// la phrase de D13. Pendant le chargement, tout est désactivé (les métiers de l'adresse s'affichent à l'arrivée
// d'emploi.json, qui donne leurs libellés).
// Avec un métier, « + Ajouter un second métier » ouvre le champ « Second métier » à sa place (état « ajout en cours ») ;
// Échap le referme et le vide ; quitté, il reste ouvert avec son texte (H145).
// Sous 1 024 px, chaque champ de métier suit la règle du champ d'adresse des proches (R20 d'interface-telephone, leçons
// 2026-10-13-feuille-qui-monte-au-focus et 2026-10-13-ios-clavier-champ-deplace-apres-focus) : tant qu'il a le focus, la
// feuille monte (App) ; elle monte et le champ se place sous la poignée *avant* le focus, que le focus vienne du doigt,
// du lien ou de « Retirer ».

type Props = {
  reglages: Reglages;
  onChange: (r: Reglages) => void;
  /** Les métiers d'emploi.json, par code ; null pendant le chargement. */
  catalogue: ReadonlyMap<string, Metier> | null;
  disabled?: boolean;
  /** Le focus entre dans un champ de métier ou en sort (390 px : la feuille monte, App). */
  onAjout?: (actif: boolean) => void;
  /** 390 px : la feuille est montée pour un champ de métier (App, en réponse à `onAjout`). */
  monte?: boolean;
};

// D15 (H131 révisée) : mêmes niveaux, même adresse ; la fiche dit ce que « Beaucoup » (25 %) et « Le plus » (10 %) veulent dire.
const NIVEAUX: { code: Niveau; libelle: string }[] = [
  { code: 'tous', libelle: 'Partout' },
  { code: '25', libelle: 'Beaucoup' },
  { code: '10', libelle: 'Le plus' },
];
const ETAT = "Les emplois de l'État (enseignants du public, fonctionnaires) ne sont pas dans l'enquête.";
const INDICE = 'Coche un niveau pour garder les communes proches de ces bassins.';
const PEU_CHIFFRE = 'Chiffré dans peu de bassins : la carte en oublie sûrement.';

// Comme le champ d'adresse des proches : 44 px de haut et 16 px de texte sous 1 024 px (sinon Safari sur iPhone agrandit
// la page au focus).
const CHAMP =
  'w-full rounded-base border border-border bg-card px-2 py-1 text-texte text-foreground disabled:opacity-50 max-bureau:min-h-toucher max-bureau:text-(length:--taille-saisie)';
const TOUCHER = 'max-bureau:min-h-toucher';
const enBureau = () => innerWidth >= layout['largeur-bureau'];

/**
 * Champ à suggestions (R44, H133) : liste des libellés sous le champ (Suggestion d'adresse des proches, une ligne par
 * libellé, qui passe à la ligne). Au clavier : flèches pour changer de suggestion, Entrée pour choisir, Échap pour vider
 * (ou, avec `onEchap`, pour refermer le champ : « Second métier »).
 */
function ChampMetier({ libelle, catalogue, exclus, onChoix, onEchap, disabled, focus = false, monte, onAjout }: {
  libelle: string;
  catalogue: ReadonlyMap<string, Metier> | null;
  exclus: string[];
  onChoix: (m: Metier) => void;
  onEchap?: () => void;
  disabled: boolean;
  /** Le champ s'ouvre avec le focus (lien du second métier, « Retirer » du dernier métier). */
  focus?: boolean;
  monte: boolean;
  onAjout?: (actif: boolean) => void;
}) {
  const [texte, setTexte] = useState('');
  const [actif, setActif] = useState(0);
  const id = useId();
  const idListe = `${id}-suggestions`;
  const champ = useRef<HTMLInputElement>(null);
  const liste = useRef<HTMLUListElement>(null);
  const label = useRef<HTMLLabelElement>(null);
  const bloc = useRef<HTMLDivElement>(null);
  // 390 px : la feuille montée (App), le bloc défile en haut de l'onglet, sous la poignée, dans le rendu même qui monte la
  // feuille (`useLayoutEffect`), avant que le champ ait le focus : Safari sur iPhone note la place du champ au début du
  // focus et fait glisser la page pour la centrer au-dessus du clavier (leçon 2026-10-13-ios-clavier…). Ouvert avec le
  // focus demandé (lien, « Retirer ») : le focus vient seulement maintenant, champ déjà en place. `scroll-mt-1` : comme
  // le champ d'adresse des proches, rien de coupé sous la poignée.
  useLayoutEffect(() => {
    if (!monte) return;
    if (!enBureau()) bloc.current?.scrollIntoView({ block: 'start' });
    if (focus && !bloc.current?.contains(document.activeElement)) champ.current?.focus();
  }, [monte]);
  // Au montage : focus demandé ou déjà dans le bloc (rendu de nouveau en mode strict) → la feuille monte ; au démontage
  // (métier choisi, champ refermé), elle redescend, même si le navigateur n'annonce pas la perte du focus.
  useEffect(() => {
    if (focus || bloc.current?.contains(document.activeElement)) onAjout?.(true);
    return () => onAjout?.(false);
  }, []); // au montage seulement
  const entrer = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget)) onAjout?.(true);
  };
  const sortir = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget)) onAjout?.(false);
  };
  // 390 px, toucher du champ, feuille pas encore montée : au relâchement du doigt, on annule le focus du navigateur, on
  // monte et on place la feuille tout de suite (`flushSync` : rendu et `useLayoutEffect` ci-dessus), puis on donne le
  // focus, champ déjà à sa place ; dans un `touchend`, iOS ouvre le clavier. Un doigt qui a bougé (défilement) garde le
  // comportement du navigateur. Même code que le champ d'adresse des proches (Proches.tsx).
  const toucher = useRef<{ x: number; y: number } | null>(null);
  const toucherDebut = (e: React.TouchEvent) => {
    const t = e.touches[0];
    toucher.current = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
  };
  const toucherFin = (e: React.TouchEvent<HTMLInputElement>) => {
    const debut = toucher.current;
    toucher.current = null;
    const t = e.changedTouches[0];
    if (!debut || !t || monte || enBureau() || disabled || !e.cancelable) return;
    if (Math.hypot(t.clientX - debut.x, t.clientY - debut.y) >= geste['seuil-toucher']) return;
    e.preventDefault();
    flushSync(() => onAjout?.(true));
    e.currentTarget.focus({ preventScroll: true });
  };
  const suggestions = catalogue ? chercherMetiers(catalogue.values(), texte, exclus) : [];
  const aucun = !!catalogue && texte.replace(/\s/g, '').length >= MIN_CARACTERES_METIER && suggestions.length === 0;
  const ouverte = suggestions.length > 0;
  // Bureau : le panneau défile ; des suggestions qui tombent sous le compte collé en bas font monter le champ en haut du
  // panneau, pour laisser la place à la liste (8 libellés au plus, parfois sur deux lignes).
  useEffect(() => {
    if (!ouverte || !enBureau() || !liste.current) return;
    const panneau = liste.current.closest('section');
    const bas = (panneau?.querySelector('[role="status"]') ?? panneau)?.getBoundingClientRect().top;
    if (bas != null && liste.current.getBoundingClientRect().bottom > bas) label.current?.scrollIntoView({ block: 'start' });
  }, [ouverte, suggestions.length]);
  const choisir = (m: Metier) => {
    setTexte('');
    setActif(0);
    onChoix(m);
  };
  // H148 : aux flèches, la suggestion en surbrillance vient dans la vue (le navigateur ne fait pas défiler pour
  // `aria-activedescendant`) ; en bureau, au-dessus du compte collé en bas du panneau, qui en couvre le bas.
  const surligner = (i: number) => {
    setActif(i);
    const o = liste.current?.children[i];
    if (!o) return;
    o.scrollIntoView({ block: 'nearest' });
    if (!enBureau()) return;
    const panneau = o.closest('section');
    const bas = panneau?.querySelector('[role="status"]')?.getBoundingClientRect().top;
    if (bas != null && o.getBoundingClientRect().bottom > bas) panneau!.scrollBy({ top: o.getBoundingClientRect().bottom - bas });
  };
  return (
    <div ref={bloc} onFocus={entrer} onBlur={sortir} className="flex flex-col gap-1 max-bureau:scroll-mt-1">
      <label ref={label} htmlFor={id} className="text-secondaire text-muted-foreground">
        {libelle}
      </label>
      <input
        id={id}
        ref={champ}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={ouverte}
        aria-controls={idListe}
        aria-activedescendant={ouverte ? `${idListe}-${actif}` : undefined}
        value={texte}
        disabled={disabled}
        onChange={(e) => {
          setTexte(e.target.value);
          setActif(0);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && ouverte) surligner(Math.min(actif + 1, suggestions.length - 1));
          else if (e.key === 'ArrowUp' && ouverte) surligner(Math.max(actif - 1, 0));
          else if (e.key === 'Enter' && suggestions[actif]) choisir(suggestions[actif]);
          else if (e.key === 'Escape' && onEchap) onEchap();
          else if (e.key === 'Escape' && texte) {
            setTexte('');
            setActif(0);
          } else return;
          e.preventDefault();
        }}
        onTouchStart={toucherDebut}
        onTouchEnd={toucherFin}
        className={CHAMP}
      />
      {/* Toujours présent, pour que les lecteurs d'écran lisent le message (sans le rôle `status`, pris par le compte). */}
      <p aria-live="polite" className={aucun ? 'text-texte text-foreground' : 'sr-only'}>
        {aucun && 'Aucun métier trouvé'}
      </p>
      <ul
        ref={liste}
        id={idListe}
        role="listbox"
        aria-label="Suggestions de métiers"
        hidden={!ouverte}
        className="flex flex-col rounded-base border border-border bg-card shadow-panneau"
      >
        {suggestions.map((m, i) => (
          <li
            key={m.code}
            id={`${idListe}-${i}`}
            role="option"
            aria-selected={i === actif}
            // Garde le focus dans le champ : sur iPhone, il le perdrait avant le clic.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choisir(m)}
            className={cn('flex cursor-pointer rounded-base p-2 text-left text-texte text-foreground hover:bg-background max-bureau:min-h-toucher max-bureau:items-center max-bureau:py-1', i === actif && 'bg-background')}
          >
            {m.libelle}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Composant « Métier choisi » du contrat (design F). */
function MetierLigne({ metier, niveau, premier, disabled, onNiveau, onRetirer, refRetirer, refPremiereCase }: {
  metier: Metier;
  niveau: Niveau | null;
  premier: boolean;
  disabled: boolean;
  onNiveau: (n: Niveau | null) => void;
  onRetirer: () => void;
  refRetirer: (b: HTMLButtonElement | null) => void;
  refPremiereCase: (b: HTMLButtonElement | null) => void;
}) {
  const idLibelle = useId();
  const idTitre = useId();
  const idPeu = useId();
  const idIndice = useId();
  // H147 et H130 : le groupe des niveaux est décrit par l'avertissement du métier peu chiffré, puis par la phrase
  // « Coche un niveau… » tant que rien n'est coché.
  const decrit = [metier.peuChiffre && idPeu, niveau == null && idIndice].filter(Boolean).join(' ') || undefined;
  return (
    <li className={cn('flex flex-col gap-2', !premier && 'border-t border-border pt-3')}>
      <div className="flex items-baseline justify-between gap-2">
        <span id={idLibelle} className="min-w-0 text-texte-fort break-words">
          {metier.libelle}
        </span>
        <Button ref={refRetirer} variant="lien" className={`shrink-0 ${TOUCHER}`} aria-label={`Retirer ${metier.libelle}`} disabled={disabled} onClick={onRetirer}>
          Retirer
        </Button>
      </div>
      {metier.peuChiffre && (
        <p id={idPeu} className="text-secondaire text-muted-foreground">
          {PEU_CHIFFRE}
        </p>
      )}
      <div className="flex flex-col gap-1">
        <span id={idTitre} className="text-secondaire text-muted-foreground">
          Où ce métier recrute
        </span>
        {/* Filets d'1 px : l'écart de la grille laisse voir le fond `border`. Pas d'`overflow-hidden` : il couperait le focus.
            La case focalisée passe devant ses voisines (`relative`, `z-1`), sinon la suivante couvre le côté droit de son
            anneau (H148). */}
        <div role="group" aria-labelledby={`${idTitre} ${idLibelle}`} aria-describedby={decrit} className="grid grid-cols-3 gap-px rounded-chip border border-border bg-border">
          {NIVEAUX.map((n, k) => {
            const cochee = niveau === n.code;
            return (
              <button
                key={n.code}
                ref={k === 0 ? refPremiereCase : undefined}
                type="button"
                aria-pressed={cochee}
                disabled={disabled}
                onClick={() => onNiveau(cochee ? null : n.code)}
                className="relative flex min-h-toucher cursor-pointer items-center justify-center bg-card p-1 text-center text-pastille text-foreground first:rounded-l-chip last:rounded-r-chip focus-visible:z-1 disabled:cursor-default disabled:opacity-50 aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              >
                {n.libelle}
              </button>
            );
          })}
        </div>
        {niveau == null && (
          <p id={idIndice} className="text-secondaire text-muted-foreground">
            {INDICE}
          </p>
        )}
      </div>
    </li>
  );
}

export function Emploi({ reglages, onChange, catalogue, disabled = false, onAjout, monte = false }: Props) {
  // Les métiers de l'adresse ne s'affichent qu'une fois leurs libellés connus (emploi.json chargé).
  const choisis = (reglages.metiers ?? []).flatMap((c) => {
    const metier = catalogue?.get(c.code);
    return metier ? [{ ...c, metier }] : [];
  });
  const exclus = choisis.map((c) => c.code);
  const lien = useRef<HTMLButtonElement>(null);
  // État « ajout en cours » : le champ « Second métier » est ouvert (lien), jusqu'à un choix, Échap ou « Retirer ».
  const [second, setSecond] = useState(false);
  // « Ton métier » revient après « Retirer » du dernier métier : il s'ouvre avec le focus, la feuille montée d'abord (390 px).
  const [champAvecFocus, setChampAvecFocus] = useState(false);
  const premieresCases = useRef(new Map<string, HTMLButtonElement>());
  const retirers = useRef(new Map<string, HTMLButtonElement>());
  // Où va le focus après le rendu : la première case d'un métier qui arrive (design F, WCAG 2.4.3 : le champ disparaît) ;
  // après « Retirer », le premier élément du métier restant (décidé par Claude) ; après Échap dans « Second métier », le
  // lien qui l'avait ouvert. Le champ « Ton métier » qui revient prend le focus lui-même (`focus` de ChampMetier).
  const focus = useRef<{ case: string } | { retirer: string } | 'lien' | null>(null);
  // La demande attend que sa cible existe : un rendu venu d'une autre mise à jour de la page peut passer avant celui qui
  // ajoute le métier (vu une fois sur 20 environ à 390 px, tâche 4), et la consommerait sans rien trouver.
  useEffect(() => {
    const f = focus.current;
    if (!f) return;
    const cible = f === 'lien' ? lien.current : 'case' in f ? premieresCases.current.get(f.case) : retirers.current.get(f.retirer);
    if (!cible) return;
    focus.current = null;
    cible.focus();
  });

  const ecrire = (metiers: MetierChoisi[]) => onChange(avecMetiers(reglages, metiers));
  // Un choix ferme le champ : la feuille redescend dans le même rendu que le métier ajouté, pour que le focus aille sur
  // la première case, « Partout », dans la feuille redescendue (et que le navigateur l'y fasse voir).
  const choisir = (m: Metier) => {
    focus.current = { case: m.code };
    onAjout?.(false);
    setSecond(false);
    setChampAvecFocus(false);
    ecrire([...(reglages.metiers ?? []), { code: m.code, niveau: null }]);
  };
  const retirer = (code: string) => {
    const restants = (reglages.metiers ?? []).filter((c) => c.code !== code);
    const restant = choisis.find((c) => c.code !== code);
    setSecond(false);
    if (restant) focus.current = { retirer: restant.code };
    else {
      // Plus de métier : « Ton métier » revient avec le focus ; la feuille monte avant le montage du champ (390 px).
      setChampAvecFocus(true);
      onAjout?.(true);
    }
    ecrire(restants);
  };
  const ouvrirSecond = () => {
    setSecond(true);
    onAjout?.(true); // la feuille monte avant le montage du champ, qui prend le focus une fois placé
  };
  const fermerSecond = () => {
    focus.current = 'lien';
    onAjout?.(false); // dans le même rendu que le lien qui revient : il prend le focus dans la feuille redescendue
    setSecond(false);
  };
  const regler = (code: string, niveau: Niveau | null) => ecrire((reglages.metiers ?? []).map((c) => (c.code === code ? { ...c, niveau } : c)));

  return (
    <Categorie titre="Emploi" resume={resumeEmploi(reglages)}>
      <div className="flex flex-col gap-3">
        {choisis.length === 0 ? (
          <ChampMetier
            libelle="Ton métier"
            catalogue={catalogue}
            exclus={exclus}
            onChoix={choisir}
            disabled={disabled}
            focus={champAvecFocus}
            monte={monte}
            onAjout={onAjout}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {choisis.map((c, i) => (
              <MetierLigne
                key={c.code}
                metier={c.metier}
                niveau={c.niveau}
                premier={i === 0}
                disabled={disabled}
                onNiveau={(n) => regler(c.code, n)}
                onRetirer={() => retirer(c.code)}
                refRetirer={(b) => (b ? retirers.current.set(c.code, b) : retirers.current.delete(c.code))}
                refPremiereCase={(b) => (b ? premieresCases.current.set(c.code, b) : premieresCases.current.delete(c.code))}
              />
            ))}
          </ul>
        )}
        {/* Un métier : le lien, ou à sa place le champ « Second métier » (état « ajout en cours », design F-cat-ajout). */}
        {choisis.length === 1 &&
          (second ? (
            <ChampMetier
              libelle="Second métier"
              catalogue={catalogue}
              exclus={exclus}
              onChoix={choisir}
              onEchap={fermerSecond}
              disabled={disabled}
              focus
              monte={monte}
              onAjout={onAjout}
            />
          ) : (
            <Button ref={lien} variant="lien" className={`self-start ${TOUCHER}`} disabled={disabled} onClick={ouvrirSecond}>
              + Ajouter un second métier
            </Button>
          ))}
        <p className="text-secondaire text-muted-foreground">{ETAT}</p>
      </div>
    </Categorie>
  );
}
