# Enemy Remaster Frozen Spec - Void Runner (E68, I507)

ST-473 (I507) / E68. Docs-only iteration: this doc FREEZES the full contract the
ST-474 / ST-475 Blender remaster builds get checked against - per-role shape
languages (verbatim from design/enemy-remaster-research-E68.md section 4), per-node
triangle AIM/CAP tables, the palette / luma re-ladder with current CONFIG ground
truth (verified I507), the GLB contract, and the per-asset CG gate checklist.
Changing any frozen value below requires a scope-check pass + producer sign-off
(cgs-scope-check); builds do not self-negotiate against this table.

## 1. Scope + invariants

- 8 assets in scope: legacy-4 (stinger, drone, warden, flyer - net-new real ships at
  1,400 aim / 1,800 cap t) + remaster-4 v2 (hunter, gunship, sentry, wasp - rebuilds
  at 2,800 aim / 3,200 cap t).
- boss v2 UNCHANGED (I503 ACCEPTED, 398 t obelisk - out of scope by design).
- Pod is PROCEDURAL - not in scope (ST-448 precedent; the WASP unit IS its child).
- Runtime contract unchanged: assets/ GLB + GLTFLoader (src/render/assetLoader.js)
  with procedural fallback (E57 rule 10); node naming VR_<Asset>_<Node>.
- Gameplay numbers unchanged in ST-474/475 (geometry + bake only): radius/hp/score/
  pool all stay as configured; the endless path stays bit-identical. All re-pins land
  WITH MEASUREMENT at ST-476 (E67 ship-v6 precedent "tight").
- Budget pre-registration (production/scope-check-E68.md): fleet tri aim 16,690 /
  cap 19,850 (inside the pre-reg 16,800 / 20,000); dist ceiling renegotiation
  ~4,400,000 B WITH MEASUREMENT at ST-476; cut ladder C1-C4 on overrun.

## 2. Per-role shape languages (FROZEN)

Verbatim from design/enemy-remaster-research-E68.md section 4 (function-first
E63-F3; silhouette-first F10/Y-S1). "v2" = remaster-tier rebuild; legacy-4 are
net-new real ships.

- stinger = "needle": slender dart hull + swept twin tail fins + INLINE nose-spike
  glow (emitter in the nose line, not a ball) + rear exhaust. Fast single-hit
  interceptor.
- drone = "seeker-fly": round sensor-eye dome (front, a readable "eye") + short stub
  wings + small rear exhaust; insect language, not rock language.
- warden = "bulwark": solid hex hull + 3 THICK SYMMETRIC armor slabs (intentional
  plating, not debris) + exposed front-center core weak spot (ember glow only when
  armor breaks).
- flyer = "swift": broad flat swept wings + small magenta canopy dome + slim
  under-body; bird-glide silhouette, low and wide.
- hunter v2 = "manta": slender sharp sweep, RAISED SPINE (not a dome), core glow
  RECESSED in the spine notch (small, sub-bloom), fin-deploy W contract KEPT,
  secondary dark underside.
- gunship v2 = "brute": elongated hull + central spine + 2 PROTRUDING nacelles
  (exhaust read) + open forward bay WITH internal struts (not a crude notch) +
  layered panel bakes.
- sentry v2 = "watchtower": hex platform + 3 support struts + turret ring +
  CYLINDRICAL barrel with muzzle brake + small charge ring (not a ball).
- wasp v2 = "hornet": compact dart + short DOUBLE-BLADE wings (substantial, not
  paper) + narrow waist node + inline nose-spike glow (not a detached ball).
- boss: UNCHANGED.

Fleet-wide style rules (research findings F2/F6/F7):
- R-GLOW: glow must be an EMITTER (recessed, small, inline with a hull line) or a
  weak spot (warden-core style) - never a decorative ball. Cures the glow-sphere
  disease (hunter dome / sentry lollipop / wasp nose, I506 F6).
- R-VALUE: every COLOR_0 bake carries 2-3 value bands + panel breaks so the model
  reads at range from geometry-value alone (Y-S2 industrial-freighter read +
  E61-F2 bake lesson). Cures I506 F7 (zero surface detail on all 9).
- R-SIL: silhouette readable FRONT AND BACK at 96 px (E57 rule 2); the back read is
  a named CG-gate item, not a byproduct.

