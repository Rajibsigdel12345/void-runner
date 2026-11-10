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

## E10 Post-E9 Polish (ST-218..220)
- Context: E9 closed at I218 (G9.1 PASS). E10 is a SMALL polish milestone: finish the last procedural enemy model in Blender (Warden), land the last unowned art-research lever (camera/feel, lever 6), then regression + gate. No new content, no new dependencies, no core determinism changes (camera is render-layer).
- Stories: ST-218 Warden Blender model (jagged armored sentinel, separate armor-plate mesh so the armor-state animation carries over; 2 draw calls; budgets <=200 tris / <=40 KB / <=3 mats; procedural fallback preserved); ST-219 camera/feel (2-5% aim-lead eased + capped, boss-approach zoom-out a few degrees, slow menu orbit drift, view fixed during normal play, motion-gated); ST-220 E10 regression round + G10.0 gate + closeout docs.
- Depends on: E9 closed (I218); GLB pipeline + assetPerf test pattern (E9).
- Gate G10.0: 16 GLBs load (15 + Warden), Warden armor-state animation intact (screenshot-compare armored/spent), camera deltas subtle + stable-view verified (scripted pilot parity), fresh tests + build + dist in budget, log audit sequential, regression round green.
- Scope check: production/scope-check-E10.md (I219, APPROVED with cuts/deferrals/risks R-E10-1..3).

## E10 Risk Register
- R-E10-1 (low) Warden GLB breaks the armor-state visual -> armor plate as separate node driven by the existing wardenMesh.js animation; screenshot-compare both states in smoke.
- R-E10-2 (low) camera lead hurts dodge read -> cap 2-5%, eased both ways, A/B screenshots + scripted-pilot parity (no core change).
- R-E10-3 (low) dist creep (+1 GLB vs ~48.1 KB gzip headroom) -> per-file budget pattern extended to 16 assets in assetPerf.test.js.