// Void Runner - world orchestrator (ST-012). Pure core: no DOM, no three.
// Per-frame data flow: intent in -> step -> events out (drained by render/audio/hud).
import { Ship } from './ship.js';
import { Weapons } from './weapons.js';
import { AsteroidField } from './asteroids.js';
import { bulletHitRock, shipHitRock } from './collision.js';
import { CONFIG } from './config.js';
import { v2 } from './math.js';

export class World {
  constructor(rng, cfg = CONFIG) {
    this.cfg = cfg;
    this.rng = rng;
    this.ship = new Ship(0, 0, cfg);
    this.weapons = new Weapons(cfg);
    this.field = new AsteroidField(rng, cfg);
    this.events = [];
    this.score = 0;
    this.lives = cfg.ship.lives;
    this.gameOver = false;
    this.time = 0;
  }

  emit(type, data) { this.events.push({ type, data }); }
  drainEvents() { const e = this.events; this.events = []; return e; }

  /**
   * @param {number} dt seconds
   * @param {{thrust:{x:number,y:number}, aimPoint:{x:number,y:number}|null, firing:boolean}} intent
   */
  step(dt, intent = { thrust: v2(), aimPoint: null, firing: false }) {
    if (this.gameOver) return;
    this.time += dt;

    this.ship.step(dt, intent.thrust, intent.aimPoint);
    if (intent.firing) {
      const b = this.weapons.fire(this.ship.pos, this.ship.aim);
      if (b) this.emit('fire', { pos: b.pos });
    }
    this.weapons.step(dt);
    this.field.step(dt);
    this.resolveBulletRocks();
    this.resolveShipRocks();
  }

  resolveBulletRocks() {
    for (const b of this.weapons.bullets) {
      if (b.dead) continue;
      const id = bulletHitRock(b.pos.x, b.pos.y, b.radius, this.field.rocks);
      if (id == null) continue;
      const rock = this.field.rocks.find(r => r.id === id);
      this.weapons.markHit(b.id);
      const points = this.cfg.asteroid.sizes[rock.size].score;
      this.field.destroy(id);
      this.score += points;
      this.emit('kill', { pos: { x: rock.pos.x, y: rock.pos.y }, size: rock.size, points });
    }
    this.weapons.compact();
  }

  resolveShipRocks() {
    if (this.ship.isInvulnerable || this.lives <= 0) return;
    const hit = shipHitRock(this.ship.pos.x, this.ship.pos.y, this.cfg.ship.radius, this.field.rocks);
    if (!hit) return;
    this.field.destroy(hit.id);
    this.lives -= 1;
    this.emit('hit', { pos: { x: this.ship.pos.x, y: this.ship.pos.y }, knock: { x: hit.nx, y: hit.ny }, lives: this.lives });
    this.ship.damage(v2(hit.nx, hit.ny));
    if (this.lives <= 0) {
      this.gameOver = true;
      this.emit('gameover', { score: this.score });
    }
  }

  reset() {
    this.ship = new Ship(0, 0, this.cfg);
    this.weapons.clear();
    this.field.clear();
    this.score = 0;
    this.lives = this.cfg.ship.lives;
    this.gameOver = false;
    this.time = 0;
    this.events.length = 0;
  }
}
