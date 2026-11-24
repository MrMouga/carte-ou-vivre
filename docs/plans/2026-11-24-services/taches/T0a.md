# Tâche 0a — Les sources figées et l'extrait des carreaux
Statut : faite · Début 12:17 · Fin 12:52 · Commits : 033b44e (tâche) · suivant (numéro du commit dans le rapport)

## Ce que l'utilisateur peut faire maintenant
Rien de visible sur le site (tâche de données). Pour la suite de la tranche :
- les 13 fichiers de l'Insee (14,45 Go) sont figés sans être téléchargés : `python3 -I scripts/data/sources.py --services` relit leur adresse, leur taille, leur SHA-1 et leur date sur data.gouv.fr et s'arrête au moindre changement ; le fichier SNCF et le fichier d'openrouteservice déjà dans `data-raw/` sont contrôlés par leur sha256 ;
- `data-raw/services-carreaux.csv.gz` contient les durées des 21 types d'équipement pour chaque carreau habité (2 342 797 lignes, 34 778 codes de commune) ;
- `data-raw/services-nationales.csv` donne les communes à gare nationale (110 codes, 105 communes) ;
- `data-raw/services-gares.csv` donne les 61 gares grandes lignes ajoutées, recalculées depuis les horaires SNCF et identiques à celles de /spec.

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| — (aucun critère) | contrôles de `sources.py --services` | 46 « ok », aucun échec |
| — | contrôles de `services-extrait.sql` | 13 régions ; 0 population multiple ; 0 ligne en trop par type ; 0 doublon entre régions ; relecture égale |
| — | contrôles de `gares.py` | 239 gares égales à /spec (arrêts au centième, communes) ; 105 communes nationales égales ; 61 gares, mêmes UIC qu'openrouteservice ; 103 110 trajets, aucun manquant |

## Preuves
- `docs/plans/2026-11-24-services/mesure-tache-0.md` — sommes, tailles et dates retenues ; sortie des contrôles de `sources.py` (12:38), de l'extraction (12:38:29 → 12:47:53, 9 min 24 s) et de `gares.py` (12:48) ; 3 premières lignes et nombre de lignes de l'extrait (2026-11-24 12:50).
- Fichiers produits (non versionnés), relus après écriture : `data-raw/services-carreaux.csv.gz` (sha256 `1b3d4fc5…7dc8`), `data-raw/services-nationales.csv` (`fbe583d5…78df`), `data-raw/services-gares.csv` (`9bb7b098…c3c1`), `data-raw/services-sources.info.json`.
- Ce que la preuve ne couvre pas : les temps des communes (R52, médianes, arrondi) sont la tâche 0b.

