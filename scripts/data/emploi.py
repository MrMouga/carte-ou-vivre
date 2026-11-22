"""Emploi de chaque commune de la carte (tranche emploi, R45, R50, H134, H135, H137, H138, H142) : public/data/emploi.json.

Sources (téléchargées par sources.py, empreintes notées dans CLAUDE.md) :
- enquête Besoins en main-d'œuvre 2026 de France Travail (Licence Ouverte), feuille « BMO_2026_open_data » : une ligne
  par métier × bassin × comité local (`clpe`), `met` = projets de recrutement, « * » = case cachée ;
- table des bassins d'emploi 2026 de France Travail (aucune licence écrite ; réutilisée en citant la source et sa date,
  décision de Vincent du 2026-11-21, H143) : commune 2026 → bassin ;
- taux de chômage localisés par zone d'emploi, Insee (Licence Ouverte), dernier trimestre publié (feuille « txcho_ze ») ;
- zones d'emploi 2020 des communes, géographie au 01/01/2025 (Insee) : celle de communes.json, jointure directe ;
- mouvements des communes du COG 2026 (Insee) : les communes 2025 absentes de la table des bassins (H142).

Règles :
- R45, H137 (`niveaux`, une seule fonction pour le vrai fichier et l'extrait d'AC-8) : projets d'un bassin = somme des
  lignes publiées (« * » ne compte pas) ; chiffré = au moins une ligne publiée ; sur les N bassins de métropole, k = N × 10 %
  ou 25 % arrondi au plus proche, moitié vers le haut ; un niveau garde les bassins chiffrés dont les projets sont au moins
  ceux du k-ième (égalités gardées) ; « tous » = chiffré hors des 25 %.
- R50 : un métier chiffré dans moins de 130 bassins de métropole est « peu chiffré ».
- H142 : commune → bassin par code INSEE ; Paris, Lyon, Marseille par leurs arrondissements (un seul bassin chacune) ;
  la table est sur une géographie plus ancienne que 2025 pour quelques codes : une commune de la carte absente de la
  table prend le bassin de son ancien code ou de la commune dont elle est sortie (mouvements du COG 2026, `recalage`).
- H135 : ville principale d'un bassin = sa commune de la carte la plus peuplée, égalité au plus petit code ; le bassin
  de Monaco (9399) n'a aucune commune de la carte : pas de ville principale (null). Exception (H135 amendée, Vincent,
  2026-11-21) : le bassin 7503 « CONFOLENS », que la table compose de communes de Charente et du Médoc, prend la plus
  peuplée de ses communes de Charente (16), même règle d'égalité ; le script s'arrête si le bassin n'est plus sur deux
  départements, et si une autre ville principale que la sienne change.
- H138 : commune → zone d'emploi → taux du dernier trimestre ; nom de la zone tel que l'écrit l'Insee.
- H134 : noms courants de scripts/data/noms-metiers.csv (liste écrite à la main : pas de table ouverte de la Dares).

Sortie : emploi.json = {"champs": {...}, "trimestre_chomage", "bassins": [[code, ville]], "zones": [[code, nom, taux]],
"metiers": [{"code", "libelle", "noms", "peu_chiffre", "bassins": [[bassin, projets, niveau]]}], "communes":
[[code, bassin, zone]]} ; les bassins d'un métier sont ceux qui sont chiffrés, classés par projets décroissants.
Aucune distance (la page les calcule, H136).

Prérequis : python3 scripts/data/sources.py, puis python3 scripts/data/communes.py
Usage : python3 -I scripts/data/emploi.py  (s'arrête sur le premier contrôle qui échoue)
        python3 -I scripts/data/emploi.py --extrait <fichier.json>  (format de fixture.extrait_bmo d'AC-8 : écrit sur la
        sortie standard {"<bassin>": {"projets", "niveau"} | null} pour chaque bassin de `bassins`)
"""
import collections
import csv
import hashlib
import io
import json
import math
import os
import sys
import zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from communes import feuille_xlsx  # noqa: E402
from sources import BASSINS, BMO, CHOMAGE, MVT_2026, ZE  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
RAW = os.path.join(ROOT, 'data-raw')
OUT = os.path.join(ROOT, 'public', 'data')
NOMS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'noms-metiers.csv')
CLAUDE_MD = os.path.join(ROOT, 'CLAUDE.md')

