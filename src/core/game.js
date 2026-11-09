// Void Runner - world orchestrator (ST-012). Pure core: no DOM, no three.
// Per-frame data flow: intent in -> step -> events out (drained by render/audio/hud).
import { Ship } from './ship.js';
import { Weapons } from './weapons.js';
import { AsteroidField } from './asteroids.js';
import { MineField } from './mines.js';
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
    this.mines = new MineField(rng, cfg); // ST-054
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
    if (wv.startedWave) {
      this.emit('wave', { n: wv.startedWave, mod: this.waves.activeMod }); // ST-051
      this.spawnMinesForWave(wv.startedWave); // ST-054
    }
    if (wv.waveCleared) this.emit('waveCleared', { n: wv.waveCleared });
    this.mines.step(dt, this.ship.pos); // ST-054
    this.resolveBulletMines(); // ST-054
    this.resolveShipMines(); // ST-054
    this.resolveBulletRocks();
    this.resolveShipRocks();
    this.resolveNearMisses(); // ST-053 (after ship hits: a hit-rock is destroyed, no double award)
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
      const base = this.cfg.asteroid.sizes[r.size].score * (r.golden ? this.cfg.asteroid.golden.scoreMult : 1); // ST-052
      const points = this.scoreKeeper.kill(base, this.time);
      this.emit('kill', { pos: { x: r.pos.x, y: r.pos.y }, size: r.size, points, combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier, golden: !!r.golden });
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
      const base = this.cfg.asteroid.sizes[rock.size].score * (rock.golden ? this.cfg.asteroid.golden.scoreMult : 1); // ST-052
      this.field.destroy(id);
      const points = this.scoreKeeper.kill(base, this.time);
      this.emit('kill', { pos: { x: rock.pos.x, y: rock.pos.y }, size: rock.size, points, combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier, golden: !!rock.golden });
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

  /** ST-054: spawn the wave's mines once it is eligible (wave >= firstWave). */
  spawnMinesForWave(wave) {
    const m = this.cfg.mine;
    if (wave < m.firstWave) return;
    for (let i = 0; i < m.perWave; i++) this.mines.spawn(this.ship.pos);
  }

  /** ST-054: bullets shatter mines (1 hit). Each mine kill feeds the combo. */
  resolveBulletMines() {
    for (const b of this.weapons.bullets) {
      if (b.dead) continue;
      const hit = this.mines.mines.find(mm => !mm.dead &&
        Math.hypot(mm.pos.x - b.pos.x, mm.pos.y - b.pos.y) < mm.radius + b.radius);
      if (!hit) continue;
      this.weapons.markHit(b.id);
      this.mines.destroy(hit.id);
      const points = this.scoreKeeper.kill(this.cfg.mine.score, this.time);
      this.emit('kill', { pos: { x: hit.pos.x, y: hit.pos.y }, size: 'mine', points,
        combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier, mine: true });
      this.emit('mineExplode', { pos: { x: hit.pos.x, y: hit.pos.y } });
    }
    this.weapons.compact();
  }

  /** ST-054: a mine touching the ship costs a life (same as a rock hit) and the mine is lost. */
  resolveShipMines() {
    if (this.ship.isInvulnerable || this.lives <= 0) return;
    const hit = this.mines.mines.find(mm => !mm.dead &&
      Math.hypot(mm.pos.x - this.ship.pos.x, mm.pos.y - this.ship.pos.y) < mm.radius + this.cfg.ship.radius);
    if (!hit) return;
    this.mines.destroy(hit.id);
    this.emit('mineExplode', { pos: { x: hit.pos.x, y: hit.pos.y } });
    const livesLeft = this.livesMgr.damage();
    this.scoreKeeper.onDamage();
    const nx = (this.ship.pos.x - hit.pos.x), ny = (this.ship.pos.y - hit.pos.y);
    const n = Math.hypot(nx, ny) || 1;
    this.emit('hit', { pos: { x: this.ship.pos.x, y: this.ship.pos.y }, knock: { x: nx / n, y: ny / n }, lives: livesLeft });
    this.ship.damage(v2(nx / n, ny / n));
    if (livesLeft <= 0) {
      this.game.to(STATE.GAME_OVER);
      this.emit('gameover', { score: this.score });
    }
  }

  /** ST-053: near-miss bonus - flat points + swish when a rock grazes the ship.
   * One award per approach: a rock re-arms only after leaving an extended ring.
   * Skipped while invulnerable or out of lives. */
  resolveNearMisses() {
    if (this.ship.isInvulnerable || this.lives <= 0) return;
    const nm = this.cfg.nearMiss;
    const sx = this.ship.pos.x, sy = this.ship.pos.y;
    for (const r of this.field.rocks) {
      if (r.dead) continue;
      const d = Math.hypot(r.pos.x - sx, r.pos.y - sy) - r.radius;
      if (d < nm.radius && !r.nearHot && (r.nearImmune || 0) <= 0) {
        r.nearHot = true;
        const pts = this.scoreKeeper.bonus(nm.points);
        this.emit('nearmiss', { pos: { x: r.pos.x, y: r.pos.y }, points: pts });
      } else if (r.nearHot && d > nm.radius * nm.rearmMult) {
        r.nearHot = false;
      }
    }
  }

  reset() {
    this.ship = new Ship(0, 0, this.cfg);
    this.weapons.clear();
    this.field.clear();
    this.mines.clear();
    this.scoreKeeper.reset();
    this.waves.reset();
    this.powerups.clear();
    this.livesMgr.reset();
    this.game.reset(); // also clears the gameOver getter (it derives from game state)
    this.time = 0;
    this.events.length = 0;
  }
}





