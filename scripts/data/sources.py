"""Téléchargement des sources brutes dans data-raw/ (non versionné). Lectures seulement, rien n'est envoyé.

Usage : python3 scripts/data/sources.py  (ne retélécharge pas un fichier déjà présent)
Sources, licences et mentions : CLAUDE.md (Données).
"""
import os
import subprocess
import urllib.request

RAW = os.path.join(os.path.dirname(__file__), '..', '..', 'data-raw')

SOURCES = {
    # COG 2025 (Insee) : communes au 1er janvier 2025.
    'v_commune_2025.csv': 'https://www.insee.fr/fr/statistiques/fichier/8377162/v_commune_2025.csv',
    # Carte des loyers 2025 (ANIL), appartements, €/m² charges comprises, logement de référence 52 m².
    'pred-app-mef-dhup.csv': 'https://static.data.gouv.fr/resources/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025/20251211-145010/pred-app-mef-dhup.csv',
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
}


def main():
    os.makedirs(RAW, exist_ok=True)
    for name, url in SOURCES.items():
        path = os.path.join(RAW, name)
        if os.path.exists(path):
            print(f'déjà là : {name}')
            continue
        print(f'téléchargement : {name}')
        req = urllib.request.Request(url, headers={'User-Agent': 'carte-ou-vivre (donnees ouvertes)'})
        with urllib.request.urlopen(req) as r, open(path + '.part', 'wb') as f:
            while chunk := r.read(1 << 20):
                f.write(chunk)
        os.replace(path + '.part', path)
    ltm = os.path.join(RAW, 'Limite_terre_mer_France_metropolitaine')
    if not os.path.isdir(ltm):
        print('extraction de la limite terre-mer (bsdtar)')
        subprocess.run(['bsdtar', '-xf', 'Limite_terre_mer_France_metropolitaine.7z'], cwd=RAW, check=True)
    for name in sorted(os.listdir(RAW)):
        p = os.path.join(RAW, name)
        if os.path.isfile(p):
            print(f'  {name} : {os.path.getsize(p) / 1e6:.1f} Mo')


if __name__ == '__main__':
    main()
