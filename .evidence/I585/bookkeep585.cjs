// I585 bookkeeper (E83 open, docs-only): epics E83 OPEN section insert above the E82 header,
// stories ST-552 line append, iterations I585 entry append, timeline I585 line append,
// CHANGELOG insert above the I584 line, active NEXT-at-I586 line append.
// Byte-safe: unique-anchor assert + BOM-count assert per file (delta 0). ASCII-only content.
const fs = require("fs");
function read(p) { return fs.readFileSync(p, "utf8"); }
function bomCount(s) { let n = 0; for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 0xFEFF) n++; return n; }
function assertOnce(s, anchor, label) { const i = s.indexOf(anchor); if (i === -1) throw new Error("ANCHOR NOT FOUND: " + label); if (s.indexOf(anchor, i + 1) !== -1) throw new Error("ANCHOR NOT UNIQUE: " + label); }
function assertAscii(s, label) { for (let i = 0; i < s.length; i++) { if (s.charCodeAt(i) > 126) throw new Error("NON-ASCII in " + label + " at " + i); } }
function write(p, s) { fs.writeFileSync(p, s, "utf8"); }

// ---------- epics.md (CRLF, BOM 3, trailing \r\n): E83 OPEN section above the E82 header ----------
{
  const p = "production/epics.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("epics: expected trailing CRLF");
  const hdr = "## E82 - Wave-5 Monolith Wall II (frozen E82 lever: boss.burst.every 4.0 -> 4.8, carried from E81) - CLOSED I584";
  assertOnce(s0, hdr, "epics E82 header");
  const lines = [
    "## E83 - Ship v8 \"Rigid Airship Warship\" remaster (Blender 5.2.3 headless; TOTAL AIM 60,000 tris / HARD 65,000; GLB target <= 1,400,000 B / hard 1,500,000 B) - OPEN I585",
    "",
    "- Goal: deliver the user's #1 queue item as the main-character hero asset - ship v8 \"Rigid Airship Warship\", a full Blender 5.2.3 headless rebuild of assets/ship.glb: a real rigid-airship (zeppelin warship) silhouette with three-layer detail (R8.1-R8.6), TOTAL AIM 60,000 tris / HARD 65,000 (exit-1 gate), GLB target <= 1,400,000 B / hard 1,500,000 B, under the FROZEN v7 contract (3 materials, COLOR_0 on Hull+Wings only, grayscale bake, export flags verbatim, axis convention, pinned windows). Build to .evidence/I586/ ONLY; the swap lands at ST-554 WITH MEASUREMENT (asset-cap renegotiation + playframe A/B re-pin); G83.0 close at I588. The P1/P2/P3 balance levers stay registered for E84+ (five single-lever rounds E78-E82 gave diminishing returns: B56 12/30 -> 9/30; residual wall = a MEASURED mix of burst-class 5 + aimed-class 4).",
    "- Research: production/scope-check-E83.md (I585, FROZEN, 10,889 B, DoD last) + .evidence/I585/measure585.cjs/.txt (pre-state: 34 GLB 4,009,384 B / 90,977 tris; ship v7 740,012 B / 32,499 tris; dist 6,430,174 B / 203; asset cap 4,034,560 B / 91,050 t; pins playframe A 22/32,717 + B 52/73,172, causal483 11,334, pwa491 11/11) + reference grounding (Parallel web search search_f15923b0bcd73c6cb173f4fca746d3bc: Creative Bloq 'Modelling a spaceship for gameplay design' [02 scale cues, 03 silhouette] / Captains.Space 'Playable Spaceship Design Guide' [three-layer detail, silhouette readability] / CGMA greeble pass / waterpigs 'KSP Airship Design' [rigid-airship anatomy: transverse + longitudinal ribs, cruciform tail, belly gondola, nacelles] / The Rookies [blockout -> SubD, panels] + image search search_9c4b826d2c8b66a5102db6a774c24e23: cgtrader 'Zeppelin Airship' references + sketchfab steampunk airships [janmesh, pbr.game.ready Airship, juttah] + threejs-game-studio references/procedural-modeling.md [silhouette-first, detail where the camera sees, hero-vehicle recipe] + YouTube MCP: METADATA ONLY [transcript fetch BROKEN, recorded honestly - do NOT retry]) + v7 build lineage (.evidence/I540/build_ship_v7.py: V7_* density knobs + per-node AIM/CAP + TOTAL gate + exit-1 + vnoise displace; D:/Blender/blender.exe 5.2.3 LTS hash e13b728c6880, full-path invocation, -b --factory-startup -P <script>).",
    "- Stories: ST-552 PENDING I585 (open + scope-check + bookkeeping, docs-only) / ST-553 PENDING I586 (v8 build + QA + export to .evidence/I586/ ONLY) / ST-554 PENDING I587 (THE SWAP: assets/ship.glb = v8 + v7 backup -> .evidence/I587/ + AGENTS asset-cap renegotiation WITH MEASUREMENT + playframe A/B re-pin WITH MEASUREMENT + 5-harness gate) / ST-555 PENDING I588 (G83.0 close gate, .evidence/I584 runner clone).",
    "- Constraints: zero src/ changes until ST-554; the swap is a pure asset replacement (generic GLTF loader; node/material contracts unchanged). v8 lands in .evidence/I586/ only (NEVER assets/ directly). The 6 node names EXACT per v7 (HULL/WINGS/ENGINE/NOZZLE/COCKPIT/FIN); 3 materials (VR_Ship_Hull/VR_Ship_Wing/VR_Ship_Cockpit); COLOR_0 on exactly 2 prims (Hull+Wings); grayscale bake domain [0.30, 1.55], L = (-0.45, -0.55, 0.70).normalized(), k_hull 0.60 / k_wings 0.80 (tune + document if spread < 0.35); export flags verbatim; single root; no rig/UV/animation; axis convention = v7 build-space verbatim; pinned windows unchanged (min-y >= -0.400; span 3.6..4.4; length 2.34..2.86; engine mouth band contains z = -0.8; command tower z ~0.5-0.9 / y ~0.8-1.1). WebGPU default-arm switch stays frozen (E66/I495); the ?fx=webgpu arm must load + render v8 (causal495 report-only arm).",
    "- Cut ladder: C1 (build overage after ONE decimate pass) = tune the V8_* density knobs down, max 2 build iterations, re-gate. C2 (P1 gate fail after ONE rework) = accept WITHOUT the swap (v7 stays, E83 accept round, the v8 residual + audit evidence logged in .evidence/I586/). C3 (dist tripwire 7,297,600 B at the swap) = decimate v8 toward 1.4 MB and re-gate, or revert the swap (v7 restored from the .evidence/I587 backup).",
    "- Risks: R-1 a 65k-tri hero mesh on low-end GPUs (mitigation: R8.3 tri placement - the chase cam sees rear 3/4, flanks, deck top; the underside is cheap; draw calls UNCHANGED - same 3 materials / 6 nodes). R-2 GLB size overage (mitigation: decimate pass before the swap = C3; v7 stays backed up until G83.0). R-3 P1 gate subjectivity (mitigation: the frozen 4-view x (clay+tint) + 96 px silhouette evidence set; ONE rework (C2); the verdict is logged before any swap). R-4 the future cockpit cam needs cockpit-friendly geometry (mitigation: the command-tower window frozen at z 0.5-0.9 / y 0.8-1.1 with the cyan emissive slot).",
    "- Status: OPEN (opened I585). Pre-state local == origin 7eabf24 (I584, E82 CLOSED accept round, push-verified). Next owner: I586 (ST-553) = the v8 Blender build (.evidence/I586/build_ship_v8.py cloned from the .evidence/I540/build_ship_v7.py pattern; EEVEE audit 960x540 dark world 3 suns, 4 views x (clay+tint) + front/rear sil96; P1 gate: must read as a RIGID AIRSHIP at 96 px, esp. rear [chase cam] + side).",
    ""
  ];
  const at = s0.indexOf(hdr);
  const s1 = s0.slice(0, at) + lines.join("\r\n") + s0.slice(at);
  if (bomCount(s1) !== b0) throw new Error("epics BOM delta");
  assertAscii(lines.join("\r\n"), "epics E83 insert");
  write(p, s1);
  console.log("epics.md OK");
}

