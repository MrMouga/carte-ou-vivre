2026-11-24 · validé
Révisé le 2026-11-26 (révision D19, D20 de la spec, réglé en /breakdown) : « Urgences » (15 / 30 / 45 min) est une ligne comme « Médecin » (libellé à gauche, Cases collées à droite), juste après lui ; « Supermarché » prend la place et la forme de « Commerce alimentaire » ; la fiche passe à 11 lignes, même mise en forme. Aucune nouvelle piste, aucun composant nouveau.
# Design — services

Spec : [docs/specs/2026-11-23-services/](../../specs/2026-11-23-services/spec.md) · Temps convenu : 1 h, 1 session (dépassé : deux sessions, à cause des révisions D13 à D18 de la spec) · Support : prototypes en code, sans Figma, sans références (choix de Vincent) · Étend le [système](../system/README.md) et les tranches construites (le code fait foi).

Brief et grille : [brief.md](brief.md) · Choix : [decisions.md](decisions.md) · Relecture à l'aveugle : [review-directions.md](review-directions.md) · Captures : [directions/](directions/) (A, B, C, et **F retenue**).

**Pas de Figma pour cette tranche** : la référence est le prototype F, branche `prototype/services`, `src/proto/Services.tsx` (`?variant=F`, `&exemple=1` pour le réglage d'exemple, `&commune=<code>` pour une fiche), et ses captures. /build le reprend comme référence, pas comme code à garder (rien ne filtre ; l'adresse n'est pas branchée ; temps lus dans un fichier de prototype). **Le prototype fait foi jusqu'à ce que l'écran soit construit ; ensuite, c'est le code.**

## Écrans et états
| Écran ou état (details.md) | Où |
|---|---|
| Catégorie, rien de coché, 390 px (« Toutes » souligné, aucun temps coché) | [F-cat-depart-390.png](directions/F-cat-depart-390.png) |
| Catégorie, un choix ou plus (réglage d'exemple) | [F-cat-exemple-390.png](directions/F-cat-exemple-390.png) ; bureau : [F-bureau-1440x900.png](directions/F-bureau-1440x900.png) |
| Feuille ouverte à 390 × 844 | [F-feuille-390x844.png](directions/F-feuille-390x844.png) |
| Fiche, cas courant (Auch, Gare grandes lignes « plus d'une heure ») | [F-fiche-auch-390.png](directions/F-fiche-auch-390.png) |
| Fiche, valeurs au-delà de 60 min (Mende) | [F-fiche-mende-390.png](directions/F-fiche-mende-390.png) |
| Fiche, île sans pont, « pas de chiffre » et « aucune sur l'île », phrase de la traversée (L'Île-d'Yeu) | [F-fiche-yeu-390.png](directions/F-fiche-yeu-390.png) |
| Fiche, Corse, « aucune en Corse » (Ajaccio) | [F-fiche-ajaccio-390.png](directions/F-fiche-ajaccio-390.png) |

États sans mise en page propre :
| État | Déclencheur | Texte exact | Où il s'affiche |
|---|---|---|---|
| Scolarité incomplète | un niveau sans temps, ou un temps sans niveau | « Coche au moins un niveau et un temps. » (H153) | sous le temps de la scolarité |
| Repliée | catégorie repliée | « Peu importe », « 1 choix », « 2 choix »… (H154) | sous le titre « Services » |
| Chargement des temps | fichier des temps pas encore là (R57) | temps, niveaux et types inactifs ; fiche : « Chargement des temps… » | catégorie, bloc de la fiche |
| Temps indisponibles | échec ou 15 s sans réponse (R57) | « Temps des services indisponibles. » et « Réessayer » | catégorie, bloc de la fiche |
| Fiche, ne passe pas | commune écartée par un service | raisons de R53, dans l'ordre de H160 | raisons de la fiche |
| Aucune commune | filtre trop serré | textes inchangés (H119 de mairies) | liste, compte |

## Pour /breakdown
- Aucun composant nouveau au contrat : Cases collées (temps), Cases séparées (niveaux de scolarité), Choix souligné (type de gare, à trois valeurs, nouveau pour ce composant) ; spec amendée (H169, AC-1).
- Le bloc de la fiche suit « Tes proches » : non vu dans le prototype, qui n'a aucun proche.
- Non fait : relecture indépendante de F elle-même (seulement A, B, C à l'aveugle) ; les relectures design et navigateur de /build la couvrent.
