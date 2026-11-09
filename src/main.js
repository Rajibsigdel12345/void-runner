// Void Runner - boot (I12: World orchestrator drives ship/weapons/asteroids/collisions)
import * as THREE from 'three';
import { createStarfield } from './render/starfield.js';
import { createShipMesh } from './render/shipMesh.js';
import { createInput } from './render/input.js';
import { createBulletPool } from './render/bulletPool.js';
import { createAsteroidRenderer } from './render/asteroidRenderer.js';
import { createMineRenderer } from './render/mineMesh.js';
import { createBossMesh } from './render/bossMesh.js';
import { createBossHealth } from './render/bossHealth.js';
import { createEnemyBulletRenderer } from './render/enemyBulletMesh.js';
import { createPowerupRenderer } from './render/powerupMesh.js';
import { createShieldRing } from './render/shieldRing.js';
import { createVortexFx } from './render/vortexFx.js'; // ST-059
import { createParticles } from './render/particles.js';
import { createShake, createPunch } from './core/fx.js'; // ST-081
import { createHUD } from './render/hud.js';
import { createReticle } from './render/reticle.js';
import { createScreens } from './render/screens.js';
import { createSettingsPanel } from './render/settingsPanel.js';
import { createAudio } from './render/audio.js';
import { createWaveBanner } from './render/waveBanner.js';
import { createScorePopups } from './render/scorePopups.js';
import { createTutorialHint } from './render/tutorialHint.js';
import { createBloom } from './render/bloom.js';
import { createFpsMeter } from './render/fpsMeter.js';
import { createDebugOverlay } from './render/debugOverlay.js'; // ST-080
import { createAdaptiveQuality } from './core/adaptiveQuality.js'; // ST-073
import { createClock } from './core/clock.js'; // ST-078
import { STATE } from './core/state.js';
import { Storage } from './core/storage.js';
import { CONFIG } from './core/config.js';
import { World } from './core/game.js';
import { RNG } from './core/rng.js';
import { damp, v2 } from './core/math.js';

const app = document.getElementById('app');

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// I36: keep per-frame GPU stats across all composer passes (autoReset would zero them per pass)
renderer.info.autoReset = false;
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04060f);
scene.fog = new THREE.Fog(0x04060f, 60, 240);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);

// I35: bloom post-fx - composer path for High quality, direct render for Low (GDD line 74).
const bloom = createBloom(renderer, scene, camera);

// I36: opt-in FPS meter - ?fps=1 (fps + ms) or ?fps=2 (+ draw calls/tris).
const fpsParam = new URLSearchParams(window.location.search).get('fps');
const fpsMeter = fpsParam ? createFpsMeter(fpsParam === '2' ? renderer : null) : null;
if (fpsMeter) fpsMeter.show();
// I80: opt-in debug overlay - ?dbg=1 shows fps/frame-ms, GPU draw calls + tris, live
// entity counts vs pool caps, and the current game state (throttled to ~4 Hz).
const dbgParam = new URLSearchParams(window.location.search).get('dbg');
const debugOverlay = dbgParam === '1' ? createDebugOverlay() : null;
if (debugOverlay) debugOverlay.show();

scene.add(new THREE.HemisphereLight(0x33437a, 0x04060f, 0.55));
scene.add(new THREE.AmbientLight(0x8899ff, 0.35));
const dir = new THREE.DirectionalLight(0xffffff, 1.1);
dir.position.set(6, 12, 4);
scene.add(dir);

const grid = new THREE.PolarGridHelper(26, 12, 8, 64, 0x1b2a55, 0x101a38);
scene.add(grid);

const stars = createStarfield(1337);
scene.add(stars);

