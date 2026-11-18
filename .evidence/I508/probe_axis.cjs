const fs = require("fs");
// Axis probe: per-node bbox in Blender (pre-Y-up) space for the 4 legacy GLBs.
for (const f of ["stinger","drone","warden","flyer"]) {
  const b = fs.readFileSync("assets/" + f + ".glb");
  const jsonLen = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20 + jsonLen).toString("utf8"));
  for (const m of json.meshes || []) {
    for (const pr of m.primitives || []) {
      const pos = pr.attributes && pr.attributes.POSITION;
      if (pos == null) continue;
      const acc = json.accessors[pos];
      const mn = acc.min, mx = acc.max;
      const span = [mx[0]-mn[0], mx[1]-mn[1], mx[2]-mn[2]].map(v=>+v.toFixed(3));
      console.log(f, m.name, "min", mn.map(v=>+v.toFixed(3)), "max", mx.map(v=>+v.toFixed(3)), "span", span);
    }
  }
}