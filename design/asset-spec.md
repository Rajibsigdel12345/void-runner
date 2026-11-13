# Void Runner - Asset Spec (I102 / cgs-asset-spec)

## Summary
This spec defines the five GLB assets for the Blender graphics pass, as scoped by
design/art-bible.md (I101): the player ship, three asteroid rocks (L/M/S), and the
boss Monolith. It is the contract that unblocks I103 (Blender modeling via the bpy
API) and I104 (three.js integration + verification).

Core principle (minimal-risk integration): the GLB supplies GEOMETRY (and, for the
ship, its multi-material look). Every dynamic material behavior stays in the
existing code - the asteroid fresnel rim + golden swap, the boss emissive pulse,
the ship invuln blink + additive engine flame. The src/core collision model is
untouched; only src/render mesh sourcing changes.

## Scope and shared technical constraints
Assets (all in a new assets/ dir at repo root; binary GLB; Y-up; 1 Blender unit =
1 three.js world unit):
- assets/ship.glb
- assets/asteroid_L.glb
- assets/asteroid_M.glb
- assets/asteroid_S.glb
- assets/boss.glb

Shared rules:
- Export: glTF Binary (.glb), glTF 2.0. No skeletal rig, no animation clips, no
  morph targets - all motion is in-code transform + material. This keeps files
  small and loading trivial.
- Shading: flat (faceted). Export flat-shaded (set shade flat / no auto-smooth)
  so the low-poly neon look is preserved. Smooth normals would read as too soft.
- Materials in the GLB:
  - Rocks and boss: the GLB material is NOT authoritative. On load, the code
    re-applies its existing MeshStandardMaterial (rock: 0x8a7f72 flat + the
    onBeforeCompile fresnel rim 0x5f7fd8; golden override 0xffc94d / emissive
    0xffa018; boss: 0x3a3252 + emissive 0x7a4dff with an in-code intensity
    pulse). So the GLB may carry a default material; only the geometry is used.
  - Ship: the GLB carries its three materials, named and colored to match the
    palette (VR_Ship_Hull 0x8fd8ff metal .35 / rough .35 flat; VR_Ship_Wing
    0x2f5aa8 flat; VR_Ship_Cockpit emissive 0x59d8ff over base 0x0b1830). The
    code MAY override any of these by material name to guarantee parity, but the
    target is that the GLB already looks correct.
- Textures: none. Base color / metalness / roughness / emissive as scalar
  material params only. No image maps (keeps each GLB < ~100 KB and dist lean).
- Naming: objects and materials prefixed VR_ (VR_Ship_Hull, VR_Ship_Wing,
  VR_Ship_Cockpit, VR_Rock, VR_Boss).
- Load path (no import-map change needed): import { GLTFLoader } from
  three/addons/loaders/GLTFLoader.js (resolves to the vendored
  vendor/jsm/loaders/GLTFLoader.js; its BufferGeometryUtils dependency is
  already vendored). Load assets relative to the app root (e.g. assets/ship.glb)
  so the dev server and the production dist both serve them.
- Build: scripts/build.mjs must copy assets/ into dist/ (verify at I104) so the
  GLTFLoader fetch succeeds on the built artifact.

## Per-asset specs

### 1. Ship (assets/ship.glb)
- Purpose: the player's craft. Must read at a glance as a fast forward-pointing
  delta (an arrow pointing where it flies).
- States: one static state. The engine flame (additive) and the invuln blink are
  in-code and are NOT in the GLB.
- Geometry: hull (pointed cone / delta, nose +Z), swept angular wings, a small
  fin, a dome cockpit. Origin at the center of mass. Nose points +Z (render
  forward). Do NOT include the engine flame.
- Dimensions (match the current procedural ship): wingspan ~2.5, length ~1.9,
  cockpit near the nose. The logical ship collision radius is 0.9 (config) and
  does not change - the model is visual-only.
- Materials: VR_Ship_Hull, VR_Ship_Wing, VR_Ship_Cockpit (colors / emissive above).
- Poly budget: <= ~300 triangles.
- Integration notes: on load, attach the two existing additive flame cones to the
  loaded group at their current positions; keep the sync() transform
  (group.position.x/z = ship.pos, rotation.y = PI/2 - aim, y = 0.4 hover) and the
  invuln blink (group.visible toggle).

