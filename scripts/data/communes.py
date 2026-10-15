"""Fichiers servis par le site : public/data/communes.json et public/data/achat.json ; formes à 100 m dans data-raw/
(tuiles : tuiles.py).

Jointure toujours par code INSEE (jamais par nom). Communes de métropole du COG 2025 (TYPECOM = COM, hors 97x) :
Paris, Lyon et Marseille y sont déjà d'un seul tenant ; leurs 45 arrondissements (ARM) sont exclus des formes,
et leur loyer au m² est la moyenne simple de ceux des arrondissements (D10), pour les appartements comme pour les maisons.

Prix d'achat (tranche immobilier, D5 révisée par Vincent le 2026-10-14, D8, H67, R24) : statistiques DVF d'Etalab.
Pour la commune et le bien : (1) au moins 30 ventes de 2023-01 à 2025-12 → médiane approchée sur ces trois ans
(stats_dvf.csv, mensuel : médiane pondérée des médianes mensuelles) ; (2) sinon au moins 5 ventes de 2021 à 2025 →
médiane exacte (stats_whole_period.csv) ; (3) sinon la même chose pour son intercommunalité (code_parent), « secteur » ;
sinon (D12 d'immobilier, Vincent le 2026-10-15) la même règle sur le prix tous biens (`apt_maison`) de la commune,
« tous-biens », puis de son intercommunalité, « tous-biens-secteur » ; sinon inconnu. Un prix sous PRIX_ACHAT_MIN_M2 (300 €/m², seuil de Vincent du 2026-10-14) n'est pas crédible (ventes en
bloc) : il n'est pas retenu, on passe au niveau suivant. Moselle, Bas-Rhin et Haut-Rhin : inconnu (ventes non publiées). Paris, Lyon et Marseille : la règle par
arrondissement, puis moyenne simple de ceux qui ont un prix, « tous-biens » si l'un d'eux l'est, sinon « secteur » si
l'un d'eux l'est (H67 ; plan de cadre-de-vie, tâche 1 : aucun arrondissement en tous biens au 2026-10-15).

`mer_km` : distance de la mairie à la mer (mer.py), en km à deux décimales, tronqués comme `montagne_km` (corrections 2
de cadre-de-vie, 2026-10-15).

Cadre de vie (tranche cadre-de-vie, tâche 1, 2026-10-15) : `type_env`, niveau de la grille communale de densité Insee 2025
(DENS7 regroupé en 4, D10, H71), joint par code ; `montagne_km`, distance de la mairie à la zone de montagne du Cerema
(montagne.py, R29), en km à deux décimales (tronqués, pour que le km affiché soit celui de la distance mesurée), 0 = commune
de montagne (classée en tout ou partie, ou mairie dans la zone).

Prérequis : python3 scripts/data/sources.py, puis python3 scripts/data/mer.py et python3 scripts/data/montagne.py
Usage : python3 scripts/data/communes.py  (s'arrête sur le premier contrôle qui échoue)
"""
import collections
import csv
import gzip
import hashlib
import json
import math
import os
import re
import xml.etree.ElementTree as ET
import zipfile

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
RAW = os.path.join(ROOT, 'data-raw')
OUT = os.path.join(ROOT, 'public', 'data')

PLM = {'75056': '751', '69123': '6938', '13055': '132'}  # commune → préfixe des codes d'arrondissement
DECIMALES = 4  # décimales gardées dans les formes (≈ 10 m)
# Colonnes ajoutées à la fin (immobilier, puis cadre-de-vie) : le site lit les lignes par position.
CHAMPS = ['code', 'nom', 'dep', 'population', 'loyer_m2', 'estimation_propre', 'mer_km',
          'loyer_maison_m2', 'estimation_propre_maison', 'type_env', 'montagne_km']
