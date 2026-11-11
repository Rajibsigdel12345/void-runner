# Epics - Void Runner (cgs-create-epics)

## E1 - Foundations (iterations 1-4)
Outcome: repo builds, serves, tests run; three.js scene boots with a starfield.
Gate: `npm test` + `npm run build` green; browser smoke shows starfield.

## E2 - Core Loop (iterations 5-14)
Outcome: full playable MVP loop per GDD (fly/aim/fire/asteroids/waves/score/lives/states/HUD/high score).
Gate: can play a full session to game over and restart; unit tests cover S01-S14 logic.

## E3 - Depth: Power-ups (iterations 15-19)
Outcome: 5 power-ups with drop, pickup, timers, stacking; unit-tested.
Gate: each power-up observable + tested.

## E4 - Presentation & Feel (iterations 20-26)
Outcome: particles, screen shake, hit flash, synthesized SFX + ambience, settings persistence, score pop, wave banners.
Gate: kill feels juicy; settings persist across reload; audio respects mute.

## E5 - Player Systems & Accessibility (iterations 27-33)
Outcome: high-score persistence hardening, stats screen, tutorial hints, reduced-motion + FX quality, touch controls.
Gate: reload keeps best; touch can start a game; reduced motion visible in settings.

## E6 - Polish, QA, Gates (iterations 34-50)
Outcome: balance passes, perf pass, code review, bugfix rounds, playtest report,
regression suite green, vertical-slice gate passed, milestone review + release checklist.
Gate: all tests green, build green, browser regression clean, docs complete.

## Risk Register
- R1 FPS drop from entity churn -> pooling (E6 perf), Low if done in E3/E4.
- R2 Scope creep beyond 5 power-ups -> hard cap in GDD.
- R3 Audio autoplay policy (no user gesture) -> init on first input; tested in smoke.

## E7 - Extended Content, UX, Hardening & Release (iterations 51-100)
Outcome: content depth (wave modifiers, golden rocks, mines, boss monolith, overdrive),
UI/UX polish (menu, top-5 scores, accessibility), robustness (adaptive quality, context loss,
determinism + soak harnesses), feel/audio pass, and a second full QA/release cycle.
Gate: 100+ iterations logged, all tests green, build green, extended regression clean, playtested twice.

### E7A Content (ST-051..064)
- Wave modifiers, golden asteroid, near-miss bonus, mine drones, Monolith boss (every 5 waves) + enemy bullets,
  overdrive power-up, endless difficulty curve, gravity vortex hazard.
- Visual content: starfield twinkle/parallax, rim-lit rocks, bullet trails, shield pulse, engine flame.
- Balance pass 3 (new content vs pacing).

### E7B UI/UX (ST-065..072)
- Menu polish, top-5 score table, options panel polish, pause overlay, game-over celebration,
  colorblind-safe power-up glyphs + a11y, mobile/responsive polish, UI text pass.

### E7C Robustness & Perf (ST-073..080)
- Adaptive quality (auto FX downgrade), pool/memory audit, WebGL context-loss recovery,
  determinism harness (fixed input+seed replay), 10-min headless soak, resume/clock sync,
  storage versioning + corruption guards, debug overlay (pools/drawcalls/fps).

### E7D Feel & Audio (ST-081..088)
- Hit-stop + camera punch, dynamic FOV, audio stingers/jingles, spatial pan + compressor,
  vignette, per-entity particle palettes, sound-level pass, UI motion pass (reduced-motion safe).

### E7E QA & Release (ST-089..100)
- Regression round C, playtest v2, bugfix round C, balance pass 4, UI/UX final pass,
  docs (GDD addendum, architecture, README v2), perf re-verification, 100-iteration gate check,
  milestone review + retrospective v2, release checklist v2, final polish sweep + closing.

### E7 Risks
- R4 Boss scope creep -> single boss type, fixed HP/schedule, unit-tested spawn logic.
- R5 Adaptive quality masking real perf bugs -> log auto-downgrade events, keep debug overlay.

## E8 - Expansion Milestone (iterations 107-206)
Outcome: a visibly deeper game - scoring combo + weapon progression, 2 new
power-ups (bomb, slow-mo), 3 new enemy behaviors (homing drone, chain-splitter,
shielded rock), boss phase 2 + mini-boss + asteroid belt, daily seeded runs
with shareable results, first-run tutorial + session stats + kill feed,
colorblind shape cue, procedural music, death slow-mo + feel pass, replay
viewer, 300+ tests, and a full QA/release cycle closing at I206.
Gate: 100 new iterations logged (sequence 1..206), all tests green (300+),
build green, extended regression clean, playtested, per-phase gates G8.0-G8.6
recorded in production/gates.md.

### E8A Planning (ST-107..110)
- Scope check (I107), epics (I108), stories batch 1 (I109), E8 entry gate
  G8.0 (I110: baseline tests/build/perf/sequence re-verified).
- Depends on: nothing (E7 closed). Risk: planning overrun - capped at 4 iters.
- Gate G8.0: baseline evidence fresh, all phase stories have acceptance criteria.

### E8B Core gameplay expansion (ST-111..132)
- Score combo/multiplier (I111-112), bomb power-up (I113-114), slow-mo
  power-up (I115-116), homing drone enemy (I117-118), chain-splitter rocks
  (I119-120), shielded rocks (I121), weapon progression lvl 1-3 (I122-123),
  balance pass E8-1 (I124), determinism re-verify (I125), test batch (I126),
  browser verify (I127), gate G8.1 (I128), balance follow-up (I129),
  power-up drop rebalance (I130), enemy mix rebalance (I131), docs (I132).
- Depends on: G8.0. All new randomness via rng.js; all new entities pooled;
  core modules DOM-free.
- Gate G8.1: every new system unit-tested + observable in browser; determinism
  harness green; no NaN; perf within budget (dbg overlay).

### E8C Content variety (ST-133..150)
- Boss phase 2 (I133), boss radial bullet pattern (I134), boss intro banner
  (I135), mini-boss every 5 waves (I136-137), asteroid belt (I138-139),
  daily seeded run (I140-141), shareable result string (I142), boss variant 2
  (I143, CUTTABLE), balance pass E8-2 (I144), test batch (I145), browser
  verify (I146), gate G8.2 (I147), regression round A (I148), fix round A
  (I149), docs (I150).
- Depends on: G8.1.
- Gate G8.2: boss phases + mini-boss + belt verified in browser; daily seed
  reproducible (same date => same run); share string decodes; regression A clean.

### E8D UI/UX + accessibility (ST-151..168)
- First-run tutorial overlay (I151), session stats (I152), kill feed (I153),
  wave banner polish (I154), colorblind shape cue + toggle (I155-156),
  hotkeys M/P/F (I157), options rows (I158), share screen (I159), HUD
  rework (I160), a11y pass (I161), test batch (I162), browser verify
  (I163), gate G8.3 (I164), UX fix round (I165), string extraction (I166,
  CUTTABLE), UI perf check (I167), docs (I168).
