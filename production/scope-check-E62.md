# E62 Scope Check - Camera far-distance usability + first-person cockpit polish

Status: OPENED I474 (docs-only; zero src). Research-first per user queue.

## User request (verbatim, from the queue)

"i want some improvement on the camera angles when the player goes to the very far
it cannot see all the way back can it not be like same view angle wherever the ship
moves ... and if possible can you add first person view as well."

## Pre-work findings (evidence, measured in this repo)

1. The chase "same view angle wherever the ship moves" property is ALREADY implemented:
   ST-415 (I445) edge-aware dolly in src/core/cameraModel.js. The chase offset
   (height, dolly-back) and look-ahead scale by one uniform factor s(t) =
   1 + (rimScale-1)*smoothstep(...)^pow, t = dist/arenaR. Because all three lengths
   scale by the same s, the camera->ship and camera->look ray angles are EXACTLY
   invariant with position: the ship keeps the same screen-space offset and the
   camera keeps the same view angle wherever the ship moves. Identity (bit-identical
   legacy framing) at center (t <= dolly.startFrac). This was itself the fix for the
   user's original far-rim report (see the module header comment, citing I444).
2. The property is PINNED: cam473 (I473) 3x3 grid - CHASE expected values match the
   pure model to < 4e-3 at center/nearRim/rimN; OVERVIEW fixed target (0,56,20)->(0,0,0)
   at ALL 3 positions with live worst rim NDC 0.8362 (<= 0.85 gate) consistent across
   positions (max diff < 0.02).
3. FIRST-PERSON COCKPIT already exists: ST-416 (I446). V hotkey cycles
   CHASE -> OVERVIEW -> COCKPIT -> CHASE (persisted via storage; settings panel
   select too). Eye 1.15, setback 0.55 behind ship center, look 60 ahead on the
   arena plane, FOV 60 + 9*speedFrac (motion-gated seat kick). Ship hidden,
   reticle 0.95 opacity.
4. So E62 is NOT "build a camera" - it is the research-grounded USABILITY pass:
   verify the invariance claim for the user's exact scenario, close the discovery
   gap, and polish the cockpit against genre references.

## Real gaps found (this session, file-cited)

G1 DISCOVERABILITY: the MENU controls card (src/render/screens.js:96) lists
   WASD/arrows, mouse, click/space, P/ESC, M, F, N - the V camera-mode key is NOT
   documented anywhere on the menu or in the tutorial. The only other surface is the
   settings panel select. A user cannot learn the mode exists without digging.
G2 NO SWITCH FEEDBACK: pressing V changes the rig silently (only the camera motion
   reveals it). No HUD indication of the active mode.
G3 COCKPIT ORIENTATION BLINDNESS: in cockpit view the world behind/beside the ship
   is invisible (inherent to 1P). No bearing/attitude aid exists.
G4 COCKPIT SPEED LOOK-AHEAD: cockpitTargets uses a FIXED look-ahead (60) at all
   speeds, while the chase rig already scales look-ahead with speed
   (lookAhead + lookAheadSpeed*spdFrac). At full speed the cockpit sees the least
   of what is coming.

## Research base (labeled; fetched this session via web search; youtube MCP not
exposed in this session - equivalent sources used instead)

S1 supagamesai.com/learn/threejs-camera-as-game-mechanic - chase rig relative to the
   controlled object; look-ahead 2 + speed*0.08 pattern; "looking farther ahead at
   speed reveals more track"; speed composition = look-ahead + controlled distance
   increase + modest FOV widen; any one pushed too far becomes uncomfortable.
S2 moonjump.com third-person camera systems - exponential damping
   (1 - exp(-k*dt)) for frame-rate-independent smoothness; look-ahead 2-3 m in the
   velocity direction, smoothly interpolated; context-sensitive parameter sets
   blended over a fraction of a second.
S3 uhiyama-lab.com Cinemachine follow tuning - feel = Dead Zone + Damping +
   Lookahead; lookahead time 0.2-0.5 with smoothing; "judge by how tired your eyes
   are after 10 seconds of play".
S4 ea.com "The Making of VR" (Squadrons) - reticle projected on a plane that snaps
   to the closest object behind it and resizes to keep relative size constant
   (eliminates focus mismatch); 3P vs 1P view tradeoff is a balancing decision -
   arcade context: both views are legitimate options, no fairness constraint.
S5 Wing Commander WCP HUD bible - very small persistent center reticle; per-weapon
   reticles; cockpit frames small + low occlusion ("help project the idea that the
   player is flying something other than a monitor"); rear-view awareness aids.
S6 Star Fox (original) manual - three viewpoints (APPROACH / STANDARD / COCKPIT);
   "Marks on the side and bottom of your screen will show the orientation of your
   ship in the COCKPIT view" - the genre's canonical cockpit orientation aid.
S7 GameSpot Star Fox Zero review - 1P/3P perspective switches are "jarring" and
   "difficult to find your bearings the first few times"; transitions and
   re-orientation are the failure mode to design against.
S8 GameDev.net cockpit-as-1P thread - for a NON-slewable cockpit a 2D UI (pre-rendered
   frame or HUD) is sufficient; model only what the camera can see; a full 3D
   interior is only worth it for a slewable view.
S9 Metroid Prime UI breakdown (Medium) - diegetic HUD motion (blur/judder on action)
   sells first-person physics - background context only.
S10 UE tech blog "Six Ingredients for a Dynamic Third Person Camera" - context-
   sensitive dynamic properties (FOV, distance, angle); always let the player
   override; "50 Camera Mistakes in Journey" (John Nesky) as the canonical talk.

Research -> design mapping:
- G1/G2 <- S7 (re-orientation), S5 (visible cockpit state), S10 (player override).
- G3 <- S6 (orientation marks in cockpit view), S5 (low-occlusion frame), S8
  (2D UI sufficient - no 3D cockpit model needed; keeps the frozen-asset contract
  and the dist budget intact).
- G4 <- S1 (speed look-ahead), S2 (interpolated lead), S3 (feel = damping + lead).

## Scope (5 stories, bounded; pure math + 2D canvas + i18n; NO Blender work -
no 3D asset changes by design, per S8)

