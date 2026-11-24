# Mesures de la tâche 0 — services
2026-11-24 · Part 0a (sources figées, extrait des carreaux, gares recalculées) par le builder de la tâche 0a ; part 0b (temps des communes, comptes, poids) par le builder de la tâche 0b, [plus bas](#part-0b--les-temps-de-chaque-commune-servis) ; réaction de la carte (H163) par le builder de la tâche 3b, [en fin de fichier](#tâche-3b--réaction-de-la-carte-quand-on-coche-un-service-h163).

## Part 0a — sources retenues

### Insee : accès de la population aux équipements (H165)
Jeu « Données sur la localisation et l'accès de la population aux équipements », data.gouv.fr, id `67fe0fe2423db9c4a05d8ced`, Licence Ouverte 2.0 (`lov2` dans l'API). Les 13 fichiers régionaux de métropole (la Corse, 94, comprise ; 02 et 04, outre-mer, non lus) ne sont **jamais téléchargés** : `python3 -I scripts/data/sources.py --services` lit l'API, compare chaque fichier aux valeurs retenues (celles de la lecture de /spec du 2026-11-23, recopiées dans `sources.py` et `CLAUDE.md`), contrôle le total et les dates, puis écrit `data-raw/services-sources.info.json`. Une lecture différente l'arrête sans rien écrire, et `services-extrait.sql` ne lit que les adresses de ce fichier.

| Région | Mis en ligne | Octets | SHA-1 publié |
|---|---|---:|---|
| 11 Île-de-France | 18/08/2026 | 476 082 759 | `433b8e257203e2294bd70c2d3425526c61bb87ed` |
| 24 Centre-Val de Loire | 18/08/2026 | 825 690 115 | `919e4a0508c85bc9bedbce82b1291361e6555c59` |
| 27 Bourgogne-Franche-Comté | 18/08/2026 | 861 476 546 | `efa3985ab40b0200e41964c5f93b3e9c61f1fde8` |
| 28 Normandie | 18/08/2026 | 1 103 079 376 | `7d62d28d43db25412a6bd920b767e3234308afa7` |
| 32 Hauts-de-France | 19/08/2026 | 933 951 644 | `ec1617d8f85ed1439258b0d82c89af0fbde19d51` |
| 44 Grand Est | 19/08/2026 | 892 529 336 | `1cf1bc80b8bdea934be0e0665929183eee3edd6d` |
| 52 Pays de la Loire | 19/08/2026 | 1 147 553 679 | `9ac417261e85f1fd5349a0a64ebd974340dd589c` |
| 53 Bretagne | 18/08/2026 | 1 230 220 434 | `af29a48805a95b72d9df3163fb8caf7404e146f9` |
| 75 Nouvelle-Aquitaine | 18/08/2026 | 2 414 485 257 | `599356d55f9d69ede4196754ae52c1c469a3a495` |
| 76 Occitanie | 18/08/2026 | 1 745 361 059 | `7303c2bb7d75046863326135de6e737e58f89460` |
| 84 Auvergne-Rhône-Alpes | 18/08/2026 | 1 974 307 689 | `d5b67910164f346425256d56ddde9d221cef5049` |
| 93 Provence-Alpes-Côte d'Azur | 18/08/2026 | 788 053 755 | `a134da390ae256ecfea869add42cc17c021f2fa2` |
| 94 Corse | 18/08/2026 | 58 703 774 | `791520bd376d7f953c99efc433bbfbd2ed261a08` |
| **Total** | | **14 451 495 423** (14,45 Go) | |

Les adresses (`static.data.gouv.fr/resources/donnees-sur-la-localisation-et-lacces-de-la-population-aux-equipements/<horodatage>/donnees-2025-reg<NN>.parquet`) sont dans `sources.py` (`SERVICES_FICHIERS`). Date de mise en ligne = `last_modified` de l'API (pas l'en-tête `Last-Modified` du serveur, qui diffère : mesures de /spec).

### Fichiers déjà dans `data-raw/`, jamais retéléchargés
| Fichier | Source | Octets | sha256 |
|---|---|---:|---|
| `Export_OpenData_SNCF_GTFS_NewTripId.zip` | Horaires SNCF (« Réseau SNCF TGV, Intercités et TER », ODbL), version 2026-11-22, copié le 2026-11-24 depuis l'essai de /spec (H170) | 5 547 556 | `0abd6918c870c6495a722406bc0c477f8d49ad4639dd9f4513b3d5f9331eaa73` (= H170) |
| `services-calcul/ors-grandes-lignes.jsonl` | Temps mairie → gares, openrouteservice, calculés les 2026-11-23 et 24 (H171, ne pas relancer) | 1 680 145 | `90725176eaf96d668411435f2030911584143e0826ab3e8e288918cdb123ae04` (égal à la copie restée dans le dossier temporaire de /spec) |

