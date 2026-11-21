# Progression — emploi
Début : 2026-11-21 15:54 · Plan : plan.md · Suite au départ : Vitest 315 / 315 ; jetons : 42 fichiers, aucune valeur arbitraire ; Playwright 381 verts, 38 sautés, 0 rouge (11,7 min, fin 16:06)

## Tâches
Tâche 0a : arrêt (question, condition d'arrêt H143) — commits 7015a9f..fb9cda9 (rapport et preuves, aucun code) — preuve : captures/T0a-licence-bassins.txt, T0a-sonde-clpe.py (16:08-16:12) — 5 min — agent : 153 k — rapport : taches/T0a.md
  Vérif orchestrateur (16:16) : commits présents ; preuve relue (5 endroits cherchés, aucune licence ; piste des comités locaux mesurée et fermée : 20 058 communes sans bassin) ; la recherche disait déjà « licence non écrite, à confirmer en tâche 0 ». Table de la Dares : pas ouverte → liste à la main (H134), à montrer à la démo. **Question posée à Vincent.**
  Réponse de Vincent (16:20) : s'en servir, sans écrire à France Travail ; mention « Projets de recrutement et bassins d'emploi : France Travail, enquête Besoins en main-d'œuvre 2026 (table des bassins mise à jour le 17/04/2026) ». H143 amendée sur place dans details.md (AC-1 lit la mention par « contient » : inchangé). Tâche 0a relancée en entier.
  Second arrêt (commits 3c865ed..f5606f1) : Yvrench (80832) absente de la table des bassins sans mouvement COG ; tous les autres contrôles passent par une sonde (captures/T0a-controles-sonde-yvrench.txt). Vérif orchestrateur (16:48) : ÉCHEC relu dans T0a-controles-emploi.txt, voisine à 0,8 km relue. Réponse de Vincent (16:50) : règle « la commune la plus proche » ; H142 amendée sur place.
Tâche 0a : faite — commits 7015a9f..75139e6 — preuve : captures/T0a-controles-emploi.txt (35 contrôles ok, 16:52), mesure-tache-0.md (part 0a) — 1 h 05 (dont 2 arrêts pour Vincent) — agent : 286 k — rapport : taches/T0a.md
  Vérif orchestrateur (17:16) : fichiers = liste du plan + leçon `docs/solutions/2026-11-21-table-des-bassins-sur-une-geographie-plus-ancienne.md` ; aucun test existant modifié ; AC-8 dans `scripts/data/emploi.test.ts` ; `emploi.json` relu (tableaux nommés par `champs`, `trimestre_chomage` « 2e trimestre 2026 » avec espaces ordinaires → la tâche 2 met l'insécable à l'affichage, aucune distance) ; Vitest 316 / 316 ; Playwright 381 verts, 38 sautés, 0 rouge (les 2 rouges du builder venaient d'un `npm run build` lancé pendant sa suite) ; types et build verts.

Tâche 0b : mesures faites, en attente du jugement — commits fb74549..86986ce — preuve : mesure-tache-0.md (parts 0b), captures/T0b-* (17:20-17:50) — 32 min — agent : 158 k — rapport : taches/T0b.md
  Vérif orchestrateur (17:55) : seuls des fichiers du dossier du plan ; aucun code du site ; poids 165 Ko brotli / 234 Ko gzip ; +254 ms en Fast 4G ; distances 154 ms + 14 ms (processeur ÷ 4, seuil 300) ; M2X90 « 10 % » = 4 588 communes (AC-12) ; La Rochelle → La Roche-sur-Yon 61 km, Pau → Bayonne 92 km.
  Réponses de Vincent (18:00-18:10) : réaction ≈ 133-146 / 216-231 ms **acceptée** (comme mairies, H141) ; bassin 7503 « Confolens » (135 communes de Charente + 12 du Médoc) : ville principale **Terres-de-Haute-Charente** (exception, H135 à amender, `emploi.py` à corriger) ; crédibilité : Vincent demande d'abord une vérification sur le web de la donnée sur 10 métiers (il cite l'Apec : HSE Paris puis Lyon) → agent de recherche lancé, rapport `credibilite-metiers.md` (101 k ; notre fichier reproduit la BMO ; « où » plausible au niveau régional, invérifiable par bassin ; « combien » fragile ; HSE discordant avec l'Apec, raison non prouvée).
  Réponse de Vincent (18:40) : **les trois métiers crédibles** (D3 tient). Il demande s'il faut l'Apec plutôt que France Travail ; réponse de Claude : non (cadres du privé seulement, maille région, aucune licence de réutilisation écrite) ; pistes pour plus tard : offres de France Travail (autre tranche, change D2). H135 amendée (Confolens). Tâche 0b close ; reste la correction de Confolens dans `emploi.py` (T0c).

## Décisions prises à la place de Vincent
- T0a — Monaco (bassin 9399) sans ville principale (`null`) : aucune commune de la carte dedans ; reste dans les 389 et compte dans le classement des niveaux. Coût si faux : un bassin de moins dans le classement décalerait des niveaux à la marge. **La tâche 1 l'ignore pour les distances et « le plus proche ».**
- T0a — Zones d'emploi : table Insee à la géographie 2025 (celle de la carte), jointure directe sans recalage. Coût si faux : aucun, les 34 746 communes ont une zone (contrôle).
- T0a — Lignes BMO répétées par département : des parts aux chiffres différents, additionnées (R45). Coût si faux : projets surcomptés ; les comptes d'AC-12 retombent juste.
- T0a — Les 11 communes absentes sont recalées vers leur **ancien** code (la table des bassins est sur une géographie plus ancienne), et non vers une commune 2026 comme l'écrivait le plan. Coût si faux : aucun, H142 contrôlée.
- T0a — 57 noms courants écrits à la main (`scripts/data/noms-metiers.csv`, table de la Dares non ouverte) : **à montrer à la démo**.
- T0a — Format d'`emploi.json` en tableaux avec `champs`, comme `mairies.json`. Coût si faux : aucun.

## Retours à traiter à la démo

## Preuves

## Coût
