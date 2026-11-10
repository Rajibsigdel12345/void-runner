# Gates - Void Runner

## I45 - Vertical Slice Gate (ST-045)

- Date: 2026-11-13
- Skill: cgs-gate-check (advisory slice gate)

### Summary
Advisory gate on the I01-I45 vertical slice: is the full loop (menu -> play -> waves -> power-ups -> combo -> pause -> game over -> restart) present at representative quality? Entry criteria from production/qa-plan.md; QA Suite C (extended) executed in-browser this iteration.

### Gate Criteria (entry, from qa-plan.md)
1. Suite A green (node tests + build + 0 console errors) - 122/122 + build 0 + 0 errors (I44 run, re-verified this session).
2. Suite B green (8-step critical path) - green at I40; critical path re-exercised during this session's browser run (start / pause / resume / game over / restart / HUD / screens).
3. I41 playtest report filed - production/playtest-report.md (findings F1-F7, ordered recommendations).
4. No open bugs above minor severity - F1 fixed in I42; F2/F4 are design watch items (human playtest I90, balance I92), not bugs.
5. Perf within baseline - measured in the Suite C perf item below.

### Evidence (QA Suite C, executed this iteration)
- Storage round-trip: menu panel set to volume=1 / sfx=off / fx=low / reducedMotion=on -> full page reload -> stored == panel == live settings (all three layers agree).
- Resize mid-game: 800x600 -> 1600x800 while PLAYING -> 0 console errors/warnings; canvas CSS and drawing buffer both 1600x800 (composer resize path clean).
- Touch synth: single-finger tap -> 2 bullets live (FIRE_TAIL >=1-bullet guarantee); 70px drag -> thrust (1,0), ship vel +10.5 in drag direction, position advancing; two fingers -> PAUSED (0.45s cooldown gate intact).
- I43 robustness re-verification: visibilitychange hidden -> PAUSED (stays paused on visible; manual resume to PLAYING); WEBGL_lose_context while PLAYING -> PAUSED, restoreContext -> healthy render, same renderer/context alive, 0 errors.
- Perf @ wave 4 (?fps=2, 20 rocks + sustained mouse fire + bloom High): 60 fps / 16.6 ms / 37 calls / 1626 tris - within the I36 baseline (56-60 fps / 40 calls / 1638 tris).

### Concerns
- Perf headroom is machine-dependent: this gate ran on the dev machine; the low-end mitigation (adaptive quality, E7) stays on the plan.
- The perf scene reached GAME_OVER at the tail of the measurement window (ship struck by a test rock - the qa-plan probe rule to zero ship velocity was not applied for this run); the 0.5s meter window still reflects the full scene (21-22 rocks, live bullets).
- Touch automation is synthetic PointerEvents; real-device touch remains untested (acceptable at slice stage; flagged in qa-plan known gaps).

### Verdict
**PASS** - slice-gate entry criteria all met. Exit criteria (I46 regression green after I44, I49 release checklist clean) are scheduled at their own iterations.

### Risks
- R6 perf: ~40 calls / ~1638 tris is bloom-composer-dominated; adaptive quality (E7) is the standing mitigation.
- R5 input: synthetic touch verified; physical devices untested.
- F2 invuln fairness at high density: human playtest I90, possible balance fix I92.

### Changed files or proposed files
- production/gates.md (NEW: this artifact).
- No source changes this iteration (gate is evidence, not code - same pattern as I41).

### Verification evidence
- Suite A: 122/122 + build 0 (this session).
- Suite C browser run: 0 console errors on clean load; only info-level context lost/restored entries during the loss test; 0 errors/warnings after restore.
- Prior-iteration screenshots on record: .evidence/i44-menu.png, i44-hud-powerups.png, i44-paused.png (HUD/screens state at gate time); Suite C evidence is the behavioral transcript above.

### Next owner or decision
I46 (ST-046) final regression: full node suite + browser regression (Suites A+B+C re-run) + build; then I47 docs.

## I96 - Pre-Wrap Gate (ST-096)

- Date: 2026-11-10
- Skill: cgs-gate-check (advisory pre-wrap gate)

