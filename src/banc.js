/* ------------------------------------------------------------------
   Les Notes Envolées — le banc d'essai de l'oreille (banc.html, pour le professeur, non liée depuis le jeu).
   Des exercices faits pour piéger l'oreille (notes répétées à plusieurs tempos, octaves, grands sauts, gamme
   rapide), joués sur un vrai instrument : la page écoute comme pendant une prise du niveau 2 (même oreille,
   src/ear.js ; même décompte ; même attente de la note suivante ; même juge, src/rythme.js) et montre, note par
   note, ce qu'elle a entendu. Le compte rendu (texte et détail brut : notes et trames entendues, appareil) se copie
   pour être envoyé. Les instruments viennent du jeu (BANC_INST, tiré de src/app.js à la construction).
------------------------------------------------------------------- */
(() => {
  const { FAMS, INSTS } = BANC_INST;
  const NB = ' ';
  const PC_FR = ['Do', 'Do♯', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
  const mod12 = (n) => ((n % 12) + 12) % 12;
  const nameOf = (m) => PC_FR[mod12(m)] + Math.floor(m / 12 - 1); // 60 → Do4, comme dans le jeu
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // les exercices : [note écrite (60 = Do4), durée en noires]
  const rep = (m, n, d, end = 1) => [...Array.from({ length: n - 1 }, () => [m, d]), [m, end]];
  const EX = [
    { id: 'do8', name: 'Do répété, croches', seq: rep(60, 8, 0.5) },
    { id: 'do4', name: 'Do répété, noires', seq: rep(60, 6, 1) },
    { id: 'do16', name: 'Do répété, doubles croches', seq: rep(60, 8, 0.25) },
    { id: 'doubles', name: 'Notes doublées', seq: [[60, .5], [60, .5], [62, .5], [62, .5], [64, .5], [64, .5], [65, .5], [65, .5], [67, 1]] },
    { id: 'poule', name: 'Une poule sur un mur (phrase 4)', seq: [[60, .5], [60, .5], [62, .5], [60, .5], [62, .5], [67, .5], [60, 1]] },
    { id: 'octaves', name: 'Octaves', seq: [[60, 1], [72, 1], [60, 1], [72, 1], [64, 1], [76, 1], [64, 1], [60, 1]] },
    { id: 'sauts', name: 'Grands sauts', seq: [[60, 1], [67, 1], [72, 1], [67, 1], [64, 1], [72, 1], [60, 1]] },
    { id: 'gamme', name: 'Gamme rapide', seq: [[60, .5], [62, .5], [64, .5], [65, .5], [67, .5], [69, .5], [71, .5], [72, .5], [71, .5], [69, .5], [67, .5], [65, .5], [64, .5], [62, .5], [60, 1]] },
  ];
  const TEMPOS = [60, 72, 96, 120, 144];

  const SET_KEY = (window.NE_NS || '') + 'notes-envolees-reglages';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(SET_KEY) || '{}') || {}; } catch (e) { saved = {}; }
  const S = { inst: INSTS[saved.inst] ? saved.inst : 'piano', ex: 'do8', tempo: 96 };
  const inst = () => { const i = INSTS[S.inst]; return Object.assign({}, i, { off: FAMS[i.fam].off }); };
  const ex = () => EX.find((e) => e.id === S.ex);
  const spb = () => 60 / S.tempo;
  const expOf = () => { let t = 0; return ex().seq.map(([m, d]) => { const o = { t: t * spb(), midi: m, d }; t += d; return o; }); };

  // ---- réglages ----
  $('inst').innerHTML = Object.entries(INSTS).map(([k, v]) => `<option value="${k}"${k === S.inst ? ' selected' : ''}>${esc(v.name)}</option>`).join('');
  $('inst').addEventListener('change', () => { S.inst = $('inst').value; applyInst(); });
  const chips = (box, items, cur, set) => {
    box.innerHTML = items.map(([k, label]) => `<button type="button" class="chip" data-k="${k}" aria-pressed="${String(k) === String(cur())}">${esc(label)}</button>`).join('');
    box.addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (!b || busy()) return;
      set(b.dataset.k);
      box.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
      paintEx();
    });
  };
  chips($('ex'), EX.map((e) => [e.id, e.name]), () => S.ex, (k) => { S.ex = k; });
  chips($('tp'), TEMPOS.map((t) => [t, String(t)]), () => S.tempo, (k) => { S.tempo = +k; });
  function paintEx() { $('exnotes').textContent = ex().seq.map(([m]) => nameOf(m)).join(' · '); }
  const PERC = new Set(['piano', 'xylophone', 'guitare', 'guitareelec']); // comme dans le jeu (src/app.js)
  function applyInst() { Sound.setTranspose(inst().play); Sound.useSamples(inst().voice); Ear.setPerc(PERC.has(S.inst)); }
  paintEx();

  // ---- l'écoute ----
  let R = null; // l'essai en cours
  let model = null;
  const busy = () => !!R;
  const state = (t, err) => { $('state').textContent = t; $('state').classList.toggle('err', !!err); };

  $('model').addEventListener('click', () => {
    if (busy() || !Sound.ensure()) return;
    applyInst();
    if (model) { model.stop(); model = null; }
    const v = inst().voice || 'piano';
    model = Sound.sequence(v, expOf().map((e) => ({ midi: e.midi, start: e.t, dur: e.d * spb() * 0.9, vel: 0.8 })));
  });

  function expectNext() {
    if (!R) return;
    const k = Math.min(R.got.length + R.pend, R.exp.length - 1);
    Ear.expect([mod12(R.exp[k].midi + inst().off)]);
  }

  $('go').addEventListener('click', async () => {
    if (busy() || !Sound.ensure()) return;
    applyInst();
    if (model) { model.stop(); model = null; }
    state('J’allume le micro…');
    try {
      if (!Ear.active()) {
        await Ear.start({
          onNote: (hit) => {
            if (!R || R.phase === 'done') return;
            R.pend = Math.max(0, R.pend - 1);
            const t = (hit.t != null ? hit.t : Sound.now()) - Sound.outLatency() - 0.03 - R.T0;
            R.hits.push({ t, r: hit.r, cents: hit.cents || 0 });
            if (t >= -0.6 * R.beat) {
              R.got.push({ t, midi: hit.r - inst().off, r: hit.r, cents: hit.cents || 0 });
              const s = document.createElement('span');
              s.textContent = nameOf(hit.r - inst().off);
              $('stream').appendChild(s);
            }
            expectNext();
          },
          onPending: () => { if (R) { R.pend++; expectNext(); } },
          onFrame: (fr) => {
            $('heard').style.setProperty('--lvl', fr.level.toFixed(2));
            $('heard').textContent = fr.note == null ? '…' : nameOf(fr.note - inst().off);
            if (R && fr.t != null && R.frames.length < 4000) R.frames.push([+(fr.t - Sound.outLatency() - 0.03 - R.T0).toFixed(3), fr.note == null ? null : fr.note - inst().off, +fr.level.toFixed(2), fr.gated ? 1 : 0]);
          },
          onEnded: () => { state('Le micro s’est arrêté.', true); },
        });
      }
    } catch (e) {
      state('Micro indisponible : ' + ((e && (e.code || e.message)) || 'erreur'), true);
      return;
    }
    start();
  });

  $('stop').addEventListener('click', () => { if (R) finish(true); });

  function start() {
    const exp = expOf(), beat = spb();
    const c0 = Sound.now() + 0.35;
    const clicks = [0, 1, 2, 3].map((k) => c0 + k * beat);
    clicks.forEach((t, i) => Sound.clickAt(t, i === 0));
    const T0 = c0 + 4 * beat;
    R = { exp, beat, T0, got: [], hits: [], frames: [], pend: 0, phase: 'count', ex: ex(), tempo: S.tempo, inst: S.inst,
      Tend: T0 + exp[exp.length - 1].t + Math.max(0.9, 1.6 * beat) };
    $('stream').textContent = '';
    $('result').hidden = true;
    $('go').disabled = true; $('model').disabled = true; $('stop').disabled = false;
    state('Écoute le décompte…');
    expectNext();
    const tick = () => {
      if (!R) return;
      const now = Sound.now();
      if (now < T0 - 0.04) {
        const k = Math.floor((now - c0) / beat + 0.001);
        $('count').textContent = k >= 0 ? String(k + 1) : '';
      } else if (R.phase === 'count') { R.phase = 'play'; $('count').textContent = ''; state('Joue !'); }
      const last = T0 + exp[exp.length - 1].t;
      if (now >= R.Tend || (R.got.length >= exp.length && now >= last + Math.max(0.45, 0.7 * beat))) { finish(false); return; }
      R.raf = requestAnimationFrame(tick);
    };
    R.raf = requestAnimationFrame(tick);
  }

  // ---- le bilan ----
  const HIST = [];
  function finish(stopped) {
    const run = R;
    R = null;
    cancelAnimationFrame(run.raf);
    Ear.expect(null);
    $('count').textContent = '';
    $('go').disabled = false; $('model').disabled = false; $('stop').disabled = true;
    state(stopped ? 'Arrêté.' : 'Fini. Le bilan est en dessous.');
    run.phase = 'done';
    const same = (e, g) => mod12(e.midi) === mod12(g.midi);
    const res = Rhythm.evaluate({ exp: run.exp, got: run.got, beat: run.beat, same, mic: true });
    const paired = new Set(res.notes.filter((x) => x.j != null).map((x) => x.j));
    const extra = new Set(res.extra);
    const dups = run.got.map((_, j) => j).filter((j) => !paired.has(j) && !extra.has(j));
    const octave = res.notes.filter((x) => x.kind === 'right' && run.got[x.j].midi !== run.exp[x.i].midi).length;
    const devMs = res.notes.filter((x) => x.kind === 'right').map((x) => Math.round(x.dev * run.beat * 1000));
    const med = devMs.length ? devMs.slice().sort((a, b) => a - b)[Math.floor(devMs.length / 2)] : null;
    const v = Rhythm.verdict(res);
    const d = Ear.diag ? Ear.diag() : {};
    const dev = {
      ua: navigator.userAgent, sr: d.sr, mode: d.mode, fps: d.fps && Math.round(d.fps), out: +(Sound.outLatency() || 0).toFixed(3),
      lag: d.lagMax != null ? Math.round(d.lagMax) : null,
    };
    const rec = { run, res, dups, octave, med, v, dev, stopped };
    paintResult(rec);
    HIST.unshift(rec);
    paintHist();
  }

  const fmtS = (t) => (t < 0 ? '−' : '') + Math.abs(t).toFixed(2).replace('.', ',') + NB + 's';
  const sign = (ms) => (ms > 0 ? '+' : ms < 0 ? '−' : '') + Math.abs(ms) + NB + 'ms';
  const KIND = { right: 'juste', wrong: 'fausse', missed: 'manquée' };
  const TIMING = { ok: 'en place', early: 'un peu tôt', late: 'un peu tard', 'early!': 'trop tôt', 'late!': 'trop tard' };

  function nearestNote(rec, t) {
    let best = null;
    rec.res.notes.forEach((x) => { if (x.j == null) return; const g = rec.run.got[x.j]; const d = t - g.t; if (!best || Math.abs(d) < Math.abs(best.d)) best = { i: x.i, d }; });
    return best;
  }

  function report(rec) {
    const { run, res } = rec, i = INSTS[run.inst];
    const L = [];
    L.push(`Banc d'essai — ${run.ex.name} — ${run.tempo} à la noire — ${i.name}${rec.stopped ? ' (arrêté)' : ''}`);
    L.push(`Appareil : ${rec.dev.ua}`);
    L.push(`Son ${rec.dev.sr || '?'} Hz · écoute ${rec.dev.mode || '?'} · ${rec.dev.fps || '?'} trames/s · latence de sortie ${rec.dev.out} s · retard max ${rec.dev.lag != null ? rec.dev.lag + ' ms' : '?'}`);
    L.push(`Attendues ${res.total} · entendues ${run.got.length} · justes ${res.right} · fausses ${res.wrong} · manquées ${res.missed} · en trop ${res.extra.length} · entendues deux fois ${rec.dups.length} · autre octave ${rec.octave} · décalage médian ${rec.med != null ? rec.med + ' ms' : '—'}`);
    L.push(`Le jeu dirait : « ${rec.v.text} »`);
    res.notes.forEach((x) => {
      const e = run.exp[x.i], g = x.j != null ? run.got[x.j] : null;
      L.push(`${x.i + 1}. ${nameOf(e.midi)} → ${g ? `${nameOf(g.midi)} ${g.cents >= 0 ? '+' : ''}${Math.round(g.cents)} c, ${sign(Math.round(x.dev * run.beat * 1000))}` : '—'} (${KIND[x.kind]}${x.kind === 'right' ? ', ' + TIMING[x.timing] : ''})`);
    });
    const extraLine = (j, what) => { const g = run.got[j], n = nearestNote(rec, g.t); return `${what} : ${nameOf(g.midi)} à ${fmtS(g.t)}${n ? ` (${n.d >= 0 ? '+' : '−'}${Math.abs(Math.round(n.d * 1000))} ms de la note ${n.i + 1})` : ''}`; };
    res.extra.forEach((j) => L.push(extraLine(j, 'En trop')));
    rec.dups.forEach((j) => L.push(extraLine(j, 'Entendue deux fois')));
    L.push('Détail : ' + JSON.stringify({
      ex: run.ex.id, tempo: run.tempo, inst: run.inst,
      exp: run.exp.map((e) => [+e.t.toFixed(3), e.midi]),
      hits: run.hits.map((h) => [+h.t.toFixed(3), h.r, Math.round(h.cents)]),
      frames: run.frames,
    }));
    return L.join('\n');
  }

  function timeline(rec) {
    const { run, res } = rec;
    const end = Math.max(run.exp[run.exp.length - 1].t + run.exp[run.exp.length - 1].d * run.beat, ...run.got.map((g) => g.t)) + 0.3;
    const start = Math.min(-0.3, ...run.got.map((g) => g.t - 0.1));
    const W = 900, H = 120, x = (t) => 20 + ((t - start) / (end - start)) * (W - 40);
    const k = res.k || 1, off = res.off || 0;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Notes attendues (traits) et notes entendues (points) dans le temps">`;
    s += `<line x1="20" y1="70" x2="${W - 20}" y2="70" stroke="var(--line)" stroke-width="2"/>`;
    run.exp.forEach((e, i) => {
      const X = x(off + k * e.t);
      s += `<line x1="${X}" y1="52" x2="${X}" y2="88" stroke="var(--ink)" stroke-width="2"/><text x="${X}" y="44" text-anchor="middle" font-size="13" fill="var(--ink)">${esc(nameOf(e.midi))}</text><text x="${X}" y="106" text-anchor="middle" font-size="11" fill="var(--ink-soft)">${i + 1}</text>`;
    });
    const col = (j) => {
      const x2 = res.notes.find((n) => n.j === j);
      if (x2) return x2.kind === 'right' ? (x2.timing === 'ok' ? 'var(--ok)' : 'var(--near)') : 'var(--wrong)';
      return res.extra.includes(j) ? 'var(--wrong)' : 'var(--dup)';
    };
    run.got.forEach((g, j) => {
      const X = x(g.t), ring = !res.notes.some((n) => n.j === j);
      s += `<circle cx="${X}" cy="70" r="${ring ? 6 : 7}" fill="${ring ? 'var(--white)' : col(j)}" stroke="${col(j)}" stroke-width="${ring ? 3 : 0}"/>`;
    });
    return s + '</svg>';
  }

  function paintResult(rec) {
    const { run, res } = rec;
    const card = (n, label, bad) => `<div${bad && n ? ' class="bad"' : ''}><b>${n}</b><span>${label}</span></div>`;
    const rows = res.notes.map((x) => {
      const e = run.exp[x.i], g = x.j != null ? run.got[x.j] : null;
      const ms = g ? Math.round(x.dev * run.beat * 1000) : null;
      const oct = g && x.kind === 'right' && g.midi !== e.midi ? ` (octave ${g.midi > e.midi ? 'au-dessus' : 'en dessous'})` : '';
      return `<tr><td>${x.i + 1}</td><td>${esc(nameOf(e.midi))}</td><td>${g ? esc(nameOf(g.midi)) + oct : '—'}</td><td>${g ? (g.cents >= 0 ? '+' : '') + Math.round(g.cents) + NB + 'c' : ''}</td><td class="${x.kind === 'right' && x.timing !== 'ok' ? (x.dev < 0 ? 'early' : 'late') : ''}">${ms != null ? sign(ms) : ''}</td><td class="k-${x.kind}">${KIND[x.kind]}${x.kind === 'right' ? ', ' + TIMING[x.timing] : ''}</td></tr>`;
    }).join('');
    const extraLines = [...res.extra.map((j) => [j, 'En trop']), ...rec.dups.map((j) => [j, 'Entendue deux fois (pardonnée)'])]
      .map(([j, what]) => { const g = run.got[j], n = nearestNote(rec, g.t); return `<div><b>${what}</b>${NB}: ${esc(nameOf(g.midi))} à ${fmtS(g.t)}${n ? `, ${Math.abs(Math.round(n.d * 1000))}${NB}ms ${n.d >= 0 ? 'après' : 'avant'} la note ${n.i + 1}` : ''}</div>`; }).join('');
    const box = $('result');
    box.innerHTML = `
      <h2>${esc(run.ex.name)} · ${run.tempo} à la noire · ${esc(INSTS[run.inst].name)}</h2>
      <div class="verdict">Le jeu dirait${NB}: «${NB}${esc(rec.v.text)}${NB}»</div>
      <div class="sum">
        ${card(res.total, 'attendues')}${card(run.got.length, 'entendues')}${card(res.right, 'justes')}
        ${card(res.wrong, 'fausses', 1)}${card(res.missed, 'manquées', 1)}${card(res.extra.length, 'en trop', 1)}
        ${card(rec.dups.length, 'entendues deux fois', 1)}${card(rec.octave, 'autre octave', 1)}${card(rec.med != null ? sign(rec.med) : '—', 'décalage médian')}
      </div>
      <div class="tl">${timeline(rec)}</div>
      <div class="legend"><span><i style="background:var(--ok)"></i>juste, en place</span><span><i style="background:var(--near)"></i>juste, décalée</span><span><i style="background:var(--wrong)"></i>fausse ou en trop</span><span><i style="background:var(--white);border:3px solid var(--dup)"></i>entendue deux fois</span><span>traits : notes attendues</span></div>
      <div class="tbl"><table><thead><tr><th>#</th><th>Attendue</th><th>Entendue</th><th>Justesse</th><th>Décalage</th><th>Bilan</th></tr></thead><tbody>${rows}</tbody></table></div>
      ${extraLines ? `<div class="extras">${extraLines}</div>` : ''}
      <div class="copy"><button class="btn" id="copy" type="button">Copier le compte rendu</button><span id="copied"></span></div>
      <textarea id="rep" readonly aria-label="Compte rendu"></textarea>`;
    $('rep').value = report(rec);
    $('copy').addEventListener('click', () => {
      const t = $('rep');
      const ok = () => { $('copied').textContent = 'Copié.'; };
      const fallback = () => { t.focus(); t.select(); $('copied').textContent = 'Sélectionné : copie-le.'; };
      try { navigator.clipboard.writeText(t.value).then(ok, fallback); } catch (e) { fallback(); }
    });
    box.hidden = false;
  }

  function paintHist() {
    $('histbox').hidden = !HIST.length;
    $('hist').innerHTML = HIST.map((h) => `<div><b>${esc(h.run.ex.name)}</b>, ${h.run.tempo} à la noire, ${esc(INSTS[h.run.inst].name)}${NB}: ${h.res.right}/${h.res.total} justes, ${h.res.missed} manquée(s), ${h.res.extra.length} en trop, ${h.dups.length} entendue(s) deux fois · «${NB}${esc(h.v.text)}${NB}»</div>`).join('');
  }
})();
