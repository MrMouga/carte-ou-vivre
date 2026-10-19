# Relecture spec — mairies
Suite de tests (relancée par le relecteur, 2026-10-19 09:38-09:54, charge machine 7 à 9 : une autre relecture tournait sur le port 4190) : Vitest `Test Files 20 passed (20) · Tests 312 passed (312)` ; Playwright `7 failed · 38 skipped · 1 did not run · 371 passed (15.7m)`. Les 7 rouges relancés seuls (`--repeat-each=3 --workers=1`) : 6 verts 3 fois sur 3 ; AC-7 de cadre-de-vie `[bureau]` vert 3 fois sur 6 (voir le constat Majeur). Le test qui « did not run » (`[limites] chrome.spec.ts:13`, qui dépend des projets bureau et mobile) passe lancé seul (`--project=limites --no-deps`). `npm run typecheck` vert ; `node scripts/check-tokens.mjs` : « aucune valeur arbitraire ».
Périmètre : `fab197e..38f3cef` (20 commits, tâches 0 à 4 et simplification).

Verdict : la tranche livre ce que la spec et le plan décident. Aucun Bloquant. Les 12 critères ont chacun un test qui porte leur id, vérifie les valeurs concrètes et passe. Rien n'est en trop : aucune couleur politique sur la carte, aucune tête de liste. J'ai recalculé moi-même, à partir des fichiers bruts du ministère, la mairie des 10 villes de la spec : le résultat est identique au fichier servi.

## Constats

[Majeur] Le test d'AC-7 de cadre-de-vie (une tranche de la liste « Ne change pas ») est rouge une fois sur deux, même lancé seul. On ne peut donc pas prouver qu'AC-7 « ne change pas ». Le défaut n'est pas dans le site : c'est le test qui clique trop tôt sur la carte.
  Où : `tests/e2e/cadre-de-vie.spec.ts:260` (aide `ficheDeCarte`, l. 31-35). Même cause dans la course complète pour AC-11 de cadre-de-vie `[mobile]` (`:282`), vert 3 fois sur 3 seul.
  Preuve : course complète, rouge en `[bureau]` et en `[mobile]`. Seul : 1 rouge sur 3 dans la relance groupée, puis 1 rouge sur 3 dans une relance à part, soit 3 verts sur 6. À chaque échec, la fiche reçue est celle de Terrebasse, juste (avec la nouvelle ligne « Mairie : sans étiquette… »), à la place de Rhinval. Le test clique sur Rhinval à l'endroit où elle était à l'ouverture. Or choisir Terrebasse vient de zoomer la carte sur elle (D14). Le résultat dépend donc de qui va le plus vite, le clic ou l'animation du zoom. Ce test était déjà rouge au départ de la tranche (progress.md, ligne « Suite au départ »), et la tranche ne touche ni la carte ni le zoom. Je ne la tiens donc pas pour une régression. Mais la règle « vert 3 fois sur 3 seul » ne tient plus sous charge.
  Correction (hors tranche, un test protégé : décision de Vincent) : rouvrir l'adresse avant le second clic, comme le font `rouvrir()` dans `tests/e2e/mairies.spec.ts:69` et AC-6 de mairies. Ou bien attendre la fin du zoom avant de cliquer. Ni la valeur attendue ni le `given / when / then` ne changent.
  Réf : plan, « À respecter » (Ne change pas : cadre-de-vie AC-1 à AC-12) ; CLAUDE.md, « Des tests verts ne suffisent pas ».

[Mineur] CLAUDE.md → Données parle encore au futur de la mention des mairies : « (H118 de mairies, Licence Ouverte ; à poser dans `Mentions.tsx` en tâche 3 de mairies) ». Elle est posée depuis la tâche 3 (`src/ui/Mentions.tsx:32-33`). Un agent qui lit CLAUDE.md pourrait croire qu'elle manque.
  Où : `CLAUDE.md`, puce « Mentions obligatoires », fin.   Preuve : `git diff fab197e..38f3cef -- CLAUDE.md`.
  Correction : écrire « posée dans `Mentions.tsx` en tâche 3 de mairies », comme pour cadre-de-vie.   Réf : plan, tâche 0, sortie 7.

