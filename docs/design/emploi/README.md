2026-11-21 · validé
# Design — emploi

Spec : [docs/specs/2026-11-21-emploi/](../../specs/2026-11-21-emploi/spec.md) · Temps convenu : 1 h, 1 session (tenu à peu près) · Support : prototypes en code, sans Figma, sans références (choix de Vincent) · Étend le [système](../system/README.md) (composant « Métier choisi ») et les tranches construites (le code fait foi).

Brief et grille : [brief.md](brief.md) · Choix : [decisions.md](decisions.md) · Relecture à l'aveugle : [review-directions.md](review-directions.md) · Captures : [directions/](directions/) (A, B, C, et **F retenue**).

**Pas de Figma pour cette tranche** : la référence est le prototype F, branche `prototype/emploi`, `src/proto/Emploi.tsx` (`?variant=F`), et ses captures. /build le reprend comme référence, pas comme code à garder (rien ne filtre ; 12 métiers ; fiche aux chiffres inventés sauf les projets de Bordeaux). **Le prototype fait foi jusqu'à ce que l'écran soit construit ; ensuite, c'est le code.**

## Écrans et états
| Écran ou état (details.md) | Où |
|---|---|
| Sans métier, 390 × 844 (page, puis catégorie seule) | [F-depart-390x844.png](directions/F-depart-390x844.png), [F-cat-depart-390x844.png](directions/F-cat-depart-390x844.png) |
| Suggestions (« dévelop ») | [F-cat-suggestions-390x844.png](directions/F-cat-suggestions-390x844.png) |
| Un métier, sans niveau (phrase « Coche un niveau… », focus sur « 10 % ») | [F-cat-sans-niveau-390x844.png](directions/F-cat-sans-niveau-390x844.png) |
| Un métier, « 10 % » coché | [F-un-390x844.png](directions/F-un-390x844.png), [F-cat-un-390x844.png](directions/F-cat-un-390x844.png) |
| Ajout en cours (« Second métier », « graph ») | [F-cat-ajout-390x844.png](directions/F-cat-ajout-390x844.png) |
| Deux métiers, dont le libellé le plus long | [F-deux-390x844.png](directions/F-deux-390x844.png), [F-cat-deux-390x844.png](directions/F-cat-deux-390x844.png) ; bureau : [F-deux-1440x900.png](directions/F-deux-1440x900.png), [F-cat-deux-1440x900.png](directions/F-cat-deux-1440x900.png) |
| Fiche avec deux métiers et le chômage | [F-fiche-390x844.png](directions/F-fiche-390x844.png), [F-fiche-page-1440x900.png](directions/F-fiche-page-1440x900.png) |

États sans mise en page propre :
| État | Déclencheur | Texte exact | Où il s'affiche |
|---|---|---|---|
| Aucun résultat | texte sans métier trouvé, ou déjà choisi | « Aucun métier trouvé » | sous le champ |
| 1 caractère | moins de 2 caractères | aucune suggestion | — |
| Repliée | catégorie repliée | « Peu importe », « 1 métier », « 2 métiers » (H132) | sous le titre « Emploi » |
| Chargement | données pas encore là | champ et cases désactivés, comme les autres réglages (H140) | panneau |
| Aucune commune | filtre trop serré | textes inchangés (H119 de mairies) | liste, compte |
| Sans plafond | prix sur Sans limite | communes du filtre en couleur neutre, textes inchangés | liste, carte |
| Fiche, ne passe pas | commune écartée par un métier | raison de R46, dans l'ordre de H139 | raisons de la fiche |
| Chômage inconnu | commune sans zone (fixture seulement) | « Chômage : inconnu » | fiche |

## Pour /breakdown
- Composant nouveau au contrat : « Métier choisi » ; Cases collées en 3 colonnes ; spec amendée (H130, H131, état **un métier**).
- Tests à revérifier pour le focus et le défilement : tableau d'impact de la spec (« Tests hors critères ») ; le focus qui va sur « 10 % » après un choix est nouveau.
- Non fait : relecture indépendante de F elle-même (seulement A, B, C à l'aveugle) ; les relectures design et navigateur de /build la couvrent.
