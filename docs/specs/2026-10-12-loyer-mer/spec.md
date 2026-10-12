# Loyer et mer
2026-10-12 · validée · Pour les agents : [détails](details.md) · [critères](acceptance.json)

**En une phrase** : on fixe un loyer maximum et une distance maximum à la mer ; la carte des 675 aires se colore aussitôt et montre les 10 meilleures.
**Pourquoi** : on choisit sa ville avec des anecdotes, et les comparateurs partent d'un nom de ville. Ici, tout le pays d'un coup. Les proches arrivent en tranche 2.
**C'est réussi si** : en ligne, avec 1 200 € et 60 km, Bordeaux affiche 832 € pour 52 m² et 40 km de la mer, et La Rochelle 1 km. Le loyer à 800 € grise Bordeaux sans attente, et l'adresse de la page rouvre la même carte ailleurs.

**Ce qu'on voit** : la carte des aires, deux réglages, la liste des 10 premières, la fiche de l'aire choisie.

**Décisions à valider**
- **D1** — Tranche 1 : loyer + mer, aucun service extérieur. *Pourquoi* : choix de Vincent, poser la base sans serveur. *Écarté* : commencer par les proches (ORS dès le départ).
- **D2** — Les chiffres d'une aire sont ceux de sa commune-centre ; pour Paris, Lyon et Marseille, la moyenne simple de leurs arrondissements. *Pourquoi* : c'est la ville qu'on visiterait ; le même point servira aux trajets. *Écarté* : la moyenne de l'aire.
- **D3** — Un plafond par critère (ou « sans limite »), sans poids. *Pourquoi* : choix de Vincent, pour la lisibilité. *Écarté* : importance seule ; importance + plafond. Claude s'y opposait (les poids sont dans la Solution et la Différence) : critique gardée en hypothèse dans STATE.md.
- **D4** — Note d'un critère = 100 × (1 − valeur / plafond) ; score = moyenne des notes des critères actifs. *Pourquoi* : sans poids, la marge sous les plafonds permet de classer. Effet : à 60 km, les villes côtières ont ~98 en mer, le loyer départage. *Écarté* : dedans / dehors.
- **D5** — 5 couleurs par tranches absolues de score ; au-dessus d'un plafond, gris avec la raison ; sans aucun plafond, une couleur neutre et pas de score. *Pourquoi* : une carte pâle dit honnêtement que rien ne colle. *Écarté* : le classement relatif (le meilleur cinquième toujours en couleur forte).
- **D6** — La liste des 10 premières est dans cette tranche. *Pourquoi* : choix de Vincent ; c'est « ce qu'on va visiter », et l'accès au clavier. *Écarté* : plus tard.
- **D7** — L'adresse de la page garde les plafonds, pas l'aire choisie. *Pourquoi* : base du lien partagé ; la liste montre déjà la tête. *Écarté* : l'aire dans l'adresse (tranche 2, avec « Copier le lien »).
- **D8** — La mer est une distance à vol d'oiseau, écrite comme telle. *Pourquoi* : un temps jusqu'à la côte serait un second calcul d'itinéraire. *Écarté* : « à X minutes de la mer ».
- **D9** — Pas de fond de carte : seulement les formes des aires et des communes hors aire. *Pourquoi* : un fond en tuiles serait un service extérieur (D1). *Écarté* : un fond OpenStreetMap.

**Pas maintenant** : proches, montagne, emploi, achat, poids, fiabilité du loyer, recherche par nom, bouton « Copier le lien », image à partager.
**Hypothèses** : 9 choix par défaut (plafonds de départ, pas, arrondis…) dans [détails](details.md#hypothèses).
**Le risque** : sans proches ni poids, ça ressemble à villeideale.fr ; ça ne vaut que si la tranche 2 suit vite (test : spécifiée avant la mise en ligne). En tâche 0 de /breakdown : si plus de la moitié des villes-centres n'ont que le loyer d'un groupe de communes, retour à Vincent.
**Questions ouvertes** : aucune.
