# QA navigateur 2 — recherche-et-mer (Chromium + swiftshader, carte chargée)

Statut : terminé

Scripts : docs/plans/2026-11-25-recherche-et-mer/captures/qa/ (lib.mjs, e1 à e5). Captures : captures/qa/qa2-*.png.

## Constats
Bloquant : aucun. Majeur : aucun. Mineur : 3 (dont (a) connu).
- [Mineur] (a) connu confirmé : à 390 px, « 01300 » montre 6 communes sur 22 dans 280 px, la moitié basse de la feuille est vide. Capture : qa2-390-saisie-01300.png. Même plafond en bureau (qa2-bureau-saisie-01300.png), où il est acceptable.
- [Mineur] « 06006 » (code INSEE d'Aspremont) ne donne rien : la recherche est par code postal, pas par code INSEE (conforme à R58) ; Aspremont se trouve par son nom ou « 06790 ».
- [Mineur] Fiche : « 17557e sur 34 674 communes qui passent » et « 31932e » sans espace des milliers (les autres nombres en ont : « 34 674 »). Probablement antérieur à la tranche. Capture : qa2-bureau-auch-choisie.png, qa2-390-fiche-sables.png.

## Vu conforme
- Recherche (bureau et 390) : « auch » → Auch (32) d'abord, 8 suggestions ; « le havre » → 1 ; « les sables » et « sables » → Les Sables-d'Olonne (85) puis Briosne-lès-Sables ; « st etienne » → Saint-Étienne (42) en tête ; « chateau » → Châteauroux… (accents/tirets ignorés) ; « 01300 » → 22 communes (Belley d'abord, « 01300 · Belley (01) ») ; « 75015 » → « 75015 · Paris (75) » ; « 33000 » et « 33 000 » → « 33000 · Bordeaux (33) » ; « 330000 », « 33 bordeaux », « zzzx », « -- » → « Aucune commune ne correspond. » ; 1 caractère → rien. Population en sous-texte.
- ARIA : input role=combobox, aria-label « Chercher une commune », aria-autocomplete=list, aria-expanded true/false, aria-controls, aria-activedescendant suit les flèches ; options role=option ; zone annoncée « 8 suggestions », « 1 suggestion », « 2 suggestions ».
- Clavier (bureau) : Entrée sur la loupe ouvre le champ avec le focus ; flèches haut/bas ; Échap 1 ferme les suggestions (valeur gardée), Échap 2 vide ; Entrée choisit la 1re ; le focus va au titre de la fiche (cadre noir visible). L'adresse ne change pas (`/?loyer=1200`).
- Fiche : Bordeaux « 56 min de la mer en voiture » puis « 173 km de la montagne à vol d'oiseau » ; Caen « 18 min » ; Le Havre 3 min ; Les Sables 4 min ; Aspremont « Temps en voiture jusqu'à la mer inconnu : compté 10 min d'après les km » puis « Commune de montagne » ; Arles « … compté 26 min d'après les km » puis « 55 km de la montagne… ». Aucun km de mer.
- Réglage 30 min : adresse `mer-min=30` ; Bordeaux « Mer 56 min : au-dessus de ton plafond de 30 min » ; Caen, Aspremont, Arles passent. 15 min : Arles « Mer ≈ 26 min : au-dessus de ton plafond de 15 min » ; Aspremont (≈ 10) passe.
- Réaction d'une pastille (bureau, clic jusqu'au compte mis à jour dans le DOM, swiftshader) : 37 à 62 ms sur 6 essais, sous 164 ms. Ne mesure pas le rendu de la carte.

- États codes postaux (bureau et 390, `page.route` sur codes-postaux.json) : réponse retardée de 13 s → « Chargement des codes postaux… » à 0,6 s puis « Codes postaux indisponibles. Cherche par nom ou réessaie dans un moment. » avant 11 s ; la recherche par nom marche pendant l'indisponibilité (8 suggestions pour « auch ») ; erreur 500 → un nouvel essai aussitôt (2 appels) puis le message ; nouvelle prise de focus (Annuler, loupe, saisie) → nouveaux appels (4). Captures : qa2-bureau-codes-indispo.png, qa2-390-codes-indispo.png, qa2-*-codes-chargement.png, qa2-*-codes-500.png.
- Champ après choix (H184) : bureau, le champ reste ouvert avec « Bordeaux (33) » ; 390, la recherche se ferme et la loupe est dans la tête de la feuille, au-dessus de la fiche (qa2-390-fiche-sables.png). « Effacer la recherche » vide le champ sans fermer la fiche et garde le focus sur le champ ; « Annuler » ferme le champ, rend le focus à la loupe, la fiche reste.
- Toucher (390, hasTouch) : choix d'une suggestion au tap, fiche dans la feuille, mêmes textes qu'en bureau (Bordeaux, Caen, Aspremont, Arles, Le Havre, Sables). Clavier 390 : mêmes résultats qu'en bureau (flèches, Échap x2, Entrée).
- Bas de l'onglet « Critères » à 390 : les mentions finissent la feuille, avec « Codes postaux : La Poste… (fichier du 17/11/2026) » et « Temps jusqu'à la mer : calculés avec openrouteservice, © OpenStreetMap contributors » (qa2-390-criteres-bas.png).
- Réaction d'une pastille à 390 (clic synthétique) : 32 à 53 ms.
- Requêtes vers d'autres sites pendant les recherches : seulement data.geopf.fr (fond de carte IGN, déjà prévu) ; aucune requête portant la saisie. Aucune réponse en erreur pendant recherche/choix (e7). Les 404 de la console sont apparus pendant le chargement de la carte, pas lors de la recherche ; non identifiés (leur adresse n'a pas été relevée hors recherche).

## Non vérifié
- Comparaison fine aux captures C-* / F-* (seulement regardé : loupe à droite du titre, champ + Annuler, suggestions avec population en sous-texte, conforme à la description de H177).
- Contrastes mesurés ; clavier virtuel d'un vrai iPhone (R20) ; lecteur d'écran réel (seuls les attributs ARIA et la zone annoncée sont lus).
- Temps de réaction réel de la carte (repeinte) : mesuré seulement jusqu'à la mise à jour du compte dans la page, sous swiftshader (logiciel, plus lent qu'un GPU, mais l'attente de repeinte n'est pas mesurée).
- Tab après un choix : le focus passe au titre de la fiche, puis à la carte, puis à la liste ; ordre jugé raisonnable, pas comparé à une règle écrite.
- Fond indisponible, états classée/aucune commune avec recherche : non forcés.
- Temps ≥ 1 h pour une commune sans temps (« ≈ 7 h ») non vu en fiche ; vu en raison pour Arles (« ≈ 26 min »). Aspremont/Arles donnent des minutes courtes parce que leurs km sont courts.
