# Index des specs
Généré par studio (`scripts/spec-index.sh`) le 2026-10-12 — ne pas éditer à la main. Avant d'écrire une tranche, lire ici ce que les tranches existantes possèdent : une règle ou un écran touché est à classer *inchangée / étendue / contredite* dans la nouvelle spec.

| Tranche | Statut | Écrans | Décisions | Règles | Critères (passent) | Hypothèses | Ne change pas | À revoir |
|---|---|---|---|---|---|---|---|---|
| 2026-10-12-loyer-mer | validée | Carte | 9 | 7 | 13 (0) | 9 | Première tranche. | — |

## 2026-10-12-loyer-mer — validée
Décisions : D1 : Tranche 1 : loyer + mer, aucun service extérieur.  · D2 : Les chiffres d'une aire sont ceux de sa commune-centre ; pour Paris, Lyon et Marseill · D3 : Un plafond par critère (ou « sans limite »), sans poids.  · D4 : Note d'un critère = 100 × (1 − valeur / plafond) ; score = moyenne des notes des crit · D5 : 5 couleurs par tranches absolues de score ; au-dessus d'un plafond, gris avec la rais · D6 : La liste des 10 premières est dans cette tranche.  · D7 : L'adresse de la page garde les plafonds, pas l'aire choisie.  · D8 : La mer est une distance à vol d'oiseau, écrite comme telle.  · D9 : Pas de fond de carte : seulement les formes des aires et des communes hors aire. 
Écrans et zones : Carte — route `/`  ·  dans l'URL : `loyer` (euros ou `aucun`), `mer` (km ou `aucun · zones = carte — formes des 675 aires et des communes hors aire, sans fond (D9), 
Règles : R1 : Une aire passe si, pour chaque critère actif, sa valeur affichée (loyer à l'euro, mer · R2 : La note et le score suivent D4, avec les valeurs affichées de R1 ; le score s'affiche · R3 : La couleur d'une aire qui passe suit la tranche de son score affiché : [0, 20), [20,  · R4 : Chiffres et noms d'une aire (D2, D8, et les 52 m² de STATE.md) : « Bordeaux (33) », c · R5 : La liste montre au plus 10 aires qui passent, triées par score affiché décroissant (é · R6 : Le rang de la fiche s'écrit « 1re sur 1 aire qui passe », « 3e sur 3 aires qui passen · R7 : À l'ouverture, les plafonds sont lus dans l'adresse ; une valeur absente ou invalide 
Hypothèses : H1 : Plafonds de départ : loyer 1 200 €, mer 60 km. C'est l'exemple du · H2 : Réglages : loyer de 300 à 2 000 € par pas de 50 € ; mer de 5 à 20 · H3 : Arrondis et formats : score à l'entier le plus proche (0,5 vers l · H4 : À égalité de score affiché : loyer croissant, puis nom dans l'ord · H5 : Point d'une commune-centre : son centre tel que l'a utilisé la di · H6 : Si l'aire n'a pas de commune-centre française, on prend sa commun · H7 : Une valeur d'adresse est invalide si elle n'est ni `aucun` ni un  · H8 : La carte se zoome et se déplace (molette, pincement, boutons + et · H9 : Budgets : la page réagit à un réglage en ≤ 100 ms ; l'indicateur 
Ne change pas : Première tranche.
Critères : AC-1 (R3) · AC-2 (R2) · AC-3 (R1) · AC-4 (R5) · AC-5 (R1) · AC-6 (R3) · AC-7 (R4) · AC-8 (R4) · AC-9 (R1) · AC-10 (R3) · AC-11 (R7) · AC-12 (R7) · AC-13 (R7)

