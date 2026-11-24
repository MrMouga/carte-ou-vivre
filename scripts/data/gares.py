"""Gares « grandes lignes » ajoutées aux gares nationales de l'Insee (tranche services, tâche 0a ; D18, H170, H171).

Recalcule depuis les horaires SNCF les gares de H170, et contrôle qu'elles sont celles de l'essai de /spec, vers
lesquelles les temps d'openrouteservice ont été calculés une seule fois (H171, ne pas relancer).

Règle (H170) : on compte, du 23/11 au 20/12/2026 (28 jours), les arrêts où l'on peut monter ou descendre des TGV INOUI,
OUIGO, Lyria, ICE et Intercités, divisés par 28 ; la commune d'une gare est celle dont le contour (Etalab 2025) contient
son point SNCF ; une gare entre à partir de 4 arrêts par jour (TGV et Intercités ensemble) ; une gare dans une commune à
gare nationale de l'Insee (E107, Paris, Lyon et Marseille d'un seul tenant) n'ajoute rien ; « Vendôme -
Villiers-sur-Loir » (Insee : Villiers-sur-Loir, 41294 ; point SNCF : Vendôme, 41269) est traitée comme nationale.

Entrées, dans <data-raw> : Export_OpenData_SNCF_GTFS_NewTripId.zip (sha256 retenu dans sources.py et CLAUDE.md),
communes-100m.geojson.gz, services-nationales.csv (services-extrait.sql), services-calcul/gares-grandes-lignes.csv et
services-calcul/nationales-communes.csv (essai de /spec), services-calcul/ors-grandes-lignes.jsonl (H171) ; dans
<public/data> : communes.json (codes, départements, populations) et reperes.json (mairies).
Sortie : <data-raw>/services-gares.csv = uic, nom, lon, lat, tgv_jour, intercites_jour, code (les 61 gares).

Usage : python3 -I scripts/data/gares.py data-raw public/data  (s'arrête sur le premier contrôle qui échoue)
"""
import csv
import gzip
import hashlib
import io
import json
import math
import os
import re
import sys
import zipfile
from collections import Counter, defaultdict
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sources import ORS, ORS_SHA256, SNCF, SNCF_SHA256  # noqa: E402

DEBUT, JOURS = date(2026, 11, 23), 28  # H170
SEUIL_PAR_JOUR = 4  # H170 : arrêts de TGV et d'Intercités par jour
TGV = {'TGV INOUI', 'OUIGO', 'Lyria', 'ICE'}
VENDOME = '41269'  # H170 : traitée comme nationale
PLM = {'75056': ('75101', '75120'), '69123': ('69381', '69389'), '13055': ('13201', '13216')}
ILES = set('17004 22016 29082 29083 29084 29155 56009 56069 56085 56086 56087 56088 56114 56152 56241 85113'.split())  # H161
ATTENDU = {'gares de /spec': 239, 'communes à gare nationale': 105, 'gares ajoutées': 61, 'trajets': 103110}


def check(cond, msg):
    print(('  ok   ' if cond else '  ÉCHEC ') + msg)
    if not cond:
        raise SystemExit(1)


def ville(code):
    """Paris, Lyon, Marseille d'un seul tenant (arrondissements → code de la ville)."""
    for v, (a, b) in PLM.items():
        if a <= code <= b:
            return v
    return code


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        while chunk := f.read(1 << 20):
            h.update(chunk)
    return h.hexdigest()


def lignes_gtfs(z, nom):
    with z.open(nom) as f:
        yield from csv.DictReader(io.TextIOWrapper(f, encoding='utf-8-sig'))


def arrets(zip_path):
    """H170 : arrêts de TGV et d'Intercités sur 28 jours, par gare (UIC) ; noms et points des gares."""
    fenetre = {(DEBUT + timedelta(days=i)).strftime('%Y%m%d') for i in range(JOURS)}
    with zipfile.ZipFile(zip_path) as z:
        jours = Counter()
        for r in lignes_gtfs(z, 'calendar_dates.txt'):
            if r['exception_type'] == '1' and r['date'] in fenetre:
                jours[r['service_id']] += 1
        service = {r['trip_id']: r['service_id'] for r in lignes_gtfs(z, 'trips.txt')}
        noms, points = {}, {}
        for r in lignes_gtfs(z, 'stops.txt'):
            m = re.match(r'StopArea:OCE(\d+)$', r['stop_id'])
            if m:
                noms[m[1]], points[m[1]] = r['stop_name'], (float(r['stop_lon']), float(r['stop_lat']))
        t, ic = Counter(), Counter()
        for r in lignes_gtfs(z, 'stop_times.txt'):
            m = re.match(r'StopPoint:OCE(.+)-(\d+)$', r['stop_id'])
            if not m or (r['pickup_type'] != '0' and r['drop_off_type'] != '0'):
                continue
            n = jours.get(service.get(r['trip_id']), 0)
            if m[1] in TGV:
                t[m[2]] += n
            elif m[1].upper() == 'INTERCITES':
                ic[m[2]] += n
    return t, ic, noms, points


