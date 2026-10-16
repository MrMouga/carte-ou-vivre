# Détails — proches fiables
Lire d'abord [spec.md](spec.md) (décisions D1 à D6), puis la tranche [proches](../2026-10-13-proches/details.md), que celle-ci étend et révise (D18 de proches). Les règles R9 à R15 et les hypothèses H19 à H40 de proches restent valables sauf là où le tableau d'impact ci-dessous les dit étendues ou contredites ; ici, les règles commencent à R33 et les hypothèses à H92. Révisé le 2026-10-16 après [relecture.md](relecture.md) et un second avis apporté par Vincent (repli selon le plafond choisi, « jusqu'à », trois états, 15 min entre deux essais automatiques).

Vocabulaire : une **zone** est la zone de temps que l'IGN rend pour une durée (15 min, 30 min… 3 h, 12 zones par proche). La **tranche** d'une commune est la plus petite zone qui contient sa mairie (R10 de proches). La **couverture** d'un calcul est sa plus grande zone obtenue (0 si aucune). Un proche est **prêt** (12 zones), **partiel** ou **km** ; **partiel** et **km** sont dits **approximatifs**. Partout où une tranche existante dit « proche prêt » (il compte dans le score, il sort la page de l'état **sans plafond**, il note une commune sans prix), lire « proche prêt ou approximatif, y compris en **recalcul** » (D5).

## Parcours
1. L'utilisateur ajoute un proche (R9 de proches) ; « Calcul des trajets depuis Parents de Léa… » s'affiche comme aujourd'hui.
2. L'IGN rame : une zone en erreur est redemandée une fois (R33). Au plus tard 45 s après le début du calcul, le proche compte avec ce qu'on a : prêt, partiel (R34) ou km (R35).
3. Il règle le plafond du proche (en heures, ou en km pour un proche en km) : la carte se recolore sans nouveau calcul.
4. Il rouvre le site plus tard : un proche approximatif est recalculé en tâche de fond et devient prêt si l'IGN répond (R36).

