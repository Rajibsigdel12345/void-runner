// ---------- timeline.md (LF, BOM 3, trailing \n): I586 line append ----------
{
  const p = "production/timeline.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("timeline: expected trailing LF");
  const line = "I586 (ST-553, E83) done: the new hero ship is built and passes the readability check - a proper rigid airship: a long riveted envelope with ribbing, a pointed bow, a tall tail fin, four engine nacelles hanging under the wing, and a navy command dome up front. It reads right at tiny sizes (96 px) from every angle, which is what matters in-game. The file is 1.4 MB and 64,884 triangles, so it is heavier than the current ship; the actual swap into the game happens next round with fresh measurements. Nothing in the game changed yet. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  assertAscii(line, "timeline I586");
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("timeline BOM delta");
  write(p, s1);
  console.log("timeline.md OK");
}

// ---------- CHANGELOG.md (LF, NO trailing NL, BOM 7): I586 line above the I585 line ----------
{
  const p = "CHANGELOG.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  const a = "- I585: ";
  assertOnce(s0, a, "changelog I585 line");
  const entry = "- I586: No visible change - the new hero ship (a detailed rigid airship: riveted ribbed hull, pointed bow, tail fin, four engine nacelles, navy command dome) is built and passes its 96-px readability check; the swap into the game lands in the next update with fresh measurements. Bundle unchanged at 6,430,174 bytes, under the 7.4 MB limit with 969,826 bytes of room to spare.\n";
  assertAscii(entry, "changelog I586");
  const s1 = s0.replace(a, entry + a);
  if (bomCount(s1) !== b0) throw new Error("changelog BOM delta");
  write(p, s1);
  console.log("CHANGELOG.md OK");
}

// ---------- active.md (CRLF, BOM 0, trailing \r\n): NEXT-at-I587 line append ----------
{
  const p = "production/session-state/active.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("active: expected trailing CRLF");
  const line = "- NEXT at I587 = ST-554 (E83): THE SWAP - assets/ship.glb <- .evidence/I586/ship_v8.glb (1,402,896 B / 64,884 tris; v7 740,012 B backed up to .evidence/I587/ship_v7_backup.glb FIRST); AGENTS asset-cap renegotiation WITH MEASUREMENT (4,034,560 B / 91,050 t -> 4,771,840 B / 123,550 t; delta v8-v7 = +662,884 B / +32,385 t); playframe A/B re-pin WITH MEASUREMENT (v8 64,884 tris; scope-check expected A ~60,218 for a 60k-tri ship, v8 actual -> expect A ~64,200+, re-pin with the REAL measurement; B = fx=high 2-pass window); 5-harness gate (clone .evidence/I584/run_closegate584.cjs; causal495/483 + pwa491 EXPECTED EXACT per the I541 ship-swap precedent; self-start + self-kill servers); dist target ~7,090,162 B / hard ~7,190,162 B / tripwire 7,297,600 B (ceiling 7,400,000 KEEP); cut ladder C1/C2/C3 frozen in scope-check-E83.md (C3 = decimate v8 toward 1.4 MB or revert the swap from the .evidence/I587 backup); then I588 (ST-555) = G83.0 close + CLOSE FLOOR E83 WITH MEASUREMENT (7,400,000 - new dist); push delegate for I586 = Arendt 01a20721-4cb0-73e2-a04a-320271ba1724 (rotation: Dewey I585, Russell I584) and I587 push = Russell 01a2074b-ac3f-7112-ad6a-a6c9f5653e27.\r\n";
  assertAscii(line, "active NEXT I587");
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("active BOM delta");
  write(p, s1);
  console.log("active.md OK");
}

console.log("BOOKKEEP586 DONE");
