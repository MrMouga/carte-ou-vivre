# Tâche 0b — Les minutes, servies et confrontées
Statut : question · Début 03:13 · Fin 04:05 · Commits : le commit « tâche 0b — minutes de la mer calculées et confrontées » (tout sauf le fichier servi et ses tests ; son numéro : `git log`)

## La question, d'abord
**Un test de plus que celui accordé doit changer pour servir la colonne `mer_min`.** Le plan n'accorde que la ligne 76 de `scripts/data/communes.test.ts`. Mais `src/domain/score.test.ts`, ligne 203 (test « les deux colonnes lues sont `type_env` et `montagne_km`, à la suite des 9 de loyer-mer et d'immobilier », tranche cadre-de-vie, **sans numéro de critère**) vérifie que les colonnes à partir de la 10e sont exactement `type_env` et `montagne_km`. Avec `mer_min` à la fin, il casse. C'est le seul test qui casse (vérifié : suite unitaire avec le changement ci-dessous, 453 verts sur 453).

Options :
1. **Changer la ligne 203** : `fichier.champs.slice(9)` → `fichier.champs.slice(9, 11)`. Le test garde son sens exact (les deux colonnes de cadre-de-vie suivent les 9 premières) et ne regarde plus ce qui vient après. Coût : un test hors critère modifié, une ligne. **Ma recommandation.**
2. Changer la ligne 203 en ajoutant `mer_min` à la liste attendue (`['type_env', 'montagne_km', 'mer_min']`). Coût : le même, mais le titre du test ne dit plus ce qu'il vérifie.
3. Ne pas mettre `mer_min` à la fin de `communes.json` (fichier à part). Coût : contraire au plan (« une colonne `mer_min` à la fin ») et une requête de plus à l'ouverture ; à écarter.

Avec l'option 1, la suite complète passe : Vitest 453 sur 453, types, construction, et Playwright (voir « Suite de tests »), mesurés sur l'état complet.

## Ce que l'utilisateur peut faire maintenant
Rien de visible à l'écran (prévu : la tâche 3b branchera les minutes).
- **Chaque commune a son temps en voiture jusqu'à la mer**, calculé depuis l'envoi de Vincent, arrondi une seule fois à la minute : Bordeaux **56 min**, Caen **18 min**. 42 communes sur 34 746 (0,12 %) n'en ont pas, chacune avec sa cause ; le site les comptera d'après leurs km.
- **Le tableau de confrontation est prêt** pour Vincent : `credibilite-mer.md`, 22 communes, chacune avec un lien d'itinéraire à ouvrir. **Un temps est faux à coup sûr** : Aspremont (06006), **21 h 09** pour 10 km de la mer. Un autre l'est probablement : Hourtin (33203), 58 min pour 9 km. Le retrait (D8) reste le jugement de Vincent.
- Le fichier servi avec la colonne est **prêt mais pas committé** (la question ci-dessus) : il pèse 54,8 Ko de plus en `brotli -q 3` (limite 60).

## Critères
Aucun critère d'acceptation dans cette tâche (le plan range AC-6 à AC-10 en tâche 3b). Tests ajoutés :

| Exigence | Test (fichier · nom) | Résultat |
|---|---|---|
| H191 arrondi | `scripts/data/mer_minutes.test.ts` · « H191 : arrondi une seule fois à la minute, moitié vers le haut : 29,5 min → 30 ; 28,5 → 29 ; 29,49 → 29 ; 0,4 → 0 … » | vert ; rouge vérifié avec un arrondi « au pair » (28,5 → 28) |
| H196 causes | `scripts/data/mer_minutes.test.ts` · « H196 : chaque commune sans temps a sa cause : point non accroché, mairie non accrochée, aucune route, échec après un nouvel essai » | vert |
| D8 retrait | `scripts/data/mer_minutes.test.ts` · « D8 : une ligne de mer-retraits.csv rend la commune sans temps, cause « retrait » ; une ligne sans preuve arrête tout » | vert |
| Conditions d'arrêt | `scripts/data/mer_minutes.test.ts` · « arrêts : un lot préparé absent du fichier d'openrouteservice (trajet manquant) ; plus de 2 % des communes sans temps » | vert |
| R61, colonne lue par `communeDeLigne` | `scripts/data/communes.test.ts` · « R61 : la colonne `mer_min` est la dernière, lue par communeDeLigne : Bordeaux 56 min, Caen 18 min, Île-de-Sein sans temps (null) » ; « H191, H196 : chaque temps est un nombre entier de minutes… » ; « une ligne sans la colonne (jeu ancien) : sans temps (null) » | verts sur l'état complet ; **pas committés** (ils lisent la colonne du fichier servi, en attente de la question) |

