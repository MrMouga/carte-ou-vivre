# Mesures — services du quotidien
2026-11-23 · mesure exploratoire faite pendant /spec, à refaire en tâche 0 sur les fichiers figés.

## Source
- Jeu Insee « Données sur la localisation et l'accès de la population aux équipements », data.gouv.fr, id `67fe0fe2423db9c4a05d8ced`, Licence Ouverte 2.0, fichiers `donnees_2025_reg*.parquet` mis en ligne les 18 et 19/08/2026.
- Pour chaque carreau habité de 200 m et chaque type d'équipement : durée en voiture vers l'équipement le plus proche (Metric-OSRM, routes OpenStreetMap de 2022, aller simple, sans trafic).
- Citation demandée par l'Insee : « Sources : Insee, base permanente des équipements, distancier Metric-OSRM, © les contributeurs d'OpenStreetMap et du projet OSRM ».
- Définitions lues dans la liste des types de la BPE 2025 : médecin = exercice principal en libéral (RPPS) ; crèche = structure percevant une prestation de la CAF, équipements au 1er janvier N-1 ; gare nationale = au moins 250 000 voyageurs par an, régionale = 100 000 à 250 000, locale = moins de 100 000.
- Lecture : 13 fichiers régionaux de métropole (environ 14 Go) lus à distance avec DuckDB 2.0.0 ; seuls 19 types extraits (201 Mo). DuckDB est resté dans un dossier temporaire : son usage dans les scripts du projet se décide en /breakdown (H165).

## Méthode
Par carreau et par commune : le plus petit temps parmi les types du service. Par commune : médiane pondérée par la population des carreaux (premier temps où la population cumulée atteint la moitié). Paris, Lyon et Marseille : tous leurs arrondissements ensemble. Temps arrondi à la minute, moitié vers le haut, au moins 1.

## Communes dont le temps est sous chaque seuil, sur 34 746
Ces comptes ne comprennent pas les communes sans chiffre, et sont faits avant les cas écartés de D7.

| Service | ≤ 5 min | ≤ 10 min | ≤ 15 min | ≤ 30 min | > 60 min | Sans chiffre |
|---|---:|---:|---:|---:|---:|---:|
| Médecin | 14 232 | 27 960 | 33 135 | 34 643 | 1 | 13 |
| Commerce alimentaire | 16 653 | 30 113 | 33 936 | 34 713 | 1 | 10 |
| École | 26 483 | 33 483 | 34 543 | 34 724 | 0 | 10 |
| Collège | 6 682 | 20 098 | 29 848 | 34 442 | 3 | 16 |
| Crèche | 8 128 | 20 147 | 28 806 | 34 462 | 1 | 17 |
| Gare | 4 471 | 11 897 | 19 024 | 30 668 | 139 | 18 |
| Grande gare (≥ 100 000 voyageurs) | 1 752 | 6 120 | 11 795 | 25 162 | 903 | 378 |

Les « sans chiffre » de la grande gare comptent les 360 communes de Corse.

## Communes connues (minutes, avant arrondi)

| Commune | Médecin | Commerce | École | Collège | Crèche | Gare | Grande gare |
|---|---:|---:|---:|---:|---:|---:|---:|
| Paris | 1,0 | 1,0 | 1,0 | 1,5 | 1,0 | 4,0 | 4,0 |
| Bordeaux | 1,0 | 1,0 | 1,1 | 2,1 | 1,2 | 5,4 | 7,0 |
| Le Havre | 1,6 | 1,0 | 1,0 | 2,0 | 1,7 | 5,8 | 6,4 |
| Les Sables-d'Olonne | 2,2 | 1,9 | 2,2 | 3,6 | 3,4 | 4,8 | 5,5 |
| Auch | 2,2 | 1,9 | 1,7 | 2,5 | 2,9 | 3,9 | 3,9 |
| Mende | 1,9 | 1,8 | 1,8 | 2,0 | 3,4 | 2,8 | 92,2 |
| Chamonix-Mont-Blanc | 2,8 | 1,7 | 1,9 | 3,6 | 2,3 | 1,9 | 5,4 |
| Saint-Véran | 17,3 | 1,0 | 2,3 | 33,4 | 4,9 | 40,2 | 40,2 |
| L'Île-d'Yeu | — | 2,6 | 2,6 | 2,6 | 3,4 | — | — |
| Île-de-Bréhat | 1,0 | 1,0 | 1,0 | 8,4 | 11,1 | 9,4 | 41,2 |

