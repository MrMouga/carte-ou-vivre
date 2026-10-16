# Tâche 5a — Recalcul à la réouverture
Statut : faite · Début 12:26 · Fin 13:20 · Commits : 3f783f7..e172edf

## Ce que l'utilisateur peut faire maintenant
- Il rouvre le site avec un proche aux temps approximatifs (partiel) ou à vol d'oiseau (km) gardé depuis au moins 15 min : le proche se recalcule seul avec l'IGN, en tâche de fond. Sa ligne dit « Recalcul avec l'IGN… » à la place du lien ; il compte déjà dans la liste et la carte avec ses valeurs d'avant, et son curseur reste réglable.
- Si l'IGN répond mieux, le proche devient juste (prêt) ou moins approximatif, sans autre message ; un proche à vol d'oiseau repasse en heures avec le plafond converti (90 km → 1 h 30, 120 km → 2 h). Si l'IGN répond moins bien ou pas du tout, rien ne change à l'écran (un partiel ne passe jamais en km).
- L'IGN n'est pas martelé : au plus un recalcul automatique par proche toutes les 15 min, comptées depuis le début du dernier essai, réussi ou non (une réouverture 5 min après ne demande aucune zone).
- Plusieurs proches à recalculer passent un par un, dans l'ordre d'ajout, dans la même file que les ajouts (un proche qui attend son tour affiche aussi « Recalcul avec l'IGN… »).
- Le lien « Recalculer avec l'IGN » relance le proche à tout moment (voir la décision plus bas : il passe en fin de file ; la priorité sur les recalculs automatiques est la tâche 5b).
- Les lecteurs d'écran lisent « Recalcul avec l'IGN… » dans la ligne ; rien de nouveau dans la zone d'annonce de la page (H100).

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-6 (a) | `tests/e2e/proches-fiables.spec.ts` · « AC-6 (a) depuis /?loyer=1200&mer=50, panne « zones-120-a-180-toujours », ajout de Rochelleville (17) : à vol d'oiseau, « 120 km au plus » ; Portmer 70, Quaibleu 32, Grandeville 26 » | vert, bureau et 390 px |
| AC-6 (b) | idem · « AC-6 (b) … panne « zones-135-a-180-toujours » … en heures à 2 h, « Au-delà de 2 h : l'IGN n'a pas répondu. », plafond au plus 2 h ; Portmer 69, Quaibleu 36, Grandeville 29 ; Montcher « plus de 2 h : au-dessus de ton plafond de 2 h » » | vert, bureau et 390 px |
| AC-6 (c) | idem · « AC-6 (c) … Rochelleville (17) gardé à vol d'oiseau à 45 km, dernier essai il y a plus de 15 min … en heures à 45 min, « Au-delà de 1 h 45 … », plafond au plus 1 h 45 ; Portmer 48 seule » | vert, bureau et 390 px |
| AC-7 | idem · « AC-7 … Nantesville (44) gardé partiel à 2 h 30 … dès l'ouverture, « Recalcul avec l'IGN… » et Portmer 68, Grandeville 17 ; ensuite prêt à 2 h 30, Portmer 68, Grandeville 20 ; fiche de Grandeville « 2 h 15 en voiture » » | vert, bureau et 390 px |
| AC-8 (a) | idem · « AC-8 (a) … Rochelleville (17) … 90 km … IGN normal : à la réouverture, en heures à 1 h 30 ; Portmer 65, Grandeville 22 » | vert, bureau et 390 px |
| AC-8 (b) | idem · « AC-8 (b) … panne « panne-totale » : après « Recalcul avec l'IGN… », toujours à vol d'oiseau à 90 km, sans « Temps approximatifs », « Trajets indisponibles » ni message d'erreur ; Portmer 67, Grandeville 18 » | vert, bureau et 390 px |
| AC-8 (c) | idem · « AC-8 (c) … Nantesville (44) gardé partiel à 2 h 30 … panne « panne-totale » : … toujours partiel à 2 h 30 … ; Portmer 68, Grandeville 17 » | vert, bureau et 390 px |
| AC-8 (d) | idem · « AC-8 (d) … dernier essai il y a 5 min, IGN normal : à l'ouverture aucune zone demandée, toujours 90 km ; après « Recalculer avec l'IGN », en heures à 1 h 30 ; Portmer 65, Grandeville 22 » | vert, bureau et 390 px |
| AC-8 (e) | idem · « AC-8 (e) … le recalcul échoue, toujours 90 km ; seconde réouverture 5 min après la première : aucune zone demandée » | vert, bureau et 390 px |
| AC-12 (a) | idem · « AC-12 (a) … panne « zone-180-toujours-rochelleville » … 180 km … : reste à vol d'oiseau à 180 km, « Recalculer avec l'IGN », aucun plafond de 2 h 45 » | vert, bureau et 390 px |
| AC-12 (b) | idem · « AC-12 (b) … 165 km … : en heures à 2 h 45, « Au-delà de 2 h 45 : l'IGN n'a pas répondu. », plafond au plus 2 h 45 » | vert, bureau et 390 px |

Comment les cas sont posés : chaque proche gardé est **obtenu en jouant le critère d'origine dans le navigateur** (AC-4 puis le réglage en km ; AC-2 (a) puis 2 h 30), comme le disent les `given` ; rien n'est écrit à la main dans le stockage. « Dernier essai il y a plus de 15 min / il y a 5 min » : la page rouverte prend une horloge simulée en avance de 16, 5 ou 21 min (`page.clock.install({ time })`, l'heure avance ensuite normalement) ; l'heure gardée est la vraie, celle du calcul joué avant.

Rouge vérifié avant le code : avec mes changements de `src/` mis de côté (`git stash`), 11 des 13 tests nouveaux tombent sur « Recalcul avec l'IGN… » attendu ; AC-6 (a) et (b) passaient déjà (valeurs justes à l'ajout, contrôlées en T3a sans être marquées). Les 15 tests unitaires nouveaux tombaient aussi (fonctions absentes).

Tests unitaires (`src/proches/etat.test.ts`, 15 nouveaux) :
- « R36 — à l'ouverture, quels proches se recalculent » : partiel ou km à 16 min → oui (AC-8 a à c) ; borne 15 min tout juste → oui, 1 ms de moins → non ; 5 min → non (AC-8 d, e) ; prêt, en attente, en calcul → jamais ; sans heure gardée → oui.
- « R36 — résultat d'un recalcul » : AC-6 (c) km 45 → partiel 45 min ; AC-7 partiel 2 h 30 → prêt 2 h 30 ; AC-8 (a, d) km 90 → prêt 1 h 30 ; AC-8 (b, e) et (c) panne totale → l'ancien reste ; AC-12 (a) 180 km → reste ; AC-12 (b) 165 km → partiel 2 h 45 ; H97 (3 zones ne remplacent pas 11 zones) ; curseur bougé (120 km → reste, 90 km → partiel 1 h 30).

Hors critères, nouveaux (`proches-fiables.spec.ts`, bureau et 390 px) :
- « recalcul : curseur bougé de 120 à 90 km pendant le recalcul, l'IGN donne jusqu'à 1 h 45 → en heures à 1 h 30, « Au-delà de 1 h 45 » » (sans le geste, le proche resterait en km : le plafond affiché à l'arrivée décide).
- « recalcul : les zones d'annonce de la page ne changent pas pendant le recalcul de Nantesville (44), ni à son arrivée » : un guetteur posé avant l'ouverture note tout changement de texte, et toute zone nouvelle, parmi `role=status`, `role=alert` et `aria-live` ; aucun changement de l'instant où « Recalcul avec l'IGN… » s'affiche jusqu'après le passage à prêt ; la ligne n'est dans aucune zone d'annonce.

## Preuves
- `docs/plans/2026-10-16-proches-fiables/captures/T5a-preuve-sortie.txt` — sortie complète du script de preuve (bureau puis 390 px) : lignes, curseurs, demandes de zones avec leur statut, contenu du stockage à chaque étape (12:41–12:43).
- Version locale (vite), vraies données (34 746 communes), vraie recherche d'adresse, « 12 rue de la Paix, Nantes » :
  - `captures/T5a-bureau-1-km-garde.png`, `T5a-390-1-km-garde.png` — **A** : calcul de trajets bloqué par une route du navigateur de test (24 demandes bloquées) → « À vol d'oiseau : l'IGN ne répond pas. », 120 km ; stockage `etat: "km"`, `essai` (12:41).
  - `captures/T5a-bureau-2-recalcul-ign-reel.png`, `T5a-390-2-recalcul-ign-reel.png` — **B** : réouverture 16 min plus tard, calcul de trajets rétabli (**vrai IGN**) : « Recalcul avec l'IGN… » à la place du lien, à côté de « Retirer », curseur actif, 1 254 communes comptées pendant le recalcul (12:42).
  - `captures/T5a-bureau-3-apres-ign-reel.png` — **B, bureau** : le vrai IGN a donné 5 zones sur 12 (15, 60, 75, 90, 120 ; 502 ou sans réponse à 45 s pour les autres, 23 demandes, fin à 44,3 s) → le proche **repasse en heures**, partiel, plafond 120 km converti en **2 h**, « Temps approximatifs… » et « Au-delà de 2 h : l'IGN n'a pas répondu. » (12:42).
  - `captures/T5a-390-3-apres-ign-reel.png` — **B, 390 px** : à 12:43 le vrai IGN a tout refusé (24 demandes en 502 / 504) → le proche **reste à vol d'oiseau**, 120 km, sans message ; `essai` mis à jour dans le stockage (cas AC-8 b sur les vraies données).
  - `captures/T5a-bureau-4-recalcul-zones-servies.png` puis `T5a-bureau-5-pret.png`, et `T5a-390-5-pret.png` — **C** : réouverture 16 min après B, zones servies par une route du navigateur de test : « Recalcul avec l'IGN… » (sur le partiel en bureau, sur le km à 390 px), puis **prêt** à 2 h (« Retirer » seul, curseur jusqu'à 3 h) ; stockage `pret: true`, `etat: "pret"`, 12 zones (12:42–12:43).
- Aucune demande de zone ne contient le nom du proche (le script le guettait).

Ce que la preuve ne couvre pas : les zones de l'étape **C** ne sont **pas réelles** : ce sont des disques (rayon = durée × 1 km) servis par une route, faute de zones réelles enregistrées (le dépôt n'a que la zone de 15 min de Nantes, et le vrai IGN ne rendait pas les 12 zones ce midi : 30 min, 2 h et 3 h en 502 / 504 à 12:38). Elles montrent le passage au prêt sur la vraie carte, pas des temps justes ; les valeurs exactes sont tenues par AC-7 et AC-8 (a) sur la fixture. La priorité d'un ajout sur les recalculs (AC-11) n'est pas faite (5b).

