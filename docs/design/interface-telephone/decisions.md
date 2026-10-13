# Décisions de design — interface téléphone
2026-10-13 · /ui · prototypes en code, branche `prototype/interface-telephone` (variantes `?variant=A|B|C|F`)

## Directions comparées
- **A — Feuille classique** : feuille à 56 %, chevron sous la poignée, onglets en pilule pleine largeur, compte collé en bas de « Critères », barre repliée au compte centré.
- **B — Feuille flottante** : feuille détachée des bords à 52 %, onglets compacts et chevron sur une ligne, repliée en pilule flottante.
- **C — Compte en titre** : compte en tête de feuille (même ligne ouverte et repliée), feuille à 45 %.

Pari de Vincent avant la relecture : **A**. Relecture à l'aveugle ([review-directions.md](review-directions.md)) : **C** comme base (bande de carte 365 px contre 292 pour A à 390 × 664 ; même ligne attrapée et retrouvée), avec deux Majeurs à corriger (curseur du loyer hors écran à 375 × 548 ; compte non annoncé) et deux défauts communs (focus perdu au repli ; onglets de 28 px).

## Retenu : F, fusion sur la base de C (choix de Vincent)
- De **C** : le compte en tête de feuille, identique ouverte et repliée ; feuille à 45 % de la hauteur.
- Corrections de la relecture : feuille d'au moins 272 px (curseur du loyer visible à 375 × 548, de 519 à 539 px) ; compte annoncé aux lecteurs d'écran ; au repli, le focus passe à « Déplier la feuille » ; onglets de 44 px (rail `background`, onglet actif en `primary`, comme les pastilles cochées).
- Retours de Vincent après essai :
  - **pas de chevron** (« trop gros, c'est assez évident que c'est une bottom sheet ») : la ligne poignée + compte **est** le bouton (« Replier la feuille » / « Déplier la feuille », `aria-expanded`), un toucher ou un glisser la fait changer de position ; au clavier, c'est un vrai bouton ;
  - **une seule taille** pour toute la phrase du compte (« 8 046 communes » n'est plus en serif plus grand), puis « un poil plus gros » : style `valeur` (18 px gras), une ligne jusqu'à « Aucune commune ne passe tes critères » à 375 px (304 px sur 343) ;
  - **fiche sans espace vide** en haut : « ← Les 10 premières » juste sous la poignée (40 px du haut de la feuille).
- Repliée : barre de ≈ 49 px, poignée et compte centré, toute la barre est le bouton.
- Trouvé en construisant : un toucher qui déplie la feuille laissait passer son clic à la ligne de la liste apparue sous le doigt (fiche ouverte par erreur) ; le prototype avale ce clic. À reprendre au build (cas à tester).
- Zoom 3 des tuiles généré pour le prototype seulement : la côte se lit en vert à 390 × 664 (risque 2 de la spec). Poids : 1,6 Mo non compressé pour les 3 tuiles du zoom 3 (la spec disait ≈ 1 Mo) ; poids servi à mesurer en tâche 0.

Spec révisée en conséquence : **D9** (hauteur, compte en tête servant de bouton, sans chevron), H43, H46, H48, AC-10 (commit `2b8d614`).

## Écarté
- B : sa barre repliée perdait la poignée (affordance du glisser) et rien de sa structure n'a gagné un objectif.
- Le compte en serif plus grand que le reste de la phrase (C d'origine) : refusé par Vincent.
- Le chevron (A, B, C) : refusé par Vincent.
