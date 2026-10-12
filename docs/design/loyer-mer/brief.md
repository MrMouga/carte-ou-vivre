# Brief de design — loyer-mer
2026-10-12 · validé · mis à jour après la fusion (spec révisée D10–D16) · Spec : [loyer-mer](../../specs/2026-10-12-loyer-mer/spec.md) · Grille : [README](README.md) · Décision : [decisions.md](decisions.md)

## Ressenti
La carte d'abord, visuelle, pas un outil technique (Vincent, à propos de Profound : « trop technique, pas assez centré sur la carte, pas assez visuel »). Calme et crédible : une carte qu'on regarde à deux sur un canapé, pas un tableau de bord. Une vraie géographie : la mer, les fleuves, les voisins (Vincent : « la carte fait un peu vide, faudrait rajouter l'eau »).

## Références
| Réf | Fichier | Ce qu'on prend | Ce qu'on ne prend pas | Mots de Vincent |
|---|---|---|---|---|
| Felt (web) | refs/felt-choroplethe-legende.webp | carte plein écran, panneaux posés sur la carte, légende en paliers lisible | le fond de carte en tuiles (D9), les couleurs pastel multiples, la barre d'outils d'édition | « celle que je préfère pour desktop » |
| Strava (iOS) | refs/strava-mobile-curseur-en-feuille.webp | à 390 px : la carte en haut, les réglages dans une feuille qui monte du bas, un curseur large avec ses valeurs | les boutons « Reset / Apply » : ici, tout réagit en direct | « celle que je préfère pour iOS » |
| Squarespace (web) | refs/squarespace-carte-sobre-liste.webp | la sobriété : une teinte, des gris neutres | la liste en tableau sous la carte | « j'aime bien aussi mais moins adapté pour les critères » |
| Profound (web) | refs/profound-carte-et-classement.webp | rien | la carte enfermée dans un tableau de bord, la colonne de chiffres | « trop technique, pas assez centré sur la carte, pas assez visuel » |

## Système visuel (mode clair seulement, perso)
| Jeton | Hex | Rôle |
|---|---|---|
| `background` | #F7F4EE | fond des zones hors carte, liseré entre communes |
| `foreground` | #1F2A2A | texte principal, contour de la commune choisie, ronds du top 10 |
| `muted-foreground` | #5B6664 | texte secondaire, unités, mentions |
| `card` | #FFFFFF | panneaux posés sur la carte |
| `border` | #DDD8CF | séparateurs, contour des panneaux, pastilles non cochées |
| `primary` / `primary-foreground` | #1F2A2A / #FFFFFF | curseurs, pastilles cochées, bouton « Réessayer » : l'encre, jamais une couleur de donnée |

Typographie (Google Fonts) : **Source Sans 3** pour l'interface, chiffres tabulaires pour les loyers et les scores ; **Source Serif 4** pour le nom du site et le nom de la commune dans la fiche. Rayon 8 px (panneaux 12 px, pastilles 10 px). Gouttière 16 px. Espacements 4 · 8 · 12 · 16 · 24 · 32.

## Fond de carte (D16)
Plan IGN, style « atténué » (`https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/attenue.json`), estompage IGN (`ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW`, style `estompage_grayscale`, opacité 45 %) sous les communes. Les noms, l'eau, les routes et les pays voisins viennent du fond : les jetons `map-sea`, `map-river`, `map-neighbour`, `map-border`, `map-relief` et `map-label` ci-dessous ne servent plus qu'au fond uni de secours (R8). Une commune qui ne passe pas n'est pas peinte (`area-excluded` n'est plus utilisé sur la carte). Opacité des communes colorées : H10.

