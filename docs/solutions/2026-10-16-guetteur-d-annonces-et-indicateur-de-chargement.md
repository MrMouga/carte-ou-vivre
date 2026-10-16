# Un test qui guette les zones d'annonce : attendre que l'indicateur de chargement de la carte soit parti avant de remettre le guetteur à zéro
Étiquettes : tests, outil · Tranche : proches-fiables · Source : tâche 5b de /build proches-fiables, `docs/plans/2026-10-16-proches-fiables/taches/T5b.md`

**Problème** — Le test hors critère de la tâche 5a « les zones d'annonce de la page ne changent pas pendant le recalcul » (H100) était vert à 13:03 et tombait 3 fois sur 4 à 14:30, sans aucun changement du code (vérifié en remettant le code d'avant).
**Symptômes** — Une annonce de plus, vide, venue de `message-carte` (`aria-live`) : le guetteur a vu « Chargement de la carte… » devenir vide après sa remise à zéro.
**Ce qui n'a pas marché** — Lire « carte prête » (`data-carte-prete`) : l'indicateur de chargement reste au moins 300 ms de plus (H9, `src/domain/chargement.ts`) ; sur une machine chargée, le test lit la page dans ces 300 ms.
**Ce qui a marché** — Attendre `message-carte` vide avant la remise à zéro (8 passages sur 8, bureau et 390 px). L'assertion ne change pas : rien de nouveau dans les zones d'annonce pendant et après le recalcul.
**Prévention** — Règle de jugement pour les tests qui comptent des annonces : partir d'une page au repos (carte prête **et** indicateurs partis, budgets de H9 compris), et noter dans le guetteur l'élément qui a changé, pour lire tout de suite d'où vient une annonce de trop.
