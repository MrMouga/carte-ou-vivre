# Brief de design — proches
2026-10-13 · Spec : [proches](../../specs/2026-10-13-proches/spec.md) · Grille : [README](README.md) · Étend le système [Carte où vivre](../system/README.md) sans le changer.

## Ressenti
Le même outil calme et crédible que la tranche 1 : une carte qui s'assume, des réglages à l'encre. Les proches y entrent comme des **personnes**, pas des données : on les nomme, on les voit sur la carte, et on sent qu'on attend un vrai calcul de trajets, pas un bug.

## Références
| Réf | Fichier | Ce qu'on prend | Ce qu'on ne prend pas | Mots de Vincent |
|---|---|---|---|---|
| [komoot](https://mobbin.com/screens/df0f4643-3bc3-42c0-acdf-6f85bfc1c847) | refs/komoot-etapes.jpg | liste de lieux dans le panneau, avec une lettre ou une couleur reprise à l'identique par le repère de la carte ; « + Ajouter » en bas de la liste | le vert, les photos, le graphique | « telles quelles » |
| [Airbnb, repère](https://mobbin.com/screens/f0702f49-3c63-4a0e-a3f0-a272b2988170) | refs/airbnb-repere-nomme.jpg | repère sombre à icône (maison) et son nom écrit dessous, lisible sur un fond chargé | les points d'intérêt colorés | « telles quelles » |
| [PamPam](https://mobbin.com/screens/974143e7-76c3-48f5-badc-263560be21f8) | refs/pampam-reperes-numerotes.jpg | repère qui porte un numéro et un nom court sous lui | émojis, éditeur | « telles quelles » |
| [Airbnb, recherche](https://mobbin.com/screens/15fbb7f4-b099-431b-8e29-e065d47e151a) | refs/airbnb-recherche-adresse.jpg | suggestions sur deux lignes (nom, puis ville en gris) avec une icône de lieu | le grand champ façon page d'accueil | « telles quelles » |
| [Nextdoor](https://mobbin.com/screens/44d4a5de-104f-417c-af3e-1f92890226fa) | refs/nextdoor-suggestions.jpg | liste de suggestions compacte, collée au champ | « Enter manually », le logo Google | « telles quelles » |

## Système visuel
Celui de [docs/design/system/README.md](../system/README.md), inchangé : Source Sans 3 / Source Serif 4, encre `foreground` pour les réglages, vert d'eau `score-1…5` pour les données, panneaux `card`. **Un seul ajout proposé** : une couleur de repère des proches, qui n'est ni une couleur de score ni l'encre des ronds du top 10.

## Échelles de données
- Les communes : inchangées (5 paliers `score-1…5`, opacité 88 % / 70 %).
- **Repère d'un proche** — jeton proposé `place-marker` **#B4532A** (terre cuite) avec `place-marker-foreground` #FFFFFF. Pourquoi : chaud contre une rampe froide, il se distingue des 5 verts même en vision des couleurs altérée (deutéranopie : brun-orangé contre bleu-gris) ; contraste du blanc sur #B4532A 4,99:1 (mesuré). **Mais** sa luminance égale celle de `score-3` (1,05:1, mesuré) : le repère porte donc toujours un contour `card` de 2 px et l'ombre `ombre-panneau`, pour se détacher par la luminance et pas seulement par la teinte. Les ronds du top 10 restent ronds, à l'encre, avec un rang ; un proche est une **goutte ou une maison** avec une lettre ou une icône, **et son nom écrit dessous** (texte `foreground` avec un halo `card` de 2 px, style `secondaire` SemiBold). Lisible à l'échelle de la France (zoom 5) et au zoom d'une ville.
- Un repère n'est jamais le seul indice : le nom est écrit dessus ou dessous, et la même lettre ou icône est reprise dans le panneau.
- États sur le repère : **prêt** plein · **en attente / calcul** même repère, avec un anneau qui tourne ou estompé à 60 % · **indisponible** contour pointillé et « ! ».

## Contenu réaliste commun
Date : 13 octobre 2026. Réglages : loyer 1 200 €, mer 60 km. Proches :
1. **Parents de Léa** — « 12 rue de la Paix, 44000 Nantes » — plafond 4 h — prêt.
2. **Toulouse (31)** — la commune, départ de sa mairie — plafond 5 h 30 — en calcul.
3. (pour l'état plein) **Mamie Jo** — « 3 place du Marché, 22300 Lannion » ; **Karim boulot** — « 40 avenue de France, 75013 Paris » ; **Les Dupont** — « 5 rue Sainte-Catherine, 33000 Bordeaux ».
Fiche de référence : **Bordeaux (33)** — 832 € pour 52 m², 39 km de la mer à vol d'oiseau, 50 min en voiture, Parents de Léa 3 h 30 à 3 h 45, Toulouse (31) 2 h 15 à 2 h 30. Commune refusée : **Arcachon (33)** avec « Toulouse (31) 3 h 15 à 3 h 30 : au-dessus de ton plafond de 3 h ».
Les temps du prototype sont **simulés** (distance à vol d'oiseau × 1,3 à 80 km/h, arrondie à la tranche de 15 min), pour sentir l'interface, pas pour les juger.

## Écrans
### A. Réglages, bureau (panneau de gauche, 300 px) — de haut en bas
1. « Carte où vivre » ; réglages loyer et taille comme aujourd'hui.
2. **Mer** : libellé « Mer à moins de », valeur « 60 km », bascule **« km à vol d'oiseau / minutes en voiture »** (en minutes : « 60 min », sous-texte « en voiture »).
3. **Tes proches** (titre `categorie`).
   - vide : « Ajoute l'adresse d'un proche : la carte calcule le temps en voiture jusqu'à chaque commune. »
   - champ « Adresse ou ville » ; suggestions (≤ 5) : « 12 rue de la Paix » / « 44000 Nantes » ; « Aucune adresse trouvée. » ; « Recherche d'adresse indisponible. Réessaie dans un moment. »
   - après le choix : champ « Nom » prérempli « Nantes (44) », bouton « Ajouter » ; refus : « Cette adresse est déjà dans tes proches. »
   - une ligne par proche : repère miniature (lettre ou icône), nom, adresse en petit, puis selon l'état : curseur « 4 h » (de 15 min à 6 h) · « En attente… » · « Calcul des trajets depuis Toulouse (31)… » · « Trajets indisponibles depuis Toulouse (31). » + « Réessayer » ; toujours « Retirer ».
   - plein : « 5 proches au maximum. Retire-en un pour en ajouter un autre. »
   - « Les adresses sont envoyées à l'IGN pour calculer les trajets, sans le nom que tu leur donnes. Ce site ne les garde que dans ton navigateur. »
   - « Effacer mes proches » (dès un proche) ; si le navigateur refuse : « Tes proches ne seront pas gardés sur ce navigateur. »
### B. Carte — les repères des proches (voir Échelles), avec les ronds du top 10 et les noms IGN.
### C. Fiche (panneau de droite), sous la mer : « 39 km de la mer à vol d'oiseau » · « 50 min de la mer en voiture » · « Parents de Léa : 3 h 30 à 3 h 45 en voiture » · « Toulouse (31) : calcul en cours » ; commune refusée : raison « Toulouse (31) 3 h 15 à 3 h 30 : au-dessus de ton plafond de 3 h » après celles du loyer, de la mer et de la taille.
### D. 390 px — la feuille : réglages, puis « Tes proches », puis la liste ; à juger dans chaque piste.

Messages de page qui changent : « Aucune commune ne passe tes critères. Relâche le loyer, la mer, la taille ou un proche. »

## Pas voulu
Avatars ou photos de personnes ; émojis ; une couleur de proche prise dans la rampe verte ; une modale plein écran pour ajouter un proche en bureau ; une barre de progression en pourcentage inventée ; un repère qui cache le nom des grandes villes IGN plus que nécessaire ; « Mes favoris », « Points d'intérêt » ou tout vocabulaire de GPS ; une liste de proches qui pousse les réglages du loyer hors de l'écran à 1 440 × 900.
