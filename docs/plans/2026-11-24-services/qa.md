# QA navigateur — services

Statut : terminé (partiel : voir « Non vérifié », la carte WebGL ne s'affiche pas dans mon navigateur)

## Limite de l'essai (à lire d'abord)
Le navigateur sans tête n'a pas de WebGL et le mode avec fenêtre ne démarre pas dans ce poste (refus du système). La carte affiche donc « La carte n'a pas pu se charger. » et **tout le panneau est inactif** (boutons `disabled`). Je n'ai donc pu **ni cocher, ni naviguer au clavier, ni cliquer la carte**. Ce que j'ai pu faire : lire les réglages depuis l'adresse (`services=…`, `taille=`, `env=`, `montagne=`, `mer=`), qui sont appliqués au panneau, à la liste et à la fiche, et ouvrir des fiches depuis la liste. Largeurs vues : 1 440 × 900, 390 × 844, 375 × 548.

## Bloquant
Aucun constat.

## Majeur
Aucun constat.

## Moyen
### M1. Pied de page en bureau : 7 lignes, 112 px, et il bloque la carte en bas
- Largeur : 1 440 × 900.
- Étapes : ouvrir `/?loyer=1200`, lire le bas de l'écran.
- Attendu : mentions lisibles sans gêner la carte (système : pied de page discret).
- Vu : bloc blanc de 1 024 × 112 px (x 16 à 1040, y 772 à 884), texte à 11 px, 7 lignes ; il recouvre le bas de la carte sur 12 % de la hauteur et reçoit les clics (`elementFromPoint(600,850)` = le pied de page, pas la carte). Les deux mentions de R56 sont bien là, mot pour mot. Il grossit à chaque tranche.
- Capture : captures/qa/bureau-services-actifs-pied.png
- À 390 px il est dans le défilement de la feuille, complet et lisible : captures/qa/m390-pied-de-page.png

## Mineur
### m1. Fiche longue en bureau : le texte des limites est coupé en bas
- Largeur : 1 440 × 900. Étapes : `/?loyer=1200&services=medecin:5,gare:10`, ouvrir le 2e de la liste (Fépin).
- Attendu : fiche lisible. Vu : la carte de la fiche s'arrête à y = 884 ; la phrase des limites est coupée en pleine phrase (« … son temps part parfois de la ») et il faut défiler dans la fiche (901 px de contenu pour 866 visibles). Rien n'indique qu'on peut défiler.
- Capture : captures/qa/bureau-fiche-longue-pied.png
### m2. Si la carte ne charge pas, le bloc « Services en voiture » reste sur « Chargement des temps… » sans fin
- Les temps ne se demandent que quand la carte est prête (App.tsx, effet sur `prete`). Carte en erreur : la fiche dit « Chargement des temps… » (Ajaccio, Allarmont) et le panneau reste inactif, sans « Temps indisponibles » ni « Réessayer » propre aux temps. Cas rare (carte en panne), peut être jugé acceptable ; à décider.

## Vérifié, sans constat
- `/` devient `/?loyer=1200` ; « Services » est la dernière catégorie, après « Tes proches », ouverte, rien de coché ; 4 lignes, temps 5/10/15, 5/10/20, 10/20/30 comme R51 ; Scolarité a ses 5 niveaux, Gare ses 3 types, « Temps de trajet maximal » au-dessus des temps (H169). 390 px : conforme à F-cat-depart-390 (captures/qa/m390-services-depart-hors-carte.png), Gare « Toutes / Régionale / Grandes lignes » souligné.
- Adresse → panneau : `services=medecin:5,gare-regionale:20` coche « 5 min » du médecin et « Régionale » + « 20 min » (états `pressed` exacts) ; `ecole:20,college:20,gare-grandes-lignes:30` coche École, Collège, 20 min, Grandes lignes, 30 min (bureau, captures/qa/bureau-services-actifs-pied.png). Les filtres s'appliquent : 7 213 communes (médecin 5, gare 10), 9 385 (médecin 5, régionale 20), 12 474 (école, collège 20, grandes lignes 30).
- Groupes pour lecteurs d'écran : « Niveaux de scolarité », « Type de gare », groupes de temps nommés par leur ligne (H153).
- Fiches (valeurs et ordre des 10 lignes, phrase des limites, format « min » / « plus d'une heure ») : Mende (Gare régionale et grandes lignes « plus d'une heure », commune de montagne, captures/qa/bureau-fiche-mende.png) ; Ajaccio (« aucune en Corse » pour les deux gares, Gare 3 min) ; Bordeaux (1, 1, 1, 1, 2, 2, 3, 5, 7, 7 min) ; Fépin, Celles-sur-Plaine (375 × 548, bas de fiche lisible : captures/qa/m375x548-fiche-bas.png). Bloc placé sous le chômage. Alignement des valeurs à droite, séparateurs, conformes à F-fiche-auch-390.
- Pied de page : les deux mentions de H164 et H172 sont présentes et exactes.
- Sans plafond : état « Fixe un loyer ou une distance à la mer… » inchangé.

## Non vérifié (et pourquoi)
- Cocher/décocher, changer le niveau de gare, Scolarité incomplète (phrase H153), résumé de la catégorie repliée (« Peu importe », « 1 choix »), adresse réécrite après un clic : panneau inactif sans carte.
- Session au clavier et ordre du focus : idem (boutons inactifs).
- États de chargement et d'erreur des temps (R57, « Réessayer ») : pas d'interception réseau disponible ; seul « Chargement des temps… » vu (voir m2).
- Fiches d'Auch et de L'Île-d'Yeu (jamais dans les 10 premières de mes filtres), fiche d'une commune écartée (raisons de R53, étape 4 de la vérification : demande un clic sur la carte), Le Havre et Les Sables-d'Olonne.
- Bloc de la fiche sous « Tes proches » : ajouter un proche demande le panneau actif ; non essayé, service d'adresse IGN non testé.
- Copie de l'adresse dans un nouvel onglet (étape 6) : l'ouverture de l'adresse avec `services` donne bien les mêmes réglages (vu), mais pas la copie elle-même.
- À refaire avec un navigateur à WebGL (fenêtre visible) pour les points ci-dessus.
