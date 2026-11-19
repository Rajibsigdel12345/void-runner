const fs = require("fs");
const p = ".evidence/I525/results525.txt";
let b = fs.readFileSync(p, "latin1");
if (!b.endsWith("\n")) b += "\n";
const add = [
"",
"FINDINGS (R7 diagnosis, for ST-492 / E70 close):",
"1. H = 4/10 heavyweight (MONOLITH 3 [wave 5 x2, wave 6 x1, all aimed/burst bolts while the Monolith",
"   is alive], SPLICER 1 [wave 10 spiral/aimed bolt], WARDEN 0) - BELOW the frozen B threshold (6/10).",
"   The wave-5 Monolith is the single largest kill cluster: 4/10 killing blows land on wave 5, of which",
"   one (seed 52703) is bullet_unknown per the frozen algorithm - the Monolith died at tick 6454 and the",
"   lethal aimed bolt (v=9.84375 = 9 x 1.09375) was in flight 12 ticks (0.2 s) after its death. This is",
"   a RESIDUAL-MONOLITH kill, conservatively counted as 'other' by rules sec.5 step 6 (boss must be",
"   alive at hit). If residual bolts counted, H would be 5/10 - still below 6/10.",
"2. No monolithProbable rock kills: the single rock_S kill (seed 52701, wave 10) occurred with the",
"   Splicer alive and the Monolith dead >1.5 s earlier; rock_L (52705) is not Monolith-derivable.",
"   primary == strict tallies are therefore identical.",
"3. Non-heavyweight sources: gunship 2/10 (waves 10, 11 - the heavy radius-0.5 bolt, v 4.675/4.95 =",
"   5.5 x {0.85, 0.9}), sentry 1, rock_L 1, rock_S 1, bullet_unknown 1. Max = 2/10 < frozen A threshold",
"   (4/10). The gunship is the strongest single non-heavyweight leak but below the pre-registered bar.",
"4. Beatability: the kiter KILLED the wave-5 Monolith in 7 of 10 runs (bossDeaths) yet still died -",
"   3 times from the Monolith's own bolts in the window before/just after the kill (the ship takes its",
"   3rd life during the boss window), 1 time from a residual bolt 0.2 s post-kill. The heavyweight wall",
"   (H1) is a WINDOW problem (spawn-to-clear time), not an unbeatable-HP problem.",
"5. Wave reach: median death wave 9; NO run cleared wave 8 or later (waves 8-12 clear counts 0). The",
"   median non-boss wave-clear times (waves 1-7) are 10.0-23.8 s, within the R8 2.5x band around the",
"   13-20 s reference, EXCEPT wave 8+ where the curve is unmeasurable (nobody survives to clear them).",
"6. Director state at death: bullet speed multiplier b in [0.85, 1.15] was in play in every run",
"   (recentMul observed: 1.09375 / 0.9 / 0.85) - the adaptive lull works as designed after hits; the",
"   kiter (I328 frozen instrument) still does not outlive the wave-8+ content curve.",
"",
"IMPLICATION FOR ST-492 (I526): Branch C - accept-with-documentation. No pre-registered lever applies",
"(H < 6/10 and no non-heavyweight source >= 4/10). The frozen wave-20 >= 6/10 success target is NOT",
"met (median death wave 9); this is a documented residual of E70, consistent with the E69/I522 findings.",
"The diagnostic instrument (R7) is delivered and reusable: the 15 payload tags are permanent telemetry",
"(payload-only, zero logic change), so future balance stories can re-run this sweep cheaply.",
"ST-493 (G70.0 close gate) should record: E70 residual R-wave20 stays OPEN as a known limitation (the",
"endless wave-8+ wall for the frozen kiter pilot); no regression shipped (pins must stay exact).",
].join("\n");
fs.writeFileSync(p, b + add + "\n", "latin1");
console.log("appended, bytes now:", (b + add + "\n").length);