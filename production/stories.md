# Stories - Void Runner (cgs-create-stories)

Format: ID | story | acceptance criteria | verification

## E1 Foundations
- ST-001 | Vite+three scaffold: package.json, index.html, src/main.js boots empty scene, npm scripts | build green; page serves; console clean | build + browser
- ST-002 | Test harness: node --test wired; src/core/rng.js (seeded LCG) + src/core/math.js (vec2 ops, clamp, lerp, damp) | tests green; determinism test passes | node --test
- ST-003 | src/core/config.js balance table per GDD (ship/asteroid/wave/combo/powerup numbers) | schema sanity test green | node --test
- ST-004 | Renderer: scene, camera, ambient+dir light, procedural starfield, resize handling, clock loop | browser smoke: starfield + 60fps | browser

## E2 Core Loop
- ST-005 | src/core/ship.js: inertial ship model (step(dt, input, aim)) | unit: accel/damping/max-speed/aim easing | node --test
- ST-006 | Ship mesh (procedural low-poly) + aim raycast to y=0 plane + camera follow (lerp + look-ahead) | browser smoke: ship follows mouse | browser
- ST-007 | src/core/weapons.js: bullet pool, fire cadence, update, lifetime | unit: cadence, max bullets, cull | node --test
- ST-008 | Render bullets (shared geometry, pool) + fire on Space/click | browser smoke: bullets fly | browser
- ST-009 | src/core/asteroids.js: spawn at rim, per-size speed, split(L->2-3M, M->2-3S, S none), wave capping | unit: split rules, counts, speeds | node --test
- ST-010 | Render asteroids (shared icosahedron, vertex noise, per-instance tumble) | browser smoke: rocks tumble | browser
- ST-011 | src/core/collision.js: circle-circle tests for bullet/asteroid + player/asteroid | unit: hit/miss/edge | node --test
- ST-012 | Wire collisions: kills score, bullets cull, player takes damage | full loop smoke in browser | browser
- ST-013 | src/core/score.js: combo window + multiplier per GDD | unit: combo math incl. cap + reset | node --test
- ST-014 | src/core/waves.js: wave progression + difficulty table from config | unit: ramp values per GDD | node --test
- ST-015 | src/core/lives.js + src/core/state.js: lives, invuln, knockback; state machine MENU/PLAYING/PAUSED/GAME_OVER | unit: transitions + invuln | node --test
- ST-016 | HUD DOM: score/best/wave/lives/combo + styles | browser smoke: values track sim | browser
- ST-017 | Menu + pause + game over screens wired to state machine; Enter/P/Esc/M keys | browser: full session menu->play->pause->over->restart | browser
- ST-018 | High score persistence (localStorage, guarded) + NEW BEST flag | unit w/ mock storage; browser reload keeps best | node + browser

## E3 Power-ups
- ST-019 | src/core/powerups.js: drop chance, single active drop, pickup radius, types/timers/stacking | unit: drop, timers, stack | node --test
- ST-020 | Render power-ups (shape+color icons: octa/cone/torus/cube/sphere) + pickup | browser smoke: pickup works | browser
- ST-021 | RAPID + SPREAD effects wired into weapons | unit via weapons integration | node --test
- ST-022 | SHIELD (absorbs 1 hit, 12s) + visual ring | unit + browser | node + browser
- ST-023 | BOMB (shatter all, feeds combo) + MAGNET (attract drops + slight homing) | unit + browser | node + browser

## E4 Presentation & Feel
- ST-024 | Particle burst on kills (pooled Points) + debris chunks | browser smoke; Low FX quality halves count | browser
- ST-025 | Screen shake + hit flash + invuln blink (reduced-motion aware) | browser smoke | browser
- ST-026 | Score pop (+points) floating text on kills | browser smoke | browser
- ST-027 | Audio: WebAudio synth SFX (fire, hit, explode, pickup, gameover, wave) + low ambience pad; init on first gesture; mute | manual: sounds play, M mutes, no autoplay error | browser
- ST-028 | Settings (volume, SFX, FX quality, reduced motion) + persistence + settings panel in MENU | unit (mock storage) + browser reload | node + browser
- ST-029 | Wave banner ("WAVE n") + intermission timing from waves.js | browser smoke | browser
- ST-030 | Audio polish: pitch variation, volume envelope, master bus + volume setting live | manual smoke | browser

## E5 Player Systems & Accessibility
- ST-031 | Stats: kills, max combo, time survived tracked; game over shows all + wave | unit for tracker + browser | node + browser
- ST-032 | Tutorial hints (first wave only): controls line fades after 6s | browser smoke | browser
- ST-033 | Touch controls: drag = thrust, tap = fire (toward tap), two-finger tap = pause | manual browser (device emulation) | browser

## E6 Polish, QA, Gates
- ST-034 | Balance pass 1: review balance.js numbers vs GDD, adjust fire/asteroid/drop pacing, document rationale | balance-check doc; tests still green | node + doc
- ST-035 | Bloom post FX (UnrealBloomPass) behind FX-quality=High | browser smoke; Low path unaffected | browser
- ST-036 | Perf pass: verify pooling no-grow, shared materials, frustum cull, draw calls budget; FPS meter (debug ?fps=1) | browser perf note in iteration log | browser
- ST-037 | Bugfix round A from smoke/playtest notes + regression tests for each fix | bugs closed w/ tests | node + browser
- ST-038 | Code review pass (cgs-code-review): naming, dead code, config centralization, comment hotspots | review notes; fixes applied | repo diff
- ST-039 | Balance pass 2 (post-playtest): tune wave ramp + combo window + drop chance; document | balance notes; tests green | node + doc
- ST-040 | QA plan + browser regression script: launch, start, 20s play, pause, resume, mute, settings, game over, restart | regression clean, logged | browser
- ST-041 | Playtest report (cgs-playtest-report): friction, comprehension, loop completion, quotes-as-notes | report in production/ | doc
- ST-042 | Bugfix round B (playtest findings) + regressions | bugs closed w/ tests | node + browser
- ST-043 | Edge cases: tab blur auto-pause, window resize, WebGL context loss guard, NaN guard | browser smoke each | browser
- ST-044 | UI/UX review fixes: contrast, font scale, combo meter clarity, icon legibility | review notes applied | browser
- ST-045 | Vertical slice gate (cgs-gate-check/cgs-vertical-slice): full loop at representative quality | gate verdict PASS | doc
- ST-046 | Final regression: full node suite + browser regression + build | all green | node + browser + build
- ST-047 | Docs: README (run/build/test/controls), architecture README update, CHANGELOG final | docs complete | repo
- ST-048 | Milestone review (cgs-milestone-review) + retrospective (cgs-retrospective) | docs + actions | doc
- ST-049 | Release checklist (cgs-release-checklist): dist build verified, size, load time, no console warnings | ship/no-ship = SHIP | doc + build
- ST-050 | Final polish sweep: last visual/audio nits from release checklist + closing commit | all checklist items checked | repo

