# Relecture de la spec — services

Statut : terminé

**Verdict : à reprendre avant validation.** 31 constats : 1 bloquant, 7 majeurs, 13 moyens, 10 mineurs. La mécanique (filtre, adresse, fiche) est solide ; ce qui manque porte sur le sens des données : ce que vaut « pas de chiffre », ce que recouvre chaque service, et ce qu'on affirme sur les îles.

**Vérifié, sans constat :**
- Les valeurs attendues d'AC-1 à AC-11 sont justes, recalculées à la main depuis la fixture (listes, comptes, adresses, médianes et arrondis d'AC-5).
- Les 16 codes de H161 correspondent aux bons noms dans `public/data/communes.json`.
- « Services » après « Tes proches » ne casse pas les contrôles d'ordre (`emploi.spec.ts:107-108`, `mairies.spec.ts:78`).
- Aucun test ne compare la fiche en entier (`sousMairie` passe par `slice` et `indexOf`), et aucun ne cherche « Médecin » par `getByText` : l'inquiétude de `details.md:74` est levée pour ce mot.
- Aucun texte de la tranche n'insère un nom de commune : la règle Auch / Le Havre / Les Sables-d'Olonne est sans objet.

**Limites de cette relecture :** rien n'a été exécuté, les fichiers Insee n'ont pas été ouverts. Les chiffres viennent de `mesures.md`, de `communes.json` et du code. Le sens des codes BPE (constat D1) vient de ma mémoire de la nomenclature, à confirmer.

Les constats marqués **[Vincent]** demandent sa décision.

## Ce qu'un agent devrait deviner (manques)

