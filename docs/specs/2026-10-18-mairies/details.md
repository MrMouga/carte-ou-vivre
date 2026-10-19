# Détails — mairies
Lire d'abord [spec.md](spec.md) (décisions D-n). Les états, règles et textes des tranches précédentes valent sauf ce qui suit ; le [tableau d'impact](#impact-sur-les-tranches-existantes) fait foi.

## Parcours
1. L'utilisateur ouvre la page : rien de coché dans « Vie locale » ; la carte, la liste et l'adresse sont celles d'aujourd'hui.
2. Dans « Vie locale », il coche un ou plusieurs blocs, et peut-être « Sans étiquette » : carte, liste, fiche et adresse se mettent à jour ; les communes écartées ne sont plus colorées.
3. Il choisit une commune : la fiche dit sa mairie (bloc, étiquette, liste) et, si elle est écartée, pourquoi.
4. Il copie l'adresse : la même carte s'ouvre ailleurs, avec les mêmes pastilles cochées.

## Écrans et états
### Carte — route `/` · dans l'URL : en plus de cadre-de-vie R31, `mairie` (R41)

Zones touchées : **réglages** — une catégorie « Vie locale » (D7, place : H111) qui contient un groupe « Mairie élue en 2026 » (H109) · **fiche** (R40) · **pied de page** (R43). Liste, légende et carte : inchangées (D1). Disposition des 7 pastilles et résumé replié : /ui, avec la contrainte H48 d'interface-telephone (à 375 × 548, le curseur du prix reste entièrement visible à l'ouverture).

États de la catégorie « Vie locale » (initiale : **ouverte**, comme les autres) :
- **ouverte** → le groupe et ses 7 pastilles, chacune cochée ou non ; sort vers **repliée**.
- **repliée** → le titre et le résumé (H110) ; sort vers **ouverte**.

États du groupe « Mairie élue en 2026 » (cases cumulables ; initial : **aucune cochée**) :
- **aucune cochée** → pas de filtre (« Peu importe ») : toutes les communes passent ce filtre, y compris celles sans résultat.
- **une ou plusieurs cochées** → filtre (R38).

États de la page : ceux des tranches précédentes. Le filtre de mairie s'ajoute aux filtres (taille, type) : dans l'état **sans plafond**, les communes qu'il écarte ne sont pas colorées, les autres prennent la couleur neutre ; il peut aussi mener à **aucune commune**. Textes inchangés (H119).

États de la fiche : ceux des tranches précédentes, plus la ligne « Mairie » (R40), toujours présente (D6) ; la raison du filtre de mairie s'ajoute aux autres dans l'ordre de H113, y compris dans la page **sans plafond**.

Chargement : H122.

Interactions : cocher ou décocher une pastille → carte, liste, fiche et adresse à jour en ≤ 100 ms (H9 de loyer-mer ; risque connu : H120).