## E7 Extended Content, UX, Hardening & Release (I51-I100)
- ST-051 | Wave modifiers (per-wave: fast rocks, small bias, inward push) deterministic via RNG | unit + browser | node + browser
- ST-052 | Golden asteroid (rare, 5x score, faster, glowing) | unit + browser | node + browser
- ST-053 | Near-miss bonus (close pass = small points + swish) | unit + browser | node + browser
- ST-054 | Mine drones (slow homing, 1 hit, explode) | unit + browser | node + browser
- ST-055 | Monolith boss every 5 waves (HP 40, ring burst, splits to 4 M) | unit + browser | node + browser
- ST-056 | Enemy bullets (separate pool, distinct look, damage ship) | unit + browser | node + browser
- ST-057 | Overdrive power-up (2x score 6s, magenta hex) | unit + browser | node + browser
- ST-058 | Endless difficulty curve post wave 10 (caps lift, documented) | unit + doc | node + doc
- ST-059 | Gravity vortex hazard (pulsing disc pulls ship+rocks) | unit + browser | node + browser
- ST-060 | Starfield twinkle + parallax; rock rim-lit material upgrade | browser | browser
- ST-061 | Bullet trails (additive streak) | browser | browser
- ST-062 | Shield pulse animation + ring visual | browser | browser
- ST-063 | Ship engine flame (thrust flicker) | browser | browser
- ST-064 | Balance pass 3 (new content pacing) + doc | balance notes | doc
- ST-065 | Menu polish (title, controls, animated bg, credits) | browser | browser
- ST-066 | Top-5 high-score table (localStorage, guarded) + NEW BEST | unit + browser reload | node + browser
- ST-067 | Options panel polish (groups, key nav, live FX preview) | browser | browser
- ST-068 | Pause overlay (dim, resume/restart/quit, mouse+keys) | browser | browser
- ST-069 | Game-over stats + new-best celebration (confetti burst) | browser | browser
- ST-070 | Accessibility: power-up letter glyphs (R/S/H/B/M), focus styles, font scale setting | browser | browser
- ST-071 | Mobile/responsive HUD + touch pass | browser (device emulation) | browser
- ST-072 | UI text pass (wording/typos/caps consistency) | review notes | repo
- ST-073 | Adaptive quality (rolling FPS <45 -> auto FX low, logged, overridable) | unit + browser | node + browser
- ST-074 | Pool/memory audit (no per-frame allocs in hot paths) | audit notes + tests | node
- ST-075 | WebGL context loss: overlay + restore/reload path | browser (simulated) | browser
- ST-076 | Determinism harness: fixed input+seed replay => identical state | unit | node
- ST-077 | Soak test: 10-min headless sim (no NaN, pools stable) | unit (fast sim) | node
- ST-078 | Resume sync: clock reset on unpause, dt clamp verified | unit + browser | node + browser
- ST-079 | Storage versioning + corruption guards (settings/scores) | unit | node
- ST-080 | Debug overlay ?dbg=1 (fps, pools, entities, drawcalls) | browser | browser
- ST-081 | Hit-stop (boss/bomb) + camera punch | browser | browser
- ST-082 | Dynamic FOV kick (bomb/boss) + look-ahead tuning | browser | browser
- ST-083 | Audio: wave-clear jingle, boss stinger, near-miss swish, ambience duck | manual | browser
- ST-084 | Audio: stereo pan by x, master DynamicsCompressor | manual | browser
- ST-085 | Vignette overlay (CSS, reduced-motion safe) | browser | browser
- ST-086 | Per-entity particle palettes + burst shapes | browser | browser
- ST-087 | Sound-level pass (SFX weight vs visual) | manual | browser
- ST-088 | UI motion pass (popup/menu/banner easing, reduced-motion) | browser | browser
- ST-089 | Regression round C (node + extended browser w/ boss+modifiers) | regression clean | node + browser
- ST-090 | Playtest v2 (scripted self-play + notes) | report doc | doc
- ST-091 | Bugfix round C + regressions | bugs closed w/ tests | node + browser
- ST-092 | Balance pass 4 (post all content) + doc | balance notes | doc
- ST-093 | UI/UX final pass on new screens | review notes applied | browser
- ST-094 | Docs: GDD addendum, architecture README update, README v2 | docs | repo
- ST-095 | Perf re-verification post polish (fps note) | browser | browser
- ST-096 | 100-iteration gate check (cgs-gate-check) | gate verdict PASS | doc
- ST-097 | Milestone review + retrospective v2 | docs | doc
- ST-098 | Release checklist v2 + dist verification | ship verdict | doc + build
- ST-099 | Final polish sweep from checklist + closing commit | checklist complete | repo
- ST-100 | Wrap: verify 100 log entries, final CHANGELOG, screenshot set | verified | repo

