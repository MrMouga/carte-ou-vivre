# Relecture du plan — loyer-mer
2026-10-12 · relecteur neuf (mode plan) · Plan relu : `plan.md` (brouillon, commit b1ef8be + modifications locales) · Spec : D1–D17, R1–R8, AC-1 à AC-15

Sévérités : **Bloquant** = /build ne peut pas prouver des critères tel quel · **Majeur** = /build devra deviner un choix qui change le produit ou la preuve · **Mineur** = à préciser, faible coût.

## Critères sans tâche ou dans deux tâches

1. **[Bloquant] La moitié « carte » de 8 critères n'a aucune preuve possible tel que le plan est écrit (AC-1, 2, 3, 5, 6, 9, 10, 15).**
   Preuve : la fixture place ses carrés entre 0 et 2,5° de longitude et 0 et 1,5° de latitude (`acceptance.json` l.15-36, 79-100), soit dans le golfe de Guinée, alors que la carte est « cadrée au départ sur la métropole avec la Corse » (details.md l.13) : avec un cadrage fixe, aucun carré n'est à l'écran, et le clic « au centre du carré de Montcher » d'AC-9 (plan l.64) tombe dans le vide. Ensuite, AC-1, 2, 3, 5 sont prouvés par « Vitest sur `score.ts` » (plan l.46) : ça prouve les scores, pas que « A a la couleur de la tranche 60–80 » ni que « C et D ne sont pas colorées » sur la carte ; AC-6 teste la « couleur neutre de la légende » (l.46), pas celle des communes. Enfin le plan interdit tout code de test dans le produit (l.17), ce qui écarte la façon facile de lire la carte (exposer l'objet carte pour interroger ses couches). Il ne reste aucune méthode nommée.
   Correction : écrire dans le plan (a) le cadrage = l'emprise des données chargées (métropole avec les vraies données, les 5 carrés avec la fixture), ce qui reste conforme à details.md l.13 ; (b) la méthode de preuve de la couleur : capture Playwright puis lecture du pixel au centre de chaque carré, comparée à la couleur du jeton mélangée à 88 % sur le fond connu, avec une tolérance écrite ; ou bien une exception étroite décidée par Vincent. Mettre au moins un contrôle « carte » dans chacun de ces 8 critères.

2. **[Majeur] AC-5 et AC-6 sont attribués à la tâche 2, mais leur moitié « liste » est construite en tâche 3.**
   Preuve : AC-5 et AC-6 exigent les messages de liste « Aucune commune ne passe tes critères… » et « Fixe un loyer ou une distance… » (acceptance.json l.216, 224) ; la tâche 2 n'a pas de liste (plan l.44-45) et ces messages sont des sorties de la tâche 3 (l.53). La règle « chaque critère dans une seule tâche » (l.87) n'est donc tenue qu'en coupant le critère en deux.
   Correction : déplacer AC-5 et AC-6 en tâche 3, ou y faire les messages de liste dès la tâche 2.

3. **[Majeur] Les tests de la page appellent-ils la vraie Géoplateforme ? Le plan ne le dit pas.**
   Preuve : seule la panne est simulée (AC-15, plan l.73) ; la fixture décrit un état « normal : tuiles servies » (acceptance.json l.169-171) sans dire d'où. Si les tests chargent le vrai Plan IGN, 14 critères dépendent d'un service extérieur non simulé, et les pixels lus au constat 1 changent avec le fond.
   Correction : dans les tests, servir par interception un style « normal » local et minimal (un fond uni connu, aucune tuile IGN) ; AC-15 bloque ce style. Le vrai fond IGN n'est vérifié que sur les captures « vraies données ».

## Tâches sans preuve attendue

4. **[Majeur] Trois états de la fiche n'ont ni tâche ni preuve.**
   Preuve : details.md l.23-28 définit la fiche **sans plafond** (ni score ni rang, raison de taille seulement), les valeurs **inconnues** (l.49) et la règle « un changement de réglage fait passer la fiche dans l'état qui correspond, dans les deux sens » (l.28) ; le tableau Figma `9:514` les dessine. La tâche 4 ne cite que « Ne passe pas tes critères » et la pastille du palier (plan l.61).
   Correction : les ajouter aux sorties de la tâche 4, avec un test Playwright sur la fixture : fiche de Grandeville ouverte → loyer à 800 € → elle passe en « Ne passe pas » → loyer et mer sur « Sans limite » → fiche sans score ni rang.

