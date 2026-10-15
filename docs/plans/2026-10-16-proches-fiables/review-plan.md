# Relecture du plan — proches-fiables
2026-10-16 · relecteur neuf (mode plan) · plan relu : [plan.md](plan.md) · contre : [spec.md](../../specs/2026-10-16-proches-fiables/spec.md), [details.md](../../specs/2026-10-16-proches-fiables/details.md), [acceptance.json](../../specs/2026-10-16-proches-fiables/acceptance.json) · faits vérifiés dans `src/proches/`, `src/ui/`, `src/domain/score.ts`, `src/map/ProcheMarkers.ts`, `tests/e2e/lib/ign.ts`, `tests/e2e/proches-*.spec.ts`.

**Verdict : aucun Bloquant.** 7 Majeurs, à corriger dans le plan avant /build, parce que chaque constructeur ne voit que sa tâche : sinon un constructeur s'arrêtera (fichier ou test « hors périmètre »), ou choisira seul un état de transition. Chaque AC est dans une seule tâche, et l'ordre des tâches tient.

Répartition vérifiée : AC-1 → T1 · AC-2, AC-3 → T2 · AC-4, AC-5 → T3 · AC-10 → T4 · AC-6, AC-7, AC-8, AC-9, AC-11, AC-12 → T5. Aucun AC sans tâche, aucun dans deux tâches. Le faux IGN (`tests/e2e/lib/ign.ts`) peut simuler une zone muette (route jamais servie) et une erreur par zone (il lit `costValue` et `point` de chaque demande, et compte les demandes dans `demandes.zones`) : il suffit de l'étendre en T1, comme le plan le prévoit. L'état « indisponible » vit aujourd'hui dans `useProches.ts` (l. 25, 64, 101, 131-136), `memoire.ts` (type l. 9, relecture l. 123), `LigneProche.tsx` (l. 21-32, 46-83), `Fiche.tsx` (l. 22-24), `Pastilles.tsx` (l. 12), `Proches.tsx` (résumé, l. 266-273) et `ProcheMarkers.ts` (l. 15-28).

## Critères sans tâche ou dans deux tâches

- **Majeur — T2, AC-2 et AC-3 : le proche partiel ne compte pas dans le score avec les fichiers donnés à T2.** La liste « 2 communes passent… Grandeville 17 » d'AC-2 demande que le proche partiel entre dans `prets`. Or `prets` est calculé dans `src/proches/useProches.ts` (l. 165-171), et il ne garde que `etat === 'pret'`. Ce fichier n'est pas dans les fichiers de T2. T1 ne dit pas non plus si un partiel entre dans `prets` : « montre ses temps comme un proche prêt » ne parle que de la ligne. *Correction* : dire dans T1 ou dans T2, au choix, mais une seule fois, que « `prets` = prêt ou partiel (D5) », et ajouter `useProches.ts` aux fichiers de la tâche retenue. Pour T3, écrire de même que « `prets` inclut le proche km, avec ses distances et son plafond en km » (`useProches.ts` y est déjà listé).
- **Majeur — T3, AC-4 et AC-5 : des fichiers nécessaires manquent.** Il en manque trois :
  - `src/ui/Fiche.tsx`. `ligneProche` (l. 22-27) écrit « trajets indisponibles » et devra écrire « Rochelleville (17) : 88 km à vol d'oiseau » (AC-4).
  - `src/ui/Proches.tsx`. Le résumé replié compte « indisponible » (l. 266-273), et un proche km doit y compter comme « approximatif ».
  - `src/proches/memoire.ts`, pour retirer `'indisponible'` du type `EtatProche`.

  *Correction* : ajouter ces trois fichiers à T3 (voir aussi *Périmètre* : T3 dépasse alors 8 fichiers).
- **Mineur — AC-6 (a) et (b), placé en T5.** Ces deux cas vérifient le choix de l'état au moment de l'ajout : le module de T1, partiel en T2, km en T3. Un défaut de seuil de R33 (couverture contre plafond) ne se verrait donc que deux tâches plus tard. *Correction* : AC-6 reste en T5, mais T3 joue (a) et (b) comme contrôle, sans les marquer « passes », ou ajoute un test hors critère « zones-120-a-180-toujours → km » dans `proches-fiables.spec.ts`.

## Tâches sans preuve attendue

