# Tâche 3a — La catégorie « Services » : Médecin, Commerce, Gare
Statut : faite · Début 14:58 · Fin 15:23 · Commits : 4baf88e (code, tests, captures) puis ce rapport

## Ce que l'utilisateur peut faire maintenant
- Voir, en bas du panneau des réglages (après « Tes proches »), la catégorie **« Services »**, ouverte au départ : « Médecin » et « Commerce alimentaire » (libellé à gauche, « 5 min », « 10 min », « 15 min » à droite), puis « Scolarité » (5 niveaux et « Temps de trajet maximal » 5, 10, 20 min), puis « Gare » (« Toutes », « Régionale », « Grandes lignes » soulignés, et « Temps de trajet maximal » 10, 20, 30 min).
- Cocher un temps pour le médecin, le commerce ou la gare : la carte, la liste, les raisons de la fiche et l'adresse suivent (`services=medecin:10`…). Une seule pastille par ligne ; toucher la pastille cochée la décoche.
- Changer le type de gare : la pastille cochée reste cochée et le filtre suit le type (`gare:10` → `gare-regionale:10`). Sans temps coché, changer de type ne change rien.
- Replier la catégorie : elle résume « Peu importe », « 1 choix », « 2 choix »… (une ligne qui filtre compte pour un).
- Tant que les temps ne sont pas arrivés, les pastilles, le type de gare et les temps de « Services » sont inactifs.
- « Scolarité » est **affichée mais inactive** : on ne peut pas encore la cocher au panneau (tâche 3b). Si l'adresse coche déjà des niveaux (par exemple `ecole:10`), les cases le montrent, et ce filtre s'applique (il le faisait déjà depuis la tâche 2).

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-1 | `tests/e2e/services.spec.ts` · « AC-1 / : « Services », ouverte, suit « Tes proches » ; Médecin, Commerce alimentaire, Scolarité et Gare dans l'ordre, groupes nommés, « Toutes » sélectionné, rien de coché ; liste d'AC-1 de mairies » | vert, bureau et mobile |
| AC-2 | `tests/e2e/services.spec.ts` · « AC-2 /?loyer=1200, « 10 min » pour « Médecin » : services=medecin:10, 4 communes… raison de Terrebasse » | vert, bureau et mobile |
| AC-3 | `tests/e2e/services.spec.ts` · « AC-3 /?loyer=1200&services=medecin:10, « 10 min » pour « Gare » : medecin:10,gare:10, 2 communes ; raisons de Quaibleu et de Terrebasse, dans l'ordre » | vert, bureau et mobile |
| AC-9 | `tests/e2e/services.spec.ts` · « AC-9 cas sûrs, /?loyer=1200&services=gare-regionale:30 : îles, population 0 et Corse ne passent jamais ; puis « Toutes » ; puis « 15 min » pour « Médecin » » (jeu « cas sûrs » : `variante_cas_surs` appliquée, `departement` lu comme `dep`) | vert, bureau et mobile |
| AC-10 | `tests/e2e/services.spec.ts` · « AC-10 /?loyer=1200&services=gare:10 : changer de type garde « 10 min » ; sans temps coché, le type ne filtre pas » | vert, bureau et mobile |
| AC-11 | `tests/e2e/services.spec.ts` · « AC-11 trois adresses mal écrites, réécrites selon R55 ; la troisième sélectionne « Grandes lignes » » | vert, bureau et mobile |
| hors AC (R57) | `tests/e2e/services.spec.ts` · « R57 : la catégorie « Services » est inactive tant que les temps ne sont pas arrivés » | vert, bureau et mobile |
| hors AC (H154, D12 de cadre-de-vie) | `tests/e2e/services.spec.ts` · « H154 : repliée, « Services » résume « Peu importe », puis « 1 choix », « 2 choix » ; une pastille cochée se décoche » | vert, bureau et mobile |
| hors AC (H154) | `src/domain/services.test.ts` · « H154 : résumé de « Services » repliée » (2 tests : type sans temps et scolarité incomplète ne comptent pas ; une ligne compte pour un ; insécable) | vert |

Le test existant R57 « services.json demandé après la carte prête… sans annonce » (guetteur des zones `role=status`, `role=alert`, `aria-live`) reste vert avec la catégorie sur la page : l'arrivée des temps, qui rend la catégorie active, ne change aucune zone d'annonce. Aucune zone `role="status"` ni `aria-live` ajoutée.

