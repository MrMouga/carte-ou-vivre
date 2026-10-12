"""Fichier servi par le site : public/data/communes.json ; formes aux deux finesses dans data-raw/ (tuiles : tuiles.py).

Jointure toujours par code INSEE (jamais par nom). Communes de métropole du COG 2025 (TYPECOM = COM, hors 97x) :
Paris, Lyon et Marseille y sont déjà d'un seul tenant ; leurs 45 arrondissements (ARM) sont exclus des formes,
et leur loyer au m² est la moyenne simple de ceux des arrondissements (D10).

Prérequis : python3 scripts/data/sources.py puis python3 scripts/data/mer.py
Usage : python3 scripts/data/communes.py  (s'arrête sur le premier contrôle qui échoue)
"""
import csv
import gzip
import json
import os

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
RAW = os.path.join(ROOT, 'data-raw')
OUT = os.path.join(ROOT, 'public', 'data')

PLM = {'75056': '751', '69123': '6938', '13055': '132'}  # commune → préfixe des codes d'arrondissement
FINESSES = {'1000m': 4, '100m': 4}  # finesse Etalab → décimales gardées (≈ 10 m)
CHAMPS = ['code', 'nom', 'dep', 'population', 'loyer_m2', 'estimation_propre', 'mer_km']


def check(cond, msg):
    print(('  ok   ' if cond else '  ÉCHEC ') + msg)
    if not cond:
        raise SystemExit(1)


