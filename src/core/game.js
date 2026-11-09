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
import { PowerUpField } from './powerups.js';
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
    this.powerups = new PowerUpField(rng, cfg);
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
  /** PLAYING -> PAUSED (sim frozen via the step gate). No-op unless PLAYING. */
  pause() { return this.game.to(STATE.PAUSED); }

  /** PAUSED -> PLAYING only (begin() owns the MENU start, restart() the full reset). */
  resume() { return this.game.in(STATE.PAUSED) && this.game.to(STATE.PLAYING); }

  /** Full session restart from MENU or GAME_OVER: reset all systems, then begin. */
  restart() { this.reset(); return this.begin(); }

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
    if (intent.firing) this.fireWeapon();
    this.weapons.step(dt, this.powerups.active('magnet'), this.field.rocks);
    this.field.step(dt, this.waves.inwardAccel); // ST-051 inward modifier
    const pickups = this.powerups.step(dt, this.ship);
    for (const pk of pickups) this.emit('powerup', { type: pk.type, pos: pk.pos });
    const inst = this.powerups.takeInstant();
    if (inst) {
      if (inst === 'bomb') this.bombBlast();
      this.emit('instant', { type: inst });
    }
    this.scoreKeeper.tick(this.time);
    const wv = this.waves.step(dt, this.ship.pos);
    if (wv.startedWave) this.emit('wave', { n: wv.startedWave, mod: this.waves.activeMod }); // ST-051
    if (wv.waveCleared) this.emit('waveCleared', { n: wv.waveCleared });
    this.resolveBulletRocks();
    this.resolveShipRocks();
  }

  /** Firing with power-up modifiers (ST-021): RAPID doubles cadence, SPREAD fires a 3-way burst. */
  fireWeapon() {
    const pt = this.cfg.powerup.types;
    const rateMul = this.powerups.active('rapid') ? pt.rapid.rate : 1;
    let shots;
    if (this.powerups.active('spread')) {
      shots = this.weapons.fireSpread(this.ship.pos, this.ship.aim, pt.spread.count, pt.spread.arc, rateMul);
    } else {
      const b = this.weapons.fire(this.ship.pos, this.ship.aim, rateMul);
      shots = b ? [b] : [];
    }
    for (const b of shots) this.emit('fire', { pos: b.pos });
  }

  /** GDD: BOMB shatters all on-screen asteroids; each counts as a kill feeding the
   * combo chain (and can roll a power-up drop like any kill).
   * Event path (rare), so the slice() copy is acceptable. */
  bombBlast() {
    const targets = this.field.rocks.slice();
    for (const r of targets) {
      if (!this.field.shatter(r.id)) continue;
      const base = this.cfg.asteroid.sizes[r.size].score;
      const points = this.scoreKeeper.kill(base, this.time);
      this.emit('kill', { pos: { x: r.pos.x, y: r.pos.y }, size: r.size, points, combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier });
      const drop = this.powerups.maybeDrop({ x: r.pos.x, y: r.pos.y });
      if (drop) this.emit('powerupDrop', { type: drop.type, pos: { x: drop.pos.x, y: drop.pos.y } });
    }
    if (targets.length > 0) this.emit('bomb', { count: targets.length });
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
      const drop = this.powerups.maybeDrop({ x: rock.pos.x, y: rock.pos.y });
      if (drop) this.emit('powerupDrop', { type: drop.type, pos: { x: drop.pos.x, y: drop.pos.y } });
    }
    this.weapons.compact();
  }

  resolveShipRocks() {
    if (this.ship.isInvulnerable || this.lives <= 0) return;
    const hit = shipHitRock(this.ship.pos.x, this.ship.pos.y, this.cfg.ship.radius, this.field.rocks);
    if (!hit) return;
    this.field.destroy(hit.id);
    // GDD: SHIELD absorbs 1 hit (12s or until hit) - rock shatters, no life
    // lost, no knockback, no invuln, combo chain unbroken.
    if (this.powerups.isShielding() && this.powerups.consumeShieldHit()) {
      this.emit('shieldPop', { pos: { x: this.ship.pos.x, y: this.ship.pos.y } });
      return;
    }
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
    this.powerups.clear();
    this.livesMgr.reset();
    this.game.reset(); // also clears the gameOver getter (it derives from game state)
    this.time = 0;
    this.events.length = 0;
  }
}





