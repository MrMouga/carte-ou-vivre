# Retraits D12 — 4 temps jugés faux deviennent « pas de chiffre »
Statut : faite · Début 00:37 · Fin 00:40 (2026-11-25) · Commits : celui qui porte ce rapport, « data(services): 4 temps jugés faux retirés (D12) — Tende, Roscanvel » (parent 428a9c3)

## Ce que l'utilisateur peut faire maintenant
Sur la fiche de Tende, « Commerce alimentaire » et « Collège » disent « pas de chiffre » au lieu de « plus d'une heure » ; sur celle de Roscanvel, « Crèche » et « Collège » aussi. Un filtre sur ces services ne les écarte plus pour un temps faux (la page traite « pas de chiffre » comme pour toute commune sans temps). Rien d'autre ne change dans le fichier des temps.

## Codes INSEE vérifiés
Lus dans `public/data/communes.json` par la sonde (jointure par code) : `06163` = Tende (06), `29238` = Roscanvel (29). Les deux codes du brief sont les bons.

## Les 4 lignes ajoutées à `scripts/data/services-retraits.csv`
```
06163,commerce,"Site « plus d'une heure », itinéraire IGN depuis la mairie 11,2 min vers une épicerie de La Brigue ; tableau credibilite-services.md (tâche 0c), jugé faux par Vincent le 2026-11-24 (D12)."
06163,college,"Site « plus d'une heure », itinéraire IGN depuis la mairie 8,3 min vers le collège de Tende ; tableau credibilite-services.md (tâche 0c), jugé faux par Vincent le 2026-11-24 (D12)."
29238,creche,"Site « plus d'une heure », itinéraire IGN depuis la mairie 17,0 min vers une crèche de Crozon ; tableau credibilite-services.md (tâche 0c), jugé faux par Vincent le 2026-11-24 (D12)."
29238,college,"Site « plus d'une heure », itinéraire IGN depuis la mairie 15,3 min vers le collège de Crozon ; tableau credibilite-services.md (tâche 0c), jugé faux par Vincent le 2026-11-24 (D12)."
```
Valeurs relues dans `credibilite-services.md` (lignes Tende et Roscanvel), égales à celles du brief.

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-13 | `scripts/data/services.py` · contrôles « AC-13 » (Auch, Bordeaux, Mende, Les Sables-d'Olonne, L'Île-d'Yeu, 6 communes de population 0) | ok (Tende et Roscanvel n'y sont pas) |
| D12 | `scripts/data/services.py` · lecture de `services-retraits.csv` (commune de la carte, service connu, preuve écrite) | ok, 4 retraits lus |
| — | `npm run test:unit` | 397 tests verts |

## Sortie des contrôles (`python3 -I scripts/data/services.py`, 2026-11-25 00:38)
30 contrôles « ok », aucun « ÉCHEC », code de sortie 0. Sortie complète : `docs/plans/2026-11-24-services/captures/retraits-D12-sortie-services.txt`. Lignes qui changent par rapport à la tâche 0b :
```
  retraits (D12, services-retraits.csv) : 4 [('06163', 'commerce'), ('06163', 'college'), ('29238', 'creche'), ('29238', 'college')]
  ok   chaque temps relu égal au temps calculé (61 = « 61 ou plus »)
  ok   34738 communes avec au moins un temps (attendu 34738) ; …
  ok   poids : 625730 octets bruts, 304114 octets en gzip -9 (limite 350000, H162)
```
Comptes (information), seules colonnes qui bougent, « nouveau / ancien » :
```
  commerce   | >60 : 0 / 1 | sans : 11 / 10
  creche     | >60 : 0 / 1 | sans : 18 / 17
  college    | >60 : 1 / 3 | sans : 18 / 16
```
À noter : Tende était la **seule** commune à « plus d'une heure » pour le commerce alimentaire, et Roscanvel la seule pour la crèche ; il ne reste qu'une commune à « plus d'une heure » pour le collège. Tous les autres seuils sont inchangés.

## Comparaison avant / après (par `lireServices` de `src/domain/services.ts`)
Fichier d'avant : `public/data/services.json` du commit 428a9c3 ; d'après : celui produit ci-dessus. Sonde : `docs/plans/2026-11-24-services/captures/retraits-D12-comparaison.mjs` (lancée par `node --experimental-strip-types …`), sortie `captures/retraits-D12-comparaison.txt` :
```
communes.json : 06163 = Tende (06)
communes.json : 29238 = Roscanvel (29)
codes : 34746 avant, 34746 après, même ordre : true
îles sans pont identiques : true
valeurs comparées : 347460 ; différences : 4
  06163 Tende (06) · commerce : 61 → pas de chiffre
  06163 Tende (06) · college : 61 → pas de chiffre
  29238 Roscanvel (29) · creche : 61 → pas de chiffre
  29238 Roscanvel (29) · college : 61 → pas de chiffre
```
Avant la modification, la même sonde (fichier d'avant contre lui-même) donnait 0 différence.

## Preuves
- `docs/plans/2026-11-24-services/captures/retraits-D12-sortie-services.txt` — sortie complète des contrôles (2026-11-25 00:38)
- `docs/plans/2026-11-24-services/captures/retraits-D12-comparaison.txt` — 347 460 valeurs comparées, 4 différences (2026-11-25 00:38)
- `public/data/services.json` — sha256 `33764770f811c1bce33b8c6ddb27be6d10d62fefd753d8cdfb8d030a4dca2526` (avant : `b89a46e4…`), 625 730 octets bruts (inchangé : un caractère remplace un autre), 304 114 octets en gzip -9 (script) / 304 128 (CLI) ; `gares-grandes-lignes.csv` inchangé (sha256 `0e8d690f…`, non commité)

## Suite de tests
```
 Test Files  24 passed (24)
      Tests  397 passed (397)
```
Types : `tsc --noEmit -p .` sans erreur. E2E non relancés (brief : ils ne lisent jamais le vrai fichier). Build non relancé (aucun code touché).

## Décisions prises à la place de Vincent
- Décision : la preuve est une seule phrase entre guillemets CSV, au format « Site « … », itinéraire IGN depuis la mairie X min vers … ; tableau credibilite-services.md (tâche 0c), jugé faux par Vincent le 2026-11-24 (D12). » — suit le brief mot pour mot — coût si c'est faux : une ligne de texte à reprendre, aucun effet sur le site (la colonne n'est pas servie).

## Fichiers touchés hors de la liste de la tâche
- `docs/plans/2026-11-24-services/captures/retraits-D12-comparaison.mjs`, `retraits-D12-comparaison.txt`, `retraits-D12-sortie-services.txt` — la sonde de comparaison et ses deux sorties, gardées comme preuve (même usage que les sondes des tâches précédentes dans `captures/`).
- Non touchés et non commités, trouvés modifiés dans l'arbre de travail pendant la tâche : `docs/specs/2026-11-23-services/details.md`, `docs/specs/INDEX.md`, `docs/journal.md` (pas de mon fait, laissés tels quels).

## Tests existants modifiés
- aucun

## Leçons écrites
- aucune (aucune correction en plusieurs essais, aucune mesure contraire au plan)
