# Démo — proches-fiables
2026-10-16 · construite sur `main` (606f515..bc5d40c), **rien n'est poussé** · Spec : [spec.md](../../specs/2026-10-16-proches-fiables/spec.md) · Suivi : [progress.md](progress.md)

> AC = critère d'acceptation de la spec ; Bloquant / Majeur / Mineur = gravité donnée par un relecteur neuf ; une preuve = capture ou sortie de commande, datée.
> Spec, plan et build ont été validés **par délégation** (tu dormais) : chaque décision prise à ta place est listée plus bas, avec son coût si elle est fausse.

## Ce qui est construit
Un proche compte toujours, même quand l'IGN rame ou tombe. Plus jamais « Trajets indisponibles ».

| Tâche | Ce que tu peux faire maintenant |
|---|---|
| T0 | (mesure) l'IGN de cette nuit : sur 9 proches mesurés, 0 prêt, 7 partiels, 2 en km. Découverte : l'IGN fait garder ses **erreurs 21 jours** par le navigateur. |
| T1 | Une zone en erreur est redemandée une fois, **hors du cache du navigateur** ; le calcul garde les zones obtenues et finit en 45 s au plus. |
| T2 | Un proche **partiel** : « Temps approximatifs : l'IGN n'a pas tout donné. », « Au-delà de 2 h 45 : l'IGN n'a pas répondu. », « jusqu'à 2 h 30 » dans la fiche, curseur limité à la couverture. |
| T3a, T3b | Un proche **à vol d'oiseau** quand l'IGN ne couvre pas ton plafond : « À vol d'oiseau : l'IGN ne répond pas. », curseur en km (2 h → 120 km), fiche et pastille en km. |
| T4 | La mémoire du navigateur garde un proche partiel ou en km ; **tes proches déjà gardés** (iPhone, PC) se relisent sans perte, et un proche « indisponible » est recalculé à l'ouverture. Un retour en arrière après la mise en ligne ne perd aucun proche. |
| T5a, T5b | À la réouverture (15 min au moins après le dernier essai), un proche approximatif se recalcule seul ; « Recalculer avec l'IGN » le fait quand tu veux ; un proche que tu ajoutes passe devant. |

**Pour essayer** : `npm run dev`, puis http://localhost:5173. Ajoute « 12 rue de la Paix, Nantes ». Pour forcer le repli en km dans Chrome : Outils de développement → Réseau → clic droit sur une demande `isochrone` → « Bloquer l'URL de la requête » (ou bloquer le motif `data.geopf.fr/navigation/isochrone`), puis retire et rajoute le proche.

## Preuves
- **Critères : 12 sur 12 passent** (AC-1 à AC-12, [acceptance.json](../../specs/2026-10-16-proches-fiables/acceptance.json)), chacun avec un test qui porte son numéro, en bureau et à 390 px (AC-5 : bureau seul, pas de pastilles sur téléphone).
- **Suite** (relancée par moi à 21:00, [verif-corrections-1.txt](captures/verif-corrections-1.txt)) : Vitest 286/286 ; Playwright 349 verts, 36 sautés, 3 rouges, tous dans cadre-de-vie, même cause (voir « Non vérifié ») ; types et build OK.
- **Sur le vrai IGN, avec le code final** (20:27, [C1-preuve-sortie.txt](captures/C1-preuve-sortie.txt)) :
  1. pannes du soir de la démo rejouées → proche **partiel** en 45,7 s, curseur jusqu'à 2 h 45, La Rochelle « jusqu'à 2 h 15 » ([capture 390 px](captures/C1-390-1-ligne.jpg)) ;
  2. calcul de trajets coupé → **km**, « 120 km au plus », La Rochelle à 121 km, donc juste au-dessus ([capture](captures/C1-390-2-fiche-la-rochelle.jpg)) ;
  3. IGN rétabli, réouverture → « Recalcul avec l'IGN… », puis **prêt** à 2 h, La Rochelle « 2 h 15 en voiture » ([capture](captures/C1-390-3-apres.jpg)) ;
  aucune demande à l'IGN ne contient le nom du proche ni son adresse.
- **Proches gardés par la version en ligne** ([T4-preuve-sortie.txt](captures/T4-preuve-sortie.txt)) : des entrées copiées du site en ligne sont recalculées par la nouvelle version, relues identiques sans aucune demande à la réouverture, puis relues sans perte par l'ancienne version.

