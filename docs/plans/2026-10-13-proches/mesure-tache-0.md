# Mesure du risque — tâche 0 (proches)
2026-10-13, 13:52 → 14:25 · /build proches · Mac de Vincent, réseau de la maison · page et scripts de mesure jetables dans `probe/proches/` (non versionnés) · sorties brutes : [captures/T0-sorties-brutes.txt](captures/T0-sorties-brutes.txt) · exemples de réponses de l'IGN : [captures/T0-ign-exemples/](captures/T0-ign-exemples/)

**Question** (*Le risque* de la spec) : un proche se calcule-t-il en 10 s au plus, l'IGN le permet-il, et la carte se recolore-t-elle encore en 100 ms avec 7 critères ?

**Réponse courte** : **non pour le temps de calcul.** Un proche jusqu'à 6 h prend **60 à 63 s**, et 2 à 5 des 24 zones échouent à chaque fois (l'IGN coupe à 60 s). La cause est chez l'IGN : sa zone de 6 h prend à elle seule 28 à 42 s. Le reste tient : conditions d'usage compatibles, recherche d'adresse rapide avec le code INSEE, classement des mairies en 40 ms, recoloration sans perte avec 7 critères. **Condition d'arrêt atteinte : retour à Vincent** (options en bas).

## (a) Une zone de 6 h depuis la mairie de Nantes
| Ressource | Résultat | Temps | Poids (transféré, compressé) | Sommets |
|---|---|---|---|---|
| `bdtopo-valhalla` | réussi | **42,4 s** puis **28,5 s** | 110 Ko (303 Ko décompressé) | 14 747, un seul polygone |
| `bdtopo-pgr` | réussi, **mais c'est Valhalla** : réponse identique à l'octet, `"resource":"bdtopo-valhalla"` | 22,4 s | 110 Ko | 14 747 |
| `bdtopo-osrm` | ne fait pas d'isochrone (getcapabilities : itinéraire seulement) | — | — | — |

Le temps croît avec la durée demandée (une à la fois) : 15 min 0,3 s · 1 h 2,3 s · 3 h 11,5 s · 6 h 28,5 s. Les ressources `graphe_routier_*` ne couvrent que l'Île-de-France. Il n'y a donc **qu'un seul moteur** pour les isochrones.

## (b) Les 24 zones d'une adresse
**Limite de débit réelle** : à 5 requêtes par seconde pile, la 6e est refusée (429) et l'adresse IP est bloquée 5 s (`retry-after: 5`, confirmé par les CGU). À 4 par seconde (toutes les 250 ms), aucun refus sur plus de 140 requêtes dans la séance. → la file doit viser 4 par seconde.

24 zones lancées à 4 par seconde, la plus longue d'abord :

| Départ | Temps jusqu'à la dernière | Zones reçues | Poids total (décompressé) |
|---|---|---|---|
| 12 rue de la Paix, Nantes | **60,3 s** | 22/24 (5 h 45 et 6 h : 504 à 60 s) | 2,7 Mo |
| place du Capitole, Toulouse | **61,6 s** | 22/24 (4 h 30 et 5 h 30 : 504) | 3,0 Mo |
| Nantes, depuis la page de mesure dans Chromium | **63,2 s** | 19/24 (5 échecs 504) | — |
| Nantes, 3 zones à la fois au plus | **116,4 s** | 24/24 | 3,3 Mo |

Pistes mesurées avec un plafond maximal plus bas (même méthode) :

| Plafond maximal | Zones | Temps jusqu'à la dernière |
|---|---|---|
| 2 h | 8 | 3,2 s (Nantes) · 4,5 s (Toulouse) · 7,6 s (Nantes, page de mesure) |
| 2 h 30 | 10 | 6,8 s (Nantes) |
| 3 h | 12 | 15,7 s (Nantes) · 13,7 s (Toulouse) |

Le temps de l'IGN varie du simple au double d'un essai à l'autre (charge de leur serveur).

## (c) Classement des 34 746 mairies dans les 24 zones
Page construite, Chromium, médiane de 5 essais, lecture des réponses comprise :

