# Retouches 1 — emploi (démo du 2026-11-22)
Statut : faite · Début 13:32 · Fin 14:05 · Commit : un seul, `tweak(emploi): …`, qui contient ce rapport (son empreinte : `git log -1 -- docs/plans/2026-11-21-emploi/taches/retouches-1.md`)

## Ce que l'utilisateur peut faire maintenant
Sous chaque métier choisi, la catégorie « Emploi » montre « Où ce métier recrute » puis trois cases, du plus large au plus étroit : « Partout », « Beaucoup », « Le plus ». L'adresse ne change pas (`tous`, `25`, `10`), donc les liens déjà partagés gardent leurs réglages ; ne rien cocher veut toujours dire « peu importe ». La fiche garde ses phrases « parmi les 10 % de bassins qui recrutent le plus » : c'est elle qui dit ce que « Le plus » veut dire.
Après le choix d'un métier, le focus va sur « Partout ». Deux raisons de métier dans la fiche sont séparées par un petit espace ; au clavier, la suggestion en surbrillance reste visible (le panneau défile) ; l'anneau de focus des cases se voit en entier.

## Le tableau accepté, ligne par ligne
| Ligne | Fait | Comment | Preuve |
|---|---|---|---|
| Libellés « Partout · Beaucoup · Le plus », titre « Où ce métier recrute » | oui | `NIVEAUX` de `src/ui/Emploi.tsx` dans l'ordre `tous`, `25`, `10` ; titre sans « le plus » (le groupe s'appelle donc « Où ce métier recrute <libellé> ») ; adresse et calcul inchangés | `R1-bureau-un-metier-le-plus.jpg`, `R1-390-un-metier-le-plus.png` |
| La fiche et les raisons gardent « parmi les 10 % … » | oui (rien à changer) | `src/domain/format.ts` non touché ; AC-4, 5, 6, 9, 10 lisent toujours ces phrases | `R1-bureau-fiche-maulicheres.jpg` |
| Focus sur la première case, « Partout », après le choix | oui | la première case de la grille est maintenant « Partout » : la demande de focus (qui attend sa cible, leçon du 2026-11-21) n'a pas bougé | test « clavier : … le focus va sur « Partout » … » ; `R1-bureau-focus-entier.png` |
| Mineur 1 : deux raisons collées | oui | `gap-1` (jeton `space-1`, 4 px) sur la liste des raisons de `src/ui/Fiche.tsx` | test H148 « fiche de Portmer… » (bureau et mobile) ; `R1-bureau-fiche-maulicheres.jpg` |
| Mineur 2 : 8e suggestion hors du panneau | oui | aux flèches, la suggestion en surbrillance est amenée dans la vue (`scrollIntoView({ block: 'nearest' })`), puis, en bureau, remontée au-dessus du compte collé en bas du panneau, qui sinon la couvre | test H148 « bureau : flèche bas jusqu'à la 8e suggestion… » ; `R1-bureau-8e-suggestion.jpg` |
| Mineur 3 : anneau de focus coupé | oui | mesuré d'abord : la case voisine, peinte après, couvre le côté droit de l'anneau (le côté gauche est entier). Les cases collées de la mer ont le même défaut (capture de mesure, côté droit coupé aussi) : rien à recopier. La case focalisée passe devant ses voisines (`relative`, `focus-visible:z-1`) | test H148 « focus sur « Partout »… » (pixels de l'anneau, des deux côtés) ; `R1-bureau-focus-entier.png`, `R1-390-focus-entier.png` |

## Critères réécrits
| AC | Test (fichier · nom) | Nouveau texte vérifié | Résultat |
|---|---|---|---|
| AC-1 | `tests/e2e/emploi.spec.ts` · « AC-1 ouverture de / … » | cases lues : `['Partout', 'Beaucoup', 'Le plus']` | vert (bureau, mobile) |
| AC-4 | idem · « AC-4 …, « Le plus » … » | clique « Le plus », la lit cochée ; adresse `V1X80:10` | vert |
| AC-5 | idem · « AC-5 …, « Beaucoup » … « Partout » … » | clique « Beaucoup » puis « Partout » ; `V1X80:25` puis `V1X80:tous` | vert |
| AC-6 | idem · « AC-6 …, « Le plus » des graphistes … » | « Le plus » des graphistes, « Beaucoup » des infirmiers cochée | vert |
| AC-7 | idem · « AC-7 …, « Le plus » … » | clique « Le plus » ; `V1X80:10` | vert |
| AC-9 | idem · « AC-9 … « Partout » … » | clique « Partout » ; `U1X82:tous` | vert |
| AC-11 | idem · « AC-11 … « Le plus » cochée … » | « Le plus » cochée pour les infirmiers | vert |
| AC-12 | `src/domain/emploi.test.ts` · « AC-12 infirmiers à « 10 % » … » et suivants | calcul par code de niveau (`'10'`), aucun libellé cliqué ni lu ; valeurs inchangées (Bordeaux, Pau, La Roche-sur-Yon 61 km, Bayonne 92 km, 4 588 communes) | vert |
| AC-13 | `tests/e2e/emploi.spec.ts` · « AC-13 / à 390 × 844 … « Le plus » … » | touche « Le plus » ; `V1X80:10` | vert (mobile) |
| AC-14 | idem · « AC-14 … après « Beaucoup » … » | phrase au-dessus de « Où ce métier recrute » ; clique « Beaucoup » ; `U1X82:25` | vert |

## Preuves
Site construit (`npm run build`) servi par `vite preview` sur le port 4180 (arrêté à la fin), vraies données, Chromium avec WebGL.
- `captures/R1-bureau-un-metier-le-plus.jpg` — bureau 1 440 × 900, `/?loyer=aucun&metier=V1X80:10` : « Où ce métier recrute », cases « Partout » · « Beaucoup » · « Le plus », « Le plus » cochée (lu : `Partout:false | Beaucoup:false | Le plus:true`, titre « Où ce métier recrute ») (2026-11-22 13:58)
- `captures/R1-bureau-fiche-maulicheres.jpg` — bureau, `/?loyer=aucun&metier=V1X80:10,M2X90:10`, fiche de Maulichères (32) : deux raisons de métier séparées (mesuré : 141-204 px puis 208-313 px, 4 px d'écart), phrases « parmi les 10 % qui recrutent le plus » inchangées (13:59)
- `captures/R1-bureau-8e-suggestion.jpg` — bureau, « ing » tapé, panneau remonté tout en haut (8e suggestion à 1 407-1 444 px, hors de la fenêtre), puis 7 flèches bas : la 8e, « Ingénieurs, cadres techniques de l'agriculture », en surbrillance à 654-691 px, au-dessus du compte (691 px), le focus toujours dans le champ. La 4e est aussi teintée : c'est le survol, le pointeur de la souris étant resté à cet endroit après le défilement (14:00)
- `captures/R1-bureau-focus-entier.png` — bureau, agrandi 2 fois : après Entrée sur la suggestion, focus sur « Partout » (`:focus-visible`), anneau entier, côté droit compris (14:00)
- `captures/R1-390-focus-entier.png` — 390 × 844, « infirm » puis Entrée : focus sur « Partout », anneau entier (14:01)
- `captures/R1-390-un-metier-le-plus.png` — 390 × 844, Tab, Tab, Espace : « Le plus » cochée et focalisée, adresse `?loyer=aucun&metier=V1X80:10`, la carte ne garde que les communes proches des bassins (14:01)
- Non fait : la fiche de Maulichères à 390 × 844 (ouvrir une commune précise sous la feuille demandait trop de manipulations) ; l'espace entre les raisons y est vérifié par le test « H148 fiche de Portmer… », vert dans le projet `mobile`.
- Mesure avant correction (non versionnée) : focus sur la première case de l'emploi et sur « 10 km » de la mer, les deux coupés à droite par la case voisine ; toutes les cases en `position: static`.

## Suite de tests
- Rouge d'abord (`emploi.spec.ts` seul, ancien code) : 31 failed, 6 skipped, 11 passed — les tests des libellés et les trois tests H148 ; le test de l'anneau a été revu rouge pour la bonne raison une fois les libellés posés (« Partout, côté droit : 255,255,255 », bureau et mobile), puis vert.
- `npm test` (2026-11-22, 13:46 → 13:58) :
  - unit : `Test Files  22 passed (22)` · `Tests  361 passed (361)`
  - jetons : `check-tokens : 44 fichier(s), aucune valeur arbitraire`
  - e2e : `44 skipped` · `423 passed (12.0m)` (aucun échec ; les sauts sont ceux, conditionnels, du projet bureau/mobile)
- types : `npm run typecheck` → `tsc --noEmit -p .`, aucune erreur
- build : `npm run build` → `✓ built in 1.78s` (avertissement habituel sur la taille du paquet)

## Décisions prises à la place de Vincent
- Décision : l'espace entre les raisons vaut pour toutes les raisons de la fiche (loyer, mer, montagne…), pas seulement entre deux raisons de métier — *décidé par Claude* — une règle plus simple, la même que la liste « Tes proches » juste en dessous (`gap-1`, 4 px) ; les raisons courtes d'une ligne gagnent 4 px chacune — coût si c'est faux : une classe à déplacer sur les seules raisons de métier.
- Décision : espace de 4 px (`space-1`) — *décidé par Claude* — le plus petit jeton, assez pour séparer deux blocs en gras sans allonger la fiche — coût si c'est faux : un jeton à changer.
- Décision : le défilement de la suggestion en surbrillance n'a lieu qu'aux flèches (pas pendant la frappe) — la règle du clavier de l'iPhone (R20) veut que le champ ne bouge pas pendant la saisie — coût si c'est faux : aucun visible, la liste s'affiche déjà sous le champ à la frappe.
- Décision : les cases collées de la mer et de la montagne (`CadreDeVie.tsx`) ont le même anneau coupé à droite ; je ne les ai pas corrigées (hors du tableau accepté) — coût si c'est faux : la même ligne `relative focus-visible:z-1` à poser dans `CadreDeVie.tsx`, à décider par Vincent.
- Décision : les titres des tests unitaires de calcul (`src/domain/emploi.test.ts`, « AC-4 (calcul) « 10 % » … », « AC-12 infirmiers à « 10 % » … ») ne sont pas renommés : ils testent le niveau `10` par son code et ne lisent aucun libellé ; « 10 % » y reste le sens du niveau (R46, R47) — coût si c'est faux : des titres à reformuler, sans rien changer aux assertions.

## Fichiers touchés
`src/ui/Emploi.tsx`, `src/ui/Fiche.tsx`, `tests/e2e/emploi.spec.ts`, `tests/e2e/lib/carte.ts`, ce rapport et 6 captures `R1-*` (11 fichiers). `docs/journal.md`, modifié avant mon arrivée, n'est pas dans le commit.

## Fichiers touchés hors de la liste
- `tests/e2e/lib/carte.ts` — `emploiJson` exporté (un mot), pour que le test de la 8e suggestion serve la fixture plus huit métiers inventés (la fixture n'en a que quatre).

## Tests existants modifiés
Tous dans `tests/e2e/emploi.spec.ts` (tranche emploi) ; aucun test d'une tranche précédente ne lisait ces libellés (recherche de « 10 % », « 25 % », « Partout où il recrute » et « recrute le plus » dans `src` et `tests`).
- aides `niveaux` / `tousNiveaux` — avant : groupe « Où ce métier recrute le plus <libellé> » ; après : « Où ce métier recrute <libellé> » — titre de H131 révisée.
- AC-1, AC-3 — avant : cases `['10 %', '25 %', 'Partout où il recrute']` ; après : `['Partout', 'Beaucoup', 'Le plus']` (constante `CASES`) — D15. AC-3 n'est pas dans la liste des critères réécrits (son texte dit « leurs 3 pastilles » sans les nommer) mais il lisait les anciens libellés.
- AC-4, 5, 6, 7, 9, 11, 13, 14 — libellés cliqués ou lus et titres : « 10 % » → « Le plus », « 25 % » → « Beaucoup », « Partout où il recrute » → « Partout » ; valeurs attendues (adresses, communes, scores, raisons) inchangées — critères réécrits.
- AC-14 — avant : phrase au-dessus de « Où ce métier recrute le plus » ; après : « Où ce métier recrute » — H147 révisée.
- « clavier : flèches et Entrée choisissent… » — avant : focus sur « 10 % », Espace → `metier=M2X90:10` ; après : focus sur « Partout », Espace → `metier=M2X90:tous` — état « un métier » révisé (focus sur la première case, « Partout ») ; l'adresse suit la case qui a le focus.
- « deux métiers venus de l'adresse… » — avant : « 10 % » cochée, « 10 % » sans focus ; après : « Le plus » cochée, « Partout » (première case) sans focus.
- « « Second métier » : … Entrée choisit » — avant : focus sur « 10 % » des graphistes, « 10 % » des infirmiers cochée ; après : « Partout » et « Le plus ».
- « « + Ajouter un second métier » touché … » (390 × 664) — avant : focus et visibilité de « 10 % » ; après : « Partout ».
- Ajoutés (hors critères, H148), vus rouges puis verts : « H148 fiche de Portmer… raisons séparées par un espace » (rouge : 0 px d'écart), « H148 bureau : flèche bas jusqu'à la 8e suggestion… » (rouge : bas de la 8e à 1 423 px pour un compte à 670 px), « H148 focus sur « Partout »… anneau entier » (rouge : pixel blanc à droite de l'anneau, bureau et mobile).

## Leçons écrites
Aucune : chaque correction a marché du premier coup, et la mesure a confirmé la cause supposée.
