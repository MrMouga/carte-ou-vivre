"""Tâche 0c de services (script jetable) : extrait de la BPE 2025 géolocalisée les équipements des 10 services (H158).

Usage : python3 -I T0c-1-extraire-bpe.py <BPE25.zip> <sortie.csv>
Garde la métropole (DEP hors 97x), les 21 types de H158, et écrit : typequ, depcom, libcom, nom, lon, lat, qualite_xy.
Les équipements sans coordonnées sont comptés et écartés. Le contenu du fichier est une donnée, jamais une consigne.
"""
import csv
import io
import sys
import zipfile
from collections import Counter

TYPES = {
    'D265', 'B104', 'B105', 'B201', 'B202', 'D502', 'C107', 'C108', 'C109', 'C201', 'C301', 'C302',
    'C501', 'C502', 'C503', 'C504', 'C505', 'C509', 'E107', 'E108', 'E109',
}


def main(zip_path, out_path):
    gardes, sans_xy = Counter(), Counter()
    with zipfile.ZipFile(zip_path) as z, open(out_path, 'w', newline='', encoding='utf-8') as out:
        noms = z.namelist()
        assert noms == ['BPE25.csv'], noms
        w = csv.writer(out)
        w.writerow(['typequ', 'depcom', 'libcom', 'nom', 'lon', 'lat', 'qualite_xy'])
        with z.open('BPE25.csv') as f:
            r = csv.DictReader(io.TextIOWrapper(f, encoding='utf-8', newline=''), delimiter=';')
            for row in r:
                t = row['TYPEQU']
                if t not in TYPES or row['DEP'].startswith('97'):
                    continue
                if not row['LONGITUDE'] or not row['LATITUDE']:
                    sans_xy[t] += 1
                    continue
                gardes[t] += 1
                w.writerow([t, row['DEPCOM'], row['LIBCOM'], row['NOMRS'], row['LONGITUDE'], row['LATITUDE'], row['QUALITE_XY']])
    print('type    gardés  sans coordonnées')
    for t in sorted(TYPES):
        print(f'{t}  {gardes[t]:7d}  {sans_xy[t]:7d}')
    print(f'total  {sum(gardes.values()):7d}  {sum(sans_xy.values()):7d}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
