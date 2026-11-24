# Décisions de design — services
2026-11-24 · Validé par Vincent (piste F)

## Pistes
| Piste | Idée | Verdict |
|---|---|---|
| A | Une ligne par service, libellé à gauche et temps à droite pour Médecin et Commerce alimentaire ; Scolarité et Gare sous un filet, avec leurs titres ; type de gare en Segmenté ; fiche en une colonne, temps alignés à droite | **Base retenue** : la plus compacte des pistes dépliées ; fiche la plus lisible |
| B | Réglages empilés comme la mer, intertitres « Santé et courses » et « Train » ; type de gare en Choix souligné ; fiche « Service : valeur » en ligne | Écartée, sauf le Choix souligné : intertitres absents de R51 ; « Train » à la place de « Gare » ; temps de la fiche non alignés (objectif 4) |
| C | Quatre tuiles qui résument chaque réglage ; toucher une tuile ouvre son réglage sous la grille | Écartée : un toucher de plus par réglage ; le réglage ouvert ne dit pas à quelle tuile il appartient ; « Toutes » rempli en noir au départ |
| **F** | **A, avec le type de gare en Choix souligné de B, sans les titres visibles « Niveaux de scolarité » et « Type de gare »** | **Retenue** |

Pari de Vincent : B ; relecteur à l'aveugle : A, avec le Choix souligné de B ([review-directions.md](review-directions.md)).

## F — ce qui est décidé
- **Type de gare en Choix souligné** (composant du système), et non en Segmenté : un seul type à la fois, à la différence des niveaux de scolarité, cumulables, en Cases séparées (*Vincent*). Corrige aussi le Majeur de la relecture : dans A et C, « Toutes » rempli en noir au départ laissait croire que la ligne filtrait, le noir voulant dire « coché » dans tout le panneau.
- **Pas de titre visible « Niveaux de scolarité » ni « Type de gare »** : les niveaux et le type de gare viennent juste sous « Scolarité » et « Gare » ; le titre « Temps de trajet maximal » reste au-dessus des temps (*essai de Vincent*, 2026-11-24 ; H169 révisée). Les groupes gardent leur nom pour les lecteurs d'écran (H153).
- Médecin et Commerce alimentaire : libellé à gauche, trois temps en Cases collées à droite, sur une seule ligne. Scolarité et Gare séparées par un filet `border`.
- Fiche : celle de A, une colonne, valeurs alignées à droite en chiffres tabulaires, filets entre les lignes ; le texte lu reste « <Service> : <valeur> ».
- Mesures à 390 px : catégorie 470 px avec son titre (509 avant le retrait des deux titres). À 390 × 844, la feuille ouverte en montre environ 380 : il faut faire défiler pour voir les temps de la gare (*accepté par Vincent* ; mettre « Temps de trajet maximal » à gauche de ses temps aurait gagné environ 40 px de plus). Curseur du prix visible à 375 × 548 (H48). Cibles de 44 px au moins.

## Crans
Inchangés (*Vincent*, 2026-11-24, après mesure) : « Supérieur » garde ceux de la scolarité (5, 10, 20 min : 2 %, 7 %, 27 % des communes) et « Grandes lignes » ceux de la gare (10, 20, 30 min : 3 %, 16 %, 36 %). Les premiers crans sont exigeants sans vider la carte (618 et 1 018 communes) ; écarté : gare à 20, 30, 45 min (« Toutes » à 45 min garde 97 %) et scolarité à 10, 20, 30 min (perd « École à 5 min ») ([mesures](../../specs/2026-11-23-services/mesures.md)).

## Non jugé
Place du bloc de la fiche sous « Tes proches » (le prototype n'a aucun proche) ; états de chargement et d'erreur (R57) ; session complète au clavier et au lecteur d'écran ; filtrage réel et adresse (le prototype ne les branche pas).