### Summary
Advisory gate on the E7 content/polish/hardening arc (I51-I95): is the code side complete enough to proceed to the final wrap (I97 milestone/retrospective, I98 release-checklist, I99/I100) and the Blender graphics pass that follows I100? This gate covers the CODE deliverable; the graphics/Blender quality bar is a separate, scheduled pass and is tracked as a known-open item, not a blocker for wrapping the code.

### Gate Criteria (advisory pre-wrap entry)
1. Tests green (node --test).
2. Production build succeeds (node scripts/build.mjs exit 0).
3. Iteration log complete and sequential (entries 1..N, no gaps/reorder).
4. CHANGELOG consistent with iterations (no true duplicates/missing entries).
5. Every E7 open item is resolved, accepted, or explicitly deferred with an owner (triage I91, balance I92, UI/UX I93, perf I95).
6. Working tree clean after the gate commit (no stray build/patch artifacts).
7. Steady-state performance within the 60fps budget; any non-steady cost documented with a disposition (I95).

### Evidence
- Suite: node --test = 233/233 pass, 0 fail (fresh run this iteration).
- Build: node scripts/build.mjs -> "dist/ assembled (static, import-map modules)", exit 0.
- Iteration log: 95 entries (I1..I95), sequential check PASS 1..95 (this gate appends I96 -> 96).
- CHANGELOG consistency: 96 bullet lines vs 95 iteration entries - investigated, NOT a duplicate: the CHANGELOG groups entries under "### Added"/"### Fixed" sub-sections, and I17 legitimately appears once under each (feature = menu/pause/game-over screens + session keys; fix = the World.reset() gameOver-getter crash found by its own tests). Verified against the I17 iteration entry, which lists both the feature and the bugfix. No true duplicate; a naive line-count would false-positive, so this is recorded to prevent a future gate from re-flagging it.
- Open items (from triage I91 / balance I92 / UI-UX I93 / perf I95): F9 wave-5->6 spike FIXED (I92 post-boss breather); F4 combo cap RESOLVED (I92 10->15); F2 invuln RESOLVED (I92 1.6->1.8s); F8 score-spread ACCEPTED + documented (I90/I91, ~20x->~1.4x, skill re-expressed as wave-depth + boss-clearance); F1/F5/F6/F7 CLOSED; 4 perception/balance "watch" items DEFERRED to a human playtest (not bot-verifiable); 0 code defects (I91 bottom line).
- Perf: steady-state within budget (mean 5-7ms, p95 11-14ms; 22-59 draw calls; <2.3k tris); the one-time ~90-600ms first-gameplay-frame WebGL-init cost is documented in production/perf-profile.md with a deferred disposition (I95).
- Working tree: clean after this commit (only the 4 gate files: CHANGELOG, iterations, active, gates).

### Concerns
- Human playtest is the outstanding evidence gap: the 4 deferred perception items (feel of post-boss breather, vortex dodgeability feel, combo/overdrive feel, wave-modifier legibility in-world) require a real human and cannot be bot-verified. This is the single largest unknown for actual player experience before true release.
- Blender graphics pass not yet started: the current visual bar is procedural-only (generated geometry + canvas textures). The "graphics" quality bar is not yet met by design; it is a scheduled pass after I100, so it is tracked as known-open rather than a code blocker.
- Perf first-frame hitch (~90-600ms) is deferred (offscreen warm-up render proposed, medium effort, non-blocking).
- CHANGELOG sub-section grouping (the I17 double-bullet) is a recurring source of naive-tooling false positives; any automated consistency check must group by sub-section, not by line.

### Verdict
**PASS (advisory) - proceed to wrap.** All seven entry criteria are met on the code side. The remaining items are (a) a human playtest (outstanding, not bot-verifiable) and (b) the Blender graphics pass (scheduled after I100) and (c) the optional perf first-frame warm-up. None of these block proceeding to the wrap iterations; they are tracked with owners and dispositions.

### Risks
- R1 (highest): the deferred human-playtest perception items - if a real player finds the post-boss breather still too spiky or the vortex too punishing, a further balance lever may be needed post-wrap. Mitigation: the levers are 1-line config changes (waves.js modifierFor, config.js boss/combo/invuln) already exercised in I92.
- R2: Blender pass is unstarted; the game is fully playable but visually placeholder-grade until it runs. Mitigation: it is explicitly scheduled after I100 and is the user-requested final graphics step.
- R3: perf first-frame hitch is one-time per session; low risk, deferred.

