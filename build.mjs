import fs from 'node:fs';
import { execSync } from 'node:child_process';
/* node build.mjs           : production (fichiers à la racine du dépôt, publiés depuis main)
   node build.mjs --qualif  : qualification, dans _qualif/ (publiée sous /qualif/ depuis la branche qualif) :
                              suivi coupé, stockage à part, bandeau « Qualification », pas d'indexation */
const QUALIF = process.argv.includes('--qualif');
const ROOT = QUALIF ? './_qualif/' : './';
const write = (rel, content) => {
  const u = new URL(ROOT + rel, import.meta.url);
  fs.mkdirSync(new URL('./', u), { recursive: true });
  fs.writeFileSync(u, content);
  console.log((QUALIF ? '_qualif/' : '') + rel, (content.length / 1024).toFixed(1) + ' Ko');
};
const r = (f) => fs.readFileSync(new URL('./src/' + f, import.meta.url), 'utf8');
const rl = (f) => fs.readFileSync(new URL('./laine/' + f, import.meta.url), 'utf8');
/* polices livrées avec la page (polices/, licence SIL OFL) : aucune visite ne contacte un serveur extérieur */
const font = (family, weight, file) => `@font-face { font-family: '${family}'; font-style: normal; font-weight: ${weight}; font-display: swap; src: url(data:font/woff2;base64,${fs.readFileSync(new URL('./polices/' + file, import.meta.url)).toString('base64')}) format('woff2'); }`;
const fontsCss = '/* Gluten (c) 2020 The Gluten Project Authors ; Andika (c) 2004-2022 SIL International ; SIL Open Font License 1.1 (voir polices/) */\n' + [
  font('Gluten', 700, 'gluten-latin-700-normal.woff2'), font('Gluten', 800, 'gluten-latin-800-normal.woff2'),
  font('Andika', 400, 'andika-latin-400-normal.woff2'), font('Andika', 700, 'andika-latin-700-normal.woff2'),
].join('\n');
const css = fontsCss + '\n' + ['_base.css', '_controls.css', '_scenes1.css', '_scenes2.css', '_motion.css'].map(r).join('\n');
const fill = (t, c, j) => t.replace('/*__CSS__*/', () => c).replace('/*__JS__*/', () => j);
fs.mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
const out = (name, html) => { if (QUALIF) return; fs.writeFileSync(new URL('./dist/' + name, import.meta.url), html); console.log('dist/' + name, (html.length / 1024).toFixed(1) + ' Ko'); };

