# Tâche 3b — Les niveaux
Statut : faite · Début 19:57 · Fin 20:15 · Commits : un seul commit `build(emploi): tâche 3b — …` (tests, preuves et ce rapport), après cd8c46f

## Ce que l'utilisateur peut faire maintenant
Pour chaque métier choisi dans « Emploi », on coche un niveau : « 10 % », « 25 % » ou « Partout où il recrute ».
- Cocher une case décoche l'autre. Recliquer la case cochée la décoche, et le métier n'a plus d'effet.
- La carte, la liste, la fiche et l'adresse suivent aussitôt.
- Avec deux métiers venus de l'adresse, chacun a ses cases. Une commune doit passer les deux métiers cochés.
- Une adresse partagée rouvre les mêmes cases cochées. Une adresse abîmée est réparée à l'ouverture (code inconnu, niveau inconnu, doublon, troisième métier).

Sur les vraies données, en bureau et à 390 px : « infirm », on choisit « Infirmiers et sages-femmes », puis « 10 % ». La page passe de « 34 674 communes passent tes critères » à « 6 216 ». La carte ne garde que les coins des bassins qui recrutent le plus d'infirmiers. La liste commence par Colombine (70), 71. Décocher rend les 34 674 communes et la liste de départ (Allarmont (88), 73).

**Aucun code n'a changé dans cette tâche.** Les cases étaient déjà branchées sur le réglage depuis la tâche 3a. La tâche 3b ajoute les six tests de ses critères, la preuve sur les vraies données et la mesure de la réaction de la carte.

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-4 | `tests/e2e/emploi.spec.ts` · « AC-4 /?loyer=1200&metier=V1X80, « 10 % » : … 1 commune, Terrebasse 65 ; A B E F non colorées ; fiche de Quaibleu : ligne du bassin de Montcher et raison une seule fois » | vert, `[bureau]` et `[mobile]` |
| AC-5 | · « AC-5 /?loyer=1200&metier=V1X80:10, « 25 % » : 4 communes, raison de Rhinval (Montcher, 160 km) ; « Partout où il recrute » : 5 communes dans l'ordre de départ… » | vert, deux largeurs |
| AC-6 | · « AC-6 /?loyer=1200&metier=V1X80:25,U1X82, « 10 % » des graphistes : … Terrebasse 65 seule ; fiche de Portmer… » | vert, deux largeurs |
| AC-7 | · « AC-7 /?loyer=aucun&metier=V1X80, « 10 % » : page « sans plafond », Montcher et Terrebasse en couleur neutre, A B E F non colorées… » | vert, deux largeurs (couleurs lues au pixel ; message « Fixe un loyer… » de la liste) |
| AC-9 | · « AC-9 /?loyer=1200&metier=U1X82 : fiches de Grandeville (pas de chiffre publié) et Montcher (1 027) ; « Partout où il recrute » : … fiche de Rhinval… « Chômage : inconnu » » | vert, deux largeurs |
| AC-11 | · « AC-11 trois adresses réécrites (R48) : … « 10 % » cochée pour les infirmiers, rien pour les graphistes… » | vert, deux largeurs |

**Les tests ne passent pas par construction.** Ils étaient verts du premier coup, puisque les cases marchaient déjà. Pour le vérifier, j'ai cassé un instant les cases dans `Emploi.tsx` : cocher n'écrivait plus le niveau. Cinq tests sur six sont alors passés au rouge en bureau : AC-4, 5, 6, 7 et 9, sur la case restée décochée ou sur l'adresse. AC-11 est resté vert, ce qui est attendu : il ne coche rien et ne lit que l'adresse d'ouverture. Le code a ensuite été remis à l'identique : `git diff` ne montre aucun changement dans `src/`.

Les fiches des communes sont ouvertes en cliquant sur la carte, après avoir rouvert la même adresse : c'est l'aide `ficheDeCarte` du fichier (leçon `2026-10-19-clic-sur-la-carte-apres-un-choix-de-commune.md`). Pour cocher une autre case après une fiche, le test revient par « ← Les 10 premières », puis passe par l'onglet « Critères » à 390 px, comme AC-2 de mairies.

