# Recaler une fixture : relire chaque « when », pas seulement les valeurs attendues
Étiquettes : spec, tests, process · Tranche : proches · Source : /build du 2026-10-13 (tâche 4)

**Problème** — Après la révision D15 (plafond de 6 h ramené à 3 h), l'orchestrateur a divisé les temps de la fixture par deux et recalculé tous les scores et textes attendus des critères (« then »), sans relire les actions (« when »).
**Symptômes** — AC-14 et AC-16 disaient « choisit Grandeville (33) **dans la liste** » alors qu'avec le nouveau plafond de 2 h, Grandeville ne passe plus et n'est donc pas dans la liste. Le constructeur de la tâche 4 a signalé AC-14 ; pour AC-16, il a écrit un test qui choisit « sur la carte » sans le dire, et c'est l'orchestrateur qui l'a vu en vérifiant.
**Ce qui n'a pas marché** — Un script qui recalcule les valeurs : il prouve les nombres, pas que le geste décrit est encore possible.
**Ce qui a marché** — Deux mots changés (« sur la carte ») avec l'accord de Vincent, un commit de spec à part ; vérifier, pour chaque critère, comment le test réalise le « when » (grep du geste dans le test), pas seulement que le test porte l'id et passe.
**Prévention** — Règle de jugement : après tout recalage de fixture ou de seuil, relire chaque « given » et « when » contre les nouvelles valeurs (« cet élément est-il encore là où le critère le cherche ? ») ; à la vérification d'une tâche, lire la ligne du test qui fait le geste du « when ».
