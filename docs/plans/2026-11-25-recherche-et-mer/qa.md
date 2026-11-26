# QA navigateur — recherche-et-mer

Statut : terminé (partiel : la carte ne se charge pas dans mon navigateur, la recherche et les fiches n'ont pas pu être testées)

## Limite majeure de cette passe
Le navigateur de `studio-browse` n'a pas WebGL (`canvas.getContext('webgl2')` renvoie faux ; le mode avec fenêtre `BROWSE_HEADED=1` ne démarre pas, profil Chrome verrouillé, deux essais). La carte affiche donc « La carte n'a pas pu se charger. » (état **erreur**, voulu par la spec), et en état erreur la loupe et tous les réglages sont inactifs (H188 : conforme). Je ne peux pas atteindre : recherche (champ, suggestions, clavier, états), choix d'une commune, fiche, cadrage, pastilles au clic, temps de réaction. Les builders disposent de Chromium avec swiftshader (`playwright.config.ts`) : ce sont eux, ou Vincent dans un vrai navigateur, qui doivent faire ces vérifications. Je ne les déclare pas « ok ».

## Bloquant
Aucun constat.

## Majeur
Aucun constat (rien n'a pu être atteint qui le justifie).

## Mineur
[Mineur] Aucun défaut visuel nouveau relevé ; points à confirmer ci-dessous.
- Mentions en bas de panneau (bureau) : texte très petit et gris, 22 lignes d'un seul bloc, à lire de près ; contraste non mesuré. Capture : captures/qa-bureau-mentions-bas-panneau.png.

## Réponses aux points « déjà connus »
- (a) 01300 à 6 communes à 390 px : **non vérifié** (recherche inatteignable).
- (b) Trou dans la carte sous le panneau : **non vérifié**, la carte ne se dessine pas du tout ici (pas de WebGL).
- (c) Pied de page de 7 lignes qui couvrait le bas de la carte en bureau : **réglé à 1280 × 800** — plus rien sur la carte, seule la légende (Score 0 → 100) reste en bas à gauche, et les mentions sont en bas du panneau de réglages, après « Gare », avant le compte « 34 674 communes passent tes critères » (captures/qa-bureau-mentions-bas-panneau.png). Au téléphone elles sont en bas des onglets « Critères » et « Liste » (captures/qa-390-liste-mentions.png ; onglet « Critères » : non regardé en bas).

## Ce qui est conforme (vu)
- Ancien lien : `/?loyer=1200&mer=30` → adresse réécrite en `/?loyer=1200`, mer sur Peu importe (liste 34 674 communes). AC-10 ok à l'écran.
- `/?loyer=1200&mer-min=30&montagne=50` : l'adresse est conservée, « 30 min » et « 50 km » apparaissent cochés, 608 communes, la liste montre la mer en minutes en dernière colonne (« 1 min », « moins d'1 min », « 3 min »). Capture : captures/qa-bureau-mer-min30-ancien-lien.png. Montagne en km à côté de la mer en minutes : lisible, deux blocs distincts (« Mer à moins de », « Montagne à moins de »), pastilles « 15 min · 30 min · 1 h · 1 h 30 » conformes.
- Peu importe : la liste montre la mer en minutes (« 5 h 37 ») même sans filtre (R62).
- Données (lecture de `public/data/communes.json`) : Bordeaux 56 min, Caen 18 min ; Aspremont (06006, 10,14 km) et Arles (26,09 km) sans temps (`mer_min` nul), donc à compter d'après les km : le texte « ≈ » et « compté … d'après les km » reste à voir à l'écran.
- Mentions : « Codes postaux : La Poste, base officielle des codes postaux (fichier du 17/11/2026) » et « Temps jusqu'à la mer : calculés avec openrouteservice, © OpenStreetMap contributors » présentes en bureau et à 390 px.
- État erreur : loupe inactive en bureau (au bout du titre) et à 390 px (au bout de la rangée d'onglets), comme les réglages ; les onglets restent actifs. Captures : qa-bureau-erreur-carte.png, qa-390-erreur-carte.png.
- Console : pas d'erreur sur la page (hors l'échec WebGL).

## Non vérifié (à faire dans un navigateur avec WebGL)
Tous les états de recherche (vide, trop court, suggestions, aucune, chargement des codes, codes indisponibles après 10 s, choisie) ; recherches Auch, Le Havre, Les Sables-d'Olonne, 01300, 75015, 33000, accents, nom absent ; clavier (flèches, Entrée, Échap, Échap deux fois, focus visible, ordre de tabulation, retour du focus sur la loupe après « Annuler ») ; attributs aria (« 2 suggestions », combobox) ; fiche de Bordeaux / Caen / Aspremont / Arles ; raisons de refus de la mer en minutes ; pastille cliquée et son temps de réaction (budget 164 ms) ; aucune requête vers un autre site (étape 6) ; comparaison aux captures C-* / F-* ; contrastes mesurés ; téléphone : recherche dans la tête de la feuille, fermeture sur la fiche, clavier virtuel.
