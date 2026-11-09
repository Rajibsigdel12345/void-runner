// ST-027: WebAudio synth SFX. No assets: every cue is oscillator/noise
// envelopes. init() must run inside a user gesture (autoplay policy); until
// then all calls are safe no-ops. Cues are rate-limited per name to avoid
// overlap spam at RAPID fire rates.
// ST-027 base cues, ST-029 polish: stingers (note arrays), per-play pitch
// jitter, stereo pan from world x, and a compressor on the master chain.
const CUES = {
  shoot:     { type: 'square',   f0: 880, f1: 440, dur: 0.06, gain: 0.12, min: 0.04 },
  kill:      { type: 'triangle', f0: 320, f1: 120, dur: 0.12, gain: 0.30, min: 0.05, noise: 0.08 },
  hit:       { type: 'sawtooth', f0: 110, f1: 55,  dur: 0.25, gain: 0.45, min: 0.05, noise: 0.2 },
  powerup:   { type: 'sine',     f0: 660, f1: 990, dur: 0.18, gain: 0.25, min: 0.05 },
  shieldPop: { type: 'sine',     f0: 1320, f1: 1320, dur: 0.15, gain: 0.22, min: 0.05 },
  // ST-053 near-miss swish: soft low noise puff under a quick descending sine
  swish:     { type: 'sine',     f0: 300, f1: 100, dur: 0.18, gain: 0.09, min: 0.12, noise: 0.28 }, // ST-083: fuller near-miss whoosh (wider sweep, heavier noise)
  // ST-054 mine drone pop: a short percussive boom (noise tail + low square thump)
  mine:      { type: 'square',   f0: 180, f1: 60,  dur: 0.22, gain: 0.32, min: 0.05, noise: 0.16 },
  // ST-055 the Monolith: low spawn drone, ring-burst crack, big death boom
  bossSpawn: { type: 'sine',   gain: 0.30, min: 0.4, noise: 0.35, notes: [[55, 41, 0.7, 0, 0.34], [82.4, 79, 0.55, 0.12, 0.2], [164.8, 160, 0.4, 0.06, 0.1]] }, // ST-083: low tritone stinger
  bossRing:  { type: 'sine',   f0: 300, f1: 120, dur: 0.25, gain: 0.18, min: 0.15, noise: 0.15 },
  bossDeath: { type: 'square', f0: 80,  f1: 30,  dur: 0.7,  gain: 0.50, min: 0.3,  noise: 0.5 },
  // ST-056 enemy bolts: low saw zap (boss), soft tick (mine)
  bossFire: { type: 'sawtooth', f0: 520, f1: 180, dur: 0.18, gain: 0.20, min: 0.12 },
  mineFire: { type: 'square',   f0: 340, f1: 220, dur: 0.10, gain: 0.12, min: 0.1,  noise: 0.08 },
  // ST-057 overdrive pickup: rising boost sweep
  overdrive: { type: 'triangle', f0: 280, f1: 920, dur: 0.28, gain: 0.22, min: 0.15 },
  // ST-059 gravity vortex: descending warning hum, then a deep sustained rumble
  vortexTelegraph: { type: 'sine', f0: 220, f1: 90, dur: 0.9, gain: 0.16, min: 0.6 },
  vortexStart: { type: 'sawtooth', f0: 70, f1: 38, dur: 1.4, gain: 0.28, min: 1.0, noise: 0.18 },
  bomb:      { type: 'sine',     f0: 90,  f1: 40,  dur: 0.5,  gain: 0.7,  min: 0.1,  noise: 0.4 },
  wave:      { type: 'sine',     f0: 523, f1: 659, dur: 0.25, gain: 0.16, min: 0.1 },
  // ST-029 stingers: rising arpeggio on wave clear, falling motif on game over
  cleared:   { type: 'sine',     gain: 0.2,  min: 0.2, notes: [[523, 523, 0.12, 0, 0.2], [659, 659, 0.12, 0.09, 0.2], [784, 784, 0.12, 0.18, 0.2], [1046, 1046, 0.3, 0.27, 0.24]] }, // ST-083: 4-note rising jingle (C5-E5-G5-C6)
  gameover:  { type: 'sawtooth', gain: 0.26, min: 0.3, noise: 0.5, notes: [[440, 440, 0.2, 0, 0.28], [330, 330, 0.2, 0.18, 0.28], [196, 196, 0.55, 0.36, 0.3]] },
};
const ARENA_R = 26; // for pan normalization (matches config arena radius)

