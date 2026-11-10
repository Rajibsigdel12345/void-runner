// Void Runner - world orchestrator (ST-012). Pure core: no DOM, no three.
// Per-frame data flow: intent in -> step -> events out (drained by render/audio/hud).
import { Ship } from './ship.js';
import { Weapons } from './weapons.js';
import { AsteroidField } from './asteroids.js';
import { MineField } from './mines.js';
import { DroneField } from './drones.js'; // ST-117
import { Monolith, bossHpForWave } from './boss.js';
import { EnemyBulletField } from './enemyBullets.js';
import { VortexField } from './vortex.js'; // ST-059
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
    this.drones = new DroneField(rng, cfg); // ST-117
    this.boss = null; // ST-055
    this.enemyBullets = new EnemyBulletField(cfg); // ST-056
    this.vortex = new VortexField(rng, cfg); // ST-059
    this.bossFireTimer = this.cfg.boss.fireEvery; // ST-056
    this.events = [];
    this._eventSpare = [];
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

  /** PAUSED -> MENU (ST-068): abandon the run - full system reset, back to the menu. */
  quitToMenu() {
    if (!this.game.in(STATE.PAUSED)) return false;
    this.game.to(STATE.MENU);
    this.reset();
    return true;
  }

  /** Full session restart from MENU or GAME_OVER: reset all systems, then begin. */
  restart() { this.reset(); return this.begin(); }

  emit(type, data) { this.events.push({ type, data }); }
  drainEvents() {
  const e = this.events;
  this._eventSpare.length = 0; // stale buffer becomes the new live one: clear first
  this.events = this._eventSpare;
  this._eventSpare = e; // drained buffer parks here; cleared on its next cycle
  return e;
} // ST-074: double-buffer swap - zero steady-state allocs, returned array keeps its events

  /**
   * @param {number} dt seconds
   * @param {{thrust:{x:number,y:number}, aimPoint:{x:number,y:number}|null, firing:boolean}} intent
   */
  step(dt, intent = { thrust: v2(), aimPoint: null, firing: false }) {
    if (!this.game.in(STATE.PLAYING)) return;
    this.time += dt;
    // ST-115: slow-mo power-up - enemy-side systems (rocks, enemy bullets, mines, boss, vortex) run on a scaled dt; the ship (and its weapons) keep full speed.
    const es = this.enemyScale();
    const edt = dt * es;

    const vt = this.vortex.step(edt, { wave: this.waves.wave, shipPos: this.ship.pos, rocks: this.field.rocks }); // ST-059
    for (const ev of vt.events) this.emit(ev.type, ev.data); // ST-059
    if (vt.pull) { // ST-059: vortex pull on the ship (clamped at maxSpeed)
      this.ship.vel.x += vt.pull.x * dt;
      this.ship.vel.y += vt.pull.y * dt;
      const vsp = Math.hypot(this.ship.vel.x, this.ship.vel.y);
      if (vsp > this.cfg.ship.maxSpeed) {
        const s = this.cfg.ship.maxSpeed / vsp;
        this.ship.vel.x *= s;
        this.ship.vel.y *= s;
      }
    }
    this.ship.step(dt, intent.thrust, intent.aimPoint);
    if (intent.firing) this.fireWeapon();
    this.weapons.step(dt, this.powerups.active('magnet'), this.field.rocks);
    this.field.step(edt, this.waves.inwardAccel); // ST-051 inward modifier (ST-115: scaled under slow-mo)
    this.scoreKeeper.overdriveMult = this.powerups.active('overdrive') ? this.cfg.powerup.types.overdrive.mult : 1; // ST-057
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
      this.emit('wave', { n: wv.startedWave, mod: this.waves.activeMod, endless: wv.startedWave >= this.cfg.waveEndless.first }); // ST-051
      this.spawnMinesForWave(wv.startedWave); // ST-054
      this.spawnBossForWave(wv.startedWave); // ST-055
      this.spawnDronesForWave(wv.startedWave); // ST-117
    }
    if (wv.waveCleared) this.emit('waveCleared', { n: wv.waveCleared });
    this.mines.step(edt, this.ship.pos); // ST-054 (ST-115: scaled under slow-mo)
    this.drones.step(edt, this.ship.pos); // ST-117 (ST-115: scaled under slow-mo)
    for (const f of this.mines.takeFires()) { // ST-056
      const b = this.fireAimedBolt(f, this.cfg.enemyBullets.mineSpeed);
      if (b) this.emit('mineFire', { pos: { x: f.x, y: f.y } });
    }
    this.enemyBullets.step(edt); // ST-056 (ST-115: scaled under slow-mo)
    if (this.boss) { // ST-055/056
      if (this.boss.step(edt, this.ship.pos) === 'ring') this.bossRingBurst(); // ST-115: scaled under slow-mo
      this.bossFireTimer -= edt; // ST-115: boss fire cadence slows under slow-mo
      if (this.bossFireTimer <= 0) {
        this.bossFireTimer += this.cfg.boss.fireEvery;
        const b = this.fireAimedBolt(this.boss.pos, this.cfg.enemyBullets.speed);
        if (b) this.emit('bossFire', { pos: { x: this.boss.pos.x, y: this.boss.pos.y } });
      }
    }
    this.resolveBulletMines(); // ST-054
    this.resolveBulletBoss(); // ST-055
    this.resolveShipMines(); // ST-054
    this.resolveBulletDrones(); // ST-117
    this.resolveShipDrones(); // ST-117
    this.resolveShipBoss(); // ST-055
    this.resolveShipEnemyBullets(); // ST-056
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
  /** ST-115: time scale applied to enemy-side systems while the slow-mo power-up is active. 1 = normal. */
  enemyScale() {
    return this.powerups.active('slowmo') ? this.cfg.powerup.types.slowmo.scale : 1;
  }

  bombBlast() {
    // ST-113: brief invulnerability on bomb use (granted even when the screen is clear).
    const inv = this.cfg.powerup.types.bomb.invuln || 0;
    if (inv > 0) this.ship.invuln = Math.max(this.ship.invuln, inv);
    const targets = this.field.rocks.slice();
    for (const r of targets) {
      if (!this.field.shatter(r.id)) continue;
      const base = r.shielded ? this.cfg.asteroid.shielded.score : this.cfg.asteroid.sizes[r.size].score * (r.golden ? this.cfg.asteroid.golden.scoreMult : 1); // ST-052/ST-121
      const points = this.scoreKeeper.kill(base, this.time);
      this.emit('kill', { pos: { x: r.pos.x, y: r.pos.y }, size: r.size, points, combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier, overdrive: this.powerups.active('overdrive'), golden: !!r.golden });
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
      const res = this.field.hit(id); // ST-121: armor-aware single hit (shielded rocks absorb until exhausted)
      if (!res || !res.destroyed) { // ST-121: shield absorbed the shot - no score, no combo, no split
        if (res) this.emit('rockShieldHit', { pos: { x: rock.pos.x, y: rock.pos.y }, shielded: true, armorLeft: res.armorLeft });
        continue;
      }
      const gb = this.cfg.asteroid.split.genBonus;
      const genBonus = gb[Math.min(rock.gen || 0, gb.length - 1)] || 0; // ST-120: deeper fragments are worth more (clamps beyond the table)
      const base = res.shielded
        ? this.cfg.asteroid.shielded.score // ST-121: shielded shatter pays a flat, higher reward
        : this.cfg.asteroid.sizes[rock.size].score * (rock.golden ? this.cfg.asteroid.golden.scoreMult : 1) * (1 + genBonus); // ST-052/ST-120
      const points = this.scoreKeeper.kill(base, this.time);
      this.emit('kill', { pos: { x: rock.pos.x, y: rock.pos.y }, size: rock.size, points, combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier, overdrive: this.powerups.active('overdrive'), golden: !!rock.golden, gen: rock.gen || 0, shielded: res.shielded });
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
        combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier, overdrive: this.powerups.active('overdrive'), mine: true });
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

  /** ST-055: spawn the Monolith on every multiple of everyWave, in addition to wave content.
   * No-op on other waves or while a boss is alive. Spawns at the rim, re-rolled if too close to the ship. */
  spawnBossForWave(wave) {
    const b = this.cfg.boss;
    if (wave % b.everyWave !== 0 || this.boss) return;
    const R = this.cfg.arena.radius - b.radius;
    let pos = null, tries = 0;
    do {
      const a = this.rng.next() * Math.PI * 2;
      pos = v2(Math.cos(a) * R, Math.sin(a) * R);
      tries++;
    } while (Math.hypot(pos.x - this.ship.pos.x, pos.y - this.ship.pos.y) < 10 && tries < 8);
    this.boss = new Monolith(this.rng, this.cfg, pos, bossHpForWave(this.cfg, wave)); // ST-064: endless-arc HP
    this.bossFireTimer = this.cfg.boss.fireEvery; // ST-056: fresh boss starts a full interval
    this.emit('bossSpawn', { pos: { x: pos.x, y: pos.y } });
  }

  /** ST-055: the boss bursts a ring of S rocks fired radially outward from its position. */
  bossRingBurst() {
    const b = this.cfg.boss;
    const sp = this.cfg.asteroid.sizes.S.speed[0];
    const px = this.boss.pos.x, py = this.boss.pos.y;
    for (let i = 0; i < b.ringCount; i++) {
      const rock = this.field.spawn('S', 1, { x: px, y: py });
      if (!rock) break; // field at its concurrent cap
      const a = (i / b.ringCount) * Math.PI * 2;
      rock.vel = v2(Math.cos(a) * sp, Math.sin(a) * sp);
    }
    this.emit('bossRing', { pos: { x: px, y: py } });
  }

  /** ST-055: bullets damage the boss (1 each); the killing hit pays the headline score. */
  resolveBulletBoss() {
    const boss = this.boss;
    if (!boss || !boss.alive) return;
    for (const blt of this.weapons.bullets) {
      if (blt.dead) continue;
      if (Math.hypot(boss.pos.x - blt.pos.x, boss.pos.y - blt.pos.y) < boss.radius + blt.radius) {
        this.weapons.markHit(blt.id);
        if (boss.hit()) this.bossDeath();
      }
    }
    this.weapons.compact();
  }

  /** ST-055: the boss dies - headline score (feeds the combo), splits into M rocks, FX event. */
  bossDeath() {
    const b = this.cfg.boss;
    const px = this.boss.pos.x, py = this.boss.pos.y;
    const pts = this.scoreKeeper.kill(b.score, this.time);
    this.emit('kill', { pos: { x: px, y: py }, size: 'boss', points: pts,
      combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier, overdrive: this.powerups.active('overdrive'), boss: true });
    for (let i = 0; i < b.splitCount; i++) this.field.spawn('M', 1, { x: px, y: py });
    this.emit('bossDeath', { pos: { x: px, y: py } });
    this.boss = null;
  }

  /** ST-055: the boss touching the ship costs a life (same flow as a rock hit). The boss survives. */
  resolveShipBoss() {
    if (this.ship.isInvulnerable || this.lives <= 0) return;
    const boss = this.boss;
    if (!boss || !boss.alive) return;
    if (Math.hypot(boss.pos.x - this.ship.pos.x, boss.pos.y - this.ship.pos.y) < boss.radius + this.cfg.ship.radius) {
      const livesLeft = this.livesMgr.damage();
      this.scoreKeeper.onDamage();
      const nx = (this.ship.pos.x - boss.pos.x), ny = (this.ship.pos.y - boss.pos.y);
      const n = Math.hypot(nx, ny) || 1;
      this.emit('hit', { pos: { x: this.ship.pos.x, y: this.ship.pos.y }, knock: { x: nx / n, y: ny / n }, lives: livesLeft });
      this.ship.damage(v2(nx / n, ny / n));
      if (livesLeft <= 0) {
        this.game.to(STATE.GAME_OVER);
        this.emit('gameover', { score: this.score });
      }
    }
  }
  /** ST-056: fire an enemy bolt from fromPos aimed at the ship's current position. */
  fireAimedBolt(fromPos, speed) {
    const dx = this.ship.pos.x - fromPos.x, dy = this.ship.pos.y - fromPos.y;
    const d = Math.hypot(dx, dy) || 1;
    return this.enemyBullets.fire(fromPos, { x: dx / d, y: dy / d }, speed);
  }

  /** ST-056: a bolt touching the ship costs a life (same flow as rock contact). */
  resolveShipEnemyBullets() {
    if (this.ship.isInvulnerable || this.lives <= 0) return;
    for (const b of this.enemyBullets.bullets) {
      if (b.dead) continue;
      if (Math.hypot(b.pos.x - this.ship.pos.x, b.pos.y - this.ship.pos.y) < b.radius + this.cfg.ship.radius) {
        b.dead = true;
        this.enemyBullets.compact();
        const livesLeft = this.livesMgr.damage();
        this.scoreKeeper.onDamage();
        const nx = (this.ship.pos.x - b.pos.x), ny = (this.ship.pos.y - b.pos.y);
        const n = Math.hypot(nx, ny) || 1;
        this.emit('hit', { pos: { x: this.ship.pos.x, y: this.ship.pos.y }, knock: { x: nx / n, y: ny / n }, lives: livesLeft });
        this.ship.damage(v2(nx / n, ny / n));
        if (livesLeft <= 0) {
          this.game.to(STATE.GAME_OVER);
          this.emit('gameover', { score: this.score });
        }
        break; // one life per step (invuln prevents chain hits)
      }
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

  /** ST-117: spawn the wave's homing drones once eligible (wave >= firstWave). */
  spawnDronesForWave(wave) {
    const d = this.cfg.drone;
    if (wave < d.firstWave) return;
    for (let i = 0; i < d.perWave; i++) this.drones.spawn(this.ship.pos);
  }

  /** ST-117: bullets destroy drones (1 hit). Each drone kill feeds the combo. */
  resolveBulletDrones() {
    for (const b of this.weapons.bullets) {
      if (b.dead) continue;
      const hit = this.drones.drones.find(dm => !dm.dead &&
        Math.hypot(dm.pos.x - b.pos.x, dm.pos.y - b.pos.y) < dm.radius + b.radius);
      if (!hit) continue;
      this.weapons.markHit(b.id);
      this.drones.destroy(hit.id);
      const points = this.scoreKeeper.kill(this.cfg.drone.score, this.time);
      this.emit('kill', { pos: { x: hit.pos.x, y: hit.pos.y }, size: 'drone', points,
        combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier, overdrive: this.powerups.active('overdrive'), drone: true });
      this.emit('droneExplode', { pos: { x: hit.pos.x, y: hit.pos.y } });
    }
    this.weapons.compact();
  }

  /** ST-117: a drone touching the ship costs a life (same as a mine hit) and is lost. */
  resolveShipDrones() {
    if (this.ship.isInvulnerable || this.lives <= 0) return;
    const hit = this.drones.drones.find(dm => !dm.dead &&
      Math.hypot(dm.pos.x - this.ship.pos.x, dm.pos.y - this.ship.pos.y) < dm.radius + this.cfg.ship.radius);
    if (!hit) return;
    this.drones.destroy(hit.id);
    this.emit('droneExplode', { pos: { x: hit.pos.x, y: hit.pos.y } });
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

  reset() {
    this.ship = new Ship(0, 0, this.cfg);
    this.weapons.clear();
    this.field.clear();
    this.mines.clear();
    this.drones.clear(); // ST-117
    this.boss = null; // ST-055
    this.enemyBullets.clear(); // ST-056
    this.vortex.reset(); // ST-059
    this.bossFireTimer = this.cfg.boss.fireEvery; // ST-056
    this.scoreKeeper.reset();
    this.waves.reset();
    this.powerups.clear();
    this.livesMgr.reset();
    this.game.reset(); // also clears the gameOver getter (it derives from game state)
    this.time = 0;
    this.events.length = 0;
    this._eventSpare.length = 0; // ST-074: spare buffer too (no stale events after swap)
  }
}





