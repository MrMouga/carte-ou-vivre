# Brief — mairies
2026-10-18 · Spec : [docs/specs/2026-10-18-mairies/](../../specs/2026-10-18-mairies/spec.md) · Temps convenu : 1 h, prototypes en code, sans Figma (choix de Vincent, comme cadre-de-vie)

## Grille de jugement
1. **Lisible d'un coup d'œil** : les 7 choix se lisent sans hésiter, dans l'ordre officiel (D2), à 390 px et en bureau (AC-1, AC-9).
2. **Sans étiquette ne trompe pas** : on comprend que c'est surtout les petites communes, pas « des listes sans bord » (D8).
3. **Le panneau reste court** : « Vie locale » ne repousse pas les proches loin sous la ligne de flottaison ; à 375 × 548, le curseur du prix reste visible (H48).
4. **Le même geste que les autres filtres** : cocher ce qu'on garde, aucune = peu importe (D3) ; cibles de 44 px au toucher.
5. **Neutre** : aucune couleur de parti, rien qui ressemble à un tract ; le filtre a le même poids visuel que la taille ou le type.

## Ressenti
Le reste du panneau : sobre, encre et papier. La politique est une information parmi d'autres, pas un sujet mis en avant.

## Références
Aucune (choix de Vincent) : les composants du [système](../system/README.md) suffisent — Cases séparées, Cases collées, Rangée qui défile.

## Système visuel
Celui du projet ([contrat](../system/README.md)), sans nouveau jeton : pastilles `border` / `card`, cochées `primary` ; textes `pastille`, `secondaire`, `mentions` ; `radius-chip`. **Pas de couleur par bloc** : `primary` pour toutes les pastilles cochées.

## Contenu réaliste commun
Fiche de Bordeaux (33) : « Mairie : Centre (Union du centre) · « Faire Gagner Bordeaux » » ; de Nice (06) : « Mairie : Extrême droite (Union de l'extrême droite) · « LE MEILLEUR EST A VENIR AVEC ERIC CIOTTI » » ; d'un village : « Mairie : sans étiquette (moins de 3 500 habitants) · « Vivre à Terrebasse » ». Étiquettes en clair : en attente de l'annexe de la circulaire (H117), celles-ci sont provisoires.

## Écrans
Panneau de réglages, catégorie « Vie locale » (entre « Cadre de vie » et « Tes proches ») :
1. Titre de catégorie « VIE LOCALE », résumé replié « Peu importe » / « 2 choix ».
2. Sous-titre « Mairie élue en 2026 ».
3. Pastilles : « Extrême gauche », « Gauche », « Divers », « Centre », « Droite », « Extrême droite », « Sans étiquette ».

Fiche : la ligne « Mairie : … » sous la ligne de la montagne (R40) — texte fixé par la spec ; seule sa mise en page (retour à la ligne d'un nom long, 121 caractères au plus) est à dessiner.

## Pas voulu
Couleurs de partis (rouge, bleu, rose…), logos, hémicycle, curseur gauche-droite continu, icônes politiques, mise en avant du filtre (encadré, badge « nouveau »).
