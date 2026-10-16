# Tâche 3a — Le repli à vol d'oiseau : calcul, score et fiche
Statut : faite · Début 09:16 · Fin 10:31 · Commits : ff5097a (code et tests), puis le commit de ce rapport, des preuves et de la leçon

## Ce que l'utilisateur peut faire maintenant
Quand l'IGN ne couvre pas le plafond choisi (panne totale, refus, délai de 45 s sans assez de zones), le proche n'est plus « Trajets indisponibles » : il **compte quand même, à vol d'oiseau** :
- sa ligne dit « À vol d'oiseau : l'IGN ne répond pas. » (texte normal, entre l'adresse et le curseur), puis « Recalculer avec l'IGN » (sans effet avant la tâche 5b, comme prévu) et « Retirer » ;
- son plafond passe en km à l'entrée en repli (2 h → 120 km, 60 km par heure) ; son curseur va de 15 à 180 km par pas de 15 km ; la valeur affichée est « 120 km », le curseur est lu « 120 km au plus » ;
- chaque commune vaut la distance à vol d'oiseau du point de départ du proche à sa mairie (sphère de 6 371 km), comparée et notée au km affiché ; il compte dans le classement, la note, le filtre et l'état « sans plafond » comme un proche prêt ;
- la fiche écrit « Rochelleville (17) : 88 km à vol d'oiseau » (« moins d'1 km à vol d'oiseau » sous 1 km), et la raison d'une commune trop loin « Rochelleville (17) 118 km : au-dessus de ton plafond de 90 km » ;
- « Tes proches » repliée le compte comme « approximatif » ; son repère sur la carte et son petit repère sont ceux d'un proche prêt (H99).

Vu sur les vraies données : « 12 rue de la Paix, Nantes » avec le calcul de trajets bloqué → à vol d'oiseau en 5,9 s, 643 communes passent ; La Rochelle à **121 km** (la même distance qu'en tâche 0), elle ne passe pas à 120 km.

Pas encore (tâche 3b, comme le plan le range) : la **pastille** d'un proche en km dit encore « calcul en cours » (visible en haut de la capture de bureau) ; « 90 km au plus » et « 118 km · au-dessus de 90 km » arrivent avec AC-5.

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-4 | `tests/e2e/proches-fiables.spec.ts` · « AC-4 depuis /?loyer=1200&mer=50, panne « panne-totale » : Rochelleville (17) à vol d'oiseau, « 120 km au plus », « Recalculer avec l'IGN » ; « Trajets indisponibles » nulle part ; Portmer 70, Quaibleu 32, Grandeville 26 ; fiche de Grandeville « Rochelleville (17) : 88 km à vol d'oiseau » » | vert en bureau et à 390 px ; rouge sur le code d'avant (aucun curseur : le proche restait indisponible) |
| AC-6 (a), (b) | contrôle sans marquer le critère (posé en tâche 5a) : script jetable `scratchpad/t3a/controle-ac6.spec.ts` | (a) km, « 120 km au plus », Portmer 70, Quaibleu 32, Grandeville 26 ; (b) en heures, « Au-delà de 2 h : l'IGN n'a pas répondu. », plafond au plus 2 h, Portmer 69, Quaibleu 36, Grandeville 29 ; vert aux deux largeurs (sortie dans `captures/T3a-preuve-sortie.txt`). La fiche de Montcher de (b) n'a pas été lue. |