- Depends on: G8.1 (stats feed); G8.2 nice-to-have (share screen).
- Gate G8.3: every new screen/overlay screenshot-verified; colorblind cue
  visible without color; hotkeys tested; reduced-motion honored by all new FX.

### E8E Audio + feel (ST-169..186)
- Procedural music drone loop (I169), intensity layers (I170), music toggle
  (I171), bullet-time pitch (I172), SFX pass for new content (I173), death
  slow-mo sequence (I174), unified shake table (I175), damage vignette
  (I176), pickup particles (I177), weapon-upgrade fanfare (I178), balance
  pass E8-3 feel (I179), audio headless tests (I180), browser verify (I181),
  gate G8.4 (I182), feel tuning round 2 (I183), perf profile (I184), memory
  audit (I185), docs (I186).
- Depends on: G8.1 (slow-mo exists), G8.3 (vignette respects a11y settings).
- Gate G8.4: music audible + toggleable + gesture-gated; death slow-mo
  verified; perf + memory within budget; all new FX respect reduced motion.

### E8F Robustness + testing + QA (ST-187..206)
- Context-loss hardening (I187-188), visibility pause (I189), replay viewer
  (I190) + capture UI (I191) [CUTTABLE], test growth 300+ (I192), flaky check
  (I193), security audit storage/seed codecs (I194), regression round B
  (I195-196), build size + load audit (I197), gate G8.5 (I198), regression
  round C + playtest prep (I199), docs (I200), QA plan (I201), human
  playtest (I202) + triage/fix (I203), release checklist (I204), final sweep
  (I205), E8 closeout: milestone review + final CHANGELOG + log audit 1..206
  (I206).
- Depends on: G8.2 (content stable before regression), G8.4 (feel stable).
- Gate G8.6: 100/100 E8 iterations logged 1..206 sequential, 300+ tests green,
  build green, regression B+C clean, playtest triaged, release checklist done.

## E8 Risk Register
- R-E8-1 (medium) Balance bloat -> balance passes E8-1/E8-2/E8-3 (I124/144/179).
- R-E8-2 (medium) Determinism regression -> rng.js only; harness re-run I125 + I198.
- R-E8-3 (medium) Long-span context loss -> active.md rewrite + skill re-read per phase.
- R-E8-4 (low) Perf from entity growth -> pooling + per-gate perf check (I80 overlay).
- R-E8-5 (low) WebAudio music cost -> synthesis, mute + music toggle, gesture init.
- R-E8-6 (low) Scope creep -> scope-check-E8.md is the cap; new ideas to Deferral.

## E9 Blender Graphics & Assets (ST-207..217) - CLOSED (I218)
- Context: Blender 5.2.3 connected. Assets modeled procedurally in Blender (bpy), exported as GLB, vendored under assets/, loaded by the render layer via three.js GLTFLoader with a PROCEDURAL FALLBACK (the game still boots if a GLB is missing or fails to parse). Polycounts stay within the existing draw-call / triangle budgets. The AGENTS.md 'no external art assets' convention is extended at ST-207 to 'Blender-authored, vendored GLB assets + procedural fallback'.
- Stories: ST-207 pipeline (Blender->GLB + GLTFLoader path, fallback, assets/ dir, AGENTS.md note); ST-208 ship model (40-tri faceted delta + canopy gem); ST-209 asteroid set L/M/S (320/104/80 tris, caggy displacement + COLOR_0 mottle, 4 inset craters on M); ST-210 boss (96-tri jagged obelisk + COLOR_0 crown) + shield shell (80 de-indexed plates); ST-211 seven powerup emblems (16..48 tris) + drone dart (52 tris); ST-212 equirect skybox (1024x512, 41 KB) + arena ring (24 plates, 48 tris); ST-213 materials/lighting (PMREM IBL envMapIntensity 0.55, emissive engine trail, bloom-safe audit); ST-214 asset perf + memory audit; ST-215 test batch E9 (18 tests); ST-216 G9.0 gate + docs + log audit 1..216.
- Depends on: E8 closed (I206); the I101-I106 Blender arc (art bible, asset spec, first 5 GLBs, GLTF hooks).
- Gate G9.0: 15 GLBs + skybox load at runtime, per-asset poly/tri/file/attribute budgets met (pinned by tests), procedural fallback proven, asset perf within budget (no bottleneck), fresh tests + build + dist + browser smoke green, log audit 1..216 sequential.
- Result (I216): PASS. 15 GLBs = 111.3 KB / 92.9 KB parsed geo / 1021 tris / 17 materials / 0 UV2; 280 pooled meshes over 26 unique geometries; ~5.5 MB GPU textures; 630->670 tests; dist 1939.2/501.3 KB (<=2048/550); ST-217 (post-processing polish) continues the art direction.
- Result (I218): CLOSED (G9.1 PASS). ST-217 done at I217 (half-res bloom - internal chain 1/4 frame, post chain ~11% cheaper steady; 40 ms phase-2 hit-stop; levers 2/3 verified already-done). Fresh at close: 676/676, build 0, dist 1940.6/501.9 KB, log audit 1..218 sequential. R-E9-1..4 CLOSED (gates G9.1 evidence); 8 HUMAN-PENDING perception items carried to E10.

## E9 Risk Register
- R-E9-1 (medium) dist budget creep from assets -> I214 audit: 15 GLBs = 111.3 KB (~6% of dist raw); pinned by assetPerf.test.js (total files <=160 KB, per-file <=60 KB, tris <=1500).
- R-E9-2 (low) GLB parse/axis failures break visuals -> procedural fallback proven (I207); assetGlbs/assetPerf tests gate naming, budgets, required attributes.
- R-E9-3 (low) Blender 5.2 exporter quirks (Y-up flip, COLOR_0 needs Color Attribute node, from_pydata face tuples, img.pixels 4ch) -> captured in I208-I212 notes; audits re-verify exports.
- R-E9-4 (low) scope creep into new content -> design/art-direction-research.md is the cap; ST-217 is the only queued art story.

## E10 Post-E9 Polish (ST-218..220) - CLOSED (I222)
- Context: E9 closed at I218 (G9.1 PASS). E10 is a SMALL polish milestone: finish the last procedural enemy model in Blender (Warden), land the last unowned art-research lever (camera/feel, lever 6), then regression + gate. No new content, no new dependencies, no core determinism changes (camera is render-layer).
- Stories: ST-218 Warden Blender model (jagged armored sentinel, separate armor-plate mesh so the armor-state animation carries over; 2 draw calls; budgets <=200 tris / <=40 KB / <=3 mats; procedural fallback preserved); ST-219 camera/feel (2-5% aim-lead eased + capped, boss-approach zoom-out a few degrees, slow menu orbit drift, view fixed during normal play, motion-gated); ST-220 E10 regression round + G10.0 gate + closeout docs.
- Depends on: E9 closed (I218); GLB pipeline + assetPerf test pattern (E9).
- Gate G10.0: 16 GLBs load (15 + Warden), Warden armor-state animation intact (screenshot-compare armored/spent), camera deltas subtle + stable-view verified (scripted pilot parity), fresh tests + build + dist in budget, log audit sequential, regression round green.
- Scope check: production/scope-check-E10.md (I219, APPROVED with cuts/deferrals/risks R-E10-1..3).
- Result (I222): CLOSED (G10.0 PASS). 3/3 stories ST-218..220 (I219..I222). Warden GLB (16th asset, 180 tris / 11.5 KB / 2 mats, separate armor node + procedural fallback), camera/feel (aim-lead capped 1.2 u, boss zoom 2.5 deg, menu orbit 0.06 rad/s, all motion-gated; view fixed in normal play), tests 677/677 (x3 matrix), dist 1954.9/506.2 KB (in budget), demo pin re-verified exact. R-E10-1..3 CLOSED. Carried: 8 HUMAN-PENDING + low-end device. Next: E11 (scope check).

