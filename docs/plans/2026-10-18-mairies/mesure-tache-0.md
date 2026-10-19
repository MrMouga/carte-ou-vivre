# Mesures de la tâche 0 — mairies
2026-10-18, 18:31-18:50 · `scripts/data/mairies.py` sur les fichiers ci-dessous · preuves brutes dans [captures/](captures/) (`T0-*`)

## Sources et empreintes
- **Résultats** (H116) : data.gouv.fr, ministère de l'Intérieur, Licence Ouverte, ressource « Résultats - Communes » de chaque jeu ; téléchargés par `scripts/data/sources.py` le 2026-10-18 à 18:32, empreinte notée dans `data-raw/<fichier>.info.json`, vérifiée par `mairies.py` (et écrite dans `CLAUDE.md`).

| Tour | Jeu (id) · ressource (id) | Fichier | Last-Modified | Octets | sha256 |
|---|---|---|---|---|---|
| premier | « Elections municipales 2026 - Résultats du premier tour » (69b82a7de5d58cc06ad35ce0) · « Municipales 2026 - Résultats - Communes_2026-03-20.csv » (4feeef01-24f7-4d5a-914f-8aa806f31ec2), mise à jour du 20/03/2026 16:43 | `municipales-2026-resultats-communes-2026-03-20.csv` | Thu, 02 Jul 2026 16:44:15 GMT | 14 423 228 | `bc17b6186012da734d5073f3fe95cdcac4cef1c26fe512d50b578cea85b61275` |
| second | « Elections municipales 2026 - Résultats du second tour » (69c17fed9f18c7781fd11a14) · « Municipales 2026 - Résultats - Communes_2026-03-23_16h14.csv » (6ff67a28-01bf-459e-beca-dd7aa8132dc1), mise à jour du 23/03/2026 18:01 | `municipales-2026-resultats-communes-2026-03-23-16h14.csv` | Thu, 02 Jul 2026 16:44:12 GMT | 893 849 | `f83bc07995a75b1602186c0159aace3f3520e72ce6d9bf6f8aac0b4b8a25b69a` |

Le Last-Modified (2 juillet) est celui du serveur de fichiers de data.gouv.fr, pas une mise à jour : la taille est celle annoncée par data.gouv.fr pour les ressources du 20 et du 23 mars, et leur adresse contient leur date de dépôt.
- Format : CSV séparé par `;`, UTF-8, une ligne par commune (France entière, outre-mer compris : départements 97x et 98x écartés), 18 colonnes de la commune puis 13 par liste (« Nuance liste n », « Libellé de liste n », « Voix n », « Sièges au CM n »…). Le nom de liste retenu est « Libellé de liste » (pas « Libellé abrégé de liste »).
- **Blocs** (H117) : circulaire du 2 février 2026 (n° 45645), `data-raw/cir_45645.pdf` déposé par Vincent, 14 pages. Annexe 2 « Grille des nuances de listes » pages 9 et 10, annexe 3 « Grilles de regroupement des nuances politiques par blocs de clivages » page 12 (« Nuances de listes »). Ces pages sont des images scannées : le texte de `pdftotext -layout` est une reconnaissance de caractères avec des fautes (« Extreme gauche », « Génératfbn.s », « resroupement ») et, en annexe 3, ne place pas les blocs en face de leurs lignes. **La table a donc été lue sur l'image des pages** (`pdftoppm`, 130 et 300 ppp), le texte reconnu servant de contrôle.

## Table des nuances (`scripts/data/nuances-2026.csv`)
25 nuances de listes, 6 blocs. Étiquettes recopiées de l'annexe 2, blocs de l'annexe 3 (EXG, GAU, DIV, CENT, DTE, EXD → noms de H108).

| Code | Étiquette (annexe 2) | Bloc (annexe 3) | Page |
|---|---|---|---|
| LEXG | Extrême gauche | extrême gauche (EXG) | 9 |
| LFI | La France insoumise | extrême gauche (EXG) | 9 |
| LCOM | Parti communiste français | gauche (GAU) | 9 |
| LSOC | Parti socialiste | gauche (GAU) | 9 |
| LVEC | Les Écologistes | gauche (GAU) | 9 |
| LUG | Union de la gauche | gauche (GAU) | 9 |
| LDVG | Divers gauche | gauche (GAU) | 9 |
| LECO | Ecologiste | divers (DIV) | 9 |
| LREG | Régionalistes | divers (DIV) | 9 |
| LDIV | Divers | divers (DIV) | 9 |
| LREN | Renaissance | centre (CENT) | 9 |
| LMDM | Modem | centre (CENT) | 9 |
| LHOR | Horizons | centre (CENT) | 9 |
| LUDI | Union des Démocrates et Indépendants | centre (CENT) | 9 |
| LUC | Union du centre | centre (CENT) | 9 |
| LDVC | Divers centre | centre (CENT) | 9 |
| LLR | Les Républicains | droite (DTE) | 10 |
| LUD | Union de la droite | droite (DTE) | 10 |
| LDVD | Divers droite | droite (DTE) | 10 |
| LDSV | Droite souverainiste | droite (DTE) | 10 |
| LUDR | Union des droites pour la République | extrême droite (EXD) | 10 |
| LRN | Rassemblement National | extrême droite (EXD) | 10 |
| LREC | Reconquête | extrême droite (EXD) | 10 |
| LUXD | Union de l’extrême droite | extrême droite (EXD) | 10 |
| LEXD | Extrême droite | extrême droite (EXD) | 10 |

