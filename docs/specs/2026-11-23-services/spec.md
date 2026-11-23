# Services du quotidien
2026-11-23 · validée · révisée 2026-11-23 (D13 à D15) · Pour les agents : [détails](details.md) · [critères](acceptance.json) · [mesures](mesures.md) · [relecture](relecture.md)

**En une phrase** : on garde les communes où le médecin, les courses, la scolarité ou la gare sont à quelques minutes en voiture, et chaque fiche donne ces temps.
**Pourquoi** : les 3 testeurs réclament ces services sans relance.
**C'est réussi si** : en ligne, « Médecin à 10 min » garde Bordeaux et Mende ; « Gare régionale à 30 min » écarte Mende et la Corse ; la fiche d'Auch dit médecin 2 min, gare 4 min.

**Ce qu'on voit** : une catégorie « Services » (Médecin, Commerce alimentaire, Scolarité, Gare, 3 temps au choix) ; dans la fiche, 9 temps et leurs limites.

**Décisions à valider**
- **D1** — *Révisée par D13.* Six services : médecin généraliste, commerce alimentaire (épicerie comprise), école (maternelle comprise), collège, crèche, gare. *Pourquoi* : Vincent, d'après les testeurs. *Écarté* : supermarché seul ; pharmacie.
- **D2** — Donnée : temps en voiture de l'Insee vers l'équipement le plus proche, tous les 200 m habités (2025). *Pourquoi* : 34 736 communes sur 34 746. *Écarté* : vol d'oiseau.
- **D3** — Temps d'une commune : la moitié des habitants y est en ce temps ou moins. *Pourquoi* : peu déformé par les hameaux. *Écarté* : moyenne ; mairie.
- **D4** — Filtre seul : le classement ne change pas. *Pourquoi* : Vincent, comme l'emploi. *Écarté* : noter.
- **D5** — *Révisée par D15.* « Une gare » ou « Une grande gare » (100 000 voyageurs par an ou plus). *Pourquoi* : Mende, gare à 3 min, grande gare à 92. *Écarté* : un niveau.
- **D6** — Sans chiffre, la commune reste et la fiche le dit, sauf D7. *Pourquoi* : absente du fichier ne veut pas dire absente. *Écarté* : tout écarter.
- **D7** — *Complétée par D15.* Écartés du filtre : les 6 communes sans habitant, la gare des 16 îles sans pont, la grande gare en Corse. *Pourquoi* : Vincent ; sinon des villages détruits montent en tête. *Écarté* : aucune exception.
- **D8** — La fiche montre toujours tous les temps (9 depuis D15) ; au-delà de 60 min, « plus d'une heure ». *Pourquoi* : juger une ville sans filtre. *Écarté* : bloc repliable ; chiffre exact.
- **D9** — Une île sans pont porte une phrase : un temps peut compter la traversée, sans l'attente. *Pourquoi* : l'Insee ne la compte que parfois. *Écarté* : rien dire.
- **D10** — Les limites (voiture seulement, sans embouteillages, généralistes libéraux, crèches CAF) sont dans la fiche. *Pourquoi* : panneau léger. *Écarté* : sous les réglages.
- **D11** — Un outil (DuckDB) lit une fois les 14 Go à distance et écrit un petit fichier ; le reste est en Python. *Pourquoi* : 11 Go libres. *Écarté* : installation durable.
- **D12** — Un temps prouvé faux par une autre source devient « pas de chiffre », preuve écrite. *Pourquoi* : dire moins plutôt que faux. *Écarté* : garder la valeur.
- **D13** — Remplace les lignes École, Collège et Crèche de D1 : une ligne « Scolarité », avec Crèche, École, Collège et Lycée (général, technologique ou professionnel) cumulables et un seul temps, 5, 10 ou 20 min ; chaque niveau coché doit y être. *Pourquoi* : Vincent ; moins de réglages, plusieurs âges possibles. *Écarté* : une ligne par niveau ; un seul niveau.
- **D14** — Les temps se chargent juste après l'affichage de la carte ; seul un lien qui filtre déjà sur un service les attend. *Pourquoi* : Vincent ; le chargement est la seule gêne remontée. *Écarté* : tout charger ensemble (environ 0,3 s de plus en 4G).
- **D15** — Remplace « Une grande gare » de D5 : trois niveaux, « Gare », « Régionale » (100 000 voyageurs par an ou plus, nationales comprises), « Nationale » (250 000 ou plus, lignes nationales ou internationales). La Corse n'a ni l'une ni l'autre (D7). La fiche dit que ces niveaux n'indiquent pas la présence d'un TGV. *Pourquoi* : Vincent. Limite acceptée : Les Sables-d'Olonne, desservie en TGV, est à 82 min d'une « nationale ». *Écarté* : deux niveaux ; « Une gare fréquentée ».

**Pas maintenant** : note de proximité, transports en commun, disponibilité des médecins, pharmacie, urgences.
**Hypothèses** : H151 à H168 dans [détails](details.md#hypothèses).
**Taille** : 7 règles (environ 15 comportements, au-dessus du cadre perso), 15 critères, ~6 tâches ; passe par /ui.
**Le risque** : un temps faux sur une commune connue. Tâche 0 : Auch, Le Havre, Les Sables-d'Olonne, Mende, Chamonix, Saint-Véran et 4 extrêmes (D12) ; faux = du mauvais côté d'une pastille ; 2 communes ordinaires fausses → retour à Vincent. Aussi : le poids ajouté au chargement (H162).
**Questions ouvertes** : aucune.
