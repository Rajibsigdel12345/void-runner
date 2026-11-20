const fs = require("fs");
const files = [
  ["src/core/strings.js", 0],
  ["src/render/screens.js", 1],
  ["src/main.js", 1],
  ["tests/strings.test.js", 0],
  ["src/core/menuModel.js", 0],
  ["tests/menuModel.test.js", 0],
];
let bad = 0;
for (const [f, expect] of files) {
  const b = fs.readFileSync("E:/Game/" + f);
  let n = 0;
  for (let i = 0; i + 2 < b.length; i++) if (b[i] === 0xEF && b[i+1] === 0xBB && b[i+2] === 0xBF) { n++; i += 2; }
  const ok = n === expect;
  if (!ok) bad++;
  console.log(`${ok ? "OK " : "BAD"} ${f}: BOM x${n} (expect ${expect})`);
}
process.exit(bad ? 1 : 0);