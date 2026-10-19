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

## Preuve
2026-10-19, 15:37-15:46 · **https://ou-vivre-en-france.narnia-assistant.workers.dev/** · push `3f9f616..9664a3b` à 15:37:37 (accord de Vincent) · `/version.txt` = **`9664a3bd598d25547d2fca39a830cf643ed92023`** à 15:38:47 · `scripts/check-live.sh` : page 200, version servie = `origin/main`, `achat.json` en `x-robots-tag: noindex`.

Vérification de bout en bout ([details.md](../../specs/2026-10-18-mairies/details.md#vérification-de-bout-en-bout)) **sur le site en ligne**, vraies données, vrai fond Plan IGN (aucun fond de secours), Chromium (Playwright), à 1 440 × 900 et 390 × 844 — script [preuve.mjs](preuve.mjs) (repris de T4, ajusté à D2 amendée), [sortie complète](captures/preuve-sortie.txt), 35 vérifications OK, 0 écart :
1. `/` devient `/?loyer=1200` ; « Vie locale » suit « Cadre de vie » ; aucune pastille cochée ; la liste est celle d'avant la tranche (relevée en ligne le 2026-10-18 sur `3f9f616`) ([bureau](captures/etape1-depart-1440x900.jpg), [390 px](captures/etape1-depart-390x844.jpg)).
2. Bordeaux : « Mairie : Centre (Union du centre) · « Faire Gagner Bordeaux » » ([bureau](captures/etape2-fiche-bordeaux-1440x900.jpg)).
3. « Sans limite » puis « Gauche » : `mairie=gauche` ; Paris, Lyon, Marseille passent (couleur neutre) ; Bordeaux « Mairie : centre, hors des mairies choisies », Nice « Mairie : extrême droite, hors des mairies choisies » ([bureau](captures/etape3-sans-limite-gauche-1440x900.jpg), [390 px](captures/etape3-sans-limite-gauche-390x844.jpg)).
4. « Sans étiquette » en plus : `mairie=gauche,sans-etiquette` ; les villages reviennent ; Val-Cenis passe, « sans étiquette (moins de 3 500 habitants) » ([bureau](captures/etape4-gauche-sans-etiquette-1440x900.jpg), [390 px](captures/etape4-gauche-sans-etiquette-390x844.jpg)).
5. La mention amendée est au pied de page ([bureau](captures/etape5-pied-de-page-1440x900.jpg), [390 px](captures/etape5-pied-de-page-390x844.jpg)).

Les 10 villes relues en ligne sur leur fiche, conformes à la démo : Paris, Lyon, Marseille, Nantes, Lille, Strasbourg à gauche ; Bordeaux au centre ; Toulouse à droite ; Nice et Perpignan à l'extrême droite ; plus Roubaix « Gauche (La France insoumise) » (captures `ville-*.jpg`). Les 10 premières de chaque bloc (6 blocs) égales à la mesure de corrections 2. À 375 × 548, le curseur du prix est visible à l'ouverture ([capture](captures/ouverture-375x548.jpg)).

Non vérifié en ligne : un vrai téléphone au doigt ; Safari ; la réaction de la carte au calme (H120).

## Revenir en arrière
- Le plus rapide : dans le tableau de bord Cloudflare, le Worker `ou-vivre-en-france` › **Deployments** › reprendre le déploiement précédent (`3f9f616`, même code que `b29757b`).
- Par git : `git revert` des commits de code de la tranche (`c8e5a7e..9bb4c44` et `05f37cc`, hors documents) puis `git push`. La tranche n'écrit rien chez l'utilisateur : rien à migrer dans un sens ni dans l'autre.

## Ce que le lancement demande encore
Voir [docs/distribution/plan.md](../../distribution/plan.md) : canal de retours ; le risque politique de la spec (outil lancé sur r/france) ; à regarder : le rang de la fiche sans espace des milliers (« 33648e »), `/favicon.ico` absent, le chevauchement des pastilles sur la carte.
