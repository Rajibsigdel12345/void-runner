const fs = require("fs");
for (const f of ["E:/Game/src/render/gunshipMesh.js", "E:/Game/src/render/phantomMesh.js"]) {
  const t = fs.readFileSync(f, "utf8");
  const i = t.indexOf("useGLB");
  console.log("=== " + f + " (useGLB region) ===");
  console.log(t.slice(Math.max(0, i - 200), i + 1400));
  console.log();
}
