# Progression — proches
Début : 2026-10-13 13:55 · Plan : plan.md · Suite au départ : 48 tests unitaires et 55 Playwright verts (2 sautés), check-tokens vert
## Tâches
Tâche 0 : faite — commit 564af4b — preuve : mesure-tache-0.md, captures/T0-* (14:18) ; téléphone de Vincent 14,9 s, 12/12 (≈ 15:00) — ≈ 48 min — agent : 215 k jetons — rapport : taches/T0.md — condition d'arrêt atteinte (6 h : 60 s, zones perdues) → Vincent : 3 h au plus (spec D15, D16)
Tâche 1 : faite — commits c6590e0..6106ed5 — preuve : captures/T1-* (≈ 15:05), suite revérifiée (48 unitaires, 61 navigateur, 2 sautés déjà existants) — ≈ 12 min — agent : 104 k jetons — rapport : taches/T1.md

Tâche 2a : faite — commits 00d96df..6d1b1bb — preuve : captures/T2a-preuve-ign-nantes.txt (La Rochelle 2 h 15, Bordeaux plus de 3 h, 14,5 s), T2a-preuve-ign-toulouse-commune.txt (≈ 15:20) ; suite revérifiée (75 unitaires, 69 navigateur) — ≈ 13 min — agent : 176 k jetons — rapport : taches/T2a.md — hors liste : classer.worker.ts, tests/e2e/proches-temps.spec.ts (expliqués)

Tâche 2b : faite — commits 45c01a2..fb75eee — preuve : captures/T2b-*.png, T2b-preuve-ign.txt (Parents de Léa 10,9 s, Toulouse commune 29,6 s, nom jamais envoyé, adresse de la page inchangée) (≈ 15:40) ; suite revérifiée (75 unitaires, 83 navigateur) — ≈ 20 min — agent : 300 k jetons — rapport : taches/T2b.md — AC-1, AC-2, AC-4, AC-6 — hors liste : src/ui/Settings.tsx (panneau défilant, compte collé ; expliqué)

Tâche 3 : faite — commits 5701053..6f5a906 — preuve : captures/T3-*.png, T3-preuve-ign.txt (5 proches réels, 464 693 caractères, réouverture : 0 recherche, 0 zone) (≈ 16:10) ; suite revérifiée (82 unitaires, 111 navigateur) — ≈ 22 min — agent : 239 k jetons — rapport : taches/T3.md — AC-7 à AC-11 — hors liste : src/App.tsx, tests/e2e/lib/proches.ts (expliqués)