- **Majeur — T3 : la preuve `grep -rn "Trajets indisponibles" src/` sera vide alors que le défaut reste.** La fiche et la pastille écrivent « trajets indisponibles » en minuscules (`Fiche.tsx:24`, `Pastilles.tsx:12`), et l'état s'écrit `'indisponible'` dans cinq fichiers. *Correction* : `grep -rniE "trajets indisponibles|'indisponible'" src/` doit être vide. Les messages légitimes « Recherche d'adresse indisponible » (`Proches.tsx:66`) et « Fond de carte indisponible » (`Status.tsx`) ne sont pas touchés par ce motif.
- **Mineur — T1 : aucune preuve sur le vrai flux** (règle « Fini » de CLAUDE.md) : seulement la fixture. *Correction* : ajouter, sur la version locale avec le vrai IGN, un ajout de « 12 rue de la Paix, Nantes » avec une route du navigateur de test qui fait échouer une fois (502) la zone de 75 min. Attendu : 13 demandes, proche prêt, liste des demandes recopiée (sans le nom du proche).
- **Mineur — T3 : la capture d'un proche en km ne dit pas sur quelles données elle est faite.** *Correction* : faire en T3 l'étape 2 de la vérification de bout en bout (vraies données, calcul de trajets bloqué, « 120 km au plus », distance de La Rochelle comparée à celle de T0). T5 la rejoue ensuite avec les étapes 1 et 3.
- **Mineur — H92 (refus 429 → second essai 5 s plus tard) n'a aucun test.** Les tests de T1 ne citent qu'« une zone en erreur redemandée une fois ». *Correction* : ajouter un test unitaire en T1 : refus 429, second essai pas avant 5 s, passé par la file commune (250 ms au moins depuis le départ réel précédent). Dire aussi si le refus met en pause toute la file ou seulement le second essai : H92 dit « il attend 5 s », pas la file entière.
- **Mineur — T5 : deux interactions de details.md sans test.** Ce sont « Retirer pendant **recalcul** → son calcul s'arrête ou ne part pas » et le cas limite « curseur bougé pendant un recalcul → le plafond affiché à l'arrivée décide de l'état et de la conversion ». H100 (aucune annonce nouvelle) n'est vérifiée nulle part. *Correction* : un test hors critère par interaction en T5, plus un contrôle que le texte de la zone d'annonce ne change pas pendant un recalcul.

## Décisions cachées

- **Majeur — T1 : l'état de transition entre T1 et T3 n'est pas écrit.** T1 décide pret / partiel / km et termine le calcul à 45 s, mais l'affichage de partiel arrive en T2 et celui de km en T3. Or `npm test` doit rester vert après T1. Plusieurs tests hors critère attendent encore « indisponible » après une panne ou 45 s sans zone :
  - `proches-etats.spec.ts` : H21 (l. 137), 429 (l. 171), et le test d'AC-10 de proches (l. 95) ;
  - `proches-mobile.spec.ts:100` (cibles « Réessayer ») ;
  - `proches-carte.spec.ts:165` (repère `data-etat="indisponible"`).

  De plus, « la ligne d'un proche partiel montre ses temps comme un proche prêt », sans aucun fichier d'interface en T1, impose de faire passer partiel pour prêt, ce que le plan ne dit pas. *Correction* : écrire la transition dans T1, par exemple : « jusqu'à T2, un résultat partiel est exposé comme `pret` avec ses temps ; jusqu'à T3, un résultat km est exposé comme `indisponible`, comme aujourd'hui. Les tests existants ne changent pas en T1. T2 expose `partiel`, T3 expose `km` et retire `indisponible`. »
- **Majeur — `tests/e2e/proches-temps.spec.ts` est absent de la règle de recalage et de T1.** Ce sont des tests hors critère (tâche 2a de proches). Ils appellent `ign.calculerTemps` directement et attendent trois choses :
  - une liste de fins (`Uint16Array`), l. 21 et 36 ;
  - une erreur levée quand le service est en panne (« Failed to fetch »), l. 48-52 ;
  - une erreur levée sur un refus 429 « sans demander les autres zones » (moins de 12 demandes), l. 54-59.

  T1 change ces trois comportements (D1, H92). Le constructeur trouvera ce fichier rouge hors de son périmètre et s'arrêtera. *Correction* : ajouter `proches-temps.spec.ts` à la règle de recalage (l. 15 du plan) et aux fichiers de T1, avec les nouveaux attendus : panne → 24 demandes, aucune erreur levée, couverture 0 ; 429 → chaque zone redemandée une fois, 5 s plus tard.
