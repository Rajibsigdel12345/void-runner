﻿﻿// ALL tunables live here (balance table). See design/gdd.md for rationale.
export const CONFIG = {
  arena: { radius: 26 },

  // I170 (ST-170): procedural-music intensity escalation, driven from world state.
  // x in [0,1] is fed to audio.musicIntensity(x) (opens the drone filter + lifts the
  // bus as tension rises). Tension climbs with the wave via a smooth asymptote
  // scaled to waveCeil (headroom below 1); a live boss lifts it to at least bossFloor.
  music: {
    intensity: {
      waveK: 12,      // exp time-constant in waves (larger = slower build)
      waveCeil: 0.75, // max intensity from wave alone (headroom below 1 for the boss)
      bossFloor: 0.9  // min intensity while a boss is alive (peak-tension moment)
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
    lives: 3
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
    spawnMinPlayerDist: 8 // I34: rim spawn keeps at least this far from the ship
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
    list: ['fast', 'small', 'inward'],
    fastSpeedMult: 1.4,   // 'fast': extra spawn-speed multiplier on top of the ramp
    smallSBias: 0.5,      // 'small': spawn rolls S with this probability
    inwardAccel: 2.0      // 'inward': u/s^2 pull of all rocks toward the arena center
  },

  boss: {
    // ST-055: the Monolith - a large slow-homing boss that appears on every
    // multiple of everyWave. Takes 1 damage per bullet; periodically bursts a
    // ring of S rocks; on death splits into 4 M rocks and pays a big score.
    everyWave: 5,    // waves 5, 10, 15, ...
    maxHp: 40,
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
    enterTime: 1.2,  // ST-135: entrance seconds - no attacks until the intro plays
    phase2: {        // ST-133: enrage state below the HP threshold (one-way)
      hpFrac: 0.5,      // enter phase 2 when HP < 50%
      speedMult: 1.45,  // homing speed (1.6 -> 2.32 u/s - still dodgeable)
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
    score: 1000      // kill reward (the big one)
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
    salt: 'daily',     // mixed into the FNV-1a hash before seeding the RNG
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
    radius: 0.7,        // slightly smaller than a mine
    speed: 4.4,         // u/s - agile seeker, faster than mines (3.2), < ship.maxSpeed (14)
    turn: 3.2,          // max heading change rad/s (tighter pursuit than a mine)
    wobbleAmp: 0.55,    // rad: peak strafe offset around the direct aim line
    wobbleFreq: 2.2,    // rad/s: wobble oscillation rate
    score: 200,         // kill reward (more than a mine - faster and meaner)
    maxAge: 30          // I129: seeker battery - drone self-destructs after this many (game-time) seconds, bounding the accumulation that stacks onto boss waves
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
    window: 4.0,        // seconds to keep a chain alive
    cap: 15,            // max combo (I92: 10->15, raises the mastery ceiling)
    step: 0.1,          // multiplier per combo step (1.0x .. 2.4x at cap)
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
      overdriveBoost: 0.5,    // combo-heat: x1.5 while overdrive is active
      max: 0.3                // hard cap (L + overdrive 0.27 stays under the fanfare rung)
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
      countHigh: 2,           // particles per puff at FX High
      countLow: 1,            // particles per puff at FX Low
      countOff: 0,            // particles per puff at FX Off (ST-224: silent trail)
      speed: 2.2,             // radial spread u/s
      life: 0.38,             // puff life (s) - full-speed trail ~ rate*life long
      offset: 1.15,           // puff distance behind the ship (u)
    },
    env: { intensity: 0.55 }, // I213: envMapIntensity for PBR-lite IBL from the skybox (bloom-safe)
    bloom: {                  // I35: post-fx, High quality only (GDD: "Low disables bloom")
      strength: 0.6,
      radius: 0.35,
      threshold: 0.72
    },
    palette: {                // ST-086: per-entity particle color palettes (hex, additive-blended)
      rock:     [0xffb24a, 0xff8a3c, 0xffd27a],  // warm amber shatter
      golden:   [0xfff0a0, 0xffe070, 0xfff8dc],  // gold
      graze:    [0x7fd4ff, 0x9fe0ff, 0x54b4ff],  // cool cyan near-miss
      mine:     [0xff5a3c, 0xff8a5a, 0xffc4a0],  // hot red-orange
      drone:    [0x6fe8ff, 0x9fe8ff, 0x3cc4ff],  // ST-117 cold cyan seeker
      boss:     [0xb18cff, 0x8a5cff, 0xe0ccff],  // purple
      bossKill: [0xfff0b8, 0xfff6e0, 0xd8c8ff],  // bright boss death
      shield:   [0x53d8ff, 0x7fe8ff, 0x33c4ff],  // cyan shield
      hit:      [0xff6b57, 0xff8f7a, 0xffb4a4],  // ship damage
      bomb:     [0xfff3b0, 0xffd27a, 0xffffff],  // bright blast
      pickup: { rapid: 0xffe066, spread: 0xff9f43, shield: 0x53d8ff, bomb: 0xff5252, magnet: 0x69f0ae, overdrive: 0xff4dd8, slowmo: 0x9fe8ff }, // ST-177: per-type collect sparkle (matches powerupMesh orb colors)
      power:    [0xff5ad8, 0xff8ae8, 0xffb6f2],   // magenta overdrive
      bulletLevel: [0xbff4ff, 0x8affc0, 0xffd27a],   // ST-123 weapon L1/L2/L3 (cyan/mint/amber)
      engine:   [0xffa860, 0xffd9a0, 0x9fd8ff],  // I213 warm core -> cool tail (matches the flame)
      belt:     [0x9fb4d0, 0x7c93b8, 0xcfe0f5]      // ST-139 cool steel - indestructible belt clink
    }
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
  menuOrbitRate: 0.06    // slow MENU orbit drift (rad/s, ~105 s per revolution; motion-gated)
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
  }
};

