2026-10-12 · validé
À revoir (2026-10-14) : le réglage du loyer devient le réglage du prix (tranche immobilier, D21 de loyer-mer) ; à redessiner par /ui d'immobilier.
# Design — loyer-mer

Spec : [docs/specs/2026-10-12-loyer-mer/](../../specs/2026-10-12-loyer-mer/spec.md) · Temps convenu : 4 h, 2 sessions · Figma : [Carte où vivre](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q) (compte perso), pages « Système » et « loyer-mer ».

## Grille d'évaluation (les directions sont jugées là-dessus, pas au goût)
1. **Lire la France d'un coup d'œil** : où sont les aires qui passent et lesquelles sont les meilleures ; 5 tranches distinctes, deux gris distincts (au-dessus d'un plafond / hors aire), la couleur n'est jamais le seul indice (score et rang en texte dans la liste et la fiche). AC-1, AC-6.
2. **Régler et voir réagir** : les deux plafonds restent visibles et à portée en bureau comme à 390 px ; la carte et la liste réagissent sans attente (≤ 100 ms, H9). AC-2, AC-3, AC-13.
3. **La liste, c'est « ce qu'on va visiter »** : les 10 premières lisibles, choisissables, au clavier ; le compte « N aires passent tes plafonds ». AC-4, AC-11.
4. **Comprendre une couleur** : la fiche dit le score, le rang, le loyer pour 52 m², la mer « à vol d'oiseau », ou la raison du gris. AC-7 à AC-9.
5. **Des chiffres crédibles** : sources visibles (ANIL, Shom-IGN avec logos, Insee), unités explicites, aucun habillage qui fasse « gadget ».

## Figma — écrans et états
**Figma fait foi jusqu'à ce que l'écran soit construit ; ensuite, c'est le code.**
Jetons et composants : page « Système » ([planche](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=9-636)), contrat dans [docs/design/system/README.md](../system/README.md).

| Écran ou état (details.md) | Où |
|---|---|
| Page classée + fiche fermée (bureau) | [Bureau — classée (liste)](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=5-2) |
| Fiche · commune qui passe (bureau) | [Bureau — fiche, commune qui passe](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=5-154) |
| Fiche · commune qui ne passe pas | [Bureau — fiche, commune qui ne passe pas](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=5-235) |
| Page · fond indisponible (R8) | [Bureau — fond indisponible](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=5-314) |
| 390 px · classée (feuille) | [Mobile 390 — classée](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=7-343) · [contenu complet de la feuille](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=7-488) |
| 390 px · fiche ouverte | [Mobile 390 — fiche ouverte](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=11-667) |
| chargement, erreur, une seule, aucune commune, sans plafond, fiche sans plafond, estimation du secteur, valeur inconnue, moins d'1 km, focus | [tableau des états](https://www.figma.com/design/uJG30M95NtOV9eDkv8oF0q?node-id=9-514), une ligne chacun |

Images de carte : captures du prototype IGN (`directions/figma-carte-*.png`), à poser à la main dans les rectangles « Carte » ; les ronds et le fond uni y montrent l'ancien rendu (voir notes D17 sous les écrans).

## Suivi
Grille, références, brief, directions A–C, revue à l'aveugle, fusion ([decisions.md](decisions.md)), Figma, relecture ([review-figma.md](review-figma.md)) et corrections (D17) : faits. Non fait : l'écran « Bureau — sans plafond » (pas de capture), à juger sur le build. Prototypes : branche `prototype/loyer-mer`.
