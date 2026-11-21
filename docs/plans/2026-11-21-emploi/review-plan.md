# Relecture du plan — emploi
Statut : terminé

Relecteur neuf, 2026-11-21. Plan lu : `docs/plans/2026-11-21-emploi/plan.md` (brouillon). Spec : spec.md (D1–D14), details.md (R44–R50, H128–H147), acceptance.json (AC-1 à AC-14). Code lu : `tests/e2e/lib/carte.ts`, `tests/e2e/mairies.spec.ts`, `tests/e2e/cadre-de-vie.spec.ts`, `src/domain/score.ts` (`kmCompare`), `src/proches/distance.ts`, `src/ui/Fiche.tsx`, `public/data/reperes.json` (format), `docs/research/2026-11-21-emploi/mesures/emploi_reel.py`.

Répartition relevée : T0 AC-8 · T1 AC-11, AC-12 · T2 AC-10 · T3 AC-1, AC-2, AC-4, AC-5, AC-6, AC-7, AC-9, AC-14 · T4 AC-3, AC-13. Les 14 critères ont chacun une seule tâche. Pour chaque critère, j'ai vérifié que les gestes de son « when » sont construits dans sa tâche ou avant (leçon du 2026-10-16) : un seul ne l'est pas (AC-11).

Légende : **[plan]** = correction du plan, l'agent de /breakdown la fait seul · **[Vincent]** = décision de produit, à lui demander.

## Critères sans tâche ou dans deux tâches

### Bloquant
1. **AC-11 confié à la tâche 1, mais son « then » lit une case que seule la tâche 3 construit.** [plan]
   - Preuve : acceptance.json, AC-11 « then » : « … et « 10 % » est cochée pour les infirmiers, rien pour les graphistes ». Plan l. 56 (tâche 1, But) : « rien de nouveau dans le panneau ». Les cases « 10 % » · « 25 % » · « Partout où il recrute » arrivent en tâche 3 (plan l. 75).
   - Conséquence : AC-11 ne peut pas passer en entier en tâche 1. Il faudrait soit le cocher à moitié, soit retoucher le test plus tard, alors que les critères sont protégés. C'est le cas décrit par `docs/solutions/2026-10-16-critere-qui-utilise-l-action-d-une-tache-suivante.md`.
   - À changer : mettre AC-11 en tâche 3, avec AC-4 à AC-7. Les unitaires de R48 restent en tâche 1 (réécriture des trois adresses, adresse sans `metier`). La preuve de la tâche 1 devient « AC-12 vert » et non plus « AC-11 et AC-12 verts » (plan l. 61).

## Tâches sans preuve attendue

Chaque tâche a une preuve attendue, sur la vraie version (`npx vite preview`). Trois preuves sont incomplètes ou ne peuvent pas être jugées telles qu'écrites.

### Majeur
2. **AC-12 : la tolérance de « 4 588 communes » n'est pas traduite en test, et le chiffre de référence vient d'un autre calcul que celui de la page.** [plan]
   - Preuve : AC-12 « then » : « 4 588 communes passent (mesuré … avant le recalage des 12 communes de H142 ; un écart de plus de 1 % revient à Vincent) ». Le plan (l. 60) dit « AC-12 dans `src/domain/emploi.test.ts`, sur les vrais fichiers », sans dire ce que le test compare.
   - Le chiffre vient de `docs/research/2026-11-21-emploi/mesures/emploi_reel.py`, qui diffère de la page sur deux points :
     - rayon de 6 371,0088 km (l. 36), contre 6 371 km dans `distanceKm` ;
     - `round` de Python, qui arrondit une moitié exacte vers le chiffre pair, contre `Math.round` (moitié vers le haut) dans `kmCompare`, `score.ts` l. 168.
   - Ajouté au recalage des 12 communes, le compte de la page ne sera presque sûrement pas exactement 4 588. Un test strict casse ; un test sans borne ne prouve rien.
   - À changer :
     - écrire que le test accepte 4 542 à 4 634 (±1 %) et affiche le compte exact ;
     - au-delà : arrêt et retour à Vincent ;
     - calculer ce compte dès la tâche 0 et l'ajouter aux conditions d'arrêt de la tâche 0. Aujourd'hui elle contrôle 39, 98, 120, Bordeaux 742 et La Rochelle, mais pas 4 588 ;
     - citer `emploi_reel.py` dans les entrées de la tâche 0, comme source des chiffres d'AC-12 (seuls `lire_xlsx.py` et `jointure.py` sont cités, l. 35).

