"""Téléchargement des sources brutes dans data-raw/ (non versionné). Lectures seulement, rien n'est envoyé.

Usage : python3 scripts/data/sources.py  (ne retélécharge pas un fichier déjà présent)
        python3 -I scripts/data/sources.py --services  (seulement les sources des services : lit l'API, ne télécharge rien)
        python3 -I scripts/data/sources.py --codes-postaux  (seulement la base des codes postaux de La Poste, et sa licence)
Sources, licences et mentions : CLAUDE.md (Données).
"""
import datetime
import hashlib
import json
import os
import subprocess
import sys
import urllib.request

RAW = os.path.join(os.path.dirname(__file__), '..', '..', 'data-raw')

DVF = 'stats_whole_period.csv'
DVF_MOIS = 'stats_dvf.csv'
# Pour chaque fichier DVF : <nom>.info.json = date de téléchargement, Last-Modified, sha256 (relus par communes.py).
# Municipales 2026 (tranche mairies, H116) : ressource « Résultats - Communes » des jeux « Elections municipales 2026 -
# Résultats du premier tour » et « … du second tour » du ministère de l'Intérieur sur data.gouv.fr (Licence Ouverte),
# une ligne par commune et ses listes ; même <nom>.info.json que la DVF (relu par mairies.py).
MUNI_T1 = 'municipales-2026-resultats-communes-2026-03-20.csv'
MUNI_T2 = 'municipales-2026-resultats-communes-2026-03-23-16h14.csv'
# Emploi (tranche emploi, tâche 0a, 2026-11-21) : enquête Besoins en main-d'œuvre 2026 de France Travail (Licence
# Ouverte, jeu « Enquête Besoins en Main d'Oeuvre (BMO) » de data.gouv.fr) ; table des bassins d'emploi 2026 (France
# Travail, liée depuis la page de méthode de l'enquête ; aucune licence écrite, réutilisée en citant la source et sa date,
# décision de Vincent du 2026-11-21, H143) ; taux de chômage localisés par zone d'emploi (Insee, paru le 18/09/2026,
# 2e trimestre 2026) ; zones d'emploi 2020 des communes, géographie au 01/01/2025 (Insee, celle de communes.json) ;
# mouvements des communes du COG 2026 (Insee : les 12 communes 2025 absentes de la table des bassins, H142).
# Même <nom>.info.json que la DVF (relu par emploi.py).
BMO = 'Base-open-data-BMO-2026.xlsx'
BASSINS = 'bassins-emploi-2026.xlsx'  # nom du serveur : « Bassins_d'emploi_2026.xlsx » (apostrophe retirée)
CHOMAGE = 'chomage-zone-t1-2003-t2-2026.xlsx'
ZE = 'ZE2020_au_01-01-2025.zip'
MVT_2026 = 'v_mvt_commune_2026.csv'
# Codes postaux (tranche recherche-et-mer, tâche 0a, 2026-11-25 ; D2, R58) : « Base officielle des codes postaux » de
# La Poste (data.gouv.fr, jeu 545b55e1c751df52de9b6045), fichier CSV brut servi par data.laposte.fr (une ligne par code
# INSEE × code postal × lieu-dit, ISO-8859-1, « ; »). Adresse stable, fichier remplacé à chaque mise à jour : date et
# empreinte notées à côté, et la licence relue sur les deux sites au téléchargement (`licence_codes_postaux`).
CODES_POSTAUX = 'laposte-hexasmal.csv'
CODES_POSTAUX_JEU = 'https://www.data.gouv.fr/api/1/datasets/545b55e1c751df52de9b6045/'
CODES_POSTAUX_META = 'https://data.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal'
NOTES = (DVF, DVF_MOIS, MUNI_T1, MUNI_T2, BMO, BASSINS, CHOMAGE, ZE, MVT_2026, CODES_POSTAUX)

