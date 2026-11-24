# Relecture à l'aveugle des pistes — services

Statut : terminé

Mode : directions (A, B, C) · relecteur neuf · 2026-11-24 · sources : captures de `directions/`, prototype en marche (`localhost:5174`, 390 × 844 et 375 × 548), mesures dans le DOM (hauteurs, `aria-pressed`, `aria-expanded`, styles calculés). Les trois pistes sont au même niveau de finition. Non jugés, comme demandé : les valeurs de « Gare grandes lignes » et les crans de temps.

## En bref
- **A** : la fiche la plus lisible (une colonne, chiffres à droite, filets). Le panneau est clair mais long, et « Toutes » est noir au départ.
- **B** : la seule piste qui distingue le type de gare (un choix toujours posé) des temps (un filtre). Mais la fiche est une liste en drapeau, et le panneau ajoute des titres hors spec (« Santé et courses », « Train ») : c'est le plus haut des trois.
- **C** : de loin la plus courte (96 px). Mais elle ajoute un toucher avant chaque réglage, et l'éditeur ouvert ne dit pas à quelle ligne il appartient.
- **Recommandation** : partir de A, et prendre à B le « Choix souligné » pour « Type de gare ». Ne garder de C que l'état « À compléter », si l'on veut le montrer.

## Mesures (390 × 844, catégorie ouverte)
| | A | B | C |
|---|---|---|---|
| Hauteur du contenu de « Services », rien de coché | 459 px | 533 px | 96 px (tuiles fermées) |
| Même chose avec le réglage d'exemple | 459 px | 533 px | 96 px ; 150 (Médecin ouvert), 241 (Scolarité), 243 (Gare) |
| Boutons visibles | 20 | 20 | 4 tuiles (+ 3 à 8 dans l'éditeur ouvert) |
| Cibles | toutes ≥ 44 px de haut (plus petite : « École » 56 × 44) | idem | tuiles 175 × 44 (57 px quand le résumé tient sur deux lignes) |
| « Toutes » au départ, sans temps | `aria-pressed=true`, rempli `primary` | `aria-pressed=true`, souligné 2 px, texte `foreground` (les autres en `muted-foreground`) | rempli `primary` dans l'éditeur de Gare |
| H48 à 375 × 548 : curseur du loyer | haut 519, bas 537 < 548 : visible | idem | idem |
| Bloc de la fiche (Mende) | 463 px | 410 px | 418 px |
| Phrase des limites | 12 px, `muted-foreground` (5,9:1 sur `card`), 125 px de haut | idem | idem |
| Texte lu d'une ligne de la fiche | « Médecin : 2 min » (`ul`) | idem | idem |

Le geste de la mer marche dans les trois. Toucher « 10 min » coché le décoche (`aria-pressed` passe de true à false). Avec « 10 min » coché sous Gare, passer à « Grandes lignes » garde le temps. Toucher « Toutes » déjà choisi ne le désélectionne pas.

## Grille, piste par piste

### 1. Quatre lignes sans mur de boutons
- **A — moyen.** Les quatre titres se lisent d'un coup d'œil. Médecin et Commerce tiennent chacun sur une ligne (libellé à gauche, trois cases collées de 69 px à droite), ce qui fait gagner de la hauteur. Mais il y a 20 boutons sur 459 px, plus que la feuille ouverte n'en montre (environ 380 px à 844 de haut) : il faut faire défiler pour voir Gare. Le temps choisi se lit, mais les cases noires sont éparpillées (2e colonne, 1re, 2e, 3e) : il faut lire chaque ligne (`A-cat-exemple-390.png`).
- **B — le plus faible.** On compte 533 px, soit 74 px de plus que A. Les intertitres « Santé et courses », « Scolarité » et « Train » ajoutent un niveau de lecture. Médecin et Commerce passent sur deux lignes (un libellé, puis les cases). Les quatre lignes de la spec se lisent moins vite, parce que « Médecin à moins de » est en petit gris sous un titre de groupe (`B-cat-depart-390.png`).
- **C — le meilleur sur ce point.** 96 px. Chaque tuile dit son état en clair : « Peu importe », « 10 min », « École + Collège · 10 min », « Régionale · 30 min » (`C-cat-exemple-390.png`). C'est la seule piste où l'on lit le temps choisi des quatre lignes sans chercher. Le résumé le plus long (« Crèche + École + Collège + Lycée + Supérieur · 20 min ») passe sur deux lignes sans casser la grille (tuile de 57 px).

### 2. Le même geste que la mer
- **A — bon pour les temps, faux pour la gare.** Les temps sont des Cases collées, comme la mer, et la case cochée se décoche. Mais au départ, « Toutes » est le seul bouton rempli de toute la catégorie (`A-cat-depart-390.png`). Or `primary` veut dire « coché » dans tout le panneau (contrat : « pastilles cochées »). La ligne Gare a donc l'air de filtrer alors que rien n'est coché, ce qui contredit « on comprend que rien coché = peu importe ».
- **B — le meilleur.** Les temps ont le même geste que dans A. Le type de gare est un Choix souligné (composant existant, celui de « Louer ou acheter »), qui se lit comme un mode et non comme un filtre. Au départ, aucun bouton n'est rempli : la catégorie est visiblement « vide ».
- **C — un geste de plus.** Il faut toucher la tuile, puis le temps : deux gestes au lieu d'un, et un seul éditeur ouvert à la fois. On ne retrouve plus la mer, où les cases sont visibles. En contrepartie, « Peu importe » est écrit sur chaque tuile, ce qui dit le mieux « rien coché = peu importe ». Au clavier, l'éditeur vient dans le DOM après les quatre tuiles : depuis « Médecin », il faut passer « Commerce alimentaire », « Scolarité » et « Gare » avant d'atteindre « 5 min ».

### 3. Scolarité et Gare se comprennent sans mode d'emploi
- **Scolarité, les trois pistes.** Les niveaux sont des cases séparées et arrondies, les temps des cases collées. La différence de forme dit « plusieurs niveaux, un seul temps ». Les deux lignes ont leur titre (H169). L'état incomplet affiche « Coche au moins un niveau et un temps. » (vérifié en cochant « École » seul, en `muted-foreground`). C montre en plus « À compléter » sur la tuile, même fermée : seule C garde cet état visible quand l'éditeur est replié.
- **Gare.** A et C dessinent le type et le temps avec le même composant, deux segmentés de trois cases à pleine largeur. On ne voit pas lequel des deux filtre, d'autant que « Toutes » est noir au départ. Avec B, la différence se voit : on choisit un type (souligné), puis on coche un temps (cases). Dans B, le titre « Train » remplace « Gare », qui est le nom de la ligne dans la spec (R51, H153) ; le groupe lu par un lecteur d'écran reste nommé « Gare ».

### 4. La fiche se lit en cinq secondes
- **A — le meilleur.** Une colonne, chiffres en `texte-fort` tabulaires alignés à droite, un filet `border` entre les lignes. « plus d'une heure », « pas de chiffre » et « aucune sur l'île » restent dans la colonne sans la casser (`A-fiche-yeu-390.png`, `A-fiche-auch-390.png`). Seule réserve : à 390 px, l'œil traverse environ 300 px du libellé à la valeur. Les filets suffisent à suivre la ligne.
- **B — le plus faible.** « Médecin : 2 min » en ligne : chaque valeur commence là où son libellé finit, donc rien n'est aligné (`B-fiche-auch-390.png`). Pour comparer, il faut lire les dix lignes une à une. C'est pourtant le bloc le plus court (410 px).
- **C — moyen.** Une grille de deux colonnes, libellé en `secondaire` 12 px gris et valeur en 16 px gras. Supérieur et Gare sont seuls sur leur rangée, et la grille a deux trous (`C-fiche-auch-390.png`). On ne compare bien que dans une même colonne, et l'ordre de lecture zigzague. Les libellés en 12 px gris sont plus petits que les valeurs, alors que c'est le libellé qui sert à se repérer.

Dans les trois pistes, le bloc vient sous le chômage. L'ordre par rapport à « Tes proches » n'a pas pu être vu (voir Non jugé).

### 5. Honnête et court
- Les trois pistes respectent ce point de la même façon. La phrase des limites est complète, avec « son temps part parfois de la mairie » (lu dans le DOM ; les captures de la fiche la montrent coupée avant). Elle est en 12 px `muted-foreground`, 5,9:1, sous la liste, sans dominer. On ne voit ni note, ni jauge, ni couleur de donnée, ni icône de TGV. H48 tient dans les trois pistes, puisque « Services » est la dernière catégorie.
- B : le titre « Train » au-dessus de « Grandes lignes » rapproche l'idée d'un service de trains, alors que la ligne mesure l'accès à une gare (D18 : rien ne doit laisser croire à un TGV). L'effet est faible.
- C : avec le réglage d'exemple, quatre tuiles pleines en `primary` font de « Services » la masse la plus sombre du panneau, ce qui va contre « mise en avant de la catégorie » (Pas voulu) et le ressenti « encre et papier ».

## Problèmes classés par impact

```
[Majeur] A et C : « Toutes » est rempli en primary alors que rien n'est coché — l'usager croit qu'un filtre de gare est actif, et le type se confond avec un filtre.
  Où : A-cat-depart-390.png, A-bureau, C-bureau, éditeur Gare de C ; mesuré : `aria-pressed=true` et `bg-primary` sur « Toutes » au départ
  Correction : le type de gare en Choix souligné, comme B (trait 2 px primary, texte foreground ; les autres en muted-foreground). Seuls les temps restent en cases.
  Réf : objectif 2 (« rien coché = peu importe ») et 3 de la grille ; contrat : primary = « pastilles cochées » ; heuristique : visibilité de l'état
```
```
[Majeur] C : l'éditeur ouvert n'est rattaché à aucune tuile — avec le réglage d'exemple, les quatre tuiles sont identiques (bg-primary) et l'éditeur de Médecin n'a pas de titre : « 5 / 10 / 15 min » peut être Médecin ou Commerce.
  Où : C-cat-scolarite-390.png, C-cat-gare-390.png ; prototype `?variant=C&exemple=1`, Médecin ouvert (classe de la tuile ouverte : identique aux autres quand elle filtre ; contour 2 px seulement quand elle ne filtre pas)
  Correction : si C est retenue, marquer la tuile ouverte quel que soit son état (contour 2 px foreground décalé, ou chevron) et titrer chaque éditeur par le nom de sa ligne. Mieux : ne pas retenir les tuiles (voir la fusion).
  Réf : objectif 1 (« le temps choisi pour chacune ») ; heuristique : reconnaître plutôt que se souvenir
```
```
[Majeur] B : les valeurs de la fiche ne sont pas alignées (« Médecin : 2 min » en ligne) — comparer les 10 temps demande de lire chaque ligne.
  Où : B-fiche-auch-390.png, B-fiche-yeu-390.png
  Correction : la fiche de A (libellé à gauche, valeur tabulaire à droite, filets).
  Réf : objectif 4 (« chiffres alignés »)
```
```
[Mineur] A : la catégorie fait 459 px à 390, soit plus que la feuille ouverte, et Gare est sous le pli.
  Où : mesure du DOM ; A-feuille-390x844.png
  Correction : garder les lignes Médecin et Commerce sur une ligne (déjà fait) ; resserrer l'écart entre le titre de ligne et son sous-titre (space-1). À juger contre la hauteur de B, qui est pire.
  Réf : objectif 1. Mineur, parce que les autres catégories défilent déjà de la même façon.
```
```
[Mineur] B : « Santé et courses » et « Train » sont des titres hors spec — R51 nomme les lignes « Médecin », « Commerce alimentaire », « Scolarité », « Gare », et ces titres ajoutent 74 px.
  Où : B-cat-depart-390.png
  Correction : supprimer le groupe « Santé et courses » ; titrer la ligne « Gare ».
  Réf : R51, H153, objectif 1 ; D18 pour « Train »
```
```
[Mineur] C : la fiche en grille de deux colonnes a des trous (Supérieur et Gare seuls sur leur rangée), et les libellés sont en 12 px gris.
  Où : C-fiche-auch-390.png
  Correction : une colonne (A).
  Réf : objectif 4. Mineur, parce que les valeurs restent alignées dans chaque colonne.
```
```
[Mineur] C : au clavier, l'éditeur est placé après les quatre tuiles — trois tabulations de trop entre la tuile ouverte et son premier temps.
  Où : ordre du DOM, `?variant=C`
  Correction : placer l'éditeur juste après sa tuile dans l'ordre de lecture, ou porter le focus sur le premier bouton à l'ouverture (comme « Métier choisi »).
  Réf : WCAG 2.4.3 (ordre du focus), objectif 2 (« tout au clavier »)
```
```
[Mineur] A, B, C : la phrase « Coche au moins un niveau et un temps. » n'est reliée à aucun groupe (pas d'`aria-describedby`, pas d'id) et n'est pas annoncée.
  Où : prototype, Scolarité avec « École » seul
  Correction : la relier aux deux groupes, comme le dit H153 ; à reprendre au build, quelle que soit la piste.
  Réf : H153, WCAG 4.1.3. Mineur, parce que c'est un prototype.
```

## Ce que chaque piste fait de mieux
- **A** : la fiche (une colonne, chiffres à droite, filets, valeurs longues qui tiennent) ; Médecin et Commerce sur une seule ligne chacun, ce qui gagne de la hauteur sans rien cacher.
- **B** : le type de gare en Choix souligné, qui le sépare clairement des temps et laisse la catégorie visiblement vide au départ.
- **C** : un résumé par ligne qui dit l'état en clair (« Peu importe », « Régionale · 30 min ») ; l'état « À compléter » visible même replié ; la hauteur (96 px).

## Recommandation de fusion
**Base : A**, pour le panneau et la fiche. C'est la seule piste qui sert bien l'objectif 4, et la plus courte des deux pistes « à plat ».

À y fusionner :
1. **Depuis B : « Type de gare » en Choix souligné** (composant existant, 44 px à 390). Cela corrige le Majeur de A sur les objectifs 2 et 3, sans nouveau jeton. Ne pas reprendre les intertitres ni « Train ».
2. **Depuis C, en option** : rien du mécanisme des tuiles, qui coûte un geste par réglage et pose les problèmes décrits plus haut. On peut reprendre l'idée du résumé par ligne pour le **résumé replié** de la catégorie, mais H154 fixe « 1 choix », « 2 choix »… : ce serait une décision de Vincent, pas une fusion. Si la hauteur de A (459 px) gêne à la démo, C est la piste de repli, à condition de corriger son Majeur.

Le contrat ne demande aucun nouveau jeton pour cette fusion.

## Non jugé
- Les valeurs de « Gare grandes lignes » et les crans de temps (hors champ, comme demandé).
- L'ordre du bloc sous « Tes proches » : le prototype n'avait aucun proche ajouté.
- Les états de chargement et d'erreur (R57 : « Chargement des temps… », « Temps des services indisponibles. », « Réessayer ») : aucune piste ne les montre.
- Le passage au clavier n'a été vérifié que par l'ordre du DOM et la nature des éléments (boutons natifs, focus global du contrat), pas par une session complète à la tabulation. Aucun lecteur d'écran n'a été utilisé.
- La mise à jour de l'adresse (`services=` restait absent au clic) et le filtrage réel (le compte reste à 34 674) : le prototype ne les branche pas.
- La carte ne se peint pas dans le navigateur sans écran (WebGL) : le rendu de la carte vient des captures fournies.
