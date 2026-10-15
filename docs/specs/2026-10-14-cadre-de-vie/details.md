# Détails — cadre de vie
Lire d'abord [spec.md](spec.md) (décisions D-n). Les états, règles et textes des tranches précédentes valent sauf ce qui suit ; le [tableau d'impact](#impact-sur-les-tranches-existantes) fait foi pour leurs révisions, et [recalage.md](recalage.md) pour leurs critères.

## Parcours
1. L'utilisateur ouvre la page : réglage du prix comme avant ; rien de coché dans le cadre de vie (D7, D12). Seul le prix classe.
2. Dans « Cadre de vie », il coche des tailles et des types d'environnement, choisit une distance à la mer et à la montagne : carte, liste, fiche et adresse se mettent à jour.
3. Il choisit une commune : la fiche dit son type d'environnement, sa population, la mer et la montagne, et la raison de chaque critère non tenu.
4. Il copie l'adresse : la même carte s'ouvre ailleurs. Un lien d'avant cette tranche s'ouvre avec la mer convertie (R31).

## Écrans et états
### Carte — route `/` · dans l'URL : plafond du prix, `bien`, `unite`, `surface` (immobilier R26), `mer`, `montagne`, `taille`, `env` (R31)

Zones touchées : **réglages** — les catégories « Mer » et « Taille de ville » sont remplacées par une catégorie « Cadre de vie » qui contient, dans cet ordre, les groupes « Taille de la commune », « Type d'environnement » et « Proximité avec la nature » (Mer, Montagne) · **fiche** (R30) · **pied de page** (H80). Liste, légende et carte : inchangées. Disposition et résumé replié : /ui, avec les contraintes de la tranche interface-telephone (H48 : à 375 × 548, le curseur du prix reste entièrement visible à l'ouverture).

États de la catégorie « Cadre de vie » (initiale : **ouverte**, comme les autres catégories) :
- **ouverte** → les quatre groupes, chaque pastille avec son état coché ou non ; sort vers **repliée**.
- **repliée** → le titre et le résumé (H75) ; sort vers **ouverte**.

États d'un groupe à choix unique (Mer, Montagne ; initial : **aucune cochée**) — *révisé par D12 (2026-10-15)* :
- **aucune cochée** → le critère ne filtre ni ne note (« Peu importe »).
- **distance cochée** (10, 30, 50 ou 100 km) → cette pastille seule cochée ; le critère filtre et note (R28, R29).
Cocher une pastille décoche l'autre ; toucher la pastille cochée la décoche (retour à **aucune cochée**). Il n'y a plus de pastille « Peu importe ».

États d'un groupe à cases cumulables (Taille de la commune, Type d'environnement ; initial : **aucune cochée**) :
- **aucune cochée** → pas de filtre (« Peu importe ») ; **une ou plusieurs cochées** → filtre (R27).

États de la page : ceux de loyer-mer, proches et immobilier, avec deux extensions :
- **sans plafond** : désormais quand aucun critère ne note — prix sur « Sans limite », aucune distance à la mer ni à la montagne cochée, aucun proche prêt. Les filtres (taille, type) laissent non colorées les communes qu'ils écartent ; les autres prennent la couleur neutre. Textes : D8.
- **aucune commune** : peut venir aussi du type, de la mer ou de la montagne. Textes : D8.

États de la fiche : ceux des tranches précédentes ; les lignes de R30 s'ajoutent. Les raisons s'écrivent dans l'ordre de H83. Dans la page **sans plafond**, la fiche d'une commune écartée par un filtre (taille, type) donne la raison de chaque filtre non tenu, comme loyer-mer le faisait pour la taille.

Interactions : cocher une pastille → carte, liste, fiche et adresse à jour en ≤ 100 ms (H9 de loyer-mer).

