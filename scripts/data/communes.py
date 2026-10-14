"""Fichiers servis par le site : public/data/communes.json et public/data/achat.json ; formes à 100 m dans data-raw/
(tuiles : tuiles.py).

Jointure toujours par code INSEE (jamais par nom). Communes de métropole du COG 2025 (TYPECOM = COM, hors 97x) :
Paris, Lyon et Marseille y sont déjà d'un seul tenant ; leurs 45 arrondissements (ARM) sont exclus des formes,
et leur loyer au m² est la moyenne simple de ceux des arrondissements (D10), pour les appartements comme pour les maisons.

Prix d'achat (tranche immobilier, D5, D8, H67, R24) : statistiques DVF d'Etalab (stats_whole_period.csv), médiane au m²
des ventes de la commune pour le bien s'il y en a au moins 5, sinon celle de son intercommunalité (code_parent) si elle
en compte au moins 5, sinon inconnu ; Moselle, Bas-Rhin et Haut-Rhin : inconnu (ventes non publiées). Paris, Lyon et
Marseille : moyenne simple des prix de leurs arrondissements qui en ont un, « secteur » si l'un d'eux l'est.

Prérequis : python3 scripts/data/sources.py puis python3 scripts/data/mer.py
Usage : python3 scripts/data/communes.py  (s'arrête sur le premier contrôle qui échoue)
"""
import csv
import gzip
import hashlib
import json
import os

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
RAW = os.path.join(ROOT, 'data-raw')
OUT = os.path.join(ROOT, 'public', 'data')

PLM = {'75056': '751', '69123': '6938', '13055': '132'}  # commune → préfixe des codes d'arrondissement
DECIMALES = 4  # décimales gardées dans les formes (≈ 10 m)
# Colonnes ajoutées à la fin (immobilier) : le site lit les lignes par position.
CHAMPS = ['code', 'nom', 'dep', 'population', 'loyer_m2', 'estimation_propre', 'mer_km',
          'loyer_maison_m2', 'estimation_propre_maison']
CHAMPS_ACHAT = ['code', 'appartement_m2', 'appartement_source', 'maison_m2', 'maison_source']
BIENS = ('appartement', 'maison')
ALSACE_MOSELLE = ('57', '67', '68')
MIN_VENTES = 5
# Comptes mesurés le 2026-10-14 (fichier DVF de juillet 2026), hors Alsace-Moselle et hors Paris, Lyon, Marseille.
# Un écart de plus de 5 % arrête le script (condition d'arrêt de la tâche 0) ; au moins 5 communes d'écart permises.
MESURES = {'appartement': {'commune': 6272, 'secteur': 24793, 'inconnu-secteur': 2073},
           'maison': {'commune': 30912, 'secteur': 2225, 'inconnu-secteur': 1}}


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


def loyers(fichier):
    """Carte des loyers : code INSEE → (€/m², estimation propre). TYPPRED : commune, maille ou EPCI (maisons)."""
    with open(os.path.join(RAW, fichier), encoding='latin-1') as f:
        rows = list(csv.DictReader(f, delimiter=';'))
    return {r['INSEE_C']: (float(r['loypredm2'].replace(',', '.')), r['TYPPRED'] == 'commune') for r in rows}


def loyer_commune(loy, code):
    """Loyer d'une commune ; Paris, Lyon, Marseille : moyenne simple des arrondissements, propre si tous le sont (D10)."""
    if code in PLM:
        arr = [v for k, v in loy.items() if k.startswith(PLM[code])]
        m2 = sum(v[0] for v in arr) / len(arr) if arr else None
        return m2, bool(arr) and all(v[1] for v in arr)
    return loy.get(code, (None, False))


def dvf():
    """Statistiques DVF : lignes commune (arrondissements compris) et epci, et l'empreinte notée par sources.py."""
    path = os.path.join(RAW, 'stats_whole_period.csv')
    info = json.load(open(path + '.info.json'))
    sha = hashlib.sha256()
    with open(path, 'rb') as f:
        while chunk := f.read(1 << 20):
            sha.update(chunk)
    print(f"DVF : stats_whole_period.csv, Last-Modified {info['last_modified']}, téléchargé le {info['telecharge_le']},"
          f" {info['octets']} octets, sha256 {info['sha256']}")
    check(sha.hexdigest() == info['sha256'], 'DVF : le fichier est bien celui téléchargé (empreinte identique)')
    com, epci = {}, {}
    with open(path, encoding='utf-8') as f:
        for r in csv.DictReader(f):
            if r['echelle_geo'] == 'commune':
                com[r['code_geo']] = r
            elif r['echelle_geo'] == 'epci':
                epci[r['code_geo']] = r
    return com, epci


