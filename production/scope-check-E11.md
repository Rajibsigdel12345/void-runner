# Scope Check - E11 Combat Juice & Low-End Validation (I223 / cgs-scope-check)

## Summary
E10 closed at I222 (G10.0 PASS): 3/3 stories (Warden GLB, camera/feel, regression + gate), 677/677, dist 1954.9/506.2 KB. This check scopes E11 as a SMALL bounded pass over the two remaining bot-verifiable carried items: (1) T4 (bug-triage v2, I203, P2, owner senior_game_artist) - no kill-time juice channel: a plain rock kill is the most frequent kill in the game and fires none of the five juice channels (~1 juice event/60 s for an active pilot; the juice hierarchy has a hole at the rock-kill rung), and (2) the carried "low-end physical device / GPU validation" risk - the hardware remainder needs a real device, but the adaptive-quality ladder, the FX tiers, the DPR cap and the reduced-motion + FX-low combination are all verifiable headless. Recommendation: APPROVE as "E11 - Combat Juice & Low-End Validation" with 3 stories (ST-221..223) and gate G11.0. No new content, no new dependencies, no Blender assets (nothing to model), no scoring changes (the demo pin is structurally untouched).

## Scope Fit
Baseline (evidence, verified at I222): 677/677 green (x3 matrix), build 0, dist 1954.9/506.2 KB (<=2048/<=550, ~43.8 KB gzip headroom), log 1..222 sequential, clean tree (blender/ untracked by policy).

What remains, grounded in current state:
1. T4 (production/bug-triage.md v2, I203): "no kill-time juice channel (juice ~1 event/60 s for an active pilot)" - disposition "routed to the E9 Blender/art pass (ST-207+); candidate kill-punch tuning". E9 (ST-207..217) and E10 (ST-218..220) covered assets, camera and post-processing; the kill punch was never landed. Code-verified at I223 (src/main.js L630-634): the kill event fires only a score popup + kill feed + particle burst - no shake/flash/punch/hitStop/fovKick. The hierarchy (design/art-direction-research.md lever 4: "small pickup < rock kill < drone kill < boss phase < boss death") currently has drone kills at shake 0.35 + flash (L637) and rock kills at nothing - the rock-kill rung is the hole.
2. "Low-end physical device / GPU validation" is the second carried risk (E9/E10 risk registers; I218/I222 closeouts). The physical-device remainder stays HARDWARE-pending (not self-served), but everything below the glass is bot-verifiable with the proven load-injection pattern (I95/I182): adaptive quality (I73) hysteresis + tier ladders, FX high/low/off frame budgets, the DPR cap (2 default / 1.5 under load), and the reduced-motion + FX-low combo. A green/red tier matrix converts the carried risk into documented, re-runnable validation.

## YouTube grounding (I223, youtube_search 2026-11-11, 6 queries / 59 unique)
- GMTK "Secrets of Game Feel and Juice" (youtu.be/216_5nu4aVQ, 1.1M views, 5:19): juice must communicate meaning and the feedback ladder is ordered by event importance; small events get small feedback. => a rock kill takes the SMALLEST channel of the five, strictly below the drone-kill rung.
- IndividualKex "A Guide to Good Combat Feel - Game Dev Tutorial" (youtu.be/FpGgpUWEb_k, 97K views, 5:33; chapters: valheim 0:38, prototype 3:17): feel = hit-stop + camera punch + particle sync, tuned PER HIT CLASS. => class-scaled kill punch (S < M < L); a directed punch (ship -> kill point) reads as "you caused this" better than isotropic shake for frequent small events.
- wutsmyname101 "Where to Start with Bullet Hell" (youtu.be/mLcPznUc4pw, 75K views, 17:23): readability first - effects must never bury the threat; feedback should help tracking, not fight it. => NO flash / NO hit-stop / NO fovKick on plain rock kills (at kill rate a per-kill flash or sim-freeze is noise; the dodge read must stay clean).
- GMTK "How to Keep Players Engaged" (youtu.be/hbzGO_Qonu0, 2.8M views, 10:46; "Positive Feedback Loops" 7:19): reward the chain, not just the single kill. => overdrive combo-heat escalation: the kill punch scales up while the combo window is hot (the kill event already carries the overdrive flag - src/main.js L630 popup binding), so kill chains physically heat up.
- Mobile/web perf ladder (youtu.be/hGcvEZOUmYo 25K, youtu.be/juCFupLJ8kY 53K "Tip 5 Screen Scale", youtu.be/IrYPkSIvpIw 268K): screen scale (DPR) before draw calls before everything else; measure, never sniff device names. => ST-222 validates exactly the levers this game owns: FX tiers, adaptive-quality hysteresis, DPR cap - the no-device-name-gating rule (I73) is maintained.
Coverage note: YouTube transcripts were rate-limited at fetch time (captions paused); grounding uses metadata + chapter structure + snippets only - same treatment as I173/I178/I219. Not over-researched: 6 queries, single pass.

