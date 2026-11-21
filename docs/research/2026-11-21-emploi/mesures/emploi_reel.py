import csv, json, sys, collections, math
bmo, bas, com, rep = sys.argv[1:5]
rows=[r for r in csv.DictReader(open(bmo,encoding="utf-8")) if not r["Dept"].startswith("97")]
print("départements Corse dans BMO:", sorted({r["Dept"] for r in rows if r["Dept"].startswith("2")})[:5])
tab={r["code_commune"].zfill(5):r["code_bassin_2026"] for r in csv.DictReader(open(bas,encoding="utf-8"))}
d=json.load(open(com,encoding="utf-8")); C=d["communes"]; F=d["champs"]
pts=json.load(open(rep,encoding="utf-8"))["reperes"]
ic,inom,ip=F.index("code"),F.index("nom"),F.index("population")
PLM={"75056":"1107","69123":"8428","13055":"9306"}
bc={}
for i,c in enumerate(C):
    b=PLM.get(c[ic]) or tab.get(c[ic])
    if b: bc[i]=b
# ville principale: plus peuplée, puis plus petit code
best={}
for i,b in bc.items():
    k=(-(C[i][ip] or 0), C[i][ic])
    if b not in best or k<best[b][0]: best[b]=(k,i)
princ={b:i for b,(k,i) in best.items()}
nomb={r["BE26"]:r["NOMBE26"] for r in rows}
print("bassins avec ville principale:", len(princ), "· ex.", [(nomb.get(b,b), C[i][inom]) for b,i in list(princ.items()) if nomb.get(b) in ("BORDEAUX","BEARN","LA ROCHELLE","T1 Paris","LYON CENTRE")])
B=sorted(nomb)  # 389
def tiers(m):
    v=collections.Counter(); has=set()
    for r in rows:
        if r["Code métier BMO"]==m and r["met"]!="*": v[r["BE26"]]+=int(r["met"]); has.add(r["BE26"])
    s=sorted(v.values(),reverse=True); out={}
    for p in (10,25):
        k=math.floor(len(B)*p/100+0.5); seuil=s[k-1] if k<=len(s) else s[-1]
        out[p]={b for b in has if v[b]>=seuil}
    out["tous"]=has
    return out,v
def hav(a,b):
    lo1,la1=map(math.radians,pts[a][:2]); lo2,la2=map(math.radians,pts[b][:2])
    h=math.sin((la2-la1)/2)**2+math.cos(la1)*math.cos(la2)*math.sin((lo2-lo1)/2)**2
    return 2*6371.0088*math.asin(math.sqrt(h))
for m in ("M2X90","V1X80"):
    t,v=tiers(m)
    for p in (10,25,"tous"):
        qual=[princ[b] for b in t[p] if b in princ]
        n=0
        for i in range(len(C)):
            if any(max(1,round(hav(i,j)))<=30 or i==j for j in qual): n+=1
        print(f"{m} niveau {p}: {len(t[p])} bassins · communes à ≤ 30 km d'une ville principale : {n} / {len(C)}")
    for nm in ("BORDEAUX","LA ROCHELLE","BEARN"):
        b=[x for x in nomb if nomb[x]==nm][0]
        lvl=next((p for p in (10,25,"tous") if b in t[p]),None)
        print(f"   {nm}: {v.get(b,'—')} projets · niveau {lvl}")

# scénario « C'est réussi si »
idx={C[i][ic]:i for i in range(len(C))}
def verdict(code, m, p):
    t,v=tiers(m); i=idx[code]
    q=sorted(((max(1,round(hav(i,princ[b]))) if i!=princ[b] else 0, nomb[b], C[princ[b]][inom]) for b in t[p] if b in princ))
    return q[0]
for code,nm in (("33063","Bordeaux"),("64445","Pau"),("17300","La Rochelle")):
    for m in ("V1X80","M2X90"):
        print(nm, m, "10 % → plus proche :", verdict(code,m,10))
