# Correctif — clavier de l'iPhone sur « Adresse ou ville »
Statut : faite (sauf l'essai sur l'iPhone de Vincent, préparé plus bas) · Début 18:16 · Fin 18:41 · Commits : 11c6bc5..(commit de ce rapport)

## Ce que l'utilisateur peut faire maintenant
Sur iPhone, quand on touche « Adresse ou ville », le champ devrait rester visible : la feuille monte, le champ est sous la poignée, et les suggestions de l'IGN sont entre le champ et le clavier (Figma 27:1160). C'est ce que montre la simulation ; seul l'essai sur l'iPhone le confirmera.

Safari ne devrait plus proposer « AutoFill Contact » (la fiche contact de Vincent) sur ce champ ni sur « Nom ». Seules les suggestions de l'IGN devraient apparaître. C'est une technique répandue mais pas documentée par Apple : là aussi, l'essai sur l'iPhone dira si elle marche.

## La cause
Ce qui se passait, dans l'ordre :
1. On touche le champ. La feuille monte d'un coup : son haut passe de y = 292 à y = 40. Elle ne défile pas encore, donc le champ se retrouve à **y = 352 → 396**. C'est mesuré sur le vrai flux, à la fin de l'événement « focus », dans une fenêtre de la taille de Safari (390 × 664).
2. Safari relève la place du champ à ce moment-là. Comme le clavier commence à y ≈ 342, le champ est dessous, et Safari fait glisser la partie visible de la page vers le bas pour le montrer.
3. Une image plus tard (`requestAnimationFrame`, choix de la tâche 5), notre code fait défiler la feuille et place le champ à y = 80. Mais Safari a déjà glissé : le champ passe au-dessus de la partie visible, et on ne voit plus que la liste. C'est la capture de Vincent.

Les deux mouvements, celui de Safari et le nôtre, s'additionnent. C'était la 1ʳᵉ hypothèse du brief.

La 3ᵉ hypothèse est écartée par le code : pendant l'ajout, la hauteur de la feuille ne dépend pas de `dvh`. Elle va de 40 px au bas de la fenêtre, et sur iPhone l'ouverture du clavier ne change pas cette fenêtre.

**Correction** : le défilement se fait maintenant dans le rendu même qui monte la feuille (`useLayoutEffect`), avant la fin de l'événement « focus ». Quand Safari relève la place du champ, celui-ci est déjà à **y = 80 → 124**, au-dessus du clavier : Safari n'a rien à faire glisser, et ensuite le champ ne bouge plus.

Ouvert par « + Ajouter un proche », l'ordre est inversé par rapport à avant : la feuille monte et se place d'abord, le champ prend le focus ensuite. Avant, au focus, le champ était encore à y = 620 → 664, hors de l'écran.

## Critères
Aucun critère d'acceptation (AC) ne porte sur ce défaut. Tests ajoutés dans `tests/e2e/proches-clavier-iphone.spec.ts`. Ils simulent la fenêtre de Safari sur l'iPhone de Vincent : 390 × 664, écran tactile, clavier à partir de y = 342 (relevé sur sa capture). Ils passent aussi dans le projet « bureau », avec la même fenêtre.

| Exigence | Test (fichier · nom) | Résultat |
|---|---|---|
| Toucher le champ (0 proche) : à la fin de l'événement focus, champ sous la poignée et au-dessus de y = 342, puis immobile | `proches-clavier-iphone.spec.ts` · « iPhone : toucher « Adresse ou ville » (0 proche) — au focus, le champ est déjà sous la poignée, au-dessus du clavier, et ne bouge plus » | **rouge avant** (bas du champ à 395,75 > 342), vert après |
| Même chose ouvert par « + Ajouter un proche » (1 proche) | idem · « iPhone : toucher « + Ajouter un proche » (1 proche) — … » | **rouge avant** (664,3 > 342), vert après |
| Pas de « AutoFill Contact » : `autocomplete="off"`, et « search » dans `name` et `id` des deux champs | idem · « iPhone : les champs de l'ajout ne ressemblent pas à un formulaire d'adresse pour Safari (pas de « AutoFill Contact ») » | **rouge avant** (`name` absent), vert après |

Le troisième test vérifie seulement que le moyen choisi est en place, pas la réaction de Safari : aucun navigateur de test ne reproduit ses suggestions de contact.

## Preuves
Vrai flux : serveur de développement (`npm run dev`, le même que `npx vite --host`), vraies données, vrai IGN avec une adresse publique (« 12 rue de la Paix, Nantes »), Chromium dans une fenêtre de 390 × 664 avec écran tactile. Script jetable non versionné : `probe/proches/fix-clavier/preuve.mjs`.