### Sortie des contrôles de `sources.py` (dernière lecture, 2026-11-24 12:38, juste avant l'extraction retenue)
Commande : `python3 -I scripts/data/sources.py --services`. Trois lectures dans la journée (12:22, 12:35, 12:38), toutes identiques.
```
services : lecture de https://www.data.gouv.fr/api/1/datasets/67fe0fe2423db9c4a05d8ced/
  ok   jeu 67fe0fe2423db9c4a05d8ced, licence lov2 (Licence Ouverte 2.0)
  ok   donnees_2025_reg11.parquet : une seule ressource de ce nom (1)
  donnees_2025_reg11.parquet : 476082759 octets, SHA-1 433b8e257203e2294bd70c2d3425526c61bb87ed, mis en ligne le 2026-08-18
  ok   donnees_2025_reg11.parquet : somme publiée de type SHA-1
  ok   donnees_2025_reg11.parquet : adresse, taille, SHA-1 et date égales à celles retenues (/spec)
  … (les mêmes quatre lignes, toutes « ok », pour 24, 27, 28, 32, 44, 52, 53, 75, 76, 84, 93, 94 ; valeurs du tableau ci-dessus)
  ok   13 fichiers, 14451495423 octets au total = 14.45 Go (attendu 14.45)
  ok   dates de mise en ligne ['2026-08-18', '2026-08-19'] = ['2026-08-18', '2026-08-19']
  hors métropole, non lus : ['donnees_2025_reg02.parquet', 'donnees_2025_reg04.parquet']
  ok   Export_OpenData_SNCF_GTFS_NewTripId.zip présent dans data-raw/ (jamais retéléchargé)
  Export_OpenData_SNCF_GTFS_NewTripId.zip : 5547556 octets, sha256 0abd6918c870c6495a722406bc0c477f8d49ad4639dd9f4513b3d5f9331eaa73
  ok   Export_OpenData_SNCF_GTFS_NewTripId.zip : sha256 égal à celui retenu
  ok   services-calcul/ors-grandes-lignes.jsonl présent dans data-raw/ (jamais retéléchargé)
  services-calcul/ors-grandes-lignes.jsonl : 1680145 octets, sha256 90725176eaf96d668411435f2030911584143e0826ab3e8e288918cdb123ae04
  ok   services-calcul/ors-grandes-lignes.jsonl : sha256 égal à celui retenu
  écrit : data-raw/services-sources.info.json
```
46 contrôles « ok », aucun « ÉCHEC ».

## Part 0a — l'extrait des carreaux (D11)

Commande (depuis la racine du dépôt, DuckDB 2.0.0 de l'essai de /spec, resté dans son dossier temporaire, jamais installé ; aucun téléchargement de DuckDB n'a été nécessaire) :
`<scratchpad de /spec>/duckdb-2.0.0/duckdb -no-agent -batch -cmd "SET extension_directory='<…>/duckdb-2.0.0/ext'" -f scripts/data/services-extrait.sql`

**Temps de l'extraction retenue : 9 min 24 s** (12:38:29 → 12:47:53), 13 régions lues à distance de 17 s (Île-de-France) à 75 s (Nouvelle-Aquitaine). Place libre avant chaque région : 23,4 à 26,4 Gio (seuil d'arrêt : 6).

### Ce que le fichier a montré : un carreau a une ligne par IRIS, et ce sont des parts
Le plan prévoyait une ligne par (commune, carreau, population). Le fichier a jusqu'à 6 lignes par commune, carreau et type : elles diffèrent par la colonne `iris` (non lue pendant /spec), et portent la même population et la même durée.

| | Valeur |
|---|---:|
| Couples (commune, carreau) | 2 271 654 |
| dont à cheval sur plusieurs IRIS de leur commune | 63 459 (2 à 6 parts) |
| Parts d'un même carreau aux populations différentes | 0 |
| Parts d'un même carreau aux durées différentes (21 types) | 0 |
| Population des carreaux, **toutes les parts additionnées** | **62 865 526** |
| Population des carreaux, une seule part par carreau | 55 150 992 |