// --- gameplay (I12: World orchestrates core; render layer only syncs visuals) ---
// Seed is session-random; the determinism harness (I076) pins seeds explicitly.
const world = new World(new RNG((Date.now() & 0xffff) ^ 0x51ab));
const shipMesh = createShipMesh();
scene.add(shipMesh.group);
const bullets = createBulletPool(scene);
const rockRenders = createAsteroidRenderer(scene);
const mineRenders = createMineRenderer(scene); // ST-054
const bossMesh = createBossMesh(scene); // ST-055
const bossHealth = createBossHealth(document.body); // ST-055
const enemyBulletRenders = createEnemyBulletRenderer(scene); // ST-056
const powerupRenders = createPowerupRenderer(scene);
const shieldRing = createShieldRing(scene);
const vortexFx = createVortexFx(scene, CONFIG.vortex); // ST-059
const banner = createWaveBanner(document.body);
const popups = createScorePopups(document.body, camera); // ST-030
const coarse = (window.matchMedia && window.matchMedia('(pointer:coarse)').matches) || 'ontouchstart' in window; // I71: touch detect (hint + screens)
const hint = createTutorialHint(document.body, { touch: coarse }); // ST-032
const hud = createHUD(document.body);
const reticle = createReticle(scene); // I44: fire-line reticle
let muted = false; // M key (ST-017); consumed by audio (I27)