## Suite de tests
(port 4173 libre, charge 1,8 au départ ; lancée à 13:03, aucun code changé depuis)
```
 Test Files  17 passed (17)
      Tests  276 passed (276)
check-tokens : 40 fichier(s), aucune valeur arbitraire
  36 skipped
  345 passed (9.8m)
```
`npm run typecheck` : sans erreur. `npm run build` : « ✓ built in 1.73s » (avertissement habituel de taille de morceau). AC-7 de cadre-de-vie n'est pas tombé.

## Décisions prises à la place de Vincent
- Décision : **le lien « Recalculer avec l'IGN » agit dès cette tâche**, en mettant le proche en recalcul **en fin de file** — le cas (d) d'AC-8, confié à 5a, se termine par un appui sur ce lien ; sans action, AC-8 ne pouvait pas passer entier. 5b garde la priorité d'un ajout ou d'un appui sur les recalculs automatiques pas encore commencés, AC-9, AC-11 et le test « Retirer pendant un recalcul » — coût si c'est faux : aucun pour l'utilisateur ; 5b a un peu moins à faire (son brief doit le savoir). Leçon écrite.
- Décision : après un appui sur le lien, **le focus passe à « Retirer »** de la même ligne (le lien disparaît, remplacé par « Recalcul avec l'IGN… ») — sinon le focus se perd en haut de la page — coût si c'est faux : 5b le déplace ailleurs (une ligne).
- Décision : l'heure du dernier essai est **écrite dès le début** de chaque recalcul (et non seulement à sa fin) — H93 compte les 15 min depuis le début de l'essai ; ainsi une page fermée pendant un recalcul ne fait pas redemander l'IGN avant 15 min. Pour un nouveau proche (calcul), rien ne change (écrite à la fin, comme en T4) — coût si c'est faux : une fermeture pendant le recalcul fait attendre 15 min de plus avant le suivant.
- Décision : un proche partiel ou km gardé **sans heure de dernier essai** (impossible avec le format de T4, mais possible pour une entrée abîmée) est recalculé à l'ouverture — coût si c'est faux : une demande de plus à l'IGN.
- Décision : « Recalcul avec l'IGN… » est écrit comme les phrases d'état de la ligne (`text-texte text-foreground`, plan « Ligne d'un proche approximatif »), **à la place du lien**, avant « Retirer » (details.md, état **recalcul**), et les phrases d'état d'avant restent affichées au-dessus (« l'état d'avant reste affiché ») — coût si c'est faux : déplacer un paragraphe.
- Décision : dans les tests qui lisent la page **pendant** un recalcul (AC-7, curseur bougé, zones d'annonce), chaque zone du faux IGN répond **5 s** après sa demande au lieu de 1 s (recalcul d'au moins 7 s), pour que la lecture tombe à coup sûr avant la fin ; les autres gardent 1 s (plan, « Pour toutes les tâches ») — coût si c'est faux : 15 s de plus sur la suite.
- Décision : « 15 min » et « 5 min » simulés par l'horloge de la page rouverte (`clock.install({ time })`) plutôt qu'en réécrivant l'heure gardée — le stockage reste celui écrit par le site — coût si c'est faux : aucun.

## Fichiers touchés hors de la liste de la tâche
- `src/App.tsx` — une ligne : passe `recalculer` de `useProches` à `Proches` (`onRecalculer`), pour l'action du lien (décision ci-dessus).
- `src/proches/distance.ts` — `minutesDeKm` (H94 dans l'autre sens, 90 km → 90 min), à côté de `kmDePlafond` et de la constante de 60 km par heure.
- `docs/solutions/2026-10-16-critere-qui-utilise-l-action-d-une-tache-suivante.md` (leçon) et l'index généré `docs/solutions/README.md`.
- `src/proches/memoire.ts` (dans la liste) n'a pas changé : le format de T4 garde déjà l'état, les zones et l'heure du dernier essai ; l'indicateur « en recalcul » n'est pas gardé (une réouverture refait le tri selon les 15 min).

## Tests recalés ou retirés
Aucun. Le test hors critère de T4 « réouverture : Rochelleville (17) à vol d'oiseau et Nantesville (44) partiel reviennent tels quels, sans zone demandée » reste vert sans changement (dernier essai de moins de 15 min : pas de recalcul). Aucun test d'un AC-n d'une autre tranche touché.

## Leçons écrites
- `docs/solutions/2026-10-16-critere-qui-utilise-l-action-d-une-tache-suivante.md` — AC-8 (d), confié à 5a, appuie sur un lien dont le plan rangeait l'action en 5b ; règle pour /breakdown : relever chaque geste du « when » d'un critère.

## Ce qui reste (pour 5b)
- Priorité : un ajout ou un « Recalculer avec l'IGN » passe devant les recalculs automatiques pas encore commencés (aujourd'hui, tout va en fin de file ; AC-11 n'est pas tenu).
- « Retirer » pendant un recalcul : le code existant arrête le calcul en cours et retire le proche de la file (même chemin qu'un calcul), mais aucun test ne le vérifie encore.
- AC-9 (lien après AC-4, service rétabli) : le chemin existe (celui d'AC-8 d), le test est à écrire en 5b.
