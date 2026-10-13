# Plan — proches
2026-10-13 · validé (révisé après [review-plan.md](review-plan.md)) · Spec : [spec.md](../../specs/2026-10-13-proches/spec.md) (D1–D14) · Critères : [acceptance.json](../../specs/2026-10-13-proches/acceptance.json) (13 actifs ; AC-12, AC-13, AC-15 reportés par D14) · Design : [README](../../design/proches/README.md) · Système : [contrat](../../design/system/README.md)
(La stack et les commandes vivent dans `CLAUDE.md`, pas ici. Le site existe : tranche loyer-mer construite.)

## Ce que /build fera seul, et ce qu'il demandera
Seul : tout ce qui est décrit ici, y compris des requêtes GET à la Géoplateforme IGN (recherche d'adresse, isochrones) avec des **adresses publiques seulement** (mairies, « 12 rue de la Paix, Nantes », « place du Capitole, Toulouse ») — accord de Vincent du 2026-10-13. Jamais une adresse personnelle ; jamais ORS.
Demandera : tout paquet (aucun n'est prévu) ; 5 minutes de Vincent avec son téléphone, deux fois (tâches 0 et 5) ; pousser ou déployer (`/ship`).
S'arrête si : bloqué · 3 corrections ratées · hors périmètre · action à accord · **une condition d'arrêt de la tâche 0 est atteinte** (retour à Vincent avant toute autre tâche).
Relectures à la fin, par des agents neufs (perso) : code-reviewer, qa-tester (interface).

## À respecter dans chaque tâche
- **Ne change pas** : les 15 critères de loyer-mer (AC-1 à AC-15 de `docs/specs/2026-10-12-loyer-mer/acceptance.json`) restent verts à chaque tâche, navigateur sans proche gardé.
- **Aucun appel réel à l'IGN dans les tests.** Playwright intercepte `data.geopf.fr/geocodage/completion*` et `data.geopf.fr/navigation/isochrone*` avec un faux service tiré de la fixture (`fixture.services` d'acceptance.json) : la recherche renvoie les suggestions du texte tapé, au format réel de l'IGN (relevé en tâche 0) ; l'isochrone d'une adresse et d'une durée D renvoie une zone qui contient la mairie (`mairie` de la fixture) de chaque commune dont la fin de tranche est ≤ D, et aucune autre (par ex. un petit carré autour de chaque mairie retenue). Délai de 1 s par calcul de proche (`fixture.services.délais`). Les pannes (`fixture.services.pannes`) se simulent par une erreur réseau. Le faux service vit dans un seul fichier d'aide aux tests, partagé par toutes les tâches.
- **Point d'une commune** : sa mairie, dans `public/data/reperes.json` (D18 de loyer-mer). Toujours par code INSEE.
- Jetons seulement (`npm run check-tokens`) ; composants du contrat ; le code fait foi pour ce qui existe, Figma (page « proches ») pour ce qui est nouveau.
- Leçons à relire : `docs/solutions/` étiquettes perf, tests, build (recoloration MapLibre, adresse sous Safari, fixture dans le cadre, preuve d'une couleur au pixel).

## Rappel à recopier par chaque constructeur (il est aussi dans chaque tâche qui en dépend)
- **Faux service IGN** : un seul fichier, `tests/e2e/lib/ign.ts` (créé en tâche 2a), qui pose ses `page.route` **après** l'interception existante `data.geopf.fr/**` de `tests/e2e/lib/carte.ts` (dans Playwright, la dernière route posée gagne) ; recherche au format réel relevé en tâche 0 ; isochrone : une zone qui contient la mairie de chaque commune de la fixture dont la fin de tranche est ≤ la durée demandée ; **chaque requête d'isochrone répond après 1 s / 24**, de sorte qu'un proche entier dure environ 1 s ; pannes par erreur réseau ; une réponse 429 compte comme une panne (R13).
- **Code INSEE** : jamais par le nom. La recherche IGN ne le renvoie pas : on le prend par la recherche inverse de l'IGN au point choisi (`/geocodage/reverse`, méthode confirmée en tâche 0) ; le département (2A, 2B compris) vient de ce code ; une commune choisie seule part de sa mairie (`reperes.json`, même code).
- **Mémoire du navigateur** (R12) : une entrée par proche ; ses temps en un tableau de 34 746 entiers 16 bits dans l'ordre de `communes.json` (0 = plus de 6 h), encodé en base64 (≈ 93 Ko par proche, ≈ 465 Ko pour 5) ; avec une empreinte de la liste des codes INSEE : si elle ne correspond plus, le proche revient **indisponible**.
- **Adresses saisies** : leur traitement est décidé par la spec (D6, D7, D12, H28, H30) ; tout écart (autre service, stockage, journal) se demande d'abord à Vincent (CLAUDE.md).
- **Tests à 390 px** : la suite Playwright tourne déjà aux deux largeurs ; un test qui n'a de sens qu'en bureau ou qu'à 390 px le dit (`test.skip` conditionnel, comme dans loyer-mer).

## Tâches
### Tâche 0 — Mesurer le calcul IGN et la recoloration (Le risque)
But : savoir, avant tout écran, si un proche se calcule en ≤ 10 s, si les conditions de l'IGN le permettent, et si la carte se recolore encore en ≤ 100 ms avec 7 critères.
Entrées : spec D2, D6, H20, H21, *Le risque* ; `public/data/reperes.json` ; `src/domain/score.ts` ; getcapabilities lu le 2026-10-13 (`https://data.geopf.fr/navigation/getcapabilities` : isochrone `costValue` jusqu'à 50 000, ressources `bdtopo-valhalla`, `bdtopo-osrm`, `bdtopo-pgr`) ; autocomplétion testée le 2026-10-13 (`https://data.geopf.fr/geocodage/completion/?text=…` : renvoie `x`, `y`, `city`, `zipcode`, `fulltext`, `metropole`, sans code INSEE).
Sorties : une page de mesure jetable dans `probe/` (non versionné) ; le rapport `docs/plans/2026-10-13-proches/mesure-tache-0.md` avec chiffres, captures et décisions techniques.
Mesures :
(a) Un isochrone de 6 h depuis la mairie de Nantes (`bdtopo-valhalla`, puis `bdtopo-osrm` si le premier échoue) : réussite, temps de réponse, poids de la réponse, nombre de sommets.
(b) Les 24 isochrones d'une adresse (15 min à 6 h par 15 min), lancés sans dépasser 5 par seconde : temps total jusqu'au dernier, poids total ; depuis « 12 rue de la Paix, Nantes » et « place du Capitole, Toulouse ».
(c) Le classement des 34 746 mairies dans ces 24 zones, dans le navigateur : temps, avec et sans un Web Worker (natif, sans paquet) ; fin de tranche de Bordeaux (33063) et de La Rochelle (17300) depuis les deux adresses, comparée à l'itinéraire IGN de mairie à mairie (attendu Nantes → Bordeaux : 3 h 45, l'IGN donnait 3 h 34).
(d) La réaction à un réglage avec loyer, mer et 5 proches (temps simulés) : médiane sur 10 essais, version construite, processeur ralenti ×4 (même méthode que la mesure de loyer-mer).
(e) La recherche : les types de réponses à demander (adresses et communes) et leur format exact (gardé comme exemple pour le faux service) ; la recherche inverse `/geocodage/reverse` au point choisi rend-elle le code INSEE (`citycode`) — y compris en Corse (2A, 2B) et pour une commune seule ; les paramètres d'isochrone retenus (ressource, `profile=car`, `direction=departure`, `costType=time`, `timeUnit`, format des zones).
(f) Les conditions d'usage de la Géoplateforme pour un site public appelant depuis le navigateur du visiteur : texte cité, avec son lien et sa date ; la mention à afficher.
(g) Sur le téléphone de Vincent, par le Wi-Fi local (`npx vite --host`) : le temps de (b) pour une adresse, modèle noté.
**Preuve attendue** : le rapport, avec les chiffres, les sorties brutes et une capture des 24 zones de Nantes sur la carte. **Conditions d'arrêt (retour à Vincent)** : plus de 10 s par proche sur le Mac (H21) ; plus de 30 s sur le téléphone (délai d'échec de H21) ; une réponse de 6 h refusée par les trois ressources ; des conditions d'usage qui interdisent l'appel depuis un site public ; une réaction au réglage au-delà de 100 ms (H9 de loyer-mer) — la mesure acceptée pour loyer-mer était de 102 ms dans les mêmes conditions : si l'écart avec 2 critères reste sous 20 ms, on continue et on le note, sinon retour à Vincent.
Fichiers : `probe/*` (jetable), le rapport.
Demander d'abord : rien (requêtes à adresses publiques autorisées).

### Tâche 1 — Catégories repliables
But : le panneau de gauche a des catégories qui s'ouvrent et se ferment (Loyer, Mer, Taille de ville), avec leur résumé quand elles sont repliées.
Entrées : design `decisions.md` (« Catégories repliables ») ; composant Figma « Catégorie repliable » `20:180` ; contrat (motif `h2 > button[aria-expanded]`, cibles 24 px en bureau et 44 px à 390 px).
Sorties : un composant de catégorie repliable ; Loyer, Mer, Taille de ville l'utilisent ; toutes ouvertes à l'ouverture de la page ; résumés « 1 200 € », « 60 km », « Sans limite », « Peu importe » ou les tailles cochées.
Fichiers : `src/ui/Categorie.tsx` (nouveau), `src/ui/Settings.tsx`, `src/ui/SizeChips.tsx`, un test e2e.
Tests : e2e « replier Loyer affiche 1 200 € et cache le curseur ; le clavier ouvre et ferme » ; les 15 AC de loyer-mer verts.
**Preuve attendue** : captures bureau et 390 px, catégories ouvertes et repliées ; sortie de `npm test`.
Demander d'abord : rien.

### Tâche 2a — Calculer les temps d'un proche
But : à partir d'une adresse choisie, obtenir pour chaque commune la fin de sa tranche de temps, et des scores qui en tiennent compte (sans interface encore).
Entrées : R10, R11, D2, D5, D6, D11, H21 (file, ≤ 5 requêtes par seconde), H22, H24, H28 ; décisions de la tâche 0 (ressource, paramètres, classement avec ou sans Web Worker, recherche inverse) ; rappel ci-dessus (faux service, code INSEE).
Sorties : un module IGN (recherche, recherche inverse, isochrones) ; le classement des mairies en fins de tranche ; `evaluer` accepte les proches prêts (R11) ; la raison « proche » et les formats de durée (H22) ; le faux service `tests/e2e/lib/ign.ts`.
Fichiers : `src/proches/ign.ts`, `src/proches/temps.ts`, `src/domain/score.ts`, `src/domain/format.ts`, `tests/e2e/lib/ign.ts`, tests unitaires (≤ 3 fichiers).
Tests : unitaires — fin de tranche d'une mairie dans des zones emboîtées ; « plus de 6 h » hors de toutes ; note et score avec les valeurs de la fixture (59, 62/21, 47/27, 43/0 : les valeurs d'AC-1, AC-2, AC-4, AC-6, mais ces tests unitaires ne portent pas leurs numéros, qui appartiennent à la tâche 2b) ; formats « 15 min », « 3 h 30 », « plus de 6 h ».
**Preuve attendue** : un petit script lancé sur le vrai IGN depuis « 12 rue de la Paix, Nantes » qui écrit le temps de calcul et les fins de tranche de Bordeaux (33063) et La Rochelle (17300) ; `npm test` vert (les 15 AC de loyer-mer compris).
Demander d'abord : rien (adresses publiques seulement).

