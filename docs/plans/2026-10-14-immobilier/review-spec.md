# Relecture spec — immobilier
Suite de tests (relancée par le relecteur le 2026-10-14, `npm test`, seule) : Vitest **13 fichiers, 142 tests passés** ; Playwright **238 passés, 31 sautés (5.9m)**, code de sortie 0. `npm run typecheck` : sans erreur. `npm run check-tokens` : « 38 fichier(s), aucune valeur arbitraire ».
Périmètre : `bfceb51..b15105b` (28 commits), jugé contre la spec immobilier (D1–D10, R21–R26, H56–H68) **plus** les décisions de Vincent de `progress.md` (règle de prix 2023-2025 dès 30 ventes / 2021-2025 dès 5 / intercommunalité ; seuil 300 €/m² ; communes sans prix toujours après celles qui en ont un ; Paris maison selon H67 à la lettre).

**Aucun Bloquant.** Les 13 critères ont un test qui porte leur id, qui passe aux deux largeurs et qui vérifie les valeurs exactes du critère. Les critères des tranches précédentes listés sous « Ne change pas » passent tous. Les écarts ci-dessous viennent des données et des décisions prises pendant la construction, pas d'une règle de la spec manquante.

## Constats

[Majeur] En Acheter, les premières communes de la liste sont celles dont le prix est le moins fiable — en Acheter · Appartement avec la mer sur « Sans limite », le top 10 réel est Montdardier (30) à **300 €/m²** (exactement le seuil de Vincent), puis **9 communes du Cher à 312 €/m²**, toutes au prix de leur intercommunalité (« secteur »). Avec la mer à 200 km, le haut de la liste est formé de villages corses à 400–500 €/m² (Renno 400, Poggio-di-Nazza 458). Sur les vraies données, 428 prix d'appartement sont sous 500 €/m², dont 389 pris au secteur. C'est exactement le risque nommé par la spec (« la carte peut sembler plus précise qu'elle n'est »). Or le test du risque a porté sur 7 communes connues de Vincent, pas sur ce que la liste montre en premier.
  Où : `public/data/achat.json` ; `scripts/data/communes.py:43` (`PRIX_ACHAT_MIN_M2 = 300`) ; `scripts/data/communes.py:158-170` (`prix_ligne`)   Preuve : `captures/T4-preuve.txt` (listes relevées à 19:55) ; relu par le relecteur dans `achat.json` : 18001, 18004, 18019 = 312 secteur ; 30176 = 300 commune ; 2A258 = 400 commune.
  Correction : à montrer à Vincent à la démo, avant /ship, avec ces listes. C'est une décision de données, pas un défaut de code. Pistes : un seuil plus haut, un plancher relatif au département, ou la mention « Estimation du secteur » dans la liste. Ce ne sont que des pistes, à lui de trancher.   Réf : spec « Le risque », D5 révisée par Vincent, décision du seuil de 300 €/m².

[Mineur] La fiche donne une fausse raison pour certaines communes, à cause du seuil de 300 €/m² — quand une commune a assez de ventes mais un prix écarté par le seuil, elle prend le prix de son intercommunalité. La fiche affiche alors « Estimation du secteur (moins de 5 ventes dans la commune) ». C'est faux pour **6 communes en appartement** (dont Civray, 18066 ; Guérigny en a 39 ventes selon le rapport T1) et **34 en maison**. Une commune (70491) affiche « trop peu de ventes dans le secteur » alors qu'elle a au moins 5 ventes. Le rapport T1 compte aussi 122 communes passées en « inconnu-secteur » à cause du seuil : leur secteur avait des ventes, mais un prix écarté, et la fiche dit pourquoi de façon inexacte. S'y ajoute Marseille en Maison (H67), déjà signalée par T3 : ce sont ses arrondissements qui ont moins de 5 ventes, pas la commune.
  Où : `src/domain/format.ts`, `estimationTexte` et `prixFiche` ; `scripts/data/communes.py:158-185`   Preuve : script du relecteur qui croise `achat.json` et `data-raw/stats_whole_period.csv` (sources « secteur » / « inconnu-secteur » contre `nb_ventes_whole_<bien>` ≥ 5) ; `taches/T1.md` lignes 87 et 118.
  Correction : faire écrire par `communes.py` la raison dans `achat.json` (moins de 5 ventes, ou prix écarté), puis un texte par raison. Sinon, Vincent amende R24 pour accepter un texte plus général (« Estimation du secteur »).   Réf : R24, H64, décision de Vincent sur le seuil (18:10).

