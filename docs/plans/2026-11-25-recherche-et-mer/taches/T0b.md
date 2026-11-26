# Tâche 0b — Les minutes, servies et confrontées
Statut : faite · Début 03:13 · Fin 07:14 (dont l'attente de la réponse de Vincent, 04:05 → 06:50) · Commits : d03710e (calcul, tableau, code prêt) et le commit suivant « tâche 0b — la colonne mer_min servie, Aspremont retiré » (numéro : `git log`)

## Ce que l'utilisateur peut faire maintenant
Rien de visible à l'écran (prévu : la tâche 3b branchera les minutes).
- **Chaque commune a son temps en voiture jusqu'à la mer** dans `public/data/communes.json` (colonne `mer_min`, la dernière), calculé depuis l'envoi de Vincent et arrondi une seule fois à la minute : Bordeaux **56 min**, Caen **18 min**. 43 communes sur 34 746 (0,12 %) n'en ont pas, chacune avec sa cause ; le site les comptera d'après leurs km.
- **Aspremont (06006) est retiré** (décision de Vincent du 2026-11-26) : le calcul lui donnait 21 h 09 pour 10 km. Il est « sans temps », compté d'après ses km.
- **Le tableau de confrontation** `credibilite-mer.md` reste à juger à la démo : 22 communes, chacune avec un lien d'itinéraire (Aspremont marqué retiré ; Hourtin, probablement faux, et Blaye à regarder en premier).

## Réponses de Vincent (2026-11-26) à la question de la première remise
1. Option 1 accordée : `src/domain/score.test.ts`, ligne 203, `slice(9)` → `slice(9, 11)`, rien d'autre dans ce fichier.
2. Retirer Aspremont tout de suite, avec la preuve des trajets croisés ; le reste du tableau à la démo.

## Critères
Aucun critère d'acceptation dans cette tâche (AC-6 à AC-10 : tâche 3b). Tests ajoutés :

| Exigence | Test (fichier · nom) | Résultat |
|---|---|---|
| H191 arrondi | `scripts/data/mer_minutes.test.ts` · « H191 : arrondi une seule fois à la minute, moitié vers le haut : 29,5 min → 30 ; 28,5 → 29 ; 29,49 → 29 ; 0,4 → 0 … » | vert ; rouge vérifié avec un arrondi « au pair » (28,5 → 28) |
| H196 causes | `scripts/data/mer_minutes.test.ts` · « H196 : chaque commune sans temps a sa cause : point non accroché, mairie non accrochée, aucune route, échec après un nouvel essai » | vert |
| D8 retrait | `scripts/data/mer_minutes.test.ts` · « D8 : une ligne de mer-retraits.csv rend la commune sans temps, cause « retrait » ; une ligne sans preuve arrête tout » | vert |
| Conditions d'arrêt | `scripts/data/mer_minutes.test.ts` · « arrêts : un lot préparé absent du fichier d'openrouteservice (trajet manquant) ; plus de 2 % des communes sans temps » | vert |
| R61, colonne lue par `communeDeLigne` | `scripts/data/communes.test.ts` · « R61 : la colonne `mer_min` est la dernière, lue par communeDeLigne : Bordeaux 56 min, Caen 18 min, Île-de-Sein sans temps (null) » | vert |
| D8 sur les vraies données | `scripts/data/communes.test.ts` · « D8 : Aspremont (06006), temps retiré par une ligne de mer-retraits.csv, est sans temps (null) ; ses km restent » | vert |
| H191, H196 sur les vraies données | `scripts/data/communes.test.ts` · « H191, H196 : chaque temps est un nombre entier de minutes, 0 ou plus ; 2 % des communes au plus sont sans temps » ; « une ligne sans la colonne (jeu ancien) : sans temps (null) » | verts |

## Preuves
- `docs/plans/2026-11-25-recherche-et-mer/mesure-tache-0.md`, part 0b — sortie de `--calculer`, communes sans temps par cause, bouts du rapport minutes / km, poids, Bordeaux et Caen, et « Après le retrait d'Aspremont » (2026-11-26, 03:22–03:45, puis 06:50).
- `docs/plans/2026-11-25-recherche-et-mer/captures/T0b-sortie-calculer.txt` — sortie de `--calculer` après le retrait.
- `docs/plans/2026-11-25-recherche-et-mer/credibilite-mer.md` — le tableau, refait par `captures/T0b-credibilite.py` après le retrait (sortie : `captures/T0b-sortie-credibilite.txt`).
- Fichier servi relu après le retrait : Bordeaux 56, Caen 18, Mont-de-Marsan 84, Blaye 129, Aspremont `null`, Île-de-Sein `null` ; les 11 colonnes d'avant identiques sur les 34 746 lignes (comparées une à une avec la copie d'avant) ; `achat.json` identique octet pour octet (`cmp`).
- Poids final : `brotli -c -q 3 public/data/communes.json | wc -c` → 931 642 octets, contre 876 811 sans la colonne : **+54 831 octets (54,8 Ko)**, sous 60 Ko.

## Communes sans temps, par cause (après le retrait)
**43 sur 34 746, soit 0,12 %** (limite 2 %) :
- aucune route près du point de côte : **12** — 4 îles sans voiture (Aix, Sein, Molène, Hœdic) et 8 communes de Camargue et du Gard, dont Arles ;
- aucune route de la mairie jusqu'au point : **30** — point accroché à une piste reliée à rien : 19 dans les Landes, 5 dans le Médoc, 6 sur un même point de l'Hérault ;
- retrait (D8) : **1** — Aspremont ;
- aucune route près de la mairie : 0 · calcul en échec : 0.