## E8 Expansion Milestone (I107-I206)
- ST-107 | E8 scope check (cgs-scope-check): six-phase phasing, cut list, deferrals | scope-check-E8.md, 100-iter map | doc
- ST-108 | E8 epics E8A-E8F with outcomes/dependencies/gates | epics.md E8 section | doc
- ST-109 | E8 story map: ST-107..206 with acceptance criteria | this section | doc
- ST-110 | G8.0 entry gate (cgs-gate-check): fresh baseline tests/build/perf/sequence | gate PASS | doc + node + build
- ST-111 | Combo/score multiplier (core): chain-kill window, multiplier levels, decay | unit: window expiry, level cap, score math | node --test
- ST-112 | Combo HUD (xN + window bar) + kill feedback pop | browser: HUD live, no NaN | browser
- ST-113 | Bomb power-up (core): screen-clear nova + brief invuln | unit: clear behavior, pickup, timer | node --test
- ST-114 | Bomb render + SFX (nova ring + flash) | browser: visual + audio | browser
- ST-115 | Slow-mo power-up (core): time scale on enemies/bullets, ship retains speed | unit: scale apply/restore | node --test
- ST-116 | Slow-mo render tint + verify | browser: tint + behavior | browser
- ST-117 | Homing drone (core): spawn wave 8+, seek + wobble, 1 HP, score | unit: seek behavior, spawn gate | node --test
- ST-118 | Drone render + tuning | browser: drone visible + behaves | browser
- ST-119 | Chain-splitter rocks (core): L splits 2x M, M splits 2x S | unit: split chain + cap | node --test
- ST-120 | Splitter tuning + scoring | unit + browser | node + browser
- ST-121 | Shielded rocks (core): armor N hits, visual state, never splits | unit: armor + no-split | node --test
- ST-122 | Weapon progression (core): levels 1-3 by wave, damage/rate changes | unit: level thresholds | node --test
- ST-123 | Weapon visuals: bullet color/trail per level | browser | browser
- ST-124 | Balance pass E8-1 (new-system deltas) | notes + config | doc + node
- ST-125 | Determinism re-verify (harness incl. new systems) | replay bit-identical | node
- ST-126 | Test batch E8B (combo/bomb/slow-mo/drone/splitter/shielded/weapon) | 30+ new tests | node --test
- ST-127 | Browser verify E8B (all new systems + screenshot) | console 0/0, no NaN | browser
- ST-128 | G8.1 gate (cgs-gate-check) | gate PASS | doc
- ST-129 | Balance follow-up (post-gate playtest findings) | notes + config | doc
- ST-130 | Power-up drop rebalance (7 types) | unit: drop table | node
- ST-131 | Enemy spawn-mix rebalance (rocks/mines/drones) | unit: spawn mix | node
- ST-132 | E8B docs + changelog (GDD addendum: new systems) | docs | doc
- ST-133 | Boss phase 2 (core): <50% HP -> spin + speed + rate up | unit: phase transition | node
- ST-134 | Boss radial burst pattern (core) | unit: burst geometry | node
- ST-135 | Boss intro banner + entrance polish | browser | browser
- ST-136 | Mini-boss (core): armored drone on non-boss 5th waves | unit: spawn + hp | node
- ST-137 | Mini-boss render + death burst | browser | browser
- ST-138 | Asteroid belt (core): wave 8+ drifting indestructible rocks, collision = damage | unit: belt spawn + collision | node
- ST-139 | Belt tuning + perf | browser + perf | browser
- ST-140 | Daily seeded run (core): date -> seed, DAILY badge | unit: seed derivation + reproducibility | node
- ST-141 | Daily UI (menu: today seed + daily best) | browser | browser
- ST-142 | Shareable result string (score+seed+wave, encode/decode) | unit: codec round-trip | node
- ST-143 | Boss variant 2 (alternate pattern) [CUTTABLE] | unit + browser | node + browser
- ST-144 | Balance pass E8-2 | notes + config | doc + node
- ST-145 | Test batch E8C | 25+ new tests | node --test
- ST-146 | Browser verify E8C | console 0/0, no NaN | browser
- ST-147 | G8.2 gate (cgs-gate-check) | gate PASS + regression A clean | doc + node + browser
- ST-148 | Regression round A (extended browser) | clean | node + browser
- ST-149 | Fix round A findings | fixes + tests | node + browser
- ST-150 | E8C docs + changelog | docs | doc
- ST-151 | First-run tutorial overlay (dismiss, persist) | browser | browser
- ST-152 | Session stats (accuracy, best combo, kills, waves) | unit + browser | node + browser
- ST-153 | Kill feed / event ticker | browser | browser
- ST-154 | Wave banner polish (scale/fade) | browser | browser
- ST-155 | Colorblind shape cue for golden rocks + toggle | browser: cue w/o color | browser
- ST-156 | Colorblind verify + palette check | browser | browser
- ST-157 | Hotkeys: M mute, P pause, F fx toggle | browser | browser
- ST-158 | Options rows (slow-mo hint, colorblind, music) | browser | browser
- ST-159 | Game-over share screen (copy string) | browser | browser
- ST-160 | In-run HUD rework (compact score + multiplier) | browser | browser
- ST-161 | A11y pass (focus, font scale, reduced-motion on new FX) | browser | browser
- ST-162 | Test batch E8D (stats storage, hotkeys, codec) | 15+ new tests | node --test
- ST-163 | Browser verify E8D (all screens) | screenshots + console clean | browser
- ST-164 | G8.3 gate (cgs-gate-check) | gate PASS | doc
- ST-165 | UX fix round | fixes | browser
- ST-166 | Locales-ready string extraction [CUTTABLE] | docs | doc
- ST-167 | UI perf check (text drawing) | perf notes | browser
- ST-168 | E8D docs + changelog | docs | doc
- ST-169 | Procedural music: ambient drone loop (WebAudio) | browser: audible | browser
- ST-170 | Music intensity layers (wave/boss escalation) | browser | browser
- ST-171 | Music toggle (options) + persist | unit + browser | node + browser
- ST-172 | Bullet-time audio (pitch drop on slow-mo) | browser | browser
- ST-173 | SFX pass for new content (bomb, drone, mini-boss, pickup) | browser | browser
- ST-174 | Death slow-mo (bullet time + zoom + flash) | browser | browser
- ST-175 | Unified screen-shake table (config) | unit + browser | node + browser
- ST-176 | Damage vignette (reduced-motion aware) | browser | browser
- ST-177 | Particles: pickup burst + magnet trails | browser | browser
- ST-178 | Weapon-upgrade fanfare + visual | browser | browser
- ST-179 | Balance pass E8-3 (feel params) | notes + config | doc
- ST-180 | Audio headless tests (WebAudio stub) | 10+ new tests | node --test
- ST-181 | Browser verify E8E (audio on/off, reduced motion) | console clean | browser
- ST-182 | G8.4 gate (cgs-gate-check) | gate PASS | doc
- ST-183 | Feel tuning round 2 | notes | doc
- ST-184 | Perf profile (new entities) + optimize | perf notes | browser
- ST-185 | Memory audit (new entity pooling) | audit notes | node + browser
- ST-186 | E8E docs + changelog | docs | doc
- ST-187 | Context-loss hardening (re-init path) | browser (simulated) | browser
- ST-188 | Context-loss test + verify | evidence | browser
- ST-189 | Visibility-pause hardening (auto-pause, dt clamp) | unit + browser | node + browser
- ST-190 | Replay viewer (watch saved replay) [CUTTABLE] | browser | browser
- ST-191 | Replay capture UI (record toggle, save) [CUTTABLE] | browser | browser
- ST-192 | Test growth to 300+ (new-system coverage) | 300+ tests | node --test
- ST-193 | Test flakiness check (deterministic runs) | notes | node
- ST-194 | Security audit (storage parse, seed codecs) | audit doc | doc
- ST-195 | Regression round B (extended soak) | clean | node + browser
- ST-196 | Fix round B findings | fixes + tests | node + browser
- ST-197 | Build size + load-perf audit | audit notes | build + browser
- ST-198 | G8.5 gate (cgs-gate-check) + determinism final | gate PASS | doc + node
- ST-199 | Regression round C + playtest prep | clean | node + browser
- ST-200 | E8F mid docs + changelog | docs | doc
- ST-201 | cgs-qa-plan E8 | QA plan doc | doc
- ST-202 | Human playtest round 1 (incl. carried perception items) | playtest report | doc
- ST-203 | Playtest findings triage + fix | fixes | node + browser
- ST-204 | cgs-release-checklist E8 | checklist | doc
- ST-205 | Final polish sweep (console clean, all screens) | sweep complete | browser
- ST-206 | E8 closeout: milestone review + final CHANGELOG + log audit 1..206 | sequence 1..206, docs | repo