// Persistent best + settings (ST-018); raw store adapted from window.localStorage.
const lsStore = {
  get: (k) => { try { return window.localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { window.localStorage.setItem(k, v); } catch { /* private mode: session-only */ } },
  remove: (k) => { try { window.localStorage.removeItem(k); } catch { /* ignore */ } },
};
const storage = new Storage(lsStore, CONFIG.storage);
let bestScore = storage.getBest();
let newBest = false;
let scoresText = ''; // I66: top-5 table text for the menu (refreshed at boot + on game over)
let scoreRank = 0; // I69: this run's board rank (shown on game over)
function refreshScoresText() {
  const rows = storage.getHighScores();
  scoresText = rows.map((e, i) => (i + 1) + '. ' + e.score + '    W' + e.wave + '  \u00b7  ' + e.kills).join('\n');
}
refreshScoresText();

// Juice (ST-024): pooled particle bursts, honoring saved FX tier + reduced
// motion (the settings panel lands in I26; values are read at boot).
let fxCount = 0;
let motionOff = false;
let liveSettings = storage.getSettings(); // ST-026: settings panel keeps this fresh (audio consumes in I27)
// Audio (ST-027): WebAudio synth, initialized on first user gesture.
const SFX_CUES = { fire: 'shoot', kill: 'kill', hit: 'hit', powerup: 'powerup', shieldPop: 'shieldPop', bomb: 'bomb', wave: 'wave', waveCleared: 'cleared', gameover: 'gameover', nearmiss: 'swish', mineExplode: 'mine', bossSpawn: 'bossSpawn', bossRing: 'bossRing', bossDeath: 'bossDeath', bossFire: 'bossFire', mineFire: 'mineFire', vortexTelegraph: 'vortexTelegraph', vortexStart: 'vortexStart' }; // ST-059
const audio = createAudio();
audio.setVolume(liveSettings.volume);
audio.setSfx(liveSettings.sfx);
let audioReady = false;
function markAudioReady() {
  if (audioReady) return;
  audioReady = true;
  audio.init();
  audio.setMuted(muted);
}
// I71: responsive UI scale (fontScale x viewport -> --vr-fs); coarse detected above (I71)
function uiVwScale() { return Math.min(1, Math.max(0.6, window.innerWidth / 820)); }
function setUiScale() { document.documentElement.style.setProperty('--vr-fs', String((liveSettings.fontScale || 1) * uiVwScale())); }

function applySettings(s) {
  liveSettings = s;
  fxCount = s.fx === 'low' ? CONFIG.fx.particleLow : CONFIG.fx.particleHigh;
  motionOff = s.reducedMotion === true;
  setUiScale(); // I70+I71: UI scale = fontScale x viewport (cascades to DOM overlays only; canvas unaffected)
  bloom.setEnabled(s.fx === 'high');
  if (audio.state() !== 'uninitialized') { audio.setVolume(s.volume); audio.setSfx(s.sfx); }
}
applySettings(liveSettings);
// ST-073: adaptive quality - rolling FPS below threshold auto-downgrades FX (console log + toast).
const toastEl = document.createElement('div');
toastEl.id = 'adaptive-toast';
toastEl.setAttribute('aria-live', 'polite');
toastEl.style.cssText = 'position:fixed;left:50%;bottom:64px;transform:translateX(-50%);z-index:60;font:calc(12px * var(--vr-fs,1))/1.4 ui-monospace,monospace;letter-spacing:.08em;color:#9fb4d8;background:rgba(4,6,15,0.7);padding:6px 12px;border-radius:4px;pointer-events:none;opacity:0;transition:opacity .25s;';
document.body.appendChild(toastEl);
let toastTimer = 0;
function toast(msg) {
  toastEl.textContent = msg;
  if (motionOff) toastEl.style.transition = 'none'; // reduced motion: no fade
  toastEl.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.style.opacity = '0'; }, 3000);
}
const adaptive = createAdaptiveQuality(CONFIG.adaptive, (info) => {
  if (info.type === 'autoDowngrade') {
    fxCount = CONFIG.fx.particleLow;
    bloom.setEnabled(false);
    console.info('[voidrunner] adaptive quality: FX high -> low (rolling ' + CONFIG.adaptive.windowSec + 's avg ' + Math.round(info.fps) + ' fps < ' + CONFIG.adaptive.thresholdFps + ')');
    toast('FX AUTO-SET TO LOW (LOW FPS)');
  }
});
// ST-026: settings panels (menu + pause) - after storage/applySettings (TDZ order).
let fxPreviewFn = null; // ST-067: live FX preview, wired once particles exist
const menuSettings = createSettingsPanel(storage, applySettings, (tier) => { adaptive.userSet(tier); if (fxPreviewFn) fxPreviewFn(tier); }); // ST-073: user FX choice overrides automation
const pauseSettings = createSettingsPanel(storage, applySettings, (tier) => { adaptive.userSet(tier); if (fxPreviewFn) fxPreviewFn(tier); }); // ST-073
const screens = createScreens(document.body, {
  menu: menuSettings, pause: pauseSettings, touch: coarse, // I71: touch-aware menu
  actions: { // I68: pause overlay actions; I71: start for touch
    start: () => { newBest = false; popups.clear(); hint.show(); world.begin(); },
    resume: () => { world.resume(); },
    restart: () => { newBest = false; popups.clear(); hint.show(); world.restart(); },
    quit: () => { newBest = false; popups.clear(); vortexFx.hide(); world.quitToMenu(); },
  },
});
const particles = createParticles(scene);
fxPreviewFn = (tier) => { // ST-067: show the new tier immediately (arena center, behind the panel)
  const n = tier === 'high' ? CONFIG.fx.particleHigh : CONFIG.fx.particleLow;
  particles.burst(0, 0, { count: n, color: 0x7fd0ff, speed: 6, life: 0.7 });
};
// Screen shake (ST-025): core envelope, render layer applies the camera offset.
const shake = createShake({ master: CONFIG.fx.shake, decay: CONFIG.fx.shakeDecay, amplitude: CONFIG.fx.shakeAmplitude }, new RNG(0x57ab));
const shakeOff = { x: 0, y: 0, z: 0 };
const punch = createPunch({ decay: CONFIG.fx.punch.decay, amplitude: CONFIG.fx.punch.amplitude }); // ST-081: directed camera jolt
let hitStop = 0; // ST-081: sim-freeze seconds remaining (render loop; rendering keeps going)
let simT = 0; // sim-clock for timed visuals (invuln blink)
const flashEl = document.getElementById('flash'); // hit/bomb flash overlay (index.html)
let flashA = 0;
function togglePause() { // ST-033: shared by keyboard and two-finger touch
  const st = world.game.state;
  if (st === STATE.PLAYING) world.pause();
  else if (st === STATE.PAUSED) world.resume();
}
const input = createInput({ onPause: togglePause });
// I71: on-screen pause button (touch devices; shown during PLAYING only)
const pauseBtn = document.createElement('button');
pauseBtn.type = 'button';
pauseBtn.setAttribute('aria-label', 'Pause');
pauseBtn.textContent = '\u275A\u275A';
pauseBtn.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:30;display:none;pointer-events:auto;cursor:pointer;box-sizing:border-box;align-items:center;justify-content:center;width:calc(46px * var(--vr-fs,1));height:calc(46px * var(--vr-fs,1));border-radius:50%;border:1px solid #2b4a8a;background:rgba(10,18,40,0.82);color:#cfe4ff;font-size:calc(14px * var(--vr-fs,1));font-weight:700;letter-spacing:2px;padding:0;';
pauseBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
pauseBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePause(); pauseBtn.blur(); });
document.body.appendChild(pauseBtn);

