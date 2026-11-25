# Brief — recherche et mer en minutes
2026-11-25 · Spec : [docs/specs/2026-11-25-recherche-et-mer/](../../specs/2026-11-25-recherche-et-mer/spec.md) · Temps convenu : 1 h de Vincent, 1 session · Support : prototypes en code, `?variant=A|B|C`, sans Figma, sans références, sans croquis (choix de Vincent)

## Grille de jugement
1. **Trouver une commune en trois secondes** : le moyen de chercher se voit à l'ouverture, en bureau comme au téléphone ; on distingue deux homonymes (« Saint-Denis (93) », « Saint-Denis-d'Oléron (17) ») et une suggestion par code (« 33000 · Bordeaux (33) ») ; les 12 communes d'un code se parcourent (liste qui défile) ; tout au clavier (R58, R59, H186).
2. **Ne rien casser au téléphone** : à 375 × 548, le curseur du prix reste visible à l'ouverture (H48) et la carte montre toute la métropole au-dessus de la feuille (AC-1 d'interface-telephone) ; au focus, le champ et ses suggestions restent au-dessus du clavier (R20) ; le champ reste atteignable quand une fiche est ouverte (H177). **Mesure du 2026-11-25** : à 375 × 548, le curseur est à environ 20 px du bas ; un champ visible au repos (44 px et son écart) le fait sortir de l'écran, sauf à monter la feuille, donc à réduire la carte.
3. **km ou min sans mode d'emploi** : la bascule se lit comme l'unité de la ligne « Mer à moins de » et non comme un nouveau filtre ; changer d'unité garde la position du choix (H190) ; « ≈ » distingue un temps compté d'après les km (H192).
4. **Des minutes crédibles** (le risque de la spec) : dans la fiche, les km puis le temps, sans que l'un passe pour l'autre ; le cas « inconnu : compté 7 h d'après les km » se lit sans alarmer (R63).
5. **Pied de page pas plus haut** : deux mentions de plus (R63) sans allonger le pied de bureau, qui fait déjà 127 px sur 7 lignes et couvre le bas de la carte (mesuré à 1 280 × 800 ; défaut « Moyen » de la QA de services).

## Ressenti
Celui du reste du panneau : sobre, encre et papier. La recherche est un raccourci, pas l'entrée du site : la carte reste l'écran principal.

## Références
Aucune (choix de Vincent). Points d'appui dans le [système](../system/README.md) : champ à suggestions du métier (emploi) et Suggestion d'adresse (proches), Bascule mer (dessinée pour proches, jamais construite), Choix souligné, Segmenté d'unité, Cases collées, Tête de feuille et Onglets de feuille.

## Système visuel
Celui du projet ([contrat](../system/README.md)), aucun jeton nouveau sauf besoin démontré par une piste (alors dit). Champ : `card`, `border`, `radius`, texte `texte` (16 px à 390 px, `taille-saisie`) ; suggestions : `texte-fort` pour le nom, `secondaire` `muted-foreground` pour le code et le département, chiffres tabulaires ; bascule cochée en `primary`. Aucune couleur de donnée dans le champ, les suggestions ou la bascule.

## Échelles de données
Sans objet : rien de nouveau n'est coloré ; la carte garde ses paliers. La commune choisie par la recherche prend le double contour de la commune choisie.

