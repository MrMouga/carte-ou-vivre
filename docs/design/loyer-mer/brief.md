# Brief de design — loyer-mer
2026-10-12 · brouillon · Spec : [loyer-mer](../../specs/2026-10-12-loyer-mer/spec.md) · Grille : [README](README.md)

## Ressenti
La carte d'abord, visuelle, pas un outil technique (Vincent, à propos de Profound : « trop technique, pas assez centré sur la carte, pas assez visuel »). Calme et crédible : une carte qu'on regarde à deux sur un canapé, pas un tableau de bord.

## Références
| Réf | Fichier | Ce qu'on prend | Ce qu'on ne prend pas | Mots de Vincent |
|---|---|---|---|---|
| Felt (web) | refs/felt-choroplethe-legende.webp | carte plein écran, panneaux posés sur la carte, légende en paliers lisible | le fond de carte en tuiles (D9), les couleurs pastel multiples, la barre d'outils d'édition | « celle que je préfère pour desktop » |
| Strava (iOS) | refs/strava-mobile-curseur-en-feuille.webp | à 390 px : la carte en haut, les réglages dans une feuille qui monte du bas, un curseur large avec ses valeurs aux bornes | les boutons « Reset / Apply » : ici, tout réagit en direct | « celle que je préfère pour iOS » |
| Squarespace (web) | refs/squarespace-carte-sobre-liste.webp | la sobriété : une teinte, des gris neutres | la liste en tableau sous la carte | « j'aime bien aussi mais moins adapté pour les critères » |
| Profound (web) | refs/profound-carte-et-classement.webp | rien | la carte enfermée dans un tableau de bord, la colonne de chiffres | « trop technique, pas assez centré sur la carte, pas assez visuel » |

## Système visuel (mode clair seulement, perso)
| Jeton | Hex | Rôle |
|---|---|---|
| `background` | #F7F4EE | fond de page et « mer » autour des formes : un papier crème de carte, pas un blanc d'écran |
| `foreground` | #1F2A2A | texte principal, contour de l'aire choisie |
| `muted-foreground` | #5B6664 | texte secondaire, unités, mentions |
| `card` | #FFFFFF | panneaux posés sur la carte |
| `border` | #DDD8CF | séparateurs, contour des panneaux |
| `primary` | #1F2A2A / `primary-foreground` #FFFFFF | curseurs, bouton « Réessayer » : l'encre, pas une couleur de donnée |

Typographie (Google Fonts) : **Source Sans 3** pour l'interface, chiffres tabulaires pour les loyers et les scores ; **Source Serif 4** pour le nom du site et le nom de l'aire dans la fiche. Rayon 8 px. Gouttière 16 px. Espacements 4 · 8 · 12 · 16 · 24 · 32.

## Échelles de données
Score des aires qui passent, séquentielle à une teinte (vert d'eau), du clair au foncé. Vérifiée par le script de contrôle `validate_palette.js` le 2026-10-12 sur le fond #F7F4EE : luminosité qui décroît d'un palier à l'autre, écarts visibles entre paliers, palier le plus clair à 2,08:1 du fond.
| Jeton | Hex | Palier |
|---|---|---|
| `score-1` | #76B8A9 | 0–20 |
| `score-2` | #4C9D8D | 20–40 |
| `score-3` | #2C8072 | 40–60 |
| `score-4` | #176258 | 60–80 |
| `score-5` | #0A433D | 80–100 |
| `area-excluded` | #E0DBD2 | au-dessus d'un plafond (écart avec `score-1` : ΔE 13,2 au pire, en vision protan) |
| `area-outside` | #F1EEE8 + hachures à 45° #D6D0C6 | hors aire. Les hachures sont l'indice secondaire, car le fond seul est trop proche de `area-excluded` (ΔE 5,7) |
| `area-unranked` | #D8C08A | sans plafond : toutes les aires, un sable distinct des deux gris |
| `area-selected` | contour 2 px `foreground` | aire choisie |
Entre deux aires : un liseré de 0,75 px couleur `background`. Légende : 5 pastilles « 0–20 … 80–100 », puis « Au-dessus d'un plafond », « Hors aire » (hachuré), et « Sans plafond » seulement dans cet état. La couleur n'est jamais le seul indice : le score et le rang sont écrits dans la liste et la fiche. Lisible d'un coup d'œil à l'échelle de la France entière : où est le foncé.

## Contenu réaliste commun
Date : 12 octobre 2026. Plafonds : loyer 1 200 €, mer 60 km. Valeurs réelles (discovery du 2026-10-11) : Bordeaux (33) 832 € (16,0 €/m²), 40 km ; La Rochelle (17) 767 €, 1 km, score 67 ; Nantes (44) 754 €, 39 km. Les autres lignes de la liste sont **illustratives** (marquées comme telles dans les prototypes) : Lorient (56), Brest (29), Saint-Brieuc (22), Les Sables-d'Olonne (85), Vannes (56), Cherbourg-en-Cotentin (50), Dunkerque (59), Boulogne-sur-Mer (62). Compte : « 412 aires passent tes plafonds » (illustratif).

## Écrans
### Bureau (1440 × 900)
1. Nom du site « Carte où vivre ».
2. Réglages, une catégorie par critère :
   - **Loyer** : « Loyer maximum », valeur « 1 200 € » (sous-titre « par mois pour 52 m² »), curseur de 300 à 2 000 €, dernier cran « Sans limite ».
   - **Mer** : « Mer à moins de », valeur « 60 km » (sous-titre « à vol d'oiseau »), curseur de 5 à 200 km, dernier cran « Sans limite ».
3. Liste : « 412 aires passent tes plafonds », puis 10 lignes au format « 1 · La Rochelle (17) · 67 · 767 € · 1 km ».
4. Carte : formes des aires, sans fond, cadrée sur la métropole et la Corse ; boutons « + » et « − ».
5. Légende (voir Échelles).
6. Fiche (aire qui passe) : « La Rochelle (17) », « 67 », « 1re sur 412 aires qui passent », « 767 € par mois pour 52 m² (14,7 €/m²) », « 1 km de la mer à vol d'oiseau », bouton fermer.
   Fiche (aire grisée) : « Paris (75) », « Loyer 1 560 € : au-dessus de ton plafond de 1 200 € » (illustratif), « Mer 149 km : au-dessus de ton plafond de 60 km ».
7. Pied de page : « Estimations ANIL, à partir des données du Groupe SeLoger et de leboncoin » · « © Shom-IGN, 2021 » avec les logos Shom et IGN, liés · « Source : Insee, zonage en aires d'attraction des villes 2020 ».
### Mobile (390 × 844)
Mêmes éléments. La carte en haut ; réglages, liste et fiche dans une feuille qui monte du bas (référence Strava).
### Messages (d'après details.md, à placer dans l'emplacement de la liste ou de la page)
« Chargement de la carte… » · « La carte n'a pas pu se charger. » + « Réessayer » · « Aucune aire ne passe tes plafonds. Relâche le loyer ou la mer. » · « Fixe un loyer ou une distance à la mer pour classer les aires. » · « 1 aire passe tes plafonds ».

## Pas voulu
- L'allure tableau de bord : carte enfermée dans une carte, colonnes de chiffres, onglets (Profound).
- Un fond de carte (routes, noms de villes) : D9.
- Arc-en-ciel, rouge et vert pour bon et mauvais, couleur de donnée sur les boutons.
- Les clichés : Inter par défaut, dégradés violet-indigo, cartes en verre, trio centré, emojis en guise d'icônes.
- Des boutons « Appliquer » : tout réagit en direct.
