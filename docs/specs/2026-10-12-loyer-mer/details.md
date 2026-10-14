# Détails — loyer et mer
Lire d'abord [spec.md](spec.md) (décisions D-n). Révisé le 2026-10-12 : communes au lieu des aires (D10), taille de ville (D11), fiabilité du loyer (D12), mer, fleuves et pays voisins (D13), zoom sur la commune choisie (D14), noms et relief (D15), fond Plan IGN en direct (D16), retours de la relecture Figma (D17).

## Parcours
1. L'utilisateur ouvre la page, avec ou sans réglages dans l'adresse.
2. La carte s'affiche avec les réglages de départ (H1) ou ceux de l'adresse : chaque commune est colorée selon son score, ou grisée.
3. Il bouge un plafond ou coche une taille de ville : carte, liste, fiche et adresse se mettent à jour.
4. Il choisit une commune, sur la carte ou dans la liste : sa fiche s'ouvre.
5. Il copie l'adresse de la page depuis le navigateur : la même carte s'ouvre ailleurs.

## Écrans et états
### Carte — route `/` · dans l'URL : `loyer` (euros ou `aucun`), `mer` (km ou `aucun`), `taille` (liste de tailles, absente = peu importe)
Zones : carte — fond Plan IGN atténué et estompage IGN (D16), et par-dessus les communes de métropole qui passent, colorées (Paris, Lyon, Marseille d'un seul tenant) ; une commune qui ne passe pas laisse voir le fond ; cadrée au départ sur la métropole avec la Corse · réglages — plafond de loyer, plafond de mer, pastilles de taille · liste — les 10 premières · fiche — la commune choisie · légende — les 5 tranches, « Non colorée : ne passe pas », la couleur neutre « sans plafond » · pied de page — mentions de cette tranche : ANIL, Shom-IGN (noms encadrés et liens, D19), Insee, IGN – Géoplateforme (CLAUDE.md, Données), source des formes et des populations (choisies en tâche 0, leur mention ajoutée à CLAUDE.md). Disposition à 390 px : /ui.

États de la page :
- **chargement** (ouverture) → indicateur « Chargement de la carte… » (H9) ; réglages inactifs ; sort vers **classée**, **aucune commune**, **sans plafond** ou **erreur**.
- **fond indisponible** (le fond IGN ne répond pas) → communes et scores sur fond uni `background`, les communes qui ne passent pas en `area-excluded`, la mer, les pays voisins et le trait de côte avec leurs jetons (D17), légende « Ne passe pas » en gris, mention « Fond de carte indisponible » sur la carte ; tout le reste marche ; sort vers l'état normal si le fond revient (R8).
- **erreur** (données des communes non chargées, délai de H9 dépassé, ou carte impossible à afficher faute de WebGL) → « La carte n'a pas pu se charger. » et un bouton « Réessayer » ; sort vers **chargement**.
- **classée** (≥ 1 plafond actif, ≥ 1 commune passe) → communes colorées (R3), liste de 1 à 10 lignes (R5) ; sort vers **aucune commune** ou **sans plafond** selon les réglages.
- **aucune commune** (≥ 1 plafond actif, aucune commune ne passe) → aucune commune n'est colorée ; la liste dit « Aucune commune ne passe tes critères. Relâche le loyer, la mer ou la taille. » ; le compte (zone annoncée aux lecteurs d'écran) dit « Aucune commune ne passe tes critères » (D17) ; sort vers **classée** ou **sans plafond**.
- **sans plafond** (loyer et mer sur « Sans limite », et aucun proche prêt, D20) → les communes de la bonne taille (toutes si « Peu importe ») en couleur neutre, les autres non colorées, sans score ; la liste dit « Fixe un loyer ou une distance à la mer pour classer les communes. » ; le compte n'est pas affiché (D17) ; sort vers **classée** ou **aucune commune**.

États de la fiche (initial : **fermée**) :
- **fermée** → rien n'est affiché, aucune commune en évidence.
- **commune qui passe** → nom, score, rang, taille, loyer, mer (R4, R6) ; la commune est en évidence sur la carte.
- **commune qui ne passe pas** → nom, taille, l'intitulé « Ne passe pas tes critères » puis une raison par critère non tenu (R1, D17), loyer, mer ; pas de score.
- **commune sans plafond** (page **sans plafond**) → nom, taille, loyer, mer, et la raison de taille si elle ne passe pas ; ni score ni rang.
Depuis tout état ouvert : un changement de réglage fait passer la fiche dans l'état qui correspond, dans les deux sens ; choisir une autre commune remplace la fiche ; fermer → **fermée**.

Interactions : bouger un plafond ou cocher une taille → carte, liste, fiche et adresse à jour (H9) · choisir une commune, dans la liste ou sur la carte → fiche ouverte, commune en évidence, la carte zoome sur elle en ≤ 500 ms (D14) · « ← Les 10 premières » → liste, la carte revient à la France entière.