# Fichiers retenus en tâche 0a (2026-11-21), noms de sources.py, empreintes notées aussi dans CLAUDE.md : un fichier
# changé arrête le script.
FICHIERS = {
    'BMO 2026': (BMO, '735d0443b799b4c18c145055f87244a355a48b6286ee98ddbab272491d9792e0'),
    'bassins 2026': (BASSINS, '3c7f5048491b90d21cfb16afdacb98f60b03a127b34bc871fd09fa41c09da455'),
    'chômage': (CHOMAGE, '0662c648e68feec0fd1901bd11fe9a084043e03ead3103f526b19c35de588db7'),
    'zones d\'emploi': (ZE, 'aec5884669f23669e6234f5a2d5fe4c33d1b5af3d5bf7135dd14f640b63eda2c'),
    'COG 2026': (MVT_2026, '8b339fad8232e97233af3fd9468715af845e2cf8b14cb67b24d9a301ef8645f1'),
}
SEUIL_PEU_CHIFFRE = 130  # R50 (D14)
MIN_BASSINS = 6  # H146
PLM = {'75056': [f'751{i:02d}' for i in range(1, 21)], '69123': [f'6938{i}' for i in range(1, 10)],
       '13055': [f'132{i:02d}' for i in range(1, 17)]}
BASSIN_PLM = {'75056': '1107', '69123': '8428', '13055': '9306'}  # H142
# H135 amendée (Vincent, 2026-11-21, tâche 0c) : bassin → (département dont il prend la commune la plus peuplée, ville attendue).
VILLE_PAR_DEPARTEMENT = {'7503': ('16', '16192')}  # CONFOLENS : Terres-de-Haute-Charente, et non Castelnau-de-Médoc (33104)
ABSENTES = ['12218', '14581', '15031', '15035', '15047', '15171', '49126', '60694', '69114', '80832', '85165', '85212']  # H142
NOMS_IMPOSES = {'développeur': 'M2X90', 'data scientist': 'M2X90', 'UX designer': 'U1X82', 'sage-femme': 'V1X80',
                'business developer': 'R4X90', 'prospecteur': 'R4X90', "chargé d'affaires": 'R4X90'}
# Comptes d'AC-12 (mesurés le 2026-11-21) ; tout écart arrête le script (condition d'arrêt de la tâche 0).
ATTENDU = {'bassins': 389, 'métiers': 217, 'communes': 34746}
AC12 = {'metier': 'M2X90', 'niveau 10': 39, 'niveaux 10 ou 25': 98, 'chiffrés': 120, 'Bordeaux': ('33063', 742, '10'),
        'La Rochelle': '17300'}
# Libellés lus par la fixture d'emploi (AC-2 se joue sur la fixture) : un écart est signalé, sans arrêt.
LIBELLES_FIXTURE = {
    'V1X80': 'Infirmiers et sages-femmes', 'V2X90': 'Médecins', 'M2X90': "Ingénieurs et cadres d'étude, recherche et développement en informatique et télécom",
    'U1X82': 'Graphistes, dessinateurs, stylistes, décorateurs et créateurs de supports de communication visuelle'}
MODE_EXTRAIT = '--extrait' in sys.argv  # contrôles écrits sur la sortie d'erreur, la sortie standard reste du JSON


def check(cond, msg, muet=False):
    """Contrôle : affiché, arrêt s'il échoue ; `muet` : affiché seulement s'il échoue."""
    if cond and muet:
        return
    print(('  ok   ' if cond else '  ÉCHEC ') + msg, file=sys.stderr if MODE_EXTRAIT else sys.stdout)
    if not cond:
        raise SystemExit(1)


def k_vise(n, pour_cent):
    """H137 : N × p % arrondi au plus proche, moitié vers le haut (entiers : pas d'erreur de virgule flottante)."""
    return (n * pour_cent + 50) // 100


