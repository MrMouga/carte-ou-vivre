# Démo — proches
2026-10-13 · /build · une session (≈ 6 h de construction, de 13:55 à 20:00)

> AC = critère d'acceptation de la spec ; Bloquant / Majeur / Mineur = gravité donnée par un relecteur neuf ; une preuve = capture ou sortie de commande, datée.
> Captures : `captures/` (constructeurs, préfixes T0 à T5, fix-clavier, corr) et `captures/qa/` (testeur neuf).

## Ce qui est construit

| Tâche | Ce que tu peux faire maintenant |
|---|---|
| 0 | (mesure) Un proche se calcule en 14 à 16 s jusqu'à 3 h, sur Mac et sur ton iPhone (14,9 s) ; l'IGN l'autorise ; la carte réagit en 24 à 41 ms avec 7 critères. Jusqu'à 6 h : 60 s et zones perdues → spec D15 (3 h au plus). |
| 1 | Replier Loyer, Mer, Taille de ville ; leur réglage reste écrit à droite du titre. |
| 2a, 2b | Chercher une adresse ou une ville, la nommer (« Parents de Léa »), « Ajouter » : après ≈ 10 à 15 s, le proche a son plafond (2 h, de 15 min à 3 h) et la carte et la liste en tiennent compte. |
| 3 | Ajouter jusqu'à 5 proches qui se calculent l'un après l'autre (« En attente… ») ; « Retirer », « Réessayer », « Effacer mes proches » ; messages (aucune adresse, recherche en panne, doublon, 5 au maximum) ; les proches reviennent tels quels quand on rouvre le site, sans recalcul. |
| 4 | Voir chaque proche sur la carte (goutte terre cuite nommée) ; en bureau, les pastilles du haut donnent le plafond, puis le temps depuis la ville choisie ; la fiche liste les temps vers chaque proche et les raisons d'un refus. |
| 5 | Sur téléphone (tests à 390 px) : « Tes proches » dans la feuille, cibles de 44 px. **Sur un vrai iPhone, le champ disparaît sous le clavier : défaut connu, reporté (ton choix).** |

**Essayer** : `npm run dev` puis http://localhost:5173 (bureau). Exemple : « 12 rue de la Paix, Nantes », nommé « Parents de Léa », plafond 2 h 30 → La Rochelle passe (« Parents de Léa : 2 h 15 en voiture ») ; Bordeaux non (« plus de 3 h »).

## Preuves

