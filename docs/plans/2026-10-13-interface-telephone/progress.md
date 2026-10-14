# Progression — interface-telephone
Début : 2026-10-13 23:20 · Plan : plan.md · Suite au départ : 84 tests unitaires + 153 e2e (2 sautés), tous verts

## Tâches
Tâche 0 : faite — commits 93f07d9..b1f8f14 — preuve : captures/T0-iphone-cas1-champ-cache.png, captures/T0-iphone-mesures.txt (2026-10-13 23:35) — ≈ 40 min dont 5 min de Vincent — agent : 237 k jetons — rapport : taches/T0.md. Cause : Safari note la place du champ avant notre code puis la centre à l'ouverture du clavier (165 px mesurés, 165,3 calculés). « + Ajouter un proche » non joué : à essayer en tâche 4.
Tâche 1 : faite — commits 979511c..009ea6f — preuve : captures/T1-ouverture-390x664.png, T1-ouverture-375x548.png (2026-10-14 00:41) — ≈ 57 min — agent : 149 k jetons — rapport : taches/T1.md. Zoom 3 : 3 tuiles, ≈ 328 Ko compressées ; 286 communes de 1 px au plus absentes du zoom 3 (H14).

## Décisions prises à la place de Vincent
- T0 : mesure par une page relais sur le Wi-Fi (sans câble ni console) au lieu de la console Safari par câble du plan ; mesure sur le serveur de dev (le plan le disait). Coût si faux : aucun, la cause est appuyée par trois mesures concordantes.
- T1 : le jeu d'AC-1 produit par `tuiles.py` (une seule source) ; sans tuiles vides (le faux serveur répond déjà une tuile vide) ; couleur lue au centre des carrés, ronds masqués ; test seulement dans le projet mobile. Coût si faux : un test d'AC-1 à recaler, aucun effet pour l'utilisateur.

## Preuves

## Coût
