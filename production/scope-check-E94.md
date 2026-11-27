# E94 scope check - wave-transition pacing: make the hold visible, make the wait shorter

Opened I638 (ST-597..ST-599 pre-registered). E93 CLOSED at I637 (cc9cef3, remote-verified: git ls-remote origin main == cc9cef3d7341cd4b84af947752896a15b838b32e == local HEAD). The user critique - "after the blue unbreakable rocks appear around wave 8-9, wave clearance takes a long time even after all the asteroids and the enemies are dealt with... it feels like waiting doing nothing" - is the target of E94, scoped to exactly one code-only fix set: (1) a wider leftover-grace band so 3-4 stragglers get the 10 s grace instead of the 45 s stall wall, (2) visible amber "straggler beacons" on the surviving rocks while the wave is held, and (3) a live countdown sub-line on the wave banner while the hold runs, so the player always sees what the game is doing. No new assets, no new dist files, no campaign/boss/spawn-mix changes.

## Root cause (measured I638, .evidence/I638/ - re-run this session, values reproduced)

- The "blue unbreakable rocks" are the ST-138 belt rocks (fromWave 8, max 5, indestructible, blue pulsing matBelt). They do NOT block clears - I563's killableCount excludes them; a wave clears the moment its killables are gone.
- The real mechanism is a BLIND straggler hold: when toSpawn hits 0 with K low-speed killable rocks still drifting (split debris, slow M-rocks near the rim), state stays 'active' and
  - K <= leftover.max (2 today): the I630 grace advances the wave after 10.0 s of the condition holding - measured 10.0 s blind wait (sim_hold.mjs, seed 71201, wave 8, 0.35 s kill model).
  - K >= 3: the I42 stallTime 45 s backstop - measured 43.9 s blind wait (same sim, K=3 and K=4).
  - During BOTH holds the state is 'active', so the intermission countdown is NOT shown, no CLEARED banner, no clear bonus, no intermission - the player stares at a slowly drifting field and waits.
- The belt era (wave 8+) amplifies the perception: up to 5 indestructible blue rocks are always drifting and always absorb shots (bullet consumed, beltHit clink, no score), so the player cannot visually confirm the field is clear.
- The post-clear gap itself is NOT the pain: true-clear intermissions measure 2.22 / 2.13 / 1.97 s at waves 9 / 11 / 13 (sim_deadtime.mjs v4) with the countdown shown.
- Endless also runs boss waves (boss.everyWave 5 -> waves 5/10/15), which is why the user remembers "asteroids AND enemies" in the same late sequence.

## Scope Fit

Measured at I638 (on disk, post-I637):
- dist: 6,966,899 B / 205 files (I637 fresh measure). E94 close target: 7,297,600 B (7,400,000 B ceiling - 102,400 B close-floor) -> envelope 330,701 B (= CLOSE FLOOR E93 measured at G93.0).
- Assets: 34 GLB / 201,245 t - untouched by E94 (no Blender work; the fix is pure core-logic pacing + one render material + one DOM sub-line).
- The fix set is code-only and lands in already-shipped files (src/core/waves.js, src/core/config.js, tests/waves.test.js, src/render/asteroidRenderer.js, src/render/waveBanner.js, src/core/strings.js, src/main.js) -> file count stays 205.
- Feasibility: the code budget (<= 20,000 B, below) is ~6% of the envelope; the cut ladder exists for pin cascades, not for size.

## Research (FROZEN at open - in-repo mechanics only, no new YouTube pass needed)

