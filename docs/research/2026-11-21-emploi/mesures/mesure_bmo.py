import csv, sys, collections
rows = list(csv.DictReader(open(sys.argv[1], encoding="utf-8")))
met = [r for r in rows if not r["Dept"].startswith("97") and r["Dept"] not in ("976",)]
print("lignes total", len(rows), "· métropole", len(met))
depts = sorted({r["Dept"] for r in met}); print("départements", len(depts), depts[:3], depts[-3:])
bassins = {r["BE26"]: r["NOMBE26"] for r in met}; print("bassins métropole", len(bassins))
metiers = {r["Code métier BMO"]: r["Nom métier BMO"] for r in met}; print("métiers", len(metiers))
fams = {r["Famille_met"]: r["Lbl_fam_met"] for r in met}; print("familles", len(fams), fams)
# bassin sur plusieurs départements ?
bd = collections.defaultdict(set)
for r in met: bd[r["BE26"]].add(r["Dept"])
print("bassins sur >1 département", sum(1 for v in bd.values() if len(v) > 1))
# doublons bassin x métier
pairs = collections.Counter((r["BE26"], r["Code métier BMO"]) for r in met)
print("couples bassin×métier présents", len(pairs), "· doublons", sum(1 for v in pairs.values() if v > 1))
print("couples possibles", len(bassins) * len(metiers), "· part présente %.1f %%" % (100 * len(pairs) / (len(bassins) * len(metiers))))
star = sum(1 for r in met if r["met"].strip() == "*"); vide = sum(1 for r in met if r["met"].strip() == "")
print("met masqué *", star, "(%.1f %% des lignes)" % (100*star/len(met)), "· vide", vide)
vals = [int(float(r["met"])) for r in met if r["met"].strip() not in ("*", "")]
vals.sort(); print("met min/médiane/max", vals[0], vals[len(vals)//2], vals[-1], "· total projets métropole", sum(vals))
# projets par bassin
pb = collections.Counter()
for r in met:
    if r["met"].strip() not in ("*", ""): pb[r["BE26"]] += int(float(r["met"]))
s = sorted(pb.values()); print("projets par bassin min/médiane/max", s[0], s[len(s)//2], s[-1])
print("bassins les plus petits", [(bassins[b], n) for b, n in sorted(pb.items(), key=lambda x: x[1])[:5]])
# exemples : un métier de bureau / numérique
for code, nom in sorted(metiers.items()):
    if any(k in nom.lower() for k in ("informatique", "comptab", "infirmier", "enseign", "ingénieur")):
        print(" ", code, nom)