## 3. Per-node triangle AIM/CAP tables (FROZEN, I507)

AIM = the build target; CAP = the per-node hard ceiling. Asset total = sum of
nodes, and the ASSET CAP is binding even where the per-node caps sum above it
(gunship: per-node caps sum 3,260, asset cap 3,200 governs). Per-node tris measured
by .evidence audit_glb.cjs (Blender-space, post-export); the ST-476 contract assert
rejects actuals above cap.

### 3.1 legacy-4 (asset budget aim 1,400 / cap 1,800 t each)

| asset   | node                   | aim   | cap   | asset aim/cap |
|---------|------------------------|-------|-------|---------------|
| stinger | Hull                   | 560   | 700   | 1,400 / 1,760 |
| stinger | FinL+R (swept twin)    | 560   | 700   |               |
| stinger | Nose (inline-spike)    | 140   | 180   |               |
| stinger | Exhaust                | 140   | 180   |               |
| drone   | Body                   | 600   | 750   | 1,350 / 1,700 |
| drone   | Eye dome               | 200   | 250   |               |
| drone   | WingL+R (stubs)        | 400   | 500   |               |
| drone   | Exhaust                | 150   | 200   |               |
| warden  | Hull (solid-hex)       | 500   | 650   | 1,400 / 1,800 |
| warden  | Armor x3 (thick slabs) | 750   | 960   |               |
| warden  | Core (front weak-spot) | 150   | 190   |               |
| flyer   | WingL+R (broad-flat)   | 600   | 760   | 1,400 / 1,790 |
| flyer   | Body (slim)            | 480   | 620   |               |
| flyer   | Canopy (magenta)       | 200   | 250   |               |
| flyer   | Tail                   | 120   | 160   |               |

### 3.2 remaster-4 v2 (asset budget aim 2,800 / cap 3,200 t each)

| asset   | node                       | aim   | cap   | asset aim/cap |
|---------|----------------------------|-------|-------|---------------|
| hunter  | Hull + raised-spine        | 1,500 | 1,690 | 2,800 / 3,200 |
| hunter  | FinL+R (W-contract KEPT)   | 900   | 1,040 |               |
| hunter  | Spine recessed-core notch  | 250   | 300   |               |
| hunter  | Under (dark-underside)     | 150   | 170   |               |
| gunship | Hull + spine               | 1,400 | 1,600 | 2,800 / 3,200 |
| gunship | NacelleL+R (protruding)    | 1,000 | 1,160 |               |
| gunship | Bay + internal-struts      | 300   | 360   |               |
| gunship | Gun                        | 100   | 140   |               |
| sentry  | Platform                   | 800   | 900   | 2,800 / 3,200 |
| sentry  | Struts x3                  | 300   | 350   |               |
| sentry  | Turret ring + dome         | 900   | 1,030 |               |
| sentry  | Barrel cyl + muzzle-brake  | 550   | 640   |               |
| sentry  | Charge (RING, not ball)    | 250   | 280   |               |
| wasp    | Hull (dart + waist)        | 1,090 | 1,270 | 2,740 / 3,200 |
| wasp    | WingL+R (double-blade)     | 1,180 | 1,380 |               |
| wasp    | Nose (inline-spike)        | 240   | 280   |               |
| wasp    | Core (waist)               | 140   | 170   |               |
| wasp    | Fin                        | 90    | 100   |               |

### 3.3 Fleet totals (FROZEN)

- legacy-4: aim 5,550 / cap 7,050; remaster-4 v2: aim 11,140 / cap 12,800.
- Fleet: aim 16,690 t / cap 19,850 t - inside the scope-check pre-registration
  16,800 / 20,000 (110 t / 150 t headroom).
- Replaces the current fleet GLB total 7,144 t (I506 measured) - ~2.3x on aim.

## 4. Palette + luma re-ladder (FROZEN targets)

### 4.1 Current ground truth (verified I507 in src/core/config.js +
src/render/wardenMesh.js; rendered p50 from the I506 in-game audit)

