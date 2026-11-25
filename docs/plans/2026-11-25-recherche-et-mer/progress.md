# Progression — recherche-et-mer
Début : 2026-11-25 23:24 · Plan : plan.md · Suite au départ : Vitest 397 tests, 397 verts (24 fichiers) ; Playwright 473 verts, 48 sautés (17,2 min)

Ordre du plan : 0a → 0c → arrêt (envoi openrouteservice par Vincent, accord sur le tableau de recalage) → 1 → 2 → 4 → 3a → 0b → 3b → simplification → relectures → démo.

## Tâches
Tâche 0a : faite — commits 420aa85..65ddb54 — preuve : mesure-tache-0.md (contrôles des codes, 92 requêtes prévues), codes-postaux.json relu (75015 → 75056, 33000 → 33063, 01300 → 22 communes), 109 738 octets en brotli -q 3, aucun ors-mer.jsonl (rien d'envoyé) (2026-11-26 00:20) — 35 min — agent : 220 k jetons — rapport : taches/T0a.md. Vérifié : Vitest 411 verts, types, construction ; Playwright 473 verts, 48 sautés (17,1 min), comme au départ.
Tâche 0c : faite — commit da833af — preuve : recalage.py relancé (61 critères changés, 0 reste en km, 27 fichiers de tests, 1 moitié exacte), Portmer 62,5 → 63 recalculé à la main (2026-11-26 00:45) — 21 min — agent : 415 k jetons — rapport : taches/T0c.md. Aucun code, test ni acceptance.json touché.
**Arrêt prévu** (2026-11-26 00:45) : envoi openrouteservice par Vincent ; accord sur recalage.md (3 choix soumis).
**Accord de Vincent** (2026-11-26) : recalage.md validé tel quel (correspondance 10 → 15, 30 → 30, 50 → 60, 100 → 90 min) ; cadre-de-vie AC-9 réécrit (`mer-min=90` puis `mer-min=30`) ; test « empreinte » de proches-etats laissé sans minutes (« ≈ 1 min »). Envoi openrouteservice : lancé par Vincent, en attente de « TERMINÉ ».

## Décisions prises à la place de Vincent
- T0a, décidé par Claude : aucun paramètre de rayon envoyé (la matrice n'en a pas ; défaut serveur 2 000 m, distance d'accroche gardée pour 0b).
- T0a, décidé par Claude : les bacs restent (les écarter = ≥ 1 390 requêtes) ; Blaye au tableau de crédibilité.
- T0a, décidé par Claude : lot d'essai Bordeaux, Caen, Mont-de-Marsan.
- T0a, décidé par Claude : un lot en échec n'est noté qu'après la réussite d'un lot suivant (une panne du service ne rend pas des communes « sans temps »).
- T0a, décidé par Claude : `sources.py --codes-postaux` ne télécharge que ce fichier.

## Retours à traiter à la démo

## Preuves

## Coût
