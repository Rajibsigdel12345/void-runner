const fs = require("fs");
for (const f of ["E:/Game/src/render/haulerMesh.js", "E:/Game/src/render/bulwarkMesh.js"]) {
  const t = fs.readFileSync(f, "utf8");
  const i = t.indexOf("useGLB");
  console.log("=== " + f + " (useGLB region) ===");
  console.log(t.slice(Math.max(0, i - 400), i + 1600));
  console.log();
}
