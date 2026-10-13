# Relecture du plan — proches
2026-10-13 · relecteur neuf (mode plan) · Plan relu : `plan.md` (brouillon, non versionné) · Spec : D1–D14, R9–R15, 13 critères actifs (AC-1 à AC-11, AC-14, AC-16 ; AC-12, 13, 15 reportés) · Code relu : `src/`, `tests/e2e/`, `playwright.config.ts`

Sévérités : **Bloquant** = /build ne peut pas prouver des critères tel quel · **Majeur** = /build devra deviner un choix qui change le produit ou la preuve · **Mineur** = à préciser, faible coût.

## Critères sans tâche ou dans deux tâches

1. **[Majeur] AC-4 est en tâche 2, mais le lien « + Ajouter un proche » (D13) n'arrive qu'en tâche 3 : le test d'AC-4 devra être réécrit ensuite, ce qui est interdit.**
   Preuve : AC-4 ajoute un second proche alors que Nantesville est déjà prêt (acceptance.json l.338-342). Dès qu'il y a un proche, D13 cache le champ derrière le lien (spec l.24, details.md l.18). Le plan met AC-4 en tâche 2 (plan l.46, 49) et le lien en tâche 3 (l.55-56). Le test de la tâche 2 tape donc dans un champ toujours visible. En tâche 3, il faudra lui ajouter un clic sur le lien, autrement dit modifier un test d'AC. CLAUDE.md l'interdit.
   Correction : construire le lien D13 dès la tâche 2 (état **avec proches** minimal : liste et lien), ou déplacer AC-4 en tâche 3.

2. **[Majeur] AC-14 : le repère est attendu « au point [-2, 3] », hors du cadre de la carte de test, et le plan ne dit pas comment le prouver.**
   Preuve : la carte se cadre sur l'emprise des communes (`src/map/MapView.tsx` l.41, `emprise(reperes)`). Avec la fixture, ça donne les carrés entre 0 et 2,5° de longitude et entre 0 et 1,5° de latitude. Or les points de départ sont « loin des carrés » (acceptance.json l.4, point [-2, 3] l.200-203). Pire, AC-14 choisit ensuite Grandeville, et la carte zoome dessus (MapView l.156). La leçon `2026-10-12-plan-preuve-carte-et-fixture.md` demande justement de placer la fixture dans le cadre. Le plan (l.67) ne nomme aucune méthode.
   Correction : écrire la méthode dans la tâche 4. Par exemple, vérifier la position du repère avant le choix de Grandeville, en comparant sa boîte à l'écran à la projection de [-2, 3] calculée comme `vue()` dans `tests/e2e/lib/carte.ts` (exporter `ecran`). Un élément de marqueur hors de l'écran garde sa position. Autre option : le dire à Vincent si le point doit être déplacé dans le cadre, car c'est un changement de fixture d'AC.

3. **[Majeur] La mention « © IGN – Géoplateforme » ne couvre pas les trajets dans le code actuel, et aucune tâche ne la modifie.**
   Preuve : details.md l.14 dit « pied de page — les trajets IGN sont couverts par « © IGN – Géoplateforme » ». Mais `src/ui/Mentions.tsx` l.20-22 la limite à « Fond Plan IGN et estompage : ». La tâche 0 (f) cherche « la mention à afficher » (plan l.29), mais `Mentions.tsx` n'apparaît dans aucune liste de fichiers.
   Correction : ajouter à la tâche 2 (premier appel réel aux trajets) la mention que fixe la tâche 0, avec `Mentions.tsx` dans ses fichiers, et une capture du pied de page dans la preuve.