### Mineur
3. **Preuve de la tâche 1 : le « vrai flux » des raisons n'est pas regardé.** [plan]
   - Preuve : AC-12 est joué dans Vitest, alors que son « when » dit « la page est ouverte ». La preuve sur `vite preview` (l. 61) ne capture que des couleurs : Bordeaux et Pau, puis Pau.
   - À changer : ajouter les captures des fiches de La Rochelle (« le plus proche : La Roche-sur-Yon, 61 km ») et de Pau avec les deux métiers (« Bayonne, 92 km »). Ce sont les deux phrases de « C'est réussi si ». Sinon, le seul endroit où on les voit dans la page est l'étape 3 de la tâche 4.

4. **Tâche 0 : le contrôle des empreintes tourne en rond.** [plan]
   - Preuve : sortie 3 (l. 39), « empreintes égales à celles notées dans CLAUDE.md ». Or CLAUDE.md n'est écrit qu'à la sortie 6 de la même tâche.
   - À changer : écrire les empreintes dans `emploi.py`, ou dans CLAUDE.md avant le premier calcul, à partir des fichiers téléchargés, comme pour la DVF et les municipales.

## Décisions cachées

### Majeur
5. **« Le plus proche » calculé à l'ouverture de la fiche : la tâche 1 ne dit pas où, et le fichier qui l'affiche n'est pas dans sa liste.** [plan]
   - Preuve, côté plan : l. 23, « « le plus proche » au-delà de 30 km se calcule à l'ouverture d'une fiche, pour cette commune seulement ». Tâche 1, Sorties : « les raisons de R46 … avec « le plus proche » ».
   - Preuve, côté code : les raisons de la fiche viennent toutes de l'évaluation (`Fiche.tsx` l. 67-69 : `e.raisons.map(r => raisonTexte(r))`). `raisonTexte` est une fonction de mise en forme, sans accès aux données. `Fiche.tsx` n'est pas dans les fichiers de la tâche 1 (l. 59).
   - Le constructeur doit donc choisir seul entre deux voies :
     - calculer le plus proche pour toutes les communes écartées pendant l'évaluation, ce qui coûte ce que la ligne 23 veut éviter ;
     - enrichir la raison de la seule commune ouverte, dans `App.tsx` ou `Fiche.tsx`.
   - À changer : nommer la voie, par exemple « la raison porte le niveau ; `App.tsx` complète la ville et les km pour la commune ouverte », et ajouter `Fiche.tsx` à la tâche 1 si elle y touche.
   - Bug à éviter au même endroit : `Fiche.tsx` l. 68 pose `key={r.critere}`. Deux métiers qui écartent la même commune auraient la même clé React, et l'une des deux raisons peut être mal affichée. H139 prévoit pourtant « métier 1, métier 2 », et aucun critère ne le teste : la fixture n'a pas de commune écartée par deux métiers. Ajouter un unitaire, ou une clé distincte par métier.

### Mineur
6. **« Jamais par position » contredit l'usage obligé de `reperes.json`.** [plan]
   - Preuve : plan l. 21, « jamais par nom ni par position ». Or `reperes.json` n'a pas de code : une ligne par commune, dans l'ordre de `communes.json` (`carte.ts` l. 73-79 ; `distance.ts` l. 17). Le plan l. 23 impose d'y prendre les points.
   - À changer : « les points de `reperes.json` restent lus dans l'ordre de `communes.json`, comme aujourd'hui ; `emploi.json` se joint par code ».

