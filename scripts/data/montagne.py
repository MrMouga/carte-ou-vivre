"""Distance à vol d'oiseau de la mairie de chaque commune à la zone de montagne (R29, H81, D18), en km non arrondis.

Source retenue en tâche 0 de cadre-de-vie (2026-10-15) : zonage loi Montagne du Cerema, communes au 1er janvier 2019
(Licence Ouverte 2.0). Méthode de la tâche 0 (docs/plans/2026-10-15-cadre-de-vie/mesure-tache-0.md), même principe que
mer.py :
- recalage des communes 2019 sur le COG 2025 : fusions et changements de code, et rétablissements (MOD 21 : la commune
  rétablie hérite du classement de celle dont elle sort) ; une commune 2025 est classée si une de ses communes 2019
  l'est, « en partie » si l'une l'est en partie ou si elle est née d'une fusion avec une commune non classée ;
- zone = contours propres du Cerema : communes 2019 « totalité » + zones infra-communales (34 départements) ; repli :
  contour entier des communes « partie » d'un département sans fichier infra-communal ;
- bord de la zone échantillonné tous les 100 m au plus (erreur < 50 m), bords intérieurs entre deux polygones retirés ;
- 0 pour une commune classée, en tout ou partie, ou dont la mairie est dans la zone (H81) ; sinon km au bord.

Usage : python3 scripts/data/montagne.py  →  data-raw/montagne-km.csv (code, km, classement)
  classement : « totalite », « partie », « mairie-dans-la-zone » (H81) ou vide.
"""
import collections
import csv
import json
import math
import os
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mer import to_l93  # noqa: E402

RAW = os.path.join(os.path.dirname(__file__), '..', '..', 'data-raw')
CEREMA = os.path.join(RAW, 'montagne', 'cerema')
COMMUNES_2019 = os.path.join(CEREMA, 'communes', 'l_commune_loimontagne85_000_2019')
DATE_SOURCE = '2019-01-01'


# ---------------------------------------------------------------------------------------------- COG 2025 et recalage
def cog():
    with open(os.path.join(RAW, 'v_commune_2025.csv'), encoding='utf-8') as f:
        return {r['COM']: r for r in csv.DictReader(f) if r['TYPECOM'] == 'COM' and not r['DEP'].startswith('97')}


class Recalage:
    """Ancien code → code 2025, d'après les mouvements du COG 2025 (Insee)."""

    def __init__(self, com):
        self.com = com
        with open(os.path.join(RAW, 'v_mvt_commune_2025.csv'), encoding='utf-8') as f:
            self.mvt = sorted(csv.DictReader(f), key=lambda r: r['DATE_EFF'])
        self.suivant = {}
        for r in self.mvt:
            if r['TYPECOM_AV'] == 'COM' and r['COM_AV'] != r['COM_AP'] and r['TYPECOM_AP'] in ('COM', 'COMD', 'COMA'):
                self.suivant[r['COM_AV']] = r['COM_AP']

    def code_2025(self, code):
        """Chaînes de fusions et de changements de code."""
        vus = set()
        while code not in self.com and code in self.suivant and code not in vus:
            vus.add(code)
            code = self.suivant[code]
        return code if code in self.com else None

    def retablies(self, date):
        """Communes rétablies après `date` (MOD 21) : code 2025 rétabli → code de la commune dont elle est sortie."""
        return {r['COM_AP']: r['COM_AV'] for r in self.mvt
                if r['MOD'] == '21' and r['DATE_EFF'] > date and r['TYPECOM_AV'] == r['TYPECOM_AP'] == 'COM'
                and r['COM_AV'] != r['COM_AP'] and r['COM_AP'] in self.com}

    def membres(self, date):
        """Code 2025 → codes des communes existant à `date` qui s'y fondent."""
        m = collections.defaultdict(set)
        for r in self.mvt:
            if r['DATE_EFF'] > date and r['TYPECOM_AV'] == 'COM':
                n = self.code_2025(r['COM_AV'])
                if n:
                    m[n].add(r['COM_AV'])
        return m


