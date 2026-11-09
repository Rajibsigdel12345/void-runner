// Void Runner - asteroid field core (ST-009). DOM-free, three-free.
import { CONFIG } from './config.js';
import { v2, v2Len, v2Norm } from './math.js';

export class AsteroidField {
  constructor(rng, cfg = CONFIG) {
    this.rng = rng;
    this.cfg = cfg;
    this.rocks = [];
    this.nextId = 1;
  }

  /** Spawn a rock at the arena rim heading inward, or at an explicit position (splits). */
  spawn(size, speedMult = 1, at = null) {
    const a = this.cfg.asteroid;
    if (this.rocks.length >= a.maxConcurrent) return null;
    const spec = a.sizes[size];
    let pos, ang;
    if (at) {
      pos = v2(at.x, at.y);
      ang = this.rng.next() * Math.PI * 2;
    } else {
      const rimA = this.rng.next() * Math.PI * 2;
      const r = this.cfg.arena.radius - spec.radius * 0.5;
      pos = v2(Math.cos(rimA) * r, Math.sin(rimA) * r);
      ang = Math.atan2(-pos.y, -pos.x) + this.rng.range(-0.5, 0.5); // inward + spread
    }
    const sp = this.rng.range(spec.speed[0], spec.speed[1]) * speedMult;
    const dir = v2Norm(v2(Math.cos(ang), Math.sin(ang)));
    const rock = {
      id: this.nextId++,
      size,
      pos,
      vel: v2(dir.x * sp, dir.y * sp),
      radius: spec.radius,
      spin: this.rng.range(a.spin[0], a.spin[1]) * (this.rng.chance(0.5) ? -1 : 1),
      rot: this.rng.next() * Math.PI * 2,
      variant: this.rng.int(0, 2),
      speedMult,
      dead: false,
    };
    this.rocks.push(rock);
    return rock;
  }

  step(dt) {
    const R = this.cfg.arena.radius;
    for (const r of this.rocks) {
      if (r.dead) continue;
      r.pos.x += r.vel.x * dt;
      r.pos.y += r.vel.y * dt;
      r.rot += r.spin * dt;
      const d = v2Len(r.pos) + r.radius;
      if (d > R) {
        const inv = 1 / (d || 1);
        const nx = r.pos.x * inv, ny = r.pos.y * inv;
        const dot = r.vel.x * nx + r.vel.y * ny;
        if (dot > 0) {
          r.vel.x -= 2 * dot * nx;
          r.vel.y -= 2 * dot * ny;
        }
        const push = d - R;
        r.pos.x -= nx * push;
        r.pos.y -= ny * push;
      }
    }
  }

  /** Kill a rock; spawn + return its fragments (none for S). Honors the concurrent cap. */
  destroy(id) {
    const rock = this.rocks.find(r => r.id === id && !r.dead);
    if (!rock) return [];
    rock.dead = true;
    const children = [];
    const spec = this.cfg.asteroid.sizes[rock.size];
    if (spec.splits.length) {
      const n = this.rng.int(spec.splits[0], spec.splits[1]);
      for (let i = 0; i < n; i++) {
        const c = this.spawn(spec.child, rock.speedMult, { x: rock.pos.x, y: rock.pos.y });
        if (c) children.push(c);
      }
    }
    this.compact();
    return children;
  }

  compact() {
    let w = 0;
    for (let i = 0; i < this.rocks.length; i++) {
      if (!this.rocks[i].dead) this.rocks[w++] = this.rocks[i];
    }
    this.rocks.length = w;
  }

  get count() { return this.rocks.length; }
  clear() { this.rocks.length = 0; }
}
