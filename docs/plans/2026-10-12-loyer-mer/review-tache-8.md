# Relecture spec — loyer-mer, tâche 8 (D18 : la mairie, point unique de chaque commune)
Suite de tests : `npm run typecheck` sans erreur · Vitest « Test Files 6 passed (6) · Tests 47 passed (47) » · Playwright « 55 passed, 2 skipped (30.8s) » (les 2 sautés sont voulus : `aucune.spec.ts` en bureau, le parcours de `fiche.spec.ts` à 390 px) · Périmètre : cadc326 (spec, plan) et e78a21e (build), relus le 2026-10-13

Verdict : propre. La construction suit D18, H5 et l'étape 1 révisée de la vérification de bout en bout. Les données sont intactes : seule la distance change, les repères restent alignés sur les tuiles, toutes les communes ont leur mairie. Aucun Bloquant ni Majeur. Deux Mineurs.

[Mineur] La capture du rond de Granville demandée par le plan n'existe pas — la preuve est incomplète, mais le résultat est bon.
  Où : `docs/plans/2026-10-12-loyer-mer/captures/` (seuls `8-hague-fiche-1440.png` et `8-hague-france-1440.png` existent) ; `plan.md`, tâche 8, « Preuve attendue : … captures du rond de La Hague et de Granville »   Preuve : `ls captures | grep -i granv` ne trouve rien. J'ai vérifié Granville dans les données à la place : son rond est à [-1.5971, 48.8376], c'est-à-dire sa mairie. Il est dans sa commune (il ne fait pas partie des 32 ronds hors de leur commune). Sa distance à la mer est de 0,21 km, donc « moins d'1 km ».
  Correction : faire la capture du rond de Granville (c'est le cas qui a fait naître D18 : le centre de l'API tombait en mer), ou dire dans `progress.md` qu'elle a été remplacée par ce contrôle des données.   Réf : plan, tâche 8 ; D18

[Mineur] Aucun test automatique ne vérifie le rond : c'est la moitié de D18. Si le rond se décalait, rien ne le signalerait.
  Où : `scripts/data/communes.test.ts` (vérifie seulement la distance) ; `scripts/data/tuiles.py:124-132`. Le rond y est relié à sa commune par sa position dans la liste : le n-ième rond va à la n-ième commune de `communes.json`. Le seul contrôle qui suit compte les repères (`tuiles.py:141`).   Preuve : j'ai relu le diff. Mon script `/private/tmp/rv8/check.py` confirme que l'état actuel est juste : 34 746 repères sur 34 746, 0 écart entre le point du repère et la mairie de l'API.
  Correction : dans `communes.test.ts`, lire aussi `public/data/reperes.json`. Vérifier qu'il a autant de lignes que `communes.json`, et que le repère de Bordeaux (33063) vaut à peu près [-0,5794 ; 44,8379] et tombe dans son propre cadre.   Réf : D18, H5

## Contrôles faits (points 1 à 4 du brief)
1. **Conforme à D18 et H5.** La distance part de la mairie : `mer.py:138-141` lit `communes-mairie.json`. Le rond se pose sur la mairie : `tuiles.py:127-132`. Rien d'autre n'utilise encore l'ancien point (recherche dans `src/`, `scripts/`, `tests/`) :
   - `communes-centre.json` ne sert plus qu'aux populations (`communes.py:67`, H6). C'est documenté dans `sources.py:17` et `CLAUDE.md`.
   - Le calcul du milieu de la forme (`centre()`, `tuiles.py:44`) ne sert plus qu'aux tuiles des tests (`--fixture`). Ce n'est pas du code mort.
   - Les tests Playwright fournissent leurs propres repères (`tests/e2e/lib/carte.ts`). Ils ne dépendent donc pas de ce choix.
   - La fiche affiche « moins d'1 km de la mer » sous 1 km (`src/domain/format.ts:53`), comme le demande l'étape 1 révisée.
