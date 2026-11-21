import csv, sys, collections
rows = [r for r in csv.DictReader(open(sys.argv[1], encoding="utf-8")) if not r["Dept"].startswith("97")]
B = len({r["BE26"] for r in rows})
def couverture(cle):
    g = collections.defaultdict(lambda: collections.defaultdict(list))
    for r in rows: g[cle(r)][r["BE26"]].append(r["met"].strip())
    out = {}
    for k, bs in g.items():
        chiffre = sum(1 for v in bs.values() if any(x != "*" for x in v))
        out[k] = chiffre
    return out
m = couverture(lambda r: r["Code métier BMO"])
noms = {r["Code métier BMO"]: r["Nom métier BMO"] for r in rows}
s = sorted(m.values())
print(f"{B} bassins · par métier, bassins avec un chiffre : min {s[0]}, médiane {s[len(s)//2]}, max {s[-1]} ; métiers chiffrés dans ≥ la moitié des bassins : {sum(1 for v in s if v >= B/2)} / {len(s)}")
for c in ("M2X90", "M1X80", "V1X80", "L5X90", "L1X60", "W0X80", "R4X91", "J3X40"):
    if c in m: print(f"  {c} {noms[c][:70]} : {m[c]} / {B}")
g3 = couverture(lambda r: r["Code métier BMO"][:3]); s3 = sorted(g3.values())
print(f"par groupe (3 car., {len(s3)}) : min {s3[0]}, médiane {s3[len(s3)//2]}, max {s3[-1]} ; groupes chiffrés dans ≥ la moitié : {sum(1 for v in s3 if v >= B/2)} / {len(s3)}")
g1 = couverture(lambda r: r["Code métier BMO"][0]); s1 = sorted(g1.values())
print(f"par domaine (1 lettre, {len(s1)}) : min {s1[0]}, médiane {s1[len(s1)//2]}, max {s1[-1]}")
