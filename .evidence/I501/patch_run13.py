import io
p = r"E:\Game\.evidence\I501\build_ship_v6.py"
s = io.open(p, encoding="utf-8", newline="").read()
old = (
    "            px, zt, nx, nz = decagon_x_side(y, 0.05)\n"
    "            cx = sgn * (px + nx * 0.008)\n"
    "            cz = 0.05 + nz * 0.008\n"
)
new = (
    "            px, zt, nx, nz = decagon_x_side(y, 0.05)\n"
    "            cx = sgn * (px + nx * 0.012)  # run13: 0.008->0.012 - outer face 0.048 was COPLANAR with\n"
    "            #   rib k1 (side 0, off 0.018 + rad half 0.030 = 0.048): run12 pair 210x225 (full overlap)\n"
    "            #   + rib k1 ri2 x porthole y=-0.15 sliver. 0.012: vs rib k1 0.004 build / vs k0 0.016 /\n"
    "            #   vs post 25 outer 0.042 -> 0.010 / inner -0.028 stays embedded (skin min -0.012).\n"
    "            cz = 0.05 + nz * 0.012\n"
)
assert s.count(old) == 1, s.count(old)
s = s.replace(old, new)
io.open(p, "w", encoding="utf-8", newline="").write(s)
import py_compile
py_compile.compile(p, doraise=True)
print("PATCH_RUN13_OK")