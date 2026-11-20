const fs = require("fs");
const p = ".evidence/I546/smoke546.mjs";
let s = fs.readFileSync(p, "utf8");
const before = 'fetch("manifest.webmanifest")';
if (!s.includes(before)) { console.log("ANCHOR NOT FOUND"); process.exit(1); }
s = s.replace(before, 'fetch("public/manifest.webmanifest")');
fs.writeFileSync(p, s, "utf8");
console.log("smoke546 fetch path fixed");