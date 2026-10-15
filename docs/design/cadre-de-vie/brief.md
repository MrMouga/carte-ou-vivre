# Brief — cadre-de-vie
2026-10-15 · Spec : [cadre-de-vie](../../specs/2026-10-14-cadre-de-vie/spec.md) (D2–D9, R27–R32, H69–H83) · Système : [contrat](../system/README.md), inchangé sauf besoin dit ici.

## Grille (on juge les directions sur ces 5 objectifs, pas sur le goût)
1. **Place** — à 375 × 548, le curseur du prix reste entièrement visible à l'ouverture de l'onglet « Critères » (H48 d'interface-telephone) ; « Cadre de vie » vient dessous et se découvre en faisant défiler la feuille, sans la faire grandir.
2. **Compact, une ligne par groupe** (Vincent : Strava, « les pastilles sur une ligne ») — chaque groupe tient sur une ligne quand c'est possible (Mer, Montagne, Taille) ; le type d'environnement (7 libellés longs) est le seul qui peut en prendre plusieurs.
3. **Choix unique ≠ cases cumulables** — on voit sans lire que Mer et Montagne n'acceptent qu'un choix (radio), et que Taille et Type en acceptent plusieurs (bascules).
4. **Lisible d'un coup d'œil** — on sait ce qui filtre la carte, catégorie ouverte comme repliée (résumé H75 : « Mer 50 km · En montagne · 1 type »).
5. **Toucher et cohérence** — cibles de 44 px à 390 px ; composants existants (Pastille, Catégorie repliable, Segmenté) ; pas de couleur de donnée sur un réglage.

## Ressenti
Le même que le reste de la carte : sobre, dense sans être tassé, des choix visibles qu'on touche sans lire d'aide. Comme les filtres de Strava : des titres courts et des rangées de pastilles serrées.

## Références
| Réf | Fichier | Ce qu'on prend | Ce qu'on ne prend pas | Mots de Vincent |
|---|---|---|---|---|
| 1 · Strava ([Mobbin](https://mobbin.com/screens/f9f22428-5963-4826-bcdd-ef5300718aef)) | [refs/strava-groupes-denses.jpg](refs/strava-groupes-denses.jpg) | Groupes de pastilles serrées sous un titre court, une rangée par groupe | L'orange, le curseur à deux poignées, les boutons Reset / Apply (nos réglages s'appliquent tout de suite) | « celle que je préfère. Les pastilles sur une ligne » |
Montrées, non retenues : Mindtrip, Shopee, Tripadvisor, HelloFresh ([refs/](refs/), liens dans [sources.md](refs/sources.md)).

## Système visuel
Celui du [contrat](../system/README.md) : `card`, `foreground`, `muted-foreground`, `border`, `background` ; `primary` pour l'état choisi ; Source Sans 3, style `pastille` (13) pour les pastilles, `secondaire` (12) pour les sous-titres « Urbain » / « Rural » et « Mer à moins de » ; `radius-chip` ; `space-2` entre pastilles, `space-3` entre groupes. Une pastille de choix unique peut différer d'une bascule (point radio, segment collé…) : c'est ce que les directions explorent. Un jeton nouveau seulement si une direction retenue en a besoin.

## Contenu réaliste commun
Date : 15 octobre 2026. Départ (D7) : Louer · Appartement · 52 m² · 1 200 € ; cadre de vie sur Peu importe ; compte « 34 674 communes passent tes critères ». Exemple de réglage : Mer 50 km, Montagne « En montagne », type « Grand centre urbain » et « Centre urbain intermédiaire », taille « 50 000 – 200 000 hab. ». Fiches : Bordeaux (33) « Grand centre urbain · 268 000 habitants », « 39 km de la mer à vol d'oiseau » ; Pau (64) « 80 000 habitants », « 17 km de la montagne à vol d'oiseau » (mesure de la discovery) ; Chamonix-Mont-Blanc (74) « Commune de montagne ».

## Écran clé : la catégorie « Cadre de vie » (onglet « Critères » à 390 px, et panneau de réglages en bureau)
Sous la catégorie « Logement » (inchangée) et au-dessus de « Tes proches ». De haut en bas, le contenu commun (l'ordre des groupes est fixé par la spec, la forme change selon la direction) :
1. Titre de catégorie : « Cadre de vie » ; repliée, résumé dessous (H75) : « Peu importe », ou « 1 taille · 2 types · Mer 50 km · En montagne ».
2. **Taille de la commune** — bascules : « Moins de 10 000 hab. », « 10 000 – 50 000 hab. », « 50 000 – 200 000 hab. », « Plus de 200 000 hab. ».
3. **Type d'environnement** — sous-titre « Urbain » : « Grand centre urbain », « Centre urbain intermédiaire », « Ceinture urbaine », « Petite ville » ; sous-titre « Rural » : « Bourg rural », « Rural à habitat dispersé », « Rural à habitat très dispersé ».
4. **Proximité avec la nature** — « Mer à moins de » : Peu importe, 10 km, 30 km, 50 km, 100 km ; « Montagne à moins de » : Peu importe, En montagne, 10 km, 30 km, 50 km, 100 km.
États : tout sur Peu importe (départ) ; plusieurs choix ; repliée. Les textes de la fiche (R30) et des raisons ne sont pas dans cet écran.

## Pas voulu
Menus déroulants qui cachent les choix ; curseur pour la mer (D4) ; couleur de donnée (`score-*`, `place-marker`) sur un réglage ; emojis (🌊 🏔️) ; bouton « Appliquer » ; icônes décoratives sans rôle.
