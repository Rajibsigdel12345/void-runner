const fs = require("fs");
const c = fs.readFileSync("src/core/config.js", "latin1");
let i = 0; let hits = [];
while(true){ i = c.indexOf("radius", i); if(i<0) break; const lineStart = c.lastIndexOf("\n", i) + 1; const lineEnd = c.indexOf("\n", i); hits.push(c.slice(lineStart, lineEnd).trim().slice(0,100)); i++; }
console.log("RADIUS HITS:\n" + hits.join("\n"));
const ar = c.indexOf("arena: {");
if(ar >= 0) console.log("ARENA OBJ: " + JSON.stringify(c.slice(ar, ar + 400)));
const pj = fs.readFileSync("package.json", "latin1");
console.log("PKG type: " + (pj.match(/"type"\s*:\s*"[^"]+"/) || "none"));
const t = fs.readFileSync("tests/cameraModel.test.js", "latin1");
console.log("TEST HEAD: " + JSON.stringify(t.slice(0, 300)));