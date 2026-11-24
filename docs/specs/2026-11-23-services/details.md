# Détails — services du quotidien
Lire d'abord [spec.md](spec.md) (décisions D-n). Les états, règles et textes des tranches précédentes valent sauf ce qui suit ; le [tableau d'impact](#impact-sur-les-tranches-existantes) fait foi. Chiffres sur les vraies données : [mesures](mesures.md).

## Parcours
1. L'utilisateur ouvre la page : « Services » est la dernière catégorie, ouverte, rien de coché ; carte, liste et adresse sont celles d'aujourd'hui ; chaque fiche donne déjà les 10 temps (R54).
2. Il coche « 10 min » pour « Médecin » : seules restent les communes à 10 min ou moins, et celles sans chiffre hors des cas de D7 (R53) ; carte, liste, fiche et adresse se mettent à jour, les scores ne changent pas.
3. Dans « Scolarité », il coche « École » et « Collège », puis « 10 min » : une commune doit avoir les deux à 10 min ou moins (D13).
4. Il coche « 10 min » pour « Gare », puis passe de « Toutes » à « Régionale » : le filtre suit le niveau (R51).
5. Il ouvre la fiche d'une commune écartée : la raison dit quel service dépasse et de combien.
6. Il copie l'adresse : la même carte s'ouvre ailleurs (R55).

## Écrans et états
### Carte — route `/` · dans l'URL : en plus d'emploi R48, `services` (R55)

Zones touchées : **réglages** — une catégorie « Services » (H151) · **fiche** (R54) · **pied de page** (R56). Liste, légende et carte : inchangées (D4). Disposition à 390 px : /ui, avec la contrainte H48 d'interface-telephone.

États de la catégorie « Services » (initiale : **ouverte**, rien de coché) :
- **rien de coché** → 4 lignes, chacune avec ses 3 pastilles de temps ; « Scolarité » a en plus ses 5 niveaux, « Gare » son choix « Toutes » / « Régionale » / « Grandes lignes », chacun sur sa ligne au-dessus du temps titré (H169) ; résumé replié « Peu importe » (H154) ; sort vers **un choix ou plus** quand une ligne filtre.
- **un choix ou plus** → résumé « 1 choix », « 2 choix »…, une ligne qui filtre comptant pour un (H154) ; sort vers **rien de coché** quand plus aucune ligne ne filtre.
- **repliée** / **ouverte** → comme les autres catégories.

États des pastilles de temps d'une ligne (initial : **aucune cochée**) : **aucune cochée** → pas de filtre pour cette ligne ; **une cochée** → filtre (R53) ; une seule à la fois, cocher l'une décoche l'autre, toucher la pastille cochée la décoche (comme mer et montagne, D12 de cadre-de-vie).

États de « Scolarité » (initial : **vide**) :
- **vide** → aucun niveau, aucun temps ; pas de filtre.
- **incomplète** (au moins un niveau sans temps, ou un temps sans niveau) → pas de filtre ; sous la ligne, la phrase « Coche au moins un niveau et un temps. » (H153) ; rien dans l'adresse ; sort vers **active** en cochant ce qui manque, vers **vide** en décochant tout.
- **active** (au moins un niveau et un temps) → filtre (R53) ; retirer le dernier niveau ou le temps ramène à **incomplète**.

États du niveau de gare (initial : celui de l'adresse, sinon **Toutes**) : **Toutes** / **Régionale** / **Grandes lignes**, toujours un des trois ; changer de niveau garde la pastille cochée. Sans pastille cochée, le niveau ne filtre pas et n'est pas gardé dans l'adresse (R55).

États de la page : ceux des tranches précédentes. Les filtres de services s'ajoutent aux filtres (taille, type, mairie, métier) : dans l'état **sans plafond**, les communes écartées ne sont pas colorées, les autres prennent la couleur neutre ; ils peuvent mener à **aucune commune**, textes inchangés (H119 de mairies).

États de la fiche : ceux des tranches précédentes, plus le bloc de R54 ; la raison d'un service (R53) va dans les raisons, dans l'ordre de H160, y compris dans la page **sans plafond**.

Chargement : R57.

Interactions : cocher, décocher ou changer le niveau de gare → carte, liste, fiche et adresse à jour dans le budget de H163.

## Règles
- **R51** — Réglages (D1, D4, D5, D13, D15 à D18). « Services » contient, dans l'ordre, « Médecin », « Commerce alimentaire », « Scolarité », « Gare ». Temps : « 5 min », « 10 min », « 15 min » pour les deux premiers ; « 5 min », « 10 min », « 20 min » pour « Scolarité » ; « 10 min », « 20 min », « 30 min » pour « Gare » (H152) ; aucun coché = peu importe. « Scolarité » a en plus cinq niveaux cumulables, « Crèche », « École », « Collège », « Lycée », « Supérieur » (D17). « Gare » a en plus un choix à trois valeurs, « Toutes », « Régionale » et « Grandes lignes » (D16, D18). Dans ces deux lignes, le choix et le temps ont chacun leur titre visible (H169). Exemples : AC-1, AC-4, AC-10, AC-12, AC-14, AC-17. *Pourquoi* : D1, D4, D5, D13, D15 à D18.
- **R52** — Temps d'une commune (D2, D3, D12). Pour chaque carreau habité de la commune et chaque service, on prend le plus petit temps parmi les équipements du service (H158). Parmi les carreaux qui ont un temps pour ce service, le temps de la commune est le premier temps, dans l'ordre croissant, où la population cumulée atteint la moitié de leur population totale (H157) ; il est arrondi une seule fois (H156). Paris, Lyon et Marseille : tous les carreaux de leurs arrondissements ensemble. Une commune sans carreau avec un temps pour un service n'a pas de chiffre pour ce service, de même qu'un temps retiré par D12. « Gare grandes lignes » (D18) : le plus petit, avant arrondi, du temps vers une gare nationale (calculé comme ci-dessus) et du temps depuis la mairie vers la plus rapide des 3 gares de H170 les plus proches à vol d'oiseau (H171) ; si l'un manque, l'autre ; arrondi une seule fois (H156) ; commune de population 0, île sans pont (H161) ou commune de Corse : pas de chiffre. Exemples : AC-5, AC-13, AC-16. *Pourquoi* : D2, D3.
- **R53** — Filtre (D4 à D7, D13). Un service filtré laisse passer une commune si son temps est inférieur ou égal au temps coché ; dans « Scolarité » active, chaque niveau coché est un service filtré, avec le temps commun. Une commune sans chiffre passe, sauf les cas de D7, qui ne passent jamais : commune de population 0 (tous les services) ; île sans pont (H161), pour les trois niveaux de gare, quel que soit son temps ; commune de Corse (départements 2A et 2B), pour « Gare régionale » et « Gare grandes lignes ». Avec plusieurs services filtrés, une commune doit passer pour chacun. Le filtre ne note pas. Raisons : « <Service> <temps> : au-dessus de ton plafond de <n> min » (au-delà de 60 min, « Gare régionale plus d'une heure : au-dessus de ton plafond de 30 min ») ; population 0 : « <Service> : pas de chiffre, commune sans habitant » ; île : « <Gare, Gare régionale ou Gare grandes lignes> : aucune sur l'île » ; Corse : « <Gare régionale ou Gare grandes lignes> : aucune en Corse ». Exemples : AC-2, AC-3, AC-8, AC-9, AC-10, AC-14, AC-17. *Pourquoi* : D4 à D7, D13.
- **R54** — Fiche (D6 à D10, D13). Sous la ligne du chômage (R47 d'emploi) et, quand il existe, sous le bloc « Tes proches » : le titre « Services en voiture », puis 10 lignes dans l'ordre « Médecin », « Commerce alimentaire », « Crèche », « École », « Collège », « Lycée », « Supérieur », « Gare », « Gare régionale », « Gare grandes lignes », chacune « <Service> : <valeur> ». Valeur, dans cet ordre : « aucune sur l'île » pour les trois gares d'une île sans pont ; « aucune en Corse » pour les gares régionale et grandes lignes d'une commune de Corse ; « <n> min » jusqu'à 60 min ; « plus d'une heure » au-delà ; « pas de chiffre » sans temps. Puis la phrase des limites (H159), toujours. Puis, pour une île sans pont qui a au moins un temps parmi les sept premiers services, la phrase de la traversée (H159). Exemples : AC-6, AC-9, AC-17. *Pourquoi* : D6 à D10, D13.
- **R55** — Adresse (étend R48 d'emploi). `services` liste les services filtrés, séparés par des virgules, chacun `<nom>:<minutes>`, dans l'ordre fixe `medecin`, `commerce`, `creche`, `ecole`, `college`, `lycee`, `superieur`, puis `gare`, `gare-regionale` ou `gare-grandes-lignes`. Minutes valides : 5, 10, 15 pour `medecin` et `commerce` ; 5, 10, 20 pour les cinq niveaux de scolarité ; 10, 20, 30 pour les trois niveaux de gare. Une entrée au nom inconnu ou aux minutes invalides est retirée ; puis, pour un même service, ou pour les trois niveaux de gare ensemble, seule la première entrée valide est gardée ; la première entrée de scolarité valide fixe le temps commun, et une autre entrée de scolarité avec un autre temps est retirée. `services` n'est écrite que si au moins une entrée reste. Ordre des paramètres : plafond du prix, `mer`, `montagne`, `taille`, `env`, `mairie`, `metier`, `services`, `bien`, `unite`, `surface`. L'adresse est réécrite à l'ouverture avec les réglages effectifs. Exemples : AC-2, AC-3, AC-10, AC-11, AC-14, AC-17. *Pourquoi* : garder le partage par lien, comme les autres critères.
- **R56** — Pied de page. Il cite la source demandée par l'Insee (H164) et celles des gares grandes lignes (H172), à côté des mentions des tranches précédentes. Exemple : AC-7. *Pourquoi* : Licence Ouverte et ODbL, citer la source.
- **R57** — Chargement (D14). Sans `services` dans l'adresse, la carte et la liste s'affichent sans attendre les temps, qui se chargent juste après. Pendant ce temps, les temps, niveaux et choix de « Services » sont inactifs et le bloc de la fiche dit « Chargement des temps… » à la place de ses lignes et de ses phrases. Si le fichier échoue ou ne répond pas en 15 s, la catégorie et le bloc de la fiche disent « Temps des services indisponibles. » avec « Réessayer » ; le reste de la page marche. Avec `services` dans l'adresse, la page attend les temps avec le reste : même chargement et même erreur que les autres données (H140 d'emploi), pour ne jamais montrer une liste non filtrée. Exemple : AC-15. *Pourquoi* : D14.

## Cas limites
- Temps égal au temps coché (Quaibleu, 10 min, à « 10 min ») → la commune passe (AC-2).
- Temps de 60 min → « 60 min » ; 61 min → « plus d'une heure » (AC-6).
- Commune habitée sans chiffre pour le service filtré, hors D7 → elle passe, sans raison (AC-8).
- Île sans pont avec un temps de gare dans le fichier (Île-de-Bréhat, 9 min) → la fiche dit « aucune sur l'île », elle ne passe pas (AC-9).
- Île sans pont sans aucun temps parmi les sept premiers services (Île-de-Sein, Île-Molène) → pas de phrase de la traversée (AC-9).
- Commune de Corse en « Toutes » → règle normale (AC-9).
- Commune hors Corse et hors île sans chiffre de gare régionale → elle passe (D6, AC-9 pour Rhinval).
- Commune habitée sans aucun carreau (Suzan, Villefranche-le-Château) → les 9 premières valeurs disent « pas de chiffre », « Gare grandes lignes » garde son temps depuis la mairie, et elle passe (D6). Risque connu et accepté par D7 : ces deux communes à loyer bas peuvent monter dans une liste très filtrée.
- « Scolarité » avec des niveaux sans temps, ou un temps sans niveau → rien ne filtre, rien dans l'adresse, la phrase le dit (AC-14) ; à la réouverture d'un lien, cet état n'est pas gardé.
- Changer le niveau de gare sans pastille cochée → aucun effet sur la carte ni l'adresse (AC-10).
- La dernière ligne cesse de filtrer alors que la catégorie est repliée → résumé « Peu importe ».
- Gare nationale loin, gare ajoutée tout près (Les Sables-d'Olonne) → « Gare grandes lignes » prend le temps depuis la mairie (AC-16).
- Gare avec un TGV sous 4 arrêts par jour (Saint-Gervais, 0,5) → elle ne compte pas en « Grandes lignes » (H170).
- Deux niveaux de gare dans la même adresse → la première entrée valide est gardée (AC-11).
- Deux niveaux de scolarité à des temps différents dans l'adresse → le premier valide fixe le temps, l'autre est retiré (AC-11).

## Impact sur les tranches existantes

| Tranche | Élément | Inchangée / Étendue / Contredite | Action |
|---|---|---|---|
| loyer-mer | R4, lignes de la fiche | Étendue | bloc de R54 |
| loyer-mer | R1, raisons d'une commune qui ne passe pas | Étendue | raisons de R53 |
| loyer-mer | R2, D4, critères qui notent ; R5, ligne de la liste ; légende ; carte | Inchangée | le filtre ne note pas (D4) |
| loyer-mer | États **sans plafond** et **aucune commune**, leurs textes | Inchangée | H119 de mairies |
| loyer-mer | Pied de page, mentions | Étendue | R56 |
| loyer-mer | H9, réaction de la page | Étendue | H163 |
| emploi | H140, toutes les données chargées ensemble | Étendue | les temps des services font exception, sauf si l'adresse filtre déjà sur un service (R57) |
| emploi | R48, paramètres et ordre de l'adresse | Étendue | R55 (`services` après `metier`) |
| emploi | R47, ligne du chômage | Inchangée | le bloc de R54 vient après elle et après « Tes proches » |
| emploi | H139, ordre des raisons | Étendue | H160 (les services après les proches) |
| emploi | H129, « Tes proches » juste après « Emploi » (`mairies.spec.ts`, `emploi.spec.ts`) | Inchangée | « Services » va après « Tes proches » (H151) |
| mairies | H111, « Vie locale » juste après « Cadre de vie » | Inchangée | — |
| cadre-de-vie | R27 (filtres qui ne notent pas) ; D12, pastille cochée qui se décoche | Étendue | même geste, mêmes états |
| interface-telephone | R18, contenu de l'onglet « Critères » | Étendue | « Services » après « Tes proches » |
| interface-telephone | R20 et H53, champ d'adresse et défilement de « Critères » | Inchangée | une catégorie s'ajoute sous le champ : à revérifier avec les tests de la feuille |
| interface-telephone | H48, curseur du prix visible à 375 × 548 | Inchangée | contrainte pour /ui |
| proches, proches-fiables | Catégorie « Tes proches », R11 | Inchangée | sa place ne bouge pas |
| proches | Bloc « Tes proches » de la fiche | Inchangée | reste juste sous le chômage, au-dessus du bloc de R54 |
| immobilier | Réglage du prix, R24 à R26 | Inchangée | — |
| toutes | Fixture « 6 communes » d'emploi | Étendue | `temps_services` et `ile_sans_pont` (fixture de cette tranche) ; fixtures « 5 communes » et « métropole » : aucun temps, donc « pas de chiffre » |
| toutes | Aide de test partagée, qui simule les fichiers de données | Étendue | elle doit servir aussi les temps, seulement pour la fixture « 6 communes » (les « 5 communes » ont les mêmes codes) ; ce fichier est partagé par les tests protégés : accord de Vincent en /breakdown |

## Ne change pas
Sur une page sans service coché, le bloc de la fiche et la catégorie « Services » mis à part (lus par « contient ») : loyer-mer AC-1 à AC-15 ; interface-telephone AC-1 à AC-11 ; proches AC-1 à AC-9, AC-11, AC-14, AC-16 ; immobilier AC-1 à AC-14 ; cadre-de-vie AC-1 à AC-12 ; proches-fiables AC-1 à AC-12 ; mairies AC-1 à AC-12 ; emploi AC-1 à AC-14.

## Hypothèses
- **H151** — « Services » est la dernière catégorie, après « Tes proches », et s'ouvre dépliée comme les autres. *Décidé par Claude* ; écarté : entre « Emploi » et « Tes proches » (casse deux tests protégés) ; repliée au départ (moins découvrable).
- **H152** — Crans : 5, 10, 15 min pour le médecin et le commerce ; 5, 10, 20 min pour la scolarité, parce que le lycée est plus loin (D13) ; 10, 20, 30 min pour la gare. *Décidé par Claude après la relecture* : un cran de 30 min garde plus de 99 % des communes pour le médecin et le commerce ([mesures](mesures.md)) et se lirait comme une panne ; écarté : 5, 10, 15, 30 min partout, présenté à Vincent avant la relecture.
- **H153** — Groupes pour les lecteurs d'écran : chaque groupe de temps est nommé par sa ligne ; les niveaux s'appellent « Niveaux de scolarité », le choix de la gare « Type de gare ». Phrase de l'état **incomplète** : « Coche au moins un niveau et un temps. », en `secondaire`, reliée aux deux groupes. Boutons à bascule comme les distances de la mer. *Décidé par Claude* ; écarté : « Courses » pour le commerce (moins précis).
- **H154** — Résumé de « Services » repliée : « Peu importe », « 1 choix », « 2 choix »… ; une ligne qui filtre compte pour un, quel que soit son nombre de niveaux. *Décidé par Claude* ; écarté : compter chaque niveau.
- **H155** — Un seul paramètre `services` plutôt qu'un par service ; les niveaux de scolarité y gardent chacun leur entrée (`ecole:10,college:10`). *Décidé par Claude.*
- **H156** — Le temps est arrondi une seule fois, à la minute la plus proche, moitié vers le haut, au moins 1 ; c'est cette valeur qui est affichée et comparée (leçon du 2026-10-15 sur le double arrondi).
- **H157** — Médiane : les carreaux de population nulle ne comptent pas ; si la population cumulée atteint exactement la moitié à un temps, ce temps est retenu (2 min pour 50 habitants et 6 min pour 50 : 2 min). Un carreau à cheval sur plusieurs communes compte dans chacune pour sa part de population, telle que l'Insee la donne.
- **H158** — Équipements de chaque service (codes et libellés de la liste BPE 2025, lus le 2026-11-23) : médecin D265 ; commerce alimentaire B104 hypermarché, B105 supermarché, B201 supérette, B202 épicerie ; crèche D502 ; école C107 maternelle, C108 primaire, C109 élémentaire ; collège C201 ; lycée C301 général et/ou technologique, C302 professionnel ; supérieur C501 UFR, C502 institut universitaire, C503 école d'ingénieurs, C504 enseignement général supérieur privé, C505 école d'enseignement supérieur agricole, C509 autre enseignement supérieur ; gare E107 nationale, E108 régionale, E109 locale ; gare régionale E107, E108 ; gare grandes lignes E107 et les gares de H170. Le contenu est décidé par D1, D13, D15, D17 et D18.
- **H159** — Textes de la fiche. Limites : « Temps en voiture, sans embouteillages, que la moitié des habitants ne dépasse pas ; les trajets en bus ou à pied ne sont pas comptés. Médecins généralistes libéraux seulement, sans savoir s'ils prennent de nouveaux patients. Crèches financées par la CAF. Supérieur : universités et grandes écoles, antennes comprises. Gare régionale : 100 000 voyageurs par an ou plus. Gare grandes lignes : gare nationale, ou au moins 4 arrêts de TGV ou d'Intercités par jour ; son temps part parfois de la mairie. » Îles : « Île sans pont : un temps peut compter la traversée, sans l'attente du bateau. » Dans les lignes et les raisons de services, l'espace avant « : » est insécable (H148 d'emploi), de même que celui de « 100 000 ». *Décidé par Claude.*
- **H160** — Ordre des raisons : prix, mer, montagne, taille, type, mairie, métier 1, métier 2, proches, puis médecin, commerce, crèche, école, collège, lycée, supérieur, gare (étend H139 d'emploi). *Décidé par Claude* ; il suit l'ordre du panneau.
- **H161** — Les 16 communes d'îles sans pont : 17004 Île-d'Aix, 22016 Île-de-Bréhat, 29082 Île-de-Batz, 29083 Île-de-Sein, 29084 Île-Molène, 29155 Ouessant, 56009 Bangor, 56069 Groix, 56085 Hœdic, 56086 Île-d'Houat, 56087 Île-aux-Moines, 56088 Île-d'Arz, 56114 Locmaria, 56152 Le Palais, 56241 Sauzon, 85113 L'Île-d'Yeu. Noirmoutier, Ré et Oléron ont un pont. Liste écrite à la main, relue en tâche 0.
- **H162** — *Révisée par D14, D15, D17 et D18.* Poids du fichier des temps, 10 temps rangés par colonnes, chaque code INSEE écrit une seule fois : 349 Ko compressés (gzip -9), 271 Ko en brotli, sous la limite ([mesures](mesures.md)). Une ligne par commune pèserait 366 Ko compressés, au-dessus de la limite : *format décidé par Claude*, la jointure reste par code INSEE. C'est au-dessus des 300 Ko repris d'emploi, signalé à Vincent le 2026-11-23 : le fichier ne retarde plus l'affichage (D14). Limite : 350 Ko compressés (*estimation de Claude*) ; au-delà, retour à Vincent. L'affichage de la carte sans `services` dans l'adresse ne doit pas attendre ce fichier (R57).
- **H163** — Risque connu, comme H141 d'emploi : cocher une pastille peut redessiner des dizaines de milliers de communes. Mesuré en tâche 0 dans les conditions d'emploi (processeur ralenti 4 fois, écart au geste témoin du curseur du prix). Limite : + 115 ms, le plus grand écart déjà en ligne (« Ville dense » décochée, [mesure d'emploi](../../plans/2026-11-21-emploi/mesure-tache-0.md)). Au-delà, retour à Vincent.
- **H164** — Mention au pied de page et dans CLAUDE.md : « Temps d'accès aux services : Insee, base permanente des équipements, distancier Metric-OSRM, © les contributeurs d'OpenStreetMap et du projet OSRM (équipements 2025) ». *Texte décidé par Claude*, à partir de la citation demandée par l'Insee.
- **H165** — Fichiers figés sans les télécharger en entier : pour chacun des 13 fichiers, l'adresse, la taille et la somme de contrôle SHA-1 publiées par data.gouv.fr ; l'extraction s'arrête si l'une change. L'empreinte du petit fichier produit est écrite comme pour les autres sources (D11).
- **H166** — Dans la fixture, les temps sont donnés déjà arrondis ; R52 se teste à part sur l'`extrait_carreaux` (AC-5) et sur les vraies données (AC-13).
- **H167** — Niveaux de scolarité dans l'ordre des âges, crèche d'abord, dans le panneau, la fiche, l'adresse et les raisons. Le mot « Scolarité » couvre aussi la crèche (choix de Vincent, 2026-11-23). *Ordre décidé par Claude* ; écarté : école, collège, lycée, puis crèche.
- **H168** — Textes et délai de R57 : « Chargement des temps… », « Temps des services indisponibles. », « Réessayer » ; 15 s, le délai des autres données. Un lien avec `services` attend les temps pour éviter une liste fausse pendant un instant. *Décidé par Claude* ; écarté : afficher la liste non filtrée puis la corriger.
- **H169** — « Scolarité » et « Gare » en deux lignes : les niveaux, ou le type de gare, directement sous le titre de la ligne, puis le titre visible « Temps de trajet maximal » au-dessus des temps (choix de Vincent, 2026-11-23, puis 2026-11-24 : les titres visibles « Niveaux de scolarité » et « Type de gare » sont retirés, 39 px de moins à 390 px). Pour les lecteurs d'écran, les groupes gardent leurs noms (H153), et le groupe des temps celui de sa ligne.
- **H170** — Gares de « Grandes lignes » : jeu « Horaires SNCF » de data.gouv.fr (« Réseau SNCF TGV, Intercités et TER », licence ODbL), version 2026-11-22, `Export_OpenData_SNCF_GTFS_NewTripId.zip`, 5 547 556 octets, sha256 `0abd6918c870c6495a722406bc0c477f8d49ad4639dd9f4513b3d5f9331eaa73`. On compte, du 23/11 au 20/12/2026 (28 jours), les arrêts où l'on peut monter ou descendre des TGV INOUI, OUIGO, Lyria, ICE et Intercités, divisés par 28. Une gare entre à partir de 4 arrêts par jour, soit environ 2 allers-retours (*estimation de Claude, acceptée par Vincent le 2026-11-23*). Une gare dans une commune à gare nationale de l'Insee n'ajoute rien : il en reste 61. « Vendôme - Villiers-sur-Loir » : l'Insee la place à Villiers-sur-Loir (41294), son point SNCF tombe sur Vendôme (41269) ; elle est traitée comme nationale.
- **H171** — Temps vers ces 61 gares : depuis la mairie (point de `reperes.json`), en voiture, matrice openrouteservice `driving-car`, vers les 3 gares les plus proches à vol d'oiseau, calculé une seule fois avec l'accord de Vincent du 2026-11-23 ; le résultat est conservé pour ne pas relancer. Contrôle sur 892 trajets comparables à l'Insee : + 1,5 min en médiane, 87 % à moins de 5 min d'écart, même côté d'une pastille dans 96 à 99 % des cas, peu de cas en montagne ([mesures](mesures.md)). Risque accepté : la gare la plus rapide peut être hors des 3 plus proches.
- **H172** — Mention au pied de page et dans CLAUDE.md, à côté de H164 : « Gares grandes lignes : horaires SNCF (licence ODbL), temps depuis la mairie calculés avec openrouteservice, © OpenStreetMap contributors ». La liste des 61 gares ajoutées est servie dans un fichier du site, sous ODbL, pour le partage à l'identique. *Décidé par Claude.*

## Recommandations de la recherche
Pas de recherche pour cette tranche : Vincent a choisi le 2026-11-23 une mesure directe sur les données ([mesures](mesures.md)) à la place de `/research`.

## Exceptions
Aucune.

## Vérification de bout en bout
Sur la version en ligne, en largeur bureau et à 390 px :
1. Ouvrir `/` : l'adresse devient `/?loyer=1200` ; « Services » suit « Tes proches », rien de coché ; la fiche d'Auch dit Médecin 2 min, Commerce alimentaire 2 min, Crèche 3 min, École 2 min, Collège 3 min, Lycée 3 min, Supérieur 4 min, Gare 4 min, Gare régionale 4 min, Gare grandes lignes plus d'une heure, et la phrase des limites.
2. Loyer sur « Sans limite », cocher « 10 min » pour « Médecin » : Bordeaux et Mende restent colorées ; l'adresse contient `services=medecin:10`.
3. Dans « Scolarité », cocher « École », « Collège » et « 20 min » : l'adresse contient `ecole:20,college:20`.
4. Cocher « 30 min » pour « Gare », passer à « Régionale » : Mende n'est plus colorée, sa raison dit « Gare régionale plus d'une heure : au-dessus de ton plafond de 30 min » ; Ajaccio n'est plus colorée, sa fiche dit « Gare régionale : aucune en Corse ».
5. Ouvrir la fiche de L'Île-d'Yeu : « Médecin : pas de chiffre », « Gare : aucune sur l'île » et la phrase de la traversée.
6. Copier l'adresse dans un nouvel onglet : mêmes réglages, même carte.
7. La mention de R56 est au pied de page.
Preuves : captures des étapes 1 à 7 ; les comptes de la table de [mesures](mesures.md) refaits sur le fichier servi ; les 10 communes du risque confrontées à d'autres sources, jugées par Vincent.
