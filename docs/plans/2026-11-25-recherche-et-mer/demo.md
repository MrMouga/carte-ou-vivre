# Démo — recherche-et-mer
2026-11-26 · Plan : [plan.md](plan.md) · Progression : [progress.md](progress.md) · Spec : [spec.md](../../specs/2026-11-25-recherche-et-mer/spec.md)

> AC = critère d'acceptation de la spec ; Bloquant / Majeur / Mineur = gravité donnée par un relecteur neuf ; une preuve = capture ou sortie de commande, datée.
> Rien n'est poussé : le site en ligne sert encore l'ancienne version (`210ef59`).

## Ce qui est construit
- **Chercher une commune par son nom** (0a, 1) : loupe à droite du titre du panneau en bureau, en haut de la feuille au téléphone. Accents, tirets et « st » sont tolérés (« sables », « st etienne », « chateau »). Au clavier : flèches, Entrée, Échap. Le choix ouvre la fiche et centre la carte. En bureau, le champ reste ouvert et montre la commune ; au téléphone, la recherche se ferme sur la fiche.
- **Chercher par code postal** (0a, 2) : « 01300 » donne ses 22 communes, « 75015 » donne Paris, « 33 000 » donne Bordeaux. Les codes se chargent à la première prise de focus. S'ils ne répondent pas en 10 s : « Codes postaux indisponibles. Cherche par nom ou réessaie dans un moment. », et la recherche par nom marche toujours.
- **La mer en minutes en voiture, partout** (0b, 3a, 3b) : « Mer à moins de » propose 15 min, 30 min, 1 h et 1 h 30. La liste, les raisons, la fiche et le résumé parlent en minutes, et aucun km de mer ne s'affiche plus. Une commune sans temps (43 sur 34 746) est comptée d'après ses km, avec « ≈ ». La montagne reste en km.
- **Anciens liens** (3b) : `mer=` est ignoré et retiré de l'adresse ; `mer-min=` le remplace.
- **Mentions** (4) : en bureau, toutes en bas du panneau de réglages ; au téléphone, en bas des onglets « Critères » et « Liste ». Deux nouvelles : La Poste (codes postaux) et openrouteservice (temps jusqu'à la mer). Le pied de page de 7 lignes qui couvrait la carte a disparu.

**Essayer** : `npm run dev` → http://localhost:5173 (le serveur tourne déjà). À taper : « Auch », « Le Havre », « Les Sables-d'Olonne », « 01300 » ; régler « 30 min » puis chercher Bordeaux (56 min, ne passe pas) et Caen (18 min) ; Arles (sans temps, « ≈ 26 min »). Au téléphone : `npx vite --host` puis l'adresse Wi-Fi.

## Preuves
- **Suite** (relancée par l'orchestrateur après chaque tâche ; dernière : après la simplification, le 2026-11-26 vers 10:05) : Vitest **456 verts** ; Playwright **508 verts, 53 sautés** (13,4 min) ; types, construction, jetons sans valeur arbitraire. **Après la correction** (11:05) : Vitest 456, Playwright **514 verts, 53 sautés** (13,6 min ; les 6 de plus sont les 3 tests ajoutés, au bureau et au téléphone).
- **Critères de la tranche** : AC-1 à AC-13 passent tous, chacun avec un test qui porte son id (`tests/e2e/recherche.spec.ts`, `src/domain/recherche.test.ts`).
- **Critères des tranches passées** : 61 réécrits en minutes selon [recalage.md](../../specs/2026-11-25-recherche-et-mer/recalage.md), que tu as validé. Ils passent. Le relecteur a comparé avant et après champ par champ : 60 réécritures identiques au tableau, plus cadre-de-vie AC-9 relu à la main. AC-12, AC-13 et AC-15 de proches restent « ne passe pas » exprès : ils sont remplacés par AC-6, AC-8 et AC-10 d'ici, et gardés pour la trace.
- **Captures** : `captures/T1-*`, `T2-*`, `T4-*`, `T3b-*` (constructeurs) ; `captures/qa/qa2-*` (testeur neuf, carte chargée, bureau et 390 px).
- **Données** : `codes-postaux.json` (6 051 codes, 110 Ko compressés) ; `communes.json` + colonne `mer_min` (+54,8 Ko compressés). Le relecteur a recalculé les minutes sans réseau : fichier identique.
- **Geste** : toucher une pastille, 122 à 129 ms (mesure H90, budget 164 ms) ; le testeur mesure 32 à 62 ms jusqu'au compte mis à jour.

## Tests existants modifiés
- **27 fichiers de tests des tranches passées**, recalés selon [recalage.md](../../specs/2026-11-25-recherche-et-mer/recalage.md), validé le 2026-11-26. Exemple : « mer=50 » devient « mer-min=60 ». Les notes changent parce que le plafond change (50 km → 60 min) ; chaque nouveau nombre est calculé dans le tableau. Trois lignes ont bougé hors des numéros du tableau, mais par ses règles : la raison de Montcher (148/50 → 135/60), le titre d'AC-2 et « les cinq choix » → « les quatre choix ». Les quatre tests d'arrondi H74 sont remplacés par un seul (Portmer 62,5 → 63), comme le tableau le prévoyait.
- `scripts/data/communes.test.ts` : une colonne de plus (prévu au plan).
- `src/domain/score.test.ts` l. 203 : `slice(9)` → `slice(9, 11)`, accordé par toi ; la valeur attendue est inchangée.
- `tests/e2e/lib/carte.ts` : +12 lignes pour servir les codes postaux de la fixture, rien retiré (exception accordée au plan).

## Décisions prises à ta place
La liste complète est dans [progress.md](progress.md#décisions-prises-à-la-place-de-vincent). Celles qui se voient :
- **Après un choix, en bureau, le champ reste ouvert** et montre la commune (AC-4, prototype C). Si c'est faux, une ligne à changer. Mais H184 dit l'inverse : la spec est à amender (voir Relectures).
- **La première suggestion est en surbrillance dès qu'elle apparaît** : Entrée choisit la première. Conséquence : « flèche bas puis Entrée » choisit la deuxième. C'est le même modèle que le champ du métier. **À trancher par toi** (voir Relectures).
- **Échap dans un champ vide ferme la recherche.**
- **Au clavier, en bureau, les liens des mentions passent avant la liste**, parce qu'elles sont en bas du panneau. Si c'est faux, il faut réordonner le panneau.
- **Une commune sans temps est notée « ≈ » avec une espace insécable**, et les km ne sont pas lus quand un temps existe.
- **Une adresse `mer-min=` mal écrite** (« 60.0 ») retombe sur « Peu importe ».
- **Les bacs restent dans les trajets**, d'où Blaye (2 h 09 pour 41 km) au tableau de crédibilité.
- **Règle proposée pour juger un temps « faux »** : l'itinéraire en ligne tombe de l'autre côté d'une pastille (15 min, 30 min, 1 h, 1 h 30).

## Relectures
- **Code contre spec** ([review-spec.md](review-spec.md)) : 0 Bloquant, 1 Majeur, 5 Mineurs.
  - **Majeur, corrigé** : au téléphone, la liste des suggestions gardait 280 px et coupait « 01300 » à 6 communes ([corrections-1](taches/corrections-1.md)). Elle remplit maintenant la feuille (16 communes visibles, `captures/C1-390-01300.png`) et s'arrête au-dessus du clavier. En mesurant, l'agent a vu que l'ancienne liste passait déjà sous le clavier de l'iPhone. Clavier simulé seulement : **à essayer sur ton iPhone**. Décidé par Claude : avec peu de suggestions, la liste garde la hauteur de son contenu, et la place laissée au clavier ne vaut que pour la recherche.
  - **Mineur, corrigé** : CLAUDE.md disait l'envoi openrouteservice « lancé par Vincent » ; il est maintenant écrit « lancé par l'agent à ta demande, exception pour ce seul envoi ».
  - **Mineur, à toi** : H184 contredit AC-4. Je propose d'amender H184 : « en bureau, le champ reste ouvert et montre la commune ; au téléphone, il se ferme ».
  - **Mineur, à toi** : la surbrillance de la première suggestion, décrite plus haut (garder, ou ne rien surligner avant la première flèche).
  - **Mineur, laissé** : sous forte charge (un testeur et la suite en même temps), 4 tests de proches ont dépassé leur délai. Relancés seuls, 3 fois chacun : 12 sur 12 verts. Mes deux suites complètes sur machine au repos sont vertes.
  - **Mineur, laissé** : `data-vue` écrit dans le code servi pour qu'AC-4 lise le centre de la carte ; le coût est négligeable.
- **Navigateur** : une première QA ([qa.md](qa.md)) n'avait pas de carte (navigateur sans WebGL, oubli de la leçon du 2026-11-24 dans mon brief). Elle a vu l'ancien lien, les pastilles et les mentions, conformes. La deuxième ([qa-2.md](qa-2.md)), carte chargée : 0 Bloquant, 0 Majeur, 3 Mineurs.
  - La liste au téléphone (corrigé, voir plus haut).
  - « 06006 » (code INSEE) ne donne rien. C'est conforme : la recherche porte sur le code postal (R58).
  - La fiche écrit « 17557e sur 34 674 » sans espace des milliers. Le défaut est déjà noté dans STATE.md, d'une tranche précédente.

## À juger par toi
- **Crédibilité des minutes** : [credibilite-mer.md](credibilite-mer.md), 22 communes avec un lien d'itinéraire chacune. Hourtin (58 min pour 9 km) est probablement faux ; Blaye (2 h 09, bac) est à voir. Un temps faux se retire par une ligne de `scripts/data/mer-retraits.csv`, sans code.
- **La montagne en km à côté de la mer en minutes** (non jugé au design) : la première QA la trouve lisible.

## Non vérifié
- Un vrai iPhone (clavier virtuel), un vrai lecteur d'écran, et la repeinte réelle de la carte après un toucher.
- Le contraste des mentions, en très petit gris (non mesuré).
- Les états « fond indisponible » et « aucune commune » avec la recherche ouverte.
- Les minutes elles-mêmes, au-delà des 22 communes du tableau.

## Coût
- **Durée** : du 2026-11-25 à 23:24 au 2026-11-26 vers 10:45, arrêt compris (envoi openrouteservice, accord sur le tableau).
- **Agents** :
  - constructeurs : 0a 220 k, 0c 415 k, 1 295 k, 2 184 k, 4 161 k, 3a 111 k, 0b 289 k et 3b 504 k jetons, plus la simplification 134 k ;
  - relecteurs : spec 204 k, QA 64 k + 88 k ;
  - correction 120 k.
- **Détours** :
  - 3b a atteint sa limite de tours une fois, et le même agent a repris ;
  - le relecteur spec a dû être relancé une fois pour écrire son rapport ;
  - la première QA était sans carte ;
  - une question pendant 0b (`slice(9, 11)`, Aspremont).
