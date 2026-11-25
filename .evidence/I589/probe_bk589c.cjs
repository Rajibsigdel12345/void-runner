const fs = require("fs");
const ep = fs.readFileSync("production/epics.md", "utf8").split(/\r?\n/);
const hdrs = [];
for (let i = 0; i < ep.length; i++) if (/^## E8\d/.test(ep[i])) hdrs.push((i + 1) + ": " + ep[i].slice(0, 60));
console.log("--- E8x headers ---"); hdrs.forEach(h => console.log(h));
console.log("--- epics lines 936-945 ---");
for (let i = 935; i <= 944; i++) console.log((i + 1) + ": " + JSON.stringify(ep[i]).slice(0, 150));
function nlstyle(p) {
  const b = fs.readFileSync(p);
  const s = b.toString("latin1");
  const crlf = (s.match(/\r\n/g) || []).length;
  const lf = (s.match(/(?<!\r)\n/g) || []).length;
  return p + ": CRLF=" + crlf + " LFonly=" + lf;
}
["production/stories.md", "production/iterations.md", "production/timeline.md", "CHANGELOG.md"].forEach(p => console.log(nlstyle(p)));
const tl = fs.readFileSync("production/timeline.md", "utf8").split(/\r?\n/);
console.log("--- timeline last 5 lines ---");
for (let i = tl.length - 5; i < tl.length; i++) console.log((i + 1) + ": " + JSON.stringify(tl[i]).slice(0, 220));
const it = fs.readFileSync("production/iterations.md", "utf8").split(/\r?\n/);
console.log("--- iters lines 7250-7257 ---");
for (let i = 7249; i <= 7256; i++) console.log((i + 1) + ": " + JSON.stringify(it[i]).slice(0, 150));
