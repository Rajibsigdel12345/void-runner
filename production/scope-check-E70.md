# Scope Check - E70 Endless Balance Follow-up (R1 phantom TTK + R7 wave-5-12 beatability) WITH MEASUREMENT (I523)

## 1. Measured current state (tree-verified, I523)

- dist 5,254,934 B / 184 files; ceiling 6,100,000 B; CLOSE FLOOR E69 =
  845,066 B (headroom rule: >= 102,400 B or cut ladder).
- Fleet: 31 Blender GLBs, 2,925,988 B / 63,617 tris (unchanged; zero new
  assets in E70).
- Pin set (5 harnesses), ALL EXPECTED EXACT through E70: causal495 3-arm
  (webgl + default EXACT on the seed-9876 window wave 2 / 36.15 s; webgpu
  report-only err=0 warn=3 documented I498) / causal483 CAUSAL456 PASS /
  playframe483+491 PLAYFRAME456 PASS (A MENU 22/25,781 + 11/180; B reseed
  71201 frame 50 52/55,400 hv=0/gv=0) / pwa491 SUMMARY 11/11.
- Vendor r187 UNCHANGED (raw sha16 104F561458997220 / 613E370F76638FDE /
  EAFEAD3154EC0609 / D8F3CDB8B85B799A; dist-min A65DE049A7F38B40 /
  7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017).
- Tests 1,187/1,187 green (fresh I522); build 0.
- BOM baselines CHANGELOG 7 / stories 5 / epics 3 / iterations 5 /
  timeline 3 / AGENTS 1 / scope-check 0 (this file 0).
- Residuals carried in (I521 AFTER; I522 adjudicated
  ACCEPT-WITH-DOCUMENTATION; deferred to E70 per spec Appendix A.4):
  R1 phantom kiter TTK 1.4667 s < 2.0 s floor / R7 0/10 wave-20 (death
  waves [5,10,5,5,12,8,10,11,10,6]; RECOUNT 6/10 heavyweight + 4/10
  adjacent) / R8 null (consequence of R7).

## 2. Scope fit

E70 = the two deferred E69 residuals, WITH MEASUREMENT (house culture:
pre-register levers + branch rules BEFORE any config move; smallest
lever first; at most one tuning pass per story; residuals ship
documented). No new systems, no new assets, no Blender:
- R1 (phantom TTK): one-line config lever (phantom.enterDur 1.2 -> 2.0
  primary; phantom.hp 2 -> 3 pre-registered fallback) + the existing
  balance521 harness re-run (seeds 62100+i / 72100+i x 100).
- R7 (wave-5-12 beatability): payload-only ship-hit source tag (diagnosis
  harness, no game change) + one data-dependent lever from a frozen branch
  (B heavyweight wall / A leak / C accept).
- Key diagnosis gap found I523 (research sec.1.3 / 4.1): the wave-10
  heavyweight is the Splicer (30 hp, undestroyable spiral) or the Warden
  (18), NOT the Monolith (bossSpawnCount alternation + Warden
  substitution) - the lever is chosen from ST-491 attribution data, never
  by assumption.
Supporting research: design/e70-balance-followup-research.md (residuals
verbatim + frozen criteria, measured state, S1-S8 web sources + F1-F9
findings, R1 lever analysis, R7 diagnosis + pre-registered branch rules,
dist policy, cut ladder, risks, story map + estimates, telemetry) + this
scope check.

## 3. Stories (ST-489..ST-493; acceptance in production/stories.md)

- ST-489 (I523, this) - E70 open: research + scope (docs-only):
  design/e70-balance-followup-research.md (residuals verbatim, measured
  state, S1-S8 / F1-F9, R1 lever analysis sec.3, R7 diagnosis + frozen
  branch rules sec.4, dist policy sec.5, cut ladder sec.6, risks sec.7,
  story map + estimates sec.8, telemetry sec.9, changed files sec.10,
  verification sec.11) + this scope check + E69 header doc-fix +
  epics/stories/iterations/timeline entries.
- ST-490 (I524) - R1 fix WITH MEASUREMENT: baseline re-confirm (1.4667 s)
  -> Option B phantom.enterDur 1.2 -> 2.0 -> re-measure phantom1 +
  phantom2 (R1/R2/R5) -> decision rule (ship / fallback Option A hp 2 -> 3
  / accept-with-documentation) -> spec Appendix B (E70) BEFORE/AFTER.