- **Mineur — délai du faux IGN.** La fixture de proches-fiables dit « chaque zone répond 1 s après sa demande ». Celle de proches (et `DELAI_ZONE_MS = 1000 / 12` dans `lib/ign.ts:25`) dit « chaque proche répond 1 s après le début de son calcul ». Changer le délai par défaut toucherait tous les tests de proches (*Ne change pas*). *Correction* : en T1, `delaiZoneMs: 1000` est passé seulement dans `proches-fiables.spec.ts`, et le délai par défaut ne change pas.
- **Mineur — la présentation de la ligne d'un proche approximatif n'est fixée nulle part,** alors que trois constructeurs (T2, T3, T5) en construisent chacun une partie. Restent à décider :
  - la couleur des phrases : « indisponible » est en `text-foreground`, les autres en `text-muted-foreground` ;
  - l'ordre des phrases et du lien ;
  - la forme du lien : `Button variant="lien"` avec `max-bureau:min-h-toucher`, soit 44 px à 390 px ; le test « cibles des proches » (`proches-mobile.spec.ts:100`) le visera à la place de « Réessayer » ;
  - le nom accessible, `Recalculer avec l'IGN <nom>` comme `Retirer <nom>` : sans le nom, 5 proches donnent 5 liens au même nom ;
  - l'`aria-valuetext` du curseur en km (« 120 km au plus »).

  *Correction* : un paragraphe « Ligne d'un proche approximatif (décidé par Claude, par délégation) » en tête du plan, recopié dans T2, T3 et T5.
