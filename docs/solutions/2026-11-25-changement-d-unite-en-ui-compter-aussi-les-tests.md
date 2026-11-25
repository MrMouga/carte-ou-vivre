# Un changement d'affichage demandé en /ui : chiffrer son coût en tests, pas seulement en critères, avant que Vincent tranche
Étiquettes : process, spec, tests, design · Tranche : recherche-et-mer · Source : /ui puis /breakdown du 2026-11-25

**Problème** — Après essai des pistes, Vincent a choisi « la mer en minutes seulement, plus de km », contre D5 de la spec validée (bascule km / min).
**Symptômes** — En /ui, j'ai annoncé le coût en critères (58 critères de 7 tranches, par un script sur les `acceptance.json`). En /breakdown seulement, le comptage des tests a montré 19 fichiers de bout en bout sur 25, environ 330 lignes, parce que la liste affiche la mer même sur « Peu importe ». Le plan est passé de ~5 à 8 tâches, au-dessus du cadre perso.
**Ce qui n'a pas marché** — Chiffrer le coût par les seuls critères : les tests hors critère lisent aussi la colonne de la liste.
**Ce qui a marché** — `grep -lE "[0-9] km|d'1 km|mer=" tests/e2e/*.ts` et le nombre de lignes, puis un découpage (tableau de recalage validé une fois, tâche de recalage à part, fonctions pures avant le branchement).
**Prévention** — Jugement : quand Vincent change en /ui ce que l'écran affiche partout (une unité, une colonne de liste, un texte de départ), compter dans le même message les critères **et** les fichiers de tests qui lisent ce texte, et lui donner les deux nombres avant qu'il tranche.
