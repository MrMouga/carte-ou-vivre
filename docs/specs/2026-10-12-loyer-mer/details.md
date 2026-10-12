# Détails — loyer et mer
Lire d'abord [spec.md](spec.md) (décisions D-n).

## Parcours
1. L'utilisateur ouvre la page, avec ou sans plafonds dans l'adresse.
2. La carte s'affiche avec les plafonds de départ (H1) ou ceux de l'adresse : chaque aire est colorée selon son score, ou grisée.
3. Il bouge le plafond de loyer ou de mer : carte, liste, fiche et adresse se mettent à jour.
4. Il choisit une aire, sur la carte ou dans la liste : sa fiche s'ouvre.
5. Il copie l'adresse de la page depuis le navigateur : la même carte s'ouvre ailleurs.

## Écrans et états
### Carte — route `/` · dans l'URL : `loyer` (euros ou `aucun`), `mer` (km ou `aucun`)
Zones : carte — formes des 675 aires et des communes hors aire, sans fond (D9), cadrée au départ sur la métropole avec la Corse · réglages — plafond de loyer, plafond de mer · liste — les 10 premières · fiche — l'aire choisie · légende — les 5 tranches, le gris « au-dessus d'un plafond », le gris « hors aire », la couleur neutre « sans plafond » · pied de page — mentions de cette tranche : ANIL, Shom-IGN avec logos et liens, Insee (CLAUDE.md, Données), et la source des formes (choisie en tâche 0, sa mention ajoutée à CLAUDE.md). Disposition à 390 px : /ui.

États de la page :
- **chargement** (ouverture) → indicateur « Chargement de la carte… » (H9) ; réglages inactifs ; sort vers **classée**, **aucune aire**, **sans plafond** ou **erreur**.
- **erreur** (données non chargées, ou délai de H9 dépassé) → « La carte n'a pas pu se charger. » et un bouton « Réessayer » ; sort vers **chargement**.
- **classée** (≥ 1 plafond actif, ≥ 1 aire passe) → aires colorées (R3), liste de 1 à 10 lignes (R5) ; sort vers **aucune aire** ou **sans plafond** selon les réglages.
- **aucune aire** (≥ 1 plafond actif, aucune aire ne passe) → toutes les aires au gris « au-dessus d'un plafond » ; la liste dit « Aucune aire ne passe tes plafonds. Relâche le loyer ou la mer. » ; sort vers **classée** ou **sans plafond**.
- **sans plafond** (les deux réglages sur « Sans limite ») → toutes les aires en couleur neutre, sans score ; la liste dit « Fixe un loyer ou une distance à la mer pour classer les aires. » ; sort vers **classée** ou **aucune aire**.

États de la fiche (initial : **fermée**) :
- **fermée** → rien n'est affiché, aucune aire en évidence.
- **aire qui passe** → nom, score, rang, loyer, mer (R4, R6) ; l'aire est en évidence sur la carte.
- **aire grisée** → nom, loyer, mer, et une raison par plafond dépassé (R1) ; pas de score.
- **aire sans plafond** (page **sans plafond**) → nom, loyer, mer ; ni score ni rang.
Depuis tout état ouvert : un changement de plafond fait passer la fiche dans l'état qui correspond, dans les deux sens ; choisir une autre aire remplace la fiche ; fermer → **fermée**.

Interactions : bouger un plafond → carte, liste, fiche et adresse à jour (H9) · choisir une ligne de la liste → fiche ouverte, aire en évidence, la carte ne bouge pas · choisir une aire sur la carte → fiche ouverte · choisir une commune hors aire → rien.