// le nom du jeu, partout : titre de la page, application installée sur le téléphone, icône
const NAME = 'Les Notes Envolées';
// l'icône de l'onglet, pour toutes les pages : le personnage de l'icône du téléphone, sans le ruban (illisible en petit)
const icon = 'data:image/png;base64,' + fs.readFileSync(new URL('./icone-onglet.png', import.meta.url)).toString('base64');
let rev = ''; // la version testée, affichée dans le bandeau
if (QUALIF) { try { rev = execSync('git rev-parse --short HEAD', { cwd: new URL('./', import.meta.url) }).toString().trim(); } catch (e) { /* hors dépôt */ } }
// le Worker du suivi de la production : en qualification, la page de suivi et le tableau d'honneur du Défi le lisent
// (la qualification, elle, n'envoie rien)
const PROD_SUIVI = (r('suivi.js').match(/'(https:\/\/[^']+\.workers\.dev)'/) || [])[1] || '';
const STAMP = !QUALIF ? '' : `<meta name="robots" content="noindex">
<script>window.NE_SUIVI_URL = ''; window.NE_NS = 'qualif-';${PROD_SUIVI ? ` window.NE_SUIVI_LECTURE = ${JSON.stringify(PROD_SUIVI)};` : ''}</script>
<style>html::after { content: "Qualification${rev ? ' · ' + rev : ''}"; position: fixed; left: max(8px, env(safe-area-inset-left, 0px)); bottom: max(8px, env(safe-area-inset-bottom, 0px)); z-index: 2147483647; padding: 4px 10px; border-radius: 999px; background: #D93D43; color: #FFFFFF; font: 700 11px/1.3 system-ui, sans-serif; letter-spacing: .06em; text-transform: uppercase; box-shadow: 0 2px 6px rgba(0, 0, 0, .3); pointer-events: none; }</style>`;
const doc = (head, body, color, ico = icon, extra = '') => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="${color}">
<link rel="icon" href="${ico}">
${STAMP}
${extra}
${head}
</head>
<body>
${body}
</body>
</html>
`;
// icône d'installation sur téléphone (écran d'accueil) : icone-180/192/512.png à la racine, manifest.webmanifest
const INSTALL = `<link rel="apple-touch-icon" href="icone-180.png">\n<link rel="manifest" href="manifest.webmanifest">\n<meta name="apple-mobile-web-app-title" content="${QUALIF ? 'Qualif Notes' : NAME}">`;

// 1) la page de suivi des élèves, pour le professeur (suivi.html, non liée depuis le jeu)
const pShell = r('suivi-page.html');
const pCss = font('Gluten', 700, 'gluten-latin-700-normal.woff2') + '\n' + r('_suivi.css');
const pJs = ['songs.js', 'suivi.js', 'page-retour.js', 'suivi-page.js'].map(r).join('\n');
const pCut = pShell.indexOf('<div id="app"');
// en qualification, le jeu n'envoie rien, mais la page de suivi lit les vrais résultats (Worker de production)
const pExtra = QUALIF && PROD_SUIVI ? `<script>window.NE_SUIVI_LECTURE = ${JSON.stringify(PROD_SUIVI)};</script>` : '';
const prof = doc(fill(pShell.slice(0, pCut), pCss, pJs).trim(), fill(pShell.slice(pCut), pCss, pJs).trim(), '#F6C744', icon, pExtra);
write('suivi.html', prof);

// 2) les pages de texte, liées en bas de l'accueil : « Comment jouer » (comment-jouer.html, à partir
//    de src/aide.html) et les mentions légales et confidentialité (mentions-legales.html, à partir de src/mentions.html)
{
  const tCss = fontsCss.split('\n')[0] + '\n' + [font('Gluten', 800, 'gluten-latin-800-normal.woff2'), font('Andika', 400, 'andika-latin-400-normal.woff2'), font('Andika', 700, 'andika-latin-700-normal.woff2')].join('\n') + '\n' + r('_page.css');
  const textPage = (src, scripts, name) => {
    const t = r(src), tJs = ['suivi.js', 'page-retour.js', ...scripts].map(r).join('\n');
    const tCut = t.indexOf('<header');
    write(name, doc(fill(t.slice(0, tCut), tCss, tJs).trim(), fill(t.slice(tCut), tCss, tJs).trim(), '#F6C744'));
  };
  textPage('aide.html', ['aide.js'], 'comment-jouer.html');
  textPage('mentions.html', ['mentions.js'], 'mentions-legales.html');

  // le banc d'essai de l'oreille, pour le professeur (banc.html, non liée depuis le jeu ; en qualification seulement) :
  // l'oreille, les sons et le juge du jeu ; les instruments, tirés de src/app.js (FAMS, INSTS), pour rester les mêmes
  const app = r('app.js');
  const grab = (name) => (app.match(new RegExp(`const ${name} = \\{[\\s\\S]*?\\n  \\};`)) || [])[0];
  const fams = grab('FAMS'), insts = grab('INSTS');
  if (!fams || !insts) throw new Error('banc.html : FAMS ou INSTS introuvable dans src/app.js');
  const bJs = ['audio.js', 'ear.js', 'rythme.js', 'page-retour.js'].map(r).join('\n')
    + `\nconst BANC_INST = (() => {\n${fams}\n${insts}\nreturn { FAMS, INSTS };\n})();\n` + r('banc.js');
  const b = r('banc.html'), bCut = b.indexOf('<header');
  if (QUALIF) write('banc.html', doc(fill(b.slice(0, bCut), tCss, bJs).trim(), fill(b.slice(bCut), tCss, bJs).trim(), '#F6C744'));
}

/* 3) le jeu (index.html) : décors en laine, en 3D image par image (sans WebGL, les décors en papier de src/).
   laine/src et laine/scenes sont mis bout à bout dans une seule fonction
   (les fichiers de laine/src dont le nom commence par 80 ou plus passent après les décors). */
{
  const dir = (d) => fs.readdirSync(new URL('./laine/' + d + '/', import.meta.url)).filter((f) => f.endsWith('.js')).sort();
  const src = dir('src'), scenes = dir('scenes');
  const laineJs = '(() => {\n' + [
    ...src.filter((f) => f < '80').map((f) => rl('src/' + f)),
    ...scenes.map((f) => rl('scenes/' + f)),
    ...src.filter((f) => f >= '80').map((f) => rl('src/' + f)),
  ].join('\n') + '\n})();';
  const three = rl('vendor/three.min.js');
  const css2 = css + '\n' + rl('laine.css');
  const js2 = ['songs.js', 'audio.js', 'voix-modeles.js', 'ear.js', 'rythme.js', 'scenes.js', 'scenes2.js', 'suivi.js', 'instruments.js'].map(r).join('\n') + '\n' + laineJs + '\n' + r('app.js');
  const lshell = rl('shell.html');
  const ONLINE = 'https://romaingaudet-maker.github.io/notes-envolees/';
  const lfill = (t, pre) => t.replace('/*__CSS__*/', () => css2).replace('/*__PRE__*/', () => pre).replace('/*__THREE__*/', () => three).replace('/*__JS__*/', () => js2);
  // a) fragment publié comme artifact (claude.ai) : les sons et les pages de texte sont à côté
  out('laine.html', lfill(lshell, `window.NE_ONLINE_URL = ${JSON.stringify(ONLINE)};`));
  // b) document autonome, publié à la racine du site (GitHub Pages, Netlify) : les sons, les pages de texte et la page
  //    de suivi sont à côté ; les portraits des décors dans laine/portraits/
  const pre = `window.NE_ONLINE_URL = ${JSON.stringify(ONLINE)}; window.PORTRAITS_BASE = 'laine/portraits/';`;
  const lcut = lshell.indexOf('<svg');
  write('index.html', doc(lfill(lshell.slice(0, lcut), pre).trim(), lfill(lshell.slice(lcut), pre).trim(), '#2B2350', icon, INSTALL));
  // c) l'ancienne adresse de la version en laine (laine/) : renvoie à la racine, en gardant la comptine demandée (#…)
  write('laine/index.html', `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<title>${NAME}</title>
