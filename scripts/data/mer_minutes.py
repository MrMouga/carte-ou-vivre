"""Temps en voiture de la mairie de chaque commune jusqu'à la mer (tranche recherche-et-mer ; D4, R61, H196).

Le trajet va de la mairie (D18 de loyer-mer) au point de côte qui donne ses km (D4), trouvé par `mer.points_cote` (même
recherche que les km de mer-km.csv, importée et non recopiée). Les temps viennent de la matrice d'openrouteservice
(profil voiture), calculés une seule fois : ne pas relancer une fois l'envoi fini.

Modes :
  --preparer   sans réseau. Point de côte de chaque commune (contrôle : les km relus égaux à mer-km.csv), lots de
               requêtes, nombre de requêtes et durée prévue. Écrit data-raw/mer-calcul/lots.json.
  --envoyer    ENVOIE LES REQUÊTES (lancé par Vincent seulement ; l'agent ne l'exécute jamais). Lit lots.json, reprend
               sans renvoyer un lot déjà écrit dans data-raw/mer-calcul/ors-mer.jsonl, attend quand le quota est
               épuisé, refait une fois un lot en échec puis le note en échec. N'affiche ni n'écrit jamais la clé.
    --essai    avec --envoyer : seulement le lot d'essai (Bordeaux, Caen, Mont-de-Marsan : une requête).
    --a-blanc  avec --envoyer : dit ce qui serait envoyé, sans rien envoyer ni lire la clé (sortie : JSON).
  --calculer   sans réseau (tâche 0b). Lit lots.json et ors-mer.jsonl (arrêt si leur empreinte n'est plus celle
               retenue, EMPREINTES), et scripts/data/mer-retraits.csv (D8 : colonnes `code`, `preuve`). Écrit
               data-raw/mer-min.csv : une ligne par commune, `mer_min` = minutes entières, arrondies une seule fois,
               moitié vers le haut (H191), vide pour une commune sans temps, avec sa cause (H196, CAUSES).
               Arrêts : un trajet manquant dans ors-mer.jsonl ; plus de 2 % des communes sans temps.
  --lots-extrait <fichier.json>  formation des lots sur ces seules données ({"communes": [[code, lon, lat, lon du point,
               lat du point]]}), écrite sur la sortie standard (tests de scripts/data/mer_minutes.test.ts).
Options des tests : --dossier <dossier> (à la place de data-raw/mer-calcul ; sans contrôle d'empreinte), --url <adresse>,
  --cle <fichier>, --attentes-courtes (toutes les attentes à 0,05 s), --retraits <csv>, --sortie <csv>.

Lots (plan, tâche 0a) : une requête de matrice a des sources (les mairies) et des destinations (les points de côte) ;
elle calcule sources × destinations trajets (« éléments »), 3 500 au plus (restrictions de l'API hébergée :
« Locations (origin x destination) : 3.500 (e.g. 50 x 50) per request »). Les communes d'un même point vont dans le même
lot (coupé en lots de 3 500 communes s'il en a plus) ; les points sont pris dans l'ordre d'une courbe de Morton sur leurs
coordonnées Lambert-93 (voisins à la suite) et ajoutés au lot tant que (communes) × (points) reste sous 3 500.

Rayon d'accroche (H196) : la matrice n'a aucun paramètre de rayon (requête de matrice, code d'openrouteservice :
locations, sources, destinations, metrics, resolve_locations, units, et deux paramètres cachés, `optimized` et
`options`). Le rayon est un réglage du serveur, `ors.endpoints.matrix.maximum_search_radius`, 2 000 m par défaut
(documentation de configuration, giscience.github.io/openrouteservice/run-instance/configuration/endpoints/matrix) ;
la valeur du service hébergé n'est pas publiée. Un point sans route à moins de ce rayon n'est pas accroché : la réponse
le donne sans `location` (null) et ses durées sont nulles (MatrixSearchContextBuilder). La réponse entière est gardée :
lieu accroché et distance d'accroche (`snapped_distance`) de chaque source et destination.

Bacs (D4) : la matrice ne peut pas les écarter en pratique. `options.avoid_features` existe (paramètre caché) mais fait
passer la matrice en mode « flexible » (`isFlexibleMode`), limité à 25 trajets par requête sur le service hébergé
(« Locations (with dynamic arguments) : 25 (e.g. 5 x 5) per request ») : au moins 1 390 requêtes, près de trois jours
de quota. Les bacs restent ; le tableau de crédibilité gagne Blaye (tâche 0b).

Usage : python3 -I scripts/data/mer_minutes.py --preparer
        python3 -I scripts/data/mer_minutes.py --envoyer --essai   (Vincent : d'abord le lot d'essai)
        python3 -I scripts/data/mer_minutes.py --envoyer           (Vincent : tous les lots, reprend s'il est relancé)
        python3 -I scripts/data/mer_minutes.py --calculer          (fait le 2026-11-26 ; l'envoi ne se relance pas)
"""
import collections
import csv
import datetime
import decimal
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mer  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
RAW = os.path.join(ROOT, 'data-raw')
URL = 'https://api.heigit.org/openrouteservice/v2/matrix/driving-car'  # l'ancienne adresse n'a que 10 % du quota (leçon du 2026-11-24)
CLE = os.path.expanduser('~/.config/openrouteservice/key')
MAX_ELEMENTS = 3500  # sources × destinations par requête (API hébergée)
MAX_REQUETES_JOUR = 500  # quota de la matrice (CLAUDE.md, ORS) ; au-delà : condition d'arrêt de la tâche 0a
PAR_MINUTE = 40  # quota par minute (CLAUDE.md, ORS)
RAYON_DOC_M = 2000  # maximum_search_radius par défaut (documentation de configuration) ; aucun paramètre envoyé
ESSAI = ['33063', '14118', '40192']  # Bordeaux, Caen, Mont-de-Marsan (Landes)
ECHECS_DE_SUITE_MAX = 3  # trois lots de suite en échec : le service est en panne, arrêt sans les noter

