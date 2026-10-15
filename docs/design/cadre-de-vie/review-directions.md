# Relecture des directions — cadre-de-vie (comparaison à l'aveugle)
2026-10-15 · Relecteur neuf, lecture seule · Grille : [brief.md](brief.md) (5 objectifs) · Règles : [details.md](../../specs/2026-10-14-cadre-de-vie/details.md) (R27, H69–H76) · Système : [README](../system/README.md)

## Méthode
- Captures fournies : `directions/{A,B,C}-{depart-390x844,choix-390x844,bureau}.png`.
- Prototype en marche (`http://localhost:5180/?variant=A|B|C`), navigateur sans écran : mesures du DOM (position, taille et nom accessible de chaque bouton, largeur visible et largeur réelle de chaque groupe) à 390 × 844, 375 × 548 et 1440 × 900 ; réglage d'exemple du brief saisi clic par clic ; résumé replié relu. Capture ajoutée : C, « Taille » ouverte avec deux tailles cochées (dossier temporaire du relecteur, non versionnée).
- Les trois directions ont la même finition. Je n'ai rien eu à pondérer pour ça.

## Tableau objectif × direction

| Objectif | A — rangées de pastilles qui défilent de côté | B — tout visible : segments + cases | C — liste de groupes dépliables |
|---|---|---|---|
| **1. Place** (curseur du prix visible à 375 × 548, Cadre de vie dessous, la feuille ne grandit pas) | **Tenu.** Curseur à y 519–537 pour 548 de haut ; « Cadre de vie » commence à y 612 ; feuille à défilement fixe de 240 px. Longueur à faire défiler : 1 115 px | **Tenu**, mesures identiques. Défilement le plus long : 1 173 px | **Tenu**, mesures identiques. Défilement le plus court : 908 px (groupes fermés) |
| **2. Compact, une ligne par groupe** | **En apparence seulement.** Une ligne par groupe, mais elle déborde : à 390 px, largeur visible 390 pour un contenu de 605 (Taille), 566 (Urbain), 466 (Rural), 504 (Montagne). Hors écran au départ : 2 tailles sur 4, 2 types urbains sur 4, 1 type rural sur 3, 2 montagnes sur 6 | **Tenu pour Taille, Mer et Montagne** (356 px, aucun débordement), mais au prix de libellés raccourcis (voir B1, B3). Type : 2 colonnes de 173 px, 4 rangées | **Non tenu.** Fermés, les groupes ne montrent aucune pastille. Ouverts, Taille passe sur 2 lignes (139 + 134 / 158 + 154 px) et Montagne aussi (4 + 2, capture C-choix) |
| **3. Choix unique ≠ cases cumulables** | **Faible.** Même pastille pour les deux genres ; seule différence : une coche ✓ sur une bascule choisie, et « Peu importe » rempli d'office dans Mer et Montagne. Au repos, Taille et Mer se ressemblent | **Fort pour Type, Mer et Montagne** (cases carrées contre segments collés), **faux pour Taille** : la Taille, à choix multiples, est dessinée avec le même segmenté que Mer et Montagne | **Comme A**, et en plus on ne le voit qu'après avoir ouvert le groupe |
| **4. Lisible d'un coup d'œil** | Repliée : « 1 taille · 2 types · Mer 50 km · En montagne » (H75, mesuré). Ouverte : un choix peut se cocher hors écran (« Plus de 200 000 hab. » à x 453 sur 390) et on ne voit plus qu'il filtre | Repliée : même résumé. Ouverte : **le meilleur**, tous les choix et leur état tiennent à l'écran, sans geste | Repliée : même résumé. Ouverte : **bon pour parcourir** (valeur à droite de chaque ligne : « 2 tailles », « 2 types », « Mer 50 km »), mais « 2 types » ne dit pas lesquels |
| **5. Toucher et cohérence** | Cibles 44 px de haut à 390 px. **Le plus fidèle au système** (Pastille partout). Pas de couleur de donnée | Cibles 44 px de haut, segments de Montagne de **55 px** de large. Deux usages hors contrat : un segmenté pour un choix multiple, et une case carrée qui n'est pas un composant du système. Pas de couleur de donnée | Lignes de 44 px (pas de 45). Un composant nouveau : une ligne dépliable à l'intérieur d'une Catégorie repliable, soit deux niveaux d'accordéon. Pas de couleur de donnée |

## Constats

