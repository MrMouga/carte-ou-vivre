# Revue du design Figma — loyer-mer
2026-10-12 · relecteur neuf, mode `review`, toutes perspectives (utilisabilité, visuel, accessibilité) · Fichier `uJG30M95NtOV9eDkv8oF0q`

Regardé : `5:2`, `5:154`, `5:235`, `5:314`, `7:343` (+ structure), `7:488`, `9:514`, `9:636` et ses composants (`9:782`), les variables liées à `5:2`. Chaque écran a été lu avec son image de carte (`directions/figma-carte-*.png`). Couleurs prélevées au pixel dans les images, contrastes calculés selon la formule WCAG.

Comptes : **0 Bloquant · 4 Majeurs · 7 Mineurs.**

---

## Majeurs

**[Majeur] À 390 px, la fiche s'ouvre hors de l'écran, et aucune ligne de la liste n'est visible au départ** — sur mobile, la personne qui touche une commune voit la carte zoomer, mais pas la fiche. C'est le défaut pour lequel la direction B a été écartée.
  Où : `7:343` « Mobile 390 — classée (feuille à mi-hauteur) » ; aucun écran mobile pour la fiche.
  Preuve : la feuille commence à y = 371. La section « Les 10 premières » est à y = 426 dans la feuille, donc à y = 797 à l'écran. La première ligne arrive à y ≈ 850, au-delà des 844 px de l'écran. La fiche remplace la liste au même endroit (brief, écran 3), donc elle s'ouvrirait à y ≈ 797 : seuls le lien de retour et une partie du nom seraient visibles. decisions.md, « Écarté » : « B : à 390 px, la liste et le compte passent sous le premier écran, et une fiche ouverte depuis la carte s'affiche 1 100 px plus bas. » Grille, objectifs 3 et 4. Les autres positions de la feuille (repliée, pleine) ne sont pas dessinées non plus.
  Correction : dessiner « Mobile 390 — fiche ». Quand on choisit une commune, la feuille fait défiler la fiche jusqu'en haut de la partie visible (ou bien la fiche prend la place des réglages, et « ← Les 10 premières » les fait revenir). La commune zoomée doit être centrée dans la bande de carte visible (0–371 px), pas sur les 844 px. Dessiner aussi les positions repliée et pleine de la feuille, et décider si les 2 ou 3 premières lignes doivent apparaître sans faire défiler. Par exemple, des curseurs plus serrés à mi-hauteur gagneraient environ 60 px.
  Réf : decisions.md (B écartée) · grille 3 et 4 · brief « Mobile » · heuristique « visibilité de l'état du système ».

**[Majeur] Au zoom, la couleur d'une commune ne correspond plus à la légende** — avec une opacité de 40 % (H10), Douarnenez (score 74, palier 4) apparaît plus claire que la pastille la plus claire de la légende (palier 1). Qui compare à la légende lit « mauvais score » pour une très bonne commune.
  Où : `5:154` avec `figma-carte-fiche.png` ; même effet sur les voisines de `5:235` (`figma-carte-grisee.png`).
  Preuve : couleur prélevée sur Douarnenez = #A0BDB7. `score-4` à 40 % sur blanc donne #A2C0BC, `score-5` à 40 % donne #9DB4B1, contre `score-1` = #76B8A9 dans la légende. Au zoom, les paliers 4 et 5 sont presque identiques, et le palier 4 paraît plus clair que le palier 1 à pleine opacité. Contraste de la commune sur le fond : 1,78:1, sous les 2,08:1 que le brief a validés pour le palier le plus clair. La fiche ne montre pas non plus la pastille du palier à côté de « 74 / 100 » (la liste, elle, la montre). Grille, objectif 1 (« 5 tranches distinctes ») et objectif 4 (« comprendre une couleur »).
  Correction : au zoom, passer la légende en version « au zoom », avec les pastilles rendues à la même opacité que sur la carte. Ou bien garder une opacité d'au moins 65–70 % et laisser lire le plan IGN par le contour et les noms. Ajouter dans la fiche la pastille du palier avant « 74 / 100 », comme dans la ligne de liste. H10 étant une hypothèse de la spec, le choix revient à Vincent.
  Réf : H10 · grille 1 et 4 · brief « Échelles de données » (palier le plus clair à 2,08:1).

**[Majeur] Le dernier cran « Sans limite » n'est ni annoncé ni bien dessiné** — rien sur le curseur ne dit qu'on peut désactiver un critère. Le seul dessin de cet état affiche « 1 200 € » alors que la poignée est en fin de course. Si c'est construit tel quel, on croit avoir un plafond qui n'existe plus ; et l'état « sans plafond » reste introuvable.
  Où : composant Curseur, variante « Position=Sans limite » (`9:839` dans `9:806`) ; curseurs de `5:2` et `7:343`.
  Preuve : H2, « le cran après le maximum est « Sans limite » ». Le tableau des états (`9:514`, ligne « Page · sans plafond ») dit lui-même « curseurs : « Sans limite » », ce qui contredit le composant. Brief, écran 2 : « dernier cran « Sans limite » ».
  Correction : dans cette variante, afficher « Sans limite » en style `valeur` et retirer le sous-texte (ou le remplacer). Ajouter sous le rail les bornes en `secondaire` (« 300 € » à gauche, « Sans limite » à droite ; « 5 km » / « Sans limite »), pour que la fin de course se voie avant d'y arriver.
  Réf : H2 · brief écran 2 · `9:514` · heuristique « reconnaître plutôt que se souvenir ».

