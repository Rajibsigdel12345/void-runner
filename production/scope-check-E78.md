# E78 scope check - Splicer beatability (docs-only after the I567 re-adjudication)

## Frozen bounds
- ZERO src/assets/vendor/render/i18n changes in E78 (docs + .evidence only).
- The pre-registered frozen lever [2] (splicer.maxHp 30 -> 24) is NOT applied:
  the I567 measured re-audit (sweep567, 30 seeds 56700+i, full director, frozen
  I328 kiter) adjudicates BRANCH C per the frozen rules567 sec.2 thresholds
  (rules564 verbatim): H = 0.400 EXACT (12/30) <= 0.400 and max non-heavyweight
  source gunship 5/30 = 0.167 < 0.400 -> accept-with-documentation.
- The lever story (pre-registered ST-534) is VOID; the lever remains frozen/
  registered for a future epic (research doc sec.4).

## Stories
- ST-533 (I567) open + measured re-audit + branch adjudication + research +
  scope-check - DONE I567.
- ST-534 (I568) G78.0 close gate - PENDING.

## Cut ladder
- No lever -> the C1 revert / C2 ship-with-documentation ladder (which gated the
  lever) does not apply to E78.
- Guard (registered): if a future re-audit re-adjudicates the post-E77 wall as
  SPLICER-dominant (Branch B, or Branch A adjudicated to SPLICER), the frozen
  candidate is lever [2] splicer.maxHp 30 -> 24 - single lever, on-failure ->
  accept, no second lever (E70 sec.4).

## Tripwires
- dist must stay byte-identical 6,430,174 B / 203 files at I567 AND at the G78.0
  gate; any delta = process failure (docs-only epic).
- 5-harness gate EXACT at the G78.0 gate; re-pin is impossible (zero src change).
- Headroom floor >= 102,400 B at the close gate (else the AGENTS.md item-4 cut
  ladder applies per its own rule).

## DoD (G78.0, I568)
1. Five harnesses run fresh, all EXACT (causal495 3-arm / causal483 /
   playframe483+491 / pwa491).
2. dist re-measured; CLOSE FLOOR E78 = 7,400,000 - dist re-derived WITH
   MEASUREMENT (expected 969,826 B if byte-identical).
3. AGENTS.md item-4 dist chain + CLOSE FLOOR line refreshed; epics.md E78
   CLOSED; quality bar 6/6.