[Mineur] progress.md donne pour la tâche 4 la fenêtre « 2026-10-18 21:40 – 2026-10-19 00:30 ». Or les fichiers de preuve datent au plus tard de 23:09, le commit de 23:10, et le rapport T4 parle de deux passages, 22:26-22:33 puis 22:56-23:03. L'heure de fin est fausse. Aucune preuve ne manque.
  Où : `docs/plans/2026-10-18-mairies/progress.md`, ligne « Tâche 4 ».   Preuve : `ls -la captures/` ; `git log --date=iso` ; `taches/T4.md` l. 25 et 60-62.
  Correction : « 21:40 – 23:10 ».   Réf : relecture des preuves (point 4 du brief).

[Mineur] Le crochet qui protège les tests n'a pas demandé l'accord de Vincent pour `tests/e2e/lib/carte.ts`, alors que le plan dit « il redemande pour chaque fichier ». Le contenu du changement est conforme : 16 lignes ajoutées, aucune ligne existante changée. C'est le garde-fou qui n'a pas joué, pas le code.
  Où : commit `4645405`.   Preuve : `git diff fab197e..38f3cef -- tests/e2e/lib/carte.ts` (que des `+`). L'orchestrateur le note aussi dans progress.md (vérification T1).
  Correction : vérifier en /retro le motif de fichiers protégés du crochet de studio.   Réf : plan, « Garde-fou des tests protégés ».

## Couverture des critères (mode spec)
| AC | Test | Statut | Note |
|---|---|---|---|
| AC-1 | `tests/e2e/mairies.spec.ts:73` « AC-1 ouverture de / … » | couvert, vert (bureau, mobile) | adresse, ordre des catégories (et H111 : avant « Tes proches »), 7 libellés dans l'ordre, `aria-pressed=false`, les 5 lignes et leur score, résumé replié « Peu importe », pastilles cachées |
| AC-2 | `mairies.spec.ts:97` | couvert, vert (bureau, mobile) | adresses exactes, ligne « 1 · Portmer (17) · 46 · 650 € · moins d'1 km », couleurs B, D, E, F lues dans les pixels, raisons de Grandeville et Terrebasse, « Centre » : 6 communes non colorées et texte vide exact |
| AC-3 | `mairies.spec.ts:125` | couvert, vert (bureau, mobile) | les deux listes, l'adresse, raisons de Rhinval et Portmer sous « Ne passe pas tes critères » |
| AC-4 | `mairies.spec.ts:148` | couvert, vert (bureau, mobile) | aucune pastille cochée, `/?loyer=1200`, Rhinval 52 |
| AC-5 | `mairies.spec.ts:225` | couvert, vert (bureau, mobile) | la ligne qui suit la montagne est comparée mot pour mot pour les 6 communes ; une seule ligne « Mairie : » (aucune raison) |
| AC-6 | `mairies.spec.ts:27` | couvert, vert (bureau, mobile) | Quaibleu `area-unranked` à l'opacité « sans plafond », les 5 autres au fond, texte de la liste, pas de « / 100 », raison de Portmer |
| AC-7 | `mairies.spec.ts:159` | couvert, vert (bureau, mobile) | pastilles cochées, adresse réécrite exacte, 2 communes, raison du type avant celle de la mairie |
| AC-8 | `mairies.spec.ts:174` | couvert, vert (bureau, mobile) | « 2 choix », pastilles cachées, puis toujours cochées, 2 communes |
| AC-9 | `mairies.spec.ts:286` (projet mobile, au toucher) | couvert, vert (mobile) ; sauté en bureau, voulu | chaque pastille amenée à l'écran, entière, cochée puis décochée d'un toucher ; « Droite » → « Les 10 premières » : Portmer 46, `mairie=droite` |
| AC-10 | `mairies.spec.ts:255` | couvert, vert (bureau, mobile) | texte de H118 exact, plus 8 mentions précédentes |
| AC-11 | `scripts/data/mairies.test.ts:15` | couvert, vert | lance vraiment `mairies.py --extrait` sur l'extrait de la fixture ; compare tout l'objet (99102 : la liste du second tour, celle qui menait en voix au premier est écartée) |
| AC-12 | `scripts/data/mairies.test.ts:49` et `:57` | couvert, vert | villes et listes exactes ; comptes 34 672 / 74 / 3 164 / 31 508 ; « aucune à cause d'un code non relié » prouvé par le contrôle de `mairies.py` (`captures/T0-controles-mairies.txt` : 0 code non relié, 0 commune sans élu), comme le plan le prévoit |

Les `passes: true` d'`acceptance.json` (seul changement dans ce fichier : `false` → `true`, aux commits « vérifiée ») correspondent tous à un test réel et vert.

