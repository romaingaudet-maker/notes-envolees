// Tests du juge de rythme (src/rythme.js) sur des phrases fabriquées
import fs from 'node:fs';
import vm from 'node:vm';
const ctx = { Math, Array, Float64Array, Int8Array };
vm.runInNewContext(fs.readFileSync(new URL('../src/rythme.js', import.meta.url), 'utf8') + '\nthis.Rhythm = Rhythm;', ctx);
const { evaluate, verdict } = ctx.Rhythm;

// Frère Jacques, 1re phrase à 100 à la noire : do ré mi do do ré mi do (croches… ici noires)
const beat = 0.6;
const phrase = (pitches, beats) => { let t = 0; return pitches.map((p, i) => { const e = { t, p }; t += beats[i] * beat; return e; }); };
const exp = phrase([60, 62, 64, 60, 60, 62, 64, 60], [1, 1, 1, 1, 1, 1, 1, 1]);
const same = (e, g) => e.p === g.p;
const play = (list, lat = 0.12) => list.map(([p, t]) => ({ p, t: t + lat }));
const perfect = exp.map((e) => [e.p, e.t]);

let fails = 0, total = 0;
function check(name, got, expectFn, mic = false) {
  total++;
  const r = evaluate({ exp, got, beat, same, mic });
  let ok = false, why = '';
  try { ok = expectFn(r); } catch (e) { why = e.message; }
  if (!ok) fails++;
  const v = verdict(r);
  console.log(`${ok ? '✓' : '✗'} ${name.padEnd(46)} → ${v.text}${ok ? '' : `   [${why || JSON.stringify({ pass: r.pass, right: r.right, inPlace: r.inPlace, far: r.farOff, extra: r.extra.length, drift: r.drift, off: +r.off.toFixed(3), timings: r.notes.map((x) => x.kind === 'right' ? x.timing : x.kind) })}]`}`);
}

check('parfait (avec 120 ms de latence)', play(perfect), (r) => r.pass && r.inPlace === 8 && Math.abs(r.off - 0.12) < 0.01);
check('jeu humain (± 40 ms)', play(perfect.map(([p, t], i) => [p, t + [0.03, -0.04, 0.02, 0.04, -0.03, 0.01, -0.02, 0.04][i]])), (r) => r.pass && r.inPlace === 8);
check('une note un peu en retard (0,3 temps)', play(perfect.map(([p, t], i) => [p, i === 4 ? t + 0.3 * beat : t])), (r) => r.pass && r.notes[4].timing === 'late');
check('une note très en retard (0,6 temps)', play(perfect.map(([p, t], i) => [p, i === 4 ? t + 0.6 * beat : t])), (r) => !r.pass && r.pitchOk && r.notes[4].timing === 'late!');
check('une note en avance (0,5 temps)', play(perfect.map(([p, t], i) => [p, i === 2 ? t - 0.5 * beat : t])), (r) => !r.pass && r.notes[2].timing === 'early!');
check('une fausse note', play(perfect.map(([p, t], i) => [i === 2 ? 65 : p, t])), (r) => !r.pass && r.notes[2].kind === 'wrong' && r.right === 7);
check('une note oubliée', play(perfect.filter((_, i) => i !== 5)), (r) => !r.pass && r.notes[5].kind === 'missed' && r.right === 7);
check('une note en trop', play([...perfect.slice(0, 3), [67, 1.5 * beat], ...perfect.slice(3)]), (r) => r.pass && r.extra.length === 1 && r.right === 8);
// micro : la même attaque entendue deux fois (40 ms d'écart, hauteur de la note d'avant) n'est pas une note en trop
const doubled = [...perfect.slice(0, 3), [62, perfect[3][1] - 0.04], ...perfect.slice(3, 6), [62, perfect[6][1] + 0.03], ...perfect.slice(6), [64, perfect[7][1] - 0.05]].sort((a, b) => a[1] - b[1]);
check('micro : attaques entendues deux fois', play(doubled), (r) => r.pass && r.perfect && r.extra.length === 0 && r.dup === 3, true);
check('xylophone : les mêmes touches comptent', play(doubled), (r) => r.extra.length === 3);
check('micro : vraie note en trop, loin des autres', play([...perfect.slice(0, 3), [67, 1.5 * beat], ...perfect.slice(3)]), (r) => r.extra.length === 1, true);
check('accélère (tempo × 0,8)', play(perfect.map(([p, t]) => [p, t * 0.8])), (r) => !r.pass && r.drift === 'faster');
check('ralentit (tempo × 1,25)', play(perfect.map(([p, t]) => [p, t * 1.25])), (r) => !r.pass && r.drift === 'slower');
check('part un temps trop tard, puis régulier', play(perfect.map(([p, t]) => [p, t + beat])), (r) => r.pass && Math.abs(r.entry - (1 + 0.12 / beat)) < 0.05);
check('rien joué', [], (r) => !r.pass && r.played === 0);
check('notes répétées, une oubliée au milieu', play(perfect.filter((_, i) => i !== 4)), (r) => r.notes[4].kind === 'missed' && r.notes[3].kind === 'right' && r.notes[3].timing === 'ok');
check('toutes fausses (autre mélodie)', play(perfect.map(([p, t]) => [p + 5, t])), (r) => !r.pass && r.right === 0);