Comme Vincent, on fait défiler la feuille jusqu'à voir le champ en bas de l'écran, puis on le touche.
- `captures/fix-clavier-preuve-avant.txt` — le code d'avant, mesuré à 18:23 en retirant le correctif le temps de la mesure :
  - au focus, le champ est à **y 352 → 396** (sous le clavier) ;
  - 500 ms plus tard, il est à y 80 → 124 : **il a bougé** ;
  - par « + Ajouter un proche » : y 620 → 664 au focus, puis y 79 → 123.
- `captures/fix-clavier-preuve.txt` — après le correctif, à 18:22 :
  - au focus, le champ est à **y 80 → 124**, et toujours à 80 → 124 500 ms plus tard ;
  - la feuille va de 40 au bas de la fenêtre ;
  - la première suggestion « 12 Rue de la Paix, 44000 Nantes » est à y 133 → 177 ;
  - par « + Ajouter un proche » : champ à y 79 → 123 au focus, immobile ensuite ;
  - attributs du champ : `{"id":"search-lieu_r_7_","name":"search-lieu","autocomplete":"off"}` ; de « Nom » : `{"id":"search-nom_r_8_","name":"search-nom","autocomplete":"off"}`.
- `captures/fix-clavier-champ-0-avant.png` — la feuille avant le toucher, le champ en bas de l'écran (18:22).
- `captures/fix-clavier-champ-1-suggestions.png` — après le toucher et la frappe : feuille montée, champ sous la poignée, 4 suggestions.
- `captures/fix-clavier-champ-2-au-dessus-du-clavier.png` — **les 342 px du haut seulement**, soit ce qui reste visible au-dessus du clavier de l'iPhone si Safari ne glisse pas. On y voit le champ, les 4 suggestions et le haut de « Ajouter ».
- `captures/fix-clavier-lien-0-avant.png`, `-lien-1-suggestions.png`, `-lien-2-au-dessus-du-clavier.png` — le même parcours par « + Ajouter un proche », après l'ajout d'un proche.
- `captures/fix-clavier-npm-test.txt` — les quatre passages de la suite de tests.

**Ce que la preuve ne couvre pas** :
- le vrai clavier et le glissement de Safari : la preuve montre seulement que le champ est déjà au-dessus de la ligne du clavier au moment où Safari regarde, et qu'il ne bouge plus ensuite. Que Safari relève la place du champ à cet instant, c'est un raisonnement sur le fonctionnement de WebKit, pas une mesure. Le WebKit de Playwright n'est pas installé, je ne l'ai pas installé, et il n'aurait de toute façon ni clavier ni glissement ;
- « AutoFill Contact » : rien ne le simule ;
- Android.

## Essai sur l'iPhone de Vincent (à faire avec l'orchestrateur)
1. Sur le Mac : `cd ~/git-repository/carte-ou-vivre` puis `npx vite --host`. Ouvrir l'adresse « Network » (http://192.168.1.26:5173/ à 18:05) dans Safari sur l'iPhone. **Recharger la page** : l'ancienne version peut être restée en mémoire.
2. Faire défiler la feuille jusqu'à « Tes proches », puis toucher « Adresse ou ville ». À regarder :
   - **le champ reste visible** : il est juste sous la poignée, en haut de la feuille, avec une bande de carte de 40 px au-dessus ;
   - le clavier s'ouvre en dessous ;
   - on ne voit pas la liste « 17 444 communes… » à la place ;
   - **la barre au-dessus du clavier ne propose plus « AutoFill Contact »**. Les flèches ⌃ ⌄ et « OK » peuvent rester : c'est la barre normale de Safari.
3. Taper « 12 rue de la Paix, Nantes ».
   - Attendu : les suggestions de l'IGN apparaissent entre le champ et le clavier, au moins la première en entier.
   - **Capture d'écran à ce moment-là.**
4. Toucher la suggestion de Nantes. « Nom » apparaît, prérempli.
   - Attendu : pas de « AutoFill Contact » au-dessus du clavier, et « Ajouter » visible.
5. Écrire « Parents de Léa », toucher « Ajouter ». La feuille redescend sur « Tes proches ».
6. Toucher « + Ajouter un proche ».
   - Attendu : le champ apparaît sous la poignée.
   - **Noter si le clavier s'ouvre tout seul** ou s'il faut retoucher le champ. Dans les deux cas, le champ doit rester visible.
7. Rapporter : les captures des étapes 3 et 6, la présence ou non de « AutoFill Contact » (étapes 2 et 4), et ce que fait le clavier à l'étape 6.
8. Pour finir : « Effacer mes proches ».

**Si le champ est encore caché**, une deuxième cause s'ajoute : Safari glisse quand même. Correction suivante, prête : pendant l'ajout, écouter le `visualViewport` et ramener la page en haut (`window.scrollTo(0, 0)`) quand Safari l'a fait glisser. Je ne l'ai pas ajoutée maintenant : on ne corrige qu'une hypothèse à la fois.

**Si « AutoFill Contact » reste**, Safari lit aussi le libellé visible « Adresse ou ville ». Il faudra choisir avec Vincent (voir plus bas).

