# Plan — loyer-mer
2026-10-12 · brouillon · Spec : [spec.md](../../specs/2026-10-12-loyer-mer/spec.md) (D1–D17) · Critères : [acceptance.json](../../specs/2026-10-12-loyer-mer/acceptance.json) · Design : [README](../../design/loyer-mer/README.md) · Système : [contrat](../../design/system/README.md)
(La stack et les commandes vivent dans `CLAUDE.md`, pas ici.)

## Ce que /build fera seul, et ce qu'il demandera
Seul : tout ce qui est décrit ici, y compris installer les paquets nommés ci-dessous, gitleaks (brew) et le Chromium de Playwright (accord de Vincent du 2026-10-12, sous réserve de validation du plan).
Demandera : tout paquet non nommé ici ; tout envoi vers un service extérieur (aucun n'est prévu : les téléchargements de données sont des lectures) ; la mesure sur le téléphone de Vincent (tâche 1, 5 min de son temps) ; pousser ou déployer (`/ship`).
S'arrête si : bloqué · 3 corrections ratées · hors périmètre · action à accord · **la mesure de la tâche 1 dépasse le budget** (retour à Vincent avant toute autre tâche).
Relectures à la fin, par des agents neufs (perso) : code-reviewer, qa-tester (interface).

## Choix techniques (premier plan)
- **Site statique, sans serveur** : Vite + React + TypeScript. *Pourquoi* : D1, aucun service à nous ; le calcul du score se fait dans le navigateur. *Écarté* : Next.js, dont les fonctions serveur ne servent à rien ici.
- **Carte** : MapLibre GL JS (la bibliothèque du prototype), qui lit tel quel le style vectoriel Plan IGN de la Géoplateforme et peint 35 000 formes par la carte graphique (WebGL). *Écarté* : Leaflet, qui ne lit pas ce style et dessine trop lentement autant de formes.
- **Interface** : Tailwind CSS + shadcn/ui (copie de composants dans le repo, rethémés avec nos jetons : Slider, Toggle, Button). *Écarté* : une bibliothèque de composants complète, plus lourde et plus dure à rethémer.
- **Jetons** : un module TS unique `src/theme/tokens.ts`, qui produit les variables CSS du thème **et** les couleurs du style MapLibre (le style de carte est du JSON, il ne lit pas le CSS). Mêmes noms que les variables Figma. Contrôle « pas de valeur arbitraire » : un petit script `scripts/check-tokens.mjs` (cherche `[13px]`, `#xxxxxx` hors de `tokens.ts`), lancé avec les tests. *Écarté* : un plugin ESLint de plus.
- **Données** : précalculées par des scripts **Python 3 sans dépendance** (`scripts/data/`, repris des scripts de la discovery), qui écrivent des fichiers statiques dans `public/data/` : les chiffres de chaque commune par code INSEE, et ses formes. Les téléchargements bruts vont dans `data-raw/` (non versionné). La finesse des formes (1 000 m ou 100 m) et leur format sont **choisis en tâche 1, sur mesure**. *Écarté pour l'instant* : des tuiles vectorielles (PMTiles), qui demanderaient d'installer tippecanoe ; c'est le repli si la tâche 1 montre que le fichier est trop lourd.
- **Tests** : Vitest pour les règles (score, passage, formats, adresse) avec la fixture « 5 communes » d'`acceptance.json` ; Playwright (Chromium avec WebGL activé explicitement, `--enable-unsafe-swiftshader`) pour les critères qui se voient dans la page, à 1440 et 390 px. La fixture est servie à la place des vraies données par interception réseau dans les tests : aucun code de test dans le produit.
- **Hébergement** : Cloudflare Pages, branché sur le repo GitHub ; pousser sur `main` = mettre en ligne (choix de Vincent), retour arrière en un clic dans le tableau de bord. *Pourquoi* : gratuit, bande passante illimitée (une visite chargera plusieurs Mo de formes), fichiers jusqu'à 25 Mo. *Écarté* : Netlify et Vercel (offre gratuite plafonnée à ~100 Go/mois ; Vercel interdit l'usage commercial en gratuit). Le compte est créé et branché par Vincent pendant `/ship` ; rien n'est déployé dans ce plan.
- **Politique des dépendances** (écrite dans `CLAUDE.md`) : un paquet n'entre que s'il est nommé ici ou accepté par Vincent ; il existe sur npm et a plus de 7 jours (`npm view <paquet> time.modified`) ; `.npmrc` avec `ignore-scripts=true` ; lockfile versionné. Paquets prévus : react, react-dom, maplibre-gl, vite, @vitejs/plugin-react, typescript, tailwindcss, @tailwindcss/vite, @radix-ui/react-slider, @radix-ui/react-toggle, class-variance-authority, clsx, tailwind-merge, vitest, @playwright/test.

