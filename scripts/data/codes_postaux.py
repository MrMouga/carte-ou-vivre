"""Codes postaux des communes de la carte (tranche recherche-et-mer, tâche 0a ; D2, R58) : public/data/codes-postaux.json.

Source (téléchargée par `python3 -I scripts/data/sources.py --codes-postaux`, empreinte notée ici et dans CLAUDE.md) :
« Base officielle des codes postaux » de La Poste (Licence Ouverte, relue par sources.py) : une ligne par code INSEE ×
code postal × lieu-dit. Mouvements des communes du COG 2026 (Insee, déjà là pour emploi) pour le recalage.

Règles (plan, « Le fichier des codes » ; détails, cas limites) :
- outre-mer (codes INSEE 97…, 98…) et Monaco (99…) écartés d'abord ;
- Paris, Lyon, Marseille : les codes de leurs arrondissements (751xx, 6938x, 132xx), rattachés à la ville (75056, 69123,
  13055 : D10 de loyer-mer) ;
- un code INSEE de La Poste présent sur la carte (COG 2025) est gardé tel quel ;
- recalage par les mouvements du COG 2026, dans les deux sens (`composantes`) :
  * une commune créée ou agrandie après le 1er janvier 2025 (fusion de 2026) donne ses codes postaux aux communes 2025
    qui la composent (lignes du fichier après cette date, remontées) ;
  * un ancien code (absent de la carte) va vers la commune qui l'a remplacé (dernier mouvement du code, suivi jusqu'à
    une commune de la carte) ;
- seules les communes de la carte sont écrites.

Sortie : {"<code postal>": ["<code INSEE>", …]} (codes postaux croissants, codes INSEE croissants, sans espaces).

Contrôles qui arrêtent le script (condition d'arrêt de la tâche 0a) : empreintes et licence ; plus de 20 communes de la
carte sans aucun code ; un code INSEE de métropole de La Poste qui ne trouve aucune commune de la carte ; Paris, Lyon,
Marseille sans tous leurs arrondissements ; Bordeaux (33000), Auch (32000), Caen (14000) ; poids au-delà de 200 Ko en
`brotli -q 3` (compression de l'hébergeur, leçon du 2026-11-24).

Prérequis : public/data/communes.json (communes.py).
Usage : python3 -I scripts/data/codes_postaux.py
        python3 -I scripts/data/codes_postaux.py --extrait <fichier.json>  ({"carte": [codes INSEE], "lignes": [[code
        INSEE, code postal]], "mouvements": [lignes du COG au format de v_mvt_commune_2026.csv]} : écrit sur la sortie
        standard le fichier des codes de ces seules données ; tests de scripts/data/codes_postaux.test.ts)
"""
import collections
import csv
import hashlib
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sources import CODES_POSTAUX, MVT_2026  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
RAW = os.path.join(ROOT, 'data-raw')
OUT = os.path.join(ROOT, 'public', 'data', 'codes-postaux.json')
CLAUDE_MD = os.path.join(ROOT, 'CLAUDE.md')

# Fichiers retenus en tâche 0a (2026-11-25), empreintes écrites aussi dans CLAUDE.md : un fichier changé arrête le script.
FICHIERS = {
    'codes postaux La Poste': (CODES_POSTAUX, 'f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22'),
    'COG 2026': (MVT_2026, '8b339fad8232e97233af3fd9468715af845e2cf8b14cb67b24d9a301ef8645f1'),
}
DEBUT_2025 = '2025-01-01'  # géographie de communes.json (COG 2025)
PLM = {'75056': [f'751{i:02d}' for i in range(1, 21)], '69123': [f'6938{i}' for i in range(1, 10)],
       '13055': [f'132{i:02d}' for i in range(1, 17)]}
VILLE_DE = {a: v for v, arr in PLM.items() for a in arr}
CODES_PLM = {'75056': {f'750{i:02d}' for i in range(1, 21)} | {'75116'}, '69123': {f'6900{i}' for i in range(1, 10)},
             '13055': {f'130{i:02d}' for i in range(1, 17)}}
