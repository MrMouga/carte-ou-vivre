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

## Figer les fichiers sans les télécharger
data.gouv.fr publie pour les 13 fichiers leur taille (14,45 Go au total) et une somme de contrôle SHA-1. L'en-tête `Last-Modified` du serveur (20/10/2026 pour la Corse) diffère de la date de l'API (18/08/2026) : ne pas s'en servir pour figer.

## Communes sans chiffre (relecture du 2026-11-23)
- Population 0 : 55039, 55050, 55139, 55189, 55239, 55307 (villages détruits de la Meuse), loyers de 406 à 499 € pour 52 m².
- Habitées sans aucun carreau : Suzan (414 €), Villefranche-le-Château (447 €), Île-de-Sein, Île-Molène.
- Sans temps de gare, hors population 0 : L'Île-d'Yeu, Groix, Ouessant, Île-aux-Moines, Île-de-Batz, Île-de-Sein, Île-d'Houat, Île-d'Aix, Île-Molène, Hœdic, Suzan, Villefranche-le-Château.
