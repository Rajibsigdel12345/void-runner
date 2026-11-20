# E75 Campaign Expansion + Camera/Cockpit Polish - Measured Audit + Research (I548)

E75 = the post-E74 epic. This iteration (I548, ST-514) is RESEARCH-FIRST: it measures the current tree, grounds the open user queue with LABELED research, and pre-registers five decisions (D1-D5) + a story map (ST-514..ST-521) + the dist/asset budget. A new dist ceiling is PRE-REGISTERED WITH MEASUREMENT because the E75 asset growth provably exceeds the current 6,100,000 B ceiling (sec.1.4). No src, no 3D, no Blender in this iteration.

## 0. User request (verbatim, the E75 queue)

Accumulated across the E74 close-out; each maps to a pre-registered decision in sec.3.

1. Camera framing: "i want some improvement on the camera angles when the player goes to the very far it cannot see all the way back can it not be like same view angle wherever the ship moves can you do research on that how to improve camera angle, and if possible can you add first person view as well."
2. Content: "for the game content lets add enemies and stuff also."
3. Linear progression + boss: "we could make it a linear game as well adding in the level design where we can move through the space and clearing levels, where we meet some kind of bosss at the end like that, lets move on step by step."
4. Cockpit critique: "in the cockpit view, you could show like some portion of the ship to the player to really feel the person is sitting in the cockpit and replace that line with the crosshair... and the controls donot match i think the control architecture cant be same as the one we have in chase since we only see whats in front... in some point and the camera angle or point in the arena a key moves towards right and w moves back and s moves forward."
5. Enemy art: "the new enemies type donot look like good assets you can model other spacesheeps."
6. Asteroid/comet (with the explicit gate): "you could makwe those rocks like asteriods or the comets like shape with bumps and crater, but only if its gpu and compute heavy."
7. Models + GPU: "the character and the enemies model can have improvement." / "if having the webgpu allows for the better visuals support then please do that."

## 1. Measured audit (I548, tree-verified)

### 1.1 Camera + cockpit - what is ALREADY shipped vs the genuine residuals

The E71 camera/FPV epic (I528-I531) + ST-415/416 chase work already shipped most of the verbatim asks. E75 camera scope = VERIFY-THEN-POLISH, not a rebuild:

