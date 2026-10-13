# Relecture à l'aveugle — pistes A, B, C (proches)
2026-10-13 · mode « directions » · relecteur neuf, lecture seule · grille : [README](README.md) · brief : [brief.md](brief.md) · spec : [proches](../../specs/2026-10-13-proches/spec.md)

Matériel vu : les 16 captures de `directions/`, plus le prototype ouvert sans écran (`localhost:5174`, la carte ne s'affiche pas, mais les textes, l'ordre et les contrôles se lisent). Les trois pistes ont le même niveau de finition (même code, même fiche) : je n'ai rien eu à corriger pour ça.

## En bref
- **A** — les proches dans le panneau de gauche, avec un curseur chacun, juste sous les autres plafonds ; repère rond avec une lettre.
- **B** — des pastilles des proches en haut de la carte, chacune s'ouvre en petite fenêtre pour régler ou retirer le proche ; « + Ajouter » ouvre une fenêtre du même genre ; repère maison en goutte, nom sur une étiquette blanche.
- **C** — un onglet « Tes proches » dans le panneau de droite, à la place de la liste des 10 premières ; repère carré numéroté.

**Recommandation : partir de A**, prendre le repère de B et la ligne de proche de C, et régler le débordement du panneau (détail plus bas). A est la seule piste où l'on règle un proche comme le loyer, au même endroit, en voyant la liste et la carte réagir. Les défauts de B et C tiennent à leur structure ; ceux de A se corrigent dans la mise en page.

## Piste par piste, contre la grille

### A — panneau de gauche
| Objectif | Sert ? | Pourquoi |
|---|---|---|
| 1. Ajouter sans hésiter | Moyen | Le formulaire est sous les réglages, à l'endroit attendu. Mais dans l'état vide, les suggestions poussent « Ajouter » sous le bord du panneau (A-ajout : le bouton est coupé vers y = 780). Avec 4 proches, le champ est tout en bas d'un panneau qu'il faut faire défiler. L'attente se lit : « Calcul des trajets depuis Toulouse (31)… » en clair, « Retirer » juste dessous pour annuler. |
| 2. Lire la carte | Faible | Le repère est **rond**, comme les ronds du top 10 ; seules la lettre et la couleur les distinguent (le brief demande « une goutte ou une maison », les ronds restant aux 10 premières). À 390 px, le nom « Parents de Léa » est entièrement caché par le groupe « 1·2·3·4·5·6·9·10 » (A-390) ; en bureau, il est à moitié caché (A-fiche). |
| 3. Régler comme le loyer | Bon sur le principe, raté sur la place | Un curseur par proche, « 4 h » écrit en `valeur`, au même endroit que le loyer et la mer : c'est exactement la règle. Mais **le panneau ne tient pas** : dès 2 proches, « 1 028 communes passent tes critères » passe sous le bord (A-classee) ; avec 5 proches, D, E, le message « plein », la phrase sur l'IGN, « Effacer » et le compte sont tous hors de vue (A-plein). |
| 4. Comprendre une couleur | Bon | Fiche commune aux trois pistes : « TES PROCHES », un temps par proche, la mer en km et en minutes. La liste reste visible pendant qu'on règle. |
| 5. Confiance | Moyen | La phrase sur l'IGN et « Effacer mes proches » sont toujours dans le panneau, mais sous le bord dès 3 proches. **L'adresse n'est pas écrite sous le nom** du proche (ni en bureau ni à 390 px, vérifié dans le texte de la page) : avec « Mamie Jo », on ne sait plus quelle adresse est partie. |