### 2. Asteroid L / M / S (assets/asteroid_L.glb, _M.glb, _S.glb)
- Purpose: tumbling threats; L splits into M, M into S. Irregular, asymmetric,
  pitted - no symmetry, no smoothness.
- States: one static state per size. The golden variant is a CODE material
  override (not a separate asset). Tumble rotation is in-code (per-rock r.rot).
- Geometry: a craggy low-poly rock, roughly spherical but clearly irregular.
  Origin at the geometric center.
- Dimensions: the model bounding radius must visually match the logical radius
  (config, unchanged): L = 2.2, M = 1.3, S = 0.7.
- Materials: GLB material is non-authoritative; the code applies the shared rock
  material (0x8a7f72 flat + fresnel rim) or the golden override.
- Poly budget: L <= ~320, M <= ~120, S <= ~80 triangles. (I105 amendment: L
  was ~200 in the original spec; I103 modeled L at icosphere subdiv 3 = 320
  tris. 80 -> 320 is the next standard icosphere step, decimating to ~200
  would create uneven tris that break the flat-shaded look, and the worst
  case (all-L at cap 24 = 7680 tris) is GPU-negligible - so the budget is
  amended, not the asset re-modeled.)
- Integration notes: the current 3-variants-per-size system is simplified to ONE
  geometry per size for this pass (documented simplification); per-rock rotation
  (r.rot) provides visual variety. The pool (cap 24) shares these 3 geometries.
  The sync() line becomes m.geometry = geos[r.size] (no variant index).

### 3. Boss Monolith (assets/boss.glb)
- Purpose: the wave 5/10/15 boss - a towering, imposing slab / obelisk that
  hovers and radiates violet.
- States: one static state. The emissive glow pulse (0.18 + 0.18 * sin) is
  in-code (material.emissiveIntensity animated). The health bar is in-code UI.
- Geometry: a tapered obelisk / monolith (taller than wide), jagged edges, flat
  faces. Origin at the CENTER of the obelisk (matching the current centered
  BoxGeometry convention).
- Dimensions: square-ish cross-section ~ (boss.radius * 1.2) = ~4.1, height ~
  (boss.radius * 2.6) = ~8.8, top tapered ~45% narrower. Logical boss collision
  radius 3.4 (config) does not change.
- Materials: GLB material non-authoritative; code applies 0x3a3252 + emissive
  0x7a4dff (pulsing in-code).
- Poly budget: <= ~250 triangles.
- Integration notes: not pooled (single mesh). Keep sync() placement
  (y = boss.radius * 1.3 + 0.3, rotation.y = boss.rot) and the emissive pulse.

## Acceptance criteria (per asset)
Common (all assets):
- Loads via GLTFLoader with 0 console errors / warnings.
- Correct orientation and origin (ship nose +Z; rocks / boss centered).
- Bounding dimensions within +/- 10% of the spec targets (hitbox / visual parity).
- Flat-shaded look preserved (no unwanted smoothness).
- 0 NaN in positions after a controlled fixed-step sim.
- File size < ~100 KB per GLB.
Per asset:
- Ship: silhouette reads as a forward delta; flame + invuln blink still work;
  poly <= ~300; collision radius 0.9 unchanged.
- Rocks: 3 sizes load; pooled (cap 24) sharing 3 geometries; fresnel rim + golden
  override still render; per-rock tumble works; radii 2.2 / 1.3 / 0.7 unchanged.
- Boss: hover + rotation work; emissive pulse still animates; radius 3.4 unchanged.
Overall (rendering gate at I104):
- In-browser screenshot (dev :5173 and dist :4173) shows the upgraded models at
  expected scale with correct colors / emissive and readable silhouettes.
- Perf within budget: renderer.info.programs not materially increased (19 at
  I105); full-bloom frame measured 4050 tris at I105 on a forced 24-rock +
  boss scene (vs 2346 at I98 - delta dominated by the 320-tri L rocks,
  GPU-negligible); 0 console errors.
- Colorblind-safe: player / threat / reward still separated by shape + hue +
  emissive.

## Risks
- Scale / origin mismatch -> wrong visual size or off-center hitbox feel.
  Mitigation: measure the bounding box in Blender before export; re-verify in
  browser at I104 against the logical radii.
