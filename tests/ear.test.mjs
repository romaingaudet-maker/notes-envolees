// Tests de l'oreille (PitchKit) sur des signaux synthétiques
import fs from 'node:fs';
import vm from 'node:vm';
const ctx = { Math, Float32Array, console, performance: { now: () => 0 }, navigator: {}, Sound: {} };
vm.runInNewContext(fs.readFileSync(new URL('../src/ear.js', import.meta.url), 'utf8') + '\nthis.PitchKit = PitchKit;', ctx);
const { yin, makeTracker } = ctx.PitchKit;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const N = 2048;
let rnd = 1; const rand = () => ((rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648) * 2 - 1;

const TIMBRES = {
  sinus: (f, t) => Math.sin(2 * Math.PI * f * t),
  'flûte à bec': (f, t) => Math.sin(2 * Math.PI * f * t) + 0.18 * Math.sin(4 * Math.PI * f * t) + 0.05 * Math.sin(6 * Math.PI * f * t),
  clarinette: (f, t) => [1, 3, 5, 7, 9].reduce((a, k, i) => a + [1, .55, .3, .15, .08][i] * Math.sin(2 * Math.PI * f * k * t), 0),
  'piano/scie': (f, t) => [1, 2, 3, 4, 5, 6, 7, 8].reduce((a, k) => a + Math.sin(2 * Math.PI * f * k * t + k) / k, 0),
  'violon (fondamentale faible)': (f, t) => 0.35 * Math.sin(2 * Math.PI * f * t) + [2, 3, 4, 5].reduce((a, k) => a + (1 / k) * Math.sin(2 * Math.PI * f * k * t), 0),
  'trompette': (f, t) => [1, 2, 3, 4, 5, 6].reduce((a, k, i) => a + [.6, 1, .8, .5, .3, .2][i] * Math.sin(2 * Math.PI * f * k * t), 0),
  glockenspiel: (f, t) => Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2.76 * t) + 0.1 * Math.sin(2 * Math.PI * f * 5.4 * t),
};
let fails = 0, total = 0;
for (const sr of [44100, 48000]) {
  for (const [name, fn] of Object.entries(TIMBRES)) {
    // notes de G2 (trombone) à C7 (glockenspiel), bruit léger
    const midis = name === 'glockenspiel' ? [79, 84, 88, 91, 96] : [43, 46, 55, 60, 64, 67, 72, 76, 81, 86];
    for (const m of midis) {
      const f = hz(m) * Math.pow(2, 18 / 1200); // désaccordé de +18 cents
      const x = new Float32Array(N);
      for (let i = 0; i < N; i++) x[i] = 0.3 * fn(f, i / sr) + 0.01 * rand();
      const r = yin(x, sr);
      total++;
      const got = r ? 69 + 12 * Math.log2(r.f / 440) : NaN;
      const ok = r && Math.round(got) === m && Math.abs(got - m - 0.18) < 0.08;
      if (!ok) { fails++; console.log(`✗ ${name} @${sr} midi ${m}: ${r ? got.toFixed(2) : 'rien'}`); }
    }
  }
}
// bruit seul : pas de hauteur
let noisy = 0;
for (let k = 0; k < 20; k++) { const x = new Float32Array(N); for (let i = 0; i < N; i++) x[i] = 0.2 * rand(); if (yin(x, 48000)) noisy++; }
console.log(`hauteurs : ${total - fails}/${total} justes ; bruit blanc pris pour une note : ${noisy}/20`);

