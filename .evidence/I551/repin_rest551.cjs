// I551 (ST-517): re-pin level-flow.test.js, storage.test.js, campaignBoss.test.js for 5 levels.
const fs = require("fs");
const path = require("path");
function patch(rel, edits) {
  const FILE = path.resolve(__dirname, "..", "..", rel);
  const raw = fs.readFileSync(FILE);
  if (raw.slice(0, 3).toString("hex") === "efbbbf") throw new Error("unexpected BOM in " + rel);
  let s = raw.toString("utf8");
  for (const [anchor, replacement, label] of edits) {
    const c = s.split(anchor).length - 1;
    if (c !== 1) throw new Error(rel + " anchor count " + c + " != 1: " + label);
    s = s.replace(anchor, replacement);
  }
  fs.writeFileSync(FILE, s);
  console.log(rel, "repinned OK (" + edits.length + " edits)");
}

patch("tests/level-flow.test.js", [
  ["test('ST-453/ST-486: full campaign - 4 level bosses, victory on the final abyssal', () => {",
   "test('ST-453/ST-486/ST-517: full campaign - 5 level bosses, victory on the final archon', () => {",
   "title"],
  ["  for (let lvl = 1; lvl <= 4; lvl++) { // ST-486 (E69): +L4",
   "  for (let lvl = 1; lvl <= 5; lvl++) { // ST-486 (E69): +L4, ST-517 (E75): +L5",
   "loop"],
  ["    if (lvl < 4) {",
   "    if (lvl < 5) { // ST-517 (E75)",
   "warp gate"],
  ["  assert.deepEqual(byType(all, 'levelBoss').map(e => e.data.kind), ['monolith', 'splicer', 'monolith', 'monolith']); // ST-486: abyssal keeps kind 'monolith'",
   "  assert.deepEqual(byType(all, 'levelBoss').map(e => e.data.kind), ['monolith', 'splicer', 'monolith', 'monolith', 'monolith']); // ST-486: abyssal keeps kind 'monolith'; ST-517: archon keeps kind 'monolith' until D4/ST-519",
   "kinds"],
  ["  assert.equal(go[0].data.level, 4); // ST-486 (E69)",
   "  assert.equal(go[0].data.level, 5); // ST-517 (E75)",
   "go level"],
  ["  assert.equal(go[0].data.stage, 4); // ST-486 (E69)",
   "  assert.equal(go[0].data.stage, 5); // ST-517 (E75)",
   "go stage"],
  ["  assert.ok(isFinalLevel(4, CONFIG));",
   "  assert.ok(isFinalLevel(5, CONFIG)); // ST-517 (E75)",
   "isFinalLevel"],
  ["  assert.ok(isCampaignComplete(4, levelLength(4, CONFIG), CONFIG));",
   "  assert.ok(isCampaignComplete(5, levelLength(5, CONFIG), CONFIG)); // ST-517 (E75)",
   "isCampaignComplete"],
  ["  assert.equal(w.setCampaignStartLevel(99), 4); // campaign length (ST-486 E69)",
   "  assert.equal(w.setCampaignStartLevel(99), 5); // campaign length (ST-517 E75: L5)",
   "clamp99"]
]);

patch("tests/storage.test.js", [
  ["  assert.equal(a.setCampaignProgress(99), 4); // clamped to the campaign length (ST-486 E69: L4)",
   "  assert.equal(a.setCampaignProgress(99), 5); // clamped to the campaign length (ST-517 E75: L5)",
   "clamp99"],
  ["  assert.equal(a.setCampaignProgress(2), 4); // no-raise returns the current value",
   "  assert.equal(a.setCampaignProgress(2), 5); // no-raise returns the current value (ST-517 E75: L5)",
   "noRaise"],
  ["  assert.equal(a.setCampaignProgress(4), 4); // equal is not a raise",
   "  assert.equal(a.setCampaignProgress(4), 5); // below current is not a raise (ST-517 E75: L5)",
   "below"],
  ["  assert.equal(a.setCampaignProgress(5), 4); // clamps down, still not a raise",
   "  assert.equal(a.setCampaignProgress(5), 5); // equal is not a raise (ST-517 E75: L5)",
   "equal"],
  ["  assert.equal(a.getCampaignProgress(), 4);",
   "  assert.equal(a.getCampaignProgress(), 5); // ST-517 (E75)",
   "getProgress"]
]);

