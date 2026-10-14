# Démo — interface téléphone
2026-10-14 · Plan : [plan.md](plan.md) · Progression : [progress.md](progress.md)

> AC = critère d'acceptation de la spec ; Bloquant / Majeur / Mineur = gravité donnée par un relecteur neuf ; une preuve = capture ou sortie de commande, datée.

## Ce qui est construit
Sous 1 024 px de large (téléphone, tablette) ; le bureau ne change pas.
- **Tâche 0 — cause du clavier iPhone mesurée** : Safari note la place du champ au moment du toucher, avant que la feuille monte, puis la centre à l'ouverture du clavier (165 px mesurés, 165,3 calculés) : le champ sortait par le haut. [mesure-tache-0.md](mesure-tache-0.md)
- **Tâche 1 — le vert dès l'ouverture** : les communes sont dessinées sur la France entière, sans zoomer, de 375 × 548 à 1 023 × 1 366 (tuiles du zoom 3, ≈ 328 Ko compressées). Avant : aucune commune à 390 × 664.
- **Tâche 2 — la feuille à deux onglets** : compte en tête (« 8 046 communes passent tes critères »), onglets « Critères » / « Les 10 premières » en pilule, défilement gardé par onglet, mentions au bas des deux, feuille ouverte à 45 % (au moins 272 px).
- **Tâche 3 — plier, déplier, la fiche** : la tête est le bouton ; toucher, glisser ou clavier ; la barre repliée (51 px) garde le compte et suit un proche qui finit son calcul ; la carte ne bouge pas ; une commune touchée feuille repliée ouvre la fiche à la place des onglets.
- **Tâche 4 — le clavier iPhone** : toucher « Adresse ou ville » monte et place la feuille **avant** de donner le focus : Safari ne fait plus défiler la page (0 px, 4 fois sur 4 sur ton iPhone 13 Pro).
- **Corrections** : titre « Tes proches » entier sous les onglets après un ajout ; même correction du clavier après « Effacer mes proches » et après « Retirer » du dernier proche ; onglets touchables sur 44 px.

Essayer : version construite servie sur le Wi-Fi (`npm run build` puis `npx vite preview --host --port 5182`), ouvrir http://192.168.1.26:5182/ sur le téléphone ; ou `npm run dev` et une fenêtre étroite sur le Mac.

## Preuves
- **Tests** (relancés par l'orchestrateur après les corrections, 2026-10-14 10:40) : Vitest 88 passés ; Playwright 189 passés, 30 ignorés (tests propres à une seule largeur, et 2 d'avant la tranche) ; types, jetons et construction verts.
- **Critères** : 11 sur 11 passent.

