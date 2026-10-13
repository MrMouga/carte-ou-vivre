# Tâche 2a — Calculer les temps d'un proche
Statut : faite · Début 15:06 · Fin 15:22 · Commits : 00d96df..(ce rapport)

## Ce que l'utilisateur peut faire maintenant
Rien de visible encore : il n'y a pas d'écran avant la tâche 2b. Mais le moteur marche sur le vrai IGN. À partir de « 12 rue de la Paix, Nantes », il trouve l'adresse et son code INSEE (44109). Il demande les 12 zones de temps (de 15 min à 3 h) sans jamais dépasser 4 demandes par seconde. Il range les 34 746 mairies sans figer la page. Résultat : **La Rochelle 2 h 15**, **Bordeaux plus de 3 h** (sa zone est à 3 h 30 depuis Nantes, au-delà du plafond), Nantes 15 min. Le calcul a pris **14,5 s** (10,5 s au premier essai). Le calcul des scores tient compte des proches prêts : Portmer 65 avec Nantesville à 2 h, par exemple.

## Critères
Les AC appartiennent à la tâche 2b : ces tests utilisent leurs valeurs, mais ne portent pas leurs numéros (voir le plan).
| Règle | Test (fichier · nom) | Résultat |
|---|---|---|
| R11 (valeurs d'AC-1) | `src/domain/proches.test.ts` · « Nantesville à 2 h : Portmer seule passe, score 65 ; … » | vert |
| R11 (AC-2) | idem · « Nantesville à 2 h 15 : Portmer 67, Grandeville 21 (fin de tranche égale au plafond : passe, note 0) » | vert |
| R11 (AC-4) | idem · « Nantesville à 2 h 15 et Toulouseville à 2 h 45 : Portmer 50, Grandeville 30 ; … » | vert |
| R11 (AC-6) | idem · « loyer et mer sur « Sans limite », Nantesville à 2 h 15 : la page classe (Portmer 56, … ; Grandeville 0, …) » | vert |
| R11, D15, H19 | idem · « plafond : de 15 min à 3 h par pas de 15 min, 2 h à l'ajout (H19) » ; « sans proche prêt, rien ne change (72, 49, 32) » | vert |
| R1 étendue | idem · « raisons : après loyer, mer et taille, une par proche non tenu, dans l'ordre d'ajout ; « plus de 3 h » vaut 0 » | vert |
| H22 | idem · « « 15 min », « 45 min », « 1 h », « 1 h 15 », « 2 h 15 », « 3 h », « plus de 3 h » » ; « raison d'un proche : « Nantesville (44) 2 h 15 : au-dessus de ton plafond de 2 h » » | vert |
| R10 | `src/proches/temps.test.ts` · « zones emboîtées : la plus petite qui contient la mairie… » ; « « plus de 3 h » : une mairie hors de toutes les zones vaut 0 » ; MultiPolygon ; trou ; vraie zone de 15 min de l'IGN | vert |
| D6, H28 | idem · « une adresse part de son point… » ; « une commune choisie part de sa mairie, par code INSEE » | vert |
| R9, H20, code INSEE | `src/proches/ign.test.ts` · vraies réponses « 12 rue de la Paix, Nantes » et « Toulouse » ; « arrondissements de Paris, Lyon et Marseille ramenés à la ville ; Corse 2A/2B ; outre-mer écarté ; 5 au plus » | vert |
| H21 (file), R13 | idem · « 12 zones, de 3 h à 15 min, une toutes les 250 ms » ; « deux proches de suite… » ; « page occupée 600 ms : … 250 ms au moins entre deux » ; « un refus (429) fait échouer le proche… » ; « une erreur réseau… » | vert |
| Faux service + worker | `tests/e2e/proches-temps.spec.ts` (bureau et 390 px) · « « 1 rue Test » : … fins de tranche de la fixture » (60, 135, 150, 150, plus de 3 h) ; « « 2 place Test » » ; zones en panne ; refus 429 | vert |

## Preuves
- `docs/plans/2026-10-13-proches/captures/T2a-preuve-ign-nantes.txt` — vrai IGN, vraies données (34 746 communes), vrai module chargé dans Chromium, adresse « 12 rue de la Paix, Nantes ». Recherche 182 ms, code INSEE 44109. Calcul 14,5 s. **La Rochelle (17300) 2 h 15**, **Bordeaux (33063) plus de 3 h**, Nantes 15 min, Les Sables-d'Olonne 1 h 45. 12 zones sur 12 reçues (statut 200), écart minimal entre deux départs : 250 ms. (2026-10-13 15:15)
- `docs/plans/2026-10-13-proches/captures/T2a-preuve-ign-toulouse-commune.txt` — « Toulouse » choisie comme commune. Le trajet part de la mairie de `reperes.json` (1.4442, 43.6046), pas du point de l'IGN. Bordeaux 3 h (comme en tâche 0), calcul 10,5 s. (15:16)
- `docs/plans/2026-10-13-proches/captures/T2a-file-avant-correction.txt` — premier passage, avant correction : deux zones parties à 71 ms d'écart pendant que la page chargeait la carte. (15:14)
- `docs/plans/2026-10-13-proches/captures/T2a-npm-test.txt` — la suite complète. (15:18)
- Le worker tourne aussi en version construite. J'ai construit une page jetable (`probe/proches/t2a-build/`, non versionnée) avec `vite build`, puis je l'ai ouverte avec `vite preview` : réponse « worker OK : 30,0 » (15:17). L'application ne l'importe pas encore : il entrera dans `dist/` avec la tâche 2b.
- Script de preuve : `probe/proches/t2a-preuve.mjs` (non versionné) ; à relancer avec `npx vite --port 5174`, puis `node probe/proches/t2a-preuve.mjs "12 rue de la Paix, Nantes"`.
- **Ce que la preuve ne couvre pas** : le téléphone ; une adresse en Corse sur le vrai IGN (couverte par les tests, avec des codes) ; le délai de 45 s et l'arrêt d'un calcul (tâche 3) ; aucun écran.

## Suite de tests
```
unit  : Test Files  9 passed (9) · Tests  75 passed (75)
jetons: check-tokens : 29 fichier(s), aucune valeur arbitraire
e2e   : 69 passed (39.0s) · 2 skipped (les 2 qui existaient déjà)
types : tsc --noEmit -p . — sans erreur
build : ✓ built in 1.76s
```
Les 15 AC de loyer-mer sont compris dans les 69 tests du navigateur, tous verts.

## Décisions prises à la place de Vincent
- Décision : si une seule des 12 zones échoue (refus 429, erreur 504 ou réseau), tout le proche échoue. Il n'y a ni calcul partiel ni nouvel essai automatique, et les zones pas encore lancées ne partent pas. — Raison : R12 dit qu'un proche à qui il manque des temps est indisponible, et R13 compte le 429 comme une panne. Ne pas relancer ménage aussi l'IGN. — Coût si c'est faux : une zone ratée oblige à « Réessayer » le proche entier (environ 15 s). En tâche 0, à 3 h, 12 zones sur 12 sont toujours arrivées.
- Décision : la file compte depuis le **départ réel** de la zone précédente (250 ms au moins), et non depuis des heures réservées d'avance. Elle est commune à toute la page, donc à plusieurs proches qui se suivent. Le créneau d'un proche arrêté se libère. — Raison : mesuré sur le vrai IGN, deux zones étaient parties à 71 ms d'écart pendant le chargement de la carte (à 6 demandes en une seconde, l'IGN bloque 5 s). — Coût si c'est faux : aucun, sauf environ 0,1 à 0,5 s de plus quand la page est occupée.
- Décision : les temps d'un proche forment un tableau d'entiers 16 bits dans l'ordre de `communes.json` : fin de tranche en minutes, 0 = plus de 3 h. C'est le format de la mémoire (R12). `evaluer(communes, réglages, proches)` reçoit les proches prêts sous la forme `{ nom, plafond, temps }`, et la raison « proche » porte le nom. — Raison : le rappel du plan l'impose pour la tâche 3, et cela évite une conversion. — Coût si c'est faux : si l'ordre de `communes.json` change, les temps ne correspondent plus. L'empreinte prévue en tâche 3 le détecte.
- Décision : une commune choisie seule part de sa mairie (`reperes.json`, par code INSEE). Si la commune manque à la carte, on part du point rendu par l'IGN. — Raison : D6, avec un secours plutôt qu'une erreur. — Coût si c'est faux : un point de départ décalé de quelques centaines de mètres, dans un cas rare.
- Décision : dans le faux service, le code INSEE des suggestions est inventé : département + « 999 » (« 44999 »). — Raison : la fixture ne donne pas de code INSEE aux adresses, et le vrai service en rend toujours un. — Coût si c'est faux : aucun pour les AC, qui ne lisent pas ce code.
- Décision : moins de 3 caractères → aucune suggestion, sans demande. Sinon, les 5 premières suggestions de métropole. Le département vient des 2 premiers caractères du code INSEE (2A, 2B compris). Les durées s'écrivent avec des espaces insécables, comme les autres formats (H3). — Raison : H20, et la décision de la tâche 0. — Coût si c'est faux : un détail à changer dans `ign.ts` ou `format.ts`.
- Pas de recherche inverse : `/geocodage/search` suffit (tâche 0). Le délai de 45 s (H21) n'est pas dans le module. C'est à la file des proches de le poser (tâche 3), et `calculerTemps` accepte déjà un signal d'arrêt.

