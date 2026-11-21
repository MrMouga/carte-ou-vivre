# Mesures de la tâche 0 — emploi
2026-11-21 · Part 0a (sources, licences, contrôles) par le builder de la tâche 0a ; la part 0b (tableau pour Vincent, poids, chargement, distances, réaction) viendra ensuite.

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
