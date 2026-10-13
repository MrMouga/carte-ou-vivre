import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { duree, loyerTexte, merFiche, nomAffiche, raisonTexte, rangTexte, tailleTexte } from '@/domain/format';
import type { Evaluation } from '@/domain/score';
import { cn } from '@/lib/cn';
import type { Proche } from '@/proches/useProches';
import { CLASSES_PALIER } from './Legend';

type Props = {
  evaluation: Evaluation;
  /** Nombre de communes qui passent (R6). */
  total: number;
  /** Proches dans l'ordre d'ajout, et l'index de la commune dans communes.json (ordre de leurs temps). */
  proches: Proche[];
  index: number;
  onRetour: () => void;
};

/** Ligne d'un proche dans la fiche (details.md) : « Parents de Léa : 3 h 30 en voiture », « … : calcul en cours », « … : trajets indisponibles ». */
export function ligneProche(p: Proche, index: number): string {
  if (p.etat === 'indisponible') return `${p.nom} : trajets indisponibles`;
  if (p.etat !== 'pret' || !p.temps) return `${p.nom} : calcul en cours`;
  return `${p.nom} : ${duree(p.temps[index])} en voiture`;
}

// Fiche (Figma « Fiche », frames 5:154 et 5:235) : passe (score, rang), ne passe pas (raisons), sans plafond.
// Tranche proches (Figma 22:307) : sous la mer, « Tes proches » et une ligne par proche, dans tous les états de la fiche.
export function Fiche({ evaluation: e, total, proches, index, onRetour }: Props) {
  const c = e.commune;
  const titre = useRef<HTMLHeadingElement>(null);
  // Le focus suit la commune choisie (la liste qui avait le focus a disparu).
  useEffect(() => titre.current?.focus(), [c.code]);
  return (
    <section aria-labelledby="titre-fiche" className="flex flex-col items-start gap-2 p-4 max-bureau:pb-2 bureau:rounded-panel bureau:border bureau:border-border bureau:bg-card bureau:shadow-panneau">
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
            <span className={cn('size-echantillon rounded-echantillon', CLASSES_PALIER[e.palier! - 1])} aria-hidden="true" />
            <span className="text-score-grand tabular-nums">{e.score}</span>
            <span className="text-texte text-muted-foreground">/ 100</span>
          </p>
          <p className="text-texte text-muted-foreground tabular-nums">{rangTexte(e.rang!, total)}</p>
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
      {proches.length > 0 && (
        <div className="flex flex-col gap-1 pt-2">
          <h3 className="text-categorie uppercase text-muted-foreground">Tes proches</h3>
          <ul className="flex flex-col gap-1">
            {proches.map((p) => (
              <li key={p.id} className="text-texte tabular-nums">
                {ligneProche(p, index)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
