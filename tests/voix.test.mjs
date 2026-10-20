// Tests de la voix : reconnaissance des noms de notes chantés (src/ear.js, PitchKit ; modèles src/voix-modeles.js).
// Les voix de tests/voix (synthèse espeak-ng, outils/voix-corpus.py) ne servent pas aux modèles par défaut.
// Lancer : node --no-warnings tests/voix.test.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import { readWav, to48k, syllableSeq } from '../outils/voix-modeles.mjs';
const ctx = { Math, Float32Array, Float64Array, Uint8Array, console, performance: { now: () => 0 }, navigator: {}, Sound: {}, btoa: (s) => Buffer.from(s, 'binary').toString('base64'), atob: (s) => Buffer.from(s, 'base64').toString('binary') };
vm.runInNewContext(fs.readFileSync(new URL('../src/voix-modeles.js', import.meta.url), 'utf8') + fs.readFileSync(new URL('../src/ear.js', import.meta.url), 'utf8') + '\nthis.PitchKit = PitchKit; this.M = VOIX_MODELES;', ctx);
const PK = ctx.PitchKit, DEF = PK.unpackModels(ctx.M), SYL = PK.SYL;
const dir = new URL('./voix/', import.meta.url);
const seqOf = (v, p, s) => { const { x, sr } = readWav(new URL(`${s}_${v}_${p}.wav`, dir)); return syllableSeq(to48k(x, sr)); };
let fails = 0;
const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? '✓' : '✗'} ${name}${info ? ' → ' + info : ''}`); };

// 1) sans réglage, des voix jamais vues : le bon nom, et jamais « non » pour le bon nom
for (const [v, p] of [['fr-m6', 30], ['fr-m6', 80], ['fr-f4', 30]]) {
  let ok = 0, wrong = 0; const errs = [];
  for (const s of SYL) {
    const syl = PK.nearest(seqOf(v, p, s), DEF);
    if (syl.best === s) ok++; else errs.push(`${s}→${syl.best}`);
    if (PK.sayMatch(syl, s, false) === 'non') wrong++;
  }
  check(`modèles par défaut, voix ${v} (${p}) : ${ok}/7`, ok >= 6 && wrong === 0, errs.join(' ') + (wrong ? ` · ${wrong} bon(s) nom(s) refusé(s)` : ''));
}

// 2) « Régler ma voix » à une hauteur, puis chanter à une autre : les mauvais noms sont repérés, les bons jamais refusés
{
  const user = Object.fromEntries(SYL.map((s) => [s, [seqOf('fr-m6', 30, s), ...DEF[s]]]));
  let caught = 0, tot = 0, wrong = 0;
  for (const s of SYL) {
    const syl = PK.nearest(seqOf('fr-m6', 80, s), user);
    if (PK.sayMatch(syl, s, true) === 'non') wrong++;
    for (const w of SYL) if (w !== s) { tot++; if (PK.sayMatch(syl, w, true) === 'non') caught++; }
  }
  check(`réglée, mauvais noms repérés : ${caught}/${tot}`, caught >= tot - 2 && wrong === 0, wrong ? `${wrong} bon(s) nom(s) refusé(s)` : '');
}

// 3) une phrase chantée « sol sol mi do » (chaque syllabe à sa hauteur naturelle, sans la transposer :
//    cela changerait aussi le timbre) ; le suivi, l'attaque et la fenêtre de la syllabe comme dans l'oreille
function listen(y, sr) {
  const T = PK.makeTracker(), N = 2048, hop = Math.round(0.028 * sr), onset = PK.makeOnset(sr), got = [];
  T.voice = true; // comme l'oreille quand on chante (Ear.setVoice)
  let nf = PK.NF0, prev = -1;
  for (let s = 0; s + N <= y.length; s += hop) {
    const w = y.subarray(s, s + N), now = (s + N) / sr;
    let ss = 0; for (let i = 0; i < N; i++) ss += w[i] * w[i];
    const rms = Math.sqrt(ss / N), gate = PK.gateOf(nf);
    const ago = onset(y.subarray(s === 0 ? 0 : s + N - hop, s + N), gate);
    const res = rms > gate ? PK.yin(w, sr) : null;
    if (!res) nf = PK.floorOf(nf, rms);
    const hit = T.push(res, rms, gate, now, ago == null ? null : now - ago);
    if (hit) {
      const on = hit.t - 0.035, [t0, t1] = PK.sylWindow(on, prev); prev = on;
      got.push({ r: hit.r, t: on, syl: PK.nearest(PK.sylSeq(y, sr, Math.round(t0 * sr), Math.round(on * sr), Math.round(t1 * sr)), DEF).best });
    }
  }
  return got;
}
function phrase(voice, p, want) {
  const sr = 48000;
  const parts = want.map((s) => { const { x, sr: s0 } = readWav(new URL(`${s}_${voice}_${p}.wav`, dir)); return to48k(x, s0); });
  const alone = parts.map((z) => { const g = listen(z, sr); return g.length ? g[0].r : null; });
  const gap = Math.round(0.08 * sr), y = new Float32Array(parts.reduce((a, z) => a + z.length + gap, 0) + sr / 2);
  const starts = []; let at = Math.round(0.3 * sr);
  for (const z of parts) { starts.push(at / sr); y.set(z, at); at += z.length + gap; }
  // une note par syllabe, ni plus ni moins
  const got = listen(y, sr), firsts = starts.map((t0, i) => got.find((g) => g.t > t0 - 0.05 && (i + 1 >= starts.length || g.t < starts[i + 1] - 0.05)));
  const txt = got.map((g) => `${g.syl}@${g.r}/${g.t.toFixed(2)}`).join(" ") + " (seules : " + alone.join(" ") + " ; débuts " + starts.map((t) => t.toFixed(2)).join(" ") + ")";
  check(`phrase chantée « ${want.join(' ')} » (${voice}) : une note par syllabe, bonne hauteur, bon nom`,
    got.length === want.length && firsts.every((g, i) => g && g.r === alone[i] && g.syl === want[i]), txt);
}
phrase('fr-f4', 30, ['sol', 'sol', 'mi', 'do']);
phrase('fr-m6', 30, ['do', 're', 'mi', 'fa', 'sol']);
phrase('fr-m6', 30, ['la', 'si', 'la', 'sol', 'fa', 'mi']);
phrase('fr-f4', 30, ['re', 'fa', 'la', 'si', 'mi', 'mi']);
console.log(fails ? `\n${fails} échec(s)` : '\nLes tests de la voix passent.');
process.exit(fails ? 1 : 0);