## Preuves
- `docs/plans/2026-11-25-recherche-et-mer/mesure-tache-0.md`, part 0b — sortie complète de `--calculer`, communes sans temps par cause, bouts du rapport minutes / km, poids, Bordeaux et Caen (2026-11-26 03:22–03:45).
- `docs/plans/2026-11-25-recherche-et-mer/captures/T0b-sortie-calculer.txt` — sortie de `python3 -I scripts/data/mer_minutes.py --calculer` (03:24).
- `docs/plans/2026-11-25-recherche-et-mer/credibilite-mer.md` — le tableau pour Vincent, fait par `captures/T0b-credibilite.py` (sans réseau ; sortie : `captures/T0b-sortie-credibilite.txt`, 03:32).
- Fichier servi relu (03:23) : `["33063","Bordeaux",…,"ville-dense",172.78,56]`, Caen 18, Mont-de-Marsan 84, Blaye 129, Aspremont 1269, Île-de-Sein `null`. Les 11 colonnes d'avant identiques sur les 34 746 lignes (comparées une à une avec la copie d'avant) ; `achat.json` identique octet pour octet (`cmp`).
- Poids : `brotli -c -q 3` → 876 811 octets avant, 931 645 après : **+54 834 octets (54,8 Ko)**, sous 60 Ko.

## Contrôles de `mer_minutes.py --calculer` (extrait)
```
  ok   ors-mer.jsonl : sha256 13b9f73ee16363e389f283d0a1dfb0ed56c72dba6714ec662780a8b5c705ae21 (empreinte retenue : envoi du 2026-11-26)
  ok   aucun trajet manquant dans ors-mer.jsonl (34746 communes dans 91 lots) : []
  ok   les 34746 communes des lots sont celles de mer-km.csv (34746)
communes sans temps : 42 sur 34746 (0.12 %)
  pas-de-route-pres-du-point : 12   (4 îles sans voiture : Aix, Sein, Molène, Hœdic ; 8 de Camargue et du Gard, dont Arles)
  pas-de-route-jusqu-au-point : 30  (point accroché à une piste isolée : 19 dans les Landes, 5 dans le Médoc, 6 sur un point de l'Hérault)
  pas-de-route-pres-de-la-mairie : 0 · echec : 0 · retrait : 0
  info 33063 : 3368.44 s → 56 min
  info 14118 : 1059.51 s → 18 min
```
Aucune condition d'arrêt ne joue : 0,12 % sans temps (limite 2 %) ; +54,8 Ko (limite 60) ; aucun trajet manquant.

## Suite de tests
Mesurée sur **l'état complet** (fichier servi avec `mer_min`, tests de `communes.test.ts`, et la ligne 203 de l'option 1) :
- Unitaires (`npm run test:unit`) : `Test Files  27 passed (27)` · `Tests  453 passed (453)`.
- Types (`npm run typecheck`) : `tsc --noEmit -p .` sans erreur.
- Construction (`npm run build`) : `✓ built in 2.99s`.
- Bout en bout (`npm run test:e2e`, port 4173 libre et charge 3,2 vérifiés avant, 03:26 → 03:44) : `53 skipped` · `498 passed (17.5m)`, aucun échec.

Sur **l'état committé** (sans le fichier servi ni ses tests ; `score.ts` lit déjà la colonne, absente : `merMin` vaut `null` partout, rien ne l'affiche) :
- Unitaires : `Test Files  27 passed (27)` · `Tests  450 passed (450)` (446 à la tâche 3a, + 4 de `--calculer`).
- Types : `tsc --noEmit -p .` sans erreur. Construction : `✓ built in 3.38s`.
- Bout en bout (port libre, charge 5,4, 03:45 → 04:03) : `53 skipped` · `498 passed (17.5m)`, aucun échec.

