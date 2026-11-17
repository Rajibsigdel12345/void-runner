// Void Runner - world orchestrator (ST-012). Pure core: no DOM, no three.
// Per-frame data flow: intent in -> step -> events out (drained by render/audio/hud).
import { Ship } from './ship.js';
import { Weapons } from './weapons.js';
import { AsteroidField } from './asteroids.js';
import { MineField } from './mines.js';
import { DroneField } from './drones.js'; // ST-117
import { StingerField } from './stinger.js'; // ST-229
import { FlyerField } from './flyer.js'; // ST-232
import { HunterField } from './hunter.js'; // ST-418
import { GunshipField } from './gunship.js'; // ST-418
import { SentryField } from './sentry.js'; // ST-448
import { WaspField } from './wasp.js'; // ST-448
import { PodField } from './pod.js'; // ST-448
import { Monolith, bossHpForWave, bossBurstVectors } from './boss.js';
import { Splicer, splicerHpForWave } from './splicer.js';
import { CampaignBoss } from './campaignBoss.js'; // ST-456 (E64): the campaign end-of-level boss
import { Warden } from './warden.js'; // ST-136
import { EnemyBulletField } from './enemyBullets.js';
import { VortexField } from './vortex.js'; // ST-059
import { bulletHitRock, shipHitRock } from './collision.js';
import { CONFIG } from './config.js';
import { v2 } from './math.js';
import { ScoreKeeper, capFor } from './score.js';
import { WaveDirector } from './waves.js';
import { Lives } from './lives.js';
import { PowerUpField } from './powerups.js';
import { GameState, STATE } from './state.js';
import { SkillModel } from './skillModel.js'; // ST-304 (I329)
import { Director } from './director.js'; // ST-304 (I329)
import { stageForWave, isStageEndWave, isFinalWave, makeWarp, stepWarp, stageTheme } from './stages.js'; // ST-419 (E57)
import { bossDistance, bossKind, isFinalLevel, levelCount, levelNameKey, zoneAtDistance, zoneNameKey, zoneRow } from './level.js'; // ST-453 (E64); ST-457 (E64)

export class World {
  constructor(rng, cfg = CONFIG) {
    this.cfg = cfg;
    this.rng = rng;
    this.ship = new Ship(0, 0, cfg);
    this.weapons = new Weapons(cfg);
    this.field = new AsteroidField(rng, cfg);
    this.mines = new MineField(rng, cfg); // ST-054
    this.drones = new DroneField(rng, cfg); // ST-117
    this.stingers = new StingerField(rng, cfg); // ST-229
    this.flyers = new FlyerField(rng, cfg); // ST-232
this.hunters = new HunterField(rng, cfg); // ST-418
this.gunships = new GunshipField(rng, cfg); // ST-418
this.sentries = new SentryField(rng, cfg); // ST-448
this.wasps = new WaspField(rng, cfg); // ST-448
this.pods = new PodField(rng, cfg); // ST-448
    this.boss = null; // ST-055
    this.bossRelease = 0; // ST-241: 1 -> 0 over music.intensity.releaseTime after a boss death
    this.enemyBullets = new EnemyBulletField(cfg); // ST-056
    this.vortex = new VortexField(rng, cfg); // ST-059
    this.bossFireTimer = this.cfg.boss.fireEvery; // ST-056
    this._bossPhaseEmitted = false; // ST-133: enrage event fires once per boss
    this.bossBurstTimer = this.cfg.boss.burst.every; // ST-134
    this.warden = null; // ST-136
    this.bossBursts = 0; // ST-134: volley count (spiral offset)
    this.bossSpawnCount = 0; // ST-143: alternates the Monolith / Splicer variant
    this.events = [];
    this._eventSpare = [];
    this.scoreKeeper = new ScoreKeeper(cfg);
    this.waves = new WaveDirector(rng, this.field, cfg);
    this.skill = new SkillModel(this.cfg.skill, 1 / 60); // ST-304 (I329)
    this.director = new Director(this.cfg.director); // ST-304 (I329)
    this.waves.onDecide = (wave) => this._decideForWave(wave); // ST-304 (I329) / ST-453 (E64): director decision x zone rockRate (campaign only)
    this.powerups = new PowerUpField(rng, cfg);
    this.livesMgr = new Lives(cfg.ship.lives);
    this.game = new GameState();
    this.time = 0;
    this.replayMode = false; // ST-190: watch a saved replay (REPLAY state)
    this.mode = 'endless'; this.currentStage = 1; this.warp = null; this.victory = false; // ST-419: mode + campaign state (endless default)
    this._wlevel = 1; // ST-122: current weapon level (drives weaponLevelUp events)
    this.levelState = { level: 1, distance: 0, zone: 1, phase: 'zone' }; // ST-453 (E64)
    this._campaignStartLevel = 1; // ST-457 (E64): fresh campaign runs start at the localStorage-continued level
    this._levelStartScore = 0; // ST-453 (E64)
    this._lastZone = 0; // ST-453 (E64)
  }

  get score() { return this.scoreKeeper.score; }
  get wave() { return this.waves.wave; }
  get lives() { return this.livesMgr.count; }
  /** ST-190: the sim advances while PLAYING or REPLAY (both are "live" sim states). */
  get simActive() { return this.game.in(STATE.PLAYING) || this.game.in(STATE.REPLAY); }

  /** I152: full session stats snapshot (score, kills, wave, best combo, accuracy, time). */
  sessionStats() {
    const sk = this.scoreKeeper;
    return {
      score: sk.score,
      kills: sk.kills,
      wave: this.wave,
      level: this.levelState.level, // ST-453 (E64)
      maxCombo: sk.maxCombo,
      shotsFired: sk.shotsFired,
      shotsHit: sk.shotsHit,
      accuracy: sk.accuracy(),
      time: this.time,
    };
  }

  /** I152: player bullet connected - mark it dead and count the hit for accuracy. */
  onPlayerBulletHit(bulletId) { this.weapons.markHit(bulletId); this.scoreKeeper.onShotHit(); }
  get gameOver() { return this.game.in(STATE.GAME_OVER); }

  /** ST-122: current weapon level (1-based) from the wave - highest level whose minWave <= wave. */
  weaponLevel() {
    const lv = this.cfg.weapon.levels;
    let lvl = 1;
    for (let i = 0; i < lv.length; i++) if (this.waves.wave >= lv[i].minWave) lvl = i + 1;
    return lvl;
  }
  weaponSpec() { return this.cfg.weapon.levels[this.weaponLevel() - 1]; }

  /** MENU -> PLAYING and start the wave director. No-op unless in MENU. */
  begin(mode) {
    if (typeof mode === 'string') this.setMode(mode); // ST-419: optional mode (default endless)
    if (!this.game.to(STATE.PLAYING)) return false;
    this.replayMode = false; // ST-190: begin() always starts a live run
    this.currentStage = 1; this.warp = null; this.victory = false; // ST-419: fresh run
    this.waves.start();
    this._initLevelRun(this.mode === 'campaign' ? this._campaignStartLevel : 1); // ST-453 (E64) + ST-457 (E64): campaign starts at the continue level
    return true;
  }

  /** ST-419: mode select - 'campaign' runs the linear stage system; anything else = endless. */
  setMode(m) { this.mode = (m === 'campaign') ? 'campaign' : 'endless'; }
  /** ST-457 (E64): the level a fresh campaign run starts at (localStorage continue). Clamped 1..levelCount. */
  setCampaignStartLevel(n) {
    const L = levelCount(this.cfg);
    const k = Math.floor(Number(n));
    this._campaignStartLevel = (Number.isFinite(k) && k >= 1) ? Math.min(L, k) : 1;
    return this._campaignStartLevel;
  }
  /** ST-190: start watching a replay - MENU -> REPLAY (same wave start as begin()). */
  replayBegin() {
    if (!this.game.to(STATE.REPLAY)) return false;
    this.replayMode = true;
    this.waves.start();
    this._initLevelRun(1); // ST-453 (E64); ST-457: replays are always endless
    return true;
  }
  /** PLAYING -> PAUSED (sim frozen via the step gate). No-op unless PLAYING. */
  pause() { return this.game.to(STATE.PAUSED); }

  /** PAUSED -> PLAYING only (begin() owns the MENU start, restart() the full reset). */
  resume() { return this.game.in(STATE.PAUSED) && this.game.to(this.replayMode ? STATE.REPLAY : STATE.PLAYING); }

  /** PAUSED -> MENU (ST-068): abandon the run - full system reset, back to the menu. */
  quitToMenu() {
    if (!this.game.in(STATE.PAUSED)) return false;
    this.game.to(STATE.MENU);
    this.reset();
    return true;
  }

  /** ST-304 (I329): the ship takes a hit - lives bookkeeping + adaptive-director telemetry. */
  shipDamage() {
    const left = this.livesMgr.damage();
    this.skill.onEvent('hit', { lives: left });
    this.director.onEvent('hit', { lives: left });
    return left;
  }

  /** ST-304 (I329): the active wave pickup-drop multiplier (1 = no director adjustment). */
  dropMul() { const a = this.waves.activeAdj; return a ? a.drop : 1; }

