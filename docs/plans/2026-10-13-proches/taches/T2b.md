# Tâche 2b — Ajouter un proche dans le panneau
Statut : faite · Début 15:21 · Fin 15:43 · Commits : 45c01a2..(commit de ce rapport)

## Ce que l'utilisateur peut faire maintenant
Dans le panneau de gauche, sous « Taille de ville », une nouvelle catégorie **« Tes proches »**. Sans proche, elle affiche « Ajoute l'adresse d'un proche : la carte calcule le temps en voiture jusqu'à chaque commune. » et un champ « Adresse ou ville ».

Le parcours d'ajout :
1. On tape au moins 3 caractères. 300 ms après la dernière touche, jusqu'à 5 suggestions apparaissent, sur deux lignes (« 12 Rue de la Paix » / « 44000 Nantes » ; pour une ville : « Toulouse » / « Commune · départ de la mairie »).
2. On choisit une suggestion. Le champ « Nom » apparaît, prérempli (« Nantes (44) »), et « Ajouter » devient actif.
3. On garde ce nom ou on le remplace (30 caractères au plus ; un nom vide reprend la commune).
4. On appuie sur « Ajouter ». Le proche affiche « Calcul des trajets depuis Parents de Léa… », puis son plafond, 2 h, avec un curseur de 15 min à 3 h.

La liste et la carte suivent aussitôt. Bouger un plafond recolore la carte sans nouveau calcul. Dès qu'il y a un proche, le champ se replie derrière « + Ajouter un proche ». « Retirer » enlève un proche prêt. L'adresse de la page ne change jamais. En bureau, le panneau défile quand il devient trop long, et le compte reste collé en bas (Figma 22:486). Un rechargement efface encore les proches : la mémoire du navigateur arrive en tâche 3.

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-1 | `tests/e2e/proches.spec.ts` · « AC-1 ajouter « 1 rue Test 44000 Nantesville » : nom proposé, calcul, puis plafond 2 h ; Portmer seule passe (65) ; adresse inchangée » | vert, bureau et 390 px |
| AC-2 | idem · « AC-2 plafond de Nantesville (44) sur 2 h 15 : Portmer 67, Grandeville 21 ; Quaibleu non colorée ; aucun nouveau calcul » | vert, bureau et 390 px |
| AC-4 | idem · « AC-4 Nantesville (44) à 2 h 15, puis Toulouseville (31) ajouté et réglé à 2 h 45 : Portmer 50, Grandeville 30 » | vert, bureau et 390 px |
| AC-6 | idem · « AC-6 loyer et mer « Sans limite », Nantesville (44) à 2 h 15 : Portmer 56 (40–60), Grandeville 0 (0–20) ; pas de message « Fixe un loyer… » » (couleurs lues au pixel) | vert, bureau et 390 px |
| D13, details.md (vide) | idem · « vide : texte d'accueil et champ ; dès un proche, le champ se replie derrière « + Ajouter un proche », qui le rouvre » | vert, bureau et 390 px |
| H20, R9, H30 | idem · « recherche : rien sous 3 caractères ; un nom vide reprend la commune ; un nom libre est gardé (30 caractères au plus) » (aucune demande ne contient le nom) | vert, bureau et 390 px |
| H21 (retrait sans calcul) | idem · « « Retirer » sur un proche prêt : il disparaît, la liste revient sans calcul (72, 49, 32) » | vert, bureau et 390 px |
| AC-1 à AC-15 de loyer-mer | fichiers existants de `tests/e2e/`, non modifiés | verts |

