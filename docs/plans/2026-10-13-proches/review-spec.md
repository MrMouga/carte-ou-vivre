# Relecture spec — proches
Suite de tests : `npm test` (5 workers, défaut) : Vitest 82/82, check-tokens vert (35 fichiers), Playwright **142 passés, 4 échoués, 2 sautés, 1 non lancé** (EXIT 1) · relance `npx playwright test --workers=2` : **147 passés, 2 sautés** (EXIT 0) · Périmètre : `1ddd21a..d52ef79` (34 commits, tâches 0 à 5, correctif clavier iPhone, simplification) · relu le 2026-10-13 par un relecteur neuf, en lecture seule

Les 13 critères actifs ont chacun un test qui porte leur id, qui passe et qui vérifie les valeurs du critère. Les 15 critères de loyer-mer passent toujours. Je n'ai trouvé **aucun Bloquant**. Les défauts ci-dessous portent sur la fiabilité de la commande de test, sur une donnée personnelle qui traîne dans le dossier, et sur la traçabilité des preuves.

[Majeur] `npm test`, lancé tel quel, est rouge. Le test de H21 (« délai de 45 s ») échoue à coup sûr à 390 px quand les tests tournent en parallèle. — Le feu vert de la suite n'a plus de sens : un vrai défaut sur le délai de 45 s passerait inaperçu au milieu d'échecs « connus ». Le défaut est signalé depuis la tâche 4 (« à corriger avant la démo »), mais il n'a pas été corrigé, et `progress.md` écrit pourtant « H21 passé ».
  Où : `tests/e2e/proches-etats.spec.ts:128-147` (`page.clock.install()` puis `runFor(44_000)`, puis on attend encore « Calcul des trajets »)   Preuve : `npx playwright test tests/e2e/proches-etats.spec.ts -g H21 --repeat-each=5` → les 5 en `[mobile]` échouent, les 5 en `[bureau]` passent (« Received: …Trajets indisponibles depuis Nantesville (44)… ») ; avec `--project=mobile --workers=1 --repeat-each=3`, les 3 passent. Cause : l'horloge installée continue d'avancer en temps réel. Le temps réel écoulé, plus les 44 s simulées, dépasse 45 s dès que la machine est chargée (la marge n'est que de 1 s). Les 3 autres échecs du premier passage sont des délais « carte prête » de tests plus anciens (`categories.spec.ts:47`, `etats.spec.ts:59`, `carte.spec.ts:12` loyer-mer AC-2 à 390 px), et ils passent avec `--workers=2`.
  Correction : figer l'horloge (`await page.clock.pauseAt(...)` après `install`, ou `install({ time })` suivi de `pauseAt`) pour que seul `runFor` fasse avancer le temps. Autre solution : vérifier « encore en calcul » à 43 s plutôt qu'à 44 s. Et soit fixer `workers: 2` dans `playwright.config.ts`, soit écrire dans CLAUDE.md que la commande de référence est `--workers=2`.   Réf : H21 ; CLAUDE.md « Fini = effet observé… des tests verts ne suffisent pas » (encore faut-il qu'ils soient verts)

[Majeur] Une capture de Vincent qui contient une adresse personnelle (une fiche contact) se trouve dans le dossier versionné des preuves. Elle n'est ni ignorée par git ni déplacée. — Chaque tâche a ajouté `captures/` en entier à ses commits. Un prochain `git add docs/` la publierait sur GitHub avec le dépôt (projet vitrine, donc probablement public).
  Où : `docs/plans/2026-10-13-proches/captures/T5-iphone-vincent-bug-clavier.png` (`git status` : `??`, donc ni suivi ni ignoré)   Preuve : `progress.md`, « Constats hors tâche », dernière ligne : « contient une adresse personnelle (fiche contact) ; laissée hors de git, à Vincent de décider »
  Correction : la sortir du dépôt (par exemple vers `~/Documents`), ou au minimum l'ajouter à `.gitignore`, avant tout prochain commit. C'est à Vincent de décider (ce sont ses données), le relecteur n'y touche pas.   Réf : CLAUDE.md « Demander d'abord : tout ce qui touche aux données des utilisateurs (les adresses saisies) »

[Mineur] La vérification de bout en bout sur le vrai IGN a été faite sur la version `4a4b29b`. Le code a changé ensuite : le correctif clavier modifie `src/ui/Proches.tsx` (47 lignes) et `src/App.tsx`, et la simplification touche `useProches.ts`, `App.tsx` et `LigneProche.tsx`. Ces changements n'ont été revérifiés que par la suite de tests (faux service). — Le risque est faible, mais ce qui va partir en ligne n'est pas exactement la version observée sur le vrai flux.
  Où : `captures/T5-preuve-bureau.txt` ligne 1 (« dist/version.txt 4a4b29b ») ; commits `11c6bc5` (18:38), `6cc3934`, `520a04a`, `e7a549c`, `4eb2f57` (18:49-18:50)   Preuve : `git show --stat` de ces commits
  Correction : refaire les étapes 1 à 4 de la vérification de bout en bout sur la version construite à `HEAD` (bureau suffit), ou au moment de /ship sur la version en ligne, comme le demande details.md.   Réf : details.md « Vérification de bout en bout » ; CLAUDE.md « Fini »

[Mineur] La plupart des preuves sont datées un peu **avant** le commit de code de leur tâche, pas après : T1 15:04:10 contre `c6590e0` 15:04:19 ; T2a 15:16 contre `00d96df` 15:18 ; T2b 15:37 contre `45c01a2` 15:39 ; T3 16:02-16:05 contre `5701053` 16:08 ; T4 16:42 contre `aae103d` 16:44 ; correctif clavier 18:23 contre `11c6bc5` 18:38. Seule T5 est postérieure (17:46, après `4a4b29b` à 17:43). — Les commits de rapport qui suivent ne contiennent aucun code (vérifié). Le code commité est donc très probablement celui qu'on a observé. Mais pour le correctif clavier, 15 minutes séparent la preuve du commit, et rien ne prouve qu'aucune retouche n'a eu lieu entre les deux.
  Où : `stat` des fichiers de `captures/` ; `git log --format='%h %ad'`   Preuve : liste ci-dessus
  Correction : à l'avenir, prendre les preuves après le commit de code et noter dans la preuve le hash construit (comme T5 l'a fait avec `dist/version.txt`).   Réf : consigne de la relecture (preuve postérieure au dernier commit de la tâche)

[Mineur] La mesure sur le téléphone de Vincent (14,9 s, 12 zones sur 12), sur laquelle s'appuie la révision D15, n'apparaît que dans `progress.md`. Le rapport de mesure dit toujours « non mesurée (préparée) », et le modèle du téléphone, que le plan demandait, n'est noté nulle part. — La décision la plus coûteuse de la tranche (passer de 6 h à 3 h) repose sur un chiffre qu'on ne retrouve pas dans le document de mesure.
  Où : `docs/plans/2026-10-13-proches/mesure-tache-0.md:88-104` ; `progress.md` ligne « Tâche 0 »   Preuve : `grep -rln "14,9" docs` → seulement `progress.md`
  Correction : ajouter au rapport de la tâche 0 la ligne « TOTAL » rendue par le téléphone, le nombre de zones et le modèle.   Réf : plan, tâche 0 (g)

[Mineur] Le texte de AC-16 (« dans la liste » devenu « sur la carte ») a été modifié dans un commit de build (`717a495`), mêlé au passage des drapeaux `passes` à true. Pour AC-14, la même modification a eu droit à son propre commit `spec:` (`e771f5e`). L'accord de Vincent n'est attesté que par le message de commit et par `progress.md`, tous deux écrits par l'agent. — La modification est juste sur le fond : Grandeville ne passe pas avec un plafond de 2 h, elle n'est donc pas dans la liste. Mais elle touche un `when` protégé.
  Où : `git show 717a495 -- docs/specs/2026-10-13-proches/acceptance.json`   Preuve : le diff montre le changement de `when` de AC-16 à côté de 4 `"passes": true`
  Correction : que Vincent confirme ce changement de AC-16 (une ligne dans `spec.md` ou `relecture.md`).   Réf : CLAUDE.md « Jamais : modifier… given / when / then »

[Mineur] La pastille n'affiche pas le « · » entre le nom et la valeur. On lit « Parents de Léa 2 h au plus », alors que R15 et D10 écrivent « Parents de Léa · 4 h au plus ». Le séparateur n'apparaît qu'entre le temps et « au-dessus de ». — C'est un écart de texte mineur, et un lecteur d'écran lit le nom et la valeur collés l'un à l'autre.
  Où : `src/ui/Pastilles.tsx:36-37` (deux `<span>` sans séparateur)   Preuve : `captures/T5-preuve-bureau.txt` « pastilles : Parents de Léa 2 h au plus »
  Correction : ajouter « · » entre les deux, en texte ou au moins en `aria-label`, si Figma 18:145 le montre. Sinon, aligner R15 sur le design.   Réf : R15, D10

## Couverture des critères (mode spec)
| AC | Test | Statut | Note |
|---|---|---|---|
| AC-1 | `proches.spec.ts:43` | couvert | nom proposé, « Calcul des trajets depuis… », `aria-valuenow` 120, liste exacte (65), couleurs B et E nulles, adresse `/?loyer=1200&mer=60` |
| AC-2 | `proches.spec.ts:63` | couvert | 135, liste exacte 67/21, E non colorée, aucune zone de plus demandée |
| AC-3 | `proches-carte.spec.ts:34` | couvert | choisie sur la carte ; raison, 40 km, ni score ni rang |
| AC-4 | `proches.spec.ts:77` | couvert | 165, liste exacte 50/30 |
| AC-5 | `proches-carte.spec.ts:49` | couvert | ordre des deux lignes vérifié, score 30, « 2e sur 2 », Quaibleu « plus de 3 h : au-dessus de… 2 h 15 », sans score |
| AC-6 | `proches.spec.ts:92` | couvert | 56/0, paliers `score-3`/`score-1`, C, D et E nulles, message absent |
| AC-7 | `proches-etats.spec.ts:28` | couvert | message « 5 proches au maximum… », pas de champ ; après le retrait, le lien rouvre le champ |
| AC-8 | `proches-etats.spec.ts:47` | couvert | réouverture : 135, aucune demande de zone, 67/21, adresse inchangée |
| AC-9 | `proches-etats.spec.ts:66` | couvert | mémoire vidée, état vide, 72/49/32 |
| AC-10 | `proches-etats.spec.ts:88` | couvert | message exact, « Réessayer », liste 72/49/32 |
| AC-11 | `proches-etats.spec.ts:99` | couvert | message exact, « Ajouter » inactif, 3 communes |
| AC-14 | `proches-carte.spec.ts:77` | couvert | adresse, repère `data-lng=-2`/`data-lat=3`, raison, aucune requête ne contient le nom (URL et corps) |
| AC-16 | `proches-carte.spec.ts:107` | couvert | « 2 h au plus », « 2 h 15 · au-dessus de 2 h », pas de bouton, clic sans effet, aucune pastille à 390 px |
| loyer-mer AC-1 à AC-15 | `carte`, `liste`, `fiche`, `adresse`, `etats.spec.ts` | couvert | tous verts avec `--workers=2` ; AC-2 à 390 px a échoué une fois avec 5 workers (« carte prête » pas atteinte en 5 s, sous charge) |

Les drapeaux `passes: true` des 13 critères correspondent chacun à un vrai test qui passe. Les 3 critères reportés (AC-12, AC-13, AC-15) restent à `false`, ce qui est cohérent avec D14.

Règles et décisions : R9 (5 au plus, nom de 30 caractères au plus, nom vide qui reprend la commune, doublon par libellé), R10 (fin de tranche, 0 = « plus de 3 h »), R11 (note `100 × (1 − t/plafond)`, seuls les proches prêts comptent, `src/domain/score.ts:104-107`), R12 (`localStorage`, une clé par proche, empreinte des codes INSEE, proche pas prêt rendu indisponible, message en cas de refus), R13 (une zone qui échoue ou une réponse 429 rend le proche indisponible, la panne de recherche affiche son message), R15 (sauf le « · », voir plus haut), H19 à H22, H28 et H30 : **implémentés**. D6 : départ depuis la mairie, retrouvée par code INSEE, pour une commune choisie seule (`temps.ts:70-75`). D7 : rien dans l'adresse de la page. D12 : pas de phrase sur l'IGN. D13 : lien « + Ajouter un proche ». D14 : rien sur la mer en minutes dans le code. D15 : `PROCHE.max = 180`, 12 zones. Tout cela est **respecté**. Rien n'est livré **en trop** : aucune dépendance ajoutée (`package.json` et lockfile inchangés), et les fichiers hors des listes de tâches sont tous expliqués dans `progress.md`.

## Ce qui est bien fait
- La jointure se fait toujours par code INSEE : `citycode` de l'IGN, arrondissements de Paris, Lyon et Marseille ramenés à la ville, Corse en 2A/2B, outre-mer écarté (`src/proches/ign.ts:31-55`). Les temps sont gardés avec une empreinte de la liste des codes, et un proche dont l'empreinte ne correspond plus revient indisponible au lieu d'afficher des temps faux.
- Les données personnelles sont tenues : seul le point de départ part vers l'IGN, le nom n'est jamais envoyé. AC-14 le vérifie sur toutes les requêtes, corps compris. La preuve sur le vrai IGN (`T5-bureau-requetes-etape1.txt`) montre 72 requêtes, dont 13 vers l'IGN, aucune ne contient le nom, et aucune autre destination extérieure. Le code ne contient que trois `fetch` (données du site, fond IGN, recherche et zones IGN).
- Le faux service IGN (`tests/e2e/lib/ign.ts`) reprend le format réel relevé en tâche 0, y compris la vraie page de refus 429. Les tests passent donc par le vrai code de lecture des zones et du classement.
- La vérification de bout en bout de details.md a bien été faite sur le vrai IGN, en bureau et à 390 px, avec un profil neuf : La Rochelle passe en 2 h 15, Bordeaux est à « plus de 3 h », la réouverture se fait sans calcul et l'effacement fonctionne. Toutes ces preuves existent dans `captures/`.
- Les écarts au plan sont écrits au fur et à mesure dans `progress.md` (« Décisions prises à la place de Vincent », « hors liste »), avec le coût de chacun.

## Non jugé
- La version en ligne : details.md demande la vérification « sur la version en ligne », et rien n'est encore déployé. C'est à faire à /ship.
- Le défaut du clavier sur iPhone : connu, et reporté par Vincent. Le correctif `11c6bc5` est conservé, alors qu'il n'a pas réglé le problème sur l'appareil réel. C'est un choix de Vincent, que je signale seulement parce que ce code n'a pas d'effet prouvé sur le vrai flux.
- L'accord réel de Vincent sur les révisions D15 et D16 et sur la modification de AC-14 et AC-16 : je ne peux le vérifier que par ce qu'en disent les documents.
- L'alignement par position entre `reperes.json` et `communes.json` : il date de loyer-mer et la jointure par code est faite au moment de construire les données (`scripts/data/tuiles.py:124-132`). L'empreinte protège les temps, mais pas cet alignement.
- L'accessibilité et le rendu fin de l'interface (relecture qa-tester), la sécurité (mode `securite`).
