# Démo — immobilier
2026-10-14 · Plan : [plan.md](plan.md) · Progression : [progress.md](progress.md) · Spec : [spec](../../specs/2026-10-14-immobilier/spec.md)

> AC = critère d'acceptation de la spec. Bloquant / Majeur / Mineur = gravité donnée par un relecteur neuf. Une preuve = une capture ou une sortie de commande, datée.

## Ce qui est construit
La catégorie « Loyer » devient **« Logement »**. On y choisit :
- **Louer ou Acheter** (soulignement) ;
- **Appartement ou Maison** (deux tuiles) ;
- un plafond en **Total**, avec sa surface (10 à 300 m²), ou **Au m²**.

La carte, les 10 premières, la fiche d'une commune, le résumé de la catégorie repliée (« Louer · Appartement · 52 m² · 1 200 € ») et l'adresse de la page suivent ces choix.

Ce que chaque tâche a apporté :
- **Tâche 0 — Les données.**
  - Chaque commune a le loyer au m² des maisons, et le prix d'achat au m² des appartements et des maisons, avec sa source.
  - Le prix d'achat suit **ta règle** : prix 2023-2025 si la commune a au moins 30 ventes ; sinon 2021-2025 si elle en a au moins 5 ; sinon le prix de l'intercommunalité. Un prix sous 300 €/m² n'est jamais retenu.
  - Le fichier des prix d'achat (`/data/achat.json`) est marqué « ne pas indexer » pour les moteurs de recherche.
- **Tâche 1 — Les règles du prix, sans écran.** Valeur affichée de chaque commune, conversions Total ↔ Au m², adresse. Une commune sans prix vient toujours après celles qui en ont un (ta décision).
- **Tâche 2 — Le réglage du prix à l'écran**, au bureau et dans la feuille du téléphone. Le titre est masqué sous 1 024 px, et la feuille fait au moins 338 px de haut. La mention des ventes est dans le pied de page.
- **Tâche 3 — Appartement ou Maison.** Changer de bien garde la surface et le plafond. Une adresse en Maison sans surface s'ouvre à 92 m².
- **Tâche 4 — Les communes sans prix.**
  - Une commune sans prix passe le filtre du prix. Si la mer ou un proche lui donne une note, elle est classée, après celles qui ont un prix.
  - Sinon, elle prend la couleur sable, hors de la liste et du compte. Sa fiche dit pourquoi (« Prix d'achat inconnu : les ventes ne sont pas publiées en Alsace-Moselle »).
- **Tâche 5 — Finitions du design.** Panneau de réglages de 340 px au bureau, valeurs des curseurs en 16 px gras. « à vol d'oiseau » n'est plus sous le curseur de la mer, mais reste dans la fiche.

**Pour essayer** : `npm run build` puis `npx vite preview` → http://localhost:4173. Adresses utiles :
- `/?achat=5000&mer=60` : achat au m², mer à 60 km ;
- `/?achat=350000&mer=60&unite=total&surface=70` : achat d'un appartement de 70 m², plafond 350 000 € ;
- `/?loyer=1200&mer=60&bien=maison` : location d'une maison ;
- `/?achat=5000&mer=aucun` : mer « Sans limite », l'Alsace-Moselle apparaît en sable.

Sur ton téléphone : `npx vite --host` sur le Wi-Fi local.

## Preuves
- **Suite de tests, relancée par moi sur la dernière version** : 142 tests unitaires et 238 tests e2e verts, 31 sautés (au départ : 88 et 189). Types, jetons de design et construction sans erreur.
- **Critères : 13 sur 13 passent** (`acceptance.json`), chacun par un test qui porte son id, aux deux largeurs (bureau et 390 px) :

| AC | Règle | Ce qu'il vérifie | Passe |
|---|---|---|---|
| AC-1 | R21 | réglage de départ, adresse, scores | oui |
| AC-2 | R22 | surface 72 m² | oui |
| AC-3 | R21 | Maison garde surface et plafond | oui |
| AC-4 | R23 | Au m² puis Total | oui |
| AC-5 | R21 | Acheter puis Louer | oui |
| AC-6 | R23 | Acheter · Total | oui |
| AC-7 | R24 | Maison · Acheter, « Estimation du secteur » | oui |
| AC-8 | R25 | commune sans prix notée par la mer | oui |
| AC-9 | R25 | commune sans note, couleur neutre, Alsace-Moselle | oui |
| AC-10 | R26 | adresse complète en Maison · Acheter · Total | oui |
| AC-11 | R26 | adresse invalide | oui |
| AC-12 | R24 | mention des ventes dans le pied de page | oui |
| AC-13 | R25 | loyer de maison inconnu | oui |

- Les critères des tranches précédentes (loyer-mer, proches, interface-telephone) et le test de H48 à 375 × 548 passent toujours.
- **Vérification de bout en bout, étapes 1 à 8** (version 55f680d, vraies données) : [captures/T5-bout-en-bout.txt](captures/T5-bout-en-bout.txt). Toutes conformes, sauf un écart prévu : Bordeaux en Acheter vaut 4 233 €/m², et non 4 427 comme l'écrit la spec, à cause de ta règle de prix.
- **Captures par écran et par état** : `captures/T2-*`, `T3-*`, `T4-*`, `T5-*` (bureau, 390 × 844, 375 × 548). À regarder en premier :
  - `T5-375x548-e8-ouverture.png` : petit téléphone, France peinte, curseur visible ;
  - `T4-bureau-fiche-strasbourg.png` : Alsace-Moselle en sable ;
  - `T3-bureau-maison-acheter-marseille.png` : « Estimation du secteur » ;
  - `T2-390-acheter-m2.png` : réglage du prix sur téléphone.
- **Données** : [mesure-tache-0.md](mesure-tache-0.md). Elle donne les comptes par source, les communes au prix récent (2 429 en appartement, 9 925 en maison) et le poids de `achat.json` (228 Ko en gzip, 166 Ko en brotli).
- **Dernière version (a09b46c), relue par moi dans un navigateur** :
  - `/?achat=5000&mer=60` donne les mêmes 10 premières qu'à la tâche 1 (Galéria 91, Meria 90…), avec la mention du pied de page ;
  - aucune erreur dans la console ;
  - la carte n'a pas pu s'y dessiner : ce navigateur sans écran n'a pas WebGL (limite connue de l'outil). Les couleurs sont prouvées au pixel par la suite Playwright.

