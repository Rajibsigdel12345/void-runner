const fs = require("fs");
const s = fs.readFileSync("src/main.js", "latin1");
let k = s.indexOf("motionOff");
while (k >= 0) {
  const a = s.lastIndexOf("\n", k), b = s.indexOf("\n", k);
  const line = s.slice(a + 1, b);
  if (line.includes("const") || line.includes("let") || line.includes("matchMedia")) console.log(JSON.stringify(line.slice(0, 220)));
  k = s.indexOf("motionOff", k + 1);
  if (k > 200000) break;
}
