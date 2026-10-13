2026-10-13 · validé
# Design — interface téléphone

Spec : [docs/specs/2026-10-13-interface-telephone/](../../specs/2026-10-13-interface-telephone/spec.md) (révisée D9) · Temps convenu : 1 h 30, 1 session · Figma : [Carte où vivre](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q), page « interface-telephone » (`36:1757`) et composants sur « Système » · Étend le design [loyer-mer](../loyer-mer/README.md) et [proches](../proches/README.md) (construits : le code fait foi) et le [système](../system/README.md).

Brief et grille : [brief.md](brief.md) · Directions et choix : [decisions.md](decisions.md) · Relecture à l'aveugle : [review-directions.md](review-directions.md) · Références : [refs/](refs/) · Captures : [directions/](directions/) (A, B, C, et F retenu).

**Figma fait foi jusqu'à ce que l'écran soit construit ; ensuite, c'est le code.** Ici, l'écran retenu existe déjà en code (prototype, branche `prototype/interface-telephone`, `src/ui/FeuilleMobile.tsx`, `?variant=F`) : /build le reprend comme référence, pas comme code à garder tel quel.

## Figma — écrans et états
| Écran ou état (details.md) | Où |
|---|---|
| ouverte · Critères (initial) | [Mobile 390 — Ouverte · Critères](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=36-1759) (capture de F) |
| ouverte · Les 10 premières | [Mobile 390 — Ouverte · Les 10 premières](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=36-1761) |
| repliée | [Mobile 390 — Repliée](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=36-1763) |
| fiche | [Mobile 390 — Fiche](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=36-1765) |
| ajout | inchangé : [proches, Mobile 390 — ajout, clavier ouvert](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=27-1160) (poignée seule au-dessus du champ, R20) |
| chargement, erreur, sans plafond, aucune commune, proche qui finit son calcul feuille repliée | [tableau des états](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=36-1767), une ligne chacun |
| Composants : Onglets de feuille `36:136`, Tête de feuille `36:145` (Ouverte · Repliée · Fiche) | page « Système » ; contrat : [système](../system/README.md) |

Profondeur « légère » choisie par Vincent : les écrans sont des captures du prototype (pas reconstruits depuis les composants), plus le tableau des états et les deux composants nouveaux.

## Non fait
- Relecture indépendante des écrans finaux (étape « review » de /ui) : non faite, temps convenu écoulé ; la fusion F a été essayée par Vincent sur son téléphone et mesurée (curseur visible à 375 × 548, compte sur une ligne, focus au repli). Les relectures design et navigateur de /build la couvrent.

## Pour /breakdown
- Zoom 3 des tuiles (D2) : généré pour le prototype (3 tuiles, 1,6 Mo non compressé), à faire dans `scripts/data/tuiles.py` et la source de la carte ; mesurer le poids servi.
- Clic fantôme : un toucher qui déplie la feuille ne doit pas ouvrir la ligne apparue sous le doigt (test à écrire).
- Tous les tests à 390 px qui lisaient la liste sous les réglages passent par l'onglet « Les 10 premières ».
