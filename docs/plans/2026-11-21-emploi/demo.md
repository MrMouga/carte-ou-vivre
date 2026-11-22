# Démo — emploi
2026-11-22 · [plan](plan.md) · [progression](progress.md) · [spec](../../specs/2026-11-21-emploi/spec.md)

> AC = critère d'acceptation de la spec ; Bloquant / Majeur / Mineur = gravité donnée par un relecteur neuf ; une preuve = capture ou sortie de commande, datée.

## Ce qui est construit
Pour l'essayer : **http://localhost:5173/** (serveur de dev lancé), ou `npm run dev`.

- **Données (tâches 0a, 0b, 0c)** : `public/data/emploi.json` (165 Ko compressé, +0,25 s à l'ouverture en 4G) : 389 bassins, 217 métiers, le chômage des zones d'emploi, une ligne par commune. Tes trois décisions sont appliquées : la table des bassins est utilisée, et sa date est citée au pied de page ; Yvrench prend le bassin de sa voisine ; Confolens a pour ville principale Terres-de-Haute-Charente.
- **Le filtre (tâche 1)** : `/?loyer=aucun&metier=V1X80:10` ne garde que les communes à 30 km ou moins d'une ville principale d'un bassin du niveau choisi. Une commune écartée dit pourquoi : « … (le plus proche : La Roche-sur-Yon, 61 km) ». Le calcul des distances prend 174 ms sur un téléphone lent simulé.
- **La fiche (tâche 2)** : sous « Mairie », une ligne par métier choisi, puis le chômage de la zone, par exemple « Chômage : 8,0 % dans la zone d'emploi de Bordeaux (2e trimestre 2026) ». Les deux sources sont citées au pied de page.
- **La catégorie « Emploi » (tâches 3a, 3b)** : on cherche un métier, par son libellé ou un nom courant (« développeur », « business developer »…), on le choisit, on coche un niveau, on le retire. La phrase « peu chiffré » apparaît sous les métiers rares.
- **Second métier et téléphone (tâche 4)** : « + Ajouter un second métier ». Au téléphone, les champs restent au-dessus du clavier, ce que tu as vérifié sur ton iPhone.

À essayer en premier :
1. `/` → « Emploi » → taper « infirm » → choisir → cocher « 10 % » : la carte ne garde que les coins des bassins qui recrutent le plus d'infirmiers.
2. `/?loyer=aucun&metier=V1X80:10,M2X90:10` → fiche de Pau : « … (le plus proche : Bayonne, 92 km) ».
3. Taper « business » : « Cadres commerciaux… » est proposé, grâce aux noms courants écrits à la main (57 noms, `scripts/data/noms-metiers.csv`, à relire).

## Preuves
- **Captures** (`captures/`) :
  - fiches de La Rochelle et de Pau, filtre des infirmiers : `T1-*` ;
  - fiches de Bordeaux, La Rochelle, Pau, Saint-Selve, Allarmont et pied de page : `T2-*` ;
  - catégorie en 5 états, en bureau et à 390 px : `T3a-*` ;
  - carte avec « 10 % » coché et décoché : `T3b-*` ;
  - étapes 1 à 6 du bout en bout : `T4-etape*` ;
  - relecture navigateur : `QA-*`.
- **Tests**, relancés par l'orchestrateur après la simplification (2026-11-22 11:35) : Vitest 361 / 361 (315 au départ) ; Playwright 418 verts, 43 sautés, 0 rouge (381 verts au départ) ; jetons, types et construction verts.
- **Tableau de la tâche 0 relu sur la page** : 3 métiers × 5 villes × 3 niveaux, 0 écart sur 45 fiches (`captures/T4-tableau-relu.txt`).
- **Crédibilité de la donnée** : [credibilite-metiers.md](credibilite-metiers.md) (10 métiers vérifiés sur le web ; tu as jugé les 3 métiers du tableau crédibles).

| AC | Ce qu'il vérifie | Passe |
|---|---|---|
| AC-1 | « Emploi » à l'ouverture, choix, mentions, résumé replié | oui |
| AC-2 | suggestions (accents, mots, noms courants, « Aucun métier trouvé ») | oui |
| AC-3 | second métier, retirer le premier | oui |
| AC-4 à AC-7 | niveaux : carte, liste, raisons, fiche, adresse | oui |
| AC-8 | calcul des niveaux (égalités, lignes cachées) | oui |
| AC-9 | « Partout où il recrute » avec la mairie | oui |
| AC-10 | lignes de la fiche (distances, niveaux, chômage) | oui |
| AC-11 | adresse : codes inconnus, doublons, au plus deux | oui |
| AC-12 | vraies données : Bordeaux, Pau, La Rochelle, 4 588 communes | oui |
| AC-13 | au toucher, champ au-dessus du clavier | oui (test vert ; iPhone : « ça passe », sans capture) |
| AC-14 | métier peu chiffré, phrase et niveau | oui |

## Tests existants modifiés
- `tests/e2e/lib/carte.ts` : 40 lignes ajoutées, aucune changée. Les tests de toutes les tranches reçoivent maintenant un faux `emploi.json`, sans quoi la page ne s'ouvre pas (prévu au plan).
- `tests/e2e/mairies.spec.ts` l. 78 : « Tes proches suit Vie locale » devient « Tes proches suit Emploi », parce que la catégorie s'insère entre les deux (H129, prévu au plan).
- Aucun autre. Le garde-fou des tests protégés n'a demandé ton accord pour aucune des deux modifications, comme à mairies : c'est pour /retro.

## Décisions prises à ta place
Prises par Claude ou par les agents, chacune avec son coût si elle est fausse. Liste complète dans [progress.md](progress.md).

**Données**
- Monaco (bassin 9399) n'a pas de ville principale ; il est ignoré pour les distances. Coût : aucun visible.
- Les 11 communes absentes de la table des bassins sont recalées vers leur ancien code. Coût : aucun, c'est contrôlé.
- Les lignes de l'enquête répétées par département sont additionnées. Coût : aucun, les comptes d'AC-12 tombent juste.
- Le code de Terres-de-Haute-Charente est écrit dans le script : il s'arrête si les populations changent. Coût : un arrêt à lever.
- 57 noms courants écrits à la main, parce que la table de la Dares n'est pas ouverte. **À relire** : `scripts/data/noms-metiers.csv`.

**Adresse et fiche**
- Pendant le chargement (≤ 1 s), l'adresse peut montrer un code de métier inconnu. Coût : aucun.
- Le chômage s'écrit toujours avec une décimale (« 8,0 % »). Coût : aucun.
- « à moins d'1 km » et « à n km » sont calculés comme pour la mer. Coût : aucun.

**Panneau**
- Après « Retirer », le focus va sur le « Retirer » du métier restant. Coût si c'est faux : une ligne à changer.
- Au clavier, les suggestions suivent le prototype F : Entrée choisit la première, Échap vide le champ. Coût : un comportement à changer.
- Au téléphone, « Retirer » du dernier métier ouvre le clavier sur « Ton métier », comme pour les proches. Coût : un clavier qui s'ouvre sans être demandé.
- Le champ « Second métier », quitté vide, reste ouvert ; seul Échap le referme. Coût : un champ vide affiché.

## Relectures
Deux relecteurs neufs, perso : spec ([review-spec.md](review-spec.md)) et navigateur ([qa.md](qa.md)). **0 Bloquant, 0 Majeur, 8 Mineurs, aucun corrigé**, faute de Bloquant ou de Majeur :

1. Deux raisons de métier collées dans la fiche : elles se lisent comme un seul bloc.
2. Au clavier, la 8e suggestion sort du panneau en bureau, qui ne défile pas.
3. L'anneau de focus de « 10 % » est coupé à droite.
4. « Ton métier » reste désactivé quand la carte (WebGL) ne charge pas, alors que la liste marche. C'est le même comportement que les autres réglages.
5. Une dépendance de types entre `score.ts` et `emploi.ts`, sans effet visible.
6. Pas de capture iPhone pour l'étape 7, et la capture de l'étape 6 est la même que celle de l'étape 5.
7. Une mesure de temps laissée dans la page, le rayon de la Terre réécrit, le geste du toucher copié des proches.
8. Trois tests de proches-fiables rouges pendant la relance du relecteur. Relancés seuls, ils sont verts 15 fois sur 15 : c'était la machine saturée, pas une régression.

**Hors consigne** : un relecteur a lancé `npx madge --version`, qui a téléchargé l'outil madge dans le cache npm de la machine (`~/.npm/_npx/483d2954a4c5190c`). Rien n'a été ajouté au projet. À supprimer avec ton accord.

## Retours à traiter (chemin court)
- **Libellés des niveaux** : ton retour sur l'iPhone, puis tes propositions. Recommandation : « Où ce métier recrute » · « Un peu » · « Beaucoup » · « Le plus », du plus large au plus étroit. Ne rien cocher voudrait dire « peu importe », comme ailleurs sur le site. Ce changement touche aussi la ligne de la fiche (« parmi les 10 % de bassins… ») et les textes de plusieurs critères.
- Les Mineurs 1, 2 et 3 sont petits et visibles : ils peuvent partir avec les libellés.

## Non vérifié
- L'erreur de chargement d'`emploi.json` sur la page (seulement par les tests).
- Un vrai iPhone avec capture ; tu as validé de vive voix, sans capture.
- La comparaison détaillée de tous les écrans au design F : un seul écran a été comparé, celui des deux métiers à 390 px, et il est identique.
- Le site en ligne : rien n'est poussé.

## Coût
- **Durée** : 2026-11-21 15:54 → 2026-11-22 11:50, dont environ 13 h d'attente de ta réponse sur l'iPhone (la nuit). Environ 6 h 30 de travail actif.
- **Agents** : 9 constructeurs (0a, 0b, 0c, 1, 2, 3a, 3b, 4, simplification), 1 chercheur, 1 lecteur web, 2 relecteurs, soit environ 2,3 M de jetons :
  - constructeurs : 0a 286 k, 0b 158 k, 0c 66 k, 1 235 k, 2 191 k, 3a 253 k, 3b 131 k, 4 310 k, simplification 180 k ;
  - recherche : 101 k pour la crédibilité, 37 k pour la lecture du rapport Apec ;
  - relecteurs : spec 197 k, QA 112 k.
- **Arrêts pour toi** : 5 (licence des bassins, Yvrench, tableau et Confolens, vérification de la crédibilité, iPhone).
- **Détours** : aucun revert. Un défaut de la tâche 3a (focus perdu une fois sur 20) a été trouvé et corrigé en tâche 4. Les deux relecteurs ont dû être relancés une fois, après avoir atteint leur limite de tours.