## Contenu réaliste commun
- Recherche par nom, données réelles de `communes.json` : « auch » → Auch (32) ; « les sables » → Les Sables-d'Olonne (85) ; « st etienne » → Saint-Étienne (42) en tête ; « saint-denis » → Saint-Denis (93) puis les autres.
- Recherche par code : **échantillon écrit à la main pour le prototype, à vérifier en tâche 0** (la base de La Poste n'est pas encore téléchargée) : 33000 Bordeaux, 32000 Auch, 14000 Caen, 85100 Les Sables-d'Olonne, 42000 Saint-Étienne, 75015 Paris, et 01300, code partagé par une quinzaine de communes autour de Belley (liste qui défile).
- Temps jusqu'à la mer : **inventés pour le prototype** (km × 1,25 + 5, arrondis), à remplacer par ceux d'openrouteservice en tâche 0 ; les îles sans pont sont « sans temps » pour montrer « ≈ ». Bordeaux : 39 km et environ 54 min ; Caen : 14 km et environ 23 min ; Auch : km réels et « ≈ » si sans temps.
- Réglage d'exemple : mer en « min », « 30 min » cochée.

## Écrans
**Recherche** (bureau : en tête des réglages pour A et C, en tête du panneau de droite pour B ; téléphone : voir les pistes) :
1. Champ nommé « Chercher une commune », texte dans le champ « Nom ou code postal » (H178), loupe à gauche ; après un choix, « Auch (32) » et le bouton « Effacer la recherche » (H184).
2. Suggestions : « Auch (32) » par nom ; « 33000 · Bordeaux (33) » par code ; 8 au plus, toutes pour un code complet ; nombre annoncé « 2 suggestions » (H186).
3. Messages à la place des suggestions : « Aucune commune ne correspond. » ; « Chargement des codes postaux… » ; « Codes postaux indisponibles. Cherche par nom ou réessaie dans un moment. »

**Mer**, catégorie « Cadre de vie » :
1. « Mer à moins de » et la bascule « km » / « min », groupe « Unité de la mer » (H189).
2. Pastilles « 10 km », « 30 km », « 50 km », « 100 km » ou « 15 min », « 30 min », « 1 h », « 1 h 30 ».

**Fiche** : « 39 km de la mer à vol d'oiseau », puis « 54 min de la mer en voiture » (ou « Temps en voiture jusqu'à la mer inconnu : compté 7 h d'après les km »), puis la ligne de la montagne (R63). Textes fixés par la spec : les pistes ne les changent pas.

**Liste** en « min » : dernière colonne « 54 min », « ≈ 7 h » (R62).

**Pied de page** : « Codes postaux : La Poste, base officielle des codes postaux » et « Temps jusqu'à la mer : calculés avec openrouteservice, © OpenStreetMap contributors » en plus (R63).

## Pistes (une à la fois, chacune contre les précédentes)
| | Champ en bureau | Champ au téléphone | Suggestions | Bascule mer | Pied de page en bureau |
|---|---|---|---|---|---|
| **A** | en tête des réglages, toujours visible | loupe dans la tête de la feuille, à droite du compte ; touchée, la tête devient le champ et la feuille monte | liste posée par-dessus le panneau (ombre) | Bascule mer du système : « km \| min » collés, à droite de « Mer à moins de » | tel quel, + 2 mentions (mesuré) |
| **B** | en tête du panneau de droite, au-dessus des 10 premières : on cherche là où la fiche s'ouvre | champ toujours visible au-dessus des onglets ; la feuille monte d'autant et la carte rétrécit (mesuré à 375 × 548) | remplacent la liste des 10 premières pendant la frappe | Choix souligné « km » / « min » sous « Mer à moins de » | une ligne « Sources et mentions » qui se déplie (**à trancher par Vincent** : la manière d'afficher des mentions obligatoires est à lui) |
| **C** | en tête des réglages, plus compact (dans la ligne du titre) | loupe en bout de rangée des onglets ; touchée, la rangée devient le champ | dans le flux, poussent le contenu ; lignes plus riches (population en sous-texte) | Segmenté d'unité, demi-largeur, sous « Mer à moins de » | mentions déplacées en bas du panneau de réglages : plus rien sur la carte |

## Pas voulu
Barre de recherche posée sur la carte au téléphone (gêne les pastilles des proches, H177) ; icônes de vague, de voiture ou de mer ; couleur de donnée sur les temps ; badge « nouveau » ; liste déroulante pour choisir l'unité ; un temps sans « ≈ » quand il vient des km ; un mot qui promet un trajet réel (« depuis chez toi », « trajet garanti ») ; recherche d'adresse.