## Tâches

### Tâche 0 — Socle : projet, jetons, garde-fous
But : un site vide qui démarre, avec les jetons du design et les garde-fous, sur lequel tout le reste se pose.
Entrées : contrat du système ; variables Figma (fichier `uJG30M95NtOV9eDkv8oF0q`, page « Système », `get_variable_defs`) ; politique des dépendances ci-dessus.
Sorties : projet Vite/React/TS/Tailwind ; `src/theme/tokens.ts` (couleurs, dimensions, données) → variables CSS shadcn ; composants shadcn Slider, Toggle, Button rethémés ; `scripts/check-tokens.mjs` ; `.npmrc` ; gitleaks en crochet de commit ; repère de version (`/version.txt` et hash du commit en pied de page) ; commandes réelles dans `CLAUDE.md` (installer, lancer, tester, types, construire) ; `.gitignore` (`data-raw/`, `.env*`).
Fichiers : `package.json`, `vite.config.ts`, `src/theme/tokens.ts`, `src/index.css`, `src/components/ui/*`, `scripts/check-tokens.mjs`, `.npmrc`, `CLAUDE.md`.
Tests : `check-tokens` passe ; les noms et valeurs de `tokens.ts` égalent ceux de `get_variable_defs` (test qui compare à un export JSON des variables).
**Preuve attendue** : `npm run dev` affiche une page aux couleurs du thème (capture) ; `npm test` vert ; sortie de `npm view <paquet> time.modified` pour chaque paquet ; **test de l'agent neuf** : un sous-agent qui n'a lu que `docs/design/system/README.md` génère un panneau d'exemple, et `check-tokens` ne trouve aucune valeur arbitraire.
Demander d'abord : rien (paquets nommés, installs acceptées).

### Tâche 1 — Données réelles et mesure du risque
But : les vrais chiffres de toutes les communes dans des fichiers statiques, et la réponse à *Le risque* : la carte de ~35 000 communes réagit-elle en ≤ 100 ms et pèse-t-elle un poids raisonnable ?
Entrées : sources de la discovery (COG 2025, Carte des loyers 2025, Limite terre-mer Shom-IGN 2021 ouverte avec `bsdtar`, centres et populations geo.api.gouv.fr, H5, H6) ; contours des communes 2025 d'Etalab (issus d'Admin Express IGN, Licence Ouverte : 1,5 Mo compressé à 1 000 m, 8,2 Mo à 100 m, mesuré le 2026-10-12) ; D10 (Paris, Lyon, Marseille d'un seul tenant, moyenne simple des arrondissements) ; défaut de l'Adour (details.md, Cas limites).
Sorties : `scripts/data/*.py` ; `public/data/communes.json` (code INSEE → nom, département, population, loyer au m², estimation propre ou non, km de la mer) et les formes ; un rapport `docs/plans/2026-10-12-loyer-mer/mesure-tache-1.md` ; la mention de la source des formes et de son millésime ajoutée à `CLAUDE.md` (Données). Une page de mesure jetable (`probe/`), supprimée à la fin de la tâche.
Fichiers : `scripts/data/` (≤ 4), `public/data/` (2), `probe/` (jetable), `CLAUDE.md`.
Tests : contrôles du script : nombre de communes de métropole (attendu ≈ 34 746 avec la Corse, Paris, Lyon et Marseille fusionnées), communes sans loyer, sans distance ou sans population (attendu 0, details.md), Port-de-Lanne, Saint-Étienne-d'Orthe et Sames au-delà de 2 km de la mer, Bordeaux 832 € et ≈ 40 km, La Rochelle ≈ 1 km (spec, « C'est réussi si »). Aucun code d'interface testé ici.
**Preuve attendue** : sortie des contrôles ; poids compressé de chaque fichier ; temps de recoloration complète (35 000 communes) mesuré (a) dans Chromium avec le processeur ralenti ×4, (b) **sur le téléphone de Vincent** par le Wi-Fi local (`vite --host`, rien ne sort de la maison), pour deux méthodes (états par commune ; une seule expression de couleur) ; captures de la carte entière et d'un zoom sur Douarnenez pour juger la finesse. Décision écrite : finesse et format retenus. **Si aucune méthode ne tient 100 ms sur le téléphone, ou si le chargement dépasse ~10 Mo compressés : arrêt et retour à Vincent.**
Demander d'abord : 5 minutes de Vincent avec son téléphone.

