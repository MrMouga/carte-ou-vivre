# Brief — services
2026-11-23 · révisé après D13 à D15 · Spec : [docs/specs/2026-11-23-services/](../../specs/2026-11-23-services/spec.md) · Temps convenu : 1 h, prototypes en code, sans Figma, sans références (choix de Vincent, comme emploi)

## Grille de jugement
1. **Quatre lignes sans mur de boutons** : à 390 px, on lit d'un coup d'œil Médecin, Commerce alimentaire, Scolarité et Gare, et le temps choisi pour chacune ; la catégorie reste la plus courte possible (hauteur mesurée pour chaque piste, rien de coché et réglage d'exemple).
2. **Le même geste que la mer** : un temps coché ou aucun, la case cochée se décoche (D12 de cadre-de-vie, R51) ; on comprend que rien coché = peu importe ; cibles de 44 px au toucher, tout au clavier.
3. **Scolarité et Gare se comprennent sans mode d'emploi** : on voit que plusieurs niveaux de scolarité se cumulent avec un seul temps, et qu'il faut un niveau et un temps pour filtrer (D13, AC-14) ; on voit que Gare, Régionale et Nationale vont avec les temps de la gare, et que changer de niveau garde le temps (D15, AC-10).
4. **La fiche se lit en cinq secondes** : on compare les 9 temps d'un coup d'œil, chiffres alignés ; « plus d'une heure », « pas de chiffre », « aucune sur l'île » et « aucune en Corse » ne cassent pas la colonne ; le bloc vient après « Tes proches » (R54).
5. **Honnête et court** : la phrase des limites est lisible sans dominer le bloc (D10) ; rien ne laisse croire qu'une gare nationale veut dire TGV (D15) ; aucune note, jauge ou couleur ne suggère qu'une commune est « bien équipée » (D4) ; à 375 × 548, le curseur du prix reste visible à l'ouverture (H48).

## Ressenti
Le reste du panneau : sobre, encre et papier. Une fiche pratique, comme une note qu'on prend avant d'aller visiter une ville.

## Références
Aucune (choix de Vincent) : les composants du [système](../system/README.md) suffisent — Catégorie repliable, Cases collées (mer, montagne, niveaux d'un métier), Cases séparées (taille, mairie), Choix souligné, Segmenté d'unité.

## Système visuel
Celui du projet ([contrat](../system/README.md)). Pas de nouveau jeton sauf besoin démontré par une piste (alors dit). Temps et niveaux cochés en `primary` ; textes `texte`, `texte-fort`, `pastille`, `secondaire`, chiffres tabulaires. Aucune couleur de donnée dans les réglages ni dans le bloc de la fiche.

## Échelles de données
Sans objet : le filtre ne colore rien de nouveau (D4) ; la carte garde ses paliers et la couleur neutre.

## Contenu réaliste commun
Temps mesurés le 2026-11-23 ([mesures](../../specs/2026-11-23-services/mesures.md)), dans l'ordre médecin, commerce, crèche, école, collège, lycée, gare, régionale, nationale :
- **Auch (32)** : 2, 2, 3, 2, 3, 3, 4, 4 min, nationale « plus d'une heure ».
- **Mende (48)** : 2, 2, 3, 2, 2, 2, 3 min, régionale et nationale « plus d'une heure ».
- **Saint-Véran (05)** : 17, 1, 5, 2, 33, 55, 40, 40 min, nationale « plus d'une heure ».
- **L'Île-d'Yeu (85)** : médecin « pas de chiffre », 3, 3, 3, 3 min, lycée « pas de chiffre », les trois gares « aucune sur l'île », phrase de la traversée.
- **Ajaccio (2A)** : 1, 1, 2, 1, 2, 2, 3 min, régionale et nationale « aucune en Corse ».

Réglage d'exemple : Médecin 10 min, Commerce alimentaire 5 min, Scolarité École + Collège 10 min, Gare Régionale 30 min.

## Écrans
Panneau de réglages, catégorie « Services », dernière catégorie, après « Tes proches » (H151), ouverte au départ :
1. Titre « SERVICES » ; résumé replié « Peu importe », « 1 choix », « 2 choix »… (H154).
2. « Médecin » et « Commerce alimentaire » avec « 5 min », « 10 min », « 15 min ».
3. « Scolarité » avec les niveaux cumulables « Crèche », « École », « Collège », « Lycée » et « 5 min », « 10 min », « 20 min » ; état incomplet : « Coche au moins un niveau et un temps. »
4. « Gare » avec « 10 min », « 20 min », « 30 min », et le choix « Gare » / « Régionale » / « Nationale » (groupe « Type de gare »).

Fiche (R54), sous le chômage et sous « Tes proches » quand il existe :
1. Titre « Services en voiture ».
2. 9 lignes : « Médecin », « Commerce alimentaire », « Crèche », « École », « Collège », « Lycée », « Gare », « Gare régionale », « Gare nationale », chacune avec sa valeur. Le texte lu reste « <Service> : <valeur> ».
3. « Temps en voiture, sans embouteillages, que la moitié des habitants ne dépasse pas ; les trajets en bus ou à pied ne sont pas comptés. Médecins généralistes libéraux seulement, sans savoir s'ils prennent de nouveaux patients. Crèches financées par la CAF. Gare régionale : 100 000 voyageurs par an ou plus ; nationale : 250 000 ou plus, avec des lignes nationales. Ces niveaux ne disent pas s'il y a un TGV. »
4. Pour une île sans pont avec au moins un temps : « Île sans pont : un temps peut compter la traversée, sans l'attente du bateau. »

## Pas voulu
Note, jauge, barre ou étoiles de « bien équipée » ; couleur de donnée sur les temps ; icônes médicales, croix rouge, logos SNCF ou d'enseignes, pictogramme de TGV ; emoji ; mots « désert médical » ou « proche de tout » ; badge « nouveau » ; liste déroulante pour choisir un temps ; mise en avant de la catégorie.
