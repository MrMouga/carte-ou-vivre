# Progression — proches
Début : 2026-10-13 13:55 · Plan : plan.md · Suite au départ : 48 tests unitaires et 55 Playwright verts (2 sautés), check-tokens vert
## Tâches
Tâche 0 : faite — commit 564af4b — preuve : mesure-tache-0.md, captures/T0-* (14:18) ; téléphone de Vincent 14,9 s, 12/12 (≈ 15:00) — ≈ 48 min — agent : 215 k jetons — rapport : taches/T0.md — condition d'arrêt atteinte (6 h : 60 s, zones perdues) → Vincent : 3 h au plus (spec D15, D16)
Tâche 1 : faite — commits c6590e0..6106ed5 — preuve : captures/T1-* (≈ 15:05), suite revérifiée (48 unitaires, 61 navigateur, 2 sautés déjà existants) — ≈ 12 min — agent : 104 k jetons — rapport : taches/T1.md

## Décisions prises à la place de Vincent
- T0 : recherche par `/geocodage/search` (rend le code INSEE) au lieu de `/completion` ; le faux service intercepte `search*`. Coût si faux : un aller-retour de plus par recherche (≈ 100–300 ms, 1,3 s mesuré sur le téléphone).
- T0 : file d'appels à 4 requêtes par seconde (à 5 pile, l'IGN refuse la 6e et bloque 5 s). Coût : ≈ 0,5 s de plus par proche.
- T0 : classement des mairies dans un Web Worker natif (40 ms, page fluide ; 106–115 ms figée sur le fil principal, processeur ×4).
- T0 : arrondissements de Paris, Lyon, Marseille ramenés à la ville entière ; outre-mer (97…) écarté de la recherche.
- T0 : un seul moteur d'isochrone utile, `bdtopo-valhalla` (`bdtopo-pgr` rend la même chose, `bdtopo-osrm` ne fait pas d'isochrone).
- T1 : tailles cochées écrites en toutes lettres (plusieurs lignes si besoin) ; titre repliable utilisable pendant le chargement ; ouverture sans animation ; chevron à `taille-echantillon` (14 px). Coût si faux : retouche de style.
## Preuves
- T1 : captures/T1-bureau-ouvertes.png, T1-bureau-repliees.png, T1-390-ouvertes.png, T1-390-repliees.png, T1-npm-test.txt.
- T0 : docs/plans/2026-10-13-proches/mesure-tache-0.md (Mac, navigateur, téléphone), captures/T0-zones-nantes.png (24 zones jusqu'à 6 h), captures/T0-sorties-brutes.txt.
## Coût

## Constats hors tâche (pour les relecteurs)
- Vu en tâche 1, existait avant : à 390 px avec la mer sur « Sans limite », le groupe de ronds « 1·2·…·10 » dépasse du bord droit de l'écran (captures/T1-390-ouvertes.png).
