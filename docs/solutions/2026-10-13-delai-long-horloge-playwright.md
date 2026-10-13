# Pour tester un délai de 45 s dans la page, poser l'horloge simulée de Playwright avant l'ouverture et compter depuis l'instant où chaque minuterie a été posée
Étiquettes : tests, outil · Tranche : proches · Source : tâche 3 de /build proches, `tests/e2e/proches-etats.spec.ts` (test « H21 délai de 45 s… »)

**Problème** — Prouver qu'un proche passe indisponible 45 s après le début de SON calcul (H21), et qu'un proche en attente ne compte pas le temps passé à attendre, sans attendre 90 s réelles.
**Symptômes** — Premier essai rouge : le second proche passait indisponible à « 44 s » de son calcul. Il avait commencé à 45 s (l'instant où la minuterie du premier s'est déclenchée), pas à 46 s (là où le test avait avancé l'horloge) : avancer de 44 s menait pile à son échéance.
**Ce qui n'a pas marché** — Compter les pas d'horloge depuis le dernier `runFor` plutôt que depuis le départ réel de la minuterie.
**Ce qui a marché** — `page.clock.install()` avant `page.goto` (MapLibre se charge et la carte devient prête : le temps simulé avance seul), faux service qui ne répond pas (délai côté Node, hors de l'horloge de la page), puis `runFor(44 000)` → encore en calcul, `runFor(2 000)` → indisponible ; pour le second, `runFor(43 000)` puis `runFor(2 000)`. 2,4 s réelles par largeur. Le test est rouge sur l'ancien code (pas de délai), vert sur le nouveau.
**Prévention** — Règle de jugement : dans un test d'horloge, écrire en commentaire l'heure simulée à chaque étape (« on est à 46 s ») et viser une marge d'au moins 1 s de chaque côté d'une échéance.