## Valeurs à contrôler en tâche 0
- Tende : commerce et supermarché à 224 min, grande gare à 226 min. Prads-Haute-Bléone : médecin à 110 min. Roscanvel : crèche à 77 min. L'Aiguillon-la-Presqu'île : crèche à 55 min.
- 10 communes sans aucun carreau : Île-Molène, Île-de-Sein, Suzan, Villefranche-le-Château et 6 villages détruits de la Meuse (population 0).
- 85 communes de 500 habitants ou plus ont une population des carreaux à plus de 30 % de leur population légale (non expliqué).
- Les îles : le temps vers le continent compte parfois la traversée (Bréhat, gare à 9 min), alors que la notice dit que les ferries ne sont pas pris en compte « pour les îles de manière générale ».

## Poids
Les 7 temps des 34 746 communes, en minutes entières plafonnées à 61 : 647 Ko bruts et 180 Ko compressés (gzip) sans code ; **918 Ko bruts et 266 Ko compressés avec un code INSEE par ligne**, le format retenu puisque le projet joint toujours par code.

## Lycée et niveaux de gare (mesure du 2026-11-23, après D13)
Lycée = général et/ou technologique (C301) ou professionnel (C302). Comptes de communes à temps inférieur ou égal au seuil, sans chiffre non compris :

| Service | ≤ 5 min | ≤ 10 min | ≤ 15 min | ≤ 20 min | ≤ 30 min | > 60 min | Sans chiffre |
|---|---:|---:|---:|---:|---:|---:|---:|
| Lycée | 2 616 | 8 927 | 17 231 | 24 523 | 32 094 | 90 | 18 |
| Gare d'au moins 100 000 voyageurs (E107, E108) | 1 752 | 6 120 | 11 795 | 17 144 | 25 162 | 903 | 378 |
| Gare nationale (E107) | 92 | 671 | 1 962 | 3 924 | 9 240 | 8 262 | 378 |

Temps vers une gare d'au moins 100 000 voyageurs / une gare nationale : Bordeaux 7 / 7, La Rochelle 6 / 6, Le Havre 6 / 6, Auch 4 / 67, Chamonix-Mont-Blanc 5 / 74, Les Sables-d'Olonne 5 / 82, Saint-Véran 40 / 176, Mende 92 / 137.

Poids du fichier, compressé (gzip), avec le code INSEE : 8 temps avec le seuil de 100 000 voyageurs, 299 Ko ; 8 temps avec la gare nationale, 303 Ko ; 9 temps (trois niveaux de gare), 329 Ko.

## Figer les fichiers sans les télécharger
data.gouv.fr publie pour les 13 fichiers leur taille (14,45 Go au total) et une somme de contrôle SHA-1. L'en-tête `Last-Modified` du serveur (20/10/2026 pour la Corse) diffère de la date de l'API (18/08/2026) : ne pas s'en servir pour figer.

## Communes sans chiffre (relecture du 2026-11-23)
- Population 0 : 55039, 55050, 55139, 55189, 55239, 55307 (villages détruits de la Meuse), loyers de 406 à 499 € pour 52 m².
- Habitées sans aucun carreau : Suzan (414 €), Villefranche-le-Château (447 €), Île-de-Sein, Île-Molène.
- Sans temps de gare, hors population 0 : L'Île-d'Yeu, Groix, Ouessant, Île-aux-Moines, Île-de-Batz, Île-de-Sein, Île-d'Houat, Île-d'Aix, Île-Molène, Hœdic, Suzan, Villefranche-le-Château.

