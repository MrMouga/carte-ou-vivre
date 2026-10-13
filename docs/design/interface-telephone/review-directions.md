# Relecture à l'aveugle des directions — interface téléphone
2026-10-13 · relecteur neuf (design-reviewer), mode `directions` · Brief : [brief.md](brief.md) · Spec : [spec.md](../../specs/2026-10-13-interface-telephone/spec.md), [details.md](../../specs/2026-10-13-interface-telephone/details.md)

## Ce que j'ai regardé
- Les 12 captures `directions/{A,B,C}-{criteres,liste,repliee,fiche}.png` (390 × 664, échelle 2).
- Le prototype `http://localhost:5174/?variant=A|B|C&loyer=1200&mer=60`, mesuré dans le navigateur de test à **390 × 664** et à **375 × 548** (la plus petite fenêtre de R16 et H41) : position de la feuille, du premier curseur, des onglets, du compte ; repli au bouton, réouverture en touchant la barre, fiche ouverte depuis la liste, retour. Mesures en px CSS.
- Le code de la feuille du prototype (`src/ui/FeuilleMobile.tsx`, `src/App.tsx`), seulement pour savoir où commence le glisser et ce qui est annoncé.
- Même finition pour les trois : aucune n'est visiblement plus soignée, je ne retire rien à personne pour ça.

## Les mesures qui tranchent

| | A | B | C |
|---|---|---|---|
| Hauteur de la feuille ouverte | 56 % (jeton `part-feuille`) | 52 % (valeur en dur), feuille posée à 8 px des bords | 45 % (valeur en dur) |
| Haut de la feuille à 390 × 664 (= bande de carte) | 292 px | 311 px | **365 px** |
| Premier curseur (Loyer) à 390 × 664 | y 538–556, visible | y 521–539, visible | y 611–629, visible |
| Haut de la feuille à 375 × 548 | 241 px | 255 px | **301 px** |
| Premier curseur à 375 × 548 | y 487–505, mord de 3 px sous le compte collé (502) | y 465–483, visible (compte à 494) | **y 547–565 : hors écran** (seuls « Loyer maximum » et « 1 200 € » se voient) |
| Zone de prise (poignée + rangée) | 56 px pleine largeur ; rangée = chevron seul à droite | 64 px ; rangée = onglets compacts + chevron | 56 px pleine largeur ; rangée = compte + chevron |
| Onglets | pleine largeur, 173 × 28 | compacts, 74 × 28 et 132 × 28, dans une pilule plus large qu'eux | pleine largeur, 173 × 28 |
| Où est le compte dans « Critères » | collé en bas, `role="status"` | collé en bas, `role="status"` | dans la zone de prise, **sans `role="status"`** ; plus de compte en bas |
| Barre repliée | 390 × 56, poignée, compte centré, chevron | pilule flottante 303 × 52 à 16 px du bas, **sans poignée** | 390 × 56, poignée, la même ligne de compte que la feuille ouverte |
| Fiche | feuille à 368 (descend de 76 px), rangée vide avec le chevron, « ← Les 10 premières » 110 × 24 | idem (352), 110 × 24 | idem (368), 110 × 24 ; le compte disparaît de la zone de prise |

## Direction par direction, contre la grille

