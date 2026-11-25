# Relecture du plan — recherche-et-mer
Statut : terminé

Relecteur neuf, 2026-11-25. Plan : `plan.md` (brouillon). Spec : `docs/specs/2026-11-25-recherche-et-mer/`. Lus aussi : `tests/e2e/lib/carte.ts`, `scripts/data/mer.py`, `scripts/data/communes.test.ts`, `src/domain/score.ts`, `src/domain/url.ts`, `src/ui/Mentions.tsx`, `etats.spec.ts` (mentions), les leçons demandées.

**Bilan : 0 Bloquant · 7 Majeurs · 13 Mineurs.**
- Rien n'empêche de valider le plan après corrections.
- Deux Majeurs font s'arrêter /build à coup sûr s'ils restent tels quels :
  - le test de `communes.test.ts` qui tombe en tâche 0b ;
  - le cas « 75015 » d'AC-13.

Non vérifié :
- les 58 critères un à un, travail de la tâche 0c ;
- le contenu des tests protégés de `telephone-feuille`, `immobilier` et `services` au-delà du pied de page ;
- le prototype `e9515a1` ;
- `docs/design/system/README.md` au-delà des lignes des composants Loupe, Champ et Suggestion ;
- le plan de services, pour comparer la forme ;
- la documentation d'openrouteservice (rayon d'accroche, bacs, réponse de la matrice), faute d'accès réseau ; les constats qui en parlent sont donc des questions à trancher, pas des faits établis ;
- les leçons « feuille qui monte au focus » et « iOS clavier », vues seulement dans l'index.

## Critères sans tâche ou dans deux tâches

**Majeur 1 — AC-13, cas « 75015 · Paris (75) », est à cheval sur deux tâches et deux langages.**
- Preuve : AC-13, given : « Paris (75, code INSEE 75056) et une ligne de La Poste qui rattache 75015 à l'arrondissement 75115 ».
- Le plan teste AC-13 dans `src/domain/recherche.test.ts`, en tâche 2 (l. 231). Or c'est le script Python de la tâche 0a qui rattache les arrondissements à leur ville (l. 68). Le fichier servi ne contient que des codes de `communes.json` (l. 37). La fonction TypeScript ne voit donc jamais de ligne de La Poste, ni le code 75115.
- Le constructeur de la tâche 2 n'aura que deux choix : recopier en TypeScript le rattachement 751xx → 75056, ce qui fait deux règles pour un même fait, ou tester autre chose que le given.
- Correction : prouver le cas « 75015 » en deux morceaux nommés :
  - (a) en tâche 0a, un test de `codes_postaux.py` sur une fausse ligne 75015 → 75115, qui doit sortir `"75015": ["75056"]` ;
  - (b) en tâche 2, le test sur le fichier déjà rattaché.
- Autre voie : demander à Vincent de récrire le given d'AC-13.

**Majeur 2 — Une phrase de R63 n'est confiée à aucune tâche.**
- Preuve : R63 dit « ces deux textes sont aussi reportés dans les mentions obligatoires de CLAUDE.md ».
  - La tâche 4 (l. 248) ne touche pas CLAUDE.md.
  - La tâche 3 (l. 279) n'y écrit que « la ligne « Mer » ».
  - La tâche 0c (l. 119) ne parle que de la partie « Données ».
- Il manque aussi les lignes « Données » des deux nouvelles sources, comme le projet le fait pour emploi et services :
  - le fichier de La Poste, avec sa date, son empreinte et sa licence ;
  - le fichier d'openrouteservice, à ne pas relancer.
- Correction :
  - en tâche 4, ajouter CLAUDE.md aux fichiers, avec les deux mentions ;
  - en tâche 0a, ajouter la ligne « Données » des codes postaux ;
  - en tâche 0b, ajouter celle des minutes.

**Les autres critères sont chacun dans une seule tâche, et chaque geste existe à temps.**
- Répartition :
  - tâche 1 : AC-1, AC-4, AC-5, AC-11, AC-12 ;
  - tâche 2 : AC-2, AC-3, AC-13 ;
  - tâche 3 : AC-6 à AC-10.
- Le given, le when et le then de chacun ont été relus :
  - AC-9 lit le pied de page, construit en tâche 4, qui passe avant la tâche 3 ;
  - AC-8 choisit Rhinval par la carte ou par la recherche de la tâche 1 ;
  - AC-3 attend « aucune » sur « zzz », état construit en tâche 1.

## Tâches sans preuve attendue

