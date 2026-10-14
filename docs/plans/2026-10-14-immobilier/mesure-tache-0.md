# Mesure — tâche 0 d'immobilier (données)
2026-10-14 16:15 · `python3 scripts/data/sources.py` puis `python3 scripts/data/communes.py` · Rapport : [taches/T0.md](taches/T0.md)

## Le fichier des ventes retenu
- Statistiques DVF d'Etalab, `stats_whole_period.csv` (https://data-pipeline-open.s3.sbg.io.cloud.ovh.net/dvf/stats_whole_period.csv, jeu https://www.data.gouv.fr/datasets/64998de5926530ebcecc7b15), Licence Ouverte.
- Last-Modified : **Fri, 17 Jul 2026 15:22:41 GMT** (le « fichier de juillet 2026 » des mesures de la spec) ; téléchargé le 2026-10-14 à 16:11 ; 30 738 960 octets.
- Empreinte sha256 : **`c691b87045b9bafc30f242e474f919c65ae1180ab6843b8a9feb7161a3abbe68`** (notée par `sources.py` dans `data-raw/stats_whole_period.csv.info.json`, revérifiée par `communes.py` à chaque lancement).
- Période : ventes de **janvier 2021 à décembre 2025** (« 10 semestres disponibles » selon le jeu ; le fichier mensuel du même jeu va de 2021-01 à 2025-12 ; le dossier source `geo-dvf/latest/csv/` contient 2021 à 2025). Le champ « couverture temporelle » de data.gouv.fr dit 2018-07 à 2023-06 : il n'est pas à jour, on ne l'a pas suivi.
- Mention du pied de page (H61), fixée : « Prix d'achat : Demandes de valeurs foncières (DGFiP), statistiques Etalab, ventes 2021 à 2025 ».
- Loyers des maisons : Carte des loyers 2025 de l'ANIL, `pred-mai-mef-dhup.csv` (ressource du 11/12/2025, même jeu que les appartements).

## Sortie de `communes.py` (contrôles, s'arrête au premier échec)
```
COG 2025, métropole et Corse : 34746 communes (COM, dont Paris, Lyon et Marseille d'un seul tenant) ; exclus : 45 arrondissements (ARM), 2152 communes déléguées, 476 communes associées
DVF : stats_whole_period.csv, Last-Modified Fri, 17 Jul 2026 15:22:41 GMT, téléchargé le 2026-10-14T16:11:03+02:00, 30738960 octets, sha256 c691b87045b9bafc30f242e474f919c65ae1180ab6843b8a9feb7161a3abbe68
  ok   DVF : le fichier est bien celui téléchargé (empreinte identique)
Contrôles
  ok   34746 communes de métropole (attendu 34 746 = COM du COG 2025 hors 97x)
  ok   0 commune sans population (manquent : 0 [])
  ok   0 commune sans loyer (manquent : 0 [])
  ok   0 commune sans distance à la mer (manquent : 0 [])
  ok   0 commune sans loyer de maison (manquent : 0 [])
  ok   arrondissements moyennés : {'75056': 20, '69123': 9, '13055': 16}
  ok   Bordeaux (33063) : 832 € pour 52 m² (attendu 832)
  ok   Bordeaux : 16.0 €/m² (attendu 16,0)
  ok   Bordeaux : 39.07 km, affiché 39 km (attendu 39, depuis la mairie : D18)
  ok   La Rochelle (17300) : 0.2 km (attendu « moins d'1 km », D18)
  ok   Port-de-Lanne (40231) : 22.52 km (attendu au-delà de 2 km, Adour corrigé)
  ok   Saint-Étienne-d'Orthe (40256) : 21.56 km (attendu au-delà de 2 km, Adour corrigé)
  ok   Sames (64502) : 26.32 km (attendu au-delà de 2 km, Adour corrigé)
  info Paris : 1721 € pour 52 m², estimation propre True, 2103778 habitants ; estimations propres : 4765 communes
  info loyer des maisons : 0 commune sans loyer, 3543 estimations propres ; Bordeaux 15.5092 €/m², Paris 24.0594 €/m²
Contrôles des prix d'achat
  ok   34746 lignes, dans l'ordre des codes de communes.json
  ok   arrondissements dans le fichier DVF : {'75056': 20, '69123': 9, '13055': 16} (45, H67)
  ok   appartement : chaque commune a une source (33138 hors Alsace-Moselle et Paris, Lyon, Marseille)
  ok   appartement, commune : 6272 communes (mesuré : 6272, écart permis 5 %)
  ok   appartement, secteur : 24793 communes (mesuré : 24793, écart permis 5 %)
  ok   appartement, inconnu-secteur : 2073 communes (mesuré : 2073, écart permis 5 %)
  ok   maison : chaque commune a une source (33138 hors Alsace-Moselle et Paris, Lyon, Marseille)
  ok   maison, commune : 30912 communes (mesuré : 30912, écart permis 5 %)
  ok   maison, secteur : 2225 communes (mesuré : 2225, écart permis 5 %)
  ok   maison, inconnu-secteur : 1 communes (mesuré : 1, écart permis 5 %)
  ok   Alsace-Moselle : 1605 communes inconnu-alsace-moselle pour les deux biens (attendu 1 605)
  ok   Bordeaux (33063) : [4427, 'commune', 5188, 'commune'] (attendu 4 427 et 5 188 €/m², commune)
  ok   Saint-Vincent-de-Paul (33487) : [3844, 'secteur'] (attendu 3 844 €/m², Bordeaux Métropole)
  ok   Paris (75056) : [11080.25, 'commune', 12481.1, 'secteur']
  ok   Lyon (69123) : [4912.89, 'commune', 6217.56, 'secteur']
  ok   Marseille (13055) : [2884.44, 'commune', 4775.56, 'secteur']
  ok   formes 100m : 0 code orphelin (en trop : 0, sans forme : 0)
Fichiers
  achat.json : 1.44 Mo brut, 0.23 Mo compressé (gzip)
  communes.json : 2.33 Mo brut, 0.68 Mo compressé (gzip)
  reperes.json : 1.63 Mo brut, 0.59 Mo compressé (gzip)
  voisins.json : 0.26 Mo brut, 0.08 Mo compressé (gzip)
```

