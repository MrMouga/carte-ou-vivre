# Progression — mairies
Début : 2026-10-18 17:57 · Plan : plan.md · Suite au départ : typecheck vert ; Vitest 286 / 286 ; Playwright 351 verts, 36 sautés, 1 rouge (AC-7 de cadre-de-vie, `[bureau]` cadre-de-vie.spec.ts:260, instabilité déjà connue : vert 3 fois sur 3 relancé seul à 18:30)

## Tâches
Tâche 0 : faite — commits c8e5a7e..f99c210 — preuve : [mesure-tache-0.md](mesure-tache-0.md), captures/T0-controles-mairies.txt, T0-chargement-fast4g.txt, T0-reaction.txt (18:40-18:48) ; réponse de Vincent (19:05) : blocs justes, réaction acceptée (H120), un seul chargement (H122) — 32 min d'agent + lecture de Vincent — agent : 228 k — rapport : taches/T0.md
  Vérif orchestrateur (19:18) : blocs de la page 12 de la circulaire relus ; typecheck vert ; Vitest 290 / 290 ; Playwright 350 verts, 36 sautés, 2 rouges (AC-9 et AC-11 de proches-fiables `[bureau]`, l. 669 et 716, charge ≈ 4,5) verts 3 fois sur 3 relancés seuls ; build vert.

Tâche 1 : faite — commits 4645405..40cc3f0 — preuve : captures/T1-gauche-1440x900.png, T1-sans-limite-gauche-1440x900.png, T1-fiche-bordeaux-sans-limite-gauche-1440x900.png (19:29), T1-npm-test.txt (19:41) — 20 min — agent : 179 k — rapport : taches/T1.md
  Vérif orchestrateur (20:10) : `tests/e2e/lib/carte.ts` +16 lignes, 0 changée (conforme au plan) ; typecheck vert ; Vitest 306 / 306 ; Playwright 355 verts, 36 sautés, 0 rouge ; build vert ; capture de la fiche de Bordeaux relue. **À signaler** : le garde-fou des tests protégés n'a pas demandé l'accord de Vincent pour `carte.ts` (le builder l'a d'abord écrit par un script, puis refait à l'outil d'édition : aucune demande dans les deux cas) — pour /retro.

Tâche 2 : faite — commits ce3b487..0b9cac2 — preuve : captures/T2-depart-*, T2-choix-* (1440 × 900, 390 × 844), T2-sans-limite-gauche-*.png (Paris, Lyon, Marseille, Bordeaux, Nice), T2-reaction.txt, T2-npm-test.txt (20:00-20:30) — 33 min — agent : 219 k — rapport : taches/T2.md
  Vérif orchestrateur (20:53) : aucun test protégé modifié ; typecheck vert ; Vitest 307 / 307 ; Playwright 369 verts, 36 sautés, 1 rouge (AC-7 de cadre-de-vie l. 260, l'instable connu) vert 3 fois sur 3 seul ; build vert ; T2-choix-390x844 comparée à F-choix-390x844 : mêmes pastilles, même phrase. **Pour la démo** : réaction ≈ 148 ms (cocher « Centre ») / ≈ 233 ms (décocher), contre ≈ 130 / 215 ms acceptés en T0 ; la version de T1 mesurée le même soir donne les mêmes chiffres (la machine, pas T2) ; « Sans étiquette » ≈ le curseur du prix.

## Décisions prises à la place de Vincent
- T0 : table des nuances lue sur l'image des pages 9, 10 et 12 (annexes scannées, texte de `pdftotext` fautif). Coût si faux : une faute de recopie d'étiquette, visible dans la fiche ; aucun sur les blocs.
- T0 : étiquettes écrites comme dans l'annexe (« Ecologiste » sans accent, « Rassemblement National », apostrophe typographique). Coût si faux : trois textes à retoucher dans le CSV.
- T0 : nom de liste = colonne « Libellé de liste » (pas l'abrégé). Coût : aucun, AC-12 le vérifie.
- T0 : deux colonnes de page dans le CSV (`page_etiquette`, `page_bloc`). Coût : aucun.
- T0 : égalité de sièges **et** de voix = arrêt du script (cas absent aujourd'hui). Coût si faux : un futur fichier rectifié arrêterait le script, règle à demander à Vincent.
- T0 : les 74 sans résultat = 6 villages morts pour la France + 68 vraisemblablement sans candidat (non vérifié). Coût : aucun sur le site (D5).
- T1 : la mairie élue est portée par `bord` (7 noms de H108, `null` = sans résultat), `nuance` (étiquette en clair) et `liste` ; raison `{ critere: 'bord' }`. Coût si faux : un renommage.
- T1 : `joindreBords` et les types des deux fichiers dans `src/domain/score.ts` (pas de fichier nouveau hors plan). Coût : aucun.
- T1 : commune absente de `mairies.json` = sans résultat ; nuance absente de `nuances.json` = page en erreur (pas de bloc deviné, H117). Coût si faux : un fichier mal régénéré met le site en erreur.
- T1 : libellés des 7 pastilles (`LIBELLE_BORD`, `format.ts`) posés dès T1 ; raison en minuscules comme pour le type. Coût : aucun.
- T2 : décocher la dernière case retire le champ `mairies` (pas de liste vide). Coût : aucun visible.
- T2 : résumé replié « 1 choix », « 2 choix » avec espace insécable, comme « 2 tailles ». Coût : aucun.
- T2 : dans les tests, une deuxième fiche ouverte depuis la carte = rouvrir la même adresse (choisir une commune zoome, D14). Coût : aucun.

## Preuves

## Coût
