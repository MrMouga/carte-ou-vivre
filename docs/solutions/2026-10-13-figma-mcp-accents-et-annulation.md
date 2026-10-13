# Figma par MCP : `query()` refuse les accents, un script en erreur est annulé en entier, et une position dans un exemplaire ne se règle pas
Étiquettes : figma, outil · Tranche : proches · Source : session /ui du 2026-10-13

**Problème** — Construire des composants et des écrans avec `use_figma` dans un fichier aux calques nommés en français.
**Symptômes** — `node.query('TEXT[name=Résumé]')` : « Invalid selector: unexpected character (0xc3) ». Après l'erreur, rien de ce que le script avait créé n'existait : la relecture « ce qui précède est créé » était fausse. Déplacer la poignée d'un curseur dans un exemplaire (`x = …`) : « This property cannot be overridden in an instance: relative-transform ». Un nom de propriété deviné (`Nom#18:147`) : « Could not find a component property ».
**Ce qui n'a pas marché** — Corriger « seulement la fin » après une erreur, en supposant le début écrit ; deviner les clés de propriétés.
**Ce qui a marché** — `findOne(n => n.name === 'Résumé')` pour tout nom accentué ; après une erreur, relire le canevas (ou relancer le script entier, idempotent) ; lire les clés avec `Object.keys(set.componentPropertyDefinitions).find(k => k.startsWith('Nom'))` ; ce qui doit bouger dans un exemplaire devient une variante ou reste tel quel.
**Prévention** — Règle de jugement pour /ui : jamais d'accent dans un sélecteur `query()` ; considérer qu'un `use_figma` en erreur n'a rien écrit ; ne jamais deviner une clé de propriété.
