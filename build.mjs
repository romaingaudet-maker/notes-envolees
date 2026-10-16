import fs from 'node:fs';
const r = (f) => fs.readFileSync(new URL('./src/' + f, import.meta.url), 'utf8');
const css = ['_base.css', '_controls.css', '_scenes1.css', '_scenes2.css', '_motion.css'].map(r).join('\n');
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
const icon = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#F6C744"/><path d="M27 15v25.5a8 8 0 1 0 5 7.4V24l12 4v-9z" fill="#1D2350"/></svg>')}`;
const doc = (head, body, color) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="${color}">
<link rel="icon" href="${icon}">
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
const pCss = r('_suivi.css');
const pJs = ['songs.js', 'suivi.js', 'suivi-page.js'].map(r).join('\n');
const pCut = pShell.indexOf('<div id="app"');
const prof = doc(fill(pShell.slice(0, pCut), pCss, pJs).trim(), fill(pShell.slice(pCut), pCss, pJs).trim(), '#F6C744');
fs.writeFileSync(new URL('./suivi.html', import.meta.url), prof);
console.log('suivi.html', (prof.length / 1024).toFixed(1) + ' Ko');
