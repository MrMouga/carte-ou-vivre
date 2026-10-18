# Mairies
2026-10-18 · validée · Pour les agents : [détails](details.md) · [critères](acceptance.json)

**En une phrase** : on peut ne garder que les communes dont la mairie élue en mars 2026 est d'un bord choisi, et chaque fiche dit la mairie de sa commune.
**Pourquoi** : la couleur de la mairie compte pour beaucoup ; aujourd'hui on la cherche commune par commune.
**C'est réussi si** : en ligne, loyer sur « Sans limite » et « Gauche » coché, Paris, Lyon et Marseille restent colorées, Bordeaux et Nice non, et leur fiche dit pourquoi ; avec « Sans étiquette » en plus, les villages reviennent.

**Ce qu'on voit** : une catégorie « Vie locale » sous « Cadre de vie », 7 pastilles ; une ligne « Mairie » dans chaque fiche. Rien de politique sur la carte.

**Décisions à valider**
- **D1** — Un filtre et une ligne de fiche, rien d'autre. *Pourquoi* : le plus petit morceau utile. *Écarté* : colorer la carte par bord ; un critère qui note.
- **D2** — Pastilles : les 6 blocs du ministère de l'Intérieur (circulaire du 2 février 2026) et « Sans étiquette ». *Pourquoi* : choix de Vincent ; regroupement officiel, validé par le Conseil d'État. *Écarté* : 5 familles à nous ; « Divers » fondu dans « Sans étiquette ». Coût accepté : LFI en « Extrême gauche », l'UDR de Ciotti en « Extrême droite ».
- **D3** — « Seulement ces mairies » : pastilles cumulables, aucune cochée = peu importe ; le filtre écarte sans noter. *Pourquoi* : choix de Vincent ; le geste de la taille et du type, on coche ce qu'on garde. *Écarté* : « éviter ces mairies » (Claude). Coût accepté : un bloc seul écarte plus de 90 % des communes, et le message « Relâche le loyer, la mer ou la taille. » ne cite pas la mairie (H119).
- **D4** — La mairie est la liste qui a le plus de sièges au conseil municipal, au second tour s'il y en a eu un, sinon au premier ; Paris, Lyon, Marseille : toute la ville. *Pourquoi* : c'est elle qui gouverne ; D10 de loyer-mer. *Écarté* : la liste en tête des voix ; les arrondissements.
- **D5** — Une commune sans résultat (presque toutes sans candidat ; nombre : AC-12) est écartée dès qu'une pastille est cochée. *Pourquoi* : choix de Vincent, pas de mairie élue. *Écarté* : la ranger avec « Sans étiquette ».
- **D6** — La fiche dit toujours la mairie : bloc, étiquette, nom de la liste ; pas de tête de liste. *Pourquoi* : choix de Vincent ; utile même sans filtrer, et le nom de la liste dit qui gouverne sans ajouter de nom de personne. *Écarté* : la tête de liste ; la ligne seulement si le filtre est actif. Coût accepté : les noms de liste sont écrits tels que publiés, souvent en majuscules, et beaucoup contiennent celui de la tête de liste (« … AVEC ERIC CIOTTI »).
- **D7** — Une nouvelle catégorie « Vie locale ». *Pourquoi* : choix de Vincent ; la politique n'est pas le cadre de vie. *Écarté* : un groupe dans « Cadre de vie ».
- **D8** — « Sans étiquette » veut dire : la liste n'a pas de nuance du ministère, qui n'en donne que dans les communes de 3 500 habitants et plus et les chefs-lieux d'arrondissement (31 508 communes, toutes sous 3 500 habitants, mesuré le 2026-10-18). La pastille dit « Sans étiquette », la fiche précise « (moins de 3 500 habitants) ». *Pourquoi* : choix de Vincent ; un village dont le maire est connu comme LR ne doit pas paraître « sans bord ». *Écarté* : « Non classée » ; « Moins de 3 500 hab. » (ressemble à une taille).

**Pas maintenant** : couleur sur la carte ; tête de liste, participation, scores, tour ; arrondissements ; élections précédentes ; recours et élections partielles.
**Hypothèses** : 15 choix par défaut (H108 à H122) dans [détails](details.md#hypothèses).
**Taille** : 6 règles, 12 critères, ~5 tâches ; passe par /ui (7 pastilles à 390 px).
**Le risque** : de la politique dans un outil lancé sur r/france ; un bloc faux sur une ville connue se verra tout de suite. Test : en tâche 0, les blocs sont lus dans l'annexe de la circulaire, jamais devinés ; à la démo, Vincent juge 10 villes connues.
**Questions ouvertes** : aucune.
