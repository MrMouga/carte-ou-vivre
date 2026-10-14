"""Fichiers servis par le site : public/data/communes.json et public/data/achat.json ; formes à 100 m dans data-raw/
(tuiles : tuiles.py).

Jointure toujours par code INSEE (jamais par nom). Communes de métropole du COG 2025 (TYPECOM = COM, hors 97x) :
Paris, Lyon et Marseille y sont déjà d'un seul tenant ; leurs 45 arrondissements (ARM) sont exclus des formes,
et leur loyer au m² est la moyenne simple de ceux des arrondissements (D10), pour les appartements comme pour les maisons.

Prix d'achat (tranche immobilier, D5 révisée par Vincent le 2026-10-14, D8, H67, R24) : statistiques DVF d'Etalab.
Pour la commune et le bien : (1) au moins 30 ventes de 2023-01 à 2025-12 → médiane approchée sur ces trois ans
(stats_dvf.csv, mensuel : médiane pondérée des médianes mensuelles) ; (2) sinon au moins 5 ventes de 2021 à 2025 →
médiane exacte (stats_whole_period.csv) ; (3) sinon la même chose pour son intercommunalité (code_parent), « secteur » ;
sinon inconnu. Un prix sous PRIX_ACHAT_MIN_M2 (300 €/m², seuil de Vincent du 2026-10-14) n'est pas crédible (ventes en
bloc) : il n'est pas retenu, on passe au niveau suivant. Moselle, Bas-Rhin et Haut-Rhin : inconnu (ventes non publiées). Paris, Lyon et Marseille : la règle par
arrondissement, puis moyenne simple de ceux qui ont un prix, « secteur » si l'un d'eux l'est (H67).

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
# Règle de Vincent (2026-10-14) : au moins 30 ventes du bien sur la fenêtre fixe 2023-01 à 2025-12 → prix récent.
RECENT = ('2023-01', '2025-12')
MIN_VENTES_RECENTES = 30
# Seuil de Vincent (2026-10-14, reprise de la tâche 1 d'immobilier) : un prix d'achat au m² sous 300 € (Guérigny 21 €/m²,
# Civray 26 €/m² : ventes en bloc) n'est retenu à aucun niveau ; l'achat seulement, pas les loyers.
PRIX_ACHAT_MIN_M2 = 300
# Comptes mesurés le 2026-10-14 (fichier DVF de juillet 2026), hors Alsace-Moselle et hors Paris, Lyon, Marseille.
# Un écart de plus de 5 % arrête le script (condition d'arrêt de la tâche 0) ; au moins 5 communes d'écart permises.
# Remesurés avec le seuil de 300 €/m² (2026-10-14, 18:20) ; avant le seuil : appartement 6 272 / 24 793 / 2 073,
# maison 30 912 / 2 225 / 1 (le seuil fait passer 122 communes à « inconnu-secteur » en appartement, +5,9 %).
MESURES = {'appartement': {'commune': 6265, 'secteur': 24678, 'inconnu-secteur': 2195},
           'maison': {'commune': 30878, 'secteur': 2259, 'inconnu-secteur': 1}}


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


def empreinte(nom):
    """Vérifie que le fichier DVF présent est celui noté par sources.py (date, Last-Modified, sha256)."""
    path = os.path.join(RAW, nom)
    info = json.load(open(path + '.info.json'))
    sha = hashlib.sha256()
    with open(path, 'rb') as f:
        while chunk := f.read(1 << 20):
            sha.update(chunk)
    print(f"DVF : {nom}, Last-Modified {info['last_modified']}, téléchargé le {info['telecharge_le']},"
          f" {info['octets']} octets, sha256 {info['sha256']}")
    check(sha.hexdigest() == info['sha256'], f'DVF : {nom} est bien celui téléchargé (empreinte identique)')
    return path


def dvf():
    """Statistiques DVF sur toute la période : lignes commune (arrondissements compris) et epci."""
    com, epci = {}, {}
    with open(empreinte('stats_whole_period.csv'), encoding='utf-8') as f:
        for r in csv.DictReader(f):
            if r['echelle_geo'] == 'commune':
                com[r['code_geo']] = r
            elif r['echelle_geo'] == 'epci':
                epci[r['code_geo']] = r
    return com, epci


def dvf_mois():
    """Statistiques DVF mensuelles, fenêtre RECENT seulement : (échelle, code) → bien → [(médiane du mois, ventes)]."""
    mois = {}
    lignes, doublons = {}, 0
    with open(empreinte('stats_dvf.csv'), encoding='utf-8') as f:
        lecteur = csv.reader(f)
        tete = next(lecteur)
        i_code, i_mois, i_ech = tete.index('code_geo'), tete.index('annee_mois'), tete.index('echelle_geo')
        cols = {b: (tete.index(f'nb_ventes_{b}'), tete.index(f'med_prix_m2_{b}')) for b in BIENS}
        for r in lecteur:
            if r[i_ech] not in ('commune', 'epci') or not RECENT[0] <= r[i_mois] <= RECENT[1]:
                continue
            # Une intercommunalité sur plusieurs départements a une ligne par département, aux chiffres identiques :
            # on n'en garde qu'une par mois (sinon ses ventes comptent deux ou six fois).
            cle = (r[i_ech], r[i_code], r[i_mois])
            valeurs = tuple(r[i] for c in cols.values() for i in c)
            if cle in lignes:
                doublons += 1
                if lignes[cle] != valeurs:
                    check(False, f'fichier mensuel : deux lignes différentes pour {cle}')
                continue
            lignes[cle] = valeurs
            par_bien = mois.setdefault((r[i_ech], r[i_code]), {b: [] for b in BIENS})
            for b, (i_nb, i_med) in cols.items():
                if r[i_nb] and int(r[i_nb]) > 0:
                    par_bien[b].append((nombre(r[i_med]), int(r[i_nb])))
    print(f'  info fichier mensuel : {doublons} lignes en double ignorées (intercommunalités sur plusieurs départements)')
    vus = {m for _, _, m in lignes}
    check(len(vus) == 36, f'fichier mensuel : {len(vus)} mois dans la fenêtre {RECENT[0]} à {RECENT[1]} (attendu 36)')
    return mois


def mediane_ponderee(mois):
    """Médiane approchée : mois triés par médiane, médiane du premier mois où le cumul des ventes atteint la moitié."""
    total = sum(n for _, n in mois)
    cumul = 0
    for med, n in sorted(mois):
        cumul += n
        if 2 * cumul >= total:
            return med


def nombre(x):
    v = float(x)
    return int(v) if v.is_integer() else v


def prix_ligne(ligne, mois, bien):
    """Règle 1 puis 2 sur une ligne (commune ou epci) : (€/m², '1' | '2') ou None ; un prix sous le seuil est sauté."""
    m = (mois or {}).get(bien, [])
    if sum(n for _, n in m) >= MIN_VENTES_RECENTES:
        p = mediane_ponderee(m)
        if p >= PRIX_ACHAT_MIN_M2:
            return p, '1'
    if ligne is not None and int(ligne[f'nb_ventes_whole_{bien}'] or 0) >= MIN_VENTES:
        p = nombre(ligne[f'med_prix_m2_whole_{bien}'])
        if p >= PRIX_ACHAT_MIN_M2:
            return p, '2'
    return None


def achat_commune(d, code, bien):
    """R24 révisée par Vincent (2026-10-14) : (€/m², source, règle) d'une commune pour un bien, hors Alsace-Moselle
    et hors Paris, Lyon, Marseille. Règle 1 : prix récent ; 2 : toute la période ; 3-1, 3-2 : la même chose pour
    l'intercommunalité ; inconnu."""
    com, epci, mois = d
    r = com.get(code)
    p = prix_ligne(r, mois.get(('commune', code)), bien)
    if p:
        return p[0], 'commune', p[1]
    parent = r['code_parent'] if r else None
    p = prix_ligne(epci.get(parent), mois.get(('epci', parent)), bien) if parent in epci else None
    if p:
        return p[0], 'secteur', '3-' + p[1]
    return None, 'inconnu-secteur', 'inconnu'


