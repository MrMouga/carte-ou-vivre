# QA navigateur — proches fiables (2026-10-16)

Site : http://localhost:5173 (serveur de développement, vraies données), navigateur réel avec fenêtre (WebGL). Bureau 1 440 × 900 et 390 × 844 (partiel, km, recalcul ; prêt en fiche).

**Méthode des pannes.** studio-browse n'a pas de « route » réseau : j'ai remplacé `window.fetch` dans la page, après chargement, pour ne toucher que `/navigation/isochrone` (75 min : erreur 502 à chaque essai ; 120 et 180 min : aucune réponse ; ou échec réseau total ; ou aucune réponse). Recherche d'adresse et fond de carte : réels. Conséquence : je n'ai pas pu poser de panne *avant* le chargement de la page (réouverture avec IGN en panne). Aucune requête n'a contenu le nom du proche (vérifié sur les 146 requêtes géoplateforme de la page : 0 avec « Léa » ou « Parents »).

## Constats

Aucun Bloquant, aucun Majeur observé.

[Mineur] Après le choix d'une suggestion d'adresse à la touche Entrée, le focus revient dans le champ « Adresse ou ville », pas dans « Nom » qui vient d'apparaître — l'utilisateur au clavier doit Tab pour atteindre « Nom » puis « Ajouter ». Dans mon premier essai, la séquence Tab, sélection du texte, saisie du nom, Tab, Entrée a fini sur la liste (un clic sur « Allarmont » a ouvert sa fiche) et le nom est resté « Nantes (44) » ; je n'ai pas su isoler si c'est mon enchaînement (raccourci de sélection Meta+a possiblement sans effet dans ce navigateur) ou l'ordre de focus. Refait proprement (champ Nom rempli, Tab, Entrée sur « Ajouter ») : fonctionne.
  Où : Tes proches, ajout, bureau   Capture : aucune
  Attendu : parcours d'ajout au clavier sans détour   Correction : à vérifier avec un relecteur ; envisager de mettre le focus sur « Nom » après le choix.

[Mineur] Les boutons « Recalculer avec l'IGN » et « Retirer » font 24 px de haut en bureau (121×24 et 45×24) : conforme au seuil de 24 px de la règle, mais petits et de texte gris clair (contraste non mesuré). À 390 px, « Retirer » mesure 45×44 : conforme.
  Où : ligne d'un proche, bureau   Capture : captures/qa-bureau-1-partiel-plus-de.png

[Mineur] À 390 px, la poignée du curseur d'un proche mesure 18×18 px (« Plafond de Nantes (44) ») : sous les 44 px du reste de la ligne (« Recalculer » 121×44, « Retirer » 45×44). Composant existant, non propre à cette tranche ; la piste reste touchable, je n'ai pas testé le doigt.
  Où : ligne d'un proche, 390 px   Capture : captures/qa-390-1-partiel.png

## Ce qui est conforme (vu)
- **390 px** : partiel (deux phrases, curseur, « Recalculer avec l'IGN », « Retirer » visibles dans la feuille, onglet Critères) : captures/qa-390-1-partiel.png ; km (« 120 km », « À vol d'oiseau : l'IGN ne répond pas. », curseur) : captures/qa-390-2-km.png ; recalcul (« Recalcul avec l'IGN… » affiché) : captures/qa-390-recalcul.png. Aucun texte coupé.
- **Partiel** (étape 1) : « Temps approximatifs : l'IGN n'a pas tout donné. » puis « Au-delà de 2 h 45 : l'IGN n'a pas répondu. », « Recalculer avec l'IGN », « Retirer » ; curseur borné à 2 h 45 (aria-valuemax 165, la touche Flèche droite s'arrête à « 2 h 45 au plus ») ; fin du calcul à environ 47 s après l'ajout (mesure à l'ordinateur, pas à la seconde) ; 13 demandes : les 12 zones, puis un second essai de la zone 75 min. Fiche La Rochelle : « Nantes (44) : jusqu'à 2 h 15 en voiture » ; une commune hors couverture : « plus de 2 h 45 en voiture », raison « plus de 2 h 45 : au-dessus de ton plafond de 2 h » ; pastille « jusqu'à 2 h 15 » / « plus de 2 h 45 · au-dessus de 2 h ». Captures : captures/qa-bureau-1-partiel-fiche.png, qa-bureau-1-partiel-plus-de.png.
- Curseur déplacé : aucune nouvelle demande réseau.
- **Réouverture** (< 15 min) : le proche partiel revient partiel, avec ses deux phrases, sans recalcul ni « Calcul des trajets ».
- **Retirer** : le proche disparaît ; le focus va dans le champ d'adresse.
- **Km** (étape 2, échec réseau total) : après environ 10 s, « À vol d'oiseau : l'IGN ne répond pas. », curseur « 120 km au plus » (15 à 180, Début/Fin/flèches ok), La Rochelle « 121 km à vol d'oiseau », raison « 121 km : au-dessus de ton plafond de 120 km », pastille « 121 km · au-dessus de 120 km » (121 km, comme prévu : elle ne passe pas). Capture : captures/qa-bureau-2-km-fiche.png.
- **Recalcul** (clavier : Entrée sur « Recalculer avec l'IGN Parents de Léa ») : « Recalcul avec l'IGN… » à la place du lien, état km conservé et compté, curseur réglable pendant le recalcul (135 km, aucune demande), focus replacé sur « Retirer » ; IGN sans réponse : au bout de 47 s retour à km avec le lien, sans message. Capture : captures/qa-bureau-recalcul.png.
- **Prêt après recalcul** avec le vrai IGN (étape 3) : 12 demandes, plafond converti de 120 km à « 2 h », fiche La Rochelle « 2 h 15 en voiture », aucune trace d'approximation. Captures : captures/qa-bureau-3-pret.png, captures/qa-390-3-pret-fiche.png (fiche à 390 px dans la feuille).
- Noms accessibles : « Plafond de <nom> », « Recalculer avec l'IGN <nom> », « Retirer <nom> ». Ordre au clavier : curseur, Recalculer, Retirer, puis champ d'adresse.
- Aucune occurrence de « Trajets indisponibles » ni de « Réessayer » dans le texte de la page sur tous les états vus.
- Parcours clavier : ajouter (champ, Tab vers la suggestion, Entrée, Nom, Tab, Entrée sur Ajouter), plafond (flèches), « Recalculer » (Entrée), « Retirer » (via clic seulement dans ce navigateur).

## Non vérifié
- Résumé replié « 3 · 1 en calcul, 1 approximatif » / « 4 · 2 approximatifs » : non regardé (budget).
- Aux 390 px : fiche d'un proche partiel ou km (raisons, « jusqu'à »), pastilles (bureau seulement) : non vus ; recalcul à 390 px vu sans attendre sa fin.
- Étape 1 avec le vrai IGN et étape 4 (scénario « Parents de Léa » en ligne) : non rejouées.
- Réouverture avec IGN en échec (partiel ne passe pas en km, 15 min entre deux essais) et recalcul automatique à la réouverture après 15 min : non atteints (panne impossible avant chargement ; 15 min non attendues).
- Retirer pendant un recalcul ; plafond en km au maximum avec retour à 2 h 45 ; île en km ; proche ajouté pendant des recalculs (priorité) : non vus.
- Contraste des textes gris, console (erreurs) et conformité aux jetons du CSS : non examinés.
