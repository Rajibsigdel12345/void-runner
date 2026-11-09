// Void Runner - boot (I12: World orchestrator drives ship/weapons/asteroids/collisions)
import * as THREE from 'three';
import { createStarfield } from './render/starfield.js';
import { createShipMesh } from './render/shipMesh.js';
import { createInput } from './render/input.js';
import { createBulletPool } from './render/bulletPool.js';
import { createAsteroidRenderer } from './render/asteroidRenderer.js';
import { createMineRenderer } from './render/mineMesh.js';
import { createPowerupRenderer } from './render/powerupMesh.js';
import { createShieldRing } from './render/shieldRing.js';
import { createParticles } from './render/particles.js';
import { createShake } from './core/fx.js';
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
const powerupRenders = createPowerupRenderer(scene);
const shieldRing = createShieldRing(scene);
const banner = createWaveBanner(document.body);
const popups = createScorePopups(document.body, camera); // ST-030
const hint = createTutorialHint(document.body); // ST-032
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

// Juice (ST-024): pooled particle bursts, honoring saved FX tier + reduced
// motion (the settings panel lands in I26; values are read at boot).
let fxCount = 0;
let motionOff = false;
let liveSettings = storage.getSettings(); // ST-026: settings panel keeps this fresh (audio consumes in I27)
// Audio (ST-027): WebAudio synth, initialized on first user gesture.
const SFX_CUES = { fire: 'shoot', kill: 'kill', hit: 'hit', powerup: 'powerup', shieldPop: 'shieldPop', bomb: 'bomb', wave: 'wave', waveCleared: 'cleared', gameover: 'gameover', nearmiss: 'swish', mineExplode: 'mine' };
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
function applySettings(s) {
  liveSettings = s;
  fxCount = s.fx === 'low' ? CONFIG.fx.particleLow : CONFIG.fx.particleHigh;
  motionOff = s.reducedMotion === true;
  bloom.setEnabled(s.fx === 'high');
  if (audio.state() !== 'uninitialized') { audio.setVolume(s.volume); audio.setSfx(s.sfx); }
}
applySettings(liveSettings);
// ST-026: settings panels (menu + pause) - after storage/applySettings (TDZ order).
const menuSettings = createSettingsPanel(storage, applySettings);
const pauseSettings = createSettingsPanel(storage, applySettings);
const screens = createScreens(document.body, { menu: menuSettings, pause: pauseSettings });
const particles = createParticles(scene);
// Screen shake (ST-025): core envelope, render layer applies the camera offset.
const shake = createShake({ master: CONFIG.fx.shake, decay: CONFIG.fx.shakeDecay, amplitude: CONFIG.fx.shakeAmplitude }, new RNG(0x57ab));
const shakeOff = { x: 0, y: 0, z: 0 };
let simT = 0; // sim-clock for timed visuals (invuln blink)
const flashEl = document.getElementById('flash'); // hit/bomb flash overlay (index.html)
let flashA = 0;
function togglePause() { // ST-033: shared by keyboard and two-finger touch
  const st = world.game.state;
  if (st === STATE.PLAYING) world.pause();
  else if (st === STATE.PAUSED) world.resume();
}
const input = createInput({ onPause: togglePause });

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
    }
  } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    togglePause();
  } else if (e.key === 'm' || e.key === 'M') {
    muted = !muted;
    audio.setMuted(muted);
  }
});
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const aimWorld = new THREE.Vector3();

// follow-camera state
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
window.__vr = { world, eventTally, input, advance, storage, particles, shipGroup: shipMesh.group, applySettings, liveSettings: () => liveSettings, audio, markAudioReady, banner, popups, hint, bloom, reticle, rockRenders, mineRenders, fpsMeter, renderer, render: () => renderer.render(scene, camera) }; // debug/test handle (expanded in I080)

