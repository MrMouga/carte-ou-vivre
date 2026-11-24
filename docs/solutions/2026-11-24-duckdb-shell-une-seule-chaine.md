# DuckDB CLI : écrire la commande de `.shell` en une seule chaîne entre guillemets, et vérifier sa sortie une fois
Étiquettes : outil, data · Tranche : services · Source : tâche 0a de /build services, `docs/plans/2026-11-24-services/taches/T0a.md`

**Problème** — `scripts/data/services-extrait.sql` doit s'arrêter s'il reste moins de 6 Go libres avant chaque région ; DuckDB n'a pas de fonction pour la place libre, d'où `.shell` qui écrit la sortie de `df -k` dans un fichier relu en SQL.
**Symptômes** — Avec `.shell df -k data-raw | tail -1 | …`, df reçoit `|` comme argument (« df: |: No such file or directory ») : pas de shell. Avec `.shell sh -c "df -k data-raw | awk …"`, le tube marche mais `-k data-raw` est perdu : df liste tous les disques en blocs de 512 octets, et le contrôle lit 46,9 « Gio » libres pour 23 réels (seuil réel de 3 Gio au lieu de 6). Rien ne l'a signalé : la valeur était plausible.
**Ce qui n'a pas marché** — Copier la forme d'un script shell ; `sh -c "…"` (DuckDB retire les guillemets et recolle les mots).
**Ce qui a marché** — `.shell "df -k data-raw | awk 'NR==2 {print $4}' > fichier"` : une seule chaîne, passée telle quelle au shell. Vu en comparant la valeur relue à `df -k` lancé à la main.
**Prévention** — Règle de jugement : toute valeur produite par une commande lancée depuis un autre outil (`.shell`, `subprocess`) se compare une fois à la même commande lancée à la main avant de servir de contrôle.
