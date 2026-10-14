# Relecture navigateur — immobilier (2026-10-14)

Application : http://localhost:5174/ (vraies données, fond IGN), Chromium avec fenêtre (WebGL). Références : prototype F (`docs/design/immobilier/directions/F-*.png`), `details.md`, `progress.md`. Captures : `docs/plans/2026-10-14-immobilier/captures/qa-*.png`.
Rapport écrit en fin de budget : la passe est **incomplète** (voir « Non vérifié »). Aucun fichier du projet modifié.

## Constats

Aucun **Bloquant**. Aucun **Majeur** établi.

### Mineur 1 — Surface hors plage : aucun signe que la valeur tapée n'est pas prise en compte
- Largeur : 1 440 (non essayé à 390). Étapes : Acheter, Total, taper « 5 » dans le champ surface.
- Attendu : le champ montre ce qui est tapé, la carte garde la dernière surface valide (details.md). C'est le cas (URL inchangée `surface=70`, liste en 70 m², retour à 70 en quittant le champ, champ vide idem).
- Observé : rien d'autre ne dit que 5 est refusé (pas de `aria-invalid`, pas de texte). La spec ne demande pas de signe, c'est un manque de retour, pas un écart.
- Capture : `qa-bureau-surface-saisie-5.png`. Correction possible : `aria-invalid` et bordure d'alerte (pas de couleur seule).

### Mineur 2 — Communes en couleur neutre (sable) sans ligne de légende
- Largeur : 1 440. Étapes : `/?achat=50000&mer=aucun&unite=total&surface=300` (état « aucune commune »), ou `?achat=3700&mer=aucun` (Alsace-Moselle en sable).
- Attendu : H60, légende inchangée ; la décision est notée « à juger à la démo » dans progress.md.
- Observé : la page dit « Aucune commune ne passe tes critères » alors que des communes sont peintes en sable ; la légende ne montre que « Score 0 → 100 » et « Non colorée : ne passe pas » (en « sans plafond » seulement, elle dit « Sans plafond : pas de score »). Un utilisateur ne sait pas ce que veut dire le sable. La légende garde aussi « Score 0 → 100 » quand personne n'a de score.
- Capture : `qa-bureau-aucune-commune-acheter.png`. À trancher par Vincent.

### Mineur 3 — Ronds du top 10 couverts par la légende à 375 × 548
- Largeur : 375 × 548. Étapes : ouvrir `/` (Louer) ; les ronds « 4·5·6 » et « 9·10 » passent sous la légende en haut à gauche.
- Observé : confirme la remarque de la tâche 5. La liste (onglet « Les 10 premières ») donne la même information ; mineur parce que la carte ne fait là que 210 px.
- Capture : `qa-375x548-louer.png`.

### Mineur 4 — Cibles sous 24 px (déjà là avant la tranche)
- Largeur : 390. Mesuré : ronds de la carte 22 px de haut (35 × 22, 52 × 22, 75 × 22 ; un rond seul 22 × 22), liens du pied de page « Shom » 37 × 17, « IGN » 27 × 17, « © IGN – Géoplateforme » 106 × 15. Les poignées de curseur font 18 px (zone de toucher non mesurée). Toutes les bascules, tuiles de bien, onglets et le champ surface font au moins 44 px.
- Pas dû à immobilier ; à noter pour le contrat (cible ≥ 24 px).

### Mineur 5 — Favicon introuvable (404)
- Console du serveur de dev : `GET /favicon.ico` 404. Une erreur 401 (« Unauthorized ») apparaît aussi au premier chargement ; je n'ai pas identifié la ressource (probablement une tuile ou un service extérieur ; non vérifié).

