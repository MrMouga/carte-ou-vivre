# Relecture de la spec — cadre-de-vie
2026-10-14 · relecteur neuf, sans l'entretien · lu : spec.md, details.md, acceptance.json, recalage.md, recalage.py, les 4 specs validées, INDEX.md, CLAUDE.md, STATE.md, docs/solutions (libellés lus par les tests protégés ; test du risque sur les extrêmes), `tests/` et `src/domain/score.ts`.

**Chiffres recalculés** (note = 100 × (1 − valeur affichée / plafond), score = moyenne arrondie moitié vers le haut) : AC-1 à AC-10 de cette tranche, tous justes ; recalage : loyer-mer AC-1, AC-3, AC-11, AC-14, AC-15 ; proches AC-1, AC-2, AC-4 ; immobilier AC-4, AC-5, AC-6, AC-7, AC-8, AC-10, AC-13, tous justes. Pas d'erreur de calcul trouvée. Les problèmes sont ailleurs : un test protégé oublié, deux critères dont le sens change, et des tests hors AC absents du tableau d'impact.

## Ce qu'un agent devrait deviner (manques)
- **Majeur** — Aucun critère ne vérifie plus qu'une distance (mer ou montagne) est comparée **arrondie** au plafond. Le seul qui le faisait, loyer-mer AC-3 (39,9 km affiché 40 = plafond 40), est recalé sur le loyer (650 €), et aucune distance de la fixture ne s'arrondit sur 10, 30, 50 ou 100 (A 0,9 · B 39,9 · E 7 · E montagne 22 · F 0,6). R28 et R29 reposent pourtant sur cette règle (loyer-mer R1 : « évite "Mer 60 km : au-dessus de ton plafond de 60 km" »). — Où : acceptance.json (fixture), R28, R29 ; recalage.md loyer-mer AC-3. — Proposition : donner à une commune une distance qui s'arrondit sur un choix (par ex. une montagne à 29,6 km, affichée « 30 km »), et ajouter un critère où elle passe à 30 km avec la note 0. Choisir les valeurs pour que le score ne tombe pas pile sur ,5 : le code fait `Math.round` sur une moyenne en virgule flottante. Par exemple, si E (note de prix 8,999999999999996 en flottant) était à 29,6 km, sa moyenne vaudrait 4,4999… et le site afficherait 4 au lieu de 5. Les ,5 actuels (AC-2 Quaibleu 47,5 ; AC-3 Rhinval 74,5 ; immobilier AC-2 61,5 et AC-3 67,5) tombent juste ; je l'ai vérifié à la main pour 47,5.
- **Mineur** — Raison « En montagne » non tenue : R29 ne donne la forme qu'avec « moins d'1 km ». La vérification (étape 2) attend Bordeaux « avec sa distance ». — Où : details.md R29. — Proposition : ajouter l'exemple « Montagne : pas une commune de montagne (140 km) ».
- **Mineur** — L'ordre des raisons dans la fiche n'est pas fixé quand plusieurs critères échouent (prix, mer, montagne, taille, type, proches). — Où : R27, R29, R30. — Proposition : fixer l'ordre, par exemple celui des réglages : prix, taille, type, mer, montagne, proches.
- **Mineur** — R31 : on ne sait pas si « tout autre nombre entier valide de l'ancienne plage » suit le pas de 5 km de H7. `mer=23` donne-t-il 30 km ou Peu importe ? Et `mer=0` ? — Où : R31, Cas limites. — Proposition : « un multiple de 5 de 5 à 200 (H2, H7) » et un cas limite `mer=23` → Peu importe.
- **Mineur** — `env` : les doublons et le tri à la réécriture ne sont dits que pour `taille` (H17 de loyer-mer). — Où : R31. — Proposition : « comme `taille` (H17) : remis dans l'ordre de R27, sans doublon ».
- **Mineur** — Fiche dans l'état **sans plafond** : loyer-mer n'y prévoit que « la raison de taille ». On ne sait pas quoi afficher pour une commune écartée par le type ou par « En montagne » (par ex. la fiche de Portmer dans AC-10). — Où : details.md, États de la fiche. — Proposition : « les raisons des filtres (taille, type, En montagne) ».
- **Mineur** — La forme de la ligne R30 n'est pas donnée pour une commune sans type (« Type d'environnement inconnu · 4 200 habitants » ?), ni pour un type connu avec une population inconnue. — Où : Cas limites, R30. — Proposition : écrire les deux lignes.
- **Mineur** — H76 ne nomme ni le groupe « Proximité avec la nature » ni les sous-groupes « Urbain » et « Rural ». Elle ne dit pas non plus si les pastilles à choix unique (Mer, Montagne) sont des boutons pressés, comme les tailles, ou des boutons radio. Les tests d'AC-1 à AC-4 (« cochée », « choisit ») en dépendent. — Où : H76. — Proposition : fixer le rôle et les noms dans H76, ou dire « rôle fixé par /ui avant les tests ».
- **Mineur** — Les mentions de H80 n'ont aucun critère (immobilier avait AC-12 pour la sienne). — Où : acceptance.json. — Proposition : un critère sur la présence de « Insee » et de « Cerema » au pied de page ; le texte exact reste fixé en tâche 0.
- **Mineur** — H78 ne cite que les textes en Louer. Les variantes d'immobilier (« Relâche le prix, la mer ou la taille. », « Fixe un prix d'achat ou une distance à la mer… ») et de proches (« … ou un proche. ») ne sont pas dites inchangées. — Où : H78. — Proposition : « et leurs variantes Acheter et avec un proche ».

