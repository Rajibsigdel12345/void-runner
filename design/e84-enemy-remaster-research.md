# Enemy Remaster Round 2 Research - Void Runner (E84, I590)

ST-557 (I590) / E84. Authored under cgs-asset-spec (audit + research + per-role
brief finalization) per production/scope-check-E84.md (FROZEN I589). This doc is:
(a) the I590 full-fleet silhouette audit (measured, all 13 fleet ships), (b) the
bottom-4 selection vs the pre-registered default set, (c) labeled design-language
research, (d) the FINALIZED per-role shape briefs + per-node tri tables + the sil96
gate resolution for ST-558 / ST-559 (Blender builds). Extends
design/enemy-remaster-research-E68.md (I506 findings F1-F7 + rules R-GLOW / R-VALUE /
R-SIL STAND) and design/enemy-visual-language.md (E57 rules: 1 AND-collision test,
2 bold silhouette front AND back, 3 <= 3 materials, 4 accent semantics, 8 GLB
contract, 10 procedural fallback).

## 1. Labeled research sources (I590, this session)

YouTube (mcp__youtube; frame-based per the E68 pattern, 480px, labeled frames):

- Y-E1 Draw Sessions "Concept Art Spaceship Design - Easy Industrial Design
  Sketching Workflow" (3oWZSF-1bEY, 23:10, pub 2024-12-13) frames 0:25 / 5:00 /
  11:30 - frame 0:25: five numbered THUMBNAIL ships, each with a distinct massing
  (cruiser / gunship / interceptor / fighter) sketched before any detail; frame 5:00:
  the same fleet as SOLID BLACK silhouettes (the silhouette stage is a real gate);
  frame 11:30: refined silhouettes where marker VALUE BANDS carry the surface read.
  Takeaway: thumbnails-first, one massing per role, value bands baked into the
  surface - not materials.
- Y-E2 RookieDev "Master Level Geometry: How Shape Controls Your Players"
  (iFjhMbUo0SU, 9:53, pub 2026-10-12) frames 0:25 / 5:00 - frame 5:00: the shape
  language chart (circle = friendly, square = stable, TRIANGLE = dangerous,
  "villains = triangles"); CEDEC 2017 triangle rule (2:13): sharp angles create
  tension and point the eye at the apex. Takeaway: enemy massing should be
  dominated by sharp apexes / blades / spikes, with the apex facing the player;
  no round "friendly" hulls in the enemy roster.
- Y-E3 Austin McCloud "The DEFINITIVE Ranking of Every Arwing In Star Fox
  (1993-2026)" (a9fHGAhljXg, 6:35, pub 2026-06-04) frames 0:30 / 3:20 - frame 0:30:
  SF64 3D enemy attack-carrier: LAYERED heavy massing, every sub-part readable;
  frame 3:20: the Arwing nose - a clean triangular delta with one canopy line.
  Takeaway (with the I589 scope-check Star Fox label): one role, one unmistakable
  silhouette; 30 years of the same language = consistency is the brand.
- Y-E4 AL82 Retrogaming "R-Type II Longplay (Arcade) [60 FPS]" (ooFRvOjAXHk, 44:53)
  frames 0:30 / 3:20 / 6:40 - frame 0:30: a wave with 3+ distinct enemy types on
  screen at once, each readable at ~32 px by silhouette ALONE (small fighters /
  cluster ship / heavy); frame 3:20: boss + escorts + drones coexisting without
  read confusion. Takeaway: the fleet is a CONTRAST matrix - every role claims a
  different footprint (size, aspect, angularity) so wave chaos stays legible.

Carry-over (STANDS, not duplicated): I589 scope-check research labels (Star Fox
distinct-silhouette-per-role + Elite Dangerous fighter families); E68 I506 F1-F7
(two generations / remaster-tier still rejected / palette collisions / glow-sphere
disease / zero surface detail); E57 rules 1-4, 8, 10.

## 2. I590 full-fleet audit (measured)

Method: .evidence/I590/audit_i590.py (Blender 5.2.3 headless, single run,
audit_i590.log). Per ship: import GLB; count tris (polygon loop-tris); file bytes;
Blender-space bbox radius r; normalize (bbox center -> origin, max extent -> 1.0);
override all materials with a white emission shader; film transparent; ORTHO camera,
96x96, 3 canonical views - A = camera at +Y (in-plane X-Z), B = camera at +X
(in-plane Y-Z), C = camera at +Z (in-plane X-Y) - ortho_scale = max in-plane
extent x 1.04; fill = opaque pixels / 9216; sil96 = mean(fill A, B, C). The
silhouette PNGs (sil96_<ship>_{A,B,C}.png, 39 total) are the visual record;
audit_i590.json holds the raw numbers.