def niveaux(lignes, bassins):
    """R45, H137 : niveau de chaque bassin pour un métier.

    `lignes` : [(bassin, met)] avec met = texte du fichier (« * » = case cachée) ; `bassins` : les N bassins du territoire.
    Renvoie {bassin: {"projets", "niveau"} | None} (None : aucune ligne publiée, ou absent des lignes).
    """
    projets = {}
    for b, met in lignes:
        check(b in bassins, f'bassin {b} du territoire', muet=True)
        met = met.strip()
        if met == '*':
            continue
        check(met.isdigit(), f'projets « {met} » entiers', muet=True)
        projets[b] = projets.get(b, 0) + int(met)
    classes = sorted(projets.values(), reverse=True)
    seuils = {}
    for niveau, p in (('10', 10), ('25', 25)):
        k = k_vise(len(bassins), p)
        seuils[niveau] = classes[min(k, len(classes)) - 1] if classes and k else None
    sortie = {}
    for b in bassins:
        if b not in projets:
            sortie[b] = None
            continue
        n = projets[b]
        niveau = '10' if seuils['10'] is not None and n >= seuils['10'] else '25' if seuils['25'] is not None and n >= seuils['25'] else 'tous'
        sortie[b] = {'projets': n, 'niveau': niveau}
    return sortie


def extrait(chemin):
    """AC-8 : le même calcul sur un extrait au format de fixture.extrait_bmo."""
    ex = json.load(open(chemin, encoding='utf-8'))
    json.dump(niveaux([(l['bassin'], l['met']) for l in ex['lignes']], ex['bassins']), sys.stdout, ensure_ascii=False)
    print()


def empreintes():
    """Chaque fichier présent est celui retenu (empreinte écrite ici et dans CLAUDE.md) et celui noté par sources.py."""
    claude = open(CLAUDE_MD, encoding='utf-8').read()
    for titre, (nom, attendu) in FICHIERS.items():
        path = os.path.join(RAW, nom)
        info = json.load(open(path + '.info.json'))
        sha = hashlib.sha256()
        with open(path, 'rb') as f:
            while chunk := f.read(1 << 20):
                sha.update(chunk)
        print(f"{titre} : {nom}, Last-Modified {info['last_modified']}, téléchargé le {info['telecharge_le']},"
              f" {info['octets']} octets, sha256 {sha.hexdigest()}")
        check(sha.hexdigest() == attendu == info['sha256'] and attendu in claude,
              f'{titre} : empreinte égale à celle retenue (CLAUDE.md) et à celle notée')


def colonnes(lignes, i):
    """Feuille lue par feuille_xlsx : {nom de colonne: lettre} d'après la ligne d'en-tête i."""
    return {v: k for k, v in lignes[i].items()}


def lire_bmo():
    """Lignes de métropole (départements hors 97x) : {métier: [(bassin, met)]}, libellés, bassins."""
    lignes = feuille_xlsx(os.path.join(RAW, FICHIERS['BMO 2026'][0]), 'BMO_2026_open_data')
    c = colonnes(lignes, 0)
    check(all(k in c for k in ('Code métier BMO', 'Nom métier BMO', 'Dept', 'BE26', 'NOMBE26', 'clpe', 'met')),
          'BMO : colonnes attendues (BE26, clpe, met…)')
    par_metier, libelle, bassins, doublons = collections.defaultdict(list), {}, {}, set()
    vus, sans_clpe, parts = set(), 0, collections.defaultdict(list)
    for r in lignes[1:]:
        r = {k: r.get(v, '') for k, v in c.items()}  # une cellule vide est absente de la ligne lue
        if r['Dept'].startswith('97'):
            continue
        code, b = r['Code métier BMO'], r['BE26']
        sans_clpe += not r['clpe']
        # Un couple (bassin, comité local) sur deux ou trois départements a une ligne par département, aux chiffres
        # différents (12 couples, Île-de-France, Bretagne, Drôme-Ardèche, Alsace) : ce sont des parts, additionnées.
        cle = (code, b, r['clpe'], r['Dept'])
        if cle in vus:
            doublons.add(cle)
        vus.add(cle)
        parts[(code, b, r['clpe'])].append((r['met'], r.get('xmet', ''), r.get('smet', '')))
        lib = r['Nom métier BMO'].strip()
        check(libelle.setdefault(code, lib) == lib, f'{code} : un seul libellé', muet=True)
        check(bool(code and b and r['met']), f'ligne complète (métier, bassin, met) : {r}', muet=True)
        bassins.setdefault(b, r['NOMBE26'])
        par_metier[code].append((b, r['met']))
    print(f'BMO : {sum(len(v) for v in par_metier.values())} lignes de métropole, dont {sans_clpe} sans comité local (Monaco)')
    check(not doublons, f'BMO : une seule ligne par métier × bassin × comité local × département ({len(doublons)} en double)')
    multi = {k: v for k, v in parts.items() if len(v) > 1}
    pareilles = {k: v for k, v in multi.items() if len(set(v)) == 1}
    print(f'BMO : {len(multi)} métier × bassin × comité local sur plusieurs départements (une ligne chacun, additionnées) ;'
          f' {len(pareilles)} aux lignes identiques (met, xmet, smet) : {sorted(pareilles.items())[:8]}')
    publiees_pareilles = [k for k, v in pareilles.items() if v[0][0] != '*']
    print(f'  dont avec un chiffre publié : {len(publiees_pareilles)} {[(k, parts[k]) for k in publiees_pareilles]}')
    return par_metier, libelle, bassins


