# Progression — services
Début : 2026-11-24 12:17 · Plan : plan.md · Suite au départ : Vitest 365 / 365 verts ; jetons sans valeur arbitraire ; Playwright 417 verts, 5 rouges, 44 sautés (12,4 min, lancée pendant l'extraction de la tâche 0a : machine chargée). Rouges au départ, sur `main` sans changement : proches-mobile:23 [bureau], proches-fiables:610 et :669 [mobile], proches-temps:53 et :61 [mobile] — à relancer seuls trois fois après la tâche 0a (leçon 2026-10-15 sur la suite instable)

## Tâches
Tâche 0a : faite — commits 033b44e..8a68df9 — preuve : mesure-tache-0.md (sorties des contrôles de sources.py et gares.py) ; vérifié par l'orchestrateur le 2026-11-24 13:05 (gares.py relancé : 61 gares, 103 110 trajets, `services-gares.csv` identique, sha256 9bb7b098… ; Bordeaux 228 782 habitants dans l'extrait ; Vitest 365/365, types verts) — 32 min — agent : 252 k jetons — rapport : taches/T0a.md

## Décisions prises à la place de Vincent
- T0a (décidé par le constructeur, vérifié par l'orchestrateur) : l'extrait garde une ligne par (commune, IRIS, carreau), colonne `iris` en plus. Le fichier Insee découpe 63 459 carreaux en parts par IRIS, à additionner : regrouper par (commune, carreau) comme l'écrivait le plan aurait perdu 12 % de la population (55,1 au lieu de 62,9 millions ; Bordeaux 168 664 au lieu de 228 782). L'essai de /spec additionnait déjà ces parts. Coût si faux : médianes calculées sur une population gonflée dans les carreaux à cheval ; sans effet visible sur AC-13 (contrôlé en 0b).

## Retours à traiter à la démo

## Preuves

## Coût
