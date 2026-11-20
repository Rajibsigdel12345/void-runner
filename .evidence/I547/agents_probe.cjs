const fs = require("fs");
const s = fs.readFileSync("AGENTS.md", "utf8");
console.log("BOM=" + (s.charCodeAt(0) === 0xFEFF) + " CRLF=" + s.includes("\r\n") + " lines=" + s.split(/\r?\n/).length);
for (const key of ["Art assets", "CLOSE FLOOR E71", "22/25,781"]) {
  const i = s.indexOf(key);
  console.log("---- anchor [" + key + "] at " + i + " ----");
  if (i >= 0) console.log(JSON.stringify(s.slice(Math.max(0, i - 120), i + 400)));
}