Bascule de la mer : la meilleure des trois (deux boutons « km | min », l'état se voit, `aria-pressed`).

### B — pastilles sur la carte
| Objectif | Sert ? | Pourquoi |
|---|---|---|
| 1. Ajouter sans hésiter | Bon | « + Ajouter un proche » est toujours à la même place ; la fenêtre ne pousse rien, et la phrase sur l'IGN est sous le champ, au moment où on tape l'adresse (B-ajout). Mais l'état de calcul tient dans la pastille, coupé : « Les Dupont calcul… ». Le texte de la spec (« Calcul des trajets depuis Les Dupont… ») n'apparaît qu'en ouvrant la pastille. |
| 2. Lire la carte | Le meilleur repère, mal posé | La maison en goutte avec le nom sur une étiquette `card` suit le brief à la lettre et ne se confond pas avec les ronds. Mais l'étiquette passe sous les ronds du top 10 (B-fiche : il ne reste que « éa » de « Parents de Léa »). À 5 proches, les pastilles prennent deux rangées en haut de la carte (B-plein) ; à 390 px, elles cachent le bas de la carte et le nom « Toulouse (31) » (B-390). |
| 3. Régler comme le loyer | Faible | Le plafond se voit d'un coup d'œil (« ≤ 4 h ») mais se règle un proche à la fois, derrière un clic, dans une fenêtre qui cache la carte (B-plein). Ce n'est plus « comme le loyer ». |
| 4. Comprendre une couleur | Bon | Fiche commune. |
| 5. Confiance | Faible | « Effacer mes proches » n'existe que dans la fenêtre « + Ajouter ». Quand on a 5 proches, « + Ajouter » devient « 5 proches au maximum » et **le bouton disparaît** de la page (vérifié dans le prototype, `demo=plein` : ni « Effacer » ni la phrase sur l'IGN, même en ouvrant une pastille). |

Bascule de la mer : « à vol d'oiseau · en voiture » en liens soulignés, sous un sous-texte qui répète « à vol d'oiseau ». C'est l'option choisie qui est soulignée : elle ressemble à un lien, donc à l'action à faire.

### C — onglet dans le panneau de droite
| Objectif | Sert ? | Pourquoi |
|---|---|---|
| 1. Ajouter sans hésiter | Moyen | Le formulaire et les états sont complets et bien rangés (C-ajout, C-plein). Mais au premier passage, rien dans les réglages ne parle des proches : la fonction qui fait la différence du site se trouve dans un onglet « Tes proches (0) », en haut à droite. |
| 2. Lire la carte | Faible | Les repères sont **numérotés 1 à 5**, juste à côté des ronds du top 10 numérotés 1 à 10 (C-fiche : le proche « 1 » touche le rond « 1 » et le groupe « 2·3·4·5·10 »). Le brief demande « une lettre ou une icône ». Le nom, placé à droite, reste lisible (C-390) : c'est le placement le plus solide des trois. |
| 3. Régler comme le loyer | Faible | Régler un proche **cache la liste des 10 premières** (même onglet) : on ne voit pas la liste changer. Quand une fiche est ouverte, les onglets disparaissent (C-fiche) : impossible de régler Toulouse en lisant « Toulouse (31) : 3 h 15 à 3 h 30 ». En revanche, le panneau tient avec 5 proches en 1 440 × 900 (C-plein, il finit vers y = 810). |
| 4. Comprendre une couleur | Bon | Fiche commune ; mais voir plus haut : la fiche et les réglages des proches ne sont jamais visibles en même temps. |
| 5. Confiance | Le meilleur | Adresse en petit sous chaque nom, la phrase sur l'IGN et « Effacer mes proches » visibles même avec 5 proches (C-plein, C-proches). |

Bascule de la mer : une liste déroulante qui marche, mais cache l'autre unité derrière un clic.

