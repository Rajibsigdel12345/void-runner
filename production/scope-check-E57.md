# Scope Check - E57: Camera Consistency + Modes, Enemy Fleet Expansion, Linear Campaign Stages
- opened: 2026-11-16 (I444, post-E56; user directive verbatim: camera angle improvement so the view is consistent wherever the ship moves + first-person view + more enemies + YouTube research on enemy visuals/art direction + linear game with level design, moving through space, clearing levels, boss at the end)
- source of truth for E57 (ST-414..422). E56 CLOSED at I443.

## Goal
Three player-requested arcs, one epic, step by step:
1. CAMERA - the view must stay the same angle wherever the ship moves, and the player must be able to see the way back (behind). Add a FIRST-PERSON (cockpit) view if possible.
2. ENEMIES - "add enemies and stuff": the fleet grows with 2 new archetypes (Blender-made assets per the project direction), art-directed from research.
3. LINEAR CAMPAIGN - a linear game: move through space, clear stages (levels), boss at the end of each stage, then the next stage.

## Grounding (measured, 2026-11-16)
- Current camera (src/main.js ~L1040-1063): low oblique CHASE rig. cam = (ship.x, 9, ship.y+13) i.e. 9 up / 13 behind in world +Y, FIXED world angle (never rotates with ship heading); look target = ship pos + forward*lookAhead on the plane (lookAhead 4 + 2*speedFrac, aim-lead 3% capped 1.2); exponential damp 5 (pos) / 6 (look); FOV 60 + 4*speedFrac (+kick, +boss zoom 2.5 within 14u). MENU = orbit hero framing (separate path).
- Arena radius 26 (CONFIG.arena.radius). At ship.y = +20 (inside the arena) the chase camera sits at y = 33 - OUTSIDE the arena rim; the arena half behind the ship is off-frame. This is the measured root cause of "goes very far, cannot see all the way back".
- Existing enemy roster (core, all procedural meshes): mines ST-054 (slow homing), vortex ST-059 (pull field), warden ST-136 (armored mini-boss), drones ST-117 (fast seekers), stinger ST-229 (telegraphed dash rammer, wave 7+), flyer ST-232 (evasive skill target, wave 9+). Boss: monolith every 5 waves, 2-phase + radial burst, telegraphs (CONFIG.boss full table). So "add enemies" is grounded as FLEET EXPANSION (new archetypes), not first enemies.
- No stage/mode concept exists (CONFIG.stages/modes absent). State machine MENU->PLAYING->PAUSED->GAME_OVER->PLAYING + REPLAY branch (ST-190). Waves are a single endless timeline (WaveDirector + adaptive director ST-304, wave-start-only, monotone envelope).
- Session keys in use: Enter/Space/Esc/P/R/Q/O/M/F/N/1/2/3. V is FREE (camera mode hotkey).
- Asset budget state (E56 close): 5 Blender GLBs (ship/astL/astM/astS/boss) + 19 procedural = 24 GLB files total; total GLB tris 19,736 / cap 20,000 (headroom 264 - THIN); dist 2,407,614 B / ceiling 2,700,000 (headroom 292,386; floor 102,400); perFileMats cap 3.
- Playframe pins (I443): L 21/12,654 / P 10/180 / B 50/27,654 (probe-only, .evidence/I443/playframe443.mjs). Camera changes and new spawnable enemies can move frustum-visible tri counts -> re-measure + decompose at G57.0 (ST-422), never assume.
- Causal pin p1 (seed 9876, ends wave 2 / 36.15s) is BEFORE any new-enemy gate (wave 6+) and camera is presentation-only -> expect zero drift; verify at G57.0.

