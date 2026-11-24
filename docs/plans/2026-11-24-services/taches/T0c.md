# Tâche 0c — Le tableau du risque, pour la démo
Statut : faite · Début 13:05 · Fin 13:20 · Commits : voir `git log` (message « docs(services): tâche 0c — … »)

## Ce que l'utilisateur peut faire maintenant
Rien de visible sur le site (aucun code touché). Vincent dispose, pour la démo, de `docs/plans/2026-11-24-services/credibilite-services.md` : les 10 temps du site pour les 10 communes de « Le risque », chacun confronté au temps en voiture de l'itinéraire de l'IGN depuis la mairie, avec un drapeau « autre côté », une explication proposée par drapeau et ses cases à cocher.

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| — | aucun (mesure, plan : « Tests : aucun ») | — |

## Preuves
- `docs/plans/2026-11-24-services/credibilite-services.md` — le tableau complet : **100 lignes** (10 communes × 10 services), aucune ligne vide, l'IGN a répondu aux 567 demandes (0 erreur) (2026-11-24 13:09:52 → 13:14:49).
- `docs/plans/2026-11-24-services/captures/T0c-mesure.json` — chaque trajet essayé (5 à 7 par ligne), avec sa requête GET, la réponse (durée, distance, version), l'heure ; plus le contrôle des gares nationales et la part des habitants sous chaque cran.
- `docs/plans/2026-11-24-services/captures/T0c-sortie-mesure.txt` — sortie de la mesure (dernier passage, lu dans les réponses gardées : « demandes IGN : 0 » ; les 567 demandes ont été faites aux deux premiers passages, heures dans le cache `data-raw/bpe-2025/cache-ign.jsonl`).
- `docs/plans/2026-11-24-services/captures/T0c-reverification.txt` — Roscanvel crèche et Tende collège redemandés au `curl` à 13:18 : mêmes durées et distances que la mesure (16,98 min / 10,89 km ; 8,27 min / 4,91 km), dont une sur un serveur d'une autre version.
- Contrôle : les gares nationales de la BPE (type E107) sont dans 110 communes, exactement celles de `data-raw/services-nationales.csv` (0 en trop, 0 manquante).
- Ce que la preuve ne couvre pas : la justesse des temps elle-même (c'est le jugement de Vincent à la démo) ; un équipement plus rapide par la route mais loin à vol d'oiseau peut manquer.

### Lignes « autre côté » (9)
| Commune | Nature | « Autre côté » | Lignes |
|---|---|---:|---|
| Auch | ordinaire | 0 | — |
| Le Havre | ordinaire | 0 | — |
| Les Sables-d'Olonne | ordinaire | 1 | Supérieur : site 9, IGN 4,1 (cran 5) — point de départ : l'Insee lui-même donne 4,1 min depuis le carré de la mairie |
| Mende | ordinaire | 0 | — |
| Chamonix-Mont-Blanc | ordinaire | 0 | — |
| Saint-Véran | ordinaire | 1 | Crèche : site 5, IGN 7,7 (cran 5) — surtout le point de départ (Insee 6,2 depuis la mairie), un peu la route |
| Tende | extrême | 2 | Commerce : site plus d'une heure, IGN 11,2 (cran 15) ; Collège : site plus d'une heure, IGN 8,3 (crans 10 et 20) — routes de l'Insee probablement coupées (224 et 238 min depuis la mairie) |
| Prads-Haute-Bléone | extrême | 1 | Commerce : site 19, IGN 14,9 (cran 15) — vitesse de la route, à quelques secondes du cran |
| Roscanvel | extrême | 3 | Médecin : site 10, IGN 12,6 (cran 10) ; Crèche : site plus d'une heure, IGN 17,0 vers Crozon (cran 20) ; Collège : site plus d'une heure, IGN 15,3 vers Crozon (cran 20) — routes de l'Insee, cause non trouvée |
| L'Aiguillon-la-Presqu'île | extrême | 1 | Gare : site 29, IGN 32,1 (cran 30) — vitesse de la route |

Aucune ligne « autre côté » ne touche une valeur d'AC-13 (Les Sables-d'Olonne : AC-13 ne fixe que « Gare grandes lignes 4 », même côté ici).

