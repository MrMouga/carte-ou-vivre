# Tâche 3b — La réaction de la carte, puis la scolarité
Statut : faite · Début 15:37 · Fin 16:02 · Commits : ced0416 (mesure de H163) .. a5cffd5 (code, tests, captures), puis ce rapport

## Ce que l'utilisateur peut faire maintenant
- Dans « Services », cocher un ou plusieurs niveaux de « Scolarité » (« Crèche », « École », « Collège », « Lycée », « Supérieur ») et un temps commun (« 5 min », « 10 min », « 20 min »). Chaque niveau coché filtre avec ce temps : une commune doit les avoir tous à ce temps ou moins. La carte, la liste, les raisons de la fiche et l'adresse suivent (`services=ecole:10,college:10`, niveaux dans l'ordre des âges).
- Tant qu'il manque l'un ou l'autre (des niveaux sans temps, ou un temps sans niveau), rien ne filtre, rien n'est écrit dans l'adresse, et la phrase « Coche au moins un niveau et un temps. » s'affiche sous le temps de la scolarité. Un lecteur d'écran l'entend comme description des deux groupes (niveaux et temps). Elle n'est annoncée par aucune zone d'annonce.
- Retirer le dernier niveau, ou le temps, ramène à l'état incomplet ; tout décocher fait disparaître la phrase.
- Repliée, « Services » compte la ligne « Scolarité » pour un choix, quel que soit le nombre de niveaux.

## H163 — la réaction de la carte (mesurée avant de brancher la scolarité)
Détail dans [mesure-tache-0.md](../mesure-tache-0.md#tâche-3b--réaction-de-la-carte-quand-on-coche-un-service-h163). Script : `captures/T3b-mesure-reaction.mjs` (celui d'emploi, avec les gestes de services en plus). Sortie : `captures/T3b-reaction.txt`. Conditions : version construite ffa5f40, vraies données, processeur ralenti 4 fois, 15 essais par sens, 2 tours, 15:38 à 15:41.

| Geste | Communes décolorées | Écart au témoin (161 et 162 ms) |
|---|---:|---|
| « 5 min » pour « Médecin » : cochée / décochée | 20 504 | + 15 à + 31 / + 65 à + 66 ms |
| « 10 min » pour « Gare » en « Grandes lignes » : cochée / décochée | 33 667 | + 33 / **+ 115 à + 116 ms** |
| « Ville dense » (déjà en ligne, référence de la limite) : cochée / décochée, même tour | 34 031 | + 32 à + 33 / **+ 114 à + 116 ms** |
| Mairies T2 (en ligne) : « Centre » décochée | ≈ 34 000 | + 116 à + 131 ms |
| Mairies T0 : « Ville dense » cochée / décochée | 34 031 | + 17 / + 100 ms |
| Emploi T3b (en ligne) : « 10 % » des infirmiers cochée / décochée | 28 458 | + 16 à + 17 / + 83 ms |
| Emploi T0b et T3b : « Ville dense » décochée | 34 031 | + 101 à + 115 ms |

**Lecture.** Le cas nommé par le plan (« 5 min » pour « Médecin ») reste loin de la limite : + 66 ms au plus. La gare en « Grandes lignes » décolore presque toute la carte et coûte **exactement ce que coûte « Ville dense » dans le même tour** (277 ms contre 277, puis 277 contre 276). Elle mesure + 116 ms au tour 1 et + 115 ms au tour 2. La référence de la limite mesure + 116 et + 114 ms dans les mêmes tours. Voir la première décision ci-dessous.

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-4 | `tests/e2e/services.spec.ts` · « AC-4 /?loyer=1200&services=medecin:10 : « 15 min » seule cochée, puis décochée ; « Crèche », « École » et « 5 min » : repliée « 1 choix », creche:5,ecole:5 » | vert, bureau et mobile |
| AC-14 | `tests/e2e/services.spec.ts` · « AC-14 /?loyer=1200, « École » et « Collège » : phrase de l'état incomplet, rien ne filtre ; « 10 min », « Lycée », puis « 20 min » filtrent » (vérifie aussi que la phrase décrit les deux groupes et n'est dans aucune zone `role=status`, `role=alert` ou `aria-live`) | vert, bureau et mobile |
| AC-17 | `tests/e2e/services.spec.ts` · « AC-17 /?loyer=1200, « Supérieur » et « 20 min » : superieur:20, raisons et fiche ; « École » en plus ; dernière adresse réécrite » | vert, bureau et mobile |
| hors AC (états de « Scolarité », H153, H154) | `tests/e2e/services.spec.ts` · « H153 : un temps sans niveau est incomplet ; décocher tout revient à vide ; retirer le dernier niveau d'une scolarité active la rend incomplète » | vert, bureau et mobile |

Les tests de 3a restent verts. Le guetteur des annonces (R57, H100 de proches-fiables) aussi : aucune zone `role="status"` ni `aria-live` n'a été ajoutée.

