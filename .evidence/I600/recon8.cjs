const fs = require("fs");
function rd(p){ return fs.readFileSync(p,"latin1"); }
function stat(p){
  const b = fs.readFileSync(p);
  const s = b.toString("latin1");
  let bom=0, i=0;
  while(true){ i = s.indexOf("\uFEFF", i); if(i<0) break; bom++; i++; }
  const crlf = (s.match(/\r\n/g)||[]).length;
  const loneLf = s.split("\n").length-1-crlf;
  return { bytes: b.length, bom, crlf, loneLf, tailBare: !s.endsWith("\n") };
}
const targets = [
  "production/scope-check-E86.md",
  "production/epics.md",
  "production/stories.md",
  "production/iterations.md",
  "production/timeline.md",
  "production/session-state/active.md",
  "CHANGELOG.md"
];
for(const t of targets){
  console.log("=== " + t + " " + JSON.stringify(stat(t)));
}
// scope-check: fix table rows + verification evidence header
const sc = rd("production/scope-check-E86.md");
const lines = sc.split("\n");
lines.forEach((l,idx)=>{ if(/ST-565|ST-564/.test(l)) console.log("SC["+idx+"] "+l); });
const ve = sc.indexOf("## Verification evidence");
console.log("SC VERIF: " + (ve<0 ? "NOT FOUND" : JSON.stringify(sc.slice(ve, ve+900))));
// epics: context around ST-565 (I600)
const ep = rd("production/epics.md");
const epos = ep.indexOf("ST-565 (I600)");
console.log("EPICTX: " + (epos<0 ? "NOT FOUND" : JSON.stringify(ep.slice(epos-700, epos+400))));
// stories: ST-565 line
const st = rd("production/stories.md");
const spos = st.indexOf("- ST-565 E86 cockpit interior frame DOM (I600)");
console.log("STORYLINE: " + (spos<0 ? "NOT FOUND" : JSON.stringify(st.slice(spos, spos+2600))));
// iterations tail
const it = rd("production/iterations.md");
console.log("ITERTAIL: " + JSON.stringify(it.slice(-2400)));
// timeline tail
const tl = rd("production/timeline.md");
console.log("TIMETAIL: " + JSON.stringify(tl.slice(-1400)));
// active tail
const ac = rd("production/session-state/active.md");
console.log("ACTIVETAIL: " + JSON.stringify(ac.slice(-1000)));
// changelog head
const ch = rd("CHANGELOG.md");
console.log("CHHEAD: " + JSON.stringify(ch.slice(0, 700)));