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

  /* Renvoie { f, clarity } ou null si le son n'a pas de hauteur nette.
     prefer : nom de la note attendue (0 = do … 11 = si) ou null. Quand plusieurs notes sonnent
     ensemble (la précédente résonne encore : pédale, pièce qui résonne), la période commune de
     l'accord l'emporte souvent (Do + Mi → Do deux octaves plus bas). Si la note attendue est
     nettement présente, on la garde, à condition qu'elle ne soit pas qu'un sous-multiple d'une
     note plus aiguë jouée seule (jouer Sol4 quand on attend Do3 reste un Sol). */
  function yin(x, sr, fmin = FMIN, fmax = FMAX, prefer = null) {
    const N = x.length, W = Math.floor(N / 2);
    const tauMin = Math.max(2, Math.floor(sr / fmax));
    const tauMax = Math.min(W - 2, Math.ceil(sr / fmin));
    if (!dp || dp.length < tauMax + 2) dp = new Float32Array(tauMax + 2);
    dp[0] = 1;
    let sum = 0, best = -1, last = tauMax, done = 0;
    for (let tau = 1; tau <= tauMax; tau++) {
      let s = 0;
      for (let j = 0; j < W; j++) { const d = x[j] - x[j + tau]; s += d * d; }
      sum += s;
      dp[tau] = sum > 0 ? (s * tau) / sum : 1;
      done = tau;
      // premier minimum local sous le seuil
      if (tau - 1 > tauMin && dp[tau - 1] < TH && dp[tau] >= dp[tau - 1]) { best = tau - 1; last = tau; break; }
    }
    // la suite de la courbe, si on doit chercher la note attendue plus loin
    const finish = () => {
      for (let tau = done + 1; tau <= tauMax; tau++) {
        let s = 0;
        for (let j = 0; j < W; j++) { const d = x[j] - x[j + tau]; s += d * d; }
        sum += s;
        dp[tau] = sum > 0 ? (s * tau) / sum : 1;
      }
      done = tauMax;
    };
    if (best < 0) {
      let mv = 1;
      for (let tau = tauMin + 1; tau < tauMax; tau++) if (dp[tau] < mv) { mv = dp[tau]; best = tau; }
      if (best < 0 || mv > 0.28) best = -1;
    }
    const pcOf = (f) => ((Math.round(69 + 12 * Math.log2(f / 440)) % 12) + 12) % 12;
    if (prefer != null && (best < 0 || pcOf(sr / best) !== prefer)) {
      finish();
      const alt = preferred(sr, tauMin, tauMax, prefer, pcOf);
      if (alt) { best = alt; last = tauMax; }
    }
    if (best < 0) return null;
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

  // la période de la note attendue (à n'importe quelle octave), si elle est nettement présente
  const PREFER_DP = 0.3;
  function preferred(sr, tauMin, tauMax, pc, pcOf) {
    let pick = -1, pv = 1;
    for (let m = 36; m <= 108; m++) {
      if (((m % 12) + 12) % 12 !== pc) continue;
      const tc = sr / (440 * Math.pow(2, (m - 69) / 12));
      const a = Math.max(tauMin + 1, Math.floor(tc * 0.97)), b = Math.min(tauMax - 1, Math.ceil(tc * 1.03));
      if (a > b) continue;
      let lt = -1, lv = 1;
      for (let tau = a; tau <= b; tau++) if (dp[tau] < lv && dp[tau] <= dp[tau - 1] && dp[tau] <= dp[tau + 1]) { lv = dp[tau]; lt = tau; }
      if (lt < 0 || lv > PREFER_DP) continue;
      // pas un multiple de la période d'une autre note, plus aiguë et au moins aussi nette :
      // c'est alors cette note-là qui sonne (Sol4 joué seul est aussi périodique sur 3 ou 7 de ses périodes)
      let sub = false;
      for (let tau = tauMin + 1; tau < lt * 0.92; tau++) {
        if (dp[tau] < lv + 0.12 && dp[tau] <= dp[tau - 1] && dp[tau] <= dp[tau + 1] && pcOf(sr / tau) !== pc) { sub = true; break; }
      }
      if (sub) continue;
      // la plus aiguë des octaves qui conviennent (les plus graves en sont des multiples)
      if (pick < 0 || lt < pick) { pick = lt; pv = lv; }
    }
    return pick > 0 ? pick : null;
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
    /* voice : on chante les noms des notes. Une note reprise à la même hauteur (« sol sol », « mi mi ») passe
       alors toujours par une consonne : un trou dans la hauteur (s, f) ou un creux du volume (m, l, d, r).
       Seuls ces deux signes comptent, et pas avant 0,18 s : dans « mi » ou « ré », la voyelle qui suit la
       consonne, déjà chantée à la bonne hauteur, fait remonter le volume sans être une nouvelle note. */
    const T = { cand: null, held: null, silent: 0, tune: 0, expectPc: null, expectPcs: null, ring: null, hist: [], voice: false };
    const ATK = 2, HIST = 10;
    const remember = (rms) => { T.hist.push(rms); if (T.hist.length > HIST) T.hist.shift(); };
    // on : instant d'une attaque entendue dans cette trame (ou null)
    T.push = (res, rms, gate, now = 0, on = null) => {
      if (on != null) T.on = on;
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
        // 3 trames pour une note attendue (la prochaine, ou l'une des suivantes quand on chante en rythme), 5 sinon
        const need = !T.expectPcs || T.expectPcs.includes(pc) ? 3 : 5;
        if (T.cand.n < need) return null;
        const masked = T.ring && !T.cand.atk && (T.ring.body || T.ring.pcs.has(pc));
        if (masked && (!T.held || T.held.pc !== pc)) T.held = { pc, peak: rms, min: rms, armed: false, ring: true };
        const h = T.held;
        if (!h || h.pc !== pc) {
          // la voix : le volume des trames de la note déjà entendues sert de référence au creux de la consonne
          // suivante (une note chantée brève n'a parfois qu'une ou deux trames après celle-ci)
          T.held = { pc, r, peak: rms, min: rms, armed: false, t0: T.cand.t, lv: T.voice ? T.hist.slice(-Math.min(T.cand.n, 6)) : undefined };
          T.on = null; // l'attaque de cette note-ci
          return { r, cents: T.cand.c, f: res.f, t: T.cand.t };
        }
        if (h.ring && !masked && T.cand.atk) {
          // l'instrument attaque par-dessus ce que la page fait encore résonner
          T.held = { pc, r, peak: rms, min: rms, armed: false };
          return { r, cents: T.cand.c, f: res.f, t: now };
        }
        h.peak = Math.max(h.peak, rms);
        if (h.r == null) h.r = r;
        const k = h.lv || (h.lv = []), L = k.length;
        // Même nom de note, autre octave (Pomme de reinette : Sol3 Sol4 Sol3 Sol4). C'est une nouvelle note
        // si la nouvelle octave tient 3 trames de suite ET que le volume est remonté au passage (une attaque).
        // Un micro de téléphone qui hésite entre deux octaves sur une même note tenue, lui, alterne d'une
        // trame à l'autre, ou glisse vers l'octave pendant que le son décroît : ni l'un ni l'autre ne compte.
        if (r !== h.r) {
          if (!h.oct || h.oct.r !== r) h.oct = { r, n: 0, t: now, lo: L ? Math.min(...k.slice(-3)) : rms, atk: false };
          h.oct.n++;
          if ((rms > h.oct.lo * 1.2 || (T.on != null && T.on >= h.oct.t - 0.06)) && rms > gate * 1.3) h.oct.atk = true;
          if (h.oct.n >= 3 && h.oct.atk) {
            const t0 = h.oct.t;
            T.held = { pc, r, peak: rms, min: rms, armed: false, t0 };
            T.on = null;
            return { r, cents: T.cand.c, f: res.f, t: t0 };
          }
          k.push(rms); if (k.length > 9) k.shift();
          return null;
        }
        h.oct = null;
        // Une remontée du volume ne compte qu'une fois confirmée sur les 2 trames suivantes (même hauteur,
        // même octave, volume toujours haut) : à la première trame d'une NOUVELLE note, la fenêtre d'analyse
        // entend encore surtout la note d'avant, avec un volume qui monte. Sans cette attente, la fin d'une
        // note longue de piano suivie d'une autre note passait pour la même note rejouée (« note en trop »).
        if (h.re) {
          if (h.r === r && rms > h.re.base * h.re.k) {
            if (++h.re.n >= 2) {
              const t0 = h.re.t;
              if (T.voice && h.t0 != null && t0 - h.t0 < 0.18) { h.re = null; k.push(rms); if (k.length > 9) k.shift(); return null; }
              T.held = { pc, r, peak: rms, min: rms, armed: false, t0, lv: T.voice ? T.hist.slice(-3) : undefined };
              T.on = null;
              return { r, cents: T.cand.c, f: res.f, t: t0 };
            }
          } else h.re = null;
        }
        if (!h.re && h.r === r) {
          // piano, xylophone… : le son ne fait que décroître (au moins 5 trames, ~140 ms) ; s'il remonte
          // nettement d'un coup, c'est peut-être la même note frappée de nouveau, même si elle résonne encore
          let run = 0;
          for (let q = L - 2; q > 0 && k[q - 1] > k[q] * 1.005; q--) run++;
          const lo = L >= 2 ? Math.min(k[L - 2], k[L - 1]) : 0;
          const restrike = !T.voice && !h.ring && run >= 5 && rms > lo * 1.3 && rms > gate * 1.3;
          // flûte, voix… : un creux puis une remontée (coup de langue, nouvelle attaque)
          // la voix : un vrai creux (la consonne entre deux syllabes, ~10 dB sous le volume des trames juste
          // avant), pas l'ondulation du vibrato ni la voyelle tenue plus doucement que l'attaque
          const ref = T.voice ? (L ? Math.max(...k.slice(-6)) : rms) : h.peak;
          if (!h.armed && rms < ref * (T.voice ? 0.3 : 0.55)) { h.armed = true; h.min = rms; }
          if (h.armed) h.min = Math.min(h.min, rms);
          // la voix, consonne voisée (« do do », « ré ré ») : le volume ne baisse parfois que de 6 dB ; ce petit creux
          // compte s'il est suivi d'une vraie attaque, entendue à l'instant (l'énergie fait presque doubler d'un coup),
          // et seulement quand la même note est attendue de nouveau (une voyelle tenue n'est pas coupée en deux)
          if (T.voice && !h.soft && rms < ref * 0.5) { h.soft = true; h.smin = rms; }
          if (h.soft) h.smin = Math.min(h.smin, rms);
          const dip = h.armed && rms > h.min * (T.voice ? 2.5 : 1.8) && rms > gate * 1.3;
          const soft = T.voice && !dip && h.soft && T.expectPc === pc && T.on != null && now - T.on < 0.075 && (h.t0 == null || T.on > h.t0 + 0.15) && rms > h.smin * 1.8 && rms > gate * 1.3;
          // une attaque entendue à l'instant (même hauteur juste après) : la même note, jouée de nouveau
          // Si c'est justement cette note qui est attendue de nouveau (Sol Sol Sol Sol), l'attaque suffit,
          // même plus douce que la précédente (le volume peut ne pas monter : l'étouffoir du piano coupe
          // la note d'avant au moment où la nouvelle commence) ; sinon le volume doit monter de 10 %.
          const onT = !T.voice && T.on != null && now - T.on < 0.075 && !h.ring && (h.t0 == null || T.on > h.t0 + 0.06) ? T.on : null;
          if (onT != null) { h.re = { t: onT, base: L ? k[L - 1] : rms, n: 0, k: T.expectPc === pc ? 0.75 : 1.1 }; T.on = null; }
          else if (restrike || dip) h.re = { t: now, base: restrike ? lo : h.min, n: 0, k: 1.15 };
          else if (soft) { h.re = { t: T.on, base: h.smin, n: 0, k: 1.15 }; T.on = null; }
        } else if (!h.re) {
          if (!h.armed && rms < (T.voice && L ? Math.max(...k.slice(-6)) * 0.3 : h.peak * 0.55)) { h.armed = true; h.min = rms; }
          if (h.armed) h.min = Math.min(h.min, rms);
          if (T.voice && L && !h.soft && rms < Math.max(...k.slice(-6)) * 0.5) { h.soft = true; h.smin = rms; }
          if (h.soft) h.smin = Math.min(h.smin, rms);
        }
        k.push(rms); if (k.length > 9) k.shift();
        return null;
      }
      T.silent++;
      const h = T.held;
      if (h) {
        // la voix : une trame sans hauteur pendant qu'une reprise se confirme (la voyelle qui s'installe) ne l'annule pas
        if (T.voice && h.re && !h.re.miss) h.re.miss = true; else h.re = null;
        const ref = T.voice && h.lv && h.lv.length ? Math.max(...h.lv.slice(-6)) : h.peak;
        if (!h.armed && rms < ref * (T.voice ? 0.3 : 0.55)) { h.armed = true; h.min = rms; }
        else if (h.armed) h.min = Math.min(h.min, rms);
        if (T.voice && !h.soft && rms < ref * 0.5) { h.soft = true; h.smin = rms; }
        else if (h.soft) h.smin = Math.min(h.smin, rms);
      }
      // la voix : une voyelle tenue perd parfois sa hauteur deux ou trois trames (souffle) ; la note continue
      if (T.silent >= (T.voice ? 5 : 3)) { T.held = null; T.cand = null; }
      return null;
    };
    T.hold = (pc, rms) => { remember(rms); T.held = pc == null ? null : { pc, peak: rms, min: rms, armed: false }; T.cand = null; T.silent = 0; };
    T.nudge = (cents) => { T.tune = Math.max(-45, Math.min(45, T.tune + cents * 0.3)); };
    return T;
  }

  /* Attaques. Une note rejouée (Sol Sol Sol Sol de « À la pêche aux moules ») a la même hauteur que
     la précédente : seule l'attaque la trahit. L'énergie est suivie par tranches de 128 échantillons,
     sur une fenêtre glissante de 1024 (~21 ms, plus longue que la période des notes graves) :
     - une attaque fait plus que doubler (×1,8) l'énergie par rapport aux 21 à 45 ms précédentes ;
     - ou bien les aigus (coup du marteau, de la baguette, coup de langue) triplent, le volume montant un peu.
     Un son qui décroît ne monte jamais ; un trémolo monte trop lentement. Une attaque au plus par 60 ms.
     feed(x, gate) reçoit les échantillons arrivés depuis l'appel précédent et renvoie, en secondes avant
     la fin de x, l'instant de la première attaque trouvée (ou null). */
  function makeOnset(sr) {
    const B = 128, WIN = 8, LAG0 = 8, LAG1 = 16;
    const e = [], h = [], W = [], WH = [];
    let carry = new Float32Array(0), prev = 0, pos = 0, last = -1e9;
    return function feed(x, gate) {
      let buf = x;
      if (carry.length) { buf = new Float32Array(carry.length + x.length); buf.set(carry); buf.set(x, carry.length); }
      const g2 = gate * gate * WIN;
      let found = null, b = 0;
      for (; b + B <= buf.length; b += B) {
        let se = 0, sh = 0;
        for (let i = b; i < b + B; i++) { const v = buf[i], d = v - prev; se += v * v; sh += d * d; prev = v; }
        e.push(se / B); h.push(sh / B);
        if (e.length > WIN) { e.shift(); h.shift(); }
        let w = 0, wh = 0;
        for (let i = 0; i < e.length; i++) { w += e[i]; wh += h[i]; }
        W.push(w); WH.push(wh);
        if (W.length > LAG1 + 1) { W.shift(); WH.shift(); }
        pos += B;
        const n = W.length;
        if (n <= LAG1 || pos - last < 0.06 * sr) continue;
        let ref = Infinity, refH = Infinity;
        for (let i = n - 1 - LAG1; i <= n - 1 - LAG0; i++) { if (W[i] < ref) ref = W[i]; if (WH[i] < refH) refH = WH[i]; }
        const rise = w > ref * 1.8 && w > g2;
        const click = wh > refH * 3 && w > ref * 1.15 && w > g2;
        if (rise || click) { last = pos; if (found == null) found = (buf.length - (b + B)) / sr; }
      }
      carry = buf.slice(b);
      if (found != null) found += carry.length / sr;
      return found;
    };
  }

  /* Seuil d'écoute et bruit de fond. Un micro de téléphone, sans gain automatique,
     rend un piano à 1 m vers −50 à −65 dB : le seuil suit le bruit de fond mesuré
     (3 fois au-dessus) et ne descend pas sous −70 dB. */
  const GATE_MIN = 0.0003, NF0 = 0.001; // NF0 : bruit de fond supposé au départ (seuil −50 dB), vite corrigé
  const gateOf = (nf) => Math.max(GATE_MIN, nf * 3);
  // bruit de fond : suivi sur les trames sans hauteur (vite vers le bas, lentement vers le haut)
  const floorOf = (nf, rms) => (rms < nf ? nf * 0.9 + rms * 0.1 : Math.min(0.05, nf * 0.997 + rms * 0.003));

  /* ---------- Les noms de notes chantés (la voix) ----------
     Chaque syllabe (do, ré, mi, fa, sol, la, si) est résumée par son timbre : les MFCC (enveloppe du
     spectre sur l'échelle des mels), toutes les 20 ms, du dernier creux d'énergie dans les 0,15 s qui
     précèdent le début de la note chantée jusqu'à 0,35 s après (ou la note suivante) : la consonne
     d'attaque (d, r, m, f, s, l) puis la voyelle tenue (o, é, i, a). On la compare à des modèles par
     alignement souple (DTW, qui tolère qu'on chante plus vite ou plus lentement).
     Les modèles par défaut viennent d'une cinquantaine de voix de synthèse neuronales (Kokoro) chantées à hauteur fixe ;
     ceux de l'élève (« Régler ma voix ») s'y ajoutent, et rendent la reconnaissance bien plus sûre. */
  const SYL = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'];
  const SYL_PC = { 0: 'do', 2: 're', 4: 'mi', 5: 'fa', 7: 'sol', 9: 'la', 11: 'si' };
  const SYL_PRE = 0.15, SYL_POST = 0.35;
  const NFFT = 2048, NB = 24, NC = 12;
  let fRe = null, fIm = null;
  function power(w) { // spectre de puissance (FFT radix 2 sur NFFT points)
    if (!fRe) { fRe = new Float64Array(NFFT); fIm = new Float64Array(NFFT); }
    const re = fRe, im = fIm, N = NFFT;
    re.fill(0); im.fill(0); re.set(w);
    for (let i = 1, j = 0; i < N; i++) {
      let bit = N >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { const t = re[i]; re[i] = re[j]; re[j] = t; }
    }
    for (let len = 2; len <= N; len <<= 1) {
      const a = (-2 * Math.PI) / len, wr = Math.cos(a), wi = Math.sin(a), h = len >> 1;
      for (let i = 0; i < N; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < h; k++) {
          const p = i + k, q = p + h;
          const vr = re[q] * cr - im[q] * ci, vi = re[q] * ci + im[q] * cr;
          re[q] = re[p] - vr; im[q] = im[p] - vi; re[p] += vr; im[p] += vi;
          const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
        }
      }
    }
    const P = new Float64Array(N / 2);
    for (let i = 0; i < N / 2; i++) P[i] = re[i] * re[i] + im[i] * im[i];
    return P;
  }
  // warp : le banc de filtres glissé en fréquence (×warp), pour une voix au conduit vocal plus court ou plus long
  const banks = {};
  function melBank(sr, warp = 1) {
    const key = sr + ':' + warp;
    if (banks[key]) return banks[key];
    const mel = (f) => 2595 * Math.log10(1 + f / 700), imel = (m) => 700 * (Math.pow(10, m / 2595) - 1);
    const lo = mel(80 * warp), hi = mel(7000 * warp), bin = sr / NFFT;
    const edges = Array.from({ length: NB + 2 }, (_, i) => imel(lo + ((hi - lo) * i) / (NB + 1)));
    const f = [];
    for (let b = 0; b < NB; b++) {
      const a = edges[b], c = edges[b + 1], d = edges[b + 2], w = [];
      for (let k = Math.floor(a / bin); k <= Math.ceil(d / bin) && k < NFFT / 2; k++) {
        const fk = k * bin, g = fk < c ? (fk - a) / (c - a) : (d - fk) / (d - c);
        if (g > 0) w.push([k, g]);
      }
      f.push(w);
    }
    return (banks[key] = { sr, f });
  }
  // MFCC de x[from…to[ : un tableau de trames (Float32Array de NC coefficients), fenêtres de 25 ms toutes les 20 ms
  function mfcc(x, sr, from, to, warp = 1) {
    const win = Math.round(0.025 * sr), hop = Math.round(0.02 * sr), B = melBank(sr, warp).f, out = [];
    const w = new Float64Array(Math.min(win, NFFT)), e = new Float64Array(NB);
    for (let s = Math.max(1, from); s + w.length <= Math.min(x.length, to); s += hop) {
      for (let i = 0; i < w.length; i++) w[i] = (x[s + i] - 0.97 * x[s + i - 1]) * (0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (w.length - 1)));
      const P = power(w);
      for (let b = 0; b < NB; b++) { let sum = 0; for (const [k, g] of B[b]) sum += g * P[k]; e[b] = Math.log(sum + 1e-10); }
      const c = new Float32Array(NC);
      for (let k = 1; k <= NC; k++) {
        let s2 = 0;
        for (let b = 0; b < NB; b++) s2 += e[b] * Math.cos((Math.PI * k * (b + 0.5)) / NB);
        c[k - 1] = s2 * (1 + 6 * Math.sin((Math.PI * k) / 12));
      }
      out.push(c);
    }
    return out;
  }
  // distance moyenne le long du meilleur alignement (bande de ±50 %)
  function dtw(A, Bq) {
    const n = A.length, m = Bq.length;
    if (!n || !m) return Infinity;
    const band = Math.ceil(Math.max(n, m) / 2) + Math.abs(n - m);
    let prev = new Float64Array(m + 1).fill(Infinity), cur = new Float64Array(m + 1);
    prev[0] = 0;
    for (let i = 1; i <= n; i++) {
      cur.fill(Infinity);
      const a = A[i - 1];
      for (let j = Math.max(1, i - band); j <= Math.min(m, i + band); j++) {
        const b = Bq[j - 1];
        let s = 0;
        for (let k = 0; k < NC; k++) { const d = a[k] - b[k]; s += d * d; }
        cur[j] = Math.sqrt(s) + Math.min(prev[j - 1], prev[j], cur[j - 1]);
      }
      const t = prev; prev = cur; cur = t;
    }
    return prev[m] / (n + m);
  }
  /* seqs : la syllabe chantée, telle quelle puis vue par des bancs de filtres glissés (sylSeqs) ; models : les
     modèles par défaut { do: [séquence, …], … }, comparés à toutes ces vues (des voix de toutes tailles) ;
     mine : ceux de l'élève (« Régler ma voix »), comparés à la syllabe telle quelle. → { best, d: { do: distance, … } } */
  function nearest(seqs, models, mine) {
    if (seqs && seqs.length && !Array.isArray(seqs[0])) seqs = [seqs]; // une seule séquence
    const d = {};
    let best = null;
    for (const s of SYL) {
      let v = Infinity;
      for (const t of (models && models[s]) || []) for (const q of seqs) v = Math.min(v, dtw(q, t));
      for (const t of (mine && mine[s]) || []) v = Math.min(v, dtw(seqs[0], t));
      d[s] = v;
      if (best == null || v < d[best]) best = s;
    }
    return { best, d };
  }
  /* La syllabe chantée est-elle le nom attendu ? 'oui', 'non' (un autre nom, nettement plus proche)
     ou null (on ne sait pas : on ne pénalise pas l'élève pour une hésitation de la reconnaissance). */
  function sayMatch(syl, want, strict) {
    if (!syl || !want || !isFinite(syl.d[want])) return null;
    if (syl.best === want) return 'oui';
    return syl.d[want] > syl.d[syl.best] * (strict ? 1.2 : 1.3) ? 'non' : null;
  }
  // modèles rangés en texte (base64 d'entiers sur 8 bits, une échelle commune)
  function packModels(models) {
    let mx = 1e-6;
    for (const s of SYL) for (const t of models[s] || []) for (const c of t) for (const v of c) mx = Math.max(mx, Math.abs(v));
    const sc = mx / 127, m = {};
    for (const s of SYL) {
      m[s] = (models[s] || []).map((t) => {
        const b = new Uint8Array(t.length * NC);
        t.forEach((c, i) => c.forEach((v, k) => { b[i * NC + k] = (Math.max(-127, Math.min(127, Math.round(v / sc))) + 256) % 256; }));
        let str = ''; for (const x of b) str += String.fromCharCode(x);
        return btoa(str);
      });
    }
    return { s: +sc.toPrecision(5), m };
  }
  function unpackModels(p) {
    const out = {};
    for (const s of SYL) {
      out[s] = ((p.m && p.m[s]) || []).map((str) => {
        const raw = atob(str), n = raw.length / NC, t = [];
        for (let i = 0; i < n; i++) { const c = new Float32Array(NC); for (let k = 0; k < NC; k++) { const v = raw.charCodeAt(i * NC + k); c[k] = (v > 127 ? v - 256 : v) * p.s; } t.push(c); }
        return t;
      });
    }
    return out;
  }

  /* La fenêtre de la syllabe d'une note commencée à « on » (s) ; prev : début de la note d'avant (ou -1),
     next : début de la note suivante si elle est déjà là. Pas trop loin avant : la fin de la note précédente
     n'est pas la consonne de celle-ci ; et pas au-delà de la note suivante (notes brèves). */
  function sylWindow(on, prev, next) {
    const pre = Math.max(0.05, Math.min(SYL_PRE, prev >= 0 ? on - prev - 0.12 : SYL_PRE));
    return [on - pre, next != null ? Math.max(on + 0.1, Math.min(on + SYL_POST, next - 0.02)) : on + SYL_POST];
  }
  /* Les MFCC de la syllabe d'une note commencée à l'échantillon « on », dans la fenêtre [a, b[ :
     on laisse de côté ce qui précède le dernier creux d'énergie avant la note (le silence, ou la fin
     de la note d'avant quand on enchaîne), pour garder la consonne d'attaque et la voyelle. */
  function sylSeq(x, sr, a, on, b, warp = 1) {
    a = Math.max(1, a); on = Math.max(a, Math.min(on, x.length));
    const hop = Math.round(0.01 * sr), E = [];
    for (let s = a; s + hop <= on; s += hop) { let e = 0; for (let i = s; i < s + hop; i++) e += x[i] * x[i]; E.push(e); }
    let cut = a;
    if (E.length > 1) {
      let mn = Infinity; for (const e of E) mn = Math.min(mn, e);
      for (let i = E.length - 1; i >= 0; i--) if (E[i] <= mn * 2 + 1e-12) { cut = a + i * hop; break; }
    }
    return mfcc(x, sr, cut, b, warp);
  }
  // la syllabe telle quelle, puis vue par des bancs glissés (voix plus grave, voix plus aiguë : enfant…)
  const WARPS = [1, 0.9, 1.1];
  const sylSeqs = (x, sr, a, on, b) => WARPS.map((w) => sylSeq(x, sr, a, on, b, w));

  return { yin, makeTracker, makeOnset, gateOf, floorOf, NF0, FMIN, FMAX, SYL, SYL_PC, SYL_PRE, SYL_POST, mfcc, dtw, nearest, sayMatch, sylWindow, sylSeq, sylSeqs, packModels, unpackModels };
})();

