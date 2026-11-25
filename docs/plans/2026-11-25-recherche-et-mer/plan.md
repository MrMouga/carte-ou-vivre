# Plan — recherche et mer en minutes
2026-11-25 · validé · révisé après [review-plan.md](review-plan.md) · Spec : [spec.md](../../specs/2026-11-25-recherche-et-mer/spec.md) (D1–D9, amendée en /ui : D5 révisée, D9) · Détails : [details.md](../../specs/2026-11-25-recherche-et-mer/details.md) (R58–R63, H177–H196) · Critères : [acceptance.json](../../specs/2026-11-25-recherche-et-mer/acceptance.json) (AC-1 à AC-13) · Critères à recaler : [criteres-a-recaler.md](../../specs/2026-11-25-recherche-et-mer/criteres-a-recaler.md) · Design : [README](../../design/recherche-et-mer/README.md) (piste C, minutes seules)
(La stack et les commandes vivent dans `CLAUDE.md`, pas ici. Le site existe : neuf tranches construites et en ligne.)

## Ce que /build fera seul, et ce qu'il demandera
Seul : tout ce qui est décrit ici. En validant ce plan, Vincent accepte aussi le changement du modèle de données : une colonne `mer_min` de plus à la fin de `public/data/communes.json`, et un fichier servi de plus, `public/data/codes-postaux.json`. S'y ajoutent deux tables versionnées : `scripts/data/mer-retraits.csv` (D8) et le recalage des critères.

**Choix de Vincent du 2026-11-25** :
- Un seul plan, huit tâches (la tâche 3 coupée en deux après la relecture), au-dessus du cadre perso (six).
- Le recalage des critères protégés passe par **un tableau et un seul accord** (tâche 0c).
- Les minutes sont **jugées à la démo** (tableau préparé en tâche 0b, retrait par une ligne de table, D8), sans arrêt de /build.

**Accordé en validant ce plan** (seules ces exceptions ; si le garde-fou des tests protégés redemande, la réponse est cet accord) :
- **Tâche 2** : `tests/e2e/lib/carte.ts` gagne la fabrication de `codes-postaux.json` depuis les `codes_postaux` des communes du jeu qui en portent, et l'interception `**/data/codes-postaux.json` dans `servirFixture`, pour tous les jeux. **Tâche 3** : il gagne la colonne `mer_min` de `communes.json`. **Aucune ligne existante n'est changée**, sauf la liste `champs`, qui gagne `mer_min` à la fin. Règle (décidée ici) : `carte.ts` lit `mer_min` et `codes_postaux` dans `docs/specs/2026-11-25-recherche-et-mer/acceptance.json`, **par code INSEE**, comme il lit déjà cadre-de-vie (`cadreParCode`), pour tous les jeux, « métropole » compris ; une commune de jeu sans `mer_min` dans ce fichier reçoit ses km servis arrondis à la minute, moitié vers le haut (H191), sauf si le tableau validé de la tâche 0c en dit autrement.
- **Tâche 0b** : `scripts/data/communes.test.ts`, ligne 76, `expect(champs.slice(-2)).toEqual(['type_env', 'montagne_km'])` devient `slice(-3)` avec `mer_min` à la fin. Rien d'autre dans ce fichier.
- **Tâche 4** : les tests protégés qui lisent le pied de page en bureau, ajustés **pour le seul déplacement** des mentions dans le panneau de réglages. Candidats : `cadre-de-vie`, `etats`, `emploi`, `mairies`, `immobilier`, `telephone-feuille`, `services`. Aucun texte attendu ne change, ni aucun `given / when / then`. Ces tests trouvent les mentions par leur rôle (`getByRole('contentinfo')`), que `Mentions.tsx` pose lui-même : peu devraient casser.
- **Tâche 3b** : les réécritures de critères et de tests du tableau de la tâche 0c, **une fois que Vincent l'a validé** (arrêt de la tâche 0c), et seulement elles.

Tout autre test protégé qui casse, ou toute modification que ces règles ne couvrent pas : **arrêt et question**.

