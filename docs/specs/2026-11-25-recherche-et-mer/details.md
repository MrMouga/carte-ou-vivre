# Détails — Recherche et mer en minutes
Lire d'abord [spec.md](spec.md) (décisions D-n). Cette tranche étend loyer-mer (R1 à R8), interface-telephone (R19, R20) et cadre-de-vie (R28, R30, R31) ; elle reprend la mer en minutes que proches avait reportée (D9, D14 là-bas). Les règles commencent à R58, les hypothèses à H177.

## Parcours
1. Il ouvre `/` et tape « grand » dans « Chercher une commune » : « Grandeville (33) » est proposée.
2. Il la choisit : la carte se cadre sur Grandeville et sa fiche s'ouvre, avec ses raisons de passer ou non. L'adresse de la page ne change pas.
3. Il tape « 99100 » : deux communes partagent ce code, les deux sont proposées.
4. Dans « Cadre de vie », il coche « 30 min » dans « Mer à moins de » : carte, liste, fiche et adresse se mettent à jour (`mer-min=30`).
5. Il ouvre la fiche de Grandeville : « 50 min de la mer en voiture ».

## Écrans et états
### Carte — route `/` · dans l'URL : en plus de services R55, `mer-min` à la place de `mer` (R60, D9) ; ni la saisie ni la commune choisie (H185)
Zones touchées (les autres restent celles des tranches précédentes) : **recherche** — champ « Chercher une commune », liste de suggestions (place : H177) · **réglages** — dans « Cadre de vie », pastilles de la mer en minutes (R60) · **liste** — dernière colonne en minutes (R62) · **fiche** — ligne du temps jusqu'à la mer (R63) · **pied de page** — deux mentions (R63).

Recherche :
- **vide** (départ, ou après « Effacer la recherche ») → le champ montre « Nom ou code postal » ; aucune suggestion.
- **trop court** (1 caractère) → aucune suggestion et aucun message.
- **suggestions** (≥ 2 caractères, au moins une commune) → les suggestions de R58 ; sort vers **choisie** (clic, Entrée), **vide** (Échap deux fois, H186) ou un autre état en tapant.
- **aucune** → « Aucune commune ne correspond. » ; sort en tapant.
- **chargement des codes** (chiffres tapés avant que les codes postaux soient là, H187) → « Chargement des codes postaux… » ; sort vers **suggestions**, **aucune** ou **codes indisponibles**.
- **codes indisponibles** → une saisie en chiffres montre « Codes postaux indisponibles. Cherche par nom ou réessaie dans un moment. » ; la recherche par nom marche ; nouvel essai à la prochaine prise de focus (H187).
- **choisie** → le champ montre « Grandeville (33) » et « Effacer la recherche » ; suggestions fermées ; la fiche est ouverte (R59). Liens avec la fiche : H184.

Mer (« Mer à moins de ») : pastilles « 15 min », « 30 min », « 1 h », « 1 h 30 » (R60), à la place des km de R28 de cadre-de-vie ; aucune bascule (D5 révisée).

États de la page (chargement, erreur, classée, aucune commune, sans plafond, fond indisponible) et leurs textes : inchangés (D8 de cadre-de-vie). La recherche marche dans classée, aucune commune, sans plafond et fond indisponible ; pendant chargement et erreur, le champ est inactif comme les réglages (H188).

Interactions : chaque frappe → suggestions à jour en ≤ 100 ms, sans délai d'attente (H179) · choisir une suggestion → fiche ouverte et cadrage lancé en ≤ 100 ms · pastille de la mer → carte, liste, fiche et adresse à jour dans le budget déjà accepté pour une pastille de la mer (H90 de cadre-de-vie : 149 à 164 ms), pas au-delà.

