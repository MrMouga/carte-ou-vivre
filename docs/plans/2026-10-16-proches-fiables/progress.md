# Progression — proches-fiables
Début : 2026-10-16 01:44 · Plan : plan.md (validé par délégation de Vincent) · Suite au départ : Vitest 202 / 202 ; Playwright 298 verts, 35 sautés, 1 rouge (AC-7 de cadre-de-vie, instable sous charge pendant T0 : vert 3 fois sur 3 relancé seul) — [captures/depart-npm-test.txt](captures/depart-npm-test.txt)

Vincent dort et a délégué l'exécution (« J'te fais confiance sur l'exécution du plan », 2026-10-16) : aucune question en cours de route ; arrêt et note ici si une action demande son accord.

## Tâches
Tâche 0 : faite — commits f16889b, 5f04111 (leçon) — preuve : [mesure-tache-0.md](mesure-tache-0.md) (2026-10-16 02:00) — 17 min — agent : 76 k — rapport : taches/T0.md

Tâche 1 : faite — commits 5d1eb0c..57546e0 — preuve : captures/T1-AC-1-demandes.txt, T1-ign-reel-demandes.txt, verif-T1.txt (2026-10-16 07:58) — 26 min de travail (5 h 40 d'horloge : machine en veille de 02:05 à 07:20) + 12 min pour la question — agent : 224 k + 198 k — rapport : taches/T1.md

Tâche 2 : faite — commits a82595d..0ad144a — preuve : captures/T2-390-ligne.png, T2-bureau.png, T2-preuve-sortie.txt (08:55), verif-T2.txt (09:09) — 37 min — agent : 207 k — rapport : taches/T2.md

## Décisions prises à la place de Vincent
- T0 : adresses de mesure à Toulouse (place du Capitole) et Lyon (place Bellecour) ; mesure par Node (sans cache) plutôt que dans un navigateur ; trois séries à la suite (01:45 à 01:59) au lieu d'une seconde série 1 h plus tard ; deux petites mesures en plus (grandes zones seules, cache dans Chromium avec un serveur local).
- Orchestrateur, après T0 : **le second essai d'une zone part avec `cache: 'reload'`** (il ne relit pas le cache du navigateur). Pourquoi : l'IGN renvoie ses erreurs (500, 502, 504) avec `cache-control: private, max-age=1814400` (21 jours) ; un `fetch` ordinaire rend l'erreur gardée sans rien redemander, ce qui annulerait le second essai (R33) et le recalcul (R36). Les réponses réussies restent en cache (elles sont justes et rendent un recalcul rapide). Coût si faux : aucun visible ; au pire une demande de plus à l'IGN. C'est probablement aussi pourquoi « Trajets indisponibles » restait sur l'iPhone et le PC de Vincent après la démo.

- T1 (builder) : le délai de 45 s vit dans `zones()` ; mémoire de la page = temps comme avant + liste des zones obtenues (« jusqu'à » et « plus de » s'en déduisent) ; `classer` inchangé ; `etatDe` prend le plafond en minutes (un plafond en km donne le même nombre, H94) ; à rang égal hors partiel, l'ancien résultat reste ; faux IGN : pannes par plage rendues en 502, erreur après le délai d'une zone, corps et en-têtes réels de T0 ; trois tests hors critères (panne → « indisponible ») attendent 15 s au lieu de 5 s (une panne totale fait 24 demandes, ≈ 6 s), réécrits en T3a/T3b.
- Orchestrateur, question de T1 : le test d'AC-10 de proches est retiré en T1 au lieu de T3a (même retrait, déjà accepté par Vincent avec D18 ; il échouait à cause du délai de la panne totale). Coût si faux : de T1 à T3a, l'affichage après une panne totale n'est couvert que par des tests hors critères.
- T2 (builder) : jusqu'à T4, un proche partiel s'écrit dans la mémoire comme non prêt (il revient « Trajets indisponibles » à la réouverture, avant toute mise en ligne) ; les zones obtenues passent au score pour écrire « jusqu'à » et « plus de » dans les raisons (calcul inchangé) ; formats dans `format.ts` (`tempsProche`, `phrasesPartiel`) ; « approximatif » après « en calcul » et « en attente » dans le résumé ; lien « Recalculer avec l'IGN » sans action jusqu'à T5b ; curseur d'un proche partiel à l'échelle 15 min → couverture (la poignée de 2 h est plus à droite que pour un proche prêt).

## Preuves
- T0 : cette nuit (01:45–01:59), 9 proches mesurés selon R33, plafond 2 h : 0 prêt, 7 partiels, 2 km ; la zone de 3 h arrive avant 45 s 2 fois sur 9 ; une 504 arrive toujours vers 60 s (donc jamais redemandée à 45 s) ; La Rochelle à 121 km à vol d'oiseau de 12 rue de la Paix (ne passe pas à 120 km).

- T1 : sur le vrai IGN ce matin (07:30–07:40), très dégradé (4 ou 5 zones sur 12), la zone de 75 min refusée par une route est redemandée et l'IGN la donne au second essai ; arrêt à 45 s vérifié ; le proche finit km (couverture 1 h 15 à 1 h 30) — la preuve « 13 demandes, proche prêt » n'a pu être faite que sur le faux IGN (AC-1). Suite relancée par l'orchestrateur à 07:58 : Vitest 227/227, Playwright 300 verts, 35 sautés, types et build OK.
- T2 : fixture, bureau et 390 px : ligne d'un proche partiel avec ses deux phrases, fiche de Grandeville « jusqu'à 2 h 30 ». Suite relancée par l'orchestrateur à 09:09 : Vitest 237/237, Playwright 304 verts, 35 sautés, 1 rouge = AC-7 de cadre-de-vie (instable sous charge 5 ; vert 3/3 relancé seul, aux deux largeurs) ; types et build OK.

## Coût
- T0 : 17 min, 76 k jetons.
- T1 : 26 min + 12 min, 422 k jetons.
- T2 : 37 min, 207 k jetons.
