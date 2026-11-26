-- Extrait des temps d'accès aux équipements (tranche services, tâche 0a ; D11, H158, H165).
--
-- Source : Insee, « Données sur la localisation et l'accès de la population aux équipements » (data.gouv.fr, jeu
-- 67fe0fe2423db9c4a05d8ced, Licence Ouverte 2.0), 13 fichiers régionaux de métropole (14,45 Go), lus à distance sans
-- être téléchargés. Une ligne du fichier = un carreau de 200 m habité (`idSrc`), la commune qu'il couvre (`depcom`), la
-- population de la commune dans le carreau (`pop`), un type d'équipement (`typeeq_id`) et la durée en voiture vers le plus
-- proche (`duree`, minutes). Un carreau à cheval sur plusieurs IRIS d'une commune (`iris`) a une ligne par IRIS : ce sont
-- des parts (même `pop` et même `duree` sur chaque part, mesure de la tâche 0a ; additionnées, les parts redonnent
-- 62,9 millions d'habitants en métropole, contre 55,1 en n'en gardant qu'une), d'où une ligne par part dans l'extrait.
--
-- Prérequis : python3 -I scripts/data/sources.py --services (contrôle les 13 fichiers publiés et écrit leurs adresses
-- dans data-raw/services-sources.info.json ; une lecture différente de celle retenue l'arrête et ce fichier n'est pas écrit).
-- Lancé depuis la racine du dépôt par le CLI DuckDB 2.0.0 gardé dans un dossier temporaire, jamais installé (D11) :
--   <dossier>/duckdb -no-agent -batch -cmd "SET extension_directory='<dossier>/ext'" -f scripts/data/services-extrait.sql
--
-- Aucune règle ici (filtrer, regrouper, mettre en colonnes) ; les règles sont dans services.py et gares.py.
-- Sorties (data-raw/, non versionné) :
--   services-carreaux.csv.gz : une ligne par (depcom, iris, idSrc) avec sa population `pop`, une colonne par type de
--     H158, la durée telle que publiée (non arrondie), vide quand le fichier n'a pas de ligne pour ce type ; la population
--     d'une commune dans un carreau est la somme de ses lignes (une par IRIS) ;
--   services-nationales.csv : les codes distincts de `depcom_equipement` des lignes E107 (communes à gare nationale),
--     tels que publiés (arrondissements de Paris, Lyon et Marseille compris).
-- Contrôles (arrêt sinon) : 13 fichiers notés ; au moins 6 Go libres avant chaque région ; une seule population par
-- commune, IRIS et carreau ; une seule ligne par commune, IRIS, carreau et type ; chaque (commune, IRIS, carreau) dans une
-- seule région ; aucune commune vide pour une gare nationale. Affiché sans arrêt : les carreaux d'une commune à cheval
-- sur plusieurs IRIS, et ceux dont les parts n'ont pas toutes la même population ou la même durée.
.bail on
LOAD httpfs;
SET memory_limit = '5GB';
SET temp_directory = 'data-raw/services-extrait.tmp';
SET preserve_insertion_order = false;

CREATE TABLE fichiers AS SELECT unnest(fichiers, recursive := true) FROM read_json('data-raw/services-sources.info.json');
SELECT count(*) AS fichiers_notes, sum(octets) AS octets,
       CASE WHEN count(*) <> 13 THEN error('ARRET : ' || count(*) || ' fichiers notés au lieu de 13') END AS controle
  FROM fichiers;
SELECT lu_le AS sources_lues_le FROM read_json('data-raw/services-sources.info.json');

-- Les 22 types de H158 (D106, urgences, ajouté par la révision D19 du 2026-11-26, H208 ; B201 et B202 gardés tant que
-- services.py écrit la chaîne provisoire `commerce`).
CREATE MACRO lire_region(u) AS TABLE
  SELECT depcom, iris, idSrc, pop, typeeq_id, duree, depcom_equipement
    FROM read_parquet(u)
   WHERE typeeq_id IN ('D265', 'D106', 'B104', 'B105', 'B201', 'B202', 'D502', 'C107', 'C108', 'C109', 'C201', 'C301', 'C302',
                       'C501', 'C502', 'C503', 'C504', 'C505', 'C509', 'E107', 'E108', 'E109');

-- r = les lignes d'une région (remplacée à chaque région) ; les macros sont vérifiées à leur création.
SET VARIABLE region = '';
CREATE TEMP TABLE r (depcom VARCHAR, iris VARCHAR, idSrc VARCHAR, pop DOUBLE, typeeq_id VARCHAR, duree DOUBLE, depcom_equipement VARCHAR);
.shell "df -k data-raw | awk 'NR==2 {print $4}' > data-raw/services-extrait.libre"

-- Une ligne par commune, IRIS et carreau ; les comptes servent aux contrôles (any_value = la seule valeur, contrôlée à
-- la fin).
CREATE MACRO carreaux_de_r() AS TABLE
  SELECT getvariable('region') AS region, depcom, iris, idSrc, any_value(pop) AS pop,
         count(DISTINCT pop) AS n_pop, count(*) FILTER (WHERE pop IS NULL) AS pop_vides,
         count(*) - count(DISTINCT typeeq_id) AS lignes_en_trop,
         any_value(duree) FILTER (WHERE typeeq_id = 'D265') AS D265,
         any_value(duree) FILTER (WHERE typeeq_id = 'D106') AS D106,
         any_value(duree) FILTER (WHERE typeeq_id = 'B104') AS B104,
         any_value(duree) FILTER (WHERE typeeq_id = 'B105') AS B105,
         any_value(duree) FILTER (WHERE typeeq_id = 'B201') AS B201,
         any_value(duree) FILTER (WHERE typeeq_id = 'B202') AS B202,
         any_value(duree) FILTER (WHERE typeeq_id = 'D502') AS D502,
         any_value(duree) FILTER (WHERE typeeq_id = 'C107') AS C107,
         any_value(duree) FILTER (WHERE typeeq_id = 'C108') AS C108,
         any_value(duree) FILTER (WHERE typeeq_id = 'C109') AS C109,
         any_value(duree) FILTER (WHERE typeeq_id = 'C201') AS C201,
         any_value(duree) FILTER (WHERE typeeq_id = 'C301') AS C301,
         any_value(duree) FILTER (WHERE typeeq_id = 'C302') AS C302,
         any_value(duree) FILTER (WHERE typeeq_id = 'C501') AS C501,
         any_value(duree) FILTER (WHERE typeeq_id = 'C502') AS C502,
         any_value(duree) FILTER (WHERE typeeq_id = 'C503') AS C503,
         any_value(duree) FILTER (WHERE typeeq_id = 'C504') AS C504,
         any_value(duree) FILTER (WHERE typeeq_id = 'C505') AS C505,
         any_value(duree) FILTER (WHERE typeeq_id = 'C509') AS C509,
         any_value(duree) FILTER (WHERE typeeq_id = 'E107') AS E107,
         any_value(duree) FILTER (WHERE typeeq_id = 'E108') AS E108,
         any_value(duree) FILTER (WHERE typeeq_id = 'E109') AS E109
    FROM r GROUP BY depcom, iris, idSrc;
CREATE TABLE carreaux AS FROM carreaux_de_r() LIMIT 0;
CREATE TABLE nationales (code VARCHAR);

-- Avant chaque région : l'heure, la place libre (df, en Kio, écrite par .shell) et l'arrêt sous 6 Gio. La commande de
-- .shell est une seule chaîne entre guillemets, passée telle quelle au shell (écrite `sh -c "…"`, elle perd ses options
-- et df compte en blocs de 512 octets).
CREATE MACRO debut_region() AS TABLE
  SELECT getvariable('region') AS region, strftime(get_current_timestamp(), '%H:%M:%S') AS debut,
         round(k / 1048576, 1) AS gio_libres,
         CASE WHEN k < 6 * 1048576 THEN error('ARRET : moins de 6 Go libres avant la région ' || getvariable('region')) END AS controle
    FROM read_csv('data-raw/services-extrait.libre', header = false, columns = {'k': 'BIGINT'});
CREATE MACRO fin_region() AS TABLE
  SELECT getvariable('region') AS region, strftime(get_current_timestamp(), '%H:%M:%S') AS fin,
         (SELECT count(*) FROM r) AS lignes_lues, (SELECT count(*) FROM carreaux WHERE region = getvariable('region')) AS carreaux;

.mode box
SELECT strftime(get_current_timestamp(), '%H:%M:%S') AS debut_extraction;

SET VARIABLE region = '11';
SET VARIABLE url = (SELECT url FROM fichiers WHERE region = getvariable('region'));
.shell "df -k data-raw | awk 'NR==2 {print $4}' > data-raw/services-extrait.libre"
FROM debut_region();
CREATE OR REPLACE TEMP TABLE r AS FROM lire_region(getvariable('url'));
INSERT INTO carreaux FROM carreaux_de_r();
INSERT INTO nationales SELECT DISTINCT depcom_equipement FROM r WHERE typeeq_id = 'E107';
FROM fin_region();

SET VARIABLE region = '24';
SET VARIABLE url = (SELECT url FROM fichiers WHERE region = getvariable('region'));
.shell "df -k data-raw | awk 'NR==2 {print $4}' > data-raw/services-extrait.libre"
FROM debut_region();
CREATE OR REPLACE TEMP TABLE r AS FROM lire_region(getvariable('url'));
INSERT INTO carreaux FROM carreaux_de_r();
INSERT INTO nationales SELECT DISTINCT depcom_equipement FROM r WHERE typeeq_id = 'E107';
FROM fin_region();

SET VARIABLE region = '27';
SET VARIABLE url = (SELECT url FROM fichiers WHERE region = getvariable('region'));
.shell "df -k data-raw | awk 'NR==2 {print $4}' > data-raw/services-extrait.libre"
FROM debut_region();
CREATE OR REPLACE TEMP TABLE r AS FROM lire_region(getvariable('url'));
INSERT INTO carreaux FROM carreaux_de_r();
INSERT INTO nationales SELECT DISTINCT depcom_equipement FROM r WHERE typeeq_id = 'E107';
FROM fin_region();

SET VARIABLE region = '28';
SET VARIABLE url = (SELECT url FROM fichiers WHERE region = getvariable('region'));
.shell "df -k data-raw | awk 'NR==2 {print $4}' > data-raw/services-extrait.libre"
FROM debut_region();
CREATE OR REPLACE TEMP TABLE r AS FROM lire_region(getvariable('url'));
INSERT INTO carreaux FROM carreaux_de_r();
INSERT INTO nationales SELECT DISTINCT depcom_equipement FROM r WHERE typeeq_id = 'E107';
FROM fin_region();

SET VARIABLE region = '32';
SET VARIABLE url = (SELECT url FROM fichiers WHERE region = getvariable('region'));
.shell "df -k data-raw | awk 'NR==2 {print $4}' > data-raw/services-extrait.libre"
FROM debut_region();
CREATE OR REPLACE TEMP TABLE r AS FROM lire_region(getvariable('url'));
INSERT INTO carreaux FROM carreaux_de_r();
INSERT INTO nationales SELECT DISTINCT depcom_equipement FROM r WHERE typeeq_id = 'E107';
FROM fin_region();

SET VARIABLE region = '44';
SET VARIABLE url = (SELECT url FROM fichiers WHERE region = getvariable('region'));
.shell "df -k data-raw | awk 'NR==2 {print $4}' > data-raw/services-extrait.libre"
FROM debut_region();
CREATE OR REPLACE TEMP TABLE r AS FROM lire_region(getvariable('url'));
INSERT INTO carreaux FROM carreaux_de_r();
INSERT INTO nationales SELECT DISTINCT depcom_equipement FROM r WHERE typeeq_id = 'E107';
FROM fin_region();

SET VARIABLE region = '52';
SET VARIABLE url = (SELECT url FROM fichiers WHERE region = getvariable('region'));
.shell "df -k data-raw | awk 'NR==2 {print $4}' > data-raw/services-extrait.libre"
FROM debut_region();
CREATE OR REPLACE TEMP TABLE r AS FROM lire_region(getvariable('url'));
INSERT INTO carreaux FROM carreaux_de_r();
INSERT INTO nationales SELECT DISTINCT depcom_equipement FROM r WHERE typeeq_id = 'E107';
FROM fin_region();

SET VARIABLE region = '53';
SET VARIABLE url = (SELECT url FROM fichiers WHERE region = getvariable('region'));
.shell "df -k data-raw | awk 'NR==2 {print $4}' > data-raw/services-extrait.libre"
FROM debut_region();
CREATE OR REPLACE TEMP TABLE r AS FROM lire_region(getvariable('url'));
INSERT INTO carreaux FROM carreaux_de_r();
INSERT INTO nationales SELECT DISTINCT depcom_equipement FROM r WHERE typeeq_id = 'E107';
FROM fin_region();

SET VARIABLE region = '75';
SET VARIABLE url = (SELECT url FROM fichiers WHERE region = getvariable('region'));
.shell "df -k data-raw | awk 'NR==2 {print $4}' > data-raw/services-extrait.libre"
FROM debut_region();
CREATE OR REPLACE TEMP TABLE r AS FROM lire_region(getvariable('url'));
INSERT INTO carreaux FROM carreaux_de_r();
INSERT INTO nationales SELECT DISTINCT depcom_equipement FROM r WHERE typeeq_id = 'E107';
FROM fin_region();

SET VARIABLE region = '76';
SET VARIABLE url = (SELECT url FROM fichiers WHERE region = getvariable('region'));
.shell "df -k data-raw | awk 'NR==2 {print $4}' > data-raw/services-extrait.libre"
FROM debut_region();
CREATE OR REPLACE TEMP TABLE r AS FROM lire_region(getvariable('url'));
INSERT INTO carreaux FROM carreaux_de_r();
INSERT INTO nationales SELECT DISTINCT depcom_equipement FROM r WHERE typeeq_id = 'E107';
FROM fin_region();

SET VARIABLE region = '84';
SET VARIABLE url = (SELECT url FROM fichiers WHERE region = getvariable('region'));
.shell "df -k data-raw | awk 'NR==2 {print $4}' > data-raw/services-extrait.libre"
FROM debut_region();
CREATE OR REPLACE TEMP TABLE r AS FROM lire_region(getvariable('url'));
INSERT INTO carreaux FROM carreaux_de_r();
INSERT INTO nationales SELECT DISTINCT depcom_equipement FROM r WHERE typeeq_id = 'E107';
FROM fin_region();

SET VARIABLE region = '93';
SET VARIABLE url = (SELECT url FROM fichiers WHERE region = getvariable('region'));
.shell "df -k data-raw | awk 'NR==2 {print $4}' > data-raw/services-extrait.libre"
FROM debut_region();
CREATE OR REPLACE TEMP TABLE r AS FROM lire_region(getvariable('url'));
INSERT INTO carreaux FROM carreaux_de_r();
INSERT INTO nationales SELECT DISTINCT depcom_equipement FROM r WHERE typeeq_id = 'E107';
FROM fin_region();

SET VARIABLE region = '94';
SET VARIABLE url = (SELECT url FROM fichiers WHERE region = getvariable('region'));
.shell "df -k data-raw | awk 'NR==2 {print $4}' > data-raw/services-extrait.libre"
FROM debut_region();
CREATE OR REPLACE TEMP TABLE r AS FROM lire_region(getvariable('url'));
INSERT INTO carreaux FROM carreaux_de_r();
INSERT INTO nationales SELECT DISTINCT depcom_equipement FROM r WHERE typeeq_id = 'E107';
FROM fin_region();
DROP TABLE r;

-- Contrôles.
SELECT count(DISTINCT region) AS regions, count(*) AS lignes, count(DISTINCT depcom) AS communes,
       count(*) FILTER (WHERE n_pop <> 1 OR pop_vides > 0) AS plus_d_une_population,
       count(*) FILTER (WHERE lignes_en_trop > 0) AS plus_d_une_ligne_par_type,
       count(*) - count(DISTINCT (depcom, iris, idSrc)) AS dans_deux_regions,
       CASE WHEN count(DISTINCT region) <> 13 THEN error('ARRET : ' || count(DISTINCT region) || ' régions lues au lieu de 13')
            WHEN count(*) FILTER (WHERE n_pop <> 1 OR pop_vides > 0) > 0 THEN error('ARRET : plus d''une population (ou aucune) pour une commune, un IRIS et un carreau')
            WHEN count(*) FILTER (WHERE lignes_en_trop > 0) > 0 THEN error('ARRET : plus d''une ligne pour une commune, un IRIS, un carreau et un type')
            WHEN count(*) <> count(DISTINCT (depcom, iris, idSrc)) THEN error('ARRET : une commune, un IRIS et un carreau dans deux régions')
       END AS controle
  FROM carreaux;
-- Information : les parts d'un carreau (une par IRIS de la commune).
SELECT count(*) AS communes_carreaux, count(*) FILTER (WHERE parts > 1) AS a_plusieurs_iris, max(parts) AS parts_au_plus,
       count(*) FILTER (WHERE pops > 1) AS parts_de_populations_differentes,
       count(*) FILTER (WHERE durees > 1) AS parts_de_durees_differentes,
       round(sum(pop_parts)) AS pop_toutes_parts, round(sum(pop_une_part)) AS pop_une_part_par_carreau
  FROM (SELECT depcom, idSrc, count(*) AS parts, count(DISTINCT pop) AS pops, sum(pop) AS pop_parts, any_value(pop) AS pop_une_part,
               count(DISTINCT (D265, D106, B104, B105, B201, B202, D502, C107, C108, C109, C201, C301, C302,
                               C501, C502, C503, C504, C505, C509, E107, E108, E109)) AS durees
          FROM carreaux GROUP BY depcom, idSrc);
SELECT count(*) AS nationales_lignes, count(DISTINCT code) AS nationales_codes,
       CASE WHEN count(*) FILTER (WHERE code IS NULL) > 0 THEN error('ARRET : gare nationale sans commune') END AS controle
  FROM nationales;

COPY (SELECT depcom, iris, idSrc, pop, D265, D106, B104, B105, B201, B202, D502, C107, C108, C109, C201, C301, C302,
             C501, C502, C503, C504, C505, C509, E107, E108, E109
        FROM carreaux ORDER BY depcom, idSrc, iris)
  TO 'data-raw/services-carreaux.csv.gz' (HEADER, COMPRESSION gzip);
COPY (SELECT DISTINCT code FROM nationales ORDER BY code) TO 'data-raw/services-nationales.csv' (HEADER);

-- Relecture des fichiers écrits.
SELECT count(*) AS lignes_relues, count(DISTINCT depcom) AS communes_relues, round(sum(pop)) AS pop_relue,
       count(D265) AS avec_medecin, count(D106) AS avec_urgences, count(E107) AS avec_gare_nationale
  FROM read_csv('data-raw/services-carreaux.csv.gz', header = true, types = {'depcom': 'VARCHAR', 'iris': 'VARCHAR', 'idSrc': 'VARCHAR'});
SELECT count(*) AS nationales_relues FROM read_csv('data-raw/services-nationales.csv', header = true, all_varchar = true);
SELECT strftime(get_current_timestamp(), '%H:%M:%S') AS fin_extraction;
