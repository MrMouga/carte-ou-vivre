# Relecture du plan — immobilier
2026-10-14 · relecteur neuf, sans l'entretien · plan relu : [plan.md](plan.md) · contre la spec, le design F, le contrat du système, INDEX.md et le code (`src/`, `tests/e2e/`, `scripts/data/`).
Non vérifié : le contenu de la branche `prototype/immobilier` (commit `40dcf8d`), faute de pouvoir lancer `git show`.

## Critères sans tâche ou dans deux tâches
Chaque AC a bien une tâche (2 : AC-1, 2, 4, 5, 6, 11, 12 ; 3 : AC-3, 7, 10 ; 4 : AC-8, 9, 13). Deux problèmes :
- **AC-10 est dans la tâche 3, mais il ne peut pas y passer.** Son *then* dit « F a la couleur neutre » (Rhinval, Maison · Acheter, mer « Sans limite » : aucune note → R25). La couleur neutre d'une commune « sans note » n'arrive qu'en tâche 4. — Proposition : passer AC-10 en tâche 4, ou laisser AC-10 en tâche 3 et y peindre la couleur neutre.
- **AC-1 à AC-13 risquent d'être comptés dans deux tâches.** La tâche 1 recalcule « les valeurs et scores de AC-1 à AC-13 » en tests unitaires, et la règle commune impose « des noms qui contiennent l'id de l'AC ». Un AC pourrait donc être marqué comme passant en tâche 1, avant que l'écran existe. — Proposition : nommer les tests unitaires de la tâche 1 par leur règle (R22, R23, R25, R26), sans id d'AC ; seuls les tests Playwright des tâches 2 à 4 portent `AC-n`.

## Tâches sans preuve attendue
- **Tâche 2 : l'état « surface en cours de saisie » n'a ni test ni capture.** Il est décrit dans details.md : champ vide ou hors de 10 à 300 → la carte garde la dernière surface valide, et la sortie du champ la remet. Aucun AC ne le couvre. — Proposition : un test hors AC (vider le champ → adresse et liste inchangées ; sortie du champ → « 52 ») et une capture.
- **Tâche 4 : deux textes du mode Acheter ne sont jamais vérifiés.** Il s'agit du message **sans plafond** en Acheter (« Fixe un prix d'achat ou une distance à la mer pour classer les communes. ») et du message **aucune commune** avec un proche (« … la taille ou un proche. »). Seul **aucune commune** sans proche est testé. — Proposition : les ajouter aux tests hors AC de la tâche 4.
- **Tâches 2 et 3 : trois noms de H65 sur quatre ne sont pas testés.** Seul « Loyer mensuel, loyer maximum » l'est. Manquent « Prix d'achat, prix maximum », « … au m² », le champ « Surface en m² » et le groupe « Type de logement ». — Proposition : un test hors AC par nom, dans la tâche qui pose le composant.
- **Tâche 0, D9 : la non-indexation n'est vérifiée qu'en ligne, à /ship.** Or pousser sur `main`, c'est mettre en ligne : `achat.json` est public avant la vérification. Le plan le reconnaît mais ne laisse aucune preuve avant la mise en ligne. — Proposition : en tâche 0, une preuve locale que `dist/_headers` contient la règle après `npm run build`. À Vincent de dire si le risque d'une courte exposition lui va (sinon : vérifier sur un déploiement de prévisualisation).

