/* ------------------------------------------------------------------
   L'oreille : écoute un instrument réel au micro et reconnaît les notes
   - détection de hauteur par l'algorithme YIN (de Cheveigné & Kawahara)
   - suivi des notes : une note est « jouée » quand sa hauteur reste stable
     ~90 ms ; une note répétée est reconnue à sa nouvelle attaque
     (creux puis remontée du volume) ou après un court silence.
   - pendant que la page joue elle-même de la musique, l'écoute est coupée
     pour ne pas confondre le haut-parleur avec l'instrument.
------------------------------------------------------------------- */
const PitchKit = (() => {
  const FMIN = 50, FMAX = 2800, TH = 0.15;
  let dp = null;

  /* Renvoie { f, clarity } ou null si le son n'a pas de hauteur nette */
  function yin(x, sr, fmin = FMIN, fmax = FMAX) {
    const N = x.length, W = Math.floor(N / 2);
    const tauMin = Math.max(2, Math.floor(sr / fmax));
    const tauMax = Math.min(W - 2, Math.ceil(sr / fmin));
    if (!dp || dp.length < tauMax + 2) dp = new Float32Array(tauMax + 2);
    dp[0] = 1;
    let sum = 0, best = -1, last = tauMax;
    for (let tau = 1; tau <= tauMax; tau++) {
      let s = 0;
      for (let j = 0; j < W; j++) { const d = x[j] - x[j + tau]; s += d * d; }
      sum += s;
      dp[tau] = sum > 0 ? (s * tau) / sum : 1;
      // premier minimum local sous le seuil
      if (tau - 1 > tauMin && dp[tau - 1] < TH && dp[tau] >= dp[tau - 1]) { best = tau - 1; last = tau; break; }
    }
    if (best < 0) {
      let mv = 1;
      for (let tau = tauMin + 1; tau < tauMax; tau++) if (dp[tau] < mv) { mv = dp[tau]; best = tau; }
      if (best < 0 || mv > 0.28) return null;
    }
    let t = best;
    if (best > 1 && best + 1 <= last) {
      const a = dp[best - 1], b = dp[best], c = dp[best + 1];
      const den = a - 2 * b + c;
      if (den > 1e-9) t = best + (0.5 * (a - c)) / den;
    }
    let f = sr / t;
    // lames de métallophone, glockenspiel, cloches : harmoniques non alignées,
    // on affine sur le pic du spectre autour de la fondamentale trouvée
    if (f > 300) f = refine(x, sr, f);
    return { f, clarity: 1 - dp[best] };
  }

  let hann = null;
  const SPAN = 80, STEP = 10;
  function refine(x, sr, f0) {
    const N = x.length;
    if (!hann || hann.length !== N) {
      hann = new Float32Array(N);
      for (let i = 0; i < N; i++) hann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1));
    }
    const pw = [];
    for (let c = -SPAN; c <= SPAN; c += STEP) {
      const w = (2 * Math.PI * f0 * Math.pow(2, c / 1200)) / sr, k = 2 * Math.cos(w);
      let s1 = 0, s2 = 0;
      for (let i = 0; i < N; i++) { const s = x[i] * hann[i] + k * s1 - s2; s2 = s1; s1 = s; }
      pw.push(Math.max(1e-12, s1 * s1 + s2 * s2 - k * s1 * s2));
    }
    let b = 0;
    for (let i = 1; i < pw.length; i++) if (pw[i] > pw[b]) b = i;
    let off = 0;
    if (b > 0 && b < pw.length - 1) {
      const l = Math.log(pw[b - 1]), m = Math.log(pw[b]), r = Math.log(pw[b + 1]);
      const den = l - 2 * m + r;
      if (den < 0) off = (0.5 * (l - r)) / den;
    } else return f0; // pic au bord : on garde l'estimation de départ
    return f0 * Math.pow(2, (-SPAN + (b + off) * STEP) / 1200);
  }

  /* Suivi des notes. push() renvoie une note jouée { r, cents, f, t } ou null ;
     t = instant de la première trame de la note (pour juger le rythme).
     T.ring = { pcs, body } : ce que la page fait encore entendre. Tant qu'une
     note de la page n'est pas finie (body), et ensuite sur les hauteurs qui
     résonnent encore (pcs), seule une vraie attaque compte : le volume monte
     nettement au-dessus de ce qu'on entendait juste avant. Le haut-parleur
     qui s'éteint, ou le mélange de deux notes, ne passent pas pour une note. */
  function makeTracker() {
    const T = { cand: null, held: null, silent: 0, tune: 0, expectPc: null, ring: null, hist: [] };
    const ATK = 2, HIST = 10;
    const remember = (rms) => { T.hist.push(rms); if (T.hist.length > HIST) T.hist.shift(); };
    T.push = (res, rms, gate, now = 0) => {
      const floor = T.hist.length ? Math.min(...T.hist) : 0;
      remember(rms);
      // attaque : le volume dépasse nettement le plus faible des ~280 ms précédentes
      const rise = rms > floor * ATK && rms > gate * 1.3;
      if (res && res.f >= FMIN && res.f <= FMAX) {
        const m = 69 + 12 * Math.log2(res.f / 440) - T.tune / 100;
        const r = Math.round(m), cents = (m - r) * 100;
        T.silent = 0;
        if (T.cand && T.cand.r === r) {
          T.cand.n++; T.cand.c = T.cand.c * 0.6 + cents * 0.4;
          if (rise) T.cand.atk = true;
        } else T.cand = { r, n: 1, c: cents, t: now, atk: rise };
        const pc = ((r % 12) + 12) % 12;
        const need = T.expectPc == null || pc === T.expectPc ? 3 : 5;
        if (T.cand.n < need) return null;
        const masked = T.ring && !T.cand.atk && (T.ring.body || T.ring.pcs.has(pc));
        if (masked && (!T.held || T.held.pc !== pc)) T.held = { pc, peak: rms, min: rms, armed: false, ring: true };
        const h = T.held;
        if (!h || h.pc !== pc) {
          T.held = { pc, peak: rms, min: rms, armed: false };
          return { r, cents: T.cand.c, f: res.f, t: T.cand.t };
        }
        if (h.ring && !masked && T.cand.atk) {
          // l'instrument attaque par-dessus ce que la page fait encore résonner
          T.held = { pc, peak: rms, min: rms, armed: false };
          return { r, cents: T.cand.c, f: res.f, t: now };
        }
        h.peak = Math.max(h.peak, rms);
        if (!h.armed && rms < h.peak * 0.55) { h.armed = true; h.min = rms; }
        if (h.armed) {
          h.min = Math.min(h.min, rms);
          if (rms > h.min * 1.8 && rms > gate * 1.3) {
            T.held = { pc, peak: rms, min: rms, armed: false };
            return { r, cents: T.cand.c, f: res.f, t: now };
          }
        }
        return null;
      }
      T.silent++;
      const h = T.held;
      if (h) {
        if (!h.armed && rms < h.peak * 0.55) { h.armed = true; h.min = rms; }
        else if (h.armed) h.min = Math.min(h.min, rms);
      }
      if (T.silent >= 3) { T.held = null; T.cand = null; }
      return null;
    };
    T.hold = (pc, rms) => { remember(rms); T.held = pc == null ? null : { pc, peak: rms, min: rms, armed: false }; T.cand = null; T.silent = 0; };
    T.nudge = (cents) => { T.tune = Math.max(-45, Math.min(45, T.tune + cents * 0.3)); };
    return T;
  }

  return { yin, makeTracker, FMIN, FMAX };
})();

