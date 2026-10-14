# Système de design — Carte où vivre
2026-10-12 · créé par /ui loyer-mer · étendu le 2026-10-13 par /ui proches et /ui interface-telephone · Figma : [Carte où vivre](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q), page « Système » (planche `9:636`, composants maîtres à droite)

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
| `score-1` … `score-5` | #76B8A9 · #4C9D8D · #2C8072 · #176258 · #0A433D | paliers de score [0,20) … [80,100] (R3) ; opacité des communes 88 % à l'échelle de la France, 70 % au zoom d'une ville (H10, D17) |
| `area-unranked` | #D8C08A | page « sans plafond » : communes de la bonne taille, opacité 70 % (D17) |
| `area-excluded`, `map-sea`, `map-river`, `map-neighbour`, `map-border` | #E0DBD2 · #BFD6E4 · #8DB3CA · #EFECE6 · #8E9896 | **fond uni de secours seulement** (R8, D17) : communes qui ne passent pas en `area-excluded`, mer, voisins, trait de côte ; avec le fond IGN, une commune qui ne passe pas n'est pas peinte |
| commune choisie | double contour : 4 px `card` sous 1,8 px `foreground` | lisible sur les paliers foncés |
| `place-marker` / `place-marker-foreground` | #B4532A (primitive `terre-cuite/600`) / #FFFFFF | repère d'un proche, pastille et ligne de proche (tranche proches). Chaud contre une rampe froide ; contraste du blanc 4,99:1. **Sa luminance égale celle de `score-3` (1,05:1)** : toujours un contour `card` 2 px et `ombre-panneau`. Jamais une couleur de réglage ni de score |

Fond de carte (D16) : Plan IGN « atténué » + estompage IGN `estompage_grayscale` à 45 %, sous les communes. La couleur n'est jamais le seul indice : score et rang écrits dans la liste, la fiche et les ronds.