## Décisions cachées
- **(Bloquant) Trois AC protégés d'interface-telephone vont casser, et le plan affirme le contraire.** Dans `tests/e2e/telephone-feuille.spec.ts`, les lignes 39 et 200 cherchent le texte **visible** exact `getByText('Loyer maximum', { exact: true })`. Ces lignes servent à AC-9 (l. 29-52, `toBeInViewport`), AC-2 (l. 259, 264) et AC-5 (l. 332). Les *then* d'AC-2 et AC-9 disent eux-mêmes « « Loyer maximum » visible ». Avec D10, le libellé visible devient « Loyer mensuel » : ces trois tests échouent.
  - La ligne « les autres lisent des noms gardés (H65) » des Risques est fausse : H65 ne garde que le nom lu par `getByRole`.
  - Laissé seul, un constructeur choisira entre deux mauvaises voies : un texte caché « Loyer maximum » qui vide le test de son sens, ou une modification d'un test protégé, interdite.
  - Proposition : à trancher par Vincent avant la tâche 2 (« Demandera »). Soit une révision de la spec interface-telephone (AC-2 et AC-9 avec « Loyer mensuel », mêmes valeurs, comme D9 l'a fait pour AC-10), soit un retour sur D10.
- **Opacité de la couleur neutre quand d'autres communes sont colorées.** La carte applique une seule opacité à toutes les communes (`opaciteCommunes(sansPlafond)`, `src/map/style.ts` l. 38-40). L'outil des tests (`attendreCouleurs`, `tests/e2e/lib/carte.ts` l. 112) attend `area-unranked` à `opacite-sans-plafond`. Dans AC-9, AC-10 et AC-13, des communes neutres côtoient des communes colorées : il faut une opacité par commune (par exemple par l'état de chaque forme, comme la couleur), sinon les tests attendent une teinte que la carte ne peint pas. Ce choix change ce que l'utilisateur voit, et le plan ne le tranche pas.
  - Proposition : écrire « commune sans note : `area-unranked` à `opacite-sans-plafond`, comme la légende ».
  - Ajouter aussi `src/App.tsx` aux fichiers de la tâche 4 : les couleurs y sont choisies (l. 181-188), pas dans `style.ts`.
- **Le plan et `acceptance.json` ne disent pas la même chose de la fixture des anciens tests.**
  - Le plan : les 5 communes de loyer-mer sont servies « sans loyer de maison ni prix d'achat » (inconnus).
  - La description de la fixture d'immobilier : les tests de loyer-mer, proches et interface-telephone gardent A à E « nouveaux champs compris ».
  - Effet faible (ces tests restent dans le réglage de départ), mais un constructeur doit choisir. — Proposition : suivre `acceptance.json` (servir A à E avec leurs champs d'immobilier), et « inconnu » seulement pour le jeu « métropole ».
- **`categories.spec.ts` : les trois tests cassent, pas un seul, et le plan se contredit sur la tâche.** Les trois tests cherchent le titre « Loyer » (l. 11, 34-35, 50), pas seulement « Loyer1 200 € ». Et les Risques disent « la tâche 1 adapte `categories.spec.ts` » alors que la tâche 2 le fait. — Proposition : dans « Demandera », annoncer les trois tests à Vincent, dans la tâche 2.
- **`achat.json` est joint aux communes par sa place dans le fichier, sans code ni contrôle.** `App.tsx` lit `communes.json` par position (l. 27, 50). Si un fichier en cache est plus vieux que l'autre, une commune afficherait silencieusement le prix d'une autre. Autre point : le test hors AC `proches-etats.spec.ts` l. 266-268 sert un `communes.json` à 7 colonnes, écrit dans le test. — Proposition :
  - au chargement, contrôler que les deux fichiers ont le même nombre de lignes, ou ajouter une colonne de code ; sinon, état **erreur** (H68) ;
  - écrire que des colonnes de loyer de maison absentes valent « inconnu ».
- **Le résumé de « Logement » n'est écrit que pour l'état de départ.** Le plan ne donne pas les autres résumés : Acheter · Au m², Maison, « Sans limite ». — Proposition : écrire la règle de decisions.md (surface seulement en Total) et deux exemples, par exemple « Acheter · Appartement · 5 000 €/m² » et « Louer · Maison · 72 m² · Sans limite ».
- **Loyer des maisons à Paris, Lyon et Marseille : la règle de calcul n'est pas écrite.** La tâche 0 ne dit pas si c'est la moyenne des arrondissements, comme pour les appartements (D10 de loyer-mer, `communes.py` l. 4-5), ni comment se calcule `estimation_propre_maison` pour ces trois villes. — Proposition : une ligne dans la tâche 0.

## Le risque de la spec
- **Le risque de « fausse précision » n'est pas mesuré en tâche 0 : il attend la démo, après les 6 tâches.** La couverture, elle, l'est (condition d'arrêt à 5 % et 1 %). Si Vincent juge 2 prix sur 5 faux, D5 change après la construction de toute l'interface. Le test est peu coûteux à avancer : les prix existent dès la tâche 0. — Proposition : en tâche 0, `mesure-tache-0.md` donne le prix, la source (commune ou secteur) et le nombre de ventes de 5 communes choisies par Vincent. La tâche s'arrête pour son avis ; la démo garde la vérification sur la carte.

## Périmètre
- **La tâche 2 touche 13 fichiers** (8 de code, 5 de tests et fixtures), au-delà de 8. — Proposition : la scinder. 2a : fixture « 6 communes », tuiles (`tuiles.py --fixture`), `tests/e2e/lib/carte.ts` qui sert `achat.json`. 2b : le réglage du prix à l'écran.
- **Des listes de fichiers sont incomplètes.**
  - Tâche 4 : sans `src/App.tsx`, où se font la couleur neutre et la bande « Aucune commune… ».
  - Tâche 3 : sa sortie touche « la liste », mais `src/ui/List.tsx` n'est pas listé.
  - Un agent neuf qui ne voit que sa section s'y arrêtera.

## Ordre
- **Le test hors AC de H48 casse dès la tâche 2, et ne revient au vert qu'en tâche 5.** Ce test (`telephone-feuille.spec.ts` l. 161-171, curseur entièrement visible à 375 × 548) fait partie de « Ne change pas ».
  - Avec la feuille de 272 px, elle commence à 276 px du haut. Il faut y empiler la tête, les onglets, le titre, l'en-tête « Logement », Louer / Acheter (44 px), les tuiles (44 px) et le libellé : le curseur tombe sous 548 px.
  - Le prototype ne l'a mis à 537 px qu'avec la feuille de 338 px et le titre masqué. Or le plan met les deux en tâche 5 et exige la suite verte à chaque tâche.
  - Proposition : avancer en tâche 2 le jeton `taille-feuille-min` 338, le titre `sr-only` sous 1 024 px et la condition d'arrêt de D11 (AC-1 d'interface-telephone à 375 × 548). Le risque de mise en page est alors connu avant les tâches 3 à 5.
- **La tâche 1 charge `achat.json`, mais les tests ne savent le servir qu'à partir de la tâche 2.**
  - Le service de ce fichier aux tests (`tests/e2e/lib/carte.ts`) n'arrive qu'en tâche 2.
  - Pendant la tâche 1, Playwright sert donc la fixture de 5 communes avec le vrai `achat.json` de 34 746 lignes, aligné par position : de faux prix, sans erreur visible.
  - Proposition : déplacer en tâche 1 le service de `achat.json` (et la règle « champ absent = inconnu ») dans `carte.ts`.
