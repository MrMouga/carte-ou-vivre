# Attendre une machine calme avant une suite Playwright : lire la charge sur 5 minutes, et `vm.loadavg` commence par une accolade
Étiquettes : tests, outil · Tranche : services (révision D19, D20) · Source : /build du 2026-11-26-27, `docs/plans/2026-11-26-services-revision/progress.md`

**Problème** — La machine de Vincent était saturée la nuit (charge 77 à 167 : machine virtuelle, indexation `hybridsearchd`, sauvegarde Backblaze). Les suites Playwright y échouaient par délais dépassés (34 rouges de `services.spec.ts` en 5 h pour la simplification), sans rien de cassé.
**Symptômes** — Une boucle d'attente « charge < 12 puis suite » est partie alors que la charge moyenne sur 5 minutes était encore à 57 : 1 rouge de plus, et une suite à refaire.
**Ce qui n'a pas marché** — `sysctl -n vm.loadavg | awk '{print int($2)}'` : la sortie est `{ 10.83 56.79 49.99 }`, donc `$1` est l'accolade et `$2` la charge sur **1 minute**, qui descend en creux passagers.
**Ce qui a marché** — Lire `$3` (5 minutes) pour décider ; relancer seuls, trois fois, les rouges isolés hors de la tranche (leçon du 2026-10-15) ; regarder `ps -Ao pcpu,etime,command -r` pour nommer ce qui charge la machine et le dire à Vincent (c'est sa machine : ne rien arrêter soi-même).
**Prévention** — Jugement : avant une suite longue, `sysctl -n vm.loadavg` et attendre `$3` sous 12 ; si la charge vient d'autres programmes, le dire à Vincent avec leur nom plutôt que d'enchaîner les suites rouges.
