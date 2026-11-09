# Void Runner - Art Bible (I101 / cgs-art-bible)

## Summary
This is the visual identity contract for Void Runner, the neon-on-void arcade
space shooter. It documents the current placeholder graphics (extracted from
src/render) as the canonical baseline, defines the shape language and palette,
and sets the asset constraints for the Blender graphics pass that upgrades the
highest-impact entities (player ship, asteroids L/M/S, boss Monolith) from
procedural primitives to Blender-modeled GLB assets.

The Blender pass is additive: the pure-logic core (src/core) and the collision
model are untouched. Only src/render mesh construction changes. This keeps the
233 unit tests and the deterministic hitboxes intact.

## Visual Identity
- Genre read: arcade survival / asteroids-style in a 3D arena. Instant,
  readable, no narrative weight.
- Aesthetic: "neon on void." Deep near-black space, hard-edged low-poly forms,
  saturated accent colors, additive-blend energy and bloom glow. Silhouette
  first, detail second.
- Mood: fast, tense, satisfying. The player reads threat vs reward vs self in
  a glance.
- No photographic or painterly detail. Flat-shaded, faceted surfaces.

## Shape Language
- Player ship: sharp forward delta - a pointed cone hull, swept angular wings,
  a small dome cockpit. Reads as an arrow pointing where it flies. Angular and
  aggressive. (Upgraded in the Blender pass.)
- Asteroids: irregular, asymmetric, pitted low-poly rocks. Three sizes (L/M/S)
  and three variants each; they tumble. No symmetry, no smoothness.
- Boss Monolith: a tall, slab-like monolith - authoritative, imposing, minimal.
  A wall that hovers and radiates violet.
- Mine: small spiky ball - a warning silhouette.
- Powerups: each a distinct primitive (octahedron, cone, torus, box, sphere,
  cylinder). Shape-first so type is never conveyed by color alone.
- Bullets: small elongated darts (player) / hot streaks (enemy).
- Vortex: flat disc + ring telegraph - a "something is happening here" marker.

## Palette (exact, from src/render)
Background / lighting
- Void clear + fog: 0x04060f
- Hemisphere sky/ground: 0x33437a / 0x04060f
- Ambient: 0x8899ff
- Polar grid: 0x1b2a55 / 0x101a38
- Starfield near / far: 0xe8f1ff / 0x9db4ff

Player (cyan family)
- Ship hull: 0x8fd8ff (metalness .35, roughness .35, flat)
- Ship wings/fin: 0x2f5aa8
- Cockpit emissive: 0x59d8ff (intensity 1.4) over base 0x0b1830
- Engine flame outer / core: 0xff9a3d / 0xfff2d6 (additive, in-code only)
- Player bullets: 0xbff4ff
- Shield ring: 0x53d8ff

Threats (violet / red family)
- Asteroid rock: 0x8a7f72 (flat) + cool fresnel rim 0x5f7fd8
- Golden asteroid: 0xffc94d, emissive 0xffa018
- Boss Monolith: dark 0x3a3252, emissive 0x7a4dff
- Mine: 0x3a2430 + red 0xff2a2a
- Enemy bullets: 0xff4a2a
- Vortex: 0x9d7bff

Rewards (warm / gold family)
- Powerup gold / shield / bomb / green / overdrive:
  0xffe066 / 0x53d8ff / 0xff5252 / 0x69f0ae / 0xff4dd8
- Particle burst: 0xffd27a

UI accents
- Reticle: 0x6fb8e8

Contrast rule: player is cool cyan, threats are violet/red, rewards are warm
gold. Nothing shares a hue family across those three roles, so the eye sorts
friendly / hostile / pickup without reading labels.

## Camera
- Follow camera behind the ship on the arena plane; y is up.
- Fixed vertical offset; subtle aim parallax. Fog (60-240) sells depth and
  hides the arena edge. No user camera control in this build.

## Animation / Motion (in-code, not baked into assets)
- Ship: yaw follows aim; invuln blink ~6 Hz; engine flame length tracks thrust.
- Asteroids: constant tumble (per-rock spin).
- Boss: hover bob + slow rotation.
- Powerups: gentle spin + bob; shield is a spinning torus.
- Keep assets static geometry; do all motion in the render layer.

## Asset Constraints (Blender pass)
Scope (this pass): player ship, asteroid L/M/S (3 shared), boss Monolith.
Other entities stay procedural until a later pass proves the pipeline.