## Ce qui casse, classé
```
[Majeur] B — « Effacer mes proches » disparaît quand il y a 5 proches — la personne qui veut retirer ses adresses ne trouve pas le bouton au moment où elle en a le plus.
  Où : B-plein ; prototype ?variant=B&demo=plein (absent du texte de la page, même pastille ouverte)
  Correction : « Effacer mes proches » visible dès un proche, hors de la fenêtre d'ajout (au bout de la rangée de pastilles, ou dans chaque fenêtre de proche).   Réf : details.md, zone Tes proches (« Effacer mes proches » dès qu'il y a un proche) ; grille 5

[Majeur] A — le panneau de gauche ne tient pas : le compte de communes passe sous le bord dès 2 proches ; à 5, deux proches, la phrase sur l'IGN et « Effacer » aussi — on règle un plafond sans voir le compte bouger.
  Où : A-classee (compte coupé), A-plein
  Correction : voir « Base recommandée », point 3.   Réf : grille 3 (« le panneau tient avec 5 proches »)

[Majeur] C — régler les proches cache la liste ; ouvrir une fiche cache les proches — le lien entre « je règle Toulouse » et « Bordeaux passe ou non » est coupé.
  Où : C-classee / C-proches (onglets exclusifs), C-fiche (plus d'onglets)
  Correction : sortir les proches de l'onglet ; c'est structurel, d'où le choix de ne pas partir de C.   Réf : grille 3 (« à portée ») et 4

[Majeur] C — repères numérotés 1 à 5 à côté des rangs 1 à 10 du top 10 — on lit « 1 » comme la première commune.
  Où : C-fiche, C-plein (proche « 1 » contre « 4·5·9·10 » et « 1·6·7·8 »)
  Correction : une lettre ou une icône, jamais un chiffre.   Réf : brief, Échelles (« une goutte ou une maison avec une lettre ou une icône ») ; grille 2

[Majeur] A et B — le nom du proche passe sous les ronds du top 10 et disparaît ; il ne reste que le repère.
  Où : A-390 (« Parents de Léa » caché), A-fiche (à moitié), B-fiche (« éa »)
  Correction : les repères et noms des proches au-dessus des ronds ; nom placé comme dans C (à côté, avec plusieurs positions possibles), jamais masqué ; s'il touche un groupe de ronds, c'est le groupe qui se décale ou passe dessous.   Réf : brief (« un repère n'est jamais le seul indice : le nom est écrit dessus ou dessous ») ; H29 ; grille 2

[Majeur] A — l'adresse n'est pas écrite sous le nom du proche.
  Où : A-classee, A-plein, texte de la page à 390 px
  Correction : adresse en `secondaire` `muted-foreground` sous le nom, comme dans C.   Réf : details.md (« une ligne par proche (nom, adresse en petit, état ou plafond, « Retirer ») ») ; grille 5

[Majeur] B — à 390 px, les pastilles couvrent la bande de carte visible et le nom « Toulouse (31) » ; à 5 proches, elles prendront plusieurs rangées sur une carte de ~370 px de haut.
  Où : B-390 (2 proches) ; 5 proches à 390 px non capturé
  Correction : sans objet si l'on part de A ; dans B, les pastilles iraient dans la feuille.   Réf : grille 2 (« sans cacher les couleurs ») et 3 (« à 390 px »)

[Mineur] A — dans l'état vide, les suggestions poussent « Ajouter » sous le bord du panneau.
  Où : A-ajout   Correction : suggestions en liste posée par-dessus, collée au champ (réf. Nextdoor), sans pousser le reste.   Réf : brief, références

[Mineur] B — états coupés dans les pastilles : « calcul… », « 5 proches au maximum » (sans « Retire-en un pour en ajouter un autre. »).
  Où : B-fiche, B-plein   Réf : details.md, textes exacts. Mineur : le texte complet est un clic plus loin.

[Mineur] B — bascule de la mer en liens soulignés, état choisi = souligné, « à vol d'oiseau » écrit deux fois.
  Où : B-classee   Réf : visibilité de l'état (heuristique 1). Mineur : `aria-pressed` est juste.

[Mineur] Commun — repère « calcul » à 60 % : chiffre ou lettre blanc sur le repère estompé 2,6:1, repère contre fond de carte 2,35:1 (mesurés sur #F5F3EE) ; « indisponible » et « calcul » se ressemblent, le « ! » ne se lit pas à cette taille (A et C, Paris dans *-plein) ; dans A, le nom « Karim boulot » est grisé lui aussi.
  Correction : estomper le remplissage, garder un contour plein `foreground` ou `card` à 100 % et le nom à 100 % ; « ! » en `rang` Bold 12 au moins.   Réf : WCAG 1.4.11 (3:1). Mineur : le nom écrit et la ligne du panneau portent l'état.

[Mineur] Commun (vérifié dans A) — cinq boutons s'appellent tous « Retirer » (et « Réessayer ») pour un lecteur d'écran.
  Correction : nom accessible « Retirer Parents de Léa ».   Réf : WCAG 2.4.6.

[Mineur] Commun — le repère, posé sur la mairie, couvre une partie du nom IGN de la ville (« NANTES », « TOULOUSE ») dans les trois pistes ; C couvre le plus (nom à droite sur le nom IGN).
  Réf : brief, Pas voulu (« plus que nécessaire »). Inévitable en partie ; à régler avec la règle de placement du nom.
```