## E10 Risk Register
- R-E10-1 (low) Warden GLB breaks the armor-state visual -> armor plate as separate node driven by the existing wardenMesh.js animation; screenshot-compare both states in smoke.
- R-E10-2 (low) camera lead hurts dodge read -> cap 2-5%, eased both ways, A/B screenshots + scripted-pilot parity (no core change).
- R-E10-3 (low) dist creep (+1 GLB vs ~48.1 KB gzip headroom) -> per-file budget pattern extended to 16 assets in assetPerf.test.js.

## E11 Combat Juice & Low-End Validation (ST-221..223)
- Context: E10 closed at I222 (G10.0 PASS). E11 is a SMALL bounded pass over the two remaining bot-verifiable carried items: (1) T4 (production/bug-triage.md v2, P2, owner senior_game_artist) - no kill-time juice channel: a plain rock kill is the most frequent kill in the game and fires none of the five juice channels (~1 juice event/60 s for an active pilot; the juice hierarchy has a hole at the rock-kill rung - drone kills get shake+flash, rock kills get nothing); (2) the carried low-end physical device / GPU validation risk: the hardware remainder stays HARDWARE-pending, but the adaptive-quality ladder, the FX tiers, the DPR cap and the reduced-motion + FX-low combo are bot-verifiable headless. No new content, no Blender assets, no scoring changes (the demo pin is structurally untouched).
- Stories: ST-221 kill juice (class-scaled directed kill punch S 0.08 / M 0.12 / L 0.18 at the bottom juice rung + overdrive combo-heat x1.5, no flash/hit-stop/fovKick on plain kills, motion-gated, pure-logic core mapping, CONFIG.fx.killPunch); ST-222 low-end device validation bot-verifiable half (cgs-perf-profile: dense worst-case at FX high/low/off, adaptive ladder under sustained load, DPR cap, rm + FX-low combo, green/red matrix in perf-profile.md, hardware remainder as labeled checklist); ST-223 E11 regression round + G11.0 gate + closeout docs.
- Depends on: E10 closed (I222); juiceTally probe (I183), adaptive quality (I73), load-injection pattern (I95/I182).
- Gate G11.0: kill juice unit-tested + browser-verified (juiceTally deltas, A/B screenshots, pilot parity, frame delta ~0, reduced-motion gated), low-end tier matrix documented (all tiers stable, adaptive ladder fires + stabilizes, DPR cap honored), fresh tests + build + dist in budget, demo pin re-verified exact, regression round green, log audit sequential.
- Scope check: production/scope-check-E11.md (I223, APPROVED with cut option, deferrals, risks R-E11-1..3).
- Result (I226): CLOSED (G11.0 PASS). 3/3 stories ST-221..223 (I224..I226). Kill juice (bottom juice rung: class-scaled directed kill punch S/M/L 0.08/0.12/0.18 + overdrive x1.5, no flash/hit-stop on plain kills, motion-gated, pure core + 12 tests; juiceTally 8/8 I224 + 15/15 I226), low-end tier matrix (p95 16.8 ms at the 60 Hz vsync floor both FX tiers, adaptive ladder fires + hysteresis + user lock + reset, DPR cap honored, rm + FX-low combo, 3 flags + HARDWARE-pending checklist), tests 689/689 (x3 matrix), dist 1958.4/507.8 KB (in budget), demo pin re-verified exact via real UI. R-E11-1..3 CLOSED. Carried: 8 HUMAN-PENDING + hardware remainder + 3 I225 flags (E12 candidates). Next: E12 (scope check).

## E11 Risk Register
- R-E11-1 (low) per-kill punch desensitizes or reads as noise at kill rate -> bottom-rung amplitudes (0.08/0.12/0.18 energy, all far below the drone rung 0.35 shake and the 0.45 weapon fanfare), no flash/hit-stop on plain kills; juiceTally frequency + A/B screenshots + pilot parity in ST-221.
- R-E11-2 (low) punch changes perturb the scripted pilot feel/survival -> core scoring untouched (demo pin structurally unaffected); pilot parity check required in ST-221.
- R-E11-3 (low) headless adaptive-quality artifacts (known T7: degraded headless rAF triggers downgrades) -> proven sustained-barrage load-injection pattern (I95/I182); headless-only observations labeled; physical-device remainder stays HARDWARE-pending.
## E12 Quality Settings Consistency & Skybox Art Pass (ST-224..227)
- Context: E11 closed at I226 (G11.0 PASS). E12 closes the 3 I225 scope-vs-code flags (the E11 scope referenced FX high/low/off, a DPR 1.5 under load, and tier-visible settings, but the shipped code has high/low only, a static min(dpr,2) cap, and a panel that shows the stored choice while rendering the effective tier) plus the last carried art item: the 512x256 skybox (E10 scope-check deferral) - per the user standing art/Blender directive. All stories are render/settings-layer: no core sim changes (the demo pin is structurally untouched), no new dependencies, all bot-verifiable.
- Stories: ST-224 FX off tier (F cycles high->low->off->high; panel 3rd option; off = zero FX-tier-gated render effects - burst particles 0, engine trail puffs 0; bloom already high-only; starfield twinkle + juice channels intentionally unaffected (feel/readability, not FX tier); user-only tier, adaptive ladder unchanged; pure-core toggleFxQuality + storage/adaptive tests); ST-225 load-reactive DPR + effective-tier settings sync (pure dprForTier high min(dpr,2)/low min(dpr,1.5) applied on onTier/reset/userSet with a single labeled resize; panel + pause F-row + screenOpts show the effective tier with an AUTO marker on auto-downgrade; stored user choice never overwritten; Playwright deviceScaleFactor=2 emulation bot path); ST-226 skybox art pass (Blender node-based equirect per Pitchfork/CG Cookie grounding: layered gas in the 0x04060f base + cyan/magenta accents + faint gold, thin dust lanes, subtle off-axis galactic band, clustered stars + a few hero stars, no planets; budget-staged 2048x1024 -> 1024x512 -> 768x384, PNG -> WebP/JPEG, net delta <= 40 KB raw vs the 41.2 KB current asset, dist stays <=2048/<=550; documented fallback = runtime canvas FBM zero-asset generator; PMREM IBL hook (I213) unchanged); ST-227 E12 regression round + G12.0 gate + closeout docs.
- Depends on: E11 closed (I226); adaptive quality (I73) + I225 matrix; I212 skybox pipeline + I213 PMREM IBL; settings panel (ST-067 preview path); Blender 5.2.3 MCP.
- Gate G12.0: FX off tier unit + browser verified (zero particle/trail leak at off, F cycle + persistence + user-lock semantics), DPR + tier sync unit + browser verified (dprForTier exact; dpr-2 emulation downgrade 2.0 -> 1.5 -> restore; panel AUTO marker in/out; storage untouched), skybox A/B (MENU + in-flight, readability preserved both FX tiers) + dist in budget + frame delta ~0 + IBL probe, fresh tests + build + dist in budget, demo pin re-verified exact via the real UI, regression round green, log audit sequential.
- Scope check: production/scope-check-E12.md (I227, APPROVED with cut option, deferrals, risks R-E12-1..4).
- Result (I231): CLOSED (G12.0 PASS). 4/4 stories ST-224..227 (I228..I231). Closes the 3 I225 scope-vs-code flags (FX off tier, load-reactive DPR 1.5, effective-tier settings sync with the AUTO marker) + the carried 512x256 skybox deferral (Blender equirect v5, 1024x512 JPEG 73.2 KB, net +32.0 KB within budget). 1-line gate fix found live and closed in-gate: F-hotkey userSet before applyFxTier (stale AUTO: LOW marker after an auto-downgrade - the R-E12-4 surface). 697/697 x3 matrix, build 0, dist 1994.7/543.4 KB, demo pin exact via real UI, log 1..231 sequential.