  /** Full session restart from MENU or GAME_OVER: reset all systems, then begin. */
  restart() { this.reset(); return this.begin(); }
  /** ST-141: reseed the shared RNG so a run can start from a specific seed (daily runs). */
  reseed(seed) { this.rng.reset(seed); return this; }

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
    if (!this.simActive) return; // ST-190: PLAYING or REPLAY
    // ST-419: campaign warp - whole sim (incl. game clock) frozen; only the fixed timer advances (real dt, no RNG).
    if (this.warp) {
      const wst = stepWarp(this.warp, dt);
      if (wst === 'done') {
        const nextLvl = this.warp.nextLevel; // ST-453 (E64): campaign warp carries the next level (undefined in endless)
        const next = this.warp.nextStage || (this.currentStage + 1);
        this.warp = null; this.currentStage = next;
        this.emit('stageCleared', { stage: next - 1 });
        this.emit('themeSwap', { stage: next, theme: stageTheme(next, this.cfg) });
        if (typeof nextLvl === "number") {
          const ls = this.levelState;
          ls.level = nextLvl; ls.distance = 0; ls.zone = 1; ls.phase = "zone";
          this._levelStartScore = this.scoreKeeper.score;
          this._lastZone = 0;
          this.emit("levelIntro", { level: nextLvl, nameKey: levelNameKey(nextLvl) });
          this._emitZoneEnter(true);
        }
      }
      return;
    }
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
    this.skill.sample(this.ship.pos, this.field.rocks.map(rr => ({ x: rr.pos.x, y: rr.pos.y, r: rr.radius }))); // ST-304 (I329)
    // NOTE: 0-asset rule G33.0-R3 - uniform threat weight 1 for rocks; per-type weights (cfg.skill.weights)
    // apply once other enemy types are folded into the load (E34+). Rocks are the dominant threat.

    this.director.sample(dt, this.skill.load); // ST-304 (I329)
    this._levelStep(dt); // ST-453 (E64): forward level distance + zone/boss transitions (campaign only)
    const wv = this.waves.step(dt, this.ship.pos);
    if (wv.startedWave) {
      this.enemyBullets.speedMul = this.waves.activeAdj ? this.waves.activeAdj.b : 1; // ST-304 (I329)
      this.emit('wave', { n: wv.startedWave, mod: this.waves.activeMod, endless: wv.startedWave >= this.cfg.waveEndless.first }); // ST-051
      this.spawnMinesForWave(wv.startedWave); // ST-054
      this.spawnBossForWave(wv.startedWave); // ST-055
      this.spawnWardenForWave(wv.startedWave); // ST-136 (only on 5th waves without a live Monolith)
      this.spawnBeltForWave(wv.startedWave); // ST-138 (one drifting indestructible per wave from wave 8, up to the cap)
      this.spawnDronesForWave(wv.startedWave); // ST-117
      this.spawnStingersForWave(wv.startedWave); // ST-229
      this.spawnFlyersForWave(wv.startedWave); // ST-232
this.spawnHunterForWave(wv.startedWave); // ST-418
this.spawnGunshipForWave(wv.startedWave); // ST-418
this.spawnSentryForWave(wv.startedWave); // ST-448
this.spawnWaspForWave(wv.startedWave); // ST-448
this.spawnPodForWave(wv.startedWave); // ST-448
      this.scoreKeeper.setCap(capFor(wv.startedWave, this.cfg)); // ST-233: combo cap wave-scaling (W1-2 capLow / W3+ capHigh)
    }
    const wl = this.weaponLevel(); // ST-122: weapon progression by wave
    if (wl > this._wlevel) { this._wlevel = wl; this.emit('weaponLevelUp', { level: wl }); }
    if (wv.waveCleared) this.emit('waveCleared', { n: wv.waveCleared });
    this.mines.step(edt, this.ship.pos); // ST-054 (ST-115: scaled under slow-mo)
    this.drones.step(edt, this.ship.pos); // ST-117 (ST-115: scaled under slow-mo)
    this.stingers.step(edt, this.ship.pos); // ST-229 (ST-115: scaled under slow-mo)
    this.flyers.step(edt); // ST-232 (ST-115: scaled under slow-mo; no homing - pure crosser)
this.hunters.step(edt, this.ship.pos, this.ship.aim); // ST-418 (ST-115: scaled under slow-mo)
this.gunships.step(edt, this.ship.pos); // ST-418 (ST-115: scaled under slow-mo)
this.sentries.step(edt, this.ship.pos); // ST-448 (ST-115: scaled under slow-mo)
this.wasps.step(edt, this.ship.pos); // ST-448 (ST-115: scaled under slow-mo)
this.pods.step(edt); // ST-448 (drift only; no shipPos; ST-115: scaled under slow-mo)
    if (this.warden) this.warden.step(edt, this.ship.pos); // ST-136 (ST-115: scaled under slow-mo)
    for (const dc of this.drones.decayed) { // I129: seeker battery expired -> self-destruct event (render FX in main.js)
      this.emit('droneDecay', { pos: { x: dc.pos.x, y: dc.pos.y } });
    }
    for (const se of this.stingers.drainEvents()) { // ST-229: telegraph / charge / fizzle (SFX + FX in main.js)
      const p = { x: se.pos.x, y: se.pos.y };
      this.emit(se.kind === 'fizzle' ? 'stingerFizzle' : se.kind === 'telegraph' ? 'stingerTelegraph' : 'stingerCharge', { pos: p });
    }
    for (const fe of this.flyers.drainEvents()) { // ST-232: hit / exit (SFX + FX in main.js)
      const p = { x: fe.pos.x, y: fe.pos.y };
      this.emit(fe.kind === 'hit' ? 'flyerHit' : 'flyerExit', { pos: p });
    }
    for (const he of this.hunters.drainEvents()) { // ST-418: telegraph / dash / fizzle (SFX + FX in main.js)
      const p = { x: he.pos.x, y: he.pos.y };
      this.emit(he.kind === 'fizzle' ? 'hunterFizzle' : he.kind === 'telegraph' ? 'hunterTelegraph' : 'hunterDash', { pos: p });
    }
    for (const ge of this.gunships.drainEvents()) { // ST-418: arm / fire(heavy bolt) / death(self)
      const p = { x: ge.pos.x, y: ge.pos.y };
      if (ge.kind === 'fire') {
        const gb = this.enemyBullets.fire(ge.pos, ge.dir, this.cfg.gunship.boltSpeed, this.cfg.gunship.boltRadius);
        if (gb) this.emit('gunshipFire', { pos: p });
      } else {
        this.emit(ge.kind === 'arm' ? 'gunshipArm' : 'gunshipDeath', { pos: p, self: ge.self });
      }
    }
    for (const se of this.sentries.drainEvents()) { // ST-448: charge / fire(bolt) / death(self)
      const p = { x: se.pos.x, y: se.pos.y };
      if (se.kind === 'fire') { const sb = this.enemyBullets.fire(se.pos, se.dir, this.cfg.sentry.boltSpeed); if (sb) this.emit('sentryFire', { pos: p }); }
      else if (se.kind === 'charge') this.emit('sentryCharge', { pos: p });
      else if (se.kind === 'death') this.emit('sentryDeath', { pos: p, self: se.self });
    }
    for (const we of this.wasps.drainEvents()) { // ST-448: dash / death(self)
      const p = { x: we.pos.x, y: we.pos.y };
      this.emit(we.kind === 'dash' ? 'waspDash' : 'waspDeath', { pos: p, self: we.self });
    }
    for (const pe of this.pods.drainEvents()) { // ST-448: death(self-expiry; split is resolve-driven)
      const p = { x: pe.pos.x, y: pe.pos.y };
      if (pe.kind === 'death') this.emit('podDeath', { pos: p, self: pe.self, split: false });
    }

