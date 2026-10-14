# Progression — interface-telephone
Début : 2026-10-13 23:20 · Plan : plan.md · Suite au départ : 84 tests unitaires + 153 e2e (2 sautés), tous verts

## Tâches
Tâche 0 : faite — commits 93f07d9..b1f8f14 — preuve : captures/T0-iphone-cas1-champ-cache.png, captures/T0-iphone-mesures.txt (2026-10-13 23:35) — ≈ 40 min dont 5 min de Vincent — agent : 237 k jetons — rapport : taches/T0.md. Cause : Safari note la place du champ avant notre code puis la centre à l'ouverture du clavier (165 px mesurés, 165,3 calculés). « + Ajouter un proche » non joué : à essayer en tâche 4.
Tâche 1 : faite — commits 979511c..009ea6f — preuve : captures/T1-ouverture-390x664.png, T1-ouverture-375x548.png (2026-10-14 00:41) — ≈ 57 min — agent : 149 k jetons — rapport : taches/T1.md. Zoom 3 : 3 tuiles, ≈ 328 Ko compressées ; 286 communes de 1 px au plus absentes du zoom 3 (H14).
Tâche 2 : faite — commits 13db79d..3a23013 — preuve : captures/T2-*.png (bureau avant/après : 0 pixel d'écart ; curseur du loyer 520→538 à 375 × 548) (2026-10-14) — ≈ 3 h 20 — agent : 318 k jetons — rapport : taches/T2.md. Question à Vincent (test d'AC-1 sous le bouton zoom) : option A, boutons de zoom masqués pendant la lecture.
Tâche 3 : faite — commits 5765c52..7a63ab4 — preuve : captures/T3-*.png, version construite 5765c52 (2026-10-14) — ≈ 33 min — agent : 214 k jetons — rapport : taches/T3.md. Barre repliée 51 px ; rond « 1 · 2 » immobile au repli (x 89,32 ; y 74). 24 tests ignorés : 22 propres à une largeur, 2 d'avant la tranche.

## Décisions prises à la place de Vincent
- T0 : mesure par une page relais sur le Wi-Fi (sans câble ni console) au lieu de la console Safari par câble du plan ; mesure sur le serveur de dev (le plan le disait). Coût si faux : aucun, la cause est appuyée par trois mesures concordantes.
- T1 : le jeu d'AC-1 produit par `tuiles.py` (une seule source) ; sans tuiles vides (le faux serveur répond déjà une tuile vide) ; couleur lue au centre des carrés, ronds masqués ; test seulement dans le projet mobile. Coût si faux : un test d'AC-1 à recaler, aucun effet pour l'utilisateur.
- T2 : « ← Les 10 premières » mène déjà à l'onglet de la liste (sinon des tests existants cassaient) ; `main` en `overflow-clip` (la page glissait de 21 px) ; `Proches.tsx` touché hors liste (focus après « Ajouter » sans défilement, `scroll-mt-1`). Coût si faux : à 390 × 844, le titre « Tes proches » passe sous les onglets après l'ajout d'un second proche (à revoir en tâche 4 ou en relecture).
- T2 : à 390 × 664 la carte s'ouvre maintenant au zoom 4,04 ; seule la fenêtre 375 × 548 prouve encore les tuiles du zoom 3 dans AC-1.
- T3 : repli par glissement vers le bas (`translateY`) plutôt que par changement de hauteur (la fiche courte s'anime aussi) ; jetons `taille-barre-feuille` (51) et `geste` (300 ms, 10 / 80 px, 400 ms) ajoutés au contrat ; AC-3 amène « Taille de ville » à l'écran avant de le glisser (sous l'écran à 390 × 844) ; test du clic fantôme à 390 × 664, animations réduites ; « Chargement… » et l'erreur restent au centre de la bande (pas de repli dans ces états). Coût si faux : un relecteur qui mesure la boîte de la feuille repliée trouve sa hauteur ouverte (la partie visible fait 51 px).

## Preuves

## Coût
