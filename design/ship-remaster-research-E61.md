# Ship + Asset Reference Research - Void Runner (E61, I469 / ST-436)

Authored under cgs-research. Companion to production/scope-check-E61.md and
design/ship-v4-spec.md (the frozen v4 contract, carried forward). This is the
HARD GATE: ST-437 (the Blender ship v5 build) does not start modeling until
this doc + design/asset-spec-ship-remaster-E61.md land. Research items below
are LABELED (source + locator) and are NOT tree-verified; the live-tree
numbers cited (tris / bytes / node names) ARE tree-verified this iteration
(parsed from the live GLBs, I469).

## Summary
The user's standing ask (verbatim, scope-check-E61.md): turn the 14,276-tri
"small-looking" v4 into a detailed high-poly REAL AIRSHIP ("put in more
detailing, increase the polygon count ... make it a real airship, go through
the guides and reference samples"), likewise make the enemy craft more
realistic, "use the polygons and gpu resource as much as needed." This doc
fixes, from reference samples (YouTube + web), the design decisions ST-437
builds to: the real-airship part list mapped onto the 6 FROZEN VR_Ship_*
nodes, the 3-material split, the silhouette rules that make an airship read
at ~100 px, and the enemy detail direction consistent with the E59 art
direction (one-danger-color, rim-on-dark, bold silhouette). It also records
the two load-bearing constraints that keep this a "geometry + value-bake"
pass and NOT a scope violation: the model detail/volume problem (I455 closed
the scale question), and spend-geometry-on-the-silhouette /
bake-surface-detail-into-COLOR_0.

## Reference sources (labeled research; NOT tree-verified)

YouTube (MCP, I469 pass; anatomy + the canonical Blender recipe):
- SOLARGROUP "how a blimp/airship works" (4uceCasVUEc, transcript): anatomy -
  multi-layer envelope; a RIGID hull bears the structural loads + gives the
  aero shape; a gondola/cabin hangs below; the TAIL assembly (dorsal + ventral
  + lateral) stabilizes, maneuvers and adds lift; SLOW-turning propellers; gas
  cells distributed for safety. -> envelope = the dominant volume; tail is
  structural, not decoration.
- Concerning Reality "parts of an airship" (IrBVyIiXveM, transcript): parts
  list - envelope, fore/aft ballonnets, suspension cables that carry the
  gondola, rudders + elevators (the cruciform tail), ENGINES ATTACHED TO THE
  GONDOLA / nacelles with traditional propellers, air scoops, helium valve,
  cabin; rigid (zeppelin) vs non-rigid (blimp). Zeppelin 1 = 420 ft long /
  28 ft dia (very elongated teardrop). -> the nose:tail ratio is long + thin.
- Hindenburg (VJy17qZmhjE, transcript highlights): a keel catwalk/ridge runs
  the length along the bottom; fuel/water tanks; a control car sits near the
  tail. -> a keel band along the lower centerline is a signature element.
- RJDesigns2030 beginner "airship in Blender" (rxzMQIYv6Gk, frames @ 640 px -
  no captions): THE canonical recipe - a TEARDROP envelope from a profile curve
  spun (Screw/spin modifier); a keel ridge band along the lower centerline; a
  CRUCIFORM tail (dorsal + ventral + lateral fins); a CAPSULE GONDOLA suspended
  below the rear on struts; small ENGINE PODS each with a prop disc; a
  two-tone paint band. -> this IS the silhouette recipe v5 follows.
- Vertex Horizons "fantasy game airship" (dyQh8ftLXLA, frames @ 640 px): a
  RIVETED PANEL GRID on the envelope, a keel structure, a LARGE propeller /
  turbine disc, rigging cables, a mast + banner; ~30 objects in the outliner,
  Substance-painted panels. -> what a "detailed" game airship spends on:
  envelope paneling + a big readable rotor, not tiny bits everywhere.

Web (MCP, I469 pass; game-asset readability + where to spend tris):
- MS FS2024 "Silhouette And Material Contrast" (docs.flightsimulator.com):
  keep the elements that FORM THE PROFILE (wing shape, cross braces, panel
  gaps) at high res; "material contrast" = details that contrast with the body
  POP if reduced, but BODY-COLORED rivets do NOT - reducing them is invisible.
  Reduce flat shapes first, then curves. -> tris go to silhouette +
  high-contrast parts; body-colored panel lines/rivets get BAKED, not modeled.
- Pixelwolf "Low-Poly Detail: Geometry vs Texture": "Geometry earns its keep
  at the silhouette" - a detail that changes the outline has the strongest
  argument for existing; texture/value-map carries surface info (scratches,
  seams, labels, trim, fasteners, dirt). "The camera should make the decision"
  - view the asset at the size the player sees it; "spend detail where it
  changes the read." -> v5 spends geometry on the envelope/tail/rotor/gondola
  outline; panel lines + rivets + seams go into the COLOR_0 value map.
- UNDERPOLY "Free Generic Airship" (sketchfab, 2023): a clean game airship
  uses 2-3 materials (colors, glass, general parts), separated parts (doors,
  propellers, yokes); ~5,027 tris (light) to 16.7k (full). -> 3 materials is
  the canonical count (v4 already has exactly 3); a real game airship spans
  the same tri range v5 targets.
- CGTrader "Airship PBR low poly animated" (2023): 12,283 polys, of which
  6 propellers at ~332 polys each. -> the ROTORS are a first-class,
  multi-hundred-tri feature, not an afterthought.
- Low-poly guides (retrostylegames / cada-edu / sculpty, 2025-2026): silhouette
  first (the SOLID-DARK-SHAPE test - if you cannot tell what it is as a black
  silhouette, more interior edges won't help); exaggerate the identifying
  shapes; keep FACET SIZE consistent across the scene; budget by role (hero
  prop ~2,000-5,000 tris); WebGL -> favor few materials + simple meshes;
  VERTEX COLORS are a cheap way to add tonal variation without a texture set;
  always test at the real gameplay camera distance, not in the viewport.

## Findings mapped to decisions
F1 - What a "real airship" is, at our read distance. The silhouette is: a
  dominant teardrop ENVELOPE (~70% of the area) + a cruciform TAIL (dorsal +
  ventral + lateral) at the stern + a suspended capsule GONDOLA under the
  belly + SLOW ROTORS (prop/turbine discs) on nacelles + a keel band along the
  lower centerline. That is the whole read; everything else is surface.
F2 - Spend geometry on the silhouette, bake the surface. Per F1's parts: the
  envelope curvature, the tail fins, the rotor discs and the gondola are
  geometry (they change the outline / catch light). Panel lines, rivets, gore
  ribs, seams and the keel band are BAKED into the per-facet COLOR_0 grayscale
  value map (body-colored -> invisible to model, but they read as "detailed
  skin"). This is exactly what the v4 pipeline already does; v5 just bakes
  more of it.
F3 - 3 materials is right. Every reference airship sits at 2-3 materials. v4's
  3 (Hull / Wing / Cockpit) is canonical; v5 keeps exactly 3.
F4 - Tri budget. Reference game airships span ~5k-16.7k tris; the "hero prop"
  norm is 2,000-5,000. v5 targets <= 18,900 (well above a generic prop).
  JUSTIFIED because (a) the user explicitly authorized "increase the polygon
  count ... use the polygons and gpu resource as much as needed," (b) the ship
  is the ALWAYS-ON protagonist (the single most-viewed object in the game),
  and (c) the ST-439 WebGPU re-eval re-derives F1/F2/F3 against the new total
  so the GPU cost is measured, not assumed. The cut ladder (18,900 -> 16,000)
  is the safety valve if the dist ceiling or frame cost pushes back.
F5 - Facet-size consistency. v5's envelope facet size must read in the same
  family as the v11 rocks and the enemy craft (no one over-dense island). The
  build keeps a consistent subdiv density across the craft.
F6 - Setting bridge. This is a SCi-Fi VOID space-shooter, not a 1920s sky.
  The "real airship" read is kept (envelope + gondola + cruciform tail + keel)
  but the slow propellers become TURBINE / EXHAUST DISCS and the "gas" hull is
  a rigid void-frame - so it reads as "airship" via silhouette without
  committing the setting to historical. (The in-code engine flame at
  z = -0.80 already gives the exhaust read; the discs read as turbines.)
F7 - Facet/value-map consistency with the runtime. The GLB supplies GEOMETRY +
  a per-facet grayscale COLOR_0 value map on EXACTLY Hull + Wings (the v4
  contract); all dynamic material behavior (palette tint 0xab9374/0x54402e,
  cockpit cyan emissive, invuln blink, additive flame) stays in code. No
  textures, no normal maps, no new hexes.

## Design decisions (the contract ST-437 builds to)

Part list mapped onto the 6 FROZEN VR_Ship_* nodes (names EXACT, unchanged):
- VR_Ship_Hull  -> the ENVELOPE (teardrop, multi-gore-ribbed, keel band, panel
  lines via COLOR_0) + the gondola body + upper deck. (dominant volume)
- VR_Ship_Wings -> the lateral tail fins + the lateral envelope band/ribs
  (the "wing" = secondary-dark material 0x54402e).
- VR_Ship_Fin   -> the DORSAL + VENTRAL tail (with the lateral fins the full
  cruciform) - the stern "cross" signature.
- VR_Ship_Engine-> the 2 nacelles + their TURBINE/EXHAUST DISCS (the dominant
  "airship rotor" read; see F6).
- VR_Ship_Nozzle-> the bow anchor + keel fin + rear EXHAUST CONE (flame origin
  constraint: nacelle/exhaust mouth at z = -0.88, 0.08u clear of the in-code
  flame apex at z = -0.80).
- VR_Ship_Cockpit-> the suspended gondola canopy / glazing (cyan emissive,
  FROZEN 0x59d8ff @ 1.4).

Material split (3, EXACT names, routing code-side + UNTOUCHED): Hull / Wing /
Cockpit. The GLB node->material assignment stays IDENTICAL to v4
(Hull->Hull, Engine->Hull, Nozzle->Hull, Wings->Wing, Fin->Wing,
Cockpit->Cockpit) so the rendered material routing is byte-identical to v4 -
only geometry + COLOR_0 change.

COLOR_0 (EXACTLY Hull + Wings, per-facet grayscale value map): same v4 formula
  v = clamp(1.0 + k * dot(n, L), 0.30, 1.55), L = normalize(-0.45,-0.55,0.70);
  hull k ~ 0.60 (was 0.55 - a touch stronger relief), wings k ~ 0.80. Bake
  bands (all body-colored -> value-map only, F2): envelope gore ribs (darker
  facet ring at each rib), the keel band (darker along the lower centerline),
  panel lines (thin darker facet rows at ~1/6 envelope length), gondola seams
  (darker facet row at the hull/gondola junction). Grayscale channel delta
  <= 0.02, spread floors >= 0.35 (v4 floors hold).

Silhouette rules (the SOLID-DARK-SHAPE test, F1/F7):
- Envelope = dominant teardrop, ~70% of the silhouette area, long + thin
  (nose:tail ratio per Zeppelin-1 ~15:1, softened to our 2.6u length).
- Cruciform tail reads as an "X"/"+" at the stern even at the rear-approach
  angle (pairs with the I445/I446 camera rear view).
- A suspended capsule gondola sits under the belly on struts (the "airship,
  not generic ship" cue).
- Turbine discs at the nacelles read as rotors (F6).
- A keel ridge runs the lower centerline (Hindenburg / RJDesigns).

Envelope build recipe (Blender, per RJDesigns): profile curve + Screw/spin for
  the teardrop; elliptical cross-section (rx ~ 0.42 / ry ~ 0.24, centerline
  lifted so the canopy clears); gore-rib hoops following the taper; keel band
  along the lower centerline; bow rounding (front ~35%) + stern taper (rear
  ~25%).

Constraints carried from the v4 contract (ship-v4-spec.md - UNCHANGED):
- Native size authored in Blender, NO rescale in code: span 4.0u (x +/-2.00),
  length 2.6u (z -0.80..+1.80), height 0.90u (y -0.28..+0.62). assetGlbs
  pins: |len-2.6| <= 0.26, |span-4.0| <= 0.4.
- glTF 2.0 GLB, Y-up, 1 unit = 1 world unit; no rig/anim/morph/UVs;
  POSITION + NORMAL on every mesh; componentType 5123.
- 6 node names EXACT + 3 material names EXACT (loader/shipMesh read them).
- Presence: OVERVIEW re-check worstRim <= 0.85 and silhouette >= the current
  109x95 px read (I455). The "small looking" complaint is MODEL detail/volume,
  NOT scale - do NOT touch ship scale or camera (camera = E62).

## Enemy detail decisions (feeds ST-438)
Same silhouette-first + value-bake approach as the ship. Keep the EXACT
node names + 3 materials + the per-hull grayscale COLOR_0 bake (fleet
convention: the value map multiplies over the runtime palette; a COLORED bake
would corrupt it, so it stays grayscale/neutral).
- HUNTER (currently 1,432 tris / 139,752 B; nodes Core 100 / Fin 340 / Hull
  992(COLOR_0); mats Core/Fin/Hull): reinforce the W-REAR signature (the
  deployed-fins read, E59 rule 2 back view), add 2 forward WEAPON HARDPOINTS
  + a telegraph CORE (VR_Hunter_Core, threat-red, <= 4% of the silhouette per
  E59 rule 5), and bake panel lines / rivets / hardpoint recesses into the
  hull COLOR_0. ~2,250 tris aim, 2,400 cap HOLDS.
- GUNSHIP (currently 1,688 tris / 178,220 B; nodes Bay 64 / Hull 1,450
  (COLOR_0) / Nacelle 174; mats Bay/Hull/Nacelle): reinforce the "brute"
  read - bulkier hull + central spine, two exposed NACELLES flanking it, and
  an OPEN FORWARD WEAPONS BAY (VR_Gunship_Bay, ember payload glow). Bake panel
  lines / rivets into the hull COLOR_0. ~2,300 tris aim, 2,400 cap HOLDS.
- Differentiation at busy-frame distance (E59 rule 2): hunter = flat, low,
  wide-swept manta + W-rear + rust luma ~103 + threat-red core; gunship =
  tall, bulky, wide + central bay + two nacelles + gunmetal luma ~65 + ember
  bay. Separation comes from SILHOUETTE (aspect + mass) + LUMA + ACCENT, not
  from color noise.

## Explicitly NOT doing (frozen identity - no scope violation)
- No ship SCALE or CAMERA change (I455 scale decision closed; camera = E62).
- No NEW nodes (6 frozen) and no material re-routing.
- No textures, no normal maps, no new hexes, no per-frame deformation.
- No > 3 materials per craft.
- Rocks / boss / comet: NO work (the v11 bump+crater remaster already
  satisfies the user's "asteroids with bumps and craters" - and the GPU cost
  is not justified per the user's own "only if gpu and compute heavy" rule).

## Unverified / open (carried to execution)
- Research grounding is UNVERIFIED-BY-PLAY (the YouTube/web items are
  references, not measurements). The tree numbers above (tris / bytes / node
  names / COLOR_0 status) ARE tree-verified this iteration.
- The exact per-part tri landing is measured at ST-437 (Blender build); the
  part-level budget is in design/asset-spec-ship-remaster-E61.md and the cut
  ladder absorbs variance.
- The enemy "read apart" is confirmed by a busy-frame screenshot at ST-438
  (measure, don't assume - the playframe B decomposition is only re-pinned if
  the enemies are in the B render window).

## Changed files (I469)
- design/ship-remaster-research-E61.md (NEW - this file)
- design/asset-spec-ship-remaster-E61.md (NEW - companion spec, same iteration)

## Verification (docs-only)
No src/assets change: dist byte-identical 2,882,938 B / 149; vendor r160
sha256-16 76DEA8151BC9352A; the two new design docs are no-BOM LF (outside
the tracked BOM set). Full gate in production/iterations.md I469.

## Next owner
ST-437 (I470): build ship v5 in Blender 5.2.3 headless per
design/asset-spec-ship-remaster-E61.md (deterministic
.evidence/I470/build_ship_v5.py), then the enemy detail pass at ST-438 (I471)
per the enemy section of the same spec.