### Changed files or proposed files
- production/gates.md (append: this I96 pre-wrap gate).
- No source changes (gate is evidence + advisory, not code - same pattern as I45).

### Verification evidence
- node --test 233/233 green (fresh run this iteration).
- node scripts/build.mjs exit 0 (fresh run this iteration).
- Iteration sequence PASS 1..95 (pre-gate) -> 96 (post-gate); CHANGELOG I17 double-bullet verified against the I17 iteration entry (feature + bugfix both present).
- git working tree clean after the gate commit (only the 4 gate files).

### Next owner or decision
User-controlled next decision (advisory gate, non-blocking): proceed to I97 (milestone review + retrospective), then I98 (release-checklist), I99/I100 (regression + final wrap), then the Blender graphics pass (cgs-art-bible / cgs-asset-spec / cgs-asset-audit) as the final user-requested step. Owner for the outstanding human playtest: the user / a human QA session (out of bot scope).

## I110 - G8.0 E8 Entry Gate (ST-110)

- Date: 2026-11-10
- Skill: cgs-gate-check (advisory entry gate for E8 Expansion Milestone)

### Summary
Entry gate before the first E8B gameplay iteration (I111). Verifies the
baseline the 100-iteration expansion builds on: tests, build, iteration
log discipline, browser health, and a fresh perf reference. All E8A
planning artifacts (scope-check, epics, stories) must be in place.

### Gate Criteria
1. npm test green (baseline 233/233; E8 grows this to 300+ by I192).
2. npm run build exit 0.
3. Iteration sequence PASS 1..110 (no gaps/dupes); CHANGELOG + active.md current.
4. E8A artifacts present: production/scope-check-E8.md, epics.md E8 (E8A-E8F + gates), stories.md ST-107..206 (100 rows).
5. Browser healthy on dev :5173: boots to MENU, __vr live, forced 20-rock + boss scene renders with 0 NaN; fresh perf reference recorded.
6. git working tree clean at the gate commit.

### Evidence (collected this iteration)
- node --test: 233/233 pass, 0 fail (fresh run).
- node scripts/build.mjs: exit 0, "dist/ assembled (static, import-map modules)".
- Sequence: PASS 1..109 pre-commit -> 1..110 post-commit (verified by script).
- Artifacts: scope-check-E8.md (I107), epics.md E8 section with E8A-E8F + G8.0-G8.6 (I108), stories.md 100 E8 rows ST-107..206 verified by script (count 100, range 107..206).
- Browser (dev :5173): boots MENU, window.__vr live; forced scene (restart + 20 spawned rocks + boss via spawnBossForWave(5), rendered through the live rAF loop): 31 draw calls / 1500 tris, 20 rocks + boss present, 0 NaN across ship + rocks, state PLAYING; menu ref 22 calls / 268 tris. (Reference scene has no bullets/particles; later phase gates measure under the same conditions for comparability.)
- git: tree clean after this gate commit (4 doc files).

### Concerns
- Perf reference scene differs from the I105 forced scene (24 rocks + boss + live bullets/particles: 51 calls / 4052 tris); G8.0 records 20 rocks + boss quiescent (31 / 1500). Phase gates re-baseline under their own scenes; no regression implied.
- E8 adds ~8 entity/system types; R-E8-4 (perf) and R-E8-1 (balance) are the tracked mitigations (per-gate perf checks, three balance passes).

### Verdict
PASS - proceed to E8B. I111: combo/score multiplier (core).

### Risks
- None new; R-E8-1..6 tracked in production/epics.md (E8 Risk Register).

### Changed files
- production/gates.md (this gate)
- production/iterations.md (I110 entry)
- CHANGELOG.md (I110 line)
- production/session-state/active.md (state -> I110)

### Verification evidence
- All commands fresh-run this iteration (npm test, build, sequence script, browser probes via window.__vr).
- Assumptions: none - every criterion verified directly.

### Next owner or decision
I111 (ST-111): score combo/multiplier in src/core (new module + config block, rng.js for any randomness, DOM-free, unit-tested). No user decision required (advisory gate, non-blocking).

