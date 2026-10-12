"""Fond de secours (R8) : public/data/voisins.json — pays voisins et contour de la France métropolitaine.

Source : Natural Earth admin-0 1:10 m, v5.1.2, domaine public (téléchargé par scripts/data/sources.py).
Deux familles d'entités, propriété `role` : `voisin` (pays autour de la métropole, peints en `map-neighbour`)
et `france` (métropole et Corse seulement, pour tracer le trait de côte et les frontières en `map-border`).
Formes simplifiées (Douglas-Peucker, ≈ 500 m) : on ne les voit qu'à l'échelle de la France, quand l'IGN est en panne.

Prérequis : python3 scripts/data/sources.py
Usage : python3 scripts/data/voisins.py
"""
import json
import os

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
SRC = os.path.join(ROOT, 'data-raw', 'ne_10m_admin_0_countries.geojson')
OUT = os.path.join(ROOT, 'public', 'data', 'voisins.json')

VOISINS = {'ESP', 'PRT', 'AND', 'MCO', 'ITA', 'SMR', 'VAT', 'CHE', 'LIE', 'AUT', 'DEU', 'LUX', 'BEL', 'NLD',
           'GBR', 'IRL', 'IMN', 'GGY', 'JEY', 'DNK', 'CZE', 'SVN', 'HRV', 'DZA', 'TUN', 'MAR'}
CADRE = (-12.0, 34.0, 20.0, 58.0)  # ouest, sud, est, nord : ce qu'on peut voir autour de la métropole
METROPOLE = (-5.5, 41.0, 10.0, 51.5)
TOLERANCE = 0.005  # degrés (≈ 500 m)
DECIMALES = 3


def check(cond, msg):
    print(('  ok   ' if cond else '  ÉCHEC ') + msg)
    if not cond:
        raise SystemExit(1)


def douglas_peucker(pts, tol):
    if len(pts) < 3:
        return pts
    garder = [False] * len(pts)
    garder[0] = garder[-1] = True
    pile = [(0, len(pts) - 1)]
    while pile:
        a, b = pile.pop()
        (x1, y1), (x2, y2) = pts[a], pts[b]
        dx, dy = x2 - x1, y2 - y1
        n2 = dx * dx + dy * dy
        best, idx = -1.0, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            if n2 == 0:
                d = (px - x1) ** 2 + (py - y1) ** 2
            else:
                t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / n2))
                d = (px - x1 - t * dx) ** 2 + (py - y1 - t * dy) ** 2
            if d > best:
                best, idx = d, i
        if best > tol * tol:
            garder[idx] = True
            pile += [(a, idx), (idx, b)]
    return [p for p, k in zip(pts, garder) if k]


def anneau(pts):
    out = []
    for x, y in douglas_peucker(pts, TOLERANCE):
        p = [round(x, DECIMALES), round(y, DECIMALES)]
        if not out or out[-1] != p:
            out.append(p)
    return out if len(out) >= 4 else None


def dans(pts, cadre):
    w, s, e, n = cadre
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return max(xs) >= w and min(xs) <= e and max(ys) >= s and min(ys) <= n


def polygones(geom, cadre):
    polys = [geom['coordinates']] if geom['type'] == 'Polygon' else geom['coordinates']
    out = []
    for rings in polys:
        if not dans(rings[0], cadre):
            continue
        exterieur = anneau(rings[0])
        if exterieur:  # une île plus petite que la tolérance disparaît, avec ses trous
            out.append([exterieur] + [a for a in (anneau(x) for x in rings[1:]) if a])
    return out


def main():
    with open(SRC, encoding='utf-8') as f:
        pays = json.load(f)['features']
    features = []
    vus = set()
    for p in pays:
        iso = p['properties']['ADM0_A3']
        if iso in VOISINS:
            role, cadre = 'voisin', CADRE
        elif iso == 'FRA':
            role, cadre = 'france', METROPOLE
        else:
            continue
        polys = polygones(p['geometry'], cadre)
        if polys:
            vus.add(iso)
            features.append({'type': 'Feature', 'properties': {'role': role},
                             'geometry': {'type': 'MultiPolygon', 'coordinates': polys}})
    print('Contrôles')
    check('FRA' in vus, 'la France métropolitaine est là')
    for iso in ('ESP', 'ITA', 'CHE', 'DEU', 'BEL', 'LUX', 'GBR', 'AND', 'MCO'):
        check(iso in vus, f'voisin présent : {iso}')
    france = next(f for f in features if f['properties']['role'] == 'france')
    corse = any(any(8.5 < x < 9.6 and 41.3 < y < 43.1 for x, y in poly[0]) for poly in france['geometry']['coordinates'])
    check(corse, 'la Corse est dans le contour de la France')
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump({'type': 'FeatureCollection', 'features': features}, f, separators=(',', ':'))
    print(f'voisins.json : {len(features)} entités, {os.path.getsize(OUT) / 1e6:.2f} Mo')


if __name__ == '__main__':
    main()