- cgs-scope-check applied: the fix set is pre-registered with measured basis; the pinned harness set (causal495/483, playframe483/491, pwa491, fleet628) carries the regression risk, exactly as E91/E92 did.
- In-repo pacing lineage: I42 stallTime 45 s backstop -> I563 killableCount clear check (belt rocks excluded) -> I630 leftover grace {max:2, stall:10} -> I631 clear bonus beat. E94 completes the series: the hold gets (a) a wider grace band, (b) a visual target (amber beacons), and (c) a visible clock (banner countdown).
- Render precedent: matBelt (blue pulse) and matGold (golden cage) already swap materials on the SAME pooled meshes with +0 draw calls (material pick in sync()); the straggler beacon mirrors matBelt's pulse pattern (0.4+0.45*(0.5+0.5*sin(t*1.8))) in amber - no new geometry, no new draw paths.
- DOM precedent: the I631 clear-bonus sub-line (waveBanner startCleared + strings banner.cleared_bonus EN/zh/ja) is the exact pattern the hold countdown reuses (intermission countdown styling at opacity 0.6).
- Recorded: no new YouTube MCP pass - a pure pacing/feel fix on measured numbers does not need new reference material (the user's "watch as much content as you can" applies to art/design questions; this is a measured-mechanics fix, per the E92 scope-check precedent).

## Fix set (PRE-REGISTERED)

- ST-597 (I639) - CORE, ONE atomic commit: (1) WaveDirector gets a PURE getter get hold() -> null | { remaining: k, timeLeft, graced }: state!=='active' || toSpawn!==0 -> null; k = field.killableCount; k===0 -> null; graced = leftover.stall>0 && k <= leftover.max; timeLeft = graced ? max(0, leftover.stall - leftoverT) : max(0, stallTime - waveElapsed). No RNG, no side effects. (2) cfg.wave.leftover.max 2 -> 4 (K<=4 gets the 10 s grace; K>=5 keeps the 45 s backstop - a genuinely stuck wave still resolves). (3) cfg.wave.stragglerBeacon = { cap: 6 } (render gate: beacons only while the hold runs AND the remaining killables are <= cap, so a huge leftover field is not fully repainted). (4) Unit tests in tests/waves.test.js: hold is null when not active / toSpawn>0 / k=0; hold.remaining/timeLeft/graced on the grace band; hold on the backstop band (graced=false, timeLeft = stallTime - waveElapsed); leftover.max 4 boundary (k=4 graced, k=5 not).
- ST-598 (I640) - RENDER + DOM, ONE atomic commit, ZERO new draw calls: (1) asteroidRenderer.js: matStraggler (amber pulsing emissive, same hum pattern as matBelt) + setStragglerBeacon(on) + material priority in sync(): belt > golden > straggler > normal (a belt rock keeps blue; a golden straggler keeps the cage look). (2) waveBanner.js: while world.waves.hold is non-null, show a "clearing field in Ns" countdown sub-line (reuse the intermission-countdown styling at opacity 0.6; hidden the moment hold goes null - no state leak). (3) strings.js: new key banner.clearing EN/zh/ja (pattern: banner.cleared_bonus, I631). (4) main.js: gate the beacon rockRenders.setStragglerBeacon(!!hold && hold.remaining <= cfg.wave.stragglerBeacon.cap) on the same sync tick as the banner.
- ST-599 (I641) - G94.0 close gate: 6/6 harness battery (clone the I637 runner, labels CLOSEGATE641, every marker string verified against the harness's actual console.log output - the I632 marker-case lesson) + GLB fleet smoke (34/34, 201,245 t WITH MEASUREMENT, console 0/0) + fresh dist re-measure vs 7,297,600 B + CLOSE FLOOR E94 WITH MEASUREMENT + AGENTS.md refresh (item-4 chain + one-liner + causal/playframe re-pin notes if any) + E94 CLOSED. Expected dist delta: ~0 B (docs-only).

## Frozen bounds

IN (per landing, nothing else):
- ST-597: src/core/waves.js (hold getter only), src/core/config.js (leftover.max + stragglerBeacon block), tests/waves.test.js.
- ST-598: src/render/asteroidRenderer.js (matStraggler + setStragglerBeacon + sync priority), src/render/waveBanner.js (hold sub-line), src/core/strings.js (1 key x3 locales), src/main.js (beacon gate on the existing banner sync tick).
- ST-599: docs-only (AGENTS.md + 7-file bookkeeping).
FROZEN: all 34 GLBs (no Blender), vendor 4 + decoder, PWA surface, campaign (levelState path does not use WaveDirector holds the same way - out of scope), boss waves, spawn mix, endless difficulty curve, audio, camera, input, the other banner states (CLEARED / WAVE n / intermission).

## Measurement protocol

1. npm test green (new hold-getter unit tests added at ST-597; existing suite must stay 1,256 + N).
2. npm run build clean; dist measured vs 7,297,600 B close target; file count 205 (no new files).
3. Vendor 4/4 EXACT (A65DE049A7F38B40 / 7AB0784CD2532367 / F549248412C62B9A / 7FF9ACF50F006017) + decoder raw D428E73A000057C6 29,256 B.
4. Gate harness per landing: causal495 (3-arm seed-9876; webgpu report-only) + causal483 EXPECTED EXACT (score pin 11,509 - re-pin WITH MEASUREMENT only if the demo-pilot wave-2 hold timing actually shifts the run; the pilot clears wave 1 as a TRUE clear, which is untouched by leftover.max); playframe491/483 EXPECTED EXACT (A 22/92,435 + P 11/2,076 / B 52/200,808 - material swaps on pooled meshes are +0 draw calls, the no-input arms run no holds); pwa491 EXPECTED 11/11; fleet628 = glbsmoke623 34/34 / 201,245 t EXPECTED EXACT (no asset change).
5. ONE atomic commit per landing (code + tests + bookkeeping together); push delegated to a fresh subagent (push only, NO Pages, no force, verbatim git ls-remote, agent closed), landing verified via git ls-remote.

## Budget (pre-registered)

- Start (I637 measured): dist 6,966,899 B / 205; assets 34 GLB / 201,245 t (frozen).
- E94 close target: dist <= 7,297,600 B; envelope = 330,701 B (= CLOSE FLOOR E93).
- Code + docs across the epic <= 20,000 B (worst case: strings 3 locales + banner sub-line + matStraggler + hold getter + wiring; expected actual +2-6 KB minified).
- Worst case: 6,966,899 + 20,000 = 6,986,899 B -> margin 310,701 B to the close target.

## Cut ladder (pre-registered)

C1: leftover.max 4 -> 3 (narrow the grace band) IF the causal pin cascade at I639 is larger than the documented single-clear-bonus delta (i.e. the pilot's run shape changes more than expected) - the 3-band still fixes K=3 (the most common straggler count from a single L-split) while shrinking the behavior delta. C2: drop the straggler beacon (ST-598 keeps only the countdown + leftover change) IF the playframe or pwa harness fails on the material-swap path (unexpected - matBelt/matGold precedent). C3: drop the banner hold sub-line (beacon + leftover only) IF the pwa offline-boot console stays dirty after the banner-DOM fix. Invoke ONLY on a harness failure or a larger-than-documented pin cascade; never silent; each invocation recorded here as an AMENDMENT.

## Deferrals (out of E94, queue intact)

Belt rocks "purpose" (they absorb shots with no score - a design question, not pacing) / post-clear "INCOMING" portal telegraph (the clean-clear gap measured FINE: 1.97-2.22 s with countdown) / paying a clear bonus on grace/stall advance (would reward the backstop - skip) / campaign-mode pacing (campaign uses levelState, not WaveDirector holds; the critique is endless) / boss-wave pacing (boss waves clear by their own kill path, not the hold path) / WebGPU default switch (gated) / Monolith wave-5 wall / 2 E85 luma residuals (warden +20.12 / drone +10.41).

## Risks

1. Causal pin 11,509: leftover.max 2->4 changes wave-2 hold timing ONLY if the demo pilot survives to a wave-2 hold (it clears wave 1 truly and dies in wave 2 before any hold in the current pin run). EXPECTED EXACT; if it moves, re-pin WITH MEASUREMENT (the delta is bounded by at most one clear-bonus + a few extra kills - documented at re-pin).
2. Playframe A/P/B: material swaps are +0 draw calls; the beacon gate is state-gated (no-input arms never enter a hold with beacons). EXPECTED EXACT; re-pin WITH MEASUREMENT only on a documented draw delta.
3. Banner DOM state leak: the hold sub-line must clear on every state exit (active->intermission, pause, game over) or it lingers - a PWA-console / visual regression risk; guarded by the same sync path that already hides the intermission countdown.
4. Material priority: belt > golden > straggler > normal - a belt rock that is also a "straggler" must keep the blue look; a golden straggler keeps the cage. Unit-asserted in the renderer sync logic test (or documented as a code review note if the renderer stays test-free, per existing convention).
5. leftover.max 4 shifts early-wave pacing (waves 1-7): a wave with 3-4 slow leftovers now advances in 10 s instead of 45 s - this is the INTENDED fix (less waiting everywhere), not a regression; the I630 grace already did this for K<=2.

## Verification evidence

At open (I638): I637 close gate 6/6 (CLOSEGATE637) + push cc9cef3 verified on origin main (git ls-remote == local HEAD); the .evidence/I638/ sims re-run this session with values reproduced (grace 10.0 s / stall 43.9 s / clean intermissions 2.22-1.97 s). Per landing: protocol steps 1-5 produce the evidence trail (.evidence/I639..I641/ + harness outputs + dist measures). At close: the G94.0 gate set (6/6 harness + fleet smoke + fresh dist + CLOSE FLOOR E94 WITH MEASUREMENT + AGENTS.md refresh).

## DoD

- ST-597..ST-599 all DONE; E94 header CLOSED at the G94.0 gate.
- npm test green with the new hold-getter unit tests; npm run build clean; dist measured <= 7,297,600 B at the close gate; CLOSE FLOOR E94 WITH MEASUREMENT recorded.
- 34-GLB fleet unchanged (201,245 t WITH MEASUREMENT at close); vendor 4/4 EXACT + decoder raw pin intact.
- 6/6 harness + fleet smoke at the close gate; causal arms EXACT (or re-pinned WITH MEASUREMENT with a documented delta); playframe EXACT (same rule); pwa 11/11.
- AGENTS.md item-4 chain + one-liner + re-pin notes refreshed WITH MEASUREMENT.
- ONE atomic commit per landing + the close-gate commit; every commit pushed (delegated fresh subagent) + verified via git ls-remote.
- Hygiene: 0 tabs, all 4 ports free, no terminals left.

## Next owner

I639 = ST-597 core (waves.js hold getter + leftover.max 4 + stragglerBeacon cfg + unit tests).
