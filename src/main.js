﻿﻿// Void Runner - boot (I12: World orchestrator drives ship/weapons/asteroids/collisions)
import * as THREE from 'three';
import { createStarfield } from './render/starfield.js';
import { createSkybox } from './render/skybox.js'; // I212
import { createArenaRing } from './render/arenaRing.js'; // I212
import { createArenaFloorGrid } from './render/arenaFloor.js'; // ST-257 (I269)
import { createFloorDisc } from './render/floorDisc.js'; // ST-277 (I294)
import { createEngineTrail } from './core/engineTrail.js'; // I213
import { createShipMesh } from './render/shipMesh.js';
import { createInput } from './render/input.js';
import { createBulletPool } from './render/bulletPool.js';
import { createAsteroidRenderer } from './render/asteroidRenderer.js';
import { createAssetLoader } from './render/assetLoader.js'; // I104
import { createMineRenderer } from './render/mineMesh.js';
import { createDroneRenderer } from './render/droneMesh.js'; // ST-117
import { createBossMesh } from './render/bossMesh.js';
import { createWardenMesh } from './render/wardenMesh.js'; // ST-137
import { createStingerRenderer } from './render/stingerMesh.js'; // ST-229
import { createFlyerRenderer } from './render/flyerMesh.js'; // ST-232
import { createBossHealth } from './render/bossHealth.js';
import { createEnemyBulletRenderer } from './render/enemyBulletMesh.js';
import { createPowerupRenderer } from './render/powerupMesh.js';
import { createShieldRing } from './render/shieldRing.js';
import { createVortexFx } from './render/vortexFx.js'; // ST-059
import { createParticles } from './render/particles.js';
import { createShockwaves } from './render/shockwave.js'; // ST-238 (I245): pooled additive shockwave ring
import { createShake, createPunch, createFovKick } from './core/fx.js'; // ST-081/ST-082
import { createJuiceTally } from './core/juiceTally.js'; // ST-183: per-run juice-channel tally (feel telemetry)
import { killPunchEnergy, killPunchDir } from './core/killPunch.js'; // ST-221 (I224): class-scaled kill punch (T4)
import { shockwaveRadius } from './core/shockwave.js'; // ST-238 (I245): class-scaled ring sizes (pure core)
import { shakeEnergy } from './core/shakeTable.js'; // ST-175: unified screen-shake table lookup
import { flashEnergy } from './core/flashTable.js'; // ST-179: unified white-flash bump table lookup
import { dangerVignetteX } from './core/dangerVignette.js'; // ST-176: reduced-motion damage vignette envelope
import { createHUD } from './render/hud.js';
import { createReticle } from './render/reticle.js';
import { createTouchStick } from './render/touchStick.js'; // ST-321 (I351): on-screen thrust stick (coarse-only)
import { createScreens } from './render/screens.js';
import { createSettingsPanel } from './render/settingsPanel.js';
import { createAudio } from './render/audio.js';
import { createHaptics } from './render/haptics.js'; // ST-322 (I353): touch haptics (coarse + feature-gated; iOS Safari no-op)
import { createWaveBanner } from './render/waveBanner.js';
import { createScorePopups } from './render/scorePopups.js';
import { createTutorialHint } from './render/tutorialHint.js';
import { createTutorialOverlay } from './render/tutorialOverlay.js'; // I151: first-run tutorial
import { createKillFeed } from './render/killFeed.js'; // I153: kill feed
import { decodeReplay, demoReplay, createPlayer, createRecorder } from './core/replay.js'; // ST-190: replay codec + demo pilot; ST-191: recorder
import { createReplayHud } from './render/replayHud.js'; // ST-190: replay HUD bar
import { createRecIndicator } from './render/recIndicator.js'; // ST-191: REC chip
import { recordingAction, shouldSaveOnGameOver } from './core/recording.js'; // ST-191: recording decisions (pure core)
import { createBloom } from './render/bloom.js';
import { createFpsMeter } from './render/fpsMeter.js';
import { createDebugOverlay } from './render/debugOverlay.js'; // ST-080
import { createAdaptiveQuality } from './core/adaptiveQuality.js'; // ST-073
import { dprForTier } from './core/dprTier.js'; // ST-225: load-reactive DPR (pure core)
import { createClock } from './core/clock.js'; // ST-078
import { visibilityAction } from './core/visibilityPause.js'; // I189: pure visibility-pause decision (unit-tested)
import { t as tr, setLocale, onLocale, getLocale } from './core/strings.js'; // I404: ST-374 + I405: ST-375 locale switching
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
// ST-236 (I243): renderer color/tone pipeline from config (pre-pass three defaults: NoToneMapping + implicit sRGB output).
// The composer path applies the curve in the OutputPass (bloom threshold stays in linear space); the Low-tier direct
// render applies it in the material shaders - same curve on both tiers.
renderer.toneMapping = CONFIG.render.tone.mapping === 'acesFilmic' ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
renderer.toneMappingExposure = CONFIG.render.tone.exposure;
renderer.outputColorSpace = THREE.SRGBColorSpace; // explicit - the r152+ default, made visible (the ST-236 contract names it)
// I36: keep per-frame GPU stats across all composer passes (autoReset would zero them per pass)
renderer.info.autoReset = false;
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04060f);
scene.fog = new THREE.Fog(0x04060f, 60, 240);
const skybox = createSkybox(scene, 'assets/skybox_equirect.jpg', (tex) => { // I212 (I230: 1024x512 JPEG, Blender node-bake v5): equirect sky - fire-and-forget, flat-color fallback
  // I213: PBR-lite IBL - bake the sky into a PMREM env map so the MeshStandard rocks/ship/belt pick up nebula
  // reflections (they previously only had hemisphere+ambient+directional). envMapIntensity is kept low so
  // hull speculars stay under the bloom threshold (0.72) - only intended glows bloom.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  scene.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (m.isMeshStandardMaterial) m.envMapIntensity = CONFIG.fx.env.intensity; });
    rockRenders.setEnvIntensity(CONFIG.fx.env.rock); // I257 final: rock=0.0 decouples rocks from nebula IBL; ship/belt keep the 0.35 fill
    skySettled = true; warmUp(); // E48 (ST-371, I401): env map settled - arm the both-settle warm gate
});

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

// I257: warm-key / neutral-fill light set (was cool blue wash: 0x33437a hemi + 0x8899ff ambient +
// white key). Periwinkle incident (E18/ST-247) final root cause: the COOL RIM TERM alone (rim-off
// A/B: rocks read warm R79/G55/B37 vs rim-on R112/G111/B133). Key is camera-side (3,9,10) so
// camera-facing facets get N-L ~0.7 of the warm light (was (6,12,4) ~0.28).
scene.add(new THREE.HemisphereLight(0x4a4a5e, 0x2e2a26, 0.50)); // neutral-cool sky / warm ground
scene.add(new THREE.AmbientLight(0x96908a, 0.30)); // warm neutral fill
const dir = new THREE.DirectionalLight(0xffe2c4, 1.25); // warm key
dir.position.set(3, 9, 10); // I257 final: camera-side key (see comment above)
scene.add(dir);

