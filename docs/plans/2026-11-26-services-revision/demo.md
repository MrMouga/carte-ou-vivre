# Démo — services, révision D19, D20 (urgences, supermarché)
2026-11-27 · **acceptée** (Vincent, 2026-11-27 ; pari : « tout marche, données justes ») · retouches 1 faites : urgences de Chamonix-Mont-Blanc et supermarché de Tende retirés, « pas de chiffre » (D12, H210, AC-13 amendé ; commit 2189131 ; suite verte, 520 tests) · Plan : [plan.md](plan.md) · Progression : [progress.md](progress.md)

> AC = critère d'acceptation de la spec ; Bloquant / Majeur / Mineur = gravité donnée par un relecteur neuf ; une preuve = capture ou sortie de commande, datée.

## Ce qui est construit
- **Tâche 0, les données** : le fichier des temps donne pour chaque commune le temps jusqu'aux **urgences** (services d'urgence et SMUR, Insee D106) et jusqu'au **supermarché** (supermarchés et hypermarchés, B104 et B105 : l'épicerie ne compte plus). Les 9 autres temps sont identiques, caractère pour caractère, à ceux déjà en ligne. Le fichier pèse 331 Ko compressé, sous la limite de 350 Ko.
- **Tâche 1, l'écran** : dans « Services », une ligne « Urgences » (15, 30 ou 45 min) juste après « Médecin », et « Supermarché » (5, 10 ou 15 min) à la place de « Commerce alimentaire ». La fiche d'une commune donne 11 temps, et la phrase des limites dit ce que les urgences comptent (« services d'urgence et SMUR, sans savoir s'ils accueillent sans appel au 15 »). Un ancien lien qui contient `commerce` perd ce filtre sans casser la page.
- **Tâche 2, le fichier final** : `commerce` a disparu du fichier servi, et la vérification de bout en bout de la spec passe en 8 étapes sur la version construite, en bureau et à 390 px.
- **Pour l'essayer** : `npm run dev`, puis http://localhost:5173/?loyer=1200 ; ouvre « Services », coche « 30 min » pour « Urgences », cherche Saint-Véran (écartée), puis Auch (Urgences 6 min, Supermarché 2 min). Ancien lien : http://localhost:5173/?loyer=1200&services=commerce:5,medecin:10.

## Preuves
- Catégorie à 5 lignes : [bureau](captures/T1-cat-exemple-1440x900.png), [390 px](captures/T1-cat-exemple-390x844.png).
- Fiche d'Auch, vraies données, 11 lignes : [capture](captures/T1-fiche-auch-reel-1440x900.png).
- Saint-Véran écartée par « Urgences 55 min : au-dessus de ton plafond de 30 min » : [capture](captures/T2-e5-saint-veran-1440x900.jpg).
- Bout en bout (8 étapes, bureau et 390 px) : [sortie](captures/T2-bout-en-bout.txt), captures `captures/T2-e1…e8-*`.
- Contrôles des données : [mesure-tache-0.md](mesure-tache-0.md) (tous « ok », comptes du supermarché égaux à la mesure de la spec, 9 chaînes identiques).
- Réaction de la carte quand on décoche « 30 min » des urgences : + 17 ms par rapport au geste témoin du prix (limite + 115 ms), [mesure](captures/T1-reaction.txt).
- Tests, relancés par moi le 2026-11-27 : Vitest 462 sur 462 ; Playwright 518 verts, 0 rouge, 53 sautés. Les rouges isolés vus quand la machine était saturée (charge de 10 à 167) passent tous quand on les relance seuls (détail dans progress.md).