### Tâche 2b — Ajouter un proche dans le panneau
But : on cherche une adresse ou une ville, on la nomme, « Ajouter » ; après le calcul, le proche a son plafond, et la carte et la liste en tiennent compte.
Entrées : R9 (sauf doublon et plein), R11, D3, D4, D13 (le lien « + Ajouter un proche » dès un proche), H19, H20, H30 ; AC-1, AC-2, AC-4, AC-6 ; Figma `21:562`, `22:486`, `26:1588` ; composants « Ligne de proche » `20:168` (états Prêt et Calcul), « Suggestion d'adresse » `18:151` ; jetons `place-marker` et `place-marker-foreground` (variables Figma `VariableID:17:680`, `17:681`) ; rappel ci-dessus (faux service posé après `carte.ts`, mémoire non encore gardée).
Sorties : jetons ajoutés ; la zone « Tes proches » (catégorie repliable de la tâche 1) : vide (texte de details.md, champ), recherche (≤ 5 suggestions, 300 ms), champ « Nom » prérempli, « Ajouter », état **calcul** puis **prêt** avec curseur 15 min → 6 h, lien « + Ajouter un proche » dès un proche ; la liste et la carte suivent ; l'adresse de la page ne change pas.
Fichiers : `src/theme/tokens.ts`, `src/theme/figma-variables.json`, `src/proches/useProches.ts`, `src/ui/Proches.tsx`, `src/ui/LigneProche.tsx`, `src/App.tsx`, les tests e2e.
Tests : AC-1, AC-2, AC-4, AC-6 (Playwright, faux service).
**Preuve attendue** : sur les vraies données et le vrai IGN, ajouter « 12 rue de la Paix, Nantes » nommé « Parents de Léa », puis « Toulouse » choisi comme commune : captures du panneau et de la liste après calcul, temps de calcul, adresse de la page relue.
Demander d'abord : rien.