## Preuves
- `docs/plans/2026-11-24-services/captures/T3b-reaction.txt` et `mesure-tache-0.md` : la mesure de H163 (15:38 à 15:41).
- Version construite du code de 3b, avant son commit, servie par `npx vite preview --port 4180` (`version.txt` disait ced0416, le commit de la mesure). Vraies données. Script `captures/T3b-captures.mjs`, journal `captures/T3b-captures.txt` (15:46). Gestes faits au toucher à 390 × 844 :
  - `captures/T3b-cat-incomplete-390.png` : « École » et « Collège » cochés, sans temps. La phrase « Coche au moins un niveau et un temps. » apparaît sous les temps de la scolarité, en petit et en gris. Selon le journal, l'adresse reste `/?loyer=1200` et la carte affiche toujours 34 674 communes. Les deux groupes ont la phrase pour description.
  - `captures/T3b-cat-active-390.png` : « 10 min » coché, la phrase disparaît. Selon le journal, l'adresse devient `/?loyer=1200&services=ecole:10,college:10` et la carte affiche 20 024 communes. Les groupes n'ont plus de description.
  - `captures/T3b-feuille-incomplete-390x844.png`, `captures/T3b-feuille-active-390x844.png` : la feuille défilée jusqu'à « Services ».
  - `captures/T3b-bureau-active-1440x900.jpg` : le lien `/?loyer=1200&services=ecole:10,college:10` rouvert en bureau. « École », « Collège » et « 10 min » sont cochés, la carte affiche 20 024 communes.
- `captures/T3b-npm-test.txt` : la sortie de la suite complète.
- Ce que la preuve ne couvre pas : un vrai lecteur d'écran (VoiceOver), et la réaction de la carte avec une scolarité cochée (la mesure a été faite avant le branchement, comme le plan le demande).

## Suite de tests
- `npm test` (suite complète, un seul passage, 15:47 à 16:00, code identique à a5cffd5), sortie 0 :
  - Vitest : `Test Files  24 passed (24)` · `Tests  397 passed (397)`
  - Playwright : `45 skipped` · `464 passed (12.9m)`, aucun rouge, aucun test instable tombé.
- `npm run typecheck` : sans erreur.
- `node scripts/check-tokens.mjs` : `check-tokens : 47 fichier(s), aucune valeur arbitraire`.
- `npm run build` : `✓ built in 2.54s` (avec l'avertissement habituel sur la taille d'un morceau).
- Pendant le travail : `npx playwright test tests/e2e/services.spec.ts` : `1 skipped` · `41 passed (36.7s)`. Avant le code, les 4 nouveaux tests étaient rouges pour la bonne raison (cases de la scolarité inactives).

## Décisions prises à la place de Vincent
- Décision : l'écart de la gare en « Grandes lignes » décochée (+ 115 ms au tour 2, + 116 ms au tour 1) est lu comme **égal à la limite de H163, pas au-delà**, et la scolarité est branchée sans arrêt. Pourquoi : la limite est définie comme « le plus grand écart déjà en ligne (« Ville dense » décochée) », et ce geste mesure + 116 et + 114 ms dans les mêmes tours ; les deux gestes ont la même médiane à 1 ms près. Cet écart d'1 ms vient du témoin (161 ou 162 ms) et reste bien sous la durée d'une image (16,7 ms). « Centre » décochée, en ligne depuis mairies, a déjà mesuré jusqu'à + 131 ms. Le geste mesuré existe depuis 3a, et brancher la scolarité ne le rend pas plus lent. Coût si c'est faux : Vincent juge les chiffres ci-dessus ; s'il veut une carte plus rapide, il faut accélérer le recoloriage de toute la carte, ce qui concerne aussi « Ville dense » et « Centre » déjà en ligne. Revenir en arrière sur la scolarité ne coûterait qu'un commit.
- Décision : la phrase de l'état incomplet est placée sous le groupe des temps, dans la ligne « Scolarité », avant le filet qui précède « Gare ». Elle n'est présente que dans cet état, et `aria-describedby` n'est posé sur les deux groupes que pendant ce temps-là. Pourquoi : c'est la place de `PhraseScolarite` dans le prototype F, et une description vers une phrase absente ne dirait rien. Coût si c'est faux : une ligne à déplacer.
- Décision : cocher ou décocher un niveau garde les niveaux dans l'ordre des âges (H167), quel que soit l'ordre des touchers. L'adresse et les raisons suivent déjà cet ordre par `filtresServices`.

## Fichiers touchés hors de la liste de la tâche
- `docs/plans/2026-11-24-services/captures/T3b-*` : scripts, journaux, captures, sortie de la suite. Ils sont dans le dossier prévu. Ce rapport s'y ajoute.
- Aucun autre fichier. `src/domain/services.ts` (`filtresServices`), `format.ts` (`resumeServices`) et `App.tsx` ont servi tels quels, sans modification.

## Tests existants modifiés
- aucun. `tests/e2e/services.spec.ts` gagne 4 tests et 4 petites fonctions d'aide à la fin du fichier ; aucune ligne existante n'a changé. Aucun test protégé n'a été touché.

## Leçons écrites
- aucune. Aucun correctif n'a demandé deux essais, et la mesure n'a pas contredit le plan : le cas du médecin est sous la limite, et la gare en « Grandes lignes » est égale à la référence.
