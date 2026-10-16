import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { duree, km, PHRASE_KM, phrasesPartiel } from '@/domain/format';
import { PROCHE } from '@/domain/score';
import { couverture } from '@/proches/etat';
import type { Proche } from '@/proches/useProches';

// Ligne de proche (Figma « Ligne de proche » 20:168) : repère en petit, nom, adresse, puis selon l'état le plafond et son
// curseur (prêt), ou la phrase d'état (en attente, calcul). « Retirer » dans tous les états (il arrête un calcul), nommé
// « Retirer <nom> ».
// Partiel (proches-fiables, « Ligne d'un proche approximatif » du plan) : comme prêt, avec ses phrases d'état entre
// l'adresse et le curseur, un curseur qui s'arrête à la couverture, puis « Recalculer avec l'IGN » à côté de « Retirer »
// (il met le proche en recalcul, R36). Km (tâche 3a) : de même, avec la phrase « À vol d'oiseau : l'IGN ne
// répond pas. » et un curseur en km, de 15 à 180 km par pas de 15 (R35), « 120 km au plus ».
// Recalcul (tâche 5a, état « recalcul » de details.md) : l'état d'avant reste affiché, le curseur réglable, et
// « Recalcul avec l'IGN… » remplace le lien, aussi quand le proche attend son tour. Texte de la ligne, sans annonce (H100).
// Après un appui sur le lien, le focus passe à « Retirer » de la même ligne (le lien disparaît).

/** Icône maison de Figma (« Icône maison », 14 × 14), à la couleur du texte. */
function IconeMaison() {
  return (
    <svg viewBox="0 0 14 14" className="size-echantillon shrink-0" aria-hidden="true">
      <path d="M7 2.33333L1.75 6.41667H3.20833V11.0833H6.125V8.16667H7.875V11.0833H10.7917V6.41667H12.25L7 2.33333Z" fill="currentColor" />
    </svg>
  );
}

/**
 * « Repère en petit » (24 px) : goutte ronde terre cuite à maison (prêt, et partiel ou km : H99 de proches-fiables) ;
 * « … » en attente ou en calcul.
 */
export function RepereEnPetit({ etat }: { etat: Proche['etat'] }) {
  const pret = etat === 'pret' || etat === 'partiel' || etat === 'km';
  return (
    <span
      aria-hidden="true"
      className="flex size-cible shrink-0 items-center justify-center rounded-full border-2 border-card bg-place-marker text-place-marker-foreground"
    >
      {pret ? <IconeMaison /> : <span className="text-rang">…</span>}
    </span>
  );
}

/** Adresse sous le nom : le libellé de l'IGN, ou pour une commune choisie seule « départ de la mairie » (D6 ; la ville est
 *  déjà dans le nom, corrections 3 du 2026-10-13). */
export const adresseDe = (p: Pick<Proche, 'lieu'>) => (p.lieu.estCommune ? 'départ de la mairie' : p.lieu.libelle);

type Props = { proche: Proche; onPlafond: (minutes: number) => void; onRecalculer: () => void; onRetirer: () => void; inactif?: boolean };

export function LigneProche({ proche, onPlafond, onRecalculer, onRetirer, inactif }: Props) {
  const boutonRetirer = useRef<HTMLButtonElement>(null);
  const { nom, plafond, etat } = proche;
  const partiel = etat === 'partiel' && proche.zones != null;
  const enKm = etat === 'km';
  const approximatif = partiel || enKm;
  const pret = etat === 'pret' || approximatif;
  // Partiel (R34) : le plafond va de 15 min à la couverture. Km (R35) : de 15 à 180 km par pas de 15, les mêmes nombres.
  const max = partiel ? couverture(proche.zones!) : PROCHE.max;
  const valeur = enKm ? km(plafond) : duree(plafond);
  const phrases = partiel ? phrasesPartiel(proche.zones!) : enKm ? [PHRASE_KM] : [];
  const phrase = etat === 'attente' ? 'En attente…' : etat === 'calcul' ? `Calcul des trajets depuis ${nom}…` : null;
  const retirer = (
    <Button ref={boutonRetirer} variant="lien" className="max-bureau:min-h-toucher" aria-label={`Retirer ${nom}`} onClick={onRetirer}>
      Retirer
    </Button>
  );
  return (
    <li className="flex items-start gap-2">
      <RepereEnPetit etat={etat} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="min-w-0 text-texte-fort break-words">{nom}</span>
          {pret && <span className="shrink-0 text-valeur-curseur tabular-nums">{valeur}</span>}
        </div>
        <span className="text-secondaire text-muted-foreground break-words">{adresseDe(proche)}</span>
        {phrases.map((p) => (
          <p key={p} className="text-texte text-foreground">
            {p}
          </p>
        ))}
        {pret && (
          <Slider
            aria-label={`Plafond de ${nom}`}
            aria-valuetext={`${valeur} au plus`}
            min={PROCHE.pas}
            max={max}
            step={PROCHE.pas}
            value={[plafond]}
            disabled={inactif}
            onValueChange={([v]) => onPlafond(v)}
          />
        )}
        {phrase && <p className="text-texte text-muted-foreground">{phrase}</p>}
        {approximatif ? (
          <div className="flex items-center gap-2">
            {proche.recalcul ? (
              <p className="text-texte text-foreground">Recalcul avec l'IGN…</p>
            ) : (
              <Button
                variant="lien"
                className="max-bureau:min-h-toucher"
                aria-label={`Recalculer avec l'IGN ${nom}`}
                onClick={() => {
                  onRecalculer();
                  boutonRetirer.current?.focus();
                }}
              >
                Recalculer avec l'IGN
              </Button>
            )}
            {retirer}
          </div>
        ) : (
          <div className="self-start">{retirer}</div>
        )}
      </div>
    </li>
  );
}