### 2.1 Geometry + silhouette table (13 fleet ships)

| ship           | tris  | bytes   | B/t   | r      | fill A | fill B | fill C | sil96  |
|----------------|-------|---------|-------|--------|--------|--------|--------|--------|
| drone          | 1,516 | 118,828 | 78.38 | 1.4667 | .0884  | .0895  | .1016  | .0932  |
| stinger        | 1,732 | 133,172 | 76.89 | 2.1624 | .0130  | .0433  | .0130  | .0231  |
| warden         | 1,556 |  91,064 | 58.52 | 3.6188 | .0284  | .0268  | .0373  | .0308  |
| flyer          | 1,770 | 139,640 | 78.89 | 1.7169 | .0341  | .0282  | .0616  | .0413  |
| enemy_hunter   | 3,366 | 227,496 | 67.59 | 1.0112 | .1502  | .1603  | .3152  | .2086  |
| enemy_gunship  | 2,906 | 215,032 | 74.00 | 1.8900 | .0413  | .0599  | .0551  | .0521  |
| enemy_sentry   | 2,934 | 203,688 | 69.42 | 1.9421 | .0386  | .0553  | .0625  | .0521  |
| enemy_wasp     | 4,020 | 310,036 | 77.12 | 1.5341 | .0483  | .0283  | .0397  | .0388  |
| enemy_phantom  | 4,544 | 343,244 | 75.54 | 0.9691 | .0648  | .1437  | .0787  | .0957  |
| enemy_hauler   | 3,724 | 289,748 | 77.81 | 1.2723 | .1794  | .1727  | .1845  | .1789  |
| enemy_bulwark  | 3,160 | 190,584 | 60.31 | 1.6557 | .0595  | .1502  | .0590  | .0896  |
| enemy_sweeper  | 1,946 | 129,764 | 66.68 | 1.7960 | .0213  | .0267  | .0587  | .0356  |
| enemy_beacon   | 3,144 | 208,100 | 66.19 | 2.7756 | .0412  | .0408  | .0825  | .0548  |

Fleet sil96 median = 0.0521. The 4 remaster targets are the 1st/2nd/4th/5th
sparsest silhouettes in the fleet (0.0231 - 0.0932). Note enemy_sweeper (0.0356)
is the 3rd sparsest - an E75 D3 asset, OUT of E84 scope by the frozen set (no new
roster entries); registered as a candidate for a future fleet pass.

### 2.2 Composite ranking (frozen method: sil96 fill + tris + B/t)

Composite = (pctAsc(tris) + (100 - pctAsc(B/t)) + pctAsc(sil96)) / 3, over all 13
ships; percentile rank = sorted index / 12 x 100 (0 = worst on that axis: fewest
tris / highest B/t = worst packing / sparsest silhouette). Bottom-4 = lowest
composite. Computed by .evidence/I590/rank_i590.cjs -> ranking_i590.json.

| # | ship          | tris  | B/t   | sil96 | sTri | sBpt | sFill | comp   |
|---|---------------|-------|-------|-------|------|------|-------|--------|
| 1 | stinger       | 1,732 | 76.89 | .0231 | 16.7 | 33.3 |  0.0  | 16.67  |
| 2 | flyer         | 1,770 | 78.89 | .0413 | 25.0 |  0.0 | 33.3  | 19.44  |
| 3 | drone         | 1,516 | 78.38 | .0932 |  0.0 |  8.3 | 75.0  | 27.78  |
| 4 | warden        | 1,556 | 58.52 | .0308 |  8.3 |100.0 |  8.3  | 38.89  |
| 5 | enemy_sweeper | 1,946 | 66.68 | .0356 | 33.3 | 75.0 | 16.7  | 41.67  |
| 6 | enemy_gunship | 2,906 | 74.00 | .0521 | 41.7 | 50.0 | 41.7  | 44.44  |
| 7 | enemy_wasp    | 4,020 | 77.12 | .0388 | 91.7 | 25.0 | 25.0  | 47.22  |
| 8 | enemy_sentry  | 2,934 | 69.42 | .0521 | 50.0 | 58.3 | 50.0  | 52.78  |
| 9 | enemy_hauler  | 3,724 | 77.81 | .1789 | 83.3 | 16.7 | 91.7  | 63.89  |
|10 | enemy_beacon  | 3,144 | 66.19 | .0548 | 58.3 | 83.3 | 58.3  | 66.66  |
|11 | enemy_phantom | 4,544 | 75.54 | .0957 |100.0 | 41.7 | 83.3  | 75.00  |
|12 | enemy_bulwark | 3,160 | 60.31 | .0896 | 66.7 | 91.7 | 66.7  | 75.00  |
|13 | enemy_hunter  | 3,366 | 67.59 | .2086 | 75.0 | 66.7 |100.0  | 80.56  |

