# Mise en ligne — loyer-mer et proches
2026-10-13 · Ambition : perso · Hébergeur : Cloudflare Pages (gratuit) · Adresse prévue : https://ou-vivre-en-france.pages.dev

Deux tranches construites et acceptées : [loyer-mer](../../plans/2026-10-12-loyer-mer/demo.md) (Terminé 2026-10-13) et [proches](../../plans/2026-10-13-proches/demo.md) (Terminé 2026-10-13).

## Liste de contrôle avant la mise en ligne

Vérifiée le 2026-10-13 vers 21 h sur le commit `e75ccfc`.

- [x] **Construction depuis une copie neuve** (le dépôt cloné dans un dossier vide, `npm ci`, `npm run build`) : installation sans erreur, « 0 vulnerabilities », build en 7 s, 9 382 fichiers, 40 Mo, `dist/version.txt` = `e75ccfcd1da0f585f96d5b67cbfd6529dbd65f4b`.
- [x] **Types** (`npm run typecheck`) : aucune erreur.
- [x] **Tests unitaires** (`npm run test:unit`) : 84 sur 84.
- [x] **Jetons de design** (`npm run check-tokens`) : 35 fichiers, aucune valeur arbitraire.
- [x] **Tests navigateur** (`npm run test:e2e`, bureau et 390 px) : 151 verts, 2 ignorés exprès (un écran qui n'existe qu'à une largeur : `aucune.spec.ts` en bureau, `fiche.spec.ts:57` à 390 px), en 5 min.
- [x] **Aucun secret dans le dépôt ni son historique** (gitleaks : un détecteur de clés et mots de passe) : 152 commits, « no leaks found ». Le dossier de travail entier, fichiers non versionnés compris, a une alerte : `.gstack/browse.json`, ligne 4 — l'état local de l'outil de navigateur de test, ignoré par git, donc jamais poussé ni mis en ligne. `.env*` est ignoré.
- [x] **Chaque paquet existe sur npm** (`npm audit signatures`) : 108 paquets avec signature du registre vérifiée ; toutes les adresses du lockfile pointent vers registry.npmjs.org ; `package-lock.json` est versionné.
- [x] **Repère de version** : `/version.txt` contient le hash du commit construit (`vite.config.ts`). Cloudflare construit depuis git, donc le hash sera celui du commit mis en ligne.
- [x] **Limites de Cloudflare Pages** (20 000 fichiers, 25 Mo par fichier) : 9 382 fichiers, le plus gros fait 1,8 Mo (`data/communes.json`).
- [x] **Vérification de bout en bout** à jouer sur le site en ligne (copiée des `details.md`) :
  - Loyer-mer : (1) ouvrir `/` → l'adresse devient `/?loyer=1200&mer=60` ; fiche de Bordeaux « Grande ville », « 832 € par mois pour 52 m² (16,0 €/m²) », « 39 km de la mer à vol d'oiseau » ; La Rochelle « moins d'1 km de la mer ». (2) Loyer à 800 € → Bordeaux grise, « Loyer 832 € : au-dessus de ton plafond de 800 € », `loyer=800` dans l'adresse. (3) Cocher « Petite ville » → Bordeaux grisée, « Taille : grande ville », `taille=petite-ville`. (4) L'adresse ouverte dans une fenêtre privée → mêmes réglages, même liste. (5) Mentions visibles dans le pied de page.
  - Proches : (1) « 12 rue de la Paix, Nantes », nommé « Parents de Léa », « Ajouter » → « Calcul des trajets depuis Parents de Léa… », repère à Nantes, puis 2 h ; l'adresse de la page reste `/?loyer=1200&mer=60`. (2) Plafond à 2 h 30 → La Rochelle passe, « Parents de Léa : 2 h 15 en voiture » ; Bordeaux ne passe pas, « Parents de Léa plus de 3 h : au-dessus de ton plafond de 2 h 30 » ; la pastille en haut de la carte donne le même temps. (3) Fermer et rouvrir → le proche est là, sans calcul. (4) « Effacer mes proches », recharger → plus rien. Preuves : temps de calcul de l'étape 1, et les requêtes réseau de l'étape 1 ne contiennent pas « Parents de Léa ».
- [x] **Vie privée** : aucune donnée sur un serveur à nous (le site est un ensemble de fichiers). Les adresses des proches partent du navigateur vers l'IGN (recherche d'adresse et temps de trajet) et restent dans le navigateur ; elles ne sont pas dans le lien. Aucun cookie.
- [x] **Mesure d'audience** (demandée par le plan de distribution, sans cookie) : choix de Vincent du 2026-10-13, **Cloudflare Web Analytics**, gratuit, sans cookie, activé par un interrupteur dans Cloudflare, sans code. Compte les visites, les pages et les sites d'origine. Ne compte pas « a réglé un critère ou entré une adresse » (seuil des 30 inconnus) : il faudra un outil qui compte des événements avant le 20/12.

Rien de bloquant.

## Ce que cette mise en ligne couvre, et ce qu'elle ne couvre pas

Condition de publication du plan de distribution : en ligne avec au minimum les proches, le loyer et la mer, sans inscription, avec les mentions obligatoires et une mesure d'audience sans cookie.
- Couvert : proches, loyer, mer ; sans inscription ; mentions ; mesure des visites.
- Pas couvert : le comptage des « inconnus qui ont joué » ; le partage (« Copier le lien », reporté) ; l'ajout d'un proche sur iPhone (champ caché sous le clavier, reporté) ; la FAQ (vie privée des adresses envoyées à l'IGN, D12 de la spec proches) ; nom de domaine (pas nécessaire pour un projet perso).
