# Recherche et mer en minutes
2026-11-25 · validée · amendée le 2026-11-25 par /ui (D5 révisée : minutes seulement, D9) · Pour les agents : [détails](details.md) · [critères](acceptance.json) · [relecture](relecture.md)

**En une phrase** : on tape le nom ou le code postal d'une commune pour la voir sur la carte ; la mer se règle et s'affiche en minutes de voiture, à la place des km.
**Pourquoi** : chercher « Auch » à l'œil parmi 34 746 communes est long ; « la mer à moins d'une heure » se dit en temps (D9 de proches, reportée en octobre).
**C'est réussi si** : en ligne, « Auch » puis « 33000 » ouvrent les fiches d'Auch et de Bordeaux, carte cadrée dessus ; « Mer à moins de 30 min » écarte Bordeaux et garde Caen ; la fiche de Bordeaux dit son temps en voiture (relevé en tâche 0), sans km.

**Décisions à valider**
- **D1** — Recherche et mer en minutes ; le train des proches est la tranche suivante. *Pourquoi* : Vincent. *Écarté* : les trois ensemble (10 à 12 tâches).
- **D2** — Recherche par nom ou par code postal. Un code complet montre toutes ses communes (liste qui défile). Codes : La Poste (Licence Ouverte). *Pourquoi* : Vincent. *Écarté* : le nom seul ; 8 puis « N autres ».
- **D3** — La recherche reste dans les données du site : rien de ce qu'on tape ne part ailleurs. Choisir une commune = la choisir dans la liste (carte cadrée, fiche ouverte). *Pourquoi* : rapide, sans fuite de saisie. *Écarté* : la recherche d'adresse de l'IGN.
- **D4** — Mer en minutes : temps en voiture de la mairie au point de côte des km, le plus proche à vol d'oiseau (détour d'estuaire compris), calculé une fois avec openrouteservice. *Pourquoi* : Vincent ; cohérent avec les km. *Écarté* : une plage ; l'itinéraire de l'IGN (34 746 requêtes une à une).
- **D5** — *Révisée par Vincent le 2026-11-25, en /ui, après essai des pistes :* la mer ne se règle et ne s'affiche plus qu'en minutes, partout (réglage, liste, raisons, fiche) ; plus de bascule, plus de km de mer à l'écran. *Pourquoi* : Vincent. *Écarté* : la bascule km / min sur km au départ (D5 d'origine) ; les km gardés dans la fiche. *Risque* : si la tâche 0 juge les minutes peu crédibles, il n'y a plus les km pour se replier : retour à Vincent. *Coût* : 58 critères de 7 tranches passées lisent la mer en km ([liste](criteres-a-recaler.md)) ; leur recalage est une tâche de /breakdown, chaque réécriture avec l'accord de Vincent.
- **D6** — En minutes, la mer filtre et note comme le faisaient les km, sur 15, 30, 60 ou 90 min. *Pourquoi* : Vincent ; une seule logique. *Écarté* : 15 / 30 / 45 / 60 ; 20 / 40 / 60 / 90.
- **D7** — Sans temps, une commune est comptée d'après ses km (1 km = 1 min, comme le repli des proches), et la fiche le dit. *Pourquoi* : Vincent ; ne rien écarter à tort. *Écarté* : « inconnu, ne passe pas ».
- **D8** — Un temps prouvé faux par un itinéraire en ligne est retiré (la commune passe « sans temps »), preuve écrite. *Pourquoi* : Vincent, comme D12 de services ; dire moins plutôt que faux. *Écarté* : le garder.
- **D9** — *Ajoutée par Vincent le 2026-11-25, en /ui :* un ancien lien qui règle la mer en km (`mer=`) est ignoré : la mer y vaut Peu importe et `mer` disparaît de l'adresse réécrite ; les minutes s'écrivent `mer-min=`. *Pourquoi* : Vincent. *Écarté* : garder la position du choix (10 km → 15 min…) ; lire le nombre comme des minutes.

**Pas maintenant** : le train des proches, la montagne en minutes, les plages, le partage, la recherche d'adresse, les anciennes communes.
**Hypothèses** : H177 à H196 dans [détails](details.md#hypothèses).
**Taille** : 6 règles (environ 16 comportements, au-dessus du cadre perso), 13 critères, ~6 tâches (dont le recalage des 58 critères passés, D5 révisée) ; passe par /ui.
**Le risque** : des minutes peu crédibles (estuaire, port, côte sans route). Tâche 0 : 10 villes connues et les 5 plus grands écarts minutes / km, confrontés à un itinéraire en ligne (D8). Aussi : envois openrouteservice (lancés par Vincent), poids (H195).
**Questions ouvertes** : aucune.
