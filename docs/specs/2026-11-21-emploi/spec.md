# Emploi
2026-11-21 · validée · révisée 2026-11-22 (D15) · Pour les agents : [détails](details.md) · [critères](acceptance.json) · [recherche](../../research/2026-11-21-emploi/synthesis.md) · [relecture](relecture.md)

**En une phrase** : on indique son métier, et celui de son conjoint, et la carte ne garde que les communes proches d'un bassin d'emploi où ce métier recrute beaucoup ; la fiche dit aussi le chômage du coin.
**Pourquoi** : les 3 testeurs demandent l'emploi sans relance, au sens « trouver du travail dans mon métier ».
**C'est réussi si** : en ligne, « Infirmiers et sages-femmes » à « Le plus » (10 %) garde Bordeaux et Pau ; La Rochelle sort, sa fiche dit « le plus proche : La Roche-sur-Yon, 61 km » ; en ajoutant les ingénieurs en informatique à « 10 % », Pau sort (Bayonne, 92 km).

**Ce qu'on voit** : une catégorie « Emploi » (champ « Ton métier » qui propose, 3 niveaux, un second métier possible, une phrase sur l'État) ; dans la fiche, une ligne par métier et le chômage de la zone.

**Décisions à valider**
- **D1** — Jusqu'à deux métiers ; une commune passe si elle tient les deux. *Pourquoi* : Vincent, un couple. *Écarté* : un seul ; l'un ou l'autre.
- **D2** — Donnée : projets de recrutement prévus en 2026, par métier (217) et bassin d'emploi (389), enquête de France Travail. *Pourquoi* : seule source ouverte qui croise métier et territoire (P-1, confiance moyenne). *Écarté* : chômage seul ; effectifs par secteur.
- **D3** — Niveaux par métier, bassins classés par nombre de projets : « 10 % », « 25 % » (ceux qui recrutent le plus), « Partout où il recrute » (tout bassin chiffré) ; rien = peu importe (affichage révisé par D15 : « Le plus » · « Beaucoup » · « Partout »). *Pourquoi* : Vincent ; un étalon propre à chaque métier. *Écarté* : seuil en projets ; projets par habitant ; part « difficile » ; déciles ; 50 % ; 5 %.
- **D4** — Une commune passe si la ville principale (la plus peuplée) d'un bassin du niveau choisi est à 30 km ou moins à vol d'oiseau, le sien ou un voisin. *Pourquoi* : Vincent ; on vit près de son travail, les bassins sont administratifs. *Écarté* : appartenir au bassin ; distance réglable ; temps en voiture.
- **D5** — Filtre seul : le classement ne change pas. *Pourquoi* : Vincent. *Écarté* : noter la proximité.
- **D6** — On écrit « recrutements prévus en 2026 », « recrute » ; jamais « offres », « facilité », « tu trouveras ». *Pourquoi* : un sondage d'intentions (P-2). *Écarté* : « facilité à trouver un emploi ».
- **D7** — Un bassin sans chiffre (caché ou absent) ne compte pas ; la fiche dit « pas de chiffre publié ». *Pourquoi* : « absent » n'est pas défini par le producteur (P-3). *Écarté* : l'écrire zéro.
- **D8** — Chômage de la zone d'emploi Insee dans chaque fiche, sans filtrer. *Pourquoi* : Vincent à l'entretien de la spec, à la place du « chômage pour les bassins sans chiffre » choisi après la recherche, devenu inutile avec D4. *Écarté* : un filtre ; combler les trous du métier.
- **D9** — Métiers et niveaux dans l'adresse de la page. *Pourquoi* : Vincent, le conjoint ouvre la même carte. *Écarté* : gardés dans le navigateur. Coût accepté : le lien dit vos métiers.
- **D10** — Un champ qui propose parmi les 217 libellés et des mots courants (« développeur ») ; forme en /ui. *Pourquoi* : 217, trop pour une liste (P-4). *Écarté* : liste déroulante ; 8 familles ; les 81 groupes.
- **D11** — La part des projets jugés difficiles par les employeurs n'est pas affichée. *Pourquoi* : Vincent ; elle se lit à l'envers. *Écarté* : l'afficher.
- **D12** — Rien n'est dit quand deux niveaux gardent les mêmes bassins (métier rare). *Pourquoi* : Vincent. *Écarté* : une phrase sous les pastilles.
- **D13** — Sous le champ, toujours : les emplois de l'État ne sont pas dans l'enquête. *Pourquoi* : Vincent ; un enseignant du public verrait une carte presque vide (P-6). *Écarté* : la FAQ seule ; rien.
- **D14** — Un métier chiffré dans moins de 130 bassins de métropole porte, sous son libellé, un avertissement : la carte en oublie sûrement. *Pourquoi* : Vincent, le 2026-11-21 à /breakdown, après la mesure du risque : 96 métiers sur 217 sont dans ce cas, dont l'ingénieur HSE d'un testeur (46 bassins ; Dunkerque, Fos, Lacq absents du fichier). *Écarté* : continuer sans rien dire ; revoir D2 et D3 (nouvelle /spec, le 6 décembre manqué) ; mettre l'emploi en pause.
- **D15** — Les niveaux de D3 s'affichent, du plus large au plus étroit, « Partout » · « Beaucoup » · « Le plus » sous « Où ce métier recrute » (mêmes niveaux, même adresse ; la fiche garde « parmi les 10 % de bassins… »). *Pourquoi* : Vincent, sur son iPhone à la démo du 2026-11-22 : « les étiquettes 10 % 25 % partout où il recrute ne sont pas claires ». *Écarté* : « 10 % » · « 25 % » · « Partout où il recrute » ; « Volume d'offres : Élevé / Modéré / Faible » (« offres » contredit D6) ; « Un peu » à la place de « Partout ».

**Pas maintenant** : distance réglable, temps en voiture, note, plus de deux métiers, intitulés plus fins.
**Hypothèses** : H128 à H146 dans [détails](details.md#hypothèses).
**Taille** : 7 règles, 14 critères, ~6 tâches ; passe par /ui.
**Le risque** : une carte jugée fausse sur un métier connu : saisonniers comptés, un métier de cadre chiffré dans un tiers des bassins. Test : Vincent donne les métiers de ses 3 testeurs avant la tâche 0 ; l'un d'eux chiffré dans moins de 130 bassins → arrêt et retour à Vincent. Démo : Vincent juge 3 métiers dans 5 bassins connus ; deux faux → retour sur D3. *Mesuré le 2026-11-21 (/breakdown)* : business developer et prospecteur éolien → « Cadres commerciaux, acheteurs et cadres de la mercatique » (162 bassins) ; ingénieur gestion des risques en industrie → « Ingénieurs et cadres techniques HSE » (46 bassins) : arrêt, tranché par D14. Le jugement des 3 métiers dans 5 bassins se fait aussi en fin de tâche 0 (choix de Vincent).
**Questions ouvertes** : aucune.
