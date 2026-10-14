# QA navigateur — interface téléphone (2026-10-14)

Serveur de dev http://localhost:5190/ (vraies données, vrai fond IGN), studio-browse (Chromium avec fenêtre). Captures : `captures/qa-*.png`.
Proches essayés : « 12 rue de la Paix, Nantes » et « place du Capitole, Toulouse » (adresses publiques).

## Constats

Bloquant : aucun. Majeur : aucun.

[Mineur] Onglets « Critères » / « Les 10 premières » hauts de 36 px — la cible au toucher est sous les 44 px que H48 donne comme raison d'être de la barre ; au-dessus du minimum de 24 px, donc pas une faute d'accessibilité.
  Où : feuille ouverte, 390 × 844 (mesure : 36 px, la tête de feuille fait 47 px).   Capture : captures/qa-390x844-criteres.png
  Attendu : cibles ≥ 44 px au toucher (H48), la capture F-criteres.png montre des onglets plus hauts.   Correction : porter la hauteur des onglets à 44 px, ou noter l'écart dans le contrat.

[Mineur] Doublon du compte sur l'onglet « Les 10 premières » — « 703 communes passent tes critères » est dit deux fois à 20 px d'écart (tête de feuille, puis sous « LES 10 PREMIÈRES »). Même chose en « Aucun plafond fixé » (tête) puis « Fixe un loyer… » (liste) : ce second texte est différent, donc seul le premier cas fait doublon.
  Où : onglet « Les 10 premières », 390 × 664.   Capture : captures/qa-390x664-liste.png
  Attendu : H43 « le compte est en tête de la feuille, sur les deux onglets » ; la liste de loyer-mer garde son propre compte.   Correction : retirer le compte de la liste sous 1 024 px (à décider ; la tête de feuille suffit).

[Mineur] Ronds regroupés de 22 px de haut (bouton « Communes 2, 3, 4, 7, 8, 9 : zoomer… ») — sous le minimum de 24 px des cibles. Hérité de loyer-mer, mais visible d'emblée maintenant que la carte s'ouvre dézoomée, où les ronds se chevauchent (« 1·5·6·10 » sous le pin « Nantes (44) »).
  Où : ouverture, 390 × 844 et 375 × 548.   Capture : captures/qa-390x844-criteres.png, captures/qa-375x548-criteres.png
  Attendu : cible ≥ 24 px (principe 5).   Correction : 24 px minimum de hauteur au toucher.

[Mineur, hors tranche] Console : 404 sur les tuiles d'estompage IGN (`ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW`, zoom 6), un 401, et des « Failed to fetch » sur `metadata.json` et le sprite `PlanIgn.json` de data.geopf.fr (au premier chargement). Aucune erreur du code du site ; je ne sais pas si le 401 vient du service IGN ou d'une requête du site (non identifié).
  Où : console, tout chargement.

## Ce qui est conforme
- Ouverture à 390 × 664, 390 × 844 et 375 × 548 : communes colorées sans zoomer, feuille ouverte sur « Critères », compte en tête, identique à F-criteres.png (R16, D2). Sans plafond : « Aucun plafond fixé », curseur du loyer visible à 375 × 548 (bas à 538 px).
- Repli : barre de 51 px collée en bas, la carte ne bouge pas, état « déplié » correct (aria-expanded) ; focus sur « Déplier la feuille » après le repli ; Entrée déplie. Fiche : « ← Les 10 premières » seul dans la feuille, repli puis dépli rendent la fiche, retour affiche la liste et rend le focus à la ligne « 1 · Lessay » (R19, H47).
- Onglets : flèche droite passe sur « Les 10 premières » (rôle tab, sélection), défilement conservé après changement d'onglet et repli (R18).
- Aucune commune (`loyer=300&mer=60`) : message de bande + compte en tête ; feuille repliée, seule la barre le dit (H50). Sans plafond replié : « Aucun plafond fixé ».
- Ajout (390 × 664) : seule la poignée au-dessus du champ ; champ, 4 suggestions et « Ajouter » tiennent au-dessus de y = 342 ; après choix, « Nom » (bas 207 px) et « Ajouter » (259 px) aussi (R20, mesure du navigateur sans vrai clavier). Le proche se calcule et le compte se met à jour.
- Bureau : à 1 440 × 900, ni onglets ni bouton de repli, réglages et liste côte à côte ; bascule à 1 023 (onglets + bouton) / 1 024 (rien) correcte (AC-9).
- Ordre de Tab cohérent, anneau de focus de 2 px partout ; ordre : carte, ronds, zoom, tête de feuille, onglets, réglages.

## Non vérifié
- Glisser de la poignée et de la barre, seuils 10 px / 80 px (H46), défilement contre glisser : studio-browse ne permet pas d'envoyer d'événements tactiles (`Input.dispatchTouchEvent` refusé).
- Vrai clavier iPhone (R20 sur Safari) : seulement les positions mesurées en fenêtre 390 × 664.
- Fond IGN indisponible et état chargement : l'outil ne bloque pas de requêtes ; message de fond non vu, position H50 non vue.
- Proche qui finit son calcul feuille repliée (AC-11) : le 2e proche (Toulouse) est tombé en « Trajets indisponibles » (probablement la clé de routage du serveur de dev) ; la barre est restée à 703. Test non concluant, à refaire avec un calcul qui aboutit.
- Contenu long à 5 proches : seulement 2 proches ajoutés (budget et service de routage en erreur).
- « Effacer mes proches » (défaut connu) et clic fantôme au dépli : non essayés.
- Animation ≤ 300 ms (H45) et réduction des animations : non mesurées.
- Comparaison Figma : captures `F-*.png` seulement, Figma non lu.