const floorDisc = createFloorDisc(scene, CONFIG.arena); // ST-277 (I294): thin radial depth disc under the grid (1 draw call / 48 tris; documented MENU 20/318 -> 21/366 delta)
const grid = createArenaFloorGrid(scene, CONFIG.arena); // ST-257 (I269): warm sparse floor grid + radial falloff (1 draw call; was PolarGridHelper ST-248)
const arenaRing = createArenaRing(scene, CONFIG.arena.radius); // I212: boundary ring just above the grid

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
const stingerRenders = createStingerRenderer(scene); // ST-229
const flyerRenders = createFlyerRenderer(scene); // ST-232
// I104: GLB assets (Blender pass) - fire-and-forget load with procedural
// fallback: renderers start procedural and each asset swaps in as it loads.
const assetLoader = createAssetLoader();
assetLoader.onAsset((name, entry) => {
  if (!entry.ready) return;
  if (name === 'ship') shipMesh.useGLB(entry.object);
  else if (name === 'rockL') rockRenders.setGLB('L', entry.object);
  else if (name === 'rockM') rockRenders.setGLB('M', entry.object);
  else if (name === 'rockS') rockRenders.setGLB('S', entry.object);
  else if (name === 'rockComet') rockRenders.setCometGLB(entry.object); // I344 (ST-316): comet variant
  else if (name === 'boss') bossMesh.useGLB(entry.object);
  else if (name === 'shield') rockRenders.setShieldGLB(entry.object); // I210: armor plates
  else if (name === 'puRapid') powerupRenders.setGLB('rapid', entry.object); // I211
  else if (name === 'puSpread') powerupRenders.setGLB('spread', entry.object);
  else if (name === 'puShield') powerupRenders.setGLB('shield', entry.object);
  else if (name === 'puBomb') powerupRenders.setGLB('bomb', entry.object);
  else if (name === 'puMagnet') powerupRenders.setGLB('magnet', entry.object);
  else if (name === 'puOverdrive') powerupRenders.setGLB('overdrive', entry.object);
  else if (name === 'puSlowmo') powerupRenders.setGLB('slowmo', entry.object);
  else if (name === 'drone') droneRenders.useGLB(entry.object); // I211
  else if (name === 'warden') wardenMesh.useGLB(entry.object); // I220: armored sentinel (hull + armor plate)
else if (name === 'stinger') stingerRenders.useGLB(entry.object); // ST-230: Blender stinger (pre-wired hook)
else if (name === 'flyer') flyerRenders.useGLB(entry.object); // ST-234: Blender flyer (pre-wired hook)
  else if (name === 'arenaRing') arenaRing.useGLB(entry.object); // I212
  else if (name === 'floorSurface') { // ST-327 (I358): Blender floor texture over the procedural canvas (unlit MeshBasic, toneMapped false, tier-independent)
    if (floorDisc) {
      const oldFloorTex = floorDisc.material.map;
      floorDisc.material.map = entry.texture;
      if (oldFloorTex) oldFloorTex.dispose();
    }
  }
});
// E48 (ST-370, I400): W1 pre-compile - once all asset jobs settle (every GLB swap-in
// done), compile the shader programs of every in-scene material. r160 renderer.compile
// traverses the whole scene (not traverseVisible), so hidden pool meshes (bullets,
// enemy classes, powerups, fx pools) are covered too: no render, +0 draw calls, no
// pixel change. Moves first-use compile cost off the first gameplay frames (I399 s3:
// 71.5 ms transition spike) onto boot, while the user waits for the menu. Materials
// already compiled by the first frame are cheap cache hits. Non-fatal on failure
// (lazy compile stays the fallback).
function warmCompile() {
  try {
    renderer.compile(scene, camera);
  } catch (e) {
    console.warn('E48 warmCompile: pre-compile failed (non-fatal):', e);
  }
}
// E48 (ST-371, I401): W2 hidden warm-up render - one offscreen pass to a 1x1 target with all visible=false
// objects temporarily force-visible: first geometry buffer uploads + any remaining program compiles happen
// now (during menu load) instead of on the first PLAYING frame. 1x1 = no screen flash, negligible raster
// cost. R-E48-3: renderer.info is reset around it so the warm render never pollutes frame stats (boot =
// MENU, and the adaptive monitor only notes PLAYING/REPLAY frames - double protection).
function warmRender() {
  try {
    const hidden = [];
    scene.traverse((o) => { if (o.visible === false) hidden.push(o); });
    for (const o of hidden) o.visible = true;
    const target = new THREE.WebGLRenderTarget(1, 1);
    renderer.info.reset();
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.info.reset();
    target.dispose();
    for (const o of hidden) o.visible = false;
  } catch (e) {
    console.warn('E48 warmRender: hidden warm-up render failed (non-fatal):', e);
  }
}
// E48 (ST-371, I401): both-settle gate - the skybox onReady sets scene.environment (PMREM IBL), which
// changes every MeshStandardMaterial program cache key, so warming before it lands would recompile the
// env variant at first combat use (I400: programs 43->44 mid-transition). The 4 s fallback covers the
// skybox-FAILURE path (handle.ready stays false -> no env map ever -> warming without it is correct).
let assetsSettled = false, skySettled = false, warmDone = false;
function warmUp() {
  if (warmDone || !(assetsSettled && skySettled)) return;
  warmDone = true;
  warmCompile();
  warmRender();
}
assetLoader.loadAll().then(() => { assetsSettled = true; warmUp(); });
setTimeout(() => { skySettled = true; warmUp(); }, 4000); // E48 I401: skybox-failure fallback (no env map; warming still correct)
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
const recChip = createRecIndicator(document.body); // ST-191: REC chip while a run is being recorded
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
let recorder = null; // ST-191: createRecorder for the current live run (null = not recording)
let recStopped = false; // ST-191: user pressed O to stop (tape frozen; still saved on game over)
let runSeed = 0; // ST-191: the seed the current run started with (the replay reseed must match it)
let watchSavedRun = false; // ST-191: the just-ended run was recorded + saved -> WATCH RUN button
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
const SFX_CUES = { fire: 'shoot', kill: 'kill', hit: 'hit', powerup: 'powerup', shieldPop: 'shieldPop', bomb: 'bomb', wave: 'wave', waveCleared: 'cleared', gameover: 'gameover', nearmiss: 'swish', mineExplode: 'mine', bossSpawn: 'bossSpawn', bossRing: 'bossRing', bossDeath: 'bossDeath', bossFire: 'bossFire', mineFire: 'mineFire', vortexTelegraph: 'vortexTelegraph', vortexStart: 'vortexStart', droneExplode: 'drone', weaponLevelUp: 'levelUp', rockShieldHit: 'shieldHit', droneDecay: 'droneDecay', wardenSpawn: 'wardenSpawn', wardenArmor: 'shieldHit', wardenDeath: 'wardenDeath', beltHit: 'shieldHit', stingerTelegraph: 'stingerTelegraph', stingerCharge: 'swish', stingerDeath: 'stingerDeath', stingerFizzle: 'droneDecay', flyerSpawn: 'flyerSpawn', flyerDeath: 'flyerDeath', flyerExit: 'droneDecay' }; // ST-232: flyer cues (exit reuses the seeker decay) // ST-229: charger cues (charge whoosh reuses swish; fizzle reuses the seeker decay) // ST-059/ST-117/ST-123/ST-127/ST-129/ST-137, I173: decay + warden get their own cues (warden armor keeps shieldHit)

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
const haptics = createHaptics(coarse); // ST-322 (I353): touch haptics - coarse + feature-gated; pulse() is a no-op on fine pointers and where navigator.vibrate is absent
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
slowmoHintEl.textContent = tr('toast.slowmo');
slowmoHintEl.style.cssText = 'position:fixed;left:50%;bottom:104px;transform:translateX(-50%);z-index:40;pointer-events:none;font:calc(12px * var(--vr-fs,1))/1.4 ui-monospace,monospace;letter-spacing:.06em;color:#9fe8ff;background:rgba(6,20,30,0.66);padding:5px 12px;border-radius:5px;border:1px solid rgba(159,232,255,0.35);opacity:0;transition:opacity .2s;';
document.body.appendChild(slowmoHintEl);
onLocale(() => { slowmoHintEl.textContent = tr('toast.slowmo'); }); // ST-375: registered BEFORE the boot applySettings fire below, so a saved non-en locale applies here too

