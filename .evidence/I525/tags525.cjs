// I525: apply the 15 'hit' payload tags to src/core/game.js (CRLF file).
const fs = require("fs");
const p = "src/core/game.js";
const raw = fs.readFileSync(p, "latin1");
const before = raw.length;
const lines = raw.split("\n");
const OLD = "lives: livesLeft });";
const edits = [
  [519, "source: 'rock_' + (hitRock ? hitRock.size : '?')"],
  [579, "source: 'mine'"],
  [889, "source: 'boss_' + this.boss.kind"],
  [991, "source: 'warden'"],
  [1009, "source: 'bullet', sourceSpeed: Math.hypot(b.vel.x, b.vel.y), sourceRadius: b.radius"],
  [1075, "source: 'drone'"],
  [1165, "source: 'stinger'"],
  [1213, "source: 'hunter'"],
  [1268, "source: 'gunship'"],
  [1525, "source: 'sentry'"],
  [1541, "source: 'wasp'"],
  [1557, "source: 'pod'"],
  [1574, "source: 'phantom'"],
  [1590, "source: 'hauler'"],
  [1606, "source: 'bulwark'"],
];
for (const [idx, add] of edits) {
  const l = lines[idx];
  const cr = l.endsWith("\r") ? "\r" : "";
  if (!l.endsWith(OLD + cr)) { console.error("FAIL: line " + idx + " suffix mismatch: " + JSON.stringify(l.slice(-70))); process.exit(1); }
  if (!l.includes("this.emit('hit'")) { console.error("FAIL: line " + idx + " not a hit emit"); process.exit(1); }
  if (l.includes("source:")) { console.error("FAIL: line " + idx + " already tagged"); process.exit(1); }
  lines[idx] = l.slice(0, l.length - (OLD.length + cr.length)) + "lives: livesLeft, " + add + " });" + cr;
}
const after = lines.join("\n");
fs.writeFileSync(p, after, "latin1");
console.log("bytes before:", before, "after:", after.length, "delta:", after.length - before);
console.log("sample 519:", lines[519].replace(/\r$/, "").slice(-95));
console.log("sample 1009:", lines[1009].replace(/\r$/, "").slice(-115));
console.log("sample 1606:", lines[1606].replace(/\r$/, "").slice(-85));
const crlf = (after.match(/\r\n/g) || []).length; const lf = (after.match(/\n/g) || []).length;
console.log("CRLF:", crlf, "LF:", lf, "pure CRLF:", crlf === lf);