# Tâche 0a — Codes postaux, et calcul des minutes préparé
Statut : faite · Début 2026-11-25 23:42 · Fin 2026-11-26 00:17 · Commits : 420aa85 (la tâche) et le commit suivant (ce numéro dans le rapport)

## Ce que l'utilisateur peut faire maintenant
Rien de visible encore à l'écran : la tâche prépare les données.
- **Les codes postaux sont servis** : `public/data/codes-postaux.json` relie 6 051 codes postaux aux 34 746 communes de la carte. Aucune commune n'est sans code, et le fichier pèse 110 Ko compressé (limite : 200 Ko). « 33000 » donne Bordeaux, « 75015 » donne Paris. La tâche 2 s'en servira pour la recherche par code.
- **Le calcul des temps jusqu'à la mer est prêt** : 92 requêtes à openrouteservice, un seul jour de quota (limite : 500). Rien n'est envoyé. Vincent lance l'envoi : d'abord un lot d'essai, puis le reste (commandes plus bas).

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-13 (morceau a : rattachement des arrondissements) | `scripts/data/codes_postaux.test.ts` · « AC-13 (morceau a) : une ligne de La Poste qui rattache 75015 à l'arrondissement 75115 sort "75015": ["75056"] (Paris) » | vert. Vérifié aussi sur le vrai fichier : `"75015": ["75056"]` |
| AC-13 (morceau b) | tâche 2 | — |

Autres tests ajoutés (sans critère, sortie 5 du plan) :
- `scripts/data/codes_postaux.test.ts` (7 de plus) : Lyon et Marseille ; outre-mer et Monaco écartés ; une commune absente de la carte n'est pas écrite ; recalage en avant (ancien code) ; recalage en arrière (commune créée en 2026 ; fusion de 2026 qui garde le code de l'une) ; un mouvement d'avant 2025 ne recale rien.
- `scripts/data/mer_minutes.test.ts` (6) :
  - formation des lots : aucun lot au-delà de 3 500 trajets, chaque commune une fois, vers son propre point, un point jamais coupé entre deux lots ;
  - un point de 7 100 communes coupé en lots de 3 500, 3 500 et 100 ;
  - reprise : un lot déjà écrit n'est pas renvoyé ; lot d'essai seul avec `--essai`, puis plus du tout ; un lot écrit avec d'autres communes arrête tout ;
  - envoi sur un **faux service local** (aucune requête à openrouteservice) : un lot refusé est refait une fois puis noté en échec ; une réponse 429 attend sans compter d'essai ; la clé n'apparaît ni dans la sortie ni dans le fichier ; relancé, rien n'est renvoyé.

Les tests ont été écrits juste après le code, pas avant : ils sont passés au premier lancement. Leurs valeurs attendues sont précises (par exemple `{"75015": ["75056"]}` sur une carte qui ne contient que 75056 : sans le rattachement, la sortie serait vide). Je n'ai pas fait d'essai rouge à part.

## Preuves
- `docs/plans/2026-11-25-recherche-et-mer/mesure-tache-0.md` — licence et date de la base de La Poste, sortie complète des contrôles de `codes_postaux.py`, poids `brotli -q 3`, sortie de `mer_minutes.py --preparer`, rayon et bacs d'après la documentation et le code d'openrouteservice, la commande de Vincent (2026-11-25 23:44 à 23:58).
- `mer-km.csv` relu identique (2026-11-25, vers 23:50) : `mer.py` relancé après le changement, `cmp` avec la copie d'avant : identique ; sha256 `f648420ba9f02759ac57f5e7f69ee4f7f40ec9d2be282792a5a9ff0f34f54db8` avant et après. Et `--preparer` relit les km de chaque point contre `mer-km.csv` : 0 différent sur 34 746.
- Fichier servi relu (23:58) : `33000 → ['33063']`, `75015 → ['75056']`, `69001 → ['69123']`, `13008 → ['13055']`, `01300` → 22 communes ; `brotli -c -q 3 public/data/codes-postaux.json | wc -c` → 109 738 octets ; présent dans `dist/data/` après `npm run build`.
- Envoi à blanc sur les vrais lots (sans réseau, sans lire la clé) : « 91 lots préparés, 0 déjà écrits, 91 à envoyer (34746 communes) » ; avec `--essai` : `{"a_envoyer": ["essai"], "requetes": 1}`.

## Suite de tests
- Unitaires (`npm run test:unit`) : `Test Files  26 passed (26)` · `Tests  411 passed (411)` (397 au départ de la tranche, + 8 + 6).
- Types (`npm run typecheck`) : `tsc --noEmit -p .` sans erreur (les tests de `scripts/` sont couverts).
- Construction (`npm run build`) : `✓ built in 4.93s`.
- Bout en bout (`npm run test:e2e`, port 4173 libre vérifié avant) : `48 skipped` · `473 passed (17.7m)`, comme au départ de la tranche (473 verts, 48 sautés).