## Comptes par source et par bien (toutes les communes, 34 746)
| Source | Appartement | Maison |
|---|---|---|
| commune (≥ 5 ventes dans la commune) | 6 275 | 30 912 |
| secteur (intercommunalité) | 24 793 | 2 228 |
| inconnu-secteur | 2 073 | 1 (Île-de-Sein) |
| inconnu-alsace-moselle | 1 605 | 1 605 |

Hors Alsace-Moselle et hors Paris, Lyon, Marseille (33 138 communes), comparés aux mesures de la spec : appartements 6 272 / 24 793 / 2 073 (mesuré 6 272 / 24 793 / 2 073), maisons 30 912 / 2 225 / 1 (mesuré 30 912 / 2 225 / 1). **Écart : 0** → condition d'arrêt non atteinte. Paris, Lyon et Marseille comptent en « commune » pour l'appartement (leurs arrondissements ont tous ≥ 5 ventes) et en « secteur » pour la maison (au moins un arrondissement estimé).

Paris, Lyon, Marseille (H67, moyenne simple des 20, 9 et 16 arrondissements) :
| Ville | Appartement €/m² | Maison €/m² |
|---|---|---|
| Paris (75056) | 11 080,25 (commune) | 12 481,1 (secteur : 7 arrondissements sur 20 — 1er à 4e, 9e à 11e — ont moins de 5 ventes de maison et prennent la médiane de la Métropole du Grand Paris, 4 902 €/m²) |
| Lyon (69123) | 4 912,89 (commune) | 6 217,56 (secteur : le 2e prend la Métropole de Lyon, 4 436 €/m²) |
| Marseille (13055) | 2 884,44 (commune) | 4 775,56 (secteur : le 1er prend Aix-Marseille-Provence, 4 187 €/m²) |

