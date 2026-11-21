import sys, zipfile, re, csv
import xml.etree.ElementTree as ET
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
src, out_prefix = sys.argv[1], sys.argv[2]
z = zipfile.ZipFile(src)
wb = ET.fromstring(z.read("xl/workbook.xml"))
print("feuilles:", [s.get("name") for s in wb.find("m:sheets", NS)])
ss = [ "".join(t.text or "" for t in si.iter("{%s}t" % NS["m"])) for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS)]
def col(ref):
    n = 0
    for ch in re.match(r"[A-Z]+", ref).group():
        n = n*26 + ord(ch)-64
    return n-1
for sheet in sorted(n[len("xl/worksheets/"):-4] for n in z.namelist() if n.startswith("xl/worksheets/sheet")):
    rows = []
    for ev, el in ET.iterparse(z.open(f"xl/worksheets/{sheet}.xml")):
        if el.tag == "{%s}row" % NS["m"]:
            r = {}
            for c in el.findall("m:c", NS):
                v = c.find("m:v", NS); t = c.get("t")
                if t == "inlineStr":
                    val = "".join(x.text or "" for x in c.iter("{%s}t" % NS["m"]))
                elif v is None: val = ""
                elif t == "s": val = ss[int(v.text)]
                else: val = v.text
                r[col(c.get("r"))] = val
            rows.append([r.get(i, "") for i in range(max(r)+1)] if r else [])
            el.clear()
    with open(f"{out_prefix}-{sheet}.csv", "w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(rows)
    print(sheet, len(rows), "lignes")
