# Plan de distribution — Carte où vivre
2026-10-12 · brouillon · Ambition : perso · Temps : 1 h/semaine jusqu'au 8/11, puis la moitié du temps jusqu'au 6/12 · Révision de : —

## Positionnement
Pour les trentenaires qui quittent une grande ville et ont déjà une ou deux villes en tête, qui décident avec des récits d'amis et partent avec le doute d'en avoir raté une, Carte où vivre est une carte de France qui colore les 675 aires urbaines selon leurs critères à eux (l'adresse de leurs proches, la mer, les prix). Contrairement à ChatGPT, qui propose 5 villes sur un axe, et aux palmarès comme villeideale.fr, qui ignorent les adresses perso, elle montre tout le pays d'un coup.
**Accroche** : « Une carte de France qui colore les villes selon tes critères à toi : tes proches, la mer, les prix. » C'est le choix de Vincent. Claude proposait une accroche plus pointue (« entre tes parents et les siens », ou « tu as déjà une ville en tête ? »), parce que celle-ci reprend la catégorie par défaut, celle de villeideale.fr. À tester sur 3 personnes avant le 1/11 (hypothèse déjà dans STATE.md).
Mots des utilisateurs : aucun recueilli. À collecter pendant /validate (les 5 testeurs) et dans les fils « quitter Paris » de r/france.

## Où est la cible
| Endroit | Ce qu'on y fait | Règle d'autopromotion (source, date) | Vincent y est déjà ? |
|---|---|---|---|
| Amis de la cible (≥ 5) | message perso, un par un | — | oui |
| r/france (fils « quitter Paris », « où déménager ») | réponses utiles, puis un post au lancement | à lire et dater par Vincent sur la page des règles (lecture automatique bloquée le 2026-10-12) | oui, sous pseudo, avec historique |
| Discord Indie Makers FR / Indiehackers France (« Show & Launch ») | retours de pairs, pas d'acheteurs | à lire avant d'y poster | non |

## Le canal
Cercle intérieur :
- **Amis directs** : 5 personnes essaient et répondent (c'est le test de demande ci-dessous), avant le 25/10.
- **r/france** : avant le 15/11, trouver 3 posts d'outils cartographiques français à plus de 100 votes, et laisser 1 réponse utile par semaine dans un fil « quitter Paris » (dans l'heure hebdomadaire). Seuil : les 3 posts sont trouvés et aucune réponse n'est retirée.
- **Indie Makers FR** : au soft launch, recueillir 3 retours de fond en une semaine.
Canal retenu : r/france, à confirmer le 15/11. Canal de secours : Indie Makers FR, puis les subs de villes (r/paris).

## Le test de demande (avant de construire davantage)
5 personnes de la cible (des amis) essaient une maquette ou la carte loyer + mer et répondent à 3 questions, dont « laquelle enverrais-tu à ton conjoint : la réponse ChatGPT ou la carte ? ». Seuil : **5 ont essayé et répondu** avant le 25/10, conduit par /validate. Ce seuil est le minimum du guide pour un projet perso : facile à tenir avec des amis, donc peu probant. Si c'est raté, ou si la majorité préfère ChatGPT : on rouvre la Différence avant de coder la tranche 2.

## Le moment de partage
L'utilisateur envoie **le lien de sa carte** : les réglages sont dans l'URL et un bouton « Copier le lien » ouvre la même carte chez le conjoint. À porter dans la spec de la tranche des proches (décision D-n). Point à trancher là-bas : les adresses des proches ne doivent pas apparaître en clair dans le lien.

## D'ici le lancement
- Chaque semaine (1 h) : une réponse utile sur r/france, sans lien, et une ligne de notes sur les mots employés par les gens.
- Avant le 8/11 : Vincent écrit la liste des 10 à 30 personnes à prévenir une par une, pour essayer et commenter, pas pour voter.
- Du 8/11 au 6/12 (moitié du temps) : une démo de 15 à 30 s, un README, le brouillon du write-up, une FAQ (vie privée des adresses, différence avec ChatGPT).

## Le lancement
Séquence : les 5 testeurs, puis la liste perso, puis Indie Makers FR (soft launch), puis un post r/france qui dit que Vincent a fait l'outil, vers le 6/12, puis le write-up.
Condition de publication : la carte est en ligne avec au minimum les proches, le loyer et la mer, utilisable sans inscription, avec les mentions obligatoires et une mesure d'audience (sans cookie, à choisir dans /breakdown ou /ship).
Signature : le site n'est pas signé. Où le write-up et le README sont signés reste à décider avant /launch.
/launch préparera le post r/france (brouillon que Vincent réécrit), la démo et la FAQ.

## Mesures et seuils (fixés maintenant)
| Métrique | « ça marche » | « on itère » | « on arrête ou on pivote » | Quand |
|---|---|---|---|---|
| Inconnus qui ont joué (réglé un critère ou entré une adresse) | ≥ 30 | 10–29 | < 10 après 2 canaux bien menés | 20/12 |
| Write-up publié | 1 | — | — | 20/12 |
| Commentaires de fond (Reddit, Discord, messages) | ≥ 3 | 1–2 | 0 | 20/12 |
| Cartes ouvertes par quelqu'un d'autre que leur auteur | ≥ 5 | 1–4 | 0 | 20/12 |
| Visites uniques | suivi seulement | | | 20/12 |

## Risques
- **1 h par semaine**, c'est le schéma qui mène à un lancement dans le vide (« 95 % produit »). Réponse : passer à la moitié du temps dès le 8/11, et ne pas lancer avant la liste perso et 4 réponses r/france.
- **L'accroche reprend la catégorie de villeideale.fr.** Test : 3 personnes la répètent avant le 1/11. Si elles ne retiennent pas « proches », on reprend une des deux accroches écartées.
- **ChatGPT fait presque pareil** sur 5 villes. Test : la question « ChatGPT ou la carte » du test de demande.
- **Un post sous pseudo retiré pour autopromotion.** Réponse : lire les règles, garder l'historique de réponses utiles, dire qu'on a fait l'outil, un seul sub par jour.

## Ce que l'agent ne fera jamais
Publier, commenter, voter, envoyer des messages à ta place. Il prépare ; tu publies.