- Flat shading lost on export -> too-smooth look. Mitigation: export flat-shaded;
  check the screenshot.
- Emissive / bloom parity -> glow differs from the procedural version. Mitigation:
  keep emissive on the in-code materials (rocks / boss) and match the ship cockpit
  emissiveIntensity ~1.4; screenshot-compare at I104.
- dist size growth -> GLBs bloat the self-contained build. Mitigation: small
  meshes, no textures; re-check dist size at I104 (baseline 1.44 MB at I98).
- Shader program growth -> new PBR materials add programs. Mitigation: reuse the
  existing materials for rocks / boss (only geometry changes); re-check
  renderer.info.programs.
- Blender bpy modeling is iterative and can be slow; keep meshes simple and
  bounded to the poly budgets.

## Changed files or proposed files
- design/asset-spec.md (this file, new)
- Proposed (I103): the five assets/*.glb modeled in Blender via the bpy API.
- Proposed (I104): src/render/{shipMesh,asteroidRenderer,bossMesh}.js switched to
  GLTFLoader-backed meshes (async load + fallback to procedural on load failure);
  scripts/build.mjs copies assets/ into dist/; a small async asset loader
  (e.g. src/render/assetLoader.js); AGENTS.md updated for the assets/ convention.

## Verification evidence
- Geometry targets and material strategy are taken from the current render code
  (src/render/shipMesh.js, asteroidRenderer.js, bossMesh.js) and the collision
  radii in src/core/config.js - all dimensions and colors above are verbatim from
  those files.
- The GLTFLoader import path and its BufferGeometryUtils dependency were verified
  to already exist under vendor/ (import map three/addons/ -> ./vendor/jsm/), so
  no import-map change is required.
- I102 is docs-only: no code changes, so npm test (233/233) and npm run build
  (exit 0) remain green by construction; iteration sequence stays 1..102.
- Visual verification of the actual GLBs is deferred to I104 (the rendering gate).

## Next owner or decision
- Next: I103 = Blender modeling. Using the bpy API, model the five assets to the
  specs above (flat-shaded, correct scale / origin, VR_ naming) and export each as
  a binary GLB into assets/.
- Decision: 1-geometry-per-size for asteroids (3 GLBs) with rotation variety, as
  spec'd (bounded pass). 3-variant-per-size (9 GLBs) for richer variety is a
  possible follow-up if needed.

## I208 ship amendment (E9 ST-208, cgs-dev-story)
Supersedes the I102 ship geometry section (dimensions, materials, integration
notes, and acceptance criteria otherwise stand unchanged):
- Geometry v2 (per I207 audit R2 + video grounding): ONE faceted delta mesh
  (hull + swept knife-edge wings + dorsal fin merged) + ONE recessed faceted
  canopy gem. The I103 6-tri cone hull and 224-tri UV-sphere cockpit are
  retired (the sphere was 60% of the ship's tris and the only non-faceted
  element; the cone read thin from the side).
- Build: V-top ridge (nose 0.95 -> tail -0.95, ridge y 0.15 -> 0.08), flat
  keel bottom (y -0.08, centerline splits), knife-edge leading edges/wingtips
  (top and bottom share the leading-edge edge - classic low-poly delta
  language), tail closed by one V-cap triangle. Canopy = 6-tri angular gem,
  base embedded below the ridge (no boolean). Fin = small box at the tail.
- Materials: VR_Ship_Hull (leading-edge panels, keel, tail cap), VR_Ship_Wing
  (four wing top panels + fin) - the two-material accent language;
  VR_Ship_Cockpit on the gem. In-code override by name is authoritative
  (shipMesh.useGLB: *Cockpit* -> cockpit, *Wing* -> wing, else hull).
- Draw calls: 3 (hull mesh x2 materials + canopy) vs 4 before.
- Triangle budget: ~42 total (was 254). Hard cap <=300 unchanged.
- Dimensions pinned (tests/assetGlbs.test.js): wingspan 2.5 +/-10%, length
  1.9 +/-10%, tail end at z ~= -0.95 (in-code flame stays at z -0.8, apex
  anchored to the group origin - unchanged).
- Node names: VR_Ship_Hull (merged mesh), VR_Ship_Cockpit. The I207 test
  anchor 'VR_Ship_Wings' node is retired with the merge (test updated in
  I208; material names all three retained).
- No engine flame in the model (ST-063 flame is in-code, unchanged).

## I209 asteroid amendment (E9 ST-209, cgs-dev-story)
Supersedes the I102 asteroid geometry section (dimensions, material
non-authoritativeness, budgets, and acceptance criteria otherwise stand
unchanged):
- Geometry v2 (refine, not restyle - I207 video grounding): icosphere base
  retained + seeded displacement: 3-octave directional sine field (seeds
  701/802/903; caggy amplitude L 0.30 / M 0.32 / S 0.40) + white-noise facet
  break (L 0.02 / M 0.05 / S 0.08), face-cluster dents (L 10 @ 0.42,
  M 4 @ 0.48, S 6 @ 0.52 of cluster radius), and four real inset craters on
  M only (0.35 unit-space depth; L is at its 320-tri cap so dents only;
  S is at 80 exact).
- Vertex colors (new, per the story's "displacement + vertex color"):
  per-vertex color baked in Blender from radial displacement - shade =
  clamp(1 + 1.4*(|v|-1), 0.45, 1.2) + per-vertex mottle (bumps bright, pits
  dark) - exported as COLOR_0. Consumed in code: the shared rock material,
  matBelt, and matGold now use vertexColors:true (multiplies base color -
  golden rocks get shaded craters, belt rocks slightly darker pits).
  bakeVariant bakes a white (identity) color attribute so the procedural
  fallback cannot render black, and setGLB() defensively adds a white color
  attribute when a GLB lacks COLOR_0.
- Triangle counts (actual): L 320 (cap), M 104 (80 base + 4 craters x 3),
  S 80 (exact). Budgets unchanged (L <= 320, M <= 120, S <= 80).
- Radii: max vertex radius EXACT 2.2 / 1.3 / 0.7 (= CONFIG; recentered then
  scaled in Blender; the test keeps its 5% band).
- Nodes/materials: VR_Rock_L / VR_Rock_M / VR_Rock_S, one VR_Rock material
  per GLB (non-authoritative; the code override is unchanged).
- Draw calls: unchanged (the pool still shares one geometry per size; vertex
  colors are an attribute, not a material - the only program delta is the
  USE_COLOR define on the three rock materials).
- Shielded/golden remain CODE states (additive shell child + material
  override) per the I102 spec; the new geometry + vertex colors make both
  states read better (the shell is radius-scaled in sync; the golden
  material multiplies the shaded colors).

## I210 boss + shield amendment (E9 ST-210, cgs-dev-story)

Supersedes the I102 boss section (procedural obelisk) and the I102 shielded-rock
shell (smooth unit icosphere) with the Blender v2 assets:

- boss.glb v2: 96-tri 8-column jagged obelisk - 6 vertical rings (ring i at
  y = -4.4 + 8.8*i/6, base ring y pinned) with per-column taper multipliers
  0.9-1.1, angle jitter +/-0.07 rad, radial jitter +/-7%; bottom cap fan
  (8 tris) + 40 side quads + top apex fan (8 tris). Cross-section EXACT 4.1
  (x/z normalized post-jitter), height EXACT 8.8 (base y=-4.4 / apex y=+4.4
  pinned), origin centered all axes. Vertex colors (COLOR_0): base 0.70 ->
  crown 1.25 by tTop + mottle (+/-0.08, clamped 0.45-1.25), consumed by the
  in-code material (vertexColors: true; the guard in useGLB keeps a
  COLOR_0-less GLB safe).
- shield.glb (NEW, 6th asset): 80 de-indexed icosphere faces pulled 0.86x
  toward each face centroid -> 240 unique verts, independent gapped energy
  plates; max vertex radius EXACT 1.0 (sync scales r.radius*1.3 as before);
  NO vertex colors (the additive MeshBasicMaterial shellMats stay
  authoritative; armor-level dimming remains the read mechanism).
- Nodes/materials: VR_Boss (Principled 0x3a3252, metallic 0.4, roughness 0.45,
  emission 0x7a4dff@0.3 + Color Attribute node) and VR_Shield (cyan 0x7fe0ff,
  emission @0.5) - non-authoritative in-engine (the in-code pulsing emissive /
  shellMats override), kept for editor and tooling parity.
- Budgets: boss 96/250 (was 192 for the v1 box jitter), shield 80/120 (new).
- File sizes: boss 11.4 KB, shield 7.2 KB (dist stays ~1.83 MB raw, in the
  2 MB budget).
- Draw calls: unchanged - one boss mesh; all pooled shells share the single
  swapped geometry (setShieldGLB replaces it once; per-armor material swap in
  sync is unchanged).

## I211 powerup emblems + drone amendment (E9 ST-211, cgs-dev-story)

Eight new GLBs (14 total in assets/). Naming: node = material = VR_PU_<Cap> / VR_Drone.
No vertex colors on any I211 asset - in-code per-type materials (powerupMesh TYPES) and the
drone material are authoritative; GLB materials are decorative only.

| file | geometry | tris (budget) | normalized max extent |
|---|---|---|---|
| powerup_rapid.glb | twisted 4-col crystal (two 4-rings at 45deg twist, nose/tail tips) | 16 (<=60) | 0.9 (Y) |
| powerup_spread.glb | triple-fan blade cluster | 13 (<=60) | 0.85 (Y) |
| powerup_shield.glb | chunky 6-side ring (six gapped plates) | 48 (<=60) | 1.0 (X) |
| powerup_bomb.glb | box + 8 corner tri-pyramid spikes | 36 (<=60) | 0.95 (X/Y/Z) |
| powerup_magnet.glb | horseshoe U of three boxes | 36 (<=60) | 0.88 (X) |
| powerup_overdrive.glb | hex gem + piercing spike core | 32 (<=60) | 0.85 (Y) |
| powerup_slowmo.glb | box base + elongated octa spike | 20 (<=60) | 0.9 (Y) |
| drone.glb | 8-seg dart: nose 1.12, rings r .35/.595/.30 at x .6/0/-.85, tail -1.12, dorsal+ventral fins | 52 (<=100) | X 2.24, cross 1.19-1.24 |

- Normalized extent = max bounding-box extent scaled to target in Blender before export
  (Y-up glTF space after the (x,y,z)->(x,-z,y) pre-rotation).
- Draw calls unchanged: pools share geometry per type; the emblem swap is a geometry-pointer
  swap on pooled meshes (setGLB / useGLB), no new materials or programs.
- File sizes: rapid 2.0 KB, spread 2.1 KB, shield 3.7 KB, bomb 3.5 KB, magnet 3.0 KB,
  overdrive 3.2 KB, slowmo 2.2 KB, drone 4.2 KB (~24 KB added raw; dist budget unaffected).
- Parity: emblem silhouettes match the procedural fallback families (crystal ~ octa, fan ~ cone,
  ring ~ torus, bomb ~ box, U ~ sphere slot, gem ~ hex-cyl, spike ~ icosa); drone length 2.24 and
  cross 1.19 match the procedural OctahedronGeometry(0.7) scaled (1.6, 0.85, 0.85), so
  hit-feel/size perception is unchanged.
- Normals: recalc_face_normals before export; verified post-export via signed-volume audit
  (all positive). I211 incident: the four first-session emblem exports skipped recalc -
  powerup_shield was consistently inward (fixed by in-place index-winding flip) and
  powerup_rapid mixed (rebuilt). The signed-volume check is part of the asset-audit routine.

## I212 background pass amendment (E9 ST-212, cgs-dev-story)

- skybox_equirect.png: 1024x512 equirect (2:1), 41.2 KB (budget <=300 KB). Deterministic numpy
  generation in Blender (seed 212): base #04060f; equatorial galactic band (gaussian sigma
  0.18 rad, color #0d1430, 3x/7x-u low-freq structure, amplitude 0.6); 6 soft nebula blobs
  (violet 0x3a2a66 / teal 0x123a4a / magenta 0x4a1a3a, amplitude 0.10-0.18, |latitude| < 1.1
  rad keeps the poles clean); 900 stars (70% 1 px / 25% 2 px / 5% 3 px, brightness 0.3-1.0,
  tints blue-white/white/warm, uniform-latitude placement via arcsin). All features wrap-drawn
  at the u edge (x, x-W, x+W) -> seam-free 0/1 longitude wrap. Color pipeline: designed in
  sRGB -> linear buffer (Blender converts linear->sRGB on 8-bit PNG save); rows reversed
  before foreach_set (Blender buffer row 0 = bottom, PNG top row = last buffer row) -> north
  pole at the top of the PNG, the orientation three.js EquirectangularReflectionMapping
  expects; verified in-browser (band at the horizon).
- arena_ring.glb v2 (I254/ST-245; v1 was I212): TWO-NODE GLB, 60 tris total (budget <=120).
  - VR_ArenaRing (outer band, unchanged from v1): 24 segmented plates (11-degree plate /
    4-degree gap), 48 tris / 48 shared verts, inner radius 0.94 / outer 1.0 (unit-radius
    convention, like shield.glb).
  - VR_ArenaRing_Ticks (I254 neon accent): 12 triangle wedges at the major seams (every
    30 degrees), 12 tris / 36 verts, r 0.895-0.93 (just inside the band).
  Both flat in XZ (|y| = 0), all face normals +Y, no vertex colors (in-code materials
  authoritative), 4032 B (v1 4.7 KB). Rendered in-code as two static (reduced-motion safe)
  MeshBasic meshes: band 0x4a6cff (opacity 0.55, DoubleSide, depthWrite false) at y = 0.03
  (unchanged; luma below the bloom threshold) + ticks 0xdfe9ff (opacity 0.9, y = 0.035,
  no z-fight) whose luma CROSSES the 0.72 bloom threshold = the intended neon accent
  (FX high: ticks bloom; FX low/off: no bloom). +2 draw calls (was +1); scaled by
  CONFIG.arena.radius (26).
- Dist budget status after I212: 1934.9 KB raw / 500.7 KB gzip vs the adopted budget
  <=2048 KB / <=550 KB - still green, but only ~49 KB gzip headroom remains; further E9
  assets must stay tiny or go through a documented budget amendment (I197 precedent).
- Assets after I212: 15 GLBs + 1 PNG.
## I307 rock bump + crater relief amendment (E28 ST-287, cgs-dev-story)

Supersedes the I303 displacement-only rock geometry for SURFACE relief (radii, value
ladder, warm order, and the 3-shared-geometry / in-code-material scheme are unchanged).

- Geometry: the I303 displaced rocks (L 320 / M 104 / S 80 tris) carry an added bump +
  crater relief pass - per-rock crater patch with raised rim, scattered convex bumps,
  and edge chips, all applied as static displacement into the mesh (no new shaders,
  no new materials, no new draw calls; 3 shared rock geometries still pool across the
  24-rock cap). Triangulated before export for a deterministic GLB index count.
  Actuals: L 488 / M 134 / S 134 tris (L 246 / M 69 / S 69 verts).
- Budget amendment: rock per-size poly caps 320 / 120 / 80 -> 500 / 140 / 140 (measured
  488 / 134 / 134 + headroom). The all-asset triangle cap in tests/assetPerf.test.js
  moves 1500 -> 1800 (measured 1639; +252 from the relief, headroom for E9 art growth).
- Radii unchanged and EXACT: L 2.2 / M 1.3 / S 0.7 (re-normalized after relief).
- Vertex colors: same ST-283 scheme - value ladder L < M < S, warm order R >= G >= B
  at every vertex, per-vertex hue jitter, band [0.10, 1.20]. New-vertex colors are
  edge-mid / loop averages of the surrounding I303 vertices, preserving the ordering.
  COLOR_0 exported as unclamped FLOAT VEC3 (5126).
- Export note (Blender 5.2.3): use export_vertex_color='MATERIAL' (the default) to
  get FLOAT VEC3. export_vertex_color='NAME' forces a VEC4 alpha channel and U16
  (5123) quantization and must be avoided for these assets to stay consistent with the
  other COLOR_0 assets (ship / boss / warden / drone / arena ring, all 5126 VEC3).
- Facet luma pins (per-triangle mean luma, p90 - p10 spread floor 0.50): L 0.1934 /
  0.4603 / 0.8239 (spread 0.6305), M 0.2980 / 0.6182 / 0.9314 (0.6335), S 0.4354 /
  0.7386 / 0.9649 (0.5295).
- Byte impact: rocks 18.06 KB -> 30.33 KB (+12.7 KB); well inside the 2048 KB dist
  budget. No dist-structure change (same 3 GLBs, same loader path).
