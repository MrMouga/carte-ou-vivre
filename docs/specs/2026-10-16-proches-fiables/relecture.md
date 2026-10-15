# Relecture de la spec — proches-fiables

Relu le 2026-10-16 par un relecteur neuf, du point de vue de l'agent qui va planifier et construire. Lus : `spec.md`, `details.md` et `acceptance.json` de la tranche ; `CLAUDE.md` ; `docs/specs/INDEX.md` ; proches (spec, détails, critères) ; loyer-mer R1, R2, R4, R5, H3 ; cadre-de-vie R28, R29, H74 et l'état **sans plafond** ; immobilier R25 ; interface-telephone H51 ; le code `src/proches/useProches.ts` et `src/proches/ign.ts`, seulement pour vérifier un fait (le délai par zone).

**Valeurs chiffrées : toutes justes.** J'ai recalculé chaque score et chaque distance des AC-1 à AC-10 avec R1/R2 de loyer-mer, R11 de proches, R34/R35 et H74 (moyenne exacte, moitié vers le haut). Loyer 1 200 € : notes 45,83 (Portmer 650 €), 30,67 (Grandeville 832 €), 9 (Quaibleu 1 092 €). Mer 50 km : 98, 20, 86. Distances depuis [0.5, 0.5] sur la sphère de 6 371 km : 39,3 / 87,9 / 196,6 / 87,9 / 117,9 km, donc 39 / 88 / 197 / 88 / 118. Exemples : AC-2 à 2 h 30 → (45,83 + 98 + 60) / 3 = 67,94 → 68 ; Grandeville (30,67 + 20 + 0) / 3 = 16,89 → 17. AC-4 → Portmer 70,44 → 70, Quaibleu 32,22 → 32, Grandeville 25,78 → 26. AC-5 → 66,83 → 67 et 17,63 → 18. AC-6 b → 68,78 → 69, 35,83 → 36, 29,39 → 29. AC-7 après le recalcul → Grandeville 20,22 → 20. AC-8 a à 1 h 30 → 64,61 → 65 et 22,44 → 22. Aucune valeur ne tombe sur une moitié exacte. Les états (prêt, environ, limité, km) et les textes « environ 2 h 30 » et « plus de 2 h 45 » sont cohérents avec R33 et R34 dans chaque cas. L'exemple du pitch est juste aussi : avec les zones de 75, 120 et 180 min ratées, le proche est **limité** à 2 h 45, et La Rochelle (tranche 2 h 15, zone de 120 manquante) donne « environ 2 h 15 ».

---

## Ce qu'un agent devrait deviner (manques)

- **Majeur** — **Ce que le navigateur garde pour un proche approximatif.** R12 de proches garde l'adresse, le point, le nom, le plafond et les temps par code INSEE. Pour R34, R36 et H97, il faut aussi garder l'état (environ, limité, km), la plus grande zone obtenue, le nombre de zones obtenues, la marque « environ » de chaque commune et l'unité du plafond (heures ou km). Pour un proche **km**, il n'y a aucun temps. Rien de cela n'est écrit, et R12 est classée seulement « Contredite » (sur « revient indisponible »), pas « Étendue » pour ce qu'elle garde. C'est un changement du modèle de données des proches, que CLAUDE.md met dans « Demander d'abord ». L'agent devra s'arrêter et demander. — Où : `details.md`, R36/R37 et le tableau d'impact (ligne R12) — Proposition : une phrase dans R36 : « Pour chaque proche, ce navigateur garde en plus son état, la plus grande zone obtenue, le nombre de zones obtenues, les communes en "environ" et le plafond dans son unité (min ou km) ». Ligne R12 du tableau : « Étendue ».

- **Majeur** — **Priorité entre un ajout et les recalculs en tâche de fond.** À l'ouverture, jusqu'à 5 proches approximatifs passent en **recalcul**, un à la fois, avec jusqu'à 45 s chacun (H98). Le cas limite dit seulement : « le nouveau attend son tour ». Avec un IGN lent, un proche que l'utilisateur vient d'ajouter peut attendre jusqu'à 5 × 45 s = 3 min 45 derrière des recalculs qu'il n'a pas demandés. Cela change ce que vit l'utilisateur. — Où : `details.md`, Cas limites (« Recalcul en cours et nouveau proche ajouté ») et H98 — Proposition : trancher par un D-n ou un H-n. Par exemple : « un ajout passe devant les recalculs pas encore commencés ; le recalcul en cours continue ». Ou bien garder la file stricte et le dire, avec son coût.