function applySettings(s) {
  liveSettings = s;
  // ST-225: FX tier state (fxCount / bloom / DPR) now lives in applyFxTier below - unrelated
  // settings changes (volume etc.) can no longer revert an auto-downgraded tier.
  motionOff = s.reducedMotion === true;
  slowmoHintEl.style.transition = motionOff ? 'none' : 'opacity .2s'; // I161: no fade under reduced motion
  setUiScale(); // I70+I71: UI scale = fontScale x viewport (cascades to DOM overlays only; canvas unaffected)

  if (audio.state() !== 'uninitialized') { audio.setVolume(s.volume); audio.setSfx(s.sfx); }
  audio.setMusic(s.music !== false); // I158: music bed toggle (ctx-free; bed driven in syncVisuals)
  applyColorblindPreview(s.colorblindPreview); // I158: deuteranopia canvas preview
  rockRenders.setShapeCues(s.shapeCues !== false); // I155: colorblind-friendly silhouette cues
  wardenMesh.setShapeCues(s.shapeCues !== false);
  setLocale(s.locale); // ST-375: live locale switch (no-op unless changed; fires the onLocale re-emits). Boot: applied here before the panels/screens below are built.
}
applySettings(liveSettings);
// ST-073: adaptive quality - rolling FPS below threshold auto-downgrades FX (console log + toast).
const toastEl = document.createElement('div');
toastEl.id = 'adaptive-toast';
toastEl.setAttribute('aria-live', 'polite');
toastEl.style.cssText = 'position:fixed;left:50%;bottom:calc(9% + 40px);transform:translateX(-50%);z-index:60;font:calc(12px * var(--vr-fs,1))/1.4 ui-monospace,monospace;letter-spacing:.08em;color:#9fb4d8;background:rgba(4,6,15,0.7);padding:6px 12px;border-radius:4px;pointer-events:none;opacity:0;transition:opacity .25s;';
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
    applyFxTier(info.tier, 'auto-downgrade'); // ST-225: particles + bloom + DPR + marker in one place
    console.info('[voidrunner] adaptive quality: FX high -> low (rolling ' + CONFIG.adaptive.windowSec + 's avg ' + Math.round(info.fps) + ' fps < ' + CONFIG.adaptive.thresholdFps + ')');
    toast(tr('toast.fx_auto_low'));
  }
}, liveSettings.fx); // I255: reconcile the ladder to the stored FX tier - a stored 'off'/'low' is a locked prior choice, never overridden by a phantom high->low auto-downgrade
// ST-026: settings panels (menu + pause) - after storage/applySettings (TDZ order).
let fxPreviewFn = null; // ST-067: live FX preview, wired once particles exist
const menuSettings = createSettingsPanel(storage, applySettings, (tier) => { adaptive.userSet(tier); applyFxTier(tier, 'panel'); if (fxPreviewFn) fxPreviewFn(tier); }); // ST-073/ST-225: user FX choice overrides automation
const pauseSettings = createSettingsPanel(storage, applySettings, (tier) => { adaptive.userSet(tier); applyFxTier(tier, 'panel'); if (fxPreviewFn) fxPreviewFn(tier); }); // ST-073/ST-225

// ST-225: effective FX tier - the single writer for fxCount / bloom / DPR / the AUTO marker.
// Only user FX changes (F hotkey, settings panels) and the adaptive auto-downgrade mutate it;
// the stored user choice (storage) is never overwritten, and unrelated settings changes
// (volume, music, ...) can no longer silently revert an auto-downgraded tier.
let effectiveTier = liveSettings.fx;
function applyDprForTier(label) {
  const target = dprForTier(effectiveTier, window.devicePixelRatio, CONFIG.fx.dpr);
  const cur = renderer.getPixelRatio();
  if (Math.abs(target - cur) < 1e-6) return false;
  renderer.setPixelRatio(target);
  renderer.setSize(window.innerWidth, window.innerHeight); // three.js: pixel-ratio change needs a setSize to take effect
  bloom.resize(window.innerWidth, window.innerHeight);
  console.info('[voidrunner] DPR ' + cur.toFixed(2) + ' -> ' + target.toFixed(2) + ' (FX ' + effectiveTier + ', ' + label + ')');
  return true;
}
function updateFxMarker() {
  const st = adaptive.state();
  const marker = st.autoLow ? tr('settings.fx_auto') : null; // automation chose the tier; user choice untouched
  menuSettings.setFxMarker(marker);
  pauseSettings.setFxMarker(marker);
}
function applyFxTier(tier, label) {
  if (tier !== 'high' && tier !== 'low' && tier !== 'off') tier = 'high';
  effectiveTier = tier;
  fxCount = tier === 'low' ? CONFIG.fx.particleLow : tier === 'high' ? CONFIG.fx.particleHigh : CONFIG.fx.particleOff; // ST-224: off = 0
  bloom.setEnabled(tier === 'high');
  applyDprForTier(label);
  updateFxMarker();
}
applyFxTier(liveSettings.fx, 'boot'); // boot: stored tier (one labeled DPR resize if the cap differs from the min(dpr,2) init)

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
function freshRunSeed() { return (Math.floor(Math.random() * 0x7fffffff) ^ (Date.now() & 0xffff)) >>> 0; } // ST-191: per-run seed (a recorded run replays with this seed)

function toggleRecording() { // ST-191: O key + __vr.toggleRecording drive this named handler
  const st = world.game.state;
  if (st !== STATE.PLAYING || tutorialActive) return;
  const act = recordingAction(st, !!recorder, recStopped);
  if (act === 'start') {
    recorder = createRecorder(runSeed, { quant: CONFIG.replay.quant, maxSteps: CONFIG.replay.maxSteps, maxTapeBytes: CONFIG.replay.maxTapeBytes });
    recStopped = false; recChip.show(); toast(tr('toast.recording'));
  } else if (act === 'stop') { recStopped = true; recChip.hide(); toast(tr('toast.recording_stopped')); }
}