| | Fil principal (page figée pendant ce temps) | Web Worker (natif) : total · page occupée |
|---|---|---|
| Nantes, processeur normal | 29 ms | 40 ms · 1 ms |
| Nantes, processeur ralenti ×4 | **106 ms** | 46 ms · 4 ms |
| Toulouse, normal / ×4 | 30 ms / **115 ms** | 39 ms · 1 ms / 43 ms · 4 ms |

Le ralentissement ×4 de Chromium ne s'applique pas au worker : sur un téléphone, compter environ 4 fois plus dans le worker, mais la page reste fluide. Résultats identiques avec et sans worker. → **décision : classement dans un Web Worker.**

Fin de tranche lue dans les zones, comparée à l'itinéraire IGN de l'adresse à la mairie (Valhalla / OSRM) :

| | Zones | Itinéraire IGN | Tranche attendue |
|---|---|---|---|
| Nantes → Bordeaux | **3 h 30** | 3 h 37 / 3 h 34 | 3 h 45 |
| Nantes → La Rochelle | 2 h 15 | 2 h 10 / 2 h 05 | 2 h 15 |
| Toulouse → Bordeaux | 3 h | 2 h 49 / 2 h 47 | 3 h |
| Toulouse → La Rochelle | **4 h 30** | 4 h 35 / 4 h 32 | 4 h 45 |

Sur 12 villes depuis Nantes, 9 tombent dans la bonne tranche et 3 une tranche en dessous (Poitiers, Limoges, Bordeaux : jusqu'à 7 min sous le trajet de l'IGN). Les zones de l'IGN sont un peu plus larges que ses itinéraires. **Cela contredit D11** (« jamais le sous-estimer ») : à trancher (voir en bas).