## E9 Blender Graphics & Assets (I207..I218) - CLOSED (I218)
- Blender 5.2.3 is connected. Assets are modeled procedurally in Blender (bpy), exported as GLB,
  vendored under assets/, and loaded in the render layer via three.js GLTFLoader with a PROCEDURAL
  FALLBACK (the game still boots if a GLB is missing or fails to parse). Polycounts stay within the
  existing draw-call / triangle budget. The AGENTS.md 'no external art assets' convention is extended
  at ST-207 to 'Blender-authored, vendored GLB assets + procedural fallback'.
- ST-207 | E9 pipeline: Blender->GLB + GLTFLoader render path (async load, procedural fallback, assets/ dir, AGENTS.md note) | pipeline works + fallback | browser + node
- ST-208 | Blender ship model (low-poly fighter, <~1.5k tris) replaces the procedural ship mesh | ship GLB renders/rotates, 0 NaN, budget met | browser
- ST-209 | Blender asteroid set (L/M/S + shielded + golden variants; displacement + vertex color) replaces icosahedrons | rocks distinct per size, tri budget met | browser
- ST-210 | Blender boss (Monolith) + shielded-rock armor shell (visual armor state) | boss + shield render | browser
- ST-211 | Blender power-up emblems (7 types) + drone/dart polish | pickups render distinct | browser
- ST-212 | Blender background: starfield/nebula skybox + arena ring | skybox renders, perf budget | browser
- ST-213 | Material/lighting pass: emissive engine trail, PBR-lite rocks, bloom-safe materials | looks pass within perf budget | browser
- ST-214 | Asset perf + memory audit (draw calls, tris, VRAM), LOD/merge | audit notes, budget met | build + browser
- ST-215 | Test batch E9 (loader fallback, asset swap, budget assertions) + browser verify | 15+ tests, console clean | node + browser
- ST-216 | G9.0 gate (cgs-gate-check) + E9 docs + changelog + log audit 1..216 | gate PASS, docs | doc + node
- ST-217 | Post-processing polish pass (art research 2026-11-10): half-res bloom + additive particle trails + boss-kill flash / phase-2 hit-stop, FX-tier + adaptive-gated, frame-time before/after | browser: measure + screenshot | browser - DONE at I217
- CLOSED (I218): 11/11 stories ST-207..217 done (I207..I217); G9.1 closeout gate PASS (fresh 676/676, build 0, dist 1940.6/501.9 KB, log audit 1..218 sequential).

