"""Tâche 0b d'emploi — sonde jetable : lignes brutes de la table des bassins 2026 (France Travail) pour les communes de
Gironde rangées dans le bassin 7503 (« CONFOLENS ») et pour Confolens, et ce que le fichier BMO dit du bassin 7503.
Lancer depuis la racine : python3 docs/plans/2026-11-21-emploi/captures/T0b-sonde-table-bassins.py
"""
import json
import os
import sys

RACINE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
sys.path.insert(0, os.path.join(RACINE, 'scripts', 'data'))
from communes import feuille_xlsx  # noqa: E402
from emploi import colonnes  # noqa: E402

lignes = feuille_xlsx(os.path.join(RACINE, 'data-raw', 'bassins-emploi-2026.xlsx'), 'Feuil1')
c = colonnes(lignes, 0)
print('colonnes :', list(c))
emploi = json.load(open(os.path.join(RACINE, 'public', 'data', 'emploi.json'), encoding='utf-8'))
cibles = {code for code, bassin, _ in emploi['communes'] if bassin == '7503' and code.startswith('33')} | {'16106'}
for r in lignes[1:]:
    ligne = {k: r.get(v, '') for k, v in c.items()}
    if ligne['code_commune'].zfill(5) in cibles:
        print(ligne)
bmo = feuille_xlsx(os.path.join(RACINE, 'data-raw', 'Base-open-data-BMO-2026.xlsx'), 'BMO_2026_open_data')
cb = colonnes(bmo, 0)
vus = set()
for r in bmo[1:]:
    ligne = {k: r.get(v, '') for k, v in cb.items()}
    if ligne['BE26'] == '7503' and (ligne['clpe'], ligne['Dept']) not in vus:
        vus.add((ligne['clpe'], ligne['Dept']))
        print('BMO 7503 :', {k: ligne[k] for k in ('BE26', 'NOMBE26', 'clpe', 'Dept') if k in ligne}, {k: v for k, v in ligne.items() if 'clpe' in k.lower() or 'NOM' in k})
    if ligne['BE26'] == '7503' and ligne['Code métier BMO'] == 'V1X80':
        print('BMO 7503 V1X80 :', ligne)
