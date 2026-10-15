2026-10-15 · validé
# Design — cadre-de-vie

Spec : [docs/specs/2026-10-14-cadre-de-vie/](../../specs/2026-10-14-cadre-de-vie/spec.md) (révisée D10, D11 au prototype) · Temps convenu : 1 h 30, 1 session (tenu, à peu près) · Support : prototypes en code · Étend [loyer-mer](../loyer-mer/README.md), [interface-telephone](../interface-telephone/README.md), [immobilier](../immobilier/README.md) (construits : le code fait foi) et le [système](../system/README.md).

Brief et grille : [brief.md](brief.md) · Directions et choix : [decisions.md](decisions.md) · Relecture à l'aveugle : [review-directions.md](review-directions.md) · Références : [refs/](refs/) · Captures : [directions/](directions/) (A, B, C, et **F retenu**).

**Pas de Figma pour cette tranche** (choix de Vincent, comme immobilier) : la référence est le prototype F, branche `prototype/cadre-de-vie`, `src/proto/CadreDeVie.tsx` (`?variant=F`), et ses captures. /build le reprend comme référence, pas comme code à garder (type et montagne sans données, choix hors de l'adresse sauf la mer, interligne `leading-tight` des libellés sur deux lignes à remplacer par un jeton). **Le prototype fait foi jusqu'à ce que l'écran soit construit ; ensuite, c'est le code.**

## Écrans et états
| Écran ou état (details.md) | Où |
|---|---|
| Départ, tout sur Peu importe, téléphone 390 × 844 | [F-depart-390x844.png](directions/F-depart-390x844.png) |
| Choix faits (taille, Ville dense, mer 50 km, montagne 30 km) | [F-choix-390x844.png](directions/F-choix-390x844.png) |
| Catégorie repliée (résumé « Peu importe ») | [F-repliee-390x844.png](directions/F-repliee-390x844.png) |
| Petit téléphone 375 × 548 à l'ouverture (curseur du prix visible) | [F-ouverture-375x548.png](directions/F-ouverture-375x548.png) |
| Bureau, départ et choix (types qui passent à la ligne, taille en 2 × 2) | [F-depart-bureau.png](directions/F-depart-bureau.png), [F-choix-bureau.png](directions/F-choix-bureau.png) |

États sans mise en page propre :
| État | Déclencheur | Texte exact | Où il s'affiche |
|---|---|---|---|
| Résumé replié | catégorie repliée | « Peu importe », ou « 1 taille · 2 types · Mer 50 km · Montagne 30 km » (H75) | sous le titre de la catégorie |
| Aucune commune | type, mer ou montagne trop serrés | textes inchangés (D8) | liste, compte |
| Sans plafond | prix sur Sans limite, mer et montagne sur Peu importe, aucun proche | texte inchangé (D8) ; communes filtrées en couleur neutre | liste, carte |
| Fiche | commune choisie | « Ville dense · 260 000 habitants », « Commune de montagne », « 50 km de la montagne à vol d'oiseau », raisons (R27, R29, R30) | fiche |

Composants nouveaux : [système](../system/README.md) (Cases séparées, Cases collées, Rangée qui défile).

## Pour /breakdown
- Tests existants qui lisent les noms disparus (« Mer à moins de », « Taille de ville », « Petite ville ») : tableau d'impact de la spec.
- Les cases collées de la montagne et de la mer sont un `radiogroup` de `role=radio` : les tests disent « cochée » = `aria-checked`.
- Non fait : relecture indépendante des écrans finaux (étape « review » de /ui) ; F a été mesurée et essayée par Vincent ; les relectures design et navigateur de /build la couvrent.