<meta http-equiv="refresh" content="0; url=../">
<link rel="canonical" href="../">
<script>location.replace('../' + location.search + location.hash);</script>
</head>
<body>
<p><a href="../">${NAME}</a></p>
</body>
</html>
`);
}

/* 4) manifeste d'installation : nom, nom court et icônes pour l'écran d'accueil du téléphone (le même nom partout). */
{
  const manifest = (name, short, theme, bg) => JSON.stringify({
    name, short_name: short, lang: 'fr', start_url: './', scope: './', display: 'standalone',
    background_color: bg, theme_color: theme,
    icons: [192, 512].map((n) => ({ src: `icone-${n}.png`, sizes: `${n}x${n}`, type: 'image/png' })),
  }, null, 2) + '\n';
  write('manifest.webmanifest', QUALIF ? manifest(NAME + ' (qualification)', 'Qualif Notes', '#2B2350', '#2B2350') : manifest(NAME, NAME, '#2B2350', '#2B2350'));
}

// 5) qualification : les sons, les portraits et les icônes à côté des pages
if (QUALIF) {
  fs.cpSync(new URL('./sons/', import.meta.url), new URL(ROOT + 'sons/', import.meta.url), { recursive: true });
  if (fs.existsSync(new URL('./laine/portraits/', import.meta.url))) fs.cpSync(new URL('./laine/portraits/', import.meta.url), new URL(ROOT + 'laine/portraits/', import.meta.url), { recursive: true });
  for (const n of [180, 192, 512]) fs.copyFileSync(new URL(`./icone-${n}.png`, import.meta.url), new URL(ROOT + `icone-${n}.png`, import.meta.url));
  console.log('_qualif/sons/ + portraits + icônes');
}
