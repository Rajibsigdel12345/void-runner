// Void Runner - world orchestrator (ST-012). Pure core: no DOM, no three.
// Per-frame data flow: intent in -> step -> events out (drained by render/audio/hud).
import { Ship } from './ship.js';
import { Weapons } from './weapons.js';
import { AsteroidField } from './asteroids.js';
import { bulletHitRock, shipHitRock } from './collision.js';
import { CONFIG } from './config.js';
import { v2 } from './math.js';
import { ScoreKeeper } from './score.js';
import { WaveDirector } from './waves.js';
import { Lives } from './lives.js';
import { GameState, STATE } from './state.js';

export class World {
  constructor(rng, cfg = CONFIG) {
    this.cfg = cfg;
    this.rng = rng;
    this.ship = new Ship(0, 0, cfg);
    this.weapons = new Weapons(cfg);
    this.field = new AsteroidField(rng, cfg);
    this.events = [];
    this.scoreKeeper = new ScoreKeeper(cfg);
    this.waves = new WaveDirector(rng, this.field, cfg);
    this.livesMgr = new Lives(cfg.ship.lives);
    this.game = new GameState();
    this.time = 0;
  }

  get score() { return this.scoreKeeper.score; }
  get wave() { return this.waves.wave; }
  get lives() { return this.livesMgr.count; }
  get gameOver() { return this.game.in(STATE.GAME_OVER); }

  /** MENU -> PLAYING and start the wave director. No-op unless in MENU. */
  begin() {
    if (!this.game.to(STATE.PLAYING)) return false;
    this.waves.start();
    return true;
  }

  emit(type, data) { this.events.push({ type, data }); }
  drainEvents() { const e = this.events; this.events = []; return e; }

  /**
   * @param {number} dt seconds
   * @param {{thrust:{x:number,y:number}, aimPoint:{x:number,y:number}|null, firing:boolean}} intent
   */
  step(dt, intent = { thrust: v2(), aimPoint: null, firing: false }) {
    if (!this.game.in(STATE.PLAYING)) return;
    this.time += dt;

    this.ship.step(dt, intent.thrust, intent.aimPoint);
    if (intent.firing) {
      const b = this.weapons.fire(this.ship.pos, this.ship.aim);
      if (b) this.emit('fire', { pos: b.pos });
    }
    this.weapons.step(dt);
    this.field.step(dt);
    this.scoreKeeper.tick(this.time);
    const wv = this.waves.step(dt);
    if (wv.startedWave) this.emit('wave', { n: wv.startedWave });
    if (wv.waveCleared) this.emit('waveCleared', { n: wv.waveCleared });
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
      const base = this.cfg.asteroid.sizes[rock.size].score;
      this.field.destroy(id);
      const points = this.scoreKeeper.kill(base, this.time);
      this.emit('kill', { pos: { x: rock.pos.x, y: rock.pos.y }, size: rock.size, points, combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier });
    }
    this.weapons.compact();
  }

  resolveShipRocks() {
    if (this.ship.isInvulnerable || this.lives <= 0) return;
    const hit = shipHitRock(this.ship.pos.x, this.ship.pos.y, this.cfg.ship.radius, this.field.rocks);
    if (!hit) return;
    this.field.destroy(hit.id);
    const livesLeft = this.livesMgr.damage();
    this.scoreKeeper.onDamage();
    this.emit('hit', { pos: { x: this.ship.pos.x, y: this.ship.pos.y }, knock: { x: hit.nx, y: hit.ny }, lives: livesLeft });
    this.ship.damage(v2(hit.nx, hit.ny));
    if (livesLeft <= 0) {
      this.game.to(STATE.GAME_OVER);
      this.emit('gameover', { score: this.score });
    }
  }

  reset() {
    this.ship = new Ship(0, 0, this.cfg);
    this.weapons.clear();
    this.field.clear();
    this.scoreKeeper.reset();
    this.waves.reset();
    this.livesMgr.reset();
    this.game.reset();
    this.gameOver = false;
    this.time = 0;
    this.events.length = 0;
  }
}



