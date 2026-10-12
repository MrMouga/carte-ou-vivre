# Progression — loyer-mer
Début : 2026-10-12 21:40 · Plan : plan.md · Suite au départ : 0 tests, 0 verts (projet pas encore initialisé)
## Tâches
- Tâche 0a : faite — commits 7bb31e2..(commit gitleaks) — preuve : captures/0a-test-webgl.txt, captures/0a-versions.txt, captures/0a-gitleaks-refus.txt (2026-10-12 21:41) — ~35 min (dont 2 questions à Vincent)
## Décisions prises à la place de Vincent
- Décision : `legacy-peer-deps=true` dans `.npmrc` — npm 10.9 plante (« edgesOut ») sur les dépendances pairs optionnelles de vitest ; tous les pairs utiles sont listés à la main — coût si faux : un pair manquant passerait inaperçu à l'installation (il casserait le build ou les tests, donc visible).
- Décision : le crochet gitleaks est copié dans `.git/hooks/` (non versionné) et sa source versionnée dans `scripts/hooks/` — le hook studio interdit `core.hooksPath` — coût si faux : un clone neuf n'a pas le crochet tant qu'on n'a pas fait la copie (ligne dans CLAUDE.md).
- Décision : worker MapLibre donné explicitement (`setWorkerUrl` + import `?worker&url`, `src/map/maplibre.ts`) — sans ça, la version construite ne charge pas le worker (vu en test sur `vite preview`) — coût si faux : aucun, à retirer si MapLibre corrige.
- Accord de Vincent (2026-10-12) : il a accepté la licence Xcode pour débloquer Homebrew ; gitleaks 8.30.1 installé par brew.
- Accord de Vincent (2026-10-12, question pendant la tâche 0a) : paquets de types @types/react, @types/react-dom, @types/node ajoutés aux dépendances de développement (React ne fournit pas ses types).
## Preuves
- 0a — suite verte : 1 test Playwright (pixel du fond uni peint par WebGL, aucune erreur console), en dev et sur la version construite (`vite preview`) : captures/0a-test-webgl.txt · versions et dates : captures/0a-versions.txt · gitleaks refuse un faux jeton GitHub (exit 1, aucun commit) : captures/0a-gitleaks-refus.txt
## Coût
