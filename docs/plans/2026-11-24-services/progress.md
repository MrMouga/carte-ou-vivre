# Progression — services
Début : 2026-11-24 12:17 · Plan : plan.md · Suite au départ : Vitest 365 / 365 verts ; jetons sans valeur arbitraire ; Playwright 417 verts, 5 rouges, 44 sautés (12,4 min, lancée pendant l'extraction de la tâche 0a : machine chargée). Rouges au départ, sur `main` sans changement : proches-mobile:23 [bureau], proches-fiables:610 et :669 [mobile], proches-temps:53 et :61 [mobile] — relancés seuls trois fois le 2026-11-24 après la tâche 0a : 14 / 14 verts à chaque fois (deux largeurs) ; instables sous charge, pas cassés (leçon 2026-10-15 sur la suite instable)

## Tâches
Tâche 0a : faite — commits 033b44e..8a68df9 — preuve : mesure-tache-0.md (sorties des contrôles de sources.py et gares.py) ; vérifié par l'orchestrateur le 2026-11-24 13:05 (gares.py relancé : 61 gares, 103 110 trajets, `services-gares.csv` identique, sha256 9bb7b098… ; Bordeaux 228 782 habitants dans l'extrait ; Vitest 365/365, types verts) — 32 min — agent : 252 k jetons — rapport : taches/T0a.md
Tâche 0b : faite — commits 0c2427e..bd342a3 — preuve : mesure-tache-0.md (partie 0b), captures/T0b-sortie-services.txt, captures/T0b-relecture-5-communes.txt ; vérifié par l'orchestrateur le 2026-11-24 13:20 (services.py relancé : tous les contrôles « ok », AC-13 exact, `services.json` identique (sha256 b89a46e4…), 304 116 octets en gzip -9 ; Vitest 369/369) — 13 min — agent : 213 k jetons — rapport : taches/T0b.md — AC-5, AC-13, AC-16 passent

## Décisions prises à la place de Vincent
- T0a (décidé par le constructeur, vérifié par l'orchestrateur) : l'extrait garde une ligne par (commune, IRIS, carreau), colonne `iris` en plus. Le fichier Insee découpe 63 459 carreaux en parts par IRIS, à additionner : regrouper par (commune, carreau) comme l'écrivait le plan aurait perdu 12 % de la population (55,1 au lieu de 62,9 millions ; Bordeaux 168 664 au lieu de 228 782). L'essai de /spec additionnait déjà ces parts. Coût si faux : médianes calculées sur une population gonflée dans les carreaux à cheval ; sans effet visible sur AC-13 (contrôlé en 0b).
- T0b (constructeur, vérifié) : la lettre de 60 min est `y`, pas `Y` comme l'écrivait le plan — le plan se contredisait (« rang n = n minutes » met `y` au rang 60) ; la règle du rang est suivie, testée par un aller-retour. Erreur du plan, corrigée par l'exécution. Coût si faux : aucun (lecture et écriture partagent `src/domain/services.ts`).
- T0b (constructeur, vérifié) : durées lues en centièmes de minute et populations en entiers (pas de virgule flottante), pour que l'égalité exacte de la médiane (H157) et l'arrondi « moitié vers le haut » (H156) ne dépendent pas d'erreurs d'arrondi.
- T0b (constructeur) : pour les îles, seule « Gare grandes lignes » est vidée dans le fichier (R52) ; Île-de-Bréhat garde « Gare » à 9 min dans le fichier, et la page dira « aucune sur l'île » (R54). Conforme à la spec.

## Retours à traiter à la démo

## Preuves

## Coût
