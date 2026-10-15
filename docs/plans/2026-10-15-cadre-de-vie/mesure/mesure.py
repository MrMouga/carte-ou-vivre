"""Tâche 0 de cadre-de-vie — script jetable (lu par personne d'autre). Mesure, sans rien écrire dans le site :
1. la zone de montagne selon deux sources (Agriculture 2017 × massifs ANCT 2021, règle de la discovery ; zonage loi
   Montagne du Cerema, communes 2019) : communes 2025 classées, recalage, H81, distances de la mairie à la zone (R29),
   villes du risque, villes de plus de 50 000 hab., 10 premières à « 10 km », répartition, écarts ;
2. la grille communale de densité Insee 2025 regroupée en 4 niveaux (D10) ;
3. le prix tous biens de D12 d'immobilier sur les fichiers DVF retenus (empreintes vérifiées par communes.py).

Usage : python3 -I -u docs/plans/2026-10-15-cadre-de-vie/mesure/mesure.py  (sortie recopiée en fin de mesure-tache-0.md)
Sources dans data-raw/montagne/, data-raw/densite/, data-raw/v_mvt_commune_2025.csv (téléchargées le 2026-10-15).
"""
import collections
import csv
import gzip
import importlib.util
import json
import math
import os
import re
import struct
import sys
import unicodedata
import xml.etree.ElementTree as ET
import zipfile

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
import xls  # noqa: E402  (repris de la discovery, tel quel)

ROOT = os.path.abspath(os.path.join(ICI, '..', '..', '..', '..'))
RAW = os.path.join(ROOT, 'data-raw')
MONT = os.path.join(RAW, 'montagne')

# ---------------------------------------------------------------------------------------------- outils
A_, E = 6378137.0, 0.0818191910428158
N_, C_, XS, YS = 0.7256077650532670, 11754255.426096, 700000.0, 12655612.049876
LON0 = math.radians(3)


def to_l93(lon, lat):
    p = math.radians(lat)
    li = math.log(math.tan(math.pi / 4 + p / 2) * ((1 - E * math.sin(p)) / (1 + E * math.sin(p))) ** (E / 2))
    r = C_ * math.exp(-N_ * li)
    g = N_ * (math.radians(lon) - LON0)
    return XS + r * math.sin(g), YS - r * math.cos(g)


def js_round(x):
    return math.floor(x + 0.5)


def cle_nom(s):
    """Approximation de localeCompare('fr') : sans accents, sans casse."""
    return ''.join(ch for ch in unicodedata.normalize('NFD', s) if unicodedata.category(ch) != 'Mn').casefold()


def fr(n, d=0):
    if n is None:
        return '—'
    s = f'{n:,.{d}f}'.replace(',', ' ').replace('.', ',')
    return s


# ---------------------------------------------------------------------------------------------- COG 2025
def cog():
    with open(os.path.join(RAW, 'v_commune_2025.csv'), encoding='utf-8') as f:
        return {r['COM']: r for r in csv.DictReader(f) if r['TYPECOM'] == 'COM' and not r['DEP'].startswith('97')}


COM = cog()
with open(os.path.join(RAW, 'v_mvt_commune_2025.csv'), encoding='utf-8') as f:
    MVT = sorted(csv.DictReader(f), key=lambda r: r['DATE_EFF'])
NXT = {}
for r in MVT:
    if r['TYPECOM_AV'] == 'COM' and r['COM_AV'] != r['COM_AP'] and r['TYPECOM_AP'] in ('COM', 'COMD', 'COMA'):
        NXT[r['COM_AV']] = r['COM_AP']


def res(code):
    """Ancien code → code 2025 (chaînes de fusions et de changements de code ; cog.py de la discovery)."""
    seen = set()
    while code not in COM and code in NXT and code not in seen:
        seen.add(code)
        code = NXT[code]
    return code if code in COM else None


def retablies(date):
    """Communes rétablies après `date` (MOD 21) : code 2025 rétabli → code de la commune dont elle est sortie."""
    out = {}
    for r in MVT:
        if r['MOD'] == '21' and r['DATE_EFF'] > date and r['TYPECOM_AV'] == 'COM' and r['TYPECOM_AP'] == 'COM' \
                and r['COM_AV'] != r['COM_AP'] and r['COM_AP'] in COM:
            out[r['COM_AP']] = r['COM_AV']
    return out


def membres(date):
    """Code 2025 → codes des communes existant à `date` qui s'y fondent (lignes du COG après `date`)."""
    m = collections.defaultdict(set)
    for r in MVT:
        if r['DATE_EFF'] > date and r['TYPECOM_AV'] == 'COM':
            n = res(r['COM_AV'])
            if n:
                m[n].add(r['COM_AV'])
    return m


SITE = json.load(open(os.path.join(ROOT, 'public', 'data', 'communes.json')))
CH = SITE['champs']
SITE = {r[0]: dict(zip(CH, r)) for r in SITE['communes']}
assert set(SITE) == set(COM), 'communes.json et COG 2025 diffèrent'

