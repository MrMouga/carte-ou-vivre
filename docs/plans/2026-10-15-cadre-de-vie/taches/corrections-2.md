# Corrections 2 — Mer et montagne sans « Peu importe » (D12) ; distance à la mer sans double arrondi
Statut : faite · Début 23:25 · Fin 23:47 · Commits : 7b2ed46 (changement 1 : interface et tests), 29d59b4 (changement 2 : données de la mer et tests), puis le commit de ce rapport (rapport, captures, index des leçons)

## Ce que l'utilisateur peut faire maintenant
- **Mer et montagne (D12).** Les groupes « Mer à moins de » et « Montagne à moins de » ont 4 cases collées : 10, 30, 50 et 100 km. Aucune n'est cochée au départ. Cocher une case décoche l'autre. Toucher la case cochée la décoche, ce qui revient à « Peu importe » : le critère ne filtre plus et ne note plus, et l'adresse perd `mer=` ou `montagne=`. Au clavier, Tab passe d'une case à la suivante, comme pour les tailles, et Espace coche ou décoche. Replié, le résumé dit toujours « Peu importe » quand rien n'est choisi.
- **Distance à la mer.** Elle est affichée et comparée au km de la distance mesurée. Tréon (Eure-et-Loir, 28394, 100,495 km) s'affiche à **100 km** au lieu de 101 et passe le choix « 100 km ». 182 communes étaient touchées : 181 étaient affichées 1 km trop loin, et Merville-Franceville-Plage (14409, 0,997 km) était affichée « 1 km » au lieu de « moins d'1 km ».

## Ce qui change
**Changement 1 (7b2ed46)**
- `src/ui/CadreDeVie.tsx` : les cases collées sont des boutons à bascule exclusifs (`aria-pressed`) dans un groupe nommé (`role=group`, « Mer à moins de » / « Montagne à moins de »). La grille passe de 5 à 4 colonnes. Un clic sur la case cochée renvoie `null` (Peu importe).
  - Ce qui ne sert plus est retiré : la case « Peu importe », le `radiogroup`, `role=radio`, le `tabIndex` mobile, les flèches et `useRef`.
  - L'aspect est le même : filets d'1 px, cadre `radius-chip`, case active en `primary`, 44 px de haut au moins.
- Le domaine ne change pas : `mer: null` valait déjà Peu importe, et l'adresse (R31) est inchangée.
- `src/domain/score.ts` : un commentaire seulement (« après « Peu importe » » → « aucune cochée = Peu importe (D12) »).
- `docs/design/system/README.md` : la ligne « Cases collées » du contrat suit D12 (groupe, `aria-pressed`, choix unique ou aucun, Tab, 4 colonnes).

