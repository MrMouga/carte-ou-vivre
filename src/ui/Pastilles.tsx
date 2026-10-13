import { duree } from '@/domain/format';
import type { Proche } from '@/proches/useProches';
import { RepereEnPetit } from './LigneProche';

// Pastilles de temps (Figma « Pastille de temps » 18:145, écrans 21:562, 22:307, 22:640 ; spec proches D10, R15) :
// en haut de la carte, en bureau seulement (pas sous 1 024 px, H11 de loyer-mer), une par proche dans l'ordre d'ajout.
// Affichage seul : une liste « Temps vers tes proches », pas des boutons ; un clic ne fait rien (ni ne passe à la carte).
// Sur deux lignes ou plus quand elles ne tiennent pas entre les panneaux (accepté par Vincent, design decisions.md).

/** Valeur d'une pastille (R15) : sans commune choisie « 2 h au plus » ; avec, son temps (R10) et « · au-dessus de 2 h » s'il dépasse. */
export function valeurPastille(p: Proche, commune: number | null): string {
  if (p.etat === 'indisponible') return 'trajets indisponibles';
  if (p.etat !== 'pret' || !p.temps) return 'calcul en cours';
  if (commune == null) return `${duree(p.plafond)} au plus`;
  const t = p.temps[commune];
  return t === 0 || t > p.plafond ? `${duree(t)} · au-dessus de ${duree(p.plafond)}` : duree(t);
}

type Props = { proches: Proche[]; /** Index de la commune choisie dans communes.json, ou null. */ commune: number | null };

export function Pastilles({ proches, commune }: Props) {
  if (!proches.length) return null;
  return (
    // Centrées sur la page, entre les deux panneaux (la marge de chaque côté est celle du plus large, la liste).
    <div
      className="pointer-events-none absolute top-4 hidden justify-center bureau:flex"
      style={{ left: 'calc(var(--space-4) * 2 + var(--taille-liste))', right: 'calc(var(--space-4) * 2 + var(--taille-liste))' }}
    >
      <ul aria-label="Temps vers tes proches" className="flex flex-wrap justify-center gap-2">
        {proches.map((p) => (
          <li
            key={p.id}
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2 shadow-panneau"
          >
            <RepereEnPetit etat={p.etat} />
            <span className="text-texte-fort whitespace-nowrap">{p.nom}</span>
            <span className="text-pastille text-muted-foreground whitespace-nowrap tabular-nums">{valeurPastille(p, commune)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