**Demandera** :
- les **conditions d'arrêt** de chaque tâche ;
- **l'envoi à openrouteservice**, que Vincent lance lui-même (règle du projet : l'agent n'envoie jamais de requête POST), à la fin de la tâche 0a ;
- **l'accord sur le tableau de recalage**, à la fin de la tâche 0c (les deux arrivent dans le même arrêt) ;
- tout paquet (aucun n'est prévu) ;
- pousser ou déployer (`/ship`).

**S'arrête si** : bloqué · 3 corrections ratées · hors périmètre · action à accord · une condition d'arrêt d'une tâche.

**Relectures à la fin, par des agents neufs (perso)** :
- un code-reviewer ;
- un qa-tester : bureau 1 280 × 800, 390 × 844, 375 × 548 au toucher, clavier, lecteur d'écran pour les annonces de H186. Il couvre aussi ce que /ui n'a pas jugé : vrais temps, vrais codes postaux, la montagne en km sous la mer en minutes.

## À respecter dans chaque tâche
- **Ne change pas** : sans recherche faite, les critères des tranches passées qui ne lisent pas la mer en km (détails, « Ne change pas »). Ceux qui la lisent sont recalés en tâche 3b, selon le tableau validé en 0c. Avant la tâche 3b, toute la suite (`npm test`) passe à chaque tâche ; après, elle passe avec les critères recalés.
- **Jointure par code INSEE** (CLAUDE.md), jamais par nom ni par position. Paris, Lyon, Marseille sont d'un seul tenant (75056, 69123, 13055) ; leurs codes postaux sont ceux de leurs arrondissements (R58).
- **Rien de ce qui est tapé ne part ailleurs** (D3). La recherche lit les noms déjà sur la page (`communes.json`) et le fichier `codes-postaux.json` du site, demandé une fois, à la première prise de focus (H187). **Pendant la saisie**, aucune autre requête ne part, et aucune requête ne contient le texte tapé. Les tuiles chargées par le cadrage, après un choix, sont attendues. AC-1 le vérifie en relevant toutes les requêtes pendant la frappe.
- **Le fichier des codes (décidé ici)** : `public/data/codes-postaux.json` = `{ "<code postal>": ["<code INSEE>", …] }`, codes INSEE de `communes.json` seulement, après recalage sur le COG 2025 (détails, cas limites). Au plus **200 Ko en `brotli -q 3`** (H195 ; la compression de l'hébergeur, leçon du 2026-11-24 ; `brotli` est sur la machine), sinon arrêt.
- **Les minutes (décidé ici)** : une colonne `mer_min` à la fin de `communes.json`, ajoutée à `champs`. Valeur : minutes entières, déjà arrondies une seule fois (H191), ou `null` pour une commune sans temps (H196). La page ne recalcule rien : elle affiche et compare la valeur servie (leçon du double arrondi, 2026-10-15). Au plus **60 Ko de plus en `brotli -q 3`** (H195), sinon arrêt : un fichier à part, chargé après la carte, devient une décision de Vincent.
- **openrouteservice** :
  - L'agent **n'envoie aucune requête**. Il écrit et teste le script (sans réseau) ; Vincent le lance.
  - Clé dans `~/.config/openrouteservice/key`, jamais affichée ni écrite ; adresse `https://api.heigit.org/openrouteservice/v2/matrix/driving-car` (leçon du 2026-11-24 : l'ancienne n'a que 10 % du quota).
  - 40 requêtes par minute, 500 par jour ; reprise sans renvoyer les lots déjà faits.
  - Résultats gardés dans `data-raw/mer-calcul/` (non versionné) ; ne pas relancer une fois fait (comme H171 de services).
- **Point de côte** : celui qui donne les km (D4), trouvé par le code de `scripts/data/mer.py`, importé et non recopié. Une fonction qui rend le point, à côté de celle qui rend les km. Les km de `communes.json` ne changent pas.
- **`mer=aucun`** (18 occurrences dans les critères et les tests, et toute autre valeur de `mer`) : ancien lien, ignoré et retiré de l'adresse réécrite comme les autres (D9). Il ne devient pas `mer-min`.
- **Suggestions** (décidé ici) : le nom accessible d'une option est « Grandeville (33) » ou « 33991 · Grandeville (33) », exactement ; la ligne de population est `aria-hidden` (aide visuelle seulement). Les tests lisent le nom accessible de l'option.
- **Référence du design** : prototype de la branche `prototype/recherche-et-mer`, commit `e9515a1`.
  - Code : `git show e9515a1:src/proto/Recherche.tsx`, avec `Recherche`, `BoutonLoupe`, `MerProto` (sans la bascule) et `ligneTempsFiche`, et les branchements de `App.tsx`, `FeuilleMobile.tsx` et `Settings.tsx` sur `VARIANTE === 'C'`.
  - Captures `docs/design/recherche-et-mer/directions/F-*.png` ; décisions dans `docs/design/recherche-et-mer/decisions.md`.
  - Le prototype est une référence, pas du code à garder. Ses temps sont inventés, ses codes un échantillon, et ses variantes A et B sont écartées.
- **Jetons seulement** (`npm run check-tokens`). Un jeton nouveau : `taille-liste-suggestions` 280 (contrat du système), ajouté à `src/theme/tokens.ts` en tâche 1.
- **Annonces aux lecteurs d'écran** : aucune nouvelle zone `role="status"`, car le compte reste l'unique zone de la page (leçon de services). Le nombre de suggestions (H186) passe par une zone `aria-live="polite"` à part, propre au champ, comme le champ du métier (`Emploi.tsx`). Elle reste vide tant qu'aucune saisie n'a de suggestion.
- **Champ et clavier de l'iPhone** : le champ suit R20 d'interface-telephone, comme le champ du métier et celui d'un proche. Leçons à relire avant de coder : 2026-10-13 « feuille qui monte au focus » et « iOS clavier : champ à sa place avant le focus ».
- **Nommer chaque champ** : trois champs à suggestions existent (métier, proche, commune) ; un test prend toujours le champ par son nom.
- Aucun texte de la tranche n'insère un nom de commune dans une phrase : la règle `deNom` est sans objet. « Grandeville (33) » n'est pas une élision.
- **Données** : scripts Python 3 sans dépendance, lancés avec `python3 -I` ; fichiers téléchargés dans `data-raw/` (non versionné), date et empreinte dans `<fichier>.info.json` ; arrêt si une empreinte change.

## Tâches

### Tâche 0a — Codes postaux, et calcul des minutes préparé
**But** : les codes postaux sont servis, justes et légers. L'envoi des 34 746 trajets jusqu'à la mer est prêt, compté et testé sans réseau, pour que Vincent le lance.

**Entrées** : D2, D4, D7 ; H187, H195, H196 ; détails, cas limites (codes postaux, géographie) ; `scripts/data/mer.py` ; `v_mvt_commune_2026.csv` (déjà dans `data-raw/`, emploi) ; le calcul des gares de services (`data-raw/services-calcul/calcul-grandes-lignes.py`), modèle d'envoi par lots qui reprend sans renvoyer.

**Sorties** :
1. **`scripts/data/sources.py`** télécharge la base officielle des codes postaux de La Poste (data.gouv.fr). Il note sa date et son empreinte dans `data-raw/<fichier>.info.json`. **La licence est relue et datée** (Licence Ouverte 2.0 d'après /spec), avant tout fichier servi.
2. **`scripts/data/codes_postaux.py`** (nouveau) écrit `public/data/codes-postaux.json` :
   - recalage par les mouvements du COG 2026, dans les deux sens (détails, cas limites) ;
   - outre-mer et Monaco écartés ;
   - Paris, Lyon, Marseille : les codes de leurs arrondissements, rattachés à la ville ;
   - contrôles qui arrêtent le script, décrits dans la condition d'arrêt ;
   - test (AC-13, morceau a) : une fausse ligne de La Poste 75015 → 75115 sort `"75015": ["75056"]`.
3. **`scripts/data/mer.py`** gagne la fonction qui rend le point de côte d'une commune, à côté de celle des km. Les km ne changent pas : un contrôle relit `mer-km.csv` à l'identique.
4. **`scripts/data/mer_minutes.py`** (nouveau), mode `--preparer` (sans réseau) :
   - le point de côte de chaque commune (1 688 points distincts pour 34 746 communes, mesure du 2026-11-25) ;
   - des lots de requêtes de matrice : des sources et des destinations, 3 500 éléments au plus par requête. Les communes qui partagent un point vont dans le même lot, coupé en plusieurs lots s'il dépasse 3 500 communes ; les points d'une seule commune sont regroupés par voisinage ;
   - **le rayon d'accroche** (H196) : celui que la matrice d'openrouteservice applique, lu dans sa documentation, avec la source citée dans la mesure ; un paramètre de rayon n'est utilisé que si la documentation le donne ;
   - **les bacs** : écrire, d'après la documentation, si la matrice peut les écarter ; sinon ils restent, et le tableau de crédibilité gagne une commune en face d'un bac (Blaye) ;
   - le nombre de requêtes et la durée de l'envoi.

   Mode `--envoyer`, **écrit mais jamais lancé par l'agent** :
   - il reprend sans renvoyer, attend quand le quota est épuisé, et n'affiche jamais la clé ;
   - il refait **une fois** un lot en échec (H196 : « échoue après un nouvel essai »), puis le note en échec ;
   - il écrit `data-raw/mer-calcul/ors-mer.jsonl` : une ligne par lot, avec la **réponse entière** (durées brutes ou `null`, et ce que la réponse dit de l'accroche de chaque point : lieu accroché et distance, s'il les donne) ou l'erreur, pour compter les causes de H196 sans relancer ;
   - la commande de Vincent commence par **un seul lot d'essai** (Bordeaux, Caen et une commune des Landes), dont la sortie dit déjà la part de `null`.
5. **Tests sans réseau**, dans un nouveau `scripts/data/mer_minutes.test.ts` :
   - la formation des lots (aucun lot au-delà de 3 500 éléments, chaque commune une fois) ;
   - la reprise (un lot déjà écrit n'est pas renvoyé), sur un faux fichier de résultats ;
   - un point de plus de 3 500 communes coupé en plusieurs lots ;
   - dans un nouveau `scripts/data/codes_postaux.test.ts`, le morceau a d'AC-13 (sortie 2).
6. **`docs/plans/2026-11-25-recherche-et-mer/mesure-tache-0.md`** (début) : licence et date de la base de La Poste ; sortie des contrôles des codes ; poids `brotli -q 3` ; nombre de requêtes et durée prévue ; **la commande que Vincent lance**.
7. **CLAUDE.md** → Données : la base des codes postaux (adresse, date, empreinte, licence, fichier produit).

**Fichiers** : `scripts/data/sources.py`, `scripts/data/codes_postaux.py` (nouveau), `scripts/data/codes_postaux.test.ts` (nouveau), `scripts/data/mer.py`, `scripts/data/mer_minutes.py` (nouveau), `scripts/data/mer_minutes.test.ts` (nouveau), `docs/plans/2026-11-25-recherche-et-mer/mesure-tache-0.md` (nouveau), `CLAUDE.md` ; produit : `public/data/codes-postaux.json`.

**Tests** : ceux de la sortie 5 ; les contrôles de la sortie 2.

**Preuve attendue** : la sortie des contrôles copiée dans la mesure ; `npm run test:unit` vert ; `mer-km.csv` relu identique.

**Conditions d'arrêt** (retour à Vincent, aucune valeur changée à la main) :
- licence de la base de La Poste autre que la Licence Ouverte, ou introuvable ;
- **plus de 20 communes de la carte sans aucun code** (leçon du 2026-11-21) ;
- `codes-postaux.json` au-delà de 200 Ko en `brotli -q 3` ;
- **plus de 500 requêtes** (plus d'un jour de quota) : choix de Vincent, envoi sur plusieurs jours ou points de côte regroupés sur une grille, au prix d'un écart de temps mesuré.

### Tâche 0c — Le tableau de recalage (sans code du site)
**But** : Vincent voit, en un tableau, chaque critère et chaque test qui change avec les minutes seules, avant → après, et le valide une fois.

**Entrées** :
- D5 révisée, D9 ; R60 à R62 ;
- [criteres-a-recaler.md](../../specs/2026-11-25-recherche-et-mer/criteres-a-recaler.md) : 58 critères trouvés par script, **à vérifier un à un** ;
- les fixtures : `mer_min` des communes A à F de [acceptance.json](../../specs/2026-11-25-recherche-et-mer/acceptance.json), `tests/fixtures/metropole.json` (7 communes), le jeu d'immobilier ;
- le précédent : `docs/specs/2026-10-14-cadre-de-vie/recalage.py` et `recalage.md` ;
- la leçon « Recaler des critères par un modèle des règles » (2026-10-14, révisée le 2026-10-15).

**Sorties** :
1. **`docs/specs/2026-11-25-recherche-et-mer/recalage.py`** : un modèle des règles indépendant du code du site.
   - Il est **vérifié d'abord sur l'état actuel** : il retrouve les valeurs en km de tous les critères concernés.
   - Il recalcule chaque critère en minutes :
     - `mer=aucun` reste tel quel (ancien lien ignoré, D9) ;
     - une adresse `mer=<km>` devient `mer-min=<min>`, avec le choix qui garde **les mêmes communes** quand il existe (sinon le critère est rangé dans « change de sens ») ;
     - les colonnes de liste et les raisons passent en minutes ;
     - la ligne de la fiche « … km de la mer à vol d'oiseau » devient « … de la mer en voiture ».
   - Il signale chaque moyenne à ± 0,01 d'une moitié.
2. **Minutes des communes des jeux de test qui n'en ont pas** (les deux communes de `metropole.json` hors A à E, et toute autre) : la règle de `carte.ts` ci-dessus, les km servis arrondis à la minute, moitié vers le haut (par exemple 300 km → 300 min, « 5 h »). Elle est écrite dans le tableau et appliquée par `carte.ts` en tâche 3b, jamais dans un `acceptance.json`.
3. **`docs/specs/2026-11-25-recherche-et-mer/recalage.md`**, avec en tête **les critères qui changent de sens**, puis :
   - chaque critère avant → après (`given / when / then`) ;
   - la liste des **tests hors critère** touchés : tout fichier de `tests/` et de `src/**/*.test.ts` qui lit une adresse `mer=`, un km de mer, une ligne de liste, ou qui ouvre `/` et lit un compte, un score, un rang ou une couleur (leçon du 2026-10-15). Avec, pour chacun, la règle de recalage ;
   - D19 de proches : AC-15 est remplacé par AC-6 et AC-10 d'ici ;
   - les tests du domaine (`src/**/*.test.ts`) qui fabriquent une `Commune` : `merMin` vaut `null` par défaut dans `communeDeLigne` (comme `typeEnv ?? null`), et ceux qui écrivent l'objet à la main sont listés ;
   - CLAUDE.md « Données » : la ligne « Loyer… 52 m² » ne bouge pas ; une ligne « Mer » dit que les km servent au point de côte et au repli, et que seules les minutes s'affichent.

**Fichiers** : `recalage.py` et `recalage.md` (nouveaux, dans le dossier de la spec).

**Tests** : le contrôle du modèle sur l'état actuel (sortie du script).

**Preuve attendue** : la sortie du contrôle (toutes les valeurs actuelles retrouvées) ; le tableau.

**Arrêt prévu** (le seul de /build avant la démo), avec ceux de la tâche 0a dans le même message :
1. Vincent lance l'envoi à openrouteservice (commande de la mesure).
2. Vincent valide le tableau de recalage, ou en conteste des lignes.

/build reprend à la tâche 0b quand l'envoi est fini, et peut faire les tâches 1, 2 et 4 en attendant.

### Tâche 0b — Les minutes, servies et confrontées
**But** : `communes.json` porte le temps jusqu'à la mer de chaque commune, contrôlé ; le tableau de confrontation est prêt, et **envoyé à Vincent dès la fin de la tâche** (sans arrêter /build), pour qu'il le regarde avant la démo s'il le veut.

**Entrées** :
- R61 ; D4, D7, D8 ; H191, H194, H195, H196 ;
- `data-raw/mer-calcul/ors-mer.jsonl`, écrit par l'envoi de Vincent ;
- la leçon « valeur arrondie pour l'afficher et la comparer » (2026-10-15) ;
- le modèle de confrontation : `docs/plans/2026-11-24-services/credibilite-services.md`.

**Sorties** :
1. **`mer_minutes.py --calculer`** :
   - durée en minutes, arrondie une seule fois, moitié vers le haut (H191) ;
   - `null` pour une commune sans temps, avec sa cause (H196 : pas de route près du point, pas de route jusqu'à lui, échec, retrait) ;
   - lecture de `scripts/data/mer-retraits.csv` (nouveau, vide ; colonnes `code`, `preuve`, D8) ;
   - écriture de `data-raw/mer-min.csv`.
2. **`scripts/data/communes.py`** lit `mer-min.csv` et ajoute `mer_min` à la fin de `communes.json` (et à `champs`).
3. **`src/domain/score.ts`** : `communeDeLigne` lit la colonne dans `merMin`, `null` par défaut (comme `typeEnv ?? null`). Rien ne l'affiche encore, et la suite reste verte (exception accordée pour `communes.test.ts`).
4. **`mesure-tache-0.md`** (suite) :
   - le nombre de communes sans temps, par cause ;
   - les deux bouts du rapport minutes / km : les plus grands parmi les communes à moins de 50 km (détour d'estuaire), et les plus petits (bac, accroche sur l'autre rive) ;
   - le poids ajouté en `brotli -q 3` ;
   - les valeurs de Bordeaux (le « C'est réussi si » de la spec) et de Caen.
5. **`docs/plans/2026-11-25-recherche-et-mer/credibilite-mer.md`** : le temps et les km de 10 villes connues (Bordeaux, Caen, Auch, Toulouse, Lyon, Paris, Nantes, Rennes, Montpellier, Lille), de Blaye si les bacs restent, et des 5 communes de chaque bout du rapport minutes / km.
   - Pour chaque ligne, un lien d'itinéraire en voiture sur openstreetmap.org (`/directions`), de la mairie au point de côte, que Vincent ouvre.
   - L'agent n'envoie aucune position à un service de calcul : il écrit seulement les liens.

6. **CLAUDE.md** → Données : les minutes (fichier d'openrouteservice, empreinte, date du calcul, « ne pas relancer », table des retraits).

**Fichiers** : `scripts/data/mer_minutes.py`, `scripts/data/mer-retraits.csv` (nouveau), `scripts/data/communes.py`, `scripts/data/communes.test.ts` (ligne 76 seulement), `src/domain/score.ts`, `mesure-tache-0.md`, `credibilite-mer.md` (nouveau), `CLAUDE.md` ; produit : `public/data/communes.json`.

**Tests** :
- dans `scripts/data/mer_minutes.test.ts`, l'arrondi (29,5 → 30 ; 0,4 → 0, « moins d'1 min »), le retrait d'une ligne de table et les causes ;
- dans `scripts/data/communes.test.ts`, la colonne lue par `communeDeLigne`.

**Preuve attendue** : la sortie des contrôles ; `npm test` vert ; la valeur de Bordeaux relue dans le fichier servi.

**Conditions d'arrêt** :
- plus de 2 % des communes sans temps (une autre méthode de calcul devient une décision de Vincent) ;
- plus de 60 Ko ajoutés en `brotli -q 3` ;
- un trajet manquant dans le fichier d'openrouteservice.

### Tâche 1 — Chercher une commune par son nom, de bout en bout
**But** : en bureau et au téléphone, on touche la loupe, on tape « grand », on choisit « Grandeville (33) » : la carte se cadre et la fiche s'ouvre, comme un choix sur la carte.

**Entrées** :
- R58 (partie nom), R59 ; H177, H178, H179, H180, H181, H182, H184, H185, H186, H188 ;
- AC-1, AC-4, AC-5, AC-11, AC-12 ;
- la référence du design (piste C) ; le champ du métier (`src/ui/Emploi.tsx`) pour le modèle combobox et clavier ;
- R19 et R20 d'interface-telephone.

**Sorties** :
1. **`src/domain/recherche.ts`** (nouveau) : normalisation et correspondance de H180, ordre de H182, 8 au plus, chaque commune une fois.
   - L'index des noms normalisés est calculé une fois, à l'arrivée des données, pour tenir 100 ms par frappe (H179).
   - La mesure sur les 34 746 communes est notée dans le rapport de tâche.
2. **`src/ui/Recherche.tsx`** (nouveau) : Loupe, Champ de recherche, Suggestion de commune (contrat du système). Combobox, `aria-activedescendant`, zone `aria-live` du nombre de suggestions.
   - États de details.md : vide, trop court, suggestions, aucune, choisie.
   - Flèches, Entrée, Échap deux fois (H186).
   - « Annuler » rend le focus à la loupe ; les suggestions se ferment quand le champ perd le focus.
   - Champ inactif pendant les états chargement et erreur de la page (H188).
3. **Placement** :
   - bureau : loupe à droite du titre, champ à la place du titre (le titre reste lu, `sr-only`), suggestions dans le flux du panneau (`Settings.tsx`) ;
   - téléphone : loupe au bout de la rangée des onglets, et dans la tête de la feuille quand une fiche est ouverte. Touchée, la feuille monte et la recherche remplace tout sous la poignée (`FeuilleMobile.tsx`).
4. **Choisir** passe par la même fonction que la carte et la liste (`choisir` de `App.tsx`) : même cadrage, fiche ouverte, adresse inchangée (H185). Une commune choisie ailleurs vide le champ (H184).
5. **`src/theme/tokens.ts`** gagne le jeton `taille-liste-suggestions`.

**Fichiers** : `src/domain/recherche.ts` (nouveau), `src/domain/recherche.test.ts` (nouveau), `src/ui/Recherche.tsx` (nouveau), `src/ui/Settings.tsx`, `src/ui/FeuilleMobile.tsx`, `src/App.tsx`, `src/theme/tokens.ts`, `tests/e2e/recherche.spec.ts` (nouveau).

**Tests** :
- `AC-12 …` dans `src/domain/recherche.test.ts` ;
- `AC-1 …`, `AC-4 …`, `AC-5 …`, `AC-11 …` dans `tests/e2e/recherche.spec.ts`, qui sert les communes de cadre-de-vie (Rhinval compris) avec les tuiles `tuiles-immobilier`, comme `emploi.spec.ts`. AC-1 relève toutes les requêtes de la page pendant la saisie.

**Preuve attendue** :
- captures, sur la version construite, de « auch » puis Auch choisie, en bureau et à 390 × 844 ;
- à 375 × 548 au départ, le bas du curseur du prix (≤ 548, mesuré 537 dans le prototype) ;
- le temps d'une frappe sur les vraies données : dans le navigateur, sur la version construite, de l'évènement `input` aux suggestions affichées, pour la saisie la plus large (« sa »), médiane de 5 essais.

**Conditions d'arrêt** :
- le test de H48 ou AC-1 d'interface-telephone casse ;
- une frappe au-delà de 100 ms sur les vraies données.

### Tâche 2 — Chercher par code postal
**But** : « 33000 » propose « 33000 · Bordeaux (33) » ; un code complet partagé montre toutes ses communes dans une liste qui défile ; les états de chargement et d'erreur des codes disent quoi faire.

**Entrées** :
- R58 (partie code) ; H181, H183, H187 ; AC-2, AC-3, AC-13 ;
- `public/data/codes-postaux.json` (tâche 0a) ;
- le délai des données (`avecDelai`, `src/domain/chargement.ts`).

**Sorties** :
1. **`src/domain/recherche.ts`** : la recherche par code. Début de code de 2 à 4 chiffres (8 au plus), code complet (toutes), espaces retirées, plus petit code qui correspond dans le libellé (H183).
2. **Chargement (H187)** :
   - à la première prise de focus du champ, une demande ;
   - un nouvel essai aussitôt en cas d'erreur ;
   - « Codes postaux indisponibles… » après une seconde erreur ou 10 s ;
   - nouvel essai à la prochaine prise de focus ;
   - « Chargement des codes postaux… » tant qu'ils ne sont pas là et que la saisie est en chiffres.
3. **`tests/e2e/lib/carte.ts`** sert `codes-postaux.json` depuis les `codes_postaux` du jeu (exception accordée ci-dessus).

**Fichiers** : `src/domain/recherche.ts`, `src/domain/recherche.test.ts`, `src/ui/Recherche.tsx`, `src/App.tsx`, `tests/e2e/lib/carte.ts`, `tests/e2e/recherche.spec.ts`.

**Tests** : `AC-13 …` (morceau b : le fichier déjà rattaché, `"75015": ["75056"]`) dans `src/domain/recherche.test.ts` ; `AC-2 …`, `AC-3 …` dans `tests/e2e/recherche.spec.ts`.

**Preuve attendue** : captures de « 33000 », « 01300 » (liste qui défile) et de l'état « Codes postaux indisponibles » (fichier coupé), sur les vraies données.

**Condition d'arrêt** : un code de la vérification de bout en bout (33000, 01300, 75015) sans la commune attendue.

### Tâche 4 — Les mentions dans le panneau de réglages
**But** : en bureau, plus aucune mention sur la carte. Toutes sont au bas du panneau de réglages, avec les deux nouvelles (R63).

**Entrées** : R63 ; décision de Vincent (/ui, piste C) ; capture `F-bureau-mentions-panneau.png` ; la leçon « fiche de bureau sans défilement » (2026-11-24) ; la date du fichier de La Poste (tâche 0a).

**Sorties** :
- `Mentions.tsx` gagne « Codes postaux : La Poste, base officielle des codes postaux (fichier du JJ/MM/AAAA) » (date de la tâche 0a, écrite en dur) et « Temps jusqu'à la mer : calculés avec openrouteservice, © OpenStreetMap contributors ».
- En bureau, le bloc est rendu à la fin du panneau de réglages, avant le compte collé en bas. Il n'est plus sous la légende.
- Au téléphone, rien ne bouge (les mentions sont déjà en bas des onglets).
- La légende reste en bas à gauche de la carte.

- **CLAUDE.md** → mentions obligatoires : les deux textes (R63) et leur place en bureau.

**Fichiers** : `src/ui/Mentions.tsx`, `src/App.tsx`, `src/ui/Settings.tsx`, `CLAUDE.md` ; tests protégés ajustés pour le seul déplacement (exception accordée) : la tâche peut dépasser 8 fichiers, par eux seuls.

**Tests** : la partie « pied de page » d'AC-9 est écrite en tâche 3b, avec le reste d'AC-9.

**Preuve attendue** : capture de bureau, le panneau de réglages défilé jusqu'en bas ; la carte sans pied de page ; le bas de la carte visible.

**Condition d'arrêt** : un test protégé qui lit une **valeur** du pied de page (et non sa place) casse.

### Tâche 3a — Durées et comparaison en minutes, sans branchement
**But** : les fonctions qui écrivent une durée et comparent un temps jusqu'à la mer existent et sont testées seules ; rien ne change à l'écran, la suite reste verte.

**Entrées** : R61, R62 ; D7 ; H191, H192 ; les exemples de details.md (« moins d'1 min », « 50 min », « 1 h 05 », « 2 h 40 », « ≈ 7 h »).

**Sorties** : dans `src/domain/format.ts`, la durée de la mer et le texte « ≈ » ; dans `src/domain/score.ts`, les minutes comparées d'une commune (valeur servie, ou km affichés comptés comme minutes, « moins d'1 km » = 1 min, avec le drapeau « compté d'après les km »). Aucune fonction existante n'est encore appelée autrement.

**Fichiers** : `src/domain/format.ts`, `src/domain/format.test.ts`, `src/domain/score.ts`, `src/domain/score.test.ts`.

**Tests** : les exemples ci-dessus, et Rhinval (420 km, sans temps) → 420 min, « ≈ 7 h ».

**Preuve attendue** : `npm run test:unit` et `npm run typecheck` verts.

### Tâche 3b — La mer en minutes, partout, et le recalage
**But** : « Mer à moins de » propose 15 min, 30 min, 1 h, 1 h 30 ; la liste, les raisons et la fiche disent des minutes ; les anciens liens en km sont ignorés. Toute la suite passe, recalée selon le tableau validé.

**Entrées** :
- R60, R61, R62, R63 ; D5 révisée, D6, D7, D9 ; H191, H192, H193 ;
- AC-6, AC-7, AC-8, AC-9, AC-10 ;
- **le tableau validé de la tâche 0c** ;
- H90 de cadre-de-vie (budget d'une pastille de la mer : 149 à 164 ms, pas au-delà).

**Sorties** :
1. **Réglage et adresse**, dans `src/domain/score.ts` et `src/domain/url.ts` : choix 15, 30, 60, 90 ; `mer-min` lu et écrit dans l'ordre de H193 ; `mer` ignoré et retiré de l'adresse réécrite (D9) ; résumé replié « Mer 30 min ».
2. **Comparaison (R61)** : les fonctions de la tâche 3a, branchées sur le filtre et la note (R62) ; « moins d'1 min » est comparé comme 1 min.
3. **Textes**, dans `src/domain/format.ts`, avec la durée de la tâche 3a :
   - colonne de liste, toujours en minutes ;
   - raisons ;
   - lignes de la fiche de R63, sans aucun km de mer (sauf « compté … d'après les km ») ; « Distance à la mer inconnue » gardée.
4. **`src/ui/CadreDeVie.tsx`** : les quatre pastilles en minutes, sans bascule.
5. **Recalage, appliqué d'après le tableau validé, et seulement lui** :
   - critères des 7 tranches ;
   - D19 de proches ;
   - tests hors critère ;
   - minutes des jeux de test dans `tests/e2e/lib/carte.ts`.
6. **CLAUDE.md** : la ligne « Mer » du tableau validé.
7. **`docs/specs/2026-10-14-cadre-de-vie/details.md`** : sous R28, H69, H75, H76 et H77, « remplacé par R60 à R62 de recherche-et-mer (2026-11-25) ».

**Ordre interne** : d'abord le domaine et l'adresse, avec AC-6 à AC-10 ; puis le recalage, tranche par tranche, en relançant la suite à chaque tranche ; enfin CLAUDE.md et cadre-de-vie.

**Fichiers** : `src/domain/score.ts`, `src/domain/url.ts`, `src/domain/format.ts`, `src/ui/CadreDeVie.tsx`, `src/ui/Fiche.tsx`, `tests/e2e/recherche.spec.ts`, `tests/e2e/lib/carte.ts`, `CLAUDE.md`. Plus, **par exception déclarée**, les `acceptance.json` et fichiers de tests du tableau (environ 7 et 19). La tâche dépasse donc le plafond de 8 fichiers : c'est une réécriture mécanique, contrôlée par le tableau.

**Tests** : `AC-6 …` à `AC-10 …` dans `tests/e2e/recherche.spec.ts` ; toute la suite.

**Preuve attendue** :
- `npm test` vert ;
- captures de « 30 min » cochée (liste et fiche de Bordeaux, vraies données), en bureau et à 390 × 844 ;
- l'adresse `/?loyer=1200&mer=30` réécrite en `/?loyer=1200` ;
- le temps d'un toucher de pastille, mesuré comme H90.

**Conditions d'arrêt** :
- un test ou un critère à changer qui n'est pas dans le tableau validé ;
- une pastille au-delà de 164 ms.

## Ordre
0a → 0c → **arrêt** (envoi d'openrouteservice par Vincent, accord sur le tableau) → 1 → 2 → 4 → 3a → 0b (dès que l'envoi est fini) → 3b → relectures → démo.

Les tâches 1, 2, 4 et 3a ne dépendent pas des minutes : elles avancent pendant l'envoi.

## Critères → tâches
AC-1, AC-4, AC-5, AC-11, AC-12 → tâche 1 · AC-2, AC-3, AC-13 → tâche 2 · AC-6 à AC-10 → tâche 3b. AC-13 : morceau a (rattachement des arrondissements) en tâche 0a, morceau b en tâche 2. Le risque de la spec (minutes peu crédibles) → tâche 0b, jugé à la démo.

## Reporté
- Montagne en minutes (spec, « Pas maintenant »).
- Partage.
- Recherche d'adresse.
- Accélérer le recoloriage (chantier à part, STATE.md).

## Risques et hypothèses du plan
- **Points de côte hors route** : le service de matrice cherche une route près de chaque point ; une falaise ou une côte sans route donne `null`. Si c'est fréquent, D7 compte ces communes d'après leurs km, et la carte reste juste mais moins « en voiture ». *Contrôle* : tâche 0b, arrêt au-delà de 2 %.
- **Nombre de requêtes** : environ quelques centaines estimées le 2026-11-25 (1 688 points distincts, *estimation de Claude*, non comptée). *Contrôle* : tâche 0a, arrêt au-delà de 500.
- **Recalage incomplet** : un test hors critère qui lit un chiffre venu du départ peut échapper au repérage (leçon du 2026-10-15). *Contrôle* : la règle de recalage des tests hors critère, validée avec le tableau, puis toute la suite en tâche 3b.
- **Ordre des tâches** : la tâche 3b attend la fin de l'envoi. S'il dure plus d'un jour, /build s'arrête après la tâche 3a avec un repère dans `progress.md`.
- **La loupe en bureau** (Majeur de la relecture du design, gardé par Vincent) : une personne peut ne pas voir qu'on peut chercher. À regarder à la démo, pas à corriger ici.
