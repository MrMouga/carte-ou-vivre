# Corrections 1 — relectures spec et navigateur
Statut : faite · Début 09:44 · Fin 10:37 · Commits : c95568f..580ed45

## Ce que l'utilisateur peut faire maintenant
- Sur téléphone, après « Ajouter » un proche, il voit le titre « Tes proches » et « Effacer mes proches » en entier, juste sous les onglets. Ensuite viennent la ligne du proche et « + Ajouter un proche ».
- Après « Effacer mes proches », ou après « Retirer » sur le dernier proche, la feuille monte et le champ « Adresse ou ville » se place en haut **avant** de recevoir le focus. C'est la condition pour que le clavier de l'iPhone ne le cache plus.
- Les onglets « Critères » et « Les 10 premières » se touchent sur 44 px de haut. Leur apparence ne change pas : la pilule colorée fait toujours 36 px dans un rail de 44 px.

## Critères
Aucun critère d'acceptation n'est modifié. Les tests ci-dessous sont des tests de non-régression, hors AC.

| Constat | Test (fichier · nom) | Résultat |
|---|---|---|
| 1 (Majeur) | `tests/e2e/telephone-feuille.spec.ts` · « après « Ajouter » à 390 × {664, 844}, {0, 1} proche déjà là : « Tes proches » et « Effacer mes proches » entiers sous les onglets » (4 cas, projet mobile) | rouge avant : 3 cas sur 4 (titre à y 446,1, 321,1 et 501,1, bas des onglets à 455,7 et 554,7). Après la suite du correctif (1er proche prêt) : rouge à 296,1 à 664 × 1. Vert après les deux commits. |
| 2 (iPhone T4) | `tests/e2e/proches-clavier-iphone.spec.ts` · « iPhone : « Effacer mes proches » (dernier proche) rend le focus au champ — … » et « iPhone : « Retirer Nantesville (44) » (dernier proche) … » (390 × 664, au toucher, les deux projets) | rouge avant : champ à 622,9 au début du focus pour une limite de 342 (même valeur que sur l'iPhone en T4 : 578,8 → 622,8). Vert après : sous la poignée, au-dessus de 342, puis immobile. |
| 3 (Mineur qa) | `tests/e2e/telephone-feuille.spec.ts` · « onglets : 44 px de haut au toucher, pilule de l'onglet choisi à `space-1` du bord du rail » | rouge avant (36 au lieu de 44), vert après. « 375 × 548 : feuille de 272 px, curseur « Loyer maximum » entièrement visible » reste vert : la mise en page est identique. |
| 4 (Mineur spec) | `tests/e2e/proches-clavier-iphone.spec.ts` · constante `POIGNEE` | 12 → 20. La valeur est calculée par les jetons (`space-2` + `taille-rail` + `space-2`) et je l'ai mesurée dans le navigateur : la tête va de y = 40 à 60. AC-8 et les tests « iPhone » restent verts ; aucun nom de test ni aucune valeur attendue n'a changé. |

### Constat 1 — titre sous les onglets après « Ajouter » (c95568f, 7698667)
Correction (`src/ui/Proches.tsx`) : sous 1 024 px, après l'ajout, l'onglet « Critères » défile pour poser la section en haut, juste sous les onglets. J'ai retiré la marge `scroll-mt-6` de la section : elle venait de l'ancienne poignée collée de la tranche proches et ne sert plus. Avant, deux défilements suivaient : vers la ligne du nouveau proche, puis vers « + Ajouter un proche ». C'est le dernier qui l'emportait, et il faisait passer le titre sous les onglets.

Règle retenue :
- Pour le 1er et le 2e proche, le titre reste en haut.
- À partir du 3e, si la ligne du nouveau proche tombe entièrement sous le bas de l'onglet, elle passe avant le titre, comme avant. `proches-mobile.spec.ts` avec 4 proches l'exige, et je ne l'ai pas modifié.

Il a fallu un second commit. Sur la version construite, avec de vraies données (Nantes **prête**, puis Toulouse), le titre repartait à y = 296. La ligne d'un proche prêt fait 138 à 150 px ; celle d'un proche en calcul, que la fixture du test montrait, en fait 114. Le test attend maintenant que le 1er proche soit prêt.

Preuve sur la version construite (7698667, 390 × 664, vrai service IGN) :
- 0 proche au départ : bas des onglets 455,7, titre 463,6 → 507,6, « Effacer mes proches » 463,6 → 507,6, onglet de 463,7 à 664.
- 1 proche prêt au départ : mêmes valeurs ; la ligne de Nantes commence à 516 et celle de Toulouse à 666.

### Constat 2 — focus rendu au champ sans monter la feuille (901f0c6)
Correction (`src/ui/Proches.tsx`) : sous 1 024 px, « Effacer mes proches », ou « Retirer » quand il ne reste qu'un proche ou que l'ajout est ouvert, passe par le chemin de « + Ajouter un proche ». L'ajout s'ouvre avec le focus demandé, la feuille monte et se place, puis le champ prend le focus dans le `useLayoutEffect` de l'ajout. Si l'ajout était déjà affiché, il ne se remonte pas : la feuille est montée directement. En bureau, rien ne change.

Il a fallu deux essais. Le premier appelait `onAjout(true)` depuis l'effet du parent. En mode strict (serveur de dev, tests), React rejouait le montage de l'ajout, et son nettoyage remettait `onAjout(false)` : la feuille redescendait et le focus se perdait (leçon ci-dessous).

Preuve sur la version construite (7698667, 390 × 664) : une sonde `focusin` en capture sur `window` a relevé le champ à **87,7 → 131,7** au début du focus. La feuille était déjà à 40 et la page n'avait pas défilé (0). Ce sont les valeurs de « + Ajouter un proche » mesurées sur l'iPhone en T4 (87 → 131).

### Constat 3 — onglets de 36 px (d2788a9)
Correction (`src/ui/FeuilleMobile.tsx`) : le rail garde `h-toucher` (44 px) ; son rembourrage `p-1` devient `px-1`. Chaque onglet prend toute la hauteur du rail (44 px), avec `py-1`. La pilule colorée est maintenant un `span` intérieur de 36 px, à `space-1` du bord. Seuls des jetons sont utilisés (`check-tokens` est propre).

Mesure sur la version construite : onglets de 44 px, pilules de 36 px, rail de 44 px, bas du curseur du loyer à 627 à 390 × 664. À 375 × 548, le test du curseur reste vert : la hauteur des onglets et du rail n'a pas bougé.

### Constat 4 — `POIGNEE` périmée (2b337c3)
La constante vaut maintenant 20 px : la tête de la feuille montée, poignée seule (`space-2` + rail de 4 + `space-2`). Je l'ai mesurée à 390 × 664 : de y = 40 à 60.

## Preuves
Toutes les captures viennent de la version construite (`npm run build`, `npx vite preview --port 5191`, `version.txt` lu au moment de la preuve), à 390 × 664, avec de vraies données et le vrai service IGN, sur des adresses publiques :
- `captures/C1-390x664-onglets.png` — feuille ouverte sur « Critères » ; onglets de 44 px, même apparence qu'avant. Prise à 10:20 sur la version 2b337c3 ; le code des onglets n'a pas changé depuis, et les mesures ont été refaites à 10:23 sur 7698667 (44 / 36).
- `captures/C1-390x664-apres-effacer.png` — après « Effacer mes proches » : feuille montée, champ « Adresse ou ville » en haut, sous la poignée, avec le focus (10:23, version 7698667).
- `captures/C1-390x664-ajoute-0-proche.png` — juste après l'ajout de « 12 rue de la Paix, Nantes » sans proche avant : « TES PROCHES » et « Effacer mes proches » entiers sous les onglets, la ligne de Nantes en calcul, « + Ajouter un proche » coupé en bas (10:23, 7698667).
- `captures/C1-390x664-ajoute-1-proche.png` — juste après l'ajout de « place du Capitole, Toulouse », Nantes prête : titre entier sous les onglets, Nantes (2 h) visible ; la ligne de Toulouse est sous le bas de l'onglet et n'apparaît que par son repère sur la carte (10:23, 7698667).
- `captures/C1-390x664-onglet-liste.png` — onglet « Les 10 premières » choisi (pilule à droite) ; avec ces deux proches, aucune commune ne passe (10:23, 7698667).

Ce que ces preuves ne couvrent pas : le vrai clavier de l'iPhone. Les clics viennent de la souris de Chromium (studio-browse n'envoie pas de toucher) ; le toucher est couvert par les tests Playwright (`hasTouch`).

