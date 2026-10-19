# Corrections 1 — test d'AC-7 de cadre-de-vie qui cliquait pendant le zoom ; mention des mairies dans CLAUDE.md
Statut : faite · Début 11:10 · Fin 11:38 · Commits : 899aa91..dff1363 (plus celui de ce rapport)

## Ce que l'utilisateur peut faire maintenant
Rien ne change pour l'utilisateur : aucun code de `src/` n'a bougé. Ce qui change, c'est qu'on peut de nouveau prouver qu'AC-7 et AC-11 de cadre-de-vie « ne changent pas ». Leur test donnait un résultat juste ou faux selon le hasard. Il est maintenant vert à chaque fois.

## Critères
| Constat | Ce qui est fait | Commit | Résultat |
|---|---|---|---|
| Majeur — AC-7 de cadre-de-vie rouge une fois sur deux (`tests/e2e/cadre-de-vie.spec.ts`, aide `ficheDeCarte`), même cause pour AC-11 `[mobile]` | L'aide `ficheDeCarte` rouvre la même adresse avant de cliquer, comme `rouvrir()` de `tests/e2e/mairies.spec.ts`. Une seule correction couvre AC-7 et AC-11. | 899aa91 | Avant : 1 rouge sur 10 (AC-7, bureau) et 8 rouges sur 40 (AC-7 et AC-11, deux projets). Après : 10 verts sur 10 et 40 sur 40. Le fichier entier, 3 fois aux deux projets : 180 verts, 0 rouge. |
| Mineur — CLAUDE.md parlait au futur de la mention des mairies | « à poser dans `Mentions.tsx` en tâche 3 de mairies » devient « posée dans `Mentions.tsx` en tâche 3 de mairies ». Rien d'autre ne change. | dff1363 | — |

### Lignes changées, avant / après

`tests/e2e/cadre-de-vie.spec.ts`, modifié avec l'outil Edit seulement :

Avant (l. 30-31) :
```ts
/** Ouvre la fiche d'une commune sur la carte, à l'ouverture (vue de départ de la fixture). */
async function ficheDeCarte(page: Page, id: Six, nom: string) {
  const { centre } = vue(page, SIX);
```
Après (l. 30-37) :
```ts
/**
 * Ouvre la fiche d'une commune sur la carte, à l'ouverture (vue de départ de la fixture). Choisir une commune zoome la
 * carte sur elle (D14 de loyer-mer) : on rouvre d'abord la même adresse (les réglages y sont tous), comme `rouvrir()` de
 * mairies, pour cliquer la commune à sa place d'ouverture et non pendant le zoom.
 */
async function ficheDeCarte(page: Page, id: Six, nom: string) {
  await ouvrirSix(page, adresse(page));
  const { centre } = vue(page, SIX);
```
Une seule ligne de code est ajoutée (`await ouvrirSix(page, adresse(page));`), plus le commentaire. Rien d'autre ne change : aucune valeur attendue, aucun texte cherché, aucun nom de test, aucun `given / when / then`, aucune assertion retirée, aucun test sauté. Le commentaire passe d'une ligne à cinq, et la nouvelle ligne de code en ajoute une. Tout ce qui suit descend donc de 5 lignes : AC-7 passe de `:260` à `:265`, AC-11 de `:282` à `:287`. Les commandes « après » utilisent ces nouveaux numéros.

`CLAUDE.md`, section Données, ligne des mentions obligatoires :
- avant : `(H118 de mairies, Licence Ouverte ; à poser dans \`Mentions.tsx\` en tâche 3 de mairies).`
- après : `(H118 de mairies, Licence Ouverte ; posée dans \`Mentions.tsx\` en tâche 3 de mairies).`

