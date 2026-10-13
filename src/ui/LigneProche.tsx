import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { duree } from '@/domain/format';
import { PROCHE } from '@/domain/score';
import { cn } from '@/lib/cn';
import type { EtatProche, Proche } from '@/proches/useProches';

// Ligne de proche (Figma « Ligne de proche » 20:168) : repère en petit, nom, adresse, puis selon l'état le plafond et son
// curseur (prêt), ou la phrase d'état (en attente, calcul, indisponible). « Retirer » dans tous les états (il arrête un
// calcul), nommé « Retirer <nom> » ; indisponible : « Réessayer <nom> » en bouton principal, à côté.

/** Icône maison de Figma (« Icône maison », 14 × 14), à la couleur du texte. */
export function IconeMaison({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" className={cn('size-echantillon shrink-0', className)} aria-hidden="true">
      <path d="M7 2.33333L1.75 6.41667H3.20833V11.0833H6.125V8.16667H7.875V11.0833H10.7917V6.41667H12.25L7 2.33333Z" fill="currentColor" />
    </svg>
  );
}

/** « Repère en petit » (24 px) : goutte ronde terre cuite à maison ; « … » en attente ou en calcul ; « ! » pointillé si indisponible. */
export function RepereEnPetit({ etat }: { etat: EtatProche }) {
  const indisponible = etat === 'indisponible';
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-cible shrink-0 items-center justify-center rounded-full border-2',
        indisponible ? 'border-dashed border-place-marker bg-card text-place-marker' : 'border-card bg-place-marker text-place-marker-foreground',
      )}
    >
      {etat === 'pret' ? <IconeMaison /> : <span className="text-rang">{indisponible ? '!' : '…'}</span>}
    </span>
  );
}

/** Adresse sous le nom : le libellé de l'IGN, ou pour une commune choisie seule « Toulouse · départ de la mairie » (D6). */
export const adresseDe = (p: Pick<Proche, 'lieu'>) => (p.lieu.estCommune ? `${p.lieu.libelle} · départ de la mairie` : p.lieu.libelle);

type Props = { proche: Proche; onPlafond: (minutes: number) => void; onReessayer: () => void; onRetirer: () => void; inactif?: boolean };

export function LigneProche({ proche, onPlafond, onReessayer, onRetirer, inactif }: Props) {
  const { nom, plafond, etat } = proche;
  const pret = etat === 'pret';
  const indisponible = etat === 'indisponible';
  const phrase =
    etat === 'attente' ? 'En attente…' : etat === 'calcul' ? `Calcul des trajets depuis ${nom}…` : indisponible ? `Trajets indisponibles depuis ${nom}.` : null;
  const retirer = (
    <Button variant="lien" className="max-bureau:min-h-toucher" aria-label={`Retirer ${nom}`} onClick={onRetirer}>
      Retirer
    </Button>
  );
  return (
    <li className="flex items-start gap-2">
      <RepereEnPetit etat={etat} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="min-w-0 text-texte-fort break-words">{nom}</span>
          {pret && <span className="shrink-0 text-valeur tabular-nums">{duree(plafond)}</span>}
        </div>
        <span className="text-secondaire text-muted-foreground break-words">{adresseDe(proche)}</span>
        {pret && (
          <Slider
            aria-label={`Plafond de ${nom}`}
            aria-valuetext={`${duree(plafond)} au plus`}
            min={PROCHE.pas}
            max={PROCHE.max}
            step={PROCHE.pas}
            value={[plafond]}
            disabled={inactif}
            onValueChange={([v]) => onPlafond(v)}
          />
        )}
        {phrase && <p className={cn('text-texte', indisponible ? 'text-foreground' : 'text-muted-foreground')}>{phrase}</p>}
        {indisponible ? (
          // Figma « Ligne de proche », état Indisponible : « Réessayer » en bouton principal, « Retirer » à côté.
          <div className="flex items-center gap-2">
            <Button className="max-bureau:min-h-toucher" aria-label={`Réessayer ${nom}`} onClick={onReessayer}>
              Réessayer
            </Button>
            {retirer}
          </div>
        ) : (
          <div className="self-start">{retirer}</div>
        )}
      </div>
    </li>
  );
}
