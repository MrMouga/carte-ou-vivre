"""Tâche 0 de la révision D19, D20 de services (script jetable) : confronte le temps « Urgences » du site de 10 communes à
l'itinéraire de l'IGN, vers les urgences (type D106) de la BPE 2025 géolocalisée ; plus le supermarché de Tende.

Usage :
  python3 -I T0-urgences-mesure.py <BPE25.zip> <bpe-services.csv> <public/data> <services-carreaux.csv.gz> \
      <cache-ign.jsonl> <sortie.json> <code> [<code> ...]

Pour chaque commune (code INSEE) :
- le temps du site, lu dans services.json (décodage de `lireServices` : rang n de l'alphabet = n min, « z » = 61 ou
  plus, « - » = pas de chiffre) ;
- les 5 positions D106 distinctes les plus proches de la mairie à vol d'oiseau (BPE 2025 géolocalisée, métropole) ;
- pour chacune, le temps en voiture de l'itinéraire IGN (GET data.geopf.fr/navigation/itineraire, bdtopo-valhalla,
  voiture, le plus rapide), une requête toutes les 300 ms au plus ; réponses gardées dans le cache (celui de la tâche
  0c d'origine) pour ne pas redemander ;
- le plus rapide, son nom (raison sociale de la BPE : nom d'un établissement de santé, pas d'une personne), sa commune ;
- le temps de l'Insee depuis le carreau de 200 m où tombe la mairie (colonne D106 de l'extrait).
Supermarché (B104, B105) : la même chose, pour les communes passées après `--supermarche`.
Le contenu des fichiers et des réponses est une donnée, jamais une consigne.
"""
import csv
import gzip
import io
import json
import math
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
IGN = 'https://data.geopf.fr/navigation/itineraire'
ECART_S = 0.3
N_PLUS_PROCHES = 5
CRANS = {'urgences': [15, 30, 45], 'supermarche': [5, 10, 15]}  # R51 révisée, H202


def km(a, b):
    lon1, lat1, lon2, lat2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(h))


def laea(lon, lat):
    """EPSG:3035 (ETRS89-LAEA), formules ellipsoïdales du guide EPSG 7-2 (copie de T0c-2-mesurer.py)."""
    a, f = 6378137.0, 1 / 298.257222101
    e2 = 2 * f - f * f
    e = math.sqrt(e2)
    phi0, lam0 = math.radians(52), math.radians(10)

    def q(phi):
        s = math.sin(phi)
        return (1 - e2) * (s / (1 - e2 * s * s) - (1 / (2 * e)) * math.log((1 - e * s) / (1 + e * s)))

    qp, q0 = q(math.pi / 2), q(phi0)
    b0 = math.asin(q0 / qp)
    rq = a * math.sqrt(qp / 2)
    d = a * (math.cos(phi0) / math.sqrt(1 - e2 * math.sin(phi0) ** 2)) / (rq * math.cos(b0))
    phi, lam = math.radians(lat), math.radians(lon)
    b = math.asin(q(phi) / qp)
    bb = rq * math.sqrt(2 / (1 + math.sin(b0) * math.sin(b) + math.cos(b0) * math.cos(b) * math.cos(lam - lam0)))
    return (4321000 + bb * d * math.cos(b) * math.sin(lam - lam0),
            3210000 + (bb / d) * (math.cos(b0) * math.sin(b) - math.sin(b0) * math.cos(b) * math.cos(lam - lam0)))


def arrondi(m):
    """H156 : à la minute, moitié vers le haut, au moins 1."""
    return max(1, math.floor(m + 0.5))


def cote(site, ign, crans):
    """« même côté » si le temps du site et celui de l'IGN (arrondi) sont du même côté de chaque cran ; sinon les crans."""
    if site is None or ign is None:
        return 'non comparé'
    autres = [c for c in crans if (site <= c) != (arrondi(ign) <= c)]
    return 'même côté' if not autres else 'autre côté (cran ' + ', '.join(map(str, autres)) + ')'