- **Majeur** — **Proche gardé par cette version dont les codes INSEE ne correspondent plus à la carte, ou fermé pendant son calcul.** R36 dit : « Un proche **prêt** n'est jamais recalculé ». R37 traite l'empreinte qui ne correspond plus et le proche « fermé pendant son calcul », mais seulement pour les proches « gardés avant cette tranche ». Or R12 de proches, qui couvrait ces cas, est contredite. Pour un proche gardé par la nouvelle version, au prochain changement des communes (nouveau COG) ou après une fermeture pendant le calcul, aucune règle ne dit ce qu'il devient. — Où : `details.md`, R36 et R37 — Proposition : R37 vaut pour tout proche gardé, quelle que soit la version (titre : « Proches gardés incomplets »). R36 : « Un proche **prêt** dont tous les codes de la carte ont un temps n'est jamais recalculé ».

- **Mineur** — **Ligne d'un proche approximatif qui attend son tour de recalcul à l'ouverture.** Avec 2 proches approximatifs ou plus, un seul calcule. Les autres affichent-ils déjà « Recalcul avec l'IGN… », ou gardent-ils « Recalculer avec l'IGN » jusqu'à leur tour ? Un appui sur ce lien pendant l'attente fait-il quelque chose ? — Où : `details.md`, état **recalcul** — Proposition : « en file, la ligne affiche déjà "Recalcul avec l'IGN…" ».

- **Mineur** — **Petit repère des pastilles.** H37 de proches : « Le petit repère d'une pastille suit l'état du proche (« … », « ! ») ». Le « ! » servait à **indisponible**, qui disparaît. Quel repère pour **environ**, **limité** et **km** ? H99 ne parle que du repère sur la carte. — Où : `details.md`, Pastilles et H99 — Proposition : « celui d'un proche prêt » (cohérent avec H99), ou un repère dédié à fixer en /ui.

- **Mineur** — **Résumé replié au pluriel.** Seul « 1 approximatif » est donné. — Où : `details.md`, Résumé de « Tes proches » — Proposition : « 2 approximatifs ».

- **Mineur** — **H97 laisse deux comparaisons ouvertes.** (1) Un **environ** à 10 zones contre un **environ** à 11 zones : la parenthèse « celui qui a le plus de zones » ne vise que **limité**. (2) Avec l'ordre par état, un **environ** qui n'a obtenu que la zone de 3 h (toutes les communes en « environ 3 h ») remplace un **limité** à 2 h 45 qui a 11 zones justes. — Où : `details.md`, H97 — Proposition : « à état égal, celui qui a le plus de zones ». Pour (2), soit l'accepter et l'écrire, soit comparer d'abord le nombre de zones.

- **Mineur** — **Plafond déplacé pendant un recalcul.** Si l'utilisateur bouge le curseur en km pendant le recalcul, la conversion de R36 (km ÷ 60) part-elle du plafond en cours ou de celui d'avant ? — Où : R36 — Proposition : « le plafond au moment où le résultat arrive ».

## Décisions cachées

- **Majeur** — **Une zone muette n'est jamais redemandée.** R33 redemande une zone « qui échoue (erreur, refus, réseau) ». Aucune limite de temps n'existe par zone : le code n'a que le délai global de 45 s (`DELAI_PROCHE_MS`), et la fixture « zone-135-muette » avec AC-2 b (« finit à 45 s, pas avant ») inscrit ce choix. Or le soir de la démo, 2 zones ratées sur 3 étaient « sans réponse après 60 s » (Pourquoi de `spec.md`). Pour elles, le nouvel essai de D1 ne sert à rien, et l'utilisateur attend toujours les 45 s entières. Ce choix change ce que l'utilisateur obtient, et il n'est ni un D-n ni un H-n. — Où : `spec.md` D1 ; `details.md` R33 ; `acceptance.json` AC-2 b — Proposition : le soumettre à Vincent comme précision de D1. Soit « une zone sans réponse après N s est abandonnée et redemandée une fois » (avec N, par exemple 20 s, mesuré en tâche 0), soit « une zone muette n'est pas redemandée : elle manque à 45 s », avec son coût.

- **Mineur** — **Le second essai part tout de suite, même après un refus.** H92 : « pas d'attente plus longue ». Elle vaut aussi pour un refus (R33 compte « refus » parmi les échecs). Après un refus pour trop de demandes, un nouvel essai immédiat a toutes les chances d'échouer aussi. C'est bien un H-n, mais son effet sur les refus n'est pas dit. — Où : H92 — Proposition : l'écrire (« y compris après un refus ») ou prévoir une pause après un refus.

## Contradictions et doublons