## Ce qui est conforme
- Réglage du prix : départ Appartement · Louer · Total · 52 m² · 1 200 € ; `/?loyer=1200&mer=60`. Acheter → Au m², 5 000 €/m², URL `achat=5000` ; Total → 260 000 € et champ surface (52) ; surface 70 → `surface=70`, plafond gardé, montants recalculés (Galéria 57 000 € pour 818 €/m²) ; Au m² → 3 700 €/m² (260 000 ÷ 70 arrondi au cran) ; Total avec Maison et 70 m² → 350 000 € (`achat=350000&unite=total&surface=70&bien=maison`) ; Louer · Au m² · Maison à 23 €/m² (`unite=m2`).
- « Sans limite » : plafond du prix et de la mer, texte « Sans limite » ; état « sans plafond » : « Fixe un prix d'achat ou une distance à la mer pour classer les communes. » avec légende « Sans plafond : pas de score ».
- État « aucune commune » en Acheter : « Aucune commune ne passe tes critères. Relâche le prix, la mer ou la taille. » (liste et compte du panneau).
- Fiches : commune qui passe (« 1re sur 7 854 communes qui passent », « 891 €/m² à l'achat » puis « 62 000 € pour 70 m² (891 €/m²) » en Total) ; commune qui ne passe pas (« Mer 234 km : au-dessus de ton plafond de 60 km ») avec « Estimation du secteur (moins de 5 ventes dans la commune) » (Ajain) ; commune d'Alsace-Moselle (Lauterbourg, 67) « Prix d'achat inconnu : les ventes ne sont pas publiées en Alsace-Moselle », sans score ni rang quand rien d'autre ne la note, et « ne passe pas » quand la mer est à 5 km ; commune avec score et prix inconnu (Île-de-Sein) « Prix d'achat inconnu : trop peu de ventes dans le secteur » et 2e sur 3. Avec prix et mer qui notent, les communes sans prix viennent bien après celles qui en ont.
- Résumé de catégorie repliée, bureau et 390 : « Acheter · Maison · 70 m² · 350 000 € », « Louer · Maison · 23 €/m² », « Acheter · Appartement · 52 m² · 260 000 € » (conforme à F-repliee).
- Mise en page bureau et 390 conformes à F (bascules, tuiles de bien, curseur, segmenté d'unité, champ surface + « m² », feuille avec onglets) ; à 375 × 548 la poignée du curseur est à 518–536 px, entièrement visible (Louer) et visible en Acheter · Total.
- Clavier : l'ordre de Tab va de la carte et des ronds au panneau (Logement, Louer, Acheter, Appartement, Maison, curseur du prix, Total, Au m², Surface, Mer, curseur, Taille…) ; contour de focus visible partout (2 px sombre). Groupes nommés « Louer ou acheter », « Type de logement », « Unité du prix » ; curseurs « Loyer mensuel, loyer maximum », « Prix d'achat, prix maximum » et « … au m² » ; champ « Surface en m² » ; bascules en `aria-pressed`.
- Adresse : l'URL suit chaque choix ; chaque URL ouverte à la main (achat, mer=aucun, unite, bien, surface) reprend les mêmes réglages. Une URL avec `mer=aucun` ou un `taille` inconnu : valeurs de départ, pas d'erreur.
- Pied de page : mention des ventes (DGFiP, Etalab, 2023 à 2025, 2021 à 2025 sous 30 ventes).
- Console : aucune erreur de script ; seulement le 404 du favicon et le 401 de Mineur 5.

## Écran × état × largeur vérifiés
| Écran / état | 1 440 | 390 | 375 × 548 |
|---|---|---|---|
| Louer · Appartement · Total (départ) | oui | oui | oui |
| Acheter · Appartement · Au m² | oui | oui (texte) | non |
| Acheter · Total + champ surface | oui | oui | oui |
| Louer · Au m² · Maison | oui | non | non |
| Surface valide (70) | oui | non | non |
| Surface en cours de saisie (5, vide) | oui | non | non |
| Plafond « Sans limite » (prix et mer) | oui | non | non |
| Résumé catégorie repliée | oui | oui | non |
| Fiche qui passe | oui | oui | non |
| Fiche qui ne passe pas (+ estimation du secteur) | oui | non | non |
| Fiche Alsace-Moselle sans note / ne passe pas | oui | non | non |
| Fiche prix inconnu avec score | non | oui | non |
| Liste des 10 premières | oui | oui | non |
| Aucune commune (Acheter) | oui | non | non |
| Sans plafond (Acheter) | oui | non | non |
| Clavier (ordre, focus, groupes, noms) | oui | non | non |
| Cibles 44 px | non | oui (mesure) | non |
| Poignée du curseur visible | non | non | oui |

## Non vérifié
- **Strasbourg** elle-même : je n'ai pas pu cliquer sur la carte à un point donné ; j'ai vérifié l'état avec Lauterbourg (67), même message d'Alsace-Moselle. Strasbourg en Acheter reste à regarder.
- Louer · Au m² et Maison à 390 et à 375 × 548 ; Acheter · Au m² à 375 × 548 ; liste, fiche, états « aucune commune » et « sans plafond » à 390 et 375 × 548 ; feuille ouverte à 375 × 548 (défilement pour atteindre le segmenté d'unité et la surface).
- Conversion au changement d'unité en Louer (1 200 € → 23 €/m² → 1 200 €) ; changement de bien en Maison avec surface 92 par l'adresse ; adresse relue après rechargement dans une fenêtre privée (l'URL se rouvre à l'identique, mais pas testé en fenêtre privée).
- Clavier : curseurs aux flèches et fin de plage (Home a bien mis la mer à 5 km ; le test de la touche End sur le prix a lu une valeur vide à cause d'un focus déplacé, à refaire) ; Entrée sur les bascules ; Échap sur la fiche.
- Vérification contre le contrat de design (valeurs arbitraires dans le CSS, polices) : non faite. Contraste et couleur non seule : non mesurés.
- Cas avec un proche : non fait, comme demandé (aucune adresse envoyée).
- Rendu des Alsace-Moselle en sable sur la carte et top 10 à grande échelle : vus sur les captures, sans mesure de couleur.