## Cut Option (if E11 must shrink)
Cut ST-222 (low-end validation) first - it is evidence-only (no code) and the carried risk is low-rated. ST-221 (kill juice) is the milestone reason to exist (the only unowned P2); ST-223 (regression + gate) stands on any non-empty milestone.

## Deferral
- 8 HUMAN-PENDING perception items (production/bug-triage.md v2) - need a human playtest session; carried unchanged, NOT self-served.
- Physical-device low-end remainder (a real low-spec phone / integrated GPU) - HARDWARE-pending; ST-222 validates everything bot-verifiable and writes the remainder as a labeled checklist in perf-profile.md.
- Combo cap / overdrive window tuning (T1/F4) - I92 already raised 10 -> 15; further changes touch the demo pin (maxCombo 15, tests/replay.test.js) and need a human data point; carried.
- 512x256 skybox downscale (I212) - still not needed (no bottleneck per I214).
- KTX2/BasisU compression - still no meaningful texture set (skybox PNG + canvas textures); no basis.
- NEW content (mechanics/enemies) - explicitly out of E11; E11 is juice + validation, keeping the slice small.

## Recommendation
APPROVE E11 as 3 stories:
- ST-221 | Kill juice (T4): class-scaled directed kill punch on rock kills - punch energy S 0.08 < M 0.12 < L 0.18 (max displacement 0.16/0.24/0.36 u at the existing 2.0 u amplitude; all far below the drone rung and the 0.45 weapon fanfare; settles ~0.3 s at the existing 12/s decay), directed from the ship toward the kill point; overdrive combo-heat escalation (x1.5 while the kill event carries overdrive, capped so L+od 0.27 stays below the weapon fanfare); NO flash / hit-stop / fovKick on plain rock kills (readability rule); motion-gated (reduced motion: silent, juiceTally records nothing per the existing I183 convention); juiceTally records what fired; the class/overdrive -> energy mapping is a new PURE CORE module (deterministic, unit-testable); tunables in CONFIG.fx.killPunch. Acceptance: unit tests + scripted-pilot juiceTally deltas + A/B screenshots (motion on/off) + frame probe (punch is a camera offset, no sim freeze, delta ~0) + pilot parity + reduced-motion gate.
- ST-222 | Low-end device validation, bot-verifiable half (cgs-perf-profile): dense worst-case scene (I182 reference: 24 M rocks + live boss + sustained barrage) at FX high / low / off with per-tier frame-time budgets; adaptive-quality ladder under sustained load (downgrade fires, hysteresis honored, stabilizes); DPR cap check (2 default / 1.5 under load); reduced-motion + FX-low combo playable (no NaN, stable frame); green/red tier matrix in production/perf-profile.md; the physical-device remainder written as a labeled HARDWARE-pending checklist. Evidence-only (no code) unless a measured defect is found - then a scoped fix story opens.
- ST-223 | E11 regression round + G11.0 gate + closeout docs (cgs-regression-suite + cgs-gate-check + cgs-milestone-review).

## Risks
- R-E11-1 (low) per-kill punch desensitizes or reads as noise at kill rate -> amplitudes sit at the bottom rung (0.08/0.12/0.18 energy vs drone rung 0.35 shake / 0.45 fanfare punch), no flash/hit-stop on plain kills; verify with juiceTally frequency + A/B screenshots + scripted-pilot parity in ST-221.
- R-E11-2 (low) punch changes perturb the scripted pilot feel/survival -> core scoring untouched (demo pin structurally unaffected); pilot parity (all finite, comparable survival) required in ST-221.
- R-E11-3 (low) headless adaptive-quality artifacts (known T7: degraded headless rAF triggers downgrades) -> use the proven sustained-barrage load-injection pattern (I95/I182); headless-only observations labeled as such; the physical-device remainder stays HARDWARE-pending.

## Changed files / proposed files
- New: production/scope-check-E11.md (this file).
- Updated this iteration (docs only): production/epics.md (+E11 + risk register), production/stories.md (+E11 ST-221..223), production/timeline.md (+E11 line), production/iterations.md (+I223), CHANGELOG.md (+I223), production/session-state/active.md.
- Proposed (later iterations): src/core/killPunch.js (new pure module) + CONFIG.fx.killPunch (src/core/config.js) + src/main.js kill-event juice branch (ST-221); production/perf-profile.md (+I22x low-end tier matrix) (ST-222).

## Verification evidence
Baseline re-verified at I222 (fresh 677/677 x3 matrix + build 0 + dist + log audit 1..222 sequential); this check is docs-only - npm test + build re-run this iteration per the quality bar.

## Next owner / decision
Next owner: I224 = ST-221 (kill juice; cgs-dev-story + cgs-standards-tests for the new pure module). Decision: E11 APPROVED as scoped above; no Blender assets required (no new content).