### Tâche 3 — États, pannes et mémoire du navigateur
But : plusieurs proches se suivent, on peut retirer ou réessayer, les pannes ne cassent rien, et les proches reviennent à la réouverture.
Entrées : R9 (doublon, plein), R12, R13, H21 (délai de 30 s), D7 ; rappel ci-dessus (faux service, 429 = panne, format de la mémoire) ; AC-7, AC-8, AC-9, AC-10, AC-11 ; tableau des états Figma `23:1616` ; Figma `22:640` ; « Ligne de proche » états En attente, Calcul, Indisponible ; décisions de design (résumé replié « 3 · 1 en calcul »).
Sorties : file de calcul (un à la fois, délai compté depuis le début de chaque calcul) ; « Retirer » pendant le calcul ; **indisponible** + « Réessayer » ; « Aucune adresse trouvée. », « Recherche d'adresse indisponible. Réessaie dans un moment. », « Cette adresse est déjà dans tes proches. » ; plein (5) ; « Effacer mes proches » ; mémoire du navigateur (adresse, point, nom, plafond, temps par code INSEE), réouverture sans calcul, proche pas prêt → indisponible, mémoire refusée → message ; résumé de la catégorie repliée.
Fichiers : `src/proches/useProches.ts`, `src/proches/memoire.ts` (nouveau), `src/ui/Proches.tsx`, `src/ui/LigneProche.tsx`, `src/ui/Categorie.tsx` (résumé), les tests.
Tests : AC-7, AC-8, AC-9, AC-10, AC-11 ; e2e hors AC : deux proches ajoutés d'affilée (le second « En attente… ») ; délai de 30 s simulé (horloge de Playwright) ; réponse 429 → indisponible ; « Retirer » pendant le calcul ; doublon ; aucune adresse ; mémoire refusée (stockage qui lève une erreur) ; empreinte qui ne correspond plus → indisponible ; taille de la mémoire avec 5 proches écrite dans la preuve.
**Preuve attendue** : captures de chaque état du tableau `23:1616` qui concerne le panneau, atteint dans le navigateur avec le faux service (les états des repères et des pastilles sont prouvés en tâche 4 ; « mer en minutes inconnue » est reporté) ; sur le vrai IGN, fermer et rouvrir le navigateur : proches revenus sans requête (journal réseau joint).
Demander d'abord : rien.

