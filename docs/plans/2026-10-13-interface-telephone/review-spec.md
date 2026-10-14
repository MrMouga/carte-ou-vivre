# Relecture spec — interface-telephone
Suite de tests : Vitest `Test Files 12 passed (12) · Tests 88 passed (88)` ; Playwright `180 passed (4.4m) · 25 skipped`, sortie 0 (relancée par le relecteur le 2026-10-14, `npm test`) ; `npm run typecheck` sortie 0 ; `npm run check-tokens` « 36 fichier(s), aucune valeur arbitraire » · Périmètre : `0b1e5f4..3835baa` (25 commits)

En bref : la tranche fait ce que la spec décide. Les 11 critères ont chacun un test qui porte leur id, qui passe et qui vérifie les valeurs du `then`. Les critères protégés de loyer-mer et de proches passent aux deux largeurs. Aucun `given / when / then` n'a changé : seuls les drapeaux `passes` ont bougé dans `acceptance.json`, et seules des lignes de navigation ont été ajoutées aux tests existants. Aucune dépendance nouvelle (`package.json` et lockfile inchangés). Aucun Bloquant. Un Majeur : un défaut visible sur le parcours d'ajout d'un proche au téléphone, que la suite ne voit plus.

[Majeur] Après « Ajouter » sur téléphone, le titre « Tes proches » (et « Effacer mes proches ») passe à moitié sous les onglets, et le test de proches qui devait l'attraper reste vert — c'est le premier écran que voit l'utilisateur après avoir ajouté un proche, sur le parcours même de D7 ; le défaut est connu depuis la tâche 2, mais aucun test ne le garde et il n'a pas été corrigé
  Où : `src/ui/Proches.tsx` (effet après l'ajout : `focus({ preventScroll })` puis `section.scrollIntoView({ block: 'start' })` dans l'onglet, alors que la tête et les onglets sont désormais au-dessus) ; `tests/e2e/proches-mobile.spec.ts:78-81`
  Preuve : capture du build lui-même `captures/T4-e2e-4-ajoute-calcul-390x664.png` (390 × 664, 0 proche au départ : « TES PROCHES » et « Effacer mes proches » coupés sous « Critères / Les 10 premières », « + Ajouter un proche » coupé en bas). Le test dit « La feuille montre « Tes proches » » mais vérifie `titre.y >= f.y`, où `f` est le haut de la feuille entière, tête et onglets compris (≈ 100 px au-dessus du haut de l'onglet qui défile) : il ne peut plus échouer pour ce défaut. T2.md (« le titre passe sous les onglets, y = 501, l'onglet commence à 563 ») et T4.md (« à signaler en relecture, pas corrigé ») le reconnaissent.
  Correction : sous 1 024 px, faire défiler l'onglet « Critères » pour que le titre se pose sous la liste d'onglets (marge de défilement égale à la hauteur réelle du haut de l'onglet, ou `scrollTop` calculé par rapport au `tabpanel` et non à la page) ; ajouter un test hors AC dans `telephone-feuille.spec.ts` qui compare le haut du titre au **bas de la `tablist`** après l'ajout, à 390 × 664 et 390 × 844, avec 0 et 1 proche. Ne pas toucher `proches-mobile.spec.ts` (sa règle reste vraie, elle est seulement devenue trop large).
  Réf : details.md, parcours 5 et état **ajout** (« sort vers ouverte · Critères ») ; CLAUDE.md « "Fini" = effet observé sur le vrai flux »

[Mineur] H50 n'est pas suivie pour « Chargement de la carte… » et l'erreur : ces messages restent au centre de la bande, pas « juste au-dessus de la feuille »
  Où : `src/ui/Status.tsx` (seul « Fond de carte indisponible » se pose au bord de la feuille)   Preuve : H50 nomme « Chargement de la carte… » ; décision de T3 dans progress.md (« restent au centre de la bande »), avec sa raison : la feuille ne se replie pas pendant le chargement ni l'erreur
  Correction : rien pour l'utilisateur. Que Vincent valide l'écart (ou corrige H50 à la prochaine révision de la spec), pour que la spec dise ce qui est construit.   Réf : H50

[Mineur] À 390 × 664, AC-1 n'exerce plus les tuiles du zoom 3 : la feuille à 45 % ouvre la carte au zoom 4,04. Seule la fenêtre de 375 × 548 tomberait en rouge si l'on supprimait le zoom 3
  Où : `tests/e2e/telephone-vue.spec.ts`   Preuve : progress.md, décision T2 ; la fixture d'`acceptance.json` annonce « zoom de départ ≈ 3,7 à 390 × 664 », qui n'est plus vrai
  Correction : aucune dans le code. Le noter dans la fixture à la prochaine révision de la spec, pour qu'on ne croie pas la fenêtre de 390 × 664 protégée.   Réf : AC-1, R16

[Mineur] Il manque des preuves sur l'iPhone, et deux dates de progress.md sont inexactes
  Où : `progress.md`, `taches/T4.md`   Preuve : (a) pas de capture de l'iPhone pour la fiche ouverte par le rond « 1 » (étape 3 de la vérification de bout en bout), ni pour « + Ajouter un proche » clavier ouvert ; T4.md le reconnaît (sonde, Chromium et la parole de Vincent à la place). AC-8 reste valide, son `when` dit « ou ». (b) Preuve de T1 datée « 2026-10-14 00:41 » : les fichiers datent du 2026-10-13 à 23:56, sur une construction faite avant le commit (`version.txt = 58414a4`, T1.md le dit). Preuve de T0 datée « 23:35 » : les fichiers datent de 23:40 et 23:42. (c) La ligne « défaut … corrigé en phase de corrections par l'option A » se lit comme si c'était déjà fait. À HEAD, rien n'est corrigé : `Proches.tsx` rend toujours le focus au champ sans monter la feuille.
  Correction : écrire dans progress.md l'heure réelle de chaque preuve et « à corriger » pour le défaut d'« Effacer » ; à /ship, faire la capture de la fiche ouverte par un rond, sur l'iPhone.   Réf : D10 ; details.md « Preuves »

Sur le défaut connu (« Effacer mes proches ») : je ne vois rien de plus que ce que dit T4.md. T4 note déjà le même chemin après « Retirer » du dernier proche. R20 cite trois entrées (toucher, « + Ajouter un proche », choix d'une suggestion) : « Effacer » n'en fait pas partie, donc `passes: true` d'AC-8 reste juste. La correction prévue (option A) relève bien de l'esprit de R20.

## Couverture des critères (mode spec)
| AC | Test | Statut | Note |
|---|---|---|---|
| AC-1 | `telephone-vue.spec.ts` « AC-1 ouverture à 390 × 664 … » et « … 375 × 548 … » (projet mobile) | couvert | Couleur lue au pixel sur une capture d'écran : A palier 4, E palier 3, B palier 2, C, D et les deux coins R1, R2 au fond. L'emprise est vérifiée par le calcul de `fitBounds` et le haut mesuré de la feuille. Les ronds et les boutons de zoom sont masqués pendant la lecture (option A de Vincent, commit 3a23013). Voir le Mineur sur 390 × 664. |
| AC-2 | `telephone-feuille.spec.ts` AC-2 | couvert | Partie visible ≤ 64 px, compte dans la barre, `aria-expanded`, boîte du rond « 1 » identique avant, repliée et après, « Loyer maximum » à l'écran |
| AC-3 | `telephone-feuille.spec.ts` AC-3 | couvert | Glisser au doigt par CDP, 10 pas sur 300 ms, aux distances 30, 200, −200 ; le défilement dans « Taille de ville » est mesuré (> 100 px). Le test amène d'abord « Taille de ville » à l'écran (sous le bas à 390 × 844) : décision de T3, `when` inchangé. |
| AC-4 | `telephone-feuille.spec.ts` AC-4 | couvert | Les 5 adresses et les 5 textes exacts |
| AC-5 | `telephone-feuille.spec.ts` AC-5 | couvert | Lignes exactes (`SANS_PROCHE`), « Loyer maximum » caché, liste gardée après repli et dépli |
| AC-6 | `telephone-feuille.spec.ts` AC-6 | couvert | Fiche « Portmer (17) », 72, « 1re sur 3 », pas d'onglets ; vérifie en plus le cadrage sur la feuille ouverte (R19 du plan) |
| AC-7 | `telephone-feuille.spec.ts` AC-7 | couvert | Le carré est touché sur la carte, « 3e sur 3 », onglet de la liste sélectionné et non « Critères », focus sur la ligne exacte |
| AC-8 | `proches-clavier-iphone.spec.ts` « AC-8 à 390 × 664 … sans proche … » et « … 4 proches prêts … » (les deux projets) + captures `T4-iphone-5-*`, `T4-iphone-6-*` | couvert | Place relevée par `focusin` en capture, avant le code de la page ; y = 342 pour le champ, la suggestion, « Nom » et « Ajouter » ; immobilité ≤ 1 px. T4.md dit le test rouge avant la correction (647,9 > 342). Captures de l'iPhone présentes, datées après le commit 45fd2d3. |
| AC-9 | `telephone-feuille.spec.ts` AC-9 (projet bureau) | couvert | Ni onglets ni boutons ni compte ; positions exactes des panneaux par les jetons |
| AC-10 | `telephone-feuille.spec.ts` AC-10 | couvert | Toucher sur le rail, valeur 1 000, compte en tête de 3 à 2, onglet inchangé |
| AC-11 | `telephone-feuille.spec.ts` AC-11 | couvert | Repliée pendant « Calcul des trajets… », la barre passe à « 1 commune passe tes critères » sans dépli |

Tranches précédentes (« Ne change pas ») : loyer-mer AC-1 à AC-15 (`carte`, `liste`, `fiche`, `adresse`, `etats`, plus les tests unitaires `score`, `format`, `url`) et proches AC-1 à AC-11, AC-14, AC-16 (`proches`, `proches-carte`, `proches-etats`) passent **dans les deux projets** (bureau et mobile) de ce lancement. Les deux tests ignorés hors de cette tranche l'étaient déjà avant (`aucune.spec.ts` en bureau, le parcours de `fiche.spec.ts` en mobile).
Tests existants (`git diff 0b1e5f4..HEAD -- tests/`) : seulement des ajouts `voirListe` / `voirCriteres` (adresse, fiche, liste, proches, proches-etats, proches-carte), et dans `proches-clavier-iphone.spec.ts` la cible du défilement de deux tests « iPhone » hors AC (feuille → onglet, puis l'aide `amenerEnBas`). Aucun nom, aucune valeur attendue ni aucune assertion n'a été retiré. `acceptance.json` : seuls les `passes` ont changé (de `false` à `true`).

## Règles, décisions, états
- R16 : faite. Zoom 3 dans les tuiles et dans `minzoom` ; seules les tuiles `public/tuiles/3/*` ont été ajoutées. Captures du build et de l'iPhone : la côte est verte.
- R17 : faite. Bouton avec `aria-expanded`, toucher et glisser (10 px pour un toucher, 80 px pour changer de position), compte suivi feuille repliée, « Aucun plafond fixé ».
- R18 : faite. `tablist`, flèches gauche et droite, panneaux gardés montés, défilement gardé par onglet, mentions au bas des deux.
- R19 : faite.
- R20 : faite pour les trois entrées qu'elle cite (voir le défaut connu plus haut).
- D1 à D10 : respectées. D8 : le test d'AC-2 vérifie que la carte n'a pas bougé, et la capture de l'iPhone `T4-iphone-2` garde le même cadrage. D9 : 45 % au moins 272 px, par les jetons.
- H42 à H49 : suivies. H50 : écart pour « Chargement » (Mineur).
- États : chargement et erreur (tête inactive, testé), ajout (ni onglets ni repli, testé), fiche (poignée seule, testé).

En trop : rien hors du plan. `useBureau` (choix entre bureau et feuille par `matchMedia`), `overflow-clip` sur `main`, le toucher repris dans `Proches.tsx` et `view.test.ts` sont tous justifiés dans les rapports T2 et T4. Fichiers hors des listes des tâches : tous déclarés dans les rapports (`Proches.tsx` en T2, `index.css` en T3, `proches-clavier-iphone.spec.ts` en T2).
Historique git : un commit de code par tâche, chacun suivi de ses commits de rapport et de vérification. Une seule retouche après validation : le test d'AC-1 (3a23013), sur l'option A choisie par Vincent. La simplification (27c76a8, 3ffef2f) ne change pas le comportement : je l'ai relue ligne à ligne (deux rappels identiques fusionnés, une référence passée telle quelle).

Standards (survol) : aucune valeur en dur (`check-tokens` propre ; `geste`, `taille-feuille-min` et `taille-barre-feuille` sont ajoutés au contrat). Pas de code mort trouvé dans `src`. Une seule petite trace : `POIGNEE = 12` dans `proches-clavier-iphone.spec.ts` décrit encore l'ancienne poignée (la nouvelle fait 20 px). Le seuil devient plus large qu'il ne faudrait, mais ce n'est pas faux.

## Ce qui est bien fait
- Les preuves sur l'iPhone sont mesurées et pas seulement affirmées : une sonde relève l'instant du focus, 0 px de défilement 4 fois sur 4, et Chromium trouve les mêmes coordonnées (87,2 → 131,2). Le test d'AC-8 relève la place **avant** le code de la page, à l'instant où Safari la note, et T4 l'a vu rouge sans la correction.
- Le respect des tests protégés : une seule zone `role=status`, des aides de navigation qui ne font rien en bureau, aucun `then` touché.
- Les rapports déclarent eux-mêmes leurs limites et leurs écarts, y compris le défaut que ce rapport classe Majeur.

## Non jugé
- Le comportement réel sur l'iPhone depuis la simplification. Elle ne change pas le comportement à la lecture, mais personne ne l'a rejouée sur l'appareil.
- La barre repliée sous la barre d'outils flottante de Safari 26 (T4, capture 2) : sur la capture, le compte reste lisible et les touchers ont marché. C'est au qa-tester d'en juger.
- Le léger glissement de 4 px du champ pendant la saisie quand un proche précédent finit son calcul (T4, remarque) : ce cas n'est pas dans AC-8.
- L'accessibilité au lecteur d'écran au-delà du balisage (pas d'essai avec VoiceOver).
