# Mesures de Claude sur les fichiers BMO 2026 — 2026-11-21

Le chercheur n'avait pas pu ouvrir le fichier xlsx (voir `../agents/donnees.md`, « Non trouvé »). Claude l'a lu avec Python, sans dépendance : un xlsx est une archive zip de fichiers XML. Les scripts de ce dossier refont chaque chiffre. Ce sont des mesures sur les fichiers eux-mêmes, et les fichiers viennent tous du même producteur (France Travail).

## Fichiers lus

| Fichier | URL | Last-Modified | sha256 |
|---|---|---|---|
| `Base-open-data-BMO-2026.xlsx` (3 755 481 octets) | https://www.francetravail.org/files/live/sites/peorg/files/documents/Statistiques-et-analyses/Open-data/BMO/Base-open-data-BMO-2026.xlsx | Tue, 21 Apr 2026 07:03:06 GMT | `735d0443b799b4c18c145055f87244a355a48b6286ee98ddbab272491d9792e0` |
| `Bassins_d'emploi_2026.xlsx` (1 410 342 octets), lié depuis la page de méthode (« Cliquez ici pour accéder au fichier des bassins d'emploi ») | https://statistiques.francetravail.org/bmo/Handlers/HTFile.ashx?MEDIAID=188096 | Fri, 17 Apr 2026 08:43:50 GMT | `3c7f5048491b90d21cfb16afdacb98f60b03a127b34bc871fd09fa41c09da455` |
| Page de méthode | https://statistiques.francetravail.org/bmo/static/methode_2026 | lue le 2026-11-21 | — |

Commandes, depuis un dossier qui contient les deux fichiers téléchargés :
`python3 -I lire_xlsx.py Base-open-data-BMO-2026.xlsx bmo` → `bmo-sheet1.csv`, `bmo-sheet2.csv` ; `python3 -I lire_xlsx.py "Bassins_d'emploi_2026.xlsx" bassins` → `bassins-sheet1.csv` ; puis `python3 -I mesure_bmo.py bmo-sheet2.csv`, `python3 -I mesure_bmo2.py bmo-sheet2.csv`, `python3 -I jointure.py <repo>/public/data/communes.json bassins-sheet1.csv bmo-sheet2.csv`.

## Fichier BMO 2026

- Deux feuilles : `Description_des_variables` et `BMO_2026_open_data` (53 786 lignes de données).
- Colonnes : `annee`, `Code métier BMO`, `Nom métier BMO`, `Famille_met`, `Lbl_fam_met`, `REG`, `NOM_REG`, `Dept`, `NomDept`, `BE26`, `NOMBE26`, `clpe`, `met` (« Nombre de projet de recrutement »), `xmet` (« … jugés difficiles »), `smet` (« … saisonniers »). La feuille de description nomme la colonne de bassin `BE25`/`NOMBE25`, mais les données disent `BE26`/`NOMBE26`.
- **Maille** : une ligne par métier × bassin × comité local pour l'emploi (`clpe`). Un bassin peut donc avoir plusieurs lignes pour un métier (Bordeaux : 2 ou 3) ; il faut additionner pour obtenir le bassin.
- **Métropole** (départements hors 97x) : 51 641 lignes, 96 départements, **389 bassins**, **217 métiers**, 8 grandes familles (`Famille_met`), 21 domaines (1re lettre du code) et 81 groupes (3 premiers caractères du code).
- **Cases masquées** : la valeur `*` remplace le chiffre. 24,3 % des lignes de métropole ont `met = *`.
- **Couverture des couples bassin × métier** (389 × 217 = 84 413 couples possibles) : **41,1 % ont un chiffre**, 12,2 % sont entièrement masqués, **46,7 % sont absents du fichier**, et 1 815 sont masqués en partie (une ligne `clpe` masquée, une autre chiffrée). Le fichier ne dit pas si « absent » veut dire « aucun projet » ou « non publié » : la page de méthode lue n'en parle pas.
- Valeurs publiées : de 5 à 8 733 projets par ligne, médiane 21. Total des valeurs publiées en métropole : 2 164 147 projets (hors cases masquées). Par bassin : de 118 (Revin) à 118 850, médiane 3 247.
- Exemples (`met`, `xmet`, `smet` par ligne `clpe`) :
  - M2X90 « Ingénieurs et cadres d'étude, recherche et développement en informatique et télécom » : Bordeaux 121 + 621 ; Nantes 962 + `*` ; Toulon 109 ; La Rochelle `*` ; Mauriac absent.
  - V1X80 « Infirmiers et sages-femmes » : Bordeaux 31 + 595 + `*` ; Nantes 560 + 10 ; La Rochelle 66 ; Toulon 11 + 165 ; Mauriac 20.
  - L5X90 « Cadres administratifs, comptables et financiers (hors juristes) » : Bordeaux 18 + 116 ; La Rochelle 25 ; Toulon 37 ; Mauriac absent.

## Page de méthode (extraits)

- « L'enquête BMO est exploitable à un niveau géographique fin, le bassin d'emploi. Cette notion de bassin d'emploi fait référence au découpage administratif de France Travail et peut couvrir le territoire d'une ou plusieurs agences France Travail. Ainsi, pour l'enquête BMO 2026, il y avait 406 bassins d'emploi. » (406 en France entière ; 389 en métropole dans le fichier).
- « … une liste de 217 métiers issue de la nomenclature des « Familles Professionnelles » (FAP 2021) ».
- « Les résultats ont ensuite été redressés pour être représentatifs de l'ensemble des établissements, à l'aide d'une procédure de type calage sur marges » ; « plus de 416 000 réponses » ; enquête « adressée … à près de 1,8 million d'établissements ».
- Règle du secret statistique (le seuil sous lequel une case est masquée) : non trouvée dans la page.

## Table commune → bassin 2026

- Feuille `Feuil1`, colonnes `region`, `dep`, `code_commune`, `lib_commune`, `code_bassin_2026`, `lib_bassin_2026` ; 34 990 communes, chacune dans un seul bassin.
- Jointure par code INSEE avec nos 34 746 communes (`public/data/communes.json`, COG 2025) : **34 731 trouvées**. 15 absentes : Paris (75056), Lyon (69123) et Marseille (13055), présents dans la table par arrondissement (Paris → bassin 1107 « T1 Paris » ; Marseille → 9306 ; Lyon → 8428 « LYON CENTRE », ses 9 arrondissements. *Corrigé après vérification : une première version disait « Lyon → 3 bassins : 8439, 8442, 8444 », erreur d'un filtre de `jointure.py` relevée par le vérificateur et recontrôlée par Claude.*), et 12 autres codes (`12218`, `14581`, `15031`, `15035`, `15047`, `15171`, `49126`, `60694`, `69114`, `80832`, `85165`, `85212`), sans doute des changements de communes entre 2025 et 2026 (non vérifié).
- Les 386 bassins de nos communes sont tous dans le fichier BMO. Trois bassins du fichier BMO n'ont aucune de nos communes : 1107 (T1 Paris, joint par ses arrondissements), 8428 (Lyon centre, idem) et 9399 (Monaco).

## Couverture par métier (ajout du 2026-11-21, après vérification)

`python3 -I couverture_metiers.py bmo-sheet2.csv`. Un bassin « a un chiffre » pour un métier si au moins une de ses lignes `clpe` n'est pas `*` ; absent ou masqué partout = pas de chiffre.

- Par métier (217) : bassins avec un chiffre, sur 389 : min 6, **médiane 147**, max 386. Seuls 79 métiers sur 217 ont un chiffre dans au moins la moitié des bassins.
- Exemples : M2X90 ingénieurs et cadres d'étude en informatique 120 ; M1X80 techniciens d'étude et de développement en informatique 131 ; V1X80 infirmiers et sages-femmes 358 ; L5X90 cadres administratifs, comptables et financiers 159 ; L1X60 employés de la comptabilité 281 ; W0X80 professeurs des écoles 28 ; R4X91 technico-commerciaux 170 ; J3X40 conducteurs de véhicules légers 240.
- Par groupe (3 premiers caractères du code, 81 groupes) : min 18, médiane 239 ; 49 groupes sur 81 chiffrés dans au moins la moitié des bassins.
- Par domaine (1re lettre, 21 domaines) : min 57, médiane 348.

## Valeur citée par la spec emploi (ajout du 2026-11-21)

- V1X80 « Infirmiers et sages-femmes », bassin de Bordeaux : 626 projets (somme des lignes publiées du bassin `BORDEAUX` dans `bmo-sheet2.csv`), lu le 2026-11-21.