## E10 Post-E9 Polish (I219+)
- E9 closed at I218 (G9.1 PASS). E10 = 3 stories, gate G10.0 (scope: production/scope-check-E10.md, I219).
- ST-218 | Blender Warden model: armored sentinel (jagged hull + SEPARATE armor-plate mesh), silhouette-first, flat-shaded, emissive core accent, 2 draw calls, budgets <=200 tris / <=40 KB / <=3 mats, VR_ names, armor-state animation (retract + cyan->orange glow) unchanged, procedural fallback preserved | asset audit + browser screenshots (armored + spent) | blender + browser - DONE at I220
- ST-219 | Camera/feel (art research lever 6): 2-5% camera lead toward aim (eased, capped), boss-approach zoom-out a few degrees (eased in/out), slow menu orbit drift; view FIXED during normal play (dodge-read rule); motion-gated + FX-tier aware; frame-time delta ~0 | browser: A/B screenshots + pilot parity | browser - DONE at I221
- ST-220 | E10 regression round + G10.0 gate (cgs-regression-suite + cgs-gate-check) + closeout docs (milestone review + timeline + changelog + log audit) | gate PASS, docs | node + browser - DONE at I222
- CLOSED (I222): 3/3 stories ST-218..220 done (I220..I222; scope opened I219); G10.0 closeout gate PASS (fresh 677/677 x3 matrix, build 0, dist 1954.9/506.2 KB, log audit 1..222 sequential).