### Tâche 2 — Squelette : la carte se colore et réagit aux plafonds
But : on ouvre la page, la France des communes est colorée selon les réglages de départ ; bouger le loyer ou la mer recolore aussitôt.
Entrées : R1, R2, R3, D4, D5, D16, H1, H2, H3, H9, H10 (D17 : 88 % / 70 % / 70 %) ; frames `5:2` ; composants Curseur, Légende.
Sorties : `src/domain/score.ts` (passage, notes, score affiché, palier) ; la carte (fond Plan IGN atténué + estompage, communes colorées, communes qui ne passent pas non peintes) ; panneau de réglages avec les deux curseurs (« Sans limite » au dernier cran) ; légende.
Fichiers : `src/domain/score.ts`, `src/domain/format.ts`, `src/map/MapView.tsx`, `src/map/style.ts`, `src/ui/Settings.tsx`, `src/ui/Legend.tsx`, `src/App.tsx`.
Tests : AC-1, AC-2, AC-3, AC-5 (Vitest sur `score.ts`, fixture), AC-6 (Playwright : couleur neutre de la légende, pas de score).
**Preuve attendue** : capture à 1440 px avec les vraies données, comparée à la frame `5:2` ; temps mesuré entre un réglage et la fin de la recoloration (≤ 100 ms, H9) sur la machine.
Demander d'abord : rien.

