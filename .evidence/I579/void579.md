# I579 / ST-546 - E81 VOID execution (no-change accept - gap case)

ST-546 is executed as a VOID: the frozen E81 lever
(boss.burst.every 4.0 -> 4.8, src/core/config.js:300) is NOT applied, per the
frozen adjudication rules (.evidence/I578/rules577.md sec.3, verbatim from
design/e81-monolith-wave5-wall-research.md sec.6):

GAP CASE - all three frozen branches are FALSE on the sweep577 pre-lever
re-audit (30 fresh seeds 57700+i, in-process, wall 13,613 ms):
- (B) B56 11/30 >= 12 FALSE (11 < 12)
- (A*) 10 <= B56 <= 11 TRUE but M56 7/30 >= 8 FALSE (7 < 8)
- (C) B56 11/30 <= 9 FALSE (11 > 9)
The measured point (B56 11, M56 7) is an UNCOVERED CELL of the frozen
adjudication - the three literal branches do not tile the (B56, M56) space
(drafting gap). Per the frozen divergence clause (RECORD + REGISTER before
any code change, I570 pattern; the extension re-derives nothing): the lever
is NOT applied - neither apply branch fired and inventing a 4th branch is
forbidden; the outcome is C-equivalent: ST-546 VOID + accept (E78 pattern).
Under either reading (gap-cell vs 'C as otherwise') the outcome is identical:
no lever.

CAUTION (recorded precisely): results577.txt's else-branch prints
'BRANCH DECISION: C (accept-with-documentation): ST-546 VOID (B56 11/30
<= 9/30; M56 7/30)' - the clause 'B56 11/30 <= 9/30' is arithmetically
false (literal C failed; the harness line is misleading as printed).
The adjudication of record is the uncovered cell, NOT branch C.

Authoritative records (I578):
- .evidence/I578/results577.txt (full per-run lines + the misleading
  adjudication line, 5,808 B)
- .evidence/I578/sweep577.json (per-run JSON, 103,926 B)
- .evidence/I578/rules577.md (frozen rules, 4,070 B)
- Registrations (a)-(e) for the E82+ backlog, full text in the I578
  iteration entry + epics E81 (incl. (d) the PROCESS FINDING: future
  frozen adjudications must explicitly tile the (B56, M56) space).

Zero src confirmed: `git diff 78f4cda..HEAD -- src/ assets/ vendor/` is
EMPTY at I579 (HEAD = afde28c, the I578 commit). config.js:300 stays
every: 4.0. No sweep578 exists or is expected (it only ran if the lever
was applied - it was not).

Pattern precedent: E78 (Branch C, H = 0.400 EXACT at sweep567 ->
accept-with-documentation, CLOSED I568) - same shape: frozen lever not
applied, docs-only close, the next gate re-derives nothing. E81 closes
at G81.0 as an accept round (I580).