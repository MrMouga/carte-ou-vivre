# Le temps « Urgences » est-il crédible ? 10 communes confrontées à d'autres sources

2026-11-26 · tâche 0 de /build services, révision D19, D20 · **à juger par Vincent à la démo** · Spec : H205 (« le risque »), D19, H204, D12 · Mesure faite le 2026-11-26 de 20:20 (FINESS) à 20:50 (pages des hôpitaux) ; trajets IGN de 20:27:16 à 20:27:33

## En bref
- **10 communes**, 10 temps d'urgences : **10 « même côté »** des pastilles 15, 30, 45 min (le temps du site et celui de l'itinéraire IGN tombent du même côté de chaque pastille).
- **Service le plus proche qui n'est qu'une base de SMUR : 1 commune sur 10, Chamonix-Mont-Blanc** (seuil d'arrêt de H205 : 2). Le site dit « Urgences : 4 min » ; l'hôpital de Chamonix n'a qu'un SMUR et un centre de soins non programmés ouvert de jour en saison (fermé aujourd'hui) ; l'accueil des urgences ouvert toute l'année est à Sallanches, à 33,9 min par l'itinéraire IGN. Avec un SMUR compté comme un service d'urgence (D19, H204), ce n'est pas un temps faux ; si l'on ne comptait que les accueils, Chamonix passerait de l'autre côté des pastilles 15 et 30. **C'est à toi de voir** (plus bas).
- Auch : l'accueil des urgences existe, mais son accès passe **par le 15 depuis le 9 octobre 2026** (mesure temporaire de l'ARS Occitanie) — exactement ce que dit la phrase des limites (H204 : « sans savoir s'ils accueillent sans appel au 15 »).
- Tende : le site dit « plus d'une heure » pour les urgences (vrai : 81,8 min jusqu'à Menton) et **pour le supermarché (faux dans le texte : 27,3 min jusqu'à Breil-sur-Roya)** ; même côté des pastilles 5, 10, 15 dans les deux cas, donc pas « faux » selon la règle, mais la fiche affiche une valeur fausse. À toi de voir.
- Lignes « autre côté » qui touchent une valeur d'AC-13 : **0**.

## Comment juger (H205)
- **Faux** = du mauvais côté d'une pastille (15, 30, 45 min pour les urgences ; 5, 10, 15 min pour le supermarché) : avec le temps du site, la commune passe un filtre alors qu'en vrai elle ne le passerait pas, ou l'inverse.
- **Un SMUR compte comme un service d'urgence** (D19, H204) : un temps vers une base de SMUR n'est pas faux. Mais si 2 communes ou plus des 10 n'ont qu'une base de SMUR comme service le plus proche, retour à toi (garder les SMUR ou les retirer). Ici : 1.
- **2 communes ordinaires fausses** (Auch, Le Havre, Les Sables-d'Olonne, Mende, Chamonix-Mont-Blanc, Saint-Véran) → retour à toi.
- **Un temps faux** devient « pas de chiffre » par une ligne de `scripts/data/services-retraits.csv` (D12) ; un retrait qui touche une valeur d'AC-13 (Auch, Bordeaux, Mende, Saint-Véran, Chamonix-Mont-Blanc, Les Sables-d'Olonne, L'Île-d'Yeu) est ta décision.

## Tes cases, à la démo
- [ ] Auch : juste · [ ] fausse
- [ ] Le Havre : juste · [ ] fausse
- [ ] Les Sables-d'Olonne : juste · [ ] fausse
- [ ] Mende : juste · [ ] fausse
- [ ] Chamonix-Mont-Blanc (base de SMUR + centre saisonnier ; accueil à Sallanches, 33,9 min) : juste · [ ] fausse
- [ ] Saint-Véran : juste · [ ] fausse
- [ ] Tende (extrême) : juste · [ ] fausse
- [ ] Châteauneuf-d'Entraunes (extrême) : juste · [ ] fausse
- [ ] Sauze (extrême) : juste · [ ] fausse
- [ ] Saint-Dalmas-le-Selvage (extrême) : juste · [ ] fausse
- [ ] SMUR : garder (« Urgences » compte les SMUR, comme H204) · [ ] retirer (il faudrait une autre source des accueils : retour en /spec)
- [ ] Tende, supermarché (« plus d'une heure » affiché, 27 min réels) : garder · [ ] retirer (« pas de chiffre », ligne `06163,supermarche` dans `services-retraits.csv`, H209)
- Communes ordinaires fausses : ___ (2 ou plus → retour)
- Temps à retirer (« pas de chiffre », D12) : ___ (commune, service, preuve)

## Le tableau — urgences
| Commune | Site | Service le plus proche (autre source) | Accueil ou SMUR seul | IGN depuis la mairie | Insee, carré de la mairie | Côté des pastilles 15 / 30 / 45 |
|---|---:|---|---|---:|---:|---|
| Auch (32013), ordinaire | 6 min | Centre hospitalier d'Auch en Gascogne, Auch | **accueil** (pôle « Médecine – Urgences » ; accès par le 15 d'abord depuis le 9/10/2026, temporaire) [1] | 8,2 min · 3,1 km | 4,8 min | même côté |
| Le Havre (76351), ordinaire | 5 min | Clinique Les Ormeaux, Le Havre | **accueil** (FINESS 760780791 : structure des urgences) [2] | 10,7 min · 3,2 km | 4,6 min | même côté |
| Les Sables-d'Olonne (85194), ordinaire | 7 min | Centre hospitalier Côte de Lumière, Les Sables-d'Olonne | **accueil** (page « Urgences » de l'hôpital) [3] | 14,1 min · 6,2 km | 7,1 min | même côté (à 0,9 min du cran 15) |
| Mende (48095), ordinaire | 4 min | Hôpital Lozère, site Vallée du Lot, Mende | **accueil** (FINESS 480000017 : structure des urgences, SMUR, régulation) [2] | 6,0 min · 2,0 km | 2,8 min | même côté |
| Chamonix-Mont-Blanc (74056), ordinaire | 4 min | Hôpitaux du Mont-Blanc, site de Chamonix | **base de SMUR** + centre de soins non programmés **saisonnier, de jour**, « actuellement fermé au public » ; accueil toute l'année à Sallanches [4] ; FINESS : SMUR seul à Chamonix, structure des urgences à Sallanches [2] | 4,4 min · 1,5 km (Sallanches : **33,9 min**) | 3,0 min | même côté avec le SMUR ; **autre côté de 15 et 30** si l'on ne compte que l'accueil |
| Saint-Véran (05157), ordinaire | 55 min | Centre hospitalier d'Embrun (Briançon : 66,6 min) | **accueil** (FINESS 050000256 Embrun et 050000231 Briançon : structure des urgences et SMUR) [2] | 64,1 min · 52,4 km | 56,7 min | même côté (au-delà de 45 des deux côtés ; la fiche dit 55 min, l'IGN plus d'une heure) |
| Tende (06163), extrême | plus d'une heure (227,9) | Centre hospitalier La Palmosa, Menton | **accueil** (FINESS 060002102 : structure des urgences et SMUR) [2] | 81,8 min · 60,2 km | 227,9 min | même côté |
| Châteauneuf-d'Entraunes (06040), extrême | plus d'une heure (113,2) | Polyclinique Saint-Jean, Cagnes-sur-Mer | **accueil** (FINESS 060780517 : structure des urgences) [2] | 123,0 min · 105,7 km | 113,1 min | même côté |
| Sauze (06133), extrême | plus d'une heure (110,8) | Centre hospitalier de Digne-les-Bains | **accueil** (FINESS 040000911 : structure des urgences, SMUR, régulation) [2] | 113,9 min · 104,7 km | 110,8 min | même côté |
| Saint-Dalmas-le-Selvage (06119), extrême | plus d'une heure (108,6) | CHU de Nice, hôpital Pasteur | **accueil** (« Urgences Médicales Adultes – Hôpital Pasteur 2 ») [5] | 109,2 min · 97,6 km | 108,6 min | même côté |

Bases de SMUR seules parmi les 10 : **1** (Chamonix-Mont-Blanc).

## Le supermarché de Tende
| Commune | Site | Supermarché le plus proche (BPE) | IGN depuis la mairie | Insee, carré de la mairie | Côté des pastilles 5 / 10 / 15 |
|---|---:|---|---:|---:|---|
| Tende (06163) | plus d'une heure (224,3) | Roya Distribution, Breil-sur-Roya (type B105, supermarché) | 27,3 min · 20,2 km | 224,3 min | même côté (au-delà de 15 des deux côtés) |

Explication **proposée** : comme pour le commerce alimentaire et le collège de Tende (retirés le 2026-11-24, H175), le distancier de l'Insee (routes OpenStreetMap de 2022) passe par un long détour : la route de la vallée de la Roya, coupée par la tempête Alex d'octobre 2020, n'était sans doute pas encore rouverte dans ses données (hypothèse non vérifiée). Les urgences de Tende ont le même défaut (227,9 au lieu de 81,8 min), sans conséquence : les deux sont au-delà d'une heure. Le supermarché, lui, est affiché « plus d'une heure » pour 27 min ; aucun filtre ne se trompe (au-delà de 15 min des deux côtés), mais la fiche ment.

## Comment le tableau est fait
- **Temps du site** : lu dans `public/data/services.json` (régénéré par la tâche 0), décodé comme le fait la page ; entre parenthèses, la médiane avant arrondi (sortie de `services.py`).
- **Service le plus proche** : les 5 positions distinctes du type D106 (« urgences » : services d'urgence et SMUR) les plus proches de la mairie à vol d'oiseau, prises dans la **BPE 2025 géolocalisée** de l'Insee (`data-raw/bpe-2025/BPE25.zip`, version de novembre 2026, sha256 `afb4d8bd…02e0c4`, celle de la tâche 0c d'origine ; 679 équipements D106 en métropole, tous avec position) ; chacune timée par l'itinéraire de l'IGN ; le plus rapide est retenu. Supermarché : types B104 et B105, même méthode.
- **IGN depuis la mairie** : itinéraire de la Géoplateforme IGN (`data.geopf.fr/navigation/itineraire`, moteur `bdtopo-valhalla`, voiture, le plus rapide ; versions annoncées 2026-11-25 et 2026-11-26), départ au point de la mairie (`reperes.json`) ; 56 demandes GET, sans clé, une toutes les 300 ms au plus, de 20:27:16 à 20:27:33 ; réponses gardées dans `data-raw/bpe-2025/cache-ign.jsonl`. Arrondi comme le site (minute, moitié vers le haut) avant de le comparer aux pastilles.
- **Accueil ou SMUR seul** : d'abord le site de l'hôpital ([1] à [5]) ; ensuite la liste **FINESS** (Agence du numérique en santé, Licence Ouverte) [2] : fichiers mensuels d'octobre 2026, « FINESS - Activités » (`finess-activites-mensuel-202610.json.gz`, 61 414 912 octets, SHA-1 `2a54338bf077afb7859bdc8438b49c465a799a75`) et « FINESS - Structures » (`finess-structures-mensuel-202610.json.gz`, 51 753 164 octets, SHA-1 `fae0829b9b744f4e465cdbab18c22b198987c672`), SHA-1 égaux à ceux publiés, téléchargés le 2026-11-26 à 20:20 dans `data-raw/finess-2026-10/` (non versionné). Activité « médecine d'urgence » = code `QA014` ; modalités **déduites** (la nomenclature de l'ANS refuse le téléchargement automatique) : `MO030` régulation (SAMU : présente à La Roche-sur-Yon, Digne, Mende), `MO031` SMUR, `MO032` structure des urgences (seule modalité des cliniques privées qui ont des urgences : Les Ormeaux, Saint-Jean, Saint-George). **Limite** : la liste des activités exercées de FINESS est incomplète (rien pour le CH d'Auch, ni pour Pasteur au CHU de Nice) ; elle ne sert que de seconde source, jamais seule pour dire « SMUR seul » (Chamonix : c'est la page de l'hôpital qui le dit).
- **Insee, carré de la mairie** : le temps D106 que l'Insee donne pour le carré de 200 m où tombe la mairie (colonne D106 du nouvel extrait). Proche de l'IGN : l'écart du site vient du point de départ (la moitié des habitants contre la mairie) ; loin : les routes diffèrent (Tende).
- **Ce que le tableau ne dit pas** : les urgences hors de France (Tende est à environ une heure de Coni, en Italie, par le tunnel de Tende : non vérifié, non compté) ; l'ouverture réelle (nuit, saison, accès par le 15) d'un accueil ; 10 communes seulement, choisies par H205. 49 des 679 équipements D106 de métropole portent « SMUR » dans leur nom ; d'autres, comme Chamonix, n'en disent rien.
- Scripts et sorties (jetables) : [captures/T0-urgences-mesure.py](captures/T0-urgences-mesure.py) → [captures/T0-urgences-mesure.json](captures/T0-urgences-mesure.json) (chaque trajet essayé, sa requête GET, la réponse) et [captures/T0-urgences-sortie.txt](captures/T0-urgences-sortie.txt) ; FINESS : [captures/T0-finess.py](captures/T0-finess.py) → [captures/T0-finess-sortie.txt](captures/T0-finess-sortie.txt).

## Les 5 essais de chaque commune (minutes IGN depuis la mairie)
- Auch : CH d'Auch 8,2 · CH d'Auch antenne de Condom 47,3 · antenne SMUR de Nérac 76,7 · Clinique des Cèdres (Cornebarrieu) erreur 404 de l'IGN · Clinique Esquirol Saint-Hilaire (Agen) 89,8.
- Le Havre : Clinique Les Ormeaux 10,7 · Hôpital privé de l'Estuaire 17,7 · Hôpital Jacques-Monod (Montivilliers) 20,5 · CH Côte Fleurie (Cricquebœuf) 47,3 · CH de Lillebonne 44,5.
- Les Sables-d'Olonne : CH Côte de Lumière 14,1 · Clinique Saint-Charles (La Roche-sur-Yon) 41,9 · CHD La Roche-sur-Yon 46,1 · CH Loire Vendée Océan (Challans) 68,1 · CH de Luçon 79,0.
- Mende : Hôpital Lozère 6,0 · CH de Millau 84,3 · CH d'Alès 109,4 · Clinique Bonnefon (Alès) 116,6 · CH de Saint-Flour 78,7.
- Chamonix-Mont-Blanc : site de Chamonix 4,4 · **site de Sallanches 33,9** · CH de Bourg-Saint-Maurice 141,6 · CH d'Albertville 96,9 · CH Alpes-Léman (Contamine-sur-Arve) 52,4.
- Saint-Véran : CH de Briançon 66,6 · CH d'Embrun 64,1 · antenne SMUR de Modane 175,9 · CHI des Alpes du Sud, Gap 127,0 · CH de Saint-Jean-de-Maurienne 170,4.
- Tende : CH La Palmosa (Menton) 81,8 · Clinique Saint-George (Nice) 96,4 · CHU de Nice Pasteur 90,5 · Clinique du Parc impérial (Nice) 99,2 · CHU de Nice L'Archet 113,8.
- Châteauneuf-d'Entraunes : CH de Digne 133,5 · CH d'Embrun 129,5 · Clinique Saint-George (Nice) 132,3 · CH de Grasse 140,1 · Polyclinique Saint-Jean (Cagnes-sur-Mer) 123,0.
- Sauze : CH de Grasse 139,3 · CH de Digne 113,9 · Clinique Saint-George 131,4 · Polyclinique Saint-Jean 122,1 · CHU de Nice L'Archet 127,8.
- Saint-Dalmas-le-Selvage : CH d'Embrun 119,3 · CH de Digne 165,6 · Clinique Saint-George 112,6 · CHI des Alpes du Sud, Gap 135,9 · CHU de Nice Pasteur 109,2.
- Tende, supermarché : Roya Distribution (Breil-sur-Roya) 27,3 · Riguizac (Roquebillière) 97,6 · Lys des Alpes (Sospel) 48,3 · Les Halles de la Gare (Saint-Martin-Vésubie) 110,0 · Carei (Menton) 70,3.

## Sources
- [1] Centre hospitalier d'Auch : https://www.ch-auch.fr/pole-medecine-urgences/ ; « Accès aux urgences du Centre Hospitalier d'Auch : Appelez le 15 avant de vous déplacer » (20 novembre 2026, mesure « à compter du 9 octobre 2026 ») : https://www.ch-auch.fr/actualites/acces-aux-urgences-appelez-le-15-avant-de-vous-deplacer/ (lus le 2026-11-26).
- [2] FINESS (ANS, Licence Ouverte) : https://www.data.gouv.fr/datasets/finess-activites-1 et https://www.data.gouv.fr/datasets/finess-structures-1 (fichiers mensuels d'octobre 2026, ci-dessus).
- [3] Centre hospitalier Côte de Lumière : https://www.ch-cotedelumiere.fr/urgences (« Les offres de soins » › « Urgences » ; lu le 2026-11-26).
- [4] Hôpitaux du Pays du Mont-Blanc : https://www.hpmb.fr/poles/urgences-medecine-montagne-sport/urgences-chamonix/ (« Le centre de soins non programmés situé à l'hôpital de Chamonix est actuellement fermé au public », « Le site de Chamonix est ouvert uniquement en journée en période de forte activité touristique », le service des urgences « est composé de deux sites : Sallanches et Chamonix », Sallanches « ouvert toute l'année ») ; page de la commune : https://www.chamonix.fr/demarches/sante/lhopital/ (lus le 2026-11-26).
- [5] CHU de Nice : https://www.chu-nice.fr/patients-et-visiteurs/urgences (« Urgences Médicales Adultes », « Hôpital Pasteur 2 », 30 voie Romaine ; lu le 2026-11-26).
- BPE 2025 géolocalisée : https://www.insee.fr/fr/statistiques/8217525 ; itinéraire IGN : https://data.geopf.fr/navigation/itineraire.