Écrits tels que dans l'annexe : « Ecologiste » sans accent, « Rassemblement National » avec N majuscule, « Union de l’extrême droite » avec l'apostrophe typographique. LDVD, LDVG, LUG et LRN sont dans la grille ; « Divers droite » et « Union de la gauche » s'écrivent comme dans AC-11.
**À signaler (sans arrêt, plan)** : la fixture e2e écrit « Rassemblement national » (n minuscule) ; l'annexe écrit « Rassemblement National ». La fixture est inventée et servie par `carte.ts` : AC-5 garde son texte. « Divers » est écrit pareil.

## Sortie des contrôles de `mairies.py`
Copie de `captures/T0-controles-mairies.txt` (2026-10-18 18:36, `python3 -I scripts/data/mairies.py`) :
```
  ok   table des nuances : 25 nuances de listes (annexe 2), chacune dans un des 6 blocs (annexe 3)
premier tour : municipales-2026-resultats-communes-2026-03-20.csv, Last-Modified Thu, 02 Jul 2026 16:44:15 GMT, téléchargé le 2026-10-18T18:32:42+02:00, 14423228 octets, sha256 bc17b6186012da734d5073f3fe95cdcac4cef1c26fe512d50b578cea85b61275
  ok   premier tour : empreinte égale à celle retenue (CLAUDE.md) et à celle notée
  ok   municipales-2026-resultats-communes-2026-03-20.csv : colonnes attendues
second tour : municipales-2026-resultats-communes-2026-03-23-16h14.csv, Last-Modified Thu, 02 Jul 2026 16:44:12 GMT, téléchargé le 2026-10-18T18:32:43+02:00, 893849 octets, sha256 f83bc07995a75b1602186c0159aace3f3520e72ce6d9bf6f8aac0b4b8a25b69a
  ok   second tour : empreinte égale à celle retenue (CLAUDE.md) et à celle notée
  ok   municipales-2026-resultats-communes-2026-03-23-16h14.csv : colonnes attendues
  ok   34746 communes sur la carte
premier tour : 34672 communes de métropole ; second tour : 1445
codes de métropole des fichiers absents de communes.json : 0 []
  ok   H121 : tout code de métropole des fichiers existe dans communes.json
  ok   toute commune du second tour est aussi au premier
communes du second tour qui ont des sièges au premier : 0 []
communes de la carte absentes des deux fichiers : 74 (attendu 74)
nuances des fichiers : (vide), LCOM, LDIV, LDSV, LDVC, LDVD, LDVG, LECO, LEXD, LEXG, LFI, LHOR, LLR, LMDM, LREC, LREG, LREN, LRN, LSOC, LUC, LUD, LUDI, LUDR, LUG, LUXD, LVEC
  ok   toute nuance non vide des fichiers est dans la table (hors table : [])
communes présentes mais sans liste avec un siège : 0 []
égalités de sièges, départagées par les voix (H115) : 4 [('02779', 'Vénérolles'), ('55104', 'Chassey-Beaupré'), ('55414', 'Rancourt-sur-Ornain'), ('89255', 'Michery')]
mairies avec étiquette dans une commune de moins de 3500 habitants (chefs-lieux attendus) : 15
  ok   D8 : toute mairie sans étiquette est dans une commune de moins de 3500 habitants ([])
  ok   AC-12 : communes 34746 (attendu 34746)
  ok   AC-12 : avec mairie 34672 (attendu 34672)
  ok   AC-12 : sans résultat 74 (attendu 74)
  ok   AC-12 : avec étiquette 3164 (attendu 3164)
  ok   AC-12 : sans étiquette 31508 (attendu 31508)
  ok   AC-12 : codes non reliés 0 (attendu 0)
  ok   AC-12 : égalités de sièges 4 (attendu 4)
mairies par bloc : extreme-gauche 7, gauche 753, divers 561, centre 571, droite 1212, extreme-droite 60, sans étiquette 31508
écrit : public/data/mairies.json (1526497 octets)
écrit : public/data/nuances.json (1475 octets)
```
« Aucune à cause d'un code non relié » (AC-12) : les 74 sans résultat sont des communes de la carte absentes des deux fichiers ; aucun code des fichiers n'est hors de la carte (0), aucune commune présente n'est sans liste élue (0). Le second tour ne concerne que des communes sans aucun siège au premier : « second tour sinon premier » ne mélange jamais deux tours.

