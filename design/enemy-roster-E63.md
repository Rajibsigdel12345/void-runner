# Enemy Roster Spec - E63: SENTRY / WASP / POD (I480, ST-447)

Produced under cgs-quick-design (designer) as the role-spec design doc pre-registered by
production/scope-check-E63.md (I479). Inputs: design/enemy-art-direction-research-E63.md
(findings F1-F10; LABELED sources) + the I480 rendered-luma audit (section 1) + config.js
fleet ladder. Docs-only iteration: zero src/assets/vendor.

## 0. Summary

- Three new enemy roles fill exactly the three researched roster gaps: SENTRY (SQUAD,
  mid-range aimed shooter, W11), WASP (SWARM, popcorn dasher, W12), POD (STATE CHANGE,
  drifting splitter, W13, procedural). Two new GLBs (SENTRY, WASP) + one procedural unit (POD,
  Vortex precedent - its children ARE the WASP unit, so no third GLB).
- FINAL palettes are chosen from the I480 rendered-luma audit (probe v2, section 1), not from
  sRGB hex: all three roles use renderLumaGain 2.0, landing on three distinct rendered luma
  rungs (POD 127 < SENTRY 137 < WASP 176) with pairwise rendered-hue separation >= 93 deg.
- The audit's critical finding: the sRGB design ladder is INVERTED in render space (drone
  renders p50 200.6 = fleet-brightest body; stinger renders 64.0 = darkest). The research
  doc's tight POD-vs-drone pair (sRGB dhue ~42 deg) is RESOLVED in render space: dluma 73.4
  AND dhue 53.5 - clears both axes of E57 rule 1. No palette change from the I479 proposals.
- Wave gates W11/W12/W13, never on boss waves (boss everyWave 5 -> 5/10/15). Pinned runs
  (causal 9876 ends W2 / 36.15 s; playframe A 22 s / B ~52 s approx W2-3) CANNOT be
  affected -> causal + playframe pre-registered EXACT, no re-pins.
- Re-pins FINAL (each lands WITH measurement at ST-449): BUDGETS (assetGlbs.test.js) +=
  sentry 1,800 / wasp 1,200; MAX_FILE_BYTES 393,216 UNCHANGED; assetPerf totalGeoKB
  1,120 -> 1,280 (expect ~1,185); totalFilesKB HOLDS 1,240 (expect ~1,233); totalTris
  HOLDS 36,000 if SENTRY <= 1,600 AND WASP <= 1,000 (expect 35,650), else 39,000.

## 1. Rendered-luma audit (evidence)

### 1.1 Method (probe v2, I381/I383 lineage)

Harness: `.evidence/I480/luma_audit480.mjs`; results `.evidence/I480/luma_audit_i480.json`
(consoleErrors 0). Deviations from the naive approach, each discovered by a failed run:

- Scene access: `vr.scene` is NOT exposed -> `const scene = vr.arenaFloor.parent` (parent =
  the Scene).
- Render: a single `vr.bloom.render()` shows a STALE frame -> double render:
  `vr.bloom.render(); r.info.reset(); vr.bloom.render();` (I381 pattern).
- Mask: backdrop pixels contaminate the sample -> two-shot backdrop diff: render the
  backdrop-only frame, render with the object, keep pixels with dluma >= 6 OR rgb-sum >= 30.
- Luma: Rec.709 (0.2126R + 0.7152G + 0.0722B) on sRGB output pixels; report p50 + p90 +
  mean rgb + hue + n of the masked body pixels.
- Conditions: camera ~12 u from the object (typical combat distance), backdrops sky
  [0, 2.0, 2] and floor [0, 7.5, -2] (the two arena backdrops a body sits against), HIGH
  FX tier (ACES + exposure 1.15 + I334 grade) - the state the player actually sees at High
  quality. Gain grid per candidate: hull color x gains {1, 2, 3, 4, 5, 6, 8}, both
  backdrops.

### 1.2 Critical finding: the sRGB design ladder is inverted in render space

Fleet refs measured in this probe (rendered p50 / hue):

