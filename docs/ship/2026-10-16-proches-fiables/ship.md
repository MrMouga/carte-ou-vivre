# Mise en ligne — proches-fiables
2026-10-16 · Ambition : perso · Hébergeur : **Cloudflare Workers** (site statique servi par un Worker, gratuit), branché sur le dépôt GitHub `MrMouga/carte-ou-vivre` : un push sur `main` met en ligne · Adresse : **https://ou-vivre-en-france.narnia-assistant.workers.dev/** · Commit à mettre en ligne : `b29757b` (39 commits depuis `56ac3d6`, la version servie) · Coût : 0 €

Tranches servies après ce push : loyer-mer, proches, interface-telephone, immobilier, cadre-de-vie, **proches-fiables** ([démo acceptée](../../plans/2026-10-16-proches-fiables/demo.md)).

## Liste de contrôle avant la mise en ligne
- [x] **Construction depuis un clone neuf** (2026-10-16 22:12) : `git clone` dans un dossier vide, `npm ci` sans erreur (« found 0 vulnerabilities »), `npm run build` vert ; `dist/version.txt` = `b29757b`. Aucun paquet n'a changé depuis la version en ligne (`package.json`, `package-lock.json`, `.npmrc` identiques à `56ac3d6`) : chaque paquet existe déjà sur npm.
- [x] **Tests, types, build** : suite complète relancée par l'orchestrateur à 21:00 sur `011628c`, le dernier commit de code ([verif-corrections-1.txt](../../plans/2026-10-16-proches-fiables/captures/verif-corrections-1.txt)) : Vitest 286/286 ; Playwright 349 verts, 36 sautés, 3 rouges = tests instables de cadre-de-vie (le clic sur la carte n'est parfois pas pris ; valeurs justes ; instabilité mesurée aussi avant la tranche ; fichier relancé seul : 0 échec sur 60) ; types et build verts. Depuis `011628c`, seuls des documents ont changé.
- [x] **Aucun secret** dans le dépôt ni son historique : `gitleaks detect` (outil gratuit qui cherche des clés) : « no leaks found ». Aucun fichier `.env`.
- [x] **Marqueur de version** : `/version.txt` donne le commit construit (sans lui, pas de preuve).
- [x] **Fichiers** : 9 381 fichiers dans `public/`, comme avant (sous la limite de 20 000 d'un Worker).
- [x] **Non-indexation d'`achat.json`** (D9 d'immobilier) : vérifiée par `scripts/check-live.sh` après le push.
- [x] **Vie privée** : aucune mesure d'audience ; les proches restent dans le navigateur, avec quelques champs en plus (état, zones obtenues, heure du dernier essai : D4, accepté par Vincent) ; le nom d'un proche ne part vers aucun service (vérifié sur le vrai IGN).
- [x] **Compatibilité des proches déjà gardés** : la nouvelle version relit les proches gardés par la version en ligne, et un retour en arrière ne perd aucun proche (tâche 4, vérifiée dans les deux sens).
- [x] **Test en ligne à jouer** : la [vérification de bout en bout](../../specs/2026-10-16-proches-fiables/details.md#vérification-de-bout-en-bout), étapes 1 à 4, en bureau et à 390 px ; joués en ligne : voir Preuve (l'étape 4 en partie).

## Ce que cette mise en ligne couvre, et ce qu'elle ne couvre pas
- Couvre : un proche toujours utilisable quand l'IGN rame (nouvel essai hors du cache du navigateur, partiel, repli en km, recalcul à la réouverture).
- Ne couvre pas : les erreurs **déjà gardées** par le cache de ton iPhone et de ton PC (jusqu'à 21 jours) ne s'effacent pas d'elles-mêmes, mais la nouvelle version les contourne au second essai ; Safari n'a pas été testé sur ce point. Pas de nom de domaine, de mesure d'audience ni de canal de retours (voir [docs/distribution/plan.md](../../distribution/plan.md)).

## Preuve
2026-10-16, 22:12-22:21 · **https://ou-vivre-en-france.narnia-assistant.workers.dev/** · push `656fd86..b29757b` à 22:12:53 (accord de Vincent) · `/version.txt` = **`b29757bfe034ca18749b7f731fc2c1265b50df8f`** à 22:14:18 · `scripts/check-live.sh` : page 200, version servie = `origin/main`, `achat.json` en `x-robots-tag: noindex`.

IGN mesuré juste avant (22:14, `curl` sans cache, depuis 12 rue de la Paix, Nantes) : zone de 2 h en 3,2 s, de 3 h en 6,4 s — il répondait normalement.

Vérification de bout en bout ([details.md](../../specs/2026-10-16-proches-fiables/details.md#vérification-de-bout-en-bout)) **sur le site en ligne**, vraies données, vrai IGN, Chromium (Playwright), à 1 440 × 900 et 390 × 844 ; les pannes sont posées par des routes du navigateur de test sur le seul calcul de trajets ([sortie complète](captures/preuve-sortie.txt)) :
1. Pannes du soir de la démo (75 min en erreur, 2 h et 3 h sans réponse) : proche **partiel**, « Temps approximatifs : l'IGN n'a pas tout donné. » et « Au-delà de 2 h 45 : l'IGN n'a pas répondu. », curseur de 15 min à 2 h 45 ; fiche de La Rochelle : « Nantes (44) jusqu'à 2 h 15 : au-dessus de ton plafond de 2 h » ([bureau](captures/bureau-1-ligne.jpg), [390 px](captures/390-1-ligne.jpg)).
2. Calcul de trajets coupé : proche **à vol d'oiseau**, « 120 km au plus » ; La Rochelle « Nantes (44) 121 km : au-dessus de ton plafond de 120 km » ([bureau](captures/bureau-2-fiche-la-rochelle.jpg)).
3. Calcul rétabli, réouverture : « Recalcul avec l'IGN… », puis proche **prêt** à 2 h (12 zones, toutes en 200) ; La Rochelle « Nantes (44) 2 h 15 : au-dessus de ton plafond de 2 h » ([bureau](captures/bureau-3-fiche-la-rochelle.jpg), [390 px](captures/390-3-apres.jpg)).
Aucune demande à l'IGN ne contient le nom ni l'adresse du proche (0 sur les étapes 1 à 3, aux deux largeurs).

Étape 4 (scénario de proches, IGN normal) : couverte en partie par l'étape 3 (proche prêt sur le vrai IGN, La Rochelle à 2 h 15, aucun nom envoyé) ; le renommage en « Parents de Léa » et le plafond de 2 h 30 n'ont pas été rejoués en ligne (comportements de la tranche proches, inchangés, couverts par ses tests).

À regarder : en bureau, le **fond de carte IGN ne s'est pas chargé** dans le navigateur de test (carte de secours ; 2ᵉ fois aujourd'hui, en bureau seulement — à 390 px il se charge) ; la pastille « Fond de carte indisponible » **recouvre la pastille du proche** en haut de la carte. Pas un effet de cette tranche (le fond n'a pas été touché), à vérifier dans un vrai navigateur.

Non vérifié en ligne : Safari (contournement du cache des erreurs) ; le toucher sur un vrai téléphone.

## Revenir en arrière
- Le plus rapide : dans le tableau de bord Cloudflare, le Worker `ou-vivre-en-france` › **Deployments** › reprendre le déploiement précédent (`656fd86`, même code que `56ac3d6`).
- Par git : `git revert 606f515..b29757b` (commits de code de la tranche) puis `git push`. Les proches gardés par cette version restent lisibles par l'ancienne (« indisponible », rien n'est perdu).

## Ce que le lancement demande encore
Voir [docs/distribution/plan.md](../../distribution/plan.md) : canal de retours ; regarder le fond de carte en bureau et le chevauchement des pastilles ; corriger les tests instables de cadre-de-vie (clic sur la carte).