## E12 Risk Register
- R-E12-1 (med, CLOSED at I231) FX off tier leaks particles/trail at some render site -> grep-audit every fx-tier-gated read; zero-counts from CONFIG (single source); browser zero-leak check at off (scripted kills -> live 0 + trail 0 + bloom off) + frame probe.
- R-E12-2 (low, CLOSED at I231) mid-session DPR switch = one-time resize hitch -> single labeled resize; DPR follows the tier only (confirm windows + hysteresis already prevent churn); frame probe after the switch.
- R-E12-3 (med, CLOSED at I231) skybox encode blows the dist budget (~42 KB headroom) -> staged sizes/formats with recorded size evidence, then the documented canvas-FBM fallback; dist gate is a hard criterion; asset size audit pins the final file.
- R-E12-4 (low, CLOSED at I231) AUTO tier indicator reads as a settings bug -> explicit (auto) marker + existing toast + tests pin that automation never overwrites the stored user choice.


## E13 Mid-Run Content Arc (ST-228..231)
- Context: E12 closed at I231 (G12.0 PASS). E13 is the biggest unowned lever: the wave 3-9 content valley. YouTube grounding (8 queries / 68 unique; metadata + chapters + descriptions): the roster gap is the missing rammer/charger archetype (the timing/dodge verb - 1up Indie 'Wave flyer + rammer': the rammer checks a line of sight then goes faster) and the missing BIG counterweight to the SMALL modifier (GMTK: an enemy earns its place via a tactical option with a legible telegraph; PepperHead: variety = a new verb, not new stats). Demo-pin-compatible BY GATING (the demo run dies on wave 2; modifier W3+, stinger W7+ - structurally unreachable; re-verified via the real UI at ST-231). Daily salt bump 'daily' -> 'daily:v2' (the ST-140 namespacing re-versions the canonical daily run).
- Stories: ST-228 HEAVY ROCKS modifier ('big' 4th waveMods.list entry, bigLBias 0.5 mirror of SMALL, deterministic (seed, wave) roll, 'HEAVY ROCKS' banner + i18n, GDD update, daily salt bump 'daily:v2' + GDD daily example + daily test update); ST-229 STINGER enemy (the charger archetype: cruise 1.8 u/s -> telegraph 0.8 s (emissive core glow + rising SFX) -> charge 7.5 u/s x 1.4 s -> recover 1.2 s, 6-charge lifetime fizzle, wave 7+ 1/wave cap 2, rim 15 u, contact 1 life no score, kill +250, shakeTable 0.6 + killPunch 0.2, 2 new SFX cues, pool 4 + procedural fallback + GLB hook, CONFIG.stinger, toast + kill feed, src/core/stinger.js pure + tests, HUMAN-PENDING #9 appended); ST-230 Blender STINGER model + asset budget pass (<=200 tris / <=40 KB / <=3 materials, separate emissive core node, VR_ naming, 17th asset + assetGlbs/assetPerf extension to 17; skybox JPEG 73.2 -> <=60 KB staged quality + browser A/B; net gzip delta of the story <= 0 KB; >= 8 KB headroom restored before the gate); ST-231 regression + G13.0 + closeout (demo pin EXACT via real UI headline).
- Depends on: E12 closed (I231); ST-051 modifier pipeline + ST-092 breather; ST-117 seeker pool/battery precedent; ST-121 shielded-rock HP-variant precedent; E9 GLB pipeline + assetPerf audits; ST-173 SFX pattern + E11 juice hierarchy; I230 skybox JPEG; I232 gzip measurement.
- Gate G13.0: modifier unit + browser (4-way roll determinism, HEAVY ROCKS live seeded scenario + banner, W1-2 plain + breather invariants); stinger unit + browser (full lifecycle, kill +250 + feed + juice rungs, contact death, 6-charge fizzle, cap 2, W7+ 15 u, rm glow kept / wobble gated, FX-off no extra particles); GLB loads 17/17 + fallback proven; skybox A/B readability-equivalent + dist in budget headroom >= 8 KB (net delta <= 0); demo pin EXACT via real UI (2169/2220, 11334, 57, 36.15, wave 2); fresh tests + build + dist in budget; regression green; log audit sequential.
- Scope check: production/scope-check-E13.md (I232, APPROVED with cut option, deferrals, risks R-E13-1..5).
- Result (I236): CLOSED (G13.0 PASS). 4/4 stories ST-228..231 (I233..I236). Fills the wave 3-9 content valley (HEAVY ROCKS modifier + STINGER charger + 17th Blender asset), gzip headroom restored 1.8 -> 13.0 KB (story net -12.3 KB), fresh 710/710 x3 + build 0 + dist in budget, demo pin re-verified EXACT via the real UI, log 1..236 sequential.

## E13 Risk Register
- R-E13-1 (med), CLOSED at I236) demo pin drift from the modifier re-map -> all new content gated beyond the demo's wave 2 (structural argument + a unit check that the demo seed never reaches W3), the daily salt bump is namespaced per ST-140, and the pin is re-verified via the real UI at ST-231.
- R-E13-2 (med), CLOSED at I236) stinger unreadable/undodgeable -> 0.8 s telegraph + FX-tier-independent glow (readability, not FX) + rising SFX; charge 7.5 u/s x 1.4 s = 10.5 u crossing vs the ship's 6+ u/s; scripted-pilot dodge scenario in G13.0; HUMAN-PENDING #9 (perception is not self-served).
- R-E13-3 (med), CLOSED at I236) gzip budget blow (headroom ~6.6 KB WATCH) -> the skybox re-encode (73.2 -> <=60 KB) funds the stinger GLB (~4-6 KB gz); staged quality + size evidence + browser A/B; the dist gate is a hard criterion; audits pin the final files; net delta of the story <= 0.
- R-E13-4 (low), CLOSED at I236) the 4th waveMods entry re-maps all wave 3+ rolls -> pinned-roll unit tests updated intentionally and documented in the iteration log; the determinism harness re-runs; roll invariants (breather, W1-2 plain) pinned.
- R-E13-5 (low), CLOSED at I236) pool/perf growth -> stinger pool 4 (cap 2 + 2 spare), no new per-frame allocations, memoryBounds extended, frame probe in G13.0.