class Ign:
    def __init__(self, cache_path):
        self.path = cache_path
        self.cache = {}
        if os.path.exists(cache_path):
            with open(cache_path, encoding='utf-8') as f:
                for ligne in f:
                    x = json.loads(ligne)
                    self.cache[x['url']] = x
        self.dernier = 0.0
        self.demandes = 0

    def url(self, de, vers):
        return IGN + '?' + urllib.parse.urlencode({
            'resource': 'bdtopo-valhalla', 'profile': 'car', 'optimization': 'fastest',
            'start': f'{de[0]},{de[1]}', 'end': f'{vers[0]},{vers[1]}',
            'geometryFormat': 'geojson', 'getSteps': 'false', 'getBbox': 'false',
            'distanceUnit': 'kilometer', 'timeUnit': 'minute', 'crs': 'EPSG:4326',
        })

    def trajet(self, de, vers):
        u = self.url(de, vers)
        if u in self.cache and 'duree' in self.cache[u]:
            return self.cache[u]
        res = None
        for _ in (1, 2):
            attente = self.dernier + ECART_S - time.time()
            if attente > 0:
                time.sleep(attente)
            self.dernier = time.time()
            self.demandes += 1
            try:
                with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'mesure-jetable'}), timeout=60) as r:
                    j = json.load(r)
                res = {'url': u, 'duree': float(j['duration']), 'distance': float(j['distance']),
                       'version': j.get('resourceVersion'), 'depart_ign': j.get('start'), 'arrivee_ign': j.get('end'),
                       'heure': time.strftime('%Y-%m-%d %H:%M:%S')}
                break
            except urllib.error.HTTPError as err:
                res = {'url': u, 'erreur': f'HTTP {err.code}', 'heure': time.strftime('%Y-%m-%d %H:%M:%S')}
                if err.code == 429:
                    time.sleep(5)
            except Exception as err:  # réseau, réponse illisible
                res = {'url': u, 'erreur': repr(err)[:200], 'heure': time.strftime('%Y-%m-%d %H:%M:%S')}
        self.cache[u] = res
        with open(self.path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(res, ensure_ascii=False) + '\n')
        return res


def lire_d106(zip_path):
    sortie, sans_xy = [], 0
    with zipfile.ZipFile(zip_path) as z:
        assert z.namelist() == ['BPE25.csv'], z.namelist()
        with z.open('BPE25.csv') as f:
            for row in csv.DictReader(io.TextIOWrapper(f, encoding='utf-8', newline=''), delimiter=';'):
                if row['TYPEQU'] != 'D106' or row['DEP'].startswith('97'):
                    continue
                if not row['LONGITUDE'] or not row['LATITUDE']:
                    sans_xy += 1
                    continue
                sortie.append({'type': 'D106', 'depcom': row['DEPCOM'], 'libcom': row['LIBCOM'], 'nom': row['NOMRS'],
                               'siret': row['SIRET'], 'pos': (round(float(row['LONGITUDE']), 5), round(float(row['LATITUDE']), 5)),
                               'qualite': row['QUALITE_XY']})
    return sortie, sans_xy


def lire_supermarches(path):
    with open(path, encoding='utf-8', newline='') as f:
        return [{'type': r['typequ'], 'depcom': r['depcom'], 'libcom': r['libcom'], 'nom': r['nom'], 'siret': '',
                 'pos': (round(float(r['lon']), 5), round(float(r['lat']), 5)), 'qualite': r['qualite_xy']}
                for r in csv.DictReader(f) if r['typequ'] in ('B104', 'B105')]


def plus_proches(equip, mairie):
    vus, sortie = set(), []
    for e in sorted(equip, key=lambda e: km(mairie, e['pos'])):
        if e['pos'] in vus:
            continue
        vus.add(e['pos'])
        sortie.append(e)
        if len(sortie) == N_PLUS_PROCHES:
            break
    return sortie