## Règles
- **R38** — Filtre (D2, D3, D5). Pastilles, dans l'ordre : « Gauche », « Divers », « Centre », « Droite », « Extrême droite », « Sans étiquette ». Aucune cochée : toutes les communes passent ce filtre. Sinon une commune passe si le bloc de sa mairie est coché, ou si sa mairie n'a pas d'étiquette et que « Sans étiquette » est cochée ; une commune sans résultat ne passe pas. Le filtre ne note pas : le score des communes qui passent ne change pas. Raisons : « Mairie : droite, hors des mairies choisies » (le bloc en minuscules), « Mairie : sans étiquette, hors des mairies choisies », « Mairie : aucun résultat en 2026, hors des mairies choisies ». *Pourquoi* : D2, D3, D5.
- **R39** — Mairie d'une commune (D4). C'est la liste qui a le plus de sièges au conseil municipal, au second tour si la commune en a eu un, sinon au premier (H115 en cas d'égalité) ; elle doit avoir au moins un siège, sinon la commune est « sans résultat ». Son bloc est celui de son étiquette dans la circulaire du 2 février 2026 (H117) ; une liste sans nuance (case vide, seule valeur hors de la grille dans les fichiers, mesuré le 2026-10-18) donne « sans étiquette » (D8) ; toute autre valeur absente de la grille arrête la tâche 0. Une commune absente des deux tours est « sans résultat ». Jointure : H121. Paris, Lyon et Marseille prennent le résultat du conseil municipal de toute la ville. Exemples : AC-11 (extrait inventé), AC-12 (vraies communes). *Pourquoi* : D4.
- **R40** — Fiche (D6). Sous la ligne de la montagne (R30 de cadre-de-vie) : « Mairie : <Bloc> (<étiquette>) · « <nom de la liste> » » (« Mairie : Droite (Divers droite) · « Portmer Avance » ») ; quand l'étiquette s'écrit comme le bloc, pas de parenthèse (« Mairie : Divers · « Montcher demain » ») ; sans étiquette : « Mairie : sans étiquette (moins de 3 500 habitants) · « Vivre à Terrebasse » » (D8 ; texte fixe, quelle que soit la population) ; sans résultat : « Mairie : aucun résultat en 2026 ». Le nom de la liste est écrit tel que publié (H114). *Pourquoi* : D6.
- **R41** — Adresse (étend R31 de cadre-de-vie). `mairie` liste les pastilles cochées, séparées par des virgules (noms de H108) ; comme `env`, un nom inconnu est ignoré et la liste est réécrite dans l'ordre de R38, sans doublon ; `mairie` n'est écrite que si au moins une pastille est cochée. Ordre : plafond du prix, `mer`, `montagne`, `taille`, `env`, `mairie`, `bien`, `unite`, `surface`. L'adresse est réécrite à l'ouverture avec les réglages effectifs. *Pourquoi* : D7 de loyer-mer, l'adresse garde les réglages.
- **R42** — Catégorie « Vie locale » (D7). Elle se replie et se déplie comme les autres catégories ; repliée, elle montre son résumé (H110). Sous 1 024 px, elle est dans l'onglet « Critères », après « Cadre de vie ». *Pourquoi* : D7.
- **R43** — Pied de page. Il cite la source des résultats et celle des blocs (H118), à côté des mentions des tranches précédentes. *Pourquoi* : Licence Ouverte, citer la source ; D2.

## Cas limites
- Aucune pastille cochée → une commune sans résultat passe, comme aujourd'hui (AC-4).
- « Sans étiquette » seule cochée → passent les communes dont la mairie n'a pas d'étiquette ; pas celles sans résultat (D5).
- Un seul bloc coché et le prix sur « Sans limite » → état **sans plafond** : les communes de ce bloc en couleur neutre, les autres non colorées (AC-6).
- Une liste en tête des voix au premier tour, battue au second → la mairie est celle du second tour (AC-11).
- Paris, Lyon, Marseille → le conseil de toute la ville, pas les arrondissements (AC-12).
- Commune présente dans les fichiers, aucune liste avec un siège → « sans résultat » (R39 ; 0 commune au 2026-10-18).
- Deux listes à égalité de sièges → H115 (4 communes, toutes sans étiquette).
- Un seul bloc coché, aucune commune de ce bloc ne passe (« Centre » dans la fixture) → état **aucune commune**, textes inchangés (AC-2, H119).
- Nom de liste très long (jusqu'à 121 caractères dans les fichiers) → écrit en entier, sur plusieurs lignes (H114).
- Étiquette des fichiers absente de l'annexe de la circulaire → arrêt en tâche 0, retour à Vincent ; aucun bloc deviné (H117).

## Impact sur les tranches existantes

| Tranche | Élément | Inchangée / Étendue / Contredite | Action |
|---|---|---|---|
| loyer-mer | R4, lignes de la fiche | Étendue | ligne « Mairie » (R40) |
| loyer-mer | R1, raisons d'une commune qui ne passe pas | Étendue | raisons de R38 |
| loyer-mer | R2, D4, critères qui notent ; R5, ligne de la liste ; légende ; carte | Inchangée | le filtre ne note pas (D3), rien sur la carte (D1) |
| loyer-mer | États **sans plafond** et **aucune commune**, leurs textes | Inchangée | H119 |
| loyer-mer | Pied de page, mentions | Étendue | R43 |
| loyer-mer | H9, réaction en ≤ 100 ms | Étendue | H120, comme H90 de cadre-de-vie |
| loyer-mer | D18, la « mairie » comme point de chaque commune (repères, proches, fixture de proches) | Inchangée | le point ne change pas ; les nouvelles données de mairie (bord politique) s'ajoutent sans le remplacer, sous un autre nom |
| cadre-de-vie | R31, paramètres et ordre de l'adresse | Étendue | R41 (`mairie` après `env`) |
| cadre-de-vie | H83, ordre des raisons | Étendue | H113 |
| cadre-de-vie | Catégorie « Cadre de vie », son résumé H75 | Inchangée | — |
| cadre-de-vie | R27 (taille et type filtrent sans noter) ; états **sans plafond** et de la fiche pour les filtres | Étendue | la mairie est un troisième filtre (R38) |
| cadre-de-vie | D8, textes des états vides | Inchangée | H119 |
| interface-telephone | R18, contenu de l'onglet « Critères » | Étendue | « Vie locale » après « Cadre de vie » (R42) |
| interface-telephone | H48, curseur du prix visible à 375 × 548 | Inchangée | contrainte pour /ui |
| proches, proches-fiables | Catégorie « Tes proches », R11 (ce qui note) | Inchangée | — |
| immobilier | Réglage du prix, R24 à R26 | Inchangée | — |
| toutes | Fixture « 6 communes » de cadre-de-vie | Étendue | une mairie par commune (fixture de cette tranche) ; fixtures « 5 communes » et jeu « métropole » : seulement si la page en a besoin pour s'ouvrir |

Tests hors critères : aucun ne compte les catégories ni ne compare la fiche ou le pied de page en entier (ils lisent par « contient ») ; ajouter une catégorie, une ligne de fiche et une mention n'en change aucun libellé. Mais « Vie locale » se place avant « Tes proches » et décale le focus et le défilement : à revérifier en tâche 0 `tests/e2e/proches-mobile.spec.ts` l.80 et l.95 (Maj+Tab « vers les tailles » tombera sur « Sans étiquette »), `tests/e2e/telephone-feuille.spec.ts` l.187 et l.527-541, `tests/e2e/proches-etats.spec.ts` l.235 (leçon du 2026-10-14 sur les libellés lus par les tests protégés).

## Ne change pas
Sur une page sans pastille de mairie cochée : loyer-mer AC-1 à AC-15 ; interface-telephone AC-1 à AC-11 ; proches AC-1 à AC-9, AC-11, AC-14, AC-16 ; immobilier AC-1 à AC-14 ; cadre-de-vie AC-1 à AC-12 ; proches-fiables AC-1 à AC-12.

## Hypothèses
- **H108** — Noms dans l'adresse : `gauche`, `divers`, `centre`, `droite`, `extreme-droite`, `sans-etiquette`.
- **H109** — Le groupe a un titre visible « Mairie élue en 2026 », qui est aussi son nom pour les lecteurs d'écran ; les pastilles sont des boutons à bascule (« cochée » = enfoncée), comme les types d'environnement ; au clavier, Tab de pastille en pastille.
- **H110** — Résumé de « Vie locale » repliée : « Peu importe » si rien n'est coché ; sinon « 1 choix », « 2 choix »… (/ui peut le changer par une révision de la spec, AC-8).
- **H111** — « Vie locale » est entre « Cadre de vie » et « Tes proches ».
- **H112** — Une fiche ouverte sans filtre de mairie montre la ligne « Mairie » comme les autres lignes, sans mise en avant.
- **H113** — Ordre des raisons dans la fiche : prix, mer, montagne, taille, type, mairie, proches.
- **H114** — Le nom de la liste est affiché tel que les fichiers l'écrivent (majuscules comprises), en entier, entre guillemets français ; aucune correction de casse.
- **H115** — Deux listes à égalité de sièges (4 communes au 2026-10-18, toutes sans étiquette : Rancourt-sur-Ornain, Michery, Vénérolles, Chassey-Beaupré) : celle qui a le plus de voix au tour retenu par R39.
- **H116** — Résultats : jeux « Elections municipales 2026 - Résultats du premier tour » et « … du second tour » du ministère de l'Intérieur sur data.gouv.fr (Licence Ouverte), résultats par commune, mis à jour le 20/03/2026 et le 23/03/2026 ; empreintes notées en tâche 0 ; les rectifications et élections partielles d'après ne sont pas suivies.
- **H117** — Rattachement d'une étiquette à son bloc, et texte de l'étiquette en clair : ceux de l'annexe de la circulaire du 2 février 2026 (grille des 25 nuances de listes et ses blocs), lus en tâche 0 (déjà sûrs : LFI et LUDR, D2, décision du Conseil d'État n° 512694) ; **sauf, amendé par Vincent le 2026-10-19 (D2)** : LFI et LEXG (bloc « Extrême gauche » de l'annexe) sont rangées en « Gauche ». Une adresse avec `mairie=extreme-gauche` ignore ce nom, comme tout nom inconnu (R41).
- **H118** — Mention au pied de page et dans CLAUDE.md : « Résultats des élections municipales 2026 : ministère de l'Intérieur ; blocs politiques : circulaire du 2 février 2026, sauf l'extrême gauche (dont La France insoumise), rangée à gauche » (Licence Ouverte ; texte amendé le 2026-10-19 avec D2, décidé par Claude).
- **H119** — Les textes des états vides ne changent pas (D8 de cadre-de-vie), même quand c'est le filtre de mairie qui écarte tout.
- **H120** — Risque connu, comme H90 de cadre-de-vie : cocher un bloc seul décolore plus de 30 000 communes d'un coup, la carte peut se redessiner au-delà de 100 ms ; mesuré en tâche 0 ; au-delà de 100 ms, retour à Vincent, qui accepte ou non (comme H90).

- **H121** — Jointure par code INSEE : le code commune des fichiers en est un (Corse en 2A/2B comprise) ; seules les lignes des communes comptent, pas les fichiers des conseils d'arrondissement. Au 2026-10-18, tous les codes de métropole des deux fichiers existent dans les communes de la carte (COG 2025) ; un code inconnu arrête la tâche 0 (recalage comme H86 de cadre-de-vie, avec l'accord de Vincent).
- **H122** — Les mairies se chargent avec les données des communes : même chargement et même erreur (comme H68 d'immobilier) ; poids ajouté mesuré en tâche 0.

## Exceptions
Aucune.

## Vérification de bout en bout
Sur la version en ligne, en largeur bureau et à 390 px :
1. Ouvrir `/` : l'adresse devient `/?loyer=1200` ; « Vie locale » est sous « Cadre de vie », aucune pastille cochée ; la liste est celle d'avant la tranche.
2. La fiche de Bordeaux dit « Mairie : Centre (…) · « Faire Gagner Bordeaux » ».
3. Loyer sur « Sans limite », cocher « Gauche » : Paris, Lyon et Marseille prennent la couleur neutre ; Bordeaux et Nice ne sont pas colorées, leurs fiches disent « Mairie : centre, hors des mairies choisies » et « Mairie : extrême droite, hors des mairies choisies » ; l'adresse contient `mairie=gauche`.
4. Cocher aussi « Sans étiquette » : les villages reviennent en couleur neutre ; l'adresse contient `mairie=gauche,sans-etiquette`.
5. La nouvelle mention est au pied de page.
Preuves : captures des étapes 1 à 5 aux deux largeurs ; le compte des mairies par bloc et la liste de 10 villes connues (Paris, Lyon, Marseille, Bordeaux, Nice, Perpignan, Toulouse, Nantes, Lille, Strasbourg) avec leur bloc, jugées par Vincent.
