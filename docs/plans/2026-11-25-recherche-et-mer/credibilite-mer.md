# Les minutes de la mer sont-elles crédibles ? Communes à confronter à un itinéraire en ligne

2026-11-26 · tâche 0b de /build recherche-et-mer · **à juger par Vincent, avant la démo s'il le veut** (plan : « jugées à la démo », D8 ; Aspremont déjà retiré par Vincent le 2026-11-26) · Spec : [« Le risque »](../../specs/2026-11-25-recherche-et-mer/spec.md), D4, D7, D8, R61 · Mesure : [mesure-tache-0.md](mesure-tache-0.md)

## En bref
- **22 communes** : les 10 villes du plan, Blaye (les bacs restent), Hourtin (décidé par Claude), et les 5 communes de chaque bout du rapport minutes / km.
- **Aspremont est retiré** (décision de Vincent du 2026-11-26, D8) : **21 h 09** calculées pour 10 km de la mer, faux à coup sûr. La commune est « sans temps », comptée d'après ses km (« ≈ 10 min », D7) ; preuve dans `scripts/data/mer-retraits.csv`.
- **Un autre temps est probablement faux** : Hourtin, **58 min** pour 9 km, quand d'autres points de côte sont à 16 min de sa mairie. Comme Aspremont, il vient d'un point de côte accroché à une voie mal reliée, pas des routes de la commune. Il reste à juger, avec Blaye et le reste du tableau, à la démo.
- Je n'ai ouvert aucun itinéraire : la colonne « Itinéraire en ligne » est à remplir par toi, lien à la main.

## Comment juger (D8)
- Ouvre le lien de la ligne : un itinéraire en voiture sur openstreetmap.org, de la mairie au point de côte qui donne les km (D4). Note son temps.
- **Faux** (règle proposée, décidée par Claude, comme pour les services) : le temps de l'itinéraire tombe hors de la colonne « Même côté si », donc de l'autre côté d'une des pastilles 15 min, 30 min, 1 h, 1 h 30. La commune passerait alors un choix « Mer à moins de » qu'elle ne devrait pas passer, ou l'inverse. Un écart de quelques minutes du même côté de toutes les pastilles n'est pas faux.
- Un temps faux est **retiré** par une ligne de `scripts/data/mer-retraits.csv` (code, preuve), sans changer le code. La commune devient « sans temps » et le site la compte d'après ses km (D7) : « ≈ 10 min » pour Aspremont à la place de 21 h 09.

## Tes cases
- [ ] Bordeaux (33063) : juste · [ ] faux → retrait
- [ ] Caen (14118) : juste · [ ] faux → retrait
- [ ] Auch (32013) : juste · [ ] faux → retrait
- [ ] Toulouse (31555) : juste · [ ] faux → retrait
- [ ] Lyon (69123) : juste · [ ] faux → retrait
- [ ] Paris (75056) : juste · [ ] faux → retrait
- [ ] Nantes (44109) : juste · [ ] faux → retrait
- [ ] Rennes (35238) : juste · [ ] faux → retrait
- [ ] Montpellier (34172) : juste · [ ] faux → retrait
- [ ] Lille (59350) : juste · [ ] faux → retrait
- [ ] Blaye (33058) : juste · [ ] faux → retrait
- [ ] Hourtin (33203) : juste · [ ] faux → retrait
- [x] Aspremont (06006) : faux → **retiré** le 2026-11-26, décision de Vincent (D8)
- [ ] Sandouville (76660) : juste · [ ] faux → retrait
- [ ] Oudalle (76489) : juste · [ ] faux → retrait
- [ ] La Turbie (06150) : juste · [ ] faux → retrait
- [ ] Barrettali (2B030) : juste · [ ] faux → retrait
- [ ] La Colombe (50137) : juste · [ ] faux → retrait
- [ ] Ploërmel (56165) : juste · [ ] faux → retrait
- [ ] Méteren (59401) : juste · [ ] faux → retrait
- [ ] Tourville-la-Rivière (76705) : juste · [ ] faux → retrait
- [ ] Nécy (61303) : juste · [ ] faux → retrait