- **Tests** (2026-10-13, 19:55, relancés par l'orchestrateur) : 82 tests unitaires, 151 tests navigateur (chacun en bureau 1 440 px et à 390 px), 2 sautés (déjà sautés dans loyer-mer). Types, construction et jetons sans valeur arbitraire : OK.
- **Critères** : les 13 critères actifs passent, chacun par un test qui porte son numéro ; les 15 critères de loyer-mer passent toujours. AC-12, AC-13, AC-15 sont reportés avec la mer en minutes (D14).

| AC | Ce qui est prouvé | Passe |
|---|---|---|
| AC-1, AC-2, AC-4, AC-6 | Ajout, plafond, deux proches, proche seul sans loyer ni mer : scores 65, 67/21, 50/30, 56/0 | oui |
| AC-3, AC-5 | Fiche : raisons et temps vers chaque proche, dans l'ordre | oui |
| AC-7 à AC-11 | 5 au maximum, mémoire et réouverture, « Effacer », pannes de trajets et de recherche | oui |
| AC-14 | Nom libre « Parents de Léa », repère au bon point, le nom n'est envoyé nulle part | oui |
| AC-16 | Pastille « 2 h au plus », puis « 2 h 15 · au-dessus de 2 h », absente à 390 px | oui |

- **Bout en bout sur le vrai IGN** (version construite servie en local, profil de navigateur neuf, tâche 5) : 9,4 s en bureau, 11,8 s à 390 px ; La Rochelle 2 h 15 ; Bordeaux « plus de 3 h » ; réouverture sans aucune requête de calcul ; « Effacer » vide tout ; aucune requête ne contient « Parents de Léa ». Captures `T5-bureau-*.png`, `T5-390-*.png`, sorties `T5-preuve-*.txt`.
- **Mémoire** : 5 proches = 464 693 caractères (≈ 93 Ko chacun) ; réouverture : 0 recherche, 0 zone (`T3-preuve-ign.txt`).
- **Écrans** : `T4-la-rochelle-passe.png` (fiche, pastille), `T4-cinq-proches.png` (états des repères), `T3-plein-bureau.png`, `T3-indisponible.png`, `T1-bureau-repliees.png`.

## Décisions prises à ta place (liste complète dans `progress.md`)
Celles qui changent ce que tu vois, avec leur coût si c'est faux :
- Recherche par `/geocodage/search` de l'IGN (rend le code INSEE). Coût : ≈ 0,1 à 1,3 s par recherche.
- Une zone IGN ratée → tout le proche est « indisponible », sans nouvel essai automatique. Coût : « Réessayer » à la main (≈ 15 s).
- Proches gardés dans le navigateur (une clé par proche) ; un proche fermé avant la fin de son calcul revient « indisponible ».
- Résumé de « Tes proches » repliée : « 5 · 1 en calcul, 1 indisponible ».
- Panneau de bureau qui défile au-dessus de la légende, compte collé en bas (un trait toujours visible au-dessus du compte).
- Suggestions sur deux lignes (« 12 Rue de la Paix » / « 44000 Nantes ») ; une ville seule : « Commune · départ de la mairie ».
- Repères : étiquette à droite, à gauche si elle recouvre celle d'un proche ajouté avant ; au-dessus des ronds du top 10 ; cachés aux lecteurs d'écran (la zone et les pastilles disent tout).
- Le petit repère d'une pastille suit l'état du proche (« … », « ! ») ; Figma montre la maison partout.
- Nouveaux jetons à reporter dans Figma : `taille-goutte` 26, `taille-goutte-haut` 34, `duree-pulse-ms` 1 200, `taille-bande-carte` 40, `taille-saisie` 16.
- À 390 px, quand la feuille monte, c'est le champ qui se place en haut, pas le titre « Tes proches » (Figma 27:1160).
- Tests navigateur 2 à la fois (`workers: 2`) : la suite prend ≈ 4 min au lieu de 2 min 20, mais elle est stable.

## Relectures

| Relecture | Bloquant | Majeur | Mineur | Rapport |
|---|---|---|---|---|
| Conformité spec et code (`code-reviewer`) | 0 | 2 → 2 traités | 5 | `review-spec.md` |
| Navigateur, bureau seulement (`qa-tester`) | 0 | 0 | 4 | `qa.md` |

**Corrigé** (`taches/corrections-1.md`) : le test du délai de 45 s, instable sous charge (horloge figée, 2 tests à la fois) ; ta capture avec ton adresse, supprimée à ta demande (jamais commitée) ; le « · » de la pastille (D10) ; « Ajouter » caché par le compte quand « Aucune adresse trouvée. » s'affiche.
**Examinés, sans défaut** : « + Ajouter un proche » décalé de 4 px (c'était le contour de focus) ; curseurs qui bougent seuls (le focus reste sur un curseur après un clic, et une flèche du clavier le bouge, comme un curseur natif).
**Laissés (Mineurs)** : les flèches du clavier ne parcourent pas les suggestions (Tab puis Entrée marche) ; les preuves des tâches précèdent de quelques minutes leurs commits de code (aucun code après) ; la vérification de bout en bout réelle date d'avant le correctif clavier et la simplification (revérifiés par les tests seulement) ; AC-14 et AC-16 reformulés « sur la carte » avec ton accord.
**Laissé exprès** : le défaut iPhone (champ caché sous le clavier), reporté avec l'interface téléphone.

## Non vérifié
- Sur un vrai iPhone, l'ajout d'un proche ne marche pas (champ caché) : reporté.
- Le testeur neuf n'a pas parcouru le 390 px, ni les états « doublon », « recherche en panne », « mémoire refusée » dans le vrai navigateur (ils sont prouvés par les tests et les captures des tâches 3 et 5).
- Safari sur Mac et un vrai lecteur d'écran.
- Le site n'est pas en ligne (étape /ship).

## Coût
≈ 6 h (13:55 → 20:00). Constructeurs : tâche 0 215 k jetons, 1 104 k, 2a 176 k, 2b 300 k, 3 239 k, 4 293 k, 5 231 k, correctif clavier 160 k, simplification 105 k, corrections 173 k ; relecteurs : spec 152 k, navigateur 83 k — ≈ 2,2 M jetons. Détours : une condition d'arrêt en tâche 0 (6 h → 3 h, D15, D16) ; AC-14 et AC-16 mal recalés après D15 (erreur de l'orchestrateur, reformulés) ; un correctif clavier iPhone sans effet ; un test instable corrigé après les relectures.
