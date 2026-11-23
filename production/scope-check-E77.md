# Scope Check - E77 "Beatability" Endless High-Wave Beatability (Monolith Ring Lever) WITH MEASUREMENT (I564)

## 1. Measured current state (tree-verified, I564)

- HEAD a0de3aa (I563, wave-pacing fix; local main == origin main, pushed + Pages-verified; clean tree).
- dist 6,430,172 B / 203 files; ceiling 7,400,000 B (in force, no renegotiation this epic); tripwire 7,297,600 B; CLOSE FLOOR E76 = 969,828 B (measured at I563).
- npm test 1,237/1,237; npm run build 0; vendor r187 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017).
- Fleet 34 GLB / 4,009,384 B / 90,977 t; caps 3,940 KB / 3,870 KB / 91,050 t (balance-only epic - fleet untouched).
- Measured re-audit (this iteration, .evidence/I564/): sweep564 (10 seeds 56400+i) + sweep564r30 (30 seeds) on the frozen I328 kiter, full director, cap 36000 ticks - BRANCH B, MONOLITH-dominant, H = 0.600 EXACT in both samples, median death wave 5 (I525 baseline: Branch C, median wave 9), 1/30 reached waves 13-14 (died wave 15 to the Monolith). Full data: design/e77-endless-beatability-research.md sec.1 + rules564.md.
- Wave/boss table (tree-verified): firstWave mines 5 / hunter 6 / stinger 7 / drone + gunship + belt 8 / flyer 9 / sentry 11 / wasp 12 / pod + phantom 13 / hauler 16 / bulwark 17 / sweeper 18 / beacon 19; boss everyWave 5 (Monolith 5/15/..., Splicer 10/20/...); stallTime 45 (I42 backstop).
- BOM baselines: epics 3 / stories 5 / iterations 5 / timeline 3 / active 0 / AGENTS 1; this episode docs: research 0 (LF no BOM, house style), scope-check 1 (CRLF + BOM, house style).

## 2. Scope fit

E77 = the deferred R7 residual from the E70 close (I527: "endless wave-13-20 beatability"; R1 was the other half and CLOSED at I524). Re-audited against the current post-E69/E75/E76 roster, the live wall is NOT the wave-13-20 density - it is the wave-5/15 Monolith ring-burst window (Branch B MONOLITH-dominant, H = 0.600 EXACT; the kiter reached 13-14 in 1/30). Scope = ONE frozen pre-registered lever (E70 Branch-B lever [1]: boss.ringEvery 2.0 -> 2.5) applied WITH MEASUREMENT, then the close gate. No new content, no new assets, no render change, no vendor change, no i18n. "Step by step": exactly 3 stories.

## 3. Frozen scope bounds (E77)

- ST-531 (I565) = config-only: src/core/config.js boss.ringEvery 2.0 -> 2.5 (L273). Nothing else in src. Zero assets. Zero vendor. Zero i18n. Zero render.
- Acceptance (pre-registered, research sec.4): (a) 30-seed sweep565 median death wave 5 -> >= 8; (b) >= 1/30 reaches wave >= 13; (c) 5-harness gate EXACT, verified WITH MEASUREMENT (re-pin only on measured drift).
- NO second-fiddle pass within E77 (frozen E70 policy): failed acceptance -> C1/C2 disposition at the G77.0 close gate (I566), never an extra lever in-story.
- Frozen OUT: ringCount (RNG-consumption churn), Monolith HP (not the wall per I525), bolt speed (E57 cross-fleet contract).
- Registered cross-mode effect (research BAL-4): the lever is shared config - campaign L1 (monolith) and L3 (monolith-prime) bosses relax by the same 20% ring phase. Documented residual observation; NOT a revert trigger (E77 acceptance is endless-only; all pins predate any boss).
- Registered determinism note (research BAL-5): post-wave-5 RNG stream shifts (ring-burst timing) -> DAILY content changes post-wave-5 = documented salt shift, non-regression; no daily pin exists; all regression pins predate wave 5.

## 4. Stories (E77)

- ST-530 (I564): E77 open + measured re-audit - DONE I564 (docs-only zero src: rules564.md + design/e77-endless-beatability-research.md + this scope check + bookkeeping; quality bar 6/6).
- ST-531 (I565): frozen lever boss.ringEvery 2.0 -> 2.5 applied WITH MEASUREMENT (30-seed sweep565 + acceptance (a)/(b) + quality bar 6/6) - PENDING.
- ST-532 (I566): G77.0 close gate (5 fresh harnesses + CLOSE FLOOR E77 re-derived WITH MEASUREMENT + AGENTS.md refresh + push delegate) - PENDING.

## 5. Cut ladder (E77)

- C1: I565 acceptance (a) AND (b) both fail -> REVERT the lever (2.5 -> 2.0) + E77 closes accept-with-documentation on the re-characterized wall (Monolith window survives the first lever; next E70-ladder lever goes to a follow-up episode).
- C2: (b) holds, (a) fails -> SHIP the lever (the wall demonstrably moved: the band is reachable) + document the wave-13-20 density as the NEW live wall (residual for the follow-up episode).
- (No asset/render cuts applicable - E77 ships no assets and no render change.)

## 6. Tripwires

- dist > 7,297,600 B -> stop and re-derive (should be impossible: docs + one config float).
- ANY harness pin drift (expected: none) -> investigate; re-pin only WITH MEASUREMENT + registered reason.
- NEW npm test failure at I565 -> RED resolved before the gate (house rule); a lever-induced test failure = the lever is wrong, not the test (unless the test pre-dates the lever contract, house re-pin style with a measured reason).
- BOM delta != 0 on any bookkeeping edit -> stop, re-edit binary-safe, re-verify.

## 7. Definition of done (G77.0)

1. 5 fresh harnesses ALL EXACT (causal495 3-arm seed-9876 / causal483 / playframe483 / playframe491 A 22/32,717 + 11/180, B 52/73,172 / pwa491 SUMMARY 11/11); all ports free at the end.
2. CLOSE FLOOR E77 re-derived WITH MEASUREMENT (7,400,000 - fresh dist; headroom >= 102,400 B floor or the cut ladder).
3. AGENTS.md refresh: item-4 dist chain -> I565/I566 + CLOSE FLOOR E77 line; boss-cadence note (ringEvery 2.5, shared with campaign L1/L3); E77 deliverables in the project section.
4. All 3 stories DONE with per-story iteration entries; story/epic/timeline/active/CHANGELOG bookkeeping complete; BOM delta 0.
5. Clean committed tree; push delegate spawned (push + Pages Actions verification) per the standing directive.
