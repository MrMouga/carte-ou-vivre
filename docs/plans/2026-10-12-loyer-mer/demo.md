# Démo — loyer-mer
2026-10-13 · /build · 3 sessions (≈ 4 h 25)

> AC = critère d'acceptation de la spec ; Bloquant / Majeur / Mineur = gravité donnée par un relecteur neuf ; une preuve = capture ou sortie de commande, datée.
> Captures : `captures/` (le constructeur) et `captures/qa/` (le testeur neuf).

**Pari de Vincent** (avant d'essayer, 2026-10-13) : satisfait du prototype ; il s'attend à un résultat encore plus fluide, le prototype « laggait un peu ». Non comparé en chiffres : le prototype n'a pas été mesuré avec le même script.

**Retour de Vincent après essai** (2026-10-13, Mac) : fluidité bonne, résultat « top », globalement satisfait ; délimitation des communes et littoral bons. À voir plus tard : lisibilité des noms de lieux sur une zone colorée par les critères. Vu sur sa capture (Plouezoc'h, fiche « ne passe pas ») : contour de la commune choisie en pointillés — le Mineur QA, cause non vérifiée (notre contour ou la limite de commune du Plan IGN).

**Question soulevée pendant la démo — position des communes** : le rond est posé au centre du plus grand morceau de la commune (calculé), la distance à la mer part du `centre` de geo.api.gouv.fr — deux points différents (médiane 242 m d'écart). Comptage (2026-10-13) : hors de leur commune, rond actuel 181, `centre` de l'API 560 (Granville en mer, à 4,3 km), `mairie` de l'API 32. Avec la mairie pour la distance : 17 673 communes changent d'1 km affiché environ, 38 d'au moins 5 km (Arles 13 → 26 km), 78 passent ou ne passent plus à 60 km, Bordeaux 40 → 39 km.

## Ce qui est construit

| Tâche | Ce que tu peux faire maintenant |
|---|---|
| 0a, 0b | Le site se lance, se teste et se construit ; les polices sont dans le site ; un commit qui contient une clé est refusé. |
| 1a, 1b | Les 34 746 communes de métropole ont leur loyer pour 52 m², leur distance à la mer et leur taille (Paris, Lyon, Marseille d'un seul tenant). |
| 2 | Régler le loyer et la mer : la carte se recolore en 5 paliers de score. |
| 3 | Lire les 10 premières, avec le compte des communes qui passent. |
| 4 | Ouvrir la fiche d'une commune, depuis la liste ou la carte : chiffres, rang, ou raisons pour lesquelles elle ne passe pas. |
| 5a | Partager un lien : l'adresse garde les réglages. |
| 5b | La page tient le chargement, l'erreur (« Réessayer »), l'absence de WebGL et la panne du fond IGN (fond de secours) ; les mentions sont visibles. |
| 6 | À 390 px, la carte en haut et une feuille en bas ; tout au clavier en bureau. |
| 7 | Les communes suivent leurs vrais contours à tous les zooms (tuiles à 100 m). |
| 8 (après la démo, D18) | Chaque commune a un seul point, sa mairie : la distance à la mer en part et le rond s'y pose (Bordeaux 39 km, La Rochelle « moins d'1 km »). |
| Après relecture | Glisser un curseur sur iPhone ou Safari ne fait plus tomber la page ; sur Chrome, l'adresse rattrape les réglages ; à 390 px, une carte vide dit pourquoi. |

**Essayer** : `npm run dev` puis http://localhost:5173 (le serveur tourne déjà) ; sur le téléphone, `npx vite --host` (le pare-feu du Mac doit laisser passer `node`). Version construite : `npm run build && npx vite preview`.

## Preuves

- **Tests** (2026-10-13 00:48) : 47 tests unitaires, 55 Playwright verts (chaque test en bureau 1440 px et à 390 px), 2 sautés (le parcours à 390 px, où la fiche remplace les réglages ; le test « aucune commune » en bureau, où la liste est visible). Types et construction OK, aucun jeton en dur.
- **Critères** : les 15 passent, chacun par un test qui porte son numéro, vérifié par le relecteur neuf qui a relancé la suite lui-même.

| AC | Ce qui est prouvé | Passe |
|---|---|---|
| AC-1 à AC-3 | Couleur de chaque commune lue au pixel ; score 72 / 49 / 32 ; égal au plafond = passe | oui |
| AC-4, AC-5, AC-6 | Liste triée ; aucune commune ; sans plafond (couleur sable) | oui |
| AC-7 à AC-10 | Fiche qui passe, fiche grisée avec ses raisons, clic sur la carte | oui |
| AC-11 à AC-14 | L'adresse garde les réglages, corrige les valeurs fausses, n'ajoute rien à l'historique | oui |
| AC-15 | Fond IGN coupé : communes colorées sur fond uni, « Fond de carte indisponible » | oui |

- **Vérification de bout en bout** (vraies données, en local) : faite par moi à 1440 et 390 px (`captures/5a-bout-en-bout.txt`, `6-bout-en-bout-390.txt`, `7-bout-en-bout-390.txt`), puis refaite par le testeur neuf à 1440 px (`qa.md`, captures 07 à 09). Bordeaux : « Grande ville · 268 000 habitants », « 832 € par mois pour 52 m² (16,0 €/m²) », « 40 km de la mer à vol d'oiseau » ; à 800 € : « Loyer 832 € : au-dessus de ton plafond de 800 € ».
- **Écrans** : `captures/2-carte-1440.png`, `3-liste-1440.png`, `4-fiche-douarnenez.png`, `4-fiche-bordeaux-grisee.png`, `5b-*.png` (états), `6-liste-390.png`, `6-fiche-390.png`, `7-france-1440.png`, `simplif-choisie-1440.png`, `simplif-sans-plafond-1440.png`, `fix-aucune-390.png` ; testeur neuf : `captures/qa/01` à `27`.
- **Réaction à un réglage** (version construite, Chromium ralenti ×4, rendu sans carte graphique) : **102 ms** de médiane (176 ms avant la simplification ; 86 ms avec les anciens contours à 1 km). Première carte : 5,6 s en « Fast 4G » (seuil 10 s), 2,7 Mo.
- **Données** : 34 746 communes, 0 sans loyer, distance ou forme ; présentes dans les tuiles à chaque zoom dès le zoom 7 (`captures/1a-controles.txt`, `7-etats.txt`).

## À trancher par toi

1. **Budget de réaction (H9)** : 102 ms pour 100 ms, mesure pessimiste, jamais mesurée sur téléphone. Accepter ainsi, ou demander une mesure sur ton iPhone avant /ship ?
2. **Logos Shom et IGN** : leurs conditions d'usage sont introuvables en ligne ; à la place, leur nom encadré et un lien. Accepter, ou chercher les logos ?
3. **Majeur QA laissé tel quel — « Bordeaux paraît blanc à l'échelle de la France »** : Bordeaux est bien peint (vert clair, score bas, au bord de la zone des 60 km) ; le blanc est le rond de ville et le nom du Plan IGN, posés par-dessus les communes comme le veut D16. Je n'ai rien changé : le déclasser, ou demander un repère (contour, point) pour les communes qui passent à cette échelle ?
4. **La Rochelle** : « moins d'1 km de la mer » (accepté le 2026-10-12) — à reporter dans la spec (« C'est réussi si » et étape 1 de la vérification de bout en bout) à l'acceptation.

## Décisions prises à ta place
La liste complète, avec le coût si c'est faux, est dans `progress.md` (« Décisions prises à la place de Vincent »). Celles qui changent ce que tu vois :
- Contours en tuiles vectorielles : 9 367 fichiers versionnés, 23,7 Mo ; à l'échelle de la France, 10 communes plus petites qu'un pixel ne se colorent pas (toutes présentes dès le zoom 7).
- La page passe en feuille mobile sous 1 024 px (une tablette a la mise en page du téléphone).
- À 390 px : mentions au bas de la liste, absentes quand une fiche est ouverte ; compte réservé aux lecteurs d'écran (la liste l'écrit) ; message « aucune commune » dans la bande de carte (après relecture).
- Opacité des communes posée par mode, sans fondu ; contour de la commune choisie par filtre — même rendu, réaction 175 → 102 ms.
- L'adresse est relue après chaque réglage et réécrite une seconde plus tard si le navigateur l'a refusée.
- Rond d'une commune au barycentre de son plus grand morceau (Bordeaux, en croissant : rond près du bord nord).
- Groupes de ronds quand leurs centres sont à moins d'un demi-diamètre ; zoom sur une commune plafonné au zoom 12.
- Fond de secours : trait de côte Natural Earth simplifié à ≈ 500 m.
- Un nombre dans l'adresse n'est valide qu'écrit en chiffres seuls.
- Paquets indirects de moins de 7 jours ramenés à une version plus ancienne (`overrides`), à retirer plus tard.

## Relectures

| Relecture | Bloquant | Majeur | Mineur | Rapport |
|---|---|---|---|---|
| Conformité spec et code (`code-reviewer`) | 1 → corrigé | 0 | 7 | `review-spec.md` |
| Relecture du correctif (même relecteur, une fois) | 0 | 1 → corrigé | 0 | `review-spec-correctif.md` |
| Navigateur, 1440 et 390 px, clavier (`qa-tester`) | 0 | 2 → 1 corrigé, 1 à toi (point 3) | 5 | `qa.md` |

**Corrigé** (un commit et un test de non-régression hors AC chacun, rouge avant, vert après) :
- Bloquant : sur iPhone et Safari, glisser un curseur faisait tomber toute la page (page blanche) au-delà de 100 réécritures de l'adresse — `0cf07b0`, `tests/e2e/safari.spec.ts`.
- Majeur : sur Chrome, au-delà de 200 réécritures en 10 s, l'adresse restait fausse sans erreur — `e9bee30`, `tests/e2e/chrome.spec.ts`.
- Majeur : à 390 px, une carte vide sans explication quand aucune commune ne passe — `8e695ec`, `tests/e2e/aucune.spec.ts`.

**Mineurs restants** (pour toi, rien de corrigé) :
- « Aucune cochée : peu importe » reste écrit quand une taille est cochée.
- Contour de la commune choisie difficile à voir quand elle ne passe pas (il se perd sur le fond IGN).
- Ronds du top 10 : 22 px de haut (règle : 24) ; au clavier, ils passent avant les réglages, du 10e au 1er.
- Échap ne ferme pas la fiche (la spec ne le demande pas).
- Une réponse 401 en console à chaque chargement (source non identifiée, sans effet visible), plus les 404 connus de l'estompage IGN sur la mer.
- À 390 px, fiche ouverte : aucune mention IGN visible sur la carte.
- La Rochelle « moins d'1 km » pas encore reportée dans la spec (point 4).
- Heures de `progress.md` peu fiables (git montre que chaque preuve a été prise avant le commit de sa tâche).
- Fichiers modifiés hors de la liste de leur tâche sans être tous déclarés (tâches 0a à 5a) ; aucun retour en arrière.
- Les tuiles, `reperes.json` et `communes.json` sont reliés par leur position dans le fichier, sans contrôle de cohérence.
- Permissions : `npm install *` et `curl -s *` passent sans demander ; une modification non commitée de `.claude/settings.json` fait passer `curl -F` de « refusé » à « demander » (pas de moi : à toi de la garder ou non).

**Laissé exprès pendant la simplification** : mise en commun des aides Python, regroupement des aides de test, mise en page en grille, tri plus rapide ; essayés puis retirés faute de gain mesuré : connexion anticipée au serveur IGN, ronds non recréés.

## Non vérifié
- **Téléphone** : rien n'a tourné sur un vrai iPhone (ni réaction, ni gestes, ni Safari). La limite de Safari est simulée dans Chromium, pas mesurée dans WebKit ; Firefox non testé.
- **Par le testeur neuf** : chargement, erreur et « Réessayer », sans WebGL, fond IGN en panne (son outil ne sait pas couper le réseau) ; ces états sont couverts par `etats.spec.ts` et mes captures `5b-*`, `7-etats.txt`. Fiches « ne passe pas » et « sans plafond » à 390 px. Comparaison pixel à pixel avec les frames Figma. Noms de plus de 40 caractères.
- **En ligne** : rien n'est publié ; la vérification de bout en bout en ligne se fera pendant /ship.

## Coût
- Durée : ≈ 4 h 25 en 3 sessions (2 h 10 · 1 h 30 · 45 min), deux arrêts pour contexte long.
- Agents : session 1, 1 agent (test de l'agent neuf, ≈ 48 k jetons) ; session 3, 4 agents de simplification (≈ 485 k), relecteur spec (≈ 176 k), relecture du correctif (≈ 46 k), testeur navigateur (2 essais, ≈ 144 k) — ≈ 900 k jetons d'agents au total.
- Installations : gitleaks et tippecanoe (brew), Chromium 1208 pour l'outil de test de studio (≈ 91 Mo + navigateur complet), chacune avec ton accord.
- Détours (comptés par le relecteur) : aucun retour en arrière ; fichiers hors liste dans les tâches 0a, 0b, 2, 3, 4, 5a, 5b, 6 ; tâche 7 ajoutée en cours de route ; bug de rendu de la tâche 2 (4 essais) ; test Chrome instable sous charge, isolé dans son propre groupe.