| AC | Ce qu'il vérifie | Passe |
|---|---|---|
| AC-1 | « Services » : Médecin, Urgences, Supermarché, Scolarité, Gare, rien de coché | oui |
| AC-2 à AC-4, AC-7 à AC-12, AC-14 à AC-17 | critères d'origine, inchangés | oui |
| AC-5 | calcul du temps du supermarché (l'épicerie ne compte pas) | oui |
| AC-6 | fiche de Portmer à 11 lignes, urgences « plus d'une heure » | oui |
| AC-13 | valeurs servies d'Auch, Bordeaux, Mende, Saint-Véran, Chamonix, Les Sables-d'Olonne, L'Île-d'Yeu ; aucun `commerce` | oui |
| AC-18 | « 30 min » d'urgences garde Quaibleu, écarte Terrebasse | oui |
| AC-19 | ordre fixe dans l'adresse : médecin, urgences, supermarché | oui |
| AC-20 | ancien lien `commerce` réécrit sans lui | oui |

**20 critères sur 20.**

## Tests existants modifiés
Tous couverts par ton accord du 2026-11-26 en /breakdown, et seulement pour suivre la révision :
- **Test des données** (`scripts/data/services.test.ts`) : le temps du commerce de la commune X (4 min) devient celui du supermarché (9 min), puisque l'épicerie ne compte plus (D20). Le test des valeurs servies (AC-13) attend les nouvelles valeurs révisées et « aucune colonne commerce ».
- **Tests des fonctions** (`src/domain/services.test.ts`) : « commerce » devient « supermarché », la fiche passe de 10 à 11 lignes, et la phrase de la traversée porte sur 8 services au lieu de 7. 16 vérifications réécrites, 49 ajoutées.
- **Tests dans le navigateur** (`tests/e2e/services.spec.ts`) : « Commerce alimentaire » devient « Urgences » et « Supermarché » (AC-1, AC-6, AC-15, R57, H154), avec AC-18, AC-19 et AC-20 ajoutés. Une vérification en plus : la ligne « Urgences » inactive pendant le chargement.
- Aucun test du téléphone n'a eu besoin de bouger, malgré la 5e ligne.

## Décisions prises à ta place
- **Chamonix-Mont-Blanc, « Urgences : 4 min »** : c'est une base de SMUR (équipe mobile) avec un centre de soins de jour ouvert en saison. L'accueil ouvert toute l'année est à Sallanches, à 34 min. Il est compté comme le dit D19 (« SMUR compris »), et 1 commune sur 10 est sous le seuil d'arrêt de 2. *Coût si c'est faux* : quelqu'un qui coche « 15 min » garde Chamonix alors que l'accueil est à 34 min. **À trancher maintenant** (tableau ci-dessous).
- **Tende, supermarché « plus d'une heure »** pour 27 min réels (Breil-sur-Roya). Ce n'est pas « faux » selon la règle de H205 (au-delà de 15 min des deux côtés), mais le chiffre affiché est faux. Je n'ai fait aucun retrait. *Coût* : une ligne `06163,supermarche` à ajouter si tu le décides.
- **Le contrôle de poids porte sur le fichier final** : pendant les tâches 0 et 1, le fichier de travail pesait 351 Ko avec `commerce` ; il n'a jamais été mis en ligne. *Coût* : aucun.
- **Les trois lignes à un seul temps** (Médecin, Urgences, Supermarché) sont décrites à un seul endroit du code, et la phrase de la traversée compte « tout service hors des trois gares » au lieu d'un 8 écrit en dur. *Coût* : aucun ; ça évite qu'un service ajouté plus tard la rende fausse sans bruit.
- **La spec écrit « 174 communes au-delà d'une heure »** pour les urgences ; ses propres totaux donnent 166, et le fichier en a 166. *Coût* : un chiffre à corriger dans la spec (D19 / H202).
- Détails de preuve, décidés par Claude : captures de bureau en JPEG (les PNG dépassaient 600 Ko) ; communes ouvertes par la recherche dans le script de bout en bout.

## Le tableau du risque — à juger maintenant
[credibilite-urgences.md](credibilite-urgences.md) : 10 communes, dont le temps d'urgences est confronté à l'itinéraire IGN et aux pages des hôpitaux. Les 10 tombent **du même côté** des pastilles 15, 30 et 45 min. **0 commune ordinaire fausse** ; 1 base de SMUR seule (Chamonix). Auch : l'accès aux urgences passe par le 15 d'abord depuis le 9/10/2026 (mesure temporaire), ce que dit déjà la phrase des limites.

## Relectures
- **Conformité au plan et à la spec** ([review-spec.md](review-spec.md)) : 0 Bloquant, 0 Majeur, 3 Mineurs.
  - Chamonix et Tende (ci-dessus, à toi).
  - « 174 » dans la spec (ci-dessus).
  - L'Île-d'Yeu n'avait pas été rejouée sur les vraies données après la simplification : le testeur navigateur l'a fait sur la version finale (« aucune sur l'île » et phrase de la traversée présentes). Réglé.
- **Test dans le navigateur** ([qa.md](qa.md), bureau, 390, 375 × 548, clavier) : 0 Bloquant, 0 Majeur, 3 Mineurs, laissés en l'état :
  - 4 réponses 404 dans la console en bureau, sans cause trouvée. `/favicon.ico` répond 404, un point déjà noté dans « À suivre ».
  - Les flèches ne déplacent pas le focus entre les cases de temps (Espace, Entrée et Tab marchent). Le comportement est le même pour toutes les cases du site.
  - « Mairie : » et « Chômage : » ont une espace ordinaire avant les deux-points (tranches précédentes).

## Non vérifié
- La version en ligne : `/ship` rejoue le bout en bout en ligne.
- La comparaison avec Figma : le design de la révision n'a pas de nouvelle maquette, il réutilise les composants existants.
- La tabulation au clavier à 390 et 375 px ; les communes « sans chiffre » autres que L'Île-d'Yeu, dans le navigateur.
- H207 : demander à D si elle a vu « Services » et si un temps en voiture répond à sa question. C'est à toi, avant ou après la démo.

## Coût
- Durée : du 2026-11-26 à 19:59 au 2026-11-27 à 09:46. Le travail actif représente environ 4 h ; la simplification est restée bloquée environ 9 h la nuit, sur une machine saturée (charge de 77 à 167 au matin, à cause d'une machine virtuelle, de l'indexation et de la sauvegarde Backblaze).
- Agents : 3 constructeurs (tâche 0 : 319 k jetons ; tâche 1 : 211 k ; tâche 2 : 166 k), 1 simplification (131 k), 2 relecteurs (conformité : 168 k ; navigateur : 61 k).
- Détours : le constructeur de la tâche 0 a atteint sa limite de tours (repris seul) ; la simplification a rendu un rapport partiel à cause de la charge ; mon attente de machine calme lisait la charge sur 1 min au lieu de 5, d'où un départ sur un creux et 1 rouge relancé.
