const fs = require("fs");
const doc = `# E72 Enemy Art-Direction Pass - Research (I532)

## 0. User request (verbatim)

- "the new enemies type donot look like good assets you can model other spacesheeps"
- "you could improve the art element of the game as well... the character and the
  enemies model can have improvement. you can look up the reference images and
  the videos on how the characters can be modeled. not only the character
  modeling skill but also the choices of the character model that you have
  decided to put."
- "you can ofcourse do the research through the youtube and other mediums, watch
  as much content as you can and extract only the useful ones in the reference
  and your knowledge base so that you can improve the game"

Interpretation (bounded): the "new" ships = the E69 trio PHANTOM / HAULER /
BULWARK (firstWaves 13/15/17) plus the objectively weak GUNSHIP (E68 remaster).
E72 = rebuild those four GLBs in Blender with a proper art pass. Player ship,
cockpit, asteroids, boss, powerups, arena = NOT in E72 (standing queue).

## 1. Measured audit (I532, headless Blender 5.2.3, evidence .evidence/I532/)

Method: audit532.py (cloned from the I517 audit_clay517.py pattern): per ship,
4 clay views (3/4, front, back, side; 960x540 EEVEE Standard, dark world,
3 suns) + 4 tint views for the E69 trio (CONFIG body hex) + 96x96 black-on-
white front/back silhouettes (the E57 rule-2 gate). Run completed ALL_DONE
(audit532.out).

Measured rows (mesh nodes / tris / bbox radius):

| ship    | nodes | tris  | radius | CONFIG radius | firstWave | body hex   |
|---------|-------|-------|--------|---------------|-----------|------------|
| phantom | 4     | 2,336 | 0.843  | 0.5           | 13        | 0x40c055   |
| hauler  | 5     | 3,506 | 1.189  | 1.1           | 15        | 0x975a2d   |
| bulwark | 3     | 2,700 | 1.600  | 1.2           | 17        | 0xaa3c96   |
| hunter  | 3     | 3,366 | 1.011  | 0.8           | 6         | 0x9c5a46   |
| gunship | 3     | 2,596 | 1.643  | 1.6           | 8         | 0x334550   |
| sentry  | 4     | 2,934 | 1.942  | 1.1           | 5         | 0x8a8f7a   |
| wasp    | 3     | 4,020 | 1.534  | 0.75          | 7         | 0xb9c34d   |
| stinger | 2     | 1,732 | 2.162  | 0.5           | 7         | 0x54688a   |
| drone   | 1     | 1,516 | 1.467  | 0.5           | 8         | 0x6f8796   |
| flyer   | 2     | 1,770 | 1.717  | 0.7           | 9         | 0x7d6878   |

Defect findings (viewed renders; PNG refs a532_<ship>_<view>_clay.png /
_sil96.png, tint for the E69 trio):

- PHANTOM: fragmented floating box-cluster - no continuous hull spine; canopy
  pods are bumpy icospheres sitting on a flat disc; ball nose; front-96 =
  "blob with two ears". The E69 spec asked for a "slim arrow hull + two swept
  canopy pods" - no arrow is present. Verdict: REBUILD.
- HAULER: "LEGO-brick" deck - dozens of small floating boxes with dark
  see-through gaps (you can see INSIDE the ship); sponsons are slabs with
  visible gaps to the hull; faceted-cone nose. Reads as a construction
  diorama, not a welded truck. Verdict: REBUILD.
- BULWARK: flat hexagonal DISC (thickness ~1/4 of diameter) with recessed hex
  grooves reading as cracks; central ball reads as a rivet; front-96 = a plain
  circle with notches, indistinguishable from an orb/rock. The "shield
  enforcer" spec needs an actual armored ship behind a projected shield.
  Verdict: REBUILD.
- GUNSHIP: faceted egg-blob + one thin flat wing stub; front-96 = a coin. The
  E57 sec.3.2 spec demanded spine + nacelles + open forward bay - none read.
  Verdict: REBUILD.
- HUNTER: strongest of the fleet - coherent wide manta core + W-fin rear
  (minor rear-deck noise, acceptable). Verdict: ACCEPT (documented).
- SENTRY: wide low armored turret read, acceptable. Verdict: ACCEPT.
- WASP: clear winged read, acceptable. Verdict: ACCEPT.
- STINGER/DRONE/FLYER (legacy-4) + WARDEN/MONOLITH: stinger front-96 is a
  tiny dot (radius 0.5 scale) - a readability issue more than a modeling one.
  Verdict: DEFER to a future episode (P2 legacy-4 art pass).

## 2. LABELED grounding (YouTube, chapter-level cites only; house norm)

All sources: research viewing, 2026-11-20. No transcripts pulled.

- Bog Hog, "Enemy Design & Effects [SHMUP WORKSHOP 04]" (999tBKu8hNE, 12K):
  enemy shape encodes role; each class needs a distinctive silhouette.
- Bog Hog, "Bullet Pattern Design [SHMUP WORKSHOP 03]" (ArZRZSYICLo, 17K):
  pattern-vs-ship consistency (supports role-in-shape for the bomber/enforcer).
- Lazy Devs, "15 Shmups That Teach How Shmups Work" (80yTJ8LHwa8, 53K), 2:02:
  R-Type/Gradius enemy-archetype lineage (dart / drone / big-slow-heavy).
- ArtOfSoulburn, "Designing An Epic Starship Part 1" (E8h_NGZbrvY), 26:25:
  silhouette-sketches-first workflow.
- Daniel Scholes, "Spaceship Rear Silhouettes" (yXPeUNi0h5s): the rear view is
  first-class - directly supports the HUNTER-style rear-read rule (E57 rule 2).
- Draw Sessions, "Concept Art Spaceship Design" (3oWZSF-1bEY, 27K):
  industrial-design thumbnail workflow - test the shape at thumbnail size.
- Robert Laszlo Kiss (HQyXZrbbNY8, 29K), 0:33 "minimum viable elements" and
  3:44 "make your ship have more character": one dominant hull + 1-3 signature
  elements; character comes from form, not surface clutter.
- Aaron Van de Weijenberg (k2vTtHj0MME, 55K), 0:31 basic panels / 1:40 circles
  / 2:59 inset + outset panels WITHOUT booleans: surface detail within a
  triangle budget via insets/bevels, not floating geometry.
- CG Boost (nsTjnQ067sw, 648K) hard-surface fundamentals; MLT Studios
  (ZBgTve5_tSs, 94K) full ship pipeline; CBaileyFilm (erhh-q1BTm8, 117K).
- Star Fox reference: Sector Y Shogun boss (JDBijg4Vj6c) - stacked-armor heavy
  read; Attack Carrier boss (yeFKqJKDuR4) - layered carrier silhouette. Used
  for the GUNSHIP/BULWARK "heavy" reads.

## 3. Extracted principles (P1-P7), mapped to E57 rules (design/enemy-visual-language.md)

- P1 SILHOUETTE-FIRST: fix 3-4 target silhouettes (front/back/3-4/side)
  BEFORE modeling; the 96 px silhouette render is a GATE, not a nice-to-have.
  -> E57 rule 2 (96 px front AND back).
- P2 MINIMUM VIABLE ELEMENTS: one dominant mass + 1-3 signature cues per ship.
  "LEGO bricks" (phantom/hauler defect) = detail without form.
  -> E57 rule 2 + sec.3 role briefs.
- P3 WELDED UNITY: no gaps / see-through between components; every secondary
  element must attach to a parent surface.
  -> new E72 rule (adds to rule 3 material budget).
- P4 VOLUME OVER FLATNESS: a ship that is a flat disc (bulwark defect) fails
  at 96 px; secondary volumes (spokes, nacelles, containers) carry the read.
- P5 ROLE-IN-SHAPE: cloaker = sharp slim arrow; truck = bulky boxy mass with
  cargo cues; enforcer = wide armored mass + projected shield volume; bomber =
  spine + nacelles + open bay. Shape encodes the behavior before the palette
  does. -> E57 rule 1 is UNCHANGED (palettes frozen; grayscale luma bakes are
  hue-neutral, so the rendered luma/hue ladder is preserved).
- P6 PANEL DETAIL VIA INSETS/BEVELS: surface detail within tri budget using
  band_inset-style recesses and beveled edges - never floating boxes.
- P7 REAR READABILITY: rear-approach and rear-heavy types must read at the
  back view (hunter W-fin is the existing good example).

## 4. Per-ship remaster briefs (P0 = user-emphasis rebuilds)

Axis convention (all current GLBs): build space +X forward, +Y lateral,
+Z up; identity node transforms; mesh data in ABSOLUTE part-space (the
renderer pool children sit at the origin). Node names are CONTRACTS:
src/render/*Mesh.js binds by regex on the node name - KEEP the names and
the slot semantics exactly.

### 4.1 PHANTOM v2 "cloaker dart" (ST-499) - wave 13, radius 0.5, 0x40c055
- Nodes (unchanged): VR_Hull, VR_PodL, VR_PodR, VR_Nose.
  Slot semantics (phantomMesh.js): /nose/i = glow slot, /podl/i + /podr/i =
  pod slots, every other mesh = hull.
- Form: ONE dominant slim arrow/dart hull - a continuous tube2 loft from a
  sharp faceted nose to a tapered tail, ~2.2 u long, ~0.5 u wide. Two FLUSH
  canopy pods welded to the hull top (low lens insets, no bumpy icospheres).
  Small rear fins on the hull (part of VR_Hull). No floating elements
  (P2/P3). Signature cues: the dart spine + the twin low pods (P2).
- Targets: front-96 = slim arrowhead with two low pods (a dart, not a blob);
  side = one clean spine; back = twin-pod tail with fin spread (P7).
- Tri budget (aim/cap): VR_Hull (1800, 2400) / VR_PodL (300, 500) /
  VR_PodR (300, 500) / VR_Nose (200, 320) -> total ~2,800-3,600 (aim ~3,000;
  current 2,336). RAD gate target 0.80 (0.88..1.12 x).

### 4.2 HAULER v2 "welded freighter" (ST-500) - wave 15, radius 1.1, 0x975a2d
- Nodes (unchanged): VR_Hull, VR_SponsonL, VR_SponsonR, VR_Hatch, VR_Stack.
  Slot semantics (haulerMesh.js): /hatch/i = glow slot, /sponson.*l|r/i =
  sponson slots, /stack/i = stack slot, every other mesh = hull.
- Form: ONE welded boxy hull - continuous, NO see-through (P3); 3-4 LARGE
  inset cargo containers on the deck via band_inset recesses (P6 - insets,
  not floating boxes); sponsons WELDED flush to the hull flanks (no gaps);
  armored pointed/plate nose. Signature cues: the container insets + the
  sponson pair (P2).
- Targets: front-96 = wide boxy truck with pointed nose; side = clean boxy
  mass with container insets and welded sponsons; back = sponson + stack read.
- Tri budget: VR_Hull (1900, 2500) / VR_SponsonL (450, 640) /
  VR_SponsonR (450, 640) / VR_Hatch (250, 380) / VR_Stack (400, 560) ->
  total ~3,450-4,720 (aim ~3,800; current 3,506). RAD gate target 1.10.

### 4.3 BULWARK v2 "shield enforcer" (ST-501) - wave 17, radius 1.2, 0xaa3c96
- Nodes (unchanged): VR_Shield, VR_Spine, VR_Core.
  Slot semantics (bulwarkMesh.js): /core/i = glow slot, /spine/i = spine
  slot, /shield|hull/i = slab slot. The rig yaws onto the core slew with a
  frontal +/-50 deg negation arc - shield stays on +X (front), spine on -X.
- Form: replace the flat disc with a SQUAT ARMORED HULL CORE (a short fat
  armored mass with volume, P4) + a THICK projected hex shield PLATE in front
  (real volume, 6 welded spokes connecting shield to hull, P3/P4) + emissive
  core glow between shield and hull (glow slot). Signature cues: the
  projected shield + the 6 spokes (P2).
- Targets: front-96 = hex shield disc with a visible core glow and a hull
  mass BEHIND it (not an orb); side = layered volume (shield / spokes / hull);
  back = armored hull mass.
- Tri budget: VR_Shield (1900, 2500) / VR_Spine (450, 700) /
  VR_Core (250, 380) -> total ~2,600-3,580 (aim ~3,000; current 2,700).
  RAD gate target 1.55.

### 4.4 GUNSHIP v2 "heavy bomber" (ST-502) - wave 8, radius 1.6, 0x334550
- Nodes (unchanged): VR_Gunship_Hull, VR_Gunship_Nacelle, VR_Gunship_Bay.
  Slot semantics (gunshipMesh.js): /bay|core/i = glow slot (payload amber
  arm/hit), /nacelle|engine/i = nacelle slot, every other mesh = hull.
- Form: ONE continuous heavy spine (tube2 loft, 16-20 rings, blunt armored
  nose) + a TWIN nacelle pair (both nacelles inside the single
  VR_Gunship_Nacelle node, symmetric +/-Y, welded to the hull) + an OPEN
  forward weapon bay (VR_Gunship_Bay, glow slot, reads as the ordnance
  compartment) + a dorsal fin on the hull (Star Fox Shogun/Carrier heavy
  read, P2/P5).
- Targets: front-96 = wide heavy mass with bay + twin nacelle stubs (NOT a
  coin); side = long spine + nacelles + dorsal fin; back = nacelle pair +
  fin (P7).
- Tri budget: VR_Gunship_Hull (1900, 2500) / VR_Gunship_Nacelle (700, 950) /
  VR_Gunship_Bay (300, 450) -> total ~2,900-3,900 (aim ~3,200; current 2,596).
  RAD gate target 1.75.

ALL FOUR: keep node names + identity transforms + absolute part-space +
grayscale luma bake (0.22..0.96 clamped) + one material per node family +
the exact GLB export flags (sec.5).

## 5. GLB contract (E57 rule 8 + pipeline, tree-verified from build_e69b.py /
build_remaster4.py / build_e69a.py)

- Single root per asset; Y-up; no rig; no UVs/texture coords; no animations.
- Vertex colors: FLOAT_COLOR point attribute named "Color", GRAYSCALE luma
  bake clamped 0.22..0.96 (hue-neutral - the runtime palette color
  multiplies over it; a colored bake would corrupt the palette).
- Materials: one Principled per node family, Base Color linked from a
  ShaderNodeVertexColor ("Color"); export_materials="EXPORT".
- Export: export_scene.gltf(filepath, export_format="GLB",
  use_selection=True, export_yup=True, export_apply=True,
  export_materials="EXPORT", export_vertex_color="MATERIAL",
  export_image_format="AUTO", export_skins=False, export_animations=False,
  export_normals=True, export_texcoords=False, export_tangents=False).
- Build-time gates: per-node TRIS aim<=t<=cap; asset RAD 0.88..1.12 x
  target (bbox diagonal / 2); ALL_GATES_PASS or exit 1.
- Blender: D:/Blender/blender.exe -b -P <script> (headless; not on PATH).
- Pipeline: build to a TEMP path in .evidence/I5xx/ FIRST (never assets/
  directly); re-audit render + sil96 gate; then swap into assets/;
  npm run build + dist measurement.

## 6. Pin safety (measured, tree-verified)

- causal483 / causal495: pinned at WAVE 2 (seeds 30201 / 9876 demo pilot;
  harness sources: .evidence/I483/causal483.mjs L63, .evidence/I495/
  causal495.mjs L73 + "wave 2" checks).
- playframe483 / playframe491 Part A: MENU frame (no enemies at all).
- playframe483 / playframe491 Part B: reseed 71201, begin(), FRAME 50 (~wave
  1; I483 bookkeeping measured per-type visible counts = 0 sentry / 0 wasp /
  0 pod at that window).
- All four rebuilt ships first spawn at waves 8 / 13 / 15 / 17 (CONFIG
  firstWaves: gunship 8, phantom 13, hauler 15, bulwark 17) - NONE are
  present in ANY pinned window. GLB loading alone adds zero draw calls /
  tris until an instance spawns. Precedent: E69 (I516/I517) landed
  phantom/hauler/bulwark GLBs with ZERO re-pins, pins stayed EXACT.
- VERDICT: all 5 harness pins EXPECTED EXACT through E72. Re-pin only on a
  measured drift (with measurement, house rule).
- pwa491 (11/11): asset bytes change, but the harness checks SW + manifest +
  offline boot, not asset content - EXPECTED EXACT.

## 7. dist + asset policy (PRE-REGISTERED)

- Current (I531): dist 5,255,796 B / 184 files; ceiling 6,100,000 B;
  CLOSE FLOOR E71 = 844,204 B (headroom >= 102,400 B or cut ladder).
- Replaced files (measured): phantom 183,724 + hauler 264,416 + bulwark
  149,884 + gunship 198,760 = 796,784 B.
- Expected new sizes (tri growth ~+20-60% per ship): ~+40-180 KB per file
  -> worst-case delta ~+450 KB -> worst-case dist ~5,705,000 B, still
  under the ceiling with >= 395,000 B to spare.
- Pre-registered tripwires (in order): (a) any single rebuilt GLB lands > 2x
  its current size -> decimate pass before swap (cut ladder C1); (b) dist
  after a swap > 5,750,000 B -> invoke cut ladder C1/C2 for the NEXT ship
  (panel-detail / ring-count reduction) before it lands; (c) headroom at
  G72.0 < 102,400 B -> cut ladder per the E70 rule.
- CLOSE FLOOR E72 re-derived WITH MEASUREMENT at G72.0.

## 8. Risks

K1 Node-name drift breaks renderer slot binding (glow/nacelle/pod slots fall
back to hull material or the glow never fires) -> build scripts keep the
exact names; integration verify (ST-503) checks useGLB binding + glow slots
headless. K2 RAD gate failure (bbox off by >12%) -> the build gate exits 1
before export; tune stations, not the gate. K3 Tri budget blowout ->
aim/cap gates per node in the build script; decimate ladder pre-registered
(sec.7). K4 See-through / z-fighting from inset recesses (the I501 ship v6
lesson) -> keep inset depth >= 0.02 u and recess walls non-coplanar with
parent surfaces; audit renders include the 3/4 view to catch it. K5 dist
growth -> tripwires (sec.7). K6 Pinned drift (expected zero) -> harnesses
re-run at G72.0; re-pin only on measured drift. K7 Grayscale bake too dark /
too light breaks the rendered-luma ladder (E57 rule 1) -> keep the
0.22..0.96 clamp + per-ship bake bands mirroring the current ships; the
CONFIG palettes + renderLumaGain are FROZEN.

## 9. Verification (per story)

- Per ship (ST-499..ST-502): build script gates ALL_GATES_PASS (tris + RAD)
  + audit-render re-run (clay 4-view + tint for the trio + sil96 front/back)
  viewed + sil96 gate (dart / truck / shield / bomber read, no coin-orb) +
  swap + npm run build + dist WITH MEASUREMENT + quality bar 6/6 (npm test
  1,187, vendor pins EXACT 4/4, BOM delta 0, hygiene).
- ST-503: headless integration verify (GLB load, node binding, glow slots,
  pool bounds - the newenemy483 pattern) + fleet sil96 re-audit.
- ST-504 (G72.0): 5 fresh harness runs ALL EXPECTED EXACT + CLOSE FLOOR E72
  WITH MEASUREMENT + AGENTS.md quality-bar refresh + bookkeeping.
`;
fs.writeFileSync("E:/Game/design/e72-enemy-artpass-research.md", doc, "utf8");
const b = fs.readFileSync("E:/Game/design/e72-enemy-artpass-research.md");
console.log("WROTE research doc:", b.length, "bytes");
// ASCII check
let nonAscii = 0; for (let i = 0; i < b.length; i++) if (b[i] > 127) nonAscii++;
console.log("non-ascii bytes:", nonAscii, "BOM:", b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF);
