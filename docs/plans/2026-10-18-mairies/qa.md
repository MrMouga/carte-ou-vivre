# QA navigateur — mairies
2026-10-19 · http://localhost:4190/ (vraies données) · studio-browse, fenêtre réelle (WebGL) · captures : `captures/qa/`

## Constats
**Bloquant : 0 · Majeur : 0 · Mineur : 0.** Rien à corriger dans ce qui a pu être vu. Deux remarques hors tranche, sans gravité : voir « Non vérifié » (erreurs de console).

## Ce qui est vérifié sans constat (bureau 1 440 × 900)
- Départ `/` : adresse réécrite `/?loyer=1200`, « Vie locale » entre « Cadre de vie » et « Tes proches », 7 pastilles décochées, 34 674 communes, liste d'avant la tranche (Allarmont en tête). Disposition identique à `F-choix-1440x900.png` : 3 colonnes, « Sans étiquette » au format d'une case, phrase à sa droite (capture `02-bureau-vie-locale.png`).
- Structure : groupe nommé « Mairie élue en 2026 » (aria-labelledby), 7 boutons `aria-pressed`, 97 × 44 px, `aria-describedby` de « Sans étiquette » → « Moins de 3 500 habitants : le ministère ne classe pas les listes. », espace insécable dans « 3 500 ».
- Chaque bloc seul (`mairie=<bloc>`) : comptes et premières villes égaux à `mesure-tache-0.md` (Extrême gauche 7, Roubaix 43 ; Gauche 741, Clamecy 69 ; Divers 560, Saint-Mihiel 66 ; Centre 561, Le Blanc 66 ; Droite 1 174, Cours 69 ; Extrême droite 60, Thizy-les-Bourgs 67 ; Sans étiquette 31 497, Allarmont 73). Gauche + Droite + Sans étiquette : 33 412.
- Adresse : `?mairie=sans-etiquette,gauche,gauche,foo,droite` est réécrite `mairie=gauche,droite,sans-etiquette` (ordre R38, sans doublon, inconnu ignoré). Décocher la dernière pastille retire `mairie`.
- Catégorie repliée : « 3 choix », « 1 choix », « Peu importe » (`04-bureau-replie.png`, `05-bureau-peu-importe.png`) ; la carte se décolore aux communes écartées.
- « Sans limite » + « Gauche » (`?loyer=aucun&mairie=gauche`) : légende « Sans plafond : pas de score » ; Marseille colorée en neutre (`09-…`), Paris colorée en neutre ; Bordeaux (`07-…`) et Nice (`10-…`) non colorées, fiches « Mairie : centre, hors des mairies choisies » et « Mairie : extrême droite, hors des mairies choisies ».
- Fiches : Bordeaux « Mairie : Centre (Union du centre) · « Faire Gagner Bordeaux » » ; Paris, nom long sur 3 lignes sans débordement (`08-…`) ; Nice (Union de l'extrême droite, 3 lignes) ; Allarmont, village sans étiquette, « Mairie : sans étiquette (moins de 3 500 habitants) · « Sylvie ROUGIER » », « 3 500 » non coupé (`12-…`, conforme à `F-fiche-1440x900.png`) ; Rothau (67) « Mairie : aucun résultat en 2026 » et raison « …, hors des mairies choisies » (`11-…`).
- État vide (`?loyer=300&mairie=extreme-gauche`) : « Aucune commune ne passe tes critères » et texte de la liste inchangés (H119) (`13-bureau-etat-vide.png`).
- Pied de page : mention « Résultats des élections municipales 2026 : ministère de l'Intérieur ; blocs politiques : circulaire du 2 février 2026 » présente (`01-bureau-depart.png`).

## Ce qui est vérifié sans constat (téléphone et clavier)
- 390 × 844 : « Vie locale » dans la feuille « Critères », 7 pastilles de 114 × 44 px, 3 colonnes, « Sans étiquette » + phrase, identique à `F-choix-390x844.png` (`21-390-vie-locale.png`). Toucher (clic) Gauche puis Sans étiquette : adresse `mairie=gauche,sans-etiquette`, 32 238 communes. Sans limite + Gauche + Sans étiquette : carte en neutre, « Aucun plafond fixé » (`22-…`). Fiche de Clamecy depuis l'onglet « Les 10 premières » : « Mairie : Gauche (Divers gauche) · « Clamecy tous unis pour l'avenir » » (`23-…`).
- 375 × 548 : à l'ouverture le curseur du prix est entièrement visible (haut 518, bas 537 sur 548 px), comme `F-ouverture-375x548.png` (`24-…`) ; « Vie locale » atteinte par défilement, « Extrême droite » sur une ligne, cocher Droite → `mairie=droite`, 1 174 communes (`25-…`).
- Clavier (bureau) : Tab va de pastille en pastille dans l'ordre Centre, Droite, Extrême droite, Sans étiquette, puis « Tes proches », l'adresse, la liste ; focus visible partout (contour plein de 2 px) ; Entrée et Espace cochent/décochent (vérifié sur « Centre » : coché, décoché, recoché) ; `aria-pressed` suit.
- Étapes de « Vérification de bout en bout » : 1 (départ), 2 (fiche de Bordeaux), 3 (Sans limite + Gauche : Paris et Marseille neutres, Bordeaux et Nice non colorées, textes de fiche exacts, `mairie=gauche`), 4 (Sans étiquette ajoutée, adresse `mairie=gauche,sans-etiquette`, villages neutres à 390 px), 5 (mention) vues au bureau ; 3 et 4 vues à 390 px sur la carte ; Lyon colorée non regardée.

## Non vérifié
- Toucher réel : le navigateur de test ne simule pas un écran tactile (`pointer: coarse` faux) ; les « touchers » sont des clics. Les cibles mesurées (44 px) sont conformes.
- Étapes 1 à 5 à 390 px avec les fiches de Bordeaux et Nice (la carte ne se choisit à 390 px qu'au clic de coordonnées ; seules les fiches de Clamecy et, au bureau, de Bordeaux, Paris, Nice, Rothau, Allarmont ont été lues). Fiche de Lyon : non lue. Fiche d'une commune sans filtre de mairie (H112) : seule Allarmont, sans filtre (ligne sans mise en avant) ; Rothau sans filtre non ouverte.
- Chargement (H122, cases désactivées) et erreur de chargement : état trop bref pour être capturé, non atteint. Lecteur d'écran réel : non testé (seuls les attributs ont été lus).
- Mesure des 100 ms de H120 : non faite (pas d'outil de mesure fiable en fenêtre réelle) ; à l'œil, la carte se redessine sans attente visible.
- Console : au chargement une réponse 401 et une 404 de ressources que je n'ai pas identifiées (fond IGN ou fichier de la page ?), puis des 400 de l'estompage IGN (`data.geopf.fr`, couche `ELEVATION…SHADOW`) pendant les zooms forts hors cadre : fond de carte, pas la tranche. À identifier par Claude si la 404 est un fichier du site.
- Outil : le zoom et le clic sur la carte ont été faits par événements de molette et de clic envoyés par `js` dans la page (le clic réel à coordonnées est refusé par l'outil).
