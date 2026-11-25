# ---------------------------------------------------------------- v8 HULL ring table
# 16-gon ovoid envelope. y: nose -1.42 (apex) .. tail +0.90 (cap). Belly z ~ -0.26
# (displace margin to the -0.399 gate), top z ~ 0.86. Long rigid-airship envelope.
RINGS8 = [
    (-1.30, 0.060, 0.240, 0.050), (-1.18, 0.160, 0.250, 0.130),
    (-1.02, 0.300, 0.260, 0.240), (-0.82, 0.430, 0.270, 0.360),
    (-0.58, 0.530, 0.280, 0.450), (-0.32, 0.590, 0.290, 0.520),
    (-0.06, 0.620, 0.300, 0.555), (0.16, 0.610, 0.300, 0.545),
    (0.38, 0.565, 0.300, 0.510), (0.56, 0.490, 0.305, 0.460),
    (0.70, 0.395, 0.310, 0.395), (0.80, 0.300, 0.315, 0.320),
    (0.86, 0.215, 0.320, 0.250), (0.90, 0.140, 0.330, 0.180),
]
APEX8 = (0.0, -1.42, 0.260)
TAILCAP8 = (0.0, 0.90, 0.35)
FORMER_Y8 = (-1.24, -1.12, -1.00, -0.88, -0.76, -0.64, -0.52, -0.40, -0.28, -0.16,
            -0.04, 0.08, 0.20, 0.32, 0.44, 0.56, 0.68, 0.80, 0.87)
CELL_RING_Y8 = (-1.05, -0.70, -0.35, 0.0, 0.30, 0.55, 0.75, 0.85)
GOTH_TH8 = (30.0, 90.0, 150.0, 210.0, 270.0, 330.0)

def _ring_at(y):
    R = RINGS8
    if y <= R[0][0]:
        return (R[0][1], R[0][2], R[0][3])
    if y >= R[-1][0]:
        return (R[-1][1], R[-1][2], R[-1][3])
    for i in range(len(R) - 1):
        y0, w0, z0, h0 = R[i]
        y1, w1, z1, h1 = R[i + 1]
        if y0 <= y <= y1:
            t = (y - y0) / (y1 - y0)
            return (w0 + (w1 - w0) * t, z0 + (z1 - z0) * t, h0 + (h1 - h0) * t)
    w, zc, h = R[-1]
    return (w, zc, h)

def facet_at(y, th):
    # true 16-gon chord point + chord normal at angle th (skin-seated greebles)
    w, zc, h = _ring_at(y)
    step = 2.0 * math.pi / SIDES
    a0 = math.floor(th / step + 1e-9) * step
    a1 = a0 + step
    px0, pz0 = w * math.cos(a0), zc + h * math.sin(a0)
    px1, pz1 = w * math.cos(a1), zc + h * math.sin(a1)
    ddx, ddz = px1 - px0, pz1 - pz0
    den = math.cos(th) * ddz - math.sin(th) * ddx
    t = (px0 * ddz - (pz0 - zc) * ddx) / den if abs(den) > 1e-12 else w
    px, pz = t * math.cos(th), zc + t * math.sin(th)
    ln = math.hypot(ddx, ddz)
    nx, nz = ddz / ln, -ddx / ln
    mx, mz = (px0 + px1) / 2.0, (pz0 + pz1) / 2.0
    if nx * mx + nz * (mz - zc) < 0:
        nx, nz = -nx, -nz
    return (px, pz, nx, nz)

def facet_pts(w, zc, h, sides=SIDES):
    return [(w * math.cos(2.0 * math.pi * i / sides),
             zc + h * math.sin(2.0 * math.pi * i / sides)) for i in range(sides)]

def ring(bm, y, w, zc, h, sides=SIDES):
    return [bm.verts.new((px, y, pz)) for (px, pz) in facet_pts(w, zc, h, sides)]

def ob_from_bm(bm, ob):
    bm.to_mesh(ob.data); bm.normal_update()
    return ob

def gothic_rib(bm, thdeg, y0, y1, nst):
    # longitudinal gothic rib: 4-pt trapezoid section lofted along the envelope
    # at fixed angle thdeg (base sunk 2 mm, crown raised 20 mm). Closed caps.
    th = math.radians(thdeg)
    rows = []
    for k in range(nst):
        t = k / float(nst - 1)
        y = y0 + (y1 - y0) * t
        px, pz, nx, nz = facet_at(y, th)
        tx, tz = -nz, nx
        rows.append([
            bm.verts.new((px - nx * 0.002 - tx * 0.030, y, pz - nz * 0.002 - tz * 0.030)),
            bm.verts.new((px + nx * 0.020 - tx * 0.012, y, pz + nz * 0.020 - tz * 0.012)),
            bm.verts.new((px + nx * 0.020 + tx * 0.012, y, pz + nz * 0.020 + tz * 0.012)),
            bm.verts.new((px - nx * 0.002 + tx * 0.030, y, pz - nz * 0.002 + tz * 0.030)),
        ])
    for rii in range(len(rows) - 1):
        a, b = rows[rii], rows[rii + 1]
        for i in range(4):
            j = (i + 1) % 4
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new(list(reversed(rows[0])))
    bm.faces.new(rows[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])

# ---------------------------------------------------------------- v8 WING tables
# slim sponson airfoil (12-pt closed profile), 9 stations; tip x = +/-2.00 exact
# (span pin 4.00). Root station x=0.45 embeds in the hull flank.
AIR8 = [(-0.38, 0.000), (-0.26, 0.030), (-0.10, 0.050), (0.08, 0.052),
        (0.24, 0.038), (0.34, 0.020), (0.38, 0.000), (0.32, -0.024),
        (0.14, -0.040), (-0.08, -0.042), (-0.26, -0.028), (-0.34, -0.012)]
STATIONS8 = [(0.45, -0.02, -0.02, 1.0, 1.0), (0.75, -0.02, -0.015, 0.94, 0.95),
             (1.05, -0.01, -0.01, 0.86, 0.88), (1.35, 0.0, 0.0, 0.76, 0.78),
             (1.60, 0.01, 0.01, 0.62, 0.64), (1.80, 0.02, 0.015, 0.45, 0.46),
             (1.90, 0.02, 0.02, 0.30, 0.32), (1.96, 0.02, 0.02, 0.18, 0.18),
             (2.00, 0.02, 0.025, 0.10, 0.10)]
# tip finlet (closed (y,z) profile), prism x 1.955..2.005
WINGLET8 = [(-0.14, 0.020), (0.0, 0.020), (0.06, 0.080), (0.0, 0.160), (-0.14, 0.140)]
