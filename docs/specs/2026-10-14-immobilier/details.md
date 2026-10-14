# Détails — immobilier
Lire d'abord [spec.md](spec.md) (décisions D-n). Les règles R1 à R20, les hypothèses H1 à H55 et les états de page sont ceux de [loyer-mer](../2026-10-12-loyer-mer/details.md), [proches](../2026-10-13-proches/details.md) et [interface-telephone](../2026-10-13-interface-telephone/details.md) ; ici, seulement ce qui change ou s'ajoute. Révisé le 2026-10-14 après la [relecture](relecture.md).

## Parcours
1. L'utilisateur ouvre la page : le réglage du prix est sur Appartement · Louer · Total, 52 m², 1 200 € (D1), la carte de la tranche 1.
2. Il change la surface : les loyers par mois, la carte, la liste et la fiche se mettent à jour.
3. Il passe en Maison : surface et plafond restent (D2), les loyers sont ceux des maisons.
4. Il passe en Acheter : l'unité passe à Au m², le plafond à 5 000 €/m² (D3) ; la carte se colore selon le prix d'achat.
5. Il passe en Total : le plafond devient un prix total pour la surface (D4), le champ surface réapparaît avec la même surface.
6. Il ouvre la fiche de Strasbourg : « Prix d'achat inconnu » et la raison (D6, D8).
7. Il copie l'adresse : les mêmes choix s'ouvrent ailleurs (R26).

## Écrans et états
### Carte — route `/` · dans l'URL : `loyer` ou `achat` (le plafond), `mer`, `taille` (loyer-mer R7), et `bien`, `unite`, `surface` quand ils diffèrent de leur valeur de départ (R26)

