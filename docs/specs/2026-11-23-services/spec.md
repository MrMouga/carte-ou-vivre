# Services du quotidien
2026-11-23 · validée · Pour les agents : [détails](details.md) · [critères](acceptance.json) · [mesures](mesures.md) · [relecture](relecture.md)

**En une phrase** : on garde les communes où le médecin, les courses, l'école, le collège, la crèche ou la gare sont à quelques minutes en voiture, et chaque fiche donne ces temps.
**Pourquoi** : les 3 testeurs réclament ces services sans relance.
**C'est réussi si** : en ligne, « Médecin à 10 min » garde Bordeaux et Mende ; « Une grande gare à 30 min » écarte Mende et la Corse ; la fiche d'Auch dit médecin 2 min, gare 4 min.

**Ce qu'on voit** : une catégorie « Services » (6 services, 3 temps au choix) ; dans la fiche, 7 temps et leurs limites.

**Décisions à valider**
- **D1** — Six services : médecin généraliste, commerce alimentaire (épicerie comprise), école (maternelle comprise), collège, crèche, gare. *Pourquoi* : Vincent, d'après les testeurs. *Écarté* : supermarché seul ; pharmacie.
- **D2** — Donnée : temps en voiture de l'Insee vers l'équipement le plus proche, tous les 200 m habités (2025). *Pourquoi* : 34 736 communes sur 34 746. *Écarté* : vol d'oiseau.
- **D3** — Temps d'une commune : la moitié des habitants y est en ce temps ou moins. *Pourquoi* : peu déformé par les hameaux. *Écarté* : moyenne ; mairie.
- **D4** — Filtre seul : le classement ne change pas. *Pourquoi* : Vincent, comme l'emploi. *Écarté* : noter.
- **D5** — « Une gare » ou « Une grande gare » (100 000 voyageurs par an ou plus). *Pourquoi* : Mende, gare à 3 min, grande gare à 92. *Écarté* : un niveau.
- **D6** — Sans chiffre, la commune reste et la fiche le dit, sauf D7. *Pourquoi* : absente du fichier ne veut pas dire absente. *Écarté* : tout écarter.
- **D7** — Écartés du filtre : les 6 communes sans habitant, la gare des 16 îles sans pont, la grande gare en Corse. *Pourquoi* : Vincent ; sinon des villages détruits montent en tête. *Écarté* : aucune exception.
- **D8** — La fiche montre toujours les 7 temps ; au-delà de 60 min, « plus d'une heure ». *Pourquoi* : juger une ville sans filtre. *Écarté* : bloc repliable ; chiffre exact.
- **D9** — Une île sans pont porte une phrase : un temps peut compter la traversée, sans l'attente. *Pourquoi* : l'Insee ne la compte que parfois. *Écarté* : rien dire.
- **D10** — Les limites (voiture sans embouteillages, généralistes libéraux, crèches CAF) sont dans la fiche. *Pourquoi* : panneau léger. *Écarté* : sous les réglages.
- **D11** — Un outil (DuckDB) lit une fois les 14 Go à distance et écrit un petit fichier ; le reste est en Python. *Pourquoi* : 11 Go libres. *Écarté* : installation durable.
- **D12** — Un temps prouvé faux par une autre source devient « pas de chiffre », preuve écrite. *Pourquoi* : dire moins plutôt que faux. *Écarté* : garder la valeur.

**Pas maintenant** : note de proximité, transports en commun, disponibilité des médecins, pharmacie, lycée, urgences.
**Hypothèses** : H151 à H166 dans [détails](details.md#hypothèses).
**Taille** : 6 règles (environ 13 comportements, au-dessus du cadre perso), 13 critères, ~6 tâches ; passe par /ui.
**Le risque** : un temps faux sur une commune connue. Tâche 0 : Auch, Le Havre, Les Sables-d'Olonne, Mende, Chamonix, Saint-Véran et 4 extrêmes (D12) ; faux = du mauvais côté d'une pastille ; 2 communes ordinaires fausses → retour à Vincent. Aussi : 266 Ko de plus au chargement.
**Questions ouvertes** : aucune.
