# Mesure de la tâche 0 — pourquoi le champ « Adresse ou ville » disparaît sous le clavier de l'iPhone
2026-10-13, 23:32–23:39 (≈ 7 min sur l'iPhone) · `main` @ 0b1e5f4, serveur de dev · iPhone de Vincent, Safari

## La cause, en une phrase
Au moment où le champ prend le focus, Safari note sa place. C'est la place d'**avant** la montée de la feuille par notre code. À l'ouverture du clavier, Safari fait défiler toute la page pour **centrer** le champ à cette ancienne place dans la partie visible. Mais le champ a été remonté en haut entre-temps : ce défilement l'emmène au-dessus de l'écran.

**La mesure qui le prouve** (cas 1, 23:35) :
1. Au toucher, avant notre code, le champ est à **y 323,8 → 367,8**, donc centré à 345,8.
2. Notre code le remonte à **y 79 → 123**, dans le même événement.
3. Environ 290 ms plus tard, le clavier s'ouvre. La partie visible passe à **361 px**, et Safari fait défiler la page de **165 px**.
4. Le calcul pour centrer l'**ancienne** place : 345,8 − 361/2 = **165,3**. C'est le défilement mesuré, à 0,3 px près.
5. Le champ se retrouve à **y −86 → −42**, au-dessus de la partie visible.

Pour centrer la nouvelle place (79 → 123), il n'aurait fallu aucun défilement. La capture de Vincent montre ce qu'on voit alors : sous la barre d'adresse, les 10 derniers pixels du bouton « Ajouter », puis la liste « Les 10 premières ».

Le même calcul tombe juste deux autres fois :
- **Cas 1, second essai (23:38).**
  - Ancienne place : y 461,8 → 505,8. Le centrage demanderait 303,3 px de défilement.
  - Safari ne peut défiler que de 645 − 361 = **284 px** au plus.
  - Mesuré : **284**. Le champ finit à **y −205 → −161**.
- **Choix d'une suggestion, focus sur « Nom » (23:38).**
  - « Nom » apparaît déjà à sa place, à **y 83 → 127** (centre 105), et il est visible.
  - Safari le recentre quand même : défilement 284 − (180,5 − 105) = 208,5, **mesuré 208,7**.
  - « Nom » reste visible (y 158 → 202). C'est ce qu'a vu Vincent : rien d'anormal à ce moment-là.

Ce que ça corrige dans la leçon du 2026-10-13 (`docs/solutions/2026-10-13-ios-clavier-champ-deplace-apres-focus.md`) :
- elle disait que Safari lit la place du champ « à la fin de l'événement `focus` ». **C'est faux** : Safari lit une place prise avant que notre code ne réagisse au focus. Le correctif du 2026-10-13 (`useLayoutEffect`) arrivait donc encore trop tard ;
- de plus, Safari ne se contente pas de rendre le champ visible : il le **centre** dans la partie visible, même quand il est déjà visible.

## Mesures brutes
Fichier complet et lisible : `captures/T0-iphone-mesures.txt`, 118 lignes. Il est tiré de `probe/clavier/mesures.jsonl`, 170 lignes, non versionné.

Lecture des positions : sur l'iPhone, clavier ouvert, `getBoundingClientRect` se lit dans la partie visible. Le champ est visible s'il est entre 0 et la hauteur de cette partie. C'est recoupé avec la capture, où l'on voit bien le bas du bouton « Ajouter » en haut de l'écran.

| Instant | Fenêtre visible (`visualViewport`, décalage + hauteur) | `scrollY` | Champ (y) | Feuille (haut → bas, défilement) |
|---|---|---|---|---|
| **Cas 1, 1ᵉʳ essai (session 7arigq)** — toucher à y 343, 0 proche | | | | |
| focus, avant notre code | 0 + 645 | 0 | 323,8 → 367,8 | 283,8 → 645, 615 |
| focus, après notre code (fin de l'événement) | 0 + 645 | 0 | 79 → 123 visible | 40 → 645, 616 |
| +50, +100, +200 ms | 0 + 645 | 0 | 79 → 123 visible | 40 → 645, 616 |
| ≈ +290 ms : le clavier s'ouvre (`resize` et `scroll` de la partie visible, `scroll` du document) | 165 + 361 | 165 | **−86 → −42 caché** | −125 → 480, 616 |
| +300 ms à +3 s | 165 + 361 | 165 | −86 → −42 caché | −125 → 480, 616 |
| **Cas 1, 2ᵉ essai (session 83kbaj)** — toucher à y 486, 0 proche | | | | |
| focus, avant notre code | 0 + 645 | 0 | 461,8 → 505,8 | 283,8 → 645, 477 |
| focus, après notre code | 0 + 645 | 0 | 79 → 123 visible | 40 → 645, 616 |
| ≈ +140 ms : le clavier s'ouvre | 284 + 361 | 284 | **−205 → −161 caché** | −244 → 361, 616 |
| +200 ms à +3 s | 284 + 361 | 284 | −205 → −161 caché | −244 → 361, 616 |
| **Choix d'une suggestion → focus sur « Nom »** (même session, clavier déjà ouvert) | | | | |
| focus, avant et après notre code | 284 + 361 | 284 | 83 → 127 visible | −244 → 361, 403 |
| ≈ +100 ms : Safari recentre | 208,7 + 361 | 209 | 158 → 202 visible | −169 → 436, 403 |
| +200 ms à +3 s | 208,7 + 361 | 209 | 158 → 202 visible | −169 → 436, 403 |

Autres relevés utiles :
- **Clic fantôme, écarté comme cause.**
  - Au cas 1, la feuille monte entre l'appui et le relâchement du doigt. Le relâchement (`mouseup`) tombe donc sur une ligne de la liste (« 2 · Isigny-le-Buat (50) » au 1ᵉʳ essai).
  - Mais le `click` part sur la feuille, l'ancêtre commun aux deux éléments touchés, comme dans Chromium.
  - Aucune fiche ne s'ouvre et le focus ne bouge pas : ce n'est pas la cause. La correction ci-dessous le supprime quand même.
- **Rien ne bouge dans les 200 ms qui suivent le focus**, ni la feuille ni le champ. Seul le glissement de Safari, à l'ouverture du clavier, déplace tout.
  - Notre code ne déplace donc plus rien après le focus : le correctif du 2026-10-13 a bien fait cette partie.
  - Mais le défaut vient d'avant le focus.
- **« + Ajouter un proche » (cas 2) n'a pas été joué.** Après « Ajouter », le focus passe bien sur ce lien et le clavier se ferme (« le clavier disparaît bien », Vincent), mais le lien n'a pas été touché ensuite.
  - Prédiction avec la même cause : dans ce cas, la feuille monte et se place avant le focus (code actuel). Safari note donc la bonne place : centre ≈ 101, sous la moitié de 361. Il ne défile pas, et le champ reste visible.
  - À vérifier sur l'iPhone en tâche 4.
- **La fenêtre de Safari fait 645 px de haut ce soir**, contre 664 le 2026-10-13 : les barres de Safari varient. Clavier ouvert, la partie visible fait 361 px, donc le clavier commence à y ≈ 361, contre 342 relevé sur la capture du 2026-10-13. Les tests gardent 664 et 342, des valeurs plus strictes.

## Correction envisagée (tâche 4)
Le champ doit être **déjà à sa place finale au moment où il reçoit le focus** : c'est sa place d'avant toute réaction de notre code qui compte. Il suffit de faire au toucher du champ ce que fait déjà « + Ajouter un proche » : monter et placer d'abord, donner le focus ensuite.
- À 390 px, quand la feuille n'est pas montée, on intercepte le relâchement du doigt sur le champ (`touchend`), seulement si c'est un toucher et pas un défilement.
- On annule l'action normale du navigateur (`preventDefault`) : pas de focus automatique, pas de clic qui suit, donc plus de clic fantôme.
- On monte et on place la feuille dans le même événement, comme aujourd'hui, de façon synchrone.
- Puis on appelle `champ.focus()`. Dans un `touchend`, qui est un geste de l'utilisateur, iOS ouvre le clavier.
- Au focus, le champ est à y ≈ 79 → 123 (centre ≈ 101). Pour le centrer, Safari devrait défiler de 101 − 180 < 0 px : il ne défile pas.
- Au clavier physique (Tab) et en bureau, rien ne change.
- **Filet, seulement si l'essai de la tâche 4 échoue encore** : pendant l'ajout, écouter `visualViewport` et ramener la page en haut (`scrollTo(0, 0)`) quand Safari l'a fait défiler. Cette solution n'est pas retenue d'emblée parce qu'elle montre un saut.
- Autre piste, écartée : laisser le champ au milieu de la partie visible plutôt qu'en haut. Elle dépend de la hauteur du clavier et laisse peu de place aux suggestions sous le champ.

## Le test Chromium qui aurait échoué
Il existe : il suffit de relever la place du champ **avant** notre code, et non à la fin de l'événement `focus`.
- Le test `tests/e2e/proches-clavier-iphone.spec.ts` relève aujourd'hui la place par un écouteur `focusin` en remontée sur `window`. Celui-ci passe **après** notre code : c'est le mauvais instant, et le test passait donc.
- Il faut le même écouteur en **capture** sur `window` (`addEventListener('focusin', …, true)`), qui passe avant notre code.
- On exige ensuite que le champ y soit déjà sous la poignée, et que son centre soit au-dessus de la moitié de la partie visible clavier ouvert. Une variante plus simple : il est déjà là où il sera 200 ms plus tard, à 1 px près.
- La preuve que ce test aurait été rouge sur le code actuel : dans Chromium, cet écouteur relève le champ à **y 604,3 → 648,3** au cas 1 (`captures/T0-sonde-chromium.txt`, ligne « focus-avant-react #1 »), alors qu'il finit à 79,2 → 123,2.
- Le même relevé passe pour « + Ajouter un proche » (79,6 → 123,6 avant et après), ce qui va dans le sens de la prédiction ci-dessus.
- Ce que Chromium ne peut pas montrer : le clavier et le centrage par Safari. Le test vérifie la condition qui l'évite, et l'essai sur l'iPhone reste nécessaire en tâche 4.

## iPhone et iOS
- **Modèle** : non donné par Vincent. Mesuré : écran de 390 × 844 points, à 3 pixels par point. C'est un iPhone de 6,1 pouces, de la famille 12, 13 ou 14 ; le modèle exact reste inconnu.
- **iOS** : non donné par Vincent. L'agent utilisateur de Safari indique `iPhone OS 18_7` et `Version/26.4`.
  - Depuis iOS 26, Safari fige le numéro d'iOS dans l'agent utilisateur, et sa propre version suit celle d'iOS.
  - C'est donc **probablement iOS 26.4**, ce qui reste à confirmer.
  - Le « iOS 18.7 » noté le 2026-10-13 venait sans doute de la même lecture.
- **Safari** : 26.4. La barre d'adresse est en haut, la fenêtre fait 645 px de haut clavier fermé, et la partie visible 361 px clavier ouvert.

## Captures
- `captures/T0-iphone-cas1-champ-cache.png` — l'iPhone de Vincent à 23:35:42, environ 4 s après le toucher du cas 1, 1ᵉʳ essai. Le clavier est ouvert, on voit le bas du bouton « Ajouter » puis « Les 10 premières » ; le champ est hors de l'écran, au-dessus.
- `captures/T0-iphone-mesures.txt` — les mesures de l'iPhone, en clair.
- `captures/T0-sonde-chromium.txt` — la même sonde dans Chromium (390 × 664, toucher) : la référence sans clavier, et la ligne qui fait échouer le test proposé.
