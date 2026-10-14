# Mesure — tâche 0 d'immobilier (données)
2026-10-14 16:15 · `python3 scripts/data/sources.py` puis `python3 scripts/data/communes.py` · Rapport : [taches/T0.md](taches/T0.md)

> Les sections de 16:15 décrivent la **première règle** (médiane 2021-2025 seule). Elle est remplacée par la règle de Vincent : voir [Règle de Vincent (16:50)](#règle-de-vincent-2026-10-14-1650) à la fin. Les comptes par source (commune / secteur / sans prix) et la couverture du loyer des maisons ne changent pas.

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

## Règle de Vincent (2026-10-14, 16:50)
Pour chaque commune et chaque bien : (1) au moins 30 ventes de 2023-01 à 2025-12 → **prix récent**, médiane approchée sur 2023-2025 (médiane pondérée des médianes mensuelles du fichier `stats_dvf.csv`) ; (2) sinon au moins 5 ventes 2021-2025 → médiane exacte 2021-2025 (`stats_whole_period.csv`, comme avant) ; (3) sinon l'intercommunalité, avec la même règle 1 puis 2 (décision de l'orchestrateur) ; sinon inconnu. Paris, Lyon, Marseille : la règle par arrondissement, puis H67 à la lettre.

### Le fichier mensuel retenu
- `stats_dvf.csv` (https://data-pipeline-open.s3.sbg.io.cloud.ovh.net/dvf/stats_dvf.csv), même jeu, Last-Modified **Fri, 17 Jul 2026 15:22:40 GMT** (même publication que `stats_whole_period.csv`) ; téléchargé le 2026-10-14 à 16:48 ; 276 619 703 octets.
- Empreinte sha256 : **`09316f4ce13d694a43fc86c704120d0aadc9ba739a02b365ccd116d5320b9468`** (notée dans `data-raw/stats_dvf.csv.info.json`, revérifiée par `communes.py`).
- Les 36 mois de 2023-01 à 2025-12 sont présents (contrôle).
- **Piège trouvé** : une intercommunalité sur plusieurs départements a une ligne par département, aux chiffres identiques (Métropole du Grand Paris : 6 lignes par mois ; Aix-Marseille-Provence : 3). Les additionner comptait ses ventes 2 à 6 fois (Grand Paris : 656 898 ventes d'appartements 2023-2025, plus que les 214 554 de 2021-2025). `communes.py` n'en garde qu'une par mois (3 455 lignes en double ignorées) et s'arrête si deux copies diffèrent. Effet du correctif : 459 communes passent de « secteur, prix récent » à « secteur, toute la période » en appartement. Le fichier sur toute la période n'était pas touché (les copies, identiques, s'écrasaient).

### Mention du pied de page (H61)
« Prix d'achat : Demandes de valeurs foncières (DGFiP), statistiques Etalab, ventes 2023 à 2025 (2021 à 2025 sous 30 ventes) » — la proposition de l'orchestrateur est exacte : chaque prix est soit la médiane 2023-2025 (≥ 30 ventes récentes, commune ou intercommunalité), soit la médiane 2021-2025.

### Sortie de `communes.py`
```
DVF : stats_whole_period.csv, Last-Modified Fri, 17 Jul 2026 15:22:41 GMT, téléchargé le 2026-10-14T16:11:03+02:00, 30738960 octets, sha256 c691b87045b9bafc30f242e474f919c65ae1180ab6843b8a9feb7161a3abbe68
  ok   DVF : stats_whole_period.csv est bien celui téléchargé (empreinte identique)
DVF : stats_dvf.csv, Last-Modified Fri, 17 Jul 2026 15:22:40 GMT, téléchargé le 2026-10-14T16:48:13+02:00, 276619703 octets, sha256 09316f4ce13d694a43fc86c704120d0aadc9ba739a02b365ccd116d5320b9468
  ok   DVF : stats_dvf.csv est bien celui téléchargé (empreinte identique)
  info fichier mensuel : 3455 lignes en double ignorées (intercommunalités sur plusieurs départements)
  ok   fichier mensuel : 36 mois dans la fenêtre 2023-01 à 2025-12 (attendu 36)
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
  info appartement, par règle (1 récent, 2 toute la période, 3 intercommunalité) : {'1': 2429, '2': 3843, '3-1': 15728, '3-2': 9065, 'inconnu': 2073}
  info maison, par règle (1 récent, 2 toute la période, 3 intercommunalité) : {'1': 9925, '2': 20987, '3-1': 2225, '3-2': 0, 'inconnu': 1}
  ok   Bordeaux (33063) : [4233, 'commune', 5067, 'commune'], règle 1 (attendu 4 233 et 5 067 €/m², prix récent 2023-2025)
  ok   Saint-Vincent-de-Paul (33487) : [3700, 'secteur', 2487, 'commune'] (attendu appartement 3 700 €/m², Bordeaux Métropole récent ; maison 2 487 €/m², 24 ventes récentes : règle 2)
  ok   Paris (75056) : [10640.35, 'commune', 12403.7, 'secteur']
  ok   Lyon (69123) : [4652.22, 'commune', 6101.0, 'secteur']
  ok   Marseille (13055) : [2945.12, 'commune', 4853.38, 'secteur']
  ok   formes 100m : 0 code orphelin (en trop : 0, sans forme : 0)
Fichiers
  achat.json : 1.44 Mo brut, 0.23 Mo compressé (gzip)
  communes.json : 2.33 Mo brut, 0.68 Mo compressé (gzip)
  reperes.json : 1.63 Mo brut, 0.59 Mo compressé (gzip)
  voisins.json : 0.26 Mo brut, 0.08 Mo compressé (gzip)
```

### Comptes par règle et par bien (hors Alsace-Moselle et hors Paris, Lyon, Marseille : 33 138 communes)
| Règle | Appartement | Maison |
|---|---|---|
| 1 — commune, prix récent 2023-2025 (≥ 30 ventes) | 2 429 | 9 925 |
| 2 — commune, médiane 2021-2025 (5 ventes ou plus, moins de 30 récentes) | 3 843 | 20 987 |
| 3 — intercommunalité, prix récent | 15 728 | 2 225 |
| 3 — intercommunalité, médiane 2021-2025 | 9 065 | 0 |
| inconnu (inconnu-secteur) | 2 073 | 1 |
| Alsace-Moselle (à part, inconnu-alsace-moselle) | 1 605 | 1 605 |

Par source, rien ne bouge : commune 6 272 / 30 912, secteur 24 793 / 2 225, sans prix 2 073 / 1 (contrôle gardé, écart 0).

Recoupement avec la mesure de l'orchestrateur (≈ 2 520 appartements et ≈ 10 035 maisons au prix récent) : elle compte toutes les lignes « commune » du fichier. En les décomposant : appartements 2 520 = 2 429 communes de métropole + 45 arrondissements + 44 d'outre-mer + 2 autres codes ; maisons 10 035 = 9 925 + 25 arrondissements + 77 d'outre-mer + 8 autres. Les deux mesures concordent.

### Justesse de l'approximation (médiane pondérée des médianes mensuelles)
Mesurée sur 2021-2025, contre la médiane exacte de `stats_whole_period.csv`, communes de métropole :
| Bien | Ventes 2021-2025 | Communes | Écart médian | 9 sur 10 sous | Pire |
|---|---|---|---|---|---|
| Appartement | 30 à 99 | 1 416 | 1,6 % | 6,3 % | 26 % |
| Appartement | 100 et plus | 1 816 | 0,9 % | 3,1 % | 13 % |
| Maison | 30 à 99 | 10 392 | 2,5 % | 8,7 % | 48 % |
| Maison | 100 et plus | 5 727 | 1,3 % | 4,1 % | 23 % |

Au-delà de 100 ventes, l'écart est d'environ 1 % (comme mesuré par l'orchestrateur). Près du seuil de 30, il est plus grand : 1 commune sur 10 s'écarte de plus de 6 à 9 % de la vraie médiane.

### Effet sur les prix (avant → après, mêmes communes)
- Appartement : 17 876 prix changent (16 870 inchangés) ; variation médiane +2,6 % ; écart médian 3,7 %, 9 sur 10 sous 9,3 %, au pire 54 %.
- Maison : 11 919 changent (22 827 inchangés) ; variation médiane +1,5 % ; écart médian 3,5 %, 9 sur 10 sous 10,3 %, au pire 55 %.
- Paris, Lyon, Marseille (appartement / maison) : Paris 11 080 → **10 640** / 12 481 → **12 404** ; Lyon 4 913 → **4 652** / 6 218 → **6 101** ; Marseille 2 884 → **2 945** / 4 776 → **4 853** €/m².

### Poids de `achat.json`
1 444 230 o brut, **228 302 o gzip, 165 984 o brotli** (avant : 228 066 / 165 903) : inchangé, sous le seuil de 300 Ko compressé.

### Test du risque, avec la règle de Vincent
| Commune (code) | Bien | Règle | Prix | Ventes 2023-2025 | Ventes 2021-2025 | Ancien prix (2021-2025) |
|---|---|---|---|---|---|---|
| Nantes (44109) | appartement | 1 | **3 462 €/m²** | 11 468 | 21 691 | 3 667 |
| Nantes (44109) | maison | 1 | **4 211 €/m²** | 2 791 | 5 488 | 4 438 |
| La Rochelle (17300) | appartement | 1 | **4 931 €/m²** | 2 643 | 4 823 | 4 930 |
| La Rochelle (17300) | maison | 1 | **4 375 €/m²** | 1 390 | 2 615 | 4 389 |
| Annecy (74010) | appartement | 1 | **5 183 €/m²** | 4 824 | 9 160 | 5 101 |
| Annecy (74010) | maison | 1 | **6 196 €/m²** | 491 | 883 | 6 077 |
| Saint-Malo (35288) | appartement | 1 | **4 539 €/m²** | 1 516 | 2 900 | 4 500 |
| Saint-Malo (35288) | maison | 1 | **4 627 €/m²** | 862 | 1 612 | 4 495 |
| Lacanau (33214) | appartement | 1 | **5 281 €/m²** | 283 | 522 | 4 809 |
| Lacanau (33214) | maison | 1 | **5 345 €/m²** | 445 | 827 | 5 101 |
| Saint-Vincent-de-Paul (33487) | appartement | 3 (Bordeaux Métropole, prix récent) | **3 700 €/m²** | 1 (métropole : 19 853) | 1 (métropole : 36 294) | 3 844 (secteur) |
| Saint-Vincent-de-Paul (33487) | maison | 2 | **2 487 €/m²** | 24 | 50 | 2 487 |
| Bordeaux (33063), pour mémoire | appartement | 1 | **4 233 €/m²** | 9 654 | 17 838 | 4 427 |
| Bordeaux (33063), pour mémoire | maison | 1 | **5 067 €/m²** | 3 005 | 5 862 | 5 188 |

Bordeaux passe de 4 427 à **4 233 €/m²** en appartement : la valeur de la spec (« 4 427 € au fichier de juillet 2026 », étape 4 de la vérification de bout en bout) est à amender. Bordeaux reste sous 5 000 €/m².

## Seuil 300 € (décision de Vincent, 2026-10-14, 18:20 — reprise de la tâche 1)
Règle : un prix d'achat au m² sous 300 € (appartement ou maison) n'est retenu à aucun niveau. La commune passe au niveau suivant : récent 2023-2025 (≥ 30 ventes), puis 2021-2025 (≥ 5 ventes), puis l'intercommunalité avec la même règle, sinon « inconnu-secteur ». Le seuil vaut pour l'achat seulement, pas pour les loyers. Il est codé dans `PRIX_ACHAT_MIN_M2 = 300` (`scripts/data/communes.py`), et le contrôle « aucun prix d'achat retenu sous 300 €/m² » arrête le script s'il échoue. Mêmes fichiers DVF (mêmes empreintes sha256), `python3 scripts/data/communes.py` relancé.

### Comptes par source (hors Alsace-Moselle et hors Paris, Lyon, Marseille : 33 138 communes)
| Bien | Source | Avant | Après | Écart |
|---|---|---|---|---|
| appartement | commune | 6 272 | 6 265 | −7 |
| appartement | secteur | 24 793 | 24 678 | −115 |
| appartement | inconnu-secteur | 2 073 | 2 195 | +122 (+5,9 %) |
| maison | commune | 30 912 | 30 878 | −34 |
| maison | secteur | 2 225 | 2 259 | +34 |
| maison | inconnu-secteur | 1 | 1 | 0 |

Le contrôle des comptes (`MESURES`, écart permis de 5 %) s'est arrêté sur « appartement, inconnu-secteur : 2 195 (mesuré : 2 073) ». `MESURES` porte maintenant les comptes après le seuil, et les comptes d'avant restent écrits en commentaire.

### Par règle
- Appartement : règle 1 → 2 429 (inchangé) ; règle 2 → 3 836 (3 843 avant) ; règle 3 récent → 15 733 (15 728) ; règle 3 sur 2021-2025 → 8 945 (9 065) ; inconnu → 2 195 (2 073).
- Maison : règle 1 → 9 925 ; règle 2 → 20 953 (20 987) ; règle 3 récent → 2 259 (2 225) ; règle 3 sur 2021-2025 → 0 ; inconnu → 1.

### Lignes de `achat.json` qui changent (comparaison avec le commit `e109491`)
- Appartement, 128 lignes : 6 passent de « commune » à « secteur », 1 de « commune » à « inconnu-secteur », 121 de « secteur » à « inconnu-secteur ». Ce sont des intercommunalités dont le prix était sous 300 €, par exemple 226 €/m² dans plusieurs communes de Haute-Saône.
- Maison, 34 lignes : de « commune » à « secteur ».
- Prix le plus bas après le seuil : 300 €/m² en appartement, 302 €/m² en maison. Avant : 21 et 159.
- Guérigny (58131), appartement : 21 €/m² « commune » (39 ventes 2021-2025 ; 1 vente récente) → **795 €/m² « secteur »**, prix récent de la CC Les Bertranges (36 ventes 2023-2025).
- Civray (18066), appartement : 26 €/m² « commune » (11 ventes, des ventes en bloc à 26 €/m²) → **873 €/m² « secteur »**, prix récent de la CC FerCher (31 ventes 2023-2025).
- `communes.json` et les autres fichiers : inchangés. `achat.json` : 1,45 Mo brut, 0,23 Mo gzip (inchangé).