def lire_bassins_table():
    lignes = feuille_xlsx(os.path.join(RAW, FICHIERS['bassins 2026'][0]), 'Feuil1')
    c = colonnes(lignes, 0)
    table = {}
    for r in lignes[1:]:
        code = r[c['code_commune']].zfill(5)
        check(table.setdefault(code, r[c['code_bassin_2026']]) == r[c['code_bassin_2026']], f'{code} dans un seul bassin', muet=True)
    return table


def recalage(code, table, mvt):
    """Commune de la carte absente de la table des bassins : la table est sur une géographie plus ancienne que son nom
    (mesuré le 2026-11-21 : les 12 absentes sont des changements de code de 2024-2025 et des communes rétablies le
    1er janvier 2025). On remonte les mouvements du COG (comme H86 de cadre-de-vie) : la commune prend le bassin de
    l'ancien code dont elle vient (changement de code, MOD 50) ou de la commune dont elle est sortie (rétablissement,
    MOD 21). Renvoie (code de la table, mouvements suivis) ou (None, …) si ce n'est pas un seul bassin."""
    chemin, courants = [], {code}
    while courants and not (courants & set(table)):
        avant = {(r['COM_AV'], r['MOD'], r['DATE_EFF']) for r in mvt
                 if r['COM_AP'] in courants and r['COM_AV'] not in courants and r['TYPECOM_AV'] == 'COM' and r['TYPECOM_AP'] == 'COM'}
        chemin += sorted(avant)
        courants = {a for a, _, _ in avant}
    trouves = sorted(courants & set(table))
    if not trouves or len({table[c] for c in trouves}) != 1:
        return None, chemin
    return trouves[0], chemin


