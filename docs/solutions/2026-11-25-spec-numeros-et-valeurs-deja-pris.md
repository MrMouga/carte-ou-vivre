# Une nouvelle spec : prendre ses numéros (H-n) et ses valeurs de fixture dans les fichiers, pas dans l'index
Étiquettes : spec, tests · Tranche : recherche-et-mer · Source : /spec recherche-et-mer, relecture de la spec

**Problème** — Les hypothèses de la tranche ont été numérotées à partir de H173, d'après l'index des specs, qui ne montre que le début de chaque liste. Les temps de mer de la fixture (`mer_min`) ont été inventés alors que la fixture de proches les portait déjà pour les mêmes communes.
**Symptômes** — Le relecteur a trouvé H173 à H176 déjà pris dans services (ajoutées à sa démo du 2026-11-24, après sa spec), et deux fixtures qui donnaient deux temps différents à Terrebasse (160 et 165) et à Quaibleu (14 et rien).
**Ce qui n'a pas marché** — Lire `docs/specs/INDEX.md` pour trouver le dernier numéro : l'index tronque les listes, et une révision de démo ajoute des numéros en fin de fichier.
**Ce qui a marché** — Renuméroter à partir de H177 et reprendre les `mer_min` de la fixture de proches. Seule commune sans temps : Rhinval, qui n'est pas dans la fixture de proches.
**Prévention** — Pour /spec : avant de numéroter, `grep -ohE '\*\*[RH][0-9]+\*\*' docs/specs/*/details.md | sort -V | tail` ; avant d'inventer une valeur de fixture, `grep -rn '<nom du champ>' docs/specs/*/acceptance.json` pour voir si une tranche, même reportée, la porte déjà.
