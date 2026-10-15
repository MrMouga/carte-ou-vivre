import { useId, useRef } from 'react';
import { LIBELLE_TAILLE, resumeCadre } from '@/domain/format';
import { CHOIX_MER, type Reglages, type Taille } from '@/domain/score';
import { ORDRE_TAILLES } from '@/domain/url';
import { cn } from '@/lib/cn';
import { Categorie } from './Categorie';

// Catégorie « Cadre de vie » (spec cadre-de-vie, design F : docs/design/cadre-de-vie/README.md). Elle remplace les
// catégories « Mer » et « Taille de ville ». Groupes, dans l'ordre : « Taille de la commune » (Cases séparées, choix
// multiple, aria-pressed), puis « Proximité avec la nature », qui porte « Mer à moins de » (Cases collées, boutons radio).
// Le type d'environnement et la montagne viennent aux tâches 4 et 5. Noms pour les lecteurs d'écran : H76.

type Props = { reglages: Reglages; onChange: (r: Reglages) => void; disabled?: boolean };

/** Une case : libellé entier, centré, sur deux lignes au plus (espaces insécables dans les nombres, H3). */
const CASE =
  'flex min-h-toucher cursor-pointer items-center justify-center p-1 text-center text-pastille text-foreground tabular-nums disabled:cursor-default disabled:opacity-50';

/** R28, H69 : « Peu importe » puis les distances ; `null` = Peu importe. */
const CHOIX: { valeur: number | null; libelle: string }[] = [
  { valeur: null, libelle: 'Peu importe' },
  ...CHOIX_MER.map((d) => ({ valeur: d, libelle: `${d} km` })),
];

/**
 * Cases collées (contrat du système) : un `radiogroup` de `role=radio`, cochée = `aria-checked`. Clavier du motif « groupe
 * de boutons radio » : seule la case cochée entre dans l'ordre de tabulation, les flèches passent à la voisine et la cochent.
 */
function CasesCollees({ titre, valeur, onChange, disabled }: { titre: string; valeur: number | null; onChange: (v: number | null) => void; disabled: boolean }) {
  const id = useId();
  const cases = useRef<(HTMLButtonElement | null)[]>([]);
  const choisir = (i: number) => {
    const n = (i + CHOIX.length) % CHOIX.length;
    onChange(CHOIX[n].valeur);
    cases.current[n]?.focus();
  };
  const fleche = (e: React.KeyboardEvent, i: number) => {
    const pas = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (pas == null) return;
    e.preventDefault();
    choisir(i + pas);
  };
  return (
    <div className="flex flex-col gap-1">
      <span id={id} className="text-secondaire text-muted-foreground">
        {titre}
      </span>
      {/* Filets d'1 px : l'écart de la grille laisse voir le fond `border`. Pas d'`overflow-hidden` : il couperait le focus. */}
      <div role="radiogroup" aria-labelledby={id} className="grid grid-cols-5 gap-px rounded-chip border border-border bg-border">
        {CHOIX.map((c, i) => {
          const cochee = valeur === c.valeur;
          return (
            <button
              key={c.libelle}
              ref={(el) => {
                cases.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={cochee}
              tabIndex={cochee ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(c.valeur)}
              onKeyDown={(e) => fleche(e, i)}
              className={cn(CASE, 'bg-card first:rounded-l-chip last:rounded-r-chip aria-checked:bg-primary aria-checked:text-primary-foreground')}
            >
              {c.libelle}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CadreDeVie({ reglages, onChange, disabled = false }: Props) {
  const idTaille = useId();
  const basculer = (t: Taille) =>
    onChange({ ...reglages, tailles: ORDRE_TAILLES.filter((x) => (x === t ? !reglages.tailles.includes(t) : reglages.tailles.includes(x))) });
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
                onClick={() => basculer(t)}
                className={cn(CASE, 'rounded-chip border border-border bg-card aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground')}
              >
                {LIBELLE_TAILLE[t]}
              </button>
            ))}
          </div>
        </div>
        <div role="group" aria-label="Proximité avec la nature" className="flex flex-col gap-3">
          <CasesCollees titre="Mer à moins de" valeur={reglages.mer} onChange={(mer) => onChange({ ...reglages, mer })} disabled={disabled} />
        </div>
      </div>
    </Categorie>
  );
}
