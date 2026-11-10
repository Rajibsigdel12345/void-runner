﻿﻿// Void Runner - boot (I12: World orchestrator drives ship/weapons/asteroids/collisions)
import * as THREE from 'three';
import { createStarfield } from './render/starfield.js';
import { createShipMesh } from './render/shipMesh.js';
import { createInput } from './render/input.js';
import { createBulletPool } from './render/bulletPool.js';
import { createAsteroidRenderer } from './render/asteroidRenderer.js';
import { createAssetLoader } from './render/assetLoader.js'; // I104
import { createMineRenderer } from './render/mineMesh.js';
import { createDroneRenderer } from './render/droneMesh.js'; // ST-117
import { createBossMesh } from './render/bossMesh.js';
import { createWardenMesh } from './render/wardenMesh.js'; // ST-137
import { createBossHealth } from './render/bossHealth.js';
import { createEnemyBulletRenderer } from './render/enemyBulletMesh.js';
import { createPowerupRenderer } from './render/powerupMesh.js';
import { createShieldRing } from './render/shieldRing.js';
import { createVortexFx } from './render/vortexFx.js'; // ST-059
import { createParticles } from './render/particles.js';
import { createShake, createPunch, createFovKick } from './core/fx.js'; // ST-081/ST-082
import { createJuiceTally } from './core/juiceTally.js'; // ST-183: per-run juice-channel tally (feel telemetry)
import { shakeEnergy } from './core/shakeTable.js'; // ST-175: unified screen-shake table lookup
import { flashEnergy } from './core/flashTable.js'; // ST-179: unified white-flash bump table lookup
import { dangerVignetteX } from './core/dangerVignette.js'; // ST-176: reduced-motion damage vignette envelope
import { createHUD } from './render/hud.js';
import { createReticle } from './render/reticle.js';
import { createScreens } from './render/screens.js';
import { createSettingsPanel } from './render/settingsPanel.js';
import { createAudio } from './render/audio.js';
import { createWaveBanner } from './render/waveBanner.js';
import { createScorePopups } from './render/scorePopups.js';
import { createTutorialHint } from './render/tutorialHint.js';
import { createTutorialOverlay } from './render/tutorialOverlay.js'; // I151: first-run tutorial
import { createKillFeed } from './render/killFeed.js'; // I153: kill feed
import { decodeReplay, demoReplay, createPlayer } from './core/replay.js'; // ST-190: replay codec + demo pilot
import { createReplayHud } from './render/replayHud.js'; // ST-190: replay HUD bar
import { createBloom } from './render/bloom.js';
import { createFpsMeter } from './render/fpsMeter.js';
import { createDebugOverlay } from './render/debugOverlay.js'; // ST-080
import { createAdaptiveQuality } from './core/adaptiveQuality.js'; // ST-073
import { createClock } from './core/clock.js'; // ST-078
import { visibilityAction } from './core/visibilityPause.js'; // I189: pure visibility-pause decision (unit-tested)
import { STATE } from './core/state.js';
import { Storage, toggleFxQuality } from './core/storage.js';
import { CONFIG } from './core/config.js';
import { World } from './core/game.js';
import { dailyForDate } from './core/daily.js'; // ST-141
import { RNG } from './core/rng.js';
import { damp, v2 } from './core/math.js';
import { musicIntensityX } from './core/musicIntensity.js'; // I170
import { timeWarpX } from './core/timeWarp.js'; // I172
import { deathWarpX } from './core/deathWarp.js'; // I174

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

const camera = new THREE.PerspectiveCamera(CONFIG.camera.fovBase, window.innerWidth / window.innerHeight, 0.1, 400); // ST-082: base FOV from config

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
const droneRenders = createDroneRenderer(scene); // ST-117
const bossMesh = createBossMesh(scene); // ST-055
const wardenMesh = createWardenMesh(scene); // ST-137
// I104: GLB assets (Blender pass) - fire-and-forget load with procedural
// fallback: renderers start procedural and each asset swaps in as it loads.
const assetLoader = createAssetLoader();
assetLoader.onAsset((name, entry) => {
  if (!entry.ready) return;
  if (name === 'ship') shipMesh.useGLB(entry.object);
  else if (name === 'rockL') rockRenders.setGLB('L', entry.object);
  else if (name === 'rockM') rockRenders.setGLB('M', entry.object);
  else if (name === 'rockS') rockRenders.setGLB('S', entry.object);
  else if (name === 'boss') bossMesh.useGLB(entry.object);
});
assetLoader.loadAll();
const bossHealth = createBossHealth(document.body); // ST-055
const enemyBulletRenders = createEnemyBulletRenderer(scene); // ST-056
const powerupRenders = createPowerupRenderer(scene);
const shieldRing = createShieldRing(scene);
const vortexFx = createVortexFx(scene, CONFIG.vortex); // ST-059
const banner = createWaveBanner(document.body);
const popups = createScorePopups(document.body, camera); // ST-030
const coarse = (window.matchMedia && window.matchMedia('(pointer:coarse)').matches) || 'ontouchstart' in window; // I71: touch detect (hint + screens)
const hint = createTutorialHint(document.body, { touch: coarse }); // ST-032
const killFeed = createKillFeed(document.body); // I153: kill feed (top-right, PLAYING only)
const replayHud = createReplayHud(document.body); // ST-190: slim bar during a watched replay
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
// I151: first-run tutorial overlay - a one-time, dismissible "how to play" card shown on the
// player's first entry to PLAYING. While active it gates the sim (tick early-returns) so the
// player can read without dying; dismissal is persisted via storage and never re-shown.
const tutorial = createTutorialOverlay(document.body, {
  touch: coarse,
  onDismiss: () => dismissTutorial(),
});
let tutorialActive = false;
function dismissTutorial() {
  if (tutorialActive) { storage.setTutorialSeen(); tutorial.hide(); tutorialActive = false; }
}
let newBest = false;
let replayView = null; // ST-190: { player, data, speed, idx } while a replay is watched, else null
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
const SFX_CUES = { fire: 'shoot', kill: 'kill', hit: 'hit', powerup: 'powerup', shieldPop: 'shieldPop', bomb: 'bomb', wave: 'wave', waveCleared: 'cleared', gameover: 'gameover', nearmiss: 'swish', mineExplode: 'mine', bossSpawn: 'bossSpawn', bossRing: 'bossRing', bossDeath: 'bossDeath', bossFire: 'bossFire', mineFire: 'mineFire', vortexTelegraph: 'vortexTelegraph', vortexStart: 'vortexStart', droneExplode: 'drone', weaponLevelUp: 'levelUp', rockShieldHit: 'shieldHit', droneDecay: 'droneDecay', wardenSpawn: 'wardenSpawn', wardenArmor: 'shieldHit', wardenDeath: 'wardenDeath', beltHit: 'shieldHit' }; // ST-059/ST-117/ST-123/ST-127/ST-129/ST-137, I173: decay + warden get their own cues (warden armor keeps shieldHit)

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

