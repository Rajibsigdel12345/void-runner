const fs = require("fs");

function read(p){ return fs.readFileSync(p, "utf8"); }
function replaceOnce(content, old, nw, label){
  const n = content.split(old).length - 1;
  if (n !== 1) { console.error("ANCHOR FAIL " + label + " count=" + n); process.exit(1); }
  return content.replace(old, nw);
}
function appendBlock(p, block, eol){
  let c = read(p);
  if (c.length && !c.endsWith(eol)) c += eol;
  c += block;
  if (!c.endsWith(eol)) c += eol;
  fs.writeFileSync(p, c);
  console.log("appended " + p);
}

// 1. iterations.md (BOM + CRLF-dominant) -> append I551 block
const iter =
"## I551 (ST-517, E75): D2 campaign Level 5 data WITH MEASUREMENT - Zenith Spire row + 4 zenith palettes + campaignBoss[5] + i18n en/zh/ja + test re-pins - endless bit-identical\r\n" +
"- Goal (ST-517 / D2): per production/scope-check-E75.md, append a 5th campaign level as PURE DATA: (a) config 5th level row 'Zenith Spire' [length 440 = zones 100/120/130/90, bossKind 'archon', 4 checkpoints]; (b) 4 new zone palettes, each dhue-checked distinguishable from all existing palettes; (c) campaignBoss hp/phases/score[5] = 175/3/3400; (d) i18n level.name.l5 + level.zone.l5z1..z4 en/zh/ja (CJK byte pipeline); (e) test re-pins. Pure data -> endless bit-identical (E64 guard).\r\n" +
"- Pre-state: local main = origin/main = c71e3ad (I550, pushed + deployed; tree clean except untracked COMMITMSG.txt, never staged).\r\n" +
"- Changed: src/core/config.js (+1,484 B source: 5th level row + 4 zenith palettes + campaignBoss hp/phases/score[5]; levelCount 4 -> 5) + src/core/strings.js (+15: l5 keys en/zh/ja via the CJK byte pipeline - cjk551 PASS 15/15 codepoint-verified, en EXACT vs config) + 5 test files re-pinned (tests/level.test.js, tests/level-flow.test.js, tests/storage.test.js, tests/campaignBoss.test.js, tests/stages.test.js: full-campaign loop <= 5, kinds array +5th 'monolith' [archon tint fallback until ST-519], clamp 99 -> 5, final-boss test moved to level 5). src/core/level.js UNCHANGED (pure data view, count-agnostic); src/core/campaignBoss.js UNCHANGED (per-level stats with fallbacks). .evidence/I551 force-added (cfg551.cjs + verify551pins.cjs + config551.json + dhue551.cjs/json + cjk551.cjs/json + repin_*.cjs x4 + verify551.mjs/json + l5_boot.png + run_closegate551.cjs + 5 harness .out + anchor probes).\r\n" +
"- Measured (.evidence/I551/verify551pins.cjs -> CONFIG551 PASS, config551.json): levelCount 5; lengths [330,370,400,420,440]; campaignLength 1960; levelStartDistance(5) 1520; bossDistance(5) 440; bossKind(5) 'archon'; checkpoints @ zone starts 0/100/220/350; isFinalLevel(4)=false / (5)=true; isCampaignComplete(5,440)=true; 4 zenith palettes exact values, each dhue >= 15.23 from all 15 existing palettes (gate > 12, dhue551 PASS); cb.hp[5]=175 / phases[5]=3 / score[5]=3400; storage clamp 99 -> 5. VERIFY551 PASS (.evidence/I551/verify551.mjs, headless SwiftShader, console err/warn 0/0, l5_boot.png): campaign boots at L5 with levelIntro {level:5, level.name.l5} + forced zoneEnter {zone:1, paletteId:'zenith-1', hazard:'moderate', mix phantom+drone+mine}; all probe values finite.\r\n" +
"- Gate evidence (measured): (1) npm test 1,201/1,201. (2) npm run build 0. (3) Headless smoke = VERIFY551 PASS (console 0/0 + l5_boot.png). (4) dist 5,560,918 B / 189 files (from 5,559,213: +1,705 B = L5 config row + l5 strings; ceiling still 6,100,000 B - the 7,400,000 B E75 ceiling applies only at the FIRST E75 asset landing, ST-518). CLOSE FLOOR = 539,082 B (6,100,000 - 5,560,918) >= 102,400 B floor -> cut ladder C1..C4 NOT invoked. (5) vendor r187 pins EXACT 4/4 (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017). (6) 5 fresh harness runs ALL EXACT (run_closegate551.cjs; each server started + verified + KILLed, ports verified free after): causal495 (dist :4200) CAUSAL495 PASS; causal483 (dev :5173) CAUSAL456 PASS; playframe483 + playframe491 (dev :5173) PLAYFRAME456 PASS (A 22/32,717 + 11/180, B 52/69,272 - NO re-pin: data-only, zero mesh/geometry change); pwa491 (dist :5199) SUMMARY 11/11. Stdout: .evidence/I551/{causal495,causal483,playframe483,playframe491,pwa491}.out.\r\n" +
"- Bookkeeping: iterations.md + stories.md (ST-517 DONE) + epics.md (ST-517 DONE in the E75 Stories line) + timeline.md + active.md + CHANGELOG (player-facing level-5 line).\r\n" +
"- Next: I552 = ST-518 (D3) - 2 new enemy ships (Blender 5.2.3 headless, E72 pipeline: per-ship brief + render-audit + sil96 gate + GLB swap + re-pin WITH MEASUREMENT; roles per research sec.3 D3: low-HP wide-arc 'sweeper' + stationary 'lantern/beacon'; candidates ~220 KB / ~3,000 t each). FIRST E75 asset landing -> 7,400,000 B dist ceiling + 7,297,600 B tripwire take effect (AGENTS.md ceiling line updated then).\r\n";
{
  let c = read("production/iterations.md");
  if (!c.endsWith("\r\n")) c += c.endsWith("\n") ? "\r" : "\r\n";
  c += iter;
  fs.writeFileSync("production/iterations.md", c);
  console.log("appended production/iterations.md");
}