## Mairies par bloc (34 746 communes)
| Bloc | Mairies | Nuances des mairies |
|---|---|---|
| Extrême gauche | 7 | LFI 7 |
| Gauche | 753 | LDVG 556, LUG 138, LSOC 37, LCOM 19, LVEC 3 |
| Divers | 561 | LDIV 544, LREG 9, LECO 8 |
| Centre | 571 | LDVC 529, LUC 27, LUDI 11, LMDM 2, LREN 1, LHOR 1 |
| Droite | 1 212 | LDVD 1 098, LLR 84, LUD 29, LDSV 1 |
| Extrême droite | 60 | LRN 42, LUXD 11, LEXD 5, LUDR 2 |
| Sans étiquette | 31 508 | (nuance vide) |
| Sans résultat | 74 | — |

Aucune mairie LEXG ni LREC. Les 7 mairies d'extrême gauche sont toutes LFI (coût accepté par D2).

## 10 villes
| Ville | Bloc | Étiquette (nuance) | Liste | Tour retenu, sièges |
|---|---|---|---|---|
| Paris (75056) | gauche | Union de la gauche (LUG) | « Paris est à vous! avec Emmanuel Grégoire L'union de la gauche et des écologistes » | second, 103 sièges sur 163 ; suivante 51 |
| Lyon (69123) | gauche | Divers gauche (LDVG) | « POUR VIVRE LYON, L'UNION DE LA GAUCHE ET DES ECOLOGISTES AVEC GREGORY DOUCET » | second, 46 sur 73 ; suivante 27 |
| Marseille (13055) | gauche | Union de la gauche (LUG) | « POUR MARSEILLE, LA GAUCHE, LES ECOLOGISTES ET LES CITOYENS RASSEMBLES » | second, 73 sur 111 ; suivante 34 |
| Bordeaux (33063) | centre | Union du centre (LUC) | « Faire Gagner Bordeaux » | second, 49 sur 65 ; suivante 16 |
| Nice (06088) | extrême droite | Union de l’extrême droite (LUXD) | « LE MEILLEUR EST A VENIR AVEC ERIC CIOTTI » | second, 52 sur 69 ; suivante 13 |
| Perpignan (66136) | extrême droite | Rassemblement National (LRN) | « CONTINUONS ENSEMBLE AVEC LOUIS ALIOT » | premier, 43 sur 55 ; suivante 4 |
| Toulouse (31555) | droite | Divers droite (LDVD) | « Avec Jean-Luc MOUDENC, Protégeons l'Avenir de Toulouse » | second, 53 sur 69 ; suivante 16 |
| Nantes (44109) | gauche | Divers gauche (LDVG) | « La gauche unie pour Nantes » | second, 53 sur 69 ; suivante 16 |
| Lille (59350) | gauche | Union de la gauche (LUG) | « TOUT POUR LILLE DEMAIN » | second, 47 sur 61 ; suivante 10 |
| Strasbourg (67482) | gauche | Divers gauche (LDVG) | « Pour Strasbourg » | second, 45 sur 65 ; suivante 10 |

À noter : Lyon change de nuance entre les tours (LUG au premier, LDVG au second, même liste) ; la fiche dira « Gauche (Divers gauche) ». Paris, Lyon, Marseille : la ligne de la commune entière (le fichier des communes), pas les conseils d'arrondissement.

## Les 10 premières de chaque bloc à `/?loyer=1200&mairie=<bloc>`
Calculées avec le code du site (`evaluer` de `src/domain/score.ts`, réglages et prix de départ, achats joints par `joindreAchats`), sur les fichiers servis ; le filtre de mairie écarte sans noter (R38), donc la liste est le classement de départ réduit au bloc. Script : `captures/T0-mesure-10-premieres.test.ts.txt` ; sortie : `captures/T0-10-premieres-par-bloc.txt`. Au départ, 34 674 communes sont classées. Format : rang · commune (dép., code) · score · loyer pour 52 m² · population · étiquette · liste.

**Extrême gauche** (7 classées)
1. Roubaix (59, 59512) · 43 · 690 € · 98 286 hab. · La France insoumise · « FIERS DE ROUBAIX »
2. Saint-Fons (69, 69199) · 40 · 725 € · 19 285 hab. · La France insoumise · « SAINT FONS INSOUMISE »
3. Creil (60, 60175) · 36 · 764 € · 36 301 hab. · La France insoumise · « Creil l'insoumise »
4. Vénissieux (69, 69259) · 36 · 765 € · 65 502 hab. · La France insoumise · « FAISONS MIEUX POUR VENISSIEUX »
5. Vaulx-en-Velin (69, 69256) · 32 · 813 € · 53 069 hab. · La France insoumise · « VAULX EN COMMUN AVEC ABDELKADER LAHMAR »
6. La Courneuve (93, 93027) · 17 · 991 € · 47 167 hab. · La France insoumise · « Nous La Courneuve en toujours plus grand ! »
7. Saint-Denis (93, 93066) · 9 · 1 091 € · 149 077 hab. · La France insoumise · « Ensemble, retrouvons l'Espoir »

