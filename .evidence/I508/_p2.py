# ================= BAKE + MATERIALS + EXPORT =================
def bake(ob, fn):
    me = ob.data
    attr = me.color_attributes.new(name="Color", type="FLOAT_COLOR", domain="POINT")
    for i, v in enumerate(me.vertices):
        val = fn(v.co.x, v.co.y, v.co.z)
        val = min(0.96, max(0.22, val))
        attr.data[i].color = (val, val, val, 1.0)
def hband(x, y, z, lo, hi):
    return lo + (hi - lo) * hash3(x, y, z)
def bake_stinger_body(x, y, z):
    if x > 1.10: return 0.88
    if x < -1.45: return 0.30
    if abs(y) > 0.28 and x < -0.10: return 0.34
    if abs(z) > 0.30 and x < -0.90: return 0.34
    return hband(x, y, z, 0.44, 0.62)
def bake_stinger_core(x, y, z):
    return 0.94
def bake_drone(x, y, z):
    if x > 0.90: return 0.34
    if x > 0.55 and math.hypot(y, z) < 0.45: return 0.80
    if abs(y) > 0.30 and z < 0.0: return 0.30
    if x < -0.80: return 0.28
    return hband(x, y, z, 0.46, 0.64)
def bake_warden_hull(x, y, z):
    if x > 1.28 and math.hypot(y, z) < 0.50: return 0.90
    if x > 1.20: return 0.70
    if z < -0.90: return 0.28
    return hband(x, y, z, 0.38, 0.56)
def bake_warden_armor(x, y, z):
    d = min(abs(abs(x) - 2.40), abs(abs(y) - 2.15), abs(abs(z) - 1.76))
    if d < 0.18: return 0.38
    return hband(x, y, z, 0.58, 0.74)
def bake_flyer_body(x, y, z):
    if z > 0.16 and abs(y) < 0.12: return 0.85
    if z < 0.0 and abs(y) > 0.15: return 0.30
    if x > 1.00: return 0.40
    return hband(x, y, z, 0.50, 0.66)
def bake_flyer_dome(x, y, z):
    return 0.92
BAKES = {
 "VR_Stinger_Body": bake_stinger_body, "VR_Stinger_Core": bake_stinger_core,
 "VR_Drone": bake_drone, "VR_Warden_Hull": bake_warden_hull,
 "VR_Warden_Armor": bake_warden_armor, "VR_Flyer_Body": bake_flyer_body,
 "VR_Flyer_Dome": bake_flyer_dome,
}
def mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.8, 0.8, 0.8, 1.0)
    vc = nt.nodes.new("ShaderNodeVertexColor")
    vc.layer_name = "Color"
    nt.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
    return m
GROUPS = {
 "stinger": made["stinger"],
 "drone": made["drone"],
 "warden": made["warden_hull"] + made["warden_armor"],
 "flyer": made["flyer_body"] + made["flyer_dome"],
}
for ob in sum(GROUPS.values(), []):
    bake(ob, BAKES[ob.name])
    ob.data.materials.append(mat(ob.name + "Mat"))
def tris2(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)
fails = []
for ob in sum(GROUPS.values(), []):
    a, c = BUDGET[ob.name]
    t = tris2(ob)
    print("TRIS", ob.name, t, "aim", a, "cap", c, flush=True)
    if not (a <= t <= c):
        fails.append((ob.name, t, a, c))
for asset, obs in GROUPS.items():
    mn = [1e9, 1e9, 1e9]; mx = [-1e9, -1e9, -1e9]
    for ob in obs:
        for v in ob.data.vertices:
            for k in range(3):
                mn[k] = min(mn[k], v.co[k]); mx[k] = max(mx[k], v.co[k])
    diag = math.sqrt(sum((mx[k] - mn[k]) ** 2 for k in range(3))) / 2.0
    tgt = RAD[asset]
    print("RAD", asset, round(diag, 3), "target", tgt, "class", round(diag / tgt, 3), flush=True)
    if not (0.88 * tgt <= diag <= 1.12 * tgt):
        fails.append((asset, "radius", diag, tgt))
for asset, obs in GROUPS.items():
    bpy.ops.object.select_all(action="DESELECT")
    for ob in obs:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    bpy.ops.export_scene.gltf(filepath=OUT[asset], export_format="GLB", use_selection=True,
        export_yup=True, export_apply=True, export_materials="EXPORT",
        export_vertex_color="MATERIAL", export_image_format="AUTO",
        export_skins=False, export_animations=False, export_normals=True,
        export_texcoords=False, export_tangents=False)
    print("EXPORT_OK", OUT[asset], flush=True)
if fails:
    print("FAIL", fails, flush=True)
    raise SystemExit(1)
print("ALL_GATES_PASS", flush=True)