# Tâche 0b : fichiers de l'envoi lancé par Vincent le 2026-11-26 (91 lots et le lot d'essai, 0 en échec). Ne pas relancer.
EMPREINTES = {'lots.json': '411deeae1f32f4ced732ad8defe867189e3cc270706390258e0d04c8c1834cfd',
              'ors-mer.jsonl': '13b9f73ee16363e389f283d0a1dfb0ed56c72dba6714ec662780a8b5c705ae21'}
RETRAITS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mer-retraits.csv')
SANS_TEMPS_MAX = 0.02  # plus de 2 % des communes sans temps : arrêt (plan, tâche 0b ; une autre méthode = choix de Vincent)
# Causes d'une commune sans temps (H196), dans l'ordre où elles sont cherchées.
CAUSES = {
    'retrait': 'temps retiré, jugé faux sur un itinéraire en ligne (D8, mer-retraits.csv)',
    'echec': 'calcul en échec après un nouvel essai',
    'pas-de-route-pres-du-point': 'aucune route près du point de côte (point non accroché)',
    'pas-de-route-pres-de-la-mairie': 'aucune route près de la mairie (mairie non accrochée)',
    'pas-de-route-jusqu-au-point': 'aucune route de la mairie jusqu\'au point (les deux accrochés, durée nulle)',
}

COURTES = '--attentes-courtes' in sys.argv
PAUSE = 0.05 if COURTES else 60 / PAR_MINUTE + 0.1  # entre deux départs réels (leçon du 2026-10-13)
ATTENTE_ECHEC = 0.05 if COURTES else 30  # avant le nouvel essai d'un lot
ATTENTE_DEBIT = 0.05 if COURTES else 60  # réponse 429 (trop de requêtes dans la minute)
ATTENTE_QUOTA, ATTENTES_QUOTA_MAX = (0.05, 3) if COURTES else (1800, 52)  # quota du jour : un essai toutes les 30 min, 26 h au plus


def option(nom, defaut=None):
    return sys.argv[sys.argv.index(nom) + 1] if nom in sys.argv else defaut


def dire(*morceaux):
    """Messages pour Vincent : sur la sortie d'erreur quand la sortie standard est du JSON (--a-blanc, extraits)."""
    print(*morceaux, file=sys.stderr if ('--a-blanc' in sys.argv or '--lots-extrait' in sys.argv) else sys.stdout, flush=True)


