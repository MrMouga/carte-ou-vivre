"""Sonde jetable (tâche 0a d'emploi) : Yvrench (80832), absente de la table des bassins sans aucun mouvement du COG.
1) ses 8 voisines les plus proches (mairie à mairie) et leurs bassins, zones ;
2) emploi.py lancé en entier avec Yvrench rattachée provisoirement au bassin de sa voisine la plus proche, sortie écrite
   dans le dossier donné (jamais dans public/data) : pour voir tous les autres contrôles.
Usage : python3 -I docs/plans/2026-11-21-emploi/captures/T0a-sonde-yvrench.py <dossier de sortie>
(lancée le 2026-11-21 depuis scripts/, sortie : T0a-controles-sonde-yvrench.txt)"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..', 'scripts', 'data'))
import emploi  # noqa: E402
from communes import feuille_xlsx  # noqa: E402

RAW = emploi.RAW
CIBLE = '80832'
carte = json.load(open(os.path.join(emploi.OUT, 'communes.json'), encoding='utf-8'))
reperes = json.load(open(os.path.join(emploi.OUT, 'reperes.json'), encoding='utf-8'))['reperes']
codes = [r[0] for r in carte['communes']]
nom = {r[0]: r[1] for r in carte['communes']}
pop = {r[0]: r[3] for r in carte['communes']}
pt = {c: reperes[i][:2] for i, c in enumerate(codes)}
table = emploi.lire_bassins_table()
zones = emploi.lire_zones()


def km(a, b):
    (lo1, la1), (lo2, la2) = pt[a], pt[b]
    p1, p2 = math.radians(la1), math.radians(la2)
    h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lo2 - lo1) / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(h))


proches = sorted((km(CIBLE, c), c) for c in codes if c != CIBLE)[:8]
print(f'{nom[CIBLE]} ({CIBLE}), {pop[CIBLE]} hab., zone d\'emploi {zones.get(CIBLE)} :')
for d, c in proches:
    print(f'  {d:5.1f} km  {nom[c]} ({c}) bassin {table.get(c)} zone {zones.get(c)}')

voisine = proches[0][1]
recalage_vrai = emploi.recalage


def recalage_sonde(code, table, mvt):
    if code == CIBLE:
        print(f'  SONDE : {nom[CIBLE]} rattachée provisoirement à {nom[voisine]} ({voisine}), bassin {table[voisine]}')
        return voisine, ['sonde']
    return recalage_vrai(code, table, mvt)


emploi.recalage = recalage_sonde
os.makedirs(sys.argv[1], exist_ok=True)
emploi.ecrire = lambda nom_fichier: os.path.join(sys.argv[1], nom_fichier)
emploi.main()
