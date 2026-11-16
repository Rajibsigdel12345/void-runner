# Void Runner - E59 Scope Check: Art Direction Refresh + Budgeted Art Task List (I458 / cgs-scope-check + cgs-create-stories)

## Summary
Closes the loop on the user's standing suggestion (2026-11-10): "improve the art
element of the game as well ... you can do the research and put it in the task
list" - plus the standing grant to use YouTube/web research on similar games so
improvements are grounded, not invented. Both existing art docs PREDATE the
post-E58 asset world (art-direction-research.md = E9-prep era when the game was
fully procedural with no post FX; art-bible.md = I101 pre-Blender baseline).
E59 = refresh the research against the closed E58 state, produce the prioritized
+budgeted task-list artifact (the user's literal ask), execute the first art
pass (top P0 items), then gate + close. Scope of truth for E59: this doc +
design/art-task-list.md (ST-428 output).

## Current State (measured this iteration, I458, 2026-11-16 - evidence, not assumption)
- 26 GLBs / 1,040,720 B (1,016.33 KB) in assets/: ship v4 339.0 KB / 14,276 tris;
  rock v11 L 71.5 KB / 3,000 t (+B twin), M 22.3 KB / 900 (+B), S 9.4 KB / 350
  (+B), comet 15.6 KB; boss 42.6 KB / 1,425 t; enemy_hunter 136.5 KB / 1,432 t;
  enemy_gunship 174.0 KB; warden 19.3 KB; stinger 6.1 KB; drone 7.1 KB; flyer
  6.5 KB; powerups x7 (3.8-7.4 KB); debris x2; arena_ring 5.4 KB; shield 7.2 KB.
- Total GLB tris 28,779 / cap 30,000 (headroom 1,221).
- dist: 2,873,338 B / 147 files / ceiling 3,000,000 (headroom 126,662 B >= 102,400 floor).
- FX: frozen bloom 0.6/0.35/0.72 (config.js) + I334 bit-identical grade (GradePass
  extends OutputPass) + starfield ShaderMaterial + 2 onBeforeCompile rims + adaptive quality.
- Camera: 3 modes (CHASE/OVERVIEW/COCKPIT) + reduced-motion gate (E57).
- Campaign: 3 stages x 5 waves (Outer Drift = identity null / Debris Field = cool
  teal / Core Gate = warm ember; bosses Monolith / Splicer / Monolith Prime).
- Renderer: WebGL2 frozen (I457 re-confirm: F1/F2/F3 unmet); vendor r160 sha 76DEA8151BC9352A.
- Tests 1027/1027; PWA 11/11; touch fallback present.

## Staleness Finding (why E59 exists)
1. design/art-direction-research.md (29 KB, E9-prep): ranks levers against "no
   post-processing pipeline; no imported models" - superseded: bloom+grade+26
   GLBs now exist; its top levers (add half-res bloom, etc.) are DONE.
2. design/art-bible.md (I101): documents pre-Blender placeholder graphics as the
   "canonical baseline" - the hero is now a 14,276-tri airship, rocks are craggy
   v11, enemies have GLB bodies + enemy-visual-language.md (E57).
3. design/enemy-visual-language.md: enemy silhouettes only; not a global art contract.
4. The user's "put it in the task list" deliverable has never existed as an
   artifact - that is ST-428.

## Scope Fit
E59 is bounded to four moves: (1) refreshed art-direction research (YouTube +
web, per the standing grant); (2) the prioritized + budgeted art task-list
artifact (P0/P1/P2, each with goal/approach/budget/acceptance/gate); (3) the
first execution pass (top P0 items, chosen AT ST-428 completion, not before);
(4) fresh regression + gate + close. Everything must fit the measured headrooms:
dist 126,662 B, tris 1,221, perFile 400 KB. Anything the research surfaces that
exceeds headroom goes INTO the task list as deferred (P2+), not into E59.

## Stories
- ST-428 (I459, DOCS-only, zero src): art-direction refresh + budgeted task
  list. Outputs: design/art-direction-research-E59.md (SUPERSEDES the E9 doc -
  YouTube-grounded on comparable arcade space presentations + modern web-3D FX
  trends, re-measured against the live tree) + design/art-task-list.md (P0/P1/P2
  rows: goal, approach, budget in KB/tri/px, acceptance criteria, gate
  (causal/playframe/PWA), dependencies, deferral notes). Gate: every P0/P1 row
  carries a numeric budget and a verifiable acceptance line; total P0 budget <=
  100 KB dist + <= 1,000 tris.
- ST-429 (I460, src/render and possibly assets/ - depends on the ST-428 pick):
  execute the top P0 art items (candidates previewed, NOT decided here: glow/FX
  polish WITHIN the frozen 0.72 bloom identity; enemy visual-identity
  reinforcement - threat glow/silhouette accents; stage-theme presentation -
  stage intro / boss warning cards; starfield/background depth layer). Causal
  pin must stay EXACT (art-only); playframe pins may move and are re-pinned
  with decomposition, never silently.
- ST-430 (I461): fresh R1-R5 + G59.0 gate + close E59 (cgs-regression-suite +
  cgs-gate-check + cgs-milestone-review; full bar if ST-429 touched src, probe-
  only if it stayed docs).

## Cut Option
- Cut 1 (primary): if ST-429 risks the causal EXACT pin or the dist ceiling,
  E59 cuts to research + task list + close (ST-428 + ST-430) and the execution
  pass moves to E60 with the research already paid for.
- Cut 2: if YouTube grounding is thin/rate-limited, fall back to web research
  ONLY (task list labels the reduced grounding explicitly).

## Deferral (explicitly out of E59)
- WebGPU switch (F1/F2/F3 unmet - docs/architecture/webgpu-re-eval-E56.md;
  I457 re-confirmed).
- Camera feel rework (E57 shipped the 3-mode + RM system; micro-tune only if
  ST-429 frees budget and the research ranks it P0 - otherwise E60+).
- New enemy types / enemy ladder slot (E60 candidate - separate scope).
- Hero/boss GLB re-re-master (tri headroom 1,221 is nearly consumed).
- Audio/music (design/audio-music.md remains pending, separate arc).

## Recommendation
PROCEED with the 3-story scope. ST-428 is docs-only (zero pin risk). ST-429 is
the only risky story and is gated by the standard bar + the causal-EXACT
requirement. ST-430 is the close gate. Total E59 budget envelope: <= 100 KB
dist, <= 1,000 tris, zero core changes.

## Risks
- R1: research staleness - mitigated by re-measuring every "current state"
  number from the live tree (Grounding section above, re-read I458).
- R2: an art pass may move the playframe pins (tri delta) - EXPECTED and
  acceptable; pins re-pin with decomposition (I456 precedent), causal must
  stay EXACT (art never touches core).
- R3: dist headroom 126,662 B is finite - every task-list row carries a KB
  budget; total P0 envelope <= 100 KB leaves >= 26 KB margin to the floor.
- R4: YouTube grounding on "web 3D arcade art direction" may be thin - Cut 2
  covers it; the task list labels research provenance per row.
- R5: frozen-identity regression (bloom 0.72 / I334 grade) - ST-429 work may
  ADD glow but must not re-tune the frozen constants; any constant change is a
  scope violation and stops for a producer decision.

## Changed files or proposed files
- I458 (this open, DOCS-only): production/scope-check-E59.md (NEW - this file),
  production/epics.md (E59 section), production/stories.md (E59 block + STATUS),
  production/timeline.md (I458 line), production/iterations.md (I458 entry),
  CHANGELOG.md (I458 line), production/session-state/active.md (I458 note).
  Zero design docs yet (ST-428's job). Zero src/asset/test.
- ST-428: design/art-direction-research-E59.md (NEW), design/art-task-list.md (NEW).
- ST-428 (I459): DONE - art-direction-refresh (docs-only): design/art-direction-research-E59.md (SUPERSEDES the E9-era doc; YouTube + web grounding: inverted bullet colors, one-danger-color, light-rim-on-dark, shader-stable hit feedback, ring-buffer trails, starfield layers, role-named material kit) + design/art-task-list.md (P0: A1 player L3 bullet cool/warm fix 0 KB, A2 shared enemy fresnel rim <= 8 KB, A3 shader-stable ship damage flash <= 4 KB + 200 tris; P0 envelope 12 KB / 200 tris of the 100 KB / 1,000 tris budget; P1: B1 role palette, B2 boss warning card, B3 starflares, B4 afterburner ribbon; P2: bomb hue, value-band audit, fog, nebula shells). P0 envelope lands at 12 KB / 200 tris (of the 100 KB / 1,000 tris budget); execution order A1 -> A2 -> A3 (A3 defers to E60 if the combined perf probe fails).
- ST-429: TBD from the task list (src/render/*, possibly assets/).
- ST-429 (I460): DONE - A1+A2+A3 all landed (zero core, causal EXACT): A1 player L3 bullet 0xffd27a->0xd6f6ff (cool-vs-threat split restored at max weapon), A2 shared fragment-only fresnel rim src/render/enemyRim.js on 7 roles (peak luma <= 29, 0 added draw calls), A3 pre-created unlit ship damage-flash shell (80 tris, visible=false idle, RM-gated). P0 envelope spent ~12 KB / 80 tris of the 100 KB / 1,000 tris budget; busy460 rim/flash deltas 0.0-0.2 ms, draw-call parity 299=299; playframe pins UNCHANGED (no re-pin).
- ST-430: .evidence/I461/ probes (fresh harness copies).
- ST-430 (I461): DONE - fresh R1-R5 + G59.0 gate, probe-only, zero src: causal461 EXACT 18/18 (zero core drift), playframe461 A 21/14,530 + 10/180 EXACT + B 50/32,826 (no re-pin), camera 3x3 + RM gate PASS (maxConv 3.93e-5, OVERVIEW worstRim 0.8362 x3, RM drop 8.981), ship views SHIP_OK (flash shell absent idle), PWA 11/11, 1027/1027 + build 0 + dist 2,875,336 B / 148 + vendor PIN_OK + hygiene. WebGPU re-confirmation: F1 (sustained >~200k tris - measured 28,779 GLB total / 32,826 worst window), F2 (vendor r171+ - frozen r160, 76DEA8151BC9352A), F3 (user mandate - none) all UNMET -> KEEP WebGL2 documented. G59.0 PASS; E59 CLOSED at I461 (ST-428..430 3/3).

## Verification evidence (I458, docs-only gate)
- npm test 1027/1027 + npm run build 0 + dist byte-identical 2,873,338 B / 147
  + vendor sha256-16 76DEA8151BC9352A unchanged + hygiene (no servers, no
  chrome, node-only).

## Next owner or decision
I459 = ST-428 (art-direction refresh + budgeted task list, docs-only). Owner:
studio orchestrator routing to producer (research) + creative-director (art
contract review). No decision needed from the user - this arc executes their
standing suggestion.