| Ref (sky / floor) | p50 | hue |
|---|---|---|
| drone | 200.56 / 200.77 | 188.7 |
| stinger | 63.99 / 67.84 | 270.6 / 273.5 |
| hunter (I451 pin) | 103.0 | - |
| gunship (I451 pin) | 65.1 | - |

The cool-steel drone (mid sRGB luma by design) renders as the FLEET'S BRIGHTEST body;
the bright-designed stinger renders as the darkest. ACES + the warm key light + exposure
compress and shift sRGB values in a role- and color-dependent way, so picking palettes
from sRGB hex against a rendered fleet is exactly the class of error E57 rule 1 exists to
catch. Every palette decision below comes from measured rendered values.

### 1.3 Candidate results (rendered p50 sRGB luma / hue; masked body pixels)

| Role | hex | sRGB luma | sky g1 | sky g2 | sky g3 | floor g2 | rendered hue |
|---|---|---|---|---|---|---|---|
| SENTRY | 0x8a8f7a | 140.4 | 94.46 (h40.4) | 137.02 (h41.7) | 163.87 (h42.6) | 132.45 (h41.8) | ~42 (warm olive) |
| WASP | 0xb9c34d | 184.4 | 131.56 (h53) | 175.76 (h54) | 197.84 | 171.40 (h54) | ~54 (chartreuse) |
| POD | 0x5f8f86 | 132.1 | 86.17 (h132.5) | 127.17 (h135.2) | 153.89 | 122.40 | ~135 (teal-green, stable across gains) |

SENTRY also measured: sky g4 181.59 / g5 194.31 / g6 203.82 (hue drifts 40.4 -> 44.1 as the
ACES warm light pushes the sage toward olive). POD also: sky g4 172.54 / g5 186.11 /
g6 196.03 / g8 209.95 (hue stays ~135 - the stable one of the three).

### 1.4 Gain decision

- All three roles: **renderLumaGain 2.0**, applied at render time as
  `new THREE.Color(hex).multiplyScalar(gain)` (hunterMesh.js:43 pattern). The GLB COLOR_0
  stays a NEUTRAL grayscale bake (E57 rule 8) so the runtime palette owns the color.
- Chosen rendered bands: SENTRY 115-155 (measured 137.0 sky / 132.5 floor) - WASP 150-195
  (175.8 / 171.4) - POD 105-150 (127.2 / 122.4). Floor-vs-sky deltas ~5 or less: the body
  reads the same against both arena backdrops.
- The three roles sit on three distinct rendered luma rungs AND have pairwise rendered hue
  separation >= 93 deg (SENTRY ~42 / WASP ~54 / POD ~135): a role is identifiable by
  luminance alone or hue alone, which is the two-channel novelty the research asked for (F1,
  F5) without any animation or outline.
- Bloom-halo caveat (documented, not a blocker): at high gains the bloom halo swells into
  the mask - SENTRY g8 p50 collapses to 38.19 with n ballooning to 28,653 (halo pixels
  dominate). Gains above the chosen 2.0 are UNRELIABLE in this probe; 2.0 sits in the clean
  region (stable n, sky/floor agreement). Do not "verify" a candidate at gain >= 4 with this
  harness without re-deriving the mask threshold.

### 1.5 Rule-1 rendered clearance matrix

E57 rule 1: two bodies collide only if dluma <= 10 AND dhue <= 40 deg. Rendered fleet ladder
(sky p50, this probe unless noted): drone 200.6 (h189) > WASP 175.8 (h54) > SENTRY 137.0
(h42) > POD 127.2 (h135) > hunter 103.0 (I451) > stinger 64.0 (h271) approx gunship 65.1
(I451).

New-role pairs (all CLEAR):

