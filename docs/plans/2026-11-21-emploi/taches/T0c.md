# Tâche 0c — La ville principale du bassin de Confolens
Statut : faite · Début 17:50 (horloge de la machine : premiers relevés à 17:49) · Fin 17:51 · Commits : e859410 (+ ce rapport)

## Ce que l'utilisateur peut faire maintenant
Rien de visible encore (le site ne lit pas `emploi.json` avant la tâche 1). Les données sont prêtes : le bassin « CONFOLENS » (7503) a pour ville principale **Terres-de-Haute-Charente** (16192, 3 777 hab.), la plus peuplée de ses 135 communes de Charente, et non plus Castelnau-de-Médoc (33104, 4 907 hab., dans le Médoc). La fiche d'une commune de Charente limousine dira donc « bassin de Terres-de-Haute-Charente ».

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-8 | `scripts/data/emploi.test.ts` (calcul sur l'extrait inventé) | vert (suite unitaire 316/316) |
| AC-12 | contrôles du vrai calcul, `captures/T0c-controles-emploi.txt` : M2X90 39 au niveau « 10 », 98 aux niveaux « 10 » ou « 25 », 120 chiffrés ; Bordeaux 742 projets au niveau « 10 » ; La Rochelle sans chiffre | tous « ok » |
| H135 amendée | contrôles ajoutés à `scripts/data/emploi.py` : bassin 7503 sur deux départements dont le 16 (`{'16': 135, '33': 12}`) ; ville retenue = 16192 ; sur les 389 villes principales, seule celle de 7503 diffère de la règle | tous « ok » |

## Preuves
- `docs/plans/2026-11-21-emploi/captures/T0c-controles-emploi.txt` — sortie complète de `python3 -I scripts/data/emploi.py` : tous les contrôles « ok », dont l'exception (« bassin 7503 (CONFOLENS) → Terres-de-Haute-Charente (16192, 3777 hab.), plus peuplée de ses 135 communes du 16 ; par la règle : Castelnau-de-Médoc (33104, 4907 hab.) ») et AC-12 ; `public/data/emploi.json` réécrit (1 496 506 octets, même taille : un code de 5 chiffres remplace un autre) (2026-11-21 17:49)
- `docs/plans/2026-11-21-emploi/captures/T0c-compte.txt` (script `captures/T0c-compte.mjs`, qui reprend `T0b-voisinage.mjs` et la `distanceKm` du site, comme `T0b-sonde-7503-effet.mjs`) — comparaison de l'`emploi.json` d'avant (celui du commit 10f39bf) à celui d'après : 389 bassins, **1 différence** (7503 : Castelnau-de-Médoc (33104) → Terres-de-Haute-Charente (16192)) ; métiers, zones, communes, trimestre identiques ; **V1X80 à « 10 % » : 6 192 communes avant, 6 275 après** (+83, le chiffre annoncé par la sonde de 0b) ; **M2X90 à « 10 % » : 4 588 avant et après** (2026-11-21 17:49)

## Suite de tests
- Unitaires : `Test Files  21 passed (21)` · `Tests  316 passed (316)`
- Types : `tsc --noEmit -p .` sans erreur
- Build : `✓ built in 1.86s` (avertissement habituel de taille de morceau > 500 kB)
- e2e : non lancée (non exigée : le site ne lit pas encore `emploi.json`)

## Décisions prises à la place de Vincent
- Décision : la ville attendue (16192) est écrite en dur dans le script, en plus de la règle « la plus peuplée de la partie charentaise » ; le script s'arrête si la règle en donne une autre — pourquoi : le choix de Vincent nomme Terres-de-Haute-Charente ; si les populations changent, mieux vaut s'arrêter que changer de ville en silence — coût si c'est faux : un arrêt du script à la prochaine mise à jour des populations, à lever en changeant un code.
- Décision : l'exception est écrite comme une petite table (`VILLE_PAR_DEPARTEMENT = {'7503': ('16', '16192')}`) et le contrôle « une seule différence » compare chaque ville à la règle de H135 à chaque calcul, dans le script lui-même — pourquoi : la garantie reste vraie aux prochains calculs, pas seulement aujourd'hui — coût si c'est faux : aucun.
- Décision : dans `mesure-tache-0.md`, les anciens chiffres du tableau 0b (6 192, « Castelnau-de-Médoc 339 ») sont laissés tels quels, avec une ligne « Correction 0c » qui dit qu'ils datent d'avant — pourquoi : c'est la trace de la mesure de 0b — coût si c'est faux : un lecteur pressé lit l'ancien chiffre ; la ligne de correction suit juste le paragraphe sur le bassin 7503.

## Fichiers touchés hors de la liste de la tâche
- aucun (`captures/T0c-compte.mjs` et `captures/T0c-compte.txt` entrent dans `captures/T0c-*`)

## Tests existants modifiés
- aucun

## Leçons écrites
- aucune (pas de correction en plusieurs essais, pas de mesure contraire au plan)
