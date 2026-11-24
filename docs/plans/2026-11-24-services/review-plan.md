# Relecture du plan — services

Statut : terminé

## Verdict
Le plan est solide sur l'essentiel. Les 17 critères sont chacun dans une seule tâche, et aucun « when » ne s'appuie sur une action construite plus tard. « Ne change pas » reprend exactement details.md. La jointure par code INSEE, l'arrondi fait une seule fois en amont, les conditions d'arrêt et le choix de Vincent sur le risque (jugé à la démo) sont bien posés.
**À corriger avant /build : 3 constats majeurs**, tous dans le texte du plan, sans décision produit. Le premier est un compte faux qui arrêterait la tâche 0a à tort. Le deuxième est une étape de calcul des gares sans entrée ni méthode. Le troisième est un piège sur des tests protégés, par une nouvelle zone d'annonce. Viennent ensuite 7 constats moyens, dont 1 à trancher par Vincent : un retrait D12 sur une commune d'AC-13, et 6 mineurs.

## Bloquant
Aucun.

## Majeur

### M1 — Le compte « 34 736 communes avec un temps » arrêtera la tâche 0a à tort
Où : plan.md:39 (contrôle « 34 736 communes avec au moins un temps (D2) ») et plan.md:47 (condition d'arrêt « un autre nombre que 34 736 communes avec un temps »).
Problème : 34 736 est le nombre de communes qui ont **au moins un carreau** (D2, mesures.md:46). Mais R52 et details.md:56 donnent à Suzan et Villefranche-le-Château un temps « Gare grandes lignes » depuis la mairie : elles ont un temps sans avoir de carreau. Et mesures.md:98 le confirme : 382 communes sans chiffre en grandes lignes = 360 Corse + 16 îles + 6 sans habitant, donc Suzan et Villefranche y ont un chiffre. Le fichier final aura donc **34 738** communes avec au moins un temps. Le constructeur verra soit un faux arrêt, soit un contrôle qu'il réécrit à sa façon.
Proposition : écrire deux contrôles : « 34 736 communes avec au moins un carreau habité (les 10 de mesures.md sans) » et « 34 738 communes avec au moins un temps dans services.json (les 10 sans carreau moins Suzan et Villefranche-le-Château, qui gardent leur temps grandes lignes) ». Mettre la condition d'arrêt sur le premier.

### M2 — Refaire les 61 gares demande deux choses que le plan ne fournit pas
Où : plan.md:37 (extraction) et plan.md:38-39 (« gares de H170 recalculées depuis le fichier SNCF (bibliothèque standard : `zipfile`, `csv`) », « exactement les 61 gares de `data-raw/services-calcul/gares-grandes-lignes.csv` »).
Problème : pour retirer les gares « dans une commune à gare nationale de l'Insee » (H170), il faut (a) la **commune de chaque arrêt SNCF** et (b) la **liste des communes qui ont une gare nationale** (E107). Le GTFS ne donne que des coordonnées : il faut trouver la commune qui contient le point. H170 le confirme (« son point SNCF tombe sur Vendôme »). Le plan ne dit ni avec quels contours, ni par quelle méthode, et `zipfile` et `csv` ne suffisent pas. Pour la liste des communes à gare nationale, l'essai de /spec a lu la colonne « commune de l'équipement » du fichier Insee (`data-raw/services-calcul/nationales-communes.csv`, colonne `dest`). Or l'extraction du plan ne garde que des durées par carreau (« une colonne par type, la durée en minutes »), donc `services.py` ne peut pas refaire cette liste. Enfin, `gares-grandes-lignes.csv` contient toutes les gares TGV ou Intercités, pas 61 : on lit Rouen Rive Droite, 1,43 arrêt par jour, dès la 4e ligne. Les 61 sont ce qui reste après le seuil de 4 arrêts et le retrait des communes à gare nationale (`calcul-grandes-lignes.py:22-24`).
Proposition : (1) l'extraction garde aussi, pour E107, la commune de la gare la plus proche, ou la liste des communes E107 distinctes ; dire le nom de la colonne Insee. (2) Écrire la méthode qui donne sa commune à un arrêt : point dans le contour, avec quels contours de `data-raw/` (ceux d'Etalab 2025 utilisés par `tuiles.py` ?), en Python sans dépendance. Ou bien dire que le code commune de `gares-grandes-lignes.csv` est repris tel quel et seulement contrôlé. (3) Réécrire le contrôle : « les gares de ce fichier où `tgv_jour + intercites_jour ≥ 4` et dont le code n'est pas une commune à gare nationale (41269 comptée nationale) = 61, mêmes UIC que celles d'`ors-grandes-lignes.jsonl` ».

