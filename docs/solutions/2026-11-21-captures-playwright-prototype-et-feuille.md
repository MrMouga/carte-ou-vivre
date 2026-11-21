# Captures de pistes /ui : un script Playwright plutôt que studio-browse, et une fenêtre haute pour un élément de la feuille
Étiquettes : design, outil · Tranche : emploi · Source : session /ui du 2026-11-21

**Problème** — Capturer trois pistes dans six états (taper, choisir une suggestion, cocher), à 390 px et en bureau, carte comprise.
**Symptômes** — À 390 px, la capture d'un élément de la feuille (`locator.screenshot`) est coupée en bas : la feuille fait 45 % de la hauteur et défile, la partie cachée sort en fond beige.
**Ce qui n'a pas marché** — Capturer l'élément dans la fenêtre de 390 × 844.
**Ce qui a marché** — Un script Node hors du dépôt qui charge `playwright` du projet (`createRequire` sur `package.json`) et lance Chromium avec `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader` : la carte MapLibre s'affiche sans écran, contrairement à studio-browse. Pour l'élément seul, agrandir la fenêtre à 390 × 2400 le temps de la capture (`setViewportSize`), puis revenir ; écarter la souris (`mouse.move(0, 0)`) pour ne pas capturer un survol. Le même script rejoue les états pour chaque `?variant=` et lit `document.activeElement` (le focus perdu après un choix s'y voit). Captures réduites (`sips -Z 900`) avant le commit.
**Prévention** — Règle de jugement : pour plus de deux pistes ou d'états, écrire le script de captures d'abord.