Tests unitaires (rouges avant le code : module absent, raison `proche-km` absente, résumé « 1 » au lieu de « 1 · 1 approximatif » ; verts ensuite) :
- `src/proches/distance.test.ts` (nouveau) : distances de la fixture depuis [0.5, 0.5] au km, 39 / 88 / 197 / 88 / 118 (une par mairie, dans l'ordre des points) ; 1° de longitude à l'équateur = 6 371 × π / 180 km ; La Rochelle (mairie de 17300 de `reperes.json`) à 121,324 km de [-1.554555, 47.215051], la valeur de la tâche 0 ; conversion 45 min → 45 km, 2 h → 120 km, 3 h → 180 km.
- `src/domain/proches.test.ts`, bloc « R35 (proches-fiables) — proche à vol d'oiseau » : score d'AC-4 (70 / 32 / 26 à 120 km, raison de Montcher « 197 km : au-dessus de ton plafond de 120 km ») ; à 90 km Portmer 67, Grandeville 18, raison de Quaibleu « Rochelleville (17) 118 km : au-dessus de ton plafond de 90 km » ; comparaison au km affiché (88,4 km tient 88 km, 88,5 km non ; « moins d'1 km » compte 1 km) ; un proche km sort la page de l'état « sans plafond ».
- `src/ui/ProcheKm.test.ts` (nouveau) : ligne de la fiche (« Rochelleville (17) : 88 km à vol d'oiseau », 118 km, 39 km, « moins d'1 km à vol d'oiseau ») ; résumé replié (« 1 · 1 approximatif », « 2 · 1 en calcul, 1 approximatif »).

## Preuves
Étape 2 de la vérification de bout en bout, version locale (serveur vite du dépôt), vraies données (`public/data`), vrai fond Plan IGN et vraie recherche d'adresse de l'IGN ; seul `/navigation/isochrone` est bloqué (route du navigateur de test, erreur réseau). Script jetable : `/private/tmp/claude-501/-Users-mouga-git-repository-carte-ou-vivre/84640ed0-4bd4-4bee-94d0-fd6591584b19/scratchpad/t3a/preuve-reel.spec.ts`.
- `docs/plans/2026-10-16-proches-fiables/captures/T3a-bureau-proche-km.png` — 1 440 × 900 réduite à 1 000 px : « Nantes (44) », « 120 km », « 12 Rue de la Paix 44000 Nantes », « À vol d'oiseau : l'IGN ne répond pas. », le curseur, « Recalculer avec l'IGN », « Retirer » ; la carte colore les communes à 120 km au plus de Nantes (Retz, Vendée, sud de la Bretagne), 643 communes passent (2026-10-16 10:15). La pastille du haut dit encore « calcul en cours » (tâche 3b).
- `docs/plans/2026-10-16-proches-fiables/captures/T3a-bureau-fiche-la-rochelle.png` — fiche de La Rochelle (17) : « Ne passe pas tes critères — Nantes (44) 121 km : au-dessus de ton plafond de 120 km », « Tes proches — Nantes (44) : 121 km à vol d'oiseau » ; La Rochelle en blanc, Lagord et Nieul-sur-Mer colorées au nord (10:15).
- `docs/plans/2026-10-16-proches-fiables/captures/T3a-390-proche-km.png` — 390 × 844 : la même ligne entière dans l'onglet « Critères » (amenée dans la vue par le script) (10:19).
- `docs/plans/2026-10-16-proches-fiables/captures/T3a-390-fiche-la-rochelle.png` — 390 px, fiche de La Rochelle avec les deux mêmes lignes (10:19).
- `docs/plans/2026-10-16-proches-fiables/captures/T3a-preuve-sortie.txt` — textes lus dans la page aux deux largeurs (ligne, curseur « 120 km au plus », maximum 180, fiche), 24 demandes de zones bloquées, aucune avec le nom du proche, fin du calcul après 5,9 s ; et la sortie du contrôle d'AC-6 (a), (b).

**Distance comparée à la tâche 0** : 121 km dans la page (bureau et 390 px), 121,324 km mesurés en tâche 0 (`mesure-tache-0.md`) : identiques.

Ce que les preuves ne couvrent pas : la panne y est une erreur réseau sur toutes les zones (24 demandes) ; le cas « quelques zones obtenues mais sous le plafond » n'est vérifié que sur la fixture (contrôle AC-6 a). Un proche km n'est pas encore gardé tel quel par le navigateur : à la réouverture, il revient « Trajets indisponibles » (tâche 4).

## Suite de tests
Lancée le 2026-10-16 à 10:22, port 4173 libre, charge 3,9 (sortie complète : `scratchpad/t3a/suite.txt`), code de sortie 0 :
```
 Test Files  17 passed (17)
      Tests  249 passed (249)
check-tokens : 40 fichier(s), aucune valeur arbitraire
  35 skipped
  308 passed (6.5m)
```
Types : `tsc --noEmit -p .` sans erreur. Construction : `✓ built in 1.73s` (avertissement habituel sur la taille des fichiers).

## Décisions prises à la place de Vincent
- Décision : les distances d'un proche km sont gardées en km **non arrondis** (`Float64Array`, une par commune) et arrondies seulement pour afficher et comparer, avec la même règle partout (`Math.max(1, Math.round(d))` pour comparer, « moins d'1 km » sous 1 km pour afficher, comme la mer) — un arrondi gardé (entiers) aurait fait dire « 1 km » à une distance de 0,6 km au lieu de « moins d'1 km » ; la valeur comparée est celle affichée (leçon du double arrondi) — coût si c'est faux : nul ; 280 Ko de mémoire par proche km dans la page.
- Décision : le plafond d'un proche km garde le même champ `plafond`, en km quand l'état est `km` (2 h = 120 min → 120 km : même nombre, H94) ; la conversion est écrite dans une fonction (`kmDePlafond`) appelée à l'entrée en repli — coût si c'est faux : nul pour l'utilisateur ; la tâche 4 garde l'unité avec l'état (R36).
- Décision : le score reçoit un proche km sous une forme à part (`{ nom, plafond, distances }`) et produit une raison à part (`critere: 'proche-km'`), plutôt que de ranger des km dans le champ des temps — coût si c'est faux : nul.
- Décision : le point de départ de la distance est celui du calcul de trajets (`depart` : l'adresse, ou la mairie d'une commune choisie seule, H101) — coût si c'est faux : nul.
- Décision : dans le test hors critères « R13 refus 429 », la seconde moitié (« Réessayer » quand le service répond → calcul, puis prêt) est retirée : un proche km n'a pas de « Réessayer », et « Recalculer avec l'IGN » n'agit qu'en tâche 5b ; ce cas est celui d'AC-9 (tâche 5b) — coût si c'est faux : de la tâche 3a à la 5b, rien ne teste qu'un proche sorti d'une panne redevient prêt ; il n'existe d'ailleurs aucun moyen de le faire à l'écran pendant ce temps (prévu par le plan).
- Décision : la pastille d'un proche km (« 90 km au plus ») reste à la tâche 3b avec AC-5, comme le plan le range ; d'ici là elle dit « calcul en cours » — coût si c'est faux : une pastille fausse pendant une tâche, sans mise en ligne entre-temps.

## Fichiers touchés hors de la liste de la tâche
- `src/proches/memoire.ts` — type seulement : `EtatProche` reçoit `'km'` (l'état du proche y est défini), et le commentaire du plafond dit l'unité km. Le format gardé ne change pas (tâche 4) : un proche km s'écrit `pret: false`.
- `src/ui/Proches.tsx` — un mot du résumé replié : km compte comme « approximatif » (H34 étendue). Rangé en tâche 3b par le plan ; nécessaire ici pour que le test recalé « R13 refus 429 » attende ce que dit la spec (« 1 · 1 approximatif ») et non « 1 ».
- `src/map/ProcheMarkers.ts` — une ligne : un proche km a le repère d'un proche prêt (H99). Rangé en tâche 3b ; sans elle, le proche km gardait le repère « … » qui pulse d'un proche en calcul, et le test recalé de `proches-carte.spec.ts` ne pouvait attendre le bon repère.
- `tests/e2e/proches-carte.spec.ts`, `tests/e2e/proches-mobile.spec.ts` — rangés en tâche 3b ; passés au rouge dès la fermeture de la transition (le brief demandait de les recaler ici dans ce cas). Voir plus bas.
- `tests/e2e/lib/proches.ts` — une adresse de plus dans `ADRESSES` (« 6 rue Test », Rochelleville), pour ajouter le proche d'AC-4 avec le geste commun `ajouter` ; rien ne change pour les autres tests.
- `src/ui/ProcheKm.test.ts` — nouveau fichier de tests unitaires (fiche et résumé d'un proche km).
- `docs/solutions/2026-10-16-choisir-une-vraie-commune-sur-la-carte-de-test.md` et `docs/solutions/README.md` (index régénéré par le crochet) — leçon.

## Tests recalés ou retirés, et ce qui les couvre
Le test d'AC-10 de proches était déjà retiré (tâche 1, commit ef6713a) : rien à faire ici. Recalés selon la règle du plan (situation de départ et action gardées, seul l'attendu change vers R33, R35, H99, H34 étendue) :
- `tests/e2e/proches-etats.spec.ts` · « H21 délai de 45 s… : le premier, puis le second, passent indisponibles » → « … passent à vol d'oiseau » : service muet, horloge simulée ; à 45 s chaque proche affiche « À vol d'oiseau : l'IGN ne répond pas. » au lieu de « Trajets indisponibles » ; la liste finale passe de « 3 communes passent tes critères » à « Aucune commune ne passe tes critères » : les deux proches comptent maintenant, en km, et toutes les communes de la fixture sont à plus de 120 km de Nantesville et de Toulouseville (≈ 300 à 450 km).
- `tests/e2e/proches-etats.spec.ts` · « R13 refus 429… : le proche passe indisponible ; « Réessayer » quand le service répond : calcul, puis prêt » → « R13 refus 429 : le proche passe à vol d'oiseau ; repliée, la zone dit « 1 · 1 approximatif » » : « À vol d'oiseau… » au lieu de « Trajets indisponibles », « Trajets indisponibles » absent, résumé « 1 · 1 approximatif » au lieu de « 1 · 1 indisponible ». **Seconde moitié retirée** (« Réessayer », calcul, prêt, Portmer 65) : plus d'objet, couverte par AC-9 de proches-fiables (tâche 5b : « Recalculer avec l'IGN » → recalcul → prêt).
- `tests/e2e/proches-carte.spec.ts` · « repère : … ; indisponible si les trajets tombent en panne ; … » → « … ; prêt aussi à vol d'oiseau si les trajets tombent en panne ; … » : le repère de Toulouseville est « calcul » à l'ajout, puis, la ligne passée « À vol d'oiseau… », « pret » (H99) au lieu de « indisponible ».
- `tests/e2e/proches-mobile.spec.ts` · « cibles des proches : 44 px de haut à 390 px, 24 px au moins en bureau » : la panne donne une ligne km ; la cible « Recalculer avec l'IGN Nantesville (44) » remplace « Réessayer Nantesville (44) » (même mesure de hauteur, mêmes autres cibles).

Restent sur « indisponible », hors de cette tâche : les tests R12 de `proches-etats.spec.ts` (empreinte, fermé pendant le calcul : relecture de la mémoire, tâche 4) et `src/proches/memoire.test.ts`.

## Leçons écrites
- `docs/solutions/2026-10-16-choisir-une-vraie-commune-sur-la-carte-de-test.md` — choisir une commune réelle sur la carte du navigateur de test (calcul du cadrage, zoom à la molette sur le point, vérifier le titre de la fiche, réessayer) ; deux essais à 390 px avant La Rochelle (Lagord au nord).
