# Tâche 5b — « Recalculer avec l'IGN », priorité d'un ajout, et vérification de bout en bout
Statut : faite · Début 14:01 · Fin 17:06 · Commits : 5fdceaf (code et tests), puis le commit de ce rapport, des preuves et des leçons, juste après

## Ce que l'utilisateur peut faire maintenant
- Il appuie sur « Recalculer avec l'IGN » quand il veut, sur un proche aux temps approximatifs ou à vol d'oiseau : le proche passe en recalcul (« Recalcul avec l'IGN… » à la place du lien), continue de compter avec ses valeurs d'avant, puis devient juste si l'IGN répond. Ce recalcul passe **devant** les recalculs automatiques de l'ouverture qui n'ont pas encore commencé.
- Il ajoute un proche pendant que d'autres se recalculent à l'ouverture : son proche attend seulement la fin du calcul **en cours** (« En attente… »), puis se calcule, avant les recalculs automatiques qui attendaient encore leur tour.
- Il retire un proche pendant son recalcul : le proche disparaît, son recalcul s'arrête (aucune zone ne part plus), ou ne part jamais s'il attendait son tour ; le navigateur ne le garde plus.
- Vérifié sur la version locale avec les vraies données et le vrai IGN (16:17 et 16:23) : avec les pannes du soir de la démo, « 12 rue de la Paix, Nantes » compte en 45 s, partiel, La Rochelle « jusqu'à 2 h 15 », curseur jusqu'à 2 h 45 ; calcul de trajets coupé, il compte en km (120 km, La Rochelle à 121 km) ; IGN revenu et site rouvert, il redevient juste : 2 h, La Rochelle « 2 h 15 en voiture ».

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-9 | `tests/e2e/proches-fiables.spec.ts` · « AC-9 depuis /?loyer=1200&mer=50, Rochelleville (17) à vol d'oiseau à 120 km (AC-4), service de trajets rétabli : après « Recalculer avec l'IGN », « Recalcul avec l'IGN… » et Portmer 70, Quaibleu 32, Grandeville 26 ; ensuite prêt à 2 h, « 3 communes passent tes critères », Portmer 69, Quaibleu 36, Grandeville 29 » | vert, bureau et 390 px |
| AC-11 | idem · « AC-11 depuis /?loyer=1200&mer=50, Nantesville (44) partiel puis Rochelleville (17) à vol d'oiseau gardés, dernier essai il y a plus de 15 min, service rétabli : ajout de Toulouseville (31) pendant le recalcul de Nantesville (44) → « En attente… », puis « Calcul des trajets depuis Toulouseville (31)… » ; aucune zone de Rochelleville (17) avant que Toulouseville (31) soit prêt ; les trois prêts, Rochelleville (17) à 2 h » | vert, bureau et 390 px |

Comment les cas sont posés : AC-9 joue AC-4 (panne totale, Rochelleville à vol d'oiseau, 120 km), puis pose un faux IGN normal par-dessus (« le service est ensuite rétabli ») et appuie sur le lien. AC-11 joue AC-2 (a) puis 2 h 30 (Nantesville partiel, comme AC-7), puis AC-4 (Rochelleville à vol d'oiseau, comme AC-9), et rouvre la page avec l'horloge de la page en avance de 16 min (comme en 5a) ; rien n'est écrit à la main dans le stockage. Chaque zone du faux IGN répond 5 s après sa demande dans ces deux tests, pour lire la page pendant le recalcul (décision de 5a). « Aucune zone de Rochelleville (17) avant que Toulouseville (31) soit prêt » : à chaque demande de zone depuis le point de Rochelleville, une route posée au-dessus du faux IGN regarde si le curseur de Toulouseville est affiché, puis laisse passer la demande ; les 12 demandes de Rochelleville l'ont trouvé affiché. Ordre des 36 demandes relevé dans le test : 12 depuis Nantesville, puis 12 depuis Toulouseville, puis 12 depuis Rochelleville.

Rouge vérifié avant le code : avec `src/proches/useProches.ts` remis à son état d'avant (`git stash`), AC-11 tombe pour la bonne raison (Rochelleville passe en calcul avant Toulouseville : « Recalcul avec l'IGN… » attendu sur Rochelleville pendant le calcul de Toulouseville, reçu « … Retirer », déjà fini). AC-9 et le test « Retirer pendant un recalcul » passaient déjà avec le code de 5a (le lien agissait depuis 5a, le retrait arrêtait déjà le calcul) : ils vérifient maintenant ce comportement. Les 10 tests unitaires de la file tombaient (module absent).

