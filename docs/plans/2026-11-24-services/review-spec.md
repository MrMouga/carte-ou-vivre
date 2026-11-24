# Relecture spec — services
Statut : terminé

Suite de tests (relancée par le relecteur le 2026-11-24, `npm test`) : Vitest **24 fichiers, 397 / 397 verts** ; `check-tokens : 47 fichier(s), aucune valeur arbitraire` ; Playwright **469 passed, 3 failed, 48 skipped, 1 did not run (13.6m)**, sortie 1. Les 3 rouges, tous en [mobile] et tous au délai de 30 s sous charge : proches-clavier-iphone.spec.ts:82, proches-clavier-iphone.spec.ts:93, proches-mobile.spec.ts:23 (4 proches). **Relancés seuls : 5 / 5 verts (9,8 s)**. Tous les tests de services.spec.ts sont verts aux deux largeurs, AC-12 et AC-15 [mobile] compris.
Périmètre : 450de06..ec8ad69 (29 commits).

## Verdict
**Conforme à la spec.** Je n'ai pas réussi à montrer un écart. Chaque critère, de AC-1 à AC-17, a un test qui porte son identifiant. Chaque test affirme les valeurs concrètes du critère : adresses exactes, comptes, noms et scores dans l'ordre, textes mot pour mot. R51 à R57 sont faits comme écrits, de même que l'ordre H160, l'adresse R55 et le chargement R57. La jointure se fait par code INSEE (une `Map` par code ; l'ordre de `services.json` est identique à celui de `communes.json` et n'est pas utilisé). Aucun test protégé n'a été modifié. Dans `acceptance.json`, seuls les drapeaux `passes` ont changé. Aucun constat Bloquant ni Majeur. Les constats portent sur la méthode (les heures de progress.md, une condition d'arrêt franchie) et sur une phrase de la spec.

## Bloquant
Aucun.

## Majeur
Aucun.

## Moyen
[Moyen] Les heures « vérifié par l'orchestrateur le 2026-11-24 HH:MM » de progress.md sont plus tardives que le commit qui les écrit (8 sur 9).
  Où : docs/plans/2026-11-24-services/progress.md, lignes Tâche 0a à Simplification
  Preuve : `git log -S "le 2026-11-24 <heure>" -- progress.md` : 13:05 écrite par 035166b à 12:50 ; 13:20 par a0ae44c à 13:05 ; 13:35 par 8b8e35d à 13:21 ; 14:25 par e303ba1 à 14:17 ; 15:00 par 409b9cf à 14:57 ; 15:50 par ffa5f40 à 15:36 ; 17:40 par a56d252 à 17:30 ; 18:20 par ec8ad69 à 18:00. Seule 16:15 (2286a4f à 16:36) est possible.
  Conséquence : ces heures ne permettent pas de dater une preuve, car elles ont été estimées et non lues. Ce qui a été vérifié reste plausible : environ 13 min séparent chaque rapport de son commit « vérifiée », soit la durée de la suite.
  Correction : écrire l'heure lue (`date +%H:%M`) au moment d'écrire la ligne, ou s'en tenir au hash du commit.

[Moyen] La preuve « vrai flux » de la tâche 4 a été faite avant les derniers changements de code. Elle n'a pas été refaite après la simplification.
  Où : captures/T4-bout-en-bout.txt (16:59 à 17:01) ; commit 78cbeb5 (17:16) ; e912ae3 (17:46) touche src/App.tsx, src/ui/Services.tsx, src/domain/url.ts, format.ts et services.ts
  Preuve : horodatage du journal et `git show --stat e912ae3`. Après la simplification, seuls la suite, les types et le build ont été relancés (taches/simplification.md:30).
  Conséquence : le diff relu est sans changement de comportement (une fonction `chargerTemps` partagée, `texteValeur` réutilisé pour les raisons). Le risque est faible, mais CLAUDE.md exige que « Fini » soit un effet observé sur le vrai flux, et ce n'est pas le cas pour la version livrée.
  Correction : relancer `captures/T4-bout-en-bout.mjs` sur `npx vite preview` à ec8ad69 avant /ship (étapes 1 à 7 de details.md).

## Mineur
[Mineur] La condition d'arrêt de la tâche 3b a été franchie sans arrêt. Pour H163, le tour 1 a mesuré + 116 ms pour une limite de + 115 ms. Le constructeur a branché la scolarité avant la décision.
  Où : progress.md, Tâche 3b ; a5cffd5 commité après la mesure ced0416
  Preuve : progress.md le note lui-même (« Écart au plan »). Vincent a accepté la vitesse ensuite (« Décidé par Vincent le 2026-11-24 (H163) »).
  Conséquence : aucune sur le produit. Un arrêt prévu par le plan a été contourné.
  Correction : rien à refaire ; à garder comme leçon pour les constructeurs.

