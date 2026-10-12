# Socle Vite + MapLibre 6 : donner le worker à MapLibre, contourner le bug npm des pairs, installer le crochet git par copie
Étiquettes : build, outil · Tranche : loyer-mer · Source : /build tâche 0a du 2026-10-12

**Problème** — Monter le socle Vite 8 + React 19 + MapLibre 6.12 + Vitest 5 + Playwright, avec un crochet gitleaks.
**Symptômes** — (1) `npm install` : « Cannot read properties of null (reading 'edgesOut') » (npm 10.9.4, pendant la résolution des pairs optionnels de vitest). (2) En dev puis sur la version construite : « Worker failed to load » ; la carte se peint quand même, d'où un test vert qui ne voyait rien tant qu'il ne refusait pas toute erreur console. (3) `git config core.hooksPath` refusé par le hook studio.
**Ce qui n'a pas marché** — Installer en deux commandes, puis en une seule ; `optimizeDeps.exclude: ['maplibre-gl']` (répare le dev, pas la version construite).
**Ce qui a marché** — (1) `legacy-peer-deps=true` dans `.npmrc`, en listant tous les pairs utiles à la main. (2) MapLibre 6 calcule l'adresse de son worker par `import.meta.url` : `setWorkerUrl()` avec `import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'` et `worker: { format: 'es' }` dans Vite (`src/map/maplibre.ts`). (3) Crochet copié dans `.git/hooks/`, source versionnée dans `scripts/hooks/`.
**Prévention** — Le test de fumée d'une carte échoue sur **toute** erreur console, et il passe une fois sur `vite preview` (la version construite), pas seulement sur le serveur de dev. Importer MapLibre uniquement via `src/map/maplibre.ts`.
