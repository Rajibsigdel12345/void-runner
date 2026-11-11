// ST-027: WebAudio synth SFX. No assets: every cue is oscillator/noise
// envelopes. init() must run inside a user gesture (autoplay policy); until
// then all calls are safe no-ops. Cues are rate-limited per name to avoid
// overlap spam at RAPID fire rates.
// ST-027 base cues, ST-029 polish: stingers (note arrays), per-play pitch
// jitter, stereo pan from world x, and a compressor on the master chain.
// ST-087 sound-level pass: cues are grouped into three weight tiers so the mix has a
// deliberate dynamic range and real headroom (the master chain ends in a true-peak
// limiter). Background cues (shoot/swish/mineFire) sit low so rapid fire never fatigues;
// event cues (kill/mine/powerup/shields/boss rings/overdrive/vortex) read clearly; impact
// cues (hit/bossDeath/bomb) are the loudest but trimmed so the limiter only tames the peak.
const CUES = {
  shoot:     { type: 'square',   f0: 880, f1: 440, dur: 0.06, gain: 0.12, min: 0.04 },
  kill:      { type: 'triangle', f0: 320, f1: 120, dur: 0.12, gain: 0.30, min: 0.05, noise: 0.08 },
  hit:       { type: 'sawtooth', f0: 110, f1: 55,  dur: 0.25, gain: 0.45, min: 0.05, noise: 0.2 },
  powerup:   { type: 'sine',     f0: 660, f1: 990, dur: 0.18, gain: 0.25, min: 0.05 },
  // I173 (ST-173): cold shimmer for the slow-mo pickup (ST-115); all other pickups keep the plain powerup ding
  slowmo:    { type: 'sine',     f0: 880, f1: 1320, dur: 0.2,  gain: 0.18, min: 0.05 },
  shieldPop: { type: 'sine',     f0: 1320, f1: 1320, dur: 0.15, gain: 0.22, min: 0.05 },
  // ST-127: shielded rock armor hit - short metallic tick (bright square falling into a low thump + noise clank).
  // Background tier: it can be spammed by holding fire on armor, so keep it quiet + rate-limited.
  shieldHit: { type: 'square',   f0: 880, f1: 220, dur: 0.09, gain: 0.16, min: 0.08, noise: 0.1 },
  // ST-053 near-miss swish: soft low noise puff under a quick descending sine
  swish:     { type: 'sine',     f0: 300, f1: 100, dur: 0.18, gain: 0.09, min: 0.12, noise: 0.28 }, // ST-083: fuller near-miss whoosh (wider sweep, heavier noise)
  // ST-054 mine drone pop: a short percussive boom (noise tail + low square thump)
  mine:      { type: 'square',   f0: 180, f1: 60,  dur: 0.22, gain: 0.32, min: 0.05, noise: 0.16 },
  drone:     { type: 'sawtooth', f0: 520, f1: 110, dur: 0.26, gain: 0.28, min: 0.05, noise: 0.22 },  // ST-117 seeker zap (brighter + noisier than the mine pop)
  // I173 (ST-173): seeker battery decay (I129) - a smaller descending blip, not the full zap
  droneDecay:{ type: 'sine',     f0: 340, f1: 140, dur: 0.18, gain: 0.14, min: 0.1 },
  // ST-055 the Monolith: low spawn drone, ring-burst crack, big death boom
  bossSpawn: { type: 'sine',   gain: 0.30, min: 0.4, noise: 0.35, notes: [[55, 41, 0.7, 0, 0.34], [82.4, 79, 0.55, 0.12, 0.2], [164.8, 160, 0.4, 0.06, 0.1]] }, // ST-083: low tritone stinger
  // I173 (ST-173): Warden (ST-136/137) spawn sting - compact 2-note low variant of bossSpawn (full boss stays 3-note)
  wardenSpawn: { type: 'sine',  gain: 0.22, min: 0.4, noise: 0.25, notes: [[55, 41, 0.5, 0, 0.26], [82.4, 79, 0.4, 0.1, 0.18]] },
  bossRing:  { type: 'sine',   f0: 300, f1: 120, dur: 0.25, gain: 0.18, min: 0.15, noise: 0.15 },
  bossDeath: { type: 'square', f0: 80,  f1: 30,  dur: 0.7,  gain: 0.45, min: 0.3,  noise: 0.5 },  // ST-087 impact tier: trimmed 0.5->0.45 for limiter headroom
  // I173 (ST-173): Warden death - mid boom, below the full-boss impact tier
  wardenDeath: { type: 'square', f0: 70, f1: 32, dur: 0.45, gain: 0.34, min: 0.2, noise: 0.3 },
  // ST-229: Stinger telegraph - a rising saw sweep over the 0.8 s warning (locks at the dash)
  stingerTelegraph: { type: 'sawtooth', f0: 220, f1: 880, dur: 0.8, gain: 0.2, min: 0.25 },
  // ST-229: Stinger death - mid boom BELOW the warden rung (wardenDeath f0 70 / gain 0.34)
  stingerDeath: { type: 'square', f0: 58, f1: 26, dur: 0.4, gain: 0.28, min: 0.2, noise: 0.25 },
  // ST-056 enemy bolts: low saw zap (boss), soft tick (mine)
  bossFire: { type: 'sawtooth', f0: 520, f1: 180, dur: 0.18, gain: 0.20, min: 0.12 },
  mineFire: { type: 'square',   f0: 340, f1: 220, dur: 0.10, gain: 0.12, min: 0.1,  noise: 0.08 },
  // ST-057 overdrive pickup: rising boost sweep
  overdrive: { type: 'triangle', f0: 280, f1: 920, dur: 0.28, gain: 0.22, min: 0.15 },
  // ST-059 gravity vortex: descending warning hum, then a deep sustained rumble
  vortexTelegraph: { type: 'sine', f0: 220, f1: 90, dur: 0.9, gain: 0.16, min: 0.6 },
  vortexStart: { type: 'sawtooth', f0: 70, f1: 38, dur: 1.4, gain: 0.28, min: 1.0, noise: 0.18 },
  bomb:      { type: 'sine',     f0: 90,  f1: 40,  dur: 0.5,  gain: 0.55, min: 0.1,  noise: 0.4 },  // ST-087 impact tier: trimmed 0.7->0.55 for limiter headroom
  wave:      { type: 'sine',     f0: 523, f1: 659, dur: 0.25, gain: 0.16, min: 0.1 },
  // ST-029 stingers: rising arpeggio on wave clear, falling motif on game over
  cleared:   { type: 'sine',     gain: 0.2,  min: 0.2, notes: [[523, 523, 0.12, 0, 0.2], [659, 659, 0.12, 0.09, 0.2], [784, 784, 0.12, 0.18, 0.2], [1046, 1046, 0.3, 0.27, 0.24]] }, // ST-083: 4-note rising jingle (C5-E5-G5-C6)
  gameover:  { type: 'sawtooth', gain: 0.26, min: 0.3, noise: 0.5, notes: [[440, 440, 0.2, 0, 0.28], [330, 330, 0.2, 0.18, 0.28], [196, 196, 0.55, 0.36, 0.3]] },
  // ST-123 weapon level-up: bright rising 3-note arpeggio (event tier)
  levelUp:   { type: 'triangle', gain: 0.22, min: 0.15, notes: [[523, 523, 0.1, 0, 0.2], [659, 659, 0.1, 0.09, 0.2], [784, 784, 0.22, 0.18, 0.24]] },
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
  let musicOn = true; // I158: music bed user toggle (main also gates the bed on PLAYING)
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
    const limiter = ctx.createDynamicsCompressor(); // ST-087: true-peak limiter - holds the loudest isolated cue + worst-case stacking below the device ceiling (I84 saw the post-makeup chain reach ~1.02 on an isolated bomb)
    limiter.threshold.value = -8;   // ~0.40 linear: starts limiting just below the impact tier so stacking is caught
    limiter.knee.value = 3;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.06;
    makeup.connect(limiter);
    limiter.connect(meterNode);
    limiter.connect(ctx.destination);
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

  // I158: generative ambient music bed - soft sustained minor pad + sparse pentatonic
  // pluck, own gain bus under master (independent of ST-083 drone ambience). Procedural.
  // main.js drives music(on) exactly like ambience(on): PLAYING + the music setting.
  // I169: the bed becomes an EVOLVING ambient drone loop (design/audio-music.md):
  // 4-chord progression (Am-Fmaj7-Cmaj7-G, 18s each = 72s loop) via setTargetAtTime
  // frequency glides (no node churn, no clicks), a sine sub-drone at chord-root/2 with
  // 0.1Hz breathing tremolo, a looped-noise "air" layer through a slowly wandering
  // bandpass, and the pluck re-tuned to A-minor pentatonic (the old C-major set clashed
  // with the A-minor pad). Research grounding: design/audio-music.md. musicIntensity(x)
  // is the ST-170 escalation seam (not wired to gameplay yet).
  let musicBus = null, musicNodes = [], musicFilter = null, musicLfo = null, musicLfoGain = null;
  let musicTimers = [], musicPad = [], musicSub = null, musicChordIdx = 0, musicIntensityVal = 0, musicWarpCents = 0; // I172
  const MUSIC_BASE = 0.13;
  const MUSIC_CHORDS = [ // I169: 4 voices each, same register as the I158 pad
    [110.00, 164.81, 220.00, 329.63], // Am:   A2 E3 A3 E4 (open root-fifth)
    [ 87.31, 174.61, 220.00, 261.63], // Fmaj7: F2 F3 A3 C4
    [130.81, 164.81, 196.00, 261.63], // Cmaj7: C3 E3 G3 C4
    [ 98.00, 196.00, 246.94, 293.66], // G:    G2 G3 B3 D4
  ];
  const MUSIC_ROOTS = [55.00, 43.65, 65.41, 49.00]; // I169: sub drone = chord root / 2
  const MUSIC_CHORD_SEC = 18;
  const MUSIC_GLIDE = 2.5; // setTargetAtTime tau (s) for the chord morph (~3.5s audible glide)
  const PLUCK = [220.0, 246.94, 261.63, 293.66, 329.63, 440.0]; // I169: A-minor pentatonic
  function startMusic() {
    if (!ctx || musicBus) return;
    musicBus = ctx.createGain(); musicBus.gain.value = 0.0001;
    musicFilter = ctx.createBiquadFilter(); musicFilter.type = 'lowpass'; musicFilter.frequency.value = 1200; musicFilter.Q.value = 0.6;
    musicBus.connect(musicFilter); musicFilter.connect(master);
    const t = ctx.currentTime;
    musicBus.gain.setTargetAtTime(MUSIC_BASE, t, 1.4);
    musicChordIdx = 0; musicIntensityVal = 0; musicWarpCents = 0; // I172
    for (const f of MUSIC_CHORDS[0]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = (Math.random() * 8) - 4; const g = ctx.createGain(); g.gain.value = 0.15; o.connect(g); g.connect(musicBus); o.start(); musicNodes.push(o, g); musicPad.push(o); }
    { // I169: sub drone - sine at chord root/2 with a 0.1Hz breathing tremolo
      musicSub = ctx.createOscillator(); musicSub.type = 'sine'; musicSub.frequency.value = MUSIC_ROOTS[0];
      const sg = ctx.createGain(); sg.gain.value = 0.08;
      const trem = ctx.createOscillator(); trem.type = 'sine'; trem.frequency.value = 0.1;
      const tg = ctx.createGain(); tg.gain.value = 0.02;
      trem.connect(tg); tg.connect(sg.gain);
      musicSub.connect(sg); sg.connect(musicBus);
      musicSub.start(); trem.start();
      musicNodes.push(musicSub, sg, trem, tg);
    }
    { // I169: noise-air layer - looped white noise through a slowly wandering bandpass
      const noise = ctx.createBufferSource(); noise.buffer = noiseBuf; noise.loop = true;
      const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 400; nf.Q.value = 0.5;
      const ng = ctx.createGain(); ng.gain.value = 0.02;
      noise.connect(nf); nf.connect(ng); ng.connect(musicBus);
      noise.start();
      musicNodes.push(noise, nf, ng);
      const nlfo = ctx.createOscillator(); nlfo.type = 'sine'; nlfo.frequency.value = 0.03;
      const nlfoG = ctx.createGain(); nlfoG.gain.value = 150;
      nlfo.connect(nlfoG); nlfoG.connect(nf.frequency); nlfo.start();
      musicNodes.push(nlfo, nlfoG);
    }
    musicLfo = ctx.createOscillator(); musicLfo.type = 'sine'; musicLfo.frequency.value = 0.05;
    musicLfoGain = ctx.createGain(); musicLfoGain.gain.value = 320;
    musicLfo.connect(musicLfoGain); musicLfoGain.connect(musicFilter.frequency); musicLfo.start();
    musicNodes.push(musicLfo, musicLfoGain);
    const chordTick = () => { if (!musicBus) return; musicChordIdx = (musicChordIdx + 1) % MUSIC_CHORDS.length; const ct = ctx.currentTime; for (let i = 0; i < musicPad.length; i++) musicPad[i].frequency.setTargetAtTime(MUSIC_CHORDS[musicChordIdx][i], ct, MUSIC_GLIDE); musicSub.frequency.setTargetAtTime(MUSIC_ROOTS[musicChordIdx], ct, MUSIC_GLIDE * 1.5); musicTimers.push(setTimeout(chordTick, MUSIC_CHORD_SEC * 1000)); };
    musicTimers.push(setTimeout(chordTick, MUSIC_CHORD_SEC * 1000));
    const tick = () => { if (!musicBus) return; if (ctx.state === 'running') playPluck(); musicTimers.push(setTimeout(tick, 950 + Math.random() * 1500)); };
    musicTimers.push(setTimeout(tick, 600));
  }
  function playPluck() {
    if (!musicBus || ctx.state !== 'running') return;
    const f = PLUCK[(Math.random() * PLUCK.length) | 0];
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = musicWarpCents; // I172: pluck inherits warp so the melody doesn't stick out
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.11, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    o.connect(g); g.connect(musicFilter); o.start(t); o.stop(t + 1.2);
  }
  function stopMusic() {
    if (!musicBus) return;
    for (const tm of musicTimers) clearTimeout(tm); musicTimers = []; musicPad = []; musicSub = null;
    const t = ctx.currentTime;
    musicBus.gain.cancelScheduledValues(t); musicBus.gain.setTargetAtTime(0.0001, t, 0.3);
    const bus = musicBus, nodes = musicNodes, flt = musicFilter, lfo = musicLfo, lfoGain = musicLfoGain;
    musicBus = null; musicNodes = []; musicFilter = null; musicLfo = null; musicLfoGain = null;
    setTimeout(() => { for (const n of nodes) { try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} } try { if (lfo) lfo.disconnect(); } catch (e) {} try { if (lfoGain) lfoGain.disconnect(); } catch (e) {} try { if (flt) flt.disconnect(); } catch (e) {} try { bus.disconnect(); } catch (e) {} }, 1300);
  }
  function music(on) { if (on) startMusic(); else stopMusic(); }
  function setMusic(on) { musicOn = on === true; }
  function musicIntensity(x) { // I169: ST-170 escalation seam - 0 (calm) .. 1 (escalated). Smooth retargets; call anytime.
    musicIntensityVal = Math.max(0, Math.min(1, x || 0));
    if (!musicBus) return;
    const it = ctx.currentTime;
    musicFilter.frequency.setTargetAtTime(1200 + 1400 * musicIntensityVal, it, 1.0); // open the filter as tension rises
    musicBus.gain.setTargetAtTime(MUSIC_BASE + 0.05 * musicIntensityVal, it, 0.8); // +~38% headroom at full intensity
  }
  function timeWarp(x, opts = {}) { // I172: ST-172 bullet-time seam - 0 (normal time) .. 1 (fully dilated). Smooth retargets; call anytime.
    const centsMax = (opts && opts.centsMax > 0) ? opts.centsMax : 700;
    const keep = (opts && typeof opts.filterKeep === 'number') ? opts.filterKeep : 0.3;
    const wx = Math.max(0, Math.min(1, x || 0));
    musicWarpCents = wx === 0 ? 0 : -wx * centsMax;
    if (!musicBus) return;
    const wt = ctx.currentTime;
    for (const o of musicPad) o.detune.setTargetAtTime(musicWarpCents, wt, 0.25); // pitch drops as the world slows (separate param: composes with chord glides)
    if (musicSub) musicSub.detune.setTargetAtTime(musicWarpCents, wt, 0.25);
    const base = 1200 + 1400 * musicIntensityVal; // compose with I170 intensity
    musicFilter.frequency.setTargetAtTime(base * (1 - wx * (1 - keep)), wt, 0.25); // darken as time dilates
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

  return { init, setVolume, setSfx, setMuted, state, sfx, ambience, ambOn: () => !!ambBus, music, setMusic, musicOn: () => !!musicBus, musicChord: () => ({ i: musicChordIdx, f: MUSIC_CHORDS[musicChordIdx], sub: MUSIC_ROOTS[musicChordIdx] }), musicIntensity, musicIntensityVal: () => musicIntensityVal, timeWarp, warpCents: () => musicWarpCents, ambLevel: () => (ambBus ? ambBus.gain.value : null), meter, played, lastPan: () => lastPan, weights: () => Object.fromEntries(Object.entries(CUES).map(([k, s]) => [k, s.gain])), get volume() { return volume; } }; // I172: +timeWarp/warpCents seam
}
