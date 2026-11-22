# Détails — emploi
Lire d'abord [spec.md](spec.md) (décisions D-n). Les états, règles et textes des tranches précédentes valent sauf ce qui suit ; le [tableau d'impact](#impact-sur-les-tranches-existantes) fait foi. Mesures sur les vraies données : [recherche](../../research/2026-11-21-emploi/synthesis.md) et [mesures](../../research/2026-11-21-emploi/mesures/mesures.md).

## Parcours
1. L'utilisateur ouvre la page : « Emploi » ne contient que le champ « Ton métier », vide, et la phrase sur l'État (D13) ; la carte, la liste et l'adresse sont celles d'aujourd'hui ; chaque fiche dit déjà le chômage de la zone (R47).
2. Il tape le début de son métier, choisit une suggestion : le métier s'affiche avec ses 3 niveaux, aucun coché ; rien ne filtre encore ; la fiche dit le bassin de la commune pour ce métier.
3. Il coche un niveau : seules restent les communes à 30 km ou moins de la ville principale d'un bassin de ce niveau (R46) ; carte, liste, fiche et adresse se mettent à jour.
4. Il ajoute le métier de son conjoint et coche un niveau : une commune doit tenir les deux (D1).
5. Il copie l'adresse : la même carte s'ouvre ailleurs, avec les mêmes métiers et niveaux (D9).

## Écrans et états
### Carte — route `/` · dans l'URL : en plus de mairies R41, `metier` (R48)

Zones touchées : **réglages** — une catégorie « Emploi » (H129) · **fiche** (R47) · **pied de page** (R49). Liste, légende et carte : inchangées (D5). Disposition à 390 px : /ui, avec la contrainte H48 d'interface-telephone (à 375 × 548, le curseur du prix reste entièrement visible à l'ouverture).

États de la catégorie « Emploi » (initiale : **ouverte**, sans métier ; la phrase de D13 est toujours visible quand elle est ouverte) :
- **sans métier** → le champ « Ton métier » (H130) ; résumé replié « Peu importe » (H132) ; sort vers **un métier** par un choix.
- **un métier** → le libellé du métier, « Retirer » sur sa ligne, ses 3 pastilles (H131) et, tant qu'aucune n'est cochée, la phrase « Coche un niveau… » (H130 ; révisé par /ui le 2026-11-21), le lien « + Ajouter un second métier » ; après un choix, le focus va sur la première pastille, « Partout » (révisé par /ui ; révisé le 2026-11-22, D15) ; résumé « 1 métier » ; sort vers **ajout en cours** (lien) ou **sans métier** (« Retirer »).
- **ajout en cours** → le champ « Second métier » sous le premier métier ; Échap le referme et le vide ; quitté avec du texte, il reste ouvert avec son texte (H145) ; sort vers **deux métiers** par un choix, vers **un métier** par Échap.
- **deux métiers** → les deux, chacun avec ses pastilles et « Retirer » ; pas de lien d'ajout ; résumé « 2 métiers » ; sort vers **un métier** (« Retirer » sur l'un ; le restant devient le premier).
- **repliée** / **ouverte** → comme les autres catégories.

États du champ de métier (initial : **vide**) :
- **vide** ou **1 caractère** → aucune suggestion.
- **suggestions** (2 caractères ou plus, au moins un résultat) → jusqu'à 8 libellés (H133) ; un choix ferme le champ et ajoute le métier.
- **aucun résultat** → « Aucun métier trouvé » ; sort en modifiant le texte.

États des pastilles d'un métier (initial : **aucune cochée**) : **aucune cochée** → pas de filtre pour ce métier ; **une cochée** → filtre (R46) ; une seule cochée à la fois, cocher l'une décoche l'autre, toucher la pastille cochée la décoche (comme mer et montagne, D12 de cadre-de-vie).

États de la page : ceux des tranches précédentes. Le filtre métier s'ajoute aux filtres (taille, type, mairie) : dans l'état **sans plafond**, les communes qu'il écarte ne sont pas colorées, les autres prennent la couleur neutre ; il peut mener à **aucune commune**, textes inchangés (H119 de mairies).

