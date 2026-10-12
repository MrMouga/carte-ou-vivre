# À 390 px, vérifier où tombe un contenu qui « remplace » un autre dans une feuille
Étiquettes : design, figma · Tranche : loyer-mer · Source : /ui du 2026-10-12, relecture du design Figma (review-figma.md)

**Problème** — Convertir en Figma une mise en page bureau « la fiche remplace la liste dans le panneau droit » vers une feuille mobile qui monte du bas.
**Symptômes** — Le relecteur a mesuré que la liste commençait à y ≈ 850 sur un écran de 844 px : une fiche ouverte « à la place de la liste » serait tombée hors de l'écran, exactement le défaut pour lequel une direction avait été écartée. L'auteur avait recopié la règle du bureau sans regarder les positions. Agrandir les pastilles à 44 px pour les cibles tactiles a encore descendu la liste.
**Ce qui n'a pas marché** — Reprendre telle quelle la règle « remplace » du bureau ; juger l'écran mobile sur une capture sans lire les coordonnées.
**Ce qui a marché** — Lire la position y des blocs clés dans la frame (feuille, première ligne, emplacement de la fiche) contre la hauteur de l'écran ; à 390 px, faire remplacer par la fiche les réglages (en haut de la feuille), pas la liste ; dessiner l'écran « fiche ouverte » à part.
**Prévention** — Pour chaque écran mobile, une ligne dans l'auto-contrôle : « l'élément qui s'ouvre après une action est-il visible sans défiler ? », vérifiée par les coordonnées, pas à l'œil. Refaire la vérification après tout changement de taille (cibles tactiles).