Zones touchées : **réglage du prix** (remplace le réglage du loyer, dans les réglages en bureau et dans l'onglet « Critères » à 390 px) · **fiche** (ligne du prix, raisons) · **liste** (colonne du prix) · **légende** (H60) · **pied de page** (H61). Disposition : /ui, avec la contrainte de H48 d'interface-telephone : à 375 × 548, le curseur du prix reste entièrement visible à l'ouverture.

États du réglage du prix (initial : **total**) :
- **total** (unité Total) → les trois bascules, le plafond en € (« 1 200 € » sous « Loyer mensuel », « 260 000 € » sous « Prix d'achat »), le champ surface (« 52 » m²) ; sort vers **au m²**.
- **au m²** (unité Au m²) → les trois bascules, le plafond en €/m² (« 23 €/m² » en Louer, « 5 000 €/m² » en Acheter), pas de champ surface (la surface est gardée, R21) ; sort vers **total**.
- **surface en cours de saisie** (champ vide ou hors de H58) → le champ montre ce qui est tapé, la carte garde la dernière surface valide ; en quittant le champ, il reprend la dernière surface valide ; sort vers **total**.
Dans **total** et **au m²**, le plafond peut être « Sans limite » (le cran après le maximum, H57) ; il le reste quand on change d'unité ou de bien.

États de la page : ceux de loyer-mer et de proches. En mode Acheter, « le prix » remplace « le loyer » dans leurs textes : **aucune commune** dit « Aucune commune ne passe tes critères. Relâche le prix, la mer ou la taille. » (avec un proche : « Relâche le prix, la mer, la taille ou un proche. ») ; **sans plafond** (prix et mer sur « Sans limite », aucun proche prêt) dit « Fixe un prix d'achat ou une distance à la mer pour classer les communes. ». En mode Louer, les textes ne changent pas. Une commune en couleur neutre (R25) ne compte pas comme une commune qui passe : s'il n'y a qu'elles, la page est dans l'état **aucune commune** et elles gardent leur couleur neutre. Les prix d'achat se chargent avec les données des communes (H68) : pas d'état propre.

États de la fiche : ceux de loyer-mer et de proches, plus :
- **commune sans note** (R25) → nom, taille, la ligne de prix inconnu (R24), mer ; ni score ni rang ; sort comme les autres états.

Interactions : bascule, surface ou plafond → carte, liste, fiche et adresse à jour en ≤ 100 ms (H9 de loyer-mer). La surface s'applique à chaque frappe qui donne une valeur valide.

## Règles
- **R21** — Réglage du prix (D1, D2, D3). Trois bascules, *bien* (Appartement / Maison), *mode* (Louer / Acheter), *unité* (Total / Au m²), un champ surface et un plafond. Au départ : Appartement, Louer, Total, 52 m², 1 200 €. Passer en Acheter met Au m² et 5 000 €/m² ; passer en Louer met Total et 1 200 €. Changer de bien ne change ni la surface, ni l'unité, ni le plafond. La surface n'est changée que par l'utilisateur ou par l'adresse (R26), jamais par une bascule. *Pourquoi* : voir D1–D3.
- **R22** — Montant (D2). En Total, le montant d'une commune est son prix au m² exact × la surface, arrondi à l'euro pour un loyer, au millier d'euros pour un achat (H59) ; c'est ce montant affiché qu'on compare au plafond (loyer-mer R1). En Au m², on compare le prix au m² affiché (loyer à une décimale, achat à l'euro). La surface ne change que les montants, jamais le plafond. *Pourquoi* : comparer la valeur affichée, comme loyer-mer R1.
- **R23** — Changer d'unité (D4). Total → Au m² : plafond ÷ surface ; Au m² → Total : plafond × surface ; le résultat est arrondi au cran le plus proche de la nouvelle plage (moitié vers le haut) et ramené dans ses bornes (H57). Ex. : loyer 1 200 € pour 52 m² → 23 €/m², et retour → 1 200 € (23 × 52 = 1 196) ; achat 5 000 €/m² pour 52 m² → 260 000 € ; 12 000 €/m² pour 92 m² → 1 000 000 €. *Pourquoi* : voir D4.
- **R24** — Prix d'une commune (D5, D7, D8). Louer : le loyer au m² des appartements ou des maisons, avec « Estimation du secteur (communes voisines) » comme loyer-mer D12. Acheter : la médiane au m² des ventes de la commune pour le bien choisi si elle compte au moins 5 ventes ; sinon celle de son intercommunalité si celle-ci en compte au moins 5, avec « Estimation du secteur (moins de 5 ventes dans la commune) » ; sinon prix inconnu. Paris, Lyon et Marseille : H67. Lignes de la fiche (D7) :
  | Mode · unité | Ligne du prix | Raison quand il dépasse |
  |---|---|---|
  | Louer · Total | « 832 € par mois pour 52 m² (16,0 €/m²) » (loyer-mer R4) | « Loyer 1 512 € : au-dessus de ton plafond de 1 200 € » |
  | Louer · Au m² | « 16,0 €/m² par mois » | « Loyer 30,0 €/m² : au-dessus de ton plafond de 23 €/m² » |
  | Acheter · Total | « 229 000 € pour 52 m² (4 400 €/m²) » | « Achat 350 000 € : au-dessus de ton plafond de 300 000 € » |
  | Acheter · Au m² | « 4 400 €/m² à l'achat » | « Achat 5 100 €/m² : au-dessus de ton plafond de 5 000 €/m² » |
  Prix inconnu : « Loyer inconnu » ; « Prix d'achat inconnu : les ventes ne sont pas publiées en Alsace-Moselle » pour une commune de Moselle, du Bas-Rhin ou du Haut-Rhin ; « Prix d'achat inconnu : trop peu de ventes dans le secteur » sinon. Colonne de la liste : le montant ou le prix au m² seul (« 3 800 €/m² », « 198 000 € », « 12,5 €/m² », « prix inconnu »). *Pourquoi* : voir D5, D7, D8.
- **R25** — Commune sans prix (D6), en loyer comme en achat. Elle passe le filtre du prix. Si au moins un autre critère lui donne une note (mer, proche prêt), son score est la moyenne de ces notes et, à score affiché égal, elle vient après les communes qui ont un prix. Sinon, elle prend la couleur neutre, sans score ni rang, et n'entre ni dans la liste ni dans le compte. *Pourquoi* : voir D6.
- **R26** — Adresse (loyer-mer R7, D7). Le plafond s'écrit `loyer=<nombre>` en mode Louer, `achat=<nombre>` en mode Acheter, `aucun` pour « Sans limite », dans l'unité choisie. `bien=maison`, `unite=m2` (en Louer) ou `unite=total` (en Acheter), et `surface=<m²>` n'apparaissent que s'ils diffèrent de leur valeur de départ, dans toutes les unités ; la valeur de départ de la surface est celle du bien de l'adresse (52 m², 92 m² en Maison). Ordre : plafond du prix, `mer`, `taille`, `bien`, `unite`, `surface`. Une valeur absente ou invalide prend sa valeur de départ (H7, H17, H57, H58, H66). *Pourquoi* : un lien de la tranche 1 garde son sens (D1), et une adresse rouvre exactement le même réglage.

## Cas limites
- `loyer` et `achat` tous deux dans l'adresse → H66 (AC : aucun ; test unitaire).
- `achat=abc`, `unite=litre`, `bien=villa`, `surface=0` → valeurs de départ (AC-11).
- Plafond « Sans limite » puis changement d'unité ou de bien → reste « Sans limite ».
- Conversion hors des bornes → ramenée à la borne (R23).
- Le prix est le seul critère qui note, et seules des communes sans prix passent → état **aucune commune**, communes sans prix en couleur neutre (R25).
- Une commune a un prix de maison mais pas d'appartement (ou l'inverse) → son prix dépend du bien choisi (AC-8, AC-9).
- Commune sans loyer de maison → R25 en mode Louer (AC-13).

