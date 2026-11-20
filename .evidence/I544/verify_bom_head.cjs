const fs = require("fs");
const { execSync } = require("child_process");
function countBom(buf) {
  let n = 0;
  for (let i = 0; i + 2 < buf.length; i++) if (buf[i] === 0xEF && buf[i+1] === 0xBB && buf[i+2] === 0xBF) { n++; i += 2; }
  return n;
}
const files = ["src/core/strings.js", "src/render/screens.js", "src/main.js", "tests/strings.test.js"];
for (const f of files) {
  const head = execSync("git -C E:/Game show HEAD:" + f, { maxBuffer: 1 << 26 });
  const wt = fs.readFileSync("E:/Game/" + f);
  console.log(`${f}: HEAD x${countBom(head)} -> WT x${countBom(wt)} ${countBom(head) === countBom(wt) ? "SAME" : "CHANGED!"}`);
}