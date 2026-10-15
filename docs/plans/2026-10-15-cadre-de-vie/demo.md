# Démo — cadre-de-vie
2026-10-15 · Plan : [plan.md](plan.md) · Progression : [progress.md](progress.md) · Spec : [spec.md](../../specs/2026-10-14-cadre-de-vie/spec.md)

> AC = critère d'acceptation de la spec ; Bloquant / Majeur / Mineur = gravité donnée par un relecteur neuf.
> Une preuve = capture ou sortie de commande, datée (dossier [captures/](captures/)).

## Ce qui est construit
Pour essayer : `npm run build` puis `npx vite preview` → http://localhost:4173 (vraies données). Sur le téléphone : `npx vite preview --host`.

- **Les données** (tâches 0 et 1) : chaque commune a son type d'environnement (grille de densité Insee 2025, 4 niveaux) et sa distance à la montagne (zone loi Montagne du Cerema, choisie après mesure). En Acheter, une commune sans assez de ventes d'appartements prend le prix tous biens (D12 d'immobilier) : 2 194 communes de plus ont un prix.
- **La catégorie « Cadre de vie »** (tâche 3) remplace « Mer » et « Taille de ville » : tailles en chiffres (« 10 000 – 50 000 hab. »), mer en cinq choix (Peu importe, 10, 30, 50, 100 km). La page s'ouvre sur `/?loyer=1200`, tout le cadre sur « Peu importe ». Un ancien lien `mer=60` s'ouvre sur 100 km. La fiche dit « Ville dense · 268 000 habitants ».
- **La montagne** (tâche 4) : mêmes cinq choix, filtre et note comme la mer ; la fiche dit « Commune de montagne », la distance ou la raison.
- **Le type d'environnement** (tâche 5) : Ville dense, Ville et périphérie, Bourg et village, Campagne isolée ; filtre sans noter ; au téléphone, une rangée qui défile.
- **Les tranches d'avant** ont été recalées sur le nouveau départ (50 critères réécrits à la spec, tous verts).

## Preuves
- **Suite** : voir « Vérification finale » en bas (unitaires, navigateur, types, jetons, build relancés par l'orchestrateur).
- **Critères** : 65 sur 65 à `passes: true` dans les cinq `acceptance.json` (les 3 critères reportés de proches, AC-12, AC-13, AC-15, restent sautés comme prévu).

| Tranche | Passent | Dont prouvés dans cette tranche |
|---|---|---|
| cadre-de-vie | 12 / 12 | tous |
| loyer-mer | 15 / 15 | tous recalés |
| proches | 13 / 16 (3 reportés) | 13 recalés |
| interface-telephone | 11 / 11 | tous recalés ; AC-8 avec tes captures iPhone |
| immobilier | 14 / 14 | 12 recalés + AC-14 (D12) ; AC-9 et AC-12 inchangés |

- **Écrans** (version construite, vraies données) : départ et choix à 1 440 et 390 px ([T3-depart-1440](captures/T3-depart-1440.png), [T3-choix-390](captures/T3-choix-390.png), [T3-repliee-390](captures/T3-repliee-390.png)) ; montagne 10 km ([T4-montagne10-1440](captures/T4-montagne10-1440.png)) ; Chamonix à 1 350 € ([T4-fiche-chamonix-1350-1440](captures/T4-fiche-chamonix-1350-1440.png)) ; Clermont-Ferrand après correction ([C1-fiche-clermont-ferrand-1440](captures/C1-fiche-clermont-ferrand-1440.png)) ; Desvres au prix tous biens ([T2-acheter-fiche-desvres](captures/T2-acheter-fiche-desvres.png)) ; vérification de bout en bout, étapes 1 à 5 ([T5-preuve-bout.txt](captures/T5-preuve-bout.txt)) ; 375 × 548 ([T5-ouverture-375x548](captures/T5-ouverture-375x548.png)) ; iPhone ([1](captures/iphone-AC8-1-champ-adresse.png), [2](captures/iphone-AC8-2-suggestions.png), [3](captures/iphone-AC8-3-nom-ajouter.png)).
- **Le risque de la montagne**, à rejuger : [risque-demo.md](risque-demo.md) (villes du risque, grandes villes classées, 10 premières à « 10 km », avec ton jugement de la tâche 0 à côté).

## Décisions prises à ta place
| Décision | Coût si c'est faux |
|---|---|
| Source de la montagne = **Cerema** (tu m'as demandé de trancher) | Morvan hors montagne, Yonne à 150-200 km ; passer à l'autre source ≈ 1 h |
| Distance à la montagne **tronquée** au centième (tu as dit « deux décimales ») : le km affiché est toujours celui de la distance mesurée | aucun visible ; arrondir laisserait 145 communes 1 km trop loin |
| Une commune hors zone vaut au moins 0,01 km (sinon Raon-lès-Leau, mairie à 24 m, se lirait « Commune de montagne ») | aucun visible |
| Communes « en partie » du Cerema sans plan détaillé (143, 9 départements) : toute la commune compte | leurs voisines un peu trop près (Grenoble « moins d'1 km » en dépend) |
| Communes rétablies en 2025 : elles héritent du classement (4 communes du Cantal) | 4 communes « Commune de montagne » à tort |
| « Proximité avec la nature » sans titre visible, comme le prototype F (nom lu par les lecteurs d'écran) | un sous-titre à ajouter, ≈ 20 px |
| Mer et montagne au clavier : une tabulation par groupe, flèches pour changer (motif « boutons radio ») | flèches au lieu de Tab |
| Messages de la liste inchangés (D8) : ils ne citent ni la montagne ni le type | « Fixe un loyer ou une distance à la mer… » alors que la montagne peut aussi classer |
| Vérification de bout en bout, étape 2, jouée à 1 350 € (Chamonix) | — (tu l'as validé : critère reformulé) |
| Moyenne des notes ramenée au milliardième avant l'arrondi (sinon 28,5 tombait à 28) | aucun, critères verts |
| Règle Paris-Lyon-Marseille pour le prix tous biens posée, jamais appliquée (aucun arrondissement concerné) | aucun aujourd'hui |

## Relectures
- **Code contre spec** ([review-spec.md](review-spec.md)) : 0 Bloquant, 3 Majeurs, 6 Mineurs. Suite relancée par le relecteur : verte.
  - Majeur 1, **double arrondi de la montagne** (Clermont à 3 km au lieu de 2,47 ; 22 communes écartées à tort) → **corrigé** ([corrections-1.md](taches/corrections-1.md)) : Clermont à 2 km, 8 945 communes à « 10 km » comme en tâche 0.
  - Majeur 2, **« Chamonix passe à 10 km »** faux au prix de départ → ta décision : critère reformulé « à 1 350 € » (à écrire dans la spec à l'acceptation).
  - Majeur 3, **cases de la mer : 149-164 ms** pour redessiner (cible 100 ms ; prix et montagne 115 ms) → ta décision : accepté pour l'instant, risque à écrire dans la spec.
  - Mineurs, laissés : tests de loyer-mer AC-1, AC-2, AC-15 qui vérifient la couleur mais pas le score ; captures des tâches 1 à 3 prises quelques minutes avant le commit qu'elles prouvent ; quelques fichiers hors des listes des tâches (contenu conforme) ; composant `Toggle` du design plus utilisé (reste sur la page démo) et code mort lu seulement par des tests ; spec d'immobilier fausse sur « maisons 1 → 0 » (Île-de-Sein reste sans prix) ; deux défauts plus anciens : rang « 7724e » sans espace, mention « OpenStreetMap » absente du pied de page alors que CLAUDE.md la cite (les proches utilisent l'IGN depuis, la ligne de CLAUDE.md est peut-être périmée).
- **Navigateur** ([qa.md](qa.md)) : 0 Bloquant, 0 Majeur, 3 Mineurs sans défaut réel — **passe partielle** (voir « Non vérifié »).
- **Instabilité des tests** : sur 7 suites complètes ce soir, 3 ont eu 3 à 6 échecs « carte pas prête » ou de navigation, tous verts en relance seuls (×3). Deux venaient de la machine saturée ; un à charge normale (proches, immobilier). À regarder à la rétro.

## Non vérifié
- **Par un œil neuf, à l'écran** : l'aspect face au prototype F, le clavier complet dans « Cadre de vie », le résumé replié, les fiches de Chamonix, d'une commune écartée par le type et de Desvres. Le navigateur du testeur a perdu la carte (WebGL). Ces points sont couverts par des tests automatiques et par les captures des builders, mais **personne d'autre que les builders ne les a regardés** : à toi de les voir en l'essayant.
- Deux erreurs de console vues par le testeur (une 401, une 404, sans effet visible), non identifiées.
- La version en ligne : à `/ship` (avec la non-indexation d'`achat.json`, jamais vérifiée en ligne).
- Le défilement des types au doigt sur un vrai téléphone.

## Au passage
- **La distance à la mer a le même défaut résiduel** que la montagne avant correction : 181 communes affichées 1 km trop loin (arrondie au centième au lieu d'être tronquée). Hors de la demande, non corrigé ; même traitement possible (≈ 15 min).
- « Trajets indisponibles depuis Nantes (44) » sur ton iPhone : l'IGN était lent ce soir (23 s pour la seule zone de 3 h), et le site abandonne à 45 s pour les 12 zones (H21 de proches). Hors de cette tranche ; à garder en tête.
- `communes.json` a pris ≈ 130 Ko compressés (gzip) depuis le début de la tranche, au-delà des 100 Ko que le plan voulait signaler.

## Coût
Durée : 13:56 → ≈ 23:15 (dont ≈ 1 h de machine saturée). Agents : 6 builders de tâche (T0 à T5 : 29, 17, 34, 51, 48, 32 min ; 207, 198, 324, 381, 238, 287 k jetons), 1 de simplification (9 min, 104 k), 1 de corrections (15 min, 145 k), 2 relecteurs (code : 10 min, 209 k ; navigateur : 5 min, 85 k, chacun relancé une fois). Détours : 12 échecs au départ (ancien serveur sur le port 4173) ; 3 suites instables ; builders qui ont modifié des tests par script en tâches 2, 3 et 5 (vérifié conforme) ; 1 correction après relecture.

## Vérification finale
2026-10-15 23:06, relancée par l'orchestrateur sur `af8678c` (charge 4) : **Vitest 200 / 200**, **Playwright 294 verts, 35 sautés** (3 critères reportés de proches, et des tests propres à une largeur), 0 échec ; `typecheck`, `check-tokens`, `build` verts.