const Ear = (() => {
  const FRAME_MS = 28, N = 2048;
  const S = {
    on: false, stream: null, nodes: [], an: null, buf: null, timer: 0, sr: 48000, nf: PitchKit.NF0, gated: false, lastUi: 0, T: PitchKit.makeTracker(),
    mode: '', ring: null, fill: 0, tok: 0, onset: null,
    // la voix : historique du son (1,5 s), notes en attente de leur syllabe, modèles des syllabes
    hist: null, hw: 0, ht: 0, wait: [], voice: null, lastOn: -1,
    // pour le diagnostic (?diag) : traitements du micro, trames par seconde, retard du traitement
    dg: { proc: null, frames: 0, since: 0, fps: 0, lag: 0, lagMax: 0, rms: 0, f: 0 },
  };
  let onNote = null, onFrame = null, onEnded = null, onPending = null;

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
    onNote = handlers.onNote; onFrame = handlers.onFrame; onEnded = handlers.onEnded; onPending = handlers.onPending || null;
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
    // page pas encore touchée : le navigateur garde le son en pause jusqu'au premier geste (Sound.ensure le relance) ;
    // on n'attend pas indéfiniment
    try { if (ctx.state !== 'running') await Promise.race([ctx.resume(), new Promise((r) => setTimeout(r, 400))]); } catch (e) { /* reprise plus tard */ }
    const src = ctx.createMediaStreamSource(stream);
    const mute = ctx.createGain();
    mute.gain.value = 0;
    const node = await workletNode(ctx);
    if (tok !== S.tok) { stream.getTracks().forEach((t) => t.stop()); return; } // arrêté pendant la mise en route
    if (node) {
      node.port.onmessage = (ev) => feed(ev.data.x, ev.data.t);
      src.connect(node);
      node.connect(mute);
      Object.assign(S, { mode: 'worklet', nodes: [src, node, mute], an: null, ring: new Float32Array(N), fill: 0, hist: new Float32Array(Math.round(1.5 * ctx.sampleRate)), hw: 0, ht: 0, wait: [], lastOn: -1 });
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
    Object.assign(S, { on: true, stream, sr: ctx.sampleRate, nf: PitchKit.NF0, gated: false, onset: PitchKit.makeOnset(ctx.sampleRate) });
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
    Object.assign(S, { on: false, stream: null, nodes: [], an: null, ring: null, hist: null, wait: [] });
    session('playback');
  }

  // un morceau de son arrive du fil audio (t : instant de son dernier échantillon)
  function feed(x, t) {
    if (!S.on || !S.ring) return;
    if (S.hist) { // l'historique : le son des 1,5 dernières secondes
      const H = S.hist, L = H.length;
      for (let i = 0; i < x.length; i++) { H[S.hw] = x[i]; S.hw = (S.hw + 1) % L; }
      S.ht = t;
    }
    const r = S.ring, hop = x.length;
    if (hop >= N) r.set(x.subarray(hop - N));
    else { r.copyWithin(0, hop); r.set(x, N - hop); }
    S.fill += hop;
    if (S.fill < N) return;
    const lag = Sound.now() - t;
    S.dg.lag = lag;
    if (lag > S.dg.lagMax) S.dg.lagMax = lag;
    const ago = S.onset(x, PitchKit.gateOf(S.nf));
    analyzeFrame(r, t, ago == null ? null : t - ago);
    if (S.wait.length) settleSyllables();
  }

  /* La voix : une note chantée attend d'avoir SYL_POST de son après son début (ou la note suivante), puis sa syllabe est
     reconnue et la note part, avec { syl : { best, d } } (l'instant de la note reste celui du début). */
  function sample(t0, t1) { // le son entre deux instants, pris dans l'historique
    const H = S.hist, L = H.length, n = Math.round((t1 - t0) * S.sr), back = Math.round((S.ht - t0) * S.sr);
    if (n <= 0 || back > L || back < n) return null;
    const out = new Float32Array(n);
    let i0 = (S.hw - back + L * 2) % L;
    for (let i = 0; i < n; i++) { out[i] = H[i0]; i0 = (i0 + 1) % L; }
    return out;
  }
  function settleSyllables() {
    while (S.wait.length) {
      const w = S.wait[0], nx = S.wait[1];
      const [t0, t1] = PitchKit.sylWindow(w.on, w.prev, nx ? nx.on : null);
      if (S.ht < t1) return;
      S.wait.shift();
      const x = sample(t0, t1);
      if (x && S.voice) {
        const seqs = PitchKit.sylSeqs(x, S.sr, 0, Math.round((w.on - t0) * S.sr), x.length);
        const syl = PitchKit.nearest(seqs, S.voice.models, S.voice.mine);
        w.hit.syl = { best: syl.best, d: syl.d, user: !!S.voice.mine };
        w.hit.seq = seqs[0];
      }
      if (onNote) onNote(w.hit);
    }
  }

  function analyze() {
    if (!S.on) return;
    S.an.getFloatTimeDomainData(S.buf);
    const now = Sound.now(), hop = Math.round((FRAME_MS / 1000) * S.sr);
    const ago = S.onset(S.buf.subarray(N - hop), PitchKit.gateOf(S.nf));
    analyzeFrame(S.buf, now, ago == null ? null : now - ago);
  }

  function analyzeFrame(x, now, on = null) {
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
    const gate = PitchKit.gateOf(S.nf);
    const res = rms > gate ? PitchKit.yin(x, S.sr, undefined, undefined, S.T.expectPc) : null;
    S.dg.f = res ? res.f : 0;
    if (!res) S.nf = PitchKit.floorOf(S.nf, rms);
    const hit = S.T.push(res, rms, gate, now, on);
    if (hit && S.voice && S.hist) {
      // la voix chantée commence un peu avant la première trame où sa hauteur est sûre
      const onT = hit.t - 0.035;
      S.wait.push({ hit, on: onT, prev: S.lastOn });
      S.lastOn = onT;
      // la note est entendue, sa syllabe viendra un peu plus tard : la page peut déjà attendre la suivante
      if (onPending) onPending(hit);
    } else if (hit && onNote) onNote(hit);
    frame(rms, res, false);
  }

  function frame(rms, res, gated) {
    const t = performance.now();
    if (!onFrame || t - S.lastUi < 50) return;
    S.lastUi = t;
    const c = S.T.cand;
    const db = 20 * Math.log10(rms + 1e-9), fl = Math.max(-80, 20 * Math.log10(S.nf + 1e-9));
    onFrame({
      level: Math.max(0, Math.min(1, (db - fl - 4) / 40)),
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
    // la voix : models = modèles par défaut { do: [séquences], … } ou null (pas de reconnaissance des noms) ;
    // mine : ceux de l'élève (« Régler ma voix »), ou null
    setVoice: (models, mine) => { S.voice = models ? { models, mine: mine || null } : null; S.wait = []; S.T.voice = !!models; },
    voiceOk: () => S.mode === 'worklet',
    active: () => S.on,
    // pc : la note attendue (0 = do … 11 = si), ou une liste (la prochaine d'abord, puis les suivantes), ou null
    expect: (pc) => { const l = pc == null ? null : [].concat(pc); S.T.expectPcs = l && l.length ? l : null; S.T.expectPc = S.T.expectPcs ? S.T.expectPcs[0] : null; },
    nudge: (c) => S.T.nudge(c),
  };
})();