### 3 lignes à refaire à la main (requête GET exacte, sans clé)
Le temps est `duration` (minutes), la distance `distance` (km).
1. Tende · Collège → collège de Tende, attendu 8,27 min, 4,91 km (site : plus d'une heure)
   `https://data.geopf.fr/navigation/itineraire?resource=bdtopo-valhalla&profile=car&optimization=fastest&start=7.5934%2C44.0892&end=7.5871%2C44.05474&geometryFormat=geojson&getSteps=false&getBbox=false&distanceUnit=kilometer&timeUnit=minute&crs=EPSG%3A4326`
2. Roscanvel · Crèche → crèche de Crozon, attendu 16,98 min, 10,89 km (site : plus d'une heure)
   `https://data.geopf.fr/navigation/itineraire?resource=bdtopo-valhalla&profile=car&optimization=fastest&start=-4.5468%2C48.3151&end=-4.49314%2C48.24585&geometryFormat=geojson&getSteps=false&getBbox=false&distanceUnit=kilometer&timeUnit=minute&crs=EPSG%3A4326`
3. Les Sables-d'Olonne · Supérieur → antenne universitaire (UFR) des Sables-d'Olonne, attendu 4,07 min, 1,05 km (site : 9 min)
   `https://data.geopf.fr/navigation/itineraire?resource=bdtopo-valhalla&profile=car&optimization=fastest&start=-1.7844%2C46.4969&end=-1.79238%2C46.49579&geometryFormat=geojson&getSteps=false&getBbox=false&distanceUnit=kilometer&timeUnit=minute&crs=EPSG%3A4326`
Toute autre ligne : `python3 -I docs/plans/2026-11-24-services/captures/T0c-4-urls.py docs/plans/2026-11-24-services/captures/T0c-mesure.json <code>:<service>`.

## Suite de tests
Non lancée : aucun code du site ni test touché (consigne de l'orchestrateur : une suite Playwright peut tourner sur le port 4173 ; plan : « Tests : aucun (mesure) »).

## Décisions prises à la place de Vincent
- Décision : **élargir le choix des équipements** : en plus des 3 positions les plus proches à vol d'oiseau (méthode du plan), la position la plus proche dans chacune des 5 communes les plus proches ; le temps retenu est le plus rapide de tous — pourquoi : au premier passage, Roscanvel ne trouvait que 3 crèches et 3 collèges de Brest, de l'autre côté de la rade (85 min de route), alors que Crozon en a à 15-17 min : la méthode seule aurait caché deux temps du site très probablement faux (77 min chez l'Insee) — coût si c'est faux : nul pour la mesure du plan, qui reste lisible (le tableau donne aussi « 3 plus proches : … » quand l'élargissement change le temps ; il change le drapeau de 2 lignes, Roscanvel crèche et collège).
- Décision : **moteur `bdtopo-valhalla`** de l'itinéraire IGN (celui des zones de temps du site, `src/proches/ign.ts`), voiture, trajet le plus rapide (le site n'utilise que les zones de temps de l'IGN, pas l'itinéraire) — pourquoi : même moteur et mêmes routes BD TOPO que les temps des proches que Vincent voit déjà — coût si c'est faux : `bdtopo-osrm` donnerait d'autres secondes ; à refaire en changeant un paramètre (cache par adresse).
- Décision : **le temps de l'IGN est arrondi comme celui du site** (minute, moitié vers le haut, au moins 1) avant de le comparer aux crans — pourquoi : comparer deux valeurs traitées de la même façon ; c'est ce qui place Prads-Haute-Bléone (14,9 → 15) du bon côté du cran 15 — coût si c'est faux : cette ligne-là change de drapeau.
- Décision : **colonne en plus « Insee, carré de la mairie »** (temps de l'Insee pour le carré de 200 m où tombe la mairie, trouvé par la projection européenne des carreaux, EPSG:3035) et, dans les explications, la part des habitants sous le cran — pourquoi : c'est ce qui sépare « point de départ » (habitants contre mairie) de « routes différentes » ; sans elle, les explications seraient des suppositions — coût si c'est faux : une colonne à ignorer.
- Décision : positions des équipements **distinctes** (un cabinet de 6 médecins compte une fois parmi les 3) — décidé par Claude — pourquoi : sinon les 3 « plus proches » sont souvent la même adresse — coût si c'est faux : nul sur le temps retenu.
- Décision : **aucun nom de personne versionné** : la mesure ne garde que les noms des gares (les médecins et les commerces en nom propre portent le nom d'une personne dans la BPE) ; le tableau dit le type et la commune de l'équipement — décidé par Claude — coût si c'est faux : nul.
- Décision : BPE 2025 géolocalisée prise dans sa **version de novembre 2026** (la seule en ligne, « actualisée mensuellement » ; l'Insee n'envoie ni date de fichier ni `Last-Modified` : date du fichier dans le zip et sha256 notés dans le tableau), au format CSV zippé (130 Mo) plutôt que Parquet (lisible sans dépendance) — coût si c'est faux : la BPE de l'Insee qui a servi aux temps (janvier 2025) peut avoir quelques équipements de plus ou de moins.
- Décision : explications écrites comme des **propositions**, avec « hypothèse non vérifiée » ou « cause non trouvée » quand je ne sais pas (Tende : tempête Alex ; Roscanvel : aucune explication trouvée) — pourquoi : consigne, Vincent tranche.

## Fichiers touchés hors de la liste de la tâche
- `docs/plans/2026-11-24-services/taches/T0c.md` (ce rapport).
- Non versionnés : `data-raw/bpe-2025/BPE25.zip` (+ en-têtes de la réponse), `data-raw/bpe-2025/bpe-services.csv` (extrait, 181 955 équipements), `data-raw/bpe-2025/cache-ign.jsonl` (567 réponses de l'IGN).

## Tests existants modifiés
- aucun

## Leçons écrites
- Aucune note écrite. Constat à retenir pour la suite (pas une correction ratée) : « les N plus proches à vol d'oiseau » rate les équipements de l'autre côté d'une rade ; la mesure l'a contredit au premier passage (Roscanvel). Si l'orchestrateur juge utile d'en faire une note de `docs/solutions/`, la matière est dans la première décision ci-dessus.

## Pour la démo (rappel, pas une question)
- Règle : 2 communes ordinaires fausses → la tranche revient à Vincent. Deux communes ordinaires ont chacune un drapeau (Les Sables-d'Olonne, Saint-Véran) ; les explications proposées pointent le point de départ (habitants contre mairie), pas une erreur de route — Vincent tranche.
- Extrêmes : 7 drapeaux ; les plus nets (Tende collège et commerce, Roscanvel crèche et collège) sont des « plus d'une heure » du site contre 8 à 17 min à l'IGN. Un retrait se fait par une ligne de `scripts/data/services-retraits.csv` (non touché ici).