## Règles
- **R1** — Une commune passe si, pour chaque plafond actif, sa valeur affichée (loyer à l'euro, mer au km) est inférieure ou égale au plafond, et si sa taille fait partie des tailles cochées (toutes si aucune n'est cochée). Sinon elle n'est pas colorée, et sa fiche donne une raison par critère non tenu : « Loyer 1 560 € : au-dessus de ton plafond de 1 200 € », « Taille : grande ville (260 000 habitants) ». Un loyer inconnu ne fait pas échouer le loyer (D21). *Pourquoi* : voir D3, D11 ; comparer la valeur affichée évite « Mer 60 km : au-dessus de ton plafond de 60 km ».
- **R2** — La note et le score suivent D4, avec les valeurs affichées de R1 ; seuls les critères à plafond donnent une note — le loyer, la mer et, depuis la tranche proches, chaque proche prêt (D20) —, la taille ne fait que filtrer ; le score s'affiche arrondi (H3). *Pourquoi* : voir D4.
- **R3** — La couleur d'une commune qui passe suit la tranche de son score affiché : [0, 20), [20, 40), [40, 60), [60, 80), [80, 100]. *Pourquoi* : voir D5.
- **R4** — Chiffres et noms d'une commune (D8, D10, D12, et les 52 m² de STATE.md) : « Bordeaux (33) », c'est-à-dire le nom de la commune suivi de son département ; taille « Grande ville · 260 000 habitants » ; « 832 € par mois pour 52 m² (16,0 €/m²) », où le loyer est le loyer au m² exact × 52 arrondi à l'euro, de sorte que le €/m² arrondi × 52 peut différer de quelques euros ; en dessous, « Estimation du secteur (communes voisines) » quand la commune n'a pas d'estimation propre ; « 40 km de la mer à vol d'oiseau », ou « moins d'1 km de la mer » quand la distance est sous 1 km. *Pourquoi* : D8, D10, D12.
- **R5** — La liste montre au plus 10 communes qui passent, triées par score affiché décroissant (égalité : H4), sous le compte « 3 communes passent tes critères » (« 1 commune passe tes critères » au singulier). Format d'une ligne : « 1 · Portmer (17) · 72 · 650 € · moins d'1 km ». *Pourquoi* : voir D6.
- **R6** — Le rang de la fiche s'écrit « 1re sur 1 commune qui passe », « 3e sur 3 communes qui passent ». *Pourquoi* : situer une commune sans regarder la liste.
- **R7** — À l'ouverture, les réglages sont lus dans l'adresse ; une valeur absente ou invalide (H7) prend la valeur de départ de ce réglage (H1). L'adresse est alors réécrite avec les réglages effectifs, puis à chaque changement, en remplaçant l'entrée courante de l'historique sans en ajouter. `taille` liste les tailles cochées dans l'ordre de D11, séparées par des virgules : `petite-commune`, `petite-ville`, `ville-moyenne`, `grande-ville` ; elle est absente quand aucune n'est cochée. *Pourquoi* : voir D7. Un lien garde son sens même si H1 change.
- **R8** — Si le fond IGN ne répond pas, la carte affiche les communes colorées sur un fond uni, les communes qui ne passent pas en gris `area-excluded` avec la mer, les pays voisins et le trait de côte (D17), et la mention « Fond de carte indisponible » ; réglages, liste, fiche et adresse marchent comme d'habitude. *Pourquoi* : voir D16, le service extérieur ne doit pas casser le produit.