## Le tableau
| Pourquoi | Commune | Km (affiché) | Temps du site | Même côté si | Itinéraire en ligne | Lien (mairie → point de côte) |
|---|---|---:|---:|---|---|---|
| ville du plan (1,43 min/km) | Bordeaux (33063, 33) | 39 km | 56 min | 31 min à 1 h | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=44.8379%2C-0.5794%3B44.688181%2C-1.026228) |
| ville du plan (1,89 min/km) | Caen (14118, 14) | 10 km | 18 min | 16 min à 30 min | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=49.1811%2C-0.3731%3B49.235087%2C-0.271692) |
| ville du plan | Auch (32013, 32) | 160 km | 2 h 53 | plus de 1 h 30 | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=43.6469%2C0.5831%3B43.766013%2C-1.393989) |
| ville du plan | Toulouse (31555, 31) | 135 km | 1 h 41 | plus de 1 h 30 | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=43.6046%2C1.4442%3B43.14763%2C2.987706) |
| ville du plan | Lyon (69123, 69) | 246 km | 2 h 55 | plus de 1 h 30 | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=45.7676%2C4.835%3B43.557855%2C5.019992) |
| ville du plan | Paris (75056, 75) | 149 km | 2 h 42 | plus de 1 h 30 | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=48.8564%2C2.3525%3B50.012623%2C1.31899) |
| ville du plan (1,57 min/km) | Nantes (44109, 44) | 38 km | 1 h | 31 min à 1 h | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=47.2184%2C-1.5545%3B47.054927%2C-1.998276) |
| ville du plan (0,99 min/km) | Rennes (35238, 35) | 48 km | 48 min | 31 min à 1 h | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=48.1114%2C-1.6801%3B48.493208%2C-1.993274) |
| ville du plan (2,91 min/km) | Montpellier (34172, 34) | 5 km | 14 min | 15 min ou moins | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=43.5985%2C3.8968%3B43.559646%2C3.923165) |
| ville du plan | Lille (59350, 59) | 63 km | 1 h 07 | 1 h 01 à 1 h 30 | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=50.6304%2C3.071%3B51.088864%2C2.544295) |
| bac (Blaye – Lamarque) (3,15 min/km) | Blaye (33058, 33) | 41 km | 2 h 09 | plus de 1 h 30 | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=45.1268%2C-0.663%3B45.165326%2C-1.180875) |
| écart à ses voisines (6,16 min/km) | Hourtin (33203, 33) | 9 km | 58 min | 31 min à 1 h | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=45.186%2C-1.0573%3B45.198053%2C-1.175976) |
| rapport le plus grand (125,15 min/km) | Aspremont (06006, 06) | 10 km | ~~21 h 09~~ retiré (sans temps) | — | retiré, D8 | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=43.7846%2C7.2436%3B43.698168%2C7.284175) |
| rapport le plus grand (17,83 min/km) | Sandouville (76660, 76) | 2 km | 28 min | 16 min à 30 min | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=49.4967%2C0.3193%3B49.483028%2C0.313849) |
| rapport le plus grand (15,94 min/km) | Oudalle (76489, 76) | 3 km | 40 min | 31 min à 1 h | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=49.5081%2C0.3014%3B49.486152%2C0.293078) |
| rapport le plus grand (8,13 min/km) | La Turbie (06150, 06) | 2 km | 17 min | 16 min à 30 min | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=43.7453%2C7.3997%3B43.735564%2C7.421924) |
| rapport le plus grand (8,12 min/km) | Barrettali (2B030, 2B) | 2 km | 13 min | 15 min ou moins | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=42.8768%2C9.3549%3B42.867338%2C9.34016) |
| rapport le plus petit (0,69 min/km) | La Colombe (50137, 50) | 25 km | 17 min | 16 min à 30 min | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=48.8744%2C-1.1823%3B48.692773%2C-1.372678) |
| rapport le plus petit (0,82 min/km) | Ploërmel (56165, 56) | 39 km | 32 min | 31 min à 1 h | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=47.9292%2C-2.3968%3B47.649055%2C-2.710472) |
| rapport le plus petit (0,83 min/km) | Méteren (59401, 59) | 39 km | 32 min | 31 min à 1 h | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=50.7405%2C2.6905%3B51.027935%2C2.384885) |
| rapport le plus petit (0,83 min/km) | Tourville-la-Rivière (76705, 76) | 47 km | 39 min | 31 min à 1 h | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=49.3283%2C1.1054%3B49.382923%2C0.466258) |
| rapport le plus petit (0,84 min/km) | Nécy (61303, 61) | 46 km | 39 min | 31 min à 1 h | ___ | [itinéraire](https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=48.8319%2C-0.1156%3B49.235007%2C-0.270656) |

