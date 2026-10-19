# Corrections 2 — La France insoumise rangée à gauche, pastille « Extrême gauche » retirée (D2 amendée)
Statut : faite · Début 12:33 · Fin 12:54 · Commits : 8325265 (données), f9e1366 (code), 99be0f3 (tests), bf5b500 (docs), puis celui de ce rapport et des preuves

## Ce que l'utilisateur peut faire maintenant
La catégorie « Vie locale » a 6 pastilles : Gauche · Divers · Centre / Droite · Extrême droite / Sans étiquette (avec sa phrase). Cocher « Gauche » garde aussi les 7 villes à mairie La France insoumise (Roubaix, Saint-Fons, Creil, Vénissieux, Vaulx-en-Velin, La Courneuve, Saint-Denis) : 748 communes passent à `/?loyer=1200&mairie=gauche`. La fiche de Roubaix dit « Mairie : Gauche (La France insoumise) · « FIERS DE ROUBAIX » ». Une ancienne adresse avec `mairie=extreme-gauche` s'ouvre sans filtre (`/?loyer=1200`). Le pied de page dit pourquoi les blocs s'écartent de la circulaire.

## Les 7 points du brief
| Point | Fait | Commit | Preuve |
|---|---|---|---|
| 1. Données | `nuances-2026.csv` : LFI et LEXG passent à `bloc` = `gauche` ; deux colonnes ajoutées, `bloc_annexe` (le bloc de l'annexe, pour les 25 lignes) et `ecart` (« rangée à gauche par Vincent le 2026-10-19 (D2 amendée) » pour ces deux lignes) ; étiquettes inchangées. `mairies.py` : `BLOCS` sans `extreme-gauche`, nouveau contrôle « seules LEXG et LFI quittent le bloc de l'annexe, extreme-gauche → gauche, écart noté ». `nuances.json` régénéré par `python3 -I scripts/data/mairies.py` ; `mairies.json` **identique octet pour octet** (`cmp` contre la version committée : aucune différence) ; tous les contrôles « ok » | 8325265 | `captures/C2-controles-mairies.txt` |
| 2. Code | `Bord` sans `extreme-gauche` (`score.ts`), `ORDRE_BORDS` (`url.ts`), `LIBELLE_BORD` (`format.ts`) ; `VieLocale.tsx` : « Sans étiquette » porte `col-start-1`, elle revient en 1re colonne de la 3e ligne et la 6e case reste vide. `mairie=extreme-gauche` est ignoré comme tout nom inconnu (R41, `lireListe` existant). Aucune couche de carte ; aucun jeton nouveau (`check-tokens` : aucune valeur arbitraire) | f9e1366 | `captures/C2-vie-locale-1440x900.jpg`, `captures/C2-vie-locale-390x844.jpg` |
| 3. Pied de page | `Mentions.tsx` : « … blocs politiques : circulaire du 2 février 2026, sauf l'extrême gauche (dont La France insoumise), rangée à gauche » (H118 amendée, mot pour mot) | f9e1366 | `captures/C2-pied-de-page-1440x900.png` |
| 4. CLAUDE.md | Données : la mention de H118 amendée ; la table des nuances (LEXG, LFI en gauche, avec l'écart à l'annexe, décision de Vincent du 2026-10-19, `mairie=extreme-gauche` ignoré) ; le compte par bloc au 2026-10-19 | bf5b500 | diff de CLAUDE.md |
| 5. mesure-tache-0.md | Section « Amendement du 2026-10-19 (D2) » ajoutée à la fin, sections d'avant non touchées : par bloc, **gauche 760**, divers 561, centre 571, droite 1 212, extrême droite 60, sans étiquette 31 508, sans résultat 74 (mesuré par le script, pas supposé) ; à `/?loyer=1200&mairie=gauche`, 748 classées, les 10 premières (Clamecy 69 … Ambert 64), identiques à celles de la tâche 0 ; rang des 7 LFI (Roubaix 507ᵉ … Saint-Denis 738ᵉ) | bf5b500 | `captures/C2-10-premieres-par-bloc.txt`, `captures/C2-mesure-10-premieres.test.ts.txt` |
| 6. Tests de la tranche | Alignés avec l'outil Edit seulement ; détail avant / après ci-dessous ; 3 tests ajoutés | 99be0f3 | suite complète verte |
| 7. Preuves | Suite complète, typecheck, build, check-tokens ; sur `npx vite preview --port 4180` (vraies données, version bf5b500), 1 440 × 900 et 390 × 844 : tout « OK », aucun « ÉCART » ; serveur arrêté à la fin (4180 et 4173 libres) | ce rapport | `captures/C2-preuves-sortie.txt`, script `captures/C2-preuves.mjs` |

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-1 | `tests/e2e/mairies.spec.ts` · « AC-1 ouverture de / : /?loyer=1200 ; « Vie locale » ouverte suit « Cadre de vie », groupe « Mairie élue en 2026 » et ses 6 pastilles dans l'ordre, aucune cochée ; 5 communes ; repliée, « Peu importe » et pastilles cachées » | vert, bureau et mobile |
| AC-9 | même fichier · « AC-9 390 × 844, onglet « Critères » : … chaque pastille amenée à l'écran … se coche d'un toucher ; « Droite » puis « Les 10 premières » : 1 commune, Portmer (17) 46 ; mairie=droite » | vert (mobile ; sauté en bureau par construction, comme avant) |
| AC-10 | même fichier · « AC-10 ouverture de / : le pied de page cite les résultats des municipales 2026 et la circulaire du 2 février 2026, sauf l'extrême gauche rangée à gauche (H118 amendée), à côté des mentions précédentes » | vert, bureau et mobile |
| AC-2 à AC-8, AC-11, AC-12 | tests inchangés dans leurs valeurs | verts |

### Tests d'AC changés, avant / après
- **AC-1** (`tests/e2e/mairies.spec.ts`) — nom : « … ses 7 pastilles dans l'ordre … » → « … ses 6 pastilles dans l'ordre … ». Libellés attendus : `['Extrême gauche', 'Gauche', 'Divers', 'Centre', 'Droite', 'Extrême droite', 'Sans étiquette']` → `['Gauche', 'Divers', 'Centre', 'Droite', 'Extrême droite', 'Sans étiquette']`. Le reste (adresse, 5 communes et leurs scores, repliée) inchangé.
- **AC-9** (même fichier) — `noms` : la même liste de 7 → la liste de 6 ci-dessus ; nom du test inchangé (il disait déjà « chaque pastille »).
- **AC-10** (même fichier) — nom : « … et la circulaire du 2 février 2026 (H118), … » → « … et la circulaire du 2 février 2026, sauf l'extrême gauche rangée à gauche (H118 amendée), … ». Texte attendu : « … blocs politiques : circulaire du 2 février 2026 » → « … blocs politiques : circulaire du 2 février 2026, sauf l'extrême gauche (dont La France insoumise), rangée à gauche ». Les 8 mentions précédentes inchangées.
- **AC-12** (`scripts/data/mairies.test.ts`, test de structure qui l'accompagne) — nom : « … chacune dans un des 6 blocs » → « … chacune dans un des 5 blocs du site (D2 amendée) » ; ensemble des blocs sans `extreme-gauche`. Les deux tests nommés AC-12 (comptes, 5 villes) inchangés.

### Tests hors AC changés, avant / après
- `tests/e2e/mairies.spec.ts`, « design F : 3 colonnes … » — `toHaveCount(7)` → `toHaveCount(6)` ; « Centre sous Extrême gauche » (`boites[3].x == boites[0].x`) → « Droite sous Gauche » (même assertion, autres libellés) ; ajouté : `boites[4].y == boites[3].y` (Extrême droite à côté de Droite, la 6e case vide) ; « Sans étiquette » `boites[6]` → `boites[5]` (même position attendue : 1re colonne, sous la 2e ligne).
- même fichier, « H122 : pendant le chargement, les 7 pastilles sont désactivées » → « … les 6 pastilles … », `toHaveCount(7)` → `toHaveCount(6)`.
- même fichier, « 375 × 548 … » — `toHaveCount(7)` → `toHaveCount(6)`.
- `src/domain/mairies.test.ts` :
  - « chaque bloc seul : extrême gauche aucune, divers aucune …, extrême droite Quaibleu 9 » → « chaque bloc seul : divers aucune …, extrême droite Quaibleu 9 » ; l'assertion `ev(['extreme-gauche'])` → `[]` est retirée (le bloc n'existe plus, le type la refuse).
  - « le filtre ne note pas : les 7 cochées … » → « … les 6 cochées … », valeurs attendues inchangées.
  - « noms de H108, dans l'ordre de R38 … » — `ORDRE_BORDS` attendu : 7 noms → 6 noms ; adresse lue sans `extreme-gauche` ; adresse écrite attendue `mairie=extreme-gauche,gauche,…` → `mairie=gauche,…`.
  - raisons : la ligne `bord: 'extreme-gauche'` → « Mairie : extrême gauche, … » est remplacée par `bord: 'gauche'` → « Mairie : gauche, hors des mairies choisies ».
  - fiche : « … pas de parenthèse (Extrême gauche, Divers, Extrême droite) » → « … pas de parenthèse (Divers, Extrême droite) ; LEXG, rangée en Gauche (D2 amendée), garde son étiquette » ; `{ bord: 'extreme-gauche', nuance: 'Extrême gauche' }` → « Mairie : Extrême gauche · « L » » devient `{ bord: 'gauche', nuance: 'Extrême gauche' }` → « Mairie : Gauche (Extrême gauche) · « L » ».

### Tests ajoutés
- `scripts/data/mairies.test.ts` · « D2 amendée (Vincent, 2026-10-19) : LFI et LEXG rangées en gauche, étiquettes de l'annexe ; Roubaix (59512), mairie LFI, bloc gauche « FIERS DE ROUBAIX » » (vrais fichiers servis).
- `src/domain/mairies.test.ts` · « H117 amendée (D2, 2026-10-19) : `extreme-gauche` est un nom inconnu, ignoré ; /?mairie=extreme-gauche → /?loyer=1200 » — rouge avant le changement du code (« expected true to be false »), vert après.
- `src/domain/mairies.test.ts` · « D2 amendée … : avec la vraie table des nuances, une mairie LFI (Roubaix, 59512) a le bord gauche ; fiche « Mairie : Gauche (La France insoumise) · « FIERS DE ROUBAIX » » ».
- `tests/e2e/mairies.spec.ts` · « H117 amendée : /?mairie=extreme-gauche devient /?loyer=1200, aucune pastille cochée, 5 communes ; /?mairie=extreme-gauche,gauche ne coche que « Gauche » » (bureau et mobile).

Aucun test d'une tranche précédente n'a changé ni cassé.

## Preuves
- `captures/C2-controles-mairies.txt` — sortie de `python3 -I scripts/data/mairies.py` : tous les contrôles « ok », dont le nouveau contrôle de l'écart ; « mairies par bloc : gauche 760, divers 561, centre 571, droite 1212, extreme-droite 60, sans étiquette 31508 » (2026-10-19 12:35)
- `cmp public/data/mairies.json <(git show HEAD:public/data/mairies.json)` → aucune différence (2026-10-19 12:35)
- `captures/C2-vie-locale-1440x900.jpg` — bureau, « Vie locale » : Gauche · Divers · Centre / Droite · Extrême droite · (vide) / Sans étiquette et sa phrase ; cases 97 × 44 (12:50)
- `captures/C2-vie-locale-390x844.jpg` — téléphone, onglet « Critères » : même grille, cases 114 × 44 (12:51)
- `captures/C2-gauche-liste-1440x900.jpg`, `captures/C2-gauche-liste-390x844.jpg` — `/?loyer=1200&mairie=gauche` : « 748 communes passent tes critères », 10 premières égales à la mesure (Clamecy (58) 69 … Ambert (63) 64) (12:51)
- `captures/C2-fiche-roubaix-depart-1440x900.jpg` — `/?loyer=1200`, fiche de Roubaix (59) : « Mairie : Gauche (La France insoumise) · « FIERS DE ROUBAIX » » (12:51)
- `captures/C2-fiche-roubaix-gauche-1440x900.jpg` — `/?loyer=1200&mairie=gauche` : Roubaix passe, « 507e sur 748 communes qui passent », même ligne « Mairie » (12:51)
- `captures/C2-pied-de-page-1440x900.png` — pied de page avec la mention amendée (12:51)
- `captures/C2-preuves-sortie.txt` — journal du script : adresse `/?loyer=1200` et 6 pastilles non cochées aux deux largeurs ; positions de la grille ; compte et 10 premières ligne par ligne ; `/?mairie=extreme-gauche → /?loyer=1200 · cochées []` aux deux largeurs ; fiche de Roubaix ; mention ; 0 « ÉCART » (12:50-12:51)
- `captures/C2-npm-test.txt` — suite complète (12:40-12:52)

Ce que la preuve ne couvre pas : la version en ligne (rien n'est poussé) ; la fiche de Roubaix au téléphone (vérifiée en bureau seulement, le texte vient de la même fonction).

## Suite de tests
```
Vitest :     Test Files  20 passed (20)
                  Tests  315 passed (315)        (312 à corrections 1 ; +3 tests ajoutés)
Playwright :   38 skipped
              381 passed (11.7m)                 (379 à corrections 1 ; +1 test ajouté × 2 largeurs ; 38 sautés, comme avant)
npm test : exit 0
npm run typecheck (tsc --noEmit -p .) : aucune erreur
npm run build : ✓ built in 1.70s (dist/version.txt = bf5b500)
node scripts/check-tokens.mjs : check-tokens : 42 fichier(s), aucune valeur arbitraire
```
Port 4173 libre avant la suite ; charge 3 à 6 pendant la suite.

## Décisions prises à la place de Vincent
- Décision : la trace de l'écart à l'annexe dans `nuances-2026.csv` est faite de deux colonnes, `bloc_annexe` (le bloc de l'annexe 3 pour chaque ligne) et `ecart` (la note, pour LFI et LEXG seulement), plutôt qu'une seule note — pourquoi : la table garde ce que dit la circulaire ligne par ligne, et `mairies.py` peut contrôler que seules ces deux lignes s'en écartent — coût si c'est faux : deux colonnes à retirer, aucun effet sur le site (`nuances.json` ne lit que l'étiquette et le bloc).
- Décision : « Sans étiquette » est remise en 1re colonne de la 3e ligne par une classe Tailwind `col-start-1` sur sa case, sans case vide factice dans la grille — pourquoi : la 6e case reste vide sans élément en plus pour les lecteurs d'écran — coût si c'est faux : aucun, une ligne à changer.
- Décision : une étiquette LEXG (aucune mairie aujourd'hui) s'affichera « Mairie : Gauche (Extrême gauche) · « … » » — pourquoi : c'est la règle de R40 (bloc, puis étiquette de l'annexe quand elle diffère du bloc) — coût si c'est faux : une ligne de fiche qui peut surprendre, si une mairie LEXG apparaît un jour.

## Fichiers touchés hors de la liste de la tâche
- `src/domain/score.ts` (type `Bord` et son commentaire) et `src/domain/format.ts` (`LIBELLE_BORD`) : nommés dans le brief comme « tout ce qui en dépend ».
- `docs/plans/2026-10-18-mairies/captures/C2-*` : preuves.

## Leçons écrites
Aucune : pas de correctif qui ait demandé plus d'un essai (seul le script de preuve a été relancé deux fois, pour deux erreurs de copie dans ses fonctions), aucune mesure contraire au plan.