Les parts additionnées redonnent l'ordre de grandeur de la population de métropole couverte par les carreaux (Filosofi) ; une seule part en perd 7,7 millions (12 %), surtout en ville : sur l'essai de /spec, Bordeaux 168 664 habitants des carreaux avec une part au lieu de 228 782, Le Havre 116 855 au lieu de 160 315, Auch 17 147 au lieu de 20 653. **Ce sont des parts**, comme le dit le dessin du fichier (« population de la commune ou de l'IRIS couverte par le carreau ») : l'extrait garde une ligne par (commune, IRIS, carreau), et la population d'une commune dans un carreau est la somme de ses lignes. L'essai de /spec les additionnait déjà (`sum(pop)` par commune, carreau et type) : ses valeurs restent cohérentes avec cet extrait. *Décision de la tâche 0a* (voir le rapport `taches/T0a.md`).

### Sortie des contrôles de `services-extrait.sql`
```
 regions | lignes  | communes | plus_d_une_population | plus_d_une_ligne_par_type | dans_deux_regions | controle
 13      | 2342797 | 34778    | 0                     | 0                         | 0                 | NULL
 communes_carreaux | a_plusieurs_iris | parts_au_plus | parts_de_populations_differentes | parts_de_durees_differentes | pop_toutes_parts | pop_une_part_par_carreau
 2271654           | 63459            | 6             | 0                                | 0                           | 62865526.0       | 55150992.0
 nationales_lignes | nationales_codes | controle
 186               | 110              | NULL
 lignes_relues | communes_relues | pop_relue  | avec_medecin | avec_gare_nationale
 2342797       | 34778           | 62865526.0 | 2342453      | 2327385
 nationales_relues
 110
```
- « une seule population par commune et carreau » (contrôle du plan) : vrai aussi au niveau de la commune et du carreau (0 parts de populations différentes) ; l'arrêt porte sur la clé (commune, IRIS, carreau).
- 34 778 codes de commune = les 34 746 communes de la carte, moins Paris, Lyon et Marseille, plus leurs 45 arrondissements, moins les 10 communes sans aucun carreau des mesures de /spec (34 746 − 3 + 45 − 10).

### `data-raw/services-carreaux.csv.gz`
2 342 797 lignes (hors en-tête), 34 778 communes, 25 colonnes, 111 794 248 octets, sha256 `1b3d4fc50bec226c8cfac5ce4cbea29d6e757da8ad4b49e595f6b375f6857dc8`. Les 3 premières lignes :
```
depcom,iris,idSrc,pop,D265,B104,B105,B201,B202,D502,C107,C108,C109,C201,C301,C302,C501,C502,C503,C504,C505,C509,E107,E108,E109
01001,0000,3927600_2574600,3.0,9.15,23.06,8.06,15.1,6.22,7.79,5.92,2.97,10.19,8.24,8.24,9.31,29.77,29.06,45.07,44.76,53.04,58.73,28.05,22.31,17.15
01001,0000,3927800_2571000,7.0,6.26,22.16,7.27,11.75,6.97,6.68,7.89,5.71,7.31,7.23,7.31,7.19,32.79,32.09,50.65,50.34,52.15,55.84,31.07,19.43,20.18
01001,0000,3927800_2571200,3.0,5.92,22.5,6.93,12.09,6.63,6.34,7.55,5.37,6.96,6.89,6.96,6.85,32.45,31.75,50.31,50.0,52.49,55.51,30.73,19.09,19.84
```
Cases vides (aucune ligne du fichier pour ce type), information : D265 344, B104 733, B105 213, B201 654, D502 446, C107 733, C108 1, C109 733, C201 291, C301 732, C302 733, C501 733, C502 733, C503 733, C504 15 412, C505 15 412, C509 733, E107 15 412, E108 15 412, E109 733 (15 412 ≈ les lignes de Corse, 14 679, et des îles sans pont ; laissé à la tâche 0b, qui applique R52).

### `data-raw/services-nationales.csv`
110 codes tels que publiés (arrondissements compris), sha256 `fbe583d5c1b977b958c1dfb912e1692d43a2f824dccdba82baad33e250f478df` ; 105 communes une fois Paris, Lyon et Marseille réunies (`gares.py`).

### Premier passage, refait
Un premier passage complet (12:26 → 12:34, 8 min 28 s) regroupait par commune et carreau sans l'IRIS ; il a montré les parts (ci-dessus) et un défaut du contrôle de place libre (`.shell sh -c "…"` perdait les options de df, qui comptait en blocs de 512 octets : 46,9 « Gio » lus pour 23 réels ; leçon `docs/solutions/2026-11-24-duckdb-shell-une-seule-chaine.md`). Les deux sont corrigés dans le script versionné, et l'extraction a été refaite (passage retenu ci-dessus). `services-nationales.csv` est identique d'un passage à l'autre (même sha256).

## Part 0a — les gares grandes lignes recalculées (H170)

Commande : `python3 -I scripts/data/gares.py data-raw public/data` (12:48, sur l'extrait retenu). Sortie :
```
Fichiers retenus
  ok   Export_OpenData_SNCF_GTFS_NewTripId.zip : sha256 0abd6918c870c6495a722406bc0c477f8d49ad4639dd9f4513b3d5f9331eaa73 (H170)
  ok   services-calcul/ors-grandes-lignes.jsonl : sha256 90725176eaf96d668411435f2030911584143e0826ab3e8e288918cdb123ae04 (H171)
Gares à TGV ou Intercités (H170)
  gares françaises avec TGV ou Intercités : 239 ; avec TGV : 186
  ok   mêmes gares que l'essai de /spec (239 recalculées, 239 dans gares-grandes-lignes.csv)
  ok   arrêts par jour égaux au centième près pour les 239 gares (écarts : [])
  ok   communes égales pour les 239 gares (écarts : [])
Communes à gare nationale (E107 de l'Insee)
  services-nationales.csv : 110 codes, 105 communes une fois Paris, Lyon et Marseille réunies
  ok   égales à nationales-communes.csv de /spec (105 communes ; en plus : [], en moins : [])
Gares ajoutées (au moins 4 arrêts par jour, hors communes à gare nationale, Vendôme nationale)
  ok   61 gares ajoutées (attendu 61)
  ok   mêmes UIC que ors-grandes-lignes.jsonl (61 gares ; en plus : [], en moins : [])
Trajets d'openrouteservice (H171)
  103110 trajets, 34370 communes ; 34364 communes attendues (hors Corse, îles sans pont et population 0)
  ok   103110 trajets (attendu 103110), aucun en double (0)
  ok   chaque commune attendue a ses 3 trajets (0 sans : [])
  ok   aucun trajet sans temps (0 : [])
  communes avec des trajets hors des attendues (population 0, non lues ensuite) : 6 ['55039', '55050', '55139', '55189', '55239', '55307']
  information : communes dont les 3 gares ne sont pas les 3 plus proches de la mairie à vol d'oiseau : 0 []
  ok   écrit et relu : data-raw/services-gares.csv (61 gares)
```
- Seuil appliqué sur les arrêts entiers des 28 jours (TGV + Intercités ≥ 112), sans passer par les arrondis au centième : même résultat que l'essai (61 gares, mêmes UIC).
- Les 6 villages détruits de la Meuse (population 0) ont des trajets dans le fichier d'openrouteservice (l'essai n'excluait que la Corse et les îles) ; R52 ne leur donne aucun temps : la tâche 0b ne les lit pas.
- `data-raw/services-gares.csv` : 61 gares, sha256 `9bb7b0987d33ebda858ad4bcd440d330d6bea06b1d9ba39d696e6a084174a3c1` (identique sur les deux passages) ; premières lignes : Toul (54528, 4,0 Intercités par jour), Neufchâteau (88321), Culmont - Chalindrey (52155).

## Part 0b — les temps de chaque commune, servis

Commande : `python3 -I scripts/data/services.py` (2026-11-24, 13:00:20 → 13:00:37, **17 s**). Elle lit les trois fichiers de la part 0a (contrôlés par leur sha256), `public/data/communes.json` et `scripts/data/services-retraits.csv` (en-tête seul : aucun retrait), et écrit `public/data/services.json` et `public/data/gares-grandes-lignes.csv`. Sortie complète, liste des 85 communes comprise : [`captures/T0b-sortie-services.txt`](captures/T0b-sortie-services.txt).

### Ce que la lecture a montré
- **Les lignes d'une commune se suivent** dans l'extrait (34 778 codes, aucune reprise) : chaque commune est résumée (ses 10 médianes non arrondies et sa population) dès qu'elle est lue, sans garder ses 2,3 millions de lignes en mémoire ; les arrondissements de Paris, Lyon et Marseille sont réunis à la fin. Une commune qui reparaîtrait plus loin arrête le script.
- **Les populations des carreaux ne sont pas toutes entières** : 2 273 378 lignes à une décimale (« 3.0 »), les autres à 2, 3 ou 13 à 16 décimales (« 62.166666666666664 », « 3.3333333333333335 » : écriture de flottants ; plus petite population non nulle : 0,5). Les durées ont au plus 2 décimales. Le script lit donc les populations en entiers de 10⁻¹⁶ habitant et les durées en centièmes de minute : la médiane (« la population cumulée atteint la moitié », égalité exacte retenue, H157) et l'arrondi (H156) se font sans erreur de virgule flottante. Un nombre à plus de décimales arrête le script.

### Sortie des contrôles (tous « ok »)
```
Fichiers de la tâche 0a
  ok   services-carreaux.csv.gz : sha256 1b3d4fc50bec226c8cfac5ce4cbea29d6e757da8ad4b49e595f6b375f6857dc8
  ok   services-gares.csv : sha256 9bb7b0987d33ebda858ad4bcd440d330d6bea06b1d9ba39d696e6a084174a3c1
  ok   services-calcul/ors-grandes-lignes.jsonl : sha256 90725176eaf96d668411435f2030911584143e0826ab3e8e288918cdb123ae04
Communes de la carte
  ok   34746 communes, codes distincts (attendu 34746)
  ok   population 0 : ['55039', '55050', '55139', '55189', '55239', '55307']
  ok   H161 : les 16 îles sans pont présentes avec leurs noms (17004 Île-d'Aix, 22016 Île-de-Bréhat, 29082 Île-de-Batz, 29083 Île-de-Sein, 29084 Île-Molène, 29155 Ouessant, 56009 Bangor, 56069 Groix, 56085 Hœdic, 56086 Île-d'Houat, 56087 Île-aux-Moines, 56088 Île-d'Arz, 56114 Locmaria, 56152 Le Palais, 56241 Sauzon, 85113 L'Île-d'Yeu)
  ok   Noirmoutier : 4 communes, toutes sur la carte, aucune dans la liste des îles sans pont
  ok   Ré : 10 communes, toutes sur la carte, aucune dans la liste des îles sans pont
  ok   Oléron : 8 communes, toutes sur la carte, aucune dans la liste des îles sans pont
Carreaux (services-carreaux.csv.gz)
  ok   codes des carreaux tous sur la carte, Paris, Lyon et Marseille réunies (34736 communes ; hors carte : [])
  ok   34736 communes avec au moins un carreau habité (attendu 34736, D2)
  ok   les 10 sans carreau sont celles des mesures : 09304 Suzan, 26375 Villefranche-le-Château, 29083 Île-de-Sein, 29084 Île-Molène, 55039 Beaumont-en-Verdunois, 55050 Bezonvaux, 55139 Cumières-le-Mort-Homme, 55189 Fleury-devant-Douaumont, 55239 Haumont-près-Samogneux, 55307 Louvemont-Côte-du-Poivre
Trajets depuis la mairie (ors-grandes-lignes.jsonl, H171)
  ok   34364 communes avec 3 trajets = communes hors population 0, îles sans pont et Corse (34364)
Temps (R52)
  ok   services-retraits.csv : colonnes ['code', 'service', 'preuve']
  retraits (D12, services-retraits.csv) : 0 []
Fichier servi, relu (public/data/services.json)
  ok   34746 codes dans l'ordre de communes.json, 10 chaînes de 34746 caractères
  ok   caractères de l'alphabet seulement (« 0 » jamais écrit)
  ok   chaque temps relu égal au temps calculé (61 = « 61 ou plus »)
  ok   iles_sans_pont : 16 codes de H161
  ok   34738 communes avec au moins un temps (attendu 34738) ; sans : 29083 Île-de-Sein, 29084 Île-Molène, 55039 Beaumont-en-Verdunois, 55050 Bezonvaux, 55139 Cumières-le-Mort-Homme, 55189 Fleury-devant-Douaumont, 55239 Haumont-près-Samogneux, 55307 Louvemont-Côte-du-Poivre
  ok   sans temps = les sans carreau, moins Suzan et Villefranche-le-Château
  ok   Suzan (09304) : seulement « Gare grandes lignes », depuis la mairie (61 min)
  ok   Villefranche-le-Château (26375) : seulement « Gare grandes lignes », depuis la mairie (61 min)
  ok   les 6 communes de population 0 sans aucun temps
  ok   AC-13 : Auch (32013) {'medecin': 2, 'commerce': 2, 'creche': 3, 'ecole': 2, 'college': 3, 'lycee': 3, 'superieur': 4, 'gare': 4, 'gare_regionale': 4, 'gare_grandes_lignes': 61}
  ok   AC-13 : Bordeaux (33063) {'medecin': 1, 'commerce': 1, 'creche': 1, 'ecole': 1, 'college': 2, 'lycee': 2, 'superieur': 3, 'gare': 5, 'gare_regionale': 7, 'gare_grandes_lignes': 7}
  ok   AC-13 : Mende (48095) {'superieur': 2, 'gare': 3, 'gare_regionale': 61, 'gare_grandes_lignes': 61}
  ok   AC-13 : Les Sables-d'Olonne (85194) {'gare_grandes_lignes': 4}
  ok   AC-13 : L'Île-d'Yeu (85113) {'medecin': None, 'lycee': None, 'superieur': None, 'gare': None, 'gare_regionale': None, 'gare_grandes_lignes': None, 'commerce': 3}
  ok   poids : 625730 octets bruts, 304116 octets en gzip -9 (limite 350000, H162)
Gares grandes lignes (public/data/gares-grandes-lignes.csv)
  ok   61 gares écrites et relues, colonnes ['uic', 'nom', 'lon', 'lat', 'tgv_jour', 'intercites_jour', 'code']
```
« 61 » = « 61 min ou plus » (lettre `z` du fichier), affiché « plus d'une heure ». Les 6 communes de population 0 sont contrôlées une à une (lignes « AC-13 » non affichées quand elles passent). Les 2 communes sans carreau qui gardent un temps, Suzan et Villefranche-le-Château, ont « Gare grandes lignes » à plus d'une heure (61 ou plus) : égal à l'essai de /spec.

### Comptes refaits sur le fichier servi, à côté de ceux des mesures de /spec
Communes à temps inférieur ou égal au seuil, au-delà de 60 min, sans chiffre ; valeurs lues dans `services.json` (ce que la page compare). « — » : seuil non mesuré pendant /spec.
```
  service              |             ≤ 5 |            ≤ 10 |            ≤ 15 |            ≤ 20 |            ≤ 30 |            ≤ 45 |            ≤ 60 |             >60 |            sans
  medecin              |   14232 / 14232 |   27960 / 27960 |   33135 / 33135 |       34280 / — |   34643 / 34643 |       34724 / — |       34732 / — |           1 / 1 |         13 / 13
  commerce             |   16653 / 16653 |   30113 / 30113 |   33936 / 33936 |       34577 / — |   34713 / 34713 |       34733 / — |       34735 / — |           1 / 1 |         10 / 10
  creche               |     8128 / 8128 |   20147 / 20147 |   28806 / 28806 |       32601 / — |   34462 / 34462 |       34714 / — |       34728 / — |           1 / 1 |         17 / 17
  ecole                |   26483 / 26483 |   33483 / 33483 |   34543 / 34543 |       34682 / — |   34724 / 34724 |       34736 / — |       34736 / — |           0 / 0 |         10 / 10
  college              |     6682 / 6682 |   20098 / 20098 |   29848 / 29848 |       33202 / — |   34442 / 34442 |       34705 / — |       34727 / — |           3 / 3 |         16 / 16
  lycee                |     2616 / 2616 |     8927 / 8927 |   17231 / 17231 |   24523 / 24523 |   32094 / 32094 |       34355 / — |       34638 / — |         90 / 90 |         18 / 18
  superieur            |       618 / 618 |     2409 / 2409 |     5491 / 5491 |     9402 / 9402 |   18120 / 18120 |   28674 / 28674 |   33211 / 33211 |     1517 / 1517 |         18 / 18
  gare                 |     4471 / 4471 |   11897 / 11897 |   19024 / 19024 |       24424 / — |   30668 / 30668 |       33866 / — |       34589 / — |       139 / 139 |         18 / 18
  gare_regionale       |     1752 / 1752 |     6120 / 6120 |   11795 / 11795 |   17144 / 17144 |   25162 / 25162 |       31266 / — |       33465 / — |       903 / 903 |       378 / 378
  gare_grandes_lignes  |       171 / 171 |     1018 / 1018 |     2918 / 2918 |     5688 / 5688 |   12637 / 12637 |   22736 / 22736 |   29319 / 29319 |     5045 / 5045 |       382 / 382
« Gare grandes lignes » : d'où vient le temps retenu (information)
  Insee (gare nationale) : 23630 ; depuis la mairie (openrouteservice) : 10734 ; passent sous 30 min grâce aux gares ajoutées : 3398
```
**Aucun écart sur les comptes des tables.** Contrôle plus fin (sonde jetable, information) : les 347 460 valeurs du fichier servi (34 746 communes × 10 services, plafonnées à 61 des deux côtés) sont **toutes égales** à celles de l'essai de /spec (`data-raw/services-calcul/lignes-10.csv`) : 0 écart. Les parts par IRIS additionnées (décision de la tâche 0a) redonnent donc exactement l'essai, qui les additionnait aussi.

Un seul écart, dans une information et non dans un temps : la source du temps « Gare grandes lignes » donne 23 630 Insee / 10 734 mairie contre 23 629 / 10 735 dans les mesures de /spec. Portiragnes (34209) a les deux temps exactement égaux (15,64 min vers la gare nationale et depuis la mairie) : le script la compte « Insee », l'essai la départageait par le nom de la gare. Son temps (16 min) ne change pas. « 3 398 communes passent sous 30 min grâce aux gares ajoutées » : égal aux mesures.

### Population des carreaux et population légale (information)
**85 communes** de 500 habitants ou plus ont une population des carreaux à plus de 30 % de leur population légale, comme pendant /spec : 81 en dessous (de − 30 % à − 66 %), 4 au-dessus (Saint-Just 01369 + 32 %, Cantaron 06031 + 34 %, Dommartemont 54165 + 39 %, Bresson 38057 + 39 %). Liste complète, triée par écart : [`captures/T0b-sortie-services.txt`](captures/T0b-sortie-services.txt) (fin du fichier). Les plus grands écarts : Saint-Christol 84107 (475 contre 1 409, − 66 %), Montferrat 83082 (− 61 %), Rutali 2B265 (− 55 %), Gauciel 27280, Saint-Jean-Kourtzerode 57614, Valmeinier 73307 (− 53 à − 52 %).

Pistes d'explication, **non vérifiées** (aucune source lue) : la population des carreaux vient de données fiscales des ménages, alors que la population légale compte aussi les personnes vivant en communauté et celles qui ne déclarent pas en France. Plusieurs communes de la liste ont un camp, une base militaire ou une prison connus — Saint-Christol (plateau d'Albion, Légion étrangère), Montferrat (camp de Canjuers), La Cavalerie (camp du Larzac), Mailly-le-Camp, Meyenheim (base aérienne), Fleury-Mérogis et Réau (prisons) — et d'autres sont frontalières de Genève (Ferney-Voltaire, Ségny, Saint-Just) où vivent des fonctionnaires internationaux. **28 des 85 sont en Corse** (Ajaccio − 34 %, Bastia − 37 %), sans explication trouvée. Aucun effet sur les temps : la médiane se calcule sur les habitants des carreaux, quelle que soit leur somme.

### Poids de `public/data/services.json`
| Mesure | Octets | Attendu (plan) |
|---|---:|---:|
| Brut | 625 730 | — |
| `gzip -9` (CLI, 2026-11-24 13:01) | 304 130 (304 116 par `gzip.compress(…, 9)` dans le script) | ≈ 297 000, **limite 350 000** (H162) |
| `brotli -q 3` (`/opt/homebrew/bin/brotli`, ce que le site envoie) | 237 933 | ≈ 234 000 |

Sous la limite (87 % de 350 Ko). L'estimation du plan était faite sur une maquette du format (valeurs de l'essai, identiques) ; la cause des 2 % de plus (ordre des clés, liste des îles, autre écriture) n'est pas recherchée. sha256 `b89a46e485e0e4dca22dbb6beac4356f28d266d3e7f6e341e1c4c2c0cc092056`.

