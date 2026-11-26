# Amender un `acceptance.json` validé : remplacer le texte, ne pas réécrire le fichier
Étiquettes : spec, tests, outil · Tranche : services (révision D19, D20) · Source : /spec du 2026-11-26

**Problème** — Pour recaler 4 critères et en ajouter 3, le fichier a été relu puis réécrit avec `json.dump(..., indent=2)`.
**Symptômes** — Diff de 416 lignes au lieu de ~70 : les items de la fixture, écrits sur une ligne, passaient sur plusieurs. Le crochet qui protège les critères et le relecteur auraient eu à lire tout le fichier pour trouver les vrais changements.
**Ce qui n'a pas marché** — Charger, modifier, réécrire le JSON.
**Ce qui a marché** — Repartir de `git show HEAD:<fichier>`, faire des remplacements de texte exacts (chacun vérifié présent une seule fois), ajouter les nouveaux critères au format existant, puis comparer `json.loads` du résultat au contenu voulu : diff de 72 lignes, contenu identique.
**Prévention** — Pour /spec (amendement) : modifier `acceptance.json` par remplacements de texte ; contrôler avec `git diff --stat` que le nombre de lignes changées ressemble au nombre de critères touchés. Aussi, pour un amendement qui ajoute une donnée : chercher avant la relecture ce que le script de données lit (extrait, table des retraits, valeurs de contrôle codées en dur) — le relecteur a trouvé l'extrait à relancer et la ligne de retrait devenue orpheline.

Revu le 2026-11-26 (relecture du plan) : réviser la fixture d'un `acceptance.json` rend rouges, dès le commit de la spec, les tests qui la lisent (ici 20 tests unitaires de services : `commerce` absent de la fixture). Le premier plan disait « `npm test` vert » en tâche 0, ce qui était impossible. Pour /breakdown après un amendement : lancer les tests qui importent l'`acceptance.json` amendé, noter la liste rouge de départ, et dire quelle tâche la remet au vert.
