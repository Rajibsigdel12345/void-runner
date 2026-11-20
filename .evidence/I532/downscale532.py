import bpy, os, shutil, glob, re

EV = r"E:\Game\.evidence\I532"
OUT = os.path.join(EV, "png480")
os.makedirs(OUT, exist_ok=True)

ships = ["phantom", "hauler", "bulwark", "gunship"]
big_pat = re.compile(r"^a532_(" + "|".join(ships) + r")_(f34|front|back|side)_(clay|tint)\.png$")
sil_pat = re.compile(r"^a532_(" + "|".join(ships) + r")_(front|back)_sil96\.png$")

allpng = [f for f in os.listdir(EV) if f.lower().endswith(".png")]
big = sorted([f for f in allpng if big_pat.match(f)])
sil = sorted([f for f in allpng if sil_pat.match(f)])
print("big count =", len(big))
print("sil count =", len(sil))

def load_resize_save(src, dst, w, h):
    img = bpy.data.images.load(src, check_existing=False)
    img.scale(w, h)
    img.filepath_raw = dst
    img.file_format = "PNG"
    img.save()
    img.filepath_raw = ""
    bpy.data.images.remove(img)

ok = True
for f in big:
    src = os.path.join(EV, f)
    dst = os.path.join(OUT, f)
    try:
        load_resize_save(src, dst, 480, 270)
    except Exception as e:
        ok = False
        print("FAIL big", f, e)
for f in sil:
    src = os.path.join(EV, f)
    dst = os.path.join(OUT, f)
    try:
        shutil.copyfile(src, dst)
    except Exception as e:
        ok = False
        print("FAIL sil", f, e)

tot = 0
n = 0
for f in os.listdir(OUT):
    p = os.path.join(OUT, f)
    tot += os.path.getsize(p)
    n += 1
print("OUT files =", n, "OUT bytes =", tot)
print("ALL_DONE" if ok else "HAD_FAILURES")