## Règles
- **R58** — Recherche (D2, D3). Dès 2 caractères, une saisie qui contient une lettre cherche par nom (normalisation et correspondance : H180) ; une saisie de 2 à 5 chiffres, espaces retirées, cherche par code postal ; toute autre saisie donne **aucune** (H181). Par nom ou par début de code (2 à 4 chiffres) : 8 suggestions au plus. Par code complet (5 chiffres) : toutes les communes de ce code, dans une liste qui défile. Chaque commune n'apparaît qu'une fois. Suggestion : « Grandeville (33) » par nom ; « 33991 · Grandeville (33) » par code, avec le plus petit de ses codes qui correspondent (H183). Ordre : population décroissante, puis nom, puis code INSEE (H182). Paris, Lyon et Marseille portent les codes de leurs arrondissements (« 75015 · Paris (75) »). Aucune → « Aucune commune ne correspond. ». Rien de ce qui est tapé ne part vers un autre site que le site lui-même. *Pourquoi* : D2, D3.
- **R59** — Choisir une suggestion (D3). Au clic ou à l'Entrée, la commune est choisie comme si on l'avait choisie sur la carte ou dans la liste : même cadrage de la carte, fiche ouverte (à 390 px, dans la feuille, R19 d'interface-telephone), dans tous les états de la page où le champ est actif, qu'elle passe ou non. Le champ passe à **choisie**. L'adresse de la page ne change pas (H185). *Pourquoi* : D3.
- **R60** — Mer en minutes (D5 révisée, D6, D9). « Mer à moins de » propose 15, 30, 60 et 90 min (« 15 min », « 30 min », « 1 h », « 1 h 30 »), Cases collées comme aujourd'hui (aucune cochée = Peu importe) ; plus de choix en km ni de bascule. Adresse : `mer-min` vaut `15`, `30`, `60` ou `90` ; toute autre valeur donne Peu importe et disparaît de l'adresse réécrite ; `mer` (ancien lien, en km) est ignoré et disparaît de l'adresse réécrite (D9). *Pourquoi* : D5 révisée, D6, D9.
- **R61** — Temps d'une commune jusqu'à la mer (D4, D7, D8). C'est le temps en voiture, sans embouteillages (H194), de sa mairie (D18 de loyer-mer) au point de côte qui donne ses km (D8 de loyer-mer), par la route la plus rapide, arrondi à la minute (H191). Il s'affiche et se compare ainsi : « moins d'1 min » (comparé comme 1 min), « 50 min », « 1 h 05 », « 2 h 40 ». Une commune **sans temps** (causes : H196) prend ses km affichés comme minutes (1 km = 1 min ; « moins d'1 km » = 1 min), écrits « ≈ 7 h » (H192). Une commune sans km ni temps a une mer inconnue : elle ne passe pas un choix de mer, avec la raison et la colonne de liste d'aujourd'hui (aucune en métropole). *Pourquoi* : D4, D7, D8.
- **R62** — Filtre, note, liste et raisons en minutes (D6). En « min », un choix laisse passer une commune si son temps (R61) est inférieur ou égal au choix, avec la note 100 × (1 − temps / choix) (R2 de loyer-mer, même arrondi). La dernière colonne de la liste est ce temps (« 5 min », « ≈ 7 h »), toujours, même sur Peu importe (remplace les km de R5 de loyer-mer et de H77 de cadre-de-vie). Raison : « Mer 2 h 40 : au-dessus de ton plafond de 1 h » ; sans temps : « Mer ≈ 7 h : au-dessus de ton plafond de 1 h » ; ordre des raisons inchangé (H83 de cadre-de-vie). *Pourquoi* : D6.
- **R63** — Fiche et mentions (D2, D4, D5 révisée, D7). À la place de la ligne de la mer en km (R4 de loyer-mer), la fiche montre « 50 min de la mer en voiture », « moins d'1 min de la mer en voiture » ou, sans temps, « Temps en voiture jusqu'à la mer inconnu : compté 7 h d'après les km », puis la ligne de la montagne (R30 de cadre-de-vie). Quand la mer est inconnue, la ligne d'aujourd'hui (« Distance à la mer inconnue ») reste. Le pied de page ajoute « Codes postaux : La Poste, base officielle des codes postaux » (avec la date du fichier, fixée en tâche 0) et « Temps jusqu'à la mer : calculés avec openrouteservice, © OpenStreetMap contributors » ; ces deux textes sont aussi reportés dans les mentions obligatoires de CLAUDE.md. *Pourquoi* : D5 ; Licence Ouverte (citer la source) et conditions d'openrouteservice.