### « Ne change pas » (plan et details.md)
Course complète : tous les tests portant les AC listés sont verts, sauf ceux-ci, tous relancés seuls :
| Test | Course complète | Seul, 3 fois | Lecture |
|---|---|---|---|
| cadre-de-vie AC-7 `:260` `[bureau]` | rouge | 1 rouge sur 3, puis 1 rouge sur 3 | course entre le clic et le zoom (constat Majeur) ; déjà rouge au départ de la tranche |
| cadre-de-vie AC-7 `:260` `[mobile]` | rouge | 3 verts | même cause |
| cadre-de-vie AC-11 `:282` `[mobile]` | rouge | 3 verts | même cause (fiche de Grandeville toujours ouverte après le clic sur Quaibleu) |
| proches-fiables AC-8 (a) `:503`, AC-8 (c) `:529` `[bureau]` | rouges | 3 verts chacun | page pas prête en 5 s (`data-carte-prete`), à cause de la charge |
| interface-telephone AC-11, AC-12 (`adresse.spec.ts:18`, `:27`) `[mobile]` | rouges | 3 verts chacun | même délai d'ouverture, à cause de la charge |
Les instables annoncés (proches-fiables `:669` et `:716`) sont verts dans ma course.

## Règles, décisions et hypothèses
- **R38** : `score.ts:227-231`. Le filtre ne joue que si au moins une pastille est cochée. Une commune sans résultat est écartée (D5). Le filtre ne note pas : le test unitaire « les 7 cochées donnent les scores de départ » le vérifie. Les trois raisons sont exactes (`format.ts`, `raisonTexte`, cas `bord`). L'ordre de H113 est testé (`src/domain/mairies.test.ts`, « H113 »). Respectée.
- **R39** : `scripts/data/mairies.py:62-76`, une seule fonction pour les vrais fichiers et pour l'extrait. Elle prend le second tour s'il existe, garde la liste qui a le plus de sièges, au moins un siège, puis départage par les voix (H115 : les 4 égalités sont les communes nommées dans la spec). Paris, Lyon et Marseille prennent la ligne de toute la ville. **Recalcul indépendant** : un script à moi, qui lit les colonnes du fichier brut par leur nom, retrouve pour les 10 villes de la spec la même nuance et la même liste que `public/data/mairies.json`. Il confirme aussi les comptes par bloc (droite 1 212, gauche 753, centre 571, divers 561, extrême droite 60, extrême gauche 7, sans étiquette 31 508, sans résultat 74) et le même ordre de lignes que `communes.json`. Respectée.
- **R40** : `format.ts`, `mairieFiche`, affichée sous la montagne (`Fiche.tsx:82-83`). Elle est toujours là, sans mise en avant, et le test H112 compare son style à celui de la ligne de la montagne. Pas de parenthèse quand l'étiquette s'écrit comme le bloc. « 3 500 » s'écrit avec des espaces insécables. Respectée.
- **R41** : `url.ts`, `mairie` vient après `env` et avant `bien`, `unite` et `surface` ; les noms inconnus sont ignorés, l'ordre de R38 est rétabli, sans doublon. `lireAdresse` ne renvoie pas le champ quand l'adresse n'a pas `mairie`, et décocher la dernière pastille retire le champ (`VieLocale.tsx`, `basculer`). `REGLAGES_DEPART` est inchangé. Respectée.
- **R42** : « Vie locale » se replie comme les autres catégories (`Categorie`). Elle est rendue par `Settings.tsx`, donc présente aussi dans l'onglet « Critères » au téléphone, après « Cadre de vie » (AC-9). Respectée.
- **R43 / H118** : `Mentions.tsx:32-33`, texte exact (le JSX remplace le retour à la ligne par une espace ; AC-10 le prouve). CLAUDE.md → Données contient la source, les deux fichiers avec leur Last-Modified et leur sha256 (les mêmes que dans `mairies.py:37-42` et dans la sortie des contrôles), la règle, la table des 25 nuances par bloc et la mention. Respectée, à la phrase au futur près (Mineur).
- **D1** : `grep` sur `src/map` : aucune donnée de mairie n'y entre ; la légende ne change pas. **D2, D8** : 6 blocs et « Sans étiquette » ; la phrase du design F est reliée à la pastille par `aria-describedby` (testée). **D3, D5, D6, D7** : respectées. **D4** : voir R39.
- **H108-H111, H113, H114, H117, H119, H121, H122** : respectées. Les mairies se chargent dans le même `Promise.all` que les communes, donc avec la même erreur, et les pastilles sont désactivées pendant le chargement (test « H122 »). La jointure se fait par code INSEE, jamais par position (`joindreBords`, avec un test « lignes dans le désordre »).
- **H116** : les empreintes sont vérifiées par `mairies.py` à chaque lancement.
- **H120** : réaction mesurée à ≈ 130 ms pour décolorer et ≈ 215 ms pour recolorer en tâche 0, puis ≈ 148 / 233 ms en tâche 2. Acceptée selon `taches/T0.md` (« Réponse de Vincent »).
- **Mot « mairie »** : les nouvelles données s'appellent `bord`, `nuance` et `liste` (`score.ts:33-37`). Le champ de réglages `mairies` et le paramètre `mairie` sont ceux que le plan nomme. `reperes.json` et `useProches.mairie` ne sont pas touchés.
- **En trop** : rien. Aucun paquet nouveau. Deux fichiers servis et une table versionnée, tous prévus par le plan.

