# Relecture de la spec — services, révision D19, D20 (2026-11-26)
Statut : terminé

Relu comme l'agent qui construira la révision. Lu : `spec.md`, `details.md`, `acceptance.json`, `mesures.md`, `docs/feedback/synthese-2026-11-26.md`, `docs/specs/INDEX.md`, `STATE.md`, CLAUDE.md, et le code et les tests qui citent `commerce`. Je n'ai pas pu lancer `git diff` (pas d'outil shell) : j'ai relu les fichiers en entier.

**Recalcul des critères (fixture et R51 à R55) : aucune valeur fausse.**
- AC-1 : ordre et crans de R51 et H202, cohérents.
- AC-5 : commune X, plus petit temps par carreau entre B104 et B105 = 9 (10 hab.), 7 (30), 10 (20), 30 (5) ; c5 ignoré ; moitié de 65 = 32,5, atteinte à 9 → 9 min (avec B202, ce serait 4 : le critère distingue bien les deux calculs). Y 2, Z 3, V 9, W 9, arrondis 1 / 4 / 5, arrondissements 3 : justes.
- AC-6 : valeurs de Portmer, Terrebasse (75 → « plus d'une heure »), Quaibleu, Rhinval conformes à la fixture ; phrase des limites identique à H159.
- AC-13 : Auch et Bordeaux reprennent dans le même ordre les anciennes valeurs de `scripts/data/services.py` l.102-103, avec l'urgence en plus. Supermarché ≥ ancien commerce partout (Île-d'Yeu 3 → 4) : c'est cohérent, puisque le supermarché retient moins d'équipements.
- AC-18 : à 30 min, Rhinval 22, Portmer 14, Grandeville 3 et Quaibleu 30 passent ; Terrebasse 75 non → 4 communes. À 15 min, Portmer et Grandeville → 2. Juste.
- AC-19 : la liste d'AC-2 moins Rhinval (supermarché 6) → 3 communes. Avec 45 min, rien ne change (14, 3, 30), et l'ordre de l'adresse est bien médecin, urgences, supermarché. Juste.
- AC-20 : les trois réécritures suivent R55 et H203. Juste.

Gravité : **[Majeur]** change ce qui est construit ou bloque une tâche ; **[Mineur]** texte périmé ou imprécision sans effet sur le code si l'agent devine bien.

## Ce qu'un agent devrait deviner (manques)
- **[Majeur]** Il faut relire les 14 Go de l'Insee : le type D106 (urgences) n'est pas dans l'extrait actuel. `scripts/data/services-extrait.sql` l.43, 57-60 et 239 ne retient que D265, B104, B105, B201, B202, D502, C1xx et E10x. Il faut donc relancer DuckDB (environ 15 min de lecture à distance). L'empreinte de `data-raw/services-carreaux.csv.gz`, fixée en dur dans `services.py` l.55, changera, tout comme la ligne de CLAUDE.md (« Services… tâche 0a »). Or D11 (spec.md l.21) dit « lit **une fois** », et ni D19, ni H205, ni le tableau d'impact ne mentionnent cette seconde lecture. — Où : spec.md D11, details.md H165 et H205. — Proposition : amender D11 (« relu une seconde fois pour D106, révision D19 »). Dire si l'on garde B201 et B202 dans l'extrait ou si on les retire. Dire que la nouvelle empreinte remplace l'ancienne dans `services.py` et CLAUDE.md.
- **[Majeur]** Le retrait existant de Tende pour `commerce` n'a plus de règle. `scripts/data/services-retraits.csv` l.2 retire `06163,commerce`, avec pour preuve « une épicerie de La Brigue », justement le type que D20 exclut. Or `services.py` l.289 s'arrête sur un service inconnu : après le renommage, le script refusera cette ligne. H205 (details.md l.134) dit seulement « Tende perd aussi son temps de supermarché si la tâche 0 le juge faux », et H175 (l.128) parle toujours de « Tende commerce alimentaire ». — Proposition : écrire ce qu'on fait de cette ligne. Soit on la supprime et le supermarché de Tende est jugé à neuf en tâche 0 (la preuve « épicerie » ne vaut plus), soit on la renomme. Amender H175 dans le même sens.
- **[Majeur]** La tâche 0 « refait les comptes » sans point de comparaison ni tolérance. Les chiffres de D19, D20 et H202 (27 415, 9 558, 33 676, 174, 22 329, 8 819, 28 383) et les valeurs d'urgences d'AC-13 (Auch 6, Bordeaux 5, Mende 4, Saint-Véran 55, Chamonix 4, Les Sables 7) ne figurent nulle part ailleurs : `mesures.md` ne cite ni urgences ni supermarché (seule la l.45 mentionne Tende à 224 min). Rien ne dit quel écart renvoie à Vincent. — Où : details.md H202 et H205, mesures.md. — Proposition : verser la sortie de l'essai de /spec dans `mesures.md` (comptes par cran, valeurs des communes d'AC-13) et fixer la règle : « écart de plus de N communes sur un cran → retour à Vincent » (ou « tout écart sur AC-13 → retour à Vincent », puisque l'agent ne peut pas modifier le critère).
- **[Mineur]** Aucun cran de contrôle n'est donné pour les urgences et le supermarché. `services.py` l.111-123 (`ANCIENS`) contrôle les comptes par service et par seuil (5, 10, 15, 20, 30, 45, 60, au-delà, sans) ; il faudra une ligne `urgences` et une ligne `supermarche`. H202 ne donne que 15, 30, 45 et « au-delà d'une heure », D20 seulement 10 min. — Proposition : donner les comptes complets de l'essai, ou dire que la tâche 0 les établit et que Vincent les valide.

## Décisions cachées
- **[Mineur]** H207 (details.md l.136) reporte « avant la démo » la question à D que la synthèse demandait de poser **avant la spec** (synthese-2026-11-26.md l.34 et l.57 : « si elle ne l'a pas vue, le premier correctif est la visibilité, pas les données »). Construire avant de savoir est un choix de périmètre, pas une hypothèse. — Proposition : le noter en D-n (ou en une ligne de D19 : « construit sans attendre la réponse de D, choix de Vincent »).
- **[Mineur]** D1 « Écarté : supermarché seul » (spec.md l.11) reste écrit alors que D20 adopte précisément le supermarché seul. Le marqueur « Révisée par … D20 » suffit à un humain ; un agent qui lit D1 seul trouve le contraire. — Proposition : barrer ou annoter l'« Écarté » de D1.

## Contradictions et doublons
- **[Majeur]** D19 (spec.md l.29 : « SMUR compris ») et H204 (l.133, la limite affichée parle de « services d'urgence et SMUR ») contredisent H205 (l.134 : « faux = … un service d'urgence qui n'est qu'une base de SMUR »). Si D106 compte les bases de SMUR, chaque commune dont la base la plus proche est un SMUR sans accueil a un temps « faux » au sens de H205, et le contrôle de 10 communes ne le corrige pas ailleurs. L'agent ne sait pas s'il doit garder les SMUR (D19), les retirer commune par commune (D12) ou compter en tâche 0 combien de communes en dépendent. — Proposition : trancher en D19. Par exemple : « SMUR compris, assumé, la limite le dit ; la tâche 0 compte les communes dont l'équipement le plus proche est un SMUR seul ; au-delà de N, retour à Vincent ».
- **[Mineur]** Comptes périmés, non révisés, qui contredisent R54 (11 lignes, « huit premiers services ») :
  - details.md l.5 : « les 10 temps (R54) » → 11 ;
  - details.md l.18 : « 4 lignes, chacune avec ses 3 pastilles » → 5 (Médecin, Urgences, Supermarché, Scolarité, Gare) ;
  - details.md l.53 : « sans aucun temps parmi les **sept** premiers services » → huit (R54 l.43 dit « huit premiers ») ;
  - details.md l.56 : « les **9** premières valeurs disent « pas de chiffre » » → 10 ;
  - spec.md l.18, D8 : « (10 depuis D17) » → 11 depuis D19 ;
  - details.md l.115, H162 : « 10 temps rangés par colonnes » (complétée par H206, mais le corps dit toujours 10).
- **[Mineur]** « Commerce » encore lu comme un service actif : H152 (l.105, « 5, 10, 15 min pour le médecin et le commerce », et une justification « 30 min garde plus de 99 % … pour le commerce » qui ne vaut plus pour le supermarché), H153 (l.106, « écarté : « Courses » pour le commerce »), H175 (l.128, « Tende commerce alimentaire »). Le chapeau de H152 renvoie au supermarché, mais la justification du cran à 15 min n'a pas été refaite pour le supermarché (22 329 communes à 10 min contre 30 113 pour le commerce).
- **[Mineur]** R55 (details.md l.44) a été réécrite par la révision, mais sans le marqueur « *Révisée par D19 et D20* » que portent R51 et R54. Son ordre des paramètres dit toujours `mer`, alors que recherche-et-mer (validée après services, H193) l'a remplacé par `mer-min`. Un agent qui suit R55 à la lettre écrirait un ordre périmé. — Proposition : marquer R55 révisée et écrire `mer-min` (ou renvoyer à H193 de recherche-et-mer).
- **[Mineur]** spec.md l.34 annonce la révision « sans /ui (mêmes composants) », alors que `docs/design/services/README.md` l.2 la marque « À revoir (2026-11-26) ». Laquelle fait foi pour la disposition à 390 px (H48) ?

## Impact sur les tranches existantes
- **[Majeur]** Le tableau d'impact (details.md l.95) dit que seul `tests/e2e/services.spec.ts` lit `commerce`, et seulement « ceux des critères recalés ». C'est faux :
  - `tests/e2e/services.spec.ts` l.598-605 : `reglagesServices` du test d'**AC-15** (critère déclaré « tel quel », l.99) clique sur « Commerce alimentaire » ; les tests hors AC « R57 » (l.454, 457) et « H154 » (l.464-478, adresse `services=commerce:15`) aussi ;
  - `src/domain/services.test.ts` : tests d'AC-6 (l.51-90, « Commerce alimentaire : 3 min », « les 10 lignes »), l.140 (ordre des 10 clés), l.167, et l.175, qui attend que `services=commerce:15` soit **gardé**, contre H203 ; l.257, 277, 286, 318 ;
  - `scripts/data/services.test.ts` : test d'AC-5 (l.31-35, clé `commune_X_commerce`, « commerce de X 4 min »), l.55, 104, 114, 122, test d'AC-13 (l.84) ;
  - `scripts/data/services.py` : `AC13` (l.101-109, avec `commerce: 3` pour Île-d'Yeu) et `ANCIENS` (l.111-123).

  L'accord de Vincent en /breakdown pour toucher des tests protégés doit couvrir au moins le test d'AC-15 en plus des critères recalés. Il faut aussi dire si « AC-15 tel quel » reste vrai quand son test change de bouton. — Proposition : lister ces fichiers et tests dans le tableau, avec AC-15.
- **[Mineur]** recherche-et-mer n'est pas classée. Son « Ne change pas » (INDEX.md l.94) liste « services AC-1 à AC-17 », dont AC-1, AC-5, AC-6 et AC-13 changent maintenant. Et ses mentions vont « en bas du panneau de réglages » en bureau et au bas de l'onglet « Critères » au téléphone (CLAUDE.md) : la catégorie gagne une ligne, ce qui les repousse plus bas. — Proposition : une ligne « recherche-et-mer | Ne change pas (services AC-1 à AC-17) ; mentions sous « Services » | Étendue | à revérifier à 390 px ».

## Critères non testables
- **[Mineur]** AC-13 : ses valeurs d'urgences et de supermarché viennent d'un essai non versé dans `mesures.md` (voir Manques). Si la tâche 0 lit Saint-Véran à 54 min, l'agent ne peut ni corriger le critère ni savoir si l'écart vient de lui ou de l'essai. Le critère reste vérifiable, mais sa source est introuvable.
- AC-1, AC-5, AC-6, AC-18, AC-19, AC-20 : recalculés, justes et vérifiables tels qu'écrits.

## Hors sujet pour une spec
- Aucun constat qui change ce qui est construit. Les noms de fichiers du tableau d'impact (l.94-95) sont utiles au /breakdown ; ils sont seulement incomplets (voir plus haut).

## Couverture
Règles sans AC : aucune (R51 : AC-1, AC-18, AC-19 ; R52 : AC-5, AC-13 ; R53 : AC-18, AC-19 ; R54 : AC-6 ; R55 : AC-20) · Décisions sans effet vérifiable : D11 (manière de calculer, et « une fois » contredit par la révision) · Décisions sans *Pourquoi* : aucune · Zones sans état initial : aucune (les nouvelles lignes héritent de « aucune cochée ») · AC qui dépendent d'un service non simulé : aucun (AC-13 lit le fichier servi, sans service extérieur) · Mots de spec.md : environ 1 450 (estimés, sans outil de comptage)
