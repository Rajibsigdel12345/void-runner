// ALL tunables live here (balance table). See design/gdd.md for rationale.
export const CONFIG = {
  arena: { radius: 26 },

  ship: {
    accel: 26,        // units/s^2
    maxSpeed: 14,     // units/s
    damping: 1.6,     // exponential drag /s
    radius: 0.9,      // collision radius
    aimEase: 9,       // how fast nose eases toward aim (lambda)
    invulnTime: 1.6,  // seconds of invulnerability after a hit
    knockback: 7,     // knockback impulse on hit
    lives: 3
  },

  weapon: {
    fireInterval: 1 / 5.5, // seconds between shots
    bulletSpeed: 34,
    bulletLife: 1.1,
    bulletRadius: 0.18,
    maxBullets: 64,
    homing: { turn: 3, range: 8 } // MAGNET: max steering rad/s, target search radius
  },

  asteroid: {
    // size key: L -> M -> S. splits = how many fragments a destroyed rock produces.
    sizes: {
      L: { radius: 2.2, speed: [2.2, 3.6], score: 25,  splits: [2, 3], child: 'M' },
      M: { radius: 1.3, speed: [3.0, 4.6], score: 50,  splits: [2, 3], child: 'S' },
      S: { radius: 0.7, speed: [3.8, 5.8], score: 100, splits: [],     child: null }
    },
    spin: [0.4, 1.8],   // rad/s tumble range
    maxConcurrent: 24,
    golden: {           // ST-052: rare glowing rock - faster, worth 5x
      chance: 0.05,     // per rim-spawn roll in eligible waves (splits are never golden)
      speedMult: 1.35,  // extra spawn speed on top of the wave ramp
      scoreMult: 5,     // score multiplier on kill
      minWave: 3        // waves 1-2 stay plain (teach the base loop first)
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
    // and a rising small-rock share instead of unbounded totals.
    first: 10,             // the curve engages from wave 10
    contentCap: 36,        // toSpawn cap (base + growth*n would overshoot by wave 32)
    minIntermission: 1.2,  // intermission floor (base 2.2s shrinks toward it)
    intermissionStep: 0.08,// per-wave intermission shrinkage after `first`
    sBiasStep: 0.02,       // per-wave small-rock probability increase
    sBiasCap: 0.45         // small-rock probability ceiling (starts at 0.3)
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
    score: 1000      // kill reward (the big one)
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
    cap: 10,            // max combo
    step: 0.1           // multiplier per combo step (1.0x .. 1.9x)
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
    pickupRadius: 1.6,
    maxActiveDrops: 1,
    magnetRadius: 7,
    drift: 1.2,
    magnetAccel: 40,   // I38: pull acceleration (u/s^2) inside the magnet ring
    types: {
      rapid:  { dur: 8, rate: 2 },
      spread: { dur: 8, count: 3, arc: 0.35 },
      shield: { dur: 12 },
      bomb:   { dur: 0 },
      magnet: { dur: 6 },
      overdrive: { dur: 6, mult: 2 } // ST-057: 2x score for 6s
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
    shakeHit: 0.5,            // energy added on a ship hit
    shakeBomb: 1.0,           // energy added on a bomb blast
    particleHigh: 48,         // burst size at FX quality High
    particleLow: 16,          // burst size at FX quality Low
    bloom: {                  // I35: post-fx, High quality only (GDD: "Low disables bloom")
      strength: 0.6,
      radius: 0.35,
      threshold: 0.72
    }
  },

  storage: {
    bestKey: 'voidrunner.best',
    settingsKey: 'voidrunner.settings',
    highScoresKey: 'voidrunner.scores',  // I66: top-5 table
    highScoresMax: 5
  }
};

