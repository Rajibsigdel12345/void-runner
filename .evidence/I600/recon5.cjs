const fs = require("fs");
const s = fs.readFileSync("src/main.js", "latin1");
let k = -1;
while ((k = s.indexOf("motionOff =", k + 1)) >= 0) {
  const a = s.lastIndexOf("\n", k), b = s.indexOf("\n", k);
  console.log(JSON.stringify(s.slice(a + 1, b).slice(0, 240)));
}
