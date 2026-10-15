# Décisions — cadre-de-vie
2026-10-15 · Grille : [brief.md](brief.md) · Relecture à l'aveugle : [review-directions.md](review-directions.md)

## Directions
- **A** — rangées de pastilles qui défilent sur le côté, une par groupe (référence Strava). Relecture : la ligne unique cache des choix ; en bureau, la souris n'atteint pas les derniers (barre masquée).
- **B** — segments collés à libellés courts (« Dedans », « < 10 000 »), cases à cocher pour les types. Relecture (Bloquant) : texte affiché absent du nom lu (WCAG 2.5.3) ; la taille, à choix multiple, a la forme d'un choix unique.
- **C** — sous-rubriques repliables, une ouverte à la fois. Relecture : deux touchers par réglage, choix cachés (exclu par le brief).
- La relecture proposait : structure de B, pastilles à coche de A pour taille et type, segments pour mer et montagne.

## Retenue : F, fusion de Vincent (2026-10-15)
- **Type d'environnement** : une rangée de pastilles à coche qui défile (A) au téléphone ; en bureau, elle passe à la ligne (correction du Majeur de A). 4 niveaux (D10 de la spec), plus de sous-titres Urbain / Rural.
- **Taille de la commune** : 4 cases **séparées** (`gap` `space-2`), libellés entiers de R27 sur deux lignes, espaces insécables dans les milliers ; 2 × 2 en bureau. Séparées = choix multiple.
- **Mer, Montagne** : cases **collées** (choix unique, `role=radiogroup`), « Peu importe / 10 km / 30 km / 50 km / 100 km », libellés entiers (correction du Bloquant de B). Montagne sans « En montagne » (D11).
- *Pourquoi* : choix de Vincent après essai sur son téléphone (« la rangée qui défile pour type d'environnement ; segment en case pour habitants, mer, montagne ») ; « type d'environnement prend trop de place » → 4 niveaux.
- *Contesté par la relecture, gardé* : la taille en cases ressemble aux cases de la mer ; l'écart entre cases est le seul signe du choix multiple. À juger à la démo ; si Vincent ne sent pas la différence, ajouter la coche des pastilles.
- Mesuré dans le prototype : à 375 × 548, curseur du prix de y 518 à 537 (H48 tenu) ; toute la section tient sous l'onglet à 390 × 844, « Campagne isolée » en partie hors champ (défilement).