## Règles
- **R27** — Taille et type filtrent sans noter. Une commune passe le filtre de taille si sa taille est cochée (aucune cochée : toutes), et celui du type si son type est coché (aucun coché : tous). Pastilles de taille, dans l'ordre : « Moins de 10 000 hab. », « 10 000 – 50 000 hab. », « 50 000 – 200 000 hab. », « Plus de 200 000 hab. » (seuils de D11 de loyer-mer). Types (niveaux de D10), dans l'ordre : « Ville dense », « Ville et périphérie », « Bourg et village », « Campagne isolée ». Raisons : « Taille : 260 000 habitants, hors des tailles choisies » ; « Environnement : ville et périphérie, hors des types choisis ». *Pourquoi* : D2, D3, D10.
- **R28** — Mer : choix 10 / 30 / 50 / 100 km, aucun coché = Peu importe (D12). Une distance choisie filtre et note comme le plafond de mer de loyer-mer (R1, R2, D4 de loyer-mer : valeur affichée au km, « moins d'1 km » comparée comme 1 km). Raison inchangée : « Mer 148 km : au-dessus de ton plafond de 50 km ». *Pourquoi* : D4.
- **R29** — Montagne : la distance d'une commune est 0 si elle est classée en zone de montagne, en tout ou partie (ou si sa mairie est dans la zone, H81) ; sinon la distance à vol d'oiseau de sa mairie (D18 de loyer-mer) au point le plus proche de la zone, affichée au km (H3 de loyer-mer), « moins d'1 km » comparée comme 1 km ; une commune classée s'écrit « Commune de montagne ». Choix 10 / 30 / 50 / 100 km, aucun coché = Peu importe (D11, D12). Une distance choisie : la commune passe si sa distance affichée est ≤ au plafond, avec la note 100 × (1 − distance / plafond) (une commune de montagne : 100). Raison : « Montagne 140 km : au-dessus de ton plafond de 50 km ». *Pourquoi* : D5, D6, D11.
- **R30** — Fiche, à la place de la ligne de taille de R4 de loyer-mer : « <niveau> · <population> habitants » (« Ville dense · 260 000 habitants », population au format de H3 de loyer-mer). Sans type : « Type d'environnement inconnu · 4 200 habitants » ; sans population : « Ville dense · population inconnue ». Sous la ligne de la mer, la montagne : « Commune de montagne », « 140 km de la montagne à vol d'oiseau », « moins d'1 km de la montagne » ou « Distance à la montagne inconnue ». Le pied de page cite les deux sources (H80) : il contient « grille communale de densité » et « Insee », et « Zone de montagne » avec la source retenue (D9). *Pourquoi* : D2, D5 ; mentions de Licence Ouverte.
- **R31** — Adresse (étend R7 de loyer-mer et R26 d'immobilier). `mer` vaut `10`, `30`, `50` ou `100` ; absente ou `aucun` = Peu importe ; une valeur de l'ancienne plage (multiple de 5 de 5 à 200, H2, H7 et H17 de loyer-mer) prend le choix juste au-dessus (`mer=60` → 100 km, `mer=25` → 30 km, `mer=5` → 10 km), au-delà de 100 Peu importe ; toute autre valeur (`mer=23`, `mer=0`, `mer=abc`) = Peu importe. `montagne` vaut `10`, `30`, `50` ou `100` ; toute autre valeur (dont `0`) = Peu importe. `env` liste les types cochés, séparés par des virgules (noms de H71) ; comme `taille` (H17 de loyer-mer), un nom inconnu est ignoré et la liste est réécrite dans l'ordre de R27, sans doublon. `mer`, `montagne`, `taille` et `env` ne sont écrits que s'ils diffèrent de Peu importe. Ordre : plafond du prix, `mer`, `montagne`, `taille`, `env`, `bien`, `unite`, `surface`. L'adresse est réécrite à l'ouverture avec les réglages effectifs. *Pourquoi* : D4, D7 ; un lien ancien ne cache aucune commune que l'expéditeur voyait.
- **R32** — Départ : `/` s'ouvre sur le prix de départ d'immobilier (D1) et tout le cadre de vie sur Peu importe ; l'adresse devient `/?loyer=1200`. *Pourquoi* : D7.

## Cas limites
- Commune de montagne avec un plafond de 10 km → passe, note 100 (AC-3).
- Distance affichée égale au plafond (49,6 km affiché 50, plafond 50) → passe avec la note 0 (AC-11).
- Mairie à moins d'1 km de la zone, commune non classée → « moins d'1 km de la montagne », comparée comme 1 km (AC-3, AC-7).
- Un type seul actif avec le prix sur « Sans limite » → état **sans plafond** : les communes de ce type en couleur neutre, les autres non colorées (AC-10).
- Ancien lien avec `mer=60`, `mer=25`, `mer=200`, `mer=23` → 100 km, 30 km, Peu importe, Peu importe (AC-9, AC-8).
- Commune sans type (absente de la grille Insee) ou sans distance à la montagne → la fiche dit « Type d'environnement inconnu » ou « Distance à la montagne inconnue » ; si le critère est actif, elle ne passe pas, avec cette raison. Nombre attendu : 0, mesuré en tâche 0.
- Paris, Lyon, Marseille d'un seul tenant (D10 de loyer-mer) → le type et la distance de la commune entière.
- Commune nouvelle née de communes dont une seule était classée → classée en partie, donc « Commune de montagne » (R29).

## Impact sur les tranches existantes
Cette table fait foi pour les révisions D22 de loyer-mer, D17 de proches, D12 d'interface-telephone et D11 d'immobilier, dont le texte est dans [recalage.md](recalage.md#amendements-des-tranches-validées). Les critères touchés sont réécrits selon recalage.md.

| Tranche | Élément | Inchangée / Étendue / Contredite | Action |
|---|---|---|---|
| loyer-mer | H1, mer 60 km au départ ; vérification de bout en bout, étape 1 (`/?loyer=1200&mer=60`) | Contredite | Peu importe au départ (D7, R32) |
| loyer-mer | H2, curseur de mer de 5 à 200 km par 5 km, « Sans limite » | Contredite | choix fixes (D4, R28) ; « Peu importe » remplace « Sans limite » pour la mer |
| loyer-mer | R7, H7, H17 : `mer` toujours écrite, `mer=aucun` | Contredite | R31 : absente si Peu importe, anciennes valeurs converties |
| loyer-mer | D11, pastilles « Petite commune »… « Grande ville » | Contredite | libellés en chiffres (D2, R27) ; noms dans l'adresse inchangés |
| loyer-mer | R4, ligne « Grande ville · 260 000 habitants » ; R1, raison « Taille : grande ville (260 000 habitants) » | Contredite | R30, R27 |
| loyer-mer | R1, R2, D4, D20 : critères qui notent, état **sans plafond** | Étendue | la montagne note (R29) ; taille et type filtrent ; **sans plafond** = aucun critère qui note (États de la page) |
| loyer-mer | États **aucune commune** et **sans plafond**, leurs textes | Inchangée | D8 |
| loyer-mer | R5, ligne de la liste (colonne mer) | Inchangée | H77 |
| loyer-mer | D8, mer à vol d'oiseau ; D18, la mairie comme point | Inchangée | la montagne suit la même règle |
| loyer-mer | Pied de page, mentions | Étendue | R30, H80 |
| loyer-mer | AC-3 : l'égalité au plafond, testée sur la mer à 40 km | Contredite | 40 km n'existe plus : AC-3 teste l'égalité sur le loyer (650 €) ; l'égalité d'une distance arrondie passe à AC-11 de cette tranche (montagne 49,6 → 50) |
| proches | R11, « le loyer, la mer et chaque proche prêt » notent | Étendue | la montagne note aussi |
| proches | H40, résumé « Peu importe » des tailles | Étendue | résumé de « Cadre de vie » (H75) |
| proches | Critères reportés (AC-12, AC-13, AC-15 : mer en minutes, `mer=60`, `mer=45`) | Contredite | à réécrire quand la mer en minutes sera spécifiée ; non recalés ici |
| interface-telephone | R18, contenu de l'onglet « Critères » | Étendue | « Cadre de vie » remplace « Mer » et « Taille de ville » ; disposition : /ui |
| interface-telephone | H48, curseur du prix visible à 375 × 548 | Inchangée | contrainte pour /ui |
| interface-telephone | AC-3, glisser dans le réglage « Taille de ville » | Contredite | « Taille de la commune » (recalage.md) |
| immobilier | D1, réglage du prix au départ | Inchangée | — |
| immobilier | R25, une commune sans prix notée par les autres critères | Étendue | la montagne en est un ; AC-8 est recalé sur la montagne, car `mer=200` devient Peu importe (recalage.md) |
| immobilier | R26, ordre des paramètres | Étendue | R31 |
| immobilier | D12 (2026-10-15) : prix tous biens quand le prix du bien manque, nouveau critère AC-14 | Étendue | construit avec cette tranche (même script de données) ; AC-14 suppose le départ de R32 (mer sur Peu importe) |
| loyer-mer, proches, interface-telephone, immobilier | Critères partant de « mer 60 km », de `mer=60`, des réglages de départ ou du curseur de mer | Contredite | réécrits selon recalage.md (D4, D7), avec l'accord de Vincent |
| loyer-mer, proches, interface-telephone, immobilier | Fixtures « 5 communes » et « 6 communes », jeu « métropole » (`tests/fixtures/metropole.json`) et tuiles des tests | Étendue | type et distance à la montagne (fixture « 6 communes » de cette tranche) ; pour le jeu « métropole », seulement si la page en a besoin pour s'ouvrir |

Tests hors critères touchés (protégés : leur changement passe par Vincent en /build, avec les critères) :

| Fichier | Ce qu'il lit | Action |
|---|---|---|
| `tests/e2e/immobilier.spec.ts` l.357 (test d'AC-9) | l'adresse `/?achat=5000&mer=aucun` | devient `/?achat=5000` (R31) ; le critère AC-9 ne cite pas l'adresse et reste tel quel |
| `tests/e2e/immobilier.spec.ts` l.217-233, 258-277, 434, 453 | `mer=60`, adresse `/?loyer=1200&mer=60` après `/` | mer 50 km, ou nouveau départ `/?loyer=1200` |
| `tests/e2e/categories.spec.ts` | catégories « Mer » et « Taille de ville », résumés « 60 km », « Sans limite », « Petite ville, Ville moyenne », « Peu importe » | catégorie « Cadre de vie », résumé H75 |
| `tests/e2e/liste.spec.ts` l.56 | `getByRole('button', { name: /Petite ville/ })` | le nom disparaît (D2) : viser « 10 000 – 50 000 hab. » |
| `tests/e2e/safari.spec.ts`, `chrome.spec.ts` | H18 éprouvée en glissant le curseur de mer (`mer=55`, `mer=155`) | le curseur de mer disparaît : éprouver H18 avec le curseur du prix |
| `tests/e2e/aucune.spec.ts` | `/?loyer=300&mer=5` | `mer=10` (ou l'ancienne valeur, convertie en 10 km) |
| `tests/e2e/telephone-feuille.spec.ts` l.155, 507, 518 ; `telephone-vue.spec.ts` l.20 ; `proches-clavier-iphone.spec.ts` l.144 | `mer=60` | `mer=50` |
| tous les tests qui trouvent « Mer à moins de » (curseur), « Taille de ville » (catégorie ou groupe) | noms disparus | noms de H76 |
| `src/domain/url.test.ts`, `score.test.ts`, `prix.test.ts`, `format.test.ts`, `proches.test.ts` | mer 60, « Sans limite » pour la mer, « Grande ville » | recalés sur les mêmes règles |

## Ne change pas
Immobilier : AC-9 et AC-12, tels quels (le test d'AC-9 change de ligne d'adresse, voir ci-dessus). Tous les autres critères des quatre tranches sont recalés (50, [recalage.md](recalage.md)) : ils partent de la mer à 60 km ou du départ. Leurs règles restent vraies — prix (immobilier R21 à R26), proches (R9 à R15), feuille (interface-telephone R16 à R20), carte, liste et fiche (loyer-mer R1 à R8), sauf ce que le tableau marque « Contredite » ; seuls leurs exemples changent de chiffres ou d'adresse, à deux exceptions près (loyer-mer AC-3, immobilier AC-8, dans le tableau).

## Hypothèses
- **H69** — *Révisée par D12.* Pastilles de distance, pour la mer comme pour la montagne : « 10 km », « 30 km », « 50 km », « 100 km ».
- **H70** — Sous-titres : « Mer à moins de » et « Montagne à moins de » au-dessus de leurs pastilles.
- **H71** — *Révisée par D10.* Noms dans l'adresse : `ville-dense`, `ville-et-peripherie`, `bourg-et-village`, `campagne-isolee`.
- **H72** — Grille de densité : la grille communale de l'Insee, millésime 2025, regroupée en 4 niveaux (D10) ; source et lien fixés en tâche 0.
- **H73** — *Révisée par D9.* Zone de montagne : la source se tranche en tâche 0 entre la règle testée par la discovery (zone de montagne 2017 du ministère de l'Agriculture × massifs 2021 de l'ANCT, 5 882 communes, déjà recalée sur 2025 : [test du 2026-10-11](/Users/mouga/git-repository/ideas/carte-ou-vivre/discovery/2026-10-11-donnees-criteres/tests-avant-code/prix-mer-montagne-2026-10-11.md), section 3) et le zonage loi Montagne du Cerema (communes 2019) ; la zone est l'union des contours des communes classées, ou les contours propres de la source s'il y en a. Pour chacune : nombre de communes classées, distances de Chamonix, Grenoble, Annecy, Pau, Clermont-Ferrand, Lyon, Limoges, Toulouse, Bordeaux, et les villes de plus de 50 000 habitants classées ; Vincent choisit sur ces chiffres.
- **H74** — Score : la moyenne exacte des notes, arrondie moitié vers le haut (H3 de loyer-mer). Plusieurs critères recalés tombent sur une moitié exacte (Quaibleu 47,5 → 48 à 50 km ; Portmer 61,5 → 62 en 72 m²) : le calcul ne doit pas la perdre en virgule flottante.
- **H75** — Résumé de « Cadre de vie » repliée : « Peu importe » si rien n'est choisi ; sinon les choix séparés par « · », dans l'ordre des groupes : « 2 tailles », « 1 type », « Mer 50 km », « Montagne 30 km » (« 1 taille » au singulier). Forme finale : /ui.
- **H76** — Noms pour les lecteurs d'écran : groupes « Taille de la commune », « Type d'environnement », « Proximité avec la nature », « Mer à moins de », « Montagne à moins de » ; chaque pastille porte son libellé visible. Taille et type : boutons à bascule (« cochée » = enfoncée), comme les tailles aujourd'hui ; Mer et Montagne : *révisé par D12* — boutons à bascule exclusifs (« cochée » = enfoncée, une seule à la fois, la cochée se décoche d'un toucher), dans un groupe nommé ; au clavier, Tab de pastille en pastille comme les tailles.
- **H77** — La ligne de la liste ne change pas : la dernière colonne reste la distance à la mer, même quand la mer est sur Peu importe.
- **H78** — *Remplacée par D8.*
- **H79** — À égalité de score, l'ordre d'immobilier (prix connu d'abord, prix croissant, nom) ne change pas.
- **H80** — *Révisée par D9.* Mentions ajoutées au pied de page et à CLAUDE.md : « Type d'environnement : Insee, grille communale de densité » et « Zone de montagne : » suivi de la ou des sources retenues en tâche 0 (D9) ; textes exacts et licences vérifiés en tâche 0.
- **H81** — Une commune dont la mairie est dans la zone sans que la commune soit classée (contours de 2019 contre communes de 2025) compte comme classée ; leur nombre est compté en tâche 0 avec H73.
- **H82** — *Sans objet depuis D10* (plus de sous-groupes).
- **H83** — Ordre des raisons dans la fiche : prix, mer, montagne, taille, type, proches (l'ordre de loyer-mer, avec la montagne après la mer et le type après la taille).
- **H85** — *Construit, gardé par Vincent à la démo du 2026-10-15.* Source de la zone de montagne (D9 tranchée) : **Cerema, zonage loi Montagne, communes au 1er janvier 2019** (Licence Ouverte 2.0) ; contours propres (communes « totalité » + zones infra-communales) ; une commune « en partie » sans zone infra-communale (143, 9 départements) compte en entier. Décidé par Claude à la demande de Vincent (tâche 0). Coût connu : le Morvan n'est pas en montagne (Yonne à 150-200 km) ; Lyon à 14 km (le Mont d'Or n'est pas en zone légale).
- **H86** — Recalage sur le COG 2025 avec les rétablissements : une commune rétablie hérite du classement de celle dont elle sort (4 communes du Cantal).
- **H87** — `mer_km` et `montagne_km` de `communes.json` sont **tronqués** au centième de km, pour que le km affiché (R28, R29) soit toujours celui de la distance mesurée ; une commune hors de la zone de montagne vaut au moins 0,01 km (sinon une mairie à 24 m de la zone se lirait « Commune de montagne »).
- **H88** — Mer et montagne au clavier : Tab de pastille en pastille (D12) ; le groupe « Proximité avec la nature » n'a pas de titre visible, seulement un nom pour les lecteurs d'écran (prototype F).
- **H89** — Les messages de la liste restent ceux de D8 (« Fixe un loyer ou une distance à la mer… ») même quand la montagne ou le type pourraient classer ou filtrer.
- **H90** — Risque connu, accepté par Vincent le 2026-10-15 : cocher ou décocher une distance à la mer redessine la carte en 149 à 164 ms (au-delà des 100 ms de H9 de loyer-mer), car des milliers de communes changent de couleur d'un coup ; le prix et la montagne restent à ≈ 115 ms. À revoir si cela se sent à l'usage.
- **H91** — Critère de réussite « Chamonix passe » : avec le loyer à 1 350 € (son loyer pour 52 m² est de 1 334 €) ; décision de Vincent du 2026-10-15 (vérification de bout en bout, étape 2).

## Exceptions
Aucune.

## Vérification de bout en bout
Sur la version en ligne, en largeur bureau et à 390 px :
1. Ouvrir `/` : l'adresse devient `/?loyer=1200` ; « Cadre de vie » n'a rien de coché (résumé replié « Peu importe ») ; la liste classe par le prix seul.
2. Loyer à 1 350 €, montagne « 10 km » (Chamonix : 1 334 € pour 52 m², décision de Vincent du 2026-10-15) : Chamonix-Mont-Blanc passe, sa fiche dit « Commune de montagne » ; la fiche de Bordeaux dit « Montagne … km : au-dessus de ton plafond de 10 km » ; l'adresse contient `montagne=10`.
3. Décocher « 10 km » de la montagne, cocher « Ville dense » : Bordeaux passe, Lacanau ne passe pas, avec « Environnement : … hors des types choisis » ; l'adresse contient `env=ville-dense`.
4. Ouvrir `/?loyer=1200&mer=60` : la mer est sur 100 km, l'adresse devient `/?loyer=1200&mer=100`.
5. La fiche de Bordeaux affiche « Ville dense · » et sa population, et sa distance à la montagne ; les deux nouvelles mentions sont au pied de page.
Preuves : captures des étapes 1 à 5 aux deux largeurs, et la liste de la tâche 0 (H73) avec le jugement de Vincent.
