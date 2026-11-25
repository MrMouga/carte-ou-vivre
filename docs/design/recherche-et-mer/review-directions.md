# Relecture des pistes — recherche et mer en minutes
Statut : terminé

2026-11-25 · mode directions (comparaison à l'aveugle) · pistes A, B, C · relecteur neuf, lecture seule

**Matériel regardé** : les 33 captures de `directions/` (bureau 1 280 × 800, 390 × 844, 375 × 548), le code du prototype (`carte-ou-vivre-proto`, branche `prototype/recherche-et-mer` : `src/proto/Recherche.tsx`, et ce qui change dans `App.tsx`, `FeuilleMobile.tsx`, `Mentions.tsx`, `Settings.tsx`, `CadreDeVie.tsx`, `tokens.ts`), le brief, la spec, `details.md`, le contrat du système.
**Ce que je n'ai pas pu faire** : faire marcher le prototype. Sans fenêtre visible, la carte (WebGL) ne se charge pas : la page passe en état « La carte n'a pas pu se charger. » et le champ est inactif, ce qui est conforme à H188. Le navigateur avec fenêtre refuse de démarrer sur cette machine (profil verrouillé, permission refusée). Le clavier, l'annonce du nombre de suggestions et la bascule d'unité ont donc été **lus dans le code**, pas essayés.

**Fidélité égale** : le champ, les suggestions, le clavier, les messages, la conversion d'unité (H190), le « ≈ » et la ligne de la fiche viennent du **même code** (`Recherche`, `MerProto`, `ligneTempsFiche`) dans les trois pistes. Elles ne diffèrent que par la place du champ, la forme de la bascule et le pied de page. Aucune n'est plus soignée que les autres. Les défauts communs sont regroupés à la fin des constats.

## Objectif 1 — Trouver une commune en trois secondes

| | Sert ? | Pourquoi | Preuve |
|---|---|---|---|
| **A** | **Oui en bureau ; en partie au téléphone** | En bureau, le champ avec « Nom ou code postal » est le premier élément des réglages, sous le titre : il dit à la fois qu'on peut chercher et comment. Les suggestions passent par-dessus le panneau, avec 9 lignes visibles puis un défilement (01300). Au téléphone, il n'y a qu'une loupe, toujours au même endroit (tête de feuille, à droite du compte, aussi quand la fiche est ouverte) : un toucher de plus, et le placeholder n'est pas visible au repos. | `A-bureau-depart`, `A-bureau-code-complet` ; `A-375x548-depart`, `A-390-choisie` (loupe en haut à droite) |
| **B** | **Oui** (le plus visible) | Le champ est visible partout, en bureau comme au téléphone, et il reste au-dessus de la fiche. Les suggestions remplacent « Les 10 premières » (9 lignes visibles). C'est la seule piste où « Nom ou code postal » se lit au téléphone sans rien toucher. Mais ce gain au téléphone coûte l'objectif 2 (voir plus bas). | `B-bureau-depart`, `B-bureau-code-complet`, `B-390-depart`, `B-390-choisie` |
| **C** | **Faible en bureau, en partie au téléphone** | En bureau, il n'y a qu'une loupe de 44 px dans la ligne du titre, sans texte. Rien ne dit qu'on peut taper un code postal. Il faut un clic avant de taper, alors qu'il y a la place pour un champ. Le champ ouvert **remplace le titre « Où vivre en France »**, qui disparaît de la page. Au téléphone, la loupe est au bout des onglets, mais elle **change de place** quand une fiche est ouverte (elle passe dans la tête). Seul point fort : la population sous chaque nom (« 49 603 habitants ») aide à reconnaître la bonne commune. En contrepartie, chaque ligne est plus haute : 6 lignes visibles au lieu de 9 pour 01300. | `C-bureau-depart`, `C-bureau-code-complet`, `C-bureau-choisie` (plus de titre) ; `FeuilleMobile.tsx` : `VARIANTE === 'C' && avecFiche` |

Commun aux trois, lu dans le code : homonymes distingués par le département, suggestion par code « 01300 · Belley (01) », code en `muted-foreground` et nom en `texte-fort`, flèches, Entrée, Échap deux fois, `aria-activedescendant`, « N suggestions » annoncé par une zone `aria-live`, 44 px par ligne sous 1 024 px. **Pour cet objectif : B, puis A, puis C.** En bureau, A et B se valent.

## Objectif 2 — Ne rien casser au téléphone

| | Sert ? | Pourquoi | Preuve |
|---|---|---|---|
| **A** | **Oui** | La feuille garde sa hauteur : le curseur du prix est à 537 px et la France est entière au-dessus de la feuille (210 px de carte à 375 × 548). Au focus, la feuille monte à `taille-bande-carte`, par le même mécanisme que l'ajout d'un proche (R20). La loupe reste dans la tête quand la fiche est ouverte (H177). | `A-375x548-depart` ; `FeuilleMobile.tsx` : `ajout = ajoutVrai \|\| modeRecherche` |
| **B** | **Non** | Pour garder le curseur visible, la feuille monte de 52 px. Il ne reste que 158 px de carte à 375 × 548 : la métropole n'est plus entière au-dessus de la feuille (sur la capture, la France n'est presque pas visible). **AC-1 d'interface-telephone casse**, alors que la spec le range dans « Ne change pas ». Un champ visible au repos ne peut tenir que si l'on casse soit H48, soit AC-1 : la mesure du brief le disait déjà. À 390 × 844, c'est juste. Au focus et avec une fiche ouverte, le comportement est correct. | `B-375x548-depart` ; brief, objectif 2 (mesure du 2026-11-25) ; spec `details.md`, Impact : « R16 et AC-1 […] Inchangée » ; `App.tsx` : `height: 'calc(max(45dvh, 338px) + 52px)'` |
| **C** | **Oui** | Même résultat que A à 375 × 548. La loupe prend sa place dans la rangée des onglets, qui reste à 44 px. Au focus, la feuille monte comme en A. | `C-375x548-depart` |

