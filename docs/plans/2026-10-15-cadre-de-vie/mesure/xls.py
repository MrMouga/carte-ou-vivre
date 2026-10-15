"""Lecteur minimal .xls (OLE2 + BIFF8), sans dépendance : feuilles -> {(ligne, col): valeur}."""
import struct
def _ole_stream(data, name='Workbook'):
    ss = 1 << struct.unpack('<H', data[30:32])[0]
    nfat, dir0 = struct.unpack('<I', data[44:48])[0], struct.unpack('<I', data[48:52])[0]
    difat = list(struct.unpack('<109I', data[76:512])); nxt = struct.unpack('<I', data[68:72])[0]
    sec = lambda i: data[512 + i*ss: 512 + (i+1)*ss]
    while nxt not in (0xFFFFFFFE, 0xFFFFFFFF):
        v = struct.unpack('<%dI' % (ss//4), sec(nxt)); difat += v[:-1]; nxt = v[-1]
    fat = []
    for i in difat[:nfat]: fat += struct.unpack('<%dI' % (ss//4), sec(i))
    def chain(s):
        out = []
        while s not in (0xFFFFFFFE, 0xFFFFFFFF): out.append(sec(s)); s = fat[s]
        return b''.join(out)
    d = chain(dir0)
    for k in range(0, len(d), 128):
        e = d[k:k+128]; nl = struct.unpack('<H', e[64:66])[0]
        if e[:max(nl-2, 0)].decode('utf-16-le') in (name, 'Book'):
            start, size = struct.unpack('<II', e[116:124]); return chain(start)[:size]
    raise ValueError('pas de flux Workbook')
def _rk(v):
    n = (v >> 2) if not (v & 2) else None
    if v & 2:
        n = v >> 2
        if n & 0x20000000: n -= 0x40000000
        x = float(n)
    else:
        x = struct.unpack('<d', struct.pack('<Q', (v & 0xFFFFFFFC) << 32))[0]
    return x / 100 if v & 1 else x
def read(path):
    wb = _ole_stream(open(path, 'rb').read())
    recs = []; p = 0
    while p + 4 <= len(wb):
        t, l = struct.unpack('<HH', wb[p:p+4]); recs.append((t, wb[p+4:p+4+l], p)); p += 4 + l
    # SST avec CONTINUE
    sst = []; sheets = []
    for i, (t, b, pos) in enumerate(recs):
        if t == 0x0085:
            off = struct.unpack('<I', b[:4])[0]; n = b[6]; fl = b[7]
            nm = b[8:8+n*(2 if fl & 1 else 1)].decode('utf-16-le' if fl & 1 else 'latin-1'); sheets.append((nm, off))
        if t == 0x00FC:
            parts = [b]; j = i + 1
            while recs[j][0] == 0x003C: parts.append(recs[j][1]); j += 1
            total = struct.unpack('<I', b[4:8])[0]
            pi, q = 0, 8
            def take(n):
                nonlocal pi, q
                out = b''
                while n:
                    if q >= len(parts[pi]): pi += 1; q = 0
                    k = min(n, len(parts[pi]) - q); out += parts[pi][q:q+k]; q += k; n -= k
                return out
            for _ in range(total):
                cc = struct.unpack('<H', take(2))[0]; fl = take(1)[0]
                rt = struct.unpack('<H', take(2))[0] if fl & 8 else 0
                sz = struct.unpack('<I', take(4))[0] if fl & 4 else 0
                s = ''; left = cc; wide = fl & 1
                while left:
                    if q >= len(parts[pi]):
                        pi += 1; q = 0; wide = parts[pi][0] & 1; q = 1
                    avail = (len(parts[pi]) - q) // (2 if wide else 1); k = min(left, avail)
                    raw = parts[pi][q:q + k*(2 if wide else 1)]; q += len(raw)
                    s += raw.decode('utf-16-le' if wide else 'latin-1'); left -= k
                take(4*rt + sz); sst.append(s)
    out = {}
    bypos = {pos: i for i, (_, _, pos) in enumerate(recs)}
    for nm, off in sheets:
        cells = {}; i = bypos[off] + 1
        while recs[i][0] != 0x000A:
            t, b, _ = recs[i]
            if t == 0x00FD:
                r, c, _, k = struct.unpack('<HHHI', b[:10]); cells[(r, c)] = sst[k]
            elif t == 0x0203:
                r, c, _, v = struct.unpack('<HHHd', b[:14]); cells[(r, c)] = v
            elif t == 0x027E:
                r, c, _, v = struct.unpack('<HHHI', b[:10]); cells[(r, c)] = _rk(v)
            elif t == 0x00BD:
                r, c = struct.unpack('<HH', b[:4]); n = (len(b) - 6) // 6
                for k in range(n):
                    _, v = struct.unpack('<HI', b[4+6*k:10+6*k]); cells[(r, c+k)] = _rk(v)
            elif t == 0x0204:
                r, c, _, n = struct.unpack('<HHHH', b[:8]); fl = b[8]
                cells[(r, c)] = b[9:9+n*(2 if fl & 1 else 1)].decode('utf-16-le' if fl & 1 else 'latin-1')
            i += 1
        out[nm] = cells
    return out
def rows(cells):
    if not cells: return []
    R = max(r for r, _ in cells) + 1; C = max(c for _, c in cells) + 1
    return [[cells.get((r, c), '') for c in range(C)] for r in range(R)]
