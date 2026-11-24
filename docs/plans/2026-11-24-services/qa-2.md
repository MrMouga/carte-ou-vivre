# QA navigateur 2 — services (WebGL, Playwright)

Statut : terminé

Méthode : scripts Playwright dans `captures/qa/` (`qa2-lib.mjs`, `qa2-a.mjs` à `qa2-f.mjs`), Chromium avec SwiftShader, bureau 1 440 × 900 à la souris et au clavier, 390 × 844 au toucher, version construite sur http://localhost:4180, vraies données. La carte s'est chargée à chaque essai (fond Plan IGN, communes colorées). Captures en JPEG (sous 600 Ko) : `captures/qa/qa2-*.jpg`. Aucune erreur de console pendant les gestes du point 1 à 3.

## Bloquant
Aucun constat.

## Majeur
Aucun constat.

## Moyen
Aucun constat nouveau. Le constat M1 de la première QA (pied de page de 7 lignes qui recouvre le bas de la carte) reste vrai, vu à nouveau sur toutes les captures bureau (par ex. `qa2-bureau-scol-incomplete-1440.jpg`, bloc de x 16 à 1040, y 772 à 884). Il vient de la somme des mentions de toutes les tranches ; non retraité ici.

## Mineur
### m1. Résumé de « Services » replié : Scolarité à deux niveaux compte « 1 choix »
- Largeur : 1 440 × 900 (même résultat à 390).
- Étapes : cocher Crèche + Supérieur + `20 min` (adresse `services=creche:20,superieur:20`), replier la catégorie.
- Attendu : « Peu importe », « 1 choix », « 2 choix » (mission, details.md). La spec ne dit pas si Scolarité compte une ligne ou un service par niveau.
- Vu : « 1 choix » (une ligne). Médecin 10 + Commerce 15 donne bien « 2 choix », rien donne « Peu importe ». Cohérent avec « une ligne = un choix » ; à confirmer par Vincent si on voulait compter les niveaux (ici 2 services filtrés).
- Capture : captures/qa/qa2-bureau-scol-active-1440.jpg (déplié) ; résumé lu dans le DOM.

### m2. Le focus n'avance pas aux flèches dans une rangée de boutons
- Largeur : 1 440 × 900. Étapes : focus sur `10 min` de Médecin, flèche droite.
- Attendu : la règle d'interface ne l'exige pas pour des boutons à bascule (Tab suffit) ; noté seulement.
- Vu : rien ne bouge, chaque bouton est un arrêt de Tab (20 arrêts dans la catégorie). Pas d'écart avec la spec (H153 : « boutons à bascule comme les distances de la mer »).

## Vérifié, sans constat

### 1. Cocher / décocher, adresse, liste (bureau)
- `Médecin 10 min` → `/?loyer=1200&services=medecin:10`, 27 895 communes, liste mise à jour (Allarmont, Bréménil…) ; `5 min` remplace `10 min` ; retoucher la pastille cochée la décoche, adresse `/?loyer=1200`, 34 674. Médecin 10 + Commerce 15 → 27 756. Le médecin choisi seul à 5 min : 14 170 communes (rechargement avec cette adresse).
- Gare : choisir « Grandes lignes » sans temps ne filtre pas et n'écrit rien dans l'adresse. Avec `10 min` : Grandes lignes 986 communes, Régionale 5 971, Toutes 11 312 (adresses `gare-grandes-lignes:10`, `gare-regionale:10`, `gare:10`) ; le niveau suit sans décocher le temps ; décocher le temps retire l'entrée.
- Capture : captures/qa/qa2-bureau-toggles-1440.jpg.
- 390 × 844 au toucher : tap sur chaque pastille, mêmes adresses que le bureau (`ecole:10` → 33 415 communes, + Grandes lignes 20 → `ecole:10,gare-grandes-lignes:20`, 5 613). Cibles : 44 px de haut partout (Médecin 5 min 69 × 44, École 56 × 44, Gare 10 min 118 × 44). Captures : qa2-m390-scol-incomplete.jpg, qa2-m390-actifs.jpg.

