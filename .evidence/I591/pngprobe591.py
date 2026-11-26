import bpy, os
OUT = r"E:/Game/.evidence/I591"
def analyze(path):
    img = bpy.data.images.load(path)
    px = list(img.pixels)
    W, H = img.size
    minc, maxc, minr, maxr, n = 99, -1, 99, -1, 0
    for y in range(H):
        for x in range(W):
            i = (y * W + x) * 4 + 3
            if px[i] > 0.1:
                n += 1
                if x < minc: minc = x
                if x > maxc: maxc = x
                if y < minr: minr = y
                if y > maxr: maxr = y
    bpy.data.images.remove(img)
    print("PNG", os.path.basename(path), "W", W, "H", H, "opaque_px", n,
          "span_x", maxc + 1 - minc, "span_y", maxr + 1 - minr,
          "center_x", (minc + maxc) / 2.0, "center_y", (minr + maxr) / 2.0)
for name, tag in [("warden_v2", "C"), ("warden_v2", "A"), ("warden_v2", "B"),
                  ("drone_v2", "C"), ("drone_v2", "A"), ("drone_v2", "B")]:
    analyze(os.path.join(OUT, "sil96_%s_%s.png" % (name, tag)))
print("PNGPROBE_DONE")
