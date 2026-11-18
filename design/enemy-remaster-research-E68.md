# Enemy Remaster Research - Void Runner (E68, I506)

ST-472 (I506) / E68. Authored under cgs-art-bible (audit + research pass) + cgs-scope-check
(E68). The user rejected the E57/E63-era enemy assets verbatim: "the new enemies type donot
look like good assets you can model other spacesheeps". This doc is the full-fleet audit
(I506 measured evidence) + shape-language research base for ST-473 (frozen per-role specs).
Extends design/enemy-visual-language.md (E57 rules) and
design/enemy-art-direction-research-E63.md (E63 sources F1-F10 STAND; this doc adds the
Y-S1..S4 sources + the I506 measured audit). Research items below are LABELED; tree items
are verified in this tree (I506).

## 1. Labeled research sources (I506, this session)

YouTube (mcp__youtube; transcripts rate-limited hard, so FRAMES used per project pattern:
480px, 2-3 labeled frames per video):
- Y-S1 Draw Sessions "Master Character Shapes in Minutes | Silhouette Sketching"
  (XhBhn8E8m1c, 30:34) frames 0:40 / 5:00 / 11:30 - 3-7 distinct BLACK silhouette sketches
  BEFORE any detailing; chapters 0:34 why / 4:43 distinctness / 11:06 the seven shape
  archetypes.
- Y-S2 Marnix Rekkers "HOW I DESIGN MY SPACESHIPS" (ShipTember podcast, jgNFKsJIuy0,
  1:08:49) frames 0:40 / 5:00 / 11:30 - rusty industrial freighter: heavy mechanical
  detail, paneling, rigging; surface VALUE BANDS carry the read, not color.
- Y-S3 Gnomon "Designing Spaceships for Games with Jort van Welbergen" (EWStwI909RI, 1:31)
  frame 0:40 - elongated hull + layered wing planes blockout; readable massing BEFORE
  detail.
- Y-S4 Riot Games "So You Wanna Make Games?? Ep 9: UI Design" (sc3h5JXtIzw, 12:29) frame
  1:00 ONLY usable - section header + item list + locked-state pattern (hierarchy + state
  pattern). Frames 7:00 / 9:20 useless (speaker / sponsor cutaways).
- (GDL d640TphrQYQ + Angelikatosh dL152bMdK0k identified but NOT fetched - section 6 cites
  the industry-standard main-menu hierarchy as labeled practice, not frame-verified.)

E63 carry-over (STILL STANDS, not duplicated here): Y1-Y6 + W1-W10 + findings F1-F10 in
design/enemy-art-direction-research-E63.md - roster function-first design (F3), telegraph
floors (F2), wave gates, silhouette-first pipeline (F10), I381/I383 rendered-luma method.

E57 rules carried (design/enemy-visual-language.md): rule 1 AND-collision test
(|dluma| <= 10 AND |dhue| <= 40 = collision); rule 2 bold silhouette readable FRONT AND
BACK; rule 3 <= 3 materials per asset; rule 4 accent semantics (threat-red 0xff4a2a /
ember 0xff9a3d); rule 8 GLB contract (VR_ node naming, NEUTRAL COLOR_0 grayscale bake,
Y-up, tri cap - E68 RE-PINS per asset in ST-473); rule 10 procedural fallback.

## 2. I506 full-fleet audit (measured)

Method: (a) Blender 5.2.3 headless .evidence/I506/audit_clay.py v2 run (audit_clay2.log) -
per-asset clay/tint/silhouette renders, 9 assets x 7 views (f34 front / side / top;
silhouette f34 only) = 63 PNGs, ALL VIEWED by the producer this session; (b) in-game
rendered-luma audit .evidence/I506/luma_audit506.mjs -> luma_audit_i506.json (I480/I381
method: screenshot the enemy solo against sky, p50 sRGB luma / hue / areaFrac;
consoleErrors 0); (c) GLB parse .evidence/I506/audit_glb.cjs (tris per node + bytes +
Blender-space bbox).