## Research (UNVERIFIED-BY-PLAY unless measured)
Camera (web, mechanics):
- GDC05 "Fundamentals of Real-Time Camera Design" (Haigh & Hutchinson): action genres want elevated position for environment view; look-ahead of the character; motion+orientation lag for a "loose" feel; do not focus directly on the moving player.
- Supagames "The Camera Is a Game Mechanic" (three.js): chase rig = local offset + look target stored separately; look target ahead (base + speed-scaled); frame-rate-independent exp damping (1-exp(-rate*dt), different rates pos vs look); "what mistake should the player avoid because the camera showed it early enough?" is the design question.
- Cinemachine practice guide: dead zone (slack) + damping (fast action ~0.5s) + lookahead (0.2-0.5, smoothed) + Confiner = clamp the VIEW to the level so the void is never shown past the stage edge.
- Scroll Back / Pac-Land principle: tying the camera to the player with forward focus must leave room to track threats from behind; auto-scroll games balance ahead-threats vs behind-threats deliberately.
- Signals & Light: chase cameras make off-screen threats a design problem; arena combat needs the player to be able to re-acquire what is behind.
Decision: keep chase as default but (a) reduce the look-ahead bias so the ship sits more centered and more of the behind-arena stays in frame, (b) EDGE-AWARE DOLLY - as the ship nears the arena rim the camera dollies up+back so the rim is never the frame edge (Confiner principle, continuous), (c) add OVERVIEW mode (fixed, whole-arena, literally the same view wherever the ship moves) and COCKPIT mode (first-person) as player-selectable.
Enemy art + stages (YouTube):
- ontcnH1b_vI "Star Fox 64 Retrospective" (stage structure): 16 stages, each playthrough visits a subset, each stage ends in a boss (Corneria->Venom arc); vDLrhwZCQhM (Goras boss #5) = end-of-stage boss rhythm.
- qV3UQ69mHQM "EVERSPACE first look": genre visual reference - 3D arcade fleet, glowing engine/core accents on dark hulls, bold readable silhouettes at distance.
- 27RBOb2MQho "Creating an Enemy Drone Ship in Blender" + UWHp6GNt9gI "Our First Enemy Ship made in Blender": low-poly enemy design language - bold primary shape first, minimal surface detail, silver/dark hull + 1-2 accent materials, readable from a silhouette at play distance.
- QoNukqpolS8 "Godot 4 space shooter": enemy spawn pacing (types gate in on later waves - matches this project's existing wave-gate pattern stinger w7+/flyer w9+).

## Scope fit
FITS as one epic, 9 stories, delivered in 4 arcs (camera -> enemies -> campaign -> assets+gate). All additive; endless mode stays bit-identical (structural: new gates are wave 6+, camera is presentation, campaign is an opt-in mode).

## Stories (ST-414..422)
- ST-414 (I444): OPEN E57 - this scope check + epic block + stories + 7 docs. DOCS-only. [this iteration]
- ST-415 (I445): Camera consistency (CHASE improved): new pure module src/core/cameraModel.js (edge-aware dolly: offset = base + smoothstep(dist/arenaR)*dolly; look-ahead retune; mode-agnostic math, DOM-free) + main.js integration + CONFIG.camera additions + unit tests. Acceptance: ship's screen-space offset invariant at 3 arena positions (center/near-rim/rim) - headless render probe; view at rim keeps arena center in frame; causal pin zero; npm test green.
- ST-416 (I446): Camera modes - OVERVIEW (fixed above arena center, whole-arena framing, same view angle wherever the ship moves) + COCKPIT (first-person: camera at cockpit, heading-aligned, FOV speed kick, ship hidden, reticle emphasized). V cycles CHASE->OVERVIEW->COCKPIT->CHASE; settings panel entry; persisted; RM (reduced motion) gates cockpit speed-FOV kick; unit tests (pure target math) + headless view probes (3 modes x 3 positions, screenshots viewed).
- ST-417 (I447): Enemy visual language + campaign design docs: design/enemy-visual-language.md (per-role silhouette/color/material budget from research; HUNTER = rear-approach stalker, GUNSHIP = slow heavy bomber; 2-3 materials each, bold silhouettes, accent glow) + design/campaign-stages.md (3 stages x 5 waves; stage N boss = monolith variant (name/rim color/hp/attack re-tune); stage-clear -> warp transition -> next stage arena theme (procedural tints: skybox/starfield/floor/grid); VICTORY after stage 3 final boss = GAME_OVER + victory flag (NO new state machine state); ENDLESS mode = current timeline unchanged; campaign = named slice of the same deterministic timeline waves 1..15; stage = ceil((wave-1)/5)). DOCS-only.
- ST-418 (I448): HUNTER + GUNSHIP core (src/core/hunter.js + src/core/gunship.js, DOM/three-free, seeded RNG): HUNTER = orbits to a rear bearing then dash-attacks (telegraphed, dodgeable - pairs with the camera fix); GUNSHIP = slow, high HP, lobbed heavy shots + chaff popups on death. Wave-gated spawns in WaveDirector (HUNTER wave 6+, GUNSHIP wave 8+; endless timeline = existing waves, so no endless change before wave 6 = causal-safe). CONFIG additions. Unit tests (deterministic seeds).
- ST-419 (I449): Campaign core (src/core/stages.js, DOM-free): stage table from CONFIG.stages, stageForWave, bossVariantForStage, stageClearAt (boss kill on wave 5/10/15), victory flag after stage 3, per-stage theme tokens + menu mode (campaign|endless) selection state; game.js integration (stage banner trigger, warp sub-sequence = deterministic 1.6s frozen-sim timer, per-stage arena tint application point in main.js, boss variant config injection, victory flag into GAME_OVER screen + score save). Unit tests (stage math + sequence, deterministic).
- ST-420 (I450): Campaign render/wiring: menu CAMPAIGN/ENDLESS buttons (screens.js; Enter keeps default mode = ENDLESS for causal safety, button selects), stage banner (waveBanner.js extension: "STAGE 2 - <name>"), warp transition FX (particles/vortex reuse, sim frozen, deterministic), per-stage arena theme tints (skybox.js/starfield.js/floorGrid.js/floorDisc.js read stage theme), boss variant visual (rim color + name in bossHealth.js), GAME_OVER victory variant. Headless view probes (stage transition + 3 themes + variant boss screenshots viewed).
- ST-421 (I451): Blender enemy assets - assets/enemy_hunter.glb + assets/enemy_gunship.glb per design/enemy-visual-language.md (sweet ~1,200-2,000 t each, cap 2,400; <=3 materials, VR_ naming, no rig/UV, single root, Y-up) loaded via assetLoader.js with the ST-418 procedural meshes as fallback; CG A/B clay + in-game tint gates (old procedural vs new GLB) with rollback to procedural if not clearly better. RE-PINS (explicit, measured): exactly-24-GLBs -> 26; assetPerf totalTris 20,000 -> 26,000; perFileMats unchanged (3); MAX_FILE_BYTES 393,216 unchanged (files ~20-60 KB).
- ST-422 (I452): Fresh R1-R5 + G57.0 gate + close E57 (cgs-regression-suite + cgs-gate-check + cgs-milestone-review; probe-only, zero src).

## Re-pins (pre-registered, never silent)
- exactly-24-GLBs -> 26 (ST-421; the 5-Blender-GLB roster in AGENTS.md becomes 7 - doc-drift note refreshed at close).
- assetPerf totalTris 20,000 -> 26,000 (ST-421, measured actual; perFileKB 400 / totalFilesKB 768 / totalGeoKB 700 unchanged unless measured higher).
- playframe L 21/12,654 + B 50/27,654 WILL MOVE (camera mode probes + new enemies in later waves are not in the p1 frame, but the edge-dolly chase change alters frustum-visible tri counts at the probe ship position) -> re-measure + decompose at ST-422. P 10/180, causal p1 seed 9876, rockab 2.2/1.3/0.7, PWA 11/11 expect ZERO.
- dist ceiling 2,700,000 B: +2 GLBs (~40-120 KB total) -> headroom stays >= 102,400 B floor; re-verify at ST-422 (NO ceiling change expected).
- vendor sha r160 76DEA8151BC9352A UNCHANGED (no vendor updates in E57).

## Cut option (pre-registered)
- ST-416 COCKPIT sub-cut: if the cockpit view fights the reticle/HUD, ship OVERVIEW + improved CHASE only and defer cockpit (docs note). OVERVIEW is the load-bearing "same view angle" answer; CHASE dolly is non-cuttable (core ask).
- ST-418 CUTTABLE: GUNSHIP deferrable (HUNTER stays - it pairs with the camera arc); both new enemies' GLB step (ST-421) cuttable down to procedural-only (core behavior already ships).
- ST-419/420: stage THEMES (tints) cuttable to stage 1 theme only if tight; stage structure + boss variants + victory non-cuttable (the linear ask).

## Deferrals (carried)
- True between-arena travel (rail/flight corridor a la Star Fox) - the arena persists; "moving through space" is delivered as warp transitions + themed sectors. (User: step by step; rail = future epic if wanted.)
- Unique new boss MODELS per stage (re-skin/re-tune monolith instead).
- Standing: WebGPU migration epic / S rock remaster / UV craters / i18n+touch / per-hit impact SFX.

## Risks
- Camera change moves frustum-culled playframe pins -> decompose, never assume (pattern .evidence/I443/).
- Campaign must not drift endless causality -> structural gates (wave 6+ / opt-in mode) + p1 re-run at G57.0.
- New enemies add draw calls -> assetPerf + playframe re-measure at gate; pools reused (bulletPool/particles patterns).
- Cockpit mode + reduced motion: gate the speed-FOV kick and shake offset under RM (motionOff plumbing exists in main.js).
- Key collision: V verified free (input audit 2026-11-16).

## Verification evidence (this iteration)
- Key audit + config/roster/camera grounding above (measured from src, 2026-11-16).
- Quality bar at close of I444: npm test (972 expected) + build 0 + dist 2,407,614 B byte-identical (docs-only).

ST-415 (I445, cgs-dev-story; src + tests + probes, .evidence/I445/):
- src: NEW src/core/cameraModel.js (pure core, DOM/three-free: clamp01/smoothstep01/dollyFactor/chaseTargets/projectNdc) + config.js (lookAhead 4->2.6; camHeight 9 + camBack 13; dolly { startFrac 0.55 / rimScale 1.7 / pow 2 }) + main.js camera block calls chaseTargets + tests/cameraModel.test.js (9 tests, real CONFIG import).
- Design refinement (documented): pre-registered ADDITIVE dolly base(9,13)+e*(6,10) implemented as UNIFORM-SCALE s(t)=1+(rimScale-1)*smoothstep(clamp01((t-startFrac)/(1-startFrac)))^pow (multiplies height+back-offset+look-ahead) - the only form keeping the ship screen-space offset a strict invariant (unit-verified 1e-9).
- npm test 981/981 (972+9) + build 0 + dist 2,408,956 B / 139 (was 2,407,614/138; headroom 291,044).
- Playframe445: Part A EXACT unchanged (L 21/12,654 + P 10/180) / Part B 50/27,654 UNCHANGED (pre-registered B move did not materialize - frustum culling puts exactly 1 L rock in the frozen plain frame; measured, pin stays) / Part C ST-415 acceptance 3 positions (center/nearRim/rimN, fixed south, PAUSED 2500ms, reseed 71202) 16/16 PASS - live->chaseTargets max|dev| 5.5e-5 (tol 0.05); s=1/1.28209/1.7; ship NDC identical within ~7e-7; ndcY -0.142812 at rest/south; arena center in frame at all (worst |NDC| 0.37880 rimN/south); shake 0; fov 60; console 0/0; no NaN; 3 screenshots viewed (ship framed identically; whole arena visible behind at rim = behind-blindness fixed).
- Causal445 p1 EXACT + radii 2.2/1.3/0.7 EXACT = zero drift (camera presentation-only).
- Vendor unmodified + sha 76DEA8151BC9352A PIN_OK; hygiene (ports 5173/4173/5199 free, chrome 0).

ST-416 (I446, cgs-dev-story; src + tests + probes, .evidence/I446/):
- src: src/core/cameraModel.js (append overviewTargets/cockpitTargets, pure core) + config.js (camera overview/cockpit constants) + reticle.js (emphasized) + main.js (camMode + V hotkey + 2 camera-target branches + cockpit FOV kick (RM-gated) + ship hide + reticle sync + __vr.camMode) + settingsPanel.js (camera-mode select) + storage.js (cameraMode + read-back fix) + strings.js (3 locales) + tests (cameraModel +3, storage +1).
- Design: OVERVIEW ship-independent fixed cam(0,56,20) look(0,0,0) - whole r=26 arena framed identically wherever the ship is (worst rim-point NDC 0.8362 @16:9/fov60, numerically pre-verified with the real projectNdc). COCKPIT first-person seat cam = p - fwd*0.55 at eye 1.15, look = p + fwd*60 on y=0; ship hidden; reticle emphasized 0.95; +9 FOV speed kick RM-gated. V cycles CHASE->OVERVIEW->COCKPIT->CHASE (persisted + panel + toast).
- Probe-caught + FIXED a REAL storage bug: getSettings() never read cameraMode back from persisted storage -> any later setSettings() silently reset the mode to 'chase'. Fixed + no-clobber-across-other-settings regression test.
- npm test 985/985 (981 + 3 camera + 1 storage) + build 0 + dist 2,411,901 B / 139 (was 2,408,956; headroom 288,099).
- Playframe446 21/21: Part A EXACT unchanged (L 21/12,654 + P 10/180) / Part B 50/27,654 UNCHANGED / Part C 3 modes x 3 positions PAUSED: 9/9 conv < 0.00005; OVERVIEW fixed target at ALL 3 positions (ship-independent) + live worstRim 0.8362; COCKPIT ship hidden + reticle 0.95; CHASE ship visible + reticle 0.35; per-mode persisted == live; shake 0; fov 60; no NaN; console 0/0; 9 screenshots viewed. Part D RM gate: V to COCKPIT + ship.vel=(maxSpeed,0), fovKick 72.99; RM checkbox click, fovRM 64.01; delta 8.98 ~= 9 (measured, RM-gated).
- Causal446 p1 EXACT + radii 2.2/1.3/0.7 EXACT = zero drift (camera presentation-only).
- Vendor unmodified + sha 76DEA8151BC9352A PIN_OK; hygiene (ports 5173/4173/5199 free, chrome 0).

ST-417 (I447, cgs-reverse-document + cgs-design-system; DOCS-only, zero src):
- design/enemy-visual-language.md (9,841 B): fleet visual audit (luma ladder stinger 135 > drone 131 > flyer ~110; purple Monolith / teal Splicer / threat red 0xff4a2a / payload 0xff9a3d / gold rock) + 10 system rules (one hue per role; 96px silhouette incl. BACK view; <=3 materials; accent encodes function; overview 56u + cockpit readability; reduced-motion; GLB contract single-root / Y-up / neutral COLOR_0 / 1,200-2,000 tris cap 2,400 / VR_ naming; HUNTER r 0.8 GUNSHIP r 1.6; mandatory procedural fallback) + role specs (HUNTER wave 6+ rust 0x9c5a46 swept manta + W fins + threat red telegraph; GUNSHIP wave 8+ gunmetal 0x39424e bulky hull + nacelles + payload bay 0xff9a3d) + 7 acceptance gates for ST-418/421 (ladder audit; 96px silhouette; overview read; telegraph reaction floor; GLB contract + re-pins; A/B rollback; fallback).
- design/campaign-stages.md (11,369 B): reverse-doc observed behavior + evidence paths (timeline; gates; boss alternation; breather; endless curve; state machine; arena render stack) + spec (stageForWave ceil((w-1)/5); 3 stages; stage-end boss (stage 3 Monolith Prime PROPOSED: gold rim 0xffc94d, hp 88, phase-2 0.6, burst.every 3.2, split 5 M, TTK <= ~15s); 1.6s deterministic warp sub-sequence (no RNG draws); themes (stage 1 = identity default HARD); VICTORY flag on GAME_OVER payload, NO new state; endless invariants (Enter = default endless; zero RNG/spawn changes)) + 6 acceptance tests + open decisions (stage-2 boss identity a/b; skybox tint mechanism; stage-3 numbers in ST-419 CONFIG.stages).
- npm test 985/985 + build 0 + dist byte-identical 2,411,901 B / 139 (docs-only, zero src).
- Vendor unmodified + sha 76DEA8151BC9352A PIN_OK; hygiene (ports 5173/4173/5199 free, chrome 0).

## Next owner or decision
ST-415 (I445): DONE at I445 - uniform-scale dolly, 981/981 + Part C 3-position acceptance PASS + causal p1 zero (details above).
ST-416 (I446): DONE at I446 - OVERVIEW (fixed whole-arena 3/4, ship-independent, worst rim NDC 0.8362) + COCKPIT (first-person seat; RM-gated +9 FOV speed kick; ship hidden, reticle emphasized) on V hotkey CHASE->OVERVIEW->COCKPIT->CHASE (persisted, panel select, i18n en/zh/ja) + probe-caught storage read-back bug fixed; 985/985 + Playframe446 21/21 (details above).
ST-417 (I447): DONE at I447 - design/enemy-visual-language.md (9,841 B) + design/campaign-stages.md (11,369 B); DOCS-only; 985/985 + build 0 + dist byte-identical 2,411,901 B / 139 (details above).
ST-418 (I448): HUNTER + GUNSHIP core (cgs-dev-story; src/core/hunter.js + src/core/gunship.js, DOM/three-free, seeded RNG; HUNTER wave 6+ rear-approach dash (telegraphed, dodgeable); GUNSHIP wave 8+ slow high-HP lobbed shots + chaff popups on death; WaveDirector gates + CONFIG + unit tests). Consumes design/enemy-visual-language.md sections 2-3.