## Décisions prises à la place de Vincent
- Décision : rayon d'accroche = celui du service, aucun paramètre envoyé — la matrice d'openrouteservice n'a pas de paramètre de rayon (code de la requête) ; le réglage du serveur vaut 2 000 m par défaut (documentation de configuration), la valeur du service hébergé n'est pas publiée ; la distance d'accroche réelle de chaque point est gardée dans la réponse et sera comptée en 0b — coût si c'est faux : un rayon hébergé plus petit donne plus de communes sans temps, compté en 0b (arrêt au-delà de 2 %).
- Décision : les bacs restent — les écarter fait passer la matrice à 25 trajets par requête (au moins 1 390 requêtes, près de trois jours de quota) ; Blaye entre au tableau de crédibilité de 0b (le plan le prévoyait dans ce cas) — coût si c'est faux : une commune en face d'un bac peut avoir un temps plus court que par la route ; le tableau de crédibilité et D8 (retrait) le rattrapent.
- Décision : la commune des Landes du lot d'essai est **Mont-de-Marsan** (40192), « décidé par Claude » — la préfecture, connue, dont le point de côte est sur la côte landaise (dunes, forêt), là où une route peut manquer : l'essai teste l'accroche là où elle risque d'échouer — coût si c'est faux : aucun, une requête.
- Décision : un lot en échec n'est noté qu'après qu'un lot suivant a réussi ; trois lots de suite en échec arrêtent l'envoi sans les noter — sinon une panne du service ou une coupure d'internet rendrait « sans temps » des communes qui n'ont rien de spécial (H196 vise l'échec d'un calcul, pas une panne) — coût si c'est faux : un lot qui échoue à chaque relance, s'il est l'un des trois derniers d'une série, est réessayé à chaque relance ; Vincent le voit dans la sortie.
- Décision : 200 Ko comptés en 1 000 octets (le plus strict) — le fichier pèse 109 738 octets, loin des deux lectures — coût si c'est faux : aucun.
- Décision : `sources.py --codes-postaux` télécharge ce seul fichier (comme `--services`), et relit la licence sur data.gouv.fr **et** sur data.laposte.fr ; il vérifie aussi que le fichier téléchargé est celui que La Poste décrit (même md5) — le plan demande « licence relue et datée » ; deux sites qui disent la même licence valent mieux qu'un — coût si c'est faux : aucun.
- Décision : pas de liste à part des communes avec plusieurs codes ni des lieux-dits (colonne `Ligne_5` non lue) — R58 ne cherche que par code — coût si c'est faux : aucun pour cette tranche.

## Fichiers touchés hors de la liste de la tâche
- `docs/solutions/2026-11-25-openrouteservice-matrice-sans-rayon-ni-bacs.md` (nouveau) et `docs/solutions/README.md` (index régénéré par le crochet) — leçon écrite (le comportement d'openrouteservice n'est pas dans sa documentation d'API). Copie dans `~/.claude/studio/solutions/` (hors dépôt), index régénéré.
- `docs/plans/2026-11-25-recherche-et-mer/taches/T0a.md` — ce rapport.
- Hors dépôt, non versionnés : `data-raw/laposte-hexasmal.csv` et son `.info.json`, `data-raw/mer-calcul/lots.json`, `data-raw/mer-km.csv` (réécrit, identique).

## Tests existants modifiés
- aucun.

## Leçons écrites
- `docs/solutions/2026-11-25-openrouteservice-matrice-sans-rayon-ni-bacs.md` — la matrice n'a aucun rayon à régler ; écarter les bacs la fait tomber à 25 trajets par requête ; un point non accroché revient `null` sans faire échouer la requête. Copiée dans `~/.claude/studio/solutions/`.
- Constat sans leçon à part (la leçon du 2026-11-21 couvre déjà le geste) : la base de La Poste du 17/11/2026 est exactement sur le COG 2025, et le COG 2026 n'a ni fusion ni création (année des municipales). Le recalage dans les deux sens est écrit et testé, mais ne s'applique à aucun code.

## Ce que Vincent devra lancer (arrêt prévu après la tâche 0c)
Depuis `/Users/mouga/git-repository/carte-ou-vivre` :
1. Le lot d'essai (une requête) : `python3 -I scripts/data/mer_minutes.py --envoyer --essai`. La sortie donne le temps de Bordeaux, Caen et Mont-de-Marsan, la distance d'accroche de chaque bout, et « part de null : k sur 3 trajets ». Si les trois ont un temps : étape 2. Sinon, copier la sortie à Claude.
2. Tous les lots (91 requêtes, un seul jour de quota) : `python3 -I scripts/data/mer_minutes.py --envoyer`. Relancer la même commande s'il s'arrête ; ne plus la relancer une fois « TERMINÉ » affiché.

Durée : au moins 2 à 3 min au débit permis ; le temps de calcul d'une requête n'est pas connu (le lot d'essai l'affiche) ; *estimation de Claude* : environ 30 min si une requête prend 20 s.