### M3 — Une nouvelle zone d'annonce casserait des tests protégés ; le plan ne l'interdit pas
Où : plan.md:61 (tâche 1, « Chargement des temps… », « Temps des services indisponibles. »), plan.md:94 (tâche 4, message de la catégorie).
Problème : `.claude/rules/ui.md` demande des « messages d'état annoncés », et un constructeur posera naturellement `role="status"` ou `aria-live` sur ces messages. Or 12 lignes de 7 fichiers protégés lisent `getByRole('status')` en mode strict : etats, immobilier, proches-etats, proches-fiables, emploi, telephone-feuille, liste. Une deuxième zone `status`, même vide, les casse tous (« l'unique zone `role=status` de la page », `src/App.tsx:211`). De plus, le test H100 de proches-fiables (`tests/e2e/proches-fiables.spec.ts:631-658`) note **tout** changement de `[role=status], [role=alert], [aria-live]` après la carte prête et attend `[]`. Or le chargement des temps est justement lancé à « carte prête » : une zone qui change à ce moment-là le ferait tomber par intermittence (leçon `2026-10-16-guetteur-d-annonces-et-indicateur-de-chargement.md`).
Proposition : écrire dans « À respecter » ou en tâche 1 : aucune nouvelle `role="status"`. « Chargement des temps… » n'est dans aucune zone d'annonce. « Temps des services indisponibles. » utilise `role="alert"`, présent seulement en erreur (aucun test d'avant ne met ce fichier en erreur), ou suit la façon dont « Trajets indisponibles » est annoncé aujourd'hui. Ajouter cette contrainte aux conditions d'arrêt.

## Moyen

### Mo1 — L'alphabet du fichier des temps reste à inventer, et il faut l'écrire trois fois
Où : plan.md:19 (« un caractère pour « 61 ou plus » … un caractère réservé pour « pas de chiffre » ; alphabet sans caractère que JSON échappe »), plan.md:42 (sortie 7 : « code → 10 valeurs, `null` = pas de chiffre »).
Problème : le format est « décidé ici », mais l'alphabet n'est pas donné. Trois endroits doivent pourtant l'écrire pareil : `services.py` (tâche 0a), le lecteur de `src/domain/services.ts`, et la fabrication du fichier de la fixture dans `tests/e2e/lib/carte.ts` et `src/domain/services.test.ts` (tâche 1). Le piège évident : décaler depuis « 0 » (`chr(48 + n)`) donne `\` pour 44 min. Le nombre que rend le lecteur pour « 61 ou plus » n'est pas fixé non plus (61 ? `Infinity` ?), alors que l'unitaire de la tâche 1 teste « 60 et 61 min ».
Proposition : écrire l'alphabet dans le plan (par exemple la chaîne exacte de 62 caractères, et quel caractère vaut « 61 ou plus » et « pas de chiffre »). Dire que le lecteur rend 61 pour « 61 ou plus ». Faire exporter par `src/domain/services.ts` la fonction d'écriture, utilisée par `carte.ts` et par les unitaires, comme `tokens` et `view` y sont déjà importés.

### Mo2 — `--extrait` doit lire un extrait dont les blocs n'ont pas tous la même forme
Où : plan.md:38 (« Option `--extrait <fichier.json>` (format d'`extrait_carreaux` de la fixture) »), plan.md:43.
Problème : `extrait_carreaux` mélange des carreaux (`commune_X_commerce`, dont le service n'est écrit que dans le nom de la clé), un dictionnaire valeur brute → attendu (`arrondis_medecin`), des lignes par arrondissement (`depcom`) et des communes à temps « nationale » et « depuis la mairie » (`temps_grandes_lignes`). « Écrit les temps calculés de chaque commune de l'extrait » ne dit pas comment le script reconnaît le service d'un bloc, ni comment il traite `arrondis_medecin`, qui n'est pas une commune. Deux constructeurs feront deux conventions.
Proposition : dire que le test met l'extrait dans un format neutre avant d'appeler le script, et donner ce format : une liste de `{commune, service, carreaux: [{pop, <type>: minutes}]}`, avec les arrondis sous forme de communes d'un seul carreau, et `temps_grandes_lignes` tel quel. Dire aussi ce que la sortie standard renvoie (minutes arrondies, ou `null`).

### Mo3 — Où poser « Services » : entre « Tes proches » et le compte collé, dans `App.tsx`
Où : plan.md:77-78 (tâche 3a, « `src/ui/Settings.tsx` », « `src/App.tsx` (si les props l'exigent) »).
Problème : « Tes proches » n'est pas dans `Settings`. C'est un `children` passé par `App.tsx` (`reglagesUI`, `src/App.tsx:224-236`), suivi en bureau de `{pied}`, le compte `role="status"` collé en bas (`sticky bottom-0`). Si le constructeur ajoute `<Services>` dans `Settings` après `{children}`, la catégorie passe **sous** le compte collé.
Proposition : écrire « `<Services>` va dans `reglagesUI` d'`App.tsx`, entre `<Proches>` et `{pied}` ». `App.tsx` n'est alors plus « si besoin », et `Settings.tsx` n'est sans doute plus touché.

### Mo4 — Entre les tâches 3a et 4, on peut cocher avant l'arrivée des temps
Où : plan.md:77 (tâche 3a) contre plan.md:94 (tâche 4, « pendant le chargement, les temps, niveaux et types de « Services » sont inactifs »).
Problème : en 3a, les pastilles sont actives dès que la carte est prête, alors que `services.json` peut encore être en route. Le plan ne dit pas ce que fait l'évaluation si un filtre de service est posé sans les données (tout « sans chiffre », donc tout passe ?). Les tests de 3a et 3b (AC-2, AC-3, AC-4, AC-9, AC-10, AC-14, AC-17) cliquent juste après `ouvrir()`, qui n'attend que `data-carte-prete`, et ils n'ont aucun signal « temps arrivés ».
Proposition : déplacer en 3a l'état **inactif pendant le chargement**, une prop `disabled` (la tâche 4 garde l'erreur, « Réessayer » et le téléphone). Dire que les tests attendent qu'une pastille de « Services » soit active avant de cocher.

### Mo5 — [Vincent] Un retrait D12 sur une commune d'AC-13 n'est pas « sans toucher au code »
Où : plan.md:12 (« un temps jugé faux devient « pas de chiffre » par `services-retraits.csv` (D12), sans toucher au code »), plan.md:47 (arrêt sur « une valeur d'AC-13 différente »).
Problème : 4 des 10 communes jugées à la démo sont dans AC-13 : Auch, Mende, Les Sables-d'Olonne et L'Île-d'Yeu. Si Vincent juge faux, par exemple, la gare grandes lignes de Mende, le retrait fait tomber AC-13 et le contrôle de `services.py`. Changer AC-13 revient à Vincent (règle « Jamais » de CLAUDE.md).
Proposition : écrire dans « Ce que /build fera seul » : un retrait qui touche une valeur d'AC-13 (ou d'AC-6 sur les vraies données) est une décision de Vincent, avec le changement d'AC-13 qui va avec. Ce n'est pas une correction faite seule.

### Mo6 — La tâche 0a dépasse le cadre (10 fichiers, bien plus de 2 h)
Où : plan.md:44.
Problème : 7 fichiers source (`sources.py`, SQL, `services.py`, retraits, test, `services.ts`, `CLAUDE.md`) plus 3 produits. Le travail couvre 13 empreintes, une extraction de 12 min, toutes les règles de R52, le recalcul des gares (M2), une douzaine de contrôles, la mesure, `CLAUDE.md` et le lecteur TS. Le plan d'emploi avait coupé l'équivalent en 0a, 0b et 0c.
Proposition : couper en deux. **0a** : sources, empreintes, extraction, liste des communes à gare nationale, recalcul des 61 gares, `CLAUDE.md` ; preuve : l'extrait et ses contrôles. **0a'** : `services.py` (règles, retraits, json, csv des gares), `services.ts`, test d'AC-5, AC-13 et AC-16, poids.

### Mo7 — La tâche 3a porte trop pour un constructeur neuf
Où : plan.md:74-81.
Problème : toute la catégorie (4 lignes, deux composants du contrat, résumé, groupes nommés), 6 critères (AC-1, AC-2, AC-3, AC-9, AC-10, AC-11), le décalage de 3 tests protégés et la mesure H163 sur les vraies données. Avec les tests protégés possibles, on arrive à 8 à 10 fichiers.
Proposition : sortir la mesure H163 dans une étape à part, juste après 3a et avant 3b (elle peut arrêter /build : mieux vaut le savoir avant de construire la scolarité). Ou bien confier AC-9 et AC-11 à une tâche 3a'.

## Mineur

- **m1** — plan.md:36 et plan.md:39 : les sommes et tailles sont écrites dans `CLAUDE.md` « dès cette première lecture, avant que les contrôles les comparent ». Le contrôle compare donc la lecture à elle-même, et n'arrête qu'en cas de changement pendant l'extraction. Proposition : comparer aussi aux faits notés pendant /spec (14,45 Go au total, mise en ligne les 18 et 19/08/2026, mesures.md:5 et :67) et s'arrêter s'ils diffèrent.
- **m2** — [Vincent] plan.md:47 et :107 : la limite de H162 était « 350 Ko compressés », mesurée en `gzip -9` (349 Ko). Le plan la mesure en `brotli -q 3`, plus clément, sans amender H162. Avec ≈ 234 Ko attendus, cela ne change rien en pratique. Proposition : mesurer les deux et noter l'amendement de H162 dans details.md (le relecteur ne l'a pas modifié).
- **m3** — plan.md:37 : si DuckDB doit être retéléchargé, son extension `httpfs` se télécharge aussi (depuis extensions.duckdb.org) au premier `INSTALL` ou `LOAD`. C'est un deuxième binaire, que le plan ne mentionne pas. Proposition : le citer dans l'accord, avec sa somme.
- **m4** — plan.md:9 et :94 : le décalage des tests protégés du téléphone est accordé en 3a **et** en 4. Il est dû à la catégorie ajoutée en 3a, et `npm test` doit y passer. Proposition : ne le garder qu'en 3a ; en 4, seulement si la pastille amenée à l'écran le change encore.
- **m5** — plan.md:61 et :94 : en erreur, la fiche et la catégorie montrent deux boutons « Réessayer » au même nom, côte à côte en bureau, à côté du « Réessayer » de la page (`Status.tsx`). Le test d'AC-15 et le lecteur d'écran ne peuvent pas les distinguer. Proposition : dire comment les tests les ciblent (par la zone, la fiche ou la catégorie) ; le texte visible ne change pas.
- **m6** — plan.md:72 (preuve de la tâche 2) : le compte de `medecin:10` est demandé sur `/?loyer=aucun`, où la page n'affiche aucun compte (D17, annonce vide sans plafond). Proposition : dire d'où vient ce nombre (évaluation sur le fichier servi, ou une adresse avec un plafond très haut).

## Vérifié, sans constat
- Chaque critère est dans une seule tâche : AC-5, AC-13, AC-16 (0a) ; AC-6, AC-7 (1) ; AC-8 (2) ; AC-1, AC-2, AC-3, AC-9, AC-10, AC-11 (3a) ; AC-4, AC-14, AC-17 (3b) ; AC-12, AC-15 (4). Les « when » relus en entier : AC-4 utilise le résumé replié (3a) et la scolarité (3b) ; AC-9 n'utilise que le type de gare et le médecin (3a) ; AC-15 utilise le « Réessayer » de la fiche (1) et la catégorie en erreur (4). Aucun ne dépend d'une tâche suivante.
- « Ne change pas » (plan.md:17) = details.md:92, mot pour mot.
- Jointure par code INSEE, Paris, Lyon et Marseille d'un seul tenant, page qui ne recalcule pas R52 (leçon du double arrondi) : écrits et cohérents avec R52 et H156.
- `lireAdresse` sans `services` ne renvoie pas le champ, `REGLAGES_DEPART` inchangé : cohérent avec `src/domain/url.ts:101-120` et le motif de `metiers`.
- Ordre de l'adresse (`services` après `metier`, avant `bien`) : cohérent avec R55 et `ecrireAdresse` (`url.ts:126-141`).
- Les règles de R55 du plan reproduisent les trois adresses d'AC-11 et la dernière d'AC-17.
- Chargement différé sur `data-carte-prete` : ce drapeau est posé à `idle`, y compris sur le fond de secours (`src/map/MapView.tsx:105-107`), donc pas de blocage sans fond IGN ; `avecDelai` et `DELAI_DONNEES_MS` existent (`src/domain/chargement.ts`).
- Ajout à `carte.ts` sans changer de ligne : faisable par un `page.route` de plus dans `servirFixture` et une lecture `'temps_services' in it`, sur le modèle de `cadreParCode` et `achatJson`. Le jeu SIX d'`emploi.spec.ts` sert bien de base (cadre-de-vie, `tuiles-immobilier`).
- Aucune requête à openrouteservice ; `data-raw/services-calcul/` et le fichier SNCF sont bien présents en local ; `brotli` est installé (Homebrew 1.2.0).
- Tests de scripts : `scripts/data/emploi.test.ts` appelle déjà `python3 -I … --extrait` par `execFileSync`, le modèle annoncé existe.
- « Le risque » : la tâche 0b prépare le tableau des 10 communes, jugé à la démo comme Vincent l'a choisi ; le poids est mesuré en 0a avec un arrêt.
- La règle `deNom` est sans objet : aucun texte ne contient de nom de commune (les raisons nomment des services).
- Mentions H164 et H172 : posées dans `Mentions.tsx` (tâche 1) et dans `CLAUDE.md` (tâche 0a).
- La première tâche visible (1) montre déjà les vraies données sur le vrai flux (fiche d'Auch), avec relevé réseau.
