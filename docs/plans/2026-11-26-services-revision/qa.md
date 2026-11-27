# QA navigateur — services, révision D19, D20

Statut : terminé

Testé le 2026-11-27 sur http://localhost:5190 (version construite, vraies données), Playwright + SwiftShader, 1 440 × 900 (souris), 390 × 844 et 375 × 548 (toucher), plus clavier en 1 440. Script : `captures/qa/qa.mjs`, sortie brute : `captures/qa/qa.txt`, captures : `captures/qa/` (`<largeur>-categorie|coche|fiche-auch|fiche-saint-veran|fiche-yeu|ancien-lien.jpg`, `1440-clavier.jpg`). Pas de comparaison avec Figma (révision sans nouveau composant ; la comparaison porte sur le README de design).

## Bloquant
Aucun.

## Majeur
Aucun.

## Mineur

1. **Quatre réponses 404 dans la console, en bureau (1 440), origine non identifiée.** Elles apparaissent pendant le parcours complet (recherche de commune, fiches, ancien lien). Un second passage sur `/` et sur l'ancien lien, 5 s chacun, n'en a produit aucune : elles ne viennent donc ni de l'ouverture de la page ni de `commerce`. Aucune erreur de script (`pageerror`) ; à 390 et 375, aucune 404. À regarder par le relecteur suivant (probablement une tuile ou un fichier lu hors couverture). Preuve : `captures/qa/qa.txt`, dernière ligne.
2. **Flèches : elles ne font rien sur les cases de temps.** Focus sur « 15 min » d'Urgences + flèche droite : le focus reste sur la même case. Espace et Entrée basculent bien la case (`services=urgences:15`, puis retiré, puis remis). Si c'est le comportement voulu pour des boutons à bascule (comme mer et montagne), rien à faire ; la brief demandait « flèches », et le design ne les promet pas. À trancher.
3. **Hors tranche, vu au passage** : dans les raisons de la fiche, « Mairie : » et « Chômage : » ont une espace ordinaire avant les deux-points (« Urgences 55 min : » en a une insécable). Texte des tranches mairies et emploi, pas de cette révision.

## Ce qui est conforme

- **Catégorie « Services »** (1 440, 390, 375) : 5 lignes dans l'ordre Médecin, Urgences, Supermarché, Scolarité, Gare ; Urgences 15 / 30 / 45 min, Supermarché 5 / 10 / 15 min, plus aucun « Commerce alimentaire ». Urgences est une ligne comme Médecin (3 pastilles, même hauteur). Captures `*-categorie.jpg`.
- **Cases et adresse** : cocher Médecin 10, Urgences 30, Supermarché 5 donne `services=medecin:10,urgences:30,supermarche:5` (ordre fixe) ; décocher Urgences le retire ; 45 puis 15 : une seule cochée (15), l'adresse suit. Identique aux trois largeurs.
- **Raison** : Saint-Véran avec `services=urgences:30` affiche « Urgences 55 min : au-dessus de ton plafond de 30 min » en première raison (espaces insécables avant « : » et dans « 55 min », « 30 min »), en bureau comme au téléphone.
- **Fiche à 11 lignes**, ordre Médecin, Urgences, Supermarché, Crèche, École, Collège, Lycée, Supérieur, Gare, Gare régionale, Gare grandes lignes. Auch : Urgences 6 min, Supermarché 2 min. Saint-Véran : 17 / 55 / 35 min, « Supérieur : plus d'une heure ». L'Île-d'Yeu : « pas de chiffre » (médecin, urgences, lycée, supérieur), supermarché 4 min, trois gares « aucune sur l'île », phrase « Île sans pont… » présente.
- **Phrase des limites** avec les deux phrases ajoutées (urgences, supermarchés et hypermarchés) : lue en entier et dans la fenêtre dernière ligne comprise, en 1 440, 390 et 375 × 548 (mesure du dernier élément de la fiche : bas ≤ hauteur de la fenêtre dans les 9 cas ; capture 375 : la feuille défile, la dernière ligne « bateau. » est visible).
- **Ancien lien** `/?loyer=1200&services=commerce:5,medecin:10` : adresse réécrite `/?loyer=1200&services=medecin:10`, aucun « commerce alimentaire » dans la page, aucune erreur de script, aux trois largeurs.
- **Clavier (1 440)** : ordre de tabulation Médecin (5, 10, 15) → Urgences (15, 30, 45) → Supermarché → niveaux de scolarité → temps de scolarité → type de gare, sans saut ni piège. Focus visible partout (contour plein de 2 px, ombre en plus sur la case focalisée, `1440-clavier.jpg`).
- **Textes** : insécables avant « : » et dans « N min » partout dans la catégorie et la fiche ; pas de faute vue.
- Aucun débordement horizontal ni coupure vu sur les captures de 390 et 375.

## Non vérifié

- **Figma** : non consulté (aucune nouvelle maquette ; le README de design dit « mêmes composants »).
- **Origine des 404** (voir Mineur 1).
- **Tabulation au clavier à 390 et 375** : testée seulement en 1 440 (écrans tactiles, clavier non demandé en détail au téléphone).
- Comparaison pixel par pixel avec les captures des constructeurs : non faite ; vérifié sur les textes et la structure.
- Communes « sans chiffre » hors Île-d'Yeu : non testées (« pas de chiffre » vu sur L'Île-d'Yeu seulement).