patch("tests/campaignBoss.test.js", [
  ["  for (const l of [1, 2, 3, 4]) { // ST-486 (E69): +L4\n    assert.ok(cb.hp[l] > 0);",
   "  for (const l of [1, 2, 3, 4, 5]) { // ST-486 (E69): +L4, ST-517 (E75): +L5\n    assert.ok(cb.hp[l] > 0);",
   "sanity loop"],
  ["  assert.deepEqual(cb.phases, { 1: 3, 2: 1, 3: 1, 4: 1 }); // ST-486 (E69)",
   "  assert.deepEqual(cb.phases, { 1: 3, 2: 1, 3: 1, 4: 1, 5: 3 }); // ST-486 (E69); ST-517 (E75): L5 archon 3-phase",
   "phases"],
  ["  assert.equal(boss(4, 'abyssal').phaseCount, 1); // ST-486 (E69)\n  for (const l of [1, 2, 3, 4]) {\n    const b = boss(l, ['monolith', 'splicer', 'prime', 'abyssal'][l - 1]);",
   "  assert.equal(boss(4, 'abyssal').phaseCount, 1); // ST-486 (E69)\n  assert.equal(boss(5, 'monolith').phaseCount, 3); // ST-517 (E75): L5 3-phase (archon kind lands D4/ST-519; monolith tint fallback)\n  for (const l of [1, 2, 3, 4, 5]) {\n    const b = boss(l, ['monolith', 'splicer', 'prime', 'abyssal', 'monolith'][l - 1]);",
   "phaseCounts"],
  ["  const tints = ['monolith', 'splicer', 'prime', 'abyssal']; // ST-486 (E69)\n  for (const l of [1, 2, 3, 4]) {",
   "  const tints = ['monolith', 'splicer', 'prime', 'abyssal', 'monolith']; // ST-486 (E69); ST-517 (E75): L5 monolith fallback\n  for (const l of [1, 2, 3, 4, 5]) {",
   "perLevelStats"],
  ["  const b4 = boss(4, 'abyssal'); // ST-486 (E69)\n  assert.equal(b4.kind, 'monolith');\n  assert.equal(b4.prime, false);\n  assert.equal(b4.abyssal, true);\n  assert.ok(b1.isCampaignBoss && b2.isCampaignBoss && b3.isCampaignBoss && b4.isCampaignBoss);",
   "  const b4 = boss(4, 'abyssal'); // ST-486 (E69)\n  assert.equal(b4.kind, 'monolith');\n  assert.equal(b4.prime, false);\n  assert.equal(b4.abyssal, true);\n  const b5 = boss(5, 'monolith'); // ST-517 (E75): archon falls back to monolith tint until D4/ST-519\n  assert.equal(b5.kind, 'monolith');\n  assert.equal(b5.prime, false);\n  assert.ok(b1.isCampaignBoss && b2.isCampaignBoss && b3.isCampaignBoss && b4.isCampaignBoss && b5.isCampaignBoss);",
   "canonical kind"],
  ["  for (const l of [1, 2, 3, 4]) { // ST-486 (E69)\n    assert.ok(bossKind(l).length > 0);",
   "  for (const l of [1, 2, 3, 4, 5]) { // ST-486 (E69), ST-517 (E75)\n    assert.ok(bossKind(l).length > 0);",
   "wiring loop"],
  ["  assert.deepEqual([bossKind(1), bossKind(2), bossKind(3), bossKind(4)], ['monolith', 'splicer', 'monolith-prime', 'abyssal']); // ST-486 (E69)",
   "  assert.deepEqual([bossKind(1), bossKind(2), bossKind(3), bossKind(4), bossKind(5)], ['monolith', 'splicer', 'monolith-prime', 'abyssal', 'archon']); // ST-486 (E69); ST-517 (E75)",
   "wiring kinds"]
]);
console.log("ALL REPINS DONE");