MAX_SANS_CODE = 20  # condition d'arrêt (leçon du 2026-11-21)
MAX_BROTLI = 200 * 1000  # H195 : 200 Ko compressés au plus (octets)
REPERES = {'33000': '33063', '32000': '32013', '14000': '14118', '17000': '17300', '85100': '85194'}
MODE_EXTRAIT = '--extrait' in sys.argv  # contrôles écrits sur la sortie d'erreur, la sortie standard reste du JSON


def check(cond, msg):
    print(('  ok   ' if cond else '  ÉCHEC ') + msg, file=sys.stderr if MODE_EXTRAIT else sys.stdout)
    if not cond:
        raise SystemExit(1)


def hors_metropole(insee):
    """Outre-mer (97…, 98…) et Monaco (99…, seul code 99 de La Poste)."""
    return insee[:2] in ('97', '98', '99')


def indexer(mvt):
    """Lignes du COG par commune d'arrivée et par commune de départ."""
    par_ap, par_av = collections.defaultdict(list), collections.defaultdict(list)
    for r in mvt:
        par_ap[r['COM_AP']].append(r)
        par_av[r['COM_AV']].append(r)
    return par_ap, par_av


def composantes(insee, carte, index):
    """Communes de la carte (COG 2025) que couvre un code INSEE de La Poste, et le chemin suivi.

    - arrondissement de Paris, Lyon, Marseille → la ville ;
    - en arrière : une commune qui en a absorbé d'autres, ou qui a été créée, après le 1er janvier 2025 couvre aussi les
      communes 2025 qui la composent (lignes du COG après cette date dont elle est l'arrivée, remontées) ;
    - en avant : un code absent de la carte, et que rien ne compose après 2025, va vers la commune qui l'a remplacé (son
      dernier mouvement, suivi jusqu'à la carte).
    Renvoie (ensemble de codes de la carte, liste des mouvements suivis)."""
    if insee in VILLE_DE:
        return {VILLE_DE[insee]}, [f'{insee} arrondissement de {VILLE_DE[insee]}']
    par_ap, par_av = index
    trouves, chemin = set(), []
    a_voir, vus = [insee], set()
    while a_voir:  # en arrière (après 2025)
        c = a_voir.pop()
        if c in vus:
            continue
        vus.add(c)
        if c in carte:
            trouves.add(c)
        for r in par_ap.get(c, ()):
            if (r['COM_AV'] != c and r['DATE_EFF'] > DEBUT_2025
                    and r['TYPECOM_AP'] == 'COM' and r['TYPECOM_AV'] in ('COM', 'COMD', 'COMA')):
                chemin.append(f"{c} ← {r['COM_AV']} ({r['TYPECOM_AV']}, mod {r['MOD']}, {r['DATE_EFF']})")
                a_voir.append(r['COM_AV'])
    if trouves:
        return trouves, chemin
    c, vus = insee, set()
    while c not in carte and c not in vus:  # en avant (ancien code)
        vus.add(c)
        suivants = [r for r in par_av.get(c, ()) if r['COM_AP'] != c and r['TYPECOM_AV'] == 'COM' and r['TYPECOM_AP'] == 'COM']
        if not suivants:
            return set(), chemin
        dernier = max(r['DATE_EFF'] for r in suivants)
        arrivees = sorted({r['COM_AP'] for r in suivants if r['DATE_EFF'] == dernier})
        chemin.append(f"{c} → {arrivees} (mod {suivants[0]['MOD']}, {dernier})")
        if len(arrivees) != 1:
            return set(), chemin
        c = arrivees[0]
    return ({c} if c in carte else set()), chemin


