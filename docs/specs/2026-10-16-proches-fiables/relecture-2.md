# Relecture de la spec — proches-fiables (2ᵉ relecture)

Relu le 2026-10-16 par un relecteur neuf, du point de vue de l'agent qui va planifier et construire, après la révision de D2 et D3 (trois états prêt / partiel / km, repli selon le plafond choisi). Lus : `spec.md`, `details.md`, `acceptance.json` et `relecture.md` de la tranche ; `CLAUDE.md` ; `docs/specs/INDEX.md` ; proches (spec avec D18, détails, critères avec « remplaces » et « reportes ») ; loyer-mer R1, R2, H3 ; cadre-de-vie R28, H74, état **sans plafond** ; immobilier R25. Le code n'a servi qu'à vérifier deux faits : le format de mémoire en ligne (`src/proches/memoire.ts` : `v: 1`, booléen `pret`, plafond gardé même pour un proche non prêt, donc AC-10 a, b et c sont réalisables) et la file des zones (`src/proches/ign.ts` : 250 ms, refus 429 suivi d'un blocage de 5 s, ce qui confirme H92).

**Verdict : aucun Bloquant.** 1 Majeur, le reste Mineur.

**Valeurs chiffrées : toutes justes.** Je les ai recalculées avec R1 et R2 de loyer-mer, R11 de proches, R34, R35 et H74 (moyenne exacte, moitié vers le haut ; aucune ne tombe sur une moitié).
- Notes de loyer à 1 200 € : Portmer 45,83 ; Grandeville 30,67 ; Quaibleu 9. Notes de mer à 50 km : 98 (« moins d'1 km » compté comme 1), 20, 86. Montcher sort par le loyer, Terrebasse par la mer.
- Distances depuis [0.5, 0.5], sphère de 6 371 km : 39,31 / 87,91 / 196,57 / 87,9 / 117,94 km, soit 39 / 88 / 197 / 88 / 118.
- AC-2 : à 2 h 30 → 67,94 → **68** et 16,89 → **17** ; à 2 h 15 → 66,46 → **66**. Grandeville, Montcher et Terrebasse sont bien vues dans la zone de 150 avec celle de 135 manquante, donc « jusqu'à 2 h 30 » ; Portmer reste à « 1 h ».
- AC-3 : couverture 165, aucune zone manquante dessous ; 64,61 → **65**.
- AC-4 et AC-6 a : 70,44 → **70** ; 32,22 → **32** ; 25,78 → **26**.
- AC-5 : 66,83 → **67** ; 17,63 → **18** ; Quaibleu 118 > 90.
- **AC-6 b** : couverture 120 = plafond, donc **partiel** ; 68,78 → **69** ; 35,83 → **36** ; 29,39 → **29** ; Montcher « plus de 2 h ».
- **AC-6 c** : 45 km ÷ 60 = 45 min ≤ couverture 105, donc partiel, qui l'emporte sur km (H97) ; Portmer à 45 min, note 0 → 47,94 → **48**, seule.
- AC-7 : prêt à 2 h 30 → Grandeville 20,22 → **20**.
- **AC-8** : (a) 90 km → 1 h 30 ; 64,61 → **65** et 22,44 → **22** ; Quaibleu 105 > 90. (b) km contre km, l'ancien reste ; 67 / 18. (c) Le résultat est km (couverture 0 < 150), donc pas plus complet ; 68 / 17. (d) Juste.
- AC-9 : 69 / 36 / 29. AC-10 : 66 / 17.
- **AC-12** : (a) couverture 165 < 180 → km, rien ne change ; (b) 165 ≥ 165 → partiel 2 h 45.
- Exemple du pitch : zones de 75, 120 et 180 manquantes → couverture 165 ≥ 120 → partiel ; La Rochelle, vue dans la zone de 135 avec celle de 120 manquante, donne « jusqu'à 2 h 15 » ; les deux phrases s'affichent. Juste.

**Constats Majeurs de `relecture.md` : tous traités, de façon cohérente avec la révision.**
- Mémoire : R36 la liste, et la ligne R12 est « Étendue et contredite ».
- Priorité d'un ajout : D4, R36 et AC-11.
- Proches gardés incomplets quelle que soit la version : R37.
- Zone muette : D1, avec son *Écarté*.
- « 45 s au plus ».
- « Calcul de trajets coupé (recherche d'adresse ouverte) ».
- « Proche prêt » dans les autres tranches et éléments absents du tableau : lignes ajoutées.
- H51 : H100, aucune annonce nouvelle.
- « Ne change pas » d'interface-telephone et d'immobilier : D18 et INDEX.

---

## Ce qu'un agent devrait deviner (manques)

- **Mineur** — **Un proche km et la condition « un code INSEE de la carte n'a pas de valeur » de R37.** R36 dit « un proche **km** n'a pas de temps gardés ». R37 recalcule tout de suite, sans attendre 15 min, un proche « dont un code INSEE de la carte n'a pas de valeur ». Lu à la lettre, un proche km n'a de valeur gardée pour aucun code : il serait recalculé à chaque ouverture et passerait en **calcul**, où il ne compte plus. AC-8 d attrape la mauvaise lecture, mais seulement par son effet. — Où : `details.md` R37 — Proposition : « … dont un code INSEE de la carte n'a pas de temps gardé (un proche **km** a toujours une valeur, sa distance, et n'est pas concerné) ».

- **Mineur** — **Ordre à l'ouverture entre un proche de R37 et les recalculs de R36.** Les deux partent à l'ouverture. Rien ne dit qui passe d'abord. Pourtant un proche de R37 est en **calcul** et ne compte pas, alors qu'un proche en recalcul compte déjà. — Où : R36, R37 — Proposition : « un proche de R37 passe devant les recalculs, comme un proche ajouté ».

- **Mineur** — **Place dans la file d'un « Recalculer avec l'IGN » manuel** quand d'autres recalculs automatiques attendent. Le proche passe-t-il devant, comme un ajout, ou à la suite ? — Où : R36 — Proposition : « à la suite des recalculs en attente » (ou « devant », mais le dire).

- **Mineur** — **Vérification de bout en bout, étape 2 : la valeur attendue pour La Rochelle manque.** « La Rochelle à sa distance à vol d'oiseau » ne se vérifie pas sans chiffre. Mon estimation depuis la rue de la Paix à Nantes jusqu'à la mairie de La Rochelle donne environ **121 km** : La Rochelle ne passerait donc pas à 120 km (« 121 km : au-dessus de ton plafond de 120 km »). Cela reste cohérent avec l'état prêt à 2 h, où elle ne passe pas non plus, mais il faut que celui qui vérifie le sache. — Où : `details.md` Vérification, étape 2 — Proposition : relever la distance en tâche 0 et écrire la valeur et le résultat attendus.

- **Mineur** — **Le risque n'a pas de seuil de décision.** La tâche 0 mesure « à quelle fréquence on y tombe », sans dire ce qui change selon le résultat. Par exemple : au-delà de X proches sur 3 en km, avancer « proches-km-d-abord » ou relever les 45 s. — Où : `spec.md` « Le risque » — Proposition : un seuil et l'action qui va avec.

## Décisions cachées

- **Mineur** — **Une île ou la Corse passe en km.** Cas limite : « en km, sa distance à vol d'oiseau, sans exception ». Depuis Nice ou Toulon à 180 km, des communes de Corse passent, alors qu'en heures elles valent « plus de 3 h ». Ouessant passe depuis Brest. Ce choix change ce que voit l'utilisateur et n'a ni D-n ni H-n. C'est une conséquence de D3, mais son coût n'y est pas écrit. — Où : `details.md` Cas limites ; `spec.md` D3 — Proposition : l'écrire en H-n, ou dans D3 comme coût accepté (« en km, une île compte à sa distance, même sans route »).

- **Mineur** — **Curseur réglable pendant un recalcul.** C'est le plafond au moment du résultat qui décide de l'état et de la conversion. C'est un choix de produit (on aurait pu bloquer le curseur) écrit seulement en cas limite. Il est cohérent avec « jamais baissé ». — Où : Cas limites, dernière ligne — Proposition : le rattacher à un H-n (« décidé par Claude »).

## Contradictions et doublons

- **Majeur** — **« Sinon rien ne change » (R36) contre « 15 min depuis le début de son dernier essai » (H93).** Quand le recalcul ne donne pas mieux (AC-8 b et c, IGN toujours en panne), R36 dit « Sinon rien ne change ». Lu à la lettre, l'heure du dernier essai ne bouge pas non plus. Le proche serait alors recalculé à **chaque** ouverture pendant toute la panne, avec 12 à 24 demandes à chaque fois. C'est exactement ce que D4 veut éviter (« pour ne pas marteler un IGN en panne »). H93 et le cas limite (« nouvel essai à l'ouverture suivante, 15 min au moins après ») disent le contraire, et aucun critère ne le vérifie : AC-8 d part d'une heure donnée, pas d'un recalcul raté. — Où : `details.md` R36, dernière phrase ; H93 ; Cas limites — Proposition : R36 : « Sinon l'état affiché ne change pas ; l'heure du dernier essai est mise à jour à chaque essai, gardé ou non ». Ajouter un critère, à faire valider par Vincent : « proche km, dernier essai il y a plus de 15 min, panne totale ; rouvrir, attendre la fin du recalcul, fermer, rouvrir 5 min plus tard → aucune zone demandée ».

- **Mineur** — **Qui a choisi les 15 min.** D4 en fait un choix de Vincent (« 15 min pour ne pas marteler »), et l'en-tête de `details.md` dit que les 15 min viennent du second avis apporté par Vincent. H93 dit « *Décidé par Claude.* ». — Où : H93 — Proposition : « 15 min : choix de Vincent (D4) ; pas d'intervalle qui s'allonge : décidé par Claude ».

- **Mineur** — **INDEX.md n'est pas à jour.** La ligne proches-fiables compte « 11 (0) » critères et ne liste pas AC-12. Le fichier est généré : relancer `scripts/spec-index.sh` avant le commit.

## Impact sur les tranches existantes

- **Mineur** — **Cas limite de proches non classé** : « Commune sans route (Ouessant, l'île d'Yeu, la Corse) → plus de 3 h ; elle ne passe pas avec ce proche ». En km, elle passe (voir les décisions cachées). — Où : tableau d'impact — Proposition : ligne « proches | Cas limites (commune sans route) | Étendue | en km, distance à vol d'oiseau ».

- **Mineur** — **H38 de proches** (formats de la pastille : « plus de 3 h · au-dessus de 2 h ») est étendue par « jusqu'à 2 h 30 · au-dessus de 2 h 15 », « 118 km · au-dessus de 90 km » et « 90 km au plus », mais n'est pas dans le tableau. La ligne D10 et R15 la couvre sur le fond. — Proposition : ajouter H38 à cette ligne.

- **Mineur** — **Textes de loyer-mer (R2, état **sans plafond**), d'immobilier (R25) et de cadre-de-vie (**sans plafond**)** : ils disent encore « proche prêt », sans renvoi. Ils sont classés « Étendue » ici, et le « partout » de D18 de proches les couvre. Mais un agent qui lit seulement loyer-mer ou cadre-de-vie ne le voit pas. — Proposition : rien d'obligatoire. Au mieux, une mention « lire "prêt ou approximatif" (D18 de proches) » en tête de ces `details.md`.

Rien d'autre : la ligne « Ne change pas » reprend bien AC-1 à AC-9, AC-11, AC-14 et AC-16 de proches, et ceux d'interface-telephone et d'immobilier sont révisés.

## Critères non testables

- **Mineur** — **AC-6 c et AC-12 : on ne sait pas comment obtenir le proche gardé.** AC-8 le dit (« obtenu en jouant AC-4 puis en réglant 90 km »), pas AC-6 c ni AC-12. Pour AC-12, la panne du critère (« zone-180-toujours-rochelleville ») ne peut pas produire elle-même un proche km : la couverture serait 165 ≥ 120, donc partiel. Le test doit d'abord jouer AC-4 (panne totale), régler 180 km ou 165 km, puis changer de panne et avancer l'horloge. — Proposition : dans le *given*, « obtenu en jouant AC-4 puis en réglant 180 km (a) ou 165 km (b) ; la panne "zone-180-toujours-rochelleville" remplace ensuite la panne totale ». Même chose pour AC-6 c (45 km).

- **Mineur** — **AC-7 et AC-11 : la fenêtre d'observation est courte.** Avec un service normal (chaque zone répond 1 s après sa demande), un recalcul dure environ 4 s. « Dès l'ouverture… "Recalcul avec l'IGN…" » (AC-7) et « pendant le recalcul de Nantesville, ajoute Toulouseville » (AC-11) se jouent dans ces 4 s, ce qui rend les tests fragiles. — Proposition : dans la fixture, « pour AC-7 et AC-11, l'horloge est simulée » (comme AC-2 b), ou un délai de réponse plus long pour ces critères.

## Hors sujet pour une spec

Aucun. Le format de mémoire n'est décrit que par ce qu'il garde, pas par sa forme ; la file de 250 ms reprend H31 de proches.

## Couverture

Règles sans AC : aucune règle entière. Parties sans AC : l'heure du dernier essai après un recalcul raté (voir le Majeur) ; R37 pour un proche gardé par cette version (fermé pendant son calcul, empreinte changée) ; « Retirer » pendant un recalcul ; le refus suivi de 5 s d'attente (H92) ; la ligne d'un partiel avec les deux phrases à la fois (seulement dans la vérification réelle, étape 1) ; la pastille d'un partiel (« jusqu'à… · au-dessus de… », « plus de 2 h 45 ») ; le résumé replié « approximatif(s) » ; le curseur bougé pendant un recalcul ; une île en km.
Décisions sans effet vérifiable : aucune (D6 est couverte par « Ne change pas » et par AC-1).
Décisions sans *Pourquoi* : aucune.
Zones sans état initial : aucune.
AC qui dépendent d'un service non simulé : aucun. AC-10 dépend du format de mémoire du commit 56ac3d6, vérifié dans `src/proches/memoire.ts`.
Mots de spec.md : environ 820.
