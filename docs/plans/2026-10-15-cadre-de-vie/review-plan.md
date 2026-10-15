# Relecture du plan — cadre-de-vie
2026-10-15 · relecteur neuf, mode plan · lu : plan.md, spec/details/acceptance/recalage de cadre-de-vie, D12/R24/H84/AC-14 d'immobilier, acceptance.json des 4 tranches, src/App.tsx, src/domain/score.ts, src/domain/prix.ts, tests/e2e (adresse, liste, fiche, carte, etats, composants, immobilier, proches, proches-etats, proches-carte), tests/e2e/lib/carte.ts, scripts/data/communes.test.ts, docs/solutions/README.md.

Ce qui tient : chaque AC de cadre-de-vie (AC-1 à AC-12) et AC-14 d'immobilier est dans une seule tâche. Les 50 critères recalés sont répartis une seule fois (tâche 2 : 32, tâche 3 : 17, tâche 4 : immobilier AC-8). La tâche 0 couvre « Le risque » (villes nommées, extrêmes, arrêt à 2 villes jugées fausses). App.tsx lit `communes.json` par position (App.tsx:56), donc deux colonnes en fin de ligne sont bien ignorées jusqu'à la tâche 2. Les codes A à E sont les mêmes dans les quatre fixtures (99001 à 99005), donc la jointure par code de `lib/carte.ts` est possible.

## Bloquant

### B1 — Le tableau « Tests hors critères touchés » n'est pas complet. La bascule casse des tests qu'aucune tâche ne nomme, et la règle du plan oblige à s'arrêter pour chacun
- **Où** : plan l.9 (« Une modification autorisée = … le libellé ou l'adresse du tableau … rien d'autre ») et tâche 3, « Fichiers » (liste fermée des tests hors critères). Risque l.86.
- **Preuve** : `ouvrir(page)` ouvre `/` par défaut (`tests/e2e/lib/carte.ts:69`). Au nouveau départ, 4 communes passent dans la fixture « 5 communes » (loyer-mer AC-12 recalé : Terrebasse 65, Portmer 46, Grandeville 31, Quaibleu 9), contre 3 aujourd'hui. Ces tests protégés casseront donc à la tâche 3, et aucun n'est listé :
  - `fiche.spec.ts:79-86` « ronds du top 10 » : attend 3 ronds et « 2e : Quaibleu (13) » ;
  - `liste.spec.ts:52-55` « zone annoncée » : attend « 3 communes passent tes critères » à l'ouverture (seule la l.56 est listée) ;
  - `etats.spec.ts:26-39` « fond rétabli » : attend A en `score-4`, or A vaut 46 au nouveau départ, donc `score-3` ;
  - `proches-etats.spec.ts:133-164` H21 : attend « 3 communes passent tes critères » ;
  - `proches.spec.ts:149` « Retirer » : attend 72, 49, 32 ;
  - `fiche.spec.ts:61-77` « parcours » : glisse le curseur `Mer à moins de` (l.71). details.md le couvre par sa ligne générique « tous les tests qui trouvent Mer à moins de », mais la liste fermée de la tâche 3 l'omet ;
  - `immobilier.spec.ts:466` : vérifie le style de la valeur du curseur de la mer (`plafond(page, '60 km')`, 16 px gras). Ce curseur disparaît, donc il faut **retirer une vérification**. Ce n'est ni un libellé ni une adresse ;
  - `composants.spec.ts:20` : cherche `/Petite ville/` sur `demo.html`, alors que le plan fait suivre les libellés à `src/demo/Demo.tsx` (tâche 3).
  - La leçon `2026-10-14-spec-libelles-lus-par-les-tests-proteges.md` demande justement cet inventaire avant de construire.
- **Correction** : /breakdown fait l'inventaire complet avant validation. Il cherche `ouvrir(page)`, `ouvrir(page, '/'`, `goto('/')`, `Mer à moins de`, `Taille de ville`, `Petite ville`, `Grande ville`, `60 km`, `mer=60`, `mer=aucun` dans `tests/` et `src/**/*.test.ts`. Il écrit dans la tâche 3, test par test, la modification prévue. Vincent approuve cette liste en validant le plan.
- **Question à Vincent** : « Les tests hors critères qui ouvrent `/` et lisent l'ancien départ (3 communes, 72/49/32) peuvent-ils ouvrir `/?loyer=1200&mer=50`, avec les valeurs déjà recalées (72/48/25, loyer-mer AC-4) ? Ils gardent ainsi ce qu'ils vérifient. Et le test du design F (immobilier l.466) peut-il perdre sa vérification du curseur de la mer, qui n'existe plus ? »

## Majeur