**À savoir pour la tâche 2b — une mesure qui contredit le plan.** Le faux service répond à chaque zone après 1 s / 12, comme demandé. Mais avec la file à 250 ms, un proche dure **2,85 s** (mesuré), et non « environ 1 s ». Le test qui attend l'état **prêt** doit donc patienter plus que les 5 s par défaut de Playwright, par exemple `{ timeout: 10_000 }`. L'état **calcul** reste facile à observer.

## Fichiers touchés hors de la liste de la tâche
- `src/proches/classer.worker.ts` — le Web Worker (autorisé par le brief).
- `tests/e2e/proches-temps.spec.ts` — un test dans le navigateur, sans interface. Il charge le vrai module (file, worker) dans la page, avec le faux service. C'est la seule façon de prouver le worker et le faux service avant la tâche 2b.
- `src/domain/proches.test.ts` — le troisième fichier de tests unitaires, avec `src/proches/temps.test.ts` et `src/proches/ign.test.ts` : 3 au plus, comme prévu. Aucun test existant n'a été modifié.
- `docs/solutions/2026-10-13-file-limitee-minuteries-en-retard.md` et `docs/solutions/README.md` (index régénéré) — la leçon.
- `docs/plans/2026-10-13-proches/captures/T2a-*.txt` — les preuves.
- Hors du dépôt : `~/.claude/studio/solutions/` (même leçon, avec son index).

## Leçons écrites
- `docs/solutions/2026-10-13-file-limitee-minuteries-en-retard.md` — une file limitée en débit compte depuis le départ réel de la demande précédente. Pour simuler une page occupée sous Vitest, on avance l'horloge en synchrone : `setSystemTime` décale aussi les minuteries, et le premier test passait sur le code fautif. Il y a aussi les 2,85 s du faux service.
