# Avant de confier un critère à une tâche, lire son « when » en entier : s'il appuie sur un bouton qu'une tâche suivante construit, déplacer le bouton ou le critère
Étiquettes : process, spec, tests · Tranche : proches-fiables · Source : tâche 5a de /build proches-fiables (`docs/plans/2026-10-16-proches-fiables/taches/T5a.md`)

**Problème** — Le plan confiait AC-8 (a à e) à la tâche 5a (recalcul à la réouverture) et l'action du lien « Recalculer avec l'IGN » à la tâche 5b. Or le cas (d) d'AC-8 se termine par « il appuie ensuite sur « Recalculer avec l'IGN » ».
**Symptômes** — Sans l'action, AC-8 ne pouvait pas passer entier en 5a : il aurait fallu marquer un critère à moitié, ou attendre 5b pour le cocher.
**Ce qui n'a pas marché** — Lire la colonne « then » des critères pour répartir les tâches, sans lire le « when » jusqu'au bout.
**Ce qui a marché** — Décidé par le constructeur (le plan ne l'avait pas prévu, et ce n'était pas sur la liste « demander d'abord ») : le lien met le proche en recalcul en fin de file dès 5a, par le même chemin que la réouverture ; 5b garde la priorité sur les recalculs automatiques, AC-9, AC-11 et « Retirer » pendant un recalcul.
**Prévention** — Règle de jugement pour /breakdown : pour chaque critère confié à une tâche, relever chaque geste de son « when » (boutons, liens, réglages) et vérifier qu'il est construit dans cette tâche ou avant.