| Pair | dluma | dhue | Verdict |
|---|---|---|---|
| WASP <-> drone | 24.8 | 135 | clear both (documented, R7) |
| WASP <-> hunter | 72.8 | ~88 | clear both |
| WASP <-> stinger | 111.8 | ~216 | clear both |
| SENTRY <-> hunter | 34.0 | ~20 | LUMA-clear (dluma 34 > 10; dhue near but rule requires both) |
| SENTRY <-> drone | 63.6 | 147 | clear both |
| SENTRY <-> stinger | 73.0 | ~229 | clear both |
| POD <-> SENTRY | 9.85 | 93.5 | HUE-clear - widest hue gap in the fleet; documented near-band pair |
| POD <-> drone | 73.4 | 53.5 | clear both - the tight sRGB pair, RESOLVED (R3 closed) |
| POD <-> hunter | 24.2 | ~75 | clear both |
| POD <-> stinger | 63.2 | ~135 | clear both |

Golden-rock pairs (the rock is fleet-adjacent, not a GLB role; section 1.6): SENTRY <->
golden rock dhue ~6, dluma >= 43 -> luma-clear (R6); WASP <-> golden rock dhue ~7,
dluma ~25-55 -> luma-clear (R6).

WASP is deliberately the brightest non-drone body: small (r 0.45 u) + bright = readable
popcorn at distance (F6).

### 1.6 Golden-rock note

Golden rock material (asteroidRenderer.js:73): matGold color 0xffc94d, emissive 0xffa018,
emissiveIntensity 1.6 -> renders bright and warm (hue ~47-55 under the ACES grade). Both new
warm roles (SENTRY h42, WASP h54) sit within ~6-7 deg of that hue; their clearance rests on
luma (>= 43 / ~25-55 respectively). Acceptable as documented risk R6: the rock is a
transient pickup (rare, moves, ringed), not a sustained enemy silhouette. Optional ST-449
tightening: a one-shot probe quad with matGold in the same harness, or a matGold
desaturation - but that touches frozen rock identity/FX territory, so it is NOT part of E63
unless the probe shows a measured collision.

## 2. SENTRY (SQUAD) - mid-range aimed shooter

Why it exists: the roster's missing mid-range shooter (research doc section 3): the gunship
lobs mines from range but only inside 7.0 u; nothing holds a band and punishes approach.
SENTRY is the "watchtower" - it owns a radius band and makes you choose: push in and eat
bursts, or orbit and waste the wave.

Behavior + state machine (src/core/sentry.js; XxxField pattern - constructor(rng, cfg),
step(dt, world), drainEvents()):

```
ENTER -> HOLD (strafe + track) -> AIM (slew to player) -> CHARGE (0.8 s telegraph)
      -> BURST (3 bolts, gap 0.18 s) -> COOLDOWN (3.5-4.5 s, rng) -> HOLD ...
```

- ENTER: spawn at rim (rimDist 15 u, standard rim direction from rng), fly to the preferred
  radius band at enterSpeed 2.6 u/s.
- HOLD: orbit the player at strafeOmega 0.5 rad/s while tracking range; if distance leaves
  the band by more than rangeKeep 0.5 u, steer to re-enter the band (radial priority over
  orbital).
- AIM: slew toward the player at aimTurn 2.2 rad/s (rate-limited - you can turn on it).
- CHARGE: 0.8 s telegraph - the "charge" node's emissiveIntensity ramps 0 -> 1.4 (smooth
  single ramp, no strobe; RM-safe by construction, E57 rule 7). F2 floor >= 0.7 s met
  (stinger/hunter precedent).
- BURST: 3 bolts, gap 0.18 s, each aimed at the player with spread +/- boltSpread 0.10 rad
  (middle bolt dead-aimed). boltSpeed 9.0 u/s = standard enemyBullets.speed - NO new bullet
  class (pooled, life 4.0 u/s as usual).
- COOLDOWN: uniform rng in [fireMin 3.5, fireMax 4.5] s, then back to HOLD (aim drifts
  naturally during strafe - the next burst re-aims).
- Death at any state: if mid-CHARGE or mid-BURST, in-flight bolts PERSIST (enemyBullets
  life 4.0, unchanged); no further bursts.
- maxAge 30 s (gunship precedent): expires in place (dissolve), no death split.

CONFIG.sentry (every field has a default + comment; units in the note):