// ---------- stories.md (tail-LF, BOM 5): ST-552 line append ----------
{
  const p = "production/stories.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n") || s0.endsWith("\r\n")) throw new Error("stories: expected trailing bare LF");
  const line = "ST-552 E83 open + scope-check (I585) - DONE I585: E83 OPENED with the PIVOT decision (the user's #1 queue item = the Blender airship remaster; five single-lever balance rounds E78-E82 gave diminishing returns [B56 12/30 -> 9/30, median death wave 8 -> 9, residual wall = MEASURED mix burst-class 5 + aimed-class 4]; P1/P2/P3 registration INTACT for E84+) + production/scope-check-E83.md (FROZEN, 10,889 B: v8 \"Rigid Airship Warship\" brief R8.1-R8.6 + per-node AIM/CAP [HULL 28,000/33,000 / WINGS 5,500/7,000 / ENGINE 11,500/13,500 / NOZZLE 4,500/5,500 / COCKPIT 6,500/8,000 / FIN 4,000/5,500] + TOTAL AIM 60,000 / HARD 65,000 + GLB target <= 1,400,000 B / hard 1,500,000 B + v7 contract FROZEN verbatim + pinned windows unchanged + PRE-REGISTERED budgets [dist target ~7,090,162 B / hard ~7,190,162 B, ceiling 7,400,000 KEEP, tripwire 7,297,600; asset cap -> 4,660 KiB (4,771,840 B) / 123,550 t at ST-554 WITH MEASUREMENT; playframe A/B re-pin WITH MEASUREMENT [expected A ~60,218]; causal495/483 + pwa491 EXPECTED EXACT per the I541 ship-swap precedent] + cut ladder C1/C2/C3 + DoD G83.0 last) + .evidence/I585/measure585.cjs/.txt (pre-state: 34 GLB 4,009,384 B / 90,977 t; ship v7 740,012 B / 32,499 t; dist 6,430,174 B / 203; cap 4,034,560 B / 91,050 t) - net-zero src CONFIRMED (docs + .evidence only) - quality bar 6/6 (net-zero: tests 1,237/1,237 / build 0 / dist byte-identical 6,430,174 B / 203 / vendor 4/4 EXACT / BOM delta 0 / hygiene [zero servers/tabs])\n";
  assertAscii(line, "stories ST-552");
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("stories BOM delta");
  write(p, s1);
  console.log("stories.md OK");
}