# Services (tranche services, tâche 0a, 2026-11-24 ; H165, H170, H171). Jeu Insee « Données sur la localisation et l'accès
# de la population aux équipements » (data.gouv.fr, Licence Ouverte 2.0) : 13 fichiers régionaux de métropole (14,45 Go),
# jamais téléchargés ici ; on note l'adresse, la taille et la somme SHA-1 publiées par l'API, l'extraction
# (services-extrait.sql) lit les fichiers à distance. Valeurs retenues = lecture de /spec (2026-11-23), écrites aussi dans
# CLAUDE.md : une lecture différente arrête le script, et services-sources.info.json n'est pas écrit.
SERVICES_JEU = '67fe0fe2423db9c4a05d8ced'
SERVICES_API = f'https://www.data.gouv.fr/api/1/datasets/{SERVICES_JEU}/'
SERVICES_INFO = 'services-sources.info.json'
SERVICES_TOTAL_GO = 14.45  # total des 13 tailles publiées (mesures de /spec)
SERVICES_DATES = {'2026-08-18', '2026-08-19'}  # mise en ligne (last_modified de l'API ; pas l'en-tête Last-Modified)
_INSEE = 'https://static.data.gouv.fr/resources/donnees-sur-la-localisation-et-lacces-de-la-population-aux-equipements/'
SERVICES_FICHIERS = {  # région → (adresse, octets, SHA-1, mise en ligne)
    '11': (_INSEE + '20260818-130002/donnees-2025-reg11.parquet', 476082759, '433b8e257203e2294bd70c2d3425526c61bb87ed', '2026-08-18'),
    '24': (_INSEE + '20260818-125056/donnees-2025-reg24.parquet', 825690115, '919e4a0508c85bc9bedbce82b1291361e6555c59', '2026-08-18'),
    '27': (_INSEE + '20260818-123811/donnees-2025-reg27.parquet', 861476546, 'efa3985ab40b0200e41964c5f93b3e9c61f1fde8', '2026-08-18'),
    '28': (_INSEE + '20260818-122409/donnees-2025-reg28.parquet', 1103079376, '7d62d28d43db25412a6bd920b767e3234308afa7', '2026-08-18'),
    '32': (_INSEE + '20260819-074623/donnees-2025-reg32.parquet', 933951644, 'ec1617d8f85ed1439258b0d82c89af0fbde19d51', '2026-08-19'),
    '44': (_INSEE + '20260819-073523/donnees-2025-reg44.parquet', 892529336, '1cf1bc80b8bdea934be0e0665929183eee3edd6d', '2026-08-19'),
    '52': (_INSEE + '20260819-072500/donnees-2025-reg52.parquet', 1147553679, '9ac417261e85f1fd5349a0a64ebd974340dd589c', '2026-08-19'),
    '53': (_INSEE + '20260818-153615/donnees-2025-reg53.parquet', 1230220434, 'af29a48805a95b72d9df3163fb8caf7404e146f9', '2026-08-18'),
    '75': (_INSEE + '20260818-145409/donnees-2025-reg75.parquet', 2414485257, '599356d55f9d69ede4196754ae52c1c469a3a495', '2026-08-18'),
    '76': (_INSEE + '20260818-141901/donnees-2025-reg76.parquet', 1745361059, '7303c2bb7d75046863326135de6e737e58f89460', '2026-08-18'),
    '84': (_INSEE + '20260818-135021/donnees-2025-reg84.parquet', 1974307689, 'd5b67910164f346425256d56ddde9d221cef5049', '2026-08-18'),
    '93': (_INSEE + '20260818-120653/donnees-2025-reg93.parquet', 788053755, 'a134da390ae256ecfea869add42cc17c021f2fa2', '2026-08-18'),
    '94': (_INSEE + '20260818-115439/donnees-2025-reg94.parquet', 58703774, '791520bd376d7f953c99efc433bbfbd2ed261a08', '2026-08-18'),
}
# Horaires SNCF (« Réseau SNCF TGV, Intercités et TER », ODbL), version 2026-11-22, copiés le 2026-11-24 depuis l'essai de
# /spec : la version en ligne change chaque jour, ne pas retélécharger (H170). Temps mairie → gares calculés une seule fois
# avec openrouteservice (H171) : ne pas relancer.
SNCF = 'Export_OpenData_SNCF_GTFS_NewTripId.zip'
SNCF_SHA256 = '0abd6918c870c6495a722406bc0c477f8d49ad4639dd9f4513b3d5f9331eaa73'
ORS = 'services-calcul/ors-grandes-lignes.jsonl'
ORS_SHA256 = '90725176eaf96d668411435f2030911584143e0826ab3e8e288918cdb123ae04'  # égal à la copie de l'essai de /spec