def dans_anneau(lon, lat, anneau):
    dedans = False
    j = len(anneau) - 1
    for i in range(len(anneau)):
        xi, yi, xj, yj = anneau[i][0], anneau[i][1], anneau[j][0], anneau[j][1]
        if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi) + xi:
            dedans = not dedans
        j = i
    return dedans


def contours(path):
    formes = []
    for f in json.load(gzip.open(path, 'rt', encoding='utf-8'))['features']:
        if f['properties']['code'].startswith('97'):
            continue
        g = f['geometry']
        polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        tous = [p for poly in polys for p in poly[0]]
        formes.append((f['properties']['code'], min(p[0] for p in tous), max(p[0] for p in tous),
                       min(p[1] for p in tous), max(p[1] for p in tous), polys))
    return formes


def commune_du_point(formes, lon, lat):
    """Commune dont le contour contient le point (trous exclus) ; None hors de la métropole."""
    for c, x0, x1, y0, y1, polys in formes:
        if x0 <= lon <= x1 and y0 <= lat <= y1 and any(
                dans_anneau(lon, lat, p[0]) and not any(dans_anneau(lon, lat, h) for h in p[1:]) for p in polys):
            return c
    return None


def km(a, b):
    """Distance à vol d'oiseau (sphère de 6 371 km) entre deux points (lon, lat) en degrés."""
    la1, ph1, la2, ph2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    return 2 * 6371 * math.asin(math.sqrt(math.sin((ph2 - ph1) / 2) ** 2 + math.cos(ph1) * math.cos(ph2) * math.sin((la2 - la1) / 2) ** 2))