// 2. stories.md (BOM + CRLF) -> replace ST-517 PENDING line
{
  const p = "production/stories.md";
  let c = read(p);
  const old = "- ST-517 E75 D2 Level 5 data (I551) - PENDING/E75 (config 5th level row + 4 dhue-checked zone palettes + campaignBoss.hp/phases/score[5] + i18n level.name.l5 + level.zone.l5z1..z4 en/zh/ja byte-verified + tests; pure data + level.js, endless bit-identical)";
  const nw = "- ST-517 E75 D2 Level 5 data (I551) - DONE I551 (Zenith Spire row [100/120/130/90 = 440, archon kind, mixes phantom+drone+mine / hunter+stinger+mine / gunship+sentry+wasp / phantom+bulwark+hunter+mine, optionalTargets golden / shielded / pod / rapid+shielded, checkpoints 0/100/220/350] + 4 zenith palettes dhue PASS [each >= 15.23 from all 15 existing, gate > 12] + campaignBoss hp 175 / phases 3 / score 3400 + i18n l5 keys en/zh/ja [CJK551 PASS 15/15 codepoint-verified; en EXACT vs config] + re-pinned level/level-flow/storage/campaignBoss/stages tests [full-campaign loop <= 5, clamp 99 -> 5, final-boss test -> level 5]; data-only -> endless bit-identical; quality bar 6/6 [tests 1,201/1,201 / build 0 / VERIFY551 PASS [console 0/0 + l5_boot.png] / dist 5,560,918 B / 189 [floor 539,082 B] / vendor 4/4 / 5 fresh harnesses ALL EXACT via run_closegate551.cjs [A 22/32,717 + 11/180, B 52/69,272 NO re-pin + pwa SUMMARY 11/11; stdout .evidence/I551/*.out]])";
  c = replaceOnce(c, old, nw, "stories ST-517");
  fs.writeFileSync(p, c);
  console.log("replaced stories.md ST-517");
}