// Session keys (ST-017): Enter start/restart, P/Esc pause, M mute.
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const st = world.game.state;
  if (e.key === 'Enter') {
    // I37: side effects only on the transitions that use them - stray Enter
    // mid-game (PLAYING/PAUSED) must not clear popups or re-show the tutorial hint.
    if (st === STATE.MENU) {
      newBest = false;
      popups.clear(); // ST-030: no stale popups across sessions
      hint.show(); // ST-032: first-wave tutorial hint
      world.begin();
    } else if (st === STATE.GAME_OVER) {
      newBest = false;
      popups.clear();
      hint.show();
      world.restart();
    } else if (st === STATE.PAUSED) { // I68: Enter resumes
      world.resume();
    }
  } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    togglePause();
  } else if (e.key === 'r' || e.key === 'R') { // I68: restart from pause
    if (st === STATE.PAUSED) { newBest = false; popups.clear(); hint.show(); world.restart(); }
  } else if (e.key === 'q' || e.key === 'Q') { // I68: quit from pause
    if (st === STATE.PAUSED) { newBest = false; popups.clear(); vortexFx.hide(); world.quitToMenu(); }
  } else if (e.key === 'm' || e.key === 'M') {
    muted = !muted;
    audio.setMuted(muted);
  }
});
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const aimWorld = new THREE.Vector3();

// follow-camera state
const shipFwd = { x: 0, y: 0 }; // ST-074: scratch for ship.forward()
const camPos = { x: 0, y: 9, z: 13 };
const camLook = { x: 0, y: 0, z: 0 };

// event drain sink (I16 HUD / I24 fx / I27 audio hook in here)
const eventTally = {};
// Deterministic advance for smoke tests + the I076 harness: runs N fixed substeps
// (world.step + event drain + visual sync) independent of display rate.
function advance(simSeconds, intent = { thrust: v2(0, 0), aimPoint: null, firing: false }) {
  const n = Math.max(1, Math.round(simSeconds / STEP));
  for (let i = 0; i < n; i++) tick(STEP, intent);
  syncVisuals(STEP);
}
window.__vr = { world, eventTally, input, advance, storage, particles, shipGroup: shipMesh.group, shipFlame: shipMesh.flame, shipFlameCore: shipMesh.flameCore, applySettings, liveSettings: () => liveSettings, audio, markAudioReady, banner, popups, hint, bloom, reticle, bullets, shieldRing, rockRenders, mineRenders, bossMesh, bossHealth, enemyBulletRenders, stars, vortexFx, fpsMeter, debugOverlay, adaptive, punch, toastEl, renderer, render: () => renderer.render(scene, camera) }; // debug/test handle (expanded in I080; ST-059: vortexFx)