## E14 Late-Run Mastery Arc (ST-232..235)
- Context: E13 closed at I236 (G13.0 PASS). E14 = the late-run mastery band: the two levers left by the bug-triage + E13 roster re-analysis - (1) the missing evasive-flyer archetype (Asteroids-UFO line: a high-value target that weaves and demands a lead shot; the ship has camera lead only - no bullet aim-assist exists - so weaving is a genuinely new verb) and (2) the combo cap flatline (T1 in bug-triage.md: active pilots hit the cap of 15 in ~12 s, then a flat 2.4x for the rest of the run; Extra Credits Skinner boxes: flat rewards past the ceiling = the T1 flatline failure mode). Both are demo-pin-compatible BY GATING (the demo run dies on wave 2; flyer W9+ / cap W3+ - structurally unreachable; re-verified via the real UI at ST-235). YouTube grounding (5 queries / 40 unique; transcripts rate-limited - metadata + chapters + descriptions): Bog Hog SHMUP workshop 04 (one archetype per role), Stardust 1993 (late-run depth = layered patterns + high speed), 1up Indie wave flyer (sine weave), canonical Asteroids UFO (evasive high-value target, no contact lethality, no firing), Extra Credits Skinner boxes.
- Stories: ST-232 FLYER evasive enemy (Asteroids-UFO archetype: rim 15 u entry -> cruise 2.5 u/s + perpendicular sine weave (amp ~1.2 u, period ~0.9 s, continuously re-aiming) -> lifetime 9-12 s exit (rim fade, NO score, stinger fizzle precedent); 2 hits, kill +400 + distinctive burst + high-pitch chime + FLYER kill-feed row; NO contact lethality (target not threat - stinger = dodge verb, flyer = aim verb); W9+, 1/wave, cap 2, pool 4; procedural fallback (elongated hexa-disc) all tiers + GLB swap; CONFIG.flyer, first-spawn toast, 2 SFX cues; src/core/flyer.js pure + unit tests; HUMAN-PENDING #10 weave feel); ST-233 combo cap wave-scaling (capFor(wave) pure fn: W1-2 cap 15 EXACT (demo pin structurally untouched), W3+ cap 20 => 2.9x mastery band; fixes T1 flatline where mastery matters; W1-2 flat onboarding band = accepted documented trade-off R-E14-5; verify I111 HUD 5-tier math is cap-relative before changing; no storage impact); ST-234 Blender FLYER model (18th asset: UFO saucer <=120 tris / <=3 materials, VR_Flyer_Body, POSITION+NORMAL only, <=10 KB raw / <=4 KB gz; headroom 13.0 -> must leave >=8 after the story; assetGlbs/assetPerf 17->18; pool shares GLB geo (stinger pattern)); ST-235 regression + G14.0 + close (ST-231 template; demo pin EXACT via real UI = headline).
- Depends on: E13 closed (I236); ST-117 seeker pool/battery precedent; E9 GLB pipeline + I235 stinger GLB pattern; I236 frame-probe pattern + deterministic staging recipe; ST-190 replay viewer (pin re-verify path).
- Gate G14.0: flyer unit + browser (weave determinism at pinned times, 2-hit +400 + feed + juice, lifetime fizzle, cap 2, W9+ 15 u, RM amp gated, FX high/low/off matrix, no contact lethality, GLB 18/18 + fallback); combo capFor unit + browser (W1-2 cap 15 exact, W3+ cap 20, multiplier table, HUD tiers, pin test tests/replay.test.js:246 passes UNMODIFIED, real-UI re-verify); GLB 18/18; dist headroom >=8 KB after the story; fresh tests + build + dist; regression green; log audit sequential (1..241 at close).
- Scope check: production/scope-check-E14.md (I237, APPROVED with cut option, deferrals, risks R-E14-1..5).
- Result (I241): CLOSED (G14.0 PASS). 4/4 stories ST-232..235 (I238..I241). The late-run mastery band shipped (FLYER sine-weave lead-shot target + combo cap wave-scaling + 18th Blender asset + skybox q75 re-encode), fresh 731/731 x3 + build 0 + dist 111 files 2014.0/534.0 KB (headroom 34.0/16.0), demo pin re-verified EXACT via the real UI, log 1..241 sequential.

## E14 Risk Register
- R-E14-1 (med), CLOSED at I241) flyer hit-rate feel -> weave tuned against the bot lead-shot model in the browser (target ~50-70% hit at max ship speed, ~30% low); HUMAN-PENDING #10 to append at ST-232.
- R-E14-2 (low), CLOSED at I241) demo-pin drift -> wave gate structural (flyer W9+ / cap W3+ vs demo wave 2); pin test tests/replay.test.js:246 passes UNMODIFIED; real-UI re-verify at ST-235.
- R-E14-3 (low), CLOSED at I241) gzip budget -> GLB staged <=4 KB gz; headroom floor >=8 KB after the story (I236 baseline 13.0 KB).
- R-E14-4 (low), CLOSED at I241) W9+ density overload -> cap 2, 1/wave, 9-12 s lifetime, pool 4; bot soak at the gate.
- R-E14-5 (low), CLOSED at I241) W1-2 combo flat = accepted non-goal (onboarding band); HUD tier math re-mapped cap-relative with tests.