### A — feuille haute, chevron sur sa propre rangée
1. **Voir le vert** : le moins bien servi. Bande de 292 px (44 % de l'écran) : la France fait environ 235 px de large sur la capture `A-criteres`, les noms de villes ne s'affichent pas. Le premier curseur reste visible, mais à 375 × 548 il passe déjà sous le compte collé (3 px).
2. **Libérer la carte / la retrouver** : bien servi. La zone de prise est exactement celle de H46 (une bande pleine largeur, poignée et bouton, rien d'autre à toucher dedans) ; la barre repliée est celle de R1 et R2 (poignée, compte centré, une ligne, 56 px ≤ 64 de H48). Coût : la rangée du chevron ne porte rien d'autre et prend 44 px de hauteur, qui sont retirés à la carte.
3. **Des critères au résultat** : le mieux servi tel que la spec l'écrit. Onglets pleine largeur bien lisibles ; compte collé en bas et annoncé (`role="status"`), conforme à H43.
4. **Lire une commune** : comme les autres (voir « Commun »).
5. **Ajout au clavier** : comme les autres (même code : poignée seule).
**Réfutation** : A ne gagne aucun objectif à lui seul. Il est conforme mais dépense 44 px pour un chevron seul alors que l'objectif 1 dit « plus basse, mieux c'est ».

### B — feuille posée, onglets et chevron sur une seule rangée, barre en pilule
1. **Voir le vert** : moyen, mais **le meilleur compromis aux deux hauteurs** : 311 px de bande à 664, 255 px à 548, et le premier curseur reste visible avec de la marge dans les deux cas. Les 8 px de carte sur les côtés de la feuille ne servent pas la lecture.
2. **Libérer la carte / la retrouver** : le moins bien servi.
   - [Majeur] **La barre repliée n'a pas de poignée** (mesuré : aucun élément poignée dans la barre). La spec la demande (details.md, état **repliée** : « la poignée, le texte de la barre, le bouton ») et le brief aussi (R1 « poignée et compte centré »). Sans poignée, rien n'indique qu'on peut glisser la barre vers le haut (D4) : seul le toucher se devine. Preuve : texte de l'état **repliée**, objectif 2 de la grille.
   - [Mineur] Les onglets sont dans la zone de prise, alors que H46 la limite à « la poignée et le bouton » *pour éviter le conflit avec les onglets*. Un glisser commencé sur un onglet est ignoré ; un glisser commencé dans le vide de la pilule, à droite de « Les 10 premières » (≈ 92 px de large), replie la feuille alors que ce vide a l'air de faire partie des onglets. Mineur : la bande du haut (24 px pleine largeur) reste prenable.
   - [Mineur] La pilule flottante est l'habillage des applications de cartes que le ressenti dit de ne pas copier.
3. **Des critères au résultat** : moins bien que A. Les onglets compacts (74 et 132 px de large) se lisent moins comme un choix entre deux vues que des onglets pleine largeur. Le compte est en bas et annoncé, comme dans A.
4 et 5 : comme les autres.
**Réfutation** : sa seule idée qui gagne de la place (onglets et chevron sur la même rangée) va contre H46 ; sa barre repliée s'éloigne de la spec et des références.

### C — le compte dans la zone de prise, la barre repliée = le haut de la feuille
1. **Voir le vert** : le mieux servi à 390 × 664. Bande de 365 px (55 %), soit 73 px de plus que A ; la France fait environ 295 px de large (≈ 25 % de plus que A) et les villes sont nommées (Paris, Nantes, Bordeaux…), ce qui aide à se repérer.
   - [Majeur] **À 375 × 548, le premier réglage sort de l'écran** : le curseur du loyer commence à y = 547 sur 548. L'objectif 1 dit « tant que le premier réglage reste visible », et R16 vaut « pour toute fenêtre de 375 × 548 à 1 023 × 1 366 ». Une hauteur fixe de 45 % ne tient pas à la plus petite fenêtre. Correction : une hauteur avec un plancher (ex. la plus grande de 45 % et de ≈ 272 px, ce qui met le curseur au-dessus du bas avec 8 px de marge), en jeton ; à 548 px de haut, la bande serait encore de ≈ 276 px, plus que A (241) et B (255).
2. **Libérer la carte / la retrouver** : le mieux servi. La rangée de la zone de prise porte le compte et le chevron ; repliée, c'est **exactement la même ligne qui reste** (même texte, même place sous la poignée). On comprend que replier, c'est cacher ce qui est sous le compte, et on retrouve la feuille par ce qu'on voyait déjà. Zone de prise pleine largeur de 56 px, sans onglet dedans (conforme à H46 dans l'esprit : poignée, bouton, et un texte qui ne se touche pas). Barre de 56 px ≤ 64 (H48), avec poignée.
3. **Des critères au résultat** : fort sur le fond, faible tel que prototypé.
   - Le compte est visible au-dessus des deux onglets et de la barre : on voit l'effet d'un réglage sans changer d'onglet (le *pourquoi* de H43), et on ne cherche jamais le compte.
   - [Majeur] **Le compte de C n'est plus annoncé** : dans A et B il porte `role="status"` ; dans C, aucun élément de la feuille n'en porte (mesuré dans les trois états). La règle du projet demande des « messages d'état annoncés » (WCAG 4.1.3) : un lecteur d'écran qui bouge le curseur n'entend plus le résultat. Correction : `role="status"` sur la ligne de compte de la zone de prise.
   - [Mineur] Dans « Les 10 premières », le compte est écrit deux fois (dans la zone de prise et en tête de la liste, capture `C-liste`). Retirer celui de la liste.
   - [Mineur] C change deux textes de la spec sans le dire : H43 (« le compte est écrit en bas ») et le cas limite « Aucune commune ne passe : feuille ouverte, le message de la bande de carte reste » (le prototype C le cache). Ce sont des hypothèses, qui changent sans D-n, mais il faut les réécrire dans details.md si C est retenu.
   - [Mineur] Le nombre est en Source Serif 4 au style `marque`, que le contrat réserve à la marque ; le brief met les chiffres en Source Sans 3 tabulaires. Choisir : un style de texte nommé pour ce compte (à ajouter au contrat), ou `valeur` en Sans 3.
4. **Lire une commune** : comme les autres ; le compte disparaît de la zone de prise quand la fiche s'ouvre, ce qui est cohérent (la fiche dit « 1re sur 8 046 communes qui passent »).
5. **Ajout au clavier** : comme les autres.
**Réfutation** : son avantage de l'objectif 1 tombe à la plus petite fenêtre (corrigeable par un plancher) ; son compte est muet aux lecteurs d'écran (corrigeable en une ligne). Rien de structurel ne la contredit.

## Ce que les trois partagent (à corriger quelle que soit la base)
- [Majeur] **Replier perd le focus** : après « Replier la feuille », le focus est sur `BODY` dans A, B et C (mesuré). H47 : « Replier ne déplace pas le focus ; un élément focalisé qui disparaît au repli rend le focus au bouton « Déplier la feuille » » ; WCAG 2.4.3. Cause : la barre repliée est un autre élément que la feuille ouverte. Correction : un seul bouton qui reste monté et change d'état, ou un focus rendu explicitement.
- [Majeur] **Onglets de 28 px de haut** (mesuré, jeton `taille-pastille`) alors que le brief et le contrat demandent 44 px au toucher (« cibles de 44 px au toucher », README « 44 px au toucher »). Passe WCAG 2.5.8 (24 px), d'où Majeur et pas Bloquant. Correction : `min-h-toucher` sur les onglets à 390 px.
- [Mineur] La fiche garde une rangée de 44 px qui ne porte que le chevron, et « ← Les 10 premières » fait 110 × 24 en dessous. Mettre le lien à gauche dans la rangée du chevron (comme C y met le compte) rend 44 px à la fiche et donne au lien une cible de 44 px.
- [Mineur] Le compte de la barre repliée n'est annoncé dans aucune direction ; R17 veut qu'il suive les changements feuille repliée (un proche qui finit son calcul). Même correction que pour C : la ligne de compte reste `role="status"` dans la barre.
- [Mineur] Le contenu des onglets est démonté au repli : la position de défilement ne survivra pas au repli, contrairement à R18. Simplification de prototype ; à garder en tête au build.
- [Mineur] Flèches gauche et droite : l'onglet change mais le focus reste sur l'ancien, et les deux onglets sont dans l'ordre de tabulation ; le motif « onglets » de H47 veut le focus qui suit et un seul onglet tabulable.
- Hors tranche, pour mémoire : la légende et les ronds groupés couvrent la côte de la Manche dans les trois ; plus la bande est petite, plus ils pèsent.

## Recommandation
**Base : C**, parce qu'elle gagne les deux objectifs que la tranche existe pour servir — voir le vert (bande la plus haute) et libérer puis retrouver la carte (la barre repliée est le haut de la feuille, rien à réapprendre) — et que ses deux défauts sérieux se corrigent sans toucher à la structure.

À prendre ou corriger pour la fusion :
1. **De C** : la ligne de compte dans la zone de prise, identique ouverte et repliée ; les onglets pleine largeur sous cette ligne ; la bande de carte haute.
2. **Corriger C** : hauteur de la feuille avec un plancher (le premier curseur visible à 375 × 548), en jeton à la place de `h-[45dvh]` ; `role="status"` sur la ligne de compte, ouverte et repliée ; retirer le compte en double de l'onglet « Les 10 premières » ; un style de texte du contrat pour le nombre ; réécrire H43 et le cas limite « Aucune commune » dans details.md.
3. **De A** : la discipline de la zone de prise (pleine largeur, rien de touchable dedans à part le bouton) et la barre repliée pleine largeur de R1 et R2, que C reprend déjà.
4. **De B** : rien de structurel. Sa leçon est en creux : à 375 × 548, seule B garde le premier curseur visible avec de la marge, ce qui fixe le plancher que C doit tenir. Ne pas reprendre la pilule flottante sans poignée ni les onglets dans la zone de prise.
5. **Pour les trois** : focus rendu au bouton au repli, onglets de 44 px, lien de retour de la fiche dans la rangée du chevron.

## Ce qui marche
- Les trois tiennent D3 et D8 proprement : feuille ouverte sur « Critères » au départ, carte immobile au repli (captures « repliée » : la France ne bouge pas).
- Les trois font revenir la fiche, les onglets en pilule à l'encre (`primary`) sur fond `background` sans nouvelle couleur, comme le brief le demande.
- C trouve la seule idée vraiment neuve des trois : un objet unique (la ligne de compte) qui fait le lien entre la feuille ouverte, la barre repliée et le résultat des réglages.

## Non jugé
- **Le glisser au doigt** : le navigateur de test ne fait pas de glisser tactile ; jugé sur le code (seuils 10 px et 80 px de H46, identiques dans les trois) et sur la composition de la zone de prise.
- **Le mouvement** (≤ 300 ms, H45) : dans le prototype, ouverte et repliée sont deux éléments différents, le passage saute sans animation dans les trois ; rien à comparer.
- **Objectif 5 (ajout au clavier)** : même code dans les trois (poignée seule, pas d'onglets ni de bouton) ; non différenciant, et le clavier de l'iPhone ne se reproduit pas ici.
- **États chargement, erreur, vide, sans plafond** : pas fournis en capture ; seul l'état erreur a été vu par accident (sans WebGL), où le bouton de repli est bien masqué dans C.
- Les mesures à 375 × 548 ont été prises sans la carte (WebGL indisponible dans le navigateur sans fenêtre) ; la mise en page de la feuille ne dépend pas de la carte.
