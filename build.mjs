import fs from 'node:fs';
const r = (f) => fs.readFileSync(new URL('./src/' + f, import.meta.url), 'utf8');
const rl = (f) => fs.readFileSync(new URL('./laine/' + f, import.meta.url), 'utf8');
/* polices livrées avec la page (polices/, licence SIL OFL) : aucune visite ne contacte un serveur extérieur */
const font = (family, weight, file) => `@font-face { font-family: '${family}'; font-style: normal; font-weight: ${weight}; font-display: swap; src: url(data:font/woff2;base64,${fs.readFileSync(new URL('./polices/' + file, import.meta.url)).toString('base64')}) format('woff2'); }`;
const fontsCss = '/* Gluten (c) 2020 The Gluten Project Authors ; Andika (c) 2004-2022 SIL International ; SIL Open Font License 1.1 (voir polices/) */\n' + [
  font('Gluten', 700, 'gluten-latin-700-normal.woff2'), font('Gluten', 800, 'gluten-latin-800-normal.woff2'),
  font('Andika', 400, 'andika-latin-400-normal.woff2'), font('Andika', 700, 'andika-latin-700-normal.woff2'),
].join('\n');
const css = fontsCss + '\n' + ['_base.css', '_controls.css', '_scenes1.css', '_scenes2.css', '_motion.css'].map(r).join('\n');
const js = ['songs.js', 'audio.js', 'ear.js', 'rythme.js', 'scenes.js', 'scenes2.js', 'suivi.js', 'app.js'].map(r).join('\n');
const shell = r('shell.html');
const fill = (t, c = css, j = js) => t.replace('/*__CSS__*/', () => c).replace('/*__JS__*/', () => j);
const page = fill(shell);
const cut = shell.indexOf('<svg'); // le gabarit lui-même : en-tête avant, corps après
const headPart = fill(shell.slice(0, cut)).trim(), bodyPart = fill(shell.slice(cut)).trim();
fs.mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
const out = (name, html) => { fs.writeFileSync(new URL('./dist/' + name, import.meta.url), html); console.log('dist/' + name, (html.length / 1024).toFixed(1) + ' Ko'); };

// 1) fragment publié comme artifact (l'hôte ajoute le squelette du document)
out('notes-envolees.html', page);

// 2) document autonome : la page publiée sur GitHub Pages (index.html), qu'on peut aussi ouvrir telle quelle
const iconOf = (bg, ink) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="${bg}"/><path d="M27 15v25.5a8 8 0 1 0 5 7.4V24l12 4v-9z" fill="${ink}"/></svg>`)}`;
const icon = iconOf('#F6C744', '#1D2350');
const doc = (head, body, color, ico = icon) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="${color}">
<link rel="icon" href="${ico}">
${head}
</head>
<body>
${body}
</body>
</html>
`;
const index = doc(headPart, bodyPart, '#F6C744');
fs.writeFileSync(new URL('./index.html', import.meta.url), index);
console.log('index.html', (index.length / 1024).toFixed(1) + ' Ko');

// 3) la page de suivi des élèves, pour le professeur (suivi.html, non liée depuis le jeu)
const pShell = r('suivi-page.html');
const pCss = font('Gluten', 700, 'gluten-latin-700-normal.woff2') + '\n' + r('_suivi.css');
const pJs = ['songs.js', 'suivi.js', 'suivi-page.js'].map(r).join('\n');
const pCut = pShell.indexOf('<div id="app"');
const prof = doc(fill(pShell.slice(0, pCut), pCss, pJs).trim(), fill(pShell.slice(pCut), pCss, pJs).trim(), '#F6C744');
fs.writeFileSync(new URL('./suivi.html', import.meta.url), prof);
console.log('suivi.html', (prof.length / 1024).toFixed(1) + ' Ko');

/* 4) seconde version : décors en laine, en 3D image par image.
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
  const js2 = ['songs.js', 'audio.js', 'ear.js', 'rythme.js', 'scenes.js', 'scenes2.js', 'suivi.js'].map(r).join('\n') + '\n' + laineJs + '\n' + r('app.js');
  const lshell = rl('shell.html');
  const ONLINE = 'https://romaingaudet-maker.github.io/notes-envolees/laine/';
  const lfill = (t, pre) => t.replace('/*__CSS__*/', () => css2).replace('/*__PRE__*/', () => pre).replace('/*__THREE__*/', () => three).replace('/*__JS__*/', () => js2);
  // a) fragment publié comme artifact : les sons sont à côté (sons/)
  out('laine.html', lfill(lshell, `window.NE_ONLINE_URL = ${JSON.stringify(ONLINE)};`));
  // b) document autonome, publié sur GitHub Pages dans laine/ : les sons sont dans le dossier parent
  const pre = `window.NE_ONLINE_URL = ${JSON.stringify(ONLINE)}; window.SONS_BASE = '../sons/';`;
  const lcut = lshell.indexOf('<svg');
  const ldoc = doc(lfill(lshell.slice(0, lcut), pre).trim(), lfill(lshell.slice(lcut), pre).trim(), '#2B2350', iconOf('#2B2350', '#F2C14E'));
  fs.writeFileSync(new URL('./laine/index.html', import.meta.url), ldoc);
  console.log('laine/index.html', (ldoc.length / 1024).toFixed(1) + ' Ko');
}