def cog():
    with open(os.path.join(RAW, 'v_commune_2025.csv'), encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    metro = [r for r in rows if not r['DEP'].startswith('97')]
    com = {r['COM']: r for r in metro if r['TYPECOM'] == 'COM'}
    n = {t: sum(1 for r in metro if r['TYPECOM'] == t) for t in ('COM', 'ARM', 'COMD', 'COMA')}
    print(f"COG 2025, métropole et Corse : {n['COM']} communes (COM, dont Paris, Lyon et Marseille d'un seul tenant) ;"
          f" exclus : {n['ARM']} arrondissements (ARM), {n['COMD']} communes déléguées, {n['COMA']} communes associées")
    return com


def loyers():
    with open(os.path.join(RAW, 'pred-app-mef-dhup.csv'), encoding='latin-1') as f:
        rows = list(csv.DictReader(f, delimiter=';'))
    return {r['INSEE_C']: (float(r['loypredm2'].replace(',', '.')), r['TYPPRED'] == 'commune') for r in rows}


def round_coords(geom, nd):
    """Arrondit les coordonnées et retire les points consécutifs devenus identiques (un anneau garde ≥ 4 points)."""
    def ring(pts):
        out = []
        for x, y in pts:
            p = [round(x, nd), round(y, nd)]
            if not out or p != out[-1]:
                out.append(p)
        return out if len(out) >= 4 else [[round(x, nd), round(y, nd)] for x, y in pts]

    def poly(rings):
        return [ring(r) for r in rings]

    coords = geom['coordinates']
    return {'type': geom['type'], 'coordinates': poly(coords) if geom['type'] == 'Polygon' else [poly(p) for p in coords]}


def main():
    com = cog()
    loy = loyers()
    geo = {c['code']: c for c in json.load(open(os.path.join(RAW, 'communes-centre.json')))}
    with open(os.path.join(RAW, 'mer-km.csv')) as f:
        mer = {r['code']: float(r['km']) for r in csv.DictReader(f)}

    codes = sorted(com)
    rows = []
    for code in codes:
        if code in PLM:
            arr = [v for k, v in loy.items() if k.startswith(PLM[code])]
            m2 = sum(v[0] for v in arr) / len(arr) if arr else None
            propre = bool(arr) and all(v[1] for v in arr)
        else:
            m2, propre = loy.get(code, (None, False))
        pop = geo.get(code, {}).get('population')
        rows.append([code, com[code]['LIBELLE'], com[code]['DEP'], pop,
                     None if m2 is None else round(m2, 4), propre,
                     None if code not in mer else round(mer[code], 2)])

    print('Contrôles')
    check(len(rows) == 34746, f'{len(rows)} communes de métropole (attendu 34 746 = COM du COG 2025 hors 97x)')
    for i, champ in ((3, 'population'), (4, 'loyer'), (6, 'distance à la mer')):
        manque = [r[0] for r in rows if r[i] is None]
        check(not manque, f'0 commune sans {champ} (manquent : {len(manque)} {manque[:5]})')
    arr_counts = {c: sum(1 for k in loy if k.startswith(p)) for c, p in PLM.items()}
    check(arr_counts == {'75056': 20, '69123': 9, '13055': 16}, f'arrondissements moyennés : {arr_counts}')

    by = {r[0]: r for r in rows}
    bx = by['33063']
    check(round(bx[4] * 52) == 832, f'Bordeaux (33063) : {round(bx[4] * 52)} € pour 52 m² (attendu 832)')
    check(f'{bx[4]:.1f}' == '16.0', f'Bordeaux : {bx[4]:.1f} €/m² (attendu 16,0)')
    check(round(bx[6]) == 40, f'Bordeaux : {bx[6]} km, affiché {round(bx[6])} km (attendu 40)')
    lr = by['17300']
    check(0.9 < lr[6] < 1.5, f'La Rochelle (17300) : {lr[6]} km (plan : entre 1 et 1,5 km ; voir progress.md, décision La Rochelle)')
    for code, nom in (('40231', 'Port-de-Lanne'), ('40256', "Saint-Étienne-d'Orthe"), ('64502', 'Sames')):
        check(by[code][6] > 2, f'{nom} ({code}) : {by[code][6]} km (attendu au-delà de 2 km, Adour corrigé)')
    print(f"  info Paris : {by['75056'][4] * 52:.0f} € pour 52 m², estimation propre {by['75056'][5]},"
          f" {by['75056'][3]} habitants ; estimations propres : {sum(1 for r in rows if r[5])} communes")

    os.makedirs(OUT, exist_ok=True)
    index = {code: i for i, code in enumerate(codes)}
    with open(os.path.join(OUT, 'communes.json'), 'w', encoding='utf-8') as f:
        json.dump({'champs': CHAMPS, 'communes': rows}, f, ensure_ascii=False, separators=(',', ':'))

    for finesse, nd in FINESSES.items():
        src = json.load(gzip.open(os.path.join(RAW, f'communes-{finesse}.geojson.gz')))
        feats = [ft for ft in src['features'] if 'commune' not in ft['properties']]  # sans les arrondissements
        fcodes = {ft['properties']['code'] for ft in feats}
        metro_f = {c for c in fcodes if c[:2] not in ('97', '98')}  # sans l'outre-mer (DROM et collectivités)
        check(metro_f == set(codes), f'formes {finesse} : 0 code orphelin (en trop : {len(metro_f - set(codes))},'
                                     f' sans forme : {len(set(codes) - metro_f)})')
        out = [{'type': 'Feature', 'id': index[ft['properties']['code']], 'properties': {},
                'geometry': round_coords(ft['geometry'], nd)}
               for ft in feats if ft['properties']['code'] in index]
        out.sort(key=lambda ft: ft['id'])
        # Tâche 7 : aucune forme n'est servie telle quelle ; le 100 m devient les tuiles (scripts/data/tuiles.py).
        dest = RAW
        with open(os.path.join(dest, f'formes-{finesse}.json'), 'w') as f:
            json.dump({'type': 'FeatureCollection', 'features': out}, f, separators=(',', ':'))

    print('Fichiers')
    for name in sorted(os.listdir(OUT)):
        p = os.path.join(OUT, name)
        raw = open(p, 'rb').read()
        print(f'  {name} : {len(raw) / 1e6:.2f} Mo brut, {len(gzip.compress(raw, 9)) / 1e6:.2f} Mo compressé (gzip)')


if __name__ == '__main__':
    main()
