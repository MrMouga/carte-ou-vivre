2026-10-14 · validé
# Design — immobilier

Spec : [docs/specs/2026-10-14-immobilier/](../../specs/2026-10-14-immobilier/spec.md) (révisée D10) · Temps convenu : 1 h 30, 1 session (dépassé d'environ 1 h : la contrainte de place sur petit téléphone) · Support : prototypes en code · Étend [loyer-mer](../loyer-mer/README.md), [proches](../proches/README.md), [interface-telephone](../interface-telephone/README.md) (construits : le code fait foi) et le [système](../system/README.md).

Brief et grille : [brief.md](brief.md) · Directions et choix : [decisions.md](decisions.md) · Relecture à l'aveugle : [review-directions.md](review-directions.md) · Références : [refs/](refs/) · Captures : [directions/](directions/) (A, B, C, et **F retenu**).

**Pas de Figma pour cette tranche** (choix de Vincent) : la référence est le prototype F, branche `prototype/immobilier`, `src/proto/BlocPrix.tsx` (`?variant=F`), et ses captures. /build le reprend comme référence, pas comme code à garder (données d'achat inventées, état du prix hors de l'adresse, liaison de module). **Le prototype fait foi jusqu'à ce que l'écran soit construit ; ensuite, c'est le code.**

## Écrans et états
| Écran ou état (details.md) | Où |
|---|---|
| Louer · Total (départ), téléphone 390 × 844 | [F-louer-390x844.png](directions/F-louer-390x844.png) |
| Acheter · Au m² | [F-acheter-390x844.png](directions/F-acheter-390x844.png) |
| Acheter · Total (champ surface) | [F-acheter-total-390x844.png](directions/F-acheter-total-390x844.png) |
| Catégories repliées (résumé sous le titre) | [F-repliee-390x844.png](directions/F-repliee-390x844.png) |
| Petit téléphone 375 × 548 (curseur visible, France peinte, titre masqué) | [F-louer-375x548.png](directions/F-louer-375x548.png) |
| Bureau, Louer et Acheter | [F-louer-bureau.png](directions/F-louer-bureau.png), [F-acheter-bureau.png](directions/F-acheter-bureau.png) |

États sans mise en page propre (une ligne chacun) :
| État | Déclencheur | Texte exact | Où il s'affiche |
|---|---|---|---|
| Sans limite | curseur au-delà du maximum | « Sans limite » à la place de la valeur | ligne du curseur |
| Surface en cours de saisie | champ vide ou hors de 10 à 300 m² | ce qui est tapé ; la carte garde la dernière surface valide ; à la sortie, la dernière surface valide revient | champ surface |
| Aucune commune (Acheter) | prix ou mer trop serrés | « Aucune commune ne passe tes critères. Relâche le prix, la mer ou la taille. » (avec un proche : « … la taille ou un proche. ») | liste ; compte |
| Sans plafond (Acheter) | prix et mer sur Sans limite, aucun proche | « Fixe un prix d'achat ou une distance à la mer pour classer les communes. » | liste |
| Fiche, prix inconnu | commune d'Alsace-Moselle ou sans vente dans le secteur | « Prix d'achat inconnu : les ventes ne sont pas publiées en Alsace-Moselle » · « Prix d'achat inconnu : trop peu de ventes dans le secteur » · « Loyer inconnu » | fiche, ligne du prix |
| Fiche, estimation du secteur (achat) | moins de 5 ventes dans la commune | « Estimation du secteur (moins de 5 ventes dans la commune) » | fiche, sous la ligne du prix |
Lignes de la fiche et raisons : tableau de R24 dans [details.md](../../specs/2026-10-14-immobilier/details.md). Légende : inchangée (H60).

Jetons et composants nouveaux : [système](../system/README.md) (`valeur-curseur`, `taille-reglages` 340, `taille-feuille-min` 338 ; Choix souligné, Tuile de bien, Segmenté d'unité, Champ surface ; Catégorie repliable au résumé sous le titre).

## Non fait
- Figma : pas de page « immobilier » ni de composants Figma (choix de Vincent) ; les jetons nouveaux sont à reporter dans Figma le jour où une page est faite.
- Relecture indépendante des écrans finaux (étape « review » de /ui) : non faite ; F a été mesurée (cibles 44 px, curseur à 537 px à 375 × 548, nom lu « Loyer mensuel, loyer maximum ») et essayée par Vincent. Les relectures design et navigateur de /build la couvrent.

## Pour /breakdown
- Tests existants : le curseur garde le nom « Loyer maximum » dans son nom lu (H65) ; le test hors AC de H48 lit `taille-feuille-min` (338) ; les tests de loyer-mer sur « 832 € par mois pour 52 m² » portent sur la fiche, qui ne change pas.
- Le résumé de la catégorie repliée passe sous le titre pour **toutes** les catégories : vérifier les tests qui lisent le résumé (Taille, Proches).
- AC-1 d'interface-telephone à 375 × 548 : à revérifier avec la feuille de 338 px et le titre masqué (mesuré dans le prototype : France peinte, 210 px de carte).
- « à vol d'oiseau » retiré sous le curseur de la mer seulement ; la fiche le garde (D8 de loyer-mer).
