# Décisions de design — emploi
2026-11-21 · Validé par Vincent (piste F)

## Pistes
| Piste | Idée | Verdict |
|---|---|---|
| A | « Comme un proche » : libellé en gras, niveaux en Cases collées 3 colonnes, « Retirer » en lien dessous, phrase sur l'État sous le champ | **Base retenue** : seule piste qui garde le geste de la mer (contrat « Cases collées », choix unique ou aucun) ; 447 px à 390 px avec deux métiers |
| B | Étiquette avec ×, niveaux en pastilles à coche, phrase sur l'État en note | Écartée : pastilles à coche = choix multiple dans le système ; « 10 % » passe de 52 à 70 px une fois coché ; « Retirer » réduit à une croix (H130) ; intertitre « Emploi » dans la fiche absent de R47 |
| C | Cadre « Métier 1 / 2 », niveaux en lignes à rond, phrase sur l'État en tête | Écartée : les ronds disent « on ne peut pas décocher » ; composant absent du système ; 674 px avec deux métiers ; phrase au-dessus du champ (R44 : « Sous le champ ») |
| **F** | **A, plus « Retirer » sur la ligne du libellé et le libellé en gras dans la fiche (de C)** | **Retenue** |

Pari de Vincent : A ; relecteur à l'aveugle : A ([review-directions.md](review-directions.md)).

## F — ce qui est décidé
- Métier choisi : libellé `texte-fort`, entier, qui passe à la ligne (130 caractères tiennent sur 3 lignes à 390 px) ; **« Retirer »** (Button lien) sur la même ligne de base, à droite ; nom accessible « Retirer <libellé> ».
- Niveaux : **Cases collées en 3 colonnes** sous « Où ce métier recrute le plus », comme la mer (D12 de cadre-de-vie : la cochée se décoche) ; groupe nommé par le titre **et le libellé** (deux groupes au même nom sinon ; H131 révisée).
- **Tant qu'aucun niveau n'est coché**, sous les cases : « Coche un niveau pour garder les communes proches de ces bassins. » (`secondaire`, reliée au groupe par `aria-describedby`) ; elle disparaît dès qu'un niveau est coché. *Choix de Vincent* après la relecture (un métier sans niveau ne filtre pas, D5 ; rien ne le disait) ; texte *décidé par Claude*, contestable. Spec amendée : H130, état **un métier**.
- **Focus sur « 10 % »** dès qu'un métier est choisi (le champ disparaît : sans cela, le focus repartait en haut de la page, WCAG 2.4.3 ; constat commun de la relecture). Révisé dans l'état **un métier**.
- **Métier peu chiffré** (D14, R50, ajouté à /breakdown le 2026-11-21) : « Chiffré dans peu de bassins : la carte en oublie sûrement. » en `secondaire`, sous la ligne du libellé et de « Retirer », au-dessus de « Où ce métier recrute le plus », toujours affichée pour ce métier ; décrit le groupe des niveaux. *Place décidée par Claude*, pas prototypée (même style que la phrase « Coche un niveau… »).
- Deux métiers séparés par un filet `border` ; « + Ajouter un second métier » en lien sous le premier ; phrase sur l'État (D13) toujours en bas de la catégorie, sous le champ quand il n'y a pas de métier.
- Suggestions : la liste de la Suggestion d'adresse des proches, une ligne par libellé qui passe à la ligne.
- Fiche : lignes de R47 en `texte` sous « Mairie », **libellé du métier en `texte-fort`** dans la ligne (le texte lu reste celui de R47) ; espaces insécables avant « recrutements », « % » et dans « 2e trimestre ».
- Mesures à 390 px : un métier coché 269 px ; deux métiers (l'un sans niveau) 396 px ; sans métier 159 px. « Emploi » est sous « Vie locale » : rien ne change à 375 × 548 à l'ouverture (H48).

## Non jugé
Carte filtrée (le prototype ne filtre pas) ; montée de la feuille au-dessus du clavier de l'iPhone (AC-13, au build) ; 375 px de large ; liste de 8 suggestions ; résumé replié (texte de la spec).
