const fs = require("fs");
function rd(p){ return fs.readFileSync(p,"latin1"); }
function count(s, sub){ let n=0,i=0; while(true){ i=s.indexOf(sub,i); if(i<0) break; n++; i++; } return n; }
const ch = rd("CHANGELOG.md");
const i599 = ch.indexOf("- I599: ");
console.log("CH I599 line: " + JSON.stringify(ch.slice(i599, i599+400)) + " count=- I599: " + count(ch, "- I599: "));
const st = rd("production/stories.md");
console.log("ST end-anchor count: " + count(st, "playframe A draw calls 22 unchanged) + quality bar."));
const sc = rd("production/scope-check-E86.md");
console.log("SC ~1.5-2.5 KB count: " + count(sc, "~1.5-2.5 KB"));
const ep = rd("production/epics.md");
console.log("EP anchor count: " + count(ep, "ST-565 (I600) cockpitFrame.js + main.js wiring + smoke600 / ST-566 (I601)"));
console.log("ST start-anchor count: " + count(st, "- ST-565 E86 cockpit interior frame DOM (I600) - PENDING:"));