[Mineur] R51 dit encore que, dans « Scolarité » et « Gare », « le choix et le temps ont chacun leur titre visible (H169) ». Or H169, amendée le 2026-11-24, retire les titres visibles « Niveaux de scolarité » et « Type de gare ».
  Où : docs/specs/2026-11-23-services/details.md:40 contre :113
  Preuve : le code suit H169 et AC-1 (src/ui/Services.tsx:147-207). Les groupes gardent leur nom pour les lecteurs d'écran ; seul « Temps de trajet maximal » est visible.
  Correction : amender la phrase de R51 (« le temps a son titre visible ; le choix est nommé pour les lecteurs d'écran »).

[Mineur] Deux fichiers modifiés hors des listes de fichiers des tâches. Les deux sont déclarés dans progress.md.
  Où : src/ui/Emploi.tsx:147-148 (tâche 1 : défilement arrondi au pixel supérieur, pour que le test protégé H148 d'emploi ne tombe pas de 0,25 px) ; src/ui/Categorie.tsx:13-26 (tâche 4 : propriété facultative `refBouton`)
  Preuve : `git diff --stat --diff-filter=MDR 450de06..HEAD -- tests src scripts` ; le seul fichier de test touché est tests/e2e/lib/carte.ts, avec 13 lignes ajoutées et 0 retirée, comme le prévoit l'accord du plan.
  Conséquence : aucune. Les deux changements sont petits et justifiés.
  Correction : aucune.

[Mineur] Deux tests protégés de proches sont tombés dans la suite complète alors qu'ils ne sont pas dans la liste des tests instables connus : proches-clavier-iphone.spec.ts:82 et :93 [mobile]. proches-mobile.spec.ts:23 est aussi tombé en [mobile], alors que la liste ne le connaît qu'en [bureau].
  Où : la suite complète du relecteur (journal npmtest.log du scratchpad)
  Preuve : les 3 tombent au délai de 30 s dans la suite complète ; relancés seuls, ils sont verts (5 / 5 en 9,8 s). Ils n'ont pas de lien visible avec services : les champs « Tes proches » au focus sur iPhone.
  Conséquence : il n'y a pas de régression montrée, mais la liste des tests instables s'allonge, et un vrai défaut pourrait s'y cacher.
  Correction : ajouter ces trois cas à la liste des tests instables du brief, ou les relancer trois fois seuls avant /ship.

## Couverture des critères
| AC | Test | Statut | Note |
|---|---|---|---|
| AC-1 | tests/e2e/services.spec.ts:327 | couvert | ordre des catégories, textes de la catégorie, 6 groupes nommés, seul « Toutes » pressé, liste d'AC-1 de mairies |
| AC-2 | services.spec.ts:356 | couvert | adresse, 4 communes dans l'ordre avec leurs scores, raison de Terrebasse |
| AC-3 | services.spec.ts:366 | couvert | ordre médecin puis gare dans les raisons vérifié |
| AC-4 | services.spec.ts:496 | couvert | — |
| AC-5 | scripts/data/services.test.ts:31 | couvert | lance `services.py --extrait` sur l'extrait de la fixture ; toutes les valeurs, dont les arrondis et les arrondissements |
| AC-6 | services.spec.ts:49 (+ src/domain/services.test.ts:51, :74) | couvert | lignes sous le chômage, comparées en entier et dans l'ordre ; phrase des limites mot pour mot ; espace insécable vérifiée |
| AC-7 | services.spec.ts:88 | couvert | les deux mentions, plus 10 mentions des tranches précédentes |
| AC-8 | services.spec.ts:227 (+ services.test.ts:207) | couvert | — |
| AC-9 | services.spec.ts:381 | couvert | jeu « cas sûrs » construit depuis `variante_cas_surs` ; les trois étapes |
| AC-10 | services.spec.ts:414 | couvert | — |
| AC-11 | services.spec.ts:436 (+ services.test.ts:154-170) | couvert | les trois adresses réécrites exactement |
| AC-12 | services.spec.ts:726 | couvert | projet mobile seulement (sauté en bureau, normal). Le défilement jusqu'à « Services » est fait par l'aide `amenerEnBas` (le geste de l'utilisateur) ; la pastille amenée par l'appli est vérifiée en plus à :756 |
| AC-13 | scripts/data/services.test.ts:84 | couvert | lit le vrai `public/data/services.json` ; 34 746 codes ; valeurs exactes |
| AC-14 | services.spec.ts:517 | couvert | phrase de l'état incomplet reliée aux deux groupes et hors zone d'annonce |
| AC-15 | services.spec.ts:608 | couvert | retard, erreur, « Réessayer », puis adresse avec `services` sans liste avant le fichier |
| AC-16 | scripts/data/services.test.ts:68 | couvert | g1 à g6 ; 70 min écrit « 61 ou plus » |
| AC-17 | services.spec.ts:547 | couvert | — |

Les drapeaux `passes: true` des 17 critères sont tous justifiés par un test réel. Les 17 tests sont verts dans ma relance complète.

## Vérifié, sans constat
- **R53 / D7** (src/domain/services.ts:185-191) : le temps passe s'il est inférieur ou égal au temps coché ; une commune sans chiffre passe ; l'île est écartée sur les 3 gares quel que soit son temps ; la Corse est écartée sur les gares régionale et grandes lignes, avec la règle normale en « Toutes » ; une commune de population 0 est écartée sur tous les services. Le filtre ne note pas (score.ts:316-320, rien dans `notes`).
- **Textes des raisons** (format.ts:316-322) : conformes à R53, avec espace insécable avant « : » ; « Gare régionale plus d'une heure : … » au-delà de 60 min.
- **H160** : les raisons des services viennent après celles des proches, dans l'ordre fixe de `filtresServices` (score.ts:316).
- **R54** : 10 lignes dans l'ordre, valeurs dans l'ordre île, Corse, temps, « plus d'une heure », « pas de chiffre » ; phrase des limites toujours présente ; phrase de la traversée seulement si l'un des 7 premiers services a un temps ; bloc sous « Tes proches » (testé à services.spec.ts:274). Les espaces insécables de H159 sont vérifiées octet par octet (FicheServices.tsx:61, services.ts:68).
- **R55** (url.ts:108-127, 172-173) : entrées inconnues ou invalides retirées ; la première entrée valide est gardée par service et pour les 3 gares ensemble ; le temps commun de la scolarité est fixé par sa première entrée ; ordre fixe ; `services` placé entre `metier` et `bien` ; le champ est absent sans entrée.
- **R57** (App.tsx:104-145) : sans `services` dans l'adresse, chargement après `prete` avec le délai de 15 s ; état séparé ; « Réessayer » ne relance que les temps (testé : aucune autre donnée redemandée). Avec `services`, le fichier est dans le même `Promise.all`, même si les entrées sont invalides (testé à :256). La catégorie est inactive tant que les temps ne sont pas prêts.
- **Annonces** : aucune nouvelle zone `role="status"` ni `aria-live`. `role="alert"` n'existe qu'en erreur (FicheServices.tsx:22). « Chargement des temps… » est hors zone d'annonce.
- **Fichier des temps** : `services.json` a 34 746 codes, dans l'ordre de `communes.json`, avec 10 chaînes et les 16 îles de H161. Il est relu par la même fonction que la page. Le calcul en amont (services.py:159-211) suit R52, H156 et H157 sans virgule flottante ; la page ne recalcule rien.
- **Contrat du design** : `check-tokens` vert ; aucune valeur entre crochets, couleur en dur ni `style=` dans Services.tsx et FicheServices.tsx. Les composants Cases collées, Cases séparées et Choix souligné à trois valeurs suivent docs/design/system/README.md:67-73, mais sont recodés localement comme dans CadreDeVie.tsx et Emploi.tsx, ce qui est la façon de faire du projet.
- **Tests protégés et critères** : seul `tests/e2e/lib/carte.ts` a changé, par ajouts seulement, comme le prévoit l'accord du plan. Dans `acceptance.json`, seuls les 17 `passes` ont changé (34 lignes), et aucun `given / when / then`.
- **CLAUDE.md** : la source Insee, les fichiers SNCF et openrouteservice, et les mentions H164 et H172 sont ajoutés (tâche 0a, simplification).
- **Fichiers servis** : `gares-grandes-lignes.csv` contient 61 gares (H172) ; aucune image de plus de 600 Ko dans docs/.
- **« Ne change pas »** : suite complète à 469 verts ; les 3 rouges (tests de proches au délai de 30 s) sont verts relancés seuls ; Vitest 397 / 397.

## Non jugé
- **Rendu visuel face au prototype F**, chemin au clavier, 375 × 548 vu à l'œil : laissés au qa-tester (`qa.md`, non lu).
- **Tableau de crédibilité** (tâche 0c) : 9 lignes « autre côté », dont 2 sur des communes ordinaires (Les Sables-d'Olonne, Saint-Véran). Si Vincent juge ces deux lignes fausses à la démo, la tranche lui revient (credibilite-services.md:15). C'est à savoir avant la démo ; ce n'est pas un défaut de construction.
- **Calcul des données** (extraction DuckDB, gares.py, comptes de mesures.md) : non relancé ; seules les valeurs d'AC-13 ont été relues dans le fichier servi.
