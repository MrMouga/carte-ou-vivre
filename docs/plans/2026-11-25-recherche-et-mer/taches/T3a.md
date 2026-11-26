# Tâche 3a — Durées et comparaison en minutes, sans branchement
Statut : faite · Début 03:09 · Fin 03:13 · Commits : voir `git log` (un seul commit, « feat(recherche-et-mer): tâche 3a — … »)

## Ce que l'utilisateur peut faire maintenant
Rien de nouveau à l'écran, comme prévu : la page est la même. Ce qui existe maintenant, et qui sert à la tâche 3b, ce sont les règles qui écrivent un temps jusqu'à la mer (« moins d'1 min », « 50 min », « 1 h 05 », « 2 h 40 », « ≈ 7 h ») et qui donnent le temps comparé d'une commune (le temps servi, ou ses km comptés comme minutes quand elle n'a pas de temps). Ces règles sont testées seules. Aucune fonction déjà en place n'est appelée autrement.

## Fonctions ajoutées (ce que la tâche 3b appelle)
Dans `src/domain/score.ts` :
- `type TempsMer = { minutes: number; dapresKm: boolean }` : `minutes` telles qu'affichées (0 = « moins d'1 min ») ; `dapresKm` = sans temps, compté d'après les km (D7).
- `Commune.merMin?: number | null` : champ facultatif (absent ou `null` = sans temps). La tâche 0b le remplit dans `communeDeLigne` (`merMin: merMin ?? null`).
- `tempsMer(c: Pick<Commune, 'merKm' | 'merMin'>): TempsMer | null` : la valeur servie, telle quelle (aucun arrondi de plus, H191) ; sinon `kmCompare(merKm)` (1 km = 1 min, « moins d'1 km » = 1 min), avec `dapresKm: true` ; sans km ni temps, `null` (mer inconnue).
- `merMinComparee(c): number | null` : `max(1, tempsMer(c).minutes)` (« moins d'1 min » comparé comme 1 min, R61) ; `null` = mer inconnue. **À brancher en 3b dans `evaluer` à la place de `merComparee`** (même forme : `v == null` → `mer-inconnue` ; `v > r.mer` → raison ; sinon note `100 × (1 − v / choix)`).

Dans `src/domain/format.ts` :
- `dureeMer(min: number): string` : 0 → « moins d'1 min », sinon `duree(min)` (« 5 min », « 1 h », « 1 h 05 », « 2 h 40 », « 7 h »). Sert aussi aux pastilles (15, 30, 60, 90 → « 15 min », « 30 min », « 1 h », « 1 h 30 ») et au résumé replié (« Mer 1 h »). Pour la fiche sans temps de R63, 3b écrit `` `Temps en voiture jusqu'à la mer inconnu : compté ${dureeMer(t.minutes)} d'après les km` ``.
- `tempsMerTexte(t: TempsMer): string` : `dureeMer`, précédé de « ≈ » si `dapresKm` (« ≈ 7 h », H192). Pour la colonne de la liste et les raisons (« Mer ≈ 7 h : au-dessus de ton plafond de 1 h » : la valeur par `tempsMerTexte`, le plafond par `dureeMer`). Une raison de mer devra porter `dapresKm` (ou le `TempsMer`) pour que `raisonTexte` écrive le « ≈ » : à décider en 3b, le type `Raison` n'est pas touché ici.

## Critères
Aucun critère d'acceptation n'est porté par cette tâche (AC-6 à AC-10 sont en 3b). Les tests nomment les règles de la spec.

| Règle | Test (fichier · nom) | Résultat |
|---|---|---|
| H191 | `src/domain/format.test.ts` · « H191 : 0 → « moins d'1 min », « 5 min », « 50 min », « 1 h », « 1 h 05 », « 2 h 40 », « 7 h » » | vert |
| R60 | `src/domain/format.test.ts` · « R60 : les pastilles 15, 30, 60, 90 s'écrivent … » | vert |
| H3 | `src/domain/format.test.ts` · « H3 : espaces insécables dans la durée » | vert |
| H192 | `src/domain/format.test.ts` · « H192 : … (Rhinval, 420 km → « ≈ 7 h ») … » | vert |
| R61 | `src/domain/score.test.ts` · « R61 : la valeur servie est le temps, telle quelle (Portmer 5, …) » (fixture de recherche-et-mer, jointe par code INSEE) | vert |
| D7, H192 | `src/domain/score.test.ts` · « D7, H192 : Rhinval (420 km, sans temps) → 420 min …, « ≈ 7 h » » | vert |
| D7 | `src/domain/score.test.ts` · « D7 : sans temps, les km affichés comptent comme minutes (39,9 → 40 ; 148,5 → 149) ; 0,9 = 1 min » | vert |
| D7 | `src/domain/score.test.ts` · « D7 : une commune sans champ `merMin` … comptée d'après ses km » | vert |
| R61 | `src/domain/score.test.ts` · « R61 : « moins d'1 min » (0 servi) s'affiche 0 et se compare comme 1 min » | vert |
| R61 | `src/domain/score.test.ts` · « R61 : sans km ni temps, la mer est inconnue (null) » | vert |
| H191 | `src/domain/score.test.ts` · « la page ne recalcule rien … » | vert |

Rouge d'abord : 11 tests en échec (« tempsMer is not a function », exports manquants) avant le code.

## Preuves
- Pas de capture : rien ne change à l'écran (limite de la tâche). La preuve est la suite ci-dessous et le diff : dans `score.ts` et `format.ts`, la seule ligne existante modifiée est l'import de `format.ts` (ajout du type `TempsMer`) ; tout le reste est ajouté (2026-11-26 03:12).

## Suite de tests
- Unitaires (`npm run test:unit`) : `Test Files  27 passed (27)` · `Tests  446 passed (446)`
- Types (`npm run typecheck`) : `tsc --noEmit -p .` sans erreur
- Construction (`npm run build`) : `✓ built in 3.26s`
- Jetons (`npm run check-tokens`) : `check-tokens : 49 fichier(s), aucune valeur arbitraire`
- Playwright non lancé (consigne du brief : rien ne change à l'écran ; l'orchestrateur relance la suite).

## Décisions prises à la place de Vincent
- Décision : espace insécable entre « ≈ » et le temps (« ≈ 7 h » ne se coupe jamais après le signe) — même règle que H3 pour les unités ; les tests de bout en bout comparent déjà les espaces insécables comme des espaces — coût si c'est faux : un caractère à changer dans `tempsMerTexte`. *Décidé par Claude.*
- Décision : `merMin` est un champ facultatif de `Commune`, ajouté dès maintenant au type (pas encore lu par `communeDeLigne`, c'est la tâche 0b) — le brief l'autorise, et une commune écrite à la main sans ce champ est ainsi « sans temps », comme le dit la règle (f) du recalage — coût si c'est faux : nul à l'écran ; 0b n'a plus qu'à le remplir.
- Décision : avec un temps servi, les km ne sont pas lus du tout (même si la commune a aussi des km) ; un `merMin` servi sans km reste un temps — la page affiche la valeur servie, sans rien recalculer (plan, « Les minutes ») — coût si c'est faux : aucun cas réel attendu (le temps vient du point de côte, qui vient des km).

## Fichiers touchés hors de la liste de la tâche
Aucun (le rapport lui-même, `taches/T3a.md`, à part). `docs/journal.md` était déjà modifié avant la tâche (généré par studio) : laissé tel quel, hors du commit.

## Tests existants modifiés
- `src/domain/format.test.ts` — seule la ligne d'import gagne `dureeMer` et `tempsMerTexte` ; un bloc de tests ajouté à la fin ; aucun test existant changé.
- `src/domain/score.test.ts` — les imports gagnent la fixture de recherche-et-mer, `tempsMerTexte`, `tempsMer` et `merMinComparee` ; un bloc de tests ajouté à la fin ; aucun test existant changé.

## Leçons écrites
Aucune (pas de correction ratée ; une seule reprise : les espaces insécables des nouveaux tests écrites en ` ` pour être visibles dans le code).

## Ce qui reste
Rien pour cette tâche. Pour 3b : brancher `merMinComparee` dans `evaluer`, faire porter le « ≈ » à la raison de la mer, et passer la colonne, les raisons, la fiche, les pastilles et le résumé sur `dureeMer` / `tempsMerTexte`.
