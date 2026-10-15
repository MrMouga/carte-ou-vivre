# Mesure de la tâche 0 — zone de montagne, grille Insee, prix tous biens
2026-10-15, 13:56 → 14:40 · script jetable : [`mesure/mesure.py`](mesure/mesure.py) (+ `mesure/xls.py`, repris de la discovery tel quel) · sortie complète en fin de document · rien n'est branché au site.

Lancer : `python3 -I -u docs/plans/2026-10-15-cadre-de-vie/mesure/mesure.py` (≈ 2 min 20). Sources téléchargées le 2026-10-15 dans `data-raw/montagne/`, `data-raw/densite/` et `data-raw/v_mvt_commune_2025.csv` (les mouvements du COG 2025, Insee, pour le recalage ; même jeu que `v_commune_2025.csv`).

## Méthode (R29, H73, H81)
- **Point de départ** : la mairie (`communes-mairie.json`, D18 de loyer-mer). **Distance** : à vol d'oiseau, en Lambert-93, jusqu'au bord de la zone ; bord échantillonné tous les 100 m au plus (erreur < 50 m), bords intérieurs entre deux communes classées retirés. **0** si la commune est classée, en tout ou partie, ou si sa mairie est dans la zone (H81). Affiché = arrondi au km, « moins d'1 km » compté 1 km (comme `merComparee` de `src/domain/score.ts`).
- **Recalage sur 2025** : chaînes de fusions du COG 2025 (`cog.py` de la discovery) ; **et, nouveau, les rétablissements** : une commune rétablie après la date de la source hérite du classement de celle dont elle sort. Effet : Celles, Chalinargues, Chavagnac, Sainte-Anastasie (Cantal), sorties de Neussargues en Pinatelle le 1er janvier 2025, sont classées par les deux sources. La discovery les avait manquées (5 882 → 5 886) ; sans cette règle, la source B les trouvait par H81 (mairie dans la zone).
- **« En partie »** : drapeau de la source (A : « P » dans une colonne « Partie de commune » d'une ligne Art 18 ; B : `classement` = `partie`), ou commune 2025 née d'une fusion entre une commune classée et une qui ne l'est pas.
- **Source A, la règle testée par la discovery** : commune 2025 en zone de montagne de l'Agriculture 2017 (« Art 18 ») **et** dans un massif de l'ANCT 2021. Zone = union des contours 2025 des communes classées (la source n'a pas de contours).
- **Source B, Cerema** : communes 2019 de la loi Montagne. Zone = **ses propres contours** : communes « totalité » (contours Admin Express 2019 de la couche du Cerema) + zones infra-communales. **Repli, décidé ici** : 143 des 182 communes « partie » n'ont pas de zone infra-communale (9 départements n'ont pas de fichier : Ain, Allier, Doubs, Isère, Loire, Pyrénées-Atlantiques, Haut-Rhin, Savoie, Haute-Savoie), on y prend le contour entier de la commune. Variante B2 (contours 2025 entiers, comme A) donnée pour les villes du risque.
- **10 premières à « 10 km »** : la note de `src/domain/score.ts` reproduite (lue, pas modifiée) : loyer pour 52 m² (plafond 1 200 € ou Sans limite), montagne notée comme la mer (100 × (1 − d / 10), commune de montagne : 100), score = moyenne arrondie ; tri score décroissant, puis loyer croissant, puis nom (ordre français approché : sans accents ni casse).
- **Recoupement avec la discovery** (même règle A, centre de commune vers centre de la commune classée la plus proche) : le script retrouve exactement Grenoble 3,8, Clermont-Ferrand 4,5, Pau 17,0, Lyon 13,8, Limoges 18,9, Toulouse 51,9, Bordeaux 173,3 km et 5 882 communes (avant les rétablissements). Avec R29, les distances baissent de 3 à 9 km : on mesure jusqu'au **bord** de la zone, plus jusqu'au **centre** d'une commune classée (Lyon : 13,8 → 10,6 km jusqu'au bord de Pollionnay ; Toulouse : 51,9 → 47,2 km ; Bordeaux : 173 → 164 km). La mairie au lieu du centre ne joue presque pas sur ces villes.

## Les deux sources