**Gauche** (741 classées)
1. Clamecy (58, 58079) · 69 · 378 € · 3 544 hab. · Divers gauche · « Clamecy tous unis pour l'avenir »
2. Nouzonville (08, 08328) · 69 · 378 € · 5 523 hab. · Divers gauche · « 100% NOUZON »
3. Bogny-sur-Meuse (08, 08081) · 68 · 381 € · 4 889 hab. · Divers gauche · « BOGNY 2026 »
4. Saint-Germain-du-Corbéis (61, 61397) · 66 · 404 € · 3 636 hab. · Divers gauche · « COLLECTIF CITOYEN POUR LES CORBENOIS »
5. Revin (08, 08363) · 66 · 414 € · 5 716 hab. · Divers gauche · « REVIN, Dynamique Engagée »
6. Courpière (63, 63125) · 65 · 423 € · 4 166 hab. · Divers gauche · « Avec vous pour Courpière »
7. Aubusson (23, 23008) · 64 · 428 € · 3 018 hab. · Divers gauche · « AUBUSSON, UNE ÉQUIPE, UN AVENIR »
8. Champagney (70, 70120) · 64 · 429 € · 3 647 hab. · Divers gauche · « Agir ensemble pour l'avenir de Champagney »
9. Sanvignes-les-Mines (71, 71499) · 64 · 430 € · 4 235 hab. · Divers gauche · « SANVIGNES AU COEUR DE NOS VIES »
10. Ambert (63, 63003) · 64 · 432 € · 6 517 hab. · Divers gauche · « Ambert 2026 : faire équipe pour changer »

**Divers** (560 classées)
1. Saint-Mihiel (55, 55463) · 66 · 408 € · 3 772 hab. · Divers · « SAINT-MIHIEL, FIERTE PARTAGEE »
2. Digoin (71, 71176) · 66 · 410 € · 7 353 hab. · Divers · « Génération DIGOIN »
3. Chauffailles (71, 71120) · 66 · 414 € · 3 638 hab. · Divers · « CHAUFFAILLES, UN PROJET POUR TOUS »
4. Bellac (87, 87011) · 65 · 417 € · 3 537 hab. · Divers · « BELLAC AU COEUR »
5. Mauriac (15, 15120) · 65 · 420 € · 3 449 hab. · Divers · « ENSEMBLE AGIR POUR MAURIAC »
6. Vouziers (08, 08490) · 65 · 420 € · 3 825 hab. · Divers · « VISIONS POUR L'ESSENTIEL »
7. Montreuil-Bellay (49, 49215) · 65 · 423 € · 3 746 hab. · Divers · « Avec vous, Naturellement »
8. Domfront en Poiraie (61, 61145) · 65 · 424 € · 4 113 hab. · Divers · « Bien vivre ensemble à Domfront en Poiraie »
9. Châtillon-sur-Seine (21, 21154) · 64 · 427 € · 5 443 hab. · Divers · « CHATILLON, UNE NOUVELLE ENERGIE »
10. Commercy (55, 55122) · 64 · 428 € · 5 350 hab. · Divers · « Une Nouvelle Energie Pour Commercy »

**Centre** (561 classées)
1. Le Blanc (36, 36018) · 66 · 409 € · 6 164 hab. · Divers centre · « le Blanc Ville d'Avenir »
2. Charlieu (42, 42052) · 64 · 429 € · 3 766 hab. · Renaissance · « AVEC VOUS POUR CHARLIEU »
3. Decazeville (12, 12089) · 64 · 430 € · 5 020 hab. · Divers centre · « POUR DECAZEVILLE, PLUS LOIN ENSEMBLE »
4. Sévérac d'Aveyron (12, 12270) · 64 · 434 € · 4 026 hab. · Divers centre · « AVENIR SEVERAC »
5. Melle (79, 79174) · 63 · 440 € · 5 752 hab. · Divers centre · « MELLE EN COMMUN »
6. Folschviller (57, 57224) · 63 · 441 € · 3 916 hab. · Divers centre · « Ensemble pour Folschviller »
7. Valdallière (14, 14726) · 63 · 447 € · 5 696 hab. · Divers centre · « 14 communes écoutées, un avenir à partager »
8. Amplepuis (69, 69006) · 63 · 448 € · 4 876 hab. · Divers centre · « Amplepluis, cap sur l'avenir » (faute de frappe du fichier, gardée : H114)
9. Évron (53, 53097) · 63 · 449 € · 8 252 hab. · Union des Démocrates et Indépendants · « EVRON, MODERNE PAR NATURE »
10. Condé-en-Normandie (14, 14174) · 62 · 451 € · 5 985 hab. · Divers centre · « Fiers d'Agir Pour Condé en Normandie »

