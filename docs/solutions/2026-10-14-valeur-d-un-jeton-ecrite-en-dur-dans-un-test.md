# Changer la valeur d'un jeton : chercher aussi le nombre écrit en dur dans les tests, pas seulement les libellés
Étiquettes : tests, process, design · Tranche : immobilier · Source : /build immobilier, tâche 2 (question à Vincent)

**Problème** — D11 a porté le plancher de la feuille mobile (`taille-feuille-min`) de 272 à 338 px. Le plan listait les tests à adapter en cherchant les **libellés** lus par les tests protégés (leçon du 2026-10-14), pas les **nombres**.
**Symptômes** — `src/map/view.test.ts` (hors critère, tranche interface-telephone) écrivait `272 + space['space-4']` : 354 reçu, 288 attendu. La ligne d'au-dessus lisait déjà le jeton et passait. Le builder s'est arrêté avec une question, rien commité, une question de plus à Vincent.
**Ce qui n'a pas marché** — La liste « Demandera » du plan, faite sur les textes seulement.
**Ce qui a marché** — Lire le jeton dans le test (`size['taille-feuille-min'] + space['space-4']`), avec l'accord de Vincent : même vérification, ne recasse pas au prochain changement.
**Prévention** — Dans /breakdown, quand une tranche change la valeur d'un jeton : `grep -rn "<ancienne valeur>" src tests` et mettre chaque test trouvé dans la liste « Demandera ». Dans les tests, lire les jetons plutôt qu'écrire leur valeur.