def distance_km(a, b):
    """Distance à vol d'oiseau entre deux points [lon, lat], en km (haversine, sphère de 6 371 km : `distanceKm` de
    src/proches/distance.ts)."""
    (lon1, lat1), (lon2, lat2) = a, b
    h = (math.sin(math.radians(lat2 - lat1) / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(math.radians(lon2 - lon1) / 2) ** 2)
    return 2 * 6371 * math.asin(min(1, math.sqrt(h)))


def voisine(code, points, candidates):
    """H142 amendée (Vincent, 2026-11-21) : commune absente de la table sans aucun mouvement du COG → la commune de la
    table la plus proche, de mairie à mairie (points de reperes.json) ; égalité au plus petit code. (code, km) ou None."""
    if code not in points:
        return None
    proches = sorted((distance_km(points[code], points[c]), c) for c in candidates if c != code and c in points)
    return (proches[0][1], proches[0][0]) if proches else None


def lire_zones():
    """Composition communale des zones d'emploi 2020 (géographie au 01/01/2025) : code INSEE → zone."""
    z = zipfile.ZipFile(os.path.join(RAW, FICHIERS["zones d'emploi"][0]))
    lignes = feuille_xlsx(io.BytesIO(z.read('ZE2020_au_01-01-2025.xlsx')), 'Composition_communale')
    i = next(i for i, r in enumerate(lignes) if 'CODGEO' in r.values())
    check(any('Géographie au 01/01/2025' in v for r in lignes[:i] for v in r.values()),
          "zones d'emploi : « Géographie au 01/01/2025 » dans l'en-tête (celle de communes.json)")
    c = colonnes(lignes, i)
    return {r[c['CODGEO']]: r[c['ZE2020']] for r in lignes[i + 1:] if r.get(c['CODGEO'])}


def lire_chomage():
    """Taux du dernier trimestre de la feuille txcho_ze : (libellé du trimestre, {zone: (nom, taux)})."""
    lignes = feuille_xlsx(os.path.join(RAW, FICHIERS['chômage'][0]), 'txcho_ze')
    i = next(i for i, r in enumerate(lignes) if r.get('A') == 'ZE2020')
    c = colonnes(lignes, i)
    derniere = max(v for v in lignes[i].values() if v[:4].isdigit())
    col = c[derniere]
    trimestre = lignes[i - 1][col].replace('\xa0', ' ').strip()
    print(f'chômage : dernier trimestre {derniere} « {trimestre} »')
    check(derniere == '2026-T2' and trimestre == '2e trimestre 2026', 'chômage : dernier trimestre publié = 2e trimestre 2026 (H138)')
    zones = {}
    for r in lignes[i + 1:]:
        if r.get('A') and r.get(col):
            zones[r['A']] = (r['B'].strip(), round(float(r[col]), 1))
    return trimestre, zones


def table_noms(libelle):
    """H134 : noms courants écrits à la main, chacun vers un seul métier."""
    with open(NOMS, encoding='utf-8', newline='') as f:
        lignes = list(csv.DictReader(f))
    noms = [l['nom'].strip() for l in lignes]
    check(len(lignes) <= 60, f'noms courants : {len(lignes)} (60 au plus, H134)')
    check(len({n.casefold() for n in noms}) == len(noms), 'noms courants : chacun une seule fois (un seul métier par nom)')
    check(all(l['code'] in libelle for l in lignes), 'noms courants : chaque code est un métier du fichier')
    table = {l['nom'].strip(): l['code'] for l in lignes}
    check(all(table.get(n) == c for n, c in NOMS_IMPOSES.items()),
          'noms courants : développeur, data scientist, UX designer, sage-femme, business developer, prospecteur, chargé d\'affaires')
    par_metier = collections.defaultdict(list)
    for n, c in table.items():
        par_metier[c].append(n)
    return par_metier


def main():
    if MODE_EXTRAIT:
        extrait(sys.argv[sys.argv.index('--extrait') + 1])
        return
    empreintes()
    carte = json.load(open(os.path.join(OUT, 'communes.json'), encoding='utf-8'))
    pop = {r[0]: r[carte['champs'].index('population')] for r in carte['communes']}
    nom = {r[0]: r[1] for r in carte['communes']}
    check(len(pop) == ATTENDU['communes'], f"{len(pop)} communes sur la carte")

    par_metier, libelle, noms_bassins = lire_bmo()
    bassins = sorted(noms_bassins)
    print(f'BMO métropole : {len(bassins)} bassins, {len(libelle)} métiers')
    check(len(bassins) == ATTENDU['bassins'], f"{ATTENDU['bassins']} bassins en métropole")
    check(len(libelle) == ATTENDU['métiers'], f"{ATTENDU['métiers']} métiers en métropole")

    # Communes → bassins (H142)
    table = lire_bassins_table()
    with open(os.path.join(RAW, FICHIERS['COG 2026'][0]), encoding='utf-8') as f:
        mvt = list(csv.DictReader(f))
    reperes = json.load(open(os.path.join(OUT, 'reperes.json'), encoding='utf-8'))['reperes']
    check(len(reperes) == len(pop), 'reperes.json : un point de mairie par commune, dans l\'ordre de communes.json')
    points = {c: reperes[i][:2] for i, c in enumerate(pop)}
    dans_table = [c for c in pop if c in table]
    commune_bassin, recalees, par_voisine = {}, {}, {}
    for code in pop:
        if code in PLM:
            arr = {table.get(a) for a in PLM[code]}
            check(arr == {BASSIN_PLM[code]}, f'{nom[code]} : ses {len(PLM[code])} arrondissements dans le seul bassin {BASSIN_PLM[code]} ({sorted(map(str, arr))})')
            commune_bassin[code] = BASSIN_PLM[code]
        elif code in table:
            commune_bassin[code] = table[code]
        else:
            n, chemin = recalage(code, table, mvt)
            if not chemin:  # aucun mouvement dans le COG : la commune la plus proche (H142 amendée)
                v = voisine(code, points, dans_table)
                check(v is not None, f'{code} ({nom[code]}) sans mouvement : une voisine de la table', muet=True)
                par_voisine[code] = v
                commune_bassin[code] = table[v[0]]
                continue
            check(n is not None, f'{code} ({nom[code]}) recalé sur un code de la table, un seul bassin ({chemin})', muet=True)
            recalees[code] = (n, chemin)
            commune_bassin[code] = table[n]
    for c, (n, chemin) in sorted(recalees.items()):
        print(f'  recalée : {nom[c]} ({c}) → code {n} de la table, bassin {table[n]} ; mouvements (ancien code, MOD, date) {chemin}')
    for c, (v, km) in sorted(par_voisine.items()):
        print(f'  sans mouvement, rattachée à la plus proche : {nom[c]} ({c}) → {nom[v]} ({v}) à {km:.2f} km, bassin {table[v]}')
    check(sorted([*recalees, *par_voisine]) == ABSENTES and sorted(par_voisine) == ['80832'],
          f'H142 : les 12 communes absentes de la table, et elles seules : {len(recalees)} recalées par le COG,'
          f' {len(par_voisine)} par la plus proche (Yvrench)')
    hors = sorted({b for b in commune_bassin.values() if b not in noms_bassins})
    check(not hors, f'tout bassin des communes est un bassin du BMO ({hors})')
    sans = sorted(set(noms_bassins) - set(commune_bassin.values()))
    print(f'bassins du BMO sans commune de la carte : {sans} ({[noms_bassins[b] for b in sans]})')
    check(sans == ['9399'], 'seul le bassin de Monaco (9399) n\'a aucune commune de la carte')

    # Villes principales (H135)
    membres = collections.defaultdict(list)
    for c, b in commune_bassin.items():
        membres[b].append(c)
    plus_peuplee = lambda codes: min(codes, key=lambda c: (-pop[c], c))  # noqa: E731
    regle = {b: (plus_peuplee(membres[b]) if b in membres else None) for b in bassins}
    ville = dict(regle)
    dep = {r[0]: r[carte['champs'].index('dep')] for r in carte['communes']}
    for b, (d, attendue) in VILLE_PAR_DEPARTEMENT.items():
        deps = collections.Counter(dep[c] for c in membres[b])
        check(len(deps) == 2 and d in deps,
              f'H135 : bassin {b} ({noms_bassins[b]}) sur deux départements dont le {d} ({dict(sorted(deps.items()))}) ;'
              f' sinon l\'exception est à revoir')
        ville[b] = plus_peuplee([c for c in membres[b] if dep[c] == d])
        print(f'  exception H135 : bassin {b} ({noms_bassins[b]}) → {nom[ville[b]]} ({ville[b]}, {pop[ville[b]]} hab.),'
              f' plus peuplée de ses {deps[d]} communes du {d} ; par la règle : {nom[regle[b]]} ({regle[b]}, {pop[regle[b]]} hab.)')
        check(ville[b] == attendue, f'H135 : ville principale du bassin {b} = {attendue} (choix de Vincent du 2026-11-21)')
    changees = sorted(b for b in bassins if ville[b] != regle[b])
    check(changees == sorted(VILLE_PAR_DEPARTEMENT),
          f'H135 : sur les {len(bassins)} villes principales, seule celle de {sorted(VILLE_PAR_DEPARTEMENT)} diffère de la règle ({changees})')
    for c, b in BASSIN_PLM.items():
        check(ville[b] == c, f'H142 : {nom[c]} ville principale du bassin {b}')

    # Zones d'emploi et chômage (H138)
    zones_communes = lire_zones()
    trimestre, chomage = lire_chomage()
    sans_zone = [c for c in pop if c not in zones_communes]
    check(not sans_zone, f"H138 : les {len(pop)} communes ont une zone d'emploi (sans : {sans_zone[:10]})")
    sans_taux = sorted({zones_communes[c] for c in pop if zones_communes[c] not in chomage})
    check(not sans_taux, f'H138 : chaque zone des communes a un taux au {trimestre} (sans : {sans_taux})')
    check(len(commune_bassin) == len(pop), f'H142 : les {len(pop)} communes ont un bassin')
    zones = sorted({zones_communes[c] for c in pop})
    print(f"zones d'emploi des communes : {len(zones)} ; taux de {min(chomage[z][1] for z in zones)} à {max(chomage[z][1] for z in zones)} %")

    # Métiers (R45, R50, H146)
    noms = table_noms(libelle)
    metiers, peu = [], []
    for code in sorted(libelle):
        nv = niveaux(par_metier[code], bassins)
        chiffres = sorted(((b, v) for b, v in nv.items() if v), key=lambda x: (-x[1]['projets'], x[0]))
        check(len(chiffres) >= MIN_BASSINS, f'H146 : {code} chiffré dans au moins {MIN_BASSINS} bassins ({len(chiffres)})', muet=True)
        peu_chiffre = len(chiffres) < SEUIL_PEU_CHIFFRE
        if peu_chiffre:
            peu.append(code)
        metiers.append({'code': code, 'libelle': libelle[code], 'noms': sorted(noms.get(code, [])), 'peu_chiffre': peu_chiffre,
                        'bassins': [[b, v['projets'], v['niveau']] for b, v in chiffres]})
    check(True, f'H146 : chaque métier chiffré dans au moins {MIN_BASSINS} bassins (le moins : '
                f'{min(len(m["bassins"]) for m in metiers)})')
    print(f'R50 : {len(peu)} métiers peu chiffrés (moins de {SEUIL_PEU_CHIFFRE} bassins) sur {len(metiers)}')
    for code, attendu in LIBELLES_FIXTURE.items():
        print(f"  libellé de la fixture {code} : {'identique' if libelle[code] == attendu else 'DIFFÉRENT : ' + libelle[code]}")

    # AC-12 (M2X90)
    m = next(x for x in metiers if x['code'] == AC12['metier'])
    par_b = {b: (p, n) for b, p, n in m['bassins']}
    n10 = sum(1 for _, _, n in m['bassins'] if n == '10')
    n25 = sum(1 for _, _, n in m['bassins'] if n in ('10', '25'))
    check(n10 == AC12['niveau 10'], f"AC-12 : M2X90, {n10} bassins au niveau « 10 » (attendu {AC12['niveau 10']})")
    check(n25 == AC12['niveaux 10 ou 25'], f"AC-12 : M2X90, {n25} bassins aux niveaux « 10 » ou « 25 » (attendu {AC12['niveaux 10 ou 25']})")
    check(len(m['bassins']) == AC12['chiffrés'], f"AC-12 : M2X90, {len(m['bassins'])} bassins chiffrés (attendu {AC12['chiffrés']})")
    bx, projets_bx, niveau_bx = AC12['Bordeaux']
    b = commune_bassin[bx]
    check(ville[b] == bx and par_b.get(b) == (projets_bx, niveau_bx),
          f'AC-12 : bassin de Bordeaux ({b}, ville principale {nom[ville[b]]}) au niveau « {niveau_bx} » avec {projets_bx} projets ({par_b.get(b)})')
    b = commune_bassin[AC12['La Rochelle']]
    check(ville[b] == AC12['La Rochelle'] and b not in par_b, f'AC-12 : bassin de La Rochelle ({b}) sans chiffre pour M2X90')

    sortie = {
        'champs': {'bassins': ['code', 'ville'], 'zones': ['code', 'nom', 'taux'], 'metiers.bassins': ['bassin', 'projets', 'niveau'],
                   'communes': ['code', 'bassin', 'zone']},
        'trimestre_chomage': trimestre,
        'bassins': [[b, ville[b]] for b in bassins],
        'zones': [[z, chomage[z][0], chomage[z][1]] for z in zones],
        'metiers': metiers,
        'communes': [[c, commune_bassin[c], zones_communes[c]] for c in pop],
    }
    path = os.path.join(OUT, 'emploi.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(sortie, f, ensure_ascii=False, separators=(',', ':'))
    print(f'écrit : {os.path.relpath(path, ROOT)} ({os.path.getsize(path)} octets)')


if __name__ == '__main__':
    main()
