# Tâche 0b — Les temps de chaque commune, servis
Statut : faite · Début 12:51 · Fin 13:05 · Commits : voir `git log` (message « feat(services): tâche 0b — … »)

## Ce que l'utilisateur peut faire maintenant
Rien de visible sur le site encore (la fiche et le filtre sont les tâches 1 à 4). Pour la suite :
- `public/data/services.json` existe : les 10 temps en voiture (médecin, commerce, crèche, école, collège, lycée, supérieur, gare, gare régionale, gare grandes lignes) des 34 746 communes, joints par code INSEE, et la liste des 16 îles sans pont ; 626 Ko bruts, **304 Ko en `gzip -9`** (limite 350), 238 Ko tels que le site les envoie (`brotli -q 3`).
- `public/data/gares-grandes-lignes.csv` : les 61 gares grandes lignes ajoutées (ODbL, H172).
- `src/domain/services.ts` : la table des noms des services (fichier, adresse, libellé), `lireServices` (ce que la page et le test d'AC-13 lisent) et `ecrireServices` (pour `carte.ts` et les unitaires).
- `python3 -I scripts/data/services.py` refait tout en 17 s et s'arrête au premier contrôle qui échoue.

## Critères
| AC | Test (fichier · nom) | Résultat |
|---|---|---|
| AC-5 | `scripts/data/services.test.ts` · « AC-5 : commerce de X 4 min, médecin de Y 2, de Z 3, de V 9, lycée de W 9 ; arrondis 0,4 → 1, 4,49 → 4, 4,5 → 5 ; ville à arrondissements 3 min » | vert (script lancé par `execFileSync('python3', ['-I', …, '--extrait', …])`) |
| AC-16 | `scripts/data/services.test.ts` · « AC-16 : g1 3 min, g2 5, g3 15, g4 70 (« plus d'une heure »), g5 et g6 pas de chiffre » | vert (`--grandes-lignes` ; 70 relu 61 par `lireServices`) |
| AC-13 | `scripts/data/services.test.ts` · « AC-13 : une ligne par commune de la carte ; Auch, Bordeaux, Mende, Les Sables-d'Olonne, L'Île-d'Yeu et les 6 communes de population 0 » | vert (vrai `public/data/services.json` lu par `lireServices`) ; aussi contrôlé dans `services.py` |
| — | `scripts/data/services.test.ts` · « aller-retour : 60 → 60, 61 → 61, 75 → 61 (« 61 ou plus »), pas de chiffre → null » | vert |

## Preuves
- `docs/plans/2026-11-24-services/mesure-tache-0.md`, section « Part 0b » — sortie des contrôles de `services.py` (tous « ok »), comptes refaits à côté de ceux de /spec, 85 communes à écart de population, poids (2026-11-24 13:00–13:01).
- `docs/plans/2026-11-24-services/captures/T0b-sortie-services.txt` — sortie complète de `python3 -I scripts/data/services.py` (13:00:20 → 13:00:37).
- `docs/plans/2026-11-24-services/captures/T0b-relecture-5-communes.txt` — Auch, Bordeaux, Mende, Les Sables-d'Olonne et L'Île-d'Yeu relues dans le fichier servi par `lireServices` (13:01) : Auch 2, 2, 3, 2, 3, 3, 4, 4, 4, plus d'une heure ; Bordeaux 1, 1, 1, 1, 2, 2, 3, 5, 7, 7 ; Mende supérieur 2, gare 3, régionale et grandes lignes plus d'une heure ; Les Sables-d'Olonne grandes lignes 4 ; L'Île-d'Yeu médecin, lycée, supérieur, 3 gares sans chiffre, commerce 3.
- Sortie des contrôles (extrait) :
  ```
    ok   34736 communes avec au moins un carreau habité (attendu 34736, D2)
    ok   les 10 sans carreau sont celles des mesures : 09304 Suzan, 26375 Villefranche-le-Château, 29083 Île-de-Sein, 29084 Île-Molène, 55039 …, 55307 Louvemont-Côte-du-Poivre
    ok   34738 communes avec au moins un temps (attendu 34738) ; sans : 29083 Île-de-Sein, 29084 Île-Molène, 55039 …, 55307
    ok   les 6 communes de population 0 sans aucun temps
    ok   AC-13 : Auch (32013) {… 'gare_grandes_lignes': 61}   (et Bordeaux, Mende, Les Sables-d'Olonne, L'Île-d'Yeu)
    ok   poids : 625730 octets bruts, 304116 octets en gzip -9 (limite 350000, H162)
    ok   61 gares écrites et relues
  ```
- Comptes : **tous égaux** à ceux des tables de mesures de /spec (10 services, chaque seuil). Sonde jetable : les 347 460 valeurs servies sont égales à celles de l'essai de /spec (`data-raw/services-calcul/lignes-10.csv`), 0 écart.
- Ce que la preuve ne couvre pas : aucun affichage (tâche 1) ; la justesse des temps face à une autre source (tâche 0c, jugée à la démo).

## Suite de tests
- `npm run test:unit` : `Test Files  23 passed (23)` · `Tests  369 passed (369)` (13:00)
- `npm run typecheck` : sans erreur (13:00)
- `node scripts/check-tokens.mjs` : `check-tokens : 45 fichier(s), aucune valeur arbitraire`
- `npm test` / `npm run test:e2e` / `npm run build` : non lancés (consigne de l'orchestrateur : une suite Playwright tourne peut-être sur le port 4173 ; aucun écran touché)

## Décisions prises à la place de Vincent
- Décision : **la lettre de 60 min est « y », pas « Y »** — pourquoi : le plan dit « le caractère de rang n vaut n minutes » avec l'alphabet `0…9A…Za…z`, et « z » au rang 61 ; le rang 60 y est « y » (« Y » est au rang 34, soit 34 min). J'ai suivi la règle du rang, cohérente avec « z » = 61, et non la lettre écrite — coût si c'est faux : aucun tant que `services.py` et `services.ts` partagent l'alphabet (c'est le cas, testé par l'aller-retour).
- Décision : populations et durées lues **en entiers** (populations en 10⁻¹⁶ habitant, durées en centièmes de minute), pas en flottants — pourquoi : les populations des carreaux sont parfois des flottants écrits à 16 décimales (« 3.3333333333333335 ») ; l'« égalité exacte retenue » de H157 et l'arrondi « moitié vers le haut » de H156 ne dépendent ainsi d'aucune erreur de virgule flottante ; un nombre à plus de décimales arrête le script — coût si c'est faux : nul ici (résultat identique à l'essai sur toutes les valeurs).
- Décision : `services.py` contrôle aussi le sha256 des trois fichiers de la tâche 0a (extrait, gares, openrouteservice) et s'arrête s'il change — pourquoi : l'extrait n'est pas versionné ; un extrait refait autrement ne doit pas passer en silence — coût si c'est faux : une nouvelle extraction identique mais écrite dans un autre ordre arrêterait le script (il suffira de mettre à jour l'empreinte après contrôle).
- Décision : les retraits de `services-retraits.csv` (D12) ne s'appliquent qu'au vrai calcul, pas aux modes `--extrait` et `--grandes-lignes` — pourquoi : un retrait vise une vraie commune par son code ; les extraits des tests ont des codes inventés — coût si c'est faux : nul.
- Décision : **le fichier ne met pas « pas de chiffre » sur la gare et la gare régionale des îles, ni sur la gare régionale de la Corse** ; seule « Gare grandes lignes » est forcée à « pas de chiffre » pour elles (texte du plan et de R52). La page lit `iles_sans_pont` et `dep` pour dire « aucune sur l'île » / « aucune en Corse » (R54). Conséquence visible dans le fichier : Île-de-Bréhat garde sa gare à 9 min (cas limite de details.md, la fiche dira « aucune sur l'île ») ; la Corse n'a de toute façon aucun temps de gare régionale dans la source — coût si c'est faux : nul pour la page, qui ne lit pas ces valeurs pour ces communes.
- Décision : `gares-grandes-lignes.csv` reprend `services-gares.csv` tel quel (mêmes colonnes `uic, nom, lon, lat, tgv_jour, intercites_jour, code`), fins de ligne `\n` — décidé par Claude — pourquoi : partage à l'identique des 61 gares (H172), sans rien inventer — coût si c'est faux : une colonne de trop ou de moins, à retoucher dans `services.py`.
- Décision : clés de `services.json` dans l'ordre `codes`, les 10 services (ordre de la fiche), `iles_sans_pont` ; codes dans l'ordre de `communes.json` — décidé par Claude — coût si c'est faux : nul (la page joint par code).

## Fichiers touchés hors de la liste de la tâche
- `docs/plans/2026-11-24-services/captures/T0b-sortie-services.txt` et `captures/T0b-relecture-5-communes.txt` — preuves (sortie complète, relecture par `lireServices`).
- `docs/solutions/2026-11-24-insee-acces-equipements-parts-par-iris.md` (ligne « Revu le ») et `docs/solutions/README.md` (index régénéré par le crochet).
- `docs/plans/2026-11-24-services/taches/T0b.md` (ce rapport).
- Non touché, à signaler : `CLAUDE.md` → Données ne nomme pas encore `scripts/data/services.py`, `services.json`, `gares-grandes-lignes.csv` ni `services-retraits.csv` (sortie 4 de la tâche 0a parlait des « deux fichiers produits ») ; je ne l'ai pas modifié (hors de ma liste) — à ajouter par l'orchestrateur s'il le juge utile.

## Tests existants modifiés
- aucun (seul `scripts/data/services.test.ts`, nouveau)

## Leçons écrites
- `docs/solutions/2026-11-24-insee-acces-equipements-parts-par-iris.md` — ligne « Revu le 2026-11-24 (tâche 0b) » : populations des carreaux en flottants à 16 décimales ; lire en entiers pour une égalité exacte (H157). Écrite parce qu'une mesure a contredit l'hypothèse de départ du script (15 décimales au plus : premier passage arrêté par le contrôle `fixe`, sur « 3.3333333333333335 »).

## Notes pour la suite
- Lecture : `lireServices(json)` renvoie `temps: Map<code, (number | null)[]>` dans l'ordre de `SERVICES` (61 = « 61 min ou plus », null = pas de chiffre) et `iles: Set<string>` ; une chaîne de mauvaise longueur ou un caractère hors alphabet lève une erreur.
- Écriture : `ecrireServices([{ code, temps: TempsServices, ile_sans_pont? }])` ; un temps non entier ou inférieur à 1 lève une erreur ; au-delà de 61, « z ».
- Information (mesure) : 85 communes de 500 habitants ou plus ont une population des carreaux à plus de 30 % de leur population légale, comme pendant /spec ; 28 en Corse ; pistes (personnes en communauté : camps militaires, prisons ; frontaliers de Genève) non vérifiées ; sans effet sur les temps.