`public/data/gares-grandes-lignes.csv` : les 61 gares de `services-gares.csv`, mêmes colonnes et valeurs (fins de ligne `\n` au lieu de `\r\n`), sha256 `0e8d690f0a0ee122789d77df0c6e3c9699cfd0ba8524c6ee3f2ccfec14cfac8d`.

### Relecture par la fonction de la page (`lireServices` de `src/domain/services.ts`)
Sonde jetable, `node --experimental-strip-types`, 2026-11-24 13:01 ([`captures/T0b-relecture-5-communes.txt`](captures/T0b-relecture-5-communes.txt)) :
```
34746 communes ; îles sans pont : 17004 22016 29082 29083 29084 29155 56009 56069 56085 56086 56087 56088 56114 56152 56241 85113
Auch (32013) : Médecin 2 min · Commerce alimentaire 2 min · Crèche 3 min · École 2 min · Collège 3 min · Lycée 3 min · Supérieur 4 min · Gare 4 min · Gare régionale 4 min · Gare grandes lignes plus d’une heure
Bordeaux (33063) : Médecin 1 min · Commerce alimentaire 1 min · Crèche 1 min · École 1 min · Collège 2 min · Lycée 2 min · Supérieur 3 min · Gare 5 min · Gare régionale 7 min · Gare grandes lignes 7 min
Mende (48095) : Médecin 2 min · Commerce alimentaire 2 min · Crèche 3 min · École 2 min · Collège 2 min · Lycée 2 min · Supérieur 2 min · Gare 3 min · Gare régionale plus d’une heure · Gare grandes lignes plus d’une heure
Les Sables-d'Olonne (85194) : Médecin 2 min · Commerce alimentaire 2 min · Crèche 3 min · École 2 min · Collège 4 min · Lycée 4 min · Supérieur 9 min · Gare 5 min · Gare régionale 5 min · Gare grandes lignes 4 min
L'Île-d'Yeu (85113) [île sans pont] : Médecin pas de chiffre · Commerce alimentaire 3 min · Crèche 3 min · École 3 min · Collège 3 min · Lycée pas de chiffre · Supérieur pas de chiffre · Gare pas de chiffre · Gare régionale pas de chiffre · Gare grandes lignes pas de chiffre
```
(Le texte « plus d'une heure » de la sonde n'est pas celui de la page : la fiche est la tâche 1. Pour L'Île-d'Yeu, la fiche dira « aucune sur l'île » pour les trois gares, R54.)

## Tâche 3b — réaction de la carte quand on coche un service (H163)
Mesurée avant de brancher « Scolarité », sur les gestes déjà construits en 3a. Script d'emploi (tâche 3b d'emploi) recopié sans changement de méthode, gestes de services ajoutés : `captures/T3b-mesure-reaction.mjs` ; sortie : [`captures/T3b-reaction.txt`](captures/T3b-reaction.txt). `npx vite preview --port 4180`, version construite ffa5f40 (fin de 3a), vraies données, 1 440 × 900, fond uni, **processeur ralenti 4 fois** (protocole DevTools), rendu logiciel ; du `keydown` (capture) à la deuxième image qui suit le changement de l'adresse ; 15 essais par sens, médiane ; 2 tours ; le témoin, « Ville dense » et la mer remesurés dans le même tour. 2026-11-24 15:38-15:41, charge 4,56 au début, 3,54 à la fin.