- First-person view = SHIPPED. Camera modes: chase (default) / overview / cockpit (V-key cycle, main.js L807). Cockpit config: cockpitHeight 1.02, cockpitSetback 0.15, cockpitLookFar 60, cockpitLookSpeed 40, cockpitLookDrop 1.2. I504/ST-470 set the look-drop to 1.2 so the nose + canopy top sit 0.13 u below the eye - a portion of the ship IS visible in-frame (the "show a portion of the ship" ask, already implemented).
- Crosshair = SHIPPED. I529/ST-495: a 4-tick crosshair around a screen-center dot (src/render/bearingStrip.js #vr-cockpit-dot + 4 ticks). The 3D fire-line reticle is HIDDEN in cockpit (main.js L1244 guards `!(inRun && camMode==='cockpit')`) - so the crosshair (not the line) is the aim read in cockpit. Matches the "replace that line with the crosshair" ask.
- Chase framing = SHIPPED. ST-415/I445 uniform-scale dolly s(t) in src/core/cameraModel.js (dolly.startFrac 0.55, dolly.rimScale 1.7): the screen offset + view angle are strict invariants of the scale, so framing is the SAME wherever the ship moves and the arena stays visible at the rim. The "far away / same view angle" ask is addressed by the invariant framing + the ST-416 fixed whole-arena overview camera (56/20).

Genuine residuals (the actual E75 camera work - D1):
- G-a: control labels are MODE-AGNOSTIC. src/render/tutorialHint.js and src/render/tutorialOverlay.js show the same text in cockpit and chase (the shipped hint lists WASD/ARROWS MOVE, MOUSE AIM, HOLD LMB FIRE, P PAUSE with a middle-dot separator). In cockpit the thrust is screen-relative (W = fwd, S = back, A/D = screen-left/right) via cockpitThrust() (main.js L1005 touch + L1019 keyboard) - the labels should say "W = FWD, MOUSE = TURN" in cockpit. This is the "the control architecture cant be same as chase... labels" half of the critique.
- G-b: camera mode switch (V key) damp-vs-snap is UNVERIFIED. CAM-5 (three.js camera guidance) recommends damping toward the new rig instead of snapping. I548 has not measured whether the current switch snaps or damps.
- G-c: cockpit nose-visibility + crosshair + W/S/A/D screen-relative mapping has NEVER been screenshot/NDC-pinned. The verbatim "w moves back and s moves forward" report is UNCONFIRMED - E71 shipped view-relative at I528-I531, so this must be verified in-browser before assuming a bug (house rule: verify first, do not assume).

### 1.2 Campaign structure (measured, tree-verified)

- src/core/level.js (5,302 B) is a PURE data view over CONFIG.levels. Fully data-driven: levelCount(cfg) = levelRows(cfg).length; isFinalLevel = level >= levelCount; isCampaignComplete = isFinalLevel && isLevelCleared. Appending a 5th row to CONFIG.levels.levels makes L5 the final level automatically - NO hard-coded level count anywhere.
- CONFIG.levels (config.js L1167+) = { cruiseSpeed: 3.5, levels: [4 rows], palettes: {16 ids}, hazardProfiles: {4 profiles} }. Each row = { name, boss, zones: [4 x { name, length, paletteId, hazardProfile, enemyMix, optionalTargets, checkpointAt }] }.
- Current levels: L1 "Outer Drift" (boss monolith) / L2 "Debris Field" (splicer) / L3 "Core Gate" (monolith-prime) / L4 "Necro Reef" (abyssal). Four palettes each (drift-1..4, debris-1..4, ember-1..4, reef-1..4).
- CONFIG.campaignBoss (config.js L1263+) = per-level maps keyed by level number: hp {1:96, 2:110, 3:130, 4:150}, phases {1:3, 2:1, 3:1, 4:1}, score {1:1000, 2:1400, 3:2000, 4:2600} + a shared move/weak-point model (radius, enterTime, weak{r,orbitR,armTime,teleTime,openTime}, moves cadence, posture). Adding L5 = add the key `5` to each map + a new bossKind on the row.
- i18n: keys = 'level.name.l<n>' / 'level.zone.l<n>z<m>' (level.js levelNameKey/zoneNameKey), pinned against STRINGS.en by tests/level.test.js; zh/ja display strings live in strings.js (3-locale rule ST-375).
- ALL campaign code is campaign-gated; the endless path is bit-identical (guarded by the causal/playframe pins). Adding a level + boss is campaign-gated by construction.

### 1.3 Enemy roster + boss (per-asset measured, I548 glb_tris.cjs)

31 GLB / 3,212,232 B / 72,449 t in assets/. Enemy fleet (11 ships, all Blender 5.2.3 headless):
- Legacy-4 (E68): drone 118,828 B / 1,516 t; stinger 133,172 B / 1,732 t; warden 91,064 B / 1,556 t; flyer 139,640 B / 1,770 t.
- Remaster-4 (E68/E72): hunter 227,496 B / 3,366 t; gunship 215,032 B / 2,906 t; sentry 203,688 B / 2,934 t; wasp 310,036 B / 4,020 t.
- E69 trio (v2, remastered E72): phantom 214,568 B / 3,048 t; hauler 304,272 B / 3,920 t; bulwark 190,584 B / 3,160 t.
- Boss: boss.glb 31,876 B / 398 t - a retinted monolith (NOT a detailed mesh; the per-level boss is the same mesh re-tinted + postured). A NEW detailed final-boss mesh (D4) is a meaningful upgrade over the 398 t retint.

The verbatim "the new enemies type donot look like good assets" referred to the E69 trio pre-E72-remaster; E72 (I533-I538) already remastered them to v2 (3,048 / 3,920 / 3,160 t) + the remaster-4. So the enemy ART pass is largely DONE; the E75 enemy scope (D3) = 2 NEW archetypes (not a re-remaster), grounded in the E68/E72 house pattern.

### 1.4 Asteroid/comet + asset/dist budget (measured, I548)

Asteroid/comet files (7): asteroid_L 73,224 B / 3,000 t; asteroid_L_B 73,228 B / 3,000 t; asteroid_M 22,820 B / 900 t; asteroid_M_B 22,824 B / 900 t; asteroid_S 9,616 B / 350 t; asteroid_S_B 9,620 B / 350 t; asteroid_comet 15,968 B / 590 t. Total 227,300 B / 9,140 t. These are low-to-mid poly smooth rocks (procedural-sculpt base, no displacement craters) - the "bumps and craters" ask (D5) is unmet.

Asset cap state: the AGENTS.md asset line carries a soft cap of 3,080 KB / 73,000 t; the committed tree is at 3,212,232 B / 72,449 t = the byte cap is ALREADY soft-exceeded and tris are at 99.2% of 73,000. This is a consequence of ship v7 (32,499 t) + the E72 remaster fleet. It means ANY meaningful asset growth (D3/D4/D5) REQUIRES a re-registered asset budget WITH MEASUREMENT, and D5 (a tri-heavy displacement remaster) is the item most likely to breach the tri budget - hence D5 is GATED on a headless GPU/compute measurement (the verbatim user condition).

dist budget: current 5,559,215 B / 189; ceiling 6,100,000 B; CLOSE FLOOR E74 = 540,785 B. E75 growth (per-asset basis, sec.3): D3 2 enemies ~+440 KB, D4 boss mesh ~+300 KB, D5 remaster ~+150-400 KB (if displacement) or ~0 t (canvas fallback), code ~+30-80 KB. Even the conservative case (D5 fallback) lands ~6.4-6.5 MB - ABOVE the 6.1 MB ceiling. A new ceiling is therefore PRE-REGISTERED (sec.7): 7,400,000 B WITH MEASUREMENT, applied at the first E75 asset landing (the E69 precedent rule).

## 2. LABELED research (chapter-level cites only; house norm)

Useful extraction only (user: "watch as much content as you can and extract only the useful ones... so that you donot have to invent or search... so hard to overengineer the game"). No re-invention.

### 2.1 Camera + cockpit
- CAM-1 GDC 2005, Haigh-Hutchinson, "Fundamentals of Real-Time Camera Design" (gdcvault PDF). Flight-sim genre = multiple viewpoints, roll permissible, look-at ahead of the craft. Matches our multi-mode rig (chase/overview/cockpit + look-ahead).
- CAM-2 John Nesky, "50 Camera Mistakes in Journey" (GDC 2006, via the UE blog). Failure-mode catalog: snap transitions, inconsistent framing, camera fighting the player. Reinforces G-b (verify damp-vs-snap).
- CAM-3 Unreal, "Six Ingredients for a Dynamic Third Person Camera": pitch-driven distance/FOV, area modifiers, LOS, player override.
- CAM-4 gamedesignerx, "Your Camera Is a Mechanic": four knobs - deadzone / velocity look-ahead (decay when stopped, ramp ~0.25 s) / framing overrides = NAMED exceptions / spring-arm pull-in ~0.05 s return ~0.4 s; FOV 70->78 over ~0.5 s. The "named framing override" principle is the template for a cockpit-specific control label (an explicit, declared exception, not an implicit branch).
- CAM-5 supagamesai, three.js cameras: exponential damping `1 - exp(-7*dt)`; a mode switch WITHOUT snapping = damp the camera toward the new rig; cockpit offset lives in player-local space; per-mode FOV / look-height / damping. Directly answers G-b.
- CAM-6 Playtank, "First-Person 3Cs: Camera": world-space HUD "or your airplane cockpit model" - our bearing strip + crosshair is exactly this pattern (a cockpit, not a bare crosshair). Confirms the shipped approach is a recognized convention.
- CAM-7 CG Cookie (distance / angle / smoothing): "the best camera is the one you do not notice."
- CAM-8 Medium, cockpit-POV aim: real cockpit games use aim thresholds ?30-40; ours is heading-locked arcade-style, a CONVENTION (asteroids-style), so we KEEP heading-lock and do NOT add a free-aim threshold.

### 2.2 Boss (multi-phase design)
- BOSS-1 youtu.be/Hul0n2phEHI - "what makes a multi-phase boss fight" (2024): telegraph -> danger -> safety rhythm; clear phase-change cues; player-agency windows between attacks.
- BOSS-2 youtu.be/wUPugc51udc - "Boss Battle Design" (2019): a phase = a distinct read, not just more HP; each phase introduces or removes a tool.
- BOSS-3 youtu.be/o0CKHLumTG0 - "Boss Battle Design Vol.2" (2019): posture/scale as the phase-change read (a growth the player can feel); a final boss re-uses the player's own vocabulary in a new arrangement.
- Map to our campaignBoss.js: it ALREADY implements weak-point cycle + telegraphed phases + posture (posture array + weak.teleTime/openTime). The L5 boss (D4) re-uses this model (new kind = new palette + move tier + phase count), grounded in these three.

### 2.3 Asteroid / comet (the D5 gate)
- AST-1 Blender Bones, "Rock Sculpting | Realistic Meteor & Asteroid" (youtu.be/0JeXmYGIsj4; base mesh ~10:45, displacement craters ~12:28): the cratered-rock look is displacement-based on a subdivided base - i.e. TRI-HEAVY. This is exactly why D5 is gated: a faithful displacement remaster of the 7 rock files at 1.5-2.5x density is a large tri addition on a fleet already at 99.2% of the tri cap.
- AST-2 Quantuplet, procedural crater shader (youtu.be/fQw5SPcVl1M): craters can be faked in the SHADER (noise-driven AO/normal) with ZERO added tris - the low-tri fallback for D5.
- AST-3 Samuel Krug VFX, asteroid tutorial (youtu.be/hWKdmUMYGFs): silhouette + scale variety carry the "rock" read; a mid-poly rock with good normal detail reads as cratered from the arena's typical distance.
- Decision driver: D5 = displacement remaster ONLY if the ST-520 headless probe (FPS + draw calls + tris, before/after) holds the frame budget AND a re-registered asset tri cap; otherwise the AST-2 canvas/shader-crater fallback (0 new tris) or skip.

### 2.4 Enemy art (D3)
Grounded in the E68/E72 house pattern (design/e68-*, e72-*: sil96 silhouette gate + per-ship art brief + real-spaceship remaster method) rather than new sources - the YouTube signal for "new enemy spaceships for an asteroids-style 3D arena" is weak (mostly Starblast fan-ship editor videos, low value). The 2 new D3 archetypes get per-ship briefs at ST-518 in the E72 brief format and must pass the same sil96 + render-audit gate.

## 3. Pre-registered design decisions (FROZEN at I548)

D1 - Camera/cockpit VERIFY-THEN-POLISH (ST-515 I549 + ST-516 I550). Zero sim change. ST-515 builds a headless verification harness (screenshots + NDC probes) for cockpit (crosshair visible? nose in frame? W=fwd S=back A/D screen-relative) / chase (center vs rim framing invariant) / overview, and MEASURES the V-key mode switch (snap vs damp). ST-516 then applies only the fixes the measurement justifies: (a) mode-specific control labels (cockpit "W = FWD, MOUSE = TURN"; chase keeps the shipped text) - the confirmed G-a; (b) damped mode switch IF the switch is measured to snap (CAM-5, CAM-2); (c) nose-visibility / crosshair tuning only if the NDC probe shows a gap; (d) a control-mapping fix ONLY if the probe confirms the "w moves back" report is a real bug (E71 shipped view-relative at I528-I531 - do not assume). No camera/sim constant changes without a measured delta.

D2 - Level 5 data (ST-517 I551). Append a 5th row to CONFIG.levels.levels (name + boss + 4 zones) + 4 new zone palette ids (distinct from all 16 existing - must pass the E69 dhue-collision gate: accent dhue > 12 from every existing zone accent) + campaignBoss.{hp,phases,score}[5] + i18n level.name.l5 + level.zone.l5z1..z4 (en/zh/ja, CJK byte-verified). Pure data + pure level.js view - campaign-gated, endless bit-identical (E64 pattern). The L5 boss KIND is defined by D4.

D3 - 2 new enemy ships (ST-518 I552, Blender 5.2.3 headless). Two NEW archetypes adding gameplay variety to the campaign + endless roster (roles finalized at ST-518 with a per-ship brief in the E72 format; candidates: a low-HP wide-arc "sweeper" and a stationary reinforcement "lantern/beacon"). E72 pipeline: build -> render-audit + sil96 silhouette gate -> swap GLB -> re-pin playframe/casual WITH MEASUREMENT. Candidate ~220 KB / ~3,000 t each (E72 fleet range 190-310 KB / 2,906-4,020 t).

D4 - Level 5 boss (ST-519 I553). A NEW bossKind (a proper detailed final-boss mesh, upgrading the 398 t retinted monolith) + a campaignBoss.js extension (new palette + move tier + 2-3 phase cycle per BOSS-1/2/3: telegraph -> danger -> safety, a posture/scale phase read, a player-agency window). Blender 5.2.3 headless mesh, per-ship brief in the E72 format, sil96 + render-audit gate. Candidate ~300 KB / ~3,000 t. The L5 row (D2) references this boss kind.

D5 - Asteroid/comet bumps + craters REMASTER, GATED (ST-520 I554). The verbatim user condition: "only if its gpu and compute heavy" = only if the budget allows. ST-520 runs a headless probe (FPS + draw calls + tris, before/after, ?fx=off and fx=high) over the 7 rock files. If the displacement remaster (AST-1 method) holds the frame budget AND fits a re-registered asset tri cap WITH MEASUREMENT, ship it; otherwise fall back to the AST-2 canvas/shader craters (0 new tris) or skip the story. Never ship a frame-budget regression.

## 4. Story map + estimates (ST-514..ST-521)

- ST-514 (I548) open/research/scope - this iteration: measured audit + LABELED research (CAM/BOSS/AST) + D1-D5 + story map + risks + pin safety + dist policy + scope-check-E75. Docs-only, zero src.
- ST-515 (I549) D1a - headless verification harness + screenshots + NDC probes (cockpit/chase/overview + V-switch snap-vs-damp). Test-only, zero dist change. Output: a measured gap list.
- ST-516 (I550) D1b - cockpit/camera polish fixes for the measured gaps (mode-specific labels + damped switch-if-snap + nose/crosshair tuning-if-gap + control-mapping fix-if-confirmed). Small src + i18n; DOM/CSS + a couple of camera-model knobs (re-pin only if a shipped mesh/geometry changes).
- ST-517 (I551) D2 - Level 5 data (config row + 4 palettes + campaignBoss[5] + i18n en/zh/ja + tests). Pure data + level.js; endless bit-identical.
- ST-518 (I552) D3 - 2 new enemy ships (Blender) + asset swap + re-pin WITH MEASUREMENT. FIRST E75 ASSET LANDING -> the new dist ceiling (7,400,000 B) applies here.
- ST-519 (I553) D4 - L5 boss (new kind + Blender mesh + campaignBoss extension) + asset swap + re-pin WITH MEASUREMENT.
- ST-520 (I554) D5 - asteroid/comet remaster (gated: displacement only if the headless probe holds budget, else canvas fallback / skip) + re-pin WITH MEASUREMENT if tris change.
- ST-521 (I555) G75.0 close gate - 5 fresh harnesses + CLOSE FLOOR E75 re-derived WITH MEASUREMENT + AGENTS.md refresh + asset budget re-derived WITH MEASUREMENT + push delegate.

## 5. Risks

- K1 (dist ceiling): E75 asset growth EXCEEDS the current 6.1 MB ceiling by measurement (sec.1.4). Mitigation: the 7,400,000 B ceiling is PRE-REGISTERED WITH MEASUREMENT and applied at the first asset landing (ST-518); the cut ladder (sec.7) is defined so the close floor never drops below 102,400 B.
- K2 (tri budget): the fleet is at 99.2% of the 73,000 t cap; D3+D4 add ~8,000-11,000 t and D5 (displacement) could add ~15,000-30,000 t. Mitigation: the asset tri cap is re-derived WITH MEASUREMENT at G75.0; D5 is gated so a tri blow-out can never ship.
- K3 (pin safety): D1 touches the camera model (cameraModel.js); D3/D4/D5 swap shipped meshes. Mitigation: every story expects the causal/playframe pins EXACT; re-pin ONLY when a shipped mesh/geometry actually changes, and only WITH MEASUREMENT (the re-pin note records the tri delta). Endless is guarded bit-identical.
- K4 (control-mapping false positive): the verbatim "w moves back / s moves forward" may be a misread, not a bug (E71 shipped view-relative). Mitigation: ST-515 verifies in-browser FIRST; a mapping fix ships only on a measured confirmation - no speculative inversion.
- K5 (i18n): D2/D4 add en/zh/ja strings (level name + 4 zones + boss). Mitigation: the CJK byte pipeline (fetch -> decode -> compare -> write ASCII \uXXXX; never hand-derive or console-read CJK); any missing locale key BLOCKS the story (ST-375).
- K6 (scope creep / over-engineering): the user explicitly said not to over-engineer. Mitigation: D1 is verify-then-polish (no rebuild); D3 = 2 new ships only (not a fleet re-remaster, which E72 already did); D5 is gated; every story re-pins and re-measures rather than expanding silently.
- K7 (webgpu): the user asked to use webgpu if it enables better visuals. The dual-renderer arm already exists (?fx=webgpu opt-in, E66). E75 does NOT make webgpu the default (the I495 C3 measured decision kept WebGL2 default); D5's gate probes both arms so a webgpu-only visual win can be registered without changing the default arm.

## 6. Pin safety (measured, tree-verified)

- Live pins: playframe A 22/32,717 + 11/180, B 52/69,272 (ship v7 32,499 t, re-pinned I541). causal495 seed-9876: 11,334 score / 57 kills / wave 2 / combo 15 / 198 shots / replay 2,169-2,220. pwa491 SUMMARY 11/11.
- I548 (this iteration): docs-only, zero src, zero 3D -> every pin EXPECTED EXACT, no re-pin.
- D1 (ST-516): camera-model knob changes do NOT alter shipped meshes -> pins stay EXACT; a re-pin happens only if the nose/crosshair change touches a rendered geometry (unlikely - they are DOM + a look vector).
- D2 (ST-517): pure campaign data -> endless pins EXACT (campaign-gated).
- D3/D4/D5 (ST-518/519/520): asset swaps -> re-pin WITH MEASUREMENT (tri delta recorded in the re-pin note); causal re-seed only if the endless enemy/rock population changes.

## 7. Verification + dist policy (PRE-REGISTERED)

Per-story verification bar: (1) npm test green; (2) npm run build 0; (3) browser smoke where rendering changed (console clean, no NaN, ONE headless tab, killed after); (4) dist under the active ceiling + close floor >= 102,400 B else the cut ladder; (5) vendor r187 4/4 EXACT; (6) the 5 regression harnesses fresh EXACT (causal495 / causal483 / playframe491 / playframe483 / pwa491).

dist policy:
- Active ceiling through ST-517 (code-only): 6,100,000 B (current), floor 540,785 B; code growth ~30-80 KB keeps dist ~5.6 MB - no renegotiation needed before the first asset.
- PRE-REGISTERED new ceiling WITH MEASUREMENT: 7,400,000 B, applied at the FIRST E75 asset landing (ST-518, D3) per the E69 rule. Justification: measured per-asset growth (sec.1.4) shows E75 lands ~6.7-6.9 MB at full scope; 7,400,000 B leaves a worst-case close floor of ~500,000 B (>= 102,400 B). Precedent: E69 renegotiated 4.7 MB -> 6.1 MB for a comparable asset step.
- Cut ladder (pre-registered, smallest first, applied only if dist threatens the floor): C1 drop the L5 boss mesh (keep the 398 t retinted monolith for L5) ~-300 KB; C2 drop one of the 2 new enemies (D3 -> 1 new ship) ~-220 KB; C3 D5 displacement -> canvas/shader craters ~-150-400 KB; C4 trim L5 to 3 zones instead of 4 (i18n + config) ~-a few KB.
