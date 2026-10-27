// Les sons enregistrés (sons/*.js) : lisibles, cohérents, et couvrant les notes que la page joue
// Lancement : node tests/sons.test.mjs
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const app = fs.readFileSync(new URL('src/app.js', root), 'utf8');
// table des instruments de la page : décalage de jeu et voix
const insts = [...app.matchAll(/^\s+(\w+): \{ name: '[^']+',.*?play: (-?\d+), voice: '(\w+)'(?:, [^}]*)? \}/gm)].map((m) => ({ key: m[1], play: +m[2], voice: m[3] }));
// notes écrites : touches du xylophone de l'écran (sol grave à do aigu) et petite fanfare de fin
const WRITTEN = [];
for (let m = 55; m <= 72; m++) WRITTEN.push(m);

let fails = 0;
const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? '✓' : '✗'} ${name}${info ? ' — ' + info : ''}`); };

check('instruments de la page trouvés', insts.length === 13, insts.map((i) => i.key).join(', '));
for (const inst of insts) {
  const file = new URL(`sons/${inst.voice}.js`, root);
  if (!fs.existsSync(file)) { check(`${inst.key} : fichier sons/${inst.voice}.js`, false, 'absent'); continue; }
  const box = { window: { NotesSons: [] } };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), box);
  const p = box.window.NotesSons[0];
  const mp3 = Buffer.from(p.mp3, 'base64');
  const sync = (mp3[0] === 0x49 && mp3[1] === 0x44 && mp3[2] === 0x33) || (mp3[0] === 0xff && (mp3[1] & 0xe0) === 0xe0);
  const zones = p.zones.slice().sort((a, b) => a.m - b.m);
  const sane = zones.every((z) => z.n > 0.2 && z.r >= 0 && z.r < 0.05 && z.a >= 0 && z.a <= 0.15 &&
    (!z.l || (z.l[0] > 0.2 && z.l[0] < z.l[1] && z.l[1] <= z.n)) && (p.kind === 'frappe' ? !z.l : !!z.l));
  const order = p.zones.every((z, i, a) => !i || z.s > a[i - 1].s + a[i - 1].n);
  // pour chaque note jouée, l'enregistrement le plus proche (en demi-tons)
  const far = Math.max(...WRITTEN.map((w) => Math.min(...zones.map((z) => Math.abs(w + inst.play - z.m)))));
  check(`${inst.key.padEnd(11)} ${p.id === inst.voice && sync ? 'MP3 lisible' : 'MP3 ILLISIBLE'}, ${zones.length} notes enregistrées, ${p.kind}`,
    p.id === inst.voice && sync && sane && order && far <= 3.6,
    `${(mp3.length / 1024).toFixed(0)} Ko · repère ${p.mark} s · au plus ${far.toFixed(1)} demi-tons d'un enregistrement` + (sane ? '' : ' · ZONES INCOHÉRENTES') + (order ? '' : ' · ORDRE'));
}
console.log(fails ? `\n${fails} échec(s)` : '\nSons : tout est en ordre.');
process.exitCode = fails ? 1 : 0;
