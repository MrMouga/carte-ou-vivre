"""Formes servies par le site (tâche 7) : tuiles vectorielles des communes et repères.

- public/tuiles/{z}/{x}/{y}.pbf : contours Etalab à 100 m, couche `communes`, zoom 4 à 11 (au-delà, la carte agrandit
  le zoom 11). L'identifiant d'une forme est l'index de sa commune dans communes.json (comme avant).
  Options de tippecanoe : toutes les communes à tous les zooms (aucune supprimée, même minuscule à l'échelle de la
  France), frontières partagées simplifiées ensemble (pas de trou ni de chevauchement entre voisines),
  tuiles non compressées (servies telles quelles par un hébergeur statique).
- public/data/reperes.json : pour chaque commune, [lon, lat] du centre de son rond (barycentre du plus grand polygone)
  et son cadre [ouest, sud, est, nord], pour zoomer dessus.

Prérequis : python3 scripts/data/communes.py (écrit data-raw/formes-100m.json) ; tippecanoe (brew install tippecanoe).
Usage : python3 scripts/data/tuiles.py  ·  python3 scripts/data/tuiles.py --fixture  (tuiles des tests)
"""
import json
import math
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
FIXTURE = os.path.join(ROOT, 'tests', 'fixtures', 'tuiles')
ACCEPTANCE = os.path.join(ROOT, 'docs', 'specs', '2026-10-12-loyer-mer', 'acceptance.json')
SRC = os.path.join(ROOT, 'data-raw', 'formes-100m.json')
TUILES = os.path.join(ROOT, 'public', 'tuiles')
REPERES = os.path.join(ROOT, 'public', 'data', 'reperes.json')
ZOOM_MIN, ZOOM_MAX = 4, 11
# Détail des zooms sous le maximum : 2^10 unités par tuile de 512 px, soit 2 par pixel (au lieu de 4 par défaut) ;
# assez pour l'écran, et 4 fois moins de points à recolorer à chaque réglage (H9 : ≤ 100 ms).
DETAIL_ZOOMS_BAS = 10
LIMITE_FICHIERS = 20_000  # Cloudflare Pages, offre gratuite
LIMITE_FICHIER_OCTETS = 25 * 1024 * 1024


def check(cond, msg):
    print(('  ok   ' if cond else '  ÉCHEC ') + msg)
    if not cond:
        raise SystemExit(1)


def centre(geom):
    polys = [geom['coordinates']] if geom['type'] == 'Polygon' else geom['coordinates']
    best, aire = (0.0, 0.0), -1.0
    for rings in polys:
        r = rings[0]
        a = cx = cy = 0.0
        j = len(r) - 1
        for i in range(len(r)):
            f = r[j][0] * r[i][1] - r[i][0] * r[j][1]
            a += f
            cx += (r[j][0] + r[i][0]) * f
            cy += (r[j][1] + r[i][1]) * f
            j = i
        if abs(a) > aire:
            aire, best = abs(a), (cx / (3 * a), cy / (3 * a))
    return best


def cadre(geom):
    polys = [geom['coordinates']] if geom['type'] == 'Polygon' else geom['coordinates']
    xs = [p[0] for rings in polys for p in rings[0]]
    ys = [p[1] for rings in polys for p in rings[0]]
    return min(xs), min(ys), max(xs), max(ys)


def emprise(reperes):
    return (min(r[2] for r in reperes), min(r[3] for r in reperes), max(r[4] for r in reperes), max(r[5] for r in reperes))


