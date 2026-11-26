# Relecture du plan — services, révision D19, D20

Statut : terminé

Relu le 2026-11-26 contre `spec.md`, `details.md`, `acceptance.json`, `mesures.md` (section révision) et le code (`src/domain/services.ts`, `src/domain/url.ts`, `src/ui/Services.tsx`, `tests/e2e/lib/carte.ts`, `tests/e2e/services.spec.ts`, `src/domain/services.test.ts`, `scripts/data/services.py`, `scripts/data/services.test.ts`). Aucun test n'a été lancé : les constats sur l'état des tests viennent de la lecture du code.

Gravité : **bloquant** (le plan ne peut pas être suivi tel quel), **majeur** (le constructeur devra trancher seul), **mineur**.

## Critères sans tâche ou dans deux tâches

- **Majeur : AC-13 est réparti sur deux tâches.** Les valeurs sont testées en tâche 0, « aucune colonne commerce » en tâche 2 (plan.md l.38 et l.56). Le test nommé « AC-13 » existerait donc en tâche 0 sous une forme affaiblie, sans une partie de son `then`. Cela va contre la règle « jamais affaiblir un AC ». Proposition : rattacher AC-13 à la tâche 2 seulement. En tâche 0, la preuve des valeurs reste le contrôle `AC13` de `services.py` (l.416-418, qui s'arrête déjà sur un écart), avec la comparaison des chaînes.
- Les autres critères sont bien rattachés : AC-5 en tâche 0 ; AC-1, AC-6, AC-18, AC-19 et AC-20 en tâche 1.

## Tâches sans preuve attendue

- **Bloquant : la preuve « `npm test` vert » de la tâche 0 est impossible (plan.md l.39 ; aussi l.15 et l.16).** La suite est déjà rouge sur `main`, parce que `acceptance.json` a été révisée dans le commit bc13bcc : la fixture n'a plus de `commerce`.
  - `ecrireServices` lit `l.temps['commerce']`, qui vaut `undefined`. La ligne `if (!Number.isInteger(m) || m < 1) throw` (`src/domain/services.ts` l.200 et l.204) lève alors une erreur.
  - Tests touchés : tous ceux de `tests/e2e/services.spec.ts` qui servent `SIX_SERVICES` (l.13-18, puis `servicesJson` de `carte.ts` l.123-130) ; `src/domain/services.test.ts` (`servi(SIX)`, l.37-40) ; « AC-5 » de `scripts/data/services.test.ts`, qui lit `ex['commune_X_commerce']`, absent de la fixture, d'où une TypeError (l.35 et l.42).
  - La tâche 0 ne touche pas au code de la page, donc ces tests ne repassent qu'en tâche 1.
  - Proposition : avant la tâche 0, relever la sortie de `npm test` et la liste des tests rouges. Preuve de la tâche 0 : « vert, sauf ces tests-là, déjà rouges, qui repassent en tâche 1 ». La phrase « Toute la suite passe à la fin de chaque tâche » (l.15) vaut alors à partir de la tâche 1.
- **Majeur : les tests prévus en tâche 0 ne peuvent pas s'écrire sans la table `SERVICES` de la tâche 1 (plan.md l.38).**
  - `scripts/data/services.test.ts` fabrique les valeurs attendues avec `temps()`, construit sur `SERVICES` de la page (l.25-28). Il lit le fichier servi par `lireServices` (l.85-89).
  - En tâche 0, `SERVICES` a encore 10 entrées, avec `commerce` et sans `urgences` ni `supermarche`. La sortie de `services.py --extrait` aura 12 clés, donc le `toEqual` d'AC-5 (l.54) échoue. Les temps des urgences ne sont pas lisibles par `lireServices`.
  - `temps({ supermarche: 9 })` échoue aussi au contrôle des types (`tsconfig.json` inclut `scripts` et `tests`).
  - L'en-tête du CSV du test (`TYPES`, l.18-19) doit gagner `D106`, sinon `lire_carreaux` s'arrête (`services.py` l.226).
  - Proposition : écrire dans le plan qu'en tâche 0, ce test compare la sortie Python et les chaînes du fichier par leurs noms (`json.urgences[i]`), sans passer par `SERVICES`. Sinon, déplacer ces tests en tâche 1 ou en tâche 2.
- **Mineur : `npm run typecheck` n'apparaît dans aucune preuve.** Or `ServiceCle`, `TempsServices` et `ReglageServices` changent, et cela se répercute dans les trois fichiers de tests. Proposition : l'ajouter à la preuve de chaque tâche.
- **Mineur : la condition d'arrêt de H163 en tâche 1 ne s'observe pas (l.49).** Elle dit « si un doute apparaît ». Proposition : mesurer une fois le geste « Urgences 30 min » comme dans la tâche 3b d'origine (limite : + 115 ms), ou écrire qu'on ne le mesure pas.
- **Mineur : la vérification de bout en bout se fait « sur la version en ligne » (details.md l.149), mais la tâche 2 la joue sur `npx vite preview` (l.57).** Proposition : noter que les étapes 1 et 5 (Auch, Saint-Véran) sont refaites en ligne au /ship.

## Décisions cachées

- **Majeur : la règle « 2 communes ordinaires fausses → retour à Vincent » de la spec n'a ni arrêt ni décision écrite.** Elle est dans « Le risque » (spec.md l.35) et dans H205 (details.md l.136). Le plan ne s'arrête qu'à partir de 2 bases de SMUR (l.40) et renvoie le reste à la démo, avec la mention « son choix du 2026-11-26 » (l.8). Ce choix n'est écrit ni dans la spec ni dans une H-n. Résultat : les tâches 1 et 2 se construisent même si le tableau donne « non » sur 2 communes ordinaires. Proposition : ajouter un arrêt en tâche 0 quand l'avis est « non » sur 2 communes ordinaires ou plus, ou faire amender H205 par Vincent.
- **Mineur : le retéléchargement de DuckDB est dit « couvert par D11 » (l.30), alors que H208 précise « sans téléchargement ni installation ».** Les règles de Vincent demandent de toujours demander avant une installation. Proposition : citer l'accord exact, ou mettre « DuckDB a disparu » dans les conditions d'arrêt.
- **Mineur : l'arrêt « un compte du supermarché différent de mesures.md » (l.40) n'est pas tenu par le script.** `ANCIENS` est seulement affiché (« information », `services.py` l.435-440). Pour les urgences, mesures.md ne donne pas de compte « sans chiffre », et ses comptes portent sur 34 728 communes. Proposition : faire des comptes du supermarché un `check` du script, et dire quel « sans » mettre pour les urgences dans `ANCIENS`.

## Le risque de la spec

- Oui, la tâche 0 le mesure : `credibilite-urgences.md`, 10 communes, nombre de bases de SMUR seules, critère « même côté des pastilles », Tende pour le supermarché (l.36). Ce qui manque est l'arrêt sur les communes ordinaires fausses (voir « Décisions cachées »).
- Les valeurs d'urgences d'AC-13 viennent d'un essai sans les parts par IRIS. L'arrêt « une valeur d'AC-13 différente » (l.40, l.66) est le bon garde-fou.

## Périmètre

- Mineur : la tâche 0 liste `scripts/data/services-retraits.csv` dans ses fichiers (l.37) mais dit « inchangé » (l.32). Elle compte 8 fichiers ; sans celui-là, 7.
- Mineur : la tâche 1 compte 6 fichiers, plus jusqu'à 3 tests du téléphone, soit 9 au pire, au-dessus de 8. C'est acceptable, puisque ces tests ne changent que pour le décalage.
- 3 tâches : dans le cadre perso. Aucun fichier oublié : `commerce` apparaît dans `src`, `scripts` et `tests` uniquement dans les fichiers listés. `phraseTraversee` (`slice(0, 7)`, `services.ts` l.111) et `url.ts` l.111 relèvent bien de la tâche 1. `FicheServices.tsx` et `format.ts` suivent `SERVICES` et `filtresServices` sans changement.

## Ordre

- L'ordre « données d'abord » tient pour le vrai site.
  - `lireServices` ne lit que les clés de `SERVICES` (`services.ts` l.42-46). Avec 12 chaînes, la page d'aujourd'hui marche, et après la tâche 1 elle ignore `commerce`.
  - `tests/e2e/lib/carte.ts` fabrique le fichier depuis `SERVICES` et `TempsServices` (l.123-130) : il n'a pas à changer.
- Il ne tient pas pour la suite de tests, rouge depuis la révision de la fixture (voir le constat bloquant). La tâche 0 ne donne pas non plus de squelette de bout en bout visible : les urgences n'apparaissent à l'écran qu'en tâche 1. Pour une révision de 3 tâches, c'est acceptable, à condition de corriger la preuve de la tâche 0.
