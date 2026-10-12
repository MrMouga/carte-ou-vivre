# Plan — loyer-mer
2026-10-12 · validé (révisé après [review-plan.md](review-plan.md)) · Spec : [spec.md](../../specs/2026-10-12-loyer-mer/spec.md) (D1–D18) · Critères : [acceptance.json](../../specs/2026-10-12-loyer-mer/acceptance.json) · Design : [README](../../design/loyer-mer/README.md) · Système : [contrat](../../design/system/README.md)
(La stack et les commandes vivent dans `CLAUDE.md`, pas ici.) La « tâche 0 » de la spec (sources, mesure, Adour) correspond aux tâches 1a et 1b de ce plan.

## Ce que /build fera seul, et ce qu'il demandera
Seul : tout ce qui est décrit ici, y compris installer les paquets nommés, gitleaks (brew) et le Chromium de Playwright (accord de Vincent du 2026-10-12, sous réserve de validation du plan). Les téléchargements de données et de polices sont des lectures, sans envoi.
Demandera : tout paquet non nommé ici ; 5 minutes de Vincent avec son téléphone, deux fois (tâches 1b et 3) ; pousser ou déployer (`/ship`).
S'arrête si : bloqué · 3 corrections ratées · hors périmètre · action à accord · **WebGL ne marche pas dans le Chromium de test (tâche 0a)** · **la mesure de la tâche 1b dépasse un seuil** (retour à Vincent avant toute autre tâche).
Relectures à la fin, par des agents neufs (perso) : code-reviewer, qa-tester (interface).

## Choix techniques (premier plan)
- **Site statique, sans serveur** : Vite + React + TypeScript. *Pourquoi* : D1, aucun service à nous ; le score se calcule dans le navigateur. *Écarté* : Next.js, dont les fonctions serveur ne servent à rien ici.
- **Carte** : MapLibre GL JS, qui lit tel quel le style vectoriel Plan IGN et peint 35 000 formes par la carte graphique (WebGL). *Écarté* : Leaflet, qui ne lit pas ce style et dessine trop lentement autant de formes. **Référence** : le prototype `prototype/loyer-mer/ign.html` (branche `prototype/loyer-mer`) pour l'adresse du style atténué, l'estompage à 45 % posé sous les communes, les communes posées **sous la première couche de texte de l'IGN** (les noms restent lisibles), le double contour de la commune choisie. On ne s'en écarte que si la tâche 1b le justifie.
- **Interface** : Tailwind CSS + composants shadcn/ui **copiés à la main** dans le repo (Slider, Toggle, Button, et l'utilitaire `cn`), rethémés avec nos jetons. *Écarté* : la commande `npx shadcn` (un paquet de plus) ; une bibliothèque de composants complète.
- **Polices** : Source Sans 3 et Source Serif 4 **hébergées dans le site** (`public/fonts/`, woff2 sous licence OFL, seulement les graisses utilisées : 400, 600, 700), téléchargées une fois depuis leur dépôt officiel. *Pourquoi* : D1 n'admet que le fond de carte comme service extérieur. *Écarté* : le lien Google Fonts du prototype.
- **Jetons** : un module TS unique `src/theme/tokens.ts`, qui produit les variables CSS du thème **et** les couleurs du style MapLibre. Mêmes noms que les variables Figma, dont la sortie brute de `get_variable_defs` est gardée dans `src/theme/figma-variables.json`. Contrôle « pas de valeur arbitraire » : `scripts/check-tokens.mjs`, lancé avec les tests.
- **Données** : précalculées par des scripts **Python 3 sans dépendance** (`scripts/data/`, repris de la discovery) ; téléchargements bruts dans `data-raw/` (non versionné). Les fichiers produits (`public/data/*.json`) **sont versionnés** : l'hébergeur construit le site sans relancer les scripts, et on ne les régénère que quand une source change. Extension `.json` pour que l'hébergeur les compresse. *Écarté pour l'instant* : des tuiles vectorielles (PMTiles), qui demanderaient d'installer tippecanoe ; c'est le repli si la tâche 1b l'exige, avec l'accord de Vincent.
- **Cadrage** : la carte s'ouvre sur l'emprise des communes chargées (la métropole avec la Corse pour les vraies données, conformément à details.md ; les 5 carrés avec la fixture) ; « ← Les 10 premières » y revient.
- **Tests** : Vitest pour les règles (score, passage, formats, adresse) avec la fixture « 5 communes ». Playwright (Chromium avec le rendu WebGL logiciel autorisé) pour ce qui se voit. Dans les tests, **aucun appel à la Géoplateforme** : par interception réseau, le style IGN est remplacé par un style local minimal (fond uni `background`, aucune tuile), la fixture remplace `public/data/`, et AC-15 bloque ce style. **Preuve d'une couleur sur la carte** : capture Playwright, puis lecture du pixel au centre de chaque carré de la fixture (décodage dans la page, par un canvas, sans paquet), comparé à la couleur du jeton mélangée au fond à l'opacité attendue, tolérance ± 3 par canal. Aucun code de test dans le produit. Tests à 1440 px jusqu'à la tâche 5b, à 1440 et 390 px à partir de la tâche 6 (à 390 px, les clics visent la bande de carte visible).
- **Hébergement** : Cloudflare Pages, branché sur le repo GitHub ; pousser sur `main` = mettre en ligne (choix de Vincent), retour arrière en un clic. *Pourquoi* : gratuit, bande passante illimitée (une visite chargera plusieurs Mo de formes), fichiers jusqu'à 25 Mo. *Écarté* : Netlify et Vercel (offre gratuite plafonnée à ~100 Go par mois ; Vercel interdit l'usage commercial en gratuit). Compte créé et branché par Vincent pendant `/ship`.
- **Politique des dépendances** (écrite dans `CLAUDE.md`) : un paquet n'entre que s'il est nommé ici ou accepté par Vincent ; il existe sur npm ; **on installe la dernière version publiée depuis plus de 7 jours**, figée dans le lockfile (lue avec `npm view <paquet> time --json`, la date de la version et non `time.modified`, qui change à chaque publication) ; `.npmrc` avec `ignore-scripts=true` ; lockfile versionné. Paquets prévus : react, react-dom, maplibre-gl, vite, @vitejs/plugin-react, typescript, tailwindcss, @tailwindcss/vite, @radix-ui/react-slider, @radix-ui/react-toggle, class-variance-authority, clsx, tailwind-merge, vitest, @playwright/test.
- **Repère de version** : `/version.txt` (hash du commit) produit à la construction, sans rien ajouter à l'écran.