## Suite de tests
Relancée à la fin, sur 7698667 :
- Vitest : `Test Files  12 passed (12)` · `Tests  88 passed (88)`
- Playwright : `189 passed (4.7m)` · `30 skipped`, sortie 0 (avant les corrections : 180 passed, 25 skipped ; + 9 tests qui passent, + 5 ignorés en bureau parce qu'ils ne valent que sous 1 024 px). Le lancement précédent, sur le même code, avait un échec : `[bureau] proches-carte.spec.ts` AC-3 (suggestion de la fixture jamais apparue, temps dépassé, test n° 31). Relancé seul 3 fois dans chaque projet : `66 passed`. J'en conclus un échec passager sous charge, sur un chemin de bureau que ces corrections ne touchent pas.
- Types : `npm run typecheck`, sortie 0
- Jetons : `check-tokens : 36 fichier(s), aucune valeur arbitraire`
- Construction : `✓ built in 1.70s`, `dist/version.txt` = 76986678a1412f23e3902579f17cb37f4854560b

## Décisions prises à la place de Vincent
- Décision : après l'ajout du **2e** proche à 390 × 664, le titre « Tes proches » reste en haut, même si la ligne du nouveau proche tombe sous le bas de l'onglet (14 px trop bas quand le 1er est prêt) ; elle n'est alors visible que par son repère sur la carte et par le compte. À partir du 3e, la ligne du nouveau proche passe avant le titre si elle est entièrement cachée, comme avant — pourquoi : la correction demandée veut le titre entier avec 0 et 1 proche déjà là, et `proches-mobile.spec.ts` (non modifiable) veut la ligne du 5e visible avec 4 proches. À 664 px de haut, l'onglet (200 px) ne peut pas montrer le titre, une ligne prête (≈ 150 px) et le début de la suivante — coût si c'est faux : un réglage de défilement dans `Proches.tsx` (une condition), sans effet sur les données. L'autre choix serait de poser la ligne du nouveau proche en haut de l'onglet, titre entièrement caché mais jamais coupé.
- Décision : au clavier, après l'ajout, le focus va comme avant sur « + Ajouter un proche », même quand ce lien est sous le bas de l'onglet (cas du 2e proche à 664) — pourquoi : changer la cible du focus toucherait une règle de la tranche proches ; au téléphone, on se sert rarement d'un clavier — coût si c'est faux : un utilisateur au clavier ne voit pas son focus avant d'avoir appuyé sur Tab ou fait défiler.
- Décision : l'anneau de focus entoure désormais l'onglet entier (44 px) au lieu de la pilule (36 px) — pourquoi : c'est le style global (`:focus-visible`), sans code en plus — coût si c'est faux : un anneau 8 px plus haut, à reprendre par une classe sur la pilule.
- Décision : « Retirer » passe aussi par la montée de la feuille quand l'ajout est déjà ouvert et qu'il reste d'autres proches (le focus va alors au champ, pas au lien) — pourquoi : c'est le même défaut sur un autre chemin, et la leçon de T4 demande que chaque chemin qui rend le focus au champ monte la feuille d'abord — coût si c'est faux : nul en bureau ; au téléphone, la feuille monte dans un cas rare.

## Fichiers touchés hors de la liste de la tâche
Pas de liste de fichiers pour une passe de corrections. Fichiers touchés : `src/ui/Proches.tsx`, `src/ui/FeuilleMobile.tsx`, `tests/e2e/telephone-feuille.spec.ts`, `tests/e2e/proches-clavier-iphone.spec.ts`, deux notes de `docs/solutions/` et leur index régénéré. Je n'ai touché ni `proches-mobile.spec.ts`, ni `acceptance.json`, ni `progress.md`. `.claude/settings.json`, `docs/journal.md` et les fichiers `qa-*`, `qa.md` et `review-spec.md` sont laissés hors de mes commits.

## Leçons écrites
- `docs/solutions/2026-10-14-feuille-a-onglets-panneau-court-et-page-qui-glisse.md` — ligne « Revu le 2026-10-14 » : un test de mise en page doit attendre l'état le plus haut d'une ligne (proche prêt) et comparer au bord de ce qui couvre (les onglets), pas au conteneur.
- `docs/solutions/2026-10-13-ios-clavier-champ-deplace-apres-focus.md` — ligne « Revu le 2026-10-14 » : « Effacer » et « Retirer » passent par la montée de la feuille avant le focus. Piège du mode strict : ne pas demander la montée depuis l'effet d'un parent qui suit le montage d'un enfant capable de se démonter.
- Index `docs/solutions/README.md` régénéré.

## À vérifier sur l'iPhone (à la démo, version construite)
1. Avec 1 ou 2 proches, toucher « Effacer mes proches » : le clavier s'ouvre, le champ « Adresse ou ville » reste visible juste sous la poignée et la page ne défile pas. Sonde de T4 : défilement 0 px, champ autour de 87 → 131.
2. Même essai avec « Retirer » sur le dernier proche.
3. Ces deux gestes ouvrent un clavier que l'utilisateur n'a pas demandé, ce qui était déjà le cas avant. Si Vincent trouve que c'est de trop, il reste l'option B de T4 : le focus va au titre « Tes proches ».
4. Après « Ajouter » (1er puis 2e proche) : le titre « Tes proches » est entier sous les onglets, et la place de la ligne du 2e proche est jugée acceptable (décision ci-dessus).
5. Toucher les onglets « Critères » / « Les 10 premières » près de leur bord haut et bas : chaque toucher sur la hauteur du rail change d'onglet.
