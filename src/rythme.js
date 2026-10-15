/* ------------------------------------------------------------------
   Le rythme : compare une phrase jouée à la phrase attendue
   - les notes jouées sont associées aux notes attendues dans l'ordre
     (programmation dynamique : hauteur + écart de temps, notes oubliées
     ou en trop permises) ;
   - le décalage d'ensemble (latence du son ou du micro, départ un peu
     tardif) est retiré : on juge la place de chaque attaque par rapport
     à la pulsation donnée par le décompte ;
   - écarts exprimés en pulsations : ≤ 0,2 en place, ≤ 0,4 un peu tôt ou
     un peu tard, au-delà nettement en avance ou en retard.
------------------------------------------------------------------- */
const Rhythm = (() => {
  const OK = 0.2, NEAR = 0.4;

  const median = (a) => {
    const s = [...a].sort((x, y) => x - y), n = s.length;
    return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0;
  };

  // exp, got : [{ t (secondes) , … }] ; same(e, g) : bonne hauteur ?
  function align(exp, got, same, off, win) {
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
        const dt = (got[j - 1].t - exp[i - 1].t - off) / win;
        let best = D[i - 1][j - 1] + (same(exp[i - 1], got[j - 1]) ? 0 : WRONG) + Math.min(2, dt * dt), k = 0;
        if (D[i - 1][j] + MISS < best) { best = D[i - 1][j] + MISS; k = 1; }
        if (D[i][j - 1] + EXTRA < best) { best = D[i][j - 1] + EXTRA; k = 2; }
        D[i][j] = best; B[i][j] = k;
      }
    }
    const pairs = new Array(n).fill(-1), extra = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
      const k = B[i][j];
      if (k === 0 && i > 0 && j > 0) { pairs[i - 1] = j - 1; i--; j--; } else if (k === 1) i--; else { extra.push(j - 1); j--; }
    }
    return { pairs, extra: extra.reverse() };
  }

  /* exp : notes attendues { t } (t en secondes, la première à 0)
     got : notes jouées { t } (même origine : l'instant où la phrase devait commencer)
     beat : durée d'une pulsation (s) ; same(e, g) : la hauteur est-elle juste ? */
  function evaluate({ exp, got, beat, same }) {
    const n = exp.length;
    const win = Math.max(0.12, beat * 0.5);
    let off = got.length && same(exp[0], got[0]) && Math.abs(got[0].t) < beat * 1.5 ? got[0].t : 0;
    let A = align(exp, got, same, off, win);
    const firstDevs = [];
    A.pairs.forEach((j, i) => { if (j >= 0 && same(exp[i], got[j])) firstDevs.push(got[j].t - exp[i].t); });
    if (firstDevs.length) { off = median(firstDevs); A = align(exp, got, same, off, win); }

    const notes = exp.map((e, i) => {
      const j = A.pairs[i];
      if (j < 0) return { i, kind: 'missed' };
      const g = got[j];
      const dev = (g.t - e.t - off) / beat;
      const a = Math.abs(dev);
      const timing = a <= OK ? 'ok' : a <= NEAR ? (dev < 0 ? 'early' : 'late') : (dev < 0 ? 'early!' : 'late!');
      return { i, j, kind: same(e, g) ? 'right' : 'wrong', dev, timing };
    });
    const right = notes.filter((x) => x.kind === 'right');
    const inPlace = right.filter((x) => x.timing === 'ok').length;
    const farOff = right.filter((x) => x.timing.endsWith('!')).length;

    // tempo : pente entre temps joués et temps attendus (1 = tenu)
    let slope = 1;
    if (right.length >= 4) {
      const xs = right.map((x) => exp[x.i].t), ys = right.map((x) => got[x.j].t);
      const mx = xs.reduce((s, v) => s + v, 0) / xs.length, my = ys.reduce((s, v) => s + v, 0) / ys.length;
      let sxy = 0, sxx = 0;
      xs.forEach((x, k) => { sxy += (x - mx) * (ys[k] - my); sxx += (x - mx) * (x - mx); });
      if (sxx > beat * beat) slope = sxy / sxx;
    }
    const drift = slope > 1.1 ? 'slower' : slope < 0.9 ? 'faster' : null;

    const pitchOk = right.length === n;
    const rhythmOk = farOff === 0 && inPlace >= Math.ceil(0.75 * n);
    return {
      notes, extra: A.extra, off, entry: off / beat, slope, drift,
      right: right.length, inPlace, farOff, total: n,
      pitchOk, rhythmOk, pass: pitchOk && rhythmOk && A.extra.length <= 1,
      played: got.length,
    };
  }

  /* Phrase courte pour l'enfant */
  function verdict(r, ordinal) {
    if (!r.played) return { text: 'Je n’ai rien entendu… Recommence après le décompte.', mood: 'down' };
    if (r.pass) return r.inPlace === r.total ? { text: 'Parfait : juste et en rythme !', mood: 'ok' } : { text: 'Bravo, c’est réussi !', mood: 'ok' };
    if (!r.pitchOk) {
      const missed = r.notes.filter((x) => x.kind === 'missed').length;
      const wrong = r.total - r.right - missed;
      if (missed === r.total) return { text: 'Je n’ai pas reconnu la phrase. Écoute l’exemple.', mood: 'down' };
      if (!wrong) return { text: missed === 1 ? 'Presque ! Il manque une note.' : `Il manque ${missed} notes.`, mood: 'down' };
      if (!missed) return { text: wrong === 1 ? 'Presque ! Une note n’est pas la bonne.' : `${wrong} notes ne sont pas les bonnes.`, mood: 'down' };
      return { text: `${wrong + missed} notes ne sont pas les bonnes.`, mood: 'down' };
    }
    if (r.drift === 'faster') return { text: 'Les notes sont justes, mais tu as accéléré.', mood: 'up' };
    if (r.drift === 'slower') return { text: 'Les notes sont justes, mais tu as ralenti.', mood: 'up' };
    const worst = r.notes.filter((x) => x.kind === 'right' && x.timing !== 'ok').sort((a, b) => Math.abs(b.dev) - Math.abs(a.dev))[0];
    if (worst) {
      const where = ordinal ? ordinal(worst.i) : `La ${worst.i ? worst.i + 1 + 'e' : '1re'} note`;
      return { text: `Notes justes ! ${where} arrive ${worst.dev < 0 ? 'trop tôt' : 'trop tard'}.`, mood: 'up' };
    }
    return { text: 'Les notes sont justes. Attention aux notes en trop.', mood: 'up' };
  }

  return { evaluate, verdict, align, OK, NEAR };
})();
