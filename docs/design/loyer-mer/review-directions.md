# Revue à l'aveugle des directions — loyer-mer
2026-10-12 · relecteur neuf, mode `directions` · Grille : [README](README.md) · Brief : [brief.md](brief.md) · Spec : [details.md](../../specs/2026-10-12-loyer-mer/details.md)

Matériel regardé : les 12 captures de `directions/`, le prototype en marche (`localhost:8765`) à 1440 × 900, 1366 × 768 et 390 × 844, son code source (moteur commun + 3 vues), un passage au clavier sur C, et un calcul des contrastes des jetons du brief. Mes captures sont dans `/private/tmp/rev-*.png`.

Les trois directions partagent le même moteur (règles R1–R7, textes de la fiche, couleurs, légende). Elles ne diffèrent que par la **disposition** : A = carte plein écran et panneaux posés dessus, feuille en bas à 390 px ; B = trois colonnes, pile verticale à 390 px ; C = phrase à trous en tête, bandeau de cartes en bas. Elles ont le même niveau de finition, sauf un défaut du prototype C qui le dessert (voir objectif 2) : je l'ai décompté.

## 1. Notes par objectif

Échelle : 0 = l'objectif n'est pas atteint · 1 = atteint avec un effort que l'utilisateur ne fera pas · 2 = atteint avec un défaut · 3 = bien servi. Chaque case donne **bureau · 390 px**.

| Objectif de la grille | A | B | C |
|---|---|---|---|
| 1. Lire la France d'un coup d'œil | 3 · 3 | 3 · 2 | 2 · 1 |
| 2. Régler et voir réagir | 3 · 3 | 3 · 2 | 2 · 1 |
| 3. La liste, « ce qu'on va visiter » | 3 · 2 | 3 · 1 | 1 · 1 |
| 4. Comprendre une couleur | 3 · 2 | 2 · 1 | 3 · 2 |
| 5. Des chiffres crédibles | 3 · 1 | 3 · 3 | 3 · 3 |
| **Total (sur 30)** | **26** | **23** | **19** |

### Objectif 1 — Lire la France d'un coup d'œil
- **A (3 · 3)** : la carte prend tout l'écran ; les marges de la projection (340 px de chaque côté) font que les panneaux ne recouvrent aucune forme (`A-ideal.png`). À 390 px, la carte occupe la moitié haute, la légende ne recouvre que la Manche (`A-mobile.png`).
- **B (3 · 2)** : en bureau, la carte fait 820 px de large sur toute la hauteur : aussi lisible que A (`B-ideal.png`). À 390 px, la légende recouvre les Landes et les Pyrénées-Atlantiques, et les boutons + / − recouvrent la Corse (`B-mobile.png`).
- **C (2 · 1)** : la phrase et le bandeau prennent ~280 px de hauteur : la France n'occupe plus qu'environ 580 px sur 900 (`C-ideal.png`). À 390 px, la légende recouvre des aires colorées du Nord et de la Picardie, et la Corse est coupée au bord droit (`C-mobile.png`).
- **Commun** : la légende dit « Score 0 → 100 » sous 5 pastilles, sans les bornes « 0–20 … 80–100 » demandées par le brief : on ne sait pas quelle pastille vaut quelle tranche. Le contour de l'aire choisie est invisible sur les deux tranches foncées (voir Constats communs).

### Objectif 2 — Régler et voir réagir
- **A (3 · 3)** : les deux curseurs et le compte « 29 aires passent tes plafonds » sont dans le même panneau, toujours visibles ; on voit la carte et le compte bouger en même temps. À 390 px, la feuille garde les deux curseurs sous la carte et la carte reste visible pendant le réglage (référence Strava).
- **B (3 · 2)** : les curseurs sont visibles en permanence dans la colonne de gauche. À 390 px, la carte et les curseurs tiennent sur le premier écran, mais le compte est à y ≈ 868 px, sous le bas de l'écran (844 px) : on ne le voit pas changer (`/private/tmp/rev-B-m-fiche.png`, capture pleine page).
- **C (2 · 1)** : les valeurs sont toujours visibles dans la phrase, mais régler demande d'ouvrir un curseur dans une bulle, à chaque fois. À 390 px, cette bulle de 280 px se pose sur la carte et cache la réaction qu'on veut voir. **Défaut du prototype** : la bulle est sans style (la règle CSS `.vC .popslider` vise une classe placée dans `.vC`, alors que la bulle est ajoutée au `body`) ; le curseur s'affiche donc pleine largeur sous le bas de la page, hors de l'écran à 1440 × 900 (`/private/tmp/rev-C-pop.png`). Je juge l'intention (une bulle sous le mot), pas ce défaut, mais Vincent ne peut pas ressentir C tant qu'il n'est pas corrigé.