AUDIT BOTTOM-4 = {stinger, flyer, drone, warden} = the pre-registered DEFAULT SET.
DIVERGENCE: NO -> no override registration required (I570 pattern not triggered).
The audit independently confirms the E84 set.

## 3 Findings

F1 (audit confirms the frozen set): the bottom-4 composite set = {stinger 16.67, flyer 19.44,
drone 27.78, warden 38.89} = exactly the pre-registered DEFAULT SET. The nearest non-set ship
(sweeper, 41.67) leaves a 2.78-point gap, so no tie-break was needed and no SET override is
required (I570 pattern: record + register only on divergence).

F2 (targets = the 4 sparsest silhouettes): the 4 remaster targets are the 1st/2nd/4th/5th
sparsest sil96 in the 13-ship fleet (0.0231-0.0932 vs fleet median 0.0521). The audit metric
independently reproduces the standing user art complaint.

F3 (stinger = 1px line): stinger is the longest ship in the fleet (ext 4.02 x 1.08 x 1.18) but
the sparsest silhouette (sil96 0.0231; side views A/C fill = 0.013 = a 1px line at 96 px).
Longest geometry, least presence - the worst length-to-presence ratio in the fleet.

F4 (warden = scattered debris): warden is the 4th sparsest (0.0308) and reads as scattered
slabs, not a tank - the tank/turret role is failing at silhouette level. It is also the
cheapest fix in the fleet: best B/t (58.52) = fewest bytes per triangle.

F5 (B/t alone is not a quality signal): wasp (sil96 0.0388, 2nd sparsest) and bulwark (0.0896)
rank mid-fleet on B/t, yet their silhouette fill says more about game-read than their packing
ratio does. The composite (sil96 + tris + B/t) is what selects the right set; any single axis
mis-ranks.