### 2.1 Geometry + byte table (GLB, Blender 5.2.3 headless)

| asset   | tris  | per-node tris                                    | Blender bbox r   | bytes   |
|---------|-------|--------------------------------------------------|------------------|---------|
| hunter  | 2,256 | Core 256 / Fin 600 / Hull 1,400                  | 1.8243           | 144,460 |
| gunship | 2,268 | Hull 1,650 / Nacelle 450 / Bay 168               | 2.7799           | 171,736 |
| sentry  | 1,096 | Hull 656 / Base 180 / Barrel 140 / Charge 120    | 2.0415           | 108,980 |
| wasp    | 792   | Hull 512 / Wing 200 / Nose 80                    | 1.6001           | 81,892  |
| warden  | 180   | Armor 120 / Hull 60                              | 3.9945           | 19,756  |
| stinger | 40    | Body 32 / Core 8                                 | 1.9424           | 6,260   |
| drone   | 52    | single VR_Drone                                  | 1.4117           | 7,252   |
| flyer   | 62    | Body 20 / Dome 42                                | 1.6870           | 6,676   |
| boss    | 398   | Hull 326 / Crown 52 / Core 20                    | 5.6746 (c z .45) | 31,876  |

Fleet (8 non-boss): 7,144 t / 547,012 B; with boss: 7,542 t / 578,888 B.
MIXED GENERATIONS: 4 remaster-tier (wasp 792 - gunship 2,268 t) vs 4 legacy
(stinger 40 - warden 180 t) - one fleet, two quality bars.

### 2.2 In-game rendered-luma ladder (p50 sRGB luma / hue / areaFrac(sky))

| asset   | luma  | hue                       | areaFrac | note                         |
|---------|-------|---------------------------|----------|------------------------------|
| drone   | 184.5 | 189.7                     | .146     | top of ladder                |
| wasp    | 177.3 | 48-51                     | .082     |                              |
| sentry  | 150.5 | 42.1                      | .072     |                              |
| warden  | 123.8 | 176.4                     | .201     |                              |
| hunter  | 118.3 | 15.6                      | .053     | SMALLEST on-screen footprint |
| gunship | 86.6  | UNSTABLE neutral (87/84/85)| .168     | no hue identity              |
| boss    | 68.4  | 259.1 (p90 169, bimodal)  | .183     |                              |
| flyer   | 65.8  | 333.5                     | .095     |                              |
| stinger | 65.7  | 280.2                     | .124     |                              |

STINGER x BOSS = ONE TRUE E57-rule-1 collision: |dluma| 2.7 <= 10 AND |dhue| 21 deg <= 40.
Dark cluster: 3-way luma tie {stinger 65.7, flyer 65.8, boss 68.4} - the dark end of the
ladder is a tie, not a ladder.

### 2.3 Per-asset defect notes (producer VIEWED the 63 PNGs)

Naming: sil = aud_<asset>_f34_sil.png; tint = aud_<asset>_f34_tint.png; clay =
aud_<asset>_f34_clay.png; boss also aud_boss_{side,top}_{clay,tint}.png.

- hunter (f34 sil/tint/clay): flat brownish "pancake" manta from the front - low
  height/width ratio; the orange-red core dome is TOO BIG / TOO TALL (reads as a
  lighthouse beacon, not a reactor); stubby fins; uniform flat rust, no secondary tone
  or paneling.
- gunship (f34 sil/tint/clay): big boxy gray "refrigerator / armored truck" -
  rectangular bay notch (slight orange glow inside), one protruding nacelle, no spine,
  no wide-hull read; no hue identity in-game (2.2).
- sentry (f34 sil/tint/clay): hex watchtower platform + dark turret + barrel ending in a
  BIG ORANGE SPHERE ("lollipop") - the most shape-readable remaster-tier asset; base
  chunky.