CHAMPS_ACHAT = ['code', 'appartement_m2', 'appartement_source', 'maison_m2', 'maison_source']
BIENS = ('appartement', 'maison')
TOUS_BIENS = 'apt_maison'  # colonnes « appartements et maisons » des fichiers DVF (D12 d'immobilier)
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
# D12 (tâche 0 de cadre-de-vie, 2026-10-15, mêmes fichiers) : 2 194 communes sans prix d'appartement passent en tous
# biens (avant : inconnu-secteur 2 195) ; Île-de-Sein (29083), sans aucune vente ni intercommunalité, reste sans prix.
MESURES = {'appartement': {'commune': 6265, 'secteur': 24678, 'tous-biens': 1983, 'tous-biens-secteur': 211, 'inconnu-secteur': 1},
           'maison': {'commune': 30878, 'secteur': 2259, 'tous-biens': 0, 'tous-biens-secteur': 0, 'inconnu-secteur': 1}}

# Grille communale de densité Insee 2025 (D10) : DENS7 → niveau de H71 (regroupement de la tâche 0 de cadre-de-vie).
DENSITE = os.path.join('densite', 'fichier_diffusion_2025.xlsx')
DENSITE_MISE_EN_LIGNE = 'Mise en ligne le 21/07/2025'
NIVEAU = {'1': 'ville-dense', '2': 'ville-et-peripherie', '3': 'ville-et-peripherie', '4': 'ville-et-peripherie',
          '5': 'bourg-et-village', '6': 'bourg-et-village', '7': 'campagne-isolee'}
# Comptes de la tâche 0 de cadre-de-vie (2026-10-15) sur les 34 746 communes ; écart de plus de 5 % = arrêt.
MESURES_ENV = {'ville-dense': 692, 'ville-et-peripherie': 3514, 'bourg-et-village': 23305, 'campagne-isolee': 7235}
# Zone de montagne (Cerema, source B de la tâche 0) : communes classées, dont en partie, et répartition par choix
# (distance affichée, au km, « moins d'1 km » comptée 1 km).
MESURES_MONTAGNE = {'classées': 5514, 'en partie': 182}
TRANCHES_MONTAGNE = (('0', 0, 0, 5514), ('1 à 10 km', 1, 10, 3454), ('11 à 30 km', 11, 30, 3640),
                     ('31 à 50 km', 31, 50, 2118), ('51 à 100 km', 51, 100, 3574), ('au-delà de 100 km', 101, 10 ** 6, 16446))


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