États de la fiche : ceux des tranches précédentes, plus les lignes de R47 ; la raison d'un métier (R46) va dans les raisons, une seule fois, dans l'ordre de H139, y compris dans la page **sans plafond**.

Chargement : H140.

Interactions : choisir, retirer un métier ou cocher un niveau → carte, liste, fiche et adresse à jour en ≤ 100 ms (H9 de loyer-mer ; risque : H141). Suggestions affichées en ≤ 100 ms après la frappe.

## Règles
- **R44** — Choisir ses métiers (D1, D10, D13). Dans « Emploi », le champ « Ton métier » propose, dès 2 caractères, les métiers dont un mot du libellé ou un nom courant (H134) commence par le texte tapé (mots et comparaison : H133) ; un métier déjà choisi n'est pas proposé. Un choix ajoute le métier, sans niveau coché. Deux métiers au plus ; « + Ajouter un second métier » ouvre un second champ ; « Retirer » enlève un métier et son niveau. Sous le champ, toujours : « Les emplois de l'État (enseignants du public, fonctionnaires) ne sont pas dans l'enquête. » (D13, texte H130). Exemples : AC-1 à AC-3, AC-13. *Pourquoi* : D1, D10, D13.
- **R45** — Bassins qui recrutent, par métier (D2, D3, D7). Les projets d'un bassin pour un métier sont la somme des lignes publiées du fichier (une ligne par comité local ; une ligne cachée « * » ne compte pas) ; un bassin est **chiffré** s'il a au moins une ligne publiée. Sur les N bassins de métropole, classés par projets : le niveau « 10 » contient les bassins chiffrés dont les projets sont au moins ceux du k-ième, k = N × 10 % arrondi (H137) ; le niveau « 25 », de même avec N × 25 % ; « tous » contient tous les bassins chiffrés. Un bassin d'un niveau est aussi dans les niveaux plus larges. Un bassin sans chiffre n'est dans aucun (D7). Ville principale d'un bassin : H135. Exemples : AC-8 (extrait inventé), AC-12 (vraies données). *Pourquoi* : D3.
- **R46** — Filtre (D1, D4, D5). Un métier avec un niveau coché laisse passer une commune si la mairie de la ville principale d'au moins un bassin de ce niveau est à 30 km ou moins de la sienne, à vol d'oiseau (H136) ; la ville principale elle-même est à 0 km. Le bassin de la commune n'a pas de rôle à part : un bassin voisin compte autant. Avec deux métiers à niveau coché, une commune doit passer pour chacun. Un métier sans niveau ne filtre pas. Le filtre ne note pas : le score des communes qui passent ne change pas. Raison, quand une commune ne passe pas pour un métier : « <Libellé> : aucun bassin parmi les 10 % qui recrutent le plus dans un rayon de 30 km (le plus proche : <Ville principale>, <n> km) » (« 25 % » de même ; pour « tous » : « <Libellé> : aucun bassin où ce métier recrute dans un rayon de 30 km (le plus proche : …) ») ; « le plus proche » est la ville principale la plus proche parmi les bassins du niveau coché (égalité : H136). Exemples : AC-4 à AC-7, AC-13. *Pourquoi* : D4, D5.
- **R47** — Fiche (D6, D7, D8, D11). Sous la ligne « Mairie » (R40 de mairies), dans l'ordre : une ligne par métier choisi, puis la ligne du chômage, toujours présente. *Complétée le 2026-11-22 (retouches 2 de la démo)* : dans « bassin de <Ville> » et « zone d'emploi de <nom> », le « de » s'élide et se contracte selon le nom (H149).
  - Métier avec un niveau coché, et la commune passe le filtre de ce métier : « <Libellé> : <Ville principale>, <à n km | à moins d'1 km | sur place>, parmi les 10 % de bassins qui recrutent le plus · <projets> recrutements prévus en 2026 » — la ville principale la plus proche parmi les bassins du niveau coché (égalité : H136) ; le niveau écrit est le plus étroit de ce bassin (« parmi les 25 % de bassins qui recrutent le plus » ; pour « tous » : « bassin où ce métier recrute »).
  - Sinon (pas de niveau coché, ou la commune ne passe pas le filtre de ce métier) : « <Libellé> : bassin de <Ville principale de son bassin>, <projets> recrutements prévus en 2026 », ou « <Libellé> : bassin de <…>, pas de chiffre publié pour ce métier » (D7) ; la raison, s'il y en a une, est dans les raisons (R46).
  - Nombres avec espace des milliers (« 1 027 »). La part jugée difficile n'est pas écrite (D11).
  - Chômage : « Chômage : <t> % dans la zone d'emploi de <nom Insee> (<trimestre>) » (« 7,1 % », une décimale) ; inconnu : « Chômage : inconnu » (H138).
  Exemples : AC-5, AC-6, AC-9, AC-10. *Pourquoi* : D6, D7, D8, D11.
