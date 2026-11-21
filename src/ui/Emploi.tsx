import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { chercherMetiers, MIN_CARACTERES_METIER, type Metier } from '@/domain/emploi';
import { resumeEmploi } from '@/domain/format';
import type { MetierChoisi, Niveau, Reglages } from '@/domain/score';
import { layout } from '@/theme/tokens';
import { cn } from '@/lib/cn';
import { Categorie } from './Categorie';

// Catégorie « Emploi » (spec emploi, R44, R50, H129 à H133, H147 ; design F : docs/design/emploi/README.md), entre « Vie
// locale » et « Tes proches » (H129). Sans métier : le champ « Ton métier », qui propose dès 2 caractères (H133). Un métier
// choisi (composant « Métier choisi » du contrat) : libellé et « Retirer » sur la même ligne ; la phrase de H147 s'il est
// peu chiffré ; « Où ce métier recrute le plus » et ses Cases collées en 3 colonnes (boutons à bascule exclusifs, la cochée
// se décoche, D12 de cadre-de-vie) ; tant qu'aucune n'est cochée, la phrase « Coche un niveau… » (H130). Toujours en bas,
// la phrase de D13. Pendant le chargement, tout est désactivé (les métiers de l'adresse s'affichent à l'arrivée
// d'emploi.json, qui donne leurs libellés).

type Props = {
  reglages: Reglages;
  onChange: (r: Reglages) => void;
  /** Les métiers d'emploi.json, par code ; null pendant le chargement. */
  catalogue: ReadonlyMap<string, Metier> | null;
  disabled?: boolean;
};

const NIVEAUX: { code: Niveau; libelle: string }[] = [
  { code: '10', libelle: '10 %' },
  { code: '25', libelle: '25 %' },
  { code: 'tous', libelle: 'Partout où il recrute' },
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

/** Réglages avec `metiers` ; aucun métier : le champ facultatif est retiré (plan, « Le réglage »). */
function avecMetiers(r: Reglages, metiers: MetierChoisi[]): Reglages {
  const { metiers: _, ...reste } = r;
  return metiers.length ? { ...reste, metiers } : reste;
}

/**
 * Champ à suggestions (R44, H133) : liste des libellés sous le champ (Suggestion d'adresse des proches, une ligne par
 * libellé, qui passe à la ligne). Au clavier : flèches pour changer de suggestion, Entrée pour choisir, Échap pour vider.
 */
function ChampMetier({ libelle, catalogue, exclus, onChoix, disabled, champ }: {
  libelle: string;
  catalogue: ReadonlyMap<string, Metier> | null;
  exclus: string[];
  onChoix: (m: Metier) => void;
  disabled: boolean;
  champ: React.RefObject<HTMLInputElement | null>;
}) {
  const [texte, setTexte] = useState('');
  const [actif, setActif] = useState(0);
  const id = useId();
  const idListe = `${id}-suggestions`;
  const liste = useRef<HTMLUListElement>(null);
  const label = useRef<HTMLLabelElement>(null);
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
  return (
    <div className="flex flex-col gap-1">
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
          if (e.key === 'ArrowDown' && ouverte) setActif((a) => Math.min(a + 1, suggestions.length - 1));
          else if (e.key === 'ArrowUp' && ouverte) setActif((a) => Math.max(a - 1, 0));
          else if (e.key === 'Enter' && suggestions[actif]) choisir(suggestions[actif]);
          else if (e.key === 'Escape' && texte) {
            setTexte('');
            setActif(0);
          } else return;
          e.preventDefault();
        }}
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
          Où ce métier recrute le plus
        </span>
        {/* Filets d'1 px : l'écart de la grille laisse voir le fond `border`. Pas d'`overflow-hidden` : il couperait le focus. */}
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
                className="flex min-h-toucher cursor-pointer items-center justify-center bg-card p-1 text-center text-pastille text-foreground first:rounded-l-chip last:rounded-r-chip disabled:cursor-default disabled:opacity-50 aria-pressed:bg-primary aria-pressed:text-primary-foreground"
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

export function Emploi({ reglages, onChange, catalogue, disabled = false }: Props) {
  // Les métiers de l'adresse ne s'affichent qu'une fois leurs libellés connus (emploi.json chargé).
  const choisis = (reglages.metiers ?? []).flatMap((c) => {
    const metier = catalogue?.get(c.code);
    return metier ? [{ ...c, metier }] : [];
  });
  const exclus = choisis.map((c) => c.code);
  const champ = useRef<HTMLInputElement>(null);
  const premieresCases = useRef(new Map<string, HTMLButtonElement>());
  const retirers = useRef(new Map<string, HTMLButtonElement>());
  // Où va le focus après le rendu : la première case d'un métier qui arrive (design F, WCAG 2.4.3 : le champ disparaît),
  // ou, après « Retirer », le champ s'il revient, sinon le premier élément du métier restant (décidé par Claude).
  const focus = useRef<{ case: string } | { retirer: string } | 'champ' | null>(null);
  useEffect(() => {
    const f = focus.current;
    focus.current = null;
    if (f === 'champ') champ.current?.focus();
    else if (f && 'case' in f) premieresCases.current.get(f.case)?.focus();
    else if (f && 'retirer' in f) retirers.current.get(f.retirer)?.focus();
  });

  const ecrire = (metiers: MetierChoisi[]) => onChange(avecMetiers(reglages, metiers));
  const choisir = (m: Metier) => {
    focus.current = { case: m.code };
    ecrire([...(reglages.metiers ?? []), { code: m.code, niveau: null }]);
  };
  const retirer = (code: string) => {
    const restants = (reglages.metiers ?? []).filter((c) => c.code !== code);
    const restant = choisis.find((c) => c.code !== code);
    focus.current = restant ? { retirer: restant.code } : 'champ';
    ecrire(restants);
  };
  const regler = (code: string, niveau: Niveau | null) => ecrire((reglages.metiers ?? []).map((c) => (c.code === code ? { ...c, niveau } : c)));

  return (
    <Categorie titre="Emploi" resume={resumeEmploi(reglages)}>
      <div className="flex flex-col gap-3">
        {choisis.length === 0 ? (
          <ChampMetier libelle="Ton métier" catalogue={catalogue} exclus={exclus} onChoix={choisir} disabled={disabled} champ={champ} />
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
        {/* Le second champ (« Second métier ») vient en tâche 4 ; le lien est affiché dès maintenant (plan, tâche 3a). */}
        {choisis.length === 1 && (
          <Button variant="lien" className={`self-start ${TOUCHER}`} disabled={disabled}>
            + Ajouter un second métier
          </Button>
        )}
        <p className="text-secondaire text-muted-foreground">{ETAT}</p>
      </div>
    </Categorie>
  );
}
