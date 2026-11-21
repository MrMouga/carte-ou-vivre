# Mesures de la tâche 0 — emploi
2026-11-21 · Part 0a (sources, licences, contrôles) par le builder de la tâche 0a ; part 0b (tableau pour Vincent, poids, chargement, distances, réaction) par le builder de la tâche 0b, 17:18-17:35, en fin de fichier.

## Part 0a — sources retenues

Téléchargées par `python3 scripts/data/sources.py` le 2026-11-21 à 16:14, dans `data-raw/` ; date, Last-Modified et empreinte dans `<fichier>.info.json` ; empreintes recopiées dans `CLAUDE.md` (Données → Emploi) et dans `scripts/data/emploi.py`, qui s'arrête si l'une change.

| Fichier (`data-raw/`) | Source | Last-Modified | Octets | sha256 |
|---|---|---|---|---|
| `Base-open-data-BMO-2026.xlsx` | France Travail, enquête BMO 2026 | Tue, 21 Apr 2026 07:03:05 GMT (07:03:06 lu par `curl` le même jour : le serveur varie d'une seconde ; même empreinte que la recherche) | 3 755 481 | `735d0443b799b4c18c145055f87244a355a48b6286ee98ddbab272491d9792e0` |
| `bassins-emploi-2026.xlsx` (nom du serveur : `Bassins_d'emploi_2026.xlsx`) | France Travail, `statistiques.francetravail.org/bmo/Handlers/HTFile.ashx?MEDIAID=188096` | Fri, 17 Apr 2026 08:43:50 GMT | 1 410 342 | `3c7f5048491b90d21cfb16afdacb98f60b03a127b34bc871fd09fa41c09da455` |
| `chomage-zone-t1-2003-t2-2026.xlsx` | Insee, taux de chômage localisés par zone d'emploi, paru le 18/09/2026, dernier trimestre : 2e trimestre 2026 | aucun (l'Insee n'en envoie pas) | 146 588 | `0662c648e68feec0fd1901bd11fe9a084043e03ead3103f526b19c35de588db7` |
| `ZE2020_au_01-01-2025.zip` | Insee, zones d'emploi 2020, composition communale, géographie au 01/01/2025, mise en ligne le 21/03/2025 | aucun | 991 817 | `aec5884669f23669e6234f5a2d5fe4c33d1b5af3d5bf7135dd14f640b63eda2c` |
| `v_mvt_commune_2026.csv` | Insee, COG 2026, mouvements des communes | aucun | 2 076 555 | `8b339fad8232e97233af3fd9468715af845e2cf8b14cb67b24d9a301ef8645f1` |

## Part 0a — licences lues

- **Enquête BMO 2026** : Licence Ouverte (jeu « Enquête Besoins en Main d'Oeuvre (BMO) » de France Travail sur data.gouv.fr, licence `fr-lo`, lu le 2026-11-21).
- **Table des bassins d'emploi 2026** : **aucune licence écrite**. Cherchée dans la page de méthode qui la lie, dans le fichier, dans les « Informations légales » et la page « Open data » de France Travail, et sur data.gouv.fr : détail dans `captures/T0a-licence-bassins.txt`. Remplacement ouvert essayé : le référentiel des comités locaux pour l'emploi (Licence Ouverte 2.0) ne suffit pas, 188 comités sur 341 couvrent plusieurs bassins (20 058 communes sans bassin déterminable ; `captures/T0a-sonde-clpe.py`). **Décision de Vincent (2026-11-21 16:20)** : s'en servir, sans écrire à France Travail (réutilisation d'une information publique publiée, en citant la source et sa date, CRPA L321-1 et L322-1) ; la mention devient « Projets de recrutement et bassins d'emploi : France Travail, enquête Besoins en main-d'œuvre 2026 (table des bassins mise à jour le 17/04/2026) » (H143 amendée).
- **Chômage et zones d'emploi** : Insee, Licence Ouverte.
- **Table de la Dares** (intitulés de métiers → familles professionnelles) : aucune publiée sous licence ouverte. Sur data.gouv.fr, la nomenclature des familles professionnelles 2021 de la Dares est « sans licence précisée » et ne contient que les codes et libellés ; le portail de données de la Dares (33 jeux) n'a pas de table des intitulés ; le site de la Dares renvoie une page anti-robot. → liste écrite à la main, `scripts/data/noms-metiers.csv` : 57 noms, chacun vers un seul métier, dont les 7 imposés (H134, montrée à Vincent à la démo).

## Part 0a — ce que le fichier BMO a montré

- Métropole (départements hors 97x) : 51 641 lignes, **389 bassins** (dont Monaco, 9399, département 06, 100 lignes sans comité local), **217 métiers**.
- Une ligne par métier × bassin × comité local × **département** : 12 couples (bassin, comité local) sont à cheval sur deux ou trois départements (Île-de-France, Bretagne, Drôme-Ardèche, Alsace) et ont une ligne par département, aux chiffres différents (ex. A0X40, bassin 8421, comité CLPE26002 : 48 en Ardèche, 555 dans la Drôme). Ce sont des parts : elles sont additionnées (R45, « somme des lignes publiées »), comme dans les mesures de la recherche. 435 métier × bassin × comité concernés ; 23 ont des lignes identiques, dont 22 entièrement cachées et une seule avec un chiffre (V2X92 vétérinaires, bassin 1129, 12 + 12 : coïncidence probable, additionnés).
- Libellés : un seul par code ; espaces de fin retirés (« Techniciens et agents de maîtrise de chantiers du BTP » finissait par une espace), sinon tels que publiés (fautes comprises : « Ouviers … agro-alimentaires »). Les 4 libellés lus par la fixture (V1X80, V2X90, M2X90, U1X82) sont **identiques** dans le vrai fichier.

## Part 0a — communes et bassins (H142)

- Paris, Lyon, Marseille : leurs 20, 9 et 16 arrondissements chacun dans un seul bassin, 1107, 8428, 9306, dont elles sont la ville principale.
- **La table des bassins « 2026 » est sur une géographie plus ancienne que 2025** pour ses codes absents (le plan supposait des fusions de 2026 ; aucune des 12 n'a de mouvement en 2026). D'après les mouvements du COG 2026, 11 des 12 communes de H142 prennent le bassin de leur ancien code ou de la commune dont elles sont sorties :
  - changements de code (MOD 50) : Conques-en-Rouergue 12218 ← 12076 (2024-03-04), bassin 7614 ; Aurseulles 14581 ← 14011 (2024-04-24), 2818 ; Orée d'Anjou 49126 ← 49069 (2025-01-01), 5229 ; Porte des Pierres Dorées 69114 ← 69159 (2024-03-15), 8444 ;
  - rétablissements (MOD 21) : Celles 15031, Chalinargues 15035, Chavagnac 15047, Sainte-Anastasie 15171 ← Neussargues en Pinatelle 15141 (2025-01-01), 8451 ; Les Hauts-Talican 60694 ← 60054 (2024-01-01), 3213 ; L'Oie 85165 et Sainte-Florence 85212 ← Essarts en Bocage 85084 (2024-01-01), 5214.
- **Yvrench (80832, 296 habitants)** : aucun mouvement dans le COG, absente de la table (ses voisines 80833 à 80836 y sont). Non recalée → arrêt, question à Vincent (condition d'arrêt du plan). Ses 7 voisines les plus proches (mairie à mairie, 0,8 à 5,0 km) sont toutes dans le bassin 3201 (Abbeville Ponthieu), la 8e (5,2 km) dans 3202 ; sa zone d'emploi est 3201 (Abbeville). **Règle de Vincent (2026-11-21 16:50, H142 amendée)** : une commune absente de la table sans aucun mouvement prend le bassin de la commune de la table la plus proche, de mairie à mairie (`reperes.json`, sphère de 6 371 km) ; seule une commune sans mouvement ni voisine arrête le script. → Yvrench → Yvrencheux (80833) à 0,80 km, bassin 3201. Aucune commune ne manquait aux zones d'emploi : la règle ne s'y applique pas.

## Part 0a — sortie des contrôles

Vrai lancement (`python3 -I scripts/data/emploi.py`, 2026-11-21 16:55, après la règle de Vincent pour Yvrench) : **35 contrôles ok, aucun échec**, `public/data/emploi.json` écrit (1 496 506 octets) ; sortie complète : `captures/T0a-controles-emploi.txt`. Le fichier écrit est identique, octet pour octet, à celui de la sonde d'avant la réponse (`captures/T0a-sonde-yvrench.py`, `captures/T0a-controles-sonde-yvrench.txt`), qui avait rattaché Yvrench de la même façon. Relu : Paris, Lyon, Marseille villes principales de 1107, 8428, 9306 ; Bordeaux bassin 7532, zone « Bordeaux » 8,0 % ; Yvrench bassin 3201 (ville principale Abbeville, 80001) ; infirmiers (V1X80) à Bordeaux : 626 projets, niveau « 10 » (la valeur de la vérification de bout en bout) ; aucune distance dans le fichier. Contrôles :

```
  sans mouvement, rattachée à la plus proche : Yvrench (80832) → Yvrencheux (80833) à 0.80 km, bassin 3201
  ok   H142 : les 12 communes absentes de la table, et elles seules : 11 recalées par le COG, 1 par la plus proche (Yvrench)
  ok   389 bassins en métropole
  ok   217 métiers en métropole
  ok   Marseille : ses 16 arrondissements dans le seul bassin 9306 (['9306'])
  ok   Lyon : ses 9 arrondissements dans le seul bassin 8428 (['8428'])
  ok   Paris : ses 20 arrondissements dans le seul bassin 1107 (['1107'])
  ok   tout bassin des communes est un bassin du BMO ([])
  ok   seul le bassin de Monaco (9399) n'a aucune commune de la carte
  ok   H142 : Paris ville principale du bassin 1107
  ok   H142 : Lyon ville principale du bassin 8428
  ok   H142 : Marseille ville principale du bassin 9306
  ok   chômage : dernier trimestre publié = 2e trimestre 2026 (H138)
  ok   H138 : les 34746 communes ont une zone d'emploi (sans : [])
  ok   H138 : chaque zone des communes a un taux au 2e trimestre 2026 (sans : [])
  ok   H142 : les 34746 communes ont un bassin
zones d'emploi des communes : 287 ; taux de 4.3 à 14.4 %
  ok   noms courants : 57 (60 au plus, H134)
  ok   H146 : chaque métier chiffré dans au moins 6 bassins (le moins : 6)
R50 : 96 métiers peu chiffrés (moins de 130 bassins) sur 217
  ok   AC-12 : M2X90, 39 bassins au niveau « 10 » (attendu 39)
  ok   AC-12 : M2X90, 98 bassins aux niveaux « 10 » ou « 25 » (attendu 98)
  ok   AC-12 : M2X90, 120 bassins chiffrés (attendu 120)
  ok   AC-12 : bassin de Bordeaux (7532, ville principale Bordeaux) au niveau « 10 » avec 742 projets ((742, '10'))
  ok   AC-12 : bassin de La Rochelle (7504) sans chiffre pour M2X90
```

- **Métiers peu chiffrés (R50)** : **96 sur 217**, comme la mesure de /breakdown. Les moins chiffrés : U1X92 écrivains (6 bassins), J5X60 contrôleurs des transports et W0X91 directeurs d'établissements (9).
- Poids de `public/data/emploi.json` : 1 496 506 octets bruts, **233 960 octets compressés** (`gzip -9`), sous les 300 Ko de H140. La mesure complète (brotli, chargement) est en 0b.
- Ville principale : le bassin de Monaco (9399) n'en a pas (`null`) : aucune commune de la carte (décidé par Claude, voir le rapport T0a).

## Part 0b — méthode du calcul des distances
Script jetable `captures/T0b-voisinage.mjs` (la fonction de la page n'existe qu'en tâche 1) : pour chaque commune, les villes principales à 30 km ou moins (R46, H136), de mairie à mairie (points de `reperes.json`, dans l'ordre de `communes.json`), avec `distanceKm` de `src/proches/distance.ts` (importée telle quelle en Node ; dans Chromium, sa source sans les types, injectée), comparée au km comme la mer (`kmCompare` recopiée : `Math.max(1, Math.round(km))`, donc « ≤ 30 » veut dire « < 30,5 km ») ; la ville principale elle-même : 0 km. Les 388 villes principales (Monaco 9399 ignoré) sont triées par latitude ; pour chaque commune, seule la bande de ± 30,5 km de latitude est calculée exactement (la distance sur la sphère est au moins le rayon × l'écart de latitude : rien ne se perd). Contrôle : le même calcul sans tri (34 746 × 388 distances) donne les mêmes 75 354 couples, **0 écart** (`captures/T0b-tableau.txt`). 2 569 communes n'ont aucune ville principale à 30 km : elles ne passent aucun métier, à aucun niveau.

## Part 0b — compte d'AC-12 et « le plus proche »
`node docs/plans/2026-11-21-emploi/captures/T0b-tableau.mjs`, 2026-11-21 17:20, charge 2,66 (sortie : `captures/T0b-tableau.txt`) ; recompté dans Chromium par `T0b-mesure-distances.mjs` (17:23, mêmes comptes).
- **M2X90 à « 10 % » : 4 588 communes passent**, exactement le compte d'AC-12 (écart accepté 4 542 à 4 634) : le recalage des 12 communes de H142 n'a rien changé.
- La Rochelle, infirmiers à « 10 % » : le plus proche, **La Roche-sur-Yon, 61 km** ; Pau, M2X90 à « 10 % » : **Bayonne, 92 km** ; infirmiers à « 10 % » : Bordeaux et Pau passent. Les quatre valeurs d'AC-12, avec la règle d'égalité de H136.

## Part 0b — le tableau pour Vincent
Sortie complète : `captures/T0b-tableau.txt`. « Rang » : place du bassin parmi les bassins chiffrés du métier, par projets. « Communes à 30 km » : communes dont la mairie est à 30 km ou moins de la mairie de la ville principale du bassin. « La ville passe » : la commune elle-même, avec la ville principale la plus proche du niveau.

**Cadres commerciaux, acheteurs et cadres de la mercatique** (R4X90 ; business developer, prospecteur, chargé d'affaires…) — chiffré dans 162 bassins sur 389, pas « peu chiffré ». Bassins : 39 au niveau « 10 % », 100 aux niveaux « 10 » ou « 25 », 162 en tout. **Communes qui passent : 10 % → 4 993 ; 25 % → 12 175 ; partout où il recrute → 18 271** (sur 34 746).

| Bassin | Projets 2026 | Niveau | Rang | Communes à 30 km | La ville passe à 10 % / 25 % / partout |
|---|---|---|---|---|---|
| Bordeaux (7532) | 199 | 10 % | 6e / 162 | 179 | oui / oui / oui (sur place) |
| Nantes (5220) | 147 | 10 % | 8e | 95 | oui / oui / oui (sur place) |
| La Rochelle (7504) | 6 | partout où il recrute | 148e | 100 | non (Nantes, 122 km) / non (La Roche-sur-Yon, 61 km) / oui (sur place) |
| Pau (7538) | pas de chiffre publié | — | — | 284 | non (Toulouse, 151 km) / non (Dax, 72 km) / non (Mont-de-Marsan, 67 km) |
| Toulouse (7617) | 156 | 10 % | 7e | 238 | oui / oui / oui (sur place) |

**Ingénieurs et cadres techniques en Hygiène Sécurité Environnement** (H1X91 ; ingénieur gestion des risques) — chiffré dans 46 bassins, **peu chiffré** (R50). Bassins : **42 au niveau « 10 % »** (k = 39 ; le 39e a 7 projets, et 3 autres bassins à 7 sont gardés, H137), 46 aux niveaux « 10 » ou « 25 », 46 en tout : pour ce métier, les trois niveaux sont presque les mêmes. **Communes qui passent : 10 % → 6 920 ; 25 % → 7 465 ; partout → 7 465.**

| Bassin | Projets 2026 | Niveau | Rang | Communes à 30 km | La ville passe à 10 % / 25 % / partout |
|---|---|---|---|---|---|
| Bordeaux (7532) | 7 | 10 % | 39e / 46 | 179 | oui / oui / oui (sur place) |
| Nantes (5220) | 16 | 10 % | 12e | 95 | oui / oui / oui (sur place) |
| La Rochelle (7504) | pas de chiffre publié | — | — | 100 | non (Nantes, 122 km) aux trois niveaux |
| Pau (7538) | pas de chiffre publié | — | — | 284 | non (Tarbes, 37 km) aux trois niveaux |
| Toulouse (7617) | 20 | 10 % | 7e | 238 | oui / oui / oui (sur place) |

**Infirmiers et sages-femmes** (V1X80 ; infirmière, sage-femme) — chiffré dans 358 bassins, pas peu chiffré. Bassins : 39 au niveau « 10 % », 98 aux niveaux « 10 » ou « 25 », 358 en tout. **Communes qui passent : 10 % → 6 192 ; 25 % → 13 448 ; partout → 31 456.**

| Bassin | Projets 2026 | Niveau | Rang | Communes à 30 km | La ville passe à 10 % / 25 % / partout |
|---|---|---|---|---|---|
| Bordeaux (7532) | 626 | 10 % | 7e / 358 | 179 | oui / oui / oui (sur place) |
| Nantes (5220) | 570 | 10 % | 10e | 95 | oui / oui / oui (sur place) |
| La Rochelle (7504) | 66 | partout où il recrute | 145e | 100 | non (La Roche-sur-Yon, 61 km) / non (La Roche-sur-Yon, 61 km) / oui (sur place) |
| Pau (7538) | 326 | 10 % | 22e | 284 | oui / oui / oui (sur place) |
| Toulouse (7617) | 761 | 10 % | 3e | 238 | oui / oui / oui (sur place) |

### Villes principales du niveau « 10 % », par projets
- **R4X90** (39) : Paris 1 016 · Nanterre 421 · Vitry-sur-Seine 285 · Boulogne-Billancourt 228 · Versailles 201 · Bordeaux 199 · Toulouse 156 · Nantes 147 · Lille 142 · Argenteuil 125 · Lyon 122 · Vénissieux 121 · Strasbourg 103 · Marseille 102 · Rennes 94 · Rouen 75 · Antony 73 · Tourcoing 72 · Montpellier 65 · Sartrouville 63 · Tours 61 · Amiens 60 · Aix-en-Provence 57 · Chelles 56 · Évry-Courcouronnes 51 · Angers 51 · Grenoble 51 · Aulnay-sous-Bois 47 · Montreuil 47 · Reims 47 · Limoges 47 · Dijon 45 · Saint-Denis 44 · Avignon 44 · Cergy 41 · Nancy 37 · Vaulx-en-Velin 37 · Franconville 34 · Orléans 34.
- **H1X91** (42) : Vénissieux 250 · Paris 88 · Chelles 39 · Montpellier 39 · Caen 28 · Aix-en-Provence 27 · Toulouse 20 · Vannes 19 · Compiègne 18 · Limoges 18 · Épinal 16 · Nantes 16 · Nanterre 15 · Grenoble 15 · Saint-Étienne 15 · Lille 13 · Lyon 13 · Clermont-Ferrand 13 · Brest 12 · Sarrebourg 11 · Annecy 11 · Marseille 11 · Versailles 10 · Argenteuil 10 · Arras 9 · Troyes 9 · Tarbes 9 · Antibes 9 · Antony 8 · Tours 8 · Tourcoing 8 · Metz 8 · Cergy 7 · Auxerre 7 · Le Havre 7 · Douai 7 · Strasbourg 7 · Pornic 7 · Bordeaux 7 · Rodez 7 · Nîmes 7 · Nice 7.
- **V1X80** (39) : Paris 1 680 · Rouen 1 016 · Toulouse 761 · Nice 710 · Lille 667 · Tours 658 · Bordeaux 626 · Marseille 571 · Argenteuil 570 · Nantes 570 · Rennes 554 · Lyon 492 · Vitry-sur-Seine 460 · Aix-en-Provence 460 · Nanterre 453 · Brest 443 · Angers 430 · Strasbourg 406 · Aulnay-sous-Bois 365 · Le Mans 349 · Castelnau-de-Médoc 339 (bassin « CONFOLENS », voir ci-dessous) · Pau 326 · Orléans 300 · Sartrouville 298 · Champigny-sur-Marne 297 · Versailles 296 · Évreux 294 · Montreuil 291 · Caen 285 · Montpellier 280 · Besançon 266 · Chambéry 262 · Bayonne 257 · Amiens 255 · Annecy 254 · Nancy 236 · La Roche-sur-Yon 232 · Limoges 224 · Clermont-Ferrand 221.

Pour lire les noms d'Île-de-France et de Lyon : la ville principale est la commune la plus peuplée du bassin (H135) ; Vitry-sur-Seine = « Grand-Orly Seine Bièvre », Nanterre = « Paris Ouest La Défense », Vénissieux = « Rhône Est » (vallée de la chimie), Chelles = « Marne-la-Vallée », etc. (libellés du fichier : `captures/T0b-libelles-bassins.txt`).

### À signaler : le bassin 7503 « CONFOLENS » a pour ville principale Castelnau-de-Médoc
La table des bassins de France Travail range dans le bassin 7503 (« CONFOLENS », Charente) 135 communes de Charente **et 12 communes du Médoc** (Gironde : Castelnau-de-Médoc, Arsac, Avensan, Margaux-Cantenac, Listrac-Médoc…) : Castelnau-de-Médoc est à 159 km de Confolens (2 730 hab.), à 27 km de Bordeaux ; le fichier BMO a des lignes du bassin 7503 pour les deux comités locaux (CLPE16003 en Charente, CLPE33006 en Gironde). Lignes brutes : `captures/T0b-sonde-table-bassins.txt`. La commune la plus peuplée du bassin (H135) est Castelnau-de-Médoc (4 907 hab.), devant Terres-de-Haute-Charente (3 777) ; 71 % des habitants du bassin vivent en Charente. C'est le seul bassin dans ce cas : sa ville principale est à 99 km du centre du bassin (pondéré par la population), le suivant à 38 km (Le Blanc pour Argenton-sur-Creuse), `captures/T0b-villes-ecartees.txt`.
Effet (`captures/T0b-7503-effet.txt`) : 58 métiers chiffrés dans ce bassin, dont 4 au niveau « 10 % » (agriculteurs 909, viticulteurs 882, gestionnaires de la banque 17, infirmiers 339). Avec Terres-de-Haute-Charente comme ville principale, les infirmiers à « 10 % » feraient passer 6 275 communes au lieu de 6 192 (+83) ; M2X90 n'y est pas chiffré au niveau « 10 % » : le compte d'AC-12 ne bouge pas. La fiche d'une commune de Charente limousine dira « bassin de Castelnau-de-Médoc ».

## Part 0b — poids d'`emploi.json`
`captures/T0b-poids.txt` (17:22) ; gzip et brotli de la ligne de commande vérifiés à l'octet pour emploi.json (`gzip -9 -c`, `brotli -q 11 -c`).

| Fichier | Brut | gzip -9 | brotli -q 11 | Reçu de `vite preview` (gzip) |
|---|---|---|---|---|
| `emploi.json` | 1 496 506 o (1,50 Mo) | **233 960 o** | **164 785 o** | 250 527 o |
| `mairies.json` (pour comparer) | 1 526 497 o | 457 847 o | 356 655 o | 462 971 o |
| `achat.json` (pour comparer) | 1 435 241 o | 232 384 o | 169 379 o | 245 540 o |

Sous les 300 Ko compressés de H140, dans l'estimation du plan (150 à 250 Ko) ; le poids d'`achat.json`, la moitié de `mairies.json`.

## Part 0b — temps de chargement ajouté (« Fast 4G »)
Même méthode que T0 de mairies : `npx vite preview --port 4180` (version construite 164a0ed, gzip), Chromium de Playwright, profil « Fast 4G » par le protocole DevTools (1 012 500 o/s en descente, 168 750 en montée, latence 165 ms), cache coupé ; dans la page, `fetch` puis `.json()`, les fichiers d'un jeu en parallèle ; 7 essais par jeu en alternance, médiane. 2026-11-21 17:22-17:23, charge 4,88 au début, 4,31 à la fin. Script : `captures/T0b-mesure-chargement.mjs` ; sortie : `captures/T0b-chargement-fast4g.txt`.

| Ce qui est chargé | Médiane | Essais (ms) |
|---|---|---|
| `achat.json` seul | 425 ms | 433 424 423 426 417 425 426 |
| `mairies.json` seul | 639 ms | 639 638 636 644 635 639 640 |
| `emploi.json` seul | 429 ms | 436 429 433 436 429 427 429 |
| Chargement actuel : communes + repères + achat + mairies + nuances | 2 289 ms | 2296 2294 2287 2289 2288 2289 2295 |
| Avec l'emploi : + emploi | 2 543 ms | 2543 2543 2544 2543 2540 2541 2541 |

**Chargement ajouté : 254 ms** (2 543 − 2 289) : le temps de passer 251 Ko à 1 Mo/s, la latence se cache derrière les autres fichiers. Les chiffres de mairies se retrouvent (achat seul 425 contre 430, mairies seul 639 contre 644 ; chargement actuel 2 289 contre 2 298 avec les mairies) : la méthode donne les mêmes valeurs à un mois d'écart. Non mesuré : la compression du site en ligne (Cloudflare) ; en brotli, 165 Ko, soit ≈ 165 ms ajoutées au même débit (estimation).

## Part 0b — temps du calcul des villes principales à 30 km de chaque commune
| Où | Ce qui est mesuré | Médiane | Essais (ms) | Charge |
|---|---|---|---|---|
| Node 22.22 (`T0b-tableau.mjs`, 17:20) | calcul trié, 15 essais après 3 d'échauffement | **47 ms** | min 46,5, max 49,7 | 2,66 |
| Node 22.22 (même script) | sans tri, toutes les paires (contrôle, une fois) | 594 ms | — | 2,66 |
| Chromium 153, **processeur ralenti 4 fois** (`T0b-mesure-distances.mjs`, 17:23) | premier calcul dans une page neuve (le cas réel : une fois après le chargement), 7 pages | **154 ms** | 157 154 152 155 153 154 163 | 3,96 |
| idem | même calcul à chaud, 10 appels | 144 ms | 142 152 185 144 143 147 144 144 144 143 | 3,96 |
| idem | préparation (points en tableau, ville principale de chaque bassin), page neuve | 14 ms | 22 14 15 14 14 16 14 | 3,96 |
| idem | un filtre : compter les communes qui passent un métier à un niveau, une fois les voisines connues | 1,0 ms (moyenne de 12) | — | 3,96 |

Sorties : `captures/T0b-tableau.txt`, `captures/T0b-distances-chromium.txt`. **Sous le seuil de 300 ms** (estimé par Claude, pas une mesure) : 154 + 14 = 168 ms une fois à l'ouverture, avec le processeur ralenti 4 fois ; ensuite, cocher un niveau ne coûte que le filtre (≈ 1 ms). Le tri par latitude divise le calcul par 12 environ (594 → 47 ms en Node). Non mesuré : un vrai téléphone (le ralentissement × 4 en tient lieu, comme dans les tranches d'avant).

## Part 0b — réaction de la carte quand ~30 000 communes se décolorent
Substitut du plan : le filtre « Ville dense » sur `/?loyer=1200` (de 34 674 communes colorées à 643 : **34 031 se décolorent**, un peu plus que les ≈ 30 000 de M2X90 à « 10 % », qui en garde 4 588). Script de mairies recopié sans changement de méthode (`captures/T0b-mesure-reaction.mjs`, seuls la charge et la version servie sont ajoutées à la sortie) : version construite 164a0ed sur le port 4180, vraies données, 1 440 × 900, fond uni, processeur ralenti 4 fois, rendu logiciel ; du `keydown` à la deuxième image après le changement de l'adresse ; 15 essais par sens, 2 tours. 2026-11-21 17:24-17:25, charge 3,37 à 3,63 (tour 1), 3,63 à 2,67 (tour 2). Sortie : `captures/T0b-reaction.txt`.

| Geste (version 164a0ed) | Tour 1 | Tour 2 | Mairies, T0 (fab197e) | Écart au témoin |
|---|---|---|---|---|
| Témoin : curseur du prix, un cran | 160 ms | 161 ms | 160 ms | — |
| Cases de la mer 50 ↔ 100 km (geste de H90) | 160 ms | 160 ms | 159 ms | 0 |
| « Ville dense » cochée : 34 031 communes décolorées | 178 ms | 191 ms | 177 ms | + 18 à + 30 ms |
| « Ville dense » décochée : 34 031 communes recolorées | 261 ms | 276 ms | 260 ms | + 101 à + 115 ms |

Le site réagit comme à mairies (mêmes chiffres à 1 ms au tour 1 ; le tour 2 est plus lent d'une image, sur tous les gestes du type seulement, le témoin restant à 161 ms). Ramené à l'échelle de H90 comme à mairies (témoin à 115 ms, soit 45 ms de moins) : **≈ 133 à 146 ms pour décolorer, ≈ 216 à 231 ms pour recolorer**, contre ≈ 130 et ≈ 215 ms acceptés à mairies et 149-164 ms à H90. **Au-delà de 100 ms (H141) : retour à Vincent.** Ce que fera le métier : cocher « 10 % » décolore 27 800 à 30 200 communes pour les quatre métiers mesurés ici, « 25 % » 21 300 à 27 300 (≈ le cas « cochée ») ; décocher le niveau les recolore (≈ le cas « décochée », le plus lent). La tâche 3b remesurera avec le vrai filtre et ce script.