- **R48** — Adresse (étend R41 de mairies, D9). `metier` liste les métiers dans l'ordre où ils ont été choisis, séparés par des virgules ; chacun est un code de métier, suivi de `:10`, `:25` ou `:tous` si un niveau est coché (H128) ; `metier` n'est écrite que si un métier est choisi. Un code inconnu est retiré ; un niveau inconnu est retiré sans retirer le métier ; un code déjà présent est retiré ; au-delà de deux, les suivants sont retirés. Ordre : plafond du prix, `mer`, `montagne`, `taille`, `env`, `mairie`, `metier`, `bien`, `unite`, `surface`. L'adresse est réécrite à l'ouverture avec les réglages effectifs. Exemples : AC-1, AC-3 à AC-6, AC-11. *Pourquoi* : D9.
- **R49** — Pied de page. Il cite la source des projets de recrutement et des bassins, et celle du chômage (H143), à côté des mentions des tranches précédentes. Exemple : AC-1. *Pourquoi* : Licence Ouverte, citer la source.
- **R50** — Métier peu chiffré (D14). Un métier chiffré (R45) dans moins de 130 bassins de métropole est **peu chiffré** ; dans « Emploi », sous son libellé, il porte toujours la phrase de H147, quel que soit son niveau. Le compte se fait en tâche 0, sur le fichier retenu (96 métiers sur 217 le 2026-11-21, mesure exploratoire). Rien de plus dans la fiche ni sur la carte. Exemple : AC-14. *Pourquoi* : D14.