def tuiles(src, dest, zmin, zmax, cadre_total):
    """Lance tippecanoe (`dest` est vidé avant), puis écrit une tuile vide partout où il n'en a pas fait dans le cadre :
    la carte ne demande rien hors de ce cadre (option `bounds` de la source), et toute tuile demandée existe,
    sinon l'hébergeur répondrait 404 ou servirait la page d'accueil à la place."""
    if os.path.isdir(dest):
        shutil.rmtree(dest)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    subprocess.run([
        'tippecanoe', '--output-to-directory', dest, '--layer', 'communes',
        '--minimum-zoom', str(zmin), '--maximum-zoom', str(zmax),
        '--no-tile-compression', '--no-tiny-polygon-reduction', '--no-feature-limit', '--no-tile-size-limit',
        '--detect-shared-borders', '--low-detail', str(DETAIL_ZOOMS_BAS), '--quiet', src,
    ], check=True)
    os.remove(os.path.join(dest, 'metadata.json'))  # inutile au site : la carte connaît la couche et les zooms
    w, s, e, n = cadre_total
    vides = 0
    for z in range(zmin, zmax + 1):
        k = 2 ** z
        tx = lambda lon: min(k - 1, int((lon + 180) / 360 * k))
        ty = lambda lat: min(k - 1, int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * k))
        for x in range(tx(w), tx(e) + 1):
            for y in range(ty(n), ty(s) + 1):
                p = os.path.join(dest, str(z), str(x), f'{y}.pbf')
                if not os.path.exists(p):
                    os.makedirs(os.path.dirname(p), exist_ok=True)
                    open(p, 'wb').close()
                    vides += 1
    return vides


def fixture():
    """Tuiles de la fixture « 5 communes » des tests (tests/fixtures/tuiles), mêmes options."""
    with open(ACCEPTANCE, encoding='utf-8') as f:
        items = json.load(f)['fixture']['items']
    feats = [{'type': 'Feature', 'id': i, 'properties': {}, 'geometry': {'type': 'Polygon', 'coordinates': [it['forme']]}}
             for i, it in enumerate(items)]
    reperes = [[*centre(ft['geometry']), *cadre(ft['geometry'])] for ft in feats]
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, 'fixture.json')
        with open(src, 'w') as f:
            json.dump({'type': 'FeatureCollection', 'features': feats}, f)
        vides = tuiles(src, FIXTURE, ZOOM_MIN, ZOOM_MAX, emprise(reperes))
    n = sum(len(ns) for _, _, ns in os.walk(FIXTURE))
    print(f'fixture : {n} tuiles, dont {vides} vides')


def main():
    if sys.argv[1:] == ['--fixture']:
        return fixture()
    with open(SRC) as f:
        feats = json.load(f)['features']
    reperes = []
    for i, ft in enumerate(feats):
        assert ft['id'] == i
        cx, cy = centre(ft['geometry'])
        reperes.append([round(cx, 4), round(cy, 4), *(round(v, 4) for v in cadre(ft['geometry']))])
    with open(REPERES, 'w') as f:
        json.dump({'champs': ['lon', 'lat', 'ouest', 'sud', 'est', 'nord'], 'reperes': reperes}, f, separators=(',', ':'))

    vides = tuiles(SRC, TUILES, ZOOM_MIN, ZOOM_MAX, emprise(reperes))
    fichiers = [os.path.join(d, n) for d, _, ns in os.walk(TUILES) for n in ns]
    tailles = sorted((os.path.getsize(p), p) for p in fichiers)
    total = sum(t for t, _ in tailles)
    print('Contrôles')
    check(len(reperes) == 34746, f'{len(reperes)} repères (34 746 communes)')
    check(len(fichiers) < LIMITE_FICHIERS, f'{len(fichiers)} tuiles (limite de l\'hébergeur : {LIMITE_FICHIERS})')
    check(tailles[-1][0] < LIMITE_FICHIER_OCTETS, f'plus grosse tuile : {tailles[-1][0] / 1e6:.2f} Mo ({os.path.relpath(tailles[-1][1], TUILES)})')
    print(f'tuiles : {total / 1e6:.1f} Mo au total, dont {vides} vides ; reperes.json : {os.path.getsize(REPERES) / 1e6:.2f} Mo')


if __name__ == '__main__':
    main()