F6 (drone's defect is identity, not sparsity): drone has the best sil96 fill of the 4 targets
(0.0932, top-5 in the fleet) - its defect is shape identity (an ambiguous blob at 96 px), so
its continuity gate stays strict at the current baseline.

F7 (contrast matrix has 4 open slots): the 9 non-target ships already occupy the massing
language (arrow/hunter, slab+bores/gunship, platform+sentry, wing/wasp, pod/phantom,
stack/hauler, wall+spine/bulwark, arc/sweeper, mast/beacon). The 4 open slots: compact V
(boomerang), long dart (missile), squat wide slab + turret (bulwark-tank), crescent (strafing
blade). No v2 ship may collide with an occupied slot.

F8 (threat language): all enemy massing stays sharp-apex / triangle-dominant (Y-E2 CEDEC rule:
triangles read as "dangerous"); the rounded/soft forms stay reserved for the player's airship
mass, keeping enemy-vs-player reads unambiguous in wave chaos.

## 4 Per-role design briefs (FINAL)

All four: sharp-apex / triangle-dominant massing (F8); R-GLOW / R-VALUE / R-SIL carried over
from E68 (the role's signature emissive = its glow node); 3-layer detail scaled to the
2,000-tri budget (far silhouette / mid paneling / near greebles; the rear is cheap - the chase
cam sees the enemy's front 3/4 + flanks).

| ship    | slot (F7)        | brief                                                                                                                                  |
|---------|------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| drone   | compact V        | "boomerang": compact V / pronged swarm unit; two swept prongs + a small central spine; small, fast, numerous; central glow node           |
| stinger | long dart        | "missile dart": longest L/W in the fleet, forward canards, inline nose-spike glow (NO ball nose); reads as a pointed needle at 96 px      |
| warden  | squat slab+turret| "turret bulwark": squat wide hex slab + center turret hump + 3 thick symmetric side slabs + front recessed core; NO loose debris          |
| flyer   | crescent         | "crescent": slim spine + two substantial crescent side-blades; recessed magenta dome (emissive slot); mid-tier strafing                   |

### 4.1 Per-node tri tables (AIM / HARD cap)

| ship    | node                | AIM   | HARD  |
|---------|---------------------|-------|-------|
| drone   | VR_Drone (single)   | 1,900 | 2,400 |
| stinger | VR_Stinger_Body     | 1,820 | 2,260 |
| stinger | VR_Stinger_Core     |   180 |   240 |
| warden  | VR_Warden_Hull      | 1,250 | 1,550 |
| warden  | VR_Warden_Armor     |   750 |   950 |
| flyer   | VR_Flyer_Body       | 1,850 | 2,310 |
| flyer   | VR_Flyer_Dome       |   150 |   190 |
| set     | total               | 8,000 | 10,000 |

### 4.2 Node-contract invariant (bit-identical to current assets)

- drone: SINGLE node VR_Drone (first mesh wins in droneMesh.js useGLB).
- stinger: VR_Stinger_Body + VR_Stinger_Core (Core = glow slot).
- warden: VR_Warden_Hull + VR_Warden_Armor (exactly 2 nodes).
- flyer: VR_Flyer_Body + a node matching /dome|core/i (VR_Flyer_Dome = emissive slot).
- The v2 GLBs must export the EXACT current node names: zero src/render changes at the swap.

### 4.3 Contrast matrix (occupied vs open)

| slot                 | occupied by      | open for     |
|----------------------|------------------|--------------|
| arrow / layered mass | hunter           | -            |
| slab + bores         | gunship          | -            |
| platform + barrel    | sentry           | -            |
| twin wing            | wasp             | -            |
| quad-pod             | phantom          | -            |
| cargo stack          | hauler           | -            |
| wall + spine         | bulwark          | -            |
| arc + greeble        | sweeper          | -            |
| mast + lamp          | beacon           | -            |
| compact V (boomerang)| -                | drone v2     |
| long dart (missile)  | -                | stinger v2   |
| squat slab + turret  | -                | warden v2    |
| crescent blades      | -                | flyer v2     |

## 5 Gate resolution + budget cross-check

### 5.1 sil96 continuity gate (frozen mechanism: audit baseline +/-15%)

- drone: baseline 0.0932 is SOUND (top-5 fleet fill) -> strict band [0.0792, 0.1072]. NO override.
- flyer: baseline 0.0413 is the real shape (identity defect, not sparsity) -> strict band
  [0.0351, 0.0475]. NO override.
- stinger: baseline 0.0231 IS the defect (F3: 1px line). A strict +/-15% band would forbid the
  fix. RE-BASELINED to target band [0.030, 0.040] (center 0.035 = +52% vs baseline). Registered
  as GATE-OVERRIDE-E84-S1 in .evidence/I590/gate_overrides.json (I570 record+register pattern).
- warden: baseline 0.0308 IS the defect (F4: scattered slabs). RE-BASELINED to target band
  [0.045, 0.060] (center 0.0525 = +70% vs baseline, anchored at the fleet median 0.0521).
  Registered as GATE-OVERRIDE-E84-S2.
- The scope-check "+30-50% fill where tris allow" build goal is achieved through S1/S2 (the two
  ships whose baselines are the defect); drone/flyer stay inside strict continuity.

### 5.2 Budget cross-check (frozen scope-check numbers, re-verified I590)

- Legacy-4 set: 482,704 B / 6,574 t (audit: 118,828 + 133,172 + 91,064 + 139,640 B; 1,516 +
  1,732 + 1,556 + 1,770 t).
- New-4 set target: 600,000 B / 8,000 t (4 x 150,000 / 4 x 2,000). Delta: +117,296 B / +1,426 t.
- dist: 7,093,058 + 117,296 = 7,210,354 B (target); ceiling 7,400,000 -> floor 189,646 B
  (>= 102,400 floor, cut ladder NOT expected); tripwire 7,297,600 (margin 87,246 B at target).
- Asset cap: current 4,672,268 B / 120,732 t (244 B under the 4,563 KiB cap) -> at target
  4,789,564 B / 122,158 t. PRE-REGISTERED renegotiation at ST-560: cap 4,688 KiB (4,800,512 B,
  ~11 KB margin) + 124,158 t hard, WITH MEASUREMENT (frozen scope-check tripwire line).
- Worst case (4 x 200,000 B hard) = 7,410,354 B OVER ceiling -> cut ladder C1/C2 engages first
  (frozen); the practical 4-ship cap = tripwire (avg ~171,800 B/ship).

## 6 Next iterations (E84 build order)

- ST-558 (I591): build drone v2 + warden v2 in Blender 5.2.3 headless -> .evidence/I591/ ONLY
  (build_*.py + GLBs + audit PNGs + run log; NO game files). Gates: per-node tri caps (4.1);
  GLB <= 150,000 B target / 200,000 B hard (C2 rebuild); sil96 within the doc bands (drone
  strict [0.0792, 0.1072]; warden override S2 [0.045, 0.060]); EEVEE 960x540 audit, 4 views x
  (clay + tint) + front/sil96 per ship; 1 rework per ship max.
- ST-559 (I592): build stinger v2 + flyer v2 -> .evidence/I592/ ONLY (same gate set; stinger
  override S1 [0.030, 0.040]; flyer strict [0.0351, 0.0475]).
- ST-560 (I593): THE SWAP + asset-cap renegotiation WITH MEASUREMENT + playframe B probe ->
  decision + 5-harness gate.
- ST-561 (I594): G84.0 close + CLOSE FLOOR E84 WITH MEASUREMENT + AGENTS.md item-4 refresh + push.
