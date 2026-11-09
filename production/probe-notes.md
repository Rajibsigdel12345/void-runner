# Browser Probe Notes - Void Runner

Reusable patterns for the scripted browser regression suites (production/qa-plan.md).
All probes run against window.__vr from the dev server (http://localhost:5173, add ?fps=2
for the fps meter). __vr.advance is synchronous (rAF cannot interrupt it) -> deterministic
with pinned seeds. Live rAF ticks still run between await sleep()s (damping coasts the ship;
the wave director spawns) - account for them in timed assertions.

## __vr surface
{ world, eventTally, input, advance, storage, particles, shipGroup, applySettings,
  liveSettings, audio, markAudioReady, banner, popups, hint, bloom, reticle, fpsMeter,
  renderer, render }
fpsMeter: div#fps-meter / __vr.fpsMeter.element, 0.5s window, text "FPS 60  16.6 ms\ncalls 37  tris 1626".

## Scene-pinning helpers (perf / isolation scenes)
- parkWaves: w.waves.state='intermission'; w.waves.intermission=1e9; w.waves.toSpawn=0
  (call BEFORE start - otherwise the wave-1 director spawns during your scene; I46 incident)
- parkShip: zero ship velocity/position; in perf scenes re-park every ~500ms.
- spawnAt(size,x,y): r=w.field.spawn(size,1,{x,y},null); r.vel.x=0; r.vel.y=0; return r
- NEUTRAL intent: {thrust:{x:0,y:0}, aimPoint:null, firing:false}

## Session / input
- Session keys via e.key: Enter (start/restart), p (pause), M (mute). Movement via e.code (KeyW/KeyA/KeyS/KeyD, arrows). Fire: Space (e.code) or mouse down.
- Touch synth: PointerEvent with pointerType:'touch', unique pointerId per finger, isPrimary, bubbles. Tap = fire (FIRE_TAIL guarantees >=1 bullet); drag = thrust; two fingers = pause (0.45s cooldown gate).

## Environment toggles
- Visibility: Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'}) then dispatchEvent(new Event('visibilitychange')).
- Context loss: canvas.getContext('webgl2').getExtension('WEBGL_lose_context'); loseContext()/restoreContext().

## Known gotchas
- world.score is GETTER-ONLY (game.js) - plain assignment is a silent no-op in sloppy mode; set world.scoreKeeper.score.
- three's WebGLRenderer has no .scene property - expose probe targets on __vr instead.
- Playwright evaluate: use async () => {...}; the () => new Promise(async (resolve) => {...}) form throws SyntaxError.
- CSS attribute selectors against inline styles fail (browser normalizes top:46px to top: 46px) - query by text content / traversal.
- Console evidence is scoped to the CURRENT page load (since last navigation). INVALID_OPERATION warning bursts after editing main.js with the page open = dev-server module-graph reload artifact (documented harmless, dev-only).
- Settings: {volume: 0..1 (range input, not 0-100), sfx, fx: 'high'|'low', reducedMotion}; localStorage keys voidrunner.best / voidrunner.settings.

## World API (probe targets)
world.{ship, weapons.bullets, field.rocks/spawn(size,speedMult,at,noNear)/clear/compact,
waves.{wave,toSpawn,intermission,state,waveElapsed,speedMult,concurrentLimit},
powerups.{timeLeft,active(t),isShielding(),apply(t),drops},
scoreKeeper.{score (combo window via lastKillTime),combo,kill,onDamage,tick},
livesMgr.{count,max,damage(),reset()}, game.state, time, step(dt,intent), drainEvents()}

## Perf probe rule (established I46)
For "within 10% of baseline" checks: park the ship (re-park every ~500ms), hold exactly N
medium rocks (shed split fragments), force wave 4 (waves.wave=4, state='active', toSpawn=8),
sustained fire, bloom High, read the 0.5s fps-meter window.
Baselines: I36 56-60fps / 40 calls / 1638 tris; I45 60 / 37 / 1626; I46 60 / 34 / 1466.