**[Majeur] Des ronds du top 10 se masquent : 2 sur 10 sont invisibles en bureau, environ 5 sur 10 à 390 px** — sur l'écran d'accueil, on lit « 1 2 4 5 6 7 8 9 » : le 3 (Boulogne) est sous le 2 (Outreau), le 10 (Marck) sous le 5 et le 6. À 390 px, le 7 est sous le 4, et le 3, le 5, le 6 et le 10 forment un amas. Ces ronds sont censés être « cliquables ».
  Où : `5:2` et `5:314` avec `figma-carte-classee.png` et `figma-carte-uni.png` ; `7:343` avec `figma-carte-mobile.png`.
  Preuve : decisions.md, « Points ouverts pour Figma et le build » : « Ronds du top 10 qui se chevauchent […] les décaler légèrement ». Le point n'est pas réglé dans Figma. Brief, `rank-marker` : « les 10 premières, posées sur la carte, cliquables ». Grille, objectif 1 (« lesquelles sont les meilleures »). Même endroit : le rond 1 recouvre « Cherbourg-Octeville » et le 8 coupe « Saint-Brieuc » (« int-Brieuc »), alors que le brief demande des noms « écartés des ronds du top 10 ».
  Sévérité : Majeur et non Bloquant, parce que la liste donne les 10 au clavier comme à la souris.
  Correction : dessiner la règle d'écartement. Au-delà d'un chevauchement de 50 %, les ronds se décalent en éventail, reliés à leur commune par un trait de 1 px `foreground`. Ou bien ils se regroupent en un rond « 3, 10 » qui zoome au clic. Montrer le cas Outreau / Boulogne / Calais / Grande-Synthe / Marck à 1440 et à 390 px.
  Réf : decisions.md, points ouverts · brief `rank-marker` · grille 1.

---

## Mineurs

**[Mineur] Le fond uni de secours rend la France illisible et contredit le contrat du système** — sur `figma-carte-uni.png`, il ne reste que des taches vertes sur du crème : ni trait de côte, ni mer, ni communes qui ne passent pas. Pourtant, le contrat réserve `area-excluded`, `map-sea`, `map-neighbour` et `map-border` à ce seul état. Si `area-excluded` est utilisé, l'entrée de légende « Non colorée : ne passe pas » devient fausse dans cet état.
  Où : `5:314`, légende `9:910`.
  Pourquoi Mineur : l'état est rare (disponibilité IGN annoncée à 99,5 %), et la liste et la fiche fonctionnent toujours.
  Correction : peindre le fond uni avec les jetons prévus (mer, voisins, trait de côte, communes exclues en `area-excluded`) et prévoir une variante de légende « Fond indisponible » (« Ne passe pas » avec la pastille `area-excluded`). Sinon, retirer ces jetons du contrat.
  Réf : system/README « fond uni de secours seulement (R8) » · brief § Fond de carte · R8 (« la carte reste utilisable »).

**[Mineur] La fiche d'une commune qui ne passe pas ne dit pas qu'elle ne passe pas** — « Taille : grande ville (268 000 habitants) » en gras arrive juste sous « Grande ville · 268 000 habitants » : on croit lire deux fois la même information, pas la raison pour laquelle Bordeaux n'est pas colorée. Avec le loyer, c'est pareil : la raison répète la ligne de loyer.
  Où : `5:235`, composant Fiche « Ne passe pas » (`9:948`).
  Pourquoi Mineur : le texte de la raison est fixé par R1, et l'absence de score montre déjà qu'il se passe quelque chose.
  Correction : un intitulé en style `categorie` au-dessus des raisons (par exemple « Ne passe pas tes critères »), à faire valider par Vincent puisque c'est un texte nouveau. Ou bien une raison rendue comme un encart (fond `background`, bord `border`), pour la distinguer des faits.
  Réf : grille 4 (« la raison du gris ») · R1.

**[Mineur] « Sans plafond » : le sable à 45 % se voit à peine, et l'état n'a pas d'écran** — `area-unranked` à 45 % donne #EDE3CA sur blanc, soit 1,28:1 (1,22:1 sur le crème du plan IGN). Quand on a coché des tailles, distinguer « bonne taille » de « pas la bonne » sera difficile. Le tableau `9:514` range cet état parmi ceux qui ne changent que le message, alors que la carte, la légende, les curseurs et la fiche changent tous.
  Où : `9:514`, ligne « Page · sans plafond » ; légende `9:923`.
  Correction : un écran « Bureau — sans plafond » avec son image de carte, pour juger sur pièce. Si c'est confirmé, monter l'opacité du sable (au moins 2:1 comme le palier 1) ; H10 est à faire valider par Vincent.
  Réf : H10 · brief (palier le plus clair à 2,08:1) · grille 1.

