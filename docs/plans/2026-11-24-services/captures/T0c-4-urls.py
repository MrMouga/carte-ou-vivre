"""Tâche 0c de services (script jetable) : affiche la requête IGN retenue de quelques lignes, pour les refaire à la main.

Usage : python3 -I T0c-4-urls.py <T0c-mesure.json> <code:service> [<code:service> ...]
"""
import json
import sys

m = json.load(open(sys.argv[1], encoding='utf-8'))
for cible in sys.argv[2:]:
    code, service = cible.split(':')
    r = next(x for x in m['resultats'] if x['code'] == code and x['service'] == service)
    e = r['retenu']
    print(f"{r['commune']} · {service} · site {r['site']} · IGN {e['ign']['duree']:.2f} min, {e['ign']['distance']:.2f} km "
          f"· vers {e['commune']} ({e['type']}) · version {e['ign'].get('version')} · {e['ign']['heure']}")
    print(e['ign']['url'])
