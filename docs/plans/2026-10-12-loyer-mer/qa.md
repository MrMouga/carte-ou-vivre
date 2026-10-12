# QA navigateur — loyer-mer

Données réelles, serveur de dev (localhost:5173), IGN en direct. Largeurs 1440 et 390. Captures : `docs/plans/2026-10-12-loyer-mer/captures/qa/`.
Note : `src/App.tsx` a changé pendant ma passe (réécriture de l'adresse après 1 s) ; mes constats ont été faits avant ce changement et je n'ai pas tout refait.

## Bloquant
Aucun.

## Majeur

[Majeur] Au démarrage, les grandes villes qui passent (Bordeaux, Nantes, Marseille…) ont l'air de ne pas passer — l'utilisateur lit « Bordeaux est blanc »
  Où : carte, 1440, `/?loyer=1200&mer=60`, vue France entière. Capture : 01-normal-1440.png (comparer 07-fiche-bordeaux-1440.png : Bordeaux passe, 5e sur 6 avec « Grande ville »)
  Attendu : une commune qui passe est colorée (R1, R3). Vu : à l'échelle de la France, la commune de Bordeaux fait quelques pixels, elle disparaît dans un « trou » blanc au milieu de la bande côtière colorée. Seuls les ronds du top 10 aident, et Bordeaux n'y est pas.
  Correction : à ce zoom, ajouter un contour ou un point minimal pour les communes qui passent, ou le dire dans la légende.

[Majeur] 390 px : quand aucune commune ne passe, rien ne l'explique à l'écran sans faire défiler la feuille
  Où : 390, `/?loyer=300&mer=5&taille=grande-ville`. Capture : 26-aucune-390.png
  Attendu : état « aucune commune » lisible (details.md). Vu : le compte est invisible (réservé aux lecteurs d'écran, décision du builder), le message « Aucune commune ne passe tes critères. Relâche… » est dans la liste, sous les réglages, hors de l'écran. L'utilisateur qui bouge un curseur voit une carte vide sans raison. Même effet pour le compte « N communes passent » en état normal.
  Correction : garder le compte visible dans l'en-tête de la feuille, ou remonter le message.

## Mineur

[Mineur] « Aucune cochée : peu importe » reste affiché quand une taille est cochée
  Où : réglages, 1440 et 390, `?taille=grande-ville` ou `petite-ville,grande-ville`. Captures : 06-grande-ville-1440.png, 11-aucune-commune-1440.png, 26-aucune-390.png
  Attendu : le texte n'est vrai que sans pastille cochée. Correction : le masquer ou le changer (« Grande ville seulement »).

[Mineur] Contour de la commune choisie incomplet quand elle ne passe pas
  Où : 1440, fiche Bordeaux à 800 €. Captures : 08-bordeaux-ne-passe-pas-1440.png, 09-petite-ville-1440.png
  Vu : le double contour n'apparaît que par morceaux (surtout là où le voisin est coloré) ; la commune est difficile à situer. Quand elle passe (07) le contour est correct.

[Mineur] Ronds du top 10 : 22 px de haut (< 24 px), et ordre du clavier inversé
  Où : 1440, Tab depuis la carte : groupe « 5…10 », puis 4e, 3e, 2e, 1re, puis zoom. Les ronds passent avant les réglages (connu du builder). Cibles de 22 px sous le seuil de 24.

[Mineur] Échap ne ferme pas la fiche (Entrée sur une ligne : focus sur le titre, retour : focus sur la ligne — conforme). La spec ne l'exige pas, la discipline de test l'attend ; « ← Les 10 premières » reste le moyen.

[Mineur] Console : 1 réponse 401 à chaque chargement (source non identifiée), et les 404/échecs des tuiles d'estompage IGN (déjà connus). La page n'est pas affectée.

## Ce qui est conforme
- Étape 1 de bout en bout (1440) : adresse `/?loyer=1200&mer=60` ; Bordeaux « Grande ville · 268 000 habitants », « 832 € par mois pour 52 m² (16,0 €/m²) », « 40 km de la mer à vol d'oiseau », « 5e sur 6 communes qui passent » (07). Étape 2 : 800 € → « Loyer 832 € : au-dessus de ton plafond de 800 € », `loyer=800` (08). Étape 3 : Petite ville → « Taille : grande ville (268 000 habitants) », `taille=petite-ville` (09). Étape 4 : une adresse rechargée redonne les mêmes réglages et la même liste ; valeurs invalides (`loyer=1234&mer=abc&taille=foo,…`) corrigées par la valeur de départ et l'adresse réécrite. Étape 5 : mentions visibles aux deux largeurs (01, 22).
- États atteints : classée, fiche qui passe (02), retour à la liste avec le focus sur la ligne (03), fiche qui ne passe pas, aucune commune (11, 26), sans plafond (10, 27 : couleur sable, message, compte masqué, légende). Fiche à 390 px (23). Focus visible 2 px sur tous les arrêts Tab ; liste, curseurs (flèches), pastilles au clavier.
- Rang, formats (espaces, « moins d'1 km », « Estimation du secteur »), copie des messages conformes à R4–R6.

## Non vérifié
- Chargement, erreur + « Réessayer », sans WebGL, fond IGN en panne (« Fond de carte indisponible ») : impossibles à provoquer avec studio-browse (blocage réseau refusé, pas de coupure WebGL). Je n'ai pas relu les captures du builder 5b-*.png pour cette passe.
- Fiche « ne passe pas » et fiche « sans plafond » à 390 px : atteignables seulement en touchant une commune sur la carte ; le clic par coordonnées n'est pas possible dans l'outil. Fiche « sans plafond » à 1440 aussi.
- Comparaison pixel à pixel avec les frames Figma (5:2, 5:154, 5:235, 5:314, 7:343, 7:488, 11:667, 9:514) : non faite (outil Figma non utilisé dans cette passe) ; seule la cohérence avec la spec et le contrat a été jugée.
- Noms très longs : plus long vu « Saint-Jean-de-la-Rivière (50) », qui tient à 1440 et 390 ; pas de test sur un nom de 40+ caractères.
- Contrat de design (valeurs arbitraires dans le CSS rendu) : non inspecté. Réaction ≤ 100 ms, téléphone : non testés. Comportement après le changement récent d'`App.tsx` (réécriture de l'adresse à 1 s) : non revérifié.
- Le navigateur n'a pas pu être arrêté proprement (`studio-browse stop` : connexion perdue).