## Preuves
Version construite `cd8c46f` (`npm run build`, puis `npx vite preview --port 4180`), sur les vraies données. Le serveur a été arrêté à la fin.
- `captures/T3b-preuve-reel.txt` : le relevé du parcours, pour chaque étape et chaque largeur : adresse, compte et 10 premières lignes de la liste (19:58-19:59). Script : `captures/T3b-preuve-reel.mjs`.
  - « infirm » propose une seule suggestion, « Infirmiers et sages-femmes ».
  - Choisi : `?loyer=1200&metier=V1X80`, 34 674 communes.
  - « 10 % » : `?loyer=1200&metier=V1X80:10`, **6 216 communes**, 1 · Colombine (70) · 71.
  - Décoché : `?loyer=1200&metier=V1X80`, 34 674 communes, 1 · Allarmont (88) · 73.
- `captures/T3b-infirmiers-choisi-1440x900.jpg` : la France entière colorée ; le focus est sur « 10 % » (19:58).
- `captures/T3b-infirmiers-10-1440x900.jpg` : « 10 % » cochée. La carte ne garde que des taches autour des villes des bassins (Paris, Rouen, Nantes, Bordeaux, Toulouse, Montpellier…). La liste et le compte disent 6 216 (19:58).
- `captures/T3b-infirmiers-decoche-1440x900.jpg` : retour à la France entière (19:58).
- `captures/T3b-infirmiers-{choisi,10,decoche}-390x844.jpg` : la carte au-dessus de l'onglet « Critères », la case visible (19:59).
- `captures/T3b-infirmiers-{choisi,10,decoche}-liste-390x844.jpg` : l'onglet « Les 10 premières » à chaque étape (19:59).
- `captures/T3b-reaction.txt` : la mesure de la réaction (19:59-20:02), détaillée ci-dessous. Script : `captures/T3b-mesure-reaction.mjs`.
- `captures/T3b-npm-test.txt` : la sortie complète de `npm test`.

### Réaction de la carte (H141), avec le vrai filtre
Méthode de la tâche 0b, sans changement. Version construite `cd8c46f` sur le port 4180, vraies données, 1 440 × 900, fond uni, processeur ralenti 4 fois, rendu logiciel. On mesure du `keydown` à la deuxième image après le changement de l'adresse. Médiane de 15 essais par sens, 2 tours.

Le geste mesuré : « 10 % » des infirmiers sur `/?loyer=1200&metier=V1X80`. Il fait passer de 34 674 communes colorées à 6 216, donc **28 458 communes se décolorent**. Le substitut « Ville dense » de la tâche 0b est remesuré dans les mêmes tours, pour comparer à charge égale.

Charge de la machine : 4,20 au début du tour 1, 2,77 entre les deux tours, 2,55 à la fin. La suite de tests ne tournait pas.

| Geste (version cd8c46f) | Tour 1 | Tour 2 | Tâche 0b (164a0ed) |
|---|---|---|---|
| Témoin : curseur du prix, un cran | 160 ms | 160 ms | 160 / 161 ms |
| Cases de la mer 50 ↔ 100 km (H90) | 158 ms | 158 ms | 160 / 160 ms |
| **« 10 % » des infirmiers cochée : 28 458 communes décolorées** | **177 ms** | **176 ms** | — |
| **« 10 % » des infirmiers décochée : 28 458 communes recolorées** | **243 ms** | **243 ms** | — |
| « Ville dense » cochée (substitut, 34 031 communes) | 176 ms | 179 ms | 178 / 191 ms |
| « Ville dense » décochée (substitut, 34 031 communes) | 261 ms | 273 ms | 261 / 276 ms |

**Lecture.** Le vrai filtre réagit comme le substitut pour décolorer : 176-177 ms contre 176-179 ms. Il est plus rapide pour recolorer : 243 ms contre 261-273 ms, puisqu'il touche 28 458 communes au lieu de 34 031.