| | A — Agriculture 2017 × ANCT 2021 | B — Cerema, loi Montagne (communes 2019) |
|---|---|---|
| Communes 2025 classées | **5 886** | **5 514** |
| dont « en partie » | 370 (367 par le drapeau P, 4 par une fusion mêlée ; une commune a les deux) | 182 (drapeau ; aucune fusion mêlée) |
| Codes sans correspondance en 2025 (métropole) | 0 (Agriculture : un code lu comme un nombre, Lieoux 31300, corrigé : c'était la « ligne mal formée » de la discovery) ; 0 pour l'ANCT | 0 |
| Mairies dans la zone sans commune classée (H81) | 0 | 0 (4 avant la règle des rétablissements : les 4 communes du Cantal) |
| Contours de la zone | contours 2025 des communes classées | contours propres : 5 343 communes « totalité » + 35 zones infra-communales (34 départements) ; repli contour entier pour 143 communes « partie » |
| Écartées par la règle | 110 communes Art 18 hors massif (Brie-sous-Chalais…) | — |

**Villes du risque** (km depuis la mairie ; affiché ; zone la plus proche)

| Ville | A | B | B2 (contours 2025) | Discovery (centre → centre, règle A) |
|---|---|---|---|---|
| Chamonix-Mont-Blanc | Commune de montagne | Commune de montagne | 0 | 0 |
| Grenoble | 0,68 → **1 km** (La Tronche) | 0,65 → **1 km** (La Tronche, contour entier : repli) | 0,68 | 3,8 |
| Annecy | **Commune de montagne** (en partie) | **Commune de montagne** (en partie) | 0 | 0 |
| Pau | 11,59 → **12 km** (Haut-de-Bosdarros) | 12,74 → **13 km** (Rébénacq) | 12,76 | 17,0 |
| Clermont-Ferrand | 2,47 → **2 km** (Durtol) | 2,47 → **2 km** (Durtol) | 2,47 | 4,5 |
| Lyon | 10,63 → **11 km** (Pollionnay, commune entière) | 13,70 → **14 km** (la partie classée de Pollionnay) | 10,63 | 13,8 |
| Limoges | 16,23 → **16 km** (Saint-Sylvestre) | 22,88 → **23 km** (Saint-Léger-la-Montagne) | 22,85 | 18,9 |
| Toulouse | 47,16 → **47 km** (Labécède-Lauragais, Montagne Noire) | 47,16 → **47 km** (même point, zone infra-communale de l'Aude) | 47,16 | 51,9 |
| Bordeaux | 164,31 → **164 km** (Hasparren, Pays basque) | 172,79 → **173 km** (Turenne, Corrèze) | 172,77 | 173,3 |

**Villes de plus de 50 000 habitants classées** — les mêmes pour les deux : Saint-Étienne (173 136 hab., en partie) et Annecy (132 117 hab., en partie). Aucune par H81.

**10 premières à « 10 km »**, prix de départ (1 200 € pour 52 m², tout le reste sur Peu importe) — A : 9 396 communes passent ; B : 8 945. Toutes « Commune de montagne », score 86, à 326-327 € :
- A : Allarmont (88005, 214 hab.), Celles-sur-Plaine (88082, 737), La Petite-Raon (88346, 734), Luvigny (88277, 123), Moussey (88317, 548), Raon-lès-Leau (54443, 40), Raon-sur-Plaine (88373, 135), Vexaincourt (88503, 146) à 326 € ; Celoux (15032, 59), Champagnac-le-Vieux (43052, 191) à 327 €.
- B : les mêmes sans Raon-lès-Leau (Meurthe-et-Moselle, absente du Cerema) ; Chaniat (43055, 164 hab., 327 €) entre en 10e.

**Avec le prix sur Sans limite** : la même liste, dans le même ordre, toutes à 100 (A : 9 419 communes passent ; B : 8 968). Ce sont les communes de montagne au loyer le plus bas : vallée de la Plaine (Vosges), Cantal, Haute-Loire.

**Répartition par choix** (distance affichée ; nombre de communes, cumul entre parenthèses)

| Choix | A | B |
|---|---|---|
| 0 (Commune de montagne) | 5 886 | 5 514 |
| 1 à 10 km | 3 537 (9 419) | 3 454 (8 968) |
| 11 à 30 km | 3 937 (13 356) | 3 640 (12 608) |
| 31 à 50 km | 2 411 (15 767) | 2 118 (14 726) |
| 51 à 100 km | 3 726 (19 493) | 3 574 (18 300) |
| au-delà de 100 km | 15 253 | 16 446 |

**Écarts entre les sources** : 5 507 communes classées par les deux ; **379 par A seulement**, **7 par B seulement**.
- A seulement, les plus peuplées : Cluses (74, 17 795 hab. ; à 0,7 km de la zone B), Firminy (42, 17 060 ; 1,9 km), Rumilly (74, 16 442 ; 1,2 km), Saint-Just-Saint-Rambert (42, 15 764 ; 1,9 km), Le Chambon-Feugerolles (42, 12 314 ; 2,6 km), Onet-le-Château (12, 12 080 ; 1,1 km), Villefranche-de-Rouergue (12, 11 271 ; 3,6 km), Limoux (11, 10 532 ; 5,9 km), Roche-la-Molière (42, 9 843 ; 0,9 km), Poisy (74, 9 291 ; 1,6 km). Par département : Haute-Savoie 57, Loire 52, Aveyron 48, Pyrénées-Atlantiques 31, **Nièvre 24, Saône-et-Loire 20, Côte-d'Or 4 (le Morvan, absent du Cerema)**, Isère 23…
- B seulement : Vindry-sur-Turdine (69, 5 305 hab.), Savigny (69, 1 995), Saint-Romain-de-Popey (69, 1 725), Provenchères-et-Colroy (88, 1 283), Arboys en Bugey (01, 710), Saint-Martin-de-Vaulserre (38, 246), Saint-Martin-de-Lansuscle (48, 191) — toutes à moins de 2 km de la zone A.
- Distances : 16 491 communes changent de distance affichée, 9 121 de plus de 10 km. Les plus grands écarts sont dans l'Yonne : sans le Morvan, la montagne la plus proche est à 150-200 km avec B au lieu de 20-70 km avec A (Saint-Florentin 69,5 → 194,7 km).

## Grille communale de densité Insee 2025 (D10, H72) — relue, conforme au plan
Fichier `fichier_diffusion_2025.xlsx`, feuille « Maille communale », « Mise en ligne le 21/07/2025 · Géographie au 01/01/2025 », 34 875 lignes. Colonnes `CODGEO`, `DENS7`, `LIBDENS7` (et `DENS`, `PMUN22`…).
- Libellés `DENS7` : 1 Grands centres urbains · 2 Centres urbains intermédiaires · 3 Petites villes · 4 Ceintures urbaines · 5 Bourgs ruraux · 6 Rural à habitat dispersé · 7 Rural à habitat très dispersé. `DENS` : 1 Urbain dense (699) · 2 Urbain intermédiaire (3 580 = 637 + 947 + 1 996 : exactement `DENS7` 2, 3, 4) · 3 Rural. Le regroupement de D10 suit donc la grille officielle pour les deux niveaux urbains.
- Sur les 34 746 communes du site : **0 sans type** ; ville-dense **692**, ville-et-peripherie **3 514**, bourg-et-village **23 305**, campagne-isolee **7 235** (les chiffres du plan). Bordeaux `DENS7` 1 → ville-dense ; Lacanau 5 → bourg-et-village ; Chamonix 3 → ville-et-peripherie ; Paris, Lyon, Marseille 1 → ville-dense, une ligne chacune, aucun arrondissement dans le fichier.
- À savoir : la page de l'Insee propose depuis peu une « Grille de densité au 1er janvier 2026 » ; on garde 2025, qui suit la géographie du COG 2025 du site.

## Mentions et licences (H80) — texte proposé pour la tâche 1
| Source | Producteur, jeu | Licence (vérifiée sur data.gouv.fr / insee.fr le 2026-10-15) | Mention proposée |
|---|---|---|---|
| Grille de densité | Insee, « La grille de densité 2025 » (insee.fr/fr/information/8571524) | Licence Ouverte 2.0 ; l'Insee demande « Source : Insee » et la date de dernière mise à jour quand elle est connue | « Type d'environnement : Insee, grille communale de densité 2025 (mise en ligne le 21/07/2025) » |
| Montagne A | Ministère de l'Agriculture, « Communes de montagne » (zones défavorisées au 1er janvier 2017, Art 18) ; ANCT, « Les périmètres de massifs » (COG 2021) | Licence Ouverte (version 1, `fr-lo`) pour les deux | « Zone de montagne : ministère de l'Agriculture, zone de montagne 2017, et ANCT, périmètres de massifs 2021 » |
| Montagne B | Cerema, « Application des dispositions d'urbanisme de la loi Montagne en France Métropolitaine » (communes au 1er janvier 2019, mis à jour le 18/11/2024) | Licence Ouverte 2.0 (`lov2`) | « Zone de montagne : Cerema, communes soumises à la loi Montagne (2019) » |

Les trois contiennent ce que R30 demande (« grille communale de densité » et « Insee » ; « Zone de montagne » et la source).

## D12 d'immobilier — prix tous biens (fichiers DVF du 17/07/2026, empreintes de CLAUDE.md vérifiées par `communes.py`)
Règle appliquée : D5 complète (récent dès 30 ventes 2023-2025, sinon 5 ventes 2021-2025, plancher 300 €/m²), commune puis intercommunalité, puis **tous biens** (`apt_maison`) de la commune puis de l'intercommunalité. Les fonctions de `scripts/data/communes.py` sont réutilisées telles quelles (importées, pas modifiées) : hors tous biens, le résultat est identique à `public/data/achat.json` pour les 34 746 communes.

| Source | Appartement | Maison |
|---|---|---|
| commune | 6 268 | 30 878 |
| secteur | 24 678 | 2 262 |
| tous-biens | **1 983** (301 récents, 1 682 sur 2021-2025) | 0 |
| tous-biens-secteur | **211** (tous récents) | 0 |
| inconnu-secteur | **1** (Île-de-Sein) | **1** (Île-de-Sein) |
| inconnu-alsace-moselle | 1 605 | 1 605 |

- **Écart avec D12** : la spec annonçait « maisons : 1 → 0 ». C'est faux : la seule commune sans prix de maison, **Île-de-Sein (29083)**, n'a **aucune vente** dans le fichier et pas d'intercommunalité (`code_parent` = « 29 ») ; elle reste sans prix en appartement comme en maison. Appartements : 2 195 → 1, comme annoncé (1 983 + 211 au lieu de 1 993 + 201 sur 2021-2025 seul).
- **Les 1 % les plus bas des prix tous biens retenus** (appartement, 22 communes sur 2 194) : de **323 €/m²** (Outremécourt, 52, 75 hab.) à 428 €/m² (Bernon, 10) ; 20 sur 22 en Haute-Marne et dans la Meuse, toutes de moins de 650 hab. Médiane des prix tous biens : 1 119 €/m², maximum 6 667 €/m².
- **10 premières en Appartement · Acheter à 5 000 €/m²**, tout le reste sur Peu importe (32 833 communes notées) : Montdardier (30176, 300 €/m², commune, règle 2), puis Achères, Allogny, Allouis, Aubinges, Azy, Brécy, Fussy, Henrichemont, Humbligny (Cher, 312 €/m², secteur de leur intercommunalité, 2021-2025), score 94. **Aucune au prix tous biens** : la première est 33e (Outremécourt, 323 €/m²) ; 14 dans les 100 premières. La tête de liste ne change pas avec D12.
- **Paris, Lyon, Marseille** : **aucun** des 45 arrondissements ne tombe en tous biens, ni en appartement ni en maison. La règle prévue en tâche 1 pour ces trois villes (« tous-biens si un arrondissement au moins l'a ») ne s'applique jamais aujourd'hui.
- **Communes nommées par le plan** (pour `communes.test.ts`, tâche 1) : **Agnicourt-et-Séchelles (02004), appartement → 733 €/m², source `tous-biens`** (12 ventes de maisons 2021-2025, aucune d'appartement : c'est le prix des maisons) ; **Île-de-Sein (29083), maison → sans prix, `inconnu-secteur`** (inchangé). Exemples nommés : `tous-biens` Desvres (62268, 4 829 hab.) 1 493 €/m² ; `tous-biens-secteur` Tingry (62821, 291 hab.) 1 714 €/m².

## Ce qui n'est pas vérifié
- Les 70 lignes de l'Agriculture marquées « M » sans article sont toutes en outre-mer : sans effet. Les lignes « Art 18 » portent un seul drapeau « partie » par décision ; je compte « en partie » dès qu'une des quatre colonnes le porte.
- Le repli de B (contour entier de 143 communes « partie ») rapproche un peu la zone pour leurs voisines ; Grenoble en dépend (La Tronche, Isère, sans zone infra-communale).
- L'ordre des noms à égalité approche `localeCompare('fr')` ; il ne change rien aux listes ci-dessus (égalités départagées d'abord par le loyer).

## Pour le choix de Vincent

| | A — Agriculture 2017 × massifs ANCT 2021 | B — Cerema, loi Montagne 2019 |
|---|---|---|
| Communes de montagne | 5 886 | 5 514 |
| Chamonix · Annecy | montagne · montagne | montagne · montagne |
| Grenoble · Clermont-Ferrand | 1 km · 2 km | 1 km · 2 km |
| Pau · Lyon · Limoges | 12 · 11 · 16 km | 13 · 14 · 23 km |
| Toulouse · Bordeaux | 47 · 164 km | 47 · 173 km |
| Villes > 50 000 hab. classées | Saint-Étienne, Annecy (en partie) | les mêmes |
| 10 premières à « 10 km » | villages des Vosges, du Cantal et de Haute-Loire à 326-327 € | les mêmes, sauf Raon-lès-Leau |
| Ce qui manque ou surprend | Cluses, Rumilly, Firminy, Onet-le-Château en montagne ; une règle croisée, inventée par la discovery | le Morvan absent (Yonne à 150-200 km de la montagne) ; 143 communes « partie » sans leur partie dessinée |
| Mentions | deux producteurs | un seul |

**Ma recommandation : B, le Cerema.** C'est la source que D5 nomme (« la zone de la loi Montagne »), un seul producteur et une seule mention, sous Licence Ouverte 2.0, sans règle croisée inventée par nous. Ses propres contours placent la montagne là où la loi la place dans les communes classées en partie : Lyon à 14 km au lieu de 11. Sur les villes du risque, les deux sources ne diffèrent que de 1 à 7 km. Les grandes villes classées et la tête de liste sont les mêmes.
**Coût** : 48 communes de la Nièvre, de la Saône-et-Loire et de la Côte-d'Or, surtout le Morvan, ne sont pas en montagne pour B. L'Yonne et le nord de la Bourgogne se retrouvent à plus de 150 km de la montagne. La tâche 1 lit deux couches de formes (≈ 60 lignes de plus dans `montagne.py`, 6 Mo à télécharger).
**Si c'est faux** : changer de source en tâche 1 coûte environ une heure (les sources de `montagne.py`) et les valeurs de Bordeaux dans les tests.
**Option A** : garder la règle de la discovery, déjà jugée sur ses chiffres et qui inclut le Morvan. Coût : deux mentions, et des villes de vallée en montagne (Cluses, Rumilly, Firminy).

## Choix et jugement de Vincent
2026-10-15, 14:50 (orchestrateur, d'après les réponses de Vincent) :
- **Source retenue : B, Cerema (loi Montagne, communes 2019)** — **décidé par Claude** : Vincent a demandé « laquelle des deux sources te semble plus cohérente ». Pourquoi : une seule zone, légale, un seul producteur, celle que nomme D5 ; A est une règle croisée de notre invention ; les villes du risque ne diffèrent que de 1 à 7 km. Coût si c'est faux : le Morvan n'est pas en montagne (Yonne à 150-200 km) ; passer à A coûte ≈ 1 h en tâche 1. Contestable à la démo.
- **Villes du risque : une seule jugée fausse, Lyon (14 km)**. Vincent : « Pour Lyon t'as pas pris en compte le Mont d'Or ? ». Vérifié dans les fichiers : les communes du Mont d'Or (Saint-Cyr, Saint-Didier, Poleymieux, Limonest, Couzon, Curis, Saint-Germain, Saint-Romain-au-Mont-d'Or) ne sont classées en montagne **ni par B ni par A** (la commune classée la plus proche de Lyon est Pollionnay, 11 km avec A) : la zone mesurée est la zone légale (D5), pas le relief. Une ville fausse < seuil d'arrêt (2) : le build continue ; Lyon et le Mont d'Or sont rejugés à la démo.
- **Grandes villes classées (Saint-Étienne, Annecy) et 10 premières à « 10 km »** : « Oui, ça me va ».

## Sortie du script (2026-10-15, 14:22)
```
# Sortie du script de mesure, tâche 0 de cadre-de-vie

COG 2025 métropole : 34746 communes ; contours 2025 : 34746 ; mairies : 34746
  code agri lu comme un nombre : 31300.0 (LIEOUX)
  rétablie après la source : Celles (15031) hérite de 15141
  rétablie après la source : Chalinargues (15035) hérite de 15141
  rétablie après la source : Chavagnac (15047) hérite de 15141
  rétablie après la source : Sainte-Anastasie (15171) hérite de 15141
  rétablie après la source : Les Hauts-Talican (60694) hérite de 60054
  rétablie après la source : L'Oie (85165) hérite de 85084
  rétablie après la source : Sainte-Florence (85212) hérite de 85084
  rétablie après la source : Celles (15031) hérite de 15141
  rétablie après la source : Chalinargues (15035) hérite de 15141
  rétablie après la source : Chavagnac (15047) hérite de 15141
  rétablie après la source : Sainte-Anastasie (15171) hérite de 15141

## Source A — zone de montagne 2017 (Agriculture, « Art 18 ») × massifs 2021 (ANCT)

  lignes agri : 16117
  codes agri : 16116
  codes agri Art 18 : 6082
  lignes Art 18 « partie de commune » : 421
  agri sans article mais « M » : 70
  codes ANCT : 34965
  communes 2025 Art 18 (agri seul) : 5996
  communes 2025 de massif (ANCT seul) : 8525
  agri sans correspondance (métropole) : []
  ANCT sans correspondance (métropole) : []
  en partie : drapeau P : 367
  en partie : fusion mêlée agri : 4
  en partie : fusion mêlée ANCT : 0
  Art 18 hors massif (écartées par la règle) : 110
  communes agri sans article mais « M » (Montagne - FR), non comptées par la règle de la discovery : ['97101', '97104', '97106', '97107', '97109', '97111', '97113', '97116', '97117', '97121', '97124', '97128']…

## Source A — distances (union des contours 2025 des communes classées)

Zone : union des contours 2025 (Etalab, 100 m) des communes classées ; 139880 points de bord (un tous les 100 m au plus, bords intérieurs retirés)
Communes 2025 classées : 5886 (dont en partie : 370) ; mairies dans la zone sans commune classée (H81) : 0

Villes du risque (distance de la mairie au bord de la zone, km non arrondis ; affiché ; point le plus proche dans) :
  Chamonix-Mont-Blanc (74056) : 0.00 km → affiché Commune de montagne ; classée
  Grenoble (38185) : 0.68 km → affiché 1 km ; zone la plus proche : La Tronche (38516)
  Annecy (74010) : 0.00 km → affiché Commune de montagne ; classée en partie
  Pau (64445) : 11.59 km → affiché 12 km ; zone la plus proche : Haut-de-Bosdarros (64257)
  Clermont-Ferrand (63113) : 2.47 km → affiché 2 km ; zone la plus proche : Durtol (63141)
  Lyon (69123) : 10.63 km → affiché 11 km ; zone la plus proche : Pollionnay (69154)
  Limoges (87085) : 16.23 km → affiché 16 km ; zone la plus proche : Saint-Sylvestre (87183)
  Toulouse (31555) : 47.16 km → affiché 47 km ; zone la plus proche : Labécède-Lauragais (11181)
  Bordeaux (33063) : 164.31 km → affiché 164 km ; zone la plus proche : Hasparren (64256)

Villes de plus de 50 000 habitants classées (ou H81) :
  Saint-Étienne (42218, 173 136 hab.) — en partie
  Annecy (74010, 132 117 hab.) — en partie

Répartition par choix (distance affichée) :
  0 (commune de montagne) : 5886 (cumul 5886)
  1 à 10 km : 3533 (cumul 9419)
  11 à 30 km : 3937 (cumul 13356)
  31 à 50 km : 2411 (cumul 15767)
  51 à 100 km : 3726 (cumul 19493)
  au-delà de 100 km : 15253 (cumul 34746)

10 premières à « 10 km », prix de départ 1 200 € pour 52 m² (9396 communes passent) :
  1. Allarmont (88005, 88) — 214 hab. — score 86 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  2. Celles-sur-Plaine (88082, 88) — 737 hab. — score 86 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  3. La Petite-Raon (88346, 88) — 734 hab. — score 86 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  4. Luvigny (88277, 88) — 123 hab. — score 86 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  5. Moussey (88317, 88) — 548 hab. — score 86 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  6. Raon-lès-Leau (54443, 54) — 40 hab. — score 86 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  7. Raon-sur-Plaine (88373, 88) — 135 hab. — score 86 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  8. Vexaincourt (88503, 88) — 146 hab. — score 86 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  9. Celoux (15032, 15) — 59 hab. — score 86 — loyer 327 € — montagne Commune de montagne (exact 0.00 km)
  10. Champagnac-le-Vieux (43052, 43) — 191 hab. — score 86 — loyer 327 € — montagne Commune de montagne (exact 0.00 km)

10 premières à « 10 km », prix sur Sans limite (9419 communes passent) :
  1. Allarmont (88005, 88) — 214 hab. — score 100 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  2. Celles-sur-Plaine (88082, 88) — 737 hab. — score 100 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  3. La Petite-Raon (88346, 88) — 734 hab. — score 100 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  4. Luvigny (88277, 88) — 123 hab. — score 100 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  5. Moussey (88317, 88) — 548 hab. — score 100 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  6. Raon-lès-Leau (54443, 54) — 40 hab. — score 100 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  7. Raon-sur-Plaine (88373, 88) — 135 hab. — score 100 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  8. Vexaincourt (88503, 88) — 146 hab. — score 100 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  9. Celoux (15032, 15) — 59 hab. — score 100 — loyer 327 € — montagne Commune de montagne (exact 0.00 km)
  10. Champagnac-le-Vieux (43052, 43) — 191 hab. — score 100 — loyer 327 € — montagne Commune de montagne (exact 0.00 km)

Recoupement avec la discovery (centre de commune → centre de la commune classée la plus proche, même règle) :
  Chamonix-Mont-Blanc : 0.0 km (méthode discovery) ; 0.0 km (R29 : mairie → bord de la zone)
  Grenoble : 3.8 km (méthode discovery) ; 0.7 km (R29 : mairie → bord de la zone)
  Annecy : 0.0 km (méthode discovery) ; 0.0 km (R29 : mairie → bord de la zone)
  Pau : 17.0 km (méthode discovery) ; 11.6 km (R29 : mairie → bord de la zone)
  Clermont-Ferrand : 4.5 km (méthode discovery) ; 2.5 km (R29 : mairie → bord de la zone)
  Lyon : 13.8 km (méthode discovery) ; 10.6 km (R29 : mairie → bord de la zone)
  Limoges : 18.9 km (méthode discovery) ; 16.2 km (R29 : mairie → bord de la zone)
  Toulouse : 51.9 km (méthode discovery) ; 47.2 km (R29 : mairie → bord de la zone)
  Bordeaux : 173.3 km (méthode discovery) ; 164.3 km (R29 : mairie → bord de la zone)
  rétablie après la source : Celles (15031) hérite de 15141
  rétablie après la source : Chalinargues (15035) hérite de 15141
  rétablie après la source : Chavagnac (15047) hérite de 15141
  rétablie après la source : Sainte-Anastasie (15171) hérite de 15141

## Source B — zonage loi Montagne du Cerema (communes 2019)

  communes 2019 listées : 5525
  totalité : 5343
  partie : 182
  sans correspondance 2025 (métropole) : []
  en partie : drapeau partie : 182
  en partie : fusion avec une commune non listée : 0
  zones infra-communales (polygones) : 35
  départements avec zone infra-communale : 34
  départements avec une commune « partie » sans fichier infra-communal : ['001', '003', '025', '038', '042', '064', '068', '073', '074']
  communes « partie » sans zone infra-communale (contour entier pris en repli) : 143

## Source B — distances (contours propres du Cerema : communes 2019 « totalité » + zones infra-communales ; repli : contour entier des communes « partie » sans zone infra-communale)

Zone : contours propres du Cerema ; 1136106 points de bord (un tous les 100 m au plus, bords intérieurs retirés)
Communes 2025 classées : 5514 (dont en partie : 182) ; mairies dans la zone sans commune classée (H81) : 0

Villes du risque (distance de la mairie au bord de la zone, km non arrondis ; affiché ; point le plus proche dans) :
  Chamonix-Mont-Blanc (74056) : 0.00 km → affiché Commune de montagne ; classée
  Grenoble (38185) : 0.65 km → affiché 1 km ; zone la plus proche : La Tronche (38516)
  Annecy (74010) : 0.00 km → affiché Commune de montagne ; classée en partie
  Pau (64445) : 12.74 km → affiché 13 km ; zone la plus proche : Rébénacq (64463)
  Clermont-Ferrand (63113) : 2.47 km → affiché 2 km ; zone la plus proche : Durtol (63141)
  Lyon (69123) : 13.70 km → affiché 14 km ; zone la plus proche : zone infra-communale du 069, dans Pollionnay (69154)
  Limoges (87085) : 22.88 km → affiché 23 km ; zone la plus proche : Saint-Léger-la-Montagne (87159)
  Toulouse (31555) : 47.16 km → affiché 47 km ; zone la plus proche : zone infra-communale du 011, dans Vaudreuille (31569)
  Bordeaux (33063) : 172.79 km → affiché 173 km ; zone la plus proche : zone infra-communale du 019, dans Turenne (19273)

Villes de plus de 50 000 habitants classées (ou H81) :
  Saint-Étienne (42218, 173 136 hab.) — en partie
  Annecy (74010, 132 117 hab.) — en partie

Répartition par choix (distance affichée) :
  0 (commune de montagne) : 5514 (cumul 5514)
  1 à 10 km : 3454 (cumul 8968)
  11 à 30 km : 3640 (cumul 12608)
  31 à 50 km : 2118 (cumul 14726)
  51 à 100 km : 3574 (cumul 18300)
  au-delà de 100 km : 16446 (cumul 34746)

10 premières à « 10 km », prix de départ 1 200 € pour 52 m² (8945 communes passent) :
  1. Allarmont (88005, 88) — 214 hab. — score 86 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  2. Celles-sur-Plaine (88082, 88) — 737 hab. — score 86 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  3. La Petite-Raon (88346, 88) — 734 hab. — score 86 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  4. Luvigny (88277, 88) — 123 hab. — score 86 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  5. Moussey (88317, 88) — 548 hab. — score 86 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  6. Raon-sur-Plaine (88373, 88) — 135 hab. — score 86 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  7. Vexaincourt (88503, 88) — 146 hab. — score 86 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  8. Celoux (15032, 15) — 59 hab. — score 86 — loyer 327 € — montagne Commune de montagne (exact 0.00 km)
  9. Champagnac-le-Vieux (43052, 43) — 191 hab. — score 86 — loyer 327 € — montagne Commune de montagne (exact 0.00 km)
  10. Chaniat (43055, 43) — 164 hab. — score 86 — loyer 327 € — montagne Commune de montagne (exact 0.00 km)

10 premières à « 10 km », prix sur Sans limite (8968 communes passent) :
  1. Allarmont (88005, 88) — 214 hab. — score 100 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  2. Celles-sur-Plaine (88082, 88) — 737 hab. — score 100 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  3. La Petite-Raon (88346, 88) — 734 hab. — score 100 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  4. Luvigny (88277, 88) — 123 hab. — score 100 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  5. Moussey (88317, 88) — 548 hab. — score 100 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  6. Raon-sur-Plaine (88373, 88) — 135 hab. — score 100 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  7. Vexaincourt (88503, 88) — 146 hab. — score 100 — loyer 326 € — montagne Commune de montagne (exact 0.00 km)
  8. Celoux (15032, 15) — 59 hab. — score 100 — loyer 327 € — montagne Commune de montagne (exact 0.00 km)
  9. Champagnac-le-Vieux (43052, 43) — 191 hab. — score 100 — loyer 327 € — montagne Commune de montagne (exact 0.00 km)
  10. Chaniat (43055, 43) — 164 hab. — score 100 — loyer 327 € — montagne Commune de montagne (exact 0.00 km)

Variante B2 — Cerema, union des contours 2025 des communes classées (« partie » comptée entière) :
  Chamonix-Mont-Blanc : 0.00 km
  Grenoble : 0.68 km
  Annecy : 0.00 km
  Pau : 12.76 km
  Clermont-Ferrand : 2.47 km
  Lyon : 10.63 km
  Limoges : 22.85 km
  Toulouse : 47.16 km
  Bordeaux : 172.77 km
  mairies dans la zone sans commune classée (H81) avec B2 : 0

## Écarts entre les deux sources (communes classées)

  classées par les deux : 5507 ; par A seulement : 379 ; par B seulement : 7
  A seulement, les 10 plus peuplées :
    Cluses (74081, 74, 17 795 hab.) — massif ANCT : Alpes — distance par l'autre source : 0.7 km
    Firminy (42095, 42, 17 060 hab.) — massif ANCT : Massif Central — distance par l'autre source : 1.9 km
    Rumilly (74225, 74, 16 442 hab.) — massif ANCT : Alpes — distance par l'autre source : 1.2 km
    Saint-Just-Saint-Rambert (42279, 42, 15 764 hab.) — massif ANCT : Massif Central — distance par l'autre source : 1.9 km
    Le Chambon-Feugerolles (42044, 42, 12 314 hab.) — massif ANCT : Massif Central — distance par l'autre source : 2.6 km
    Onet-le-Château (12176, 12, 12 080 hab.) — massif ANCT : Massif Central — distance par l'autre source : 1.1 km
    Villefranche-de-Rouergue (12300, 12, 11 271 hab.) — massif ANCT : Massif Central — distance par l'autre source : 3.6 km
    Limoux (11206, 11, 10 532 hab.) — massif ANCT : Pyrénées — distance par l'autre source : 5.9 km
    Roche-la-Molière (42189, 42, 9 843 hab.) — massif ANCT : Massif Central — distance par l'autre source : 0.9 km
    Poisy (74213, 74, 9 291 hab.) — massif ANCT : Alpes — distance par l'autre source : 1.6 km
    par massif ANCT : {'Massif Central': 190, 'Pyrénées': 64, 'Alpes': 95, 'Vosges': 22, 'Alpes (partiellement)': 2, 'Jura': 3, 'Corse': 2, 'Vosges (partiellement)': 1}
    par département : {'74': 57, '42': 52, '12': 48, '64': 31, '58': 24, '38': 23, '71': 20, '31': 16, '11': 15, '46': 13, '23': 12, '73': 9, '68': 8, '88': 8, '63': 7, '21': 4, '54': 4, '43': 4, '26': 4, '70': 3, '03': 3, '04': 3, '65': 2, '82': 2, '01': 2, '2B': 2, '87': 1, '84': 1, '39': 1}
  B seulement, les 10 plus peuplées :
    Vindry-sur-Turdine (69157, 69, 5 305 hab.) — massif ANCT : Massif Central (partiellement) — distance par l'autre source : 0.5 km
    Savigny (69175, 69, 1 995 hab.) — massif ANCT : Massif Central — distance par l'autre source : 1.7 km
    Saint-Romain-de-Popey (69234, 69, 1 725 hab.) — massif ANCT : Massif Central — distance par l'autre source : 1.0 km
    Provenchères-et-Colroy (88361, 88, 1 283 hab.) — massif ANCT : Vosges — distance par l'autre source : 1.1 km
    Arboys en Bugey (01015, 01, 710 hab.) — massif ANCT : Jura — distance par l'autre source : 1.0 km
    Saint-Martin-de-Vaulserre (38420, 38, 246 hab.) — massif ANCT : Alpes — distance par l'autre source : 1.1 km
    Saint-Martin-de-Lansuscle (48171, 48, 191 hab.) — massif ANCT : Massif Central — distance par l'autre source : 1.2 km
    par massif ANCT : {'Massif Central (partiellement)': 1, 'Massif Central': 3, 'Alpes': 1, 'Vosges': 1, 'Jura': 1}
    par département : {'69': 3, '38': 1, '48': 1, '88': 1, '01': 1}
  communes dont la distance affichée diffère : 16491 ; de plus de 10 km : 9121
  plus grands écarts (hors communes classées par une seule source) :
    Vergigny (89439, 89, 1 486 hab.) : A 66.3 km (Marigny-l'Église (58157)), B 191.6 km (zinf-071)
    Venizy (89436, 89, 824 hab.) : A 73.3 km (Marigny-l'Église (58157)), B 198.5 km (zinf-071)
    Saint-Florentin (89345, 89, 4 164 hab.) : A 69.5 km (Marigny-l'Église (58157)), B 194.7 km (zinf-071)
    Nitry (89277, 89, 372 hab.) : A 31.4 km (Marigny-l'Église (58157)), B 156.5 km (zinf-071)
    Fontenay-près-Chablis (89175, 89, 134 hab.) : A 51.5 km (Marigny-l'Église (58157)), B 176.7 km (zinf-071)
    Yrouerre (89486, 89, 144 hab.) : A 44.4 km (Marigny-l'Église (58157)), B 168.6 km (zinf-071)
    Voutenay-sur-Cure (89485, 89, 212 hab.) : A 22.0 km (Marigny-l'Église (58157)), B 146.5 km (Châtenay (71116))
    Villy (89477, 89, 97 hab.) : A 54.6 km (Marigny-l'Église (58157)), B 179.8 km (zinf-071)

## Grille communale de densité Insee 2025 (D10, H72)

  en-tête : A=Grille de densité 2025
  en-tête : A=France – Niveau de densité des communes
  en-tête : A=Mise en ligne le 21/07/2025       Géographie au 01/01/2025
  en-tête : A=
Code 
Commune
 | B=Libellé des communes
 | C=Degré de densité
(3 postes) | D=Libellé degré de densité
(3 postes) | E=Population 
municipale 
2022 | F=Part population dans niveau 1 | G=Part population dans niveau 2 | H=Part population dans niveau 3 | I=Degré de densité
(croisée AAV) | J=Libellé degré de densité
(croisée AAV) | K=Degré de densité
(7 postes) | L=Libellé degré de densité
(7 postes)
  en-tête : A=CODGEO | B=LIBGEO | C=DENS | D=LIBDENS | E=PMUN22 | F=P1 | G=P2 | H=P3 | I=DENS_AAV | J=LIBDENS_AAV | K=DENS7 | L=LIBDENS7
  colonnes : CODGEO, LIBGEO, DENS, LIBDENS, PMUN22, P1, P2, P3, DENS_AAV, LIBDENS_AAV, DENS7, LIBDENS7
  DENS7 et libellés (toutes communes du fichier) : [(('1', 'Grands centres urbains'), 699), (('2', 'Centres urbains intermédiaires'), 637), (('3', 'Petites villes'), 947), (('4', 'Ceintures urbaines'), 1996), (('5', 'Bourgs ruraux'), 5072), (('6', 'Rural à habitat dispersé'), 18288), (('7', 'Rural à habitat très dispersé'), 7236)]
  DENS et libellés : [(('1', 'Urbain dense'), 699), (('2', 'Urbain intermédiaire'), 3580), (('3', 'Rural'), 30596)]
  lignes du fichier : 34875 ; communes du site sans type : 0 []
  niveaux de D10 sur les communes du site : {'bourg-et-village': 23305, 'ville-et-peripherie': 3514, 'campagne-isolee': 7235, 'ville-dense': 692}
  DENS7 sur les communes du site : {'1': 692, '2': 617, '3': 932, '4': 1965, '5': 5038, '6': 18267, '7': 7235}
  Bordeaux (33063) : DENS7 1 → ville-dense ; libellé Bordeaux
  Lacanau (33214) : DENS7 5 → bourg-et-village ; libellé Lacanau
  Chamonix-Mont-Blanc (74056) : DENS7 3 → ville-et-peripherie ; libellé Chamonix-Mont-Blanc
  Paris (75056) : DENS7 1 → ville-dense ; libellé Paris
  Lyon (69123) : DENS7 1 → ville-dense ; libellé Lyon
  Marseille (13055) : DENS7 1 → ville-dense ; libellé Marseille
  arrondissements de Paris, Lyon, Marseille dans le fichier : 0
  feuille Documentation :
    Grille de densité 2025
    France – Niveau de densité des communes, des EPCI, des Bassins de Vie et des départements
    Définitions
    Les définitions des notions utilisées dans ce fichier sont accessibles dans la rubrique "Définitions, méthodes et qualité"
    Pour en savoir plus sur la géographie

## D12 d'immobilier : prix tous biens (fichiers DVF retenus)

DVF : stats_whole_period.csv, Last-Modified Fri, 17 Jul 2026 15:22:41 GMT, téléchargé le 2026-10-14T16:11:03+02:00, 30738960 octets, sha256 c691b87045b9bafc30f242e474f919c65ae1180ab6843b8a9feb7161a3abbe68
  ok   DVF : stats_whole_period.csv est bien celui téléchargé (empreinte identique)
DVF : stats_dvf.csv, Last-Modified Fri, 17 Jul 2026 15:22:40 GMT, téléchargé le 2026-10-14T16:48:13+02:00, 276619703 octets, sha256 09316f4ce13d694a43fc86c704120d0aadc9ba739a02b365ccd116d5320b9468
  ok   DVF : stats_dvf.csv est bien celui téléchargé (empreinte identique)
  info fichier mensuel : 3455 lignes en double ignorées (intercommunalités sur plusieurs départements)
  ok   fichier mensuel : 36 mois dans la fenêtre 2023-01 à 2025-12 (attendu 36)
appartement : commune 6268 ; secteur 24678 ; tous-biens 1983 ; tous-biens-secteur 211 ; inconnu-secteur 1 ; inconnu-alsace-moselle 1605 (total 34746)
  achat.json d'aujourd'hui (appartement) : {'secteur': 24678, 'commune': 6268, 'inconnu-secteur': 2195, 'inconnu-alsace-moselle': 1605}
  communes qui changent par rapport à achat.json : 2194 (dont hors tous-biens : 0 [])
  tous biens, par règle (tb-1 récent, tb-2 2021-2025, tb-3-x intercommunalité) : {'tb-2': 1682, 'tb-3-1': 211, 'tb-1': 301}
  reste sans prix : Île-de-Sein (29083, 29, 263 hab.)
  prix tous biens retenus : 2194 ; min 323 €/m², 1er centile 428 €/m², médiane 1 119 €/m², max 6 667 €/m²
  les 1 % les plus bas (22 communes) :
    323 €/m² — Outremécourt (52372, 52, 75 hab.) — tous-biens
    331 €/m² — Thol-lès-Millières (52489, 52, 28 hab.) — tous-biens
    333 €/m² — Semilly (52468, 52, 94 hab.) — tous-biens
    336 €/m² — Chaumont-la-Ville (52122, 52, 109 hab.) — tous-biens
    339 €/m² — Rimaucourt (52423, 52, 609 hab.) — tous-biens
    344 €/m² — Bassoncourt (52038, 52, 62 hab.) — tous-biens
    353 €/m² — Leurville (52286, 52, 81 hab.) — tous-biens
    354 €/m² — Rupt-devant-Saint-Mihiel (55448, 55, 39 hab.) — tous-biens
    356 €/m² — Soulaucourt-sur-Mouzon (52482, 52, 100 hab.) — tous-biens
    369 €/m² — Bouquemont (55064, 55, 119 hab.) — tous-biens
    376 €/m² — Breuvannes-en-Bassigny (52074, 52, 632 hab.) — tous-biens
    384 €/m² — Consigny (52142, 52, 79 hab.) — tous-biens
    385 €/m² — Reynel (52420, 52, 129 hab.) — tous-biens
    387 €/m² — Ozières (52373, 52, 34 hab.) — tous-biens
    407 €/m² — Percey-le-Grand (70406, 70, 84 hab.) — tous-biens
    410 €/m² — Huilliécourt (52243, 52, 107 hab.) — tous-biens
    411 €/m² — Villars-Santenoge (52526, 52, 82 hab.) — tous-biens
    417 €/m² — Domremy-Landéville (52173, 52, 75 hab.) — tous-biens
    417 €/m² — Merrey (52320, 52, 93 hab.) — tous-biens
    425 €/m² — Millières (52325, 52, 115 hab.) — tous-biens
    427 €/m² — Chaumont-sur-Aire (55108, 55, 119 hab.) — tous-biens
    428 €/m² — Bernon (10040, 10, 160 hab.) — tous-biens
maison : commune 30878 ; secteur 2262 ; tous-biens 0 ; tous-biens-secteur 0 ; inconnu-secteur 1 ; inconnu-alsace-moselle 1605 (total 34746)
  achat.json d'aujourd'hui (maison) : {'commune': 30878, 'secteur': 2262, 'inconnu-secteur': 1, 'inconnu-alsace-moselle': 1605}
  communes qui changent par rapport à achat.json : 0 (dont hors tous-biens : 0 [])
  tous biens, par règle (tb-1 récent, tb-2 2021-2025, tb-3-x intercommunalité) : {}
  reste sans prix : Île-de-Sein (29083, 29, 263 hab.)

Paris, Lyon, Marseille : arrondissements qui tomberaient en tous biens
  appartement, Paris : 0 arrondissement(s) sur 20 ; prix de la ville 10640.35 (commune)
  appartement, Lyon : 0 arrondissement(s) sur 9 ; prix de la ville 4652.22 (commune)
  appartement, Marseille : 0 arrondissement(s) sur 16 ; prix de la ville 2945.12 (commune)
  maison, Paris : 0 arrondissement(s) sur 20 ; prix de la ville 12403.7 (secteur)
  maison, Lyon : 0 arrondissement(s) sur 9 ; prix de la ville 6101.0 (secteur)
  maison, Marseille : 0 arrondissement(s) sur 16 ; prix de la ville 4853.38 (secteur)

Communes nommées par le plan :
  Agnicourt-et-Séchelles (02004), appartement : 733 €/m², source tous-biens, règle tb-2 (achat.json aujourd'hui : [None, 'inconnu-secteur', 733, 'commune'])
  Île-de-Sein (29083), maison : None €/m², source inconnu-secteur, règle inconnu (achat.json aujourd'hui : [None, 'inconnu-secteur', None, 'inconnu-secteur'])
  Île-de-Sein (29083), appartement : None €/m², source inconnu-secteur, règle inconnu (achat.json aujourd'hui : [None, 'inconnu-secteur', None, 'inconnu-secteur'])
  exemple appartement tous-biens : Desvres (62268, 4 829 hab.) : 1493 €/m², règle tb-1
  exemple appartement tous-biens : Samer (62773, 4 704 hab.) : 1968 €/m², règle tb-1
  exemple appartement tous-biens : Lamotte-Beuvron (41106, 4 504 hab.) : 1703 €/m², règle tb-1
  exemple appartement tous-biens-secteur : Tingry (62821, 291 hab.) : 1714 €/m², règle tb-3-1
  exemple appartement tous-biens-secteur : Bailleul-Neuville (76052, 220 hab.) : 1572 €/m², règle tb-3-1
  exemple appartement tous-biens-secteur : Oléac-Debat (65332, 189 hab.) : 1639 €/m², règle tb-3-1

10 premières en Appartement · Acheter à 5 000 €/m², tout le reste sur Peu importe :
  (32833 communes passent avec une note)
  1. Montdardier (30176, 30, 209 hab.) — 300 €/m² — score 94 — source commune (règle 2)
  2. Achères (18001, 18, 326 hab.) — 312 €/m² — score 94 — source secteur (règle 3-2)
  3. Allogny (18004, 18, 1 142 hab.) — 312 €/m² — score 94 — source secteur (règle 3-2)
  4. Allouis (18005, 18, 1 036 hab.) — 312 €/m² — score 94 — source secteur (règle 3-2)
  5. Aubinges (18016, 18, 401 hab.) — 312 €/m² — score 94 — source secteur (règle 3-2)
  6. Azy (18019, 18, 450 hab.) — 312 €/m² — score 94 — source secteur (règle 3-2)
  7. Brécy (18035, 18, 927 hab.) — 312 €/m² — score 94 — source secteur (règle 3-2)
  8. Fussy (18097, 18, 1 891 hab.) — 312 €/m² — score 94 — source secteur (règle 3-2)
  9. Henrichemont (18109, 18, 1 721 hab.) — 312 €/m² — score 94 — source secteur (règle 3-2)
  10. Humbligny (18111, 18, 175 hab.) — 312 €/m² — score 94 — source secteur (règle 3-2)
  première commune au prix tous biens : rang 33, Outremécourt (52372, 52, 75 hab.) — 323 €/m² — tous-biens
  parmi les 100 premières : 14 au prix tous biens
```

## Tâche 1 — les données du site (2026-10-15, 15:00 → 15:30)
Scripts de production : `python3 scripts/data/sources.py` (télécharge en plus le fichier des mouvements du COG 2025, la grille Insee, la couche des communes du Cerema et ses 34 archives infra-communales, puis les ouvre avec `bsdtar` ; adresses identiques à celles de la tâche 0, empreinte SHA-1 de la couche des communes identique à celle de data.gouv.fr, `4478ee77…f45`), puis `python3 scripts/data/mer.py`, `python3 scripts/data/montagne.py` (≈ 1 min 10) et `python3 scripts/data/communes.py` (≈ 10 s).

**Résultat** : tous les comptes de la tâche 0 sont retrouvés ; aucun ne s'écarte de plus de 5 %.
- Types : 692 / 3 514 / 23 305 / 7 235, 0 commune sans type (identiques).
- Montagne : 5 514 communes classées (182 en partie), H81 : 0 (identiques). Distances non arrondies identiques à la tâche 0 : Bordeaux 172,787 → `montagne_km` 172.8 ; Grenoble 0,651 → 0.7 (même valeur qu'en tâche 0, 0,65) ; Lyon 13,699 → 13.7 ; Marseille 53.8 ; Paris 291.4.
- Répartition par choix, sur la valeur servie (0,1 km puis arrondi au km) : 5 514 / 3 445 / 3 646 / 2 113 / 3 580 / 16 448 au lieu de 5 514 / 3 454 / 3 640 / 2 118 / 3 574 / 16 446. Écart de 2 à 9 communes par tranche : double arrondi (10,46 km → 10,5 → affiché 11 au lieu de 10), au plus 0,05 km, moins que l'erreur de la méthode (< 50 m).
- Une commune hors zone tombait à 0 après l'arrondi à 0,1 km : **Raon-lès-Leau (54443)**, mairie à 24 m de la zone, non classée par le Cerema. Elle garde 0.1 km (« moins d'1 km de la montagne », comparée comme 1 km), pas « Commune de montagne ». Le contrôle « 0 commune hors zone à 0 km » le vérifie.
- Prix d'achat : appartement 6 268 commune, 24 678 secteur, **1 983 tous-biens, 211 tous-biens-secteur**, 1 inconnu-secteur (Île-de-Sein), 1 605 Alsace-Moselle ; maison 30 878 / 2 262 / 0 / 0 / 1 / 1 605 (identiques). 2 194 lignes d'`achat.json` changent, toutes d'`inconnu-secteur` à `tous-biens` ou `tous-biens-secteur` en appartement ; rien d'autre ne bouge. 0 arrondissement de Paris, Lyon, Marseille au prix tous biens. Agnicourt-et-Séchelles (02004) 733 €/m² `tous-biens`, Desvres (62268) 1 493 `tous-biens`, Tingry (62821) 1 714 `tous-biens-secteur`. Aucun prix sous 300 €/m².
- `communes.json` : les 9 premières colonnes des 34 746 lignes sont identiques à avant ; `type_env` et `montagne_km` ajoutées à la fin.

**Poids** (octets ; gzip -9 ; brotli -q 11, la compression de Cloudflare)

| Fichier | Brut avant → après | gzip avant → après | brotli avant → après |
|---|---|---|---|
| `communes.json` | 2 328 662 → 3 159 045 (+830 383) | 677 631 → 786 777 (**+109 146**) | 537 896 → 618 685 (+80 789) |
| `achat.json` | 1 445 335 → 1 435 241 (−10 094) | 228 213 → 232 395 (+4 182) | 165 938 → 169 379 (+3 441) |

`communes.json` grossit de 109 Ko compressé en gzip (plus que les 100 Ko du plan, à dire à Vincent, pas d'arrêt) ; 81 Ko avec brotli.

**Mentions fixées pour `Mentions.tsx`** (tâches 3 et 4) et reprises dans `CLAUDE.md` « Données » :
- « Type d'environnement : Insee, grille communale de densité 2025 (mise en ligne le 21/07/2025) » — Licence Ouverte 2.0.
- « Zone de montagne : Cerema, communes soumises à la loi Montagne (2019) » — Licence Ouverte 2.0.

### Sortie de `montagne.py` (2026-10-15, 15:11)
```
Zone de montagne : Cerema, communes soumises à la loi Montagne (2019)
  rétablie après la source : Celles (15031) hérite de 15141
  rétablie après la source : Chalinargues (15035) hérite de 15141
  rétablie après la source : Chavagnac (15047) hérite de 15141
  rétablie après la source : Sainte-Anastasie (15171) hérite de 15141
  communes 2019 listées : 5525 (totalité 5343, partie 182) ; sans correspondance en 2025 : []
  zones infra-communales : 35 polygones, 34 départements ; communes « partie » sans zone infra-communale (contour entier en repli) : 143
  bord de la zone : 1136106 points (un tous les 100 m au plus, bords intérieurs retirés)
montagne-km.csv : 34746 communes ; classées 5514 (dont en partie 182) ; mairie dans la zone sans commune classée (H81) : 0
```

### Sortie de `communes.py` (2026-10-15, 15:14)
```
COG 2025, métropole et Corse : 34746 communes (COM, dont Paris, Lyon et Marseille d'un seul tenant) ; exclus : 45 arrondissements (ARM), 2152 communes déléguées, 476 communes associées
DVF : stats_whole_period.csv, Last-Modified Fri, 17 Jul 2026 15:22:41 GMT, téléchargé le 2026-10-14T16:11:03+02:00, 30738960 octets, sha256 c691b87045b9bafc30f242e474f919c65ae1180ab6843b8a9feb7161a3abbe68
  ok   DVF : stats_whole_period.csv est bien celui téléchargé (empreinte identique)
DVF : stats_dvf.csv, Last-Modified Fri, 17 Jul 2026 15:22:40 GMT, téléchargé le 2026-10-14T16:48:13+02:00, 276619703 octets, sha256 09316f4ce13d694a43fc86c704120d0aadc9ba739a02b365ccd116d5320b9468
  ok   DVF : stats_dvf.csv est bien celui téléchargé (empreinte identique)
  info fichier mensuel : 3455 lignes en double ignorées (intercommunalités sur plusieurs départements)
  ok   fichier mensuel : 36 mois dans la fenêtre 2023-01 à 2025-12 (attendu 36)
  ok   grille de densité : « Mise en ligne le 21/07/2025 » dans l'en-tête (millésime 2025, géographie au 01/01/2025)
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
Contrôles du cadre de vie (type d'environnement, distance à la montagne)
  ok   0 commune sans type d'environnement (manquent : 0 [])
  ok   0 commune sans distance à la montagne (manquent : 0 [])
  ok   ville-dense : 692 communes (tâche 0 : 692, écart permis 5 %)
  ok   ville-et-peripherie : 3514 communes (tâche 0 : 3514, écart permis 5 %)
  ok   bourg-et-village : 23305 communes (tâche 0 : 23305, écart permis 5 %)
  ok   campagne-isolee : 7235 communes (tâche 0 : 7235, écart permis 5 %)
  info DENS7 sur les communes du site : {'1': 692, '2': 617, '3': 932, '4': 1965, '5': 5038, '6': 18267, '7': 7235}
  ok   montagne, communes classées : 5514 (tâche 0 : 5514, écart permis 5 %)
  ok   montagne, communes en partie : 182 (tâche 0 : 182, écart permis 5 %)
  info mairies dans la zone sans commune classée (H81, comptées à 0) : 0 []
  ok   0 commune hors zone à 0 km après arrondi (0 = commune de montagne) : []
  ok   montagne, 0 : 5514 communes (tâche 0 : 5514, écart permis 5 %)
  ok   montagne, 1 à 10 km : 3445 communes (tâche 0 : 3454, écart permis 5 %)
  ok   montagne, 11 à 30 km : 3646 communes (tâche 0 : 3640, écart permis 5 %)
  ok   montagne, 31 à 50 km : 2113 communes (tâche 0 : 2118, écart permis 5 %)
  ok   montagne, 51 à 100 km : 3580 communes (tâche 0 : 3574, écart permis 5 %)
  ok   montagne, au-delà de 100 km : 16448 communes (tâche 0 : 16446, écart permis 5 %)
  ok   Bordeaux (33063) : 172.8 km de la montagne (tâche 0 : 172.8)
  ok   Grenoble (38185) : 0.7 km de la montagne (tâche 0 : 0.7)
  ok   Lyon (69123) : 13.7 km de la montagne (tâche 0 : 13.7)
  ok   Chamonix-Mont-Blanc (74056) : 0 km de la montagne (tâche 0 : 0)
  ok   Annecy (74010) : 0 km de la montagne (tâche 0 : 0)
  ok   Bordeaux (33063) : ville-dense (attendu ville-dense)
  ok   Lacanau (33214) : bourg-et-village (attendu bourg-et-village)
  ok   Chamonix-Mont-Blanc (74056) : ville-et-peripherie (attendu ville-et-peripherie)
  info Paris (75056) : ville-dense, 291.4 km de la montagne
  info Lyon (69123) : ville-dense, 13.7 km de la montagne
  info Marseille (13055) : ville-dense, 53.8 km de la montagne
Contrôles des prix d'achat
  ok   34746 lignes, dans l'ordre des codes de communes.json
  ok   aucun prix d'achat retenu sous 300 €/m² (trouvés : 0 [])
  ok   arrondissements dans le fichier DVF : {'75056': 20, '69123': 9, '13055': 16} (45, H67)
  ok   appartement : chaque commune a une source (33138 hors Alsace-Moselle et Paris, Lyon, Marseille)
  ok   appartement, commune : 6265 communes (mesuré : 6265, écart permis 5 %)
  ok   appartement, secteur : 24678 communes (mesuré : 24678, écart permis 5 %)
  ok   appartement, tous-biens : 1983 communes (mesuré : 1983, écart permis 5 %)
  ok   appartement, tous-biens-secteur : 211 communes (mesuré : 211, écart permis 5 %)
  ok   appartement, inconnu-secteur : 1 communes (mesuré : 1, écart permis 5 %)
  ok   maison : chaque commune a une source (33138 hors Alsace-Moselle et Paris, Lyon, Marseille)
  ok   maison, commune : 30878 communes (mesuré : 30878, écart permis 5 %)
  ok   maison, secteur : 2259 communes (mesuré : 2259, écart permis 5 %)
  ok   maison, tous-biens : 0 communes (mesuré : 0, écart permis 5 %)
  ok   maison, tous-biens-secteur : 0 communes (mesuré : 0, écart permis 5 %)
  ok   maison, inconnu-secteur : 1 communes (mesuré : 1, écart permis 5 %)
  ok   Alsace-Moselle : 1605 communes inconnu-alsace-moselle pour les deux biens (attendu 1 605)
  info appartement, par règle (1 récent, 2 toute la période, 3 intercommunalité, tb tous biens) : {'1': 2429, '2': 3836, '3-1': 15733, '3-2': 8945, 'tb-1': 301, 'tb-2': 1682, 'tb-3-1': 211, 'tb-3-2': 0, 'inconnu': 1}
  info appartement, par source (toutes les communes) : {'secteur': 24678, 'commune': 6268, 'tous-biens': 1983, 'tous-biens-secteur': 211, 'inconnu-secteur': 1, 'inconnu-alsace-moselle': 1605}
  info maison, par règle (1 récent, 2 toute la période, 3 intercommunalité, tb tous biens) : {'1': 9925, '2': 20953, '3-1': 2259, '3-2': 0, 'tb-1': 0, 'tb-2': 0, 'tb-3-1': 0, 'tb-3-2': 0, 'inconnu': 1}
  info maison, par source (toutes les communes) : {'commune': 30878, 'secteur': 2262, 'inconnu-secteur': 1, 'inconnu-alsace-moselle': 1605}
  ok   Bordeaux (33063) : [4233, 'commune', 5067, 'commune'], règle 1 (attendu 4 233 et 5 067 €/m², prix récent 2023-2025)
  ok   Saint-Vincent-de-Paul (33487) : [3700, 'secteur', 2487, 'commune'] (attendu appartement 3 700 €/m², Bordeaux Métropole récent ; maison 2 487 €/m², 24 ventes récentes : règle 2)
  ok   Paris (75056) : [10640.35, 'commune', 12403.7, 'secteur']
  info Paris, appartement : 0 arrondissement(s) sur 20 au prix tous biens
  info Paris, maison : 0 arrondissement(s) sur 20 au prix tous biens
  ok   Lyon (69123) : [4652.22, 'commune', 6101.0, 'secteur']
  info Lyon, appartement : 0 arrondissement(s) sur 9 au prix tous biens
  info Lyon, maison : 0 arrondissement(s) sur 9 au prix tous biens
  ok   Marseille (13055) : [2945.12, 'commune', 4853.38, 'secteur']
  info Marseille, appartement : 0 arrondissement(s) sur 16 au prix tous biens
  info Marseille, maison : 0 arrondissement(s) sur 16 au prix tous biens
  ok   D12 Agnicourt-et-Séchelles (02004), appartement : [733, 'tous-biens'] (tâche 0 : [733, 'tous-biens'])
  ok   D12 Desvres (62268), appartement : [1493, 'tous-biens'] (tâche 0 : [1493, 'tous-biens'])
  ok   D12 Tingry (62821), appartement : [1714, 'tous-biens-secteur'] (tâche 0 : [1714, 'tous-biens-secteur'])
  ok   D12 : sans prix hors Alsace-Moselle : ['29083'] (tâche 0 : Île-de-Sein, 29083, seule)
  ok   formes 100m : 0 code orphelin (en trop : 0, sans forme : 0)
Fichiers
  achat.json : 1.44 Mo brut, 0.23 Mo compressé (gzip)
  communes.json : 3.16 Mo brut, 0.79 Mo compressé (gzip)
  reperes.json : 1.63 Mo brut, 0.59 Mo compressé (gzip)
  voisins.json : 0.26 Mo brut, 0.08 Mo compressé (gzip)
```
