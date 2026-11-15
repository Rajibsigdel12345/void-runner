# Scope Check - E50 Enemy Death Shatter & 3D Debris Fragments (cgs-scope-check, I408)

## Summary
E50 = the enemy/asteroid death shatter pass: when an enemy or asteroid dies, spawn a short burst of tumbling low-poly 3D debris shards (Blender-made, faceted, flat-shaded, COLOR_0 luma-neutral so a per-class tint reads) that fly outward, spin, and fade - on top of the existing 2D particle burst, flash, and shake. This is a render-only, motion-gated, additive juice pass (the user's explicit Blender-backed ask). The verified gap: EVERY death is currently a 2D particles.burst + flash + shake only - there is NO 3D debris/shatter anywhere. That is the canonical top-tier juice technique (grapefrukt "shatter effect"; Design Diary "don't just delete enemies - debris/corpses fly out") and it is genuinely open. Render + asset layer only; zero sim, motion-gated additive, zero feel re-tune, zero new STEADY-STATE draw calls (shards are transient - 0 live at rest), so the frozen playframe pins (21/366 + 50/1222) stay EXACT.

## Surface & Evidence
- src/main.js juice chain (lines 807-826): droneExplode/mineExplode = particles.burst + shake.trigger + flashA + juiceTally; bossDeath/wardenDeath add hitStop + punch + fovKick; flyerHit = small burst + the flyer dome hitFlash. NO 3D debris in any branch. (verified)
- src/render/particles.js: POOL = 512 (THREE.Points CPU ring pool), peak live ~26-164. Debris is a SEPARATE transient mesh pool - it does not touch this Points pool. (verified)
- Hit flash: ONLY the flyer has a hitFlash (flyer.js:60/74/113 + flyerMesh.js:59-74, dome white-flash, f.hitFlash = Math.max(0, f.hitFlash - 3*dt)). drone/stinger/warden do NOT flash on hit - a secondary, smaller gap (DEFERRED, not this epic). (verified)
- tests/assetGlbs.test.js: MAX_FILE_BYTES = 100*1024 (line 19) + per-asset tri budgets (BUDGETS.ship = 300, BUDGETS[size] per rock) + a COLOR_0 count == POSITION count validation. A new debris GLB gets its OWN bounded budget entry; existing per-asset pins unchanged. (verified)
- design/feel.md ("Feel & camera juice"): screen shake (CONFIG.fx.shakeTable, 8 events), damage vignette (ST-176), pickup bursts (ST-177), weapon fanfare (ST-178), flash/camera-punch/hit-stop/FOV-kick - ALL done and FROZEN at the E8 milestone for feel TUNING VALUES, but the project has kept adding motion-gated ADDITIVE juice since (ST-175-178, E34-49). Probe: __vr.juiceTally(). (verified)
- Grounding (2 searches, 6 NEW burned ids; transcripts fully fetched for the two canonical): Fy0aCDmgnxg (grapefrukt "Juice it or lose it", 619K, CANONICAL) + qCj9CZoAvFY (Design Diary "10 Ways to Improve Game Feel") + 216_5nu4aVQ (GMTK "Secrets of Game Feel and Juice") + 4Bv45aPMGyI (GMTK "Power of Video Game HUDs") + _3WKEQD6yyY (MrElipteach "Game feel vs game juice"). Technique catalog: color / tweening (easing x += (target - x) * 0.1, random delay) / squeeze-stretch / sound (most cost-effective, most ignored) / particles (trails; SHATTER) / screen shake (use sparingly) / eyes-personality. Design Diary 10: movement-recoil / bullet spread / particle trails + muzzle / lighting halos / impact (flash + CHUNKS FLY OFF) / enemy hit reactions (flash white, knockback, debris/corpses - don't just delete) / squash-stretch / dash / screenshake.
- KEY FRAMING (grounds the anti-over-engineer split): MrElipteach distinction - game FEEL = movement (FROZEN here, E8) vs game JUICE = feedback (render-only, available). Debris shatter = JUICE, in scope; movement re-tune = FEEL, out of scope. (unverified label for the general game-design claim; the LOCAL code evidence above is the source of truth.)

## Scope Fit
- One bounded surface (Blender debris shard geometry + a debris pool + death-event dispatch), a 6-iteration budget (I408..I413), 2 pre-registered cut gates (CG1/CG2), render-only + additive, motion-gated, zero feel re-tune, zero sim src, zero new steady-state draw calls.
- Motion-gated + additive (reduced-motion aware), consistent with the project's established juice pattern (ST-175-178, E34-49).
- ZERO feel re-tune: the E8 feel freeze is on TUNING VALUES (the shake/vignette/fanfare knobs) - NOT on new additive effects. Debris adds no knob to any frozen table.
- ZERO new steady-state draw calls: shards are transient (0 live at rest) -> the frozen playframe pin is measured at a no-death moment and stays 21/366 + 50/1222 EXACT.
- Reuses the SAME per-class palette the existing particles.burst already uses (debris matches the death color - no new hues).
- Blender: 1-3 generic low-poly shard geometries (faceted, art-bible flat-shaded, no normal maps), COLOR_0 luma-neutral ~0.9-1.1 so the per-class tint reads, SHARED material, ONE reused set tinted per-class (NOT a unique set per enemy). Cap ~8-12 KB per GLB.
- New src/render/debrisField.js pool (instanced or a few shared-geo meshes; cap live shards ~24; bounded transient draw-call peak).
- Death events to wire (main.js juice chain lines 807-826 + asteroids.js kill()/shatter()): droneExplode, mineExplode, stingerDeath, flyerDeath, wardenDeath, bossDeath + asteroid kill/shatter.
- Dist headroom 142,040 B >= 102,400 B floor: expected growth ~8-36 KB of debris GLB + a few KB of pool/dispatch code - comfortably inside.

## NOT taskable (documented rejections)
- Per-enemy UNIQUE debris GLB sets (reuse ONE tinted set - anti-over-engineer).
- Rigid-body physics engine (scripted rotation only - no engine dependency).
- New death SFX (the per-event death SFX already play, SFX_CUES main.js:281).
- ANY feel re-tune (E8 freeze on tuning values).
- Normal maps + PBR (art bible = flat faceted, no normal maps).
- Non-flyer enemy hit-flash (drone/stinger/warden white-flash on hit) - DEFERRED to a future epic.

## Pre-registered Cut Option
- CG1 (ST-379/ST-380): if the Blender build exceeds the asset-delta cap, OR the COLOR_0 luma cannot be placed outside the frozen env bands (rock ember 54.26-112.43 / drone accent 200.98), OR the shard cannot be low-poly within the tri cap -> cut to a simpler 2D-only enhancement or a docs-only no-change.
- CG2 (ST-382): if the A/B shows debris reads as NOISE (not a shatter) at the default FX tier, OR the transient draw-call peak is too high, OR any frozen playframe pin moves -> revert + docs-only no-change.
- A clean no-change CUT is an acceptable outcome (anti-over-engineer).

## Deferrals
- Non-flyer enemy hit-flash (drone/stinger/warden white-flash on hit) -> future epic.
- Audio music / adaptive combat track -> future epic (hard to verify headless).
- HUD/menu art direction -> future epic (many pins; not the research-pointed gap).

## Stories (budget I408..I413, gate G50.0 at I413)
- ST-378 (I408): open E50 - scope-check + stories, DOCS-only. [this iteration]
- ST-379 (I409): grounded direction + debris asset spec (cgs-dev-story + cgs-asset-spec; DOCS-only). Finalize the shard spec: facet count, tri cap, COLOR_0 luma band vs env (sky 70.14 / floor 32.2 / rock ember 54.26-112.43), per-class count/speed/life, motion-gate, pool/instance budget, draw-call cap. (Max 1 extra YouTube pull on shatter timing ONLY if needed.)
- ST-380 (I410): Blender build + bake debris GLB(s) + import (blender-core + blender-asset-qa MANDATORY on mesh change). Export to assets/ + add a NEW bounded entry to tests/assetGlbs.test.js (each < 100 KB per MAX_FILE_BYTES; existing per-asset pins unchanged).
- ST-381 (I411): implement debris pool + death dispatch (render-only, motion-gated, additive): new src/render/debrisField.js + wire to the death events, per-class tint, cap live shards, zero sim src.
- ST-382 (I412): A/B + art QA (headless): death screenshots with/without debris (VIEWED), live-shard count + pool headroom, steady-state playframe pin UNCHANGED, bounded transient draw-call peak, no NaN, console clean, p1/rockab EXACT causal.
- ST-383 (I413): regression + G50.0 gate + close (cgs-regression-suite + cgs-gate-check + cgs-milestone-review): R1 p1 EXACT causal / R2 rockab EXACT 2.2/1.3/0.7 fresh / R3 debris probe fresh + playframe EXACT 21/366 + 50/1222 / R4 PWA 11/11 fresh / R5 947/947 + build 0 + headroom >= 102,400 B + vendor sha + hygiene.

## Verification Plan
- Per iteration: npm test (947/947 baseline; grows from ST-380/381) + npm run build 0 + dist 132 / 1,947,982 B (or a documented delta) + vendor three r160 sha256-16 76DEA8151BC9352A + hygiene (chrome 0, ports 5173/4173/5199 free, node 13).
- G50.0 at I413: R1 p1 EXACT causal (seed 9876) / R2 rockab EXACT 2.2/1.3/0.7 fresh / R3 debris probe fresh + playframe EXACT 21/366 (MENU fx-off) + 50/1222 (PLAYING fx-high) / R4 PWA 11/11 fresh / R5 947/947 + build 0 + dist headroom >= 102,400 B + vendor sha256-16 76DEA8151BC9352A + hygiene.

## Risks
- R-E50-1 debris reads as NOISE (not a shatter) at the default FX tier -> CG2 A/B + viewed screenshots; keep count/size bounded.
- R-E50-2 transient draw-call peak too high -> cap live shards ~24, shared geometry / instancing; CG2 guards.
- R-E50-3 COLOR_0 luma placement collides with the frozen env bands (rock ember 54.26-112.43, drone accent 200.98) -> luma-neutral ~0.9-1.1 so the per-class tint carries the read; CG1 guards.
- R-E50-4 playframe pin movement -> shards are transient (0 live at rest); the pin is measured at a no-death moment; R3 re-verifies.
- R-E50-5 asset delta exceeds the cap -> 1-3 generic shards ~8-12 KB each, shared material; CG1 guards.
- R-E50-6 motion-gate bypass (reduced-motion) -> gate the debris spawn on the same motion setting as the existing juice; verify in the fx/reduced-motion probe.

## Recommendation
PROCEED - the gap is verified open (no 3D debris in any death; all deaths = 2D particles.burst; only the flyer has a hitFlash), the technique is canonical top-tier juice (grapefrukt shatter; Design Diary "don't just delete enemies - debris/corpses fly out"), it is Blender-backed (the user's explicit ask), bounded to a 6-iteration budget with 2 pre-registered cut gates, render-only + additive, motion-gated, zero feel re-tune, zero sim, and the steady-state pins are structurally unchanged.

## Changed files or proposed files
- Changed (I408, DOCS-only): production/scope-check-E50.md (new; source of truth), CHANGELOG.md, production/epics.md, production/stories.md, production/timeline.md, production/session-state/active.md, production/iterations.md.
- Proposed (ST-379..383): assets/debris_shard_*.glb (1-3, Blender), src/render/debrisField.js (new transient pool), src/render/assetLoader.js (debris GLB entries), src/main.js (death-dispatch wiring, lines 807-826), src/core/config.js (debris tunables: per-class count/speed/life/cap), src/render/asteroids.js (kill/shatter dispatch), tests/assetGlbs.test.js (a new bounded debris budget entry).

## Verification evidence
- I408 (DOCS-only): source inspection (src/main.js:807-826 juice chain - no 3D debris; src/render/particles.js POOL 512; flyer.js/flyerMesh.js hitFlash only; tests/assetGlbs.test.js MAX_FILE_BYTES 100*1024 + per-asset budgets; design/feel.md FROZEN at E8) + fresh YouTube grounding (2 searches, 6 NEW burned ids; grapefrukt "Juice it or lose it" + Design Diary "10 Ways to Improve Game Feel" transcripts fully fetched) + quality bar npm test 947/947 + build 0 + dist byte-identical 132/1,947,982 B + vendor sha256-16 76DEA8151BC9352A + hygiene (chrome 0, ports free, node 13).

## Next owner or decision
- Owner: gameplay-programmer (render layer + debrisField.js) + the senior-game-artist / Blender lane (shard geometry, ST-380).
- NEXT I409 = ST-379 grounded direction + debris asset spec (cgs-dev-story + cgs-asset-spec; DOCS-only).