Tests unitaires (`src/proches/file.test.ts`, 10 nouveaux, module pur `src/proches/file.ts`) :
- « R36 — file des calculs : priorité » : file vide ; AC-11 (un ajout passe devant un recalcul automatique en attente, le calcul en cours n'est pas dans la file) ; « Recalculer avec l'IGN » passe comme un ajout ; ajouts et recalculs manuels gardent entre eux leur ordre d'arrivée ; un recalcul automatique va en fin de file ; un ajout derrière des calculs qui ne sont pas des recalculs automatiques attend son tour ; à l'ouverture, un ajout ne passe que devant le premier recalcul automatique ; la file reçue n'est pas modifiée.
- « R36 — file des calculs : un seul calcul par proche à la fois » : un proche déjà dans la file n'y entre pas une seconde fois ; le proche en calcul n'entre pas dans la file.

Hors critère, nouveau (`proches-fiables.spec.ts`, bureau et 390 px) :
- « recalcul : « Retirer » Rochelleville (17) qui attend son tour puis Nantesville (44) qui se recalcule → plus aucune zone demandée, ni l'un ni l'autre gardé ; liste sans proche » : après le retrait, aucune zone de plus pour Nantesville pendant 6 s (2 zones étaient parties avant le retrait, relevé dans le test), aucune zone pour Rochelleville, stockage vide, liste sans proche.

## Preuves
Vérification de bout en bout (details.md, étapes 1 à 3), sur la version locale (serveur vite du dépôt), vraies données (34 746 communes), vrai fond, vraie recherche d'adresse, **vrai calcul de trajets de l'IGN** ; les pannes posées par des routes du navigateur de test sur `/navigation/isochrone` seulement ; navigateur neuf (sans cache) ; script jetable du scratchpad (`t5b/preuve-reel.spec.ts`). Sortie complète : `docs/plans/2026-10-16-proches-fiables/captures/T5b-preuve-sortie.txt`.
- **Étape 1** — pannes du soir de la démo (75 min → 502 à chaque essai ; 2 h et 3 h jamais servies ; les 9 autres au vrai IGN, toutes en 200) :
  - `captures/T5b-bureau-1-ligne.jpg` (16:18), `captures/T5b-390-1-ligne.png` (16:24) — **partiel** : « Temps approximatifs : l'IGN n'a pas tout donné. », « Au-delà de 2 h 45 : l'IGN n'a pas répondu. », curseur « 2 h au plus » de 15 min à **2 h 45**, « Recalculer avec l'IGN », « Retirer ».
  - `captures/T5b-bureau-1-fiche-la-rochelle.jpg`, `captures/T5b-390-1-fiche-la-rochelle.png` — La Rochelle : « Nantes (44) : **jusqu'à 2 h 15** en voiture » et « Nantes (44) jusqu'à 2 h 15 : au-dessus de ton plafond de 2 h ».
  - **Durée** de « Ajouter » au curseur : **45,1 s** (bureau), 45,6 s (390 px) — le calcul s'arrête à 45 s faute de réponse des zones de 2 h et 3 h, plus le rendu. 13 demandes (75 min deux fois).
- **Étape 2** — proche retiré, puis calcul de trajets bloqué (24 demandes bloquées), même proche ajouté de nouveau ; fini en 5,9 s :
  - `captures/T5b-bureau-2-ligne.jpg`, `captures/T5b-390-2-ligne.png` — **km** : « À vol d'oiseau : l'IGN ne répond pas. », « 120 km au plus ».
  - `captures/T5b-bureau-2-fiche-la-rochelle.jpg`, `captures/T5b-390-2-fiche-la-rochelle.png` — La Rochelle « Nantes (44) : **121 km** à vol d'oiseau », « 121 km : au-dessus de ton plafond de 120 km » (comme en T0 et T3a). Stockage relu : `"etat":"km","zones":[],"plafond":120`.
- **Étape 3** — calcul de trajets rétabli (vrai IGN), page fermée puis rouverte « 15 min plus tard » **simulés par l'horloge de la page en avance de 16 min** (`clock.install`), le stockage n'étant pas touché (et non par le lien) :
  - `captures/T5b-bureau-3-recalcul.jpg`, `captures/T5b-390-3-recalcul.png` — « Recalcul avec l'IGN… » à la place du lien, « 120 km au plus », le proche compte.
  - `captures/T5b-bureau-3-apres.jpg`, `captures/T5b-390-3-apres.png` — **prêt** : « 2 h », curseur de 15 min à 3 h, « Retirer » seul (fin 6,8 s et 4,8 s après la capture du recalcul).
  - `captures/T5b-bureau-3-fiche-la-rochelle.jpg`, `captures/T5b-390-3-fiche-la-rochelle.png` — La Rochelle « Nantes (44) : **2 h 15** en voiture ».
  - **Requêtes de l'étape 3** (bureau ; 390 px pareil) : 12 zones, une fois chacune, toutes en 200 — 180, 165, 150, 135, 120, 105, 90, 75, 60, 45, 30, 15 min, à 250 à 300 ms d'écart. Aucune demande de zone des étapes 1 à 3 ne contient le nom du proche ni l'adresse (seul le point part).
- **Ce que le vrai IGN a rendu plus tôt** (essai A, 14:32–14:36, dans la même sortie) : de 14:02 à 14:42 au moins, toute zone répondait **405** « Unsupported Request » (curl, deux réseaux). Avec les mêmes pannes, l'étape 1 finissait en **km** à 45,1 s (22 demandes : les 9 zones réelles en 405 deux fois, 75 min en 502 deux fois, 2 h et 3 h sans réponse) ; l'étape 3 restait en km après 24 demandes en 405, sans message (comme AC-8 b). À 16:22 l'IGN répondait de nouveau (curl : 15 min en 0,3 s, 2 h en 3,3 s, 3 h en 6,8 s) ; l'essai B a été refait et c'est lui qui fait preuve. (La commande de l'essai B, lancée vers 14:45, n'a écrit sa première ligne qu'à 16:17 : cause non vue, sans doute la machine en veille ; d'où la fin de tâche à 17:06.) Pendant la panne, un essai avec des zones inventées (disques) servies par une route a été fait pour préparer le script ; il n'est pas gardé comme preuve, aucune capture n'en vient.

Ce que la preuve ne couvre pas : l'étape 4 (en ligne, IGN normal) est reportée à `/ship` (plan). AC-9 et AC-11 ne sont prouvés que sur la fixture (le recalcul par le lien et l'ajout pendant un recalcul n'ont pas été joués sur les vraies données).

## Suite de tests
(port 4173 libre, charge 3,5 au départ ; lancée à 16:53, après le dernier changement de code et de test ; sortie : `captures/T5b-npm-test.txt`)
```
 Test Files  18 passed (18)
      Tests  286 passed (286)
check-tokens : 41 fichier(s), aucune valeur arbitraire
  36 skipped
  351 passed (11.0m)
```
`npm run typecheck` : sans erreur. `npm run build` : « ✓ built in 1.72s » (avertissement habituel de taille de morceau).
Une première suite complète (14:16) avait 1 rouge : le test hors critère des zones d'annonce (voir la décision), rouge aussi avec le code d'avant ; stabilisé, puis 8 verts sur 8 relancé seul (bureau et 390 px, 4 fois chacun) avant la suite finale.

## Décisions prises à la place de Vincent
- Décision : **un ajout ou un « Recalculer avec l'IGN » se place juste devant le premier recalcul automatique en attente** ; entre eux, ajouts et recalculs manuels gardent leur ordre d'arrivée — R36 dit « devant les recalculs automatiques pas encore commencés » et « le calcul en cours continue » — coût si c'est faux : une ligne de `file.ts`.
- Décision : à l'ouverture, un proche gardé incomplet (R37, « calculé comme un nouveau proche ») **n'est pas** un recalcul automatique : il garde sa place dans l'ordre d'ajout, mais un ajout qui passe devant un recalcul automatique placé avant lui passe aussi devant lui (cas : R37, recalcul, R37 → l'ajout se place après le premier R37) — la règle ne parle que des recalculs, et réordonner les R37 contredirait « la file suit l'ordre d'ajout, proches de R37 compris » — coût si c'est faux : un proche gardé incomplet attend un calcul de plus (≤ 45 s) ; cas rare (il faut à la fois un proche de l'ancienne version et un approximatif).
- Décision : la file passe dans un **module pur** `src/proches/file.ts` (`placer`), testé seul (le plan demande des tests unitaires de la file ; `useProches`, un hook React, ne se teste pas seul) — coût si c'est faux : aucun.
- Décision : étape 3 de la vérification par **la réouverture 16 min plus tard (horloge de la page)**, et non par le lien — c'est le chemin automatique que la spec décrit d'abord ; le lien est tenu par AC-9 et AC-8 (d) — coût si c'est faux : refaire l'étape 3 avec le lien (2 min).
- Décision : le test hors critère de 5a « les zones d'annonce de la page ne changent pas pendant le recalcul… » **attend que l'indicateur de chargement de la carte soit parti** avant de remettre son guetteur à zéro — il tombait 3 fois sur 4 sans aucun changement du code (vérifié avec le code d'avant) : l'indicateur reste 300 ms après la carte prête (H9) et son retrait était compté comme une annonce du recalcul. Le `given`, l'action et l'attendu ne changent pas — coût si c'est faux : aucun ; leçon écrite.

## Fichiers touchés hors de la liste de la tâche
- `src/proches/file.ts` et `src/proches/file.test.ts` (nouveaux) — la file avec priorité, en module pur, et ses tests unitaires (le plan nommait « tests unitaires de la file » sans fichier).
- `src/ui/LigneProche.tsx` (dans la liste) n'a pas changé : le lien agit depuis 5a et rend le focus à « Retirer ».
- `docs/solutions/2026-10-16-guetteur-d-annonces-et-indicateur-de-chargement.md` (leçon), une ligne « Revu le » dans `docs/solutions/2026-10-13-isochrones-ign-lents-et-limite-de-debit.md`, et l'index généré `docs/solutions/README.md`.

## Tests recalés ou retirés
- Aucun retiré. Un test hors critère de cette tranche stabilisé (décision ci-dessus) : une attente ajoutée avant la remise à zéro du guetteur, rien d'autre. Aucun test d'un AC-n d'une autre tranche touché.

## Leçons écrites
- `docs/solutions/2026-10-16-guetteur-d-annonces-et-indicateur-de-chargement.md` — un test qui guette les annonces part d'une page au repos (indicateurs partis, pas seulement « carte prête »).
- `docs/solutions/2026-10-13-isochrones-ign-lents-et-limite-de-debit.md` — « Revu le 2026-10-16 » : l'IGN a répondu 405 sur tout calcul pendant au moins 40 min ; mesurer juste avant une preuve, et réessayer plus tard plutôt que d'inventer des zones.
