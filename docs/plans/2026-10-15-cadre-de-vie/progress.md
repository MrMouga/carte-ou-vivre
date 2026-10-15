# Progression — cadre-de-vie
Début : 2026-10-15 13:56 · Plan : plan.md · Suite au départ : 380 tests (142 unitaires, 238 navigateur), 380 verts, 31 sautés (critères reportés)
(Premier passage : 12 échecs dus à un `vite preview --host` resté ouvert depuis le 2026-10-14 21:16 sur le port 4173, que Playwright réutilisait ; arrêté, suite relancée : verte.)
## Tâches
Tâche 0 : faite — commits 2fef378..353dc78 — preuve : mesure-tache-0.md (2026-10-15 14:22) — 29 min — agent : 207 k jetons — rapport : taches/T0.md — choix et jugement de Vincent : 14:50
## Décisions prises à la place de Vincent
- T0 (décidé par Claude, à la demande de Vincent) : source de la zone de montagne = B, Cerema (loi Montagne 2019). Pourquoi : une seule zone légale, un producteur, celle de D5 ; A est une règle croisée inventée. Coût si faux : Morvan hors montagne (Yonne à 150-200 km) ; passer à A ≈ 1 h en tâche 1.
- T0 : recalage COG avec les rétablissements (MOD 21) : la commune rétablie hérite du classement. Coût si faux : 4 communes du Cantal passent de « moins d'1 km » à « Commune de montagne ».
- T0 : B, 143 communes « en partie » sans zone infra-communale (9 départements sans fichier) → contour entier de la commune. Coût si faux : leurs voisines un peu trop près de la montagne (Grenoble en dépend : 1 km).
- T0 : sommets du bord de zone tous les 100 m, contours Cerema éclaircis à 30 m. Coût si faux : < 50 m.
## Jugement de Vincent (tâche 0)
- Une ville du risque jugée fausse : Lyon (14 km), il attendait le Mont d'Or, absent des deux sources (zone légale, pas relief). Sous le seuil d'arrêt : on continue ; rejugé à la démo.
- Saint-Étienne, Annecy classées ; 10 premières à « 10 km » (villages des Vosges, du Cantal, de Haute-Loire) : « ça me va ».
- À signaler dans la spec d'immobilier : D12 « maisons 1 → 0 » est faux, Île-de-Sein reste sans prix (aucune vente, pas d'intercommunalité).
## Preuves
- T0 : docs/plans/2026-10-15-cadre-de-vie/mesure-tache-0.md
## Coût
- T0 : 1 builder, 29 min, 207 k jetons, 66 outils.
