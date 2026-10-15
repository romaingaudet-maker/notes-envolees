/* ------------------------------------------------------------------
   Le rythme : compare une phrase jouée à la phrase attendue
   - les notes jouées sont associées aux notes attendues dans l'ordre
     (programmation dynamique : hauteur + écart de temps, notes oubliées
     ou en trop permises) ;
   - on retire le décalage d'ensemble (latence du son ou du micro, départ
     un peu tardif) et, sur les phrases assez longues, le tempo réellement
     tenu s'il reste proche du décompte (± 12 %) : un léger ralenti régulier
     ne fait pas « tomber » toutes les notes de la fin ;
   - écarts exprimés en pulsations : ≤ 0,25 en place, ≤ 0,45 un peu tôt ou
     un peu tard, au-delà nettement en avance ou en retard ;
   - indulgence qui grandit avec la longueur : sur une longue phrase, une
     note nettement à côté est pardonnée ; sur toute une comptine, quelques
     fausses notes aussi.
------------------------------------------------------------------- */
const Rhythm = (() => {
  const OK = 0.25, NEAR = 0.45;

  const median = (a) => {
    const s = [...a].sort((x, y) => x - y), n = s.length;
    return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0;
  };

  // exp, got : [{ t (secondes) , … }] ; same(e, g) : bonne hauteur ?
  // modèle de temps : une note attendue à t doit sonner à off + k·t
  function align(exp, got, same, off, k, win) {
    const n = exp.length, m = got.length;
    // une fausse note coûte plus qu'un écart de temps, même grand :
    // on associe d'abord les bonnes hauteurs, dans l'ordre
    const MISS = 1.5, EXTRA = 1.1, WRONG = 2.2;
    const D = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
    const B = Array.from({ length: n + 1 }, () => new Int8Array(m + 1));
    for (let i = 1; i <= n; i++) { D[i][0] = i * MISS; B[i][0] = 1; }
    for (let j = 1; j <= m; j++) { D[0][j] = j * EXTRA; B[0][j] = 2; }
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const dt = (got[j - 1].t - off - k * exp[i - 1].t) / win;
        let best = D[i - 1][j - 1] + (same(exp[i - 1], got[j - 1]) ? 0 : WRONG) + Math.min(2, dt * dt), b = 0;
        if (D[i - 1][j] + MISS < best) { best = D[i - 1][j] + MISS; b = 1; }
        if (D[i][j - 1] + EXTRA < best) { best = D[i][j - 1] + EXTRA; b = 2; }
        D[i][j] = best; B[i][j] = b;
      }
    }
    const pairs = new Array(n).fill(-1), extra = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
      const b = B[i][j];
      if (b === 0 && i > 0 && j > 0) { pairs[i - 1] = j - 1; i--; j--; } else if (b === 1) i--; else { extra.push(j - 1); j--; }
    }
    return { pairs, extra: extra.reverse() };
  }

  /* exp : notes attendues { t } (t en secondes, la première à 0)
     got : notes jouées { t } (même origine : l'instant où la phrase devait commencer)
     beat : durée d'une pulsation (s) ; same(e, g) : la hauteur est-elle juste ?
     mic : notes venues du micro (une note répétée peut lui échapper) */
  function evaluate({ exp, got, beat, same, mic = false }) {
    const n = exp.length;
    const win = Math.max(0.12, beat * 0.5);
    let off = got.length && same(exp[0], got[0]) && Math.abs(got[0].t) < beat * 1.5 ? got[0].t : 0;
    let k = 1, raw = 1;
    let A = align(exp, got, same, off, k, win);
    const rightPairs = () => A.pairs.map((j, i) => [i, j]).filter(([i, j]) => j >= 0 && same(exp[i], got[j]));
    let rp = rightPairs();
    if (rp.length) { off = median(rp.map(([i, j]) => got[j].t - exp[i].t)); A = align(exp, got, same, off, k, win); rp = rightPairs(); }
    // tempo réellement tenu (phrases assez longues seulement : sinon on effacerait les erreurs de rythme)
    for (let it = 0; it < 2 && rp.length >= 5; it++) {
      const xs = rp.map(([i]) => exp[i].t), ys = rp.map(([, j]) => got[j].t);
      const mx = xs.reduce((a, v) => a + v, 0) / xs.length, my = ys.reduce((a, v) => a + v, 0) / ys.length;
      let sxy = 0, sxx = 0;
      xs.forEach((x, q) => { sxy += (x - mx) * (ys[q] - my); sxx += (x - mx) * (x - mx); });
      if (sxx < (3 * beat) * (3 * beat)) break;
      raw = sxy / sxx;
      k = Math.max(0.88, Math.min(1.12, raw));
      off = median(rp.map(([i, j]) => got[j].t - k * exp[i].t));
      A = align(exp, got, same, off, k, win);
      rp = rightPairs();
    }

    const notes = exp.map((e, i) => {
      const j = A.pairs[i];
      if (j < 0) return { i, kind: 'missed' };
      const g = got[j];
      const dev = (g.t - off - k * e.t) / beat;
      const a = Math.abs(dev);
      const timing = a <= OK ? 'ok' : a <= NEAR ? (dev < 0 ? 'early' : 'late') : (dev < 0 ? 'early!' : 'late!');
      return { i, j, kind: same(e, g) ? 'right' : 'wrong', dev, timing };
    });
    const right = notes.filter((x) => x.kind === 'right');
    const missed = notes.filter((x) => x.kind === 'missed').length;
    const wrong = n - right.length - missed;
    const inPlace = right.filter((x) => x.timing === 'ok').length;
    const farOff = right.filter((x) => x.timing.endsWith('!')).length;
    const drift = raw > 1.1 ? 'slower' : raw < 0.9 ? 'faster' : null;
    const tempoOk = raw >= 0.86 && raw <= 1.14;

    // indulgence selon la longueur
    const okWrong = n >= 20 ? Math.floor(n / 20) : 0;
    const okMissed = (mic && n >= 8 ? 1 : 0) + (n >= 20 ? Math.floor(n / 20) : 0);
    const okFar = (n >= 10 ? 1 : 0) + (n >= 24 ? Math.floor((n - 10) / 12) : 0);
    const okExtra = 1 + Math.floor(n / 8);
    const pitchOk = wrong <= okWrong && missed <= okMissed;
    const rhythmOk = tempoOk && farOff <= okFar && inPlace >= Math.ceil(0.6 * right.length);
    return {
      notes, extra: A.extra, off, k, slope: raw, entry: off / beat, drift,
      right: right.length, wrong, missed, inPlace, farOff, total: n,
      pitchOk, rhythmOk, pass: pitchOk && rhythmOk && A.extra.length <= okExtra,
      perfect: right.length === n && inPlace === n && !A.extra.length,
      played: got.length,
    };
  }

  /* Phrase courte pour l'enfant */
  function verdict(r, ordinal) {
    if (!r.played) return { text: 'Je n’ai rien entendu… Recommence après le décompte.', mood: 'down' };
    if (r.pass) return r.perfect ? { text: 'Parfait : juste et en rythme !', mood: 'ok' } : { text: 'Bravo, c’est réussi !', mood: 'ok' };
    if (!r.pitchOk) {
      if (r.missed === r.total) return { text: 'Je n’ai pas reconnu la phrase. Écoute l’exemple.', mood: 'down' };
      if (!r.wrong) return { text: r.missed === 1 ? 'Presque ! Il manque une note.' : `Il manque ${r.missed} notes.`, mood: 'down' };
      if (!r.missed) return { text: r.wrong === 1 ? 'Presque ! Une note n’est pas la bonne.' : `${r.wrong} notes ne sont pas les bonnes.`, mood: 'down' };
      return { text: `${r.wrong + r.missed} notes ne sont pas les bonnes.`, mood: 'down' };
    }
    if (r.drift === 'faster') return { text: 'Les notes sont justes, mais tu as accéléré.', mood: 'up' };
    if (r.drift === 'slower') return { text: 'Les notes sont justes, mais tu as ralenti.', mood: 'up' };
    const worst = r.notes.filter((x) => x.kind === 'right' && x.timing !== 'ok').sort((a, b) => Math.abs(b.dev) - Math.abs(a.dev))[0];
    if (worst) {
      const where = ordinal ? ordinal(worst.i) : `La ${worst.i ? worst.i + 1 + 'e' : '1re'} note`;
      return { text: `Notes justes ! ${where} arrive ${worst.dev < 0 ? 'trop tôt' : 'trop tard'}.`, mood: 'up' };
    }
    return { text: 'Les notes sont justes. Attention aux notes en trop.', mood: 'up' };
  }

  return { evaluate, verdict, align, OK, NEAR };
})();