4. **[Mineur] Le faux service des tests sera avalé par l'interception existante.**
   Preuve : `servirFixture` répond à tout `https://data.geopf.fr/**` par une image PNG transparente (`tests/e2e/lib/carte.ts` l.36-41). Les adresses `geocodage/completion` et `navigation/isochrone` y tombent si le faux service n'est pas posé après (dans Playwright, la dernière route posée passe en premier). En outre, `fondEnPanne` coupe aussi la recherche et les trajets.
   Correction : une phrase dans la tâche 2 : le faux service s'installe après `servirFixture` (ou celle-ci exclut ces deux chemins) ; loyer-mer AC-15 n'est pas touché.

Couverture : les 13 critères actifs sont chacun dans une seule tâche (T2 : AC-1, 2, 4, 6 · T3 : AC-7 à 11 · T4 : AC-3, 5, 14, 16), et aucun reporté n'est construit.

## Tâches sans preuve attendue

5. **[Majeur] Chaque constructeur ne verra que sa section, alors que des consignes vitales vivent hors des tâches.**
   Preuve : le comportement du faux service (format, zones autour des mairies, délai, pannes), le point d'une commune = mairie, « Ne change pas » et « jetons seulement » sont dans « À respecter dans chaque tâche » (plan l.11-16). « Un refus 429 compte comme une panne » et « taille de la mémoire écrite dans la preuve » sont dans les Risques (l.88, l.91). La tâche 2 crée `tests/e2e/ign-stub.ts` sans rien en dire dans sa section. La tâche 3 ne mentionne ni le 429 ni la taille.
   Correction : dire que « À respecter » est donné à chaque constructeur, ou le recopier. Déplacer dans la tâche 2 la description du faux service. Déplacer dans la tâche 3 le 429 (avec un test : le faux service répond 429 → proche **indisponible**) et la taille de la mémoire (écrite dans la preuve).

6. **[Mineur] La preuve de la tâche 3 demande des états construits en tâche 4, et un état reporté.**
   Preuve : plan l.59 : « captures de chaque état du tableau `23:1616` ». D'après le README du design (l.25), ce tableau contient « aucune commune avec un proche » (texte de List, tâche 4), « pastille au-dessus » (tâche 4) et « mer en minutes inconnue » (reporté par D14).
   Correction : limiter la preuve de la tâche 3 aux états de la zone et des lignes (vide, aucune adresse, recherche indisponible, adresse déjà présente, plein, en attente, calcul, indisponible, mémoire refusée, catégorie repliée).

7. **[Mineur] Plusieurs sorties de la tâche 3 n'ont ni test ni preuve.**
   Preuve : « mémoire refusée → message » (R12), « proche pas prêt → indisponible à la réouverture », le nom de 30 caractères au plus et le nom vide qui reprend la commune (R9) : aucune de ces sorties n'est dans « Tests » (plan l.58).
   Correction : tests e2e avec un `localStorage` (ou le stockage choisi) qui lève une erreur, puis la réouverture avec un proche gardé en **calcul**, puis un nom vide et un nom de 31 caractères.

