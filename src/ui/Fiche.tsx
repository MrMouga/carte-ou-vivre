import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { loyerTexte, merFiche, nomAffiche, raisonTexte, rangTexte, tailleTexte } from '@/domain/format';
import type { Evaluation, Resultat } from '@/domain/score';
import { cn } from '@/lib/cn';

const PALIER = ['', 'bg-score-1', 'bg-score-2', 'bg-score-3', 'bg-score-4', 'bg-score-5'];

type Props = { evaluation: Evaluation; resultat: Resultat; onRetour: () => void };

// Fiche (Figma « Fiche », frames 5:154 et 5:235) : passe (score, rang), ne passe pas (raisons), sans plafond.
export function Fiche({ evaluation: e, resultat, onRetour }: Props) {
  const c = e.commune;
  const titre = useRef<HTMLHeadingElement>(null);
  // Le focus suit la commune choisie (la liste qui avait le focus a disparu).
  useEffect(() => titre.current?.focus(), [c.code]);
  return (
    <section aria-labelledby="titre-fiche" className="flex flex-col items-start gap-2 rounded-panel border border-border bg-card p-4 shadow-panneau">
      <Button variant="lien" onClick={onRetour}>
        ← Les 10 premières
      </Button>
      <div className="flex flex-col">
        <h2 id="titre-fiche" ref={titre} tabIndex={-1} className="font-serif text-titre-fiche">
          {nomAffiche(c)}
        </h2>
        <p className="text-texte text-muted-foreground tabular-nums">{tailleTexte(c.population)}</p>
      </div>
      {e.score != null && (
        <div className="flex flex-col">
          <p className="flex items-baseline gap-2">
            <span className={cn('size-echantillon rounded-echantillon', PALIER[e.palier!])} aria-hidden="true" />
            <span className="text-score-grand tabular-nums">{e.score}</span>
            <span className="text-texte text-muted-foreground">/ 100</span>
          </p>
          <p className="text-texte text-muted-foreground tabular-nums">{rangTexte(e.rang!, resultat.classement.length)}</p>
        </div>
      )}
      {!e.passe && (
        <div className="flex flex-col gap-1">
          <h3 className="text-categorie uppercase text-muted-foreground">Ne passe pas tes critères</h3>
          <ul className="flex flex-col">
            {e.raisons.map((r) => (
              <li key={r.critere} className="text-texte-fort tabular-nums">
                {raisonTexte(r)}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-col">
        <p className="text-texte tabular-nums">{loyerTexte(c.loyerM2)}</p>
        {c.loyerM2 != null && !c.estimationPropre && <p className="text-secondaire text-muted-foreground">Estimation du secteur (communes voisines)</p>}
      </div>
      <p className="text-texte tabular-nums">{merFiche(c.merKm)}</p>
    </section>
  );
}
