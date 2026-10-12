# Avec des styles de texte nommés (`text-pastille`), configurer tailwind-merge, sinon il efface la taille ou la couleur
Étiquettes : build, design · Tranche : loyer-mer · Source : /build tâche 0b du 2026-10-12

**Problème** — Composants shadcn rethémés avec nos jetons : styles de texte `text-<style>` (taille, interligne, graisse) et couleurs `text-<couleur>`, assemblés par `cn()` (clsx + tailwind-merge).
**Symptômes** — Tests verts, `check-tokens` vert, mais sur la capture le bouton « Réessayer » et les pastilles sont à 16 px au lieu de 15 et 13. tailwind-merge range `text-pastille` et `text-foreground` dans le même groupe (couleur) et ne garde que la dernière classe.
**Ce qui n'a pas marché** — Rien d'autre essayé : vu sur la première capture.
**Ce qui a marché** — `extendTailwindMerge({ extend: { classGroups: { 'font-size': [{ text: Object.keys(text) }] } } })` dans `src/lib/cn.ts`, avec les noms lus dans `tokens.ts`.
**Prévention** — Tout nouveau groupe de jetons dont le préfixe Tailwind est partagé (`text-`, `shadow-`, `rounded-`) se déclare dans `cn.ts`. Toujours regarder la capture d'un composant, même quand les tests sont verts.
