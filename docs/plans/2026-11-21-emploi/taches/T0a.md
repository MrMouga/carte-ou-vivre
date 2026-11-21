# Tâche 0a — Les données de l'emploi, servies
Statut : faite · Début 16:08 · Fin 17:06 · Commits : 7015a9f, fb9cda9 (1re question : licence) ; 3c865ed, f5606f1 (2e question : Yvrench) ; 7e15bb7 (fin) + ce rapport

Historique :
- 16:13, 1re question : la licence de la table des bassins est introuvable. Réponse de Vincent à 16:20 : s'en servir, avec la mention datée (H143 amendée, 9c95b57).
- 16:33, 2e question : Yvrench (80832) est absente de la table, sans aucun changement de commune dans l'historique de l'Insee. Réponse de Vincent à 16:50 : la règle de la commune la plus proche (H142 amendée, 9830cf3).
- Fin de la tâche.

## Ce que l'utilisateur peut faire maintenant
Rien de neuf à l'écran (tâche de données). Le site sert désormais `public/data/emploi.json`, juste et vérifié :
- les 389 bassins de métropole, chacun avec sa ville principale ;
- les 217 métiers, avec leurs noms courants, le drapeau « peu chiffré » (96 métiers) et, pour chaque bassin chiffré, les projets et le niveau le plus étroit ;
- les 287 zones d'emploi des communes, avec leur taux au 2e trimestre 2026 ;
- une ligne par commune de la carte : son bassin et sa zone.

