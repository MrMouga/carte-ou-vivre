# Relecture spec — services, révision D19, D20
Statut : terminé

Suite de tests (relancée par moi le 2026-11-27) : Vitest `Test Files 27 passed (27) · Tests 462 passed (462)` (09:22) ; `npm run typecheck` sans erreur ; `check-tokens : 49 fichier(s), aucune valeur arbitraire` ; Playwright `515 passed, 4 failed, 53 skipped, 1 did not run (19.6m)` (09:22-09:42, charge 14 à 19) : les 4 rouges sont hors services (`emploi.spec.ts:381` et `:422` en bureau, `cadre-de-vie.spec.ts:489` et `:523` en mobile), tous au même endroit : `data-carte-prete` pas à « 1 » en 5 s. Relancés seuls, 3 fois chacun dans les deux projets : 22 verts sur 24 ; les deux de cadre-de-vie en mobile relancés seuls, un par un, 3 fois : 6 verts sur 6. Ils sont instables quand la machine est chargée, mais pas cassés (leçon du 2026-10-15). Aucun rouge dans `services.spec.ts`. · Périmètre : `ad386e7..a9ab874` (commits de code : 45490a0, 7c90001, 6e35999, 96ee91d)

## Constats

Aucun Bloquant, aucun Majeur. L'affirmation « la révision est livrée conforme au plan et à la spec » tient : je n'ai pas réussi à la réfuter. Il reste trois points mineurs.

