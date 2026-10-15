import { useId } from 'react';
import { LIBELLE_TAILLE, LIBELLE_TYPE, resumeCadre } from '@/domain/format';
import { CHOIX_MER, type Reglages, type TypeEnv } from '@/domain/score';
import { ORDRE_TAILLES, ORDRE_TYPES } from '@/domain/url';
import { cn } from '@/lib/cn';
import { Categorie } from './Categorie';

// Catégorie « Cadre de vie » (spec cadre-de-vie, design F : docs/design/cadre-de-vie/README.md). Elle remplace les
// catégories « Mer » et « Taille de ville ». Groupes, dans l'ordre : « Taille de la commune » (Cases séparées, choix
// multiple, aria-pressed), « Type d'environnement » (Rangée qui défile, choix multiple, aria-pressed), puis « Proximité avec
// la nature », qui porte « Mer à moins de » et, dessous, « Montagne à moins de » (Cases collées, boutons à bascule
// exclusifs, D12). Noms pour les lecteurs d'écran : H76.

type Props = { reglages: Reglages; onChange: (r: Reglages) => void; disabled?: boolean };

/** Une case : libellé entier, centré, sur deux lignes au plus (espaces insécables dans les nombres, H3). */
const CASE =
  'flex min-h-toucher cursor-pointer items-center justify-center p-1 text-center text-pastille text-foreground tabular-nums disabled:cursor-default disabled:opacity-50';

/** Coche ou décoche `x` parmi `cochees` (taille, type) : le résultat suit l'ordre de l'adresse, `ordre`. */
const basculer = <T,>(ordre: T[], cochees: T[], x: T) => ordre.filter((y) => (y === x ? !cochees.includes(x) : cochees.includes(y)));

/** R28, R29, H69 (révisée par D12) : les distances, les mêmes pour la mer et la montagne ; aucune cochée = Peu importe. */
const CHOIX: { valeur: number; libelle: string }[] = [
  ...CHOIX_MER.map((d) => ({ valeur: d, libelle: `${d} km` })),
];

/**
 * Cases collées (contrat du système), révisées par D12 de cadre-de-vie : sans case « Peu importe ». Boutons à bascule
 * exclusifs (H76) : cocher une case décoche l'autre, toucher la case cochée la décoche (`null` = Peu importe). Au clavier,
 * Tab de case en case, comme les tailles.
 */
function CasesCollees({ titre, valeur, onChange, disabled }: { titre: string; valeur: number | null; onChange: (v: number | null) => void; disabled: boolean }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <span id={id} className="text-secondaire text-muted-foreground">
        {titre}
      </span>
      {/* Filets d'1 px : l'écart de la grille laisse voir le fond `border`. Pas d'`overflow-hidden` : il couperait le focus. */}
      <div role="group" aria-labelledby={id} className="grid grid-cols-4 gap-px rounded-chip border border-border bg-border">
        {CHOIX.map((c) => {
          const cochee = valeur === c.valeur;
          return (
            <button
              key={c.libelle}
              type="button"
              aria-pressed={cochee}
              disabled={disabled}
              onClick={() => onChange(cochee ? null : c.valeur)}
              className={cn(CASE, 'bg-card first:rounded-l-chip last:rounded-r-chip aria-pressed:bg-primary aria-pressed:text-primary-foreground')}
            >
              {c.libelle}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Coche des pastilles cochées de la rangée (contrat « Rangée qui défile ») : la couleur n'est pas le seul indice. */
function Coche() {
  return (
    <svg viewBox="0 0 24 24" className="size-echantillon shrink-0" aria-hidden="true">
      <path d="m5 12 5 5 9-10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Rangée qui défile (contrat du système, design F) : sous 1 024 px, une seule ligne qui défile sur le côté, bord à bord de
 * la feuille (la marge des réglages est rendue à l'intérieur), barre masquée ; en bureau, les pastilles passent à la ligne.
 * La marge verticale laisse la place au focus, que le défilement couperait sinon ; la marge de défilement (`scroll-px-4`)
 * garde une pastille atteinte au clavier à la même distance du bord que la première.
 */
function RangeeTypes({ types, onChange, disabled }: { types: TypeEnv[]; onChange: (t: TypeEnv[]) => void; disabled: boolean }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <span id={id} className="text-secondaire text-muted-foreground">
        Type d'environnement
      </span>
      <div
        role="group"
        aria-labelledby={id}
        className="flex gap-2 max-bureau:-mx-4 max-bureau:overflow-x-auto max-bureau:scroll-px-4 max-bureau:px-4 max-bureau:py-1 max-bureau:[scrollbar-width:none] bureau:flex-wrap"
      >
        {ORDRE_TYPES.map((t) => {
          const cochee = types.includes(t);
          return (
            <button
              key={t}
              type="button"
              aria-pressed={cochee}
              disabled={disabled}
              onClick={() => onChange(basculer(ORDRE_TYPES, types, t))}
              // Au clavier, une pastille à moitié visible prend le focus sans que Chromium la fasse défiler : on l'amène
              // entière dans la vue (avec la marge de défilement), sans bouger « Critères » plus que nécessaire.
              onFocus={(e) => e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' })}
              className="flex min-h-pastille shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-chip border border-border bg-card px-3 text-pastille text-foreground disabled:cursor-default disabled:opacity-50 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground max-bureau:min-h-toucher"
            >
              {cochee && <Coche />}
              {LIBELLE_TYPE[t]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CadreDeVie({ reglages, onChange, disabled = false }: Props) {
  const idTaille = useId();
  return (
    <Categorie titre="Cadre de vie" resume={resumeCadre(reglages)}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span id={idTaille} className="text-secondaire text-muted-foreground">
            Taille de la commune
          </span>
          {/* Cases séparées : 4 colonnes au téléphone, 2 × 2 en bureau (design F). */}
          <div role="group" aria-labelledby={idTaille} className="grid grid-cols-4 gap-2 bureau:grid-cols-2">
            {ORDRE_TAILLES.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={reglages.tailles.includes(t)}
                disabled={disabled}
                onClick={() => onChange({ ...reglages, tailles: basculer(ORDRE_TAILLES, reglages.tailles, t) })}
                className={cn(CASE, 'rounded-chip border border-border bg-card aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground')}
              >
                {LIBELLE_TAILLE[t]}
              </button>
            ))}
          </div>
        </div>
        <RangeeTypes types={reglages.types ?? []} onChange={(types) => onChange({ ...reglages, types })} disabled={disabled} />
        <div role="group" aria-label="Proximité avec la nature" className="flex flex-col gap-3">
          <CasesCollees titre="Mer à moins de" valeur={reglages.mer} onChange={(mer) => onChange({ ...reglages, mer })} disabled={disabled} />
          <CasesCollees
            titre="Montagne à moins de"
            valeur={reglages.montagne ?? null}
            onChange={(montagne) => onChange({ ...reglages, montagne })}
            disabled={disabled}
          />
        </div>
      </div>
    </Categorie>
  );
}
