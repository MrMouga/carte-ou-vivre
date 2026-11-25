# Tâche 0c — Le tableau de recalage (sans code du site)
Statut : faite · Début 2026-11-26 00:17 · Fin 2026-11-26 00:38 · Commits : un seul, « feat(recherche-et-mer): tâche 0c — tableau de recalage de la mer en minutes, prêt pour l'accord de Vincent » (le suivant de 65ddb54)

## Ce que l'utilisateur peut faire maintenant
Rien ne change à l'écran. Vincent peut lire, en un seul document, chaque critère et chaque test qui changent quand la mer passe en minutes, avant → après, et les valider en une fois : `docs/specs/2026-11-25-recherche-et-mer/recalage.md`. Le haut du document lui dit en mots simples ce qui change et les trois choix faits à sa place.

Les deux fichiers :
- `docs/specs/2026-11-25-recherche-et-mer/recalage.py` : un modèle des règles écrit à part du code du site (lu dans les fixtures, rien n'est recopié). Il écrit `recalage.md`. Avec `--appliquer` (jamais lancé ici), il réécrira les 7 `acceptance.json` en tâche 3b, après l'accord.
- `docs/specs/2026-11-25-recherche-et-mer/recalage.md` : le tableau, généré.

## Critères
Pas de critère pour cette tâche (plan : le contrôle du modèle tient lieu de test).

| Contrôle | Où | Résultat |
|---|---|---|
| Le modèle en km retrouve mot pour mot les textes d'aujourd'hui | `recalage.py`, `remplacer` (un texte absent arrête le script) | 93 sur 93 |
| Le modèle en minutes retrouve les valeurs de référence d'AC-6 à AC-10 de recherche-et-mer | `verifier_minutes` | 6 sur 6 |
| Aucun reste de mer en km dans les critères recalés (adresse lue en km, colonne, fiche, raison, choix) | `restes` | 0 dans les 7 tranches ; 0 dans emploi et services |
| Chaque fichier de tests repéré a sa règle | `reperer` contre `REGLES_TESTS` | 27 fichiers, 366 lignes |
| Les chiffres écrits dans les règles des tests sont recalculés | `verifier_regles` | 20 sur 20 |
| `--appliquer` ne toucherait que les lignes des critères changés (même forme de fichier) | `controle_texte` | de 5 à 34 lignes par fichier, aucune autre |

## Preuves
- `docs/specs/2026-11-25-recherche-et-mer/recalage.md` — le tableau, avec la sortie du contrôle en fin de document (2026-11-26 00:36)
- Sortie du contrôle (`python3 -I docs/specs/2026-11-25-recherche-et-mer/recalage.py`, 00:36) :
```
Correspondance des choix : 10 km → 15 min, 30 km → 30 min, 50 km → 60 min, 100 km → 90 min (candidats : {10: [15, 30], 30: [15, 30], 50: [60, 90], 100: [60, 90]})
Textes d'aujourd'hui retrouvés par le modèle en km : 93 sur 93
Valeurs de référence en minutes (AC-6 à AC-10 de recherche-et-mer) retrouvées : 6
Chiffres des règles des tests recalculés : 20
loyer-mer : 9 critères changés ; restes en km après recalage : 0 ; --appliquer changerait 27 lignes du fichier
interface-telephone : 11 critères changés ; restes en km après recalage : 0 ; --appliquer changerait 26 lignes du fichier
proches : 11 critères changés ; restes en km après recalage : 0 ; --appliquer changerait 34 lignes du fichier
cadre-de-vie : 9 critères changés ; restes en km après recalage : 0 ; --appliquer changerait 23 lignes du fichier
immobilier : 10 critères changés ; restes en km après recalage : 0 ; --appliquer changerait 27 lignes du fichier
proches-fiables : 9 critères changés ; restes en km après recalage : 0 ; --appliquer changerait 19 lignes du fichier
mairies : 2 critères changés ; restes en km après recalage : 0 ; --appliquer changerait 5 lignes du fichier
emploi : restes en km dans les critères : 0
services : restes en km dans les critères : 0
Critères changés : 61 ; moitiés exactes signalées : 4 textes, 1 cas
Fichiers de tests repérés : 27 (366 lignes), tous avec leur règle
```

**Les nombres** :
- **61 critères changés** (et non 58) : loyer-mer 9, interface-telephone 11, proches 11, cadre-de-vie 9, immobilier 10, proches-fiables 9, mairies 2. La liste de /spec en avait oublié 3 (loyer-mer AC-3, AC-5, AC-10 : « mer 50 km » ou « 10 km » sans adresse `mer=`) ; aucun n'y était à tort.
- **1 critère change de sens** : cadre-de-vie AC-9 (il testait « une ancienne valeur en km prend le choix juste au-dessus », règle supprimée par D9). Plus 3 tests hors critère pour la même raison (« R31 » de `cadre-de-vie.spec.ts`, « ancienne plage » et « toute autre valeur » de `url.test.ts`).
- **1 moitié exacte**, dans 4 textes : Portmer à 62,5 → 63 (mer 1 h, un proche à 2 h) ; proches AC-1, proches-fiables AC-3, AC-8 (cas a et d).
- **27 fichiers de tests hors critère touchés** (19 de bout en bout, 8 du domaine), 366 lignes repérées, chacun avec sa règle.
- Partout les mêmes communes passent, dans le même ordre ; les scores baissent de 1 à 12 points ; la couleur change 7 fois, jamais lue par un critère ni un test (relevé des `attendreCouleurs`).
- Les communes de test sans minutes : seulement Coin-Sud-Ouest et Coin-Nord-Est du jeu « métropole » (300 km → 300 min, « 5 h ») ; elles ne passent jamais.

## Suite de tests
- Unitaires : `Test Files  26 passed (26)` · `Tests  411 passed (411)` (aucun code ni test touché ; lancé pour s'en assurer).
- Bout en bout : non lancés (consigne : une suite tourne sur le port 4173 ; rien de testé par eux n'a changé).
- Types, construction : sans objet (aucun fichier TypeScript touché).

## Décisions prises à la place de Vincent
- Décision : la correspondance des choix 10 km → 15 min, 30 km → 30 min, 50 km → 1 h, 100 km → 1 h 30 — chaque fois deux choix en minutes gardent exactement les mêmes communes ; le plus proche du nombre de km est retenu (calculé par le script, décidé par Claude) — coût si c'est faux : d'autres scores dans les critères recalés, à recalculer par le script (une ligne).
- Décision : cadre-de-vie AC-9 est réécrit (`mer-min=90` puis `mer-min=30`, pastille cochée, adresse inchangée, scores) plutôt que retiré — il garde le seul test de « 1 h 30 » — coût si c'est faux : le passer dans « remplacés par AC-10 de recherche-et-mer », sans perte sur D9.
- Décision : cadre-de-vie AC-8 précise sa parenthèse « (`mer=200`, ancien lien, est ignoré, D9 de recherche-et-mer ; `montagne=0` n'est pas un choix) » — l'ancien texte disait que `mer=200` n'est pas un choix, ce qui reste vrai mais pour une autre raison — coût si c'est faux : garder l'ancienne parenthèse (une ligne).
- Décision : le test « empreinte qui ne correspond plus » de `proches-etats.spec.ts` garde son `communes.json` écrit à la main, sans `mer_min` ; il lira donc « 1 · Portmer (17) · 65 · 650 € · ≈ 1 min » (repli de D7) — décidé par Claude — coût si c'est faux : lui ajouter la colonne et lire « 63 · 5 min ».
- Décision : les tests du domaine qui fabriquent leurs communes depuis une fixture gagnent `merMin` (comme `carte.ts`), et ceux qui écrivent une commune à la main avec d'autres km prennent `merMin: null` (mêmes nombres, D7) — un seul monde de test, les mêmes valeurs que les critères — coût si c'est faux : des tests du domaine qui ne disent plus la même chose que les critères.
- Décision : les critères qui disent seulement « aucune distance à la mer cochée » ou « Fixe un loyer ou une distance à la mer… » ne changent pas (la spec garde les textes des états vides, D8 de cadre-de-vie) — coût si c'est faux : une réécriture de mots, sans chiffre.
- Décision : chaque description de fixture des 7 tranches gagne une phrase « Révision recherche-et-mer » (minutes de chaque commune, km servis mais plus affichés, `mer=` ignoré), comme le précédent de cadre-de-vie — coût si c'est faux : aucun sur les tests.

## Fichiers touchés hors de la liste de la tâche
Aucun (seulement `recalage.py`, `recalage.md` et ce rapport).

## Tests existants modifiés
- aucun.

## Leçons écrites
Aucune nouvelle : la leçon du 2026-10-14 (révisée le 2026-10-15) couvrait le cas et a été suivie (modèle vérifié sur l'ancien état, moitiés signalées, critères qui changent de sens nommés, repérage des tests hors critère). Elle s'est vérifiée encore : la liste faite par script en /spec en manquait 3.

## Ce qui reste (pour la suite, pas pour cette tâche)
- L'arrêt prévu du plan : Vincent valide le tableau (ou en conteste des lignes), dans le même message que l'envoi à openrouteservice de la tâche 0a.
- Tâche 3b : `python3 -I docs/specs/2026-11-25-recherche-et-mer/recalage.py --appliquer` réécrit les 7 `acceptance.json` (61 critères à `passes: false`, descriptions des fixtures, `remplaces` de proches) ; les tests suivent les règles (a) à (f) et le tableau des valeurs ; textes de D19 de proches, de CLAUDE.md et de cadre-de-vie donnés en fin de tableau. Si Vincent conteste une ligne, la modifier dans `recalage.py` et relancer (le tableau se régénère).
