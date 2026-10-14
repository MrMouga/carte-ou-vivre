# Progression — immobilier
Début : 2026-10-14 16:09 · Plan : plan.md · Suite au départ : 88 tests unitaires + 189 e2e verts (30 sautés)

## Tâches
Tâche 0 : faite — commits 7f47d4d..d8f4ca5 — preuve : mesure-tache-0.md, captures/T0-site-vraies-donnees.png (2026-10-14 16:16) — ≈ 10 min — agent : 134 k jetons — rapport : taches/T0.md. Comptes par source identiques aux mesures de la spec (écart 0) ; loyer des maisons : 0 commune sans, 3 543 estimations propres ; achat.json 1,44 Mo brut, 228 Ko gzip, 166 Ko brotli. Vérifié par l'orchestrateur : types, build, 96 unitaires + 189 e2e verts (30 sautés).
Test du risque (fin de tâche 0) : **en discussion avec Vincent** — il demande d'où viennent les prix et propose une moyenne 2024-2026. Faits relevés : 2026 absent (fichier du 17/07/2026 arrêté à 2025-12) ; moyenne 2024-2025 calculable par le fichier mensuel `stats_dvf.csv` (277 Mo) ; elle réduit les communes à prix propre de 6 272 à 4 407 (appartements) et de 30 912 à 24 192 (maisons). Arrêt avant la tâche 1.
Décision de Vincent (16:55) : prix d'achat = médiane 2023-2025 (approchée depuis le fichier mensuel d'Etalab) si la commune compte au moins 30 ventes sur 2023-2025, sinon médiane exacte 2021-2025 si au moins 5 ventes, sinon l'intercommunalité. Amende D5, H61, H62 à la démo. Tâche 0 reprise par le même builder.

## Décisions prises à la place de Vincent
- Orchestrateur : Vincent a demandé « Choisis pour moi » pour les 5 communes du test du risque (tâche 0) : Nantes, La Rochelle (17), Annecy, Saint-Malo, Lacanau. Coût si faux : le test vaut moins si Vincent les connaît mal.

- T0 : Paris, Lyon, Marseille en maison selon H67 à la lettre (arrondissements estimés compris dans la moyenne : Paris maison 12 481 €/m² au lieu de 16 562) — **gardé par Vincent le 2026-10-14**.
- T0 : format de achat.json (champs + lignes, sources en toutes lettres) ; arrondissements moyennés à 2 décimales ; contrôle des comptes à 5 % ou 5 communes ; 4 îles sans intercommunalité sans repli (seule Île-de-Sein reste sans prix) ; 13 communes de Moselle restent inconnu-alsace-moselle ; empreinte du fichier DVF vérifiée par communes.py. Coûts si faux : voir taches/T0.md.
- Orchestrateur : la règle de Vincent s'applique aussi à l'intercommunalité (récent si 30 ventes 2023-2025, sinon 2021-2025). Coût si faux : un prix du secteur un peu plus ancien ou plus récent.

## Preuves

## Coût