function startRun(mode) {
  replayView = null; // ST-190
  recorder = null; recStopped = false; watchSavedRun = false; recChip.hide(); // ST-191: a new run has no recording
  newBest = false; popups.clear(); killFeed.clear(); dailyNewBest = false; juiceTally.reset(); // ST-183
  const firstRun = !storage.getTutorialSeen(); // I151: first entry to PLAYING
  if (firstRun) { tutorialActive = true; tutorial.show(); } // gate the sim while reading
  else hint.show(); // passive 6s hint on subsequent runs
  if (mode === 'daily') { const d = dailyForDate(new Date(), CONFIG.daily.salt); dailyMode = true; dailyKey = d.key; dailySeedVal = d.seed; runSeed = d.seed; world.reseed(d.seed); }
  else { dailyMode = false; dailyKey = null; dailySeedVal = 0; runSeed = freshRunSeed(); world.reseed(runSeed); } // ST-191: fresh, reproducible layout per run
  world.begin();
}
function restartRun() {
  replayView = null; // ST-190
  recorder = null; recStopped = false; watchSavedRun = false; recChip.hide(); // ST-191: a restart has no recording
  newBest = false; popups.clear(); killFeed.clear(); hint.show(); dailyNewBest = false; juiceTally.reset(); // ST-183
  if (dailyMode) { runSeed = dailySeedVal; world.reseed(dailySeedVal); } // ST-141: same seed -> reproduce today's run; ST-191
  else { runSeed = freshRunSeed(); world.reseed(runSeed); } // ST-191: fresh, reproducible layout per run
  world.restart();
}

function startReplayView(data) { // ST-190: watch a replay (demo pilot or saved run) - deterministic playback
  const r = decodeReplay(data, { maxLen: CONFIG.replay.maxSteps });
  if (!r.ok) { console.warn('[replay] rejected:', r.error); return; }
  world.reset(); // -> MENU: clean systems + replayMode=false
  world.reseed(r.data.seed); // deterministic RNG for the watched run
  replayView = { player: createPlayer(r.data), data: r.data, speed: 1, idx: 0 };
  world.replayBegin(); // MENU -> REPLAY (replayMode=true + waves.start())
  recorder = null; recStopped = false; watchSavedRun = false; recChip.hide(); // ST-191: a watched run never records
  newBest = false; popups.clear(); killFeed.clear(); vortexFx.hide(); juiceTally.reset();
}
function exitReplayView() { // ST-190: leave the watched run, back to a clean menu
  replayView = null; newBest = false; popups.clear(); killFeed.clear(); vortexFx.hide(); recorder = null; recStopped = false; watchSavedRun = false; recChip.hide(); // ST-191
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
    quit: () => { if (replayView) exitReplayView(); else { newBest = false; popups.clear(); vortexFx.hide(); recorder = null; recStopped = false; watchSavedRun = false; recChip.hide(); world.quitToMenu(); } }, // ST-190/ST-191
    showReplays: () => { const saved = storage.getReplays(); const list = [{ key: 'demo', label: tr('replays.demo_pilot'), score: 0, wave: 0, kills: 0, time: 0, isDemo: true }]; saved.forEach((r2, i) => list.push({ key: i, label: tr('replays.saved_run'), score: r2.data.meta.score, wave: r2.data.meta.wave, kills: r2.data.meta.kills, time: r2.data.meta.time })); screens.openReplays(list); }, // ST-190
    startReplay: (k) => { if (k === 'demo') { startReplayView(demoReplay(CONFIG.replay.demoSeed, CONFIG.replay.demoLen)); return; } const saved = storage.getReplays(); if (saved[k]) startReplayView(saved[k].data); }, // ST-190
    closeReplays: () => screens.closeReplays(), // ST-190
    watchRun: () => { const saved = storage.getReplays(); if (saved.length > 0) startReplayView(saved[0].data); }, // ST-191: watch the just-saved run (always index 0 - newest first)
  },
});
const particles = createParticles(scene);
const shockwaves = createShockwaves(scene, CONFIG.fx.shockwave); // ST-238 (I245): one shared geometry + fixed mesh pool
const engineTrail = createEngineTrail(CONFIG.fx.engineTrail); // I213: throttled trail emission (pure core, unit-tested)
fxPreviewFn = (tier) => { // ST-067: show the new tier immediately (arena center, behind the panel)
  const n = tier === 'high' ? CONFIG.fx.particleHigh : tier === 'low' ? CONFIG.fx.particleLow : CONFIG.fx.particleOff; // ST-224: off preview = no burst
  particles.burst(0, 0, { count: n, color: 0x7fd0ff, speed: 6, life: 0.7 });
};
// Screen shake (ST-025): core envelope, render layer applies the camera offset.
const shake = createShake({ master: CONFIG.fx.shake, decay: CONFIG.fx.shakeDecay, amplitude: CONFIG.fx.shakeAmplitude }, new RNG(0x57ab));
const shakeOff = { x: 0, y: 0, z: 0 };
const punch = createPunch({ decay: CONFIG.fx.punch.decay, amplitude: CONFIG.fx.punch.amplitude }); // ST-081: directed camera jolt
const _kpd = { x: 0, y: 0, z: 0 }; // ST-221 (I224): kill-punch direction scratch (no per-kill allocation)
const _killCh = { punch: 0, ring: 0 }; // ST-238 (I245): kill juice-channel scratch (no per-kill allocation)
const SW_COLORS = { drone: CONFIG.fx.palette.drone[0], stinger: CONFIG.fx.palette.stinger[0], warden: CONFIG.fx.palette.boss[0] }; // ST-238 (I245): per-class ring colors (built once)
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
const input = createInput({ onPause: togglePause, onPauseConfirm: () => toast(tr('toast.paused_two_finger')) }); // ST-268: visual confirmation of the two-finger pause
// I71: on-screen pause button (touch devices; shown during PLAYING only)
const pauseBtn = document.createElement('button');
pauseBtn.type = 'button';
pauseBtn.id = 'vr-pause-btn'; // I161: focus-ring selector
pauseBtn.setAttribute('aria-label', tr('pause.aria_btn'));
pauseBtn.textContent = '\u275A\u275A';
pauseBtn.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:30;display:none;pointer-events:auto;cursor:pointer;box-sizing:border-box;align-items:center;justify-content:center;width:calc(46px * var(--vr-fs,1));height:calc(46px * var(--vr-fs,1));border-radius:50%;border:1px solid #2b4a8a;background:rgba(10,18,40,0.82);color:#cfe4ff;font-size:calc(14px * var(--vr-fs,1));font-weight:700;letter-spacing:2px;padding:0;';
pauseBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
pauseBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePause(); pauseBtn.blur(); });
document.body.appendChild(pauseBtn);
const touchStick = coarse ? createTouchStick() : { sync: function () {} }; // ST-321 (I351): on-screen thrust stick - created ONLY on touch (zero DOM on mouse/keyboard)

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
    if (st === STATE.PAUSED) { if (replayView) exitReplayView(); else { newBest = false; popups.clear(); vortexFx.hide(); recorder = null; recStopped = false; watchSavedRun = false; recChip.hide(); world.quitToMenu(); } } else if (st === STATE.GAME_OVER && replayView) exitReplayView(); // ST-190/ST-191
  } else if (e.key === '1' || e.key === '2' || e.key === '3') { // ST-190: replay speed x1/x2/x4
    if (replayView && st === STATE.REPLAY) replayView.speed = e.key === '1' ? 1 : e.key === '2' ? 2 : 4;
  } else if (e.key === 'o' || e.key === 'O') { toggleRecording(); // ST-191: toggle run recording
  } else if (e.key === 'm' || e.key === 'M') {
    muted = !muted;
    audio.setMuted(muted);
  } else if (e.key === 'f' || e.key === 'F') { // I157/ST-224: FX quality hotkey (HIGH -> LOW -> OFF -> HIGH)
    const next = toggleFxQuality(storage.getSettings().fx);
    const merged = storage.setSettings({ fx: next });
    applySettings(merged);
    adaptive.userSet(next); // I157: user choice overrides adaptive automation - BEFORE applyFxTier so updateFxMarker reads the post-userSet autoLow (I231: marker cleared on the first user F after an auto-downgrade)
    applyFxTier(next, 'hotkey'); // ST-225: FX tier state (particles / bloom / DPR / marker)
    if (fxPreviewFn) fxPreviewFn(next); // ST-067: live particle preview
    menuSettings.sync();
    pauseSettings.sync();
    toast(tr('toast.fx',{level:next.toUpperCase()}));
  } else if (e.key === 'n' || e.key === 'N') { // I171 (ST-171): music bed hotkey - PERSISTED (mirrors F), not session-only like M
    const next = !storage.getSettings().music;
    const merged = storage.setSettings({ music: next });
    applySettings(merged);
    menuSettings.sync();
    pauseSettings.sync();
    toast(tr('toast.music',{onoff:next?tr('state.on'):tr('state.off')}));
  }
});
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const aimWorld = new THREE.Vector3();

