const fs = require("fs");
const s = fs.readFileSync("E:/Game/production/stories.md", "latin1");
const lines = s.split("\n");
console.log("stories.md lines:", lines.length);
lines.forEach((ln, n) => {
  if (/ST-49[4-9]|ST-50[0-4]|STATUS I52[89]|STATUS I53[01]/.test(ln)) {
    console.log("L" + (n + 1) + ": " + ln.slice(0, 220));
  }
});
const c = fs.readFileSync("E:/Game/CHANGELOG.md", "latin1");
const cl = c.split("\n");
cl.forEach((ln, n) => {
  if (/Unreleased|^- I5(2[89]|3[01])/.test(ln)) console.log("CHANGELOG L" + (n + 1) + ": " + ln.slice(0, 200));
});
const e = fs.readFileSync("E:/Game/production/epics.md", "latin1");
const el = e.split("\n");
el.forEach((ln, n) => {
  if (/^## E(6[89]|7[012])/.test(ln)) console.log("EPICS L" + (n + 1) + ": " + ln.slice(0, 160));
});