## Cas limites
- Homonymes (« Saint-Denis ») → plusieurs suggestions, distinguées par le département, la plus peuplée d'abord (R58, AC-12).
- Un code complet partagé par 12 communes → les 12, dans une liste qui défile ; un début de code → 8 (AC-13). Le plus grand nombre de communes par code est compté en tâche 0.
- Code postal d'outre-mer, de Monaco, ou d'une commune absente de la carte → aucune suggestion pour lui.
- La base de La Poste et la carte ne sont pas sur la même géographie (COG 2025 pour la carte) : un code rattaché à un code INSEE absent du COG 2025 est recalé par les mouvements du COG (`v_mvt_commune_2026`, déjà utilisé par emploi), dans les deux sens — un ancien code vers la commune qui l'a remplacé ; une commune créée après 2025 vers les communes 2025 qui la composent. Comptés en tâche 0 ; plus de 20 communes de la carte sans aucun code → retour à Vincent (leçon du 2026-11-21).
- Licence de la base : Licence Ouverte 2.0 d'après data.gouv.fr (lue le 2026-11-25) ; relue et datée en tâche 0, avant tout fichier servi.
- Saisie mêlant lettres et chiffres (« 33 bordeaux ») → recherche par nom : en général **aucune**. « 33 000 » = « 33000 » ; « 330000 », « -- » → **aucune** (H181).
- Une commune que les tuiles ne dessinent pas au zoom courant → le cadrage de R59 l'amène à un zoom où elle est dessinée (comme un choix dans la liste).
- `/?loyer=1200&mer-min=50` → Peu importe ; adresse réécrite `/?loyer=1200` (AC-7). `/?loyer=1200&mer=30` (ancien lien en km) → Peu importe, adresse `/?loyer=1200` (D9, AC-10).
- Estuaire : le point de côte des km peut être sur l'autre rive ; le temps compte le détour par le premier pont (D4). Un temps jugé faux à la confrontation est retiré (D8).
- Île sans pont → le temps de la route de l'île, s'il y en a une ; sinon **sans temps** (H196).
- Paris, Lyon, Marseille → le temps depuis la mairie de la ville entière (D10 et D18 de loyer-mer).

