# Une demande de focus gardée pour « après le rendu » ne se vide que quand sa cible existe : un autre rendu peut passer avant celui qui crée l'élément
Étiquettes : build, tests · Tranche : emploi · Source : tâche 4 d'emploi (taches/T4.md), `src/ui/Emploi.tsx`, test « « Second métier » : … Entrée choisit »

**Problème** — Après le choix d'un métier, le focus doit aller sur la case « 10 % » du métier ajouté. `Emploi` notait la cible dans une ref (`focus.current = { case: code }`), et un `useEffect` sans dépendances la lisait, la vidait, puis donnait le focus.
**Symptômes** — Le test à 390 px a échoué une fois sur 20 à 40 environ, avec le focus sur `body`. La suite entière était verte, et `--repeat-each=3` l'a attrapé. Un journal (`focusin`/`focusout` + une ligne dans l'effet) montrait qu'un rendu d'`Emploi` passait **avant** celui qui ajoute le métier, encore avec un seul métier : l'effet vidait la demande sans trouver la case, puis le vrai rendu n'avait plus rien à faire.
**Ce qui n'a pas marché** — Chercher d'abord une feuille repliée par un clic tombé sur sa tête pendant qu'elle bougeait (sonde `data-repliee` : non).
**Ce qui a marché** — L'effet ne vide la demande que s'il trouve sa cible (case, lien, « Retirer ») ; sinon elle attend le rendu suivant. 100 passages sur 100.
**Prévention** — Règle de jugement : une demande « au prochain rendu » ne se consomme qu'une fois la cible trouvée. Un test qui vérifie un focus après un changement de réglage se lance avec `--repeat-each` (≥ 20) avant de dire « stable » ; une suite verte une fois ne le prouve pas.