## Échelles de données et couches de carte
Score des communes qui passent, séquentielle à une teinte (vert d'eau), du clair au foncé. Vérifiée par le script de contrôle `validate_palette.js` le 2026-10-12 sur #F7F4EE : luminosité qui décroît d'un palier à l'autre, écarts visibles, palier le plus clair à 2,08:1.
| Jeton | Hex | Rôle |
|---|---|---|
| `score-1` … `score-5` | #76B8A9 · #4C9D8D · #2C8072 · #176258 · #0A433D | paliers 0–20 … 80–100 |
| `area-excluded` | #E0DBD2 | « ne passe pas » (écart avec `score-1` : ΔE 13,2 au pire, protan) |
| `area-unranked` | #D8C08A | « sans plafond » : sable, distinct du gris |
| `area-selected` | double contour : 4 px blanc sous 1,8 px `foreground` | commune choisie, lisible sur les paliers foncés (revue : 1,32:1 avec un contour simple) |
| `map-sea` | #BFD6E4 | mer et lacs |
| `map-river` | #8DB3CA | fleuves, trait de 0,9 à 1,6 px selon le zoom |
| `map-neighbour` | #EFECE6 | pays voisins |
| `map-border` | #8E9896 | trait de côte et frontières, 0,6 à 0,8 px ; masqué au-delà d'un zoom ×3 (le contour Natural Earth est trop grossier) |
| `map-relief` | ombrage multiplié sur toute la carte (lumière nord-ouest, 45°), assombrissement au plus 50 % | relief (D15) ; image fixe en production |
| `map-label` | villes #2F3B3A, 600–700, 12–13 px, halo blanc 3 px ; pays #7A8583 petites capitales espacées 1,5 px ; mers #5E7F92 Source Serif 4 italique 13 px | noms (D15), écartés des ronds du top 10 |
| `rank-marker` | rond `foreground` de 22 px (26 px si choisi), anneau blanc de 2 px, rang en blanc 12 px gras | les 10 premières, posées sur la carte, cliquables |
Les couches de contexte (mer, voisins) ne sont pas des catégories de la légende : elles se distinguent du gris « ne passe pas » par le trait de côte et de frontière (l'écart de couleur seul est trop faible, ΔE 3,9). Légende : 5 pastilles « Score 0 → 100 », « Ne passe pas » ; « Sans plafond » remplace les pastilles dans cet état. La couleur n'est jamais le seul indice : score et rang écrits dans la liste, la fiche et les ronds.

## Contenu réaliste commun
Date : 12 octobre 2026. Réglages : loyer 1 200 €, mer 60 km, taille Petite ville + Ville moyenne. Données réelles (prototype du 2026-10-12, loyers ANIL 2025, populations Insee) : « 269 communes passent tes critères » ; 1 La Hague (50) 75 · 532 € · 4 km ; 2 Outreau (62) 75 · 585 € · moins d'1 km ; 3 Boulogne-sur-Mer (62) 75 · 596 € · moins d'1 km ; 4 Douarnenez (29) 74 · 601 € · 1 km ; 5 Calais (62) 74 · 602 € · 1 km. Bordeaux (33) : Grande ville · 268 000 habitants, 832 € (16,0 €/m²). Les distances à la mer du prototype sont approximatives.

## Écrans
### Bureau (1440 × 900) — carte plein écran
1. Carte : mer, voisins, fleuves, communes colorées, ronds du top 10. Boutons « + » et « − » en bas à droite de la carte.
2. Panneau gauche, posé sur la carte : « Carte où vivre » ; **Loyer** : « Loyer maximum », « 1 200 € », « par mois pour 52 m² », curseur de 300 à 2 000 €, dernier cran « Sans limite » ; **Mer** : « Mer à moins de », « 60 km », « à vol d'oiseau », curseur de 5 à 200 km, dernier cran « Sans limite » ; **Taille de ville** : pastilles « Petite commune / moins de 10 000 hab. », « Petite ville / 10 000 – 50 000 hab. », « Ville moyenne / 50 000 – 200 000 hab. », « Grande ville / plus de 200 000 hab. », puis « Aucune cochée : peu importe » ; le compte « 269 communes passent tes critères » (annoncé aux lecteurs d'écran).
3. Panneau droit : « Les 10 premières », le compte, 10 lignes « 1 · La Hague (50) · 532 € · 4 km » avec le score en encre et une pastille de couleur. Choisir une ligne ou une commune → la fiche **remplace la liste** dans ce panneau.
4. Fiche : « ← Les 10 premières » ; « Douarnenez (29) » ; « Petite ville · 14 000 habitants » ; « 74 / 100 · 4e sur 269 communes qui passent » ; « 601 € par mois pour 52 m² (11,6 €/m²) » ; « Estimation du secteur (communes voisines) » si besoin ; « 1 km de la mer à vol d'oiseau ». Commune grisée : les raisons en gras (« Taille : grande ville (268 000 habitants) »), pas de score.
5. Légende en bas à gauche ; mentions en bas : ANIL, © Shom-IGN 2021 avec logos liés, Insee populations légales, Natural Earth.
### Mobile (390 × 844)
La carte en haut, avec la légende et le zoom. Une feuille qui monte du bas (Strava) : réglages, compte, liste ou fiche, mentions en bas de la feuille.
### Messages (d'après details.md)
| État | Texte exact | Où |
|---|---|---|
| chargement | « Chargement de la carte… » | centre de la carte |
| erreur | « La carte n'a pas pu se charger. » + « Réessayer » | centre de la carte |
| aucune commune | « Aucune commune ne passe tes critères. Relâche le loyer, la mer ou la taille. » | à la place de la liste |
| sans plafond | « Fixe un loyer ou une distance à la mer pour classer les communes. » | à la place de la liste |
| une seule | « 1 commune passe tes critères » | compte |

## Pas voulu
- L'allure tableau de bord : carte enfermée dans une carte, colonnes de chiffres, onglets (Profound).
- Un fond de carte en tuiles (routes, noms de villes) : D9.
- Arc-en-ciel, rouge et vert pour bon et mauvais, couleur de donnée sur les boutons.
- Les clichés : Inter par défaut, dégradés violet-indigo, cartes en verre, trio centré, emojis en guise d'icônes.
- Des boutons « Appliquer » : tout réagit en direct.
- Une fiche qui suit le clic sur la carte (elle grandira avec les critères des tranches suivantes).