## Preuves
- `docs/plans/2026-10-13-proches/captures/T2b-preuve-ign.txt` — le vrai IGN et les vraies données (34 746 communes). **Temps de calcul, cache vide : « Parents de Léa » (12 rue de la Paix, Nantes) 10,9 s ; Toulouse (31), choisie comme commune, 29,6 s.** Pour Toulouse, la zone de 3 h a mis à elle seule 29,5 s à répondre côté IGN (10,5 s en tâche 2a). On reste sous le délai d'échec de 45 s. Le fichier donne aussi le détail des 24 zones (toutes en 200, une toutes les 250 ms) et le départ de Toulouse depuis sa mairie (1.4442,43.6046). Il liste toutes les requêtes envoyées à l'IGN : aucune ne contient « Parents » ni « Léa ». L'adresse de la page relue : `/?loyer=1200&mer=60`. (≈ 15:27–15:36)
- `T2b-vide.png` — état vide, bureau (15:34)
- `T2b-suggestions.png` — « 12 rue de la Paix, Nantes » : 4 suggestions sur deux lignes ; le panneau a défilé jusqu'à elles, le compte reste collé en bas (15:34)
- `T2b-nom-propose.png`, `T2b-nom.png` — nom proposé « Nantes (44) », puis remplacé par « Parents de Léa », « Ajouter » actif (15:34)
- `T2b-calcul.png` — « Calcul des trajets depuis Parents de Léa… », repère en petit « … » (15:34)
- `T2b-pret-parents.png` — le proche prêt, avec 2 h et son curseur. La liste montre « 703 communes passent tes critères » (1 Marzan (56) 63, 2 Chaumes-en-Retz (44) 62…). La carte est colorée autour de Nantes. (15:34)
- `T2b-suggestions-toulouse.png`, `T2b-nom-toulouse.png` — « Toulouse » : la commune proposée en tête, avec le nom « Toulouse (31) » (15:35)
- `T2b-deux-proches.png` — les deux proches prêts : « Toulouse · départ de la mairie », panneau qui défile. Résultat : « Aucune commune ne passe tes critères ». C'est attendu : Nantes–Toulouse fait 5 h 34, voir spec D15. Même chose avec les deux à 3 h et la mer « Sans limite ». (15:35)
- `T2b-toulouse-seule.png` — après « Retirer Parents de Léa » : Toulouse seule à 2 h donne 209 communes (Portel-des-Corbières (11) 56, Sigean (11) 54…), sans aucune nouvelle zone demandée (24 avant, 24 après) (15:35)
- `T2b-390-proche.png` — 390 px : la zone dans la feuille, entre la taille et la liste (15:36)
- `T2b-npm-test.txt` — la suite complète sur le code final (15:38)
- Ce que la preuve ne couvre pas : le téléphone, Safari, la mémoire (tâche 3), les repères et la fiche (tâche 4).
- **Attention à la fraîcheur des mesures.** Les temps de 10,9 s et 29,6 s ont été mesurés avant le dernier changement : le défilement du panneau en bureau. Le code du calcul (`useProches`, `ign.ts`, le worker) n'a pas changé depuis. J'ai refait le parcours sur le code final : les captures en viennent. Mais les 24 zones sont alors sorties du cache HTTP du navigateur, en 1 à 6 ms chacune, et chaque proche n'a pris que 2,9 s, même après un redémarrage du navigateur de test. Le temps réel ne peut donc se remesurer que sur un profil de navigateur neuf.
- **Incident.** Vers 15:36, en fin de session, les curseurs Loyer et Mer de la fenêtre visible ont bougé sans aucune commande de ma part. L'adresse de la page est passée par `/?loyer=350`, puis `1000&mer=105`, puis `1400&mer=65`. Je pense à une manipulation extérieure de la fenêtre. Aucune capture n'a été prise après. Le code de la tâche ne touche pas à ces réglages.

## Suite de tests
```
unit  : Test Files  9 passed (9) · Tests  75 passed (75)
jetons: check-tokens : 32 fichier(s), aucune valeur arbitraire
e2e   : 83 passed (1.1m) · 2 skipped (les 2 sauts conditionnels qui existaient déjà)
types : tsc --noEmit -p . — sortie 0, aucune erreur
build : ✓ built in 2.16s (avertissement de taille > 500 kB, déjà présent) ; classer.worker-*.js est maintenant dans dist/assets
```
Les 83 tests du navigateur = les 69 d'avant, plus les 14 nouveaux (7 tests × 2 largeurs).

