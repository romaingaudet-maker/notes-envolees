// Modèles par défaut des noms de notes chantés : MFCC de chaque syllabe (src/ear.js, PitchKit),
// tirés du corpus de voix de synthèse (outils/voix-corpus.py), rangés dans src/voix-modeles.js.
//   node outils/voix-modeles.mjs DOSSIER_DU_CORPUS voix1,voix2,…
import fs from 'node:fs';
import vm from 'node:vm';
const ctx = { Math, Float32Array, Float64Array, Uint8Array, console, performance: { now: () => 0 }, navigator: {}, Sound: {}, btoa: (s) => Buffer.from(s, 'binary').toString('base64'), atob: (s) => Buffer.from(s, 'base64').toString('binary') };
vm.runInNewContext(fs.readFileSync(new URL('../src/ear.js', import.meta.url), 'utf8') + '\nthis.PitchKit = PitchKit;', ctx);
const PK = ctx.PitchKit;
export function readWav(file) {
  const b = fs.readFileSync(file), sr = b.readUInt32LE(24), n = (b.length - 44) >> 1, x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = b.readInt16LE(44 + 2 * i) / 32768;
  return { x, sr };
}
export function to48k(x, sr) {
  const n = Math.floor((x.length * 48000) / sr), y = new Float32Array(n);
  for (let i = 0; i < n; i++) { const p = (i * sr) / 48000, k = Math.floor(p), f = p - k; y[i] = (x[k] || 0) * (1 - f) + (x[k + 1] || 0) * f; }
  return y;
}
// comme l'oreille : la première note trouvée par le suivi, puis la fenêtre de la syllabe
export function syllableSeq(x, sr = 48000) {
  const T = PK.makeTracker(), N = 2048, hop = Math.round(0.028 * sr), onset = PK.makeOnset(sr);
  let nf = PK.NF0;
  for (let s = 0; s + N <= x.length; s += hop) {
    const w = x.subarray(s, s + N), now = (s + N) / sr;
    let ss = 0; for (let i = 0; i < N; i++) ss += w[i] * w[i];
    const rms = Math.sqrt(ss / N), gate = PK.gateOf(nf);
    const ago = onset(x.subarray(s === 0 ? 0 : s + N - hop, s + N), gate);
    const res = rms > gate ? PK.yin(w, sr) : null;
    if (!res) nf = PK.floorOf(nf, rms);
    const hit = T.push(res, rms, gate, now, ago == null ? null : now - ago);
    if (hit) {
      const on = hit.t - 0.035, [t0, t1] = PK.sylWindow(on, -1);
      return PK.sylSeq(x, sr, Math.round(t0 * sr), Math.round(on * sr), Math.round(t1 * sr));
    }
  }
  return null;
}
if (process.argv[1] && process.argv[1].endsWith('voix-modeles.mjs')) {
  const dir = process.argv[2], voices = (process.argv[3] || 'fr,fr-m3,fr-f2,fr-klatt').split(',');
  const models = Object.fromEntries(PK.SYL.map((s) => [s, []]));
  for (const f of fs.readdirSync(dir).sort()) {
    const [syl, ...rest] = f.replace('.wav', '').split('_');
    if (!voices.includes(rest.slice(0, -1).join('_'))) continue;
    const { x, sr } = readWav(`${dir}/${f}`);
    const seq = syllableSeq(to48k(x, sr));
    if (seq && seq.length) models[syl].push(seq); else console.warn('pas de note dans', f);
  }
  const packed = PK.packModels(models);
  const js = `/* Modèles par défaut des noms de notes chantés (la voix) : le timbre (MFCC) des syllabes
   do ré mi fa sol la si, dites par des voix de synthèse espeak-ng (${voices.join(', ')}).
   Fabriqué par outils/voix-modeles.mjs ; l'élève peut les remplacer par les siens (« Régler ma voix »). */
const VOIX_MODELES = ${JSON.stringify(packed)};
`;
  fs.writeFileSync(new URL('../src/voix-modeles.js', import.meta.url), js);
  console.log('src/voix-modeles.js', (js.length / 1024).toFixed(1) + ' Ko', Object.fromEntries(PK.SYL.map((s) => [s, models[s].length])));
}
