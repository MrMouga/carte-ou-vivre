# Brief — immobilier
2026-10-14 · Spec : [immobilier](../../specs/2026-10-14-immobilier/spec.md) (D1–D9, R21–R26, H56, H60, H65) · Système : [contrat](../system/README.md), inchangé sauf besoin dit ici.

## Grille (on juge les directions sur ces 5 objectifs, pas sur le goût)
1. **Place** — à 375 × 548, le curseur du prix est entièrement visible à l'ouverture de l'onglet « Critères ». La feuille peut grandir au-delà de 45 % si besoin (Vincent, 2026-10-14) : ce serait une révision de D9 d'interface-telephone et du test hors AC de H48, à décider à la fusion.
2. **Lisible d'un coup d'œil** — on sait ce qui filtre la carte (Louer · Appartement · 52 m² · 1 200 €), y compris catégorie repliée (résumé).
3. **Hiérarchie** — Louer / Acheter est le choix principal ; le bien ensuite ; l'unité est un détail du prix.
4. **Toucher** — chaque bascule change en un geste, cibles de 44 px à 390 px ; le champ surface qui apparaît ou disparaît (Total / Au m²) ne déplace pas le curseur sous le doigt.
5. **Cohérence** — composants existants (pastilles, onglets de feuille, curseur, catégorie repliable) ; pas de nouveau langage visuel, pas de couleur de donnée sur un réglage.

## Ressenti
Sobre, comme le reste de la carte : un réglage qu'on comprend sans lire d'aide. Les choix sont visibles, jamais cachés derrière un menu.

## Références
| Réf | Fichier | Ce qu'on prend | Ce qu'on ne prend pas | Mots de Vincent |
|---|---|---|---|---|
| 1 · Redfin | [refs/redfin-segmente-vente-location.jpg](refs/redfin-segmente-vente-location.jpg) | Le segmenté pleine largeur **en tête du filtre** : le mode est le premier choix | Le troisième segment (« Sold »), l'histogramme des prix, le bouton rouge | « j'aime bien » |
| 2 · Realtor.com | [refs/realtor-onglets-achat-type-tuiles.jpg](refs/realtor-onglets-achat-type-tuiles.jpg) | Acheter / Louer en onglets ; le type de bien en **tuiles avec icône** | Six types (on en a deux) ; les tuiles en grille 3 × 2 qui mangent la hauteur | « j'aime bien » |
Écartées par Vincent : Vrbo, Zillow, Fresha ([refs/sources.md](refs/sources.md)).

## Système visuel
Celui du [contrat](../system/README.md), sans changement : `card`, `foreground`, `muted-foreground`, `border`, `background` ; `primary` pour l'état choisi (comme les pastilles cochées et l'onglet actif) ; Source Sans 3, chiffres tabulaires ; `radius-chip` pour pastilles et segments ; `space-2` / `space-3` entre les lignes. Icônes de bien (une tuile) : trait 2 px, `currentColor`, 20 px, en SVG dans le code — pas d'emoji. Un jeton nouveau seulement si une direction retenue en a besoin ; il est alors ajouté au contrat.

## Contenu réaliste commun
Date : 14 octobre 2026. Compte : « 8 046 communes passent tes critères ». Réglage : Louer · Appartement · Total · 52 m² · 1 200 € ; mer 60 km. Bordeaux (33) : « 832 € par mois pour 52 m² (16,0 €/m²) », en Acheter « 4 427 €/m² à l'achat ». Strasbourg (67) en Acheter : « Prix d'achat inconnu : les ventes ne sont pas publiées en Alsace-Moselle ».

## Écran clé : le bloc du prix (onglet « Critères » à 390 px, et panneau de réglages en bureau)
De haut en bas, le contenu commun (l'ordre et la forme changent selon la direction) :
1. Titre de catégorie : « Logement » ; repliée, résumé à droite « Louer · Appartement · 1 200 € » (« Acheter · Maison · 5 000 €/m² »…).
2. Mode : « Louer » / « Acheter » (groupe « Louer ou acheter »).
3. Bien : « Appartement » / « Maison » (groupe « Type de logement »).
4. Unité : « Total » / « Au m² » (groupe « Unité du prix »).
5. Surface (en Total seulement) : champ « 52 » suivi de « m² » (nom « Surface en m² »).
6. Curseur : libellé « Loyer maximum » ou « Prix d'achat maximum » (H65 : « … au m² » en Au m²) ; valeur « 1 200 € », « 23 €/m² », « 5 000 €/m² », « 260 000 € », ou « Sans limite » ; sous-texte « par mois pour 52 m² », « par mois, au m² », « au m², prix médian des ventes », « pour 52 m² ».
Puis la catégorie « Mer », inchangée.

États à montrer : Louer · Total (départ) · Acheter · Au m² · Total avec surface 70 · Sans limite · catégorie repliée. Fiche : lignes de R24 (tableau de details.md), dont « Estimation du secteur (moins de 5 ventes dans la commune) » et les deux « Prix d'achat inconnu ». Légende : la ligne « Prix inconnu : pas de score » sous « Sans plafond : pas de score » (H60).

## Trois directions (à générer une par une, chacune « pas comme les précédentes »)
- **A — Segmenté en tête** (réf. 1) : Louer / Acheter en segmenté pleine largeur au-dessus de tout ; Appartement / Maison en pastilles ; l'unité en petit segmenté à droite de la valeur du curseur ; la surface dans le sous-texte (« par mois pour [52] m² », champ dans la phrase). Le plus compact.
- **B — Onglets et tuiles** (réf. 2) : Louer / Acheter en onglets soulignés qui remplacent le titre de catégorie ; Appartement / Maison en deux tuiles avec icône ; une ligne « Total | Au m² » + surface sous les tuiles ; le curseur en bas. Le plus visuel, le plus haut.
- **C — Phrase** : le bloc se lit comme une phrase, « **Louer** un **appartement** de **52 m²** pour **1 200 €** max par mois » ; chaque mot en gras est une pastille qui bascule d'un toucher (Louer ↔ Acheter, appartement ↔ maison, « 52 m² » ouvre le champ) ; l'unité bascule en touchant « par mois » / « au m² » ; le curseur dessous. Lecture d'abord, contrôles ensuite.

## Pas voulu
Menu déroulant ou fenêtre pour choisir le mode ou le bien ; un troisième niveau de catégorie ; une couleur de donnée (`score-*`, `place-marker`) sur un contrôle ; emoji ; histogramme des prix (pas dans la spec) ; texte d'aide qui explique les bascules.