# --- Formation des lots (sans réseau) ---

def morton(lon, lat):
    """Rang d'un point sur une courbe de Morton (bits entrelacés de ses coordonnées Lambert-93, au km) : des points
    voisins ont souvent des rangs voisins."""
    x, y = mer.to_l93(lon, lat)
    ix, iy = max(0, int(x // 1000)), max(0, int(y // 1000))
    r = 0
    for b in range(16):
        r |= ((ix >> b) & 1) << (2 * b) | ((iy >> b) & 1) << (2 * b + 1)
    return r


def former_lots(communes, max_elements=MAX_ELEMENTS):
    """communes : [(code, (lon, lat) de la mairie, (lon, lat) du point de côte)]. Renvoie les lots
    [{"id", "points": [[lon, lat]], "communes": [[code, lon, lat, indice du point]]}], chaque commune une fois,
    communes × points ≤ max_elements dans chaque lot."""
    par_point = {}
    for code, m, p in sorted(communes):
        par_point.setdefault(tuple(p), []).append((code, m))
    ordre = sorted(par_point, key=lambda p: (morton(*p), p))
    lots, courant = [], None

    def fermer():
        if courant and courant['communes']:
            lots.append(courant)

    for p in ordre:
        cs = par_point[p]
        if len(cs) > max_elements:  # un point de plus de 3 500 communes : ses propres lots, une seule destination
            fermer()
            courant = None
            for k in range(0, len(cs), max_elements):
                lots.append({'points': [list(p)], 'communes': [[c, m[0], m[1], 0] for c, m in cs[k:k + max_elements]]})
            continue
        if courant is None or (len(courant['communes']) + len(cs)) * (len(courant['points']) + 1) > max_elements:
            fermer()
            courant = {'points': [], 'communes': []}
        j = len(courant['points'])
        courant['points'].append(list(p))
        courant['communes'] += [[c, m[0], m[1], j] for c, m in cs]
    fermer()
    for i, lot in enumerate(lots):
        lot['id'] = f'{i + 1:04d}'
    return [{'id': l['id'], 'points': l['points'], 'communes': l['communes']} for l in lots]


def elements(lot):
    return len(lot['communes']) * len(lot['points'])


def lots_extrait(chemin):
    ex = json.load(open(chemin, encoding='utf-8'))
    communes = [(c[0], (c[1], c[2]), (c[3], c[4])) for c in ex['communes']]
    json.dump(former_lots(communes, ex.get('max_elements', MAX_ELEMENTS)), sys.stdout)
    print()


# --- Préparation (sans réseau) ---

def dossier():
    return option('--dossier', os.path.join(RAW, 'mer-calcul'))


def preparer():
    debut = time.time()
    t0 = time.time()
    points = mer.points_cote()
    dire(f'points de côte : {len(points)} communes, {time.time() - t0:.0f} s')
    with open(os.path.join(RAW, 'mer-km.csv'), newline='') as f:
        km = {r['code']: r['km'] for r in csv.DictReader(f)}
    differents = [c for c in points if f'{points[c][0]:.3f}' != km.get(c)]
    dire(f"  {'ok  ' if not differents and len(km) == len(points) else 'ÉCHEC'} les km du point de côte relus égaux à"
         f' mer-km.csv ({len(km)} lignes, {len(differents)} différentes : {differents[:5]})')
    if differents or len(km) != len(points):
        raise SystemExit(1)
    retour = max(abs(a - b) for c, (_, p, ll) in points.items() for a, b in zip(mer.to_l93(*ll), p))
    dire(f'  écart du point de côte converti en degrés puis relu en Lambert-93 : {retour * 1000:.3f} mm au plus')
    if retour > 0.01:
        raise SystemExit('ÉCHEC : conversion Lambert-93 → degrés')

    mairies = dict(mer.mairies())
    communes = [(c, mairies[c], (round(ll[0], 6), round(ll[1], 6))) for c, (_, _, ll) in points.items()]
    lots = former_lots(communes)
    par_point = {}
    for _, _, p in communes:
        par_point[p] = par_point.get(p, 0) + 1
    tailles = sorted(par_point.values(), reverse=True)
    vus = sorted(c[0] for l in lots for c in l['communes'])
    total = sum(elements(l) for l in lots)
    dire(f'points de côte distincts : {len(par_point)} pour {len(communes)} communes ; les plus partagés : {tailles[:5]} ;'
         f' {sum(t == 1 for t in tailles)} points d\'une seule commune')
    dire(f'lots : {len(lots)} requêtes, {total} trajets calculés pour {len(communes)} utiles'
         f' ({total / len(communes):.1f} par commune) ; le plus gros lot : {max(elements(l) for l in lots)} trajets ;'
         f' le plus de points dans un lot : {max(len(l["points"]) for l in lots)}')
    ok = vus == sorted(points) and all(elements(l) <= MAX_ELEMENTS for l in lots)
    dire(f"  {'ok  ' if ok else 'ÉCHEC'} chaque commune dans un seul lot, aucun lot au-delà de {MAX_ELEMENTS} trajets")
    if not ok:
        raise SystemExit(1)

    essai = {'id': 'essai', 'points': [], 'communes': []}
    for c in ESSAI:
        essai['communes'].append([c, *mairies[c], len(essai['points'])])
        essai['points'].append(list(next(p for cc, _, p in communes if cc == c)))
    requetes = len(lots) + 1
    duree_min = requetes * PAUSE / 60
    dire(f'envoi : {requetes} requêtes (dont le lot d\'essai), quota de {MAX_REQUETES_JOUR} par jour et {PAR_MINUTE} par'
         f' minute ; au moins {duree_min:.0f} min au débit permis, plus le temps de calcul de chaque requête (non mesuré :'
         f' le lot d\'essai le donne)')
    os.makedirs(dossier(), exist_ok=True)
    with open(os.path.join(dossier(), 'lots.json'), 'w', encoding='utf-8') as f:
        json.dump({'prepare_le': datetime.datetime.now().astimezone().isoformat(timespec='seconds'),
                   'rayon_doc_m': RAYON_DOC_M, 'max_elements': MAX_ELEMENTS, 'communes': len(communes),
                   'points': len(par_point), 'requetes': requetes, 'essai': essai, 'lots': lots}, f)
    dire(f'écrit : {os.path.relpath(os.path.join(dossier(), "lots.json"), ROOT)} ({time.time() - debut:.0f} s)')
    if requetes > MAX_REQUETES_JOUR:
        raise SystemExit(f'ARRET : {requetes} requêtes, plus d\'un jour de quota ({MAX_REQUETES_JOUR}) : choix de Vincent')


# --- Envoi (lancé par Vincent seulement) ---

def lire_resultats(chemin):
    """Lots déjà écrits : {id: codes}."""
    faits = {}
    if os.path.exists(chemin):
        with open(chemin, encoding='utf-8') as f:
            for ligne in f:
                if ligne.strip():
                    r = json.loads(ligne)
                    faits[r['lot']] = r['codes']
    return faits


def a_envoyer(prepares, faits):
    """Lots à envoyer, dans l'ordre : ceux qui ne sont pas encore écrits. Un lot écrit avec d'autres communes que le lot
    préparé du même numéro arrête tout (les lots ont changé depuis le début de l'envoi)."""
    reste = []
    for lot in prepares:
        codes = [c[0] for c in lot['communes']]
        if lot['id'] in faits:
            if faits[lot['id']] != codes:
                raise SystemExit(f"ARRET : le lot {lot['id']} écrit n'a pas les communes du lot préparé (lots.json a changé)")
            continue
        reste.append(lot)
    return reste


def corps(lot):
    n = len(lot['communes'])
    return json.dumps({'locations': [[c[1], c[2]] for c in lot['communes']] + lot['points'],
                       'sources': list(range(n)), 'destinations': list(range(n, n + len(lot['points']))),
                       'metrics': ['duration']}).encode('utf-8')


def nuls(lot, reponse):
    """(trajets commune → son point sans durée, points non accrochés, mairies non accrochées) d'une réponse."""
    durees = reponse.get('durations') or []
    sans = sum(1 for i, c in enumerate(lot['communes']) if i >= len(durees) or durees[i][c[3]] is None)
    dest = sum(1 for d in reponse.get('destinations') or [] if not d or d.get('location') is None)
    src = sum(1 for s in reponse.get('sources') or [] if not s or s.get('location') is None)
    return sans, dest, src


def envoyer():
    lots_json = json.load(open(os.path.join(dossier(), 'lots.json'), encoding='utf-8'))
    prepares = [lots_json['essai']] if '--essai' in sys.argv else lots_json['lots']
    sortie = os.path.join(dossier(), 'ors-mer.jsonl')
    reste = a_envoyer(prepares, lire_resultats(sortie))
    dire(f'{len(prepares)} lots préparés, {len(prepares) - len(reste)} déjà écrits, {len(reste)} à envoyer'
         f' ({sum(len(l["communes"]) for l in reste)} communes)')
    if '--a-blanc' in sys.argv:
        json.dump({'a_envoyer': [l['id'] for l in reste], 'requetes': len(reste)}, sys.stdout)
        print()
        return
    if not reste:
        dire('Rien à envoyer : tout est déjà écrit. Ne pas relancer.')
        return
    url = option('--url', URL)
    cle = open(option('--cle', CLE), encoding='utf-8').read().strip()
    masquer = (lambda t: t.replace(cle, '***')) if cle else (lambda t: t)
    entetes = {'Authorization': cle, 'Content-Type': 'application/json', 'Accept': 'application/json'}
    dernier_depart = [0.0]
    envoyees = [0]
    limite = 2 * len(reste) + 10  # garde-fou : deux essais par lot, plus quelques-uns

    def demander(lot):
        """Une réponse (dict) ou une erreur (dict) ; attend le quota sans compter d'essai."""
        attentes = 0
        while True:
            if envoyees[0] >= limite:
                raise SystemExit(f'ARRET : {envoyees[0]} requêtes envoyées, au-delà du garde-fou de {limite}')
            attente = dernier_depart[0] + PAUSE - time.time()
            if attente > 0:
                time.sleep(attente)
            dernier_depart[0] = time.time()
            envoyees[0] += 1
            q = urllib.request.Request(url, data=corps(lot), method='POST', headers=entetes)
            try:
                with urllib.request.urlopen(q, timeout=300) as r:
                    return {'reponse': json.load(r), 'secondes': round(time.time() - dernier_depart[0], 1)}
            except urllib.error.HTTPError as e:
                texte = masquer(e.read(2000).decode('utf-8', 'replace'))
                if e.code == 429:
                    dire(f'{heure()} trop de requêtes dans la minute, nouvel essai dans {ATTENTE_DEBIT:.0f} s')
                    time.sleep(ATTENTE_DEBIT)
                    continue
                if e.code == 403 and 'quota' in texte.lower():
                    attentes += 1
                    if attentes > ATTENTES_QUOTA_MAX:
                        raise SystemExit('ARRET : quota toujours épuisé après 26 h ; relancer la même commande plus tard')
                    dire(f'{heure()} quota du jour épuisé, nouvel essai dans {ATTENTE_QUOTA / 60:.0f} min')
                    time.sleep(ATTENTE_QUOTA)
                    continue
                return {'erreur': {'code': e.code, 'texte': texte}}
            except (urllib.error.URLError, TimeoutError, OSError) as e:
                return {'erreur': {'code': None, 'texte': masquer(str(e))}}

    en_attente = []  # lots en échec, notés seulement quand un lot suivant réussit (une panne n'est pas notée)
    bilan = {'lots': 0, 'trajets': 0, 'sans': 0, 'points': 0, 'mairies': 0, 'echecs': 0}
    with open(sortie, 'a', encoding='utf-8') as s:
        def ecrire(lot, resultat, essais):
            ligne = {'lot': lot['id'], 'codes': [c[0] for c in lot['communes']], 'points': lot['points'],
                     'point_de': [c[3] for c in lot['communes']], 'envoye_le': datetime.datetime.now().astimezone().isoformat(timespec='seconds'),
                     'essais': essais, **resultat}
            s.write(json.dumps(ligne, ensure_ascii=False) + '\n')
            s.flush()

        for lot in reste:
            resultat, essais = demander(lot), 1
            if 'erreur' in resultat:
                dire(f"{heure()} lot {lot['id']} : échec ({resultat['erreur']['code']}), nouvel essai dans {ATTENTE_ECHEC:.0f} s")
                time.sleep(ATTENTE_ECHEC)
                resultat, essais = demander(lot), 2
            if 'erreur' in resultat:
                en_attente.append((lot, resultat, essais))
                dire(f"{heure()} lot {lot['id']} : échec après un nouvel essai ({resultat['erreur']['code']} :"
                     f" {resultat['erreur']['texte'][:200]})")
                if len(en_attente) >= ECHECS_DE_SUITE_MAX:
                    raise SystemExit(f'ARRET : {len(en_attente)} lots de suite en échec, le service semble en panne ;'
                                     f' rien n\'est noté pour eux, relancer la même commande plus tard')
                continue
            for l, r, e in en_attente:
                ecrire(l, r, e)
                bilan['echecs'] += 1
            en_attente = []
            ecrire(lot, resultat, essais)
            sans, dest, src = nuls(lot, resultat['reponse'])
            for k, v in (('lots', 1), ('trajets', len(lot['communes'])), ('sans', sans), ('points', dest), ('mairies', src)):
                bilan[k] += v
            if lot['id'] == 'essai':
                montrer_essai(lot, resultat)
            elif bilan['lots'] % 20 == 0:
                dire(f"{heure()} {bilan['lots']} lots écrits ; {bilan['sans']} trajets sans temps sur {bilan['trajets']}")
        for l, r, e in en_attente:  # échecs des derniers lots, après au moins une réussite dans l'envoi
            if bilan['lots']:
                ecrire(l, r, e)
                bilan['echecs'] += 1
            else:
                dire(f"lot {l['id']} : échec non noté (aucun lot n'a réussi) ; relancer la même commande plus tard")
    part = 100 * bilan['sans'] / bilan['trajets'] if bilan['trajets'] else 0
    dire(f"TERMINÉ : {envoyees[0]} requêtes envoyées ; {bilan['lots']} lots écrits, {bilan['echecs']} en échec ;"
         f" trajets sans temps : {bilan['sans']} sur {bilan['trajets']} ({part:.1f} %) ; points de côte non accrochés :"
         f" {bilan['points']} ; mairies non accrochées : {bilan['mairies']}")


def heure():
    return time.strftime('%d/%m %H:%M:%S')


def montrer_essai(lot, resultat):
    rep = resultat['reponse']
    durees, dests, srcs = rep.get('durations') or [], rep.get('destinations') or [], rep.get('sources') or []
    dire(f"lot d'essai : réponse en {resultat['secondes']} s")
    for i, c in enumerate(lot['communes']):
        d = durees[i][c[3]] if i < len(durees) else None
        acc_m = (srcs[i] or {}).get('snapped_distance') if i < len(srcs) else None
        acc_p = (dests[c[3]] or {}).get('snapped_distance') if c[3] < len(dests) else None
        temps = 'sans temps (null)' if d is None else f'{d / 60:.1f} min ({d:.0f} s)'
        dire(f'  {c[0]} : {temps} ; mairie accrochée à {acc_m} m, point de côte accroché à {acc_p} m')
    sans = nuls(lot, rep)[0]
    dire(f"  part de null : {sans} sur {len(lot['communes'])} trajets")


# --- Calcul des minutes (tâche 0b, sans réseau) ---

def minutes(secondes):
    """H191 : durée en minutes entières, arrondie une seule fois, moitié vers le haut (1 770 s = 29,5 min → 30 ;
    24 s = 0,4 min → 0, « moins d'1 min »). En décimal exact : aucune erreur de virgule flottante à la moitié."""
    m = decimal.Decimal(str(secondes)) / 60
    return int(m.to_integral_value(rounding=decimal.ROUND_HALF_UP))


def controle(cond, msg):
    if not cond:
        raise SystemExit(f'  ÉCHEC {msg}')
    dire(f'  ok   {msg}')


def sha256(chemin):
    sha = hashlib.sha256()
    with open(chemin, 'rb') as f:
        while morceau := f.read(1 << 20):
            sha.update(morceau)
    return sha.hexdigest()


def lire_retraits(chemin, codes):
    """D8 : {code: preuve} de mer-retraits.csv. Chaque ligne : une commune de la carte, une seule fois, avec sa preuve."""
    with open(chemin, encoding='utf-8', newline='') as f:
        lecteur = csv.DictReader(f)
        controle(lecteur.fieldnames == ['code', 'preuve'], f'{os.path.basename(chemin)} : colonnes {lecteur.fieldnames}')
        retraits = {}
        for r in lecteur:
            controle(r['code'] in codes and r['code'] not in retraits and (r['preuve'] or '').strip() != '',
                     f"retrait {r['code']} : commune de la carte, une seule fois, preuve écrite")
            retraits[r['code']] = r['preuve'].strip()
    return retraits


def calculer():
    d = dossier()
    reel = '--dossier' not in sys.argv
    if reel:
        for nom, attendu in EMPREINTES.items():
            s = sha256(os.path.join(d, nom))
            controle(s == attendu, f'{nom} : sha256 {s} (empreinte retenue : envoi du 2026-11-26)')
    else:
        dire(f'dossier de test {d} : empreintes non contrôlées')
    prepares = json.load(open(os.path.join(d, 'lots.json'), encoding='utf-8'))
    resultats, doubles = {}, []
    with open(os.path.join(d, 'ors-mer.jsonl'), encoding='utf-8') as f:
        for texte in f:
            if texte.strip():
                r = json.loads(texte)
                if r['lot'] in resultats:
                    doubles.append(r['lot'])
                resultats[r['lot']] = r
    essai = resultats.pop('essai', None)
    manquants, incoherents, lignes = [], [], {}
    for lot in prepares['lots']:
        r = resultats.pop(lot['id'], None)
        codes = [c[0] for c in lot['communes']]
        if r is None:
            manquants.append(f"lot {lot['id']} absent ({len(codes)} communes)")
            continue
        if r['codes'] != codes or r['point_de'] != [c[3] for c in lot['communes']] or r['points'] != lot['points']:
            manquants.append(f"lot {lot['id']} écrit avec d'autres communes ou d'autres points que le lot préparé")
            continue
        rep = r.get('reponse')
        if rep is not None:
            durees, srcs, dests = rep.get('durations'), rep.get('sources'), rep.get('destinations')
            if (durees is None or srcs is None or dests is None or len(durees) != len(codes) or len(srcs) != len(codes)
                    or len(dests) != len(lot['points']) or any(len(rangee) != len(lot['points']) for rangee in durees)):
                manquants.append(f"lot {lot['id']} : réponse incomplète (durées, mairies ou points manquants)")
                continue
        for i, (code, lon, lat, j) in enumerate(lot['communes']):
            ligne = {'code': code, 'mer_min': None, 'cause': None, 'secondes': None, 'accroche_mairie_m': None,
                     'accroche_point_m': None, 'mairie_lon': lon, 'mairie_lat': lat,
                     'point_lon': lot['points'][j][0], 'point_lat': lot['points'][j][1]}
            if rep is None:
                ligne['cause'] = 'echec'
            else:
                duree, src, dst = durees[i][j], srcs[i] or {}, dests[j] or {}
                mairie_ok, point_ok = src.get('location') is not None, dst.get('location') is not None
                ligne['accroche_mairie_m'], ligne['accroche_point_m'] = src.get('snapped_distance'), dst.get('snapped_distance')
                if duree is None:
                    ligne['cause'] = ('pas-de-route-pres-du-point' if not point_ok else
                                      'pas-de-route-pres-de-la-mairie' if not mairie_ok else 'pas-de-route-jusqu-au-point')
                elif not (mairie_ok and point_ok) or duree < 0:
                    incoherents.append(code)
                else:
                    ligne['secondes'], ligne['mer_min'] = duree, minutes(duree)
            if code in lignes:
                manquants.append(f'commune {code} dans deux lots')
            lignes[code] = ligne
    if resultats:
        manquants.append(f'lots écrits mais pas préparés : {sorted(resultats)[:5]}')
    if doubles:
        manquants.append(f'lots écrits deux fois : {doubles[:5]}')
    controle(not manquants, f'aucun trajet manquant dans ors-mer.jsonl ({len(lignes)} communes dans'
                            f" {len(prepares['lots'])} lots) : {manquants[:5]}")
    controle(not incoherents, f'aucune durée pour un point ou une mairie non accrochés : {incoherents[:5]}')
    if reel:
        with open(os.path.join(RAW, 'mer-km.csv'), newline='') as f:
            km = {r['code'] for r in csv.DictReader(f)}
        controle(set(lignes) == km, f'les {len(lignes)} communes des lots sont celles de mer-km.csv ({len(km)})')
    if essai and 'reponse' in essai:
        for i, code in enumerate(essai['codes']):
            a, b = essai['reponse']['durations'][i][essai['point_de'][i]], lignes.get(code, {}).get('secondes')
            dire(f'  info lot d\'essai, {code} : {a} s ; dans son lot : {b} s')

    retraits = lire_retraits(option('--retraits', RETRAITS), set(lignes))
    for code in retraits:
        lignes[code]['mer_min'], lignes[code]['cause'] = None, 'retrait'
    dire(f'  retraits (D8, mer-retraits.csv) : {len(retraits)} {sorted(retraits)}')

    sans = [l for l in lignes.values() if l['mer_min'] is None]
    par_cause = collections.Counter(l['cause'] for l in sans)
    part = len(sans) / len(lignes)
    dire(f'communes sans temps : {len(sans)} sur {len(lignes)} ({100 * part:.2f} %)')
    for cause, texte in CAUSES.items():
        dire(f'  {cause} : {par_cause.get(cause, 0)} ({texte}) {sorted(l["code"] for l in sans if l["cause"] == cause)}')
    if part > SANS_TEMPS_MAX:
        raise SystemExit(f'ARRET : {len(sans)} communes sans temps sur {len(lignes)} ({100 * part:.2f} %), au-delà de'
                         f' {100 * SANS_TEMPS_MAX:.0f} % : une autre méthode de calcul est un choix de Vincent ; rien n\'est écrit')

    avec = [l['mer_min'] for l in lignes.values() if l['mer_min'] is not None]
    tranches = [('moins d\'1 min (0)', 0, 0), ('1 à 15 min', 1, 15), ('16 à 30 min', 16, 30), ('31 min à 1 h', 31, 60),
                ('1 h 01 à 1 h 30', 61, 90), ('au-delà d\'1 h 30', 91, 10 ** 6)]
    dire('répartition des temps : ' + ' ; '.join(f'{nom} {sum(lo <= m <= hi for m in avec)}' for nom, lo, hi in tranches)
         + f' ; le plus long : {max(avec)} min')
    acc_p = sorted(l['accroche_point_m'] for l in lignes.values() if l['accroche_point_m'] is not None)
    acc_m = sorted(l['accroche_mairie_m'] for l in lignes.values() if l['accroche_mairie_m'] is not None)
    if acc_p and acc_m:
        dire(f'accroche des points de côte : médiane {acc_p[len(acc_p) // 2]:.0f} m, au plus {acc_p[-1]:.0f} m,'
             f' {sum(a > 1000 for a in acc_p)} communes au-delà de 1 000 m ; des mairies : médiane'
             f' {acc_m[len(acc_m) // 2]:.0f} m, au plus {acc_m[-1]:.0f} m')
    for code in ESSAI:
        if code in lignes:
            l = lignes[code]
            dire(f"  info {code} : {l['secondes']} s → {l['mer_min']} min")

    sortie = option('--sortie', os.path.join(RAW, 'mer-min.csv'))
    champs = ['code', 'mer_min', 'cause', 'secondes', 'accroche_mairie_m', 'accroche_point_m', 'mairie_lon', 'mairie_lat',
              'point_lon', 'point_lat']
    with open(sortie, 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f)
        w.writerow(champs)
        for code in sorted(lignes):
            w.writerow(['' if lignes[code][c] is None else lignes[code][c] for c in champs])
    dire(f'écrit : {sortie} ({len(lignes)} lignes)')


def main():
    if '--lots-extrait' in sys.argv:
        lots_extrait(option('--lots-extrait'))
    elif '--preparer' in sys.argv:
        preparer()
    elif '--envoyer' in sys.argv:
        envoyer()
    elif '--calculer' in sys.argv:
        calculer()
    else:
        raise SystemExit(__doc__)


if __name__ == '__main__':
    main()
