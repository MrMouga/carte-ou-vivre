# Relecture spec — cadre-de-vie
2026-10-15 · relecteur neuf, lecture seule.
Suite de tests (relancée par moi, 22:30–22:37, charge 5,9) : Vitest **196 passed (13 fichiers)** · check-tokens « 38 fichier(s), aucune valeur arbitraire » · Playwright **294 passed, 35 skipped (5.5m)**, sortie 0 · `npm run typecheck` sans erreur · `npm run build` OK (`dist/version.txt` = 4cace9f).
Périmètre : `git diff 8e43285..HEAD` (26 commits, 2fef378 → 4cace9f), aucun revert.

## Constats

**[Majeur] Distance à la montagne arrondie deux fois : 1 416 communes affichées 1 km trop loin, et 22 écartées d'un choix qu'elles tiennent.**
Conséquence : la fiche et le filtre mentent d'1 km pour environ 4 % des communes hors zone. Parmi elles, Clermont-Ferrand, une ville du risque que Vincent a jugée : 3 km sur le site, 2,47 km en vrai. Et 22 communes ne passent pas un plafond qu'elles tiennent (Lissac-sur-Couze 10,495 km → 11 ; Chabrac 50,495 → 51 ; Busserotte-et-Montenaille 100,466 → 101…).
- Attendu (R29) : « la distance à vol d'oiseau de sa mairie […] affichée au km » ; la valeur comparée est la valeur affichée.
- Livré : `scripts/data/communes.py:150` écrit `round(km, 1)` (2,465 → 2,5), puis `src/domain/score.ts:119` et `format.ts:143` arrondissent encore au km (2,5 → 3). La mer n'a pas ce défaut : elle garde 2 décimales (`communes.py:325`).
- Preuve : script sur `data-raw/montagne-km.csv` comparé à `public/data/communes.json` → 1 416 écarts, dont 22 sur un seuil 10/30/50/100. `progress.md` en annonce 9, et seulement à « 10 km ».
- Origine : le plan (tâche 1) imposait « km à 0,1 près ». C'est le plan qui contredit R29, pas seulement le code.
- Correction : écrire `montagne_km` avec 2 décimales, comme `mer_km`, en gardant le plancher de 0,01 hors zone. Ajouter au contrôle de `communes.py` Clermont-Ferrand (63113) affiché 2 et une commune entre x,45 et x,5. Recompter `TRANCHES_MONTAGNE`.
- Réf : R29, R28 (« comparer la valeur affichée »).

**[Majeur] Le critère de réussite « avec la montagne à 10 km, Chamonix passe » ne tient pas depuis le départ. La preuve a été faite à un autre prix, sans demander à Vincent.**
Conséquence : un visiteur qui ouvre `/` (1 200 €) et choisit « Montagne 10 km » ne voit pas Chamonix. Son loyer est de 1 334 € pour 52 m², au-dessus du plafond. La démo de la spec échoue donc sur le vrai parcours.
- Attendu : spec.md, « C'est réussi si : […] avec la montagne à 10 km, Chamonix passe ». details.md, vérification de bout en bout, étape 2, qui suit l'étape 1 (`/?loyer=1200`).
- Livré : `captures/T5-preuve-bout.txt` dit « 2. /?loyer=1350, montagne « 10 km » ». La décision « T4 : preuve faite à 1 350 € » est rangée dans « Décisions prises à la place de Vincent ». C'est pourtant un changement de critère, qui revenait à Vincent (CLAUDE.md : « un critère faux revient à Vincent »).
- Reproduire : `npx vite preview`, ouvrir `/?loyer=1200&montagne=10`, chercher Chamonix-Mont-Blanc : sa fiche dit « Loyer 1 334 € : au-dessus de ton plafond de 1 200 € ».
- Correction : Vincent tranche. Soit le critère dit « à 1 350 € » ou « prix Sans limite », soit on accepte que Chamonix ne passe pas au départ.

**[Majeur] Choisir une distance à la mer met 149 à 164 ms à redessiner la carte, au-delà du budget de 100 ms.**
- Attendu : details.md, « Interactions : cocher une pastille → carte, liste, fiche et adresse à jour en ≤ 100 ms (H9 de loyer-mer) ».
- Livré : `captures/T4-mesure-reaction.txt`, cases « Mer à moins de » 50 ↔ 100 km, médianes 149 à 164 ms. La lenteur vient de la bascule de la tâche 3 (un geste recolore toute la bande de 50 à 100 km). La montagne et le prix restent à 114-116 ms.
- Ce constat est déjà signalé dans `progress.md` (« À la démo »), mais aucune décision n'est prise. Il contredit une règle de la spec.
- Correction : décision de Vincent (accepter pour ce geste ou optimiser), écrite dans la spec.