## E11 Combat Juice & Low-End Validation (I223+)
- E10 closed at I222 (G10.0 PASS). E11 = 3 stories, gate G11.0 (scope: production/scope-check-E11.md, I223).
- ST-221 | Kill juice (T4): class-scaled directed kill punch on rock kills (punch energy S 0.08 < M 0.12 < L 0.18, directed from ship toward the kill point, all below the drone rung and the 0.45 weapon fanfare) + overdrive combo-heat escalation (x1.5 while the kill event carries overdrive, capped); NO flash / hit-stop / fovKick on plain rock kills (readability rule); motion-gated; juiceTally records what fired; pure-logic class/overdrive -> energy mapping in a new core module (testable); tunables in CONFIG.fx.killPunch | unit tests + scripted-pilot juiceTally deltas + A/B screenshots + frame probe (delta ~0) + pilot parity + reduced-motion gate | node + browser - DONE at I224
- ST-222 | Low-end device validation, bot-verifiable half (cgs-perf-profile): dense worst-case scene (I182 reference: 24 M rocks + live boss + sustained barrage) at FX high/low/off with frame-time budgets; adaptive-quality ladder under sustained load (downgrade fires + stabilizes, hysteresis honored); DPR cap check (2 default / 1.5 under load); reduced-motion + FX-low combo playable (no NaN, stable frame); green/red matrix in production/perf-profile.md; physical-device remainder as a labeled HARDWARE-pending checklist | perf-profile.md matrix + browser frame probes | browser - DONE at I225
- ST-223 | E11 regression round + G11.0 gate (cgs-regression-suite + cgs-gate-check) + closeout docs (milestone review + timeline + changelog + log audit) | gate PASS, docs | node + browser - DONE at I226
- CLOSED (I226): 3/3 stories ST-221..223 done (I224..I226; scope opened I223); G11.0 closeout gate PASS (fresh 689/689 x3 matrix, build 0, dist 1958.4/507.8 KB, demo pin exact via real UI, log audit 1..226 sequential).
## E12 Quality Settings Consistency & Skybox Art Pass (I227+)
- E11 closed at I226 (G11.0 PASS). E12 = 4 stories, gate G12.0 (scope: production/scope-check-E12.md, I227).
- ST-224 | FX off tier (I225 flag 1): complete the tier set high/low/off - F hotkey cycles high->low->off->high (pure-core toggleFxQuality extended + tests), settings panel select gains the 3rd option (ST-067 live-preview path), off zeros every FX-tier-gated render effect (burst particles 0, engine trail puffs 0; bloom already high-only; starfield twinkle + juice/readability channels intentionally unaffected); off is user-only (the adaptive ladder stays high->low auto, userSet lock semantics preserved); storage contract: 3-tier persistence, invalid discard, old 2-tier saves migrate unchanged | unit tests (toggle cycle, storage, adaptive userSet off lock) + browser (F cycle 3 states, panel 3 options, scripted kills at off -> live particles 0 + trail 0 + bloom off) + frame probe + reduced-motion unaffected | node + browser
- ST-225 | Load-reactive DPR + effective-tier settings sync (I225 flags 2+3): (a) pure dprForTier(tier, dpr) helper (high -> min(dpr,2), low -> min(dpr,1.5), tests) applied by main.js on adaptive onTier / reset / userSet with a single labeled renderer resize; (b) on autoDowngrade the settings panel + pause F-row + screenOpts reflect the effective tier with an AUTO marker (e.g. LOW (auto)) while the stored user choice stays untouched (storage authoritative for the user choice; F path re-applies settings before userSet per I225 semantics) | unit tests (dprForTier exact incl. dpr 2 -> 1.5, dpr 1.25 -> 1.25 no-op, invalid tier) + browser via Playwright deviceScaleFactor=2 emulation (boot 2.0 -> forced downgrade 1.5 -> reset/userSet restore 2.0; panel AUTO marker in/out; storage untouched) + frame probe (single labeled hitch) | node + browser
- ST-226 | Skybox art pass (Blender, research-backed; closes the carried 512x256 deferral): regenerate the skybox equirect in Blender (5.2.3 MCP) with the grounded recipe - layered FBM gas in the existing palette language (keep the 0x04060f base, cyan + magenta accents, faint gold from the weapon palette), thin dust lanes, a subtle off-axis galactic band, clustered star density with a few hero stars, no planets or bright focal objects (readability rule: the sky stays subordinate to the world); keep the equirect TextureLoader + I213 PMREM IBL pipeline unchanged; encode budget-staged (2048x1024 -> 1024x512 -> 768x384; PNG -> WebP/JPEG) with net delta <= 40 KB raw vs the current 41.2 KB PNG and dist staying <=2048/<=550; documented fallback if no encode fits: runtime canvas FBM generator (zero asset cost, one-time MENU-time generation labeled) | A/B screenshots (old vs new, MENU + in-flight, both FX tiers) + readability spot check (world contrast preserved) + frame probe (delta ~0; one-time texture upload labeled) + dist budget + asset size audit update + PMREM IBL probe + console 0/0 | node + browser (+ Blender)
- ST-227 | E12 regression round + G12.0 gate (cgs-regression-suite + cgs-gate-check) + closeout docs (milestone review + timeline + changelog + log audit) | gate PASS, docs | node + browser
- CLOSED (I231): 4/4 stories ST-224..227 done (I228..I231; scope opened I227); G12.0 closeout gate PASS (fresh 697/697 x3 matrix, build 0, dist 1994.7/543.4 KB, demo pin exact via real UI, log audit 1..231 sequential). 1-line gate fix: F-hotkey userSet before applyFxTier (stale AUTO: LOW marker after an auto-downgrade; live repro + post-fix verify in I231).
## E13 Mid-Run Content Arc (I233+) - CLOSED (I236)
E12 closed at I231 (G12.0 PASS). E13 = the wave 3-9 content valley: 4 stories, gate G13.0 (scope-check-E13.md APPROVED; demo-pin-compatible by gating; daily salt bump 'daily:v2').
- ST-228 | HEAVY ROCKS modifier (4th waveMods.list entry 'big', bigLBias 0.5 mirror of SMALL, deterministic (seed, wave) roll, 'HEAVY ROCKS' banner + i18n, GDD Waves section, daily salt bump 'daily:v2' + GDD daily example + daily test update) | node + browser (4-way roll determinism; a seeded live scenario showing a HEAVY ROCKS wave + banner; W1-2 plain + breather invariants) | core (config + waves) + docs + i18n
- ST-229 | STINGER enemy (the charger/rammer archetype: cruise 1.8 u/s -> telegraph 0.8 s (emissive core glow + rising SFX) -> charge 7.5 u/s x 1.4 s -> recover 1.2 s, 6-charge lifetime fizzle, wave 7+ 1/wave cap 2, rim 15 u, contact 1 life no score, kill +250, shakeTable 0.6 + killPunch 0.2, 2 new SFX cues, pool 4 + procedural fallback + GLB hook, CONFIG.stinger, toast + kill feed, HUMAN-PENDING #9) | node + browser (a scripted wave 7+ scenario: full lifecycle, kill/contact/fizzle/cap, rm + FX-off matrix) | core (new src/core/stinger.js + tests) + render + audio + docs
- ST-230 | Blender STINGER model + asset budget pass (<=200 tris / <=40 KB / <=3 materials, separate emissive core node, VR_ naming, 17th asset; assetGlbs/assetPerf extended to 17; skybox JPEG 73.2 -> <=60 KB staged + A/B; net gzip delta of the story <= 0; headroom >= 8 KB) | node + browser + blender (17/17 loads + fallback proven; A/B readability) | assets + tests + docs
- ST-231 | E13 regression round + G13.0 gate + closeout (demo pin EXACT via real UI headline: REPLAYS -> DEMO PILOT -> key 3, idx 2169/2220, 11334, 57, 36.15, wave 2; state machine, persistence, rm matrix, FX-off, pool caps, fresh pilot, frame probe, console 0/0, dist budget, log audit) | gate PASS, docs | node + browser
- E13 opened at I232 (scope check APPROVED); stories ST-228..231 scheduled I233..I236.
- CLOSED (I236): 4/4 stories ST-228..231 done (I233..I236; scope opened I232); G13.0 closeout gate PASS (fresh 710/710 x3 matrix, build 0, dist 108 files 2002.7/537.0 KB, demo pin exact via real UI, log audit 1..236 sequential).

## E14 Late-Run Mastery Arc (I238+) - CLOSED (I241)
E13 closed at I236 (G13.0 PASS). E14 = the late-run mastery band: 4 stories, gate G14.0 (scope-check-E14.md APPROVED with cut option; demo-pin-compatible by gating: flyer W9+ / cap W3+ vs demo wave 2; no daily salt bump - the daily run is wave 1-2 like the demo).
- ST-232 | FLYER evasive enemy (Asteroids-UFO archetype: rim 15 u entry -> cruise 2.5 u/s + perpendicular sine weave (amp ~1.2 u, period ~0.9 s, continuously re-aiming) -> lifetime 9-12 s exit (no score); 2 hits, kill +400 + distinctive burst + high-pitch chime + FLYER kill-feed row; NO contact lethality; W9+, 1/wave, cap 2, pool 4; procedural elongated-hexa-disc fallback + GLB hook; CONFIG.flyer, first-spawn toast, 2 SFX cues, HUMAN-PENDING #10) | node + browser (staged wave 9 scenario: weave determinism at pinned times, 2-hit +400 + feed + juice, lifetime fizzle, cap 2, RM amp gated, FX high/low/off matrix, no contact lethality) | core (new src/core/flyer.js + tests) + render + audio + docs
- ST-233 | combo cap wave-scaling (capFor(wave) pure fn: W1-2 cap 15 EXACT / W3+ cap 20 = 2.9x mastery band; T1 flatline fixed late-only; W1-2 flat = accepted documented trade-off R-E14-5; verify I111 HUD 5-tier math is cap-relative; pin test tests/replay.test.js:246 passes UNMODIFIED) | node + browser (W1-2 cap 15 exact + W3+ cap 20 live, multiplier table, HUD tiers, real-UI pin re-verify) | core (config + combo) + tests + docs
- ST-234 | Blender FLYER model (UFO saucer <=120 tris / <=3 materials, VR_Flyer_Body, POSITION+NORMAL only, <=10 KB raw / <=4 KB gz; 18th asset; assetGlbs/assetPerf 17->18; pool shares GLB geo (stinger pattern); headroom >=8 KB after the story) | node + browser + blender (18/18 loads + fallback proven) | assets + tests + docs
- ST-235 | E14 regression round + G14.0 gate + closeout (demo pin EXACT via real UI headline: REPLAYS -> DEMO PILOT -> key 3, idx 2169/2220, 11334, 57, 36.15, wave 2; state machine, persistence, rm matrix, FX-off, pool caps, fresh pilot, frame probe, console 0/0, dist budget, log audit) | gate PASS, docs | node + browser
- E14 opened at I237 (scope check APPROVED); stories ST-232..235 scheduled I238..I241.
- CLOSED (I241): 4/4 stories ST-232..235 done (I238..I241; scope opened I237); G14.0 closeout gate PASS (fresh 731/731 x3 matrix, build 0, dist 111 files 2014.0/534.0 KB, demo pin exact via real UI, log audit 1..241 sequential).

## E15 Visual Identity & Presentation Arc (I243+) - CLOSED (I246)
E14 closed at I241 (G14.0 PASS). E15 = the visual identity arc (user standing suggestion): 4 stories, gate G15.0 (scope-check-E15.md APPROVED; all render/asset layer only - demo pin structurally untouched; no daily salt bump - no core changes).
- ST-236 | renderer color/tone pipeline (one CONFIG.render.tone block: tone mapping + exposure + explicit sRGB output; A/B screenshot matrix MENU + in-flight x FX high/low/off; skybox readability spot check (I230 warm-cast note is the acceptance hook); frame probe delta ~0; zero core changes) | node + browser (A/B screenshots + readability spot check + frame probe + console 0/0) | render + config + docs
- ST-237 | ship hero pass (Blender MCP rebuild of ship.glb: silhouette-first top-down readability, engine nozzle + separate emissive engine node (I213 trail origin), wing/cockpit detail, <=120 tris / <=3 mats / <=8 KB gz; extent parity vs the UPDATED procedural fallback; in-code materials kept (hitFlash / invuln unchanged); assetPerf audit; 18 slots, count unchanged) | node + browser + blender (18/18 loads + fallback parity + audit + A/B screenshots) | assets + tests + docs
- ST-238 | explosion layering pass (short-lived additive shockwave ring on class-scaled kills - Brackeys sparks/shockwave/debris recipe; NO flash / hit-stop on plain kills (I224 readability rule); ONE pooled ring mesh, FX high 1 / low 1 / off 0 (off zero-leak), motion-gated, juiceTally extension, frame probe delta ~0) | node + browser (FX matrix + off zero-leak + frame probe + juiceTally) | render + config + docs
- ST-239 | E15 regression round + G15.0 gate + closeout (demo pin EXACT via real UI headline: REPLAYS -> DEMO PILOT -> key 3, idx 2169/2220, 11334, 57, 36.15, wave 2; state machine, persistence, FX-off, pool caps, fresh pilot, frame probe, console 0/0, dist budget, log audit) | gate PASS, docs | node + browser
- E15 opened at I242 (scope check APPROVED); stories ST-236..239 scheduled I243..I246.
- CLOSED (I246): 4/4 stories ST-236..239 done (I243..I246; scope opened I242); G15.0 closeout gate PASS (fresh 742/742, build 0, dist 113 files 2026.5/538.2 KB, demo pin exact via real UI, log audit 1..246 sequential).

## E16 Boss Finale Arc (I248+)
E15 closed at I246 (G15.0 PASS). E16 = the boss finale arc: 4 stories, gate G16.0 (scope-check-E16.md APPROVED with cut option; demo-pin-compatible BY GATING - boss W5+ / breather W6+ / music audio-only, FLYER W9+ precedent I237; no daily salt bump - labeled assumption; perception verdicts HP #1/#5 stay HUMAN-PENDING, labeled non-blocking).
- ST-240 | boss hero pass (Blender MCP rebuild of boss.glb: 3 named nodes VR_Boss_{Hull,Crown,Core} - hull tapered faceted obelisk / crown separate silhouette cap / core recessed vertical eye-seam; <=250 tris / <=3 mats / <=10 KB gz; extent parity vs the procedural fallback; in-code materials kept (I240/I244 pattern) + warden-pattern name-based multi-node swap (I220); the Core node gets a separate in-code emissive material shifting brighter/redder on boss.phase===2 = the first visual phase-2 state; Splicer unchanged (same geometry, existing teal logic); assetPerf audit 18 slots, count unchanged) | node + browser + blender (18/18 loads + fallback parity + audit + phase-2 core glow live + Splicer teal check + A/B screenshots) | assets + render + tests + docs
- ST-241 | finale music pass (extend musicIntensityX (pure): boss floor eases in over the boss entrance weighted by boss.entered; +0.1 phase-2 lift while phase===2 (cap 1.0); post-death release decay over a cfg window (world.bossRelease 1 on bossDeath, decays 1/dt/s); unit tests (monotone ease-in, lift cap, release decay, non-finite guards) + browser A/B via __vr.musicIntensityVal() around a forced boss spawn (pre: ~0.73 one-tick step; post: max 1-s delta <= ~0.25); perception verdict stays HUMAN-PENDING #5) | node + browser (unit curves + A/B around a forced boss + console 0/0) | core + config + tests + docs
- ST-242 | breather open density (extend the ST-092 breather: the wave right after a boss opens with a reduced spawn batch (cfg breatherOpenFrac 0.5, min 3 rocks, deterministic (seed, wave)); NO wave-timing change (modifierFor untouched) -> pin + wave-timeline tests structurally unaffected; unit tests + seed-run smoke (wave-6 open-batch count vs pre-change, determinism x2, 1200+ tick re-measure per I238/I240); feel verdict stays HP #1) | node + browser (open-batch count + determinism x2 + seed-run re-measure) | core + config + tests + docs
- ST-243 | E16 regression round + G16.0 gate + closeout (demo pin EXACT via real UI = headline: REPLAYS -> DEMO PILOT -> key 3, idx 2169/2220, 11334, 57, 36.15, wave 2; state machine, persistence, FX-off, pool caps, fresh pilot, frame probe, console 0/0, dist budget, log audit 1..251) | gate PASS, docs | node + browser
- E16 opened at I247 (scope check APPROVED); stories ST-240..243 scheduled I248..I251.

## E17 Asteroid Family & World Polish Arc (I253+)
E16 closed at I251 (G16.0 PASS). E17 = the asteroid family hero pass + world polish: 3 stories, gate G17.0 (scope-check-E17.md APPROVED with cut option; all render/asset layer only - demo pin structurally untouched BY LAYER; no daily salt bump - no core changes).
- ST-244 | asteroid hero pass (Blender MCP v3 rebuild of asteroid_L/M/S.glb - the oldest remaining hero-asset family (I103/I209) + the most-seen geometry (rock pool 29, cap 24): class-differentiated silhouettes - L chunky slab boulder (lattice warp, large plateau facets, deep inset craters), M classic jagged rock (I209 4-crater + mottle retained), S sharp shard (pointier displacement, fresh-break read); richer COLOR_0 (I209 displacement shade + 2-3 mottle bands + crater-rim brightening per the Blender Bones crater recipe); single geometry per size kept; EXACT radii 2.2/1.3/0.7 (test 5% band); VR_Rock_{L,M,S} + VR_Rock material + COLOR_0 on all primitives (assetPerf: COLOR_0 exactly on the 4 rock/boss GLBs, count unchanged); budgets L<=320/M<=120/S<=80; NET NEGATIVE raw size (L 37.66 KB outlier - lean export + class decimate); in-code materials kept (vertexColors:true -> golden/shielded/belt states read via the mottle); extent parity vs the jittered-ico fallback envelope; assetGlbs/assetPerf audit 18 slots) | node + browser + blender (18/18 loads + L/M/S side-by-side class A/B + golden/shielded/belt live checks + size evidence) | assets + tests + docs - DONE at I253
- ST-245 | arena ring v2 + world presentation pass (Blender arena_ring.glb v2: 2 nodes - VR_ArenaRing outer band (24 plates, unit radius 1.0) + VR_ArenaRing_Ticks inner radial tick accent (unit radius, flat XZ, +Y normals, no vertex colors); total <=120 tris, <=4 KB raw; src/render/arenaRing.js two-mesh render - outer unchanged (0x4a6cff op 0.55, DoubleSide, depthWrite false), ticks = brighter MeshBasic crossing the 0.72 bloom threshold (the intended neon accent; band luma stays below), +1 bounded draw call, y-offsets no z-fight, static (reduced-motion safe); tests/assetGlbs.test.js arena pin update (exactly 48 -> two-node counts, documented); frame probe delta ~0; bloom A/B (FX high: ticks bloom / FX low+off: no bloom)) | node + browser + blender (2-node GLB + two-mesh render + frame probe + bloom A/B screenshots) | assets + render + tests + docs - DONE at I254
- ST-246 | E17 regression round + G17.0 gate + closeout (demo pin EXACT via real UI = headline: REPLAYS -> DEMO PILOT -> key 3, idx 2169/2220, 11334, 57, 36.15, wave 2; state machine, persistence, FX-off, pool caps, fresh pilot, frame probe, console 0/0, dist budget headroom >= 8 KB, log audit 1..255) | gate PASS, docs | node + browser - DONE at I255
- E17 opened at I252 (scope check APPROVED); stories ST-244..246 scheduled I253..I255. - E17 CLOSED at I255 (G17.0 PASS; regression-round finding: adaptive FX desync found+fixed, R-E17-5).

- ST-247 | rock material + lighting hero pass (Blender COLOR_0 rebake of asteroid L/M/S: deeper warm base + stronger value contrast, crater-rim brightening kept, same I209 clamp band 0.45..1.2 (identity-safe for golden/belt consumers), geometry / radii / node names / budgets UNCHANGED; scene light rebalance in src/main.js (neutralize the 0x8899ff ambient, keep hemisphere, optionally a warm key) so the rocks read warm rock not ice; bloom-band audit table (ticks ~210 / band ~114 / cockpit / boss core / belt vs the 183.6 threshold, FX high + off A/B); before/after L/M/S side-by-side + far-rock contrast vs nebula; golden + belt rock states live re-verified) | node + browser + blender (18/18 assets + class A/B + bloom-band table + golden/belt live checks) | assets + render + docs - DONE at I257
- ST-248 | bullet/tracer + explosion palette harmony (player bullets carry the cockpit-cyan accent with an overdrive heat shift - "yours" reads at kill rate, ZeroVector / Geometry Wars tracer-language grounding; explosion palettes harmonized with the new warm rock palette (warm ember core); data-driven palette constants in src/core/config.js where the A/B moves values; player vs enemy bullet contrast preserved; FX-off readability floor per ST-177 - bullets clear a luma-delta floor against arena floor + nebula with FX off) | node + browser (A/B at kill rate, FX on/off, overdrive state) | render + config + docs - DONE at I258
- ST-249 | pickup + special rock read audit post-palette (7 powerup GLBs + golden rocks + belt rocks A/B against the new warm palette: contrast regressions fixed with data-driven color/opacity tweaks only; GDD colorblind-safe shape+color check; no GLB rebuild expected - audit-first, tweak-only) | node + browser (A/B screenshots, 7 pickups + golden + belt) | config/render (tweaks only if the audit demands) + docs - DONE at I259
- ST-250 | E18 regression round + G18.0 gate + closeout (demo pin EXACT via real UI = headline: REPLAYS -> DEMO PILOT -> key 3, idx 2169/2220, 11334, 57, 36.15, wave 2; state machine, persistence, FX-off, pool caps, fresh pilot, frame probe, console 0/0, dist budget headroom >= 8 KB, log audit 1..260) | gate PASS, docs | node + browser
- E18 opened at I256 (scope check APPROVED); stories ST-247..250 scheduled I257..I260.
