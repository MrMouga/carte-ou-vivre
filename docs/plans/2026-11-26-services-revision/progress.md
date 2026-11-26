# Progression — services, révision D19, D20
Début : 2026-11-26 19:59 · Plan : plan.md · Suite au départ : Vitest 456 tests, 436 verts, 20 rouges (attendus : fixture révisée au commit `bc13bcc`, voir plan) ; jetons OK (49 fichiers) ; Playwright 465 verts, 48 rouges, 53 sautés, 1 non lancé (13,2 min) — les 48 rouges sont tous dans `tests/e2e/services.spec.ts` (bureau et mobile), même cause. Sorties gardées : la tâche 0 les copie dans `mesure-tache-0.md`

## Tâches
Tâche 0 : faite — commits ad386e7..45490a0 — preuve : mesure-tache-0.md, credibilite-urgences.md (10 « même côté », 1 base de SMUR seule : Chamonix), captures/T0-sortie-services.txt, T0-comparer-services.txt (9 chaînes + `commerce` identiques), T0-page-dev-fiche.png ; vérifié par l'orchestrateur de 20:52 à 21:06 (services.py relancé : 33 contrôles « ok », `services.json` identique, sha256 5534978e… ; AC-13 révisé exact ; poids sans `commerce` 330 752 en gzip -9 ; Vitest 437 verts / 19 rouges = départ moins AC-5 ; types : erreurs seulement dans `src/domain/services.test.ts`, non touché, réparé en tâche 1 ; build OK ; Playwright 465 verts / 48 rouges, tous `services.spec.ts`, comme au départ ; capture relue) — 38 min (limite de tours atteinte pendant sa suite Playwright, reprise seule) — agent : 319 k jetons — rapport : taches/T0.md — AC-5 passe

## Décisions prises à la place de Vincent
- T0 (constructeur, vérifié) : le contrôle de poids de `services.py` porte sur le fichier sans `commerce` (330 752 octets en gzip -9) ; avec la chaîne provisoire, le fichier servi pèse 351 117 (au-dessus de 350 000) jusqu'à la tâche 2. Coût si faux : aucun, rien n'est poussé avant la tâche 2.
- T0 : le test AC-5 compare la sortie du script à une liste de services écrite dans le test (la table de la page n'a les 11 services qu'en tâche 1). Coût : la tâche 2 retire `commerce` de cette liste.
- T0 : sources du tableau des urgences : BPE 2025 géolocalisée pour trouver les services D106 les plus proches, page de l'hôpital pour dire accueil ou SMUR, FINESS d'octobre 2026 (Licence Ouverte, 113 Mo dans `data-raw/finess-2026-10/`, non versionné) en seconde source seulement (incomplète : ni Auch ni Pasteur à Nice).
- T0 : Chamonix-Mont-Blanc compté « base de SMUR seule » (1 sur 10, sous le seuil d'arrêt de 2) ; « Urgences : 4 min » (valeur d'AC-13) alors que l'accueil toute l'année est à Sallanches (34 min). À juger à la démo.
- T0 : Tende, supermarché « plus d'une heure » pour 27 min réels (Breil-sur-Roya) : même côté des pastilles, donc pas « faux » selon H205 ; signalé sans retrait. À juger à la démo.
- T0 : mesures.md écrit 174 communes « au-delà d'une heure » pour les urgences ; ses propres totaux donnent 166, la valeur trouvée. mesures.md n'est pas retouché (fichier de la spec).

## Preuves
Tests existants modifiés :
- T0 : `scripts/data/services.test.ts`, test « AC-5 » : fixture `commune_X_commerce` → `commune_X_supermarche`, attendu de X `supermarche: 9` (plus `commerce: 4` provisoire), colonne D106 dans l'en-tête du CSV d'essai, titre au texte révisé — AC-5 révisé (D20), H208, accord du plan. Y, Z, V, W, arrondis et ville à arrondissements inchangés.

## Coût