def main():
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    raw, pub = sys.argv[1], sys.argv[2]
    calcul = os.path.join(raw, 'services-calcul')

    print('Fichiers retenus')
    check(sha256(os.path.join(raw, SNCF)) == SNCF_SHA256, f'{SNCF} : sha256 {SNCF_SHA256} (H170)')
    check(sha256(os.path.join(raw, ORS)) == ORS_SHA256, f'{ORS} : sha256 {ORS_SHA256} (H171)')

    print('Gares à TGV ou Intercités (H170)')
    t, ic, noms, points = arrets(os.path.join(raw, SNCF))
    formes = contours(os.path.join(raw, 'communes-100m.geojson.gz'))
    gares = {}
    for u in set(t) | set(ic):
        if u not in points or t[u] + ic[u] == 0:
            continue
        lon, lat = points[u]
        if not (41 < lat < 52 and -6 < lon < 10):
            continue
        code = commune_du_point(formes, lon, lat)
        if code:
            gares[u] = {'uic': u, 'nom': noms[u], 'lon': lon, 'lat': lat, 't': t[u], 'ic': ic[u], 'code': code}
    print(f'  gares françaises avec TGV ou Intercités : {len(gares)} ; avec TGV : {sum(g["t"] > 0 for g in gares.values())}')
    ref = {r['uic']: r for r in csv.DictReader(open(os.path.join(calcul, 'gares-grandes-lignes.csv'), encoding='utf-8'))}
    check(len(ref) == ATTENDU['gares de /spec'] and set(gares) == set(ref),
          f'mêmes gares que l\'essai de /spec ({len(gares)} recalculées, {len(ref)} dans gares-grandes-lignes.csv)')
    ecarts_arrets = [u for u in gares if abs(gares[u]['t'] / JOURS - float(ref[u]['tgv_jour'])) > 0.005 + 1e-9
                     or abs(gares[u]['ic'] / JOURS - float(ref[u]['intercites_jour'])) > 0.005 + 1e-9]
    check(not ecarts_arrets, f'arrêts par jour égaux au centième près pour les {len(ref)} gares (écarts : {ecarts_arrets[:5]})')
    ecarts_communes = [u for u in gares if gares[u]['code'] != ref[u]['code']]
    check(not ecarts_communes, f'communes égales pour les {len(ref)} gares (écarts : {ecarts_communes[:5]})')

    print('Communes à gare nationale (E107 de l\'Insee)')
    brutes = [r['code'] for r in csv.DictReader(open(os.path.join(raw, 'services-nationales.csv'), encoding='utf-8'))]
    nat = {ville(c) for c in brutes}
    nat_ref = {r['dest'] for r in csv.DictReader(open(os.path.join(calcul, 'nationales-communes.csv'), encoding='utf-8'))}
    print(f'  services-nationales.csv : {len(brutes)} codes, {len(nat)} communes une fois Paris, Lyon et Marseille réunies')
    check(nat == nat_ref and len(nat) == ATTENDU['communes à gare nationale'],
          f'égales à nationales-communes.csv de /spec ({len(nat_ref)} communes ; en plus : {sorted(nat - nat_ref)}, en moins : {sorted(nat_ref - nat)})')

    print('Gares ajoutées (au moins 4 arrêts par jour, hors communes à gare nationale, Vendôme nationale)')
    nationales = nat | {VENDOME}
    gardees = sorted((g for g in gares.values() if g['t'] + g['ic'] >= SEUIL_PAR_JOUR * JOURS and g['code'] not in nationales),
                     key=lambda g: g['uic'])
    ors = [json.loads(l) for l in open(os.path.join(raw, ORS), encoding='utf-8')]
    uic_ors = {r['uic'] for r in ors}
    check(len(gardees) == ATTENDU['gares ajoutées'], f'{len(gardees)} gares ajoutées (attendu {ATTENDU["gares ajoutées"]})')
    check({g['uic'] for g in gardees} == uic_ors,
          f'mêmes UIC que ors-grandes-lignes.jsonl ({len(uic_ors)} gares ; en plus : {sorted({g["uic"] for g in gardees} - uic_ors)}, '
          f'en moins : {sorted(uic_ors - {g["uic"] for g in gardees})})')

    print('Trajets d\'openrouteservice (H171)')
    d = json.load(open(os.path.join(pub, 'communes.json'), encoding='utf-8'))
    i_code, i_dep, i_pop = (d['champs'].index(k) for k in ('code', 'dep', 'population'))
    rep = json.load(open(os.path.join(pub, 'reperes.json'), encoding='utf-8'))['reperes']
    mairie = {c[i_code]: (p[0], p[1]) for c, p in zip(d['communes'], rep)}
    attendues = {c[i_code] for c in d['communes']
                 if c[i_dep] not in ('2A', '2B') and c[i_code] not in ILES and (c[i_pop] or 0) > 0}
    trajets = defaultdict(dict)
    total, manquants, doubles = 0, [], 0
    for r in ors:
        if len(r['codes']) != len(r['minutes']):
            check(False, f'{r["nom"]} lot {r["lot"]} : un temps par commune')
        for c, m in zip(r['codes'], r['minutes']):
            total += 1
            doubles += r['uic'] in trajets[c]
            trajets[c][r['uic']] = m
            if m is None:
                manquants.append((c, r['nom']))
    print(f'  {total} trajets, {len(trajets)} communes ; {len(attendues)} communes attendues (hors Corse, îles sans pont et population 0)')
    check(total == ATTENDU['trajets'] and doubles == 0, f'{total} trajets (attendu {ATTENDU["trajets"]}), aucun en double ({doubles})')
    sans3 = sorted(c for c in attendues if len(trajets.get(c, {})) != 3)
    check(not sans3, f'chaque commune attendue a ses 3 trajets ({len(sans3)} sans : {sans3[:5]})')
    check(not manquants, f'aucun trajet sans temps ({len(manquants)} : {manquants[:5]})')
    exclues = sorted(c for c in trajets if c not in attendues)
    print(f'  communes avec des trajets hors des attendues (population 0, non lues ensuite) : {len(exclues)} {exclues}')
    pos = {g['uic']: (g['lon'], g['lat']) for g in gardees}
    autres = [c for c in trajets if set(trajets[c]) != set(sorted(pos, key=lambda u: km(mairie[c], pos[u]))[:3])]
    print(f'  information : communes dont les 3 gares ne sont pas les 3 plus proches de la mairie à vol d\'oiseau : {len(autres)} {autres[:5]}')

    sortie = os.path.join(raw, 'services-gares.csv')
    with open(sortie, 'w', newline='', encoding='utf-8') as s:
        w = csv.writer(s)
        w.writerow(['uic', 'nom', 'lon', 'lat', 'tgv_jour', 'intercites_jour', 'code'])
        for g in gardees:
            w.writerow([g['uic'], g['nom'], g['lon'], g['lat'], round(g['t'] / JOURS, 2), round(g['ic'] / JOURS, 2), g['code']])
    relu = list(csv.DictReader(open(sortie, encoding='utf-8')))
    check(len(relu) == ATTENDU['gares ajoutées'] and {r['uic'] for r in relu} == uic_ors, f'écrit et relu : {sortie} ({len(relu)} gares)')


if __name__ == '__main__':
    main()