### Bloquant
```
[Bloquant] B — le nom lu par l'outil d'accessibilité ne contient pas le texte affiché : « Dedans » s'affiche, « En montagne » est lu. Pareil pour les tailles : « < 10 000 » / « Moins de 10 000 hab. », « 10 – 50 000 » / « 10 000 – 50 000 hab. ». — Une personne qui pilote à la voix dit « Dedans » et rien ne se passe. Le texte affiché contredit aussi H69 (« En montagne ») et R27 (libellés des tailles).
  Où : ?variant=B, groupes « Montagne à moins de · km » et « Taille de la commune » ; 13 boutons dont le nom accessible (aria-label) diffère du texte affiché (mesuré)
  Correction : afficher les libellés de la spec. Coût mesuré : avec « En montagne » (≈ 98 px en pastille dans A) et « 10 km »… (59 px chacun), les 6 choix de Montagne ne tiennent plus dans 356 px (A : 504 px pour la rangée). Il faut garder les unités dans le sous-titre et retirer « km » des segments (décision pour Vincent, contraire à H69), ou accepter deux lignes.
  Réf : WCAG 2.2, 2.5.3 Libellé dans le nom (niveau A) ; H69, H76 (« chaque pastille porte son libellé visible »), R27
```
(Seuls les 2 cas de « 10 » / « 10 km » passent, le texte affiché étant contenu dans le nom. Le cas de « Dedans » à lui seul justifie Bloquant ; la correction est simple, mais elle casse la ligne unique de B pour la Montagne.)

### Majeur
```
[Majeur] A — la rangée qui défile de côté cache des choix, surtout en bureau : la barre de défilement est masquée et le panneau n'a que 338 px. — À la souris, on ne voit ni n'atteint « Plus de 200 000 hab. », « Petite ville », « Rural à habitat très dispersé » ni « 100 km » de la Mer, sauf en faisant défiler de côté au pavé tactile ou avec Maj + molette. Au téléphone, un choix coché peut sortir de l'écran.
  Où : ?variant=A, 1440 × 900 : Taille 338 / 605 px, Urbain 338 / 566, Rural 338 / 466, Mer 338 / 398, Montagne 338 / 504 ; barre de défilement masquée (scrollbar-width: none). Capture A-bureau : pastilles coupées au milieu (« 50 0 », « Rural à ha », « 1( »)
  Correction : laisser les pastilles passer à la ligne (flex-wrap) au lieu de défiler. Mesuré : Urbain tient sur 2 lignes (134 + 177 / 117 + 83), Rural aussi (87 + 154 / 177), Taille aussi (2 × 2).
  Réf : brief « Pas voulu : … qui cachent les choix », objectif 2 (« tient sur une ligne », pas « déborde d'une ligne ») ; heuristique « reconnaître plutôt que se souvenir »
```
```
[Majeur] B — la Taille, qui accepte plusieurs choix, utilise le même segmenté collé que la Mer et la Montagne, qui n'en acceptent qu'un. — L'utilisateur qui voit 4 segments collés comprend « un seul » et n'essaie pas d'en cocher deux. Seul un lecteur d'écran entend la différence (bouton à bascule contre bouton radio).
  Où : ?variant=B, « Taille de la commune · habitants » (4 segments de 88–89 px, aria-pressed) ; captures B-depart, B-bureau
  Correction : Taille en Pastilles à coche (comme le Type dans A et C), 2 × 2 avec les libellés de R27 (une ligne est impossible à 390 px : 549 px de libellés pour 358)
  Réf : objectif 3 ; contrat du système, « Segmenté d'unité » = deux choix exclusifs (Total / Au m²)
```
```
[Majeur] C — tous les choix sont cachés derrière des lignes à déplier, et un seul groupe s'ouvre à la fois (mesuré : en ouvrir un referme le précédent). — Chaque réglage demande 2 touchers au lieu d'un ; pour comparer Mer et Montagne, il faut ouvrir, fermer et rouvrir. C'est le « menu déroulant qui cache les choix » que le brief exclut, et le contraire de la référence Strava (des rangées de pastilles visibles).
  Où : ?variant=C, départ (C-depart : 4 lignes « Peu importe ») ; après le réglage d'exemple, seule « Montagne à moins de » est ouverte (aria-expanded mesuré)
  Correction : ne pas retenir l'accordéon comme structure ; garder seulement l'idée de la valeur à droite si un résumé par groupe paraît utile
  Réf : brief « Pas voulu », réf. 1 Strava, objectif 2 ; mots de Vincent : « les pastilles sur une ligne »
```

