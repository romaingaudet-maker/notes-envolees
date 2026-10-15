/* ------------------------------------------------------------------
   Moteur sonore : un timbre synthétisé par comptine (Web Audio)
   - transposition globale pour les instruments en si♭, mi♭ et fa
   - garde en mémoire quand la page se tait, pour que l'écoute du micro
     ne confonde pas le haut-parleur avec l'instrument
------------------------------------------------------------------- */
const Sound = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null, master = null, revIn = null, noise = null;
  let transpose = 0, quietUntil = 0, lastConcert = null;
  const ksCache = new Map();
  const waves = new Map();
  const tapBuses = new Map();

  const VOICES = {
    bell:      { kind: 'add', rev: 0.34, gain: 0.30, attack: 0.003, ring: 1.4,
                 partials: [[0.5, 0.20, 2.4], [1, 1, 2.1], [2, 0.42, 1.3], [3, 0.2, 0.8], [4.2, 0.13, 0.5], [5.43, 0.08, 0.3]] },
    musicbox:  { kind: 'add', rev: 0.42, gain: 0.36, attack: 0.002, ring: 1.0,
                 partials: [[1, 1, 1.5], [2, 0.12, 0.7], [3, 0.06, 0.35], [5.95, 0.2, 0.12], [8.1, 0.06, 0.06]] },
    metallo:   { kind: 'add', rev: 0.24, gain: 0.38, attack: 0.002, ring: 0.8,
                 partials: [[1, 1, 1.1], [2.76, 0.28, 0.32], [5.4, 0.12, 0.14], [8.93, 0.05, 0.06]] },
    marimba:   { kind: 'add', rev: 0.2, gain: 0.52, attack: 0.003, ring: 0.5,
                 partials: [[1, 1, 0.8], [3.93, 0.26, 0.16], [9.2, 0.05, 0.04]] },
    kalimba:   { kind: 'add', rev: 0.26, gain: 0.44, attack: 0.002, ring: 0.9,
                 partials: [[1, 1, 1.3], [2.01, 0.07, 0.5], [5.95, 0.2, 0.11], [11.7, 0.05, 0.05]] },
    celesta:   { kind: 'add', rev: 0.4, gain: 0.34, attack: 0.003, ring: 1.2,
                 partials: [[1, 1, 1.7], [2, 0.26, 0.8], [3, 0.08, 0.4], [4, 0.1, 0.22]] },
    piano:     { kind: 'add', rev: 0.22, gain: 0.34, attack: 0.004, ring: 0.6,
                 partials: [[1, 1, 1.8], [2.002, 0.45, 1.1], [3.005, 0.22, 0.6], [4.01, 0.12, 0.4], [5.02, 0.06, 0.25], [6.03, 0.03, 0.15]] },
    steel:     { kind: 'add', rev: 0.3, gain: 0.36, attack: 0.004, ring: 0.8,
                 partials: [[1, 1, 1.0], [2, 0.55, 0.6], [3, 0.18, 0.35], [4.02, 0.2, 0.25], [5.1, 0.06, 0.15]] },
    xylo:      { kind: 'add', rev: 0.2, gain: 0.5, attack: 0.0015, ring: 0.35,
                 partials: [[1, 1, 0.45], [3.0, 0.35, 0.12], [6.25, 0.12, 0.05]] },
    pizz:      { kind: 'ks', rev: 0.22, gain: 0.56, seconds: 1.2, bright: 0.55, damp: 0.993, lp: 2600, tail: 0.18 },
    harp:      { kind: 'ks', rev: 0.34, gain: 0.5, seconds: 2.6, bright: 0.2, damp: 0.9985, lp: 3600, tail: 0.9 },
    harpsi:    { kind: 'ks', rev: 0.24, gain: 0.34, seconds: 1.6, bright: 1, damp: 0.997, lp: 6500, tail: 0.25, octave: 0.32 },
    ukulele:   { kind: 'ks', rev: 0.22, gain: 0.52, seconds: 1.2, bright: 0.45, damp: 0.994, lp: 3200, tail: 0.2 },
    guitar:    { kind: 'ks', rev: 0.25, gain: 0.5, seconds: 2.2, bright: 0.3, damp: 0.997, lp: 3000, tail: 0.4 },
    banjo:     { kind: 'ks', rev: 0.18, gain: 0.42, seconds: 1.0, bright: 0.95, damp: 0.99, lp: 5500, tail: 0.12 },
    galoubet:  { kind: 'wind', rev: 0.26, gain: 0.25, attack: 0.035, release: 0.07,
                 wave: [1, 0.3, 0.12, 0.05, 0.025], vibrato: [5.4, 0.0032], breath: 0.05 },
    pipeau:    { kind: 'wind', rev: 0.26, gain: 0.26, attack: 0.03, release: 0.06,
                 wave: [1, 0.22, 0.08, 0.03], vibrato: [5.2, 0.003], breath: 0.05 },
    ocarina:   { kind: 'wind', rev: 0.3, gain: 0.3, attack: 0.05, release: 0.08,
                 wave: [1, 0.06, 0.02], vibrato: [4.6, 0.004], breath: 0.06 },
    clarinet:  { kind: 'wind', rev: 0.22, gain: 0.2, attack: 0.04, release: 0.06,
                 wave: [1, 0.02, 0.5, 0.02, 0.24, 0.02, 0.1], vibrato: [5, 0.0018], breath: 0.03 },
    accordion: { kind: 'reed', rev: 0.2, gain: 0.15, attack: 0.03, release: 0.08, detune: 4, lp: 3200 },
  };
  Object.keys(VOICES).forEach((k) => { VOICES[k].id = k; });

  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const voiceOf = (id) => VOICES[id] || VOICES.metallo;
  function tailOf(v) {
    if (v.kind === 'add') return v.ring * 1.7 + 0.35;
    if (v.kind === 'ks') return v.tail + 0.6;
    return v.release + 0.35;
  }
  function mark(v, midi, t, dur) {
    quietUntil = Math.max(quietUntil, t + dur + tailOf(v));
    lastConcert = midi;
  }

  function ensure() {
    if (!AC) return null;
    if (!ctx) {
      try { if (navigator.audioSession && navigator.audioSession.type === 'auto') navigator.audioSession.type = 'playback'; } catch (e) { /* facultatif */ }
      ctx = new AC({ latencyHint: 'interactive' });
      master = ctx.createGain();
      master.gain.value = 0.85;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3.5;
      comp.attack.value = 0.004; comp.release.value = 0.25;
      master.connect(comp);
      comp.connect(ctx.destination);
      const conv = ctx.createConvolver();
      conv.buffer = impulse(2.4, 3.2);
      revIn = ctx.createGain();
      revIn.connect(conv);
      conv.connect(master);
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const nd = noise.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function impulse(sec, decay) {
    const rate = ctx.sampleRate, len = Math.floor(rate * sec);
    const buf = ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        const fadeIn = i < rate * 0.012 ? i / (rate * 0.012) : 1;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay) * fadeIn;
      }
    }
    return buf;
  }

  function makeBus(voice) {
    const g = ctx.createGain();
    g.connect(master);
    const s = ctx.createGain();
    s.gain.value = voice.rev;
    g.connect(s);
    s.connect(revIn);
    return g;
  }

  /* --- synthèse additive (cloches, boîte à musique, lames, piano…) --- */
  function addNote(v, dest, midi, t, dur, vel) {
    const f = hz(midi);
    const out = ctx.createGain();
    out.connect(dest);
    const peak = v.gain * vel;
    out.gain.setValueAtTime(0.0001, t);
    out.gain.linearRampToValueAtTime(peak, t + v.attack);
    const dampAt = t + dur + v.ring * 0.35;
    out.gain.setTargetAtTime(0, dampAt, v.ring * 0.22);
    const hardStop = dampAt + v.ring * 1.4;
    v.partials.forEach(([r, a, d]) => {
      const fr = f * r;
      if (fr > 15000) return;
      const o = ctx.createOscillator();
      o.frequency.value = fr;
      const g = ctx.createGain();
      g.gain.setValueAtTime(a, t);
      g.gain.exponentialRampToValueAtTime(0.0006, t + d);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(Math.min(t + d + 0.05, hardStop));
    });
  }

  /* --- cordes pincées : Karplus-Strong (violon pincé, harpe, guitare…) --- */
  function ksBuffer(v, midi) {
    const key = v.id + ':' + midi;
    if (ksCache.has(key)) return ksCache.get(key);
    const rate = ctx.sampleRate, f = hz(midi);
    const N = Math.max(2, Math.round(rate / f - 0.5));
    const fAct = rate / (N + 0.5);
    const len = Math.floor(rate * v.seconds);
    const buf = ctx.createBuffer(1, len, rate);
    const d = buf.getChannelData(0);
    const ring = new Float32Array(N);
    for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
    const passes = Math.round((1 - v.bright) * 6);
    for (let p = 0; p < passes; p++) {
      let prev = ring[N - 1];
      for (let i = 0; i < N; i++) { const cur = ring[i]; ring[i] = 0.5 * (cur + prev); prev = cur; }
    }
    let mean = 0;
    for (let i = 0; i < N; i++) mean += ring[i];
    mean /= N;
    for (let i = 0; i < N; i++) ring[i] -= mean;
    let idx = 0, peak = 0;
    for (let i = 0; i < len; i++) {
      const a = ring[idx], b = ring[(idx + 1) % N];
      d[i] = a;
      ring[idx] = v.damp * 0.5 * (a + b);
      idx = (idx + 1) % N;
      const abs = Math.abs(a);
      if (abs > peak) peak = abs;
    }
    const fade = Math.floor(rate * 0.04);
    for (let i = 0; i < fade; i++) d[len - 1 - i] *= i / fade;
    const k = 1 / (peak || 1);
    for (let i = 0; i < len; i++) d[i] *= k;
    const res = { buf, rate: f / fAct };
    ksCache.set(key, res);
    return res;
  }

  function ksNote(v, dest, midi, t, dur, vel) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = v.lp;
    lp.Q.value = 0.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(v.gain * vel, t);
    const dampAt = t + Math.max(dur, 0.12) + v.tail;
    g.gain.setTargetAtTime(0, dampAt, 0.07);
    lp.connect(g);
    g.connect(dest);
    const strings = [[midi, 1, 0]];
    if (v.octave) strings.push([midi + 12, v.octave, 0.004]);
    strings.forEach(([m, amp, delay]) => {
      const { buf, rate } = ksBuffer(v, m);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = rate;
      const sg = ctx.createGain();
      sg.gain.value = amp;
      src.connect(sg);
      sg.connect(lp);
      src.start(t + delay);
      src.stop(Math.min(t + buf.duration / rate, dampAt + 0.6));
    });
  }

  /* --- vents : galoubet, pipeau, ocarina, clarinette --- */
  function windNote(v, dest, midi, t, dur, vel) {
    const f = hz(midi);
    let wave = waves.get(v.id);
    if (!wave) {
      const imag = new Float32Array([0].concat(v.wave));
      wave = ctx.createPeriodicWave(new Float32Array(imag.length), imag);
      waves.set(v.id, wave);
    }
    const end = t + Math.max(0.08, dur * 0.93);
    const peak = v.gain * vel;
    const o = ctx.createOscillator();
    o.setPeriodicWave(wave);
    o.frequency.value = f;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = v.vibrato[0];
    const lg = ctx.createGain();
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(f * v.vibrato[1], t + Math.min(0.35, dur * 0.6) + 0.01);
    lfo.connect(lg);
    lg.connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + v.attack);
    g.gain.setValueAtTime(peak, end);
    g.gain.setTargetAtTime(0, end, v.release / 3);
    o.connect(g);
    g.connect(dest);
    const n = ctx.createBufferSource();
    n.buffer = noise;
    n.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f * 2;
    bp.Q.value = 1.2;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0, t);
    ng.gain.linearRampToValueAtTime(v.breath * vel, t + 0.02);
    ng.gain.setTargetAtTime(v.breath * 0.3 * vel, t + 0.05, 0.05);
    ng.gain.setTargetAtTime(0, end, 0.03);
    n.connect(bp);
    bp.connect(ng);
    ng.connect(dest);
    const stop = end + 0.4;
    o.start(t); lfo.start(t); n.start(t, Math.random() * 0.5);
    o.stop(stop); lfo.stop(stop); n.stop(stop);
  }

  /* --- accordéon (anches légèrement désaccordées : effet musette) --- */
  function reedNote(v, dest, midi, t, dur, vel) {
    const f = hz(midi);
    const end = t + Math.max(0.08, dur * 0.95);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(v.lp, f * 9);
    lp.Q.value = 0.6;
    const g = ctx.createGain();
    const peak = v.gain * vel;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + v.attack);
    g.gain.setValueAtTime(peak, end);
    g.gain.setTargetAtTime(0, end, v.release / 3);
    [-v.detune, 0, v.detune].forEach((c, i) => {
      const o = ctx.createOscillator();
      o.type = i === 1 ? 'square' : 'sawtooth';
      o.frequency.value = f;
      o.detune.value = c;
      const og = ctx.createGain();
      og.gain.value = i === 1 ? 0.32 : 0.6;
      o.connect(og);
      og.connect(lp);
      o.start(t);
      o.stop(end + 0.4);
    });
    lp.connect(g);
    g.connect(dest);
  }

  function note(voiceId, dest, midi, t, dur, vel) {
    const v = voiceOf(voiceId);
    const m = midi + transpose;
    mark(v, m, t, dur);
    if (v.kind === 'add') addNote(v, dest, m, t, dur, vel);
    else if (v.kind === 'ks') ksNote(v, dest, m, t, dur, vel);
    else if (v.kind === 'wind') windNote(v, dest, m, t, dur, vel);
    else reedNote(v, dest, m, t, dur, vel);
  }

  /* Une note isolée (lame du xylophone, perle touchée) */
  function tap(voiceId, midi, dur = 0.55) {
    if (!ensure()) return;
    let b = tapBuses.get(voiceId);
    if (!b) { b = makeBus(voiceOf(voiceId)); tapBuses.set(voiceId, b); }
    note(voiceId, b, midi, ctx.currentTime + 0.008, dur, 1);
  }

  /* Une suite de notes datées en secondes ; renvoie de quoi l'arrêter */
  function sequence(voiceId, items, lead = 0.08) {
    if (!ensure()) return null;
    const bus = makeBus(voiceOf(voiceId));
    const t0 = ctx.currentTime + lead;
    items.forEach((it) => note(voiceId, bus, it.midi, t0 + it.start, it.dur, it.vel));
    return {
      t0,
      stop() {
        const now = ctx.currentTime;
        bus.gain.cancelScheduledValues(now);
        bus.gain.setValueAtTime(bus.gain.value, now);
        bus.gain.linearRampToValueAtTime(0, now + 0.06);
        quietUntil = Math.min(quietUntil, now + 0.45);
        setTimeout(() => { try { bus.disconnect(); } catch (e) { /* déjà débranché */ } }, 250);
      },
    };
  }

  /* Petite fanfare de fin : Do Mi Sol Do */
  function flourish(voiceId) {
    return sequence(voiceId, [60, 64, 67, 72].map((m, i) => ({ midi: m, start: i * 0.11, dur: i === 3 ? 0.6 : 0.16, vel: 0.8 })));
  }

  return {
    ensure, tap, sequence, flourish,
    now: () => (ctx ? ctx.currentTime : 0),
    quietAt: () => quietUntil,
    lastConcert: () => lastConcert,
    setTranspose: (n) => { transpose = n | 0; },
    available: !!AC,
  };
})();