Tâche 4 : faite — commits aae103d..bd732c0 — preuve : captures/T4-*.png, T4-preuve-ign.txt (La Rochelle passe, « Parents de Léa : 2 h 15 », pastille « 2 h 15 » ; Bordeaux « plus de 3 h ») (≈ 16:50) ; suite revérifiée (82 unitaires, 129 navigateur) — ≈ 30 min — agent : 293 k jetons — rapport : taches/T4.md — AC-3, AC-5, AC-14, AC-16 — hors liste : tests/e2e/proches-carte.spec.ts, src/index.css, src/theme/tokens.ts, docs/design/system/README.md (expliqués) — AC-14 et AC-16 : « dans la liste » → « sur la carte » (Grandeville ne passe pas à 2 h ; erreur du recalage D15, corrigée avec l'accord de Vincent)

Tâche 5 : faite — commits 1cd955b..f9fd140 — preuve : captures/T5-bureau-*.png, T5-390-*.png, T5-preuve-*.txt, T5-*-requetes-etape1.txt (bout en bout sur la version construite en local, vrai IGN, profil neuf : 9,4 s bureau, 11,8 s à 390 px ; La Rochelle 2 h 15 ; Bordeaux plus de 3 h ; réouverture sans calcul ; effacer) (≈ 17:50) ; suite revérifiée (82 unitaires, 141 navigateur) — ≈ 44 min — agent : 231 k jetons — rapport : taches/T5.md — hors liste : src/theme/tokens.ts, docs/design/system/README.md, src/map/MapView.tsx (option sansZoom) — essai téléphone : à faire avec Vincent

Correctif clavier iPhone : fait — commits 11c6bc5..0c352c2 — suite revérifiée (82 unitaires, 147 navigateur, --workers=2) — rapport : taches/fix-clavier-iphone.md — **essai de Vincent sur iPhone (18:05 puis ≈ 18:45) : le champ disparaît toujours sous le clavier** → choix de Vincent : on laisse, l'interface téléphone sera retravaillée plus tard (défaut connu, reporté). Le correctif est gardé (ne casse rien, retire « AutoFill Contact »).

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
- T3 : mémoire en `localStorage`, une clé par proche (`carte-ou-vivre:proche:<n>`), JSON avec temps en base64 et empreinte.
- T3 : un proche en attente ou en calcul est aussi gardé ; fermé à ce moment, il revient indisponible avec « Réessayer ».
- T3 : proches gardés affichés dès l'ouverture, curseurs bloqués pendant le chargement.
- T3 : message « mémoire refusée » gardé jusqu'à la fermeture de la page ; les écritures suivantes sont tentées.
- T3 : délai de 45 s posé par la file, il couvre aussi le classement ; « Réessayer » repart de zéro.
- T3 : résumé replié « 5 · 1 en calcul, 1 indisponible » (une seule « · », puis des virgules ; « en attente » compté à part).
- T3 : doublon : les champs gardent l'adresse et le nom ; « Réessayer » a pour nom accessible « Réessayer <nom> ».
- T3 : focus après « Retirer » / « Effacer » : lien « + Ajouter un proche » ou champ. **Défaut connu : après l'ajout du 5ᵉ proche, le focus est perdu** (pour les relecteurs).
- T4 : étiquette d'un repère = second marqueur au-dessus de toutes les gouttes ; goutte au-dessus des ronds du top 10 ; étiquette à gauche si elle recouvre celle d'un proche ajouté avant (recalculé à chaque zoom).
- T4 : le petit repère de chaque pastille suit l'état du proche (« … », « ! ») ; Figma 22:640 montre la maison partout.
- T4 : pastilles centrées sur la page, marges de la liste (352 px), à la ligne si besoin.
- T4 : « plus de 3 h en voiture » (fiche), « plus de 3 h · au-dessus de 2 h » (pastille) ; « TES PROCHES » dans tous les états de la fiche.
- T4 : repères cachés aux lecteurs d'écran (`aria-hidden`), la zone et les pastilles portent l'information.
- T4 : anneau de 40 % à 10 %, +15 % au milieu du cycle de 1,2 s ; fixe à 40 % en mouvement réduit.
- T4 : nouveaux jetons `taille-goutte` 26, `taille-goutte-haut` 34, `duree-pulse-ms` 1 200 (à reporter dans Figma) ; pied de page sur deux lignes à 1 440 px.
- T5 : quand la feuille monte (390 px), le champ se place sous la poignée, pas le titre « Tes proches » comme dans Figma 27:1160 (≈ 400 px au-dessus du clavier d'un iPhone). Coût : une ligne pour revenir au titre.
- T5 : nouveaux jetons `taille-bande-carte` 40 et `taille-saisie` 16 (texte des champs à 16 px pour que Safari n'agrandisse pas la page) ; à reporter dans Figma.
- T5 : focus gardé pendant l'appui sur une suggestion ou « Ajouter » ; bande de carte nue (sans zoom ni légende) pendant l'ajout.
- T5 : défaut de la tâche 3 corrigé : après le 5ᵉ proche, le focus va au message « 5 proches au maximum… ».
- T5 : limite connue : après « Effacer mes proches », la feuille monte aussi (sans clavier).
## Preuves
- T5 : captures/T5-bureau-1…4-*.png, T5-390-1…4-*.png, T5-preuve-bureau.txt, T5-preuve-390.txt, T5-*-requetes-etape1.txt, T5-npm-test.txt.
- T4 : captures/T4-deux-proches.png, T4-la-rochelle.png, T4-la-rochelle-passe.png, T4-bordeaux.png, T4-cinq-proches.png, T4-repere-zoom.png, T4-390-fiche.png, T4-preuve-ign.txt.
- T3 : captures/T3-vide.png, T3-aucune-adresse.png, T3-recherche-indisponible.png, T3-doublon.png, T3-calcul-et-attente.png, T3-indisponible.png, T3-plein-bureau.png, T3-plein-390.png, T3-repliee-*.png, T3-memoire-refusee.png, T3-ign-*.png, T3-preuve-ign.txt.
- T2b : captures/T2b-vide.png, T2b-suggestions.png, T2b-nom.png, T2b-calcul.png, T2b-pret-parents.png, T2b-toulouse-seule.png, T2b-deux-proches.png, T2b-390-proche.png, T2b-preuve-ign.txt.
- T2a : captures/T2a-preuve-ign-nantes.txt, T2a-preuve-ign-toulouse-commune.txt, T2a-file-avant-correction.txt, T2a-npm-test.txt.
- T1 : captures/T1-bureau-ouvertes.png, T1-bureau-repliees.png, T1-390-ouvertes.png, T1-390-repliees.png, T1-npm-test.txt.
- T0 : docs/plans/2026-10-13-proches/mesure-tache-0.md (Mac, navigateur, téléphone), captures/T0-zones-nantes.png (24 zones jusqu'à 6 h), captures/T0-sorties-brutes.txt.
## Coût

## Constats hors tâche (pour les relecteurs)
- Vu en tâche 1, existait avant : à 390 px avec la mer sur « Sans limite », le groupe de ronds « 1·2·…·10 » dépasse du bord droit de l'écran (captures/T1-390-ouvertes.png).
- Signalé en tâche 2b : vers 15:36, les curseurs Loyer et Mer de la fenêtre visible du navigateur de test ont bougé sans commande de l'agent (manipulation extérieure probable) ; aucune capture n'a été prise après.
- Signalé en tâche 3, pour Vincent : sur le vrai IGN, « La Rochelle » propose d'abord « la Rochelle, 35230 Orgères » (lieu-dit), pas la ville ; mettre les communes en tête des suggestions ?
- Signalé en tâche 4 : le test « H21 délai de 45 s » (proches-etats.spec.ts, tâche 3) est instable en parallèle (9 échecs sur 12 isolé, 1 dans une suite) — à corriger avant la démo.
- Capture de Vincent `captures/T5-iphone-vincent-bug-clavier.png` : contient une adresse personnelle (fiche contact) ; laissée hors de git, à Vincent de décider.