// follow-camera state
const shipFwd = { x: 0, y: 0 }; // ST-074: scratch for ship.forward()
const camPos = { x: 0, y: 9, z: 13 };
const camLook = { x: 0, y: 0, z: 0 };
// ST-219: state-tied camera feel - MENU orbit phase (0 = legacy (0,9,13) view) + boss zoom-out (degrees)
let menuOrbitA = 0;
let bossZoomFov = 0;

// event drain sink (I16 HUD / I24 fx / I27 audio hook in here)
const eventTally = {}; const juiceTally = createJuiceTally(); // ST-183: per-run feel-channel tally (probe: __vr.juiceTally())

// I285/ST-270: vendor lowp capability warning guard. three.js r160 (vendor/three.module.js:20618,
// WebGLPrograms.getParameters) warns when a program compiles in a GL context whose max fragment
// precision has degraded to 'lowp' (degraded GPU window state - occluded/throttled windows where the
// driver reports zero range for highp+mediump). Benign: three.js falls back to the max supported
// precision and rendering stays correct; no project material sets .precision, so only an internal
// (precision: undefined) material can trigger it; NOT reproducible at HEAD in a healthy window
// (I285 probe: 6 attempts, 0 reproductions). Disposition: the first occurrence passes through
// (stays observable once), repeats are suppressed (it re-fires per recompiled program, e.g. after a
// context restore), and every occurrence is tallied (eventTally.vendorLowpWarn / __vr.vendorLowpWarns).
const _origConsoleWarn = console.warn;
let _vendorLowpWarns = 0;
console.warn = (..._a) => {
  const _s = _a.join(' ');
  if (_s.indexOf('THREE.WebGLProgram.getParameters:') !== -1 && _s.indexOf('not supported, using') !== -1) {
    _vendorLowpWarns += 1;
    eventTally.vendorLowpWarn = (eventTally.vendorLowpWarn || 0) + 1;
    if (_vendorLowpWarns > 1) return; // repeat of the same benign capability fallback
  }
  return _origConsoleWarn(..._a);
};
// Deterministic advance for smoke tests + the I076 harness: runs N fixed substeps
// (world.step + event drain + visual sync) independent of display rate.
function advance(simSeconds, intent = { thrust: v2(0, 0), aimPoint: null, firing: false }) {
  const n = Math.max(1, Math.round(simSeconds / STEP));
  for (let i = 0; i < n; i++) tick(STEP, (replayView && world.game.in(STATE.REPLAY)) ? replayIntent() : intent);
  syncVisuals(STEP);
}
window.__vr = { world, eventTally, juiceTally: () => juiceTally.snapshot(), input, advance, storage, particles, shockwaves, shipGroup: shipMesh.group, shipFlame: shipMesh.flame, shipFlameCore: shipMesh.flameCore, shipFlameGlow: shipMesh.flameGlow, arenaFloor: grid, // ST-257 (I269)
  floorDisc, // ST-277 (I294)
  applySettings, liveSettings: () => liveSettings,
  locale: () => getLocale(), setLocale, // ST-375: locale probe + drive (boot applied in applySettings; live via the settings panel)
  audio, markAudioReady, banner, popups, hint, killFeed, tutorial, tutorialActive: () => tutorialActive, dismissTutorial, bloom, reticle, bullets, powerupRenders, shieldRing, rockRenders, mineRenders, droneRenders, stingerRenders, flyerRenders, bossMesh, wardenMesh, bossHealth, assetLoader, enemyBulletRenders, stars, vortexFx, skybox, arenaRing, engineTrail, fpsMeter, debugOverlay, adaptive, punch, camera, camLook, camPos, fovKick, cameraFeel: () => ({ menuOrbitA, bossZoomFov }), toastEl, renderer, vendorLowpWarns: () => _vendorLowpWarns, render: () => renderer.render(scene, camera) }; // debug/test handle (expanded in I080; ST-059: vortexFx)

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
ctxTitle.textContent = tr('ctxlost.title');
const ctxStatus = document.createElement('div');
ctxStatus.id = 'ctx-status';
ctxStatus.textContent = tr('ctxlost.message');
const ctxBtn = document.createElement('button');
ctxBtn.type = 'button';
ctxBtn.id = 'vr-ctx-btn'; // I161: focus-ring selector
ctxBtn.textContent = tr('ctxlost.reload');
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
let ctxEscalated = false; // ST-375: 10s escalation pending (the locale re-emit picks the right status text)
let framesRendered = 0; // I187: loop-work counter (probe) - frozen while the context is lost
function onCtxLost(e) {
  e.preventDefault(); // mark the context as restorable
  ctxLost = true; // I187: the loop guard below skips sim + render until restored
  if (world.game.state === STATE.PLAYING) world.pause();
  ctxOverlay.style.display = 'flex'; // I75
  ctxStatus.textContent = tr('ctxlost.message');
  ctxEscalated = false; // ST-375
  clearTimeout(ctxRestoreTimer);
  ctxRestoreTimer = setTimeout(() => { // I75: no restore yet - escalate
    ctxStatus.textContent = tr('ctxlost.timeout');
    ctxEscalated = true; // ST-375
  }, 10000);
}
function onCtxRestored() {
  clearTimeout(ctxRestoreTimer); // I75
  renderer.setSize(window.innerWidth, window.innerHeight);
  bloom.resize(window.innerWidth, window.innerHeight); // composer render targets died with the GL context; resize re-creates them (three.js re-uploads geoms/texs/programs lazily on the first post-restore render)
  renderer.info.reset();
  clock.reset(performance.now()); // I187: re-init path - stall time discarded, no dt spike on the first restored frame (ST-078 clamp is the backstop)
  ctxLost = false;
  ctxEscalated = false; // ST-375
  ctxOverlay.style.display = 'none'; // I75: back to normal (pause screen takes over if the game was running)
}
renderer.domElement.addEventListener('webglcontextlost', onCtxLost);
renderer.domElement.addEventListener('webglcontextrestored', onCtxRestored);
window.__vr.ctxLost = () => ctxLost; // I187: probe
window.__vr.simCtxLost = () => onCtxLost({ preventDefault() {} }); // I187: exercise the real handler path without an actual GL loss (smoke/debug only)
window.__vr.simCtxRestore = () => onCtxRestored(); // I187
onLocale(() => { // ST-375: ctx overlay is post-construction here - boot covered above, live changes arrive via applySettings
  ctxTitle.textContent = tr('ctxlost.title');
  ctxStatus.textContent = ctxEscalated ? tr('ctxlost.timeout') : tr('ctxlost.message');
  ctxBtn.textContent = tr('ctxlost.reload');
  updateFxMarker();
}); // ST-375
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
window.__vr.shockwaveLive = () => shockwaves.live; // ST-238 (I245): probe (live ring count; 0 under FX off / reduced motion)
window.__vr.shockwaveRings = () => shockwaves.rings; // ST-238 (I245): probe (pooled ring entries: mesh/mat/age/life/radius/active)
window.__vr.magnetPullCount = () => world.powerups.drops.filter((d) => !d.dead && d.magnetPull).length; // ST-177: probe (orbs currently magnet-pulled)
window.__vr.weaponFanfareN = () => _weaponFanfareN; // ST-178: probe (fanfires fired; increments only in the motion-ON branch)
window.__vr.lastShare = () => screens.lastShare(); // I159: probe
window.__vr.replayView = () => replayView && { idx: replayView.idx, length: replayView.player.length, speed: replayView.speed, meta: replayView.data.meta }; // ST-190: probe
window.__vr.haptics = haptics; // ST-322 (I353): probe (coarse + feature-gated; pulse('hit'|'death'|'bomb'|'pickup'))
window.__vr.startReplay = (d) => startReplayView(d); // ST-190: probe
window.__vr.exitReplay = () => exitReplayView(); // ST-190: probe
window.__vr.demoReplay = () => demoReplay(CONFIG.replay.demoSeed, CONFIG.replay.demoLen); // ST-190: probe
window.__vr.replayHud = replayHud; // ST-190: probe
window.__vr.recording = () => ({ active: !!(recorder && !recStopped), stopped: recStopped, steps: recorder ? recorder.length : 0, truncated: recorder ? recorder.truncated : false, runSeed }); // ST-191: probe
window.__vr.toggleRecording = toggleRecording; // ST-191: probe (drives the same rules as the O key)