### M1 — Les moitiés exactes (H74) apparaissent dès la tâche 2, pas en tâche 3 ou 4
- **Où** : tâche 2, condition d'arrêt (« un critère recalé échoue sur le code actuel → arrêt »). « À respecter », l.21 (test unitaire sur deux cas). Risques, l.87 (« Test unitaire en tâche 4 … AC-2 en tâche 3 le voit déjà »).
- **Preuve** : la tâche 2 réécrit déjà des critères qui tombent sur une moitié : loyer-mer AC-4 (Quaibleu 47,5 → 48), proches AC-9 et AC-10 (48), interface-telephone AC-5 (48), immobilier AC-2 (Portmer 61,5 → 62). Le code actuel calcule `Math.round(notes.reduce(...) / notes.length)` en virgule flottante (`src/domain/score.ts:128`). Si une moitié se perd, la tâche 2 s'arrête et accuse « recalage.md ou le code ». Or H74 dit déjà que c'est au code de tenir. recalage.md l.7 cite aussi deux autres moitiés : 67,5 → 68 en maison 72 m² et 66,5 → 67 à 1 000 €. Le plan n'en teste que deux.
- **Correction** : placer en tâche 2 le test unitaire de H74, sur les quatre cas de recalage.md l.7, et la correction de `score.ts` si besoin (le fichier est déjà dans la tâche 2). Écrire qu'un échec sur une moitié de H74 est une correction du code, pas un arrêt. Corriger la ligne de risque l.87.

### M2 — Le test de loyer-mer AC-11 réécrit en tâche 2 lit le curseur de la mer, et la tâche 3 ne le reprend pas
- **Où** : tâche 2 (liste : loyer-mer AC-11) ; tâche 3 (« critères recalés restants », sans AC-11).
- **Preuve** : `tests/e2e/adresse.spec.ts:10,15` lit `getByRole('slider', { name: 'Mer à moins de' })` et son `aria-valuetext`. Le *then* recalé (« les réglages affichent 800 € et 50 km ») passera sur le code actuel, mais la tâche 3 retire ce curseur. Le test devient rouge, et aucune tâche n'a le droit de le toucher. La règle du plan l.47 ne déplace que les critères qui ont besoin d'un **geste** supprimé, pas ceux qui **lisent** un réglage dont la forme change.
- **Correction** : déplacer loyer-mer AC-11 en tâche 3, ou le nommer en tâche 3 comme seconde réécriture (lecture de la pastille « 50 km », `aria-checked`). Ajouter à la règle de la l.47 : « ou qui lit le curseur de la mer ou le groupe Taille de ville ».

### M3 — Des assertions existantes de `scripts/data/communes.test.ts` contredisent D12 sans être nommées
- **Où** : tâche 1, « Tests » (« communes.test.ts étendu »).
- **Preuve** :
  - `communes.test.ts:82-84` : la liste des sources acceptées ne contient ni `tous-biens` ni `tous-biens-secteur`. Elle échouera dès que la tâche 1 écrit `achat.json`.
  - `communes.test.ts:112-115` : Agnicourt-et-Séchelles (02004) est attendue `inconnu-secteur` en appartement, et Île-de-Sein (29083) `inconnu-secteur` en maison. Or D12 d'immobilier donne « maisons : 1 → 0 », donc Île-de-Sein aura un prix tous biens. Agnicourt aussi, très probablement (« 2 195 → 1 »).
- **Correction** : nommer ces deux tests comme modifiés en tâche 1, en passant par le garde-fou. Agnicourt est remplacée par la commune qui reste sans prix d'appartement, mesurée en tâche 0. Île-de-Sein en maison prend sa source et son prix mesurés en tâche 0. La liste des sources gagne les deux nouvelles.

### M4 — AC-1 de cadre-de-vie est placé en tâche 4, mais il vérifie le groupe du type, qui n'arrive qu'en tâche 5
- **Où** : tâche 4, « Tests : AC-1 ».
- **Preuve** : le *then* d'AC-1 (acceptance.json l.291) dit « aucune taille ni aucun type n'est coché ». Le groupe « Type d'environnement » est construit en tâche 5. En tâche 4, le test ne peut pas lire l'état des pastilles de type.
- **Correction** : déplacer AC-1 en tâche 5, ou dire qu'on écrit son test en tâche 4 puis qu'on le complète en tâche 5 (le fichier `cadre-de-vie.spec.ts` est dans les deux tâches). La première option est plus simple.

### M5 — La partie iPhone d'interface-telephone AC-8 n'est prévue nulle part, et la tâche 2 la validerait sur l'ancien écran
- **Où** : tâche 2 (interface-telephone AC-8 dans la liste, puis `passes: true`).
- **Preuve** : le *given* recalé d'AC-8 se termine par « puis l'iPhone de Vincent (Safari), sur une version construite servie par le Wi-Fi ». La tâche 3 change le contenu de l'onglet « Critères », là où se joue ce critère (clavier et feuille). Aucune tâche ne demande l'iPhone à Vincent, et la liste « Demandera » ne le mentionne pas.
- **Correction** : faire la partie iPhone d'AC-8 après la tâche 3 (en tâche 3 ou en tâche 5), l'ajouter à « Demandera » (~5 min de Vincent), et ne passer `passes` à `true` qu'à ce moment.

## Mineur