window.addEventListener('pointerdown', markAudioReady, { once: true });
window.addEventListener('keydown', markAudioReady, { once: true });
window.addEventListener('resize', () => {
  setUiScale(); // I71: re-derive UI scale on viewport change
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  bloom.resize(window.innerWidth, window.innerHeight);
});
// I43: auto-pause when the tab is hidden (rAF stalls anyway; pausing gives the
// player the pause screen instead of a dt spike on return).
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && world.game.state === STATE.PLAYING) world.pause();
});
// I43: WebGL context loss - three.js reinitializes its GL state on restore; we
// pause the game, and force render-target re-allocation (composer + bloom).
// I75: user-facing overlay while the 3D context is gone, with a reload fallback
// if the browser never restores it.
const ctxOverlay = document.createElement('div');
ctxOverlay.id = 'ctx-overlay';
ctxOverlay.style.cssText = 'position:fixed;inset:0;z-index:80;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(2,3,10,0.94);color:#c8d4ee;font:calc(14px * var(--vr-fs,1))/1.6 ui-monospace,monospace;text-align:center;padding:24px;';
const ctxTitle = document.createElement('div');
ctxTitle.style.cssText = 'font-size:calc(22px * var(--vr-fs,1));letter-spacing:.2em;color:#9fb4d8;';
ctxTitle.textContent = 'RENDERING INTERRUPTED';
const ctxStatus = document.createElement('div');
ctxStatus.id = 'ctx-status';
ctxStatus.textContent = 'The browser dropped the 3D rendering context. It usually comes back on its own - please wait.';
const ctxBtn = document.createElement('button');
ctxBtn.type = 'button';
ctxBtn.textContent = 'RELOAD GAME';
ctxBtn.style.cssText = 'margin-top:8px;font:calc(14px * var(--vr-fs,1))/1 ui-monospace,monospace;letter-spacing:.12em;color:#0a0f1e;background:#9fb4d8;border:0;border-radius:4px;padding:10px 22px;cursor:pointer;';
ctxBtn.addEventListener('click', () => { location.reload(); });
ctxOverlay.appendChild(ctxTitle);
ctxOverlay.appendChild(ctxStatus);
ctxOverlay.appendChild(ctxBtn);
document.body.appendChild(ctxOverlay);
let ctxRestoreTimer = 0;
renderer.domElement.addEventListener('webglcontextlost', (e) => {
  e.preventDefault(); // mark the context as restorable
  if (world.game.state === STATE.PLAYING) world.pause();
  ctxOverlay.style.display = 'flex'; // I75
  ctxStatus.textContent = 'The browser dropped the 3D rendering context. It usually comes back on its own - please wait.';
  clearTimeout(ctxRestoreTimer);
  ctxRestoreTimer = setTimeout(() => { // I75: no restore yet - escalate
    ctxStatus.textContent = 'Still no signal after 10s. If it does not come back, reload the game.';
  }, 10000);
});
renderer.domElement.addEventListener('webglcontextrestored', () => {
  clearTimeout(ctxRestoreTimer); // I75
  renderer.setSize(window.innerWidth, window.innerHeight);
  bloom.resize(window.innerWidth, window.innerHeight);
  renderer.info.reset();
  ctxOverlay.style.display = 'none'; // I75: back to normal (pause screen takes over if the game was running)
});
window.__vr.ctxOverlay = ctxOverlay; // I75: expose after declaration (TDZ-safe)

// Fixed-timestep simulation (60Hz) with render at display rate (ST-078: the
// accumulator + dt clamp live in the pure core clock; huge gaps are clamped to
// 0.25s and the backlog dropped past 8 substeps, so resume never fast-forwards).
const STEP = 1 / 60;
const MAX_SUBSTEPS = 8;
const clock = createClock({ step: STEP, maxFrameDt: 0.25, maxSubsteps: MAX_SUBSTEPS });
let prevState = null; // ST-078: detect PAUSED->PLAYING to reset the clock on resume

function resolveAimPoint() {
  if (input.touchDrag) { // ST-033: while drag-thrusting, aim along the drag (fire forward)
    const sp = world.ship.pos;
    return { x: sp.x + input.touchDrag.x * 10, y: sp.y + input.touchDrag.y * 10 };
  }
  if (!input.pointer.active) return null;
  raycaster.setFromCamera(input.pointer.ndc, camera);
  if (raycaster.ray.intersectPlane(groundPlane, aimWorld)) {
    return { x: aimWorld.x, y: aimWorld.z };
  }
  return null;
}