// I158: colorblind preview - simulate deuteranopia (Machado 2009) on the canvas via an
// inline SVG feColorMatrix (same matrix as tools/colorblind.cjs, applied in sRGB for a close preview).
function ensureCvdFilter() {
  if (document.getElementById('vr-cvd-svg')) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('id', 'vr-cvd-svg'); svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
  const defs = document.createElementNS(ns, 'defs');
  const filter = document.createElementNS(ns, 'filter');
  filter.setAttribute('id', 'vr-cvd-deutan'); filter.setAttribute('color-interpolation-filters', 'sRGB');
  const cm = document.createElementNS(ns, 'feColorMatrix');
  cm.setAttribute('type', 'matrix');
  cm.setAttribute('values', '0.4942 0.5058 0 0 0  0.2464 0.7536 0 0 0  0 0.0040 0.9960 0 0  0 0 0 1 0');
  filter.appendChild(cm); defs.appendChild(filter); svg.appendChild(defs);
  document.body.appendChild(svg);
}
function applyColorblindPreview(on) {
  if (on) ensureCvdFilter();
  renderer.domElement.style.filter = on ? 'url(#vr-cvd-deutan)' : 'none';
}
// I158: slow-mo hint caption (gated by the setting, PLAYING only).
const slowmoHintEl = document.createElement('div');
slowmoHintEl.id = 'slowmo-hint';
slowmoHintEl.setAttribute('aria-hidden', 'true');
slowmoHintEl.textContent = 'SLOWMO \u00b7 enemies slow to 40% \u2014 you stay at full speed';
slowmoHintEl.style.cssText = 'position:fixed;left:50%;bottom:104px;transform:translateX(-50%);z-index:40;pointer-events:none;font:calc(12px * var(--vr-fs,1))/1.4 ui-monospace,monospace;letter-spacing:.06em;color:#9fe8ff;background:rgba(6,20,30,0.66);padding:5px 12px;border-radius:5px;border:1px solid rgba(159,232,255,0.35);opacity:0;transition:opacity .2s;';
document.body.appendChild(slowmoHintEl);

