# E87 scope check - Far-framing fix (banded radial dolly backDir, endless only)

Opened I603 (ST-568/569/570/571 pre-sketch). E86 CLOSED at I602 (G86.0; 4be1ac9, remote-verified this turn: git ls-remote origin main == HEAD). E87 closes the 3 far-framing residuals registered at I601 (ST-566, accept-with-documentation, I596 pattern): from the arena rim the player "cannot see all the way back" - the arena center is OUT of frame from the S rim and the opposite rim is out of frame (or behind the camera) from the S/E/W rims, because the endless chase dolly uses a FIXED world +Z back direction (backDir null in main.js) instead of a radial one.

## Scope Fit

I601 measured the bug (.evidence/I601/farframe601.json): rim cases with the fixed world +Z dolly - (b) arena center in-frustum from 3/4 rims [N (0,0.3788) / E (-0.6706,0.1339) / W (0.6706,0.1339) in; S (0,-3.463) OUT below the frame, depth 7.06]; (c) opposite rim in-frustum from 1/4 [N (0,0.5733) in; S BEHIND the camera, depth -12.5975; E/W x-stretch 1.3002 OUT]. The I445 invariance (ship screen offset + view angle invariant wherever the ship moves) HOLDS in I601 - the residual is the dolly BACK DIRECTION, not the dolly factor.

I603 prediction probe (.evidence/I603/farframe603.mjs, pure node, exported chaseTargets + projectNdc, fov 60 @ 16:9, arenaR 26) tested 3 candidate dolly directions over 4 rim directions x inward/outward:

- R0 (baseline, backDir null = today): (b) 3/4 rim + 3/4 in; (c) 1/4 rim + 1/4 in; (a1) invariance maxDx 0 / maxDy 0 (holds); (a2) ship NDC facing the center from the 4 rims VARIES [N (0,-0.1428) / E (0.1592,-0.0318) / S (0,0.1875) / W (-0.1592,-0.0318)] = the feel drifts off-axis too.
- R1 (full radial backDir = normalize(ship pos) everywhere): (b) 4/4 rim + 4/4 in, all (0,0.3788) rim / (0,0.4055) in; (c) 4/4 rim + 4/4 in, all (0,0.5733) / (0,0.5981); (a2) ship NDC CONSTANT (0,-0.1428) from all 4 rims (feel improvement); BUT (a1) invariance BREAKS: maxDx 0.2908 / maxDy 0.2473 - the ship wanders on screen across positions = the I445 contract the user asked for ("same view angle wherever the ship moves") would be violated in the inner arena.
- R2 (BANDED RADIAL: backDir = normalize(ship pos) when dist >= band * arenaR with band 0.7 (dist >= 18.2), else null = legacy world +Z): grid-identical to R1 (every grid point, in 20.8 + rim 26, is outside the band) AND bit-identical to R0 for any position inside the band -> the I445 invariance is preserved in the inner arena while the rim gets the full radial fix. FROZEN.

Crossing test (R2, ship N rim -> S rim along y, heading (0,-1), 120 steps at 26->-26): undamped, the camera azimuth jumps up to 90 deg in a single step (the radial line flips 180 deg as the ship crosses the arena center / exits the band at the S side) = a visible whip; a 180-deg flip risk sits at the S band exit. Pre-registered fix: a runtime HELD AZIMUTH with exponential damping toward the target radial azimuth, tau 0.25 s -> initial rate 180 deg / 0.25 s = 720 deg/s = 12 deg/frame at 60 fps, under the 30 deg/frame acceptance ceiling.

Scope-fit verdict: bounded - 2 config levers, 1 pure additive helper + unit tests, ~10 lines of main.js endless-only wiring, 1 verification probe, 1 close gate. The campaign path (rail-tangent backDir) is untouched; the cockpit path is untouched; assets untouched; no draw calls, no geometry.

## Fix set (PRE-REGISTERED)

| story   | change | files | expected dist delta |
|---------|--------|-------|---------------------|
| ST-568  | research + farframe603 prediction probe + this scope check + E87 open (docs only) | .evidence/I603/ (committed -f) + production docs | 0 B (EXACT 6,853,589 B / 204) |
| ST-569  | R2 implementation: config.js +2 levers (camera.dolly.band 0.7, camera.dolly.azTau 0.25, commented); cameraModel.js ADDITIVE pure helper azimuthDamp(prev, target, dt, tau) (shortest-arc angular approach, k = 1 - exp(-dt/tau)); main.js endless-only: held-azimuth state on the camera rig, backDir = damped radial when dist >= band*arenaR else null (reset on mode change); unit tests (identity / convergence monotone no-overshoot / wraparound / 1-step factor) | src/core/config.js + src/core/cameraModel.js + src/main.js + tests/cameraModel.test.js | +454 B (I604 measured: 6,853,589 -> 6,854,043 B / 204 files); unit 1,243/1,243 (+5 azimuthDamp: identity / 1-step factor / convergence monotone no-overshoot / wraparound / 30-deg crossing ceiling); regression 2/2 EXACT zero re-pins (playframe A 22/62,472 + P 11/180, B 52/132,682; causal495 3-arm seed-9876) |
| ST-570  | farframe604 verification probe (FROZEN acceptance: (a) inside the band bit-identical to R0 (maxDx 0 / maxDy 0); (b) center in-frustum 8/8 rim+in; (c) opp rim in-frustum 8/8 rim+in; crossing max azimuth step <= 30 deg/frame at 60 fps + ship NDC within 0.05 of (0,-0.1428)) + headless browser smoke (console clean, no NaN) + quality bar | .evidence/I605/ (committed -f) | 0 B on top of ST-569 |
| ST-571  | G87.0 close gate (clone run_closegate602.cjs -> run_closegate606.cjs) + CLOSE FLOOR E87 WITH MEASUREMENT + AGENTS.md item-4 refresh + push delegate | docs + .evidence/I606/ | 0 B |

