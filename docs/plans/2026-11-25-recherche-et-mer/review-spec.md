# Relecture spec — recherche-et-mer
Statut : terminé

Suite de tests (relancée par le relecteur le 2026-11-26 à 10:00, machine chargée : un agent de QA tournait en même temps, charge ~9) : Vitest **27 fichiers, 456 tests, 456 verts** ; check-tokens « 49 fichier(s), aucune valeur arbitraire » ; Playwright **503 passés, 4 échoués, 53 sautés (16,0 min)** ; les 4 échecs repassent tous seuls, relancés à part (4 passed, 24,2 s) · `npm run typecheck` : vert · `npm run build` : vert, `dist/version.txt` = 7cb4c09 · Périmètre : 88e5525..7cb4c09 (29 commits, build depuis 420aa85)

## Constats

Aucun Bloquant trouvé.

[Majeur] Au téléphone, la liste des suggestions garde 280 px de haut. À 390 px, un code complet comme 01300 (22 communes) n'en montre que 6, alors que la moitié de la feuille montée reste vide. L'orchestrateur l'avait noté « à corriger avant la démo », mais rien ne l'a corrigé depuis.
  Où : src/ui/Recherche.tsx:210 (`max-h-liste-suggestions` posé à toutes les largeurs) ; src/theme/tokens.ts:80 (280)   Preuve : `git log 3480ded..HEAD -- src/ui/Recherche.tsx` ne montre que f81a26d (la simplification du gestionnaire de focus) ; progress.md, ligne « À corriger avant la démo » sous la tâche 2, sans suite ; `grep liste-suggestions src` : aucune autre règle sous 1 024 px.
  Correction : sous 1 024 px, la liste prend la hauteur disponible (`max-bureau:max-h-none`, le conteneur étant déjà `flex-1 min-h-0`) ; refaire la capture T2-390-01300.   Réf : R58 (« dans une liste qui défile »), H177 (la recherche remplace tout sous la poignée), progress.md.

[Mineur] Sous forte charge, 4 tests de proches dépassent leur délai de 30 s (tous en bureau, tous avec le faux service IGN) : `proches-carte.spec.ts:79` (AC-14 de proches, « Ne change pas »), `proches-etats.spec.ts:220` (« Ajouter » au-dessus du compte collé), `proches-fiables.spec.ts:544` (AC-8 (d)) et `:561` (AC-8 (e)). Ils échouent dans la suite complète, machine à une charge d'environ 9 avec une QA en parallèle. Relancés seuls juste après, ils passent tous les quatre (6,5 à 15,4 s chacun). Ce ne sont pas des régressions, mais des tests instables, comme AC-2 de carte.spec.ts déjà signalé. Conséquence : une suite rouge sur une machine chargée peut faire croire à une régression.
  Où : tests/e2e/proches-carte.spec.ts:79, proches-etats.spec.ts:220, proches-fiables.spec.ts:544 et :561   Preuve : `npm test` (4 failed, 503 passed) puis `npx playwright test <les 4> --project=bureau` (4 passed, 24,2 s).
  Correction : lancer la suite sur une machine au repos ; à terme, regarder ce qui prend plus de 30 s sous charge dans ces tests (attentes du faux service IGN).   Réf : « Ne change pas » de details.md.

[Mineur] H184 dit « après le choix, le champ se ferme » ; en bureau, il reste ouvert et montre la commune. C'est un choix noté dans progress.md (« T1, décidé par Claude… AC-4, prototype C »), cohérent avec AC-4 (« le champ affiche « Montcher (75) » »). La spec se contredit donc elle-même (H184 contre AC-4), et la contradiction n'est réglée que dans le journal de construction.
  Où : src/App.tsx (`choisirRecherche` : `if (!bureau) setRechercheOuverte(false)`)   Preuve : lecture ; details.md H184.
  Correction : amender H184 (« en bureau, le champ reste ouvert et montre la commune ; au téléphone, il se ferme »), à faire valider par Vincent à la démo.   Réf : H184, AC-4.

