"""Tâche 0b d'emploi — sonde jetable : bassins dont la ville principale (H135 : la commune la plus peuplée) est loin du
cœur du bassin. Pour chaque bassin : part de la population du bassin qui vit dans le département de sa ville principale,
et distance de la ville principale au barycentre (pondéré par la population) des mairies du bassin.
Lancer depuis la racine : python3 docs/plans/2026-11-21-emploi/captures/T0b-sonde-villes-ecartees.py
"""
import collections
import json
import math
import os
import sys

RACINE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
sys.path.insert(0, os.path.join(RACINE, 'scripts', 'data'))
from emploi import lire_bmo  # noqa: E402

_, _, libelle = lire_bmo()
lire = lambda f: json.load(open(os.path.join(RACINE, 'public', 'data', f), encoding='utf-8'))
communes = lire('communes.json')['communes']
reperes = lire('reperes.json')['reperes']
emploi = lire('emploi.json')
info = {c[0]: (c, reperes[i]) for i, c in enumerate(communes)}


def km(a, b):
    r = math.radians
    h = math.sin(r(b[1] - a[1]) / 2) ** 2 + math.cos(r(a[1])) * math.cos(r(b[1])) * math.sin(r(b[0] - a[0]) / 2) ** 2
    return 2 * 6371 * math.asin(min(1, math.sqrt(h)))


par_bassin = collections.defaultdict(list)
for code, bassin, _ in emploi['communes']:
    par_bassin[bassin].append(code)
lignes = []
for b, ville in emploi['bassins']:
    if not ville:
        continue
    membres = par_bassin[b]
    pop = sum(info[c][0][3] for c in membres)
    dep_ville = info[ville][0][2]
    part = sum(info[c][0][3] for c in membres if info[c][0][2] == dep_ville) / pop
    lon = sum(info[c][1][0] * info[c][0][3] for c in membres) / pop
    lat = sum(info[c][1][1] * info[c][0][3] for c in membres) / pop
    d = km(info[ville][1][:2], (lon, lat))
    lignes.append((d, b, libelle.get(b), info[ville][0][1], dep_ville, round(100 * part), len(membres)))
print('bassin\tlibellé BMO\tville principale (dép.)\tpart de la population dans ce département\tdistance au barycentre')
for d, b, lib, nom, dep, part, n in sorted(lignes, reverse=True)[:15]:
    print(f'{b}\t{lib}\t{nom} ({dep})\t{part} %\t{d:.0f} km\t{n} communes')
print('bassins dont la ville principale est dans un département qui a moins de la moitié de la population du bassin :',
      [(b, lib, nom) for d, b, lib, nom, dep, part, n in lignes if part < 50])
