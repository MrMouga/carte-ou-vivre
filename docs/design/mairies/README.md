2026-10-18 · validé
# Design — mairies

Spec : [docs/specs/2026-10-18-mairies/](../../specs/2026-10-18-mairies/spec.md) · Temps convenu : 1 h, 1 session (tenu) · Support : prototypes en code · Étend le [système](../system/README.md) et les tranches construites (le code fait foi).

Brief et grille : [brief.md](brief.md) · Choix : [decisions.md](decisions.md) · Relecture à l'aveugle : [review-directions.md](review-directions.md) · Captures : [directions/](directions/) (A, B, C, et **F retenue**).

**Pas de Figma pour cette tranche** (choix de Vincent, comme immobilier et cadre-de-vie) : la référence est le prototype F, branche `prototype/mairies`, `src/proto/VieLocale.tsx` (`?variant=F`), et ses captures. /build le reprend comme référence, pas comme code à garder (rien ne filtre, fiche aux données inventées sauf Bordeaux, Nice et Paris). **Le prototype fait foi jusqu'à ce que l'écran soit construit ; ensuite, c'est le code.**

## Écrans et états
| Écran ou état (details.md) | Où |
|---|---|
| Départ, rien de coché, téléphone 390 × 844 | [F-depart-390x844.png](directions/F-depart-390x844.png) |
| « Gauche » et « Sans étiquette » cochées, 390 × 844 | [F-choix-390x844.png](directions/F-choix-390x844.png) |
| Petit téléphone 375 × 548 à l'ouverture (curseur du prix visible) | [F-ouverture-375x548.png](directions/F-ouverture-375x548.png) |
| Bureau, départ et choix | [F-depart-1440x900.png](directions/F-depart-1440x900.png), [F-choix-1440x900.png](directions/F-choix-1440x900.png) |
| Fiche, ligne « Mairie » sans étiquette sur deux lignes | [F-fiche-1440x900.png](directions/F-fiche-1440x900.png) |

États sans mise en page propre :
| État | Déclencheur | Texte exact | Où il s'affiche |
|---|---|---|---|
| Repliée | catégorie repliée | « Peu importe », « 1 choix », « 2 choix »… (H110) | sous le titre « Vie locale » |
| Chargement | données pas encore là | cases désactivées, comme les autres réglages (H122) | panneau |
| Aucune commune | filtre trop serré | textes inchangés (H119) | liste, compte |
| Sans plafond | prix sur Sans limite | communes du filtre en couleur neutre, texte inchangé | liste, carte |
| Fiche | commune choisie | lignes de R40 ; raisons de R38 dans l'ordre de H113 | fiche |

## Pour /breakdown
- Composant : Cases séparées en 3 colonnes, avec une case décrite par une phrase (contrat du système mis à jour).
- Tests à revérifier pour le focus et le défilement : tableau d'impact de la spec (« Tests hors critères »).
- Non fait : relecture indépendante de F elle-même (seulement A, B, C à l'aveugle) ; les relectures design et navigateur de /build la couvrent.
