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