| role    | CONFIG key / value                                            | gain | rendered luma / hue (I506)          |
|---------|---------------------------------------------------------------|------|--------------------------------------|
| drone   | palette.body 0x6f8796 steel-cyan                              | none | 184.5 / 189.7 cyan                   |
| stinger | palette.body 0x917fb9 violet (coreIdleGlow 0.09, I384)        | none | 65.7 / 280.2 violet                  |
| hunter  | body 0x9c5a46 rust + accent 0xff4a2a                          | 3.0  | 118.3 / 15.6 rust                    |
| gunship | body 0x39424e gunmetal + bay 0xff9a3d                         | 4.1  | 86.6 / UNSTABLE neutral (87/84/85)   |
| sentry  | body 0x8a8f7a sage + accent 0xff9a3d                          | 2.0  | 150.5 / 42.1 olive                   |
| wasp    | body 0xb9c34d chartreuse + accent 0xff4a2a                    | 2.0  | 177.3 / 48-51 chartreuse             |
| warden  | wardenMesh.js hull 0x2c3548 / armor 0x8fa3c8; rim 0x2e6a66 (CONFIG enemyRim); emissive 0x19d3c5 -> 0xff7a3c on armor-spend | none | 123.8 / 176.4 teal |
| flyer   | palette.body 0x7d6878 mauve (magenta dome carries the hue)    | none | 65.8 / 333.5 magenta                 |
| boss    | monolith rim 0x9a5bff / body 0x7a4dff; splicer 0x2dd4bf       | n/a  | 68.4 / 259.1 violet                  |

### 4.2 Target ladder (research section 5; "small/fast = bright, big/slow = dark")

| role    | target luma | hue target              | move from current          |
|---------|-------------|-------------------------|----------------------------|
| drone   | ~180        | cyan 185-195 (keep)     | 184.5 - keep top           |
| wasp    | ~175        | chartreuse 48-55 (keep) | 177.3 - keep               |
| sentry  | ~140        | olive 40-50             | 150.5 -> -10               |
| warden  | ~120        | teal 170-185            | 123.8 - keep               |
| hunter  | ~118        | rust 10-20 (keep)       | 118.3 - keep               |
| stinger | ~110        | STEEL-BLUE h 215-230    | 280 / 65.7 -> MOVED off boss |
| flyer   | ~95         | magenta 325-340         | 65.8 -> raised +30         |
| gunship | ~65         | slate h ~215 (DEFINITE) | unstable neutral -> fixed  |
| boss    | ~68         | violet 255-262 (keep)   | 68.4 - keep                |

Collision check at targets (E57 rule-1 AND test, needs BOTH dluma <= 10 AND
dhue <= 40): stinger 110 / ~220 vs boss 68 / 259 -> dluma 42, dhue 39 -> CLEARED
(the I506 true collision stinger x boss is gone). Stinger vs drone dluma ~74 ->
clear; stinger vs warden dhue ~44+ -> clear. Gunship 65 / ~215 vs boss 68 / 259:
dluma 3, dhue ~44 -> clear but BORDERLINE (1 deg of hue margin) - settled at
ST-477 in-game, not here.

### 4.3 Per-role palette decisions (FROZEN)

- drone: KEEP 0x6f8796, no gain change - already top of the ladder.
- stinger: MOVE 0x917fb9 violet -> steel-blue h 215-230 at rendered ~110. Freeze
  the new hex CLASS 0x54688a (sRGB luma ~102, hue ~218 - inside the band); the
  exact hex + any gain lands at ST-477 with the in-game re-audit. NOTE: the
  config.js paletteMap line-35 comment "identity rust body" is a stale doc -
  corrected at ST-477 with the palette move.
- hunter: KEEP 0x9c5a46 rust + 0xff4a2a accent, gain 3.0 - identity stable; the
  massing fix (section 3.2) is the change.
- gunship: 0x39424e gunmetal, gain 4.1 -> DEFINITE slate hue h ~215 at rendered
  ~65. The I506 audit read an unstable neutral: 0x39424e is h ~210 but
  under-saturated at that luma - the v2 bake raises saturation + value-band
  contrast so the hue is stable in render (verified at ST-477).
- sentry: KEEP 0x8a8f7a sage + 0xff9a3d accent, gain 2.0; the luma -10 step is
  bake-driven (value bands), not a hue change.
- wasp: KEEP 0xb9c34d chartreuse + 0xff4a2a accent, gain 2.0.
- warden: KEEP the teal identity (123.8 / 176.4 is already inside the ~120 /
  170-185 target): hull 0x2c3548 + armor 0x8fa3c8 + rim 0x2e6a66; the v2 hull
  gets value bands so the teal reads from geometry, not emissive alone.