| Geste (version ffa5f40) | Communes décolorées | Tour 1 | Tour 2 | Écart au témoin |
|---|---:|---|---|---|
| Témoin : curseur du prix, un cran | — | 161 ms | 162 ms | — |
| Cases de la mer 50 ↔ 100 km (H90) | — | 159 ms | 159 ms | − 2 à − 3 ms |
| « 5 min » pour « Médecin » cochée | 20 504 (34 674 → 14 170) | 192 ms | 177 ms | + 15 à + 31 ms |
| « 5 min » pour « Médecin » décochée | 20 504 recolorées | 227 ms | 227 ms | + 65 à + 66 ms |
| « 10 min » pour « Gare » en « Grandes lignes » cochée | 33 667 (34 674 → 1 007) | 194 ms | 195 ms | + 33 ms |
| « 10 min » pour « Gare » en « Grandes lignes » décochée | 33 667 recolorées | 277 ms | 277 ms | **+ 115 à + 116 ms** |
| « Ville dense » cochée (en ligne, référence de H163) | 34 031 (34 674 → 643) | 194 ms | 194 ms | + 32 à + 33 ms |
| « Ville dense » décochée (en ligne, référence de H163) | 34 031 recolorées | 277 ms | 276 ms | **+ 114 à + 116 ms** |

