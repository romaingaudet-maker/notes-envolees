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
const js = ['songs.js', 'audio.js', 'voix-modeles.js', 'ear.js', 'rythme.js', 'scenes.js', 'scenes2.js', 'suivi.js', 'instruments.js', 'app.js'].map(r).join('\n');
const shell = r('shell.html');
const fill = (t, c = css, j = js) => t.replace('/*__CSS__*/', () => c).replace('/*__JS__*/', () => j);
const page = fill(shell);
const cut = shell.indexOf('<svg'); // le gabarit lui-même : en-tête avant, corps après
const headPart = fill(shell.slice(0, cut)).trim(), bodyPart = fill(shell.slice(cut)).trim();
fs.mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
const out = (name, html) => { if (QUALIF) return; fs.writeFileSync(new URL('./dist/' + name, import.meta.url), html); console.log('dist/' + name, (html.length / 1024).toFixed(1) + ' Ko'); };

// 1) fragment publié comme artifact (l'hôte ajoute le squelette du document)
out('notes-envolees.html', page);

// 2) document autonome : la page publiée sur GitHub Pages (index.html), qu'on peut aussi ouvrir telle quelle
const iconOf = (bg, ink) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="${bg}"/><path d="M27 15v25.5a8 8 0 1 0 5 7.4V24l12 4v-9z" fill="${ink}"/></svg>`)}`;
const icon = iconOf('#F6C744', '#1D2350');
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
const INSTALL_V1 = `<link rel="apple-touch-icon" href="icone-180.png">\n<link rel="manifest" href="manifest.webmanifest">\n<meta name="apple-mobile-web-app-title" content="${QUALIF ? 'Qualif Notes' : 'Notes Envolées'}">`;
const INSTALL_V2 = `<link rel="apple-touch-icon" href="../icone-180.png">\n<link rel="manifest" href="manifest.webmanifest">\n<meta name="apple-mobile-web-app-title" content="${QUALIF ? 'Qualif laine' : 'Notes en laine'}">`;
const index = doc(headPart, bodyPart, '#F6C744', icon, INSTALL_V1);
write('index.html', index);

// 3) la page de suivi des élèves, pour le professeur (suivi.html, non liée depuis le jeu)
const pShell = r('suivi-page.html');
const pCss = font('Gluten', 700, 'gluten-latin-700-normal.woff2') + '\n' + r('_suivi.css');
const pJs = ['songs.js', 'suivi.js', 'suivi-page.js'].map(r).join('\n');
const pCut = pShell.indexOf('<div id="app"');
// en qualification, le jeu n'envoie rien, mais la page de suivi lit les vrais résultats (Worker de production)
const pExtra = QUALIF && PROD_SUIVI ? `<script>window.NE_SUIVI_LECTURE = ${JSON.stringify(PROD_SUIVI)};</script>` : '';
const prof = doc(fill(pShell.slice(0, pCut), pCss, pJs).trim(), fill(pShell.slice(pCut), pCss, pJs).trim(), '#F6C744', icon, pExtra);
write('suivi.html', prof);

// 4) mentions légales et confidentialité (mentions-legales.html, liée depuis l'accueil des deux versions)
{
  const mShell = r('mentions.html');
  const mCss = fontsCss.split('\n')[0] + '\n' + [font('Gluten', 800, 'gluten-latin-800-normal.woff2'), font('Andika', 400, 'andika-latin-400-normal.woff2'), font('Andika', 700, 'andika-latin-700-normal.woff2')].join('\n');
  const mJs = ['suivi.js', 'mentions.js'].map(r).join('\n');
  const mCut = mShell.indexOf('<header');
  const legal = doc(fill(mShell.slice(0, mCut), mCss, mJs).trim(), fill(mShell.slice(mCut), mCss, mJs).trim(), '#F6C744');
  write('mentions-legales.html', legal);
}

/* 5) seconde version : décors en laine, en 3D image par image.
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
  const ONLINE = 'https://romaingaudet-maker.github.io/notes-envolees/laine/';
  const lfill = (t, pre) => t.replace('/*__CSS__*/', () => css2).replace('/*__PRE__*/', () => pre).replace('/*__THREE__*/', () => three).replace('/*__JS__*/', () => js2);
  // a) fragment publié comme artifact : les sons sont à côté (sons/)
  out('laine.html', lfill(lshell, `window.NE_ONLINE_URL = ${JSON.stringify(ONLINE)};`));
  // b) document autonome, publié sur GitHub Pages dans laine/ : les sons et les mentions légales sont dans le dossier parent
  const pre = `window.NE_ONLINE_URL = ${JSON.stringify(ONLINE)}; window.SONS_BASE = '../sons/'; window.NE_LEGAL_URL = '../mentions-legales.html';`;
  const lcut = lshell.indexOf('<svg');
  const ldoc = doc(lfill(lshell.slice(0, lcut), pre).trim(), lfill(lshell.slice(lcut), pre).trim(), '#2B2350', iconOf('#2B2350', '#F2C14E'), INSTALL_V2);
  write('laine/index.html', ldoc);
}

/* 6) manifestes d'installation : nom, nom court et icônes pour l'écran d'accueil du téléphone.
   La version papier est à la racine, la version en laine dans laine/ (icônes dans le dossier parent). */
{
  const manifest = (name, short, theme, bg, prefix) => JSON.stringify({
    name, short_name: short, lang: 'fr', start_url: './', scope: './', display: 'standalone',
    background_color: bg, theme_color: theme,
    icons: [192, 512].map((n) => ({ src: `${prefix}icone-${n}.png`, sizes: `${n}x${n}`, type: 'image/png' })),
  }, null, 2) + '\n';
  const q = QUALIF ? ' (qualification)' : '';
  write('manifest.webmanifest', manifest('Les Notes Envolées' + q, QUALIF ? 'Qualif Notes' : 'Notes Envolées', '#F6C744', '#FFFBF0', ''));
  write('laine/manifest.webmanifest', manifest('Les Notes Envolées en laine' + q, QUALIF ? 'Qualif laine' : 'Notes en laine', '#2B2350', '#2B2350', '../'));
}

// 7) qualification : les sons et les icônes à côté des pages
if (QUALIF) {
  fs.cpSync(new URL('./sons/', import.meta.url), new URL(ROOT + 'sons/', import.meta.url), { recursive: true });
  if (fs.existsSync(new URL('./laine/portraits/', import.meta.url))) fs.cpSync(new URL('./laine/portraits/', import.meta.url), new URL(ROOT + 'laine/portraits/', import.meta.url), { recursive: true });
  for (const n of [180, 192, 512]) fs.copyFileSync(new URL(`./icone-${n}.png`, import.meta.url), new URL(ROOT + `icone-${n}.png`, import.meta.url));
  console.log('_qualif/sons/ + portraits + icônes');
}
