"""Tâche 0 de la révision D19, D20 de services (script jetable) : l'extrait refait avec D106 est-il, sans cette colonne,
identique ligne pour ligne à celui du 2026-11-24 ?

Usage : python3 -I T0-comparer-extraits.py <extrait-avant.csv.gz> <extrait-apres.csv.gz>
"""
import csv
import gzip
import sys

with gzip.open(sys.argv[1], 'rt', encoding='utf-8', newline='') as fa, gzip.open(sys.argv[2], 'rt', encoding='utf-8', newline='') as fb:
    ra, rb = csv.reader(fa), csv.reader(fb)
    ta, tb = next(ra), next(rb)
    print('en-tête avant :', ','.join(ta))
    print('en-tête après :', ','.join(tb))
    garder = [tb.index(c) for c in ta]
    print('colonnes ajoutées :', [c for c in tb if c not in ta])
    n = diff = 0
    exemples = []
    for la, lb in zip(ra, rb):
        n += 1
        if la != [lb[i] for i in garder]:
            diff += 1
            if len(exemples) < 5:
                exemples.append((la, lb))
    reste_a, reste_b = sum(1 for _ in ra), sum(1 for _ in rb)
print(f'lignes comparées : {n} ; différentes (hors colonnes ajoutées) : {diff} ; lignes en plus avant / après : {reste_a} / {reste_b}')
for la, lb in exemples:
    print('  avant', la)
    print('  après', lb)
