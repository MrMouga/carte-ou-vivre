# Détails — interface téléphone
Lire d'abord [spec.md](spec.md) (décisions D1 à D9). Tout ce qui suit vaut **sous 1 024 px de large** (H11 de loyer-mer) ; au-dessus, rien ne change (D1).

## Parcours
1. L'utilisateur ouvre la page sur son téléphone : la France entière, les communes qui passent colorées (D2) ; la feuille ouverte sur « Critères » (D3, D5).
2. Il règle un plafond : la carte se recolore au-dessus de la feuille ; le compte, en bas de l'onglet, suit.
3. Il replie la feuille (bouton ou glisser) : la carte prend l'écran sans bouger (D8), la barre garde le compte (D3, D4).
4. Il touche un rond du top 10 : la feuille s'ouvre sur la fiche (D6) ; « ← Les 10 premières » le mène à l'onglet de la liste.
5. Sur « Critères », il ajoute un proche : la feuille monte, le champ reste au-dessus du clavier, puis « Nom » et « Ajouter » (D7).

## Écrans et états
### Carte — route `/` · dans l'URL : rien de plus que loyer-mer (ni l'onglet, ni la position de la feuille)
Zones touchées : feuille — zone de prise (poignée et compte, qui forment le bouton « Replier la feuille », D9), onglets « Critères » et « Les 10 premières », contenu de l'onglet, fiche · barre repliée — poignée et texte, qui forment le bouton « Déplier la feuille » (D9) · messages posés sur la carte (H50). Les autres zones (carte, légende, zoom, repères, ronds) restent celles de loyer-mer et de proches.

États de la feuille (initial : **ouverte**, onglet **Critères**) :
- **ouverte · Critères** → zone de prise (poignée et compte, H43), les deux onglets (« Critères » sélectionné), puis titre, Loyer, Mer, Taille de ville, Tes proches, les mentions (H44) ; sort vers **ouverte · Les 10 premières** (onglet), **repliée** (bouton, glisser), **fiche** (rond ou commune touchés sur la carte), **ajout** (champ d'adresse).
- **ouverte · Les 10 premières** → zone de prise, onglets (« Les 10 premières » sélectionné), la liste de loyer-mer (compte, 1 à 10 lignes, ou ses messages vides), les mentions ; sort vers **ouverte · Critères**, **repliée**, **fiche**.
- **repliée** → une barre en bas (H48) : la poignée et le texte de la barre (R17), qui forment le bouton « Déplier la feuille » ; la carte occupe le reste de l'écran, sans avoir bougé (D8) ; sort vers **ouverte** sur le dernier onglet affiché (bouton, toucher n'importe où sur la barre, glisser vers le haut) ou vers **fiche** (rond ou commune touchés).
- **fiche** → la fiche de loyer-mer et proches, à la place des onglets et de leur contenu, avec « ← Les 10 premières » juste sous la poignée ; la zone de prise se réduit à la poignée (sans compte) et reste un bouton ; sort vers **ouverte · Les 10 premières** (retour), **repliée** (bouton, glisser ; la fiche reste choisie et revient au dépli).
- **ajout** (le champ « Adresse ou ville », « Nom » ou « Ajouter » a le focus) → la feuille monte comme aujourd'hui (H39 de proches) ; seule la poignée reste au-dessus du champ : ni onglets ni bouton de repli, pas de glisser ; le champ qui a le focus et ce qui le suit (suggestions, puis « Ajouter ») sont au-dessus du clavier (R20) ; sort vers **ouverte · Critères** quand le focus quitte l'ajout.
- **chargement** et **erreur** de la page → feuille ouverte sur « Critères », réglages inactifs comme aujourd'hui ; ni bouton de repli ni glisser tant que la page n'est pas prête ; sort vers **ouverte · Critères** quand la carte est prête.

