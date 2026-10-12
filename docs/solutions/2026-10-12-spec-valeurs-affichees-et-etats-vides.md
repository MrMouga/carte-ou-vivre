# Dans une spec à seuils, dire si l'on compare la valeur affichée ou la valeur exacte, et donner un état à chaque zone quand aucun critère n'est actif
Étiquettes : spec, process · Tranche : loyer-mer · Source : docs/specs/2026-10-12-loyer-mer/relecture.md

**Problème** — Le premier jet de la spec loyer-mer laissait trois trous, trouvés par le relecteur et non par l'auteur.
**Symptômes** — (1) Plafond comparé à la valeur exacte et affichage arrondi : on aurait pu lire « Mer 60 km : au-dessus de ton plafond de 60 km ». (2) Aucun contenu prévu pour la fiche quand les deux critères sont sur « Sans limite », alors qu'une moyenne de zéro note n'existe pas. (3) Rien sur le fond de carte, qui serait un service extérieur caché, ni sur la source des formes et sa mention.
**Ce qui n'a pas marché** — Écrire les états de la page sans croiser chaque état avec chaque zone (la fiche).
**Ce qui a marché** — R1 compare la valeur affichée. Un état « aire sans plafond » a été ajouté à la fiche. D9 dit « pas de fond de carte », et la source des formes est à choisir en tâche 0.
**Prévention** — Règle de jugement pour /spec : (a) toute valeur arrondie à l'affichage et comparée à un seuil dit laquelle est comparée ; (b) un tableau état de page × zone, pour que chaque case ait un contenu ; (c) tout élément visuel fourni par un tiers (fond, tuiles, polices) est soit une décision, soit exclu.