## Suite de tests
- `npm run test:unit` : `Test Files  22 passed (22)` · `Tests  365 passed (365)` (12:49)
- `npm run typecheck` : sans erreur (12:50)
- `npm run test:e2e` / `npm test` : non lancés (consigne de l'orchestrateur : une suite tourne en parallèle sur le port 4173 ; aucun code TypeScript touché)
- `npm run build` : non lancé (aucun fichier du site touché)

## Décisions prises à la place de Vincent
- Décision : **l'extrait a une ligne par (commune, IRIS, carreau)**, avec une colonne `iris` en plus (après `depcom`), et non une ligne par (commune, carreau, population) comme l'écrivait le plan — pourquoi : le fichier a une ligne par IRIS pour un carreau à cheval sur plusieurs IRIS de sa commune (63 459 carreaux, 2 à 6 parts), à la même population et la même durée ; ce sont des parts (additionnées : 62,9 millions d'habitants ; une seule gardée : 55,1 millions, Bordeaux perdrait un quart de ses habitants des carreaux). Regrouper par commune et carreau passait le contrôle du plan et perdait 12 % de la population. Garder chaque part est fidèle à la source, sans règle dans le SQL, et redonne exactement les poids de l'essai de /spec (qui additionnait déjà) — coût si c'est faux : la tâche 0b compterait deux fois la population de ces carreaux ; la condition d'arrêt du plan (« plus d'une population pour une commune et un carreau ») n'est pas atteinte (0), l'arrêt porte sur la clé (commune, IRIS, carreau).
- Décision : `sources.py --services` compare chaque fichier aux valeurs de la lecture de /spec (adresse, taille, SHA-1, date), recopiées dans `sources.py` (`SERVICES_FICHIERS`) et `CLAUDE.md`, en plus du total et des dates demandés — pourquoi : c'est la condition d'arrêt « une somme, une taille ou une date publiée différente de /spec » ; les valeurs viennent du fichier de métadonnées de /spec, toujours dans son dossier temporaire — coût si c'est faux : aucun (toutes égales).
- Décision : le sha256 d'`ors-grandes-lignes.jsonl` retenu est celui du fichier de `data-raw/`, égal à la copie restée dans le dossier temporaire de /spec (`90725176…ae04`) — pourquoi : /spec ne l'avait pas noté — coût si c'est faux : nul.
- Décision : `sources.py` ne fait le travail des services que sous `--services` (le lancement sans option, qui télécharge les autres sources, ne change pas) — pourquoi : sur une machine neuve, le fichier SNCF ne peut pas être retéléchargé (H170) et ferait échouer tout le script — coût si c'est faux : un oubli de l'option ne relit pas l'API ; l'extraction relit `services-sources.info.json` et affiche sa date de lecture.
- Décision : `gares.py` applique le seuil de 4 arrêts par jour sur les arrêts entiers des 28 jours (TGV + Intercités ≥ 112) et non sur la somme de deux valeurs arrondies au centième comme l'essai — pourquoi : exact, sans erreur d'arrondi — coût si c'est faux : nul ici (mêmes 61 gares, contrôlé).
- Décision : `gares.py` prend ses chemins en argument (`data-raw public/data`) — pourquoi : consigne « chemins passés en argument » pour les fichiers téléchargés.
- Décision : DuckDB 2.0.0 et son extension `httpfs` ont été pris dans le dossier temporaire de l'essai de /spec, toujours présent : **aucun téléchargement** de DuckDB.

## Fichiers touchés hors de la liste de la tâche
- `docs/solutions/2026-11-24-duckdb-shell-une-seule-chaine.md` et `docs/solutions/2026-11-24-insee-acces-equipements-parts-par-iris.md` (leçons), `docs/solutions/README.md` (index régénéré par le crochet ; contient aussi la ligne de la leçon « poids servi » commitée avant moi sans son index). Copies dans `~/.claude/studio/solutions/` (leçons utiles à d'autres projets).
- `docs/plans/2026-11-24-services/taches/T0a.md` (ce rapport).

## Tests existants modifiés
- aucun

## Leçons écrites
- `docs/solutions/2026-11-24-duckdb-shell-une-seule-chaine.md` — `.shell sh -c "…"` dans DuckDB perd les options : df comptait en blocs de 512 octets (contrôle de place libre faux, sans effet ici : 23 Gio libres réels) ; corrigé, extraction refaite.
- `docs/solutions/2026-11-24-insee-acces-equipements-parts-par-iris.md` — lignes « en double » aux valeurs égales = parts par IRIS, à additionner.

## Pour la tâche 0b (à transmettre au builder)
- Lire `services-carreaux.csv.gz` par nom de colonne : `depcom, iris, idSrc, pop, <21 types>`. **Chaque ligne est une part** : la population d'une commune dans un carreau est la somme de ses lignes ; « carreau à cheval compté pour la part de population de sa ligne » s'applique ligne par ligne (les parts d'un même carreau ont la même durée). Le mode `--extrait` des tests peut ignorer `iris` s'il est absent (une ligne = une part).
- Codes de commune tels que publiés : arrondissements de Paris, Lyon, Marseille (à réunir, R52) ; 34 778 codes = 34 746 − 3 + 45 − 10 sans carreau.
- `services-nationales.csv` : colonne `code`, 110 codes bruts (arrondissements compris) ; `services-gares.csv` : `uic, nom, lon, lat, tgv_jour, intercites_jour, code`.
- Les 6 villages de population 0 ont des trajets dans `ors-grandes-lignes.jsonl` : à ne pas lire (R52).