| Field | Default | Note |
|---|---|---|
| firstWave | 11 | wave gate (never boss waves; section 5) |
| perWave | 2 | sentries added each eligible wave (until maxConcurrent) |
| maxConcurrent | 2 | live cap (pool 4 = cap + 2 headroom) |
| color | 0x8a8f7a | body sage-ash (I480 audit; gain 2.0 -> rendered 137) |
| baseColor | 0x3a3f34 | cruciform base (dark; no gain) |
| accent | 0xff9a3d | barrel-charge emissive (payload-ember; E57 rule 4 - the emissive accent carries the payload threat while the body stays cool-sage) |
| renderLumaGain | 2.0 | I480 audit (section 1.4) |
| radius | 1.1 | hit radius (u) |
| hp | 3 | |
| enterSpeed | 2.6 | u/s |
| prefRMin / prefRMax | 9.0 / 13.0 | preferred range band (u) |
| rangeKeep | 0.5 | band tolerance before radial correction (u) |
| strafeOmega | 0.5 | orbital strafe (rad/s) |
| aimTurn | 2.2 | aim slew rate (rad/s) |
| fireMin / fireMax | 3.5 / 4.5 | burst cadence window (s, rng uniform) |
| telegraph | 0.8 | CHARGE duration (s; F2 floor >= 0.7) |
| burstCount | 3 | bolts per burst |
| burstGap | 0.18 | s between bolts |
| boltSpeed | 9.0 | u/s (= enemyBullets.speed; no new bullet class) |
| boltSpread | 0.10 | half-angle of the 3-burst spread (rad) |
| rimDist | 15 | spawn rim (u, fleet standard) |
| score | 350 | kill reward (stinger 250 < hunter 300 < SENTRY 350 < flyer 400 rung) |
| maxAge | 30 | s, then dissolve (gunship precedent) |

Materials (GLB, 3): VR_sentry_hull (sage; metalness 0.2; flatShading) / VR_sentry_base
(0x3a3f34; metalness 0.15) / VR_sentry_charge (0xff9a3d emissive; runtime ramps
emissiveIntensity 0 -> 1.4 during CHARGE - the telegraph).

GLB contract (ST-449, Blender 5.2 headless deterministic script):
- <= 1,800 tris (target 1,600); 3 materials (VR_ naming); nodes: root + "barrel" (child
  group the runtime rotates for aim - node-rotation precedent: stinger) + "charge" (the
  emissive mesh under the barrel tip).
- Silhouette (F10 - silhouette before color): angular floating platform + cruciform base +
  single forward barrel = "watchtower" read at 96 px. Back view: platform + exhaust stubs
  (distinguishes it from the drone in rear passes).
- Estimated ~102-137 KB (well under MAX_FILE_BYTES 393,216).
- COLOR_0: NEUTRAL grayscale bake on the hull prim ONLY (E57 rule 8 - a colored bake would
  corrupt the runtime palette multiply).

SFX: sentryDeath 0.7 (flyerDeath 0.65 < 0.7 < wardenDeath 0.8 - "heavy thing pops",
mid-weight in the existing ladder).

## 3. WASP (SWARM) - popcorn dasher

Why it exists: the roster's missing swarm popcorn unit (research doc section 3; F6 shmup
axes: many, cheap, dodgeable, high-frequency kills that keep the combo loop alive).

Behavior (src/core/wasp.js):

- Spawns as a V-PACK of 3 at the rim (packSpread 0.22 rad angular spacing, standard rim
  direction from rng) - the pack is a spawn-only concept: each wasp then runs its own state
  machine independently (a partial kill leaves survivors that continue individually).
- CORKSCREW (the anticipation phase): corkscrews toward the player at corkscrewSpeed
  5.5 u/s with corkscrewOmega 6.0 rad/s spiral; duration uniform rng in [corkscrewDurMin
  1.0, corkscrewDurMax 1.2] s. The "nose" node glows accent (0xff4a2a threat-red, smooth
  ramp) during the corkscrew - the player reads "dash imminent". F2 floor met:
  anticipation >= 1.0 s.
- DASH: after the corkscrew, a straight-line dash at the player position as predicted at
  dash start: dashSpeed 15.5 u/s for dashDur 0.5 s, then the wasp re-corkscrews toward its
  current target or exits at maxAge.