Aucune condition d'arrêt ne joue : 0,12 % sans temps ; +54,8 Ko ; aucun trajet manquant (91 lots sur 91, empreintes vérifiées).

## Suite de tests (état final, committé)
- Unitaires (`npm run test:unit`) : `Test Files  27 passed (27)` · `Tests  454 passed (454)`.
- Types (`npm run typecheck`) : `tsc --noEmit -p .` sans erreur.
- Construction (`npm run build`) : `✓ built in 3.53s`.
- Suite complète (`npm test`, port 4173 libre, charge 2,3, 06:53 → 07:12) : Vitest `Test Files  27 passed (27)` · `Tests  454 passed (454)` ; Playwright `53 skipped` · `498 passed (18.5m)`, aucun échec.

## Décisions prises à la place de Vincent
- Décision : une 5e cause, « aucune route près de la mairie », séparée de « aucune route près du point » — H196 ne la nomme pas, la réponse la distingue ; 0 commune (les 4 mairies non accrochées sont sur des îles dont le point ne l'est pas non plus, et la cause du point est cherchée d'abord) — coût si c'est faux : aucun, un mot dans un fichier non servi.
- Décision : arrondi en décimal exact, moitié vers le haut, et non `round()` de Python, qui arrondit « au pair » (28,5 → 28) — H191 — coût si c'est faux : aucun.
- Décision : bouts du rapport minutes / km pris parmi les communes de 1 à moins de 50 km, **une par point de côte**, d'après le temps calculé (Aspremont y reste, marqué retiré) (« décidé par Claude ») — sous 1 km le rapport n'a pas de sens ; sans « une par point », 5 voisines sur la même voie rapide — coût si c'est faux : d'autres communes au tableau ; il se refait en une commande.
- Décision : Hourtin (33203) ajouté au tableau (« décidé par Claude ») — l'écart le plus net repéré par les trajets croisés (16 min vers d'autres points, 58 vers le sien) — coût : une ligne de plus à juger.
- Décision : règle proposée pour juger « faux » : l'itinéraire en ligne tombe de l'autre côté d'une pastille (15, 30, 60, 90 min) (« décidé par Claude ») — D8 ne donne pas de seuil — coût : Vincent juge autrement, la règle n'est qu'une aide.
- Décision : le contrôle d'empreinte de `--calculer` ne joue que sur le vrai dossier (`data-raw/mer-calcul`), pas sur le dossier inventé des tests — coût : aucun sur les vraies données.
- Décision : `mer-min.csv` garde aussi les secondes brutes, les accroches, la mairie et le point de côte — pour le tableau et les retraits sans relire le gros fichier — coût : aucun (non versionné, non servi).

## Fichiers touchés hors de la liste de la tâche
- `scripts/data/mer_minutes.test.ts` — les tests de `--calculer` (le plan les y place sans lister le fichier).
- `src/domain/score.test.ts` — ligne 203, accordée par Vincent le 2026-11-26 (ci-dessous).
- `docs/plans/2026-11-25-recherche-et-mer/captures/T0b-credibilite.py`, `T0b-sortie-calculer.txt`, `T0b-sortie-credibilite.txt` — script jetable du tableau et sorties gardées en preuve.
- `docs/solutions/2026-11-25-openrouteservice-matrice-sans-rayon-ni-bacs.md` (ligne « Revu le 2026-11-26 ») et `docs/solutions/README.md` (index régénéré) ; copie hors dépôt dans `~/.claude/studio/solutions/`, index régénéré.
- `docs/plans/2026-11-25-recherche-et-mer/taches/T0b.md` — ce rapport.
- Hors dépôt, non versionné : `data-raw/mer-min.csv` (écrit), `data-raw/formes-100m.json` (réécrit par `communes.py`, même contenu), `data-raw/mer-calcul/pret-tache-0b/` (copies de travail de la première remise, inutiles désormais).

## Tests existants modifiés
- `scripts/data/communes.test.ts`, ligne 76 — `expect(champs.slice(-2)).toEqual(['type_env', 'montagne_km'])` devient `slice(-3)` avec `'mer_min'` à la fin — la colonne `mer_min` est ajoutée à la fin de `communes.json` ; accordé par le plan (« Accordé en validant ce plan », tâche 0b). Le fichier gagne aussi un `import` de `communeDeLigne` et un nouveau bloc de 4 tests ; aucune autre ligne existante ne change.
- `src/domain/score.test.ts`, ligne 203 — `expect(fichier.champs.slice(9))` devient `expect(fichier.champs.slice(9, 11))` ; la valeur attendue (`['type_env', 'montagne_km']`) ne change pas — avec `mer_min` à la fin, `slice(9)` rendait trois colonnes ; `slice(9, 11)` garde le sens exact du titre (les deux colonnes de cadre-de-vie suivent les 9 premières) ; accordé par Vincent le 2026-11-26 (option 1). Rien d'autre dans ce fichier.

## Leçons écrites
- `docs/solutions/2026-11-25-openrouteservice-matrice-sans-rayon-ni-bacs.md`, ligne « Revu le 2026-11-26 » : un point accroché n'est pas un point relié (30 `null` avec les deux bouts accrochés ; Aspremont 21 h 09 avec un point accroché à 11 m) ; contrôle gratuit par les trajets croisés de la matrice. Copiée dans `~/.claude/studio/solutions/`.
- Constat de process (sans note) : le plan n'avait accordé qu'un des deux tests qui lisent la liste des colonnes de `communes.json` ; une recherche de `champs.slice` dans tous les tests, au moment du plan, l'aurait vu.
