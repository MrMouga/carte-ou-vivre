# Relecture du plan — mairies
2026-10-18 · relecteur neuf · plan relu : `plan.md` (brouillon) contre `docs/specs/2026-10-18-mairies/` (spec.md, details.md, acceptance.json), le design (README, decisions), les leçons, et le code réel (`src/App.tsx`, `src/domain/score.ts`, `url.ts`, `format.ts`, `src/ui/Settings.tsx`, `Fiche.tsx`, `CadreDeVie.tsx`, `tests/e2e/lib/carte.ts`, tests protégés cités).

En bref : chaque critère a sa tâche, une seule. Les preuves se voient sur le vrai flux. La tâche 0 mesure bien le risque de la spec. Il reste trois défauts qui feraient trébucher un constructeur seul :
- le décalage du panneau arrive en tâche 2, mais sa correction est prévue en tâche 4 ;
- des tests protégés seront modifiés en tâches 1 et 3 sans que le plan le dise ;
- trois choix sont laissés à deviner : la forme des réglages, le fichier des nuances servi aux tests, et AC-11 qui dépend du texte réel de l'annexe.

## Critères sans tâche ou dans deux tâches
Aucun. AC-11 et AC-12 → tâche 0 ; AC-1, 2, 3, 4, 6, 7, 8 → tâche 2 ; AC-5 et AC-10 → tâche 3 ; AC-9 → tâche 4. Aucun « when » n'utilise un bouton construit plus tard (leçon du 2026-10-16) :
- les pastilles et le résumé sont construits en tâche 2 ;
- les raisons de la fiche le sont en tâche 1 ;
- choisir une commune dans la liste ou sur la carte existe déjà ;
- AC-5 (tâche 3) et AC-9 (tâche 4) n'utilisent rien de plus tardif.

## Tâches sans preuve attendue
1. **Mineur** — Tâche 2, sa preuve ne regarde pas les vraies données. La preuve se limite à des critères verts sur la fixture et à des captures comparées à F, sans dire sur quelles données. Personne ne voit les pastilles filtrer la vraie carte avant la tâche 4. La réaction n'est jamais mesurée avec le vrai filtre : H120 est mesurée en tâche 0 avec « Ville dense » comme substitut.
   - Où : tâche 2, « Preuve attendue ».
   - Proposition : ajouter, sur `npx vite preview` avec les vraies données, « Sans limite » + « Gauche » cochée. Paris, Lyon et Marseille en couleur neutre, Bordeaux et Nice non colorées, avec une capture. Mesurer aussi le temps de réaction en cochant « Centre » puis « Sans étiquette », par la même méthode que H90, et le comparer à la mesure de la tâche 0.
2. **Mineur** — Tâche 0, une clause d'AC-12 ne peut pas être prouvée en lisant le fichier servi. AC-12 dit : « 74 sont sans résultat, aucune à cause d'un code non relié ». `mairies.json` ne dit pas pourquoi une commune est sans résultat. Or le plan prévoit d'écrire le test d'AC-12 comme une simple lecture de `mairies.json` et `nuances.json`. Le test ne pourra pas relancer `mairies.py`, car `data-raw/` n'est pas versionné.
   - Où : tâche 0, sorties 4 et 5.
   - Proposition : dire comment cette clause est prouvée. Par exemple : le contrôle de `mairies.py` compte les communes de la carte absentes des deux fichiers, et ce compte (74) est noté dans `mesure-tache-0.md` ; le test vérifie seulement les 74 `null`. Ou bien `mairies.py` écrit ce compte quelque part où le test peut le lire.

