# Scope Check - E8 Expansion Milestone (I107 / cgs-scope-check)

## Summary
User request: 100 further improvement iterations (I107-I206) on Void Runner,
run through the codex-game-studio workflow, with internet/downloads available
as needed. This check assesses whether that work fits the project's current
milestone state, proposes the epic phasing, and records cuts, deferrals, and
risks. Recommendation: APPROVE as "E8 - Expansion Milestone" with six
phases and a per-phase gate. No new runtime dependencies and no external art
assets are needed (or allowed by AGENTS.md); the web is used only for API
reference (context7/docs) and design research.

## Scope Fit
Current baseline (evidence, verified this session): 233/233 tests green,
build exit 0, iteration sequence 1..106 PASS, E7 gate closed at I100, Blender
graphics pass complete at I106 (asset audit PASS), no open code defects,
clean working tree, 107 commits. The game is a fully playable, verified
product - the correct stage for an expansion milestone rather than another
hardening pass.

High-value improvement areas, each grounded in the current codebase state:
1. Gameplay depth: no score multiplier/combo, no weapon progression, 5
   power-ups (rapid/spread/shield/overdrive/magnet) with room for 2 more
   (bomb, slow-mo); enemies are rocks + mines + one boss - no active
   (homing) enemies, no shielded or chain-splitting variants.
2. Content variety: single boss with one behavior (every 5 waves); no
   mini-bosses, no environmental hazard content beyond the vortex, no
   replayable seed hooks (daily run), no shareable result.
3. UI/UX: tutorial hints exist (E5) but no first-run overlay; no session
   stats (accuracy/best combo); no kill feed; golden rocks are color-coded
   only - the I100 closeout carries 4 human-playtest perception items, one
   of which a colorblind shape cue for golden rocks directly addresses.
4. Audio: SFX-only; no procedural music (biggest feel gap; WebAudio
   synthesis already established in src/render/audio.js).
5. Feel: no bullet-time on death, screen shake is per-event ad hoc, no
   damage vignette, pickup feedback is a score pop only.
6. Robustness: I76 determinism harness exists but has no user-facing
   replay viewer; test count (233) has plateaued and new systems warrant
   growth to 300+; auto-pause on visibility and dt clamping can be
   hardened.
7. Carried items: 4 playtest perception items (I100), repo LICENSE flag
   (R5 from I106 asset audit) - both fit naturally inside I107-I206.

Fit verdict: the requested 100 iterations map cleanly onto six bounded
phases with no rewrites required. Every phase keeps the house rules:
src/core stays DOM/three-free, all tunables in src/core/config.js, all
randomness through src/core/rng.js, pooled entities, one file per iteration
batch of changes, iteration log + CHANGELOG + active.md per commit.

## Cut Option
If the 100-iteration span must compress, drop in this order (each cut is a
whole iteration or pair, no partial states):
1. Replay viewer + capture UI (would be I190-I191) - consumer of the I76
   harness; pure nice-to-have, zero dependency on other E8 work.
2. Locales-ready string extraction (would be I166) - prep only, no runtime
   change.
3. Boss variant 2 (would be I143) - boss stays one model with two phases.
No other cuts are proposed; the remaining items are the substance of the
milestone.

## Deferral
Deferred beyond I206 (recorded, not dropped):
- Full i18n (translations) - only key extraction happens in E8, if at all.
- Any online component (leaderboard service, accounts) - no backend; local
  top-5 + shareable seed/score string is the ceiling.
- Gamepad support - keyboard + touch only (existing).
- Additional Blender-modeled assets beyond the existing five - all new
  content stays procedural (AGENTS.md convention; assets/ already covers
  ship/rocks/boss).
- Audio assets (recorded music) - procedural synthesis only.

## Recommendation
APPROVE E8 - Expansion Milestone (I107-I206), six phases:
- P0 Planning (I107-I110): scope check (this doc), epics, stories, entry gate.
- P1 Core gameplay expansion (I111-I132): combo multiplier, bomb + slow-mo
  power-ups, homing drone enemy, chain-splitter + shielded rocks, weapon
  progression, balance pass E8-1, determinism re-verify, gate.
- P2 Content variety (I133-I150): boss phase 2 + radial pattern, mini-boss,
  asteroid belt, daily seeded run + UI, shareable result string, balance
  pass E8-2, gate + regression round A.
- P3 UI/UX + accessibility (I151-I168): first-run tutorial, session stats,
  kill feed, colorblind shape cue + toggle, hotkeys, share screen, a11y
  pass, gate + UX fix round.
- P4 Audio + feel (I169-I186): procedural music (drone + intensity layers),
  bullet-time audio, death slow-mo, unified shake table, damage vignette,
  pickup particles, balance pass E8-3 (feel), perf + memory audit, gate.
- P5 Robustness + testing (I187-I200): context-loss hardening, visibility
  pause, replay viewer + capture, test growth to 300+, security audit of
  storage/seed codecs, regression round B, gate.
- P6 QA/release path (I201-I206): QA plan, human playtest + triage, release
  checklist, final sweep, E8 closeout (milestone review, final CHANGELOG +
  log audit 1..206).
Quality bar unchanged (AGENTS.md): npm test green, build exit 0, browser
smoke (screenshot + console + no-NaN) wherever rendering changes;
iteration log entry + CHANGELOG + active.md + commit every iteration.

## Risks
- R-E8-1 (medium) Balance bloat from 8+ new systems -> per-phase balance
  passes (P1/P2/P4) and one config.js block per system with commented
  defaults.
- R-E8-2 (medium) Determinism regressions from new randomness -> every new
  random draw goes through the seeded rng.js stream; determinism harness
  re-run at end of P1 and P5.
- R-E8-3 (medium) Session/context loss across a 100-iteration span ->
  active.md rewritten with full state + next step every iteration; CGS
  skill re-read at each phase boundary.
- R-E8-4 (low) Perf degradation from more entity types -> pooling for all
  new entities; perf check at each phase gate (dbg overlay exists, I80).
- R-E8-5 (low) WebAudio music cost/annoyance -> synthesized loops,
  always behind the existing mute + a dedicated music toggle, init only
  after user gesture (E7 pattern).
- R-E8-6 (low) Scope creep beyond this scope check -> new ideas append to
  the Deferral list; only approved phase items ship.

## Changed files or proposed files
- production/scope-check-E8.md (new - this doc)
- production/iterations.md, CHANGELOG.md, production/session-state/active.md
  (I107 records)
Proposed by later iterations (not touched now): production/epics.md (I108),
production/stories.md (I109), production/gates.md (I110), design/gdd.md
addendum (P1), src/core/* new systems modules, tests/*.

## Verification evidence
- Baseline (this session): npm test 233/233; npm run build exit 0; iteration
  sequence PASS 1..106; git tree clean at 85dde8e.
- E7 closeout: I100 commit (E7 GATE CLOSED, 5/5 criteria); I106 asset audit
  PASS; playtest-report.md + regression-report.md + release-checklist.md
  current in production/.
- Codebase inventory: src/core has 22 modules (233 tests) - all expansion
  systems slot in as new DOM-free modules (pattern proven by vortex.js,
  mines.js, boss.js in E7).
Unverified assumptions (labeled): perceived-value ranking of the six phases
is producer judgment, not playtest evidence; music approach (procedural) is
a convention choice, pending P4 prototype feedback.

## Next owner or decision
- I108 (cgs-create-epics): break E8 into sub-epics E8A-E8F with outcomes,
  dependencies, and validation gates in production/epics.md.
- No user decision required to proceed; the Cut Option list is the
  pre-approved fallback if the span compresses.
