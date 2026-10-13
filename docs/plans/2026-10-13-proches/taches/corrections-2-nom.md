# Corrections 2 — nom affiché « Où vivre en France »
Statut : faite · Début 20:25 · Fin 20:37 · Commits : 7e38ca2..(ce rapport)

## Ce que l'utilisateur peut faire maintenant
Il voit « Où vivre en France » en titre du panneau (bureau) et de la feuille (téléphone), et dans l'onglet du navigateur. La page de démonstration des composants porte le même nom.

## Changements
- `src/ui/Settings.tsx:52` — titre du panneau (`h1`, style `marque`).
- `index.html:6` — `<title>` de l'onglet (vérifié aussi dans `dist/index.html` après construction).
- `src/demo/Demo.tsx:55` — page de démonstration.

Recherche « Carte où vivre » / « Carte ou vivre » (sans tenir compte des majuscules) dans `src/`, `index.html`, `public/` hors `public/data/` et `tests/` : aucune autre occurrence. Aucun test ne lisait le nom. Les clés de mémoire `carte-ou-vivre:proche:<n>` sont inchangées (les proches gardés restent : ils s'affichent sur les captures).

## Preuves
- `docs/plans/2026-10-13-proches/captures/nom-bureau-1440.png` — 1 440 × 900 : « Où vivre en France » sur une ligne en haut du panneau ; mesure dans la page : hauteur du titre 26 px = une ligne (hauteur de ligne 26 px), 266 px de large dans un panneau de 300 px ; titre de l'onglet = « Où vivre en France » (2026-10-13 20:26)
- `docs/plans/2026-10-13-proches/captures/nom-mobile-390.png` — 390 × 844 : titre sur une ligne en haut de la feuille ; mesure : 1 ligne, texte de 170 px pour 358 px disponibles (2026-10-13 20:26)

## Suite de tests
- Unitaires : `Test Files  10 passed (10)` · `Tests  82 passed (82)`
- Navigateur : `151 passed (4.8m)` · `2 skipped` (les mêmes qu'avant : limites propres à un navigateur)
- Types : `tsc --noEmit -p .` sans erreur
- Construction : `✓ built in 3.22s`

## Décisions prises à la place de Vincent
Aucune.

## Fichiers touchés hors de la liste de la tâche
Aucun.

## Leçons écrites
Aucune (changement fait du premier coup).
