"""Distance à vol d'oiseau du centre de chaque commune à la mer (D8, H5), en km non arrondis.

Repris de la discovery (2026-10-11, tests-avant-code/scripts/mer.py). Source : Limite terre-mer Shom-IGN 2021.
On garde les tronçons qui ne sont ni en amont de la limite transversale de la mer (limarc « 2 ») ni en amont de la
limite de salure des eaux (« 4 »). Deux estuaires ne sont pas étiquetés dans le fichier et sont retirés à la main :
la Seine en amont du pont de Tancarville (discovery) et l'Adour en amont de son embouchure (tâche 1a).

Usage : python3 scripts/data/mer.py  →  data-raw/mer-km.csv (code, km)
"""
import collections
import csv
import json
import math
import os
import struct

RAW = os.path.join(os.path.dirname(__file__), '..', '..', 'data-raw')
SH = os.path.join(RAW, 'Limite_terre_mer_France_metropolitaine', 'SHAPE', 'Limite_terre-mer_France_metropolitaine_ligne')

# WGS84 (lon, lat) -> Lambert-93 (formules IGN, ellipsoïde GRS80)
A, E = 6378137.0, 0.0818191910428158
N, C, XS, YS = 0.7256077650532670, 11754255.426096, 700000.0, 12655612.049876
LON0 = math.radians(3)


def to_l93(lon, lat):
    p = math.radians(lat)
    lat_iso = math.log(math.tan(math.pi / 4 + p / 2) * ((1 - E * math.sin(p)) / (1 + E * math.sin(p))) ** (E / 2))
    r = C * math.exp(-N * lat_iso)
    g = N * (math.radians(lon) - LON0)
    return XS + r * math.sin(g), YS - r * math.cos(g)


def seine_amont(x, y):
    """Seine en amont du pont de Tancarville (discovery)."""
    return 516000 < x < 700000 and 6880000 < y < 6950000


# Adour en amont de son embouchure (Boucau / Anglet, ≈ -1,523° ; 43,527°) : deux boîtes en degrés.
# 1) le chenal de Bayonne : à l'est de -1,505° et au sud de 43,545° (la côte de Tarnos est à l'ouest de -1,51°) ;
# 2) la vallée jusqu'à Peyrehorade : à l'est de -1,40° et au sud de 43,62° (la côte landaise y est à l'ouest de -1,44°).
ADOUR = [(-1.505, 43.40, -0.90, 43.545), (-1.40, 43.40, -0.90, 43.62)]
ADOUR_L93 = []


def _adour_l93():
    boites = []
    for lon0, lat0, lon1, lat1 in ADOUR:
        xs, ys = zip(*(to_l93(lo, la) for lo in (lon0, lon1) for la in (lat0, lat1)))
        boites.append((min(xs), min(ys), max(xs), max(ys)))
    ADOUR_L93[:] = boites  # remplace, n'ajoute pas : la fonction peut être rappelée


def adour_amont(x, y):
    return any(x0 < x < x1 and y0 < y < y1 for x0, y0, x1, y1 in ADOUR_L93)


def keep_flags():
    f = open(SH + '.dbf', 'rb')
    nrec, hlen, rlen = struct.unpack('<IHH', f.read(32)[4:12])
    fields = []
    while True:
        d = f.read(32)
        if d[0] == 0x0D:
            break
        fields.append((d[:11].split(b'\0')[0].decode(), d[16]))
    off, lim = 1, None
    for name, length in fields:
        if name == 'limarc':
            lim = (off, length)
        off += length
    f.seek(hlen)
    keep = []
    for _ in range(nrec):
        r = f.read(rlen)
        codes = r[lim[0]:lim[0] + lim[1]].decode().strip().split(',')
        keep.append('2' not in codes and '4' not in codes)
    return keep


def coast_points(fix_adour=True, step=200.0):
    """Points de côte gardés (un tous les `step` m au plus), en Lambert-93."""
    _adour_l93()
    keep = keep_flags()
    pts_out = []
    f = open(SH + '.shp', 'rb')
    f.seek(100)
    i = 0
    while True:
        hd = f.read(8)
        if len(hd) < 8:
            break
        _, clen = struct.unpack('>ii', hd)
        rec = f.read(clen * 2)
        if struct.unpack('<i', rec[:4])[0] != 0 and keep[i]:
            nparts, npts = struct.unpack('<ii', rec[36:44])
            pts = struct.unpack('<%dd' % (2 * npts), rec[44 + 4 * nparts:44 + 4 * nparts + 16 * npts])
            lx = ly = None
            for k in range(0, len(pts), 2):
                x, y = pts[k], pts[k + 1]
                if seine_amont(x, y) or (fix_adour and adour_amont(x, y)):
                    continue
                if lx is None or abs(x - lx) + abs(y - ly) >= step:
                    pts_out.append((x, y))
                    lx, ly = x, y
        i += 1
    return pts_out


class Nearest:
    CELL = 10000.0

    def __init__(self, pts):
        self.grid = collections.defaultdict(list)
        for x, y in pts:
            self.grid[(int(x // self.CELL), int(y // self.CELL))].append((x, y))

    def km(self, x, y):
        cx, cy = int(x // self.CELL), int(y // self.CELL)
        best = float('inf')
        for r in range(0, 80):
            if best < (r - 1) * self.CELL:
                break
            for gx in range(cx - r, cx + r + 1):
                for gy in range(cy - r, cy + r + 1):
                    if max(abs(gx - cx), abs(gy - cy)) != r:
                        continue
                    for px, py in self.grid.get((gx, gy), ()):
                        d = (px - x) ** 2 + (py - y) ** 2
                        if d < best * best:
                            best = math.sqrt(d)
        return best / 1000


def distances(fix_adour=True):
    near = Nearest(coast_points(fix_adour))
    out = {}
    for c in json.load(open(os.path.join(RAW, 'communes-centre.json'))):
        if c['codeDepartement'] >= '97' or not c.get('centre'):
            continue
        out[c['code']] = near.km(*to_l93(*c['centre']['coordinates']))
    return out


def main():
    d = distances()
    with open(os.path.join(RAW, 'mer-km.csv'), 'w', newline='') as g:
        w = csv.writer(g)
        w.writerow(['code', 'km'])
        for code in sorted(d):
            w.writerow([code, f'{d[code]:.3f}'])
    print(f'mer-km.csv : {len(d)} communes')


if __name__ == '__main__':
    main()
