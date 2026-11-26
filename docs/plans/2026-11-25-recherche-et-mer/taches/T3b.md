# Tâche 3b — La mer en minutes, partout, et le recalage
Statut : faite · Début 07:32 · Fin 09:28 · Commits : 1282633..e21bf0f (7 commits) + le commit du rapport

## Ce que l'utilisateur peut faire maintenant
« Mer à moins de » propose « 15 min », « 30 min », « 1 h », « 1 h 30 » (plus aucun km, aucune bascule). L'adresse s'écrit `mer-min=30` ; un ancien lien `mer=30` est ignoré et disparaît de l'adresse. La liste, les raisons et la fiche disent des minutes : « 56 min de la mer en voiture » pour Bordeaux, « Mer 56 min : au-dessus de ton plafond de 30 min » quand elle ne passe pas ; une commune sans temps est comptée d'après ses km et l'écran le dit (« ≈ 7 h », « Temps en voiture jusqu'à la mer inconnu : compté 7 h d'après les km »). La montagne reste en km. Sur les vraies données, « 30 min » écarte Bordeaux (56 min) et garde Caen (18 min) : le « C'est réussi si » de la spec.

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-6 | `tests/e2e/recherche.spec.ts` · « AC-6 depuis /?loyer=1200, « 30 min » : pastilles 15 min, 30 min, 1 h, 1 h 30, sans bascule … » | vert, bureau et 390 |
| AC-7 | `tests/e2e/recherche.spec.ts` · « AC-7 /?loyer=1200&mer-min=60 : « 1 h » cochée … ; /?loyer=1200&mer-min=50 : Peu importe … » | vert, bureau et 390 |
| AC-8 | `tests/e2e/recherche.spec.ts` · « AC-8 /?loyer=1200&mer-min=60, aucun proche : Portmer 69, Quaibleu 43, Grandeville 24 ; Terrebasse … ; Rhinval … » | vert, bureau et 390 |
| AC-9 | `tests/e2e/recherche.spec.ts` · « AC-9 depuis /?loyer=1200 : fiche de Grandeville « 50 min de la mer en voiture » puis la montagne … ; mentions … » | vert, bureau et 390 |
| AC-10 | `tests/e2e/recherche.spec.ts` · « AC-10 anciens liens : … /?loyer=1200&mer=30&mer-min=15 → « 15 min » … » ; et `src/domain/url.test.ts` · « recherche-et-mer AC-10 (adresse) » | vert |

Les tests d'AC-6 à AC-10 n'existaient pas avant la tâche ; leurs textes (« 15 min », « mer-min= », « de la mer en voiture ») n'existaient pas non plus dans la page : ils ne pouvaient pas passer avant le code. `passes` de recherche-et-mer non touché (l'orchestrateur le bascule).

61 critères des tranches passées sont réécrits et repassés à `"passes": false` par `recalage.py --appliquer` (le tableau le dit) : loyer-mer 9, interface-telephone 11, proches 11 (+ `remplaces` de D19), cadre-de-vie 9, immobilier 10, proches-fiables 9, mairies 2. Leurs tests passent tous (suite plus bas) ; l'orchestrateur les remet à `true` après vérification.

## Preuves
Sur la version construite (`npm run build`, `npx vite preview --port 4180`, `version.txt` = e21bf0f), vraies données, script Playwright `/private/tmp/claude-501/-Users-mouga-git-repository-carte-ou-vivre/36964386-814e-40db-af4a-c1e079c843a9/scratchpad/preuves-t3b.mjs` (hors dépôt), 2026-11-26 09:08 :
- `docs/plans/2026-11-25-recherche-et-mer/captures/T3b-bureau-mer-30min.png` — bureau 1 280 × 800, « 30 min » cochée : 3 242 communes, la carte ne garde que les côtes.
- `…/captures/T3b-bureau-fiche-bordeaux.png` — fiche de Bordeaux : « Ne passe pas tes critères », « Mer 56 min : au-dessus de ton plafond de 30 min », « 56 min de la mer en voiture », puis « 173 km de la montagne à vol d'oiseau » ; aucun « km de la mer ».
- `…/captures/T3b-bureau-fiche-caen.png` — Caen passe, « 18 min de la mer en voiture », 2 266e sur 3 242.
- `…/captures/T3b-bureau-ancien-lien.png` — `/?loyer=1200&mer=30` réécrit en `/?loyer=1200`, aucune pastille de mer cochée.
- `…/captures/T3b-390-pastilles.png`, `T3b-390-liste-30min.png`, `T3b-390-fiche-bordeaux.png` — 390 × 844 : pastilles en minutes, liste « 470 € · moins d'1 min » / « 1 min », fiche de Bordeaux.
- `…/captures/T3b-mesure-pastille.txt` — le temps d'un toucher de pastille (ci-dessous).

