import { cn } from '@/lib/cn';

// Mentions obligatoires (CLAUDE.md, Données ; Figma 5:147) ; tranche proches : la recherche d'adresse et les trajets
// viennent aussi de la Géoplateforme (texte retenu en tâche 0, f, de docs/plans/2026-10-13-proches/mesure-tache-0.md).
// Tranche immobilier (H61) : la mention des ventes, dans tous les modes (texte fixé en tâche 0 avec la règle de Vincent).
// Tranche cadre-de-vie (R30, H80) : la grille de densité de l'Insee, posée avec la ligne de la fiche qui l'utilise (texte
// fixé en tâche 1, CLAUDE.md « Données »).
// Logos Shom et IGN : leurs conditions d'usage n'ont pas été trouvées en ligne ; à la place, leur nom encadré
// et un lien vers leur site (repli du plan, tâche 5b), en attendant la réponse de Vincent.
const lien = 'underline-offset-2 hover:text-foreground hover:underline';
const logo = 'rounded-echantillon border border-border px-1 text-foreground hover:bg-background';

export function Mentions({ className }: { className?: string }) {
  return (
    // Rôle explicite : un <footer> posé dans <main> n'est pas un repère de pied de page.
    <footer role="contentinfo" className={cn('rounded-base bg-card px-2 py-1 text-mentions text-muted-foreground', className)}>
      Estimations ANIL, à partir des données du Groupe SeLoger et de leboncoin · © Shom-IGN, 2021{' '}
      <a className={logo} href="https://www.shom.fr" target="_blank" rel="noreferrer">
        Shom
      </a>{' '}
      <a className={logo} href="https://www.ign.fr" target="_blank" rel="noreferrer">
        IGN
      </a>{' '}
      · Source : Insee, populations légales · Contours des communes : Etalab, d'après Admin Express © IGN · Fond Plan IGN et estompage :{' '}
      <a className={lien} href="https://geoservices.ign.fr" target="_blank" rel="noreferrer">
        © IGN – Géoplateforme
      </a>{' '}
      · Recherche d'adresse et temps de trajet : © IGN – Géoplateforme (Base Adresse Nationale, BD TOPO®) · Prix d'achat :
      Demandes de valeurs foncières (DGFiP), statistiques Etalab, ventes 2023 à 2025 (2021 à 2025 sous 30 ventes) · Type
      d'environnement : Insee, grille communale de densité 2025 (mise en ligne le 21/07/2025)
    </footer>
  );
}
