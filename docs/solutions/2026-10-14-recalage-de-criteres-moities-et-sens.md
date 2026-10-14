# Recaler des critères par un modèle des règles : chercher les moitiés exactes et les critères qui changent de sens
Étiquettes : spec, tests, process · Tranche : cadre-de-vie · Source : docs/specs/2026-10-14-cadre-de-vie/relecture.md

**Problème** — Passer la mer de 60 à 50 km a demandé de réécrire 50 critères de 4 tranches. Un script (`recalage.py`) avec un modèle des règles, vérifié d'abord sur toutes les valeurs connues à 60 km, a donné des chiffres justes, mais la relecture a trouvé ce qu'il ne regardait pas.
**Symptômes** — (1) Des scores tombaient sur une moitié exacte (Quaibleu 47,5 → 48) : juste par la règle, fragile en virgule flottante. (2) Deux critères changeaient de sens, pas seulement de chiffres (une valeur du curseur qui n'existe plus, `mer=200` devenu « Peu importe »), alors que la spec annonçait « mêmes communes ». (3) Un test protégé lisait une adresse que son critère ne citait pas.
**Ce qui n'a pas marché** — Annoncer « seuls des scores changent » d'après les cas courants.
**Ce qui a marché** — Faire signaler par le modèle chaque moyenne à ± 0,01 d'une moitié ; nommer les critères qui changent de sens dans la décision ; chercher dans `tests/` chaque adresse et chaque libellé touchés, pas seulement dans `acceptance.json`.
**Prévention** — Pour /spec, à chaque recalage : modèle vérifié sur l'ancien état, alerte des moitiés exactes, liste des critères dont le *when* change, et `grep -rn` des valeurs touchées dans `tests/` et `src/**/*.test.ts`.
