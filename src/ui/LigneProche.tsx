import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { duree, phrasesPartiel } from '@/domain/format';
import { PROCHE } from '@/domain/score';
import { cn } from '@/lib/cn';
import { couverture } from '@/proches/etat';
import type { EtatProche, Proche } from '@/proches/useProches';

// Ligne de proche (Figma « Ligne de proche » 20:168) : repère en petit, nom, adresse, puis selon l'état le plafond et son
// curseur (prêt), ou la phrase d'état (en attente, calcul, indisponible). « Retirer » dans tous les états (il arrête un
// calcul), nommé « Retirer <nom> » ; indisponible : « Réessayer <nom> » en bouton principal, à côté.
// Partiel (proches-fiables, « Ligne d'un proche approximatif » du plan) : comme prêt, avec ses phrases d'état entre
// l'adresse et le curseur, un curseur qui s'arrête à la couverture, puis « Recalculer avec l'IGN » à côté de « Retirer »
// (sans effet avant la tâche 5b de proches-fiables).

/** Icône maison de Figma (« Icône maison », 14 × 14), à la couleur du texte. */
function IconeMaison() {
  return (
    <svg viewBox="0 0 14 14" className="size-echantillon shrink-0" aria-hidden="true">
      <path d="M7 2.33333L1.75 6.41667H3.20833V11.0833H6.125V8.16667H7.875V11.0833H10.7917V6.41667H12.25L7 2.33333Z" fill="currentColor" />
    </svg>
  );
}

/**
 * « Repère en petit » (24 px) : goutte ronde terre cuite à maison (prêt, et partiel : H99 de proches-fiables) ; « … » en
 * attente ou en calcul ; « ! » pointillé si indisponible.
 */
export function RepereEnPetit({ etat }: { etat: EtatProche }) {
  const indisponible = etat === 'indisponible';
  const pret = etat === 'pret' || etat === 'partiel';
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-cible shrink-0 items-center justify-center rounded-full border-2',
        indisponible ? 'border-dashed border-place-marker bg-card text-place-marker' : 'border-card bg-place-marker text-place-marker-foreground',
      )}
    >
      {pret ? <IconeMaison /> : <span className="text-rang">{indisponible ? '!' : '…'}</span>}
    </span>
  );
}

/** Adresse sous le nom : le libellé de l'IGN, ou pour une commune choisie seule « départ de la mairie » (D6 ; la ville est
 *  déjà dans le nom, corrections 3 du 2026-10-13). */
export const adresseDe = (p: Pick<Proche, 'lieu'>) => (p.lieu.estCommune ? 'départ de la mairie' : p.lieu.libelle);

type Props = { proche: Proche; onPlafond: (minutes: number) => void; onReessayer: () => void; onRetirer: () => void; inactif?: boolean };

export function LigneProche({ proche, onPlafond, onReessayer, onRetirer, inactif }: Props) {
  const { nom, plafond, etat } = proche;
  const partiel = etat === 'partiel' && proche.zones != null;
  const pret = etat === 'pret' || partiel;
  const indisponible = etat === 'indisponible';
  // Partiel (R34) : le plafond va de 15 min à la couverture.
  const max = partiel ? couverture(proche.zones!) : PROCHE.max;
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
          {pret && <span className="shrink-0 text-valeur-curseur tabular-nums">{duree(plafond)}</span>}
        </div>
        <span className="text-secondaire text-muted-foreground break-words">{adresseDe(proche)}</span>
        {partiel &&
          phrasesPartiel(proche.zones!).map((p) => (
            <p key={p} className="text-texte text-foreground">
              {p}
            </p>
          ))}
        {pret && (
          <Slider
            aria-label={`Plafond de ${nom}`}
            aria-valuetext={`${duree(plafond)} au plus`}
            min={PROCHE.pas}
            max={max}
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
        ) : partiel ? (
          <div className="flex items-center gap-2">
            {/* Sans effet avant la tâche 5b de proches-fiables (recalcul à la demande). */}
            <Button variant="lien" className="max-bureau:min-h-toucher" aria-label={`Recalculer avec l'IGN ${nom}`}>
              Recalculer avec l'IGN
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
