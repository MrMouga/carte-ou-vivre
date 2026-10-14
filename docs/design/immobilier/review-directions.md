# Relecture à l'aveugle des directions — immobilier

2026-10-14 · Relecteur neuf, mode `directions` · Grille : [brief](brief.md) (objectifs 1 à 5) · Spec : R21–R26, H56, H65 · Contrat : [système](../system/README.md)

## Ce que j'ai regardé
- Les 18 captures de `directions/` (390 × 664, 375 × 548, 1 440 × 900, blocs Louer / Acheter / Acheter Total).
- Le prototype à 375 × 548 (`?variant=A|B|C`) : position et taille de chaque contrôle, groupes nommés, police des champs (mesures dans le DOM, `getBoundingClientRect`).

### Mesures à 375 × 548 (feuille ouverte : tête à 276 px, donc 272 px de feuille)

| | A | B | C |
|---|---|---|---|
| Bas du curseur du prix | 633 px | 673 px | 616 px |
| Dépassement sous l'écran | 85 px | 125 px | 68 px |
| Feuille nécessaire, à contenu égal | 357 px (65 %) | 397 px (72 %) | 340 px (62 %) |
| Louer / Acheter, haut | **34 px** | 44 px | 44 px |
| Appartement / Maison, haut | **34 px** | 62 px (tuiles) | 44 px |
| Total / Au m², haut | **34 px** | **34 px** | 44 px (sur la pastille du prix) |
| Champ surface, haut × large | **28 × 44 px** | **28 × 44 px** | 44 × 44 px |
| Groupes nommés H65 | les 3 | les 3 | **aucun** |
| Catégorie « Logement » repliable | oui | **non** (titre remplacé par les onglets) | oui |

Le titre « Où vivre en France » occupe environ 60 px entre les onglets (bas à 367 px) et la catégorie « Logement » (429 px) ; il est identique dans les trois directions.

## Constat d'ensemble
**Aucune direction ne tient l'objectif 1 avec la feuille actuelle.** Les trois cachent le curseur du prix à l'ouverture sur petit téléphone. Il faudra donc agrandir la feuille, comme Vincent l'accepte, ou retirer de la hauteur ailleurs ; la direction choisie ne change pas cette décision. Second point : la compacité de A et de B vient en partie de cibles trop petites (34 px et 28 px au lieu de 44 px). Une fois remises à 44 px, l'écart se creuse : A passe à environ 653 px (dépassement de 105 px), B à environ 683 px (135 px). C ne bouge pas (616 px).

## Par objectif

### 1. Place : curseur entier visible à 375 × 548
- **A** échoue de 85 px, puis d'environ 105 px une fois les cibles à 44 px. C'est le deuxième résultat, mais seulement grâce à des cibles hors contrat.
- **B** échoue de 125 px (environ 135 px avec Total / Au m² à 44 px). C'est le pire : les tuiles de 62 px et la ligne unité + surface placée au-dessus du curseur lui coûtent cher. Il gagne bien environ 57 px en supprimant l'en-tête « Logement », mais ça ne compense pas.
- **C** échoue de 68 px. C'est le meilleur, à cibles conformes. Mais il perdra de la hauteur s'il doit rendre visibles les choix cachés (voir 3 et 5).

### 2. Lisible d'un coup d'œil
- **C** est le plus lisible : « Louer un appartement de 52 m² pour 1 200 € max par mois » se lit d'une traite. Mais la phrase se casse mal. À 300 px en bureau, elle tient sur 3 lignes, et le champ « 52 » se retrouve en début de ligne, séparé de « de ». En Acheter · Au m² à 390 px, le mot « max » reste seul sur une ligne (`C-acheter-bloc.png`).
- **A** se lit bien : la valeur « 1 200 € » est en gras à droite du libellé, et « par mois pour [52] m² » forme une phrase sous le curseur.
- **B** se lit bien déplié. En revanche, il n'a plus de résumé replié : il n'y a plus de titre de catégorie, donc plus rien où l'écrire. L'état « catégorie repliée » du brief n'existe pas dans B.