### 2. Clavier, session complète dans la catégorie
- Ordre du focus (bureau) : curseur du loyer → … → « Tes proches » → Médecin 5, 10, 15 → Commerce 5, 10, 15 → Crèche, École, Collège, Lycée, Supérieur → Scolarité 5, 10, 20 → Type de gare Toutes, Régionale, Grandes lignes → Gare 10, 20, 30 → première ligne de la liste (la page sort de la catégorie, rien de piégé). Ordre = ordre visuel et ordre du panneau.
- Entrée et Espace cochent et décochent (Entrée sur Médecin 5 → `medecin:5` ; Tab puis Espace sur 10 min → `medecin:10`, 5 min décoché). Le focus reste sur le bouton touché.
- Focus visible : contour plein de 2 px (couleur du texte) sur chaque bouton, bien lisible (capture qa2-bureau-focus-1440.jpg sur Lycée, qa2-bureau-focus-gare2-1440.jpg). Le bouton focalisé n'est jamais caché par la barre « n communes passent » (vérifié par `elementFromPoint` sur Gare : Toutes, Régionale, Grandes lignes, 10 min) : le panneau défile pour le montrer.

### 3. Scolarité incomplète / active, résumé replié
- École seule ou École + Lycée : phrase « Coche au moins un niveau et un temps. » visible sous les temps, 34 674 communes, rien dans l'adresse. `+ 10 min` : `services=ecole:10,lycee:10`, 8 872, phrase partie. Retirer les niveaux (temps seul) : phrase de retour, adresse sans services. Tout décocher : phrase partie. Capture : qa2-bureau-scol-incomplete-1440.jpg, qa2-bureau-scol-active-1440.jpg.
- Résumé replié : « Peu importe », « 1 choix », « 2 choix » (voir m1). Capture : qa2-bureau-replie-1440.jpg.

### 4. États de R57
- Fichier retardé (porte levée à la main), bureau : carte et liste affichées ; 21 boutons de « Services » inactifs (tous les temps, niveaux et types de gare) ; fiche d'Allarmont : « SERVICES EN VOITURE » puis « Chargement des temps… » à la place des lignes et des phrases ; à l'arrivée, les 10 lignes et la phrase des limites apparaissent. Captures : qa2-bureau-retard-categorie-1440.jpg, qa2-bureau-retard-fiche-1440.jpg.
- Fichier en erreur (500) : « Temps des services indisponibles. » et « Réessayer » dans la fiche (2 alertes : catégorie + fiche) ; « Réessayer » dans la fiche rétablit tout : 0 alerte, boutons actifs, les lignes reviennent, le focus va sur le titre « Services en voiture ». Capture : qa2-bureau-reessayer-fiche-1440.jpg. À 390 : l'erreur de la catégorie, puis « Réessayer » : rétabli (0 alerte). Capture : qa2-m390-erreur.jpg.
- `services=medecin:5` dans l'adresse, fichier retardé 6 s : ni liste ni carte prête (la page attend), l'adresse est gardée ; à l'arrivée : liste filtrée de 14 170 communes. Capture : qa2-bureau-retard-adresse-1440.jpg.
- `services=medecin:5` dans l'adresse, fichier en 500 : page entière « La carte n'a pas pu se charger. » + « Réessayer », adresse gardée, aucune liste non filtrée (comportement des autres données, H140 ; le libellé parle de « carte » alors que ce sont les temps, acceptable selon R57). Capture : qa2-bureau-erreur-adresse-1440.jpg.