function tick(dt, intent) {
  if (!intent) input.tick(dt); // ST-033: decay touch fire-tail / pause cooldown
  const it = intent || { thrust: input.state.thrust, aimPoint: resolveAimPoint(), firing: input.state.firing };
  world.step(dt, it);
  for (const e of world.drainEvents()) {
    eventTally[e.type] = (eventTally[e.type] || 0) + 1;
    const cue = e.type === 'powerup' && e.data && e.data.type === 'overdrive' ? 'overdrive' : SFX_CUES[e.type]; // ST-057
    if (cue) audio.sfx(cue, e.data && e.data.pos ? e.data.pos : null);
    if (e.type === 'wave') banner.showWave(e.data.n, e.data.mod, e.data.endless);
    else if (e.type === 'waveCleared') banner.showCleared(e.data.n);
    else if (e.type === 'kill') popups.add(e.data.pos.x, e.data.pos.y, '+' + e.data.points, { big: e.data.multiplier >= 2 || e.data.golden || e.data.boss, gold: !!e.data.golden, od: !!e.data.overdrive }); // ST-030/052
    else if (e.type === 'nearmiss') popups.add(e.data.pos.x, e.data.pos.y, '+' + e.data.points); // ST-053 (plain small popup)
    if (!motionOff) {
      if (e.type === 'kill') particles.burst(e.data.pos.x, e.data.pos.y, { count: e.data.golden ? Math.ceil(fxCount * 1.5) : fxCount, color: e.data.golden ? 0xffe9a0 : 0xffd27a, speed: 9, life: 0.5 }); // ST-052
      else if (e.type === 'nearmiss') particles.burst(e.data.pos.x, e.data.pos.y, { count: Math.max(4, Math.ceil(fxCount * 0.25)), color: 0x7fd4ff, speed: 5, life: 0.3 }); // ST-053 subtle graze wisp
      else if (e.type === 'mineExplode') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount, color: 0xff5a3c, speed: 10, life: 0.5 }); shake.trigger(0.4); flashA = Math.min(0.8, flashA + 0.25); } // ST-054
      else if (e.type === 'bossSpawn') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount, color: 0xb18cff, speed: 8, life: 0.7 }); shake.trigger(0.7); flashA = Math.min(0.8, flashA + 0.4); } // ST-055
      else if (e.type === 'bossRing') particles.burst(e.data.pos.x, e.data.pos.y, { count: Math.ceil(fxCount * 0.6), color: 0x9d7bff, speed: 7, life: 0.4 }); // ST-055
      else if (e.type === 'bossDeath') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount * 2, color: 0xfff0b8, speed: 14, life: 0.8 }); shake.trigger(1.0); flashA = Math.min(0.8, flashA + 0.5); hitStop = Math.max(hitStop, CONFIG.fx.hitStop.bossDeath); punch.trigger({ x: 0, y: 0.7, z: 0.5 }, 1.0); } // ST-055/ST-081
      else if (e.type === 'bossFire') particles.burst(e.data.pos.x, e.data.pos.y, { count: 5, color: 0xff6a4a, speed: 4, life: 0.25 }); // ST-056 muzzle
      else if (e.type === 'mineFire') particles.burst(e.data.pos.x, e.data.pos.y, { count: 4, color: 0xff5a3c, speed: 3, life: 0.2 }); // ST-056 muzzle
      else if (e.type === 'powerup' && e.data.type === 'overdrive') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount, color: 0xff5ad8, speed: 8, life: 0.5 }); flashA = Math.min(0.8, flashA + 0.15); } // ST-057 pickup flash
      else if (e.type === 'hit') {
        particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount, color: 0xff6b57, speed: 11, life: 0.45 });
        shake.trigger(CONFIG.fx.shakeHit);
        flashA = Math.min(0.8, flashA + 0.5);
      } else if (e.type === 'shieldPop') particles.burst(e.data.pos.x, e.data.pos.y, { count: Math.ceil(fxCount * 0.75), color: 0x53d8ff, speed: 8, life: 0.5 });
      else if (e.type === 'bomb') {
        particles.burst(0, 0, { count: fxCount * 2, color: 0xfff3b0, speed: 16, life: 0.7 });
        shake.trigger(CONFIG.fx.shakeBomb);
        flashA = Math.min(0.8, flashA + 0.35);
        hitStop = Math.max(hitStop, CONFIG.fx.hitStop.bomb); punch.trigger({ x: 0, y: 0.7, z: 0.5 }, 0.8); // ST-081
      } else if (e.type === 'vortexTelegraph') particles.burst(e.data.pos.x, e.data.pos.y, { count: Math.ceil(fxCount * 0.4), color: 0x9d7bff, speed: 2, life: 0.8 }); // ST-059 telegraph wisp
    }
    if (e.type === 'vortexTelegraph') { vortexFx.onTelegraph(e.data.pos); } // ST-059 (state always advances; particles above are motion-gated)
    else if (e.type === 'vortexStart') { vortexFx.onStart(e.data.pos); }
    else if (e.type === 'vortexEnd') { vortexFx.onEnd(); }
    if (e.type === 'shieldPop') {
      shieldRing.pulse();
    } else if (e.type === 'gameover') {
      newBest = storage.setBest(e.data.score); // true when the stored best was raised
      bestScore = storage.getBest();
      if (e.data.score > 0) { // I66: top-5 board (wave/kills from live world state)
        const rec = storage.recordScore({ score: e.data.score, wave: Math.max(1, world.wave), kills: world.scoreKeeper.kills });
        scoreRank = rec.rank; // I69
        refreshScoresText();
      }
      if (newBest && !motionOff && fxCount > 0) { // I69: new-best confetti (reduced motion: static)
        const sx = world.ship.pos.x, sy = world.ship.pos.y;
        particles.burst(sx, sy, { count: fxCount, color: 0xffd27a, speed: 7, life: 1.1 });
        particles.burst(sx - 2.5, sy + 1.5, { count: Math.ceil(fxCount * 0.6), color: 0x7fd0ff, speed: 6, life: 1.0 });
        particles.burst(sx + 2.5, sy - 1.5, { count: Math.ceil(fxCount * 0.6), color: 0xd87fd8, speed: 6, life: 1.0 });
      }
      vortexFx.hide(); // ST-059
    }
  }
  simT += dt;
  shake.step(dt);
  punch.step(dt); // ST-081: punch decays on every tick
}

