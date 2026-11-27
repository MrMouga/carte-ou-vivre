# Retouches 1 — urgences de Chamonix et supermarché de Tende retirés (D12, H210)
Statut : faite · Début 12:14 · Fin 12:17 · Commits : un seul, « tweak(services): urgences de Chamonix et supermarché de Tende retirés (D12, H210) » (sur f0fcd20)

## Ce que l'utilisateur peut faire maintenant
- La fiche de Chamonix-Mont-Blanc dit « Urgences : pas de chiffre » (au lieu de 4 min) ; son supermarché reste à 3 min.
- La fiche de Tende dit « Supermarché : pas de chiffre » (au lieu de « plus d'une heure ») ; ses urgences restent « plus d'une heure ».
- Avec « Urgences » coché, Chamonix passe désormais comme toute commune sans chiffre (R53, inchangée).

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-13 | `scripts/data/services.test.ts` · « AC-13 : une ligne par commune de la carte ; Auch, Bordeaux, Mende, Saint-Véran, Chamonix-Mont-Blanc, … » — Chamonix attendu `[null, 3]` (urgences sans chiffre, supermarché 3) | rouge avant régénération (12:14:09), vert après (12:14:54) |
| AC-13 | contrôle `AC13` de `scripts/data/services.py` — `'74056': {'urgences': None, 'supermarche': 3}` | « ok AC-13 : Chamonix-Mont-Blanc (74056) {'urgences': None, 'supermarche': 3} » |

## Preuves
- `captures/R1-comparaison-services.txt` (produit par `captures/R1-comparer-services.mjs`, avant = `public/data/services.json` de f0fcd20) — 660 493 caractères avant et après, **2 caractères différents** : `urgences · 74056 : « 4 » → « - »` et `supermarche · 06163 : « z » → « - »` ; OK (2026-11-27 12:14)
- `captures/R1-chamonix-1440x900.jpg` — fiche de Chamonix-Mont-Blanc, vraies données, version construite (`vite preview --port 4180`) : « Urgences : pas de chiffre », « Supermarché : 3 min » (12:15)
- `captures/R1-tende-1440x900.jpg` — fiche de Tende : « Supermarché : pas de chiffre », « Urgences : plus d'une heure », « Collège : pas de chiffre » (retrait du 2026-11-24) (12:15)
- `captures/R1-fiches.log` — les 11 lignes de services lues dans chaque fiche (script `captures/R1-fiches.mjs`, communes choisies par la recherche, repris de `T2-bout-en-bout.mjs`) (12:15)
- `python3 -I scripts/data/services.py` : 33 contrôles « ok », aucun échec ; `retraits (D12, services-retraits.csv) : 5 [('06163', 'college'), ('29238', 'creche'), ('29238', 'college'), ('74056', 'urgences'), ('06163', 'supermarche')]` ; `public/data/gares-grandes-lignes.csv` inchangé (12:14)
- Serveur de prévisualisation arrêté à la fin.

## Suite de tests
- Unitaires : `Test Files  27 passed (27)` · `Tests  462 passed (462)`
- Types : `tsc --noEmit -p .` sans erreur
- Jetons : `check-tokens : 49 fichier(s), aucune valeur arbitraire`
- Build : `✓ built in 1.92s` (avertissement habituel de taille de morceau)
- Playwright, `tests/e2e/services.spec.ts` seul (consigne) : `56 passed (45.5s)`, `4 skipped` (les `test.skip` conditionnels existants : bureau / mobile, lignes 201, 789, 819, 842 ; non touchés)

## Valeurs de contrôle du script mises à jour (avant → après)
- `AC13['74056']` : `{'urgences': 4, 'supermarche': 3}` → `{'urgences': None, 'supermarche': 3}` (AC-13 amendé, H210).
- `SUPERMARCHE` (comptes contrôlés, arrêt s'ils diffèrent) : `'>60': 12, 'sans': 15` → `'>60': 11, 'sans': 16` (Tende passe de « au-delà de 60 » à « sans chiffre ») ; seuils 5 à 60 inchangés. Commentaire ajouté au-dessus, qui garde les anciennes valeurs de mesures.md ; message du contrôle complété (« Tende retiré (H210) »).
- `ATTENDU['avec un temps']` (34 738) inchangé : Chamonix et Tende gardent d'autres temps.
- Comptes d'urgences (information, non contrôlés) : « sans » 18 → 19, chaque seuil ≤ 5 … ≤ 60 baisse de 1 (850 / 851 au lieu de 851 / 851, etc.) ; l'écart « nouveau / ancien » affiché par le script vient de Chamonix.

## Décisions prises à la place de Vincent
- Décision : les preuves des deux lignes reprennent mot pour mot le texte du brief ; les chiffres 33,9 min (Sallanches) et 27,3 min (Breil-sur-Roya) sont ceux de `credibilite-urgences.md` (lignes 41 et 53), vérifiés — rien à corriger — coût si c'est faux : nul (texte de preuve seulement).
- Décision : `docs/specs/2026-11-23-services/mesures.md` n'est pas touché (dossier de spec) ; ses comptes du supermarché (`>60` 12, `sans` 15) sont désormais dépassés d'une commune, ce que dit le commentaire de `SUPERMARCHE` dans `services.py` — coût si c'est faux : une note de mise à jour dans mesures.md, à faire par l'orchestrateur s'il le souhaite.

## Fichiers touchés hors de la liste de la tâche
- `docs/plans/2026-11-26-services-revision/captures/R1-comparer-services.mjs`, `R1-comparaison-services.txt`, `R1-fiches.mjs`, `R1-fiches.log`, `R1-chamonix-1440x900.jpg`, `R1-tende-1440x900.jpg` — preuves demandées.

## Tests existants modifiés
- `scripts/data/services.test.ts` — test « AC-13 … » : Chamonix attendu `[4, 3]` → `[null, 3]` (urgences sans chiffre) — AC-13 amendé par Vincent à la démo (H210, commit f0fcd20) ; titre du test inchangé.
- `scripts/data/services.py` — contrôles `AC13['74056']` et `SUPERMARCHE` (voir plus haut) — même raison.

## Leçons écrites
Aucune (tout a marché du premier coup).
