# QA navigateur — cadre-de-vie (2026-10-15)

Application : http://localhost:4180 (version construite, vraies données). Outil : studio-browse en mode avec fenêtre (WebGL).

**Limite importante de cette passe.** Les captures de l'outil montrent « La carte n'a pas pu se charger » avec tous les réglages grisés et désactivés, alors que la page vivante (lue par le DOM, `snapshot`, `js`) avait sa carte et ses boutons actifs. Les captures ne reflètent donc pas l'état réel (couleurs pâles = boutons désactivés). Je n'ai jugé l'aspect que sur les mesures du DOM et sur la disposition. La carte elle-même (couleurs des communes, ronds du top 10) n'a pas été vue.

## Bloquant
Aucun constat.

## Majeur
Aucun constat confirmé.

## Mineur / à noter
1. **La carte peut passer en « n'a pas pu se charger » au rechargement dans la même session** (1440 × 900, `/`, plusieurs `goto` de suite ; vu aussi pendant le test clavier). C'est probablement la perte du contexte WebGL de l'outil (documentée dans docs/solutions), pas un défaut de l'application : non tranché. Quand la carte échoue, tous les réglages sont désactivés (voulu, R8 ?) : à confirmer avec Vincent que c'est bien le comportement attendu.
2. **Textes de l'état « sans plafond » et « aucune commune » ne parlent pas de la montagne** (`/?loyer=aucun&env=bourg-et-village` : « Fixe un loyer ou une distance à la mer pour classer les communes. » ; `/?loyer=300&mer=10&montagne=10&env=ville-dense` : « Relâche le loyer, la mer ou la taille. »). Conforme à D8 (décision de Vincent, « conseil incomplet accepté »), donc pas un défaut ; signalé seulement parce que la montagne note désormais.
3. Le décompte « N communes passent tes critères » existe deux fois dans le texte de la page (panneau et en-tête de liste) : normal si l'un est masqué aux lecteurs d'écran ; non vérifié.

## Ce qui est conforme (vu dans le navigateur)
- `/` : adresse réécrite en `/?loyer=1200` ; « Cadre de vie » ouverte, tout sur « Peu importe », liste classée par le prix seul (Allarmont, 326 €, score 73) ; 34 674 communes (R32, D7).
- Ordre des groupes : Taille de la commune, Type d'environnement, Mer à moins de, Montagne à moins de ; groupe nommé « Proximité avec la nature ».
- 1440 : tailles en 2 × 2 (149 × 44), types qui passent à la ligne (28 px de haut, ≥ 24), cases collées 60 × 44 ; aucun libellé coupé (scrollWidth ≤ clientWidth).
- 390 × 844 et 375 × 548 : tailles 4 cases de 84 / 80 px × 44, mer et montagne 5 cases de 70 / 67 × 44, types sur une ligne qui défile (`overflow-x: auto`, `nowrap`, contenu 490 px) ; cibles toutes à 44 px ; aucun libellé coupé ; pas de défilement horizontal de la page ; à 375 × 548 le curseur du prix est à 519–537 px sur 548 (entièrement visible, H48).
- Montagne « 10 km » : adresse `/?loyer=1200&montagne=10`, 936 communes, liste mise à jour.
- Fiche de Bordeaux (`/?loyer=1200&mer=50&taille=grande-ville&env=ville-dense`, 6 communes) : « Ville dense · 268 000 habitants », « 39 km de la mer à vol d'oiseau », « 173 km de la montagne à vol d'oiseau », « 5e sur 6 communes qui passent » (R30).
- Adresses anciennes ou abîmées : `mer=60` → `mer=100` ; `mer=25` → `mer=30` ; `mer=200&montagne=0&env=village` → `/?loyer=1200` ; `mer=23` et `mer=0` → `/?loyer=1200` ; `mer=5&montagne=abc&env=campagne-isolee,ville-dense,ville-dense,xx&taille=grande-ville,petite-commune` → `/?loyer=1200&mer=10&taille=petite-commune,grande-ville&env=ville-dense,campagne-isolee` (ordre R27, doublon et nom inconnu retirés) (R31).
- `/?loyer=aucun&env=bourg-et-village` : état sans plafond (« Sans plafond : pas de score », liste vide avec texte D8), case « Bourg et village » cochée.
- Aucune commune (`/?loyer=300&mer=10&montagne=10&env=ville-dense`) : annonce « Aucune commune ne passe tes critères » dans une zone `role=status`.
- Pied de page : « Type d'environnement : Insee, grille communale de densité 2025 (mise en ligne le 21/07/2025) » et « Zone de montagne : Cerema, communes soumises à la loi Montagne (2019) » présentes (H80, R30).
- Clavier (partiel) : les cases Mer/Montagne sont des `role=radio` avec tabindex itinérant (0 sur la case cochée, −1 sur les autres) ; outline de focus 2 px solide.
- Console : 2 erreurs de ressource sans effet visible (une 401, une 404 « Failed to load resource »), non identifiées (je n'ai pas relevé l'URL) ; aucune erreur de script vue.

## Non vérifié / Non parcouru
- **Toutes les captures d'état utiles** (voir la limite en tête) : la carte colorée, le dépliage et le repli de « Cadre de vie », l'aspect des cases cochées, la comparaison visuelle avec les captures F-*.png. À refaire par Vincent ou avec un moyen de capture qui voit la fenêtre réelle.
- Résumé replié (« 2 tailles · Mer 50 km », « 1 type », « Montagne 30 km », « Peu importe ») : non vu.
- Fiche de Chamonix-Mont-Blanc (« Commune de montagne ») : non atteinte (aucun moyen d'ouvrir une fiche hors du top 10 sans cliquer la carte ; Chamonix, 1 334 € pour 52 m², est dernier des communes du même type, hors du top 10).
- Fiche d'une commune écartée par le type ou la taille (raisons R27) et fiche en sans plafond : non atteintes, même raison.
- Fiche en Acheter au prix tous biens (Desvres, 62 : source `tous-biens` dans achat.json) : non atteinte ; Acheter lui-même s'ouvre (`/?achat=5000`).
- Clavier seul complet : Espace/Entrée sur les cases à bascule, flèches dans les radios (une flèche droite a été envoyée mais l'état de la carte était tombé, boutons désactivés), ordre de tabulation de bout en bout, focus visible sur chaque groupe.
- Largeur 390 et 375 : seulement par mesures ; pas de feuille ouverte/fermée, pas de défilement à doigt, pas de vrai toucher.
- Mentions : lecture du texte seulement, pas de contrôle visuel de lisibilité (contraste, retours à la ligne).
- Captures : 01-depart-1440.png et 03-ouverture-375x548.png sont celles de la carte en échec (réglages grisés) ; ne pas les prendre pour l'état réel.

Captures : `docs/plans/2026-10-15-cadre-de-vie/captures/qa/01-depart-1440.png`, `03-ouverture-375x548.png`.
