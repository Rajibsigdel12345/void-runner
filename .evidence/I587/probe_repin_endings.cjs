const fs = require("fs");
for (const p of ["tests/assetGlbs.test.js", "tests/assetPerf.test.js"]) {
  const b = fs.readFileSync("E:/Game/" + p);
  const s = b.toString("utf8");
  let n = 0; for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 0xFEFF) n++;
  console.log(p + " BOM=" + n + " CRLFcount=" + (s.split("\r\n").length - 1) + " endsCRLF=" + s.endsWith("\r\n") + " endsLF=" + s.endsWith("\n") + " hasCR=" + s.includes("\r"));
}