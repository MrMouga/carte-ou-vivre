# Tâche 0a — Les données de l'emploi, servies
Statut : question · Début 16:08 · Fin 16:40 · Commits : 7015a9f, fb9cda9 (1re question : licence), puis 3c865ed (reprise après la réponse de Vincent)

Historique : 1re question à 16:13 (licence de la table des bassins introuvable) ; réponse de Vincent à 16:20 (s'en servir, mention datée, H143 amendée en 9c95b57) ; reprise ; **2e arrêt** sur une autre condition d'arrêt du plan : un code de commune non recalé (Yvrench, 80832).

## Ce que l'utilisateur peut faire maintenant
Rien de neuf à l'écran. Tout est prêt pour écrire `public/data/emploi.json`. Les sources sont téléchargées et figées, le calcul des niveaux est testé (AC-8), et les autres contrôles passent tous (sonde ci-dessous). Il reste une commune de 296 habitants, Yvrench (Somme), que la table de France Travail oublie. Le script s'arrête dessus, comme le plan le demande, et `emploi.json` n'est pas encore écrit.

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-8 | `scripts/data/emploi.test.ts` · « AC-8 : b01 500, b02 300, b03 300 au niveau « 10 » ; b04 120, b05 80, b06 80 au « 25 » ; b07 40, b08 12, b09 5, b10 5 « tous » ; b11 à b20 sans chiffre » | vert (rouge d'abord : script absent, 16:16 ; vert à 16:17) |
| AC-12 (part données, contrôlée dans `emploi.py`) | contrôles de `emploi.py` | 389 bassins, 217 métiers, au moins 6 bassins chacun ; M2X90 : 39 / 98 / 120, Bordeaux « 10 » avec 742, La Rochelle sans chiffre : **ok dans la sonde** ; « les 34 746 communes ont un bassin » : **arrêt sur Yvrench** dans le vrai lancement |

## Preuves
- `docs/plans/2026-11-21-emploi/captures/T0a-controles-emploi.txt` — le vrai lancement d'`emploi.py`. Empreintes ok, puis arrêt « ÉCHEC 80832 (Yvrench) recalé sur un code de la table, un seul bassin ([]) » (2026-11-21 16:33)
- `docs/plans/2026-11-21-emploi/captures/T0a-controles-sonde-yvrench.txt` — le même script avec Yvrench rattachée **provisoirement** au bassin de sa voisine. Le fichier est écrit hors du dépôt. On y voit tous les autres contrôles verts, les 12 recalages, 96 métiers peu chiffrés, les voisines d'Yvrench et leurs bassins (2026-11-21 16:20)
- `docs/plans/2026-11-21-emploi/captures/T0a-sonde-yvrench.py` — la sonde
- `docs/plans/2026-11-21-emploi/captures/T0a-licence-bassins.txt`, `T0a-sonde-clpe.py` — la recherche de licence (1re question)
- `docs/plans/2026-11-21-emploi/mesure-tache-0.md` — part 0a : empreintes, licences, décision de Vincent, ce que le fichier a montré, sortie des contrôles, 96 métiers peu chiffrés
- Poids (sortie de la sonde) : 1 496 506 octets bruts, 233 960 compressés (`gzip -9`), sous les 300 Ko

## Suite de tests
- unit (dans `npm test`, 16:21) : `Test Files  21 passed (21)` · `Tests  316 passed (316)` ; relancé à 16:34 après les dernières retouches du script (messages affichés) : `Tests  316 passed (316)`
- e2e (`npm test`, fin 16:32) : `1 failed` · `38 skipped` · `379 passed (11.5m)`. L'échec : `proches-etats.spec.ts:110` [bureau], « deux proches ajoutés d'affilée… », qui attendait « Tes proches 2 » et a reçu « Tes proches ». C'est l'instabilité connue des tests de proches (leçon du 2026-10-15). Relancé seul `--repeat-each=3` (port 4173 libre, charge 4,9) : `3 passed (18.5s)`. Aucun fichier de `src/` ni de `tests/` n'a changé dans cette tâche.
- types : `tsc --noEmit -p .` sans erreur
- build : `✓ built in 1.88s`

## Décisions prises à la place de Vincent
- Décision : zones d'emploi lues dans la table de l'Insee à la géographie du 01/01/2025 (`ZE2020_au_01-01-2025`), celle de `communes.json`, plutôt que dans celle de 2026 qu'il aurait fallu recaler. Pourquoi : jointure directe, aucune commune à recaler, les 34 746 communes trouvées. Coût si c'est faux : aucun visible ; les zones 2020 n'ont pas changé de contour, seuls les codes des communes changent d'un millésime à l'autre.
- Décision : une ligne BMO par métier × bassin × comité local × **département**. Les 435 cas où le même trio revient (12 couples bassin × comité à cheval sur deux ou trois départements) sont des parts, additionnées, et non des copies à dédoublonner. Pourquoi : les chiffres diffèrent d'un département à l'autre (48 en Ardèche, 555 dans la Drôme) ; c'est la « somme des lignes publiées » de R45 ; les comptes d'AC-12 retombent juste. Coût si c'est faux : un seul cas identique publié (vétérinaires, bassin 1129, 12 + 12) serait compté double.
- Décision : recalage des communes absentes de la table **à rebours** (ancien code, commune d'origine), et non vers « la commune 2026 qui les a reprises » comme l'écrivait le plan. Pourquoi : mesuré, la table est sur une géographie plus ancienne ; aucune des 12 n'a de mouvement en 2026 ; c'est le recalage de H86 de cadre-de-vie que cite H142. Coût si c'est faux : 11 petites communes changeraient de bassin, mais les contrôles montrent un seul bassin possible pour chacune.
- Décision (décidé par Claude) : le bassin de Monaco (9399) reste dans les 389 bassins : il compte dans N et dans le classement, comme l'ont mesuré la recherche et AC-12. Il n'a pas de ville principale (`null`), puisque aucune commune de la carte n'y est. La tâche 1 devra l'ignorer pour les distances. Pourquoi : H135 prend la ville principale parmi les communes de la carte. Coût si c'est faux : les recrutements de Monaco ne comptent pas pour les communes voisines (Beausoleil, Cap-d'Ail) ; ou bien il faudrait un point pour Monaco.
- Décision (décidé par Claude) : libellés des métiers sans espace de fin (un seul libellé en avait une), sinon tels que publiés, fautes comprises (« Ouviers … »). Coût si c'est faux : aucun.
- Décision (décidé par Claude, montré à la démo) : les 57 noms courants de `scripts/data/noms-metiers.csv`. Les plus discutables : « UX designer », « designer » et « webdesigner » vers les graphistes (U1X82) ; « devops » vers M2X92 ; « commercial » vers les attachés commerciaux (R2X80) ; « enseignant » vers les professeurs du secondaire (W0X90) ; « ingénieur gestion des risques » vers H1X91 (le métier du testeur). Coût si c'est faux : une suggestion de plus ou de moins dans le champ ; à corriger dans le fichier.
- Décision : le texte de la mention de chômage dans CLAUDE.md porte « 2e trimestre 2026 ». La page le lira dans `emploi.json` (`trimestre_chomage`), sans l'écrire en dur.

## Fichiers touchés hors de la liste de la tâche
- `docs/plans/2026-11-21-emploi/captures/` (T0a-*) : les preuves et les sondes. Le dossier est prévu par le plan pour la 0b.
- `docs/solutions/2026-11-21-table-des-bassins-sur-une-geographie-plus-ancienne.md` : leçon (la mesure contredit le plan)

## Tests existants modifiés
- aucun

## Leçons écrites
- `docs/solutions/2026-11-21-table-des-bassins-sur-une-geographie-plus-ancienne.md` : une table « 2026 » peut porter des codes plus anciens. Il faut regarder les mouvements dans les deux sens avant d'écrire la règle de recalage. Et des lignes « en double » peuvent être des parts par département, pas des copies.

## Question pour Vincent
**Yvrench (Somme, 296 habitants) n'est pas dans la table des bassins de France Travail, et aucun changement de commune ne l'explique : à quel bassin la rattacher ?**

Ce que ça change : sans bassin, sa fiche ne pourrait rien dire de l'emploi, et le critère AC-12 (« les 34 746 communes ont un bassin ») tombe. Les 11 autres communes absentes se recalent toutes par l'historique des communes (changements de code et communes rétablies). Yvrench est la seule qui manque vraiment.

| Option | Ce que ça coûte |
|---|---|
| **A. Une règle écrite dans le script** : une commune absente de la table et sans aucun changement de commune prend le bassin de la commune la plus proche, de mairie à mairie. Pour Yvrench : Yvrencheux à 0,8 km, bassin d'Abbeville (3201). Ses 7 voisines les plus proches (jusqu'à 5 km) sont toutes dans ce bassin, et sa zone d'emploi est aussi celle d'Abbeville. | Aucun délai. La règle vaut aussi pour un futur oubli ; le script l'affiche. |
| **B. Une exception écrite à la main** pour Yvrench seule (80832 → 3201) dans le script, avec la raison. | Aucun délai. Même résultat ; une prochaine commune oubliée arrêterait encore le script. |
| **C. Laisser Yvrench sans bassin** : sa fiche dirait seulement le chômage. | Il faut amender AC-12 (« 34 745 communes ») et prévoir l'état « sans bassin » dans la fiche (tâche 2). |

**Recommandation : A.** C'est la règle la plus simple qui donne la réponse évidente (toutes ses voisines sont dans le bassin d'Abbeville). Après la réponse, la fin prend environ 15 minutes : la règle, le vrai lancement qui écrit `emploi.json`, la suite complète, puis le commit.
