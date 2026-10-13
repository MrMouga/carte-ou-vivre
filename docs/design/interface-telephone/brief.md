# Brief — interface téléphone
2026-10-13 · Spec : [interface-telephone](../../specs/2026-10-13-interface-telephone/spec.md) · Système : [system/README.md](../system/README.md) (inchangé : on n'ajoute un jeton que si un écran l'exige)

## Grille d'évaluation
1. **Voir le vert dès l'ouverture** : la bande de carte au-dessus de la feuille ouverte laisse lire la France et ses communes colorées (R16). Plus la feuille ouverte est basse, mieux c'est, tant que le premier réglage reste visible.
2. **Libérer la carte d'un geste, et la retrouver** : on comprend sans essai qu'on peut replier (poignée, bouton) ; la barre repliée dit le compte et se rouvre d'un toucher (R17, D8). AC-2, AC-3.
3. **Passer des critères au résultat sans chercher** : les deux onglets se voient ; dans « Critères », le compte suit chaque réglage sans changer d'onglet (R18). AC-5, AC-10.
4. **Lire une commune** : la fiche prend la feuille, « ← Les 10 premières » ramène à la liste (R19). AC-6, AC-7.
5. **Ajouter un proche au clavier** : pendant l'ajout, rien d'autre que la poignée au-dessus du champ (R20).

## Ressenti
Le même produit qu'en bureau : calme, éditorial, des chiffres nets ; une feuille qui se manie comme dans une app de cartes, sans en copier l'habillage.

## Références
| Réf | Fichier | Ce qu'on prend | Ce qu'on ne prend pas | Mots de Vincent |
|---|---|---|---|---|
| R1 Strava ([Mobbin](https://mobbin.com/screens/2beaf9fe-79fd-47d7-af98-18b94aee1930)) | [refs/R1](refs/R1-strava-barre-compte.webp) | Barre repliée : poignée et compte centré, une ligne | La barre d'onglets de l'app sous la feuille ; la carte-photo au-dessus | « Compte centré » |
| R2 komoot ([Mobbin](https://mobbin.com/screens/382f98bb-a064-4260-a17d-e4410ff22ac2)) | [refs/R2](refs/R2-komoot-barre-compte.webp) | Compte centré sous la poignée, le contenu commence juste en dessous | Les grandes photos | « Pas de photos ni de cartes riches » |
| R5 Bump ([Mobbin](https://mobbin.com/screens/c0bf3aaa-04ab-4d35-ad8a-292d5e21ce89)) | [refs/R5](refs/R5-bump-onglets-pilule.webp) | Onglets en pilule : l'actif sur un fond arrondi | Les emojis, les cartes de liste arrondies, la typo très grasse | « Pilule / segmenté » |
| R3 Shell, R4 Starbucks, R6 Uber Eats | [refs/](refs/) | Rien de plus : comparaison (onglets soulignés, compte à gauche) | Écartés par Vincent | — |

## Système visuel
Celui du projet, sans changement : `card` pour la feuille, `foreground` (encre) pour l'onglet actif et les contrôles, `muted-foreground` pour l'inactif, `border` pour la poignée et les séparateurs ; Source Sans 3 (interface, chiffres tabulaires), Source Serif 4 (marque, titre de fiche) ; rayons `rounded-sheet` (feuille) et `rounded-full` (pilules, comme les pastilles de taille) ; cibles de 44 px au toucher. Pas de nouvelle couleur.

## Contenu réaliste commun
Vraies données, réglages de départ (`/?loyer=1200&mer=60`), téléphone tenu droit, fenêtre de Safari 390 × 664 : le compte réel de la page (« N communes passent tes critères »), la liste réelle des 10, la fiche de la 1re. Un proche pour l'état ajout : « 12 rue de la Paix, Nantes », nommé « Parents de Léa ».

## Écrans (de haut en bas, textes exacts de details.md)
1. **Ouverte · Critères** : carte (bande du haut, légende et zoom en haut) · feuille : poignée et bouton « Replier la feuille » · onglets « Critères » (actif) / « Les 10 premières » · « Où vivre en France » · Loyer · Mer · Taille de ville · Tes proches · compte collé en bas (« 187 communes passent tes critères ») · mentions.
2. **Ouverte · Les 10 premières** : poignée et bouton · onglets (« Les 10 premières » actif) · compte · lignes « 1 · Grigny (91) · 36 · 807 € · 162 km »… · mentions.
3. **Repliée** : carte plein écran · barre : poignée, « 187 communes passent tes critères » centré, bouton « Déplier la feuille ».
4. **Fiche** : poignée et bouton · « ← Les 10 premières » · la fiche de loyer-mer et proches (inchangée).
5. **Ajout** : feuille montée, poignée seule au-dessus du champ « Adresse ou ville », suggestions, puis « Nom » et « Ajouter ».

## Pas voulu
Photos ou cartes riches dans la liste ; une barre d'onglets d'application sous la feuille ; une couleur nouvelle pour les onglets (l'encre suffit) ; onglets soulignés (écartés) ; dégradés, verre dépoli, ombres lourdes.