// rythme pointé : noire pointée, croche, blanche
total++;
{
  const e2 = phrase([67, 69, 67], [1.5, 0.5, 2]);
  const ok = evaluate({ exp: e2, got: [{ p: 67, t: 0.1 }, { p: 69, t: 0.1 + 0.9 }, { p: 67, t: 0.1 + 1.2 }], beat, same });
  const flat = evaluate({ exp: e2, got: [{ p: 67, t: 0.1 }, { p: 69, t: 0.1 + 0.6 }, { p: 67, t: 0.1 + 1.2 }], beat, same });
  const good = ok.pass && !flat.pass && flat.notes[1].timing === 'early!';
  if (!good) fails++;
  console.log(`${good ? '✓' : '✗'} ${'noire pointée-croche jouée comme deux noires'.padEnd(46)} → ${verdict(flat).text}`);
}

// ---- indulgence sur les longues phrases et sur toute une comptine ----
function longCheck(name, n, mk, expectFn, opts = {}) {
  total++;
  const ex = Array.from({ length: n }, (_, i) => ({ t: i * 0.5 * beat, p: 60 + ((i * 5) % 7) }));
  const r = evaluate({ exp: ex, got: mk(ex).map(([p, t]) => ({ p, t: t + 0.1 })), beat, same, mic: !!opts.mic });
  let ok = false; try { ok = expectFn(r); } catch (e) { ok = false; }
  if (!ok) fails++;
  console.log(`${ok ? '✓' : '✗'} ${name.padEnd(46)} → ${verdict(r).text}${ok ? '' : `   [${JSON.stringify({ pass: r.pass, right: r.right, inPlace: r.inPlace, far: r.farOff, wrong: r.wrong, missed: r.missed, k: +r.k.toFixed(3), slope: +r.slope.toFixed(3) })}]`}`);
}
const jit = (i) => [0.04, -0.05, 0.06, -0.03, 0.05, -0.06, 0.02, -0.04][i % 8];
longCheck('16 croches, un peu plus lentes (× 1,07)', 16, (ex) => ex.map((e) => [e.p, e.t * 1.07]), (r) => r.pass);
longCheck('16 croches, ± 60 ms à chaque note', 16, (ex) => ex.map((e, i) => [e.p, e.t + jit(i)]), (r) => r.pass);
longCheck('12 croches, une note nettement en retard', 12, (ex) => ex.map((e, i) => [e.p, e.t + (i === 7 ? 0.6 * beat : 0)]), (r) => r.pass && r.farOff === 1);
longCheck('12 croches, deux notes nettement à côté', 12, (ex) => ex.map((e, i) => [e.p, e.t + (i === 4 || i === 9 ? 0.6 * beat : 0)]), (r) => !r.pass);
longCheck('8 croches, une note nettement en retard', 8, (ex) => ex.map((e, i) => [e.p, e.t + (i === 5 ? 0.6 * beat : 0)]), (r) => !r.pass);
longCheck('12 notes au micro, une note répétée manquée', 12, (ex) => ex.filter((_, i) => i !== 6).map((e) => [e.p, e.t]), (r) => r.pass, { mic: true });
longCheck('12 notes au xylophone, une note oubliée', 12, (ex) => ex.filter((_, i) => i !== 6).map((e) => [e.p, e.t]), (r) => !r.pass);
longCheck('comptine entière (44 notes), 2 fausses notes', 44, (ex) => ex.map((e, i) => [i === 10 || i === 30 ? e.p + 2 : e.p, e.t + jit(i)]), (r) => r.pass && r.wrong === 2);
longCheck('comptine entière (44 notes), 4 fausses notes', 44, (ex) => ex.map((e, i) => [i % 11 === 3 ? e.p + 2 : e.p, e.t]), (r) => !r.pass && r.wrong === 4);
longCheck('comptine entière, ralentit peu à peu (× 1,2)', 44, (ex) => ex.map((e) => [e.p, e.t * (1 + 0.2 * e.t / ex[43].t)]), (r) => !r.pass);

console.log(fails ? `\n${fails}/${total} tests en échec` : `\nLes ${total} tests du rythme passent.`);
process.exit(fails ? 1 : 0);
