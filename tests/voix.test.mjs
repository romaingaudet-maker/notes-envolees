// Tests de la voix : reconnaissance des noms de notes chantés (src/ear.js, PitchKit ; modèles src/voix-modeles.js).
// Les voix de tests/voix (Kokoro « chanté », outils/voix-corpus.py) n'ont pas servi aux modèles par défaut :
// un homme (am_michael), une femme (bf_emma) et une voix d'enfant (af_bella, conduit vocal plus court, notes aiguës).
// Lancer : node --no-warnings tests/voix.test.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import { readWav, to48k, syllableSeq } from '../outils/voix-modeles.mjs';
const ctx = { Math, Float32Array, Float64Array, Uint8Array, console, performance: { now: () => 0 }, navigator: {}, Sound: {}, btoa: (s) => Buffer.from(s, 'binary').toString('base64'), atob: (s) => Buffer.from(s, 'base64').toString('binary') };
vm.runInNewContext(fs.readFileSync(new URL('../src/voix-modeles.js', import.meta.url), 'utf8') + fs.readFileSync(new URL('../src/ear.js', import.meta.url), 'utf8') + '\nthis.PitchKit = PitchKit; this.M = VOIX_MODELES;', ctx);
const PK = ctx.PitchKit, DEF = PK.unpackModels(ctx.M), SYL = PK.SYL;
const dir = new URL('./voix/', import.meta.url);
const VOICES = [['am_michael', 45, 50], ['bf_emma', 57, 64], ['enfant-bella', 62, 67]]; // voix, note du réglage, note de l'essai
const wav = (v, m, s) => { const { x, sr } = readWav(new URL(`${s}_${v}_${m}.wav`, dir)); return to48k(x, sr); };
let fails = 0;
const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? '✓' : '✗'} ${name}${info ? ' → ' + info : ''}`); };

// 1) sans réglage : la plupart des noms reconnus, et JAMAIS un bon nom refusé (la page ne pénalise que si elle est sûre)
{
  let ok = 0, n = 0, refused = 0; const errs = [];
  for (const [v, , m] of VOICES) for (const s of SYL) {
    const syl = PK.nearest(syllableSeq(wav(v, m, s), 48000, true), DEF); n++;
    if (syl.best === s) ok++; else errs.push(`${v} ${s}→${syl.best}`);
    if (PK.sayMatch(syl, s, false) === 'non') refused++;
  }
  check(`modèles par défaut, voix jamais entendues : ${ok}/${n} noms reconnus, ${refused} bon(s) nom(s) refusé(s)`, ok >= 0.7 * n && refused === 0, errs.join(' · '));
}

// 2) « Régler ma voix » sur une note, puis chanter sur une autre : les mauvais noms sont repérés, les bons jamais refusés
for (const [v, mc, m] of VOICES) {
  const mine = Object.fromEntries(SYL.map((s) => [s, [syllableSeq(wav(v, mc, s))]]));
  let ok = 0, caught = 0, tot = 0, refused = 0;
  for (const s of SYL) {
    const syl = PK.nearest(syllableSeq(wav(v, m, s), 48000, true), DEF, mine);
    if (syl.best === s) ok++;
    if (PK.sayMatch(syl, s, true) === 'non') refused++;
    for (const w of SYL) if (w !== s) { tot++; if (PK.sayMatch(syl, w, true) === 'non') caught++; }
  }
  check(`réglée (${v}) : ${ok}/7 noms reconnus, mauvais noms repérés ${caught}/${tot}`, ok >= 6 && caught >= 0.85 * tot && refused === 0, refused ? `${refused} bon(s) nom(s) refusé(s)` : '');
}

// 3) une phrase chantée : le suivi, l'attaque et la fenêtre de chaque syllabe comme dans l'oreille
//    (fenêtre arrêtée au début de la note suivante), après « Régler ma voix »
function listen(y, sr, mine) {
  const T = PK.makeTracker(), N = 2048, hop = Math.round(0.028 * sr), onset = PK.makeOnset(sr), hits = [];
  T.voice = true; // comme l'oreille quand on chante (Ear.setVoice)
  let nf = PK.NF0;
  for (let s = 0; s + N <= y.length; s += hop) {
    const w = y.subarray(s, s + N), now = (s + N) / sr;
    let ss = 0; for (let i = 0; i < N; i++) ss += w[i] * w[i];
    const rms = Math.sqrt(ss / N), gate = PK.gateOf(nf);
    const ago = onset(y.subarray(s === 0 ? 0 : s + N - hop, s + N), gate);
    const res = rms > gate ? PK.yin(w, sr) : null;
    if (!res) nf = PK.floorOf(nf, rms);
    const hit = T.push(res, rms, gate, now, ago == null ? null : now - ago);
    if (hit) hits.push({ r: hit.r, on: hit.t - 0.035 });
  }
  return hits.map((h, i) => {
    const [t0, t1] = PK.sylWindow(h.on, i ? hits[i - 1].on : -1, i + 1 < hits.length ? hits[i + 1].on : null);
    const seqs = PK.sylSeqs(y, sr, Math.round(t0 * sr), Math.round(h.on * sr), Math.round(t1 * sr));
    return { r: h.r, t: h.on, syl: PK.nearest(seqs, DEF, mine).best };
  });
}
function phrase(v, mc, m, want, gapS = 0.08) {
  const sr = 48000, mine = Object.fromEntries(SYL.map((s) => [s, [syllableSeq(wav(v, mc, s))]]));
  const parts = want.map((s) => wav(v, m, s));
  const gap = Math.round(gapS * sr), y = new Float32Array(parts.reduce((a, z) => a + z.length + gap, 0) + sr / 2);
  const starts = []; let at = Math.round(0.3 * sr);
  for (const z of parts) { starts.push(at / sr); y.set(z, at); at += z.length + gap; }
  // une note par syllabe, ni plus ni moins, à la bonne hauteur, avec le bon nom
  const got = listen(y, sr, mine), firsts = starts.map((t0, i) => got.find((g) => g.t > t0 - 0.05 && (i + 1 >= starts.length || g.t < starts[i + 1] - 0.05)));
  const txt = got.map((g) => `${g.syl}@${g.r}/${g.t.toFixed(2)}`).join(' ') + ' (débuts ' + starts.map((t) => t.toFixed(2)).join(' ') + ')';
  check(`phrase chantée « ${want.join(' ')} » (${v}) : une note par syllabe, à la bonne hauteur`,
    got.length === want.length && firsts.every((g) => g && ((g.r % 12) + 12) % 12 === m % 12), txt);
  names.n += want.length; names.ok += firsts.filter((g, i) => g && g.syl === want[i]).length;
}
const names = { ok: 0, n: 0 };
phrase('am_michael', 45, 50, ['sol', 'sol', 'mi', 'do', 're']);
phrase('bf_emma', 57, 64, ['la', 'si', 'la', 'sol', 'fa', 'mi']);
phrase('enfant-bella', 62, 67, ['do', 're', 'mi', 'mi', 'fa', 'sol']);
phrase('enfant-bella', 62, 67, ['sol', 'sol', 'la', 'la', 'si', 'si'], 0.03); // presque lié
phrase('am_michael', 50, 45, ['fa', 'fa', 'la', 'la', 'do', 'do']);
check(`dans les phrases, noms reconnus : ${names.ok}/${names.n}`, names.ok >= 0.9 * names.n);
console.log(fails ? `\n${fails} échec(s)` : '\nLes tests de la voix passent.');
process.exit(fails ? 1 : 0);
