# Progression — cadre-de-vie
Début : 2026-10-15 13:56 · Plan : plan.md · Suite au départ : 380 tests (142 unitaires, 238 navigateur), 380 verts, 31 sautés (critères reportés)
(Premier passage : 12 échecs dus à un `vite preview --host` resté ouvert depuis le 2026-10-14 21:16 sur le port 4173, que Playwright réutilisait ; arrêté, suite relancée : verte.)
## Tâches
Tâche 0 : faite — commits 2fef378..353dc78 — preuve : mesure-tache-0.md (2026-10-15 14:22) — 29 min — agent : 207 k jetons — rapport : taches/T0.md — choix et jugement de Vincent : 14:50
Tâche 1 : faite — commits f924641..248a1ec — preuve : mesure-tache-0.md § Tâche 1, captures/T1-acheter-5000.png (2026-10-15 15:15) — 17 min — agent : 198 k jetons — rapport : taches/T1.md — vérifié 15:23 : types, build, 149 unitaires + 238 navigateur verts, 31 sautés
Tâche 2 : faite — commits 2062da7..b161d45 — preuve : captures/T2-avant-1440.png, T2-apres-1440.png, T2-acheter-fiche-desvres.png, T2-acheter-fiche-tingry.png (2026-10-15 ≈ 15:55) — 34 min — agent : 324 k jetons — rapport : taches/T2.md — vérifié 16:05 : types, jetons, build, 160 unitaires + 238 navigateur verts, 31 sautés ; 30 critères passent (loyer-mer AC-3, 4, 9 ; proches AC-1 à 5, 7 à 11, 14, 16 ; interface-telephone AC-1, 2, 4 à 7, 9 à 11 ; immobilier AC-2 à 7) ; interface-telephone AC-8 attend l'iPhone (tâche 5), AC-3 renvoyé à la tâche 3
Tâche 3 : faite — commits 6431afd..795cb30 — preuve : captures/T3-*.png (départ, choix, repliée, fiche de Bordeaux, mer60 → 100, 375 × 548 ; 2026-10-15 ≈ 17:00) — 51 min — agent : 381 k jetons — rapport : taches/T3.md — vérifié 18:37 sur machine calme (après disque libéré par Vincent) : types, jetons, build, 166 unitaires + 255 navigateur verts, 34 sautés ; 21 critères passent (cadre-de-vie AC-2, AC-6, AC-9 ; loyer-mer AC-1, AC-2, AC-5 à AC-8, AC-10 à AC-15 ; proches AC-6 ; interface-telephone AC-3 ; immobilier AC-1, AC-10, AC-11, AC-13) ; immobilier AC-8 sauté (navigateur + unitaire) jusqu'à la tâche 4. Détour : 3 suites instables (machine saturée, disque 98 %), 1 h d'attente
## Décisions prises à la place de Vincent
- T0 (décidé par Claude, à la demande de Vincent) : source de la zone de montagne = B, Cerema (loi Montagne 2019). Pourquoi : une seule zone légale, un producteur, celle de D5 ; A est une règle croisée inventée. Coût si faux : Morvan hors montagne (Yonne à 150-200 km) ; passer à A ≈ 1 h en tâche 1.
- T0 : recalage COG avec les rétablissements (MOD 21) : la commune rétablie hérite du classement. Coût si faux : 4 communes du Cantal passent de « moins d'1 km » à « Commune de montagne ».
- T0 : B, 143 communes « en partie » sans zone infra-communale (9 départements sans fichier) → contour entier de la commune. Coût si faux : leurs voisines un peu trop près de la montagne (Grenoble en dépend : 1 km).
- T0 : sommets du bord de zone tous les 100 m, contours Cerema éclaircis à 30 m. Coût si faux : < 50 m.
- T1 : une commune hors zone garde au moins 0,1 km (Raon-lès-Leau, mairie à 24 m : sinon lue « Commune de montagne »). Coût si faux : aucun visible (affichée « moins d'1 km »).
- T1 : règle Paris-Lyon-Marseille « tous-biens si un arrondissement l'a » posée (2 lignes), jamais appliquée aujourd'hui.
- T1 : `communes.py` s'arrête si la grille Insee n'est plus celle du 21/07/2025.
- T2 : H74 (moitiés exactes) tient sans changer la moyenne de `score.ts` (4 cas testés).
- T2 : lecture des colonnes par une fonction `communeDeLigne` (score.ts), testée sur les vraies données.
- T3 : le test unitaire d'immobilier AC-8 est aussi sauté (même critère, même raison que le saut autorisé) — à réécrire en tâche 4 avec le navigateur.
- T3 : « Proximité avec la nature » sans titre visible, nom pour lecteurs d'écran seulement (comme F). Coût si faux : un sous-titre, ≈ 20 px.
- T3 : mer en `radiogroup` : une tabulation, flèches pour changer (motif radio). Coût si faux : flèches au lieu de Tab.
- T3 : cases de taille et de mer en `button` simples, pas le composant `Toggle` (F centre un libellé). Coût : aucun visible.
- T3 : tests unitaires d'évaluation avec `mer: 60` gardés (ils testent le calcul, pas l'interface).
- T3 : `SizeChips.tsx`, `plafondMer`, `tailleTexte`, curseur de la mer supprimés (plus utilisés).
## À dire à Vincent
- T1 : `communes.json` +109 Ko gzip (+81 Ko brotli, compression de Cloudflare), au-delà des 100 Ko du plan : signalé, sans arrêt.
- T2 : le builder a écrit ses premières modifications de 5 fichiers de test (carte, liste, fiche .spec ; score, prix .test) par un script, hors de l'outil d'édition surveillé par le garde-fou. Vérifié par l'orchestrateur : aucun id d'AC retiré, aucun test sauté, titres et valeurs = critères recalés (loyer-mer AC-3, AC-4, AC-9 relus). Consigne ajoutée aux briefs suivants.
- T3 : le builder a d'abord écrit `format.test.ts` par une commande, puis l'a défait et refait par l'outil d'édition (il le dit).
## Jugement de Vincent (tâche 0)
- Une ville du risque jugée fausse : Lyon (14 km), il attendait le Mont d'Or, absent des deux sources (zone légale, pas relief). Sous le seuil d'arrêt : on continue ; rejugé à la démo.
- Saint-Étienne, Annecy classées ; 10 premières à « 10 km » (villages des Vosges, du Cantal, de Haute-Loire) : « ça me va ».
- À signaler dans la spec d'immobilier : D12 « maisons 1 → 0 » est faux, Île-de-Sein reste sans prix (aucune vente, pas d'intercommunalité).
## Preuves
- T0 : docs/plans/2026-10-15-cadre-de-vie/mesure-tache-0.md
- T1 : mesure-tache-0.md § Tâche 1 ; captures/T1-acheter-5000.png (32 833 communes, écran inchangé)
- T3 : captures/T3-*.png, T3-preuve.txt, T3-npm-test.txt ; capture T3-choix-390 ouverte par l'orchestrateur (268 communes, deux tailles, mer 50 km)
- T2 : captures/T2-*.png (écran inchangé ; fiche de Desvres « Estimation tous biens (trop peu de ventes d'appartements) », ouverte par l'orchestrateur) ; captures/T2-npm-test.txt
## Coût
- T0 : 1 builder, 29 min, 207 k jetons, 66 outils.
- T1 : 1 builder, 17 min, 198 k jetons, 93 outils.
- T2 : 1 builder, 34 min, 324 k jetons, 168 outils.
- T3 : 1 builder, 51 min, 381 k jetons, 172 outils ; + ≈ 1 h de machine saturée.
