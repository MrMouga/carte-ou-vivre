# Poser le stockage avant l'ouverture : garder la pose « une seule fois » dans localStorage, pas dans sessionStorage, si le test rouvre une page
Étiquettes : tests, outil · Tranche : proches-fiables · Source : tâche 4 (taches/T4.md, preuve sur la version locale)

**Problème** — Pour relire des proches gardés par la version en ligne, le script pose leurs entrées avant l'ouverture (`addInitScript`), une seule fois grâce à une marque dans `sessionStorage`, puis ferme la page et en rouvre une autre dans le même navigateur pour vérifier « relu tel quel, sans calcul ».
**Symptômes** — À la seconde ouverture, les proches repartent en calcul : les vieilles entrées ont été reposées par-dessus les nouvelles, et le test attend un curseur qui ne vient pas.
**Ce qui n'a pas marché** — La marque dans `sessionStorage` : chaque nouvelle page (onglet) a son propre `sessionStorage`, vide ; le script d'ouverture du contexte s'y rejoue et réécrit `localStorage`.
**Ce qui a marché** — Garder la marque dans `localStorage` (même portée que les entrées posées) ; ou poser le script sur la page et non sur le contexte, quand une seule ouverture en a besoin (`page.addInitScript`, comme dans AC-10 de proches-fiables).
**Prévention** — Règle de jugement : un test qui rouvre une page lit la portée de chaque stockage (contexte, page, onglet) avant de « poser une fois » ; vérifier que la seconde ouverture ne fait aucune demande (comptée).
