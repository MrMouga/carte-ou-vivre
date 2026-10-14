# Cadre de vie
2026-10-14 · validée · Pour les agents : [détails](details.md) · [critères](acceptance.json) · [recalage](recalage.md)

**En une phrase** : une section « Cadre de vie » réunit la taille de la commune, son type d'environnement, la distance à la mer et la distance à la montagne.
**Pourquoi** : on choisit souvent un cadre (la campagne, une ville moyenne, la montagne) avant une ville ; la carte ne connaît que la taille et la mer.
**C'est réussi si** : en ligne, à l'ouverture, seul le prix classe ; en « En montagne », Chamonix passe et la fiche de Bordeaux dit pourquoi elle ne passe pas ; en « Grand centre urbain », Bordeaux passe, Lacanau non ; un ancien lien `mer=60` s'ouvre sur 100 km.

**Ce qu'on voit** : la section « Cadre de vie », en pastilles, à la place de « Taille de ville » et « Mer » ; la fiche dit le type d'environnement et la montagne.

**Décisions à valider**
- **D1** — Tranche A : taille, type, mer, montagne ; forêt et lac en tranche B. *Pourquoi* : choix de Vincent, leurs données sont les plus lourdes. *Écarté* : tout d'un coup.
- **D2** — Taille en chiffres (« 10 000 – 50 000 hab. ») ; la fiche dit « Grand centre urbain · 260 000 habitants ». *Pourquoi* : choix de Vincent, « Petite ville » existait deux fois (taille et type Insee). *Écarté* : renommer le type Insee ; garder les deux.
- **D3** — Type d'environnement : les 7 types de la grille de densité Insee, cases cumulables groupées Urbain / Rural, simple filtre. *Pourquoi* : demande de Vincent ; classement officiel par commune. *Écarté* : le noter.
- **D4** — Mer en choix fixes : Peu importe / 10 / 30 / 50 / 100 km ; note inchangée ; un ancien lien prend le choix juste au-dessus (au-delà de 100 : Peu importe). *Pourquoi* : choix de Vincent, plus lisible. *Écarté* : garder le curseur. Coût accepté : 50 critères des tranches construites passent de 60 à 50 km : mêmes communes, quelques scores changent, sauf deux critères qui vérifient autre chose (loyer-mer AC-3, immobilier AC-8) ; une dizaine de tests hors critères suivent ([recalage](recalage.md)).
- **D5** — Montagne : distance à vol d'oiseau de la mairie à la zone de la loi Montagne ; classée en tout ou partie = « Commune de montagne », 0 km. Choix : Peu importe / En montagne / 10 / 30 / 50 / 100 km. *Pourquoi* : suggestion retenue par Vincent ; même logique que la mer. *Écarté* : minutes en voiture (des dizaines de milliers de trajets) ; un seuil d'altitude.
- **D6** — La montagne filtre et note, comme la mer ; « En montagne » filtre seulement. *Pourquoi* : choix de Vincent. *Écarté* : filtre seul. Coût accepté : plus de critères actifs, moins de poids pour le prix.
- **D7** — Au départ, tout le cadre de vie sur Peu importe : le prix seul classe. *Pourquoi* : choix de Vincent, ne rien supposer du cadre de chacun. *Écarté* : mer à 50 km (Claude). Coût accepté : la tête de liste est faite de villages vosgiens à 326 €, à égalité.

- **D8** — Les textes des états vides ne changent pas (« Relâche le loyer, la mer ou la taille. », « Fixe un loyer ou une distance à la mer… », et leurs variantes Acheter et avec un proche), même quand le type ou la montagne écarte tout. *Pourquoi* : choix de Vincent ; la fiche donne la raison. *Écarté* : des textes généraux (3 critères de plus à recaler). Coût accepté : un conseil incomplet dans ce cas.

**Pas maintenant** : forêt, lac, plages ; minutes en voiture.
**Hypothèses** : 14 choix par défaut (H69 à H83) dans [détails](details.md#hypothèses).
**Taille** : 6 règles, 12 critères et le recalage ; ~7 tâches, au-dessus du gabarit perso (D4) ; passe par /ui.
**Le risque** : la zone de la loi Montagne n'est pas « là où l'on voit des montagnes » (Morvan, plateau limousin dedans ; une ville au pied des montagnes peut en sortir). Test en tâche 0 puis à la démo : Vincent juge Chamonix, Grenoble, Annecy, Pau, Clermont-Ferrand, puis les extrêmes : les villes de plus de 50 000 habitants classées, et les 10 premières à « 10 km ». Deux jugées fausses → retour sur D5.
**Questions ouvertes** : aucune.