## Règles
- **R1** — Une aire passe si, pour chaque critère actif, sa valeur affichée (loyer à l'euro, mer au km) est inférieure ou égale au plafond. Sinon elle est grisée, et sa fiche donne une raison par plafond dépassé : « Loyer 1 560 € : au-dessus de ton plafond de 1 200 € ». *Pourquoi* : voir D3 ; comparer la valeur affichée évite « Mer 60 km : au-dessus de ton plafond de 60 km ».
- **R2** — La note et le score suivent D4, avec les valeurs affichées de R1 ; le score s'affiche arrondi (H3). *Pourquoi* : voir D4.
- **R3** — La couleur d'une aire qui passe suit la tranche de son score affiché : [0, 20), [20, 40), [40, 60), [60, 80), [80, 100]. Les communes hors aire ont leur propre gris et ne se choisissent pas. *Pourquoi* : voir D5.
- **R4** — Chiffres et noms d'une aire (D2, D8, et les 52 m² de STATE.md) : « Bordeaux (33) », c'est-à-dire le libellé de l'aire suivi du département de sa commune-centre ; « 832 € par mois pour 52 m² (16,0 €/m²) », où le loyer est le loyer au m² exact × 52 arrondi à l'euro, de sorte que le €/m² arrondi × 52 peut différer de quelques euros ; « 40 km de la mer à vol d'oiseau », ou « moins d'1 km de la mer » quand la distance est sous 1 km. *Pourquoi* : D2, D8.
- **R5** — La liste montre au plus 10 aires qui passent, triées par score affiché décroissant (égalité : H4), sous le compte « 3 aires passent tes plafonds » (« 1 aire passe tes plafonds » au singulier). Format d'une ligne : « 1 · Portmer (17) · 72 · 650 € · moins d'1 km ». *Pourquoi* : voir D6.
- **R6** — Le rang de la fiche s'écrit « 1re sur 1 aire qui passe », « 3e sur 3 aires qui passent ». *Pourquoi* : situer une aire sans regarder la liste.
- **R7** — À l'ouverture, les plafonds sont lus dans l'adresse ; une valeur absente ou invalide (H7) prend la valeur de départ de ce critère (H1). L'adresse est alors réécrite avec les plafonds effectifs, puis à chaque changement, en remplaçant l'entrée courante de l'historique sans en ajouter. *Pourquoi* : voir D7. Un lien garde son sens même si H1 change.

## Cas limites
- Valeur affichée égale au plafond → l'aire passe avec une note de 0 pour ce critère (AC-3).
- Un seul critère actif → le score est la note de ce critère (AC-2).
- Moins de 10 aires passent → la liste les montre toutes, avec le bon compte (AC-4, AC-11).
- Adresse avec une valeur invalide → valeur de départ pour ce critère seulement (AC-12).
- Distance sous 1 km → « moins d'1 km », comparée au plafond comme 1 km (AC-8).
- Commune-centre sans loyer ou sans distance → la fiche affiche « Loyer inconnu » ou « Distance à la mer inconnue » ; si ce critère est actif, l'aire est grisée avec cette raison. Nombre attendu : 0, mesuré en tâche 0.
- Défaut de l'Adour (3 communes à tort à moins de 2 km de la mer) → la tâche 0 vérifie qu'aucune n'est une commune-centre, sinon elle corrige.
- Aire transfrontalière dont le pôle est à l'étranger → H6.

## Impact sur les tranches existantes
Première tranche.

## Ne change pas
Première tranche.

## Hypothèses
- **H1** — Plafonds de départ : loyer 1 200 €, mer 60 km. C'est l'exemple du pitch (« un loyer sous 1 200 €, la mer à moins d'une heure »), avec une heure lue comme environ 60 km.
- **H2** — Réglages : loyer de 300 à 2 000 € par pas de 50 € ; mer de 5 à 200 km par pas de 5 km ; le cran après le maximum est « Sans limite » (`aucun` dans l'adresse).
- **H3** — Arrondis et formats : score à l'entier le plus proche (0,5 vers le haut) ; loyer à l'euro ; €/m² à une décimale avec une virgule ; km à l'entier ; espace insécable avant les milliers et avant « € » (les tests comparent après avoir remplacé les espaces insécables par des espaces).
- **H4** — À égalité de score affiché : loyer croissant, puis nom dans l'ordre alphabétique.
- **H5** — Point d'une commune-centre : son centre tel que l'a utilisé la discovery (geo.api.gouv.fr), pour la mer comme pour les trajets de la tranche 2. S'il y a plusieurs communes-centres, on prend la plus peuplée.
- **H6** — Si l'aire n'a pas de commune-centre française, on prend sa commune française la plus peuplée.
- **H7** — Une valeur d'adresse est invalide si elle n'est ni `aucun` ni un nombre de la plage et du pas de H2 (`loyer=1234` est invalide).
- **H8** — La carte se zoome et se déplace (molette, pincement, boutons + et −). Le zoom ne fait pas partie de l'adresse.
- **H9** — Budgets : la page réagit à un réglage en ≤ 100 ms ; l'indicateur de chargement apparaît après 300 ms et reste au moins 300 ms ; au bout de 15 s sans données, on passe en **erreur**.

## Exceptions
- Accessibilité : les 675 aires ne se parcourent pas une à une au clavier. L'accès au clavier passe par les réglages, la liste et la fiche. Une aire hors du top 10 ne s'atteint qu'à la souris ou au doigt, jusqu'à la recherche par nom (Pas maintenant).

## Vérification de bout en bout
Sur la version en ligne, en largeur bureau et à 390 px :
1. Ouvrir `/` : l'adresse devient `/?loyer=1200&mer=60`. La fiche de Bordeaux affiche « 832 € par mois pour 52 m² (16,0 €/m²) » et « 40 km de la mer à vol d'oiseau » ; celle de La Rochelle « 1 km de la mer à vol d'oiseau » (chiffres de la discovery du 2026-10-11).
2. Passer le loyer à 800 € : Bordeaux devient grise et sa fiche dit « Loyer 832 € : au-dessus de ton plafond de 800 € » ; l'adresse contient `loyer=800`.
3. Copier l'adresse, l'ouvrir dans une fenêtre privée : mêmes réglages, même liste.
4. Les mentions de la tranche sont visibles dans le pied de page.
Preuves : captures d'écran des étapes 1 à 4, aux deux largeurs.