- **Majeur** — **« Rejouées » et « en moins de 45 s » ne tiennent pas ensemble.** Le Pourquoi de `spec.md` décrit la démo ainsi : « une 502, deux sans réponse après 60 s ». « C'est réussi si » demande que ces réponses, rejouées, donnent un proche qui compte « en moins de 45 s ». Rejouées telles quelles, les deux zones muettes font finir le calcul à 45 s exactement (R33, AC-2 b), pas avant. La vérification de bout en bout, étape 1, change le scénario : « en échec à chaque essai ». — Où : `spec.md` « C'est réussi si » ; `details.md` Vérification, étape 1 — Proposition : écrire « en 45 s au plus », ou décrire partout le même rejeu (« trois zones en échec à chaque essai »). À rapprocher de la décision cachée sur les zones muettes.

- **Majeur** — **« IGN coupé » bloque aussi la recherche d'adresse et le fond de carte.** Vérification, étape 2 : « IGN coupé (requêtes bloquées dans le navigateur) : ajouter le même proche ». Si toutes les requêtes vers l'IGN sont bloquées, la recherche d'adresse ne répond plus (R13 et AC-11 de proches : « Recherche d'adresse indisponible ») et on ne peut ajouter aucun proche ; le fond passe aussi en secours (R8). La même ambiguïté est dans « C'est réussi si » (« IGN coupé, le proche compte en km »). — Où : `spec.md` « C'est réussi si » ; `details.md` Vérification, étape 2 — Proposition : « calcul de trajets de l'IGN bloqué (recherche d'adresse et fond de carte ouverts) », comme la panne « panne-totale » de la fixture.

- **Mineur** — **Ajouter deux fois le même proche est refusé.** Vérification, étape 2 : « ajouter le même proche » alors que l'étape 1 l'a déjà ajouté. R9 refuse un libellé déjà présent (« Cette adresse est déjà dans tes proches. »). — Où : Vérification, étape 2 — Proposition : « Retirer le proche, puis l'ajouter de nouveau ».

- **Mineur** — **Le Pourquoi de R34 est faux.** Il dit : « on surestime de 30 min au plus ». Ce n'est vrai que si une seule zone manque à la suite. Avec k zones de suite manquantes, l'écart va jusqu'à 15 × (k + 1) min. Exemple : seule la zone de 3 h obtenue, une commune à 10 min affiche « environ 3 h ». Vincent valide D2 sur cette base. — Où : `details.md` R34, *Pourquoi* — Proposition : « on surestime de 15 min de plus par zone manquante sous la zone obtenue ; jamais sous-estimé ».

## Impact sur les tranches existantes

- **Majeur** — **« Proche prêt » dans d'autres tranches, classé à tort « Inchangée ».** Ces textes réservent un rôle au seul proche **prêt** : loyer-mer R2 et l'état **sans plafond** (D20 : « et aucun proche prêt ») ; les « États de la page » de proches (**sans plafond**, et le message « Relâche le loyer, la mer, la taille ou un proche » « avec au moins un proche prêt ») ; immobilier R25 (une commune sans prix est notée par « mer, proche prêt ») ; l'état **sans plafond** de cadre-de-vie (« aucun proche prêt »). Le tableau dit « loyer-mer, immobilier, cadre-de-vie | tout | Inchangée ». Pris à la lettre, un proche **environ**, **limité** ou **km** ne sortirait pas la page de **sans plafond** et ne noterait pas une commune sans prix. Cela contredit R34 et R35 et la ligne R11 (« un proche approximatif compte comme un prêt »). — Où : `details.md`, tableau d'impact — Proposition : des lignes « Étendue » pour loyer-mer R2 et D20, les « États de la page » de proches, immobilier R25 et l'état **sans plafond** de cadre-de-vie : « prêt » se lit « prêt ou approximatif (environ, limité, km, y compris en recalcul) ».

- **Majeur** — **Éléments de proches touchés mais absents du tableau.** Chacun doit être classé, puis repris dans D18 de proches :
  - D5 (« Un plafond par proche, de 15 min à 3 h ») : plafond en km de 15 à 180 km, et maximum abaissé dans l'état **limité**. Étendue.
  - D10 (pastille « nom · 4 h au plus ») : « 90 km au plus ». Étendue.
  - D11 (estimation haute) : « environ ». Étendue.
  - H22 (formats) : étendue par H96.
  - H37 (petit repère « ! » de la pastille) : contredite.
  - Les « États d'un proche » et la ligne de fiche « trajets indisponibles » de `details.md` de proches : remplacés, ce que dit la section des états, mais absents du tableau.
  - H21, dernière phrase (« À la réouverture, les proches sont prêts dès que la carte est chargée ») : contredite par R36 et R37.
  - H33 : seule la partie « revient indisponible » est contredite. « Une entrée par proche » et « curseurs bloqués pendant le chargement » restent valables. Classer toute la ligne « Contredite » les efface.

  — Où : `details.md`, tableau d'impact — Proposition : ajouter ces lignes ; pour H33 et H21, préciser la partie contredite.