- wasp (f34 sil/tint/clay): chartreuse dart, one long paper-thin wing, small vertical
  fin, DETACHED red-orange sphere floating ahead of the nose (the VR_Wasp_Nose telegraph
  node is a ball, not an emitter).
- warden (f34 sil/tint/clay): hex core + broken hex frame ring + detached floating armor
  slabs - "disintegrating cube", chaotic, no frontal read. LEGACY tier (180 t).
- stinger (f34 sil/tint/clay): smooth elongated hex spike/bullet - no wings, fins, or
  engine; reads as a stretched rock. LEGACY tier (40 t). In-game violet 280 deg / 65.7
  luma = the boss collision (2.2).
- drone (f34 sil/tint/clay): cyan rock shard + one fin - literally an asteroid chunk.
  LEGACY tier (52 t).
- flyer (f34 sil/tint/clay): white hex slab/crate + pink dome notch - a styrofoam block.
  LEGACY tier (62 t).
- boss v2 (I503 ACCEPTED - KEEP): tall obelisk pillar; the audit camera crops top/bottom
  (tall bbox r 5.67 - a framing note for the audit, not a defect).

## 3. Findings (I506)

- F1 TWO GENERATIONS IN ONE FLEET: 4 remaster-tier assets (792-2,268 t) and 4 legacy
  assets (40-180 t) share one roster. The 8x tri gap is a visible quality gap in the same
  arena.
- F2 THE REMASTER TIER WAS STILL REJECTED ON STYLE: boxy/pancake massing (hunter,
  gunship) + oversized glow domes/balls (hunter core, sentry charge, wasp nose) + ZERO
  surface detail on any of the 9. Violates E63-F10 (silhouette-first, then value bands)
  and the E61-F2 bake lesson (the NEUTRAL COLOR_0 bake must carry value detail, not a
  flat single tone).
- F3 TRUE PALETTE COLLISION + DARK CLUSTER: stinger x boss passes the E57 rule-1 AND
  test (2.2); flyer/stinger/boss tie at the dark end - a 3-way read failure at the same
  screen luma.
- F4 GUNSHIP HAS NO HUE IDENTITY: rendered neutral (87/84/85 RGB) - the E57 model
  requires a hue per asset for at-a-glance classification; the dark end needs a DEFINITE
  hue, not just a luma step.
- F5 HUNTER = SMALLEST SILHOUETTE: areaFrac .053 (smallest of 9) - a rear stalker the
  player must read while looking forward; violates E57 rule 2 (bold silhouette, front
  AND back).
- F6 GLOW-SPHERE DISEASE: 3 of the 4 remaster assets end a structural line in a detached
  or oversized glowing ball (hunter dome / sentry lollipop / wasp nose ball). Glow must
  be an EMITTER (recessed, small, inline with the hull line) or a weak spot (warden-core
  style), never a decorative ball.
- F7 ZERO SURFACE DETAIL ACROSS ALL 9: no paneling, value bands, or rigging anywhere -
  Y-S2 (industrial freighter) + E61-F2 say the COLOR_0 bake should carry 2-3 value bands
  and panel breaks so the model reads at range without materials.

## 4. Per-role shape-language targets (function-first E63-F3; silhouette-first F10/Y-S1)

The shape targets below are the FROZEN brief for ST-473 (specs) and ST-474 / ST-475
(Blender builds). "v2" = remaster-tier rebuild; legacy-4 are net-new real ships.

- stinger = "needle": slender dart hull + swept twin tail fins + INLINE nose-spike glow
  (emitter in the nose line, not a ball) + rear exhaust. Fast single-hit interceptor.
- drone = "seeker-fly": round sensor-eye dome (front, a readable "eye") + short stub
  wings + small rear exhaust; insect language, not rock language.