### Tâche 3 — Les 10 premières et la taille de ville
But : la liste dit combien de communes passent et montre les 10 meilleures ; les pastilles de taille filtrent.
Entrées : R5, H4, D6, D11, cas « population sur un seuil » ; D17 (compte « Aucune commune ne passe tes critères », pas de compte sans plafond) ; frames `5:2`, tableau `9:514` ; composants Ligne de liste, Pastille.
Sorties : `src/ui/List.tsx`, `src/ui/SizeChips.tsx` ; le compte annoncé aux lecteurs d'écran (`aria-live`) ; messages « aucune commune » et « sans plafond ».
Fichiers : `src/ui/List.tsx`, `src/ui/SizeChips.tsx`, `src/domain/score.ts` (filtre de taille), `src/App.tsx`.
Tests : AC-4 (Vitest + Playwright pour le format de ligne).
**Preuve attendue** : capture de la liste réelle (« 269 communes passent tes critères » attendu avec 1 200 €, 60 km, Petite ville + Ville moyenne, d'après le prototype) ; parcours au clavier de la liste.
Demander d'abord : rien.

### Tâche 4 — La fiche, le zoom et les ronds du top 10
But : choisir une commune (liste, rond ou carte) ouvre sa fiche à la place de la liste et zoome sur elle ; « ← Les 10 premières » revient.
Entrées : R1 (raisons), R4, R6, D12, D14, D17 (intitulé « Ne passe pas tes critères », pastille du palier, ronds regroupés au-delà de 50 % de chevauchement) ; frames `5:154`, `5:235` ; composants Fiche, Rond du top 10, Bouton (Lien).
Sorties : `src/ui/Fiche.tsx`, `src/map/RankMarkers.ts` (ronds, regroupement, clic) ; double contour de la commune choisie ; zoom en ≤ 500 ms.
Fichiers : `src/ui/Fiche.tsx`, `src/map/RankMarkers.ts`, `src/map/MapView.tsx`, `src/domain/format.ts`, `src/App.tsx`.
Tests : AC-7, AC-8, AC-9, AC-10 (Playwright, fixture ; le clic « sur la carte » d'AC-9 vise le centre du carré de Montcher).
**Preuve attendue** : captures de la fiche de Douarnenez et de Bordeaux grisée (vraies données), comparées aux frames `5:154` et `5:235` ; capture du Pas-de-Calais où Outreau, Boulogne et Calais forment un groupe.
Demander d'abord : rien.

### Tâche 5 — L'adresse de la page, les états et les mentions
But : l'adresse garde les réglages et rouvre la même carte ; la page tient le chargement, l'erreur, l'absence de WebGL et la panne du fond IGN ; les mentions obligatoires sont là.
Entrées : R7, R8 (D17 : fond de secours avec `area-excluded`, mer, voisins, trait de côte), H7, H9 ; états de details.md ; tableau `9:514` ; frame `5:314` ; mentions de `CLAUDE.md` (sauf openrouteservice et OpenStreetMap, inutilisés dans cette tranche) ; logos Shom et IGN récupérés sur leurs sites, avec leurs liens.
Sorties : `src/domain/url.ts` ; états chargement, erreur (+ « Réessayer »), fond indisponible ; pied de page des mentions avec logos ; les formes de mer, voisins et trait de côte pour le fond de secours (fichier statique léger, tiré des contours Etalab et de la Limite terre-mer).
Fichiers : `src/domain/url.ts`, `src/ui/Status.tsx`, `src/ui/Mentions.tsx`, `src/map/fallback.ts`, `public/logos/*`, `src/App.tsx`.
Tests : AC-11, AC-12, AC-13, AC-14 (Vitest sur `url.ts` + Playwright pour l'historique d'AC-13), AC-15 (Playwright, fond IGN bloqué par interception réseau).
**Preuve attendue** : captures des états chargement, erreur et fond indisponible ; parcours 1 à 5 de la « Vérification de bout en bout » de details.md, en local, à 1440 px.
Demander d'abord : rien.

### Tâche 6 — 390 px et passage au clavier
But : à 390 px, la carte en haut et la feuille en bas ; une fiche ouverte remplace les réglages ; tout se fait au clavier en bureau.
Entrées : frames `7:343`, `7:488`, `11:667` ; contrat (cibles 44 px, pastilles `space-2`, zoom 44 × 44) ; details.md (Exceptions d'accessibilité).
Sorties : la feuille (`src/ui/Sheet.tsx`), la mise en page responsive, le zoom centré dans la bande visible.
Fichiers : `src/ui/Sheet.tsx`, `src/App.tsx`, `src/map/MapView.tsx`, `src/index.css`.
Tests : aucun nouveau critère ; tous les AC Playwright repassent à 390 px.
**Preuve attendue** : captures à 390 px (liste, fiche), comparées aux frames ; parcours de la « Vérification de bout en bout » à 390 px ; parcours au clavier seul enregistré (capture de chaque focus).
Demander d'abord : rien.

## Répartition des critères
AC-1, 2, 3, 5, 6 → tâche 2 · AC-4 → tâche 3 · AC-7, 8, 9, 10 → tâche 4 · AC-11, 12, 13, 14, 15 → tâche 5. Chaque critère dans une seule tâche ; les tests d'une tâche repassent à chaque tâche suivante.

## Reporté
- Mesure d'audience sans cookie (condition de publication du plan de distribution) → `/ship`.
- Création et branchement du compte Cloudflare Pages, premier déploiement → `/ship`.
- L'écran « Bureau — sans plafond » (pas dessiné) : jugé sur le build en tâche 3.
- Tuiles vectorielles (PMTiles) : seulement si la tâche 1 le demande, avec l'accord de Vincent pour installer tippecanoe.

## Risques et hypothèses du plan
- **La carte de 35 000 communes est trop lente ou trop lourde sur téléphone** (*Le risque* de la spec) → mesurée en tâche 1 avant toute interface ; repli : formes plus simples, tuiles vectorielles, ou retour à Vincent.
- **Les contours Etalab 2025 ne collent pas au COG 2025** (le prototype avait 493 codes orphelins) → contrôle de jointure en tâche 1 ; attendu 0 orphelin.
- **Le navigateur de test perd WebGL** (vu le 2026-10-12) → Chromium de Playwright lancé avec le rendu logiciel autorisé ; si ça échoue, les AC visuels passent par la fixture et l'état « erreur » est testé à part.
- **La Géoplateforme répond lentement ou change son style** → R8 et AC-15 couvrent la panne ; le style est référencé par son adresse publique, pas copié.
- **Les logos Shom et IGN ont des conditions d'usage** → lues en tâche 5 avant de les poser ; sinon, texte et liens, et la question revient à Vincent.
- **Plus de 6 tâches pour un projet perso** (7 ici) → déjà accepté par Vincent dans la spec (« au-dessus du gabarit perso, ~8 tâches ») ; si une tâche déborde, la tâche 6 se réduit d'abord.
