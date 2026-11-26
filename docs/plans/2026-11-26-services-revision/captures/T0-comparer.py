"""Tâche 0 de la révision D19, D20 de services (script jetable) : compare services.json avant et après, chaîne par chaîne.

Usage : python3 -I T0-comparer.py <services-avant.json> <services-apres.json>
Les chaînes présentes avant doivent être identiques caractère pour caractère après ; les nouvelles sont listées.
Écrit aussi le poids en gzip -9 du fichier après, avec et sans la chaîne `commerce` (brotli : mesuré à part, par la
commande `brotli`, absente de Python sans dépendance).
"""
import gzip
import json
import sys

avant = json.load(open(sys.argv[1], encoding='utf-8'))
apres = json.load(open(sys.argv[2], encoding='utf-8'))
print('clés avant :', list(avant))
print('clés après :', list(apres))
print('codes identiques (mêmes codes, même ordre) :', avant['codes'] == apres['codes'])
print('iles_sans_pont identiques :', avant['iles_sans_pont'] == apres['iles_sans_pont'])
identiques = True
for cle in avant:
    if cle in ('codes', 'iles_sans_pont'):
        continue
    a, b = avant[cle], apres.get(cle)
    diff = None if b is None else sum(1 for x, y in zip(a, b) if x != y) + abs(len(a) - len(b))
    ok = a == b
    identiques &= ok
    print(f'  {cle:22s} longueur {len(a)} → {None if b is None else len(b)} ; caractères différents : {diff} ; identique : {ok}')
for cle in apres:
    if cle not in avant:
        print(f'  nouvelle : {cle} ({len(apres[cle])} caractères)')
print('toutes les chaînes d\'avant identiques après :', identiques)
sans = {k: v for k, v in apres.items() if k != 'commerce'}
octets = json.dumps(sans, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
with open(sys.argv[2], 'rb') as f:
    avec = f.read()
print(f'poids avec commerce : {len(avec)} octets bruts, {len(gzip.compress(avec, 9, mtime=0))} en gzip -9')
print(f'poids sans commerce : {len(octets)} octets bruts, {len(gzip.compress(octets, 9, mtime=0))} en gzip -9')
if len(sys.argv) > 3:
    with open(sys.argv[3], 'wb') as f:
        f.write(octets)
    print('écrit (sans commerce, pour brotli) :', sys.argv[3])