MAIRIE = {}
for c in json.load(open(os.path.join(RAW, 'communes-mairie.json'))):
    if c['code'] in COM and c.get('mairie'):
        MAIRIE[c['code']] = to_l93(*c['mairie']['coordinates'])
CENTRE = {}
for c in json.load(open(os.path.join(RAW, 'communes-centre.json'))):
    if c['code'] in COM and c.get('centre'):
        CENTRE[c['code']] = to_l93(*c['centre']['coordinates'])


def nom(c):
    return SITE[c]['nom']


def pop(c):
    return SITE[c]['population']


# ---------------------------------------------------------------------------------------------- géométrie
def l93_rings(geom):
    polys = [geom['coordinates']] if geom['type'] == 'Polygon' else geom['coordinates']
    return [[[to_l93(x, y) for x, y in ring] for ring in poly] for poly in polys]


def bbox(rings):
    xs = [p[0] for poly in rings for ring in poly for p in ring]
    ys = [p[1] for poly in rings for ring in poly for p in ring]
    return min(xs), min(ys), max(xs), max(ys)


def in_ring(x, y, ring):
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def in_polys(x, y, polys):
    """Règle pair-impair sur tous les anneaux (parties et trous)."""
    n = 0
    for poly in polys:
        for ring in poly:
            if in_ring(x, y, ring):
                n += 1
    return n % 2 == 1


print('# Sortie du script de mesure, tâche 0 de cadre-de-vie\n')
CONTOURS = {}
for ft in json.load(gzip.open(os.path.join(RAW, 'communes-100m.geojson.gz')))['features']:
    p = ft['properties']
    if p['code'] in COM and 'commune' not in p:
        CONTOURS[p['code']] = l93_rings(ft['geometry'])
print(f'COG 2025 métropole : {len(COM)} communes ; contours 2025 : {len(CONTOURS)} ; mairies : {len(MAIRIE)}')


def read_shp(path):
    """Polygones d'un shapefile (type 5), en Lambert-93 : liste de [[anneau, ...]] (anneaux non regroupés)."""
    out = []
    with open(path, 'rb') as f:
        f.seek(100)
        while True:
            hd = f.read(8)
            if len(hd) < 8:
                break
            _, clen = struct.unpack('>ii', hd)
            rec = f.read(clen * 2)
            if struct.unpack('<i', rec[:4])[0] == 0:
                out.append([])
                continue
            nparts, npts = struct.unpack('<ii', rec[36:44])
            parts = list(struct.unpack('<%di' % nparts, rec[44:44 + 4 * nparts])) + [npts]
            pts = struct.unpack('<%dd' % (2 * npts), rec[44 + 4 * nparts:44 + 4 * nparts + 16 * npts])
            rings = [[(pts[2 * k], pts[2 * k + 1]) for k in range(parts[i], parts[i + 1])] for i in range(nparts)]
            out.append(rings)
    return out


def read_dbf(path):
    with open(path, 'rb') as f:
        n, hl, rl = struct.unpack('<IHH', f.read(32)[4:12])
        fields = []
        while True:
            d = f.read(32)
            if d[0] == 0x0D:
                break
            fields.append((d[:11].split(b'\0')[0].decode(), d[16]))
        f.seek(hl)
        rows = []
        for _ in range(n):
            r = f.read(rl)
            off, row = 1, {}
            for name, ln in fields:
                row[name] = r[off:off + ln].decode('utf-8', 'replace').strip()
                off += ln
            rows.append(row)
    return rows


def shp_as_polys(rings, pas=30.0):
    """Anneaux d'un enregistrement shapefile → un « polygone » lu en pair-impair (in_polys) ; sommets éclaircis
    (un tous les `pas` m au moins) : Admin Express à pleine résolution est trop lourd pour ce script."""
    out = []
    for ring in rings:
        r = [ring[0]]
        for p in ring[1:-1]:
            if abs(p[0] - r[-1][0]) + abs(p[1] - r[-1][1]) >= pas:
                r.append(p)
        r.append(ring[-1])
        if len(r) >= 4:
            out.append(r)
    return [out]


