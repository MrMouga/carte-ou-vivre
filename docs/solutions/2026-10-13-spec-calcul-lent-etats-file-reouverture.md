# Dans une spec où un élément se calcule lentement chez un tiers, lui donner ses états d'attente, d'annulation et de réouverture
Étiquettes : spec, process · Tranche : proches · Source : docs/specs/2026-10-13-proches/relecture.md

**Problème** — Le premier jet de la spec proches décrivait un proche « en calcul », « prêt » ou « indisponible », mais pas le temps entre les deux ni ce qui survit à la fermeture de la page. Les 3 bloquants viennent du relecteur, pas de l'auteur.
**Symptômes** — (1) Un proche en calcul quand on ferme la page : à la réouverture, il disparaît, revient indisponible ou relance son calcul ? (2) Un calcul qui peut durer 30 s sans « Retirer » ni « Annuler ». (3) Plusieurs proches ajoutés d'affilée : le délai de 30 s part de l'ajout ou du début du calcul ? Partant de l'ajout, le 4e et le 5e seraient tombés en panne sans avoir été calculés.
**Ce qui n'a pas marché** — Écrire les états d'un élément à partir du cas où tout va vite et où l'on n'en ajoute qu'un.
**Ce qui a marché** — Un état **en attente** (dans la file), « Retirer » disponible pendant le calcul, un délai qui part du début du calcul de chaque élément, et une règle de réouverture (« ce qui n'était pas prêt revient indisponible »).
**Prévention** — Règle de jugement pour /spec : pour tout élément calculé par un service extérieur, se poser quatre questions : plusieurs à la fois (file) ? annuler pendant ? d'où part le délai ? que devient-il si l'on ferme la page au milieu ? Et faire répondre le service simulé de la fixture avec un délai, sinon l'état « calcul » ne s'observe pas dans les tests.