def nombre(x):
    v = float(x)
    return int(v) if v.is_integer() else v


def achat_commune(com, epci, code, bien):
    """R24 : (€/m², source) d'une commune pour un bien, hors Alsace-Moselle et hors Paris, Lyon, Marseille."""
    r = com.get(code)
    if r is None:
        return None, 'inconnu-secteur'
    if int(r[f'nb_ventes_whole_{bien}'] or 0) >= MIN_VENTES:
        return nombre(r[f'med_prix_m2_whole_{bien}']), 'commune'
    e = epci.get(r['code_parent'])
    if e is not None and int(e[f'nb_ventes_whole_{bien}'] or 0) >= MIN_VENTES:
        return nombre(e[f'med_prix_m2_whole_{bien}']), 'secteur'
    return None, 'inconnu-secteur'


def achat(com, epci, code, dep, bien):
    if dep in ALSACE_MOSELLE:
        return None, 'inconnu-alsace-moselle'
    if code in PLM:  # H67
        arr = [achat_commune(com, epci, k, bien) for k in sorted(com) if len(k) == 5 and k.startswith(PLM[code])]
        connus = [a for a in arr if a[0] is not None]
        if not connus:
            return None, 'inconnu-secteur'
        return round(sum(a[0] for a in connus) / len(connus), 2), 'secteur' if any(a[1] == 'secteur' for a in connus) else 'commune'
    return achat_commune(com, epci, code, bien)


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
    loy = loyers('pred-app-mef-dhup.csv')
    loy_mai = loyers('pred-mai-mef-dhup.csv')
    ventes, epci = dvf()
    geo = {c['code']: c for c in json.load(open(os.path.join(RAW, 'communes-centre.json')))}
    with open(os.path.join(RAW, 'mer-km.csv')) as f:
        mer = {r['code']: float(r['km']) for r in csv.DictReader(f)}

    codes = sorted(com)
    rows = []
    achats = []
    for code in codes:
        m2, propre = loyer_commune(loy, code)
        m2_mai, propre_mai = loyer_commune(loy_mai, code)
        pop = geo.get(code, {}).get('population')
        rows.append([code, com[code]['LIBELLE'], com[code]['DEP'], pop,
                     None if m2 is None else round(m2, 4), propre,
                     None if code not in mer else round(mer[code], 2),
                     None if m2_mai is None else round(m2_mai, 4), propre_mai])
        ligne = [code]
        for bien in BIENS:
            ligne += achat(ventes, epci, code, com[code]['DEP'], bien)
        achats.append(ligne)

    print('Contrôles')
    check(len(rows) == 34746, f'{len(rows)} communes de métropole (attendu 34 746 = COM du COG 2025 hors 97x)')
    for i, champ in ((3, 'population'), (4, 'loyer'), (6, 'distance à la mer'), (7, 'loyer de maison')):
        manque = [r[0] for r in rows if r[i] is None]
        check(not manque, f'0 commune sans {champ} (manquent : {len(manque)} {manque[:5]})')
    arr_counts = {c: sum(1 for k in loy if k.startswith(p)) for c, p in PLM.items()}
    check(arr_counts == {'75056': 20, '69123': 9, '13055': 16}, f'arrondissements moyennés : {arr_counts}')

    by = {r[0]: r for r in rows}
    bx = by['33063']
    check(round(bx[4] * 52) == 832, f'Bordeaux (33063) : {round(bx[4] * 52)} € pour 52 m² (attendu 832)')
    check(f'{bx[4]:.1f}' == '16.0', f'Bordeaux : {bx[4]:.1f} €/m² (attendu 16,0)')
    check(round(bx[6]) == 39, f'Bordeaux : {bx[6]} km, affiché {round(bx[6])} km (attendu 39, depuis la mairie : D18)')
    lr = by['17300']
    check(lr[6] < 1, f'La Rochelle (17300) : {lr[6]} km (attendu « moins d\'1 km », D18)')
    for code, nom in (('40231', 'Port-de-Lanne'), ('40256', "Saint-Étienne-d'Orthe"), ('64502', 'Sames')):
        check(by[code][6] > 2, f'{nom} ({code}) : {by[code][6]} km (attendu au-delà de 2 km, Adour corrigé)')
    print(f"  info Paris : {by['75056'][4] * 52:.0f} € pour 52 m², estimation propre {by['75056'][5]},"
          f" {by['75056'][3]} habitants ; estimations propres : {sum(1 for r in rows if r[5])} communes")
    print(f"  info loyer des maisons : {sum(1 for r in rows if r[7] is None)} commune sans loyer,"
          f" {sum(1 for r in rows if r[8])} estimations propres ; Bordeaux {bx[7]} €/m², Paris {by['75056'][7]} €/m²")

    print("Contrôles des prix d'achat")
    ach = {a[0]: a for a in achats}
    check(len(achats) == len(rows) and [a[0] for a in achats] == codes, f'{len(achats)} lignes, dans l\'ordre des codes de communes.json')
    arr_dvf = {c: sum(1 for k in ventes if len(k) == 5 and k.startswith(p)) for c, p in PLM.items()}
    check(arr_dvf == {'75056': 20, '69123': 9, '13055': 16}, f'arrondissements dans le fichier DVF : {arr_dvf} (45, H67)')
    hors = [a for a in achats if a[0] not in PLM and by[a[0]][2] not in ALSACE_MOSELLE]
    for j, bien in enumerate(BIENS):
        n = {s: sum(1 for a in hors if a[2 + 2 * j] == s) for s in MESURES[bien]}
        check(sum(n.values()) == len(hors), f'{bien} : chaque commune a une source ({len(hors)} hors Alsace-Moselle et Paris, Lyon, Marseille)')
        for s, ref in MESURES[bien].items():
            check(abs(n[s] - ref) <= max(0.05 * ref, 5), f'{bien}, {s} : {n[s]} communes (mesuré : {ref}, écart permis 5 %)')
    am = [a for a in achats if by[a[0]][2] in ALSACE_MOSELLE]
    check(len(am) == 1605 and all(a[2] == a[4] == 'inconnu-alsace-moselle' for a in am),
          f'Alsace-Moselle : {len(am)} communes inconnu-alsace-moselle pour les deux biens (attendu 1 605)')
    check(ach['33063'][1:] == [4427, 'commune', 5188, 'commune'], f"Bordeaux (33063) : {ach['33063'][1:]} (attendu 4 427 et 5 188 €/m², commune)")
    check(ach['33487'][1:3] == [3844, 'secteur'], f"Saint-Vincent-de-Paul (33487) : {ach['33487'][1:3]} (attendu 3 844 €/m², Bordeaux Métropole)")
    for code in PLM:
        check(ach[code][1] is not None and ach[code][3] is not None, f'{by[code][1]} ({code}) : {ach[code][1:]}')

    os.makedirs(OUT, exist_ok=True)
    index = {code: i for i, code in enumerate(codes)}
    with open(os.path.join(OUT, 'communes.json'), 'w', encoding='utf-8') as f:
        json.dump({'champs': CHAMPS, 'communes': rows}, f, ensure_ascii=False, separators=(',', ':'))
    # Servi avec X-Robots-Tag: noindex (public/_headers, D9) : condition du fichier des ventes.
    with open(os.path.join(OUT, 'achat.json'), 'w', encoding='utf-8') as f:
        json.dump({'champs': CHAMPS_ACHAT, 'communes': achats}, f, ensure_ascii=False, separators=(',', ':'))

    # Tâche 7 : les formes ne sont pas servies telles quelles ; elles deviennent les tuiles (scripts/data/tuiles.py).
    src = json.load(gzip.open(os.path.join(RAW, 'communes-100m.geojson.gz')))
    feats = [ft for ft in src['features'] if 'commune' not in ft['properties']]  # sans les arrondissements
    fcodes = {ft['properties']['code'] for ft in feats}
    metro_f = {c for c in fcodes if c[:2] not in ('97', '98')}  # sans l'outre-mer (DROM et collectivités)
    check(metro_f == set(codes), f'formes 100m : 0 code orphelin (en trop : {len(metro_f - set(codes))},'
                                 f' sans forme : {len(set(codes) - metro_f)})')
    out = [{'type': 'Feature', 'id': index[ft['properties']['code']], 'properties': {},
            'geometry': round_coords(ft['geometry'], DECIMALES)}
           for ft in feats if ft['properties']['code'] in index]
    out.sort(key=lambda ft: ft['id'])
    with open(os.path.join(RAW, 'formes-100m.json'), 'w') as f:
        json.dump({'type': 'FeatureCollection', 'features': out}, f, separators=(',', ':'))

    print('Fichiers')
    for name in sorted(os.listdir(OUT)):
        p = os.path.join(OUT, name)
        raw = open(p, 'rb').read()
        print(f'  {name} : {len(raw) / 1e6:.2f} Mo brut, {len(gzip.compress(raw, 9)) / 1e6:.2f} Mo compressé (gzip)')


if __name__ == '__main__':
    main()
