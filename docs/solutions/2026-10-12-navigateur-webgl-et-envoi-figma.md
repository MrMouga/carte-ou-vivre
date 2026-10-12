# Captures de carte : le navigateur de test peut perdre WebGL, et l'envoi d'images vers Figma est interdit par le projet
Étiquettes : outil, figma · Tranche : loyer-mer · Source : session /ui du 2026-10-12

**Problème** — Poser des captures du prototype MapLibre dans les écrans Figma.
**Symptômes** — Après un `studio-browse stop` puis un redémarrage, la carte ne s'affiche plus : « Could not create a WebGL context » (SwiftShader), alors que les cinq premières captures avaient marché. `curl -F` vers l'adresse d'envoi de `upload_assets` est refusé deux fois, même après l'accord de Vincent : `.claude/settings.json` interdit `curl * -F *`. Un `sips -Z 720 … --out .` a écrasé les captures d'origine.
**Ce qui n'a pas marché** — Relancer le navigateur ; relancer l'envoi après l'accord oral (une interdiction écrite ne se lève pas par un « oui »).
**Ce qui a marché** — Garder les captures à mi-résolution comme image de référence ; copier les captures dans `docs/design/<tranche>/directions/` et laisser Vincent les poser à la main dans Figma ; ajouter au prototype des paramètres de capture (`?nu=1`, `?choix=<INSEE>`, `?fond=uni`) puisque `studio-browse` refuse `js`.
**Prévention** — Prendre toutes les captures WebGL d'une traite, sans arrêter le navigateur. Aperçus réduits toujours dans un autre dossier. Pour poser des images dans Figma, prévoir l'étape manuelle de Vincent, ou une exception étroite dans les réglages, décidée par lui. À signaler à studio (ai-workflow) : navigateur et WebGL ; exception d'envoi vers Figma.
