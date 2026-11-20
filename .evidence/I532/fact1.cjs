const fs = require("fs");
for (const f of ["E:/Game/.evidence/I517/build_e69b.py", "E:/Game/.evidence/I509/build_remaster4.py", "E:/Game/.evidence/I516/build_e69a.py"]) {
  const t = fs.readFileSync(f, "utf8");
  const names = [...new Set(t.match(/VR_[A-Za-z0-9]+/g) || [])];
  const nm = t.match(/NAMES\s*[:=][^\n]*(?:\n[^\n]*){0,12}/);
  console.log("=== " + f + " ===");
  console.log("VR tokens:", names.join(" ") || "(none)");
  if (nm) console.log("NAMES block:\n" + nm[0].slice(0, 700));
  const ex = t.match(/export_scene\.gltf[^\n]*/g);
  if (ex) console.log("EXPORT:\n" + ex.join("\n").slice(0, 800));
}
