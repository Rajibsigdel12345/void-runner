const fs = require("fs");
const s = fs.readFileSync(".evidence/I483/playframe483.mjs", "utf8");
for (const pat of ["L exact", "tris ===", "calls === 52", "52/"]) {
  let i = 0, n = 0;
  while ((i = s.indexOf(pat, i)) !== -1 && n < 3) {
    const lineStart = s.lastIndexOf("\n", i) + 1;
    let lineEnd = s.indexOf("\n", i); if (lineEnd === -1) lineEnd = s.length;
    console.log("=== [" + pat + "] line " + (lineEnd - lineStart) + " chars ===");
    console.log(s.slice(lineStart, Math.min(lineEnd, lineStart + 300)));
    i += pat.length; n++;
  }
}
