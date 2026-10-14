# Mise en ligne — loyer-mer, proches et interface téléphone
2026-10-14 · Ambition : perso · Hébergeur : Cloudflare Pages (gratuit) · Adresse prévue : https://ou-vivre-en-france.pages.dev

Trois tranches construites et acceptées : [loyer-mer](../../plans/2026-10-12-loyer-mer/demo.md), [proches](../../plans/2026-10-13-proches/demo.md) et [interface téléphone](../../plans/2026-10-13-interface-telephone/demo.md) (Terminé 2026-10-14). La [mise en ligne du 2026-10-13](../2026-10-13-loyer-mer-proches/ship.md) s'est arrêtée à la liste de contrôle : le code a été poussé sur GitHub, mais le projet Cloudflare n'a jamais été créé (le 2026-10-14, `ou-vivre-en-france.pages.dev` n'existe pas : « NXDOMAIN »). Rien n'est en ligne aujourd'hui.

## Liste de contrôle avant la mise en ligne
Vérifiée le 2026-10-14 vers 11 h 30 sur le commit `617c86b`.

- [x] **Construction depuis une copie neuve** (le dépôt cloné dans un dossier vide, `npm ci`, `npm run build`) : « found 0 vulnerabilities », build en 1,8 s, 9 385 fichiers, 41 Mo, `dist/version.txt` = `617c86bd0b4b65ee81eecf6754b0e97c9b5773c8`.
- [x] **Types** (`npm run typecheck`) : aucune erreur. **Jetons de design** (`npm run check-tokens`) : 36 fichiers, aucune valeur arbitraire.
- [x] **Tests unitaires** (`npm run test:unit`) : 88 sur 88.
- [x] **Tests navigateur** (`npm run test:e2e`, bureau et 390 px) : 189 verts, 30 ignorés exprès (tests propres à une seule largeur, et 2 d'avant les tranches), en 4,9 min.

Rien de bloquant.
- [x] **Aucun secret dans le dépôt ni son historique** (gitleaks : un détecteur de clés et mots de passe) : 197 commits, « no leaks found ». `.env*` est ignoré.
- [x] **Chaque paquet existe sur npm** (`npm audit signatures`) : 108 paquets avec signature du registre vérifiée ; les 172 adresses du lockfile pointent toutes vers registry.npmjs.org ; `package-lock.json` versionné ; aucun paquet ajouté depuis le 2026-10-13.
- [x] **Repère de version** : `/version.txt` = hash du commit construit (`git rev-parse HEAD` dans `vite.config.ts`) ; Cloudflare construit depuis git, donc ce sera le commit mis en ligne.
- [x] **Limites de Cloudflare Pages** (20 000 fichiers, 25 Mo par fichier) : 9 385 fichiers (3 tuiles du zoom 3 en plus), aucun fichier au-dessus de 20 Mo.
- [x] **Vérification de bout en bout à jouer en ligne** :
  - Loyer-mer et proches : celle de la [note du 2026-10-13](../2026-10-13-loyer-mer-proches/ship.md#liste-de-contrôle-avant-la-mise-en-ligne) (fiche de Bordeaux, loyer à 800 €, taille, lien ouvert ailleurs, mentions ; « 12 rue de la Paix, Nantes » nommé « Parents de Léa », plafond 2 h 30, mémoire, « Effacer mes proches »).
  - Interface téléphone (details.md, sur l'iPhone de Vincent) : (1) ouvrir `/` : France entière, côte verte sans zoomer, feuille sur « Critères » ; (2) toucher la tête → barre « … communes passent tes critères », la carte ne bouge pas ; glisser la barre vers le haut → « Critères » ; (3) « Les 10 premières » → la liste ; un rond → la fiche ; « ← Les 10 premières » → la liste ; (4) « + Ajouter un proche », taper « 12 rue de la Paix Nantes » : le champ et les suggestions restent au-dessus du clavier ; choisir : « Nom » et « Ajouter » visibles ; « Ajouter » → le proche se calcule ; puis « Effacer mes proches » : le champ reste visible au-dessus du clavier.
- [x] **Vie privée** : inchangée depuis le 2026-10-13 — aucune donnée sur un serveur à nous ; les adresses des proches partent du navigateur vers l'IGN et restent dans le navigateur ; aucun cookie. Mesure d'audience : Cloudflare Web Analytics (choix de Vincent du 2026-10-13), sans cookie, à activer par un interrupteur dans Cloudflare.

## Ce que Vincent fait une fois dans Cloudflare (≈ 10 min, gratuit)
1. Sur https://dash.cloudflare.com, connecté avec ton compte perso : **Workers & Pages** › **Créer** › onglet **Pages** › **Connecter à Git**.
2. Autorise Cloudflare sur GitHub pour le compte **MrMouga**, dépôt **carte-ou-vivre** seulement.
3. Réglages du projet :
   - Nom du projet : **ou-vivre-en-france** (il donne l'adresse `ou-vivre-en-france.pages.dev`) ;
   - Branche de production : **main** ;
   - Préréglage : **Aucun** (ou Vite) ; Commande de build : **npm run build** ; Dossier de sortie : **dist** ;
   - Variables d'environnement : **NODE_VERSION** = **22**.
4. **Enregistrer et déployer** : Cloudflare construit le dernier commit poussé sur GitHub (attendu ≈ 2 min).
5. Dans le projet, onglet **Métriques** (ou Web Analytics) : active la mesure d'audience sans cookie.

## Ce que cette mise en ligne couvre, et ce qu'elle ne couvre pas
Condition de publication du plan de distribution : en ligne avec au minimum les proches, le loyer et la mer, sans inscription, avec les mentions obligatoires et une mesure d'audience sans cookie.
- Couvert : proches, loyer, mer ; l'interface téléphone (y compris l'ajout d'un proche sur iPhone, reporté le 2026-10-13) ; sans inscription ; mentions ; mesure des visites.
- Pas couvert : le comptage des « inconnus qui ont joué » (un outil d'événements avant le 20/12) ; le partage (« Copier le lien ») ; la FAQ (vie privée des adresses envoyées à l'IGN) ; le téléphone tenu à l'horizontale ; un nom de domaine.