**Droite** (1 174 classées)
1. Cours (69, 69066) · 69 · 374 € · 4 306 hab. · Divers droite · « L'avenir de Cours, notre engagement ! »
2. Tinchebray-Bocage (61, 61486) · 68 · 383 € · 4 813 hab. · Divers droite · « TINCHEBRAY BOCAGE À CŒUR »
3. Mirecourt (88, 88304) · 67 · 395 € · 4 700 hab. · Divers droite · « Nathalie BABOUHOT - Mirecourt Ensemble »
4. Rambervillers (88, 88367) · 67 · 397 € · 5 018 hab. · Divers droite · « Rambervillers au coeur de l'action »
5. Ytrac (15, 15267) · 66 · 404 € · 4 339 hab. · Divers droite · « YTRAC AGIR ENSEMBLE »
6. Bar-sur-Aube (10, 10033) · 66 · 406 € · 4 665 hab. · Divers droite · « Bar-sur-Aube J'y crois réussir notre ville de demain »
7. Saint-Florentin (89, 89345) · 66 · 411 € · 4 164 hab. · Divers droite · « Force, Compétence, Envie au service de Saint-Florentin Avrolles »
8. Buzançais (36, 36031) · 66 · 412 € · 4 356 hab. · Divers droite · « UNIS PAR NOS VALEURS, ENGAGÉS POUR BUZANÇAIS »
9. Ligny-en-Barrois (55, 55291) · 66 · 414 € · 3 677 hab. · Divers droite · « CAP AVENIR LIGNY »
10. Nogent (52, 52353) · 65 · 421 € · 3 550 hab. · Divers droite · « Nogent Ensemble »

**Extrême droite** (60 classées)
1. Thizy-les-Bourgs (69, 69248) · 67 · 395 € · 5 771 hab. · Union de l’extrême droite · « Ensemble, Réveillons Thizy-les-Bourgs ! »
2. Vierzon (18, 18279) · 61 · 467 € · 25 068 hab. · Union de l’extrême droite · « Un souffle nouveau pour Vierzon : sécurité et mieux vivre ! »
3. Houdain (62, 62457) · 57 · 517 € · 6 945 hab. · Rassemblement National · « UN NOUVEL ELAN POUR HOUDAIN »
4. Saint-Avold (57, 57606) · 57 · 519 € · 14 755 hab. · Rassemblement National · « RASSEMBLEMENT POUR SAINT-AVOLD »
5. Castres (81, 81065) · 57 · 520 € · 42 505 hab. · Rassemblement National · « POUR L'AVENIR DE CASTRES »
6. La Flèche (72, 72154) · 56 · 530 € · 14 947 hab. · Rassemblement National · « Rassemblement pour La Flèche »
7. Lillers (62, 62516) · 56 · 531 € · 10 193 hab. · Rassemblement National · « Un nouveau souffle pour Lillers ! »
8. Bagnols-sur-Cèze (30, 30028) · 55 · 537 € · 18 112 hab. · Rassemblement National · « SÉCURITÉ ET VITALITÉ POUR BAGNOLS ! »
9. Moissac (82, 82112) · 55 · 541 € · 13 419 hab. · Rassemblement National · « POUR MOISSAC GARDONS LE CAP »
10. Aubignan (84, 84004) · 55 · 544 € · 5 981 hab. · Rassemblement National · « Aubignan avant tout »

**Sans étiquette** (31 497 classées) — les dix ont le même loyer (326 €) et le même score (73) : ordre alphabétique (H4)
1. Allarmont (88, 88005) · 214 hab. · « Sylvie ROUGIER » (un nom de personne comme nom de liste : coût accepté par D6)
2. Bréménil (54, 54097) · 92 hab. · « ENSEMBLE POUR BREMENIL »
3. Celles-sur-Plaine (88, 88082) · 737 hab. · « Liste d'entente et d'intérêt communal »
4. La Petite-Raon (88, 88346) · 734 hab. · « La Petite Raon, un village qui avance »
5. Luvigny (88, 88277) · 123 hab. · « Luvigny 2032 »
6. Moussey (88, 88317) · 548 hab. · « Ensemble pour l'avenir de MOUSSEY »
7. Neufmaisons (54, 54396) · 208 hab. · « TOUS ENSEMBLE »
8. Pexonne (54, 54423) · 326 hab. · « Pexonne tous unis »
9. Raon-lès-Leau (54, 54443) · 40 hab. · « RAON LES LEAU AGIR ENSEMBLE »
10. Raon-sur-Plaine (88, 88373) · 135 hab. · « UNIVERS RAON »

