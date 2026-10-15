import fs from 'node:fs';
const r = (f) => fs.readFileSync(new URL('./src/' + f, import.meta.url), 'utf8');
const css = ['_base.css', '_controls.css', '_scenes1.css', '_scenes2.css', '_motion.css'].map(r).join('\n');
const js = ['songs.js', 'audio.js', 'ear.js', 'rythme.js', 'scenes.js', 'scenes2.js', 'app.js'].map(r).join('\n');
const shell = r('shell.html');
const fill = (t) => t.replace('/*__CSS__*/', () => css).replace('/*__JS__*/', () => js);
const page = fill(shell);
const cut = shell.indexOf('<svg'); // le gabarit lui-même : en-tête avant, corps après
const headPart = fill(shell.slice(0, cut)).trim(), bodyPart = fill(shell.slice(cut)).trim();
const out = (name, html) => { fs.writeFileSync(new URL('./dist/' + name, import.meta.url), html); console.log('dist/' + name, (html.length / 1024).toFixed(1) + ' Ko'); };

// 1) fragment publié comme artifact (l'hôte ajoute le squelette du document)
out('notes-envolees.html', page);

// 2) document autonome : la page publiée sur GitHub Pages (index.html), qu'on peut aussi ouvrir telle quelle
const icon = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#F6C744"/><path d="M27 15v25.5a8 8 0 1 0 5 7.4V24l12 4v-9z" fill="#1D2350"/></svg>')}`;
const doc = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#F6C744">
<link rel="icon" href="${icon}">
${headPart}
</head>
<body>
${bodyPart}
</body>
</html>
`;
fs.writeFileSync(new URL('./index.html', import.meta.url), doc);
console.log('index.html', (doc.length / 1024).toFixed(1) + ' Ko');