- warden = "bulwark": solid hex hull + 3 THICK SYMMETRIC armor slabs (intentional
  plating, not debris) + exposed front-center core weak spot (ember glow only when
  armor breaks).
- flyer = "swift": broad flat swept wings + small magenta canopy dome + slim under-body;
  bird-glide silhouette, low and wide.
- hunter v2 = "manta": slender sharp sweep, RAISED SPINE (not a dome), core glow
  RECESSED in the spine notch (small, sub-bloom), fin-deploy W contract KEPT, secondary
  dark underside.
- gunship v2 = "brute": elongated hull + central spine + 2 PROTRUDING nacelles
  (exhaust read) + open forward bay WITH internal struts (not a crude notch) + layered
  panel bakes.
- sentry v2 = "watchtower": hex platform + 3 support struts + turret ring +
  CYLINDRICAL barrel with muzzle brake + small charge ring (not a ball).
- wasp v2 = "hornet": compact dart + short DOUBLE-BLADE wings (substantial, not paper) +
  narrow waist node + inline nose-spike glow (not a detached ball).
- boss: UNCHANGED - I503 v2 ACCEPTED (398 t obelisk; out of E68 scope by design).

## 5. Luma re-ladder proposal (rendered-p50 targets; "small/fast = bright, big/slow = dark")

| role    | target luma | hue target              | move from (2.2)                |
|---------|-------------|-------------------------|--------------------------------|
| drone   | ~180        | cyan 185-195 (keep)     | 184.5 - keep top               |
| wasp    | ~175        | chartreuse 48-55 (keep) | 177.3 - keep                   |
| sentry  | ~140        | olive 40-50             | 150.5 -> -10                   |
| warden  | ~120        | teal 170-185            | 123.8 - keep                   |
| stinger | ~110        | STEEL-BLUE h 215-230    | 280 / 65.7 -> MOVED off boss   |
| hunter  | ~118        | rust 10-20 (keep)       | 118.3 - keep                   |
| flyer   | ~95         | magenta 325-340         | 65.8 -> raised +30             |
| gunship | ~65         | slate h ~215 (DEFINITE) | unstable neutral -> fixed      |
| boss    | ~68         | violet 255-262 (keep)   | 68.4 - keep                    |

Collision check at targets: stinger 110 / ~220 vs boss 68 / 259 -> dluma 42, dhue 39 ->
FAILS the AND test (needs BOTH <= 10 / <= 40) -> cleared. Stinger vs drone: dluma ~74 ->
clear. Stinger vs warden: dhue ~44+ -> clear. Gunship 65 / ~215 vs boss 68 / 259: dluma
3, dhue 44 -> dhue > 40 -> clear but BORDERLINE; ST-477 settles it in-game (the closing
gate for this section). Flyer 95 / 333: unique. ST-477 re-runs the I381/I383 method
in-game after the remasters + CONFIG palette / renderLumaGain updates.

## 6. Menu-organization patterns (queue item 3; labeled practice, frame-verified only for
Y-S4 frame 1:00)

Standard main-menu hierarchy (industry-standard practice; Y-S4 frame 1:00 shows the
section header + item list + state pattern):
- Layer 1 (root): CONTINUE / NEW GAME / SETTINGS / (EXIT on desktop).
- CONTINUE (campaign): resume from the localStorage highest-level checkpoint - exactly
  one action, no sub-list.
- NEW GAME: mode select (ENDLESS / CAMPAIGN) - the existing E64 mode choice becomes a
  submenu rather than a root item.
- SETTINGS (nested, per-category submenus): Video (quality / DPR / FX arm / motion),
  Audio (SFX + master volume), Controls (binds + view mode chase/cockpit), Data (reset
  progress).
- State pattern (Y-S4): every item shows its CURRENT state value inline (e.g. "Audio:
  70"); disabled items grayed with a reason - never hidden.
Research-only in E68; implementation is a later epic (PWA / mobile D-pad epic) per
scope-check-E68.md section 7 deferrals.