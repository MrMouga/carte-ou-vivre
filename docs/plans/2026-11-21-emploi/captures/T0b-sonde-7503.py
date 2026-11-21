"""Tâche 0b d'emploi — sonde jetable : départements des communes du bassin 7503 (« CONFOLENS » dans le fichier BMO,
ville principale Castelnau-de-Médoc dans emploi.json), et les plus peuplées.
Lancer depuis la racine : python3 docs/plans/2026-11-21-emploi/captures/T0b-sonde-7503.py
"""
import collections
import json
import os

RACINE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
emploi = json.load(open(os.path.join(RACINE, 'public', 'data', 'emploi.json'), encoding='utf-8'))
communes = json.load(open(os.path.join(RACINE, 'public', 'data', 'communes.json'), encoding='utf-8'))['communes']
info = {c[0]: c for c in communes}
for cible in ('7503', '7505', '7532'):
    dans = [info[code] for code, bassin, _ in emploi['communes'] if bassin == cible]
    print(cible, len(dans), 'communes ; par département :', dict(collections.Counter(c[2] for c in dans)))
    print('  plus peuplées :', [(c[1], c[2], c[3]) for c in sorted(dans, key=lambda c: -c[3])[:6]])