[Mineur] Avec plusieurs suggestions, « flèche bas puis Entrée » choisit la **deuxième**, parce que la première est déjà en surbrillance (même modèle que le champ du métier, `Emploi.tsx`). Le geste d'AC-4 (« flèche bas, Entrée ») ne marche donc comme on l'attend que s'il n'y a qu'une suggestion, ce qui est le cas de « mo ». Sur les vraies données, « auch » puis flèche bas et Entrée ouvre Auchel, pas Auch. Le test « R58 et H183 : 99100, flèche bas, Entrée : Portmer » s'appuie sur ce comportement.
  Où : src/ui/Recherche.tsx:86, 163-167   Preuve : lecture (`actif` vaut 0 dès qu'une suggestion apparaît ; ArrowDown → `actif + 1`).
  Correction : décision de Vincent, à prendre à la démo : garder ce modèle (cohérent avec le métier), ou ne rien surligner avant la première flèche.   Réf : H186, AC-4.

[Mineur] CLAUDE.md dit que l'envoi des minutes a été « lancé par Vincent le 2026-11-26 de 01:05 à 01:08 ». D'après progress.md, c'est l'agent qui l'a lancé, à la demande écrite de Vincent (« Lance le à ma place »). C'est une exception à la règle « Les requêtes POST sont lancées par Vincent ». La fiche de référence du projet dit donc le contraire de ce qui s'est passé.
  Où : CLAUDE.md, ligne « Mer en minutes (tranche recherche-et-mer, tâche 0b…) »   Preuve : progress.md, « Accord de Vincent (2026-11-26) ».
  Correction : écrire « lancé par l'agent à la demande de Vincent, exception pour ce seul envoi ».   Réf : CLAUDE.md, ORS.

[Mineur] Un crochet de test vit dans le code servi : MapView écrit `data-vue` (zoom et centre) à chaque fin de mouvement de la carte, pour qu'AC-4 puisse le lire. Ce fichier n'était pas dans la liste de la tâche 1 (c'est déclaré dans progress.md). Le coût est négligeable, mais c'est du code de production qui ne sert qu'aux tests.
  Où : src/map/MapView.tsx:93-101   Preuve : diff.   Correction : garder, ou lire la vue par `page.evaluate` sur l'instance de la carte.   Réf : plan, tâche 1 (fichiers).

## Couverture des critères (mode spec)
| AC | Test | Statut | Note |
|---|---|---|---|
| AC-1 | tests/e2e/recherche.spec.ts « AC-1 en bureau … aucune requête hors du site pendant la saisie » ; src/domain/recherche.test.ts « AC-1 … » | couvert | relève toutes les requêtes et celles qui contiennent la saisie ; vert (Vitest et Playwright) |
| AC-2 | recherche.spec.ts « AC-2 : 99100 … » ; recherche.test.ts « AC-2 … » | couvert | ordre exact et noms accessibles exacts |
| AC-3 | recherche.spec.ts « AC-3 : zzz aucune ; codes en erreur … » | couvert | vérifie aussi 2 demandes (H187) |
| AC-4 | recherche.spec.ts « AC-4 en bureau … » | couvert | zoom à 0,01 près et centre à 1 px près comparés à un clic sur la carte ; voir le Mineur sur flèche bas |
| AC-5 | recherche.spec.ts « AC-5 à 390 × 844 … » | couvert | « 31 » cherché dans tout le texte de la fiche (faible, mais conforme au texte du critère) |
| AC-6 | recherche.spec.ts « AC-6 … » | couvert | pastilles, aucun bouton km/min, adresse, lignes exactes |
| AC-7 | recherche.spec.ts « AC-7 … » | couvert | 5 lignes exactes, « ≈ 7 h » |
| AC-8 | recherche.spec.ts « AC-8 … » | couvert | communes choisies par la recherche (décision notée) |
| AC-9 | recherche.spec.ts « AC-9 … » | couvert | ordre mer puis montagne, aucun « km de la mer », pied de page |
| AC-10 | recherche.spec.ts « AC-10 anciens liens … » ; url.test.ts « recherche-et-mer AC-10 (adresse) » | couvert | — |
| AC-11 | recherche.spec.ts « AC-11 état « aucune commune » … » | couvert | message de liste comparé avant / après |
| AC-12 | src/domain/recherche.test.ts, 7 tests « AC-12 … » | couvert | Vitest vert (456/456) |
| AC-13 | recherche.test.ts « AC-13 99200 / 992 / 75015 » ; scripts/data/codes_postaux.test.ts « AC-13 (morceau a) » | couvert | Vitest vert ; « liste qui défile » non testé en unitaire (pris par `overflow-y-auto`) |
| 61 critères recalés (7 tranches) | tests des tranches, titres recalés (règle e) | conformes à recalage.md | comparaison par script : 60 identiques mot pour mot, plus cadre-de-vie AC-9 relu à la main ; aucun reste `mer=<km>` ni « km de la mer » dans les titres et les attentes (grep) |
| proches AC-12, AC-13, AC-15 | — | `passes: false` dans `remplaces` | voulu (D19) |
| proches AC-14, proches-fiables AC-8 (d)(e) (« Ne change pas ») | proches-carte.spec.ts:79, proches-fiables.spec.ts:544, :561 | couvert | ont échoué par délai dans la suite complète sous charge ; passent relancés seuls |

## Ce qui est bien fait
- Les 61 critères recalés sont **exactement** ceux de recalage.md. Un script lit recalage.md et compare, champ par champ, `git show 88e5525:…/acceptance.json` et l'état actuel. Résultat : aucune réécriture sans ligne du tableau, aucune ligne du tableau oubliée. Ailleurs, seuls changent `passes`, la description des fixtures (le texte « Révision recherche-et-mer » du tableau) et `remplaces` de proches (D19). L'acceptance.json de la tranche n'a changé que ses `passes`.
- Les 29 fichiers de tests modifiés sont tous dans la liste de recalage.md, sauf `scripts/data/communes.test.ts`. Pour ce dernier, seule la ligne 76 a changé (accord du plan) ; le reste ce sont des ajouts. Les valeurs attendues qui changent (72→69, 49→46, 98→92, Tréon) découlent des règles (a) à (f) du tableau.
- Les minutes servies se recalculent à l'identique, sans réseau. `mer_minutes.py --calculer --sortie <scratchpad>` donne un fichier identique octet pour octet à `data-raw/mer-min.csv` (vérifié par `cmp`), et aucun écart avec la colonne `mer_min` de `public/data/communes.json`. 43 communes sont sans temps (12 sans route près du point, 30 sans route jusqu'au point, 1 retrait). Bordeaux 56 min et Caen 18 min : « 30 min » écarte bien Bordeaux et garde Caen.
- Les règles sont tenues : R60 (`mer-min` seul lu, `mer` ignoré, ordre de H193), R61 et R62 (valeur servie comparée telle quelle, « moins d'1 min » = 1, repli km = min avec « ≈ »), R63 (ligne de fiche, deux mentions avec la date 17/11/2026). Les poids respectent H195 (+54,8 Ko et 110 Ko en brotli, d'après la mesure). Pour H187 (une demande, un nouvel essai, 10 s), les tests sont unitaires et de bout en bout.
- Aucune clé openrouteservice dans le dépôt ni dans les 29 commits. `gitleaks git --log-opts=88e5525..HEAD` répond « no leaks found » ; une recherche des préfixes connus des clés ORS dans l'arbre, l'historique et `data-raw/mer-calcul/` ne trouve rien.
- Il ne reste pas de code mort des km de la mer. `ANCIENNE_MER` est retiré ; `merTexte` et `kmCompare` servent encore aux proches et à la montagne, et leurs commentaires sont corrigés. Les documents des tranches passées sont annotés (cadre-de-vie R28, H69, H75, H77 ; loyer-mer D20 et l'exception d'accessibilité ; D19 de proches).

## Non jugé
- Le comportement réel dans un navigateur (la QA de son côté n'avait pas WebGL), le contraste des mentions en bas du panneau, les annonces au lecteur d'écran.
- La crédibilité des minutes (credibilite-mer.md, jugée à la démo par Vincent), dont 2 094 points de côte accrochés à plus de 1 km.
- Les dates des preuves : les captures de chaque tâche sont antérieures à son commit (elles sont dans le même commit). Pour T2 et T4, l'heure notée dans progress.md (02:00, 02:50) est plus tardive que celle des fichiers (01:46, 02:30), mais cet écart ne prouve rien.
- La règle `deNom` est sans objet : aucun texte de la tranche n'insère un nom de commune dans une phrase.
