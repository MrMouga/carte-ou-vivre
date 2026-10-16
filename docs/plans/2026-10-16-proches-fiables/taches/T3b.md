# Tâche 3b — Le km partout, et la fin d'« indisponible »
Statut : faite · Début 11:11 · Fin 11:28 · Commits : 7e282ba (code et tests), puis le commit de ce rapport et des preuves

## Ce que l'utilisateur peut faire maintenant
En bureau, la pastille en haut de la carte d'un proche à vol d'oiseau parle km, comme sa ligne et la fiche :
- sans commune choisie : « Rochelleville (17) · 90 km au plus » (son plafond en km) ;
- avec une commune choisie : sa distance telle que la fiche l'écrit (« 88 km », « moins d'1 km »), suivie de « · au-dessus de 90 km » quand elle dépasse, comparée au km affiché comme le score ;
- son petit repère est celui d'un proche prêt (maison), comme son repère sur la carte (H99, déjà fait en tâche 3a).

Un calcul ne finit plus jamais « indisponible » : la dernière voie qui y menait (le classement des communes qui échoue, par exemple si le module de classement ne se charge pas) finit maintenant comme un calcul sans zone, à vol d'oiseau (R33).

Vu sur les vraies données : « 12 rue de la Paix, Nantes », calcul de trajets bloqué → pastille « Nantes (44) · 120 km au plus », puis, La Rochelle choisie, « 121 km · au-dessus de 120 km » ; fiche « Nantes (44) 121 km : au-dessus de ton plafond de 120 km ».

Déjà fait en tâche 3a et pas refait (mesuré au départ, `grep`) : repère d'un proche km = prêt (`ProcheMarkers.ts`), résumé replié « approximatif » (`Proches.tsx`), tests hors critères de `proches-carte.spec.ts` (repère) et `proches-mobile.spec.ts` (cible « Recalculer avec l'IGN <nom> »).

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-5 | `tests/e2e/proches-fiables.spec.ts` · « AC-5 en bureau (1 440 px), panne « panne-totale », Rochelleville (17) à vol d'oiseau : à 90 km, Portmer 67, Grandeville 18 ; pastille « 90 km au plus », puis « 118 km · au-dessus de 90 km » avec Quaibleu ; fiche « Rochelleville (17) 118 km : au-dessus de ton plafond de 90 km » ; aucune zone demandée depuis la fin du calcul » | vert en bureau ; rouge sur le code d'avant (la pastille disait « calcul en cours ») ; sauté dans le projet mobile (le critère est en 1 440 px, les pastilles n'existent qu'en bureau, AC-16 de proches) |

Le test suit l'état final d'AC-4 (même ajout, même panne), règle le plafond de 120 à 90 km (deux pas à gauche), lit la liste puis la pastille avant le choix, choisit Quaibleu sur la carte, lit la pastille et la fiche, et compare le nombre de zones demandées à celui de la fin du calcul (inchangé).

Tests unitaires (rouges avant le code, verts après) — `src/ui/ProcheKm.test.ts`, bloc « Pastilles d'un proche à vol d'oiseau (R15 de proches étendue, tâche 3b) » :
- « AC-5 sans commune choisie : « 90 km au plus » » (et « 120 km au plus ») ;
- « AC-5 Quaibleu choisie : « 118 km · au-dessus de 90 km » ; Portmer et Grandeville sous le plafond : la distance seule » (39 km, 88 km) ;
- « comparée au km affiché, comme le score : 90,4 km tient 90 km, 90,5 km non ; « moins d'1 km » sous 1 km ».

Hors critère, nouveau — `tests/e2e/proches-fiables.spec.ts` · « classement en échec : Nantesville (44) passe à vol d'oiseau, « 120 km au plus », sans « Trajets indisponibles » ni « Réessayer » » : le module de classement est bloqué par une route ; rouge sur le code d'avant (le proche passait indisponible, sans curseur), vert aux deux largeurs.

## Preuves
Version locale (serveur vite du dépôt), vraies données (`public/data`), vrai fond Plan IGN et vraie recherche d'adresse de l'IGN ; seul `/navigation/isochrone` est bloqué. Script jetable : `/private/tmp/claude-501/-Users-mouga-git-repository-carte-ou-vivre/84640ed0-4bd4-4bee-94d0-fd6591584b19/scratchpad/t3b/preuve-reel.spec.ts`.
- `docs/plans/2026-10-16-proches-fiables/captures/T3b-bureau-pastille-km.png` — 1 440 × 900 réduite à 1 000 px : la pastille « Nantes (44) · 120 km au plus » en haut de la carte, avec le petit repère maison ; le repère du proche sur la carte en goutte pleine à maison ; la ligne « À vol d'oiseau : l'IGN ne répond pas. », 120 km ; 643 communes passent (2026-10-16 11:15).
- `docs/plans/2026-10-16-proches-fiables/captures/T3b-bureau-pastille-la-rochelle.png` — La Rochelle (17) choisie : pastille « Nantes (44) · 121 km · au-dessus de 120 km », fiche « Nantes (44) 121 km : au-dessus de ton plafond de 120 km » et « Nantes (44) : 121 km à vol d'oiseau » (11:15).
- `docs/plans/2026-10-16-proches-fiables/captures/T3b-preuve-sortie.txt` — textes lus dans la page (pastille avant et après le choix, forme du repère « pret », fiche), 24 demandes de zones bloquées, aucune avec le nom du proche ; et la sortie du `grep` de la preuve attendue.

