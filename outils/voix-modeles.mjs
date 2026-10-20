// Modèles par défaut des noms de notes chantés : MFCC de chaque syllabe (src/ear.js, PitchKit),
// tirés du corpus de syllabes chantées (outils/voix-corpus.py), rangés dans src/voix-modeles.js.
//   node outils/voix-modeles.mjs DOSSIER_DU_CORPUS [voix à laisser de côté, séparées par des virgules] [modèles par syllabe]
// Les voix laissées de côté servent aux tests (tests/voix/) : les modèles ne les ont jamais entendues.
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
// comme l'oreille : la première note trouvée par le suivi (réglé pour la voix), puis la fenêtre de la syllabe
// all : toutes les vues (bancs glissés, PitchKit.sylSeqs) au lieu de la syllabe telle quelle
export function syllableSeq(x, sr = 48000, all = false) {
  const T = PK.makeTracker(), N = 2048, hop = Math.round(0.028 * sr), onset = PK.makeOnset(sr);
  T.voice = true;
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
      const args = [x, sr, Math.round(t0 * sr), Math.round(on * sr), Math.round(t1 * sr)];
      return all ? PK.sylSeqs(...args) : PK.sylSeq(...args);
    }
  }
  return null;
}
// k modèles représentatifs parmi list : chaque choix rapproche le plus les autres de leur modèle le plus proche
export function medoids(list, k) {
  const n = list.length;
  if (n <= k) return list.slice();
  const D = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) D[i][j] = D[j][i] = PK.dtw(list[i], list[j]);
  const near = new Float64Array(n).fill(Infinity), chosen = new Set();
  for (let q = 0; q < k; q++) {
    let best = -1, cost = Infinity;
    for (let c = 0; c < n; c++) {
      if (chosen.has(c)) continue;
      let g = 0; for (let i = 0; i < n; i++) g += Math.min(near[i], D[i][c]);
      if (g < cost) { cost = g; best = c; }
    }
    chosen.add(best);
    for (let i = 0; i < n; i++) near[i] = Math.min(near[i], D[i][best]);
  }
  return [...chosen].map((c) => list[c]);
}
const voiceOf = (f) => f.replace('.wav', '').split('_').slice(1, -1).join('_');
if (process.argv[1] && process.argv[1].endsWith('voix-modeles.mjs')) {
  const dir = process.argv[2], skip = new Set((process.argv[3] || '').split(',').filter(Boolean)), K = +(process.argv[4] || 48);
  const all = Object.fromEntries(PK.SYL.map((s) => [s, []])), used = new Set();
  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith('.wav') || skip.has(voiceOf(f))) continue;
    const syl = f.split('_')[0];
    const { x, sr } = readWav(`${dir}/${f}`);
    const seq = syllableSeq(to48k(x, sr));
    if (seq && seq.length) { all[syl].push(seq); used.add(voiceOf(f)); } else console.warn('pas de note dans', f);
  }
  const models = Object.fromEntries(PK.SYL.map((s) => [s, medoids(all[s], K)]));
  const packed = PK.packModels(models);
  const js = `/* Modèles par défaut des noms de notes chantés (la voix) : le timbre (MFCC) des syllabes do ré mi fa sol
   la si, chantées à hauteur fixe par ${used.size} voix de synthèse neuronales (Kokoro), ${K} modèles par syllabe.
   Fabriqué par outils/voix-corpus.py et outils/voix-modeles.mjs ; « Régler ma voix » y ajoute ceux de l'élève. */
const VOIX_MODELES = ${JSON.stringify(packed)};
`;
  fs.writeFileSync(new URL('../src/voix-modeles.js', import.meta.url), js);
  console.log('src/voix-modeles.js', (js.length / 1024).toFixed(1) + ' Ko,', used.size, 'voix', Object.fromEntries(PK.SYL.map((s) => [s, `${models[s].length}/${all[s].length}`])));
}
