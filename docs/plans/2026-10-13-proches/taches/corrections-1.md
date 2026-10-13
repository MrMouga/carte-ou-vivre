# Corrections 1 — relectures de la tranche proches (review-spec.md, qa.md)
Statut : faite · Début 19:08 · Fin 19:56 · Commits : de23b3f..(commit de ce rapport)

## Ce que l'utilisateur peut faire maintenant
- `npm test` est de nouveau un vrai feu vert : lancé tel quel, sans option, il passe 5 fois sur 5 (avant : 3 à 4 échecs à chaque passage).
- En bureau, chaque pastille se lit « Parents de Léa · 2 h au plus », avec le « · » de D10 et R15.
- En bureau, quand « Aucune adresse trouvée. » s'affiche (comme pour la panne de la recherche ou une adresse déjà là), le panneau défile : « Ajouter » reste entier au-dessus de la barre « N communes passent tes critères ».

## Constats, un par un

### 1. [Majeur] Test instable « H21 délai de 45 s » — corrigé · commit `de23b3f`
- **Cause** : l'horloge simulée continuait d'avancer en temps réel. Sous charge, plus d'1 s réelle passait entre l'ajout et la vérification « encore en calcul à 44 s ».
- **Correction du test** (`tests/e2e/proches-etats.spec.ts`, test hors AC). L'horloge est figée par `page.clock.pauseAt(...)` juste après l'ouverture : seul `runFor` fait avancer l'heure de la page. Les deux ajouts se font à horloge figée, en avançant de 300 ms pour la recherche (elle part 300 ms après la frappe). Chaque échéance est donc comptée exactement :
  - Nantesville est encore en calcul à 44 s et indisponible à 46 s ;
  - Toulouseville commence son calcul à 45 s, il est encore en calcul à 89 s et indisponible à 91 s.

  Les échéances et les vérifications sont les mêmes qu'avant, le test n'est pas affaibli.
- **Il attrape toujours un mauvais délai** : avec `DELAI_PROCHE_MS = 44_000` dans le code, il échoue (« Calcul des trajets » attendu à 44 s, « Trajets indisponibles » reçu) ; avec `46_000`, il échoue aussi (Toulouseville encore en calcul à 91 s). Remis à 45 000 ensuite (`git diff src` vide).
- **Choix : la limite dans la configuration Playwright** (`workers: 2` dans `playwright.config.ts`), plutôt qu'une ligne dans CLAUDE.md. Avec 5 tests en parallèle (le défaut sur ce Mac à 10 cœurs), H21 passait, mais 3 autres tests plus anciens échouaient, faute de carte prête en 5 s. Ce sont des tests de loyer-mer ou de la tâche 1 : `etats.spec.ts:26`, `categories.spec.ts:9` et `liste.spec.ts:37`, ces deux derniers à 390 px. Une ligne dans CLAUDE.md doit être lue et retenue par chaque agent et par toi. La configuration, elle, s'applique à `npm test` tel que CLAUDE.md le décrit déjà. Coût : la suite passe de 2 min 20 à environ 4 min 20.
- **Preuves** :
  - `H21 --repeat-each=5` (5 en parallèle) : 10 passages sur 10, bureau et 390 px.
  - `captures/corr1-h21-charge-5-workers.txt` : tout le fichier répété 5 fois avec 5 tests en parallèle, plus de charge que la configuration choisie. Les 2 échecs de H21 (et 36 des 37 autres échecs) sont tous à l'ouverture de la carte (`lib/carte.ts:47`, carte pas prête en 5 s), jamais à l'étape de l'horloge. C'est cette surcharge que `workers: 2` évite.
  - 5 passages de `npm test` tels quels, sur le code final : voir « Suite de tests ».
- Leçon mise à jour : `docs/solutions/2026-10-13-delai-long-horloge-playwright.md` (ligne « Revu le »).