Note : 13 communes de Moselle auraient un prix par leur intercommunalité (deux intercommunalités à cheval sur la Meurthe-et-Moselle, dont la ligne compte les ventes hors Moselle : CC Mad et Moselle, CC du Pays Haut Val d'Alzette) ; D8 les met toutes en « inconnu-alsace-moselle ». 4 communes îliennes n'ont pas d'intercommunalité dans le fichier (`code_parent` = le département) : Île-de-Bréhat (22016), Île-de-Sein (29083), Ouessant (29155), L'Île-d'Yeu (85113) ; seule Île-de-Sein n'a aucun prix de maison.

## Couverture du loyer des maisons
- Communes sans loyer de maison : **0** sur 34 746 (seuil d'arrêt : plus de 1 %) → condition d'arrêt non atteinte.
- Estimations propres (TYPPRED = commune) : **3 543** communes (appartements : 4 765). Les autres sont estimées par maille (30 673 lignes du fichier) ou par intercommunalité (608 lignes, valeur `EPCI` propre au fichier maisons) : « Estimation du secteur (communes voisines) ».
- Paris, Lyon, Marseille : moyenne simple des arrondissements (D10 de loyer-mer) ; aucun n'est « estimation propre » (Paris : 0 arrondissement sur 20 estimé seul, Lyon 2 sur 9, Marseille 10 sur 16). Paris : 24,06 €/m² en maison, 33,09 €/m² en appartement.
- Bordeaux : 15,5092 €/m² en maison (estimation propre), 15,9932 €/m² en appartement.

## Poids des fichiers servis
| Fichier | Brut | gzip -9 | brotli -q 11 |
|---|---|---|---|
| `achat.json` (nouveau) | 1 443 910 o (1,44 Mo) | 228 066 o (228 Ko) | 165 903 o (166 Ko) |
| `communes.json` (avant → après) | 1,88 Mo → 2,33 Mo | 593 Ko → 678 Ko | — → 538 Ko |

`achat.json` est trois fois plus lourd brut que l'estimation du plan (≈ 0,5 Mo), mais reste sous le seuil de 300 Ko compressé (gzip comme brotli). Le chargement de la page grossit d'environ 228 + 85 = 313 Ko en gzip.

## Test du risque (5 communes choisies pour Vincent)
Codes INSEE vérifiés dans le COG 2025 (La Rochelle = 17300 en Charente-Maritime, pas 70450 en Haute-Saône). Prix d'achat : médiane au m², ventes 2021 à 2025 ; loyers : Carte des loyers 2025, charges comprises.

| Commune (code) | Achat appartement | Ventes d'appart. | Achat maison | Ventes de maisons | Loyer appart. | Loyer maison |
|---|---|---|---|---|---|---|
| Nantes (44109) | **3 667 €/m²** · commune | 21 691 | **4 438 €/m²** · commune | 5 488 | 14,5 €/m² | 14,4 €/m² |
| La Rochelle (17300) | **4 930 €/m²** · commune | 4 823 | **4 389 €/m²** · commune | 2 615 | 14,7 €/m² | 14,6 €/m² |
| Annecy (74010) | **5 101 €/m²** · commune | 9 160 | **6 077 €/m²** · commune | 883 | 20,4 €/m² | 18,7 €/m² |
| Saint-Malo (35288) | **4 500 €/m²** · commune | 2 900 | **4 495 €/m²** · commune | 1 612 | 13,6 €/m² | 12,5 €/m² |
| Lacanau (33214) | **4 809 €/m²** · commune | 522 | **5 101 €/m²** · commune | 827 | 16,4 €/m² | 12,8 €/m² |

Les cinq ont assez de ventes pour un prix propre : aucune n'utilise l'intercommunalité. Pour juger aussi une « Estimation du secteur » (le vrai risque de la spec : 3 communes sur 4 en appartement) : Saint-Vincent-de-Paul (33487, Bordeaux Métropole), 1 vente d'appartement → **3 844 €/m²**, médiane de Bordeaux Métropole (36 294 ventes) ; maison 2 487 €/m² · commune (50 ventes). Pour comparer, l'intercommunalité de chacune des cinq : Nantes Métropole 3 444 / 3 606 €/m² ; CA de La Rochelle 4 692 / 3 687 ; CA du Grand Annecy 5 091 / 5 421 ; CA du Pays de Saint-Malo 4 348 / 3 306 ; CC Médoc Atlantique 3 719 / 3 474 (appartement / maison).

## Ce que la mesure ne couvre pas
- La non-indexation n'est vérifiable qu'en ligne (`curl -sI …/data/achat.json`, étape 9, à /ship) ; ici, seulement la présence de `_headers` dans `dist/`.
- Les prix ne sont pas comparés à une autre source (notaires, annonces) : c'est le jugement de Vincent sur les 5 communes.
