# Mise en ligne — mairies
2026-10-19 · Ambition : perso · Hébergeur : **Cloudflare Workers** (site statique servi par un Worker, gratuit), branché sur le dépôt GitHub `MrMouga/carte-ou-vivre` : un push sur `main` met en ligne · Adresse : **https://ou-vivre-en-france.narnia-assistant.workers.dev/** · Commit à mettre en ligne : `79ef358` et le commit de cette note (49 commits depuis `3f9f616`, le dernier poussé) · Coût : 0 €

Tranches servies après ce push : loyer-mer, proches, interface-telephone, immobilier, cadre-de-vie, proches-fiables, **mairies** ([démo acceptée](../../plans/2026-10-18-mairies/demo.md)).

## Liste de contrôle avant la mise en ligne
- [x] **Construction depuis un clone neuf** (2026-10-19 15:31) : `git clone` dans un dossier vide, `npm ci` sans erreur (« found 0 vulnerabilities »), `npm run build` vert ; `dist/version.txt` = `79ef358`. Aucun paquet n'a changé depuis la version en ligne (`package.json`, `package-lock.json`, `.npmrc` identiques à `b29757b`) : chaque paquet existe déjà sur npm.
- [x] **Tests, types, build** : suite complète relancée par l'orchestrateur à 14:30 sur `dadeee7`, après le dernier commit de code (`05f37cc`) : Vitest 315 / 315 ; Playwright 381 verts, 38 sautés (tests réservés à une autre largeur), **0 rouge** ; types et build verts ; aucune valeur de design en dur. Depuis, seuls des documents ont changé. Le test instable de cadre-de-vie est corrigé (corrections 1 de la tranche).
- [x] **Aucun secret** dans le dépôt ni son historique : `gitleaks detect` (outil gratuit qui cherche des clés) : « no leaks found ». Aucun fichier `.env`.
- [x] **Marqueur de version** : `/version.txt` donne le commit construit (sans lui, pas de preuve).
- [x] **Fichiers** : 9 383 fichiers dans `public/` (2 de plus : `mairies.json`, 1,5 Mo, et `nuances.json`), sous la limite de 20 000 d'un Worker.
- [x] **Non-indexation d'`achat.json`** (D9 d'immobilier) : vérifiée par `scripts/check-live.sh` après le push.
- [x] **Vie privée** : aucune mesure d'audience ; la tranche n'ajoute aucune donnée de l'utilisateur ni aucun appel à un service extérieur (les mairies sont un fichier du site).
- [x] **Mentions** : le pied de page cite les résultats (ministère de l'Intérieur) et les blocs (circulaire du 2 février 2026), avec l'écart décidé à la démo (« sauf l'extrême gauche (dont La France insoumise), rangée à gauche »).
- [x] **Test en ligne à jouer** : la [vérification de bout en bout](../../specs/2026-10-18-mairies/details.md#vérification-de-bout-en-bout), étapes 1 à 5, en bureau et à 390 px, plus les 10 villes connues.

## Ce que cette mise en ligne couvre, et ce qu'elle ne couvre pas
- Couvre : le filtre « Mairie élue en 2026 » (catégorie « Vie locale », 6 pastilles), la ligne « Mairie » de chaque fiche, la mention au pied de page.
- Ne couvre pas : pas de nom de domaine, de mesure d'audience ni de canal de retours (voir [docs/distribution/plan.md](../../distribution/plan.md)). Le risque noté dans la spec reste : de la politique dans un outil lancé sur r/france.