ST-441 OPEN E62 (this iteration, docs-only): this file + epic + stories.
ST-442 Discoverability: MENU controls card gains a V row ("camera view") in all 3
   locales (src/core/strings.js en/zh/ja, parity-checked by tests/strings.test.js);
   one-shot first-run tutorial hint naming the key (tutorialOverlay pattern, storage
   flag so it fires once per profile).
ST-443 Mode feedback: one pooled DOM chip, top-center, fades ~1.2 s on camera-mode
   change (V or settings panel); MENU status line (menu.status_line) shows the
   current mode so it is always visible pre-run; opacity-only (reduced-motion safe);
   no per-press DOM creation.
ST-444 Cockpit usability: (a) pure-model speed look-ahead - cockpitTargets gains
   look-ahead += cockpitLookSpeed*spdFrac (config, damped by the existing look
   damper; unit-tested at spd 0/0.5/1); (b) cockpit-only 2D canvas bearing strip
   (procedural, no assets): bottom arc with the ship heading tick, a CENTER marker
   (bearing to arena center) and a RIM marker (bearing to the nearest rim point) -
   the S6-style orientation aid, S7's re-orientation guard. Shown in cockpit mode
   only, fades in/out with the mode, i18n-free geometry (no strings).
ST-445 G62.0 close gate: fresh causal 18/18 + playframe (re-pin ONLY if the 3D
   scene changed - pre-registered: the bearing strip is 2D DOM, the cockpit
   look-ahead is zero at rest, so A 22/17,397 + 11/180 / B 52/38,560 must hold
   EXACT; a re-pin is a finding) + cam matrix re-run (pre-registered: rest-speed
   expected values unchanged by (a)) + ship/enemy hero views cited + PWA 11/11 +
   quality bar + bookkeeping + commit.

## Cut option (if pressure appears)

Cut ST-444(b) the bearing strip (the most novel piece). E62 still fully answers
the user request: invariance verified + documented, modes discoverable, cockpit
speed look-ahead in.

## Deferral (out of scope, with reasons)

- 3D cockpit interior model (Blender): only pays for a SLEWABLE view (S8); our
  cockpit is fixed-aim (mouse aims the weapon, not the view) - deferred indefinitely.
- Reticle snap-to-target-distance (S4): VR focus-fatigue countermeasure; overkill
  for a 2.5D arcade reticle.
- Slewable free-look in cockpit: out of genre (the ship, not the camera, is the
  control object - S10 "player override" is already satisfied by the 3-mode cycle).
- Chase cam rework: NONE - the uniform-scale dolly already makes the view angle
  strictly invariant (finding 1); re-verifying it (ST-445) is the work, not
  rebuilding it.

## Risks

R1 ST-444(a) moves the cockpit look target at speed>0 -> cam-matrix expected values
   at speed could shift. Mitigation: the probe measures PAUSED at rest (speed 0,
   look-ahead term = 0) -> rest expected values unchanged; pre-registered in ST-445.
R2 New HUD DOM (chip + strip). Mitigation: one pooled element each, opacity-only
   animation, no layout thrash; PWA 11/11 + console-clean gates; the strip is a
   single 2D canvas (no three.js object -> 0 draw calls).
R3 Locale completeness. Mitigation: tests/strings.test.js parity test (existing)
   fails on a missing key in any of the 3 locales.
R4 The bearing strip reads as noise/clutter. Mitigation: cockpit-mode-only, subtle
   opacity, A/B screenshot review in ST-445 before the gate; cut option covers it.
R5 Playframe pin drift from the 2D overlay. Pre-registered expectation: none (2D DOM
   does not enter renderer.info); a drift is a finding to be decomposed, not a re-pin.

## Verification plan (per story, headless-first)

- Unit: new cameraModel fields (ST-444a) via node:test; strings parity (existing).
- Probe: cam matrix re-run + playframe + causal (ST-445); a new headless screenshot
  set for the cockpit bearing strip (at center + at a rim, cockpit mode).
- Quality bar each iteration: npm test (1027 + additions) / build 0 / dist ceiling
  3,250,000 B (current 2,918,734, headroom 331,266) / vendor 76DEA8151BC9352A /
  BOM audit / hygiene / commit.
- Browser: single tab, reused, closed after (user rule); headless for all logic.

## Decision gates

- Continue: each story's output is verifiable (tests + probes + screenshots).
- Stop condition: if ST-444(b) A/B review (R4) fails twice, apply the cut option
  and close E62 with (a) only.

## Next owner

Operator (this session): execute ST-442 (I475) -> ST-443 (I476) -> ST-444 (I477)
-> ST-445 (I478) sequentially. No user confirmation needed (standing instruction).
E63 (enemies + art direction) / E64 (linear levels + bosses) remain queued after.