[Mineur] Pas de ligne de légende pour la couleur neutre quand des critères sont actifs — en Acheter, environ 3 800 communes (11 %) sont peintes en sable. La légende ne montre alors que « Score 0 → 100 » et « Non colorée : ne passe pas ». C'est conforme à la lettre de H60 révisée par D10 (« légende inchangée »). Mais `.claude/rules/ui.md` dit que la couleur n'est jamais le seul indice : seule la fiche, ouverte commune par commune, explique le sable.
  Où : `src/ui/Legend.tsx:13` (la ligne sable n'apparaît que `sansPlafond`)   Preuve : code lu ; capture `T5-bureau-e5-fiche-strasbourg.png` (légende sans sable en Acheter) ; constat déjà noté par T4 dans `progress.md`.
  Correction : décision de Vincent à la démo (garder, ou ajouter une ligne « Sable : pas de score »).   Réf : H60, D10, `.claude/rules/ui.md`.

[Mineur] À 375 × 548, la légende cache des ronds du top 10 — à l'ouverture, la légende recouvre les ronds « 4·5·6 » et « 9·10 » sur la côte atlantique. La feuille est passée de 272 à 338 px (D11), ce qui réduit la bande de carte visible.
  Où : capture `captures/T5-375x548-e8-ouverture.png`   Preuve : capture regardée par le relecteur ; constat signalé par l'orchestrateur dans `progress.md` (T5).
  Correction : cadrer la carte sous la légende (marge haute de `paddingCarte` à 375 × 548), ou réduire la légende sous 1 024 px.   Réf : D11 et H48 d'interface-telephone, AC-1 d'interface-telephone (son test passe : il vérifie les couleurs, pas le recouvrement des ronds).

[Mineur] Les preuves sont prises quelques minutes avant leur commit, et la dernière vérification sur le vrai flux date d'avant la simplification — les captures de chaque tâche sont versionnées dans le même commit que le code (par exemple T2 : captures à 18:31:38, commit 634c08f à 18:39:29). Aucune n'est donc datée après le dernier commit de sa tâche. La capture T0 (16:16) précède la reprise de T0 (07f48cd, 17:03), qui a changé les prix ; la preuve de la reprise est `mesure-tache-0.md`. La vérification de bout en bout (`T5-bout-en-bout.txt`) porte sur la version 55f680d. Les commits f23fb2c et 54cdbbc ont touché `prix.ts`, `score.ts`, `url.ts` et `communes.py` ensuite. Le relecteur a relu f23fb2c : le changement de la condition du score (`passe && !sansNote && actif` → `passe && notes.length > 0`) est équivalent. Le risque est donc faible, mais aucune preuve sur le vrai flux ne porte sur HEAD. Le fichier `demo.md` prévu par la tâche 5 du plan n'existe pas (les preuves sont dans `captures/T5-*`). Les sections « Preuves » et « Coût » de `progress.md` sont vides.
  Où : `docs/plans/2026-10-14-immobilier/captures/` (dates des fichiers), `git log`   Preuve : `stat` des captures comparé aux dates des commits.
  Correction : refaire les étapes 1 à 8 sur la version construite de HEAD avant /ship, ou au moins l'étape 4 et l'étape 7. Créer `demo.md` ou retirer cette ligne du plan.   Réf : CLAUDE.md, « Fini = effet observé sur le vrai flux » ; plan, tâche 5.

## Couverture des critères (mode spec)
Tests e2e dans `tests/e2e/immobilier.spec.ts`, lancés dans les projets « bureau » (1 440 × 900) et « mobile » (390). Chaque critère est aussi recalculé sans navigateur dans `src/domain/prix.test.ts`, sauf AC-12.

| AC | Test | Statut | Note |
|---|---|---|---|
| AC-1 | immobilier.spec.ts:55 + prix.test.ts:60 | couvert | bascules, 52 m², 1 200 €, adresse, couleurs A/E/B, C/D/F non peintes, liste |
| AC-2 | :72 + prix.test.ts:71 | couvert | adresse, compte, 2 lignes, fiches de Grandeville et de Quaibleu |
| AC-3 | :180 + prix.test.ts:82 | couvert | 72 m² et 1 200 € gardés, adresse, lignes, « Estimation du secteur (communes voisines) », 1 224 € |
| AC-4 | :87 + prix.test.ts:95 | couvert | « Loyer mensuel », 23 €/m², champ absent, unite=m2, liste, retour à 1 200 € et 52 m² |
| AC-5 | :110 + prix.test.ts:112 | couvert | Au m², 5 000 €/m², adresse, 3 lignes, pas d'« Estimation du secteur », retour |
| AC-6 | :137 + prix.test.ts:132 | couvert | 260 000 €, unite=total, montants, fiche « 229 000 € pour 52 m² (4 400 €/m²) » |
| AC-7 | :199 + prix.test.ts:148 | couvert | adresse surface=52, lignes, deux fiches |
| AC-8 | :336 + prix.test.ts:160 | couvert | 4 lignes, Terrebasse « prix inconnu », score 10, « 4e sur 4 », C et F non peintes |
| AC-9 | :355 + prix.test.ts:176 | couvert | ordre et scores, D et F en `area-unranked`, Rhinval sans score ni rang |
| AC-10 | :371 + prix.test.ts:186 | couvert | réglage relu, adresse inchangée, 1 ligne, F neutre, raison de Portmer |
| AC-11 | :154 + prix.test.ts:200 | couvert | valeurs de départ, adresse réécrite, ordre et scores |
| AC-12 | :167 | couvert | les deux mentions, avant et après Acheter |
| AC-13 | :391 + prix.test.ts:210 | couvert | Maison 92 m², 1 100 €, lignes, F neutre, Rhinval « Loyer inconnu », Grandeville 1 196 € |

Les drapeaux `passes: true` correspondent tous à un test réel qui passe.
**Ne change pas** : loyer-mer AC-1 à AC-15 (carte, liste, fiche, adresse, etats.spec.ts), proches AC-1 à AC-11, AC-14, AC-16, interface-telephone AC-1 à AC-11 (telephone-feuille.spec.ts, telephone-vue.spec.ts, proches-clavier-iphone.spec.ts) et le test de H48 à 375 × 548 : tous verts dans ce lancement. Les tests sautés le sont par conception (projet bureau ou mobile seulement), pas en échec. Les spécifications des tranches précédentes n'ont pas changé dans la plage (D12 d'interface-telephone et D21 de loyer-mer étaient écrites avant `bfceb51`).