## (d) Réaction à un réglage avec 7 critères
Vraie application construite (`vite preview`), 5 proches simulés injectés seulement dans la version de mesure (temps à vol d'oiseau × 1,3 à 75 km/h depuis Nantes, Rennes, Angers, La Rochelle, Bordeaux, plafond 6 h), Chromium 1440 px, processeur ralenti ×4, rendu sans carte graphique. Curseur du loyer 1 150 ↔ 1 200 €, du réglage à l'image affichée, médiane de 10 essais.

| Cas | Communes recolorées | Méthode A (dans la page) | Méthode B (touche pressée par Playwright) |
|---|---|---|---|
| loyer + mer (2 critères) | 385 | 28 / 25 ms | 35 / 35 ms |
| loyer + mer + 5 proches (7) | 28 | 27 / 24 / 25 ms | 33 / 33 ms |
| loyer, mer sans limite (1) | 3 864 | 62 ms | 70 ms |
| loyer, mer sans limite + 5 proches (6) | 66 | 25 ms | 41 ms |

Les 7 critères ne ralentissent pas la carte : le calcul des notes est négligeable, et le temps suit le nombre de communes recolorées. **Écart avec les 102 ms de loyer-mer** : le script de la tâche 7 n'a pas été gardé et je n'ai pas retrouvé ce chiffre. Mes deux méthodes donnent 25 à 35 ms pour la même situation à 2 critères. Comparaison faite dans les mêmes conditions, même séance : pas de dégradation. Seuil de 100 ms non atteint.

## (e) Recherche et paramètres retenus
- **Recherche** : `https://data.geopf.fr/geocodage/search?q=<texte>&index=address&autocomplete=1&limit=10`, à partir de 3 caractères (l'IGN refuse en dessous : 400). Réponse GeoJSON ; chaque suggestion a `label`, `type` (`housenumber`, `street`, `locality`, `municipality`), `city`, `postcode`, **`citycode` (code INSEE)**, `depcode`, et son point. Temps 100 à 300 ms. Limite : 50 requêtes par seconde par IP. → **pas besoin de recherche inverse** ; garder les 5 premières de métropole.
  - Corse : « Ajaccio » → `2A004`, « boulevard Paoli Bastia » → `2B033` ; commune seule : « Toulouse » → `municipality`, `31555`.
  - Paris, Lyon, Marseille : une adresse rend l'arrondissement (`75104`, `69382`) → ramener à `75056`, `69123`, `13055` (D10 de loyer-mer). « Marseille » seule rend déjà `13055`.
  - Outre-mer : « Pointe-à-Pitre » → `97120`, « Saint-Denis » → `97411` en premier → écarter les codes qui commencent par `97`.
  - L'autocomplétion (`/geocodage/completion`) n'a pas de code INSEE et est limitée à 10 requêtes par seconde ; la recherche inverse (`/geocodage/reverse?lon=…&lat=…&index=address&limit=1`) rend bien `citycode`, Corse comprise : utile seulement en secours.
- **Isochrone** : `https://data.geopf.fr/navigation/isochrone?resource=bdtopo-valhalla&point=<lon>,<lat>&costType=time&costValue=<minutes>&timeUnit=minute&profile=car&direction=departure&geometryFormat=geojson&crs=EPSG:4326`. Réponse : `geometry` de type `Polygon` (toujours vu ainsi ; prévoir `MultiPolygon`). Pannes vues : 429 (page HTML), 504 `{"message":"The upstream server is timing out"}` à 60 s.
- Exemples bruts pour le faux service : [captures/T0-ign-exemples/](captures/T0-ign-exemples/). **À noter pour la tâche 2a** : le faux service doit intercepter `data.geopf.fr/geocodage/search*`, et non `…/completion*` comme le dit le plan.

## (f) Conditions d'usage
- [Conditions générales d'utilisation de cartes.gouv.fr](https://cartes.gouv.fr/cgu/), « Version du 15 octobre 2024 », lues le 2026-10-13 : « Sur la Géoplateforme, l'utilisation des géodonnées et géoservices est gratuite (sauf licence spécifique). » Un développeur y est un « Utilisateur API effectuant un développement (par exemple : site Internet, application web, application mobile) ». « Pour certaines API, une limite d'usage fixée en nombre de requêtes par seconde et par IP est mise en place. Au-delà de cette limite, une erreur HTML 429 (Too Many Requests) est envoyée […] » pour « une durée de 5 secondes ». Tableau : « Calcul d'isochrone/isodistance : 5 requêtes/s » ; « Géocodage : 50 requêtes/s » ; « Autocomplétion : 10 requêtes/s ». Interdits : « nuire, entraver ou fausser le bon fonctionnement des API ». Licence : « A défaut, la Licence Ouverte / Open Licence – Etalab s'applique ».
- Guides [isochrone](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-isochrone-isodistance/) et [géocodage](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/geocodage/) (« Modifié le 14 septembre 2026 ») : « Son usage est limité à 5 requêtes par seconde depuis une même adresse IP » (50 pour le géocodage) ; la recherche « s'appuie sur des données BAN, BD TOPO® et Parcellaire Express (PCI) ».
- → **Rien n'interdit l'appel depuis le navigateur des visiteurs d'un site public** ; la limite est par visiteur (IP), sans clé. Les réponses permettent l'appel depuis un autre site (`access-control-allow-origin: *`).
- Mention proposée pour la tâche 4 (Licence Ouverte : citer la source) : « Recherche d'adresse et temps de trajet : © IGN – Géoplateforme (Base Adresse Nationale, BD TOPO®) ».

## (g) Sur le téléphone de Vincent — préparée, à faire avec l'orchestrateur
La page de mesure marche par le Wi-Fi local (vérifiée le 2026-10-13 à 14:20 depuis `http://192.168.1.26:5310/`, [capture](captures/T0-page-telephone-max2h.png)). Marche à suivre :
1. Sur le Mac : `cd ~/git-repository/carte-ou-vivre` puis `npx vite --config probe/proches/classer/vite.config.ts --host`. Lire la ligne « Network: http://… :5310/ ».
2. Sur le téléphone, sur le même Wi-Fi : ouvrir cette adresse (aujourd'hui `http://192.168.1.26:5310/`). Laisser l'adresse proposée « 12 rue de la Paix, Nantes » (adresse publique, n'en mettre aucune autre). Appuyer sur « Mesurer un proche (24 zones) ». Attendre environ une minute.
3. Donner : la ligne « TOTAL … s », le nombre de zones reçues, et le modèle du téléphone. Si une option à plafond plus bas est choisie, refaire avec `…:5310/?max=150` (2 h 30) ou `?max=180` (3 h).
Le temps est surtout celui du serveur de l'IGN : il sera proche de celui du Mac, et la condition d'arrêt est déjà atteinte sans lui.

## Captures
- [captures/T0-zones-nantes.png](captures/T0-zones-nantes.png) — les 24 zones de « 12 rue de la Paix, Nantes » sur le Plan IGN (vert 15 min → rouge 6 h), avec le résultat du classement.
- [captures/T0-zones-toulouse.png](captures/T0-zones-toulouse.png) — les 24 zones de « place du Capitole, Toulouse ».
- [captures/T0-proche-navigateur-nantes.png](captures/T0-proche-navigateur-nantes.png) — un proche entier calculé depuis la page (63 s, 5 zones en échec).

## Conditions d'arrêt
| Condition | Mesure | Atteinte ? |
|---|---|---|
| Plus de 10 s par proche sur le Mac (H21) | 60 à 63 s, 2 à 5 zones en échec ; 15 s même avec un maximum de 3 h | **Oui** |
| Plus de 30 s sur le téléphone | non mesurée (préparée) | — |
| Zone de 6 h refusée par les trois ressources | Valhalla la rend seule (28 à 42 s), mais échoue souvent avec les 23 autres ; OSRM n'en fait pas ; pgr = Valhalla | Non, de justesse |
| Conditions d'usage qui interdisent l'appel depuis un site public | autorisé, limite par IP | Non |
| Réaction au réglage au-delà de 100 ms | 24 à 41 ms avec 7 critères (pire cas mesuré : 70 ms à 1 critère) | Non |

## Options pour Vincent
1. **Plafond maximal à 3 h** (12 zones, 14 à 16 s mesurés). Le délai visé passe de 10 s à environ 20 s, l'échec de 30 à 45 s. Le défaut de 3 h (H19) devient le maximum, et au-delà on affiche « plus de 3 h ». Coût : on ne peut plus chercher une ville à 4 h de ses parents. Il faut réviser D2, R10, R11 et H21, et réécrire les critères qui règlent un plafond au-delà de 3 h (3 h 30 et 4 h 30 dans acceptance.json). 5 proches d'affilée prennent environ 1 min 15.
2. **Plafond maximal à 2 h 30** (10 zones, environ 7 s) ou **2 h** (8 zones, 3 à 8 s). Le budget de 10 s est tenu. Coût : le critère ne sert plus que pour des proches assez proches, et le défaut de 3 h doit baisser (par exemple 1 h 30). Mêmes révisions de la spec et des critères.
3. **Garder 6 h, avec un calcul progressif** : 3 zones à la fois, toutes reçues en environ 2 min, les zones proches d'abord. Coût : environ 2 min par proche (10 min pour 5), de nouveaux états à concevoir (spec et Figma), et une forte charge envoyée à l'IGN par chaque visiteur.
4. **Notre propre serveur de calcul de trajets** (par exemple OSRM, qui calcule une adresse vers 35 000 mairies d'un coup). Coût : un serveur payant, à chiffrer, et à entretenir ; le site ne serait plus seulement statique ; D2 serait à revoir.

**Recommandation de Claude : l'option 1 (3 h au plus).** C'est le seul réglage qui garde le cas « un week-end chez les parents » (H19) avec une attente raisonnable et sans argent dépensé. L'option 2 est la plus sûre en temps, mais elle rend le critère étroit.

**Second point à trancher (D11)** : les zones de l'IGN placent parfois une ville une tranche trop bas, jusqu'à 7 min sous le trajet de l'IGN (3 villes sur 12). Recommandation : l'accepter, et réécrire D11 ainsi : « à quelques minutes près, selon les zones de l'IGN ». L'autre choix serait d'ajouter une tranche de marge partout, mais on surestimerait alors la plupart des villes de 15 à 30 min.