- flyer: 0x7d6878 mauve -> RAISE rendered +30 to ~95 (magenta 325-340): the v2
  canopy + wing value bands carry the lift; no hue shift (already 333.5).
- boss: UNCHANGED (I503).
- ST-477 is the CLOSING GATE for this section: full I381/I383 in-game re-audit
  after all 8 remasters + palette updates; the gunship x boss borderline is
  settled there WITH MEASUREMENT.

### 4.4 ST-477 measured result (I511, FINAL)

The section-4 closing gate ran as a 4-pass in-game audit
(.evidence/I511/luma_audit511.mjs, headless SwiftShader, 1280x720, pixel
ratio 1, BLOOM in the render path - render2() runs bloom.render, so the
measurement is what the player sees). Per-role SKY p50 / mean hue vs the
FROZEN 4.2 targets, with the final gains:

| role    | gain | sky p50 | hue   | 4.2 target      | verdict                    |
|---------|------|---------|-------|-----------------|----------------------------|
| drone   | -    | 184.08  | 189.5 | ~180            | KEEP (+4.1)                |
| wasp    | 4.0  | 150.55  | 50.0  | ~175 (legacy)   | BLOOM-CAPPED (see below)   |
| sentry  | 4.05 | 136.73  | 41.5  | ~140            | -3.3                       |
| warden  | 4.5  | 119.49  | 179.1 | ~120            | -0.5                       |
| hunter  | 7.5  | 116.11  | 16.0  | ~118            | -1.9                       |
| stinger | 2.2  | 108.89  | 221.0 | ~110 h215-230   | -1.1, hue in-band          |
| flyer   | 1.3  |  94.22  | 335.8 | ~95             | -0.8                       |
| boss    | -    |  68.40  | 259.1 | ~68             | UNCHANGED (I503)           |
| gunship | 7.2  |  68.16  | 158.1 | ~65 h<=219      | +3.2, mean hue <= 219      |

- Strict rung order drone > wasp > sentry > warden > hunter > stinger >
  flyer > boss > gunship: PASS (boss x gunship dluma 0.24).
- E57 rule-1 AND test (collision iff dluma <= 10 AND dhue <= 40): all 8
  adjacent pairs PASS. Wasp x sentry gap 13.82 with dhue only 8.5 - the
  dluma gap is the separating axis. Boss x gunship dhue 101.
- Wasp is BLOOM-CAPPED: gain 6.0 blew the v2-baked hull to white and the
  bloom halo flooded the measurement window (areaFrac 0.031 -> 0.33,
  p50 38.26 = halo median, meaningless). Gain 4.0 keeps p90 206.27 under
  the bloom threshold while leaving the > 10 gap over sentry. The legacy
  ~175 rung is unreachable on the v2 bake without blow-out; the rung is
  re-set at 150.55 WITH MEASUREMENT.
- Gunship x boss settled WITH MEASUREMENT: the near-neutral slate mean hue
  is unstable (0x344250 / g7.2: 222.5, dhue 36.6 = inside the AND band;
  0x334550 / g7.2: 158.1, dhue 101 = clear). Mean d < 4 - the gunship
  identity axis is near-neutral slate (saturation + 4x silhouette + amber
  bay glow), not a hue-axis split from the boss purple 259.1. Hex final
  0x334550 (sRGB luma 66.0 / hue 202.8).
- The v2 COLOR_0 bakes render every remastered hull far darker than the
  4.3 bake assumptions; the renderLumaGain knob did the work. Gain response
  is strongly sub-linear (fitted k 0.23-1.28 per role), so the iter1
  extrapolations missed (2 rung crosses) and the ladder locked over the
  iter2-4 measurement passes (each pass measures the full 9-role fleet in
  ~10 s).

## 5. GLB contract (E57 rule 8 + E68 re-pins)