## Impact sur les tranches existantes
| Tranche | Élément (écran, zone, règle, décision) | Inchangée / Étendue / Contredite | Action |
|---|---|---|---|
| loyer-mer | D8 et D20 (3) : la mer à vol d'oiseau, les minutes « en option » attendues | Contredite (D5 révisée) | les km servent encore à trouver le point de côte (D4) et au repli (D7), mais ne s'affichent plus ; à la validation du design, ajouter à D20 de loyer-mer « remplacé par les minutes seules, recherche-et-mer D5 révisée (2026-11-25) » |
| loyer-mer | R1, R2 : raisons et note de la mer | Étendue | en minutes (R62) |
| loyer-mer | R4, contenu de la fiche | Contredite (D5 révisée) | la ligne des km devient celle du temps (R63) |
| loyer-mer | R5, ligne de la liste | Contredite (D5 révisée) | dernière colonne en minutes, toujours (R62) |
| loyer-mer | R7, H7, H17 : adresse | Contredite (D9) | `mer` ignoré, `mer-min` à sa place (R60) |
| loyer-mer | Exceptions, accessibilité : « une commune hors du top 10 ne s'atteint qu'à la souris ou au doigt, jusqu'à la recherche par nom » | Étendue | la recherche lève l'exception (toute commune s'atteint au clavier) : à la validation, l'écrire sous l'exception de loyer-mer |
| loyer-mer, services | Pied de page (R56 de services : 7 lignes en bureau, qui couvrent déjà le bas de la carte, défaut « Moyen » de la QA de services) | Étendue | deux mentions de plus (R63) ; en bureau, toutes les mentions passent en bas du panneau de réglages, plus rien sur la carte (piste C, choisie par Vincent en /ui : la présentation des mentions obligatoires est sa décision) ; corrige le défaut « Moyen » |
| interface-telephone | R19, choisir une commune ouvre sa fiche | Étendue | aussi depuis la recherche (R59) |
| interface-telephone | R16 et AC-1 (vue de départ), R17 et H48, D11 (feuille d'au moins 338 px, curseur du prix visible à 375 × 548, test hors AC de H48) | Inchangée | mesuré en /ui (piste C) : la loupe n'ajoute aucune hauteur, curseur du prix à 537 px sur 548, carte inchangée |
| interface-telephone | R18, contenu de l'onglet « Critères » | Inchangée | la loupe est au bout de la rangée des onglets, hors des onglets (H177) |
| interface-telephone | R20 et D7 (champ au-dessus du clavier de l'iPhone) | Étendue | le champ de recherche suit la même règle (H177) |
| proches | D9, D14 ; R14, H23, H25, H27 ; critères reportés AC-12, AC-13, AC-15 ; `mer_min` de sa fixture | Contredite | **amender proches d'abord**, D19 proposée ci-dessous |
| proches | R9, champ d'adresse d'un proche | Inchangée | un deuxième champ de recherche existe : les tests qui prennent un champ par son rôle doivent le nommer (à vérifier en /breakdown) |
| cadre-de-vie | R28, mer en 4 choix en km | Contredite (D5 révisée) | 4 choix en minutes (R60) |
| cadre-de-vie | R30, ordre des lignes de la fiche | Étendue | temps de la mer, puis montagne (R63) |
| cadre-de-vie | R31, adresse | Contredite (D9) | `mer-min` à la place de `mer` (H193) |
| cadre-de-vie | H69, pastilles ; H75, résumé replié ; H76, noms pour les lecteurs d'écran | Contredite (D5 révisée) | pastilles en minutes ; résumé « Mer 30 min » ; plus de groupe « Unité de la mer » |
| cadre-de-vie | H77, dernière colonne de la liste | Contredite (D5 révisée) | R62 |
| cadre-de-vie | H90, réaction d'une pastille de la mer (149 à 164 ms, accepté) | Inchangée | les pastilles en minutes tiennent le même budget, pas au-delà |
| cadre-de-vie | D8, textes des états vides | Inchangée | — |
| emploi | R44 et H133, recherche du métier | Inchangée | la normalisation de H180 est propre à cette recherche |
| immobilier, proches-fiables, mairies | toutes leurs règles | Inchangée | — |
| toutes | 58 critères de 7 tranches qui lisent la mer en km (lignes de liste, fiche, raisons, adresse `mer=`) | Contredite (D5 révisée, D9) | **recalage en tâche de /breakdown**, chaque réécriture avec l'accord de Vincent : [criteres-a-recaler.md](criteres-a-recaler.md) |
| proches | D19 (validée le 2026-11-25) : AC-15 de proches remplacé par AC-10 d'ici | Contredite | AC-10 teste désormais les anciens liens (D9) : AC-15 de proches est remplacé par AC-6 et AC-10 ensemble, à écrire dans D19 de proches au recalage |
| services | D14 et R57 (chargement après la carte) | Inchangée | les temps de la mer arrivent avec les autres données de la commune si H195 tient |

**D19 proposée pour proches** (à valider avec cette spec) : « La mer en minutes est reprise par la tranche [recherche-et-mer](../2026-11-25-recherche-et-mer/spec.md) (D4 à D8 là-bas), avec des pastilles et non plus un curseur. R14, H23, H25, H27 renvoient vers ses R60 à R63 ; « la mer en minutes (D14) » sort de « Pas maintenant ». AC-12, AC-13 et AC-15 passent de la liste « reportes » à « remplaces », remplacés par AC-6, AC-8 et AC-10 de recherche-et-mer ; les `mer_min` de la fixture de proches sont remplacés par ceux de recherche-et-mer (identiques pour Portmer, Grandeville, Montcher, Terrebasse et Quaibleu). *Pourquoi* : le curseur de mer n'existe plus depuis D4 de cadre-de-vie. *Écarté* : garder des critères reportés qui ne pourront jamais passer. »

## Ne change pas
*Amendé le 2026-11-25 par /ui (D5 révisée) :* sans recherche faite, les critères des tranches passées qui ne lisent pas la mer en km (la liste de ceux qui la lisent : [criteres-a-recaler.md](criteres-a-recaler.md)) : loyer-mer AC-1 à AC-15 ; interface-telephone AC-1 à AC-11 et le test hors AC de H48 (375 × 548) ; proches AC-1 à AC-9, AC-11, AC-14, AC-16 ; immobilier AC-1 à AC-14 ; cadre-de-vie AC-1 à AC-12 ; proches-fiables AC-1 à AC-12 ; mairies AC-1 à AC-12 ; emploi AC-1 à AC-14 ; services AC-1 à AC-17.

## Hypothèses
- **H177** — *Révisée en /ui le 2026-11-25 (piste C, choisie par Vincent) :* en bureau, une loupe « Chercher une commune » à droite du titre « Où vivre en France » ; touchée, le champ prend la place du titre (le titre reste lu par les lecteurs d'écran) avec « Annuler » à sa droite, les suggestions dans le flux du panneau, la population en sous-texte de chaque suggestion. Au téléphone, une loupe au bout de la rangée des onglets ; touchée, la feuille monte (R20 d'interface-telephone) et le champ avec ses suggestions remplace tout sous la poignée, « Annuler » à droite ; fiche ouverte, la loupe est dans la tête de la feuille. Rien n'ajoute de hauteur au repos : AC-1 et H48 d'interface-telephone tiennent (mesuré : curseur du prix à 537 px sur 548). Écarté : champ toujours visible (A en bureau ; B au téléphone, qui casse AC-1 : 158 px de carte à 375 × 548).
- **H178** — décidé par Claude : libellé « Chercher une commune » (nom de la loupe et du champ), texte dans le champ « Nom ou code postal ». Écarté : « Rechercher ».
- **H179** — Dès 2 caractères ; 8 suggestions au plus par nom ou par début de code ; à jour ≤ 100 ms après chaque frappe, sans délai d'attente (les noms sont sur la page).
- **H180** — décidé par Claude : sans tenir compte des majuscules, des accents ni des ligatures (« œ » = « oe », « æ » = « ae ») ; tirets, apostrophes et points valent une espace. Une commune correspond si la saisie commence au début de son nom ou d'un de ses mots (« olonne », « les sables » trouvent « Les Sables-d'Olonne ») ; « st » et « ste », quand ils forment un mot entier de la saisie, valent aussi « saint » et « sainte » (« st » trouve Saint-Denis et Stenay). Propre à cette recherche. Écarté : n'importe où dans le nom (« ville » trouverait des milliers de communes).
- **H181** — Une saisie de plus de 5 chiffres, ou sans lettre ni chiffre, donne **aucune** ; les espaces d'un code sont retirées (« 33 000 » = « 33000 »).
- **H182** — décidé par Claude : suggestions par population décroissante. Écarté : les noms qui commencent par la saisie d'abord.
- **H183** — décidé par Claude : une suggestion par code s'écrit « 33991 · Grandeville (33) ». Écarté : le nom seul.
- **H184** — décidé par Claude, amendée en /ui (piste C) : après le choix, le champ se ferme ; rouvert par la loupe, il montre « Grandeville (33) » et « Effacer la recherche » tant que la commune reste choisie ; fermer la fiche ne vide pas le champ ; « Effacer la recherche » ne ferme pas la fiche ; choisir une commune ailleurs (carte, liste) vide le champ ; « Annuler » ferme le champ et rend le focus à la loupe. Écarté : vider le champ au choix.
- **H185** — décidé par Claude : la commune choisie n'entre pas dans l'adresse de la page, comme un choix sur la carte aujourd'hui. Écarté : `commune=` dans l'adresse (avec le partage, plus tard).
- **H186** — Clavier : flèches haut et bas parcourent les suggestions, Entrée choisit, Échap ferme les suggestions puis, une seconde fois, vide le champ ; le nombre de suggestions est annoncé aux lecteurs d'écran (« 2 suggestions »).
- **H187** — décidé par Claude : les codes postaux se chargent à la première prise de focus du champ, pas à l'ouverture de la page ; une demande, un nouvel essai aussitôt en cas d'erreur, **codes indisponibles** après une seconde erreur ou 10 s sans réponse ; nouvel essai à la prochaine prise de focus. Écarté : à l'ouverture (du poids pour tous).
- **H188** — Pendant les états **chargement** et **erreur** de la page, le champ est inactif, comme les réglages ; avec le fond indisponible, il marche.
- **H189** — *Retirée (D5 révisée en /ui le 2026-11-25 : plus de bascule).*
- **H190** — *Retirée (D5 révisée en /ui le 2026-11-25 : plus de bascule).*
- **H191** — Temps arrondi une seule fois, à la minute, moitié vers le haut, et servi entier : la valeur affichée est celle comparée (leçon du 2026-10-15). Formats : 0 → « moins d'1 min », « 5 min », « 1 h », « 1 h 05 », « 2 h 40 », « 7 h ».
- **H192** — décidé par Claude : un temps compté d'après les km s'écrit avec « ≈ » dans la liste et les raisons (« ≈ 7 h »). Écarté : sans signe (laisserait croire à un temps calculé).
- **H193** — Ordre de l'adresse : prix, `mer-min`, `montagne`, puis l'ordre de R31 de cadre-de-vie et des tranches suivantes.
- **H194** — Le temps est celui du réseau routier, sans embouteillages ni heure de départ ; l'écran dit seulement « en voiture » (comme H24 de proches).
- **H195** — Poids, mesuré avec la compression de l'hébergeur (leçon du 2026-11-24) : les temps de la mer arrivent avec les autres données de la commune, à l'ouverture, s'ils ajoutent 60 Ko compressés au plus ; les codes postaux, 200 Ko compressés au plus. Au-delà, retour à Vincent (pour la mer : un fichier à part, chargé après la carte comme R57 de services). *Estimation de Claude* (mesure faite le 2026-11-25 : deux colonnes de minutes inventées ajoutaient 123 Ko en gzip, soit environ 60 Ko pour une).
- **H196** — Une commune est **sans temps** quand : aucune route n'est trouvée près de son point de côte (rayon fixé en tâche 0) ; aucune route ne relie sa mairie à ce point (île sans pont) ; le calcul échoue après un nouvel essai ; ou son temps est retiré (D8, table de retraits avec preuve, comme `services-retraits.csv`). Leur nombre par cause est compté en tâche 0.

## Recommandations de la recherche
Pas de recherche pour cette tranche (choix de Vincent le 2026-11-25).

## Exceptions
Aucune. (La recherche lève une exception de loyer-mer : voir l'impact.)

## Vérification de bout en bout
Sur la version construite (`npm run build`, `npx vite preview`), données réelles, en bureau (1 280 × 800) puis à 390 × 844 :
1. Taper « auch », choisir « Auch (32) » : la carte est cadrée sur Auch, la fiche s'ouvre ; l'adresse ne change pas.
2. Taper « 33000 » : « 33000 · Bordeaux (33) » ; la choisir ; taper « 01300 » : toutes les communes du code, dans une liste qui défile.
3. Taper « les sables », « st etienne », puis « 75015 » : « Les Sables-d'Olonne (85) », « Saint-Étienne (42) » en tête, puis « 75015 · Paris (75) ».
4. Cocher « 30 min » : l'adresse finit par `mer-min=30` ; Bordeaux ne passe pas, Caen passe ; la fiche de Bordeaux dit son temps en voiture (relevé en tâche 0) et aucun km de mer.
5. Ouvrir `/?loyer=1200&mer=30` (ancien lien) : la mer est sur Peu importe, l'adresse devient `/?loyer=1200`.
6. Pendant les étapes 1 à 3, aucune requête vers un autre site que le site lui-même.
Preuves : captures de chaque étape aux deux largeurs, adresse de la page à chaque étape, liste des requêtes de l'étape 6.
