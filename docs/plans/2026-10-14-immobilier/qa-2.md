# Relecture navigateur 2 — immobilier (2026-10-14)

Complète `qa.md` (non refait). Application : http://localhost:5174/ (vraies données, fond IGN), Chromium avec fenêtre. Captures : `docs/plans/2026-10-14-immobilier/captures/qa2-*.png`. Aucun fichier du projet modifié. Pas de proche ajouté.

## Constats

Aucun **Bloquant**. Aucun **Majeur**.

### Mineur 1 — Échap ne ferme pas la fiche (à confirmer)
- Largeur : 375 × 548. Étapes : `/?achat=3700&mer=60&unite=m2&bien=maison`, onglet « Les 10 premières », cliquer « Trégarvan », presser Échap.
- Attendu : règles d'interface (`ui.md`) : je n'ai pas relu si Échap y est exigé ; c'est l'usage pour un panneau qui remplace un autre.
- Observé : la fiche reste ouverte, le focus est sur le titre (H2). Le retour passe par le bouton « ← Les 10 premières ». Capture : `qa2-375x548-fiche.png`.
- À trancher : la spec le demande-t-elle ? Sinon, pas un écart.

### Mineur 2 — Surface invalide : toujours aucun signe (confirme Mineur 1 de qa.md) à 390
- Largeur : 390. Étapes : Louer · Maison · Total, taper « 5 » dans « Surface en m² ».
- Observé : champ à 5, carte et plafond inchangés (`loyer=1200`, `surface=52`), pas de `aria-invalid`, bordure inchangée (rgb(221,216,207)). Capture : `qa2-390-louer-total-surface-5.png`.

### Mineur 3 — Ronds du top 10 sous la légende, aussi à 375 × 548 en Acheter
- Largeur : 375 × 548. Étapes : `/?achat=3700&mer=60&unite=m2&bien=maison` → le rond « 1 » (Trégarvan) et « 3 · 8 · 9 » sont partiellement cachés par la légende. Capture : `qa2-375x548-liste.png`. Même cause que Mineur 3 de qa.md.

### Mineur 4 — URL « achat=1010000 » réécrite en `achat=5000` (Au m²)
- Largeur : 1 440. Étapes : ouvrir `/?achat=1010000&mer=aucun&taille=grande-ville`. L'URL devient `?achat=5000&mer=aucun&taille=grande-ville` (la valeur est lue en €/m² faute d'`unite=total`, puis ramenée au maximum). Pas d'erreur ; c'est le comportement « valeur hors plage → bornée ». Noté seulement parce que « Sans limite » en Total s'écrit `achat=aucun`, pas la valeur max.

## Ce qui est conforme (vu dans ce passage)
- **Conversion Louer** (390) : Maison, 1 200 € pour 52 m² → Au m² : « 23 €/m² par mois » (URL `loyer=23&unite=m2`) → Total : « 1 200 € par mois pour 52 m² ». Même après une surface invalide « 5 » tapée, la conversion part de 52 m² (dernière valeur valide). Fait à 390, pas au bureau (la logique est la même, non revérifiée à 1 440).
- **Curseur du prix au clavier** (390, Acheter · Total) : → +10 000 €, ← −10 000 €, Page haut +100 000 €, Page bas −100 000 €, Fin = « Sans limite » (`achat=aucun`, texte « Sans limite »), Début = 50 000 €. Capture : `qa2-390-acheter-sans-limite.png`.
- **Ordre du focus (1 440)** : de « Surface en m² » en arrière : « Au m² » → « Total » → curseur du prix. Contour de focus 2 px solid sur chacun. Entrée sur le curseur n'a pas d'effet de bord.
- **Réglages 390** : Louer · Maison · Au m² (capture `qa2-390-louer-maison-m2.png`), résumé replié « Louer · Maison · 23 €/m² » (`qa2-390-repliee-louer-m2.png`), « Total » et « Au m² » 89 × 44, « Appartement » / « Maison » 175 × 44, onglets 173 × 44, « Logement » 358 × 44, champ surface 44 × 44, « Ajouter » 79 × 44 : toutes les cibles de réglage ≥ 44.
- **Liste à 390** (Louer · Maison · Au m²) : « 7,2 €/m² · 1 km » avec score ; compte 8 053 (`qa2-390-liste-louer-maison.png`).
- **Fiche Strasbourg en Louer, 390** (voir ci-dessous) : « 33 / 100 », « 5e sur 10 communes qui passent », « 809 € par mois pour 52 m² (15,6 €/m²) », « 468 km de la mer à vol d'oiseau », forme colorée et cadrée sur la carte. Capture : `qa2-390-fiche-strasbourg-louer.png`.
- **375 × 548** : Acheter · Au m² · Maison s'ouvre avec la poignée du curseur à 519–537 px (visible, vh 548) ; en Total (Maison → 92 m², 340 000 €) elle est à 370–388 px, avec segmenté et surface dans la feuille après défilement (`qa2-375x548-acheter-total-surface.png`). Résumé replié et onglet liste (`qa2-375x548-liste.png`) : lisibles. Fiche dans la feuille (« Trégarvan (29) », « 1re sur 7 396 communes qui passent », « 82 000 € pour 92 m² (891 €/m²) ») : `qa2-375x548-fiche.png`.
- **Contrat de design** (mesuré, 390 et 1 440) : `valeur-curseur` = 16 px gras (700) sur le prix (« 350 000 € », « 260 000 € »), la mer (« 60 km », « 30 km ») et « Sans limite ». Panneau de réglages 340 px de large, radius 12 px (`radius-panel`), padding 16, bordure 1 px rgb(221,216,207). Bascules et tuiles : radius 8 / 10 (`radius`, `radius-chip`) ; feuille : coins hauts 16 (`radius-sheet`) ; tête de feuille 47 px. Tailles de texte : 12 (catégorie, secondaires), 13 (pastilles, segmenté), 15 (bascules Louer/Acheter 600, « Ajouter »), 11 (mentions) = tous des styles du contrat. Texte secondaire rgb(91,102,100) : environ 5,5:1 sur blanc, au-dessus de 4,5:1 (calcul de ma part, pas un outil de contraste).
- **Adresse dans un nouveau contexte** (navigateur redémarré, sans état) : `/?achat=350000&mer=30&unite=total&surface=70&bien=maison` reprend Maison, Total, 70 m², « 350 000 € pour 70 m² », 30 km, 4 443 communes ; les 10 premières s'affichent (62 000 € · moins d'1 km … 107 000 €). Capture : `qa2-bureau-nouveau-contexte-maison.png`. Pas de fenêtre privée au sens strict (l'outil n'en a pas) : redémarrage du navigateur à la place. Les 10 premières n'ont pas été comparées une à une avec la session précédente (ordre et score non relevés avant redémarrage).
- Console : pas d'erreur de script vue dans ce passage (non lue en détail, hors `qa.md`).