CEREMA = 'montagne/cerema'
CEREMA_URL = 'https://static.data.gouv.fr/resources/application-des-dispositions-durbanisme-de-la-loi-montagne-en-france-metropolitaine/'
ZINF = {  # département → dossier de dépôt sur data.gouv.fr (mise à jour du 12/11/2024)
    '02a': '20241112-095227', '02b': '20241112-095227', '004': '20241112-095227', '005': '20241112-095227',
    '006': '20241112-095227', '007': '20241112-095226', '009': '20241112-095226', '011': '20241112-095226',
    '012': '20241112-095226', '015': '20241112-095226', '019': '20241112-095226', '023': '20241112-095226',
    '026': '20241112-095226', '030': '20241112-095226', '031': '20241112-095225', '034': '20241112-095225',
    '039': '20241112-095225', '043': '20241112-095225', '046': '20241112-095224', '048': '20241112-095224',
    '057': '20241112-095224', '063': '20241112-095224', '065': '20241112-095224', '066': '20241112-095224',
    '067': '20241112-095224', '069': '20241112-095223', '070': '20241112-095223', '071': '20241112-095223',
    '081': '20241112-095223', '083': '20241112-095223', '084': '20241112-095223', '087': '20241112-095223',
    '088': '20241112-095223', '090': '20241112-095227',
}

