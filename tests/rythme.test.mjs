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
function check(name, got, expectFn) {
  total++;
  const r = evaluate({ exp, got, beat, same });
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

console.log(fails ? `\n${fails}/${total} tests en échec` : `\nLes ${total} tests du rythme passent.`);
process.exit(fails ? 1 : 0);
