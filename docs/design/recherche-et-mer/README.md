2026-11-25 · validé
# Design — recherche et mer en minutes

Spec : [docs/specs/2026-11-25-recherche-et-mer/](../../specs/2026-11-25-recherche-et-mer/spec.md) (amendée en /ui : D5 révisée, D9) · Temps convenu : 1 h de Vincent, 1 session · Support : prototypes en code, sans Figma, sans références, sans croquis (choix de Vincent) · Étend le [système](../system/README.md).

Brief et grille : [brief.md](brief.md) · Choix : [decisions.md](decisions.md) · Relecture à l'aveugle : [review-directions.md](review-directions.md) · Captures : [directions/](directions/) (A, B, C, et **F = C retenue en minutes seules**).

**Pas de Figma pour cette tranche** : la référence est le prototype de la branche `prototype/recherche-et-mer`, `src/proto/Recherche.tsx`, `?variant=C` (`&codes=lent` ou `&codes=erreur` pour les états des codes postaux), et ses captures `F-*`. /build le reprend comme référence, pas comme code à garder : temps inventés, échantillon de codes postaux, adresse non branchée. **Le prototype fait foi jusqu'à ce que l'écran soit construit ; ensuite, c'est le code.**

## Écrans et états
| Écran ou état (details.md) | Où |
|---|---|
| Bureau, départ : loupe à droite du titre, mer en minutes, plus de pied sur la carte | [F-bureau-depart.png](directions/F-bureau-depart.png) |
| Recherche **vide** (loupe touchée) | [F-bureau-champ-vide.png](directions/F-bureau-champ-vide.png) · [F-390-champ-vide.png](directions/F-390-champ-vide.png) |
| **Suggestions** par nom | [F-bureau-nom.png](directions/F-bureau-nom.png) · [F-390-nom.png](directions/F-390-nom.png) |
| Suggestions par code complet (liste qui défile) | [F-bureau-code-complet.png](directions/F-bureau-code-complet.png) |
| **Choisie** : fiche ouverte, carte cadrée, champ « Bordeaux (33) » | [F-bureau-choisie.png](directions/F-bureau-choisie.png) · [F-390-fiche-choisie.png](directions/F-390-fiche-choisie.png) |
| Champ rouvert après un choix (H184 amendée) | [F-390-rouvert-choisie.png](directions/F-390-rouvert-choisie.png) |
| Mer « 30 min » cochée, liste en minutes | [F-bureau-mer-30min.png](directions/F-bureau-mer-30min.png) · [F-390-mer-30min.png](directions/F-390-mer-30min.png) · [F-390-liste-minutes.png](directions/F-390-liste-minutes.png) |
| Fiche d'une commune **sans temps** (Auch, dans le prototype) | [F-bureau-fiche-auch-sans-temps.png](directions/F-bureau-fiche-auch-sans-temps.png) |
| Mentions en bas du panneau de réglages | [F-bureau-mentions-panneau.png](directions/F-bureau-mentions-panneau.png) |
| 375 × 548 au départ (H48, AC-1 d'interface-telephone) | [F-375x548-depart.png](directions/F-375x548-depart.png) |

États sans mise en page propre :
| État | Déclencheur | Texte exact | Où il s'affiche |
|---|---|---|---|
| Trop court | 1 caractère | aucun | — |
| Aucune | aucune commune ne correspond | « Aucune commune ne correspond. » | à la place des suggestions |
| Chargement des codes | chiffres tapés avant l'arrivée des codes (H187) | « Chargement des codes postaux… » | à la place des suggestions ([capture](directions/F-bureau-codes-chargement.png)) |
| Codes indisponibles | seconde erreur ou 10 s (H187) | « Codes postaux indisponibles. Cherche par nom ou réessaie dans un moment. » | à la place des suggestions ([capture](directions/F-bureau-codes-indisponibles.png)) |
| Nombre de suggestions | à chaque mise à jour | « 2 suggestions » | lu par les lecteurs d'écran seulement |
| Page en chargement ou en erreur | H188 | loupe et champ inactifs | — |
| Mer inconnue | ni km ni temps | « Distance à la mer inconnue » | fiche, liste |

## Pour /breakdown
- **Recaler 58 critères de 7 tranches** qui lisent la mer en km ([liste](../../specs/2026-11-25-recherche-et-mer/criteres-a-recaler.md), faite par script, à vérifier un à un), chaque réécriture avec l'accord de Vincent ; et D19 de proches (AC-15 remplacé par AC-6 et AC-10).
- Composants nouveaux au contrat : Loupe, Champ de recherche, Suggestion de commune ; Bascule mer retirée ; jeton `taille-liste-suggestions`.
- Les tests qui prennent un champ par son rôle (combobox) doivent le nommer : trois champs existent (métier, proche, commune).
