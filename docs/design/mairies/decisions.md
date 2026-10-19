# Décisions de design — mairies
2026-10-18 · Validé par Vincent (piste F)

## Pistes
| Piste | Idée | Verdict |
|---|---|---|
| A | Rangée qui défile, comme les types d'environnement | Écartée : à 390 px, 4 pastilles sur 7 visibles ; « Sans étiquette » (91 % des communes) hors de l'écran, même cochée ; rien n'explique D8 |
| B | Axe gauche → droite en Cases collées, « Sans étiquette » en barre pleine largeur avec sous-texte | Écartée : les Cases collées veulent dire « un seul choix » dans le système (mer, montagne) ; barre noire de 358 × 44 px une fois cochée ; cases de 59 px |
| C | Cases séparées 3 × 2, « Sans étiquette » sous une phrase d'explication | Base retenue ; trop haute (255 px à 390 px) |
| **F** | **C resserrée** | **Retenue** |

Pari de Vincent : « entre C et B » ; relecteur à l'aveugle : C ([review-directions.md](review-directions.md)).

## F — ce qui est décidé
- Groupe « Mairie élue en 2026 » : **Cases séparées en 3 colonnes**, dans l'ordre de R38 : Gauche · Divers · Centre / Droite · Extrême droite (amendé le 2026-10-19 avec D2 : « Extrême gauche » retirée ; la sixième case de la grille reste vide, « Sans étiquette » garde sa ligne avec sa phrase — décidé par Claude) ; libellés entiers sur une ligne (2 au plus), 44 px de haut au moins.
- **« Sans étiquette » au format d'une case**, 3e colonne de la 2e ligne (la case laissée libre par « Extrême gauche ») ; **sous la grille**, une explication générale du groupe, non adossée à « Sans étiquette » : « Moins de 3 500 habitants : le ministère ne classe pas les listes. » en `secondaire` / `muted-foreground`, reliée au groupe « Mairie élue en 2026 » par `aria-describedby` (lue à l'entrée dans le groupe ; WCAG 1.3.1). *Amendé par Vincent le 2026-10-19 (démo 2)* ; texte inchangé et lien au groupe décidés par Claude, contestables. Avant : 1re colonne de la 3e ligne, phrase à sa droite reliée au bouton.
- Toutes les cases cochées en `primary`, aucune couleur par bloc (brief, « Pas voulu »).
- Environ 210 px de haut à 390 px ; à 375 × 548, le curseur du prix reste visible (H48), capture `F-ouverture-375x548.png`.
- Fiche : la ligne de R40 en `texte`, sous la montagne, qui passe à la ligne naturellement ; **espace insécable dans « 3 500 »** (H3 de loyer-mer), aussi dans la phrase du panneau.
- Les 7 cases sont désactivées pendant le chargement, comme les autres réglages (relecture, constat commun ; H122).

## Non jugé
Résumé replié (H110, texte de la spec) ; carte filtrée (le prototype ne filtre pas) ; focus au clavier (celui des Cases séparées existantes).
