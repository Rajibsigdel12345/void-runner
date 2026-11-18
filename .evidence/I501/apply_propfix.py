import ast
p = r"E:\Game\.evidence\I501\build_ship_v6.py"
raw = open(p, "rb").read()
text = raw.decode("utf-8")
nl = "\r\n" if "\r\n" in text else "\n"
print("NL_STYLE", repr(nl))
lines = text.splitlines(keepends=True)

def find(needle):
    hits = [i for i, l in enumerate(lines) if l.rstrip("\r\n") == needle]
    assert len(hits) == 1, (needle, hits)
    return hits[0]

def mk(s):
    return s + nl

# --- Edit 1: mirror left-nacelle prop poses in v6_engine ---
i = find("        psis = (90, 210, 330) if V6_PROPS_PER_NACELLE == 3 else (90, 270)")
assert lines[i + 1].rstrip("\r\n") == "        for psi in psis:", lines[i + 1]
ins = [
    mk("        if sgn < 0:"),
    mk("            # Mirror per nacelle: prop_blade rd=(sin,0,cos) is not symmetric"),
    mk("            # for cx=-0.30 -- psi=90 (+x) sends the left blade toward the"),
    mk("            # centerline, sweeping it through the exhaust plume cone. (270,150,30)"),
    mk("            # mirrors (90,210,330) about the Z axis; (90,270) is self-mirroring."),
    mk("            psis = tuple((360 - p) % 360 for p in psis)"),
]
lines[i + 1:i + 1] = ins

# --- Edit 2: exact prop-clear assert in build_engine (same-tree scope) ---
j = find("    v6_engine(bm)  # POST-displace (8 mm lip/band half-widths vs +/-6 mm displace)")
rep = [
    mk("    pre_props = set(bm.verts)  # same bmesh tree -> identity membership exact"),
    mk("    v6_engine(bm)  # POST-displace (8 mm lip/band half-widths vs +/-6 mm displace)"),
    mk("    # PROP CLEARANCE (spec E1 / S4 flame-plume model), asserted at bmesh stage"),
    mk("    # pre-final-bevel, exact scope: only v6 prop-assembly verts (spinner+blades;"),
    mk("    # the annular bands sit at y<=0.624 so the y filter drops them). NOTE: `base`"),
    mk("    # above is from the OLD bmesh tree -- BMVert membership is identity-based, so"),
    mk("    # it cannot scope this check; `pre_props` is captured in THIS tree, directly"),
    mk("    # before v6_engine()."),
    mk("    for v in bm.verts:"),
    mk("        if v not in pre_props and v.co.y > 0.735:"),
    mk("            d = math.hypot(1.6 * v.co.x, 1.26 * v.co.z)"),
    mk("            need = 1.405 * v.co.y - 0.80 + 0.015"),
    mk("            if d < need:"),
    mk('                print("PROP_CLEAR_FAIL", [round(c, 4) for c in v.co],'),
    mk('                      "d", round(d, 4), "<", round(need, 4))'),
    mk('                raise SystemExit("PROP_CLEAR_FAIL")'),
    mk('    print("PROP_CLEAR_OK (bmesh, prop assembly)")'),
]
lines[j:j + 1] = rep

# --- Edit 3: remove the over-broad all-engine-verts block in main() ---
k = find("    # prop-tip clearance vs hull (pre-verified PASS; assert WITH measurement)")
assert lines[k + 6].rstrip("\r\n") == "    print(\"PROP_CLEAR_OK\")", lines[k + 6]
rem = [
    mk("    # prop-tip clearance vs flame plume: asserted at bmesh stage in"),
    mk("    # build_engine() (exact prop-assembly scope; a mesh-wide check here"),
    mk("    # over-broadly flags 28 static nacelle inner-ring verts, which spec E1"),
    mk("    # does not cover)."),
]
lines[k:k + 7] = rem

out = "".join(lines)
ast.parse(out)
open(p, "wb").write(out.encode("utf-8"))
print("EDITS_OK lines", len(out.splitlines()))