## Décisions prises à la place de Vincent
- Décision : les deux lignes d'une suggestion viennent du libellé de l'IGN : « 12 Rue de la Paix » / « 44000 Nantes », coupé avant le code postal. Pour une commune : « Toulouse » / « Commune · départ de la mairie », comme dans Figma. Le nom accessible du bouton est « Ligne 1, Ligne 2 » (contrat) ; le test d'AC-1 choisit donc « 1 rue Test, 44000 Nantesville ». — Raison : ajouter des champs à `Suggestion` aurait cassé le `toEqual` d'un test existant de la tâche 2a. — Coût si c'est faux : un libellé IGN sans code postal s'affiche sur une seule ligne.
- Décision : l'adresse sous le nom d'un proche est le libellé de l'IGN tel quel : « 12 Rue de la Paix 44000 Nantes », sans la virgule que montre Figma. — Raison : AC-14 attend « 1 rue Test 44000 Nantesville ». — Coût si c'est faux : une ligne dans `adresseDe`.
- Décision : les calculs passent un par un. Un proche ajouté pendant un autre calcul affiche « En attente… ». Un calcul qui échoue fait passer le proche à « Trajets indisponibles depuis X. », avec « Retirer » mais sans « Réessayer ». « Retirer » n'existe que sur un proche prêt ou indisponible. — Raison : ce sont des états de la tâche 3, mais sans eux un proche raté resterait bloqué sur « Calcul… » sans issue. Ici, c'est le strict minimum. — Coût si c'est faux : la tâche 3 complète (Réessayer, délai de 45 s, arrêt pendant le calcul) sans rien défaire.
- Décision : en bureau, le panneau de réglages s'arrête au-dessus de la légende et défile. Le compte reste collé en bas, sous un trait de séparation toujours visible. Figma ne montre ce trait que quand le panneau défile. — Raison : sans ce défilement, le panneau dépassait l'écran dès un proche et la recherche ouverte (945 px pour 900, mesuré). « Ajouter » devenait inaccessible, car la page ne défile pas. La hauteur réservée en bas est mesurée sur la légende réelle, sans valeur en dur. — Coût si c'est faux : retirer le trait quand le panneau ne défile pas demanderait une mesure de plus.
- Décision : quand les suggestions arrivent, le panneau défile pour les centrer (Figma 22:486 : « panneau défilé jusqu'au champ »). Après le choix d'une suggestion, le focus va au champ « Nom », et Entrée y vaut « Ajouter ». Après « Ajouter », le focus passe au lien « + Ajouter un proche ». — Raison : garder le clavier et le regard au bon endroit. — Coût si c'est faux : quelques lignes dans `Proches.tsx`.
- Décision : le résumé de « Tes proches » repliée vaut « Aucun » ou le nombre de proches. — Raison : il faut un résumé ; le format détaillé (« 3 · 1 en calcul ») revient à la tâche 3. — Coût : aucun.
- Décision : les icônes de Figma (maison, lieu) sont recopiées en SVG dans le code, avec la couleur du texte (`currentColor`), plutôt qu'en fichiers SVG à couleur fixe. Le repère en petit utilise `size-cible` (24 px) et l'icône `size-echantillon` (14 px) : mêmes valeurs que Figma, sans nouveau jeton. — Raison : jetons seulement ; même façon de faire que le chevron de la tâche 1. — Coût si c'est faux : un jeton `taille-repere-petit` à ajouter.
- Décision : si la recherche tombe en panne, aucune suggestion ne s'affiche, et il n'y a pas encore de message. — Raison : les messages (« Aucune adresse trouvée. », panne, doublon, plein) sont prévus en tâche 3. — Coût : aucun.
- Non fait, laissé aux tâches suivantes : « Effacer mes proches » (tâche 3) ; les cibles de 44 px à 390 px pour « Retirer » et « + Ajouter un proche » (tâche 5 ; elles font 24 px pour l'instant) ; le message de liste « …ou un proche. » (tâche 4).

## Fichiers touchés hors de la liste de la tâche
- `src/ui/Settings.tsx` — une classe pour que le panneau défile en bureau (`bureau:min-h-0 bureau:overflow-y-auto bureau:pb-0`). Raison : le défilement décrit plus haut.
- `tests/e2e/proches.spec.ts` — le nouveau fichier de tests e2e de la tâche (le plan dit « les tests e2e »).
- `docs/solutions/2026-10-13-panneau-defilant-compte-colle.md` (nouveau), `docs/solutions/2026-10-13-isochrones-ign-lents-et-limite-de-debit.md` (ligne « Revu le »), `docs/solutions/README.md` (index régénéré). Hors du dépôt : la même ligne « Revu le » dans `~/.claude/studio/solutions/`, avec son index.
- `docs/plans/2026-10-13-proches/captures/T2b-*` — les preuves.

## Leçons écrites
- `docs/solutions/2026-10-13-panneau-defilant-compte-colle.md` — dans un panneau qui défile avec un pied collé : retirer le rembourrage bas du panneau, et centrer ce qu'on fait apparaître. Il a fallu deux essais pour le compte collé (une marge négative le faisait recouvrir « Ajouter ») et deux pour le défilement vers les suggestions (`nearest` les laissait sous le compte).
- `docs/solutions/2026-10-13-isochrones-ign-lents-et-limite-de-debit.md` — ajout d'une ligne « Revu le 2026-10-13 ». La zone de 3 h varie de 10 à 29,5 s. Le navigateur garde les réponses de l'IGN en cache HTTP, même après un redémarrage du navigateur de test. Pour mesurer un temps réel, il faut donc un profil neuf.

## Question pour Vincent (si statut question) / Ce qui reste (si partiel) / Ce qui bloque (si bloqué)
Rien.
