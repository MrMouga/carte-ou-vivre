# Relecture spec — loyer-mer
Suite de tests : `npm run typecheck` sans erreur · Vitest « Tests 47 passed (47) » · check-tokens « 25 fichier(s), aucune valeur arbitraire » · Playwright « 51 passed, 1 skipped (15.3s) » (26 bureau + 25 à 390 px ; le test sauté est « parcours » à 390 px, pas un critère) · `npm run build` réussi, `dist/version.txt` = HEAD
Périmètre : 8d2cb62..ba68611 (tâches 0a à 7 et simplification), relu le 2026-10-13 vers 00:30

En bref : les 15 critères ont chacun un vrai test qui passe et qui vérifie les valeurs du critère. Les règles R1 à R8, les états et les décisions D1 à D17 sont en place. Un défaut sérieux : le risque Safari signalé est **confirmé**. Le reste, ce sont des écarts déjà annoncés à Vincent, ou de l'hygiène de journal.

---

[Bloquant] Sur iPhone (et dans Safari sur Mac), bouger un curseur pendant quelques secondes peut faire disparaître toute la page — la carte, les réglages et la liste deviennent une page blanche, et seul un rechargement la ramène. Ça touche le geste principal de l'outil, sur le téléphone qui est la cible des 390 px (sur iPhone, tous les navigateurs utilisent le moteur de Safari).
  Où : `src/App.tsx:47` — `useEffect(() => history.replaceState(null, '', ecrireAdresse(reglages)), [reglages]);`
  Preuve : chaque cran d'un curseur crée de nouveaux réglages, donc un appel à `replaceState`. Le curseur de la mer a 40 crans (5 → Sans limite), celui du loyer 35 : un aller-retour de la mer fait 80 appels. Le moteur de Safari refuse au-delà de 100 appels en 30 s et **lève une erreur** (« SecurityError: Attempt to use history.replaceState() more than 100 times per 30 seconds »). Firefox a une limite comparable (de l'ordre de 200 en 10 s). Cette limite vient du comportement connu de ces navigateurs : je ne l'ai pas mesurée ici, faute de WebKit installé. Rien n'attrape l'erreur (aucun `try`, aucune « error boundary », c'est-à-dire un filet qui intercepte les plantages de React) et, dans React 19, une erreur non attrapée dans un effet démonte toute l'application. Je l'ai vérifié par une simulation dans Chromium (script jetable dans le scratchpad, sans toucher au code) : `replaceState` lève l'erreur de Safari au 101e appel, puis trois allers-retours au clavier sur « Mer à moins de » donnent `{"appels":101,"reglages":0,"racine":0}`. La région Réglages a disparu, `#root` est vide, et la console affiche « An error occurred in the <App> component ». La page est donc tombée dès le 101e appel, au milieu du deuxième aller-retour.
  Correction : entourer l'appel d'un `try/catch` et, en cas d'échec, réessayer d'écrire les derniers réglages un peu plus tard (par ex. 1 s). L'adresse peut alors être en retard pendant un usage intense, mais la page survit. Le test AC-13 reste vert (Chromium ne lève pas d'erreur). Un délai d'écriture (« debounce ») serait plus propre, mais le test AC-13 lit l'adresse environ 50 ms après le dernier cran : il faudrait que ce test attende l'adresse, et seul Vincent peut toucher à un test d'AC. Ajouter un test hors AC qui reprend la simulation (limite à 100 appels, trois balayages, la région « Réglages » toujours là).
  Réf : R7 (« à chaque changement, en remplaçant l'entrée courante ») ; CLAUDE.md « Fini = effet observé sur le vrai flux » ; risque signalé par la passe de nettoyage.

[Mineur] La spec dit encore « La Rochelle 1 km », mais la page affiche « moins d'1 km de la mer » (0,956 km avec les vraies données) — l'étape 1 de la vérification de bout en bout échouera telle qu'elle est écrite pendant /ship.
  Où : spec.md (« C'est réussi si ») ; details.md, « Vérification de bout en bout », étape 1 ; `scripts/data/communes.test.ts:26` (seuil abaissé à 0,9 km, alors que le plan prévoyait 1 à 1,5 km).
  Preuve : progress.md, lignes 48 et 80 : Vincent a accepté « moins d'1 km » le 2026-10-12 ; la spec doit être mise à jour « à l'acceptation de la démo ». Ce n'est pas encore fait.
  Correction : à la démo, faire corriger les deux phrases de la spec par Vincent (/spec), avant /ship.
  Réf : spec « C'est réussi si », R4, cas limite « Distance sous 1 km ».

[Mineur] Les logos Shom et IGN demandés sont remplacés par leur nom encadré avec un lien. De plus, à 390 px, aucune mention n'est visible quand une fiche est ouverte, alors que le petit bloc d'attribution de MapLibre a été retiré : à ce moment, la carte IGN affichée ne porte aucune mention.
  Où : `src/ui/Mentions.tsx:4-19` ; `src/App.tsx:151` (`{!choisie && <Mentions … bureau:hidden />}`) ; `src/map/MapView.tsx:67` (`attributionControl: false`).
  Preuve : CLAUDE.md, « Données » : « © Shom-IGN, 2021 avec les logos Shom et IGN et leurs liens » ; details.md, pied de page : « Shom-IGN avec logos et liens ». L'écart est signalé dans progress.md (ligne 36, « Question pour la démo ») : il n'est pas caché.
  Correction : obtenir la réponse de Vincent sur les logos avant /ship ; garder au moins « © IGN – Géoplateforme » visible sur la carte quand la fiche est ouverte à 390 px (une ligne de mention dans la bande de carte, ou l'attribution compacte de MapLibre).
  Réf : CLAUDE.md « Mentions obligatoires » ; D16.

[Mineur] Le budget de réaction (≤ 100 ms) n'est pas tenu : 102 ms de médiane après la simplification, 176 ms avant. Aucune mesure n'a été faite sur téléphone.
  Où : progress.md, lignes 15, 17 et 20 ; `captures/7-mesure.txt`.
  Preuve : c'est annoncé honnêtement, comme « à trancher par Vincent à la démo ». La mesure est pessimiste (rendu logiciel, processeur ralenti ×4). Vincent a renoncé au test sur iPhone (ligne 80). La spec (« Le risque ») demandait un retour à Vincent si le budget n'était pas tenu : c'est prévu à la démo, pas avant.
  Correction : rien dans le code ; la question doit figurer en tête de la démo, avec « non vérifié sur téléphone ».
  Réf : H9, spec « Le risque ».

[Mineur] Les heures inscrites dans progress.md ne sont pas fiables : plusieurs preuves y sont datées de 10 à 40 min **après** le commit qui les contient déjà, ce qui est impossible.
  Où : progress.md, lignes 5, 9, 10, 11, 14 et 75 (« Session 1 … 21:40 → 23:50 : tâches 0a à 5a »).
  Preuve : `git log` et l'heure de modification des fichiers (`stat`). Tâche 4 : « 23:25 » dans progress.md, mais `4-fiche.txt` date de 22:57:42 et le commit 70bb494 de 22:58. Tâche 5a : « 23:45 », mais le fichier date de 23:07:23 et le commit d78f898 de 23:07. Tâche 7 : « 2026-10-13 00:30 » est déjà écrit dans le commit bb5a398 de 00:09:44. La tâche 5b est notée en session 2, mais elle est commitée à 23:29, avant la fin annoncée de la session 1. **L'ordre réel est sain** : chaque fichier de preuve a été produit 0 à 1 min avant le commit de sa tâche, donc sur le code final de cette tâche (0a 21:40:18 / 21:40:53 ; 1a 22:02:25 / 22:02:46 ; 2 22:44:35 / 22:45:05 ; 3 22:51:45 / 22:52:26 ; 5b 23:29:01 / 23:29:20 ; 6 23:40:00 / 23:40:49 ; simplification 00:22:42 / 00:23:08).
  Correction : pour la suite, dater les preuves avec `date` ou l'heure du fichier, pas de mémoire. Pour ce lot, se fier à git.
  Réf : CLAUDE.md « preuve à l'appui ».

[Mineur] Plusieurs fichiers ont été modifiés hors de la liste de leur tâche sans que progress.md le dise (5b et 6 sont, elles, bien déclarées).
  Où : tâche 0a : `src/App.tsx`, `src/map/maplibre.ts`, `tests/e2e/lib/pixels.ts` · 0b : `.claude/settings.json`, `demo.html`, `src/demo/Demo.tsx`, `src/App.tsx`, `src/main.tsx`, `docs/design/system/README.md` · 2 : `scripts/data/communes.py` (le 100 m déplacé vers data-raw), `scripts/check-tokens.mjs`, `src/components/ui/slider.tsx`, `src/map/view.ts`, `src/theme/tokens.ts`, contrat de design, `.gitignore` · 3 : `src/ui/Legend.tsx`, `tokens.ts`, `tests/e2e/lib/carte.ts`, contrat · 4 : `src/map/style.ts`, `src/map/view.ts`, `src/ui/List.tsx`, `tokens.ts`, contrat · 5a : `src/ui/Settings.tsx`.
  Preuve : `git show --stat` de chaque commit de tâche, comparé aux lignes « Fichiers » de plan.md. Aucun « revert » dans l'historique. Les modifications du contrat de design se limitent à la liste des jetons « Tailles » (décision déclarée, ligne 53). Rien d'inquiétant sur le fond.
  Correction : compléter la liste « Fichiers hors de la liste » dans progress.md pour ces tâches.
  Réf : plan.md (Fichiers par tâche).

[Mineur] Les communes sont reliées entre `communes.json`, `reperes.json` et les tuiles par leur **position dans le fichier**, et non par code INSEE, sans aucun contrôle de cohérence. Si on relance `communes.py` sans refaire les tuiles, ou l'inverse, les couleurs et les clics iraient à la mauvaise commune, sans aucune erreur.
  Où : `scripts/data/tuiles.py:4,124` (identifiant de forme = index) ; `src/App.tsx:88-89,113` ; `scripts/data/communes.test.ts` (ne vérifie que communes.json).
  Preuve : lecture. Le changement de modèle de données a bien été accepté par Vincent (tâche 7). Mais la règle de CLAUDE.md (« Joindre toujours par code INSEE ») ne tient plus que par la discipline.
  Correction : ajouter au test des données un contrôle bon marché, par exemple : `reperes.json` a autant de lignes que `communes.json`, et le centre de Bordeaux (33063) tombe bien dans le cadre de Bordeaux ; ou écrire le code INSEE dans les propriétés des tuiles et le vérifier sur quelques tuiles.
  Réf : CLAUDE.md « Données ».

[Mineur] Les permissions de l'agent laissent passer, sans demander, `npm install *`, `curl -s *` et (dans une modification non commitée) `curl … -F`, qui passe de « refusé » à « demander ». La règle « nouvelle dépendance : seulement si le plan la prévoit ou si Vincent l'accepte » et l'interdiction d'envoyer (POST vers ORS) ne tiennent donc que par le jugement de l'agent (par exemple, `curl -s --json …` envoie des données sans être bloqué).
  Où : `.claude/settings.json` (commits 7590c72 et 75331b2, plus la modification en cours).
  Preuve : `git show 75331b2`, `git diff .claude/settings.json`. Choix probablement fait avec Vincent (progress.md : « une question sur les permissions »). Je le signale seulement, je n'y touche pas.
  Correction : à Vincent de décider s'il garde `npm install *` en « demander » avant la tranche 2, qui utilisera la clé ORS.
  Réf : CLAUDE.md « Nouvelle dépendance », « Les requêtes POST sont lancées par Vincent ».

## Couverture des critères (mode spec)
| AC | Test | Statut | Note |
|---|---|---|---|
| AC-1 | `src/domain/score.test.ts` « AC-1 … » + `tests/e2e/carte.spec.ts:7` | couvert | Scores 72/49/32 et paliers 4/3/2 côté règle ; couleur lue au pixel pour A, E, B ; C et D égales au fond. Bureau et 390 px. |
| AC-2 | `score.test.ts` « AC-2 » + `carte.spec.ts:12` | couvert | D 65, A 46, B 31, E 9 ; seule C non peinte (pixels). |
| AC-3 | `score.test.ts` « AC-3 » + `carte.spec.ts:20` | couvert | B passe à 15 (39,9 → 40 km = plafond), palier 1 au pixel. |
| AC-4 | `liste.spec.ts:15` + `format.test.ts` « AC-4 (format) » | couvert | Les 3 lignes au format exact de R5 (nom accessible) ; texte visible vérifié pour la 1re ligne. |
| AC-5 | `liste.spec.ts:27` | couvert | 300 €, 5 km vérifiés ; 5 carrés égaux au fond ; message exact. |
| AC-6 | `liste.spec.ts:37` | couvert | Sable à 70 % sur les 5 ; aucune ligne, compte vide ; message exact. |
| AC-7 | `fiche.spec.ts:15` | couvert | Toutes les chaînes du critère, score « 32 » exact, absence de « Estimation du secteur ». |
| AC-8 | `fiche.spec.ts:25` | couvert | Toutes les chaînes du critère. |
| AC-9 | `fiche.spec.ts:33` | couvert | Vrai clic sur la carte (centre du carré C) ; deux raisons exactes ; ni « / 100 » ni rang. |
| AC-10 | `fiche.spec.ts:44` + `score.test.ts` « AC-10 (règle) » | couvert | Compte au singulier, Portmer 72, pixels A seul coloré, raison de taille de Grandeville après un clic sur la carte. |
| AC-11 | `adresse.spec.ts:11` + `url.test.ts` | couvert | Valeurs lues dans `aria-valuetext` (même fonction que le texte affiché) ; ligne « 1 · Portmer (17) · 59 · … » exacte. |
| AC-12 | `adresse.spec.ts:19` + `url.test.ts` | couvert | Adresse réécrite `/?loyer=1200&mer=aucun` ; 4 pastilles non cochées ; ordre D 65, A 46, B 31, E 9. |
| AC-13 | `adresse.spec.ts:29` | couvert | Adresse et `history.length` inchangé. Ne couvre pas la limite de Safari (voir Bloquant). |
| AC-14 | `adresse.spec.ts:39` + `url.test.ts` | couvert | Deux pastilles `aria-pressed=true`, adresse complétée, 2 communes. |
| AC-15 | `etats.spec.ts:10` | couvert | Géoplateforme coupée entièrement ; A, E, B au pixel ; mention ; compte ; en plus, C et D en `area-excluded` et légende « Ne passe pas ». |

Les 15 marqués `passes: true` le sont à raison. Aucun test d'AC n'a été modifié pour passer (les adaptations à 390 px portent sur des aides et sur un test hors AC, et sont déclarées). « Ne change pas » : première tranche, rien à vérifier.

Règles et états (details.md) : R1 à R8 en place (`src/domain/score.ts`, `format.ts`, `url.ts`, `src/map/fallback.ts`), y compris les cas limites (égal au plafond, sous 1 km comparé comme 1 km, seuils de population, valeurs inconnues, noms de taille inconnus). Les états de la page (chargement 300 ms / 300 ms / 15 s, erreur + Réessayer, sans WebGL, fond indisponible avec retour toutes les 60 s, classée, aucune commune, sans plafond) et ceux de la fiche (passe, ne passe pas, sans plafond, passage d'un état à l'autre) sont tous présents. D1 à D17 respectées, à l'exception des logos (Mineur ci-dessus). En plus du plan : la page de démo des composants (`demo.html`, servie en dev seulement, absente du site construit, déclarée) ; les `overrides` npm (déclarés) ; le jeton `trait-cote` (déclaré). Aucune dépendance hors de la liste du plan, à part les types React acceptés par Vincent.

## Ce qui est bien fait
- Les règles sont dans des fonctions pures (`evaluer`, `format`, `url`), testées sur les valeurs exactes de la fixture. La page les réutilise telles quelles, sans les recopier.
- Les tests d'interface lisent de vrais pixels sur la carte, avec une tolérance serrée, sans aucun appel à la Géoplateforme. Ils passent aux deux largeurs, et AC-9 et AC-10 cliquent vraiment sur la carte.
- L'emprise des tuiles est bornée, et des tuiles vides sont écrites pour éviter les 404 et la page d'accueil servie à la place d'une tuile. C'est un vrai piège d'hébergeur statique, bien anticipé.
- progress.md est franc sur les écarts : budget dépassé, téléphone non mesuré, logos, La Rochelle, test sauté à 390 px.
- Contrat de design : aucune valeur arbitraire (contrôle automatique), thème Tailwind vidé, couleurs de la carte et du CSS issues d'un seul module.

## Non jugé
- Le vrai comportement de Safari ou d'iOS (aucun WebKit installé) : la limite de `replaceState` est reprise du comportement connu, la conséquence a été simulée dans Chromium.
- La réaction sur téléphone et la vérification de bout en bout **en ligne** (reportées à /ship).
- Les dates de publication des 171 paquets du lockfile (il aurait fallu interroger le registre npm).
- La fidélité aux frames Figma (captures non comparées une à une) et la justesse des données réelles au-delà des contrôles de `communes.test.ts` (Bordeaux, La Rochelle, Adour, Paris-Lyon-Marseille, 34 746 communes).
- `docs/plans/2026-10-12-loyer-mer/qa.md` (relecture QA en cours, non lue).
