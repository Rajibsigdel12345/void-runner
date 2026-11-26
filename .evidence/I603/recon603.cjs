const fs = require("fs");
const files = ["production/epics.md", "production/stories.md", "production/iterations.md", "production/timeline.md", "production/session-state/active.md", "CHANGELOG.md"];
for (const f of files) {
  const buf = fs.readFileSync(f);
  const s = buf.toString("latin1");
  const bom = (s.match(/\u00EF\u00BB\u00BF/g) || []).length;
  console.log("== " + f + " len=" + s.length + " bom=" + bom);
  console.log("TAIL: " + JSON.stringify(s.slice(-130)));
}
const ch = fs.readFileSync("CHANGELOG.md", "latin1");
console.log("CHANGELOG I602 anchor count:", ch.split("- I602:").length - 1);
console.log("CHANGELOG around I602:", JSON.stringify(ch.slice(ch.indexOf("- I602:") - 60, ch.indexOf("- I602:") + 20)));