## Preuves
Sur `npx vite preview --port 4180` (version construite de ce code, vraies données), script `captures/T3a-captures.mjs`, journal `captures/T3a-captures.txt` (2026-11-24, 15:09).
- `docs/plans/2026-11-24-services/captures/T3a-cat-depart-390.png` — la catégorie au départ, à 390 px (15:09). Comparée à `F-cat-depart-390.png` : même disposition, mêmes libellés, « Toutes » souligné, rien de coché. **Seul écart** : « Scolarité » est grisée (inactive jusqu'à 3b).
- `captures/T3a-cat-exemple-390.png` — le réglage d'exemple du prototype (médecin 10, commerce 5, école et collège 10, gare régionale 30), posé par l'adresse `/?loyer=1200&services=medecin:10,commerce:5,ecole:10,college:10,gare-regionale:30` (15:09). Comparée à `F-cat-exemple-390.png` : mêmes pastilles cochées, « Régionale » souligné ; les cases de la scolarité cochées sont grisées (inactives).
- `captures/T3a-feuille-depart-390x844.png`, `captures/T3a-feuille-exemple-390x844.png` — la feuille à 390 × 844, « Critères » défilé jusqu'à « Services » (15:09).
- `captures/T3a-bureau-depart-1440x900.jpg`, `captures/T3a-bureau-exemple-1440x900.jpg` — bureau, panneau défilé jusqu'en bas, le compte collé dessous (15:09). Comparées à `F-bureau-1440x900.png` : même disposition (« Commerce alimentaire » sur deux lignes à 340 px, comme F).
- `captures/T3a-bureau-geste-1440x900.jpg` et journal — un vrai geste au panneau sur les vraies données : « 10 min » pour « Médecin » → `/?loyer=1200&services=medecin:10`, 27 895 communes ; « Régionale » sans temps de gare → adresse et compte inchangés ; « 30 min » pour « Gare » → `/?loyer=1200&services=medecin:10,gare-regionale:30`, 21 952 communes (15:09).
- Ce que la preuve ne couvre pas : le clavier seul et le lecteur d'écran réel (VoiceOver) ; la mesure de la réaction de la carte (H163, début de 3b).

## Suite de tests
- `npm test` (suite complète, un seul passage en arrière-plan, sur le code commité en 4baf88e, 15:10–15:22), sortie 0 :
  - Vitest : `Test Files  24 passed (24)` · `Tests  397 passed (397)`
  - Playwright : `45 skipped` · `456 passed (12.8m)` — aucun rouge, aucun instable tombé.
- `npm run typecheck` : sans erreur (15:03).
- `node scripts/check-tokens.mjs` : `check-tokens : 47 fichier(s), aucune valeur arbitraire`.
- `npm run build` : `✓ built in 1.96s` (avertissement habituel de taille de morceau).
- Pendant le travail : `npx playwright test tests/e2e/services.spec.ts` : `1 skipped` · `33 passed (30.7s)` ; tests protégés du téléphone (`telephone-feuille`, `proches-mobile`, `proches-etats`) : `26 skipped` · `66 passed (2.2m)`.

## Décisions prises à la place de Vincent
- Décision : en 3a, « Scolarité » est **inactive** (boutons `disabled`, grisés comme les réglages pendant le chargement), et non cliquable sans effet — décidé par Claude — pourquoi : un bouton qui se coche sans filtrer mentirait ; le plan veut la mesure de H163 avant de brancher la scolarité ; ses cases montrent ce que l'adresse a coché (R55), qui filtre déjà depuis la tâche 2 — coût si c'est faux : aucun au-delà de 3a, qui la rend active.
- Décision : la catégorie est inactive tant que la carte n'est pas prête **ou** que les temps ne sont pas arrivés (`!prete || temps.etat !== 'pret'`), donc aussi en erreur des temps — l'affichage de l'erreur dans la catégorie est en tâche 4 — coût si c'est faux : une condition à changer.
- Décision : le résumé replié (H154) est `resumeServices` de `src/domain/format.ts`, compté sur `filtresServices` (la seule fonction des filtres effectifs) : un type de gare sans temps et une scolarité incomplète ne comptent pas.
- Décision : le champ `services` des réglages est retiré quand rien n'est coché et que le type est « Toutes » (`avecServices`, local à `Services.tsx`, pendant d'`avecMetiers`) ; un type « Régionale » sans temps garde le champ (pour le panneau) mais n'écrit rien dans l'adresse.
- Décision : le composant s'appelle `Services` dans `src/ui/Services.tsx`, importé sous le nom `CategorieServices` dans `App.tsx` (le type `Services` des temps y existe déjà).

## Fichiers touchés hors de la liste de la tâche
- `src/domain/services.test.ts` (fichier de la tranche) : 2 tests unitaires du résumé (H154) ajoutés ; une ligne d'import changée (`resumeServices` en plus).
- `docs/plans/2026-11-24-services/captures/T3a-*` (script, journal, captures) et ce rapport.

## Tests existants modifiés
- `tests/e2e/services.spec.ts` (fichier de la tranche, non protégé) — la fonction d'aide `ficheDeCarte` prend un jeu en paramètre facultatif (`jeu = SIX_SERVICES`, comportement d'avant par défaut) pour ouvrir les fiches du jeu « cas sûrs » d'AC-9 ; l'import de `./lib/feuille` gagne `voirCriteres`. Aucun test existant ni aucune valeur attendue n'a changé.
- **Tests protégés du téléphone** (`telephone-feuille.spec.ts`, `proches-mobile.spec.ts`, `proches-etats.spec.ts`) : **aucun changement nécessaire** ; lancés avec la catégorie en place : `26 skipped · 66 passed (2.2m)`. L'accord de Vincent sur leur décalage n'a pas servi.

## Leçons écrites
- aucune (aucun correctif n'a demandé deux essais ; la seule reprise est le script de capture : le compte collé couvrait le bas de la catégorie avec `scrollIntoView({ block: 'end' })`, remplacé par le panneau défilé jusqu'en bas).
