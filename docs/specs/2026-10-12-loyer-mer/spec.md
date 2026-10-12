# Loyer et mer
2026-10-12 · validée · révisée 2026-10-12 (D10–D14) · Pour les agents : [détails](details.md) · [critères](acceptance.json)

**En une phrase** : on fixe un loyer maximum, une distance maximum à la mer et les tailles de ville voulues ; la carte des communes de métropole se colore aussitôt et montre les 10 meilleures.
**Pourquoi** : on choisit sa ville avec des anecdotes, et les comparateurs partent d'un nom de ville. Ici, tout le pays d'un coup. Les proches arrivent en tranche 2.
**C'est réussi si** : en ligne, avec 1 200 € et 60 km, Bordeaux affiche 832 € pour 52 m² et 40 km de la mer, et La Rochelle 1 km. Le loyer à 800 € grise Bordeaux sans attente, et l'adresse de la page rouvre la même carte ailleurs.

**Ce qu'on voit** : la carte des communes, trois réglages, la liste des 10 premières, la fiche de la commune choisie.

**Décisions à valider**
- **D1** — Tranche 1 : loyer + mer, aucun service extérieur. *Pourquoi* : choix de Vincent, poser la base sans serveur. *Écarté* : commencer par les proches (ORS dès le départ).
- **D2** — *Remplacée par D10.* Les chiffres d'une aire sont ceux de sa commune-centre.
- **D3** — Un plafond par critère (ou « sans limite »), sans poids. *Pourquoi* : choix de Vincent, pour la lisibilité. *Écarté* : importance seule ; importance + plafond. Claude s'y opposait (les poids sont dans la Solution et la Différence) : critique gardée en hypothèse dans STATE.md.
- **D4** — Note d'un critère = 100 × (1 − valeur / plafond) ; score = moyenne des notes des critères actifs. *Pourquoi* : sans poids, la marge sous les plafonds permet de classer. Effet : à 60 km, les villes côtières ont ~98 en mer, le loyer départage. *Écarté* : dedans / dehors.
- **D5** — 5 couleurs par tranches absolues de score ; au-dessus d'un plafond, gris avec la raison ; sans aucun plafond, une couleur neutre et pas de score. *Pourquoi* : une carte pâle dit honnêtement que rien ne colle. *Écarté* : le classement relatif (le meilleur cinquième toujours en couleur forte).
- **D6** — La liste des 10 premières est dans cette tranche. *Pourquoi* : choix de Vincent ; c'est « ce qu'on va visiter », et l'accès au clavier. *Écarté* : plus tard.
- **D7** — L'adresse de la page garde les réglages, pas la commune choisie. *Pourquoi* : base du lien partagé ; la liste montre déjà la tête. *Écarté* : la commune dans l'adresse (tranche 2, avec « Copier le lien »).
- **D8** — La mer est une distance à vol d'oiseau, écrite comme telle. *Pourquoi* : un temps jusqu'à la côte serait un second calcul d'itinéraire. *Écarté* : « à X minutes de la mer ».
- **D9** — Pas de fond de carte : seulement les formes des communes. *Pourquoi* : un fond en tuiles serait un service extérieur (D1). *Écarté* : un fond OpenStreetMap.
- **D10** — La carte colore les communes de métropole, chacune avec ses propres chiffres ; Paris, Lyon et Marseille d'un seul tenant (moyenne simple de leurs arrondissements). Remplace D2 et la décision « 675 aires » du 2026-10-11. *Pourquoi* : choix de Vincent au vu du prototype, les aires faisaient des zones trop grandes ; Ville de rêve montre une carte à la commune. *Écarté* : les 675 aires (moins visuelles). Coût accepté : carte plus lourde, loyers souvent estimés par secteur (D12), proches de la tranche 2 à recalculer (hypothèse « isochrone » dans STATE.md).
- **D11** — Réglage « taille de ville » en pastilles cumulables : Petite commune (< 10 000 habitants), Petite ville (10 000–49 999), Ville moyenne (50 000–199 999), Grande ville (200 000 et plus) ; aucune cochée = « Peu importe ». Une commune hors des tailles cochées est grisée, avec la raison. *Pourquoi* : choix de Vincent ; à la commune, la liste se remplirait de villages. *Écarté* : un seuil fixe (≥ 10 000) ; filtrer la liste seulement.
- **D12** — La fiche dit « Estimation du secteur (communes voisines) » quand la commune n'a pas d'estimation de loyer propre. *Pourquoi* : c'est le cas de 86 % des communes ; la carte paraît plus précise que la donnée. *Écarté* : ne rien dire.
- **D13** — La mer, les grands fleuves et les lacs en bleu, les pays voisins en ton de terre, d'après des formes fixes embarquées dans le site (Natural Earth, domaine public). Précise D9. *Pourquoi* : choix de Vincent, la carte « faisait vide » ; on reconnaît la France. *Écarté* : un fond en tuiles (service extérieur) ; le fond uni.
- **D14** — Choisir une commune, dans la liste ou sur la carte, zoome la carte sur elle ; « ← Les 10 premières » revient à la France entière. Remplace « la carte ne bouge pas ». *Pourquoi* : choix de Vincent ; à la commune, une ville choisie est un point à l'échelle du pays. *Écarté* : une carte fixe.

**Pas maintenant** : mer en temps de trajet en voiture (tranche 2, avec les proches), proches, montagne, emploi, achat, poids, recherche par nom, bouton « Copier le lien », image à partager.
**Hypothèses** : 9 choix par défaut (plafonds de départ, pas, arrondis…) dans [détails](details.md#hypothèses).
**Taille** : au-dessus du gabarit perso (3 réglages, 7 règles, 14 critères, ~8 tâches), par choix de Vincent.
**Le risque** : sans proches ni poids, ça ressemble à villeideale.fr ; ça ne vaut que si la tranche 2 suit vite. À mesurer en tâche 0 de /breakdown : la carte de ~35 000 communes réagit-elle en ≤ 100 ms et pèse-t-elle un poids raisonnable ; si non, retour à Vincent.
**Questions ouvertes** : aucune.