7. **La fixture ne donne pas les villes principales sous une forme lisible par une machine.** [plan]
   - Preuve : les villes principales des bassins 99B1, 99B2 et 99B3 ne sont écrites que dans le texte `description` de la fixture. `distances_km` est rangé par **noms** de communes et de villes principales.
   - À changer : dire que `carte.ts` déduit la ville principale par H135, depuis les populations du jeu, et passe des noms aux codes par les `items` de la fixture. C'est permis dans un outil de test, jamais dans le code de la page.

8. **Jeu « métropole » sans bassin : le comportement de la page n'est pas décrit.** [plan]
   - Preuve : plan l. 24, le jeu « métropole » n'a « ni bassin ni zone ». H142 dit au contraire que toute commune a un bassin, et la fiche de R47 écrit « bassin de <…> ».
   - À changer : une phrase pour le cas d'une commune sans bassin, par exemple « ligne du métier absente ; jamais gardée par un niveau ». Ou bien dire qu'aucun test du jeu métropole ne choisit de métier.

9. **Trimestre de la mention du chômage : écrit en dur ou lu dans les données ?** [plan]
   - Preuve : H143, « … par zone d'emploi, <trimestre> » ; AC-1 attend « 2e trimestre 2026 » ; la tâche 0 retient « le dernier trimestre publié ». Le plan (tâche 2) ne dit pas d'où vient le trimestre.
   - À changer : `Mentions.tsx` lit le trimestre d'`emploi.json`. Sinon, la mention et la fiche peuvent se contredire si l'Insee a publié le 3e trimestre.

10. **Focus après « Retirer » : choix nouveau, non signalé.** [plan]
    - Preuve : plan l. 75, « Après « Retirer », le focus va au champ « Ton métier » s'il revient, sinon au premier élément du métier restant ». Ni la spec, ni le design (decisions.md) ne le disent.
    - Le choix est bon (WCAG 2.4.3), mais il faut le marquer « décidé par Claude, contestable à la démo », comme le focus sur « 10 % ».

11. **Seuil de 300 ms pour le calcul des distances, sans source.** [plan]
    - Preuve : l. 51 et l. 95. Ni la spec ni H140 ne donnent ce seuil.
    - À changer : dire d'où il vient (une estimation de Claude, ou une mesure), comme le fait la ligne sur le poids (l. 96).

12. **« Deux chiffres jugés faux » : le plan choisit une lecture plus stricte que la spec.** [Vincent]
    - Preuve : spec.md, « Le risque » : « Vincent juge 3 métiers dans 5 bassins connus ; deux faux → retour sur D3 ». Plan l. 49 : « deux chiffres du tableau jugés faux ».
    - Le tableau a 15 cases. « Deux faux » peut vouloir dire deux métiers sur trois, ou deux cases sur quinze, et ces deux lectures mènent à des arrêts très différents.
    - À demander à Vincent en lui présentant le tableau, ou à écrire comme une hypothèse.

## Le risque de la spec

Il est couvert. Le premier test du risque (les métiers des testeurs sous 130 bassins) a déjà eu lieu et a été tranché par D14. Le second (3 métiers dans 5 bassins, jugés par Vincent) est en fin de tâche 0, avant toute interface, avec un arrêt (l. 41, l. 49). Les comptes M2X90 d'AC-12 sont des contrôles qui arrêtent la tâche (l. 39).

Deux lacunes, déjà couvertes plus haut :
- le constat 2 : 4 588 n'est pas contrôlé en tâche 0 ;
- le constat 12 : le seuil « deux faux » est ambigu.