## Strasbourg
- **En Louer** : atteinte par `/?loyer=1200&mer=aucun&taille=grande-ville` → « Les 10 premières » → « 5 · Strasbourg (67) · 33 · 809 € · 468 km » (fiche en conforme, ci-dessus).
- **En Acheter : non atteinte.** L'outil ne clique pas à un point de la carte, et changer de réglage ferme la fiche. Strasbourg ne passe pas en Acheter avec `taille=grande-ville` : seules 9 communes passent (Marseille, Toulouse, … Nice) parce que le prix d'Alsace-Moselle est inconnu et qu'aucun autre critère ne la note ; c'est cohérent avec les règles de `qa.md`. Le message de fiche d'Alsace-Moselle a été vu sur Lauterbourg (`qa.md`). La recherche d'adresse « Strasbourg » aurait appelé un service extérieur : non faite. À regarder à la main.

## Écran × état × largeur vérifiés (ce passage)
| Écran / état | 1 440 | 390 | 375 × 548 |
|---|---|---|---|
| Louer · Maison · Au m² | non | oui | non |
| Louer · Total + surface invalide (5) | non (qa.md) | oui | non |
| Conversion Louer Total ↔ Au m² | non | oui | non |
| Acheter · Maison · Au m² / Total | non | texte (Sans limite : capture) | oui (captures) |
| Plafond « Sans limite » (prix) | non (qa.md) | oui | non |
| Résumé replié | non | oui | oui (accès à la liste, résumé en capture non relu) |
| Onglets Critères / Les 10 premières | non | oui | oui |
| Fiche dans la feuille | non | oui (Strasbourg, Louer) | oui (Trégarvan, Acheter) |
| Poignée du curseur visible | non | oui | oui |
| Clavier curseur du prix (flèches, Page, Début, Fin) | non | oui | non |
| Focus Surface → Au m² → Total → curseur (inverse) | oui | non | non |
| Nouveau contexte (adresse) | oui | non | non |
| Contrat (largeur 340, rayons, texte 16 gras, contraste) | oui | oui | non |

## Non vérifié
- **Toucher** : l'outil n'émule pas le toucher (pas de tap, pas de glisser). Le 375 × 548 a été vu en petite fenêtre avec la souris ; le glisser de la feuille et les zones de toucher des poignées (18 px visuels) ne sont pas testés.
- Strasbourg en Acheter (voir plus haut).
- Surface invalide, « Sans limite » et fiche « ne passe pas » à 375 × 548 ; Louer et Au m² à 375 × 548 ; liste en Acheter · Au m² à 390.
- Clavier : curseur de la mer et de la taille, groupes « Louer ou acheter », « Type de logement », « Unité du prix » à la souris seulement (focus seul vérifié sur « Total » et « Au m² ») ; la barre d'espace ; ordre complet du focus au bureau (reste de `qa.md`).
- Valeur du curseur « proches » (`valeur-curseur`) : aucun proche ajouté ; vérifier dans le code.
- Largeur du panneau de liste (320) et contrastes mesurés avec un outil : non faits ; seules des couleurs lues dans le navigateur, calcul de contraste à la main.
- Conversion Louer au bureau (1 440) : fait seulement à 390.
