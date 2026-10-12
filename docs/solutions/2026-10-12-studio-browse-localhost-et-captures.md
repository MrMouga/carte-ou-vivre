# Avec studio-browse, viser « localhost » et enregistrer les captures sous /private/tmp
Étiquettes : outil, design · Tranche : loyer-mer · Source : session /ui du 2026-10-12

**Problème** — Prendre les captures des prototypes servis en local (python -m http.server).
**Symptômes** — `goto http://127.0.0.1:8765` : ERR_CONNECTION_TIMED_OUT, alors que curl répond 200. Puis `screenshot <chemin du repo>` : « Path must be within: /private/tmp, <dossier de départ du serveur> ».
**Ce qui n'a pas marché** — 127.0.0.1 ; écrire la capture directement dans docs/design/.
**Ce qui a marché** — `http://localhost:8765`, captures dans le scratchpad sous /private/tmp, puis `cp` vers docs/design/<tranche>/directions/. Pour une page lourde (35 000 communes), attendre que l'état JS soit prêt (`js "typeof S!=='undefined'&&S.res"`) au lieu de `wait --networkidle`, et éviter tout calcul de plusieurs secondes au chargement : le navigateur sans écran redémarre.
**Prévention** — Règle de jugement ; signalé à studio (retours.md).