// ---------- iterations.md (tail-LF, BOM 5): I585 entry append ----------
{
  const p = "production/iterations.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("iterations: expected trailing LF");
  const entry = "## I585 (ST-552, E83): E83 OPENED - ship v8 \"Rigid Airship Warship\" remaster epic (PIVOT to the user's #1 queue item; scope-check FROZEN; docs-only net-zero)\n\n"
    + "- Pre-state: local == origin 7eabf24 (I584, E82 CLOSED accept round, push-verified). Tree clean apart from the new untracked .evidence/I585/.\n"
    + "- Change: net-zero src. Files: production/scope-check-E83.md (new, FROZEN, 10,889 B, BOM 1 / CRLF / no trailing NL / ASCII) + .evidence/I585/ (measure585.cjs + measure585.txt pre-state measurement + probe1.cjs + sc583.txt + mk583.cjs + bookkeep585.cjs + commit-msg) + the 6 bookkeeping files updated here.\n"
    + "- E83 OPEN (PIVOT decision): E82 closed (I584) with the residual registration P1 burst.count 12 -> 9 / P2 burst.speed 7.0 -> 6.0 / P3 fireEvery 2.2 -> 2.6 for E83+. Five single-lever rounds E78-E82 gave diminishing returns (B56 12/30 -> 9/30; median death wave 8 -> 9; residual wall = a MEASURED mix of burst-class 5 + aimed-class 4). E83 takes the user's explicitly and repeatedly ranked #1 item: the real-airship hero remaster. P1/P2/P3 stay registered for E84+ (ONE by that epic's own frozen rules, scope-check FIRST per the frozen E70 protocol).\n"
    + "- Frozen v8 brief (scope-check sec 3): R8.1-R8.6 pillars (silhouette-first rigid airship / three-layer detail / tris where the camera sees / functional greebles / scale cues / rigid-airship anatomy: 18-20 transverse ribs + 6 longitudinal gothic, cruciform tail, belly gondola, 4 nacelles + 1 centerline stack, ALL engine mouths z -0.8..-1.3 containing the flame apex z = -0.8); TOTAL AIM 60,000 / HARD 65,000 tris (exit-1 gate); per-node AIM/CAP HULL 28,000/33,000 / WINGS 5,500/7,000 / ENGINE 11,500/13,500 / NOZZLE 4,500/5,500 / COCKPIT 6,500/8,000 / FIN 4,000/5,500; GLB target <= 1,400,000 B / hard 1,500,000 B (v7 density 22.77 B/tri); v7 contract FROZEN verbatim (3 materials, COLOR_0 on exactly 2 prims, grayscale bake [0.30, 1.55] k 0.60/0.80, export flags, axis convention); pinned windows unchanged (min-y >= -0.400; span 3.6..4.4; length 2.34..2.86; engine mouth band contains z = -0.8; command tower z ~0.5-0.9 / y ~0.8-1.1).\n"
    + "- PRE-REGISTERED budgets (scope-check sec 4): code delta 0; dist 6,430,174 - 740,012 (v7) + v8 -> target ~7,090,162 B / hard ~7,190,162 B (ceiling 7,400,000 KEEP; tripwire 7,297,600, margin >= 107,438 B at hard); asset-cap renegotiation at ST-554 WITH MEASUREMENT: 4,034,560 B / 91,050 t -> 4,771,840 B (4,660 KiB) / 123,550 t; pins: playframe A 22/32,717 -> 22/(v8 tris + 218) WITH MEASUREMENT (expected ~60,218 if v8 lands at 60,000), playframe B 52/73,172 -> re-pin WITH MEASUREMENT; causal495 / causal483 / pwa491 EXPECTED EXACT NO re-pin (I541 ship-swap precedent: only playframe re-pinned); vendor r187 4 pins unchanged (three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017).\n"
    + "- Cut ladder (frozen): C1 build overage after ONE decimate pass -> V8_* knob tune down, max 2 build iterations; C2 P1 gate fail after ONE rework -> accept WITHOUT the swap (v7 stays, E83 accept round, residual + audit logged in .evidence/I586/); C3 dist tripwire at the swap -> decimate v8 toward 1.4 MB or revert the swap (v7 restored from the .evidence/I587 backup).\n"
    + "- Quality bar 6/6: npm test 1,237/1,237; npm run build 0; dist re-measured 6,430,174 B / 203 byte-identical; vendor 4/4 EXACT (three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017); BOM delta 0 (AGENTS 1 / epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / CHANGELOG 7); hygiene (all 4 ports 5173/4173/4200/5199 free; zero browser tabs; zero terminals left running). No browser smoke (no render change; headless default).\n"
    + "- Next I586 (ST-553) = the v8 Blender build: .evidence/I586/build_ship_v8.py cloned from the .evidence/I540/build_ship_v7.py pattern (V8_* density knobs + per-node AIM/CAP + TOTAL gate + exit-1 + vnoise displace), D:/Blender/blender.exe 5.2.3 LTS full path, -b --factory-startup; EEVEE audit 960x540 dark world 3 suns, 4 views x (clay+tint) + front/rear sil96; P1 gate: must read as a RIGID AIRSHIP at 96 px, esp. rear [chase cam] + side; output to .evidence/I586/ ONLY (never assets/ directly); no game files touched.\n";
  assertAscii(entry, "iterations I585");
  const s1 = s0 + entry;
  if (bomCount(s1) !== b0) throw new Error("iterations BOM delta");
  write(p, s1);
  console.log("iterations.md OK");
}

