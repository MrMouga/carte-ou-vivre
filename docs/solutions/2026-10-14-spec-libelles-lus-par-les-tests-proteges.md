# Une tranche qui remplace un réglage doit d'abord chercher les libellés et les noms que lisent les tests protégés des tranches précédentes
Étiquettes : spec, tests, process · Tranche : immobilier · Source : docs/specs/2026-10-14-immobilier/relecture.md

**Problème** — Le premier jet de la spec immobilier renommait la légende neutre (« Sans plafond ou prix inconnu ») et ajoutait trois bascules au-dessus du curseur du loyer, en annonçant tous les critères de loyer-mer « inchangés ».
**Symptômes** — Le relecteur a trouvé deux tests protégés qui auraient cassé : `tests/e2e/liste.spec.ts` lit « Sans plafond : pas de score », et `tests/e2e/telephone-feuille.spec.ts` exige le curseur « Loyer maximum » visible à 375 × 548. Une dizaine d'autres tests trouvent ce curseur par son nom.
**Ce qui n'a pas marché** — Classer l'impact à partir des specs seules (règles, hypothèses) : les tests lisent des textes et des noms que les specs ne fixent pas toujours.
**Ce qui a marché** — Garder le libellé existant et en ajouter un (H60), fixer le nom du curseur dans l'état de départ (H65), et faire de la contrainte de place une contrainte pour /ui, dans le tableau d'impact.
**Prévention** — Pour /spec : avant d'écrire « Ne change pas », chercher dans `tests/` chaque libellé, nom accessible et contrainte de place de la zone remplacée (`grep -rn "<texte>" tests`), et classer chacun dans le tableau d'impact.
