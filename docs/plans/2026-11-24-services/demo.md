# Démo — services du quotidien
2026-11-24 · /build terminé, à accepter par Vincent · Plan : [plan.md](plan.md) · Progression : [progress.md](progress.md)

> AC = critère d'acceptation de la spec ; Bloquant / Majeur / Moyen / Mineur = gravité donnée par un relecteur neuf ; une preuve = capture ou sortie de commande, datée.
> Rien n'est en ligne : la version testée tourne en local. La mise en ligne, c'est /ship.

## L'essayer
- En local, vraies données : `npm run build && npx vite preview --port 4180`, puis http://localhost:4180/
- Sur ton téléphone, même Wi-Fi : `npx vite preview --host --port 4180`, puis l'adresse « Network » affichée.
- Trois liens à ouvrir tels quels :
  - `/?loyer=aucun&services=medecin:10` — Bordeaux et Mende passent.
  - `/?loyer=aucun&services=medecin:10,ecole:20,college:20,gare-regionale:30` — Mende et Ajaccio écartées, avec leur raison.
  - La fiche de L'Île-d'Yeu (clique-la sur la carte) — « pas de chiffre », « aucune sur l'île », phrase de la traversée.

## Ce qui est construit
| Tâche | Ce que tu peux faire maintenant |
|---|---|
| 0a, 0b | Les temps en voiture des 34 746 communes sont calculés depuis l'Insee (figé : mêmes fichiers que pendant la spec) et les horaires SNCF, et servis dans un fichier de 238 Ko tel que le site l'envoie (≈ 304 Ko en gzip, limite 350). Valeurs identiques à l'essai de la spec (347 460 sur 347 460). |
| 0c | Le tableau de tes 10 communes, confronté aux trajets de l'IGN : [credibilite-services.md](credibilite-services.md) — **à juger maintenant** (plus bas). |
| 1 | Chaque fiche donne les 10 temps et leurs limites, sous « Tes proches » quand il existe ; le pied de page cite l'Insee et les gares grandes lignes ; la carte s'affiche sans attendre les temps (ils arrivent 1 ms après la carte). |
| 2 | Un lien avec `services=…` filtre la carte et la liste ; la fiche d'une commune écartée dit pourquoi. |
| 3a | La catégorie « Services », dernière du panneau : Médecin, Commerce alimentaire, Gare (Toutes · Régionale · Grandes lignes) ; repliée, elle dit « Peu importe », « 1 choix »… |
| 3b | La Scolarité : 5 niveaux cumulables, un temps commun ; tant qu'il manque l'un ou l'autre, « Coche au moins un niveau et un temps. » et rien ne filtre. |
| 4 | Si les temps ne se chargent pas (ou 15 s sans réponse), la catégorie et la fiche le disent, avec « Réessayer » ; au téléphone, une pastille touchée vient entière à l'écran. |

