# Mise en ligne — emploi
2026-11-23 · Ambition : perso · Hébergeur : **Cloudflare Workers** (site statique servi par un Worker, gratuit), branché sur le dépôt GitHub `MrMouga/carte-ou-vivre` : un push sur `main` met en ligne · Adresse : **https://ou-vivre-en-france.narnia-assistant.workers.dev/** · Commit à mettre en ligne : `cfbe641` (et la note de mise en ligne qui suit) · En ligne avant : `92d9d7d` (même code que mairies, `9664a3b`, plus 4 commits de documents) · Coût : 0 €

Tranches servies après ce push : loyer-mer, proches, interface-telephone, immobilier, cadre-de-vie, proches-fiables, mairies, **emploi** ([démo acceptée](../../plans/2026-11-21-emploi/demo.md)).

## Liste de contrôle avant la mise en ligne
- [x] **Construction depuis un clone neuf** (2026-11-23 10:00) : `git clone` dans un dossier vide, `npm ci`, `npm run build` vert ; `dist/version.txt` = `cfbe641bf2823b403a28c5d5abb2f3644f8dc037` ; `dist/data/emploi.json` présent (1 496 506 octets).
- [x] **Tests, types, build** : suite complète relancée par l'orchestrateur le 2026-11-22 à 16:47 sur `efc0a9f`, le dernier commit de code ; depuis, seuls des documents ont changé (`git diff efc0a9f..cfbe641 -- src tests scripts public package.json package-lock.json .npmrc` vide). Résultats : Vitest 365 / 365 ; Playwright 423 verts, 44 sautés (tests réservés à une autre largeur), **0 rouge** ; types et build verts ; aucune valeur de design en dur.
- [x] **Aucun secret** dans le dépôt ni son historique : `gitleaks detect` (outil gratuit qui cherche des clés) : 452 commits, « no leaks found ». Aucun fichier `.env`.
- [x] **Paquets** : aucun n'a changé depuis la version en ligne (`package.json`, `package-lock.json`, `.npmrc` identiques à `9664a3b`) ; lockfile versionné.
- [~] **Failles connues des paquets** (`npm audit`, nouveau depuis mairies, à paquets égaux) : 1 haute, dans **Vite 8.3.0-8.3.2** (son module `launch-editor` : avis GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw, GHSA-587h-7wmj-h5pm). Elle touche seulement le serveur de développement sur la machine, pas le site servi : `npm audit --omit=dev` → « found 0 vulnerabilities ». **Non bloquant.** À faire plus tard, avec ton accord (changement de version d'un paquet) : monter Vite.
- [x] **Marqueur de version** : `/version.txt` donne le commit construit (sans lui, pas de preuve).
- [x] **Fichiers** : 9 384 fichiers dans `public/` (1 de plus : `emploi.json`, 1,5 Mo, 165 Ko en brotli), sous la limite de 20 000 d'un Worker.
- [x] **Non-indexation d'`achat.json`** (D9 d'immobilier) : vérifiée par `scripts/check-live.sh` après le push.
- [x] **Vie privée** : aucune mesure d'audience ; les métiers choisis vont dans l'adresse de la page (D9 : coût accepté, le lien dit tes métiers) et nulle part ailleurs ; aucun appel à un service extérieur (l'emploi est un fichier du site).
- [x] **Mentions** : le pied de page cite « Projets de recrutement et bassins d'emploi : France Travail, enquête Besoins en main-d'œuvre 2026 (table des bassins mise à jour le 17/04/2026) » et « Chômage : Insee, taux de chômage localisés par zone d'emploi, 2e trimestre 2026 » (H143 amendée : la table des bassins n'a pas de licence écrite, ton choix est de s'en servir en citant sa date).
- [x] **Test en ligne à jouer** : la [vérification de bout en bout](../../specs/2026-11-21-emploi/details.md#vérification-de-bout-en-bout), étapes 1 à 6, en bureau et à 390 px (l'étape 7, l'iPhone, a été faite par toi à la démo sur la version construite).

## Ce que cette mise en ligne couvre, et ce qu'elle ne couvre pas
- Couvre : la catégorie « Emploi » (jusqu'à deux métiers, niveaux « Partout » · « Beaucoup » · « Le plus »), le filtre à 30 km d'une ville principale, les lignes des métiers et du chômage dans chaque fiche, les deux mentions au pied de page.
- Ne couvre pas : pas de nom de domaine, de mesure d'audience ni de canal de retours (voir [docs/distribution/plan.md](../../distribution/plan.md)). Le risque noté dans la spec reste : une carte jugée fausse sur un métier rare (phrase « peu chiffré » sous 96 métiers sur 217).