- **Mineur — T2 dit que le lien « Recalculer avec l'IGN » est « sans effet avant T4 »**, mais c'est T5 qui l'active. *Correction* : écrire « avant T5 ».
- **Mineur — T1 : « format dans le stockage décidé ici, compatible avec la lecture du format v1 » est ambigu.** Cela peut désigner le codage en mémoire de la page (marque « jusqu'à » dans les temps) ou le stockage du navigateur (T4). Si partiel est exposé comme `pret` (voir plus haut), `ecrireProche` l'écrira en v1 avec `pret: true`, et il reviendra « prêt » complet à la réouverture entre T1 et T4. Ce n'est vrai qu'en local, mais un test de T2 ou T3 qui rouvre la page peut en dépendre. *Correction* : « T1 décide seulement le codage en mémoire de la page ; `memoire.ts` ne change que son type ; T4 décide le format gardé ».

## Le risque de la spec

- **Mineur — le risque n'est qu'à moitié mesuré.** La spec demande deux moments de la journée ; T0 accepte une seule série (« si la session dure, sinon le dire »). Dans une session de nuit, la mesure sera donc probablement unique et faite de nuit. Le plan le reconnaît, et la mesure ne change pas ce qu'on construit. *Correction* : ajouter à *Reporté* « seconde série de T0, de jour, à `/ship`, avec la part de proches partiels ou km sur les 3 départs ».
- **Mineur — T0 : le repli « corps des 502 / 504 du soir de la démo » n'existe pas.** `demo.md` (*Au passage*) ne donne que les statuts (une 502, deux 504 après 60 s), pas les corps. Le code ne lit que `r.ok` : le corps n'a pas d'effet. *Correction* : « sans réponse 502 ou 504 réelle, le faux IGN répond avec un corps vide ou minimal ; ce n'est pas un blocage ».

## Périmètre

- **Majeur — T3 dépasse 8 fichiers de code et 2 h.** Avec les fichiers manquants (voir plus haut), T3 compte 10 fichiers de code : module de distance, `score.ts`, `format.ts`, `LigneProche.tsx`, `Pastilles.tsx`, `ProcheMarkers.ts`, `useProches.ts`, `Fiche.tsx`, `Proches.tsx`, `memoire.ts`. S'y ajoutent 4 fichiers de tests e2e à recaler et le retrait d'un test d'AC protégé. *Correction* : couper en deux tâches.
  - T3a, repli km : distance, score, formats, `useProches.ts`, `LigneProche.tsx`, `Fiche.tsx` ; AC-4.
  - T3b, km partout et fin d'« indisponible » : pastilles, repères, résumé, type, recalage des tests hors critère, retrait du test d'AC-10 de proches ; AC-5.
- **Majeur — T5 est trop gros pour 1 à 2 h.** Il porte 6 critères, dont AC-8 en 5 cas et AC-6 en 3 cas, plus la priorité de la file, H97, la conversion du plafond, le lien manuel et la vérification de bout en bout sur le vrai IGN. *Correction* : couper en deux tâches.
  - T5a, recalcul à l'ouverture : 15 min, remplacement H97, conversion ; AC-6, AC-7, AC-8, AC-12.
  - T5b, « Recalculer avec l'IGN » et priorité d'un ajout ou d'un recalcul manuel : AC-9, AC-11 ; vérification de bout en bout, étapes 1 à 3.

  Le plan passe alors à 8 tâches, au-dessus des ~6 du gabarit perso : c'est justifié par les 12 critères et les deux tailles ci-dessus, et le plan doit le dire.

## Ordre

- Aucun constat. T1 donne un squelette de bout en bout : nouvel essai par la vraie file, proche ajouté par l'interface, AC-1 en e2e. L'enchaînement T2 (partiel) → T3 (km) → T4 (mémoire v2) → T5 (recalcul) respecte les dépendances de chaque AC. Il reste seulement à écrire l'état de transition de T1 (voir *Décisions cachées*).

## Règles du projet, « Ne change pas » et leçons

- **Mineur — retrait du test d'AC-10 de proches.** Le retrait est fondé : D18 de proches, et AC-10 est déjà rangé sous `remplaces` dans `docs/specs/2026-10-13-proches/acceptance.json` (l. 409-421). Mais le plan ne nomme pas le test, et ne dit pas quoi faire si le crochet de studio refuse. *Correction* : nommer le test en T3 (`tests/e2e/proches-etats.spec.ts:95`, « AC-10 depuis /?loyer=1200&mer=50, service de trajets en panne… ») et préciser « retrait seul, sans réécrire son given / when / then ; si le crochet refuse, arrêt et question, sans contournement ». Le reste respecte *Ne change pas* : chaque tâche prouve par `npm test` complet, et aucun test d'un AC d'une autre tranche ne lit « Réessayer » ou « indisponible » d'un proche (vérifié par grep dans `tests/`).
- **Mineur — des leçons qui s'appliquent ne sont pas citées dans la section de leur tâche** (le constructeur ne voit que sa tâche) :
  - [file limitée](../../solutions/2026-10-13-file-limitee-minuteries-en-retard.md) : citée seulement dans *Risques* ; la recopier dans T1.
  - [délai long et horloge Playwright](../../solutions/2026-10-13-delai-long-horloge-playwright.md) : en T2 (AC-2 b) et en T5 (15 min). Attention : les délais du faux IGN tournent dans Node, en temps réel, pas sur l'horloge de la page.
  - [libellés lus par les tests protégés](../../solutions/2026-10-14-spec-libelles-lus-par-les-tests-proteges.md) : en T3, avant de retirer « Trajets indisponibles », « Réessayer » et « indisponible ».
  - [recaler une fixture : relire chaque « when »](../../solutions/2026-10-13-recaler-fixture-relire-when.md) : dans la règle de recalage (T3, T4).
  - [suite instable, port 4173](../../solutions/2026-10-15-suite-instable-port-4173-et-machine-saturee.md) : dans toutes les tâches, avant de juger une suite rouge.
  - [feuille mobile et ligne de flottaison](../../solutions/2026-10-12-feuille-mobile-et-ligne-de-flottaison.md) : en T2 et T3, pour les captures à 390 px d'une ligne de proche qui s'allonge.
- **Mineur — données des utilisateurs : une mise en ligne annulée ferait perdre des proches gardés.** Après mise en ligne, si l'on revient en arrière (`git revert` ou onglet Deployments), le code v1 ignore toute entrée dont `v` n'est pas 1 (`memoire.ts:115`). Les ids repartent alors de 1 (`useProches.ts:41`) : le premier proche ajouté écrase `carte-ou-vivre:proche:1`, donc un proche gardé. *Correction* : en T4, soit garder `v: 1` et n'ajouter que des champs, avec `pret`, `temps` et `empreinte` tenus comme en v1, pour qu'un retour en arrière relise partiel et km comme « indisponible » au lieu de les perdre ; soit écrire cette conséquence dans le rapport de T4 et dans la liste de contrôle de `/ship`.
