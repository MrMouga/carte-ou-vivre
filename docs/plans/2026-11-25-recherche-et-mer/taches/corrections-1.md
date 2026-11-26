# Corrections 1 — au téléphone, la liste des suggestions remplit la feuille
Statut : faite · Début 10:31 · Fin 10:54 · Commits : un commit « fix(recherche-et-mer): corrections 1 … » après e6fc1d0

## Ce que l'utilisateur peut faire maintenant
Au téléphone, en tapant un code postal partagé par beaucoup de communes (« 01300 », 22 communes), la liste des suggestions descend jusqu'en bas de la feuille : 15 communes se voient d'un coup à 390 × 844 au lieu de 6, et la liste défile pour les autres. Quand le clavier de l'iPhone est ouvert, la liste s'arrête juste au-dessus de lui : on peut la faire défiler jusqu'à la dernière commune sans fermer le clavier (avant, le bas de la liste passait sous le clavier et les dernières suggestions étaient inatteignables). Le champ ne bouge pas. En bureau, rien ne change : la liste garde 280 px au plus et défile.

## Constat → correction
- **Constat** (Majeur, `review-spec.md`, confirmé par `qa-2.md`, captures `captures/qa/qa2-390-saisie-01300.png` et `captures/T2-390-01300.png`) : à 390 × 844, la liste gardait `max-h-liste-suggestions` (280 px) ; pour « 01300 », 6 suggestions sur 22, la moitié basse de la feuille montée vide.
- **Correction 1 — la hauteur** (`src/ui/Recherche.tsx`) : `max-h-liste-suggestions` devient `bureau:max-h-liste-suggestions`. Au téléphone, la liste n'a plus de hauteur maximale : elle est dans une colonne flexible qui prend toute la feuille sous le champ, et `min-h-0` la laisse rétrécir à la place restante, où elle défile. Aucun nouveau jeton, aucune valeur inventée.
- **Correction 2 — le clavier** (`src/ui/FeuilleMobile.tsx`) : en mesurant, la liste de 280 px passait déjà sous le clavier de l'iPhone (bas à y = 388 pour un clavier à y = 342 dans la fenêtre de Safari, 390 × 664) ; une liste qui remplit la feuille l'aurait aggravé. Safari ne réduit pas la page quand le clavier s'ouvre, seulement sa partie visible (`window.visualViewport`). Pendant la recherche, la feuille mesure de combien sa partie basse est cachée (bas du contenu de la feuille moins bas de la partie visible) et met cette hauteur en marge sous la recherche : la liste s'arrête au-dessus du clavier. Le haut de la feuille et le champ ne bougent pas (la règle de la leçon iPhone « champ à sa place avant le focus, puis immobile » tient). Remesuré à chaque changement de la partie visible (`resize`, `scroll`) ; clavier fermé, la marge revient à 0.
- Contrat mis à jour : `docs/design/system/README.md` (Suggestion de commune : 280 px au plus en bureau ; au téléphone, le reste de la feuille jusqu'au clavier) et le commentaire du jeton dans `src/theme/tokens.ts` (valeur inchangée, 280).

## Critères
Aucun critère (AC) touché ; tests de non-régression ajoutés, sans id d'AC, dans `tests/e2e/recherche.spec.ts` (section « Corrections 1 »). Jeu : les 6 communes de la fixture plus 22 communes d'un même code postal 01300 (noms réels du 01300, codes inventés 99101 à 99122). Chaque test fixe sa fenêtre, donc passe à l'identique dans les projets « bureau » et « mobile » (sans `test.skip`).

| Test (fichier · nom) | Avant la correction | Après |
|---|---|---|
| recherche.spec.ts · « 390 px : 01300 montre plus de 6 suggestions et la liste remplit la feuille » | échoue (6 suggestions entières, attendu plus de 6) | passe |
| recherche.spec.ts · « 390 × 664, clavier de l'iPhone ouvert (y = 342) : la liste des 01300 s'arrête au-dessus du clavier, défile jusqu'à la dernière, le champ ne bouge pas » | échoue (bas de la liste à 388, attendu ≤ 342) | passe |
| recherche.spec.ts · « bureau : 01300, la liste des suggestions garde 280 px au plus et défile » | passe (garde-fou du bureau) | passe |

Le clavier est simulé dans le test comme Safari le fait : la partie visible de la page (`visualViewport`) est remplacée par un objet dont la hauteur passe à 342 px, sans changer la taille de la page.

## Preuves
Version construite (`npm run build`, `npx vite preview --port 4180`), vraies données de `public/data`, Playwright + `chromium.launch({ channel: 'chromium', args: ['--use-angle=swiftshader', …] })`, script `scripts/capture-c1.mjs` (2026-11-26 10:40-10:41) :
- `docs/plans/2026-11-25-recherche-et-mer/captures/C1-390-01300.png` — 390 × 844, « 01300 » : 22 suggestions, liste de y = 108 à 836 (728 px), 15 suggestions entières à l'écran, champ à y = 60.
- `docs/plans/2026-11-25-recherche-et-mer/captures/C1-390x664-clavier-01300.png` — 390 × 664, clavier simulé à y = 342 : liste de y = 108 à 334, 4 suggestions entières, le reste au défilement ; champ à y = 60 (le blanc sous la liste est la place du clavier, qui n'est pas dessiné).
- `docs/plans/2026-11-25-recherche-et-mer/captures/C1-bureau-01300.png` — 1 280 × 800 (moitié gauche, la capture entière dépassait 600 Ko) : liste de 280 px (y = 68 à 348), 6 suggestions entières, comme avant.
Ce que la preuve ne couvre pas : le vrai clavier de l'iPhone (simulé ici par la partie visible de la page) ; à vérifier sur l'iPhone de Vincent à la démo.

## Suite de tests
`npm test` (10:40 → 10:53, après toutes les modifications du code) :
- Vitest : `Test Files  27 passed (27)` · `Tests  456 passed (456)`
- Playwright : `514 passed (13.5m)` · `53 skipped` (départ : 508 et 53 ; + 6 = les 3 tests ajoutés × 2 projets)
- Types : `npm run typecheck` — aucune erreur
- Jetons : `npm run check-tokens` — « 49 fichier(s), aucune valeur arbitraire »
- Construction : `npm run build` — réussie (`dist/version.txt` = e6fc1d0, le commit de départ ; la correction n'était pas encore commitée)

## Décisions prises à la place de Vincent
- Décision : avec peu de suggestions (« grand » : 1), la liste garde la hauteur de son contenu au téléphone, elle ne s'étire pas jusqu'en bas en cadre vide — « la liste occupe la hauteur disponible » lu comme « au plus la hauteur disponible » — décidé par Claude — coût si c'est faux : une classe à ajouter (`max-bureau:flex-1`).
- Décision : la liste s'arrête au-dessus du clavier (et non en bas de la feuille, sous le clavier), par une marge mesurée sur la partie visible de la page — la consigne demandait que la liste ne passe pas sous le clavier, et sans cela les dernières suggestions sont inatteignables clavier ouvert — décidé par Claude — coût si c'est faux : retirer l'effet de `FeuilleMobile.tsx` ; s'il se comporte mal sur un vrai iPhone (marge en trop ou en moins), la liste redevient seulement trop courte ou passe sous le clavier, le champ ne bouge pas.
- Décision : la marge du clavier ne s'applique qu'à la recherche, pas à l'ajout d'un proche (même feuille montée) — hors du constat — coût si c'est faux : la même marge à poser sur l'ajout.

## Fichiers touchés hors de la liste de la tâche
- `src/ui/FeuilleMobile.tsx` — la marge au-dessus du clavier (la feuille seule connaît sa place et la partie visible de la page).
- `src/theme/tokens.ts` — commentaire du jeton `taille-liste-suggestions` (valeur inchangée).
- `docs/design/system/README.md` — contrat de « Suggestion de commune ».
- `scripts/capture-c1.mjs` — script des trois captures, pour les refaire.

## Tests existants modifiés
- aucun (trois tests ajoutés à la fin de `tests/e2e/recherche.spec.ts`, rien d'autre changé dans le fichier).

## Leçons écrites
Aucune (correction réussie du premier coup). Constat noté ici : la liste de 280 px passait déjà sous le clavier de l'iPhone avant cette correction (y = 388 > 342).
