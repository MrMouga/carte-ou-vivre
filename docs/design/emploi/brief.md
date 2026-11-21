# Brief — emploi
2026-11-21 · Spec : [docs/specs/2026-11-21-emploi/](../../specs/2026-11-21-emploi/spec.md) · Temps convenu : 1 h, prototypes en code, sans Figma, sans références (choix de Vincent, comme mairies)

## Grille de jugement
1. **Le métier se trouve sans connaître la nomenclature** : on tape « infirm » ou « développeur », on voit la bonne suggestion tout de suite, au clavier comme au toucher (R44, H133, AC-2) ; le champ reste visible au-dessus du clavier de l'iPhone (R20, AC-13).
2. **Un libellé de 130 caractères ne casse rien** : « Graphistes, dessinateurs, stylistes, décorateurs et créateurs de supports de communication visuelle » se lit en entier, et le métier choisi, ses 3 niveaux et « Retirer » restent lisibles comme un tout, en bureau (340 px) et à 390 px.
3. **Le même geste que la mer** : 3 niveaux, un seul coché ou aucun, la case cochée se décoche (D12 de cadre-de-vie, H131) ; on comprend que rien coché = pas de filtre (D5, AC-1) ; cibles de 44 px au toucher.
4. **Deux métiers sans confusion** : on voit quel niveau va avec quel métier ; ajouter, retirer, le second qui devient le premier (D1, AC-3).
5. **Honnête et court** : la phrase sur l'État est toujours visible sans prendre toute la place (D13) ; jamais « offres » ni « tu trouveras » (D6) ; « Emploi » ne repousse pas « Tes proches » trop loin ; à 375 × 548, le curseur du prix reste visible à l'ouverture (H48).

## Ressenti
Le reste du panneau : sobre, encre et papier. L'emploi est un critère parmi d'autres, sérieux, sans promesse.

## Références
Aucune (choix de Vincent) : les composants du [système](../system/README.md) suffisent — champ et Suggestion d'adresse (proches), Cases collées (mer, montagne), Cases séparées, Rangée qui défile, Ligne de proche, Catégorie repliable.

## Système visuel
Celui du projet ([contrat](../system/README.md)). Pas de nouveau jeton sauf besoin démontré par une piste (alors dit). Champs : `card`, `border`, `radius` ; suggestions : liste `card` + `ombre-panneau` ; niveaux cochés en `primary` ; textes `texte`, `texte-fort`, `pastille`, `secondaire`. Aucune couleur de donnée dans les réglages.

## Échelles de données
Sans objet : le filtre ne colore rien de nouveau (D5) ; la carte garde ses paliers et la couleur neutre.

## Contenu réaliste commun
- Métiers : « Infirmiers et sages-femmes » (V1X80) ; « Ingénieurs et cadres d'étude, recherche et développement en informatique et télécom » (M2X90, trouvé par « développeur ») ; « Graphistes, dessinateurs, stylistes, décorateurs et créateurs de supports de communication visuelle » (U1X82, le plus long) ; « Médecins » (V2X90).
- Fiche de Bordeaux (33), infirmiers à « 10 % » : « Infirmiers et sages-femmes : Bordeaux, sur place, parmi les 10 % de bassins qui recrutent le plus · 626 recrutements prévus en 2026 » ; ingénieurs sans niveau : « Ingénieurs et cadres d'étude, recherche et développement en informatique et télécom : bassin de Bordeaux, 742 recrutements prévus en 2026 » ; « Chômage : 6,9 % dans la zone d'emploi de Bordeaux (2e trimestre 2026) » (taux inventé pour le prototype, à lire en tâche 0).
- Fiche de La Rochelle (17), qui ne passe pas : raison « Infirmiers et sages-femmes : aucun bassin parmi les 10 % qui recrutent le plus dans un rayon de 30 km (le plus proche : La Roche-sur-Yon, 61 km) ».

## Écrans
Panneau de réglages, catégorie « Emploi », entre « Vie locale » et « Tes proches » (H129), ouverte au départ :
1. Titre « EMPLOI » ; résumé replié « Peu importe » / « 1 métier » / « 2 métiers » (H132).
2. **Sans métier** : champ « Ton métier » ; la phrase « Les emplois de l'État (enseignants du public, fonctionnaires) ne sont pas dans l'enquête. » (D13, toujours visible quand la catégorie est ouverte).
3. **Suggestions** (dès 2 caractères) : jusqu'à 8 libellés ; sinon « Aucun métier trouvé ».
4. **Un métier** : le libellé ; titre « Où ce métier recrute le plus » (nom du groupe) ; pastilles « 10 % », « 25 % », « Partout où il recrute », aucune cochée ; « Retirer » ; lien « + Ajouter un second métier ».
5. **Ajout en cours** : champ « Second métier » sous le premier métier.
6. **Deux métiers** : chacun avec ses pastilles et « Retirer » ; plus de lien d'ajout.

Fiche (R47), sous la ligne « Mairie » : une ligne par métier, puis le chômage. Textes fixés par la spec ; seule leur mise en page est à dessiner (libellé de 130 caractères, deux métiers).

## Pas voulu
Logos ou couleurs de France Travail, icônes de mallette ou de cravate, jauge ou barre de « facilité », mot « offres », badge « nouveau », mise en avant de la catégorie, couleur de donnée sur les niveaux, liste déroulante des 217 métiers.