5. **[Mineur] Les budgets de chargement et l'erreur « pas de WebGL » ne sont pas prouvés.**
   Preuve : la tâche 5 cite H9 (l.70) mais sa preuve se limite à des captures (l.74) ; H9 fixe 300 ms, 300 ms et 15 s (details.md l.69), et l'état **erreur** couvre l'absence de WebGL (l.18). Les messages d'état doivent être annoncés aux lecteurs d'écran (`.claude/rules/ui.md`), et le plan ne le prévoit que pour le compte (l.53).
   Correction : un test Playwright qui retarde la fixture (indicateur visible, puis passage en erreur à 15 s avec une horloge simulée), un lancement avec WebGL désactivé (message d'erreur attendu), et une zone d'état annoncée pour chargement, erreur et « Fond de carte indisponible ».

6. **[Mineur] Le zoom en ≤ 500 ms (D14) et le compte annoncé aux lecteurs d'écran n'ont pas de preuve.**
   Preuve : plan l.62 (« zoom en ≤ 500 ms ») et l.53 (`aria-live`), sans rien de mesuré ni de vérifié en l.65 et l.56.
   Correction : durée d'animation fixée et vérifiée ; un test qui lit la zone annoncée après un changement de réglage.

7. **[Mineur] Le test « jetons = variables Figma » compare le code à un fichier que le même agent fabrique.**
   Preuve : plan l.28 ; cet export JSON n'apparaît pas dans la liste des fichiers (l.27).
   Correction : nommer le fichier (`src/theme/figma-variables.json`, par exemple), dire qu'il est la sortie brute de `get_variable_defs`, et le joindre à la preuve.

8. **[Mineur] La vérification en ligne de la spec n'est rattachée à rien.**
   Preuve : details.md l.75 dit « Sur la version en ligne, en largeur bureau et à 390 px » ; le plan ne la fait qu'en local (l.74, l.83), et la section « Reporté » (l.89-93) ne la cite pas.
   Correction : ajouter « Vérification de bout en bout en ligne, étapes 1 à 5, aux deux largeurs → `/ship` » à « Reporté ».

## Décisions cachées

9. **[Majeur] Les polices viendraient de Google Fonts, donc d'un service extérieur, ce qu'interdit D1.**
   Preuve : contrat l.31 et brief l.25 : « Texte (Google Fonts) » ; D1 n'admet que le fond de carte comme service extérieur (spec l.11) ; la leçon `2026-10-12-spec-valeurs-affichees-et-etats-vides.md` demande que toute police fournie par un tiers fasse l'objet d'une décision ; aucun paquet de polices n'est nommé (plan l.19), donc /build n'a le choix qu'entre un appel à Google et un paquet interdit.
   Correction : écrire « Source Sans 3 et Source Serif 4 hébergées dans le site (fichiers woff2 sous licence OFL dans `public/fonts/`, seulement les graisses utilisées) », en tâche 0.

10. **[Majeur] Le fond de secours (R8, D17) n'a ni source pour les pays voisins, ni méthode pour la mer, ni critère de panne.**
    Preuve : plan l.71 : les formes viennent « des contours Etalab et de la Limite terre-mer », mais les contours Etalab ne couvrent que la France, et Natural Earth est sorti avec D13 et D16 ; calculer un polygone de mer (le complément de 35 000 communes) en « Python 3 sans dépendance » (l.16) n'est pas réaliste ; aucun script ni fichier de données n'est listé en tâche 5 (l.72). R8 dit aussi « sort vers l'état normal si le fond revient » (details.md l.17), et le plan ne dit pas ce qui compte comme panne (échec du style, délai, erreurs de tuiles) ni comment on détecte le retour.
    Correction : nommer la source des voisins (Natural Earth, domaine public, déjà manipulé dans le prototype) ; dessiner la mer sans calcul d'union (fond de carte `map-sea`, terres posées dessus) ou fournir un polygone de mer tout fait, puis vérifier que c'est compatible avec le « fond uni `background` » de R8 ; écrire la règle de panne et de retour (par exemple : style non reçu en N s = panne ; nouvel essai toutes les N s) ; ajouter le script et le fichier à la tâche 5.

11. **[Majeur] L'ordre des couches et les adresses IGN sont à deviner, alors que le prototype les a déjà tranchés.**
    Preuve : la tâche 2 dit seulement « fond Plan IGN atténué + estompage » (plan l.44). Il faut décider si les communes à 88 % passent sous ou sur les noms de villes et de mers de l'IGN (D15) ; si elles passent dessus, les noms disparaissent. Le prototype `ign.html` (branche `prototype/loyer-mer`, decisions.md l.27, recoloration mesurée à 20 ms) contient la réponse, et le plan ne le cite nulle part.
    Correction : citer `ign.html` comme référence pour l'adresse du style, la couche d'estompage à 45 % et la position des communes (sous la première couche de texte de l'IGN) ; ne s'en écarter que si la tâche 1 le justifie.

12. **[Mineur] Le zoom à partir duquel l'opacité passe de 88 % à 70 % (H10) n'est pas fixé.**
    Preuve : H10 dit « au zoom d'une ville » (details.md l.68) ; la tâche 2 cite H10 (plan l.43) sans donner de seuil.
    Correction : un niveau de zoom, avec ou sans transition progressive, repris du prototype.

13. **[Mineur] Le fichier de données des communes a des points ouverts.**
    Preuve : plan l.35. R4 exige « loyer au m² exact × 52 » (details.md l.36), donc il ne faut pas arrondir le loyer au m² dans le fichier. Le plan ne dit pas comment Paris, Lyon et Marseille obtiennent « estimation propre » quand leurs arrondissements diffèrent. Il ne dit pas non plus si `public/data/` est versionné : c'est obligatoire pour que Cloudflare construise le site sans les scripts, et c'est lourd dans git en finesse 100 m.
    Correction : trois phrases dans la tâche 1.

14. **[Mineur] Les boutons « + » et « − » (H8) ne sont dans aucune tâche.**
    Preuve : brief l.52, contrat l.49 (Bouton Icône 32 × 32, 44 × 44 à 390 px) ; plan l.44 n'en parle pas. Le contrôle de zoom par défaut de MapLibre porte ses propres couleurs, ce qui enfreint la règle « jetons seulement ».
    Correction : tâche 2, boutons du système (Button, variante Icône) branchés sur la carte.

15. **[Mineur] Les contrôles de données sont approximatifs là où la spec est exacte.**
    Preuve : plan l.37 : « ≈ 34 746 », « Bordeaux ≈ 40 km », « La Rochelle ≈ 1 km ». La vérification de bout en bout attend « 1 km de la mer à vol d'oiseau » (details.md l.76), soit une distance comprise entre 1 et 1,5 km ; en dessous de 1 km, l'écran afficherait « moins d'1 km ». Deux communes s'appellent La Rochelle, et CLAUDE.md impose de joindre par code INSEE. La méthode de correction de l'Adour n'est pas dite non plus (pour la Seine, la discovery avait retiré les arcs en amont de Tancarville).
    Correction : contrôler par code INSEE (33063, 17300) et sur la valeur affichée ; donner un nombre exact de communes, avec le détail de son calcul ; écrire la correction de l'Adour (arcs retirés) et vérifier que les communes voisines ne bougent pas.

16. **[Mineur] La règle des dépendances est lue de façon ambiguë, et les composants shadcn passeraient par un paquet non nommé.**
    Preuve : plan l.19 et l.29. `time.modified` donne la date de la dernière modification du paquet, pas l'âge de la version installée : react ou vite peuvent échouer au contrôle le jour de l'installation, et le plan ne dit pas quoi faire. « Copie de composants dans le repo » (l.14) se fait d'habitude avec `npx shadcn`, un paquet qui n'est pas dans la liste.
    Correction : figer pour chaque paquet la dernière version publiée depuis plus de 7 jours, et le dire à Vincent si c'est sa lecture de la règle ; copier les composants à la main, sans `npx shadcn`.

17. **[Mineur] Deux ajouts visibles et un point de licence ne viennent pas de la spec.**
    Preuve : le hash du commit dans le pied de page (plan l.26) ne vient d'aucune règle. La relecture Figma (review-figma.md l.92) demande de vérifier si les données des pays voisins du Plan IGN exigent une mention, et le plan ne le prévoit pas.
    Correction : un repère de version discret, ou `/version.txt` seul ; vérifier la mention en même temps que les conditions d'usage des logos (tâche 5).

## Le risque de la spec

18. **[Majeur] La mesure de la tâche 1 ne vérifie que la moitié du risque, et la vérification ne revient jamais sur le vrai produit.**
    Preuve : plan l.38 ne mesure que la « recoloration complète ». H9 parle de la page qui réagit (le calcul de 35 000 scores, le tri des 10 premières, la liste et l'adresse) et de 15 s au plus pour charger (details.md l.69). La mesure par le Wi-Fi local ne dit rien du chargement sur un réseau mobile. Le seuil « ~10 Mo compressés » est posé sans lien avec ces 15 s. La limite de 25 Mo par fichier de Cloudflare (l.18) ne fait pas partie des conditions d'arrêt, alors que la finesse 100 m (8,2 Mo compressés, l.34) dépasse probablement 25 Mo une fois décompressée. La compression par l'hébergeur d'un fichier `.geojson` n'est pas vérifiée. STATE.md l.90 parle d'un « téléphone moyen », sans que le modèle soit noté. Et après la sonde, plus aucune mesure n'est faite sur téléphone avec la vraie page.
    Correction : mesurer en tâche 1 (a) la réaction complète (scores, tri et peinture), en médiane sur 10 essais affichée à l'écran de la sonde ; (b) le temps jusqu'à la première carte colorée avec un réseau ralenti de type « 4G » ; ajouter aux conditions d'arrêt « fichier décompressé ≤ 25 Mo » et un temps de chargement compatible avec les 15 s ; noter le modèle du téléphone. Refaire la mesure sur le téléphone avec l'application réelle à la fin de la tâche 3 (carte, liste et compte).

19. **[Mineur] La spec place la mesure en « tâche 0 », le plan en tâche 1, sans le dire.**
    Preuve : spec l.32 ; details.md l.13, 49 et 50 renvoient aussi à la « tâche 0 » (sources, nombre de communes sans valeur, Adour). Dans le plan, la tâche 0 est le socle et la mesure vient en tâche 1 (l.32-38). La mesure reste avant toute interface, ce qui suffit, mais l'écart n'est pas écrit. Par ailleurs, supprimer `probe/` (l.35) est une suppression, donc une demande à Vincent selon CLAUDE.md.
    Correction : une phrase « la tâche 0 de la spec correspond à la tâche 1 de ce plan » ; garder la sonde dans un dossier non versionné, comme `data-raw/`, pour qu'il n'y ait rien à supprimer.

## Périmètre

20. **[Majeur] La tâche 0 dépasse 8 fichiers et 2 h.**
    Preuve : plan l.26-27 : `src/components/ui/*` cache au moins 4 fichiers (3 composants et l'utilitaire `cn`) ; il manque `index.html`, `main.tsx`, `tsconfig`, `.gitignore`, la configuration de gitleaks, Vitest et Playwright, le repère de version et l'export Figma. Le tout fait environ 15 fichiers, plus la lecture des variables Figma et le test de l'agent neuf.
    Correction : 0a socle et garde-fous (projet, `.npmrc`, gitleaks, Vitest, Playwright avec un test de fumée WebGL, voir constat 23, commandes) ; 0b jetons, polices et composants, avec le test de l'agent neuf.

21. **[Majeur] La tâche 1 dépasse largement 2 h.**
    Preuve : plan l.34-38 : six sources, la fusion de Paris, Lyon et Marseille, l'Adour, la jointure, deux finesses de formes, une sonde avec deux méthodes, deux environnements de mesure et un rapport.
    Correction : 1a données et contrôles (sortie : fichiers et contrôles verts) ; 1b sonde et mesure, avec l'arrêt possible chez Vincent.

22. **[Majeur] La tâche 5 dépasse 8 fichiers, en oublie certains et réunit deux sujets.**
    Preuve : plan l.72 liste au moins 7 fichiers, plus les 2 logos. Il manque `Legend.tsx` (variante « Fond indisponible », contrat l.54), le script et le fichier de formes de secours (constat 10) et les tests. Le contenu regroupe l'adresse, trois états, le fond de secours et les mentions.
    Correction : 5a adresse de la page (AC-11 à 14) ; 5b états, fond de secours et mentions (AC-15).
    Note : avec les découpages 20 à 22, on passe à environ 10 tâches, au-delà des « ~8 tâches » acceptées par Vincent (spec l.31). C'est à lui de trancher : accepter 10 tâches, ou réduire la tâche 6 comme le plan le prévoit (l.101). Les fichiers de test ne sont comptés dans aucune tâche.

## Ordre

23. **[Majeur] WebGL dans Playwright n'est essayé qu'en tâche 2, et le repli prévu ne tient pas.**
    Preuve : risque écrit en plan l.98 : « si ça échoue, les AC visuels passent par la fixture ». Ils y passent déjà, et sans WebGL la page passe en **erreur** (details.md l.18) : aucun critère de la page ne peut alors tourner. Les leçons du projet notent deux pertes de WebGL le 2026-10-12.
    Correction : en tâche 0, un test de fumée qui ouvre une carte MapLibre vide dans le Chromium de Playwright et constate qu'elle se peint ; s'il échoue, retour à Vincent avant la tâche 1.

24. **[Mineur] Les tests à 390 px sont annoncés dès la tâche 2, mais la mise en page 390 px n'arrive qu'en tâche 6.**
    Preuve : plan l.17 (« à 1440 et 390 px ») contre l.82. À 390 px, la feuille cache le bas de la carte, et le point de clic d'AC-9 peut tomber dessous.
    Correction : « tests à 1440 px jusqu'à la tâche 5, à 390 px à partir de la tâche 6 » ; à 390 px, viser le carré dans la bande visible.

## Ce qui tient
- Les 15 critères sont chacun attribués à une tâche (l.87), et leurs dépendances vont dans le bon sens : la taille de ville est construite en tâche 3 et testée en tâche 4 (AC-10) et en tâche 5 (AC-14).
- *Le risque* est mesuré avant toute interface, avec une condition d'arrêt écrite et un retour à Vincent (l.8, l.38), un repli nommé (PMTiles, l.93) et le téléphone réel.
- Les données sont jointes par code INSEE, avec un contrôle des orphelins (attendu 0, l.97) ; la fusion de Paris, Lyon et Marseille (D10) et l'Adour sont dans la tâche 1.
- Les règles du projet sont respectées : aucune clé ORS, aucun service extérieur hors du fond IGN, les mentions ORS et OpenStreetMap écartées à juste titre (details.md l.13 ne retient que les mentions de cette tranche), aucun envoi ni déploiement dans le plan, la fixture servie sans code de test dans le produit, des relecteurs neufs à la fin.
- D17 est repris point par point (opacités, compte, intitulé, fond de secours, ronds regroupés), et l'écran « sans plafond » non dessiné est signalé (l.92).
- La tâche 2 est le premier squelette de bout en bout (vraies données, carte, curseurs, légende), juste après la mesure ; les choix de stack ont chacun un *Pourquoi* et un *Écarté*.

## Comptes par section
Critères : 3 · Tâches sans preuve : 5 · Décisions cachées : 9 · Le risque : 2 · Périmètre : 3 · Ordre : 2 — total 24 (1 bloquant, 11 majeurs, 12 mineurs).