# ---------------------------------------------------------------------------------------------- shapefiles
def read_shp(path):
    """Polygones d'un shapefile (type 5, Lambert-93) : un enregistrement = liste d'anneaux (non regroupés)."""
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
            out.append([[(pts[2 * k], pts[2 * k + 1]) for k in range(parts[i], parts[i + 1])] for i in range(nparts)])
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


def eclaircir(rings, pas=30.0):
    """Anneaux d'un enregistrement → un polygone lu en pair-impair ; un sommet tous les `pas` m au moins (Admin Express
    2019 à pleine résolution est trop lourd ; erreur < 30 m)."""
    out = []
    for ring in rings:
        r = [ring[0]]
        for p in ring[1:-1]:
            if abs(p[0] - r[-1][0]) + abs(p[1] - r[-1][1]) >= pas:
                r.append(p)
        r.append(ring[-1])
        if len(r) >= 4:
            out.append(r)
    return out


def dans_anneau(x, y, ring):
    dedans = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            dedans = not dedans
        j = i
    return dedans


# ---------------------------------------------------------------------------------------------- zone
class Zone:
    """Union de polygones : appartenance d'un point et distance au bord (points du bord tous les PAS m au plus ; une
    arête partagée par deux polygones est un bord intérieur, retiré)."""
    PAS = 100.0
    CELL = 5000.0

    def __init__(self, items):
        self.items = items  # (étiquette, anneaux)
        self.boites = collections.defaultdict(list)
        aretes = collections.Counter()

        def segments(rings):
            for ring in rings:
                for i in range(1, len(ring)):
                    a = (round(ring[i - 1][0], 1), round(ring[i - 1][1], 1))
                    b = (round(ring[i][0], 1), round(ring[i][1], 1))
                    if a != b:
                        yield (a, b) if a < b else (b, a)

        for k, (_, rings) in enumerate(items):
            xs = [p[0] for ring in rings for p in ring]
            ys = [p[1] for ring in rings for p in ring]
            boite = (min(xs), min(ys), max(xs), max(ys))
            for gx in range(int(boite[0] // 10000), int(boite[2] // 10000) + 1):
                for gy in range(int(boite[1] // 10000), int(boite[3] // 10000) + 1):
                    self.boites[(gx, gy)].append((k, boite))
            aretes.update(segments(rings))
        self.grille = collections.defaultdict(list)
        self.points = 0
        for _, rings in items:
            for a, b in segments(rings):
                if aretes[(a, b)] > 1:
                    continue
                n = max(1, math.ceil(math.hypot(b[0] - a[0], b[1] - a[1]) / self.PAS))
                for j in range(n + 1):
                    x, y = a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n
                    self.grille[(int(x // self.CELL), int(y // self.CELL))].append((x, y))
                    self.points += 1

    def contient(self, x, y):
        for k, (x0, y0, x1, y1) in self.boites.get((int(x // 10000), int(y // 10000)), ()):
            if x0 <= x <= x1 and y0 <= y <= y1 and sum(dans_anneau(x, y, r) for r in self.items[k][1]) % 2 == 1:
                return self.items[k][0]
        return None

    def km(self, x, y):
        cx, cy = int(x // self.CELL), int(y // self.CELL)
        best = float('inf')
        for r in range(0, 400):
            if best < (r - 1) * self.CELL:
                break
            if r == 0:
                cells = [(cx, cy)]
            else:  # le pourtour du carré de rayon r
                cells = [(cx + i, cy - r) for i in range(-r, r + 1)] + [(cx + i, cy + r) for i in range(-r, r + 1)]
                cells += [(cx - r, cy + j) for j in range(-r + 1, r)] + [(cx + r, cy + j) for j in range(-r + 1, r)]
            for cell in cells:
                for px, py in self.grille.get(cell, ()):
                    d = (px - x) ** 2 + (py - y) ** 2
                    if d < best * best:
                        best = math.sqrt(d)
        return best / 1000


# ---------------------------------------------------------------------------------------------- Cerema
def cerema(com, rec):
    """Communes 2025 classées (code → « totalite » | « partie ») et polygones de la zone."""
    rows = read_dbf(COMMUNES_2019 + '.dbf')
    geoms = read_shp(COMMUNES_2019 + '.shp')
    assert len(rows) == len(geoms), 'Cerema : formes et lignes en nombre différent'
    est = {r['insee_2019']: r['classement'] for r in rows}
    perdus = sorted(c for c in est if rec.code_2025(c) is None)
    n25 = collections.defaultdict(list)
    for c in est:
        n = rec.code_2025(c)
        if n:
            n25[n].append(c)
    for n, o in sorted(rec.retablies(DATE_SOURCE).items()):
        if o in est and n not in n25:
            n25[n] = [o]
            print(f"  rétablie après la source : {com[n]['LIBELLE']} ({n}) hérite de {o}")
    membres = rec.membres(DATE_SOURCE)
    classe = {}
    for n, olds in n25.items():
        mixte = any(o not in est for o in membres.get(n, ()))
        classe[n] = 'partie' if mixte or any(est[o] == 'partie' for o in olds) else 'totalite'

    items = [(r['insee_2019'], eclaircir(g)) for r, g in zip(rows, geoms) if r['classement'] == 'totalité' and g]
    zdir = os.path.join(CEREMA, 'zinf')
    deps_zinf = set()
    nzinf = 0
    for fn in sorted(os.listdir(zdir)):
        if fn.endswith('.shp'):
            dep = fn[-7:-4].upper()
            deps_zinf.add(dep)
            for g in read_shp(os.path.join(zdir, fn)):
                if g:
                    items.append(('zinf-' + dep, eclaircir(g)))
                    nzinf += 1
    repli = [(r['insee_2019'], eclaircir(g)) for r, g in zip(rows, geoms)
             if r['classement'] == 'partie' and r['code_dep'] not in deps_zinf and g]
    items += repli
    print(f"  communes 2019 listées : {len(rows)} (totalité {sum(1 for v in est.values() if v == 'totalité')},"
          f" partie {sum(1 for v in est.values() if v == 'partie')}) ; sans correspondance en 2025 : {perdus}")
    print(f'  zones infra-communales : {nzinf} polygones, {len(deps_zinf)} départements ;'
          f' communes « partie » sans zone infra-communale (contour entier en repli) : {len(repli)}')
    return classe, items


def main():
    com = cog()
    rec = Recalage(com)
    print('Zone de montagne : Cerema, communes soumises à la loi Montagne (2019)')
    classe, items = cerema(com, rec)
    zone = Zone(items)
    print(f'  bord de la zone : {zone.points} points (un tous les {zone.PAS:.0f} m au plus, bords intérieurs retirés)')
    mairies = {c['code']: to_l93(*c['mairie']['coordinates'])
               for c in json.load(open(os.path.join(RAW, 'communes-mairie.json'))) if c['code'] in com and c.get('mairie')}
    out = {}
    for code in sorted(com):
        if code in classe:
            out[code] = (0.0, classe[code])
        elif code not in mairies:
            continue  # communes.py s'arrête : 0 commune sans distance
        elif zone.contient(*mairies[code]) is not None:
            out[code] = (0.0, 'mairie-dans-la-zone')
        else:
            out[code] = (zone.km(*mairies[code]), '')
    with open(os.path.join(RAW, 'montagne-km.csv'), 'w', newline='') as g:
        w = csv.writer(g)
        w.writerow(['code', 'km', 'classement'])
        for code, (km, cl) in out.items():
            w.writerow([code, f'{km:.3f}', cl])
    n = collections.Counter(cl for _, cl in out.values())
    print(f"montagne-km.csv : {len(out)} communes ; classées {n['totalite'] + n['partie']} (dont en partie {n['partie']}) ;"
          f" mairie dans la zone sans commune classée (H81) : {n['mairie-dans-la-zone']}")


if __name__ == '__main__':
    main()