**[Mineur] Trois tests de loyer-mer ne vérifient que la tranche de couleur, pas le score que leur critère cite.**
- Où : `tests/e2e/carte.spec.ts:8` (AC-1), `:13` (AC-2) et `tests/e2e/etats.spec.ts:10` (AC-15).
- Attendu : « D a le score 65 […], A 46, B 31, E 9 ».
- Livré : ces tests contrôlent `score-4`, `score-3`, `score-2`, `score-1`. Les scores exacts ne sont vérifiés que dans le test unitaire `src/domain/score.test.ts:28`. Les tests étaient déjà écrits ainsi avant cette tranche, mais avec le recalage les valeurs ont changé sans qu'aucun test navigateur les lise.
- Correction : lire la liste, ou l'`aria-label` des lignes, dans ces trois tests.

**[Mineur] Plusieurs captures ont été prises avant le commit du code qu'elles prouvent.**
- T3 : captures de 16:47, commit 6431afd à 17:03. T2 : `T2-apres`, `T2-acheter-*` à 15:55, commit 2062da7 à 15:56:00. T1 : `T1-acheter-5000.png` à 15:15, commit f924641 à 15:16:41.
- Conséquence : rien ne relie la capture au code commité. Les preuves de T4 et T5 (20:05 et 20:56) sont, elles, postérieures à leurs commits.
- Correction : capturer depuis une version construite après le commit (`dist/version.txt`).

**[Mineur] Fichiers modifiés hors des listes de leur tâche.**
- Tâche 2 : `tests/e2e/lib/proches.ts` (`SANS_PROCHE` passe de 72, 49, 32 à 72, 48, 25, conforme à recalage.md).
- Tâche 4 : `src/ui/Settings.tsx`, `src/domain/prix.test.ts`. Tâche 5 : `src/ui/Settings.tsx`.
- Contenu vérifié : aucun écart avec la spec.

**[Mineur] Le composant Toggle prévu par le contrat du design n'est pas utilisé, et du code inutile reste en place.**
- Le contrat dit « Rangée qui défile : groupe nommé de Pastilles (Toggle) ». `src/ui/CadreDeVie.tsx` utilise des `button` simples. Le composant `Toggle` et le paquet `@radix-ui/react-toggle` ne servent plus que la page démo.
- Restent aussi `BORNES` dans `url.ts` (le prix seul), `REGLAGES_DEPART`, et les raisons `mer-inconnue` et `loyer-inconnu`.
- Le contrat (`docs/design/system/README.md`) cite encore la mer parmi les curseurs.
- Tout cela est déjà signalé par `taches/simplification.md`. À trancher.

**[Mineur] La spec d'immobilier contient un chiffre faux.**
- D12 dit « maisons : 1 → 0 ». En réalité Île-de-Sein (29083) reste sans prix de maison (`communes.py`, `MESURES` ; CLAUDE.md).
- C'est signalé dans `progress.md`, mais la spec n'est pas corrigée.

**[Mineur, hors tranche] Défauts anciens visibles avec cette tranche.**
- Le rang « 7724e » s'affiche sans espace insécable (H3), dans la fiche de Chamonix de la preuve T5.
- Le pied de page ne contient ni « openrouteservice » ni « © OpenStreetMap contributors », que CLAUDE.md liste comme mentions obligatoires. C'était déjà le cas avant cette tranche (proches est passé à l'IGN). Il faut corriger soit CLAUDE.md, soit le pied de page.