### Tâche 4 — Repères, pastilles et fiche
But : on voit ses proches sur la carte, les temps d'une ville en haut de la carte, et le détail dans la fiche.
Entrées : D4, D8, D10, D11, R10, R15, R1 étendue (raisons), message « aucune commune » avec un proche ; AC-3, AC-5, AC-14, AC-16 ; composants « Repère proche » `18:144`, « Pastille de temps » `18:145` ; Figma `21:562`, `22:307`, `22:640` ; décisions de design (étiquette à droite, à gauche en cas de chevauchement ; au-dessus des ronds du top 10 ; anneau fixe si mouvement réduit) ; jetons `place-marker`, `place-marker-foreground` (variables Figma `VariableID:17:680` et `17:681`).
Sorties : repères MapLibre (Prêt, Calcul, Indisponible), non cliquables ; pastilles de temps en bureau (`ul` « Temps vers tes proches ») ; fiche : lignes des proches et raisons ; texte « … ou un proche. » de la liste vide ; mention « © IGN – Géoplateforme » étendue à la recherche d'adresse et aux trajets (texte retenu en tâche 0, f), ajouté aussi à la ligne Mentions de CLAUDE.md.
Fichiers : `src/map/ProcheMarkers.ts` (nouveau), `src/map/MapView.tsx`, `src/ui/Pastilles.tsx` (nouveau), `src/ui/Fiche.tsx`, `src/ui/List.tsx`, `src/ui/Mentions.tsx`, `src/App.tsx`, `CLAUDE.md`.
Tests : AC-3, AC-5, AC-14, AC-16 — pour AC-14, le point [-2, 3] est hors du cadre de la carte de test : le test lit la position du repère (coordonnées portées par le marqueur, par ex. `data-lng`, `data-lat`), pas un pixel ; e2e hors AC : étiquette passée à gauche quand deux repères se chevauchent ; anneau sans animation avec `prefers-reduced-motion` (émulé par Playwright) ; repère au-dessus d'un rond du top 10 (ordre d'empilement).
**Preuve attendue** : captures bureau : 2 proches sans ville choisie, puis Bordeaux choisie (pastilles « 3 h 45 », fiche), puis 5 proches dont un en calcul et un indisponible ; repère lisible sur un palier `score-3` (capture zoomée).
Demander d'abord : rien.