SOURCES = {
    # COG 2025 (Insee) : communes au 1er janvier 2025.
    'v_commune_2025.csv': 'https://www.insee.fr/fr/statistiques/fichier/8377162/v_commune_2025.csv',
    # Carte des loyers 2025 (ANIL), appartements, €/m² charges comprises, logement de référence 52 m².
    'pred-app-mef-dhup.csv': 'https://static.data.gouv.fr/resources/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025/20251211-145010/pred-app-mef-dhup.csv',
    # Même jeu, maisons (logement de référence 92 m²) : loyer des maisons (tranche immobilier).
    'pred-mai-mef-dhup.csv': 'https://static.data.gouv.fr/resources/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025/20251211-145039/pred-mai-mef-dhup.csv',
    # Statistiques DVF d'Etalab, toute la période (prix d'achat, tranche immobilier). Adresse non versionnée : le
    # fichier change à chaque mise à jour, d'où sa date et son empreinte notées à côté.
    DVF: 'https://data-pipeline-open.s3.sbg.io.cloud.ovh.net/dvf/stats_whole_period.csv',
    # Même jeu, par mois (~277 Mo) : prix récent 2023-2025 des communes et intercommunalités assez vendues.
    DVF_MOIS: 'https://data-pipeline-open.s3.sbg.io.cloud.ovh.net/dvf/stats_dvf.csv',
    # Populations légales Insee (H6), via geo.api.gouv.fr (le centre n'est plus utilisé : D18).
    'communes-centre.json': 'https://geo.api.gouv.fr/communes?fields=code,nom,population,centre,codeDepartement&format=json',
    # Mairie de chaque commune (H5, D18) : point de la distance à la mer et du rond du top 10.
    'communes-mairie.json': 'https://geo.api.gouv.fr/communes?fields=code,codeDepartement,mairie&format=json',
    # Contours des communes 2025 d'Etalab (issus d'Admin Express IGN), à 100 m (tuiles : tuiles.py).
    'communes-100m.geojson.gz': 'https://etalab-datasets.geo.data.gouv.fr/contours-administratifs/2025/geojson/communes-100m.geojson.gz',
    # Pays voisins du fond de secours (R8) : Natural Earth admin-0, 1:10 m, domaine public.
    'ne_10m_admin_0_countries.geojson': 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_countries.geojson',
    # Limite terre-mer Shom-IGN 2021, France métropolitaine (7z, ~255 Mo).
    'Limite_terre_mer_France_metropolitaine.7z': 'https://services.data.shom.fr/INSPIRE/telechargement/prepackageGroup/LIMTM_PACK_DL/prepackage/Limite_terre_mer_France_metropolitaine/file/Limite_terre_mer_France_metropolitaine.7z',
    # Mouvements des communes du COG 2025 (Insee) : recalage des communes 2019 de la zone de montagne (montagne.py).
    'v_mvt_commune_2025.csv': 'https://www.insee.fr/fr/statistiques/fichier/8377162/v_mvt_commune_2025.csv',
    # Municipales 2026, premier tour (jeu 69b82a7de5d58cc06ad35ce0, ressource 4feeef01-24f7-4d5a-914f-8aa806f31ec2).
    MUNI_T1: 'https://static.data.gouv.fr/resources/elections-municipales-2026-resultats-du-premier-tour/20260320-164339/municipales-2026-resultats-communes-2026-03-20.csv',
    # Second tour (jeu 69c17fed9f18c7781fd11a14, ressource 6ff67a28-01bf-459e-beca-dd7aa8132dc1).
    MUNI_T2: 'https://static.data.gouv.fr/resources/elections-municipales-2026-resultats-du-scond-tour/20260323-180124/municipales-2026-resultats-communes-2026-03-23-16h14.csv',
    # Grille communale de densité 2025 (Insee, mise en ligne le 21/07/2025, géographie au 01/01/2025) : type
    # d'environnement (D10 de cadre-de-vie), feuille « Maille communale », colonne DENS7.
    'densite/fichier_diffusion_2025.xlsx': 'https://www.insee.fr/fr/statistiques/fichier/8571524/fichier_diffusion_2025.xlsx',
    # Zone de montagne (cadre-de-vie, source B retenue en tâche 0) : Cerema, « Application des dispositions d'urbanisme
    # de la loi Montagne en France Métropolitaine », communes au 1er janvier 2019 (Licence Ouverte 2.0) ; 7z.
    CEREMA + '/l-commune-loimontagne85-000-2019.7z': CEREMA_URL + '20241112-090411/l-commune-loimontagne85-000-2019.7z',
    # Emploi (voir BMO plus haut). Le serveur des bassins redirige vers images.pr-rooms.com (suivi par urllib).
    BMO: 'https://www.francetravail.org/files/live/sites/peorg/files/documents/Statistiques-et-analyses/Open-data/BMO/Base-open-data-BMO-2026.xlsx',
    BASSINS: 'https://statistiques.francetravail.org/bmo/Handlers/HTFile.ashx?MEDIAID=188096',
    CHOMAGE: 'https://www.insee.fr/fr/statistiques/fichier/1893230/chomage-zone-t1-2003-t2-2026.xlsx',
    ZE: 'https://www.insee.fr/fr/statistiques/fichier/4652957/ZE2020_au_01-01-2025.zip',
    MVT_2026: 'https://www.insee.fr/fr/statistiques/fichier/8740222/v_mvt_commune_2026.csv',
    # Codes postaux (voir CODES_POSTAUX plus haut).
    CODES_POSTAUX: 'https://data.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal/raw',
}
# Même jeu : zones infra-communales des communes classées en partie, une archive par département (34 départements).
for dep, date in ZINF.items():
    SOURCES[f'{CEREMA}/zinf/l-loimontagne85-zinf-{dep}.7z'] = f'{CEREMA_URL}{date}/l-loimontagne85-zinf-{dep}.7z'


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        while chunk := f.read(1 << 20):
            h.update(chunk)
    return h.hexdigest()


