"""Téléchargement des sources brutes dans data-raw/ (non versionné). Lectures seulement, rien n'est envoyé.

Usage : python3 scripts/data/sources.py  (ne retélécharge pas un fichier déjà présent)
Sources, licences et mentions : CLAUDE.md (Données).
"""
import datetime
import hashlib
import json
import os
import subprocess
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
NOTES = (DVF, DVF_MOIS, MUNI_T1, MUNI_T2)

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
}
# Même jeu : zones infra-communales des communes classées en partie, une archive par département (34 départements).
for dep, date in ZINF.items():
    SOURCES[f'{CEREMA}/zinf/l-loimontagne85-zinf-{dep}.7z'] = f'{CEREMA_URL}{date}/l-loimontagne85-zinf-{dep}.7z'


def main():
    os.makedirs(RAW, exist_ok=True)
    for name, url in SOURCES.items():
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