    for (const f of this.mines.takeFires()) { // ST-056
      const b = this.fireAimedBolt(f, this.cfg.enemyBullets.mineSpeed);
      if (b) this.emit('mineFire', { pos: { x: f.x, y: f.y } });
    }
    this.enemyBullets.step(edt); // ST-056 (ST-115: scaled under slow-mo)
    if (this.boss) { // ST-055/056
      if (this.boss.isCampaignBoss) { // ST-456 (E64): the campaign level boss drives its own move set
        const ev = this.boss.step(edt, this.ship.pos); // ST-115: scaled under slow-mo
        if (ev.ring) this.bossRingBurst();
        if (ev.aim) {
          const b = this.fireAimedBolt(this.boss.pos, this.cfg.enemyBullets.speed);
          if (b) this.emit('bossFire', { pos: { x: this.boss.pos.x, y: this.boss.pos.y } });
        }
        if (ev.phase) this.emit('bossPhase', { level: this.levelState.level, phaseIndex: ev.phaseIndex, pos: { x: this.boss.pos.x, y: this.boss.pos.y } });
      } else {
        if (this.boss.step(edt, this.ship.pos) === 'ring') this.bossRingBurst(); // ST-115: scaled under slow-mo
        if (typeof this.boss.drainBolts === 'function') { // ST-143: Splicer spiral bolts
          const bolts = this.boss.drainBolts();
          if (bolts) this.bossSpiralBolts(bolts);
        }
        if (this.boss.entered >= 1) { // ST-135: entrance window - no aimed bolts or bursts
          this.bossFireTimer -= edt; // ST-115: boss fire cadence slows under slow-mo
          if (this.bossFireTimer <= 0) {
            this.bossFireTimer += this.bossAimEvery(); // ST-133/143: enraged + per-variant cadence
            const b = this.fireAimedBolt(this.boss.pos, this.cfg.enemyBullets.speed);
            if (b) this.emit('bossFire', { pos: { x: this.boss.pos.x, y: this.boss.pos.y } });
          }
          if (this.boss.kind === 'monolith') { // ST-143: radial burst is Monolith-only (Splicer uses the spiral)
            const bb = this.boss.cfg.boss.burst; // ST-419: per-boss cfg (Prime re-tune); no-op for normal bosses
            this.bossBurstTimer -= edt; // ST-134/ST-115: burst cadence slows under slow-mo
            if (this.bossBurstTimer <= 0) {
              this.bossBurstTimer += bb.every * (this.boss.phase === 2 ? bb.everyMult : 1); // ST-419: per-boss burst cadence
              this.bossBurst();
            }
          }
        }
      }
    }
    if (this.bossRelease > 0) this.bossRelease = Math.max(0, this.bossRelease - edt / this.cfg.music.intensity.releaseTime); // ST-241: release decay on slow-mo-scaled time
    this.resolveBulletMines(); // ST-054
    this.resolveBulletBoss(); // ST-055
    this.resolveBulletWarden(); // ST-136
    this.resolveShipMines(); // ST-054
    this.resolveBulletDrones(); // ST-117
    this.resolveShipDrones(); // ST-117
    this.resolveBulletStingers(); // ST-229
    this.resolveBulletFlyers(); // ST-232
    this.resolveShipStingers(); // ST-229
    this.resolveBulletHunters(); // ST-418
    this.resolveBulletGunships(); // ST-418
    this.resolveShipHunters(); // ST-418
    this.resolveShipGunships(); // ST-418
    this.resolveBulletSentries(); // ST-448
    this.resolveBulletWasps(); // ST-448
    this.resolveBulletPods(); // ST-448
    this.resolveShipSentries(); // ST-448
    this.resolveShipWasps(); // ST-448
    this.resolveShipPods(); // ST-448
    this.resolveShipBoss(); // ST-055
    this.resolveShipWarden(); // ST-136
    this.resolveShipEnemyBullets(); // ST-056
    this.resolveBulletRocks();
    this.resolveShipRocks();
    this.resolveNearMisses(); // ST-053 (after ship hits: a hit-rock is destroyed, no double award)
    // ST-419: campaign victory - final boss died and the ship is still alive (still PLAYING).
    if (this.victory && this.mode === 'campaign' && this.game.in(STATE.PLAYING)) {
      this.game.to(STATE.GAME_OVER);
      this.emit('gameover', { score: this.score, victory: true, stage: this.currentStage, level: this.levelState.level }); // ST-453 (E64)
    }
  }

  /** Firing with power-up modifiers (ST-021): RAPID doubles cadence, SPREAD fires a 3-way burst. */
  fireWeapon() {
    const pt = this.cfg.powerup.types;
    const spec = this.weaponSpec(); // ST-122: permanent level (count/arc/rateMul by wave)
    const rateMul = (this.powerups.active('rapid') ? pt.rapid.rate : 1) * spec.rateMul; // rapid stacks on the level
    const spread = this.powerups.active('spread');
    const count = spread ? pt.spread.count : spec.count; // spread power-up overrides the level layout
    const arc = spread ? pt.spread.arc : spec.arc;
    let shots;
    if (count > 1) {
      shots = this.weapons.fireSpread(this.ship.pos, this.ship.aim, count, arc, rateMul);
    } else {
      const b = this.weapons.fire(this.ship.pos, this.ship.aim, rateMul);
      shots = b ? [b] : [];
    }
    for (const b of shots) this.emit('fire', { pos: b.pos, level: this.weaponLevel() }); // ST-122: level for render
    if (shots.length) this.scoreKeeper.onShotFired(shots.length); // I152: accuracy denominator
    if (shots.length) this.skill.onEvent('shot'); // ST-304 (I329)
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
      const gbf = this.cfg.asteroid.split.genBonus; // ST-124: bomb honors the split per-gen fragment bonus (parity with the bullet path)
      const gbMul = 1 + (gbf[Math.min(r.gen || 0, gbf.length - 1)] || 0);
      const base = r.shielded ? this.cfg.asteroid.shielded.score : this.cfg.asteroid.sizes[r.size].score * (r.golden ? this.cfg.asteroid.golden.scoreMult : 1) * gbMul; // ST-052/ST-121/ST-124
      const points = this.scoreKeeper.kill(base, this.time);
      this.emit('kill', { pos: { x: r.pos.x, y: r.pos.y }, size: r.size, points, combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier, overdrive: this.powerups.active('overdrive'), golden: !!r.golden });
      this.skill.onEvent('kill', { combo: this.scoreKeeper.combo }); // ST-304 (I329)
      const drop = this.powerups.maybeDrop({ x: r.pos.x, y: r.pos.y }, this.dropMul()); // ST-304 (I329)
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
      this.onPlayerBulletHit(b.id);
      const res = this.field.hit(id); // ST-121: armor-aware single hit (shielded rocks absorb until exhausted)
      if (res && res.belt) { // ST-138: indestructible belt rock - bullet consumed, no score or split
        this.emit('beltHit', { pos: { x: rock.pos.x, y: rock.pos.y } });
        continue;
      }
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
      this.skill.onEvent('kill', { combo: this.scoreKeeper.combo }); // ST-304 (I329)
      const drop = this.powerups.maybeDrop({ x: rock.pos.x, y: rock.pos.y }, this.dropMul()); // ST-304 (I329)
      if (drop) this.emit('powerupDrop', { type: drop.type, pos: { x: drop.pos.x, y: drop.pos.y } });
    }
    this.weapons.compact();
  }

  resolveShipRocks() {
    if (this.ship.isInvulnerable || this.lives <= 0) return;
    const hit = shipHitRock(this.ship.pos.x, this.ship.pos.y, this.cfg.ship.radius, this.field.rocks);
    if (!hit) return;
    const hitRock = this.field.rocks.find(r => r.id === hit.id);
    if (!(hitRock && hitRock.belt)) this.field.destroy(hit.id); // ST-138: belt rocks survive ship contact
    // GDD: SHIELD absorbs 1 hit (12s or until hit) - rock shatters, no life
    // lost, no knockback, no invuln, combo chain unbroken.
    if (this.powerups.isShielding() && this.powerups.consumeShieldHit()) {
      this.emit('shieldPop', { pos: { x: this.ship.pos.x, y: this.ship.pos.y } });
      return;
    }
    const livesLeft = this.shipDamage();
    this.scoreKeeper.onDamage();
    this.emit('hit', { pos: { x: this.ship.pos.x, y: this.ship.pos.y }, knock: { x: hit.nx, y: hit.ny }, lives: livesLeft });
    this.ship.damage(v2(hit.nx, hit.ny));
    if (livesLeft <= 0) this._onLivesZero(); // ST-453 (E64)
  }

  /** ST-138: from cfg.belt.fromWave, add ONE drifting indestructible belt rock per
   *  wave start (up to cfg.belt.max on screen). Rim spawn kept 10 u from the ship,
   *  slow random-heading drift. Belt rocks persist for the rest of the run. */
  spawnBeltForWave(wave) {
    const b = this.cfg.belt;
    if (wave < b.fromWave) return;
    let n = 0;
    for (const r of this.field.rocks) if (r.belt) n++;
    if (n >= b.max) return;
    const r = this.field.spawn(b.size, 1, null, { x: this.ship.pos.x, y: this.ship.pos.y, min: 10 }, false, null, 0, false, true);
    if (!r) return;
    const ang = this.rng.next() * Math.PI * 2;
    const sp = this.rng.range(b.speed[0], b.speed[1]);
    r.vel = v2(Math.cos(ang) * sp, Math.sin(ang) * sp);
  }

  /** ST-054: spawn the wave's mines once it is eligible (wave >= firstWave). */
  spawnMinesForWave(wave) {
    const m = this.cfg.mine;
    if (wave < m.firstWave) return;
    if (!this._zoneAllows("mine")) return; // ST-453 (E64): zone mix gate
    const n = Math.max(0, Math.round(m.perWave * this._hazardRate("mineRate"))); // ST-453 (E64)
    for (let i = 0; i < n; i++) this.mines.spawn(this.ship.pos);
  }

  /** ST-054: bullets shatter mines (1 hit). Each mine kill feeds the combo. */
  resolveBulletMines() {
    for (const b of this.weapons.bullets) {
      if (b.dead) continue;
      const hit = this.mines.mines.find(mm => !mm.dead &&
        Math.hypot(mm.pos.x - b.pos.x, mm.pos.y - b.pos.y) < mm.radius + b.radius);
      if (!hit) continue;
      this.onPlayerBulletHit(b.id);
      this.mines.destroy(hit.id);
      const points = this.scoreKeeper.kill(this.cfg.mine.score, this.time);
      this.emit('kill', { pos: { x: hit.pos.x, y: hit.pos.y }, size: 'mine', points,
        combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier, overdrive: this.powerups.active('overdrive'), mine: true });
      this.skill.onEvent('kill', { combo: this.scoreKeeper.combo }); // ST-304 (I329)
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
    const livesLeft = this.shipDamage();
    this.scoreKeeper.onDamage();
    const nx = (this.ship.pos.x - hit.pos.x), ny = (this.ship.pos.y - hit.pos.y);
    const n = Math.hypot(nx, ny) || 1;
    this.emit('hit', { pos: { x: this.ship.pos.x, y: this.ship.pos.y }, knock: { x: nx / n, y: ny / n }, lives: livesLeft });
    this.ship.damage(v2(nx / n, ny / n));
    if (livesLeft <= 0) this._onLivesZero(); // ST-453 (E64)
  }

  /** ST-055: spawn the Monolith on every multiple of everyWave, in addition to wave content.
   * No-op on other waves or while a boss is alive. Spawns at the rim, re-rolled if too close to the ship. */
  spawnBossForWave(wave) {
    const b = this.cfg.boss;
    if (this.mode === 'campaign') return; // ST-453 (E64): campaign bosses come from level ends only (per-wave = endless)
    if (wave % b.everyWave !== 0 || this.boss) return;
    // ST-143: alternate the variant by boss-spawn count (0 = Monolith, 1 = Splicer, ...)
    const useSplicer = this.bossSpawnCount % 2 === 1;
    const rad = useSplicer ? this.cfg.splicer.radius : b.radius;
    const R = this.cfg.arena.radius - rad;
    let pos = null, tries = 0;
    do {
      const a = this.rng.next() * Math.PI * 2;
      pos = v2(Math.cos(a) * R, Math.sin(a) * R);
      tries++;
    } while (Math.hypot(pos.x - this.ship.pos.x, pos.y - this.ship.pos.y) < 10 && tries < 8);
    if (this.mode === 'campaign' && isFinalWave(wave)) { // ST-419: campaign final boss = Monolith Prime
      const mp = this.cfg.stages.monolithPrime;
      const primeCfg = { ...this.cfg, boss: { ...b, splitCount: mp.splitCount,
        burst: { ...b.burst, every: mp.burstEvery }, phase2: { ...b.phase2, hpFrac: mp.phase2 } } };
      this.boss = new Monolith(this.rng, primeCfg, pos, mp.hp);
      this.boss.prime = true; // kind stays 'monolith' -> reuses all Monolith render/sim branches
      this.bossFireTimer = b.fireEvery;
    } else if (useSplicer) {
      this.boss = new Splicer(this.rng, this.cfg, pos, splicerHpForWave(this.cfg, wave)); // ST-143: variant 2
      this.bossFireTimer = this.cfg.splicer.aimEvery; // ST-143: fresh Splicer starts a full aimed interval
    } else {
      this.boss = new Monolith(this.rng, this.cfg, pos, bossHpForWave(this.cfg, wave)); // ST-064: endless-arc HP
      this.bossFireTimer = b.fireEvery; // ST-056: fresh boss starts a full interval
    }
    this._bossPhaseEmitted = false; // ST-133: fresh boss, enrage not yet announced
    this.bossBurstTimer = this.boss.cfg.boss.burst.every; // ST-134 (ST-419: per-boss cfg; no-op except Prime)
    this.bossBursts = 0; // ST-134
    this.bossSpawnCount++; // ST-143
    this.boss.spawnWave = wave; // ST-419: tag every boss (drives warp/victory; unused in endless)
    this.emit('bossSpawn', { pos: { x: pos.x, y: pos.y }, wave, hp: this.boss.maxHp, kind: this.boss.kind }); // ST-135/143
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
    if (boss.isCampaignBoss) { // ST-456 (E64): the weak point takes damage; the armored body clangs
      for (const blt of this.weapons.bullets) {
        if (blt.dead) continue;
        const wp = boss.weak;
        const hitWp = wp.open && Math.hypot(wp.x - blt.pos.x, wp.y - blt.pos.y) < wp.r + blt.radius;
        const hitBody = Math.hypot(boss.pos.x - blt.pos.x, boss.pos.y - blt.pos.y) < boss.radius + blt.radius;
        if (hitWp) { // weak point first so it wins overlaps
          this.onPlayerBulletHit(blt.id);
          if (boss.hit()) this.bossDeath();
        } else if (hitBody) {
          this.onPlayerBulletHit(blt.id); // armored clang - bullet consumed, no HP
        }
      }
      this.weapons.compact();
      return;
    }
    for (const blt of this.weapons.bullets) {
      if (blt.dead) continue;
      if (Math.hypot(boss.pos.x - blt.pos.x, boss.pos.y - blt.pos.y) < boss.radius + blt.radius) {
        this.onPlayerBulletHit(blt.id);
        if (boss.hit()) this.bossDeath();
        else if (boss.phase === 2 && !this._bossPhaseEmitted) { // ST-133: announce the enrage once
          this._bossPhaseEmitted = true;
          this.emit('bossPhase2', { pos: { x: boss.pos.x, y: boss.pos.y }, hpFrac: boss.hpFrac });
        }
      }
    }
    this.weapons.compact();
  }

  /** ST-055: the boss dies - headline score (feeds the combo), splits into M rocks, FX event. */
  bossDeath() {
    const boss = this.boss;
    const px = boss.pos.x, py = boss.pos.y;
    const score = (typeof boss.score === 'number') ? boss.score : this.cfg.boss.score; // ST-143: per-variant
    const split = (typeof boss.splitCount === 'number') ? boss.splitCount : this.cfg.boss.splitCount; // ST-143
    const splitSize = boss.splitSize || 'M'; // ST-143
    const pts = this.scoreKeeper.kill(score, this.time);
    this.emit('kill', { pos: { x: px, y: py }, size: 'boss', points: pts,
      combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier, overdrive: this.powerups.active('overdrive'), boss: true, kind: boss.kind }); // ST-143: variant tag
    this.skill.onEvent('kill', { combo: this.scoreKeeper.combo }); // ST-304 (I329)
    for (let i = 0; i < split; i++) this.field.spawn(splitSize, 1, { x: px, y: py });
    this.emit('bossDeath', { pos: { x: px, y: py }, kind: boss.kind }); // ST-143: variant tag
    this.boss = null;
    this.bossRelease = 1; // ST-241: arm the post-death release decay
    this._campaignAfterBossDeath(boss); // ST-419: campaign stage-end hook (no-op in endless)
  }

  /** ST-419: campaign stage-end hook (mode-gated - endless never runs the stage system). */
  _campaignAfterBossDeath(boss) {
    if (this.mode !== 'campaign') return;
    const w = boss.spawnWave || 0;
    if (w === 0) { // ST-453 (E64): level boss (spawnWave 0) - the level-clear flow
      const ls = this.levelState;
      if (isFinalLevel(ls.level, this.cfg)) { this.victory = true; } // GAME_OVER fires at end of step()
      else {
        ls.phase = "clear";
        this.emit("levelCleared", { level: ls.level, score: this.score });
        this.warp = makeWarp(this.cfg.campaign.warpDuration);
        this.warp.nextLevel = ls.level + 1;
        this.warp.nextStage = ls.level + 1;
        this.emit("warpStart", { toStage: ls.level + 1, level: ls.level + 1 });
      }
      return;
    }
    if (isFinalWave(w)) { this.victory = true; } // GAME_OVER fires at end of step()
    else if (isStageEndWave(w)) {
      this.warp = makeWarp(this.cfg.campaign.warpDuration);
      this.warp.nextStage = stageForWave(w + 1);
      this.emit('warpStart', { toStage: this.warp.nextStage });
    }
  }

  /** ST-453 (E64): (re)start the level machine (campaign only; endless = no-op).
   * ST-457 (E64): `startLevel` = the localStorage-continued level (clamped; endless callers pass 1). */
  _initLevelRun(startLevel = 1) {
    const L = levelCount(this.cfg);
    const s = (Number.isFinite(startLevel) && startLevel >= 1) ? Math.min(L, Math.floor(startLevel)) : 1;
    this.levelState = { level: s, distance: 0, zone: 1, phase: 'zone' };
    this._levelStartScore = this.scoreKeeper.score;
    this._lastZone = 0;
    if (this.mode === 'campaign') {
      this.emit('levelIntro', { level: s, nameKey: levelNameKey(s) });
      this._emitZoneEnter(true);
    }
  }

  /** ST-453 (E64): the zone the ship is in right now (campaign). Sets levelState.zone. */
  _zoneInfo() {
    if (this.mode !== 'campaign') return { zone: 0, row: null };
    const ls = this.levelState;
    const info = zoneAtDistance(ls.level, ls.distance, this.cfg);
    ls.zone = info.zone;
    return { zone: info.zone, row: info.zone >= 1 ? zoneRow(ls.level, info.zone, this.cfg) : null };
  }

  /** ST-453 (E64): is this enemy type in the current zone mix? (endless: always true) */
  _zoneAllows(type) {
    if (this.mode !== 'campaign') return true;
    const row = this._zoneInfo().row;
    return !row || row.enemyMix.indexOf(type) >= 0;
  }

  /** ST-453 (E64): the current zone hazard multiplier for a key (endless: 1, unknown: 1). */
  _hazardRate(key) {
    if (this.mode !== 'campaign') return 1;
    const row = this._zoneInfo().row;
    if (!row) return 1;
    const p = (this.cfg.levels.hazardProfiles || {})[row.hazardProfile] || {};
    return (typeof p[key] === 'number') ? p[key] : 1;
  }

  /** ST-453 (E64): the director wave decision scaled by the zone rock rate. Endless returns the
   * director raw decision untouched; campaign never mutates it (frozen). */
  _decideForWave(wave) {
    const base = this.director.decideForWave(wave, { replayMode: this.replayMode, performance: this.skill.performance });
    if (this.mode !== 'campaign') return base;
    const m = this._hazardRate('rockRate');
    if (m === 1) return base;
    return Object.assign({}, base, { d: base.d * m });
  }

  /** ST-453 (E64): emit zoneEnter for levelState.zone (campaign only). forced bypasses dedupe. */
  _emitZoneEnter(forced) {
    if (this.mode !== 'campaign') return;
    const ls = this.levelState;
    if (ls.zone === this._lastZone && !forced) return;
    const row = zoneRow(ls.level, ls.zone, this.cfg);
    if (!row) return;
    this._lastZone = ls.zone;
    this.emit('zoneEnter', { level: ls.level, zone: ls.zone, nameKey: zoneNameKey(ls.level, ls.zone),
      paletteId: row.paletteId, hazard: row.hazardProfile, mix: row.enemyMix, forced: !!forced });
  }

  /** ST-453 (E64): per-tick level driver - forward distance, zone transitions, boss trigger.
   * Endless: keep rockAllowed true and return (bit-identical to pre-ST-453). */
  _levelStep(dt) {
    if (this.mode !== 'campaign') { this.waves.rockAllowed = true; return; }
    const ls = this.levelState;
    if (ls.phase === 'zone') {
      ls.distance += this.cfg.levels.cruiseSpeed * dt;
      const zd = bossDistance(ls.level, this.cfg);
      if (ls.distance >= zd) {
        ls.distance = zd;
        this._spawnLevelBoss();
      }
    }
    const info = this._zoneInfo();
    this.waves.rockAllowed = !info.row || info.row.enemyMix.indexOf('rock') >= 0;
    if (info.zone !== this._lastZone) this._emitZoneEnter(false);
  }

  /** ST-453 (E64): the level-end boss, rim-spawned (same geometry as the per-wave boss spawn). */
  _spawnLevelBoss() {
    const ls = this.levelState;
    ls.phase = 'boss';
    const kind = bossKind(ls.level, this.cfg);
    const rad = this.cfg.campaignBoss.radius; // ST-456: all level bosses share the monolith footprint
    const R = this.cfg.arena.radius - rad;
    let pos = null, tries = 0;
    do {
      const a = this.rng.next() * Math.PI * 2;
      pos = v2(Math.cos(a) * R, Math.sin(a) * R);
      tries++;
    } while (Math.hypot(pos.x - this.ship.pos.x, pos.y - this.ship.pos.y) < 10 && tries < 8);
    // ST-456 (E64): every level boss is the CampaignBoss (weak point + phases + posture).
    // kind stays canonical ('monolith'/'splicer') so render/strings paths are untouched;
    // tint picks the per-level identity (L3 'prime' = gold monolith).
    const tint = (kind === 'splicer') ? 'splicer' : (kind === 'monolith-prime') ? 'prime' : 'monolith';
    this.boss = new CampaignBoss(this.rng, this.cfg, pos, ls.level, tint);
    this._bossPhaseEmitted = false;
    this.bossBurstTimer = this.boss.cfg.boss.burst.every;
    this.bossBursts = 0;
    this.bossSpawnCount++;
    this.boss.spawnWave = 0; // ST-453: 0 tags a level boss (the campaign hook reads levelState)
    this.emit('bossSpawn', { pos: { x: pos.x, y: pos.y }, wave: this.wave, hp: this.boss.maxHp, kind: this.boss.kind, level: ls.level });
    this.emit('levelBoss', { level: ls.level, kind: this.boss.kind });
  }

  /** ST-453 (E64): Ikaruga F6 checkpoint continue - on death the run continues at the level-start
   * checkpoint (lives restored, field cleared, score back to the snapshot). True if it fired. */
  _continueAtCheckpoint() {
    if (this.mode !== 'campaign') return false;
    const ls = this.levelState;
    ls.distance = 0; ls.zone = 1; ls.phase = 'zone';
    this._lastZone = 0;
    this.livesMgr.reset();
    this.scoreKeeper.onDamage();
    this.scoreKeeper.score = this._levelStartScore; // ST-453: back to the level-start snapshot
    this.ship = new Ship(0, 0, this.cfg);
    this.weapons.clear();
    this.field.clear();
    this.mines.clear();
    this.drones.clear();
    this.stingers.clear();
    this.flyers.clear();
    this.hunters.clear();
    this.gunships.clear();
    this.sentries.clear();
    this.wasps.clear();
    this.pods.clear();
    this.enemyBullets.clear();
    this.boss = null;
    this.warden = null;
    this.bossRelease = 0;
    this.bossFireTimer = this.cfg.boss.fireEvery;
    this._bossPhaseEmitted = false;
    this.bossBurstTimer = this.cfg.boss.burst.every;
    this.bossBursts = 0;
    this.powerups.clear();
    this.vortex.reset();
    this.waves.toSpawn = 0; // ST-453: waves resume the current cycle (wave number persists)
    this.waves.state = 'intermission';
    this.waves.intermission = this.waves.intermissionFor(this.waves.wave + 1);
    this.waves.waveElapsed = 0;
    this.waves.rockAllowed = true;
    this.emit('checkpoint', { level: ls.level, score: this._levelStartScore, reason: 'continue' });
    this._emitZoneEnter(true);
    return true;
  }

  /** ST-453 (E64): lives hit zero - campaign continues at the checkpoint, endless = classic game over. */
  _onLivesZero() {
    if (this._continueAtCheckpoint()) return;
    this.game.to(STATE.GAME_OVER);
    this.emit('gameover', { score: this.score });
  }

  /** ST-055: the boss touching the ship costs a life (same flow as a rock hit). The boss survives. */
  resolveShipBoss() {
    if (this.ship.isInvulnerable || this.lives <= 0) return;
    const boss = this.boss;
    if (!boss || !boss.alive) return;
    if (Math.hypot(boss.pos.x - this.ship.pos.x, boss.pos.y - this.ship.pos.y) < boss.radius + this.cfg.ship.radius) {
      const livesLeft = this.shipDamage();
      this.scoreKeeper.onDamage();
      const nx = (this.ship.pos.x - boss.pos.x), ny = (this.ship.pos.y - boss.pos.y);
      const n = Math.hypot(nx, ny) || 1;
      this.emit('hit', { pos: { x: this.ship.pos.x, y: this.ship.pos.y }, knock: { x: nx / n, y: ny / n }, lives: livesLeft });
      this.ship.damage(v2(nx / n, ny / n));
      if (livesLeft <= 0) this._onLivesZero(); // ST-453 (E64)
    }
  }
  /** ST-056: fire an enemy bolt from fromPos aimed at the ship's current position. */
  fireAimedBolt(fromPos, speed) {
    const dx = this.ship.pos.x - fromPos.x, dy = this.ship.pos.y - fromPos.y;
    const d = Math.hypot(dx, dy) || 1;
    return this.enemyBullets.fire(fromPos, { x: dx / d, y: dy / d }, speed);
  }

  /** ST-134: radial bolt burst - `count` undestroyable bolts evenly on a circle,
   * rotated by offsetSpin per volley (spiral drift); the pool cap may trim a volley. */
  bossBurst() {
    const b = this.cfg.boss.burst;
    const vecs = bossBurstVectors(this.cfg, this.bossBursts * b.offsetSpin);
    let fired = 0;
    for (const v of vecs) {
      if (this.enemyBullets.fire(this.boss.pos, { x: v.x / b.speed, y: v.y / b.speed }, b.speed)) fired++;
    }
    this.bossBursts++;
    this.emit('bossBurst', { pos: { x: this.boss.pos.x, y: this.boss.pos.y }, fired });
  }

  /** ST-143: the Splicer's spiral bolts - undestroyable, fired from the boss pos along
   * each queued unit direction (the pool cap may trim a shot). No FX event per shot:
   * it is a continuous stream and the bolts render on their own. */
  bossSpiralBolts(bolts) {
    const s = this.cfg.splicer;
    for (const d of bolts) {
      this.enemyBullets.fire(this.boss.pos, { x: d.x, y: d.y }, s.boltSpeed);
    }
  }

  /** ST-133/143: aimed-bolt cadence - per-variant, with the enrage multiplier. */
  bossAimEvery() {
    if (this.boss.kind === 'splicer') {
      const s = this.cfg.splicer;
      return s.aimEvery * (this.boss.phase === 2 ? s.phase2.aimEveryMult : 1);
    }
    const b = this.cfg.boss;
    return b.fireEvery * (this.boss.phase === 2 ? b.phase2.ringEveryMult : 1);
  }

  /** ST-136: the WARDEN spawns on 5th waves where the Monolith did not (a
   * previous Monolith is still alive) - that wave's heavyweight is the drone.
   * No-op on other waves, while a Monolith is alive, or while one is live. */
  spawnWardenForWave(wave) {
    const w = this.cfg.warden;
    if (this.mode === 'campaign') return; // ST-453 (E64): the warden is a per-wave boss byproduct (endless only)
    const b = this.cfg.boss;
    if (wave % b.everyWave !== 0 || this.boss || this.warden) return;
    const R = this.cfg.arena.radius - w.radius;
    let pos = null, tries = 0;
    do {
      const a = this.rng.next() * Math.PI * 2;
      pos = v2(Math.cos(a) * R, Math.sin(a) * R);
      tries++;
    } while (Math.hypot(pos.x - this.ship.pos.x, pos.y - this.ship.pos.y) < 10 && tries < 8);
    this.warden = new Warden(this.rng, this.cfg, pos);
    this.emit('wardenSpawn', { pos: { x: pos.x, y: pos.y }, wave, hp: this.warden.maxHp });
  }

  /** ST-136: bullets damage the WARDEN (armor first); armor pings emit 'wardenArmor'. */
  resolveBulletWarden() {
    const wd = this.warden;
    if (!wd || !wd.alive) return;
    for (const blt of this.weapons.bullets) {
      if (blt.dead) continue;
      if (Math.hypot(wd.pos.x - blt.pos.x, wd.pos.y - blt.pos.y) < wd.radius + blt.radius) {
        this.onPlayerBulletHit(blt.id);
        const r = wd.hit();
        if (r.killed) this.wardenDeath();
        else if (r.absorbed) this.emit('wardenArmor', { pos: { x: wd.pos.x, y: wd.pos.y }, armor: wd.armor });
      }
    }
    this.weapons.compact();
  }

  /** ST-136: the WARDEN dies - score (feeds the combo), splits into S rocks, FX event. */
  wardenDeath() {
    const w = this.cfg.warden;
    const px = this.warden.pos.x, py = this.warden.pos.y;
    const pts = this.scoreKeeper.kill(w.score, this.time);
    this.emit('kill', { pos: { x: px, y: py }, size: 'warden', points: pts,
      combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier, overdrive: this.powerups.active('overdrive') });
    for (let i = 0; i < w.splitCount; i++) this.field.spawn('S', 1, { x: px, y: py });
    this.emit('wardenDeath', { pos: { x: px, y: py } });
    this.warden = null;
  }

  /** ST-136: the WARDEN touching the ship costs a life (same flow as a boss hit). The drone survives. */
  resolveShipWarden() {
    if (this.ship.isInvulnerable || this.lives <= 0) return;
    const wd = this.warden;
    if (!wd || !wd.alive) return;
    if (Math.hypot(wd.pos.x - this.ship.pos.x, wd.pos.y - this.ship.pos.y) < wd.radius + this.cfg.ship.radius) {
      const livesLeft = this.shipDamage();
      this.scoreKeeper.onDamage();
      const nx = (this.ship.pos.x - wd.pos.x), ny = (this.ship.pos.y - wd.pos.y);
      const n = Math.hypot(nx, ny) || 1;
      this.emit('hit', { pos: { x: this.ship.pos.x, y: this.ship.pos.y }, knock: { x: nx / n, y: ny / n }, lives: livesLeft });
      this.ship.damage(v2(nx / n, ny / n));
      if (livesLeft <= 0) this._onLivesZero(); // ST-453 (E64)
    }
  }

  /** ST-056: a bolt touching the ship costs a life (same flow as rock contact). */
  resolveShipEnemyBullets() {
    if (this.ship.isInvulnerable || this.lives <= 0) return;
    for (const b of this.enemyBullets.bullets) {
      if (b.dead) continue;
      if (Math.hypot(b.pos.x - this.ship.pos.x, b.pos.y - this.ship.pos.y) < b.radius + this.cfg.ship.radius) {
        b.dead = true;
        this.enemyBullets.compact();
        const livesLeft = this.shipDamage();
        this.scoreKeeper.onDamage();
        const nx = (this.ship.pos.x - b.pos.x), ny = (this.ship.pos.y - b.pos.y);
        const n = Math.hypot(nx, ny) || 1;
        this.emit('hit', { pos: { x: this.ship.pos.x, y: this.ship.pos.y }, knock: { x: nx / n, y: ny / n }, lives: livesLeft });
        this.ship.damage(v2(nx / n, ny / n));
        if (livesLeft <= 0) this._onLivesZero(); // ST-453 (E64)
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
        this.skill.onEvent('graze'); // ST-304 (I329)
      } else if (r.nearHot && d > nm.radius * nm.rearmMult) {
        r.nearHot = false;
      }
    }
  }

  /** ST-117: spawn the wave's homing drones once eligible (wave >= firstWave). */
  spawnDronesForWave(wave) {
    const d = this.cfg.drone;
    if (wave < d.firstWave) return;
    if (!this._zoneAllows("drone")) return; // ST-453 (E64): zone mix gate
    const n = Math.max(0, Math.round(d.perWave * this._hazardRate("enemyRate"))); // ST-453 (E64)
    for (let i = 0; i < n; i++) this.drones.spawn(this.ship.pos);
  }

  /** ST-117: bullets destroy drones (1 hit). Each drone kill feeds the combo. */
  resolveBulletDrones() {
    for (const b of this.weapons.bullets) {
      if (b.dead) continue;
      const hit = this.drones.drones.find(dm => !dm.dead &&
        Math.hypot(dm.pos.x - b.pos.x, dm.pos.y - b.pos.y) < dm.radius + b.radius);
      if (!hit) continue;
      this.onPlayerBulletHit(b.id);
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
    const livesLeft = this.shipDamage();
    this.scoreKeeper.onDamage();
    const nx = (this.ship.pos.x - hit.pos.x), ny = (this.ship.pos.y - hit.pos.y);
    const n = Math.hypot(nx, ny) || 1;
    this.emit('hit', { pos: { x: this.ship.pos.x, y: this.ship.pos.y }, knock: { x: nx / n, y: ny / n }, lives: livesLeft });
    this.ship.damage(v2(nx / n, ny / n));
    if (livesLeft <= 0) this._onLivesZero(); // ST-453 (E64)
  }


  /** ST-229: spawn the wave's stingers once eligible (wave >= firstWave). The first
   * spawn of a run emits 'stingerSpawn' (the main.js "STINGER INBOUND" toast). */
  spawnStingersForWave(wave) {
    const s = this.cfg.stinger;
    if (wave < s.firstWave) return;
    if (!this._zoneAllows("stinger")) return; // ST-453 (E64): zone mix gate
    const n = Math.max(0, Math.round(s.perWave * this._hazardRate("enemyRate"))); // ST-453 (E64)
    for (let i = 0; i < n; i++) {
      const st = this.stingers.spawn(this.ship.pos);
      if (st && !this._stingerToasted) {
        this._stingerToasted = true;
        this.emit('stingerSpawn', { pos: { x: st.pos.x, y: st.pos.y }, wave });
      }
    }
  }

  /** ST-229: bullets destroy stingers (1 hit). Each kill pays +250 and feeds the combo. */
  resolveBulletStingers() {
    for (const b of this.weapons.bullets) {
      if (b.dead) continue;
      const hit = this.stingers.stingers.find(sm => !sm.dead &&
        Math.hypot(sm.pos.x - b.pos.x, sm.pos.y - b.pos.y) < sm.radius + b.radius);
      if (!hit) continue;
      this.onPlayerBulletHit(b.id);
      this.stingers.destroy(hit.id);
      const points = this.scoreKeeper.kill(this.cfg.stinger.score, this.time);
      this.emit('kill', { pos: { x: hit.pos.x, y: hit.pos.y }, size: 'stinger', points,
        combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier, overdrive: this.powerups.active('overdrive'), stinger: true });
      this.emit('stingerDeath', { pos: { x: hit.pos.x, y: hit.pos.y } });
    }
    this.weapons.compact();
  }

  /** ST-232: spawn the wave flyers once eligible (wave >= firstWave). The first
   * spawn of a run emits flyerSpawn (the main.js "FLYER INBOUND" toast). */
  spawnFlyersForWave(wave) {
    const s = this.cfg.flyer;
    if (wave < s.firstWave) return;
    if (!this._zoneAllows("flyer")) return; // ST-453 (E64): zone mix gate
    const n = Math.max(0, Math.round(s.perWave * this._hazardRate("enemyRate"))); // ST-453 (E64)
    for (let i = 0; i < n; i++) {
      const fl = this.flyers.spawn(this.ship.pos);
      if (fl && !this._flyerToasted) {
        this._flyerToasted = true;
        this.emit('flyerSpawn', { pos: { x: fl.pos.x, y: fl.pos.y }, wave });
      }
    }
  }

  /** ST-232: bullets damage flyers (2 hits). The kill pays +400 and feeds the combo.
   * Hit/exit events are drained in step() - emit kills here only. */
  resolveBulletFlyers() {
    for (const b of this.weapons.bullets) {
      if (b.dead) continue;
      const hit = this.flyers.flyers.find(fm => !fm.dead &&
        Math.hypot(fm.pos.x - b.pos.x, fm.pos.y - b.pos.y) < fm.radius + b.radius);
      if (!hit) continue;
      this.onPlayerBulletHit(b.id);
      const fl = this.flyers.hit(hit.id);
      for (const fe of this.flyers.drainEvents()) { // ST-232: hit events reach the world immediately (exits drain in step)
        const p = { x: fe.pos.x, y: fe.pos.y };
        this.emit(fe.kind === 'hit' ? 'flyerHit' : 'flyerExit', { pos: p });
      }
      if (fl.dead) {
        const points = this.scoreKeeper.kill(this.cfg.flyer.score, this.time);
        this.emit('kill', { pos: { x: fl.pos.x, y: fl.pos.y }, size: 'flyer', points,
          combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier, overdrive: this.powerups.active('overdrive'), flyer: true });
        this.emit('flyerDeath', { pos: { x: fl.pos.x, y: fl.pos.y } });
      }
    }
    this.weapons.compact();
  }
  /** ST-229: a stinger touching the ship costs a life (NO score) and is lost. */
  resolveShipStingers() {
    if (this.ship.isInvulnerable || this.lives <= 0) return;
    const hit = this.stingers.stingers.find(sm => !sm.dead &&
      Math.hypot(sm.pos.x - this.ship.pos.x, sm.pos.y - this.ship.pos.y) < sm.radius + this.cfg.ship.radius);
    if (!hit) return;
    this.stingers.destroy(hit.id);
    this.emit('stingerDeath', { pos: { x: hit.pos.x, y: hit.pos.y } });
    const livesLeft = this.shipDamage();
    this.scoreKeeper.onDamage();
    const nx = (this.ship.pos.x - hit.pos.x), ny = (this.ship.pos.y - hit.pos.y);
    const n = Math.hypot(nx, ny) || 1;
    this.emit('hit', { pos: { x: this.ship.pos.x, y: this.ship.pos.y }, knock: { x: nx / n, y: ny / n }, lives: livesLeft });
    this.ship.damage(v2(nx / n, ny / n));
    if (livesLeft <= 0) this._onLivesZero(); // ST-453 (E64)
  }
  /** ST-418: spawn the wave's hunters once eligible (wave >= firstWave). The first spawn of a
   * run emits 'hunterSpawn' (the main.js "HUNTER BEHIND YOU" toast). */
  spawnHunterForWave(wave) {
    const s = this.cfg.hunter;
    if (wave < s.firstWave) return;
    if (!this._zoneAllows("hunter")) return; // ST-453 (E64): zone mix gate
    const n = Math.max(0, Math.round(s.perWave * this._hazardRate("enemyRate"))); // ST-453 (E64)
    for (let i = 0; i < n; i++) {
      const h = this.hunters.spawn(this.ship.pos);
      if (h && !this._hunterToasted) {
        this._hunterToasted = true;
        this.emit('hunterSpawn', { pos: { x: h.pos.x, y: h.pos.y }, wave });
      }
    }
  }

  /** ST-418: bullets destroy hunters (1 hit). Each kill pays +300 and feeds the combo. */
  resolveBulletHunters() {
    for (const b of this.weapons.bullets) {
      if (b.dead) continue;
      const hit = this.hunters.hunters.find(hm => !hm.dead &&
        Math.hypot(hm.pos.x - b.pos.x, hm.pos.y - b.pos.y) < hm.radius + b.radius);
      if (!hit) continue;
      this.onPlayerBulletHit(b.id);
      this.hunters.destroy(hit.id);
      const points = this.scoreKeeper.kill(this.cfg.hunter.score, this.time);
      this.emit('kill', { pos: { x: hit.pos.x, y: hit.pos.y }, size: 'hunter', points,
        combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier, overdrive: this.powerups.active('overdrive'), hunter: true });
      this.emit('hunterDeath', { pos: { x: hit.pos.x, y: hit.pos.y } });
    }
    this.weapons.compact();
  }

  /** ST-418: a hunter touching the ship costs a life (NO score) and is lost. */
  resolveShipHunters() {
    if (this.ship.isInvulnerable || this.lives <= 0) return;
    const hit = this.hunters.hunters.find(hm => !hm.dead &&
      Math.hypot(hm.pos.x - this.ship.pos.x, hm.pos.y - this.ship.pos.y) < hm.radius + this.cfg.ship.radius);
    if (!hit) return;
    this.hunters.destroy(hit.id);
    this.emit('hunterDeath', { pos: { x: hit.pos.x, y: hit.pos.y } });
    const livesLeft = this.shipDamage();
    this.scoreKeeper.onDamage();
    const nx = this.ship.pos.x - hit.pos.x, ny = this.ship.pos.y - hit.pos.y, n = Math.hypot(nx, ny) || 1;
    this.emit('hit', { pos: { x: this.ship.pos.x, y: this.ship.pos.y }, knock: { x: nx / n, y: ny / n }, lives: livesLeft });
    this.ship.damage(v2(nx / n, ny / n));
    if (livesLeft <= 0) this._onLivesZero(); // ST-453 (E64)
  }

  /** ST-418: spawn the wave's gunships once eligible (wave >= firstWave). The first spawn of a
   * run emits 'gunshipSpawn' (the main.js "GUNSHIP INBOUND" toast). */
  spawnGunshipForWave(wave) {
    const s = this.cfg.gunship;
    if (wave < s.firstWave) return;
    if (!this._zoneAllows("gunship")) return; // ST-453 (E64): zone mix gate
    const n = Math.max(0, Math.round(s.perWave * this._hazardRate("enemyRate"))); // ST-453 (E64)
    for (let i = 0; i < n; i++) {
      const g = this.gunships.spawn(this.ship.pos);
      if (g && !this._gunshipToasted) {
        this._gunshipToasted = true;
        this.emit('gunshipSpawn', { pos: { x: g.pos.x, y: g.pos.y }, wave });
      }
    }
  }

  /** ST-418: bullets damage gunships (hp hits). The kill pays +600 and feeds the combo. */
  resolveBulletGunships() {
    for (const b of this.weapons.bullets) {
      if (b.dead) continue;
      const hit = this.gunships.gunships.find(gm => !gm.dead &&
        Math.hypot(gm.pos.x - b.pos.x, gm.pos.y - b.pos.y) < gm.radius + b.radius);
      if (!hit) continue;
      this.onPlayerBulletHit(b.id);
      const g = this.gunships.hit(hit.id);
      for (const ge of this.gunships.drainEvents()) { // hit/kill events reach the world immediately
        const p = { x: ge.pos.x, y: ge.pos.y };
        this.emit(ge.kind === 'hit' ? 'gunshipHit' : ge.kind, { pos: p, self: ge.self });
      }
      if (g.dead) {
        const points = this.scoreKeeper.kill(this.cfg.gunship.score, this.time);
        this.emit('kill', { pos: { x: g.pos.x, y: g.pos.y }, size: 'gunship', points,
          combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier, overdrive: this.powerups.active('overdrive'), gunship: true });
        this.emit('gunshipDeath', { pos: { x: g.pos.x, y: g.pos.y }, self: false });
      }
    }
    this.weapons.compact();
  }

  /** ST-418: a gunship touching the ship costs a life (NO score) and is lost. */
  resolveShipGunships() {
    if (this.ship.isInvulnerable || this.lives <= 0) return;
    const hit = this.gunships.gunships.find(gm => !gm.dead &&
      Math.hypot(gm.pos.x - this.ship.pos.x, gm.pos.y - this.ship.pos.y) < gm.radius + this.cfg.ship.radius);
    if (!hit) return;
    this.gunships.destroy(hit.id);
    this.emit('gunshipDeath', { pos: { x: hit.pos.x, y: hit.pos.y }, self: false });
    const livesLeft = this.shipDamage();
    this.scoreKeeper.onDamage();
    const nx = this.ship.pos.x - hit.pos.x, ny = this.ship.pos.y - hit.pos.y, n = Math.hypot(nx, ny) || 1;
    this.emit('hit', { pos: { x: this.ship.pos.x, y: this.ship.pos.y }, knock: { x: nx / n, y: ny / n }, lives: livesLeft });
    this.ship.damage(v2(nx / n, ny / n));
    if (livesLeft <= 0) this._onLivesZero(); // ST-453 (E64)
  }

  /** ST-448: spawn the wave's sentries once eligible (wave >= 11, never boss waves -
   * the existing boss-wave predicate is reused). The first spawn of a run emits
   * 'sentrySpawn' (the main.js "SENTRY ON STATION" toast). */
  spawnSentryForWave(wave) {
    const s = this.cfg.sentry;
    if (wave < s.firstWave || wave % this.cfg.boss.everyWave === 0) return;
    if (!this._zoneAllows("sentry")) return; // ST-453 (E64): zone mix gate
    const n = Math.max(0, Math.round(s.perWave * this._hazardRate("enemyRate"))); // ST-453 (E64)
    for (let i = 0; i < n; i++) {
      const q = this.sentries.spawn(this.ship.pos);
      if (q && !this._sentryToasted) {
        this._sentryToasted = true;
        this.emit('sentrySpawn', { pos: { x: q.pos.x, y: q.pos.y }, wave });
      }
    }
  }

  /** ST-448: spawn the wave's wasp V-pack once eligible (wave >= 12, never boss waves).
   * The first pack of a run emits 'waspSpawn' (the main.js "WASPS INBOUND" toast). */
  spawnWaspForWave(wave) {
    const s = this.cfg.wasp;
    if (wave < s.firstWave || wave % this.cfg.boss.everyWave === 0) return;
    if (!this._zoneAllows("wasp")) return; // ST-453 (E64): pack gate (single spawn, no count)
    const pack = this.wasps.spawn(this.ship.pos);
    if (pack && !this._waspToasted) {
      this._waspToasted = true;
      this.emit('waspSpawn', { pos: { x: pack[1].pos.x, y: pack[1].pos.y }, wave });
    }
  }

  /** ST-448: spawn the wave's pods once eligible (wave >= 13, never boss waves).
   * The first spawn of a run emits 'podSpawn' (the main.js "POD DRIFTING" toast). */
  spawnPodForWave(wave) {
    const s = this.cfg.pod;
    if (wave < s.firstWave || wave % this.cfg.boss.everyWave === 0) return;
    if (!this._zoneAllows("pod")) return; // ST-453 (E64): zone mix gate
    const n = Math.max(0, Math.round(s.perWave * this._hazardRate("enemyRate"))); // ST-453 (E64)
    for (let i = 0; i < n; i++) {
      const q = this.pods.spawn(this.ship.pos);
      if (q && !this._podToasted) {
        this._podToasted = true;
        this.emit('podSpawn', { pos: { x: q.pos.x, y: q.pos.y }, wave });
      }
    }
  }

  /** ST-448: bullets damage sentries (3 hits). The kill pays +350 and feeds the combo. */
  resolveBulletSentries() {
    for (const b of this.weapons.bullets) {
      if (b.dead) continue;
      const hit = this.sentries.sentries.find(qm => !qm.dead &&
        Math.hypot(qm.pos.x - b.pos.x, qm.pos.y - b.pos.y) < qm.radius + b.radius);
      if (!hit) continue;
      this.onPlayerBulletHit(b.id);
      const q = this.sentries.hit(hit.id);
      for (const ge of this.sentries.drainEvents()) { // hit events reach the world immediately
        const p = { x: ge.pos.x, y: ge.pos.y };
        this.emit('sentryHit', { pos: p });
      }
      if (q.dead) {
        const points = this.scoreKeeper.kill(this.cfg.sentry.score, this.time);
        this.emit('kill', { pos: { x: q.pos.x, y: q.pos.y }, size: 'sentry', points,
          combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier, overdrive: this.powerups.active('overdrive'), sentry: true });
        this.emit('sentryDeath', { pos: { x: q.pos.x, y: q.pos.y }, self: false });
      }
    }
    this.weapons.compact();
  }

  /** ST-448: bullets destroy wasps (1 hit). Each kill pays +100 and feeds the combo. */
  resolveBulletWasps() {
    for (const b of this.weapons.bullets) {
      if (b.dead) continue;
      const hit = this.wasps.wasps.find(wm => !wm.dead &&
        Math.hypot(wm.pos.x - b.pos.x, wm.pos.y - b.pos.y) < wm.radius + b.radius);
      if (!hit) continue;
      this.onPlayerBulletHit(b.id);
      this.wasps.destroy(hit.id);
      const points = this.scoreKeeper.kill(this.cfg.wasp.score, this.time);
      this.emit('kill', { pos: { x: hit.pos.x, y: hit.pos.y }, size: 'wasp', points,
        combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier, overdrive: this.powerups.active('overdrive'), wasp: true });
      this.emit('waspDeath', { pos: { x: hit.pos.x, y: hit.pos.y }, self: false });
    }
    this.weapons.compact();
  }

  /** ST-448: bullets damage pods (4 hits). A lethal hit splits the pod into 2 WASP
   * corkscrews - driven EXACTLY ONCE from the pod's death event - and pays +300. */
  resolveBulletPods() {
    for (const b of this.weapons.bullets) {
      if (b.dead) continue;
      const hit = this.pods.pods.find(pm => !pm.dead &&
        Math.hypot(pm.pos.x - b.pos.x, pm.pos.y - b.pos.y) < pm.radius + b.radius);
      if (!hit) continue;
      this.onPlayerBulletHit(b.id);
      const q = this.pods.hit(hit.id);
      for (const pe of this.pods.drainEvents()) { // hit + lethal-death (split) events reach the world immediately
        const p = { x: pe.pos.x, y: pe.pos.y };
        if (pe.kind === 'hit') this.emit('podHit', { pos: p });
        else if (pe.kind === 'death') {
          for (let i = 0; i < this.cfg.pod.splitCount; i++) this.wasps.spawnAt(q.pos, true); // split children (ungated, rim-clamped, excluded from the non-split cap)
          const points = this.scoreKeeper.kill(this.cfg.pod.score, this.time);
          this.emit('kill', { pos: { x: q.pos.x, y: q.pos.y }, size: 'pod', points,
            combo: this.scoreKeeper.combo, multiplier: this.scoreKeeper.multiplier, overdrive: this.powerups.active('overdrive'), pod: true });
          this.emit('podDeath', { pos: { x: q.pos.x, y: q.pos.y }, self: false, split: true });
        }
      }
    }
    this.weapons.compact();
  }

  /** ST-448: a sentry touching the ship costs a life (NO score) and is lost. */
  resolveShipSentries() {
    if (this.ship.isInvulnerable || this.lives <= 0) return;
    const hit = this.sentries.sentries.find(qm => !qm.dead &&
      Math.hypot(qm.pos.x - this.ship.pos.x, qm.pos.y - this.ship.pos.y) < qm.radius + this.cfg.ship.radius);
    if (!hit) return;
    this.sentries.destroy(hit.id);
    this.emit('sentryDeath', { pos: { x: hit.pos.x, y: hit.pos.y }, self: false });
    const livesLeft = this.shipDamage();
    this.scoreKeeper.onDamage();
    const nx = this.ship.pos.x - hit.pos.x, ny = this.ship.pos.y - hit.pos.y, n = Math.hypot(nx, ny) || 1;
    this.emit('hit', { pos: { x: this.ship.pos.x, y: this.ship.pos.y }, knock: { x: nx / n, y: ny / n }, lives: livesLeft });
    this.ship.damage(v2(nx / n, ny / n));
    if (livesLeft <= 0) this._onLivesZero(); // ST-453 (E64)
  }

  /** ST-448: a wasp touching the ship costs a life (NO score) and is lost. */
  resolveShipWasps() {
    if (this.ship.isInvulnerable || this.lives <= 0) return;
    const hit = this.wasps.wasps.find(wm => !wm.dead &&
      Math.hypot(wm.pos.x - this.ship.pos.x, wm.pos.y - this.ship.pos.y) < wm.radius + this.cfg.ship.radius);
    if (!hit) return;
    this.wasps.destroy(hit.id);
    this.emit('waspDeath', { pos: { x: hit.pos.x, y: hit.pos.y }, self: false });
    const livesLeft = this.shipDamage();
    this.scoreKeeper.onDamage();
    const nx = this.ship.pos.x - hit.pos.x, ny = this.ship.pos.y - hit.pos.y, n = Math.hypot(nx, ny) || 1;
    this.emit('hit', { pos: { x: this.ship.pos.x, y: this.ship.pos.y }, knock: { x: nx / n, y: ny / n }, lives: livesLeft });
    this.ship.damage(v2(nx / n, ny / n));
    if (livesLeft <= 0) this._onLivesZero(); // ST-453 (E64)
  }

  /** ST-448: a pod touching the ship costs a life (NO score) and is lost. */
  resolveShipPods() {
    if (this.ship.isInvulnerable || this.lives <= 0) return;
    const hit = this.pods.pods.find(pm => !pm.dead &&
      Math.hypot(pm.pos.x - this.ship.pos.x, pm.pos.y - this.ship.pos.y) < pm.radius + this.cfg.ship.radius);
    if (!hit) return;
    this.pods.destroy(hit.id);
    this.emit('podDeath', { pos: { x: hit.pos.x, y: hit.pos.y }, self: false });
    const livesLeft = this.shipDamage();
    this.scoreKeeper.onDamage();
    const nx = this.ship.pos.x - hit.pos.x, ny = this.ship.pos.y - hit.pos.y, n = Math.hypot(nx, ny) || 1;
    this.emit('hit', { pos: { x: this.ship.pos.x, y: this.ship.pos.y }, knock: { x: nx / n, y: ny / n }, lives: livesLeft });
    this.ship.damage(v2(nx / n, ny / n));
    if (livesLeft <= 0) this._onLivesZero(); // ST-453 (E64)
  }

  reset() {
    this.warp = null; this.victory = false; this.currentStage = 1; // ST-419: reset campaign state (mode persists via begin)
    this.levelState = { level: 1, distance: 0, zone: 1, phase: 'zone' }; this._levelStartScore = 0; this._lastZone = 0; // ST-453 (E64)
    this.ship = new Ship(0, 0, this.cfg);
    this.weapons.clear();
    this.field.clear();
    this.mines.clear();
    this.drones.clear(); // ST-117
    this.stingers.clear(); // ST-229
    this.flyers.clear(); // ST-232
    this._stingerToasted = false; // ST-229: re-arm the run's first-spawn callout
    this._flyerToasted = false; // ST-232: re-arm the run's first-spawn callout
    this.hunters.clear(); // ST-418
    this.gunships.clear(); // ST-418
    this._hunterToasted = false; // ST-418
    this._gunshipToasted = false; // ST-418
    this.sentries.clear(); // ST-448
    this.wasps.clear(); // ST-448
    this.pods.clear(); // ST-448
    this._sentryToasted = false; // ST-448
    this._waspToasted = false; // ST-448
    this._podToasted = false; // ST-448
    this.boss = null; // ST-055
    this.bossRelease = 0; // ST-241
    this.warden = null; // ST-136
    this.enemyBullets.clear(); // ST-056
    this.vortex.reset(); // ST-059
    this.bossFireTimer = this.cfg.boss.fireEvery; // ST-056
    this._bossPhaseEmitted = false; // ST-133
    this.bossBurstTimer = this.cfg.boss.burst.every; // ST-134
    this.bossBursts = 0; // ST-134
    this.bossSpawnCount = 0; // ST-143
    this.scoreKeeper.reset();
    this.waves.reset();
    this.skill.reset(); // ST-304 (I329)
    this.director.reset(); // ST-304 (I329)
    this.enemyBullets.speedMul = 1; // ST-304 (I329)
    this.powerups.clear();
    this.livesMgr.reset();
    this.game.reset(); // also clears the gameOver getter (it derives from game state)
    this.time = 0;
    this.replayMode = false; // ST-190
    this._wlevel = 1; // ST-122: weapon level resets with the run
    this.events.length = 0;
    this._eventSpare.length = 0; // ST-074: spare buffer too (no stale events after swap)
  }
}





