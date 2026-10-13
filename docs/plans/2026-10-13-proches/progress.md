# Progression — proches
Début : 2026-10-13 13:55 · Plan : plan.md · Suite au départ : 48 tests unitaires et 55 Playwright verts (2 sautés), check-tokens vert
## Tâches
Tâche 0 : faite — commit 564af4b — preuve : mesure-tache-0.md, captures/T0-* (14:18) ; téléphone de Vincent 14,9 s, 12/12 (≈ 15:00) — ≈ 48 min — agent : 215 k jetons — rapport : taches/T0.md — condition d'arrêt atteinte (6 h : 60 s, zones perdues) → Vincent : 3 h au plus (spec D15, D16)
Tâche 1 : faite — commits c6590e0..6106ed5 — preuve : captures/T1-* (≈ 15:05), suite revérifiée (48 unitaires, 61 navigateur, 2 sautés déjà existants) — ≈ 12 min — agent : 104 k jetons — rapport : taches/T1.md

Tâche 2a : faite — commits 00d96df..6d1b1bb — preuve : captures/T2a-preuve-ign-nantes.txt (La Rochelle 2 h 15, Bordeaux plus de 3 h, 14,5 s), T2a-preuve-ign-toulouse-commune.txt (≈ 15:20) ; suite revérifiée (75 unitaires, 69 navigateur) — ≈ 13 min — agent : 176 k jetons — rapport : taches/T2a.md — hors liste : classer.worker.ts, tests/e2e/proches-temps.spec.ts (expliqués)

Tâche 2b : faite — commits 45c01a2..fb75eee — preuve : captures/T2b-*.png, T2b-preuve-ign.txt (Parents de Léa 10,9 s, Toulouse commune 29,6 s, nom jamais envoyé, adresse de la page inchangée) (≈ 15:40) ; suite revérifiée (75 unitaires, 83 navigateur) — ≈ 20 min — agent : 300 k jetons — rapport : taches/T2b.md — AC-1, AC-2, AC-4, AC-6 — hors liste : src/ui/Settings.tsx (panneau défilant, compte collé ; expliqué)

## Décisions prises à la place de Vincent
- T0 : recherche par `/geocodage/search` (rend le code INSEE) au lieu de `/completion` ; le faux service intercepte `search*`. Coût si faux : un aller-retour de plus par recherche (≈ 100–300 ms, 1,3 s mesuré sur le téléphone).
- T0 : file d'appels à 4 requêtes par seconde (à 5 pile, l'IGN refuse la 6e et bloque 5 s). Coût : ≈ 0,5 s de plus par proche.
- T0 : classement des mairies dans un Web Worker natif (40 ms, page fluide ; 106–115 ms figée sur le fil principal, processeur ×4).
- T0 : arrondissements de Paris, Lyon, Marseille ramenés à la ville entière ; outre-mer (97…) écarté de la recherche.
- T0 : un seul moteur d'isochrone utile, `bdtopo-valhalla` (`bdtopo-pgr` rend la même chose, `bdtopo-osrm` ne fait pas d'isochrone).
- T1 : tailles cochées écrites en toutes lettres (plusieurs lignes si besoin) ; titre repliable utilisable pendant le chargement ; ouverture sans animation ; chevron à `taille-echantillon` (14 px). Coût si faux : retouche de style.
- T2a : une zone ratée (429, 504, réseau) → tout le proche échoue, sans nouvel essai automatique. Coût si faux : « Réessayer » le proche entier (≈ 15 s).
- T2a : file comptée depuis le départ réel de la zone précédente (≥ 250 ms), commune à toute la page. Coût : 0,1–0,5 s de plus quand la page est occupée.
- T2a : temps d'un proche = tableau 16 bits dans l'ordre de `communes.json` (0 = plus de 3 h) ; `evaluer` reçoit `{ nom, plafond, temps }`.
- T2a : commune choisie seule → départ de sa mairie ; si absente de la carte, point rendu par l'IGN.
- T2a : faux service : code INSEE inventé « <dép.>999 » pour les adresses de la fixture.
- T2a : durées avec espaces insécables (H3). Avec le faux service, un proche dure ≈ 2,85 s (12 × 250 ms), pas ≈ 1 s : les tests de l'état prêt patientent ≈ 10 s.
- T2b : suggestions sur deux lignes tirées du libellé IGN (« 12 Rue de la Paix » / « 44000 Nantes ») ; commune : « Commune · départ de la mairie ».
- T2b : adresse sous le nom = libellé IGN tel quel, sans virgule (AC-14 attend « 1 rue Test 44000 Nantesville »).
- T2b : file un par un, « En attente… », échec → « Trajets indisponibles depuis X. » + « Retirer » (avance sur la tâche 3).
- T2b : panneau de bureau qui défile au-dessus de la légende, compte collé en bas, trait toujours visible (Figma : seulement quand il défile). Coût : un trait de plus.
- T2b : focus au champ « Nom » après une suggestion ; Entrée vaut « Ajouter » ; le panneau défile pour montrer les suggestions.
- T2b : icônes maison et lieu en SVG `currentColor`.
- T2b : mesure IGN réelle : la zone de 3 h depuis Toulouse a mis 29,5 s (sous les 45 s de H21) ; le cache du navigateur fausse les remesures (2,9 s).
## Preuves
- T2b : captures/T2b-vide.png, T2b-suggestions.png, T2b-nom.png, T2b-calcul.png, T2b-pret-parents.png, T2b-toulouse-seule.png, T2b-deux-proches.png, T2b-390-proche.png, T2b-preuve-ign.txt.
- T2a : captures/T2a-preuve-ign-nantes.txt, T2a-preuve-ign-toulouse-commune.txt, T2a-file-avant-correction.txt, T2a-npm-test.txt.
- T1 : captures/T1-bureau-ouvertes.png, T1-bureau-repliees.png, T1-390-ouvertes.png, T1-390-repliees.png, T1-npm-test.txt.
- T0 : docs/plans/2026-10-13-proches/mesure-tache-0.md (Mac, navigateur, téléphone), captures/T0-zones-nantes.png (24 zones jusqu'à 6 h), captures/T0-sorties-brutes.txt.
## Coût

## Constats hors tâche (pour les relecteurs)
- Vu en tâche 1, existait avant : à 390 px avec la mer sur « Sans limite », le groupe de ronds « 1·2·…·10 » dépasse du bord droit de l'écran (captures/T1-390-ouvertes.png).
- Signalé en tâche 2b : vers 15:36, les curseurs Loyer et Mer de la fenêtre visible du navigateur de test ont bougé sans commande de l'agent (manipulation extérieure probable) ; aucune capture n'a été prise après.
