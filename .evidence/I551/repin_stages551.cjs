const fs = require("fs");
const path = require("path");
const FILE = path.resolve(__dirname, "..", "..", "tests", "stages.test.js");
const raw = fs.readFileSync(FILE);
const bom = raw.slice(0,3).toString("hex") === "efbbbf" ? raw.slice(0,3) : null;
let s = raw.toString("utf8");
if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
function rep(anchor, replacement, label) {
  const c = s.split(anchor).length - 1;
  if (c !== 1) throw new Error("anchor count " + c + " != 1: " + label);
  s = s.replace(anchor, replacement);
}
rep(
"test('stages: killing the campaign final (level 4) boss = abyssal -> victory gameover (ST-486 E69)', () => {\n  const w = worldWithCampaignBoss(53, 4);\n  assert.equal(w.boss.kind, 'monolith');\n  assert.equal(w.boss.prime, false);\n  assert.equal(w.boss.abyssal, true); // ST-486 (E69)\n  assert.equal(w.boss.maxHp, 150); // ST-486: campaignBoss.hp[4]",
"test('stages: killing the campaign final (level 5) boss = archon (monolith tint until D4) -> victory gameover (ST-517 E75)', () => {\n  const w = worldWithCampaignBoss(53, 5);\n  assert.equal(w.boss.kind, 'monolith');\n  assert.equal(w.boss.prime, false);\n  assert.equal(w.boss.abyssal, false); // ST-517 (E75): archon identity lands D4/ST-519; monolith fallback is not abyssal\n  assert.equal(w.boss.maxHp, 175); // ST-517: campaignBoss.hp[5]",
"final-boss test body"
);
rep("  assert.equal(go.data.level, 4, 'gameover carries level 4');",
    "  assert.equal(go.data.level, 5, 'gameover carries level 5'); // ST-517 (E75)",
    "go level"
);
fs.writeFileSync(FILE, bom ? Buffer.concat([bom, Buffer.from(s, "utf8")]) : s);
console.log("stages.test.js repinned OK");
// scan for any other L4-final assumptions in stages.test.js
const m = s.match(/level 4|abyssal|ST-486/g) || [];
console.log("remaining L4/abyssal/ST-486 mentions:", m.length);