**[Mineur] « Aucune commune » : le compte annoncé aux lecteurs d'écran n'est pas défini** — le tableau le note lui-même (« Compte du panneau de réglages : non précisé par la spec (point ouvert) »). Or c'est ce compte qui annonce le changement à une personne qui n'est pas voyante. S'il disparaît ou reste à « 269 », elle ne sait pas que plus rien ne passe.
  Où : `9:514`, ligne « Page · aucune commune ».
  Correction : faire trancher le texte par Vincent (par exemple « Aucune commune ne passe tes critères » dans la zone annoncée), et faire de même pour « sans plafond » (le compte disparaît-il ?).
  Réf : WCAG 2.2, 4.1.3 Messages d'état · details.md, états de la page.

**[Mineur] Les cibles tactiles sont sous le contrat du système à 390 px** — pastilles de 41 px de haut et boutons de zoom de 32 × 32, alors que le contrat demande 44 px au toucher. Le minimum WCAG de 24 px est respecté, d'où le classement en Mineur.
  Où : `7:343`, pastilles `7:390`–`7:399`, zoom `7:357`.
  Correction : pastilles d'au moins 44 px de haut à 390 px (padding vertical `space-3`), zoom en 44 × 44 au toucher (le dessin peut garder 32 px, avec une zone de toucher de 44 px).
  Réf : system/README, Règles (« 44 px au toucher ») · WCAG 2.2, 2.5.8.

**[Mineur] Les mentions sont incomplètes pour une mise en ligne** — les logos Shom et IGN sont des étiquettes de texte (« Shom », « IGN ») en bureau et « [logo Shom] [logo IGN] » en mobile, sans signe visible qu'ils sont des liens. La source des formes des communes (choisie en tâche 0) n'a pas d'emplacement. Le brief, écran 5, cite encore « Natural Earth » ; c'est périmé depuis D16, et le design a raison de l'omettre.
  Où : bande des mentions de `5:2` (et suivants), `7:488`.
  Correction : réserver la place des vrais logos (hauteur 16 px environ) et dessiner leur focus. Prévoir « Formes : [source], [millésime] ». Mettre le brief à jour.
  Réf : CLAUDE.md, Données (« avec les logos Shom et IGN et leurs liens ») · details.md, pied de page · grille 5.

**[Mineur] Il manque des états de focus et le rond choisi se distingue mal** — la Ligne de liste n'a que Repos et Survol, sans Focus, alors que c'est le chemin clavier principal (Exceptions). Le Rond du top 10 n'a pas de focus. Le rond « Choisi » ne fait que 4 px de plus que les autres.
  Où : composants `9:876`, `9:867`.
  Correction : ajouter la variante Focus (ring 2 px décalé de 2 px) à la ligne de liste. Montrer la ligne « choisie » dans la liste quand la fiche se ferme, pour que le focus revienne sur elle. Donner au rond choisi un anneau `card` plus épais, ou un halo, en plus de la taille.
  Réf : WCAG 2.2, 2.4.7 et 2.4.11 · details.md, Exceptions.

---

## Ce qui marche
- Le ressenti du brief est tenu : la carte occupe tout l'écran, les panneaux sont sobres, une seule teinte de donnée, l'encre pour les réglages, sans aucun cliché (pas d'Inter, de verre, de dégradé ni d'emoji). La fiche est nette et ses textes sont conformes à R4 et R6 (« 4e sur 269 communes qui passent », « 601 € par mois pour 52 m² (11,6 €/m²) »).
- Le système est vraiment branché : les variables de `5:2` ne remontent que des jetons (couleurs, espacements, rayons, styles de texte, `ombre-panneau`), et le contraste du texte secondaire est bon (`muted-foreground` sur `card` = 5,95:1, 5,42:1 sur `background`).
- Le tableau des états `9:514` est complet, cite les textes exacts de details.md et signale lui-même ses points ouverts : c'est une bonne base pour /breakdown.

## Non jugé
- La vraie carte dans les cadres : le rectangle est encore vide. J'ai lu les images à part, sans voir l'alignement exact ni ce que les panneaux recouvrent dans le montage final.
- Le double contour de la commune choisie : les images sont à mi-résolution, on y voit un trait sombre simple.
- Le mouvement : le zoom en 500 ms (D14), la feuille qui monte, la réaction en 100 ms (H9).
- Les largeurs intermédiaires (1024–1280 px), où le panneau gauche pourrait couvrir la Bretagne.
- Les noms longs dans la liste et la fiche, l'état « Estimation du secteur » mis en situation, « chargement » avec ses réglages inactifs (non dessinés), « erreur » posé sur la carte.
- L'ordre réel de tabulation et le rendu avec un lecteur d'écran (fichier statique).
- La nécessité d'une mention supplémentaire pour les données des pays voisins dans le Plan IGN : à vérifier dans les conditions de la Géoplateforme en tâche 0.
