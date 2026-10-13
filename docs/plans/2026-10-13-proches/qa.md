# QA navigateur — proches (2026-10-13)

Lancé en bureau 1 440 × 900 seulement, application sur localhost:5173, adresses publiques (Nantes, Toulouse, Rennes, Brest). Captures : `captures/qa/`. **Passe incomplète** : budget épuisé avant le 390 px.

## Constats

[Mineur] Pas de navigation aux flèches dans les suggestions — flèche bas puis Entrée ne choisit rien ; seul Tab puis Entrée marche. Le champ pointe `aria-controls` mais ne se comporte pas comme une liste de choix.
  Où : bureau, zone Tes proches, recherche « Toulouse »   Capture : captures/qa/02-suggestions-bureau.png (suggestions affichées)
  Attendu : clavier seul utilisable (marche avec Tab)   Correction : flèches haut/bas dans les suggestions, ou laisser tel quel (Tab fonctionne).

[Mineur] « Ajouter » coupé par la barre du compte quand le message « Aucune adresse trouvée. » s'affiche : le bouton est à moitié caché, le panneau défile sans signe visible.
  Où : bureau, état « aucune adresse »   Capture : captures/qa/08-aucune-adresse-bureau.png
  Attendu : état lisible en entier   Correction : réserver la place du bouton ou montrer qu'on peut défiler.

[Mineur] « + Ajouter un proche » est décalé de 4 px à gauche du reste de la colonne (bord à x=29 contre 33), et « Retirer » n'a aucun aspect de bouton.
  Où : bureau, avec proches   Capture : captures/qa/05-pret-bureau.png   Attendu : alignement de la colonne (Figma F-plein)

[Mineur, à confirmer] Pendant mon test, les curseurs loyer/mer ont changé seuls (1 200 → 1 150 €, 60 → 150 km) après des clics sur des références périmées pendant que la fiche était ouverte. Je n'ai pas pu isoler la cause (possiblement mon outil) ; non reproduit.
  Où : bureau, fiche ouverte   Capture : aucune propre

Aucun Bloquant ni Majeur vu.

## Ce qui est conforme
- Vide : texte et champ conformes ; suggestions (Nantes 12 rue de la Paix, communes « départ de la mairie ») ; « Nom » prérempli « Nantes (44) », « Ajouter » devient actif (03).
- Ajout : « Calcul des trajets depuis Parents de Léa… » et repère immédiats, pastille « calcul en cours » (04) ; prêt en 12 s, plafond 2 h, pastille « 2 h au plus » (05) ; l'adresse de la page reste `/?loyer=1200&mer=60`.
- Fiche : « TES PROCHES — Parents de Léa : 1 h 15 en voiture », pastille « 1 h 15 » (06), pas de mer en minutes (D14).
- Mémoire : après rechargement, proches prêts sans nouveau calcul (07, 10).
- « Aucune adresse trouvée. » (08) ; « En attente… » et calcul en parallèle, pastilles sur deux lignes (11) ; message « Aucune commune ne passe tes critères. Relâche le loyer, la mer, la taille ou un proche. » (10, 12) ; pied de page cite l'IGN pour la recherche et les trajets.
- Escape ferme la fiche (retour à la liste confirmé).

## Non vérifié
- Tout le 390 px (feuille, clavier ouvert, pas de pastilles, cibles 44 px) : non atteint, budget.
- État « plein » (5 proches) : 4 atteints, Lille non ajouté ; texte « 5 proches au maximum » non vu.
- Adresse déjà présente, recherche indisponible, indisponible/« Réessayer », mémoire refusée, retrait en cours de calcul, « Effacer mes proches », plafond réglé à 2 h 30 (La Rochelle/Bordeaux), pastille « au-dessus de » et raisons « ne passe pas ».
- Console et requêtes réseau, contrôle des valeurs arbitraires dans le CSS, passe Tab complète, comparaison fine aux frames Figma (faite sur les captures du dépôt `directions/F-*.png`, pas via Figma).
- Noter : un Tab+Enter mal ciblé de ma part a ouvert le site du Shom (lien du pied de page) ; sans envoi de données.