[Mineur] La spec dit à Vincent « 174 communes au-delà d'une heure » pour les urgences. Le fichier servi en a 166. Ce chiffre faux est dans le « Pourquoi » de D19, que Vincent lit.
  Où : `docs/specs/2026-11-23-services/spec.md` D19 ; `details.md` H202 ; `scripts/data/services.py`, `ANCIENS['urgences']['>60']: 174` (le script l'affiche comme référence, sans le contrôler).   Preuve : j'ai décodé `public/data/services.json`. Il y a 34 728 communes avec un temps et 34 562 à 60 min ou moins, donc 166 au-delà ; 18 n'ont pas de chiffre. Les autres comptes de H202 (851, 4 025, 9 558, 16 243, 27 415, 33 676, 34 562) sont égaux au chiffre près. Le constructeur l'a noté dans progress.md sans toucher la spec, et il a eu raison : la spec ne lui appartient pas.
  Correction : Vincent (ou /spec) remplace 174 par 166 dans D19 et H202 ; la valeur de référence `ANCIENS` suit.   Réf : D19, H202, H205.

[Mineur] La preuve sur les vraies données (vérification de bout en bout, étape 6, L'Île-d'Yeu) a été faite avant le dernier changement de code. Le commit de simplification 96ee91d (08:31) réécrit `phraseTraversee`, qui décide si la phrase de la traversée s'affiche ; les captures `T2-e*` datent de 22:31 à 22:34 la veille. Après 96ee91d, seuls des tests sur la fixture ont été relancés.
  Où : `src/domain/services.ts`, `phraseTraversee` : `.slice(0, 8)` devient « tout service hors des trois gares ».   Preuve : dates des fichiers de `captures/` et `git log`. Le changement est équivalent : la table met les trois gares en dernier. Il est couvert par l'unitaire « R54 révisée : la phrase de la traversée compte les huit premiers services » (urgences seules, supermarché seul, gare seule) et par AC-9 en e2e, verts chez moi. Sur les vraies données, L'Île-d'Yeu a supermarché 4, crèche 3, école 3 et collège 3 : la phrase doit donc rester.
  Correction : rejouer l'étape 6 sur la version construite de `a9ab874`. La relecture qa en cours (serveur sur le port 5190) peut le faire ; sinon, /ship la rejoue en ligne.   Réf : CLAUDE.md, « Fini = effet observé sur le vrai flux » ; R54.

[Mineur] Deux valeurs que la fiche affiche sont fausses pour un lecteur, même si elles respectent les règles. Elles sont déjà signalées par le constructeur et laissées au jugement de Vincent à la démo.
  Où : `credibilite-urgences.md`. Chamonix-Mont-Blanc affiche « Urgences : 4 min » ; c'est une base de SMUR (équipe mobile) avec un centre de soins de jour en saison, fermé aujourd'hui. L'accueil ouvert toute l'année est à Sallanches, à 33,9 min : avec lui, Chamonix passerait de l'autre côté des pastilles 15 et 30. Tende affiche supermarché « plus d'une heure » pour 27 min réels (Breil-sur-Roya).   Preuve : tableau et sources relus. Chamonix est 1 base de SMUR seule sur 10 communes, sous le seuil d'arrêt de 2 (H205). Tende tombe du même côté des pastilles, donc n'est pas « faux » au sens de H205. C'est exactement « le risque » que nomme la spec. Coût pour Vincent : une commune ordinaire sur six (Chamonix) montre un temps d'urgences qui n'est pas celui d'un accueil. De plus, seuls 49 des 679 équipements D106 portent « SMUR » dans leur nom, donc on ne peut pas compter les autres cas sans source.
  Correction : aucune pour /build. À la démo, Vincent coche les cases « SMUR : garder / retirer » et « Tende, supermarché : garder / retirer » ; un retrait se fait par une ligne de `scripts/data/services-retraits.csv` (D12, H209).   Réf : D19, H204, H205, H209, D12.

## Couverture des critères (mode spec)
J'ai relu chaque test contre le `then` de son critère. Tous les `passes: true` d'`acceptance.json` ont un test réel et vert. Dans `acceptance.json`, le diff de la plage ne change que des drapeaux `passes`, de `false` à `true` (7 critères) ; aucun `given / when / then` ne change.

| AC | Test | Statut | Note |
|---|---|---|---|
| AC-1 | `tests/e2e/services.spec.ts:331` | couvert | ordre exact des 5 lignes et de leurs crans (Urgences 15/30/45), noms des 7 groupes, `getByText('Commerce alimentaire')` à 0, seul « Toutes » pressé, liste d'AC-1 de mairies ; vert en bureau et en mobile |
| AC-5 | `scripts/data/services.test.ts` « AC-5 : supermarché de X 9 min … » | couvert | les B202 de la fixture X sont plus petits (2, 4) : l'attendu de 9 prouve bien que l'épicerie ne compte pas ; Y, Z, V, W, arrondis et ville à arrondissements inchangés |
| AC-6 | `services.spec.ts:49`, plus les unitaires AC-6 de `src/domain/services.test.ts` | couvert | les 11 lignes exactes de Portmer ; phrase des limites entière (H159 révisée) ; Terrebasse urgences et gare régionale « plus d'une heure » ; Quaibleu 60 min ; les 6 valeurs de Rhinval |
| AC-13 | `scripts/data/services.test.ts` « AC-13 : … aucune colonne commerce » | couvert | toutes les valeurs du critère sont vérifiées, plus `Object.keys(json)` sans `commerce` ; je les ai recontrôlées en décodant le fichier moi-même : identiques |
| AC-18 | `services.spec.ts:457` | couvert | adresses, comptes, listes et scores exacts ; une seule pastille cochée ; les 3 raisons au texte exact |
| AC-19 | `services.spec.ts:476` | couvert | `medecin:10,supermarche:5`, puis `medecin:10,urgences:45,supermarche:5` (ordre fixe), liste inchangée |
| AC-20 | `services.spec.ts:491`, plus l'unitaire « AC-20 » | couvert | les 3 adresses réécrites, les pastilles cochées, les listes d'AC-2 et d'AC-1 de mairies |
| AC-2 à AC-4, AC-7 à AC-12, AC-14 à AC-17 (Ne change pas) | `services.spec.ts` et unitaires | couvert | tous verts dans ma suite, en bureau et en mobile ; leur `given / when / then` n'a pas bougé |
| Tranches précédentes (loyer-mer, interface-telephone, proches, immobilier, cadre-de-vie, proches-fiables, mairies, emploi, recherche-et-mer) | leurs `*.spec.ts` | couvert | verts, sauf 4 rouges sous charge qui passent quand on les relance seuls (voir l'en-tête) ; aucun de leurs fichiers de test n'a été modifié dans la plage |

## Ce qui est conforme
- **R51, H152, H202, H153** : la catégorie a 5 lignes, « Urgences » juste après « Médecin » ; crans 15/30/45 pour les urgences et 5/10/15 pour le supermarché (`cransService`) ; les groupes sont nommés par leur ligne ; les trois lignes à un seul temps sont décrites une fois (`SERVICES_SIMPLES`), toutes inactives pendant le chargement (R57).
- **R52, H158, H208, H165** : les urgences lisent D106 et le supermarché B104 et B105, sans B201 ni B202 (`TYPES` de `services.py`). L'extrait refait a sa nouvelle empreinte écrite dans le script et dans CLAUDE.md.
- **Données inchangées** : j'ai comparé `services.json` à `ad386e7` et à `a9ab874`. Les 9 chaînes qui ne devaient pas bouger (médecin à gare grandes lignes, sans urgences ni supermarché) sont identiques caractère pour caractère (0 différence), de même que `codes` et `iles_sans_pont`.
- **Aucun reste de `commerce` servi** : le fichier a exactement `codes`, les 11 services dans l'ordre de R54, puis `iles_sans_pont`. `commerce` n'est plus dans `src/` que dans des commentaires et des tests, ni dans `scripts/data/services-retraits.csv` (la ligne `06163,commerce` est retirée, H209). `tests/e2e/lib/carte.ts` n'a pas été touché.
- **R53, H160** : les raisons suivent `filtresServices` (médecin, urgences, supermarché, scolarité, gare), comme le vérifie l'unitaire « H160 ». Au-delà de 60 min, la raison dit « Urgences plus d'une heure : … », vérifié en e2e.
- **R54, H159, H204** : 11 lignes ; la phrase des limites a les deux phrases ajoutées, avec les espaces insécables ; la phrase de la traversée compte tout service hors des trois gares.
- **R55, H203** : `commerce` est un nom inconnu, retiré sans message ; l'ordre `medecin`, `urgences`, `supermarche` est respecté à l'écriture de l'adresse.
- **H206** : 330 752 octets en `gzip -9` d'après le script (330 766 avec la commande `gzip -9 -c`, qui ajoute le nom du fichier), sous la limite de 350 000.
- **AC-13 contrôlé par le script** (`AC13` de `services.py`) et comptes du supermarché contrôlés avec arrêt (`SUPERMARCHE`), comme le plan le demande.
- **Bout en bout** (`captures/T2-bout-en-bout.txt`) : les 8 étapes sont jouées sur les vraies données, en bureau et à 390 px. La fiche d'Auch a les 11 valeurs de details.md ; Saint-Véran a la raison « Urgences 55 min : au-dessus de ton plafond de 30 min » ; Auch passe ; L'Île-d'Yeu a la phrase de la traversée ; l'ancien lien `commerce:5,medecin:10` est réécrit en `medecin:10`.
- **Dates des preuves** : chaque vérification de l'orchestrateur notée dans progress.md commence après le dernier commit de sa tâche (T0 20:52:33 → 20:52 ; T1 21:39:25 → 21:39 ; T2 22:34:47 → 22:35 ; simplification 08:31:27 → 08:40). Seule réserve : les captures du bout en bout, voir le constat 2.
- **Détours** : aucun revert dans la plage. Un seul fichier sort de la liste de sa tâche : `scripts/data/services.test.ts`, touché en tâche 1 alors qu'il était prévu en tâche 2. C'est déclaré dans progress.md, justifié (l'ancien test cassait les types) et couvert par l'accord du plan.
- **Tests existants modifiés** : tous dans les fichiers que l'accord du plan autorise. Les vérifications retirées sont remplacées par leurs équivalents révisés (relus un à un : Supérieur et Gare grandes lignes « plus d'une heure », Gare régionale 60 min, `supermarche:15` avec `bien`, « 4 choix », raisons « sans habitant » sur 9 services). Aucune attente n'est affaiblie, et aucun test du téléphone n'a été modifié.

## Non vérifié
- La version en ligne : rien n'est poussé. Le « C'est réussi si » de la spec, mesuré en ligne, revient à /ship.
- Les captures elles-mêmes (images) : je n'en ai ouvert aucune ; je me suis fié à `T2-bout-en-bout.txt`.
- La mesure de réaction de la carte (H163, + 17 ms), non rejouée.
- Les supermarchés de la haute Tinée : Saint-Dalmas-le-Selvage, Saint-Étienne-de-Tinée et Isola affichent aussi « plus d'une heure », possiblement le même détour de routes que Tende. Isola n'a qu'une supérette (B201) dans la BPE, donc ce n'est pas forcément faux. Ces communes sont hors du tableau de H205 et je ne les ai pas confrontées à un itinéraire.
- H207 (demander à D si elle a vu « Services ») : action de Vincent avant la démo.
- Les tests du téléphone, la saisie au clavier et l'accessibilité au-delà des tests : ils relèvent de la relecture qa.
