---
paths: ["src/**/*.tsx", "src/**/*.jsx", "src/**/*.vue", "src/**/*.svelte", "src/**/*.css"]
---
# Interface
- Accessibilité de base (WCAG 2.2 AA), sauf exception écrite dans `details.md` : contraste 4,5:1 (texte) et 3:1 (composants) ; tout au clavier, focus visible ; cibles ≥ 24×24 px ; messages d'état annoncés ; la couleur n'est jamais le seul indice ; tout ce qui se glisse se fait aussi d'un clic.
- Jetons du design system seulement (pas de couleur, d'espacement ou de taille en dur) ; chaque écran a ses états : idéal, vide, chargement, erreur.