## Frozen bounds

- IN: src/core/config.js (ONLY the 2 new levers camera.dolly.band + camera.dolly.azTau, commented); src/core/cameraModel.js (ONLY the additive exported azimuthDamp - existing exports chaseTargets/cockpitTargets/projectNdc/cockpitThrust byte-untouched); src/main.js (endless backDir compute + held-azimuth state ONLY; the campaign rail-tangent branch, the cockpit branch, and the touch/scripted-intent paths byte-untouched); tests/cameraModel.test.js (append only); .evidence/I604..I606.
- OUT: any other config property; the dolly factor s(t) (I445) and camHeight/camBack/lookAhead; any asset; the 5-harness runners (clones only, no runner edits); the PWA surface; audio. Gate pins (playframe A 22/62,472 + P 11/180, B EXACT; causal495 3-arm seed-9876; causal483 score 11334; pwa491 11/11) EXPECTED EXACT; if a pin moves, re-pin WITH MEASUREMENT per the I570 pattern and document the delta (the ship in the pin windows may sit outside the band, where the dolly direction legitimately changes).

## Measurement protocol (FROZEN)

- ST-569 unit: tests/cameraModel.test.js append - azimuthDamp(prev, target, dt, tau): (1) identity: prev == target -> target; (2) convergence: 120 steps of 1/60 s from 0 to pi at tau 0.25 s -> within 1 deg of pi, monotone, no overshoot on the shortest arc; (3) wraparound: damping from -170 deg to +170 deg goes through 180 deg (shortest arc 20 deg), not the long way; (4) the 1-step factor == 1 - exp(-dt/tau) (same fraction of remaining error per step, dt-consistent).
- ST-570 probe: .evidence/I605/farframe604.mjs (pure node, same harness shape as farframe603, R2 only, simulating the held-azimuth damping at 60 fps): (a) inside the band (dist < 18.2): ship NDC + center NDC + opp-rim NDC all EXACT-equal to R0 (maxDx 0 / maxDy 0, bit-identical); (b) arena center in-frustum from all 4 rims AND from the in points (8/8); (c) opposite rim in-frustum from all 4 rims AND from the in points (8/8); (d) crossing N rim -> S rim at 60 fps: max per-frame camera azimuth step <= 30 deg AND ship NDC inside a 0.05 box around (0,-0.1428) at every sampled frame. Numbers to farframe604.json.
- ST-570 smoke: headless Chrome (dev :5173 self-start/self-kill, close tab after): boot, endless, scripted fly to the rim and across the arena, assert consoleErrors 0 + finite ship pos / camera azimuth + no NaN; zero tabs left.
- ST-571 close gate: .evidence/I606/run_closegate606.cjs = clone of the I602 runner (labels CLOSEGATE602 -> CLOSEGATE606, OUTDIR I602 -> I606): causal495 (dist :4200, 3 arms seed-9876) / causal483 (dev :5173, score 11334) / playframe483+491 (dev :5173, A 22/62,472 + P 11/180, B EXACT) / pwa491 (dist :5199, SUMMARY 11/11); ports self-start/self-kill, all 4 verified free after; fresh dist re-measure; CLOSE FLOOR E87 = 7,400,000 - measured.

## Budget (pre-registered)

- dist: 6,853,589 B / 204 (I602) -> E87 ceiling <= 6,858,000 B / 204 (code-only growth in 3 existing dist files; no new dist files; probes/docs land in gitignored .evidence committed -f + production docs, not dist). Floor check at close: 7,400,000 - measured >= 102,400 B (else cut ladder C1: hard-swap R2 without damping, register the crossing swing as a residual).

## Verification evidence

(to be filled at close: ST-569 quality bar + unit results / ST-570 farframe604 + smoke numbers / ST-571 CLOSEGATE606 5/5 + fresh dist + CLOSE FLOOR E87)

## DoD

- E87 4/4 stories DONE (ST-568 docs + probe numbers / ST-569 implementation + unit tests / ST-570 farframe604 PASS on the frozen acceptance + smoke / ST-571 G87.0 close).
- Close gate 5/5 EXACT (or re-pins WITH MEASUREMENT, documented); fresh dist re-measured under the ceiling; CLOSE FLOOR E87 WITH MEASUREMENT; AGENTS.md refreshed; E87 CLOSED; push delegated + verified; hygiene (all 4 ports free, zero tabs, zero terminals).

Next owner: I604 = ST-569 (R2 implementation per the frozen design).