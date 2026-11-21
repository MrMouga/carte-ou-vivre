# Progression — emploi
Début : 2026-11-21 15:54 · Plan : plan.md · Suite au départ : Vitest 315 / 315 ; jetons : 42 fichiers, aucune valeur arbitraire ; Playwright 381 verts, 38 sautés, 0 rouge (11,7 min, fin 16:06)

## Tâches
Tâche 0a : arrêt (question, condition d'arrêt H143) — commits 7015a9f..fb9cda9 (rapport et preuves, aucun code) — preuve : captures/T0a-licence-bassins.txt, T0a-sonde-clpe.py (16:08-16:12) — 5 min — agent : 153 k — rapport : taches/T0a.md
  Vérif orchestrateur (16:16) : commits présents ; preuve relue (5 endroits cherchés, aucune licence ; piste des comités locaux mesurée et fermée : 20 058 communes sans bassin) ; la recherche disait déjà « licence non écrite, à confirmer en tâche 0 ». Table de la Dares : pas ouverte → liste à la main (H134), à montrer à la démo. **Question posée à Vincent.**
  Réponse de Vincent (16:20) : s'en servir, sans écrire à France Travail ; mention « Projets de recrutement et bassins d'emploi : France Travail, enquête Besoins en main-d'œuvre 2026 (table des bassins mise à jour le 17/04/2026) ». H143 amendée sur place dans details.md (AC-1 lit la mention par « contient » : inchangé). Tâche 0a relancée en entier.
  Second arrêt (commits 3c865ed..f5606f1) : Yvrench (80832) absente de la table des bassins sans mouvement COG ; tous les autres contrôles passent par une sonde (captures/T0a-controles-sonde-yvrench.txt). Vérif orchestrateur (16:48) : ÉCHEC relu dans T0a-controles-emploi.txt, voisine à 0,8 km relue. Réponse de Vincent (16:50) : règle « la commune la plus proche » ; H142 amendée sur place.
Tâche 0a : faite — commits 7015a9f..75139e6 — preuve : captures/T0a-controles-emploi.txt (35 contrôles ok, 16:52), mesure-tache-0.md (part 0a) — 1 h 05 (dont 2 arrêts pour Vincent) — agent : 286 k — rapport : taches/T0a.md
  Vérif orchestrateur (17:16) : fichiers = liste du plan + leçon `docs/solutions/2026-11-21-table-des-bassins-sur-une-geographie-plus-ancienne.md` ; aucun test existant modifié ; AC-8 dans `scripts/data/emploi.test.ts` ; `emploi.json` relu (tableaux nommés par `champs`, `trimestre_chomage` « 2e trimestre 2026 » avec espaces ordinaires → la tâche 2 met l'insécable à l'affichage, aucune distance) ; Vitest 316 / 316 ; Playwright 381 verts, 38 sautés, 0 rouge (les 2 rouges du builder venaient d'un `npm run build` lancé pendant sa suite) ; types et build verts.

Tâche 0b : mesures faites, en attente du jugement — commits fb74549..86986ce — preuve : mesure-tache-0.md (parts 0b), captures/T0b-* (17:18-17:29) — 11 min — agent : 158 k — rapport : taches/T0b.md
  Vérif orchestrateur (17:31) : seuls des fichiers du dossier du plan ; aucun code du site ; poids 165 Ko brotli / 234 Ko gzip ; +254 ms en Fast 4G ; distances 154 ms + 14 ms (processeur ÷ 4, seuil 300) ; M2X90 « 10 % » = 4 588 communes (AC-12) ; La Rochelle → La Roche-sur-Yon 61 km, Pau → Bayonne 92 km.
  Réponses de Vincent (17:33-17:40) : réaction ≈ 133-146 / 216-231 ms **acceptée** (comme mairies, H141) ; bassin 7503 « Confolens » (135 communes de Charente + 12 du Médoc) : ville principale **Terres-de-Haute-Charente** (exception, H135 à amender, `emploi.py` à corriger) ; crédibilité : Vincent demande d'abord une vérification sur le web de la donnée sur 10 métiers (il cite l'Apec : HSE Paris puis Lyon) → agent de recherche lancé, rapport `credibilite-metiers.md` (101 k ; notre fichier reproduit la BMO ; « où » plausible au niveau régional, invérifiable par bassin ; « combien » fragile ; HSE discordant avec l'Apec, raison non prouvée).
  Réponse de Vincent (17:47) : **les trois métiers crédibles** (D3 tient). Il demande s'il faut l'Apec plutôt que France Travail ; réponse de Claude : non (cadres du privé seulement, maille région, aucune licence de réutilisation écrite) ; pistes pour plus tard : offres de France Travail (autre tranche, change D2). H135 amendée (Confolens). Tâche 0b close ; reste la correction de Confolens dans `emploi.py` (T0c).
Tâche 0c (Confolens) : faite — commits e859410..32f3805 — preuve : captures/T0c-controles-emploi.txt, T0c-compte.txt (17:52) — 2 min — agent : 66 k — rapport : taches/T0c.md
  Vérif orchestrateur (17:56) : fichiers = liste autorisée ; `["7503","16192"]` dans `emploi.json` ; contrôle « seule 7503 diffère de la règle » ok ; AC-12 inchangé (M2X90 4 588) ; V1X80 à 10 % : 6 192 → 6 275 communes ; Vitest 316 / 316. Décision du builder : code 16192 écrit dans le script (arrêt si les populations changent).
Tâche 1 : faite — commits 93f7fe7..86968c3 — preuve : captures/T1-fiche-la-rochelle-infirmiers-10-1440x900.png, T1-fiche-pau-*.png, T1-preuves-reel.txt, T1-mesure-distances.txt (174 ms au processeur ÷ 4, contre 168 en 0b), T1-npm-test.txt (18:00-18:14) — 24 min — agent : 235 k — rapport : taches/T1.md
  Vérif orchestrateur (18:28) : `tests/e2e/lib/carte.ts` +40 lignes, 0 changée (conforme au plan) — **le garde-fou des tests protégés n'a de nouveau pas demandé l'accord** (comme à mairies, pour /retro) ; aucun autre test existant modifié ; AC-12 dans `src/domain/emploi.test.ts` (4 tests) ; capture de la fiche de La Rochelle relue (raison exacte d'AC-12) ; Vitest 345 / 345 ; jetons ok ; Playwright 381 verts, 38 sautés, 0 rouge ; types et build verts. Non couvert par T1 : 390 px sur les vraies données, erreur de chargement d'`emploi.json` (à voir en QA). Captures PNG de ~1 Mo chacune, non réduites (mineur, leçon 2026-10-14).

## Décisions prises à la place de Vincent
- T0a — Monaco (bassin 9399) sans ville principale (`null`) : aucune commune de la carte dedans ; reste dans les 389 et compte dans le classement des niveaux. Coût si faux : un bassin de moins dans le classement décalerait des niveaux à la marge. **La tâche 1 l'ignore pour les distances et « le plus proche ».**
- T0a — Zones d'emploi : table Insee à la géographie 2025 (celle de la carte), jointure directe sans recalage. Coût si faux : aucun, les 34 746 communes ont une zone (contrôle).
- T0a — Lignes BMO répétées par département : des parts aux chiffres différents, additionnées (R45). Coût si faux : projets surcomptés ; les comptes d'AC-12 retombent juste.
- T0a — Les 11 communes absentes sont recalées vers leur **ancien** code (la table des bassins est sur une géographie plus ancienne), et non vers une commune 2026 comme l'écrivait le plan. Coût si faux : aucun, H142 contrôlée.
- T0a — 57 noms courants écrits à la main (`scripts/data/noms-metiers.csv`, table de la Dares non ouverte) : **à montrer à la démo**.
- T0a — Format d'`emploi.json` en tableaux avec `champs`, comme `mairies.json`. Coût si faux : aucun.
- T0c — Code 16192 (Terres-de-Haute-Charente) écrit dans `emploi.py` en plus de la règle ; arrêt si les populations changent. Coût si faux : un arrêt à lever.
- T1 — L'adresse garde les codes de métier tels quels jusqu'à la fin du chargement d'`emploi.json` ; le tri de R48 (codes inconnus retirés, puis deux au plus) se fait à l'arrivée. Coût si faux : un code inconnu visible ≤ 1 s dans l'adresse.
- T1 — Un code de métier se reconnaît d'abord à sa forme (`[A-Za-z0-9]+`). Coût : aucun.
- T1 — Types et règle des niveaux dans `score.ts`, lecture / jointure / distances dans `emploi.ts`. Coût : aucun.
- T1 — La raison d'un métier porte aussi son libellé ; sans « plus proche » (jeu sans bassin), elle s'écrit sans parenthèse. Coût : aucun sur les vraies données.
- T1 — Dans `carte.ts`, la ville principale d'un bassin de la fixture est déduite de `distances_km` (la commune à 0 km d'elle-même) ; un bassin dont la ville n'est pas dans le jeu n'est pas servi. Coût : tests seulement.
- T1 — `performance.measure('emploi : villes principales à 30 km')` laissé dans la page. Coût : aucun.

## Retours à traiter à la démo

## Preuves

## Coût
