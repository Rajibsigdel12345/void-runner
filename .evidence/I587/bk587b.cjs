// ---------- stories.md (tail-LF, BOM 5): ST-554 line append ----------
{
  const p = "production/stories.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n") || s0.endsWith("\r\n")) throw new Error("stories: expected trailing bare LF");
  const line = "ST-554 E83 THE SWAP (I587) - DONE I587: assets/ship.glb <- ship v8 (1,402,896 B / 64,884 t build-space / 62,254 t post-GLB-import [GLTF export dedupe -2,630; the renderer draws the GLB indices]) with the v7 (740,012 B / 32,499 t) backed up to .evidence/I587/ship_v7_backup.glb FIRST - asset set re-measured WITH MEASUREMENT: 34 GLB 4,672,268 B / 120,732 t (the pre-registered cap 4,771,840 B / 123,550 t over-estimated the growth; the REAL measured values are under it - the measured values are what AGENTS now carries) - AGENTS.md updated (asset line + cap 4,563 KiB + ship v8 62,254 t post-import line + playframe pins + dist chain -> 7,093,058 B / 203) - dist 6,430,174 -> 7,093,058 B / 203 (delta +662,884 = exactly v8-v7 GLB delta; code delta 0; under hard ~7,190,162 / tripwire 7,297,600 / ceiling 7,400,000) - playframe A/B re-pinned WITH MEASUREMENT (probe .evidence/I587/playframe_probe587.cjs -> A L 22/62,472 [P 11/180 unchanged], B 52/132,682 [hv=0/gv=0]; delta +29,755 = 62,254-32,499, B = 2x that; rock frustum +3,900 (I554) + non-ship 2,137 t unchanged) - re-pins applied to .evidence/I491/playframe491.mjs + .evidence/I483/playframe483.mjs (unique-anchor cjs; notes document the GLTF-dedupe learning) - CLOSEGATE587 5/5 EXACT (causal495 PASS dist :4200 / causal483 PASS score 11334 dev / playframe483 PASS new pins / playframe491 PASS new pins console A 0/0 B 0/0 / pwa491 SUMMARY 11/11 dist :5199) - quality bar 6/6 (tests 1,237/1,237 / build 0 / dist re-measured 7,093,058 B / 203 / vendor 4/4 EXACT / BOM delta 0 / hygiene)\n";
  assertAscii(line, "stories ST-554");
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("stories BOM delta");
  write(p, s1);
  console.log("stories.md OK");
}

// ---------- iterations.md (tail-LF, BOM 5): I587 entry append (no blank line before the header) ----------
{
  const p = "production/iterations.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("iterations: expected trailing LF");
  const entry = "## I587 (ST-554, E83): THE SWAP - ship v8 \"Rigid Airship Warship\" is now the live player ship + playframe A/B re-pins WITH MEASUREMENT + CLOSEGATE587 5/5 EXACT\n\n"
    + "- Pre-state: local == origin 2c53325 (I586, push-verified). v8 artifact .evidence/I586/ship_v8.glb (1,402,896 B) + P1 gate PASS already landed I586.\n"
    + "- Change: assets/ship.glb = v8 (740,012 B -> 1,402,896 B; +662,884 B, code delta 0). v7 backed up to .evidence/I587/ship_v7_backup.glb (740,012 B) FIRST. Tracked harness files re-pinned: .evidence/I491/playframe491.mjs + .evidence/I483/playframe483.mjs (+ .evidence/I491/playframe483.json). AGENTS.md: asset line 4,672,268 B / 120,732 t + cap 4,563 KiB + ship v8 62,254 t post-import line; playframe pin A 22/62,472 + 11/180, B 52/132,682 (I554 history kept); dist chain appended -> 7,093,058 B / 203.\n"
    + "- Measurements (.evidence/I587/measure587.cjs, house parser .evidence/I547/glb_tris.cjs): ship v8 in-game = 62,254 t post-GLB-import (64,884 build-space; GLTF export dedupe -2,630 - the renderer draws the GLB indices, so the playframe delta uses 62,254 not 64,884). Asset set = 34 GLB 4,672,268 B / 120,732 t (pre-registered cap 4,771,840 B / 123,550 t over-estimated; the REAL measured values are used and are under cap).\n"
    + "- Playframe probe (.evidence/I587/playframe_probe587.cjs -> playframe_probe587.out, dev :5173): A L = 22/62,472 (P 11/180 unchanged) and B = 52/132,682 (hv=0/gv=0) - both EXACTLY as predicted (delta +29,755 = 62,254-32,499; B = 2x that = +59,510). Re-pins via unique-anchor cjs (repin587.cjs -> 491, anchor \"A: L exact 22/32717 (I541\"; repin483.cjs -> 483, the I542 anchor variant - first attempt failed on the wrong anchor). Notes in both files: non-ship 218/2,137 t unchanged, rock frustum 3,900 t (I554) unchanged, GLTF-dedupe learning, probe reference.\n"
    + "- CLOSEGATE587 HARNESS PASS - 5/5 EXACT (.evidence/I587/run_closegate587.cjs, clone of the I584 runner; .out files saved): causal495 PASS (dist :4200, NO re-pin) / causal483 PASS score 11334 (dev :5173, NO re-pin) / playframe483 PASS (new pins) / playframe491 PASS (new pins, console A 0/0 B 0/0) / pwa491 SUMMARY 11/11 (dist :5199, NO re-pin). Servers self-started + self-killed; all 4 ports free after.\n"
    + "- dist: 6,430,174 -> 7,093,058 B / 203 files (delta +662,884 = exactly the v8-v7 GLB delta; under the pre-registered hard ~7,190,162 B / tripwire 7,297,600 B / ceiling 7,400,000 B). Vendor 4/4 EXACT at build (three.module A65DE049A7F38B40 / three.core 7AB0784CD2532367 / three.webgpu F549248412C62B9A / three.tsl 7FF9ACF50F006017, r187).\n"
    + "- Quality bar 6/6 (render changed -> the 5-harness browser runs ARE the smoke: console clean + camFinite verified in the gate, per the I541 ship-swap precedent): npm test 1,237/1,237; npm run build exit 0; dist re-measured 7,093,058 B / 203; vendor 4/4 EXACT; BOM delta 0 (AGENTS 1 / epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / CHANGELOG 7); hygiene (all 4 ports 5173/4173/4200/5199 free; zero browser tabs; zero terminals left running).\n"
    + "- Next I588 (ST-555) = G83.0 CLOSE + CLOSE FLOOR E83 WITH MEASUREMENT (7,400,000 - fresh dist re-measure; expect 306,942 B if 7,093,058 holds; headroom >= 102,400 B floor -> cut ladder NOT invoked expected) + AGENTS item-4 CLOSE FLOOR E83 clause (E82 demoted to prior, .evidence/I584/ag584.cjs pattern) + epics E83 header/Status -> CLOSED + bookkeeping + push delegate Dewey 01a20760-b402-74a2-b164-e13208b85f07.\n";
  assertAscii(entry, "iterations I587");
  const s1 = s0 + entry;
  if (bomCount(s1) !== b0) throw new Error("iterations BOM delta");
  write(p, s1);
  console.log("iterations.md OK");
}