def achat(d, code, dep, bien):
    if dep in ALSACE_MOSELLE:
        return None, 'inconnu-alsace-moselle', 'alsace-moselle'
    if code in PLM:  # H67, à la lettre : arrondissements estimés compris
        arr = [achat_commune(d, k, bien) for k in sorted(d[0]) if len(k) == 5 and k.startswith(PLM[code])]
        connus = [a for a in arr if a[0] is not None]
        if not connus:
            return None, 'inconnu-secteur', 'inconnu'
        return (round(sum(a[0] for a in connus) / len(connus), 2),
                'secteur' if any(a[1] == 'secteur' for a in connus) else 'commune', 'H67')
    return achat_commune(d, code, bien)


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
    donnees_achat = (ventes, epci, dvf_mois())
    regles = {b: {} for b in BIENS}  # code → règle appliquée (1, 2, 3-1, 3-2, inconnu, H67, alsace-moselle)
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
            prix_, source, regle = achat(donnees_achat, code, com[code]['DEP'], bien)
            ligne += [prix_, source]
            regles[bien][code] = regle
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
    bas = [(a[0], a[1 + 2 * j]) for a in achats for j in range(2) if a[1 + 2 * j] is not None and a[1 + 2 * j] < PRIX_ACHAT_MIN_M2]
    check(not bas, f'aucun prix d\'achat retenu sous {PRIX_ACHAT_MIN_M2} €/m² (trouvés : {len(bas)} {bas[:5]})')
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
    for j, bien in enumerate(BIENS):
        n = {r: sum(1 for a in hors if regles[bien][a[0]] == r) for r in ('1', '2', '3-1', '3-2', 'inconnu')}
        print(f'  info {bien}, par règle (1 récent, 2 toute la période, 3 intercommunalité) : {n}')
    check(ach['33063'][1:] == [4233, 'commune', 5067, 'commune'] and regles['appartement']['33063'] == regles['maison']['33063'] == '1',
          f"Bordeaux (33063) : {ach['33063'][1:]}, règle 1 (attendu 4 233 et 5 067 €/m², prix récent 2023-2025)")
    check(ach['33487'][1:5] == [3700, 'secteur', 2487, 'commune'] and regles['maison']['33487'] == '2',
          f"Saint-Vincent-de-Paul (33487) : {ach['33487'][1:]} (attendu appartement 3 700 €/m², Bordeaux Métropole récent ;"
          f" maison 2 487 €/m², 24 ventes récentes : règle 2)")
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