## Décisions
**Tes décisions pendant la construction**, à reporter dans la spec si tu les gardes :
- Prix d'achat 2023-2025 dès 30 ventes, sinon 2021-2025 dès 5, sinon intercommunalité (D5, H61, H62).
- Pas de prix sous 300 €/m² (R24).
- Commune sans prix toujours après celles qui ont un prix (D6, R25, H4 étendue).
- Paris, Lyon et Marseille en maison : H67 appliquée à la lettre (Paris maison 12 404 €/m²).
- Test unitaire `view.test.ts` : il lit maintenant le jeton de hauteur au lieu d'écrire 272 en dur.
- Majeur de la relecture accepté (voir « Relectures »).

**Décisions prises à ta place**, chacune avec son coût si elle est fausse :
- **Le plafond du prix reste rangé dans `Reglages.loyer`, même en Acheter**, parce que des critères protégés de loyer-mer comparent les réglages. *Coût* : un nom trompeur dans le code, aucun effet visible.
- **La tuile Maison est active dès la tâche 2.** *Coût* : aucun, AC-3 et AC-7 la testent.
- **L'intercommunalité suit la même règle 2023-2025 / 2021-2025 que la commune.** Une intercommunalité répétée par département n'est comptée qu'une fois. *Coût* : un prix du secteur un peu plus ancien ou plus récent.
- **Un prix récent sous 300 € essaie d'abord le prix 2021-2025 de la commune** avant l'intercommunalité. « Sans prix en dernier » vaut aussi quand le prix est sur « Sans limite ». *Coût* : nul sur les vraies données.
- **La règle appliquée (1, 2 ou 3) n'est pas écrite dans `achat.json`.** *Coût* : une colonne à ajouter si la fiche doit un jour dire la période.
- **Les lecteurs d'écran entendent ce que l'écran n'affiche plus** : « 1 200 € par mois pour 52 m² », « 60 km à vol d'oiseau ». *Coût* : un texte à raccourcir.
- **La couleur sable est portée par la couleur de chaque commune**, sur une seule couche de carte. Une deuxième couche coûtait +55 ms ; la réaction mesurée est de 106 ms, pour un budget de 100 ms. *Coût* : aucun effet visible.
- **Code mort gardé** parce que des tests le lisent : la raison « loyer inconnu », `loyerTexte`, `plafondLoyer`, etc. *Coût* : du code inutile.
- **`valeur-curseur` est ajouté à la copie des variables Figma**, avec une note de source (pas de page Figma pour cette tranche). *Coût* : à relire si une page Figma est faite un jour.
- **Les 5 communes du test du risque ont été choisies par moi**, à ta demande : Nantes, La Rochelle, Annecy, Saint-Malo, Lacanau. *Coût* : le test vaut moins si tu les connais mal.