## Règles, états, mentions
- R21, R22, R23 et R26 sont dans `src/domain/prix.ts` et `src/domain/url.ts`, conformes (crans, bornes, Sans limite gardé, surface de départ selon le bien, ordre de l'adresse, H66).
- R24 est conforme, à la réserve du constat Mineur sur les raisons. R25 est conforme, avec la décision de Vincent « sans prix en dernier » (`src/domain/score.ts:135-141`).
- H56, H57, H58, H59 et H65 sont conformes (testés). H60 est conforme à la lettre (voir le constat sur la légende). H61 est conforme dans le texte amendé par la règle de Vincent (`src/ui/Mentions.tsx`, CLAUDE.md mis à jour). H67 est appliquée à la lettre (gardée par Vincent). H68 : chargement commun, jointure par code INSEE (`joindreAchats`, `src/domain/prix.ts:107`).
- États de la page en Acheter (« Relâche le prix… », « Fixe un prix d'achat… », avec un proche) et état de fiche « commune sans note » : présents et testés. D9 : `public/_headers` met `X-Robots-Tag: noindex` sur `/data/achat.json` seulement.
- À amender à la démo (noté par l'orchestrateur, confirmé) : D5, H61, H62, « C'est réussi si » et l'étape 4 (Bordeaux à 4 233 €/m² et non 4 427), D6/R25 (sans prix toujours en dernier), le seuil de 300 €/m².
- **En trop** : aucune fonction ni dépendance hors plan. Le jeton `valeur-curseur` est ajouté à `src/theme/figma-variables.json` (noté par T2).

## Détours (git log)
- **Reprises** : tâche 0, refaite après la règle de prix de Vincent (07f48cd) ; tâche 1, refaite après le seuil de 300 €/m² et le classement « sans prix en dernier » (15efd4c, a563854). Toutes deux sont décidées par Vincent et inscrites dans `progress.md`.
- **Fichiers hors des listes de tâches** :
  - en T1 reprise, `scripts/data/communes.py`, `achat.json` et `mesure-tache-0.md`, une conséquence de la décision de Vincent ;
  - en T2, `src/map/view.ts` (commentaire), `src/map/view.test.ts` et `src/theme/figma-variables.json` ;
  - en T0 et T4, des leçons dans `docs/solutions/`.
  - En T3, aucun code d'application n'a changé (tout existait déjà), seulement des tests.
- **Tests existants modifiés** :
  - `tests/e2e/categories.spec.ts`, 3 tests : « Loyer » devient « Logement », avec le nouveau résumé. C'est prévu au plan (« Demandera »).
  - `tests/e2e/telephone-feuille.spec.ts`, 2 lignes : `getByText('Loyer maximum')` devient « Loyer mensuel ». C'est prévu au plan et suit D12 d'interface-telephone.
  - `src/map/view.test.ts` : la valeur 272 écrite en dur est remplacée par le jeton `taille-feuille-min`. L'accord de Vincent (« option 1 ») est rapporté par `progress.md` et `taches/T2.md`. Le relecteur n'a pas vu l'échange lui-même.
  - `url.test.ts`, `score.test.ts` et `communes.test.ts` ne font que gagner des tests ; aucune assertion n'est retirée.
- **Tests protégés** : dans `docs/specs/2026-10-14-immobilier/acceptance.json`, seuls les drapeaux `passes` passent de false à true (commits 5d57b05, a4af90d, bd4e9f8). Aucun `given / when / then` ne change. Les fichiers `acceptance.json` des trois tranches précédentes sont inchangés dans la plage.

## Ce qui est bien fait
- Les tests d'AC vérifient les chaînes exactes du critère (lignes de liste entières, adresse exacte, couleurs par jeton) et non le simple passage du code. Ils sont recalculés sans navigateur dans `prix.test.ts`.
- Le réglage du prix est passé en paramètre, sans état global. Les règles du prix sont isolées dans `prix.ts`.
- La jointure se fait par code INSEE ; une commune absente du fichier a un prix inconnu.
- `communes.py` s'arrête au premier contrôle qui échoue, vérifie l'empreinte du fichier DVF et relit les vraies valeurs (Bordeaux, Strasbourg, Saint-Vincent-de-Paul, Guérigny).
- Aucune valeur de design arbitraire ; aucun secret dans le diff.

## Non vérifié
- Je n'ai pas parcouru moi-même la version construite avec les vraies données (pas de `npm run build` ni de `vite preview` : la consigne demandait de lancer la suite seule). Le vrai flux n'est jugé que sur les captures et les relevés des builders.
- Étape 9 (non-indexation en ligne) : reportée à /ship par le plan. Le risque que Cloudflare n'applique pas `_headers` n'est pas levé.
- La conformité visuelle au prototype F et à Figma n'a pas été comparée.
- Budget de réaction H9 : les mesures T4 donnent une médiane de 106 ms (109 avant la tâche), au-dessus des 100 ms, avec un processeur ralenti ×4. Ce n'est pas une régression, mais je ne l'ai pas remesuré.
- L'hygiène des commits (chaînes `test && commit`) et l'accessibilité au-delà des tests existants n'ont pas été relues (hors du mode spec).
- Le compte de 122 communes passées en « inconnu-secteur » à cause du seuil vient de `taches/T1.md` ; je ne l'ai pas recalculé.