**Mineur 1 — Tâche 0a : l'envoi à openrouteservice n'a aucune preuve sur le vrai flux avant que Vincent le lance.**
- Une requête mal formée ne se verra qu'au lancement, et coûtera sur le quota de 500 requêtes par jour.
- Correction : la commande de Vincent commence par un seul lot d'essai, avec Bordeaux, Caen et une commune des Landes.
- Le script s'arrête et affiche la réponse à la première erreur qui n'est pas « quota épuisé ».
- Cet essai mesure aussi, dès l'arrêt de la tâche 0c, la part des communes sans temps, c'est-à-dire le risque de la spec.

**Mineur 2 — Tâche 1 : la preuve « le temps d'une frappe sur les vraies données » n'a pas de protocole.**
- Trois mesures différentes sont possibles :
  - la fonction sur les 34 746 communes (sortie 1) ;
  - « une frappe au-delà de 100 ms » (condition d'arrêt) ;
  - « à jour ≤ 100 ms » (H179).
- Correction : n'en garder qu'une. Dans le navigateur, sur la version construite, on mesure de l'évènement `input` aux suggestions affichées, sur la saisie la plus large (« st » ou « sa »).

Les autres tâches ont une preuve observable : captures sur la version construite, sortie des contrôles, valeur de Bordeaux relue dans le fichier servi, adresse réécrite.

## Décisions cachées

**Majeur 3 — Le poids est mesuré en `gzip -9`, contre H195 et la leçon du 2026-11-24.**
- H195 demande de mesurer « avec la compression de l'hébergeur (leçon du 2026-11-24) ».
- La leçon établit que « le site Workers suit `brotli -q 3` » et interdit de reporter un rapport de compression d'un fichier à un autre. Pour un fichier fait de petits nombres, l'envoi réel pèse 8 % de moins qu'en `gzip -9`.
- Le plan écrit pourtant `gzip -9` partout : l. 37, 38, 82, 93, 153 et 169. Les seuils d'arrêt de 200 Ko et de 60 Ko peuvent donc se déclencher à tort, ou laisser passer à tort.
- Correction : mesurer en `brotli -q 3`, la compression de l'hébergeur. Si `brotli` n'est pas sur la machine, demander à Vincent avant toute installation, et ne pas revenir en silence à `gzip -9`.

**Majeur 4 — Le faux site des tests ne trouve `mer_min` et `codes_postaux` dans aucun jeu de test.**
- Le plan dit les prendre « des communes du jeu qui en portent » (l. 14). Or dans `tests/e2e/lib/carte.ts`, aucun jeu ne les porte. Les jeux viennent de loyer-mer (`FIXTURE`), de `metropole.json`, et de cadre-de-vie ou d'immobilier (le jeu `SIX` de chaque fichier de test).
- Ces deux champs ne sont que dans `acceptance.json` de recherche-et-mer. Et ses communes n'ont ni forme, ni loyer, ni `mer_km`.
- Le plan ne dit pas quel jeu sert `recherche.spec.ts`. La fixture « 6 communes », Rhinval compris, n'existe que comme jeu `SIX` de cadre-de-vie, avec les tuiles `tuiles-immobilier`.
- `carte.ts` exclut aujourd'hui le jeu « métropole » des recherches par code. Le plan, lui, laisse entendre que les communes A à E de « métropole » reçoivent leurs minutes (l. 114).
- Correction : écrire la règle dans le plan.
  - `carte.ts` lit `mer_min` et `codes_postaux` dans `acceptance.json` de recherche-et-mer, par code INSEE, comme il le fait déjà pour cadre-de-vie (`cadreParCode`), « métropole » compris.
  - `recherche.spec.ts` sert les communes de cadre-de-vie avec les tuiles `tuiles-immobilier`, comme le fait `emploi.spec.ts`.

**Majeur 5 — Le rayon d'accroche de H196 n'est fixé nulle part, et le fichier brut ne permettra pas de compter les causes.**
- H196 dit « rayon fixé en tâche 0 ». Aucune tâche ne le fixe.
- Le fichier `ors-mer.jsonl` ne garde que « les durées brutes ou `null` » (l. 78). La tâche 0b doit pourtant compter les communes sans temps par cause (l. 145 et 151), sans relancer l'envoi (l. 43). Avec les seules durées, on ne distingue pas « point non accroché à une route » de « aucune route jusqu'au point ».
- Correction, en tâche 0a :
  - fixer le rayon ; si le service de matrice n'en accepte pas, écrire celui qu'il applique et sa source ;
  - garder, pour chaque point, ce que la réponse dit de son accroche (point accroché et distance d'accroche, si elle les donne), et garder les erreurs ;
  - refaire une fois un lot en échec : H196 dit « échoue après un nouvel essai », et le plan ne prévoit qu'une reprise.

**Majeur 6 — La règle de recalage oublie `mer=aucun`.**
- La règle de la tâche 0c (l. 110) ne parle que de « `mer=<km>` ». Or `mer=aucun` apparaît 27 fois dans les critères et les tests :
  - interface-telephone AC-5 ;
  - immobilier : 3 fois dans `acceptance.json`, 8 dans `immobilier.spec.ts` ;
  - loyer-mer ;
  - `url.test.ts`, `prix.test.ts`, `adresse.spec.ts`, `telephone-feuille.spec.ts`, `categories.spec.ts`.
- Aujourd'hui, `aucun` vaut déjà Peu importe (`src/domain/url.ts`, l. 23 et 55). Garder `mer=aucun` comme ancien lien ignoré ne change donc rien à l'écran.
- Correction : écrire dans la règle que `mer=aucun` reste tel quel, ignoré et retiré de l'adresse comme tout ancien lien. Il ne devient pas `mer-min`.

**Mineur 3 — La règle des minutes des communes de test sans temps ne dit pas quel arrondi appliquer.**
- Elle dit « Minutes égales aux km arrondis » (tâche 0c, sortie 2), sans dire quels km ni quel arrondi.
- Correction : les km servis, arrondis à la minute, moitié vers le haut (H191). Par exemple, R1 et R2 de « métropole », à 300 km, valent 300 min, soit « 5 h ».

**Mineur 4 — Le format de la date de La Poste dans la mention (R63, tâche 4) n'est pas fixé.**
- Correction : suivre l'usage de CLAUDE.md, par exemple « (fichier du JJ/MM/AAAA) », écrit en dur dans `Mentions.tsx`.

**Mineur 5 — « Écart minutes / km » n'est pas défini (tâche 0b, sorties 4 et 5).**
- Un écart absolu et un rapport ne désignent pas les mêmes communes.
- Correction, en suivant la leçon du 2026-10-14 sur les extrêmes, donner les deux bouts :
  - les plus grands rapports minutes / km parmi les communes à moins de 50 km, suspectes d'un détour d'estuaire ;
  - les plus petits rapports, suspects d'un bac ou d'une accroche sur l'autre rive.
- Nommer aussi le service d'itinéraire des liens préparés pour la démo.

**Mineur 6 — Rien ne dit comment le calcul traite les bacs.**
- details.md dit que le temps compte « le détour par le premier pont (D4) ». Le plan ne dit pas comment l'envoi traite les bacs, alors que la Gironde et la Loire en ont.
- Correction : écrire, en tâche 0a, si la matrice peut écarter les bacs. Sinon, mettre au tableau de crédibilité une commune attendue en face d'un bac, par exemple Blaye.

**Mineur 7 — Un point de côte peut dépasser la taille d'un lot.**
- La règle « les communes qui partagent un point vont dans le même lot » (l. 73) devient impossible si plus de 3 499 communes partagent un point. C'est plausible : 34 746 communes se partagent 1 688 points.
- Correction : couper un tel point en plusieurs lots.

**Mineur 8 — La sous-ligne de population et le nom lu des suggestions.**
- AC-1 attend la suggestion « Quaibleu (13) ». Le contrat du système met la population sous le nom, dans la même option.
- Correction : écrire si le test lit le nom accessible de l'option, ou seulement le nom de la commune, pour que le constructeur n'ait pas à choisir.

## Le risque de la spec

**Mineur 9 — Le risque est mesuré, mais jugé tard.**
- La tâche 0b fait ce que la spec demande :
  - elle compte les communes sans temps, avec un arrêt au-delà de 2 % ;
  - elle prépare la confrontation de 10 villes et des plus grands écarts.
- Mais la crédibilité n'est jugée qu'à la démo. À ce moment, la tâche 3 aura déjà récrit environ 7 fichiers de critères et 19 fichiers de test. C'est le choix explicite de Vincent (l. 11).
- Or spec.md, à D5 révisée, prévoit le cas inverse : si la tâche 0 juge les minutes peu crédibles, il n'y a plus les km pour se replier, et l'on revient à Vincent.
- Correction, sans changer ce choix :
  - envoyer `credibilite-mer.md` à Vincent dès la fin de la tâche 0b, sans arrêter /build ;
  - faire l'essai d'un lot (Mineur 1), qui mesure la part des communes sans temps dès l'arrêt de la tâche 0c.

## Périmètre

**Majeur 7 — La tâche 0b casse un test existant que le plan n'accorde pas.**
- Preuve : `scripts/data/communes.test.ts`, l. 76, dans le test « D10 : les deux colonnes sont à la fin » :
  ```
  expect(champs.slice(-2)).toEqual(['type_env', 'montagne_km']);
  ```
- La tâche 0b ajoute `mer_min` à la fin de `communes.json` (l. 148), ce qui fait tomber ce test.
- Or le plan exige que la suite reste verte avant la tâche 3 (l. 34), et demande l'arrêt si un autre test protégé casse (l. 18). /build s'arrêtera donc à coup sûr en tâche 0b.
- Correction : ajouter ce test à « Accordé en validant ce plan », pour la tâche 0b, avec un seul changement : `slice(-3)` avec `mer_min`.

**Mineur 10 — Les tests du domaine peuvent ne plus passer la vérification des types (`npm run typecheck`).**
- En tâche 0b, `communeDeLigne` gagne `merMin`. Sept tests construisent une commune à la main, avec `merKm:` :
  - `score.test.ts` (9 fois), `emploi.test.ts` (2) ;
  - `proches.test.ts`, `prix.test.ts`, `format.test.ts`, `services.test.ts`, `mairies.test.ts` (1 chacun).
- Si `merMin` devient obligatoire dans le type `Commune`, ces tests échouent à `npm run typecheck`, même si `npm test` reste vert.
- Correction : écrire que `merMin` vaut `null` par défaut, comme `typeEnv ?? null`, ou mettre ces fichiers dans la liste des tests touchés, dans la règle de la tâche 0c.

**Mineur 11 — La tâche 4 dépasse 8 fichiers sans le dire.**
- Elle touche 3 fichiers de code et jusqu'à 7 tests protégés (l. 15 et 248). Le plan ne le déclare pas, alors qu'il le fait pour la tâche 3.
- Les tests trouvent les mentions par leur rôle de pied de page (`getByRole('contentinfo')`), et `Mentions.tsx` pose ce rôle explicitement. Le déplacement devrait donc casser peu de tests.
- Correction : le dire dans le plan, pour réduire la liste attendue.

**Mineur 12 — La tâche 3 est très lourde pour un constructeur qui ne voit qu'elle.**
- Elle couvre le domaine, l'adresse, les textes, les pastilles, environ 7 fichiers de critères, 19 fichiers de test, et CLAUDE.md.
- Correction possible :
  - 3a : les fonctions de durée et de comparaison, testées seules, sans branchement, suite verte ;
  - 3b : le branchement et le recalage.
- À défaut, écrire l'ordre interne de la tâche.

**Mineur 13 — Les règles contredites de cadre-de-vie ne sont pas amendées.**
- Le tableau d'impact classe comme contredites R28, R31, H69, H75, H76 et H77 de cadre-de-vie. Aucune tâche ne les annote.
- Correction : en tâche 3, ajouter dans `docs/specs/2026-10-14-cadre-de-vie/details.md` la mention « remplacé par R60–R62 de recherche-et-mer ».

Sept tâches au lieu de six : accepté par Vincent (l. 9). Aucun paquet n'est prévu.

## Ordre

**L'ordre est faisable.**
- L'ordre est 0a → 0c → arrêt → 1 → 2 → 4 → 0b → 3.
- Les tâches 1, 2 et 4 ne lisent pas les minutes.
- Aucune tâche n'utilise une action construite plus tard.
- La tâche 1 donne le premier squelette de bout en bout : chercher, choisir, ouvrir la fiche.
- Une seule faille : la suite casse en tâche 0b (Majeur 7).

**Mineur (ordre) — Lue à la lettre, la règle « aucune autre requête n'est permise » (l. 36) fait échouer la vérification de bout en bout.**
- Choisir Auch cadre la carte, ce qui charge les tuiles de l'IGN, sur un autre site.
- L'étape 6 de la vérification (« aucune requête vers un autre site » pendant les étapes 1 à 3) échouerait donc sur les vraies données.
- Correction : la règle vaut pour la saisie. Aucune requête ne part pendant la frappe, et aucune requête ne contient le texte tapé. Les tuiles chargées par le cadrage après un choix sont attendues.
- AC-1 relève les requêtes une fois la carte au repos.
