// ST-056: enemy bolts. Separate pool from the player's bullets; no homing, no
// interactions with player bullets (out of scope). DOM-free, three-free.
import { CONFIG } from './config.js';
import { v2 } from './math.js';

export class EnemyBulletField {
  constructor(cfg = CONFIG) {
    this.cfg = cfg;
    this.bullets = []; // { id, pos, vel, life, radius, dead }
    this.nextId = 1;
    this.speedMul = 1; // ST-304 (I329): director enemy-bolt speed multiplier; 1 = pre-I329 bit-identical
  }

  /** Fire one bolt from fromPos along dir (unit) at speed. Returns the bolt or null (at cap). */
  fire(fromPos, dir, speed) {
    const e = this.cfg.enemyBullets;
    if (this.bullets.length >= e.maxConcurrent) return null;
    const b = {
      id: this.nextId++,
      pos: v2(fromPos.x, fromPos.y),
      vel: v2(dir.x * speed * this.speedMul, dir.y * speed * this.speedMul), // ST-304 (I329)
      life: e.life,
      radius: e.radius,
      dead: false,
    };
    this.bullets.push(b);
    return b;
  }

  /** Move bolts, decay life, cull dead or past the rim. */
  step(dt) {
    const R = this.cfg.arena.radius + 2; // small margin past the rim
    for (const b of this.bullets) {
      if (b.dead) continue;
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;
      b.life -= dt;
      if (b.life <= 0 || Math.hypot(b.pos.x, b.pos.y) > R) b.dead = true;
    }
    if (this.bullets.some(b => b.dead)) this.compact();
  }

  compact() {
    let w = 0;
    for (let i = 0; i < this.bullets.length; i++) {
      if (!this.bullets[i].dead) this.bullets[w++] = this.bullets[i];
    }
    this.bullets.length = w;
  }

  clear() { this.bullets.length = 0; this.nextId = 1; } // I190: fresh ID space per run
  get count() { return this.bullets.length; }
}