8. **[Mineur] La tâche 4 n'a pas de test pour trois règles de design.**
   Preuve : plan l.64 : étiquette à gauche en cas de chevauchement, repère au-dessus des ronds du top 10, anneau fixe en mouvement réduit. La preuve (l.68) ne contient que des captures, sans ces cas. Elle cite aussi « 5 proches dont un en calcul et un indisponible » sans dire si c'est le vrai IGN ou le faux service.
   Correction : un test avec `reducedMotion: 'reduce'` (aucune animation sur l'anneau), une capture de deux proches dans la même ville, et l'écrire : « avec le faux service ».

9. **[Mineur] Le délai du faux service est ambigu, et la vérification « en ligne » n'est rattachée à rien.**
   Preuve : « Délai de 1 s par calcul de proche » (plan l.13), alors qu'un proche fait 24 requêtes d'isochrone. Si chacune attend 1 s, un proche prend environ 5 s ou 24 s selon le parallélisme, et AC-7 (5 proches) se rapproche du délai de 30 s. Par ailleurs, la spec dit « en ligne » (spec l.6, details.md l.91), mais la tâche 5 travaille en local (plan l.72, 77), et « Reporté » ne cite pas `/ship`.
   Correction : « la première requête d'isochrone d'un proche répond après 1 s, les suivantes tout de suite ». Ajouter à « Reporté » : « vérification de bout en bout en ligne, étapes 1 à 4, aux deux largeurs, avec la liste des requêtes réseau → /ship ».

## Décisions cachées

10. **[Majeur] Pour une commune choisie, passer de la suggestion au code INSEE (point de départ = mairie, D6) risque une jointure par nom, interdite par CLAUDE.md.**
    Preuve : l'autocomplétion ne renvoie que `city`, `zipcode`, `x`, `y`, sans code INSEE (plan l.21). `public/data/communes.json` n'a ni code postal ni rien d'autre que code, nom et département. La tâche 0 (e) demande « une méthode » sans contrainte (l.28). Le département tiré du code postal se trompe pour certaines communes dont le bureau distributeur est dans le département voisin. Cela touche le nom proposé « Commune (département) » (R9, AC-1) et le choix de la mairie.
    Correction : écrire dans la tâche 0 (e) que la méthode doit donner le code INSEE (par exemple : le service de recherche de la Géoplateforme qui renvoie le code de la commune, ou le point de la suggestion placé dans le cadre des communes de `reperes.json`), jamais le nom, et que le département vient du code INSEE. Ajouter un test unitaire de cette correspondance (Corse comprise) en tâche 2. La fixture n'a aucune suggestion de type commune.

11. **[Majeur] Le format de la mémoire du navigateur n'est pas choisi, et un choix naïf fait revenir tous les proches « indisponibles » ou dépasse la place de Safari.**
    Preuve : R12 veut un proche **indisponible** si « un code INSEE de la carte n'a pas de temps » (details.md l.40). Si la mémoire ne garde que les communes atteintes, celles à « plus de 6 h » manquent, et tout proche revient indisponible. Le plan (l.56) dit « temps par code INSEE », sans stockage (`localStorage` ou IndexedDB) ni encodage. Un objet JSON `{"01001":120,…}` fait environ 420 000 caractères par proche, soit environ 4 Mo pour 5 proches en UTF-16 : on est proche des 5 Mo de Safari, loin des « quelques centaines de Ko » annoncés (l.91).
    Correction : fixer en tâche 3 le stockage et l'encodage (par exemple, une chaîne compacte d'un caractère par commune, dans l'ordre d'une liste de codes gardée avec, et une valeur réservée à « plus de 6 h »), la façon de reconnaître une liste de communes qui a changé, et un test « commune à plus de 6 h → le proche revient prêt ».

12. **[Mineur] Le départ, le repère et la ligne d'une commune choisie ne sont pas tranchés.**
    Preuve : H28 envoie « les coordonnées que renvoie la recherche », alors que D6 part de la mairie pour une commune. D4 pose le repère « à l'adresse ». Le texte sous le nom (« Toulouse · départ de la mairie ») est resté « à vérifier au build » (decisions.md l.26), et aucune tâche ne le reprend.
    Correction : en tâche 2, pour une commune choisie, le départ et le repère sont à la mairie de `reperes.json`, et la ligne affiche « Toulouse · départ de la mairie ». La phrase « H28 vaut pour les adresses » reste à faire valider par Vincent.

13. **[Mineur] Le résumé replié de « Taille de ville » diffère du design.**
    Preuve : plan l.38 : « Peu importe » ou « les tailles cochées » ; decisions.md l.17 : « 2 » (le nombre).
    Correction : suivre le design (le nombre), ou le dire à Vincent.