## Tâches

### Tâche 0a — Socle et garde-fous
But : un site vide qui démarre, testé, protégé contre les secrets, avec un WebGL qui marche dans le navigateur de test.
Entrées : politique des dépendances ; leçons `2026-10-12-navigateur-webgl-et-envoi-figma.md` et `2026-10-12-studio-browse-localhost-et-captures.md`.
Sorties : projet Vite/React/TS ; `.npmrc` ; `.gitignore` (`data-raw/`, `probe/`, `.env*`) ; gitleaks en crochet de commit ; Vitest et Playwright configurés ; `/version.txt` à la construction ; commandes réelles dans `CLAUDE.md` (installer, lancer, tester, types, construire) et la politique des dépendances.
Fichiers : `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `playwright.config.ts`, `.npmrc`, `CLAUDE.md` (+ `.gitignore`, crochet gitleaks).
Tests : un test de fumée Playwright qui ouvre une carte MapLibre vide (style local) et constate qu'elle se peint (pixel non transparent).
**Preuve attendue** : `npm test` vert avec le test WebGL ; pour chaque paquet, la version installée et sa date de publication ; un faux secret refusé par gitleaks au commit (sortie). **Si WebGL échoue dans le Chromium de test : arrêt et retour à Vincent.**
Demander d'abord : rien.

### Tâche 0b — Jetons, polices et composants
But : le thème du design dans le code, et la preuve qu'un agent qui ne lit que le contrat produit une interface conforme.
Entrées : contrat du système ; variables Figma (fichier `uJG30M95NtOV9eDkv8oF0q`, page « Système », `get_variable_defs`).
Sorties : `src/theme/figma-variables.json` (sortie brute) ; `src/theme/tokens.ts` → variables CSS shadcn ; polices dans `public/fonts/` ; composants Slider, Toggle, Button et `cn` ; `scripts/check-tokens.mjs`.
Fichiers : `src/theme/figma-variables.json`, `src/theme/tokens.ts`, `src/index.css`, `src/components/ui/slider.tsx`, `toggle.tsx`, `button.tsx`, `src/lib/cn.ts`, `scripts/check-tokens.mjs` (+ fichiers de polices).
Tests : `check-tokens` passe ; noms et valeurs de `tokens.ts` = ceux de `figma-variables.json`.
**Preuve attendue** : capture d'une page de démonstration des trois composants, comparée à la planche `9:636` ; **test de l'agent neuf** : un sous-agent qui n'a lu que `docs/design/system/README.md` écrit un panneau d'exemple, et `check-tokens` n'y trouve aucune valeur arbitraire (sortie jointe) ; la page charge sans aucune requête vers fonts.googleapis.com (journal réseau).
Demander d'abord : rien.

### Tâche 1a — Données réelles et contrôles
But : les vrais chiffres de toutes les communes de métropole dans des fichiers statiques, contrôlés.
Entrées : COG 2025 ; Carte des loyers 2025 (ANIL) ; Limite terre-mer Shom-IGN 2021 (ouverte avec `bsdtar`, déjà sur macOS) ; centres et populations geo.api.gouv.fr (H5, H6) ; contours des communes 2025 d'Etalab, issus d'Admin Express IGN (Licence Ouverte ; 1,5 Mo compressé à 1 000 m, 8,2 Mo à 100 m, mesuré le 2026-10-12) ; D10 ; scripts de la discovery (`mer.py`, `prix.py`, `cog.py`).
Sorties : `scripts/data/*.py` ; `public/data/communes.json` (code INSEE → nom, département, population, **loyer au m² non arrondi**, estimation propre ou non, km de la mer non arrondis) et les formes aux deux finesses ; la source des formes et son millésime dans `CLAUDE.md` (Données).
Règles de préparation : Paris, Lyon et Marseille d'un seul tenant, loyer au m² = moyenne simple des arrondissements, population = somme, « estimation propre » seulement si tous les arrondissements en ont une ; Adour corrigé comme la Seine dans la discovery (arcs de côte en amont de l'embouchure retirés), et on vérifie que les communes côtières voisines ne bougent pas.
Fichiers : `scripts/data/` (≤ 4), `public/data/` (≤ 3), `CLAUDE.md`.
Tests (contrôles du script, par code INSEE) : nombre exact de communes de métropole, avec le détail de son calcul (COG 2025 métropole et Corse, moins les arrondissements, plus Paris, Lyon et Marseille) ; 0 commune sans forme, sans loyer, sans distance ou sans population (details.md) ; 0 code orphelin entre formes et COG ; Bordeaux (33063) : 832 € pour 52 m², 16,0 €/m², distance affichée 40 km ; La Rochelle (17300) : distance affichée 1 km (entre 1 et 1,5 km) ; Port-de-Lanne, Saint-Étienne-d'Orthe et Sames au-delà de 2 km.
**Preuve attendue** : sortie des contrôles, tous verts ; taille brute et compressée de chaque fichier.
Demander d'abord : rien.

### Tâche 1b — Mesure du risque
But : la réponse à *Le risque* (la carte de ~35 000 communes réagit-elle en ≤ 100 ms, et se charge-t-elle dans un temps raisonnable ?) avant de construire un écran.
Entrées : fichiers de la tâche 1a ; H9 ; prototype `ign.html`.
Sorties : une page de mesure jetable dans `probe/` (non versionné) qui affiche ses mesures ; le rapport `docs/plans/2026-10-12-loyer-mer/mesure-tache-1.md` avec la décision (finesse et format retenus).
Fichiers : `probe/*` (jetable), le rapport.
Mesures : (a) **la réaction complète** à un réglage (35 000 scores, tri des 10 premières, recoloration), en médiane sur 10 essais, pour deux méthodes de recoloration (un état par commune ; une seule expression de couleur) ; (b) le temps jusqu'à la première carte colorée avec un réseau ralenti de type « 4G » ; (c) taille brute et compressée de chaque fichier. Dans Chromium avec le processeur ralenti ×4, puis **sur le téléphone de Vincent** par le Wi-Fi local (`vite --host`, rien ne sort de la maison), modèle du téléphone noté.
**Preuve attendue** : le rapport, avec les chiffres et les captures de la carte entière et du zoom sur Douarnenez aux deux finesses. **Conditions d'arrêt (retour à Vincent)** : aucune méthode ≤ 100 ms sur le téléphone ; ou un fichier brut > 25 Mo (limite de l'hébergeur) sans découpage simple ; ou une première carte au-delà de 10 s en « 4G » (marge sous les 15 s de H9).
Demander d'abord : 5 minutes de Vincent avec son téléphone.

### Tâche 2 — Squelette : la carte se colore et réagit aux plafonds
But : on ouvre la page, les communes sont colorées selon les réglages de départ ; bouger le loyer ou la mer recolore aussitôt.
Entrées : R1, R2, R3, D4, D5, D16, H1, H2, H3, H8, H9 ; H10 avec D17 : opacité 88 % jusqu'au zoom 7, puis 70 % à partir du zoom 11, en transition linéaire (reprise du prototype, seuils ajustés) ; frame `5:2` ; composants Curseur, Légende, Bouton (Icône).
Sorties : `src/domain/score.ts` (passage, notes, score affiché, palier) ; `src/domain/format.ts` ; la carte (fond Plan IGN atténué + estompage, communes qui passent colorées, les autres non peintes) ; panneau de réglages avec les deux curseurs (« Sans limite » au dernier cran) ; légende ; boutons « + » et « − » du système (pas le contrôle MapLibre par défaut).
Fichiers : `src/domain/score.ts`, `src/domain/format.ts`, `src/map/MapView.tsx`, `src/map/style.ts`, `src/ui/Settings.tsx`, `src/ui/Legend.tsx`, `src/App.tsx`.
Tests : AC-1, AC-2, AC-3 (Vitest sur les scores + Playwright sur les pixels des carrés : couleur de palier pour A, E, B ; C et D non peintes, pixel = fond).
**Preuve attendue** : capture à 1440 px avec les vraies données, comparée à la frame `5:2` ; durée mesurée d'un réglage à la fin de la recoloration (≤ 100 ms) sur la machine.
Demander d'abord : rien.

### Tâche 3 — Les 10 premières, la taille de ville et les messages de liste
But : la liste dit combien de communes passent et montre les 10 meilleures ; les pastilles de taille filtrent ; la liste dit pourquoi elle est vide.
Entrées : R5, H4, D6, D11, cas « population sur un seuil » ; D17 (compte « Aucune commune ne passe tes critères », pas de compte sans plafond, sable à 70 %) ; frame `5:2`, tableau `9:514` ; composants Ligne de liste, Pastille.
Sorties : `src/ui/List.tsx`, `src/ui/SizeChips.tsx` ; le compte dans une zone annoncée aux lecteurs d'écran ; les messages « aucune commune » et « sans plafond » ; la couleur neutre « sans plafond » sur la carte.
Fichiers : `src/ui/List.tsx`, `src/ui/SizeChips.tsx`, `src/domain/score.ts` (filtre de taille), `src/map/style.ts`, `src/App.tsx`.
Tests : AC-4 (Vitest + Playwright pour le format des lignes), AC-5 (pixels : rien de peint ; message de liste), AC-6 (pixels : couleur neutre sur les 5 carrés ; aucun score ; message), et un test qui lit la zone annoncée après un réglage.
**Preuve attendue** : capture de la liste réelle avec 1 200 €, 60 km, Petite ville + Ville moyenne (le prototype donnait « 269 communes passent tes critères ») ; capture « sans plafond » avec les vraies données (l'écran que Figma n'a pas) ; parcours au clavier de la liste ; **nouvelle mesure sur le téléphone de Vincent** avec la vraie page (réaction ≤ 100 ms).
Demander d'abord : 5 minutes de Vincent avec son téléphone.

### Tâche 4 — La fiche, le zoom et les ronds du top 10
But : choisir une commune (liste, rond ou carte) ouvre sa fiche à la place de la liste et zoome sur elle ; la fiche suit les réglages ; « ← Les 10 premières » revient.
Entrées : R1 (raisons), R4, R6, D12, D14, D17 (intitulé « Ne passe pas tes critères », pastille du palier, ronds regroupés au-delà de 50 % de chevauchement, un clic zoome jusqu'à ce qu'ils se séparent) ; états de la fiche de details.md (passe, ne passe pas, sans plafond, valeurs inconnues, changement d'état dans les deux sens) ; frames `5:154`, `5:235` ; composants Fiche, Rond du top 10, Bouton (Lien).
Sorties : `src/ui/Fiche.tsx`, `src/map/RankMarkers.ts` ; double contour de la commune choisie ; zoom animé en 500 ms.
Fichiers : `src/ui/Fiche.tsx`, `src/map/RankMarkers.ts`, `src/map/MapView.tsx`, `src/domain/format.ts`, `src/App.tsx`.
Tests : AC-7, AC-8, AC-9 (clic au centre du carré de Montcher, visible grâce au cadrage sur les données), AC-10 ; un test de parcours : fiche de Grandeville ouverte → loyer à 800 € → « Ne passe pas tes critères » et la raison → loyer et mer sur « Sans limite » → ni score ni rang ; Vitest sur « Loyer inconnu », « Distance à la mer inconnue », « Taille inconnue ».
**Preuve attendue** : captures de la fiche de Douarnenez et de Bordeaux grisée (vraies données), comparées aux frames `5:154` et `5:235` ; capture du Pas-de-Calais où des ronds voisins forment un groupe.
Demander d'abord : rien.

### Tâche 5a — L'adresse de la page
But : l'adresse garde les réglages et rouvre la même carte ailleurs.
Entrées : R7, H7, D7 ; AC-11 à AC-14.
Sorties : `src/domain/url.ts` ; lecture à l'ouverture, réécriture sans ajouter d'entrée à l'historique.
Fichiers : `src/domain/url.ts`, `src/App.tsx`.
Tests : AC-11, AC-12, AC-14 (Vitest sur `url.ts` + Playwright), AC-13 (Playwright, longueur de l'historique).
**Preuve attendue** : étapes 1 à 4 de la « Vérification de bout en bout » de details.md, en local, à 1440 px (captures et adresses).
Demander d'abord : rien.

### Tâche 5b — États de la page, fond de secours et mentions
But : la page tient le chargement, l'erreur, l'absence de WebGL et la panne du fond IGN ; les mentions obligatoires sont là.
Entrées : R8 et D17 ; H9 ; états de details.md ; tableau `9:514` ; frame `5:314` ; mentions de `CLAUDE.md` (sauf openrouteservice et OpenStreetMap, inutilisés dans cette tranche) ; logos Shom et IGN et leurs conditions d'usage, lues sur leurs sites, ainsi que l'éventuelle mention des données des pays voisins du Plan IGN.
Règles décidées ici : **panne du fond** = le style IGN n'est pas reçu (erreur réseau, réponse ≥ 400, ou rien après 8 s) ; les erreurs de tuiles d'estompage seules ne comptent pas (le relief disparaît, c'est tout) ; **retour** : nouvel essai du style toutes les 60 s, et bascule sur le fond IGN dès qu'il répond. **Fond de secours** : la mer est le fond de la carte (`map-sea`), les pays voisins viennent de Natural Earth (admin-0, 1:10 m, domaine public, filtrés aux voisins, `map-neighbour` et contour `map-border`), toutes les communes sont posées dessus (celles qui ne passent pas en `area-excluded`), sans calcul de polygone de mer.
Sorties : `src/ui/Status.tsx` (chargement, erreur + « Réessayer », fond indisponible, dans une zone annoncée) ; `src/map/fallback.ts` ; `public/data/voisins.json` et son script ; variante « Fond indisponible » de la légende ; `src/ui/Mentions.tsx` avec les logos.
Fichiers : `src/ui/Status.tsx`, `src/map/fallback.ts`, `src/ui/Legend.tsx`, `src/ui/Mentions.tsx`, `scripts/data/voisins.py`, `public/data/voisins.json`, `public/logos/*`, `src/App.tsx`.
Tests : AC-15 (style IGN bloqué ; pixels de A, E, B ; mention visible) ; fixture retardée : indicateur après 300 ms, présent au moins 300 ms, erreur à 15 s (horloge simulée) ; lancement avec WebGL désactivé → message d'erreur ; style rétabli → retour au fond normal.
**Preuve attendue** : captures des états chargement, erreur et fond indisponible (vraies données) ; étape 5 de la vérification de bout en bout (mentions visibles).
Demander d'abord : rien.

### Tâche 6 — 390 px et passage au clavier
But : à 390 px, la carte en haut et la feuille en bas ; une fiche ouverte remplace les réglages ; tout se fait au clavier en bureau.
Entrées : frames `7:343`, `7:488`, `11:667` ; contrat (cibles 44 px, pastilles `space-2`, zoom 44 × 44) ; details.md (Exceptions d'accessibilité).
Sorties : `src/ui/Sheet.tsx`, la mise en page responsive, le zoom centré dans la bande visible.
Fichiers : `src/ui/Sheet.tsx`, `src/App.tsx`, `src/map/MapView.tsx`, `src/index.css`.
Tests : aucun nouveau critère ; tous les AC Playwright repassent à 390 px.
**Preuve attendue** : captures à 390 px (liste, fiche), comparées aux frames ; « Vérification de bout en bout » à 390 px, en local ; parcours au clavier seul (capture de chaque focus).
Demander d'abord : rien.

### Tâche 8 — Un seul point par commune : la mairie (D18, ajoutée à la démo, 2026-10-13)
But : la distance à la mer part de la mairie, et le rond du top 10 s'y pose (un seul point par commune).
Entrées : D18, H5 révisée ; champ `mairie` de geo.api.gouv.fr (fichier à part, les populations ne bougent pas) ; comptage de la démo (32 mairies hors de leur commune).
Sorties : `public/data/communes.json` (distances recalculées), `public/data/reperes.json` (point = mairie ; cadres inchangés) ; tuiles inchangées.
Fichiers : `scripts/data/sources.py`, `scripts/data/mer.py`, `scripts/data/tuiles.py`, `scripts/data/communes.py`, `scripts/data/communes.test.ts`, `CLAUDE.md`.
Tests : contrôles des scripts et `communes.test.ts` (Bordeaux 39 km, La Rochelle sous 1 km) ; tous les AC repassent (fixture inchangée).
**Preuve attendue** : sortie des contrôles ; écart avant / après (communes qui changent de km, de passage à 60 km) ; « Vérification de bout en bout » étapes 1 à 4 à 1440 et 390 px, en local ; captures du rond de La Hague et de Granville.
Demander d'abord : rien (accord de Vincent le 2026-10-13).

## Répartition des critères
AC-1, 2, 3 → tâche 2 · AC-4, 5, 6 → tâche 3 · AC-7, 8, 9, 10 → tâche 4 · AC-11, 12, 13, 14 → tâche 5a · AC-15 → tâche 5b. Chaque critère dans une seule tâche ; les tests d'une tâche repassent à chaque tâche suivante.

## Reporté
- Mesure d'audience sans cookie (condition de publication du plan de distribution) → `/ship`.
- Compte Cloudflare Pages, premier déploiement, et **la vérification de bout en bout en ligne** (étapes 1 à 5, aux deux largeurs, details.md) → `/ship`.
- Tuiles vectorielles (PMTiles) : seulement si la tâche 1b le demande, avec l'accord de Vincent pour installer tippecanoe.

## Risques et hypothèses du plan
- **La carte de 35 000 communes est trop lente ou trop lourde sur téléphone** (*Le risque*) → mesurée en tâche 1b avant tout écran, remesurée en tâche 3 sur la vraie page ; repli : formes plus simples, découpage, tuiles vectorielles, ou retour à Vincent.
- **Les contours Etalab 2025 ne collent pas au COG 2025** (le prototype avait 493 codes orphelins) → contrôle de jointure en tâche 1a, attendu 0.
- **WebGL indisponible dans le navigateur de test** (vu deux fois le 2026-10-12) → essayé dès la tâche 0a, avec arrêt ; pour les captures `studio-browse`, mode fenêtre (`BROWSE_HEADED=1`) et relance avant chaque chargement (leçon du projet).
- **La lecture des pixels est fragile** (lissage, opacité) → mesure au centre des carrés de 0,5°, loin des bords, tolérance ± 3 par canal, fond de test uni connu.
- **La Géoplateforme change son style ou ralentit** → les tests n'en dépendent pas ; R8 couvre la panne ; le style est référencé par son adresse publique, pas copié.
- **Les logos Shom et IGN ont des conditions d'usage** → lues en tâche 5b avant de les poser ; sinon texte et liens, et la question revient à Vincent.
- **10 tâches pour un projet perso** (au-dessus des « ~8 » acceptées dans la spec) → même périmètre, tâches plus petites ; à valider par Vincent ; si une tâche déborde, la tâche 6 se réduit d'abord.
