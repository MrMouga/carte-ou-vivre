# Progression — immobilier
Début : 2026-10-14 16:09 · Plan : plan.md · Suite au départ : 88 tests unitaires + 189 e2e verts (30 sautés)

## Tâches
Tâche 0 : faite — commits 7f47d4d..d8f4ca5 — preuve : mesure-tache-0.md, captures/T0-site-vraies-donnees.png (2026-10-14 16:16) — ≈ 10 min — agent : 134 k jetons — rapport : taches/T0.md. Comptes par source identiques aux mesures de la spec (écart 0) ; loyer des maisons : 0 commune sans, 3 543 estimations propres ; achat.json 1,44 Mo brut, 228 Ko gzip, 166 Ko brotli. Vérifié par l'orchestrateur : types, build, 96 unitaires + 189 e2e verts (30 sautés).
Test du risque (fin de tâche 0) : **en discussion avec Vincent** — il demande d'où viennent les prix et propose une moyenne 2024-2026. Faits relevés : 2026 absent (fichier du 17/07/2026 arrêté à 2025-12) ; moyenne 2024-2025 calculable par le fichier mensuel `stats_dvf.csv` (277 Mo) ; elle réduit les communes à prix propre de 6 272 à 4 407 (appartements) et de 30 912 à 24 192 (maisons). Arrêt avant la tâche 1.
Décision de Vincent (16:55) : prix d'achat = médiane 2023-2025 (approchée depuis le fichier mensuel d'Etalab) si la commune compte au moins 30 ventes sur 2023-2025, sinon médiane exacte 2021-2025 si au moins 5 ventes, sinon l'intercommunalité. Amende D5, H61, H62 à la démo. Tâche 0 reprise par le même builder.
Tâche 0 (reprise) : faite — commit 07f48cd — preuve : mesure-tache-0.md section 16:50 (2026-10-14) — ≈ 16 min — agent : 189 k jetons — rapport : taches/T0.md § Reprise. Règle 1 (récent) : 2 429 appart., 9 925 maisons ; comptes par source inchangés ; Bordeaux 4 233 / 5 067 €/m². Vérifié par l'orchestrateur : types, build, 97 unitaires + 189 e2e verts (30 sautés), achat.json relu.
Test du risque : **réussi** — Vincent juge 0 ou 1 prix faux sur Nantes, La Rochelle, Annecy, Saint-Malo, Lacanau, Bordeaux et Saint-Vincent-de-Paul (17:20). On continue.
Tâche 1 : faite — commits f779e68..e109491 — preuve : captures/T1-vitest-domain.txt, T1-avant-1440.png / T1-apres-1440.png (écart = bruit du rendu), T1-achat-5000-vraies-donnees.png (2026-10-14 17:55) — ≈ 18 min — agent : 209 k jetons — rapport : taches/T1.md. Vérifié par l'orchestrateur : types, construction, 138 unitaires + 189 e2e verts (30 sautés).
Décisions de Vincent (18:10) sur deux constats de la tâche 1 : (1) un prix d'achat sous 300 €/m² n'est pas retenu, la commune passe au niveau suivant (160 prix concernés, ex. Guérigny 21 €/m², Civray 26 €/m²) ; (2) une commune sans prix vient toujours après les communes qui ont un prix dans la liste et le rang (score et couleur inchangés) — remplace H4 étendue ; amende D6, R24, R25 à la démo. Renvoyé au même builder.

## Décisions prises à la place de Vincent
- Orchestrateur : Vincent a demandé « Choisis pour moi » pour les 5 communes du test du risque (tâche 0) : Nantes, La Rochelle (17), Annecy, Saint-Malo, Lacanau. Coût si faux : le test vaut moins si Vincent les connaît mal.

- T0 : Paris, Lyon, Marseille en maison selon H67 à la lettre (arrondissements estimés compris dans la moyenne : Paris maison 12 481 €/m² au lieu de 16 562) — **gardé par Vincent le 2026-10-14**.
- T0 : format de achat.json (champs + lignes, sources en toutes lettres) ; arrondissements moyennés à 2 décimales ; contrôle des comptes à 5 % ou 5 communes ; 4 îles sans intercommunalité sans repli (seule Île-de-Sein reste sans prix) ; 13 communes de Moselle restent inconnu-alsace-moselle ; empreinte du fichier DVF vérifiée par communes.py. Coûts si faux : voir taches/T0.md.
- Orchestrateur : la règle de Vincent s'applique aussi à l'intercommunalité (récent si 30 ventes 2023-2025, sinon 2021-2025). Coût si faux : un prix du secteur un peu plus ancien ou plus récent.
- T0 reprise : une intercommunalité répétée par département dans le fichier mensuel n'est comptée qu'une fois (459 communes passent du prix récent de leur intercommunalité à son prix 2021-2025) ; la règle (1, 2, 3) n'est pas écrite dans achat.json. Coût si faux : une colonne à ajouter si la fiche doit un jour dire la période.
- À amender dans la spec à la démo : D5, H61, H62, « C'est réussi si » et l'étape 4 (Bordeaux 4 233 €/m² au lieu de 4 427).
- T1 : plafond du prix gardé dans `Reglages.loyer` même en Acheter (des critères protégés de loyer-mer comparent les réglages à `{ loyer, mer, tailles }`) ; champs nouveaux de `Commune` facultatifs ; Louer · Au m² avec plafond invalide dans l'adresse → 23 €/m² ; la raison « loyer inconnu » gardée (code mort signalé, un critère de loyer-mer lit son texte). Entre les tâches 1 et 2, une adresse en Acheter est calculée mais l'écran montre encore le loyer : ne rien publier entre deux. Coûts : voir taches/T1.md.

## Preuves

## Coût
