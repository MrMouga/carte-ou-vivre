# Corrections 3 — « Sans étiquette » sur la ligne des blocs, phrase d'explication sous la grille (démo 2)
Statut : faite · Début 14:02 · Fin 14:19 · Commits : 05f37cc (code et test), puis celui de ce rapport et des preuves

## Ce que l'utilisateur peut faire maintenant
Dans « Vie locale », le groupe « Mairie élue en 2026 » tient en deux lignes de trois cases : Gauche · Divers · Centre / Droite · Extrême droite · Sans étiquette. Juste dessous, sur toute la largeur du groupe, la phrase « Moins de 3 500 habitants : le ministère ne classe pas les listes. » explique le groupe entier ; un lecteur d'écran la lit en entrant dans le groupe, plus sur « Sans étiquette ». Au clavier, Tab passe de case en case dans l'ordre (Gauche → … → Sans étiquette), puis va à « Tes proches ». Le groupe perd une ligne : environ 52 px de moins.

## Ce qui est fait
| Point | Fait | Commit | Preuve |
|---|---|---|---|
| 1. Grille | `VieLocale.tsx` : `col-start-1` retiré de « Sans étiquette ». Elle prend la 6e case (3e colonne de la 2e ligne) dans l'ordre de `ORDRE_BORDS` (R38), au même format que les autres (`CASE`). Ordre de focus = ordre du DOM = R38 | 05f37cc | `captures/C3-vie-locale-*.jpg`, `captures/C3-preuves-sortie.txt` |
| 2. Phrase | Sortie de la grille : `<p>` sous le `role=group`, `text-secondaire text-muted-foreground`, texte inchangé (espace insécable dans « 3 500 »). `aria-describedby` passe du bouton « Sans étiquette » au groupe. Commentaire d'en-tête mis à jour. Jetons seulement : `node scripts/check-tokens.mjs` → « 42 fichier(s), aucune valeur arbitraire », aucun jeton nouveau | 05f37cc | idem |
| 3. Test | Test « design F » hors AC de `tests/e2e/mairies.spec.ts` aligné avec l'outil Edit (détail ci-dessous). Aucun test d'AC touché. Le nouveau test **échoue** sur l'ancien `VieLocale.tsx` (vérifié en remettant temporairement la version de HEAD : `toHaveAccessibleDescription` sur le groupe, reçu « », 2 échecs bureau et téléphone), puis passe sur le nouveau | 05f37cc | suite complète |
| 4. Preuves | Sur `npx vite preview --port 4180` (version construite, vraies données), en 1 440 × 900 et 390 × 844 : aucun « ÉCART » ; serveur arrêté à la fin (4180 et 4173 libres) | ce rapport | `captures/C3-*` |

