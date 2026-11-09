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
  swish:     { type: 'sine',     f0: 240, f1: 90,  dur: 0.16, gain: 0.09, min: 0.15, noise: 0.12 },
  // ST-054 mine drone pop: a short percussive boom (noise tail + low square thump)
  mine:      { type: 'square',   f0: 180, f1: 60,  dur: 0.22, gain: 0.32, min: 0.05, noise: 0.16 },
  // ST-055 the Monolith: low spawn drone, ring-burst crack, big death boom
  bossSpawn: { type: 'sine',   f0: 110, f1: 55,  dur: 0.6,  gain: 0.30, min: 0.4 },
  bossRing:  { type: 'sine',   f0: 300, f1: 120, dur: 0.25, gain: 0.18, min: 0.15, noise: 0.15 },
  bossDeath: { type: 'square', f0: 80,  f1: 30,  dur: 0.7,  gain: 0.50, min: 0.3,  noise: 0.5 },
  bomb:      { type: 'sine',     f0: 90,  f1: 40,  dur: 0.5,  gain: 0.7,  min: 0.1,  noise: 0.4 },
  wave:      { type: 'sine',     f0: 523, f1: 659, dur: 0.25, gain: 0.16, min: 0.1 },
  // ST-029 stingers: rising arpeggio on wave clear, falling motif on game over
  cleared:   { type: 'sine',     gain: 0.2,  min: 0.2, notes: [[523, 523, 0.12, 0, 0.2], [659, 659, 0.12, 0.09, 0.2], [784, 784, 0.22, 0.18, 0.22]] },
  gameover:  { type: 'sawtooth', gain: 0.26, min: 0.3, noise: 0.5, notes: [[440, 440, 0.2, 0, 0.28], [330, 330, 0.2, 0.18, 0.28], [196, 196, 0.55, 0.36, 0.3]] },
};
const ARENA_R = 26; // for pan normalization (matches config arena radius)

export function createAudio() {
  let ctx = null;
  let master = null;
  let noiseBuf = null;
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
    comp.connect(ctx.destination);
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
    played[name] = (played[name] || 0) + 1;
    lastPan = pos && isFinite(pos.x) ? Math.max(-1, Math.min(1, pos.x / ARENA_R)) * 0.8 : 0;
    playCue(spec, t, lastPan);
    return true;
  }

  return { init, setVolume, setSfx, setMuted, state, sfx, played, lastPan: () => lastPan, get volume() { return volume; } };
}