window.addEventListener('pointerdown', markAudioReady, { once: true });
window.addEventListener('keydown', markAudioReady, { once: true });
window.addEventListener('resize', () => {
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
renderer.domElement.addEventListener('webglcontextlost', (e) => {
  e.preventDefault(); // mark the context as restorable
  if (world.game.state === STATE.PLAYING) world.pause();
});
renderer.domElement.addEventListener('webglcontextrestored', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  bloom.resize(window.innerWidth, window.innerHeight);
  renderer.info.reset();
});

// Fixed-timestep simulation (60Hz) with render at display rate.
// Substeps keep sim time tracking wall time even when rAF is throttled;
// backlog is dropped past MAX_SUBSTEPS (hidden tab / slow device) instead of spiraling.
const STEP = 1 / 60;
const MAX_SUBSTEPS = 8;
let lastNow = performance.now();
let acc = 0;

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
    const cue = SFX_CUES[e.type]; if (cue) audio.sfx(cue, e.data && e.data.pos ? e.data.pos : null);
    if (e.type === 'wave') banner.showWave(e.data.n, e.data.mod);
    else if (e.type === 'waveCleared') banner.showCleared(e.data.n);
    else if (e.type === 'kill') popups.add(e.data.pos.x, e.data.pos.y, '+' + e.data.points, { big: e.data.multiplier >= 2 || e.data.golden, gold: !!e.data.golden }); // ST-030/052
    else if (e.type === 'nearmiss') popups.add(e.data.pos.x, e.data.pos.y, '+' + e.data.points); // ST-053 (plain small popup)
    if (!motionOff) {
      if (e.type === 'kill') particles.burst(e.data.pos.x, e.data.pos.y, { count: e.data.golden ? Math.ceil(fxCount * 1.5) : fxCount, color: e.data.golden ? 0xffe9a0 : 0xffd27a, speed: 9, life: 0.5 }); // ST-052
      else if (e.type === 'nearmiss') particles.burst(e.data.pos.x, e.data.pos.y, { count: Math.max(4, Math.ceil(fxCount * 0.25)), color: 0x7fd4ff, speed: 5, life: 0.3 }); // ST-053 subtle graze wisp
      else if (e.type === 'mineExplode') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount, color: 0xff5a3c, speed: 10, life: 0.5 }); shake.trigger(0.4); flashA = Math.min(0.8, flashA + 0.25); } // ST-054
      else if (e.type === 'hit') {
        particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount, color: 0xff6b57, speed: 11, life: 0.45 });
        shake.trigger(CONFIG.fx.shakeHit);
        flashA = Math.min(0.8, flashA + 0.5);
      } else if (e.type === 'shieldPop') particles.burst(e.data.pos.x, e.data.pos.y, { count: Math.ceil(fxCount * 0.75), color: 0x53d8ff, speed: 8, life: 0.5 });
      else if (e.type === 'bomb') {
        particles.burst(0, 0, { count: fxCount * 2, color: 0xfff3b0, speed: 16, life: 0.7 });
        shake.trigger(CONFIG.fx.shakeBomb);
        flashA = Math.min(0.8, flashA + 0.35);
      }
    }
    if (e.type === 'shieldPop') {
      shieldRing.pulse();
    } else if (e.type === 'gameover') {
      newBest = storage.setBest(e.data.score); // true when the stored best was raised
      bestScore = storage.getBest();
    }
  }
  simT += dt;
  shake.step(dt);
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
  hud.render(world, hudOpts);
  screens.update(st, world, screenOpts);
  shipMesh.sync(world.ship, simT, !motionOff);
  reticle.sync(world.ship, st === STATE.PLAYING); // I44: only while playing
  bullets.sync(world.weapons);
  rockRenders.sync(world.field);
  mineRenders.sync(world.mines, simT); // ST-054
  powerupRenders.sync(world.powerups, dt);
  shieldRing.sync(world, dt);
  particles.sync(dt);
  banner.sync(world.waves, dt, motionOff); // ST-028

  const ship = world.ship;
  const f = ship.forward();
  camPos.x = damp(camPos.x, ship.pos.x, 5, dt);
  camPos.y = damp(camPos.y, 9, 5, dt);
  camPos.z = damp(camPos.z, ship.pos.y + 13, 5, dt);
  camLook.x = damp(camLook.x, ship.pos.x + f.x * 4, 6, dt);
  camLook.y = damp(camLook.y, 0, 6, dt);
  camLook.z = damp(camLook.z, ship.pos.y + f.y * 4, 6, dt);
  camera.position.set(camPos.x, camPos.y, camPos.z);
  camera.lookAt(camLook.x, camLook.y, camLook.z);
  shake.offset(shakeOff); // ST-025: apply shake after follow-camera (offset() writes in place)
  camera.position.x += shakeOff.x;
  camera.position.y += shakeOff.y;
  camera.position.z += shakeOff.z;
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
  let frameDt = (now - lastNow) / 1000;
  lastNow = now;
  if (frameDt > 0.25) frameDt = 0.25; // clamp huge gaps (tab switch); I078 refines this
  acc += frameDt;
  let n = 0;
  while (acc >= STEP && n < MAX_SUBSTEPS) {
    tick(STEP);
    acc -= STEP;
    n++;
  }
  if (n === MAX_SUBSTEPS) acc = 0; // drop backlog
  syncVisuals(frameDt); // I36: reads previous frame GPU stats
  renderer.info.reset(); // I36: clear before this frame accumulates (autoReset off)
  bloom.render();
}
frame();







