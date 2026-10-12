import { cn } from '@/lib/cn';

const PALIERS = ['bg-score-1', 'bg-score-2', 'bg-score-3', 'bg-score-4', 'bg-score-5'];

// Légende (Figma « Légende ») : mode Classée (5 paliers) ou Sans plafond (sable), puis « Non colorée : ne passe pas ».
export function Legend({ className, sansPlafond = false }: { className?: string; sansPlafond?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-1 rounded-base border border-border bg-card px-3 py-2 text-secondaire', className)}>
      {sansPlafond ? (
        <div className="flex items-center gap-2">
          <span className="size-echantillon rounded-echantillon bg-area-unranked" aria-hidden="true" />
          <span>Sans plafond : pas de score</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex gap-ecart-echantillon" aria-hidden="true">
            {PALIERS.map((p) => (
              <span key={p} className={cn('size-echantillon rounded-echantillon', p)} />
            ))}
          </div>
          <span>
            Score 0 → 100<span className="sr-only"> : 5 paliers, du plus clair (0 à 20) au plus foncé (80 à 100)</span>
          </span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="size-echantillon rounded-echantillon border border-border" aria-hidden="true" />
        <span>Non colorée : ne passe pas</span>
      </div>
    </div>
  );
}