## Ce que j'ai vu dans les réponses (explications proposées, à juger)
- **Aspremont** (06006, 21 h 09 calculées, 10 km) : le point de côte, à Nice, est accroché (à 11 m) à une voie que le calcul ne rejoint qu'au prix d'un immense détour : dans la même requête, les 59 communes mettent toutes de 20 h 44 à 22 h 47 pour ce point, alors qu'Aspremont met de 25 à 49 min pour les 24 autres points de côte de la requête. 21 h 09 est faux à coup sûr ; le vrai temps est sans doute proche de 25 min. Cause exacte non trouvée (la réponse ne donne pas l'itinéraire). **Retiré le 2026-11-26 par décision de Vincent (D8)** : ligne de `scripts/data/mer-retraits.csv`, avec cette preuve.
- **Hourtin** (33203, 58 min calculées, 9 km) : le point de côte est accroché à 1,4 km de lui (à la plus grande distance permise, 2 km), sur une voie qu'on ne rejoint que par un détour : dans la même requête, la mairie d'Hourtin est à 16 min de certains autres points de côte, et ce point est à 58 min ou plus de chacune des 89 communes de la requête. *Proposé : probablement faux ; à vérifier avec le lien.*
- **Blaye** (33058, 2 h 09 calculées, 41 km) : en face du bac Blaye – Lamarque (les bacs restent, décision de la tâche 0a). Le point de côte est sur la côte atlantique du Médoc (à cet endroit, l'estuaire n'est pas la mer), accroché à 388 m. Dans la même requête, Blaye est à 95 à 135 min des 36 autres points de côte. Hypothèse non vérifiée : le calcul ne prend pas le bac, ou le compte lent. À comparer avec le lien (qui peut, lui, prendre le bac).
- **Rapport le plus grand** : on y attend des détours d'estuaire (Seine : Sandouville, Oudalle) et des routes de montagne au-dessus de la mer (La Turbie, Barrettali). **Rapport le plus petit** : aucun temps n'est plus court que la route ne le permet (aucune commune au-dessous de 0,5 min par km à vol d'oiseau, à partir d'1 km) ; les plus petits rapports sont ceux de communes près d'une voie rapide.

## Comment le tableau est fait
- **Temps du site** : `mer_min` de `public/data/communes.json`, minutes entières arrondies une seule fois, moitié vers le haut (H191), d'après la matrice d'openrouteservice (profil voiture, sans embouteillages, H194). Calcul envoyé par Vincent le 2026-11-26, de 01:05 à 01:08 ; openrouteservice 10.1.1, routes OpenStreetMap du 2026-11-22, graphe du 2026-11-24.
- **Km** : `mer_km` servi, à vol d'oiseau de la mairie au point de côte (D8 de loyer-mer), affiché au km.
- **Même côté si** : les temps de l'itinéraire en ligne (arrondi à la minute) qui laissent la commune du même côté des quatre pastilles que le temps du site (« moins d'1 min » compte 1 min, R61).
- **Bouts du rapport minutes / km** : temps du site divisé par les km servis, parmi les communes de 1 km à moins de 50 km (sous 1 km, le rapport n'a pas de sens : 0,1 km et 3 min font 30), une seule commune par point de côte (sinon les 5 plus petits seraient 5 voisines sur la même voie rapide ; décidé par Claude).
- **Lien** : openstreetmap.org, itinéraire en voiture (moteur OSRM de la FOSSGIS), de la mairie (point de `reperes.json`, D18 de loyer-mer) au point de côte (`mer.points_cote`, D4). C'est un autre calcul, sur les routes d'OpenStreetMap du jour, qui peut prendre ou non un bac et s'accrocher autrement au point : un écart peut venir de là.
- **Ce que le tableau ne dit pas** : 22 communes sur 34 746 ; les deux calculs comptent la voiture sans embouteillages ; personne n'a encore ouvert les liens.

## Fichiers
- Ce document : `captures/T0b-credibilite.py` (sans réseau). Temps de chaque commune, avec sa mairie, son point de côte et ses accroches : `data-raw/mer-min.csv` (non versionné, `mer_minutes.py --calculer`).