const hudOpts = { best: 0 };
const screenOpts = { muted: false, best: 0, newBest: false };
function syncVisuals(dt) {
  const st = world.game.state;
  hud.setVisible(st === STATE.PLAYING || st === STATE.PAUSED);
  // I36: reuse opts objects instead of allocating per frame
  hudOpts.best = bestScore;
  screenOpts.muted = muted;
  screenOpts.best = bestScore;
  screenOpts.newBest = newBest;
  screenOpts.reducedMotion = motionOff; // I65: menu polish (reduced-motion gates the new animations)
  screenOpts.scoresText = scoresText; // I66: top-5 table
  screenOpts.scoreRank = scoreRank; // I69: board rank on game over
  hud.render(world, hudOpts);
  if (coarse && st === STATE.PLAYING) { if (pauseBtn.style.display !== 'flex') pauseBtn.style.display = 'flex'; } else if (pauseBtn.style.display !== 'none') pauseBtn.style.display = 'none'; // I71: on-screen pause button (touch, PLAYING only)
  screens.update(st, world, screenOpts);
  shipMesh.sync(world.ship, simT, !motionOff, Math.min(1, Math.hypot(input.state.thrust.x, input.state.thrust.y))); // ST-063 engine flame
  reticle.sync(world.ship, st === STATE.PLAYING); // I44: only while playing
  bullets.sync(world.weapons);
  rockRenders.sync(world.field);
  mineRenders.sync(world.mines, simT); // ST-054
  bossMesh.sync(world.boss, simT); // ST-055
  bossHealth.sync(world.boss); // ST-055
  enemyBulletRenders.sync(world.enemyBullets, simT); // ST-056
  powerupRenders.sync(world.powerups, dt);
  shieldRing.sync(world, dt, !motionOff); // I62: freeze under reduced motion
  if (st === STATE.PLAYING) vortexFx.update(dt); // ST-059 (frozen while paused)
  particles.sync(dt);
  banner.sync(world.waves, dt, motionOff); // ST-028

  const ship = world.ship;
  const f = ship.forward(shipFwd); // ST-074: scratch reuse (no per-frame alloc)
  camPos.x = damp(camPos.x, ship.pos.x, 5, dt);
  camPos.y = damp(camPos.y, 9, 5, dt);
  camPos.z = damp(camPos.z, ship.pos.y + 13, 5, dt);
  camLook.x = damp(camLook.x, ship.pos.x + f.x * 4, 6, dt);
  camLook.y = damp(camLook.y, 0, 6, dt);
  camLook.z = damp(camLook.z, ship.pos.y + f.y * 4, 6, dt);
  camera.position.set(camPos.x, camPos.y, camPos.z);
  camera.lookAt(camLook.x, camLook.y, camLook.z);
  shake.offset(shakeOff); // ST-025: apply shake after follow-camera (offset() writes in place)
  punch.offset(shakeOff); // ST-081: punch composes on top of shake (offset() adds in place)
  camera.position.x += shakeOff.x;
  camera.position.y += shakeOff.y;
  camera.position.z += shakeOff.z;
  stars.update(simT, camera, !motionOff); // I60: twinkle + parallax (frozen when reduced motion)
  popups.sync(dt, motionOff); // ST-030: after follow-camera + shake
  hint.sync(dt, motionOff); // ST-032
  if (flashA > 0) { // hit/bomb flash decay
    flashA = Math.max(0, flashA - dt * 2.2);
    if (flashEl) flashEl.style.opacity = String(flashA); // I43: #flash is optional in the DOM
  } else if (flashEl && flashEl.style.opacity !== '0') flashEl.style.opacity = '0';

  stars.rotation.y += dt * 0.004;
  if (fpsMeter) fpsMeter.sync(dt); // I36
}