### 2. [Mineur] « · » dans la pastille — corrigé · commit `02e3166`
- `src/ui/Pastilles.tsx` : le « · » est dessiné devant la valeur par CSS (`before:content-['·']`, 8 px d'écart de chaque côté, avec les jetons existants). Il est vu à l'écran et lu par les lecteurs d'écran (« Nantesville (44) ·2 h au plus »). Il ne fait pas partie du texte de la page. C'est voulu : AC-16 lit le nom suivi directement de la valeur (`/Nantesville \(44\)\s*2 h au plus/`), et un « · » écrit dans le texte l'aurait fait échouer. La ligne porte un « jetons-ok » : `content-['·']` est un caractère, pas une valeur visuelle.
- **Test de non-régression** : `tests/e2e/proches-carte.spec.ts` · « R15 pastille : un « · » sépare le nom de la valeur, à l'écran et pour les lecteurs d'écran ». Il est **rouge sur l'ancien code** (contenu `none` au lieu de `"·"`) et vert ensuite. Il passe en largeur bureau dans les deux projets, puisque les pastilles n'existent qu'en bureau, et n'est sauté dans aucun des deux.
- AC-16 reste vert, en bureau et à 390 px.
- **À savoir** : Figma 18:145 (« Pastille de temps ») **ne montre pas** de « · » (« Parents de Léa  4 h au plus »). J'ai suivi D10 et R15, comme le demandait le brief. Si tu préfères le design, il suffit de retirer une classe et de mettre R15 à jour.
- **Preuve** : `captures/corr-pastilles-point-et-lien-focus.png`, prise sur le vrai parcours (4 proches calculés par l'IGN, localhost:5173). On y lit « Parents de Léa · 2 h au plus », « Toulouse (31) · 2 h au plus »… (19:30)

### 3. [Mineur] « Ajouter » à moitié caché sous le compte — corrigé · commit `8cf1866`
- `src/ui/Proches.tsx` : en bureau, quand un message apparaît sous le champ (aucune adresse, panne de la recherche, doublon), le panneau fait défiler « Ajouter » au centre. C'est la même règle que pour les suggestions (leçon `2026-10-13-panneau-defilant-compte-colle.md`). Si le panneau n'a rien à faire défiler, rien ne bouge.
- **Test de non-régression** : `tests/e2e/proches-etats.spec.ts` · « aucune adresse en bureau, avec un proche : le panneau défile, « Ajouter » entier au-dessus du compte collé ». Il est **rouge sur l'ancien code** (le bas d'« Ajouter » passe sous le haut du compte), vert ensuite, dans les deux projets en largeur bureau.
- **Preuve, sur le vrai parcours** : `captures/corr3-aucune-adresse-bureau.png`, avec 4 proches et « 1 rue des Fantomes imaginaires zzzz ». Le bas d'« Ajouter » est à y = 702 et le haut du compte à y = 714 ; le champ et le message restent visibles (19:31). Cas voisin vérifié sans changement de code : avec « Lille » choisie, le champ « Nom » apparaît et « Ajouter », actif, reste visible (bas à 672, compte à 684).

### 4. [Mineur] « + Ajouter un proche » décalé de 4 px — non corrigé : la mesure ne montre pas de décalage
- Mesuré dans le vrai navigateur, à 1 440 × 900, avec 4 proches :
  - la boîte du lien commence à **x = 33**, comme le titre, le nom du site, les lignes de proches et le champ ;
  - son texte commence à x = 37, à cause du rembourrage de 4 px du style « lien ». « Retirer » et « Effacer mes proches » ont le même rembourrage ;
  - **dans Figma (F-classee), le texte de « + Ajouter un proche » est aussi à x ≈ 37**.
- Le « bord à x = 29 » du relecteur est le **contour de focus** : 2 px d'épaisseur et 2 px d'écart (`--trait-focus`, `--ecart-focus`), dessiné hors de la boîte comme pour tout élément qui a le focus. Après « Ajouter », le focus passe sur ce lien (choix d'accessibilité des tâches précédentes), d'où le cadre visible sur sa capture `05-pret-bureau.png`. La capture `captures/corr-pastilles-point-et-lien-focus.png` montre ce cadre.
- Décider à ta place l'aurait éloigné de Figma : avec un `-ml-1`, le texte serait aligné, mais le contour dépasserait de 8 px. Le code ne change donc pas (voir Décisions).
- Remarque du relecteur, non traitée car hors de la liste : « Retirer » n'a « aucun aspect de bouton ». C'est le style « lien » de Figma.

### 5. [À enquêter] Curseurs Loyer et Mer qui changent seuls — cause probable : l'outil de test, pas un défaut ; code inchangé
- **Le code** : loyer et mer ne s'écrivent qu'à deux endroits. Les curseurs eux-mêmes (`Settings.tsx`, à la souris ou au clavier) et l'adresse de la page, lue une seule fois à l'ouverture (`App.tsx:50`). Aucun effet ne les remet à zéro (recherche de `setReglages`, `keydown` et `popstate` dans `src/`).
- **Reproduit (1 200 → 1 150 €), en 7 actions** : un clic sur la poignée du loyer (ce que fait l'outil quand une référence périmée tombe sur le curseur) laisse le focus sur le curseur. Il n'y a pas de contour, car `:focus-visible` est faux après un clic. Ensuite, « flèche bas » (le relecteur essayait les flèches dans les suggestions) fait passer l'adresse de la page à `?loyer=1150&mer=60`. Un curseur natif du navigateur fait la même chose. Valeur remise ensuite à 1 200.
- Un simple clic sur la poignée, sans touche, ne change rien (essayé sur Loyer et sur Mer).
- **Non reproduit : 60 → 150 km.** 150 km correspond à un clic à environ 72 % de la course du curseur Mer, ce qui va avec un clic d'outil tombé sur la piste. Le premier signalement (tâche 2b, 15:36) va dans le même sens. L'adresse de la page y est passée par `loyer=350`, puis `1000&mer=105`, puis `1400&mer=65` : une suite continue, comme un curseur glissé à la souris dans la fenêtre visible du navigateur de test.
- Leçon : `docs/solutions/2026-10-13-constat-navigateur-mesurer-avant-corriger.md`.

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-16 (non modifié) | `tests/e2e/proches-carte.spec.ts` · « AC-16 pastille de Nantesville (44)… » | vert, bureau et 390 px |
| hors AC, H21 | `tests/e2e/proches-etats.spec.ts` · « H21 délai de 45 s compté depuis le début de chaque calcul (horloge simulée)… » | vert 10/10 en parallèle ; rouge avec un délai de 44 s ou de 46 s dans le code |
| hors AC, R15 | `tests/e2e/proches-carte.spec.ts` · « R15 pastille : un « · » sépare le nom de la valeur… » | rouge avant, vert après |
| hors AC, qa.md | `tests/e2e/proches-etats.spec.ts` · « aucune adresse en bureau, avec un proche : le panneau défile, « Ajouter » entier au-dessus du compte collé » | rouge avant, vert après |

Aucun `given / when / then` modifié, aucun test sauté ni retiré, `acceptance.json`, `progress.md` et `plan.md` non touchés.

## Preuves
- `docs/plans/2026-10-13-proches/captures/corr1-h21-charge-5-workers.txt` — tout le fichier des états répété 5 fois avec 5 tests en parallèle : aucun échec de H21 à l'étape de l'horloge, tous à l'ouverture de la carte (19:19)
- `docs/plans/2026-10-13-proches/captures/corr-pastilles-point-et-lien-focus.png` — vrai parcours, 4 proches : pastilles avec « · », contour de focus de « + Ajouter un proche » (19:30)
- `docs/plans/2026-10-13-proches/captures/corr3-aucune-adresse-bureau.png` — vrai parcours : « Aucune adresse trouvée. », « Ajouter » entier au-dessus du compte (19:31)
- `docs/plans/2026-10-13-proches/captures/corr-npm-test-5-passages.txt` — résumé des 5 passages de `npm test` sur le code final

## Suite de tests
`npm test` lancé tel quel, 5 fois de suite sur le code final, de 19:33 à 19:54. Chaque fois, sortie EXIT 0 :
```
 Test Files  10 passed (10)
      Tests  82 passed (82)
check-tokens : 35 fichier(s), aucune valeur arbitraire
  2 skipped
  151 passed (3.9m à 4.3m)
```
H21 est vert dans les 5 passages, en bureau et à 390 px (détail : `captures/corr-npm-test-5-passages.txt`). Les 2 tests sautés existaient avant ce lot (`review-spec.md` en comptait déjà 2). `npx playwright test --workers=2` est désormais la même commande que `npm test`, puisque la configuration fixe 2 tests à la fois. Elle a aussi été lancée seule, avant que la limite soit écrite : 147 passés, 2 sautés, en 4 min.
```
> tsc --noEmit -p .            (npm run typecheck : EXIT 0, aucune erreur)
✓ built in 2.52s               (npm run build)
check-tokens : 35 fichier(s), aucune valeur arbitraire   (npm run check-tokens)
```

## Décisions prises à la place de Vincent
- Décision : limite de 2 tests à la fois dans `playwright.config.ts`, plutôt qu'une ligne dans CLAUDE.md. Pourquoi : `npm test` reste la commande de référence, et rien n'est à retenir. Coût si c'est faux : la suite est 2 min plus lente ; il suffit d'une ligne à changer pour revenir en arrière ou passer à 3.
- Décision : le « · » de la pastille est dessiné en CSS, pas écrit dans le texte. Pourquoi : AC-16, intouchable, lit le nom suivi directement de la valeur. Coût si c'est faux : un copier-coller de la pastille ne contient pas le « · ».
- Décision : D10 et R15 suivis plutôt que Figma 18:145, qui n'a pas de « · ». Pourquoi : c'était la consigne du brief. Coût si c'est faux : une classe à retirer et R15 à mettre à jour.
- Décision : constat 4 laissé tel quel. Pourquoi : la boîte est alignée sur la colonne, et le texte est au même retrait que dans Figma ; l'écart vu est le contour de focus. Coût si c'est faux : un `-ml-1` sur le lien.

## Fichiers touchés hors de la liste de la tâche
- `playwright.config.ts` — la limite de 2 tests à la fois (constat 1).
- `docs/solutions/2026-10-13-delai-long-horloge-playwright.md` (ligne « Revu le »), `docs/solutions/2026-10-13-constat-navigateur-mesurer-avant-corriger.md` (nouvelle), `docs/solutions/README.md` (index régénéré par le crochet).

## Leçons écrites
- `docs/solutions/2026-10-13-delai-long-horloge-playwright.md` — revue : correction par `pauseAt`, et `workers: 2`.
- `docs/solutions/2026-10-13-constat-navigateur-mesurer-avant-corriger.md` — nouvelle : mesurer un constat avant de le corriger (contour de focus, curseur resté focalisé).

## Ce qui reste
Rien dans ce lot. Reportés par Vincent et non touchés : le champ caché sous le clavier de l'iPhone, et les flèches du clavier dans les suggestions.
