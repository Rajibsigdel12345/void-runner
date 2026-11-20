import os
from PIL import Image
src = os.path.join(os.getcwd(), ".evidence", "I535")
dst = os.path.join(src, "png480")
os.makedirs(dst, exist_ok=True)
views = ["f34", "front", "back", "side"]
modes = ["clay", "tint"]
for v in views:
    for m in modes:
        s = os.path.join(src, f"v2_bulwark_{v}_{m}.png")
        d = os.path.join(dst, f"v2_bulwark_{v}_{m}.png")
        im = Image.open(s)
        im2 = im.resize((480, 270))
        im2.save(d)
        print("OK", f"v2_bulwark_{v}_{m}.png", im.size, "->", im2.size, os.path.getsize(d), "B")
for v in ["front", "back"]:
    s = os.path.join(src, f"v2_bulwark_{v}_sil96.png")
    d = os.path.join(dst, f"v2_bulwark_{v}_sil96.png")
    im = Image.open(s)
    im.save(d)
    print("OK", f"v2_bulwark_{v}_sil96.png", im.size, os.path.getsize(d), "B (as-is)")
print("PNG480_DONE")