## Décisions cachées
- **Majeur** — Le recalage change ce que vérifient deux critères, sans D-n ni ligne du tableau d'impact :
  - loyer-mer AC-3 : le *when* passe de « mer sur 40 km » à « loyer sur 650 € ». Le critère teste l'égalité du loyer et non plus l'arrondi d'une distance, et une seule commune passe au lieu de trois.
  - immobilier AC-8 : le *when* passe de `mer=200` à `montagne=100`. R25 est désormais testée par la montagne, une notion de cette tranche. Rhinval passe, Portmer et Grandeville ne passent plus.

  D4 annonce « mêmes communes, quelques scores changent ». — Où : spec.md D4 ; recalage.md. — Proposition : nommer ces deux réécritures dans D4 (ou dans un D8) pour que Vincent les accepte en connaissance de cause, et ajouter le critère d'arrondi proposé plus haut pour remplacer l'ancien AC-3.
- **Mineur** — H78 garde « Relâche le loyer, la mer ou la taille. » même quand c'est le type ou la montagne qui écarte tout. Elle garde aussi « Fixe un loyer ou une distance à la mer… » alors que la montagne classe désormais. L'utilisateur lit un conseil faux : c'est un choix produit visible, rangé en hypothèse. — Proposition : en faire une D-n, ou changer les textes (ce qui recale loyer-mer AC-5 et AC-6, et le test hors AC d'immobilier l.416-431).
- **Mineur** — H81 affiche « Commune de montagne » pour une commune que la loi ne classe pas. Cela contredit la définition de D5 et R29 (« classée en tout ou partie »), qui ne renvoient pas à H81. — Proposition : la citer dans R29, et compter ces communes en tâche 0 (H73).

