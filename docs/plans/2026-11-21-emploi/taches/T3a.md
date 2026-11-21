# Tâche 3a — La catégorie « Emploi » : chercher, choisir, retirer
Statut : faite · Début 19:21 · Fin 19:43 · Commits : a1c6166 (code, tests, preuves) puis le commit de ce rapport

## Ce que l'utilisateur peut faire maintenant
Le panneau a une catégorie « Emploi », ouverte au départ, entre « Vie locale » et « Tes proches » :
- **Sans métier** : le champ « Ton métier » et, dessous, « Les emplois de l'État (enseignants du public, fonctionnaires) ne sont pas dans l'enquête. »
- **En tapant** (2 caractères au moins) : jusqu'à 8 métiers proposés.
  - Un mot du libellé ou d'un nom courant doit commencer par le texte tapé (« femm » trouve « sages-femmes », « etude » trouve « d'étude ») ; accents et majuscules ignorés.
  - Les métiers trouvés par leur libellé passent d'abord, puis ceux trouvés par un nom courant, chacun dans l'ordre alphabétique.
  - Rien ne correspond : « Aucun métier trouvé ».
  - Au clavier : flèches pour passer d'un métier à l'autre, Entrée pour choisir, Échap pour vider le champ.
  - Sur les vraies données, « dévelop » propose 5 métiers, dont « Cadres commerciaux… » par le nom courant « business developer ».
- **Un métier choisi** : le libellé et « Retirer » sur la même ligne ; la phrase « Chiffré dans peu de bassins : la carte en oublie sûrement. » si le métier est peu chiffré ; « Où ce métier recrute le plus » et les cases « 10 % », « 25 % », « Partout où il recrute ».
  - Tant que rien n'est coché : « Coche un niveau pour garder les communes proches de ces bassins. »
  - Le focus va sur « 10 % » dès qu'on choisit.
  - Le lien « + Ajouter un second métier » est affiché. Il ne fait encore rien : son action est en tâche 4.
