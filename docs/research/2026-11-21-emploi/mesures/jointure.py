import csv, json, sys, collections
d = json.load(open(sys.argv[1], encoding="utf-8")); i = d["champs"].index("code")
nos = {c[i]: c for c in d["communes"]}
tab = list(csv.DictReader(open(sys.argv[2], encoding="utf-8")))
cb = collections.defaultdict(set)
for r in tab: cb[r["code_commune"].zfill(5)].add(r["code_bassin_2026"])
print("nos communes", len(nos), "· table", len(tab), "lignes,", len(cb), "codes")
manq = [c for c in nos if c not in cb]
print("nos communes absentes de la table", len(manq), manq[:15])
print("communes à plusieurs bassins", sum(1 for c in nos if len(cb.get(c, ())) > 1))
for plm in ("75056", "69123", "13055"):
    arr = sorted({b for k, v in cb.items() if k[:3] == plm[:3] and k[2:4] in ("10", "38", "21") for b in v})
    print(plm, "table directe:", cb.get(plm), "· arrondissements -> bassins:", arr[:10])
# bassins de la table vs bassins du fichier BMO
bmo = list(csv.DictReader(open(sys.argv[3], encoding="utf-8")))
bb = {r["BE26"] for r in bmo if not r["Dept"].startswith("97")}
tb = {b for c in nos for b in cb.get(c, ())}
print("bassins métropole BMO", len(bb), "· bassins de nos communes", len(tb), "· de nos communes absents du BMO", sorted(tb - bb)[:10], "· BMO sans commune", sorted(bb - tb)[:10])
