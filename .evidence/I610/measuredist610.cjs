const fs = require("fs");
const path = require("path");
let total = 0, files = 0;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else { total += fs.statSync(p).size; files++; }
  }
})("E:/Game/dist");
console.log("DIST " + total + " B / " + files + " files");