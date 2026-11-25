const fs = require("fs");
function tail(p, n) { const s = fs.readFileSync(p, "utf8"); const t = s.slice(-n); return JSON.stringify(t.slice(-120)); }
function ends(p, c) { const s = fs.readFileSync(p, "utf8"); return c === "\\r\\n" ? s.endsWith("\r\n") : c === "\\n" ? s.endsWith("\n") : s.endsWith(c); }
console.log("stories tail:", tail("production/stories.md", 200));
console.log("stories endsLF-notCRLF:", ends("production/stories.md", "\\n") && !ends("production/stories.md", "\\r\\n"));
console.log("iterations endsLF:", ends("production/iterations.md", "\\n"));
const it = fs.readFileSync("production/iterations.md", "utf8");
console.log("iterations has I585 hdr:", it.indexOf("## I585 (ST-552, E83): E83 OPENED") !== -1);
console.log("timeline endsLF:", ends("production/timeline.md", "\\n"));
console.log("active endsCRLF:", ends("production/session-state/active.md", "\\r\\n"));
const cl = fs.readFileSync("CHANGELOG.md", "utf8");
console.log("changelog has I585:", cl.indexOf("- I585: ") !== -1, "count:", cl.split("- I585: ").length - 1);
console.log("changelog tail:", tail("CHANGELOG.md", 40));
const ep = fs.readFileSync("production/epics.md", "utf8");
console.log("epics ST-553 PENDING anchor:", ep.indexOf("ST-553 PENDING I586 (v8 build + QA + export to .evidence/I586/ ONLY)") !== -1);
console.log("epics Status anchor:", ep.indexOf("- Status: OPEN (opened I585). Pre-state local == origin 7eabf24") !== -1);