### Tâche 5 — 390 px et vérification de bout en bout
But : tout marche sur téléphone, et la vérification de bout en bout de details.md passe sur les vraies données.
Entrées : Figma `23:835`, `27:1160` ; H11 et H12 de loyer-mer ; contrat (44 px au toucher) ; details.md « Vérification de bout en bout ».
Sorties : à 390 px, « Tes proches » dans la feuille entre la taille et la liste ; la feuille monte en haut tant que le champ a le focus (suggestions au-dessus du clavier) ; pas de pastilles ; cibles de 44 px (liens, titres de catégorie, suggestions).
Fichiers : `src/App.tsx`, `src/ui/Proches.tsx`, `src/ui/LigneProche.tsx`, `src/ui/Categorie.tsx`, un test e2e à 390 px.
Tests : e2e 390 px « champ au focus : la feuille est en haut et la première suggestion est visible » ; toute la suite verte aux deux largeurs.
**Preuve attendue** : les 4 étapes de la vérification de bout en bout (details.md), captures bureau et 390 px ; sur le téléphone de Vincent, ajout d'un proche avec le clavier ouvert (capture ou retour écrit).
Demander d'abord : rien.

## Reporté
- Mer en minutes (D14) : R14, H23, H25, H27, AC-12, AC-13, AC-15, le composant « Bascule mer ».
- Partage (« Copier le lien », proches dans le lien) : tranche suivante, avant /launch.

## Risques et hypothèses du plan
- **L'isochrone de 6 h est trop lent ou trop lourd** → tâche 0 (a, b, g) ; si oui, retour à Vincent (pistes : tranches plus larges au-delà de 3 h, ou plafond max plus bas).
- **Les conditions de l'IGN interdisent l'appel depuis le navigateur d'un site public** → tâche 0 (f) ; si oui, retour à Vincent.
- **Classer 35 000 mairies dans 24 zones bloque la page** → tâche 0 (c) mesure le Web Worker ; la décision est écrite dans le rapport.
- **La limite de 5 requêtes par seconde est par adresse IP** : plusieurs onglets ou un réseau partagé peuvent la dépasser → la file espace les requêtes (tâche 2a) ; un refus (429) compte comme une panne (R13), testé en tâche 3.
- **Corse et communes seules** (nom proposé, départ de la mairie) → tâche 0 (e).
- **Réaction avec 7 critères** → tâche 0 (d) ; seuil : 100 ms de H9, avec la marge de 20 ms sur les 102 ms acceptées pour loyer-mer (validé par Vincent avec le plan, 2026-10-13).
- **Mémoire du navigateur** : ≈ 465 Ko pour 5 proches en base64 (Safari limite autour de 5 Mo) → format fixé dans le rappel, taille mesurée en tâche 3.