## Impact sur les tranches existantes
Cette table fait foi pour l'amendement D21 de loyer-mer.

| Tranche | Élément | Inchangée / Étendue / Contredite | Action |
|---|---|---|---|
| loyer-mer | Cas limite « commune sans loyer… si ce critère est actif, la commune ne passe pas » | Contredite | D21 de loyer-mer : elle passe (R25) |
| loyer-mer | R1, « pour chaque plafond actif, sa valeur affichée ≤ plafond » | Contredite | D21 de loyer-mer : un prix inconnu ne fait pas échouer le critère du prix |
| loyer-mer | D4, R2, score = moyenne des notes des critères actifs | Étendue | le critère du prix ne note pas une commune sans prix (R25) |
| loyer-mer | État **aucune commune** (« aucune commune n'est colorée ») | Étendue | des communes en couleur neutre peuvent rester visibles (R25) |
| loyer-mer | R4, « … pour 52 m² » | Étendue | surface et bien choisis (R22, R24) ; au départ, texte identique |
| loyer-mer | R5, colonne du loyer | Étendue | prix du mode et de l'unité (R24) |
| loyer-mer | R7, H7, H17, adresse | Étendue | `achat`, `bien`, `unite`, `surface` (R26) ; une adresse de la tranche 1 s'ouvre à l'identique |
| loyer-mer | H1, H2 (plafond de 300 à 2 000 € par 50 €) | Inchangée | vaut pour Louer · Total ; les autres plages dans H57 |
| loyer-mer | H3, formats et arrondis | Étendue | H59 |
| loyer-mer | H4, égalité de score : loyer croissant | Étendue | prix affiché croissant, prix inconnu en dernier (R25) |
| loyer-mer | D5, couleur neutre, légende « Sans plafond : pas de score » | Étendue | aussi pour une commune sans note (R25) ; légende inchangée (H60) |
| loyer-mer | D12, « Estimation du secteur » | Étendue | loyers des maisons et prix d'achat (R24) |
| loyer-mer | Pied de page, mentions | Étendue | mention des ventes (H61) |
| proches | R11, notes (« le loyer, la mer et chaque proche prêt ») | Étendue | « le loyer » se lit « le prix » ; un proche prêt note une commune sans prix (R25) |
| proches | Message « aucune commune » avec un proche | Étendue | version Acheter (États de la page) |
| interface-telephone | R18, contenu de l'onglet « Critères » | Étendue | le réglage du prix remplace le réglage du loyer ; disposition : /ui |
| interface-telephone | H48, curseur du loyer visible à 375 × 548 | Inchangée | contrainte pour /ui (Écrans et états) |
| toutes | Tests qui trouvent le curseur par son nom « Loyer maximum » | Inchangée | H65 garde ce nom en Louer · Total |

## Ne change pas
Loyer-mer : AC-1 à AC-15, sur la fixture « 5 communes », réglage du prix au départ. Proches : AC-1 à AC-11, AC-14, AC-16. Interface-telephone : AC-1 à AC-11, et le test hors AC de H48 (375 × 548).

## Hypothèses
- **H56** — Libellés : « Appartement » / « Maison », « Louer » / « Acheter », « Total » / « Au m² » ; curseur « Loyer mensuel » ou « Prix d'achat » (D10) ; champ surface sans libellé visible, suivi de « m² » ; pas de sous-texte sous le curseur du prix. Les critères les citent : les changer est une révision de la spec, pas un choix de /ui.
- **H57** — Plages et crans du plafond : Louer · Total 300 à 2 000 € par 50 € (H2 de loyer-mer) ; Louer · Au m² 5 à 40 € par 1 € ; Acheter · Au m² 500 à 12 000 € par 100 € ; Acheter · Total 50 000 à 1 000 000 € par 10 000 € ; le cran après le maximum est « Sans limite ». Plafond de départ en Acheter · Total : 5 000 €/m² × la surface, arrondi au cran. Une valeur d'adresse hors de la plage ou du cran est invalide (comme H7).
- **H58** — Surface : nombre entier de 10 à 300 m².
- **H59** — Arrondis, moitié vers le haut : achat au m² à l'euro, montant d'achat au millier d'euros (229 500 € → 230 000 €) ; loyer comme loyer-mer H3.
- **H60** — *Révisée par D10.* Légende inchangée : « Sans plafond : pas de score » ; pas de ligne « Prix inconnu » (la fiche dit pourquoi).
- **H61** — Pied de page, dans tous les modes : « Prix d'achat : Demandes de valeurs foncières (DGFiP), statistiques Etalab, ventes 2021 à 2025 ». Période et millésime fixés en tâche 0.
- **H62** — La médiane couvre toute la période du fichier (2021 à 2025 au fichier de juillet 2026), sans pondérer les années récentes.
- **H63** — Le message de l'Alsace-Moselle (R24) vaut pour toute commune de Moselle, du Bas-Rhin ou du Haut-Rhin.
- **H64** — Le nombre de ventes n'est pas affiché ; seul « Estimation du secteur » signale un prix pris à l'intercommunalité.
- **H65** — *Révisée par D10.* Noms pour les lecteurs d'écran : le curseur s'appelle « Loyer mensuel, loyer maximum » en Louer · Total (il commence par le libellé visible et garde « Loyer maximum » des tests existants), « Loyer mensuel, loyer maximum au m² », « Prix d'achat, prix maximum » et « Prix d'achat, prix maximum au m² » ailleurs ; le champ « Surface en m² » ; chaque bascule est un groupe nommé « Type de logement », « Louer ou acheter », « Unité du prix ».
- **H66** — Si l'adresse contient `loyer`, le mode est Louer, même si `loyer` est invalide (il prend alors 1 200 €) ; `achat` est alors ignoré et retiré.
- **H67** — Paris, Lyon, Marseille en Acheter : moyenne simple des prix des arrondissements qui en ont un (comme loyer-mer D10) ; « Estimation du secteur » si au moins un arrondissement est estimé.
- **H68** — Les prix d'achat se chargent avec les données des communes, à l'ouverture : ils ont le même chargement et la même erreur (loyer-mer, états **chargement** et **erreur**).

## Exceptions
Aucune.

## Vérification de bout en bout
Sur la version en ligne, en bureau et à 390 px :
1. Ouvrir `/` : réglage du prix sur Appartement · Louer · Total, 52 m², 1 200 € ; l'adresse est `/?loyer=1200&mer=60` ; Bordeaux affiche « 832 € par mois pour 52 m² (16,0 €/m²) ».
2. Surface à 70 m² : Bordeaux affiche 1 120 € (15,9932 €/m², mesuré le 2026-10-14) ; l'adresse contient `surface=70`.
3. Maison : la surface reste 70 m², Bordeaux affiche son loyer de maison ; l'adresse contient `bien=maison&surface=70`.
4. Appartement, puis Acheter : plafond 5 000 €/m² ; Bordeaux affiche « 4 427 €/m² à l'achat » (valeur du fichier relevée en tâche 0) et passe.
5. Fiche de Strasbourg : « Prix d'achat inconnu : les ventes ne sont pas publiées en Alsace-Moselle ».
6. Total : plafond 350 000 € (5 000 × 70 m²), champ surface à 70 m².
7. Copier l'adresse, l'ouvrir dans une fenêtre privée : mêmes choix, même liste.
8. À 375 × 548 : le curseur du prix est entièrement visible à l'ouverture.
9. `curl -sI` sur le fichier des prix d'achat en ligne : il porte une consigne de non-indexation pour les moteurs de recherche (D9) ; la page d'accueil n'en porte pas.
Preuves : captures des étapes 1 à 8 aux deux largeurs, sortie de l'étape 9. La règle de calcul des prix (seuil de 5 ventes, intercommunalité, arrondissements) est vérifiée par les tests du script de données, sur les vraies valeurs de Bordeaux, Strasbourg et d'une commune estimée par secteur.
