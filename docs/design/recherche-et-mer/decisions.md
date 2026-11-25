# Décisions de design — recherche et mer en minutes
2026-11-25 · Validé par Vincent : piste C, mer en minutes seulement

## Pistes
| Piste | Idée | Verdict |
|---|---|---|
| A | Champ toujours visible en tête des réglages (bureau), suggestions posées par-dessus ; loupe dans la tête de la feuille (téléphone) ; Bascule mer « km \| min » à droite du titre ; pied de page tel quel + 2 mentions | Écartée. Le pied de page passe de 127 à 142 px en bureau (objectif 5) |
| B | Champ en tête du panneau de droite, les suggestions remplacent les 10 premières ; champ toujours visible au téléphone ; Choix souligné « km à vol d'oiseau » / « min en voiture » ; mentions repliées sur une ligne | Écartée. Au téléphone, casse AC-1 d'interface-telephone : 158 px de carte à 375 × 548, métropole coupée |
| **C** | **Loupe dans la ligne du titre (bureau), champ et suggestions dans le flux, population en sous-texte ; loupe au bout des onglets (téléphone) ; Segmenté sous le titre ; mentions en bas du panneau de réglages** | **Retenue (Vincent), sans la bascule** |

Pari de Vincent : C. Relecteur à l'aveugle : A comme base, avec le pied de page de C ([review-directions.md](review-directions.md)). Écart : le relecteur classait C dernière pour « trouver une commune », parce qu'en bureau elle cache le champ derrière une loupe (Majeur, H177 et H178). **Vincent garde la loupe** ; H177 et H178 sont amendées.

## Décidé par Vincent (2026-11-25)
- **Base C.**
- **Mer en minutes seulement, partout, fiche comprise** : plus de bascule ni de km de mer à l'écran (D5 révisée). Coût : 58 critères de 7 tranches passées à recaler ([liste](../../specs/2026-11-25-recherche-et-mer/criteres-a-recaler.md)). Risque : plus de km pour se replier si la tâche 0 juge les minutes peu crédibles.
- **Anciens liens en km ignorés** (`mer=` → Peu importe), les minutes s'écrivent `mer-min=` (D9).
- **Loupe en bureau**, malgré le Majeur du relecteur.
- **Mentions obligatoires en bas du panneau de réglages en bureau** : plus rien sur la carte. Cela corrige le défaut « Moyen » de la QA de services. Les mentions restent toutes visibles, sans clic, en fin de panneau.
- **Spec amendée sur place**, ici, plutôt qu'en rouvrant /spec.

## Décidé par Claude (à contester ici ou sur pièce)
- Paramètre d'adresse `mer-min` (écarté : réutiliser `mer`, qui aurait relu les anciens liens comme des minutes, contre D9).
- La population sous chaque suggestion (« 249 712 habitants ») : venue de C. Le relecteur la juge sans gain et note qu'elle réduit d'un tiers les lignes visibles. Écarté : le nom seul.
- H184 amendée : après un choix, le champ se ferme ; rouvert par la loupe, il montre la commune choisie et « Effacer la recherche » ; « Annuler » rend le focus à la loupe ; le titre « Où vivre en France » reste lu par les lecteurs d'écran quand le champ le remplace. Ces trois points corrigent des Mineurs du relecteur.
- Les suggestions se ferment quand le champ perd le focus (Mineur du relecteur).
- Une commune sans km ni temps garde « Distance à la mer inconnue » dans la fiche. Une commune sans temps garde « Temps en voiture jusqu'à la mer inconnu : compté 2 h 40 d'après les km » : c'est le seul « km » de mer qui reste, pour dire d'où vient le chiffre.
- Jeton `taille-liste-suggestions` 280 (hauteur des suggestions avant défilement), ajouté au contrat.

## Mesures (prototype, 2026-11-25)
- 375 × 548 : curseur du prix à 537 px sur 548, carte inchangée (la loupe n'ajoute aucune hauteur).
- Bureau : plus de pied de page sur la carte ; le panneau de réglages s'allonge des mentions, en fin de défilement.

## Non jugé
- Temps réels jusqu'à la mer : ceux du prototype sont inventés (km × 1,25 + 5).
- Codes postaux réels : le prototype n'a qu'un échantillon.
- Clavier de l'iPhone sur un vrai téléphone.
- Session complète au lecteur d'écran.
- Réaction de la carte au geste (budget H90).
- La montagne reste en km à côté de la mer en minutes (« Montagne à moins de 30 km ») : à regarder à la démo.