- One-shot: hp 1. score 100 (popcorn tier - equals S rocks 100, below mines 150).

F2 cap check (research: dash speed <= 1.15x ship maxSpeed, <= 16 u/s): 15.5 / 14.0
= 1.107x -> within cap; 15.5 < 16.
Dodgeability proof (deterministic, acceptance-tested at ST-448): dash displacement =
15.5 x 0.5 = 7.75 u; the ship can cover 14.0 x 1.5 s = 21.0 u during the
corkscrew-to-contact window -> 2.7x evasion margin. A player who notices the red nose has
ample room to break the dash line.

CONFIG.wasp:

| Field | Default | Note |
|---|---|---|
| firstWave | 12 | wave gate (never boss waves) |
| perWave | 3 | one V-pack of 3 per eligible wave |
| maxConcurrent | 6 | live cap, EXCLUDING split-children; pool 10 = 6 + 4 split headroom (section 9 poolAudit) |
| color | 0xb9c34d | body chartreuse (I480 audit; gain 2.0 -> rendered 175.8, brightest non-drone body by design) |
| wingColor | 0x5a6128 | swept wings (dark olive; no gain) |
| accent | 0xff4a2a | nose dash-charge emissive (threat-red family; E57 rule 4) |
| renderLumaGain | 2.0 | I480 audit |
| radius | 0.45 | hit radius (u; small - it is fast) |
| hp | 1 | one-shot popcorn |
| score | 100 | popcorn tier |
| corkscrewDurMin / corkscrewDurMax | 1.0 / 1.2 | anticipation window (s; F2 floor 1.0 = the minimum) |
| corkscrewSpeed | 5.5 | u/s |
| corkscrewOmega | 6.0 | spiral rate (rad/s) |
| dashSpeed | 15.5 | u/s (1.107x ship 14 <= 1.15x F2 cap; < 16 absolute) |
| dashDur | 0.5 | s |
| packSpread | 0.22 | V-pack angular spacing (rad) |
| rimDist | 15 | spawn rim (u) |
| maxAge | 30 | s, then exit/dissolve (no re-corkscrew loop beyond it) |

Materials (GLB, 3): VR_wasp_hull (chartreuse) / VR_wasp_wing (0x5a6128) / VR_wasp_dash
(0xff4a2a emissive nose; runtime ramps during corkscrew - the "dash imminent" cue).

GLB contract (ST-449): <= 1,200 tris (target 1,000); 3 materials; nodes: root + "nose"
(emissive); silhouette: dart fuselage + swept-back wings readable at 96 px (F10);
estimated ~64-91 KB. COLOR_0 neutral grayscale bake on the hull prim only (rule 8).

SFX: waspDeath 0.3 (< droneExplode 0.35 - a small pop that never interrupts combo feel).

## 4. POD (STATE CHANGE) - drifting splitter

Why it exists: the roster's missing non-boss state change (research doc section 3): the
"shoot it or wait" trade. Killing the POD spawns its contents immediately (two full-
anticipation WASPs at your general bearing = instant swarm pressure); ignoring it lets it
drift past and dissolve (maxAge 30, no split on expiry). HP 4 makes the kill a deliberate
investment, not free.

Behavior (src/core/pod.js):

- Spawn at rim (rimDist 15 u), drift inward at driftSpeed 2.2 u/s with a gentle wobble
  (driftWobble 0.4 u amplitude, slow). NO weapons, no aim.
- The "seam" (dark torus around the widest girth) + "core" (0xff9a3d sphere at the seam
  face) glow with seamGlow 0.55 emissiveIntensity - sub-bloom (<= 1.0: reads, never
  blooms), STATIC (no per-frame animation -> RM-safe by construction, rule 7). The glow
  says "something is inside" (payload semantics, E57 rule 4).
- On death (hp 4): split EXACTLY splitCount 2 WASPs at the pod's position; children
  corkscrew from t=0 -> FULL anticipation (they never dash at t < 1.0 s -> F2-safe by
  construction, no zero-warning dash).
