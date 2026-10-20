import fs from 'node:fs';
import vm from 'node:vm';
const src = fs.readFileSync(new URL('./src/songs.js', import.meta.url), 'utf8');
const ctx = {};
vm.runInNewContext(src + '\nthis.SONGS=SONGS; this.buildSong=buildSong;', ctx);
let bad = 0;
for (const raw of ctx.SONGS) {
  const s = ctx.buildSong(raw);
  const bars = (s.total - s.pickup) / s.barBeats;
  const lastPartial = (s.total - s.pickup) % s.barBeats;
  console.log(`\n${raw.title.replace(/_/g,' ')}  [${raw.meter.join('/')}, ♩=${raw.bpm}]  ${s.notes.length} notes, ${s.total} temps, ${bars.toFixed(2)} mesures, ambitus ${s.notes.reduce((a,n)=>n.step<a.step?n:a).name}–${s.notes.reduce((a,n)=>n.step>a.step?n:a).name}`);
  for (const ph of s.phrases) {
    const ok = ph.sylCount === ph.noteCount;
    if (!ok) bad++;
    const line = ph.events.map(e => e.rest ? '·' : `${e.fr}${e.octave===3?'₃':''}`).join(' ');
    console.log(`  ${ok ? '✓' : '✗'} ${ph.syllables.join('|')}  →  ${line}   (${ph.end - ph.start} t)`);
  }
  if (Math.abs(lastPartial) > 1e-9 && !(s.pickup > 0)) { console.log('  ✗ mesure finale incomplète :', lastPartial); bad++; }
}
console.log(bad ? `\n${bad} problème(s)` : '\nTout est cohérent.');
process.exitCode = bad ? 1 : 0;
