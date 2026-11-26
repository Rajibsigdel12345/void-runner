const fs = require("fs");
const s = fs.readFileSync("src/main.js", "latin1");
let occ = [], k = -1;
while ((k = s.indexOf("Gauges", k + 1)) >= 0) occ.push(k);
console.log("Gauges occurrences:", occ.join(","));
for (const o of occ) console.log(JSON.stringify(s.slice(Math.max(0, o - 60), o + 140)));
let g = s.indexOf("gauges.update");
console.log("--- gauges.update site (g idx", g, ") ---");
console.log(JSON.stringify(s.slice(Math.max(0, g - 400), g + 300)));