Per asset (ST-474/ST-475 builds are REJECTED if any fails):
1. Node naming VR_<Asset>_<Node> - the per-role mesh builders key on EXACT
   names; modeling rows are merged into these export nodes (ST-474 verified
   against the loaders, I508): stinger VR_Stinger_Body (Hull+FinL+FinR+Exhaust
   merged) / VR_Stinger_Core; drone VR_Drone (all rows merged, single node);
   warden VR_Warden_Hull (Hull+Core) / VR_Warden_Armor (ArmorL+ArmorR+ArmorTop);
   flyer VR_Flyer_Body (WingL+WingR+Body+Tail) / VR_Flyer_Dome. Per-node tri
   asserts use the merged sums. (ST-475 remaster-4 v2 names per section 3.2.)
2. NEUTRAL COLOR_0 grayscale value bake on every mesh (2-3 bands, R-VALUE) - the
   material tint multiplies on top (vertexColors path, I289/ST-273).
3. Y-up glTF export (Blender 5.2.3 headless -b --python, deterministic script).
4. Materials <= 3 per asset (E57 rule 3).
5. Per-node tri count: aim <= actual <= cap (section 3 tables, measured by
   audit_glb.cjs).
6. Build-at-scale sanity: Blender-space bbox radius stays in the current asset's
   class (I506 audit: drone 1.41 / wasp 1.60 / flyer 1.69 / hunter 1.82 / stinger
   1.94 / sentry 2.04 / gunship 2.78 / warden 3.99; boss 5.67) - large drift
   signals a build-scale error, not a gameplay change.
7. BUDGETS (assetPerf) re-pinned to measured actuals at ST-476 WITH MEASUREMENT
   (E67 ship-v6 "tight" precedent); planned 2,100 / 2,050 / 54,000 t class.
8. File size: the dist total must stay under the renegotiated ceiling
   (~4,400,000 B, WITH MEASUREMENT at ST-476; current 3,747,372 B / 175 files).

## 6. Per-asset CG gate checklist (ST-474/ST-475, per asset)

1. Clay 7-view: f34 / side / top x clay / tint / silhouette - reuse the
   .evidence/I506/audit_clay.py v2 pattern (audit materials created BEFORE any
   per-asset loop that calls clear_meshes()).
2. Defect-note A/B: the f34 tint must visibly cure that asset's research section
   2.3 defect note (producer views every PNG, per I506 practice).
3. Silhouette board: 96 px silhouettes FRONT AND BACK (R-SIL) - both must read
   the role at a glance.
4. Low-DPR accent survival: the accent (threat-red / ember / canopy) still reads
   at ~0.5 DPR (I381-class check at audit time).
5. Contract asserts (scripted): node names per section 5.1, mat count <= 3,
   COLOR_0 prims present on every node, per-node tri vs the section 3 table,
   bbox class per section 5.6.
6. In-browser rendered luma/hue: NOT run per build - the single ST-477 in-game
   re-audit is the luma gate (I381/I383 method).

## 7. Story map + re-pin schedule

- ST-474: Blender legacy-4 remaster (stinger, drone, warden, flyer) - ENEMY-FIRST.
- ST-475: Blender remaster-4 v2 (hunter, gunship, sentry, wasp).
- ST-476: integration + re-pins WITH MEASUREMENT (BUDGETS x8, assetPerf, dist
  ceiling, playframe483/491 expected-0 remeasure, causal pins).
- ST-477: in-game luma re-ladder + CONFIG palette moves (closing gate for
  section 4; stinger exact hex + gunship x boss borderline settled here).
- ST-478: fleet-coherence gate (E57 rule-1 AND-test across all 9 + 96 px
  silhouette board + low-DPR pass).
- ST-479: G68.0 close.

## 8. Open items / risks (carried, not frozen)

- gunship x boss borderline: settled I511 WITH MEASUREMENT (0x334550 / g7.2 mean hue 158.1 vs boss 259.1, dhue 101; the 0x344250 iter2 state was inside the AND band at dhue 36.6; 4.4).
- stinger steel-blue hex: settled I511 (0x54688a / gain 2.2; measured 108.89 / hue 221.0 in-band; 4.4).
- dist ceiling: current 3,747,372 B vs renegotiated ~4,400,000 B pre-reg
  (scope-check) - WITH MEASUREMENT at ST-476; cut ladder C1-C4 on overrun.
- warden: the 1.7 is the CONFIG gameplay radius, NOT the Blender-space bbox
  class - the hull builds 1.7-class while the armor slabs keep the bbox corner
  at the legacy ~3.99 class (assetLoader does no scale normalization, so the
  in-game size must not drift; section 5.6 catches it).