## Contradictions et doublons
- **Bloquant** — Immobilier AC-9 est déclaré « tel quel » (Ne change pas), mais son test protégé lit l'adresse : `tests/e2e/immobilier.spec.ts:357` `expect(adresse(page)).toBe('/?achat=5000&mer=aucun')`. R31 réécrit cette adresse en `/?achat=5000` (`aucun` = Peu importe, non écrit). Le test échouera, et l'agent n'a pas le droit de le modifier tant que l'AC ne change pas. — Où : details.md, Ne change pas ; recalage.py (`PROPRES` d'immobilier). — Proposition : recaler AC-9 en précisant dans son *then* « l'adresse devient /?achat=5000 » (51 critères), puis le faire valider par Vincent avec les autres.
- **Mineur** — recalage.md (et recalage.py, l.113) affirme que « les mêmes communes passent dans tous ces critères », sauf ceux qui testent le départ. C'est faux pour loyer-mer AC-3 et immobilier AC-8 (voir Décisions cachées). — Proposition : corriger la phrase, ou lister les exceptions.
- **Mineur** — L'état **sans plafond** dit que les filtres « grisent » les communes écartées. Loyer-mer et AC-10 disent « non colorées » ; le gris (`area-excluded`) ne sert qu'au fond indisponible (R8). — Proposition : « laissent non colorées ».
- **Mineur** — Doublons :
  - H74 répète R29 (arrondi au km, 0, « Commune de montagne »).
  - R32 répète D7 et les « départ Peu importe » de R28 et R29.
  - La fixture « 6 communes · cadre de vie » est la fixture « 6 communes » d'immobilier, à laquelle le recalage ajoute déjà les mêmes champs : on aurait deux fixtures identiques sous deux noms.

  — Proposition : une seule fixture, « 6 communes », étendue.
- **Mineur** — recalage.md ne montre pas ce que `--appliquer` changera dans les descriptions de fixture : interface-telephone « /?loyer=1200&mer=60 → … 49 … 32 » devient mer=50 et 48/25, et le texte des nouveaux champs est ajouté aux quatre fichiers. Vincent valide donc un écart incomplet. — Proposition : ajouter ces lignes à recalage.md.

## Impact sur les tranches existantes
- **Majeur** — Les amendements « D22 de loyer-mer, D17 de proches, D13 d'interface-telephone, D11 d'immobilier » sont cités (details.md l.54) mais n'existent pas : INDEX compte 21, 16, 12 et 10 décisions. Tant qu'ils ne sont pas écrits, les specs validées disent encore le contraire : loyer-mer H1 (mer 60 km), H2, H7, D11, R4, R1 (exemple de raison) et la vérification de l'étape 1 ; immobilier R26 (ordre des paramètres) et la vérification de l'étape 1 (`/?loyer=1200&mer=60`). — Proposition : écrire le texte de chaque amendement dans cette spec, pour que Vincent valide le même texte que celui qui sera reporté.
- **Majeur** — Des tests hors AC sont touchés sans figurer au tableau. La ligne « tous » ne couvre que le curseur « Mer à moins de » et les noms « Mer » et « Taille de ville ». Manquent :
  - `immobilier.spec.ts` l.217-233 (D2, R21 avec `mer=60`), l.258-277 (adresse `/?loyer=1200&mer=60` après `/`), l.434 et l.453 ;
  - `categories.spec.ts` (résumés « 60 km », « Sans limite », « Petite ville, Ville moyenne », « Peu importe ») ;
  - `liste.spec.ts` l.52-56 (« zone annoncée ») : le test clique `/Petite ville/`, qui désignera désormais la pastille de **type** « Petite ville ». Le test change de sens sans forcément échouer ;
  - `safari.spec.ts` et `chrome.spec.ts` : H18 y est éprouvée par le curseur de la mer (`mer=55`, `mer=155`), qui disparaît ; il faudra le curseur du prix ;
  - `aucune.spec.ts` (`mer=5`) ;
  - `telephone-feuille.spec.ts` hors AC (l.155, 507, 518), `telephone-vue.spec.ts` l.20, `proches-clavier-iphone.spec.ts` l.144 ;
  - les tests unitaires `src/domain/url.test.ts`, `score.test.ts`, `prix.test.ts`, `format.test.ts`, `proches.test.ts` (59 occurrences de mer 60, « Sans limite », « Grande ville »).

  — Proposition : une ligne par fichier, en signalant la collision du nom « Petite ville » et le report de H18 sur le curseur du prix.
- **Mineur** — Règles et hypothèses touchées mais non classées :
  - immobilier R25 (« mer, proche prêt » : la montagne note aussi, et AC-8 recalé en dépend) ;
  - immobilier R26 (ordre étendu par R31) ;
  - proches R11 (« le loyer, la mer et chaque proche prêt ») ;
  - interface-telephone R18 (« Critères » contient « loyer, mer, taille, proches ») ;
  - proches H40 (résumé « Peu importe » des tailles, remplacé par H75) ;
  - loyer-mer D20 (état sans plafond défini par « loyer et mer sur Sans limite »).

  — Proposition : les classer « Étendue » dans le tableau.
- **Mineur** — Les critères reportés de proches (AC-12, AC-13, AC-15, mer en minutes) contiennent `mer=60`, `mer=45` et « le plafond de la mer affiche 60 km ». Ils ne sont ni recalés (`recalage.py` ne lit que `criteria`) ni cités dans « Ne change pas ». D4 les rend faux. — Proposition : les marquer « Contredite par D4, à réécrire avec la mer en minutes ».
- **Mineur** — La ligne des fixtures oublie le jeu « métropole » (AC-1 d'interface-telephone, `tests/fixtures/`) et les tuiles `tuiles.py --fixture`. — Proposition : les ajouter si les nouveaux champs y sont lus.

## Critères non testables
- Aucun. Remarque : « cochée » (AC-1, AC-8) et « choisit la mer « 50 km » » (AC-2) se vérifient dès que le rôle des pastilles est fixé (voir H76 dans les manques).

## Hors sujet pour une spec
- **Mineur** — H72 « jointe par code INSEE » répète une règle de CLAUDE.md (Données). Sans effet sur ce qui sera construit.

## Couverture
Règles sans AC : aucune (R27 AC-5/6, R28 AC-2/9, R29 AC-3/4/10, R30 AC-7, R31 AC-8/9, R32 AC-1). Restent sans critère : l'égalité arrondie au plafond pour une distance (R28, R29) et H80 · Décisions sans effet vérifiable : aucune (D1 ne fait que délimiter la tranche) · Décisions sans *Pourquoi* : D6 et D7 (« choix de Vincent », sans raison) · Zones sans état initial : aucune · AC qui dépendent d'un service non simulé : aucun · Mots de spec.md : ~530