// Fixed-timestep simulation (60Hz) with render at display rate (ST-078: the
// accumulator + dt clamp live in the pure core clock; huge gaps are clamped to
// 0.25s and the backlog dropped past 8 substeps, so resume never fast-forwards).
const STEP = 1 / 60;
const MAX_SUBSTEPS = 8;
const clock = createClock({ step: STEP, maxFrameDt: 0.25, maxSubsteps: MAX_SUBSTEPS });
let prevState = null; // ST-078: detect PAUSED->PLAYING to reset the clock on resume

function resolveAimPoint() {
  if (input.rightAimActive) { // ST-268: the right-zone finger owns the aim (touch position)
    raycaster.setFromCamera(input.pointer.ndc, camera);
    if (raycaster.ray.intersectPlane(groundPlane, aimWorld)) return { x: aimWorld.x, y: aimWorld.z };
    return null;
  }
  if (input.touchDrag) { // ST-268 (ST-033 carryover): while left-drag-thrusting, aim along the drag (fire forward)
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
  if (intent) { input.state.thrust.x = it.thrust.x; input.state.thrust.y = it.thrust.y; input.state.firing = it.firing; } // I213: mirror scripted intent into the live input state so the render layer (flame, engine trail) tracks the pilot
  if (recorder && !recStopped && world.simActive) recorder.record(it); // ST-191: record exactly the intent the sim receives (one per substep; freezes at stop/death/tutorial)
  world.step(dt, it);
  for (const e of world.drainEvents()) {
    eventTally[e.type] = (eventTally[e.type] || 0) + 1;
    const cue = e.type === 'powerup' && e.data && e.data.type === 'slowmo' ? 'slowmo' : e.type === 'powerup' && e.data && e.data.type === 'overdrive' ? 'overdrive' : SFX_CUES[e.type]; // ST-057, I173: slow-mo pickup gets the cold shimmer
    if (cue) audio.sfx(cue, e.data && e.data.pos ? e.data.pos : null);
    const haptic = e.type === 'hit' ? 'hit' : e.type === 'gameover' ? 'death' : e.type === 'bomb' ? 'bomb' : e.type === 'powerup' ? 'pickup' : null; // ST-322 (I353): touch haptics at the SFX dispatch (coarse + feature-gated inside haptics)
    if (haptic) haptics.pulse(haptic);
    if (e.type === 'wave') banner.showWave(e.data.n, e.data.mod, e.data.endless);
    else if (e.type === 'waveCleared') banner.showCleared(e.data.n);
    else if (e.type === 'bossSpawn') { banner.showBoss(e.data.wave, e.data.hp, e.data.kind === 'splicer' ? tr('banner.boss.splicer') : tr('banner.boss.monolith'), e.data.kind); if (e.data.kind === 'splicer') toast(tr('toast.splicer')); } // I154: kind for variant glow // ST-135/143: boss intro (+ Splicer callout)
    else if (e.type === 'wardenSpawn') toast(tr('toast.warden')); // ST-137: mini-boss callout
    else if (e.type === 'stingerSpawn') toast(tr('toast.stinger')); // ST-229: first spawn of the run calls out the charger
else if (e.type === 'flyerSpawn') toast(tr('toast.flyer')); // ST-232: first spawn of the run calls out the evasive target
    else if (e.type === 'kill') { popups.add(e.data.pos.x, e.data.pos.y, '+' + e.data.points, { big: e.data.multiplier >= 2 || e.data.golden || e.data.boss, gold: !!e.data.golden, od: !!e.data.overdrive }); killFeed.add(e.data); } // ST-030/052, I153
    else if (e.type === 'nearmiss') popups.add(e.data.pos.x, e.data.pos.y, '+' + e.data.points); // ST-053 (plain small popup)
    else if (e.type === 'weaponLevelUp') toast(tr('toast.weapon',{level:e.data.level})); // ST-123
    if (!motionOff) {
      if (e.type === 'kill') { particles.burst(e.data.pos.x, e.data.pos.y, { count: e.data.golden ? Math.ceil(fxCount * 1.5) : fxCount, palette: e.data.golden ? CONFIG.fx.palette.golden : CONFIG.fx.palette.rock, speed: 9, life: 0.5 }); const _ke = killPunchEnergy(e.data.size, !!e.data.overdrive, CONFIG.fx.killPunch); const _swr = fxCount > 0 ? shockwaveRadius(e.data.size, CONFIG.fx.shockwave) : 0; _killCh.punch = 0; _killCh.ring = 0; if (_ke > 0) { punch.trigger(killPunchDir(world.ship.pos, e.data.pos, 0.35, _kpd), _ke); _killCh.punch = 1; } if (_swr > 0) { shockwaves.spawn(e.data.pos.x, e.data.pos.y, { radius: _swr, color: e.data.golden ? CONFIG.fx.palette.golden[0] : (SW_COLORS[e.data.size] || CONFIG.fx.palette.killRing) }); _killCh.ring = 1; } if (_killCh.punch || _killCh.ring) juiceTally.record('kill', _killCh); } // ST-052, ST-221 (I224): class-scaled kill punch (T4); ST-238 (I245): pooled shockwave ring on class-scaled plain kills (no flash/hit-stop)
      else if (e.type === 'nearmiss') particles.burst(e.data.pos.x, e.data.pos.y, { count: Math.max(4, Math.ceil(fxCount * 0.25)), palette: CONFIG.fx.palette.graze, speed: 5, life: 0.3 }); // ST-053 subtle graze wisp
      else if (e.type === 'mineExplode') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount, palette: CONFIG.fx.palette.mine, speed: 10, life: 0.5 }); shake.trigger(shakeEnergy('mineExplode', CONFIG.fx.shakeTable)); flashA = Math.min(0.8, flashA + flashEnergy('mineExplode', CONFIG.fx.flashTable)); juiceTally.record('mineExplode', { shake: 1, flash: 1 }); } // ST-054/ST-175
      else if (e.type === 'droneExplode') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount, palette: CONFIG.fx.palette.drone, speed: 9, life: 0.45 }); shake.trigger(shakeEnergy('droneExplode', CONFIG.fx.shakeTable)); flashA = Math.min(0.8, flashA + flashEnergy('droneExplode', CONFIG.fx.flashTable)); juiceTally.record('droneExplode', { shake: 1, flash: 1 }); } // ST-117/ST-175 seeker burst