- **M1 [Majeur]** — Place du bloc par rapport à « Tes proches » dans la fiche. R54 dit « sous la ligne du chômage », mais le bloc « Tes proches » y est déjà (`Fiche.tsx:106-107`). Placé juste dessous, le bloc (titre, 7 lignes, limites, parfois l'île) repousse d'une dizaine de lignes les temps vers les proches, le cœur de la Différence (STATE.md), surtout à 390 px. — Où : `details.md:37`, AC-6. — Proposition : écrire « après le bloc « Tes proches » quand il existe » ; AC-6 reste vrai.
- **M2 [Majeur]** — Carreau habité sans temps pour un service. R52 ne traite que la commune « sans carreau pour un service ». Or une commune peut avoir des carreaux avec un temps et d'autres sans : L'Île-d'Yeu a des carreaux (commerce 2,6) mais aucun temps de gare. La « population totale » compte-t-elle les carreaux sans temps ? Si oui, la moitié peut n'être jamais atteinte. — Où : `details.md:35`, H157. — Proposition : « la moitié de la population des carreaux qui ont un temps pour ce service », compter en tâche 0 les communes touchées, ajouter le cas à AC-5.
- **M3 [Majeur] [Vincent]** — Le test du risque ne peut pas conclure. Les 10 communes ne sont pas nommées ; « fausse » n'a pas de définition (quel écart, sur lequel des 7 temps ?) ; les « valeurs à contrôler » (`mesures.md:44-47`) n'ont ni seuil ni suite, dont les 85 communes dont la population des carreaux s'écarte de plus de 30 %. D8 masque le chiffre de Tende (224 min) mais la fiche dirait quand même « Commerce alimentaire : plus d'une heure » et le filtre l'écarterait : si la valeur est fausse, l'erreur reste visible. — Où : `spec.md:18`, `spec.md:25`. — Proposition : nommer les 10 communes en incluant les extrêmes (Tende, Prads-Haute-Bléone, Roscanvel, L'Aiguillon-la-Presqu'île ; leçon du 2026-10-14) ; « fausse » = la commune change de côté d'une pastille ; dire ce que devient une valeur reconnue fausse (par exemple « pas de chiffre »).
- **M4 [Moyen]** — Mesure en 4G sans seuil ni suite. « À mesurer en 4G » ne dit ni le débit, ni la limite, ni ce qu'on fait au-delà. — Où : `spec.md:25`, H162. — Proposition : reprendre la méthode d'emploi (1 Mo/s, `docs/plans/2026-11-21-emploi/mesure-tache-0.md:149`) avec un temps ajouté maximal.
- **M5 [Moyen]** — La table de `mesures.md:16-24` s'intitule « Communes qui passent », sans dire si elle compte les « sans chiffre », qui passent selon R53. Or la vérification de bout en bout demande de refaire ces comptes (`details.md:111`). — Proposition : préciser « temps ≤ seuil, sans chiffre non compris », ou donner les deux.
- **M6 [Moyen]** — R55 ne dit pas dans quel ordre appliquer ses deux retraits. `medecin:7,medecin:10` donne `medecin:10` si l'entrée invalide est retirée d'abord, rien sinon ; de même `gare:7,grande-gare:10`. AC-11 ne couvre pas ce cas. — Où : `details.md:38`. — Proposition : « la première entrée **valide** est gardée », et un exemple dans AC-11.
- **M7 [Moyen]** — D1 retient le médecin **généraliste**, mais aucun texte visible ne le dit : pastille « Médecin », ligne « Médecin : 4 min », limites « Médecins libéraux seulement ». — Où : H153, H159, AC-6. — Proposition : « Médecins généralistes libéraux seulement ».
- **M8 [Mineur]** — Millésime. D2 dit « (2025) », mais les routes datent de 2022 et les crèches du 1er janvier N-1 (`mesures.md:6-8`) ; la mention de H164 n'a aucune date, contrairement aux autres sources du site. — Proposition : dater la mention.
- **M9 [Mineur]** — Niveau de gare à l'ouverture d'un lien. L'état initial est « Une gare » (`details.md:23`), alors qu'AC-9 ouvre sur `grande-gare:30` et suppose « Une grande gare ». Le nom du groupe de ce choix pour les lecteurs d'écran n'est pas donné non plus (H153). — Proposition : « le niveau suit l'adresse » et un nom de groupe.
- **M10 [Mineur]** — Espace insécable avant « : » (H148) : réservé aux raisons de métier. Une raison longue (« Commerce alimentaire 18 min : au-dessus… ») peut laisser le « : » seul en début de ligne. — Proposition : étendre H148 à R53 et R54.

## Décisions cachées

- **D1 [Majeur] [Vincent]** — H158 fixe ce que veut dire chaque service, sans D-n et sans « décidé par Claude ». Elle compte comme commerce alimentaire B201 et B202 (supérette et épicerie, à confirmer) et comme école C107 à C109 (dont la maternelle). Une commune avec une seule épicerie, ou une maternelle sans élémentaire, passerait « Courses » ou « École » à 5 min, ce qui change ce que le produit promet à une famille. — Proposition : promouvoir en D-n, avec le sens de chaque code en clair.
- **D2 [Majeur] [Vincent]** — H165 laisse ouverte une nouvelle dépendance (DuckDB), alors que le projet impose des scripts Python sans dépendance (CLAUDE.md). Avec 14 Go de fichiers pour 11 Go libres, sans ce choix la donnée ne peut pas être produite : c'est une condition de la tranche, pas un détail. — Proposition : une D-n avant /breakdown, par exemple « extraction unique avec DuckDB hors du dépôt, puis scripts Python sur l'extrait de 201 Mo ».
- **D3 [Moyen] [Vincent]** — H152 : la pastille « 30 min » ne filtre presque rien pour 5 services sur 6 (elle garde 99,7 % des communes pour le médecin, 99,9 % pour le commerce, 99,9 % pour l'école, 99,1 % pour le collège, 99,2 % pour la crèche). Cocher sans effet visible peut se lire comme une panne. — Proposition : des crans par service, ou l'accepter en connaissance de cause.

## Contradictions et doublons

- **C1 [Bloquant] [Vincent]** — D6 contredit le raisonnement de D7 et produit des résultats faux.
  - Le *Pourquoi* de D6 (« absente du fichier ne veut pas dire absente, L'Île-d'Yeu ») ne tient pas pour la gare : l'île n'a pas de train, et pourtant elle passerait « Gare à 5 min », alors que Bréhat (9,4 min) serait écartée. D7 écarte la Corse parce que ses communes « passeraient à tort » ; le même argument vaut pour les 18 communes sans temps de gare (`mesures.md:23-26` : 378 − 360).
  - Les 10 communes sans aucun carreau passent **toutes** les combinaisons de services. Six sont les villages détruits de la Meuse, à **0 habitant** (55039, 55050, 55139, 55189, 55239, 55307). Avec Suzan et Villefranche-le-Château, huit ont un loyer de 7,80 à 9,60 €/m², soit 406 à 499 € pour 52 m² : plus le filtre est strict, plus elles montent dans les 10 premières. Une commune sans habitant en tête d'une recherche « tout à 5 min » est le défaut que la leçon du 2026-10-14 demande de chercher. Position exacte non mesurée.
  - Conséquence : les filtres de services seuls ne peuvent jamais mener à **aucune commune**, contrairement à ce que laisse entendre `details.md:25`.
  - Proposition : garder D6 pour les communes habitées dont l'équipement existe sans doute ; écarter d'un filtre de service les communes à 0 habitant ; traiter la gare des îles sans pont comme la Corse (« aucune sur l'île »). AC-9 et AC-10 (Rhinval, non insulaire) resteraient vrais.
- **C2 [Majeur] [Vincent]** — La phrase des îles (H159) affirme ce que les mesures contredisent. Elle dit « un temps vers le continent compte la traversée ». Or `mesures.md:47` dit « **parfois** » et cite la notice de l'Insee, selon laquelle les ferries ne sont pas pris en compte « pour les îles de manière générale ». Sur L'Île-d'Yeu, exemple de la vérification (`details.md:108`), le temps vers le continent n'existe pas ; Île-de-Sein et Île-Molène auraient 7 « pas de chiffre » suivis de cette phrase. — Proposition : établir le fait en tâche 0, puis une phrase prudente (« peut compter la traversée, sans l'attente »), absente des communes sans aucun temps.
- **C3 [Majeur]** — H165 se contredit, et contredit `spec.md:26`. Elle veut des fichiers « figés (date et empreinte) » tout en ne les téléchargeant pas : on ne peut pas calculer l'empreinte d'un fichier de 14 Go qu'on ne récupère pas. Et « Questions ouvertes : aucune » cohabite avec « ce choix revient à Vincent ». — Proposition : figer l'ETag, la date et la taille des 13 fichiers distants, plus l'empreinte de l'extrait ; faire passer le choix en question ouverte ou en D-n (voir D2).
- **C4 [Moyen] [Vincent]** — « 6 règles » (`spec.md:24`) : compté en comportements d'une phrase, il y en a environ 13 (6 services à pastilles, niveau de gare, temps médian, filtre, sans chiffre, Corse, raisons, 7 temps, « plus d'une heure », limites, îles, adresse, mention), soit le double de la limite perso. — Proposition : l'assumer par écrit, ou reporter un morceau (la grande gare ou la phrase des îles).
- **C5 [Moyen]** — Les 180 Ko de H162 ne couvrent pas le format imposé. 647 Ko pour 34 746 communes font 18,6 octets par ligne : les 7 temps seuls, sans code INSEE. Or le projet joint toujours par code (`joindreBords`, « jamais par position »). Avec un code par ligne : environ +278 Ko bruts, soit environ 925 Ko ; le poids compressé reste à mesurer face à la limite de 300 Ko. — Proposition : refaire la mesure avec les codes.
- **C6 [Moyen] [Vincent]** — H163 fixe 100 ms, mais le geste témoin existant prend déjà 160 ms dans les conditions de mesure d'emploi (processeur ralenti 4 fois, `mesure-tache-0.md:168-170`). Dans ces conditions, la tâche 0 s'arrête à coup sûr. — Proposition : un écart au témoin (par exemple + 30 ms au plus), conditions écrites.
- **C7 [Mineur]** — Doublons susceptibles de diverger : les libellés dans R51 et H153, les noms d'adresse dans R55 et H155. — Proposition : un seul endroit, l'autre y renvoie.

## Impact sur les tranches existantes

- **I1 [Moyen]** — Le bloc « Tes proches » de la fiche n'est pas classé : la ligne « proches, proches-fiables » (`details.md:70`) ne couvre que la catégorie des réglages et R11. — Proposition : une ligne « bloc de la fiche : inchangé, reste juste sous le chômage » (lié à M1).
- **I2 [Moyen]** — `tests/e2e/lib/carte.ts`, partagé par tous les tests, doit servir les temps, mais le tableau ne le dit pas. Sans route, chaque test chargerait le vrai fichier de 34 746 lignes, ou la page tomberait en erreur (H162). Et ce fichier joint par code : les « 5 communes », qui ont les mêmes codes, recevraient des temps, alors que `details.md:72` les veut « sans temps ». STATE.md signale déjà que le garde-fou n'a pas demandé l'accord pour ce fichier. — Proposition : une ligne d'impact, et l'accord de Vincent en /breakdown.
- **I3 [Mineur]** — R20 et H53 d'interface-telephone (champ d'adresse, défilement de « Critères ») ne sont pas classées, alors qu'une catégorie s'ajoute sous ce champ ; emploi avait classé R20. — Proposition : « Inchangée », à revérifier avec `telephone-feuille.spec.ts:527-541`.

## Critères non testables

- **AC-12 [Moyen]** — Le `when` contient « puis repliée « Services » » : phrase sans verbe d'action, à corriger **avant** validation, car ce texte devient ensuite protégé. — Proposition : « puis replie « Services » ».
- **AC-5 [Moyen]** — Ne couvre ni le carreau sans temps (M2) ni le carreau à cheval sur deux communes (H157), et ne dit pas où il s'exécute : le calcul est en Python, les commandes de test sont Vitest et Playwright. — Proposition : ajouter les deux cas ; fixer le lieu d'exécution en /breakdown.
- **« C'est réussi si » et vérification, étape 1 [Mineur]** — « La fiche d'Auch donne ses 7 temps » ne donne aucune valeur. `mesures.md:36` permet de les écrire, sauf le collège (2,5 à une décimale : 2 ou 3 selon la valeur exacte). — Proposition : écrire les 7 valeurs lues sur le fichier servi.
- **Cas limite sans critère [Mineur]** — « Commune sans aucun carreau » (`details.md:47`) : aucune commune de la fixture n'a ses 7 temps à `null`. — Proposition : l'ajouter à une variante, ou à AC-6.

## Hors sujet pour une spec

- **[Mineur]** — H165 : la version « DuckDB 2.0.0 » et la façon de lire les fichiers relèvent de /breakdown ; seule la décision d'accepter la dépendance appartient à la spec.
- **[Mineur]** — `details.md:74` : la consigne sur les tests « sans `exact` » est un détail de construction, à déplacer dans le plan (et déjà vérifiée pour « Médecin », voir plus haut).

## Couverture

Règles sans AC : aucune · Décisions sans effet vérifiable : D2 [Moyen] (le vrai fichier n'est prouvé que par la vérification de bout en bout, sans critère sur les vraies données, alors qu'emploi avait AC-12) · Décisions sans *Pourquoi* : D4 et D9 [Mineur] (leur *Pourquoi* se limite à « Vincent ») · Zones sans état initial : aucune (niveau de gare ouvert par un lien : voir M9) · AC qui dépendent d'un service non simulé : aucun · Mots de spec.md : environ 500 (environ 580 en comptant chaque signe isolé), sous la limite de 550

## Décisions à demander à Vincent

1. **C1** — Que devient « pas de chiffre » pour les communes à 0 habitant et pour la gare des îles ?
2. **D1** — Une épicerie compte-t-elle comme commerce, une maternelle seule comme école ?
3. **D2 et C3** — Accepter DuckDB, et sous quelle forme ?
4. **C2** — Que dit-on des traversées, une fois le fait établi ?
5. **M3** — Quelles 10 communes, et qu'est-ce qu'un temps « faux » ?
6. **C4** — Garder la tranche entière (environ 13 comportements) ou en reporter un morceau ?
7. **D3 et C6** — Crans de 30 min presque sans effet, et seuil de réaction réaliste.
