# Une spec qui écrit des distances dans la fixture : regarder d'abord où les tests posent les points des communes
Étiquettes : spec, tests · Tranche : emploi · Source : /spec emploi, relecture de la spec

**Problème** — La spec emploi a écrit des distances entre communes de la fixture « 6 communes » (Portmer à 25 km de Grandeville…) à partir de positions planes cohérentes entre elles, en supposant que la tâche 0 placerait les points des mairies.
**Symptômes** — Le relecteur a montré que les tests posent le point de chaque commune au centre de son carré (`tests/e2e/lib/carte.ts`), sur une grille d'environ 111 km : aucune des distances écrites n'était atteignable sans déplacer des points ou des carrés lus par des tests protégés (ronds, clics, km des proches).
**Ce qui n'a pas marché** — Recalculer les distances pour qu'elles soient cohérentes entre elles : cohérentes, oui, mais incompatibles avec la géométrie déjà fixée par les tranches précédentes.
**Ce qui a marché** — Donner les distances comme données de la fixture (elles ne se déduisent pas des points), garder les points et les carrés tels quels, et laisser /breakdown décider comment les vraies distances sont servies (H144 d'emploi).
**Prévention** — Pour /spec : avant d'écrire une valeur géométrique dans une fixture partagée (distance, voisinage, point), lire où les tests posent les formes et les points (`tests/e2e/lib/carte.ts`, fixtures `tests/fixtures/`), et soit partir de ces positions, soit fournir la valeur comme donnée.
