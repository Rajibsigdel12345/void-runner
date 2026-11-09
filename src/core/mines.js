// ST-054: mine drones - slow homing chasers. DOM-free, three-free.
// Determinism: all randomness (spawn bearing, wobble phase) flows through the
// world RNG; the homing turn is a pure function of state, so seeded replays match.
import { CONFIG } from './config.js';
import { v2, v2Len, v2Dist } from './math.js';

export class MineField {
  constructor(rng, cfg = CONFIG) {
    this.rng = rng;
    this.cfg = cfg;
    this.mines = [];
    this.pendingFires = []; // ST-056: {x, y} of mines that fired this frame
    this.nextId = 1;
  }

  /** Spawn a mine at the arena rim (away from the ship when a position is given). */
  spawn(shipPos = null) {
    const m = this.cfg.mine;
    if (this.mines.length >= m.maxConcurrent) return null;
    const r = this.cfg.arena.radius - m.radius;
    let a = this.rng.next() * Math.PI * 2;
    if (shipPos) {
      // re-roll a few times so the mine does not spawn on top of the ship
      for (let i = 0; i < 6 && v2Dist({ x: Math.cos(a) * r, y: Math.sin(a) * r }, shipPos) < 10; i++) {
        a = this.rng.next() * Math.PI * 2;
      }
    }
    const pos = v2(Math.cos(a) * r, Math.sin(a) * r);
    const homeAng = Math.atan2(-pos.y, -pos.x) + this.rng.range(-0.4, 0.4);
    this.mines.push({
      id: this.nextId++,
      pos,
      vel: v2(Math.cos(homeAng) * m.speed, Math.sin(homeAng) * m.speed),
      radius: m.radius,
      rot: this.rng.next() * Math.PI * 2,
      fireTimer: m.fireEvery, // ST-056: first shot after a full interval
      dead: false,
    });
    return this.mines[this.mines.length - 1];
  }

  /**
   * Advance all mines: constant speed, heading eases toward the ship at at most
   * cfg.mine.turn rad/s. Mines bounce off the arena rim like rocks.
   */
  step(dt, shipPos) {
    const m = this.cfg.mine;
    const R = this.cfg.arena.radius;
    for (const mine of this.mines) {
      if (mine.dead) continue;
      const sp = v2Len(mine.vel) || m.speed;
      const cur = Math.atan2(mine.vel.y, mine.vel.x);
      const tgt = Math.atan2(shipPos.y - mine.pos.y, shipPos.x - mine.pos.x);
      let diff = tgt - cur;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      const maxTurn = m.turn * dt;
      const ang = cur + (diff > maxTurn ? maxTurn : diff < -maxTurn ? -maxTurn : diff);
      mine.vel.x = Math.cos(ang) * sp;
      mine.vel.y = Math.sin(ang) * sp;
      mine.pos.x += mine.vel.x * dt;
      mine.pos.y += mine.vel.y * dt;
      mine.rot += dt * 1.2;
      // rim reflection (same rule as asteroids)
      const d = v2Len(mine.pos) + mine.radius;
      if (d > R) {
        const inv = 1 / (d || 1);
        const nx = mine.pos.x * inv, ny = mine.pos.y * inv;
        const dot = mine.vel.x * nx + mine.vel.y * ny;
        if (dot > 0) {
          mine.vel.x -= 2 * dot * nx;
          mine.vel.y -= 2 * dot * ny;
        }
        const push = d - R;
        mine.pos.x -= nx * push;
        mine.pos.y -= ny * push;
      }
      // ST-056: cadence ticks regardless of range; the bolt only goes out in range
      mine.fireTimer -= dt;
      if (mine.fireTimer <= 0) {
        mine.fireTimer += m.fireEvery;
        if (v2Dist(mine.pos, shipPos) < m.fireRange) this.pendingFires.push({ x: mine.pos.x, y: mine.pos.y });
      }
    }
    this.compact();
  }

  /** ST-056: drain this frame's fire requests (World owns the bolt pool). */
  takeFires() {
    const f = this.pendingFires;
    this.pendingFires = [];
    return f;
  }

  /** Destroy a mine by id. Returns the mine or null. */
  destroy(id) {
    const mine = this.mines.find(x => x.id === id && !x.dead);
    if (!mine) return null;
    mine.dead = true;
    this.compact();
    return mine;
  }

  compact() {
    let w = 0;
    for (let i = 0; i < this.mines.length; i++) {
      if (!this.mines[i].dead) this.mines[w++] = this.mines[i];
    }
    this.mines.length = w;
  }

  get count() { return this.mines.length; }
  clear() { this.mines.length = 0; this.pendingFires.length = 0; }
}
