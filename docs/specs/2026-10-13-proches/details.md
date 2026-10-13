# Détails — proches et mer en minutes
Révisé le 2026-10-13 après /ui : pastilles de temps (D10, R15), estimation haute (D11), pas de phrase sur l'IGN (D12), champ replié derrière « + Ajouter un proche » (D13). Lire d'abord [spec.md](spec.md) (décisions D-n), puis la tranche [loyer-mer](../2026-10-12-loyer-mer/details.md), que celle-ci étend : ses règles R1 à R8 et ses hypothèses H1 à H18 restent valables, revues par D20 de loyer-mer. Ici, les règles commencent à R9 et les hypothèses à H19 ; « R1 », « H9 »… sans précision sont donc celles de loyer-mer.

## Parcours
1. L'utilisateur ouvre la page : réglages lus dans l'adresse (R7) et proches gardés dans ce navigateur (R12).
2. Dans « Tes proches », il tape une adresse ou une ville, choisit une suggestion, garde ou change le nom proposé et appuie sur « Ajouter » (D3, D4).
3. Le proche apparaît en calcul, son repère est posé sur la carte ; quand le calcul finit, il prend son plafond (H19) et la carte, la liste et la fiche se mettent à jour.
4. Il règle le plafond du proche : la carte se recolore sans nouveau calcul.
5. Il passe la mer en minutes : la carte, la liste et l'adresse de la page suivent.
6. Il ouvre une fiche : temps vers chaque proche, mer en km et en minutes.
7. Il ferme puis rouvre le site : ses proches sont revenus. « Effacer mes proches » les retire.

## Écrans et états
### Carte — route `/` · dans l'URL : en plus de loyer-mer, `mer-en=min` quand la mer est en minutes (H27) ; les proches n'y sont jamais (D7)
Zones touchées (les autres restent celles de loyer-mer) : réglages — la mer reçoit la bascule « km à vol d'oiseau / minutes en voiture » (D9) ; nouvelle zone **Tes proches** : champ de recherche et suggestions, champ « Nom » prérempli, bouton « Ajouter », une ligne par proche (nom, adresse en petit, état ou plafond, « Retirer »), et « Effacer mes proches » dès qu'il y a un proche · carte — un repère par proche, posé à son point de départ et portant son nom, quel que soit l'état du proche ; un repère ne se clique pas · fiche — une ligne par proche, la mer dans les deux unités · pastilles de temps — en haut de la carte, en bureau (R15) · pied de page — la mention de la source du temps jusqu'à la mer (choisie en /breakdown, ajoutée à CLAUDE.md) ; les trajets IGN sont couverts par « © IGN – Géoplateforme ». Disposition, et à 390 px : /ui.

États de la zone **Tes proches** (initial : **vide** sans proche gardé, sinon **avec proches**) :
- **vide** (aucun proche) → le champ de recherche, « Ajoute l'adresse d'un proche : la carte calcule le temps en voiture jusqu'à chaque commune. » ; sort vers **recherche**.
- **avec proches** (1 à 4 proches) → la liste des proches, le lien « + Ajouter un proche » qui ouvre le champ de recherche (D13), « Effacer mes proches » ; sort vers **recherche** ou **vide**.
- **recherche** (au moins 3 caractères tapés, H20) → jusqu'à 5 suggestions ; une fois une suggestion choisie, le champ « Nom » prend sa commune (« Nantes (44) ») et « Ajouter » devient actif ; sinon, « Aucune adresse trouvée. » ou la panne de R13 ; « Ajouter » vide les champs ; sort vers **avec proches** ou **plein**.
- **plein** (5 proches, quel que soit leur état) → le champ est remplacé par « 5 proches au maximum. Retire-en un pour en ajouter un autre. » ; sort vers **avec proches** quand un proche est retiré.

