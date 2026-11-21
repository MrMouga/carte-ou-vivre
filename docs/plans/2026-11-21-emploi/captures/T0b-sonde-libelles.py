"""Tâche 0b d'emploi — sonde jetable : libellé du fichier BMO (NOMBE26) des bassins des tableaux, pour aider Vincent à
lire une ville principale inattendue (le site nomme un bassin par sa ville principale, H135, jamais par ce libellé).
Lancer depuis la racine : python3 docs/plans/2026-11-21-emploi/captures/T0b-sonde-libelles.py
"""
import json
import os
import sys

RACINE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
sys.path.insert(0, os.path.join(RACINE, 'scripts', 'data'))
from emploi import lire_bmo  # noqa: E402  (lecture du script de la tâche 0a ; ses contrôles s'affichent sur stderr ou stdout)

_, _, libelle = lire_bmo()
emploi = json.load(open(os.path.join(RACINE, 'public', 'data', 'emploi.json'), encoding='utf-8'))
communes = json.load(open(os.path.join(RACINE, 'public', 'data', 'communes.json'), encoding='utf-8'))['communes']
nom = {c[0]: (c[1], c[3]) for c in communes}
habitants = {}
for code, bassin, _ in emploi['communes']:
    habitants[bassin] = habitants.get(bassin, 0) + nom[code][1]
for code, ville in emploi['bassins']:
    v = nom[ville] if ville else ('—', 0)
    print(f'{code}\t{v[0]}\t{v[1]}\t{libelle.get(code)}\t{habitants.get(code, 0)}')
