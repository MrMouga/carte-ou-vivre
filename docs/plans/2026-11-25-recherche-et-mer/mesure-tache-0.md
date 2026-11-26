# Mesures de la tâche 0 — recherche et mer en minutes
2026-11-25 · Part 0a (codes postaux, calcul des minutes préparé) par le builder de la tâche 0a. La part 0b (les minutes reçues, comptées et servies) viendra en dessous.

## Part 0a — codes postaux

### La base de La Poste : licence, date, empreinte
- Jeu « Base officielle des codes postaux », producteur La Poste, data.gouv.fr, id `545b55e1c751df52de9b6045`.
- **Licence relue le 2026-11-25 à 23:44** par `sources.py` sur les deux sites : data.gouv.fr dit `lov2` (Licence Ouverte 2.0) ; data.laposte.fr (le site de La Poste, qui sert le fichier) dit « Licence Ouverte / Open Licence », avec un lien vers la page d'Etalab. La condition d'arrêt « licence autre que la Licence Ouverte » ne joue pas.
- Fichier : le CSV brut de La Poste, `https://data.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal/raw` (nom chez La Poste : `019HexaSmal.csv`), enregistré sous `data-raw/laposte-hexasmal.csv`. ISO-8859-1, séparateur « ; », colonnes `#Code_commune_INSEE;Nom_de_la_commune;Code_postal;Libellé_d_acheminement;Ligne_5`.
- **Date du fichier : données mises à jour le 17/11/2026** (`dataUpdatedAt` de La Poste, 2026-11-17 13:43 UTC ; en-tête `Last-Modified` : 17/11/2026 14:51:09 GMT). C'est la date à écrire dans la mention de la tâche 4 : « fichier du 17/11/2026 ».
- 1 555 485 octets, 39 192 lignes, sha256 `f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22`. Le md5 du fichier téléchargé (`0d4c9510efab94b153dbba939be6b9f1`) est celui que La Poste publie pour son fichier : c'est bien le fichier qu'elle décrit.
- L'adresse est stable et le fichier remplacé à chaque mise à jour : `codes_postaux.py` s'arrête si l'empreinte change (empreinte écrite dans le script et dans `CLAUDE.md`).

Commande : `python3 -I scripts/data/sources.py --codes-postaux` (télécharge ce seul fichier, puis relit la licence). Sortie :
```
téléchargement : laposte-hexasmal.csv
  laposte-hexasmal.csv : {'url': 'https://data.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal/raw', 'telecharge_le': '2026-11-25T23:44:32+01:00', 'last_modified': 'Tue, 17 Nov 2026 14:51:09 GMT', 'octets': 1555485, 'sha256': 'f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22'}
  laposte-hexasmal.csv : {'data.gouv.fr': 'lov2', 'data.laposte.fr': 'Licence Ouverte / Open Licence', 'producteur': 'La Poste', 'md5 La Poste': '0d4c9510efab94b153dbba939be6b9f1', 'md5 du fichier': '0d4c9510efab94b153dbba939be6b9f1', 'données mises à jour': '2026-11-17T13:43:25.576Z', 'lignes': 39192}
  licence relue et notée dans data-raw/laposte-hexasmal.csv.info.json
```

