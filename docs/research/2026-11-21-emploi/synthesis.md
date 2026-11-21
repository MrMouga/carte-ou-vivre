# Recherche — emploi

Date : 2026-11-21 · Tranche servie : emploi · Statut : brouillon

Sources : [cadrage](cadrage.md) · [rapport du chercheur](agents/donnees.md) · [mesures sur les fichiers](mesures/mesures.md) · [vérification](verification.md)

## En bref
1. **Une donnée ouverte répond à « trouver du travail dans mon métier »** : l'enquête Besoins en main-d'œuvre (BMO) 2026 de France Travail, sous Licence Ouverte. Elle donne le nombre de **projets de recrutement prévus par les employeurs**, pour **217 métiers**, dans chacun des **389 bassins d'emploi** de métropole. Une table officielle range chaque commune dans un bassin : 34 731 de nos 34 746 communes s'y joignent directement.
2. **C'est une intention d'embaucher, pas une offre** : un sondage auprès des employeurs, redressé, sur l'année 2026. On peut écrire « les employeurs du coin prévoient de recruter N personnes dans ce métier en 2026 », jamais « il y a N offres » ni « tu trouveras ».
3. **La carte sera trouée** : un métier typique n'a un chiffre que dans 147 bassins sur 389. Ailleurs, la case est masquée (secret statistique) ou absente du fichier, sans que le producteur dise ce que « absente » veut dire. Pour les ingénieurs en informatique, 120 bassins sur 389.
4. **Deux biais à dire** : l'enquête ne couvre pas l'État (les professeurs des écoles n'ont un chiffre que dans 28 bassins), et elle compte les saisonniers, ce qui gonfle la restauration, le tourisme et l'agriculture.
5. Le chômage par zone d'emploi (le « marché du coin ») et les effectifs par secteur de l'Urssaf ne connaissent pas les métiers : écartés comme source principale.

## Réponses par sujet

### S1 — Quelle source ouverte donne un indicateur par métier et par territoire fin ?
- Faits :
  - Jeu « Enquête Besoins en Main d'Oeuvre (BMO) », France Travail, data.gouv.fr : licence `fr-lo` (Licence Ouverte), mis à jour le 2026-04-21, annuel ([rapport § Fiche 1](agents/donnees.md), confirmé par le vérificateur sur l'API data.gouv) — primaire.
  - Fichier `Base-open-data-BMO-2026.xlsx` (Last-Modified 21/04/2026, sha256 `735d0443…`) : une ligne par métier × bassin × comité local pour l'emploi ; colonnes `met` (projets de recrutement), `xmet` (jugés difficiles), `smet` (saisonniers) ; en métropole, 389 bassins, 217 métiers, 8 grandes familles, 21 domaines et 81 groupes de métiers d'après les codes ([mesures](mesures/mesures.md), refaites à l'identique par le vérificateur) — primaire.
  - Page de méthode : « exploitable à un niveau géographique fin, le bassin d'emploi » ; 406 bassins en France entière ; 217 métiers « issue de la nomenclature des Familles Professionnelles (FAP 2021) » (confirmé) — primaire.
  - Table `Bassins_d'emploi_2026.xlsx` (Last-Modified 17/04/2026), liée depuis la page de méthode : 34 990 communes, une seule par bassin ; 34 731 de nos communes jointes ; Paris, Lyon et Marseille par leurs arrondissements, chacune dans un seul bassin (1107, 8428, 9306) ; 12 codes à recaler (changements de communes probables, non vérifié) (confirmé) — primaire.
  - Urssaf, effectifs salariés par commune × APE : ODbL, mis à jour le 2026-05-29, secteur d'activité (≈ 700 codes APE), pas de métier (confirmé) — primaire.
  - Recensement Insee, emplois par métier et commune : non trouvé dans le catalogue data.gouv.fr.
- Constat : la BMO est la seule source trouvée qui croise métier et territoire fin sous licence ouverte. Le croisement est dans le fichier lui-même, pas seulement dans les fiches PDF.
- Preuve contraire : data.gouv signale « documentation des ressources » en échec, et la feuille de description du fichier nomme encore les colonnes de 2025 (`BE25`). Toutes les sources BMO viennent du même producteur : l'exigence « 2 sources primaires indépendantes » n'est pas remplie au sens strict. Elle est compensée par la lecture directe du fichier, refaite par le vérificateur.
- Implication pour la décision A : branche « tranche emploi dans mon métier » (Licence Ouverte, 217 métiers au bassin, millésime 2026).
- Niveau : critique · Confiance : **moyenne** pour l'existence, la licence et la maille (fichier lu, mesuré deux fois, et page de méthode confirmée) ; elle serait faible si l'on comptait seulement les sources indépendantes.

### S2 — Que mesure l'indicateur, et quels sont ses trous ?
- Faits :
  - « Cette enquête mesure les intentions de recrutement des employeurs pour l'année à venir, qu'il s'agisse de créations de postes ou de remplacements » ; temps partiel et saisonniers inclus ; « redressés … calage sur marges » ; à Toulon, 3 140 réponses sur 14 390 interrogés, soit 21,8 % (fiche bassin de Toulon, confirmé) — primaire.
  - « L'enquête ne comprend donc ni les administrations de l'État … ni certaines entreprises publiques » (confirmé) — primaire.
  - Couverture (mesures, confirmé) : sur les 84 413 couples bassin × métier, 41,1 % ont un chiffre, 12,2 % sont entièrement masqués (`*`) et 46,7 % sont absents du fichier. Par métier, la médiane est de 147 bassins chiffrés sur 389, et seuls 79 métiers sur 217 sont chiffrés dans au moins la moitié des bassins. Par groupe de métiers (81), la médiane est de 239 ; par domaine (21), de 348.
  - Valeurs : de 5 à 8 733 projets par ligne, médiane 21 ; Bordeaux, ingénieurs en informatique : 121 + 621 ; Nantes 962 + `*` ; La Rochelle `*` ; Mauriac absent.
- Constat : c'est un flux d'embauches prévues, donc « recrute » est honnête, avec « prévoit de » et l'année. Les trous sont nombreux, et leur sens n'est pas documenté : ni la page de méthode ni le fichier ne disent si une case absente veut dire « aucun projet » ou « non publié », ni où passe le seuil du secret statistique (le vérificateur ne l'a pas trouvé ; le sens de `*` est une déduction).
- Preuve contraire : ce sont des intentions déclarées, pas des embauches réalisées ; l'État n'est pas couvert ; la part saisonnière est forte (46 % à Toulon). Aucune critique publiée de la BMO trouvée.
- Implication pour la décision B : « recrute » est permis, avec « prévoit de recruter » et l'année. Pour le seuil du quart masqué, rien n'est tranché : 12,2 % des couples sont masqués, mais 59 % si les cases absentes sont des cases masquées. Les trous viennent surtout des petits bassins, mais ce n'est pas mesuré.
- Niveau : standard · Confiance : **faible** pour le sens des trous, **moyenne** pour ce que mesure un chiffre (deux pages du producteur confirmées).

## Données

**Enquête Besoins en main-d'œuvre 2026 (BMO)**
- Producteur et URL : France Travail — [jeu data.gouv](https://www.data.gouv.fr/datasets/enquete-besoins-en-main-doeuvre-bmo) ; [fichier 2026](https://www.francetravail.org/files/live/sites/peorg/files/documents/Statistiques-et-analyses/Open-data/BMO/Base-open-data-BMO-2026.xlsx) ; [méthode](https://statistiques.francetravail.org/bmo/static/methode_2026).
- Licence : Licence Ouverte (attribution) → une mention visible, par exemple « Projets de recrutement : France Travail, enquête Besoins en main-d'œuvre 2026 », sans laisser croire à un soutien de l'État.
- Mise à jour lue sur le fichier : 21/04/2026 ; enquête d'octobre à décembre 2025 ; annuelle, la prochaine sans doute vers avril 2027 (déduction du chercheur).
- Couverture : France entière ; 389 bassins en métropole ; 217 métiers FAP 2021 ; 41,1 % des couples chiffrés.
- Production : sondage auprès de près de 1,8 million d'établissements, plus de 416 000 réponses, redressé par calage sur marges ; hors État et certaines entreprises publiques.
- Problèmes connus : documentation jugée insuffisante par data.gouv ; colonnes renommées entre la description et les données (`BE25` → `BE26`) ; contrôle de disponibilité data.gouv en « 409 » alors que le fichier se télécharge.
- Accès : téléchargement complet, sans clé. Risque d'abandon faible (série publiée depuis 2015).
- Données personnelles : non (agrégats d'établissements).
- Valeurs pour la fixture : M2X90 ingénieurs en informatique, Bordeaux 742 (121 + 621), Nantes 962 et une ligne masquée, Toulon 109, La Rochelle masqué, Mauriac absent ; V1X80 infirmiers et sages-femmes, La Rochelle 66, Mauriac 20 ; L5X90 cadres administratifs, comptables et financiers, Bordeaux 134 (18 + 116), La Rochelle 25.

**Table des bassins d'emploi 2026** — France Travail, [fichier](https://statistiques.francetravail.org/bmo/Handlers/HTFile.ashx?MEDIAID=188096) (Last-Modified 17/04/2026) ; colonnes commune → bassin ; licence non écrite sur la page de méthode qui la lie (même producteur et même usage que le jeu sous Licence Ouverte, à confirmer en tâche 0).

**Écartées comme source principale** : le chômage Insee par zone d'emploi (Licence Ouverte 2.0, 302 zones, sans métier) ; les effectifs Urssaf par commune × APE (ODbL, secteurs, pas métiers : une base dérivée republiée devrait l'être sous ODbL).

## Règles et contraintes
- Licence Ouverte : mention de la source obligatoire (voir la fiche ci-dessus). Pas de donnée personnelle.
- Licence de la table commune → bassin : non lue, à confirmer en tâche 0.

## Mots de la cible
Hors de cette recherche. « Dans mon métier » est le seul verbatim connu, rapporté par Vincent (synthèse du 2026-11-21).

## Épreuve du jugement central
- Recommandation centrale : faire la tranche emploi sur la BMO 2026, métier × bassin, et l'afficher comme des « projets de recrutement prévus en 2026 ».
- Hypothèses qui la portent : (1) un chiffre de projets prévus aide à choisir une ville pour son métier ; (2) les trous ne rendent pas la carte inutilisable pour les métiers de la cible ; (3) une case absente peut être lue comme « pas de projet publié ».
- Options concurrentes : (a) BMO métier × bassin ; (b) chômage par zone d'emploi, la promesse redescendant à « marché du coin » ; (c) Urssaf, « ton secteur est présent », sous ODbL ; (d) ne pas faire la tranche sous cette forme, et dire « pas de donnée par métier fiable ».
- Les 3 preuves qui les distinguent le mieux : (1) seule la BMO a la dimension métier, ce que demandent les testeurs ; (2) couverture médiane de 147 bassins sur 389 par métier, et de 239 sur 389 par groupe de métiers ; (3) le sens des cases absentes n'est pas documenté.
- Ce qui l'infirmerait : en tâche 0, les métiers des testeurs eux-mêmes, chiffrés dans moins d'un tiers des bassins même au niveau des groupes ; ou une réponse du producteur disant que « absent » veut dire « non publié » pour des bassins importants (une grande ville sans chiffre pour un métier courant).

## Pour la spec
| # | Recommandation | Devient | Preuve (sujet, confiance) | Alternative écartée et pourquoi |
|---|---|---|---|---|
| P-1 | Source de l'emploi : BMO 2026 (France Travail, Licence Ouverte), jointe aux communes par la table des bassins d'emploi 2026 ; fichiers figés par leur date et leur empreinte, comme DVF et les municipales | D-n (source) ; `sources.py` en tâche 0 | S1, moyenne | Chômage par zone (sans métier) ; Urssaf (secteurs, ODbL) |
| P-2 | Ce qu'un chiffre dit : « N projets de recrutement prévus en 2026 par les employeurs du bassin de <nom> » ; jamais « offres » ni « tu trouveras » ; l'année toujours écrite | D-n (promesse) et R-n (texte de la fiche) | S2, moyenne | « Ça recrute » sans nombre ni année (trompeur) ; « N offres » (faux) |
| P-3 | Une commune sans chiffre pour le métier choisi (case masquée ou absente) : un état à part, « pas de chiffre publié pour ce métier », sans le présenter comme zéro ; ce que fait le filtre dans ce cas est un choix produit | D-n (donnée manquante) et R-n | S2, faible | Traiter l'absence comme 0 (non documenté) ; la cacher |
| P-4 | Le choix du métier : les 217 métiers sont trop nombreux pour une liste, et 8 familles trop larges. Mesurer en tâche 0 la couverture des métiers de la cible au niveau métier et au niveau des 81 groupes, puis trancher en `/ui` (recherche dans la liste, ou deux niveaux) | D-n (granularité), `/ui`, tâche 0 | S1 et S2, moyenne pour les comptes | Les 8 familles seules (trop larges) ; les 217 en liste plate |
| P-5 | Maille : toutes les communes d'un bassin ont le même chiffre ; la fiche nomme le bassin ; Paris, Lyon et Marseille d'un seul tenant (un bassin chacune) | R-n et H-n | S1, moyenne | Répartir par commune (aucune donnée pour le faire) |
| P-6 | Le risque, à écrire et à tester à la démo : pas l'État (enseignants, fonction publique), saisonniers inclus ; Vincent juge 3 métiers de ses testeurs dans 5 bassins connus | « Le risque », FAQ | S2, moyenne | — |
| P-7 | Mention : « Projets de recrutement : France Travail, enquête Besoins en main-d'œuvre 2026 » (texte exact fixé en tâche 0, avec la licence de la table des bassins) | R-n (mentions), `Mentions.tsx` | S1, moyenne | — |
| P-8 | Tâche 0 : additionner les lignes des comités locaux d'un même bassin ; recaler les 12 codes de communes ; joindre Paris, Lyon et Marseille par leurs arrondissements ; compter les trous par métier et par groupe pour les métiers des testeurs | Tâche 0 de `/breakdown` | Mesures, moyenne | — |

## Ce qui reste ouvert
- Le sens d'une case absente (« aucun projet » ou « non publié ») et le seuil du secret statistique : non documentés. Pour trancher : en tâche 0, regarder si les absences tombent sur les petits bassins ; sinon, une question au producteur, posée par Vincent.
- Les métiers exacts de tes 3 testeurs : ils permettraient de mesurer la couverture qui compte vraiment pour eux.
- La licence de la table commune → bassin.

## Contradictions et désaccords
- Le chercheur jugeait ambigu le millésime du rapport « BMO2024 » de la Banque des Territoires (annexe titrée 2021). Le vérificateur montre que c'est bien le rapport 2024 : le « 2021 » n'est qu'un filigrane. Ce rapport est une copie d'un rapport France Travail et n'est pas utilisé ici.
- Le chercheur parlait d'une rupture de série sur toute la nomenclature. Le vérificateur ne la trouve que sur deux métiers. Sans effet ici : on n'utilise qu'un millésime.
- Le chercheur disait que la page bmopub mentionne la note sur le secret statistique : introuvable pour le vérificateur.
- Mesures de Claude : Lyon avait été rangée dans 3 bassins. C'est un seul (8428), relevé par le vérificateur et recontrôlé.

## Tests à la main de Vincent
Aucun.

## Coût
Début 13:31 · fin 13:44 · 2 agents · par agent :
- studio:researcher (donnees) — 175 s — 72 287 tokens — 26 appels (budget 20)
- studio:verifier (spot-check + tous les faits de S1) — 137 s — 66 176 tokens
- Claude : lecture directe des deux fichiers xlsx et mesures (≈ 12 appels).
