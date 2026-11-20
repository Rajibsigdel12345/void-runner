const fs = require("fs");
const path = require("path");
const R = (p) => path.join(__dirname, "..", "..", p);
const read = (f) => fs.readFileSync(R(f), "latin1");
const bom = (f) => { const b = fs.readFileSync(R(f)); let c = 0, i = 0; while (i + 2 < b.length && b[i] === 0xEF && b[i+1] === 0xBB && b[i+2] === 0xBF) { c++; i += 3; } return c; };
const FILES = ["production/epics.md", "production/stories.md", "production/iterations.md", "production/timeline.md", "production/session-state/active.md"];
for (const f of FILES) {
  const s = read(f);
  console.log("==", f, "len", s.length, "BOM", bom(f), "trailingNL", s.endsWith("\n"), "CRLFcount", (s.match(/\r\n/g)||[]).length);
}
// epics: find ST-513 line + E74 status
let ep = read("production/epics.md");
let i = ep.indexOf("ST-513");
console.log("EPICS ST-513 @", i);
console.log(JSON.stringify(ep.slice(i - 200, i + 500)));
let i2 = ep.indexOf("E74");
console.log("EPICS E74 @", i2);
console.log(JSON.stringify(ep.slice(i2 - 100, i2 + 700)));
// stories: ST-513 line
let st = read("production/stories.md");
let j = st.indexOf("ST-513");
console.log("STORIES ST-513 @", j);
console.log(JSON.stringify(st.slice(j - 50, j + 700)));
// iterations tail
let it = read("production/iterations.md");
console.log("ITER TAIL", JSON.stringify(it.slice(-400)));
// timeline tail
let tl = read("production/timeline.md");
console.log("TL TAIL", JSON.stringify(tl.slice(-500)));
// active tail
let ac = read("production/session-state/active.md");
console.log("ACTIVE TAIL", JSON.stringify(ac.slice(-700)));