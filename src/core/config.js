﻿﻿﻿﻿// ALL tunables live here (balance table). See design/gdd.md for rationale.
export const CONFIG = {
  // ST-431 (I463, E60 B1): role-named palette - the single role-truth section for
  // every world/UI color (threejs-game-studio material kit: bodyPrimary/hazard/
  // reward/shield/emissiveSignal). VALUES UNCHANGED: the 12 canonical hexes below
  // are the exact values already shipped at each carrier key; nothing reads from
  // this section (zero behavior change, causal-EXACT). Traceability: every other
  // world/UI color maps to one of these roles (or to a per-entity identity hue
  // documented in design/enemy-visual-language.md s3 / campaign themes).
  // C2 value-band audit (design/value-band-audit-E60.md): floor owns the bottom
  // band (sRGB luma ~10-13), actors sit 7:1 above it - the bands below do not
  // need re-spacing.
  palette: {
    bodyPrimary:  0xab9374,  // ship hull (ship.body.color) - mid-band warm sand
    bodyDark:     0x54402e,  // ship wing / shadow tone (ship.wing.color)
    cockpitSignal: 0x59d8ff, // cockpit emissive; L1 bullet family (fx.palette.bulletLevel[0] 0x7fe4ff brightens it)
    hazard:       0xff4a2a,  // threat red: enemy-bullet emissive (enemyBullets), stinger accent - the one danger color
    hazardEmber:  0xff9a3d,  // warm ember telegraph: gunship payload bay, engine mid plume, killRing family (0xffa44a)
    reward:       0xffc300,  // reward gold: rapid pickup (powerup/pickup rapid); spread 0xff9f43 is its ember sibling
    rewardVital:  0x69f0ae,  // magnet (green); bullet L2 0x8affc0 is its bright sibling
    rewardCharge: 0xff4dd8,  // overdrive (magenta); fx.palette.power family
    shield:       0x53d8ff,  // shield pickup + shield FX cyan; graze/drone families
    floorBright:  0x483728,  // arena grid hub (arena.gridBright) - bottom value band
    floorDim:     0x1a130d,  // arena grid rim (arena.gridDim) - bottom value band
    starNear:     0xe8f1ff,  // starfield near shell (starfield.near.color); far shell 0x9db4ff
  },
  paletteMap: { // ST-431 (I463): full traceability (color key -> role family). Data-only,
    // documentation truth (nothing reads this). Per-entity identity hues (fleet
    // bodies, boss rims, campaign themes) are documented at their keys and in
    // design/enemy-visual-language.md s3.
    ship: "bodyPrimary/bodyDark/cockpitSignal",
    arena: "floorBright/floorDim",
    starfield: "starNear",
    enemyBullets: "hazard",
    stinger: "hazard (accent) + identity rust body",
    gunship: "hazardEmber (bay) + identity gunmetal body",
    fleetBodies: "identity hues (enemy-visual-language.md s3)",
    rock: "hazardEmber desaturated (I257 warm edge 0xd8a878)",
    powerup: "reward/rewardVital/rewardCharge/shield + bomb 0xffa84a = hazardEmber (I464 C1: moved out of the threat-red family)",
    fxParticles: "per-entity families of the 12 roles (see fx.palette comments)",
    enemyRim: "per-role darkened body family, luma <= 29 (E59 A2 frozen)",
    shipHitFlash: "hazard-light (E59 A3 frozen)",
    campaignThemes: "per-stage overrides of floorBright/floorDim/starNear + accent role",
  },
  arena: {
    radius: 26,
    // ST-257 (I269): custom warm floor grid (src/render/arenaFloor.js) replaces
    // the cool PolarGridHelper (ST-248). gridBright = center-hub / brightest
    // line; its luma is the ST-177 FX-off floor bg proxy (tests/paletteHarmony
    // .test.js), so it must stay <= bomb pickup luma (118.8) - 59.
    gridBright: 0x483728, // ST-328 (I359): hub luma 55.7->57.5 (richer hub; < bomb luma 118.8 - 59 = 59.8)
    gridDim: 0x1a130d, // ST-328 (I359): dim edge band luma 25.3->20.1 (stronger bright/dim contrast; < FLOOR 50)
    grid: {
      rings: 5, // was 8
      sectors: 8, // was 12
      divisions: 48, // per-ring segments (was 64)
      spokeSegs: 8, // spoke subdivisions - per-vertex radial falloff
      falloffPow: 1.6, // mix = dim + (bright - dim) * (1 - t)^pow, t = r / radius
      // ST-293 (I315): two-segment radial falloff with a mid-arena REST BAND
      // (restFalloff in src/core/floorGrid.js) replaces the single-exponent
      // falloffPow ramp for the rendered grid - the I315 floor readability
      // audit (floorab_v3) found the old ramp read as a smooth monotone fade
      // with no readable plateau. restT = where the inner segment ends and the
      // rim fade begins; restHold = the plateau level (its ring luma stays
      // under the FLOOR-50 ceiling, so the band reads as floor, not a bright
      // dot); restPowA = hub->rest-band fade shape (small = quick fade then
      // flat); restPowB = rest-band->rim depth cut (larger = steeper).
      // falloffPow is retained for the legacy pure fns (falloff/gridColorAt,
      // still unit-tested); the render (arenaFloor.js) now uses restFalloff.
      restT: 0.5,    // rest band ends at half radius (r = 13) - rim fade beyond
      restHold: 0.76, // plateau level; rings 1-2 luma ~48.5, under FLOOR 50
      restPowA: 0.05, // quick hub->rest-band fade, then a flat readable band
      restPowB: 2.0,  // steeper rim depth cut than the old single (1 - t)^1.6
      // ST-328 (I359): defined center hub + one richer rim ring, data-driven via
      // fullRingLayout (src/core/floorGrid.js). hubRings = fractions of arena.radius
      // (r 2.6 / 4.68) at hubF (full bright anchor); rimRing (r 23.92) at rimF. No
      // in-texture rings (floor_surface.png hub ring stays the only texture-level
      // ring; the separate arenaRing.js neon band 23.3-24.2 is untouched). Values-
      // only re-pin: floorab ring p90 + f50.floor (<= 61), zero sim (p1 EXACT),
      // draw calls / tris unchanged (all rings share one LineSegments; lines add 0 tris).
      hubRings: [0.10, 0.18], // defined center hub (r 2.6 / 4.68)
      hubF: 1.0, // full bright anchor (57.5 luma; main rings stay < FLOOR 50)
      rimRing: 0.92, // r 23.92 - warm edge ring under the arenaRing band (23.3-24.2)
      rimF: 0.55, // moderate warm edge (mix level, raw line luma ~40.8)
    },
    // ST-277 (I294): thin radial floor disc UNDER the grid (src/render/floorDisc.js) -
    // the E25 "arena depth cut" (Dota-2 ladder): a solid warm-neutral base so the v7
    // lower-hemisphere sky stops showing through the grid-only floor. Procedural canvas
    // radial gradient (in-code 0 KB - no asset). Brighter center -> darker rim. All
    // stops warm neutral R>G>B, luma < 50 (floor-ceiling convention, FLOOR-50 family).
    // ST-327 (I358): assets/floor_surface.png (Blender, 8,586 B, 512x512 sRGB bytes,
    // max luma 48.757 < 50) replaces the canvas map at load time via assetLoader key
    // floorSurface (swap in main.js onAsset); these stops stay the fallback if the
    // PNG is missing/corrupt. Asset budget R-E39-3: hard cap 28,672 B (0 KB in-code).
    floorDisc: {
      center: 0x1c1712, // hub base; sRGB luma 23.7
      mid: 0x110e0b,    // mid stop; sRGB luma 14.4
      rim: 0x0b0908,    // edge base; sRGB luma 9.4 - recedes into the boundary ring
      midT: 0.65,       // mid-stop position along the center->rim radius
      y: -0.02,         // just below the grid lines (y=0) - no z-fight
    },
  },

  // I170 (ST-170): procedural-music intensity escalation, driven from world state.
  // x in [0,1] is fed to audio.musicIntensity(x) (opens the drone filter + lifts the
  // bus as tension rises). Tension climbs with the wave via a smooth asymptote
  // scaled to waveCeil (headroom below 1); a live boss lifts it to at least bossFloor.
  music: {
    intensity: {
      waveK: 12,      // exp time-constant in waves (larger = slower build)
      waveCeil: 0.75, // max intensity from wave alone (headroom below 1 for the boss)
      bossFloor: 0.9, // min intensity while a boss is alive (peak-tension moment)
      phase2Lift: 0.1, // ST-241: extra intensity while the boss is enraged (phase 2), capped at 1
      releaseTime: 4 // ST-241: s to decay from the boss peak back to wave tension after death (labeled internal choice: YouTube supplementary check found no release-duration pin - see design/audio-music.md)
    },
    warp: {           // I172 (ST-172): bullet-time (slow-mo) audio
      centsMax: 700,  // max pitch drop in cents at full warp (a tritone; slow-mo 0.4x lands at -420)
      filterKeep: 0.3, // fraction of the intensity-opened filter kept at full warp (darken)
      death: {            // I174 (ST-174): death slow-mo - the bed dilates briefly on a ship hit
        scale: 0.25, // implied enemy scale at the moment of the hit (x = 1 - scale = 0.75 -> -525 cents)
        dur: 0.8    // window (s) over which the dilation glides linearly back to 0
      }
    }
  },

  ship: {
    accel: 26,        // units/s^2
    maxSpeed: 14,     // units/s
    damping: 1.6,     // exponential drag /s
    radius: 0.9,      // collision radius
    aimEase: 9,       // how fast nose eases toward aim (lambda)
    invulnTime: 1.8,  // seconds of invulnerability after a hit (I92: 1.6->1.8, reposition headroom)
    knockback: 7,     // knockback impulse on hit
    lives: 3,
    palette: { // ST-251 (I262): E19 warm-world hero pass; read by src/render/shipMesh.js
      body:    { color: 0xab9374, metalness: 0.15, roughness: 0.4, emissive: 0xffb347, emissiveIntensity: 0.12 },   // I390/ST-354: I388 fallback (a)+(b) after A/B#1 G1 miss (luma 149.9, warm R>B; faint emissive lifts screen p50)
      wing:    { color: 0x54402e, metalness: 0.3, roughness: 0.55 },    // dark umber - the ship shadow tone (luma 67)
      cockpit: { color: 0x0b1830, emissive: 0x59d8ff, emissiveIntensity: 1.4, roughness: 0.2 } // FROZEN identity (pinned in tests/paletteHarmony.test.js)
    },
    flame: { // ST-256 (I268): layered engine flame - math in src/core/flame.js (pure, tested)
      core:  { color: 0xffffff, opacity: 0.95, radius: 0.10, len: 0.70 }, // hot white core (small; blooms = INTENDED engine accent, like the cockpit)
      mid:   { color: 0xff9a3d, opacity: 0.65, radius: 0.28, len: 1.25 }, // warm orange plume (R linear = 0.65 < 0.72 bloom threshold - sub-band)
      glow:  { color: 0xffb347, opacity: 0.40, size: 1.1 },               // soft additive glow sprite at the nozzle root (no geometry)
      flicker: { amp: 0.15, speed: 40, amp2: 0.10, speed2: 77 }          // deterministic two-sine flicker (motion-gated; reduced-motion = steady)
    },
  },

  weapon: {
    fireInterval: 1 / 5.5, // seconds between shots
    bulletSpeed: 34,
    bulletLife: 1.1,
    bulletRadius: 0.18,
    maxBullets: 64,
    homing: { turn: 3, range: 8 }, // MAGNET: max steering rad/s, target search radius
    // ST-122: permanent weapon progression by wave - level 1 (base) -> 2 -> 3.
    // Each level: minWave (unlock), count (bullets per trigger), arc (total radians),
    // rateMul (extra fire-rate multiplier stacked on top of the rapid power-up).
    // The spread POWER-UP overrides count/arc for its duration; rateMul always stacks.
    levels: [
      { minWave: 1,  count: 1, arc: 0,     rateMul: 1.0 },  // L1 (base): single shot
      { minWave: 5,  count: 2, arc: 0.16,  rateMul: 1.0 },  // L2: narrow twin
      { minWave: 10, count: 3, arc: 0.34,  rateMul: 1.15 }  // L3: triple + faster
    ]
  },

  asteroid: {
    // size key: L -> M -> S. splits = how many fragments a destroyed rock produces.
    sizes: {
      L: { radius: 2.2, speed: [2.2, 3.6], score: 25,  splits: [2, 3], child: 'M' },
      M: { radius: 1.3, speed: [3.0, 4.6], score: 50,  splits: [2, 3], child: 'S' },
      S: { radius: 0.7, speed: [3.8, 5.8], score: 100, splits: [],     child: null }
    },
    split: {
      spread: 0.9,            // ST-119: split fragment angle = parent heading +/- this (rad)
      genBonus: [0, 0.25, 0.5]  // ST-120: per-generation score bonus (gen0 +0%, gen1 +25%, gen2 +50%; deeper clamps to last)
    },
    spin: [0.4, 1.8],   // rad/s tumble range
    maxConcurrent: 24,
    golden: {           // ST-052: rare glowing rock - faster, worth 5x
      chance: 0.05,     // per rim-spawn roll in eligible waves (splits are never golden)
      speedMult: 1.35,  // extra spawn speed on top of the wave ramp
      scoreMult: 5,     // score multiplier on kill
      minWave: 3        // waves 1-2 stay plain (teach the base loop first)
    },
    shielded: {         // ST-121: shielded rock - absorbs N bullet hits, then shatters (NEVER splits), worth more
      minWave: 4,       // waves 1-3 stay plain (base loop + golden teach first)
      chance: 0.10,     // per rim-spawn roll (takes precedence over golden on the same roll)
      armor: 3,         // bullet hits to exhaust the shield before it shatters
      size: 'M',        // footprint/speed from sizes.M (render adds a shield shell later)
      score: 400        // shatter reward - higher than any single rock; costs armor shots
    },
    rim: {             // I278 (ST-264): rock silhouette rim (I257 warm-edge family), data-driven
      color: 0xd8a878,      // I257 final warm edge (FROZEN accent - the cool rim was the periwinkle root cause)
      strength: 0.12,       // I257 final (FROZEN): 0.5 -> 0.22 -> 0.12 (quantitative screenshot A/B)
      power: 8              // I278 (ST-264): fresnel power (was hardcoded 5.0) - 8 = thinnest edge accent so the
                            // rim hugs the silhouette and the I257 face values (rim-off R79/G55/B37) hold
    }
  },

  wave: {
    base: 4,            // wave n spawns base + growth*n asteroids
    growth: 1,
    maxConcurrentGrowth: 2,
    speedPerWave: 0.06, // speedMult = 1 + n*speedPerWave (capped)
    speedCap: 2.1,      // I39: 1.9 -> 2.1, ramp now runs to wave 18 (balance-notes I39)
    maxConcurrentCap: 24,
    intermission: 2.2,
    stallTime: 45,       // I42: wave advances after 45s without a clear (leftover rocks carry over)
    spawnMinPlayerDist: 8, // I34: rim spawn keeps at least this far from the ship
    breatherOpenFrac: 0.5, // ST-242: a breather wave (right after a boss, ST-092) opens with this fraction of the normal open batch
    breatherMinRocks: 3 // ST-242: floor on a breather open batch
  },

  waveEndless: {
    // ST-058: endless difficulty curve from wave `first` onward. There is no
    // final wave - pressure comes from capped content, shrinking intermissions
    // and a rising small-rock share (spawnMix table, ST-131) instead of unbounded totals.
    first: 10,             // the curve engages from wave 10
    contentCap: 36,        // toSpawn cap (base + growth*n would overshoot by wave 32)
    minIntermission: 1.2,  // intermission floor (base 2.2s shrinks toward it)
    intermissionStep: 0.08 // per-wave intermission shrinkage after `first`
    // ST-131: the S ramp (former sBiasStep/sBiasCap) moved into the spawnMix table
  },

  spawnMix: {
    // ST-131: data-driven asteroid spawn size mix (I131 rebalance). The GDD
    // fixes split rules and per-wave content volume but not the L/M/S spawn
    // ratios - this table (with production/balance-notes.md ## I131) carries
    // authority, like powerup.weights (ST-130). Rows are scanned in order;
    // the first row with wave <= toWave wins (toWave -1 = unbounded last row).
    // Shares within a row sum to 1. Waves 1-9 are byte-identical to the
    // pre-I131 logic (same 1-draw width, same 0.3/0.4/0.3 base); only the
    // wave 10+ shape changed: the old 0.02/wave S ramp to a 0.45 cap kept
    // eroding L (50% at w1 -> 24% at w17) while adding little S pressure -
    // playtest data shows S kills are split-supplied (72% of kills vs 49% of
    // spawns at w14) - so the S cap drops to 0.40 and L gets a 0.28-0.30 floor.
    rows: [
      { toWave: 2,  L: 0.50, M: 0.50, S: 0.00 }, // teach: big targets, no S
      { toWave: 9,  L: 0.30, M: 0.40, S: 0.30 }, // base (unchanged pre-I131)
      { toWave: 14, L: 0.28, M: 0.32, S: 0.40 }, // endless ramp band
      { toWave: -1, L: 0.30, M: 0.30, S: 0.40 }  // late: L floor, S cap 0.40
    ],
    lFloor: 0.28 // invariant: no row may drop L below this (see spawnMix test)
  },

  waveMods: {
    // ST-051: per-wave modifiers, chosen deterministically from (world seed, wave
    // number) via a derived RNG - stall-vs-clear timing cannot change the pick.
    first: 3,             // waves 1-2 stay plain (teach the base loop first)
    list: ['fast', 'small', 'inward', 'big'], // ST-228: 4th entry - the (seed, wave) roll re-maps from wave 3 onward (documented, I233)
    fastSpeedMult: 1.4,   // 'fast': extra spawn-speed multiplier on top of the ramp
    smallSBias: 0.5,      // 'small': spawn rolls S with this probability
    inwardAccel: 2.0,     // 'inward': u/s^2 pull of all rocks toward the arena center
    bigLBias: 0.5,        // ST-228: 'big' (HEAVY ROCKS): spawn rolls L with this probability (mirror of smallSBias)
    modBias: {            // ST-304 (I329): director wave-mod weighting - gentle avoids, hard double-weights
      gentle: { avoid: ['fast', 'inward'] },
      hard:   { prefer: ['fast', 'inward'] }
    }
  },

  boss: {
    // ST-055: the Monolith - a large slow-homing boss that appears on every
    // multiple of everyWave. Takes 1 damage per bullet; periodically bursts a
    // ring of S rocks; on death splits into 4 M rocks and pays a big score.
    everyWave: 5,    // waves 5, 10, 15, ...
    maxHp: 64,      // I325/ST-301: was 40 (R1a: 7.7 s first-boss TTK < 12 s floor; 64 -> 12.7 s mid-skill kiter TTK)
    hpFirstWave: 10, // ST-064: HP scale engages at the endless-curve wave
    hpStep: 12,      // +HP per 5-wave boss beyond the first
    hpCap: 88,       // ceiling (88 <= 2.2x base, keeps the fight beatable)
    radius: 3.4,     // big, slow, imposing
    speed: 1.6,      // slow drift toward the ship (always dodgeable)
    turn: 0.8,       // sluggish heading change rad/s
    ringEvery: 2.0,  // seconds between ring bursts
    ringCount: 8,    // S rocks per burst (capped by the field's maxConcurrent)
    splitCount: 4,   // M rocks on death
    fireEvery: 2.2,  // ST-056: seconds between aimed bolts
    enterTime: 0.8,  // I325/ST-301: was 1.2 (R1b: P1 threat vacuum - boss fires from t=0.8 s; ST-135 intro)
    rim: {            // ST-252: silhouette rim (onBeforeCompile, I257 pattern) - the obelisk's edges
                       // separate from the warm E18 world at distance. Hull + crown only; the core
                       // seam carries no rim (its pulsing emissive IS the distance read).
      color: 0x9a5bff,        // Monolith rim - purple identity (B>R>G), harmonizes with body 0x7a4dff
      splicerColor: 0x2dd4bf, // Splicer rim - teal identity (matches the variant body hex)
      hull: 0.45,             // hull edge strength (I267 ST-255: stronger so the hull reads vs the cool sky; still sub-bloom)
      crown: 0.30,            // crown edge strength (I267 ST-255: a touch softer than the hull)
      phase2Lift: 1.6,         // phase-2 enrage: rim brightens with the body (hull 0.45 -> 0.72 max,
                              // still under the bloom band - ST-252 bloom-band audit confirms)
      power: 7                // I278 (ST-264): fresnel power, DATA-DRIVEN (was hardcoded pow 5.0): a thinner,
                              // silhouette-hugging rim instead of the I272 face-flood (grounding: power = the
                              // thickness/softness lever; strengths stay frozen 0.45/0.30)
    },
    phase2: {        // ST-133: enrage state below the HP threshold (one-way)
      hpFrac: 0.5,      // enter phase 2 when HP < 50%
      speedMult: 1.3,    // I325/ST-301: was 1.45 (R1b/R1d: P2 contact pressure down - 1.6 -> 2.08 u/s, still dodgeable)
      turnMult: 1.4,    // turn rate (0.8 -> 1.12 rad/s)
      spin: 1.6,        // tumble rad/s in phase 2 (phase 1 is 0.3)
      ringEveryMult: 0.6 // ring + aimed-bolt cadence multiplier (2.0 -> 1.2 s)
    },
    burst: {          // ST-134: radial bolt burst - fast, undestroyable (forces dodging)
      every: 4.0,        // seconds between volleys (phase 2: x0.65)
      count: 12,         // bolts per volley, evenly spaced around the circle
      speed: 7.0,        // u/s (slower than the aimed bolt's 9 - reaction time)
      offsetSpin: 0.45,  // rad of circle rotation added per volley (spiral drift)
      everyMult: 0.65    // phase-2 cadence multiplier (4.0 -> 2.6 s)
    },
    score: 1000,     // kill reward (the big one)
    telegraph: {     // ST-290 (I311): attack anticipation - the player reaction read before each boss
                    // volley fires. RENDER-LAYER ONLY (reads the public game-time timers; no
                    // sim/scoring/replay data -> BY LAYER, the demo pin is structurally safe).
                    // Threat red = the enemy-bullet emissive family (0xff4a2a, ST-248): danger
                    // reads at distance with no new palette hue; opacities capped sub-bloom.
      ring:  { window: 0.6, maxRadius: 9.0, opacity: 0.35 },                     // rock ring: expanding warning ring as timer -> 0 (Monolith)
      aimed: { window: 0.5, coreBoost: 0.9, redLean: 0.6 },                     // aimed bolt: sharp core-seam spike + threat-red lean (both variants)
      burst: { window: 0.8, coreBoost: 1.4, ringRadius: 10.0, opacity: 0.22 },  // radial burst: long core pulse + fixed-radius pre-flash (Monolith)
    },
  },
  splicer: {
    // ST-143: boss variant 2 - an alternate pattern to the Monolith. Holds a slow
    // orbit around the arena center and emits a continuous two-arm spiral of
    // undestroyable bolts (a spinning sun the ship weaves through) + an aimed
    // bolt. No rock rings, no radial burst. Spawned in alternation with the Monolith.
    maxHp: 30,         // base HP (Monolith 40); scaled up by wave
    hpFirstWave: 15,   // HP scale engages at this endless-curve wave
    hpStep: 8,         // +HP per boss wave beyond hpFirstWave
    hpCap: 72,         // ceiling (keeps the fight beatable)
    radius: 2.6,       // between the Warden (1.7) and the Monolith (3.4)
    score: 600,        // kill reward (Warden 400, Monolith 1000)
    splitCount: 2,     // M rocks on death
    splitSize: 'M',
    holdRadius: 11,    // orbits the arena center at this radius
    orbitSpeed: 0.5,   // rad/s around the center
    spin: 0.4,         // body tumble rad/s (visual)
    enterTime: 1.2,    // entrance seconds - no bolts until the intro plays
    arms: 2,           // spiral arms (2 = two-arm spiral)
    armSpin: 1.2,      // rad/s the arm rotates (spiral tightness)
    spiralEvery: 0.6,  // I144: seconds between spiral shots (gap 7x0.6 = 4.2u ~ 1.9x the ship's 2.24u effective obstacle - threadable; was 0.26 = 1.82u < obstacle, an unthreadable wall; phase 2: x0.65)
    boltSpeed: 7.0,    // undestroyable bolt u/s (== radial burst speed, dodgeable)
    aimEvery: 2.6,     // seconds between aimed bolts (phase 2: x0.7)
    phase2: {          // enrage below the HP threshold (one-way)
      hpFrac: 0.5,
      orbitSpeedMult: 1.4,
      armSpinMult: 1.5,
      spiralEveryMult: 0.65, // I144: enrage gap 2.73u ~ 1.22x obstacle - tight but fair
      aimEveryMult: 0.7,
      spin: 1.2,
    },
  },
  warden: {
    // ST-136: the WARDEN - armored drone mini-boss. Spawns on 5th waves where
    // the Monolith did not spawn (a previous Monolith is still alive): that
    // wave's heavyweight is the drone. Armor absorbs hits before HP loss.
    armor: 6,       // hits absorbed with no HP loss (armor ping FX)
    hp: 12,         // HP after armor (18 total vs the Monolith's 40)
    radius: 1.7,    // smaller than the Monolith (3.4)
    speed: 2.4,     // faster homing than the Monolith (1.6) - still dodgeable
    turn: 1.5,      // heading change rad/s
    spin: 0.9,      // body tumble rad/s
    splitCount: 2,  // S rocks on death
    score: 400      // kill reward (seeker 200, Monolith 1000)
  },
  belt: {
    // ST-138: the ASTEROID BELT - from wave 8, one drifting INDESTRUCTIBLE rock joins
    // per wave start (up to max). Separate persistent layer: exempt from the normal
    // rock cap, never splits, bomb-proof, survives ship contact (costs a life).
    fromWave: 8,       // first wave that adds a belt rock
    max: 5,            // belt rocks on screen at once
    size: 'M',         // rock size spec
    speed: [0.5, 1.1], // slow ambient drift u/s (random heading)
  },
  daily: {
    // ST-140: the DAILY run - one canonical seeded run per calendar day. The seed is
    // derived from the date so every player on the same day shares an identical run
    // (comparable daily leaderboard). Salt namespaces the scheme (future-proofing).
    salt: 'daily:v2',  // mixed into the FNV-1a hash before seeding the RNG (ST-228/I233: bumped from 'daily' - the 4th modifier re-mapped the wave rolls, so the canonical daily run is re-versioned per the ST-140 namespacing)
  },
  share: {
    // ST-142: shareable result string magic prefix (namespaces the codec; versioned).
    magic: 'vr1',
  },

  mine: {
    // ST-054: mine drones - slow homing mines that chase the ship. 1 bullet kills
    // one; touching the ship costs a life. Slower than ship.maxSpeed so they can
    // always be dodged.
    firstWave: 5,     // mines start appearing from this wave
    perWave: 1,       // mines added each eligible wave
    maxConcurrent: 10,
    radius: 0.9,      // collision radius (same as the ship)
    speed: 3.2,       // constant u/s (ship maxSpeed is 14 - always outmatched)
    turn: 1.6,        // max heading change rad/s (slow, readable pursuit)
    fireRange: 7.0,   // ST-056: mines only shoot inside this range
    fireEvery: 3.0,   // ST-056: per-mine cadence (seconds) while in range
    score: 150        // kill reward (more than an S - you chased the chaser)
  },

  drone: {
    // ST-117: homing drones - fast seekers that wobble around the line to the ship.
    // 1 bullet kills one; touching the ship costs a life. No bolts (chasers, not
    // shooters). Faster than mines but always slower than ship.maxSpeed (dodgeable).
    firstWave: 8,       // drones start appearing from this wave (after mines at 5)
    perWave: 1,         // drones added each eligible wave
    maxConcurrent: 6,
    palette: { body: { color: 0x6f8796 } }, // I282/ST-267: steel-cyan mid (sRGB luma ~131, above the skybox mid-band ~128; the GLB COLOR_0 value bake multiplies on top - bright nose, dark belly)
    radius: 0.7,        // slightly smaller than a mine
    speed: 4.4,         // u/s - agile seeker, faster than mines (3.2), < ship.maxSpeed (14)
    turn: 3.2,          // max heading change rad/s (tighter pursuit than a mine)
    wobbleAmp: 0.55,    // rad: peak strafe offset around the direct aim line
    wobbleFreq: 2.2,    // rad/s: wobble oscillation rate
    score: 200,         // kill reward (more than a mine - faster and meaner)
    maxAge: 30          // I129: seeker battery - drone self-destructs after this many (game-time) seconds, bounding the accumulation that stacks onto boss waves
  },
  stinger: {
    // ST-229: STINGER charger - telegraphed line-of-sight dash rammer (wave 7+).
    // Cruises in, locks a telegraph (core glows cyan->white), then charges in a
    // straight line at the ship's position at lock time. Six charges, then fizzle.
    firstWave: 7,       // wave 7: one after the W6 breather (boss waves are 5/10)
    perWave: 1,
    maxConcurrent: 2,
    palette: { body: { color: 0x917fb9 } }, // I383/E43 G2: violet mid (sRGB luma 135.0; same hue as the I282/ST-267 deep violet 0x5a4f73 luma 83.9, VALUE-only lift - the I381 audit read it darkest-in-fleet at rendered p50 30.36 with negative sky sepB; GLB COLOR_0 bake multiplies on top)
    radius: 0.8,
    cruiseSpeed: 1.8,   // u/s (dodgeable: ship maxSpeed 14)
    cruiseTurn: 1.4,    // rad/s (gentle homing while cruising)
    cruiseMin: 1.5,     // s: rng window for the cruise between charges (min)
    cruiseMax: 3.0,     // s (max)
    telegraph: 0.8,     // s: warning before the dash (the glow is FX-tier-independent)
    coreOffset: 2.2,      // I383/E43 G1: core offset along the dart local +X (m). The GLB core (1.28 m long) is modeled origin-centered INSIDE the body (3.68 m) - I382 Node-side GLTFLoader measurement; at 2.2 the core rear sits 0.28 m inside the 1.84 m nose and the tip pokes 1.0 m proud (the white-hot telegraph tip the I282 comment always meant)
    coreChargeScale: 1.9, // I383/E43 G1: core scale at full charge (per-frame scale = 1 + (this-1)*k on the existing telegraph/charge ramp) - render-only, no new mesh/draw call
    coreIdleGlow: 0.09,    // I384/E43 G1: dim idle-core emissive base (k=0) so the UN-BURIED core does NOT pre-charge - I384 sweep: idle core acc90 94.9 sky / 95.2 floor <= body p90+25 (106.9/101.6) with margin; charge end stays 2.9 (coreChargeScale unchanged); render-only, no new draw call
    chargeSpeed: 7.5,   // u/s (ship 14 - dodgeable with an early read)
    chargeDur: 1.4,     // s: charge length (or until the arena rim)
    recover: 1.2,       // s: vulnerable drift after each charge
    maxCharges: 6,      // lifetime dashes, then it fizzles (seeker maxAge precedent)
    rimDist: 15,        // spawn: rim point at least this far from the ship
    score: 250          // kill reward (seeker 200 < stinger 250 < warden 400)
  },
  hunter: {
    // ST-418: HUNTER - rear-approach stalker (wave 6+). Orbits to a rear bearing
    // (behind the nose axis), telegraphs (W-fins deploy + threat-red core ramps
    // 0xff4a2a), then dashes in a straight line from behind. 1 hit to kill (+300).
    // Visuals: design/enemy-visual-language.md s3.1 - rust 0x9c5a46 body /
    // fin-dark 0x4a2a22 / threat-red accent (3 materials, radius 0.8 stinger class).
    firstWave: 6,       // W6: after the base loop (stinger 7, flyer 9; boss waves 5/10)
    perWave: 1,
    maxConcurrent: 2,   // render pool 4 (maxConcurrent + 2, stinger pattern)
    palette: {
      body: { color: 0x9c5a46 },   // rust (sRGB luma ~102; below flyer ~110, ~65deg apart - rule 1)
      fin:  { color: 0x4a2a22 },   // fin undersides (dark)
      accent: 0xff4a2a,            // threat-red telegraph (shared imminent-damage semantics, rule 4)
    },
    renderLumaGain: 3.0, // I451 (ST-421) rendered-luma audit (render451 Part E, I381/I383 method): ACES +
                         // exposure 1.15 + grade gamma 1.18 renders the palette body at ~0.45x its sRGB luma
                         // (hull p50 46 vs the 85-120 band); the render layer scales the hull material color by
                         // this gain to land the ladder (rendered p50 ~102). Palette hex stays the design value.
    radius: 0.8,        // stinger class
    orbitSpeed: 2.6,    // u/s (quick - a stalker)
    orbitTurn: 1.7,     // rad/s (tight turn - can swing to the rear)
    orbitDurMin: 1.4,   // s: rng window for the orbit before the first telegraph
    orbitDurMax: 2.6,
    orbitR: 7.5,        // u: rear-anchor distance behind the ship along the nose axis
    telegraph: 0.85,    // s: warning before the dash (fin-deploy + red ramp) - reaction floor >= 0.7
    dashSpeed: 9.5,     // u/s (ship maxSpeed 14 - dodgeable with an early read)
    dashDur: 1.0,       // s: dash length (or until the arena rim)
    recover: 1.0,       // s: vulnerable drift after each dash
    maxCharges: 5,      // lifetime dashes, then it fizzles (seeker maxAge precedent)
    rimDist: 14,        // spawn: rim point at least this far from the ship
    score: 300          // kill reward (stinger 250 < hunter 300 < flyer 400)
  },
  gunship: {
    // ST-418: GUNSHIP - slow, high-HP heavy bomber (wave 8+). Enters to a mid-arena
    // hold, then ARMS (payload-bay glow 0xff9a3d ramps) and fires a slow, big aimed
    // bolt. 10 hits; self-destructs after maxAge; death -> chaff popups.
    // Visuals: design/enemy-visual-language.md s3.2 - gunmetal 0x39424e body /
    // nacelle 0x232a33 / payload-bay 0xff9a3d (3 materials, radius 1.6 warden class).
    firstWave: 8,       // W8: after drones/vortex (boss waves 5/10)
    perWave: 1,
    maxConcurrent: 1,   // one at a time - it is large and heavy
    palette: {
      body: { color: 0x39424e },    // gunmetal (sRGB luma ~65; below every fleet band - rule 1)
      nacelle: { color: 0x232a33 }, // engine nacelles (dark)
      bay: 0xff9a3d,                // payload-bay glow (warm orange, rule 4 payload semantics)
    },
    renderLumaGain: 4.1, // I451 (ST-421) rendered-luma audit (render451 Part E, I381/I383 method): ACES +
                         // exposure 1.15 + grade gamma 1.18 renders the palette body at ~0.31x its sRGB luma
                         // (hull p50 20 vs the 45-85 band); the render layer scales the hull material color by
                         // this gain to land the ladder (rendered p50 ~65). Palette hex stays the design value.
    radius: 1.6,        // warden class (strictly below the Monolith 3.4)
    enterSpeed: 3.0,    // u/s (slow - a bomber)
    holdRadiusMin: 0.35,// rng fraction of the arena for the hold point (min)
    holdRadiusMax: 0.65,// (max)
    holdDist: 2.0,      // u: enter hold within this of the hold point
    driftOmega: 0.25,   // rad/s (slow drift)
    driftR: 1.5,        // u: drift radius around the hold point
    hp: 10,             // hits to kill (high-HP heavy)
    fireEvery: 2.6,     // s between shots (slow cadence)
    armDur: 0.9,        // s: arm telegraph before each shot (payload-bay glow ramps)
    boltSpeed: 5.5,     // u/s heavy bolt (slower than the normal 9 - lobbed, dodgeable)
    boltRadius: 0.5,    // heavy bolt radius (bigger than the normal 0.22)
    maxAge: 30,         // s: self-destructs after this even if unhit (seeker maxAge precedent)
    rimDist: 14,        // spawn: hold point at least this far from the ship
    score: 600          // kill reward (= Splicer boss 600; heaviest non-boss, below Monolith 1000)
  },
  sentry: {  // ST-448 (E63): SENTRY - mid-range aimed shooter (wave 11+, never boss waves).
    // Holds a preferred orbit band around the ship, aims a turn-limited barrel,
    // CHARGES (0.8 s telegraph, charge node ramps - the RM-safe cue) and BURSTS 3
    // aimed bolts (middle dead-aimed). 3 hits. The SQUAD slot: deliberate,
    // read-and-dodge - unlike the popcorn WASP or the drifting POD.
    firstWave: 11,      // W11: stage 3 "Core Gate" debut (boss waves 5/10/15 excluded)
    perWave: 2,
    maxConcurrent: 2,   // render pool 4 = cap + 2
    palette: {
      body: { color: 0x8a8f7a },   // warm sage (rendered p50 137 sky / 132 floor at gain 2.0)
      base: { color: 0x3a3f34 },   // dark sage spar
      accent: 0xff9a3d,            // charge-node glow (payload-amber family)
    },
    renderLumaGain: 2.0, // I480 rendered-luma audit: POD 127 < SENTRY 137 < WASP 176 (distinct rungs)
    radius: 1.1,
    hp: 3,
    enterSpeed: 2.6,     // u/s: rim -> hold band
    prefRMin: 9.0,       // preferred orbit band around the ship
    prefRMax: 13.0,
    rangeKeep: 0.5,      // u: band tolerance before re-approach
    strafeOmega: 0.5,    // rad/s: hold strafe
    aimTurn: 2.2,        // rad/s: barrel slew limit
    holdMin: 1.2,        // s: hold duration band (rng)
    holdMax: 2.2,
    fireMin: 3.5,        // s: cooldown between bursts (rng)
    fireMax: 4.5,
    telegraph: 0.8,      // s: charge time (the telegraph floor - F3)
    burstCount: 3,       // bolts per burst
    burstGap: 0.18,      // s between bolts
    boltSpeed: 9.0,      // u/s (= enemyBullets.speed - the normal bolt speed)
    boltSpread: 0.10,    // rad: side-bolt spread (middle bolt dead-aimed)
    rimDist: 15,         // spawn: rim point at least this far from the ship
    score: 350,          // kill reward (300 hunter < 350 < 400 warden)
    maxAge: 30,          // s: self-destruct (seeker maxAge precedent)
  },
  wasp: {  // ST-448 (E63): WASP - popcorn dasher (wave 12+). Spawns as a V-pack of 3 at
    // the rim; each corkscrews at the ship (1.0-1.2 s anticipation - the F2 floor)
    // then DASHES straight at the ship's position as predicted at dash start
    // (15.5 u/s = 1.107x the ship's 14 - under the 1.15x F2 cap; 7.75 u dash <
    // 21 u ship evasion over 1.5 s). One shot (+100). The SWARM slot: pressure.
    firstWave: 12,      // W12: after the SENTRY teach (boss waves excluded)
    perWave: 3,         // a V-pack of 3
    maxConcurrent: 6,   // cap EXCLUDES split-children (render pool 10 = 6 + 4 headroom)
    palette: {
      body: { color: 0xb9c34d },   // chartreuse (rendered p50 176 sky / 171 floor at gain 2.0)
      wing: { color: 0x5a6128 },   // dark olive wing plate
      accent: 0xff4a2a,            // nose glow (threat-red dash cue)
    },
    renderLumaGain: 2.0,
    radius: 0.45,
    hp: 1,
    score: 100,
    corkscrewDurMin: 1.0,  // s: anticipation band (F2 floor - never dashes early)
    corkscrewDurMax: 1.2,
    corkscrewSpeed: 5.5,   // u/s: spiral approach
    corkscrewOmega: 6.0,   // rad/s: heading oscillation frequency
    dashSpeed: 15.5,       // u/s: 1.107x ship maxSpeed (14) - under the 1.15x cap, < 16
    dashDur: 0.5,          // s: straight dash length
    packSpread: 0.22,      // rad: V-pack bearing offset per slot
    rimDist: 15,
    maxAge: 30,
  },
  pod: {  // ST-448 (E63): POD - drifting splitter (wave 13+). PROCEDURAL (Vortex
    // precedent - its children ARE the WASP unit). Drifts inward on a closed-form
    // cosine wobble (no ship knowledge, no RNG in step()). 4 hits; a lethal hit
    // splits into 2 WASP corkscrews (game.js drives the split exactly once).
    firstWave: 13,      // W13: debut; W14 is the combine wave (boss waves excluded)
    perWave: 1,
    maxConcurrent: 2,   // render pool 4 = cap + 2
    palette: {
      body: { color: 0x5f8f86 },  // teal-green (rendered p50 127 sky / 122 floor - stable)
      seam: { color: 0x2a4a45 },  // dark seam band (the split line)
      core: 0xff9a3d,             // seam core glow (payload-amber, static)
    },
    renderLumaGain: 2.0,
    radius: 1.2,
    hp: 4,
    score: 300,          // kill reward (250 stinger < 300 = hunter; 300 < 350 sentry)
    driftSpeed: 2.2,     // u/s: inward drift
    driftWobble: 0.4,    // u/s: wobble amplitude (x0.4 under reduced motion)
    seamGlow: 0.55,      // static core glow intensity (<= 1.0 - RM-safe)
    splitCount: 2,       // WASP corkscrews on a lethal hit
    rimDist: 15,
    rmAmpScale: 0.4,     // reduced-motion wobble scale (flyer rmAmpScale precedent)
    maxAge: 30,
  },

  flyer: {
    // ST-232: FLYER - evasive sine-weave crosser (wave 9+). The game one pure
    // lead-shot skill target: it never homes, never fires, never rams - you must
    // read the weave and shoot where it is going. Two hits to kill.
    firstWave: 9,       // W9: after the W8 drone debut (boss waves are 5/10)
    perWave: 1,
    maxConcurrent: 2,   // render pool 4 (maxConcurrent + 2, stinger pattern)
    palette: { body: { color: 0x7d6878 } }, // I282/ST-267: mauve mid (sRGB luma ~110, below the drone band; the magenta dome carries the hue; GLB COLOR_0 bake multiplies on top)
    radius: 0.9,
    cruiseSpeed: 2.5,   // u/s crossing speed (ship 14 - never a threat, a target)
    weaveAmp: 1.2,      // u: perpendicular weave amplitude (the lead to read)
    weavePeriod: 0.9,   // s: weave period (w = 2*pi/period)
    lifetimeMin: 9.0,   // s: rng window for the exit drift (min)
    lifetimeMax: 12.0,  // s (max) - then it drifts out, no score
    hitsToKill: 2,      // high-value target: two hits (dome flashes on the first)
    rimDist: 15,        // spawn: rim point at least this far from the ship (stinger pattern)
    crossLatMax: 0.6,   // rad: max random deviation of the inward heading
    rmAmpScale: 0.4,    // reduced-motion: weave amplitude x0.4 (motion kept - identity)
    score: 400          // kill reward (stinger 250 < flyer 400 = warden 400 rung)
  },
  enemyBullets: {     // ST-056: enemy bolts - separate pool, always slower than the ship
    maxConcurrent: 24,
    radius: 0.22,
    life: 4.0,        // self-destructs after this many seconds
    speed: 9,         // boss bolt u/s (ship maxSpeed is 14 - dodgeable)
    mineSpeed: 8      // mine bolt u/s (a touch softer)
  },

  vortex: {
    // ST-059: gravity vortex - a pulsing pull field that appears mid-arena from
    // wave 8: telegraphs, then bends rocks and ship toward its center for a few
    // seconds. Pressure hazard, not a damage source; always dodgeable.
    firstWave: 8,       // the base loop (mines at 5, boss at 5) is learned first
    intervalMin: 12,    // seconds between vortices (seeded roll, min)
    intervalMax: 20,    // seeded roll, max
    telegraph: 1.0,     // warning phase before the pull engages
    duration: 4.5,      // seconds the pull field stays active
    radius: 11,         // pull radius (the full disk always fits the arena)
    pullRocks: 1.6,     // u/s^2 on rocks inside (no rock damping: bounded by the 4.5s phase)
    pullShip: 2.4,      // u/s^2 on the ship (~9% of ship.accel 26 - always counterable)
    minDistFromShip: 6  // telegraph keeps the disk center at least this far from the ship
  },

  combo: {
    window: 4.0,         // seconds to keep a chain alive
    capLow: 15,          // ST-233: W1-2 cap EXACT (onboarding band + demo-pin band; I92: 10->15)
    capHigh: 20,         // ST-233: W3+ mastery band (multiplier reaches 2.9x at cap)
    capHighWave: 3,      // ST-233: first wave that grants capHigh
    step: 0.1,           // multiplier per combo step (1.0x .. 2.4x at capLow / 2.9x at capHigh)
    tierCount: 5        // I111: discrete multiplier tiers for HUD level-up feedback
  },

  nearMiss: {
    // ST-053: graze bonus - a rock skimming past the ship (without a hit) pays a
    // small flat bonus once per approach. It is not a kill: the combo chain
    // is untouched, so weaving rewards score, not the multiplier.
    radius: 2.6,        // graze ring: (center distance - rock radius) below this counts
    points: 15,         // flat bonus per graze
    rearmMult: 1.6,     // rock must exit graze radius x this before it can score again
    spawnImmunity: 0.3  // s after spawn (rim or split) a rock can start a graze approach
  },

  powerup: {
    dropChance: 0.25,   // chance per kill
    dropLife: 20,       // I130: drop lifetime (s) - abandoned drops expire and free the pool (pre-I130: they persisted forever, clogging the pool)
    fadeTime: 2.5,      // I130: visual shrink-out window before expiry (render reads it; no core FX)
    pickupRadius: 1.6,
    maxActiveDrops: 1,
    weights: {          // I130: weighted drop table (replaces the uniform 1/7 roll) - offense common, bomb/overdrive/slowmo rarer
      rapid: 20, spread: 20, shield: 15, magnet: 15, bomb: 10, overdrive: 10, slowmo: 10,
    },
    magnetRadius: 7,
    drift: 1.2,
    magnetAccel: 40,   // I38: pull acceleration (u/s^2) inside the magnet ring
    types: {
      rapid:  { dur: 8, rate: 2 },
      spread: { dur: 8, count: 3, arc: 0.35 },
      shield: { dur: 12 },
      bomb:   { dur: 0, invuln: 1.0 },  // ST-113: brief ship invulnerability on use
      magnet: { dur: 6 },
      overdrive: { dur: 6, mult: 2 }, // ST-057: 2x score for 6s
      slowmo: { dur: 5, scale: 0.4 } // ST-115: enemy/bullet time scale while active (ship keeps full speed)
    }
  },

  // ST-073: adaptive quality - a rolling FPS monitor auto-downgrades FX high -> low
   // when the window average stays below thresholdFps for confirmWindows consecutive
   // windows. User FX choice in settings overrides (locks) the automation; the
   // downgrade is console-logged + toasted and is NOT persisted to saved settings.
   adaptive: { windowSec: 2.0, thresholdFps: 45, confirmWindows: 2 },
   fx: {
    shake: 1,                 // master screen-shake scale (0..1)
    shakeDecay: 6,            // shake energy decay (1/s, exponential)
    shakeAmplitude: 0.5,      // max camera jitter (world units) at energy 1
    shakeTable: {            // ST-175: unified screen-shake table (event -> energy 0..1; master/decay/amplitude above scale it)
      hit: 0.5,              // ship hit
      bomb: 1.0,             // bomb blast
      mineExplode: 0.4,      // mine detonation
      droneExplode: 0.35,    // seeker drone explosion
      stingerDeath: 0.6,     // ST-229: charger burst (0.5 wardenSpawn < 0.6 < 0.8 wardenDeath)
      flyerDeath: 0.65,     // ST-232: evasive-target kill (0.6 stingerDeath < 0.65 < 0.8 wardenDeath)
      hunterDeath: 0.55,    // ST-418: stalker kill (0.35 drone < 0.55 < 0.6 stinger)
      gunshipDeath: 0.85,   // ST-418: heavy bomber kill (0.8 wardenDeath < 0.85 < 1.0 bossDeath)
      gunshipSpawn: 0.55,   // ST-418: heavy bomber arrival (0.5 wardenSpawn)
      sentryDeath: 0.7,    // ST-448: aimed shooter kill (0.65 flyerDeath < 0.7 < 0.8 wardenDeath)
      waspDeath: 0.3,      // ST-448: dasher kill (below 0.35 droneExplode)
      podDeath: 0.75,      // ST-448: splitter kill (0.7 sentryDeath < 0.75 < 0.8 wardenDeath)
      bossSpawn: 0.7,        // boss arrival
      bossDeath: 1.0,        // boss death
      wardenSpawn: 0.5,      // mini-boss arrival
      wardenDeath: 0.8       // mini-boss death
    },
    flashTable: {            // ST-179: unified white-flash bump table (event -> bump 0..0.8, added under the shared 0.8 cap)
      hit: 0.5,              // ship hit (reinforced by the ST-176 damage vignette)
      bossDeath: 0.5,        // boss death
      bossSpawn: 0.4,        // boss arrival
      wardenDeath: 0.4,      // mini-boss death
      gunshipDeath: 0.4,    // ST-418: heavy bomber death flash (wardenDeath 0.4)
      podDeath: 0.4,       // ST-448: splitter death flash (wardenDeath 0.4; sentry/wasp deaths: none)
      bomb: 0.35,            // bomb blast
      mineExplode: 0.25,     // mine detonation
      wardenSpawn: 0.25,     // mini-boss arrival
      droneExplode: 0.2,     // seeker drone explosion
      overdrive: 0.15        // overdrive pickup flash
    },
    dangerVignette: {        // ST-176: reduced-motion damage vignette (steady-then-fade, opacity only)
      hold: 0.5,             // seconds held at full severity after a hit
      fade: 0.5              // seconds of linear fade back to 0
    },
    enemyHitFlash: {         // ST-385/E51: white hit-flash on the multi-hit enemies (warden HP hits + boss family)
      decay: 3,              // 1/s: ~0.33 s to full decay (matches the flyer dome flash rate)
      spike: 1.4,            // emissiveIntensity added at k=1 (hull/crown + warden armor; clears the 0.72 bloom threshold)
    },
    weaponFanfare: {         // ST-178: weapon level-up fanfare (tier-colored ring + fountain at the ship)
      flash: 0.2,            // white flash bump (clamped to 0.8)
      punch: 0.45            // camera punch energy (boss death 1.0, bomb 0.8; upgrade is lighter)
    },
    killPunch: {              // ST-221 (I224): class-scaled directed kill punch (T4) - bottom juice rung
      s: 0.08,                // small rock / mine (max displacement 0.16 u at the 2.0 u amplitude)
      m: 0.12,                // medium rock (0.24 u)
      l: 0.18,                // large rock (0.36 u; below the 0.45 weapon fanfare)
      stinger: 0.2,           // ST-229: charger kill (L 0.18 < 0.2 < the 0.35 drone shake rung)
      flyer: 0.25,           // ST-232: evasive-target kill (0.2 stinger < 0.25; overdrive 0.375 -> cap 0.3)
      hunter: 0.22,          // ST-418: stalker kill (0.2 stinger < 0.22 < 0.25 flyer)
      wasp: 0.10,          // ST-448: dasher kill (0.08 s < 0.10 < 0.12 m)
      pod: 0.26,           // ST-448: splitter kill (0.25 flyer < 0.26 < 0.28 sentry)
      sentry: 0.28,        // ST-448: aimed shooter kill (0.25 flyer < 0.28 < 0.3 gunship)
      gunship: 0.3,          // ST-418: heavy bomber kill (0.25 flyer < 0.3 = the max rung)
      overdriveBoost: 0.5,    // combo-heat: x1.5 while overdrive is active
      max: 0.3                // hard cap (L + overdrive 0.27 stays under the fanfare rung)
    },
    shockwave: {            // ST-238 (I245): pooled additive shockwave ring on class-scaled plain kills (Brackeys layering recipe)
      life: 0.42,           // s: ring lifetime - a layer over the particle burst, not a second explosion
      baseOpacity: 0.85,    // starting opacity (fades to 0 over life)
      pool: 8,              // pooled ring meshes (ring-buffer overwrite when busy; no per-kill allocation)
      height: 0.35,         // ring plane above the floor (the particle burst rides at 0.4)
      classes: {            // target ring radius (world units) per kill class - no rung = no ring
        S: 1.6,             // small rock (radius 0.7)
        M: 2.4,             // medium rock (radius 1.3)
        L: 3.4,             // large rock (radius 2.2)
        drone: 1.6,         // seeker (radius 0.7)
        stinger: 2.0,       // charger (radius 0.8)
        warden: 3.0,         // mini-boss (radius 1.7)
        hunter: 2.2,         // ST-418: stalker (radius 0.8)
        wasp: 1.4,           // ST-448: dasher (radius 0.45)
        sentry: 2.8,         // ST-448: aimed shooter (radius 1.1)
        pod: 3.0,            // ST-448: splitter (radius 1.2)
        gunship: 3.6         // ST-418: heavy bomber (radius 1.6)
      }
    },
    punch: {                  // ST-081: camera punch - brief directed jolt (boss death / bomb)
      decay: 12,              // punch energy decay (1/s, exponential)
      amplitude: 2.0,         // max camera displacement (world units) at energy 1
    },
    hitStop: {                // ST-081: sim-freeze (render loop, motion-gated) in seconds
      bossDeath: 0.09,        // hit-stop when the boss dies
      bomb: 0.07,             // hit-stop on a bomb blast
      bossPhase2: 0.04,       // ST-217: hit-stop on boss enrage (phase 2) entry (30-50 ms research window)
    },
    fovKick: {                // ST-082: dynamic FOV kick on high-impact events (degrees)
      decay: 5,               // kick decay (1/s, exponential)
      bomb: 6,                // kick on a bomb blast
      bossDeath: 8,           // kick when the boss dies
      max: 12,                // kick clamp
    },
    particleHigh: 48,         // burst size at FX quality High
    particleLow: 16,          // burst size at FX quality Low
    particleOff: 0,           // burst size at FX quality Off (ST-224: zero FX-tier-gated particles)
    particleSprite: {         // ST-394 (E53): soft radial sprite for the shared particle pool (was flat square points)
      enable: true,           // false = the legacy flat square point (the I423 ground-truth gap)
      size: 0.52,             // point size (world u, size-attenuated) - UP from 0.32 (the soft core is smaller than the full point)
    },
    engineTrail: {           // I213: engine trail emission (ST-213; core/engineTrail.js)
      rate: 14,               // puffs/s at full thrust
      minThrust: 0.12,        // thrust fraction below which the trail is silent
      dtMax: 0.25,            // dt clamp (tab restore can't burst a giant puff)
      maxPerUpdate: 4,        // hard cap on puffs per frame
      ramp: true,             // ST-291 (I312): age-ramp palette warm core -> cool tail (audit finding: random mix was not a gradient)
      countHigh: 2,           // particles per puff at FX High
      countLow: 1,            // particles per puff at FX Low
      countOff: 0,            // particles per puff at FX Off (ST-224: silent trail)
      speed: 2.2,             // radial spread u/s
      life: 0.38,             // puff life (s) - full-speed trail ~ rate*life long
      offset: 1.15,           // puff distance behind the ship (u)
    },
    afterburner: {           // ST-434 (I466) B4: afterburner ribbon - ring-buffer Points motion trail at sustained
      minThrust: 0.55,        // thrust fraction gate (sustained thrust only)
      rate: 120,              // points/s while active
      ring: 96,               // preallocated slots (live ~ rate*life = 48; zero per-frame allocs)
      life: 0.4,              // per-point fade (s)
      offset: 0.95,           // spawn distance behind the ship center along facing (u)
      size: 0.34,             // point size (world u, size-attenuated)
      drift: 1.6,             // backward drift speed (u/s)
      spread: 0.16,           // lateral jitter radius (u)
      color: 0xffa860,        // warm engine family (fx.palette.engine[0])
      opacity: 0.55,
    },
    dpr: { high: 2, low: 1.5 }, // ST-225: per-tier device-pixel-ratio caps (load-reactive DPR)
    env: { intensity: 0.35, rock: 0.0 }, // I213 (I257 final): envMapIntensity PBR-lite IBL. 0.55 washed rocks periwinkle; final A/B locked rock=0.0 - fully decouples rocks from the blue-violet nebula PMREM (0.18 vs 0 = dRGB <= 1.5, negligible); ship/belt keep 0.35
    bloom: {                  // I35: post-fx, High quality only (GDD: "Low disables bloom")
      strength: 0.6,
      radius: 0.35,
      threshold: 0.72
    },
    palette: {                // ST-086: per-entity particle color palettes (hex, additive-blended)
      rock:     [0xfff0c8, 0xffa44a, 0xd96a2a],  // ST-248: warm ember core -> amber -> deep ember (harmonized to the I257 warm rock)
      golden:   [0xfff0a0, 0xffe070, 0xffc94d],  // ST-249: gold family (ring [0] unchanged; tail 0xfff8dc -> 0xffc94d = the golden rock albedo - the near-white tail sat in the I258 rock-core 0xfff0c8 zone and was the game brightest particle color; pure white stays with the bomb)
      graze:    [0x7fd4ff, 0x9fe0ff, 0x54b4ff],  // cool cyan near-miss
      mine:     [0xff5a3c, 0xff8a5a, 0xffc4a0],  // hot red-orange
      drone:    [0x6fe8ff, 0x9fe8ff, 0x3cc4ff],  // ST-117 cold cyan seeker
      boss:     [0xb18cff, 0x8a5cff, 0xe0ccff],  // purple
      bossKill: [0xfff0b8, 0xfff6e0, 0xd8c8ff],  // bright boss death
      shield:   [0x53d8ff, 0x7fe8ff, 0x33c4ff],  // cyan shield
      hit:      [0xff6b57, 0xff8f7a, 0xffb4a4],  // ship damage
      bomb:     [0xfff3b0, 0xffd27a, 0xffffff],  // bright blast
      pickup: { rapid: 0xffc300, spread: 0xff9f43, shield: 0x53d8ff, bomb: 0xff5252, magnet: 0x69f0ae, overdrive: 0xff4dd8, slowmo: 0x9fe8ff }, // ST-177: per-type collect sparkle (matches powerupMesh orb colors); I308/ST-288: rapid synced 0xffe066 -> 0xffc300 to the I288/ST-272 mesh orb (collect-sparkle was flashing the pre-I288 yellow)
      power:    [0xff5ad8, 0xff8ae8, 0xffb6f2],   // magenta overdrive
      bulletLevel: [0x7fe4ff, 0x8affc0, 0xd6f6ff],   // ST-123 weapon L1/L2/L3; ST-248: L1 = cockpit-cyan accent (0x59d8ff family, brighter for the bullet read); I460/ST-429 A1: L3 amber 0xffd27a -> ice-white 0xd6f6ff (hue ~205 deg vs threat red ~9 deg = ~164 deg separation; restores the cool-vs-warm bullet contract at max weapon - E59 research finding)
      bulletLevelOverdrive: [0xd2f5ff, 0xd6ffec, 0xe8fbff], // ST-248: overdrive heat shift (white-hot, hue-preserving per level); I460/ST-429 A1: L3 0xfff1e1 -> 0xe8fbff (B-dominant, brighter than base 0xd6f6ff - ST-248 invariants hold)
      killRing: 0xffa44a,                    // ST-248: plain-kill shockwave ring (amber; was implicit palette.rock[0])
      engine:   [0xffa860, 0xffd9a0, 0x9fd8ff],  // I213 warm core -> cool tail (matches the flame)
      belt:     [0x9fb4d0, 0x7c93b8, 0xcfe0f5],    // ST-139 cool steel - indestructible belt clink
      stinger:  [0xd8f4ff, 0x9fd4ff, 0xffffff],    // ST-229 hot cyan-white (the telegraph family)
      flyer:    [0xff9de8, 0xffc4f0, 0xff6ad5],    // ST-232 magenta saucer (the evasive-target family)
      hunter:   [0xff7a4d, 0xffb088, 0xffe0c0],    // ST-418 rust-hot (HUNTER kill - threat-red warmed to white)
      gunship:  [0xffa14d, 0xffc98a, 0xfff0d0],    // ST-418 gunmetal-ember (GUNSHIP kill - payload-amber family)
      sentry:   [0xffd9a0, 0xffb060, 0xff9a3d],    // ST-448 warm sage (SENTRY kill - station-ember family)
      wasp:     [0xeaff9a, 0xcfe05a, 0xb9c34d],    // ST-448 chartreuse (WASP kill - swarm family)
      pod:      [0xa0f0e0, 0x6fd0c0, 0x5f8f86]     // ST-448 teal-green (POD kill - splitter family)
    },
    enemyBullet: { base: 0x5a1410, emissive: 0xff4a2a, emissiveIntensity: 1.2 }, // ST-248: hot red-orange threat bolt (data-driven; values unchanged)
    // I460/ST-429 A2: shared fresnel silhouette rim on enemy hulls (the I278
    // fragment-only pattern proven on the I257 rocks + I272 boss; helper in
    // src/render/enemyRim.js). Per-role DARK identity accent: peak rim luma
    // (strength * luma(color)) stays <= 29 - far under the 183.6 bloom band,
    // so the rim reads but never blooms. Static (no per-frame animation) so it
    // is reduced-motion safe by construction.
    enemyRim: {
      power: 5.0, // fresnel falloff exponent (I278 sign-fix convention)
      roles: {
        hunter:  { color: 0x8a3a28, strength: 0.30 }, // dark rust-red (threat family)
        gunship: { color: 0x9a6a2e, strength: 0.26 }, // dark amber (bay family)
        warden:  { color: 0x2e6a66, strength: 0.24 }, // steel-teal (armor family)
        stinger: { color: 0x2e6a7a, strength: 0.24 }, // steel-cyan (lock family)
        drone:   { color: 0x4a6a7a, strength: 0.22 }, // steel-cyan
        flyer:   { color: 0x8a3a6a, strength: 0.24 }, // mauve-magenta (dome family)
        mine:    { color: 0x8a4a3a, strength: 0.24 },  // rust
        sentry:  { color: 0x4a5a3a, strength: 0.24 }, // ST-448: dark sage (peak rim luma 20.2)
        wasp:    { color: 0x6a7a2a, strength: 0.24 }, // ST-448: dark chartreuse (peak rim luma 27.1)
        pod:     { color: 0x2a4a45, strength: 0.26 }  // ST-448: dark teal (peak rim luma 17.4)
      }
    },
    // I460/ST-429 A3: shader-stable ship damage flash - a pre-created unlit
    // additive shell on the ship group (NEVER a per-hit light; no shader
    // recompilation at contact). Opacity-only envelope, <= 120 ms.
    shipHitFlash: { dur: 0.12, opacity: 0.45, color: 0xffe0d0 },
  },

  // I366/ST-334: starfield correlating with the v6 skybox knots (assets/
  // skybox_equirect.jpg): 3-way mix per star (fixed RNG count) - p_knot
  // stars drawn from a Gaussian clump at the dominant knot, p_sec from
  // the secondary, the rest uniform (as before). Total count unchanged;
  // non-knot sky sparser; clump stars also get a bright scale boost.
  // u = equirect width fraction (az = (u-0.5)*360 deg, from +x toward
  // +z); latDeg = sky latitude (compared post-flatten, starfield y*0.7);
  // sizeUDeg/sizeLatDeg = clump sigma in deg (~2x the bake sigma, matching
  // the knot bright/FWHM extent); p = mix weight (sum <= 1). seed drives
  // ONLY the starfield RNG (isolated; sim stream untouched).
  starfield: {
    seed: 1337,                 // I04-era seed; drives only the starfield RNG
    near: { count: 280, rMin: 90, rMax: 130, size: 3.2, color: 0xe8f1ff, opacity: 0.95, parallax: 0.25 },
    far:  { count: 520, rMin: 140, rMax: 230, size: 2.2, color: 0x9db4ff, opacity: 0.7, parallax: 0.6 },
    knot: { u: 0.65, latDeg: 4, sizeUDeg: 24, sizeLatDeg: 16, p: 0.25, bright: 1.15 },
    secondary: { u: 0.18, latDeg: 4, sizeUDeg: 10, sizeLatDeg: 7, p: 0.05, bright: 1.12 }, // v6 secondary knot (ST-434 B3 below)
    // ST-434 (I466) B3: 3-layer star pattern (core/glow/flare) - the flare layer for the
    // top ~2% brightest near-shell stars (aScale rank = the knot-clump bright stars).
    // One extra additive Points layer (+1 draw call); uTime freezes under reduced motion
    // (static, no rotation/breathing). Render-only data - zero core. Far-shell flares deferred.
    flare: { frac: 0.02, minCount: 4, sizeMul: 2.4, rotSpeed: 0.5, opacity: 0.5 },
  },

  camera: {                // ST-082: dynamic camera feel (fovBase 60 = pre-ST-082 hardcode)
    fovBase: 60,           // resting vertical FOV (degrees)
    fovSpeed: 4,           // extra FOV at full ship speed (speed-line feel)
    lookAhead: 2.6,        // camera look-ahead along ship facing (world units) at rest; ST-415 (I445) retune 4 -> 2.6 (with the dolly a smaller base keeps the ship closer to screen center; still scales with speed and the dolly factor)
    lookAheadSpeed: 2,     // extra look-ahead at full speed (lean into the motion)
    fovDamp: 8,            // FOV ease rate (1/s)
    // ST-415 (I445): edge-aware dolly (CHASE) - base chase offset, now config (was
    // hardcoded 9 / 13 in main.js). Measured in I444: at arena y=+20 the legacy
    // camera sat at y=33, OUTSIDE the r=26 rim, so the arena behind the ship fell
    // out of frame. The offset + look-ahead now scale by one uniform factor
    // s(t) = 1 + (rimScale-1)*smoothstep((t-startFrac)/(1-startFrac))^pow,
    // t = dist/arenaR, so the ship's screen offset and the camera view angle are
    // invariant wherever the ship moves; s = 1 at center (legacy framing there).
    camHeight: 9,          // base chase height above the arena plane
    camBack: 13,           // base chase dolly-back distance (world +Y of the ship)
    dolly: {
      startFrac: 0.55,     // dolly begins past this dist/arenaR fraction (0..1)
      rimScale: 1.7,       // offset + look-ahead scale at the rim (9 -> 15.3, 13 -> 22.1)
      pow: 2               // smoothstep shaping exponent (soft ramp into the rim)
    },
    overviewHeight: 56,    // ST-416 (I446): OVERVIEW height above arena center (fixed 3/4 view; whole arena |NDC|<=0.85 @16:9/fov60)
    overviewBack: 20,      // ST-416 (I446): OVERVIEW dolly-back (3/4 angle, not straight down)
    cockpitHeight: 1.02,   // ST-416 (I446); I504 (ST-470): COCKPIT eye height above the arena plane (SHIP_HOVER 0.4 + 0.62 above the ship center plane; v6 canopy top 0.13 u below the eye = in-frame bottom)
    cockpitSetback: 0.15,  // ST-416 (I446); I504 (ST-470): COCKPIT seat setback behind the ship center (along facing; 0.55 -> 0.15 moves the seat forward so the nose + canopy frame the view)
    cockpitLookFar: 60,    // ST-416 (I446): COCKPIT look-ahead along the heading (horizon)
    cockpitLookSpeed: 40,   // ST-444 (I477): extra COCKPIT look-ahead at full speed (lean into the motion; spdFrac 0 -> exactly cockpitLookFar, bit-identical to the legacy fixed 60)
    cockpitLookDrop: 1.2,   // I504 (ST-470): COCKPIT look point drops this far below the eye (gentle ~1.1 deg down-pitch at lookFar 60; frames the nose/canopy at the bottom)
cockpitFovSpeed: 9,    // ST-416 (I446): extra COCKPIT FOV at full speed (motion-gated seat kick)
  // ST-219: state-tied camera feel (I221) - subtle, motion-gated, view stays dodge-readable
  aimLeadFrac: 0.03,     // camera lead toward the aim point (2-5% of the ship->aim offset)
  aimLeadCap: 1.2,       // max lead offset (world units) - keeps the view dodge-readable
  bossZoomFov: 2.5,      // extra vertical FOV (degrees) near a live boss - a few degrees out
  bossZoomRange: 14,     // boss distance window (world units) where the zoom-out applies
  bossZoomDamp: 3,       // zoom ease rate (1/s) - eased in and out
  menuOrbitRate: 0.06,   // slow MENU orbit drift (rad/s, ~105 s per revolution; motion-gated)
  // ST-261 (I274): MENU hero framing (G4) - closer, lower hero orbit + ship hero pose + gentle engine
  // idle. Drift/rock/flicker are motion-gated; reduced motion gets a static pose + a steady flame.
  // Camera transform + existing meshes only (the idle flame lights 3 already-allocated flame meshes).
  menuHero: {
    radius: 2.8,        // MENU orbit radius (was 13, then 4.8) - ST-280 I298 re-tune: closer hero (sweep S5 winner)
    height: 0.5,        // MENU camera height (was 9, then 2.3, 1.4) - ST-329 I360: near-level view (aim +horizon) lifts the orange nebula band (e +1.5..+10.5 deg) into the y 180-240 strip behind the title/ship; old -25.8 deg aim left the frame top at +4.2 deg (band mostly out of frame)
    lookY: 0.28,        // MENU look-target Y (was 0, then 0.5, 0.05) - ST-329 I360: aims ~4.5 deg below camera level (view center -4.5 deg) so the band fills the upper third while the ship stays ~56 px above center (clears the y 415 DOM panel line)
    yaw: -1.0,           // ship facing (rad, render-only) - nose left-forward 3/4, engine stream reads right
    pitch: -0.10,       // ship pitch (rad) - slight nose-up
    bank: -0.18,        // ship bank (rad) - hero tilt
    rockAmp: 0.05,      // idle bank-rock amplitude (rad); 0 under reduced motion
    rockRate: 0.6,      // idle bank-rock rate (rad/s)
    flameIdle: 0.34,    // gentle engine-idle thrust fraction (steady under reduced motion)
    flameFlicker: 0.22, // idle flicker depth (fraction of flameIdle); 0 under reduced motion
    flameRate: 4.6      // idle flicker rate (rad/s)
  }
  },
  render: {                 // ST-236 (I243): renderer color/tone pipeline (applied at boot by the render layer; pre-pass three defaults)
    tone: {
      mapping: 'acesFilmic', // tone mapping operator by name: 'none' (pre-I243 baseline) | 'acesFilmic' (filmic rolloff - shapes sky/rocks/emissives together; the I230 warm-cast note is the acceptance hook)
      exposure: 1.15         // toneMappingExposure - compensates the ACES midtone dip against the tuned NoToneMapping baseline
    },
    grade: {                // ST-308 (I334): L3 level curve / grade (High-tier composer only; applied POST ACES tone-map in display-referred linear space - the RUN.game 7-layer L3 gap found in ST-306)
      contrast: 1.0,        //   contrast stretch pivoted at 0.5 (1.0 = off). Kept off: on this dark scene it crushes the mid-luma hull (I334 sweep B/C p50 -> 0)
      lift: 0.0,            //   black/white-point offset in display-referred space (0 = off)
      gamma: 1.18           //   mid-lift (1.0 = off). 1.18 = I334 sweep sweet spot: contrast 60.98 -> 68.7, crushed blacks 69.6% -> 9.3%, 0 blown highlights; 1.0 is bit-identical to the vendor OutputPass
    }
  },
  storage: {
    bestKey: 'voidrunner.best',
    settingsKey: 'voidrunner.settings',
    highScoresKey: 'voidrunner.scores',  // I66: top-5 table
    highScoresMax: 5,
    replaysKey: 'voidrunner.replays',  // ST-190: saved replays (newest-first, capped)
    replaysMax: 2  // ST-190: keep the two most recent replays
  },
  replay: {  // ST-190: replay viewer (quantized RLE tape + built-in demo pilot)
    quant: 1000,        // 1/quant world-unit resolution for the tape (I191: 1/1000 is the empirically faithful resolution - recorded-run replays stay outcome-identical; the decoder caps q at 4..1000)
    maxSteps: 72000,    // cap replay length in substeps (2 h at 60 Hz)
    maxTapeBytes: 700000, // hard cap on the RLE tape size (truncation trigger)
    demoLen: 2220,      // substeps for the built-in DEMO PILOT (37 s; pilot dies at step 2169 -> GAME_OVER, small tail)
    demoSeed: 1909      // fixed seed for the deterministic demo pilot
  },
skill: {            // ST-303 (E33): skill-model telemetry (pure core, E33 adaptive-director arc)
    tau: 6,           // momentum decay time constant (s): M *= exp(-dt/tau) per sample()
    mMax: 3,          // momentum clamp +-mMax -> P in [0,1]; worst single-event swing 0.8/3*0.5 = 0.1333 < 0.25 band (R2d by construction)
    wKill: 0.35,       // + momentum per kill (before combo scaling)
    wKillCombo: 0.05, // + momentum per combo point (min(combo, comboCap))
    comboCap: 10,     // combo points at which the kill bonus is maxed
    wGraze: 0.15,     // + momentum per nearmiss (graze)
    wHit: 0.75,        // - momentum per hit taken
    wDeathExtra: 0.3, // extra - momentum when the hit is lethal (data.lives === 0)
    wShot: 0.004,     // - momentum per shot fired (accuracy rewarded implicitly)
    sigma: 6,         // threat-load distance scale (u): L_raw = SUM w/(1+(gap/sigma)^2)
    weights: {        // ST-304 (I329): threat weights for the director's load sampling (I328 matrix)
      rock: 1, drone: 1.2, stinger: 1.5, flyer: 1.5, boss: 2
    }
  },
  director: {          // ST-304 (I329, E33): adaptive director - bounded monotone envelope (see src/core/director.js)
    enabled: true,     // master switch; false -> every wave is NEUTRAL (bit-identical to pre-I329)
    firstWave: 3,      // waves 1-2 stay fixed (teach the base loop + the demo pin)
    pressureMin: 0.1,  // low end of the pressure band (t = 0 -> gentle multipliers)
    pressureMax: 0.9,  // high end (t = 1 -> hard multipliers)
    pressureStart: 0.3,// starting pressure (a touch above the low end)
    pressureStep: 0.15,// max |dp| per decide -> recovery after a lull takes >= 1 wave
    lullWindow: 20,    // s: EMA time-constant for the windowed load (I328: windowed, NOT run-mean)
    lullLHigh: 0.55,   // sustained windowed load >= this triggers a lull (no hit needed)
    lullPStruggle: 0.4,// P <= this -> struggling (target the min)
    lullPHard: 0.65,   // P >= this -> skilled (target the max)
    density: { min: 0.65, max: 1.2 }, // spawn-density multiplier by pressure (t=0 -> min, t=1 -> max)
    bullet:  { min: 0.85, max: 1.15 },// enemy-bullet speed multiplier by pressure
    drop:    { min: 0.9, max: 2.0 },  // pickup-drop multiplier (INVERSE: skilled -> fewer drops)
    lullDensity: 0.6,  // lull wave density (dips below the min band)
    lullBullet: 0.9,   // lull wave bullet speed (below the min band)
    lullDrop: 2.0,     // lull wave drop rate (lifts above the max band)
    logCap: 256        // per-decision log ring-buffer cap (debug/telemetry only)
  },
  // ST-381 (E50): transient 3D debris shatter on death (render-only, motion-gated,
  // additive juice - src/render/debrisField.js). One SHARED shard set (assets/
  // debris_chunk.glb + debris_sliver.glb, luma-neutral COLOR_0) tinted per class
  // with the existing burst palette color CONFIG.fx.palette[class][1] - no new hues.
  // Scripted motion (no physics engine): impulse +/- speedJitter (y x yBias =
  // outward spray), exponential damping, random-axis tumble, pop 0.4 -> 1.0,
  // fade = scale -> 0 over the final fadeFrac + tint dim to tintDim. 0 live at
  // rest -> meshes visible=false -> +0 steady-state draw calls (playframe pins).
  debris: {
    pool: 24,          // shared live-shard cap (boss 14 + warden 10 = 24 worst case)
    height: 0.35,      // spawn plane offset above the arena (the particle burst rides 0.4)
    damping: 0.90,     // velocity retention per 1/60 s (exponential in dt)
    spinMin: 2,        // tumble rad/s (random axis per shard)
    spinMax: 8,
    yBias: 0.5,        // impulse y-scale (shards spray outward, not straight up)
    speedJitter: 0.25, // +/-25% per-shard speed
    popTime: 0.15,     // s: pop-in 0.4 -> 1.0 (easeOut)
    fadeFrac: 0.4,     // final 40% of life: scale -> 0
    tintDim: 0.15,     // tint dim factor at end of life (full-life linear)
    lowTierScale: 0.5, // FX Low: ceil(count * lowTierScale) shards (FX Off: 0 - fxCount gate)
    perEvent: {        // class -> {count, speed, life, scaleMin, scaleMax} (per-class tint = palette[class][1])
      rockS: { count: 4, speed: 5, life: 0.45, scaleMin: 0.35, scaleMax: 0.60 },
      rockM: { count: 5, speed: 6, life: 0.50, scaleMin: 0.50, scaleMax: 0.80 },
      rockL: { count: 6, speed: 6, life: 0.55, scaleMin: 0.70, scaleMax: 1.10 },
      golden: { count: 6, speed: 5, life: 0.45, scaleMin: 0.35, scaleMax: 0.60 }, // rockS +2
      drone: { count: 5, speed: 6.5, life: 0.45, scaleMin: 0.40, scaleMax: 0.70 },
      mine: { count: 5, speed: 7, life: 0.50, scaleMin: 0.40, scaleMax: 0.65 },
      stinger: { count: 6, speed: 8, life: 0.55, scaleMin: 0.45, scaleMax: 0.75 },
      flyer: { count: 6, speed: 8.5, life: 0.60, scaleMin: 0.45, scaleMax: 0.75 },
      hunter: { count: 7, speed: 8, life: 0.55, scaleMin: 0.40, scaleMax: 0.80 },  // ST-418: rust-hot shatter
      gunship: { count: 12, speed: 9, life: 0.75, scaleMin: 0.70, scaleMax: 1.30 }, // ST-418: gunmetal chaff (heavier)
      sentry: { count: 8, speed: 9, life: 0.6, scaleMin: 0.5, scaleMax: 0.9 }, // ST-448: sage shrapnel
      wasp: { count: 5, speed: 7, life: 0.4, scaleMin: 0.3, scaleMax: 0.55 }, // ST-448: swarm chaff (light)
      pod: { count: 10, speed: 8, life: 0.7, scaleMin: 0.5, scaleMax: 1.0 }, // ST-448: teal fragments
      warden: { count: 10, speed: 9, life: 0.70, scaleMin: 0.80, scaleMax: 1.20 },
      boss: { count: 14, speed: 10, life: 0.80, scaleMin: 1.20, scaleMax: 1.80 }
    }
  },
  stages: {
    // ST-419 (E57): linear campaign - 3 stages x 5 waves over the EXISTING deterministic
    // timeline waves 1..15 (stageForWave = floor((w-1)/5)+1). ENDLESS is default + structurally
    // untouched (stage system runs only when mode === 'campaign'). Stage-end boss: w5 Monolith,
    // w10 Splicer, w15 Monolith Prime. Stage 1 theme = identity default (null = no visual change).
    stages: [
      { name: 'Outer Drift',  waves: [1, 5],   boss: 'monolith',       theme: null },
      { name: 'Debris Field', waves: [6, 10],  boss: 'splicer',        theme: { sky: 0x04101a, stars: 0x9fd8ff, floor: 0x0a2530, grid: 0x123c4a, accent: 0x2dd4bf } }, // cool teal (ST-420 finalizes hexes)
      { name: 'Core Gate',    waves: [11, 15], boss: 'monolith-prime', theme: { sky: 0x0f0705, stars: 0xffd0a0, floor: 0x2a1408, grid: 0x4a2a12, accent: 0xffc94d } }  // warm ember (ST-420 finalizes hexes)
    ],
    monolithPrime: { // stage-3 final boss = re-tuned Monolith (kind STAYS 'monolith'; prime=true tag for render ST-420)
      name: 'Monolith Prime', hp: 88, phase2: 0.6, burstEvery: 3.2, splitCount: 5, rim: 0xffc94d
    }
  },
  levels: {
    // ST-453 (E64): campaign forward-cruise speed (u/s) - drives level distance (endless never uses it).
    // Zone + hazard data below is read by the level machine in game.js (campaign only).
    cruiseSpeed: 3.5,
    // ST-452 (I485, E64): linear campaign level data - 3 levels x 4 zones. Pure
    // DATA + pure model (src/core/level.js): nothing in the simulation reads this
    // in ST-452 (model only -> causal + playframe stay EXACT); ST-453 wires the
    // level driver. `length` = forward arc distance along the flight path (arena
    // units, same space as arena.radius 26; ship maxSpeed 14 u/s -> a 100-u zone
    // is ~7 s at full thrust, ~15-30 s with dodging). `checkpointAt` = fraction
    // within [0,1] where the zone checkpoint sits (0 = zone start; Ikaruga F6:
    // death continues from the last checkpoint, never wipe-to-menu).
    // enemyMix vocabulary (E63 roster): drone/mine/stinger/flyer/hunter/gunship/
    // sentry/wasp/pod + rock. optionalTargets vocabulary: rock variants
    // (golden, shielded) + powerups (rapid, spread, shield, magnet, overdrive,
    // slowmo) + bonus enemies (pod). `name` = en source of truth; display
    // strings in strings.js ('level.name.l<n>' / 'level.zone.l<n>z<m>', all 3
    // locales) - pinned equal by tests/level.test.js.
    levels: [
      { name: 'Outer Drift', boss: 'monolith', zones: [ // level theme: learn to fly forward (F6)
        { name: 'Drift Approach',  length: 80,  paletteId: 'drift-1',  hazardProfile: 'calm',     enemyMix: ['drone', 'rock'],            optionalTargets: ['golden'],                checkpointAt: 0 },
        { name: 'Wreck Alley',     length: 90,  paletteId: 'drift-2',  hazardProfile: 'moderate', enemyMix: ['drone', 'stinger', 'mine'],  optionalTargets: ['shielded', 'pod'],      checkpointAt: 0 },
        { name: 'Tug Lane',        length: 100, paletteId: 'drift-3',  hazardProfile: 'moderate', enemyMix: ['stinger', 'flyer', 'mine'],  optionalTargets: ['golden', 'pod'],        checkpointAt: 0 },
        { name: 'Gate Threshold',  length: 60,  paletteId: 'drift-4',  hazardProfile: 'dense',    enemyMix: ['hunter', 'stinger', 'mine'], optionalTargets: ['rapid'],                 checkpointAt: 0 }
      ] },
      { name: 'Debris Field', boss: 'splicer', zones: [ // level theme: weave + timing through density (F4/F6)
        { name: 'Shard Gate',          length: 90,  paletteId: 'debris-1', hazardProfile: 'moderate', enemyMix: ['drone', 'mine', 'stinger'], optionalTargets: ['golden'],           checkpointAt: 0 },
        { name: 'Tumble Run',          length: 100, paletteId: 'debris-2', hazardProfile: 'dense',    enemyMix: ['mine', 'stinger', 'flyer'],  optionalTargets: ['shielded'],         checkpointAt: 0 },
        { name: 'Sentry Corridor',     length: 110, paletteId: 'debris-3', hazardProfile: 'dense',    enemyMix: ['sentry', 'mine', 'drone'],   optionalTargets: ['pod'],              checkpointAt: 0 },
        { name: 'Splicer Antechamber', length: 70,  paletteId: 'debris-4', hazardProfile: 'gauntlet', enemyMix: ['sentry', 'hunter', 'wasp'],  optionalTargets: ['rapid', 'pod'],      checkpointAt: 0 }
      ] },
      { name: 'Core Gate', boss: 'monolith-prime', zones: [ // level theme: recap + escalation (Ikaruga F6 final stage)
        { name: 'Ember Run',         length: 90,  paletteId: 'ember-1', hazardProfile: 'moderate', enemyMix: ['stinger', 'mine', 'drone'], optionalTargets: ['golden'],            checkpointAt: 0 },
        { name: 'Wasp Swarm',        length: 110, paletteId: 'ember-2', hazardProfile: 'dense',    enemyMix: ['wasp', 'pod', 'stinger'],    optionalTargets: ['pod'],              checkpointAt: 0 },
        { name: 'Squad Lock',        length: 120, paletteId: 'ember-3', hazardProfile: 'gauntlet', enemyMix: ['sentry', 'gunship', 'mine'],  optionalTargets: ['shielded', 'pod'],   checkpointAt: 0 },
        { name: 'Prime Threshold',   length: 80,  paletteId: 'ember-4', hazardProfile: 'gauntlet', enemyMix: ['gunship', 'sentry', 'wasp'], optionalTargets: ['rapid', 'shielded'], checkpointAt: 0 }
      ] }
    ],
    palettes: { // zone identity palettes, E57 stage-theme shape {sky, stars, floor, grid, accent}.
      // MODEL ONLY in ST-452 (data): ST-455 consumes these + runs a rendered-luma
      // audit (I480 pattern) before finalizing hexes. null = arena identity (no
      // visual change; E57 stage-1 precedent). drift zones ride the identity
      // floor (0x483728/0x1a130d) + near stars 0xe8f1ff; debris/ember bases =
      // the E57 stage-2/3 themes (continuity).
      'drift-1': null,
      'drift-2': { sky: 0x05080f, stars: 0xdce8ff, floor: 0x483728, grid: 0x1a130d, accent: 0x59d8ff },
      'drift-3': { sky: 0x08070d, stars: 0xe8f1ff, floor: 0x4f3a26, grid: 0x1c140c, accent: 0xff9a3d },
      'drift-4': { sky: 0x0d0605, stars: 0xffd8b0, floor: 0x54351f, grid: 0x1e130a, accent: 0xff4a2a },
      'debris-1': { sky: 0x04101a, stars: 0x9fd8ff, floor: 0x0a2530, grid: 0x123c4a, accent: 0x2dd4bf },
      'debris-2': { sky: 0x03141f, stars: 0xb8e8ff, floor: 0x0c2a36, grid: 0x14424f, accent: 0x53d8ff },
      'debris-3': { sky: 0x051218, stars: 0xa8d8f0, floor: 0x0e2330, grid: 0x163a45, accent: 0x69f0ae },
      'debris-4': { sky: 0x02131a, stars: 0x8fd0ff, floor: 0x082028, grid: 0x0e3440, accent: 0x2dd4bf },
      'ember-1': { sky: 0x0f0705, stars: 0xffd0a0, floor: 0x2a1408, grid: 0x4a2a12, accent: 0xffc94d },
      'ember-2': { sky: 0x120705, stars: 0xffc890, floor: 0x301808, grid: 0x523014, accent: 0xff9a3d },
      'ember-3': { sky: 0x140804, stars: 0xffb880, floor: 0x361a0a, grid: 0x5a3416, accent: 0xff4a2a },
      'ember-4': { sky: 0x170a04, stars: 0xffa870, floor: 0x3c1d0c, grid: 0x623a18, accent: 0xffc94d }
    },
    hazardProfiles: { // hazard-density vocabulary (F3/F4: tighten <-> release arc).
      // MODEL ONLY in ST-452: ST-453/ST-455 finalize the multipliers in the
      // balance pass. rockRate/mineRate/enemyRate scale the zone spawn rates.
      calm: { rockRate: 0.5, mineRate: 0.0, enemyRate: 0.8 },
      moderate: { rockRate: 1.0, mineRate: 1.0, enemyRate: 1.0 },
      dense: { rockRate: 1.5, mineRate: 1.5, enemyRate: 1.25 },
      gauntlet: { rockRate: 2.0, mineRate: 2.0, enemyRate: 1.5 }
    }
  },
  flightPath: {
    // ST-454 (E64, I487): the race line - a smooth bounded 3D path (curves + bank + elevation).
    // Pure trochoid (sinusoids) -> C-infinity continuous; render lifts the cam rig by elev
    // (E62-preserving) + frames the path ahead + rolls into the turn. Endless never reads it.
    a1: 10.0, f1: 0.050, p1: 0.0,          // primary trochoid lobe: radius + spatial freq + phase
    a2: 2.5,  f2: 0.130, p2: 1.7,          // secondary lobe (adds S-curves + a bounded inner loop)
    elevBase: 3.0, elevAmp: 2.4, elevFreq: 0.070, elevPhase: 0.0, // vertical ride (world +Y)
    tangentFloor: 0.15,                    // keep |tangent| bounded away from 0 -> no NaN normalize
    turnScale: 14.0,                       // curvature -> bankRaw gain (clamped to [-1,1])
    frameFrac: 0.45,                       // how far the look target is pulled toward path-ahead (0..1)
    frameDist: 11.0,                       // metres along the path that 'ahead' is (framing lead)
    shipBank: 0.55,                        // ship roll (rad) at bankRaw = +/-1
    camRoll: 0.22,                         // camera roll (rad) at bankRaw = +/-1 (subtle, chase only)
    ribbon: { behind: 6, ahead: 34, width: 0.7, segments: 64, lift: 0.6, color: 0x7fd8ff, opacity: 0.5 }
  },
  zoneTheme: { blendDur: 2.5 }, // ST-455 (E64, I488): zone palette crossfade seconds (RM snaps)
  vista: { seed: 48801, rMin: 85, rMax: 150, yMin: -12, yMax: 28, count: 12, minScale: 6, maxScale: 34, tintMix: 0.35 }, // ST-455 (E64, I488): background vista ring (deterministic; 1 draw call; campaign only)
  campaignBoss: {
    // ST-456 (E64, I489): the campaign end-of-level boss (one per level). Derives from
    // boss.glb (per-level retint + posture scale = 0 new tris, no new asset). Weak
    // point + 3-phase posture (L1) / single-phase (L2-3); move sets reuse the aimed
    // bolt + rock ring (distinct per phase). Pure core (src/core/campaignBoss.js).
    radius: 3.4,        // the Monolith obelisk footprint (same space as boss.radius)
    enterTime: 1.4,     // longer entrance - the fight is a set piece (endless 0.8)
    speed: 1.4,         // slow homing (always dodgeable)
    turn: 0.7,          // sluggish heading change rad/s
    hp: { 1: 96, 2: 110, 3: 130 },    // per-level HP (climbing; the weak point gates TTK)
    phases: { 1: 3, 2: 1, 3: 1 },     // C3: L1 full 3-phase; L2-3 single-phase
    phaseAt: [1.0, 0.66, 0.33],       // L1 phase hpFrac thresholds (phase i while f in [at[i+1], at[i]))
    posture: [1.0, 1.14, 1.28],       // posture/scale per phaseIndex (the growth read on a phase change)
    weak: { r: 1.4, orbitR: 4.0, armTime: 2.4, teleTime: 0.8, openTime: 2.2 }, // closed -> tele -> open cycle
    moves: { aimEvery: [2.4, 1.8, 1.3], ringEvery: [99, 3.5, 2.2] }, // per-tier cadence (99 = no ring in phase 0)
    singlePhaseMoveTier: 1,           // L2/L3 (1 phase) run the tier-1 move set (aimed + ring)
    score: { 1: 1000, 2: 1400, 3: 2000 },
    splitCount: 4,        // M rocks on death
    splitSize: 'M'
  },
  campaign: { warpDuration: 1.6 } // deterministic frozen-sim warp timer (no RNG draws)
};

