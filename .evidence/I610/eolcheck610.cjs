const fs = require("fs");
const { execSync } = require("child_process");
const files = ["production/stories.md", "production/iterations.md", "production/timeline.md", "AGENTS.md"];
for (const f of files) {
  const head = execSync("git show HEAD:" + f, { maxBuffer: 20 * 1024 * 1024, cwd: "E:/Game" }).toString("utf8");
  const disk = fs.readFileSync("E:/Game/" + f, "utf8");
  const loneNL = (s) => s.replace(/\r\n/g, "").split("\n").length - 1;
  const loneCR = (s) => s.replace(/\r\n/g, "").split("\r").length - 1;
  const h9 = head.includes("\uFE99"); // sentinel: not present
  console.log(f + ":\n  HEAD  loneNL=" + loneNL(head) + " loneCR=" + loneCR(head) + " endCRLF=" + head.endsWith("\r\n") + " len=" + head.length + "\n  DISK  loneNL=" + loneNL(disk) + " loneCR=" + loneCR(disk) + " endCRLF=" + disk.endsWith("\r\n") + " len=" + disk.length);
  // where are the lone NLRs on disk?
  const idxs = [];
  let i = 0;
  while ((i = disk.indexOf("\n", i)) !== -1) {
    if (i === 0 || disk[i - 1] !== "\r") idxs.push(i);
    i++;
  }
  if (idxs.length) console.log("  disk lone-NL count=" + idxs.length + " first@=" + idxs[0] + " last@=" + idxs[idxs.length - 1]);
  const idxh = [];
  i = 0;
  while ((i = head.indexOf("\n", i)) !== -1) {
    if (i === 0 || head[i - 1] !== "\r") idxh.push(i);
    i++;
  }
  if (idxh.length) console.log("  HEAD lone-NL count=" + idxh.length + " first@=" + idxh[0] + " last@=" + idxh[idxh.length - 1]);
}
// show the actual inserted content: stories ST-574/575 tails + CHANGELOG I609 line
const sm = fs.readFileSync("E:/Game/production/stories.md", "utf8");
for (const m of ["ST-574 (I609)", "ST-575 (I610)"]) {
  const i = sm.indexOf(m);
  console.log("\n--- stories.md @" + i + " ---\n" + sm.slice(i, i + 400).replace(/\r\n/g, "\\n"));
}
const cl = fs.readFileSync("E:/Game/CHANGELOG.md", "utf8");
const i9 = cl.indexOf("I609:");
console.log("\n--- CHANGELOG I609 line ---\n" + cl.slice(i9, i9 + 300).replace(/\r\n/g, "\\n").split("\n")[0]);