**Changement 2 (29d59b4)**
- `scripts/data/communes.py` : `mer_km` est maintenant **tronqué au centième** (`centieme_tronque`, la même règle que `montagne_km`, qui l'utilise aussi). Il n'est plus arrondi (`round(km, 2)`).
- Contrôles ajoutés (le script s'arrête au premier échec) :
  - « 0 commune affichée à un autre km de la mer que sa distance mesurée (double arrondi, R28) ». L'affichage du site est rejoué sur la valeur servie et sur la mesure : « moins d'1 » sous 1 km, sinon le km arrondi.
  - Les valeurs de Tréon (100,49 → affichée 100), Bobigny (147,49 → 147), Merville-Franceville-Plage (0,99 → « moins d'1 ») et Bordeaux (39,07 → 39).
- `public/data/communes.json` : régénéré par `python3 scripts/data/communes.py` (pas à la main), et tous les contrôles passent (sortie : « ok 0 commune affichée à un autre km de la mer… : 0 [] »). Avant la correction, ce contrôle aurait trouvé 182 communes (mesuré sur `data-raw/mer-km.csv`).
- **Diff colonne par colonne** (ancien fichier contre nouveau) :
  - les colonnes sont les mêmes ; les 34 746 codes sont les mêmes, dans le même ordre ;
  - **seule `mer_km` change**, sur 15 696 lignes : celles dont le millième valait 5 ou plus. Aucun écart ne dépasse 0,01 km ;
  - `achat.json` est identique (`cmp`) ; `reperes.json` et `voisins.json` sont absents de `git status` ;
  - poids : 3 185 359 o (3 185 372 o avant).
- **Communes à 0 km de la mer** : il n'y en a aucune. La plus petite distance mesurée est 0,022 km, et aucune n'est sous 0,01 km : la troncature ne crée donc aucun 0. Le sens « moins d'1 km, comparée comme 1 km » ne change pas, et le code du site n'est pas touché.
- `docs/solutions/2026-10-15-double-arrondi-valeur-comparee-a-l-affichage.md` : une ligne « Revu le » ajoutée, parce que la fiche disait « mer non corrigée ».

## Critères
Les tests des 7 critères reformulés prennent le nouveau `given / when / then`. Les chiffres n'ont pas changé.

| AC | Test (fichier · nom exact) | Résultat |
|---|---|---|
| loyer-mer AC-2 | `tests/e2e/carte.spec.ts` · « AC-2 depuis /?loyer=1200&mer=50, l’utilisateur décoche la mer « 50 km » : D 65 (60–80), A 46 (40–60), B 31 (20–40), E 9 (0–20) ; seule C non colorée » | vert (bureau, mobile) |
| loyer-mer AC-2 (calcul) | `src/domain/score.test.ts` · « AC-2 la mer « 50 km » décochée (aucune distance, `mer: null`) : D 65, A 46, B 31, E 9 ; seule C ne passe pas » (nom seulement) | vert |
| loyer-mer AC-6 | `tests/e2e/liste.spec.ts` · « AC-6 loyer « Sans limite », aucune distance à la mer ni à la montagne n’étant cochée : couleur neutre sur les 5 communes, aucun score, message de liste » | vert |
| loyer-mer AC-12 | `tests/e2e/adresse.spec.ts` · « AC-12 /?loyer=abc&mer=aucun&taille=village : 1 200 €, aucune distance à la mer cochée, aucune taille cochée ; adresse /?loyer=1200 ; liste D 65, A 46, B 31, E 9 » | vert |
| proches AC-6 | `tests/e2e/proches.spec.ts` · « AC-6 loyer « Sans limite », aucune distance à la mer cochée, Nantesville (44) à 2 h 15 : Portmer 56 (40–60), Grandeville 0 (0–20) ; pas de message « Fixe un loyer… » » | vert |
| cadre-de-vie AC-1 | `tests/e2e/cadre-de-vie.spec.ts` · « AC-1 ouverture de / : /?loyer=1200 ; aucune distance à la mer ni à la montagne cochée, aucune taille ni aucun type coché ; 5 communes, Terrebasse 65, Rhinval 52, Portmer 46, Grandeville 31, Quaibleu 9 ; Montcher non colorée » | vert |
| cadre-de-vie AC-8 | `tests/e2e/cadre-de-vie.spec.ts` · « AC-8 /?mer=200&montagne=0&taille=petite-commune&env=bourg-et-village,village : aucune distance à la mer ni à la montagne cochée, « Moins de 10 000 hab. » et « Bourg et village » cochés ; /?loyer=1200&taille=petite-commune&env=bourg-et-village ; 1 commune, Terrebasse 65 » | vert |
| immobilier AC-10 | `tests/e2e/immobilier.spec.ts` · « AC-10 /?achat=300000&mer=aucun&bien=maison&unite=total&surface=100 : Maison, Acheter, Total, 100 m², 300 000 €, aucune distance à la mer cochée ; adresse … ; 1 commune, Terrebasse 57 · 130 000 € ; F neutre ; fiche de Portmer « Achat 350 000 € » » | vert |

« Aucune distance cochée » se vérifie toujours de la même façon : le groupe a ses 4 boutons, et aucun n'est enfoncé. Les tests unitaires d'adresse de ces critères (`url.test.ts` AC-12, AC-10 et AC-8 ; `prix.test.ts` AC-10) n'ont pas bougé : ils lisaient déjà `mer: null`. Aucun test ne passait seulement en changeant la valeur d'un critère.

## Tests hors critère modifiés (règle (3)/(4) du plan, à l'identique)
- `tests/e2e/cadre-de-vie.spec.ts`
  - **Aides `mer`, `choixMer`, `montagne`, `choixMontagne`, `merCochee`, `montagneCochee`** : `radiogroup` / `radio` / `aria-checked` → `group` / `button` / `aria-pressed` (3). Deux aides sont ajoutées, `merAucune` et `montagneAucune` (4 boutons, aucun enfoncé).
  - **« R31 : mer=5 → 10 km ; mer=200, mer=23 et mer=0 → Peu importe, adresse /?loyer=1200 »** : `merCochee('Peu importe')` → `merAucune` (3).
  - **« R32 : / devient /?loyer=1200 ; aucune distance à la mer cochée, aucune taille cochée ; la liste classe par le prix seul »** (avant : « mer sur « Peu importe » ») : même geste (3).
  - **« H76 : « Taille de la commune » (4 boutons à bascule), « Proximité avec la nature » qui porte « Mer à moins de » (4 boutons à bascule exclusifs, D12) »** (avant : « 5 boutons radio ; flèches du clavier ») :
    - les libellés sont lus sans « Peu importe » (3) ;
    - le bloc des flèches et de « une seule case dans l'ordre de tabulation » est **retiré** (4) ;
    - la partie Espace sur une taille ne change pas.
  - **« 390 px : cases de taille et de mer de 44 px au moins ; … »** : `getByRole('radio')` → `getByRole('button')` (3).
  - **« R31 : montagne=0 et montagne=abc → Peu importe, /?loyer=1200 ; montagne=30 gardée »** : → `montagneAucune` (3).
  - **« sans plafond : /?loyer=aucun&montagne=50 classe 3 communes ; montagne « 50 km » décochée → … »** (avant : « montagne sur « Peu importe » ») : le clic sur « Peu importe » devient un clic sur la case cochée « 50 km » (3).
  - **« H76 : « Montagne à moins de » (4 boutons à bascule exclusifs, aucun coché) sous « Mer à moins de », dans « Proximité avec la nature » »** (avant : « 5 boutons radio, « Peu importe » cochée … ; flèches du clavier ») :
    - libellés (3) ;
    - la flèche droite devient un clic sur « 10 km » (3) ;
    - la vérification du focus après la flèche est retirée (4).
  - **« 390 px : cases de la montagne de 44 px au moins »** : `radio` → `button` (3).
- `tests/e2e/fiche.spec.ts` · **« parcours : fiche de Grandeville → loyer 800 € → … »** : le clic sur « Peu importe » devient un clic sur la case cochée « 50 km » (3).
- `tests/e2e/liste.spec.ts` · **« AC-5 loyer 300 € et mer 10 km : … »** : le critère n'est pas reformulé, seul le sélecteur change (`aria-checked` → `aria-pressed`) (3). La même aide `choixMer` passe en `group` / `button`.
- `tests/e2e/adresse.spec.ts` · **« AC-11 /?loyer=800&mer=50 : … »** : seule l'aide `merCochee` change (`group` / `button` enfoncé) (3).
- `tests/e2e/categories.spec.ts` : **non modifié**. Il règle la mer par l'adresse (`mer=aucun`) et ne clique pas « Peu importe » : il passe tel quel.

**Ajoutés (hors critère), dans `tests/e2e/cadre-de-vie.spec.ts` :**
- « D12 : montagne « 10 km » cochée, décochée → aucune distance cochée (Peu importe), adresse sans montagne= ; « 30 km » puis « 100 km » : une seule cochée » ;
- « D12, H76 : Tab passe de « 10 km » à « 30 km », « 50 km », « 100 km » de la mer puis à « 10 km » de la montagne ; Espace coche puis décoche » ;
- « D12, H75 : au départ, aucune distance cochée et « Cadre de vie » repliée dit « Peu importe » ; mer « 50 km » cochée puis décochée : « Peu importe » ».

**Ajoutés pour la mer sur vraies données (changement 2)** :
- `scripts/data/communes.test.ts` · « R28 : Tréon (28394) à 100,49 km de la mer (affiché 100, pas 101) ; Bobigny (93008) à 147,49 (147, pas 148) ; Merville-Franceville-Plage (14409) à 0,99 (« moins d'1 km », pas « 1 km ») » ;
- `src/domain/score.test.ts` · « R28 non-régression : Tréon (28394, 100,495 km) « 100 km de la mer », passe la mer à 100 km, note 0 ».

Avant la régénération, les deux échouaient pour la bonne raison : « expected 100.5 to be 100.49 » et « '101 km de la mer à vol d'oiseau' ». **Aucun test existant n'a eu à être réécrit pour la précision de `mer_km`** : ceux qui lisent la mer sur les vraies données arrondissent au km ou comparent à un seuil (Bordeaux 39, La Rochelle < 1, Adour > 2), et ils passent tels quels. Code INSEE de Tréon lu dans `communes.json` (une seule « Tréon »). Toutes les modifications de fichiers de test sont faites avec l'outil d'édition. Aucun test n'est sauté en plus : 35 sautés, comme avant.

## Preuves
- `captures/C2-preuve.txt` (23:43) : la version construite `29d59b4` (`dist/version.txt`), servie par `npx vite preview --port 4181` puis arrêtée (le serveur du port 4180 n'a pas été touché). Vraies données, Chromium de Playwright. Résultats identiques à 1 440 × 900 et à 390 × 844 :
  1. `/` → `/?loyer=1200` ; aucune case de mer ni de montagne cochée ; cases de mer « 10 km | 30 km | 50 km | 100 km » ; résumé replié « Peu importe » ;
  2. mer « 50 km » cochée → `/?loyer=1200&mer=50`, « 6 934 communes passent tes critères » ;
  3. la même case décochée → `/?loyer=1200`, aucune case cochée, « 34 674 communes passent tes critères » (le compte du départ) ;
  4. `/?loyer=aucun&mer=100`, fiche de Tréon (28) : « 0 / 100 · 12253e sur 12 267 communes qui passent · 100 km de la mer à vol d'oiseau ». Avant la correction, elle ne passait pas (101 km).
- Captures, 1 440 réduites à 1 100 px :
  - `captures/C2-depart-1440.png` et `C2-depart-390.png` (départ) ;
  - `C2-depart-replie-1440.png` et `-390.png` (résumé « Peu importe ») ;
  - `C2-mer50-cochee-1440.png` et `-390.png` ;
  - `C2-mer50-decochee-1440.png` et `-390.png` ;
  - `C2-fiche-treon-mer100-1440.png` et `-390.png`.
- `captures/C2-npm-test-1.txt` (suite complète après le changement 1) et `captures/C2-npm-test-2.txt` (après le changement 2).

## Suite de tests
**Après le changement 1** (`npm test`, 23:30 → 23:35, charge ≈ 3) :
```
 Test Files  13 passed (13)
      Tests  200 passed (200)
check-tokens : 38 fichier(s), aucune valeur arbitraire
  1 failed
  35 skipped
  1 did not run
  298 passed (5.3m)
```
L'échec est `[bureau] fiche.spec.ts:61` « parcours… » : « page.evaluate: Execution context was destroyed » dans `apresRendu`. C'est l'instabilité « contexte détruit » déjà notée dans `progress.md`. Relancé seul 3 fois (`--repeat-each=3`, charge 2,3) : `3 passed (5.5s)`. Il était aussi vert dans le passage ciblé des fichiers touchés : `99 passed, 5 skipped`.

**Après le changement 2** (`npm test`, 23:37 → 23:42) :
```
 Test Files  13 passed (13)
      Tests  202 passed (202)
check-tokens : 38 fichier(s), aucune valeur arbitraire
  35 skipped
  300 passed (5.4m)
```
- `npm run typecheck` : `tsc --noEmit -p .`, sortie 0, aucune erreur.
- `npm run check-tokens` : `check-tokens : 38 fichier(s), aucune valeur arbitraire`.
- `npm run build` : `✓ built in 1.56s` (avertissement habituel sur les morceaux de plus de 500 kB) ; reconstruit après le commit : `dist/version.txt` = `29d59b4895f5221db459aa4b3701b27d5113254a`.

## Décisions prises à la place de Vincent
- Décision : la commune de non-régression est **Tréon (28394)**. Pourquoi : c'est la seule des 182 qui change de côté d'un seuil (100,495 km → 101, écartée à « 100 km »). Le test de la donnée ajoute Bobigny (93008, la plus peuplée des 182) et Merville-Franceville-Plage (14409, le seul cas « 1 km » au lieu de « moins d'1 km »). Coût si c'est faux : aucun sur le site, seulement le choix des exemples.
- Décision : le contrôle de `communes.py` compare le **texte** affiché (« moins d'1 » sous 1 km, sinon le km arrondi), pas seulement le km comparé. Pourquoi : c'est ce qui attrape Merville-Franceville-Plage, comparée comme 1 km avant comme après mais affichée « 1 km ». Coût si c'est faux : aucun, le contrôle est plus strict.
- Décision : la ligne « Cases collées » du contrat (`docs/design/system/README.md`) suit D12. Pourquoi : l'écran est construit, le code fait foi, et le contrat décrivait encore un `radiogroup` à 5 colonnes. Coût si c'est faux : une ligne à remettre.
- Décision : le test unitaire `score.test.ts` d'AC-2 de loyer-mer change de nom seulement, pour suivre le nouveau « when ». Son calcul (`mer: null`) est inchangé.

## Fichiers touchés hors de la liste
- `docs/design/system/README.md` (contrat, voir Décisions).
- `docs/solutions/2026-10-15-double-arrondi-valeur-comparee-a-l-affichage.md` : ligne « Revu le ». `docs/solutions/README.md` a été régénéré par le script d'index de studio.
- `src/domain/score.ts` : un commentaire.

## Leçons écrites
Aucune nouvelle. La leçon du double arrondi (corrections 1) est mise à jour : la mer est corrigée.

## Non vérifié / à signaler
- `docs/design/cadre-de-vie/README.md` (l. 13, 24, 31) parle encore de « tout sur Peu importe » et d'un `radiogroup` de `role=radio` pour les cases collées. Je n'y ai pas touché : c'est la trace du /ui, et le code fait foi pour un écran construit.
- La leçon copiée hors du dépôt (`~/.claude/studio/solutions/2026-10-15-double-arrondi-…`) n'est pas mise à jour.
- Pas d'essai sur un vrai téléphone : décocher d'un toucher n'est éprouvé que dans Chromium, au clic, à 390 px. La lecture par un lecteur d'écran (VoiceOver : « bouton, sélectionné ») n'est pas écoutée.
- La fiche de Tréon est vérifiée dans la version construite. La fiche des 180 autres communes touchées ne l'est que par le contrôle de `communes.py`.