## Détours (`git log fab197e..38f3cef`)
- Aucun revert. Aucune chaîne `test && commit` dans les messages. Chaque commit de fonction ne contient qu'une tâche.
- Tests : `git diff fab197e..38f3cef --stat -- tests/` ne touche que `tests/e2e/lib/carte.ts` (ajouts seulement, conforme au plan) et `tests/e2e/mairies.spec.ts` (nouveau). Aucun des trois tests autorisés en tâche 2 n'a été modifié, comme le dit le rapport T2.
- Fichier hors liste : `src/domain/mairies.test.ts` est modifié en tâche 2 (commit `ce3b487`, tests du résumé H110), alors que la liste de la tâche 2 ne le cite pas. C'est le fichier de tests de la tranche ; sans conséquence.
- Simplification (`126835b`, `b15d9be`) : j'ai relu les deux diffs. Ce sont des aides de test factorisées, avec les mêmes sélecteurs et les mêmes assertions. Aucun critère n'est affaibli.
- `acceptance.json` : seuls les champs `passes` changent. `docs/specs/INDEX.md` : régénéré par studio.
- Preuves de progress.md : toutes présentes, toutes datées dans la fenêtre de leur tâche (T0 18:40-19:03 ; T1 19:29-19:41 avant le commit de 19:42 ; T2 20:28-20:38 ; T3 21:02-21:14 ; T4 22:26-23:09 avant le commit de 23:10). Seule l'heure de fin écrite pour T4 est fausse (Mineur).

## Ce qui est bien fait
- Les tests d'acceptation vérifient les valeurs exactes de chaque critère : adresses complètes, lignes de liste mot pour mot, couleurs lues dans les pixels. AC-11 lance le vrai script, pas une copie de sa logique.
- `mairies.py` s'arrête de lui-même si quelque chose a changé : empreintes, colonnes, codes non reliés, nuance hors de la table, règle D8, comptes d'AC-12. Une égalité de sièges et de voix l'arrête aussi au lieu de deviner.
- La jointure se fait par code INSEE partout, y compris dans la fixture e2e. Une nuance inconnue met la page en erreur plutôt que d'inventer un bloc (H117).
- Les tests de mairies contournent proprement la course clic-zoom (`rouvrir`), le défaut même qui fait vaciller AC-7 de cadre-de-vie.

## Non jugé
- **La version en ligne** : la vérification de bout en bout de details.md est écrite « sur la version en ligne », mais la tranche n'est pas déployée. Elle a été faite en local sur les vraies données (`captures/T4-bout-en-bout-sortie.txt`, 36 OK). À refaire après /ship.
- **Les réponses de Vincent** (blocs justes, H120 acceptée, un seul chargement) : elles ne sont notées que dans `taches/T0.md`, écrit par l'agent. Je ne peux pas les vérifier.
- **La lecture du PDF de la circulaire** (pages scannées) : je n'ai pas relu l'annexe. La table est cohérente avec D2 (LFI en extrême gauche, LUDR en extrême droite) et avec les 10 villes.
- **Les captures** n'ont pas été regardées une par une. L'accessibilité au lecteur d'écran et le rendu visuel relèvent de qa-tester (`qa.md`, en cours).
- **Un écart signalé** : l'étiquette réelle s'écrit « Rassemblement National » (N majuscule, comme dans l'annexe), alors que la fixture e2e écrit « Rassemblement national ». Le plan le classe « à signaler seulement » ; la fiche réelle affichera la majuscule.
