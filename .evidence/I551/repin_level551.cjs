// I551 (ST-517): re-pin tests/level.test.js for 5 levels. File = no BOM, LF.
const fs = require("fs");
const path = require("path");
const FILE = path.resolve(__dirname, "..", "..", "tests", "level.test.js");
const raw = fs.readFileSync(FILE);
if (raw.slice(0, 3).toString("hex") === "efbbbf") throw new Error("unexpected BOM");
let s = raw.toString("utf8");
function rep(anchor, replacement, label) {
  const c = s.split(anchor).length - 1;
  if (c !== 1) throw new Error("anchor count " + c + " != 1: " + label);
  s = s.replace(anchor, replacement);
}
rep(
  "test('level: structure - 4 levels x 4 zones, lengths 330/370/400/420, campaign 1520 (ST-486 E69)', () => {",
  "test('level: structure - 5 levels x 4 zones, lengths 330/370/400/420/440, campaign 1960 (ST-517 E75)', () => {",
  "structure title"
);
rep("  assert.equal(levelCount(), 4);", "  assert.equal(levelCount(), 5); // ST-517 (E75): +L5", "levelCount");
rep("  assert.deepEqual([1, 2, 3, 4].map((l) => zoneCount(l)), [4, 4, 4, 4]);",
    "  assert.deepEqual([1, 2, 3, 4, 5].map((l) => zoneCount(l)), [4, 4, 4, 4, 4]); // ST-517: +L5", "zoneCount map");
rep("  assert.deepEqual([1, 2, 3, 4].map((l) => levelLength(l)), [330, 370, 400, 420]);",
    "  assert.deepEqual([1, 2, 3, 4, 5].map((l) => levelLength(l)), [330, 370, 400, 420, 440]); // ST-517: +L5", "levelLength map");
rep("  assert.equal(campaignLength(), 1520);", "  assert.equal(campaignLength(), 1960); // ST-517 (E75): +L5 (440)", "campaignLength");
rep("  assert.deepEqual([1, 2, 3, 4].map((l) => levelStartDistance(l)), [0, 330, 700, 1100]);",
    "  assert.deepEqual([1, 2, 3, 4, 5].map((l) => levelStartDistance(l)), [0, 330, 700, 1100, 1520]); // ST-517: +L5", "levelStartDistance map");
rep("  assert.deepEqual([1, 2, 3, 4].map((l) => bossKind(l)), ['monolith', 'splicer', 'monolith-prime', 'abyssal']);",
    "  assert.deepEqual([1, 2, 3, 4, 5].map((l) => bossKind(l)), ['monolith', 'splicer', 'monolith-prime', 'abyssal', 'archon']); // ST-517: +L5", "bossKind map");
rep("  assert.deepEqual([1, 2, 3, 4].map((l) => bossDistance(l)), [330, 370, 400, 420]);",
    "  assert.deepEqual([1, 2, 3, 4, 5].map((l) => bossDistance(l)), [330, 370, 400, 420, 440]); // ST-517: +L5", "bossDistance map");
rep(
  "  assert.deepEqual(checkpointsForLevel(4), [{ zone: 1, distance: 0 }, { zone: 2, distance: 100 }, { zone: 3, distance: 210 }, { zone: 4, distance: 330 }]); // ST-486 (E69)",
  "  assert.deepEqual(checkpointsForLevel(4), [{ zone: 1, distance: 0 }, { zone: 2, distance: 100 }, { zone: 3, distance: 210 }, { zone: 4, distance: 330 }]); // ST-486 (E69)\n  assert.deepEqual(checkpointsForLevel(5), [{ zone: 1, distance: 0 }, { zone: 2, distance: 100 }, { zone: 3, distance: 220 }, { zone: 4, distance: 350 }]); // ST-517 (E75)",
  "checkpoints L5 add"
);
rep("  assert.equal(isFinalLevel(4), true);",
    "  assert.equal(isFinalLevel(4), false); // ST-517 (E75): L5 is final now\n  assert.equal(isFinalLevel(5), true);",
  "isFinalLevel flip"
);
rep(
  "  assert.equal(isCampaignComplete(4, 419.9999), false);\n  assert.equal(isCampaignComplete(4, 420), true);",
  "  assert.equal(isCampaignComplete(4, 419.9999), false);\n  assert.equal(isCampaignComplete(4, 420), false); // ST-517 (E75): L4 cleared is not campaign-complete\n  assert.equal(isCampaignComplete(5, 439.9999), false);\n  assert.equal(isCampaignComplete(5, 440), true);",
  "campaignComplete flip"
);
fs.writeFileSync(FILE, s);
console.log("level.test.js repinned OK");
