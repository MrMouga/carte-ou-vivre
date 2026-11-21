"""Sonde : la table des bassins 2026 (licence non trouvée) peut-elle se refaire par commune -> CLPE (référentiel
France Travail, Licence Ouverte 2.0, data.gouv) puis CLPE -> bassin (lignes du fichier BMO 2026, Licence Ouverte) ?
Usage : python3 -I clpe_probe.py <repo> <bmo.xlsx> <bassins.xlsx> <clpe.csv>"""
import collections
import csv
import json
import sys

repo, bmo_x, bas_x, clpe_csv = sys.argv[1:5]
sys.path.insert(0, repo + '/scripts/data')
from communes import feuille_xlsx  # noqa: E402

bmo = feuille_xlsx(bmo_x, 'BMO_2026_open_data')
tete = bmo[0]
col = {v: k for k, v in tete.items()}
print('colonnes BMO', list(tete.values()))
clpe_bassins = collections.defaultdict(set)
for r in bmo[1:]:
    dep = r.get(col['Dept'], '')
    if dep.startswith('97'):
        continue
    clpe_bassins[r.get(col['clpe'], '')].add(r.get(col['BE26'], ''))
print('CLPE de métropole dans le BMO', len(clpe_bassins), 'dont à plusieurs bassins',
      sum(1 for v in clpe_bassins.values() if len(v) > 1))
print('exemples de CLPE à plusieurs bassins', [(k, sorted(v)) for k, v in clpe_bassins.items() if len(v) > 1][:10])
print('exemples de codes clpe', list(clpe_bassins)[:5])

bas = feuille_xlsx(bas_x, 'Feuil1')
bc = {v: k for k, v in bas[0].items()}
table = {r[bc['code_commune']].zfill(5): r[bc['code_bassin_2026']] for r in bas[1:] if r.get(bc['code_commune'])}

ref = {}
with open(clpe_csv, encoding='utf-8') as f:
    for r in csv.DictReader(f, delimiter=';'):
        ref[r['CODE_COMMUNE'].zfill(5)] = r['CODE']
print('référentiel CLPE', len(ref), 'communes', len(set(ref.values())), 'CLPE')

carte = json.load(open(repo + '/public/data/communes.json', encoding='utf-8'))
codes = [r[0] for r in carte['communes']]
ok = diff = sans = multi = 0
exemples = []
for c in codes:
    cl = ref.get(c)
    if cl is None:
        sans += 1
        continue
    bs = clpe_bassins.get(cl) or clpe_bassins.get(cl.replace('CLPE', ''))
    if not bs:
        sans += 1
        continue
    if len(bs) > 1:
        multi += 1
        continue
    b = next(iter(bs))
    if c in table:
        if table[c] == b:
            ok += 1
        else:
            diff += 1
            exemples.append((c, cl, b, table[c]))
print(f'communes de la carte : {len(codes)} ; même bassin que la table {ok}, autre bassin {diff}, CLPE à plusieurs bassins {multi}, sans CLPE ou CLPE hors BMO {sans}')
print('exemples de différences', exemples[:10])