## Ce que chaque piste fait de mieux
- **A** : le principe « un proche = un plafond comme le loyer, au même endroit » ; la bascule km | min ; l'état de calcul écrit en clair avec « Retirer » à côté.
- **B** : le repère maison en goutte avec son nom sur une étiquette `card` (le plus lisible et le plus fidèle au brief) ; la phrase sur l'IGN qui apparaît au moment où l'on tape l'adresse ; le plafond lisible d'un coup d'œil (« ≤ 4 h »).
- **C** : la ligne de proche complète (repère miniature, nom, adresse en petit, valeur, curseur, état) ; le bloc « phrase IGN + Effacer » toujours visible ; le nom posé à côté du repère, qui résiste le mieux aux ronds.

## Base recommandée : A, avec
1. **Le repère de B** (maison en goutte `place-marker`, contour `card` 2 px, `ombre-panneau`), la lettre du panneau reprise dans la miniature ou sous l'icône ; **le placement du nom de C** (à côté, plusieurs positions possibles), au-dessus des ronds du top 10.
2. **La ligne de C** dans le panneau de A : nom et valeur sur une ligne, adresse en petit dessous, curseur, puis « Retirer » (nom accessible complet).
3. **Faire tenir le panneau** (grille 3) : le compte « N communes passent tes critères » collé en bas du panneau, toujours visible ; « Effacer mes proches » en lien à droite du titre « TES PROCHES » ; le formulaire replié en « + Ajouter un proche » dès un proche (A le fait déjà), suggestions posées par-dessus. Le défilement du panneau devient acceptable si le compte et « Effacer » ne défilent plus. À vérifier avec 5 proches en 1 440 × 900 et à 390 px.
4. **La phrase sur l'IGN au moment de l'ajout**, comme dans B : sous le champ quand il est ouvert (elle est déjà là dans l'état vide de A).
5. Garder la bascule **km | min** de A.

Écarter : les onglets de C (ils séparent ce qu'il faut voir ensemble) et les pastilles sur la carte de B (elles prennent la carte à 390 px et cachent les réglages derrière un clic).

## Non jugé
- Le mouvement (anneau qui tourne en calcul) : captures fixes, et la carte ne s'affiche pas sans écran.
- La fiche d'une commune qui ne passe pas (Arcachon) : pas capturée ; la fiche est la même dans les trois pistes.
- Le champ « Nom » prérempli après le choix d'une suggestion, « Aucune adresse trouvée. », la panne de recherche, « Cette adresse est déjà dans tes proches. », « Tes proches ne seront pas gardés sur ce navigateur. » : pas capturés.
- 5 proches à 390 px, et le zoom d'une ville : pas capturés.
- Parcours complet au clavier : seulement les noms et rôles des contrôles (curseurs nommés avec « 4 h en voiture au plus », pastilles B en boutons avec état ouvert/fermé, onglets C en vrais onglets).
- Les temps (3 h 15 à 3 h 30 pour Bordeaux au lieu de 3 h 30 à 3 h 45) : simulés, hors sujet.
