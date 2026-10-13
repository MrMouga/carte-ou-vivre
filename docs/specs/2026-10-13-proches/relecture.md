# Relecture de la spec — proches
Relecteur neuf, 2026-10-13. Lu : spec.md, details.md et acceptance.json de cette tranche et de loyer-mer, CLAUDE.md, STATE.md, docs/specs/INDEX.md, spec-template.md, relecture de loyer-mer. Gravité : **[Bloquant]** = deux agents construiraient deux choses différentes · **[Important]** = un chiffre, un texte ou un écran visible change · **[Mineur]** = précision.

**Valeurs des AC recalculées** (loyer = loyer_m2 × 52 : A 650, B 832, C 1 560, D 416, E 1 092 ; mer en km affichée : A « moins d'1 km », comptée 1, B 40, E 7 ; note = 100 × (1 − valeur / plafond) ; moyenne arrondie, 0,5 vers le haut) :
- AC-1 (Nantesville à 180) : A = (45,83 + 98,33 + 33,33) / 3 = 59,17 → **59** ; B (210 > 180) et E (plus de 6 h) ne passent pas. Juste.
- AC-2 / AC-8 (à 210) : A = (45,83 + 98,33 + 42,86) / 3 = 62,34 → **62** ; B = (30,67 + 33,33 + 0) / 3 = 21,33 → **21**. Juste.
- AC-3 : 210 min donne « 3 h 15 à 3 h 30 » ; seule raison de B ; 50 min. Juste.
- AC-4 / AC-5 (Nantesville 210, Toulouseville 270) : A = (45,83 + 98,33 + 42,86 + 0) / 4 = 46,76 → **47** ; B = (30,67 + 33,33 + 0 + 44,44) / 4 = 27,11 → **27** ; 150 min donne « 2 h 15 à 2 h 30 » ; Quaibleu : seule raison Nantesville « plus de 6 h ». Juste.
- AC-6 (proche seul) : A = 42,86 → **43** (tranche 40–60), B = 0 (tranche 0–20) ; C (240), D (300) et E ne passent pas. Juste.
- AC-9 / AC-10 / AC-11 : retour aux valeurs de la tranche 1, 72, 49 et 32. Juste.
- AC-12 (60 min) : A = (45,83 + 91,67) / 2 = 68,75 → **69** ; E = (9,00 + 76,67) / 2 = 42,83 → **43** ; B = (30,67 + 16,67) / 2 = 23,67 → **24** ; D (160 min) ne passe pas. Juste.
- AC-13 (45 min) : A = (45,83 + 88,89) / 2 = 67,36 → **67** ; E = (9,00 + 68,89) / 2 = 38,94 → **39** ; 135 min donne « 2 h 15 ». Juste.

**Aucune valeur d'AC fausse.** Les plafonds utilisés (3 h 30, 4 h 30, 45 min) respectent les pas de R11 et de H5.

## Ce qu'un agent devrait deviner (manques)
- **[Bloquant]** Un proche en **calcul** ou **indisponible** quand on ferme la page : que devient-il à la réouverture ? R12 ne parle que des proches qui « reviennent prêts ». Trois lectures possibles : il disparaît ; il revient **indisponible** avec « Réessayer » ; ou son calcul repart tout seul, ce qui contredit « sans nouveau calcul ». — Où : details.md R12 et états d'un proche — Proposition : par exemple « un proche qui n'était pas prêt revient **indisponible**, avec “Réessayer” et “Retirer” ».
- **[Bloquant]** Pendant le **calcul** (jusqu'à 30 s d'après H3), on ne peut rien faire : l'état n'a ni « Retirer » ni « Annuler ». Le modèle de spec demande « > 10 s → progression + Annuler ». — Où : états d'un proche, H3 — Proposition : ajouter « Retirer » à l'état **calcul** (le calcul s'arrête et le proche disparaît), ou dire explicitement qu'on attend.
- **[Bloquant]** Plusieurs proches en file : « les calculs se suivent », mais le délai de 30 s de H3 part-il de l'appui sur « Ajouter » ou du début du calcul ? Si on ajoute 5 proches d'affilée à environ 10 s chacun, le 4e et le 5e passeraient **indisponibles** sans avoir été calculés. Et un proche qui attend son tour affiche-t-il déjà « Calcul des trajets depuis… » ? — Où : H3, cas limite « Proche ajouté pendant qu'un autre calcule » — Proposition : « le délai part du début de son propre calcul ; en attente, la ligne dit “En attente…” » (ou le même texte, mais écrit).
- **[Important]** Temps jusqu'à la mer : on ne sait pas de quelle côte il s'agit. H7 dit « point de côte atteint le plus vite par la route ». Est-ce la même limite terre-mer Shom-IGN que les km, avec la Seine et l'Adour retirés ? Les étangs comme Berre ou Thau comptent-ils ? Et comment atteint-on un point de côte qui n'est pas sur une route : au point de route le plus proche, et à moins de quelle distance ? Les minutes de milliers de communes en dépendent. Si la côte n'est pas la même, une commune peut se retrouver « à 2 km » de la mer en km et à 40 min d'un autre point de côte en minutes. — Où : H7, D9 — Proposition : « même côte que les km (Shom-IGN 2021, Seine et Adour retirés), point de route le plus proche de la côte, à moins de N m ».
- **[Important]** La mer en minutes est un second calcul de trajets : 34 746 trajets précalculés, avec une source, une licence et une mention encore inconnues (« choisie en /breakdown »). « Le risque » ne parle que des proches. Si aucune source gratuite ne permet ce calcul, D9 tombe. — Où : spec.md, Le risque — Proposition : ajouter à la mesure de la tâche 0 « une source qui calcule la mer en minutes pour toutes les communes, avec une licence compatible ; sinon, retour à Vincent ».
- **[Important]** Les proches apparaissent-ils sur la carte : un repère à l'adresse, ou les zones de temps dessinées ? « Ce qu'on voit » ne cite que les réglages et la fiche. Un agent ajoutera peut-être un repère ou un contour. — Où : spec.md, Ce qu'on voit ; details.md, zones — Proposition : une phrase, « aucun repère ni zone sur la carte pour les proches » (ou l'inverse, et dans ce cas un D-n).
- **[Important]** Quels résultats propose la recherche ? H2 dit « suggestions d'adresses ». Quelqu'un qui tape « Nantes » parce qu'il ne connaît pas l'adresse exacte obtient-il la commune elle-même (point de départ : sa mairie ?), des lieux, ou seulement des rues et des numéros ? — Où : H2, R9 — Proposition : écrire les types acceptés, par ex. « numéros, rues, lieux-dits et communes ; pour une commune, le départ est sa mairie ».
- **[Important]** Un temps de mer de 0 min. Une mairie au bord de l'eau donne probablement 0 min. Faut-il afficher « 0 min de la mer en voiture » ou « moins d'1 min », comme « moins d'1 km » ? Et comment le comparer ? — Où : R14, H4 — Proposition : reprendre la règle des km, « moins d'1 min », compté comme 1 min.
- **[Important]** Le signal d'arrêt de STATE.md (« moins de 30 inconnus ont entré une adresse au 20/12 ») suppose qu'on compte les proches ajoutés. La spec ne dit pas si cette tranche compte cet événement. Ce compte ne doit jamais contenir l'adresse, sinon la phrase de H8 « Ce site ne les garde que dans ton navigateur » devient fausse. — Où : spec.md, Pas maintenant, ou une règle — Proposition : « compter les proches ajoutés sans l'adresse » (ici ou dans /ship), ou « Pas maintenant : mesure », et un critère « aucune requête vers un autre service que l'IGN ne contient l'adresse ».
- **[Important]** Le point d'arrivée dans la fixture n'est pas défini. R10 mesure le temps jusqu'à la mairie, mais la fixture n'a pas de mairie, et le build de loyer-mer prend le barycentre de la forme (`scripts/data/tuiles.py`). Sans ce point, « traduire les tranches en zones » ne donne pas un résultat unique. — Où : acceptance.json, description de la fixture — Proposition : « mairie de la fixture = centre du carré » ou un champ `mairie` dans chaque élément.
- **[Moyen]** Une adresse en double est refusée (R9), mais on ne sait ni quand (au choix de la suggestion ou à « Ajouter ») ni à quoi on reconnaît un doublon (même libellé ou mêmes coordonnées). Où le message s'affiche-t-il ? — Où : R9 — Proposition : « même libellé, refus à “Ajouter”, message sous le champ ».
- **[Moyen]** La zone n'a pas d'état pour 1 à 4 proches avec le champ vide. « Recherche » sort vers « l'état d'avant (champ vidé) », mais il n'existe que **vide** et **plein**. Le champ se vide-t-il après « Ajouter » ? — Où : états de « Tes proches » — Proposition : un état **avec proches** (liste et champ vide) ; « Ajouter » vide le champ.
- **[Moyen]** On ne sait pas si un proche **indisponible** ou en **calcul** compte dans les 5. — Où : R9, état **plein** — Proposition : « tout proche compte dans les 5, quel que soit son état ».
- **[Moyen]** Le navigateur peut refuser de garder un proche alors que les premiers sont déjà gardés (mémoire pleine en cours de route). R12 ne couvre que « refuse de garder quoi que ce soit ». — Où : R12 — Proposition : même message dès qu'un enregistrement échoue.
- **[Moyen]** La place de `mer-en` quand `taille` est présente : `…&mer=60&mer-en=min&taille=…` ou `…&taille=…&mer-en=min` ? « Placé après `mer` » ne tranche pas, et les AC comparent l'adresse texte pour texte. Une adresse avec `mer-en=km` est-elle réécrite sans `mer-en` ? — Où : H9, R7 de loyer-mer — Proposition : un exemple complet avec la taille, et « `mer-en` absent quand la mer est en km ».
- **[Moyen]** « Effacer mes proches » agit-il tout de suite ou après une confirmation ? On perd jusqu'à 5 calculs. Et pendant un calcul, l'effacement l'arrête-t-il ? — Où : Interactions — Proposition : « sans confirmation, arrête les calculs en cours » (AC-9 le suppose déjà).
- **[Mineur]** Les textes de la fiche pour les tranches extrêmes ne sont pas donnés : « Nantes (44) : plus de 6 h en voiture » ? « moins de 15 min en voiture » ? Et dans une fiche **qui ne passe pas**, la ligne « Nantes (44) : 3 h 15 à 3 h 30 en voiture » s'affiche-t-elle en plus de la raison (AC-3 ne le dit pas) ? Dans quel ordre viennent les raisons du loyer, de la mer, de la taille et des proches ? — Où : Fiche — Proposition : un exemple complet de fiche **qui ne passe pas**.
- **[Mineur]** Le budget de recoloration (≤ 100 ms, H9 de loyer-mer) était déjà mesuré à 102 ms avec 2 critères. Avec 7 critères, il n'est pas sûr de tenir. — Où : Interactions, Le risque — Proposition : l'ajouter à la mesure de la tâche 0.
- **[Mineur]** Les temps gardés n'expirent pas, et ils sont rangés par code INSEE. Si les communes changent (nouveau COG), certains temps ne correspondent plus à rien. — Où : R12 — Proposition : « temps rattachés au code INSEE ; si une commune est inconnue, le proche passe **indisponible** et propose “Réessayer” ».

## Décisions cachées
- **[Important]** H7 fixe la côte et le point d'arrivée du temps jusqu'à la mer (voir Manques) ; cela change ce que voit l'utilisateur pour des milliers de communes. Selon ce qui sera choisi, à promouvoir en D-n ou à préciser dans D9.
- **[Moyen]** R14 : chaque changement d'unité remet le plafond à 60 km ou à 60 min, et efface donc le réglage de l'utilisateur, même s'il était sur « Sans limite ». H5 ne couvre que le passage en minutes. Proposition : une H-n pour le retour aux km (« 60 km, comme H1 de loyer-mer »).
- **[Mineur]** R11 : le plafond d'un proche n'a pas de « Sans limite », alors que le loyer et la mer en ont un. Un proche filtre donc toujours. C'est un choix produit à écrire dans D5, ou en H-n.
- **[Mineur]** R9 : le refus d'une adresse en double n'a ni D-n ni H-n. Le cas limite « deux proches dans la même commune » est autorisé. Proposition : une H-n.

## Contradictions et doublons
- **[Important]** « D20 de loyer-mer » est cité quatre fois (spec D9, états de la page, tableau d'impact), mais n'existe pas. Le spec.md de loyer-mer s'arrête à D19 et INDEX.md compte 19 décisions. Un agent qui lit loyer-mer y trouve R2 (« seuls le loyer et la mer donnent une note ») et D8 (« Écarté : à X minutes ») sans révision. — Proposition : à la validation, écrire D20 dans loyer-mer (ce qu'il remplace pour R2, l'état **sans plafond** et D8, *Pourquoi*, *Écarté*), et passer sa ligne de statut à « révisée 2026-10-13 ».
- **[Moyen]** Les H-n repartent de 1 alors que les R-n continuent (R9…). « H9 », « H1 » et « H7 » désignent tantôt cette tranche, tantôt loyer-mer : dans Interactions, « budget de H9 de loyer-mer » côtoie « (H9) » pour l'adresse, et H1 vaut « 3 h » ici mais « réglages de départ » là-bas. Proposition : continuer la numérotation à H19, ou toujours écrire « de loyer-mer ».
- **[Mineur]** C'est réussi si (spec.md) fixe « Nantes 3 h 30 à 3 h 45 », alors que la vérification dit « valeur relevée en tâche 0 ». Par ailleurs, Toulouse–La Rochelle fait environ 4 h 40 en voiture : avec des tranches de 15 min et un plafond de 5 h, La Rochelle peut échouer pour quelques minutes. Proposition : écrire « valeurs à relever en tâche 0 » dans spec.md, ou prendre un plafond de 5 h 30 pour Toulouse.
- **[Mineur]** Doublons : la plage de la mer en minutes est dans R14 et H5 ; `mer-en=min` dans le titre de l'écran, R14 et H9 ; l'adresse exacte dans D6 et H10 ; le message de panne de la recherche dans l'état **recherche** et R13. Proposition : un seul endroit, et des renvois ailleurs.
- **[Mineur]** Fixture : le service simulé de recherche met une panne (`panne`) dans la même liste que des textes tapés (`zzzz`). On peut lire « taper “panne” déclenche la panne ». Proposition : sortir les pannes dans un bloc `modes` ou `pannes`.

## Impact sur les tranches existantes
- **[Moyen]** Le tableau oublie plusieurs éléments de loyer-mer qui sont étendus :
  - le pied de page (nouvelle mention pour la source des minutes) ;
  - H3 (formats : s'y ajoutent les heures et minutes de H4) ;
  - H7 et H17 (valeurs valides de `mer` : elles dépendent maintenant de l'unité, ce qui n'apparaît que dans les cas limites) ;
  - D3 (« un plafond par critère sans poids », étendu aux proches) ;
  - D5 (« sans aucun plafond, couleur neutre », touché comme l'état **sans plafond**) ;
  - D1 (« aucun service extérieur sauf le fond » : la tranche 2 ajoute deux services appelés depuis le navigateur, ce qui mérite au moins la mention « Inchangée, tranche 1 seulement »).

  D1 à D7 et D9 n'apparaissent nulle part dans le tableau, qui ne classe que D8, D10 à D19, R1 à R8, H1 et H2.
- **[Mineur]** « Ne change pas » liste AC-1 à AC-15 de loyer-mer, mais leurs `given` ne disent pas « aucun proche gardé ». Avec des proches restés dans le navigateur entre deux tests, ils échoueraient. La phrase « Sans proche… » le couvre en partie. Proposition : « les AC de loyer-mer partent d'un navigateur sans proche gardé ».

## Critères non testables
- **AC-1** — « affiche “Calcul des trajets…”, puis… » : la fixture ne dit pas que le service simulé répond avec un délai. S'il répond aussitôt, l'état **calcul** ne s'observe pas. Proposition à Vincent : préciser dans la fixture « réponse après 1 s ».
- **AC-1 à AC-10** — Les points de départ de la fixture rendent les zones de temps difficiles à construire. Nantesville [0,25 ; 1,5] est sur le bord du carré de Terrebasse, alors que Terrebasse est à 5 h. Lilleville atteint Terrebasse (330) mais pas Quaibleu, qui est plus près. Des zones qui contiennent toutes le point de départ doivent faire des détours artificiels, et la mairie n'est pas définie (voir Manques). Proposition : dire à quel niveau on simule (par ex. « le calcul de trajets renvoie directement la fin de tranche par code INSEE ; la traduction zone → commune est testée à part ») ou éloigner les points de départ des carrés.
- **AC-3** — Rattaché à R10, mais il vérifie surtout la fiche avec les deux unités de la mer (R14). C'est mineur pour le test ; à corriger dans le rattachement.

## Hors sujet pour une spec
- spec.md, Taille : « environ 7 tâches », et H3 : « 24 zones à 5 par seconde, soit environ 5 s » sont des choix de découpage et de technique qui relèvent de /breakdown. La cible de 10 s et le délai de 30 s, eux, ont leur place ici.
- La description de la fixture (« Le constructeur traduit ces tranches en zones posées sur les formes ») suppose une méthode par zones. À garder seulement si l'AC doit vraiment tester la traduction zone → commune (voir Critères non testables).

## Couverture
Règles sans AC : aucune règle entièrement ; sans AC :
- « Aucune adresse trouvée. » (`zzzz` est dans la fixture mais aucun AC ne s'en sert) ;
- adresse en double (R9) ;
- « moins de 15 min » (R10) ;
- un proche en **calcul** qui ne compte pas (R11) ;
- « Retirer » qui efface aussi de la mémoire, et « navigateur qui refuse de garder » (R12) ;
- délai de 30 s et « Réessayer » qui mène à **prêt** (R13) ;
- retour aux km, remise à 60 km, `mer` invalide pour l'unité, « Temps jusqu'à la mer inconnu » (R14) ;
- message **aucune commune** avec un proche.

Décisions sans effet vérifiable : D1 (périmètre) ; D2 (le service IGN, et 6 h comme limite haute, ne se voient qu'en ligne) ; D6 (arrivée à la mairie : la fixture n'en a pas ; phrase sous le champ sans AC).

Décisions sans *Pourquoi* : aucune. D1, D3, D4, D7 et D8 ne donnent que « choix de Vincent », c'est faible.

Zones sans état initial : un proche **calcul** ou **indisponible** à la réouverture ; la zone avec 1 à 4 proches.

AC qui dépendent d'un service non simulé : aucun.

Mots de spec.md : environ 650 (estimation), au-dessus des ~500 du modèle.

Dimensionnement : 6 règles et 13 critères, un de plus que les ~12 prévus pour une tranche perso. La spec l'annonce, par choix de Vincent.