À côté, les mesures des tranches d'avant (même méthode, médianes, témoin à 160-162 ms) :

| Tranche, tâche | Geste | Écart au témoin |
|---|---|---|
| Mairies, T0 (2026-10-18) | « Ville dense » cochée / décochée | + 17 / + 100 ms |
| Mairies, T2 (2026-10-18, vrai filtre) | « Centre » cochée / décochée (3 passages) | + 32 à + 33 / **+ 116 à + 131 ms** |
| Mairies, T2 | « Ville dense » décochée (3 passages) | + 116 à + 131 ms |
| Emploi, T0b (2026-11-21) | « Ville dense » cochée / décochée | + 18 à + 30 / + 101 à + 115 ms |
| Emploi, T3b (2026-11-21, vrai filtre) | « 10 % » des infirmiers cochée / décochée (28 458 communes) | + 16 à + 17 / + 83 ms |
| Emploi, T3b | « Ville dense » cochée / décochée | + 16 à + 19 / + 101 à + 113 ms |

**Lecture.** Le cas du plan (« 5 min » pour « Médecin », environ 20 000 communes) reste loin de la limite : + 31 ms au plus pour décolorer, + 66 ms pour recolorer. Le cas de la gare en « Grandes lignes » décolore presque toute la carte (33 667 communes, presque autant que « Ville dense ») et coûte **exactement ce que coûte « Ville dense » dans le même tour** (277 contre 277 ms, puis 277 contre 276 ms) : + 116 ms au tour 1 et + 115 ms au tour 2, quand la référence de H163 mesure + 116 et + 114 ms. L'écart d'1 ms à la limite tient au témoin (161 ou 162 ms) et reste sous la durée d'une image (16,7 ms) ; « Centre » décochée, en ligne depuis mairies, a mesuré jusqu'à + 131 ms. Le coût dépend du nombre de communes recolorées, pas du filtre : recolorer toute la carte coûte environ 7 images de plus que le témoin, quel que soit le réglage. Une scolarité active (un niveau à 5 min) décolorera moins que la gare en « Grandes lignes ». Lu comme **égal à la limite, pas au-delà** (décision du builder de 3b, écrite dans son rapport) : la scolarité est branchée.

