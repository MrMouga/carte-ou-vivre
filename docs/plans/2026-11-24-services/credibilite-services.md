# Les temps des services sont-ils crédibles ? 10 communes confrontées à l'itinéraire de l'IGN

2026-11-24 · tâche 0c de /build services · **à juger par Vincent à la démo** (pas avant, choix du 2026-11-24) · Spec : [« Le risque »](../../specs/2026-11-23-services/spec.md), D12, R52 · Mesure faite le 2026-11-24 13:19

## En bref
- **100 lignes** (10 communes × 10 services) ; 0 ligne sans temps de l'IGN (0 demande en erreur sur 567).
- **9 lignes « autre côté »** : le temps du site et celui de l'IGN tombent de part et d'autre d'une pastille.
  - Communes ordinaires : Auch **0** · Le Havre **0** · Les Sables-d'Olonne **1** · Mende **0** · Chamonix-Mont-Blanc **0** · Saint-Véran **1**.
  - Extrêmes : Tende **2** · Prads-Haute-Bléone **1** · Roscanvel **3** · L'Aiguillon-la-Presqu'île **1**.
- Lignes « autre côté » qui touchent une valeur d'AC-13 : **0**.
- Un drapeau n'est pas un verdict : il dit où regarder. Chaque drapeau a une explication **proposée** ; c'est toi qui tranches.

## Comment juger (règle de « Le risque », spec)
- **Faux** = du mauvais côté d'une pastille : avec le temps du site, la commune passe un filtre (par exemple « Médecin 10 min ») alors qu'en vrai elle ne le passerait pas, ou l'inverse. Un écart de quelques minutes du même côté de toutes les pastilles n'est pas faux.
- **2 communes ordinaires fausses** (Auch, Le Havre, Les Sables-d'Olonne, Mende, Chamonix-Mont-Blanc, Saint-Véran) → retour à toi sur toute la tranche.
- **Un extrême faux** (Tende, Prads-Haute-Bléone, Roscanvel, L'Aiguillon-la-Presqu'île) → D12 : ce temps devient « pas de chiffre », avec la preuve écrite.
- **Retraits** (« Ce que /build fera seul », plan) : « Un temps jugé faux devient « pas de chiffre » par une ligne de `services-retraits.csv` (D12), sans changer le code ; mais un retrait qui touche une valeur d'AC-13 (Auch, Bordeaux, Mende, Les Sables-d'Olonne, L'Île-d'Yeu) est une décision de Vincent, avec le changement d'AC-13 qui va avec. »

## Tes cases, à la démo
Coche une case par ligne « autre côté » (dans chaque commune, plus bas), puis ici :

- [ ] Auch (ordinaire, 0 « autre côté ») : juste · [ ] fausse
- [ ] Le Havre (ordinaire, 0 « autre côté ») : juste · [ ] fausse
- [ ] Les Sables-d'Olonne (ordinaire, 1 « autre côté ») : juste · [ ] fausse
- [ ] Mende (ordinaire, 0 « autre côté ») : juste · [ ] fausse
- [ ] Chamonix-Mont-Blanc (ordinaire, 0 « autre côté ») : juste · [ ] fausse
- [ ] Saint-Véran (ordinaire, 1 « autre côté ») : juste · [ ] fausse
- [ ] Tende (extrême, 2 « autre côté ») : juste · [ ] fausse
- [ ] Prads-Haute-Bléone (extrême, 1 « autre côté ») : juste · [ ] fausse
- [ ] Roscanvel (extrême, 3 « autre côté ») : juste · [ ] fausse
- [ ] L'Aiguillon-la-Presqu'île (extrême, 1 « autre côté ») : juste · [ ] fausse
- Communes ordinaires fausses : ___ (2 ou plus → la tranche revient à toi)
- Temps à retirer (« pas de chiffre », D12) : ___ (commune, service, preuve)