else if (e.type === 'droneDecay') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount ? Math.max(4, fxCount >> 1) : 0, palette: CONFIG.fx.palette.drone, speed: 5, life: 0.6 }); } // I129: seeker battery self-destruct - small cyan fizzle, no shake, honors FX tier off
      else if (e.type === 'stingerDeath') { particles.burst(e.data.pos.x, e.data.pos.y, { count: Math.ceil(fxCount * 1.5), palette: CONFIG.fx.palette.stinger, speed: 11, life: 0.55 }); shake.trigger(shakeEnergy('stingerDeath', CONFIG.fx.shakeTable)); juiceTally.record('stingerDeath', { shake: 1 }); } // ST-229: charger burst - 0.6 shake rung, NO flash/hit-stop (readability rule)
      else if (e.type === 'stingerFizzle') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount ? Math.max(4, fxCount >> 1) : 0, palette: CONFIG.fx.palette.stinger, speed: 5, life: 0.6 }); } // ST-229: charge-budget fizzle (seeker decay pattern - honors FX off)
      else if (e.type === 'flyerDeath') { particles.burst(e.data.pos.x, e.data.pos.y, { count: Math.ceil(fxCount * 1.5), palette: CONFIG.fx.palette.flyer, speed: 12, life: 0.6 }); shake.trigger(shakeEnergy('flyerDeath', CONFIG.fx.shakeTable)); juiceTally.record('flyerDeath', { shake: 1 }); } // ST-232: evasive-target kill - 0.65 shake rung, magenta burst, NO flash/hit-stop
      else if (e.type === 'flyerHit') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount ? Math.max(4, fxCount >> 2) : 0, palette: CONFIG.fx.palette.flyer, speed: 6, life: 0.35 }); } // ST-232: first-hit flash (dome also flashes via hitFlash)
      else if (e.type === 'flyerExit') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount ? Math.max(4, fxCount >> 1) : 0, palette: CONFIG.fx.palette.flyer, speed: 5, life: 0.6 }); } // ST-232: lifetime/rim exit (no score - stinger fizzle precedent)
      else if (e.type === 'bossSpawn') { particles.burst(e.data.pos.x, e.data.pos.y, { count: fxCount, palette: CONFIG.fx.palette.boss, speed: 8, life: 0.7 }); shake.trigger(shakeEnergy('bossSpawn', CONFIG.fx.shakeTable)); flashA = Math.min(0.8, flashA + flashEnergy('bossSpawn', CONFIG.fx.flashTable)); juiceTally.record('bossSpawn', { shake: 1, flash: 1 }); } // ST-055/ST-175
      else if (e.type === 'bossPhase2') { hitStop = Math.max(hitStop, CONFIG.fx.hitStop.bossPhase2); juiceTally.record('bossPhase2', { hitStop: 1 }); } // ST-217: 40 ms hit-stop on enrage entry (hit-stop only - no shake/flash; phase < death in the juice hierarchy)
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
        if (shouldSaveOnGameOver(!!recorder, recorder ? recorder.length : 0, !!replayView)) { // ST-191: save the recorded run (a watched replay never saves)
          const meta = { score: e.data.score, wave: Math.max(1, world.wave), kills: world.scoreKeeper.kills, time: Math.round(world.time), mode: dailyMode ? 'daily' : 'normal', dailyKey: dailyMode ? dailyKey : '' };
          if (storage.saveReplay(recorder.finish(meta)).saved) { watchSavedRun = true; toast(tr('toast.run_saved')); }
        }
        recorder = null; recStopped = false; recChip.hide(); // ST-191: end-of-run cleanup (no-op when never recording)
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
  screenOpts.watchRun = watchSavedRun; // ST-191: WATCH RUN button on the just-saved run's game over
  replayHud.update({ visible: st === STATE.REPLAY, meta: replayView ? replayView.data.meta : null, idx: replayView ? replayView.idx : 0, length: replayView ? replayView.player.length : 0, speed: replayView ? replayView.speed : 1, reducedMotion: motionOff }); // ST-190
  hud.render(world, hudOpts);
  if (coarse && st === STATE.PLAYING) { if (pauseBtn.style.display !== 'flex') pauseBtn.style.display = 'flex'; } else if (pauseBtn.style.display !== 'none') pauseBtn.style.display = 'none'; // I71: on-screen pause button (touch, PLAYING only)
  touchStick.sync(input, dt, st === STATE.PLAYING); // ST-321 (I351): on-screen thrust stick (fades out on non-PLAYING / pointercancel / blur)
  screens.update(st, world, screenOpts);
  const thrustFrac = Math.min(1, Math.hypot(input.state.thrust.x, input.state.thrust.y));
  const mh = CONFIG.camera.menuHero; // ST-261: MENU hero block (framing + pose + idle flame)
  const menuFlame = st === STATE.MENU ? (motionOff ? mh.flameIdle : mh.flameIdle * (1 - mh.flameFlicker * (0.5 + 0.5 * Math.sin(simT * mh.flameRate)))) : thrustFrac; // ST-261: gentle engine idle in MENU (steady under reduced motion)
  shipMesh.sync(world.ship, simT, !motionOff, menuFlame); // ST-063 engine flame; ST-261: MENU idle
  if (st === STATE.MENU) { // ST-261: hero pose (render-only - sync owns rotation.y each frame, so this override is authoritative while in MENU)
    shipMesh.group.rotation.y = mh.yaw;
    shipMesh.group.rotation.x = mh.pitch;
    shipMesh.group.rotation.z = mh.bank + (motionOff ? 0 : mh.rockAmp * Math.sin(simT * mh.rockRate)); // idle rock, static under reduced motion
  } else { // no MENU pose bleed into the follow cam
    shipMesh.group.rotation.x = 0;
    shipMesh.group.rotation.z = 0;
  }
  reticle.sync(world.ship, st === STATE.PLAYING); // I44: only while playing
  bullets.sync(world.weapons);
  bullets.setLevel(world.weaponLevel(), st === STATE.PLAYING && world.powerups.active('overdrive')); // ST-123, ST-248: overdrive heat shift
  rockRenders.sync(world.field, simT); // ST-139
  mineRenders.sync(world.mines, simT); // ST-054
  droneRenders.sync(world.drones, simT); // ST-117
  { // ST-290 (I311): boss attack telegraph state - render-layer only (reads the public game-time
    // timers; -1 = no window). fx off = none (R-E29-1); entered < 1 = held (the timers are held too).
    const tb = world.boss;
    const teleOn = !!(tb && tb.alive && tb.entered >= 1 && liveSettings.fx !== "off");
    bossMesh.sync(world.boss, simT,
      teleOn && tb.kind === "monolith" ? tb.ringTimer : -1,
      teleOn ? world.bossFireTimer : -1,
      teleOn && tb.kind === "monolith" ? world.bossBurstTimer : -1); // ST-055/290
  }
  wardenMesh.sync(world.warden, simT); // ST-137
  stingerRenders.sync(world.stingers, simT, motionOff); // ST-229: core glow FX-tier-independent; telegraph wobble motion-gated
  world.flyers.ampScale = motionOff ? CONFIG.flyer.rmAmpScale : 1; // ST-232: RM reduces the weave amplitude (motion kept - identity)
  flyerRenders.sync(world.flyers, simT, motionOff); // ST-232
  bossHealth.sync(world.boss); // ST-055
  enemyBulletRenders.sync(world.enemyBullets, simT); // ST-056
  powerupRenders.sync(world.powerups, dt);
  if (!motionOff && st === STATE.PLAYING) { for (const d of world.powerups.drops) { if (d.dead || !d.magnetPull) continue; particles.burst(d.pos.x, d.pos.y, { count: 2, color: CONFIG.fx.palette.pickup.magnet, speed: 1.5, life: 0.35, shape: 'radial' }); } } // ST-177: magnet pull trail (motion-gated comet wisp behind the orb the magnet drags)
  if (!motionOff && st === STATE.PLAYING) { // I213: engine trail - motion-gated additive puffs behind the ship while thrusting
    const thrust = Math.min(1, Math.hypot(input.state.thrust.x, input.state.thrust.y));
    const nEmit = engineTrail.update(dt, thrust, true);
    if (nEmit > 0) {
      const tf = world.ship.forward(shipFwd); // ST-074 scratch reuse
      const tx = world.ship.pos.x - tf.x * CONFIG.fx.engineTrail.offset;
      const tz = world.ship.pos.y - tf.y * CONFIG.fx.engineTrail.offset;
      const cnt = liveSettings.fx === 'low' ? CONFIG.fx.engineTrail.countLow : liveSettings.fx === 'high' ? CONFIG.fx.engineTrail.countHigh : CONFIG.fx.engineTrail.countOff; // ST-224: off = silent trail
      for (let k = 0; k < nEmit; k++) particles.burst(tx, tz, { count: cnt, palette: CONFIG.fx.palette.engine, speed: CONFIG.fx.engineTrail.speed, life: CONFIG.fx.engineTrail.life, shape: 'radial', ramp: CONFIG.fx.engineTrail.ramp });
    }
  }
  shieldRing.sync(world, dt, !motionOff); // I62: freeze under reduced motion
  if (st === STATE.PLAYING) vortexFx.update(dt); // ST-059 (frozen while paused)
  particles.sync(dt);
  shockwaves.sync(dt); // ST-238 (I245)
  banner.sync(world.waves, dt, motionOff, world.game.state); // ST-028; I321: ST-299 - state passed so the banner force-hides on GAME_OVER

  const ship = world.ship;
  const f = ship.forward(shipFwd); // ST-074: scratch reuse (no per-frame alloc)
  const spdFrac = Math.min(1, ship.speed / CONFIG.ship.maxSpeed); // ST-082: 0..1 speed fraction
  const ahead = CONFIG.camera.lookAhead + CONFIG.camera.lookAheadSpeed * spdFrac; // ST-082: speed-scaled look-ahead
  // ST-219: state-tied camera feel - MENU orbit drift + 2-5% aim lead (eased + capped; dodge-read rule)
  if (st === STATE.MENU && !motionOff) menuOrbitA += dt * CONFIG.camera.menuOrbitRate; // slow drift, motion-gated
  let camTX = ship.pos.x, camTY = 9, camTZ = ship.pos.y + 13;
  let lookTX = ship.pos.x + f.x * ahead, lookTZ = ship.pos.y + f.y * ahead; // ST-082
  let lookTY = 0; // ST-261: MENU frames the hovering ship line (default = arena plane)
  if (st === STATE.MENU) { // slow orbit around the arena center (static under reduced motion); ST-261 hero framing
    camTX = Math.sin(menuOrbitA) * mh.radius; camTZ = Math.cos(menuOrbitA) * mh.radius; camTY = mh.height; lookTX = 0; lookTZ = 0; lookTY = mh.lookY;
  } else if (st === STATE.PLAYING && !motionOff) { // 2-5% lead toward the aim point, capped, eased by the look damp
    const aim = resolveAimPoint();
    if (aim) {
      const ox = aim.x - ship.pos.x, oz = aim.y - ship.pos.y;
      const m = Math.hypot(ox, oz);
      if (m > 0.001) { const len = Math.min(m * CONFIG.camera.aimLeadFrac, CONFIG.camera.aimLeadCap); lookTX += ox / m * len; lookTZ += oz / m * len; }
    }
  }
  camPos.x = damp(camPos.x, camTX, 5, dt);
  camPos.y = damp(camPos.y, camTY, 5, dt);
  camPos.z = damp(camPos.z, camTZ, 5, dt);
  camLook.x = damp(camLook.x, lookTX, 6, dt);
  camLook.y = damp(camLook.y, lookTY, 6, dt); // ST-261: MENU look target on the ship line
  camLook.z = damp(camLook.z, lookTZ, 6, dt);
  // ST-219: boss-approach zoom-out (a few degrees, eased in and out; a boss is only alive during play)
  const boss = world.boss;
  const zoomTX = (boss && boss.alive) ? Math.max(0, 1 - Math.hypot(boss.pos.x - ship.pos.x, boss.pos.y - ship.pos.y) / CONFIG.camera.bossZoomRange) * CONFIG.camera.bossZoomFov : 0;
  bossZoomFov = damp(bossZoomFov, zoomTX, CONFIG.camera.bossZoomDamp, dt);
  camera.position.set(camPos.x, camPos.y, camPos.z);
  camera.lookAt(camLook.x, camLook.y, camLook.z);
  const targetFov = CONFIG.camera.fovBase + CONFIG.camera.fovSpeed * spdFrac + fovKick.value() + bossZoomFov; // ST-082: base + speed + kick; ST-219: boss zoom
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
// ST-319 (I348): PWA - register the service worker ONLY in production builds. The build
// stamps <meta name="vr-build" content="prod"> into dist/index.html; the dev server and
// headless probes serve content="dev" and never register (R-E37-2: no SW staleness in
// dev/probes). Registration failure is a graceful no-op (R-E37-1 CUT path).
{
  const buildMeta = document.querySelector('meta[name="vr-build"]');
  if (buildMeta && buildMeta.content === 'prod' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
}







