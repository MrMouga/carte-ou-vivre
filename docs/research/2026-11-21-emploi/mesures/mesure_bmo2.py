import csv, sys, collections
rows = [r for r in csv.DictReader(open(sys.argv[1], encoding="utf-8")) if not r["Dept"].startswith("97")]
g = collections.defaultdict(list)
for r in rows: g[(r["BE26"], r["Code métier BMO"])].append(r)
d = [v for v in g.values() if len(v) > 1]
print("exemple doublon:", [(x["Dept"], x["clpe"], x["NOMBE26"], x["met"]) for x in d[0]])
print("doublons dus au département:", sum(1 for v in d if len({x["Dept"] for x in v}) > 1), "· à la clpe seule:", sum(1 for v in d if len({x["Dept"] for x in v}) == 1))
# niveau couple : masqué si au moins une ligne * et aucune valeur
bass = {r["BE26"] for r in rows}; mets = {r["Code métier BMO"] for r in rows}
masq = sum(1 for v in g.values() if all(x["met"].strip() == "*" for x in v))
part = sum(1 for v in g.values() if any(x["met"].strip() == "*" for x in v) and not all(x["met"].strip() == "*" for x in v))
tot = len(bass) * len(mets)
print(f"couples possibles {tot} · avec chiffre {len(g)-masq} ({100*(len(g)-masq)/tot:.1f} %) · tout masqué {masq} ({100*masq/tot:.1f} %) · absents {tot-len(g)} ({100*(tot-len(g))/tot:.1f} %) · partiellement masqués {part}")
def show(nomb, codes):
    for code in codes:
        vs = [(x["NOMBE26"], x["met"], x["xmet"], x["smet"]) for k, v in g.items() if k[1] == code for x in v if nomb in x["NOMBE26"]]
        print(" ", code, nomb, vs or "absent")
for b in ("BORDEAUX", "ROCHELLE", "NANTES", "PARIS", "MAURIAC", "TOULON"):
    show(b, ["M2X90", "V1X80", "L5X90", "S2X61" ])
print("bassins de Paris:", sorted({r["NOMBE26"] for r in rows if r["Dept"] == "75"}))
print("bassins du 33:", sorted({r["NOMBE26"] for r in rows if r["Dept"] == "33"}))
