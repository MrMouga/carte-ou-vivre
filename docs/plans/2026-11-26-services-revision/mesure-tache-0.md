# Mesure de la tâche 0 — urgences et supermarché dans les données
2026-11-26 · tâche 0 de /build services, révision D19, D20 · [plan](plan.md) · Spec : D19, D20, H205, H206, H208, H209 · [mesures de la spec](../../specs/2026-11-23-services/mesures.md#révision-d19-d20-2026-11-26)

## En bref
- Les 13 fichiers de l'Insee n'ont pas changé (sommes, tailles, dates : `sources.py --services` tout « ok », 20:15).
- Extrait refait avec D106 en 9 min 41 s (20:15:30 → 20:25:11) : **mêmes 2 342 797 lignes**, et toutes les autres colonnes identiques, ligne pour ligne, à l'extrait du 2026-11-24.
- `services.py` : **tous les contrôles « ok »**, dont les valeurs d'AC-13 révisé (exactes) et les comptes du supermarché (identiques à mesures.md).
- `services.json` : 12 chaînes (11 services de R54, puis `commerce`, provisoire) ; les 9 chaînes inchangées et `commerce` **identiques caractère pour caractère** à celles d'avant.
- Urgences : comptes **identiques à l'essai de /spec** à chaque seuil de 5 à 60 min ; au-delà d'une heure, 166 et non 174 (le 174 de mesures.md ne s'accorde pas avec ses propres totaux, plus bas).
- Poids final (sans `commerce`) : **330 752 octets en `gzip -9`** (limite 350 000, H206) et 263 624 en `brotli -q 3`.

## État de départ de la suite (relevé par l'orchestrateur à 20:00-20:13, commit `ad386e7`)
Sorties complètes : [taches/depart-vitest.txt](taches/depart-vitest.txt), [taches/depart-playwright.txt](taches/depart-playwright.txt). Rouges attendus (fixture révisée au commit `bc13bcc`) ; la tâche 0 ne doit en ajouter aucun.

**Vitest** : 456 tests, 436 verts, **20 rouges** (2 fichiers) :
- `scripts/data/services.test.ts` › AC-5 : commerce de X 4 min, médecin de Y 2, de Z 3, de V 9, lycée de W 9 ; arrondis 0,4 → 1, 4,49 → 4, 4,5 → 5 ; ville à arrondissements 3 min
- `src/domain/services.test.ts` › valeur d'un service dans la fiche (R54) › AC-6 Portmer : les 10 lignes dans l'ordre de R54, sans phrase de la traversée ; phrase des limites de H159
- … › AC-6 Terrebasse « Gare régionale : plus d'une heure » (61 min), Quaibleu « Gare régionale : 60 min », Rhinval « pas de chiffre »
- … › jointure par code INSEE : une commune absente du fichier n'a aucun chiffre ; l'ordre du fichier ne compte pas
- … › île sans pont (cas sûrs, Portmer) : « aucune sur l'île » pour les trois gares, pas pour le médecin ; phrase de la traversée
- … › île sans pont sans aucun temps parmi les 7 premiers services (cas sûrs, Montcher) : « aucune sur l'île », sans phrase de la traversée
- … › île sans pont avec un temps de gare dans le fichier (Île-de-Bréhat, 9 min) : « aucune sur l'île »
- … › Corse (cas sûrs, Quaibleu en 2B) : « aucune en Corse » pour la gare régionale et grandes lignes, pas pour « Gare »
- … › population 0 (cas sûrs, Terrebasse) : « pas de chiffre » pour les 10 services
- … › libellés de R54 dans l'ordre ; « 4 min » avec une espace insécable
- `src/domain/services.test.ts` › filtre des services (R53) › AC-8 médecin 5 min : Rhinval (pas de chiffre) passe sans raison ; Quaibleu « Médecin 10 min : au-dessus de ton plafond de 5 min »
- … › médecin à chaque cran : inférieur ou égal passe (Quaibleu, 10 min, passe à 10 min)
- … › gare à chaque cran, pour les trois types ; Terrebasse et Quaibleu au-delà d'une heure
- … › cas sûrs : île sans pont sur les trois niveaux de gare, quel que soit son temps ; pas sur le médecin
- … › cas sûrs : Corse sur régionale et grandes lignes seulement ; en « Toutes », règle normale, égalité qui passe (30 min)
- … › cas sûrs (AC-9) : avec « Régionale » 30 min, passent Grandeville et Rhinval (sans chiffre, hors des cas sûrs)
- … › cas sûrs : population 0 (Terrebasse) ne passe aucun service, « <Service> : pas de chiffre, commune sans habitant »
- … › AC-17 scolarité : chaque niveau coché est un service filtré, avec le temps commun
- … › H160 : les raisons des services viennent après celle d'un proche, dans l'ordre médecin … gare ; espace insécable avant « : »
- … › le filtre ne note pas : sans plafond, aucune note ; sans temps chargés, aucun service ne filtre

**Playwright** (lancé à part) : 465 verts, **48 rouges**, 53 sautés, 1 non lancé (13,2 min). Tous dans `tests/e2e/services.spec.ts` :
- bureau (23) et mobile (22), mêmes tests, par ligne du fichier : l. 49 (AC-6), l. 88 (AC-7), l. 129 (R57, fichier après la carte), l. 169 (R57, fichier en erreur), l. 227 (AC-8), l. 246 (R53 page « sans plafond »), l. 256 (R57, `services` dans l'adresse), l. 327 (AC-1), l. 356 (AC-2), l. 366 (AC-3), l. 381 (AC-9), l. 414 (AC-10), l. 436 (AC-11), l. 448 (R57, catégorie inactive), l. 461 (H154), l. 496 (AC-4), l. 517 (AC-14), l. 547 (AC-17), l. 570 (H153), l. 608 (AC-15), l. 664 (R57, sans réponse), l. 703 (R57, focus) ; l. 197 (fiche longue en bureau) en bureau seulement ;
- mobile seulement, « téléphone, au toucher » : l. 726 (AC-12 390 × 844), l. 756 (pastille à moitié cachée), l. 779 (375 × 548).

**Types** (`npm run typecheck`) : 2 erreurs, toutes deux dans `src/domain/services.test.ts` (la fixture révisée a `urgences` et `supermarche`, le type `TempsServices` a encore `commerce`) ; fichier non touché par la tâche 0, entrées (`src/`, `acceptance.json`) inchangées depuis `ad386e7` : déjà là au départ, corrigées en tâche 1.

## Sources (H165) — `python3 -I scripts/data/sources.py --services`, 2026-11-26 20:15
Les 13 fichiers régionaux : « adresse, taille, SHA-1 et date égales à celles retenues (/spec) » pour chacun ; « 13 fichiers, 14451495423 octets au total = 14.45 Go (attendu 14.45) » ; « dates de mise en ligne ['2026-08-18', '2026-08-19'] » ; horaires SNCF et trajets openrouteservice : sha256 égaux à ceux retenus (jamais retéléchargés). Aucun arrêt.

## Extraction (H208) — `services-extrait.sql` avec D106
- Avant : copie de l'extrait du 2026-11-24 en `data-raw/services-carreaux-2026-11-24.csv.gz` (sha256 `1b3d4fc50bec226c8cfac5ce4cbea29d6e757da8ad4b49e595f6b375f6857dc8`).
- DuckDB 2.0.0 du dossier temporaire indiqué par le plan (présent, rien téléchargé ni installé), lancé de 20:15:30 à 20:25:11 (9 min 41 s ; place libre relue avant chaque région, de 14,5 à 19,1 Gio).
- Contrôles de l'extraction : 13 régions, 2 342 797 lignes, 34 778 codes de commune, 0 « plus d'une population », 0 « plus d'une ligne par type », 0 « dans deux régions » ; parts : 63 459 carreaux de commune sur plusieurs IRIS (6 parts au plus), 0 de populations ou de durées différentes ; population des parts 62 865 526 (une part par carreau : 55 150 992) ; 110 codes de gare nationale. Relecture : 2 342 797 lignes, 34 778 communes, avec médecin 2 342 453, **avec urgences 2 342 064**, avec gare nationale 2 327 385. Sortie : [captures/T0-extraction.txt](captures/T0-extraction.txt).
- Nouvel extrait : `data-raw/services-carreaux.csv.gz`, 116 434 488 octets, sha256 `5a901bf31caf19035cc0817fd7c244a75f36aab2bef461032a9c9cc4a3605923` (noté dans `services.py` et `CLAUDE.md`). `services-nationales.csv` réécrit à l'identique (sha256 `fbe583d5…78df`, celui de la tâche 0a).
- **Comparaison des deux extraits** ([captures/T0-comparer-extraits.txt](captures/T0-comparer-extraits.txt)) : seule colonne ajoutée `D106` ; 2 342 797 lignes comparées, **0 différente** hors D106, 0 ligne en plus d'un côté ou de l'autre.

## Contrôles de `python3 -I scripts/data/services.py` (20:26)
Sortie complète : [captures/T0-sortie-services.txt](captures/T0-sortie-services.txt). Tous « ok » :
- empreintes des 3 fichiers (extrait `5a901bf3…`, gares, trajets openrouteservice) ;
- 34 746 communes ; population 0 ; 16 îles sans pont ; Noirmoutier, Ré, Oléron ;
- 34 736 communes avec un carreau habité ; les 10 sans carreau ;
- 34 364 communes avec 3 trajets depuis la mairie ;
- retraits (D12) inchangés : `06163 commerce`, `06163 college`, `29238 creche`, `29238 college` ;
- fichier relu : 12 chaînes de 34 746 caractères, dans l'ordre `medecin, urgences, supermarche, creche, ecole, college, lycee, superieur, gare, gare_regionale, gare_grandes_lignes, commerce` ; alphabet seul ; chaque temps relu égal au temps calculé ; 34 738 communes avec au moins un temps ; Suzan et Villefranche-le-Château avec « Gare grandes lignes » seule ;
- **AC-13 révisé** (avec la valeur `commerce` d'avant, gardée tant que la chaîne provisoire est écrite) : Auch 2, 6, 2, 3, 2, 3, 3, 4, 4, 4, plus d'une heure (commerce 2) ; Bordeaux 1, 5, 1, 1, 1, 2, 2, 3, 5, 7, 7 (commerce 1) ; Mende urgences 4, supérieur 2, gare 3, régionale et grandes lignes plus d'une heure ; Saint-Véran urgences 55, supermarché 35 ; Chamonix-Mont-Blanc urgences 4, supermarché 3 ; Les Sables-d'Olonne urgences 7, grandes lignes 4 ; L'Île-d'Yeu sans chiffre pour médecin, urgences, lycée, supérieur et les trois gares, supermarché 4 (commerce 3) ; les 6 communes de population 0 sans aucun temps ;
- poids sans `commerce` sous la limite (plus bas) ;
- **comptes du supermarché égaux à ceux de mesures.md** (contrôle ajouté, arrêt sinon).

## Comptes par seuil (communes à temps inférieur ou égal ; sur le fichier servi, 34 746 communes)
| Service | ≤ 5 | ≤ 10 | ≤ 15 | ≤ 20 | ≤ 30 | ≤ 45 | ≤ 60 | au-delà | sans chiffre |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Urgences, tâche 0 | 851 | 4 025 | 9 558 | 16 243 | 27 415 | 33 676 | 34 562 | 166 | 18 |
| Urgences, essai de /spec (mesures.md) | 851 | 4 025 | 9 558 | 16 243 | 27 415 | 33 676 | 34 562 | 174 | — (34 728 avec un temps) |
| Supermarché, tâche 0 | 9 022 | 22 329 | 30 409 | 33 195 | 34 415 | 34 690 | 34 719 | 12 | 15 |
| Supermarché, mesures.md | 9 022 | 22 329 | 30 409 | 33 195 | 34 415 | 34 690 | 34 719 | 12 | 15 |

- **Urgences** : aucun écart aux seuils de 15, 30 et 45 min (tolérance de 1 % de mesures.md : rien à expliquer). L'essai de /spec ne comptait pas les parts par IRIS ; les médianes ne bougent pas d'une minute après arrondi sur ces comptes. Au-delà d'une heure : 166 ici contre 174 écrit dans mesures.md ; or mesures.md dit aussi « 34 728 communes avec un temps » et « 34 562 à 60 » : 34 728 − 34 562 = **166**, la valeur d'ici ; le 174 ne s'accorde pas avec ces deux totaux (probablement une erreur de recopie de l'essai, non vérifiable : son fichier n'existe plus). Sans chiffre : 18 = 34 746 − 34 728, comme l'essai.
- **Supermarché** : identique (même extrait, même règle), contrôlé par le script.
- Les autres services, refaits sur le fichier servi, sont dans la sortie du script ; ils n'ont pas bougé (chaînes identiques, plus bas).

## Témoins (minutes avant arrondi → valeur servie)
| Commune | Urgences, tâche 0 | Urgences, essai | Supermarché, tâche 0 | Supermarché, mesures.md |
|---|---:|---:|---:|---:|
| Paris | 4,43 → 4 | 4,4 | 1,0 → 1 | — |
| Bordeaux | 4,94 → 5 | 4,9 | 1,36 → 1 | 1,36 |
| Le Havre | 4,84 → 5 | 4,8 | 1,44 → 1 | — |
| Mende | 3,91 → 4 | 3,9 | 2,43 → 2 | 2,43 |
| Chamonix-Mont-Blanc | 4,19 → 4 | 4,2 | 2,66 → 3 | 2,66 |
| Auch | 6,10 → 6 | 6,1 | 2,47 → 2 | 2,47 |
| Les Sables-d'Olonne | 6,60 → 7 | 6,6 | 2,38 → 2 | 2,38 |
| Île-de-Bréhat | 12,39 → 12 | 12,4 | 1,0 → 1 | — |
| Saint-Véran | 55,37 → 55 | 55,4 | 34,99 → 35 | 34,99 |
| Prads-Haute-Bléone | 43,12 → 43 | 43,1 | 35,43 → 35 | — |
| Tende | 227,9 → plus d'une heure | 227,9 | 224,3 → plus d'une heure | 224,3 |
| L'Île-d'Yeu | sans chiffre | sans chiffre | 3,81 → 4 | 3,81 |

Les 10 plus grands temps d'urgences hors îles sans pont (le tableau du risque prend les 4 premiers) : Tende 227,9 ; Châteauneuf-d'Entraunes 113,15 ; Sauze 110,84 ; Saint-Dalmas-le-Selvage 108,62 ; Villeneuve-d'Entraunes 106,67 ; Saint-Martin-d'Entraunes 105,68 ; Saint-Étienne-de-Tinée 99,09 ; Isola 98,81 ; Entraunes 98,56 ; Guillaumes 92,11 — tous dans les hautes vallées des Alpes-Maritimes (Roya, Var, Tinée).

## `services.json` avant et après, chaîne par chaîne
Sortie : [captures/T0-comparer-services.txt](captures/T0-comparer-services.txt) (avant = le fichier du commit `ad386e7`).
- Mêmes 34 746 codes dans le même ordre ; `iles_sans_pont` identique.
- `medecin`, `creche`, `ecole`, `college`, `lycee`, `superieur`, `gare`, `gare_regionale`, `gare_grandes_lignes` et `commerce` : **0 caractère différent** sur 34 746 chacune.
- Nouvelles : `urgences` et `supermarche` (34 746 caractères chacune) ; `commerce` est maintenant la dernière chaîne écrite (avant `iles_sans_pont`).

## Poids de `services.json` (H206)
| Fichier | Brut | `gzip -9` | `brotli -q 3` |
|---|---:|---:|---:|
| Avant la révision (10 chaînes) | — | 304 134 | 237 929 |
| Tâche 0, servi (12 chaînes, avec `commerce`) | 695 253 | 351 117 | 283 747 |
| **Final, sans `commerce` (11 chaînes)** | 660 493 | **330 752** | **263 624** |

`gzip -9` : calculé par `services.py` (`gzip.compress(…, 9, mtime=0)`), même à 30 octets près que la commande `gzip -9 -c` (351 131 et 330 780, qui écrit en plus le nom du fichier) ; `brotli -q 3` : commande `brotli` 1.2.0 (niveau qui suit l'hébergeur, leçon du 2026-11-24). Le fichier final pèse 26,6 Ko de plus en `gzip -9` qu'avant (H206 estimait environ 20 Ko par temps ajouté, 324 Ko au total ; mesuré 331). **Sous la limite de 350 000 octets.** Le fichier servi pendant les tâches 0 et 1, avec `commerce`, est au-dessus (351 117) : c'est provisoire, la tâche 2 retire `commerce` ; le contrôle de `services.py` porte donc sur le fichier sans `commerce` et affiche l'autre poids pour information.

## Suite après la tâche 0 (2026-11-26, 20:27-20:50)
- **Vitest** (`npx vitest run`) : « Test Files 1 failed | 26 passed (27) » ; « Tests 19 failed | 437 passed (456) ». Les 19 rouges sont ceux du départ, moins « AC-5 » de `scripts/data/services.test.ts`, maintenant vert ; **aucun nouveau rouge** (comparaison des listes : seule différence, AC-5 en moins).
- **Types** : les 2 mêmes erreurs qu'au départ, dans `src/domain/services.test.ts` (non touché). **Jetons** : « 49 fichier(s), aucune valeur arbitraire ». **Construction** (`npm run build`) : « built in 1.81s ».
- **Playwright** (`npx playwright test`, 14,0 min) : 462 verts, 51 rouges, 53 sautés, 1 non lancé ; sortie : [taches/T0-playwright.txt](taches/T0-playwright.txt). Dans `services.spec.ts`, **les mêmes 48 qu'au départ** (mêmes titres, bureau et mobile). Les 3 autres, dans `proches-fiables.spec.ts` (l. 610, 628, 716, bureau : recalcul pendant une panne de l'IGN, tests de minutage), sont tombés pendant que je lisais les fichiers FINESS (113 Mo) sur la même machine ; relancés seuls, 3 fois chacun : **9 verts sur 9** (leçon du 2026-10-15 : machine saturée).
- **Page réelle** (`npm run dev`, 20:50) : `/data/services.json` servi avec les 12 chaînes (`commerce` présent, dernière) ; `/?loyer=1200&services=medecin:5` ouvre sans erreur, « 14 170 communes passent tes critères » ; la fiche de Bréménil (54097) dit « Médecin : 5 min », « Commerce alimentaire : 4 min », … « Gare grandes lignes : plus d'une heure », égal au fichier ([captures/T0-page-dev-fiche.png](captures/T0-page-dev-fiche.png)). Navigateur sans fenêtre : la carte n'y dessine pas (« La carte n'a pas pu se charger », limite connue du WebGL sans fenêtre), la liste et la fiche oui.

## Tâche 1 — réaction de la carte quand on coche « Urgences » (H163), 2026-11-26 21:17-21:19
Méthode de la tâche 3b d'origine (`docs/plans/2026-11-24-services/captures/T3b-mesure-reaction.mjs`), script copié : [captures/T1-mesure-reaction.mjs](captures/T1-mesure-reaction.mjs) ; sortie : [captures/T1-reaction.txt](captures/T1-reaction.txt). Version construite du code de la tâche 1 avant son commit (`npm run build`, servie par `npx vite preview --port 4180` ; `version.txt` dit 8042bb2, le dernier commit), vraies données (`services.json` à 12 chaînes, `commerce` ignoré), 1 440 × 900, fond uni, processeur ralenti 4 fois, rendu logiciel ; du keydown à la deuxième image après le changement d'adresse ; médiane de 15 essais par sens ; 2 tours ; charge de la machine 5,4 à 6,2. Les cases de la mer en km du script d'origine sont retirées (`mer=` n'est plus lu). Aucun Playwright lancé pendant la mesure.

| Geste | Communes qui passent | Tour 1 | Tour 2 | Écart au témoin |
|---|---:|---:|---:|---|
| Curseur du prix, un cran (témoin) | — | 176 ms | 176 ms | — |
| « 30 min » pour « Urgences » : cochée | 27 359 | 190 ms | 175 ms | + 14 / − 1 ms |
| « 30 min » pour « Urgences » : **décochée** | 34 674 | 193 ms | 193 ms | **+ 17 / + 17 ms** |
| « Ville dense » (référence de la limite) : cochée | 643 | 193 ms | 192 ms | + 17 / + 16 ms |
| « Ville dense » : décochée | 34 674 | 292 ms | 277 ms | + 116 / + 101 ms |

**Résultat : + 17 ms au plus pour les urgences, sous la limite de + 115 ms.** « Ville dense » décochée, déjà en ligne, redonne l'écart de la limite (+ 101 à + 116 ms, comme en 3b d'origine : + 114 à + 116). 27 359 communes à 30 min d'urgences ou moins avec un plafond de 1 200 € (le compte du fichier sans plafond est plus haut).

## Tâche 2 — le fichier final, sans `commerce` (2026-11-26, 22:00)
`services.py` n'écrit plus `commerce` (ni dans `TYPES`, `SERVICES`, `AC13`, `ANCIENS`) ; la ligne `06163,commerce` de `services-retraits.csv` est retirée (H209) ; le contrôle de poids porte sur le fichier écrit. Sortie entière : [captures/T2-services-py.txt](captures/T2-services-py.txt).
- Contrôles : **tous « ok »**, dont les 7 lignes d'AC-13 et les comptes du supermarché ; retraits appliqués : 3 (Tende collège, Roscanvel crèche et collège).
- Chaîne par chaîne contre le fichier du commit `0343998` (12 chaînes) : `codes`, les 11 chaînes et `iles_sans_pont` **identiques** ; seule `commerce` disparaît ([captures/T2-comparer-services.txt](captures/T2-comparer-services.txt)).

| Fichier | Brut | `gzip -9` | `brotli -q 3` |
|---|---:|---:|---:|
| **Servi après la tâche 2 (11 chaînes)** | 660 493 | **330 752** | **263 624** |

`gzip -9` : `services.py` (330 752 ; la commande `gzip -9 -c` donne 330 766, avec le nom du fichier) ; `brotli -q 3` : commande `brotli`. Égal au poids final prévu en tâche 0. **Sous la limite de 350 000 octets (H206).**