**`grep -rniE "trajets indisponibles|'indisponible'" src/`** (11:26) : il reste des lignes, toutes au service d'un seul cas, **le proche gardé relu sans ses temps** (format de la version en ligne : non prêt, ou empreinte des codes INSEE périmée, R12 de proches), que la tâche 4 traite (R37) : `memoire.ts` (relecture, et le type `EtatRelu`), `useProches.ts` (empreinte périmée, « Réessayer »), et son affichage dans `LigneProche.tsx`, `Fiche.tsx`, `Pastilles.tsx`, `Proches.tsx`, `ProcheMarkers.ts`, plus `memoire.test.ts`. Aucune n'est plus atteinte par un calcul. « Recherche d'adresse indisponible » et « Fond de carte indisponible » restent. Voir la décision plus bas.

Ce que les preuves ne couvrent pas : la pastille d'un proche relu « indisponible » (tâche 4) ; le cas « 90 km au plus » sur les vraies données (vu sur la fixture par AC-5 ; sur les vraies données, le plafond est resté à 120 km).

## Suite de tests
Lancée le 2026-10-16 à 11:16, port 4173 libre, charge 6,2 (sortie complète : `scratchpad/t3b/suite.txt`) :
```
 Test Files  17 passed (17)
      Tests  252 passed (252)
check-tokens : 40 fichier(s), aucune valeur arbitraire
  1 failed
  36 skipped
  309 passed (7.6m)
```
L'échec : `tests/e2e/cadre-de-vie.spec.ts:282` · AC-11 de cadre-de-vie [bureau] (montagne, sans aucun proche) : le clic sur Quaibleu n'a pas pris, la fiche est restée sur Grandeville. Relancé seul trois fois (11:24, charge 5 à 8) : `1 passed` ×3. Ce test ne touche ni pastille ni proche ; c'est l'instabilité sous charge de la [leçon du port 4173 et de la machine saturée](../../../solutions/2026-10-15-suite-instable-port-4173-et-machine-saturee.md), pas un défaut de cette tâche. Les 36 sautés = les 35 d'avant + AC-5 dans le projet mobile.

Types : `tsc --noEmit -p .` sans erreur. Construction : `✓ built in 1.80s` (avertissement habituel sur la taille des fichiers).

## Décisions prises à la place de Vincent
- Décision : `EtatProche` perd `'indisponible'` (il ne garde que les états d'un calcul : attente, calcul, prêt, partiel, km) ; un type à part, `EtatRelu = 'indisponible'`, garde l'état d'un proche gardé relu sans ses temps, et `ProcheGarde.etat` vaut `EtatProche | EtatRelu` — pourquoi : la relecture de l'ancien format reste à la tâche 4 (plan) et les tests hors critères R12 de `proches-etats.spec.ts` (« revient indisponible », « Réessayer »), rangés en tâche 4 par le plan, l'attendent encore ; en retirant `EtatRelu`, la tâche 4 aura du compilateur la liste de tout ce qui l'affiche encore — coût si c'est faux : nul pour l'utilisateur ; si la tâche 4 l'oubliait, un proche gardé incomplet resterait « Trajets indisponibles » comme aujourd'hui en ligne.
- Décision : un classement en échec (dernier chemin d'un calcul vers « indisponible ») finit comme un calcul sans zone : km, distances à vol d'oiseau, plafond converti (R33 : aucune zone → km) — coût si c'est faux : nul ; ce cas n'arrive que si le module de classement plante.
- Décision : la comparaison de la pastille km utilise la règle du score (`kmCompare`, exportée de `score.ts`) plutôt qu'une copie — même règle partout, la pastille ne peut pas dire « au-dessus » d'une commune que le score fait passer — coût si c'est faux : nul.
- Décision : la valeur de la pastille d'un proche km avec une commune est la distance seule (« 88 km »), sans « à vol d'oiseau » : c'est l'exemple de details.md (« 88 km ») et d'AC-5 (« 118 km · au-dessus de 90 km ») ; la ligne et la fiche disent déjà « à vol d'oiseau » — coût si c'est faux : nul.
- Décision : AC-5 est sauté dans le projet mobile (`test.skip`, comme les autres tests à largeur fixée du dépôt), le critère étant posé en 1 440 px et les pastilles absentes sous 1 024 px — coût si c'est faux : nul.

## Fichiers touchés hors de la liste de la tâche
- `src/domain/score.ts` — un mot : `kmCompare` est exporté, pour que la pastille compare comme le score.
- `src/ui/Fiche.tsx`, `src/ui/LigneProche.tsx` — commentaires seulement (et le type du paramètre de `RepereEnPetit`, `Proche['etat']`) : ce qui affiche « indisponible » est marqué « proche gardé relu, jusqu'à la tâche 4 ».
- `src/ui/ProcheKm.test.ts` — tests unitaires de la pastille km (le fichier des tests km de la tâche 3a).

## Tests recalés ou retirés, et ce qui les couvre
Aucun dans cette tâche : les recalages de `proches-carte.spec.ts` (repère) et `proches-mobile.spec.ts` (cibles) étaient déjà faits en tâche 3a (voir T3a.md). Restent sur « indisponible », pour la tâche 4 : les tests R12 de `proches-etats.spec.ts` (empreinte périmée, fermé pendant le calcul) et `src/proches/memoire.test.ts` (relecture d'un proche non prêt). Aucun test d'un critère d'une autre tranche n'a été touché.

## Leçons écrites
Aucune : aucun correctif n'a demandé deux essais ; l'échec de la suite est celui de la leçon existante (port 4173 et machine saturée), traité comme elle le dit.