2. **Intégrité des données** (comparaison avec `e78a21e^`, en Python, scripts dans `/private/tmp/rv8/`) :
   - Même liste de colonnes. Mêmes 34 746 communes, dans le même ordre (triées par code INSEE). **Seule la colonne `mer_km` change.**
   - `reperes.json` a 34 746 lignes et **0 cadre modifié**. Le point de chaque repère est exactement la mairie de l'API, arrondie à 4 décimales (0 écart).
   - 0 commune sans mairie (toutes les mairies de l'API sont des points, aucun code en double). `mer-km.csv` et `communes.json` concordent (0 écart).
   - Les tuiles n'ont pas changé : aucun fichier de `public/tuiles` dans le commit.
   - Jointures : la mairie est reliée à sa commune par le code INSEE (`mer.py`, `tuiles.py:127`). Le repère est relié à sa forme par la position dans la liste, et cette position vient du même tri par code dans `communes.py:71,106` (n-ième forme = n-ième commune). La règle de `CLAUDE.md` (« Joindre toujours par code INSEE, jamais par nom ») est respectée.
   - Valeurs : Bordeaux 39,93 → 39,07 km ; La Rochelle 0,96 → 0,20 km ; Granville 0,03 → 0,21 ; Arles 13,36 → 26,09 ; Marseille 1,61 → 0,08 ; Paris 148,46 → 148,90.
3. **Preuves de la tâche 8.**
   - `8-controles.txt`, `8-ecart.txt` et `8-bout-en-bout.txt` existent et disent ce que `progress.md` annonce.
   - J'ai regardé quatre captures : `8-e2e-1-la-rochelle-1440.png` (« moins d'1 km de la mer »), `8-e2e-1-bordeaux-390.png` (« 39 km de la mer à vol d'oiseau », « 832 € par mois pour 52 m² (16,0 €/m²) »), `8-hague-fiche-1440.png` (rond n° 1 sur le bourg de Beaumont-Hague) et `8-hague-france-1440.png` (top 10 cohérent).
   - Détail : `8-e2e-4-ailleurs-1440.png` et `8-e2e-5-mentions-1440.png` sont le même fichier (même empreinte md5). C'est sans gravité : les mentions sont dans le pied de page de chaque capture, et le texte de l'étape 5 les liste.
   - **Les 32 ronds hors de leur commune** (recompté par un test point-dans-forme sur `formes-100m.json` : 32 exactement). D18 les accepte nommément, et ils ne trompent pas l'utilisateur : cliquer sur le rond ouvre la bonne fiche, et la distance affichée est bien celle de la mairie.
     - 26 sont à moins de 0,25 km de leur limite.
     - 6 sont plus loin : Suzan (09) à 1,2 km, Le Mont-Saint-Michel (50) à 1,1 km, Pourcharesses (48) à 1,0, Le Malzieu-Forain (48) à 0,9, Réez-Fosse-Martin (60) à 0,7, Château-Chinon (Campagne) (58) à 0,4. Ce sont toutes de petites communes. Seul Le Mont-Saint-Michel a des chances de figurer dans un top 10 (bord de mer, avec « Petite commune »). Son rond s'afficherait alors à environ 1 km de sa forme.
     - Ce n'est pas un défaut au regard de D18. À garder en tête si Vincent voit un rond « à côté » sur le Mont.
4. **Tests.** Les tests, `acceptance.json` et `src/` n'ont pas changé entre 83e42aa et e78a21e (`git diff --stat` est vide). Les AC-1 à AC-15 repassent sans modification, en bureau et à 390 px.

## Couverture des critères (mode spec)
| AC | Test | Statut | Note |
|---|---|---|---|
| AC-1, AC-2, AC-3 | `tests/e2e/carte.spec.ts` | couvert | passent en bureau et à 390 px ; données de test inchangées |
| AC-4, AC-5, AC-6 | `tests/e2e/liste.spec.ts` | couvert | idem |
| AC-7, AC-8, AC-9, AC-10 | `tests/e2e/fiche.spec.ts` | couvert | idem ; AC-8 vérifie « moins d'1 km de la mer » |
| AC-11 à AC-14 | `tests/e2e/adresse.spec.ts` | couvert | idem |
| AC-15 | `tests/e2e/etats.spec.ts` | couvert | idem |
`passes: true` pour les 15 critères : cohérent avec la suite. Dans cette relecture ciblée, je n'ai pas revérifié que chaque test contrôle les valeurs exactes de son AC : rien de ces tests n'a changé depuis les relectures précédentes (`review-spec.md`). `## Ne change pas` : « Première tranche » (pas de critère antérieur).

## Ce qui est bien fait
- Le changement est petit et ciblé, et fait exactement ce que décrit le plan : 6 fichiers de scripts et `CLAUDE.md`. Les populations ne bougent pas, parce que la mairie est téléchargée dans un fichier à part.
- `tuiles.py` s'arrête net s'il manque une mairie (`mairie[codes[i]]` lève une erreur) au lieu de poser un rond n'importe où.
- Les contrôles de `communes.py` et `communes.test.ts` ont été remis aux nouvelles valeurs de la spec (39 km, moins d'1 km), sans être affaiblis au-delà de ce que dit D18.
- `8-ecart.txt` prouve que seule la distance a changé. Mon recomptage le confirme.

## Non jugé
- Les chiffres de coût donnés à Vincent sont justes à une poignée près. En comptant comme le site (arrondi au plus proche, 0,5 vers le haut, et « moins d'1 km » compté comme 1 km) : 17 685 communes changent de distance affichée (annoncé : 17 673 dans D18, 17 680 dans le commit) ; 79 passent ou ne passent plus à 60 km (annoncé : 78) ; 39 bougent d'au moins 5 km. La commune d'écart à 60 km est Tauriac-de-Camarès (12275), à 60,50 km : Python l'arrondit à 60, le site affiche 61 km et la grise à 60 km. C'est sans effet sur le site, seul le compte annoncé est concerné.
- Les captures à 390 px autres que Bordeaux, et le parcours au clavier.
- La version en ligne : la vérification de bout en bout a été faite en local, comme le prévoit la tâche 8 ; la mise en ligne reste à faire.
- Le relevé des mairies dépend de l'API publique au 2026-10-13. Le relancer plus tard peut donner d'autres points. C'est déjà le cas des populations, ce n'est pas propre à cette tâche.
