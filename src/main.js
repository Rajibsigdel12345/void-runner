// Void Runner - boot (I12: World orchestrator drives ship/weapons/asteroids/collisions)
import * as THREE from 'three';
import { createStarfield } from './render/starfield.js';
import { createShipMesh } from './render/shipMesh.js';
import { createInput } from './render/input.js';
import { createBulletPool } from './render/bulletPool.js';
import { createAsteroidRenderer } from './render/asteroidRenderer.js';
import { createPowerupRenderer } from './render/powerupMesh.js';
import { createShieldRing } from './render/shieldRing.js';
import { createParticles } from './render/particles.js';
import { createShake } from './core/fx.js';
import { createHUD } from './render/hud.js';
import { createScreens } from './render/screens.js';
import { STATE } from './core/state.js';
import { Storage } from './core/storage.js';
import { CONFIG } from './core/config.js';
import { World } from './core/game.js';
import { RNG } from './core/rng.js';
import { damp, v2 } from './core/math.js';

const app = document.getElementById('app');

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04060f);
scene.fog = new THREE.Fog(0x04060f, 60, 240);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);

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
const powerupRenders = createPowerupRenderer(scene);
const shieldRing = createShieldRing(scene);
const hud = createHUD(document.body);
const screens = createScreens(document.body);
let muted = false; // M key (ST-017); consumed by the audio system in I27

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
const startSettings = storage.getSettings();
const fxCount = startSettings.fx === 'low' ? CONFIG.fx.particleLow : CONFIG.fx.particleHigh;
const motionOff = startSettings.reducedMotion === true;
const particles = createParticles(scene);
// Screen shake (ST-025): core envelope, render layer applies the camera offset.
const shake = createShake({ master: CONFIG.fx.shake, decay: CONFIG.fx.shakeDecay, amplitude: CONFIG.fx.shakeAmplitude }, new RNG(0x57ab));
const shakeOff = { x: 0, y: 0, z: 0 };
let simT = 0; // sim-clock for timed visuals (invuln blink)
const flashEl = document.getElementById('flash'); // hit/bomb flash overlay (index.html)
let flashA = 0;

const input = createInput();

// Session keys (ST-017): Enter start/restart, P/Esc pause, M mute.
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const st = world.game.state;
  if (e.key === 'Enter') {
    newBest = false;
    if (st === STATE.MENU) world.begin();
    else if (st === STATE.GAME_OVER) world.restart();
  } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    if (st === STATE.PLAYING) world.pause();
    else if (st === STATE.PAUSED) world.resume();
  } else if (e.key === 'm' || e.key === 'M') {
    muted = !muted;
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
window.__vr = { world, eventTally, input, advance, storage, particles, shipGroup: shipMesh.group, renderer, render: () => renderer.render(scene, camera) }; // debug/test handle (expanded in I080)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Fixed-timestep simulation (60Hz) with render at display rate.
// Substeps keep sim time tracking wall time even when rAF is throttled;
// backlog is dropped past MAX_SUBSTEPS (hidden tab / slow device) instead of spiraling.
const STEP = 1 / 60;
const MAX_SUBSTEPS = 8;
let lastNow = performance.now();
let acc = 0;

function resolveAimPoint() {
  if (!input.pointer.active) return null;
  raycaster.setFromCamera(input.pointer.ndc, camera);
  if (raycaster.ray.intersectPlane(groundPlane, aimWorld)) {
    return { x: aimWorld.x, y: aimWorld.z };
  }
  return null;
}

function tick(dt, intent) {
  const it = intent || { thrust: input.state.thrust, aimPoint: resolveAimPoint(), firing: input.state.firing };
  world.step(dt, it);
  for (const e of world.drainEvents()) {
    eventTally[e.type] = (eventTally[e.type] || 0) + 1;
    if (!motionOff) {
      if (e.type === 'kill') particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount, color: 0xffd27a, speed: 9, life: 0.5 });
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

function syncVisuals(dt) {
  const st = world.game.state;
  hud.setVisible(st === STATE.PLAYING || st === STATE.PAUSED);
  hud.render(world, { best: bestScore });
  screens.update(st, world, { muted, best: bestScore, newBest });
  shipMesh.sync(world.ship, simT, !motionOff);
  bullets.sync(world.weapons);
  rockRenders.sync(world.field);
  powerupRenders.sync(world.powerups, dt);
  shieldRing.sync(world, dt);
  particles.sync(dt);

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
  if (flashA > 0) { // hit/bomb flash decay
    flashA = Math.max(0, flashA - dt * 2.2);
    flashEl.style.opacity = String(flashA);
  } else if (flashEl.style.opacity !== '0') flashEl.style.opacity = '0';

  stars.rotation.y += dt * 0.004;
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
  syncVisuals(frameDt);
  renderer.render(scene, camera);
}
frame();







