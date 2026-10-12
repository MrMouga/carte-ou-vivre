# Relecture spec (correctif ciblé) — loyer-mer, adresse sous Safari
Suite de tests : `npm run typecheck` sans erreur · Vitest « Tests 47 passed (47) » · check-tokens « 25 fichier(s), aucune valeur arbitraire » · Playwright « 53 passed, 1 skipped (18.1s) » (le test sauté est « parcours » à 390 px, hors critère) · Périmètre : 0cf07b0 (correctif) ; HEAD = 5f46840 (une note dans docs/solutions, sans code)

En bref : le correctif fait ce qu'il promet. La page ne tombe plus quand Safari refuse d'écrire l'adresse, et l'adresse rattrape les réglages dès que Safari accepte de nouveau. Le nouveau test est rouge sur l'ancien code et vert sur le nouveau. Les tests AC-11 à AC-14 passent sans avoir été modifiés. Il reste un trou voisin, que ce correctif n'a pas créé : Chrome a sa propre limite, et quand il l'atteint, il ignore l'écriture **sans lever d'erreur**. Le `catch` ne se déclenche donc pas, et l'adresse reste fausse sans que personne ne le voie.

---

[Majeur] Sur Chrome (ordinateur et Android), après plus de 200 changements de réglage en 10 s, l'adresse reste bloquée sur d'anciens réglages, et pour de bon. Le navigateur ignore les écritures sans prévenir. Le correctif ne réessaie qu'en cas d'erreur, donc rien ne réécrit l'adresse ensuite. Conséquence : quelqu'un qui joue avec les curseurs puis copie le lien envoie une carte différente de celle qu'il voit. La page, elle, ne tombe pas.
  Où : `src/App.tsx:49-60` (l'effet ne vérifie pas que l'écriture a vraiment eu lieu).
  Preuve : test jetable, lancé dans un dossier temporaire (supprimé depuis) sur le code de 0cf07b0. Il réactive dans Chromium la protection que Playwright coupe par défaut (`ignoreDefaultArgs: ['--disable-ipc-flooding-protection']`), puis fait 260 crans sur « Mer à moins de ». Résultat : le curseur est à 155, mais `location.search` vaut `?loyer=1200&mer=70`, toujours 11 s plus tard. La console affiche « Throttling navigation to prevent the browser from hanging », et aucune erreur n'est levée. Le défaut existait avant le correctif : il n'est pas une régression. La suite de tests ne peut pas le voir, puisque Playwright désactive cette limite de Chrome par défaut.
  Correction : après `replaceState`, comparer `location.search` à l'adresse attendue et, si elles diffèrent, programmer la même reprise à 1 s que dans le `catch`. On garde l'écriture immédiate, donc AC-13 n'est pas touché. Ajouter un test hors AC avec `ignoreDefaultArgs: ['--disable-ipc-flooding-protection']` : plus de 200 crans, puis on attend que l'adresse rattrape les réglages (environ 10 s, la durée de la fenêtre de Chrome).
  Réf : R7 (« l'adresse est réécrite avec les réglages effectifs … à chaque changement ») ; CLAUDE.md « Fini = effet observé sur le vrai flux ».

## Réponses aux quatre questions

1. **La page blanche a disparu.** L'appel est maintenant dans un `try/catch` (`src/App.tsx:52-56`). C'est le seul appel à `replaceState` ou `pushState` dans `src/` (recherche faite sur `replaceState`, `pushState`, `history.` et `location.`). Les autres usages de `location` lisent seulement, sans écrire (`App.tsx:46`, `map/fallback.ts:27`, `map/style.ts:30`). `ecrireAdresse` (`src/domain/url.ts:30-35`) est une fonction pure qui ne peut pas lever d'erreur. Aucune autre erreur de cet appel ne peut donc sortir.
2. **L'adresse rattrape les réglages sous Safari** : la reprise rappelle `ecrire`, qui garde les réglages de cet effet. Quand les réglages changent, le nettoyage annule la reprise en attente, et l'effet suivant écrit les nouveaux réglages. Ce sont donc toujours les derniers réglages qui finissent écrits. **Pas de fuite** : `clearTimeout(reprise)` vise toujours la dernière reprise programmée, aussi bien au démontage qu'au changement de réglages, et le double montage de StrictMode est sans effet. **Pas d'avalanche** : il y a au plus une reprise par seconde, et une seule en attente à la fois. Pendant que la limite de Safari est active, cela fait au plus une trentaine d'essais refusés, sans effet sur la page. Exception : le cas de Chrome, ci-dessus.
3. **Le test de non-régression est utile.** Je l'ai lancé dans un dossier de travail temporaire (`git worktree`, sous /private/tmp, supprimé depuis) sur 0cf07b0^, avec le nouveau fichier de test :
   - sur l'ancien code, il est **rouge** aux deux largeurs. `SecurityError` n'est pas attrapée, la console affiche « An error occurred in the <App> component », puis le test échoue sur `getByRole('region', { name: 'Réglages' })` : « element(s) not found » ;
   - sur une version qui attrape l'erreur sans réessayer, il est **rouge** aussi. Il attend `?loyer=1200&mer=55` et trouve `?loyer=1200&mer=150`. Les deux moitiés du test servent donc chacune à quelque chose ;
   - sur le code corrigé, il est **vert** aux deux largeurs.
   AC-11 à AC-14 (`tests/e2e/adresse.spec.ts`) passent, bureau et 390 px. Typecheck et `npm test` sont verts (chiffres en tête).
4. **Aucun test d'AC ni `acceptance.json` modifié.** `git show --stat 0cf07b0` ne liste que `src/App.tsx`, `tests/e2e/safari.spec.ts` et deux comptes rendus dans `docs/plans/`. Les derniers commits qui touchent `adresse.spec.ts` et `acceptance.json` sont a1401cc et cae28a8, antérieurs au correctif. Dans les fichiers modifiés et non commités, il n'y a que `docs/specs/INDEX.md`, et pas `acceptance.json`.

## Couverture des critères (mode spec)
| AC | Test | Statut | Note |
|---|---|---|---|
| AC-11 | `adresse.spec.ts:11` | couvert | vert, bureau et 390 px, test inchangé |
| AC-12 | `adresse.spec.ts:19` | couvert | vert, bureau et 390 px, test inchangé |
| AC-13 | `adresse.spec.ts:29` | couvert | vert ; l'écriture reste immédiate, donc la lecture de l'adresse juste après le rendu tient toujours |
| AC-14 | `adresse.spec.ts:39` | couvert | vert, bureau et 390 px, test inchangé |
| hors AC | `safari.spec.ts:6` | couvert | rouge sur l'ancien code, rouge sans la reprise, vert sur le correctif |

## Ce qui est bien fait
- Le correctif est petit et bien ciblé (15 lignes), avec un nettoyage correct de la reprise.
- Le test simule la vraie erreur de Safari (`SecurityError`, au-delà de 100 appels) et vérifie les deux promesses du correctif : la page reste, et l'adresse rattrape les réglages.
- Le correctif ne touche à aucun critère d'acceptation et ne modifie pas AC-13.

## Non jugé
- Le comportement réel de WebKit, qui n'est pas installé. Je suppose, d'après le fonctionnement connu de WebKit, que sa fenêtre de 30 s est fixe et que les appels refusés ne comptent pas dans la limite. Si ce n'était pas le cas, la reprise toutes les secondes ne ferait que retarder le moment où l'adresse rattrape les réglages, sans faire tomber la page.
- Firefox, qui n'a pas été testé. Sa limite lève aussi une erreur, que le `catch` attrape.
- Les autres erreurs possibles de React. Il n'y a toujours pas de filet global (« error boundary ») : toute autre erreur de rendu donnerait encore une page blanche. C'est hors du périmètre de ce correctif.