function applySettings(s) {
  liveSettings = s;
  fxCount = s.fx === 'low' ? CONFIG.fx.particleLow : CONFIG.fx.particleHigh;
  motionOff = s.reducedMotion === true;
  slowmoHintEl.style.transition = motionOff ? 'none' : 'opacity .2s'; // I161: no fade under reduced motion
  setUiScale(); // I70+I71: UI scale = fontScale x viewport (cascades to DOM overlays only; canvas unaffected)
  bloom.setEnabled(s.fx === 'high');
  if (audio.state() !== 'uninitialized') { audio.setVolume(s.volume); audio.setSfx(s.sfx); }
  audio.setMusic(s.music !== false); // I158: music bed toggle (ctx-free; bed driven in syncVisuals)
  applyColorblindPreview(s.colorblindPreview); // I158: deuteranopia canvas preview
  rockRenders.setShapeCues(s.shapeCues !== false); // I155: colorblind-friendly silhouette cues
  wardenMesh.setShapeCues(s.shapeCues !== false);
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

// ST-141: daily seeded run. One canonical calendar-day seed so every player today runs
// the identical board (comparable daily scores). dailyMode marks the active run as the
// daily one; restart re-seeds to the stored seed to reproduce it exactly.
let dailyMode = false;
let dailyKey = null;      // 'YYYY-MM-DD' for the active daily run (badge text)
let dailySeedVal = 0;     // the exact seed the active daily run started from
let dailyNewBest = false; // set on a daily game over when today's daily best was raised
let dailyMenu = { key: '', value: 0 }; // menu display info (today's daily best)
let _dailyMenuDay = '';
let _dailyDirty = true;
function refreshDailyMenu() {
  const key = dailyForDate(new Date(), CONFIG.daily.salt).key;
  const db = storage.getDailyBest();
  dailyMenu = { key, value: (db && db.key === key) ? db.value : 0 };
  _dailyMenuDay = key;
  _dailyDirty = false;
}
refreshDailyMenu();
function startRun(mode) {
  replayView = null; // ST-190
  newBest = false; popups.clear(); killFeed.clear(); dailyNewBest = false; juiceTally.reset(); // ST-183
  const firstRun = !storage.getTutorialSeen(); // I151: first entry to PLAYING
  if (firstRun) { tutorialActive = true; tutorial.show(); } // gate the sim while reading
  else hint.show(); // passive 6s hint on subsequent runs
  if (mode === 'daily') { const d = dailyForDate(new Date(), CONFIG.daily.salt); dailyMode = true; dailyKey = d.key; dailySeedVal = d.seed; world.reseed(d.seed); }
  else { dailyMode = false; dailyKey = null; dailySeedVal = 0; }
  world.begin();
}
function restartRun() {
  replayView = null; // ST-190
  newBest = false; popups.clear(); killFeed.clear(); hint.show(); dailyNewBest = false; juiceTally.reset(); // ST-183
  if (dailyMode) world.reseed(dailySeedVal); // ST-141: same seed -> reproduce today's run
  world.restart();
}

function startReplayView(data) { // ST-190: watch a replay (demo pilot or saved run) - deterministic playback
  const r = decodeReplay(data, { maxLen: CONFIG.replay.maxSteps });
  if (!r.ok) { console.warn('[replay] rejected:', r.error); return; }
  world.reset(); // -> MENU: clean systems + replayMode=false
  world.reseed(r.data.seed); // deterministic RNG for the watched run
  replayView = { player: createPlayer(r.data), data: r.data, speed: 1, idx: 0 };
  world.replayBegin(); // MENU -> REPLAY (replayMode=true + waves.start())
  newBest = false; popups.clear(); killFeed.clear(); vortexFx.hide(); juiceTally.reset();
}
function exitReplayView() { // ST-190: leave the watched run, back to a clean menu
  replayView = null; newBest = false; popups.clear(); killFeed.clear(); vortexFx.hide();
  world.reset(); // -> MENU
}
function restartReplay() { // ST-190: replay the same tape from step 0
  if (!replayView) return;
  const d = replayView.data;
  replayView = null;
  startReplayView(d);
}
function replayIntent() { // ST-190: next recorded intent (neutral past the end)
  const rv = replayView; if (!rv) return undefined;
  if (rv.idx >= rv.player.length) return { thrust: v2(0, 0), aimPoint: null, firing: false };
  return rv.player.intent(world, rv.idx++);
}

const screens = createScreens(document.body, {
  menu: menuSettings, pause: pauseSettings, touch: coarse, // I71: touch-aware menu
  actions: { // I68: pause overlay actions; I71: start for touch; ST-141: startDaily for the DAILY button
    start: () => startRun('normal'),
    startDaily: () => startRun('daily'),
    resume: () => { world.resume(); },
    restart: () => { if (replayView) restartReplay(); else restartRun(); }, // ST-190: restart the watched replay
    quit: () => { if (replayView) exitReplayView(); else { newBest = false; popups.clear(); vortexFx.hide(); world.quitToMenu(); } }, // ST-190
    showReplays: () => { const saved = storage.getReplays(); const list = [{ key: 'demo', label: 'DEMO PILOT', score: 0, wave: 0, kills: 0, time: 0, isDemo: true }]; saved.forEach((r2, i) => list.push({ key: i, label: 'SAVED RUN', score: r2.data.meta.score, wave: r2.data.meta.wave, kills: r2.data.meta.kills, time: r2.data.meta.time })); screens.openReplays(list); }, // ST-190
    startReplay: (k) => { if (k === 'demo') { startReplayView(demoReplay(CONFIG.replay.demoSeed, CONFIG.replay.demoLen)); return; } const saved = storage.getReplays(); if (saved[k]) startReplayView(saved[k].data); }, // ST-190
    closeReplays: () => screens.closeReplays(), // ST-190
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
const fovKick = createFovKick({ decay: CONFIG.fx.fovKick.decay, max: CONFIG.fx.fovKick.max }); // ST-082: dynamic FOV kick
let simT = 0; // sim-clock for timed visuals (invuln blink)
const flashEl = document.getElementById('flash'); // hit/bomb flash overlay (index.html)
const vignetteDangerEl = document.getElementById('vignette-danger'); // I85: red danger-edge vignette (opacity JS-driven; #vignette is static CSS)
const slowmoTintEl = document.getElementById('slowmo-tint'); // I116: cold-edge tint while slow-mo is active (index.html)
let flashA = 0;
let dangerA = 0;
let _rmHitT = -1; // ST-176: seconds elapsed since the last reduced-motion hit (-1 = none)
let _weaponFanfareN = 0; // ST-178: weapon level-up fanfires fired (probe; motion-gated branch)
let _rmHitSev = 0; // ST-176: severity of the pending reduced-motion vignette (0..1)
let _lastDangerOp = 0; // ST-176: last computed danger-vignette opacity (probe)
let slowmoT = 0; // I116: slow-mo tint ramp 0..1 // I85: transient danger spike on hit (gated by !motionOff like the flash)
function togglePause() { // ST-033: shared by keyboard and two-finger touch
  if (tutorialActive) return; // I151: can't pause while reading the first-run tutorial
  const st = world.game.state;
  if (st === STATE.PLAYING) world.pause();
  else if (st === STATE.REPLAY) world.pause(); // ST-190: P pauses a watched replay too
  else if (st === STATE.PAUSED) world.resume();
}
const input = createInput({ onPause: togglePause });
// I71: on-screen pause button (touch devices; shown during PLAYING only)
const pauseBtn = document.createElement('button');
pauseBtn.type = 'button';
pauseBtn.id = 'vr-pause-btn'; // I161: focus-ring selector
pauseBtn.setAttribute('aria-label', 'Pause');
pauseBtn.textContent = '\u275A\u275A';
pauseBtn.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:30;display:none;pointer-events:auto;cursor:pointer;box-sizing:border-box;align-items:center;justify-content:center;width:calc(46px * var(--vr-fs,1));height:calc(46px * var(--vr-fs,1));border-radius:50%;border:1px solid #2b4a8a;background:rgba(10,18,40,0.82);color:#cfe4ff;font-size:calc(14px * var(--vr-fs,1));font-weight:700;letter-spacing:2px;padding:0;';
pauseBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
pauseBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePause(); pauseBtn.blur(); });
document.body.appendChild(pauseBtn);

// Session keys (ST-017): Enter start/restart, P/Esc pause, M mute.
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (tutorialActive) { // I151: the first-run tutorial owns the keys while it is visible
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape' || e.key === 'p' || e.key === 'P') { e.preventDefault(); dismissTutorial(); }
    return;
  }
  const st = world.game.state;
  if (e.key === 'Enter') {
    // I37: side effects only on the transitions that use them - stray Enter
    // mid-game (PLAYING/PAUSED) must not clear popups or re-show the tutorial hint.
    const ae = document.activeElement;
    const onButton = !!(ae && ae.tagName === 'BUTTON'); // I165: a focused button owns Enter (DAILY, COPY RESULT, TAP) so its label is never lied to
    if (!onButton && st === STATE.MENU) {
      startRun('normal'); // ST-141: Enter starts a normal run (DAILY button for the daily run)
    } else if (!onButton && st === STATE.GAME_OVER) {
      if (replayView) exitReplayView(); else restartRun(); // ST-190: a finished replay quits to the menu; ST-141: reseed when daily so Enter reproduces today's run
    } else if (!onButton && st === STATE.PAUSED) { // I68: Enter resumes
      world.resume();
    }
  } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    togglePause();
  } else if (e.key === 'r' || e.key === 'R') { // I68: restart from pause
    if (st === STATE.PAUSED) { if (replayView) restartReplay(); else restartRun(); } // ST-190: restart the replay; ST-141: reseed when daily
  } else if (e.key === 'q' || e.key === 'Q') { // I68: quit from pause
    if (st === STATE.PAUSED) { if (replayView) exitReplayView(); else { newBest = false; popups.clear(); vortexFx.hide(); world.quitToMenu(); } } else if (st === STATE.GAME_OVER && replayView) exitReplayView(); // ST-190
  } else if (e.key === '1' || e.key === '2' || e.key === '3') { // ST-190: replay speed x1/x2/x4
    if (replayView && st === STATE.REPLAY) replayView.speed = e.key === '1' ? 1 : e.key === '2' ? 2 : 4;
  } else if (e.key === 'm' || e.key === 'M') {
    muted = !muted;
    audio.setMuted(muted);
  } else if (e.key === 'f' || e.key === 'F') { // I157: FX quality hotkey (HIGH <-> LOW)
    const next = toggleFxQuality(storage.getSettings().fx);
    const merged = storage.setSettings({ fx: next });
    applySettings(merged);
    adaptive.userSet(next); // I157: user choice overrides adaptive automation
    if (fxPreviewFn) fxPreviewFn(next); // ST-067: live particle preview
    menuSettings.sync();
    pauseSettings.sync();
    toast('FX ' + next.toUpperCase());
  } else if (e.key === 'n' || e.key === 'N') { // I171 (ST-171): music bed hotkey - PERSISTED (mirrors F), not session-only like M
    const next = !storage.getSettings().music;
    const merged = storage.setSettings({ music: next });
    applySettings(merged);
    menuSettings.sync();
    pauseSettings.sync();
    toast('MUSIC ' + (next ? 'ON' : 'OFF'));
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
const eventTally = {}; const juiceTally = createJuiceTally(); // ST-183: per-run feel-channel tally (probe: __vr.juiceTally())
// Deterministic advance for smoke tests + the I076 harness: runs N fixed substeps
// (world.step + event drain + visual sync) independent of display rate.
function advance(simSeconds, intent = { thrust: v2(0, 0), aimPoint: null, firing: false }) {
  const n = Math.max(1, Math.round(simSeconds / STEP));
  for (let i = 0; i < n; i++) tick(STEP, (replayView && world.game.in(STATE.REPLAY)) ? replayIntent() : intent);
  syncVisuals(STEP);
}
window.__vr = { world, eventTally, juiceTally: () => juiceTally.snapshot(), input, advance, storage, particles, shipGroup: shipMesh.group, shipFlame: shipMesh.flame, shipFlameCore: shipMesh.flameCore, applySettings, liveSettings: () => liveSettings, audio, markAudioReady, banner, popups, hint, killFeed, tutorial, tutorialActive: () => tutorialActive, dismissTutorial, bloom, reticle, bullets, shieldRing, rockRenders, mineRenders, droneRenders, bossMesh, wardenMesh, bossHealth, assetLoader, enemyBulletRenders, stars, vortexFx, fpsMeter, debugOverlay, adaptive, punch, camera, camLook, camPos, fovKick, toastEl, renderer, render: () => renderer.render(scene, camera) }; // debug/test handle (expanded in I080; ST-059: vortexFx)

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
// I189: decision moved to the pure core visibilityAction (unit-tested in tests/visibilityPause.test.js);
// named handler so browser evidence can drive the REAL path (see the simVisibility probe below).
// NO auto-resume on 'visible' by design - a surprise resume across a tab switch can kill the ship while
// the player is looking away; the player resumes deliberately (P/Enter). Same policy as I187 ctx-restore.
function onVisibilityChange() {
  if (visibilityAction(document.visibilityState, world.game.state) === 'pause') world.pause();
}
document.addEventListener('visibilitychange', onVisibilityChange);
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
ctxBtn.id = 'vr-ctx-btn'; // I161: focus-ring selector
ctxBtn.textContent = 'RELOAD GAME';
ctxBtn.style.cssText = 'margin-top:8px;font:calc(14px * var(--vr-fs,1))/1 ui-monospace,monospace;letter-spacing:.12em;color:#0a0f1e;background:#9fb4d8;border:0;border-radius:4px;padding:10px 22px;cursor:pointer;';
ctxBtn.addEventListener('click', () => { location.reload(); });
ctxOverlay.appendChild(ctxTitle);
ctxOverlay.appendChild(ctxStatus);
ctxOverlay.appendChild(ctxBtn);
// I161: the gold focus ring also covers the two standalone <button>s (in-game pause + context-loss reload).
document.head.appendChild(Object.assign(document.createElement('style'), { textContent: '#vr-pause-btn:focus-visible,#vr-ctx-btn:focus-visible{outline:2px solid #ffe08a;outline-offset:2px;}' }));
document.body.appendChild(ctxOverlay);
let ctxRestoreTimer = 0;
// I187: named handlers (were inline arrows) so the re-init path is probeable, and a
// ctxLost flag so the frame loop fully stops while the context is dead.
let ctxLost = false;
let framesRendered = 0; // I187: loop-work counter (probe) - frozen while the context is lost
function onCtxLost(e) {
  e.preventDefault(); // mark the context as restorable
  ctxLost = true; // I187: the loop guard below skips sim + render until restored
  if (world.game.state === STATE.PLAYING) world.pause();
  ctxOverlay.style.display = 'flex'; // I75
  ctxStatus.textContent = 'The browser dropped the 3D rendering context. It usually comes back on its own - please wait.';
  clearTimeout(ctxRestoreTimer);
  ctxRestoreTimer = setTimeout(() => { // I75: no restore yet - escalate
    ctxStatus.textContent = 'Still no signal after 10s. If it does not come back, reload the game.';
  }, 10000);
}
function onCtxRestored() {
  clearTimeout(ctxRestoreTimer); // I75
  renderer.setSize(window.innerWidth, window.innerHeight);
  bloom.resize(window.innerWidth, window.innerHeight); // composer render targets died with the GL context; resize re-creates them (three.js re-uploads geoms/texs/programs lazily on the first post-restore render)
  renderer.info.reset();
  clock.reset(performance.now()); // I187: re-init path - stall time discarded, no dt spike on the first restored frame (ST-078 clamp is the backstop)
  ctxLost = false;
  ctxOverlay.style.display = 'none'; // I75: back to normal (pause screen takes over if the game was running)
}
renderer.domElement.addEventListener('webglcontextlost', onCtxLost);
renderer.domElement.addEventListener('webglcontextrestored', onCtxRestored);
window.__vr.ctxLost = () => ctxLost; // I187: probe
window.__vr.simCtxLost = () => onCtxLost({ preventDefault() {} }); // I187: exercise the real handler path without an actual GL loss (smoke/debug only)
window.__vr.simCtxRestore = () => onCtxRestored(); // I187
window.__vr.framesRendered = () => framesRendered; // I187: loop-work counter (frozen while the context is lost)
window.__vr.ctxOverlay = ctxOverlay; // I75: expose after declaration (TDZ-safe)
window.__vr.clockState = () => clock.state(); // I188: ST-078 clock internals probe (context-loss evidence: reset discards the stall) - called post-load only (TDZ-safe)
window.__vr.simVisibility = (v) => { // I189: drive the REAL visibility handler with a synthetic document.visibilityState (smoke/debug only)
  Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
  try { onVisibilityChange(); } finally { delete document.visibilityState; }
  return world.game.state;
};
window.__vr.applyColorblindPreview = (on) => applyColorblindPreview(on); // I158: probe
window.__vr.slowmoHintEl = slowmoHintEl; // I158: probe
window.__vr.musicOn = () => audio.musicOn(); // I158: probe
window.__vr.musicChord = () => audio.musicChord(); // I169: probe
window.__vr.musicIntensity = (x) => audio.musicIntensity(x); // I169: probe
window.__vr.musicIntensityVal = () => audio.musicIntensityVal(); // I170: probe
window.__vr.timeWarp = (x, o) => audio.timeWarp(x, o); window.__vr.warpCents = () => audio.warpCents(); // I172: probes
window.__vr.deathWarpT = () => _deathWarpT; // I174: probe (seconds left of the death-slow-mo window)
window.__vr.shakeEnergy = (t) => shakeEnergy(t, CONFIG.fx.shakeTable); // ST-175: probe (table energy for an event type)
window.__vr.flashEnergy = (t) => flashEnergy(t, CONFIG.fx.flashTable); // ST-179: probe (table flash bump for an event type)
window.__vr.shakeMag = () => shake.magnitude(); // ST-175: probe (current shake energy 0..1)
window.__vr.dangerOp = () => _lastDangerOp; // ST-176: probe (current danger-vignette opacity 0..1)
window.__vr.particleLive = () => particles.live; // ST-177: probe (live particle count)
window.__vr.magnetPullCount = () => world.powerups.drops.filter((d) => !d.dead && d.magnetPull).length; // ST-177: probe (orbs currently magnet-pulled)
window.__vr.weaponFanfareN = () => _weaponFanfareN; // ST-178: probe (fanfires fired; increments only in the motion-ON branch)
window.__vr.lastShare = () => screens.lastShare(); // I159: probe
window.__vr.replayView = () => replayView && { idx: replayView.idx, length: replayView.player.length, speed: replayView.speed, meta: replayView.data.meta }; // ST-190: probe
window.__vr.startReplay = (d) => startReplayView(d); // ST-190: probe
window.__vr.exitReplay = () => exitReplayView(); // ST-190: probe
window.__vr.demoReplay = () => demoReplay(CONFIG.replay.demoSeed, CONFIG.replay.demoLen); // ST-190: probe
window.__vr.replayHud = replayHud; // ST-190: probe

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
  if (tutorialActive) return; // I151: freeze the sim while the first-run tutorial is up (render keeps going)
  if (!intent) input.tick(dt); // ST-033: decay touch fire-tail / pause cooldown
  const it = intent || { thrust: input.state.thrust, aimPoint: resolveAimPoint(), firing: input.state.firing };
  world.step(dt, it);
  for (const e of world.drainEvents()) {
    eventTally[e.type] = (eventTally[e.type] || 0) + 1;
    const cue = e.type === 'powerup' && e.data && e.data.type === 'slowmo' ? 'slowmo' : e.type === 'powerup' && e.data && e.data.type === 'overdrive' ? 'overdrive' : SFX_CUES[e.type]; // ST-057, I173: slow-mo pickup gets the cold shimmer
    if (cue) audio.sfx(cue, e.data && e.data.pos ? e.data.pos : null);
    if (e.type === 'wave') banner.showWave(e.data.n, e.data.mod, e.data.endless);
    else if (e.type === 'waveCleared') banner.showCleared(e.data.n);
    else if (e.type === 'bossSpawn') { banner.showBoss(e.data.wave, e.data.hp, e.data.kind === 'splicer' ? 'THE SPLICER' : 'THE MONOLITH', e.data.kind); if (e.data.kind === 'splicer') toast('SPLICER INBOUND'); } // I154: kind for variant glow // ST-135/143: boss intro (+ Splicer callout)
    else if (e.type === 'wardenSpawn') toast('WARDEN INBOUND'); // ST-137: mini-boss callout
    else if (e.type === 'kill') { popups.add(e.data.pos.x, e.data.pos.y, '+' + e.data.points, { big: e.data.multiplier >= 2 || e.data.golden || e.data.boss, gold: !!e.data.golden, od: !!e.data.overdrive }); killFeed.add(e.data); } // ST-030/052, I153
    else if (e.type === 'nearmiss') popups.add(e.data.pos.x, e.data.pos.y, '+' + e.data.points); // ST-053 (plain small popup)
    else if (e.type === 'weaponLevelUp') toast('WEAPON LEVEL ' + e.data.level); // ST-123
    if (!motionOff) {
      if (e.type === 'kill') particles.burst(e.data.pos.x, e.data.pos.y, { count: e.data.golden ? Math.ceil(fxCount * 1.5) : fxCount, palette: e.data.golden ? CONFIG.fx.palette.golden : CONFIG.fx.palette.rock, speed: 9, life: 0.5 }); // ST-052
      else if (e.type === 'nearmiss') particles.burst(e.data.pos.x, e.data.pos.y, { count: Math.max(4, Math.ceil(fxCount * 0.25)), palette: CONFIG.fx.palette.graze, speed: 5, life: 0.3 }); // ST-053 subtle graze wisp
      else if (e.type === 'mineExplode') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount, palette: CONFIG.fx.palette.mine, speed: 10, life: 0.5 }); shake.trigger(shakeEnergy('mineExplode', CONFIG.fx.shakeTable)); flashA = Math.min(0.8, flashA + flashEnergy('mineExplode', CONFIG.fx.flashTable)); juiceTally.record('mineExplode', { shake: 1, flash: 1 }); } // ST-054/ST-175
      else if (e.type === 'droneExplode') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount, palette: CONFIG.fx.palette.drone, speed: 9, life: 0.45 }); shake.trigger(shakeEnergy('droneExplode', CONFIG.fx.shakeTable)); flashA = Math.min(0.8, flashA + flashEnergy('droneExplode', CONFIG.fx.flashTable)); juiceTally.record('droneExplode', { shake: 1, flash: 1 }); } // ST-117/ST-175 seeker burst