Lecture : en tête des blocs gauche, divers, centre et droite, des petites villes à loyer bas (3 000 à 8 300 habitants), nuancées surtout « Divers … » ; en extrême gauche et extrême droite, des villes plus grandes (Roubaix, Vierzon, Castres). Les 15 communes de moins de 3 500 habitants nuancées (chefs-lieux d'arrondissement, ci-dessous) remontent dans les blocs (Aubusson 7e à gauche, Mauriac 5e en divers).

## Les 74 sans résultat
Absentes des deux fichiers (aucune commune présente n'est sans élu). Le fichier ne dit pas pourquoi ; ce qu'on en sait sans autre source :
- **6** « villages morts pour la France » de la Meuse, population 0, sans conseil municipal (une commission nommée par le préfet) : Beaumont-en-Verdunois (55039), Bezonvaux (55050), Cumières-le-Mort-Homme (55139), Fleury-devant-Douaumont (55189), Haumont-près-Samogneux (55239), Louvemont-Côte-du-Poivre (55307).
- **68** autres, de 29 à 1 471 habitants : vraisemblablement **sans candidat** (aucune liste déposée), non vérifié ici (seuls les deux fichiers de résultats pouvaient être téléchargés) : Boz (01057), Billezois (03028), Le Bouchaud (03035), Bayons (04023), Saint-Clément (07226), Le Châtelet-sur-Retourne (08111), Asprières (12012), Saint-Jacques-des-Blats (15192), La Chapelotte (18051), Saillac (19179), Labergement-Foigney (21330), Cohiniac (22045), Le Merzer (22150), Pont-Melvez (22249), Lavaufranche (23104), Pontarion (23155), Vigeville (23262), Chapelle-d'Huin (25122), Dompierre-les-Tilleuls (25202), La Planée (25459), Rochejean (25494), Saules (25535), Fatouville-Grestain (27233), Île-Molène (29084), Trèves (30332), Cardroc (35050), Fléré-la-Rivière (36074), Sazilly (37244), Chantesse (38074), Lavaldens (38207), La Boissière (39062), Pillemoine (39419), Arthun (42009), Gumières (42107), Nollieux (42160), Saint-Polgues (42274), Blassac (43031), Albaret-le-Comtal (48001), Saussemesnil (50567), Cirfontaines-en-Ornois (52131), Mirbel (52326), Orbigny-au-Mont (52362), Tornay (52493), Saint-Loup-du-Dorat (53233), Franconville (54209), Verneuil-Petit (55547), La Grée-Saint-Laurent (56068), Hestroff (57322), Sermages (58277), Bienville (60070), Nédon (62600), Espinasse (63152), La Sauvetat (63413), Artalens-Souin (65036), Ayzac-Ost (65056), Villenave-près-Marsac (65477), Rothau (67414, 1 471 hab.), Fréland (68097, 1 288 hab.), Bougey (70078), Percey-le-Grand (70406), Raincourt (70436), Recologne (70440), Vernois-sur-Mance (70548), Lacrost (71248), Cogners (72085), Mont-Saint-Jean (72211), Lissy (77253), Longuevillette (80491).

## Les 4 égalités de sièges (H115)
Toutes au premier tour, toutes sans étiquette ; la liste qui a le plus de voix l'emporte.

| Commune | Pop. | Listes (voix, sièges) | Retenue |
|---|---|---|---|
| Vénérolles (02779) | 229 | « Plus qu'une équipe, une vision partagée » 59 voix, 11 ; « ENSEMBLE POUR VENEROLLES » 90 voix, 11 | « ENSEMBLE POUR VENEROLLES » |
| Chassey-Beaupré (55104) | 94 | « ENSEMBLE POUR CHASSEY BEAUPRE » 28, 7 ; « CHASSEY » 29, 7 | « CHASSEY » |
| Rancourt-sur-Ornain (55414) | 180 | « MUNICIPALE 2026 RANCOURT SUR ORNAIN » 50, 11 ; « Agir ensemble pour Rancourt » 65, 11 | « Agir ensemble pour Rancourt » |
| Michery (89255) | 1 078 | « Unis pour Michery » 201, 1 ; « VIVRE MICHERY » 377, 1 | « VIVRE MICHERY » |

À signaler : ces sièges sont étranges tels que le fichier les donne. À Vénérolles, Chassey-Beaupré et Rancourt-sur-Ornain, chaque liste a autant de sièges que tout le conseil (11, 7, 11) ; à Michery (1 078 habitants), deux sièges seulement pour un conseil de 15, et pas de second tour dans le fichier. Le fichier est pris tel quel (H116 : pas de rectification suivie) ; la règle de H115 donne la liste qui a le plus de voix. Quatre villages sans étiquette : sans effet sur un bloc.

## Les 15 communes de moins de 3 500 habitants avec une étiquette
Chefs-lieux d'arrondissement (D8, attendus) : Nantua (01269) Divers droite ; Vervins (02789) Divers centre ; Barcelonnette (04019) Divers droite ; Castellane (04039) Divers droite ; Largentière (07132) Divers droite ; Mauriac (15120) Divers ; Confolens (16106) Divers droite ; Aubusson (23008) Divers gauche ; Nontron (24311) Divers droite ; Mirande (32256) Divers ; Florac Trois Rivières (48061) Divers ; Château-Chinon (Ville) (58062) Divers gauche ; Montreuil-sur-Mer (62588) Divers droite ; Argelès-Gazost (65025) Divers centre ; Charolles (71106) Divers droite.

## Poids
| Fichier | Brut | gzip -9 | brotli -q 11 | Reçu de `vite preview` (gzip) |
|---|---|---|---|---|
| `mairies.json` | 1 526 497 o (1,53 Mo) | 457 860 o | 356 655 o | 462 971 o |
| `nuances.json` | 1 475 o | 447 o | 393 o | 439 o |
| `achat.json` (pour comparer) | 1 435 241 o | 232 395 o | 169 379 o | 245 540 o |

Conforme à l'estimation (1,5 Mo, 450 Ko). Compressé, `mairies.json` pèse **près du double** d'`achat.json` (les noms de liste se compressent moins bien que des prix).

## Temps de chargement ajouté (« Fast 4G »)
`npx vite preview` (version construite, gzip), Chromium de Playwright, réseau ralenti par le protocole DevTools au profil « Fast 4G » de Chromium (9 Mbit/s × 0,9 en descente = 1 012 500 o/s, 1,5 Mbit/s × 0,9 en montée, latence 60 ms × 2,75 = 165 ms), cache coupé ; dans la page, `fetch` puis `.json()` comme `lire` d'`App.tsx`, les fichiers d'un même jeu en parallèle comme `Promise.all` de `charger()` ; 7 essais par jeu en alternance, médiane. 2026-10-18 18:40, charge 2,2. Script : `captures/T0-mesure-chargement.mjs` ; sortie : `captures/T0-chargement-fast4g.txt`.

| Ce qui est chargé | Médiane | Essais (ms) |
|---|---|---|
| `achat.json` seul | 430 ms | 437 427 429 432 432 430 427 |
| `mairies.json` seul | 644 ms | 647 644 648 648 640 643 639 |
| `nuances.json` seul | 177 ms | 179 177 176 177 177 173 178 |
| `mairies.json` + `nuances.json` | 648 ms | 649 642 648 652 646 649 647 |
| Chargement actuel : communes + repères + achat | 1 838 ms | 1840 1843 1837 1839 1838 1833 1835 |
| Avec les mairies : + mairies + nuances | 2 298 ms | 2293 2298 2302 2298 2299 2298 2300 |

**Chargement ajouté : 460 ms** (2 298 − 1 838), sous le seuil de 500 ms du plan, mais près. C'est le temps de passer 463 Ko à 1 Mo/s : la latence et `nuances.json` se cachent derrière les autres fichiers. Seul, `mairies.json` coûte 214 ms de plus qu'`achat.json` (644 contre 430). Non mesuré : la compression du site en ligne (Cloudflare) ; en brotli, `mairies.json` pèserait 357 Ko, soit ≈ 350 ms ajoutées au même débit (estimation, pas une mesure).

## Réaction de la carte quand ~34 000 communes se décolorent
Substitut du plan : le filtre existant « Ville dense » sur `/?loyer=1200` : de 34 674 communes colorées à 643, **34 031 se décolorent d'un coup** (cocher) puis se recolorent (décocher). Même méthode que T4 de cadre-de-vie (H90) : version construite, vraies données, 1 440 × 900, fond uni (style IGN remplacé par un fond de la couleur `background`, estompage transparent), CPU × 4, rendu logiciel ; du `keydown` (capture) à la deuxième image qui suit le changement de l'adresse ; 15 essais par sens, médiane. Le script de cadre-de-vie n'est pas dans le dépôt : réécrit, gardé cette fois (`captures/T0-mesure-reaction.mjs`) ; sortie : `captures/T0-reaction.txt`. 2026-10-18 18:40-18:48, charge 1,5 à 4.

| Geste (version fab197e) | Médianes (4 passages) | Écart au témoin |
|---|---|---|
| Témoin : curseur du prix, un cran (1 200 ↔ 1 250 €) | 160, 160, 161, 160 ms | — |
| Cases de la mer 50 ↔ 100 km (le geste de H90) | 159, 159 ms | 0 |
| « Ville dense » cochée : 34 031 communes décolorées | 177, 177, 177, 178 ms | + 17 ms (une image) |
| « Ville dense » décochée : 34 031 communes recolorées | 260, 260, 261, 261 ms | + 100 ms (six images) |

Le témoin est plus haut que dans cadre-de-vie (114-116 ms) : **c'est la méthode, pas le site.** Le même script sur la version mesurée alors (d8784dd, tâche 4 de cadre-de-vie, servie à côté sur le port 4181) donne aussi 160-161 ms au curseur (3 passages ; sa mer et son type ne se mesurent pas avec ce script, leurs boutons ont changé depuis). Ramené à l'échelle de H90 (témoin à 115 ms, soit ≈ 45 ms de moins) : **≈ 130 ms pour décolorer, ≈ 215 ms pour recolorer.** Pour comparer : H90 accepté à 149-164 ms.

**Au-delà de 100 ms dans les deux sens : retour à Vincent (H120).** Ce que la mairie fera : cocher un premier bloc décolore 30 000 à 34 000 communes (≈ le cas « cochée ») ; décocher la dernière pastille, ou cocher « Sans étiquette » en plus d'un bloc, en recolore autant (≈ le cas « décochée », le plus lent). La tâche 2 refera la mesure avec le vrai filtre et ce script.

## Amendement du 2026-10-19 (D2)
À la démo, Vincent a rangé La France insoumise en « Gauche » ; LEXG suit (D2 amendée, H117). Le bloc « Extrême gauche » n'a plus aucune mairie : sa pastille est retirée. Les sections ci-dessus restent celles de la tâche 0 (bloc de l'annexe).

Table : `scripts/data/nuances-2026.csv` garde les étiquettes de l'annexe ; LFI et LEXG ont `bloc` = `gauche`, `bloc_annexe` = `extreme-gauche` et la note `ecart` « rangée à gauche par Vincent le 2026-10-19 (D2 amendée) » ; `mairies.py` contrôle que seules ces deux nuances s'écartent de l'annexe. `public/data/mairies.json` est identique octet pour octet (`cmp`) ; `nuances.json` change pour ces deux nuances. Sortie des contrôles : `captures/C2-controles-mairies.txt` (2026-10-19 12:35, tous « ok »).

**Mairies par bloc** (mesuré par `python3 -I scripts/data/mairies.py`, 2026-10-19 12:35) : gauche 760, divers 561, centre 571, droite 1 212, extrême droite 60, sans étiquette 31 508 ; sans résultat 74. Gauche = 753 de la tâche 0 + les 7 mairies LFI (LDVG 556, LUG 138, LSOC 37, LCOM 19, LFI 7, LVEC 3) ; les autres blocs sont inchangés.

**Les 10 premières de « Gauche » à `/?loyer=1200&mairie=gauche`** (même calcul que la tâche 0, avec `evaluer` du site ; script : `captures/C2-mesure-10-premieres.test.ts.txt` ; sortie : `captures/C2-10-premieres-par-bloc.txt`) : **748 communes classées** (741 + les 7 LFI). Les 10 premières sont les mêmes qu'à la tâche 0 :
1. Clamecy (58, 58079) · 69 · 378 € · 3 544 hab. · Divers gauche · « Clamecy tous unis pour l'avenir »
2. Nouzonville (08, 08328) · 69 · 378 € · 5 523 hab. · Divers gauche · « 100% NOUZON »
3. Bogny-sur-Meuse (08, 08081) · 68 · 381 € · 4 889 hab. · Divers gauche · « BOGNY 2026 »
4. Saint-Germain-du-Corbéis (61, 61397) · 66 · 404 € · 3 636 hab. · Divers gauche · « COLLECTIF CITOYEN POUR LES CORBENOIS »
5. Revin (08, 08363) · 66 · 414 € · 5 716 hab. · Divers gauche · « REVIN, Dynamique Engagée »
6. Courpière (63, 63125) · 65 · 423 € · 4 166 hab. · Divers gauche · « Avec vous pour Courpière »
7. Aubusson (23, 23008) · 64 · 428 € · 3 018 hab. · Divers gauche · « AUBUSSON, UNE ÉQUIPE, UN AVENIR »
8. Champagney (70, 70120) · 64 · 429 € · 3 647 hab. · Divers gauche · « Agir ensemble pour l'avenir de Champagney »
9. Sanvignes-les-Mines (71, 71499) · 64 · 430 € · 4 235 hab. · Divers gauche · « SANVIGNES AU COEUR DE NOS VIES »
10. Ambert (63, 63003) · 64 · 432 € · 6 517 hab. · Divers gauche · « Ambert 2026 : faire équipe pour changer »

Les 7 mairies LFI y sont loin : Roubaix 507ᵉ (43), Saint-Fons 557ᵉ (40), Creil 602ᵉ (36), Vénissieux 605ᵉ (36), Vaulx-en-Velin 638ᵉ (32), La Courneuve 722ᵉ (17), Saint-Denis 738ᵉ (9). Les listes de « Divers », « Centre », « Droite », « Extrême droite » et « Sans étiquette » sont identiques à celles de la tâche 0 (`diff` des sorties).