États d'un proche :
- **en attente** (ajouté pendant qu'un autre calcule) → « En attente… », « Retirer » ; sort vers **calcul** quand son tour vient.
- **calcul** → « Calcul des trajets depuis Parents de Léa… », « Retirer » (le calcul s'arrête et le proche disparaît) ; il ne compte pas encore ; tout le reste marche ; sort vers **prêt** ou **indisponible** (H21).
- **prêt** → nom, adresse, plafond, « Retirer » ; il compte dans le score (R11).
- **indisponible** (le calcul échoue ou dépasse le délai de H21 ; ou, à la réouverture, un proche qui n'était pas prêt ou dont des temps manquent, R12) → « Trajets indisponibles depuis Parents de Léa. », « Réessayer » (vers **calcul**) et « Retirer » ; il ne compte pas.

États de la page (loyer-mer, revus par D20) : **sans plafond** suppose aussi qu'aucun proche n'est **prêt**. Dès qu'un proche est prêt, la page est **classée** ou **aucune commune**. Dans **aucune commune** avec au moins un proche prêt, le message devient « Aucune commune ne passe tes critères. Relâche le loyer, la mer, la taille ou un proche. » ; sans proche prêt, il reste celui de loyer-mer.

Fiche (états de loyer-mer), lignes ajoutées sous la mer, dans tous les états :
- la mer dans les deux unités : « 40 km de la mer à vol d'oiseau » puis « 50 min de la mer en voiture » (R14) ;
- une ligne par proche, dans l'ordre d'ajout : **prêt** « Parents de Léa : 3 h 30 en voiture » (D11, formats de H22) ; **en attente** ou **calcul** « Parents de Léa : calcul en cours » ; **indisponible** « Parents de Léa : trajets indisponibles ».
Dans l'état **commune qui ne passe pas**, les raisons viennent dans cet ordre : loyer, mer, taille (comme dans loyer-mer), puis une par proche non tenu, dans l'ordre d'ajout : « Parents de Léa 3 h 30 : au-dessus de ton plafond de 3 h ». Exemple complet, plafond Nantesville 3 h : « Grandeville (33) » · « Ne passe pas tes critères » · « Nantesville (44) 3 h 30 : au-dessus de ton plafond de 3 h » · taille · loyer · « 40 km de la mer à vol d'oiseau » · « 50 min de la mer en voiture » · « Nantesville (44) : 3 h 30 en voiture ».

Interactions : « Ajouter » → proche en **calcul** (ou **en attente**) et repère posé tout de suite, carte à jour à la fin (H21) · plafond d'un proche, bascule de la mer → carte, liste, fiche (et adresse de la page pour la mer) à jour, budget de H9 · « Retirer » → le proche et son repère disparaissent, la carte est à jour aussitôt, sans nouveau calcul · « Effacer mes proches » → sans confirmation, arrête les calculs et retire tous les proches.

## Règles
- **R9** — Ajouter un proche (D3, D4, D6). Les suggestions proposent des adresses (numéro, rue, lieu-dit) et des communes de métropole (H20). Le nom proposé est la commune et son département, « Nantesville (44) » ; on peut le remplacer par un nom libre de 30 caractères au plus, et un nom vide reprend la commune. Au plus 5 proches, tous états confondus. Si le libellé de l'adresse choisie est déjà celui d'un proche, « Ajouter » ne l'ajoute pas et le message « Cette adresse est déjà dans tes proches. » s'affiche sous le champ. Deux proches peuvent porter le même nom. *Pourquoi* : D3, D4.
- **R10** — Temps d'un proche (D2, D6, D11). C'est la fin de la tranche de 15 min qui contient le temps en voiture entre son point de départ (l'adresse, ou la mairie pour une commune choisie) et la mairie de chaque commune ; il s'affiche ainsi : « 3 h 30 », « 15 min », ou « plus de 6 h » au-delà de 6 h ou sans route (une île sans pont). Cette même valeur est comparée au plafond et notée (D5), et « plus de 6 h » ne passe aucun plafond. *Pourquoi* : D2, D5, D11.
- **R11** — Plafond et score (D5). Le plafond d'un proche va de 15 min à 6 h par pas de 15 min ; il vaut 3 h à l'ajout (H19). Une commune tient un proche si la fin de sa tranche est inférieure ou égale au plafond ; pour passer, elle doit aussi tenir R1. La note d'un proche vaut 100 × (1 − fin de tranche / plafond). Le score est la moyenne des notes de tous les critères actifs : le loyer, la mer et chaque proche **prêt**. Un proche dans un autre état ne compte pas. *Pourquoi* : D5.
- **R12** — Mémoire (D7). Pour chaque proche, ce navigateur garde l'adresse, le point de départ, le nom, le plafond et les temps rangés par code INSEE. À la réouverture, un proche qui était **prêt** revient **prêt**, sans nouveau calcul. Un proche qui n'était pas prêt, ou dont un code INSEE de la carte n'a pas de temps, revient **indisponible**. Les proches n'entrent jamais dans l'adresse de la page. « Retirer » efface un proche de cette mémoire ; « Effacer mes proches » les efface tous. Dès qu'un enregistrement échoue, parce que le navigateur refuse ou que sa mémoire est pleine, les proches marchent jusqu'à la fermeture de la page, et la zone dit « Tes proches ne seront pas gardés sur ce navigateur. ». *Pourquoi* : D7.
- **R13** — Pannes (comme R8). Si la recherche ne répond pas, la zone affiche « Recherche d'adresse indisponible. Réessaie dans un moment. ». Si le calcul d'un proche échoue ou dépasse le délai de H21, ce proche passe **indisponible**. Dans les deux cas, la carte, les autres proches et les réglages marchent comme d'habitude. *Pourquoi* : D16 de loyer-mer, un service extérieur ne casse pas la carte.
- **R14** — Mer en minutes (D9). La bascule passe le plafond de la mer en minutes (plage de H23). Chaque passage d'une unité à l'autre remet le plafond de départ de l'unité choisie, même depuis « Sans limite » : 60 min, ou 60 km (H1). Le temps s'affiche et se compare à la minute (formats de H22) ; sous 1 min, il s'écrit « moins d'1 min » et se compare comme 1 min. En minutes, la ligne de la liste finit par le temps (« 5 min ») au lieu des km, et la raison s'écrit « Mer 2 h 15 : au-dessus de ton plafond de 45 min ». Une commune sans temps jusqu'à la mer affiche « Temps jusqu'à la mer inconnu » et, en minutes, ne passe pas, avec cette raison. *Pourquoi* : D9.
- **R15** — Pastilles de temps (D10). En bureau, dès qu'il y a un proche, une pastille par proche en haut de la carte, dans l'ordre d'ajout, sans action au clic. Sans commune choisie : « Parents de Léa · 4 h au plus » pour un proche **prêt**, « calcul en cours » ou « trajets indisponibles » sinon. Avec une commune choisie : son temps depuis ce proche (R10), suivi de « · au-dessus de 4 h » quand il dépasse le plafond. Pas de pastilles sous la largeur bureau (H11 de loyer-mer). *Pourquoi* : D10.

## Cas limites
- Fin de tranche égale au plafond → la commune passe avec une note de 0 pour ce proche (AC-2, Grandeville).
- Loyer et mer sur « Sans limite », avec un proche prêt → la page classe sur ce proche seul ; ce n'est pas l'état **sans plafond** (AC-6).
- Commune sans route depuis le proche (Ouessant, l'île d'Yeu, la Corse depuis le continent) → « plus de 6 h » ; elle ne passe pas avec ce proche. Un proche en Corse atteint les communes corses.
- Plusieurs proches ajoutés d'affilée → les calculs se font l'un après l'autre ; le délai de H21 part du début du calcul de chaque proche.
- Adresse déjà présente → refusée (R9).
- Commune sans temps jusqu'à la mer → R14 ; leur nombre est mesuré en tâche 0 (attendu : quelques îles).
- `mer-en` absent ou différent de `min` → la mer est en km, et `mer-en` disparaît de l'adresse réécrite. Une valeur `mer` invalide pour l'unité en cours prend le plafond de départ de cette unité (H7 et H17 appliqués aux plages de H23).
- Lien ouvert dans un navigateur qui garde des proches → les proches de ce navigateur s'appliquent aussi (D7).

## Impact sur les tranches existantes
| Tranche | Élément | Inchangée / Étendue / Contredite | Action |
|---|---|---|---|
| loyer-mer | D1, « aucun service extérieur sauf le fond » | Inchangée (vaut pour la tranche 1) | cette tranche appelle l'IGN pour la recherche et les trajets (D2) |
| loyer-mer | D3, un plafond par critère sans poids | Étendue | aux proches, sans « Sans limite » (D5) |
| loyer-mer | D4, score = moyenne des notes des critères actifs | Étendue | les proches prêts sont des critères actifs (R11) |
| loyer-mer | D5 et l'état **sans plafond** (« loyer et mer sur Sans limite ») | Contredite | D20 de loyer-mer : « …et aucun proche prêt » |
| loyer-mer | R2, « seuls le loyer et la mer donnent une note » | Contredite | D20 de loyer-mer : les proches prêts en donnent aussi |
| loyer-mer | D8, la mer à vol d'oiseau (« Écarté : à X minutes ») | Contredite | D20 de loyer-mer : les minutes deviennent une option, km par défaut (D9) |
| loyer-mer | R1, raisons dans la fiche | Étendue | raisons des proches et de la mer en minutes (R10, R14) |
| loyer-mer | R4, contenu de la fiche | Étendue | lignes des proches, mer en minutes |
| loyer-mer | R5, ligne de la liste | Inchangée en km ; étendue en minutes | R14 |
| loyer-mer | R7, D7, H7, H17 : réglages dans l'adresse, valeurs valides | Étendue | `mer-en` (H27), plages en minutes (H23) ; proches hors de l'adresse (D7) |
| loyer-mer | H3, formats | Étendue | heures et minutes (H22) |
| loyer-mer | Message de l'état **aucune commune** | Étendue | autre texte avec un proche prêt |
| loyer-mer | Pied de page | Étendue | mention de la source du temps jusqu'à la mer |
| loyer-mer | D6, D10 à D19, R3, R6, R8, H1, H2, H4 à H6, H8 à H16, H18 | Inchangée | — |

## Ne change pas
Loyer-mer : AC-1 à AC-15, sur un navigateur sans proche gardé et avec la mer en km.

## Hypothèses
- **H19** — Plafond d'un proche à l'ajout : 3 h. C'est un trajet qu'on fait un week-end.
- **H20** — Recherche : à partir de 3 caractères, 300 ms après la dernière frappe ; au plus 5 suggestions, toutes en métropole.
- **H21** — Budgets : « Calcul des trajets… » et le repère apparaissent aussitôt après « Ajouter ». On vise 10 s au plus par proche, à mesurer en tâche 0. Au-delà de 30 s depuis le début de son calcul, le proche passe **indisponible**. Changer un plafond ou retirer un proche ne relance aucun calcul. À la réouverture, les proches sont prêts dès que la carte est chargée.
- **H22** — Formats des temps (D11) : proches « 15 min », « 45 min », « 1 h », « 1 h 15 », « 3 h 30 », « plus de 6 h » ; mer et plafonds : « moins d'1 min », « 5 min », « 45 min », « 1 h », « 1 h 05 », « 2 h 15 », « 3 h 30 ».
- **H23** — Mer en minutes : de 5 min à 3 h par pas de 5 min, puis « Sans limite » (`aucun`). 60 min au passage en minutes, d'après le pitch (« la mer à moins d'une heure »).
- **H24** — Les temps sont ceux du réseau routier, sans embouteillages ni heure de départ ; l'écran dit seulement « en voiture ».
- **H25** — La mer en minutes vise la même côte que les km (limite terre-mer Shom-IGN 2021, Seine et Adour retirés) : c'est le temps jusqu'au point de route le plus proche de cette côte, atteint le plus vite depuis la mairie. Méthode et distance maximale entre la route et la côte : /breakdown, mesurées en tâche 0.
- **H26** — *Supprimée par D12* (phrase sur l'IGN sous le champ).
- **H27** — Dans l'adresse de la page, `mer-en=min` suit `mer` et précède `taille` : `/?loyer=1200&mer=60&mer-en=min&taille=petite-ville`.
- **H28** — Les coordonnées envoyées à l'IGN sont celles que renvoie la recherche, sans arrondi.
- **H29** — Le repère d'un proche affiche son nom en entier (30 caractères au plus, R9) ; s'il en recouvre un autre, les deux restent visibles (règle d'affichage : /ui).
- **H30** — Un nom de proche n'est envoyé à aucun service, et ne sort jamais du navigateur.

## Exceptions
Aucune.

## Vérification de bout en bout
Sur la version en ligne, en largeur bureau et à 390 px :
1. Ouvrir `/`, choisir « 12 rue de la Paix, Nantes », nommer le proche « Parents de Léa », puis « Ajouter » : on voit « Calcul des trajets depuis Parents de Léa… » et le repère à Nantes, puis le proche avec 3 h. L'adresse de la page reste `/?loyer=1200&mer=60`.
2. Régler ce proche sur 4 h, ajouter « Toulouse » (la commune) et le régler sur 5 h 30. Bordeaux et La Rochelle passent ; la fiche de Bordeaux affiche « Parents de Léa : 3 h 45 en voiture » (valeur relevée en tâche 0) et une ligne « Toulouse (31) » ; en haut de la carte, les pastilles donnent les mêmes temps.
3. Fermer le navigateur, rouvrir le site : les deux proches et leurs repères sont là, prêts, sans « Calcul des trajets ».
4. Passer la mer en minutes : l'adresse contient `mer-en=min`, et la fiche de Bordeaux affiche les km et les minutes.
5. « Effacer mes proches », puis recharger : aucun proche, aucun repère.
Preuves : captures des étapes 1 à 5 aux deux largeurs ; temps de calcul mesuré à l'étape 1 ; liste des requêtes réseau de l'étape 1, qui ne contiennent pas « Parents de Léa ».
