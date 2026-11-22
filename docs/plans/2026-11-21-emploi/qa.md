# QA navigateur — emploi

Statut : terminé

Faits : bureau 1 440 × 900, 390 × 844 et 375 × 548 (vraies données, navigateur avec WebGL ; le « toucher » est simulé par la taille de fenêtre et des clics, pas un vrai écran tactile).
Captures : `captures/QA-*.png`.

## Constats

### Majeur
Aucun pour l'instant.

### Mineur
1. **Deux raisons de métier collées dans la fiche** — bureau, commune Maulichères (32), `?loyer=aucun&metier=V1X80:10,M2X90:10` ; ouvrir la fiche en cliquant la commune sur la carte. Attendu (R46, H139) : une raison par métier, lisible. Vu : les deux phrases (longues, en gras) sont deux `<li>` sans espace entre elles, elles se lisent comme un seul bloc de 8 lignes. Capture : `QA-bureau-fiche-deux-raisons.png`. Correction : un petit espace entre les `<li>` des raisons de métier.
2. **Flèche bas jusqu'à la 8e suggestion : elle sort de la zone visible** — bureau, champ « Ton métier », taper « ing », 8 fois flèche bas. Attendu : la suggestion en surbrillance reste visible. Vu (mesuré) : la 8e option est à y = 838 à 875 px alors que le panneau s'arrête à 723 px ; le panneau ne défile pas avec la flèche. Capture : `QA-bureau-suggestions-8.png` (liste avant les flèches). Correction : `scrollIntoView({block:'nearest'})` sur l'option active.
3. **Anneau de focus des pastilles tronqué** — 390 et bureau, focus sur « 10 % » après le choix d'un métier. Attendu : focus visible (ui.md). Vu : contour de 2 px (mesuré : `outline 2px solid`, offset 2 px) visible à gauche, dessus et dessous mais coupé à droite par la case voisine (capture agrandie). Le focus reste repérable, d'où Mineur. Cause non confirmée. Capture : `QA-focus-pastille-zoom.png`.
4. **Champ « Ton métier » désactivé tant que la carte n'a pas chargé** — navigateur sans WebGL (`La carte n'a pas pu se charger`) : les six fichiers de données sont reçus (200) mais le champ reste `disabled`. Attendu (H140, H3 de la spec : chargement et erreur comme les données des communes). Vu : l'utilisateur sans carte ne peut pas choisir de métier, alors que liste et fiche marchent. Pas de capture dédiée (état vu avant le passage en WebGL ; cas rare). À confirmer si voulu.

## Ce qui est conforme
- **Sans métier** (bureau, 390) : champ « Ton métier » vide, phrase sur l'État, résumé de la catégorie entre « Vie locale » et « Tes proches » (H129). Captures `QA-bureau-sans-metier.png`, `QA-sans-metier-390.png`.
- **1 caractère** : aucune suggestion ; **aucun résultat** : « Aucun métier trouvé » (`QA-bureau-aucun-metier.png`).
- **Suggestions** : 8 au plus, libellés longs sur plusieurs lignes, 1re en surbrillance, flèches haut/bas bornées, Entrée choisit, Échap vide le champ (`QA-bureau-suggestions-8.png`, `QA-suggestions-8-390.png`).
- **Un métier** : libellé en gras, « Retirer » à droite, 3 pastilles, phrase « Coche un niveau… » tant que rien n'est coché, lien « + Ajouter un second métier » ; focus sur « 10 % » après le choix (clavier et toucher) ; adresse `metier=V1X80`, puis `V1X80:10` (Espace sur la pastille) ; carte et compte à jour (6 216 communes à 1 200 €, 216 au total). Captures `QA-bureau-un-metier-10.png`, `QA-un-metier-390.png`.
- **Retirer** (bureau) : adresse sans `metier`, focus rendu au champ « Ton métier ».
- **Ajout en cours** : champ « Second métier » focalisé ; Tab depuis le champ vide sort vers « Tes proches » et le champ reste ouvert (H145) ; Échap vide puis referme. `QA-bureau-ajout-en-cours.png`, `QA-ajout-390.png`.
- **Deux métiers** : adresse `metier=V1X80:10,M2X90:10` (et rechargée : mêmes réglages) ; pas de lien d'ajout ; « Chiffré dans peu de bassins : la carte en oublie sûrement. » sous les ingénieurs en informatique (R50/H147). `QA-bureau-deux-metiers.png`, `QA-deux-metiers-390.png`.
- **Fiche, exemples de la spec sur vraies données** : La Rochelle : « aucun bassin parmi les 10 % … (le plus proche : La Roche-sur-Yon, 61 km) » ; Pau avec les deux métiers : « (le plus proche : Bayonne, 92 km) » ; Bordeaux et Pau colorés avec infirmiers seuls (Pau sort avec les ingénieurs). Ligne « Chômage : 7,7 % dans la zone d'emploi de La Rochelle (2e trimestre 2026) ». Ligne de métier « … : bassin de La Rochelle, 66 recrutements prévus en 2026 », libellé en gras. Mots de D6 respectés (« recrutements prévus », pas d'« offres »). Espaces insécables dans « 10 % », « 30 km », « 61 km ». Captures `QA-bureau-fiche-larochelle.png`, `QA-bureau-fiche-pau.png`.
- **Pied de page** : mentions France Travail (table du 17/04/2026) et Insee chômage (2e trimestre 2026) présentes, bureau et dans la feuille à 390.
- **Zones de toucher à 390** : « Retirer » 45 × 44, « + Ajouter un second métier » 153 × 44, pastilles 44 de haut. La feuille monte et le champ reste visible en haut pendant la frappe.
- **375 × 548 (H48)** : à l'ouverture le curseur du prix est entièrement visible (haut 518 px, bas 536 px, fenêtre 548) ; choisir un métier : la feuille monte, le champ est à 84 px du haut, la suggestion à 133 px, puis le focus arrive sur « 10 % » (385 à 429 px), tout visible.
- **Clavier** : ordre après « Retirer » : 10 % → 25 % → Partout où il recrute → + Ajouter un second métier → Tes proches ; focus visible partout (contour 2 px) ; Entrée sur la pastille cochée la décoche (adresse `metier=V1X80`, la phrase « Coche un niveau… » revient).
- Console : seules erreurs : tuiles du fond IGN (401, 404, estompage) = déjà suivi, hors tranche. Aucune erreur pendant le parcours ; toutes les requêtes de données en 200.

## Non vérifié
- Fond de carte et rendu de la carte à 390 non analysés (hors périmètre).
- **Erreur de chargement d'`emploi.json`** : je n'ai pas d'outil pour bloquer un fichier dans le navigateur de test ; non provoquée (seul cas vu : le champ désactivé sans WebGL, constat 4).
- **État « chargement »** (champ désactivé le temps du fichier) : vu seulement dans le cas sans WebGL, pas en chargement normal (trop bref).
- **Retirer au clavier avec deux métiers** (focus sur le « Retirer » du métier restant, T3a) et **Retirer du dernier métier au toucher** (feuille qui remonte, T4) : une tentative clavier n'a pas atteint le bon bouton (mes Maj+Tab), pas refaite. Retirer d'un seul métier au bureau vu (focus sur le champ).
- **Vrai iPhone / clavier à l'écran** (AC-13) : non testable ici.
- **Résumé replié** (« Peu importe », « 1 métier », « 2 métiers ») : non vérifié.
- **Texte « 10 %/25 %/tous » dans la fiche pour les niveaux 25 et tous** et le cas « à moins d'1 km » / « sur place » : non vus.
- Bureau : défilement de la fiche et du panneau sur la 8e suggestion déjà noté (constat 2).