// 3. epics.md (BOM + CRLF) -> replace ST-517 segment in the E75 Stories line
{
  const p = "production/epics.md";
  let c = read(p);
  const old = "ST-517 (I551) D2 Level 5 data (config row + 4 dhue-checked palettes + campaignBoss[5] + i18n en/zh/ja + tests) - PENDING.";
  const nw = "ST-517 (I551) D2 Level 5 data (config row + 4 dhue-checked palettes + campaignBoss[5] + i18n en/zh/ja + tests) - DONE I551 (Zenith Spire 440u / 4 zenith palettes dhue PASS >= 15.23 / campaignBoss[5] 175hp-3phase-3400 / i18n en/zh/ja CJK-verified / 5 test files re-pinned; data-only endless bit-identical; quality bar 6/6 [dist 5,560,918 B / 189, 5 harnesses fresh EXACT no re-pin]).";
  c = replaceOnce(c, old, nw, "epics ST-517");
  fs.writeFileSync(p, c);
  console.log("replaced epics.md ST-517");
}

// 4. timeline.md (BOM + CRLF) -> append I551 line
{
  const line = "I551 (ST-517, E75) - D2 campaign Level 5 data WITH MEASUREMENT: config 5th level row 'Zenith Spire' [length 440 = zones 100/120/130/90, bossKind archon, checkpoints @ 0/100/220/350, mixes phantom+drone+mine / hunter+stinger+mine / gunship+sentry+wasp / phantom+bulwark+hunter+mine] + 4 zenith palettes [dhue551 PASS - each >= 15.23 from all 15 existing, gate > 12] + campaignBoss[5] hp 175 / phases 3 / score 3400 + i18n l5 keys en/zh/ja [CJK551 PASS 15/15 codepoint-verified, en EXACT vs config] + re-pinned tests [level / level-flow / storage / campaignBoss / stages: full-campaign loop <= 5, clamp 99 -> 5, final-boss test -> level 5] / data-only: level.js + campaignBoss.js UNCHANGED, endless bit-identical [E64] / VERIFY551 PASS [headless SwiftShader: L5 boot levelIntro + zoneEnter zenith-1 + all finite, console 0/0, l5_boot.png] / quality bar 6/6 [tests 1,201/1,201 / build 0 / dist 5,560,918 B / 189 [+1,705 B vs I550; CLOSE FLOOR 539,082 B >= 102,400 B -> cut ladder NOT invoked; 7,400,000 B E75 ceiling still applies only at ST-518] / vendor 4/4 / 5 fresh harnesses ALL EXACT via run_closegate551.cjs [A 22/32,717 + 11/180, B 52/69,272 NO re-pin + pwa SUMMARY 11/11; stdout .evidence/I551/*.out]]; NEXT I552 (ST-518 D3: 2 new enemy ships, Blender 5.2.3 headless - FIRST E75 asset landing, 7,400,000 B ceiling applies)\r\n";
  appendBlock("production/timeline.md", line, "\r\n");
}

// 5. active.md (no BOM, LF-dominant) -> append user-facing paragraph with LF
{
  const para = "I551 (ST-517, E75) done: the campaign is one step longer. After the last level you thought you knew, there is now a fifth one - the Zenith Spire - with four new zones (Spire Approach, Halo Circuit, Crown Ascent, Archon Threshold) and a brand-new look: a deep blue-white sky palette as you climb, and a stronger final boss waiting at the end (its full dedicated design lands next round - for now it wears the existing boss's silhouette). All menu text is available in English, Chinese, and Japanese. Everything verified: 1,201/1,201 tests, all five regression checks exact as pinned, and the downloadable bundle is 5,560,918 bytes - under the 6.1 MB limit. The push + Pages deploy is delegated. NEXT I552: two brand-new enemy ships.\n";
  appendBlock("production/session-state/active.md", para, "\n");
}

// 6. CHANGELOG.md (BOM + CRLF) -> insert I551 line ABOVE the - I550: line
{
  const p = "CHANGELOG.md";
  let c = read(p);
  const old = "\n- I550: In the cockpit";
  const nw = "\n- I551: The campaign is one step longer. After the last level you thought you knew, there is now a fifth one - the Zenith Spire - with four new zones (Spire Approach, Halo Circuit, Crown Ascent, Archon Threshold) and a brand-new look: a deep blue-white sky palette as you climb. A stronger final boss waits at the end (its full dedicated design arrives next round). The menu text is available in English, Chinese, and Japanese. The downloadable bundle is 5,560,918 bytes - under the 6.1 MB limit.";
  c = replaceOnce(c, old, nw + old, "changelog I550 anchor");
  fs.writeFileSync(p, c);
  console.log("inserted CHANGELOG.md I551 line");
}
console.log("BOOKKEEP551 PASS");