## Décisions prises à la place de Vincent
- Décision : une 5e cause, « aucune route près de la mairie », séparée de « aucune route près du point » — H196 ne la nomme pas, la réponse la distingue ; elle compte 0 commune (les 4 mairies non accrochées sont sur des îles dont le point ne l'est pas non plus, et la cause du point est cherchée d'abord) — coût si c'est faux : aucun, un mot dans un fichier non servi.
- Décision : arrondi en décimal exact (`ROUND_HALF_UP`) et non `round()` de Python, qui arrondit « au pair » (28,5 → 28) — H191 dit « moitié vers le haut » — coût si c'est faux : aucun.
- Décision : les bouts du rapport minutes / km sont pris parmi les communes de 1 km (affiché) à moins de 50 km, **une commune par point de côte** (« décidé par Claude ») — sous 1 km le rapport n'a pas de sens (0,1 km et 3 min font 30) ; sans « une par point », les 5 plus petits sont des voisines sur la même voie rapide — coût si c'est faux : d'autres communes au tableau ; la liste complète se refait en une commande.
- Décision : Hourtin (33203) ajouté au tableau de crédibilité (« décidé par Claude ») — c'est l'écart le plus net repéré par les trajets croisés de la matrice (16 min vers d'autres points, 58 vers le sien) — coût si c'est faux : une ligne de plus à juger.
- Décision : règle proposée pour juger « faux » : l'itinéraire en ligne tombe de l'autre côté d'une pastille (15, 30, 60, 90 min), comme pour les services (« décidé par Claude ») — D8 dit « prouvé faux » sans seuil — coût si c'est faux : Vincent juge autrement, la règle n'est qu'une aide.
- Décision : **aucun retrait écrit**, pas même Aspremont (21 h 09, faux à coup sûr) — le plan : « les minutes sont jugées à la démo, retrait par une ligne de table » ; c'est le jugement de Vincent — coût si c'est faux : jusqu'au retrait, Aspremont aurait « 21 h 09 » à l'écran ; rien n'affiche encore les minutes avant la tâche 3b.
- Décision : le contrôle d'empreinte de `--calculer` ne joue que sur le vrai dossier (`data-raw/mer-calcul`), pas sur le dossier inventé des tests (`--dossier`) — sinon aucun test ne pourrait tourner — coût si c'est faux : aucun sur les vraies données.
- Décision : `mer-min.csv` garde, en plus du temps et de la cause, les secondes brutes, les accroches, la mairie et le point de côte — pour le tableau et un futur retrait sans relire le gros fichier — coût : aucun (non versionné, non servi).

## Fichiers touchés hors de la liste de la tâche
- `scripts/data/mer_minutes.test.ts` — les tests de `--calculer` (le plan les y place, mais ne l'a pas listé dans « Fichiers »).
- `docs/plans/2026-11-25-recherche-et-mer/captures/T0b-credibilite.py`, `T0b-sortie-calculer.txt`, `T0b-sortie-credibilite.txt` — le script jetable du tableau et les sorties gardées en preuve.
- `docs/solutions/2026-11-25-openrouteservice-matrice-sans-rayon-ni-bacs.md` (ligne « Revu le 2026-11-26 ») et `docs/solutions/README.md` (index régénéré) ; copie hors dépôt dans `~/.claude/studio/solutions/`, index régénéré.
- `docs/plans/2026-11-25-recherche-et-mer/taches/T0b.md` — ce rapport.
- Hors dépôt, non versionné : `data-raw/mer-min.csv` (écrit), `data-raw/formes-100m.json` (réécrit par `communes.py`).

## Tests existants modifiés
- `scripts/data/communes.test.ts`, ligne 76 — `slice(-2)` → `slice(-3)`, `mer_min` ajouté à la fin — accordé par le plan. Plus un `import` de `communeDeLigne` et un nouveau bloc de 3 tests (aucune autre ligne existante changée). **Pas committé** (attend la question).
- `src/domain/score.test.ts`, ligne 203 — **hors de l'accord** : changement de l'option 1 fait seulement pour mesurer la suite, **puis retiré** ; rien de committé dans ce fichier.

## Leçons écrites
- `docs/solutions/2026-11-25-openrouteservice-matrice-sans-rayon-ni-bacs.md`, ligne « Revu le 2026-11-26 » : un point accroché n'est pas un point relié (30 `null` avec les deux bouts accrochés ; Aspremont 21 h 09 avec un point accroché à 11 m) ; contrôle gratuit par les trajets croisés de la matrice. Copiée dans `~/.claude/studio/solutions/`.

## Ce qui reste (si Vincent ou /build répond « option 1 »)
1. `python3 -I scripts/data/communes.py` (environ 2 min ; régénère `public/data/communes.json` avec `mer_min`, contrôles compris) — ou recopier le fichier prêt, mesuré ci-dessus : `data-raw/mer-calcul/pret-tache-0b/communes.json` (non versionné).
2. `scripts/data/communes.test.ts` : la ligne 76 et le bloc de 3 tests — version prête : `data-raw/mer-calcul/pret-tache-0b/communes.test.ts` (à recopier telle quelle).
3. `src/domain/score.test.ts`, ligne 203 : `slice(9)` → `slice(9, 11)`.
4. `npm test`, puis commit `feat(recherche-et-mer): tâche 0b — la colonne mer_min servie`.