### 5. Fiches (bureau, mêmes valeurs à 390 sur les trois vues prises)
- Auch : 2, 2, 3, 2, 3, 3, 4, 4, 4 min et Gare grandes lignes « plus d'une heure », phrase des limites, pas de phrase d'île ; « zone d'emploi d'Auch ». Le Havre : 2, 1, 2, 1, 2, 3, 4, 6, 6, 6 ; « zone d'emploi du Havre ». Les Sables-d'Olonne : 2, 2, 3, 2, 4, 4, 9, 5, 5, 4 ; « zone d'emploi des Sables-d'Olonne ». Les noms s'élident bien ; le bloc lui-même n'insère aucun nom.
- L'Île-d'Yeu : Médecin, Lycée, Supérieur « pas de chiffre » ; les trois gares « aucune sur l'île » ; phrase de la traversée « Île sans pont : un temps peut compter la traversée, sans l'attente du bateau. » présente. Elle passe avec `medecin:5,commerce:5` (sans chiffre = passe, D7) et ne passe pas avec `gare:10` : raison « Gare : aucune sur l'île ». Captures : qa2-fiche-yeu-1440.jpg, qa2-fiche-yeu-390.jpg, qa2-fiche-yeu-ecartee-1440.jpg.
- Commune écartée, raisons : Mende, `loyer=400&mer=10&services=gare-regionale:20,medecin:5` → « Loyer 521 € : au-dessus de ton plafond de 400 € », « Mer 110 km : … 10 km », « Gare régionale plus d'une heure : au-dessus de ton plafond de 20 min » (ordre de H160 : prix, mer, gare ; Médecin 2 min ne figure pas, juste). Sans plafond (`/?services=gare-regionale:20`) : la raison du service seule apparaît (spec : y compris sans plafond). Auch avec `loyer=100&services=medecin:5,creche:5,gare-grandes-lignes:10` : « Gare grandes lignes plus d'une heure : au-dessus de ton plafond de 10 min » (le loyer 521 € dépasse aussi 100 € : voir Non vérifié). Captures : qa2-fiche-mende-ordre-1440.jpg, qa2-fiche-mende-sans-plafond-1440.jpg, qa2-fiche-auch-multi-1440.jpg.

### 6. Bloc de la fiche sous « Tes proches »
- Voir « Non vérifié » : la recherche d'adresse ne répond pas ici.

## Non vérifié
- **Bloc sous « Tes proches »** : saisie de « Toulouse » ou d'une adresse dans « Adresse ou ville » : aucune suggestion en 3 s puis 6 s, « Ajouter » reste inactif (la recherche d'adresse IGN ne répond pas dans cet environnement, ou n'est pas joignable). Je n'ai donc pas vu le bloc proches ni sa position au-dessus de « Services en voiture ». Captures de l'essai : qa2-proches-1440.jpg.
- Fiche de la commune écartée avec le loyer : à `loyer=100` ou `200` (sous le minimum du curseur) la fiche d'Auch/Mende n'affiche pas la raison du loyer dans deux cas (Mende `loyer=200` seulement la gare ; Auch `loyer=100` seulement la gare) alors que `loyer=400` la montre. Probablement une valeur hors du curseur ignorée par l'adresse (comportement du loyer, pas des services) ; non creusé.
- 390 × 844 : états « Chargement des temps… » et fiche en erreur (seule la catégorie en erreur et « Réessayer » ont été vus) ; fiches d'Auch, Le Havre, Sables au toucher (Yeu et Mende vus en capture 390 sans toucher de la carte, la fenêtre redimensionnée).
- Espace insécable avant « : » et dans « 100 000 » (H159) : le texte lu par le navigateur est normalisé par mon script ; non contrôlé caractère par caractère.
- Lecteur d'écran réel : seuls les noms de groupes (« Niveaux de scolarité », « Type de gare », groupes de temps) ont été lus dans l'arbre d'accessibilité ; pas d'annonce vocale.
- Fiche en bureau sous un proche ajouté, copie de l'adresse dans un nouvel onglet : l'ouverture d'adresses avec `services` marche (vu plus haut), mais pas la copie.