### Géographie du fichier et recalage
La leçon du 2026-11-21 (« une table 2026 n'est pas forcément sur le COG 2026 ») a été appliquée avant d'écrire la règle : le fichier a été confronté aux mouvements du COG 2026 dans les deux sens.
- **Chaque code INSEE de métropole du fichier est un code de la carte (COG 2025)**, ou un arrondissement de Paris, Lyon, Marseille : aucun ancien code, aucun code créé après 2025.
- Le COG 2026 n'a d'ailleurs, après le 1er janvier 2025, **ni fusion ni création de commune** : seulement 19 changements de nom (mouvement 10) et des suppressions de communes déléguées ou associées (34, 35, 72). C'est l'année des municipales : aucune commune nouvelle au 1er janvier 2026.
- Le recalage de la spec est donc écrit et testé (tests de `codes_postaux.test.ts` : en avant, un ancien code vers la commune qui l'a remplacé ; en arrière, une commune créée en 2026, ou agrandie en gardant le code de l'une, vers les communes 2025 qui la composent ; un mouvement d'avant 2025 ne recale rien), mais **il ne s'applique à aucun code** au 2026-11-25. Il servira si La Poste passe un jour sur une géographie plus récente que la carte.

### Sortie des contrôles de `codes_postaux.py`
Commande : `python3 -I scripts/data/codes_postaux.py` (2026-11-25, 23:57). Chaque ligne « ok » est un contrôle qui arrête le script s'il échoue.
```
codes postaux La Poste : laposte-hexasmal.csv, Last-Modified Tue, 17 Nov 2026 14:51:09 GMT, téléchargé le 2026-11-25T23:44:32+01:00, 1555485 octets, sha256 f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22
  ok   codes postaux La Poste : empreinte égale à celle retenue (CLAUDE.md) et à celle notée
COG 2026 : v_mvt_commune_2026.csv, Last-Modified None, téléchargé le 2026-11-21T16:14:27+01:00, 2076555 octets, sha256 8b339fad8232e97233af3fd9468715af845e2cf8b14cb67b24d9a301ef8645f1
  ok   COG 2026 : empreinte égale à celle retenue (CLAUDE.md) et à celle notée
La Poste : Licence Ouverte 2.0 (data.gouv.fr : lov2 ; data.laposte.fr : « Licence Ouverte / Open Licence »), relue le 2026-11-25T23:44:32+01:00 ; données mises à jour le 2026-11-17T13:43:25.576Z ; 39192 lignes annoncées
  ok   La Poste : licence relue = Licence Ouverte (sources.py)
  ok   34746 communes sur la carte
  ok   La Poste : colonnes ['#Code_commune_INSEE', 'Nom_de_la_commune', 'Code_postal', 'Libellé_d_acheminement', 'Ligne_5']
  ok   La Poste : 39192 lignes, chacune un code INSEE de 5 caractères et un code postal de 5 chiffres ([])
La Poste : 39192 lignes ; écartées : 475 d'outre-mer, 1 de Monaco ; 38659 sur un code de la carte, 57 d'arrondissements de Paris, Lyon, Marseille
recalées par le COG 2026 : 0 codes INSEE de La Poste
  ok   chaque code INSEE de métropole de La Poste trouve une commune de la carte (0 sans)
géographie du fichier : 0 de ses codes INSEE ont disparu après 2025 (COG 2026), encore là chez La Poste ; 0 des 0 codes créés après 2025 y sont ([]…)
  ok   0 communes de la carte sans aucun code postal (20 au plus)
  ok   Paris : 21 codes, ceux de ses arrondissements (['75001', '75002', '75003']…)
  ok   Lyon : 9 codes, ceux de ses arrondissements (['69001', '69002', '69003']…)
  ok   Marseille : 16 codes, ceux de ses arrondissements (['13001', '13002', '13003']…)
  ok   33000 → 33063 Bordeaux (parmi 1)
  ok   32000 → 32013 Auch (parmi 1)
  ok   14000 → 14118 Caen (parmi 1)
  ok   17000 → 17300 La Rochelle (parmi 1)
  ok   85100 → 85194 Les Sables-d'Olonne (parmi 1)
  ok   aucun code postal d'outre-mer ni de Monaco
codes-postaux.json : 6051 codes postaux, 35211 paires code postal × commune ; 34746 communes avec au moins un code ; 346 avec plusieurs
  le plus de communes par code : 51300 (46), 51800 (44), 88500 (42), 70000 (42), 80140 (40) ; 01300 : 22 communes
  le plus de codes par commune : 75056 Paris (21)
  écrit : public/data/codes-postaux.json, 342200 octets, 109738 octets en brotli -q 3
  ok   poids en brotli -q 3 : 109.7 Ko (200 Ko au plus, H195)
```

### Ce que disent ces chiffres
- **Aucune commune de la carte sans code postal** (condition d'arrêt : plus de 20). 346 communes ont plusieurs codes ; Paris en a 21 (75001 à 75020, et 75116 en plus de 75016).
- **Le plus de communes pour un même code : 46** (51300, autour de Vitry-le-François). Un code complet montre toutes ses communes dans une liste qui défile (D2) : la liste la plus longue aura 46 lignes. « 01300 » (vérification de bout en bout) en a 22.
- **Poids : 109,7 Ko en `brotli -q 3`** (la compression de l'hébergeur, leçon du 2026-11-24), pour une limite de 200 Ko (H195). 342 Ko non compressé. Mesure : `brotli -c -q 3 public/data/codes-postaux.json | wc -c` → 109 738 octets. La limite est comptée en Ko de 1 000 octets (le plus strict).
- Bordeaux, Auch, Caen, La Rochelle et Les Sables-d'Olonne ont chacune leur code principal, seules sur ce code.

## Part 0a — calcul des minutes préparé (rien n'a été envoyé)

### Le point de côte, et les km inchangés
- `scripts/data/mer.py` gagne `Nearest.point` (le point de côte le plus proche et sa distance), dont `Nearest.km` est désormais la division par 1 000, et `points_cote()` (le point de chaque commune, en Lambert-93 et en degrés) à côté de `distances()`. `de_l93` convertit le point en degrés (inverse des formules IGN déjà utilisées).
- **`mer-km.csv` relu identique** : relancé après le changement (`python3 -I scripts/data/mer.py`, 2 min 06 s), le fichier est le même octet pour octet (`cmp` avec la copie d'avant : identique ; sha256 `f648420ba9f02759ac57f5e7f69ee4f7f40ec9d2be282792a5a9ff0f34f54db8` avant et après). Et `mer_minutes.py --preparer` relit les km de chaque point de côte contre `mer-km.csv` : 0 différent sur 34 746.
- Le point converti en degrés puis relu en Lambert-93 retombe à moins de 0,001 mm du point de départ.

### Rayon d'accroche (H196) et bacs (D4), d'après la documentation et le code d'openrouteservice
- **Rayon** : la matrice **n'a aucun paramètre de rayon**. Paramètres de la requête (code d'openrouteservice, `ors-api/.../matrix/MatrixRequest.java`, lu le 2026-11-25) : `locations`, `sources`, `destinations`, `metrics`, `resolve_locations`, `units`, et deux cachés, `optimized` et `options`. Le rayon est un réglage du serveur, `ors.endpoints.matrix.maximum_search_radius`, **2 000 m par défaut** (« Maximum allowed distance in meters between the requested coordinate and a point on the nearest road », giscience.github.io/openrouteservice/run-instance/configuration/endpoints/matrix). La valeur du service hébergé n'est pas publiée (page des restrictions : giscience.github.io/openrouteservice/hosted-api-restrictions). Aucun paramètre de rayon n'est donc envoyé ; le rayon retenu pour H196 est celui du service, 2 000 m d'après la documentation, et **l'accroche réelle sera mesurée** dans la réponse (`snapped_distance` de chaque point, gardée).
- Un point sans route à moins du rayon n'est pas accroché : la requête ne tombe pas en erreur, le point revient sans `location` et ses durées valent `null` (`ors-engine/.../matrix/MatrixSearchContextBuilder.java`). C'est la cause « pas de route près du point » de H196 ; une durée `null` avec les deux bouts accrochés est « aucune route jusqu'à lui ».
- **Bacs** : la matrice **ne peut pas les écarter en pratique**. `options.avoid_features` existe (paramètre caché), mais il fait passer la matrice en mode « flexible » (`isFlexibleMode` du même fichier), limité sur le service hébergé à « Locations (with dynamic arguments) : 25 (e.g. 5 x 5) per request » : au moins 1 390 requêtes (34 746 trajets par 25), près de trois jours de quota (500 par jour). **Les bacs restent** ; le tableau de crédibilité de la tâche 0b gagne Blaye (en face du bac Blaye – Lamarque).
- Limite d'une requête sur le service hébergé : « Locations (origin x destination) : 3.500 (e.g. 50 x 50) per request » (page des restrictions) : 3 500 trajets, sources × destinations.

### Les lots et l'envoi
Commande : `python3 -I scripts/data/mer_minutes.py --preparer` (2026-11-25, 23:55, sans réseau). Sortie :
```
points de côte : 34746 communes, 136 s
  ok   les km du point de côte relus égaux à mer-km.csv (34746 lignes, 0 différentes : [])
  écart du point de côte converti en degrés puis relu en Lambert-93 : 0.000 mm au plus
points de côte distincts : 1688 pour 34746 communes ; les plus partagés : [3052, 2498, 2033, 1904, 1672] ; 1083 points d'une seule commune
lots : 91 requêtes, 241958 trajets calculés pour 34746 utiles (7.0 par commune) ; le plus gros lot : 3500 trajets ; le plus de points dans un lot : 48
  ok   chaque commune dans un seul lot, aucun lot au-delà de 3500 trajets
envoi : 92 requêtes (dont le lot d'essai), quota de 500 par jour et 40 par minute ; au moins 2 min au débit permis, plus le temps de calcul de chaque requête (non mesuré : le lot d'essai le donne)
écrit : data-raw/mer-calcul/lots.json (136 s)
```
- **1 688 points de côte distincts** pour 34 746 communes (la mesure du 2026-11-25 est retrouvée par le code de `mer.py`). Le point le plus partagé sert 3 052 communes : aucun point ne dépasse 3 500 communes dans les vraies données (la coupe en plusieurs lots est testée sur des données inventées).
- **92 requêtes** : 91 lots et le lot d'essai. Sous la limite de 500 (condition d'arrêt) : **un seul jour de quota** suffit, avec de la marge pour les nouveaux essais.
- Chaque lot est une matrice : ses communes (les mairies) en sources, leurs points de côte en destinations ; communes × points ≤ 3 500. Une requête calcule aussi les trajets croisés, inutiles (241 958 calculés pour 34 746 utiles) : c'est ce qui permet de passer de 1 688 requêtes (une par point) à 91.
- **Durée prévue** : au moins 2 à 3 minutes au débit permis (une requête toutes les 1,6 s). Le temps de calcul d'une requête de 3 500 trajets n'est pas connu (rien n'a été envoyé) ; le lot d'essai affiche le sien. *Estimation de Claude* : à 20 s par requête, l'envoi durerait environ 30 minutes.
- Le lot d'essai : Bordeaux (33063), Caen (14118) et Mont-de-Marsan (40192, Landes ; décidé par Claude : la préfecture, dont le point de côte est sur la côte landaise, dunes et forêt, là où une route peut manquer près du point). Points de côte : Bordeaux → bassin d'Arcachon (−1,026 ; 44,688), Caen → Ouistreham (−0,272 ; 49,235), Mont-de-Marsan → côte landaise (−1,317 ; 44,087).

### Ce que fait l'envoi (écrit, testé sur un faux service local, jamais lancé par l'agent)
- Il lit `data-raw/mer-calcul/lots.json` et écrit `data-raw/mer-calcul/ors-mer.jsonl` : une ligne par lot, avec ses communes, ses points, l'heure, le nombre d'essais, et **la réponse entière** d'openrouteservice (durées brutes en secondes ou `null`, lieu accroché et distance d'accroche de chaque mairie et de chaque point) ou l'erreur.
- **Reprise** : relancé, il ne renvoie aucun lot déjà écrit (testé) ; un lot écrit avec d'autres communes que le lot préparé arrête tout.
- **Quota** : une réponse 429 (trop de requêtes dans la minute) attend 60 s ; un quota du jour épuisé (403 « Quota ») attend 30 min et réessaie, 26 h au plus ; ni l'une ni l'autre ne compte comme un essai. Une requête toutes les 1,6 s au plus, comptées depuis le départ réel de la précédente (leçon du 2026-10-13).
- **Échec** : un lot en échec (erreur d'openrouteservice ou pas de réponse) est refait **une fois** après 30 s, puis noté en échec (H196). Trois lots de suite en échec : le service est sans doute en panne, l'envoi s'arrête sans les noter (ils repartiront à la relance).
- **La clé** est lue dans `~/.config/openrouteservice/key`, jamais affichée ni écrite (testé : absente de la sortie et du fichier de résultats).
- Adresse : `https://api.heigit.org/openrouteservice/v2/matrix/driving-car` (leçon du 2026-11-24).
- Sans réseau, `--envoyer --a-blanc` dit ce qui serait envoyé : sur les vrais lots, « 91 lots préparés, 0 déjà écrits, 91 à envoyer (34746 communes) » ; avec `--essai`, le seul lot d'essai.

### La commande que Vincent lance
Depuis le dossier du projet, `/Users/mouga/git-repository/carte-ou-vivre` :

1. **Le lot d'essai d'abord** (une requête, quelques secondes) :
   ```
   python3 -I scripts/data/mer_minutes.py --envoyer --essai
   ```
   La sortie donne, pour Bordeaux, Caen et Mont-de-Marsan, le temps en minutes, la distance d'accroche de la mairie et du point de côte, et la **part de `null`** (« part de null : k sur 3 trajets »). Si les trois ont un temps, passer à 2. Sinon, copier la sortie à Claude avant d'aller plus loin.
2. **Tous les lots** (91 requêtes, un seul jour de quota) :
   ```
   python3 -I scripts/data/mer_minutes.py --envoyer
   ```
   Il affiche un repère tous les 20 lots, et finit par « TERMINÉ : … trajets sans temps : … ». S'il s'arrête (coupure, quota, panne), relancer **la même commande** : il reprend là où il en était. Une fois « TERMINÉ » affiché, **ne plus le relancer** (« Rien à envoyer »).

## Part 0b — les minutes reçues, comptées et servies
2026-11-26, 03:15 à 03:40, par le builder de la tâche 0b. Aucune requête envoyée : tout est relu dans le fichier de l'envoi de Vincent.

### L'envoi
- Lancé par Vincent le 2026-11-26 : le lot d'essai, puis les 91 lots, de 01:05 à 01:08 (heure d'envoi notée dans chaque ligne). **0 lot en échec**, chaque lot envoyé une seule fois.
- `data-raw/mer-calcul/ors-mer.jsonl` : 6 047 637 octets, 92 lignes, sha256 `13b9f73ee16363e389f283d0a1dfb0ed56c72dba6714ec662780a8b5c705ae21` ; `lots.json` : sha256 `411deeae1f32f4ced732ad8defe867189e3cc270706390258e0d04c8c1834cfd`. Les deux empreintes sont écrites dans `mer_minutes.py` (`EMPREINTES`) et dans `CLAUDE.md` : `--calculer` s'arrête si l'une change.
- Ce que dit la réponse : openrouteservice 10.1.1, routes OpenStreetMap du 22/11/2026, graphe du 24/11/2026, profil `driving-car`.
- Le lot d'essai et les lots donnent **le même temps** aux trois communes de l'essai (Bordeaux 3 368,44 s, Caen 1 059,51 s, Mont-de-Marsan 5 027,47 s, dans les deux requêtes).

### Sortie des contrôles de `mer_minutes.py --calculer`
Commande : `python3 -I scripts/data/mer_minutes.py --calculer` (sans réseau ; 2026-11-26, 03:24, avant le retrait d'Aspremont ; la sortie après le retrait, vers 06:50, est dans `captures/T0b-sortie-calculer.txt` et résumée plus bas, « Après le retrait d'Aspremont »).
```
  ok   lots.json : sha256 411deeae1f32f4ced732ad8defe867189e3cc270706390258e0d04c8c1834cfd (empreinte retenue : envoi du 2026-11-26)
  ok   ors-mer.jsonl : sha256 13b9f73ee16363e389f283d0a1dfb0ed56c72dba6714ec662780a8b5c705ae21 (empreinte retenue : envoi du 2026-11-26)
  ok   aucun trajet manquant dans ors-mer.jsonl (34746 communes dans 91 lots) : []
  ok   aucune durée pour un point ou une mairie non accrochés : []
  ok   les 34746 communes des lots sont celles de mer-km.csv (34746)
  info lot d'essai, 33063 : 3368.44 s ; dans son lot : 3368.44 s
  info lot d'essai, 14118 : 1059.51 s ; dans son lot : 1059.51 s
  info lot d'essai, 40192 : 5027.47 s ; dans son lot : 5027.47 s
  ok   mer-retraits.csv : colonnes ['code', 'preuve']
  retraits (D8, mer-retraits.csv) : 0 []
communes sans temps : 42 sur 34746 (0.12 %)
  retrait : 0 (temps retiré, jugé faux sur un itinéraire en ligne (D8, mer-retraits.csv)) []
  echec : 0 (calcul en échec après un nouvel essai) []
  pas-de-route-pres-du-point : 12 (aucune route près du point de côte (point non accroché)) ['13004', '17004', '29083', '29084', '30034', '30089', '30116', '30117', '30135', '30166', '30179', '56085']
  pas-de-route-pres-de-la-mairie : 0 (aucune route près de la mairie (mairie non accrochée)) []
  pas-de-route-jusqu-au-point : 30 (aucune route de la mairie jusqu'au point (les deux accrochés, durée nulle)) ['12009', '33038', '33134', '33348', '33383', '33540', '34055', '34083', '34191', '34211', '34336', '40026', '40031', '40046', '40075', '40108', '40117', '40142', '40143', '40156', '40163', '40217', '40227', '40229', '40257', '40275', '40276', '40313', '40319', '40332']
répartition des temps : moins d'1 min (0) 34 ; 1 à 15 min 1576 ; 16 à 30 min 1618 ; 31 min à 1 h 3175 ; 1 h 01 à 1 h 30 3704 ; au-delà d'1 h 30 24597 ; le plus long : 1269 min
accroche des points de côte : médiane 22 m, au plus 1723 m, 2094 communes au-delà de 1 000 m ; des mairies : médiane 14 m, au plus 1460 m
  info 33063 : 3368.44 s → 56 min
  info 14118 : 1059.51 s → 18 min
  info 40192 : 5027.47 s → 84 min
écrit : …/data-raw/mer-min.csv (34746 lignes)
```

### Communes sans temps, par cause (H196)
**42 sur 34 746, soit 0,12 %** (condition d'arrêt : plus de 2 %). Le site les comptera d'après leurs km (D7), écrits avec « ≈ ».

| Cause | Communes | Ce que c'est |
|---|---:|---|
| Aucune route près du point de côte | 12 | **4 îles sans voiture** : Île-d'Aix, Île-de-Sein, Île-Molène, Hœdic (ni la mairie ni le point ne sont accrochés : aucune route à moins de 2 km). **8 communes de Camargue** et du Gard (Arles, Bellegarde, Comps, Fournès, Fourques, Jonquières-Saint-Vincent, Meynes, Montfrin), dont le point de côte, entre les étangs, n'a aucune route à moins de 2 km. |
| Aucune route près de la mairie | 0 | Les 4 mairies non accrochées sont celles des 4 îles, déjà comptées à la ligne du dessus (la cause du point est cherchée d'abord). |
| Aucune route de la mairie jusqu'au point | 30 | Le point de côte est accroché à une voie qui n'est reliée à rien (piste de la forêt des Landes, du Médoc, ou de la côte de l'Hérault) : 12 points pour 30 communes. **Landes** : 19 communes sur 9 points, dont Biscarrosse, Parentis-en-Born, Tartas, Castets. **Médoc** : 5 sur 2 points, dont Vendays-Montalivet. **Hérault** : 6 sur un même point, dont Villeneuve-lès-Béziers, et Arnac-sur-Dourdou (Aveyron). Ce ne sont pas des îles. |
| Calcul en échec | 0 | Aucun lot en échec. |
| Retrait (D8) | 0 | `mer-retraits.csv` est vide : les retraits viendront du jugement de Vincent sur `credibilite-mer.md`. |

### Les deux bouts du rapport minutes / km
Parmi les communes de 1 km (affiché) à moins de 50 km, une commune par point de côte (décidé par Claude : sous 1 km le rapport n'a pas de sens, et sans « une par point » les 5 plus petits seraient 5 voisines sur la même voie rapide). Sortie de `captures/T0b-credibilite.py` (copie : `captures/T0b-sortie-credibilite.txt`) :
```
plus grands rapports minutes / km (1 à 50 km, un par point) :
  06006 Aspremont : 10.14 km, 1269 min, 125.15 min/km, point accroché à 11.17 m
  76660 Sandouville : 1.57 km, 28 min, 17.83 min/km, point accroché à 6.18 m
  76489 Oudalle : 2.51 km, 40 min, 15.94 min/km, point accroché à 4.81 m
  06150 La Turbie : 2.09 km, 17 min, 8.13 min/km, point accroché à 11.45 m
  2B030 Barrettali : 1.6 km, 13 min, 8.12 min/km, point accroché à 16.46 m
plus petits :
  50137 La Colombe : 24.56 km, 17 min, 0.69 min/km, point accroché à 5.34 m
  56165 Ploërmel : 38.99 km, 32 min, 0.82 min/km, point accroché à 7.75 m
  59401 Méteren : 38.61 km, 32 min, 0.83 min/km, point accroché à 25.58 m
  76705 Tourville-la-Rivière : 46.84 km, 39 min, 0.83 min/km, point accroché à 12.91 m
  61303 Nécy : 46.24 km, 39 min, 0.84 min/km, point accroché à 174.77 m
```
- **Aspremont (06006) a un temps faux à coup sûr : 1 269 min (21 h 09) pour 10 km.** Son point de côte, à Nice, est accroché à une voie que le calcul ne rejoint qu'au prix d'un immense détour : dans la même requête, les 59 communes mettent toutes 20 h 44 à 22 h 47 pour ce point, et Aspremont 25 à 49 min pour les 24 autres points de côte. C'est aussi le temps le plus long de toute la carte. **Retiré par décision de Vincent le 2026-11-26** (D8, ligne de `mer-retraits.csv` avec cette preuve) : voir « Après le retrait d'Aspremont ».
- Le plus grand rapport ensuite est un détour d'estuaire (Seine, en face du Havre : Sandouville, Oudalle), puis des routes de montagne au-dessus de la mer (La Turbie, Barrettali).
- **Aucun temps n'est plus court que la route ne le permet** : aucune commune d'1 km ou plus sous 0,5 min par km à vol d'oiseau (soit 120 km/h en ligne droite). Sur toute la carte, le plus petit rapport est 0,66 min/km (Côte-d'Or, vers la Méditerranée par l'autoroute) ; dans la fenêtre de 1 à 50 km, 0,69 (La Colombe, Manche, par l'A84). Le bac n'apparaît pas comme un temps trop court : à Blaye, c'est l'inverse (ci-dessous).
- Rapport médian, de 20 km et plus : 0,97 min par km ; 98 % des communes entre 0,71 et 1,90.

### Points de côte accrochés loin, et Blaye
- La matrice accroche le point de côte à la route la plus proche dans un rayon d'environ 2 km (mesure de la tâche 0a). Accroche médiane 22 m ; **2 094 communes** ont un point accroché à plus d'1 km (1 723 m au plus). Leur temps va jusqu'à la route la plus proche du point, pas jusqu'au point.
- C'est la cause probable d'un écart repéré : **Hourtin (33203), 58 min pour 9 km**, quand la même requête donne 16 min de sa mairie à d'autres points de côte. Son point est accroché à 1,4 km, et ce point est à 58 min ou plus de chacune des 89 communes de la requête. Ajouté au tableau de crédibilité (décidé par Claude).
- **Blaye (33058)** : 129 min (2 h 09) pour 41 km. Son point de côte est sur la côte atlantique du Médoc, de l'autre côté de l'estuaire (qui n'est pas la mer à cet endroit). Hypothèse non vérifiée : le calcul ne prend pas le bac Blaye – Lamarque, ou le compte lent. Ses voisines sur la rive droite ont 123 à 140 min.

### Le fichier servi : `mer_min` à la fin de `communes.json`
Commande : `python3 -I scripts/data/communes.py` (2026-11-26, 03:22, avant le retrait ; refait vers 06:50 après, plus bas), contrôles ajoutés.
```
Contrôles de la mer en minutes (mer-min.csv, recherche-et-mer)
  ok   chaque commune a sa ligne dans mer-min.csv, aucune en trop (34746 lignes ; absentes : [])
  ok   mer_min : minutes entières, 0 ou plus, ou null
  ok   chaque commune sans temps a sa cause (H196)
  ok   42 communes sans temps (0.12 %, au plus 2 %) : {'pas-de-route-jusqu-au-point': 30, 'pas-de-route-pres-du-point': 12}
  ok   Bordeaux (33063) : 56 min de la mer (tâche 0b : 56)
  ok   Caen (14118) : 18 min de la mer (tâche 0b : 18)
  ok   Mont-de-Marsan (40192) : 84 min de la mer (tâche 0b : 84)
```
- **Rien d'autre ne change** : les 11 colonnes d'avant sont identiques sur les 34 746 lignes (comparées une à une avec la copie d'avant), et `achat.json` est le même octet pour octet.
- **Poids ajouté : 54 834 octets, soit 54,8 Ko en `brotli -q 3`** (876 811 → 931 645 octets ; `brotli -c -q 3 public/data/communes.json | wc -c`), sous la limite de 60 Ko (H195 ; en Ko de 1 000 octets, le plus strict). Les minutes arrivent donc avec les autres données de la commune, à l'ouverture.
- **Bordeaux : 56 min** (3 368,44 s, soit 56,14 min ; « C'est réussi si » de la spec : « Mer à moins de 30 min » écarte Bordeaux), 39 km. **Caen : 18 min** (1 059,51 s, soit 17,66 min), 10 km : Caen passe « 30 min ». Relus dans le fichier servi : `["33063","Bordeaux",…,"ville-dense",172.78,56]`.

### Après le retrait d'Aspremont (décision de Vincent, 2026-11-26)
- `scripts/data/mer-retraits.csv` gagne une ligne : `06006`, avec la preuve des trajets croisés de la même requête (lot 0089 : 25 à 49 min d'Aspremont vers les 24 autres points de côte ; 20 h 44 à 22 h 47 des 59 communes vers ce point du port de Nice).
- `--calculer` refait : **43 communes sans temps sur 34 746 (0,12 %)** : 12 sans route près du point, 30 sans route jusqu'au point, **1 retrait** (06006), 0 sans route près de la mairie, 0 en échec. Le plus long temps de la carte devient 485 min (Montjustin-et-Velotte, Haute-Saône, 434 km). Sortie : `captures/T0b-sortie-calculer.txt`.
- `communes.py` refait : mêmes contrôles verts, « 43 communes sans temps (0.12 %, au plus 2 %) : {'retrait': 1, 'pas-de-route-jusqu-au-point': 30, 'pas-de-route-pres-du-point': 12} » ; Aspremont `mer_min` = `null` (ses km, 10,14, ne changent pas ; le site le comptera « ≈ 10 min », D7) ; Bordeaux 56, Caen 18, Mont-de-Marsan 84 ; les 11 colonnes d'avant toujours identiques, `achat.json` identique.
- **Poids final : 931 642 octets en `brotli -q 3`, soit +54 831 octets (54,8 Ko)** par rapport au fichier sans la colonne (limite 60 Ko).
