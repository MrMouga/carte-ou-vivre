# Corrections 1 — Distance à la montagne arrondie deux fois
Statut : faite · Début 22:46 · Fin 23:03 · Commits : 9f52914 (correction : script, données, tests, CLAUDE.md, leçon) ; commit suivant (ce rapport, `risque-demo.md`, captures)

## Ce que l'utilisateur peut faire maintenant
La distance à la montagne affichée dans la fiche, et comparée au choix « Montagne à moins de », est celle de la distance mesurée, arrondie une seule fois au km. Clermont-Ferrand est à **2 km** (et non 3). Lissac-sur-Couze passe le choix « 10 km ». Au prix de départ avec la montagne à 10 km, **8 945 communes** passent, le compte de la tâche 0.

**À lire d'abord (décision prise à la place de Vincent).** `montagne_km` a bien deux décimales, comme décidé par Vincent. Mais la valeur est **tronquée**, pas arrondie comme la mer. La mesure montre qu'un arrondi au centième laisse le défaut en place pour 145 communes. Le détail est dans « Décisions ».

## Le constat (Majeur 1 de review-spec.md)
- **Cause** : `communes.py` écrivait `round(km, 1)`, puis le site arrondit au km (`score.ts`, `format.ts`). Deux arrondis de suite déplacent une valeur d'un cran : 2,465 km → 2,5 → 3 km. Mesuré sur `data-raw/montagne-km.csv` : 1 416 communes hors zone affichées 1 km trop loin, dont 22 qui changent de côté d'un seuil (10, 30, 50 ou 100 km).
- **Correction** : `km_montagne` (`scripts/data/communes.py`) écrit le km à deux décimales, tronqué : `(round(km * 1000) // 10) / 100`. On part des mètres entiers de `montagne-km.csv` (3 décimales), puis on fait une division entière, sans erreur de virgule flottante. Une valeur tronquée ne franchit jamais le demi-km : le km affiché par le site retombe toujours sur celui de la mesure. Une commune hors zone garde **au moins 0,01 km** : Raon-lès-Leau (54443) passe de 0,1 à 0,02 et se lit toujours « moins d'1 km », pas « Commune de montagne ». La valeur 0 reste réservée aux communes de montagne. Aucune commune hors zone n'a moins de 0,01 km : le plancher ne sert qu'à garder la règle.
- **Contrôles ajoutés à `communes.py`** (le script s'arrête au premier échec) :
  - « 0 commune affichée à un autre km que sa distance mesurée (double arrondi, R29) » ;
  - les valeurs de Clermont-Ferrand (2,46), Lissac-sur-Couze (10,49) et Raon-lès-Leau (0,02) ;
  - Clermont-Ferrand affichée 2 km, Lissac-sur-Couze 10 km.
  
  Les comptes par tranche sont maintenant **égaux** à ceux de la tâche 0 : 5 514 / 3 454 / 3 640 / 2 118 / 3 574 / 16 446.
- **Tests de non-régression** :
  - `scripts/data/communes.test.ts` · « R29 : Clermont-Ferrand à 2,46 km (affiché 2, pas 3) ; Lissac-sur-Couze à 10,49 km (affiché 10, pas 11) ; Raon-lès-Leau hors zone à 0,02 km, pas 0 » ;
  - `src/domain/score.test.ts` · « R29 non-régression : Clermont-Ferrand (63113) « 2 km de la montagne », comparée comme 2 (montagne 10 km seule : note 80) » ;
  - `src/domain/score.test.ts` · « R29 non-régression : Lissac-sur-Couze (19117, 10,495 km) passe la montagne à 10 km, note 0 » ;
  - `src/domain/score.test.ts` · « R29 non-régression : /?loyer=1200&montagne=10 sur les vraies données → 8 945 communes passent (compte de la tâche 0, source Cerema) ».
  
  Avant la correction, ces quatre tests échouaient pour la bonne raison : 2.5 au lieu de 2.46 ; « 3 km de la montagne » ; Lissac ne passait pas ; 8 936 au lieu de 8 945.
- **Code INSEE de Lissac-sur-Couze** : 19117, lu dans `data-raw/v_commune_2025.csv`. Il y a quatre « Lissac » ; la jointure se fait par code.
- **Diff des données** : `communes.json` a été régénéré par `python3 scripts/data/communes.py`, et tous ses contrôles passent. Ancien et nouveau fichier ont été comparés ligne à ligne, colonne par colonne : seule `montagne_km` change, sur 26 344 lignes. Les autres lignes de cette colonne valent 0, ou bien x,x0 était déjà égal. Toutes les autres colonnes sont identiques. Mêmes 34 746 codes, dans le même ordre. Le seul écart de plus de 0,05 km est Raon-lès-Leau (0,1 → 0,02, voulu). `achat.json`, `reperes.json` et `voisins.json` sont inchangés (absents de `git status`).

## Tests existants modifiés (précision seulement)
| Fichier · test | Avant | Après |
|---|---|---|
| `scripts/data/communes.test.ts` · « R29 : Bordeaux à 172,8 km de la montagne (Turenne, Corrèze), Grenoble à 0,7 km, Lyon à 13,7 km (mesures de la tâche 0) », renommé « … 172,78 km …, Grenoble à 0,65 km, Lyon à 13,69 km … » | 172.8 · 0.7 · 13.7 | 172.78 · 0.65 · 13.69 |
| `src/domain/score.test.ts` · « vraies données : Bordeaux ville dense à 172,8 km ; … », renommé « … 172,78 km ; … » | `montagneKm: 172.8` | `montagneKm: 172.78` |

Les valeurs après sont celles du script : la mesure de `montagne-km.csv` tronquée au centième (172,787 ; 0,651 ; 13,699). Aucun critère (AC-n) ni aucune fixture n'a changé, et aucun critère n'a cassé. Toutes les modifications de fichiers de test sont faites avec l'outil d'édition.

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| cadre-de-vie AC-3, AC-4, AC-7, AC-11 (montagne, fixture) | `tests/e2e/cadre-de-vie.spec.ts`, `src/domain/score.test.ts` | verts, inchangés |
| R29 sur les vraies données (constat) | les 4 tests de non-régression ci-dessus | verts |

## Preuves
- `docs/plans/2026-10-15-cadre-de-vie/captures/C1-preuve.txt` (22:59) : la version construite `9f52914` (`dist/version.txt`), servie par `npx vite preview --port 4181`, arrêtée ensuite. Vraies données, Chromium de Playwright, 1 440 × 900, script de la tâche 5 (zoom sur la mairie, puis clic). Ce qu'on y lit :
  - fiche de Clermont-Ferrand : « 2 km de la montagne à vol d'oiseau » ;
  - Pau 13, Lyon 14, Limoges 23, Toulouse 47, Bordeaux 173 ;
  - Chamonix, Annecy et Saint-Étienne : « Commune de montagne » ;
  - Grenoble : « moins d'1 km » ;
  - Lissac-sur-Couze à `/?loyer=aucun&montagne=10` : passe, « 0 / 100 », « 8825e sur 8 968 », « 10 km de la montagne » ;
  - `/?loyer=1200&montagne=10` : « 8 945 communes passent tes critères », avec les mêmes 10 premières qu'en tâche 0.
- `captures/C1-fiche-clermont-ferrand-1440.png` (22:58, réduite à 1 100 px) : la fiche de Clermont-Ferrand, « 2 km de la montagne à vol d'oiseau ».
- `captures/C1-fiche-lissac-montagne10-1440.png` (22:59) : la fiche de Lissac-sur-Couze, qui passe à 10 km.
- `captures/C1-montagne10-1440.png` (22:59) : `/?loyer=1200&montagne=10`, 8 945 communes.
- `captures/C1-npm-test.txt` (sortie complète de `npm test`) et `captures/C1-relance-instables.txt` (relance des tests instables).
- `risque-demo.md` : Clermont-Ferrand à 2 km, compte 8 945, ligne datée « Changements ».

## Suite de tests
`npm test` (22:49 → 22:55, charge ≈ 5) :
```
 Test Files  13 passed (13)
      Tests  200 passed (200)
check-tokens : 38 fichier(s), aucune valeur arbitraire
  6 failed
  35 skipped
  1 did not run
  287 passed (6.1m)
```
Les 6 échecs touchent 5 tests de fixtures, sans lien avec `communes.json` ni avec la montagne :
- `immobilier.spec.ts:261` « surface en cours de saisie… » (bureau et mobile) ;
- `immobilier.spec.ts:376` AC-10 (mobile) ;
- `proches-carte.spec.ts:35` AC-3, `:50` AC-5 et `:79` AC-14 (bureau).

Relancés seuls, 3 fois chacun sur les deux formats (`--repeat-each=3`) :
```
  30 passed (1.2m)
```
Ce sont donc des tests instables, comme ceux déjà notés dans `progress.md` à la simplification. Aucun test n'a été sauté ni modifié pour passer, et aucun délai d'attente n'a été touché.

`npm run typecheck` : `tsc --noEmit -p .`, sortie 0, aucune erreur.
`npm run check-tokens` : `check-tokens : 38 fichier(s), aucune valeur arbitraire`.
`npm run build` : `✓ built in 1.67s` (avertissement habituel sur les morceaux de plus de 500 kB), sortie 0. Reconstruit après le commit : `dist/version.txt` = `9f5291420a1da7f33ed81f222e6fd4bca5f5e4c4`.

## Poids de `communes.json`
| | Avant | Après | Écart |
|---|---|---|---|
| brut | 3 159 045 o | 3 185 372 o | + 26 327 (+ 0,8 %) |
| gzip -9 | 786 777 o | 810 571 o | + 23 794 (+ 3,0 %) |
| brotli (compression de Cloudflare) | 618 685 o | 633 404 o | + 14 719 (+ 2,4 %) |

## Décisions prises à la place de Vincent
- Décision : `montagne_km` est **tronqué** au centième, pas arrondi « comme la mer ». Pourquoi : mesuré sur les 34 746 communes, un arrondi au centième transforme les distances de x,495 à x,499 km en x,50. Il laisse donc **145 communes** affichées et comparées 1 km trop loin, dont une écartée à « 50 km » (82195, 50,496 km → 51). Tronquée, la valeur n'en laisse **aucune**. Le poids est le même que pour un arrondi au centième, avec la même précision de deux décimales. Coût si c'est faux : une ligne à changer dans `km_montagne`, puis les valeurs au centième de trois tests (Bordeaux 172,79 au lieu de 172,78 ; Lyon 13,70 au lieu de 13,69). Le contrôle « 0 commune affichée à un autre km » échouerait alors : il faudrait le retirer.
- Décision : le plancher hors zone passe de 0,1 à **0,01 km**, le plus petit pas servi. La règle de la tâche 1 reste la même (une commune hors zone n'est jamais à 0).
- Décision : je n'ai pas modifié `plan.md`, qui dit encore « km à 0,1 près » (tâche 1). Ce document appartient à l'orchestrateur ; CLAUDE.md, lui, est à jour.

## Fichiers touchés hors de la liste de la tâche
- `docs/solutions/2026-10-15-arrondi-d-une-valeur-ou-zero-a-un-sens.md` : ligne « Revu le », car son plancher de 0,1 n'est plus vrai.
- `docs/solutions/README.md` : régénéré par le script d'index.
- Hors du dépôt : `~/.claude/studio/solutions/2026-10-15-double-arrondi-valeur-comparee-a-l-affichage.md`, leçon utile à d'autres projets, et son index régénéré.

## Leçons écrites
- `docs/solutions/2026-10-15-double-arrondi-valeur-comparee-a-l-affichage.md`. Quand le site arrondit une valeur servie, il faut la servir tronquée et contrôler que le chiffre affiché est celui de la mesure. Arrondir plus finement ne fait que réduire le défaut.

## Non vérifié / à signaler
- **La distance à la mer a le même défaut résiduel** : `mer_km` est arrondi au centième, et **181 communes** sont affichées 1 km trop loin (mesuré sur `data-raw/mer-km.csv`). Je ne l'ai pas corrigé, car c'est hors de la correction demandée. À proposer à Vincent : même traitement, tronquer.
- Captures en bureau seulement (1 440 × 900), pas à 390 px : la fiche est le même composant aux deux tailles, et seule la donnée a changé.
- Le compte de 8 945 est vérifié par le test unitaire et dans la version construite. Le script de mesure de la tâche 0 n'a pas été relancé.