14. **[Mineur] Les paramètres de l'isochrone et l'ordre des raisons ne sont pas fixés.**
    Preuve : D6 fait partir le trajet de l'adresse, donc l'isochrone doit être demandé au départ, profil voiture, coût en temps. Le plan ne nomme que la ressource (l.24). Pour les raisons de la fiche, details.md l.32 donne l'ordre loyer, mer, taille puis proches, alors que l'exemple de la même ligne met le proche en premier. AC-3 et AC-5 ne vérifient pas l'ordre.
    Correction : écrire les paramètres retenus dans le rapport de la tâche 0 et dans les entrées de la tâche 2 ; en tâche 4, « ordre de R1 puis proches, dans l'ordre d'ajout ».

15. **[Mineur] « Demander d'abord : rien » en tâches 2 et 3 contredit, à la lettre, CLAUDE.md.**
    Preuve : CLAUDE.md, « Demander d'abord : … tout ce qui touche aux données des utilisateurs (les adresses saisies) » et « changement du modèle de données ». Un constructeur neuf qui envoie des adresses à l'IGN et les garde dans le navigateur peut s'arrêter.
    Correction : écrire « accord : D6, D7 et H30 de la spec, validés par Vincent ».

## Le risque de la spec

16. **[Majeur] La tâche 0 mesure bien les deux risques, mais pose des seuils d'arrêt que la spec n'a pas.**
    Preuve : la spec veut la recoloration « en 100 ms avec 7 critères » (spec l.30 ; H9 ≤ 100 ms, 102 ms acceptés par Vincent). Le plan n'arrête qu'« au-delà de 150 ms » (l.31, 90) : entre 100 et 150 ms, il continue sans le dire. Le seuil de 20 s sur téléphone (l.31) n'est pas non plus dans la spec. Il est proche du délai de 30 s de H21, au-delà duquel un proche passe **indisponible**.
    Correction : faire valider 150 ms et 20 s par Vincent (une ligne dans « Demandera »), ou revenir à la spec : arrêt au-dessus de 100 ms, en disant ce qui est toléré. Ajouter à la tâche 0 (g) le temps du proche le plus lent, comparé aux 30 s.

17. **[Mineur] Trois points de la mesure manquent.**
    Preuve : (a) l'appel depuis un autre site (CORS) n'est pas une condition d'arrêt écrite, alors que la sonde est servie par `localhost`. (b) Le temps de relecture de la mémoire à la réouverture (H21 : « prêts dès que la carte est chargée ») n'est pas mesuré. (c) Si le temps Nantes → Bordeaux mesuré n'est pas 3 h 45, rien ne dit qui met à jour la spec (« valeur relevée en tâche 0 », spec l.6, details.md l.93).
    Correction : ajouter « en-têtes CORS de la réponse » à (f) et aux arrêts ; mesurer la relecture de 5 proches dans (d) ; « la valeur relevée va dans le rapport, Vincent corrige la spec ».

## Périmètre

18. **[Majeur] La tâche 2 dépasse 8 fichiers et 2 h.**
    Preuve : 7 fichiers listés (plan l.48), plus au moins trois fichiers de test (e2e, `temps`, `score`). `src/domain/format.ts` manque : le plafond « 3 h » d'AC-1 en dépend, et `raisonTexte` fait un `switch` sur `Raison` (`format.ts` l.61-62), qui ne compile plus avec une raison « proche ». Manquent aussi `Mentions.tsx` (constat 3), le fichier du Web Worker si la tâche 0 le retient, et peut-être `Fiche.tsx`. Le contenu réunit la recherche avec attente de 300 ms, le nommage, le client IGN avec 24 requêtes à 5 par seconde au plus, le classement de 34 746 points dans des polygones, le score et l'interface.
    Correction : 2a, le domaine : `temps.ts` (zones → fins de tranche), `score.ts`, `format.ts`, le faux service et leurs tests unitaires ; 2b, la recherche, l'ajout, le client IGN, la zone et AC-1, 2, 4, 6.