// ---------- timeline.md (LF, BOM 3, trailing \n): I585 line append ----------
{
  const p = "production/timeline.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("timeline: expected trailing LF");
  const line = "I585 (ST-552, E83) done: the paperwork for the big ship rebuild is opened. The current ship stays exactly as it is until the new one passes every check; the new design is a proper rigid airship - a long ribbed envelope, a belly gondola, four nacelles, a cruciform tail - with the extra detail placed where the camera actually looks. Nothing in the game changed. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  assertAscii(line, "timeline I585");
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("timeline BOM delta");
  write(p, s1);
  console.log("timeline.md OK");
}

// ---------- CHANGELOG.md (LF, NO trailing NL, BOM 7): I585 line above the I584 line ----------
{
  const p = "CHANGELOG.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  const a = "- I584: ";
  assertOnce(s0, a, "changelog I584 line");
  const entry = "- I585: No visible change - the paperwork for the big ship rebuild is opened: the new hero ship is designed as a proper rigid airship (long ribbed envelope, belly gondola, four nacelles, cruciform tail) and will be built and checked before it ever replaces the current one. Nothing in the game changed. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  assertAscii(entry, "changelog I585");
  const s1 = s0.replace(a, entry + a);
  if (bomCount(s1) !== b0) throw new Error("changelog BOM delta");
  write(p, s1);
  console.log("CHANGELOG.md OK");
}