## Cas limites
- Valeur affichée égale au plafond → la commune passe avec une note de 0 pour ce critère (AC-3).
- Un seul plafond actif → le score est la note de ce critère (AC-2).
- Moins de 10 communes passent → la liste les montre toutes, avec le bon compte (AC-4, AC-11).
- Adresse avec une valeur invalide → valeur de départ pour ce réglage seulement ; un nom de taille inconnu est ignoré (AC-12).
- Distance sous 1 km → « moins d'1 km », comparée au plafond comme 1 km (AC-8).
- Population exactement sur un seuil (10 000, 50 000, 200 000) → la taille du dessus (10 000 = petite ville).
- Commune sans loyer, sans distance ou sans population → la fiche affiche « Loyer inconnu », « Distance à la mer inconnue » ou « Taille inconnue » ; si la distance ou la taille est active, la commune ne passe pas, avec cette raison ; sans loyer, elle passe (D21, R25 d'immobilier). Nombre attendu : 0 en métropole, mesuré en tâche 0.
- Défaut de l'Adour : Port-de-Lanne, Saint-Étienne-d'Orthe et Sames sortent à tort à moins de 2 km de la mer → corrigé en tâche 0, avant toute mise en ligne.
- Homonymes (deux « La Rochelle ») → le département les distingue à l'écran ; les données se joignent par code INSEE (CLAUDE.md).

## Impact sur les tranches existantes
Première tranche.

## Ne change pas
Première tranche.

## Hypothèses
- **H1** — Réglages de départ : loyer 1 200 €, mer 60 km, taille « Peu importe ». C'est l'exemple du pitch (« un loyer sous 1 200 €, la mer à moins d'une heure »), avec une heure lue comme environ 60 km.
- **H2** — Réglages : loyer de 300 à 2 000 € par pas de 50 € ; mer de 5 à 200 km par pas de 5 km ; le cran après le maximum est « Sans limite » (`aucun` dans l'adresse).
- **H3** — Arrondis et formats : score à l'entier le plus proche (0,5 vers le haut) ; loyer à l'euro ; €/m² à une décimale avec une virgule ; km à l'entier ; population au millier pour les communes de 10 000 habitants et plus, à la centaine en dessous ; espace insécable avant les milliers et avant « € » (les tests comparent après avoir remplacé les espaces insécables par des espaces).
- **H4** — À égalité de score affiché : loyer croissant, puis nom dans l'ordre alphabétique.
- **H5** — Point d'une commune, pour la mer et pour le rond du top 10 : sa mairie (D18), telle que la donne geo.api.gouv.fr. *Remplace* : son centre tel que l'a utilisé la discovery.
- **H6** — Population : la dernière population légale de l'Insee disponible en tâche 0.
- **H7** — Une valeur `loyer` ou `mer` est invalide si elle n'est ni `aucun` ni un nombre de la plage et du pas de H2 (`loyer=1234` est invalide).
- **H8** — La carte se zoome et se déplace (molette, pincement, boutons + et −). Le zoom ne fait pas partie de l'adresse.
- **H10** — Opacité des communes colorées : 88 % à l'échelle de la France, 70 % au zoom d'une ville (D17 : à 40 %, le palier 4 paraissait plus clair que le palier 1 de la légende) ; « sans plafond » à 70 % (D17 : à 45 %, 1,28:1 sur le fond).
- **H9** — Budgets : la page réagit à un réglage en ≤ 100 ms ; l'indicateur de chargement apparaît après 300 ms et reste au moins 300 ms ; au bout de 15 s sans données, on passe en **erreur**. Mesuré au build : 102 ms (version construite, processeur ralenti ×4, sans carte graphique), jugé fluide par Vincent sur son Mac le 2026-10-13 ; non mesuré sur téléphone.
- **H11** — Sous 1 024 px de large, la page prend la mise en page du téléphone (carte en haut, feuille en bas) ; une tablette aussi. *Décidé au build, gardé à la démo (2026-10-13).*
- **H12** — À 390 px : les mentions sont au bas de la feuille de la liste et ne s'affichent pas quand une fiche est ouverte ; le compte des réglages n'est lu qu'aux lecteurs d'écran (la liste l'écrit) ; dans l'état **aucune commune**, la bande de carte affiche « Aucune commune ne passe tes critères » au-dessus de la feuille. *Idem.*
- **H13** — Ronds du top 10 regroupés (D17) quand leurs centres sont à moins d'un demi-diamètre ; un clic sur un groupe zoome juste assez pour les séparer. Choisir une commune zoome sur elle au plus jusqu'au zoom 12, en 500 ms. *Idem.*
- **H14** — À l'échelle de la France, une commune plus petite qu'un pixel peut ne pas se colorer (10 au zoom 4, 1 au zoom 6) ; toutes se colorent dès le zoom 7. *Idem.*
- **H15** — Fond de secours (R8) : trait de côte simplifié à environ 500 m ; les communes y sont posées sur un fond opaque. *Idem.*
- **H16** — Une fiche ouverte prend le focus sur son titre ; le retour à la liste le rend à la ligne de la commune. *Idem.*
- **H17** — Un nombre dans l'adresse n'est valide qu'écrit en chiffres seuls (`+1200` ou `1200.0` sont invalides) ; les tailles y sont remises dans l'ordre de D11, sans doublon. *Idem.*
- **H18** — Si le navigateur refuse de réécrire l'adresse (trop de réécritures en peu de temps, curseur glissé), la page réessaie une seconde plus tard : l'adresse peut avoir quelques secondes de retard, la page ne tombe pas. *Idem.*

## Exceptions
- Accessibilité : les communes ne se parcourent pas une à une au clavier. L'accès au clavier passe par les réglages, la liste et la fiche. Une commune hors du top 10 ne s'atteint qu'à la souris ou au doigt, jusqu'à la recherche par nom (Pas maintenant).

## Vérification de bout en bout
Sur la version en ligne, en largeur bureau et à 390 px :
1. Ouvrir `/` : l'adresse devient `/?loyer=1200&mer=60`. La fiche de Bordeaux affiche « Grande ville », « 832 € par mois pour 52 m² (16,0 €/m²) » et « 39 km de la mer à vol d'oiseau » ; celle de La Rochelle « moins d'1 km de la mer » (mesurées depuis la mairie, D18 ; la discovery du 2026-10-11 mesurait depuis le centre : 40 km et 1 km).
2. Passer le loyer à 800 € : Bordeaux devient grise et sa fiche dit « Loyer 832 € : au-dessus de ton plafond de 800 € » ; l'adresse contient `loyer=800`.
3. Cocher « Petite ville » : Bordeaux est grisée avec « Taille : grande ville » ; l'adresse contient `taille=petite-ville`.
4. Copier l'adresse, l'ouvrir dans une fenêtre privée : mêmes réglages, même liste.
5. Les mentions de la tranche sont visibles dans le pied de page.
Preuves : captures d'écran des étapes 1 à 5, aux deux largeurs.
