/* ------------------------------------------------------------------
   L'oreille : écoute un instrument réel au micro et reconnaît les notes
   - détection de hauteur par l'algorithme YIN (de Cheveigné & Kawahara)
   - suivi des notes : une note est « jouée » quand sa hauteur reste stable
     ~90 ms ; une note répétée est reconnue à sa nouvelle attaque
     (creux puis remontée du volume) ou après un court silence.
   - pendant que la page joue elle-même de la musique, l'écoute est coupée
     pour ne pas confondre le haut-parleur avec l'instrument (en tenant
     compte du retard du haut-parleur, grand sur les téléphones).
   - le son du micro est recueilli dans le fil audio (AudioWorklet), morceau
     par morceau, avec l'instant exact de chaque morceau : même quand la page
     est occupée (décor 3D, téléphone lent), aucune trame n'est perdue et
     l'instant de chaque note reste juste. Sans AudioWorklet, on lit le son
     toutes les 28 ms (AnalyserNode), comme avant.
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
        // même nom de note, même à l'octave près : le micro d'un téléphone rend mal les graves,
        // et la hauteur saute parfois d'une octave d'une trame à l'autre (seul le nom compte)
        if (T.cand && (((T.cand.r - r) % 12) + 12) % 12 === 0) {
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
  const FRAME_MS = 28, N = 2048;
  const S = {
    on: false, stream: null, nodes: [], an: null, buf: null, timer: 0, sr: 48000, nf: 0.003, gated: false, lastUi: 0, T: PitchKit.makeTracker(),
    mode: '', ring: null, fill: 0, tok: 0,
    // pour le diagnostic (?diag) : traitements du micro, trames par seconde, retard du traitement
    dg: { proc: null, frames: 0, since: 0, fps: 0, lag: 0, lagMax: 0, rms: 0, f: 0 },
  };
  let onNote = null, onFrame = null, onEnded = null;

  /* Le morceau de code qui tourne dans le fil audio : il découpe le son du micro
     en morceaux d'environ 28 ms et les envoie avec l'instant de leur dernier échantillon. */
  const WORKLET = `class NeEar extends AudioWorkletProcessor {
  constructor(o) { super(); this.hop = o.processorOptions.hop; this.b = new Float32Array(this.hop); this.n = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length;) {
      const k = Math.min(ch.length - i, this.hop - this.n);
      this.b.set(ch.subarray(i, i + k), this.n);
      this.n += k; i += k;
      if (this.n === this.hop) {
        this.port.postMessage({ x: this.b, t: currentTime + i / sampleRate }, [this.b.buffer]);
        this.b = new Float32Array(this.hop); this.n = 0;
      }
    }
    return true;
  }
}
registerProcessor('ne-ear', NeEar);`;
  let mod = null; // { ctx, p } : le module chargé une fois par contexte audio
  async function workletNode(ctx) {
    if (!ctx.audioWorklet || typeof AudioWorkletNode === 'undefined') return null;
    try {
      if (!mod || mod.ctx !== ctx) {
        const url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
        mod = { ctx, p: ctx.audioWorklet.addModule(url) };
      }
      await mod.p;
      const hop = 128 * Math.max(1, Math.round((FRAME_MS / 1000) * ctx.sampleRate / 128));
      return new AudioWorkletNode(ctx, 'ne-ear', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], channelCount: 1, channelCountMode: 'explicit', processorOptions: { hop } });
    } catch (e) {
      mod = null;
      return null; // page sans droit aux modules (bac à sable…) : on lit le son autrement
    }
  }

  const fail = (code, e) => Object.assign(new Error(code), { code, cause: e });
  function classify(e) {
    const n = (e && e.name) || '';
    if (/NotAllowed|PermissionDenied|Security/.test(n)) return 'denied';
    if (/NotFound|DevicesNotFound|Overconstrained/.test(n)) return 'nomic';
    if (/NotReadable|TrackStart|Abort/.test(n)) return 'busy';
    return 'other';
  }
  function session(type) { try { if (navigator.audioSession) navigator.audioSession.type = type; } catch (e) { /* facultatif */ } }

  // le son brut de l'instrument : sans annulation d'écho, réduction de bruit ni gain automatique
  // (ces traitements, faits pour la voix, écrasent les notes tenues et les attaques)
  const RAW = { echoCancellation: false, noiseSuppression: false, autoGainControl: false, voiceIsolation: false };

  async function start(handlers) {
    onNote = handlers.onNote; onFrame = handlers.onFrame; onEnded = handlers.onEnded;
    if (S.on) return;
    const md = navigator.mediaDevices;
    if (!md || !md.getUserMedia) throw fail('unsupported');
    const ctx = Sound.ensure();
    if (!ctx) throw fail('noaudio');
    const tok = ++S.tok;
    session('play-and-record');
    let stream;
    try {
      stream = await md.getUserMedia({ audio: Object.assign({ channelCount: { ideal: 1 } }, RAW) });
    } catch (e) {
      session('playback');
      throw fail(classify(e), e);
    }
    const track = stream.getAudioTracks()[0];
    const settingsOf = () => { try { return track.getSettings ? track.getSettings() : {}; } catch (e) { return {}; } };
    let st = settingsOf();
    // un navigateur qui a gardé un traitement : on redemande
    if (st.echoCancellation || st.noiseSuppression || st.autoGainControl) {
      try { await track.applyConstraints(RAW); st = settingsOf(); } catch (e) { /* il le garde */ }
    }
    S.dg.proc = { ec: st.echoCancellation, ns: st.noiseSuppression, agc: st.autoGainControl, sr: st.sampleRate, label: track.label || '' };
    try { if (ctx.state !== 'running') await ctx.resume(); } catch (e) { /* reprise plus tard */ }
    const src = ctx.createMediaStreamSource(stream);
    const mute = ctx.createGain();
    mute.gain.value = 0;
    const node = await workletNode(ctx);
    if (tok !== S.tok) { stream.getTracks().forEach((t) => t.stop()); return; } // arrêté pendant la mise en route
    if (node) {
      node.port.onmessage = (ev) => feed(ev.data.x, ev.data.t);
      src.connect(node);
      node.connect(mute);
      Object.assign(S, { mode: 'worklet', nodes: [src, node, mute], an: null, ring: new Float32Array(N), fill: 0 });
    } else {
      const an = ctx.createAnalyser();
      an.fftSize = N;
      an.smoothingTimeConstant = 0;
      src.connect(an);
      an.connect(mute);
      Object.assign(S, { mode: 'analyser', nodes: [src, an, mute], an, buf: new Float32Array(N) });
      S.timer = setInterval(analyze, FRAME_MS);
    }
    mute.connect(ctx.destination);
    Object.assign(S, { on: true, stream, sr: ctx.sampleRate, nf: 0.003, gated: false });
    Object.assign(S.dg, { frames: 0, since: performance.now(), fps: 0, lag: 0, lagMax: 0 });
    S.T.hold(null, 0);
    stream.getAudioTracks().forEach((t) => t.addEventListener('ended', () => { stop(); if (onEnded) onEnded(); }));
  }

  function stop() {
    S.tok++;
    if (!S.on) return;
    clearInterval(S.timer);
    S.nodes.forEach((n) => { try { n.disconnect(); } catch (e) { /* déjà débranché */ } });
    if (S.mode === 'worklet' && S.nodes[1]) S.nodes[1].port.onmessage = null;
    S.stream.getTracks().forEach((t) => t.stop());
    Object.assign(S, { on: false, stream: null, nodes: [], an: null, ring: null });
    session('playback');
  }

  // un morceau de son arrive du fil audio (t : instant de son dernier échantillon)
  function feed(x, t) {
    if (!S.on || !S.ring) return;
    const r = S.ring, hop = x.length;
    if (hop >= N) r.set(x.subarray(hop - N));
    else { r.copyWithin(0, hop); r.set(x, N - hop); }
    S.fill += hop;
    if (S.fill < N) return;
    const lag = Sound.now() - t;
    S.dg.lag = lag;
    if (lag > S.dg.lagMax) S.dg.lagMax = lag;
    analyzeFrame(r, t);
  }

  function analyze() {
    if (!S.on) return;
    S.an.getFloatTimeDomainData(S.buf);
    analyzeFrame(S.buf, Sound.now());
  }

  function analyzeFrame(x, now) {
    let ss = 0;
    for (let i = 0; i < x.length; i++) ss += x[i] * x[i];
    const rms = Math.sqrt(ss / x.length);
    S.dg.frames++;
    S.dg.rms = rms;
    // ce que le micro entend à cet instant, la page l'a programmé un peu plus tôt :
    // le son met outLatency à sortir du haut-parleur (jusqu'à 0,2 s sur certains téléphones)
    const heard = now - Math.min(0.3, Sound.outLatency ? Sound.outLatency() : 0);
    if (heard < Sound.quietAt()) {
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
    S.T.ring = Sound.ringing ? Sound.ringing(heard) : null;
    const gate = Math.max(0.0025, S.nf * 2.5);
    const res = rms > gate ? PitchKit.yin(x, S.sr) : null;
    S.dg.f = res ? res.f : 0;
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

  function diag() {
    const d = S.dg, t = performance.now();
    if (t - d.since > 1000) { d.fps = (d.frames * 1000) / (t - d.since); d.frames = 0; d.since = t; d.lagMax = d.lag; }
    return { on: S.on, mode: S.mode, sr: S.sr, fps: d.fps, lag: d.lag, lagMax: d.lagMax, proc: d.proc, db: 20 * Math.log10(d.rms + 1e-9), nf: 20 * Math.log10(S.nf + 1e-9), f: d.f, out: Sound.outLatency ? Sound.outLatency() : 0 };
  }

  return {
    start, stop, diag,
    active: () => S.on,
    expect: (pc) => { S.T.expectPc = pc; },
    nudge: (c) => S.T.nudge(c),
  };
})();
