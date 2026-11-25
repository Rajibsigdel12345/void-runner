const fs = require("fs");
function assert(cond, msg) { if (!cond) { console.error("ASSERT FAIL: " + msg); process.exit(1); } }
// --- parse data file into blocks ---
const raw = fs.readFileSync(".evidence/I589/bk_data589.txt", "utf8");
assert(/^[\x00-\x7F]*$/.test(raw), "data file must be ASCII-only");
const dlines = raw.split(/\r?\n/);
const blocks = {};
let cur = null;
for (const l of dlines) {
  if (/^@@/.test(l)) { cur = l.slice(2).replace(/@@END$/, ""); blocks[cur] = []; }
  else if (cur !== null) blocks[cur].push(l);
}
for (const k of Object.keys(blocks)) {
  while (blocks[k].length && blocks[k][blocks[k].length - 1] === "") blocks[k].pop();
}
assert(blocks.EPICS.length === 9, "EPICS block 9 lines, got " + blocks.EPICS.length);
assert(blocks.EPICS[0].startsWith("## E84 - "), "EPICS header");
assert(blocks.EPICS[1] === "", "EPICS blank after header");
assert(blocks.STORIES.length === 6, "STORIES 6 lines, got " + blocks.STORIES.length);
assert(blocks.ITERS[0].startsWith("## I589 (ST-556, E84): "), "ITERS header");
assert(blocks.ITERS[1] === "", "ITERS blank after header");
assert(blocks.TIMELINE.length === 1 && blocks.TIMELINE[0].startsWith("I589 (ST-556, E84) done: "), "TIMELINE 1 line");
assert(blocks.ACTIVE.length === 1 && blocks.ACTIVE[0].startsWith("- NEXT at I590 = ST-557 (E84): "), "ACTIVE 1 line");
assert(blocks.CHANGELOG.length === 1 && blocks.CHANGELOG[0].startsWith("- I589: "), "CHANGELOG 1 line");
// --- 1. epics.md: insert E84 section above the E83 header (CRLF) ---
{
  const p = "production/epics.md";
  const buf = fs.readFileSync(p);
  const txt = buf.toString("utf8");
  const lines = txt.split("\r\n");
  const h = lines.findIndex(l => l.startsWith("## E83 "));
  assert(h > 1, "E83 header found, idx " + h);
  assert(lines[h - 1].startsWith("- Status: CLOSED I576"), "line above E83 is E80 Status line");
  lines.splice(h, 0, ...blocks.EPICS);
  fs.writeFileSync(p, Buffer.from(lines.join("\r\n"), "utf8"));
  console.log("epics.md: inserted " + blocks.EPICS.length + " lines above E83 (was line " + (h + 1) + ")");
}
// --- 2. stories.md: append 6 lines (bare LF) ---
{
  const p = "production/stories.md";
  const buf = fs.readFileSync(p);
  assert(buf.slice(-13).toString("latin1") === " hygiene)\n" || buf.slice(-20).toString("latin1").endsWith("hygiene)\n"), "stories tail anchor");
  const add = blocks.STORIES.map(l => l + "\n").join("");
  fs.writeFileSync(p, Buffer.concat([buf, Buffer.from(add, "ascii")]));
  console.log("stories.md: appended 6 lines");
}
// --- 3. iterations.md: append I589 entry (bare LF) ---
{
  const p = "production/iterations.md";
  const buf = fs.readFileSync(p);
  assert(buf.slice(-22).toString("latin1").endsWith("Dewey I588).\n"), "iters tail anchor: " + JSON.stringify(buf.slice(-22).toString("latin1")));
  const add = blocks.ITERS.map(l => l + "\n").join("");
  fs.writeFileSync(p, Buffer.concat([buf, Buffer.from(add, "ascii")]));
  console.log("iterations.md: appended " + blocks.ITERS.length + " lines");
}
// --- 4. timeline.md: append 1 line (bare LF) ---
{
  const p = "production/timeline.md";
  const buf = fs.readFileSync(p);
  assert(buf.slice(-20).toString("latin1").endsWith("7.4 MB limit.\n"), "timeline tail anchor: " + JSON.stringify(buf.slice(-20).toString("latin1")));
  fs.writeFileSync(p, Buffer.concat([buf, Buffer.from(blocks.TIMELINE[0] + "\n", "ascii")]));
  console.log("timeline.md: appended 1 line");
}
// --- 5. active.md: append 1 line (CRLF) ---
{
  const p = "production/session-state/active.md";
  const buf = fs.readFileSync(p);
  assert(buf.slice(-24).toString("latin1").endsWith("the queue leaves room.\r\n"), "active tail anchor: " + JSON.stringify(buf.slice(-24).toString("latin1")));
  fs.writeFileSync(p, Buffer.concat([buf, Buffer.from(blocks.ACTIVE[0] + "\r\n", "ascii")]));
  console.log("active.md: appended 1 line");
}
// --- 6. CHANGELOG.md: insert above the - I588: line (LF, no trailing NL) ---
{
  const p = "CHANGELOG.md";
  const buf = fs.readFileSync(p);
  const txt = buf.toString("utf8");
  assert(!txt.endsWith("\n"), "changelog must have no trailing NL pre-write");
  const lines = txt.split("\n");
  const i88 = lines.findIndex(l => l.startsWith("- I588: "));
  assert(i88 === 9, "I588 line at index 9, got " + i88);
  lines.splice(i88, 0, blocks.CHANGELOG[0]);
  fs.writeFileSync(p, Buffer.from(lines.join("\n"), "utf8"));
  console.log("CHANGELOG.md: inserted I589 line above I588 (index 9)");
}
console.log("ALL 6 BOOKKEEPING WRITES OK");
