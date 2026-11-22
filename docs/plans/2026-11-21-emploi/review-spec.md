# Relecture spec — emploi
Statut : terminé (trois rouges Playwright de proches-fiables pas relancés seuls : port 4173 pris par une autre suite ; voir « Non vérifié »)

Suite de tests (relancée par ce relecteur, `npm test`, 2026-11-22 à partir de 11:3x) :
- Vitest : `Test Files 22 passed (22) · Tests 361 passed (361)`.
- Playwright : `414 passed (12.1m) · 3 failed · 43 skipped · 1 did not run`. Les 3 rouges sont tous dans `proches-fiables.spec.ts` : [bureau] AC-8 (d) l. 544, [bureau] AC-9 l. 669, [mobile] AC-10 (c) l. 267. Les 37 tests d'`emploi.spec.ts` (bureau et mobile) sont **tous verts**.

Périmètre : `6d8e284..HEAD` (34 commits, 2026-11-21 16:11 → 2026-11-22 11:35).

## Constats

Aucun Bloquant et aucun Majeur trouvé dans le code de la tranche. R44 à R50 et D1 à D14 sont livrés comme écrits. Les textes exacts de R46 et R47, les mentions de H143, le paramètre `metier` de R48, les distances de H136 / H144, Paris-Lyon-Marseille (H142), la jointure par code INSEE et les mots de D6 ont été vérifiés dans le code et sur `emploi.json` (détail dans « Ce qui est bien fait »).

[Mineur, à confirmer] Trois rouges de proches-fiables (dans la liste « Ne change pas ») pendant ma relance, pas relancés seuls.
  Où : `tests/e2e/proches-fiables.spec.ts:544` (AC-8 (d), bureau), `:669` (AC-9, bureau), `:267` (AC-10 (c), mobile).
  Preuve : fin de `npm test`. Les trois échecs portent sur le **nombre ou le moment des appels au service de trajets de l'IGN** :
  - AC-8 (d) : 2 requêtes d'isochrones vues au lieu de 12 ;
  - AC-10 (c) : 24 au lieu de 12 ;
  - AC-9 : « À vol d'oiseau » encore affiché au bout de 5 s.
  Ce sont des tests sensibles au temps. La suite de l'orchestrateur de 11:36 avait 0 rouge, et la tranche ne touche aucun fichier des proches. Mais elle ajoute un calcul au chargement (villes à 30 km : ~50 ms, ~170 ms au processeur ralenti 4 fois), qui peut décaler un minutage serré.
  Pas relancés seuls : à la fin de ma suite, le port 4173 était déjà pris par la suite d'un autre agent (`vite --port 4173`, PID 88019), que je n'ai pas arrêtée.
  Correction : une fois le port libre, `npx playwright test tests/e2e/proches-fiables.spec.ts:544 tests/e2e/proches-fiables.spec.ts:669 tests/e2e/proches-fiables.spec.ts:267 --repeat-each=3`. Trois verts : instabilité connue (leçon `2026-10-15-suite-instable-port-4173-et-machine-saturee.md`). Un rouge qui se répète : régression sur une tranche validée, donc **Bloquant**.   Réf : plan, « Ne change pas »

[Mineur] Dépendance circulaire de types entre `score.ts` et `emploi.ts`.
  Où : `src/domain/score.ts:14` (`import type { Emploi } from './emploi'`) ; `src/domain/emploi.ts:7` importe des valeurs de `score.ts` ; `src/domain/format.ts:3` importe `RAYON_KM` d'`emploi.ts`.
  Preuve : lu. C'est un import de type, effacé à la construction : aucun effet sur la page. Mais `evaluer` connaît désormais la forme des données d'emploi.
  Correction : déplacer le type des données de filtrage (`bassins`, `metiers`, `aTrente`) dans `score.ts` ou dans un fichier de types partagé.   Réf : brief, point 6

[Mineur] Preuves de bout en bout incomplètes : l'étape 7 (iPhone) n'a pas de capture, et la capture de l'étape 6 (mentions) est le même fichier que celle de l'étape 5.
  Où : `captures/T4-etape5-nouvel-onglet-1440x900.jpg` = `T4-etape6-mentions-1440x900.jpg` (md5 `4586b277…`) ; progress.md l. 28 (« pas de capture déposée »).
  Preuve : `md5 -q` ; details.md, « Vérification de bout en bout » : « Preuves : captures des étapes 1 à 7 ».
  Effet : AC-13 repose sur le test e2e (vert) et sur la phrase de Vincent. C'est recevable, mais pas la preuve que la spec demande. Les mentions sont lisibles sur la vue de l'étape 5, et `T2-pied-de-page-1440x900.png` les montre déjà.
  Correction : demander une capture iPhone à la démo ; sinon, écrire dans progress.md que l'étape 7 a été validée sur parole.   Réf : details.md, AC-13