def feuille_xlsx(path, nom):
    """Lignes d'une feuille d'un classeur xlsx (bibliothèque standard) : liste de {colonne: valeur texte}."""
    z = zipfile.ZipFile(path)
    ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    rid = next(s.get('{%s}id' % rel) for s in wb.find('m:sheets', ns) if s.get('name') == nom)
    cible = next(r.get('Target') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels')) if r.get('Id') == rid)
    partages = [''.join(t.text or '' for t in si.iter('{%s}t' % ns['m'])) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
    lignes = []
    for _, el in ET.iterparse(z.open('xl/' + cible.lstrip('/').replace('xl/', ''))):
        if el.tag == '{%s}row' % ns['m']:
            ligne = {}
            for cell in el:
                v = cell.find('m:v', ns)
                if v is None:
                    is_ = cell.find('m:is', ns)
                    val = ''.join(t.text or '' for t in is_.iter('{%s}t' % ns['m'])) if is_ is not None else ''
                else:
                    val = partages[int(v.text)] if cell.get('t') == 's' else v.text
                ligne[re.match(r'[A-Z]+', cell.get('r')).group()] = val
            lignes.append(ligne)
            el.clear()
    return lignes


def densite():
    """Grille communale de densité Insee 2025, feuille « Maille communale » : code INSEE → DENS7 (1 à 7)."""
    lignes = feuille_xlsx(os.path.join(RAW, DENSITE), 'Maille communale')
    tete_i = next(i for i, r in enumerate(lignes) if 'DENS7' in r.values())
    check(any(DENSITE_MISE_EN_LIGNE in v for r in lignes[:tete_i] for v in r.values()),
          f'grille de densité : « {DENSITE_MISE_EN_LIGNE} » dans l\'en-tête (millésime 2025, géographie au 01/01/2025)')
    col = {v: k for k, v in lignes[tete_i].items()}
    return {r[col['CODGEO']]: r.get(col['DENS7']) for r in lignes[tete_i + 1:] if r.get(col['CODGEO'])}


def km_affiche(km):
    """Distance comparée par le site (R28, R29) : au km, « moins d'1 km » comptée 1 km ; 0 = commune de montagne."""
    return 0 if km == 0 else max(1, math.floor(km + 0.5))


def centieme_tronque(km):
    """Km à deux décimales, tronqués : mètres entiers (mer-km.csv, montagne-km.csv), puis division entière (sans erreur de
    virgule flottante). Une valeur tronquée ne franchit jamais le demi-km : le km affiché par le site est celui de la mesure."""
    return (round(km * 1000) // 10) / 100


def km_mer(km):
    """`mer_km` : km à deux décimales, tronqués (corrections 2 de cadre-de-vie, même règle que `montagne_km`). Arrondie au
    centième, la distance de x,495 à x,499 km devenait x,50 : 181 communes affichées et comparées 1 km trop loin (Tréon,
    28394 : 100,495 → 100,5 → 101 km, écartée à « 100 km »), et Merville-Franceville-Plage (14409, 0,997 km) affichée
    « 1 km » au lieu de « moins d'1 km ». Une commune à 0 km reste à 0 (« moins d'1 km », comparée comme 1 km)."""
    return centieme_tronque(km)


def mer_affichee(km):
    """Distance à la mer lue par le site (R4, R28) : « moins d'1 km » sous 1 km, sinon le km arrondi (comparée pareil)."""
    return 'moins d\'1' if km < 1 else math.floor(km + 0.5)


def km_montagne(m):
    """`montagne_km` : km à deux décimales, 0 = commune de montagne (classée ou mairie dans la zone).
    Tronqués et non arrondis (corrections 1 de cadre-de-vie) : le site arrondit au km (R29), et un arrondi au centième
    ferait passer x,495 à x,499 km à x,50, donc affichés et comparés 1 km plus loin (145 communes ; au dixième : 1 416,
    dont Clermont-Ferrand 2,465 → 2,5 → 3 km). Tronquée, la valeur garde le km de la distance mesurée.
    Une commune hors zone garde au moins 0,01 km (Raon-lès-Leau, 54443 : mairie à 24 m de la zone, « moins d'1 km » et
    pas « Commune de montagne »)."""
    if m is None:
        return None
    km, classement = m
    return 0 if classement else max(0.01, centieme_tronque(km))


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
        cols = {b: (tete.index(f'nb_ventes_{b}'), tete.index(f'med_prix_m2_{b}')) for b in BIENS + (TOUS_BIENS,)}
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
            par_bien = mois.setdefault((r[i_ech], r[i_code]), {b: [] for b in cols})
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
    l'intercommunalité ; tb-1, tb-2, tb-3-1, tb-3-2 : la même chose sur le prix tous biens (D12) ; inconnu."""
    com, epci, mois = d
    r = com.get(code)
    p = prix_ligne(r, mois.get(('commune', code)), bien)
    if p:
        return p[0], 'commune', p[1]
    parent = r['code_parent'] if r else None
    p = prix_ligne(epci.get(parent), mois.get(('epci', parent)), bien) if parent in epci else None
    if p:
        return p[0], 'secteur', '3-' + p[1]
    p = prix_ligne(r, mois.get(('commune', code)), TOUS_BIENS)
    if p:
        return p[0], 'tous-biens', 'tb-' + p[1]
    p = prix_ligne(epci.get(parent), mois.get(('epci', parent)), TOUS_BIENS) if parent in epci else None
    if p:
        return p[0], 'tous-biens-secteur', 'tb-3-' + p[1]
    return None, 'inconnu-secteur', 'inconnu'


def achat(d, code, dep, bien):
    if dep in ALSACE_MOSELLE:
        return None, 'inconnu-alsace-moselle', 'alsace-moselle'
    if code in PLM:  # H67, à la lettre : arrondissements estimés compris
        arr = [achat_commune(d, k, bien) for k in sorted(d[0]) if len(k) == 5 and k.startswith(PLM[code])]
        connus = [a for a in arr if a[0] is not None]
        if not connus:
            return None, 'inconnu-secteur', 'inconnu'
        sources = {a[1] for a in connus}
        source = 'tous-biens' if sources & {'tous-biens', 'tous-biens-secteur'} else 'secteur' if 'secteur' in sources else 'commune'
        return round(sum(a[0] for a in connus) / len(connus), 2), source, 'H67'
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
    dens7 = densite()
    with open(os.path.join(RAW, 'montagne-km.csv')) as f:
        montagne = {r['code']: (float(r['km']), r['classement']) for r in csv.DictReader(f)}

    codes = sorted(com)
    rows = []
    achats = []
    for code in codes:
        m2, propre = loyer_commune(loy, code)
        m2_mai, propre_mai = loyer_commune(loy_mai, code)
        pop = geo.get(code, {}).get('population')
        rows.append([code, com[code]['LIBELLE'], com[code]['DEP'], pop,
                     None if m2 is None else round(m2, 4), propre,
                     None if code not in mer else km_mer(mer[code]),
                     None if m2_mai is None else round(m2_mai, 4), propre_mai,
                     NIVEAU.get(dens7.get(code)),
                     km_montagne(montagne.get(code))])
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
    double = [r[0] for r in rows if mer_affichee(r[6]) != mer_affichee(mer[r[0]])]
    check(not double, f'0 commune affichée à un autre km de la mer que sa distance mesurée (double arrondi, R28) : {len(double)} {double[:5]}')
    for code, attendu, affiche in (('28394', 100.49, 100), ('93008', 147.49, 147), ('14409', 0.99, "moins d'1"), ('33063', 39.07, 39)):
        check(by[code][6] == attendu and mer_affichee(by[code][6]) == affiche,
              f'{by[code][1]} ({code}) : {by[code][6]} km de la mer, affichée {mer_affichee(by[code][6])} (attendu {attendu}, {affiche})')
    print(f"  info Paris : {by['75056'][4] * 52:.0f} € pour 52 m², estimation propre {by['75056'][5]},"
          f" {by['75056'][3]} habitants ; estimations propres : {sum(1 for r in rows if r[5])} communes")
    print(f"  info loyer des maisons : {sum(1 for r in rows if r[7] is None)} commune sans loyer,"
          f" {sum(1 for r in rows if r[8])} estimations propres ; Bordeaux {bx[7]} €/m², Paris {by['75056'][7]} €/m²")

    print('Contrôles du cadre de vie (type d\'environnement, distance à la montagne)')
    for i, champ in ((9, "type d'environnement"), (10, 'distance à la montagne')):
        manque = [r[0] for r in rows if r[i] is None]
        check(not manque, f'0 commune sans {champ} (manquent : {len(manque)} {manque[:5]})')
    for niveau, ref in MESURES_ENV.items():
        n = sum(1 for r in rows if r[9] == niveau)
        check(abs(n - ref) <= max(0.05 * ref, 5), f'{niveau} : {n} communes (tâche 0 : {ref}, écart permis 5 %)')
    print(f"  info DENS7 sur les communes du site : {dict(sorted(collections.Counter(dens7.get(c) for c in codes).items()))}")
    classes = {c for c, (_, cl) in montagne.items() if cl in ('totalite', 'partie')}
    n_cl = {'classées': len(classes), 'en partie': sum(1 for _, cl in montagne.values() if cl == 'partie')}
    for nom_, ref in MESURES_MONTAGNE.items():
        check(abs(n_cl[nom_] - ref) <= max(0.05 * ref, 5), f'montagne, communes {nom_} : {n_cl[nom_]} (tâche 0 : {ref}, écart permis 5 %)')
    h81 = [c for c, (_, cl) in montagne.items() if cl == 'mairie-dans-la-zone']
    print(f'  info mairies dans la zone sans commune classée (H81, comptées à 0) : {len(h81)} {h81[:5]}')
    faux_zero = [r[0] for r in rows if r[10] == 0 and montagne[r[0]][1] == '']
    check(not faux_zero, f'0 commune hors zone à 0 km après arrondi (0 = commune de montagne) : {faux_zero[:5]}')
    for nom_, lo, hi, ref in TRANCHES_MONTAGNE:
        n = sum(1 for r in rows if lo <= km_affiche(r[10]) <= hi)
        check(abs(n - ref) <= max(0.05 * ref, 5), f'montagne, {nom_} : {n} communes (tâche 0 : {ref}, écart permis 5 %)')
    double = [r[0] for r in rows if montagne[r[0]][1] == '' and km_affiche(r[10]) != km_affiche(montagne[r[0]][0])]
    check(not double, f'0 commune affichée à un autre km que sa distance mesurée (double arrondi, R29) : {len(double)} {double[:5]}')
    for code, attendu in (('33063', 172.78), ('38185', 0.65), ('69123', 13.69), ('74056', 0), ('74010', 0),
                          ('63113', 2.46), ('19117', 10.49), ('54443', 0.02)):
        check(by[code][10] == attendu, f'{by[code][1]} ({code}) : {by[code][10]} km de la montagne (tâche 0 : {attendu})')
    for code, attendu in (('63113', 2), ('19117', 10)):
        check(km_affiche(by[code][10]) == attendu, f'{by[code][1]} ({code}) : affichée {km_affiche(by[code][10])} km (attendu {attendu})')
    for code, attendu in (('33063', 'ville-dense'), ('33214', 'bourg-et-village'), ('74056', 'ville-et-peripherie')):
        check(by[code][9] == attendu, f'{by[code][1]} ({code}) : {by[code][9]} (attendu {attendu})')
    for code in PLM:
        print(f'  info {by[code][1]} ({code}) : {by[code][9]}, {by[code][10]} km de la montagne')

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
        n = {r: sum(1 for a in hors if regles[bien][a[0]] == r) for r in ('1', '2', '3-1', '3-2', 'tb-1', 'tb-2', 'tb-3-1', 'tb-3-2', 'inconnu')}
        print(f'  info {bien}, par règle (1 récent, 2 toute la période, 3 intercommunalité, tb tous biens) : {n}')
        print(f'  info {bien}, par source (toutes les communes) : {dict(collections.Counter(a[2 + 2 * j] for a in achats))}')
    check(ach['33063'][1:] == [4233, 'commune', 5067, 'commune'] and regles['appartement']['33063'] == regles['maison']['33063'] == '1',
          f"Bordeaux (33063) : {ach['33063'][1:]}, règle 1 (attendu 4 233 et 5 067 €/m², prix récent 2023-2025)")
    check(ach['33487'][1:5] == [3700, 'secteur', 2487, 'commune'] and regles['maison']['33487'] == '2',
          f"Saint-Vincent-de-Paul (33487) : {ach['33487'][1:]} (attendu appartement 3 700 €/m², Bordeaux Métropole récent ;"
          f" maison 2 487 €/m², 24 ventes récentes : règle 2)")
    for code in PLM:
        check(ach[code][1] is not None and ach[code][3] is not None, f'{by[code][1]} ({code}) : {ach[code][1:]}')
        for bien in BIENS:
            arr = [k for k in sorted(ventes) if len(k) == 5 and k.startswith(PLM[code])]
            tb = [k for k in arr if achat_commune(donnees_achat, k, bien)[1].startswith('tous-biens')]
            print(f'  info {by[code][1]}, {bien} : {len(tb)} arrondissement(s) sur {len(arr)} au prix tous biens')
    for code, attendu in (('02004', [733, 'tous-biens']), ('62268', [1493, 'tous-biens']), ('62821', [1714, 'tous-biens-secteur'])):
        check(ach[code][1:3] == attendu, f'D12 {by[code][1]} ({code}), appartement : {ach[code][1:3]} (tâche 0 : {attendu})')
    sans = sorted({a[0] for a in achats for j in range(2) if a[2 + 2 * j] == 'inconnu-secteur'})
    check(sans == ['29083'], f'D12 : sans prix hors Alsace-Moselle : {sans[:5]} (tâche 0 : Île-de-Sein, 29083, seule)')

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