### Test avant / après (seul test modifié ; `tests/e2e/mairies.spec.ts`, vers l. 200)
Avant :
```ts
// Hors AC (design F, H109, H122) : « Sans étiquette » décrite par la phrase de D8 (aria-describedby) ; cases de 44 px au
// moins en 3 colonnes ; désactivées pendant le chargement, comme les autres réglages.
test('design F : 3 colonnes, cases de 44 px au moins, « Sans étiquette » décrite par « Moins de 3 500 habitants : le ministère ne classe pas les listes. »', async ({ page }) => {
  await ouvrirSix(page);
  await expect(pastilles(page)).toHaveCount(6);
  await expect(pastille(page, 'Sans étiquette')).toHaveAccessibleDescription('Moins de 3 500 habitants : le ministère ne classe pas les listes.');
  const boites = await Promise.all((await pastilles(page).all()).map(boite));
  for (const b of boites) expect(b.height).toBeGreaterThanOrEqual(44);
  expect(new Set(boites.slice(0, 3).map((b) => Math.round(b.y))).size).toBe(1); // une ligne de 3
  expect(Math.round(boites[3].x)).toBe(Math.round(boites[0].x)); // « Droite » sous « Gauche »
  expect(Math.round(boites[4].y)).toBe(Math.round(boites[3].y)); // « Extrême droite » à côté ; la 6e case reste vide
  expect(Math.round(boites[5].x)).toBe(Math.round(boites[0].x)); // « Sans étiquette » en 1re colonne
  expect(boites[5].y).toBeGreaterThan(boites[3].y);
});
```
Après :
```ts
// Hors AC (design F, H109, H122 ; amendé à la démo 2 du 2026-10-19) : 2 lignes de 3 cases de 44 px au moins, « Sans
// étiquette » en 3e colonne de la ligne de « Droite » ; sous la grille, sur toute sa largeur, la phrase de D8 décrit le
// groupe (aria-describedby), plus le bouton ; désactivées pendant le chargement, comme les autres réglages.
test('design F : 2 lignes de 3 cases de 44 px au moins, « Sans étiquette » sur la ligne de « Droite », groupe décrit par « Moins de 3 500 habitants : le ministère ne classe pas les listes. » sous la grille', async ({ page }) => {
  await ouvrirSix(page);
  await expect(pastilles(page)).toHaveCount(6);
  await expect(mairie(page)).toHaveAccessibleDescription('Moins de 3 500 habitants : le ministère ne classe pas les listes.');
  await expect(pastille(page, 'Sans étiquette')).toHaveAccessibleDescription('');
  const boites = await Promise.all((await pastilles(page).all()).map(boite));
  for (const b of boites) expect(b.height).toBeGreaterThanOrEqual(44);
  expect(new Set(boites.slice(0, 3).map((b) => Math.round(b.y))).size).toBe(1); // une ligne de 3
  expect(new Set(boites.slice(3).map((b) => Math.round(b.y))).size).toBe(1); // « Droite », « Extrême droite », « Sans étiquette »
  expect(boites[3].y).toBeGreaterThan(boites[0].y);
  for (const i of [0, 1, 2]) expect(Math.round(boites[i + 3].x)).toBe(Math.round(boites[i].x)); // mêmes colonnes
  const phrase = await boite(page.getByText(/^Moins de 3\s500 habitants : le ministère ne classe pas les listes\.$/));
  expect(phrase.y).toBeGreaterThanOrEqual(boites[5].y + boites[5].height); // sous la grille
  expect(Math.round(phrase.x)).toBe(Math.round(boites[0].x));
  expect(Math.round(phrase.x + phrase.width)).toBe(Math.round(boites[2].x + boites[2].width)); // toute la largeur
});
```
Rien n'est affaibli : les cases de 44 px, la ligne de 3 et la description accessible sont toujours vérifiées. Ce qui change suit le design amendé : la 2e ligne a maintenant 3 cases dans les mêmes colonnes, la description est portée par le groupe (et vérifiée absente du bouton), et la place de la phrase sous la grille, sur toute sa largeur, est vérifiée en plus.

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-1 à AC-12 | inchangés (l'ordre des pastilles ne change pas) | verts dans la suite complète (`captures/C3-npm-test.txt`) |
| hors AC, design F | `tests/e2e/mairies.spec.ts` · « design F : 2 lignes de 3 cases de 44 px au moins, « Sans étiquette » sur la ligne de « Droite », groupe décrit par … sous la grille » | vert, bureau et téléphone |

## Preuves
- `docs/plans/2026-10-18-mairies/captures/C3-vie-locale-1440x900.jpg` — bureau, au départ (`/?loyer=1200`) : Gauche · Divers · Centre / Droite · Extrême droite · Sans étiquette, cases 97 × 44, phrase sur une ligne sous la grille (306 px, toute la largeur) (14:05)
- `docs/plans/2026-10-18-mairies/captures/C3-vie-locale-390x844.jpg` — téléphone, onglet « Critères », au départ : même grille, cases 114 × 44, phrase sur une ligne (358 px) (14:05)
- `docs/plans/2026-10-18-mairies/captures/C3-gauche-sans-etiquette-1440x900.jpg` — bureau, « Gauche » et « Sans étiquette » cochées au clavier (Espace) : `/?loyer=1200&mairie=gauche,sans-etiquette`, « 32 245 communes passent tes critères », anneau de focus visible sur « Sans étiquette » (14:05)
- `docs/plans/2026-10-18-mairies/captures/C3-gauche-sans-etiquette-390x844.jpg` — téléphone, même état (14:05)
- `docs/plans/2026-10-18-mairies/captures/C3-preuves-sortie.txt` — journal du script (`captures/C3-preuves.mjs`), aux deux largeurs, tout « OK » :
  - positions des 6 cases ;
  - phrase sous la grille et sur toute sa largeur ;
  - description du groupe = la phrase, `aria-describedby` du bouton « Sans étiquette » = null ;
  - **Tab depuis « Gauche » : Gauche → Divers → Centre → Droite → Extrême droite → Sans étiquette → puis « Tes proches »** ; Maj+Tab depuis « Gauche » → « Vie locale » ;
  - adresse réécrite après les deux coches ;
  - au téléphone, la liste d'onglets reste à y = 511 avant et après (`main.scrollTop` 0 → 0) : l'onglet « Critères » ne glisse pas (leçon du 2026-10-14) (14:05)
- `docs/plans/2026-10-18-mairies/captures/C3-npm-test.txt` — suite complète (14:05-14:17)

Ce que la preuve ne couvre pas :
- la version en ligne (rien n'est poussé) ;
- un vrai lecteur d'écran : la description est vérifiée par l'arbre d'accessibilité de Chromium (Playwright) et par l'attribut, pas à l'écoute ;
- au téléphone, la capture « au départ » est prise sur un onglet que le script a fait défiler jusqu'au groupe.

## Suite de tests
```
 Test Files  20 passed (20)
      Tests  315 passed (315)
  38 skipped
  381 passed (11.7m)
exit 0
```
- 38 ignorés, le même nombre qu'en corrections 2. Ce sont les tests propres à une seule largeur.
- Types : `npm run typecheck` → `tsc --noEmit -p .`, aucune erreur.
- Construction : `npm run build` → `✓ built in 1.72s` (seul l'avertissement habituel sur la taille des fichiers JavaScript, au-delà de 500 kB).
- Jetons : `node scripts/check-tokens.mjs` → « 42 fichier(s), aucune valeur arbitraire ».

## Décisions prises à la place de Vincent
- Décision : écart entre la grille et la phrase = celui du groupe, `gap-1` (le même qu'entre le titre « Mairie élue en 2026 » et la grille) — le design ne fixe pas cet écart et c'est l'espacement déjà utilisé dans ce bloc. Si c'est faux, il suffit de changer une classe.
- Décision : la phrase est posée hors du `role=group`, juste après lui, et elle y est reliée par `aria-describedby`. Ainsi, le groupe ne contient que les 6 boutons, et la description est lue une seule fois à l'entrée. Si c'est faux, la phrase peut être mise dans le groupe, sans changement visible.
- Décision : les captures téléphone sont gardées à leur taille réelle, 390 × 844, comme en corrections 2. Seules les captures bureau sont ramenées à 1 200 px de large. Si c'est faux, il faut juste agrandir les images.

## Fichiers touchés hors de la liste de la tâche
- `docs/plans/2026-10-18-mairies/captures/C3-*` : preuves et script de preuve.

## Leçons écrites
Aucune. Le correctif est passé du premier coup et aucune mesure ne contredit le plan. Seul accroc : le premier remplacement automatique du texte a échoué à cause de l'espace insécable de « 3 500 » dans le code source. Le contenu n'a pas changé ; c'est un incident d'outil.
