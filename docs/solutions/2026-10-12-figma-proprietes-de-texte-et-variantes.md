# Figma par MCP : une propriété de texte est commune à toutes les variantes, et un clone de variante perd ses liens
Étiquettes : figma, design · Tranche : loyer-mer · Source : session /ui du 2026-10-12

**Problème** — Construire des composants à variantes (Fiche : Passe / Ne passe pas / Sans plafond ; Curseur à plusieurs positions) avec `use_figma`.
**Symptômes** — Changer le nom de commune dans une variante l'a changé dans les trois (la fiche « passe » affichait Bordeaux avec un score). Les variantes ajoutées par `clone()` affichaient les textes par défaut : leurs exemplaires ignoraient `setProperties`. Déplacer la poignée d'un curseur dans un exemplaire échoue en silence. Une ombre avec étalement (`spread`) ne s'affiche pas.
**Ce qui n'a pas marché** — Écrire les textes propres à chaque cas dans les variantes maîtres ; régler `x` d'un calque dans un exemplaire ; faire l'anneau de focus avec deux ombres à étalement.
**Ce qui a marché** — Garder des valeurs par défaut neutres et régler chaque cas sur les **exemplaires** (`setProperties`) ; défaire le lien (`componentPropertyReferences = {}`) quand une variante doit avoir son propre texte (« Sans limite ») ; après un `clone()` de variante, **relier à nouveau** chaque texte à sa propriété ; ce qui doit bouger (poignée) devient un axe de variante (« Position ») ; focus = contour (`strokeAlign: OUTSIDE`).
**Prévention** — Après toute création ou duplication de variantes : un exemplaire de test avec `setProperties`, puis une capture, avant de construire les écrans.