## Texte (polices hébergées dans le site, `public/fonts/`, licence OFL ; pas de Google Fonts, D1)
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
| Curseur | Slider (input range natif possible) | Position 51 % / 27 % / Sans limite (valeur « Sans limite », sous-texte masqué) × Repos/Focus ; textes Libellé, Valeur, Sous-texte |
| Pastille | Toggle (`aria-pressed`) | Cochée Oui/Non × Repos/Focus |
| Ligne de liste | bouton dans un `ol` | Palier 1–5 × Repos/Survol/Focus ; nom sur plusieurs lignes si long |
| Fiche | (composé) | Passe (pastille du palier avant le score) · Ne passe pas (intitulé « Ne passe pas tes critères ») · Sans plafond ; booléen « Estimation du secteur » |
| Légende | (composé) | Classée · Sans plafond · Fond indisponible |
| Message carte | (composé) | Chargement · Erreur · Fond indisponible |
| Rond du top 10 | marqueur MapLibre (élément HTML) | Choisi Non/Oui/Focus · Groupe (« 3 · 10 », au-delà de 50 % de chevauchement ; un clic zoome) |
| Repère proche | marqueur MapLibre (élément HTML), ne se clique pas | État : Prêt (goutte `place-marker`, maison) · Calcul (« … », anneau qui pulse 1,2 s) · Indisponible (goutte `card`, bord pointillé `place-marker`, « ! ») ; nom dans une étiquette à droite ; au-dessus des ronds du top 10 |
| Pastille de temps | `li` d'une `ul` « Temps vers tes proches » (pas un bouton) | une seule ; textes Nom, Valeur (« 4 h au plus », « 3 h 30 », « 3 h 30 · au-dessus de 3 h », « calcul en cours », « trajets indisponibles ») ; bureau seulement |
| Ligne de proche | `li` (composé) : repère en petit 24 px, nom, adresse, Slider 15 min → 6 h, Button lien « Retirer » | État : Prêt · En attente · Calcul · Indisponible (+ « Réessayer ») |
| Catégorie repliable | `h2 > button[aria-expanded]` | Ouverte Oui/Non ; repliée : résumé à droite ; ouverte : l'action de la catégorie à droite (Bascule mer, « Effacer mes proches ») |
| Bascule mer | groupe `role=group` nommé « Unité de la mer », deux `button[aria-pressed]` « km » et « min » | Unité km / min ; segment actif `primary` ; 24 px de haut en bureau, 44 px à 390 px |
| Suggestion d'adresse | bouton dans la liste des suggestions ; nom accessible « Ligne 1, Ligne 2 » ; le champ porte `aria-controls` vers la liste | textes Ligne 1, Ligne 2 ; icône de lieu `muted-foreground` |
| Onglets de feuille | `role=tablist` de deux `button role=tab` (« Critères », « Les 10 premières »), flèches gauche/droite (tranche interface-telephone) | Actif Critères / Les 10 premières ; rail `background` en pilule, padding `space-1`, 44 px de haut ; actif `primary` / `primary-foreground`, inactif `muted-foreground` ; style `texte-fort` ; sous 1 024 px seulement |
| Tête de feuille | `button[aria-expanded]` « Replier la feuille » / « Déplier la feuille » qui porte la poignée et le compte (style `valeur`, une ligne, annoncé à part en `role=status`) ; se touche et se glisse, sans chevron (D9 de interface-telephone) | État : Ouverte (≈ 47 px) · Repliée (barre entière ≈ 51 px, `ombre-feuille`, + marge du geste d'accueil) · Fiche (poignée seule) ; `card`, coins hauts `radius-sheet` |
Panneaux : `card` + `border` + `radius-panel` + `ombre-panneau`, padding `space-4`, écart `space-3`.

## Tailles (ajoutées par /build, tâche 0b, le 2026-10-12)
Valeurs que le contrat cite comme règles ou que Figma dessine sans variable ; à reporter dans Figma. `taille-cible` 24 · `taille-toucher` 44 · `taille-bouton-icone` 32 · `taille-pastille` 28 (hauteur min.) · `taille-poignee` 18 · `taille-rail` 4 · `taille-reglages` 300 (panneau de réglages) · `taille-liste` 320 (panneau de liste et de fiche) · `taille-echantillon` 14 et `taille-ecart-echantillon` 2 (pastilles de couleur de la légende) · `radius-echantillon` 3 · `taille-rang` 22 (colonne du rang dans la liste) · `taille-pastille-score` 10 et `radius-pastille-score` 2 (pastille du palier dans la liste et la fiche) · `taille-rond` 22 et `taille-rond-choisi` 26 (ronds du top 10) · `trait-focus` 2 · `ecart-focus` 2.
Ajoutées par /build proches (tâche 4, le 2026-10-13), à reporter dans Figma : `taille-goutte` 26 et `taille-goutte-haut` 34 (goutte du repère d'un proche, Figma 18:144 ; classes `w-goutte`, `h-goutte-haut`, `size-goutte`) ; durée `duree-pulse-ms` 1 200 (anneau du repère en calcul, dans `map` de `tokens.ts`).
Ajoutées par /build proches (tâche 5, le 2026-10-13), à reporter dans Figma : `taille-bande-carte` 40 (390 px : bande de carte au-dessus de la feuille montée pendant l'ajout d'un proche, Figma 27:1160 ; classe `top-bande-carte`) ; `taille-saisie` 16 (390 px : texte des champs de saisie, car sous 16 px Safari sur iPhone agrandit la page au focus ; classe `max-bureau:text-(length:--taille-saisie)` ; Figma dessine 15).
Ajoutée par /build interface-telephone (tâche 2, le 2026-10-14), à reporter dans Figma : `taille-feuille-min` 272 (plancher de la feuille mobile ouverte, D9) ; `part-feuille` passe de 0,56 à 0,45 (`layout` de `tokens.ts`) : `h-feuille`, `max-h-feuille` et `bottom-feuille` valent `max(45dvh, 272px)`.

## Dans le code
Source unique : `src/theme/tokens.ts` (variables CSS sur `:root` sous les noms ci-dessus, thème Tailwind, couleurs du style MapLibre). Le thème par défaut de Tailwind est **vidé** : une classe hors de cette liste ne produit aucun style. Contrôle : `npm run check-tokens`.
| Jeton | Classes Tailwind |
|---|---|
| couleurs | `bg-<nom>`, `text-<nom>`, `border-<nom>`, `ring-<nom>` (ex. `bg-card`, `text-muted-foreground`, `bg-score-3`) |
| `space-1` … `space-8` | le chiffre seul : `p-4`, `gap-3`, `mt-1`, `px-2`… (seulement 1, 2, 3, 4, 6, 8) |
| tailles | le nom sans `taille-` : `h-cible`, `size-bouton-icone`, `min-h-pastille`, `size-poignee`, `h-rail`, `w-reglages`, `w-liste`, `min-h-toucher` |
| rayons | `rounded-base` (radius), `rounded-chip`, `rounded-panel`, `rounded-sheet`, `rounded-full` |
| ombres | `shadow-panneau`, `shadow-feuille` |
| texte | `text-<style>` donne taille, interligne, graisse et approche (ex. `text-texte-fort`, `text-valeur`) ; ajouter `font-serif` pour `marque` et `titre-fiche`, `uppercase` pour `categorie`, `tabular-nums` pour les chiffres |
Composants (shadcn copiés, déjà stylés : ne pas leur redonner rayon, padding ni couleurs) :
- `Button` de `@/components/ui/button` — `variant` : `principal` (défaut, « Réessayer »), `icone` (32 × 32, zoom), `lien` (« ← Les 10 premières »).
- `Toggle` de `@/components/ui/toggle` (Pastille, Radix) — `pressed`, `onPressedChange` ; enfants : le libellé puis `<span className="text-mentions">10 000 – 50 000 hab.</span>` (la couleur suit l'état cochée).
- `Slider` de `@/components/ui/slider` (Curseur, Radix) — `value={[n]}`, `onValueChange`, `min`, `max`, `step`, `aria-label` ou `aria-labelledby`, `aria-valuetext` ; le libellé, la valeur (`text-valeur tabular-nums`) et le sous-texte (`text-secondaire text-muted-foreground`) sont écrits autour.
- `cn()` de `@/lib/cn` pour assembler des classes.
Focus : rien à écrire, l'outline `ring` 2 px décalé de 2 px est global. Classes sans valeur, toujours permises : `flex`, `grid`, `items-*`, `justify-*`, `border` (1 px), `border-2`, `sr-only`, `uppercase`, `w-full`, `h-full`, `w-1/2`, `inset-0`, `absolute`, `relative`, `overflow-*`…

## Règles
- Jetons seulement ; lint « pas de valeur arbitraire » en tâche 0. Le style MapLibre lit le même module TS que le CSS.
- Un seul mode (clair). Pas de couleur de donnée sur un bouton ou un réglage.
- Cibles : ≥ 24 px en bureau, 44 px au toucher : à 390 px, pastilles avec padding vertical `space-2` (49 px), zoom 44 × 44, zone de toucher de la poignée 44 px.
- Sous 1 024 px (interface-telephone) : la feuille ouverte a la tête (poignée et compte) puis les onglets « Critères » et « Les 10 premières », chacun avec son défilement et les mentions en bas ; une fiche ouverte **remplace les onglets** sous la poignée seule, la carte zoome au centre de la bande visible au-dessus. Le compte visible est `aria-hidden` : la seule zone `role=status` de la page reste un texte réservé aux lecteurs d'écran, vide sans plafond. Pendant l'ajout d'un proche (focus dans le champ, les suggestions, « Nom » ou « Ajouter »), la feuille **monte** jusqu'à `taille-bande-carte` du haut et défile pour mettre le champ juste sous la poignée (collée en haut de la feuille) ; elle redescend quand le focus sort.
- Figma fait foi jusqu'à ce qu'un écran soit construit ; ensuite, c'est le code.