## E15 Visual Identity & Presentation Arc (ST-236..239)
- Context: E14 closed at I241 (G14.0 PASS). E15 = the visual identity arc (user standing suggestion: improve the art, Blender-ready, research -> task list). The three unowned presentation levers, verified in code at I242: (1) the renderer runs on three.js defaults (no tone mapping, no explicit output color space - src/main.js:64) - the scene-wide look lever AND the render-layer tool for the I230 skybox warm-brown-cast note; (2) ship.glb is the oldest asset (E9, pre-IBL, 5040 B) and the most-seen mesh - a silhouette-first hero pass is owed; (3) the kill FX is a single particle cloud layer - no shockwave (the genre VFX reference layers sparks + shockwave + debris). All three are render/asset layer ONLY - the demo pin is structurally untouched (I217/I235/I240 precedent). YouTube grounding (5 queries / 42 unique; metadata + chapters + descriptions; transcripts rate-limited): Wael Yasmina tone mapping/sRGB + bloom passes (selective bloom OUT of scope), Imphenzia silhouette-first low-poly ship modeling, Brackeys VFX layering (sparks/shockwave/debris), Synty low-poly family consistency, style-by-necessity.
- Stories: ST-236 renderer color/tone pipeline (one CONFIG.render.tone block: tone mapping + exposure + explicit sRGB output; A/B screenshot matrix MENU + in-flight x FX high/low/off; skybox readability spot check (I230 warm-cast note is the acceptance hook); frame probe delta ~0; zero core changes); ST-237 ship hero pass (Blender MCP rebuild of ship.glb: silhouette-first top-down readability, engine nozzle + SEPARATE emissive engine node (the I213 trail gets a visible origin), wing/cockpit detail within budgets (<=120 tris / <=3 mats / <=8 KB gz); extent parity vs the UPDATED procedural fallback; in-code materials kept (hitFlash / invuln blink untouched - I240 pattern); assetPerf audit; 18 slots, count unchanged); ST-238 explosion layering pass (short-lived additive shockwave ring on class-scaled kills - the Brackeys layering recipe; NO flash / hit-stop on plain kills (I224 readability rule holds); ONE pooled ring mesh, FX high 1 / low 1 / off 0 (off = zero new rings per the I224 zero-leak rule), motion-gated, juiceTally extension, frame probe delta ~0); ST-239 regression + G15.0 + closeout (ST-235 template; demo pin EXACT via real UI = headline).
- Depends on: E14 closed (I241); E9 GLB pipeline + assetPerf audits; I213 IBL + engine trail; I217 half-res bloom (threshold 0.72); I224 kill juice + readability rule; I226 FX off tier + zero-leak rule; I240 GLB-swap pattern (in-code materials kept).
- Gate G15.0: tone pipeline A/B matrix + skybox readability spot check + frame probe; ship GLB replacement 18/18 + fallback extent parity + audit (18 slots, count unchanged); shockwave FX matrix high/low/off + off zero-leak + frame probe; demo pin EXACT via real UI (2169/2220, 11334, 57, 36.15, wave 2); fresh tests + build + dist in budget (headroom >= 8 KB gzip after the story); regression green; log audit sequential (1..246 at close).
- Scope check: production/scope-check-E15.md (I242, APPROVED with cut option, deferrals, risks R-E15-1..4).
- Result (I246): CLOSED (G15.0 PASS). 4/4 stories ST-236..239 (I243..I246). The visual identity arc shipped (CONFIG.render.tone ACES pipeline + ship hero GLB + class-scaled shockwave rings), fresh 742/742 + build 0 + dist 113 files 2026.5/538.2 KB (headroom 21.5/11.8), demo pin re-verified EXACT via the real UI, log 1..246 sequential.

## E15 Risk Register
- R-E15-1 (med, CLOSED at I246) the tone-mapping shift changes the whole-scene look (skybox, rock faces, emissives; the 0.72 bloom threshold was tuned against NoToneMapping) -> A/B screenshot matrix (MENU + in-flight x FX high/low/off) + skybox readability spot check (the I230 warm-cast note is the acceptance hook) + a single CONFIG.render.tone block (one-line revert to the current default).
- R-E15-2 (low, CLOSED at I246) the ship rebuild breaks hitFlash / invuln-blink / trail parity -> in-code materials kept (I240 GLB-swap pattern), extent parity vs the updated procedural fallback, assetPerf audit + extent band test.
- R-E15-3 (low, CLOSED at I246) the shockwave ring adds draw calls / allocations -> ONE pooled ring mesh (reused, no per-frame allocations), additive quad, FX off = 0 rings (I224 zero-leak rule), motion-gated, frame probe delta ~0.
- R-E15-4 (low, CLOSED at I246) dist budget -> ship GLB staged <= 8 KB gz; headroom floor >= 8 KB gzip after the story (baseline at open: 16.0 KB gzip / 34.0 KB raw).

