# Comparaison à l'aveugle — mairies, pistes A, B, C
2026-10-18 · relecteur design neuf · mode directions · [brief](brief.md) · spec [mairies](../../specs/2026-10-18-mairies/spec.md)

Regardé : les 12 captures de `directions/` et la page en marche (`http://localhost:5180/?variant=A|B|C`) à 390 × 844, 1440 × 900 et 375 × 548, avec des mesures prises dans la page (taille des pastilles, ce qui est visible, position des titres de catégorie, noms lus par un lecteur d'écran). Les trois pistes ont le même niveau de finition : aucune n'est avantagée par le soin.

## Ce que fait chaque piste
- **A — Rangée qui défile** (le composant de « Type d'environnement ») : les 7 pastilles sur une ligne qui défile sur le côté à 390 px, et qui passe à la ligne en bureau ; coche quand la pastille est cochée ; aucune explication de « Sans étiquette ».
- **B — Cases collées** : 6 blocs collés sur une ligne (« Extrême / gauche » sur deux lignes), puis « Sans étiquette » sur toute la largeur, avec dessous, dans le bouton, « communes de moins de 3 500 habitants ».
- **C — Cases séparées** (le composant de « Taille ») : grille de 3 × 2 pour les 6 blocs, une phrase « Moins de 3 500 habitants : le ministère ne classe pas les listes », puis « Sans étiquette » seule.

## Mesures
| | A | B | C |
|---|---|---|---|
| Pastilles visibles en entier sans défiler à 390 px | **4 sur 7** (Droite coupée ; Extrême droite et Sans étiquette hors de l'écran) | 7 sur 7 | 7 sur 7 |
| Taille d'une pastille à 390 px | 59 à 112 × 44 | 59 × 44 (Sans étiquette 358 × 44) | 114 × 44 |
| Taille en bureau | 59 à 112 × 28 | 50 × 44 | 97 × 44 |
| Hauteur ajoutée au panneau (titre « Vie locale » → titre « Tes proches ») à 390 px | **136 px** | 182 px | **255 px** |
| Idem en bureau | 164 px | 162 px | 236 px |
| Titre « Tes proches » à l'ouverture en 1440 × 900 | à 856 px, visible | à 854 px, visible | **à 928 px, sous le bas de l'écran** |
| Curseur du prix à 375 × 548 (H48) | 519 → 537 px, visible | idem | idem |
| Nom du groupe pour un lecteur d'écran | « Mairie élue en 2026 » | idem | idem |

H48 tient dans les trois pistes : « Vie locale » est loin sous le curseur du prix, elle ne change rien à l'ouverture. Ce n'est pas un critère qui les départage.

## Pistes contre la grille du brief

| Objectif | A | B | C |
|---|---|---|---|
| 1. Lisible d'un coup d'œil, 7 choix dans l'ordre (D2) | **Non à 390 px** : 3 choix sur 7 hors de l'écran. Oui en bureau | Oui, mais serré : 59 px (50 en bureau) par case, deux mots coupés sur deux lignes | **Le mieux** : 7 libellés entiers, larges, dans l'ordre |
| 2. « Sans étiquette » ne trompe pas (D8) | **Non** : rien ne l'explique, et c'est la dernière pastille, cachée à 390 px | En partie : le sous-texte dit « petites communes », mais il se lit comme une taille (la raison même pour laquelle D8 a écarté « Moins de 3 500 hab. ») | **Le mieux** : la phrase donne la cause (« le ministère ne classe pas les listes »), pas une taille |
| 3. Le panneau reste court | **Le mieux** : +136 px à 390 px | Moyen : +182 px | **Le moins bon** : +255 px à 390 px ; « Tes proches » passe sous l'écran en 1440 × 900 |
| 4. Le même geste que les autres filtres (D3) | Oui : même composant que « Type d'environnement », choix multiple | **Non** : dans le système, les Cases collées veulent dire « un seul choix » (Mer, Montagne juste au-dessus) | **Le mieux** : même composant que « Taille », choix multiple, 44 px partout |
| 5. Neutre, même poids que taille ou type | **Le mieux** : identique à « Type d'environnement » | Le moins bon : « Sans étiquette » cochée devient une barre noire de 358 × 44, l'élément le plus lourd du panneau | Bien : même poids que « Taille » |

Les trois respectent l'interdit des couleurs de partis : une seule couleur, `primary`, pour toute pastille cochée ; ni logo, ni icône, ni badge.

## Défauts de chaque piste

### A
[Majeur] À 390 px, seules 4 pastilles sur 7 sont visibles en entier ; « Extrême droite » et « Sans étiquette » sont hors de l'écran — on ne voit pas tous les choix, ni que « Sans étiquette » (91 % des communes) existe. Une fois cochée, on ne la voit pas non plus.
  Où : `A-depart-390x844.png`, `A-choix-390x844.png` (« Sans étiquette » est cochée mais invisible) ; mesuré : bord droit de « Droite », « Extrême droite » et « Sans étiquette » au-delà de 390 px
  Correction : ne pas garder la rangée qui défile pour ce groupe : 7 choix, c'est trop pour une rangée (Type d'environnement en a 4).   Réf : objectif 1 du brief, AC-1 / AC-9 ; visibilité de l'état (heuristique 1)

[Majeur] Rien n'explique « Sans étiquette » — on peut croire que ces 31 508 communes ont des listes « sans bord », exactement ce que D8 veut éviter.
  Où : toutes les captures de A ; mesuré : le texte du groupe se limite aux 7 libellés
  Correction : ajouter l'explication (voir C).   Réf : objectif 2, D8

### B
[Majeur] Les Cases collées sont le composant du choix unique dans le système (« la case cochée se décoche d'un toucher », Mer et Montagne juste au-dessus), mais ici on peut en cocher plusieurs. Même allure, geste contraire : on croira qu'un seul bord est possible, ou on sera surpris d'en voir deux cochés.
  Où : `B-depart-390x844.png`, `B-choix-1440x900.png` (Mer et Montagne en Cases collées juste au-dessus)
  Correction : prendre les Cases séparées, le composant du choix multiple (Taille).   Réf : objectif 4, D3 ; contrat du système, lignes « Cases collées » et « Cases séparées » ; cohérence (heuristique 4)

[Mineur] « Sans étiquette » cochée = une barre noire de 358 × 44 px, plus lourde que tout le reste du panneau : la politique se met en avant dès qu'on coche le choix le plus courant.
  Où : `B-choix-390x844.png`, `B-choix-1440x900.png`
  Correction : une case de la même taille que les autres.   Réf : objectif 5, « Ressenti » du brief

[Mineur] Le sous-texte « communes de moins de 3 500 habitants » se lit comme une taille (doublon apparent du filtre Taille), et il est un peu inexact : les chefs-lieux d'arrondissement de moins de 3 500 habitants ont une étiquette (D8).
  Où : bouton « Sans étiquette » de B
  Correction : dire la cause plutôt que la taille, comme la phrase de C.   Réf : objectif 2, D8

[Mineur] 6 colonnes de 59 px (50 en bureau) : « Extrême gauche » et « Extrême droite » coupés sur deux lignes, bande dense à lire.
  Où : `B-depart-390x844.png`   Réf : objectif 1

### C
[Mineur, hésité avec Majeur] C allonge le panneau le plus : +255 px à 390 px (près du double de A), et le titre « Tes proches » passe sous le bas de l'écran en 1440 × 900 (928 px). Mineur parce que, à 390 px, « Tes proches » est déjà sous l'écran dans les trois pistes (on y arrive en faisant défiler les Critères) et que l'écart en bureau est de 72 px.
  Où : mesures ci-dessus ; `C-depart-390x844.png`
  Correction : mettre la phrase d'explication **à côté** de « Sans étiquette », sur sa ligne (la case dans la 1re colonne, la phrase dans les 2 autres), au lieu d'une ligne à part. Gain : une ligne de texte et un écart, soit environ 30 px.   Réf : objectif 3

[Mineur] La phrase « Moins de 3 500 habitants : le ministère ne classe pas les listes » n'est pas reliée au bouton « Sans étiquette » (aucun `aria-describedby`, mesuré) : au clavier ou au lecteur d'écran, on passe de pastille en pastille sans l'entendre.
  Où : groupe « Mairie élue en 2026 » de C
  Correction : relier la phrase au bouton par `aria-describedby`, ou la mettre dans le bouton en sous-texte `text-mentions` (comme B, que le lecteur d'écran lit bien : « Sans étiquette communes de moins de 3 500 habitants »).   Réf : WCAG 1.3.1 (information et relations) ; objectif 2

### Commun aux trois
[Mineur] Dans la page servie, les pastilles de type, de mer et de montagne sont grisées et désactivées (`disabled`, mesuré), alors que les 7 pastilles de mairie restent actives. Si c'est l'état « données pas encore là ou en erreur », la mairie doit suivre la même règle (H122 : « même chargement et même erreur »).
  Où : `*-choix-1440x900.png`, toutes pistes   Correction : au build, appliquer aux pastilles de mairie l'état désactivé des autres filtres.   Réf : H122

## Ce que chaque piste fait de mieux
- **A** : la plus courte et la plus neutre — elle ressemble trait pour trait à « Type d'environnement ». Elle prouve qu'on peut rester sous 140 px ; elle échoue sur ce qu'on voit à 390 px.
- **B** : met l'explication **dans** le bouton, donc lue par le lecteur d'écran avec le libellé ; hauteur moyenne.
- **C** : le bon composant (choix multiple, comme Taille), les 7 choix lisibles d'un coup, et la meilleure explication de « Sans étiquette » (la cause, pas une taille).

## Recommandation
**Partir de C.** C'est la seule qui tient à la fois les objectifs 1, 2 et 4 sans défaut sérieux ; son défaut (la hauteur) se corrige sans changer de composant. A cache trois choix à 390 px et n'explique rien ; B prend le composant du choix unique pour un choix multiple.

Fusion proposée :
1. **De C** : Cases séparées, grille de 3 colonnes, 44 px, libellés entiers, dans l'ordre de R38 ; la phrase sur la cause.
2. **Pour l'objectif 3** : sur la 3e ligne, « Sans étiquette » dans la 1re colonne et la phrase dans les deux autres (texte `secondaire`, `muted-foreground`), au lieu d'une ligne à part ; viser au plus ~225 px ajoutés à 390 px et « Tes proches » encore visible à l'ouverture en 1440 × 900.
3. **De B** : rendre l'explication lisible par le lecteur d'écran avec le bouton (`aria-describedby` vers la phrase) ; ne pas reprendre la barre pleine largeur ni les Cases collées.
4. **De A** : rien de structurel ; garder son allure sobre comme référence de poids visuel (pas de coche, pas de cadre autour du groupe, rien de plus que pour Taille).
5. Au build : même état désactivé que les autres filtres pendant le chargement ou l'erreur (H122).

## Non jugé
- La ligne « Mairie : … » de la fiche (R40) et son retour à la ligne pour un nom de 121 caractères : absente des trois prototypes.
- Le résumé de « Vie locale » repliée (« Peu importe », « 2 choix », H110) : non capturé, non ouvert.
- La carte elle-même (le fond ne se charge pas sans fenêtre, attendu) et l'effet du filtre sur le compte : le compte reste à 34 674 dans les captures « choix », donc le prototype ne filtre pas — normal pour une comparaison de mise en page.
- Le contour de focus au clavier : les pastilles sont de vrais boutons à bascule (`aria-pressed`) dans un groupe nommé, donc atteignables à Tab, mais je n'ai pas fait de capture du focus.