### Mineur
```
[Mineur] A et C — un choix unique et un choix multiple ne diffèrent que par la coche ✓, qui n'apparaît qu'une fois la pastille choisie. — Au repos, il faut lire ou essayer pour savoir. Mineur et non Majeur : « Peu importe », rempli d'office, laisse deviner qu'un seul choix est actif ; pas de mesure qui prouve l'échec.
  Où : A-choix, C-choix (« 50 km » sans coche, « ✓ Grand centre urbain »)
  Correction : un segmenté (B) ou un point radio pour Mer et Montagne   Réf : objectif 3
```
```
[Mineur] A et B (même code) — chaque bouton radio est un arrêt de tabulation (tabindex 0 partout) et la flèche droite ne déplace rien (mesuré sur A). — Au clavier, Montagne coûte 6 tabulations, et le comportement attendu d'un groupe radio est absent.
  Où : groupes « Mer à moins de », « Montagne à moins de »
  Correction : un seul arrêt par groupe, flèches pour changer (comportement standard d'un groupe radio)   Réf : WCAG 2.1.1 (respecté : tout reste atteignable, d'où Mineur) ; modèle ARIA « radio group »
```
```
[Mineur] C — les pastilles ouvertes ne sont dans aucun groupe nommé (aucun role="group" ni "radiogroup" trouvé pour Taille). — Le lecteur d'écran n'annonce ni « Taille de la commune » ni un groupe radio.
  Où : ?variant=C, Taille ouverte   Correction : groupes nommés de H76   Réf : H76 ; WCAG 1.3.1
```
```
[Mineur] B — en bureau (304 px), les segments de Montagne sont serrés au point que « Peu importe » et « Dedans » se touchent presque. — Lecture moins sûre.
  Où : B-bureau   Correction : celle de B1 (unités dans le sous-titre) ou deux lignes   Réf : objectif 5
```
```
[Mineur] A — les sous-groupes sont nommés « Type d'environnement · urbain » / « · rural » et non « Urbain » / « Rural » sous un groupe « Type d'environnement ». — Écart de texte avec H70 et H76.
  Où : ?variant=A   Correction : titres de H70   Réf : H70, H76
```

## Ce que chaque direction fait le mieux et le moins bien
- **A** — *Le mieux* : la plus fidèle au système (une seule Pastille, celle du contrat) et la plus proche de Strava par l'image. *Le moins bien* : la ligne unique est obtenue en cachant des choix ; en bureau, sans barre de défilement, c'est la plus mauvaise des trois pour trouver un choix.
- **B** — *Le mieux* : tout est visible d'un coup à 390 px sans geste, et c'est la seule où Mer et Montagne se lisent tout de suite comme « un seul choix ». *Le moins bien* : elle gagne sa compacité en raccourcissant les libellés (« Dedans », « < 10 000 », « 10 » sans km), ce qui contredit H69 et R27 et échoue au critère 2.5.3 ; et la Taille a la forme d'un choix unique.
- **C** — *Le mieux* : la plus courte à faire défiler (908 px) et la plus facile à parcourir, avec une valeur par groupe à droite. *Le moins bien* : elle cache tous les choix, demande deux touchers par réglage, et ne tient même pas l'objectif 2 une fois ouverte.

## Fusion proposée
**Base : B** pour sa structure (tout visible, pas de défilement de côté, pas d'accordéon, segmenté pour le choix unique). Elle seule tient les objectifs 2, 3 et 4 en même temps une fois ses deux erreurs corrigées. À prendre ailleurs :
1. **De A (et C)** : la Pastille à coche du contrat pour **Taille** et **Type**, à la place du segmenté de Taille et des cases carrées de B. Elles passent à la ligne au lieu de défiler. Hauteur mesurée : Type = 2 sous-titres + 4 rangées, comme les colonnes de B, sans composant nouveau ; Taille = 2 × 2 avec les libellés de R27.
2. **De B** : le segmenté pour **Mer** et **Montagne**, avec « En montagne » en toutes lettres. Une décision reste à Vincent, puisque les deux tiennent : (a) unités dans le sous-titre (« Mer à moins de · km ») et segments « 10 / 30 / 50 / 100 », ce qui contredit H69 ; ou (b) libellés de H69 avec « km », et la Montagne sur deux lignes à 390 px.
3. **De C** : rien pour l'état ouvert. Le résumé replié (H75) est déjà identique dans les trois directions (« 1 taille · 2 types · Mer 50 km · En montagne », mesuré).
4. Commun à corriger dans tous les cas : un arrêt de tabulation par groupe radio, avec les flèches.

## Ce qui marche
- Les trois tiennent l'objectif 1 de la même façon : le curseur du prix reste entier à 375 × 548 et « Cadre de vie » se découvre dessous.
- Cibles de 44 px de haut partout à 390 px ; aucune couleur de donnée sur un réglage ; résumé replié conforme à H75 dans les trois.

## Non jugé
- La carte ne se dessine pas dans le navigateur sans écran (WebGL : « La carte n'a pas pu se charger ») : effet des choix sur la carte non vu ; les captures fournies le montrent.
- Contrastes non mesurés (même palette du contrat dans les trois).
- Le prototype ne relit dans l'adresse que `mer` (`montagne`, `env` et `taille` sont absents de l'URL) : R31 non jugeable ici, et normal pour un prototype.
- Lecteur d'écran réel (VoiceOver) et iPhone réel non essayés : noms et rôles lus dans le DOM seulement.
- Texte très grand (zoom 200 %) non essayé ; il aggraverait surtout les segments de B.
