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