// ---------- active.md (CRLF, BOM 0, trailing \r\n): NEXT-at-I586 line append ----------
{
  const p = "production/session-state/active.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("active: expected trailing CRLF");
  const line = "- NEXT at I586 = ST-553 (E83): the v8 Blender build - .evidence/I586/build_ship_v8.py (cloned from the .evidence/I540/build_ship_v7.py pattern: V8_* density knobs + per-node AIM/CAP [HULL 28,000/33,000 / WINGS 5,500/7,000 / ENGINE 11,500/13,500 / NOZZLE 4,500/5,500 / COCKPIT 6,500/8,000 / FIN 4,000/5,500] + TOTAL AIM 60,000 / HARD 65,000 exit-1 + GLB 1.4/1.5 MB gate + vnoise displace); D:/Blender/blender.exe full path, -b --factory-startup; EEVEE audit 960x540 dark world 3 suns, 4 views x (clay+tint) + front/rear sil96; P1 gate = must read as a RIGID AIRSHIP at 96 px (esp. rear chase + side); v7 contract FROZEN verbatim (3 materials / COLOR_0 on Hull+Wings / bake [0.30,1.55] / export flags / axis convention / pinned windows: min-y >= -0.400, span 3.6..4.4, length 2.34..2.86, engine mouth band z = -0.8, command tower z 0.5-0.9 / y 0.8-1.1); output to .evidence/I586/ ONLY (never assets/); then I587 (ST-554) = THE SWAP + asset-cap renegotiation WITH MEASUREMENT [4,660 KiB / 123,550 t] + playframe A/B re-pin WITH MEASUREMENT + 5-harness gate [causal495/483 + pwa491 EXPECTED EXACT]; I588 (ST-555) = G83.0 close; push delegate Dewey 01a20760-b402-74a2-b164-e13208b85f07 (rotation: Arendt I583, Russell I584).\r\n";
  assertAscii(line, "active NEXT I586");
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("active BOM delta");
  write(p, s1);
  console.log("active.md OK");
}

console.log("BOOKKEEP585 DONE");