## Suite de tests
Dernier passage, `npm test`, 18:34–18:37, sur le code du commit 11c6bc5 (avant la seule retouche d'un commentaire du test) :
```
 Test Files  10 passed (10)
      Tests  82 passed (82)
check-tokens : 35 fichier(s), aucune valeur arbitraire
  ✘   49 [bureau] › tests/e2e/proches-etats.spec.ts:128:1 › H21 délai de 45 s compté depuis le début de chaque calcul (horloge simulée) : …
  1 failed
  2 skipped
  145 passed (2.4m)
```
- Le seul échec est **le test instable connu « H21 délai de 45 s »**, déjà signalé dans T5. Je ne l'ai pas touché.
- `npx playwright test --workers=2`, 18:30–18:34 : **`147 passed`**, 2 skipped. Ce sont les 141 d'avant plus les 6 nouveaux (3 tests × 2 projets).
- Deux passages plus tôt (18:24 et 18:27) ont eu 7 puis 5 échecs. À chaque fois, c'était « carte prête » non atteinte en 5 s, sur des tests sans lien avec l'ajout (carte, adresse, fiche, catégories) et jamais les mêmes. La machine était chargée (charge moyenne de 16 à 27 : Arc, Figma). Relancés à part, ces fichiers passent.
- Après la retouche du commentaire : `proches-clavier-iphone.spec.ts`, `6 passed`.
- `npm run typecheck` : sortie 0, aucune erreur.
- `npm run build` : `✓ built in 3.12s`.

## Décisions prises à la place de Vincent
- Décision : « search » dans `name` et `id` des champs « Adresse ou ville » et « Nom » (`search-lieu`, `search-nom`), en gardant `autocomplete="off"`.
  - Pourquoi : Apple ne documente pas ses règles. L'usage répandu chez les développeurs dit que Safari ne propose pas la fiche contact sur un champ qu'il prend pour une recherche. Les autres pistes ont un coût :
    - `type="search"` change l'apparence du champ (une croix d'effacement apparaît) ;
    - une valeur inventée pour `autocomplete` n'est pas fiable ;
    - changer le libellé visible touche à la spec.
  - « Nom » est traité aussi : Safari pourrait y proposer le nom de la fiche contact.
  - Coût si c'est faux : « AutoFill Contact » reste. On passe alors à la question ci-dessous. Retirer ces attributs se fait en deux lignes.
- Décision : ouvert par « + Ajouter un proche », le champ prend le focus **après** que la feuille est montée, et non plus avant.
  - Pourquoi : même cause. Avant, au moment du focus, le champ était hors de l'écran (y = 620 → 664).
  - Coût : aucun en bureau, le focus va toujours au champ (tests existants verts).
- Décision : la capture de Vincent `captures/T5-iphone-vincent-bug-clavier.png` **n'est pas dans mes commits**.
  - Pourquoi : on y lit son adresse personnelle (« home, Paris 75006 France »), et le dépôt part sur GitHub. Elle reste dans le dossier, non suivie par git.
  - Coût : à Vincent de dire s'il veut la verser, recadrée ou non.

## Fichiers touchés hors de la liste de la tâche
Pas de liste dans un brief de correctif. Fichiers touchés :
- `src/ui/Proches.tsx` — le correctif ;
- `src/App.tsx` — passe à « Tes proches » l'information que la feuille est montée (une ligne) ;
- `tests/e2e/proches-clavier-iphone.spec.ts` — les nouveaux tests ;
- `docs/solutions/…` — la leçon et l'index.

## Leçons écrites
- `docs/solutions/2026-10-13-ios-clavier-champ-deplace-apres-focus.md` (nouvelle), copiée dans `~/.claude/studio/solutions/` (index régénéré). Elle dit : sur iPhone, le champ doit être à sa place finale à la fin de l'événement « focus », sans `requestAnimationFrame` entre le focus et sa mise en place.
- `docs/solutions/2026-10-13-feuille-qui-monte-au-focus.md` : ligne « Revu le 2026-10-13 ». Ce que cette leçon conseillait (défiler une image plus tard) causait le défaut.
- Index `docs/solutions/README.md` régénéré.

## Question pour Vincent (seulement si « AutoFill Contact » reste après l'essai)
Safari lit sans doute aussi le libellé visible « Adresse ou ville », qui est dans la spec. Options :
1. Garder le libellé et accepter la proposition de Safari. Coût : aucun code, mais Safari continue d'inviter à remplir ta fiche contact.
2. Changer le libellé visible pour un texte qui ne ressemble pas à un formulaire d'adresse, par exemple « Chercher un lieu ». Coût : la spec et Figma changent, et la consigne est moins claire.
3. Garder le texte, mais couper les mots pour Safari avec un caractère invisible. Coût : une astuce fragile ; les lecteurs d'écran peuvent mal lire le libellé.

Recommandation : 2, seulement si l'essai montre que c'est nécessaire.
