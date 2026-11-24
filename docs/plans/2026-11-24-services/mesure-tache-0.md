# Mesures de la tâche 0 — services
2026-11-24 · Part 0a (sources figées, extrait des carreaux, gares recalculées) par le builder de la tâche 0a. La part 0b (temps des communes, comptes, poids) viendra à la suite.

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