## Supérieur (mesure du 2026-11-23, D17)
Types lus dans la [liste BPE 2025](https://www.insee.fr/fr/metadonnees/source/fichier/BPE25_liste_hierarchisee_TYPEQU.html). Communes à temps inférieur ou égal au seuil, sur 34 728 avec un temps :

| Contenu | ≤ 10 min | ≤ 20 min | ≤ 30 min | ≤ 60 min |
|---|---:|---:|---:|---:|
| UFR seules (C501) | 1 189 | 5 475 | 11 941 | 29 840 |
| Universités et IUT (C501, C502) | 1 830 | 7 825 | 15 875 | 32 550 |
| **Universités et grandes écoles (famille C5, retenu)** | 2 409 | 9 402 | 18 120 | 33 211 |
| Tout le supérieur (C4 et C5) | 5 604 | 17 980 | 27 712 | 34 446 |

Famille C5 : 618 communes à 5 min ou moins, 1 517 au-delà de 60 min, 18 sans chiffre. Une antenne compte comme un établissement : Auch 4 min, Mende 2 min, Les Sables-d'Olonne 9 min, Chamonix-Mont-Blanc 58 min, Saint-Véran 94 min.

## Gares grandes lignes (mesure des 2026-11-23 et 24, D18)
- Le fichier Insee donne, par carreau, la gare la plus proche de chaque catégorie et sa commune, sans son nom : il ne permet pas de retrouver une gare TGV. Taguer les communes à TGV laisse 44 à 60 % des communes impossibles à classer à 30 min.
- Horaires SNCF du 23/11 au 20/12/2026 (H170) : 186 gares françaises à TGV et 239 à TGV ou Intercités. Sur 105 communes à gare nationale, 17 n'ont aucun arrêt TGV (dont Clermont-Ferrand, Limoges, Brive-la-Gaillarde, Caen, Amiens) ; 87 communes à TGV n'ont pas de gare nationale (dont Les Sables-d'Olonne, Arcachon, Aix-les-Bains).
- Gares à TGV ou Intercités selon le seuil d'arrêts par jour, et celles hors des communes à gare nationale : 1 arrêt 226 (120) ; 2 arrêts 207 (103) ; **4 arrêts 163 (61, retenu)** ; 6 arrêts 136 (37) ; 10 arrêts 102 (14).
- Contrôle d'openrouteservice sur 5 gares : 892 trajets commune-gare comparables à l'Insee (au moins 90 % des habitants vers la commune de cette gare), dont 843 pour Bordeaux et Tarbes et 5 pour Saint-Gervais. Écart médian + 1,5 min, 87 % à moins de 5 min, plus grand écart 10,4 min ; même côté du seuil dans 99,0 % des cas à 10 min, 96,2 % à 20 min, 96,0 % à 30 min.
- Quota : le service a refusé la 51e requête du 2026-11-23 (« Quota exceeded »). Cause : l'adresse `api.openrouteservice.org` est dépréciée et n'a plus que 10 % du quota (50 requêtes de matrice par jour), non affiché dans le tableau de bord ([annonce du 2026-08-27](https://ask.openrouteservice.org/t/reducing-the-quota-of-deprecated-api-api-openrouteservice-org/8013)) ; la nouvelle adresse est `api.heigit.org/openrouteservice/v2/matrix` ([annonce du 2026-04-28](https://ask.openrouteservice.org/t/deprecating-api-openrouteservice-org-in-favour-of-api-heigit-org/7912)), 500 requêtes par jour, même clé.
- Calcul : 103 110 trajets vers 61 gares (3 par commune, 34 370 communes hors Corse et îles sans pont), 87 requêtes, les 2026-11-23 et 24 ; aucun trajet manquant.
- Résultat (R52) : le temps vient de l'Insee pour 23 629 communes, d'openrouteservice pour 10 735 ; 3 398 communes passent sous 30 min grâce aux gares ajoutées. Témoins : Auch 67 (Insee), Bordeaux 7, Le Havre 6, La Rochelle 6, Les Sables-d'Olonne 4 (sa gare), Aix-les-Bains 3 (sa gare), Arcachon 54 (sa gare a 2,5 arrêts par jour, sous le seuil), Chamonix-Mont-Blanc 74 (Saint-Gervais, 0,5 arrêt par jour, n'entre pas), Mende 126 (Riom - Châtel-Guyon), Saint-Véran 141 (Modane).

| Service | ≤ 5 min | ≤ 10 min | ≤ 15 min | ≤ 20 min | ≤ 30 min | ≤ 45 min | ≤ 60 min | > 60 min | Sans chiffre |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Supérieur | 618 | 2 409 | 5 491 | 9 402 | 18 120 | 28 674 | 33 211 | 1 517 | 18 |
| Gare grandes lignes | 171 | 1 018 | 2 918 | 5 688 | 12 637 | 22 736 | 29 319 | 5 045 | 382 |

- Poids du fichier à 10 temps, rangé par colonnes avec chaque code une seule fois, temps plafonnés à 61 : 1 175 Ko bruts, **349 Ko compressés (gzip -9)**, 271 Ko en brotli (qualité 11). Avec une ligne par commune et la nationale à la place des grandes lignes : 366 Ko.

## Révision D19, D20 (2026-11-26)
Mesure exploratoire faite pendant /spec, à refaire en tâche 0 sur les fichiers figés (H205).

- **Urgences (D106)** : temps lus dans l'essai de /spec du 2026-11-23 (`mediane.parquet` du dossier temporaire de cette session-là, 19 types, dont D106 et D307), calculé **sans** additionner les parts de carreaux par IRIS (H173 est venu après) : les valeurs peuvent bouger un peu. Sur 34 728 communes avec un temps : 851 à 5 min ou moins, 4 025 à 10, 9 558 à 15, 16 243 à 20, 27 415 à 30, 33 676 à 45, 34 562 à 60, 174 au-delà. Témoins (minutes avant arrondi) : Paris 4,4 ; Bordeaux 4,9 ; Le Havre 4,8 ; Mende 3,9 ; Chamonix-Mont-Blanc 4,2 ; Auch 6,1 ; Les Sables-d'Olonne 6,6 ; Île-de-Bréhat 12,4 ; Saint-Véran 55,4 ; Prads-Haute-Bléone 43,1 ; Tende 227,9 ; L'Île-d'Yeu sans chiffre.
- **Supermarché (B104, B105)** : calculé le 2026-11-26 par la règle de `scripts/data/services.py` sur l'extrait figé `data-raw/services-carreaux.csv.gz` (parts additionnées) : 9 022 à 5 min ou moins, 22 329 à 10, 30 409 à 15, 33 195 à 20, 34 415 à 30, 34 690 à 45, 34 719 à 60, 12 au-delà, 15 sans chiffre. Témoins : Bordeaux 1,36 ; Auch 2,47 ; Mende 2,43 ; Les Sables-d'Olonne 2,38 ; Chamonix-Mont-Blanc 2,66 ; L'Île-d'Yeu 3,81 ; Saint-Véran 34,99 ; Tende 224,3. Hypermarché seul (écarté par D20) : 8 819 à 10 min, Chamonix-Mont-Blanc 22.
- **Pharmacie (D307, écartée par D19)** : 13 887 à 5 min, 28 383 à 10, 33 333 à 15 (médecin : 14 232, 27 960, 33 135).
- **Tolérance pour la tâche 0** : les valeurs d'AC-13 doivent être exactes, sinon retour à Vincent (comme pour les autres temps) ; les comptes de supermarché doivent être identiques (même extrait, même règle) ; les comptes d'urgences peuvent s'écarter de l'essai (parts par IRIS) : un écart de plus de 1 % sur un seuil de 15, 30 ou 45 min est expliqué dans la mesure de la tâche 0, sans arrêt.
- **Poids** : `public/data/services.json` à 10 temps, mesuré le 2026-11-26 : 304 Ko en `gzip -9`, 238 Ko en `brotli -q 3` (H206).