def lire_api(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'carte-ou-vivre (donnees ouvertes)', 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def services():
    """H165, H170, H171 : lit l'API de data.gouv.fr (sans télécharger les fichiers) et les empreintes des deux fichiers
    déjà dans data-raw/ ; compare aux valeurs retenues ; écrit data-raw/services-sources.info.json si tout est égal."""
    def check(cond, msg):
        print(('  ok   ' if cond else '  ÉCHEC ') + msg)
        if not cond:
            raise SystemExit(1)

    print(f'services : lecture de {SERVICES_API}')
    jeu = lire_api(SERVICES_API)
    check(jeu.get('id') == SERVICES_JEU and jeu.get('license') == 'lov2', f"jeu {jeu.get('id')}, licence {jeu.get('license')} (Licence Ouverte 2.0)")
    par_titre = {}
    for res in jeu.get('resources', []):
        par_titre.setdefault(res.get('title'), []).append(res)
    fichiers = []
    for reg, (url, octets, sha1, date) in SERVICES_FICHIERS.items():
        titre = f'donnees_2025_reg{reg}.parquet'
        res = par_titre.get(titre, [])
        check(len(res) == 1, f'{titre} : une seule ressource de ce nom ({len(res)})')
        res = res[0]
        lu = (res.get('url'), res.get('filesize'), (res.get('checksum') or {}).get('value'), (res.get('last_modified') or '')[:10])
        print(f'  {titre} : {lu[1]} octets, SHA-1 {lu[2]}, mis en ligne le {lu[3]}')
        check((res.get('checksum') or {}).get('type') == 'sha1', f'{titre} : somme publiée de type SHA-1')
        check(lu == (url, octets, sha1, date), f'{titre} : adresse, taille, SHA-1 et date égales à celles retenues (/spec)')
        fichiers.append({'region': reg, 'titre': titre, 'url': lu[0], 'octets': lu[1], 'sha1': lu[2], 'mis_en_ligne': res.get('last_modified')})
    total = sum(f['octets'] for f in fichiers)
    check(len(fichiers) == 13 and round(total / 1e9, 2) == SERVICES_TOTAL_GO, f'13 fichiers, {total} octets au total = {total / 1e9:.2f} Go (attendu {SERVICES_TOTAL_GO})')
    dates = {f['mis_en_ligne'][:10] for f in fichiers}
    check(dates == SERVICES_DATES, f'dates de mise en ligne {sorted(dates)} = {sorted(SERVICES_DATES)}')
    autres = sorted(t for t in par_titre if t and t.startswith('donnees_2025_reg') and t[16:18] not in SERVICES_FICHIERS)
    print(f'  hors métropole, non lus : {autres}')

    locaux = {}
    for cle, nom, attendu in (('sncf', SNCF, SNCF_SHA256), ('ors', ORS, ORS_SHA256)):
        path = os.path.join(RAW, nom)
        check(os.path.isfile(path), f'{nom} présent dans data-raw/ (jamais retéléchargé)')
        empreinte = sha256(path)
        print(f'  {nom} : {os.path.getsize(path)} octets, sha256 {empreinte}')
        check(empreinte == attendu, f'{nom} : sha256 égal à celui retenu')
        locaux[cle] = {'fichier': nom, 'octets': os.path.getsize(path), 'sha256': empreinte}
    locaux['sncf']['version'] = '2026-11-22'

    info = {'jeu': SERVICES_JEU, 'api': SERVICES_API, 'licence': 'Licence Ouverte 2.0',
            'lu_le': datetime.datetime.now().astimezone().isoformat(timespec='seconds'),
            'total_octets': total, 'fichiers': fichiers, **locaux}
    with open(os.path.join(RAW, SERVICES_INFO), 'w', encoding='utf-8') as f:
        json.dump(info, f, indent=1, ensure_ascii=False)
    print(f'  écrit : data-raw/{SERVICES_INFO}')


def licence_codes_postaux():
    """D2, tâche 0a de recherche-et-mer : la licence de la base des codes postaux, relue et datée sur data.gouv.fr et sur
    data.laposte.fr, et la date des données, ajoutées à <fichier>.info.json. Le fichier téléchargé doit être celui que
    décrit La Poste (même md5). Rien n'est écrit si un contrôle échoue (relu par codes_postaux.py)."""
    path = os.path.join(RAW, CODES_POSTAUX)
    info = json.load(open(path + '.info.json'))
    if 'licence' in info:
        print(f"  {CODES_POSTAUX} : licence déjà relue le {info['licence_lue_le']} ({info['licence']})")
        return
    jeu = lire_api(CODES_POSTAUX_JEU)
    meta = lire_api(CODES_POSTAUX_META)
    md5 = hashlib.md5(open(path, 'rb').read()).hexdigest()
    lu = {'data.gouv.fr': jeu.get('license'), 'data.laposte.fr': (meta.get('license') or {}).get('title'),
          'producteur': (jeu.get('organization') or {}).get('name'), 'md5 La Poste': (meta.get('file') or {}).get('md5'),
          'md5 du fichier': md5, 'données mises à jour': meta.get('dataUpdatedAt'), 'lignes': meta.get('count')}
    print(f'  {CODES_POSTAUX} : {lu}')
    if lu['data.gouv.fr'] != 'lov2' or lu['data.laposte.fr'] != 'Licence Ouverte / Open Licence' or lu['md5 La Poste'] != md5:
        raise SystemExit(f'ARRET : licence autre que la Licence Ouverte, ou fichier différent de celui que décrit La Poste : {lu}')
    info.update({'licence': 'Licence Ouverte 2.0 (data.gouv.fr : lov2 ; data.laposte.fr : « Licence Ouverte / Open Licence »)',
                 'licence_lue_le': datetime.datetime.now().astimezone().isoformat(timespec='seconds'),
                 'producteur': lu['producteur'], 'donnees_mises_a_jour': lu['données mises à jour'], 'lignes': lu['lignes'],
                 'md5': md5, 'jeu': CODES_POSTAUX_JEU, 'metadonnees': CODES_POSTAUX_META})
    with open(path + '.info.json', 'w') as f:
        json.dump(info, f, indent=1, ensure_ascii=False)
    print(f'  licence relue et notée dans data-raw/{CODES_POSTAUX}.info.json')


def main():
    if '--services' in sys.argv:  # seulement les sources des services (rien n'est téléchargé)
        services()
        return
    os.makedirs(RAW, exist_ok=True)
    sources = SOURCES
    if '--codes-postaux' in sys.argv:  # seulement la base des codes postaux (tâche 0a de recherche-et-mer)
        sources = {CODES_POSTAUX: SOURCES[CODES_POSTAUX]}
    for name, url in sources.items():
        path = os.path.join(RAW, name)
        if os.path.exists(path):
            print(f'déjà là : {name}')
            continue
        print(f'téléchargement : {name}')
        os.makedirs(os.path.dirname(path), exist_ok=True)
        req = urllib.request.Request(url, headers={'User-Agent': 'carte-ou-vivre (donnees ouvertes)'})
        sha = hashlib.sha256()
        with urllib.request.urlopen(req) as r, open(path + '.part', 'wb') as f:
            modifie = r.headers.get('Last-Modified')
            while chunk := r.read(1 << 20):
                f.write(chunk)
                sha.update(chunk)
        os.replace(path + '.part', path)
        if name in NOTES:
            info = {'url': url, 'telecharge_le': datetime.datetime.now().astimezone().isoformat(timespec='seconds'),
                    'last_modified': modifie, 'octets': os.path.getsize(path), 'sha256': sha.hexdigest()}
            with open(path + '.info.json', 'w') as f:
                json.dump(info, f, indent=1)
            print(f'  {name} : {info}')
    licence_codes_postaux()
    if '--codes-postaux' in sys.argv:
        return
    ltm = os.path.join(RAW, 'Limite_terre_mer_France_metropolitaine')
    if not os.path.isdir(ltm):
        print('extraction de la limite terre-mer (bsdtar)')
        subprocess.run(['bsdtar', '-xf', 'Limite_terre_mer_France_metropolitaine.7z'], cwd=RAW, check=True)
    # Cerema : la couche des communes dans cerema/communes/, chaque zone infra-communale à côté de son archive.
    archives = [(f'{CEREMA}/l-commune-loimontagne85-000-2019.7z', f'{CEREMA}/communes', 'l_commune_loimontagne85_000_2019.shp')]
    archives += [(f'{CEREMA}/zinf/l-loimontagne85-zinf-{dep}.7z', f'{CEREMA}/zinf', f'l_loimontagne85_zinf_{dep}.shp') for dep in ZINF]
    for archive, dossier, shp in archives:
        if not os.path.exists(os.path.join(RAW, dossier, shp)):
            print(f'extraction de {archive} (bsdtar)')
            os.makedirs(os.path.join(RAW, dossier), exist_ok=True)
            subprocess.run(['bsdtar', '-xf', os.path.abspath(os.path.join(RAW, archive))], cwd=os.path.join(RAW, dossier), check=True)
    for name in sorted(os.listdir(RAW)):
        p = os.path.join(RAW, name)
        if os.path.isfile(p):
            print(f'  {name} : {os.path.getsize(p) / 1e6:.1f} Mo')


if __name__ == '__main__':
    main()
