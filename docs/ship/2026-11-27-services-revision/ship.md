# Mise en ligne — services, révision D19, D20 (urgences, supermarché)
2026-11-27 · Ambition : perso · Hébergeur : **Cloudflare Workers** (site statique servi par un Worker, gratuit), branché sur le dépôt GitHub `MrMouga/carte-ou-vivre` : un push sur `main` met en ligne · Adresse : **https://ou-vivre-en-france.narnia-assistant.workers.dev/** · Coût : 0 €

Avant ce push, le site servait `d94f05e` (recherche-et-mer, poussé le 2026-11-26 après sa démo, sans note /ship). Ce push ajoute la révision des services ([démo acceptée](../../plans/2026-11-26-services-revision/demo.md)) : « Urgences » et « Supermarché » dans « Services », une fiche à 11 temps, et les anciens liens `commerce` ignorés.

## Liste de contrôle avant la mise en ligne
- [x] **Construction depuis un clone neuf** (2026-11-27 12:33) : `git clone` dans un dossier vide, `npm ci`, `npm run build` verts ; `dist/version.txt` = `ee0f48fa3d71ed7dde8c4b2b611c541312c8d4a8` ; `dist/data/services.json` : 660 493 octets.
- [x] **Tests, types, build** : suite complète relancée par l'orchestrateur sur `2189131`, le dernier commit de code et de données (retouches de la démo), à 12:31 : Vitest 462 / 462 ; Playwright 520 verts, 53 sautés (tests réservés à une autre largeur), **0 rouge** ; types, jetons et build verts. Les commits suivants ne touchent que des documents.
- [x] **Aucun secret** dans le dépôt ni dans son historique : `gitleaks detect` (outil gratuit qui cherche des clés) : « no leaks found ». Aucun fichier `.env`.
- [x] **Paquets** : aucun n'a changé depuis la version en ligne (`package.json`, `package-lock.json` et `.npmrc` sont identiques à `d94f05e`) ; le lockfile est versionné.
- [x] **Marqueur de version** : `/version.txt` donne le commit construit.
- [x] **Fichiers** : 9 387 fichiers dans `public/`, sous la limite de 20 000 d'un Worker ; `services.json` pèse 330 764 octets en `gzip -9` (limite de la spec : 350 000, H206).
- [x] **Non-indexation d'`achat.json`** (D9 d'immobilier) : vérifiée par `scripts/check-live.sh` après le push.
- [x] **Vie privée** : aucune mesure d'audience ; les services choisis vont dans l'adresse de la page (`services=…`) et nulle part ailleurs ; aucun appel à un service extérieur de plus.
- [x] **Mentions** : inchangées (la source Insee couvre déjà les urgences et les supermarchés : base permanente des équipements 2025).
- [x] **Test en ligne à jouer** : la [vérification de bout en bout](../../specs/2026-11-23-services/details.md#vérification-de-bout-en-bout), étapes 1 à 8, en bureau et à 390 px, plus Chamonix-Mont-Blanc et Tende (retraits de la démo, H210) et l'ancien lien `commerce`.

## Ce que cette mise en ligne couvre, et ce qu'elle ne couvre pas
- **Couvre** :
  - « Urgences » (15, 30 ou 45 min, SMUR compris) et « Supermarché » (5, 10 ou 15 min) ;
  - une fiche à 11 temps, avec la phrase des limites révisée ;
  - Chamonix-Mont-Blanc (urgences) et Tende (supermarché) affichés « pas de chiffre » ;
  - un ancien lien `services=commerce:…` réécrit sans ce filtre.
- **Ne couvre pas** : ni nom de domaine, ni mesure d'audience, ni canal de retours (voir [docs/distribution/plan.md](../../distribution/plan.md)).
- **Connu et laissé** :
  - les 6 Mineurs des relectures ([demo.md](../../plans/2026-11-26-services-revision/demo.md#relectures)) ;
  - H207 : demander à D si un temps en voiture répond à sa question.

## Preuve
2026-11-27, 12:33-12:39 · **https://ou-vivre-en-france.narnia-assistant.workers.dev/** · push `d94f05e..ee0f48f` à 12:33:56 (accord de Vincent, panneau de fin de démo de /build) · `/version.txt` = **`ee0f48fa3d71ed7dde8c4b2b611c541312c8d4a8`** à 12:35:40 · `scripts/check-live.sh` : page 200, version servie = `origin/main`, `achat.json` en `noindex`.

Vérification de bout en bout ([details.md](../../specs/2026-11-23-services/details.md#vérification-de-bout-en-bout)) **sur le site en ligne**, vraies données, vrai fond Plan IGN, Chromium (Playwright, WebGL logiciel), à 1 440 × 900 à la souris et à 390 × 844 au toucher ; script `docs/plans/2026-11-26-services-revision/captures/T2-bout-en-bout.mjs` avec `BASE` = l'adresse en ligne ; sortie [bout-en-bout-en-ligne.txt](captures/bout-en-bout-en-ligne.txt) (12:35:55-12:38:09) :
1. `/` devient `/?loyer=1200` ; « Services » suit « Tes proches » ; fiche d'Auch : Médecin 2 min, **Urgences 6**, **Supermarché 2**, Crèche 3, École 2, Collège 3, Lycée 3, Supérieur 4, Gare 4, Gare régionale 4, Gare grandes lignes plus d'une heure ([bureau](captures/T2-e1-auch-1440x900.jpg), [390 px](captures/T2-e1-auch-390x844.png)).
2. à 4. Médecin 10 min, École et Collège 20 min, Gare régionale 30 min : adresses de details.md ; Mende écartée (« Gare régionale plus d'une heure : au-dessus de ton plafond de 30 min ») ; Ajaccio écartée (« Gare régionale : aucune en Corse »).
5. « 30 min » pour « Urgences » : `services=medecin:10,urgences:30,…` ; **Saint-Véran écartée, « Urgences 55 min : au-dessus de ton plafond de 30 min »** ([bureau](captures/T2-e5-saint-veran-1440x900.jpg), [390 px](captures/T2-e5-saint-veran-390x844.png)) ; Auch passe.
6. L'Île-d'Yeu : « Médecin : pas de chiffre », « Urgences : pas de chiffre », « Gare : aucune sur l'île », phrase de la traversée ([390 px](captures/T2-e6-ile-d-yeu-390x844.png)).
7. Adresse dans un nouvel onglet : mêmes réglages, en bureau et à 390 px.
8. Mentions Insee et gares au pied de page, aux deux largeurs.
En plus : l'ancien lien `/?loyer=1200&services=commerce:5,medecin:10` devient `/?loyer=1200&services=medecin:10`, sans alerte ([390 px](captures/T2-ancien-lien-commerce-390x844.png)) ; retraits de la démo (H210), [sortie](captures/chamonix-tende-en-ligne.txt) : Chamonix-Mont-Blanc « Urgences : pas de chiffre » ([capture](captures/R1-chamonix-1440x900.jpg)), Tende « Supermarché : pas de chiffre » ([capture](captures/R1-tende-1440x900.jpg)) ; au téléphone, chaque geste donne la même adresse qu'en bureau.

Non vérifié en ligne : un vrai téléphone au doigt ; Safari ; un lecteur d'écran.

## Revenir en arrière
- Le plus rapide : dans le tableau de bord Cloudflare, le Worker `ou-vivre-en-france` › **Deployments** › reprendre le déploiement précédent (`d94f05e`, recherche-et-mer).
- Par git : `git revert` des commits de code et de données de la révision (`45490a0`, `7c90001`, `6e35999`, `96ee91d`, `2189131`), puis `git push`. La tranche n'écrit rien chez l'utilisateur. Sur l'ancienne version, une adresse avec `urgences` ou `supermarche` perd simplement ces filtres.