## Décisions cachées
1. **Majeur** — La forme du nouveau réglage dans `Reglages` n'est pas dite, et un tests protégé casse si on la devine mal. Ces tests comparent l'objet entier :
   - `src/domain/url.test.ts` l. 6, 32 et 77 : `expect(lireAdresse(…)).toEqual({ loyer, mer, tailles: [] })` ;
   - `src/domain/score.test.ts` l. 31 : `expect(REGLAGES_DEPART).toEqual({ loyer: 1200, mer: null, tailles: [] })`.

   Un constructeur qui ajoute `mairies: []` au départ ou à la sortie de `lireAdresse` casse ces quatre lignes. Les types TypeScript des tests cassent aussi si le champ est obligatoire. Cadre-de-vie avait réglé ce point pour `types` (champ facultatif, présent seulement s'il est non vide, `score.ts` l. 58 et `url.ts` l. 79).
   - Où : tâche 1, « Sorties ».
   - Proposition : écrire « champ facultatif `mairies?: Bord[]`, absent si aucune pastille n'est cochée, comme `types` ; `REGLAGES_DEPART` ne change pas ».
2. **Majeur** — Le fichier des nuances servi aux tests n'est pas décrit. La fixture de la tranche donne `mairie_bloc` et `mairie_etiquette`, mais aucun code de nuance. Or `mairies.json` porte un code (`nuance`) et l'étiquette vient de `nuances.json`. Le plan dit seulement que `carte.ts` « sert `mairies.json` depuis la fixture ». Il ne dit rien de `nuances.json`. Si `carte.ts` ne l'intercepte pas, la page lit le vrai `public/data/nuances.json` sur le serveur de test. Les tests e2e dépendent alors de l'annexe réelle : « Divers », « Union de la gauche » écrits autrement, et AC-5 échoue sans défaut.
   - Où : « À respecter », Fixture ; tâche 1, `tests/e2e/lib/carte.ts`.
   - Proposition : écrire que `carte.ts` intercepte aussi `**/data/nuances.json` et le fabrique à partir de la fixture. Une nuance inventée par étiquette distincte de la fixture, de code au choix (par exemple l'étiquette elle-même), avec son bloc. Terrebasse est servie avec `nuance: ""` et sa liste, Rhinval avec `null, null`.
3. **Majeur** — Condition d'arrêt de la tâche 0 et AC-11 se contredisent. AC-11 lance le vrai calcul avec « les blocs de la circulaire ». Il attend « Divers droite » et « Union de la gauche », lus dans la vraie table, et les codes LDVD, LDVG, LUG, LRN. La condition d'arrêt dit : si une étiquette de la fixture est « écrite autrement dans l'annexe — à signaler, la fixture reste inventée ». Mais dans ce cas, ou si l'un de ces quatre codes n'existe pas dans la grille 2026, AC-11 ne peut pas passer. Le contrôle « toute nuance non vide est dans la table » arrête même le script.
   - Où : tâche 0, « Conditions d'arrêt ».
   - Proposition : pour les quatre codes et les deux étiquettes qu'AC-11 cite, écrire « arrêt, le critère revient à Vincent ». Garder « à signaler » seulement pour les étiquettes que lit la fixture e2e, servie par `carte.ts` (point 2).
4. **Mineur** — Un fichier servi annoncé, deux créés. « Ce que /build fera seul » annonce « un fichier servi de plus, `public/data/mairies.json` » et une table versionnée. La tâche 0 crée aussi `public/data/nuances.json`, servi au site.
   - Proposition : nommer les deux fichiers servis dans le changement du modèle de données accepté avec le plan.
5. **Mineur** — Le seuil de 500 ms pour le chargement a trois défauts :
   - il apparaît dans « Risques » mais pas dans les conditions d'arrêt de la tâche 0 ;
   - mesuré sur `vite preview` en local, il ne veut rien dire, puisqu'il n'y a pas de réseau ;
   - le repli proposé (« charger les noms de liste à part, à la première fiche ouverte ») contredit H122 (« même chargement, même erreur »).
   - Proposition : mettre le seuil dans les conditions d'arrêt. Le mesurer avec un réseau ralenti (profil « Fast 4G » de Chromium), ou à côté du chargement d'`achat.json`. Dire que le repli serait une révision de H122 par Vincent.
6. **Mineur** — La population du contrôle D8 (« sans étiquette ⇒ moins de 3 500 habitants ») n'est pas dite. Il faut préciser laquelle : `population` de `communes.json` (populations légales lues le 2026-10-12, celle de la mesure de la spec) ou celle du ministère. Sinon une commune proche du seuil arrête le script sans défaut.
   - Proposition : « population de `communes.json` ». Ajouter que la quinzaine de communes de moins de 3 500 habitants *avec* étiquette (chefs-lieux d'arrondissement, leçon du 2026-10-18) est attendue et ne fait pas échouer le contrôle.
7. **Mineur** — On ne sait pas où vivent les empreintes de référence. Le plan, dans « Risques », dit que « `mairies.py` s'arrête si elles changent ». Mais la sortie 4 (contrôles) ne contient pas ce contrôle, et la sortie 7 (CLAUDE.md) ne cite pas les sha256. Pour la DVF, ils sont écrits dans CLAUDE.md.
   - Proposition : l'ajouter à la sortie 4 et noter les deux sha256 et leur Last-Modified dans CLAUDE.md → Données.
8. **Mineur** — `--extrait` et le vrai fichier n'ont pas le même format. L'extrait de la fixture est du JSON imbriqué (`listes[]` par commune). Les fichiers du ministère sont un tableau par commune. AC-11 ne teste donc pas la lecture des vrais fichiers.
   - Proposition : écrire qu'une seule fonction choisit la mairie, pour les deux entrées, et que seule la lecture diffère. La lecture du vrai fichier est couverte par les comptes d'AC-12. Préciser aussi la forme de la sortie standard que lit `mairies.test.ts`.
9. **Mineur** — Les « 5 communes » : deux règles qui se contredisent. Le plan dit qu'une commune « absente de la fixture est sans résultat » pour les jeux « 5 communes » et « métropole ». Mais les « 5 communes » ont les mêmes codes 99001 à 99005 que la fixture de cette tranche. Cadre-de-vie avait choisi de leur donner les valeurs par code.
   - Proposition : trancher. Par exemple : « par code INSEE, donc A à E ont leur mairie ; le jeu métropole est sans résultat », comme `cadreParCode` dans `carte.ts` l. 36-40.

## Le risque de la spec
La tâche 0 mesure le risque. Les blocs sont lus dans l'annexe, jamais devinés (sortie 2, H117). Vincent lit la table et le compte par bloc. Les 10 villes figurent dans `mesure-tache-0.md` et sont relues sur la page en tâche 4.
1. **Mineur** — Rien ne dit ce qui se passe si Vincent juge une ville fausse. On a « Arrêt jusqu'à sa réponse », sans suite écrite. Cadre-de-vie avait une règle (« 2 villes jugées fausses ou plus → arrêt, retour sur la décision par /spec »).
   - Proposition : écrire la suite. Une ville fausse → chercher si la cause est R39 (sièges, tour) ou le rattachement de l'annexe. Dans les deux cas, retour à Vincent, sans corriger un bloc à la main (H117).
2. **Mineur** — Leçon du 2026-10-14 (« test du risque sur les extrêmes ») : sur r/france, on verra d'abord les 10 premières de la liste une fois un bloc coché, pas seulement les grandes villes.
   - Proposition : ajouter à `mesure-tache-0.md`, pour chaque bloc, les 10 premières communes au départ (`/?loyer=1200&mairie=<bloc>`), soumises au même jugement de Vincent.

## Périmètre
Le compte de fichiers tient (tâche 0 : 8 ; tâche 1 : 8 ; les autres, moins). Cinq tâches. Rien hors de la spec ; « Reporté » reprend « Pas maintenant ».
1. **Majeur** — Les tâches 1 et 3 modifient des tests protégés sans le dire. La tâche 1 touche `src/domain/score.test.ts`, `url.test.ts`, `format.test.ts` et `tests/e2e/lib/carte.ts`. La tâche 3 touche `format.test.ts`. Ce sont des tests protégés (`src/**/*.test.ts`, `tests/e2e/`). Or « Demandera » ne cite le garde-fou qu'en tâche 4. Un constructeur seul la nuit s'arrêtera à la première demande, ou croira sortir du cadre.
   - Proposition : mettre les nouveaux tests unitaires dans des fichiers neufs (par exemple `src/domain/mairies.test.ts`), sans toucher aux fichiers protégés. Ou alors ajouter à « Demandera » les tâches 1 et 3, en nommant les fichiers et en écrivant « ajout de tests seulement, aucune ligne existante changée ». Pour `carte.ts`, nommer les ajouts : deux nouvelles interceptions, aucune ligne existante changée.

## Ordre
1. **Majeur** — Le décalage du panneau arrive en tâche 2, mais ses tests sont traités en tâche 4. `VieLocale` s'insère dans `Settings` dès la tâche 2. `Settings` sert aussi l'onglet « Critères » de la feuille mobile (`App.tsx` l. 199-215 et 276). Le décalage du focus et du défilement arrive donc dès la tâche 2, et les tests à 390 px tournent à chaque tâche. Les tests nommés (`proches-mobile.spec.ts` l. 80 et 95, `telephone-feuille.spec.ts` l. 187 et 527-541, `proches-etats.spec.ts` l. 235) ne sont pourtant relus qu'en tâche 4. Cela contredit « toute la suite passe à chaque tâche ». Le constructeur de la tâche 2 ne verra pas les consignes de la tâche 4 et s'arrêtera sur un test rouge. details.md disait même « à revérifier en tâche 0 ».
   - Proposition : déplacer en tâche 2 la relecture et l'ajustement de ces tests, avec la règle « tout autre test qui casse : nommé, sinon arrêt ». La tâche 4 garde AC-9, H48 et la vérification de bout en bout.
2. **Mineur** — La tâche 1 n'a aucun critère e2e, alors qu'AC-6 n'a pas besoin des pastilles. Son « when » ouvre seulement `/?loyer=aucun&mairie=extreme-droite` et son « then » ne lit pas les pastilles. Les autres lisent leur état (AC-7) ou les cochent. Le placer en tâche 1 donnerait à ce squelette « par l'adresse » une preuve automatique sur la fixture : couleurs, texte sans plafond, raison de Portmer.
   - Proposition : AC-6 en tâche 1, avec `tests/e2e/mairies.spec.ts` créé là. Il faudra alors compter 9 fichiers, ou sortir un test unitaire vers un fichier neuf.