- **Les cases cochent déjà pour de vrai** : elles changent l'adresse et filtrent la carte (le filtre existe depuis la tâche 1). AC-14 le demandait (« coche 25 % » change l'adresse). Cocher une case décoche l'autre, et une case cochée se décoche d'un clic, comme pour la mer. La tâche 3b n'aura qu'à prouver ses critères.
- **Deux métiers** venus de l'adresse (`metier=V1X80:10,U1X82`) : chacun avec ses cases, séparés par un filet, sans lien d'ajout.
- **« Retirer »** enlève le métier. Le focus va au champ s'il revient, sinon au « Retirer » du métier restant.
- **Repliée**, la catégorie dit « Peu importe », « 1 métier » ou « 2 métiers ».
- **Pendant le chargement**, le champ, les cases et les liens sont désactivés. Les métiers de l'adresse apparaissent dès que leurs libellés sont chargés.

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-1 | `tests/e2e/emploi.spec.ts` · « AC-1 ouverture de / : « Emploi » ouverte entre « Vie locale » et « Tes proches », champ vide… ; repliée, « 1 métier » » | vert, `[bureau]` et `[mobile]` |
| AC-2 | `tests/e2e/emploi.spec.ts` · « AC-2 « i », « medecin », « dévelop », « developpeur », « femm », « etude », « xyz »… » | vert, `[bureau]` et `[mobile]` |
| AC-2 (calcul), AC-1, AC-3 (calcul) | `src/domain/emploi.test.ts` · « AC-2 fixture « 6 communes »… », « AC-1 « infirm » : une seule suggestion », « AC-3 un métier déjà choisi n'est pas proposé » | verts |
| AC-14 | `tests/e2e/emploi.spec.ts` · « AC-14 /?loyer=1200&metier=V1X80,U1X82 : « Chiffré dans peu de bassins… » sous les graphistes seulement ; après « 25 % »… » | vert, `[bureau]` et `[mobile]`. Le test vérifie aussi la place de la phrase (sous le libellé, au-dessus du titre des cases) et qu'elle décrit le groupe (H147). |
| H133 (hors AC) | `src/domain/emploi.test.ts` · « accents et casse ignorés… », « un mot commence au début, après une espace, un tiret… », « ordre : trouvés par leur libellé d'abord… ; 8 au plus ; chacun une fois », « moins de 2 caractères… » | verts (rouges avant le code : fonctions absentes, 8 échecs) |
| H132 (hors AC) | `src/domain/emploi.test.ts` · « « Peu importe », « 1 métier », « 2 métiers » » | vert |
| Hors AC | `tests/e2e/emploi.spec.ts` · « clavier : flèches et Entrée choisissent, le focus va sur « 10 % » ; « Retirer » rend le focus au champ ; Échap vide le champ » | vert, deux largeurs |
| Hors AC | · « deux métiers venus de l'adresse : chacun ses cases, pas de lien d'ajout ; « Retirer » sur le premier… ; résumés « 1 métier » puis « Peu importe » » | vert, deux largeurs |
| Hors AC | · « chargement : le champ « Ton métier » est désactivé tant qu'emploi.json n'est pas là » | vert, deux largeurs |
| Hors AC | · « 390 px : champ en 16 px et 44 px de haut ; cases et « Retirer » de 44 px ; libellé long entier, sur plusieurs lignes » | vert `[mobile]`, sauté en `[bureau]` (le test ne vaut qu'à 390 px) |

Les tests e2e ont été écrits juste après le composant. Ils ne pouvaient pas passer avant : la catégorie n'existait pas. Les tests de la recherche, eux, ont été vus rouges d'abord.

## Preuves
Version construite (`npm run build`, puis `npx vite preview --port 4180`), sur les vraies données. Le serveur a été arrêté à la fin. Script : `captures/T3a-captures.mjs`. Texte lu et focus relevés : `captures/T3a-captures.txt` (19:40-19:41).
Pour chaque état, deux captures à chaque largeur (bureau 1 440 × 900, téléphone 390 × 844) : la catégorie seule (`T3a-<état>-<largeur>.jpg`) et la page entière (`T3a-<état>-page-<largeur>.jpg`).
- `captures/T3a-sans-metier-*` : le champ vide et la phrase sur l'État (19:40).
- `captures/T3a-suggestions-*` : « dévelop » propose 5 métiers, le premier en surbrillance (19:40).
- `captures/T3a-un-sans-niveau-*` : M2X90 vient d'être choisi. Le relevé indique le focus sur « 10 % » (`button « 10 % »`), et la capture de bureau montre son anneau de focus. On voit l'avertissement « peu chiffré », la phrase « Coche un niveau… » et le lien du second métier (19:40).
- `captures/T3a-peu-chiffre-25-*` : `/?loyer=1200&metier=M2X90:25` ; « 25 % » cochée et l'avertissement toujours là. À 390 px, la page dit « 11 873 communes passent tes critères » (19:41).
- `captures/T3a-deux-*` : `/?loyer=1200&metier=V1X80:10,U1X82` ; infirmiers à « 10 % », graphistes sans niveau avec l'avertissement et « Coche un niveau… » ; pas de lien d'ajout (19:41).
- `captures/T3a-npm-test.txt` : la sortie complète de `npm test`.

**Comparaison aux captures `F-cat-*` du prototype F** :
- Conformes : ordre et styles ; « Retirer » à droite sur la ligne du libellé ; cases collées en 3 colonnes (« Partout où il recrute » sur deux lignes en bureau, comme dans F-cat-deux-1440x900) ; liste des suggestions sous le champ, la première en surbrillance ; phrase de l'État en bas.
- Écarts voulus :
  - la phrase « Chiffré dans peu de bassins… » est ajoutée (R50, ajoutée à /breakdown, non prototypée) ;
  - les suggestions sont celles du vrai fichier, et non les 12 métiers inventés du prototype : 5 pour « dévelop » au lieu de 2.

**Ce que la preuve ne couvre pas** :
- le toucher sur un vrai iPhone ;
- la montée de la feuille au focus du champ (tâche 4) ;
- l'action de « + Ajouter un second métier » (tâche 4) ;
- l'effet des cases sur la carte et la liste, prouvé en 3b. Il est vu ici seulement par le compte de la capture `peu-chiffre-25-page-390x844`.

## Suite de tests
`npm test`, lancé à 19:24 sur le code final (port 4173 libre, charge ≈ 2 au départ, ≈ 5 pendant). Sortie : `captures/T3a-npm-test.txt`.
- unit : `Test Files  22 passed (22)` · `Tests  361 passed (361)` (8 nouveaux)
- jetons : `check-tokens : 44 fichier(s), aucune valeur arbitraire`
- e2e : `Running 437 tests using 2 workers` · `39 skipped` · `398 passed (11.8m)`, aucun rouge. Les sautés passent de 38 à 39 : mon test « 390 px » est sauté en bureau.
- types : `npm run typecheck` → `tsc --noEmit -p .`, sans erreur
- build : `npm run build` → `✓ built in 1.85s`, lancé après la suite

## Décisions prises à la place de Vincent
- **Décision : les cases des niveaux sont branchées sur le réglage dès 3a.** Pourquoi : le « then » d'AC-14 lit l'adresse après la coche (le brief le prévoyait). Coût si c'est faux : aucun, 3b le prévoyait de toute façon.
- **Décision : après « Retirer » d'un métier quand un autre reste, le focus va sur le « Retirer » du métier restant.** C'est le premier élément qu'on peut atteindre dans sa ligne, ce que dit le plan (*décidé par Claude*, contestable à la démo). Coût si c'est faux : une ligne à changer, par exemple pour viser « 10 % » du restant ou le lien « + Ajouter un second métier ».
- **Décision : le clavier suit le prototype F, et non la recherche d'adresse des proches.** Celle-ci n'a en fait ni flèches ni Échap : on y passe d'une suggestion à l'autre avec Tab.
  - La première suggestion est en surbrillance dès qu'elle apparaît ; Entrée la choisit sans flèche ; les flèches s'arrêtent aux bords.
  - Échap vide le champ. Le champ porte le rôle « combobox » et désigne la suggestion active (`aria-activedescendant`).
  - Les suggestions sont des options d'une liste (`role=option`), et non des boutons dans la liste.
  - *Décidé par Claude.* Coût si c'est faux : une suggestion choisie par Entrée sans l'avoir voulue.
- **Décision : sous 2 caractères, les espaces ne comptent pas, et un texte tapé de plusieurs mots doit se suivre dans le libellé.** « aides soign » trouve « Aides-soignants » ; l'apostrophe courbe ’ compte comme l'apostrophe droite. *Décidé par Claude.* Coût : aucun.
- **Décision : ordre alphabétique « à la française »** (`localeCompare` en `fr`, « É » rangé avec « E »). Coût : aucun.
- **Décision : bureau, des suggestions qui tombent sous le compte collé en bas du panneau font défiler le panneau** pour mettre « Ton métier » en haut. Sans cela, la liste passait sous le compte, et les proches font de même. *Décidé par Claude.* Coût si c'est faux : un défilement du panneau à l'apparition des suggestions.
- **Décision : un métier de l'adresse ne s'affiche qu'une fois `emploi.json` chargé, puisque son libellé y est.** Pendant le chargement, le champ « Ton métier » est affiché désactivé. Coût : moins d'une seconde d'un champ vide au lieu du métier, à l'ouverture d'une adresse avec `metier`.
- **Décision : pas de focus automatique à l'ouverture d'une adresse avec des métiers.** Seul un choix amène le focus sur « 10 % ». Coût : aucun.
- **Décision : liste nommée « Suggestions de métiers »**, pour la distinguer des « Suggestions » d'adresse des proches. Coût : aucun.
- **Décision : le lien « + Ajouter un second métier » est un bouton sans action en 3a**, comme le veut le plan (tâche 4). Coût : un clic sans effet jusqu'à la tâche 4.

## Fichiers touchés hors de la liste de la tâche
- `src/App.tsx` : une ligne. Le panneau reçoit les métiers d'`emploi.json` (`metiers={donnees?.emploi.metiers ?? null}`). Sans eux, la catégorie ne connaît ni les libellés ni les noms courants.
- `docs/plans/2026-11-21-emploi/captures/T3a-*` : les preuves, leur script et la sortie de la suite.
- `docs/specs/2026-10-18-mairies/details.md` (dans la liste) : **non modifié**. H111 y porte déjà l'annotation « Révisée par emploi (H129, 2026-11-21) », écrite à /spec.
- `docs/journal.md` et `docs/specs/INDEX.md` étaient déjà modifiés avant la tâche. Je ne les ai pas touchés ni commités.

## Tests existants modifiés
- `tests/e2e/mairies.spec.ts`, test « AC-1 ouverture de / … », l. 78 : c'est le déplacement prévu par le plan (H111 révisée par emploi, H129). Ni valeur attendue ni given / when / then ne changent ; « Vie locale » suit toujours « Cadre de vie » (l. 77, inchangée). Aucun hook n'a demandé de confirmation.
  - avant : `expect(titres.indexOf('Tes proches')).toBe(titres.indexOf('Vie locale') + 1); // H111`
  - après : `expect(titres.indexOf('Tes proches')).toBe(titres.indexOf('Emploi') + 1); // H111, révisée par emploi (H129)`
- Les autres candidats du plan (`proches-mobile.spec.ts`, `telephone-feuille.spec.ts`, `proches-etats.spec.ts`) : **aucun changement nécessaire**, tous verts dans la suite complète.
- `src/domain/emploi.test.ts` (fichier de la tranche) : la ligne d'import gagne `chercherMetiers`, `Metier` et `resumeEmploi`, et deux blocs sont ajoutés à la fin. Aucun test existant n'est changé.
- `tests/e2e/emploi.spec.ts` (fichier de la tranche) : la ligne d'import gagne `servirFixture`, une autre ligne importe `mobile`, `voirCriteres` et `voirListe`, et les tests de 3a sont insérés avant le test « design F » de la tâche 2. Une ligne « // Tâche 2, suite. » est ajoutée devant ce test, qui ne change pas.

## Leçons écrites
Aucune : aucune correction n'a demandé plus d'un essai, et aucune mesure n'a contredit le plan.