const Ear = (() => {
  const FRAME_MS = 28;
  const S = { on: false, stream: null, nodes: [], an: null, buf: null, timer: 0, sr: 48000, nf: 0.003, gated: false, lastUi: 0, T: PitchKit.makeTracker() };
  let onNote = null, onFrame = null, onEnded = null;

  const fail = (code, e) => Object.assign(new Error(code), { code, cause: e });
  function classify(e) {
    const n = (e && e.name) || '';
    if (/NotAllowed|PermissionDenied|Security/.test(n)) return 'denied';
    if (/NotFound|DevicesNotFound|Overconstrained/.test(n)) return 'nomic';
    if (/NotReadable|TrackStart|Abort/.test(n)) return 'busy';
    return 'other';
  }
  function session(type) { try { if (navigator.audioSession) navigator.audioSession.type = type; } catch (e) { /* facultatif */ } }

  async function start(handlers) {
    onNote = handlers.onNote; onFrame = handlers.onFrame; onEnded = handlers.onEnded;
    if (S.on) return;
    const md = navigator.mediaDevices;
    if (!md || !md.getUserMedia) throw fail('unsupported');
    const ctx = Sound.ensure();
    if (!ctx) throw fail('noaudio');
    session('play-and-record');
    let stream;
    try {
      stream = await md.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch (e) {
      session('playback');
      throw fail(classify(e), e);
    }
    try { if (ctx.state !== 'running') await ctx.resume(); } catch (e) { /* reprise plus tard */ }
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser();
    an.fftSize = 2048;
    an.smoothingTimeConstant = 0;
    const mute = ctx.createGain();
    mute.gain.value = 0;
    src.connect(an);
    an.connect(mute);
    mute.connect(ctx.destination);
    Object.assign(S, { on: true, stream, nodes: [src, an, mute], an, buf: new Float32Array(an.fftSize), sr: ctx.sampleRate, nf: 0.003, gated: false });
    S.T.hold(null, 0);
    stream.getAudioTracks().forEach((t) => t.addEventListener('ended', () => { stop(); if (onEnded) onEnded(); }));
    S.timer = setInterval(analyze, FRAME_MS);
  }

  function stop() {
    if (!S.on) return;
    clearInterval(S.timer);
    S.nodes.forEach((n) => { try { n.disconnect(); } catch (e) { /* déjà débranché */ } });
    S.stream.getTracks().forEach((t) => t.stop());
    Object.assign(S, { on: false, stream: null, nodes: [], an: null });
    session('playback');
  }

  function analyze() {
    if (!S.on) return;
    S.an.getFloatTimeDomainData(S.buf);
    const x = S.buf;
    let ss = 0;
    for (let i = 0; i < x.length; i++) ss += x[i] * x[i];
    const rms = Math.sqrt(ss / x.length);
    const now = Sound.now();
    if (now < Sound.quietAt()) {
      S.gated = true;
      S.T.hold(null, rms);
      frame(rms, null, true);
      return;
    }
    if (S.gated) {
      // l'écoute reprend un peu avant la fin de la dernière note de la page :
      // ce qui résonne encore n'est pris que sur une vraie attaque (voir T.ring)
      S.gated = false;
      S.T.hold(null, rms);
    }
    S.T.ring = Sound.ringing ? Sound.ringing(now) : null;
    const gate = Math.max(0.0025, S.nf * 2.5);
    const res = rms > gate ? PitchKit.yin(x, S.sr) : null;
    if (!res) {
      if (rms < S.nf) S.nf = S.nf * 0.9 + rms * 0.1;
      else S.nf = Math.min(0.05, S.nf * 0.997 + rms * 0.003);
    }
    const hit = S.T.push(res, rms, gate, now);
    if (hit && onNote) onNote(hit);
    frame(rms, res, false);
  }

  function frame(rms, res, gated) {
    const t = performance.now();
    if (!onFrame || t - S.lastUi < 50) return;
    S.lastUi = t;
    const c = S.T.cand;
    const db = 20 * Math.log10(rms + 1e-9);
    onFrame({
      level: Math.max(0, Math.min(1, (db + 62) / 50)),
      note: !gated && res && c && c.n >= 2 ? c.r : null,
      cents: c ? c.c : 0,
      gated,
    });
  }

  return {
    start, stop,
    active: () => S.on,
    expect: (pc) => { S.T.expectPc = pc; },
    nudge: (c) => S.T.nudge(c),
  };
})();
