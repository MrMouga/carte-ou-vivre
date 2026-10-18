# Plan — mairies
2026-10-18 · validé · révisé après [review-plan.md](review-plan.md) · Spec : [spec.md](../../specs/2026-10-18-mairies/spec.md) (D1–D8) · Détails : [details.md](../../specs/2026-10-18-mairies/details.md) (R38–R43, H108–H122) · Critères : [acceptance.json](../../specs/2026-10-18-mairies/acceptance.json) (AC-1 à AC-12) · Design : [README](../../design/mairies/README.md) (prototype F, pas de Figma) · Système : [contrat](../../design/system/README.md)
(La stack et les commandes vivent dans `CLAUDE.md`, pas ici. Le site existe : six tranches construites et en ligne.)

## Ce que /build fera seul, et ce qu'il demandera
Seul : tout ce qui est décrit ici, y compris le changement du modèle de données, accepté en validant ce plan : **deux fichiers servis de plus**, `public/data/mairies.json` (une ligne par commune : code INSEE, nuance, nom de la liste) et `public/data/nuances.json` (code de nuance → étiquette en clair, bloc), et une table versionnée `scripts/data/nuances-2026.csv` ; un réglage facultatif de plus, `mairies`, dans les réglages et l'adresse.
Demandera :
- **Avant la tâche 0** : Vincent dépose dans `data-raw/` le PDF de la circulaire du 2 février 2026 « relative à l'attribution des nuances aux candidats aux élections municipales… » (Légifrance, circulaire n° 45645) : Légifrance refuse le téléchargement automatique (essayé deux fois le 2026-10-18). Sans lui, arrêt.
- **Tâche 0** : ~10 min de Vincent pour lire la table des nuances (code → étiquette → bloc), le compte de mairies par bloc, les 10 villes et les 10 premières communes de chaque bloc. Arrêt jusqu'à sa réponse.
- **Tâche 0** : si la réaction mesurée dépasse 100 ms (H120) ou le chargement ajouté dépasse le seuil (condition d'arrêt), Vincent accepte ou non.
- **Garde-fou des tests protégés** — il redemande pour chaque fichier ; seules ces modifications sont autorisées :
  - **tâche 1** : `tests/e2e/lib/carte.ts` gagne deux interceptions (`**/data/mairies.json`, `**/data/nuances.json`) et la fonction qui les fabrique depuis la fixture ; **aucune ligne existante changée** ;
  - **tâche 2** : `tests/e2e/proches-mobile.spec.ts` l. 80 et 95, `tests/e2e/telephone-feuille.spec.ts` l. 187 et 527-541, `tests/e2e/proches-etats.spec.ts` l. 235 — le focus ou le défilement de l'onglet « Critères » qui se décalent d'une catégorie ; ni valeur attendue ni `given / when / then` ne change.
  Les nouveaux tests vont dans des fichiers neufs (`src/domain/mairies.test.ts`, `scripts/data/mairies.test.ts`, `tests/e2e/mairies.spec.ts`). Un autre test protégé qui casse, ou une modification que ces règles ne couvrent pas : **arrêt et question**.
- Tout paquet (aucun n'est prévu) ; pousser ou déployer (`/ship`).
S'arrête si : bloqué · 3 corrections ratées · hors périmètre · action à accord · une condition d'arrêt de la tâche 0.
Relectures à la fin, par des agents neufs (perso) : code-reviewer, qa-tester (bureau 1 440 × 900, 390 × 844, 375 × 548 au toucher) — il couvre aussi la relecture de F, non faite à /ui.

## À respecter dans chaque tâche
- **Ne change pas** (sur une page sans pastille de mairie cochée) : loyer-mer AC-1 à AC-15 ; interface-telephone AC-1 à AC-11 ; proches AC-1 à AC-9, AC-11, AC-14, AC-16 ; immobilier AC-1 à AC-14 ; cadre-de-vie AC-1 à AC-12 ; proches-fiables AC-1 à AC-12. Toute la suite (`npm test`) passe à chaque tâche, aux deux largeurs de test.
- **Jointure par code INSEE** (CLAUDE.md), jamais par nom ni par position ; Paris, Lyon, Marseille d'un seul tenant (75056, 69123, 13055).
- **Le réglage** : champ **facultatif** `mairies?: Bord[]` de `Reglages`, absent quand aucune pastille n'est cochée, exactement comme `types` (`score.ts` l. 58, `url.ts` l. 79) ; `REGLAGES_DEPART` ne change pas, et `lireAdresse` ne renvoie pas le champ quand l'adresse n'a pas `mairie` (des tests protégés comparent l'objet entier : `url.test.ts` l. 6, 32, 77 ; `score.test.ts` l. 31). `Bord` = les 7 noms de H108.
- **Fixtures** : la fixture « 6 communes » de cette tranche (`docs/specs/2026-10-18-mairies/acceptance.json`, champs `mairie_bloc`, `mairie_etiquette`, `mairie_liste`, `sans_resultat`, par code INSEE). Les fichiers `acceptance.json` sont protégés : on n'y ajoute rien. `tests/e2e/lib/carte.ts` fabrique depuis cette fixture, **par code INSEE** (comme `cadreParCode`, l. 36-40) : `nuances.json` = une nuance inventée par étiquette distincte, de code égal à l'étiquette (« Divers droite » → bloc `droite`…) ; `mairies.json` = `[code, étiquette, liste]` pour A, B, C, E, `[code, "", "Vivre à Terrebasse"]` pour D, `[code, null, null]` pour F. Les « 5 communes » (mêmes codes 99001 à 99005) ont donc leur mairie ; le jeu « métropole » est sans résultat pour toutes. Les tests e2e ne lisent jamais les vrais `mairies.json` ni `nuances.json`.
- **Le mot « mairie »** désigne déjà le point de chaque commune (D18 de loyer-mer : `reperes.json`, `useProches.mairie`, champ `mairie` de la fixture de proches). Il ne change pas ; les nouvelles données s'appellent `bord`, `nuance`, `liste` dans le code ; seul le paramètre d'adresse s'appelle `mairie` (R41).
- **Référence du design** : prototype F, branche `prototype/mairies`, commit `7c7de4d` (`git show 7c7de4d:src/proto/VieLocale.tsx`, fonction `F`), captures `docs/design/mairies/directions/F-*.png`, décisions `docs/design/mairies/decisions.md`. Référence, pas du code à garder.
- **Jetons seulement** (`node scripts/check-tokens.mjs`) ; aucun jeton nouveau n'est prévu. Espaces insécables dans les nombres (« 3 500 », H3 de loyer-mer).
- **Réaction ≤ 100 ms** (H9 de loyer-mer) : aucune couche de carte nouvelle ; le filtre passe par l'évaluation existante (comme le type, R27).
- Données : scripts Python 3 sans dépendance, lancés avec `python3 -I` sur les fichiers téléchargés (`data-raw/`, non versionné) ; seuls les fichiers produits de `public/data/` et la table des nuances sont versionnés.

## Tâches

### Tâche 0 — Les mairies, mesurées et servies
**But** : `public/data/mairies.json` et `nuances.json` existent, justes et vérifiés ; Vincent a lu la table et les communes du risque ; on sait ce que pèse le fichier et ce que coûte la carte quand 30 000 communes se décolorent.
**Entrées** : R39 ; D4, D5, D8 ; H115, H116, H117, H121, H122, H120 ; AC-11, AC-12 ; le PDF de la circulaire dans `data-raw/` ; jeux data.gouv.fr « Elections municipales 2026 - Résultats du premier tour » et « … du second tour » (ministère de l'Intérieur, Licence Ouverte), ressource « Résultats - Communes » de chacun.
**Sorties** :
1. `scripts/data/sources.py` télécharge les deux fichiers de résultats par commune dans `data-raw/` et note pour chacun date, Last-Modified et sha256 dans `<fichier>.info.json`, comme pour la DVF.
2. `scripts/data/nuances-2026.csv` (versionné) : une ligne par nuance de liste de l'annexe — code (`LDVD`…), étiquette en clair telle qu'écrite dans l'annexe, bloc (nom de H108), page de l'annexe. Lue dans le PDF (`pdftotext -layout`, déjà installé), jamais devinée.
3. `scripts/data/mairies.py` : **une seule fonction** choisit la mairie d'une commune à partir de ses listes (étiquette, voix, sièges) aux deux tours, selon R39 (plus de sièges au conseil municipal, second tour sinon premier, au moins un siège, H115 pour l'égalité) ; seule la lecture diffère entre les vrais fichiers et l'extrait. Écrit `public/data/mairies.json` = `{ "champs": ["code", "nuance", "liste"], "communes": [...] }`, une ligne par commune de la carte dans l'ordre de `communes.json`, `nuance` vide = sans étiquette, `nuance` et `liste` à `null` = sans résultat ; et `public/data/nuances.json` = `{ "<code>": { "etiquette": …, "bloc": … } }`. Option `--extrait <fichier.json>` (format de `fixture.extrait_ministere` d'AC-11, avec la vraie table des nuances) : écrit sur la sortie standard `{ "<code commune>": { "bloc", "etiquette", "liste" } | null }`.
4. Contrôles dans `mairies.py` (arrêt si l'un échoue) : empreintes sha256 égales à celles notées dans CLAUDE.md (comme la DVF) ; tout code de métropole des fichiers existe dans `communes.json` (H121), compte affiché (attendu 0) ; nombre de communes de la carte absentes des deux fichiers, affiché (attendu 74) ; toute nuance non vide est dans la table ; toute commune sans étiquette a moins de 3 500 habitants selon la `population` de `communes.json` (D8 ; la quinzaine de communes de moins de 3 500 habitants **avec** étiquette, chefs-lieux d'arrondissement, est attendue) ; les comptes d'AC-12.
5. `scripts/data/mairies.test.ts` : AC-11 (le script lancé avec `--extrait` sur l'extrait de la fixture) et AC-12 (lecture de `public/data/mairies.json` et `nuances.json` ; la clause « aucune à cause d'un code non relié » est prouvée par le contrôle de la sortie 4, dont la sortie est copiée dans `mesure-tache-0.md`).
6. `docs/plans/2026-10-18-mairies/mesure-tache-0.md` : empreintes ; sortie des contrôles ; la table des nuances ; le compte de mairies par bloc ; 10 villes (Paris, Lyon, Marseille, Bordeaux, Nice, Perpignan, Toulouse, Nantes, Lille, Strasbourg) avec bloc, étiquette et liste ; **pour chaque bloc, les 10 premières communes** de la liste à `/?loyer=1200&mairie=<bloc>` (calculées avec les règles du site, leçon du 2026-10-14 sur les extrêmes) ; les 74 sans résultat (combien sans candidat, combien autres) ; les 4 égalités (H115) ; le poids de `mairies.json` + `nuances.json` brut et compressé (estimé à 1,5 Mo et 450 Ko le 2026-10-18) et le temps de chargement ajouté, mesuré sur `npx vite preview` avec le réseau ralenti de Chromium (profil « Fast 4G »), comparé à celui d'`achat.json` ; **la réaction de la carte** quand environ 30 000 communes se décolorent d'un coup, mesurée avec le filtre existant « Ville dense » (692 communes gardées) comme substitut, même méthode que H90 de cadre-de-vie.
7. `CLAUDE.md` → Données : la source, les deux fichiers retenus avec Last-Modified et sha256, la règle, la table des nuances et la mention de H118.
**Fichiers** : `scripts/data/sources.py`, `scripts/data/mairies.py` (nouveau), `scripts/data/nuances-2026.csv` (nouveau), `scripts/data/mairies.test.ts` (nouveau), `public/data/mairies.json`, `public/data/nuances.json` (nouveaux), `CLAUDE.md`, `docs/plans/2026-10-18-mairies/mesure-tache-0.md`.
**Tests** : `AC-11 …` et `AC-12 …` dans `scripts/data/mairies.test.ts`.
**Preuve attendue** : sortie des contrôles de `mairies.py` ; `npm run test:unit` vert ; `mesure-tache-0.md` complet ; la réponse de Vincent, notée dans le rapport.
**Conditions d'arrêt** (retour à Vincent, aucune valeur changée à la main) :
- PDF absent ou illisible ; une nuance des fichiers absente de l'annexe ; un code de métropole sans correspondance ;
- un compte d'AC-12 qui diffère ; **un des codes LDVD, LDVG, LUG, LRN absent de la grille 2026, ou « Divers droite » / « Union de la gauche » écrits autrement dans l'annexe** (AC-11 ne pourrait pas passer) : le critère revient à Vincent ;
- une ville ou une commune de tête jugée fausse par Vincent : chercher si la cause est R39 (sièges, tour) ou le rattachement de l'annexe, l'écrire, puis retour à Vincent, sans corriger un bloc à la main (H117) ;
- chargement ajouté de plus de 500 ms en « Fast 4G » : retour à Vincent ; un chargement à part des noms de liste serait une révision de H122, à sa décision ;
- réaction au-delà de 100 ms : Vincent accepte ou non (H120).
- À signaler seulement (pas d'arrêt) : une étiquette lue par la fixture e2e (« Rassemblement national », « Divers ») écrite autrement dans l'annexe — la fixture e2e est inventée et servie par `carte.ts`.

### Tâche 1 — Le filtre, de bout en bout par l'adresse
**But** : ouvrir `/?mairie=gauche` filtre la carte et la liste, sur la fixture et sur les vraies données, sans écran nouveau.
**Entrées** : R38, R39, R41 ; D3, D5 ; H108, H113, H122 ; AC-6 ; `public/data/mairies.json` et `nuances.json` de la tâche 0.
**Sorties** : `mairies.json` et `nuances.json` se chargent avec les communes (même chargement, même erreur : H122, comme `achat.json`, H68 d'immobilier) et se joignent par code ; chaque commune a son bord (un bloc, « sans étiquette » ou « sans résultat »), son étiquette et sa liste ; le réglage facultatif `mairies` (« À respecter ») ; le filtre de R38 dans l'évaluation (filtre sans note, comme le type) ; les trois raisons de R38, dans l'ordre de H113 ; le paramètre `mairie` de R41 (noms de H108, ordre de R38, sans doublon, noms inconnus ignorés, écrit seulement si une pastille est cochée, placé après `env`) ; dans `tests/e2e/lib/carte.ts`, les deux interceptions décrites dans « Fixtures ».
**Fichiers** : `src/App.tsx`, `src/domain/score.ts`, `src/domain/format.ts`, `src/domain/url.ts`, `src/domain/mairies.test.ts` (nouveau), `tests/e2e/lib/carte.ts`, `tests/e2e/mairies.spec.ts` (nouveau).
**Tests** : AC-6 dans `tests/e2e/mairies.spec.ts` ; unitaires dans `src/domain/mairies.test.ts` sur R38 (les 6 communes de la fixture, chaque bloc, « Sans étiquette » seule, aucune cochée), R41 (le cas d'AC-7, une adresse sans `mairie` qui ne renvoie pas le champ), les textes des raisons.
**Preuve attendue** : AC-6 vert ; `npx vite preview` sur les vraies données, `/?mairie=gauche` puis `/?loyer=aucun&mairie=gauche` : compte de la liste et capture ; la fiche de Bordeaux donne « Mairie : centre, hors des mairies choisies » ; l'adresse est réécrite comme R41.

### Tâche 2 — La catégorie « Vie locale »
**But** : on coche et décoche les 7 pastilles dans le panneau, en bureau et au téléphone ; carte, liste, fiche et adresse suivent ; les tests d'avant tiennent malgré le panneau plus long.
**Entrées** : R38, R41, R42 ; D2, D3, D7, D8 ; H109, H110, H111 ; le design F ; AC-1, AC-2, AC-3, AC-4, AC-7, AC-8 ; « Tests hors critères » de details.md.
**Sorties** :
- `src/ui/VieLocale.tsx` : catégorie « Vie locale » entre « Cadre de vie » et « Tes proches » (H111), groupe « Mairie élue en 2026 » (H109), Cases séparées en 3 colonnes, « Sans étiquette » au format d'une case avec la phrase de F à côté reliée par `aria-describedby`, cases désactivées pendant le chargement comme les autres réglages ; résumé replié de H110.
- Les tests protégés décalés par la nouvelle catégorie (le panneau sert aussi l'onglet « Critères » au téléphone, `App.tsx` l. 199-215 et 276), relus et ajustés **pour le seul déplacement** : `tests/e2e/proches-mobile.spec.ts` l. 80 et 95 (Maj+Tab « vers les tailles » tombe désormais sur « Sans étiquette »), `tests/e2e/telephone-feuille.spec.ts` l. 187 et 527-541, `tests/e2e/proches-etats.spec.ts` l. 235. Tout autre test qui casse est nommé dans le rapport, sinon arrêt et question.
**Fichiers** : `src/ui/VieLocale.tsx` (nouveau), `src/ui/Settings.tsx`, `src/domain/format.ts` (résumé), `tests/e2e/mairies.spec.ts`, et les trois tests ci-dessus si besoin.
**Tests** : AC-1, AC-2, AC-3, AC-4, AC-7, AC-8 dans `tests/e2e/mairies.spec.ts`, aux deux largeurs de test quand le critère le permet ; toute la suite.
**Preuve attendue** : critères verts et `npm test` vert ; captures bureau et 390 × 844 de la catégorie au départ et avec « Gauche » et « Sans étiquette » cochées, comparées à `F-depart-*` et `F-choix-*` ; sur `npx vite preview` avec les vraies données, « Sans limite » puis « Gauche » : Paris, Lyon et Marseille en couleur neutre, Bordeaux et Nice non colorées (capture) ; la réaction en cochant « Centre » puis « Sans étiquette », même méthode que H90, comparée à la mesure de la tâche 0.

### Tâche 3 — La fiche et les mentions
**But** : la fiche de chaque commune dit sa mairie ; le pied de page cite les sources.
**Entrées** : R40, R43 ; D6, D8 ; H112, H114, H118 ; AC-5, AC-10 ; capture `F-fiche-1440x900.png`.
**Sorties** : la ligne « Mairie » sous la ligne de la montagne, toujours affichée, aux formats de R40 (bloc avec majuscule, étiquette entre parenthèses sauf si elle s'écrit comme le bloc, « sans étiquette (moins de 3 500 habitants) » avec espace insécable, « aucun résultat en 2026 », nom de la liste tel que publié entre guillemets français) ; la mention de H118 dans le pied de page.
**Fichiers** : `src/ui/Fiche.tsx`, `src/domain/format.ts`, `src/domain/mairies.test.ts`, `src/ui/Mentions.tsx`, `tests/e2e/mairies.spec.ts`.
**Tests** : AC-5, AC-10 ; unitaires des formats de la ligne dans `src/domain/mairies.test.ts`.
**Preuve attendue** : critères verts ; sur `npx vite preview` (vraies données), captures des fiches de Bordeaux, Nice, Paris (nom de liste long) et d'un village sans étiquette ; capture du pied de page.

### Tâche 4 — Téléphone et bout en bout
**But** : la tranche marche au téléphone ; la vérification de bout en bout de la spec passe en local sur les vraies données.
**Entrées** : R42 ; AC-9 ; H48 d'interface-telephone ; « Vérification de bout en bout » de details.md ; les 10 villes de `mesure-tache-0.md`.
**Sorties** : AC-9 vert ; à 375 × 548, le curseur du prix visible à l'ouverture ; les étapes 1 à 5 de la vérification de bout en bout.
**Fichiers** : `tests/e2e/mairies.spec.ts`, `docs/plans/2026-10-18-mairies/captures/`.
**Tests** : AC-9 ; toute la suite (`npm test`) aux deux largeurs.
**Preuve attendue** : `npm test` vert (sortie) ; les étapes 1 à 5 de la vérification de bout en bout de details.md sur `npx vite preview`, en bureau et à 390 px, captures dans `captures/` ; les 10 villes relues sur la page.

## Reporté
Rien de la spec. Hors spec, noté pour plus tard : couleur politique sur la carte, tête de liste, participation (« Pas maintenant » de la spec).

## Risques et hypothèses du plan
- **L'annexe n'est pas lisible ou ne range pas une nuance** → la tâche 0 s'arrête ; aucun bloc deviné (H117).
- **`mairies.json` alourdit l'ouverture** (≈ 450 Ko compressés, autant qu'`achat.json`) → mesuré en tâche 0 avec un réseau ralenti ; au-delà de 500 ms ajoutées, retour à Vincent.
- **Décolorer 30 000 communes d'un coup dépasse 100 ms** (comme la mer, H90 de cadre-de-vie) → mesuré en tâche 0 avec « Ville dense », puis en tâche 2 avec le vrai filtre ; au-delà, Vincent accepte ou non (H120).
- **Les fichiers du ministère changent** (rectifications) → empreintes notées dans CLAUDE.md ; `mairies.py` s'arrête si elles changent.
- **Des tests d'avant cassent par le décalage du panneau** → liste connue, traitée en tâche 2 où le décalage apparaît ; un autre test cassé = arrêt et question.
- **Un bloc faux sur une ville connue ou en tête de liste** → table, 10 villes et 10 premières de chaque bloc jugées par Vincent en tâche 0, relues sur la page en tâche 4.
- **Le mot « mairie » mélangé avec le point de la commune** → règle « Le mot « mairie » » ci-dessus ; vérifié par la relecture du code.