- ST-491 (I525) - R7 diagnosis harness: ship-hit source payload tag
  (game.js:520 sites, no logic/RNG change) + 10-seed sweep (52700+i) full
  wave-1 director, cap 36000 ticks -> .evidence/I525/sweep525.json +
  report (killing-blow histogram, per-wave deaths, resources).
- ST-492 (I526) - R7 lever WITH MEASUREMENT: branch from ST-491 data (B:
  dominant-heavyweight lever from the frozen ordered list / A: smallest
  pressure lever for the dominant non-heavyweight source / C:
  accept-with-documentation) -> fresh sweep -> R7 >= 6/10 + R8 recompute.
- ST-493 (I527) - G70.0 close gate: fresh 5-harness re-runs (EXPECTED
  EXACT) + CLOSE FLOOR re-derived WITH MEASUREMENT + quality bar +
  AGENTS.md refresh if needed + bookkeeping + commit/push.

## 4. Pin expectations (re-pin table)

- causal483 / playframe483 / playframe491 / causal495 / pwa491: EXPECTED
  EXACT through all E70 stories (every lever gates wave >= 5 [roster/boss]
  or >= 13 [phantom]; pin windows are wave 1-2 / MENU). Verify each
  story; re-pin ONLY with measurement on measured drift (I482 pattern).
- Vendor r187: unchanged (no vendor work in E70).

## 5. dist + asset policy (PRE-REGISTERED)

- Open: 5,254,934 B / 184; ceiling 6,100,000 B (headroom 845,066 B).
- Expected: +2-8 KB per code story (one-line config + test re-pin +
  payload tag) -> total well under the ceiling; no renegotiation
  anticipated.
- Zero new assets; fleet 31 GLBs / 2,925,988 B / 63,617 tris unchanged.
- CLOSE FLOOR E70 re-derived WITH MEASUREMENT at G70.0 (headroom
  >= 102,400 B or cut ladder C1-C3).

## 6. Cut ladder (in order)

C1 R7: after the allowed pass, if the fresh sweep < 6/10 ->
accept-with-documentation (E69 precedent; the epic still closes; the
residual moves to the E71+ backlog with the full measurement record). C2
R1: Option B -> Option A -> accept (frozen decision rule, research sec.3).
C3 drop R8 re-measure if R7 unreachable (R8 is derived).

## 7. Deferrals (NOT in E70)

Standing queue b (camera framing + cockpit FPV) / queue c (PWA
installable + mobile landscape D-pad + menu reorg; the Pages deploy is
blocked - option C stable, the local build IS the deliverable) / enemy
art-direction pass / campaign level 5 / support-buff enemy.

## 8. Risks

K1 pre-E69 core touched (branch A levers, wave 5-12 roster) -> wave-gate
pin argument + measurement + one-pass cap. K2 pilot-change temptation =
instrument change, last resort only (branch C). K3 TTK over-correction >
12 s ceiling -> the harness band [2.0, 12.0] catches. K4 dist growth
negligible (< 10 KB vs 845,066 B headroom). K5 10-seed artifact -> the
10-seed count is frozen; borderline 5/10 resolved by the deterministic
branch rules, not discretion.

## 9. Verification bar (per iteration)

Docs-only (I523): npm test 1,187/1,187 + build 0 + dist byte-identical
5,254,934 B/184 + vendor diff empty + BOM delta 0 + hygiene (no servers,
no tabs). Code stories (I524-I526): targeted unit tests green (re-pin
only if a test pins the changed value), BEFORE/AFTER harness WITH
MEASUREMENT, pins EXPECTED EXACT (re-pin only with measurement on
measured drift), quality bar 6/6. G70.0 (I527): 5 fresh harness re-runs +
CLOSE FLOOR WITH MEASUREMENT + bookkeeping.

## 10. Changed files + next

I523 (this): + design/e70-balance-followup-research.md (sec.4-11
appended), + production/scope-check-E70.md (this file), ~ production/
epics.md (E69 header doc-fix + E70 block), ~ production/stories.md
(STATUS I523 line), ~ production/iterations.md (I523 section), ~
production/timeline.md (I523 line), ~ CHANGELOG.md (I523 line), ~
production/session-state/active.md (I523 note), + .evidence/I523/ (edit
scripts, force-added).

Next: I524 = ST-490 (R1 WITH MEASUREMENT; decision rule step 1 = baseline
re-confirm on 62100+i).
