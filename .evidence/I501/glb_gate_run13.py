import struct, math, json
path = r"E:\Game\.evidence\I501\ship_v6.glb"
b = open(path, "rb").read()
print("FILE_BYTES", len(b))
off = 12
jsonb = None; binb = None
while off < len(b):
    cl, ct = struct.unpack_from("<II", b, off); off += 8
    chunk = b[off:off+cl]; off += cl
    if ct == 0x4E4F534A: jsonb = chunk
    elif ct == 0x004E4942: binb = chunk
j = json.loads(jsonb)

def acc(i):
    a = j["accessors"][i]; bv = j["bufferViews"][a["bufferView"]]
    o = (bv.get("byteOffset") or 0) + (a.get("byteOffset") or 0)
    return a, binb[o:o+bv["byteLength"]]

def f3(data, n):
    return [struct.unpack_from("<3f", data, i*12) for i in range(n)]

CAPS = {"VR_Ship_Hull":21500,"VR_Ship_Engine":5800,"VR_Ship_Fin":2800,"VR_Ship_Wings":3000,"VR_Ship_Cockpit":1600,"VR_Ship_Nozzle":2400}
total = 0
color_prims = []
allmin = [1e9]*3; allmax = [-1e9]*3
idx_types = set()
node_tris = {}
print("NODES", len([n for n in j["nodes"] if n.get("mesh") is not None]), sorted(n["name"] for n in j["nodes"] if n.get("name")))
print("MATERIALS", len(j.get("materials",[])), sorted(m["name"] for m in j.get("materials",[])))
for m in j["meshes"]:
    pn = m.get("name","?")
    for pi, pr in enumerate(m["primitives"]):
        ia = acc(pr["indices"])
        idx_types.add(ia[0]["componentType"])
        ntri = ia[0]["count"]//3
        total += ntri
        node_tris[pn] = node_tris.get(pn,0) + ntri
        pa, pdata = acc(pr["attributes"]["POSITION"])
        for xyz in f3(pdata, pa["count"]):
            for k in range(3):
                allmin[k]=min(allmin[k],xyz[k]); allmax[k]=max(allmax[k],xyz[k])
        attrs = sorted(pr["attributes"].keys())
        if "COLOR_0" in pr["attributes"]:
            ca, cdata = acc(pr["attributes"]["COLOR_0"])
            color_prims.append((pn, ca, cdata, ia))
            print("PRIM", pn, "attrs", attrs, "COLOR0 comp", ca["componentType"], "type", ca["type"], "count", ca["count"], "poscount", pa["count"], "MATCH" if ca["count"]==pa["count"] else "MISMATCH!")
        else:
            print("PRIM", pn, "attrs", attrs)
print("IDX_TYPES", idx_types, "OK" if idx_types=={5123} else "FAIL")
print("NODE_TRIS", node_tris)
for k,v in node_tris.items():
    print("CAP", k, v, "OK" if v <= CAPS[k] else "FAIL")
print("TOTAL_TRIS", total, "OK" if total <= 37100 else "OVERCAP", "HARD-OK" if total <= 38000 else "HARD-FAIL")
spans = [allmax[k]-allmin[k] for k in range(3)]
print("BBOX min", [round(v,4) for v in allmin], "max", [round(v,4) for v in allmax])
print("SPAN", [round(v,4) for v in spans])
print("COLOR_PRIMS", len(color_prims), "OK" if len(color_prims)==2 else "FAIL")
for pn, ca, cdata, ia in color_prims:
    n = ca["count"]
    verts = f3(cdata, n)
    bad = sum(1 for c in verts if abs(c[0]-c[1])>0.02 or abs(c[1]-c[2])>0.02)
    lums = sorted((c[0]+c[1]+c[2])/3.0 for c in verts)
    nidx = len(ia[1])//2
    ixs = struct.unpack_from("<%dH"%nidx, ia[1], 0)
    tri = sorted(((verts[ixs[t*3]][0]+verts[ixs[t*3+1]][0]+verts[ixs[t*3+2]][0])/3.0 for t in range(len(ixs)//3)))
    def pct(v,f): return v[min(len(v)-1, int(f*len(v)))]
    print("FACET", pn, "nongray", bad, "dom", [round(lums[0],4),round(lums[-1],4)], "p10", round(pct(tri,0.10),4), "p50", round(pct(tri,0.5),4), "p90", round(pct(tri,0.9),4), "spread", round(tri[-1]-tri[0],4))
print("GATE_DONE")