// ---- suivi : signal continu analysé toutes les 28 ms ----
function render(sr, events, tail = 0.4) {
  const dur = events.reduce((a, e) => Math.max(a, e.t + e.d), 0) + tail;
  const y = new Float32Array(Math.ceil(dur * sr));
  for (const e of events) {
    const f = hz(e.m);
    const i0 = Math.floor(e.t * sr), i1 = Math.min(y.length, Math.floor((e.t + e.d) * sr));
    for (let i = i0; i < i1; i++) {
      const t = (i - i0) / sr;
      const env = e.decay ? Math.exp(-t / e.decay) : Math.min(1, t / 0.02) * Math.min(1, (e.t + e.d - i / sr) / 0.02);
      y[i] += 0.25 * env * TIMBRES[e.timbre || 'flûte à bec'](f, t);
    }
  }
  for (let i = 0; i < y.length; i++) y[i] += 0.004 * rand();
  return y;
}
function listen(sr, y, expectPc = null) {
  const T = makeTracker(); T.expectPc = expectPc;
  const hop = Math.round(0.028 * sr), got = [];
  let nf = 0.003;
  for (let s = 0; s + N <= y.length; s += hop) {
    const x = y.subarray(s, s + N);
    let ss = 0; for (let i = 0; i < N; i++) ss += x[i] * x[i];
    const rms = Math.sqrt(ss / N), gate = Math.max(0.0025, nf * 2.5);
    const res = rms > gate ? yin(x, sr) : null;
    if (!res) nf = rms < nf ? nf * 0.9 + rms * 0.1 : Math.min(0.05, nf * 0.997 + rms * 0.003);
    const hit = T.push(res, rms, gate);
    if (hit) got.push(hit.r);
  }
  return got;
}
const names = (a) => a.map((m) => ['Do', 'Do#', 'Ré', 'Mib', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'Sib', 'Si'][m % 12] + (Math.floor(m / 12) - 1)).join(' ');
function scenario(title, sr, events, expect) {
  const got = listen(sr, render(sr, events));
  const ok = got.join() === expect.join();
  if (!ok) fails++;
  console.log(`${ok ? '✓' : '✗'} ${title} → ${names(got)}${ok ? '' : '   (attendu ' + names(expect) + ')'}`);
}
// Sur le pont d'Avignon, notes détachées (coups de langue de 60 ms)
const pont = [60, 60, 60, 62, 62, 62];
let t = 0.3; const det = pont.map((m) => { const e = { m, t, d: 0.24 }; t += 0.3; return e; });
scenario('flûte, notes répétées détachées', 48000, det, pont);
// même chose, coups de langue très courts (30 ms) sans silence franc
t = 0.3; const fast = pont.map((m) => { const e = { m, t, d: 0.27 }; t += 0.3; return e; });
scenario('flûte, notes répétées liées de près', 44100, fast, pont);
// legato : changements de hauteur sans silence
t = 0.3; const leg = [60, 62, 64, 65, 67].map((m) => { const e = { m, t, d: 0.36 }; t += 0.35; return e; });
scenario('legato', 48000, leg, [60, 62, 64, 65, 67]);
// piano : une note longue qui s'éteint ne compte qu'une fois
scenario('piano, note tenue qui s\'éteint', 48000, [{ m: 60, t: 0.2, d: 2.2, decay: 0.7, timbre: 'piano/scie' }], [60]);
// piano : la même note frappée deux fois
scenario('piano, même note frappée deux fois', 48000, [{ m: 64, t: 0.2, d: 0.6, decay: 0.5, timbre: 'piano/scie' }, { m: 64, t: 0.8, d: 0.8, decay: 0.5, timbre: 'piano/scie' }], [64, 64]);
// clarinette en si bémol (son réel) : Sib Sib Do
scenario('clarinette, son réel', 48000, [{ m: 58, t: 0.2, d: 0.3, timbre: 'clarinette' }, { m: 58, t: 0.6, d: 0.3, timbre: 'clarinette' }, { m: 60, t: 1.0, d: 0.5, timbre: 'clarinette' }], [58, 58, 60]);
// glockenspiel : notes très brèves
scenario('glockenspiel, coups brefs', 48000, [72, 76, 79, 84].map((m, i) => ({ m, t: 0.2 + i * 0.35, d: 0.3, decay: 0.12, timbre: 'glockenspiel' })), [72, 76, 79, 84]);
console.log(fails ? `\n${fails} échec(s)` : '\nTous les tests passent.');

// ---- cas difficiles ----
function renderFn(sr, dur, fn) { const y = new Float32Array(Math.ceil(dur * sr)); for (let i = 0; i < y.length; i++) y[i] = fn(i / sr) + 0.004 * rand(); return y; }
// voix d'enfant avec vibrato (±35 cents, 5,5 Hz) sur Sol4 tenu 1,5 s
{
  let ph = 0; const sr = 48000;
  const y = renderFn(sr, 2, (t) => { if (t < 0.2 || t > 1.7) return 0; const f = hz(67) * Math.pow(2, (35 * Math.sin(2 * Math.PI * 5.5 * t)) / 1200); ph += 2 * Math.PI * f / sr; return 0.25 * (Math.sin(ph) + 0.3 * Math.sin(2 * ph) + 0.1 * Math.sin(3 * ph)) * Math.min(1, (t - 0.2) / 0.05); });
  const got = listen(sr, y); const ok = got.join() === '67'; if (!ok) fails++;
  console.log(`${ok ? '✓' : '✗'} voix avec vibrato → ${names(got)}`);
}
// trombone : glissando Ré → Mi en 120 ms (ne doit pas compter de note intermédiaire attendue)
{
  let ph = 0; const sr = 48000;
  const y = renderFn(sr, 1.6, (t) => { if (t < 0.2 || t > 1.4) return 0; const m = t < 0.7 ? 50 : t < 0.82 ? 50 + (t - 0.7) / 0.12 * 2 : 52; ph += 2 * Math.PI * hz(m) / sr; return 0.25 * [1, 2, 3, 4, 5].reduce((a, k) => a + Math.sin(k * ph) / k, 0); });
  const got = listen(sr, y, 4); const ok = got.join() === '50,52'; if (!ok) fails++;
  console.log(`${ok ? '✓' : '✗'} trombone, glissando Ré → Mi → ${names(got)}`);
}
// paroles / bruit sans hauteur nette : rien
{
  const sr = 48000; let lp = 0;
  const y = renderFn(sr, 1.5, (t) => { lp = lp * 0.9 + rand() * 0.1; return (Math.sin(2 * Math.PI * 3 * t) > 0 ? 1 : 0.1) * lp * 2; });
  const got = listen(sr, y); const ok = got.length === 0; if (!ok) fails++;
  console.log(`${ok ? '✓' : '✗'} souffle et bruits → ${got.length ? names(got) : 'aucune note'}`);
}
console.log(fails ? `\n${fails} échec(s) au total` : '\nCas difficiles : tout passe.');
