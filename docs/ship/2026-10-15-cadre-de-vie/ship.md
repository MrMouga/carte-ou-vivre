# Mise en ligne — cadre-de-vie (et immobilier, jamais vérifié en ligne)
2026-10-15 · Ambition : perso · Hébergeur : **Cloudflare Workers** (site statique servi par un Worker, gratuit), branché sur le dépôt GitHub `MrMouga/carte-ou-vivre` : un push sur `main` met en ligne · Adresse : **https://ou-vivre-en-france.narnia-assistant.workers.dev/**

Les mises en ligne du [2026-10-13](../2026-10-13-loyer-mer-proches/ship.md) et du [2026-10-14](../2026-10-14-interface-telephone/ship.md) n'ont pas de preuve : elles visaient `ou-vivre-en-france.pages.dev`, qui n'existe pas (« Could not resolve host » le 2026-10-15). Vincent a créé le site comme **Worker**, à l'adresse ci-dessus. Le 2026-10-15 à 23:56, elle sert `aac426c` (immobilier, dernier commit poussé), et `/data/achat.json` porte bien `x-robots-tag: noindex`.

Tranches servies après ce push : loyer-mer, proches, interface-telephone, immobilier, **cadre-de-vie** ([démo acceptée](../../plans/2026-10-15-cadre-de-vie/demo.md)).

## Liste de contrôle avant la mise en ligne
- [x] **Construction depuis un clone neuf** (2026-10-15 23:57) : `git clone` dans un dossier vide, `npm ci` sans erreur (« found 0 vulnerabilities »), `npm run build` vert ; `dist/version.txt` = `5b132e6`. Cela prouve aussi que **chaque paquet existe sur npm** et que le fichier des versions figées (lockfile) est complet.
- [x] **Tests, types, build** : suite complète relancée par l'orchestrateur à 23:51 sur `b4036d9` (202 unitaires, 298 navigateur verts, 1 échec instable vert 3/3 en relance) ; depuis, seuls des documents ont changé.
- [x] **Aucun secret** dans le dépôt ni son historique : `gitleaks detect` (outil gratuit qui cherche des clés) sur 291 commits : « no leaks found ». `.env*` est ignoré par git ; aucun fichier `.env`.
- [x] **Marqueur de version** : `/version.txt` donne le commit construit (sans lui, pas de preuve).
- [x] **Fichiers** : 9 381 fichiers dans `public/` (sous la limite de 20 000 d'un Worker), le plus gros 3,2 Mo (`communes.json`), sous la limite de 25 Mo par fichier.
- [x] **Non-indexation d'`achat.json`** (D9 d'immobilier) : en place en ligne (vérifiée ci-dessus) ; à revérifier après ce push.
- [x] **Vie privée** : aucune mesure d'audience ; les adresses des proches restent dans le navigateur (tranche proches) ; la recherche d'adresse et les trajets passent par l'IGN.
- [x] **Test en ligne à jouer** : la vérification de bout en bout de [details.md](../../specs/2026-10-14-cadre-de-vie/details.md#vérification-de-bout-en-bout), étapes 1 à 5, en bureau et à 390 px.

## Ce que cette mise en ligne couvre, et ce qu'elle ne couvre pas
- Couvre : les cinq tranches construites, sur l'adresse du Worker.
- Ne couvre pas : un nom de domaine, une mesure d'audience, un canal de retours (voir [docs/distribution/plan.md](../../distribution/plan.md)) ; **le calcul des trajets peut échouer quand l'IGN est dégradé** (502/504 vus le 2026-10-15 au soir, voir la démo) — fragilité connue de la tranche proches.
- À corriger dans les documents : `CLAUDE.md` et les notes précédentes parlent de Cloudflare **Pages** ; c'est un **Worker**.

## Preuve
2026-10-16, 00:00-00:04 · **https://ou-vivre-en-france.narnia-assistant.workers.dev/** · push `aac426c..56ac3d6` à 23:59 (accord de Vincent) · `/version.txt` = **`56ac3d6dfe339e810d1afda7fb4d8960de752902`** à 00:00:55 · `/data/achat.json` : `x-robots-tag: noindex` (vérifié avant et après le push).

Vérification de bout en bout ([details.md](../../specs/2026-10-14-cadre-de-vie/details.md#vérification-de-bout-en-bout), étapes 1 à 5), sur le vrai site, vraies données, Chromium (Playwright, rendu WebGL logiciel), à **1 440 × 900 et 390 × 844** — sortie complète : [captures/preuve-en-ligne.txt](captures/preuve-en-ligne.txt) :
1. `/` → `/?loyer=1200` ; mer, montagne, tailles, types : rien de coché ; 34 674 communes ([e1-depart-1440](captures/e1-depart-1440.png), [e1-depart-390](captures/e1-depart-390.png)).
2. `/?loyer=1350&montagne=10` : 8 958 communes ; fiche de Chamonix-Mont-Blanc : 51, « Commune de montagne » ([e2-chamonix-1440](captures/e2-chamonix-1440.png)) ; fiche de Bordeaux : « Montagne 173 km : au-dessus de ton plafond de 10 km ».
3. `/?loyer=1350&env=ville-dense` : « Ville dense » coché, 676 communes ; Bordeaux passe (38, 352e) ; Lacanau ne passe pas : « Environnement : bourg et village, hors des types choisis » ([e3-lacanau-1440](captures/e3-lacanau-1440.png)).
4. `/?loyer=1200&mer=60` → `/?loyer=1200&mer=100`, identique après rechargement.
5. Fiche de Bordeaux : « Ville dense · 268 000 habitants », 39 km de la mer, 173 km de la montagne ; pied de page : grille de densité Insee et « Zone de montagne : Cerema » ([e5-bordeaux-1440](captures/e5-bordeaux-1440.png), [e5-bordeaux-390](captures/e5-bordeaux-390.png)).

Écart avec la démo, expliqué : à l'étape 2, 8 958 communes en ligne contre 8 949 en tâche 5 : la distance à la mer et à la montagne n'est plus arrondie deux fois depuis les corrections 1 et 2.

Non vérifié en ligne : le calcul des trajets des proches (l'IGN renvoyait des 502/504 le 2026-10-15 au soir, voir la démo) ; le toucher sur un vrai téléphone.

## Revenir en arrière
- Le plus rapide : dans le tableau de bord Cloudflare, le Worker `ou-vivre-en-france` › **Deployments** › reprendre le déploiement précédent (`aac426c`).
- Par git : `git revert <commits>` puis `git push` (le Worker se reconstruit tout seul).

## Ce que le lancement demande encore
Voir [docs/distribution/plan.md](../../distribution/plan.md) : canal de retours, et la robustesse du calcul des trajets (pistes dans la démo de cadre-de-vie) avant d'inviter des inconnus à entrer l'adresse de leurs proches.
