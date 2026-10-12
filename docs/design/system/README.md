# Système de design — Carte où vivre
2026-10-12 · créé par /ui loyer-mer · Figma : [Carte où vivre](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q), page « Système » (planche `9:636`, composants maîtres à droite)

**Le contrat de tout agent qui produit de l'interface.** Toute valeur visuelle (couleur, rayon, espacement, taille de texte) vient d'un jeton ci-dessous. Une valeur manque → on ajoute un jeton ici et dans Figma, et on le dit ; jamais de valeur arbitraire (`[13px]`, `#3a3a3a`).

## Où sont les jetons
- **Figma** : variables, collections `Primitives` (cachées, valeurs brutes), `Thème` (noms shadcn, syntaxe `var(--…)`), `Dimensions`. Un seul mode : **Clair** (ambition perso). Styles de texte et deux styles d'ombre.
- **Code** (tâche 0 de /breakdown) : un module TS unique (ex. `src/theme/tokens.ts`) qui produit **à la fois** les variables CSS du thème shadcn et les couleurs du style MapLibre (le style de carte est du JSON, il ne lit pas le CSS). Mêmes noms que dans Figma, lus avec `get_variable_defs`.

## Couleurs (`Thème`)
| Jeton | Valeur | Rôle |
|---|---|---|
| `background` | #F7F4EE | fond hors carte, fond uni de secours |
| `foreground` | #1F2A2A | texte principal, contour de la commune choisie, ronds du top 10 |
| `muted-foreground` | #5B6664 | texte secondaire, unités, mentions |
| `card` / `card-foreground` | #FFFFFF / #1F2A2A | panneaux posés sur la carte, feuille mobile |
| `border` | #DDD8CF | séparateurs, contour des panneaux, pastilles non cochées, rail des curseurs |
| `primary` / `primary-foreground` | #1F2A2A / #FFFFFF | curseurs, pastilles cochées, bouton « Réessayer » — jamais une couleur de donnée |
| `ring` | #1F2A2A | focus clavier : outline 2 px, décalé de 2 px (ajouté par /ui, absent du brief) |

## Jetons de données (carte, liste, fiche)
| Jeton | Valeur | Rôle |
|---|---|---|
| `score-1` … `score-5` | #76B8A9 · #4C9D8D · #2C8072 · #176258 · #0A433D | paliers de score [0,20) … [80,100] (R3) ; opacité des communes 88 % à l'échelle de la France, ~40 % au zoom d'une ville (H10) |
| `area-unranked` | #D8C08A | page « sans plafond » : communes de la bonne taille, opacité 45 % |
| `area-excluded`, `map-sea`, `map-river`, `map-neighbour`, `map-border` | #E0DBD2 · #BFD6E4 · #8DB3CA · #EFECE6 · #8E9896 | **fond uni de secours seulement** (R8) ; avec le fond IGN, une commune qui ne passe pas n'est pas peinte |
| commune choisie | double contour : 4 px `card` sous 1,8 px `foreground` | lisible sur les paliers foncés |

Fond de carte (D16) : Plan IGN « atténué » + estompage IGN `estompage_grayscale` à 45 %, sous les communes. La couleur n'est jamais le seul indice : score et rang écrits dans la liste, la fiche et les ronds.

## Texte (Google Fonts)
Source Sans 3 pour l'interface, **chiffres tabulaires** (`font-variant-numeric: tabular-nums`) pour loyers, distances et scores ; Source Serif 4 pour la marque et le nom de commune.
| Style | Police | Usage |
|---|---|---|
| `marque` | Serif 4 SemiBold 20 | « Carte où vivre » |
| `titre-fiche` | Serif 4 SemiBold 22 | nom de la commune dans la fiche |
| `categorie` | Sans 3 Bold 12, capitales, +6 % | « Loyer », « Mer », « Les 10 premières » |
| `texte` / `texte-fort` | Sans 3 Regular / SemiBold 15 | corps, compte, noms dans la liste, raisons |
| `valeur` | Sans 3 Bold 18 | valeur d'un curseur |
| `score-grand` | Sans 3 Bold 30 | score de la fiche |
| `pastille` · `secondaire` · `mentions` · `rang` | 13 · 12 · 11 · Bold 12 | pastilles, sous-textes, mentions, rangs des ronds |

## Dimensions
`radius` 8 · `radius-chip` 10 · `radius-panel` 12 · `radius-sheet` 16 · `space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-6` 24 · `space-8` 32. Ombres : `ombre-panneau` (0 2 10, foreground 8 %), `ombre-feuille` (0 −2 12, foreground 12 %).

## Composants (Figma ↔ shadcn)
| Figma | shadcn / code | Variantes |
|---|---|---|
| Bouton | Button | Principal (« Réessayer ») · Icône (zoom + −, 32×32) · Lien (« ← Les 10 premières ») × Repos/Focus |
| Curseur | Slider (input range natif possible) | Position 51 % / 27 % / Sans limite × Repos/Focus ; textes Libellé, Valeur, Sous-texte |
| Pastille | Toggle (`aria-pressed`) | Cochée Oui/Non × Repos/Focus |
| Ligne de liste | bouton dans un `ol` | Palier 1–5 × Repos/Survol ; nom sur plusieurs lignes si long |
| Fiche | (composé) | Passe · Ne passe pas · Sans plafond ; booléen « Estimation du secteur » |
| Légende | (composé) | Classée · Sans plafond |
| Message carte | (composé) | Chargement · Erreur · Fond indisponible |
| Rond du top 10 | marqueur MapLibre (élément HTML) | Choisi Oui/Non |
Panneaux : `card` + `border` + `radius-panel` + `ombre-panneau`, padding `space-4`, écart `space-3`.

## Règles
- Jetons seulement ; lint « pas de valeur arbitraire » en tâche 0. Le style MapLibre lit le même module TS que le CSS.
- Un seul mode (clair). Pas de couleur de donnée sur un bouton ou un réglage.
- Cibles : ≥ 24 px en bureau, 44 px au toucher (poignée de curseur et pastilles à 390 px).
- Figma fait foi jusqu'à ce qu'un écran soit construit ; ensuite, c'est le code.
