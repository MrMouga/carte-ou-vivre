# Progression — proches-fiables
Début : 2026-10-16 01:44 · Plan : plan.md (validé par délégation de Vincent) · Suite au départ : Vitest 202 / 202 ; Playwright 298 verts, 35 sautés, 1 rouge (AC-7 de cadre-de-vie, instable sous charge pendant T0 : vert 3 fois sur 3 relancé seul) — [captures/depart-npm-test.txt](captures/depart-npm-test.txt)

Vincent dort et a délégué l'exécution (« J'te fais confiance sur l'exécution du plan », 2026-10-16) : aucune question en cours de route ; arrêt et note ici si une action demande son accord.

## Tâches
Tâche 0 : faite — commits f16889b, 5f04111 (leçon) — preuve : [mesure-tache-0.md](mesure-tache-0.md) (2026-10-16 02:00) — 17 min — agent : 76 k — rapport : taches/T0.md

## Décisions prises à la place de Vincent
- T0 : adresses de mesure à Toulouse (place du Capitole) et Lyon (place Bellecour) ; mesure par Node (sans cache) plutôt que dans un navigateur ; trois séries à la suite (01:45 à 01:59) au lieu d'une seconde série 1 h plus tard ; deux petites mesures en plus (grandes zones seules, cache dans Chromium avec un serveur local).
- Orchestrateur, après T0 : **le second essai d'une zone part avec `cache: 'reload'`** (il ne relit pas le cache du navigateur). Pourquoi : l'IGN renvoie ses erreurs (500, 502, 504) avec `cache-control: private, max-age=1814400` (21 jours) ; un `fetch` ordinaire rend l'erreur gardée sans rien redemander, ce qui annulerait le second essai (R33) et le recalcul (R36). Les réponses réussies restent en cache (elles sont justes et rendent un recalcul rapide). Coût si faux : aucun visible ; au pire une demande de plus à l'IGN. C'est probablement aussi pourquoi « Trajets indisponibles » restait sur l'iPhone et le PC de Vincent après la démo.

## Preuves
- T0 : cette nuit (01:45–01:59), 9 proches mesurés selon R33, plafond 2 h : 0 prêt, 7 partiels, 2 km ; la zone de 3 h arrive avant 45 s 2 fois sur 9 ; une 504 arrive toujours vers 60 s (donc jamais redemandée à 45 s) ; La Rochelle à 121 km à vol d'oiseau de 12 rue de la Paix (ne passe pas à 120 km).

## Coût
- T0 : 17 min, 76 k jetons.
