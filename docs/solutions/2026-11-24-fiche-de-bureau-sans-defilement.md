# Un bloc qui allonge la fiche : vérifier en bureau qu'on peut lire sa dernière ligne, le panneau de droite ne défilait pas
Étiquettes : design, build, tests · Tranche : services · Source : tâche 1 de /build services, `docs/plans/2026-11-24-services/taches/T1.md`

**Problème** — Le bloc « Services en voiture » (10 lignes et deux phrases) ajoute environ 400 px à la fiche. En bureau, la fiche est posée sur la carte (`absolute right-4 top-4`) sans hauteur limite ni défilement, et la page ne défile jamais (`overflow-clip` de `<main>`).
**Symptômes** — Capture de la fiche de L'Île-d'Yeu à 1 440 × 900 sur les vraies données : la phrase de la traversée est coupée par le bas de la fenêtre, et aucun geste ne permet de la lire. Tous les tests étaient verts (ils lisent le texte, pas ce qui se voit).
**Ce qui n'a pas marché** — Se fier au prototype : il montrait le bloc seul, à 390 px, où la feuille défile déjà ; aucune capture de bureau avec une fiche longue.
**Ce qui a marché** — Le cadre de la fiche va de `top-4` à `bottom-4` (sans bloquer la carte : `pointer-events-none`, la fiche seule reprend les clics) et la fiche défile dedans (`min-h-0 overflow-y-auto`), comme le panneau des réglages.
**Prévention** — Test « fiche longue en bureau » de `tests/e2e/services.spec.ts` (fenêtre de 1 440 × 700 : la dernière phrase amenée à l'écran par le défilement de la fiche). Règle de jugement : une tranche qui allonge un panneau posé sur la carte fait une capture de bureau de son cas le plus long avant de conclure.
