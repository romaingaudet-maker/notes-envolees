import fs from 'node:fs';
const r = (f) => fs.readFileSync(new URL('./src/' + f, import.meta.url), 'utf8');
const rl = (f) => fs.readFileSync(new URL('./laine/' + f, import.meta.url), 'utf8');
const css = ['_base.css', '_controls.css', '_scenes1.css', '_scenes2.css', '_motion.css'].map(r).join('\n');
const js = ['songs.js', 'audio.js', 'ear.js', 'rythme.js', 'scenes.js', 'scenes2.js', 'app.js'].map(r).join('\n');
const out = (name, html) => { fs.writeFileSync(new URL('./dist/' + name, import.meta.url), html); console.log('dist/' + name, (html.length / 1024).toFixed(1) + ' Ko'); };
fs.mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
const iconOf = (bg, ink) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="${bg}"/><path d="M27 15v25.5a8 8 0 1 0 5 7.4V24l12 4v-9z" fill="${ink}"/></svg>`)}`;
const docOf = (headPart, bodyPart, icon, theme) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="${theme}">
<link rel="icon" href="${icon}">
${headPart}
</head>
<body>
${bodyPart}
</body>
</html>
`;

/* ---------- première version : décors en papier découpé ---------- */
{
  const shell = r('shell.html');
  const fill = (t) => t.replace('/*__CSS__*/', () => css).replace('/*__JS__*/', () => js);
  const page = fill(shell);
  const cut = shell.indexOf('<svg'); // le gabarit lui-même : en-tête avant, corps après
  const headPart = fill(shell.slice(0, cut)).trim(), bodyPart = fill(shell.slice(cut)).trim();
  // 1) fragment publié comme artifact (l'hôte ajoute le squelette du document)
  out('notes-envolees.html', page);
  // 2) document autonome : la page publiée sur GitHub Pages (index.html), qu'on peut aussi ouvrir telle quelle
  const doc = docOf(headPart, bodyPart, iconOf('#F6C744', '#1D2350'), '#F6C744');
  fs.writeFileSync(new URL('./index.html', import.meta.url), doc);
  console.log('index.html', (doc.length / 1024).toFixed(1) + ' Ko');
}

/* ---------- seconde version : décors en laine, en 3D image par image ----------
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
  const js2 = ['songs.js', 'audio.js', 'ear.js', 'rythme.js', 'scenes.js', 'scenes2.js'].map(r).join('\n') + '\n' + laineJs + '\n' + r('app.js');
  const shell = rl('shell.html');
  const ONLINE = 'https://romaingaudet-maker.github.io/notes-envolees/laine/';
  const fill = (t, pre) => t.replace('/*__CSS__*/', () => css2).replace('/*__PRE__*/', () => pre).replace('/*__THREE__*/', () => three).replace('/*__JS__*/', () => js2);
  // 1) fragment publié comme artifact : les sons sont à côté (sons/)
  out('laine.html', fill(shell, `window.NE_ONLINE_URL = ${JSON.stringify(ONLINE)};`));
  // 2) document autonome, publié sur GitHub Pages dans laine/ : les sons sont dans le dossier parent
  const pre = `window.NE_ONLINE_URL = ${JSON.stringify(ONLINE)}; window.SONS_BASE = '../sons/';`;
  const cut = shell.indexOf('<svg');
  const doc = docOf(fill(shell.slice(0, cut), pre).trim(), fill(shell.slice(cut), pre).trim(), iconOf('#2B2350', '#F2C14E'), '#2B2350');
  fs.writeFileSync(new URL('./laine/index.html', import.meta.url), doc);
  console.log('laine/index.html', (doc.length / 1024).toFixed(1) + ' Ko');
}
