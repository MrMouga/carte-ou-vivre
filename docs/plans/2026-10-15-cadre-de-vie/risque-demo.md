# Le risque de la montagne — liste pour la démo
2026-10-15, 20:55 · tâche 5 · Version construite `9f5f0c3` (`dist/version.txt`), vraies données, source retenue en tâche 0 : **Cerema, zonage loi Montagne (communes 2019)**.
Chiffres lus dans la fiche de chaque commune sur la version construite (Chromium, 1 440 × 900), sauf mention. Sorties : [captures/T5-preuve-risque.txt](captures/T5-preuve-risque.txt), [captures/T5-preuve-risque-grenoble.txt](captures/T5-preuve-risque-grenoble.txt).
Le jugement de Vincent vient de [mesure-tache-0.md](mesure-tache-0.md#choix-et-jugement-de-vincent) (2026-10-15, 14:50). À la démo, il rejuge cette liste (le plan : « en tâche 0 puis à la démo »).

## Les villes du risque
| Ville | Affiché sur le site (fiche) | Montré en tâche 0 | Jugement de la tâche 0 |
|---|---|---|---|
| Chamonix-Mont-Blanc (74) | Commune de montagne | Commune de montagne | pas jugée fausse |
| Grenoble (38) | moins d'1 km de la montagne | 1 km (0,65 km) | pas jugée fausse |
| Annecy (74) | Commune de montagne (classée en partie) | Commune de montagne | « Oui, ça me va » |
| Pau (64) | 13 km | 13 km | pas jugée fausse |
| Clermont-Ferrand (63) | **3 km** | **2 km** (2,47 km) | pas jugée fausse |
| Lyon (69) | 14 km | 14 km | **jugée fausse** : « Pour Lyon t'as pas pris en compte le Mont d'Or ? » |
| Limoges (87) | 23 km | 23 km | pas jugée fausse |
| Toulouse (31) | 47 km | 47 km | pas jugée fausse |
| Bordeaux (33) | 173 km | 173 km | pas jugée fausse |

Deux écarts avec ce que Vincent a vu en tâche 0, sans changement de donnée :
- **Grenoble** : la tâche 0 arrondissait 0,65 km à « 1 km » ; la fiche dit « moins d'1 km de la montagne », comme le veut R30 (et la compare comme 1 km, R29).
- **Clermont-Ferrand** : 2,47 km est écrit 2,5 dans `communes.json` (au dixième), puis affiché 3 km. Même double arrondi que celui déjà noté en tâche 4 (8 936 communes à « 10 km » au lieu de 8 945). Effet : une commune entre 2,45 et 2,5 km est affichée et comparée 1 km plus loin.

**Lyon et le Mont d'Or** : les communes du Mont d'Or ne sont classées en montagne par aucune des deux sources mesurées en tâche 0. La zone est la zone légale (D5), pas le relief. À rejuger à la démo.

## Les villes de plus de 50 000 habitants classées
| Ville | Affiché | Jugement de la tâche 0 |
|---|---|---|
| Saint-Étienne (42), 173 000 hab. | Commune de montagne (classée en partie) | « Oui, ça me va » |
| Annecy (74), 132 000 hab. | Commune de montagne (classée en partie) | « Oui, ça me va » |

## Les 10 premières à « 10 km », au prix de départ (`/?loyer=1200&montagne=10`)
Sur le site : **8 936 communes passent tes critères**. Toutes sont des communes de montagne, avec le score 86.

| Rang | Commune | Loyer pour 52 m² | Comme en tâche 0 ? |
|---|---|---|---|
| 1 | Allarmont (88) | 326 € | oui |
| 2 | Celles-sur-Plaine (88) | 326 € | oui |
| 3 | La Petite-Raon (88) | 326 € | oui |
| 4 | Luvigny (88) | 326 € | oui |
| 5 | Moussey (88) | 326 € | oui |
| 6 | Raon-sur-Plaine (88) | 326 € | oui |
| 7 | Vexaincourt (88) | 326 € | oui |
| 8 | Celoux (15) | 327 € | oui |
| 9 | Champagnac-le-Vieux (43) | 327 € | oui |
| 10 | Chaniat (43) | 327 € | oui |

Jugement de la tâche 0 : « Oui, ça me va ». Mêmes communes, même ordre, même score et mêmes loyers que la tâche 0. Le compte diffère (8 936 contre 8 945) à cause du double arrondi ci-dessus.

## À demander à Vincent à la démo
1. Lyon à 14 km, sans le Mont d'Or : acceptable, ou faut-il une autre définition de la montagne (relief) ?
2. Clermont-Ferrand à 3 km au lieu de 2 : faut-il garder la distance au centième dans `communes.json` pour supprimer le double arrondi (coût : un fichier un peu plus lourd) ?
3. Coût connu du choix du Cerema : le Morvan n'est pas en montagne (l'Yonne est à 150-200 km de la montagne).
