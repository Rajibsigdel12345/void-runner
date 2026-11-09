// ST-027: WebAudio synth SFX. No assets: every cue is oscillator/noise
// envelopes. init() must run inside a user gesture (autoplay policy); until
// then all calls are safe no-ops. Cues are rate-limited per name to avoid
// overlap spam at RAPID fire rates.
const CUES = {
  shoot:     { type: 'square',   f0: 880, f1: 440, dur: 0.06, gain: 0.12, min: 0.04 },
  kill:      { type: 'triangle', f0: 320, f1: 120, dur: 0.12, gain: 0.30, min: 0.05, noise: 0.08 },
  hit:       { type: 'sawtooth', f0: 110, f1: 55,  dur: 0.25, gain: 0.45, min: 0.05, noise: 0.2 },
  powerup:   { type: 'sine',     f0: 660, f1: 990, dur: 0.18, gain: 0.25, min: 0.05 },
  shieldPop: { type: 'sine',     f0: 1320, f1: 1320, dur: 0.15, gain: 0.22, min: 0.05 },
  bomb:      { type: 'sine',     f0: 90,  f1: 40,  dur: 0.5,  gain: 0.7,  min: 0.1,  noise: 0.4 },
  wave:      { type: 'sine',     f0: 523, f1: 659, dur: 0.25, gain: 0.16, min: 0.1 },
  gameover:  { type: 'sawtooth', f0: 440, f1: 110, dur: 0.6,  gain: 0.3,  min: 0.2 },
};

export function createAudio() {
  let ctx = null;
  let master = null;
  let noiseBuf = null;
  let volume = 0.7;
  let sfxOn = true;
  let muted = false;
  const lastPlay = {};
  const played = {}; // probe counter: { cueName: timesScheduled }

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
    master.connect(ctx.destination);
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

  function playCue(spec, when) {
    const t = when;
    const osc = ctx.createOscillator();
    osc.type = spec.type;
    osc.frequency.setValueAtTime(spec.f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, spec.f1), t + spec.dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(spec.gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + spec.dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + spec.dur + 0.02);
    if (spec.noise && noiseBuf) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(spec.gain * 0.5, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + spec.noise);
      src.connect(ng); ng.connect(master);
      src.start(t); src.stop(t + spec.noise + 0.02);
    }
  }

  /** Play a named cue if allowed (sfx on, not rate-limited). */
  function sfx(name) {
    if (!ctx || !sfxOn) return false;
    const spec = CUES[name];
    if (!spec) return false;
    const t = ctx.currentTime;
    if (lastPlay[name] !== undefined && t - lastPlay[name] < spec.min) return false;
    lastPlay[name] = t;
    played[name] = (played[name] || 0) + 1;
    playCue(spec, t);
    return true;
  }

  return { init, setVolume, setSfx, setMuted, state, sfx, played, get volume() { return volume; } };
}
