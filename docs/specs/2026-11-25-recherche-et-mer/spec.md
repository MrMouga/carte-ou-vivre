# Recherche et mer en minutes
2026-11-25 · validée · Pour les agents : [détails](details.md) · [critères](acceptance.json) · [relecture](relecture.md)

**En une phrase** : on tape le nom ou le code postal d'une commune pour la voir sur la carte ; la mer se règle aussi en minutes de voiture.
**Pourquoi** : chercher « Auch » à l'œil parmi 34 746 communes est long ; « la mer à moins d'une heure » se dit en temps (D9 de proches, reportée en octobre).
**C'est réussi si** : en ligne, « Auch » puis « 33000 » ouvrent les fiches d'Auch et de Bordeaux, carte cadrée dessus ; « Mer à moins de 30 min » écarte Bordeaux et garde Caen ; la fiche de Bordeaux dit 39 km et son temps en voiture (relevé en tâche 0).

**Décisions à valider**
- **D1** — Recherche et mer en minutes ; le train des proches est la tranche suivante. *Pourquoi* : Vincent. *Écarté* : les trois ensemble (10 à 12 tâches).
- **D2** — Recherche par nom ou par code postal. Un code complet montre toutes ses communes (liste qui défile). Codes : La Poste (Licence Ouverte). *Pourquoi* : Vincent. *Écarté* : le nom seul ; 8 puis « N autres ».
- **D3** — La recherche reste dans les données du site : rien de ce qu'on tape ne part ailleurs. Choisir une commune = la choisir dans la liste (carte cadrée, fiche ouverte). *Pourquoi* : rapide, sans fuite de saisie. *Écarté* : la recherche d'adresse de l'IGN.
- **D4** — Mer en minutes : temps en voiture de la mairie au point de côte des km, le plus proche à vol d'oiseau (détour d'estuaire compris), calculé une fois avec openrouteservice. *Pourquoi* : Vincent ; cohérent avec les km. *Écarté* : une plage ; l'itinéraire de l'IGN (34 746 requêtes une à une).
- **D5** — Bascule km / min, sur km au départ ; les liens existants ne changent pas ; la fiche montre les deux. *Pourquoi* : Vincent. *Écarté* : les minutes seules ; les minutes au départ.
- **D6** — En minutes, la mer filtre et note comme en km, sur 15, 30, 60 ou 90 min. *Pourquoi* : Vincent ; une seule logique. *Écarté* : 15 / 30 / 45 / 60 ; 20 / 40 / 60 / 90.
- **D7** — Sans temps, une commune est comptée d'après ses km (1 km = 1 min, comme le repli des proches), et la fiche le dit. *Pourquoi* : Vincent ; ne rien écarter à tort. *Écarté* : « inconnu, ne passe pas ».
- **D8** — Un temps prouvé faux par un itinéraire en ligne est retiré (la commune passe « sans temps »), preuve écrite. *Pourquoi* : Vincent, comme D12 de services ; dire moins plutôt que faux. *Écarté* : le garder.

**Pas maintenant** : le train des proches, la montagne en minutes, les plages, le partage, la recherche d'adresse, les anciennes communes.
**Hypothèses** : H177 à H196 dans [détails](details.md#hypothèses).
**Taille** : 6 règles (environ 16 comportements, au-dessus du cadre perso), 13 critères, ~5 tâches ; passe par /ui.
**Le risque** : des minutes peu crédibles (estuaire, port, côte sans route). Tâche 0 : 10 villes connues et les 5 plus grands écarts minutes / km, confrontés à un itinéraire en ligne (D8). Aussi : envois openrouteservice (lancés par Vincent), poids (H195).
**Questions ouvertes** : aucune.