## Décisions prises à ta place
| Décision | Coût si c'est faux |
|---|---|
| Seuil du repli : km quand l'IGN ne couvre pas le plafond choisi (ton choix) ; 1 h = 60 km (H94, sans mesure) | 60 km par heure n'est qu'un plafond de départ, que tu règles ensuite en km |
| Le second essai d'une zone ignore le cache du navigateur (après la découverte de T0) | Au pire une demande de plus à l'IGN |
| 15 min au moins entre deux recalculs automatiques (H93) | Un proche reste approximatif jusqu'à 15 min de plus |
| Format gardé compatible avec la version en ligne (`v: 1`, proche approximatif écrit « non prêt ») | Aucun : vérifié dans les deux sens |
| Pas de page Figma ; ligne d'un proche approximatif fixée par moi (phrases en texte normal, lien « Recalculer avec l'IGN <nom> », 44 px sur téléphone) | Un réglage visuel à refaire |
| Test d'AC-10 de proches retiré dès T1 au lieu de T3a (même retrait, accepté avec D18) | Aucun visible |
| Un ajout ou un recalcul manuel passe juste devant le premier recalcul automatique en attente ; à l'ouverture, l'ordre d'ajout | Ne change que l'ordre d'attente, jamais une note ni un filtre |
| Curseur d'un proche partiel à l'échelle 15 min → couverture (la poignée de 2 h est plus à droite) | Un rail à redessiner |
| Pastille d'un proche km : « 88 km », sans « à vol d'oiseau » (la ligne et la fiche le disent) | Un mot à ajouter |
| Je n'ai pas arrêté le build à la 3ᵉ tâche avec des fichiers hors liste : c'étaient des fichiers prévus en T3b, avancés | Un plan dont les listes de fichiers étaient fausses |

## Relectures
- **Code contre spec** ([review-spec.md](review-spec.md)) : 0 bloquant, **1 majeur corrigé** (à la réouverture, l'ordre d'ajout n'était pas tenu ; test de non-régression qui passe par la vraie réouverture), 2 mineurs : vérification de bout en bout rejouée sur le code final (faite) ; instabilité d'AC-7 de cadre-de-vie (laissée, voir plus bas).
- **Navigateur** ([qa.md](qa.md)) : 0 bloquant, 0 majeur, **3 mineurs laissés** :
  1. au clavier, après le choix d'une adresse avec Entrée, le focus reste dans le champ d'adresse au lieu d'aller au champ « Nom » (pas isolé : peut-être l'enchaînement de touches du testeur) ;
  2. en bureau, « Recalculer avec l'IGN » et « Retirer » font 24 px de haut (le minimum), 44 px sur téléphone ;
  3. à 390 px, la poignée du curseur fait 18 × 18 px (composant existant, toutes tranches).

## Non vérifié
- **Safari** : que `cache: 'reload'` contourne bien les erreurs gardées n'est prouvé que dans Chromium et par un test unitaire. Ton iPhone le dira après la mise en ligne.
- **AC-9 et AC-11** (recalcul manuel, priorité d'un ajout) : prouvés sur les données de test seulement.
- **Recalcul automatique après 15 min** sur le vrai flux : simulé en avançant l'horloge, pas attendu 15 min.
- **Étape 4** (en ligne, IGN normal) : à `/ship`.
- **Tests instables de cadre-de-vie** (AC-7, AC-11) : le clic sur la carte n'est parfois pas pris, la fiche reste sur la commune d'avant ; les valeurs sont justes. Mesuré **avant** cette tranche aussi (1 échec sur 6 sur `656fd86`) ; aujourd'hui de 0 à 3 échecs par suite complète selon la charge. À corriger à part (le test doit attendre la carte avant de cliquer), sans toucher à ses critères.
- **Fond de carte** : pendant la dernière vérification en bureau, le fond IGN ne s'est pas chargé (carte de secours), et sa pastille « Fond de carte indisponible » recouvrait la pastille du proche. Panne de l'IGN, pas de cette tranche ; le chevauchement des deux pastilles est à regarder.

## Coût
- **Durée** : spec commencée le 2026-10-16 vers 00:30 → démo à 21:10, soit ≈ 20 h 40 d’horloge, dont ≈ 5 h 15 de veille de la machine la nuit et ≈ 2 h d'attente que l'IGN revienne. Travail des agents : ≈ 6 h.
- **Agents** : 10 constructeurs (T0 76 k, T1 422 k, T2 207 k, T3a 240 k, T3b 132 k, T4 193 k, T5a 219 k, T5b 239 k, simplification 111 k, corrections 104 k : ≈ 1,9 M jetons) ; 6 relecteurs (spec ×2, plan, code, navigateur ×2 : ≈ 0,8 M jetons).
- **Détours** : 1 question d'un constructeur (AC-10 de proches, T1) ; 3 tâches de suite avec des fichiers hors liste ; 1 relecteur navigateur arrêté à sa limite de tours et relancé ; 1 majeur corrigé ; plan passé de 6 à 8 tâches après sa relecture.