### Objectif 3 — La liste, « ce qu'on va visiter »
- **A (3 · 2)** : les 10 lignes tiennent dans le panneau de droite à 1440 × 900, avec le rang, le nom, le loyer, la mer et le score ; c'est une `<ol>` de boutons, avec un focus visible. À 390 px, la feuille montre le compte et 3 lignes ; le reste défile dans la feuille.
- **B (3 · 1)** : en bureau, c'est la même liste que A. À 390 px, la liste commence à y ≈ 830 px, après les curseurs et les mentions : il faut faire défiler la page pour la trouver.
- **C (1 · 1)** : les 10 premières sont dans un bandeau horizontal de cartes de 176 px. On en voit 7 et demie sur 10 à 1440 px, et 2 sur 10 à 390 px. Le défilement horizontal à la souris demande Maj + molette, et le bandeau n'est pas une liste (des boutons sans `<ol>`). Le libellé « moins d'1 km » se coupe sur deux lignes dans 4 cartes (`C-ideal.png`).

### Objectif 4 — Comprendre une couleur
Le contenu de la fiche est identique dans les trois (score « 32 / 100 », « 26e sur 29 aires qui passent », « 832 € par mois pour 52 m² (16,0 €/m²) », « 40 km de la mer à vol d'oiseau » : conforme à R4 et R6). Seuls la position de la fiche et ce qu'elle recouvre changent.
- **A (3 · 2)** : en bureau, la fiche s'ouvre à côté du clic, lisible (`A-fiche.png`). Sa position suit le dernier clic sur la carte. Si on choisit depuis la liste, elle apparaît au dernier point cliqué ou au centre de l'écran, loin de l'aire choisie. Près de l'Est ou de la Corse, elle passe par-dessus le panneau de la liste (calcul `left = min(innerWidth−280, x+14)`, `z-index:5`). À 390 px, elle recouvre le bas de la feuille, donc la liste (`/private/tmp/rev-A-m-fiche.png`). Les curseurs restent accessibles, ce qui permet de voir la fiche changer d'état.
- **B (2 · 1)** : en bureau, la fiche est rangée sous la liste, stable, sans rien cacher (`B-fiche.png`). Mais à 1366 × 768, une taille d'écran portable courante, le loyer et la mer sont sous le bas de l'écran (`/private/tmp/rev-B-1366-fiche.png`). À 390 px, la fiche s'ouvre à y ≈ 1 475 px sur une page de 1 650 px : toucher une aire sur la carte, en haut de la page, ne montre rien d'autre qu'un contour.
- **C (3 · 2)** : la fiche est toujours au même endroit, en haut à gauche de la carte, sans recouvrir la France en bureau (`C-fiche.png`). À 390 px, elle se pose en bas de la carte et cache le Sud pendant qu'elle est ouverte.

### Objectif 5 — Des chiffres crédibles
- **A (3 · 1)** : les mentions sont présentes en bureau (une ligne en pied de page, 11 px, contraste 5,4:1). **À 390 px, elles sont masquées** (`.vA .mentions{display:none}`) et la feuille ne les reprend pas.
- **B (3 · 3)** : les mentions sont en bas de la colonne de gauche ; à 390 px, entre les curseurs et la liste, visibles.
- **C (3 · 3)** : les mentions sont sous le bandeau, aux deux largeurs. De plus, la phrase porte les unités et le mode de mesure au premier niveau de lecture : « pour 52 m² », « à vol d'oiseau ». C'est la direction la plus explicite.
- **Commun** : aucun habillage gadget. Les logos Shom et IGN sont remplacés par « [logos] » dans les trois (non jugé).

## 2. Constats

### Communs aux trois (à corriger quelle que soit la base)
**[Majeur] Le contour de l'aire choisie disparaît sur les meilleures aires** — la personne qui ouvre la fiche d'une aire foncée (les meilleures, celles qu'on choisit le plus) ne voit pas laquelle est en évidence.
  Où : carte, fiche **aire qui passe**, aires des tranches 60–80 et 80–100.
  Preuve : contour `foreground` #1F2A2A contre `score-4` #176258 = 2,06:1, contre `score-5` #0A433D = 1,32:1 (minimum 3:1). details.md : « l'aire est en évidence sur la carte ».
  Correction : un double contour, par exemple 3 px `card` #FFFFFF sous 1,5 px `foreground`, lisible sur toutes les tranches et sur les gris.   Réf : WCAG 1.4.11, details.md (États de la fiche).

**[Majeur] Le compte n'est pas annoncé** — une personne qui utilise un lecteur d'écran et bouge un curseur n'apprend pas que le compte « N aires passent tes plafonds » a changé.
  Où : compte et messages de liste, dans les trois vues (aucun `role="status"` ni `aria-live` dans le source).
  Preuve : règle du projet « messages d'état annoncés ».
  Correction : placer le compte et les messages « Aucune aire… » et « Fixe un loyer… » dans une zone `role="status"` ; le noter dans le Figma comme annotation.   Réf : WCAG 4.1.3.

**[Mineur] La légende ne dit pas les bornes des tranches** — « Score 0 → 100 » au lieu de « 0–20 … 80–100 » : on ne peut pas dire qu'une aire est « entre 60 et 80 ». Réf : brief (Échelles), objectif 1.

**[Mineur] L'état chargement manque** — « Chargement de la carte… » n'existe dans aucune vue. L'erreur existe, mais sans style. Ces deux états sont à dessiner dans le Figma de convergence. Réf : details.md (États de la page).

**[Mineur] La fiche ne reçoit pas le focus et ne se ferme pas avec Échap** — après avoir choisi une ligne au clavier, il faut parcourir le reste de la liste (A, B) ou revenir en arrière par-dessus la carte (C, où la fiche est placée avant le bandeau dans le code) pour atteindre « Fermer ». Réf : WCAG 2.4.3.

### Direction A
**[Majeur] Les mentions obligatoires disparaissent à 390 px** — sur téléphone, aucune source n'est visible : ni ANIL, ni Shom-IGN, ni Insee.
  Où : `?variant=A` à 390 px (`A-mobile.png`, règle `.vA .mentions{display:none}` sous 640 px).
  Preuve : CLAUDE.md, « Mentions obligatoires sur le site » ; details.md, vérification étape 4 « aux deux largeurs » ; objectif 5.
  Correction : mettre les mentions en bas de la feuille, après la liste.   Réf : objectif 5.

**[Mineur] La fiche suit le dernier clic** — choisie depuis la liste, elle s'ouvre loin de l'aire, et elle peut passer par-dessus la liste. Correction : une position fixe (voir la recommandation).

**[Mineur] La poignée de la feuille ne fait rien** — elle annonce un glissement qui n'existe pas. Si la feuille devient déplaçable, il faut aussi un bouton pour l'ouvrir et la fermer (règle « tout ce qui se glisse se fait aussi d'un clic »).

### Direction B
**[Majeur] À 390 px, il n'y a pas de feuille : la liste et la fiche sont hors de l'écran** — toucher une aire sur la carte ouvre une fiche à 1 100 px plus bas, que la personne ne voit pas ; la liste et le compte sont sous le premier écran.
  Où : `?variant=B` à 390 × 844 (`/private/tmp/rev-B-m-fiche.png` : liste à y ≈ 830, compte à y ≈ 868, fiche à y ≈ 1 475).
  Preuve : brief, Mobile : « réglages, liste et fiche dans une feuille qui monte du bas » ; objectifs 3 et 4.
  Correction : reprendre la feuille de A à 390 px.   Réf : brief (Mobile), objectifs 3–4.

**[Mineur] Fiche coupée sur un portable 1366 × 768** — le loyer et la mer sont sous le bas de l'écran dans la colonne de droite (`/private/tmp/rev-B-1366-fiche.png`).

**[Mineur] Trois colonnes blanches autour de la carte** — c'est la disposition qui se rapproche le plus de la référence rejetée (Profound, « trop technique, pas assez centré sur la carte »). C'est une question de ressenti, pas d'objectif : je ne la compte pas dans les notes.

### Direction C
**[Majeur] Les 10 premières ne se lisent pas d'un coup** — dans le bandeau horizontal, on voit 7 cartes et demie sur 10 à 1440 px, et 2 sur 10 à 390 px. On ne peut donc pas comparer la 1re et la 10e sans faire défiler de côté.
  Où : bandeau, `C-ideal.png`, `C-mobile.png`.
  Preuve : objectif 3 « les 10 premières lisibles » ; R5.
  Correction : si C devient la base, reprendre une liste verticale ; sinon, ne pas reprendre le bandeau.   Réf : objectif 3.

**[Majeur] Les plafonds ne sont pas « à portée »** — chaque réglage demande trois gestes (ouvrir la bulle, glisser, refermer). À 390 px, la bulle cache la carte pendant le glissement. Au clavier, Échap ne ferme pas la bulle, et Tab après le curseur sort de la page (essai du 2026-10-12 : la bulle reste ouverte, aucun focus visible ensuite).
  Où : phrase à trous, `?variant=C`.
  Preuve : objectif 2, « restent visibles et à portée » ; WCAG 2.4.3. J'ai hésité avec Mineur : les valeurs restent visibles. Je garde Majeur parce que, sur téléphone, on ne voit plus la carte réagir, ce qui est le cœur de l'objectif.
  Correction : garder la phrase comme résumé, mais laisser les curseurs visibles (voir la recommandation).   Réf : objectif 2, WCAG 2.4.3.

**[Mineur] Les boutons de la phrase ont un nom incomplet** — un lecteur d'écran annonce « 800 €, bouton », sans dire de quel plafond il s'agit. Nom attendu : « Loyer maximum : 800 € ». Réf : WCAG 2.4.6.

**[Mineur] Capture à refaire** — `C-loyer800.png` montre une carte décalée, avec la légende et le zoom hors de l'écran. Je ne reproduis pas ce défaut en direct (`/private/tmp/rev-C-800.png` est correct). C'est un défaut de capture : la refaire avant de la montrer.

### Propre à A et B
**[Majeur] Le score en blanc sur les tranches claires est illisible** — avec des plafonds serrés, les premières de la liste tombent dans les tranches claires, et leur score devient difficile à lire.
  Où : pastille de score de la liste (A, B), texte blanc gras de 13 px.
  Preuve : blanc sur `score-1` #76B8A9 = 2,28:1, sur `score-2` #4C9D8D = 3,22:1 (minimum 4,5:1). C n'a pas ce défaut : texte foncé et barre.
  Correction : texte `foreground` sur les tranches 1 et 2 (6,47:1 et 4,58:1), blanc à partir de la tranche 3.   Réf : WCAG 1.4.3.

## 3. Ce que chaque direction fait de mieux
- **A** : la carte vraiment d'abord (plein écran, panneaux posés dessus, conforme à Felt) ; les curseurs et le compte réunis, toujours visibles ; à 390 px, la seule feuille du bas qui garde à la fois la carte et les curseurs à l'écran (Strava). C'est la seule direction qui sert les objectifs 1 à 3 aux deux largeurs.
- **B** : une disposition stable, où rien ne recouvre la carte ; la fiche à une place fixe et prévisible ; les mentions toujours visibles, y compris à 390 px.
- **C** : la phrase « Un loyer sous 1 200 € pour 52 m², et la mer à moins de 60 km à vol d'oiseau. » C'est le meilleur résumé des plafonds, en langage de canapé, avec les unités et le « à vol d'oiseau » au premier niveau (objectif 5), et c'est aussi la phrase qu'on a envie de partager. Ensuite, la fiche à position fixe, et le score écrit en foncé avec une barre (pas de problème de contraste).

## 4. Recommandation
**Base : A.** C'est la seule qui sert la grille aux deux largeurs ; ses défauts (mentions à 390 px, position de la fiche) se corrigent sans changer la disposition.

À reprendre :
1. **De C, la phrase**, comme résumé en tête du panneau de réglages en bureau et comme état replié de la feuille à 390 px (« Un loyer sous 1 200 € pour 52 m², la mer à moins de 60 km à vol d'oiseau · 29 aires passent »). Un bouton déplie les curseurs, qui restent de vrais curseurs visibles une fois dépliés. On ne reprend pas la bulle.
2. **De B et C, la fiche à place fixe** au lieu de la fiche qui suit le clic. En bureau, la mettre en tête du panneau de droite, au-dessus de la liste (la liste défile dessous), ou à un coin fixe de la carte. À vérifier à 1366 × 768. À 390 px, elle s'ouvre dans la feuille, comme dans A.
3. **De B, les mentions toujours visibles** : à 390 px, en bas de la feuille.
4. **De C, le score en texte foncé**, avec la barre si elle reste discrète, à la place de la pastille blanche, ou la correction de contraste décrite plus haut.
5. **Pour les trois** : double contour de l'aire choisie, compte en `role="status"`, bornes des tranches dans la légende, états chargement et erreur dessinés, focus envoyé à la fiche et fermeture par Échap.

À ne pas reprendre : le bandeau horizontal de C (objectif 3) et la pile verticale de B à 390 px (objectifs 3 et 4).

## 5. Ce qui marche (dans les trois)
- La palette tient sa promesse : on voit d'un coup d'œil « où est le foncé » (les côtes atlantique, de la Manche et méditerranéenne), et les deux gris restent distincts du vert le plus clair.
- Les textes de la fiche, de la liste et des messages suivent la spec mot pour mot (R4, R5, R6), et les règles réagissent sans délai perceptible avec 96 formes.

## 6. Non jugé
- **Les vraies formes** : 675 aires et communes hors aire. Les départements n'ont pas de zone « hors aire » : je n'ai pas vu les hachures sur la carte, ni la lisibilité de petites aires, ni le budget de 100 ms avec ~35 000 communes.
- **La fiche d'une aire grisée** (avec ses raisons) et la page **sans plafond** : je ne les ai pas capturées. Le code commun produit bien « Loyer 832 € : au-dessus de ton plafond de 800 € » et la légende « Sans plafond ».
- **Les logos** Shom et IGN (« [logos] »), le mouvement (aucun), un vrai téléphone (pincement, glissement de la feuille), un lecteur d'écran réel.