- **Majeur** — **H51 d'interface-telephone, étendue sans le dire.** H100 annonce le changement d'état d'un proche « par la zone d'annonce de la page (H51 d'interface-telephone) ». H51 dit « Une seule annonce du compte » et précise : « deux tests protégés de loyer-mer en dépendent ». Ajouter une annonce dans cette zone peut casser ces tests protégés. La ligne interface-telephone du tableau ne vise que R17 à R20. — Où : `details.md` H100 et tableau d'impact — Proposition : ligne « interface-telephone | H51 | Étendue », et dire comment l'annonce d'état cohabite avec celle du compte sans toucher aux deux tests (même zone à la suite, ou une seconde zone dédiée).

- **Majeur** — **Le plan d'amendement (D18 de proches) oublie les « Ne change pas » d'autres tranches.** Interface-telephone (`details.md` ligne 56) et immobilier (`details.md` ligne 81) disent « Proches : AC-1 à AC-11 », ce qui inclut AC-10 de proches. AC-10 sortira des critères actifs. `recalage.md` de cadre-de-vie recale aussi AC-10 de proches. D6 de cette tranche ne liste que « R12, R13, H21, H32, H33 et AC-10 » de proches. — Où : `spec.md` D6 ; tableau d'impact — Proposition : D18 de proches et une ligne du tableau notent que les « Ne change pas » d'interface-telephone et d'immobilier se lisent désormais « Proches : AC-1 à AC-9, AC-11 ». D18 reprend aussi la liste complète du tableau (étendues comprises : D2, D5, D10, D11, R10, R11, R15, H22, H34, H37), pas seulement les contredites.

## Critères non testables

- **Mineur** — **AC-8, cas (b)** — « aucun autre message n'apparaît » : autre que quoi, et à quel moment ? « Recalcul avec l'IGN… » apparaît pendant le recalcul. On ne sait pas non plus comment le test voit « la fin du recalcul ». Proposition : « après le recalcul ("Recalcul avec l'IGN…" disparu), la ligne affiche exactement "À vol d'oiseau : l'IGN ne répond pas.", "90 km au plus" et "Recalculer avec l'IGN" ; ni "Temps approximatifs", ni "Trajets indisponibles", ni message d'erreur ».

- **Mineur** — **AC-2, cas (b)** — « il finit à 45 s après son début, pas avant » : aucune marge n'est donnée. Avec une horloge simulée, il faut un instant vérifiable. Proposition : « pas avant 45 s, et au plus 1 s après (horloge simulée) ».

- **Mineur** — **AC-7** — Le given part d'un proche « gardé dans ce navigateur dans l'état de AC-2 cas (a) ». Le format gardé n'est pas décrit (voir le premier manque), donc le test ne peut pas écrire ce proche directement. Proposition : « état obtenu en jouant AC-2 (a) dans ce navigateur, puis service de trajets rétabli avant la réouverture ». Même remarque pour AC-8 et AC-9.

Aucune valeur fausse : voir l'en-tête.

## Hors sujet pour une spec

- **Mineur** — Le tableau d'impact nomme des fichiers de test (`proches-etats`, `proches-carte`, `proches-mobile`) et ce qu'ils lisent. C'est le travail de /breakdown. La spec n'a besoin que de « les tests hors critères qui lisent "indisponible" ou "Réessayer" sont réécrits selon R33 à R37 ». — Où : `details.md`, tableau d'impact, avant-dernière ligne de proches.

## Couverture

Règles sans AC : aucune règle entière. Parties sans AC :
- R34 : un plafond trop haut ramené à la plus grande zone ; la ligne **limité** avec les deux phrases (seulement dans la vérification réelle, étape 1) ; « environ » dans une pastille.
- R36 : 180 km ramenés à 2 h 45 (cas limite) ; un résultat moins complet qui ne remplace pas un état d'un autre rang (seul km → km est testé, en AC-8 b ; pas environ ou limité → km quand l'IGN tombe à la réouverture, le cas que D5 veut empêcher) ; « Retirer » pendant un **recalcul**.
- R37 : « fermé pendant son calcul ».
- Résumé replié « approximatif » (H34 étendue).
- R33 : aucun proche **environ** n'est le résultat d'un calcul initial ; il n'apparaît que dans AC-2, où il est obtenu au premier calcul (cohérent, à garder).

Décisions sans effet vérifiable : aucune (D7 est couverte par « Ne change pas » et par le maximum de 2 h 45 d'AC-3).

Décisions sans *Pourquoi* : aucune.

Zones sans état initial : un proche approximatif qui attend son tour de recalcul à l'ouverture ; un proche gardé **en attente** par l'ancienne version (R37 ne cite que « fermé pendant son calcul »).

AC qui dépendent d'un service non simulé : aucun. AC-10 dépend du format de mémoire du commit 56ac3d6, qui est fixé.

Mots de spec.md : environ 850.