Une remarque **[plan]**, mineure : les comptes de communes du tableau de Vincent (« le nombre de communes qui passent à chaque niveau ») et la mesure du temps de calcul « en Node puis dans Chromium » demandent en tâche 0 un calcul des distances, alors que la fonction de la page n'existe qu'en tâche 1. Il faut dire que la tâche 0 utilise un script de mesure jetable, dans `captures/`, avec le même rayon et le même arrondi que `kmCompare`, et que la tâche 1 recompare. La tâche 4 relit bien le tableau sur la page (l. 88), mais tard.

## Périmètre

### Majeur
13. **La tâche 3 dépasse la taille permise : plus de 8 fichiers, et nettement plus de 2 h.** [plan]
    - Preuve, côté fichiers (l. 78) : `Emploi.tsx`, `Settings.tsx`, `format.ts`, `emploi.ts`, `emploi.spec.ts`, le details.md de mairies, plus jusqu'à 4 tests protégés (l. 12) : jusqu'à 10 fichiers.
    - Preuve, côté travail : 8 critères (9 avec AC-11, constat 1), la recherche de H133, les règles de focus, le décalage des tests protégés, et une mesure de réaction.
    - À changer, en coupant en deux :
      - **3a**, catégorie, recherche, choix, retirer, et le décalage des tests protégés : AC-1, AC-2, AC-14 ;
      - **3b**, les niveaux : AC-4, AC-5, AC-6, AC-7, AC-9, AC-11.
    - Cela fait 6 tâches, ce qui reste dans la taille annoncée par la spec (« ~6 tâches »).

### Mineur
14. **Moment où l'on revérifie les tests protégés décalés : le plan déplace ce que details.md demande.** [plan]
    - Preuve : details.md l. 91, « revérifier **en tâche 0** les tests qui parcourent les catégories au clavier ou au défilement ». Plan l. 12 et l. 77 : en tâche 3, avec des « candidats ».
    - Le déplacement se défend, puisque rien ne bouge avant la tâche 3. Il faut alors l'écrire comme un écart à details.md.
    - J'ai relevé les tests concernés (recherche des tabulations, des défilements et de « Tes proches » dans `tests/e2e`) :
      - les tabulations de `cadre-de-vie.spec.ts` (l. 382-386 et 580) restent dans « Cadre de vie » : elles ne sont pas touchées ;
      - `mairies.spec.ts` l. 78 est bien la seule ligne qui lit l'ordre « Vie locale » → « Tes proches » ;
      - aucun `acceptance.json` ne fixe cet ordre, donc la modifier ne change pas de `given / when / then` ;
      - la liste de candidats du plan est plausible, mais non vérifiée ligne par ligne pour `telephone-feuille.spec.ts` (11 occurrences).

15. **Tâche 0 : au plafond de fichiers, et plus longue que 2 h.** [plan]
    - Preuve : 8 entrées (l. 43) ; un pipeline complet de données, 4 mesures (poids, distances en Node et dans Chromium, réaction) et une attente de Vincent.
    - Le précédent de mairies est comparable, donc ce n'est pas bloquant. On pourrait sortir les mesures de temps dans une tâche 0b, ce qui règle aussi la remarque de la section « Le risque ».

Rien hors spec n'a été ajouté. Rien de la spec ne manque, en dehors du constat 1. Aucune nouvelle dépendance. Les fichiers `acceptance.json` ne sont pas touchés (l. 24).

## Ordre

L'ordre est bon. La tâche 1 donne un squelette qui marche de bout en bout par l'adresse : données, distances, filtre, carte, liste, raisons, sur la fixture et sur les vraies données, avant tout écran nouveau, comme la tâche 1 de mairies. La tâche 0 mesure le risque avant tout code d'interface.

Une seule réserve, liée au constat 1 : la tâche 1 ne peut pas porter AC-11.

---

Constats par section : Critères 1 (bloquant) · Preuves 3 (1 majeur, 2 mineurs) · Décisions cachées 8 (1 majeur, 7 mineurs, dont 1 pour Vincent) · Risque 1 remarque mineure (plus 2 renvois aux constats 2 et 12) · Périmètre 3 (1 majeur, 2 mineurs) · Ordre 0.
