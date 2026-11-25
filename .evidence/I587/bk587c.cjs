// ---------- timeline.md (LF, BOM 3, trailing \n): I587 line append ----------
{
  const p = "production/timeline.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\n")) throw new Error("timeline: expected trailing LF");
  const line = "I587 (ST-554, E83) done: the new airship is now the game's player ship. It is bigger and heavier than the old one (1.4 MB, 62,254 triangles once the game loads it), so the bundle grew to 7,093,058 bytes - still under the 7.4 MB limit with 306,942 bytes of room to spare. Every automated check passed, including the five rendering, sound and offline-play harnesses, so the ship flies exactly as before; only the model changed. The old ship is kept as a backup in case a rollback is ever needed.\n";
  assertAscii(line, "timeline I587");
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("timeline BOM delta");
  write(p, s1);
  console.log("timeline.md OK");
}

// ---------- CHANGELOG.md (LF, NO trailing NL, BOM 7): I587 line above the I586 line ----------
{
  const p = "CHANGELOG.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  const a = "- I586: ";
  assertOnce(s0, a, "changelog I586 line");
  const entry = "- I587: The player ship is now the detailed rigid airship: a long riveted envelope with ribbing, a pointed bow, a tall tail fin, four engine nacelles under the wing and a navy command dome. The model grew from 32,499 to 62,254 triangles (bundle 7,093,058 bytes, under the 7.4 MB limit with 306,942 bytes of room). All checks passed; nothing else changed.\n";
  assertAscii(entry, "changelog I587");
  const s1 = s0.replace(a, entry + a);
  if (bomCount(s1) !== b0) throw new Error("changelog BOM delta");
  write(p, s1);
  console.log("CHANGELOG.md OK");
}

// ---------- active.md (CRLF, BOM 0, trailing \r\n): NEXT-at-I588 line append ----------
{
  const p = "production/session-state/active.md";
  const s0 = read(p);
  const b0 = bomCount(s0);
  if (!s0.endsWith("\r\n")) throw new Error("active: expected trailing CRLF");
  const line = "- NEXT at I588 = ST-555 (E83): G83.0 CLOSE + CLOSE FLOOR E83 WITH MEASUREMENT (7,400,000 - fresh dist re-measure; expect 306,942 B if 7,093,058 holds; headroom >= 102,400 B floor -> cut ladder NOT invoked expected; follow the .evidence/I584/ag584.cjs pattern for the AGENTS item-4 clause, E82 demoted to prior) + epics E83 header -> CLOSED + Status CLOSED + bookkeeping (epics/stories/iterations/timeline/active/CHANGELOG) + commit + push delegate Dewey 01a20760-b402-74a2-b164-e13208b85f07 (rotation: Arendt I586, Russell I587).\r\n";
  assertAscii(line, "active NEXT I588");
  const s1 = s0 + line;
  if (bomCount(s1) !== b0) throw new Error("active BOM delta");
  write(p, s1);
  console.log("active.md OK");
}

console.log("BOOKKEEP587 DONE");