## Comment le tableau est fait
- **Temps du site** : lu dans `public/data/services.json` (tâche 0b), décodé comme le fait la page (`lireServices` ; même décodage refait en Python dans le script). « Plus d'une heure » = 61 min ou plus.
- **Autre source** : le temps en voiture que calcule l'itinéraire de la Géoplateforme IGN (le service de calcul de trajets de l'IGN, sur sa base des routes BD TOPO ; versions annoncées dans les réponses, selon le serveur qui a répondu : 2026-11-20 (57 réponses), 2026-11-23 (425 réponses), 2026-11-24 (85 réponses) ; moteur `bdtopo-valhalla`, profil voiture, trajet le plus rapide), en partant de la **mairie** (point de `reperes.json`). Demandes GET sans clé, une toutes les 300 ms au plus, du 2026-11-24 13:09:52 au 2026-11-24 13:14:49.
- **Vers quoi** : les équipements du service (types de H158) pris dans la **BPE 2025 géolocalisée** de l'Insee (Base permanente des équipements : la liste des équipements avec leur position ; Licence Ouverte) : `BPE25.zip`, page « Équipements géolocalisés … en 2025 » (insee.fr/fr/statistiques/8217525), parue le 02/11/2026, version de novembre 2026 (fichier `BPE25.csv` daté du 02/11/2026 10:47), 136 936 610 octets, sha256 `afb4d8bd07a66b5f63b68ea9eef16da63413d3ec53d9e77fa4b9ac3c9f02e0c4`, téléchargé le 2026-11-24 à 13:07 dans `data-raw/bpe-2025/`. Métropole seule ; 622 équipements sans position écartés (sur 182 577). « Gare grandes lignes » : les gares nationales (type E107 de la BPE : 110 communes, exactement celles de `services-nationales.csv`) et les 61 gares de `public/data/gares-grandes-lignes.csv`.
- **Quels équipements** : comme prévu par le plan, les 3 positions les plus proches de la mairie à vol d'oiseau ; **en plus** (décidé en cours de mesure), la position la plus proche dans chacune des 5 communes les plus proches. Raison : au bord de la mer, les 3 plus proches à vol d'oiseau peuvent être toutes de l'autre côté de l'eau (Roscanvel : 3 crèches de Brest, 85 min de route, alors que celle de Crozon est à 17 min). Le temps retenu est le plus rapide de tous ces trajets (5 à 7 par ligne). L'élargissement change le drapeau de 2 lignes : Roscanvel Crèche, Roscanvel Collège.
- **Autre côté** : le temps de l'IGN, arrondi à la minute comme celui du site (moitié vers le haut, au moins 1), et le temps du site tombent de part et d'autre d'au moins un cran de la ligne : 5, 10, 15 min (médecin, commerce) ; 5, 10, 20 min (crèche, école, collège, lycée, supérieur) ; 10, 20, 30 min (les trois gares) (R51). Un temps « pas de chiffre » n'est pas comparé.
- **Colonne « Insee, carré de la mairie »** : le temps que l'Insee lui-même donne pour le carré de 200 m où se trouve la mairie (« Gare grandes lignes » : vers une gare nationale seulement, sans les 61 gares). Le site, lui, prend le temps de la moitié des habitants (D3). Si ce temps est proche de celui de l'IGN, l'écart vient du point de départ (habitants contre mairie), pas des routes.
- **Ce que le tableau ne dit pas** : les deux sources comptent la voiture sans embouteillages ; l'Insee utilise les routes d'OpenStreetMap de 2022, l'IGN celles de 2026 ; l'IGN part de la mairie, le site de la moitié des habitants ; un équipement plus rapide par la route mais loin à vol d'oiseau peut encore manquer. 10 communes seulement, choisies par la spec.

## Par commune

### Auch (32013) — commune ordinaire — « autre côté » : 0

Aucune ligne « autre côté ».

