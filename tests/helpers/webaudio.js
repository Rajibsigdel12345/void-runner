// ST-180 (I180): minimal WebAudio stub for headless unit tests of
// src/render/audio.js. Test-only fixture: the in-process runner only loads
// tests/*.test.js, so this helper is never run as a test file itself, and the
// production build (src/ + assets/) never bundles it.
//
// Coverage: every WebAudio call audio.js makes - the context, the master chain
// (gain -> compressor -> makeup -> limiter -> analyser/destination), AudioParam
// scheduling (setTargetAtTime records __lastTarget so tests can assert
// volume/mute deterministically), oscillators, buffer sources, stereo panners,
// biquad filters, and the shared noise buffer.
//
// Deliberate boundary: the music/ambience buses (startMusic/startAmbience)
// schedule recurring setTimeouts that keep the node event loop alive, so the
// tests never start them (see tests/audio.test.js). The bus seams (musicChord,
// musicIntensity, timeWarp) are exercised in their no-bus state, which is the
// same state main.js starts them in.

function makeParam(value) {
  return {
    value: value === undefined ? 0 : value,
    __lastTarget: undefined, // last setTargetAtTime value
    __lastTargetT: undefined,
    __lastTargetTc: undefined,
    setTargetAtTime: function (v, t, tc) {
      this.__lastTarget = v; this.__lastTargetT = t; this.__lastTargetTc = tc; return this;
    },
    setValueAtTime: function (v) { this.value = v; return this; },
    exponentialRampToValueAtTime: function (v) { this.value = v; return this; },
    linearRampToValueAtTime: function (v) { this.value = v; return this; },
    cancelScheduledValues: function () { return this; },
    connect: function (node) { return node; },
    disconnect: function () { return this; },
  };
}

function makeNode(stub, kind) {
  return {
    __kind: kind,
    __stub: stub,
    __connections: [],
    connect: function (dest) { this.__connections.push(dest); return dest; },
    disconnect: function () { this.__connections.length = 0; return this; },
  };
}

// Install a stub AudioContext as window.AudioContext and return a handle:
//   handle.instances - every AudioContext constructed since install
//   handle.restore() - restores the previous global window
export function installAudioStub() {
  const instances = [];
  class StubAudioContext {
    constructor() {
      this.state = 'running';
      this.currentTime = 0; // tests advance this manually to exercise rate limits
      this.sampleRate = 48000;
      this.destination = { __kind: 'destination', connect: function () {}, disconnect: function () {} };
      this.gains = [];         // creation order per init: [0] master, [1] makeup
      this.compressors = [];   // [0] compressor, [1] true-peak limiter
      this.analysers = [];
      this.oscillators = [];
      this.bufferSources = [];
      this.panners = [];
      this.biquads = [];
      this.buffers = [];
      this.resumeCalls = 0;
      instances.push(this);
    }
    resume() { this.resumeCalls++; return Promise.resolve(); }
    suspend() { return Promise.resolve(); }
    createGain() {
      const g = makeNode(this, 'gain');
      g.gain = makeParam(1);
      this.gains.push(g);
      return g;
    }
    createDynamicsCompressor() {
      const c = makeNode(this, 'compressor');
      c.threshold = makeParam(0); c.knee = makeParam(0); c.ratio = makeParam(1);
      c.attack = makeParam(0); c.release = makeParam(0);
      this.compressors.push(c);
      return c;
    }
    createAnalyser() {
      const a = makeNode(this, 'analyser');
      a.fftSize = 0;
      a.__meterCalls = 0;
      a.getFloatTimeDomainData = function (arr) {
        for (let i = 0; i < arr.length; i++) arr[i] = 0.25; // flat frame: peak = rms = 0.25
        a.__meterCalls++;
      };
      this.analysers.push(a);
      return a;
    }
    createBuffer(ch, len, rate) {
      const data = [new Float32Array(len)];
      const buf = {
        numberOfChannels: ch,
        length: len,
        sampleRate: rate,
        getChannelData: function (c) { return data[c] || data[0]; },
      };
      this.buffers.push({ ch: ch, len: len, rate: rate, buf: buf });
      return buf;
    }
    createOscillator() {
      const o = makeNode(this, 'oscillator');
      o.type = 'sine';
      o.frequency = makeParam(440);
      o.detune = makeParam(0);
      o.__started = 0;
      o.__stopped = 0;
      o.start = function () { o.__started++; };
      o.stop = function () { o.__stopped++; };
      this.oscillators.push(o);
      return o;
    }
    createBufferSource() {
      const s = makeNode(this, 'bufferSource');
      s.buffer = null;
      s.loop = false;
      s.__started = 0;
      s.__stopped = 0;
      s.start = function () { s.__started++; };
      s.stop = function () { s.__stopped++; };
      this.bufferSources.push(s);
      return s;
    }
    createStereoPanner() {
      const p = makeNode(this, 'panner');
      p.pan = makeParam(0);
      this.panners.push(p);
      return p;
    }
    createBiquadFilter() {
      const f = makeNode(this, 'biquad');
      f.type = 'lowpass';
      f.frequency = makeParam(350);
      f.Q = makeParam(1);
      this.biquads.push(f);
      return f;
    }
  }
  const prevWindow = globalThis.window;
  globalThis.window = { AudioContext: StubAudioContext };
  return {
    instances: instances,
    restore: function () {
      if (prevWindow === undefined) { try { delete globalThis.window; } catch (e) {} }
      else { globalThis.window = prevWindow; }
    },
  };
}