## Preuves
- `docs/plans/2026-10-18-mairies/captures/C1-avant-ac7-x10.txt` — avant la correction, la commande de la relecture (`:260 --project=bureau --repeat-each=10 --workers=4`) donne **1 rouge, 9 verts**. Dans l'échec, la fiche attendue est « Rhinval (67) », et la fiche reçue est celle de Terrebasse (2026-10-19 11:11).
- `docs/plans/2026-10-18-mairies/captures/C1-avant-ac7-ac11-x10-deux-projets.txt` — avant, AC-7 et AC-11 lancés 10 fois chacun aux deux projets : **8 rouges, 32 verts**. Le détail : AC-7 bureau 1, AC-11 bureau 1, AC-7 mobile 5, AC-11 mobile 1 (11:12).
- `docs/plans/2026-10-18-mairies/captures/C1-apres-ac7-x10.txt` — après, la même commande sur `:265` (le nouveau numéro d'AC-7) : **10 verts sur 10** (11:14).
- `docs/plans/2026-10-18-mairies/captures/C1-apres-ac7-ac11-x10-deux-projets.txt` — après, AC-7 et AC-11 lancés 10 fois chacun aux deux projets : **40 verts sur 40** (11:15).
- `docs/plans/2026-10-18-mairies/captures/C1-apres-cadre-de-vie-x3.txt` — après, le fichier entier `--repeat-each=3` aux deux projets, avec 2 navigateurs en parallèle comme dans la config : **180 verts, 12 sautés, 0 rouge** (11:21). Les 12 tests sautés le sont toujours : ils ne tournent qu'en bureau ou qu'à 390 px, et la référence en saute autant.
- `docs/plans/2026-10-18-mairies/captures/C1-relance-r31-ac4-x3.txt` — la relance de deux tests rouges lors d'un premier essai du fichier entier : **6 verts sur 6** (11:18). Ce premier essai tournait avec 4 navigateurs en parallèle sur une machine chargée à 20 (Backblaze en plus). Résultat : 2 rouges sur 180, R31 `:120` et AC-4 `:249`. Les deux avaient le même message, « carte pas prête » au bout de 5 s. Les deux échecs sont venus de l'ouverture au début du test, pas de l'aide corrigée (R31 ne l'appelle même pas). Cette sortie a été écrasée par le second essai, celui qui est gardé ci-dessus : je le signale pour être honnête.

## Suite de tests
Sortie : `docs/plans/2026-10-18-mairies/captures/C1-npm-test.txt` (11:22 → 11:35, charge descendue de 15 à 3,4 pendant la course).
- unit : `Test Files  20 passed (20)` · `Tests  312 passed (312)`
- e2e : `38 skipped` · `379 passed (13.1m)`, aucun rouge. Ce sont les mêmes comptes qu'à la tâche 4 et à la simplification.
- types : `tsc --noEmit -p .` sans erreur (`captures/C1-typecheck.txt`)
- build : `✓ built in 1.72s` (`captures/C1-build.txt`). Il affiche toujours l'avertissement sur la taille d'un fichier, comme avant.

## Décisions prises à la place de Vincent
- Décision : rouvrir l'adresse dans l'aide `ficheDeCarte`, à chaque appel, plutôt qu'attendre la fin du zoom. — Pourquoi : `vue()` calcule où sont les communes **à l'ouverture**. Après un zoom fini, ces points ne correspondent plus à rien : on cliquerait à coup sûr à côté. Seule la réouverture remet la carte dans la vue que `vue()` décrit. Elle tient l'adresse, et l'adresse porte tous les réglages ; la commune choisie n'y est pas, donc rien ne se rouvre en double. C'est aussi la parade déjà validée par `rouvrir()` et AC-6 de mairies. J'ai mis la réouverture à chaque appel, sans condition, parce qu'une condition (« seulement si une fiche est ouverte ») raterait le cas d'une fiche refermée : la carte reste alors déplacée. — Coût si c'est faux : chaque appel de l'aide recharge la page. Ça fait une dizaine de rechargements de plus par largeur, quelques secondes sur le fichier. Dans AC-10, l'aide recharge la page juste après le rechargement que le test fait déjà : c'est inutile, mais sans effet.

## Fichiers touchés hors de la liste de la tâche
- `docs/solutions/2026-10-19-clic-sur-la-carte-apres-un-choix-de-commune.md` (nouvelle leçon) et `docs/solutions/README.md` (index régénéré par le crochet) : la cause n'était écrite nulle part.

## Leçons écrites
- `docs/solutions/2026-10-19-clic-sur-la-carte-apres-un-choix-de-commune.md` — un test qui clique une commune à sa place d'ouverture doit rouvrir l'adresse avant chaque clic, parce que choisir une commune zoome la carte. J'ai vérifié les autres aides du même nom, dans `immobilier.spec.ts` et `mairies.spec.ts` : chacun de leurs clics sur la carte suit une ouverture de page. Le défaut n'existe donc pas ailleurs aujourd'hui.

## Question pour Vincent / Ce qui reste / Ce qui bloque
Rien. Rien n'est poussé : il y a 3 commits locaux sur `main`, en comptant celui de ce rapport. `docs/journal.md` reste modifié et n'est pas commité, comme demandé.