| Service | Site | IGN depuis la mairie | Vers (commune de l'équipement) | Insee, carré de la mairie | Côté |
|---|---:|---:|---|---:|---|
| Médecin | 2 min | 1,0 min | Auch (médecin) | 1,0 min | même côté |
| Commerce alimentaire | 2 min | 0,8 min | Auch (épicerie) | 1,0 min | même côté |
| Crèche | 3 min | 3,6 min | Auch (crèche) | 3,1 min | même côté |
| École | 2 min | 1,1 min | Auch (école maternelle) | 1,0 min | même côté |
| Collège | 3 min | 0,8 min | Auch (collège) | 1,1 min | même côté |
| Lycée | 3 min | 2,6 min | Auch (lycée général ou technologique) | 2,1 min | même côté |
| Supérieur | 4 min | 1,6 min | Auch (institut universitaire) | 1,3 min | même côté |
| Gare | 4 min | 6,8 min | Auch (gare régionale) | 3,7 min | même côté |
| Gare régionale | 4 min | 6,8 min | Auch (gare régionale) | 3,7 min | même côté |
| Gare grandes lignes | plus d'une heure | 77,3 min | Toulouse (gare nationale) | 66,6 min | même côté |

### Le Havre (76351) — commune ordinaire — « autre côté » : 0

Aucune ligne « autre côté ».

| Service | Site | IGN depuis la mairie | Vers (commune de l'équipement) | Insee, carré de la mairie | Côté |
|---|---:|---:|---|---:|---|
| Médecin | 2 min | 1,2 min | Le Havre (médecin) | 1,0 min | même côté |
| Commerce alimentaire | 1 min | 1,0 min | Le Havre (supermarché) | 1,0 min | même côté |
| Crèche | 2 min | 2,7 min | Le Havre (crèche) | 1,7 min | même côté |
| École | 1 min | 0,8 min | Le Havre (école élémentaire) | 1,1 min | même côté |
| Collège | 2 min | 2,2 min | Le Havre (collège) | 1,6 min | même côté |
| Lycée | 3 min | 3,6 min | Le Havre (lycée général ou technologique) | 2,5 min | même côté |
| Supérieur | 4 min | 3,6 min | Le Havre (autre enseignement supérieur) | 2,6 min | même côté |
| Gare | 6 min | 6,7 min | Le Havre (gare nationale) | 3,5 min | même côté |
| Gare régionale | 6 min | 6,7 min | Le Havre (gare nationale) | 3,5 min | même côté |
| Gare grandes lignes | 6 min | 6,7 min | Le Havre (gare nationale) | 3,5 min | même côté |

### Les Sables-d'Olonne (85194) — commune ordinaire — « autre côté » : 1

- **Supérieur** : site 9 min, IGN 4,1 min → autre côté de la pastille 5 min. *Explication proposée* : point de départ, pas les routes. La mairie est à 600 m de l'antenne universitaire : l'Insee lui-même donne 4,1 min depuis le carré de la mairie, comme l'IGN. Mais la commune réunit depuis 2019 Les Sables-d'Olonne, Olonne-sur-Mer et Château-d'Olonne : selon l'Insee, 6 % des habitants seulement sont à 5 min ou moins, 75 % à 10 min ou moins. Le site suit sa règle (la moitié des habitants, D3). Valeur hors d'AC-13 (qui ne fixe que « Gare grandes lignes 4 »).
  - [ ] juste (on garde) · [ ] faux (« pas de chiffre », D12)

| Service | Site | IGN depuis la mairie | Vers (commune de l'équipement) | Insee, carré de la mairie | Côté |
|---|---:|---:|---|---:|---|
| Médecin | 2 min | 1,8 min | Les Sables-d'Olonne (médecin) | 1,4 min | même côté |
| Commerce alimentaire | 2 min | 1,2 min | Les Sables-d'Olonne (épicerie) | 1,0 min | même côté |
| Crèche | 3 min | 3,9 min | Les Sables-d'Olonne (crèche) | 2,8 min | même côté |
| École | 2 min | 2,4 min | Les Sables-d'Olonne (école maternelle) | 1,2 min | même côté |
| Collège | 4 min | 1,6 min | Les Sables-d'Olonne (collège) | 1,6 min | même côté |
| Lycée | 4 min | 5,4 min | Les Sables-d'Olonne (lycée général ou technologique) | 3,1 min | même côté |
| Supérieur | 9 min | 4,1 min | Les Sables-d'Olonne (UFR) | 4,1 min | **autre côté** (5 min) |
| Gare | 5 min | 4,1 min | Les Sables-d'Olonne (gare régionale) | 2,6 min | même côté |
| Gare régionale | 5 min | 4,1 min | Les Sables-d'Olonne (gare régionale) | 2,6 min | même côté |
| Gare grandes lignes | 4 min | 4,3 min | Les Sables-d'Olonne (gare « Les Sables-d'Olonne », une des 61 gares ajoutées) | 81,9 min | même côté |

### Mende (48095) — commune ordinaire — « autre côté » : 0

Aucune ligne « autre côté ».

| Service | Site | IGN depuis la mairie | Vers (commune de l'équipement) | Insee, carré de la mairie | Côté |
|---|---:|---:|---|---:|---|
| Médecin | 2 min | 1,7 min | Mende (médecin) | 1,0 min | même côté |
| Commerce alimentaire | 2 min | 1,3 min | Mende (supérette) | 1,0 min | même côté |
| Crèche | 3 min | 2,1 min | Mende (crèche) | 1,5 min | même côté |
| École | 2 min | 0,7 min | Mende (école primaire) | 1,0 min | même côté |
| Collège | 2 min | 1,9 min | Mende (collège) | 1,2 min | même côté |
| Lycée | 2 min | 2,8 min | Mende (lycée général ou technologique) | 1,0 min | même côté |
| Supérieur | 2 min | 0,9 min | Mende (UFR) | 1,0 min | même côté |
| Gare | 3 min | 2,6 min | Mende (gare locale) | 1,4 min | même côté |
| Gare régionale | plus d'une heure | 110,4 min | Le Puy-en-Velay (gare régionale) | 91,6 min | même côté |
| Gare grandes lignes | plus d'une heure | 147,6 min | Montpellier (gare nationale) | 136,0 min | même côté |

### Chamonix-Mont-Blanc (74056) — commune ordinaire — « autre côté » : 0

Aucune ligne « autre côté ».

| Service | Site | IGN depuis la mairie | Vers (commune de l'équipement) | Insee, carré de la mairie | Côté |
|---|---:|---:|---|---:|---|
| Médecin | 3 min | 0,0 min | Chamonix-Mont-Blanc (médecin) | 1,0 min | même côté |
| Commerce alimentaire | 2 min | 0,4 min | Chamonix-Mont-Blanc (supérette) | 1,0 min | même côté |
| Crèche | 2 min | 0,0 min | Chamonix-Mont-Blanc (crèche) | 1,0 min | même côté |
| École | 2 min | 0,8 min | Chamonix-Mont-Blanc (école maternelle) | 1,0 min | même côté |
| Collège | 4 min | 2,2 min | Chamonix-Mont-Blanc (collège) | 1,2 min | même côté |
| Lycée | 4 min | 2,2 min | Chamonix-Mont-Blanc (lycée général ou technologique) | 1,2 min | même côté |
| Supérieur | 58 min | 68,7 min | Samoëns (autre enseignement supérieur) | 58,3 min | même côté |
| Gare | 2 min | 3,4 min | Chamonix-Mont-Blanc (gare locale) | 2,4 min | même côté |
| Gare régionale | 5 min | 5,0 min | Chamonix-Mont-Blanc (gare régionale) | 2,7 min | même côté |
| Gare grandes lignes | plus d'une heure | 80,4 min | Annecy (gare nationale) | 74,0 min | même côté |

### Saint-Véran (05157) — commune ordinaire — « autre côté » : 1

- **Crèche** : site 5 min, IGN 7,7 min → autre côté de la pastille 5 min. *Explication proposée* : surtout le point de départ, un peu la route. Selon l'Insee, 84 % des habitants sont à 5 min ou moins de la crèche de Molines-en-Queyras (2,8 km à vol d'oiseau) ; la mairie fait partie des autres : 6,2 min selon l'Insee lui-même depuis son carré, et l'IGN compte 1,5 min de plus sur la même route (7,7 min pour 4,4 km).
  - [ ] juste (on garde) · [ ] faux (« pas de chiffre », D12)

| Service | Site | IGN depuis la mairie | Vers (commune de l'équipement) | Insee, carré de la mairie | Côté |
|---|---:|---:|---|---:|---|
| Médecin | 17 min | 19,3 min | Aiguilles (médecin) | 18,6 min | même côté |
| Commerce alimentaire | 1 min | 2,4 min | Saint-Véran (épicerie) | 1,0 min | même côté |
| Crèche | 5 min | 7,7 min | Molines-en-Queyras (crèche) | 6,2 min | **autre côté** (5 min) |
| École | 2 min | 0,0 min | Saint-Véran (école élémentaire) | 1,0 min | même côté |
| Collège | 33 min | 34,4 min | Guillestre (collège) | 34,7 min | même côté |
| Lycée | 55 min | 62,2 min | Briançon (lycée général ou technologique) | 56,3 min | même côté |
| Supérieur | plus d'une heure | 120,1 min | Gap (UFR) | 95,0 min | même côté |
| Gare | 40 min | 44,8 min | Eygliers (gare régionale) | 41,5 min | même côté |
| Gare régionale | 40 min | 44,8 min | Eygliers (gare régionale) | 41,5 min | même côté |
| Gare grandes lignes | plus d'une heure | 173,0 min | Modane (gare « Modane », une des 61 gares ajoutées) | 177,0 min | même côté |

### Tende (06163) — extrême — « autre côté » : 2

- **Commerce alimentaire** : site plus d'une heure, IGN 11,2 min → autre côté de la pastille 15 min. *Explication proposée* : routes de l'Insee probablement coupées. L'Insee donne 224 min depuis le carré de la mairie, et ce temps à deux habitants sur trois ; le dernier tiers (le sud de la commune ?) a un commerce à 5 min ou moins. L'IGN (routes de 2026) trouve l'épicerie de La Brigue à 11 min (6,6 km). Hypothèse non vérifiée : dans les routes d'OpenStreetMap de 2022 qu'utilise l'Insee, le bourg de Tende serait coupé du sud de la vallée de la Roya, après les routes détruites par la tempête Alex (octobre 2020) ; 224 min ressemble à un détour par l'Italie. La même coupure expliquerait le collège, le lycée, le supérieur et les gares (196 à 239 min pour l'Insee, 76 à 97 min pour l'IGN, même côté des pastilles).
  - [ ] juste (on garde) · [ ] faux (« pas de chiffre », D12)
- **Collège** : site plus d'une heure, IGN 8,3 min → autre côté de la pastille 10 min, 20 min. *Explication proposée* : même cause probable que le commerce. Le collège est dans la commune, au sud du bourg (3,9 km à vol d'oiseau, 4,9 km de route de la mairie) : 8 min pour l'IGN, 238 min pour l'Insee depuis le carré de la mairie (et pour deux habitants sur trois). Le temps du site, « plus d'une heure », ferait écarter Tende d'un filtre « Collège 10 min » ou « 20 min ».
  - [ ] juste (on garde) · [ ] faux (« pas de chiffre », D12)

| Service | Site | IGN depuis la mairie | Vers (commune de l'équipement) | Insee, carré de la mairie | Côté |
|---|---:|---:|---|---:|---|
| Médecin | 1 min | 1,2 min | Tende (médecin) | 1,0 min | même côté |
| Commerce alimentaire | plus d'une heure | 11,2 min | La Brigue (épicerie) | 224,3 min | **autre côté** (15 min) |
| Crèche | 1 min | 1,3 min | Tende (crèche) | 1,0 min | même côté |
| École | 1 min | 1,3 min | Tende (école primaire) | 1,0 min | même côté |
| Collège | plus d'une heure | 8,3 min | Tende (collège) | 237,5 min | **autre côté** (10 min, 20 min) |
| Lycée | plus d'une heure | 76,5 min | Menton (lycée général ou technologique) | 195,9 min | même côté |
| Supérieur | plus d'une heure | 80,7 min | Menton (institut universitaire) | 226,9 min | même côté |
| Gare | 1 min | 1,1 min | Tende (gare locale) | 1,0 min | même côté |
| Gare régionale | plus d'une heure | 78,6 min | Menton (gare régionale) | 225,5 min | même côté |
| Gare grandes lignes | plus d'une heure | 97,4 min | Nice (gare nationale) | 238,7 min | même côté |

### Prads-Haute-Bléone (04155) — extrême — « autre côté » : 1

- **Commerce alimentaire** : site 19 min, IGN 14,9 min → autre côté de la pastille 15 min. *Explication proposée* : vitesse de la route, à quelques secondes du cran. Depuis le carré de la mairie, l'Insee compte 18,7 min et l'IGN 14,9 min jusqu'à l'épicerie de La Javie (12,3 km de route de montagne) : l'IGN y roule plus vite d'environ 4 min. 14,9 min arrondi donne 15, pile sur le cran. Selon l'Insee, 31 % des habitants seulement sont à 15 min ou moins.
  - [ ] juste (on garde) · [ ] faux (« pas de chiffre », D12)

| Service | Site | IGN depuis la mairie | Vers (commune de l'équipement) | Insee, carré de la mairie | Côté |
|---|---:|---:|---|---:|---|
| Médecin | plus d'une heure | 34,2 min (3 plus proches : 41,1) | Digne-les-Bains (médecin) | 109,8 min | même côté |
| Commerce alimentaire | 19 min | 14,9 min | La Javie (épicerie) | 18,7 min | **autre côté** (15 min) |
| Crèche | 34 min | 34,8 min | Digne-les-Bains (crèche) | 34,1 min | même côté |
| École | 19 min | 16,6 min | La Javie (école maternelle) | 19,1 min | même côté |
| Collège | 34 min | 34,9 min | Digne-les-Bains (collège) | 33,8 min | même côté |
| Lycée | 35 min | 35,3 min | Digne-les-Bains (lycée professionnel) | 34,9 min | même côté |
| Supérieur | 33 min | 32,9 min | Digne-les-Bains (institut universitaire) | 33,3 min | même côté |
| Gare | plus d'une heure | 94,9 min (3 plus proches : 98,8) | La Mure-Argens (gare locale) | 75,0 min | même côté |
| Gare régionale | plus d'une heure | 85,3 min (3 plus proches : 90,6) | La Brillanne (gare régionale) | 75,0 min | même côté |
| Gare grandes lignes | plus d'une heure | 177,3 min | Les Arcs (gare nationale) | 151,8 min | même côté |

### Roscanvel (29238) — extrême — « autre côté » : 3

- **Médecin** : site 10 min, IGN 12,6 min → autre côté de la pastille 10 min. *Explication proposée* : vitesse de la route, au bord du cran. Depuis le carré de la mairie, l'Insee compte 9,4 min et l'IGN 12,6 min jusqu'aux médecins de Camaret-sur-Mer (7,2 km) : environ 3 min d'écart sur la même route. Selon l'Insee, 59 % des habitants sont à 10 min ou moins : la commune est juste au cran.
  - [ ] juste (on garde) · [ ] faux (« pas de chiffre », D12)
- **Crèche** : site plus d'une heure, IGN 17,0 min → autre côté de la pastille 20 min. *Explication proposée* : routes de l'Insee, cause non trouvée. L'Insee donne 77 min depuis le carré de la mairie, à peu près le tour de la rade jusqu'à Brest (85 min pour l'IGN) ; l'IGN trouve la crèche de Crozon à 17 min (10,9 km). Selon l'Insee, un tiers des habitants est pourtant à 20 min ou moins. Je n'explique pas pourquoi les routes de l'Insee n'atteignent pas Crozon depuis la mairie, alors qu'elles atteignent les médecins de Camaret en 9 min. Même écart, du même côté des pastilles, pour le supérieur (70 min pour l'Insee, 23 min pour l'IGN vers Lanvéoc).
  - [ ] juste (on garde) · [ ] faux (« pas de chiffre », D12)
- **Collège** : site plus d'une heure, IGN 15,3 min → autre côté de la pastille 20 min. *Explication proposée* : même cause que la crèche. Les deux collèges de Crozon sont à 15 min pour l'IGN (10,3 km) ; l'Insee donne 77 min depuis le carré de la mairie ; selon lui, un quart des habitants est à 20 min ou moins.
  - [ ] juste (on garde) · [ ] faux (« pas de chiffre », D12)

| Service | Site | IGN depuis la mairie | Vers (commune de l'équipement) | Insee, carré de la mairie | Côté |
|---|---:|---:|---|---:|---|
| Médecin | 10 min | 12,6 min | Camaret-sur-Mer (médecin) | 9,4 min | **autre côté** (10 min) |
| Commerce alimentaire | 3 min | 2,0 min | Roscanvel (épicerie) | 1,0 min | même côté |
| Crèche | plus d'une heure | 17,0 min (3 plus proches : 85,4) | Crozon (crèche) | 76,8 min | **autre côté** (20 min) |
| École | 3 min | 0,6 min | Roscanvel (école primaire) | 1,0 min | même côté |
| Collège | plus d'une heure | 15,3 min (3 plus proches : 86,0) | Crozon (collège) | 77,0 min | **autre côté** (20 min) |
| Lycée | plus d'une heure | 67,2 min (3 plus proches : 78,4) | Douarnenez (lycée professionnel) | 69,7 min | même côté |
| Supérieur | plus d'une heure | 22,8 min (3 plus proches : 91,1) | Lanvéoc (école d'ingénieurs) | 70,2 min | même côté |
| Gare | 58 min | 57,9 min | Loperhet (gare locale) | 57,4 min | même côté |
| Gare régionale | plus d'une heure | 68,2 min | Landerneau (gare régionale) | 64,2 min | même côté |
| Gare grandes lignes | plus d'une heure | 72,5 min | Brest (gare nationale) | 67,9 min | même côté |

### L'Aiguillon-la-Presqu'île (85001) — extrême — « autre côté » : 1

- **Gare** : site 29 min, IGN 32,1 min → autre côté de la pastille 30 min. *Explication proposée* : vitesse de la route, à 2 min du cran. Depuis le carré de la mairie, l'Insee compte 27,8 min et l'IGN 32,1 min jusqu'à la gare de Luçon (26 km) ; selon l'Insee, 73 % des habitants sont à 30 min ou moins.
  - [ ] juste (on garde) · [ ] faux (« pas de chiffre », D12)

| Service | Site | IGN depuis la mairie | Vers (commune de l'équipement) | Insee, carré de la mairie | Côté |
|---|---:|---:|---|---:|---|
| Médecin | 2 min | 2,3 min | L'Aiguillon-la-Presqu'île (médecin) | 1,1 min | même côté |
| Commerce alimentaire | 2 min | 0,2 min | L'Aiguillon-la-Presqu'île (supermarché) | 1,0 min | même côté |
| Crèche | 55 min | 36,3 min | Luçon (crèche) | 54,7 min | même côté |
| École | 2 min | 2,2 min | L'Aiguillon-la-Presqu'île (école primaire) | 1,2 min | même côté |
| Collège | 11 min | 12,0 min | Saint-Michel-en-l'Herm (collège) | 9,9 min | même côté |
| Lycée | 27 min | 33,7 min | Luçon (lycée général ou technologique) | 25,9 min | même côté |
| Supérieur | 51 min | 57,8 min (3 plus proches : 65,0) | La Roche-sur-Yon (autre enseignement supérieur) | 50,3 min | même côté |
| Gare | 29 min | 32,1 min | Luçon (gare locale) | 27,8 min | **autre côté** (30 min) |
| Gare régionale | 51 min | 56,1 min | La Roche-sur-Yon (gare régionale) | 50,2 min | même côté |
| Gare grandes lignes | 32 min | 32,1 min | Luçon (gare « Luçon », une des 61 gares ajoutées) | 57,1 min | même côté |

## Fichiers
- Scripts (jetables) : `captures/T0c-1-extraire-bpe.py` (extrait de la BPE), `captures/T0c-2-mesurer.py` (trajets de l'IGN), `captures/T0c-3-tableau.py` (ce document), explications : `captures/T0c-explications.csv`.
- Mesure complète (chaque trajet, avec sa requête) : `captures/T0c-mesure.json` ; sortie : `captures/T0c-sortie-mesure.txt`.
- Réponses de l'IGN gardées (non versionnées) : `data-raw/bpe-2025/cache-ign.jsonl`.
- Deux lignes redemandées à l'IGN après la mesure (Roscanvel crèche, Tende collège), mêmes temps et mêmes distances, y compris sur un serveur d'une autre version : `captures/T0c-reverification.txt` ; la requête d'une ligne s'affiche avec `captures/T0c-4-urls.py`.