19. **[Majeur] La tâche 4 oublie `App.tsx` et dépasse 8 fichiers.**
    Preuve : 8 fichiers listés (plan l.66), plus les tests (AC-3, 5, 14, 16, `format.test.ts`). Les pastilles se placent dans la mise en page, et la fiche et la carte reçoivent les proches depuis `App.tsx`, qui assemble tout (`src/App.tsx` l.123-165).
    Correction : ajouter `App.tsx`, et sortir les jetons vers une tâche antérieure (constat 21), ce qui ramène la tâche sous 8 fichiers.

20. **[Mineur] La tâche 0 dépasse probablement 2 h.**
    Preuve : sept mesures, dont une sonde avec Web Worker, deux adresses, une mesure ralentie ×4 et une séance avec le téléphone de Vincent (l.23-30).
    Correction : 0a, IGN (a, b, e, f, g) ; 0b, classement et recoloration (c, d). On passe à 7 ou 8 tâches : à faire accepter par Vincent, comme pour loyer-mer.

## Ordre

21. **[Majeur] Les jetons `place-marker` arrivent en tâche 4, alors que la ligne de proche (tâches 2 et 3) en a besoin.**
    Preuve : la « Ligne de proche » porte un « repère en petit 24 px » (contrat l.60), de couleur `place-marker` (contrat l.28). Le jeton n'existe pas dans le code (aucune occurrence dans `src/`). Le plan ne l'ajoute qu'en tâche 4 (l.65-66). En tâche 2 ou 3, le constructeur devra soit écrire une couleur en dur (refusée par `check-tokens`), soit ajouter le jeton lui-même, ce qui fait doublon avec la tâche 4.
    Correction : ajouter les jetons (`tokens.ts`, `figma-variables.json`) en tâche 1 ou 2.

22. **[Mineur] Les tests tournent déjà à 390 px dès la tâche 2, et le plan ne le dit pas.**
    Preuve : `playwright.config.ts` l.19-22 lance chaque test en « bureau » et en « mobile ». Le plan ne parle de 390 px qu'en tâche 5 (« toute la suite verte aux deux largeurs », l.76), et AC-16 exige 1 440 px.
    Correction : « dès la tâche 2, les AC passent aux deux largeurs (la zone est dans la feuille, Playwright la fait défiler) ; AC-16 vérifie la présence des pastilles en bureau et leur absence en mobile ». La tâche 5 ne fait que la feuille qui monte et les 44 px.

23. **[Mineur] Le premier squelette de bout en bout arrive en tâche 2, pas en tâche 1.**
    Preuve : la tâche 1 est une refonte du panneau sans proche. L'ordre se défend, puisque la zone « Tes proches » utilise la catégorie repliable, mais un échec de la tâche 2 se verrait plus tard.
    Correction : rien d'obligatoire. On peut aussi faire la tâche 2 dans une section simple, puis la tâche 1 qui l'enveloppe.

## Ce qui tient
- Les 13 critères actifs sont chacun dans une seule tâche, aucun reporté n'est construit, et la section « Reporté » cite D14 point par point.
- *Le risque* (calcul IGN et recoloration à 7 critères) est mesuré en tâche 0, avant tout écran, avec le téléphone réel, des conditions d'arrêt et un retour à Vincent. La tâche 0 couvre aussi les conditions d'usage et la Corse.
- Aucun appel réel à l'IGN dans les tests. La fixture de test place déjà les repères des communes au centre des carrés, comme les `mairie` de la fixture proches, donc les zones du faux service tombent juste.
- Les requêtes réelles de /build sont limitées aux adresses publiques, avec l'accord daté de Vincent, sans ORS ni paquet nouveau.
- Les preuves des tâches 2, 3 et 5 se font sur le vrai IGN et les vraies données (temps mesuré, adresse de la page relue, journal réseau à la réouverture).

## Comptes par section
Critères sans tâche ou dans deux tâches : 4 · Tâches sans preuve attendue : 5 · Décisions cachées : 6 · Le risque de la spec : 2 · Périmètre : 3 · Ordre : 3 — total 23 (0 bloquant, 11 majeurs, 12 mineurs).