## Relectures
- **[review-spec.md](review-spec.md)** (conformité à la spec) : 0 Bloquant, 1 Majeur, 4 Mineurs. Le relecteur a relancé la suite lui-même : verte.
- **[qa.md](qa.md) + [qa-2.md](qa-2.md)** (navigateur, bureau, 390, 375 × 548, clavier) : 0 Bloquant, 0 Majeur, 9 Mineurs, dont 2 en double.

**Le Majeur, accepté par toi, rien de corrigé.** En Acheter · Appartement avec la mer « Sans limite », la liste commence par les prix les plus bas, donc les moins sûrs : Montdardier à 300 €/m², 9 communes du Cher à 312 €/m², pris à des intercommunalités rurales qui ont eu 5 à 50 ventes d'appartement en 5 ans. 428 prix d'appartement sont sous 500 €/m², dont 389 viennent de l'intercommunalité. La fiche affiche bien « Estimation du secteur ».

**Mineurs, non corrigés, à juger maintenant** :
1. **La légende n'explique pas la couleur sable** quand un critère est actif. Environ 3 800 communes (11 %) sont en sable en Acheter, et en état « aucune commune », la page dit « Aucune commune » alors que l'Alsace est peinte en sable. C'est conforme à H60 (« légende inchangée »), mais la couleur devient le seul indice.
2. **La fiche donne une raison inexacte** pour les communes dont le prix a été écarté par le seuil de 300 € : « moins de 5 ventes dans la commune » s'affiche alors qu'elles en ont plus (6 en appartement, 34 en maison, dont Civray et Guérigny), et « trop peu de ventes dans le secteur » pour 122 autres. Même chose pour Marseille en maison : ce sont ses arrondissements qui ont moins de 5 ventes, pas la commune.
3. **À 375 × 548, la légende cache des ronds du top 10** (« 4·5·6 », « 9·10 ») sur la côte atlantique.
4. **Surface hors plage** (par exemple « 5 ») : le champ n'indique rien. La carte garde la dernière surface valide, comme le veut la spec.
5. **Le rang s'écrit « 20667e »**, sans espace des milliers (`ordinal()`, présent depuis loyer-mer).
6. **Une valeur bornée sans signal** : `achat=1010000` en Au m² est réécrite en `achat=5000`.
7. **Échap ne ferme pas la fiche à 375 × 548.** La spec ne le demande peut-être pas.
8. **Cibles sous 24 px à 390 px** : les ronds de la carte (22 px) et les liens du pied de page. C'était déjà le cas avant la tranche.
9. **Serveur de dev** : `favicon.ico` en 404, et une erreur 401 dont la ressource n'a pas été identifiée.

## Non vérifié
- **Un vrai téléphone et Safari.** Les outils n'émulent pas le toucher : la feuille n'a été ni touchée ni glissée.
- **La non-indexation de `achat.json` en ligne** (étape 9) : elle se vérifie à `/ship`. Risque : que Cloudflare n'applique pas `_headers` sur le site servi en `workers.dev`.
- **La valeur du curseur des proches sur les vraies données** : ajouter un proche envoie des requêtes à l'IGN. Elle est couverte par un test sur la fixture.
- **Au clavier** : les curseurs de la mer et de la taille, et les groupes « Louer ou acheter », « Type de logement », « Unité du prix ». Le focus n'a été vu que sur « Total » et « Au m² ».
- **Plusieurs états à 375 × 548** : surface invalide, « Sans limite », Louer · Au m².
- **La carte dessinée sur la toute dernière version** (a09b46c), à cause de WebGL dans l'outil. La logique a été relue et la suite est verte.
- **Les dates des preuves.** Le relecteur note que chaque capture précède de quelques minutes le commit qui l'ajoute, au lieu d'être datée après.

## Coût
- **Durée** : de 16:09 à 21:05, soit environ 4 h 55, dont environ 50 min d'échanges avec toi (règle de prix, seuil de 300 €, test de 272 px, Majeur).
- **Agents, en jetons d'après les retours des outils** :
  - tâche 0 : 134 k + 189 k (reprise) ;
  - tâche 1 : 209 k + 258 k (reprise) ;
  - tâche 2 : 266 k + 274 k (question) ;
  - tâche 3 : 138 k ;
  - tâche 4 : 235 k ;
  - tâche 5 : 139 k ;
  - simplification : 138 k ;
  - relecture de la spec : 187 k + 197 k (relancée) ;
  - QA navigateur : 109 k + 116 k (relancée), plus 57 k (second passage) ;
  - total : environ 2,6 M.
- **Détours** :
  - 2 reprises de tâches, sur tes décisions (tâches 0 et 1) ;
  - 1 question sur un test (tâche 2) ;
  - 2 relecteurs arrêtés à leur limite de tours, relancés une fois ;
  - un second passage de QA ;
  - aucune correction ratée, aucun retour arrière (revert).