### 3. Hiérarchie : Louer / Acheter d'abord, le bien ensuite, l'unité en détail
- **A** est le plus juste sur l'ordre. Le segmenté pleine largeur vient en tête, et l'unité est reléguée sur la ligne du sous-texte, sous le curseur. Point faible : Louer et Appartement ont exactement le même poids (34 px, fond `primary`). Seuls l'ordre et le rail du segmenté les distinguent.
- **B** inverse la hiérarchie. Les tuiles Appartement / Maison (62 px, pleines, avec icône) dominent, tandis que Louer / Acheter n'est qu'un texte souligné. Le bien se lit comme le choix principal, contre l'objectif 3.
- **C** met tous les choix au même poids (pastilles identiques), et seul l'ordre de la phrase fait la hiérarchie. Surtout, l'unité n'est plus un détail : elle se bascule en touchant le montant (« 1 200 €, passer au m² »). Le brief demandait de toucher « par mois » / « au m² ».

### 4. Toucher : cibles de 44 px, et le curseur ne bouge pas quand la surface apparaît ou disparaît
- **A** : le curseur reste à la même place entre Louer · Total et Acheter · Au m² (même y sur `A-louer-bloc` et `A-acheter-bloc`), parce que le champ surface vit sous le curseur. C'est la bonne idée de A. En revanche, ses **cibles sont hors contrat** : 34 px pour toutes les bascules et 28 px pour le champ surface, contre 44 px exigés au toucher.
- **B** : le curseur reste stable, car « prix au m² » remplace le champ sur la même ligne. Mais Total / Au m² (34 px) et le champ surface (28 px) sont trop petits.
- **C** : toutes les cibles font 44 px, mais **le curseur bouge**. Passer de Total à Au m², ou de Louer à Acheter (qui met Au m², D3), retire « de 52 m² » de la phrase et remonte le curseur d'environ 24 px (466 → 418 px sur les blocs à 2×). Le retour vers Total le redescend d'autant. De plus, la longueur de la phrase dépend des valeurs : avec « une maison » ou « 1 000 000 € », le nombre de lignes peut encore changer.

### 5. Cohérence avec le système
- **A** n'utilise que des composants existants : segmenté (comme la bascule mer), pastilles et curseur. Il garde les libellés H56 et les trois groupes nommés H65.
- **B** introduit des onglets soulignés qui n'existent pas dans le système, où les onglets de la feuille sont une pilule `primary`. À 390 px, ils se posent juste sous les onglets « Critères / Les 10 premières » et ressemblent à des onglets dans des onglets. Il introduit aussi des tuiles avec icône, un composant neuf. Enfin, « Logement » est la seule catégorie sans titre, alors que Mer, Taille de ville et Tes proches en ont un.
- **C** introduit un nouveau langage : des pastilles-phrases à icône « ⇆ » qui alternent entre deux valeurs. Il change les libellés (« un appartement » au lieu de « Appartement ») et n'expose aucun groupe nommé (mesuré : seul `titre-taille` existe).

Aucune direction ne met de couleur de donnée sur un réglage.

## Ce qui casse chaque direction

**A**
- [Majeur] Les bascules font 34 px de haut et le champ surface 28 px, à 375 px. Sur téléphone, le pouce rate « Au m² » ou le champ. Preuve : mesures DOM, contre la règle « 44 px au toucher » du contrat. Correction : 44 px de haut sous 1 024 px (`min-h-toucher`), ce qui coûte environ 20 px au-dessus du curseur.

**B**
- [Majeur] Plus de catégorie « Logement », donc plus d'état replié ni de résumé « Louer · Appartement · 1 200 € ». Qui replie ses critères ne voit plus ce qui filtre la carte. Preuve : objectif 2 de la grille ; état « catégorie repliée » du brief ; aucun bouton « Logement » dans le DOM de B.
- [Majeur] La hiérarchie est inversée : les tuiles du bien dominent le mode. Preuve : objectif 3.
- [Majeur] C'est le plus haut : 125 px de dépassement, environ 135 px à cibles conformes, soit une feuille à 72 % de l'écran qui ne laisse que 151 px de carte. Preuve : objectif 1 ; mesure.

