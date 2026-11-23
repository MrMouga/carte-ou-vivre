# Brief — services
2026-11-23 · Spec : [docs/specs/2026-11-23-services/](../../specs/2026-11-23-services/spec.md) · Temps convenu : 1 h, prototypes en code, sans Figma, sans références (choix de Vincent, comme emploi)

## Grille de jugement
1. **Six réglages sans mur de boutons** : à 390 px, on lit d'un coup d'œil les 6 services et le temps choisi pour chacun ; la catégorie reste la plus courte possible (hauteur mesurée pour chaque piste, ouverte, rien de coché et trois services cochés).
2. **Le même geste que la mer** : un temps coché ou aucun, la case cochée se décoche (D12 de cadre-de-vie, R51) ; on comprend que rien coché = peu importe ; cibles de 44 px au toucher, tout au clavier.
3. **La gare se comprend sans mode d'emploi** : on voit que « Une gare » / « Une grande gare » va avec les temps de la gare, que changer de niveau garde le temps, et qu'un niveau sans temps ne filtre pas (D5, AC-10).
4. **La fiche se lit en cinq secondes** : on compare les 7 temps d'un coup d'œil, chiffres alignés ; « plus d'une heure », « pas de chiffre », « aucune sur l'île » et « aucune en Corse » ne cassent pas la colonne ; le bloc vient après « Tes proches » (R54).
5. **Honnête et court** : la phrase des limites est lisible sans dominer le bloc (D10) ; aucune note, jauge ou couleur ne suggère qu'une commune est « bien équipée » (D4) ; à 375 × 548, le curseur du prix reste visible à l'ouverture (H48).

## Ressenti
Le reste du panneau : sobre, encre et papier. Une fiche pratique, comme une note qu'on prend avant d'aller visiter une ville.

## Références
Aucune (choix de Vincent) : les composants du [système](../system/README.md) suffisent — Catégorie repliable, Cases collées (mer, montagne, niveaux d'un métier), Choix souligné, Segmenté d'unité, Rangée qui défile.

## Système visuel
Celui du projet ([contrat](../system/README.md)). Pas de nouveau jeton sauf besoin démontré par une piste (alors dit). Temps cochés en `primary` ; textes `texte`, `texte-fort`, `pastille`, `secondaire`, chiffres tabulaires. Aucune couleur de donnée dans les réglages ni dans le bloc de la fiche.

## Échelles de données
Sans objet : le filtre ne colore rien de nouveau (D4) ; la carte garde ses paliers et la couleur neutre.

## Contenu réaliste commun
Temps mesurés le 2026-11-23 ([mesures](../../specs/2026-11-23-services/mesures.md)), dans l'ordre médecin, commerce, école, collège, crèche, gare, grande gare :
- **Auch (32)** : 2, 2, 2, 3, 3, 4, 4 min.
- **Mende (48)** : 2, 2, 2, 2, 3, 3 min, grande gare « plus d'une heure ».
- **Saint-Véran (05)** : 17, 1, 2, 33, 5, 40, 40 min.
- **L'Île-d'Yeu (85)** : médecin « pas de chiffre », 3, 3, 3, 3 min, gare et grande gare « aucune sur l'île », phrase de la traversée.
- **Ajaccio (2A)** : 1, 1, 1, 2, 2, 3 min, grande gare « aucune en Corse ».

Réglage d'exemple : Médecin 10 min, Commerce alimentaire 5 min, Une grande gare 30 min.

## Écrans
Panneau de réglages, catégorie « Services », dernière catégorie, après « Tes proches » (H151), ouverte au départ :
1. Titre « SERVICES » ; résumé replié « Peu importe », « 1 choix », « 2 choix »… (H154).
2. Dans l'ordre : « Médecin », « Commerce alimentaire », « École », « Collège », « Crèche » avec « 5 min », « 10 min », « 15 min ».
3. « Gare » avec « 10 min », « 20 min », « 30 min », et le choix « Une gare » / « Une grande gare » (groupe « Type de gare »).

Fiche (R54), sous le chômage et sous « Tes proches » quand il existe :
1. Titre « Services en voiture ».
2. 7 lignes : « Médecin », « Commerce alimentaire », « École », « Collège », « Crèche », « Gare », « Grande gare », chacune avec sa valeur. Le texte lu reste « <Service> : <valeur> ».
3. « Temps en voiture, sans embouteillages, que la moitié des habitants ne dépasse pas. Médecins généralistes libéraux seulement, sans savoir s'ils prennent de nouveaux patients. Crèches financées par la CAF. »
4. Pour une île sans pont avec au moins un temps : « Île sans pont : un temps peut compter la traversée, sans l'attente du bateau. »

## Pas voulu
Note, jauge, barre ou étoiles de « bien équipée » ; couleur de donnée sur les temps ; icônes médicales, croix rouge, logos SNCF ou d'enseignes ; emoji ; mots « désert médical » ou « proche de tout » ; badge « nouveau » ; liste déroulante pour choisir un temps ; mise en avant de la catégorie.