[Mineur] Restes laissés dans le code. `performance.measure(...)` reste dans le code servi (`src/domain/emploi.ts:98`, décision T1). Le rayon de la Terre est réécrit (`emploi.ts:59`) au lieu d'être exporté par `src/proches/distance.ts`. Le geste du toucher est copié de `Proches.tsx` dans `Emploi.tsx:104-118`. Les deux derniers sont déjà notés par l'orchestrateur (progress.md l. 31).   Réf : « Simplicité d'abord »

## Couverture des critères (mode spec)
| AC | Test (fichier · nom) | Statut | Note |
|---|---|---|---|
| AC-1 | `tests/e2e/emploi.spec.ts:100` · « AC-1 ouverture de / … » | couvert, vert (bureau, mobile) | ordre des catégories, champ vide, phrase D13, mentions, une seule suggestion, adresse, pastilles non cochées, liste inchangée, « 1 métier » |
| AC-2 | `emploi.spec.ts:140` · « AC-2 « i », « medecin »… » (+ unitaire `src/domain/emploi.test.ts:458`) | couvert, vert | les 7 saisies, « Aucun métier trouvé », adresse |
| AC-3 | `emploi.spec.ts:420` · « AC-3 … « + Ajouter un second métier » … » | couvert, vert | « infirm » → aucun, deux métiers, « 2 métiers », retrait, lien revenu |
| AC-4 | `emploi.spec.ts:306` (+ `emploi.test.ts:137`) | couvert, vert | adresse, 1 commune, couleurs A B E F au pixel, ligne et raison une seule fois |
| AC-5 | `emploi.spec.ts:324` (+ `emploi.test.ts:145`) | couvert, vert | 4 puis 5 communes dans l'ordre, raison Montcher 160 km, « sur place » |
| AC-6 | `emploi.spec.ts:349` (+ `emploi.test.ts:156`) | couvert, vert | raison des graphistes (85 km), aucune des infirmiers, ligne à 25 km |
| AC-7 | `emploi.spec.ts:366` | couvert, vert | sans plafond, C et D neutres, A B E F non colorées |
| AC-8 | `scripts/data/emploi.test.ts:15` · « AC-8 : b01 500… » | couvert, vert | lance `emploi.py --extrait` sur l'extrait de la fixture ; objet entier comparé |
| AC-9 | `emploi.spec.ts:377` (+ `emploi.test.ts:164`) | couvert, vert | pas de chiffre, 1 027, `:tous`, raison 160 km, « Chômage : inconnu » |
| AC-10 | `emploi.spec.ts:40` (+ `emploi.test.ts:364`) | couvert, vert | lignes exactes et ordre sous « Mairie » |
| AC-11 | `emploi.spec.ts:398` (+ `emploi.test.ts:265-273`) | couvert, vert | trois réécritures, case cochée pour les infirmiers seulement |
| AC-12 | `src/domain/emploi.test.ts:307, 320, 329, 344` | couvert, vert | sur les vrais fichiers, avec les fonctions de la page (choix du plan) ; la page réelle est vue dans les captures T1 et T4 |
| AC-13 | `emploi.spec.ts:538` · « AC-13 / à 390 × 844 … » | couvert, vert ([mobile] seul, par conception) | plus la parole de Vincent sur iPhone, sans capture (Mineur ci-dessus) |
| AC-14 | `emploi.spec.ts:163` | couvert, vert | phrase présente, place, `aria-describedby`, adresse après « 25 % » |

Les 14 `passes: true` sont soutenus par un test réel, qui passe et qui vérifie les valeurs du critère.

**Ne change pas** (AC des tranches précédentes) : verts dans ma relance jusqu'ici pour adresse, cadre-de-vie, carte, etats, fiche, immobilier, liste, mairies, proches-carte, proches-clavier-iphone, proches-etats, proches, telephone-feuille. Exception : proches-fiables AC-8 (d) et AC-9 [bureau], AC-10 (c) [mobile], rouges, pas relancés seuls (voir constats). Liste lue par fichier : ma relance ne permet pas d'établir le statut AC par AC.