**C**
- [Bloquant pour la spec telle que validée] Seule la valeur choisie est visible : il n'y a ni « Acheter » ni « Maison » à l'écran tant qu'on ne les a pas choisis. Le libellé « un appartement » remplace « Appartement », et les trois groupes nommés manquent. Preuve : brief, « Les choix sont visibles, jamais cachés » ; H56, « les changer est une révision de la spec, pas un choix de /ui » ; H65, « chaque bascule est un groupe nommé » ; AC « l'utilisateur choisit Maison », alors qu'aucun bouton ne porte ce nom. Je le classe Bloquant parce que retenir C tel quel impose de réviser la spec validée, pas seulement le design.
- [Majeur] Le curseur saute d'environ 24 px quand l'unité change, y compris par Louer ↔ Acheter. Preuve : objectif 4 ; positions sur les blocs.
- [Mineur] La bascule d'unité se cache sur le montant (« 1 200 € ⇆ »). On y attend une saisie du prix, pas un changement d'unité.

## Ce que chaque direction fait le mieux
- **A** : l'ordre juste (le mode d'abord, l'unité en détail sous le curseur) et un curseur qui ne bouge jamais. Le tout avec des composants qui existent déjà.
- **B** : les tuiles avec icône font comprendre le bien sans lire. Mais c'est payé en hauteur et en hiérarchie.
- **C** : la phrase se lit d'un coup d'œil, et ses cibles sont toutes à 44 px.

## Recommandation
**Base : A.** C'est la seule direction qui tient les objectifs 3, 4 (stabilité du curseur) et 5 sans réviser la spec. Ses défauts se corrigent sans changer sa structure.

À faire sur A :
1. **Cibles à 44 px** sous 1 024 px : segmenté, pastilles du bien, Total / Au m² et champ surface (44 px de haut, texte à `taille-saisie` 16, déjà mesuré à 16 px).
2. **Prendre à C la phrase comme résumé replié** : « Louer · Appartement · 52 m² · 1 200 € », à droite de « Logement ». C'est la lisibilité de C, sans ses bascules cachées.
3. **Différencier Louer / Acheter du bien** pour l'objectif 3 : garder le segmenté sur son rail et donner aux pastilles du bien le style pastille du système (`taille-pastille`, contour `border`), plutôt qu'un second bloc plein de même poids. C'est un composant existant, donc pas de jeton nouveau.
4. **Ne rien prendre à B** : ni les onglets soulignés, ni les tuiles. L'icône du bien peut éventuellement entrer dans la pastille, en 20 px et sans gagner de hauteur ; c'est un choix de goût, pas un besoin de la grille.

**La place se décide à part (objectif 1), avec Vincent.** Avec A à 44 px, le curseur finit vers 653 px. Deux leviers sont possibles, ensemble ou séparément :
- **Agrandir la feuille** à environ 377 px, soit 69 % de 548 px. Il reste alors environ 170 px de carte. C'est une révision de D9 d'interface-telephone et du test hors AC de H48.
- **Masquer visuellement le titre « Où vivre en France » dans la feuille** sous 1 024 px, en le gardant pour les lecteurs d'écran : environ 60 px gagnés. La feuille ne doit alors monter qu'à environ 317 px (58 %).

Je n'ai pas tranché : c'est un choix entre la part de carte visible et la marque dans la feuille, qui revient à Vincent.

## Non jugé
- Le résumé replié de A et de C : je n'ai pas cliqué « Logement » (budget navigateur atteint).
- Le nom du curseur pour les lecteurs d'écran (H65) dans les trois directions : non lu, car le nom porté par le parent du pouce n'est pas remonté dans ma mesure.
- La taille de Total / Au m² en bureau dans B : à l'œil, environ 20 px, donc sous `taille-cible` 24, mais non mesurée.
- Le clavier seul, les animations, la fiche, la légende (H60), les états Sans limite et surface en cours de saisie : non fournis ou non parcourus.
- Fidélité : les trois sont au même niveau ; B porte des icônes en plus, sans être plus abouti.