## Cas limites
- Métier choisi sans niveau → rien ne filtre ; seule la fiche change (AC-1, AC-9).
- Ville principale la plus proche à 30,4 km → la commune passe (H136).
- Une commune dans un bassin du niveau, mais à plus de 30 km de sa ville principale, et aucun autre bassin du niveau à 30 km → elle ne passe pas (D4). Dans la fixture, Terrebasse est à 42 km de Grandeville et passe par Montcher, à 29 km (AC-10).
- Deux métiers qui passent par des bassins différents : possible (R46) ; la fixture ne le montre pas (aucune commune n'est à 30 km ou moins de deux villes principales). AC-6 montre une commune qui passe un métier par un bassin et rate l'autre.
- Un bassin où toutes les lignes du métier sont cachées → sans chiffre, dans aucun niveau (AC-8, b11).
- Un métier chiffré dans moins de k bassins (graphistes : 90 chiffrés pour 97 visés à « Beaucoup », 25 %) → « Beaucoup » et « Partout » gardent les mêmes bassins ; rien ne le dit à l'écran (D12).
- Un métier ou un niveau sans aucun bassin → n'existe pas dans les fichiers retenus (H146).
- Deux fois le même code dans l'adresse → le second est retiré (AC-11).
- Paris, Lyon, Marseille → H142.
- Commune sans zone d'emploi → « Chômage : inconnu » (AC-9, fixture seulement : H138).
- Le dernier métier retiré alors que la catégorie est repliée → résumé « Peu importe ».
- Libellé très long (jusqu'à environ 130 caractères) → écrit en entier, sur plusieurs lignes.
- Métier peu chiffré (R50) avec un niveau coché → l'avertissement reste ; il filtre comme les autres.

## Impact sur les tranches existantes

| Tranche | Élément | Inchangée / Étendue / Contredite | Action |
|---|---|---|---|
| loyer-mer | R4, lignes de la fiche | Étendue | lignes des métiers et du chômage (R47) |
| loyer-mer | R1, raisons d'une commune qui ne passe pas | Étendue | raisons de R46 |
| loyer-mer | R2, D4, critères qui notent ; R5, ligne de la liste ; légende ; carte | Inchangée | le filtre ne note pas (D5) |
| loyer-mer | États **sans plafond** et **aucune commune**, leurs textes | Inchangée | H119 de mairies |
| loyer-mer | Pied de page, mentions | Étendue | R49 |
| loyer-mer | H9, réaction en ≤ 100 ms | Étendue | H141 |
| loyer-mer | D18, la mairie comme point de chaque commune | Inchangée | les distances de R46 partent de ce point ; les points de la fixture ne bougent pas (H144) |
| mairies | R41, paramètres et ordre de l'adresse | Étendue | R48 (`metier` après `mairie`) |
| mairies | H113, ordre des raisons ; R40, ligne « Mairie » | Étendue | H139 ; nouvelles lignes sous « Mairie » |
| mairies | H111, place de « Vie locale » (entre « Cadre de vie » et « Tes proches ») | Contredite | « Emploi » s'insère entre « Vie locale » et « Tes proches » (H129) ; H111 de mairies annotée « révisée par emploi » ; mairies AC-1 (« suit Cadre de vie ») reste vrai |
| mairies | Catégorie « Vie locale », R38 | Inchangée | — |
| cadre-de-vie | R27 (filtres qui ne notent pas) ; états **sans plafond** et de la fiche pour les filtres | Étendue | le métier est un quatrième filtre (R46) |
| cadre-de-vie | D12, pastille cochée qui se décoche | Inchangée | même geste pour les niveaux |
| interface-telephone | R18, contenu de l'onglet « Critères » | Étendue | « Emploi » après « Vie locale » (H129) |
| interface-telephone | R20, champ visible au-dessus du clavier de l'iPhone | Étendue | le champ de métier suit la même règle (AC-13 ; preuve sur l'iPhone de Vincent, vérification de bout en bout) |
| interface-telephone | H48, curseur du prix visible à 375 × 548 | Inchangée | contrainte pour /ui |
| proches, proches-fiables | Catégorie « Tes proches », R11 ; distances en km des proches | Inchangée | les points des mairies ne bougent pas (H144) |
| immobilier | Réglage du prix, R24 à R26 | Inchangée | — |
| toutes | Fixture « 6 communes » de mairies | Étendue | bassin, zone d'emploi, chômage, métiers et distances aux villes principales (fixture de cette tranche) ; fixtures « 5 communes » et « métropole » : seulement si la page en a besoin pour s'ouvrir |

Tests hors critères : ils lisent la fiche et le pied de page par « contient » (relevé par mairies) ; mais « Emploi » s'insère avant « Tes proches » et décale le focus et le défilement : revérifier en tâche 0 les tests qui parcourent les catégories au clavier ou au défilement (leçon du 2026-10-14 sur les libellés lus par les tests protégés).

## Ne change pas
Sur une page sans métier choisi, la ligne de chômage mise à part (lue par « contient ») : loyer-mer AC-1 à AC-15 ; interface-telephone AC-1 à AC-11 ; proches AC-1 à AC-9, AC-11, AC-14, AC-16 ; immobilier AC-1 à AC-14 ; cadre-de-vie AC-1 à AC-12 ; proches-fiables AC-1 à AC-12 ; mairies AC-1 à AC-12.

## Hypothèses
- **H128** — Adresse : `metier=V1X80:10,U1X82` ; niveaux `10`, `25`, `tous` ; code de métier = code BMO (FAP 2021) tel que publié. *Décidé par Claude* ; écarté : `metier1=…&recrute1=…`.
- **H129** — « Emploi » est entre « Vie locale » et « Tes proches ». *Décidé par Claude* ; écarté : juste après « Logement » (plus haut, mais décale davantage les tests protégés).
- **H130** — Libellés : champ « Ton métier » ; second champ « Second métier » ; lien « + Ajouter un second métier » ; action « Retirer » ; phrase de D13 : « Les emplois de l'État (enseignants du public, fonctionnaires) ne sont pas dans l'enquête. » ; sous les pastilles d'un métier sans niveau coché, et seulement alors : « Coche un niveau pour garder les communes proches de ces bassins. » (ajoutée par /ui le 2026-11-21, choix de Vincent après la relecture des pistes : un métier sans niveau ne filtre pas, D5 ; texte décidé par Claude) *Décidé par Claude* ; écarté : « Métier de ton conjoint » (une personne seule peut viser deux métiers).
- **H131** — *Révisée le 2026-11-22 (démo de /build, D15, choix de Vincent).* Pastilles, du plus large au plus étroit : « Partout » (niveau `tous`), « Beaucoup » (`25`), « Le plus » (`10`), sous le titre « Où ce métier recrute » ; l'adresse garde `tous` / `25` / `10` (R48 inchangée) ; aucune cochée = peu importe. Le groupe est nommé par ce titre suivi du libellé du métier (« Où ce métier recrute Infirmiers et sages-femmes », révisé par /ui le 2026-11-21 : deux groupes au même nom sinon) ; boutons à bascule comme les distances de la mer. La fiche et les raisons gardent « parmi les 10 % / 25 % de bassins qui recrutent le plus » (R46, R47 inchangées) : ce sont elles qui disent ce que « Le plus » et « Beaucoup » veulent dire (*décidé par Claude*). Écartés : « 10 % » · « 25 % » · « Partout où il recrute » (jugés peu clairs par Vincent sur son iPhone) ; « Volume d'offres : Élevé / Modéré / Faible » (« offres » contredit D6 ; « Faible » se lit « là où ça recrute peu ») ; « Un peu » à la place de « Partout » ; « Très fort / Fort / Présent ».
- **H132** — Résumé de « Emploi » repliée : « Peu importe », « 1 métier », « 2 métiers ». *Décidé par Claude.*
- **H133** — Recherche : un mot commence après une espace, un tiret, une apostrophe, une virgule ou une parenthèse (« femm » trouve « sages-femmes », « etude » trouve « d'étude ») ; accents et casse ignorés ; 8 suggestions au plus, libellés trouvés par leur propre texte d'abord, puis par un nom courant, chacun dans l'ordre alphabétique ; un métier n'apparaît qu'une fois ; au clavier, flèches, Entrée, Échap, comme la recherche d'adresse des proches. *Décidé par Claude.*
- **H134** — Noms courants : la table de correspondance des intitulés de métiers vers les familles professionnelles de la Dares si elle est publiée sous licence ouverte (lue en tâche 0) ; sinon une liste écrite à la main de 60 noms au plus (« développeur », « data scientist », « UX designer », « sage-femme »…), chacun vers un seul métier, montrée à Vincent à la démo. *Décidé par Claude.*
- **H135** — Ville principale d'un bassin : sa commune la plus peuplée (populations légales de la carte) ; à égalité, le plus petit code INSEE. L'interface nomme un bassin par sa ville principale (« bassin de Pau »), jamais par le libellé du fichier (« BEARN », « T9 Grand Paris Grand Est »). *Décidé par Claude* ; écarté : le libellé du fichier. *Amendée le 2026-11-21 (/build, tâche 0b, choix de Vincent) : une exception, le bassin 7503 « CONFOLENS », que la table de France Travail compose de 135 communes de Charente et de 12 du Médoc ; sa ville principale est la plus peuplée de sa partie charentaise, Terres-de-Haute-Charente, et non Castelnau-de-Médoc (159 km de Confolens). Seul bassin dans ce cas au 2026-11-21.*
- **H136** — Distance : de mairie à mairie (D18 de loyer-mer), à vol d'oiseau, comparée et écrite au km comme la mer (30,4 km s'écrit « 30 km » et passe ; « moins d'1 km » compte pour 1 km) ; la ville principale elle-même : « sur place », 0 km. Deux villes principales à la même distance écrite : celle du niveau le plus étroit, puis celle qui a le plus de projets, puis le plus petit code INSEE. *Décidé par Claude.*
- **H137** — k = arrondi au plus proche, moitié vers le haut : 39 et 97 pour N = 389 ; les bassins à égalité avec le k-ième sont gardés (98 aux niveaux « 10 » ou « 25 » pour M2X90, mesuré le 2026-11-21).
- **H138** — Chômage : taux de chômage localisé par zone d'emploi de l'Insee (Licence Ouverte), dernier trimestre publié à la tâche 0 (2e trimestre 2026 à la recherche), une décimale ; nom de la zone tel que l'Insee l'écrit ; commune → zone par la table d'appartenance géographique de l'Insee, recalée comme H142 ; une commune de la carte sans zone arrête la tâche 0 (« Chômage : inconnu » n'existe donc que dans la fixture).
- **H139** — Ordre des lignes de la fiche après « Mairie » : métier 1, métier 2, chômage. Ordre des raisons : prix, mer, montagne, taille, type, mairie, métier 1, métier 2, proches (étend H113 de mairies).
- **H140** — Les données d'emploi se chargent avec les données des communes : même chargement et même erreur (comme H122 de mairies) ; poids ajouté mesuré en tâche 0 ; au-delà de 300 Ko compressés, retour à Vincent.
- **H141** — Risque connu, comme H90 de cadre-de-vie : cocher un niveau peut redessiner des dizaines de milliers de communes ; mesuré en tâche 0 ; au-delà de 100 ms, retour à Vincent.
- **H142** — Communes → bassins : table des bassins d'emploi 2026 de France Travail ; les 12 codes absents (COG 2025 de la carte contre 2026 de la table : `12218`, `14581`, `15031`, `15035`, `15047`, `15171`, `49126`, `60694`, `69114`, `80832`, `85165`, `85212`) recalés comme H86 de cadre-de-vie ; Paris, Lyon, Marseille par leurs arrondissements, chacune dans un seul bassin (1107, 8428, 9306), dont elle est la ville principale. Un code non recalé arrête la tâche 0. *Amendée le 2026-11-21 (/build, tâche 0a, choix de Vincent) : une commune absente de la table sans aucun mouvement dans le COG prend le bassin de la commune la plus proche, de mairie à mairie (Yvrench 80832 → Yvrencheux 80833, 0,8 km, bassin 3201 d'Abbeville) ; seul un code qui n'a ni mouvement ni voisine arrête la tâche 0.*
- **H143** — *Amendée le 2026-11-21 (/build, tâche 0a) : la table des bassins n'a aucune licence écrite ; Vincent choisit de s'en servir sans écrire à France Travail (réutilisation d'une information publique publiée, en citant la source et sa date, CRPA L321-1 et L322-1), et la mention gagne la date de la table.* Mentions au pied de page et dans CLAUDE.md : « Projets de recrutement et bassins d'emploi : France Travail, enquête Besoins en main-d'œuvre 2026 (table des bassins mise à jour le 17/04/2026) » et « Chômage : Insee, taux de chômage localisés par zone d'emploi, <trimestre> » ; la licence de la table des bassins est lue en tâche 0 (pas de Licence Ouverte → retour à Vincent) ; fichiers figés comme les autres sources (CLAUDE.md). *Texte décidé par Claude.*
- **H144** — Dans la fixture, les distances commune → ville principale sont données telles quelles (`distances_km`) et ne se déduisent pas des points des mairies, qui ne bougent pas (tests des tranches précédentes) ; sur les vraies données, la façon de les obtenir se décide en /breakdown ; les deux voies donnent la même valeur au km. *Décidé par Claude* ; écarté : déplacer les points ou les carrés de la fixture (tests protégés).
- **H145** — Le champ « Second métier » quitté avec du texte reste ouvert avec son texte ; seul Échap le referme et le vide. *Décidé par Claude.*
- **H146** — Chaque métier est chiffré dans au moins 6 bassins (mesuré le 2026-11-21) : « le plus proche » a toujours une ville à nommer ; un fichier qui casse cette règle arrête la tâche 0.
- **H147** — Texte de R50 : « Chiffré dans peu de bassins : la carte en oublie sûrement. », en `secondaire`, entre la ligne du libellé (et « Retirer ») et « Où ce métier recrute » (titre révisé le 2026-11-22, D15) ; le groupe des niveaux en est décrit (`aria-describedby`). Dans la fixture, le champ `peu_chiffre` de chaque métier donne la réponse (vrais comptes : infirmiers 358, médecins 262, ingénieurs en informatique 120, graphistes 90). *Texte et place décidés par Claude*, contestables à la démo.
- **H148** — *Ajoutée le 2026-11-22 (démo de /build, constats mineurs de la relecture navigateur, accord de Vincent).* Deux raisons de métier dans la fiche sont séparées par un petit espace (jeton d'espacement), pour ne pas se lire comme un seul bloc ; au clavier, la suggestion en surbrillance reste visible dans le panneau (il défile avec les flèches) ; l'anneau de focus des pastilles se voit en entier, sans être coupé par la pastille voisine. *Complétée le 2026-11-22 (retouches 2)* : dans une raison de métier, l'espace avant « : » est insécable, comme sur la ligne du métier (le « : » ne tombe jamais seul en début de ligne).
- **H149** — *Ajoutée le 2026-11-22 (retouches 2 de la démo, accord de Vincent).* Devant un nom de ville ou de zone, « de » devient « d' » devant une voyelle, accentuée ou non (« bassin d'Auch », « d'Orléans », « d'Évry-Courcouronnes ») ; « de Le » devient « du » (« bassin du Havre », « du Mans ») et « de Les » devient « des » (« des Sables-d'Olonne ») ; « de La » reste (« de La Rochelle »). Pas d'élision devant « H » : h muet et h aspiré ne se distinguent pas sans liste (« de Hyères » reste ; *décidé par Claude*, contestable). Vaut pour « bassin de » et « zone d'emploi de » de la fiche.

## Recommandations de la recherche

| P-n | Reprise en | Raison si rejetée en partie |
|---|---|---|
| P-1 | D2 ; H142, H143 | — |
| P-2 | D6 ; textes de R46 et R47 | — |
| P-3 | D7 ; R45, R47 | — |
| P-4 | D10 ; R44, H133, H134 | Le niveau des 81 groupes et sa mesure ne sont pas repris : Vincent a choisi les 217 libellés, avec un champ qui propose |
| P-5 | R45, R47 ; H142 (Paris, Lyon, Marseille) | La fiche nomme le bassin par sa ville principale (H135), pas par le libellé du fichier ; D4 remplace la maille du bassin par la distance à sa ville principale (Vincent) |
| P-6 | D13 (phrase sur l'État) ; « Le risque » (test à la démo) | La FAQ relève de /launch, pas de cette tranche |
| P-7 | R49, H143 | — |
| P-8 | H137 (égalités), H142 (recalage, Paris-Lyon-Marseille), R45 (somme des comités locaux), « Le risque » (couverture des métiers des testeurs, seuil 130 bassins) | Le compte des trous par groupe n'est pas repris (P-4) |

## Exceptions
Aucune.

## Vérification de bout en bout
Sur la version en ligne, en largeur bureau et à 390 px :
1. Ouvrir `/` : l'adresse devient `/?loyer=1200` ; « Emploi » est entre « Vie locale » et « Tes proches », champ vide, phrase sur l'État ; la fiche de Bordeaux dit « Chômage : … % dans la zone d'emploi de Bordeaux (…) ».
2. Taper « infirm », choisir « Infirmiers et sages-femmes » : l'adresse contient `metier=V1X80` ; la fiche de Bordeaux dit « … : bassin de Bordeaux, 626 recrutements prévus en 2026 » (mesuré le 2026-11-21, [mesures](../../research/2026-11-21-emploi/mesures/mesures.md)).
3. Loyer sur « Sans limite », cocher « Le plus » : Bordeaux et Pau prennent la couleur neutre ; la fiche de La Rochelle donne la raison « … (le plus proche : La Roche-sur-Yon, 61 km) » ; l'adresse contient `metier=V1X80:10`.
4. « + Ajouter un second métier », taper « développeur », choisir, cocher « Le plus » : Pau n'est plus colorée, sa fiche donne la raison « … (le plus proche : Bayonne, 92 km) » ; l'adresse contient `metier=V1X80:10,M2X90:10`.
5. Copier l'adresse dans un nouvel onglet : mêmes métiers, mêmes niveaux, même carte.
6. Les mentions de R49 sont au pied de page.
7. Sur l'iPhone de Vincent : choisir un métier au toucher ; le champ reste visible au-dessus du clavier (R20 d'interface-telephone).
Preuves : captures des étapes 1 à 7 ; les comptes d'AC-12 ; 3 métiers des testeurs dans 5 bassins connus, jugés par Vincent.