## Ce qui est conforme (vérifié)
- **Critères** : les 65 critères des cinq `acceptance.json` sont à `passes: true`. Chacun a au moins un test qui porte son id et qui passe. J'ai comparé chaque `given / when / then` aux tests : adresses, valeurs entre guillemets, ordre des lignes. Les seuls écarts sont les trois tests du constat ci-dessus.
- **`acceptance.json`** : seules les lignes `passes` ont changé (`git diff` sur les cinq fichiers). Aucun `given / when / then` modifié.
- **Ne change pas** : le test d'immobilier AC-9 ne change que la ligne d'adresse (`/?achat=5000`, comme le plan l'autorise). AC-12 n'a pas changé. Les deux passent.
- **Sauts** : aucun `fixme`, `only` ni `todo`. Les 35 tests sautés le sont tous par condition de projet (bureau ou mobile), avec leur raison écrite. Proches AC-12, AC-13 et AC-15 sont rangés dans `reportes` : aucun test n'existe pour eux, ni avant ni après la tranche.
- **Règles et décisions** : R27 à R32 et H83 sont tenues dans le code (`score.ts`, `url.ts`, `format.ts`, `CadreDeVie.tsx`). Exceptions : le défaut d'arrondi de R29 et le budget de 100 ms ci-dessus. D2, D4, D6, D7, D8, D10 et D11 sont respectées. H74 (moitié vers le haut) est tenue par `moyenne()` et testée sur les quatre cas de recalage.md plus 28,5 → 29.
- **Mentions** : le pied de page contient « Type d'environnement : Insee, grille communale de densité 2025 (mise en ligne le 21/07/2025) » et « Zone de montagne : Cerema, communes soumises à la loi Montagne (2019) », au mot près comme CLAUDE.md.
- **Données** : la jointure se fait par code INSEE (`NIVEAU.get(dens7.get(code))`, `montagne.get(code)`). 34 746 lignes, aucune sans type ni sans distance. Les comptes par type (692, 3 514, 23 305, 7 235) sont égaux à ceux de la tâche 0. Bordeaux est ville dense à 172,8 km, Lacanau bourg et village, Chamonix à 0.
- **Preuves** : chaque fichier cité dans `progress.md` existe. Les captures iPhone (22:22 et 22:24) sont postérieures à la version 1722654 testée.

## Couverture des critères (mode spec)
| AC | Test | Statut | Note |
|---|---|---|---|
| cadre-de-vie AC-1 à AC-12 | `tests/e2e/cadre-de-vie.spec.ts` l. 377, 52, 232, 244, 397, 68, 260, 418, 87, 430, 282, 295 | couvert | valeurs, adresses et ordre identiques au critère |
| loyer-mer AC-1, AC-2, AC-15 | `carte.spec.ts:8`, `:13`, `etats.spec.ts:10` | couvert, en partie creux | tranche de couleur seulement ; scores dans `score.test.ts` |
| loyer-mer AC-3 à AC-14 | `carte`, `liste`, `fiche`, `adresse` .spec.ts | couvert | |
| proches AC-1 à AC-11, AC-14, AC-16 | `proches*.spec.ts` | couvert | AC-12, AC-13, AC-15 reportés, sans test |
| interface-telephone AC-1 à AC-11 | `telephone-*.spec.ts`, `proches-clavier-iphone.spec.ts:141` | couvert | AC-8 : partie iPhone appuyée sur des captures, que je n'ai pas ouvertes |
| immobilier AC-1 à AC-14 | `immobilier.spec.ts` | couvert | AC-9 : adresse seulement ; AC-12 inchangé ; AC-8 réécrit sur `montagne=100` |

## Ce qui est bien fait
- Le départ (R32) et la conversion des anciens liens (R31) sont exacts et testés aux limites : `mer=5`, `mer=23`, `mer=0`, `mer=200`, `montagne=0`, `montagne=abc`, `env` avec doublon et nom inconnu.
- Les contrôles de `communes.py` s'arrêtent sur un écart de plus de 5 % avec la tâche 0 et sur une commune hors zone qui tomberait à 0 km. La grille Insee est vérifiée par sa date de mise en ligne.
- Les détours des builders sont avoués dans les rapports. Les tests réécrits hors de l'outil d'édition donnent un résultat conforme aux critères.

## Non vérifié
- Le contenu des captures (PNG), y compris les trois captures iPhone d'interface-telephone AC-8 : je ne les ai pas ouvertes.
- Les chiffres de recalage.md recalculés de mon côté : j'ai comparé les tests aux `acceptance.json`, pas refait le calcul.
- La géométrie de `scripts/data/montagne.py` (recalage COG, zones infra-communales) et les chiffres de `mesure-tache-0.md`.
- Les règles de recalage des tests hors critères, une par une (`categories`, `safari`, `chrome`, `aucune`, `composants`) : seulement vérifié qu'ils passent.
- L'accessibilité et le design au-delà de la lecture de `CadreDeVie.tsx`.
- La version en ligne (reportée à /ship).
- Aucun test n'a échoué : je n'ai donc rien relancé seul.