Interactions : bouton ou toucher sur la barre → la feuille change de position en ≤ 300 ms (H45) · glisser la zone de prise ou la barre → la feuille suit le doigt, puis se pose sur une position au lâcher (H46) · onglet → contenu affiché en ≤ 100 ms · rond ou commune touchés → fiche, la carte zoome sur la commune (D14 de loyer-mer).

## Règles
- **R16** — Vue de départ (D2). Sous 1 024 px, téléphone tenu droit, à l'ouverture, la carte est cadrée sur la métropole avec la Corse, dans la bande au-dessus de la feuille ouverte, et les communes qui passent y sont peintes de leur couleur sans aucun zoom (sauf celles plus petites qu'un point, H14 de loyer-mer), pour toute fenêtre de 375 × 548 à 1 023 × 1 366. *Pourquoi* : voir D2 ; aujourd'hui, à 390 × 664, la carte s'ouvre à un zoom où rien n'est dessiné.
- **R17** — Feuille repliable (D3, D4, D8, D9). La zone de prise est un bouton (« Replier la feuille » ; repliée, la barre entière est « Déplier la feuille ») qui dit la position par son état « déplié » ; un toucher sur elle ou un glisser fait changer la position. La barre dit le compte de loyer-mer : « 3 communes passent tes critères », « 1 commune passe tes critères », « Aucune commune ne passe tes critères », et « Aucun plafond fixé » dans l'état **sans plafond** (H42) ; elle le suit quand il change, feuille repliée (un proche qui finit son calcul). *Pourquoi* : voir D3, D4, D8, D9.
- **R18** — Onglets (D5). « Critères » contient les réglages (loyer, mer, taille, proches) et le compte ; « Les 10 premières » contient la liste de R5. Un seul onglet affiché à la fois ; l'onglet choisi et la position de défilement de chacun survivent au changement d'onglet, au repli et au dépli. *Pourquoi* : voir D5 ; revenir à « Critères » après un coup d'œil à la liste ramène au réglage qu'on touchait.
- **R19** — Fiche (D6). Choisir une commune, sur la carte ou dans la liste, depuis n'importe quel état de la feuille, ouvre sa fiche à la place des onglets et ouvre la feuille si elle était repliée. « ← Les 10 premières » ferme la fiche, affiche l'onglet « Les 10 premières » (quel que soit l'onglet d'avant) et rend le focus à la ligne de la commune si elle y est (H16 de loyer-mer). *Pourquoi* : voir D6.
- **R20** — Ajout d'un proche au clavier (D7). Chaque fois que « Adresse ou ville » puis « Nom » prennent le focus (toucher, « + Ajouter un proche », ou choix d'une suggestion), le champ est déjà à sa place finale au moment du focus, sous la poignée, et ne bouge plus tant qu'il le garde. Dans une fenêtre de 390 × 664 dont le clavier couvre tout sous y = 342 : le champ d'adresse et sa première suggestion, puis « Nom » et « Ajouter », sont au-dessus de cette ligne. Sur l'iPhone de Vincent (Safari), ils restent visibles pendant toute la saisie. *Pourquoi* : voir D7 ; mesure du correctif précédent dans `docs/solutions/2026-10-13-ios-clavier-champ-deplace-apres-focus.md`.

## Cas limites
- Feuille repliée pendant qu'un proche finit son calcul → la barre passe au nouveau compte sans être dépliée (R17, AC-11).
- Fiche ouverte, feuille repliée, puis dépliée → la fiche revient, pas les onglets (R19, AC-6).
- Glisser commencé dans le contenu de la feuille (hors de la zone de prise) → c'est un défilement, pas un repli (H46, AC-3).
- Changer l'adresse de la page recharge la page : la feuille revient ouverte sur « Critères » (D3 ; la position n'est pas dans l'adresse).
- Aucune commune ne passe : feuille ouverte, le message de la bande de carte reste (H12 de loyer-mer) et le compte en tête de la feuille le dit aussi ; feuille repliée, seule la barre le dit (H50).
- Téléphone tenu à l'horizontale → mise en page téléphone, feuille repliable, sans garantie de R16 (hors tranche, spec.md).
- Largeur bureau (≥ 1 024 px) → ni onglets, ni bouton, ni barre ; réglages et liste côte à côte (AC-9).