## Preuves
- **17 critères sur 17** passent ; chacun a un test qui porte son identifiant ([acceptance.json](../../specs/2026-11-23-services/acceptance.json)).
- Dernière suite complète, relancée par moi après la passe de simplification : Vitest 397 / 397 ; jetons sans valeur arbitraire ; Playwright 473 verts, 0 rouge, 48 sautés ; types et construction du site verts.
- Les critères des tranches d'avant (« Ne change pas ») passent tous.
- Tests instables sous charge (des tests du téléphone et des proches, vus rouges quand plusieurs choses tournaient à la fois) : tous verts quand on les relance seuls, trois fois. Rien de cassé, mais c'est à surveiller.
- **Vérification de bout en bout** (les 7 étapes de la spec) sur la version livrée, vraies données, en bureau et à 390 px au toucher : toutes passent — [journal](captures/bout-en-bout-apres-simplification.txt). Exemples :
  - Auch : Médecin 2 min, Commerce 2, Crèche 3, École 2, Collège 3, Lycée 3, Supérieur 4, Gare 4, Gare régionale 4, Gare grandes lignes plus d'une heure — [capture 390 px](captures/T1-fiche-auch-390x844.png).
  - Mende écartée par « Gare régionale 30 min » : « Gare régionale plus d'une heure : au-dessus de ton plafond de 30 min » — [capture](captures/T2-gare-regionale-30-mende-1440x900.jpg).
  - Ajaccio : « Gare régionale : aucune en Corse » — [capture](captures/bout-en-bout-apres-simplification-ajaccio.jpg).
  - L'Île-d'Yeu : [capture 390 px](captures/T4-e5-ile-d-yeu-390x844.png).
  - Catégorie : [départ](captures/T3a-cat-depart-390.png), [réglage d'exemple](captures/T3a-cat-exemple-390.png), [Scolarité incomplète](captures/T3b-cat-incomplete-390.png), [erreur](captures/T4-erreur-categorie-390x844.jpg).
- « Médecin 10 min » seul : 27 967 communes passent = les 27 960 de la mesure de la spec + 7 sans chiffre (elles passent, D6) ; les 6 villages sans habitant de la Meuse ne passent pas (D7).

## Tests existants modifiés
- `tests/e2e/lib/carte.ts` (le fichier partagé qui simule les données pour tous les tests) : **13 lignes ajoutées, aucune retirée ni changée** — il sert maintenant aussi le fichier des temps. Ton accord du 2026-11-24.
- Aucun autre. Les tests du téléphone qu'on avait le droit de décaler n'ont pas eu besoin de l'être.

## Décisions prises à ta place
Chacune avec ce qu'elle coûte si elle est fausse. Liste complète dans [progress.md](progress.md).
- **Parts de carreaux additionnées** (0a) : l'Insee découpe 63 459 carrés de 200 m en morceaux ; on les additionne, sinon 12 % de la population disparaissait. Si c'était faux : des médianes un peu déplacées dans les carrés à cheval ; les valeurs d'AC-13 sont justes.
- **La lettre de 60 min** est `y`, pas `Y` : le plan se contredisait. Coût : aucun.
- **Fiche qui défile en bureau** (1) : sinon la fin d'une fiche longue (L'Île-d'Yeu) était coupée, sans moyen de la lire. Coût : rien n'indique qu'on peut défiler (Mineur de la QA).
- **« Scolarité » grisée pendant la construction** (3a, puis branchée en 3b) : sans effet aujourd'hui.
- **Erreur de chargement** (4) : le message va sous le titre de la catégorie, avec ses réglages inactifs dessous ; après « Réessayer », le focus va au titre du bloc. Coût : un lecteur d'écran peut annoncer l'erreur deux fois si une fiche est ouverte en bureau.
- **Une ligne d'emploi retouchée** (1) : le défilement qui amène une pastille à l'écran est arrondi au pixel supérieur. Le pied de page plus long faisait tomber un test d'emploi de 0,25 px ; le test n'a pas été touché.
- **Le tableau du risque** compare aussi l'équipement le plus proche des 5 communes voisines (0c), sinon Roscanvel ne voyait que Brest, de l'autre côté de la rade.

## Ce que tu as décidé pendant la construction
- **Vitesse acceptée** (H163) : décocher « 10 min » en « Grandes lignes » met 277 ms à recolorer la carte avec un processeur ralenti 4 fois, autant que « Ville dense » déjà en ligne (+ 115 à + 116 ms au geste du prix, limite + 115). Chantier « accélérer le recoloriage » noté dans STATE.md. **Écart de méthode** : l'agent a franchi la condition d'arrêt sans s'arrêter ; je t'ai posé la question après coup (pour /retro).

## Relectures (agents neufs)
- **Conformité à la spec** ([review-spec.md](review-spec.md)) : 0 Bloquant, 0 Majeur. Moyens : mes heures « vérifié à … » dans la progression étaient estimées, pas lues (corrigé, signalé) ; la vérification de bout en bout datait d'avant la simplification (refaite depuis, elle passe). Mineurs : la condition d'arrêt de vitesse franchie ; R51 de details.md parle encore des titres visibles retirés par H169 (seul le texte de la spec est à corriger) ; deux petits fichiers touchés hors des listes, justifiés.
- **Navigateur, 1re passe** ([qa.md](qa.md)) : partielle, son navigateur n'avait pas WebGL. **Moyen** : en bureau, le pied de page fait 7 lignes, couvre le bas de la carte (12 %) et prend les clics à cet endroit (il a grandi avec les deux mentions des services). Mineurs : une fiche longue en bureau ne montre pas qu'elle défile ; si la carte elle-même est en erreur, la fiche reste sur « Chargement des temps… ».
- **Navigateur, 2e passe** ([qa-2.md](qa-2.md), avec WebGL logiciel) : 0 Bloquant, 0 Majeur. Coches, adresse, Scolarité, résumé, chargement, erreur, « Réessayer », clavier (ordre, contour visible, rien de piégé), fiches d'Auch, du Havre, des Sables-d'Olonne, de L'Île-d'Yeu et de Mende écartée : vérifiés. Mineurs : une Scolarité à 2 niveaux compte « 1 choix » (c'est la règle H154) ; les flèches ne déplacent pas le focus dans une rangée de cases (seul Tab avance ; rien ne l'exige).
- Laissé exprès, sans correction : tout ce qui précède (aucun Bloquant ni Majeur). Le pied de page est le seul point qui mérite peut-être une retouche avant la mise en ligne : à toi de voir.

## Non vérifié
- La version en ligne (c'est /ship) ; un vrai iPhone ; un vrai lecteur d'écran (VoiceOver).
- Le bloc de la fiche sous « Tes proches » sur les vraies données : la recherche d'adresse de l'IGN ne répondait pas pendant la 2e QA (vérifié sur la fixture et en tâche 1 avec Toulouse).
- Hors tranche, vu par la 2e QA : avec `loyer=100` ou `200` (sous le minimum du curseur), la fiche ne donne pas la raison du loyer. Comportement d'avant, non creusé.

## Coût
- De 12:17 à 18:30 environ, une session, sans coupure.
- Agents : 8 constructeurs (un par tâche ; celui de la tâche 1 relancé une fois après sa limite de tours), 1 simplification, 1 relecteur de conformité (relancé une fois), 2 testeurs navigateur (le premier sans WebGL). Environ 2,2 millions de jetons au total (T0a 252 k, T0b 213 k, T0c 183 k, T1 283 k, T2 186 k, T3a 178 k, T3b 152 k, T4 241 k, simplification 132 k, conformité 190 k, QA 95 k + 89 k).
- Détours : une condition d'arrêt franchie (3b) ; deux agents arrêtés à leur limite de tours ; une QA à refaire faute de WebGL ; un commit refusé par le garde-fou des images (captures de la QA en cours embarquées par erreur, retirées).
