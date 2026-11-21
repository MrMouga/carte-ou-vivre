# Cadrage — recherche « emploi »

Date : 2026-11-21 · Début : 13:31 · Ambition : perso · Tranche servie : emploi · Type : profondeur (une question, deux angles) · Statut : en cours

Origine : retours de 3 amis de la cible ([synthèse](../../feedback/synthese-2026-11-21.md)), qui demandent l'emploi sans relance et l'entendent comme « trouver du travail dans mon métier » (réponse de Vincent, 2026-11-21).

## Fiche de décision
| Décision que la spec doit prendre | Option par défaut aujourd'hui | Pas en jeu | Criticité (critère) |
|---|---|---|---|
| A. Quelle donnée pour « trouver du travail dans mon métier » ? | Chômage Insee par zone d'emploi (302 zones, sans métier), la seule vérifiée par la discovery | Faut-il un critère emploi (demandé 3/3) | **critique** : promesse centrale de la tranche ; source principale, difficile à défaire (colonne de `communes.json`, carte, fiche, adresse de la page) |
| B. Ce que la carte peut dire honnêtement : « recrute dans ton métier » ou « ton métier est présent » | Non décidé (dépend de A) | — | **standard** : texte visible, une tâche pour le changer |
| C. Liste des métiers proposée : nombre de choix, mots employés | Non décidé (dépend de A) | — | **standard** : visible, réglée par la nomenclature de la source |
| D. Filtre ou note, seuil, place dans les réglages, un ou deux métiers (couple) | — | — | choix produit tranché en `/spec`, pas de recherche |

## Hypothèses
| # | Hypothèse (sous quelle décision) | Risque | Importance | Preuves en main | → |
|---|---|---|---|---|---|
| 1 | Une source ouverte donne un indicateur par métier et par territoire (bassin, zone d'emploi ou commune) en métropole (A) | faisabilité | haute | Discovery : seul le chômage par zone vérifié ; Urssaf, recensement, BMO « non explorés (budget) » | sujet S1 |
| 2 | Sa licence permet la réutilisation avec une mention (A) | faisabilité | haute | Aucune | sujet S1 |
| 3 | L'indicateur répond à « trouver du travail dans mon métier » : il mesure des embauches, pas seulement des emplois existants (B) | valeur | haute | Aucune | sujet S2 |
| 4 | Le secret statistique ou les petites zones ne vident pas la carte (B) | faisabilité | moyenne | Aucune | sujet S2 |
| 5 | La cible trouve son métier dans la liste proposée (C) | utilisabilité | moyenne | — | hors de cette recherche — `/spec` et `/ui` (taille de la nomenclature donnée par S1) |
| 6 | Les offres d'emploi en direct sont réutilisables (A) | faisabilité | haute | Discovery du 2026-10-11 : API France Travail sous contrat de licence, fichier data.gouv opaque | acceptée sans recherche — vérifié il y a 6 semaines |
| 7 | La cible veut un critère emploi | valeur | haute | 3/3 sans relance (dire), synthèse du 2026-11-21 | acceptée sans recherche — `/users` |

## Sujets de recherche
| # | Niveau (proposé → retenu) | Question centrale | Axe | Décision nourrie | Signal de bascule | Ce qui ne changerait rien | Sortie attendue | Pistes de départ |
|---|---|---|---|---|---|---|---|---|
| S1 | critique → critique | Quelles sources ouvertes donnent, pour la France métropolitaine, un indicateur par métier (ou famille de métiers, ou secteur) et par territoire (commune, bassin d'emploi, zone d'emploi), et sous quelle licence, millésime, maille et nomenclature ? | donnees | A, C | Une source sous Licence Ouverte (ou équivalente) donne ≥ ~20 familles de métiers, à la maille du bassin ou plus fine, millésime ≤ 2 ans → tranche « emploi dans mon métier ». Sinon → la promesse redescend au chômage par zone (« marché du coin »), ou la tranche est reportée. | La présence de données par département ou région seulement (refusées comme maille au cadrage de la discovery) ; une source qui ne couvre que l'Outre-mer | Une fiche par source (champs fixes de l'axe `donnees`) et un tableau comparatif : métier ou secteur, nombre de catégories, maille, nombre d'unités en métropole, millésime, licence, accès, 5 à 10 vraies valeurs | Enquête Besoins en main-d'œuvre (BMO, France Travail) ; effectifs salariés par commune et secteur (Urssaf, open.urssaf.fr) ; recensement Insee, emplois au lieu de travail par commune et CSP ou secteur ; tensions sur le marché du travail par métier (Dares / France Travail) ; catalogue data.gouv.fr |
| S2 | standard → standard | Pour la ou les meilleures sources de S1 : que mesure exactement l'indicateur (embauches prévues, offres, emplois existants, demandeurs) et quels sont ses trous (secret statistique, valeurs masquées, zones à faible effectif) ? | donnees | B | Embauches prévues ou offres → on peut dire « recrute dans ton métier » ; stock d'emplois → seulement « ton métier est présent » ; plus d'un quart des couples métier × zone masqués → maille plus grossière ou familles plus larges | La méthode détaillée d'échantillonnage au-delà de ce qui change la phrase affichée | Pour chaque source retenue : ce que veut dire un chiffre, en une phrase lisible par la cible ; part des valeurs masquées ; un cas contraire (critique de la source) | Notes méthodologiques des producteurs ; discussions des jeux sur data.gouv.fr |

## Job et scénario (test des sites)
Pas de test des sites : la question porte sur la donnée, pas sur la façon dont d'autres outils présentent l'emploi.

## Repris des recherches précédentes
- Chômage Insee par zone d'emploi : 302 zones (composition 2020), T2 2026, Licence Ouverte 2.0 par défaut du site, sans métier ; table commune → zone d'emploi au 1er janvier 2026 — source : `~/git-repository/ideas/carte-ou-vivre/discovery/2026-10-11-donnees-criteres/agents/donnees-stats.md` — du 2026-10-11 — revérifié : non
- Offres d'emploi France Travail : fichier data.gouv opaque (XLS de 45,8 Ko, documentation manquante), API sous contrat de licence — même source — du 2026-10-11 — revérifié : non
- Départements et régions refusés comme maille au cadrage de la discovery — même dossier, `synthesis.md` — du 2026-10-11

## Périmètres (vérifiés sans recouvrement)
| Agent | Sujets | Pages et sources visées | Hors périmètre |
|---|---|---|---|
| studio:researcher (donnees) | S1, S2 | data.gouv.fr (jeux et services de données), insee.fr, francetravail.org et statistiques.francetravail.org, open.urssaf.fr, dares.travail-emploi.gouv.fr | Les offres d'emploi en direct (API France Travail) ; le chômage par zone d'emploi déjà vérifié (sauf pour le citer en comparaison) ; les choix de présentation (D) ; toute donnée par département ou région seulement |

## Durée max et équipe
Durée max : 1 h · passe complémentaire : 1 au plus

| Agent | Axe | Sujets (niveau) | Budget | Livrable |
|---|---|---|---|---|
| studio:researcher (Sonnet) | donnees | S1 (critique), S2 (standard) | 20 appels d'outils au plus | `agents/donnees.md` |
| studio:verifier (Sonnet) | — | chaque fait de S1, faits clés de S2 | — | `verification.md` |

Accepté par Vincent le 2026-11-21 (niveaux proposés retenus, équipe lancée).