export function createAudio() {
  let ctx = null;
  let master = null;
  let noiseBuf = null;
  let meterNode = null, meterBuf = null; // ST-084: master-chain level probe
  let volume = 0.7;
  let sfxOn = true;
  let muted = false;
  const lastPlay = {};
  const played = {}; // probe counter: { cueName: timesScheduled }
  let lastPan = 0;    // probe: last pan applied (-1..1)

  function applyGain() {
    if (!master) return;
    const t = ctx.currentTime;
    const v = muted ? 0 : volume;
    master.gain.setTargetAtTime(v, t, 0.02);
  }

  /** Must be called from a user gesture. Safe to call repeatedly. */
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return; // no WebAudio: all sfx no-op
    ctx = new AC();
    master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor(); // ST-029: keeps stacked cues from clipping
    comp.threshold.value = -18;
    comp.knee.value = 20;
    comp.ratio.value = 6;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;
    master.connect(comp);
    const makeup = ctx.createGain(); makeup.gain.value = 1.4; // ST-084: lift level after compression (comp only takes it down)
    comp.connect(makeup);
    meterNode = ctx.createAnalyser(); meterNode.fftSize = 1024; meterBuf = new Float32Array(1024); // ST-084: sink (does not forward)
    makeup.connect(meterNode);
    makeup.connect(ctx.destination);
    applyGain();
    // one shared white-noise buffer (0.5s) for percussive tails
    noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function setVolume(v) { volume = Math.min(1, Math.max(0, v)); applyGain(); }
  function setSfx(on) { sfxOn = on === true; }
  function setMuted(m) { muted = m === true; applyGain(); }
  function state() { return ctx ? ctx.state : 'uninitialized'; }

  /** ST-084: master-chain level probe (post makeup, pre device). {peak, rms} in [-1,1]. */
  function meter() {
    if (!meterNode) return null;
    meterNode.getFloatTimeDomainData(meterBuf);
    let peak = 0, sum = 0;
    for (let i = 0; i < meterBuf.length; i++) { const v = meterBuf[i]; const a = Math.abs(v); if (a > peak) peak = a; sum += v * v; }
    return { peak, rms: Math.sqrt(sum / meterBuf.length) };
  }

  // ST-083: ambience bed - a very quiet detuned low drone with a slow "breathing"
  // LFO, on its own gain bus under the master. sfx() sidechain-ducks it so cues
  // always sit on top. Runs only while the game is PLAYING (main.js drives it).
  let ambBus = null, ambNodes = [], ambLfo = null, ambLfoGain = null;
  const ambBase = 0.05; // bus level at rest (pre master volume)

  function startAmbience() {
    if (!ctx || ambBus) return;
    ambBus = ctx.createGain();
    ambBus.gain.value = ambBase;
    ambBus.connect(master);
    const mk = (type, f, g) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
      const og = ctx.createGain(); og.gain.value = g;
      o.connect(og); og.connect(ambBus); o.start();
      ambNodes.push(o, og);
    };
    mk('sine', 55, 0.6);       // A1 bed
    mk('sine', 82.5, 0.35);    // E2 fifth
    mk('triangle', 110, 0.12); // A2 shimmer
    ambLfo = ctx.createOscillator(); ambLfo.type = 'sine'; ambLfo.frequency.value = 0.08;
    ambLfoGain = ctx.createGain(); ambLfoGain.gain.value = ambBase * 0.4;
    ambLfo.connect(ambLfoGain); ambLfoGain.connect(ambBus.gain); // slow breathing on top of the bus
    ambLfo.start();
  }

  function stopAmbience() {
    if (!ambBus) return;
    const t = ctx.currentTime;
    ambBus.gain.cancelScheduledValues(t);
    ambBus.gain.setTargetAtTime(0.0001, t, 0.25); // fade out, then disconnect
    const bus = ambBus, nodes = ambNodes;
    if (ambLfo) { try { ambLfo.stop(t + 1); } catch (e) {} }
    if (ambLfoGain) { try { ambLfoGain.disconnect(); } catch (e) {} }
    ambBus = null; ambNodes = []; ambLfo = null; ambLfoGain = null;
    setTimeout(() => {
      try { bus.disconnect(); } catch (e) {}
      for (const n of nodes) { try { n.disconnect(); } catch (e) {} }
    }, 1200);
  }

  function ambience(on) { if (on) startAmbience(); else stopAmbience(); }

  function duck(t) { // ST-083: sidechain dip under any playing cue
    if (!ambBus) return;
    const g = ambBus.gain;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(ambBase * 0.35, t, 0.01);   // fast dip
    g.setTargetAtTime(ambBase, t + 0.12, 0.45);   // slow release back
  }


  function scheduleNote(type, f0, f1, dur, gain, t, out) {
    const osc = ctx.createOscillator();
    osc.type = type;
    // ST-029 pitch jitter: +-3% so repeated cues never feel looped
    const j = 0.97 + Math.random() * 0.06;
    osc.frequency.setValueAtTime(Math.max(1, f0 * j), t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1 * j), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(out);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  function playCue(spec, when, pan) {
    const t = when;
    // ST-029: stereo pan from world x (centered arena)
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    panner.connect(master);
    if (spec.notes) {
      for (const n of spec.notes) scheduleNote(spec.type, n[0], n[1], n[2], n[4], t + n[3], panner);
    } else {
      scheduleNote(spec.type, spec.f0, spec.f1, spec.dur, spec.gain, t, panner);
    }
    if (spec.noise && noiseBuf) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(spec.gain * 0.5, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + spec.noise);
      src.connect(ng); ng.connect(panner);
      src.start(t); src.stop(t + spec.noise + 0.02);
    }
  }

  /** Play a named cue if allowed (sfx on, not rate-limited). pos: optional {x,y} for pan. */
  function sfx(name, pos) {
    if (!ctx || !sfxOn) return false;
    const spec = CUES[name];
    if (!spec) return false;
    const t = ctx.currentTime;
    if (lastPlay[name] !== undefined && t - lastPlay[name] < spec.min) return false;
    lastPlay[name] = t;
    duck(t); // ST-083: dip the ambience bed under the cue
    played[name] = (played[name] || 0) + 1;
    lastPan = pos && isFinite(pos.x) ? Math.max(-1, Math.min(1, pos.x / ARENA_R)) * 0.8 : 0;
    playCue(spec, t, lastPan);
    return true;
  }

  return { init, setVolume, setSfx, setMuted, state, sfx, ambience, ambOn: () => !!ambBus, ambLevel: () => (ambBus ? ambBus.gain.value : null), meter, played, lastPan: () => lastPan, get volume() { return volume; } };
}
