﻿﻿﻿// ALL tunables live here (balance table). See design/gdd.md for rationale.
export const CONFIG = {
  arena: {
    radius: 26,
    // ST-257 (I269): custom warm floor grid (src/render/arenaFloor.js) replaces
    // the cool PolarGridHelper (ST-248). gridBright = center-hub / brightest
    // line; its luma is the ST-177 FX-off floor bg proxy (tests/paletteHarmony
    // .test.js), so it must stay <= bomb pickup luma (118.8) - 59.
    gridBright: 0x463529, // ST-257: warm neutral hub (was 0x1b2a55 cool blue); sRGB luma 55.7
    gridDim: 0x201812, // ST-257: dim edge band (was 0x101a38); sRGB luma 25.3 < FLOOR 50
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
      body:    { color: 0x9a8468, metalness: 0.45, roughness: 0.4 },   // warm brass-steel (luma 134.6; above the warm rocks ~96)
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
    palette: { body: { color: 0x5a4f73 } }, // I282/ST-267: deep violet (sRGB luma ~84, BELOW the skybox mid-band - a dark needle whose white-hot telegraph tip is the read; GLB COLOR_0 bake multiplies on top)
    radius: 0.8,
    cruiseSpeed: 1.8,   // u/s (dodgeable: ship maxSpeed 14)
    cruiseTurn: 1.4,    // rad/s (gentle homing while cruising)
    cruiseMin: 1.5,     // s: rng window for the cruise between charges (min)
    cruiseMax: 3.0,     // s (max)
    telegraph: 0.8,     // s: warning before the dash (the glow is FX-tier-independent)
    chargeSpeed: 7.5,   // u/s (ship 14 - dodgeable with an early read)
    chargeDur: 1.4,     // s: charge length (or until the arena rim)
    recover: 1.2,       // s: vulnerable drift after each charge
    maxCharges: 6,      // lifetime dashes, then it fizzles (seeker maxAge precedent)
    rimDist: 15,        // spawn: rim point at least this far from the ship
    score: 250          // kill reward (seeker 200 < stinger 250 < warden 400)
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
        warden: 3.0         // mini-boss (radius 1.7)
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
      bulletLevel: [0x7fe4ff, 0x8affc0, 0xffd27a],   // ST-123 weapon L1/L2/L3; ST-248: L1 = cockpit-cyan accent (0x59d8ff family, brighter for the bullet read)
      bulletLevelOverdrive: [0xd2f5ff, 0xd6ffec, 0xfff1e1], // ST-248: overdrive heat shift (white-hot, hue-preserving per level)
      killRing: 0xffa44a,                    // ST-248: plain-kill shockwave ring (amber; was implicit palette.rock[0])
      engine:   [0xffa860, 0xffd9a0, 0x9fd8ff],  // I213 warm core -> cool tail (matches the flame)
      belt:     [0x9fb4d0, 0x7c93b8, 0xcfe0f5],    // ST-139 cool steel - indestructible belt clink
      stinger:  [0xd8f4ff, 0x9fd4ff, 0xffffff],    // ST-229 hot cyan-white (the telegraph family)
      flyer:    [0xff9de8, 0xffc4f0, 0xff6ad5]    // ST-232 magenta saucer (the evasive-target family)
    },
    enemyBullet: { base: 0x5a1410, emissive: 0xff4a2a, emissiveIntensity: 1.2 }, // ST-248: hot red-orange threat bolt (data-driven; values unchanged)
  },

  camera: {                // ST-082: dynamic camera feel (fovBase 60 = pre-ST-082 hardcode)
    fovBase: 60,           // resting vertical FOV (degrees)
    fovSpeed: 4,           // extra FOV at full ship speed (speed-line feel)
    lookAhead: 4,          // camera look-ahead along ship facing (world units) at rest
    lookAheadSpeed: 2,     // extra look-ahead at full speed (lean into the motion)
    fovDamp: 8,            // FOV ease rate (1/s)
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
    height: 1.4,        // MENU camera height (was 9, then 2.3) - ST-280 I298 re-tune: closer low 3/4
    lookY: 0.05,        // MENU look-target Y (was 0, then 0.5) - ST-280 I298 re-tune: clears 720p bottom zone
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
  }
};

