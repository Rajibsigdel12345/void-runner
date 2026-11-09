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
    maxConcurrent: 24
  },

  wave: {
    base: 4,            // wave n spawns base + growth*n asteroids
    growth: 1,
    maxConcurrentGrowth: 2,
    speedPerWave: 0.06, // speedMult = 1 + n*speedPerWave (capped)
    speedCap: 1.9,
    maxConcurrentCap: 24,
    intermission: 2.2,
    spawnMinPlayerDist: 8 // I34: rim spawn keeps at least this far from the ship
  },

  combo: {
    window: 4.0,        // seconds to keep a chain alive
    cap: 10,            // max combo
    step: 0.1           // multiplier per combo step (1.0x .. 1.9x)
  },

  powerup: {
    dropChance: 0.25,   // chance per kill
    pickupRadius: 1.6,
    maxActiveDrops: 1,
    magnetRadius: 7,
    drift: 1.2,
    types: {
      rapid:  { dur: 8, rate: 2 },
      spread: { dur: 8, count: 3, arc: 0.35 },
      shield: { dur: 12 },
      bomb:   { dur: 0 },
      magnet: { dur: 6 }
    }
  },

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
    settingsKey: 'voidrunner.settings'
  }
};

