# Tâche 0a — Les données de l'emploi, servies
Statut : question · Début 16:08 · Fin 16:13 · Commits : 7015a9f (ce rapport et les preuves, aucun code)

## Ce que l'utilisateur peut faire maintenant
Rien de neuf. La tâche s'est arrêtée sur sa première condition d'arrêt : **la licence de la table des bassins d'emploi 2026 ne se trouve nulle part** (H143). Sans cette table, aucune commune ne se relie à un bassin : rien d'autre n'a été construit (ni `sources.py`, ni `emploi.py`, ni `emploi.json`), pour ne pas bâtir sur une source pas encore acceptée.

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-8 | `scripts/data/emploi.test.ts` · non écrit | non commencé (arrêt avant le code) |

## Preuves
- `docs/plans/2026-11-21-emploi/captures/T0a-licence-bassins.txt` — les 5 endroits où la licence a été cherchée et ce qu'ils disent ; la piste des comités locaux mesurée ; la table de la Dares (2026-11-21 16:12)
- `docs/plans/2026-11-21-emploi/captures/T0a-sonde-clpe.py` — la sonde qui refait la table par les comités locaux (`python3 -I` avec le dépôt, le fichier BMO, la table des bassins et le référentiel des comités) (2026-11-21 16:10)

Constats :
- Le fichier est toujours le même que celui de la recherche : Last-Modified 17/04/2026 08:43:50 GMT, sha256 `3c7f5048…a455`. Le fichier BMO aussi (21/04/2026, `735d0443…92e0`).
- **Licence introuvable** : la page de méthode qui lie le fichier n'en dit rien ; le fichier non plus ; les « Informations légales » de France Travail ne parlent que de l'éditeur et des cookies (« © FRANCE TRAVAIL 2026 ») ; la page « Open data » parle de la démarche Etalab en général mais ne liste pas cette table ; sur data.gouv.fr, la table n'est dans aucun des 14 jeux de France Travail (le jeu BMO, sous Licence Ouverte, ne contient que les fichiers de l'enquête).
- **Pas de remplaçant ouvert** : le référentiel des comités locaux pour l'emploi (France Travail, Licence Ouverte 2.0) relie chaque commune à un comité, mais 188 comités sur 341 couvrent plusieurs bassins : 20 058 communes resteraient sans bassin. Piste fermée.
- **Table de la Dares (à signaler, pas d'arrêt)** : aucune table ouverte des intitulés de métiers vers les familles professionnelles ; la nomenclature elle-même est publiée « sans licence précisée ». Ce sera donc la liste écrite à la main (H134, 60 noms au plus, montrée à la démo).

## Suite de tests
- unit : `Test Files  20 passed (20)` · `Tests  315 passed (315)` (16:11, rien du site touché)
- e2e, types, build : non lancés (aucun fichier de `src/`, `scripts/`, `public/`, `tests/` changé)

## Décisions prises à la place de Vincent
- aucune

## Fichiers touchés hors de la liste de la tâche
- `docs/plans/2026-11-21-emploi/captures/T0a-licence-bassins.txt` et `T0a-sonde-clpe.py` — la preuve de la recherche de licence (le dossier `captures/` est prévu par le plan pour la 0b)

## Tests existants modifiés
- aucun

## Leçons écrites
- aucune (pas de correction ratée ; la question est prévue par le plan)

## Question pour Vincent
**La table qui relie chaque commune à son bassin d'emploi (France Travail) n'a de licence écrite nulle part : peut-on quand même s'en servir ?**

Ce que ça change : sans elle, la tranche emploi ne peut pas se faire (aucune autre source ne relie les communes aux bassins de l'enquête). Le reste de l'enquête, lui, est bien sous Licence Ouverte.

| Option | Ce que ça coûte |
|---|---|
| **A. S'en servir maintenant**, en citant la source et sa date au pied de page. En France, une information publiée en ligne par un organisme public peut être réutilisée librement, à condition de ne pas l'altérer et d'en citer la source et la date de mise à jour (code des relations entre le public et l'administration, articles L321-1 et L322-1). La mention de H143 deviendrait par exemple « Projets de recrutement et bassins d'emploi : France Travail, enquête Besoins en main-d'œuvre 2026 (table des bassins mise à jour le 17/04/2026) ». | Aucun délai. Risque : c'est la lecture de Claude, pas celle d'un juriste ; si France Travail demandait le retrait, la tranche emploi serait à retirer du site. Faible, à mon avis : même producteur, même usage que le fichier sous Licence Ouverte. |
| **B. Demander d'abord à France Travail** : tu écris (je prépare le message) à leur responsable de la réutilisation des données (PRADA), ou au contact de l'enquête BMO, et on attend la réponse. | La tranche s'arrête jusqu'à la réponse : quelques jours à quelques semaines. Le 6 décembre est probablement manqué. |
| **C. Les deux : A tout de suite, et B en parallèle.** On construit avec la table et la mention datée ; tu envoies la question à France Travail ; s'ils disent non, retour à toi avant la mise en ligne. | Aucun délai ; un message à envoyer de ton côté. Si la réponse est non, le travail fait sur la jointure est perdu (le reste de la tranche aussi, faute d'autre source). |

**Recommandation : C.** La loi permet très probablement cet usage, et la demande écrite lève le doute sans bloquer la tranche. Si tu choisis A ou C, le builder suivant reprend la tâche 0a en entier, avec la mention datée ci-dessus à la place de celle de H143 (à confirmer : c'est un texte du pied de page).
