const fs = require("fs");
function count(s, sub){ let n=0,i=0; while(true){ i=s.indexOf(sub,i); if(i<0) break; n++; i++; } return n; }
const f = "production/timeline.md";
const s = fs.readFileSync(f, "latin1");
const bomB = count(s, "\u00EF\u00BB\u00BF");
if(!s.endsWith("the old 180-degree-flip failure mode can no longer happen.")){ console.log("STILL WRONG TAIL: " + JSON.stringify(s.slice(-80))); process.exit(1); }
const t = s + "\r\n\r\nI600 (ST-565, E86) done: the cockpit view now has a subtle dashboard and canopy frame around it, so first-person flight feels like sitting in a real cockpit. It fades in and out with the cockpit camera and never gets in the way of the instruments or the crosshair.";
const bomA = count(t, "\u00EF\u00BB\u00BF");
if(bomB !== bomA){ console.log("BOM DELTA"); process.exit(1); }
fs.writeFileSync(f, t, "latin1");
console.log("OK timeline-I600 " + s.length + " -> " + t.length + " (BOM " + bomA + ")");