- Poly budget (triangles): ship <= ~300; asteroid L <= ~320, M/S fewer;
  boss <= ~250. (Amended I105: L raised from ~200 to ~320 - icosphere subdiv 3
  is the next standard step above 80, decimating down would create uneven
  tris that break the flat-shaded look, and the worst case, all-L at cap 24
  = 7680 tris, is GPU-negligible.) Stay within the current draw budget (a
  full bloom frame was 2346 tris at I98; a forced full-cap wave measured
  ~4050 tris at I105 - within budget, no frame blow).
- Materials: PBR or flat-shaded; preserve the faceted look. Use the emissive
  channel for bloom-friendly accents (cockpit, monolith seams, mine core).
  One material per asset where possible to keep draw calls and shader programs
  bounded.
- Scale and origin (CRITICAL for hitbox parity):
  - Ship: origin at center of mass; nose points +Z (render forward); model
    WITHOUT the engine flame (it stays in-code, additive).
  - Asteroid: origin at geometric center; the exported mesh bounding radius
    must visually match the logical radius in config (L=2.2, M=1.3, S=0.7).
    The logical radius lives in src/core and does NOT change - only the visual
    scales to it.
  - Boss: origin at center; visual footprint matches logical radius 3.4.
- Colorblind safety: distinguish roles by shape + hue + emissive accent, never
  by color alone.
- Naming: prefix Blender objects and materials with VR_ (e.g. VR_Ship_Hull,
  VR_Rock_L). Material colors must match the palette above.
- Export: binary GLB, one file per asset, into a new assets/ dir
  (ship.glb, asteroid_L.glb, asteroid_M.glb, asteroid_S.glb, boss.glb).
  No external image textures (embed or use none). Target < ~100 KB per GLB so
  the self-contained dist stays lean.
- Build: the production build must copy assets/ into dist/ so the runtime
  GLTFLoader can fetch them (verify at I104).
- Draw calls / pooling: ship is one mesh; asteroids are pooled (cap 24) sharing
  three geometries; boss is one mesh. No per-instance extra meshes.

## Risks
- Scale/origin mismatch between the GLB and the 2D collision model could
  decouple what you see from what you hit. Mitigation: verify bounding-box
  dimensions at I104; keep the collision radius in src/core unchanged.
- Bloom/emissive parity: GLB emissive may not glow through the existing bloom
  the way emissiveIntensity does. Mitigation: screenshot-compare at I104 and
  adjust emissive values.
- Dist size growth: GLB assets must not bloat the self-contained build past a
  reasonable size. Mitigation: small meshes, no heavy textures; re-check the
  build output size at I104.
- Shader program / memory growth: new PBR materials could add programs.
  Mitigation: reuse materials; re-check renderer.info.programs at I104.
- Blender API modeling is iterative; keep meshes simple to avoid long compute
  and keep the pass bounded.

## Changed files or proposed files
- design/art-bible.md (this file, new)
- Proposed next: design/asset-spec.md (I102)
- Proposed code (I103/I104): assets/*.glb (new dir); src/render/{shipMesh,
  asteroidRenderer,bossMesh}.js switched to GLTFLoader-backed meshes;
  scripts/build.mjs to copy assets/ into dist/; AGENTS.md updated to reflect
  the new assets/ convention.

## Verification evidence
- Palette, shape language, and constraints are extracted from the current
  render code (src/render/shipMesh.js, asteroidRenderer.js, bossMesh.js,
  starfield.js) and main.js scene setup - the hex values above are verbatim
  from those files.
- I101 is docs-only: no code changes, so npm test (233/233) and
  npm run build (exit 0) remain green by construction; the iteration sequence
  stays 1..101.
- Visual verification of the upgraded assets is deferred to I104 (in-browser
  screenshots on the dev/preview servers), which is the correct gate for
  rendering changes.

## Next owner or decision
- Next: I102 = cgs-asset-spec. Produce design/asset-spec.md specifying each
  GLB asset (ship, asteroid L/M/S, boss) with geometry, material, export, and
  scale specs so I103 (Blender modeling) and I104 (integration) are unblocked.
- Decision: confirm the pass scope is ship + asteroids + boss (recommended -
  highest impact, bounded). Defer powerups/mine/bullets to a follow-up pass.
