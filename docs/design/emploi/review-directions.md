# Relecture des pistes — emploi (comparaison à l'aveugle)
Statut : terminé
2026-11-21 · Mode : directions · Pistes A, B, C · Grille : [brief](brief.md) · Spec : [emploi](../../specs/2026-11-21-emploi/spec.md) · Contrat : [système](../system/README.md)

Ce que j'ai regardé : les 30 captures de `directions/`, puis le prototype (http://localhost:5174/?variant=A|B|C), à 390 × 844 et à 1440 × 900. J'y ai mesuré les hauteurs, les rôles, les noms accessibles et `aria-pressed`, essayé le clavier, le cas « xyz » (pas de résultat) et la case cochée qu'on décoche. Les trois pistes ont le même degré de finition : je n'ai rien eu à corriger pour ça.

## Mesures (prototype)

| | A | B | C |
|---|---|---|---|
| Niveaux | Cases collées (le composant de la mer), 3 colonnes de 118 × 44 à 390 px ; 2 lignes pour « Partout où il recrute » à 340 px | Pastilles avec coche : 52 / 52 / 134 × 44 à 390 px, 28 px de haut en bureau ; « 10 % » passe à 70 px de large une fois coché (la rangée se décale de 18 px) | Liste verticale avec des ronds de bouton radio, 330 × 44 à 390 px, 278 × 28 en bureau ; ce sont des boutons `aria-pressed` habillés en radios |
| « Retirer » | Lien texte 45 × 44, **sous** les niveaux | Croix « × » dans le cartouche du métier, 44 × 44 au téléphone, 24 × 24 en bureau ; nom accessible « Retirer <libellé> », **sans le mot visible** | Lien texte en haut à droite de la carte « MÉTIER 1 », 45 × 44 |
| Hauteur de « Emploi » ouverte, à 390 px : un métier / deux métiers (du titre à « Tes proches ») | 310 / 447 px | **289 / 398 px** | 430 / **674 px** |
| Hauteur à 1440 px, un métier | non mesurée (environ 260 px d'après la capture) | 217 px | 341 px |
| Phrase sur l'État (D13) | Sous le champ, `secondaire` | Sous le champ, avec une icône (i) | **Au-dessus** du champ |
| Fiche (R47) | Lignes simples | Sous-titre « EMPLOI » ajouté avant les lignes | Libellé du métier en gras |

Pour comparer : à 390 px, la feuille ouverte fait max(45 dvh, 338 px), soit environ 380 px de haut. Avec deux métiers, « Emploi » occupe donc 1,2 hauteur de feuille dans A, 1,05 dans B et 1,8 dans C.

## Tableau critère × piste

| Critère de la grille | A | B | C |
|---|---|---|---|
| **1. Trouver son métier sans connaître la nomenclature** | **Sert.** Même champ et mêmes suggestions dans les trois (« dévelop » → les ingénieurs en informatique d'abord, `A-cat-suggestions`) ; flèches et Entrée marchent ; « Aucun métier trouvé » s'affiche pour « xyz » ; texte du champ à 16 px à 390 px. | **Sert**, à l'identique. | **Sert**, à l'identique ; mais la phrase sur l'État placée au-dessus descend le champ d'environ 60 px (`C-cat-depart`). |
| **2. Un libellé de 130 caractères ne casse rien** | **Sert.** Libellé `texte-fort` sur 2 lignes à 390 px et 3 lignes à 340 px, filet entre les deux métiers (`A-cat-deux`, `A-deux-1440x900`). Seule faiblesse : « Retirer » flotte sous les niveaux et ne se lit pas avec le libellé (voir Mineur 1). | **Sert.** Libellé sur 3 lignes dans un cartouche, croix centrée à droite (`B-cat-deux`). Le cartouche de 3 lignes ressemble à une étiquette qu'on touche. | **Sert.** Libellé sur 2 lignes dans une carte, « Retirer » sur la ligne de titre de la carte : c'est le bloc le plus lisible comme un tout (`C-cat-deux`). |
| **3. Le même geste que la mer** (un niveau ou aucun, la case cochée se décoche, 44 px) | **Sert.** C'est exactement le composant Cases collées de la mer (« choix unique ou aucun », contrat du système), en 44 px. On décoche d'un toucher. | **Sert en partie.** 44 px et décochable, mais c'est l'aspect des pastilles à coche, celles des groupes qui acceptent plusieurs choix (voir Majeur B1) ; la rangée se décale quand on coche. | **Ne sert pas.** Les ronds de radio disent « il en faut toujours un, on ne peut pas décocher ». Le code décoche bien (vérifié : `aria-pressed` repasse à `false`), mais le dessin dit le contraire. C'est aussi un composant absent du système (voir Majeur C1). |
| … rien coché = pas de filtre | **Ne sert pas** (pareil dans les trois) : aucun indice, le compte reste à 34 674 (voir Majeur commun 2). | **Ne sert pas.** | **Ne sert pas.** |
| **4. Deux métiers sans confusion** | **Sert.** Filet de séparation, même schéma répété ; chaque niveau est sous son libellé. | **Sert.** Chaque cartouche fait office de titre ; l'écart avant le second cartouche (environ 30 px) est un peu juste mais suffit. | **Sert le mieux.** Cartes « MÉTIER 1 » et « MÉTIER 2 », avec « Retirer » dans l'en-tête de chacune. |
| **5. Honnête et court** (phrase sur l'État visible sans prendre de place, aucun mot interdit par D6, « Tes proches » pas trop loin, H48) | **Sert.** 447 px avec deux métiers. Phrase discrète, sous le champ comme le veut R44. Aucun « offres ». | **Sert le mieux.** 398 px avec deux métiers, la piste la plus courte. L'icône (i) donne un peu plus de poids à la phrase, sans gêner. | **Ne sert pas.** 674 px avec deux métiers (+ 51 % par rapport à A, + 69 % par rapport à B) ; les cartes beiges dans le panneau mettent la catégorie en avant (« Pas voulu » du brief) ; la phrase est au-dessus du champ alors que R44 dit « Sous le champ, toujours ». |
| H48 (curseur du prix visible à 375 × 548) | « Emploi » vient après « Vie locale », loin sous le prix, dans les trois pistes : non concerné. | idem | idem |

## Défauts classés par gravité

### Communs aux trois pistes (à régler à la convergence, ils ne départagent pas les pistes)
- **[Majeur] Le focus clavier est perdu après le choix d'une suggestion.** Un utilisateur au clavier se retrouve au début de la page et doit tout reparcourir pour atteindre les niveaux.
  Où : A, B et C, flèche bas puis Entrée sur « Infirmiers et sages-femmes » ; mesure : `document.activeElement` vaut `BODY` dans les trois pistes.
  Correction : après le choix, mettre le focus sur la première case de niveau du métier ajouté. Après « Retirer », le mettre sur le champ ou sur le métier restant.
  Réf : WCAG 2.4.3 (ordre du focus) ; H133 (« comme la recherche d'adresse des proches »).
- **[Majeur] Rien ne dit qu'un métier sans niveau coché ne filtre pas.** Après le choix, la carte ne bouge pas (parcours, étape 2) : rien n'empêche de croire qu'elle montre déjà où le métier recrute.
  Où : `A-un`, `B-un`, `C-un` avant de cocher un niveau ; le compte reste à 34 674.
  Correction : soit le titre du groupe porte la consigne (« Où ce métier recrute le plus : coche un niveau pour filtrer »), soit une ligne `secondaire` sous les cases, visible seulement tant qu'aucun niveau n'est coché. À valider par Vincent, puisque D12 a écarté une phrase sous les pastilles (pour un autre cas).
  Réf : critère 3 de la grille (« on comprend que rien coché = pas de filtre ») ; D5 ; AC-1.
- **[Mineur] Les deux groupes de niveaux ont le même nom accessible**, « Où ce métier recrute le plus ». Avec deux métiers, un lecteur d'écran qui arrive dans le second groupe n'entend pas de quel métier il s'agit. C'est Mineur et non Majeur : le bouton qui précède (« Retirer <libellé> ») donne le contexte.
  Correction : `aria-labelledby` = titre + libellé du métier, sans toucher au titre visible.
  Réf : WCAG 2.4.6 ; H131 ; critère 4.
- **[Mineur] Coupures de ligne dans la fiche** : « · 74 » en fin de ligne, puis « recrutements » à la ligne ; « (2e » puis « trimestre 2026) ».
  Où : `*-fiche-390x844`.
  Correction : espaces insécables entre le nombre et son nom, comme le contrat le demande déjà pour les résumés.
- **Non jugé, mais à surveiller :** pendant la saisie, le champ est à y = 812 (44 px de haut, fenêtre de 844 px). Le prototype ne fait pas monter la feuille (R20). AC-13 se jouera au montage, sur l'iPhone.

### Piste A
- **[Mineur 1] « Retirer » flotte sous les niveaux.** Collé sous « 10 % / 25 % / Partout… », il peut se lire « retirer le niveau » plutôt que « retirer le métier ». En plus, « Retirer » et « + Ajouter un second métier » sont deux liens nus séparés de 56 px, ce qui rallonge le bloc. C'est Mineur : le nom accessible est juste, et le geste se comprend à l'essai.
  Où : `A-un-390x844`, `A-cat-deux`.
  Correction : mettre « Retirer » sur la ligne du libellé, aligné à droite (comme l'en-tête de C, et comme « l'action à droite » de la Catégorie repliable). On gagne environ 50 px par métier.
  Réf : critère 2 (« Retirer » lisible avec le métier).

### Piste B
- **[Majeur B1] Le niveau unique a l'aspect d'un choix multiple.** Des pastilles séparées avec une coche, c'est l'aspect des groupes à plusieurs choix (« Taille », « Type d'environnement »). Le contrat réserve les Cases collées au choix « unique ou aucun » (mer, montagne). On peut s'attendre à cocher « 10 % » et « 25 % » ensemble, et le geste n'est plus celui de la mer.
  Où : `B-un-390x844`, `B-cat-deux`. Mesure : « 10 % » passe de 52 à 70 px une fois coché, ce qui décale les autres de 18 px.
  Correction : reprendre les Cases collées de A.
  Réf : critère 3 ; contrat, lignes « Cases collées » et « Cases séparées » ; D12 de cadre-de-vie.
- **[Mineur] Le mot « Retirer » est remplacé par une croix.** H130 fixe l'action « Retirer » ; le nom accessible la garde, donc AC-3 passe, mais la croix seule est moins claire. Elle fait aussi 24 × 24 en bureau, au plancher exact de la cible minimale.
  Correction : garder le mot « Retirer » visible.
- **[Mineur] Sous-titre « EMPLOI » ajouté dans la fiche.** R47 place les lignes directement sous « Mairie », sans titre. Ce n'est pas faux et c'est lisible, mais c'est un écart à faire valider.
  Où : `B-fiche-390x844`.

### Piste C
- **[Majeur C1] Des ronds de radio pour un choix qu'on peut vider.** Partout, un radio se lit « un choix obligatoire, qu'on ne peut pas retirer ». Personne n'aura l'idée de retoucher « 10 % » pour revenir à « peu importe ». Le lecteur d'écran, lui, annonce un bouton à bascule : l'image et ce qui est annoncé se contredisent. C'est aussi un composant nouveau, alors que le brief dit que « les composants du système suffisent ».
  Où : `C-un-390x844`, `C-cat-deux`, `C-deux-1440x900`. Vérifié : le second toucher remet `aria-pressed` à `false`, mais rien à l'écran ne l'annonce.
  Correction : les Cases collées de A.
  Réf : critère 3 ; contrat, « Cases collées » ; D12 de cadre-de-vie ; WCAG 1.3.1 (le rendu ne correspond pas au rôle annoncé ; en soi, ce n'est pas un échec du critère).
- **[Majeur C2] Avec deux métiers, « Emploi » fait 674 px à 390 px**, soit 1,8 hauteur de feuille. « Tes proches », le critère phare du produit, passe à près de deux écrans de feuille plus bas. Les cartes beiges imbriquées dans le panneau mettent la catégorie en avant.
  Où : mesure dans le prototype (titre « Emploi » à y = 307, « Tes proches » à y = 981), `C-cat-deux`.
  Correction : supprimer la carte et la liste verticale ; garder seulement l'en-tête « libellé + Retirer ».
  Réf : critère 5 (« ne repousse pas Tes proches trop loin ») ; « Pas voulu » du brief (« mise en avant de la catégorie ») ; ressenti « un critère parmi d'autres ».
- **[Mineur] La phrase sur l'État est au-dessus du champ.** R44 et D13 disent « Sous le champ, toujours ». C'est Mineur parce que l'utilisateur n'y perd rien (il la lit même avant de taper), mais c'est un écart au texte de la spec. Autre effet : une fois la feuille montée pour la saisie (R20), la phrase sortira de l'écran.
  Où : `C-cat-depart-390x844`.
  Correction : la remettre sous le champ, ou faire amender R44 par Vincent.

## Ce que chaque piste fait de mieux
- **A** : le seul contrôle de niveaux fidèle au système et au geste de la mer (Cases collées, 44 px, on décoche d'un toucher) ; un filet sobre entre deux métiers ; « encre et papier », comme le reste du panneau.
- **B** : la plus courte (289 / 398 px) ; le libellé choisi forme un bloc net qui « tient » le métier.
- **C** : le meilleur rattachement de « Retirer » au métier (sur la ligne de titre, à droite) ; le libellé en gras dans la fiche, qui aide à parcourir une ligne de 130 caractères.

## Préférence et fusion proposée
**Base : A.** Ce qui décide, c'est le critère 3. A est la seule piste qui reprend tel quel le composant de la mer (« choix unique ou aucun »). B suggère un choix multiple, C un choix obligatoire. Les défauts de A tiennent à la mise en page ; ceux de B et C touchent à ce que le contrôle veut dire.

À reprendre des autres pistes :
1. **De C : « Retirer » sur la ligne du libellé, aligné à droite** (libellé `texte-fort` à gauche, sur plusieurs lignes si besoin ; « Retirer » en haut à droite, 44 px de haut à 390 px). Sans la carte beige ni le surtitre « MÉTIER 1 ». On supprime ainsi la ligne « Retirer » flottante de A : environ 50 px gagnés par métier, ce qui ramène deux métiers vers 350 px, au niveau de B.
2. **De C : le libellé du métier en `texte-fort` dans la fiche**, puis « : » et le reste en `texte`.
3. **De B : rien sur les contrôles.** On peut garder l'idée d'un bloc compact. L'icône (i) devant la phrase sur l'État est un détail de goût, laissé à Vincent.
4. **À ajouter dans les trois cas** : focus sur la première case de niveau après un choix ; un indice « pas encore de filtre » tant qu'aucun niveau n'est coché (à valider par Vincent, voir D12) ; un nom de groupe qui inclut le libellé ; des espaces insécables dans la fiche.

## Non jugé
- **Le clavier de l'iPhone et la montée de la feuille (R20, AC-13)** : le prototype ne fait pas monter la feuille ; à vérifier au montage, sur l'iPhone de Vincent.
- **La couleur de la carte et le filtre** : rien ne filtre dans le prototype, et la carte (WebGL) ne s'affiche pas sans écran.
- **Le résumé de la catégorie repliée** (« Peu importe », « 1 métier », « 2 métiers ») : non ouvert dans le prototype, faute de budget ; aucune piste ne le montre en capture.
- **Échap sur « Second métier » (H145)**, la largeur de 375 px pour la 3e case de A (« Partout où il recrute » passera probablement sur 2 lignes, ce que le contrat permet) et la piste A en bureau : non mesurés.
- **Les 8 suggestions de 2 à 3 lignes chacune** : jamais affichées. Elles poussent la phrase sur l'État hors de l'écran dans A et B : à vérifier au montage.