function frame() {
  requestAnimationFrame(frame);
  const now = performance.now();
  const cur = world.game.state;
  if (prevState === STATE.PAUSED && cur === STATE.PLAYING) clock.reset(now); // ST-078: no accumulated dt carried into resume
  const r = clock.tick(now); // ST-078: fixed-timestep clock (clamped dt, dropped backlog)
  const frameDt = r.dt;
  if (hitStop > 0 && cur === STATE.PLAYING) { // ST-081: hit-stop - freeze the sim, keep rendering
    hitStop = Math.max(0, hitStop - frameDt);
    clock.reset(now); // discard accumulated sim time during the freeze (no catch-up burst)
  } else {
    if (hitStop > 0) hitStop = 0; // event fired but we are not PLAYING - discard the freeze
    for (let i = 0; i < r.steps; i++) tick(STEP);
  }
  prevState = cur;
  if (world.game.state === STATE.PLAYING) adaptive.noteFrame(frameDt); // ST-073: adaptive quality (real frame dt, PLAYING only)
  syncVisuals(frameDt); // I36: reads previous frame GPU stats
  renderer.info.reset(); // I36: clear before this frame accumulates (autoReset off)
  bloom.render();
  if (debugOverlay) { // I80: sample this frame's GPU stats + entity pools (post-bloom = full frame)
    const gi = renderer.info.render;
    debugOverlay.update(frameDt, {
      drawcalls: gi.calls, tris: gi.triangles,
      rocks: world.field.rocks.length, rockCap: CONFIG.asteroid.maxConcurrent,
      bullets: world.weapons.bullets.length, bulletCap: CONFIG.weapon.maxBullets,
      eb: world.enemyBullets.count, ebCap: CONFIG.enemyBullets.maxConcurrent,
      mines: world.mines.count, mineCap: CONFIG.mine.maxConcurrent,
      drops: world.powerups.drops.length, dropCap: CONFIG.powerup.maxActiveDrops,
      boss: world.boss && world.boss.alive ? 1 : 0,
      state: world.game.state,
    });
  }
}
frame();







