# I575 / ST-542 - E80 VOID execution (no-change accept)

ST-542 is executed as a VOID: the frozen E80 lever [2]
(splicer.maxHp 30 -> 24, src/core/config.js:322) is NOT applied, per the
frozen adjudication rules (.evidence/I574/rules573.md sec.3, verbatim from
design/e80-splicer-wave10-wall-research.md sec.6):

BRANCH C - all three C sub-conditions hold on the sweep573 pre-lever
re-audit (30 fresh seeds 57300+i, in-process, wall 13,304 ms):
- H = 17/30 = 0.567 (B requires H >= 0.600 AND SPLICER strictly largest)
- SPLICER 7/30 is NOT the largest single source (MONOLITH 10/30 is; a tie
  would also fall to C, but this is a strict MONOLITH lead)
- W10 = 9/30 < W5 = 12/30
Rule (C): otherwise -> ST-542 VOID + accept (docs-only close).

Authoritative records (I574):
- .evidence/I574/results573.txt (full per-run lines + adjudication line)
- .evidence/I574/sweep573.json (per-run JSON, 95,597 B)
- .evidence/I574/rules573.md (frozen rules, 4,169 B)

Zero src confirmed: `git diff 99098a7..HEAD -- src/ assets/ vendor/` is
EMPTY at I575 (HEAD = 544d7a9, the I574 commit). config.js:322 stays
maxHp: 30. No sweep574 exists or is expected (it only ran if the lever
was applied - it was not).

Divergence handling: the pre-registered expectation (SPLICER largest /
W10 in the 11-16/30 band -> B or A*) did not materialize (MONOLITH 10/30
largest, W10 9/30 below band) -> RECORD + REGISTER executed at I574
(I570 pattern). Registrations are on file in the I574 iteration entry
(E81+ backlog, items a-e).

Pattern precedent: E78 (Branch C, H = 0.400 EXACT at sweep567 ->
accept-with-documentation, CLOSED I568) - same shape: frozen lever not
applied, docs-only close, the next gate re-derives nothing.
