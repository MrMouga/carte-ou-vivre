2026-10-13 · brouillon
# Design — proches

Spec : [docs/specs/2026-10-13-proches/](../../specs/2026-10-13-proches/spec.md) (révisée D10, D11) · Temps convenu : 2 h, 1 session · Figma : [Carte où vivre](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q), page « proches » (`21:561`) et composants sur « Système » · Étend le design [loyer-mer](../loyer-mer/README.md) (construit : le code fait foi pour ce qui existe) et le [système](../system/README.md).

## Grille d'évaluation
1. **Ajouter un proche sans hésiter** : chercher, choisir, nommer, « Ajouter » ; on comprend qu'il faut attendre quelques secondes, et ce qui se passe en file, en panne ou à l'annulation. AC-1, AC-10, AC-14.
2. **Lire la carte depuis ses proches** : les repères nommés se voient à l'échelle de la France, sans se confondre avec les ronds du top 10 ni avec les noms du Plan IGN, et sans cacher les couleurs. D4.
3. **Régler chaque proche comme le loyer** : un plafond par proche, à portée ; le panneau tient avec 5 proches, en bureau comme à 390 px. AC-2, AC-7.
4. **Comprendre une couleur** : la fiche donne le temps vers chaque proche et la mer dans les deux unités, ou la raison du refus. AC-3, AC-5, AC-13.
5. **Confiance** : « Effacer mes proches » se trouve sans chercher. D7. (La phrase sur l'IGN est retirée : D12.)

## Figma — écrans et états
**Figma fait foi jusqu'à ce que l'écran soit construit ; ensuite, c'est le code.**

| Écran ou état (details.md) | Où |
|---|---|
| Page classée, 2 proches prêts, aucune ville choisie ; pastilles « 4 h au plus » ; repères | [Bureau — proches, aucune ville choisie](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=21-562) |
| Ville choisie : fiche (mer en km et en minutes, TES PROCHES) et pastilles de temps (D10, R15) | [Bureau — ville choisie](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=22-307) |
| Zone Tes proches · recherche : champ, suggestions, « Ajouter » inactif ; panneau défilé, compte collé en bas | [Bureau — ajout d'un proche](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=22-486) |
| Zone Tes proches · suggestion choisie : champ « Nom » prérempli (« Nantes (44) »), « Ajouter » actif | [Bureau — ajout, suggestion choisie](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=26-1588) |
| Zone · plein ; proches prêt / indisponible / calcul ; catégories repliées ; pastilles sur deux lignes ; repères des trois états | [Bureau — 5 proches, catégories repliées](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=22-640) |
| 390 px : feuille complète avec Tes proches (pas de pastilles) | [Mobile 390 — feuille complète](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=23-835) |
| vide, aucune adresse, recherche indisponible, adresse déjà présente, plein, en attente, calcul, indisponible, mémoire refusée, aucune commune avec un proche, pastille au-dessus, mer en minutes inconnue, catégorie repliée | [tableau des états](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=23-1616), une ligne chacun |
| Composants : Repère proche `18:144`, Pastille de temps `18:145`, Suggestion d'adresse `18:151`, Bascule mer `18:167`, Ligne de proche `20:168`, Catégorie repliable `20:180` | page « Système » ; contrat : [système](../system/README.md) |

Images de carte : pas posées (fond uni) ; repères à des positions indicatives. Captures du prototype choisi : [directions/F-*.png](directions/).
Fiche à 390 px : mêmes lignes qu'en bureau, dans la fiche qui remplace les réglages (règle de loyer-mer, inchangée) ; pas d'écran à part.

## Suivi
Grille, références, brief, pistes A–C dans le vrai site, revue à l'aveugle ([review-directions.md](review-directions.md)), fusion F choisie par Vincent ([decisions.md](decisions.md)), spec révisée (D10, D11), Figma : faits. Relecture des écrans Figma : en cours. Prototypes : branche `prototype/proches`.