class Zone:
    """Union de polygones : appartenance d'un point, distance au bord (points du bord tous les PAS m au plus,
    arêtes partagées par deux polygones retirées : ce sont des bords intérieurs)."""
    PAS = 100.0
    CELL = 5000.0

    def __init__(self, items):
        # items : (étiquette, polygones)
        self.items = items
        self.bb = collections.defaultdict(list)
        seg = collections.Counter()
        for k, (lab, polys) in enumerate(items):
            x0, y0, x1, y1 = bbox(polys)
            for gx in range(int(x0 // 10000), int(x1 // 10000) + 1):
                for gy in range(int(y0 // 10000), int(y1 // 10000) + 1):
                    self.bb[(gx, gy)].append((k, (x0, y0, x1, y1)))
            for poly in polys:
                for ring in poly:
                    for i in range(1, len(ring)):
                        a, b = (round(ring[i - 1][0], 1), round(ring[i - 1][1], 1)), (round(ring[i][0], 1), round(ring[i][1], 1))
                        if a != b:
                            seg[(a, b) if a < b else (b, a)] += 1
        self.grid = collections.defaultdict(list)
        npts = 0
        for lab, polys in items:
            for poly in polys:
                for ring in poly:
                    for i in range(1, len(ring)):
                        a, b = (round(ring[i - 1][0], 1), round(ring[i - 1][1], 1)), (round(ring[i][0], 1), round(ring[i][1], 1))
                        if a == b or seg[(a, b) if a < b else (b, a)] > 1:
                            continue
                        ln = math.hypot(b[0] - a[0], b[1] - a[1])
                        k = max(1, math.ceil(ln / self.PAS))
                        for j in range(k + 1):
                            x, y = a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k
                            self.grid[(int(x // self.CELL), int(y // self.CELL))].append((x, y, lab))
                            npts += 1
        self.npts = npts

    def contient(self, x, y):
        for k, (x0, y0, x1, y1) in self.bb.get((int(x // 10000), int(y // 10000)), ()):
            if x0 <= x <= x1 and y0 <= y <= y1 and in_polys(x, y, self.items[k][1]):
                return self.items[k][0]
        return None

    def proche(self, x, y):
        cx, cy = int(x // self.CELL), int(y // self.CELL)
        best, lab = float('inf'), None
        g = self.grid
        for r in range(0, 400):
            if best < (r - 1) * self.CELL:
                break
            if r == 0:
                cells = [(cx, cy)]
            else:  # le seul pourtour du carré de rayon r
                cells = [(cx + i, cy - r) for i in range(-r, r + 1)] + [(cx + i, cy + r) for i in range(-r, r + 1)]
                cells += [(cx - r, cy + j) for j in range(-r + 1, r)] + [(cx + r, cy + j) for j in range(-r + 1, r)]
            for cell in cells:
                pts = g.get(cell)
                if pts:
                    for px, py, pl in pts:
                        d = (px - x) ** 2 + (py - y) ** 2
                        if d < best * best:
                            best, lab = math.sqrt(d), pl
                            self.dernier = (px, py)
        return best / 1000, lab


# ---------------------------------------------------------------------------------------------- source A
def code_str(c):
    return f'{int(c):05d}' if isinstance(c, float) else str(c).strip()


def source_agri_anct():
    rs = [r for r in xls.rows(xls.read(os.path.join(MONT, 'anct', 'diffusion-zonages-massifs-cog2021.xls'))['Communes de massif (COG 2021)'])[6:] if r[0]]
    anct = {code_str(r[0]): r[2] for r in rs}
    n_float = sum(1 for r in rs if isinstance(r[0], float))
    rs = [r for r in xls.rows(xls.read(os.path.join(MONT, 'agri', 'agri-2017.xls'))['liste des communes classées '])[4:] if r[0]]
    agri, agri_partie = {}, set()
    for r in rs:
        art = r[8].upper().replace(' ', '')
        agri.setdefault(code_str(r[0]), set()).add(art)
        if isinstance(r[0], float):
            print(f'  code agri lu comme un nombre : {r[0]} ({r[1]})')
        if art == 'ART18' and any(r[i] for i in (10, 14, 18, 22)):
            agri_partie.add(code_str(r[0]))
    sans_art_m = sorted(code_str(r[0]) for r in rs if r[8] == '' and r[26] == 'M')

    def recale(codes_src, est, date):
        perdus = sorted(c for c in codes_src if res(c) is None)
        perdus_metro = [c for c in perdus if not c.startswith('97')]
        n25 = {}
        for c in codes_src:
            n = res(c)
            if n:
                n25.setdefault(n, []).append(c)
        for n, o in retablies(date).items():
            if o in codes_src and n not in n25:
                n25[n] = [o]
                print(f'  rétablie après la source : {nom(n)} ({n}) hérite de {o}')
        oui = {n for n, olds in n25.items() if any(est(o) for o in olds)}
        mem = membres(date)
        mixte = set()
        for n in oui:
            ms = mem.get(n, set()) | set(n25[n])
            if any(not est(o) for o in ms):
                mixte.add(n)
        return oui, mixte, perdus_metro, n25

    m_agri, mix_agri, perdus_agri, n25_agri = recale(agri, lambda c: 'ART18' in agri.get(c, ()), '2017-01-01')
    m_anct, mix_anct, perdus_anct, _ = recale(anct, lambda c: anct.get(c, 'Hors massif') != 'Hors massif', '2021-01-01')
    classe = m_agri & m_anct
    partie_flag = {n for n in classe if any(o in agri_partie for o in n25_agri[n])}
    partie = (partie_flag | mix_agri | mix_anct) & classe
    massif = {res(c): v for c, v in anct.items() if res(c)}
    info = {
        'lignes agri': len(rs), 'codes agri': len(agri), 'codes agri Art 18': sum(1 for v in agri.values() if 'ART18' in v),
        'lignes Art 18 « partie de commune »': len(agri_partie), 'agri sans article mais « M »': len(sans_art_m),
        'codes ANCT': len(anct), 'communes 2025 Art 18 (agri seul)': len(m_agri), 'communes 2025 de massif (ANCT seul)': len(m_anct),
        'agri sans correspondance (métropole)': perdus_agri, 'ANCT sans correspondance (métropole)': perdus_anct,
        'en partie : drapeau P': len(partie_flag), 'en partie : fusion mêlée agri': len(mix_agri & classe),
        'en partie : fusion mêlée ANCT': len(mix_anct & classe), 'Art 18 hors massif (écartées par la règle)': len(m_agri - m_anct),
    }
    return classe, partie, info, massif, sans_art_m


# ---------------------------------------------------------------------------------------------- source B
def source_cerema():
    base = os.path.join(MONT, 'cerema', 'communes', 'l_commune_loimontagne85_000_2019')
    rows = read_dbf(base + '.dbf')
    geoms = read_shp(base + '.shp')
    assert len(rows) == len(geoms)
    est = {r['insee_2019']: r['classement'] for r in rows}
    perdus = sorted(c for c in est if res(c) is None)
    n25 = {}
    for c in est:
        n = res(c)
        if n:
            n25.setdefault(n, []).append(c)
    for n, o in retablies('2019-01-01').items():
        if o in est and n not in n25:
            n25[n] = [o]
            print(f'  rétablie après la source : {nom(n)} ({n}) hérite de {o}')
    classe = set(n25)
    mem = membres('2019-01-01')
    mixte = {n for n in classe if any(o not in est for o in mem.get(n, set()))}
    partie_flag = {n for n in classe if any(est[o] == 'partie' for o in n25[n])}
    partie = partie_flag | mixte
    # contours propres : communes 2019 « totalité » + zones infra-communales
    items = []
    for r, g in zip(rows, geoms):
        if r['classement'] == 'totalité' and g:
            items.append((res(r['insee_2019']) or r['insee_2019'], shp_as_polys(g)))
    zdir = os.path.join(MONT, 'cerema', 'zinf')
    nzinf = 0
    deps_zinf = set()
    for fn in sorted(os.listdir(zdir)):
        if fn.endswith('.shp'):
            dep = fn[-7:-4].upper()
            deps_zinf.add(dep)
            for g in read_shp(os.path.join(zdir, fn)):
                if g:
                    items.append(('zinf-' + dep, shp_as_polys(g)))
                    nzinf += 1
    deps_partie = {r['code_dep'] for r in rows if r['classement'] == 'partie'}
    repli = [r['insee_2019'] for r in rows if r['classement'] == 'partie' and r['code_dep'] not in deps_zinf]
    for r, g in zip(rows, geoms):
        if r['insee_2019'] in repli and g:
            items.append((res(r['insee_2019']) or r['insee_2019'], shp_as_polys(g)))
    info = {
        'communes 2019 listées': len(rows), 'totalité': sum(1 for v in est.values() if v == 'totalité'),
        'partie': sum(1 for v in est.values() if v == 'partie'), 'sans correspondance 2025 (métropole)': perdus,
        'en partie : drapeau partie': len(partie_flag), 'en partie : fusion avec une commune non listée': len(mixte),
        'zones infra-communales (polygones)': nzinf, 'départements avec zone infra-communale': len(deps_zinf),
        'départements avec une commune « partie » sans fichier infra-communal': sorted(deps_partie - deps_zinf),
        'communes « partie » sans zone infra-communale (contour entier pris en repli)': len(repli),
    }
    return classe, partie, info, items


# ---------------------------------------------------------------------------------------------- distances
def distances(classe, zone):
    """R29 : 0 si classée ; 0 si la mairie est dans la zone (H81) ; sinon km au bord de la zone."""
    km, lab, h81 = {}, {}, []
    for c in COM:
        if c in classe:
            km[c], lab[c] = 0.0, c
            continue
        x, y = MAIRIE[c]
        dans = zone.contient(x, y)
        if dans is not None:
            km[c], lab[c] = 0.0, dans
            h81.append((c, dans))
            continue
        km[c], lab[c] = zone.proche(x, y)
    return km, lab, h81


def comparee(c, km, classe_h81):
    return 0 if c in classe_h81 else max(1, js_round(km[c]))


def commune_du_point(x, y):
    for c, polys in CONTOURS.items():
        x0, y0, x1, y1 = bbox(polys)
        if x0 <= x <= x1 and y0 <= y <= y1 and in_polys(x, y, polys):
            return c
    return None


def libelle_zone(lab, zone=None, ville=None):
    if lab is None:
        return '—'
    if zone is not None and lab.startswith('zinf') and ville is not None:
        zone.proche(*MAIRIE[ville])
        c = commune_du_point(*zone.dernier)
        return f'zone infra-communale du {lab[5:]}, dans {nom(c)} ({c})' if c else lab
    if lab in COM:
        return f'{nom(lab)} ({lab})'
    return lab


VILLES = [('74056', 'Chamonix-Mont-Blanc'), ('38185', 'Grenoble'), ('74010', 'Annecy'), ('64445', 'Pau'),
          ('63113', 'Clermont-Ferrand'), ('69123', 'Lyon'), ('87085', 'Limoges'), ('31555', 'Toulouse'), ('33063', 'Bordeaux')]


def classement_10km(km, classez, prix):
    """Note de src/domain/score.ts : loyer pour 52 m² (plafond 1 200 € ou Sans limite), montagne comme la mer (plafond 10)."""
    out = []
    for c in COM:
        notes = []
        v = js_round(SITE[c]['loyer_m2'] * 52)
        if prix is not None:
            if v > prix:
                continue
            notes.append(100 * (1 - v / prix))
        d = comparee(c, km, classez)
        if d > 10:
            continue
        notes.append(100 * (1 - d / 10))
        out.append((js_round(sum(notes) / len(notes) + 1e-9), v, c, d))
    out.sort(key=lambda t: (-t[0], t[1], cle_nom(nom(t[2]))))
    return out


def rapport_source(titre, classe, partie, zone, contours_note):
    print(f'\n## {titre}\n')
    print(f'Zone : {contours_note} ; {zone.npts} points de bord (un tous les {int(Zone.PAS)} m au plus, bords intérieurs retirés)')
    km, lab, h81 = distances(classe, zone)
    classez = classe | {c for c, _ in h81}
    print(f'Communes 2025 classées : {len(classe)} (dont en partie : {len(partie)}) ; mairies dans la zone sans commune classée (H81) : {len(h81)}')
    for c, z in sorted(h81, key=lambda t: -(pop(t[0]) or 0))[:15]:
        print(f'  H81 : {nom(c)} ({c}, {fr(pop(c))} hab.) — mairie dans {libelle_zone(z)}')
    print('\nVilles du risque (distance de la mairie au bord de la zone, km non arrondis ; affiché ; point le plus proche dans) :')
    for c, n in VILLES:
        st = 'classée en partie' if c in partie else ('classée' if c in classe else ('mairie dans la zone (H81)' if c in classez else ''))
        print(f'  {n} ({c}) : {km[c]:.2f} km → affiché {"Commune de montagne" if c in classez else str(comparee(c, km, classez)) + " km"} ; {st or "zone la plus proche : " + libelle_zone(lab[c], zone, c)}')
    print('\nVilles de plus de 50 000 habitants classées (ou H81) :')
    grandes = sorted((c for c in classez if (pop(c) or 0) > 50000), key=lambda c: -pop(c))
    for c in grandes:
        print(f'  {nom(c)} ({c}, {fr(pop(c))} hab.){" — en partie" if c in partie else ""}{" — H81" if c not in classe else ""}')
    if not grandes:
        print('  aucune')
    bins = collections.Counter()
    for c in COM:
        d = comparee(c, km, classez)
        b = '0 (commune de montagne)' if d == 0 else '1 à 10 km' if d <= 10 else '11 à 30 km' if d <= 30 else '31 à 50 km' if d <= 50 else '51 à 100 km' if d <= 100 else 'au-delà de 100 km'
        bins[b] += 1
    print('\nRépartition par choix (distance affichée) :')
    cum = 0
    for b in ('0 (commune de montagne)', '1 à 10 km', '11 à 30 km', '31 à 50 km', '51 à 100 km', 'au-delà de 100 km'):
        cum += bins[b]
        print(f'  {b} : {bins[b]} (cumul {cum})')
    for prix, t in ((1200, 'prix de départ 1 200 € pour 52 m²'), (None, 'prix sur Sans limite')):
        cl = classement_10km(km, classez, prix)
        print(f'\n10 premières à « 10 km », {t} ({len(cl)} communes passent) :')
        for i, (s, v, c, d) in enumerate(cl[:10], 1):
            print(f'  {i}. {nom(c)} ({c}, {SITE[c]["dep"]}) — {fr(pop(c))} hab. — score {s} — loyer {v} € — montagne {"Commune de montagne" if d == 0 else str(d) + " km"} (exact {km[c]:.2f} km)')
    return km, lab, classez


# ---------------------------------------------------------------------------------------------- discovery
def recoupement_discovery(classe):
    """Méthode de la discovery : centre de commune (geo.api) → centre de la commune classée la plus proche."""
    pts = [CENTRE[c] for c in classe if c in CENTRE]
    out = {}
    for c, n in VILLES:
        x, y = CENTRE[c]
        out[c] = 0 if c in classe else min(math.hypot(px - x, py - y) for px, py in pts) / 1000
    return out


# ---------------------------------------------------------------------------------------------- Insee
def xlsx_sheet(path, sheet_name):
    z = zipfile.ZipFile(path)
    ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    rid = next(s.get('{%s}id' % rel) for s in wb.find('m:sheets', ns) if s.get('name') == sheet_name)
    rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    target = next(r.get('Target') for r in rels if r.get('Id') == rid)
    ss = [''.join(t.text or '' for t in si.iter('{%s}t' % ns['m'])) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
    rows = []
    for _, el in ET.iterparse(z.open('xl/' + target.lstrip('/').replace('xl/', ''))):
        if el.tag == '{%s}row' % ns['m']:
            row = {}
            for cell in el:
                ref = re.match(r'[A-Z]+', cell.get('r')).group()
                v = cell.find('m:v', ns)
                if v is None:
                    is_ = cell.find('m:is', ns)
                    val = ''.join(t.text or '' for t in is_.iter('{%s}t' % ns['m'])) if is_ is not None else ''
                elif cell.get('t') == 's':
                    val = ss[int(v.text)]
                else:
                    val = v.text
                row[ref] = val
            rows.append(row)
            el.clear()
    return rows


NIVEAU = {'1': 'ville-dense', '2': 'ville-et-peripherie', '3': 'ville-et-peripherie', '4': 'ville-et-peripherie',
          '5': 'bourg-et-village', '6': 'bourg-et-village', '7': 'campagne-isolee'}


def insee():
    print('\n## Grille communale de densité Insee 2025 (D10, H72)\n')
    rows = xlsx_sheet(os.path.join(RAW, 'densite', 'fichier_diffusion_2025.xlsx'), 'Maille communale')
    for r in rows[:5]:
        print('  en-tête :', ' | '.join(f'{k}={v}' for k, v in r.items()))
    head_i = next(i for i, r in enumerate(rows) if 'DENS7' in r.values())
    head = rows[head_i]
    col = {v: k for k, v in head.items()}
    print('  colonnes :', ', '.join(head.values()))
    data = {r[col['CODGEO']]: r for r in rows[head_i + 1:] if r.get(col['CODGEO'])}
    libs = collections.Counter((r.get(col['DENS7']), r.get(col.get('LIBDENS7', ''), '')) for r in data.values())
    print('  DENS7 et libellés (toutes communes du fichier) :', sorted(libs.items()))
    if 'DENS' in col:
        print('  DENS et libellés :', sorted(collections.Counter((r.get(col['DENS']), r.get(col.get('LIBDENS', ''), '')) for r in data.values()).items()))
    sans = [c for c in COM if c not in data]
    niv = collections.Counter(NIVEAU.get(data[c][col['DENS7']]) for c in COM if c in data)
    print(f'  lignes du fichier : {len(data)} ; communes du site sans type : {len(sans)} {sans[:10]}')
    print('  niveaux de D10 sur les communes du site :', dict(niv))
    d7 = collections.Counter(data[c][col['DENS7']] for c in COM if c in data)
    print('  DENS7 sur les communes du site :', dict(sorted(d7.items())))
    for c in ('33063', '33214', '74056', '75056', '69123', '13055'):
        r = data.get(c)
        print(f'  {nom(c)} ({c}) : DENS7 {r and r[col["DENS7"]]} → {r and NIVEAU.get(r[col["DENS7"]])} ; libellé {r and r.get(col.get("LIBGEO", ""))}')
    arr = [k for k in data if k[:3] in ('751', '132') or k[:4] == '6938']
    print(f'  arrondissements de Paris, Lyon, Marseille dans le fichier : {len(arr)}')
    doc = xlsx_sheet(os.path.join(RAW, 'densite', 'fichier_diffusion_2025.xlsx'), 'Documentation')
    print('  feuille Documentation :')
    for r in doc:
        t = ' | '.join(v for v in r.values() if v)
        if t:
            print('    ' + t[:400].replace('\n', ' '))


# ---------------------------------------------------------------------------------------------- D12
def d12():
    print('\n## D12 d\'immobilier : prix tous biens (fichiers DVF retenus)\n')
    spec = importlib.util.spec_from_file_location('communes_site', os.path.join(ROOT, 'scripts', 'data', 'communes.py'))
    cm = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(cm)
    cm.BIENS = ('appartement', 'maison', 'apt_maison')  # lu par dvf_mois à l'appel (colonnes du fichier mensuel)
    ventes, epci = cm.dvf()
    d = (ventes, epci, cm.dvf_mois())

    def achat_d12(code, bien):
        p, s, regle = cm.achat_commune(d, code, bien)
        if p is not None:
            return p, s, regle
        r = ventes.get(code)
        q = cm.prix_ligne(r, d[2].get(('commune', code)), 'apt_maison')
        if q:
            return q[0], 'tous-biens', 'tb-' + q[1]
        parent = r['code_parent'] if r else None
        q = cm.prix_ligne(epci.get(parent), d[2].get(('epci', parent)), 'apt_maison') if parent in epci else None
        if q:
            return q[0], 'tous-biens-secteur', 'tb-3-' + q[1]
        return None, 'inconnu-secteur', 'inconnu'

    def achat(code, bien):
        dep = COM[code]['DEP']
        if dep in cm.ALSACE_MOSELLE:
            return None, 'inconnu-alsace-moselle', 'alsace-moselle'
        if code in cm.PLM:
            arr = [achat_d12(k, bien) for k in sorted(ventes) if len(k) == 5 and k.startswith(cm.PLM[code])]
            connus = [a for a in arr if a[0] is not None]
            return (round(sum(a[0] for a in connus) / len(connus), 2),
                    'secteur' if any(a[1] == 'secteur' for a in connus) else 'commune', 'H67', arr)
        return achat_d12(code, bien)

    ach_site = json.load(open(os.path.join(ROOT, 'public', 'data', 'achat.json')))
    ach_site = {r[0]: r for r in ach_site['communes']}
    res_ = {b: {c: achat(c, b) for c in COM} for b in ('appartement', 'maison')}
    srcs = ('commune', 'secteur', 'tous-biens', 'tous-biens-secteur', 'inconnu-secteur', 'inconnu-alsace-moselle')
    for j, b in enumerate(('appartement', 'maison')):
        n = collections.Counter(v[1] for v in res_[b].values())
        print(f'{b} : ' + ' ; '.join(f'{s} {n[s]}' for s in srcs) + f' (total {sum(n.values())})')
        avant = collections.Counter(r[2 + 2 * j] for r in ach_site.values())
        print(f'  achat.json d\'aujourd\'hui ({b}) : {dict(avant)}')
        change = [c for c in COM if (ach_site[c][1 + 2 * j], ach_site[c][2 + 2 * j]) != res_[b][c][:2]]
        hors_tb = [c for c in change if res_[b][c][1] not in ('tous-biens', 'tous-biens-secteur')]
        print(f'  communes qui changent par rapport à achat.json : {len(change)} (dont hors tous-biens : {len(hors_tb)} {hors_tb[:5]})')
        regles = collections.Counter(v[2] for c, v in res_[b].items() if v[1].startswith('tous-biens'))
        print(f'  tous biens, par règle (tb-1 récent, tb-2 2021-2025, tb-3-x intercommunalité) : {dict(regles)}')
        restent = [c for c, v in res_[b].items() if v[1] == 'inconnu-secteur']
        for c in restent:
            print(f'  reste sans prix : {nom(c)} ({c}, {SITE[c]["dep"]}, {fr(pop(c))} hab.)')
        tb = sorted((v[0], c, v[1]) for c, v in res_[b].items() if v[1].startswith('tous-biens'))
        if tb:
            k = max(1, math.ceil(len(tb) / 100))
            med = tb[len(tb) // 2][0]
            print(f'  prix tous biens retenus : {len(tb)} ; min {fr(tb[0][0])} €/m², 1er centile {fr(tb[k - 1][0])} €/m², médiane {fr(med)} €/m², max {fr(tb[-1][0])} €/m²')
            print(f'  les 1 % les plus bas ({k} communes) :')
            for p, c, s in tb[:k]:
                print(f'    {fr(p)} €/m² — {nom(c)} ({c}, {SITE[c]["dep"]}, {fr(pop(c))} hab.) — {s}')
    print('\nParis, Lyon, Marseille : arrondissements qui tomberaient en tous biens')
    for b in ('appartement', 'maison'):
        for code in cm.PLM:
            arr = res_[b][code][3]
            tb = [a for a in arr if a[1].startswith('tous-biens')]
            print(f'  {b}, {nom(code)} : {len(tb)} arrondissement(s) sur {len(arr)} ; prix de la ville {res_[b][code][0]} ({res_[b][code][1]})')
    print('\nCommunes nommées par le plan :')
    for c, b in (('02004', 'appartement'), ('29083', 'maison'), ('29083', 'appartement')):
        p, s, r = res_[b][c][:3]
        print(f'  {nom(c)} ({c}), {b} : {p} €/m², source {s}, règle {r} (achat.json aujourd\'hui : {ach_site[c][1:]})')
    exemples = {}
    for s in ('tous-biens', 'tous-biens-secteur'):
        cs = sorted((c for c, v in res_['appartement'].items() if v[1] == s), key=lambda c: -(pop(c) or 0))
        exemples[s] = cs[:3]
        for c in cs[:3]:
            print(f'  exemple appartement {s} : {nom(c)} ({c}, {fr(pop(c))} hab.) : {res_["appartement"][c][0]} €/m², règle {res_["appartement"][c][2]}')
    print('\n10 premières en Appartement · Acheter à 5 000 €/m², tout le reste sur Peu importe :')
    cl = []
    for c in COM:
        p = res_['appartement'][c][0]
        if p is None:
            continue
        v = js_round(p)
        if v <= 5000:
            cl.append((js_round(100 * (1 - v / 5000) + 1e-9), v, c))
    cl.sort(key=lambda t: (-t[0], t[1], cle_nom(nom(t[2]))))
    print(f'  ({len(cl)} communes passent avec une note)')
    for i, (s, v, c) in enumerate(cl[:10], 1):
        print(f'  {i}. {nom(c)} ({c}, {SITE[c]["dep"]}, {fr(pop(c))} hab.) — {fr(v)} €/m² — score {s} — source {res_["appartement"][c][1]} (règle {res_["appartement"][c][2]})')
    premier = next((i for i, (_, _, c) in enumerate(cl, 1) if res_['appartement'][c][1].startswith('tous-biens')), None)
    if premier:
        s_, v_, c_ = cl[premier - 1]
        print(f'  première commune au prix tous biens : rang {premier}, {nom(c_)} ({c_}, {SITE[c_]["dep"]}, {fr(pop(c_))} hab.) — {fr(v_)} €/m² — {res_["appartement"][c_][1]}')
    n_tb = sum(1 for _, _, c in cl[:100] if res_['appartement'][c][1].startswith('tous-biens'))
    print(f'  parmi les 100 premières : {n_tb} au prix tous biens')


# ---------------------------------------------------------------------------------------------- main
def main():
    a_classe, a_partie, a_info, massif, sans_art_m = source_agri_anct()
    print('\n## Source A — zone de montagne 2017 (Agriculture, « Art 18 ») × massifs 2021 (ANCT)\n')
    for k, v in a_info.items():
        print(f'  {k} : {v}')
    print(f'  communes agri sans article mais « M » (Montagne - FR), non comptées par la règle de la discovery : {sans_art_m[:12]}…')
    za = Zone([(c, CONTOURS[c]) for c in sorted(a_classe)])
    a_km, a_lab, a_cz = rapport_source('Source A — distances (union des contours 2025 des communes classées)', a_classe, a_partie, za,
                                      'union des contours 2025 (Etalab, 100 m) des communes classées')
    disc = recoupement_discovery(a_classe)
    print('\nRecoupement avec la discovery (centre de commune → centre de la commune classée la plus proche, même règle) :')
    for c, n in VILLES:
        print(f'  {n} : {disc[c]:.1f} km (méthode discovery) ; {a_km[c]:.1f} km (R29 : mairie → bord de la zone)')

    b_classe, b_partie, b_info, b_items = source_cerema()
    print('\n## Source B — zonage loi Montagne du Cerema (communes 2019)\n')
    for k, v in b_info.items():
        print(f'  {k} : {v}')
    zb = Zone(b_items)
    b_km, b_lab, b_cz = rapport_source('Source B — distances (contours propres du Cerema : communes 2019 « totalité » + zones infra-communales ; repli : contour entier des communes « partie » sans zone infra-communale)',
                                      b_classe, b_partie, zb, 'contours propres du Cerema')
    zb2 = Zone([(c, CONTOURS[c]) for c in sorted(b_classe)])
    b2_km, _, b2_h81 = distances(b_classe, zb2)
    print('\nVariante B2 — Cerema, union des contours 2025 des communes classées (« partie » comptée entière) :')
    for c, n in VILLES:
        print(f'  {n} : {b2_km[c]:.2f} km')
    print(f'  mairies dans la zone sans commune classée (H81) avec B2 : {len(b2_h81)}')

    print('\n## Écarts entre les deux sources (communes classées)\n')
    seul_a, seul_b = a_classe - b_classe, b_classe - a_classe
    print(f'  classées par les deux : {len(a_classe & b_classe)} ; par A seulement : {len(seul_a)} ; par B seulement : {len(seul_b)}')
    for titre, s, autre_km in (('A seulement', seul_a, b_km), ('B seulement', seul_b, a_km)):
        print(f'  {titre}, les 10 plus peuplées :')
        for c in sorted(s, key=lambda c: -(pop(c) or 0))[:10]:
            print(f'    {nom(c)} ({c}, {SITE[c]["dep"]}, {fr(pop(c))} hab.) — massif ANCT : {massif.get(c, "?")} — distance par l\'autre source : {autre_km[c]:.1f} km')
        print(f'    par massif ANCT : {dict(collections.Counter(massif.get(c, "?") for c in s))}')
        print(f'    par département : {dict(collections.Counter(SITE[c]["dep"] for c in s).most_common())}')
    diff = sorted(((abs(comparee(c, a_km, a_cz) - comparee(c, b_km, b_cz)), c) for c in COM), reverse=True)
    print(f'  communes dont la distance affichée diffère : {sum(1 for d, _ in diff if d > 0)} ; de plus de 10 km : {sum(1 for d, _ in diff if d > 10)}')
    print('  plus grands écarts (hors communes classées par une seule source) :')
    k = 0
    for dd, c in diff:
        if c in seul_a or c in seul_b:
            continue
        print(f'    {nom(c)} ({c}, {SITE[c]["dep"]}, {fr(pop(c))} hab.) : A {a_km[c]:.1f} km ({libelle_zone(a_lab[c])}), B {b_km[c]:.1f} km ({libelle_zone(b_lab[c])})')
        k += 1
        if k == 8:
            break
    insee()
    d12()


if __name__ == '__main__':
    main()