**Pour cet objectif : A = C ; B échoue.**

## Objectif 3 — km ou min sans mode d'emploi

| | Sert ? | Pourquoi | Preuve |
|---|---|---|---|
| **A** | **Oui, le mieux** | « Mer à moins de » est suivi, sur la même ligne, de « km \| min » collés : ça se lit comme l'unité de la ligne, pas comme un filtre. C'est le composant Bascule mer du système, à la place que dit H189 (« à droite du sous-titre »). Il n'ajoute aucune ligne. Il mesure 24 px en bureau (2.5.8 respecté) et 44 px à 390. Limite : il est petit, au bord droit, et peu visible pour qui ne cherche pas. | `A-bureau-min`, `A-390-min` ; contrat : « Bascule mer […] 24 px de haut en bureau, 44 px à 390 px » |
| **B** | **En partie** | « km à vol d'oiseau » et « min en voiture » expliquent ce que chaque unité mesure, ce qui aide aussi l'objectif 4. Mais le contrôle souligné, sur toute la largeur, a le même poids visuel que « Louer / Acheter », un vrai changement de mode : il se lit comme un choix de premier rang plutôt que comme une unité. Il ajoute une ligne (44 px à 390) et il change les noms des boutons (« km à vol d'oiseau » au lieu de « km », que donne H189). | `B-bureau-min`, `B-390-min` ; H189 ; `Recherche.tsx` l. 380 |
| **C** | **Oui** | Le segmenté « km \| min » en demi-largeur reprend « Total \| Au m² » du prix, déjà présent plus haut dans le même panneau : l'unité suit le même modèle partout. Il ajoute une ligne sous le sous-titre et s'écarte du placement de H189. Deux rangées de cases foncées se suivent (« km » coché, puis le choix coché), ce qui rend le groupe un peu plus lourd que A. | `C-bureau-min`, `C-bureau-depart` |

Commun aux trois, lu dans le code : changer d'unité garde la position du choix (`changerUnite` : indice gardé, Peu importe reste Peu importe), et « ≈ » apparaît devant un temps compté d'après les km dans la liste. **Pour cet objectif : A, puis C, puis B.**

## Objectif 4 — Des minutes crédibles

| | Sert ? | Pourquoi | Preuve |
|---|---|---|---|
| **A** | Oui | La fiche donne « 39 km de la mer à vol d'oiseau » puis « 54 min de la mer en voiture », puis la montagne : l'ordre et les textes de R63. | `A-bureau-choisie`, `A-390-choisie` |
| **B** | Oui, un peu mieux | Même fiche. En plus, la bascule dit « à vol d'oiseau » et « en voiture », ce qui écarte toute confusion entre les deux mesures avant même d'ouvrir une fiche. | `B-bureau-min` |
| **C** | Oui | Même fiche que A. | `C-bureau-choisie` |

Les textes de la fiche sont fixés par la spec et identiques dans les trois pistes (`ligneTempsFiche`). Le cas « inconnu : compté … d'après les km » n'est montré sur aucune capture (Auch, prévu sans temps, n'a pas été pris). **Pour cet objectif, les trois se valent, avec un léger avantage à B.**

## Objectif 5 — Pied de page pas plus haut

| | Sert ? | Pourquoi | Preuve |
|---|---|---|---|
| **A** | **Non** | Le pied de page passe de 127 à 142 px (9 lignes) et couvre davantage le bas de la carte. C'est précisément ce que l'objectif interdit. | mesure de l'orchestrateur, 142 px ; `A-bureau-depart` ; brief, objectif 5 |
| **B** | **Oui, sous réserve** | Replié, le pied tient en une ligne de 11 px : « Sources et mentions : ANIL, Insee, IGN, … openrouteservice… ». Il est déplié par un bouton `aria-expanded` : une fois ouvert, il remonte à plus de 142 px par-dessus la carte. Replié, les textes obligatoires de CLAUDE.md ne sont plus visibles (par exemple « © Shom-IGN, 2021 » avec ses noms encadrés et liés, « © OpenStreetMap contributors », la mention du fond IGN). **C'est à Vincent de décider si c'est permis** (le brief le dit). | `B-bureau-depart` ; `MentionsRepliees` |
| **C** | **Oui, le mieux** | Il n'y a plus rien sur la carte : les mentions sont entières, en bas du panneau de réglages (379 px). C'est déjà ce que fait le téléphone depuis interface-telephone (« les mentions en bas » de chaque onglet, contrat du système), donc le bureau suit un modèle déjà accepté. En contrepartie, il faut faire défiler tous les critères pour les lire, et l'attribution du fond IGN n'est plus près de la carte (à confirmer par Vincent, comme pour B). | `C-bureau-depart` ; contrat, Règles : « Sous 1 024 px […] les mentions en bas » |

**Pour cet objectif : C, puis B (si Vincent accepte des mentions repliées), puis A, qui échoue.**

## Constats

**[Majeur] B : le champ visible au téléphone fait sortir la France de l'écran à 375 × 548.** C'est l'utilisateur d'un petit téléphone qui en pâtit : à l'ouverture, il ne voit plus la carte de la métropole, qui est l'écran principal selon le brief (« la carte reste l'écran principal »).
  Où : `B-375x548-depart` (158 px de carte, contre 210 px pour A et C) ; `App.tsx`, hauteur de feuille + 52 px.
  Correction : au téléphone, prendre la loupe de A (dans la tête de feuille). Un champ visible au repos ne tient pas avec H48 et AC-1 à la fois.
  Réf : AC-1 d'interface-telephone, rangé dans « Ne change pas » de `details.md` ; brief, objectif 2. Je le mets en Majeur et non en Bloquant parce que la tâche reste faisable, mais c'est un critère d'acceptation protégé : B ne peut pas être construit tel quel au téléphone.

**[Majeur] A : le pied de page de bureau grandit (127 → 142 px) et couvre davantage la carte.** Tout utilisateur en bureau perd du bas de la carte, alors que c'était déjà un défaut « Moyen » de la QA de services.
  Où : `A-bureau-*`.
  Correction : reprendre le pied de C (mentions en bas du panneau de réglages) ou celui de B (une ligne repliée), selon ce que Vincent décide sur les mentions.
  Réf : brief, objectif 5 ; mesure 142 px. L'effet pour l'utilisateur est modeste (15 px), mais l'objectif est explicite et mesuré, d'où Majeur.

**[Majeur] C : en bureau, la recherche n'est qu'une loupe sans texte, et l'ouvrir efface le titre de la page.** Celui qui arrive ne voit pas qu'il peut taper un nom ou un code postal, et il lui faut un clic de plus. Le lecteur d'écran perd le seul titre `h1` « Où vivre en France » tant que le champ est ouvert, et le titre n'est pas visible non plus pendant qu'une commune est choisie.
  Où : `C-bureau-depart`, `C-bureau-choisie` ; `App.tsx` : `sansTitre={bureau && VARIANTE === 'C'}`, et le champ remplace la ligne du titre.
  Correction : en bureau, le champ ouvert en tête des réglages, sous le titre, comme en A.
  Réf : H177 (« en bureau, le champ est en tête des réglages ») ; H178 (« Nom ou code postal » écrit dans le champ) ; brief, objectif 1 (« se voit à l'ouverture, en bureau comme au téléphone ») ; WCAG 1.3.1. J'hésitais avec Mineur parce que la loupe est un signe connu. Je garde Majeur parce qu'en bureau rien n'oblige à réduire le champ : c'est perdre en clarté sans rien gagner.

**[Mineur] A et C (téléphone), C (bureau) : l'état « choisie » de H184 n'existe pas.** Après le choix, le champ disparaît derrière la loupe et son contenu est perdu. Rouvert, il est vide. « Bordeaux (33) » et « Effacer la recherche » ne se voient jamais, et la règle « fermer la fiche ne vide pas le champ » n'a plus d'objet.
  Où : `A-390-choisie`, `C-390-choisie` ; le composant `Recherche` est retiré de la page dès que la recherche est fermée.
  Correction : soit amender H184 pour le téléphone (« après le choix, la recherche se referme en loupe »), soit garder la saisie et la remontrer à la réouverture. Une décision à prendre avant /breakdown.
  Réf : H184 ; `details.md`, état **choisie**.

**[Mineur] A et C : après « Annuler », le focus se perd.** Le champ est retiré de la page, donc le focus clavier retombe en haut du document, et le lecteur d'écran repart du début.
  Où : bouton « Annuler » (A et C au téléphone, C en bureau).
  Correction : rendre le focus à la loupe qui a ouvert la recherche.
  Réf : WCAG 2.4.3.

**[Mineur] Commun : les suggestions restent ouvertes quand le champ perd le focus.** En A, la liste posée par-dessus continue de cacher le curseur du loyer et les premiers critères. En B, « Les 10 premières » ou la fiche restent remplacées, par exemple par « Aucune commune ne correspond. », tant qu'on n'a pas appuyé sur Échap.
  Où : `Recherche.tsx`, `ouverte = !fermee && …`, rien ne ferme la liste à la perte du focus.
  Correction : fermer les suggestions à la perte du focus, comme dans le modèle combobox de l'APG.
  Réf : ARIA APG, Combobox.

**[Mineur] B : la bascule renomme les boutons et pèse comme un changement de mode.** « km à vol d'oiseau » et « min en voiture » ne correspondent pas aux noms « km » et « min » de H189, que les tests prendront par leur rôle. Le contrôle souligné, sur toute la largeur, imite « Louer / Acheter ».
  Correction : si l'on garde l'explication, la mettre en sous-texte et garder « km » et « min » comme noms.
  Réf : H189.

**[Mineur] C : la loupe change de place au téléphone** (bout des onglets, puis tête de feuille quand la fiche est ouverte). Il faut la chercher deux fois.
  Correction : une seule place, celle de A.
  Réf : heuristique de cohérence (Nielsen 4).

**[Mineur] Contrat : une nouvelle dimension, `taille-liste-suggestions` 280** (hauteur maximale de la liste avant défilement), est ajoutée dans `tokens.ts`. Si elle est gardée, il faut l'écrire dans `docs/design/system/README.md`. B ajoute aussi une valeur arbitraire de 52 px à la hauteur de la feuille, ce qui n'a plus d'objet si B n'est pas retenue au téléphone.
  Réf : contrat du système (« Une valeur manque → on ajoute un jeton ici »).

## Ce que chaque piste fait de mieux
- **A** : la bascule d'unité (Bascule mer du système, à droite de « Mer à moins de », sans ligne de plus) ; le champ de bureau en tête des réglages ; la loupe du téléphone, à une seule place, qui tient H48 et AC-1.
- **B** : le seul champ visible partout au téléphone (impossible à tenir à 375 × 548) ; la bascule qui dit ce que mesurent km et min ; le pied d'une ligne.
- **C** : le pied de page retiré de la carte, avec les mentions entières en bas des réglages, comme au téléphone ; la population sous chaque suggestion.

## Recommandation
**Base : A.** C'est la seule piste qui tient les objectifs 1 à 4 sans casser de critère, avec le placement que la spec décrit (H177 en bureau, H189).

À prendre aux autres :
1. **De C, le pied de page** : mentions en bas du panneau de réglages en bureau, plus rien sur la carte. Ça règle l'objectif 5 et aligne le bureau sur le téléphone. **À décider par Vincent** : l'endroit et la façon d'afficher des mentions obligatoires lui reviennent. Si Vincent veut les garder près de la carte, l'autre solution est la ligne repliée de B, mais tout est alors caché derrière un clic.
2. **De B, l'explication des unités, sans changer la bascule** : pas de « km à vol d'oiseau » comme nom de bouton. Les mots « à vol d'oiseau » et « en voiture » sont déjà dans la fiche (R63), et c'est là qu'ils comptent. On peut aussi n'en rien prendre.
3. **De C, la population sous les suggestions : seulement si Vincent y tient.** Elle n'aide aucun cas de la grille (le département distingue déjà les homonymes) et réduit le nombre de lignes visibles d'un tiers.

À corriger dans A avant la convergence : l'état **choisie** au téléphone (H184 à amender ou à tenir), le focus après « Annuler », la fermeture des suggestions à la perte du focus, `taille-liste-suggestions` à écrire dans le contrat.

## Non jugé
- **Le prototype en marche** : la carte WebGL ne s'est pas chargée sans fenêtre visible, et le navigateur avec fenêtre n'a pas démarré. Le clavier, l'annonce « N suggestions », la bascule, les états `codes=lent` et `codes=erreur` sont jugés sur le code, pas essayés.
- **Le clavier de l'iPhone** (R20) : la montée de la feuille est dans le code, mais je n'ai pas vu de capture avec le clavier ouvert.
- **Le cas « Temps en voiture jusqu'à la mer inconnu : compté … d'après les km »** dans une fiche, et « ≈ » dans la liste : aucune capture, seulement le code (`ligneTempsFiche`, `prixListe`).
- **La conformité juridique** de mentions repliées (B) ou éloignées de la carte (C), en particulier l'attribution du fond IGN et d'OpenStreetMap : c'est à Vincent de trancher, je n'ai fait aucune recherche extérieure.
- **Les largeurs sous 375 px** : j'ignore si la loupe de A chevauche le compte le plus long (à 375 px, il reste à peu près 4 px entre les deux).