### m1 — En tâche 1, « l'écran ne change pas » est faux sur les vraies données
- **Où** : tâche 1, But et Tests.
- **Preuve** : `achat.json` gagne `tous-biens` pour environ 2 000 communes. `src/domain/prix.ts:9` ne connaît pas ces sources, la conversion de la l.113 les accepte sans rien dire, et la l.99 ne les reconnaît pas comme estimation. Des tâches 1 à 5, en Acheter, ces communes montrent un prix sans ligne d'estimation. Rien n'est mis en ligne, mais les preuves des tâches 3 et 4 sur les vraies données passent par cet état.
- **Correction** : écrire les sources `tous-biens` dans `achat.json` en tâche 5, avec `prix.ts` et AC-14, ou au moins le dire dans la tâche 1. Sans cela, un constructeur qui vérifie « écran inchangé » sur les vraies données en Acheter verra un écart.

### m2 — Décision cachée : la source `tous-biens` pour Paris, Lyon et Marseille
- **Où** : tâche 1, Sorties (« pour Paris, Lyon, Marseille, la source `tous-biens` si un arrondissement au moins l'a, sinon les règles d'aujourd'hui »).
- **Preuve** : ni D12, ni H67, ni H84 ne le disent. C'est la ligne affichée dans la fiche de trois grandes villes.
- **Correction** : compter le cas en tâche 0 (probablement 0 arrondissement). S'il vaut 0, retirer la phrase et ajouter un contrôle « 0 ». Sinon, **demander à Vincent** : « Si un seul arrondissement n'a qu'un prix tous biens, la fiche de la ville entière dit-elle "Estimation tous biens" ? »

### m3 — Un test d'AC sauté en tâche 3 sans passer par Vincent
- **Où** : tâche 3, Tests (« immobilier AC-8 … son ancien test (`mer=200`) est sauté ici avec la raison écrite »).
- **Preuve** : sauter un test d'AC modifie un fichier protégé. CLAUDE.md : « Jamais : modifier ou supprimer un test d'acceptation ». Le saut est inévitable (`mer=200` devient Peu importe), mais il n'est pas dans « Demandera ».
- **Correction** : ajouter à « Demandera » : « tâche 3 : saut temporaire du test d'immobilier AC-8 (`immobilier.spec.ts:336`) jusqu'à la tâche 4 ».

### m4 — La preuve de la tâche 2 n'est que la sortie de `npm test`
- **Où** : tâche 2, Preuve attendue.
- **Preuve** : la tâche 2 change `charger` (App.tsx:50-68) sur les vraies données. Or CLAUDE.md dit : « Des tests verts ne suffisent pas ».
- **Correction** : ajouter une preuve sur la version construite avec les vraies données. Par exemple, la fiche de Bordeaux inchangée et une lecture de `typeEnv` et `montagneKm` de Bordeaux dans la page, qui valent ce qu'a mesuré la tâche 1.

### m5 — Une leçon utile n'est pas citée
- **Où** : « À respecter », l.25.
- **Preuve** : `docs/solutions/2026-10-14-feuille-plus-haute-et-cadrage-de-la-carte.md` (une feuille plus haute réduit la bande de carte et peut faire échouer interface-telephone AC-1). La catégorie « Cadre de vie » change le contenu de l'onglet « Critères ».
- **Correction** : la citer en tâche 3, avec interface-telephone AC-1 et H48 rejoués après la bascule. Elle est déjà dans « toute la suite », mais la leçon dit où regarder.

### m6 — Taille de la tâche 3
- **Où** : tâche 3. L'exception est assumée, mais il y a 8 fichiers de code, environ 17 critères, une dizaine de tests hors critères (plus ceux de B1) et `Demo.tsx`.
- **Correction** : aucune obligatoire. Une coupe possible : 3a, taille, mer, adresse et départ, avec tous les tests ; 3b, ligne de fiche R30 et mention Insee (loyer-mer AC-7, AC-8). Ce découpage n'est pas indispensable : la suite ne peut être verte qu'avec la bascule entière.

## Non vérifié
- Si le code actuel perd vraiment une moitié (M1). Je n'ai rien exécuté. Mon calcul à la main pour Quaibleu (8,999… + 86 → 95 → 47,5) donne 48, mais ce n'est pas une preuve pour les quatre cas.
- Le détail des tests hors critères de `telephone-feuille.spec.ts`, `telephone-vue.spec.ts`, `proches-mobile.spec.ts`, `proches-clavier-iphone.spec.ts` et `proches-carte.spec.ts` (l.155 « aucune commune avec un proche prêt », l.226 « repère au-dessus du rond du top 10 ») : il en reste sans doute d'autres pour B1.
- Le contenu de `src/demo/Demo.tsx`, `src/domain/url.ts`, `format.ts`, et des tests unitaires `url.test.ts`, `score.test.ts`, `prix.test.ts`, `format.test.ts`, `proches.test.ts`.
- Les chiffres de recalage.md eux-mêmes, et les nombres de la tâche 0 (comptes de la grille Insee).
- Si le garde-fou accepte de passer `passes` à `true` dans les `acceptance.json`, qui sont protégés.
