# Décision de design — loyer-mer
2026-10-12 · Prototypes : branche `prototype/loyer-mer` (`prototype/loyer-mer/index.html` pour A, B, C ; `fusion.html` pour la fusion) · Captures : [directions/](directions/)

## Ce qui a été comparé
Trois directions au même niveau de finition, en HTML, avec les départements comme formes de substitution :
- **A**, carte plein écran et panneaux flottants ;
- **B**, trois colonnes (la direction de Vincent, présentée à l'aveugle) ;
- **C**, une phrase-réglage en haut et un bandeau de cartes en bas.

Revue à l'aveugle : [review-directions.md](review-directions.md). A obtient 26/30, B 23/30, C 19/30. Pari de Vincent avant de lire la revue : A.

## Ce qu'on retient
**Base A** : la carte plein écran, les réglages dans un panneau posé à gauche, la liste dans un panneau posé à droite. À 390 px, une feuille qui monte du bas. C'est la seule direction qui sert les objectifs 1 à 3 de la grille aux deux largeurs.

Repris des autres directions :
- **De C**, le score écrit à l'encre avec une pastille de couleur. Le blanc sur les paliers clairs tombait à 2,28:1.
- **De B et C**, la fiche à une place fixe, qui remplace la liste avec « ← Les 10 premières ». Vincent : « en mode flottant ça risque de pas être dingue si on a beaucoup de critères ».
- **De B**, les mentions toujours visibles, y compris à 390 px (en bas de la feuille).

Ajouté pendant la fusion, sur les retours de Vincent :
- **Communes au lieu des aires** (D10) : « la taille des aires est trop grande ».
- **Pastilles de taille de ville** avec les tranches d'habitants (D11).
- **Ligne « Estimation du secteur »** (D12).
- **Numéros du top 10 posés sur la carte** : à la commune, 269 communes deviennent des points minuscules.
- **Mer, fleuves, lacs et pays voisins** (D13) : « la carte fait un peu vide ».
- **Zoom sur la commune choisie** (D14).
- **Fond Plan IGN « atténué » et estompage IGN en direct** (D16) : prototype `ign.html`, essayé dans un vrai navigateur ; recoloration mesurée à 20 ms ; une commune qui ne passe pas laisse voir le fond ; communes plus transparentes au zoom (H10). Fond « gris » écarté par Vincent (« le fond atténué est bien meilleur »). Captures `I-tailles`, `I-zoom`.
- **Noms des pays, mers et villes, et relief ombré partout** (D15, aujourd'hui fournis par le fond IGN). Trois modes de relief comparés dans le prototype ; Vincent a choisi « partout » contre la recommandation « hors communes colorées » (captures `F-relief-large`, `F-relief-gris-large`, `F-sans-relief-large`).

Correctifs de la revue appliqués :
- **Double contour** sur la commune choisie ;
- **Compte annoncé** aux lecteurs d'écran (zone `aria-live`) ;
- **Pastilles** de 28 px de haut au moins.

## Écarté, et pourquoi
- **B** : à 390 px, la liste et le compte passent sous le premier écran, et une fiche ouverte depuis la carte s'affiche 1 100 px plus bas.
- **C** : le bandeau ne montre que 7,5 des 10 premières en bureau, et 2 à 390 px ; il faut ouvrir une bulle pour chaque réglage, et elle cache la carte sur mobile.
- **La phrase-réglage de C en résumé** : proposée par le relecteur, non retenue par Vincent.
- **La mer en minutes de voiture** : reportée à la tranche 2, avec les proches.

## Mesuré sur le prototype fusionné (machine de Vincent, navigateur sans écran)
- 35 228 communes chargées. Recoloration complète en **45 ms** pour un budget de 100 ms. À refaire sur un téléphone en tâche 0.
- 493 communes sans données dans le prototype : les codes des formes (france-geojson) ne correspondent pas aux codes 2025. Ce n'est pas un défaut du produit, mais la tâche 0 devra prendre des formes au millésime 2025.

## Points ouverts pour Figma et le build
- **Ronds du top 10 qui se chevauchent** quand deux communes sont voisines (Outreau et Boulogne) : les décaler légèrement.
- **Contour de la France (Natural Earth) trop grossier au zoom** : il est masqué au-delà de ×3. En production, prendre le contour issu des communes.
- **Distance à la mer approximative dans le prototype** : la vraie viendra de la Limite terre-mer Shom-IGN, calculée en tâche 0.

## Après la relecture du design Figma (2026-10-12)
Relecture : [review-figma.md](review-figma.md), 0 Bloquant, 4 Majeurs, 7 Mineurs. Mesure refaite par Claude : `score-4` à 40 % sur blanc = #A2C0BC, plus clair que `score-1` (#76B8A9).

Corrigé sans décision (vérifiable contre la spec ou le brief) : « Sans limite » au dernier cran (H2) ; états de focus de la ligne et du rond (WCAG 2.4.7) ; pastille du palier dans la fiche ; cibles de 44 px à 390 px ; Natural Earth retiré du brief.

**Décidé par Claude, à la demande de Vincent** (« je te laisse décider selon les best practices UX/UI », « à toi de voir, je testerai ensuite ») — à contester après ses tests :
- **Fiche à 390 px** : elle remplace les réglages en haut de la feuille ; « ← Les 10 premières » les ramène. *Écarté* : faire défiler la feuille jusqu'à la fiche (repère perdu, animation à construire) ; une feuille repliée avec un résumé (élément et texte nouveaux).
- **Opacité au zoom 70 %** (H10, D17). *Écarté* : 40 % (la légende ment) ; légende atténuée au zoom (paliers 4 et 5 presque identiques).
- **Ronds du top 10 regroupés** au-delà de 50 % de chevauchement (« 3 · 10 », un clic zoome). *Écarté* : éventail avec traits (chargé sur le Pas-de-Calais) ; décalage léger au build (sans garantie).
- **Mineurs appliqués** (D17) : fond de secours lisible (R8) ; compte « Aucune commune ne passe tes critères » ; intitulé « Ne passe pas tes critères » ; sable « sans plafond » à 70 %.

Non fait : l'écran « Bureau — sans plafond » (le navigateur de test n'avait plus WebGL pour la capture) ; à juger sur le build. Logos Shom et IGN : emplacements, vrais fichiers en tâche 0.