## Écrans et états
### Carte — route `/` · dans l'URL : rien de plus (les proches n'y sont jamais, D7 de proches)
Zones touchées : **Tes proches** (ligne d'un proche, son curseur, le résumé replié), **fiche** (lignes et raisons des proches), **pastilles** (bureau). Les autres zones ne changent pas.

États d'un proche (remplacent ceux de proches ; **indisponible** disparaît, D5) :
- **en attente** → inchangé (« En attente… », « Retirer ») ; sort vers **calcul**.
- **calcul** → inchangé (« Calcul des trajets depuis Parents de Léa… », « Retirer ») ; ne compte pas encore ; sort, au plus tard 45 s après son début, vers **prêt**, **partiel** ou **km** (R33).
- **prêt** (12 zones) → inchangé : nom, adresse, plafond de 15 min à 3 h, « Retirer ».
- **partiel** (des zones manquent, et la couverture atteint au moins le plafond) → comme **prêt**, plus « Recalculer avec l'IGN », et selon le cas : « Temps approximatifs : l'IGN n'a pas tout donné. » (une zone au moins manque sous la couverture), puis « Au-delà de 2 h 45 : l'IGN n'a pas répondu. » (couverture sous 3 h, avec sa durée), le curseur s'arrêtant alors à la couverture ; sort vers **recalcul**.
- **km** (couverture sous le plafond, ou aucune zone) → nom, adresse, « À vol d'oiseau : l'IGN ne répond pas. », curseur en km (« 120 km au plus »), « Recalculer avec l'IGN », « Retirer » ; sort vers **recalcul**.
- **recalcul** (à l'ouverture, ou après « Recalculer avec l'IGN » ; aussi pendant qu'il attend son tour) → l'état d'avant reste affiché et compte, avec « Recalcul avec l'IGN… » à la place du lien ; le curseur reste réglable ; sort vers le nouvel état s'il est plus complet (H97), sinon vers l'état d'avant, sans autre message.

Résumé de « Tes proches » repliée (H34 de proches) : « 3 · 1 en calcul, 1 approximatif », « 4 · 2 approximatifs » — **partiel** et **km** comptent comme « approximatif » ; un proche en **recalcul** compte selon l'état affiché.

Fiche, ligne d'un proche (sous la mer, ordre d'ajout ; remplace « trajets indisponibles ») :
- **partiel**, commune dont la zone juste dessous manque : « Nantesville (44) : jusqu'à 2 h 30 en voiture » ; les autres communes gardent « 1 h en voiture ».
- **partiel**, commune hors de la couverture : « Nantesville (44) : plus de 2 h 45 en voiture ».
- **km** : « Rochelleville (17) : 88 km à vol d'oiseau ».
Raisons de l'état **commune qui ne passe pas**, à la place de celle du proche : « Nantesville (44) jusqu'à 2 h 30 : au-dessus de ton plafond de 2 h 15 » ; « Nantesville (44) plus de 2 h 45 : au-dessus de ton plafond de 2 h » ; « Rochelleville (17) 118 km : au-dessus de ton plafond de 90 km ».

Pastilles (R15 de proches), bureau : sans commune choisie, « Rochelleville (17) · 90 km au plus » pour un proche en km, et comme aujourd'hui sinon ; avec une commune choisie, sa valeur telle que la fiche l'écrit (« jusqu'à 2 h 30 », « plus de 2 h 45 », « 88 km »), suivie de « · au-dessus de 2 h 15 » ou « · au-dessus de 90 km » quand elle dépasse. Le petit repère d'une pastille d'un proche approximatif est celui d'un proche prêt (H99).

Interactions : curseur d'un proche (heures ou km) → carte, liste, fiche et pastilles à jour, budget de H9, aucun calcul · « Recalculer avec l'IGN » → **recalcul** · « Retirer » pendant **recalcul** → le proche disparaît, son calcul s'arrête ou ne part pas.

## Règles
- **R33** — Essais et fin du calcul (D1, D3). Une zone en erreur (erreur du service, refus, réseau) est redemandée une fois (H92) ; une zone sans réponse n'est pas redemandée. Le calcul s'arrête dès que chaque zone a répondu ou échoué deux fois, et au plus tard 45 s après son début (H21 de proches) : une zone sans réponse à ce moment manque. Le proche prend alors l'état **prêt** si les 12 zones ont répondu ; sinon **km** si la couverture est sous son plafond (2 h à l'ajout, H19 de proches ; pour un proche en km, son plafond ÷ 60, H94), **partiel** si elle l'atteint. *Pourquoi* : D1, D3 ; un plafond choisi n'est jamais baissé.
- **R34** — Valeurs d'un proche partiel (D2). Une commune dont la tranche est une zone obtenue garde la fin de cette tranche ; si la zone juste dessous manque, sa valeur est la même mais s'écrit « jusqu'à 2 h 30 ». Une commune hors de la couverture vaut « plus de <couverture> » et ne tient aucun plafond. Le plafond va de 15 min à la couverture. Ces valeurs sont comparées et notées comme celles d'un proche prêt (R11 de proches) ; « jusqu'à 2 h 30 » compte pour 2 h 30. *Pourquoi* : D2 ; jamais sous-estimé plus qu'avant (D16 de proches), surestimé de 15 min de plus par zone manquante sous la zone obtenue (une seule manquante : 30 min au plus).
- **R35** — Repli à vol d'oiseau (D3). La valeur d'une commune est la distance à vol d'oiseau du point de départ du proche à sa mairie (D18 de loyer-mer), au km (H3 de loyer-mer), « moins d'1 km » comparée comme 1 km. Le plafond va de 15 à 180 km par pas de 15 km ; à l'entrée en repli, il vaut le plafond en heures × 60 km (H94), quelle que soit sa valeur (45 min → 45 km, 3 h → 180 km). Une commune tient le proche si sa distance est ≤ au plafond ; la note vaut 100 × (1 − distance / plafond). *Pourquoi* : D3.
- **R36** — Réouverture et recalcul (D4). Pour chaque proche, ce navigateur garde en plus de R12 de proches : son état (**prêt**, **partiel**, **km**), ses zones obtenues, les communes en « jusqu'à », son plafond dans son unité (minutes ou km) et l'heure de son dernier essai ; un proche **km** n'a pas de temps gardés. À l'ouverture du site, chaque proche **partiel** ou **km** dont le dernier essai date de 15 min au moins passe en **recalcul**, dans l'ordre d'ajout, par le calcul de R33 ; « Recalculer avec l'IGN » le fait à tout moment. Un proche ajouté passe devant les recalculs pas encore commencés ; le calcul en cours continue. Un proche **prêt** dont chaque code INSEE de la carte a un temps n'est jamais recalculé (AC-8 de proches). Le nouveau résultat remplace l'ancien s'il est plus complet (H97) ; le plafond affiché à ce moment passe alors des km aux heures (km ÷ 60, H94) ou reste en heures. Sinon l'état affiché ne change pas. Dans les deux cas, l'heure du dernier essai est mise à jour à chaque essai, gardé ou non. À l'ouverture, la file suit l'ordre d'ajout, proches de R37 compris ; un « Recalculer avec l'IGN » passe, comme un ajout, devant les recalculs automatiques pas encore commencés. *Pourquoi* : D4.
- **R37** — Proches gardés incomplets, quelle que soit la version qui les a gardés (D5). Un proche gardé **indisponible** (version d'avant cette tranche), **en attente**, fermé pendant son **calcul**, ou, pour un proche en heures, dont un code INSEE de la carte n'a pas de temps (R12 de proches ; un proche **km** a toujours une valeur), est calculé à l'ouverture comme un nouveau proche (**calcul**, puis R33), avec son nom et son plafond, sans attendre 15 min. Un proche gardé **prêt** par la version d'avant revient **prêt**, sans calcul. *Pourquoi* : D5 ; le site est en ligne, des proches sont déjà gardés.

## Cas limites
- Zone en erreur puis qui répond au second essai → **prêt**, aucune trace d'approximation (AC-1).
- Zone de 2 h 15 ratée, celle de 2 h 30 obtenue → Grandeville (tranche 2 h 15) et Montcher, Terrebasse (2 h 30) disent toutes « jusqu'à 2 h 30 » : rien ne les distingue sans la zone manquante (AC-2).
- Couverture égale au plafond → **partiel** (AC-6) ; un pas de 15 min en dessous → **km** (AC-6, AC-12).
- Plafond bas et grandes zones ratées (plafond 45 min, couverture 1 h 45) → **partiel**, pas de km (AC-6).
- Plafond en km au maximum (180 km) et l'IGN revient à 2 h 45 → le proche reste en km : 3 h n'est pas vérifiée (AC-12).
- Commune sans route (île) : en heures, « plus de 3 h » ou « plus de <couverture> » comme avant ; en km, sa distance à vol d'oiseau, sans exception.
- L'IGN échoue encore à la réouverture → un proche **partiel** ne passe pas en **km**, un proche **km** reste en km ; nouvel essai à l'ouverture suivante, 15 min au moins après (AC-8).
- Recalculs en cours et nouveau proche ajouté → il passe devant les recalculs pas encore commencés (AC-11).
- Curseur bougé pendant un **recalcul** → le plafond affiché quand le résultat arrive décide de l'état (R33) et de la conversion (R36).

## Impact sur les tranches existantes
| Tranche | Élément | Inchangée / Étendue / Contredite | Action |
|---|---|---|---|
| proches | D2 (IGN ; *Écarté* : le vol d'oiseau) | Étendue | l'IGN reste la source ; le vol d'oiseau devient le repli (D3) |
| proches | D5 (plafond de 15 min à 3 h) | Étendue | maximum abaissé à la couverture dans l'état **partiel** (R34) ; plafond en km de 15 à 180 km (R35) |
| proches | D10, R15 (pastilles) | Étendue | « 90 km au plus », « jusqu'à », « plus de <couverture> » |
| proches | D11, R10, H22 (temps et formats) | Étendue | « jusqu'à », « plus de <couverture> », km (R34, R35, H96) |
| proches | D15, D16 (3 h, précision) | Inchangée | D6 |
| proches | R11 (plafond, score, « chaque proche **prêt** ») | Étendue | un proche approximatif compte comme un prêt (D5) |
| proches | « États de la page » (**sans plafond**, message de **aucune commune** « avec au moins un proche prêt ») | Étendue | « prêt » se lit « prêt ou approximatif » (D5) |
| proches | « États d'un proche » (**indisponible**) et ligne de fiche « trajets indisponibles » | Contredite | D18 de proches → états et fiche d'ici |
| proches | R12 (ce qui est gardé ; « revient indisponible ») | Étendue et contredite | D18 de proches → R36 (ce qui est gardé en plus), R37 |
| proches | R13, 2ᵉ phrase (calcul raté → indisponible) | Contredite | D18 de proches → R33, R35 ; la panne de la recherche d'adresse ne change pas (AC-11 de proches) |
| proches | H21 (« au-delà de 45 s… indisponible » ; « à la réouverture, les proches sont prêts dès que la carte est chargée ») | Contredite pour ces deux phrases | D18 de proches → R33, R36 ; le reste de H21 (budgets, aucun calcul pour un plafond) ne change pas |
| proches | H32 (une zone ratée → tout indisponible, pas d'essai) | Contredite | D18 de proches → R33 |
| proches | H33 (« revient indisponible avec Réessayer ») | Contredite pour cette partie | D18 de proches → R37 ; « une entrée par proche » et « curseurs bloqués pendant le chargement » ne changent pas |
| proches | H34 (résumé replié) | Étendue | « approximatif » |
| proches | H38 (formats de la pastille) | Étendue | « jusqu'à », « plus de <couverture> », km |
| proches | Cas limite « commune sans route → plus de 3 h » | Étendue | en heures, inchangé ; en km, distance à vol d'oiseau (H102) |
| proches | H37 (petit repère « ! » d'une pastille) | Contredite | D18 de proches → H99 |
| proches | AC-10 (panne → « Trajets indisponibles ») | Contredite | D18 de proches : remplacé par AC-4 d'ici, gardé dans une liste « remplaces » |
| proches | Tests hors critères qui lisent « indisponible » ou « Réessayer » d'un proche | Contredite | réécrits selon R33 à R37 (règle fixée par /breakdown, validée avec le plan) |
| loyer-mer | R2 et D20 (« chaque proche prêt » note ; état **sans plafond** « et aucun proche prêt ») | Étendue | « prêt » se lit « prêt ou approximatif » (D5) |
| immobilier | R25 (une commune sans prix est notée par « mer, proche prêt ») | Étendue | idem |
| cadre-de-vie | état **sans plafond** (« aucun proche prêt ») | Étendue | idem |
| interface-telephone | R17 à R20 (feuille, onglets, ajout) ; H51 (une seule annonce) | Inchangée | les lignes de proche vivent dans l'onglet « Critères » ; aucune annonce nouvelle (H100) |
| interface-telephone, immobilier | « Ne change pas : Proches AC-1 à AC-11 » | Contredite (AC-10) | D18 de proches : se lit « AC-1 à AC-9, AC-11 » |
| loyer-mer, immobilier, cadre-de-vie | le reste | Inchangée | — |

## Ne change pas
Avec un IGN qui répond (fixtures actuelles) : loyer-mer AC-1 à AC-15 ; proches AC-1 à AC-9, AC-11, AC-14, AC-16 ; interface-telephone AC-1 à AC-11 ; immobilier AC-1 à AC-14 ; cadre-de-vie AC-1 à AC-12.

## Hypothèses
- **H92** — Le second essai d'une zone en erreur part dès son échec, dans la file commune (250 ms au moins entre deux demandes) ; après un refus (trop de demandes), il attend 5 s, le temps pendant lequel l'IGN bloque (constaté pendant la construction de proches).
- **H93** — Les 15 min de D4 se comptent depuis le début du dernier essai du proche ; pas d'intervalle qui s'allonge à chaque échec. *Durée proposée par Claude après le second avis, reprise dans D4.*
- **H94** — Conversion : 1 h = 60 km à vol d'oiseau, un pas de 15 min pour un pas de 15 km. Ce n'est qu'un plafond de départ : l'écran dit « km à vol d'oiseau », pas un temps ; pas de mesure du rapport. *Décidé par Claude.*
- **H95** — Distance à vol d'oiseau : sur la sphère de rayon 6 371 km, comme la mer et la montagne.
- **H96** — Formats : « jusqu'à 2 h 30 », « plus de 2 h 45 », « 88 km », « 120 km au plus », « moins d'1 km » (H3 de loyer-mer, H22 de proches).
- **H97** — « Plus complet » : **prêt** d'abord ; puis, entre deux **partiel**, celui qui a le plus de zones obtenues, et à égalité la plus grande couverture ; **km** en dernier. Ainsi un **partiel** à 3 zones ne remplace pas un **partiel** à 11 zones.
- **H98** — Le calcul en tâche de fond suit la même file (R36 pour la priorité) et le même délai de 45 s qu'un ajout ; la page ne bloque rien pendant ce temps, et la carte ne bouge pas quand le résultat arrive.
- **H99** — Le repère sur la carte et le petit repère de la pastille d'un proche approximatif sont ceux d'un proche prêt ; c'est la ligne, la fiche et la pastille qui disent l'approximation.
- **H100** — Les textes « Temps approximatifs… », « Au-delà de 2 h 45… », « À vol d'oiseau… » et « Recalcul avec l'IGN… » font partie de la ligne du proche, lue par les lecteurs d'écran ; aucune annonce nouvelle n'est ajoutée à la zone d'annonce de la page (H51 d'interface-telephone inchangée).
- **H102** — En km, une île ou la Corse est à sa distance à vol d'oiseau comme toute commune, même sans route : le repli ne connaît pas les routes, et l'écran dit « à vol d'oiseau ». *Décidé par Claude.*
- **H101** — Le point de départ d'un proche choisi par commune reste sa mairie (D6 de proches), y compris pour la distance à vol d'oiseau.
- **H103** — Le second essai d'une zone en erreur part hors du cache du navigateur (`cache: 'reload'`) : l'IGN fait garder ses erreurs 21 jours (`max-age=1814400`), un essai ordinaire relirait l'erreur. *Décidé au build (après la mesure de T0), gardé à la démo (2026-10-16).*
- **H104** — Format gardé lisible par la version d'avant : l'entrée garde `v: 1` et ses champs ; un proche partiel ou km s'écrit « non prêt », donc relu « indisponible » par l'ancienne version au lieu d'être perdu. *Idem.*
- **H105** — Ligne d'un proche approximatif : nom, adresse, phrases d'état en texte normal, curseur, puis « Recalculer avec l'IGN » (nom accessible « Recalculer avec l'IGN <nom> », 44 px sous 1 024 px) et « Retirer ». Curseur d'un proche partiel à l'échelle 15 min → couverture. *Idem.*
- **H106** — Un ajout ou un « Recalculer avec l'IGN » se place juste devant le premier recalcul automatique en attente ; à l'ouverture, tous les calculs partent dans l'ordre d'ajout. *Idem.*
- **H107** — Pastille d'un proche km avec une commune choisie : « 88 km », sans « à vol d'oiseau » (la ligne et la fiche le disent). *Idem.*

## Exceptions
Aucune.

## Vérification de bout en bout
1. Sur la version locale, avec les pannes du soir de la démo rejouées sur le seul calcul de trajets (zone de 75 min en erreur à chaque essai, zones de 2 h et 3 h sans réponse) : ajouter « 12 rue de la Paix, Nantes » ; à 45 s au plus, le proche est **partiel**, son curseur s'arrête à 2 h 45, La Rochelle dit « jusqu'à 2 h 15 », la ligne dit les deux phrases.
2. Retirer le proche ; calcul de trajets bloqué dans le navigateur (recherche d'adresse et fond de carte ouverts) : ajouter de nouveau le même proche → **km**, « 120 km au plus », La Rochelle à sa distance à vol d'oiseau (environ 121 km d'après la relecture : elle ne passe pas à 120 km ; à relever).
3. Calcul de trajets rétabli, fermer et rouvrir 15 min plus tard (ou « Recalculer avec l'IGN ») : « Recalcul avec l'IGN… », puis **prêt**, plafond 2 h, La Rochelle « 2 h 15 ».
4. En ligne, IGN normal : le scénario de proches (« Parents de Léa ») se joue sans changement.
Preuves : captures des étapes 1 à 4 en bureau et à 390 px ; durée mesurée de l'étape 1 ; liste des requêtes de l'étape 3 (12 zones, aucune avec le nom du proche).
