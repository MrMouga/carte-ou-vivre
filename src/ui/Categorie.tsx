import { useId, useState } from 'react';

// Catégorie repliable du panneau de réglages (Figma « Catégorie repliable » 20:180, design proches decisions.md).
// Motif « disclosure » : h2 > button[aria-expanded]. Ouverte au départ. Repliée : le résumé du réglage à droite du titre.
// Ouverte : l'action de la catégorie à droite du titre (ex. « Effacer mes proches »).
type Props = {
  titre: string;
  resume: string;
  /** Pour nommer un groupe du contenu par le seul titre (aria-labelledby). */
  idTitre?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function Categorie({ titre, resume, idTitre, action, children }: Props) {
  const [ouverte, setOuverte] = useState(true);
  const contenu = useId();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="min-w-0 flex-1">
          <button
            type="button"
            aria-expanded={ouverte}
            aria-controls={contenu}
            onClick={() => setOuverte(!ouverte)}
            className="flex min-h-cible w-full cursor-pointer items-center gap-1 rounded-base text-left max-bureau:min-h-toucher"
          >
            <svg viewBox="0 0 24 24" className="size-echantillon shrink-0 text-muted-foreground" aria-hidden="true">
              <path d={ouverte ? 'm6 9 6 6 6-6' : 'm9 6 6 6-6 6'} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span id={idTitre} className="text-categorie uppercase text-muted-foreground">
              {titre}
            </span>
            {!ouverte && <span className="ml-auto pl-2 text-right text-pastille text-foreground tabular-nums">{resume}</span>}
          </button>
        </h2>
        {ouverte && action}
      </div>
      <div id={contenu} hidden={!ouverte} className="flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}