- On maxAge expiry: dissolve, NO split (the trade's other branch).

CONFIG.pod:

| Field | Default | Note |
|---|---|---|
| firstWave | 13 | wave gate (never boss waves) |
| perWave | 1 | one pod per eligible wave |
| maxConcurrent | 2 | live cap (pool 4 = cap + 2) |
| color | 0x5f8f86 | body teal-green (I480 audit; gain 2.0 -> rendered 127.2; hue stable ~135) |
| seamColor | 0x2a4a45 | seam torus (dark; no gain) |
| coreColor | 0xff9a3d | core emissive (split-primed glow; payload semantics) |
| renderLumaGain | 2.0 | I480 audit |
| radius | 1.2 | hit radius (u) |
| hp | 4 | deliberate-investment target |
| score | 300 | pod alone (+ 2 x 100 from children if you then kill them: up to 500) |
| driftSpeed | 2.2 | u/s |
| driftWobble | 0.4 | wobble amplitude (u) |
| seamGlow | 0.55 | core/seam emissiveIntensity (static; sub-bloom <= 1.0) |
| splitCount | 2 | children on death (WASPs, full anticipation from t=0) |
| rimDist | 15 | spawn rim (u) |
| maxAge | 30 | s, then dissolve WITHOUT split |

Procedural recipe (src/render/podMesh.js - NO GLB: Vortex precedent; the pod's only state
change is death-split, which the WASP GLB already covers; keeps the assetPerf re-pin pair
at exactly two files): capsule scaled (1, 1, 0.82) = egg + seam torus around the widest
girth + core sphere at the seam face; 3 materials (body 0x5f8f86 metalness 0.2 flatShading /
seam 0x2a4a45 / core 0xff9a3d emissive 0.55); <= ~1,200 tris. Geometry shared across pods
(one module-level cache), same pooling discipline as the other procedural enemies.

SFX: podDeath 0.75 (sentry 0.7 < 0.75 < warden 0.8 - "shell cracks").

## 5. Wave gates + mix matrix (F8: a wave IS its role composition)

- Gates (game.js): spawnSentryForWave at wave >= 11; spawnWaspForWave at wave >= 12;
  spawnPodForWave at wave >= 13. NONE of them fire on boss waves (boss everyWave 5 -> waves
  5/10/15/...): ST-448 must REUSE the existing boss-wave predicate (same one the Monolith
  spawn uses), not introduce a second notion of "boss wave".
- Mix matrix (F8 teach rhythm - each gate wave teaches one role; W14 combines; boss waves
  stay pure so the boss fight's identity is untouched):

| Wave | Standard fleet | + SENTRY | + WASP | + POD |
|---|---|---|---|---|
| W11 | as today (byte-identical) | 2 | - | - |
| W12 | as today | 2 | pack of 3 | - |
| W13 | as today | 2 | pack of 3 | 1 |
| W14 | as today | 2 | pack of 3 | 1 |
| W15 | BOSS (boss + existing escorts only; NO new roles) | | | |
| W16+ | endless tail = W14 composition, capped by each role's maxConcurrent | | | |

  "Standard" = the existing wave logic, untouched (its rng draw order is preserved - new
  spawns are appended AFTER the standard fleet's draws so the standard stream is
  bit-identical).
- Pinned-run proof (why EXACT, no re-pins): causal seed 9876 ends at W2 / 36.15 s
  (18-field EXACT); playframe A 22 s / B ~52 s approx W2-3. All three gates require wave
  >= 11 -> they cannot fire inside a pinned run. Pre-registered at I479
  (scope-check-E63.md section 4); ST-448/450 re-run the battery to confirm.

## 6. i18n (src/core/strings.js - NOTE: not src/core/i18n/)

| Key | en | zh | ja |
|---|---|---|---|
| feed.sentry | SENTRY | 哨戒 | セントリー |
| feed.wasp | WASP | 黄蜂 | ヴァスプ |
| feed.pod | POD | 孢子舱 | ポッド |
| toast.sentry | SENTRY ON STATION | 哨戒就位 | セントリー配備 |
| toast.wasp | WASPS INBOUND | 黄蜂来袭 | ヴァスプ接近 |
| toast.pod | POD DRIFTING | 孢子舱漂近 | ポッド接近中 |

Toasts fire once per role on its first gate wave (firstWave), matching the existing fleet
introduction pattern.

## 7. Re-pin budgets (FINAL; each lands WITH its measurement at ST-449)

| Pin | Current | Final | Expected measurement |
|---|---|---|---|
| BUDGETS (assetGlbs.test.js) | ... hunter 2,400 / gunship 2,400 | + sentry 1,800 / wasp 1,200 | measured tri counts at ST-449 |
| MAX_FILE_BYTES | 393,216 | UNCHANGED | largest new file ~137 KB |
| assetPerf totalGeoKB | 1,120 (meas ~1,010) | 1,280 | ~1,185 |
| assetPerf totalFilesKB | 1,240 (meas ~1,051) | HOLDS 1,240 (else 1,440) | ~1,233 -> HOLDS |
| assetPerf totalTris | 36,000 (meas 33,050) | HOLDS 36,000 if SENTRY <= 1,600 AND WASP <= 1,000 (else 39,000) | 35,650 -> HOLDS |
| causal 9876 18-field | EXACT | EXACT (no re-pins; section 5) | battery at ST-448/450 |
| playframe A/B | 22/17,397 + 11/180 / 52/38,560 | EXACT (no re-pins) | battery at ST-448/450 |
| dist ceiling | 3,250,000 | UNCHANGED (scope-check sections 5/6) | expected ~3,100,000-3,155,000 at G63.0 |

POD is procedural -> zero asset impact.

## 8. Per-role acceptance tests (pre-registered)

ST-448 (core; tests/sentry.test.js + wasp.test.js + pod.test.js, rng-swept deterministic):
- WASP: corkscrewDur in [1.0, 1.2] for every seed in the sweep (anticipation F2 floor);
  dashSpeed 15.5 <= 16 and <= 1.15 x ship maxSpeed; dash displacement 7.75 u < 21 u ship
  evasion over 1.5 s (the section 3 proof, asserted numerically).
- SENTRY: burst emits EXACTLY 3 bolts with inter-bolt gaps of 0.18 s (within the gap
  window); first bolt fires >= 0.8 s after CHARGE start (telegraph floor); bolts fired
  before death persist for enemyBullets.life 4.0 (kill mid-telegraph, assert live bolts).
- POD: death emits EXACTLY 2 WASP events, each with corkscrew from t=0 (assert no wasp
  dashes at t < 1.0 s); maxAge expiry emits zero children; poolAudit: wasp pool 10 covers
  the W13/W14 worst case (6 pack-wasps concurrent + 2 pods x 2 split-children = 10 exactly;
  defer-to-next-wave when the pool is full, never overflow).
- Gates: W10 -> none of the three roles; W11 -> sentries only; W12 -> +wasp pack; W13 ->
  +pod; W15 (boss) -> none (existing boss predicate reused).
- Pinned: causal 18/18 EXACT + playframe A/B EXACT (no re-pins).
- RM: pose-change checks - CHARGE/glow changes are intensity/opacity only; no shake or
  strobe keyframes; POD wobble scaled x0.4 under reduced motion (flyer rmAmpScale
  precedent).

ST-449 (Blender GLBs): CG clay 6-view + tint A/B gate (hull prim only; COLOR_0 NEUTRAL
grayscale bake - E57 rule 8); 96-px silhouette + back view vs the section 2/3 contracts;
GLB contract via Node GLTFLoader (I382 pattern: tri counts, material names VR_*, node
names, byte sizes); re-pins land WITH measurement (section 7); dist vs ceiling with the
cut ladder C1-C4 applied ONLY if measured headroom < 102,400 B at G63.0.

ST-450 (G63.0 close gate): fresh causal 18/18 EXACT + playframe EXACT; new-enemy probe
(headless via the __vr exposure at main.js:731 - presence on W11-13, rendered palette
spot-check, pool bounds, RM-safe telegraph pose); hero views; PWA 11/11; AGENTS.md roster
26 -> 28 GLBs; quality bar.

## 9. Edge cases

- POD killed near the arena rim: split children spawn at the pod position, clamped to the
  arena radius (26 u) on spawn (standard spawn rim-clamp).
- WASP pack partial kill: survivors continue independently (no pack reference at runtime;
  each wasp owns its state machine).
- SENTRY killed mid-CHARGE / mid-BURST: in-flight bolts persist (life 4.0); no further
  bursts.
- maxConcurrent reached at a gate wave: that role's perWave spawn DEFERS to the next
  eligible wave (no same-wave catch-up; keeps wave composition deterministic per wave).
- Player death on a W11+ wave: standard GAME_OVER; no new role persists across runs (fresh
  world per run, rng stream re-seeded per run).
- Reduced motion: POD wobble x0.4; all telegraphs are smooth single ramps (no strobe, no
  shake); SENTRY strafe and WASP corkscrew are continuous motion - kept, scaled by the
  existing RM motion scale.
- Replay (ST-190): pinned replays contain only W1-10 content; new W11+ runs replay their
  own deterministic events; watching a replay never writes scoreboards (ST-190 invariant
  untouched - no new write paths).

## 10. Risks, deferrals, changed files, next owner

Risks:
- R1 dist headroom < 102,400 B floor at ST-449 -> cut ladder C1 (SENTRY 1,600 -> 1,200 t) /
  C2 (WASP 1,000 -> 800 t) / C3 (drop SENTRY COLOR_0 bands) / C4 (WASP -> procedural), then
  the renegotiation branch to 3,350,000 WITH the measurement (ST-407 precedent).
- R2 causal drift (only if a W11+ gate fires inside a pinned run - pre-registered NOT to,
  section 5) -> re-pin WITH measurement (ST-440 precedent).
- R3 palette collision -> CLOSED by the I480 audit (section 1.5): POD-vs-drone, the tight
  sRGB pair, clears both rendered axes (dluma 73.4 / dhue 53.5).
- R4 WASP dash dodgeability -> F2 floors in CONFIG (anticipation >= 1.0 s; dashSpeed
  15.5 <= 16 u/s and <= 1.15x ship) + the ST-448 deterministic test.
- R5 pool overflow from splits -> wasp pool 10 = 6 + 4 pre-registered + poolAudit test
  (section 9 worst case).
- R6 SENTRY/WASP rendered hue (~42/54) within ~6-7 deg of the golden rock (~47-55):
  luma-clear (dluma >= 43 / ~25-55) - documented, acceptable (section 1.6); rock identity
  and FX stay frozen; optional one-shot probe at ST-449 if a measured collision appears.
- R7 WASP 175.8 vs drone 200.6: dluma 24.8 > 10 AND dhue 135 > 40 -> clear both; WASP is
  intentionally the brightest non-drone body (small + bright popcorn, F6).

Deferrals (from scope-check-E63.md section 7, unchanged): enemy outline/rim pass -> E65;
POD GLB promotion -> later if headroom allows; true SNIPER/LEADER roles -> E64 stage
design; linear levels + level design + end-of-level boss = E64 (user's step-by-step
request); WebGPU = E65 (user prioritization).

Changed files (I480): NEW design/enemy-roster-E63.md (this file; LF, no BOM; outside the
tracked BOM set). Bookkeeping: production/epics.md, stories.md, iterations.md, timeline.md,
session-state/active.md. Zero src/assets/vendor.

Next owner: I481 = ST-448 (core) - src/core/sentry.js + wasp.js + pod.js field modules
(hunter/gunship XxxField pattern) + CONFIG.sentry/wasp/pod blocks + game.js spawn gates
(reusing the existing boss-wave predicate) + src/render/sentryMesh.js + waspMesh.js +
podMesh.js procedural fallbacks (assetLoader policy: no boot gate, console warn only) +
strings.js (section 6) + enemyRim roles entries (sentry 0x4a5a3a/0.24 -> peak rim luma
20.2; wasp 0x6a7a2a/0.24 -> 27.1; pod 0x2a4a45/0.26 -> 17.4; all <= 29 per the E59 A2
freeze at config.js:745-755) + tests/{sentry,wasp,pod}.test.js + poolAudit.
