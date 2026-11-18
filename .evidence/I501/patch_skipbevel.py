p = r"E:\Game\.evidence\I501\build_ship_v6.py"
s = open(p, "rb").read().decode("utf-8")
nl = "\n"
c = "    v6_h4(bm)" + nl + "    bm.to_mesh(ob.data); bm.free(); ob.data.update()" + nl + "    bevel_ob(ob, 0.006, 45.0)" + nl + "    return ob"
print("hull ctx count", s.count(c))
assert s.count(c) == 1
s2 = s.replace(c, "    v6_h4(bm)" + nl + "    bm.to_mesh(ob.data); bm.free(); ob.data.update()" + nl + "    import os as _os" + nl + '    if _os.environ.get("SKIP_HBEVEL") != "1":' + nl + "        bevel_ob(ob, 0.006, 45.0)" + nl + "    return ob")
open(p, "wb").write(s2.encode("utf-8"))
import ast; ast.parse(s2); print("OK")