| AC | Ce qu'il vérifie | Passe |
|---|---|---|
| AC-1 | communes colorées à l'ouverture à 390 × 664 et 375 × 548 | oui |
| AC-2 | replier / déplier au bouton, barre ≤ 64 px, carte immobile | oui |
| AC-3 | glisser au doigt (30 px, 200 px), glisser dans les réglages = défilement | oui |
| AC-4 | texte de la barre selon l'état (3 / 2 / 1 / aucune / sans plafond) | oui |
| AC-5 | onglet « Les 10 premières » gardé au repli et au dépli | oui |
| AC-6 | rond touché feuille repliée → fiche, gardée au repli | oui |
| AC-7 | fiche à la place des onglets ; retour → onglet de la liste, ligne focalisée | oui |
| AC-8 | clavier : champ, suggestion, « Nom », « Ajouter » au-dessus du clavier (Chromium + captures de l'iPhone) | oui |
| AC-9 | bureau inchangé | oui |
| AC-10 | le compte en tête suit un réglage | oui |
| AC-11 | la barre repliée suit un proche qui finit son calcul | oui |

- **Ne change pas** : loyer-mer AC-1 à AC-15, proches AC-1 à AC-11, AC-14, AC-16 passent (vérifié par le relecteur et par chaque suite).
- **Captures** (dossier [captures/](captures/)) : iPhone `T4-iphone-1…7` ; ouverture `T1-ouverture-390x664.png`, `T1-ouverture-375x548.png` ; feuille `T2-criteres-390x664.png`, `T2-liste-390x664.png` ; repli et fiche `T3-repliee-390x664.png`, `T3-fiche-depuis-repliee-390x664.png` ; bureau avant/après `T2-bureau-avant.png` / `T2-bureau-apres.png` (0 pixel d'écart) ; corrections `C1-*`.

## Décisions prises à ta place (détail et coût dans progress.md)
- **Annonce aux lecteurs d'écran** : une seule, celle d'avant (compte caché à l'écran) ; la ligne visible en tête n'annonce rien — deux tests protégés en dépendent. Coût si faux : aucun visible.
- **Le défaut « Effacer mes proches »** (trouvé sur ton iPhone) corrigé comme « + Ajouter un proche » (option A, conforme à R20). Le clavier s'ouvre toujours seul après « Effacer » ou « Retirer » le dernier proche, comme avant ; si ça te gêne, l'autre option est de mettre le focus sur le titre « Tes proches ».
- **Après l'ajout du 2e proche à 390 × 664** : le titre reste en haut, la ligne du nouveau proche tombe 14 px sous le bas de l'écran (on la voit par son repère sur la carte). Dès le 3e, la ligne passe avant le titre.
- **« Chargement… » et l'erreur** restent au centre de la carte (la feuille ne se replie pas dans ces états).
- **Repli par glissement vers le bas** plutôt que par changement de hauteur (la fiche courte s'anime aussi).
- **Tests** : AC-1 lit ses couleurs boutons de zoom masqués (ton choix) ; le test d'AC-1 sert un jeu de communes aux latitudes de la France ; la navigation de 6 tests existants ouvre l'onglet « Les 10 premières » (ton accord).
- **Mesure de la tâche 0** par une page relais sur le Wi-Fi au lieu du câble.

## Relectures
- **Code (spec)** : 0 Bloquant, 1 Majeur (titre sous les onglets — corrigé), 4 Mineurs : chargement/erreur au centre (décision ci-dessus) ; à 390 × 664 AC-1 n'exerce plus le zoom 3 (seule 375 × 548 le garde) ; preuves de l'iPhone incomplètes (pas de capture de la fiche ni de « + Ajouter un proche » clavier ouvert) et heures de T0/T1 inexactes dans progress.md ; constante de test périmée (corrigée).
- **Navigateur (QA)** : 0 Bloquant, 0 Majeur, 4 Mineurs : onglets à 36 px (corrigé : 44 px) ; compte dit deux fois sur l'onglet de la liste (en tête et en tête de liste) ; ronds regroupés de 22 px de haut, sous 24 px (hérité de loyer-mer) ; erreurs de console venant de l'IGN (404 d'estompage, un 401, sprite) — pas du code du site.
- **Laissés** : le compte en double sur l'onglet de la liste, les ronds de 22 px, les erreurs IGN — à toi de dire s'ils méritent une passe.

## Non vérifié
- Sur l'iPhone, après les corrections : « Effacer » / « Retirer » le dernier proche puis le clavier ; le titre après un ajout ; un toucher au bord d'un onglet (≈ 5 min si tu veux le faire maintenant).
- Pas de capture de l'iPhone du passage par « + Ajouter un proche » clavier ouvert (mesuré par la sonde : 0 px de défilement, 2 fois) ni de la fiche ouverte par un rond.
- Fond IGN indisponible et état chargement dans le vrai navigateur (couverts par les tests seulement).
- Deux fois pendant le build, un proche est tombé en « Trajets indisponibles » sur le vrai service IGN, puis a marché au second essai : comportement de la tranche proches, cause non relevée.
- Le téléphone tenu à l'horizontale (hors tranche).
- La version en ligne : elle viendra avec /ship.

## Coût
Du 2026-10-13 23:20 au 2026-10-14 10:45, avec une pause de nuit. 5 tâches, 1 simplification, 2 relectures, 1 passe de corrections ; aucune tâche refaite.
Agents (jetons) : T0 237 k · T1 149 k · T2 318 k · T3 214 k · T4 276 k · simplification 127 k · relecture code 186 k · QA 62 k · corrections 197 k — ≈ 1,77 M au total. Ton temps : ≈ 15 min avec l'iPhone (deux essais) et 3 questions.
Détours : le test d'AC-1 sous le bouton de zoom (une question) ; le titre sous les onglets, vu en tâche 2, corrigé seulement après la relecture.