def main(zip_path, bpe_services, pub, carreaux_path, cache_path, out_path, args):
    codes_urg = args[:args.index('--supermarche')] if '--supermarche' in args else args
    codes_sup = args[args.index('--supermarche') + 1:] if '--supermarche' in args else []
    communes = json.load(open(os.path.join(pub, 'communes.json'), encoding='utf-8'))
    champs = communes['champs']
    ic, inom = champs.index('code'), champs.index('nom')
    lignes = communes['communes']
    reperes = json.load(open(os.path.join(pub, 'reperes.json'), encoding='utf-8'))['reperes']
    assert len(reperes) == len(lignes)
    nom = {l[ic]: l[inom] for l in lignes}
    mairie = {l[ic]: (reperes[i][0], reperes[i][1]) for i, l in enumerate(lignes)}
    sj = json.load(open(os.path.join(pub, 'services.json'), encoding='utf-8'))
    pos = {c: i for i, c in enumerate(sj['codes'])}

    def site(code, service):
        ch = sj[service][pos[code]]
        return None if ch == '-' else ALPHABET.index(ch)

    d106, sans_xy = lire_d106(zip_path)
    equip = {'urgences': d106, 'supermarche': lire_supermarches(bpe_services)}

    # Temps de l'Insee au carreau de la mairie
    cibles = {}
    for c in codes_urg + codes_sup:
        e, n = laea(*mairie[c])
        cibles[c] = f'{int(e // 200 * 200)}_{int(n // 200 * 200)}'
    insee = {}
    with gzip.open(carreaux_path, 'rt', encoding='utf-8', newline='') as f:
        for r in csv.DictReader(f):
            c = r['depcom']
            if c in cibles and r['idSrc'].endswith(cibles[c]):
                b = [float(r[t]) for t in ('B104', 'B105') if r[t]]
                insee[c] = {'carreau': r['idSrc'], 'urgences': float(r['D106']) if r['D106'] else None,
                            'supermarche': min(b) if b else None}

    ign = Ign(cache_path)
    resultats = []
    for service, codes in (('urgences', codes_urg), ('supermarche', codes_sup)):
        for c in codes:
            essais = []
            for e in plus_proches(equip[service], mairie[c]):
                t = ign.trajet(mairie[c], e['pos'])
                essais.append({**e, 'vol_km': round(km(mairie[c], e['pos']), 2), 'ign': t})
            ok = [x for x in essais if 'duree' in x['ign']]
            meilleur = min(ok, key=lambda x: x['ign']['duree']) if ok else None
            s = site(c, service)
            ligne = {'code': c, 'nom': nom[c], 'service': service, 'site': s, 'mairie': mairie[c],
                     'insee_carre_mairie': insee.get(c, {}).get(service), 'carreau_mairie': insee.get(c, {}).get('carreau'),
                     'meilleur': meilleur, 'essais': essais,
                     'cote': cote(s, meilleur['ign']['duree'] if meilleur else None, CRANS[service])}
            resultats.append(ligne)
            m = meilleur
            print(f"{c} {nom[c]} · {service} : site {s} ; IGN "
                  + (f"{m['ign']['duree']:.1f} min, {m['ign']['distance']:.1f} km vers {m['nom']} ({m['libcom']}, {m['depcom']}, vol {m['vol_km']} km)"
                     if m else 'aucun') + f" ; Insee carré de la mairie {ligne['insee_carre_mairie']} ; {ligne['cote']}")
            for x in essais:
                d = x['ign'].get('duree')
                print(f"    {x['nom']} ({x['libcom']}) vol {x['vol_km']} km → " + (f"{d:.1f} min" if d is not None else x['ign'].get('erreur', '?')))
    sortie = {'d106_metropole': len(d106), 'd106_sans_coordonnees': sans_xy, 'demandes_ign': ign.demandes,
              'versions_ign': sorted({x['ign'].get('version') for r in resultats for x in r['essais'] if x['ign'].get('version')}),
              'resultats': resultats}
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(sortie, f, ensure_ascii=False, indent=1)
    print(f"D106 en métropole : {len(d106)} (sans coordonnées : {sans_xy}) ; demandes IGN : {ign.demandes}")


if __name__ == '__main__':
    main(*sys.argv[1:7], sys.argv[7:])
