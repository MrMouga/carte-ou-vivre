import { useEffect, useRef } from 'react';
import { chiffresListe, compte, ligneListe, nomAffiche } from '@/domain/format';
import type { ReglagePrix } from '@/domain/prix';
import type { Resultat } from '@/domain/score';
import { cn } from '@/lib/cn';
import { CLASSES_PALIER } from './Legend';

type Props = {
  resultat: Resultat;
  /** Réglage du prix : la colonne du prix suit le mode et l'unité (R24). */
  prix: ReglagePrix;
  onChoisir: (code: string) => void;
  /** Au retour de la fiche : la ligne qui reprend le focus. */
  focusCode?: string | null;
  /** Au moins un proche prêt : le message « aucune commune » le cite (spec proches, details.md). */
  avecProche?: boolean;
};

// Les 10 premières (frame Figma 5:2, « Les 10 premières ») : compte, puis une ligne-bouton par commune (R5).
export function List({ resultat, prix, onChoisir, focusCode, avecProche = false }: Props) {
  const { actif, classement } = resultat;
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    if (focusCode) section.current?.querySelector<HTMLElement>(`[data-code="${focusCode}"]`)?.focus();
  }, [focusCode]);
  return (
    <section ref={section} aria-labelledby="titre-liste" className="flex flex-col gap-2 p-4 max-bureau:pb-2 bureau:rounded-panel bureau:border bureau:border-border bureau:bg-card bureau:shadow-panneau">
      <div className="flex flex-col">
        <h2 id="titre-liste" className="text-categorie uppercase text-muted-foreground">
          Les 10 premières
        </h2>
        {actif && classement.length > 0 && <p className="text-texte-fort">{compte(classement.length)}</p>}
      </div>
      {!actif ? (
        <p className="text-texte">Fixe un loyer ou une distance à la mer pour classer les communes.</p>
      ) : classement.length === 0 ? (
        <p className="text-texte">
          {avecProche
            ? 'Aucune commune ne passe tes critères. Relâche le loyer, la mer, la taille ou un proche.'
            : 'Aucune commune ne passe tes critères. Relâche le loyer, la mer ou la taille.'}
        </p>
      ) : (
        <ol className="flex flex-col">
          {classement.slice(0, 10).map((e) => (
            <li key={e.commune.code}>
              <button
                type="button"
                data-code={e.commune.code}
                aria-label={ligneListe(e.rang!, e.commune, e.score!, prix)}
                onClick={() => onChoisir(e.commune.code)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-base p-2 text-left hover:bg-background"
              >
                <span className="w-rang shrink-0 text-texte-fort text-muted-foreground tabular-nums">{e.rang}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-texte-fort">{nomAffiche(e.commune)}</span>
                  <span className="text-secondaire text-muted-foreground tabular-nums">{chiffresListe(e.commune, prix)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <span className={cn('size-pastille-score rounded-pastille-score', CLASSES_PALIER[e.palier! - 1])} />
                  <span className="text-texte-fort tabular-nums">{e.score}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
