# Données — quelles sources ouvertes donnent un indicateur par métier et par territoire fin ?

## Résumé
- Seule piste qui coche le signal de bascule sur le papier : la BMO 2026 de France Travail (Licence Ouverte, 217 familles de métiers FAP 2021, fiches par bassin d'emploi, enquête fin 2025). MAIS je n'ai pas pu ouvrir le fichier xlsx open data (binaire illisible avec mes outils) : la maille réelle du fichier (bassin × métier ?) et la part de cases masquées restent NON VÉRIFIÉES.
- L'indicateur BMO = intentions de recrutement déclarées par les employeurs (« projets de recrutement »), issues d'un sondage redressé : on peut dire « des employeurs de la zone prévoient de recruter ce métier », pas « il y a des offres ».
- Urssaf (effectifs salariés par commune × APE, ODbL, 2025) est complet et sans masquage visible, mais c'est un secteur (APE), pas un métier, et l'ODbL pose une question de base dérivée. Rien trouvé côté Insee (emplois au lieu de travail par métier et commune).

## Faits

### Fiche 1 — BMO (France Travail)
- Producteur et jeu : France Travail, « Enquête Besoins en Main d'Oeuvre (BMO) », sur data.gouv.fr — [data.gouv.fr API](https://www.data.gouv.fr/api/1/datasets/enquete-besoins-en-main-doeuvre-bmo/), consulté le 2026-11-21 — licence « fr-lo », dernière mise à jour 2026-04-21, fréquence annuelle, ressources 2015 à 2026 en xlsx (paraphrase de l'outil) — type : primaire — confiance : moyenne (métadonnées lues via un outil de résumé).
- Licence : Licence Ouverte (code `fr-lo`) → mention de la source obligatoire, pas d'endossement — idem ci-dessus — type : primaire — confiance : moyenne.
- Fichier réellement téléchargeable : le fichier 2026 (xlsx, 3,6 Mo, deux feuilles `sheet1.xml` et `sheet2.xml`) a été récupéré malgré l'alerte « 409 Conflict » du contrôle de disponibilité data.gouv — [fichier BMO 2026](https://www.francetravail.org/files/live/sites/peorg/files/documents/Statistiques-et-analyses/Open-data/BMO/Base-open-data-BMO-2026.xlsx), consulté le 2026-11-21 — (paraphrase de l'outil : archive xlsx, deux feuilles, contenu non lisible) — type : primaire — confiance : haute pour l'existence, aucune pour le contenu.
- Documentation et qualité : data.gouv signale « documentation des ressources » et « formats ouverts » en échec, score 0,67, couverture spatiale « France », granularité « other » — [data.gouv.fr API](https://www.data.gouv.fr/api/1/datasets/enquete-besoins-en-main-doeuvre-bmo/), 2026-11-21 — (paraphrase de l'outil) — primaire — confiance : moyenne.
- Nomenclature et champ : « Le questionnaire soumis aux employeurs couvre une liste de 217 métiers qui correspondent aux Familles Professionnelles (FAP) » ; enquête réalisée « entre octobre et décembre 2025 » ; 416 600 réponses — [Fiche BMO 2026 bassin de Toulon, France Travail PACA](https://www.francetravail.org/files/live/sites/peorg-paca/files/documents/Statistiques%20&%20analyses/Entreprises/BMO%202026/Bassins/BMO_2026_bassin_Toulon.pdf), 2026-11-21 — « liste de 217 métiers qui correspondent aux Familles Professionnelles (FAP) » — primaire — confiance : haute.
- Ce que mesure l'indicateur : « Cette enquête mesure les intentions de recrutement des employeurs pour l'année à venir, qu'il s'agisse de créations de postes ou de remplacements » ; inclut temps partiel et saisonniers — même PDF — primaire — confiance : haute.
- Méthode : « Les résultats ont été redressés pour être représentatifs de l'ensemble des établissements, à l'aide d'une procédure de type calage sur marges » ; à Toulon, 3 140 réponses sur 14 390 interrogés, « taux de retour de 21,8% » — même PDF — primaire — confiance : haute.
- Champ exclu : « L'enquête ne comprend donc ni les administrations de l'État (ministères, police, justice…) ni certaines entreprises publiques » — même PDF — primaire — confiance : haute.
- Maille bassin existe en publication : fiche « Bassin d'emploi de Toulon », 22 150 projets, 10 familles de métiers affichées ; « Les fiches synthétiques pour les départements et les bassins d'emploi de la région PACA » — même PDF — primaire — confiance : haute pour les fiches PDF ; le fichier open data en bassin × métier n'est pas vérifié.
- Valeurs réelles (Toulon 2026) : serveurs de cafés restaurants 1 640 projets saisonniers, 85 % saisonniers, 51 % difficiles ; aides à domicile et auxiliaires de vie 480 projets difficiles, 80 % difficiles, 2 % saisonniers ; agents d'entretien de locaux 430 difficiles, 67 % ; employés de l'hôtellerie 580 saisonniers, 71 % difficiles — même PDF, tableaux 3 et 4 — primaire — confiance : haute. Les chiffres sont arrondis à la dizaine.
- Valeurs nationales (rapport nommé BMO2024 mais dont l'annexe est titrée « 2021 ») : « Agriculteurs salariés 91 078 projets, 55 % difficiles, 78 % saisonniers ; Ensemble des métiers 2 781 690 » — [rapport France BMO (Banque des Territoires)](https://www.banquedesterritoires.fr/sites/default/files/2024-04/BMO2024_rapport_France.pdf), 2026-11-21 — lu sur l'image des pages — primaire (copie hébergée du rapport France Travail) — confiance : moyenne (millésime ambigu).
- Total 2026 : environ 2,3 millions de projets, « en retrait de 6,5 % » ; 43,8 % jugés difficiles — [statistiques.francetravail.org/bmo/bmopub/228435](https://statistiques.francetravail.org/bmo/bmopub/228435), 2026-11-21 — (paraphrase de l'outil) — primaire — confiance : moyenne.
- Secret statistique : existe dans la BMO. Une page tierce note « totaux hors cases sous secret statistique » pour les répartitions régionales 2026 — [travail-industrie.com](https://travail-industrie.com/emploi/metiers-en-tension/secretaires-bureautiques-et-assimiles), 2026-11-21 — « totaux hors cases sous secret statistique » — copie/secondaire (site tiers citant le fichier open data) — confiance : basse. Part des cases masquées : non établie.
- Rupture de série : « les données antérieures à 2024 ont été rétropolées en nouvelle nomenclature » ; rupture consécutive à l'introduction de la FAP 2021 — rapport Banque des Territoires, même URL — primaire — confiance : moyenne.
- Données personnelles : aucune (agrégats par établissements) — déduction, voir plus bas.
- Dernier millésime et fraîcheur : mise en ligne le 2026-04-21, soit 7 mois avant la date du jour ; enquête de fin 2025 — data.gouv ci-dessus — primaire — confiance : moyenne.

### Fiche 2 — Urssaf, effectifs salariés par commune × APE
- Producteur : Urssaf, jeu « Nombre d'établissements employeurs et effectifs salariés du secteur privé, par commune x APE (au 31/12 depuis 2006) » — [data.gouv.fr API](https://www.data.gouv.fr/api/1/datasets/nombre-detablissements-employeurs-et-effectifs-salaries-du-secteur-prive-par-commune-x-ape-au-31-12-depuis-2006/), 2026-11-21 — licence `odc-odbl`, dernière mise à jour 2026-05-29, annuelle, couverture 2006 à 2025-12-31 (paraphrase de l'outil) — primaire — confiance : moyenne.
- Licence : ODbL 1.0 (partage à l'identique) → si le site republie une base dérivée, elle doit être sous ODbL ; une œuvre produite (carte) demande seulement la mention. À trancher par Vincent — même URL — primaire — confiance : moyenne.
- Contenu : 1 227 408 lignes ; champs `code_commune`, `code_zone_d_emploi`, `code_epci`, `code_ape`, `secteur_na88`, `nombre_d_etablissements_AAAA`, `effectifs_salaries_AAAA` de 2006 à 2025 — [API open.urssaf.fr](https://open.urssaf.fr/api/explore/v2.1/catalog/datasets/etablissements-et-effectifs-salaries-au-niveau-commune-x-ape-last/records?limit=6), 2026-11-21 — « total_count: 1227408 » (paraphrase de l'outil) — primaire — confiance : moyenne.
- Valeurs réelles : Bogny-sur-Meuse (08081), APE 4711D Supermarchés : 3 établissements, 69 salariés en 2025 (76 en 2021) ; APE 5610C Restauration de type rapide : 2 établissements, 8 salariés en 2025 ; APE 7010Z : `null` en 2023 à 2025 — même API — primaire — confiance : moyenne. Les lignes sans activité sont `null`.
- Ce que mesure : stock de salariés au 31/12 par établissement employeur du privé ; « Sole proprietors are included only if they pay a payroll » ; géographie communes au 01/01/2023, zones d'emploi 2020 ; effectifs issus de la DSN depuis 2022 (paraphrase de l'outil) — data.gouv — primaire — confiance : moyenne.
- Pas de masquage : des effectifs de 0, 1, 2 salariés sont publiés ; la description ne mentionne pas de secret statistique (paraphrase de l'outil) — primaire — confiance : moyenne.
- Nomenclature : APE/NAF (secteur d'activité, environ 700 postes, pas des métiers) — vu sur les champs `code_ape`, `secteur_na88`.

### Autres jeux vus dans le catalogue data.gouv
- Jeux locaux de collectivités (Saint-Louis Agglomération, La Rochelle) sur le même thème Urssaf, un seul territoire : hors sujet pour la France entière — [data.gouv.fr recherche](https://www.data.gouv.fr/api/1/datasets/?q=effectifs%20salari%C3%A9s%20commune%20secteur&page_size=20), 2026-11-21 — (paraphrase de l'outil) — secondaire — confiance : moyenne.

## Tableau comparatif

| Source | Mesure | Maille | Nomenclature | Licence | Millésime | Verdict |
|---|---|---|---|---|---|---|
| BMO France Travail | intentions de recrutement (sondage redressé) | bassin d'emploi en fiches PDF ; fichier à vérifier | 217 familles FAP 2021 | Licence Ouverte | 2026 (enquête fin 2025) | candidate principale, à ouvrir en tâche 0 |
| Urssaf commune × APE | salariés au 31/12 | commune | APE (secteur) | ODbL | 2025 | possible pour « secteur présent », pas métier |
| Insee RP emploi lieu de travail | — | — | — | — | — | non trouvé |
| Chômage Insee par zone d'emploi | demandeurs | 302 zones | aucune | LO 2.0 | T2 2026 | déjà connu, comparaison seulement |

## Déductions
- Le signal de bascule (≥ 20 familles, maille bassin ou plus fine, millésime ≤ 2 ans, Licence Ouverte) est rempli par la BMO 2026 si le fichier open data contient bien bassin × famille : 217 familles, enquête fin 2025, licence `fr-lo` (faits BMO). Le point « bassin dans le fichier » repose uniquement sur les fiches PDF et sur des résumés de recherche, pas sur le fichier.
- Même sur le papier, un bassin comme Toulon (22 150 projets) montre des familles à quelques dizaines de projets, arrondies à la dizaine ; les petits bassins auront beaucoup de cases à faible effectif ou masquées. La part masquée n'étant pas mesurée, le seuil « plus d'un quart masqué » n'est pas tranché.
- Phrase honnête permise : « les employeurs de ta zone prévoient de recruter N personnes dans ce métier en 2026 (sondage, estimation) », avec la part « jugés difficiles » et « saisonniers » comme nuance. Pas « il y a des offres » et pas « tu trouveras ». Le flux de projets biaise vers les métiers saisonniers (46 % saisonniers à Toulon), ce qui gonfle restauration et agriculture : à signaler.
- Rapporté à l'échelle commune : la BMO se rattache à un bassin (BMO) ; la table commune → zone d'emploi déjà connue ne suffit pas, il faut la table commune → bassin d'emploi France Travail (non vérifiée ici, risque de non-concordance avec les 302 zones d'emploi Insee).
- Pas de donnée personnelle : agrégats d'établissements, aucune personne identifiable dans les valeurs lues.

## Spéculations
- Le fichier BMO open data pourrait offrir bassin × famille × secteur avec des cases masquées codées « * » ou vides : à lire à l'ouverture.
- L'édition 2027 sortira vraisemblablement vers avril 2027 (cycle annuel observé, publication 2026-04-21).

## Hypothèses visées

### S1 — Quelle source ouverte par métier et par territoire fin
- Seuil : non réfutée si une source sous Licence Ouverte donne ≥ ~20 familles de métiers, à la maille bassin ou plus fine, millésime ≤ 2 ans ; infirmée sinon.
- Ce que disent les faits : BMO 2026 = Licence Ouverte, 217 familles, 2026, fiches par bassin publiées en PDF. Je n'ai pas vu les lignes du fichier. Preuve contraire : data.gouv signale « documentation manquante » et la maille déclarée est « other » ; Urssaf ne donne que des secteurs. Exigence « 2 sources primaires indépendantes » : non atteinte pour BMO (data.gouv et PDF viennent du même producteur, le fichier n'est pas lu) ; Urssaf est indépendante mais ne répond pas au critère métier.
- Verdict proposé : non réfutée (provisoire, confiance basse à moyenne ; penche vers la branche « tranche emploi dans mon métier », sous réserve d'ouvrir le fichier en tâche 0).

### S2 — Ce que mesure l'indicateur et ses trous
- Seuil : « recrute dans ton métier » si embauches prévues ou offres ; « métier présent » si stock ; maille ou familles plus larges si plus d'un quart des couples masqués.
- Ce que disent les faits : la BMO mesure des intentions d'embauche annuelles (flux, sondage redressé, taux de retour 21,8 % à Toulon), donc la branche « recrute ». Secret statistique confirmé par une source de basse qualité ; part masquée non établie. Cas contraire : champ qui exclut l'État et certaines entreprises publiques ; intentions déclarées, pas des embauches réalisées ; rupture de série FAP 2021 ; forte part saisonnière. Aucune critique publiée externe de la BMO trouvée.
- Verdict proposé : incertaine pour le seuil du quart masqué (non mesuré) ; non réfutée pour la formulation « recrute » (penche vers « recrute dans ton métier »).

## Non trouvé
- Contenu du fichier xlsx BMO 2026 (colonnes, nombre de bassins, valeurs masquées) — téléchargé mais illisible avec mes outils (pas de lecture xlsx) ; à ouvrir en tâche 0.
- Note méthodologique BMO (secret statistique, seuils de diffusion) — la page bmopub la mentionne sans la citer ; PDF non retrouvé.
- Nombre de bassins d'emploi France Travail et table commune → bassin — non trouvé.
- Insee recensement, emplois au lieu de travail par CSP/métier par commune — recherches catalogue data.gouv (« recensement emploi commune ») : 0 résultat ; page Insee 8581474 testée : logement uniquement. Non couvert.
- Indicateurs de tension Dares/France Travail par métier : une note méthodologique Dares existe (vue dans les résultats de recherche) mais non lue ; maille probablement régionale, non vérifiée.
- Critique publiée de la BMO (biais, surestimation) — une recherche, rien trouvé.
- Règle d'arrêt : plafond d'outils (20) presque atteint, et l'obstacle restant (lire un xlsx) ne se résout pas par plus de recherche web.

## Contradictions
- Le rapport nommé « BMO2024_rapport_France.pdf » contient une annexe titrée « Besoins en Main-d'œuvre 2021 » avec 2 781 690 projets : millésime ambigu, ne pas citer ses chiffres comme 2024.
- data.gouv indique des contrôles de disponibilité en « 409 Conflict » pour les ressources BMO alors que le fichier 2026 se télécharge (3,6 Mo).
