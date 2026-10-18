# Progression — mairies
Début : 2026-10-18 17:57 · Plan : plan.md · Suite au départ : typecheck vert ; Vitest 286 / 286 ; Playwright 351 verts, 36 sautés, 1 rouge (AC-7 de cadre-de-vie, `[bureau]` cadre-de-vie.spec.ts:260, instabilité déjà connue : vert 3 fois sur 3 relancé seul à 18:30)

## Tâches
Tâche 0 : faite — commits c8e5a7e..f99c210 — preuve : [mesure-tache-0.md](mesure-tache-0.md), captures/T0-controles-mairies.txt, T0-chargement-fast4g.txt, T0-reaction.txt (18:40-18:48) ; réponse de Vincent (19:05) : blocs justes, réaction acceptée (H120), un seul chargement (H122) — 32 min d'agent + lecture de Vincent — agent : 228 k — rapport : taches/T0.md
  Vérif orchestrateur (19:18) : blocs de la page 12 de la circulaire relus ; typecheck vert ; Vitest 290 / 290 ; Playwright 350 verts, 36 sautés, 2 rouges (AC-9 et AC-11 de proches-fiables `[bureau]`, l. 669 et 716, charge ≈ 4,5) verts 3 fois sur 3 relancés seuls ; build vert.

## Décisions prises à la place de Vincent
- T0 : table des nuances lue sur l'image des pages 9, 10 et 12 (annexes scannées, texte de `pdftotext` fautif). Coût si faux : une faute de recopie d'étiquette, visible dans la fiche ; aucun sur les blocs.
- T0 : étiquettes écrites comme dans l'annexe (« Ecologiste » sans accent, « Rassemblement National », apostrophe typographique). Coût si faux : trois textes à retoucher dans le CSV.
- T0 : nom de liste = colonne « Libellé de liste » (pas l'abrégé). Coût : aucun, AC-12 le vérifie.
- T0 : deux colonnes de page dans le CSV (`page_etiquette`, `page_bloc`). Coût : aucun.
- T0 : égalité de sièges **et** de voix = arrêt du script (cas absent aujourd'hui). Coût si faux : un futur fichier rectifié arrêterait le script, règle à demander à Vincent.
- T0 : les 74 sans résultat = 6 villages morts pour la France + 68 vraisemblablement sans candidat (non vérifié). Coût : aucun sur le site (D5).

## Preuves

## Coût
