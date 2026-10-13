# Décision de design — proches
2026-10-13 · /ui · Prototypes : branche `prototype/proches` (`?variant=A|B|C|F`) · Captures : [directions/](directions/) · Revue à l'aveugle : [review-directions.md](review-directions.md)

## Les pistes
| Piste | Idée | Captures |
|---|---|---|
| A — Carnet | proches dans le panneau de réglages, repère rond à lettre, bascule « km \| min » | `A-*.png` |
| B — Proches en tête | pastilles cliquables en haut de la carte, réglage dans une fenêtre, repère goutte à maison | `B-*.png` |
| C — Onglet | onglet « Tes proches » à côté des 10 premières, repère carré numéroté | `C-*.png` |

Revue à l'aveugle : base A, avec le repère de B, le nom à côté du repère (C), l'adresse sous le nom (C), la phrase sur l'IGN pendant la saisie (B), et un panneau A resserré. 0 Bloquant, 7 Majeurs, 6 Mineurs. C écarté : les onglets séparent la liste et les réglages des proches, et ses numéros se confondent avec les rangs. B écarté comme base : chaque plafond se cache derrière un clic, et « Effacer mes proches » disparaît à 5 proches.

## Choix de Vincent : la fusion F (A + B)
- **Réglages dans le panneau de gauche (A)**, une ligne par proche : repère en petit, nom, adresse en petit, plafond et curseur, « Retirer ». « Effacer mes proches » est sur la ligne du titre, et le compte reste collé en bas du panneau. La phrase sur l'IGN apparaît sous le champ dès qu'on commence à taper.
- **Pastilles en haut de la carte (B), en affichage seul** : nom et plafond (« 4 h au plus ») ; avec une ville choisie, son temps (« 3 h 30 ») et « au-dessus de 4 h » s'il dépasse. Pas de pastilles à 390 px. → Spec D10, R15.
- **Repère** : goutte terre cuite à maison (B), nom dans une étiquette blanche à droite (C), au-dessus des ronds du top 10. **Calcul** : goutte pleine avec « … » et un anneau qui pulse (le contraste reste plein) ; **indisponible** : goutte blanche à bord pointillé terre cuite avec « ! ». Les deux états ne se confondent plus.
- **Catégories repliables** (retour de Vincent) : Loyer, Mer, Taille de ville et Tes proches s'ouvrent et se ferment par leur titre ; repliée, une catégorie garde son résumé (« 1 200 € », « Peu importe », « 2 »). Toutes sont ouvertes au départ. Motif « disclosure » (bouton dans le titre, `aria-expanded`).
- **Temps à l'estimation haute** (retour de Vincent) : « 3 h 30 » au lieu de « 3 h 15 à 3 h 30 ». → Spec D11.
- **Bascule de la mer** : « km | min » sur la ligne du titre « Mer » (A).

## Pourquoi
La grille : on règle un proche sans perdre la liste de vue (objectif 3) ; on lit la carte depuis ses proches, avec les temps d'une ville en haut de la carte (objectifs 2 et 4) ; on voit où part l'adresse au moment où on la tape (objectif 5). Les catégories repliables répondent au principal défaut de A : le panneau trop long avec 5 proches.

## Reste à vérifier au build
- Avec 5 proches, les pastilles passent sur deux lignes à 1 440 px et couvrent le haut de la carte (la Manche, le Nord).
- Texte sous une ville choisie seule : « Toulouse · départ de la mairie » (le prototype affiche « Toulouse, Commune · Haute-Garonne »).
- Les temps du prototype sont simulés ; les vrais viennent de la tâche 0.