def rattacher(lignes, carte, mvt):
    """Le fichier des codes : {code postal: [codes INSEE de la carte]}, et les comptes des contrôles."""
    par_cp = collections.defaultdict(set)
    comptes = {'lignes': len(lignes), 'outre-mer': 0, 'Monaco': 0, 'directs': 0, 'arrondissements': 0, 'recalés': {}, 'perdus': {}}
    cache, index = {}, indexer(mvt)
    for insee, cp in lignes:
        if hors_metropole(insee):
            comptes['Monaco' if insee.startswith('99') else 'outre-mer'] += 1
            continue
        if insee not in cache:
            cache[insee] = composantes(insee, carte, index)
        cibles, chemin = cache[insee]
        if insee in VILLE_DE:
            comptes['arrondissements'] += 1
        elif cibles == {insee}:
            comptes['directs'] += 1
        elif cibles:
            comptes['recalés'][insee] = (sorted(cibles), chemin)
        else:
            comptes['perdus'][insee] = chemin
        for c in cibles:
            par_cp[cp].add(c)
    return {cp: sorted(par_cp[cp]) for cp in sorted(par_cp)}, comptes


def lire_lignes():
    path = os.path.join(RAW, CODES_POSTAUX)
    with open(path, encoding='latin-1', newline='') as f:
        r = csv.reader(f, delimiter=';')
        entete = next(r)
        check(entete[:3] == ['#Code_commune_INSEE', 'Nom_de_la_commune', 'Code_postal'], f'La Poste : colonnes {entete}')
        lignes = [(l[0].strip(), l[2].strip()) for l in r if l]
    mal = [l for l in lignes if len(l[0]) != 5 or not (len(l[1]) == 5 and l[1].isdigit())]
    check(not mal, f'La Poste : {len(lignes)} lignes, chacune un code INSEE de 5 caractères et un code postal de 5 chiffres ({mal[:5]})')
    return lignes


def empreintes():
    claude = open(CLAUDE_MD, encoding='utf-8').read()
    for titre, (nom, attendu) in FICHIERS.items():
        path = os.path.join(RAW, nom)
        info = json.load(open(path + '.info.json'))
        sha = hashlib.sha256(open(path, 'rb').read()).hexdigest()
        print(f"{titre} : {nom}, Last-Modified {info['last_modified']}, téléchargé le {info['telecharge_le']},"
              f" {info['octets']} octets, sha256 {sha}")
        check(sha == attendu == info['sha256'] and attendu in claude,
              f'{titre} : empreinte égale à celle retenue (CLAUDE.md) et à celle notée')
    info = json.load(open(os.path.join(RAW, CODES_POSTAUX) + '.info.json'))
    print(f"La Poste : {info.get('licence')}, relue le {info.get('licence_lue_le')} ; données mises à jour le"
          f" {info.get('donnees_mises_a_jour')} ; {info.get('lignes')} lignes annoncées")
    check(str(info.get('licence', '')).startswith('Licence Ouverte'), 'La Poste : licence relue = Licence Ouverte (sources.py)')


def ecrire(sortie, path):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(sortie, f, ensure_ascii=False, separators=(',', ':'))
        f.write('\n')


def extrait(chemin):
    ex = json.load(open(chemin, encoding='utf-8'))
    sortie, _ = rattacher([tuple(l) for l in ex['lignes']], set(ex['carte']), ex.get('mouvements', []))
    json.dump(sortie, sys.stdout, ensure_ascii=False)
    print()


