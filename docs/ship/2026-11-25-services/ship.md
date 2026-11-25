# Mise en ligne — services
2026-11-25 · Ambition : perso · Hébergeur : **Cloudflare Workers** (site statique servi par un Worker, gratuit), branché sur le dépôt GitHub `MrMouga/carte-ou-vivre` : un push sur `main` met en ligne · Adresse : **https://ou-vivre-en-france.narnia-assistant.workers.dev/** · Commit à mettre en ligne : `15cdc69` (et la note de mise en ligne qui suit) · En ligne avant : `ed6e597` (emploi) · Coût : 0 €

Tranches servies après ce push : loyer-mer, proches, interface-telephone, immobilier, cadre-de-vie, proches-fiables, mairies, emploi, **services** ([démo acceptée](../../plans/2026-11-24-services/demo.md)).

## Liste de contrôle avant la mise en ligne
- [x] **Construction depuis un clone neuf** (2026-11-25 00:41) : `git clone` dans un dossier vide, `npm ci`, `npm run build` verts ; `dist/version.txt` = `15cdc691625fccce2cbf54ef8d7846c13c77a73e` ; `dist/data/services.json` (625 730 octets) et `dist/data/gares-grandes-lignes.csv` présents.
- [x] **Tests, types, build** : suite complète relancée par l'orchestrateur sur `e912ae3`, le dernier commit de code (simplification) : Vitest 397 / 397 ; Playwright 473 verts, 48 sautés (tests réservés à une autre largeur), **0 rouge** ; types et build verts ; aucune valeur de design en dur. Depuis, seules la table des retraits (`scripts/data/services-retraits.csv`, 4 lignes) et les données produites (`public/data/services.json`) ont changé : Vitest relancé, 397 / 397 ; les tests du navigateur ne lisent jamais le vrai fichier des temps. Tests du téléphone et des proches instables quand la machine est chargée : verts relancés seuls (voir [progress.md](../../plans/2026-11-24-services/progress.md)).
- [x] **Aucun secret** dans le dépôt ni son historique : `gitleaks detect` (outil gratuit qui cherche des clés) : 502 commits, « no leaks found ». Aucun fichier `.env`.
- [x] **Paquets** : aucun n'a changé depuis la version en ligne (`package.json`, `package-lock.json`, `.npmrc` identiques à `ed6e597`) ; lockfile versionné ; `npm audit --omit=dev` : « found 0 vulnerabilities » (la faille connue de Vite ne touche que le serveur de développement).
- [x] **Marqueur de version** : `/version.txt` donne le commit construit.
- [x] **Fichiers** : 9 386 fichiers dans `public/` (2 de plus : `services.json`, 626 Ko, ≈ 238 Ko tels que le site les envoie ; `gares-grandes-lignes.csv`, 3 Ko), sous la limite de 20 000 d'un Worker.
- [x] **Non-indexation d'`achat.json`** (D9 d'immobilier) : vérifiée par `scripts/check-live.sh` après le push.
- [x] **Vie privée** : aucune mesure d'audience ; les services choisis vont dans l'adresse de la page (`services=…`, comme les autres critères) et nulle part ailleurs ; aucun appel à un service extérieur (les temps sont un fichier du site, demandé après l'affichage de la carte).
- [x] **Mentions** : le pied de page cite « Temps d'accès aux services : Insee, base permanente des équipements, distancier Metric-OSRM, © les contributeurs d'OpenStreetMap et du projet OSRM (équipements 2025) » (Licence Ouverte) et « Gares grandes lignes : horaires SNCF (licence ODbL), temps depuis la mairie calculés avec openrouteservice, © OpenStreetMap contributors » ; la liste des 61 gares est servie sous ODbL (`/data/gares-grandes-lignes.csv`, H172).
- [x] **Test en ligne à jouer** : la [vérification de bout en bout](../../specs/2026-11-23-services/details.md#vérification-de-bout-en-bout), étapes 1 à 7, en bureau et à 390 px.

## Ce que cette mise en ligne couvre, et ce qu'elle ne couvre pas
- Couvre : la catégorie « Services » (médecin, commerce alimentaire, scolarité à 5 niveaux, gare « Toutes · Régionale · Grandes lignes ») qui filtre sans noter ; les 10 temps de chaque fiche, avec leurs limites ; le chargement des temps après la carte, son erreur et « Réessayer » ; les deux mentions au pied de page ; les 4 temps retirés à la démo (Tende, Roscanvel ; D12).
- Ne couvre pas : pas de nom de domaine, de mesure d'audience ni de canal de retours (voir [docs/distribution/plan.md](../../distribution/plan.md)). Connu et laissé : le pied de page de 7 lignes en bureau, qui couvre le bas de la carte (QA, Moyen) ; décocher un filtre qui recolore toute la carte coûte autant que « Ville dense » (chantier noté).

## Preuve
2026-11-25, 00:53-00:58 · **https://ou-vivre-en-france.narnia-assistant.workers.dev/** · push `ed6e597..210ef59` à 00:53:19 (accord de Vincent) · `/version.txt` = **`210ef59d028216f9d4378fc040bd0dad414fd524`** à 00:54:39 · `scripts/check-live.sh` : page 200, version servie = `origin/main`, `achat.json` en `x-robots-tag: noindex` · `/data/services.json` envoyé en 234 424 octets (brotli).

Vérification de bout en bout ([details.md](../../specs/2026-11-23-services/details.md#vérification-de-bout-en-bout)) **sur le site en ligne**, vraies données, vrai fond Plan IGN, Chromium (Playwright, WebGL logiciel), à 1 440 × 900 à la souris et 390 × 844 au toucher, de 00:54:56 à 00:58:28 — script [preuve.mjs](preuve.mjs) (celui de la tâche 4, lancé avec `BASE=` l'adresse en ligne) — sortie complète : [preuve-sortie.txt](preuve-sortie.txt) :
1. `/` devient `/?loyer=1200` ; « Services » suit « Tes proches », rien de coché ; fiche d'Auch : Médecin 2 min, Commerce alimentaire 2, Crèche 3, École 2, Collège 3, Lycée 3, Supérieur 4, Gare 4, Gare régionale 4, Gare grandes lignes plus d'une heure, et la phrase des limites ([390 px](captures/T4-e1-auch-390x844.png)).
2. « Sans limite », « 10 min » pour « Médecin » : `services=medecin:10` ; Bordeaux et Mende passent.
3. « École », « Collège », « 20 min » : `ecole:20,college:20`.
4. « 30 min » pour « Gare », « Régionale » : `gare-regionale:30` ; Mende écartée, « Gare régionale plus d'une heure : au-dessus de ton plafond de 30 min » ; Ajaccio écartée, « Gare régionale : aucune en Corse ».
5. L'Île-d'Yeu : « Médecin : pas de chiffre », « Gare : aucune sur l'île », phrase de la traversée ([390 px](captures/T4-e5-ile-d-yeu-390x844.png)).
6. Adresse dans un nouvel onglet : mêmes réglages, en bureau et à 390 px.
7. Les deux mentions au pied de page, aux deux largeurs.
En plus : erreur des temps et « Réessayer » (bureau) ; 375 × 548, curseur du prix entier. Le script compte aussi, parmi les « raisons », les lignes du bloc des temps qui disent « aucune » ou « pas de chiffre » (défaut connu du script, pas de la page : une seule raison affichée pour Ajaccio). Captures : [captures/](captures/).

Non vérifié en ligne : un vrai téléphone au doigt ; Safari ; un lecteur d'écran.

## Revenir en arrière
- Le plus rapide : dans le tableau de bord Cloudflare, le Worker `ou-vivre-en-france` › **Deployments** › reprendre le déploiement précédent (`ed6e597`, emploi).
- Par git : `git revert` des commits de code et de données de la tranche (de `033b44e` à `2f19784`, hors documents) puis `git push`. La tranche n'écrit rien chez l'utilisateur ; une adresse avec `services=` ouverte sur l'ancienne version est simplement ignorée.