Ce que la mesure ne couvre pas : un vrai téléphone (le ralentissement × 4 en tient lieu, comme dans les tranches d'avant) ; le fond Plan IGN (fond uni, comme toutes les mesures de réaction) ; une scolarité cochée (mesurée sur les gestes de 3a, avant le branchement, comme le plan le demande).

## Retraits D12 (2026-11-25, après la démo)
4 temps jugés faux par Vincent le 2026-11-24 (tableau `credibilite-services.md`, tâche 0c) écrits dans `scripts/data/services-retraits.csv` et passés de « plus d'une heure » à « pas de chiffre » : Tende (06163) commerce alimentaire et collège, Roscanvel (29238) crèche et collège ; `python3 -I scripts/data/services.py` : 30 contrôles « ok », aucun « ÉCHEC » ([`captures/retraits-D12-sortie-services.txt`](captures/retraits-D12-sortie-services.txt)) ; relu par `lireServices` : 347 460 valeurs comparées au fichier d'avant, 4 différences, ces 4-là ([`captures/retraits-D12-comparaison.txt`](captures/retraits-D12-comparaison.txt)) ; `public/data/services.json` : sha256 `33764770f811c1bce33b8c6ddb27be6d10d62fefd753d8cdfb8d030a4dca2526`, 625 730 octets bruts (inchangé), 304 114 en `gzip -9` du script (304 128 en CLI ; limite 350 000) ; `gares-grandes-lignes.csv` inchangé.
