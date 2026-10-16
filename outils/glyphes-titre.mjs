/* Contours des lettres du titre « Les Notes Envolées » (police Gluten 800),
   pour les découper en feutrine dans la scène d'accueil de la version laine.
   Usage : node outils/glyphes-titre.mjs DOSSIER_NODE_MODULES
   (il faut opentype.js et @fontsource/gluten : npm install opentype.js @fontsource/gluten)
   Écrit laine/src/05-glyphes.js. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
const nm = process.argv[2];
if (!nm) { console.error('usage : node outils/glyphes-titre.mjs DOSSIER/node_modules'); process.exit(1); }
const require = createRequire(nm.replace(/\/?$/, '/'));
const opentype = require('opentype.js');
const buf = fs.readFileSync(nm + '/@fontsource/gluten/files/gluten-latin-800-normal.woff');
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const chars = [...new Set('Les Notes Envolées'.replace(/ /g, ''))];
const S = 100 / font.unitsPerEm; // taille : 100 unités par cadratin
const r = (v) => Math.round(v * 10) / 10;
const out = {};
for (const c of chars) {
  const g = font.charToGlyph(c);
  const p = g.getPath(0, 0, 100);
  // y vers le haut (opentype dessine y vers le bas)
  const d = p.commands.map((k) => {
    if (k.type === 'M' || k.type === 'L') return k.type + r(k.x) + ',' + r(-k.y);
    if (k.type === 'Q') return 'Q' + r(k.x1) + ',' + r(-k.y1) + ',' + r(k.x) + ',' + r(-k.y);
    if (k.type === 'C') return 'C' + r(k.x1) + ',' + r(-k.y1) + ',' + r(k.x2) + ',' + r(-k.y2) + ',' + r(k.x) + ',' + r(-k.y);
    return 'Z';
  }).join(' ');
  out[c] = { adv: r(g.advanceWidth * S), d };
}
const kern = {};
const pairs = ['Le', 'es', 'No', 'ot', 'te', 'En', 'nv', 'vo', 'ol', 'lé', 'ée'];
for (const pr of pairs) { const k = font.getKerningValue(font.charToGlyph(pr[0]), font.charToGlyph(pr[1])); if (k) kern[pr] = r(k * S); }
const js = `/* Contours des lettres du titre (police Gluten, SIL Open Font License), fabriqués par
   outils/glyphes-titre.mjs : M x,y · L x,y · Q x1,y1,x,y · C x1,y1,x2,y2,x,y · Z ; 100 unités par cadratin, y vers le haut. */
const GLYPHES = ${JSON.stringify(out, null, 0).replace(/},"/g, '},\n  "').replace(/^{/, '{\n  ').replace(/}}$/, '},\n}')};
const GLYPHES_KERN = ${JSON.stringify(kern)};
`;
fs.writeFileSync(new URL('../laine/src/05-glyphes.js', import.meta.url), js);
console.log('laine/src/05-glyphes.js', (js.length / 1024).toFixed(1) + ' Ko', Object.keys(out).join(''), JSON.stringify(kern));