Sortie du script (09:08) :
```
bureau pastilles : 15 min | 30 min | 1 h | 1 h 30
bureau adresse après « 30 min » : /?loyer=1200&mer-min=30
bureau compte : 3 242 communes passent tes critères
bureau 5 premières lignes : 1 · Plougasnou (29) · 79 · 469 € · 1 min / 2 · Le Mont-Saint-Michel (50) · 79 · 470 € · moins d'1 min / …
bureau Bordeaux : ne passe pas · Mer 56 min : au-dessus de ton plafond de 30 min · 56 min de la mer en voiture · « km de la mer » : false
bureau Caen : passe · 18 min de la mer en voiture · 2266e sur 3 242 communes qui passent
ancien lien /?loyer=1200&mer=30 → /?loyer=1200 · pastilles cochées : 0
390 adresse après « 30 min » : /?loyer=1200&mer-min=30
390 Bordeaux : Mer 56 min : au-dessus de ton plafond de 30 min · 56 min de la mer en voiture
```

**Mesure du geste (H90)** — méthode de cadre-de-vie (du keydown à la deuxième image après le changement d'adresse, 1 440 × 900, CPU × 4, fond uni, médiane de 15), version d'avant (f7b6d81) et d'après (e21bf0f) servies côte à côte et passées en alternance, 09:09-09:14 :
- après, mer 1 h ↔ 1 h 30 : **122 ms puis 129 ms** ; 15 ↔ 30 min : 105 et 105 ms ; témoin montagne : 94 et 91 ms ;
- avant, mer 50 ↔ 100 km (même geste au tableau) : 141 ms puis 132 ms ; témoin montagne : 109 et 91 ms.
Sous 164 ms, et pas plus lent qu'avant. Les chiffres absolus sont plus bas que les 149-164 ms du 2026-10-15 (autre jour, autre charge) : seule la comparaison au même moment compte. Pas d'arrêt.

Ce que la preuve ne couvre pas : un vrai téléphone, un lecteur d'écran ; la crédibilité des minutes elles-mêmes (tâche 0b, `credibilite-mer.md`, jugée à la démo).

## Suite de tests
- Unitaires (`npm run test:unit`, avant la suite complète) : `Test Files  27 passed (27)` · `Tests  456 passed (456)`
- Types (`npm run typecheck`) : `tsc --noEmit -p .` sans erreur
- Jetons (`npm run check-tokens`) : `check-tokens : 49 fichier(s), aucune valeur arbitraire`
- Construction (`npm run build`) : `✓ built in 1.89s`
- Par tranche, pendant le recalage (Playwright, fichiers de la tranche) : loyer-mer 46 passés, 2 sautés (sautés d'origine : bureau/390) ; interface-telephone 28 passés, 28 sautés (tests fixés à une seule fenêtre) ; proches 77 passés + 1 en échec par délai dépassé (« vide : texte d'accueil… », 390 : rien à voir avec la mer ; repassé seul en 6 s, vert) ; cadre-de-vie 60 / 4 ; immobilier 51 / 1 ; proches-fiables 55 / 1 ; mairies et services 78 / 6 ; recherche (AC-6 à AC-10) 10 / 0.
- Suite complète (`npm test`, 09:13-09:26, sortie entière dans `captures/T3b-npm-test.txt`) : Vitest `Test Files  27 passed (27)` · `Tests  456 passed (456)` ; Playwright `508 passed (13.4m)` · `53 skipped` (les sautés d'origine, par largeur), aucun échec, aucun « flaky ».

## Décisions prises à la place de Vincent
- Décision : la raison de la mer porte `dapresKm: true` seulement quand la commune est comptée d'après ses km (champ absent sinon) — les raisons d'une commune avec un temps gardent la forme d'avant, et le « ≈ » s'écrit sans recalculer — coût si c'est faux : nul à l'écran.
- Décision : `CHOIX_MONTAGNE` devient sa propre liste (10, 30, 50, 100 km) au lieu d'un alias de `CHOIX_MER` — la mer passe en minutes, la montagne reste en km — coût si c'est faux : aucun.
- Décision : `mer-min` ne lit que « 15 », « 30 », « 60 », « 90 » écrits tels quels (« 60.0 », « 050 » → Peu importe) — R60 « toute autre valeur » — coût si c'est faux : un lien bricolé retombe sur Peu importe.
- Décision : le résultat de `recalage.py --appliquer` réécrit aussi `recalage.md` (numéros de lignes décalés par la tâche 3a, 366 → 371 lignes repérées) ; j'ai remis le `recalage.md` validé tel quel (`git restore`) pour garder le texte que Vincent a validé — coût si c'est faux : les numéros de lignes de `score.test.ts` et `carte.ts` y sont décalés d'une ligne.
- Décision : ajout d'un test unitaire `recherche-et-mer AC-10 (adresse)` dans `url.test.ts` et de quatre tests R62/R63/H75 dans `format.test.ts` (nouveaux, à côté des recalés) — TDD de la tâche — coût : nul.
- Décision : dans les tests de AC-8 et AC-9, les communes sont choisies par la recherche (loupe), pas sur la carte — c'est le chemin de cette tranche et il marche aux deux largeurs — coût si c'est faux : aucun sur le critère (« choisit »).

## Fichiers touchés hors de la liste de la tâche
Par exception déclarée du plan (réécriture mécanique) : les 7 `acceptance.json` (par le script) et les fichiers de tests du tableau. En plus, explicitement prévus par le tableau ou le plan : `docs/specs/2026-10-13-proches/spec.md` (D19), `docs/specs/2026-10-14-cadre-de-vie/details.md` (renvois sous R28, H69, H75, H76, H77). `src/ui/List.tsx` non touché (il passe la commune entière à `chiffresListe`). `docs/specs/INDEX.md` régénéré par studio (comptes de critères qui passent) et commité. Hors dépôt : la note de leçon globale (ci-dessous).

## Tests existants modifiés
Chaque fichier est dans la liste « Tests hors critère touchés » de `docs/specs/2026-11-25-recherche-et-mer/recalage.md` ; la règle citée est celle de ce tableau.
- `src/domain/score.test.ts` — section « score.test.ts » + (f) : fixture avec `merMin` par code INSEE ; AC-3 (calcul) `mer: 60`, A 46 ; AC-10 A 69 ; AC-11 (calcul) `mer: 90`, Grandeville 25 ; H83 et R27 `mer: 15` ; « sous 1 km comparée comme 1 km » devient « moins d'1 min comparé comme 1 min » (`merMin: 0`, plafond 15, note 93) ; Sansloyer 92 ; Avecprix, Sansprix, Terre, égalités : `merMin: null`, mêmes nombres ; **les quatre tests de moitiés de H74 (cadre-de-vie) remplacés par un seul**, celle d'ici (Portmer 62,5 → 63 avec Nantesville à 1 h pour 2 h), comme le dit le tableau ; Tréon devient le repli de D7 (100 min, « ≈ 1 h 40 », raison à 1 h 30) ; `communeDeLigne` : `merMin: null`. Écart de lignes : la raison de Montcher (`valeur 148, plafond 50` → `135, 60`) et le titre d'AC-2 (« 1 h ») ne sont pas dans la liste des numéros de lignes du tableau mais découlent des règles (f) et (e) du même fichier. L'import `PRIX_DEPART`, devenu inutile, retiré.
- `src/domain/format.test.ts` — section « format.test.ts » : AC-4 (format) « 69 · 650 € · 5 min » ; `merFiche` « 50 min / 5 min de la mer en voiture », « Distance à la mer inconnue » gardée ; raison « Mer 2 h 15 : … de 1 h » ; résumés « Mer 1 h », « Mer 1 h 30 » ; `merTexte` inchangé.
- `src/domain/url.test.ts` — section « url.test.ts » : AC-11 `mer-min=60` ; AC-9 (adresse) change de sens (90, 30, adresse inchangée) ; « ancienne plage » et « toute autre valeur » changent de sens (tout `mer=` → Peu importe et retiré ; `mer-min` 50, 0, 23, abc, 60.0… → Peu importe) ; écriture `mer-min=` (H193) ; allers-retours `mer-min=15`, `mer-min=60`, `mer-min=90`. Écart : le test « les cinq choix se lisent tels quels » (non numéroté au tableau) devient « les quatre choix 15, 30, 60, 90 » par la même règle R60.
- `src/domain/prix.test.ts` — (f) et (e) : AC-2 à AC-8, AC-10, AC-13 (adresses `mer-min=60`, lignes en minutes, scores du tableau des valeurs).
- `src/domain/proches.test.ts` — (f), `MER50` → `mer: 60` (nom de la constante gardé) : 69, 43, 24 ; 63 ; 64 et 16 ; 48 et 25 ; proches-fiables AC-2 à AC-4 (calcul) 66/16, 64, 63, 68/29/25 ; 90 km 65/17.
- `src/domain/mairies.test.ts` — (f) ; H113 `mer: 15` ; adresse `mer-min=60` à la même place.
- `src/domain/emploi.test.ts`, `src/domain/services.test.ts` — rien (tableau : « rien »).
- `tests/e2e/lib/carte.ts` — « Accordé » du plan : `mer_min` à la fin de `champs` et la colonne, lue par code INSEE dans la fixture de recherche-et-mer, sinon km arrondis moitié vers le haut ; aucune ligne existante changée hors `champs`.
- `tests/e2e/lib/proches.ts` — `SANS_PROCHE` en minutes (69, 43, 24) et son commentaire.
- `tests/e2e/carte.spec.ts`, `liste.spec.ts`, `fiche.spec.ts`, `adresse.spec.ts`, `aucune.spec.ts`, `etats.spec.ts` — (a), (b), (c), (e) : loyer-mer AC-2 à AC-5, AC-7 à AC-11 ; `mer=5` → `mer-min=15` ; pastilles « 1 h », « 15 min ».
- `tests/e2e/telephone-feuille.spec.ts`, `telephone-vue.spec.ts` — (a), (e) : `mer-min=60`, `mer=60` → `mer-min=90` (trois tests hors critère), AC-6 score 69, AC-7 ligne de Grandeville en minutes.
- `tests/e2e/proches.spec.ts`, `proches-carte.spec.ts`, `proches-etats.spec.ts`, `proches-clavier-iphone.spec.ts` — (a), (b), (c), (e) : AC-1 à AC-16 ; « mémoire refusée » 63 · 5 min ; « empreinte » : son `communes.json` reste sans `mer_min` (décidé au tableau), « 65 · 650 € · ≈ 1 min ».
- `tests/e2e/cadre-de-vie.spec.ts` — (a) à (e) ; AC-9 et le test « R31 » changent de sens (`mer-min=90` / `30` ; `mer=5` et `mer-min=200, 23, 0, 50` → Peu importe) ; H75, H76, D12 Tab en minutes ; colonnes des tests de la montagne en minutes.
- `tests/e2e/immobilier.spec.ts` — (a), (b), (c), (e) : AC-2 à AC-8, AC-10, AC-13, AC-14 ; D2 et « Acheter sans plafond » `mer-min=60` ; design F « 50 min de la mer en voiture ».
- `tests/e2e/proches-fiables.spec.ts` — `DEPART` (a) ; AC-1 à AC-12, titres et lignes du tableau des valeurs.
- `tests/e2e/mairies.spec.ts` — (e) AC-2, AC-3 : colonne seule.
- `tests/e2e/services.spec.ts` — (a) une adresse.
- `tests/e2e/recherche.spec.ts` — seulement ajouté (AC-6 à AC-10 et leurs aides) ; aucun test existant changé.
Aucun test sauté ni supprimé, hors le remplacement des quatre moitiés H74 de `score.test.ts` voulu par le tableau.

## Leçons écrites
- `~/.claude/studio/solutions/2026-10-26-echappements-unicode-dans-le-terminal.md`, ligne « Revu le 2026-11-26 » : l'outil Edit ne trouve pas un `old_string` qui contient une espace insécable tapée ; écrire l'échappement à la place ; une espace en fin de `new_string` est retirée (trois titres de tests collés, corrigés). Index global régénéré.

## Ce qui reste
Rien pour la tâche. À l'orchestrateur : remettre à `true` les 61 critères recalés et AC-6 à AC-10 après vérification.