## Impact sur les tranches existantes
| Tranche | Élément | Inchangée / Étendue / Contredite | Action |
|---|---|---|---|
| loyer-mer | Zone carte « cadrée au départ sur la métropole avec la Corse » ; R3 | Étendue | R16 : les communes sont dessinées à l'ouverture, à toute hauteur de téléphone tenu droit. |
| loyer-mer | H14 (communes plus petites qu'un point non colorées) | Étendue | Vaut aussi sous le zoom 4 ; le nombre de communes concernées au zoom de départ sur téléphone est mesuré en tâche 0 (risque 2 de spec.md). |
| loyer-mer | Feuille 390 px (design « 56 % de la hauteur », H11) ; D17 « à 390 px la fiche remplace les réglages » | Étendue | D3 à D6 : position repliée, onglets ; la fiche remplace désormais les onglets (le sens de D17 est gardé). |
| loyer-mer | H12 (mentions au bas de la feuille de la liste ; compte lu seulement aux lecteurs d'écran à 390 px ; message « Aucune commune » dans la bande) | Étendue | Remplacée par H43, H44 et H50 ici (une hypothèse change sans D-n) ; le message de la bande est gardé, feuille ouverte. |
| loyer-mer | États **chargement**, **erreur**, **fond indisponible**, R8 (messages posés sur la carte au-dessus de la feuille) | Étendue | H50 : au-dessus de la barre quand la feuille est repliée. |
| loyer-mer | R5, R6, H13, H16 (liste, rang, ronds regroupés, focus au retour) | Inchangée | À un zoom de départ plus bas, plus de ronds regroupés à l'ouverture : c'est H13 tel quel. |
| proches | H39 (feuille qui monte pour l'ajout ; défaut iPhone connu) | Étendue | R20 corrige le défaut et protège aussi « Nom » et « Ajouter » ; la montée de la feuille est gardée. AC-8 étend les tests du clavier de proches. |
| proches | D10 (pas de pastilles de temps à 390 px), AC-16 | Inchangée | — |
| CLAUDE.md | « Servies en tuiles vectorielles … zoom 4 à 11 » | Étendue | Un niveau de zoom de plus (D2) : la ligne est mise à jour au build. |
| tous | Bureau (≥ 1 024 px) | Inchangée | AC-9. |

## Ne change pas
Loyer-mer : AC-1 à AC-15. Proches : AC-1 à AC-11, AC-14, AC-16. Aux deux largeurs de test ; à 390 px, un test qui lisait la liste sous les réglages passe désormais par l'onglet « Les 10 premières » (la façon d'y aller change, pas le `given / when / then`).

## Hypothèses
- **H41** — Les AC de cette tranche à 390 px se jouent au toucher, à 390 × 844 (largeur de test du projet), et à 390 × 664 et 375 × 548 (fenêtres de Safari sur iPhone) pour R16 et R20. *Pourquoi* : le défaut de R16 n'apparaît pas à 844 px de haut ; un glisser à la souris ne fait pas défiler.
- **H42** — Texte de la barre dans l'état **sans plafond** : « Aucun plafond fixé ». *Pourquoi* : la phrase de la liste (« Fixe un loyer ou une distance à la mer… ») est trop longue pour une barre.
- **H43** — *Révisée par D9.* Le compte est en tête de la feuille, sous la poignée, en style `valeur` (une seule taille pour toute la phrase, une ligne), sur les deux onglets ; il est annoncé aux lecteurs d'écran ; dans l'état **sans plafond**, il dit « Aucun plafond fixé » (H42). Il disparaît quand une fiche est ouverte. *Pourquoi* : on voit l'effet d'un réglage sans changer d'onglet ni défiler.
- **H44** — Les mentions sont au bas de chacun des deux onglets ; pas sous une fiche (comme aujourd'hui, H12 de loyer-mer). *Pourquoi* : obligatoires, joignables depuis l'onglet affiché au départ.
- **H45** — Passage d'une position à l'autre en ≤ 300 ms, sans animation si l'on réduit les animations. *Pourquoi* : la durée habituelle d'une feuille ; la règle « réduire les animations » du projet.
- **H46** — *Révisée par D9.* Zone de prise : la poignée et le compte en haut de la feuille ouverte (≈ 49 px), qui forment le bouton « Replier la feuille » ; feuille repliée, toute la barre. Un déplacement de moins de 10 px est un toucher ; au-delà, la feuille suit le doigt ; au lâcher, elle change de position si elle a été déplacée de plus de 80 px, sinon elle revient. Pas de règle de vitesse. *Pourquoi* : éviter le conflit avec le défilement et les onglets (D4) ; un seuil simple à tester.
- **H47** — Les onglets suivent le motif « onglets » des lecteurs d'écran (liste d'onglets, flèches gauche et droite au clavier) ; le bouton de repli porte son état « déplié ». Replier ne déplace pas le focus ; un élément focalisé qui disparaît au repli rend le focus au bouton « Déplier la feuille ». *Pourquoi* : accessibilité de base du projet.
- **H48** — *Révisée par D9.* Barre repliée : au plus 64 px de haut (poignée et une ligne de texte, toute la barre est le bouton, ≈ 49 px), au-dessus de la marge du bas de l'écran (zone du geste d'accueil de l'iPhone, ≈ 34 px), qui s'y ajoute. Feuille ouverte : 45 % de la hauteur, au moins 272 px (D9), pour que le curseur du loyer soit visible à 375 × 548. *Pourquoi* : D3, « une barre fine », et des cibles d'au moins 44 px au toucher.
- **H49** — La légende et les boutons de zoom gardent leur place en haut de la carte, feuille ouverte ou repliée ; ils restent cachés pendant l'ajout (H39 de proches). *Pourquoi* : rien ne les gêne en haut.
- **H50** — Les messages posés sur la carte (« Chargement de la carte… », « Fond de carte indisponible ») se placent juste au-dessus de la feuille, ouverte ou repliée ; le message de la bande « Aucune commune ne passe tes critères » est caché quand la feuille est repliée, puisque la barre le dit. *Pourquoi* : un message ne flotte pas au milieu de l'écran ; une seule annonce à la fois.

## Exceptions
Aucune.

## Vérification de bout en bout
Sur une version construite servie au Mac par le Wi-Fi (D10 ; la version en ligne est vérifiée à /ship), sur l'iPhone de Vincent (Safari) tenu droit, puis à 390 × 664 dans le navigateur de test :
1. Ouvrir `/` : la France entière, les communes de la côte vertes sans zoomer ; feuille ouverte sur « Critères ».
2. « Replier la feuille » : la barre dit « … communes passent tes critères », la carte ne bouge pas ; glisser la barre vers le haut : la feuille revient sur « Critères ».
3. Toucher « Les 10 premières » : la liste ; toucher le rond « 1 » sur la carte : la fiche ; « ← Les 10 premières » : la liste.
4. Revenir à « Critères », « + Ajouter un proche », taper « 12 rue de la Paix Nantes » : le champ et les suggestions restent visibles au-dessus du clavier ; choisir une suggestion : « Nom » et « Ajouter » restent visibles ; « Ajouter » : le proche se calcule.
Preuves : captures d'écran de l'iPhone aux étapes 1, 2, 3 et 4 (clavier ouvert, au champ d'adresse puis à « Nom ») ; capture à 390 × 664 de l'étape 1, communes de la côte peintes.