Ramené à l'échelle de H90 comme à la tâche 0b (témoin à 115 ms, soit 45 ms de moins), cela donne **≈ 131-132 ms pour décolorer et ≈ 198 ms pour recolorer**. Vincent avait accepté ≈ 133-146 ms et ≈ 216-231 ms. Les valeurs brutes (177 / 243 ms) restent aussi sous les seuils d'arrêt du brief (≈ 250 / ≈ 330 ms). **Pas d'écart : aucune question.**

**Ce que la preuve ne couvre pas** :
- le toucher sur un vrai iPhone ;
- la réaction à 390 px, mesurée seulement en bureau comme en tâche 0b ;
- les deux métiers cochés sur les vraies données, vus seulement par la fixture (AC-6) et par la tâche 1 (`metier=V1X80:10,M2X90:10` par l'adresse) ;
- l'action de « + Ajouter un second métier » (tâche 4).

## Suite de tests
`npm test`, lancé à 20:02 sur le code final, fini à 20:14. Le port 4173 était libre et le serveur de preuve était arrêté. Charge ≈ 2,5 au départ. Sortie complète : `captures/T3b-npm-test.txt`.
- unit : `Test Files  22 passed (22)` · `Tests  361 passed (361)`
- jetons : `check-tokens : 44 fichier(s), aucune valeur arbitraire`
- e2e : `Running 449 tests using 2 workers` · `39 skipped` · `410 passed (12.0m)`, aucun rouge. Il y a 12 tests de plus qu'en 3a (6 critères × 2 largeurs). Les 39 tests sautés sont les mêmes qu'en 3a.
- types : `npm run typecheck` → `tsc --noEmit -p .`, sans erreur
- build : `npm run build` → `✓ built in 1.80s`, lancé après la suite

## Décisions prises à la place de Vincent
- **Décision : aucune modification de `src/ui/Emploi.tsx`.** Les six critères passent avec le composant de la tâche 3a, branché dès 3a pour AC-14. Coût si c'est faux : aucun ; un défaut que les critères ne voient pas resterait à trouver par la relecture.
- **Décision : dans les tests, la ligne d'un métier et le « Chômage : inconnu » sont cherchés dans le texte de la fiche (« contient »), et les raisons dans la liste sous « Ne passe pas tes critères ».** Ainsi, « une seule fois » (AC-4) et « aucune raison pour les infirmiers » (AC-5, AC-6) se lisent exactement sur les raisons. Coût : aucun pour l'utilisateur.
- **Décision : AC-4 vérifie les quatre communes non colorées (Portmer, Grandeville, Quaibleu, Rhinval), et non la couleur de Terrebasse**, que le critère ne fixe pas. Le critère dit que Terrebasse passe par la liste (65). Coût : aucun.

## Fichiers touchés hors de la liste de la tâche
- `docs/plans/2026-11-21-emploi/captures/T3b-*` : les preuves, leurs deux scripts, la mesure et la sortie de la suite.
- `src/ui/Emploi.tsx` : changé un instant pour casser les cases, puis remis à l'identique, sans commit. Il n'est pas dans le commit.
- `docs/journal.md` et `docs/specs/INDEX.md` étaient déjà modifiés avant la tâche. Je ne les ai pas touchés ni commités.

## Tests existants modifiés
- `tests/e2e/emploi.spec.ts` (fichier de la tranche) : l'import de `./lib/carte` gagne `apresRendu` et `attendreCouleurs`. Six tests et quatre aides (`raisons`, `texteFiche`, `cocher`, `raisonNiveau`) sont insérés avant la ligne « // Tâche 2, suite. ». **Aucun test existant n'est changé.**
- Aucun autre fichier de test n'est touché, et aucun test protégé.

## Leçons écrites
Aucune : rien n'a demandé plus d'un essai, et la mesure confirme le plan au lieu de le contredire.