Les tâches 0b et 1 peuvent s'en servir.

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-8 | `scripts/data/emploi.test.ts` · « AC-8 : b01 500, b02 300, b03 300 au niveau « 10 » ; b04 120, b05 80, b06 80 au « 25 » ; b07 40, b08 12, b09 5, b10 5 « tous » ; b11 à b20 sans chiffre » | vert (rouge d'abord à 16:16, script absent ; vert à 16:17 et dans la suite finale) |
| AC-12 (part données, son test est en tâche 1) | contrôles d'`emploi.py` | ok :<br>- 389 bassins et 217 métiers ; chaque métier chiffré dans au moins 6 bassins ;<br>- les 34 746 communes ont un bassin ;<br>- M2X90 : 39 bassins au niveau « 10 », 98 aux niveaux « 10 » ou « 25 », 120 chiffrés ;<br>- bassin de Bordeaux au niveau « 10 » avec 742 projets ; bassin de La Rochelle sans chiffre |

## Preuves
- `docs/plans/2026-11-21-emploi/captures/T0a-controles-emploi.txt` — le vrai lancement d'`emploi.py` : 35 contrôles ok, aucun échec. On y voit les 12 rattachements, dont « Yvrench (80832) → Yvrencheux (80833) à 0.80 km, bassin 3201 », 96 métiers peu chiffrés, et la ligne « écrit : public/data/emploi.json (1496506 octets) » (2026-11-21 16:50)
- `public/data/emploi.json`, relu (16:51) :
  - Paris, Lyon et Marseille sont villes principales de 1107, 8428 et 9306 ;
  - Bordeaux est dans le bassin 7532, zone « Bordeaux », 8,0 % ;
  - les infirmiers (V1X80) à Bordeaux : 626 projets, niveau « 10 » ;
  - Yvrench est dans le bassin 3201 (ville principale Abbeville) ;
  - le fichier ne contient aucune distance ;
  - 233 960 octets compressés (`gzip -9`), sous la limite de 300 Ko ;
  - il est identique, octet pour octet, à celui de la sonde d'avant la réponse.
- `docs/plans/2026-11-21-emploi/mesure-tache-0.md` — part 0a : empreintes, licences (avec la décision de Vincent), ce que le fichier BMO a montré, recalages, règle d'Yvrench, sortie des contrôles, 96 métiers peu chiffrés
- `docs/plans/2026-11-21-emploi/captures/T0a-controles-sonde-yvrench.txt`, `T0a-sonde-yvrench.py` — la sonde d'avant la 2e réponse : les voisines d'Yvrench et leurs bassins
- `docs/plans/2026-11-21-emploi/captures/T0a-licence-bassins.txt`, `T0a-sonde-clpe.py` — la recherche de licence (1re question)
- `dist/data/emploi.json` présent après `npm run build` (16:52)

## Suite de tests
Suite finale, lancée à 16:52 après l'écriture d'`emploi.json` :
- **unit** : `Test Files  21 passed (21)` · `Tests  316 passed (316)`
- **e2e** : `2 failed` · `38 skipped` · `378 passed (11.7m)`.
  - Les deux échecs sont dans `immobilier.spec.ts:220` (« D2 … ») et `:376` (« AC-10 … »), en bureau. Ce sont des rechargements de page en plein test (« Execution context was destroyed, most likely because of a navigation » ; « navigated to … »).
  - Cause probable : j'ai lancé `npm run build` pendant la suite, et le serveur de développement recharge la page quand `dist/index.html` change. C'est une erreur de ma part, à ne pas refaire.
  - Relancés seuls `--repeat-each=3` (port 4173 libre) : `6 passed (8.2s)`.
  - Aucun fichier de `src/` ni de `tests/` n'a changé ; `emploi.json` n'est lu par aucune page.
- Suite précédente (16:21, même code sans la règle d'Yvrench) : `379 passed`, `1 failed` (`proches-etats.spec.ts:110`, instabilité connue, `3 passed` en relance seule).
- **types** : `tsc --noEmit -p .` sans erreur
- **build** : `✓ built in 2.22s` ; `dist/data/emploi.json` présent

## Décisions prises à la place de Vincent
- Décision : zones d'emploi lues dans la table de l'Insee à la géographie du 01/01/2025, celle de `communes.json`, plutôt que dans celle de 2026 qu'il aurait fallu recaler. Pourquoi : jointure directe, les 34 746 communes trouvées. Coût si c'est faux : aucun visible ; les zones 2020 n'ont pas changé de contour, seuls les codes des communes changent d'un millésime à l'autre.
- Décision : une ligne BMO par métier × bassin × comité local × **département**. Les 435 cas où le même trio revient (12 couples bassin × comité à cheval sur deux ou trois départements) sont des parts, additionnées. Pourquoi : les chiffres diffèrent d'un département à l'autre (48 en Ardèche, 555 dans la Drôme) ; c'est la « somme des lignes publiées » de R45 ; les comptes d'AC-12 retombent juste. Coût si c'est faux : un seul cas identique publié (vétérinaires, bassin 1129, 12 + 12) serait compté double.
- Décision : recalage des 11 communes absentes de la table **à rebours** (ancien code, ou commune dont elles sont sorties), et non vers « la commune 2026 qui les a reprises » comme l'écrivait le plan. Pourquoi : mesuré, la table est sur une géographie plus ancienne ; aucune des 12 n'a de mouvement en 2026 ; c'est le recalage de H86 de cadre-de-vie que cite H142. Coût si c'est faux : 11 petites communes changeraient de bassin, mais le contrôle montre un seul bassin possible pour chacune.
- Décision (décidé par Claude) : **Monaco (9399) sans ville principale**. Le bassin reste dans les 389 : il compte dans N et dans le classement, comme dans les mesures de la recherche et dans AC-12 (k = 39 et 97). Sa ville principale est `null`, car aucune commune de la carte n'est dans ce bassin (H135 la choisit parmi les communes de la carte). **La tâche 1 doit l'ignorer pour les distances et pour « le plus proche ».** Coût si c'est faux : les recrutements de Monaco ne comptent pas pour les communes voisines (Beausoleil, Cap-d'Ail, Roquebrune) ; il faudrait sinon un point pour Monaco, hors de la carte.
- Décision (décidé par Claude) : libellés des métiers sans espace de fin (un seul en avait une), sinon tels que publiés, fautes comprises (« Ouviers … »). Coût si c'est faux : aucun.
- Décision (décidé par Claude, montré à la démo) : les 57 noms courants de `scripts/data/noms-metiers.csv`. Les plus discutables :
  - « UX designer », « designer » et « webdesigner » vers les graphistes (U1X82) ;
  - « devops » vers M2X92 ;
  - « commercial » vers les attachés commerciaux (R2X80) ;
  - « enseignant » vers les professeurs du secondaire (W0X90) ;
  - « ingénieur gestion des risques » vers H1X91 (le métier du testeur).

  Coût si c'est faux : une suggestion de plus ou de moins dans le champ ; à corriger dans le fichier.
- Décision : format d'`emploi.json`, avec des tableaux et un champ `champs` qui nomme les colonnes, comme `mairies.json` :
  - `bassins` : `[code, ville]` ;
  - `zones` : `[code, nom, taux]` ;
  - `metiers` : `{code, libelle, noms, peu_chiffre, bassins: [[bassin, projets, niveau]]}`, bassins chiffrés seulement, triés par projets décroissants ;
  - `communes` : `[code, bassin, zone]`, dans l'ordre de `communes.json` ;
  - `trimestre_chomage` à part.

  Pourquoi : poids (234 Ko compressés). Coût si c'est faux : la tâche 1 lit un autre format ; c'est elle qui fabrique celui de la fixture.

## Fichiers touchés hors de la liste de la tâche
- `docs/plans/2026-11-21-emploi/captures/` (T0a-*) : les preuves et les sondes. Le dossier est prévu par le plan pour la 0b.
- `docs/solutions/2026-11-21-table-des-bassins-sur-une-geographie-plus-ancienne.md` (leçon) et `docs/solutions/README.md` (index régénéré par le crochet)

## Tests existants modifiés
- aucun

## Leçons écrites
- `docs/solutions/2026-11-21-table-des-bassins-sur-une-geographie-plus-ancienne.md` :
  - une table « 2026 » peut porter des codes plus anciens : il faut regarder les mouvements dans les deux sens avant d'écrire la règle de recalage ;
  - des lignes « en double » peuvent être des parts par département, pas des copies.
