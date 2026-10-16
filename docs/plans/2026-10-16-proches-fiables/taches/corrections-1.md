# Corrections 1 — ordre de la file à la réouverture, vérification de bout en bout sur le code final
Statut : faite · Début 20:08 · Fin 20:53 · Commits : 9e6d03d..(commit de ce rapport)

## Ce que l'utilisateur peut faire maintenant
Quand il rouvre le site, ses proches se recalculent dans l'ordre où il les a ajoutés. Un proche gardé incomplet par la version en ligne ne passe plus devant un proche approximatif ajouté avant lui (avant le correctif, ce proche-là attendait jusqu'à 45 s de plus). Un ajout ou un « Recalculer avec l'IGN » fait ensuite passe toujours devant les recalculs automatiques pas encore commencés (comme en T5b).

## Constat Majeur 1 — la file à l'ouverture ne suivait pas l'ordre d'ajout (R36)
**Ce qui change** (`src/proches/useProches.ts`, boucle d'ouverture) : chaque calcul de l'ouverture (recalcul automatique R36 ou calcul R37) va maintenant **en fin de file**, dans l'ordre des proches. Il ne passe plus par la règle de priorité de `placer` : c'est elle qui faisait passer un calcul R37 devant un recalcul automatique déjà placé. `placer` (`src/proches/file.ts`) n'a pas changé : il sert toujours aux ajouts et aux « Recalculer avec l'IGN », qui passent devant le premier recalcul automatique en attente. Un commentaire de `file.ts` le dit. La vérification « déjà dans la file ou en calcul » de l'ouverture reste en place (`enFile`), donc un proche n'a toujours qu'un calcul à la fois.

**Test de non-régression**, qui passe par la vraie ouverture (e2e, fixture, bureau et 390 px) : `tests/e2e/proches-fiables.spec.ts` · « réouverture : Rochelleville (17) à vol d'oiseau (ajouté en premier, recalcul) puis Nantesville (44) gardé indisponible par la version précédente (R37) → les zones de Rochelleville (17) partent d'abord, puis celles de Nantesville (44) ; les deux prêts ».
- Données de départ : Rochelleville (17) ajouté en premier avec AC-4 (panne totale, à vol d'oiseau, 120 km). Ensuite, une entrée de Nantesville (44), `id` 2, écrite au format de la version en ligne (`tests/fixtures/memoire-56ac3d6.ts`, état « indisponible »), est posée dans le stockage avant la réouverture. La page est rouverte 16 min plus tard (horloge simulée), avec l'IGN normal.
- Vérifié : 12 zones depuis chacun des deux proches, et les 12 premières zones demandées partent toutes de Rochelleville (`0.5,0.5`). À la fin, les deux proches sont prêts : curseur de Rochelleville jusqu'à 3 h, Nantesville à 2 h 15.
- **Rouge avant le correctif** (code de 16d4713, 20:22, bureau et mobile, `2 failed`) : seule la dernière vérification tombe, `les 12 premières zones demandées` : il attendait 12 × `"0.5,0.5"` et a reçu 12 × `"-2,3"`. Nantesville (44), le proche de l'ancienne version, partait donc en premier, comme l'a vu le relecteur (file `2, 1`).
- **Vert après** : `28 passed (3.5m)`, sur tous les tests de réouverture et de recalcul de `proches-fiables.spec.ts` (AC-6 c, AC-7, AC-8 a à e, AC-10 a à c, AC-11, ce test, « Retirer » pendant un recalcul, réouverture sans calcul). Ordre relevé : `0.5,0.5` × 12 puis `-2,3` × 12.
- Une seule ligne d'un test existant change : l'outil `entreeAncienne` prend un `id` en option (1 par défaut, donc AC-10 ne change pas). Aucun test AC-n n'est modifié.

Le test unitaire `src/proches/file.test.ts:45` est laissé tel quel. Il vérifie toujours une vraie règle de `placer` (un ajout fait après l'ouverture se place devant le premier recalcul automatique), mais il ne prouve pas l'ordre de l'ouverture : c'est le nouveau test e2e qui le prouve.

## Constat Mineur 1 — vérification sur le vrai flux après la simplification
Le script de bout en bout de T5b a été rejoué sans changer sa logique, sur le code final (9e6d03d, après la simplification) : version locale (serveur vite du dépôt), vraies données, vrai fond, vraie recherche d'adresse, vrai calcul de trajets de l'IGN. Les pannes sont posées par des routes du navigateur de test, sur `/navigation/isochrone` seulement. Navigateur neuf, bureau puis 390 px. Sortie complète : `captures/C1-preuve-sortie.txt`.

**IGN mesuré d'abord** (curl, 20:27, 12 rue de la Paix, Nantes, même URL que `urlIsochrone`) : il répond. 15 min : 200 en 0,34 s · 75 min : 200 en 1,39 s · 2 h : 200 en 3,07 s (67 608 o) · 3 h : 200 en 7,01 s.

- **Étape 1** (pannes de la démo : 75 min en 502 à chaque essai ; 2 h et 3 h jamais servies ; les 9 autres au vrai IGN, toutes en 200) : **partiel**. On lit « Temps approximatifs : l'IGN n'a pas tout donné. », « Au-delà de 2 h 45 : l'IGN n'a pas répondu. », « 2 h au plus », un curseur de 15 min à 2 h 45, puis « Recalculer avec l'IGN » et « Retirer ». Le calcul dure **45,7 s** en bureau et **45,2 s** en 390 px, pour 13 demandes (75 min deux fois). La fiche de La Rochelle dit « Nantes (44) jusqu'à 2 h 15 : au-dessus de ton plafond de 2 h » et « Nantes (44) : jusqu'à 2 h 15 en voiture ».
- **Étape 2** (proche retiré, calcul de trajets bloqué, 24 demandes bloquées, même proche ajouté de nouveau) : **km** en 5,9 s. On lit « À vol d'oiseau : l'IGN ne répond pas. » et « 120 km au plus ». La fiche de La Rochelle dit « Nantes (44) 121 km : au-dessus de ton plafond de 120 km » et « Nantes (44) : 121 km à vol d'oiseau ». Stockage relu : `"etat":"km","zones":[],"plafond":120`.
- **Étape 3** (vrai IGN rétabli, page rouverte « 16 min plus tard » par l'horloge de la page, stockage non touché) : on voit d'abord « Recalcul avec l'IGN… » à la place du lien, avec « 120 km au plus ». Puis le proche est **prêt** : « 2 h », curseur de 15 min à 3 h, « Retirer » seul. Le recalcul finit 4,3 s (bureau) et 4,8 s (390 px) après la capture. Il fait 12 zones, une fois chacune, toutes en 200. La fiche de La Rochelle dit « Nantes (44) : 2 h 15 en voiture ». Sur les étapes 1 à 3, aucune demande de zone ne contient le nom du proche ni l'adresse.
- Mêmes résultats qu'en T5b, à la durée près (45,1 s → 45,7 s).
- À noter : en bureau, le fond Plan IGN ne s'est pas chargé pendant cet essai (`fond : secours`, pastille « Fond de carte indisponible »). En 390 px, il s'est chargé (`fond : ign`). Le calcul des trajets n'en dépend pas : ses zones sont parties au vrai IGN dans les deux cas. Sur la capture bureau de l'étape 3 (scratchpad seulement), la pastille « Fond de carte indisponible » recouvre l'annonce du proche en haut de la carte. C'est un constat à regarder en démo, rien n'a été changé.

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| R36 (hors AC, Majeur 1) | `tests/e2e/proches-fiables.spec.ts` · « réouverture : Rochelleville (17) à vol d'oiseau (ajouté en premier, recalcul) puis Nantesville (44) gardé indisponible… » | rouge avant (20:22), vert après, bureau et 390 px |
| AC-11 (inchangé) | `tests/e2e/proches-fiables.spec.ts` · « AC-11 … ajout de Toulouseville (31) pendant le recalcul… » | vert (l'ajout passe toujours devant le recalcul automatique) |
| AC-10 a/b/c (inchangé) | `tests/e2e/proches-fiables.spec.ts` · « AC-10 (…) » | vert |

## Preuves
- `docs/plans/2026-10-16-proches-fiables/captures/C1-preuve-sortie.txt` : curl de l'IGN, puis la sortie complète des étapes 1 à 3, bureau et 390 px (20:27–20:48)
- `docs/plans/2026-10-16-proches-fiables/captures/C1-390-1-ligne.jpg` : étape 1, partiel, « Au-delà de 2 h 45 », « Recalculer avec l'IGN » (20:45)
- `docs/plans/2026-10-16-proches-fiables/captures/C1-390-2-fiche-la-rochelle.jpg` : étape 2, La Rochelle « Nantes (44) : 121 km à vol d'oiseau » (20:46)
- `docs/plans/2026-10-16-proches-fiables/captures/C1-390-3-apres.jpg` : étape 3, prêt à 2 h après le recalcul à la réouverture, « Retirer » seul (20:47)

## Suite de tests
Port 4173 libre, suite lancée à 20:27 sur le code du correctif. Sortie gardée dans le scratchpad de la session (`c1/npm-test-1.txt`).
```
 Test Files  18 passed (18)
      Tests  286 passed (286)
check-tokens : 41 fichier(s), aucune valeur arbitraire
  2 failed
  36 skipped
  350 passed (12.9m)
```
Les 2 rouges sont tous les deux dans `cadre-de-vie.spec.ts`, en bureau : AC-7 (l'instabilité connue, hors périmètre) et **AC-11 de cadre-de-vie**. Les deux tombent au même endroit, `ficheDeCarte` (ligne 34) : la fiche reste sur Grandeville, parce que le clic sur la carte n'est pas pris (« Expected substring: "Quaibleu (13)" »). Ces tests n'ajoutent aucun proche, donc la file des calculs ne les touche pas. Relancés seuls : `npx playwright test tests/e2e/cadre-de-vie.spec.ts:260 tests/e2e/cadre-de-vie.spec.ts:282 --repeat-each=3`, d'abord `10 passed` avec 2 rouges en bureau, puis `12 passed (23.0s)`. AC-11 de cadre-de-vie a donc la même instabilité qu'AC-7 : à signaler avec le Mineur d'AC-7.
`npm run typecheck` : sans erreur. `npm run build` : « ✓ built in 2.78s » (avertissement habituel de taille de morceau).

## Décisions prises à la place de Vincent
- Décision : le test de non-régression est un **e2e sur la fixture**, et non un test unitaire du hook. Il passe par la vraie ouverture de `useProches` : stockage, chargement de la carte, demandes de zones. Le dépôt n'a pas d'outil pour tester un hook React seul, et en ajouter un ferait un paquet nouveau. Coût si c'est faux : environ 15 s de suite par largeur.
- Décision : le proche de l'ancienne version, dans ce test, est l'état « indisponible » (cas a d'AC-10). C'est le cas cité par le relecteur et le plus courant en ligne. Les cas « calcul » et « empreinte périmée » suivent le même chemin dans le code (`aCalculer`). Coût si c'est faux : aucun.
- Décision : la correction se fait dans la boucle d'ouverture (ajout en fin de file), sans nouvelle option dans `placer`. C'est le plus petit changement, et `placer` garde une seule règle. Coût si c'est faux : une ligne.

## Fichiers touchés hors de la liste de la tâche
- `tests/e2e/proches-fiables.spec.ts` : le nouveau test, et un `id` en option dans l'outil `entreeAncienne` (pas un test AC-n).

## Leçons écrites
Aucune : le correctif a marché du premier coup, et aucune mesure n'a contredit le plan. L'instabilité d'AC-11 de cadre-de-vie est notée ci-dessus pour l'orchestrateur.

## Commits
- 9e6d03d fix(proches-fiables): corrections 1 — à la réouverture, les calculs partent dans l'ordre d'ajout, proches gardés par l'ancienne version compris (R36)
- le commit de ce rapport et des preuves (fix(proches-fiables): corrections 1 — vérification de bout en bout…)