else if (e.type === 'droneDecay') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount ? Math.max(4, fxCount >> 1) : 0, palette: CONFIG.fx.palette.drone, speed: 5, life: 0.6 }); } // I129: seeker battery self-destruct - small cyan fizzle, no shake, honors FX tier off
      else if (e.type === 'bossSpawn') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount, palette: CONFIG.fx.palette.boss, speed: 8, life: 0.7 }); shake.trigger(shakeEnergy('bossSpawn', CONFIG.fx.shakeTable)); flashA = Math.min(0.8, flashA + flashEnergy('bossSpawn', CONFIG.fx.flashTable)); juiceTally.record('bossSpawn', { shake: 1, flash: 1 }); } // ST-055/ST-175
      else if (e.type === 'bossRing') particles.burst(e.data.pos.x, e.data.pos.y, { count: Math.ceil(fxCount * 0.6), palette: CONFIG.fx.palette.boss, speed: 7, life: 0.4, shape: 'ring' }); // ST-055
      else if (e.type === 'bossDeath') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount * 2, palette: CONFIG.fx.palette.bossKill, speed: 14, life: 0.8, shape: 'ring' }); shake.trigger(shakeEnergy('bossDeath', CONFIG.fx.shakeTable)); flashA = Math.min(0.8, flashA + flashEnergy('bossDeath', CONFIG.fx.flashTable)); hitStop = Math.max(hitStop, CONFIG.fx.hitStop.bossDeath); punch.trigger({ x: 0, y: 0.7, z: 0.5 }, 1.0); fovKick.trigger(CONFIG.fx.fovKick.bossDeath); juiceTally.record('bossDeath', { shake: 1, flash: 1, hitStop: 1, punch: 1, fovKick: 1 }); } // ST-055/ST-081/ST-082
      else if (e.type === 'wardenSpawn') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount, palette: CONFIG.fx.palette.boss, speed: 8, life: 0.6 }); shake.trigger(shakeEnergy('wardenSpawn', CONFIG.fx.shakeTable)); flashA = Math.min(0.8, flashA + flashEnergy('wardenSpawn', CONFIG.fx.flashTable)); juiceTally.record('wardenSpawn', { shake: 1, flash: 1 }); } // ST-137/ST-175: mini-boss arrival
      else if (e.type === 'wardenArmor') particles.burst(e.data.pos.x, e.data.pos.y, { count: Math.max(6, Math.ceil(fxCount * 0.4)), palette: CONFIG.fx.palette.shield, speed: 6, life: 0.3 }); // ST-137: armor ping (mirrors rockShieldHit)
      else if (e.type === 'wardenDeath') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount * 2, palette: CONFIG.fx.palette.bossKill, speed: 12, life: 0.7, shape: 'ring' }); shake.trigger(shakeEnergy('wardenDeath', CONFIG.fx.shakeTable)); flashA = Math.min(0.8, flashA + flashEnergy('wardenDeath', CONFIG.fx.flashTable)); hitStop = Math.max(hitStop, CONFIG.fx.hitStop.bossDeath * 0.6); punch.trigger({ x: 0, y: 0.7, z: 0.5 }, 0.7); fovKick.trigger(CONFIG.fx.fovKick.bossDeath * 0.6); juiceTally.record('wardenDeath', { shake: 1, flash: 1, hitStop: 1, punch: 1, fovKick: 1 }); } // ST-137
      else if (e.type === 'bossFire') particles.burst(e.data.pos.x, e.data.pos.y, { count: 5, palette: CONFIG.fx.palette.mine, speed: 4, life: 0.25 }); // ST-056 muzzle
      else if (e.type === 'mineFire') particles.burst(e.data.pos.x, e.data.pos.y, { count: 4, palette: CONFIG.fx.palette.mine, speed: 3, life: 0.2 }); // ST-056 muzzle
      else if (e.type === 'powerup' && e.data.type === 'overdrive') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount, palette: CONFIG.fx.palette.power, speed: 8, life: 0.5, shape: 'fountain' }); flashA = Math.min(0.8, flashA + flashEnergy('overdrive', CONFIG.fx.flashTable)); juiceTally.record('overdrive', { flash: 1 }); } // ST-057 pickup flash
      else if (e.type === 'powerup') { const puColor = CONFIG.fx.palette.pickup[e.data.type]; if (puColor) particles.burst(e.data.pos.x, e.data.pos.y, { count: Math.max(8, Math.ceil(fxCount * 0.5)), color: puColor, speed: 7, life: 0.5, shape: 'radial' }); } // ST-177: per-type collect sparkle (overdrive keeps its fountain above)
      else if (e.type === 'weaponLevelUp') { const wl = Math.max(1, e.data.level || 1); const tier = CONFIG.fx.palette.bulletLevel[Math.max(0, Math.min(CONFIG.fx.palette.bulletLevel.length - 1, wl - 1))]; const sx = world.ship.pos.x, sy = world.ship.pos.y; particles.burst(sx, sy, { count: fxCount, color: tier, speed: 11, life: 0.6, shape: 'ring' }); particles.burst(sx, sy, { count: Math.ceil(fxCount * 0.7), color: tier, speed: 9, life: 0.7, shape: 'fountain' }); flashA = Math.min(0.8, flashA + CONFIG.fx.weaponFanfare.flash); punch.trigger({ x: 0, y: 0.7, z: 0.5 }, CONFIG.fx.weaponFanfare.punch); _weaponFanfareN++; juiceTally.record('weaponLevelUp', { flash: 1, punch: 1 }); } // ST-178: weapon level-up fanfare (tier-colored ring + fountain at the ship)
      else if (e.type === 'hit') {
        particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount, palette: CONFIG.fx.palette.hit, speed: 11, life: 0.45 });
        shake.trigger(shakeEnergy('hit', CONFIG.fx.shakeTable)); // ST-175
        flashA = Math.min(0.8, flashA + flashEnergy('hit', CONFIG.fx.flashTable));
        dangerA = Math.min(1, dangerA + (e.data.lives <= 1 ? 1 : 0.6)); // I85: last-life hit reads harder
        juiceTally.record('hit', { shake: 1, flash: 1 }); // ST-183
      } else if (e.type === 'shieldPop') particles.burst(e.data.pos.x, e.data.pos.y, { count: Math.ceil(fxCount * 0.75), palette: CONFIG.fx.palette.shield, speed: 8, life: 0.5, shape: 'ring' });
      else if (e.type === 'rockShieldHit') particles.burst(e.data.pos.x, e.data.pos.y, { count: Math.max(6, Math.ceil(fxCount * 0.4)), palette: CONFIG.fx.palette.shield, speed: 6, life: 0.3 }); // ST-127 armor-absorb sparks (cyan, subtle)
      else if (e.type === 'beltHit') particles.burst(e.data.pos.x, e.data.pos.y, { count: Math.max(4, Math.ceil(fxCount * 0.2)), palette: CONFIG.fx.palette.belt, speed: 4, life: 0.28 }); // ST-139 indestructible clink (cool steel, subtle, no shake)
      else if (e.type === 'bomb') {
        // I114: nova scales with the rocks cleared (small clear = tight, big clear = huge); anchored so the ~3-rock bomb keeps the old fxCount*2 intensity.
        const cleared = e.data.count || 0;
        const nova = Math.ceil(fxCount * (2 + (Math.min(cleared, 10) - 3) * 0.15));
        particles.burst(0, 0, { count: nova, palette: CONFIG.fx.palette.bomb, speed: 16, life: 0.7, shape: 'ring' });
        shake.trigger(shakeEnergy('bomb', CONFIG.fx.shakeTable)); // ST-175
        flashA = Math.min(0.8, flashA + flashEnergy('bomb', CONFIG.fx.flashTable));
        hitStop = Math.max(hitStop, CONFIG.fx.hitStop.bomb); punch.trigger({ x: 0, y: 0.7, z: 0.5 }, 0.8); // ST-081
        fovKick.trigger(CONFIG.fx.fovKick.bomb); // ST-082
        juiceTally.record('bomb', { shake: 1, flash: 1, hitStop: 1, punch: 1, fovKick: 1 }); // ST-183
      } else if (e.type === 'vortexTelegraph') particles.burst(e.data.pos.x, e.data.pos.y, { count: Math.ceil(fxCount * 0.4), palette: CONFIG.fx.palette.boss, speed: 2, life: 0.8 }); // ST-059 telegraph wisp
    }
    if (e.type === 'vortexTelegraph') { vortexFx.onTelegraph(e.data.pos); } // ST-059 (state always advances; particles above are motion-gated)
    else if (e.type === 'vortexStart') { vortexFx.onStart(e.data.pos); }
    else if (e.type === 'vortexEnd') { vortexFx.onEnd(); }
    else if (e.type === 'hit') { _deathWarpT = CONFIG.music.warp.death.dur; if (motionOff) { _rmHitT = 0; _rmHitSev = e.data.lives <= 1 ? 1 : 0.6; } } // I174: death-slow-mo audio window (state-agnostic like the vortex chain - it is audio, not motion); ST-176: reduced-motion damage vignette arm (steady-then-fade, mirrors the I85 juice severities; the juice spike + flash stay motion-gated)
    if (e.type === 'shieldPop') {
      shieldRing.pulse();
    } else if (e.type === 'gameover') {
      newBest = false; // ST-190: default; a live run raises it below (a watched replay must not touch the scoreboards)
      bestScore = storage.getBest();
      dailyNewBest = false; // ST-141
      if (!replayView) {
        newBest = storage.setBest(e.data.score); // true when the stored best was raised
        if (e.data.score > 0) { // I66: top-5 board (wave/kills from live world state)
          const rec = storage.recordScore({ score: e.data.score, wave: Math.max(1, world.wave), kills: world.scoreKeeper.kills });
          scoreRank = rec.rank; // I69
          refreshScoresText();
        }
        if (e.data.score > 0 && dailyMode) { // ST-141: daily best (same board today)
          const dr = storage.recordDaily(dailyKey, e.data.score);
          dailyNewBest = !!dr.newBest;
          _dailyDirty = true; // refresh the menu daily line when we return to the menu
        }
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
  fovKick.step(dt); // ST-082: FOV kick decays on every tick
}

const hudOpts = { best: 0 };
const screenOpts = { muted: false, best: 0, newBest: false };
let _musicIntensity = 0; // I170 (ST-170): last applied music-intensity x (change-cached)
let _timeWarp = 0; // I172 (ST-172): last applied time-warp x (change-cached)
let _deathWarpT = 0; // I174 (ST-174): seconds left of the death-slow-mo audio window
function syncVisuals(dt) {
  const st = world.game.state;
  let _deathClosed = false; // I174: the death-slow-mo window just ended this frame (forces one exact push)
  if (_deathWarpT > 0) { _deathWarpT = Math.max(0, _deathWarpT - dt); if (_deathWarpT === 0) _deathClosed = true; } // I174: decay the death-slow-mo window (state-agnostic so the tail settles even on the GAME_OVER frame)
  audio.ambience(st === STATE.PLAYING || st === STATE.REPLAY); // ST-083: ambience bed while playing; ST-190: + replay
  audio.music((st === STATE.PLAYING || st === STATE.REPLAY) && liveSettings.music !== false); // I158: music bed (PLAYING/REPLAY + setting); idempotent start/stop
  if (st === STATE.PLAYING || st === STATE.REPLAY) { const mx = musicIntensityX(world, CONFIG.music.intensity); if (Math.abs(mx - _musicIntensity) > 0.02) { _musicIntensity = mx; audio.musicIntensity(mx); } } else { _musicIntensity = 0; } // I170: escalate drone intensity from wave + boss (change-cached; reset off-PLAYING so a (re)start re-applies)
  if (st === STATE.PLAYING || st === STATE.REPLAY) { const wx = Math.max(timeWarpX(world.enemyScale()), _deathWarpT > 0 ? deathWarpX(_deathWarpT, CONFIG.music.warp.death.dur, CONFIG.music.warp.death.scale) : 0); if (_deathClosed || Math.abs(wx - _timeWarp) > 0.02) { _timeWarp = wx; audio.timeWarp(wx, CONFIG.music.warp); } } else { _timeWarp = 0; } // I172: bullet-time audio from the slow-mo power-up; I174: max() with the death-slow-mo window (deeper dilation wins; change-cached; forced exact push on window close - no stale sub-hysteresis tail; reset off-PLAYING)
  hud.setVisible(st === STATE.PLAYING || st === STATE.PAUSED || st === STATE.REPLAY);
  killFeed.setVisible(st === STATE.PLAYING || st === STATE.REPLAY); // I153: feed while playing; ST-190: + replay
  // I36: reuse opts objects instead of allocating per frame
  hudOpts.best = bestScore;
  screenOpts.muted = muted;
  screenOpts.fx = liveSettings.fx; // I157: pause screen F row
  screenOpts.music = liveSettings.music !== false; // I171: menu status row N part
  screenOpts.best = bestScore;
  screenOpts.newBest = newBest;
  screenOpts.reducedMotion = motionOff; // I65: menu polish (reduced-motion gates the new animations)
  screenOpts.scoresText = scoresText; // I66: top-5 table
  screenOpts.scoreRank = scoreRank; // I69: board rank on game over
  if (st === STATE.MENU) { const tk = dailyForDate(new Date(), CONFIG.daily.salt).key; if (tk !== _dailyMenuDay || _dailyDirty) refreshDailyMenu(); } // ST-141: refresh daily line on menu (day rollover / after a daily run)
  screenOpts.dailyMenu = dailyMenu; // ST-141
  screenOpts.dailyMode = dailyMode; // ST-141
  screenOpts.dailyKey = dailyKey; // ST-141
  screenOpts.dailyNewBest = dailyNewBest; // ST-141
  screenOpts.replayMode = !!replayView; // ST-190: game-over prompt text for finished replays
  replayHud.update({ visible: st === STATE.REPLAY, meta: replayView ? replayView.data.meta : null, idx: replayView ? replayView.idx : 0, length: replayView ? replayView.player.length : 0, speed: replayView ? replayView.speed : 1, reducedMotion: motionOff }); // ST-190
  hud.render(world, hudOpts);
  if (coarse && st === STATE.PLAYING) { if (pauseBtn.style.display !== 'flex') pauseBtn.style.display = 'flex'; } else if (pauseBtn.style.display !== 'none') pauseBtn.style.display = 'none'; // I71: on-screen pause button (touch, PLAYING only)
  screens.update(st, world, screenOpts);
  shipMesh.sync(world.ship, simT, !motionOff, Math.min(1, Math.hypot(input.state.thrust.x, input.state.thrust.y))); // ST-063 engine flame
  reticle.sync(world.ship, st === STATE.PLAYING); // I44: only while playing
  bullets.sync(world.weapons);
  bullets.setLevel(world.weaponLevel()); // ST-123
  rockRenders.sync(world.field, simT); // ST-139
  mineRenders.sync(world.mines, simT); // ST-054
  droneRenders.sync(world.drones, simT); // ST-117
  bossMesh.sync(world.boss, simT); // ST-055
  wardenMesh.sync(world.warden, simT); // ST-137
  bossHealth.sync(world.boss); // ST-055
  enemyBulletRenders.sync(world.enemyBullets, simT); // ST-056
  powerupRenders.sync(world.powerups, dt);
  if (!motionOff && st === STATE.PLAYING) { for (const d of world.powerups.drops) { if (d.dead || !d.magnetPull) continue; particles.burst(d.pos.x, d.pos.y, { count: 2, color: CONFIG.fx.palette.pickup.magnet, speed: 1.5, life: 0.35, shape: 'radial' }); } } // ST-177: magnet pull trail (motion-gated comet wisp behind the orb the magnet drags)
  shieldRing.sync(world, dt, !motionOff); // I62: freeze under reduced motion
  if (st === STATE.PLAYING) vortexFx.update(dt); // ST-059 (frozen while paused)
  particles.sync(dt);
  banner.sync(world.waves, dt, motionOff); // ST-028

  const ship = world.ship;
  const f = ship.forward(shipFwd); // ST-074: scratch reuse (no per-frame alloc)
  const spdFrac = Math.min(1, ship.speed / CONFIG.ship.maxSpeed); // ST-082: 0..1 speed fraction
  const ahead = CONFIG.camera.lookAhead + CONFIG.camera.lookAheadSpeed * spdFrac; // ST-082: speed-scaled look-ahead
  camPos.x = damp(camPos.x, ship.pos.x, 5, dt);
  camPos.y = damp(camPos.y, 9, 5, dt);
  camPos.z = damp(camPos.z, ship.pos.y + 13, 5, dt);
  camLook.x = damp(camLook.x, ship.pos.x + f.x * ahead, 6, dt); // ST-082: speed-scaled look-ahead
  camLook.y = damp(camLook.y, 0, 6, dt);
  camLook.z = damp(camLook.z, ship.pos.y + f.y * ahead, 6, dt); // ST-082: speed-scaled look-ahead
  camera.position.set(camPos.x, camPos.y, camPos.z);
  camera.lookAt(camLook.x, camLook.y, camLook.z);
  const targetFov = CONFIG.camera.fovBase + CONFIG.camera.fovSpeed * spdFrac + fovKick.value(); // ST-082: base + speed + kick
  if (Math.abs(targetFov - camera.fov) > 0.01) { // only touch the projection when it actually moves
    camera.fov = damp(camera.fov, targetFov, CONFIG.camera.fovDamp, dt);
    camera.updateProjectionMatrix();
  }
  shake.offset(shakeOff); // ST-025: apply shake after follow-camera (offset() writes in place)
  punch.offset(shakeOff); // ST-081: punch composes on top of shake (offset() adds in place)
  camera.position.x += shakeOff.x;
  camera.position.y += shakeOff.y;
  camera.position.z += shakeOff.z;
  stars.update(simT, camera, !motionOff); // I60: twinkle + parallax (frozen when reduced motion)
  popups.sync(dt, motionOff); // ST-030: after follow-camera + shake
  killFeed.sync(dt, motionOff); // I153
  hint.sync(dt, motionOff); // ST-032
  tutorial.sync(motionOff); // I151: reduced-motion gates the overlay animations
  if (flashA > 0) { // hit/bomb flash decay
    flashA = Math.max(0, flashA - dt * 2.2);
    if (flashEl) flashEl.style.opacity = String(flashA); // I43: #flash is optional in the DOM
  } else if (flashEl && flashEl.style.opacity !== '0') flashEl.style.opacity = '0';
  // I85: danger vignette - steady last-life tint + transient hit spike (spike gated off under reduced motion)
  if (dangerA > 0) dangerA = Math.max(0, dangerA - dt * 1.4);
  let _rmOp = 0; // ST-176: reduced-motion damage vignette (steady-then-fade, opacity only; decayed here so the final hit plays through GAME_OVER)
  if (_rmHitSev > 0) { _rmHitT += dt; _rmOp = _rmHitSev * dangerVignetteX(_rmHitT, CONFIG.fx.dangerVignette.hold, CONFIG.fx.dangerVignette.fade); if (_rmOp <= 0) _rmHitSev = 0; }
  const dangerOp = Math.max((st === STATE.PLAYING && world.lives <= 1) ? 0.55 : 0, dangerA, _rmOp);
  _lastDangerOp = dangerOp; // ST-176: probe value
  if (vignetteDangerEl) { const vo = dangerOp.toFixed(3); if (vignetteDangerEl.style.opacity !== vo) vignetteDangerEl.style.opacity = vo; }
  // I116: slow-mo tint - smooth ramp toward the active state (steady state indicator, reduced-motion safe)
  if (slowmoTintEl) {
    const smTarget = (st === STATE.PLAYING && world.powerups.active('slowmo')) ? 1 : 0;
    slowmoT = smTarget > slowmoT ? Math.min(1, slowmoT + dt * 5) : Math.max(0, slowmoT - dt * 5);
    const so = (slowmoT * 0.55).toFixed(3);
    if (slowmoTintEl.style.opacity !== so) slowmoTintEl.style.opacity = so;
  }
  // I158: slow-mo hint caption (setting-gated, PLAYING only)
  if (slowmoHintEl) {
    const smShow = st === STATE.PLAYING && liveSettings.slowmoHint !== false && (world.powerups.active('slowmo') || world.powerups.drops.some((d) => d.type === 'slowmo' && !d.dead));
    const ho = smShow ? '1' : '0';
    if (slowmoHintEl.style.opacity !== ho) slowmoHintEl.style.opacity = ho;
  }

  stars.rotation.y += dt * 0.004;
  if (fpsMeter) fpsMeter.sync(dt); // I36
}

function frame() {
  requestAnimationFrame(frame);
  if (ctxLost) return; // I187: context lost - stop sim + render (three.js render() is a no-op while lost anyway; this also skips tick/sync/info/adaptive overhead). onCtxRestored resets the clock, so no dt spike on the first restored frame.
  const now = performance.now();
  const cur = world.game.state;
  if (prevState === STATE.PAUSED && (cur === STATE.PLAYING || cur === STATE.REPLAY)) clock.reset(now); // ST-078: no accumulated dt carried into resume; ST-190: + replay resume
  const r = clock.tick(now); // ST-078: fixed-timestep clock (clamped dt, dropped backlog)
  const frameDt = r.dt;
  if (hitStop > 0 && cur === STATE.PLAYING) { // ST-081: hit-stop - freeze the sim, keep rendering
    hitStop = Math.max(0, hitStop - frameDt);
    clock.reset(now); // discard accumulated sim time during the freeze (no catch-up burst)
  } else {
    if (hitStop > 0) hitStop = 0; // event fired but we are not PLAYING - discard the freeze
    const isReplay = replayView && cur === STATE.REPLAY; // ST-190
    const nSteps = isReplay ? r.steps * replayView.speed : r.steps;
    for (let i = 0; i < nSteps; i++) tick(STEP, (replayView && world.game.in(STATE.REPLAY)) ? replayIntent() : undefined);
  }
  prevState = cur;
  if (world.game.state === STATE.PLAYING || world.game.state === STATE.REPLAY) adaptive.noteFrame(frameDt); // ST-073: adaptive quality (real frame dt, PLAYING/REPLAY)
  syncVisuals(frameDt); // I36: reads previous frame GPU stats
  renderer.info.reset(); // I36: clear before this frame accumulates (autoReset off)
  bloom.render();
  framesRendered++; // I187
  if (debugOverlay) { // I80: sample this frame's GPU stats + entity pools (post-bloom = full frame)
    const gi = renderer.info.render;
    debugOverlay.update(frameDt, {
      drawcalls: gi.calls, tris: gi.triangles,
      rocks: world.field.rocks.length, rockCap: CONFIG.asteroid.maxConcurrent,
      bullets: world.weapons.bullets.length, bulletCap: CONFIG.weapon.maxBullets,
      eb: world.enemyBullets.count, ebCap: CONFIG.enemyBullets.maxConcurrent,
      mines: world.mines.count, mineCap: CONFIG.mine.maxConcurrent,
      drones: world.drones.count, droneCap: CONFIG.drone.maxConcurrent,
      drops: world.powerups.drops.length, dropCap: CONFIG.powerup.maxActiveDrops,
      boss: world.boss && world.boss.alive ? 1 : 0,
      state: world.game.state,
    });
  }
}
frame();