## E16 Boss Finale Arc (ST-240..243)
- Context: E15 closed at I246 (G15.0 PASS). E16 = the boss finale arc - the carryover levers around the wave-5+ boss death, verified in code at I247: (1) boss.glb (11652 B / 1 node / 96 tris / 1 mat) is the oldest remaining hero asset (power-ups all gained GLBs at I211), bossMesh.useGLB takes ONLY the first mesh's geometry, and bossPhase2 (main.js:701) = hit-stop only - no visual phase-2 state (boss.phase 1/2 ST-133 + boss.entered 0..1 ST-135 are available); (2) musicIntensityX steps 0.17->0.90 in ONE tick when the boss spawns (T5 measured), releases one-tick on death, no phase-2 lift - HUMAN-PENDING #5 (music quality) + T5 objective half; (3) the ST-092 F9 post-boss breather sets the wave MODIFIER to 'none' but the open spawn batch is still full density (waves.js:35-44) - HUMAN-PENDING #1 (post-boss breather feel) objective half. All render/asset + pure-core; demo-pin-compatible BY GATING (boss W5+ / breather W6+ / music audio-only; FLYER W9+ precedent I237); no daily salt bump (labeled assumption). YouTube grounding (4 queries / 40 unique; metadata + chapters + descriptions; transcripts rate-limited): Grant Abbitt + Imphenzia silhouette-first low-poly workflow (base-mesh silhouette first -> decimate to budget), RobProductionsGames boss timelapse (rough shape carries the silhouette), Amadeus Herrera adaptive 3-phase boss music (parameters + transitions, NOT steps), Karol Sobczak + Tawhid Composes (the finale needs a release after the peak); q3 (pacing) = no direct tutorial - scoped from internal evidence.
- Stories: ST-240 boss hero pass (Blender MCP rebuild of boss.glb: 3 named nodes VR_Boss_{Hull,Crown,Core} - hull tapered faceted obelisk / crown separate silhouette cap / core recessed vertical eye-seam; <=250 tris / <=3 mats / <=10 KB gz; extent parity vs the procedural fallback; in-code materials kept (I240/I244 pattern) + warden-pattern name-based multi-node swap (I220); the Core node gets a separate in-code emissive material shifting brighter/redder on boss.phase===2 = the first visual phase-2 state; Splicer variant unchanged - same geometry, existing teal logic; assetPerf audit 18 slots, count unchanged); ST-241 finale music pass (extend musicIntensityX (pure): the boss floor eases in over the boss entrance weighted by boss.entered; +0.1 phase-2 lift while phase===2 (cap 1.0); post-death release decay over a cfg window (game.js sets world.bossRelease 1 on bossDeath, decays 1/dt/s); unit tests + browser A/B via __vr.musicIntensityVal() around a forced boss spawn (pre: ~0.73 one-tick step; post: max 1-s window delta <= ~0.25); perception verdict stays HUMAN-PENDING #5, labeled non-blocking); ST-242 breather open density (extend the ST-092 breather: the wave right after a boss opens with a reduced spawn batch (cfg breatherOpenFrac 0.5, min 3 rocks, deterministic (seed, wave)); NO wave-timing change (modifierFor untouched) -> pin + wave-timeline tests structurally unaffected; unit tests + seed-run smoke (wave-6 open-batch count vs pre-change, determinism x2, 1200+ tick re-measure per I238/I240); feel verdict stays HP #1); ST-243 E16 regression round + G16.0 gate + closeout (I241/I246 template; demo pin EXACT via real UI = headline; log audit 1..251).
- Depends on: E15 closed (I246); E9 GLB pipeline + assetPerf audits; I220 warden multi-mesh swap pattern; I240/I244 in-code-material GLB pattern; I170/I172 music seams (musicIntensityX + timeWarp); ST-133 boss phase 1/2 one-way; ST-135 boss entrance; ST-092 F9 post-boss breather; I224 readability rule; ST-190 replay (pin re-verify path).
- Gate G16.0: boss GLB 18/18 + extent parity + audit + phase-2 core glow live; music ramp A/B (objective 1-s delta) + unit curves; breather open-batch counts deterministic + pin unmodified; demo pin EXACT via real UI (2169/2220, 11334, 57, 36.15, wave 2); fresh tests + build + dist in budget (headroom >= 8); regression green; log audit sequential 1..251.
- Scope check: production/scope-check-E16.md (I247, APPROVED with cut option, deferrals, risks R-E16-1..4).
- Result: CLOSED at I251 (G16.0 PASS, 7/7) - 4/4 stories (ST-240..243 over I248..I251): boss hero GLB (3 nodes / 70 tris / 3 in-code mats; first visual phase-2 state via the Core emissive; Splicer parity exact), finale music pass (entry ramp max 1-s delta 0.1496 <= 0.25; phase-2 lift to 1.0 exact; release lands on waveX), breather open density (wave 6 opens 5 not 10; FNV-1a e1d99a25 bit-identical to pre-change). Closeout at I251: demo pin EXACT via real UI (11334 / 57 / wave 2 / 0:36 / idx 2169/2220), state machine 25-cell matrix + 11 live real-key transitions, persistence exact, FX-off zero-leak + readability floor 8 live, pool caps documented, fresh 1080-tick pilot 0 NaN, console 0/0/0, dist 2033.0/539.1 KB (headroom 10.9 >= 8), log audit 1..251. R-E16-1..4 CLOSED.

## E16 Risk Register
- R-E16-1 (med) the GLB rebuild breaks the pulse / Splicer variant / phase-2 read -> in-code materials kept (I240/I244 pattern), warden-pattern name-based multi-node swap (I220 precedent: VR_Warden_Armor -> armor, first other -> hull), extent parity vs the procedural fallback (Box r*1.2 x h=r*2.6 x r*1.2 + seeded jitter 0x0bad), assetPerf audit + Splicer teal-pulse live check.
- R-E16-2 (low) the curve retune changes the wave ramp -> only the boss entry / phase-2 / release bands change; the wave asymptote stays unit-pinned (tests/musicIntensity.test.js).
- R-E16-3 (low) the W6 density shift destabilizes the recorded run -> deterministic (seed, wave), W6+ only (the wave after the W5 boss), wave timing unchanged (modifierFor untouched), pin + wave-timeline tests structurally unaffected.
- R-E16-4 (low) dist budget -> boss GLB staged <=10 KB gz; headroom floor >= 8 KB gzip after the story (baseline at open: 11.8 KB gzip / 21.5 KB raw).
- Status (I251): R-E16-1 CLOSED (I248 - 3-node GLB + Splicer parity exact + phase-2 core glow live), R-E16-2 CLOSED (I249 - ramp A/B 0.1496 <= 0.25 + asymptote unit-pinned), R-E16-3 CLOSED (I250 - wave-6 count 5 + e1d99a25 bit-identical), R-E16-4 CLOSED (I251 - dist headroom 10.9 KB gzip >= 8).

## E17 Asteroid Family & World Polish Arc (ST-244..246)
- Context: E16 closed at I251 (G16.0 PASS 7/7). E17 = the next art arc from the user standing suggestion (Blender for improved art), scoped from the full 18-GLB inventory audit at I252: the ASTEROID FAMILY is the oldest remaining hero-asset family (I103 v1 / I209 v2; ship I244 and boss I248 have since gained hero passes) AND the most-seen geometry in the game (rock pool 29, cap 24 concurrent - the base loop); the ARENA RING (I212) is a single 48-tri flat band - the world's boundary anchor and the genre's vector-grid signature (Geometry Wars / Neon Wars / Starfighter Neon grounding) underplayed. All render/asset layer only: no core sim / scoring / replay-data changes (demo pin structurally untouched BY LAYER, I217/I235/I240/I244/I248 precedent); no daily salt bump (no core changes). YouTube grounding (I252, 5 queries / 41 unique; transcripts rate-limited -> metadata + chapters + descriptions): Rod DeWeese 2026 non-destructive asteroid workflow (Sub-D + Displace + Lattice = class-shaping lever), Sleep Fight Games low-poly displace recipe, Blender Bones crater depth/variation as hero detail, the neon-vector boundary language of the Geometry Wars line.
- Stories: ST-244 asteroid hero pass (Blender MCP v3 rebuild of asteroid L/M/S: class-differentiated silhouettes - L chunky slab boulder (lattice warp, large plateau facets, deep inset craters), M classic jagged rock (I209 4-crater + mottle retained), S sharp shard (pointier displacement, fresh-break read); richer COLOR_0 (I209 displacement shade + 2-3 mottle bands + crater-rim brightening); single geometry per size kept; EXACT radii 2.2/1.3/0.7 (test 5% band); VR_Rock_{L,M,S} + VR_Rock material + COLOR_0 on all primitives (assetPerf: COLOR_0 on exactly the 4 rock/boss GLBs, count unchanged); budgets L<=320/M<=120/S<=80; NET NEGATIVE raw size (L 37.66 KB outlier -> lean export + class decimate); in-code materials kept (vertexColors:true - golden/shielded/belt states read via the mottle); extent parity vs the jittered-ico fallback envelope; assetGlbs/assetPerf audit 18 slots, count unchanged); ST-245 arena ring v2 + world presentation (Blender arena_ring.glb v2: 2 nodes - VR_ArenaRing outer band (24 plates, unit radius 1.0) + VR_ArenaRing_Ticks inner radial tick accent (unit radius, flat XZ, +Y normals, no vertex colors); total <=120 tris, <=4 KB raw; arenaRing.js two-mesh render - outer unchanged (0x4a6cff op 0.55), ticks = brighter basic mat crossing the 0.72 bloom threshold = the intended neon accent (band luma stays below); +1 bounded draw call; y-offsets no z-fight; static (reduced-motion safe); test pin update (exactly 48 -> two-node counts, documented); frame probe delta ~0; bloom A/B FX high (ticks bloom) / low+off (no bloom)); ST-246 E17 regression round + G17.0 gate + closeout (I241/I246/I251 template; demo pin EXACT via real UI = headline; log audit 1..255).
- Depends on: E16 closed (I251); E9 GLB pipeline + assetPerf audits; I209 COLOR_0 contract (matGold/matBelt consume it); I212 arena ring pipeline (unit radius, scale 26, y 0.03); I244/I248 in-code-material hero-pass pattern; I246 ACES tone pipeline (bloom threshold 0.72 context); Blender 5.2.3 MCP.
- Gate G17.0: asteroid GLB 18/18 + extent parity + class A/B (L/M/S side-by-side) + golden/shielded/belt live checks + NET NEGATIVE raw size vs I251 (L 37.66 KB); ring v2 2-node GLB + two-mesh render + +1 bounded draw call + frame probe delta ~0 + bloom band A/B; demo pin EXACT via real UI (2169/2220, 11334, 57, 36.15, wave 2); fresh tests + build + dist in budget (headroom >= 8 KB gzip after the story); regression green; log audit sequential 1..255.
- Scope check: production/scope-check-E17.md (I252, APPROVED with cut option, deferrals, risks R-E17-1..4).
- Result: CLOSED at I255 (G17.0 gate PASS - 3/3 stories ST-244..246 done at I253..I255; regression-round finding: the adaptive FX desync - a stored 'off'/'low' FX tier overridden by the phantom-high-boot auto-downgrade - found + fixed, R-E17-5).

## E17 Risk Register
- R-E17-1 (med) asteroid v3 breaks the golden/shielded/belt reads (COLOR_0 consumed by matGold/matBelt - the I209 contract) -> vertexColors:true kept, mottle baked in the same I209 clamp band (0.45..1.2, identity-safe), extent parity vs the jittered-ico fallback envelope, live A/B of golden + shielded + belt rocks at ST-244. [I253 RESOLVED: COLOR_0 = POINT-domain FLOAT, mottle + rim brighten baked in the I209 band 0.45..1.2 (colR L [0.450,0.945]/M [0.450,0.938]/S [0.550,1.152]); live A/B PASS golden S #ffa018@1.6 + belt M #2f6fd0@0.58 + shielded L shell child, in-code vertexColors:true palette intact, extent parity vs the fallback envelope held.]
- R-E17-2 (low) demo pin drift -> BY LAYER (render/asset only; no core sim/scoring/replay-data; I217/I235/I240/I244/I248 precedent); real-UI re-verify at ST-246; no daily salt bump. [I255 RESOLVED: demo pin re-verified EXACT via real UI at ST-246 (idx 2169/2220 x4, 11334/57/W2/maxCombo 15/shots 57-198 (29%)/0:36); best 36426 unchanged - a watched demo never writes scoreboards; no daily salt bump taken.]
- R-E17-3 (low) gzip budget (10.9 KB at open) -> asteroid rebuild NET NEGATIVE raw (L 37.66 KB outlier; lean export + class decimate), ring v2 <= 4 KB raw; floor >= 8 KB after every story. [I255 RESOLVED: closeout dist 113 files 1991.1 raw / 533.5 gz6 KB - headroom 57.5 raw / 16.5 gz >= 8; asteroid rebuild NET -44.3 KB raw, ring v2 -752 B vs v1.]
- R-E17-4 (low) ring v2 test pin change (exactly 48 -> two-node counts) + +1 draw call -> pin updates intentional with evidence in the iteration log; frame probe delta ~0; bloom-safe bands verified (ticks cross 0.72 = the intended accent; band luma below). [I254 RESOLVED: two-node GLB 60 tris / 4032 B <= 4096 (v1 4784 B -> -752 B for +12 tris); pin rewritten to EXACTLY 60 (band 48 + ticks 12) + per-primitive flat / +Y / radius checks (new primStats) + indexed face loop (idxAcc) - update intentional with evidence in the iteration log; +1 bounded draw call verified (+1 scene call / +12 tris hidden->shown; bloom mirror +2 / +24 expected) - frame delta ~0; bloom A/B PASS (tick luma 210 both states, halo only at FX high; band below threshold in both).]
- R-E17-5 (low) [FOUND AT I255 BY THE REGRESSION SWEEP - pre-existing, not an E17 regression] the adaptive auto-downgrade overrode a stored 'off'/'low' FX tier: createAdaptiveQuality booted its ladder at a phantom 'high' (userSet never called at boot), so a low-FPS device silently flipped the user's FX off to low (fxCount 0 -> 16) - contradicts the ST-225 stored-choice intent. [I255 CLOSED: boot-tier reconciliation (initialTier param, default 'high' for 2-arg callers; userLocked = bootTier!=='high'; reset() restores the boot tier) + main.js passes liveSettings.fx; live-verified (off boots off and survives 20 starved frames; strict zero-leak kill 0/0 + pickup floor exactly 8); +6 tests -> 771/771.]

## E18 World Material & Contrast Arc (ST-247..250)
- Context: E17 closed at I255 (G17.0 PASS). E18 = the next art arc from the user standing suggestion, scoped from a live in-game screenshot at I256 (.evidence/I256/02_ingame_w1.png): the E17 v3 asteroid family reads as ICY PERIWINKLE / ice cubes, not warm rock - the most-seen geometry in the game (rock pool 29, cap 24) is in the wrong material family. Two-lever cause: the I253 COLOR_0 bake is too pale / low value-contrast, and the scene lighting is a strong cool wash (AmbientLight 0x8899ff @0.35 + Hemisphere 0x33437a @0.55) under one white directional. Consequence: once the rocks go warm, the neon accent language (player bullets, explosions, pickups) gets a harmony pass (ST-248) and the pickup / golden / belt reads get a post-palette audit (ST-249). Kill feedback is NOT re-opened: rocks are one-shot and killPunch.js documents the deliberate no-per-kill-flash rule (bullet-hell readability, design/art-direction-research.md lever 4). All render/asset layer only: no core sim / scoring / replay-data changes (demo pin structurally untouched BY LAYER); no daily salt bump. YouTube grounding (I256, 5 queries / 49 unique): GMTK game-feel (validates the existing punch-only kill hierarchy), Riot VFX (thematic cohesion), TIMBER (color/shape readability), StayAtHomeDev (retro camera juice - already shipped), ZeroVector (neon tracer language), Solaroids (parallax - already covered).
- Scope: 3 stories ST-247..249 (I257..I259) + ST-250 regression / G18.0 / closeout (I260). Docs-only open at I256.
- Result: PENDING (stories ST-247..250 scheduled I257..I260).
- Risks: R-E18-1 (med) light rebalance shifts a protected bloom band (ticks / cockpit / boss core / belt / pickups cross 0.72 by design) -> ST-247 ships the before/after bloom-band audit table + golden/belt live re-verify. (RESOLVED at I257 - bloom-band audit: rock faces dluma <= 0.1 HIGH vs OFF (zero bloom, under 183.6), tick core 228.0/208.1 the only over-threshold accent; cockpit/boss-core/belt/pickup materials structurally unchanged). R-E18-2 (low) demo pin drift -> BY LAYER (I217/I235/I240/I244/I248/I253/I254 precedent); real-UI re-verify at ST-250; no salt bump. R-E18-3 (low) GLB size -> COLOR_0 rebake only, net-zero raw vs v3; floor >= 8 after every story. R-E18-4 (low) bullet color change reduces FX-off bullet-vs-background contrast -> ST-248 keeps the ST-177 readability floor, verified in-browser.