def main():
    if MODE_EXTRAIT:
        extrait(sys.argv[sys.argv.index('--extrait') + 1])
        return
    empreintes()
    carte_json = json.load(open(os.path.join(ROOT, 'public', 'data', 'communes.json'), encoding='utf-8'))
    noms = {r[0]: r[1] for r in carte_json['communes']}
    carte = set(noms)
    check(len(carte) == 34746, f'{len(carte)} communes sur la carte')
    with open(os.path.join(RAW, MVT_2026), encoding='utf-8', newline='') as f:
        mvt = list(csv.DictReader(f))
    lignes = lire_lignes()
    sortie, n = rattacher(lignes, carte, mvt)

    print(f"La Poste : {n['lignes']} lignes ; écartées : {n['outre-mer']} d'outre-mer, {n['Monaco']} de Monaco ;"
          f" {n['directs']} sur un code de la carte, {n['arrondissements']} d'arrondissements de Paris, Lyon, Marseille")
    print(f"recalées par le COG 2026 : {len(n['recalés'])} codes INSEE de La Poste")
    for insee, (cibles, chemin) in sorted(n['recalés'].items()):
        print(f"  {insee} → {', '.join(f'{c} {noms[c]}' for c in cibles)} ; {' ; '.join(chemin)}")
    for insee, chemin in sorted(n['perdus'].items()):
        print(f"  sans commune de la carte : {insee} ; {' ; '.join(chemin) or 'aucun mouvement'}")
    check(not n['perdus'], f"chaque code INSEE de métropole de La Poste trouve une commune de la carte ({len(n['perdus'])} sans)")
    # Géographie réelle du fichier (leçon du 2026-11-21) : ses codes qu'un mouvement d'après 2025 a fait disparaître.
    poste = {i for i, _ in lignes if not hors_metropole(i)}
    disparus = sorted({r['COM_AV'] for r in mvt if r['DATE_EFF'] > DEBUT_2025 and r['TYPECOM_AV'] == 'COM'
                       and r['COM_AP'] != r['COM_AV'] and r['COM_AV'] in poste})
    nouveaux = sorted({r['COM_AP'] for r in mvt if r['DATE_EFF'] > DEBUT_2025 and r['TYPECOM_AP'] == 'COM'} - carte)
    print(f'géographie du fichier : {len(disparus)} de ses codes INSEE ont disparu après 2025 (COG 2026), encore là chez'
          f' La Poste ; {len([c for c in nouveaux if c in poste])} des {len(nouveaux)} codes créés après 2025 y sont'
          f' ({disparus[:6]}…)')

    codes_de = collections.defaultdict(set)
    for cp, insees in sortie.items():
        for c in insees:
            codes_de[c].add(cp)
    sans = sorted(carte - set(codes_de))
    for c in sans:
        print(f'  sans code postal : {c} {noms[c]}')
    check(len(sans) <= MAX_SANS_CODE, f'{len(sans)} communes de la carte sans aucun code postal ({MAX_SANS_CODE} au plus)')
    for ville, attendus in CODES_PLM.items():
        check(codes_de[ville] == attendus, f'{noms[ville]} : {len(attendus)} codes, ceux de ses arrondissements ({sorted(codes_de[ville])[:3]}…)')
    for cp, insee in REPERES.items():
        check(insee in sortie.get(cp, []), f'{cp} → {insee} {noms[insee]} (parmi {len(sortie.get(cp, []))})')
    check(not any(cp.startswith(('97', '98')) for cp in sortie) and '98000' not in sortie, "aucun code postal d'outre-mer ni de Monaco")

    tailles = sorted(((len(v), cp) for cp, v in sortie.items()), reverse=True)
    paires = sum(len(v) for v in sortie.values())
    print(f'codes-postaux.json : {len(sortie)} codes postaux, {paires} paires code postal × commune ;'
          f' {len(codes_de)} communes avec au moins un code ; {sum(len(v) > 1 for v in codes_de.values())} avec plusieurs')
    print(f"  le plus de communes par code : {', '.join(f'{cp} ({k})' for k, cp in tailles[:5])} ;"
          f" 01300 : {len(sortie.get('01300', []))} communes")
    plus = max(codes_de.items(), key=lambda kv: (len(kv[1]), kv[0]))
    print(f'  le plus de codes par commune : {plus[0]} {noms[plus[0]]} ({len(plus[1])})')

    ecrire(sortie, OUT)
    brut = os.path.getsize(OUT)
    br = len(subprocess.run(['brotli', '-c', '-q', '3', OUT], capture_output=True, check=True).stdout)
    print(f'  écrit : public/data/codes-postaux.json, {brut} octets, {br} octets en brotli -q 3')
    check(br <= MAX_BROTLI, f'poids en brotli -q 3 : {br / 1000:.1f} Ko (200 Ko au plus, H195)')


if __name__ == '__main__':
    main()