## Détours
- **Tests existants modifiés** (`git diff --stat --diff-filter=MDR 6d8e284..HEAD -- tests src/**/*.test.ts scripts/data/*.test.ts`) : seulement `tests/e2e/lib/carte.ts` (+40 lignes, 0 ligne changée) et `tests/e2e/mairies.spec.ts` l. 78 (`'Vie locale'` → `'Emploi'`, H111 révisée par H129). Ce sont les deux seuls changements que le plan autorisait.
- `acceptance.json` d'emploi : seuls les drapeaux `passes` ont changé, dans les commits « vérifiée » de l'orchestrateur ; aucun `given / when / then` n'a été touché.
- `details.md` d'emploi : H135 (Confolens), H142 (Yvrench) et H143 (licence) amendées, chacune annotée avec la décision de Vincent.
- Fichiers hors des listes du plan, tous expliqués dans un rapport :
  - `src/App.tsx` en T2 (4 lignes, T2.md l. 83) et en T3a (1 ligne, T3a.md l. 86) ;
  - `src/domain/emploi.ts` en T2 (T2.md l. 84) ;
  - `src/ui/Settings.tsx` en T4 (T4.md l. 128).
- Simplification (94aea6a) : elle touche aussi `emploi.py`, `score.ts`, `url.ts`, `emploi.test.ts` et `emploi.spec.ts`. Diff relu : aides regroupées, aucune valeur attendue changée.
- Dans `emploi.spec.ts` (fichier créé par la tranche), T4 ajoute à 390 px une sortie du champ dans un test de 3a. C'est expliqué, et aucune valeur attendue ne change.
- Aucun revert dans l'historique.
- Écarts au plan écrits dans progress.md :
  - les communes absentes de la table prennent le bassin de leur ancien code, et non celui de la commune 2026 (contrôle H142 vert) ;
  - le clavier des suggestions est repris du prototype F ;
  - l'adresse garde les codes de métier inconnus jusqu'au chargement (≤ 1 s).
- Preuves de progress.md : toutes présentes. Chacune date d'avant le commit final de sa tâche (fichiers ajoutés dans ce commit) : T0a 16:11-16:51 (commit final 17:04), T0c 17:49 (17:50), T1 18:12-18:14 (18:14), T2 18:37 (19:06), T3a 19:40 (19:41), T3b 20:02-20:14 (20:14), T4 20:51-21:31 (21:32 ; build de 21:15 = code final, d'après T4.md). Deux paires de captures identiques sans conséquence : T1 Bordeaux (1 et 2 métiers, la fiche de T1 n'a pas encore les lignes de métier) et T3b liste « choisi » / « décoché » (même état attendu).

## Ce qui est bien fait
- `emploi.json` relu :
  - 389 bassins, 217 métiers, 34 746 communes, chacune avec un bassin et une zone ;
  - Paris, Lyon et Marseille villes principales de 1107, 8428 et 9306 ;
  - M2X90 : 39 / 98 / 120 ; Bordeaux 742 au niveau « 10 » ; La Rochelle sans chiffre ;
  - au moins 6 bassins chiffrés pour chaque métier ;
  - 96 métiers peu chiffrés, et le drapeau correspond exactement à « moins de 130 » ;
  - aucune distance dans le fichier ;
  - 57 noms courants, chacun vers un seul métier, dont les 7 demandés.
- R45 : un seul calcul, en entiers, égalités gardées (`emploi.py`, `niveaux`).
- R46 et H136 : une seule source de distance, qui sert au filtre, à la ligne de la fiche et à « le plus proche ». Le tri par latitude est contrôlé contre le calcul complet. L'ordre en cas d'égalité suit H136.
- R47 et R49 : textes exacts, espaces insécables, trimestre lu dans le fichier, mentions de H143 avec la date de la table (et dans CLAUDE.md).
- R48 : ordre `mairie` puis `metier` puis `bien` ; doublon, niveau inconnu, code inconnu et troisième métier retirés ; `REGLAGES_DEPART` inchangé ; champ absent sans métier.
- Jetons : `node scripts/check-tokens.mjs` → 44 fichiers, aucune valeur arbitraire.
- Accessibilité : combobox et listbox, groupe nommé « Où ce métier recrute le plus <libellé> », `aria-describedby` (H147, H130), « Retirer <libellé> », focus géré, cibles de 44 px.

## Non jugé
- Les trois rouges de proches-fiables : pas relancés seuls (port 4173 pris par la suite d'un autre agent à la fin de la mienne).
- `npm run typecheck` et `npm run build` non relancés par moi (l'orchestrateur les donne verts à 11:36).
- Rendu visuel sur les vraies données et à 375 × 548 : non regardé par moi (couvert par les tests et les captures, relecture QA séparée).
- Libellés des niveaux et « 5400e » : hors périmètre, à la demande du brief.
- Note de méthode : un `npx madge --version` lancé par ce relecteur (11:37) a téléchargé madge dans le cache npm de la machine (`~/.npm/_npx/483d2954a4c5190c`). Rien n'a été ajouté au projet ni au lockfile, et l'outil n'a pas servi. Ce dossier peut être supprimé.
